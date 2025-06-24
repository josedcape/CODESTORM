import { FileItem, ChatMessage } from '../types';
import { generateUniqueId } from '../utils/idGenerator';
import { CodeModifierAgent } from '../agents/CodeModifierAgent';
import { getEffectiveAgentConfig } from '../config/claudeModels';
import { EnhancedAPIService } from './EnhancedAPIService';

/**
 * Interfaz para el resultado de detección de archivos
 */
export interface FileDetectionResult {
  targetFiles: FileItem[];
  analysisReason: string;
  confidence: number;
  suggestedChanges: string[];
}

/**
 * Interfaz para el resultado de modificación automática
 */
export interface AutomaticModificationResult {
  success: boolean;
  modifiedFiles: FileItem[];
  originalFiles: FileItem[];
  changes: FileChangeDetail[];
  analysisLog: string[];
  error?: string;
}

/**
 * Interfaz para detalles de cambios en archivos
 */
export interface FileChangeDetail {
  filePath: string;
  changeType: 'modified' | 'created' | 'deleted';
  description: string;
  linesChanged: number;
  specificChanges: string[];
}

/**
 * Servicio para modificación automática de archivos usando IA
 */
export class AutomaticFileModificationService {
  private static instance: AutomaticFileModificationService;
  private apiService: EnhancedAPIService;

  private constructor() {
    this.apiService = EnhancedAPIService.getInstance();
  }

  public static getInstance(): AutomaticFileModificationService {
    if (!AutomaticFileModificationService.instance) {
      AutomaticFileModificationService.instance = new AutomaticFileModificationService();
    }
    return AutomaticFileModificationService.instance;
  }

  /**
   * Analiza la instrucción del usuario y detecta automáticamente qué archivos necesitan modificación
   */
  public async detectTargetFiles(
    instruction: string,
    projectFiles: FileItem[],
    projectContext?: string
  ): Promise<FileDetectionResult> {
    try {
      console.log('🔍 Analizando instrucción para detectar archivos objetivo:', instruction);

      const agentConfig = getEffectiveAgentConfig('FileAnalysisAgent');
      
      const systemPrompt = `Eres un experto en análisis de código que puede identificar automáticamente qué archivos necesitan modificación basándose en instrucciones del usuario.

TAREA: Analizar la instrucción del usuario y determinar qué archivos del proyecto necesitan ser modificados.

ARCHIVOS DISPONIBLES:
${projectFiles.map(f => `- ${f.path} (${f.language || 'unknown'}) - ${f.content.length} caracteres`).join('\n')}

CONTEXTO DEL PROYECTO:
${projectContext || 'Proyecto web general'}

INSTRUCCIONES:
1. Analiza la instrucción del usuario cuidadosamente
2. Identifica qué archivos necesitan modificación basándote en:
   - Tipo de cambio solicitado (CSS, HTML, JS, etc.)
   - Ubicación probable del código a modificar
   - Dependencias entre archivos
3. Proporciona una explicación clara de por qué cada archivo fue seleccionado
4. Sugiere los cambios específicos que se realizarán

FORMATO DE RESPUESTA:
\`\`\`json
{
  "targetFiles": ["path1", "path2"],
  "analysisReason": "Explicación detallada del análisis",
  "confidence": 0.95,
  "suggestedChanges": [
    "Cambio específico 1",
    "Cambio específico 2"
  ]
}
\`\`\``;

      const userPrompt = `Instrucción del usuario: "${instruction}"

Analiza esta instrucción y determina qué archivos del proyecto necesitan modificación. Sé específico y preciso en tu análisis.`;

      const response = await this.apiService.sendMessage(userPrompt, {
        agentName: 'FileAnalysisAgent',
        maxTokens: agentConfig.maxTokens,
        temperature: 0.3, // Baja temperatura para análisis preciso
        systemPrompt: systemPrompt
      });

      const analysisResult = this.parseDetectionResponse(response.data || '', projectFiles);
      
      console.log('✅ Detección de archivos completada:', {
        targetFiles: analysisResult.targetFiles.length,
        confidence: analysisResult.confidence
      });

      return analysisResult;

    } catch (error) {
      console.error('❌ Error en detección de archivos:', error);
      return {
        targetFiles: [],
        analysisReason: `Error en el análisis: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        confidence: 0,
        suggestedChanges: []
      };
    }
  }

  /**
   * Aplica modificaciones automáticas a los archivos detectados
   */
  public async applyAutomaticModifications(
    instruction: string,
    targetFiles: FileItem[],
    allFiles: FileItem[]
  ): Promise<AutomaticModificationResult> {
    try {
      console.log('🔧 Iniciando modificaciones automáticas en', targetFiles.length, 'archivos');

      const modifiedFiles: FileItem[] = [];
      const originalFiles: FileItem[] = [];
      const changes: FileChangeDetail[] = [];
      const analysisLog: string[] = [];

      analysisLog.push(`Iniciando modificación automática: ${instruction}`);
      analysisLog.push(`Archivos objetivo: ${targetFiles.map(f => f.path).join(', ')}`);

      // Procesar cada archivo objetivo
      for (const file of targetFiles) {
        try {
          analysisLog.push(`Procesando archivo: ${file.path}`);
          
          // Crear contexto específico para este archivo
          const fileContext = this.buildFileContext(file, allFiles, instruction);
          
          // Usar CodeModifierAgent para modificar el archivo
          const task = {
            id: generateUniqueId('auto-modification'),
            type: 'codeModifier' as const,
            instruction: `${instruction}\n\nContexto: ${fileContext}`,
            status: 'working' as const,
            startTime: Date.now()
          };

          const modificationResult = await CodeModifierAgent.execute(task, file);

          if (modificationResult.success && modificationResult.data) {
            const modifiedFile = modificationResult.data.modifiedFile;
            const fileChanges = modificationResult.data.changes || [];

            originalFiles.push(file);
            modifiedFiles.push(modifiedFile);

            // Analizar los cambios realizados
            const changeDetail: FileChangeDetail = {
              filePath: file.path,
              changeType: 'modified',
              description: `Archivo modificado según instrucción: ${instruction}`,
              linesChanged: this.countChangedLines(file.content, modifiedFile.content),
              specificChanges: fileChanges
            };

            changes.push(changeDetail);
            analysisLog.push(`✅ ${file.path} modificado exitosamente - ${changeDetail.linesChanged} líneas cambiadas`);

          } else {
            analysisLog.push(`❌ Error al modificar ${file.path}: ${modificationResult.error}`);
          }

        } catch (error) {
          analysisLog.push(`❌ Error procesando ${file.path}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }

      const success = modifiedFiles.length > 0;
      
      console.log('🎉 Modificaciones automáticas completadas:', {
        success,
        filesModified: modifiedFiles.length,
        totalChanges: changes.length
      });

      return {
        success,
        modifiedFiles,
        originalFiles,
        changes,
        analysisLog,
        error: success ? undefined : 'No se pudieron modificar los archivos'
      };

    } catch (error) {
      console.error('❌ Error en modificaciones automáticas:', error);
      return {
        success: false,
        modifiedFiles: [],
        originalFiles: [],
        changes: [],
        analysisLog: [`Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`],
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Proceso completo: detecta archivos y aplica modificaciones automáticamente
   */
  public async processAutomaticModification(
    instruction: string,
    projectFiles: FileItem[],
    projectContext?: string
  ): Promise<AutomaticModificationResult & { detectionResult: FileDetectionResult }> {
    try {
      console.log('🚀 Iniciando proceso completo de modificación automática');

      // Paso 1: Detectar archivos objetivo
      const detectionResult = await this.detectTargetFiles(instruction, projectFiles, projectContext);

      if (detectionResult.targetFiles.length === 0) {
        return {
          success: false,
          modifiedFiles: [],
          originalFiles: [],
          changes: [],
          analysisLog: ['No se detectaron archivos objetivo para la modificación'],
          error: 'No se encontraron archivos relevantes para modificar',
          detectionResult
        };
      }

      // Paso 2: Aplicar modificaciones
      const modificationResult = await this.applyAutomaticModifications(
        instruction,
        detectionResult.targetFiles,
        projectFiles
      );

      return {
        ...modificationResult,
        detectionResult
      };

    } catch (error) {
      console.error('❌ Error en proceso completo:', error);
      return {
        success: false,
        modifiedFiles: [],
        originalFiles: [],
        changes: [],
        analysisLog: [`Error en proceso completo: ${error instanceof Error ? error.message : 'Error desconocido'}`],
        error: error instanceof Error ? error.message : 'Error desconocido',
        detectionResult: {
          targetFiles: [],
          analysisReason: 'Error en detección',
          confidence: 0,
          suggestedChanges: []
        }
      };
    }
  }

  /**
   * Parsea la respuesta de detección de archivos
   */
  private parseDetectionResponse(response: string, projectFiles: FileItem[]): FileDetectionResult {
    try {
      // Extraer JSON de la respuesta
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        throw new Error('No se encontró JSON válido en la respuesta');
      }

      const parsed = JSON.parse(jsonMatch[1]);
      
      // Validar y mapear archivos
      const targetFiles = (parsed.targetFiles || [])
        .map((path: string) => projectFiles.find(f => f.path === path))
        .filter((file: FileItem | undefined): file is FileItem => file !== undefined);

      return {
        targetFiles,
        analysisReason: parsed.analysisReason || 'Análisis automático',
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
        suggestedChanges: parsed.suggestedChanges || []
      };

    } catch (error) {
      console.error('Error parseando respuesta de detección:', error);
      
      // Fallback: análisis básico por extensión de archivo
      return this.fallbackFileDetection(response, projectFiles);
    }
  }

  /**
   * Detección de archivos de respaldo basada en patrones simples
   */
  private fallbackFileDetection(instruction: string, projectFiles: FileItem[]): FileDetectionResult {
    const lowerInstruction = instruction.toLowerCase();
    const targetFiles: FileItem[] = [];

    // Patrones básicos de detección
    if (lowerInstruction.includes('color') || lowerInstruction.includes('estilo') || lowerInstruction.includes('css')) {
      targetFiles.push(...projectFiles.filter(f => f.path.endsWith('.css') || f.path.includes('style')));
    }
    
    if (lowerInstruction.includes('html') || lowerInstruction.includes('estructura') || lowerInstruction.includes('elemento')) {
      targetFiles.push(...projectFiles.filter(f => f.path.endsWith('.html') || f.path.endsWith('.jsx') || f.path.endsWith('.tsx')));
    }
    
    if (lowerInstruction.includes('javascript') || lowerInstruction.includes('función') || lowerInstruction.includes('lógica')) {
      targetFiles.push(...projectFiles.filter(f => f.path.endsWith('.js') || f.path.endsWith('.ts')));
    }

    return {
      targetFiles: [...new Set(targetFiles)], // Eliminar duplicados
      analysisReason: 'Detección de respaldo basada en patrones de palabras clave',
      confidence: 0.6,
      suggestedChanges: ['Modificación basada en análisis de patrones']
    };
  }

  /**
   * Construye contexto específico para un archivo
   */
  private buildFileContext(targetFile: FileItem, allFiles: FileItem[], instruction: string): string {
    const relatedFiles = allFiles.filter(f => 
      f.path !== targetFile.path && 
      (f.path.includes(targetFile.path.split('/').slice(0, -1).join('/')) || 
       targetFile.content.includes(f.name))
    );

    return `
Archivo objetivo: ${targetFile.path}
Tipo: ${targetFile.language || 'unknown'}
Tamaño: ${targetFile.content.length} caracteres

Archivos relacionados: ${relatedFiles.map(f => f.path).join(', ')}

Instrucción específica: ${instruction}

Contexto: Modifica este archivo específicamente para cumplir con la instrucción, manteniendo la coherencia con el resto del proyecto.
    `.trim();
  }

  /**
   * Cuenta las líneas que cambiaron entre dos versiones de un archivo
   */
  private countChangedLines(originalContent: string, modifiedContent: string): number {
    const originalLines = originalContent.split('\n');
    const modifiedLines = modifiedContent.split('\n');
    
    let changes = 0;
    const maxLines = Math.max(originalLines.length, modifiedLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || '';
      const modifiedLine = modifiedLines[i] || '';
      
      if (originalLine !== modifiedLine) {
        changes++;
      }
    }
    
    return changes;
  }
}
