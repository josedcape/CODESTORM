import { 
  AgentResult, 
  AgentTask, 
  HistoryEvent, 
  HistoryEventType, 
  ProjectHistory, 
  SeguimientoResult, 
  StageDocumentation,
  ApprovalStage,
  FileItem,
  ChatMessage,
  AgentType
} from '../types';
import { processInstruction } from '../services/ai';

/**
 * AgenteSeguimiento - Agente encargado de documentar y dar seguimiento al proceso de desarrollo
 * 
 * Este agente cumple las siguientes funciones:
 * 1. Documentar cada etapa del proceso de desarrollo
 * 2. Capturar cambios realizados durante cada etapa
 * 3. Transferir información entre etapas
 * 4. Integrar con el sistema de chat
 * 5. Permitir modificaciones a través del chat
 * 6. Mantener un registro visual del progreso
 */
export class AgenteSeguimiento {
  /**
   * Ejecuta una tarea del agente de seguimiento
   */
  public static async execute(
    task: AgentTask,
    options: {
      currentStage?: ApprovalStage;
      previousStage?: ApprovalStage;
      projectHistory?: ProjectHistory;
      files?: FileItem[];
      userMessage?: string;
    } = {}
  ): Promise<SeguimientoResult> {
    try {
      const { currentStage, previousStage, projectHistory, files, userMessage } = options;
      
      // Determinar qué acción realizar según la instrucción
      if (task.instruction.includes('documentar_etapa')) {
        return await this.documentarEtapa(task, currentStage, projectHistory, files);
      } else if (task.instruction.includes('registrar_evento')) {
        const eventType = this.extractEventType(task.instruction);
        return await this.registrarEvento(task, eventType, currentStage, projectHistory, files);
      } else if (task.instruction.includes('procesar_mensaje_usuario')) {
        return await this.procesarMensajeUsuario(task, userMessage, currentStage, projectHistory);
      } else if (task.instruction.includes('transferir_informacion')) {
        return await this.transferirInformacion(task, currentStage, previousStage, projectHistory);
      } else if (task.instruction.includes('generar_resumen')) {
        return await this.generarResumen(task, projectHistory);
      } else {
        // Instrucción genérica
        return await this.procesarInstruccion(task, currentStage, projectHistory, files);
      }
    } catch (error) {
      console.error('Error en AgenteSeguimiento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en el agente de seguimiento'
      };
    }
  }

  /**
   * Documenta una etapa del proceso de desarrollo
   */
  private static async documentarEtapa(
    task: AgentTask,
    currentStage?: ApprovalStage,
    projectHistory?: ProjectHistory,
    files?: FileItem[]
  ): Promise<SeguimientoResult> {
    if (!currentStage) {
      return {
        success: false,
        error: 'No se proporcionó una etapa para documentar'
      };
    }

    try {
      // Construir el prompt para el modelo de IA
      const prompt = this.buildDocumentationPrompt(currentStage, projectHistory, files);
      
      // Procesar la instrucción con el modelo de IA
      const response = await processInstruction(prompt, 'Claude 3.5 Sonnet V2');
      
      // Analizar la respuesta para extraer la documentación
      const stageDocumentation = this.parseDocumentationResponse(response.content, currentStage);
      
      // Crear evento de inicio de etapa
      const event: HistoryEvent = {
        id: `event-${Date.now()}`,
        type: 'stage-start',
        title: `Inicio de etapa: ${currentStage.title}`,
        description: `Se ha iniciado la etapa "${currentStage.title}" (${currentStage.type})`,
        timestamp: Date.now(),
        stageId: currentStage.id,
        stageType: currentStage.type,
        importance: 'high'
      };
      
      return {
        success: true,
        data: {
          event,
          stageDocumentation
        },
        metadata: {
          model: response.model,
          executionTime: response.executionTime
        }
      };
    } catch (error) {
      console.error('Error al documentar etapa:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al documentar etapa'
      };
    }
  }

  /**
   * Registra un evento en la historia del proyecto
   */
  private static async registrarEvento(
    task: AgentTask,
    eventType: HistoryEventType,
    currentStage?: ApprovalStage,
    projectHistory?: ProjectHistory,
    files?: FileItem[]
  ): Promise<SeguimientoResult> {
    try {
      // Extraer información del evento de la instrucción
      const eventInfo = this.extractEventInfo(task.instruction);
      
      // Crear el evento
      const event: HistoryEvent = {
        id: `event-${Date.now()}`,
        type: eventType,
        title: eventInfo.title || `Evento: ${eventType}`,
        description: eventInfo.description || 'Sin descripción',
        timestamp: Date.now(),
        stageId: currentStage?.id,
        stageType: currentStage?.type,
        relatedFiles: eventInfo.relatedFiles,
        codeSnippet: eventInfo.codeSnippet,
        language: eventInfo.language,
        metadata: eventInfo.metadata,
        importance: eventInfo.importance || 'medium'
      };
      
      return {
        success: true,
        data: {
          event
        }
      };
    } catch (error) {
      console.error('Error al registrar evento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al registrar evento'
      };
    }
  }

  /**
   * Procesa un mensaje del usuario
   */
  private static async procesarMensajeUsuario(
    task: AgentTask,
    userMessage?: string,
    currentStage?: ApprovalStage,
    projectHistory?: ProjectHistory
  ): Promise<SeguimientoResult> {
    if (!userMessage) {
      return {
        success: false,
        error: 'No se proporcionó un mensaje de usuario para procesar'
      };
    }

    try {
      // Construir el prompt para el modelo de IA
      const prompt = this.buildUserMessagePrompt(userMessage, currentStage, projectHistory);
      
      // Procesar la instrucción con el modelo de IA
      const response = await processInstruction(prompt, 'Claude 3.5 Sonnet V2');
      
      // Crear evento de feedback del usuario
      const event: HistoryEvent = {
        id: `event-feedback-${Date.now()}`,
        type: 'user-feedback',
        title: 'Feedback del usuario',
        description: userMessage,
        timestamp: Date.now(),
        stageId: currentStage?.id,
        stageType: currentStage?.type,
        importance: 'medium'
      };
      
      return {
        success: true,
        data: {
          event
        },
        metadata: {
          model: response.model,
          executionTime: response.executionTime,
          response: response.content
        }
      };
    } catch (error) {
      console.error('Error al procesar mensaje del usuario:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al procesar mensaje'
      };
    }
  }

  /**
   * Transfiere información entre etapas
   */
  private static async transferirInformacion(
    task: AgentTask,
    currentStage?: ApprovalStage,
    previousStage?: ApprovalStage,
    projectHistory?: ProjectHistory
  ): Promise<SeguimientoResult> {
    if (!currentStage || !previousStage) {
      return {
        success: false,
        error: 'No se proporcionaron las etapas necesarias para transferir información'
      };
    }

    try {
      // Construir el prompt para el modelo de IA
      const prompt = this.buildTransferPrompt(currentStage, previousStage, projectHistory);
      
      // Procesar la instrucción con el modelo de IA
      const response = await processInstruction(prompt, 'Claude 3.5 Sonnet V2');
      
      // Crear evento de transferencia de información
      const event: HistoryEvent = {
        id: `event-transfer-${Date.now()}`,
        type: 'milestone',
        title: 'Transferencia de información entre etapas',
        description: `Se ha transferido información de la etapa "${previousStage.title}" a "${currentStage.title}"`,
        timestamp: Date.now(),
        stageId: currentStage.id,
        stageType: currentStage.type,
        importance: 'medium',
        metadata: {
          fromStageId: previousStage.id,
          fromStageType: previousStage.type
        }
      };
      
      return {
        success: true,
        data: {
          event
        },
        metadata: {
          model: response.model,
          executionTime: response.executionTime,
          transferSummary: response.content
        }
      };
    } catch (error) {
      console.error('Error al transferir información:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al transferir información'
      };
    }
  }

  /**
   * Genera un resumen del proyecto
   */
  private static async generarResumen(
    task: AgentTask,
    projectHistory?: ProjectHistory
  ): Promise<SeguimientoResult> {
    if (!projectHistory) {
      return {
        success: false,
        error: 'No se proporcionó el historial del proyecto para generar el resumen'
      };
    }

    try {
      // Construir el prompt para el modelo de IA
      const prompt = this.buildSummaryPrompt(projectHistory);
      
      // Procesar la instrucción con el modelo de IA
      const response = await processInstruction(prompt, 'Claude 3.5 Sonnet V2');
      
      // Crear evento de resumen
      const event: HistoryEvent = {
        id: `event-summary-${Date.now()}`,
        type: 'milestone',
        title: 'Resumen del proyecto',
        description: response.content.substring(0, 200) + '...',
        timestamp: Date.now(),
        importance: 'high'
      };
      
      return {
        success: true,
        data: {
          event
        },
        metadata: {
          model: response.model,
          executionTime: response.executionTime,
          summary: response.content
        }
      };
    } catch (error) {
      console.error('Error al generar resumen:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al generar resumen'
      };
    }
  }

  /**
   * Procesa una instrucción genérica
   */
  private static async procesarInstruccion(
    task: AgentTask,
    currentStage?: ApprovalStage,
    projectHistory?: ProjectHistory,
    files?: FileItem[]
  ): Promise<SeguimientoResult> {
    try {
      // Construir el prompt para el modelo de IA
      const prompt = `
        Eres el Agente de Seguimiento de CODESTORM, encargado de documentar y dar seguimiento al proceso de desarrollo.
        
        Instrucción: ${task.instruction}
        
        Etapa actual: ${currentStage ? JSON.stringify(currentStage, null, 2) : 'No hay etapa actual'}
        
        Historial del proyecto: ${projectHistory ? JSON.stringify({
          projectId: projectHistory.projectId,
          name: projectHistory.name,
          description: projectHistory.description,
          startTime: projectHistory.startTime,
          lastUpdated: projectHistory.lastUpdated,
          stagesCount: projectHistory.stages.length,
          eventsCount: projectHistory.events.length,
          milestonesCount: projectHistory.milestones.length
        }, null, 2) : 'No hay historial del proyecto'}
        
        Archivos: ${files ? files.map(f => f.path).join(', ') : 'No hay archivos'}
        
        Por favor, procesa esta instrucción y proporciona una respuesta detallada.
      `;
      
      // Procesar la instrucción con el modelo de IA
      const response = await processInstruction(prompt, 'Claude 3.5 Sonnet V2');
      
      return {
        success: true,
        data: {
          event: {
            id: `event-${Date.now()}`,
            type: 'milestone',
            title: 'Instrucción procesada',
            description: response.content.substring(0, 200) + '...',
            timestamp: Date.now(),
            stageId: currentStage?.id,
            stageType: currentStage?.type,
            importance: 'medium'
          }
        },
        metadata: {
          model: response.model,
          executionTime: response.executionTime,
          response: response.content
        }
      };
    } catch (error) {
      console.error('Error al procesar instrucción:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al procesar instrucción'
      };
    }
  }

  // Métodos auxiliares
  private static extractEventType(instruction: string): HistoryEventType {
    if (instruction.includes('code-generated')) return 'code-generated';
    if (instruction.includes('file-created')) return 'file-created';
    if (instruction.includes('file-modified')) return 'file-modified';
    if (instruction.includes('decision-made')) return 'decision-made';
    if (instruction.includes('user-feedback')) return 'user-feedback';
    if (instruction.includes('error')) return 'error';
    if (instruction.includes('milestone')) return 'milestone';
    if (instruction.includes('stage-complete')) return 'stage-complete';
    return 'stage-start';
  }

  private static extractEventInfo(instruction: string): {
    title?: string;
    description?: string;
    relatedFiles?: string[];
    codeSnippet?: string;
    language?: string;
    metadata?: Record<string, any>;
    importance?: 'high' | 'medium' | 'low';
  } {
    // Implementación básica, en una versión real se extraería la información del texto
    return {
      title: instruction.split('title:')[1]?.split('\n')[0]?.trim(),
      description: instruction.split('description:')[1]?.split('\n')[0]?.trim(),
      importance: instruction.includes('importance:high') ? 'high' : 
                 instruction.includes('importance:low') ? 'low' : 'medium'
    };
  }

  private static buildDocumentationPrompt(
    stage: ApprovalStage,
    projectHistory?: ProjectHistory,
    files?: FileItem[]
  ): string {
    return `
      Eres el Agente de Seguimiento de CODESTORM, encargado de documentar y dar seguimiento al proceso de desarrollo.
      
      Necesito que documentes la siguiente etapa del proyecto:
      
      Etapa: ${JSON.stringify(stage, null, 2)}
      
      Historial del proyecto: ${projectHistory ? JSON.stringify({
        projectId: projectHistory.projectId,
        name: projectHistory.name,
        description: projectHistory.description,
        startTime: projectHistory.startTime,
        lastUpdated: projectHistory.lastUpdated,
        stagesCount: projectHistory.stages.length,
        eventsCount: projectHistory.events.length,
        milestonesCount: projectHistory.milestones.length
      }, null, 2) : 'No hay historial del proyecto'}
      
      Archivos: ${files ? files.map(f => f.path).join(', ') : 'No hay archivos'}
      
      Por favor, genera una documentación detallada de esta etapa, explicando:
      1. Qué se está haciendo en esta etapa
      2. Cómo se relaciona con las etapas anteriores
      3. Qué archivos se están modificando o creando
      4. Qué decisiones importantes se están tomando
      
      Proporciona la documentación en formato JSON con la siguiente estructura:
      {
        "title": "Título descriptivo de la etapa",
        "description": "Descripción detallada de lo que ocurre en esta etapa",
        "keyPoints": ["Punto clave 1", "Punto clave 2", ...],
        "technicalDetails": "Detalles técnicos relevantes",
        "nextSteps": "Qué se espera que ocurra después de esta etapa"
      }
    `;
  }

  private static parseDocumentationResponse(content: string, stage: ApprovalStage): StageDocumentation {
    // Extraer el JSON de la respuesta
    let documentation;
    try {
      // Intentar extraer JSON
      const jsonMatch = content.match(/{[\s\S]*}/);
      if (jsonMatch) {
        documentation = JSON.parse(jsonMatch[0]);
      } else {
        // Si no hay JSON, usar el contenido como descripción
        documentation = {
          title: `Documentación de etapa: ${stage.title}`,
          description: content,
          keyPoints: [],
          technicalDetails: '',
          nextSteps: ''
        };
      }
    } catch (error) {
      console.error('Error al parsear la documentación:', error);
      documentation = {
        title: `Documentación de etapa: ${stage.title}`,
        description: 'No se pudo generar la documentación correctamente',
        keyPoints: [],
        technicalDetails: '',
        nextSteps: ''
      };
    }
    
    // Crear la documentación de la etapa
    return {
      stageId: stage.id,
      stageType: stage.type,
      title: documentation.title || `Etapa: ${stage.title}`,
      description: documentation.description || stage.description,
      startTime: Date.now(),
      status: stage.status,
      events: [],
      decisions: [],
      files: []
    };
  }

  private static buildUserMessagePrompt(
    userMessage: string,
    currentStage?: ApprovalStage,
    projectHistory?: ProjectHistory
  ): string {
    return `
      Eres el Agente de Seguimiento de CODESTORM, encargado de documentar y dar seguimiento al proceso de desarrollo.
      
      El usuario ha enviado el siguiente mensaje:
      "${userMessage}"
      
      Etapa actual: ${currentStage ? JSON.stringify(currentStage, null, 2) : 'No hay etapa actual'}
      
      Por favor, analiza este mensaje y determina:
      1. Si contiene feedback sobre el proyecto
      2. Si solicita alguna modificación o ajuste
      3. Si requiere alguna acción específica
      
      Proporciona una respuesta detallada que pueda ser utilizada para actualizar el historial del proyecto.
    `;
  }

  private static buildTransferPrompt(
    currentStage: ApprovalStage,
    previousStage: ApprovalStage,
    projectHistory?: ProjectHistory
  ): string {
    return `
      Eres el Agente de Seguimiento de CODESTORM, encargado de documentar y dar seguimiento al proceso de desarrollo.
      
      Necesito que transfieras información relevante de una etapa a otra:
      
      Etapa anterior: ${JSON.stringify(previousStage, null, 2)}
      
      Etapa actual: ${JSON.stringify(currentStage, null, 2)}
      
      Por favor, genera un resumen de la información que debe transferirse de la etapa anterior a la actual,
      destacando los aspectos más importantes que deben tenerse en cuenta para mantener la continuidad del proyecto.
    `;
  }

  private static buildSummaryPrompt(projectHistory: ProjectHistory): string {
    return `
      Eres el Agente de Seguimiento de CODESTORM, encargado de documentar y dar seguimiento al proceso de desarrollo.
      
      Necesito que generes un resumen del proyecto actual:
      
      Proyecto: ${JSON.stringify({
        projectId: projectHistory.projectId,
        name: projectHistory.name,
        description: projectHistory.description,
        startTime: projectHistory.startTime,
        lastUpdated: projectHistory.lastUpdated,
        stagesCount: projectHistory.stages.length,
        eventsCount: projectHistory.events.length,
        milestonesCount: projectHistory.milestones.length
      }, null, 2)}
      
      Por favor, genera un resumen completo del proyecto, incluyendo:
      1. Descripción general
      2. Etapas completadas
      3. Hitos importantes
      4. Estado actual
      5. Próximos pasos
    `;
  }

  /**
   * Genera un mensaje de chat a partir de un evento
   */
  public static generateChatMessageFromEvent(event: HistoryEvent): ChatMessage {
    let messageType: 'text' | 'code' | 'notification' | 'proposal' = 'text';
    
    // Determinar el tipo de mensaje según el tipo de evento
    if (event.type === 'code-generated' || event.type === 'file-created' || event.type === 'file-modified') {
      messageType = 'code';
    } else if (event.type === 'stage-start' || event.type === 'stage-complete' || event.type === 'milestone') {
      messageType = 'notification';
    } else if (event.type === 'decision-made') {
      messageType = 'proposal';
    }
    
    // Crear el mensaje
    return {
      id: `msg-${event.id}`,
      sender: 'assistant',
      content: event.description,
      timestamp: event.timestamp,
      type: messageType,
      metadata: {
        language: event.language,
        stageId: event.stageId
      }
    };
  }

  /**
   * Genera un mensaje de chat a partir de una documentación de etapa
   */
  public static generateChatMessageFromStageDoc(stageDoc: StageDocumentation): ChatMessage {
    return {
      id: `msg-stage-${stageDoc.stageId}`,
      sender: 'assistant',
      content: `# ${stageDoc.title}\n\n${stageDoc.description}`,
      timestamp: stageDoc.startTime,
      type: 'notification',
      metadata: {
        stageId: stageDoc.stageId
      }
    };
  }
}
