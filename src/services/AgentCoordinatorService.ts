import {
  AgentTask,
  AgentStatus,
  AgentResult,
  DesignArchitectResult,
  CodeGeneratorResult,
  DesignProposal,
  DesignComponent,
  FileItem
} from '../types';
import { DesignArchitectAgent } from '../agents/DesignArchitectAgent';
import { CodeGeneratorAgent } from '../agents/CodeGeneratorAgent';
import { generateUniqueId } from '../utils/idGenerator';

export interface CoordinatorTask {
  id: string;
  description: string;
  agentType: 'design' | 'code' | 'coordinator';
  status: AgentStatus;
  progress: number;
  startTime: number;
  endTime?: number;
  result?: any;
  error?: string;
  subtasks?: CoordinatorTask[];
}

export interface CoordinatorState {
  tasks: CoordinatorTask[];
  currentDesignProposal?: DesignProposal;
  generatedFiles: FileItem[];
  isActive: boolean;
  lastUpdate: number;
}

export interface CoordinatorListener {
  onTaskUpdate: (tasks: CoordinatorTask[]) => void;
  onFilesGenerated: (files: FileItem[]) => void;
  onDesignProposalUpdate: (proposal: DesignProposal | null) => void;
  onError: (error: string) => void;
}

/**
 * Servicio de Coordinación de Agentes
 *
 * Este servicio coordina la comunicación y el flujo de trabajo entre
 * el Agente de Diseño y el Agente de Código.
 */
export class AgentCoordinatorService {
  private static instance: AgentCoordinatorService;
  private state: CoordinatorState;
  private listeners: CoordinatorListener[] = [];

  /**
   * Constructor privado para implementar el patrón Singleton
   */
  private constructor() {
    this.state = {
      tasks: [],
      generatedFiles: [],
      isActive: false,
      lastUpdate: Date.now()
    };
  }

  /**
   * Obtiene la instancia única del servicio
   */
  public static getInstance(): AgentCoordinatorService {
    if (!AgentCoordinatorService.instance) {
      AgentCoordinatorService.instance = new AgentCoordinatorService();
    }
    return AgentCoordinatorService.instance;
  }

  /**
   * Añade un listener para recibir actualizaciones del coordinador
   */
  public addListener(listener: CoordinatorListener): void {
    this.listeners.push(listener);
  }

  /**
   * Elimina un listener
   */
  public removeListener(listener: CoordinatorListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notifica a todos los listeners sobre cambios en las tareas
   */
  private notifyTaskUpdate(): void {
    this.listeners.forEach(listener => {
      listener.onTaskUpdate([...this.state.tasks]);
    });
  }

  /**
   * Notifica a todos los listeners sobre archivos generados
   */
  private notifyFilesGenerated(): void {
    this.listeners.forEach(listener => {
      listener.onFilesGenerated([...this.state.generatedFiles]);
    });
  }

  /**
   * Notifica a todos los listeners sobre cambios en la propuesta de diseño
   */
  private notifyDesignProposalUpdate(): void {
    this.listeners.forEach(listener => {
      listener.onDesignProposalUpdate(this.state.currentDesignProposal || null);
    });
  }

  /**
   * Notifica a todos los listeners sobre errores
   */
  private notifyError(error: string): void {
    this.listeners.forEach(listener => {
      listener.onError(error);
    });
  }

  /**
   * Inicia el proceso de generación de un sitio web estático completo
   */
  public async generateWebsite(description: string): Promise<{
    designProposal: DesignProposal | null;
    files: FileItem[];
    tasks: CoordinatorTask[];
  }> {
    try {
      // Reiniciar el estado
      this.state = {
        tasks: [],
        generatedFiles: [],
        isActive: true,
        lastUpdate: Date.now()
      };

      // 1. Crear tarea principal del coordinador para sitio web estático
      const mainTask: CoordinatorTask = {
        id: generateUniqueId('task-coordinator'),
        description: `Generar sitio web estático: ${description}`,
        agentType: 'coordinator',
        status: 'working',
        progress: 0,
        startTime: Date.now(),
        subtasks: []
      };

      this.state.tasks.push(mainTask);
      this.notifyTaskUpdate();

      // 2. Crear y ejecutar tarea para el Agente de Diseño
      const designTask = this.createTask('design', `Generar propuesta de diseño para: ${description}`);
      mainTask.subtasks = [designTask];
      this.notifyTaskUpdate();

      // 3. Ejecutar el Agente de Diseño
      const designResult = await this.executeDesignAgent(designTask, description);

      // 4. Si el diseño falló, terminar el proceso
      if (!designResult.success || !designResult.data?.proposal) {
        this.updateTaskStatus(designTask.id, 'failed', designResult.error || 'Error desconocido en el Agente de Diseño');
        this.updateTaskStatus(mainTask.id, 'failed', designResult.error || 'Error desconocido en el Agente de Diseño');
        this.state.isActive = false;
        this.notifyTaskUpdate();
        this.notifyError(designResult.error || 'Error desconocido en el Agente de Diseño');

        return {
          designProposal: null,
          files: [],
          tasks: this.state.tasks
        };
      }

      // 5. Actualizar el estado con la propuesta de diseño
      this.state.currentDesignProposal = designResult.data.proposal;
      this.notifyDesignProposalUpdate();

      // 6. Crear y ejecutar tarea para el Agente de Código
      const codeTask = this.createTask('code', `Generar código basado en la propuesta de diseño`);
      mainTask.subtasks?.push(codeTask);
      this.notifyTaskUpdate();

      // 7. Ejecutar el Agente de Código
      const codeResult = await this.executeCodeAgent(codeTask, this.state.currentDesignProposal, description);

      // 8. Si el código falló, terminar el proceso
      if (!codeResult.success) {
        this.updateTaskStatus(codeTask.id, 'failed', codeResult.error || 'Error desconocido en el Agente de Código');
        this.updateTaskStatus(mainTask.id, 'failed', codeResult.error || 'Error desconocido en el Agente de Código');
        this.state.isActive = false;
        this.notifyTaskUpdate();
        this.notifyError(codeResult.error || 'Error desconocido en el Agente de Código');

        return {
          designProposal: this.state.currentDesignProposal,
          files: this.state.generatedFiles,
          tasks: this.state.tasks
        };
      }

      // 9. Actualizar el estado con los archivos generados
      if (codeResult.data?.files) {
        this.state.generatedFiles = [...this.state.generatedFiles, ...codeResult.data.files];
        this.notifyFilesGenerated();
      }

      // 10. Actualizar el estado de la tarea principal
      this.updateTaskStatus(mainTask.id, 'completed');
      this.state.isActive = false;
      this.notifyTaskUpdate();

      return {
        designProposal: this.state.currentDesignProposal,
        files: this.state.generatedFiles,
        tasks: this.state.tasks
      };
    } catch (error) {
      console.error('Error en AgentCoordinatorService.generateWebsite:', error);

      // Actualizar el estado
      this.state.isActive = false;
      this.notifyError(error instanceof Error ? error.message : 'Error desconocido en el coordinador de agentes');

      return {
        designProposal: this.state.currentDesignProposal || null,
        files: this.state.generatedFiles,
        tasks: this.state.tasks
      };
    }
  }

  /**
   * Crea una nueva tarea
   */
  private createTask(
    agentType: 'design' | 'code' | 'coordinator',
    description: string
  ): CoordinatorTask {
    const task: CoordinatorTask = {
      id: generateUniqueId(`task-${agentType}`),
      description,
      agentType,
      status: 'working',
      progress: 0,
      startTime: Date.now()
    };

    this.state.tasks.push(task);
    return task;
  }

  /**
   * Actualiza el estado de una tarea
   */
  private updateTaskStatus(
    taskId: string,
    status: AgentStatus,
    error?: string,
    progress?: number
  ): void {
    // Buscar la tarea en el array principal
    const task = this.state.tasks.find(t => t.id === taskId);

    if (task) {
      task.status = status;
      if (error) task.error = error;
      if (progress !== undefined) task.progress = progress;
      if (status === 'completed' || status === 'failed') {
        task.endTime = Date.now();
      }
      this.notifyTaskUpdate();
      return;
    }

    // Si no se encuentra en el array principal, buscar en subtareas
    for (const parentTask of this.state.tasks) {
      if (parentTask.subtasks) {
        const subtask = parentTask.subtasks.find(t => t.id === taskId);
        if (subtask) {
          subtask.status = status;
          if (error) subtask.error = error;
          if (progress !== undefined) subtask.progress = progress;
          if (status === 'completed' || status === 'failed') {
            subtask.endTime = Date.now();
          }
          this.notifyTaskUpdate();
          return;
        }
      }
    }
  }

  /**
   * Ejecuta el Agente de Diseño
   */
  private async executeDesignAgent(
    task: CoordinatorTask,
    description: string
  ): Promise<DesignArchitectResult> {
    try {
      // Crear tarea para el agente
      const agentTask: AgentTask = {
        id: generateUniqueId('agent-task'),
        type: 'designArchitect',
        instruction: description,
        status: 'working',
        startTime: Date.now()
      };

      // Actualizar progreso
      this.updateTaskStatus(task.id, 'working', undefined, 25);

      // Ejecutar el agente
      const result = await DesignArchitectAgent.execute(agentTask);

      // Actualizar el estado de la tarea
      if (result.success) {
        this.updateTaskStatus(task.id, 'completed', undefined, 100);
      } else {
        this.updateTaskStatus(task.id, 'failed', result.error, 100);
      }

      return result;
    } catch (error) {
      console.error('Error en executeDesignAgent:', error);
      this.updateTaskStatus(task.id, 'failed', error instanceof Error ? error.message : 'Error desconocido', 100);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en el Agente de Diseño'
      };
    }
  }

  /**
   * Ejecuta el Agente de Código especializado para sitios web estáticos
   */
  private async executeCodeAgent(
    task: CoordinatorTask,
    designProposal: DesignProposal,
    projectContext: string
  ): Promise<CodeGeneratorResult> {
    try {
      // Crear subtareas para archivos específicos de sitio web estático
      const staticWebFiles = this.generateStaticWebFileStructure(designProposal, projectContext);
      const fileTasks: CoordinatorTask[] = [];

      for (const fileDesc of staticWebFiles) {
        const fileTask = this.createTask('code', `Generar archivo: ${fileDesc.path}`);
        fileTasks.push(fileTask);
      }

      task.subtasks = fileTasks;
      this.notifyTaskUpdate();

      // Procesar cada archivo
      const generatedFiles: FileItem[] = [];

      for (let i = 0; i < staticWebFiles.length; i++) {
        const fileDescription = staticWebFiles[i];
        const fileTask = fileTasks[i];

        // Actualizar progreso
        this.updateTaskStatus(fileTask.id, 'working', undefined, 25);

        // Crear tarea para el agente
        const agentTask: AgentTask = {
          id: generateUniqueId('agent-task'),
          type: 'codeGenerator',
          instruction: `Generar archivo de sitio web estático: ${fileDescription.path}`,
          status: 'working',
          startTime: Date.now()
        };

        // Ejecutar el agente
        const result = await CodeGeneratorAgent.execute(agentTask, fileDescription, projectContext);

        // Actualizar el estado de la tarea
        if (result.success && result.data?.files) {
          this.updateTaskStatus(fileTask.id, 'completed', undefined, 100);
          generatedFiles.push(...result.data.files);
        } else {
          this.updateTaskStatus(fileTask.id, 'failed', result.error, 100);
        }

        // Actualizar progreso de la tarea principal
        const progress = Math.floor(((i + 1) / staticWebFiles.length) * 100);
        this.updateTaskStatus(task.id, 'working', undefined, progress);
      }

      // Actualizar el estado de la tarea principal
      this.updateTaskStatus(task.id, 'completed', undefined, 100);

      return {
        success: true,
        data: { files: generatedFiles }
      };
    } catch (error) {
      console.error('Error en executeCodeAgent:', error);
      this.updateTaskStatus(task.id, 'failed', error instanceof Error ? error.message : 'Error desconocido', 100);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en el Agente de Código'
      };
    }
  }

  /**
   * Genera la estructura de archivos específica para sitios web estáticos
   */
  private generateStaticWebFileStructure(designProposal: DesignProposal, projectContext: string): any[] {
    const files = [];

    // 1. Archivo HTML principal (index.html)
    files.push({
      path: 'index.html',
      description: `Página principal del sitio web estático. Debe incluir: estructura HTML5 semántica, meta tags SEO optimizados, contenido específico basado en "${projectContext}", navegación, secciones principales, y enlaces a styles.css y script.js. El contenido debe ser completamente personalizado y relevante al contexto del proyecto.`,
      dependencies: ['styles.css', 'script.js']
    });

    // 2. Archivo CSS principal (styles.css)
    files.push({
      path: 'styles.css',
      description: `Hoja de estilos principal para el sitio web estático. Debe incluir: reset CSS, variables CSS para colores y espaciado, diseño responsive mobile-first, estilos para todos los componentes del HTML, animaciones suaves, hover effects, tipografía optimizada con Google Fonts, y paleta de colores coherente con el contexto "${projectContext}".`,
      dependencies: []
    });

    // 3. Archivo JavaScript principal (script.js)
    files.push({
      path: 'script.js',
      description: `Script principal para interactividad del sitio web estático. Debe incluir: JavaScript vanilla moderno, event listeners para navegación y formularios, animaciones suaves, validación de formularios (si aplica), efectos visuales, y funcionalidades específicas relevantes al contexto "${projectContext}". Sin dependencias externas.`,
      dependencies: []
    });

    // 4. Páginas adicionales según el contexto
    if (designProposal.components && designProposal.components.length > 0) {
      // Analizar los componentes para determinar páginas adicionales
      const hasAboutSection = designProposal.components.some(c =>
        c.type?.toLowerCase().includes('about') ||
        c.name?.toLowerCase().includes('sobre') ||
        c.description?.toLowerCase().includes('historia')
      );

      const hasContactSection = designProposal.components.some(c =>
        c.type?.toLowerCase().includes('contact') ||
        c.name?.toLowerCase().includes('contacto') ||
        c.description?.toLowerCase().includes('formulario')
      );

      const hasServicesSection = designProposal.components.some(c =>
        c.type?.toLowerCase().includes('service') ||
        c.name?.toLowerCase().includes('servicio') ||
        c.description?.toLowerCase().includes('producto')
      );

      // Página "Sobre Nosotros" si es relevante
      if (hasAboutSection) {
        files.push({
          path: 'about.html',
          description: `Página "Sobre Nosotros" del sitio web estático. Debe incluir: estructura HTML5 semántica, información detallada sobre la empresa/proyecto basada en "${projectContext}", historia, misión, visión, equipo, y navegación consistente con index.html. Contenido completamente personalizado.`,
          dependencies: ['styles.css', 'script.js']
        });
      }

      // Página de servicios/productos si es relevante
      if (hasServicesSection) {
        files.push({
          path: 'services.html',
          description: `Página de servicios/productos del sitio web estático. Debe incluir: estructura HTML5 semántica, descripción detallada de servicios/productos específicos para "${projectContext}", precios (si aplica), características, beneficios, y navegación consistente. Contenido completamente personalizado.`,
          dependencies: ['styles.css', 'script.js']
        });
      }

      // Página de contacto si es relevante
      if (hasContactSection) {
        files.push({
          path: 'contact.html',
          description: `Página de contacto del sitio web estático. Debe incluir: estructura HTML5 semántica, formulario de contacto funcional, información de contacto específica para "${projectContext}", mapa (si aplica), redes sociales, y navegación consistente. Formulario con validación JavaScript.`,
          dependencies: ['styles.css', 'script.js']
        });
      }
    }

    return files;
  }
}

export default AgentCoordinatorService;
