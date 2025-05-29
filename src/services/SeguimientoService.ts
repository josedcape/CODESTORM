import { 
  HistoryEvent, 
  ProjectHistory, 
  SeguimientoState, 
  ApprovalStage, 
  FileItem,
  ChatMessage,
  AgentTask,
  StageDocumentation
} from '../types';
import { AgenteSeguimiento } from '../agents/AgenteSeguimiento';

/**
 * Servicio para gestionar el Agente de Seguimiento
 */
export class SeguimientoService {
  private static instance: SeguimientoService;
  private state: SeguimientoState;
  private listeners: ((state: SeguimientoState) => void)[] = [];

  private constructor() {
    // Inicializar el estado
    this.state = {
      isActive: false,
      history: {
        projectId: `project-${Date.now()}`,
        name: 'Proyecto CODESTORM',
        description: 'Proyecto generado con CODESTORM',
        startTime: Date.now(),
        lastUpdated: Date.now(),
        stages: [],
        events: [],
        milestones: []
      },
      isDocumenting: false,
      pendingEvents: []
    };
  }

  /**
   * Obtener la instancia del servicio (Singleton)
   */
  public static getInstance(): SeguimientoService {
    if (!SeguimientoService.instance) {
      SeguimientoService.instance = new SeguimientoService();
    }
    return SeguimientoService.instance;
  }

  /**
   * Obtener el estado actual
   */
  public getState(): SeguimientoState {
    return { ...this.state };
  }

  /**
   * Activar el Agente de Seguimiento
   */
  public activate(): void {
    this.state = {
      ...this.state,
      isActive: true,
      lastUpdated: Date.now()
    };
    this.notifyListeners();
  }

  /**
   * Desactivar el Agente de Seguimiento
   */
  public deactivate(): void {
    this.state = {
      ...this.state,
      isActive: false,
      lastUpdated: Date.now()
    };
    this.notifyListeners();
  }

  /**
   * Iniciar un nuevo proyecto
   */
  public async iniciarProyecto(nombre: string, descripcion: string): Promise<void> {
    // Crear un nuevo historial de proyecto
    const newHistory: ProjectHistory = {
      projectId: `project-${Date.now()}`,
      name: nombre,
      description: descripcion,
      startTime: Date.now(),
      lastUpdated: Date.now(),
      stages: [],
      events: [],
      milestones: []
    };

    // Actualizar el estado
    this.state = {
      ...this.state,
      isActive: true,
      history: newHistory,
      lastUpdated: Date.now()
    };

    // Crear evento de inicio de proyecto
    const inicioEvent: HistoryEvent = {
      id: `event-inicio-${Date.now()}`,
      type: 'milestone',
      title: 'Inicio del Proyecto',
      description: `Se ha iniciado el proyecto "${nombre}": ${descripcion}`,
      timestamp: Date.now(),
      importance: 'high'
    };

    // Añadir el evento al historial
    this.state.history.events.push(inicioEvent);
    this.state.history.milestones.push({
      id: inicioEvent.id,
      title: inicioEvent.title,
      description: inicioEvent.description,
      timestamp: inicioEvent.timestamp,
      stageId: 'inicio'
    });

    this.notifyListeners();
  }

  /**
   * Documentar una etapa
   */
  public async documentarEtapa(stage: ApprovalStage, files?: FileItem[]): Promise<ChatMessage | null> {
    if (!this.state.isActive) return null;

    try {
      this.state = {
        ...this.state,
        isDocumenting: true,
        currentStageId: stage.id,
        lastUpdated: Date.now()
      };
      this.notifyListeners();

      // Crear tarea para el agente
      const task: AgentTask = {
        id: `task-documentar-${Date.now()}`,
        type: 'seguimiento',
        instruction: `documentar_etapa para la etapa ${stage.id} de tipo ${stage.type}`,
        status: 'working',
        startTime: Date.now()
      };

      // Ejecutar el agente
      const result = await AgenteSeguimiento.execute(task, {
        currentStage: stage,
        projectHistory: this.state.history,
        files
      });

      if (result.success && result.data) {
        const { event, stageDocumentation } = result.data;

        // Añadir el evento al historial
        this.state.history.events.push(event);

        // Si hay documentación de etapa, añadirla al historial
        if (stageDocumentation) {
          // Verificar si ya existe una documentación para esta etapa
          const existingStageIndex = this.state.history.stages.findIndex(
            s => s.stageId === stageDocumentation.stageId
          );

          if (existingStageIndex >= 0) {
            // Actualizar la documentación existente
            this.state.history.stages[existingStageIndex] = stageDocumentation;
          } else {
            // Añadir nueva documentación
            this.state.history.stages.push(stageDocumentation);
          }
        }

        // Actualizar el estado
        this.state = {
          ...this.state,
          isDocumenting: false,
          lastEvent: event,
          lastUpdated: Date.now()
        };
        this.notifyListeners();

        // Generar mensaje de chat
        return AgenteSeguimiento.generateChatMessageFromEvent(event);
      } else {
        console.error('Error al documentar etapa:', result.error);
        
        // Actualizar el estado
        this.state = {
          ...this.state,
          isDocumenting: false,
          lastUpdated: Date.now()
        };
        this.notifyListeners();
        
        return null;
      }
    } catch (error) {
      console.error('Error en documentarEtapa:', error);
      
      // Actualizar el estado
      this.state = {
        ...this.state,
        isDocumenting: false,
        lastUpdated: Date.now()
      };
      this.notifyListeners();
      
      return null;
    }
  }

  /**
   * Registrar un evento
   */
  public async registrarEvento(
    eventType: string,
    title: string,
    description: string,
    stageId?: string,
    metadata?: Record<string, any>
  ): Promise<ChatMessage | null> {
    if (!this.state.isActive) return null;

    try {
      // Crear tarea para el agente
      const task: AgentTask = {
        id: `task-evento-${Date.now()}`,
        type: 'seguimiento',
        instruction: `registrar_evento de tipo ${eventType} title:${title} description:${description}`,
        status: 'working',
        startTime: Date.now()
      };

      // Buscar la etapa actual si se proporciona un ID
      const currentStage = stageId 
        ? this.state.history.stages.find(s => s.stageId === stageId)?.stageId
        : undefined;

      // Ejecutar el agente
      const result = await AgenteSeguimiento.execute(task, {
        currentStage: currentStage 
          ? { id: currentStage } as ApprovalStage 
          : undefined,
        projectHistory: this.state.history
      });

      if (result.success && result.data?.event) {
        const { event } = result.data;

        // Añadir metadatos si se proporcionan
        if (metadata) {
          event.metadata = { ...event.metadata, ...metadata };
        }

        // Añadir el evento al historial
        this.state.history.events.push(event);

        // Si es un hito, añadirlo a la lista de hitos
        if (event.type === 'milestone') {
          this.state.history.milestones.push({
            id: event.id,
            title: event.title,
            description: event.description,
            timestamp: event.timestamp,
            stageId: event.stageId || 'unknown'
          });
        }

        // Si el evento está asociado a una etapa, añadirlo a la documentación de la etapa
        if (event.stageId) {
          const stageIndex = this.state.history.stages.findIndex(
            s => s.stageId === event.stageId
          );

          if (stageIndex >= 0) {
            this.state.history.stages[stageIndex].events.push(event);
          }
        }

        // Actualizar el estado
        this.state = {
          ...this.state,
          lastEvent: event,
          lastUpdated: Date.now()
        };
        this.notifyListeners();

        // Generar mensaje de chat
        return AgenteSeguimiento.generateChatMessageFromEvent(event);
      } else {
        console.error('Error al registrar evento:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error en registrarEvento:', error);
      return null;
    }
  }

  /**
   * Procesar un mensaje del usuario
   */
  public async procesarMensajeUsuario(
    mensaje: string,
    currentStageId?: string
  ): Promise<ChatMessage | null> {
    if (!this.state.isActive) return null;

    try {
      // Crear tarea para el agente
      const task: AgentTask = {
        id: `task-mensaje-${Date.now()}`,
        type: 'seguimiento',
        instruction: 'procesar_mensaje_usuario',
        status: 'working',
        startTime: Date.now()
      };

      // Buscar la etapa actual si se proporciona un ID
      const currentStage = currentStageId
        ? this.state.history.stages.find(s => s.stageId === currentStageId)
        : undefined;

      // Ejecutar el agente
      const result = await AgenteSeguimiento.execute(task, {
        currentStage: currentStage 
          ? { id: currentStage.stageId, type: currentStage.stageType } as ApprovalStage 
          : undefined,
        projectHistory: this.state.history,
        userMessage: mensaje
      });

      if (result.success && result.data?.event) {
        const { event } = result.data;

        // Añadir el evento al historial
        this.state.history.events.push(event);

        // Si el evento está asociado a una etapa, añadirlo a la documentación de la etapa
        if (event.stageId) {
          const stageIndex = this.state.history.stages.findIndex(
            s => s.stageId === event.stageId
          );

          if (stageIndex >= 0) {
            this.state.history.stages[stageIndex].events.push(event);
            
            // Actualizar el feedback del usuario en la etapa
            this.state.history.stages[stageIndex].userFeedback = 
              (this.state.history.stages[stageIndex].userFeedback || '') + 
              `\n${new Date(event.timestamp).toLocaleString()}: ${mensaje}`;
          }
        }

        // Actualizar el estado
        this.state = {
          ...this.state,
          lastEvent: event,
          lastUpdated: Date.now()
        };
        this.notifyListeners();

        // Generar respuesta basada en los metadatos del resultado
        if (result.metadata?.response) {
          return {
            id: `msg-response-${Date.now()}`,
            sender: 'assistant',
            content: result.metadata.response as string,
            timestamp: Date.now(),
            type: 'text'
          };
        }

        return AgenteSeguimiento.generateChatMessageFromEvent(event);
      } else {
        console.error('Error al procesar mensaje:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error en procesarMensajeUsuario:', error);
      return null;
    }
  }

  /**
   * Transferir información entre etapas
   */
  public async transferirInformacion(
    fromStageId: string,
    toStageId: string
  ): Promise<ChatMessage | null> {
    if (!this.state.isActive) return null;

    try {
      // Buscar las etapas
      const fromStage = this.state.history.stages.find(s => s.stageId === fromStageId);
      const toStage = this.state.history.stages.find(s => s.stageId === toStageId);

      if (!fromStage || !toStage) {
        console.error('No se encontraron las etapas para transferir información');
        return null;
      }

      // Crear tarea para el agente
      const task: AgentTask = {
        id: `task-transferir-${Date.now()}`,
        type: 'seguimiento',
        instruction: `transferir_informacion desde ${fromStageId} hacia ${toStageId}`,
        status: 'working',
        startTime: Date.now()
      };

      // Ejecutar el agente
      const result = await AgenteSeguimiento.execute(task, {
        currentStage: { id: toStage.stageId, type: toStage.stageType } as ApprovalStage,
        previousStage: { id: fromStage.stageId, type: fromStage.stageType } as ApprovalStage,
        projectHistory: this.state.history
      });

      if (result.success && result.data?.event) {
        const { event } = result.data;

        // Añadir el evento al historial
        this.state.history.events.push(event);

        // Añadir el evento a la etapa destino
        const toStageIndex = this.state.history.stages.findIndex(s => s.stageId === toStageId);
        if (toStageIndex >= 0) {
          this.state.history.stages[toStageIndex].events.push(event);
        }

        // Actualizar el estado
        this.state = {
          ...this.state,
          lastEvent: event,
          lastUpdated: Date.now()
        };
        this.notifyListeners();

        // Generar mensaje de chat
        return AgenteSeguimiento.generateChatMessageFromEvent(event);
      } else {
        console.error('Error al transferir información:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error en transferirInformacion:', error);
      return null;
    }
  }

  /**
   * Generar un resumen del proyecto
   */
  public async generarResumen(): Promise<ChatMessage | null> {
    if (!this.state.isActive) return null;

    try {
      // Crear tarea para el agente
      const task: AgentTask = {
        id: `task-resumen-${Date.now()}`,
        type: 'seguimiento',
        instruction: 'generar_resumen',
        status: 'working',
        startTime: Date.now()
      };

      // Ejecutar el agente
      const result = await AgenteSeguimiento.execute(task, {
        projectHistory: this.state.history
      });

      if (result.success && result.data?.event) {
        const { event } = result.data;

        // Añadir el evento al historial
        this.state.history.events.push(event);

        // Añadir a los hitos
        this.state.history.milestones.push({
          id: event.id,
          title: event.title,
          description: event.description,
          timestamp: event.timestamp,
          stageId: 'resumen'
        });

        // Actualizar el estado
        this.state = {
          ...this.state,
          lastEvent: event,
          lastUpdated: Date.now()
        };
        this.notifyListeners();

        // Generar mensaje de chat con el resumen completo
        return {
          id: `msg-resumen-${Date.now()}`,
          sender: 'assistant',
          content: result.metadata?.summary as string || event.description,
          timestamp: Date.now(),
          type: 'text'
        };
      } else {
        console.error('Error al generar resumen:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error en generarResumen:', error);
      return null;
    }
  }

  /**
   * Añadir un listener para cambios en el estado
   */
  public addListener(listener: (state: SeguimientoState) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Eliminar un listener
   */
  public removeListener(listener: (state: SeguimientoState) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notificar a todos los listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
}
