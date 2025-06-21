import { FileItem, ChatMessage } from '../types';
import { generateUniqueId } from '../utils/idGenerator';
import { CodeGeneratorAgent } from '../agents/CodeGeneratorAgent';
import { CodeModifierAgent } from '../agents/CodeModifierAgent';
import { processInstruction } from './ai';

export interface ModificationRequest {
  id: string;
  type: 'modify' | 'create' | 'delete' | 'rename';
  instruction: string;
  targetFile?: string;
  newFileName?: string;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: ModificationResult;
}

export interface ModificationResult {
  success: boolean;
  files: FileItem[];
  changes: Array<{
    type: 'created' | 'modified' | 'deleted' | 'renamed';
    file: string;
    description: string;
  }>;
  message: string;
  error?: string;
}

export interface ModificationContext {
  projectFiles: FileItem[];
  projectDescription: string;
  recentChanges: ModificationRequest[];
}

export class InteractiveModificationService {
  private static instance: InteractiveModificationService;
  private modificationHistory: ModificationRequest[] = [];
  private listeners: Array<(request: ModificationRequest) => void> = [];

  static getInstance(): InteractiveModificationService {
    if (!this.instance) {
      this.instance = new InteractiveModificationService();
    }
    return this.instance;
  }

  /**
   * Procesa una instrucción de modificación del usuario
   * @param instruction Instrucción del usuario
   * @param context Contexto del proyecto
   * @returns Resultado de la modificación
   */
  async processModificationInstruction(
    instruction: string,
    context: ModificationContext
  ): Promise<ModificationResult> {
    console.log('[InteractiveModificationService] Procesando instrucción:', instruction);

    try {
      // Analizar la instrucción para determinar el tipo de modificación
      const analysisResult = await this.analyzeInstruction(instruction, context);

      // Crear solicitud de modificación
      const request: ModificationRequest = {
        id: generateUniqueId('mod'),
        type: analysisResult.type,
        instruction,
        targetFile: analysisResult.targetFile,
        newFileName: analysisResult.newFileName,
        timestamp: Date.now(),
        status: 'processing'
      };

      // Añadir a historial y notificar listeners
      this.modificationHistory.push(request);
      this.notifyListeners(request);

      // Ejecutar la modificación según el tipo
      let result: ModificationResult;

      switch (analysisResult.type) {
        case 'create':
          result = await this.createNewFile(instruction, analysisResult.newFileName!, context);
          break;
        case 'modify':
          result = await this.modifyExistingFile(instruction, analysisResult.targetFile!, context);
          break;
        case 'delete':
          result = await this.deleteFile(analysisResult.targetFile!, context);
          break;
        case 'rename':
          result = await this.renameFile(analysisResult.targetFile!, analysisResult.newFileName!, context);
          break;
        default:
          throw new Error(`Tipo de modificación no soportado: ${analysisResult.type}`);
      }

      // Actualizar solicitud con resultado
      request.status = result.success ? 'completed' : 'failed';
      request.result = result;
      this.notifyListeners(request);

      return result;

    } catch (error) {
      console.error('[InteractiveModificationService] Error:', error);
      return {
        success: false,
        files: [],
        changes: [],
        message: 'Error al procesar la modificación',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Analiza la instrucción para determinar qué tipo de modificación realizar
   * @param instruction Instrucción del usuario
   * @param context Contexto del proyecto
   * @returns Análisis de la instrucción
   */
  private async analyzeInstruction(
    instruction: string,
    context: ModificationContext
  ): Promise<{
    type: ModificationRequest['type'];
    targetFile?: string;
    newFileName?: string;
    confidence: number;
  }> {
    const prompt = `
Analiza la siguiente instrucción del usuario y determina qué tipo de modificación de archivo se solicita:

INSTRUCCIÓN: "${instruction}"

ARCHIVOS EXISTENTES:
${context.projectFiles.map(f => `- ${f.path}: ${f.name}`).join('\n')}

CONTEXTO DEL PROYECTO: ${context.projectDescription}

Responde con un JSON que contenga:
{
  "type": "create|modify|delete|rename",
  "targetFile": "ruta/del/archivo/objetivo (si aplica)",
  "newFileName": "nuevo/nombre/archivo (si aplica)",
  "confidence": 0.0-1.0,
  "reasoning": "explicación de la decisión"
}

REGLAS:
- "create": Para crear nuevos archivos
- "modify": Para modificar archivos existentes
- "delete": Para eliminar archivos
- "rename": Para renombrar archivos
- targetFile debe ser la ruta exacta de un archivo existente
- newFileName debe incluir la ruta completa para archivos nuevos
- confidence debe reflejar qué tan seguro estás de la interpretación

RESPONDE SOLO CON EL JSON:`;

    try {
      const response = await processInstruction(prompt, 'Claude 3.5 Sonnet V2');
      const analysis = JSON.parse(response.content);

      return {
        type: analysis.type,
        targetFile: analysis.targetFile,
        newFileName: analysis.newFileName,
        confidence: analysis.confidence || 0.5
      };
    } catch (error) {
      console.warn('[InteractiveModificationService] Error en análisis, usando heurísticas:', error);
      return this.analyzeInstructionWithHeuristics(instruction, context);
    }
  }

  /**
   * Analiza la instrucción usando heurísticas simples como fallback
   * @param instruction Instrucción del usuario
   * @param context Contexto del proyecto
   * @returns Análisis heurístico
   */
  private analyzeInstructionWithHeuristics(
    instruction: string,
    context: ModificationContext
  ): {
    type: ModificationRequest['type'];
    targetFile?: string;
    newFileName?: string;
    confidence: number;
  } {
    const lowerInstruction = instruction.toLowerCase();

    // Detectar creación de archivos
    if (lowerInstruction.includes('crear') || lowerInstruction.includes('nuevo') ||
        lowerInstruction.includes('añadir') || lowerInstruction.includes('create')) {

      // Intentar extraer nombre de archivo
      const fileMatch = instruction.match(/(\w+\.\w+)/);
      const newFileName = fileMatch ? fileMatch[1] : 'nuevo-archivo.html';

      return {
        type: 'create',
        newFileName,
        confidence: 0.7
      };
    }

    // Detectar modificación de archivos
    if (lowerInstruction.includes('modifica') || lowerInstruction.includes('cambia') ||
        lowerInstruction.includes('actualiza') || lowerInstruction.includes('modify')) {

      // Buscar archivo mencionado
      const targetFile = context.projectFiles.find(f =>
        lowerInstruction.includes(f.name.toLowerCase()) ||
        lowerInstruction.includes(f.path.toLowerCase())
      );

      return {
        type: 'modify',
        targetFile: targetFile?.path || context.projectFiles[0]?.path,
        confidence: targetFile ? 0.8 : 0.4
      };
    }

    // Detectar eliminación
    if (lowerInstruction.includes('elimina') || lowerInstruction.includes('borra') ||
        lowerInstruction.includes('delete')) {

      const targetFile = context.projectFiles.find(f =>
        lowerInstruction.includes(f.name.toLowerCase())
      );

      return {
        type: 'delete',
        targetFile: targetFile?.path,
        confidence: targetFile ? 0.8 : 0.3
      };
    }

    // Por defecto, asumir modificación del archivo principal
    return {
      type: 'modify',
      targetFile: context.projectFiles.find(f => f.path.includes('index.html'))?.path ||
                  context.projectFiles[0]?.path,
      confidence: 0.3
    };
  }

  /**
   * Crea un nuevo archivo
   * @param instruction Instrucción del usuario
   * @param fileName Nombre del archivo a crear
   * @param context Contexto del proyecto
   * @returns Resultado de la creación
   */
  private async createNewFile(
    instruction: string,
    fileName: string,
    context: ModificationContext
  ): Promise<ModificationResult> {
    try {
      console.log('[InteractiveModificationService] Creando archivo:', fileName);

      // Crear descripción del archivo basada en la instrucción
      const fileDescription = {
        path: fileName,
        description: `Archivo creado según instrucción: ${instruction}`,
        type: 'file',
        priority: 'medium'
      };

      // Usar CodeGeneratorAgent para generar el contenido
      const task = {
        id: generateUniqueId('task'),
        type: 'codeGenerator',
        instruction: `Crear archivo ${fileName} según la instrucción: ${instruction}`,
        status: 'working' as const,
        startTime: Date.now()
      };

      const result = await CodeGeneratorAgent.execute(task, fileDescription, context.projectDescription);

      if (!result.success || !result.data?.file) {
        throw new Error(result.error || 'No se pudo generar el archivo');
      }

      const newFile = result.data.file;
      const updatedFiles = [...context.projectFiles, newFile];

      return {
        success: true,
        files: updatedFiles,
        changes: [{
          type: 'created',
          file: fileName,
          description: `Archivo ${fileName} creado exitosamente`
        }],
        message: `Archivo ${fileName} creado exitosamente`
      };

    } catch (error) {
      console.error('[InteractiveModificationService] Error creando archivo:', error);
      return {
        success: false,
        files: context.projectFiles,
        changes: [],
        message: `Error al crear el archivo ${fileName}`,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Modifica un archivo existente
   * @param instruction Instrucción del usuario
   * @param filePath Ruta del archivo a modificar
   * @param context Contexto del proyecto
   * @returns Resultado de la modificación
   */
  private async modifyExistingFile(
    instruction: string,
    filePath: string,
    context: ModificationContext
  ): Promise<ModificationResult> {
    try {
      console.log('[InteractiveModificationService] Modificando archivo:', filePath);

      // Encontrar el archivo a modificar
      const targetFile = context.projectFiles.find(f => f.path === filePath);
      if (!targetFile) {
        throw new Error(`Archivo no encontrado: ${filePath}`);
      }

      // Usar CodeModifierAgent para modificar el archivo
      const task = {
        id: generateUniqueId('task'),
        type: 'codeModifier',
        instruction,
        status: 'working' as const,
        startTime: Date.now()
      };

      const result = await CodeModifierAgent.execute(task, targetFile);

      if (!result.success || !result.data?.modifiedFile) {
        throw new Error(result.error || 'No se pudo modificar el archivo');
      }

      const modifiedFile = result.data.modifiedFile;
      const updatedFiles = context.projectFiles.map(f =>
        f.path === filePath ? modifiedFile : f
      );

      return {
        success: true,
        files: updatedFiles,
        changes: [{
          type: 'modified',
          file: filePath,
          description: `Archivo ${filePath} modificado según instrucción`
        }],
        message: `Archivo ${filePath} modificado exitosamente`
      };

    } catch (error) {
      console.error('[InteractiveModificationService] Error modificando archivo:', error);
      return {
        success: false,
        files: context.projectFiles,
        changes: [],
        message: `Error al modificar el archivo ${filePath}`,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Elimina un archivo
   * @param filePath Ruta del archivo a eliminar
   * @param context Contexto del proyecto
   * @returns Resultado de la eliminación
   */
  private async deleteFile(
    filePath: string,
    context: ModificationContext
  ): Promise<ModificationResult> {
    try {
      console.log('[InteractiveModificationService] Eliminando archivo:', filePath);

      const targetFile = context.projectFiles.find(f => f.path === filePath);
      if (!targetFile) {
        throw new Error(`Archivo no encontrado: ${filePath}`);
      }

      const updatedFiles = context.projectFiles.filter(f => f.path !== filePath);

      return {
        success: true,
        files: updatedFiles,
        changes: [{
          type: 'deleted',
          file: filePath,
          description: `Archivo ${filePath} eliminado`
        }],
        message: `Archivo ${filePath} eliminado exitosamente`
      };

    } catch (error) {
      console.error('[InteractiveModificationService] Error eliminando archivo:', error);
      return {
        success: false,
        files: context.projectFiles,
        changes: [],
        message: `Error al eliminar el archivo ${filePath}`,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Renombra un archivo
   * @param oldPath Ruta actual del archivo
   * @param newPath Nueva ruta del archivo
   * @param context Contexto del proyecto
   * @returns Resultado del renombrado
   */
  private async renameFile(
    oldPath: string,
    newPath: string,
    context: ModificationContext
  ): Promise<ModificationResult> {
    try {
      console.log('[InteractiveModificationService] Renombrando archivo:', oldPath, '->', newPath);

      const targetFile = context.projectFiles.find(f => f.path === oldPath);
      if (!targetFile) {
        throw new Error(`Archivo no encontrado: ${oldPath}`);
      }

      const renamedFile: FileItem = {
        ...targetFile,
        path: newPath,
        name: newPath.split('/').pop() || newPath
      };

      const updatedFiles = context.projectFiles.map(f =>
        f.path === oldPath ? renamedFile : f
      );

      return {
        success: true,
        files: updatedFiles,
        changes: [{
          type: 'renamed',
          file: `${oldPath} -> ${newPath}`,
          description: `Archivo renombrado de ${oldPath} a ${newPath}`
        }],
        message: `Archivo renombrado exitosamente`
      };

    } catch (error) {
      console.error('[InteractiveModificationService] Error renombrando archivo:', error);
      return {
        success: false,
        files: context.projectFiles,
        changes: [],
        message: `Error al renombrar el archivo`,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Añade un listener para cambios de modificación
   * @param listener Función a llamar cuando hay cambios
   */
  addModificationListener(listener: (request: ModificationRequest) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remueve un listener
   * @param listener Función a remover
   */
  removeModificationListener(listener: (request: ModificationRequest) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notifica a todos los listeners sobre cambios
   * @param request Solicitud de modificación
   */
  private notifyListeners(request: ModificationRequest): void {
    this.listeners.forEach(listener => {
      try {
        listener(request);
      } catch (error) {
        console.error('[InteractiveModificationService] Error en listener:', error);
      }
    });
  }

  /**
   * Obtiene el historial de modificaciones
   * @returns Historial de modificaciones
   */
  getModificationHistory(): ModificationRequest[] {
    return [...this.modificationHistory];
  }

  /**
   * Limpia el historial de modificaciones
   */
  clearHistory(): void {
    this.modificationHistory = [];
  }
}
