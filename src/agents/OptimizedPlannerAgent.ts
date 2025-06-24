import { processInstruction } from '../services/ai';
import { generateUniqueId } from '../utils/helpers';
import { EnhancedAPIService } from '../services/EnhancedAPIService';
import { getDistributedAgentConfig } from '../config/claudeModels';

export interface PlannerResult {
  success: boolean;
  data?: {
    projectStructure: {
      name: string;
      description: string;
      type: string;
      technology: string;
      complexity: string;
      estimatedHours: string;
      files: Array<{
        path: string;
        description: string;
        type: string;
        priority: string;
        dependencies?: string[];
        size: string;
      }>;
    };
    implementationSteps: Array<{
      id: string;
      title: string;
      description: string;
      files: string[];
      estimatedTime: string;
      dependencies: string[];
      validation: string;
      priority: string;
    }>;
    architecture: {
      pattern: string;
      dataFlow: string;
      keyComponents: string[];
      integrations: string[];
    };
    qualityAssurance: {
      testingStrategy: string;
      performanceTargets: string;
      accessibilityLevel: string;
      browserSupport: string[];
    };
  };
  error?: string;
  metadata?: {
    model: string;
    executionTime: number;
    promptTokens?: number;
    responseTokens?: number;
  };
}

export interface AgentTask {
  id: string;
  type: string;
  instruction: string;
  status: 'pending' | 'working' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  plan?: any;
}

export class OptimizedPlannerAgent {
  private static readonly MAX_RETRIES = 3;
  private static readonly TIMEOUT_MS = 120000; // Aumentado a 2 minutos
  private static apiService = EnhancedAPIService.getInstance();

  /**
   * Ejecuta el agente de planificación optimizado
   * @param task La tarea asignada al agente
   * @returns Resultado del agente con el plan del proyecto
   */
  static async execute(task: AgentTask): Promise<PlannerResult> {
    const startTime = Date.now();
    console.log(`[OptimizedPlannerAgent] Iniciando ejecución para tarea: ${task.id}`);

    try {
      // Validar entrada
      if (!task.instruction || task.instruction.trim().length === 0) {
        throw new Error('La instrucción no puede estar vacía');
      }

      // Obtener configuración del agente
      const agentConfig = getDistributedAgentConfig('OptimizedPlannerAgent');
      console.log(`[OptimizedPlannerAgent] Usando ${agentConfig.provider} con modelo ${agentConfig.model.name}`);

      // Construir prompt optimizado
      const prompt = this.buildOptimizedPrompt(task.instruction);

      // Ejecutar con reintentos usando EnhancedAPIService
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
        try {
          console.log(`[OptimizedPlannerAgent] Intento ${attempt}/${this.MAX_RETRIES}`);

          // Usar EnhancedAPIService con configuración distribuida
          const response = await Promise.race([
            this.apiService.sendMessage(prompt, {
              agentName: 'OptimizedPlannerAgent',
              maxTokens: agentConfig.maxTokens,
              temperature: agentConfig.temperature,
              systemPrompt: 'Eres un arquitecto de software experto especializado en planificación de proyectos.'
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), this.TIMEOUT_MS)
            )
          ]) as any;

          // Validar respuesta
          if (!response || !response.success || !response.data) {
            throw new Error('Respuesta vacía del modelo de IA');
          }

          // Parsear y validar resultado
          const parsedData = this.parseAndValidateResponse(response.data);

          const executionTime = Date.now() - startTime;
          console.log(`[OptimizedPlannerAgent] Ejecución exitosa en ${executionTime}ms`);

          return {
            success: true,
            data: parsedData,
            metadata: {
              model: agentConfig.model.name,
              executionTime,
              provider: agentConfig.provider,
              fallbackUsed: response.fallbackUsed || false
            }
          };

        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Error desconocido');
          console.warn(`[OptimizedPlannerAgent] Intento ${attempt} falló:`, lastError.message);

          if (attempt < this.MAX_RETRIES) {
            // Esperar antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }

      // Si todos los intentos fallaron
      throw lastError || new Error('Todos los intentos fallaron');

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`[OptimizedPlannerAgent] Error después de ${executionTime}ms:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en el agente de planificación',
        metadata: {
          model: 'Claude 3.5 Sonnet V2',
          executionTime
        }
      };
    }
  }

  /**
   * Construye el prompt optimizado para el modelo de IA
   * @param instruction La instrucción del usuario
   * @returns Prompt formateado para el modelo de IA
   */
  private static buildOptimizedPrompt(instruction: string): string {
    return `Eres un arquitecto de software experto. Analiza esta solicitud y genera un plan de implementación:

SOLICITUD: ${instruction}

REGLAS:
- Enfoque web: incluir index.html y styles.css
- Respuesta en JSON válido únicamente
- Máximo 8 archivos por proyecto
- Descripciones concisas

FORMATO DE RESPUESTA (JSON):
{
  "projectStructure": {
    "name": "proyecto-web",
    "description": "Descripción breve del proyecto",
    "type": "web",
    "technology": "html-css-js",
    "complexity": "simple",
    "files": [
      {
        "path": "index.html",
        "description": "Página principal",
        "type": "file",
        "priority": "critical"
      },
      {
        "path": "styles.css",
        "description": "Estilos CSS",
        "type": "file",
        "priority": "high"
      }
    ]
  },
  "implementationSteps": [
    {
      "id": "step-1",
      "title": "Crear estructura HTML",
      "description": "Desarrollar la estructura base",
      "files": ["index.html"]
    }
  ]
}

RESPONDE SOLO CON JSON VÁLIDO:`;
  }

  /**
   * Parsea y valida la respuesta del modelo de IA
   * @param responseContent Contenido de la respuesta del modelo de IA
   * @returns Estructura del proyecto validada
   */
  private static parseAndValidateResponse(responseContent: string): PlannerResult['data'] {
    try {
      // Limpiar y extraer JSON
      let jsonContent = responseContent.trim();

      // Intentar extraer JSON de bloques de código
      const jsonMatch = jsonContent.match(/```json\s*([\s\S]*?)\s*```/) ||
                        jsonContent.match(/```\s*([\s\S]*?)\s*```/) ||
                        jsonContent.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        jsonContent = jsonMatch[1] || jsonMatch[0];
        jsonContent = jsonContent.replace(/```json|```/g, '').trim();
      }

      // Parsear JSON
      const parsedData = JSON.parse(jsonContent);

      // Validar estructura requerida
      this.validateProjectStructure(parsedData);

      // Enriquecer datos si es necesario
      return this.enrichProjectData(parsedData);

    } catch (error) {
      console.error('[OptimizedPlannerAgent] Error al parsear respuesta:', error);
      throw new Error(`Error al parsear la respuesta del modelo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Valida la estructura del proyecto
   * @param data Datos parseados del JSON
   */
  private static validateProjectStructure(data: any): void {
    if (!data.projectStructure) {
      throw new Error('Falta projectStructure en la respuesta');
    }

    if (!data.implementationSteps || !Array.isArray(data.implementationSteps)) {
      throw new Error('Falta implementationSteps o no es un array');
    }

    if (!data.projectStructure.files || !Array.isArray(data.projectStructure.files)) {
      throw new Error('Falta files en projectStructure o no es un array');
    }

    // Validar que tenga archivos web básicos
    const files = data.projectStructure.files;
    const hasHtml = files.some((f: any) => f.path && f.path.toLowerCase().includes('.html'));
    const hasCss = files.some((f: any) => f.path && f.path.toLowerCase().includes('.css'));

    if (!hasHtml || !hasCss) {
      console.warn('[OptimizedPlannerAgent] Faltan archivos web básicos, añadiendo...');
      // Añadir archivos web básicos si faltan
      if (!hasHtml) {
        files.unshift({
          path: 'index.html',
          description: 'Página principal HTML del proyecto',
          type: 'file',
          priority: 'critical',
          dependencies: [],
          size: 'medium'
        });
      }
      if (!hasCss) {
        files.push({
          path: 'styles.css',
          description: 'Archivo de estilos CSS del proyecto',
          type: 'file',
          priority: 'high',
          dependencies: ['index.html'],
          size: 'medium'
        });
      }
    }
  }

  /**
   * Enriquece los datos del proyecto con valores por defecto
   * @param data Datos del proyecto
   * @returns Datos enriquecidos
   */
  private static enrichProjectData(data: any): PlannerResult['data'] {
    // Asegurar valores por defecto
    if (!data.architecture) {
      data.architecture = {
        pattern: 'Modular',
        dataFlow: 'Unidirectional',
        keyComponents: ['UI', 'Logic', 'Data'],
        integrations: []
      };
    }

    if (!data.qualityAssurance) {
      data.qualityAssurance = {
        testingStrategy: 'Manual testing',
        performanceTargets: 'Fast loading, responsive design',
        accessibilityLevel: 'WCAG-AA',
        browserSupport: ['Chrome', 'Firefox', 'Safari', 'Edge']
      };
    }

    // Asegurar IDs únicos en los pasos
    data.implementationSteps = data.implementationSteps.map((step: any, index: number) => ({
      ...step,
      id: step.id || `step-${index + 1}`,
      dependencies: step.dependencies || [],
      validation: step.validation || 'Verificar que el paso se completó correctamente',
      priority: step.priority || 'medium'
    }));

    return data;
  }
}
