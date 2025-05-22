import {
  AgentTask,
  AgentStatus,
  FileItem,
  ChatMessage,
  FileSystemCommand
} from '../types';
import { PromptEnhancerService } from './PromptEnhancerService';
import { PlannerAgent } from '../agents/PlannerAgent';
import { CodeGeneratorAgent } from '../agents/CodeGeneratorAgent';
import { CodeModifierAgent } from '../agents/CodeModifierAgent';
import { FileObserverAgent } from '../agents/FileObserverAgent';
import { generateUniqueId } from '../utils/idGenerator';

/**
 * Servicio de Orquestación de Agentes de IA
 *
 * Este servicio coordina las acciones de los diferentes agentes de IA,
 * gestionando el flujo de trabajo y la comunicación entre ellos.
 */
export class AIOrchestrationService {
  private static instance: AIOrchestrationService;
  private tasks: AgentTask[] = [];
  private files: FileItem[] = [];
  private chatMessages: ChatMessage[] = [];
  private listeners: ((messages: ChatMessage[]) => void)[] = [];
  private fileListeners: ((files: FileItem[]) => void)[] = [];
  private taskListeners: ((tasks: AgentTask[]) => void)[] = [];
  private currentAgentType: string | null = null;

  /**
   * Constructor privado para implementar el patrón Singleton
   */
  private constructor() {}

  /**
   * Obtiene la instancia única del servicio
   * @returns Instancia del servicio
   */
  public static getInstance(): AIOrchestrationService {
    if (!AIOrchestrationService.instance) {
      AIOrchestrationService.instance = new AIOrchestrationService();
    }
    return AIOrchestrationService.instance;
  }

  /**
   * Registra un listener para los mensajes de chat
   * @param listener Función que se ejecutará cuando haya nuevos mensajes
   */
  public addChatListener(listener: (messages: ChatMessage[]) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Elimina un listener de mensajes de chat
   * @param listener Listener a eliminar
   */
  public removeChatListener(listener: (messages: ChatMessage[]) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Registra un listener para los archivos
   * @param listener Función que se ejecutará cuando haya cambios en los archivos
   */
  public addFileListener(listener: (files: FileItem[]) => void): void {
    this.fileListeners.push(listener);
  }

  /**
   * Elimina un listener de archivos
   * @param listener Listener a eliminar
   */
  public removeFileListener(listener: (files: FileItem[]) => void): void {
    this.fileListeners = this.fileListeners.filter(l => l !== listener);
  }

  /**
   * Registra un listener para las tareas
   * @param listener Función que se ejecutará cuando haya cambios en las tareas
   */
  public addTaskListener(listener: (tasks: AgentTask[]) => void): void {
    this.taskListeners.push(listener);
  }

  /**
   * Elimina un listener de tareas
   * @param listener Listener a eliminar
   */
  public removeTaskListener(listener: (tasks: AgentTask[]) => void): void {
    this.taskListeners = this.taskListeners.filter(l => l !== listener);
  }

  /**
   * Notifica a todos los listeners de chat
   */
  private notifyChatListeners(): void {
    for (const listener of this.listeners) {
      listener(this.chatMessages);
    }
  }

  /**
   * Notifica a todos los listeners de archivos
   */
  private notifyFileListeners(): void {
    for (const listener of this.fileListeners) {
      listener(this.files);
    }
  }

  /**
   * Notifica a todos los listeners de tareas
   */
  private notifyTaskListeners(): void {
    for (const listener of this.taskListeners) {
      listener(this.tasks);
    }
  }

  /**
   * Añade un mensaje al chat
   * @param message Mensaje a añadir
   */
  public addChatMessage(message: ChatMessage): void {
    this.chatMessages.push(message);
    this.notifyChatListeners();
  }

  /**
   * Obtiene todos los mensajes de chat
   * @returns Lista de mensajes de chat
   */
  public getChatMessages(): ChatMessage[] {
    return [...this.chatMessages];
  }

  /**
   * Obtiene todos los archivos
   * @returns Lista de archivos
   */
  public getFiles(): FileItem[] {
    return [...this.files];
  }

  /**
   * Obtiene todas las tareas
   * @returns Lista de tareas
   */
  public getTasks(): AgentTask[] {
    return [...this.tasks];
  }

  /**
   * Obtiene el tipo de agente que está trabajando actualmente
   * @returns Tipo de agente actual
   */
  public getCurrentAgentType(): string | null {
    return this.currentAgentType;
  }

  /**
   * Crea una nueva tarea para un agente
   * @param type Tipo de agente
   * @param instruction Instrucción para el agente
   * @returns Tarea creada
   */
  private createTask(type: string, instruction: string): AgentTask {
    const task: AgentTask = {
      id: generateUniqueId('task'),
      type: type as any,
      instruction,
      status: 'working',
      startTime: Date.now()
    };

    this.tasks.push(task);
    this.notifyTaskListeners();

    return task;
  }

  /**
   * Actualiza el estado de una tarea
   * @param taskId ID de la tarea
   * @param status Nuevo estado
   * @param result Resultado de la tarea
   */
  private updateTaskStatus(taskId: string, status: AgentStatus, result?: any): void {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex >= 0) {
      this.tasks[taskIndex] = {
        ...this.tasks[taskIndex],
        status,
        result,
        endTime: Date.now()
      };
      this.notifyTaskListeners();
    }
  }

  /**
   * Orquesta las acciones de los agentes de IA
   * @param instruction Instrucción inicial del usuario
   * @param templateId ID de la plantilla seleccionada (opcional)
   */
  public async orchestrateAIActions(instruction: string, templateId?: string): Promise<void> {
    try {
      // Verificar que la instrucción no esté vacía
      if (!instruction || !instruction.trim()) {
        throw new Error('La instrucción está vacía. Por favor, proporciona una descripción del proyecto.');
      }

      // 1. Mejorar el prompt con el PromptEnhancerService
      this.currentAgentType = 'promptEnhancer';
      this.addChatMessage({
        id: generateUniqueId('msg'),
        sender: 'system',
        content: 'Mejorando la instrucción para obtener mejores resultados...',
        timestamp: Date.now(),
        type: 'notification'
      });

      const enhanceTask = this.createTask('promptEnhancer', instruction);
      const enhancedResult = await PromptEnhancerService.enhancePrompt(instruction);

      if (!enhancedResult.success) {
        throw new Error(`Error al mejorar el prompt: ${enhancedResult.error}`);
      }

      const enhancedPrompt = enhancedResult.enhancedPrompt?.enhancedPrompt || instruction;
      this.updateTaskStatus(enhanceTask.id, 'completed', enhancedResult);

      this.addChatMessage({
        id: generateUniqueId('msg'),
        sender: 'assistant',
        content: `He mejorado tu instrucción para obtener mejores resultados. Ahora trabajaré en: "${enhancedPrompt}"`,
        timestamp: Date.now(),
        type: 'text'
      });

      // 2. Desarrollar un plan inicial con el PlannerAgent
      this.currentAgentType = 'planner';
      this.addChatMessage({
        id: generateUniqueId('msg'),
        sender: 'system',
        content: 'Desarrollando un plan para tu proyecto...',
        timestamp: Date.now(),
        type: 'notification'
      });

      const plannerTask = this.createTask('planner', enhancedPrompt);
      const plannerResult = await PlannerAgent.execute(plannerTask);

      if (!plannerResult.success) {
        throw new Error(`Error al desarrollar el plan: ${plannerResult.error}`);
      }

      this.updateTaskStatus(plannerTask.id, 'completed', plannerResult);

      const projectStructure = plannerResult.data.projectStructure;
      const implementationSteps = plannerResult.data.implementationSteps;

      this.addChatMessage({
        id: generateUniqueId('msg'),
        sender: 'assistant',
        content: `He desarrollado un plan para tu proyecto "${projectStructure.name}". Voy a crear ${projectStructure.files.length} archivos siguiendo ${implementationSteps.length} pasos de implementación.`,
        timestamp: Date.now(),
        type: 'text'
      });

      // 3. Generar código para cada archivo con el CodeGeneratorAgent
      this.currentAgentType = 'codeGenerator';
      this.addChatMessage({
        id: generateUniqueId('msg'),
        sender: 'system',
        content: 'Generando código para los archivos del proyecto...',
        timestamp: Date.now(),
        type: 'notification'
      });

      // Generar código para cada archivo
      for (const fileDesc of projectStructure.files) {
        const codeGenTask = this.createTask('codeGenerator', `Generar código para ${fileDesc.path}`);

        this.addChatMessage({
          id: generateUniqueId('msg'),
          sender: 'system',
          content: `Generando archivo: ${fileDesc.path}`,
          timestamp: Date.now(),
          type: 'notification'
        });

        const codeGenResult = await CodeGeneratorAgent.execute(
          codeGenTask,
          fileDesc,
          projectStructure.description
        );

        if (!codeGenResult.success) {
          this.updateTaskStatus(codeGenTask.id, 'failed', codeGenResult);
          this.addChatMessage({
            id: generateUniqueId('msg'),
            sender: 'system',
            content: `Error al generar código para ${fileDesc.path}: ${codeGenResult.error}`,
            timestamp: Date.now(),
            type: 'error'
          });
          continue;
        }

        this.updateTaskStatus(codeGenTask.id, 'completed', codeGenResult);

        // Añadir el archivo generado a la lista de archivos
        const newFile = {
          ...codeGenResult.data.file,
          timestamp: Date.now()
        };
        this.files.push(newFile);
        this.notifyFileListeners();

        this.addChatMessage({
          id: generateUniqueId('msg'),
          sender: 'assistant',
          content: `He creado el archivo ${fileDesc.path} (${newFile.content.length} bytes)`,
          timestamp: Date.now(),
          type: 'text'
        });
      }

      // 4. Notificar que el proceso ha finalizado
      this.currentAgentType = null;
      this.addChatMessage({
        id: generateUniqueId('msg'),
        sender: 'assistant',
        content: `¡Tu proyecto "${projectStructure.name}" ha sido generado con éxito! He creado ${this.files.length} archivos según el plan establecido. Puedes explorarlos en el panel de archivos y realizar modificaciones si lo necesitas.`,
        timestamp: Date.now(),
        type: 'text'
      });

    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Maneja errores durante la orquestación
   * @param error Error ocurrido
   */
  private handleError(error: any): void {
    console.error('Error en la orquestación de agentes:', error);

    this.addChatMessage({
      id: generateUniqueId('msg'),
      sender: 'system',
      content: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      timestamp: Date.now(),
      type: 'error'
    });

    this.currentAgentType = null;
  }

  /**
   * Lee el contenido de un archivo
   * @param filePath Ruta del archivo
   * @returns Contenido del archivo o null si no existe
   */
  public readFile(filePath: string): string | null {
    const file = this.files.find(f => f.path === filePath);
    return file ? file.content : null;
  }

  /**
   * Escribe contenido en un archivo
   * @param filePath Ruta del archivo
   * @param content Contenido a escribir
   * @returns true si se escribió correctamente, false en caso contrario
   */
  public writeFile(filePath: string, content: string): boolean {
    try {
      const fileIndex = this.files.findIndex(f => f.path === filePath);

      if (fileIndex >= 0) {
        // Actualizar archivo existente
        this.files[fileIndex] = {
          ...this.files[fileIndex],
          content,
          timestamp: Date.now(),
          isModified: true
        };
      } else {
        // Crear nuevo archivo
        const fileName = filePath.split('/').pop() || 'file';
        const fileExtension = fileName.includes('.') ? fileName.split('.').pop() || '' : '';

        this.files.push({
          id: generateUniqueId('file'),
          name: fileName,
          path: filePath,
          content,
          language: fileExtension,
          timestamp: Date.now(),
          isNew: true
        });
      }

      this.notifyFileListeners();
      return true;
    } catch (error) {
      console.error('Error al escribir archivo:', error);
      return false;
    }
  }

  /**
   * Elimina un archivo
   * @param filePath Ruta del archivo
   * @returns true si se eliminó correctamente, false en caso contrario
   */
  public deleteFile(filePath: string): boolean {
    try {
      this.files = this.files.filter(f => f.path !== filePath);
      this.notifyFileListeners();
      return true;
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      return false;
    }
  }
}
