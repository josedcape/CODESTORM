import { TechnologyStack } from '../types/technologyStacks';
import { FileItem, ChatMessage, ApprovalData, ProgressData } from '../types';
import { generateUniqueId } from '../utils/idGenerator';
import { tryWithFallback } from './ai';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  data?: any;
}

export interface DevelopmentPlan {
  id: string;
  title: string;
  description: string;
  steps: {
    id: string;
    title: string;
    description: string;
    estimatedTime: string;
    dependencies: string[];
    files: string[];
  }[];
  technologies: string[];
  architecture: string;
  estimatedDuration: string;
  complexity: 'low' | 'medium' | 'high';
}

export interface TemplateOption {
  id: string;
  name: string;
  description: string;
  category: string;
  technologies: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  preview?: string;
}

export interface WorkflowState {
  currentStep: number;
  steps: WorkflowStep[];
  userInstruction: string;
  selectedStack?: TechnologyStack;
  selectedTemplate?: TemplateOption;
  developmentPlan?: DevelopmentPlan;
  isProcessing: boolean;
  requiresApproval: boolean;
  approvalData?: ApprovalData;
}

export class ConstructorWorkflowService {
  private static instance: ConstructorWorkflowService;
  private workflowState: WorkflowState;
  private listeners: {
    stateChange: ((state: WorkflowState) => void)[];
    chatMessage: ((message: ChatMessage) => void)[];
    fileUpdate: ((files: FileItem[]) => void)[];
    progress: ((progress: ProgressData) => void)[];
  };

  private constructor() {
    this.workflowState = {
      currentStep: 0,
      steps: [
        {
          id: 'instruction-input',
          name: 'Instrucción del Usuario',
          description: 'Recibir y procesar la instrucción inicial del usuario',
          status: 'pending'
        },
        {
          id: 'stack-selection',
          name: 'Selección de Stack Tecnológico',
          description: 'Elegir el stack de tecnologías más adecuado',
          status: 'pending'
        },
        {
          id: 'template-selection',
          name: 'Selección de Plantilla',
          description: 'Seleccionar una plantilla base para el proyecto',
          status: 'pending'
        },
        {
          id: 'plan-generation',
          name: 'Generación del Plan',
          description: 'Crear un plan detallado de desarrollo',
          status: 'pending'
        },
        {
          id: 'plan-approval',
          name: 'Aprobación del Plan',
          description: 'Revisar y aprobar el plan de desarrollo',
          status: 'pending'
        },
        {
          id: 'agent-coordination',
          name: 'Coordinación de Agentes',
          description: 'Ejecutar el desarrollo usando agentes especializados',
          status: 'pending'
        }
      ],
      userInstruction: '',
      isProcessing: false,
      requiresApproval: false
    };

    this.listeners = {
      stateChange: [],
      chatMessage: [],
      fileUpdate: [],
      progress: []
    };
  }

  public static getInstance(): ConstructorWorkflowService {
    if (!ConstructorWorkflowService.instance) {
      ConstructorWorkflowService.instance = new ConstructorWorkflowService();
    }
    return ConstructorWorkflowService.instance;
  }

  // Event listeners
  public addStateChangeListener(callback: (state: WorkflowState) => void): void {
    this.listeners.stateChange.push(callback);
  }

  public removeStateChangeListener(callback: (state: WorkflowState) => void): void {
    this.listeners.stateChange = this.listeners.stateChange.filter(cb => cb !== callback);
  }

  public addChatMessageListener(callback: (message: ChatMessage) => void): void {
    this.listeners.chatMessage.push(callback);
  }

  public removeChatMessageListener(callback: (message: ChatMessage) => void): void {
    this.listeners.chatMessage = this.listeners.chatMessage.filter(cb => cb !== callback);
  }

  public addFileUpdateListener(callback: (files: FileItem[]) => void): void {
    this.listeners.fileUpdate.push(callback);
  }

  public removeFileUpdateListener(callback: (files: FileItem[]) => void): void {
    this.listeners.fileUpdate = this.listeners.fileUpdate.filter(cb => cb !== callback);
  }

  public addProgressListener(callback: (progress: ProgressData) => void): void {
    this.listeners.progress.push(callback);
  }

  public removeProgressListener(callback: (progress: ProgressData) => void): void {
    this.listeners.progress = this.listeners.progress.filter(cb => cb !== callback);
  }

  // Emit events
  private emitStateChange(): void {
    this.listeners.stateChange.forEach(callback => callback(this.workflowState));
  }

  private emitChatMessage(message: ChatMessage): void {
    this.listeners.chatMessage.forEach(callback => callback(message));
  }

  private emitFileUpdate(files: FileItem[]): void {
    this.listeners.fileUpdate.forEach(callback => callback(files));
  }

  private emitProgress(progress: ProgressData): void {
    this.listeners.progress.forEach(callback => callback(progress));
  }

  // Workflow methods
  public async startWorkflow(instruction: string): Promise<void> {
    this.workflowState.userInstruction = instruction;
    this.workflowState.currentStep = 0;
    this.workflowState.steps[0].status = 'completed';
    this.workflowState.steps[0].data = { instruction };

    // Move to stack selection
    this.workflowState.currentStep = 1;
    this.workflowState.steps[1].status = 'in-progress';

    this.emitChatMessage({
      id: generateUniqueId('chat'),
      sender: 'ai',
      content: '✅ Instrucción recibida. Ahora selecciona el stack tecnológico más adecuado para tu proyecto.',
      timestamp: Date.now(),
      type: 'notification',
      senderType: 'ai'
    });

    this.emitStateChange();
  }

  public async selectTechnologyStack(stack: TechnologyStack): Promise<void> {
    this.workflowState.selectedStack = stack;
    this.workflowState.steps[1].status = 'completed';
    this.workflowState.steps[1].data = { stack };

    // Move to template selection
    this.workflowState.currentStep = 2;
    this.workflowState.steps[2].status = 'in-progress';

    this.emitChatMessage({
      id: generateUniqueId('chat'),
      sender: 'ai',
      content: `✅ Stack seleccionado: ${stack.name}. Ahora elige una plantilla que se adapte a tu proyecto.`,
      timestamp: Date.now(),
      type: 'notification',
      senderType: 'ai'
    });

    this.emitStateChange();
  }

  public async selectTemplate(template: TemplateOption): Promise<void> {
    this.workflowState.selectedTemplate = template;
    this.workflowState.steps[2].status = 'completed';
    this.workflowState.steps[2].data = { template };

    // Move to plan generation
    this.workflowState.currentStep = 3;
    this.workflowState.steps[3].status = 'in-progress';
    this.workflowState.isProcessing = true;

    this.emitChatMessage({
      id: generateUniqueId('chat'),
      sender: 'ai',
      content: `✅ Plantilla seleccionada: ${template.name}. Generando plan de desarrollo detallado...`,
      timestamp: Date.now(),
      type: 'notification',
      senderType: 'ai'
    });

    this.emitStateChange();

    // Generate development plan
    await this.generateDevelopmentPlan();
  }

  private async generateDevelopmentPlan(): Promise<void> {
    try {
      const { userInstruction, selectedStack, selectedTemplate } = this.workflowState;

      const planPrompt = `
Crea un plan de desarrollo detallado para el siguiente proyecto:

INSTRUCCIÓN DEL USUARIO: ${userInstruction}
STACK TECNOLÓGICO: ${selectedStack?.name} - ${selectedStack?.description}
PLANTILLA: ${selectedTemplate?.name} - ${selectedTemplate?.description}

Genera un plan estructurado en formato JSON con:
1. Título del proyecto
2. Descripción general
3. Pasos de desarrollo (mínimo 5, máximo 10)
4. Arquitectura propuesta
5. Estimación de duración
6. Nivel de complejidad

Cada paso debe incluir:
- Título descriptivo
- Descripción detallada
- Tiempo estimado
- Archivos a crear/modificar
- Dependencias con otros pasos

Responde SOLO con el JSON, sin texto adicional.
`;

      const response = await tryWithFallback(planPrompt, 'Claude 3.5 Sonnet V2');
      
      // Parse the response to extract the development plan
      const plan = this.parseDevelopmentPlan(response.content);
      
      this.workflowState.developmentPlan = plan;
      this.workflowState.steps[3].status = 'completed';
      this.workflowState.steps[3].data = { plan };

      // Move to plan approval
      this.workflowState.currentStep = 4;
      this.workflowState.steps[4].status = 'in-progress';
      this.workflowState.isProcessing = false;
      this.workflowState.requiresApproval = true;
      this.workflowState.approvalData = {
        id: generateUniqueId('approval'),
        type: 'plan',
        title: 'Aprobación del Plan de Desarrollo',
        description: 'Revisa el plan generado y decide si proceder',
        data: plan,
        timestamp: Date.now()
      };

      this.emitChatMessage({
        id: generateUniqueId('chat'),
        sender: 'ai',
        content: '📋 Plan de desarrollo generado. Por favor, revísalo y apruébalo para continuar.',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai'
      });

      this.emitStateChange();

    } catch (error) {
      console.error('Error generating development plan:', error);
      this.workflowState.steps[3].status = 'failed';
      this.workflowState.isProcessing = false;
      
      this.emitChatMessage({
        id: generateUniqueId('chat'),
        sender: 'ai',
        content: '❌ Error al generar el plan de desarrollo. Por favor, intenta nuevamente.',
        timestamp: Date.now(),
        type: 'error',
        senderType: 'ai'
      });

      this.emitStateChange();
    }
  }

  private parseDevelopmentPlan(content: string): DevelopmentPlan {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          id: generateUniqueId('plan'),
          title: parsed.title || 'Plan de Desarrollo',
          description: parsed.description || 'Plan generado automáticamente',
          steps: parsed.steps || [],
          technologies: parsed.technologies || [],
          architecture: parsed.architecture || 'Arquitectura estándar',
          estimatedDuration: parsed.estimatedDuration || '2-4 semanas',
          complexity: parsed.complexity || 'medium'
        };
      }
    } catch (error) {
      console.error('Error parsing development plan:', error);
    }

    // Fallback plan if parsing fails
    return {
      id: generateUniqueId('plan'),
      title: 'Plan de Desarrollo',
      description: 'Plan básico generado para el proyecto',
      steps: [
        {
          id: generateUniqueId('step'),
          title: 'Configuración inicial',
          description: 'Configurar el entorno de desarrollo',
          estimatedTime: '1-2 horas',
          dependencies: [],
          files: ['package.json', 'README.md']
        }
      ],
      technologies: this.workflowState.selectedStack?.technologies.map(t => t.name) || [],
      architecture: 'Arquitectura estándar',
      estimatedDuration: '1-2 semanas',
      complexity: 'medium'
    };
  }

  public async approvePlan(approved: boolean): Promise<void> {
    if (approved) {
      this.workflowState.steps[4].status = 'completed';
      this.workflowState.currentStep = 5;
      this.workflowState.steps[5].status = 'in-progress';
      this.workflowState.requiresApproval = false;
      this.workflowState.approvalData = undefined;

      this.emitChatMessage({
        id: generateUniqueId('chat'),
        sender: 'ai',
        content: '✅ Plan aprobado. Iniciando coordinación de agentes especializados...',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai'
      });

      // Start agent coordination
      await this.startAgentCoordination();
    } else {
      this.workflowState.steps[4].status = 'failed';
      this.workflowState.requiresApproval = false;
      this.workflowState.approvalData = undefined;

      this.emitChatMessage({
        id: generateUniqueId('chat'),
        sender: 'ai',
        content: '❌ Plan rechazado. Puedes modificar los parámetros y generar un nuevo plan.',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai'
      });
    }

    this.emitStateChange();
  }

  private async startAgentCoordination(): Promise<void> {
    // This will integrate with the existing agent system
    this.emitChatMessage({
      id: generateUniqueId('chat'),
      sender: 'ai',
      content: '🤖 Iniciando sistema de agentes especializados para el desarrollo del proyecto...',
      timestamp: Date.now(),
      type: 'notification',
      senderType: 'ai'
    });

    // TODO: Integrate with existing AIIterativeOrchestrator
    this.workflowState.steps[5].status = 'completed';
    this.emitStateChange();
  }

  public getWorkflowState(): WorkflowState {
    return { ...this.workflowState };
  }

  public resetWorkflow(): void {
    this.workflowState = {
      currentStep: 0,
      steps: this.workflowState.steps.map(step => ({ ...step, status: 'pending', data: undefined })),
      userInstruction: '',
      isProcessing: false,
      requiresApproval: false
    };
    this.emitStateChange();
  }
}
