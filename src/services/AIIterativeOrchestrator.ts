import {
  AgentTask,
  FileItem,
  ChatMessage,
  AIPhase,
  AILogEntry,
  AIWorkflowState
} from '../types';
import { PromptEnhancerService } from './PromptEnhancerService';
import { PlannerAgent } from '../agents/PlannerAgent';
import { CodeGeneratorAgent } from '../agents/CodeGeneratorAgent';
import { CodeModifierAgent } from '../agents/CodeModifierAgent';
import { FileObserverAgent } from '../agents/FileObserverAgent';
import { generateUniqueId } from '../utils/idGenerator';
import { createFile } from './createFile';

/**
 * Servicio de Orquestación Iterativa de Agentes de IA
 *
 * Este servicio implementa un flujo de trabajo iterativo guiado por IA,
 * donde los agentes trabajan de forma continua y transparente, registrando
 * todas sus acciones en una bitácora detallada.
 */
export class AIIterativeOrchestrator {
  private static instance: AIIterativeOrchestrator;
  private tasks: AgentTask[] = [];
  private files: FileItem[] = [];
  private chatMessages: ChatMessage[] = [];
  private aiLog: AILogEntry[] = [];
  private projectPlan: any = null;

  private listeners: ((messages: ChatMessage[]) => void)[] = [];
  private fileListeners: ((files: FileItem[]) => void)[] = [];
  private logListeners: ((log: AILogEntry[]) => void)[] = [];
  private stateListeners: ((state: AIWorkflowState) => void)[] = [];
  private planListeners: ((plan: any) => void)[] = [];

  private currentPhase: AIPhase = 'awaitingInput';
  private currentAgentType: string | null = null;
  private lastInstruction: string = '';
  private isProcessing: boolean = false;
  private requiresApproval: boolean = false;
  private approvalData: ApprovalData | null = null;
  private progress: ProgressData | null = null;
  private isPaused: boolean = false;

  /**
   * Constructor privado para implementar el patrón Singleton
   */
  private constructor() {}

  /**
   * Obtiene la instancia única del servicio
   * @returns Instancia del servicio
   */
  public static getInstance(): AIIterativeOrchestrator {
    if (!AIIterativeOrchestrator.instance) {
      AIIterativeOrchestrator.instance = new AIIterativeOrchestrator();
    }
    return AIIterativeOrchestrator.instance;
  }

  /**
   * Obtiene el estado actual del flujo de trabajo
   * @returns Estado actual del flujo de trabajo
   */
  public getState(): AIWorkflowState {
    return {
      currentPhase: this.currentPhase,
      lastInstruction: this.lastInstruction,
      currentAgentType: this.currentAgentType,
      log: [...this.aiLog],
      isProcessing: this.isProcessing,
      requiresApproval: this.requiresApproval,
      approvalData: this.approvalData || undefined,
      progress: this.progress || undefined
    };
  }

  /**
   * Añade un listener para cambios en los mensajes de chat
   * @param listener Función a llamar cuando cambian los mensajes
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
   * Añade un listener para cambios en los archivos
   * @param listener Función a llamar cuando cambian los archivos
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
   * Añade un listener para cambios en el log de IA
   * @param listener Función a llamar cuando cambia el log
   */
  public addLogListener(listener: (log: AILogEntry[]) => void): void {
    this.logListeners.push(listener);
  }

  /**
   * Elimina un listener de log de IA
   * @param listener Listener a eliminar
   */
  public removeLogListener(listener: (log: AILogEntry[]) => void): void {
    this.logListeners = this.logListeners.filter(l => l !== listener);
  }

  /**
   * Añade un listener para cambios en el estado del flujo de trabajo
   * @param listener Función a llamar cuando cambia el estado
   */
  public addStateListener(listener: (state: AIWorkflowState) => void): void {
    this.stateListeners.push(listener);
  }

  /**
   * Elimina un listener de estado del flujo de trabajo
   * @param listener Listener a eliminar
   */
  public removeStateListener(listener: (state: AIWorkflowState) => void): void {
    this.stateListeners = this.stateListeners.filter(l => l !== listener);
  }

  /**
   * Notifica a los listeners de mensajes de chat
   */
  private notifyChatListeners(): void {
    this.listeners.forEach(listener => listener([...this.chatMessages]));
  }

  /**
   * Notifica a los listeners de archivos
   */
  private notifyFileListeners(): void {
    console.log(`Notificando a ${this.fileListeners.length} listeners sobre ${this.files.length} archivos`);

    // Verificar que haya listeners y archivos
    if (this.fileListeners.length === 0) {
      console.warn('No hay listeners de archivos registrados');
      return;
    }

    if (this.files.length === 0) {
      console.warn('No hay archivos para notificar');
    }

    // Imprimir información de los archivos para depuración
    this.files.forEach((file, index) => {
      console.log(`Archivo ${index+1}: ${file.path} (${file.type})`);
    });

    // Notificar a cada listener
    this.fileListeners.forEach((listener, index) => {
      try {
        console.log(`Notificando al listener ${index+1}`);
        listener([...this.files]);
      } catch (error) {
        console.error(`Error al notificar al listener ${index+1}:`, error);
      }
    });
  }

  /**
   * Notifica a los listeners de log de IA
   */
  private notifyLogListeners(): void {
    this.logListeners.forEach(listener => listener([...this.aiLog]));
  }

  /**
   * Notifica a los listeners de estado del flujo de trabajo
   */
  private notifyStateListeners(): void {
    const state = this.getState();
    this.stateListeners.forEach(listener => listener(state));
  }

  /**
   * Notifica a los listeners del plan sobre cambios en el plan
   */
  private notifyPlanListeners(): void {
    if (this.projectPlan) {
      this.planListeners.forEach(listener => listener(this.projectPlan));
    }
  }

  /**
   * Añade listeners para aprobaciones
   */
  private approvalListeners: ((approvalData: ApprovalData) => void)[] = [];

  /**
   * Añade un listener para aprobaciones
   * @param listener Función a llamar cuando hay una solicitud de aprobación
   */
  public addApprovalListener(listener: (approvalData: ApprovalData) => void): void {
    this.approvalListeners.push(listener);

    // Notificar inmediatamente si ya hay una solicitud de aprobación pendiente
    if (this.requiresApproval && this.approvalData) {
      listener(this.approvalData);
    }
  }

  /**
   * Elimina un listener de aprobaciones
   * @param listener Listener a eliminar
   */
  public removeApprovalListener(listener: (approvalData: ApprovalData) => void): void {
    this.approvalListeners = this.approvalListeners.filter(l => l !== listener);
  }

  /**
   * Notifica a los listeners de aprobaciones
   */
  private notifyApprovalListeners(): void {
    if (this.requiresApproval && this.approvalData) {
      this.approvalListeners.forEach(listener => listener(this.approvalData!));
    }
  }

  /**
   * Añade listeners para progreso
   */
  private progressListeners: ((progress: ProgressData) => void)[] = [];

  /**
   * Añade un listener para progreso
   * @param listener Función a llamar cuando cambia el progreso
   */
  public addProgressListener(listener: (progress: ProgressData) => void): void {
    this.progressListeners.push(listener);

    // Notificar inmediatamente si ya hay progreso
    if (this.progress) {
      listener(this.progress);
    }
  }

  /**
   * Elimina un listener de progreso
   * @param listener Listener a eliminar
   */
  public removeProgressListener(listener: (progress: ProgressData) => void): void {
    this.progressListeners = this.progressListeners.filter(l => l !== listener);
  }

  /**
   * Notifica a los listeners de progreso
   */
  private notifyProgressListeners(): void {
    if (this.progress) {
      this.progressListeners.forEach(listener => listener(this.progress!));
    }
  }

  /**
   * Añade un listener para el plan del proyecto
   * @param listener Función que se ejecutará cuando cambie el plan
   */
  public addPlanListener(listener: (plan: any) => void): void {
    this.planListeners.push(listener);

    // Notificar inmediatamente si ya hay un plan
    if (this.projectPlan) {
      listener(this.projectPlan);
    }
  }

  /**
   * Elimina un listener del plan del proyecto
   * @param listener Función a eliminar
   */
  public removePlanListener(listener: (plan: any) => void): void {
    this.planListeners = this.planListeners.filter(l => l !== listener);
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
   * Añade una entrada al log de IA
   * @param entry Entrada a añadir
   */
  private addLogEntry(entry: AILogEntry): void {
    this.aiLog.push(entry);
    this.notifyLogListeners();

    // También añadir como mensaje de chat para mostrar en la bitácora
    this.addChatMessage({
      id: generateUniqueId('msg'),
      sender: 'ai-agent',
      content: entry.details,
      timestamp: entry.timestamp,
      type: 'ai-log',
      metadata: {
        agentType: entry.agentType,
        phase: entry.phase,
        action: entry.action,
        files: entry.relatedFiles
      }
    });
  }

  /**
   * Actualiza la fase actual del flujo de trabajo
   * @param phase Nueva fase
   * @param agentType Tipo de agente actual
   */
  private updatePhase(phase: AIPhase, agentType: string | null = null): void {
    this.currentPhase = phase;
    this.currentAgentType = agentType;
    this.notifyStateListeners();
  }

  /**
   * Procesa una instrucción del usuario e inicia el flujo de trabajo iterativo
   * @param instruction Instrucción del usuario
   * @param templateId ID de la plantilla seleccionada (opcional)
   */
  public async processUserInstruction(instruction: string, templateId?: string): Promise<void> {
    try {
      // Verificar que la instrucción no esté vacía
      if (!instruction || !instruction.trim()) {
        throw new Error('La instrucción está vacía. Por favor, proporciona una descripción del proyecto.');
      }

      // Guardar la instrucción
      this.lastInstruction = instruction;
      this.isProcessing = true;
      this.notifyStateListeners();

      // Determinar la acción a realizar según el contexto actual
      if (this.currentPhase === 'awaitingInput' || this.currentPhase === 'complete') {
        // Si estamos esperando input o el flujo anterior está completo, iniciar un nuevo flujo
        await this.startNewWorkflow(instruction, templateId);
      } else if (this.currentPhase === 'planning') {
        // Si estamos en fase de planificación, modificar el plan
        await this.modifyPlan(instruction);
      } else if (this.currentPhase === 'generatingCode' || this.currentPhase === 'modifyingFile') {
        // Si estamos generando código o modificando archivos, aplicar cambios
        await this.modifyCurrentWork(instruction);
      }

    } catch (error) {
      this.handleError(error);
    } finally {
      this.isProcessing = false;
      this.notifyStateListeners();
    }
  }

  /**
   * Inicia un nuevo flujo de trabajo
   * @param instruction Instrucción inicial
   * @param templateId ID de la plantilla (opcional)
   */
  private async startNewWorkflow(instruction: string, templateId?: string): Promise<void> {
    // 1. Mejorar el prompt con el PromptEnhancerService
    this.updatePhase('planning', 'promptEnhancer');

    this.addLogEntry({
      id: generateUniqueId('log'),
      timestamp: Date.now(),
      phase: 'planning',
      agentType: 'promptEnhancer',
      action: 'enhancePrompt',
      details: 'Mejorando la instrucción para obtener mejores resultados...',
      relatedFiles: []
    });

    const enhancedResult = await PromptEnhancerService.enhancePrompt(instruction);

    if (!enhancedResult.success) {
      throw new Error(`Error al mejorar el prompt: ${enhancedResult.error}`);
    }

    const enhancedInstruction = enhancedResult.enhancedPrompt || instruction;

    // 2. Generar un plan con el PlannerAgent
    this.updatePhase('planning', 'planner');

    this.addLogEntry({
      id: generateUniqueId('log'),
      timestamp: Date.now(),
      phase: 'planning',
      agentType: 'planner',
      action: 'generatePlan',
      details: 'Generando un plan detallado para el proyecto...',
      relatedFiles: []
    });

    // Combinar la plantilla seleccionada con las instrucciones del chat
    let combinedInstruction = enhancedInstruction;

    if (templateId) {
      // Añadir información sobre la plantilla seleccionada a la instrucción
      this.addLogEntry({
        id: generateUniqueId('log'),
        timestamp: Date.now(),
        phase: 'planning',
        agentType: 'planner',
        action: 'combineTemplateAndInstructions',
        details: `Combinando la plantilla "${templateId}" con las instrucciones del usuario...`,
        relatedFiles: []
      });

      // Combinar la instrucción con la información de la plantilla
      combinedInstruction = `Basado en la plantilla "${templateId}" y considerando las siguientes instrucciones adicionales: ${enhancedInstruction}`;
    }

    const plannerTask: AgentTask = {
      id: generateUniqueId('task'),
      type: 'planner',
      instruction: combinedInstruction,
      status: 'working',
      startTime: Date.now(),
      templateId
    };

    const planResult = await PlannerAgent.execute(plannerTask);

    if (!planResult.success || !planResult.data) {
      throw new Error(`Error al generar el plan: ${planResult.error}`);
    }

    // Extraer la estructura del proyecto del resultado del planificador
    const projectStructure = planResult.data.projectStructure;

    // Verificar que la estructura del proyecto sea válida
    if (!projectStructure || !projectStructure.files || !Array.isArray(projectStructure.files)) {
      throw new Error('El plan generado no contiene una estructura de proyecto válida');
    }

    // Adaptar el plan para el CodeGeneratorAgent
    const adaptedPlan = {
      files: projectStructure.files,
      description: projectStructure.description || enhancedInstruction,
      name: projectStructure.name || 'Proyecto sin nombre',
      implementationSteps: planResult.data.implementationSteps || []
    };

    // Añadir entrada de bitácora sobre el plan generado
    this.addLogEntry({
      id: generateUniqueId('log'),
      timestamp: Date.now(),
      phase: 'planning',
      agentType: 'planner',
      action: 'planGenerated',
      details: `Plan generado exitosamente: ${adaptedPlan.name}. Esperando aprobación para continuar...`,
      relatedFiles: adaptedPlan.files.map(file => file.path)
    });

    // Mensaje del AgenteLector sobre el plan generado
    this.addChatMessage({
      id: generateUniqueId('msg-lector-plan'),
      sender: 'ai-agent',
      content: `📋 **AgenteLector**: El Agente de Planificación ha creado un plan de desarrollo con ${adaptedPlan.files.length} archivos. El plan está listo para tu revisión y aprobación.`,
      timestamp: Date.now(),
      type: 'agent-report',
      metadata: {
        agentType: 'lector',
        phase: 'planning',
        fileCount: adaptedPlan.files.length
      }
    });

    // Crear un mensaje de chat con el plan generado
    this.addChatMessage({
      id: generateUniqueId('msg-plan'),
      sender: 'assistant',
      content: `He generado un plan para el proyecto "${adaptedPlan.name}". El plan incluye ${adaptedPlan.files.length} archivos a crear. Por favor, revisa y aprueba el plan para continuar.`,
      timestamp: Date.now(),
      type: 'proposal',
      metadata: {
        planId: generateUniqueId('plan'),
        files: adaptedPlan.files.map(file => file.path)
      }
    });

    // Crear un objeto ProjectPlan para el estado del constructor
    const projectPlan = {
      id: generateUniqueId('plan'),
      title: adaptedPlan.name,
      description: adaptedPlan.description,
      files: adaptedPlan.files.map(file => file.path),
      steps: adaptedPlan.implementationSteps.map(step => ({
        id: step.id,
        title: step.title,
        description: step.description,
        status: 'pending', // Cambiado de 'in-progress' a 'pending'
        files: step.filesToCreate || []
      })),
      currentStepId: adaptedPlan.implementationSteps[0]?.id
    };

    // Actualizar el estado del proyecto con el plan
    this.projectPlan = projectPlan;

    // Notificar a los listeners del plan
    this.notifyPlanListeners();

    // Crear los elementos de aprobación
    const approvalItems: ApprovalItem[] = adaptedPlan.files.map(file => {
      const estimatedTime = this.estimateFileGenerationTime(file);
      return {
        id: generateUniqueId('approval-item'),
        title: file.path || 'Archivo sin ruta',
        description: file.description || `Archivo para ${file.path || 'el proyecto'}`,
        type: 'file',
        path: file.path || `archivo-${generateUniqueId('file')}.txt`,
        language: this.detectLanguageFromPath(file.path || ''),
        estimatedTime,
        priority: this.determinePriority(file, adaptedPlan.files),
        dependencies: this.findDependencies(file, adaptedPlan.files)
      };
    });

    // Crear la solicitud de aprobación
    const approvalData: ApprovalData = {
      id: generateUniqueId('approval'),
      title: `Plan para el proyecto "${adaptedPlan.name}"`,
      description: `Este plan incluye ${adaptedPlan.files.length} archivos a crear. Por favor, revisa y aprueba el plan para continuar con la generación de código.`,
      type: 'plan',
      items: approvalItems,
      timestamp: Date.now()
    };

    // Actualizar el estado para requerir aprobación
    this.requiresApproval = true;
    this.approvalData = approvalData;
    this.updatePhase('awaitingApproval', 'planner');

    // Notificar a los listeners de aprobación
    this.notifyApprovalListeners();

    // Crear un mensaje de chat solicitando aprobación
    this.addChatMessage({
      id: generateUniqueId('msg-approval'),
      sender: 'system',
      content: `Se requiere tu aprobación para continuar con la generación de código. Por favor, revisa el plan y aprueba o rechaza.`,
      timestamp: Date.now(),
      type: 'approval-request',
      metadata: {
        approvalId: approvalData.id,
        approvalType: 'plan',
        approvalStatus: 'pending',
        requiresAction: true
      }
    });

    // Esperar a que el usuario apruebe el plan antes de continuar
    // La generación de código se realizará en el método handleApproval
  }

  /**
   * Maneja la aprobación o rechazo de una solicitud
   * @param approvalId ID de la solicitud de aprobación
   * @param approved Indica si fue aprobada
   * @param feedback Comentarios del usuario
   * @param approvedItems IDs de los elementos aprobados (para aprobación parcial)
   */
  public async handleApproval(approvalId: string, approved: boolean, feedback?: string, approvedItems?: string[]): Promise<void> {
    try {
      console.log(`Recibida solicitud de aprobación con ID: ${approvalId}`);
      console.log(`Estado actual: requiresApproval=${this.requiresApproval}, approvalData=${this.approvalData ? 'presente' : 'ausente'}`);

      if (this.approvalData) {
        console.log(`ID de aprobación actual: ${this.approvalData.id}`);
      }

      // Verificar que haya una solicitud de aprobación pendiente
      if (!this.requiresApproval || !this.approvalData) {
        console.warn('No hay una solicitud de aprobación pendiente');

        // Añadir mensaje informativo al chat en lugar de lanzar error
        this.addChatMessage({
          id: generateUniqueId('msg-approval-warning'),
          sender: 'system',
          content: `No hay una solicitud de aprobación pendiente en este momento. Puede que la solicitud ya haya sido procesada o haya expirado.`,
          timestamp: Date.now(),
          type: 'notification',
          metadata: {
            errorType: 'approval-not-found',
            approvalId
          }
        });

        return; // Salir sin lanzar error
      }

      // Si el ID no coincide pero hay una solicitud pendiente, usar la actual
      if (this.approvalData.id !== approvalId) {
        console.warn(`ID de aprobación no coincide. Esperado: ${this.approvalData.id}, Recibido: ${approvalId}`);
        console.log(`Usando la solicitud de aprobación actual en su lugar`);

        // Añadir mensaje informativo al chat
        this.addChatMessage({
          id: generateUniqueId('msg-approval-id-mismatch'),
          sender: 'system',
          content: `Procesando la solicitud de aprobación actual en su lugar.`,
          timestamp: Date.now(),
          type: 'notification'
        });

        // Continuar con la solicitud actual
        approvalId = this.approvalData.id;
      }

      console.log(`Manejando aprobación para ID ${approvalId}, aprobado: ${approved}`);

      // Mensaje del AgenteLector sobre la decisión del usuario
      if (approved) {
        this.addChatMessage({
          id: generateUniqueId('msg-lector-user-approved'),
          sender: 'ai-agent',
          content: `👍 **AgenteLector**: El usuario ha aprobado la solicitud. El Coordinador de Agentes continuará con el proceso.`,
          timestamp: Date.now(),
          type: 'agent-report',
          metadata: {
            agentType: 'lector',
            phase: 'approval',
            status: 'approved'
          }
        });
      } else {
        this.addChatMessage({
          id: generateUniqueId('msg-lector-user-rejected'),
          sender: 'ai-agent',
          content: `👎 **AgenteLector**: El usuario ha rechazado la solicitud${feedback ? `: "${feedback}"` : ''}. El Coordinador de Agentes ajustará el proceso.`,
          timestamp: Date.now(),
          type: 'agent-report',
          metadata: {
            agentType: 'lector',
            phase: 'approval',
            status: 'rejected'
          }
        });
      }

      // Guardar el tipo de aprobación antes de notificar a los manejadores
      const approvalType = this.approvalData.type;

      // Notificar a los manejadores de aprobación
      // Esto es importante para las aprobaciones de archivos individuales
      this.approvalHandlers.forEach(handler => handler(approvalId, approved));

      // Actualizar el estado de la solicitud
      this.approvalData = {
        ...this.approvalData,
        approved: approved,
        rejected: !approved && !approvedItems,
        partiallyApproved: !!approvedItems && approvedItems.length > 0,
        feedback
      };

      // Si es una aprobación de archivo individual, el manejador ya se encargó de todo
      if (approvalType === 'file') {
        // No es necesario hacer nada más, el manejador ya resolvió la promesa
        return;
      }

      // Si fue rechazada, volver a la fase de planificación
      if (!approved && !approvedItems) {
        this.addChatMessage({
          id: generateUniqueId('msg-rejection'),
          sender: 'system',
          content: `Has rechazado la propuesta. ${feedback ? `Comentarios: ${feedback}` : ''}`,
          timestamp: Date.now(),
          type: 'approval-response',
          metadata: {
            approvalId,
            approvalStatus: 'rejected',
            approvalType: this.approvalData.type
          }
        });

        this.requiresApproval = false;
        this.approvalData = null;
        this.updatePhase('planning', 'planner');

        // Añadir mensaje de chat indicando que se volverá a planificar
        this.addChatMessage({
          id: generateUniqueId('msg-replan'),
          sender: 'assistant',
          content: `Entendido. Voy a revisar el plan según tus comentarios${feedback ? `: ${feedback}` : ''}.`,
          timestamp: Date.now(),
          type: 'text'
        });

        // Volver a planificar con los comentarios del usuario
        await this.modifyPlan(feedback || 'Revisa el plan y mejóralo');
        return;
      }

      // Si fue aprobada parcialmente, filtrar los elementos aprobados
      if (approvedItems && approvedItems.length > 0) {
        // Actualizar los elementos de la solicitud
        this.approvalData.items = this.approvalData.items.map(item => ({
          ...item,
          approved: approvedItems.includes(item.id)
        }));

        // Añadir mensaje de chat indicando la aprobación parcial
        this.addChatMessage({
          id: generateUniqueId('msg-partial-approval'),
          sender: 'system',
          content: `Has aprobado parcialmente la propuesta (${approvedItems.length} de ${this.approvalData.items.length} elementos). ${feedback ? `Comentarios: ${feedback}` : ''}`,
          timestamp: Date.now(),
          type: 'approval-response',
          metadata: {
            approvalId,
            approvalStatus: 'partially-approved',
            approvalType: this.approvalData.type
          }
        });
      } else {
        // Añadir mensaje de chat indicando la aprobación completa
        this.addChatMessage({
          id: generateUniqueId('msg-approval'),
          sender: 'system',
          content: `Has aprobado la propuesta. ${feedback ? `Comentarios: ${feedback}` : ''}`,
          timestamp: Date.now(),
          type: 'approval-response',
          metadata: {
            approvalId,
            approvalStatus: 'approved',
            approvalType: this.approvalData.type
          }
        });
      }

      // Continuar con el flujo según el tipo de aprobación
      try {
        console.log(`Continuando con el flujo según el tipo de aprobación: ${approvalType}`);

        if (approvalType === 'plan') {
          console.log('Iniciando generación de código después de aprobación del plan');
          await this.continueWithCodeGeneration(approvedItems);
        } else if (approvalType === 'code') {
          console.log('Finalizando generación de código');
          await this.finalizeCodeGeneration(approvedItems);
        } else if (approvalType === 'design') {
          console.log('Implementando diseño');
          await this.implementDesign(approvedItems);
        } else if (approvalType === 'modification') {
          console.log('Aplicando modificaciones');
          await this.applyModifications(approvedItems);
        } else {
          console.warn(`Tipo de aprobación desconocido: ${approvalType}`);

          // Añadir mensaje informativo al chat
          this.addChatMessage({
            id: generateUniqueId('msg-unknown-approval-type'),
            sender: 'system',
            content: `Se recibió un tipo de aprobación desconocido: ${approvalType}. Por favor, intenta nuevamente.`,
            timestamp: Date.now(),
            type: 'warning'
          });
        }
      } catch (error) {
        console.error(`Error al procesar la aprobación de tipo ${approvalType}:`, error);
        this.handleError(error);

        // Intentar recuperar el flujo
        this.updatePhase('awaitingInput', null);
      }

      // Limpiar el estado de aprobación
      this.requiresApproval = false;
      this.approvalData = null;

    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Continúa con la generación de código después de la aprobación del plan
   * @param approvedItems IDs de los elementos aprobados (para aprobación parcial)
   */
  private async continueWithCodeGeneration(approvedItems?: string[]): Promise<void> {
    try {
      console.log('Iniciando continueWithCodeGeneration después de aprobación del plan');

      // Añadir mensaje informativo al chat
      this.addChatMessage({
        id: generateUniqueId('msg-continue-generation'),
        sender: 'system',
        content: 'Iniciando la generación de código basada en el plan aprobado...',
        timestamp: Date.now(),
        type: 'notification'
      });

      // Obtener el plan adaptado
      if (!this.projectPlan) {
        console.error('Error: No hay un plan de proyecto disponible');
        throw new Error('No hay un plan de proyecto disponible. Por favor, intenta generar un nuevo plan.');
      }

      console.log('Plan de proyecto disponible:', this.projectPlan.title);

      // Añadir mensaje del AgenteLector sobre el inicio del proceso
      this.addChatMessage({
        id: generateUniqueId('msg-lector'),
        sender: 'ai-agent',
        content: `🔍 **AgenteLector**: Iniciando el proceso de generación de código basado en el plan aprobado. El Coordinador de Agentes comenzará a orquestar la creación de archivos según el orden definido en el plan de desarrollo.`,
        timestamp: Date.now(),
        type: 'agent-report',
        metadata: {
          agentType: 'lector',
          phase: 'generatingCode'
        }
      });

      // Filtrar los archivos aprobados si es una aprobación parcial
      let filesToGenerate = this.projectPlan.files;

      console.log(`Total de archivos en el plan: ${this.projectPlan.files.length}`);
      console.log('Archivos en el plan:', this.projectPlan.files);

      if (approvedItems && this.approvalData) {
        console.log(`Aprobación parcial con ${approvedItems.length} elementos aprobados`);

        const approvedFiles = this.approvalData.items
          .filter(item => approvedItems.includes(item.id) && item.type === 'file')
          .map(item => item.path);

        console.log(`Archivos aprobados parcialmente: ${approvedFiles.length}`);
        console.log('Rutas de archivos aprobados:', approvedFiles);

        filesToGenerate = filesToGenerate.filter(file => approvedFiles.includes(file));

        console.log(`Archivos filtrados para generar: ${filesToGenerate.length}`);
      } else {
        console.log('Todos los archivos fueron aprobados, generando el plan completo');
      }

      // Verificar que haya archivos para generar
      if (!filesToGenerate || filesToGenerate.length === 0) {
        console.error('Error: No hay archivos para generar después de la aprobación');

        // Añadir mensaje informativo al chat
        this.addChatMessage({
          id: generateUniqueId('msg-no-files-error'),
          sender: 'system',
          content: 'Error: No se encontraron archivos para generar después de la aprobación. Por favor, intenta aprobar el plan nuevamente o genera un nuevo plan.',
          timestamp: Date.now(),
          type: 'error'
        });

        throw new Error('No hay archivos para generar en el plan aprobado. Por favor, intenta aprobar el plan nuevamente.');
      }

      // Actualizar el estado
      this.updatePhase('generatingCode', 'codeGenerator');
      console.log('Fase actualizada a generatingCode con agente codeGenerator');

      // Notificar a los listeners del cambio de estado
      this.notifyStateListeners();
      console.log('Notificados los listeners de estado');

      // Añadir entrada de bitácora
      this.addLogEntry({
        id: generateUniqueId('log'),
        timestamp: Date.now(),
        phase: 'generatingCode',
        agentType: 'codeGenerator',
        action: 'generateCode',
        details: `Preparando la generación de ${filesToGenerate.length} archivos basados en el plan aprobado...`,
        relatedFiles: filesToGenerate
      });
      console.log(`Añadida entrada de bitácora para generación de ${filesToGenerate.length} archivos`);

      // Añadir mensaje informativo al chat
      this.addChatMessage({
        id: generateUniqueId('msg-generation-start'),
        sender: 'system',
        content: `Iniciando la generación de ${filesToGenerate.length} archivos. Este proceso puede tomar unos momentos...`,
        timestamp: Date.now(),
        type: 'notification'
      });

      // Crear un plan adaptado para el generador de código
      const adaptedPlan = {
        files: filesToGenerate,
        description: this.projectPlan.description,
        name: this.projectPlan.title,
        implementationSteps: this.projectPlan.steps.map(step => ({
          id: step.id,
          title: step.title,
          description: step.description,
          filesToCreate: step.files
        }))
      };

      // Crear una cola de archivos para procesar uno por uno
      const fileQueue = [...adaptedPlan.files].filter(file => file && file.path);
      const generatedFiles: FileItem[] = [];

      // Verificar que haya archivos válidos en la cola
      if (fileQueue.length === 0) {
        throw new Error('No hay archivos válidos para generar en el plan');
      }

      // Inicializar el progreso
      this.updateProgress('generatingCode', fileQueue.length, 0);

      // Mensaje del AgenteLector sobre el inicio de la generación de archivos
      this.addChatMessage({
        id: generateUniqueId('msg-lector-files'),
        sender: 'ai-agent',
        content: `📋 **AgenteLector**: El Agente Generador de Código comenzará a crear ${fileQueue.length} archivos según el plan. Cada archivo requerirá tu aprobación antes de continuar con el siguiente.`,
        timestamp: Date.now(),
        type: 'agent-report',
        metadata: {
          agentType: 'lector',
          phase: 'generatingCode',
          fileCount: fileQueue.length
        }
      });

      // Procesar cada archivo uno por uno
      for (let i = 0; i < fileQueue.length; i++) {
        const currentFile = fileQueue[i];

        // Verificar que el archivo sea válido
        if (!currentFile || !currentFile.path) {
          console.error(`Archivo inválido en la posición ${i+1}:`, currentFile);
          continue;
        }

        // Actualizar el progreso
        this.updateItemProgress(
          currentFile.path,
          currentFile.path,
          0,
          'in-progress'
        );

        // Mensaje del AgenteLector sobre el archivo actual
        this.addChatMessage({
          id: generateUniqueId('msg-lector-file'),
          sender: 'ai-agent',
          content: `🔧 **AgenteLector**: Preparando archivo ${i+1} de ${fileQueue.length}: ${currentFile.path}`,
          timestamp: Date.now(),
          type: 'agent-report',
          metadata: {
            agentType: 'lector',
            phase: 'generatingCode',
            currentFile: i+1,
            totalFiles: fileQueue.length,
            filePath: currentFile.path
          }
        });

        // Solicitar aprobación para el archivo actual
        const approved = await this.requestFileApproval(currentFile, i + 1, fileQueue.length);

        if (!approved) {
          // Si el archivo no fue aprobado, continuar con el siguiente
          this.updateItemProgress(
            currentFile.path,
            currentFile.path,
            100,
            'failed'
          );

          // Mensaje del AgenteLector sobre el rechazo
          this.addChatMessage({
            id: generateUniqueId('msg-lector-rejected'),
            sender: 'ai-agent',
            content: `❌ **AgenteLector**: El archivo ${currentFile.path} ha sido rechazado. Continuando con el siguiente archivo.`,
            timestamp: Date.now(),
            type: 'agent-report',
            metadata: {
              agentType: 'lector',
              phase: 'generatingCode',
              status: 'rejected',
              filePath: currentFile.path
            }
          });

          continue;
        }

        // Generar el archivo
        try {
          // Crear una tarea específica para este archivo
          const fileTask: AgentTask = {
            id: generateUniqueId('task-file'),
            type: 'codeGenerator',
            instruction: `Genera el archivo ${currentFile.path} para el proyecto ${adaptedPlan.name}. ${currentFile.description || ''}`,
            status: 'working',
            startTime: Date.now(),
            plan: {
              ...adaptedPlan,
              files: [currentFile]
            }
          };

          // Actualizar el estado
          this.addLogEntry({
            id: generateUniqueId('log'),
            timestamp: Date.now(),
            phase: 'generatingCode',
            agentType: 'codeGenerator',
            action: 'generateFile',
            details: `Generando archivo ${i + 1} de ${fileQueue.length}: ${currentFile.path}...`,
            relatedFiles: [currentFile.path]
          });

          // Ejecutar el generador de código para este archivo
          const fileResult = await CodeGeneratorAgent.execute(fileTask);

          if (!fileResult.success || !fileResult.data || !fileResult.data.files || !fileResult.data.files.length) {
            throw new Error(`Error al generar el archivo ${currentFile.path}: ${fileResult.error || 'No se generó el archivo'}`);
          }

          // Añadir el archivo generado a la lista
          const generatedFile = fileResult.data.files[0];
          generatedFiles.push(generatedFile);

          // Actualizar el progreso
          this.updateItemProgress(
            currentFile.path,
            currentFile.path,
            100,
            'completed'
          );

          // Añadir mensaje de chat para el archivo generado
          this.addChatMessage({
            id: generateUniqueId('msg-file'),
            sender: 'ai-agent',
            content: `Archivo creado: ${generatedFile.path}`,
            timestamp: Date.now(),
            type: 'file-creation',
            metadata: {
              fileId: generatedFile.id,
              filePath: generatedFile.path,
              fileType: generatedFile.type
            }
          });

          // Mensaje del AgenteLector sobre el archivo generado
          this.addChatMessage({
            id: generateUniqueId('msg-lector-success'),
            sender: 'ai-agent',
            content: `✅ **AgenteLector**: El Agente Generador de Código ha creado exitosamente el archivo ${generatedFile.path}. ${i+1 < fileQueue.length ? `Preparando el siguiente archivo (${i+2} de ${fileQueue.length}).` : 'Este es el último archivo del plan.'}`,
            timestamp: Date.now(),
            type: 'agent-report',
            metadata: {
              agentType: 'lector',
              phase: 'generatingCode',
              status: 'success',
              filePath: generatedFile.path,
              currentFile: i+1,
              totalFiles: fileQueue.length
            }
          });

          // Actualizar los archivos en el estado
          this.files = [...this.files, generatedFile];

          // Notificar a los listeners con un pequeño retraso para asegurar que la UI se actualice
          console.log(`Notificando a ${this.fileListeners.length} listeners sobre el nuevo archivo: ${generatedFile.path}`);
          this.notifyFileListeners();

          // Forzar una segunda notificación después de un breve retraso
          setTimeout(() => {
            console.log(`Re-notificando a los listeners para asegurar actualización de UI`);
            this.notifyFileListeners();
          }, 500);

        } catch (error) {
          // Manejar el error para este archivo específico
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          console.error(`Error al generar archivo ${currentFile.path}:`, errorMessage);

          this.addLogEntry({
            id: generateUniqueId('log'),
            timestamp: Date.now(),
            phase: 'generatingCode',
            agentType: 'codeGenerator',
            action: 'generateFileFailed',
            details: `Error al generar el archivo ${currentFile.path}: ${errorMessage}`,
            relatedFiles: [currentFile.path]
          });

          // Mensaje del AgenteLector sobre el error
          this.addChatMessage({
            id: generateUniqueId('msg-lector-error'),
            sender: 'ai-agent',
            content: `⚠️ **AgenteLector**: Ha ocurrido un error al generar el archivo ${currentFile.path}: ${errorMessage}. El Coordinador de Agentes intentará continuar con el siguiente archivo.`,
            timestamp: Date.now(),
            type: 'agent-report',
            metadata: {
              agentType: 'lector',
              phase: 'generatingCode',
              status: 'error',
              filePath: currentFile.path,
              error: errorMessage
            }
          });

          // Actualizar el progreso
          this.updateItemProgress(
            currentFile.path,
            currentFile.path,
            100,
            'failed'
          );

          // Continuar con el siguiente archivo
          continue;
        }

        // Actualizar el progreso general
        this.updateProgress('generatingCode', fileQueue.length, i + 1);
      }

      // Verificar si se generaron archivos
      if (!generatedFiles.length) {
        console.error('Error: No se generaron archivos después del proceso de generación');

        // Añadir mensaje informativo al chat
        this.addChatMessage({
          id: generateUniqueId('msg-no-generated-files'),
          sender: 'system',
          content: 'Error: No se pudieron generar los archivos. Esto puede deberse a un problema con el plan o con el generador de código. Por favor, intenta generar un nuevo plan.',
          timestamp: Date.now(),
          type: 'error'
        });

        // Actualizar el estado para permitir al usuario intentar de nuevo
        this.updatePhase('awaitingInput', null);
        this.notifyStateListeners();

        throw new Error('No se generaron archivos. Por favor, intenta generar un nuevo plan.');
      }

      console.log(`Se generaron ${generatedFiles.length} archivos exitosamente`);

      const fileNames = generatedFiles.map(file => file.path);

      // Añadir mensaje de bitácora sobre los archivos generados
      this.addLogEntry({
        id: generateUniqueId('log'),
        timestamp: Date.now(),
        phase: 'generatingCode',
        agentType: 'codeGenerator',
        action: 'codeGenerated',
        details: `Código generado exitosamente. Se han creado ${generatedFiles.length} archivos.`,
        relatedFiles: fileNames
      });

      // Añadir mensaje de resumen
      this.addChatMessage({
        id: generateUniqueId('msg-summary'),
        sender: 'assistant',
        content: `He generado ${generatedFiles.length} archivos para el proyecto "${this.projectPlan?.title || 'sin nombre'}".`,
        timestamp: Date.now(),
        type: 'text',
        metadata: {
          files: fileNames
        }
      });

      // Mensaje del AgenteLector sobre la finalización del proceso
      this.addChatMessage({
        id: generateUniqueId('msg-lector-complete'),
        sender: 'ai-agent',
        content: `🏁 **AgenteLector**: El proceso de generación de código ha finalizado. El Coordinador de Agentes ha completado la orquestación de todos los archivos del plan.`,
        timestamp: Date.now(),
        type: 'agent-report',
        metadata: {
          agentType: 'lector',
          phase: 'complete',
          status: 'success'
        }
      });

      // Finalizar el flujo de trabajo
      this.updatePhase('complete', null);

      // Crear un mensaje de finalización detallado
      const projectName = this.projectPlan?.title || 'sin nombre';
      const fileCount = generatedFiles.length;
      const fileTypes = [...new Set(generatedFiles.map(file => file.type))].join(', ');

      // Forzar una notificación final a los listeners para asegurar que todos los archivos se muestren
      console.log(`Notificación final a los listeners: ${this.files.length} archivos en total`);
      this.notifyFileListeners();

      // Verificar que los archivos estén disponibles en la interfaz de usuario
      if (this.files.length > 0) {
        console.log('Archivos disponibles para mostrar:', this.files.map(f => f.path));

        // Forzar múltiples notificaciones con retrasos para asegurar que la UI se actualice
        setTimeout(() => {
          console.log('Re-notificando a los listeners (1er reintento)');
          this.notifyFileListeners();

          setTimeout(() => {
            console.log('Re-notificando a los listeners (2do reintento)');
            this.notifyFileListeners();

            // Añadir mensaje informativo al chat sobre los archivos disponibles
            this.addChatMessage({
              id: generateUniqueId('msg-files-available'),
              sender: 'system',
              content: `Los archivos generados están disponibles en el explorador. Si no los ves, por favor actualiza la página.`,
              timestamp: Date.now(),
              type: 'notification'
            });
          }, 1000);
        }, 500);
      }

      // Mensaje de resumen final
      this.addChatMessage({
        id: generateUniqueId('msg-complete'),
        sender: 'assistant',
        content: `¡Proyecto "${projectName}" generado exitosamente! 🎉\n\nSe han creado ${fileCount} archivos (${fileTypes}).\n\nPuedes revisar los archivos en el explorador y pedirme modificaciones específicas si lo necesitas. También puedes descargar los archivos individualmente o continuar mejorando el proyecto con nuevas instrucciones.`,
        timestamp: Date.now(),
        type: 'text',
        metadata: {
          projectComplete: true,
          fileCount,
          fileTypes: fileTypes.split(', ')
        }
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Modifica el plan actual
   * @param instruction Instrucción de modificación
   */
  private async modifyPlan(instruction: string): Promise<void> {
    try {
      this.updatePhase('planning', 'planner');

      this.addLogEntry({
        id: generateUniqueId('log'),
        timestamp: Date.now(),
        phase: 'planning',
        agentType: 'planner',
        action: 'modifyPlan',
        details: 'Modificando el plan según las nuevas instrucciones...',
        relatedFiles: []
      });

      const plannerTask: AgentTask = {
        id: generateUniqueId('task'),
        type: 'planner',
        instruction,
        status: 'working',
        startTime: Date.now()
      };

      const planResult = await PlannerAgent.execute(plannerTask);

      if (!planResult.success || !planResult.data) {
        throw new Error(`Error al modificar el plan: ${planResult.error}`);
      }

      // Verificar que el resultado tenga la estructura esperada
      if (!planResult.data.projectStructure) {
        throw new Error('El plan modificado no contiene una estructura de proyecto válida');
      }

      // Adaptar el plan para el CodeGeneratorAgent
      const updatedPlan = {
        projectStructure: planResult.data.projectStructure,
        implementationSteps: planResult.data.implementationSteps || []
      };

      this.addLogEntry({
        id: generateUniqueId('log'),
        timestamp: Date.now(),
        phase: 'planning',
        agentType: 'planner',
        action: 'planModified',
        details: 'Plan modificado exitosamente. Preparando la generación de código actualizado...',
        relatedFiles: []
      });

      // Generar código con el plan actualizado
      await this.generateCodeFromPlan(updatedPlan);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Modifica el trabajo actual (código o archivos)
   * @param instruction Instrucción de modificación
   */
  private async modifyCurrentWork(instruction: string): Promise<void> {
    try {
      // Si no hay archivos para modificar, generar un error
      if (this.files.length === 0) {
        throw new Error('No hay archivos para modificar. Por favor, genera primero un proyecto.');
      }

      this.updatePhase('modifyingFile', 'codeModifier');

    this.addLogEntry({
      id: generateUniqueId('log'),
      timestamp: Date.now(),
      phase: 'modifyingFile',
      agentType: 'codeModifier',
      action: 'modifyCode',
      details: 'Modificando el código según las nuevas instrucciones...',
      relatedFiles: this.files.map(file => file.path)
    });

    // Crear una tarea para el agente de modificación
    const modifierTask: AgentTask = {
      id: generateUniqueId('task'),
      type: 'codeModifier',
      instruction,
      status: 'working',
      startTime: Date.now()
    };

    // Modificar cada archivo relevante
    const modifiedFiles: FileItem[] = [];

    for (const file of this.files) {
      try {
        const result = await CodeModifierAgent.execute(modifierTask, file);

        if (result.success && result.data) {
          const modifiedFile = result.data.modifiedFile;
          modifiedFiles.push(modifiedFile);

          // Actualizar el archivo en el estado
          this.files = this.files.map(f => f.id === modifiedFile.id ? modifiedFile : f);
        }
      } catch (error) {
        console.error(`Error al modificar el archivo ${file.path}:`, error);
      }
    }

    // Notificar a los listeners
    this.notifyFileListeners();

    this.addLogEntry({
      id: generateUniqueId('log'),
      timestamp: Date.now(),
      phase: 'modifyingFile',
      agentType: 'codeModifier',
      action: 'codeModified',
      details: `Código modificado exitosamente. Se han actualizado ${modifiedFiles.length} archivos.`,
      relatedFiles: modifiedFiles.map(file => file.path)
    });

    // Finalizar el flujo de trabajo
    this.updatePhase('complete', null);

    this.addChatMessage({
      id: generateUniqueId('msg'),
      sender: 'assistant',
      content: `He completado las modificaciones solicitadas. Se han actualizado ${modifiedFiles.length} archivos.`,
      timestamp: Date.now(),
      type: 'text'
    });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Genera código a partir de un plan
   * @param plan Plan del proyecto
   */
  private async generateCodeFromPlan(plan: any): Promise<void> {
    try {
      this.updatePhase('generatingCode', 'codeGenerator');

      // Verificar si el plan ya tiene la estructura esperada por el CodeGeneratorAgent
      let adaptedPlan = plan;

    // Si el plan tiene la estructura del PlannerAgent, adaptarlo
    if (plan.projectStructure && plan.implementationSteps) {
      const projectStructure = plan.projectStructure;

      // Verificar que la estructura del proyecto sea válida
      if (!projectStructure.files || !Array.isArray(projectStructure.files)) {
        throw new Error('El plan generado no contiene una estructura de proyecto válida');
      }

      // Adaptar el plan para el CodeGeneratorAgent
      adaptedPlan = {
        files: projectStructure.files,
        description: projectStructure.description || this.lastInstruction,
        name: projectStructure.name || 'Proyecto sin nombre',
        implementationSteps: plan.implementationSteps || []
      };
    }

    // Verificar que el plan adaptado tenga la estructura esperada
    if (!adaptedPlan.files || !Array.isArray(adaptedPlan.files)) {
      throw new Error('El plan no contiene una lista de archivos para generar');
    }

    this.addLogEntry({
      id: generateUniqueId('log'),
      timestamp: Date.now(),
      phase: 'generatingCode',
      agentType: 'codeGenerator',
      action: 'generateCode',
      details: `Generando código para ${adaptedPlan.files.length} archivos basados en el plan actualizado...`,
      relatedFiles: adaptedPlan.files.map(file => file.path)
    });

    const generatorTask: AgentTask = {
      id: generateUniqueId('task'),
      type: 'codeGenerator',
      instruction: this.lastInstruction,
      status: 'working',
      startTime: Date.now(),
      plan: adaptedPlan
    };

    const codeResult = await CodeGeneratorAgent.execute(generatorTask);

    if (!codeResult.success || !codeResult.data) {
      throw new Error(`Error al generar el código: ${codeResult.error}`);
    }

    const generatedFiles = codeResult.data.files || [];

    if (!generatedFiles.length) {
      throw new Error('No se generaron archivos. Por favor, intenta de nuevo.');
    }

    // Actualizar los archivos en el estado
    this.files = generatedFiles;
    this.notifyFileListeners();

    const fileNames = generatedFiles.map(file => file.path);

    // Añadir mensaje de bitácora sobre los archivos generados
    this.addLogEntry({
      id: generateUniqueId('log'),
      timestamp: Date.now(),
      phase: 'generatingCode',
      agentType: 'codeGenerator',
      action: 'codeGenerated',
      details: `Código generado exitosamente. Se han creado ${generatedFiles.length} archivos.`,
      relatedFiles: fileNames
    });

    // Añadir mensajes de chat para cada archivo generado
    for (const file of generatedFiles) {
      this.addChatMessage({
        id: generateUniqueId('msg-file'),
        sender: 'ai-agent',
        content: `Archivo creado: ${file.path}`,
        timestamp: Date.now(),
        type: 'file-creation',
        metadata: {
          fileId: file.id,
          filePath: file.path,
          fileType: file.type
        }
      });
    }

    // Añadir mensaje de resumen
    this.addChatMessage({
      id: generateUniqueId('msg-summary'),
      sender: 'assistant',
      content: `He generado ${generatedFiles.length} archivos para el proyecto actualizado.`,
      timestamp: Date.now(),
      type: 'text',
      metadata: {
        files: fileNames
      }
    });

    // Finalizar el flujo de trabajo
    this.updatePhase('complete', null);

    // Crear un mensaje de finalización detallado
    const projectName = this.projectPlan?.title || 'sin nombre';
    const fileCount = generatedFiles.length;
    const fileTypes = [...new Set(generatedFiles.map(file => file.type))].join(', ');

    this.addChatMessage({
      id: generateUniqueId('msg-complete'),
      sender: 'assistant',
      content: `¡Proyecto "${projectName}" actualizado exitosamente! 🎉\n\nSe han generado ${fileCount} archivos (${fileTypes}).\n\nPuedes revisar los archivos en el explorador y pedirme modificaciones específicas si lo necesitas. También puedes descargar los archivos individualmente o continuar mejorando el proyecto con nuevas instrucciones.`,
      timestamp: Date.now(),
      type: 'text',
      metadata: {
        projectComplete: true,
        fileCount,
        fileTypes: fileTypes.split(', ')
      }
    });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Solicita la aprobación para un archivo individual
   * @param file Archivo a aprobar
   * @param currentIndex Índice actual en la cola
   * @param totalFiles Total de archivos en la cola
   * @returns Promise<boolean> True si el archivo fue aprobado, false en caso contrario
   */
  private async requestFileApproval(file: any, currentIndex: number, totalFiles: number): Promise<boolean> {
    return new Promise((resolve) => {
      // Asegurarse de que file.path no sea undefined
      const filePath = file.path || 'archivo-sin-ruta';

      // Generar contenido para el archivo si no lo tiene
      if (!file.content) {
        console.log(`Generando contenido para archivo ${filePath}`);
        file.content = `// Contenido generado para ${filePath}\n// Este es un archivo de ejemplo`;
      }

      // Crear los elementos de aprobación
      const approvalItem: ApprovalItem = {
        id: generateUniqueId('approval-item'),
        title: filePath,
        description: file.description || `Archivo generado para ${filePath}. Revisa el contenido y aprueba si es correcto.`,
        type: 'file',
        path: filePath,
        language: this.detectLanguageFromPath(filePath),
        estimatedTime: this.estimateFileGenerationTime(file),
        priority: 'high',
        dependencies: [],
        content: file.content // Añadir el contenido del archivo para previsualización
      };

      // Crear la solicitud de aprobación
      const approvalData: ApprovalData = {
        id: generateUniqueId('approval'),
        title: `Archivo ${currentIndex} de ${totalFiles}: ${filePath}`,
        description: `Por favor, revisa y aprueba la generación de este archivo.`,
        type: 'file',
        items: [approvalItem],
        timestamp: Date.now()
      };

      // Registrar en consola para depuración
      console.log(`Solicitando aprobación para archivo: ${filePath}`);
      console.log(`Datos de aprobación:`, JSON.stringify({
        id: approvalData.id,
        title: approvalData.title,
        items: approvalData.items.length
      }, null, 2));

      // Mensaje del AgenteLector sobre la solicitud de aprobación
      this.addChatMessage({
        id: generateUniqueId('msg-lector-approval'),
        sender: 'ai-agent',
        content: `📝 **AgenteLector**: El Agente Diseñador ha preparado el archivo ${currentIndex} de ${totalFiles}: ${filePath}. Por favor, revisa y aprueba este archivo para continuar con el proceso.`,
        timestamp: Date.now(),
        type: 'agent-report',
        metadata: {
          agentType: 'lector',
          phase: 'awaitingApproval',
          filePath: filePath,
          currentIndex,
          totalFiles
        }
      });

      // Actualizar el estado para requerir aprobación
      this.requiresApproval = true;
      this.approvalData = approvalData;
      this.updatePhase('awaitingApproval', 'codeGenerator');

      // Notificar a los listeners
      this.notifyApprovalListeners();

      // Añadir mensaje de chat solicitando la aprobación
      this.addChatMessage({
        id: generateUniqueId('msg-file-approval'),
        sender: 'assistant',
        content: `Necesito tu aprobación para generar el archivo ${file.path} (${currentIndex} de ${totalFiles}).`,
        timestamp: Date.now(),
        type: 'approval-request',
        metadata: {
          approvalId: approvalData.id,
          filePath: file.path,
          currentIndex,
          totalFiles
        }
      });

      // Configurar el manejador de aprobación
      const approvalHandler = (approvalId: string, approved: boolean) => {
        if (approvalId === approvalData.id) {
          console.log(`Aprobación recibida para archivo: ${filePath}, aprobado: ${approved}`);

          // Si fue aprobado, crear el archivo en el sistema
          if (approved && approvalItem.content) {
            // Crear el archivo en el sistema usando la función importada
            const result = createFile(
              {
                path: filePath,
                content: approvalItem.content,
                language: approvalItem.language || this.detectLanguageFromPath(filePath)
              },
              this.files,
              this.fileListeners,
              this.addChatMessage.bind(this),
              generateUniqueId
            );

            // Actualizar la lista de archivos con el resultado
            if (result) {
              console.log(`Archivo creado exitosamente: ${filePath}`);
            } else {
              console.error(`Error al crear archivo: ${filePath}`);
            }
          }

          // Limpiar el estado de aprobación
          this.requiresApproval = false;
          this.approvalData = null;
          this.updatePhase('generatingCode', 'codeGenerator');

          // Eliminar este manejador
          this.removeApprovalHandler(approvalHandler);

          // Resolver la promesa con el resultado
          resolve(approved);
        }
      };

      // Añadir el manejador de aprobación
      this.addApprovalHandler(approvalHandler);
    });
  }

  // Manejadores de aprobación
  private approvalHandlers: ((approvalId: string, approved: boolean) => void)[] = [];

  /**
   * Añade un manejador de aprobación
   * @param handler Función a llamar cuando se recibe una aprobación
   */
  private addApprovalHandler(handler: (approvalId: string, approved: boolean) => void): void {
    this.approvalHandlers.push(handler);
  }

  /**
   * Elimina un manejador de aprobación
   * @param handler Manejador a eliminar
   */
  private removeApprovalHandler(handler: (approvalId: string, approved: boolean) => void): void {
    this.approvalHandlers = this.approvalHandlers.filter(h => h !== handler);
  }

  /**
   * Detecta el lenguaje de programación a partir de la extensión del archivo
   * @param path Ruta del archivo
   * @returns Lenguaje detectado
   */
  private detectLanguageFromPath(path: string | undefined): string {
    // Verificar que path no sea undefined o null
    if (!path) {
      return 'text';
    }

    // Extraer la extensión de forma segura
    const parts = path.split('.');
    const extension = parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';

    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'json': 'json',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rb': 'ruby',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin',
      'rs': 'rust',
      'md': 'markdown',
      'txt': 'text'
    };

    return languageMap[extension] || 'text';
  }

  /**
   * Estima el tiempo de generación de un archivo
   * @param file Archivo a estimar
   * @returns Tiempo estimado en minutos
   */
  private estimateFileGenerationTime(file: any): number {
    // Verificar que file no sea undefined o null
    if (!file) {
      return 1; // Tiempo base por defecto
    }

    // Estimar el tiempo basado en la descripción y el tipo de archivo
    const baseTime = 1; // Tiempo base en minutos

    // Ajustar según la complejidad descrita
    let complexityFactor = 1;
    const description = file.description || '';

    if (description.includes('complejo') || description.includes('compleja')) {
      complexityFactor = 2;
    }

    if (description.includes('simple') || description.includes('básico') || description.includes('básica')) {
      complexityFactor = 0.5;
    }

    // Ajustar según el tipo de archivo
    const path = file.path || '';

    // Extraer la extensión de forma segura
    let extension = '';
    if (path) {
      const parts = path.split('.');
      extension = parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
    }

    let typeFactor = 1;

    // Archivos de configuración suelen ser más rápidos
    if (['json', 'yml', 'yaml', 'toml', 'ini', 'config', 'md', 'txt'].includes(extension)) {
      typeFactor = 0.7;
    }

    // Archivos de código suelen ser más lentos
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rb', 'php'].includes(extension)) {
      typeFactor = 1.5;
    }

    // Estimar el tiempo total
    return Math.max(1, Math.round(baseTime * complexityFactor * typeFactor));
  }

  /**
   * Determina la prioridad de un archivo
   * @param file Archivo a evaluar
   * @param allFiles Todos los archivos del proyecto
   * @returns Prioridad del archivo
   */
  private determinePriority(file: any, allFiles: any[]): 'high' | 'medium' | 'low' {
    // Verificar que file no sea undefined o null
    if (!file) {
      return 'medium'; // Prioridad media por defecto
    }

    const path = file.path || '';

    // Verificar que path no sea undefined o vacío
    if (!path) {
      return 'medium'; // Prioridad media por defecto
    }

    // Archivos de configuración y principales tienen alta prioridad
    if (path.includes('config') ||
        path.includes('package.json') ||
        path.includes('tsconfig.json') ||
        path.includes('webpack') ||
        path.includes('index.') ||
        path.includes('main.') ||
        path.includes('app.')) {
      return 'high';
    }

    // Archivos de utilidades y componentes tienen prioridad media
    if (path.includes('util') ||
        path.includes('helper') ||
        path.includes('component') ||
        path.includes('service')) {
      return 'medium';
    }

    // El resto tiene prioridad baja
    return 'low';
  }

  /**
   * Encuentra las dependencias de un archivo
   * @param file Archivo a evaluar
   * @param allFiles Todos los archivos del proyecto
   * @returns Lista de IDs de archivos de los que depende
   */
  private findDependencies(file: any, allFiles: any[]): string[] {
    // Verificar que file no sea undefined o null
    if (!file || !file.path) {
      return [];
    }

    // Verificar que allFiles sea un array válido
    if (!Array.isArray(allFiles)) {
      return [];
    }

    // Esta es una implementación básica que podría mejorarse con análisis más sofisticado
    const dependencies: string[] = [];

    // Por ahora, asumimos que los archivos de configuración son dependencias de todos
    for (const otherFile of allFiles) {
      if (otherFile && otherFile.path && otherFile.path !== file.path) {
        const otherPath = otherFile.path || '';

        if (otherPath.includes('config') ||
            otherPath.includes('package.json') ||
            otherPath.includes('tsconfig.json') ||
            otherPath.includes('webpack')) {
          dependencies.push(otherPath);
        }
      }
    }

    return dependencies;
  }

  /**
   * Actualiza el progreso general de la generación de código
   * @param phase Fase actual
   * @param totalItems Total de elementos a procesar
   * @param completedItems Elementos completados
   */
  private updateProgress(phase: string, totalItems: number, completedItems: number): void {
    // Calcular el porcentaje de progreso
    const percentage = Math.round((completedItems / totalItems) * 100);

    // Crear o actualizar el objeto de progreso
    if (!this.progress) {
      this.progress = {
        percentage,
        currentPhase: phase,
        startTime: Date.now(),
        completedItems,
        totalItems,
        itemsProgress: {}
      };
    } else {
      this.progress.percentage = percentage;
      this.progress.currentPhase = phase;
      this.progress.completedItems = completedItems;
      this.progress.totalItems = totalItems;
    }

    // Notificar a los listeners
    this.notifyProgressListeners();

    // Añadir mensaje de chat con la actualización de progreso
    if (completedItems > 0 && completedItems % Math.max(1, Math.floor(totalItems / 5)) === 0) {
      this.addChatMessage({
        id: generateUniqueId('msg-progress'),
        sender: 'system',
        content: `Progreso: ${percentage}% (${completedItems} de ${totalItems} elementos completados)`,
        timestamp: Date.now(),
        type: 'progress-update',
        metadata: {
          progressPercentage: percentage,
          completedItems,
          totalItems
        }
      });
    }
  }

  /**
   * Actualiza el progreso de un elemento específico
   * @param id ID del elemento
   * @param title Título del elemento
   * @param percentage Porcentaje de progreso
   * @param status Estado del elemento
   */
  private updateItemProgress(id: string, title: string, percentage: number, status: 'pending' | 'in-progress' | 'completed' | 'failed'): void {
    // Verificar que exista el objeto de progreso
    if (!this.progress) {
      return;
    }

    // Actualizar el progreso del elemento
    this.progress.itemsProgress[id] = {
      id,
      title,
      percentage,
      status
    };

    // Notificar a los listeners
    this.notifyProgressListeners();
  }

  /**
   * Finaliza la generación de código después de la aprobación
   * @param approvedItems IDs de los elementos aprobados (para aprobación parcial)
   */
  private async finalizeCodeGeneration(approvedItems?: string[]): Promise<void> {
    try {
      // Actualizar el estado
      this.updatePhase('complete', null);

      // Añadir entrada de bitácora
      this.addLogEntry({
        id: generateUniqueId('log'),
        timestamp: Date.now(),
        phase: 'complete',
        agentType: 'system',
        action: 'completeGeneration',
        details: 'Generación de código completada exitosamente.',
        relatedFiles: this.files.map(file => file.path)
      });

      // Añadir mensaje de chat indicando la finalización
      this.addChatMessage({
        id: generateUniqueId('msg-complete'),
        sender: 'assistant',
        content: `He completado la generación de código. Se han creado ${this.files.length} archivos. ¿Hay algo más en lo que pueda ayudarte?`,
        timestamp: Date.now(),
        type: 'success',
        metadata: {
          files: this.files.map(file => file.path)
        }
      });

    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Implementa el diseño después de la aprobación
   * @param approvedItems IDs de los elementos aprobados (para aprobación parcial)
   */
  private async implementDesign(approvedItems?: string[]): Promise<void> {
    try {
      // Actualizar el estado
      this.updatePhase('designingUI', 'designArchitect');

      // Añadir entrada de bitácora
      this.addLogEntry({
        id: generateUniqueId('log'),
        timestamp: Date.now(),
        phase: 'designingUI',
        agentType: 'designArchitect',
        action: 'implementDesign',
        details: 'Implementando el diseño aprobado...',
        relatedFiles: []
      });

      // Implementar la lógica para generar los archivos de diseño
      // Esta parte se implementará cuando se cree el agente de diseño arquitectónico

    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Aplica las modificaciones después de la aprobación
   * @param approvedItems IDs de los elementos aprobados (para aprobación parcial)
   */
  private async applyModifications(approvedItems?: string[]): Promise<void> {
    try {
      // Actualizar el estado
      this.updatePhase('modifyingFile', 'codeModifier');

      // Añadir entrada de bitácora
      this.addLogEntry({
        id: generateUniqueId('log'),
        timestamp: Date.now(),
        phase: 'modifyingFile',
        agentType: 'codeModifier',
        action: 'applyModifications',
        details: 'Aplicando las modificaciones aprobadas...',
        relatedFiles: []
      });

      // Implementar la lógica para aplicar las modificaciones
      // Esta parte se implementará cuando se mejore el agente de modificación de código

    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Inicia o actualiza el indicador de progreso
   * @param phase Fase actual
   * @param totalItems Número total de elementos
   * @param completedItems Número de elementos completados
   * @param estimatedTimeRemaining Tiempo restante estimado en minutos
   */
  private updateProgress(phase: string, totalItems: number, completedItems: number, estimatedTimeRemaining?: number): void {
    const percentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    if (!this.progress) {
      // Crear un nuevo objeto de progreso
      this.progress = {
        percentage,
        currentPhase: phase,
        estimatedTimeRemaining,
        startTime: Date.now(),
        completedItems,
        totalItems,
        itemsProgress: {}
      };
    } else {
      // Actualizar el objeto de progreso existente
      this.progress = {
        ...this.progress,
        percentage,
        currentPhase: phase,
        estimatedTimeRemaining,
        completedItems,
        totalItems
      };
    }

    // Notificar a los listeners
    this.notifyProgressListeners();

    // Añadir mensaje de chat con la actualización de progreso
    this.addChatMessage({
      id: generateUniqueId('msg-progress'),
      sender: 'system',
      content: `Progreso: ${percentage.toFixed(0)}% completado. Fase actual: ${phase}.`,
      timestamp: Date.now(),
      type: 'progress-update',
      metadata: {
        progressPercentage: percentage,
        estimatedTimeRemaining,
        phase
      }
    });
  }

  /**
   * Actualiza el progreso de un elemento específico
   * @param itemId ID del elemento
   * @param title Título del elemento
   * @param percentage Porcentaje de progreso
   * @param status Estado del elemento
   */
  private updateItemProgress(itemId: string, title: string, percentage: number, status: 'pending' | 'in-progress' | 'completed' | 'failed'): void {
    if (!this.progress) {
      return;
    }

    // Actualizar el progreso del elemento
    this.progress.itemsProgress[itemId] = {
      id: itemId,
      title,
      percentage,
      status
    };

    // Recalcular el progreso general
    const items = Object.values(this.progress.itemsProgress);
    const totalPercentage = items.reduce((sum, item) => sum + item.percentage, 0);
    const completedItems = items.filter(item => item.status === 'completed').length;

    this.progress.percentage = items.length > 0 ? totalPercentage / items.length : 0;
    this.progress.completedItems = completedItems;

    // Notificar a los listeners
    this.notifyProgressListeners();
  }

  /**
   * Maneja errores durante la orquestación
   * @param error Error ocurrido
   */
  private handleError(error: any): void {
    console.error('Error en la orquestación iterativa de agentes:', error);

    // Determinar el tipo de error y proporcionar un mensaje más descriptivo
    let errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    let errorType = 'general';
    let errorSuggestion = 'Por favor, intenta de nuevo o proporciona más detalles sobre lo que deseas crear.';

    // Analizar el mensaje de error para proporcionar sugerencias específicas
    if (errorMessage.includes('plan generado no contiene')) {
      errorType = 'plan-invalid';
      errorSuggestion = 'Por favor, proporciona una descripción más detallada del proyecto que deseas crear.';
    } else if (errorMessage.includes('No se generaron archivos')) {
      errorType = 'no-files';
      errorSuggestion = 'Intenta proporcionar más detalles sobre la estructura y funcionalidad del proyecto.';
    } else if (errorMessage.includes('Error al generar el código')) {
      errorType = 'code-generation';
      errorSuggestion = 'Hubo un problema al generar el código. Intenta con una descripción más clara o un proyecto más simple.';
    } else if (errorMessage.includes('Error al mejorar el prompt')) {
      errorType = 'prompt-enhancement';
      errorSuggestion = 'Intenta describir tu proyecto de manera más clara y concisa.';
    } else if (errorMessage.includes('aprobación pendiente')) {
      errorType = 'approval-not-found';
      errorSuggestion = 'La solicitud de aprobación ya ha sido procesada o ha expirado. Continúa con el proceso actual.';
    }

    // Crear un ID único para el mensaje de error con más componentes para evitar colisiones
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    const randomStr = Math.random().toString(36).substring(2, 8);
    const errorId = `msg-error-${timestamp}-${randomNum}-${randomStr}`;

    console.log(`Generando mensaje de error con ID: ${errorId}`);

    // Añadir mensaje de error al chat
    this.addChatMessage({
      id: errorId,
      sender: 'system',
      content: `Error: ${errorMessage}\n\n${errorSuggestion}`,
      timestamp: Date.now(),
      type: 'notification',
      metadata: {
        errorType,
        originalError: errorMessage
      }
    });

    // Añadir entrada de bitácora sobre el error
    this.addLogEntry({
      id: generateUniqueId('log-error'),
      timestamp: Date.now(),
      phase: this.currentPhase,
      agentType: this.currentAgentType || 'system',
      action: 'error',
      details: `Error: ${errorMessage}`,
      relatedFiles: []
    });

    // Actualizar el estado
    this.updatePhase('awaitingInput', null);
    this.isProcessing = false;
  }

  /**
   * Lee el contenido de un archivo
   * @param path Ruta del archivo
   * @returns Contenido del archivo o null si no existe
   */
  public readFile(path: string): string | null {
    const file = this.files.find(f => f.path === path);
    return file ? file.content : null;
  }

  /**
   * Escribe contenido en un archivo
   * @param path Ruta del archivo
   * @param content Contenido a escribir
   * @returns true si se escribió correctamente, false en caso contrario
   */
  public writeFile(path: string, content: string): boolean {
    try {
      // Buscar si el archivo ya existe
      const existingFileIndex = this.files.findIndex(f => f.path === path);

      if (existingFileIndex >= 0) {
        // Actualizar el archivo existente
        const updatedFile = {
          ...this.files[existingFileIndex],
          content,
          isModified: true,
          lastModified: Date.now()
        };

        this.files = [
          ...this.files.slice(0, existingFileIndex),
          updatedFile,
          ...this.files.slice(existingFileIndex + 1)
        ];
      } else {
        // Crear un nuevo archivo
        const newFile: FileItem = {
          id: generateUniqueId('file'),
          path,
          content,
          type: path.split('.').pop() || 'txt',
          isModified: false,
          isNew: true,
          timestamp: Date.now(),
          lastModified: Date.now()
        };

        this.files.push(newFile);
      }

      // Notificar a los listeners
      this.notifyFileListeners();

      return true;
    } catch (error) {
      console.error('Error al escribir archivo:', error);
      return false;
    }
  }

  /**
   * Elimina un archivo
   * @param path Ruta del archivo
   * @returns true si se eliminó correctamente, false en caso contrario
   */
  public deleteFile(path: string): boolean {
    try {
      const fileIndex = this.files.findIndex(f => f.path === path);

      if (fileIndex >= 0) {
        this.files = [
          ...this.files.slice(0, fileIndex),
          ...this.files.slice(fileIndex + 1)
        ];

        // Notificar a los listeners
        this.notifyFileListeners();

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      return false;
    }
  }

  /**
   * Estima el tiempo de generación de un archivo en minutos
   * @param file Descripción del archivo
   * @returns Tiempo estimado en minutos
   */
  private estimateFileGenerationTime(file: any): number {
    // Verificar que file no sea undefined o null
    if (!file) {
      return 2; // Tiempo base por defecto
    }

    // Estimar basado en la complejidad del archivo
    let baseTime = 2; // Tiempo base en minutos

    // Ajustar según el tipo de archivo
    const extension = this.getFileExtension(file.path);

    // Archivos más complejos
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'cs'].includes(extension)) {
      baseTime += 3;
    }

    // Archivos de configuración o datos
    if (['json', 'yaml', 'xml', 'csv'].includes(extension)) {
      baseTime += 1;
    }

    // Archivos de estilo
    if (['css', 'scss', 'less'].includes(extension)) {
      baseTime += 2;
    }

    // Archivos de marcado
    if (['html', 'md', 'markdown'].includes(extension)) {
      baseTime += 1.5;
    }

    // Ajustar según la descripción (si contiene palabras clave que indican complejidad)
    const description = file.description || '';
    const complexityKeywords = ['complejo', 'avanzado', 'detallado', 'extenso', 'interactivo'];

    for (const keyword of complexityKeywords) {
      if (description.toLowerCase().includes(keyword)) {
        baseTime += 2;
        break;
      }
    }

    // Ajustar según las dependencias
    if (file.dependencies && Array.isArray(file.dependencies) && file.dependencies.length > 0) {
      baseTime += file.dependencies.length * 0.5;
    }

    return Math.ceil(baseTime);
  }

  /**
   * Detecta el lenguaje de programación a partir de la ruta del archivo
   * @param path Ruta del archivo
   * @returns Lenguaje de programación
   */
  private detectLanguageFromPath(path: string | undefined): string {
    // Verificar que path no sea undefined o null
    if (!path) {
      return 'Texto plano';
    }

    const extension = this.getFileExtension(path);

    const languageMap: { [key: string]: string } = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'jsx': 'React JSX',
      'tsx': 'React TSX',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'less': 'Less',
      'json': 'JSON',
      'md': 'Markdown',
      'py': 'Python',
      'java': 'Java',
      'c': 'C',
      'cpp': 'C++',
      'cs': 'C#',
      'go': 'Go',
      'rb': 'Ruby',
      'php': 'PHP',
      'swift': 'Swift',
      'kt': 'Kotlin',
      'rs': 'Rust',
      'sh': 'Shell',
      'bat': 'Batch',
      'ps1': 'PowerShell',
      'sql': 'SQL',
      'yaml': 'YAML',
      'yml': 'YAML',
      'xml': 'XML',
      'svg': 'SVG',
      'vue': 'Vue',
      'dart': 'Dart',
      'lua': 'Lua',
      'r': 'R'
    };

    return languageMap[extension] || 'Texto plano';
  }

  /**
   * Obtiene la extensión de un archivo a partir de su ruta
   * @param path Ruta del archivo
   * @returns Extensión del archivo
   */
  private getFileExtension(path: string | undefined): string {
    // Verificar que path no sea undefined o null
    if (!path) {
      return '';
    }

    const parts = path.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Determina la prioridad de un archivo basado en su importancia en el proyecto
   * @param file Descripción del archivo
   * @param allFiles Todas las descripciones de archivos
   * @returns Prioridad del archivo
   */
  private determinePriority(file: any, allFiles: any[]): 'high' | 'medium' | 'low' {
    // Verificar que file no sea undefined o null
    if (!file || !file.path) {
      return 'medium'; // Prioridad media por defecto
    }

    // Verificar que allFiles sea un array válido
    if (!Array.isArray(allFiles)) {
      return 'medium';
    }

    const path = file.path.toLowerCase();

    // Archivos de configuración principales son de alta prioridad
    if (path.includes('package.json') ||
        path.includes('tsconfig.json') ||
        path.includes('webpack.config') ||
        path.includes('babel.config') ||
        path.includes('requirements.txt') ||
        path.includes('setup.py') ||
        path.includes('pom.xml') ||
        path.includes('build.gradle')) {
      return 'high';
    }

    // Archivos principales son de alta prioridad
    if (path.includes('index.') ||
        path.includes('main.') ||
        path.includes('app.') ||
        path.includes('server.')) {
      return 'high';
    }

    // Archivos de los que dependen muchos otros son de alta prioridad
    const dependencyCount = allFiles.filter(f =>
      f && f.dependencies &&
      Array.isArray(f.dependencies) &&
      f.dependencies.some(d => d === file.path)
    ).length;

    if (dependencyCount > 3) {
      return 'high';
    } else if (dependencyCount > 1) {
      return 'medium';
    }

    // Archivos de prueba, documentación o ejemplos son de baja prioridad
    if (path.includes('test') ||
        path.includes('spec') ||
        path.includes('example') ||
        path.includes('doc') ||
        path.includes('readme')) {
      return 'low';
    }

    // Por defecto, prioridad media
    return 'medium';
  }

  /**
   * Encuentra las dependencias de un archivo
   * @param file Descripción del archivo
   * @param allFiles Todas las descripciones de archivos
   * @returns Array de rutas de archivos de los que depende
   */
  private findDependencies(file: any, allFiles: any[]): string[] {
    // Verificar que file no sea undefined o null
    if (!file || !file.path) {
      return [];
    }

    // Verificar que allFiles sea un array válido
    if (!Array.isArray(allFiles)) {
      return [];
    }

    // Si el archivo ya tiene dependencias definidas, usarlas
    if (file.dependencies && Array.isArray(file.dependencies)) {
      return file.dependencies;
    }

    const dependencies: string[] = [];
    const path = file.path.toLowerCase();

    // Inferir dependencias basadas en patrones comunes

    // Archivos de configuración
    if (path.includes('package.json')) {
      const tsconfig = allFiles.find(f => f && f.path && f.path.includes('tsconfig.json'));
      if (tsconfig && tsconfig.path) dependencies.push(tsconfig.path);
    }

    // Archivos de componentes React
    if (path.endsWith('.jsx') || path.endsWith('.tsx')) {
      // Buscar archivos de estilos relacionados
      const baseName = path.substring(0, path.lastIndexOf('.'));
      const styleFile = allFiles.find(f =>
        f && f.path && f.path.includes(baseName) &&
        (f.path.endsWith('.css') || f.path.endsWith('.scss') || f.path.endsWith('.less'))
      );

      if (styleFile && styleFile.path) dependencies.push(styleFile.path);

      // Buscar archivos de tipos relacionados
      const typeFile = allFiles.find(f =>
        f && f.path && f.path.includes(baseName) &&
        f.path.endsWith('.d.ts')
      );

      if (typeFile && typeFile.path) dependencies.push(typeFile.path);
    }

    // Archivos de implementación
    if (path.endsWith('.js') || path.endsWith('.ts')) {
      // Buscar archivos de interfaz relacionados
      const baseName = path.substring(0, path.lastIndexOf('.'));
      const interfaceFile = allFiles.find(f =>
        f && f.path && f.path.includes(baseName) &&
        f.path.endsWith('.interface.ts')
      );

      if (interfaceFile && interfaceFile.path) dependencies.push(interfaceFile.path);
    }

    return dependencies;
  }
}
