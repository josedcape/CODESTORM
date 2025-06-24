import { 
  FileItem, 
  FileAnalysis, 
  FileChangeAnalysis, 
  LectorState, 
  AgentTask,
  ChatMessage
} from '../types';
import { AgenteLector } from '../agents/AgenteLector';

/**
 * Servicio para gestionar el Agente Lector
 */
export class LectorService {
  private static instance: LectorService;
  private state: LectorState;
  private listeners: ((state: LectorState) => void)[] = [];

  private constructor() {
    // Inicializar el estado
    this.state = {
      analyzedFiles: [],
      pendingChanges: [],
      isActive: true,
      lastAnalysis: Date.now()
    };
  }

  /**
   * Obtener la instancia del servicio (Singleton)
   */
  public static getInstance(): LectorService {
    if (!LectorService.instance) {
      LectorService.instance = new LectorService();
    }
    return LectorService.instance;
  }

  /**
   * Obtener el estado actual
   */
  public getState(): LectorState {
    return { ...this.state };
  }

  /**
   * Activar el Agente Lector
   */
  public activate(): void {
    this.state = {
      ...this.state,
      isActive: true
    };
    this.notifyListeners();
  }

  /**
   * Desactivar el Agente Lector
   */
  public deactivate(): void {
    this.state = {
      ...this.state,
      isActive: false
    };
    this.notifyListeners();
  }

  /**
   * Analizar un archivo
   * @param file Archivo a analizar
   * @returns Análisis del archivo
   */
  public async analyzeFile(file: FileItem): Promise<FileAnalysis | null> {
    if (!this.state.isActive) return null;

    try {
      // Crear tarea para el agente
      const task: AgentTask = {
        id: `task-analyze-${Date.now()}`,
        type: 'lector',
        instruction: `analizar_archivo ${file.path}`,
        status: 'working',
        startTime: Date.now()
      };

      // Ejecutar el agente
      const result = AgenteLector.execute(task, file, undefined, this.state);

      if (result.success && result.data?.fileAnalysis) {
        const { fileAnalysis, lectorState } = result.data;

        // Actualizar el estado
        this.state = lectorState || this.state;
        this.notifyListeners();

        return fileAnalysis;
      } else {
        console.error('Error al analizar archivo:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error en analyzeFile:', error);
      return null;
    }
  }

  /**
   * Analizar cambios propuestos en un archivo
   * @param file Archivo original
   * @param proposedChanges Cambios propuestos
   * @returns Análisis de los cambios
   */
  public async analyzeChanges(
    file: FileItem,
    proposedChanges: string
  ): Promise<FileChangeAnalysis | null> {
    if (!this.state.isActive) return null;

    try {
      // Crear tarea para el agente
      const task: AgentTask = {
        id: `task-analyze-changes-${Date.now()}`,
        type: 'lector',
        instruction: `analizar_cambios ${file.path}`,
        status: 'working',
        startTime: Date.now()
      };

      // Ejecutar el agente
      const result = AgenteLector.execute(task, file, proposedChanges, this.state);

      if (result.success && result.data?.changeAnalysis) {
        const { changeAnalysis, lectorState } = result.data;

        // Actualizar el estado
        this.state = lectorState || this.state;
        this.notifyListeners();

        return changeAnalysis;
      } else {
        console.error('Error al analizar cambios:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error en analyzeChanges:', error);
      return null;
    }
  }

  /**
   * Generar un mensaje de chat a partir de un análisis de archivo
   * @param fileAnalysis Análisis del archivo
   * @returns Mensaje de chat
   */
  public generateChatMessageFromAnalysis(fileAnalysis: FileAnalysis): ChatMessage {
    return {
      id: `msg-analysis-${Date.now()}`,
      sender: 'assistant',
      content: `He analizado el archivo ${fileAnalysis.path}:\n\n${fileAnalysis.description}\n\nPropósito: ${fileAnalysis.purpose}\n\nÁreas críticas: ${fileAnalysis.criticalAreas.map(area => area.description).join(', ')}`,
      timestamp: Date.now(),
      type: 'text',
      metadata: {
        fileId: fileAnalysis.fileId
      }
    };
  }

  /**
   * Generar un mensaje de chat a partir de un análisis de cambios
   * @param changeAnalysis Análisis de cambios
   * @returns Mensaje de chat
   */
  public generateChatMessageFromChangeAnalysis(changeAnalysis: FileChangeAnalysis): ChatMessage {
    return {
      id: `msg-change-analysis-${Date.now()}`,
      sender: 'assistant',
      content: `He analizado los cambios propuestos para el archivo ${changeAnalysis.originalFile.path}:\n\n${changeAnalysis.summary}\n\nRecomendación: ${changeAnalysis.recommendation}`,
      timestamp: Date.now(),
      type: 'text',
      metadata: {
        fileId: changeAnalysis.originalFile.id,
        requiresAction: changeAnalysis.impacts.some(impact => impact.level === 'critical')
      }
    };
  }

  /**
   * Suscribirse a cambios en el estado
   * @param listener Función a llamar cuando cambie el estado
   */
  public subscribe(listener: (state: LectorState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notificar a los suscriptores sobre cambios en el estado
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
