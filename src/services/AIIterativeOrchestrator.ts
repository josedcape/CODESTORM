import {
  AgentTask,
  FileItem,
  ChatMessage,
  AIPhase,
  AILogEntry,
  AIWorkflowState,
  ApprovalData,
  ApprovalItem,
  ProgressData,
  DesignArchitectResult
} from '../types';
import { PromptEnhancerService } from './PromptEnhancerService';
import { PlannerAgent } from '../agents/PlannerAgent';
import { OptimizedPlannerAgent } from '../agents/OptimizedPlannerAgent';
import { CodeGeneratorAgent } from '../agents/CodeGeneratorAgent';
import { CodeModifierAgent } from '../agents/CodeModifierAgent';
import { FileObserverAgent } from '../agents/FileObserverAgent';
import { DesignArchitectAgent } from '../agents/DesignArchitectAgent';
import { InteractiveModificationService, ModificationRequest, ModificationContext } from './InteractiveModificationService';
import { StackIntegrationService } from './StackIntegrationService';
import { TechnologyStack } from '../types/technologyStacks';
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
  private approvalListeners: ((approvalData: ApprovalData | null) => void)[] = [];
  private progressListeners: ((progressData: ProgressData | null) => void)[] = [];

  private currentPhase: AIPhase = 'awaitingInput';
  private currentAgentType: string | null = null;
  private lastInstruction: string = '';
  private isProcessing: boolean = false;
  private requiresApproval: boolean = false;
  private approvalData: ApprovalData | null = null;
  private progress: ProgressData | null = null;
  private isPaused: boolean = false;

  // Manejadores de aprobación
  private approvalHandlers: ((approvalId: string, approved: boolean, approvedItems?: string[]) => void)[] = [];

  // Servicio de modificación interactiva
  private modificationService: InteractiveModificationService;

  // Servicio de integración de stack tecnológico
  private stackIntegrationService: StackIntegrationService;
  private selectedStack: TechnologyStack | null = null;

  /**
   * Constructor privado para implementar el patrón Singleton
   */
  private constructor() {
    this.modificationService = InteractiveModificationService.getInstance();
    this.stackIntegrationService = StackIntegrationService.getInstance();
    this.setupModificationListeners();
  }

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
   * Establece el stack tecnológico seleccionado
   * @param stack Stack tecnológico seleccionado
   */
  public setSelectedStack(stack: TechnologyStack): void {
    this.selectedStack = stack;
    console.log(`[AIIterativeOrchestrator] Stack tecnológico seleccionado: ${stack.name}`);
  }

  /**
   * Obtiene el stack tecnológico seleccionado
   * @returns Stack tecnológico actual o null
   */
  public getSelectedStack(): TechnologyStack | null {
    return this.selectedStack;
  }

  /**
   * Limpia el stack tecnológico seleccionado
   */
  public clearSelectedStack(): void {
    this.selectedStack = null;
    console.log('[AIIterativeOrchestrator] Stack tecnológico limpiado');
  }

  /**
   * Configura los listeners para el servicio de modificación interactiva
   */
  private setupModificationListeners(): void {
    this.modificationService.addModificationListener((request: ModificationRequest) => {
      // Añadir mensaje al chat sobre el progreso de la modificación
      this.addChatMessage({
        id: generateUniqueId('mod-msg'),
        sender: 'ai-agent',
        content: `🔧 **Sistema de Modificación**: ${this.getModificationStatusMessage(request)}`,
        timestamp: Date.now(),
        type: request.status === 'failed' ? 'error' : 'info',
        metadata: {
          agentType: 'modificationService',
          phase: 'interactiveModification',
          requestId: request.id,
          requestType: request.type
        }
      });

      // Si la modificación se completó exitosamente, actualizar archivos
      if (request.status === 'completed' && request.result?.success) {
        this.files = request.result.files;
        this.notifyFileListeners();

        // Emitir eventos para sincronización
        request.result.files.forEach(file => {
          this.updateFilesInState(file);
        });
      }
    });
  }

  /**
   * Obtiene el mensaje de estado para una solicitud de modificación
   * @param request Solicitud de modificación
   * @returns Mensaje de estado
   */
  private getModificationStatusMessage(request: ModificationRequest): string {
    switch (request.status) {
      case 'pending':
        return `Solicitud de ${request.type} pendiente: ${request.instruction}`;
      case 'processing':
        return `Procesando ${request.type}: ${request.instruction}`;
      case 'completed':
        return request.result?.message || `${request.type} completado exitosamente`;
      case 'failed':
        return `Error en ${request.type}: ${request.result?.error || 'Error desconocido'}`;
      default:
        return `Estado desconocido para ${request.type}`;
    }
  }

  /**
   * Procesa una instrucción interactiva del usuario (modificación, creación, etc.)
   * @param instruction Instrucción del usuario
   * @returns Promise que se resuelve cuando se completa la operación
   */
  async processInteractiveInstruction(instruction: string): Promise<void> {
    try {
      console.log('[AIIterativeOrchestrator] Procesando instrucción interactiva:', instruction);

      // Verificar si es una instrucción de modificación interactiva
      if (this.isInteractiveModification(instruction)) {
        await this.handleInteractiveModification(instruction);
      } else {
        // Procesar como instrucción normal
        await this.processInstruction(instruction);
      }

    } catch (error) {
      console.error('[AIIterativeOrchestrator] Error en instrucción interactiva:', error);
      this.handleError(error);
    }
  }

  /**
   * Determina si una instrucción es una modificación interactiva
   * @param instruction Instrucción del usuario
   * @returns true si es una modificación interactiva
   */
  private isInteractiveModification(instruction: string): boolean {
    const lowerInstruction = instruction.toLowerCase();

    // Palabras clave que indican modificación interactiva
    const modificationKeywords = [
      'modifica', 'cambia', 'actualiza', 'edita', 'modify', 'change', 'update', 'edit',
      'añade', 'agrega', 'incluye', 'add', 'include',
      'elimina', 'borra', 'quita', 'remove', 'delete',
      'crea', 'nuevo', 'create', 'new',
      'renombra', 'rename'
    ];

    // Verificar si hay archivos existentes (necesario para modificaciones)
    const hasExistingFiles = this.files.length > 0;

    // Verificar si la instrucción contiene palabras clave de modificación
    const hasModificationKeywords = modificationKeywords.some(keyword =>
      lowerInstruction.includes(keyword)
    );

    // Verificar si menciona archivos específicos
    const mentionsSpecificFiles = this.files.some(file =>
      lowerInstruction.includes(file.name.toLowerCase()) ||
      lowerInstruction.includes(file.path.toLowerCase())
    );

    return hasExistingFiles && (hasModificationKeywords || mentionsSpecificFiles);
  }

  /**
   * Maneja una modificación interactiva
   * @param instruction Instrucción de modificación
   */
  private async handleInteractiveModification(instruction: string): Promise<void> {
    try {
      this.updatePhase('interactiveModification', 'modificationService');

      // Crear contexto de modificación
      const context: ModificationContext = {
        projectFiles: this.files,
        projectDescription: this.projectPlan?.description || this.lastInstruction,
        recentChanges: this.modificationService.getModificationHistory().slice(-5)
      };

      // Procesar la modificación
      const result = await this.modificationService.processModificationInstruction(
        instruction,
        context
      );

      if (result.success) {
        // Actualizar archivos locales
        this.files = result.files;
        this.notifyFileListeners();

        // Añadir mensaje de éxito
        this.addChatMessage({
          id: generateUniqueId('mod-success'),
          sender: 'assistant',
          content: `✅ ${result.message}\n\n**Cambios realizados:**\n${result.changes.map(change =>
            `• ${change.type.toUpperCase()}: ${change.file} - ${change.description}`
          ).join('\n')}`,
          timestamp: Date.now(),
          type: 'success'
        });

        // Actualizar fase
        this.updatePhase('awaitingInput', null);

      } else {
        throw new Error(result.error || 'Error en la modificación interactiva');
      }

    } catch (error) {
      console.error('[AIIterativeOrchestrator] Error en modificación interactiva:', error);
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
      this.updateProgress(10, 'Iniciando generación de código...');

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

      // Generar código para cada archivo
      this.updateProgress(30, 'Generando archivos del proyecto...');
      const generatedFiles = await this.generateFilesFromPlan(adaptedPlan);

      // Generar archivos de interfaz visual automáticamente (HTML/CSS)
      this.updateProgress(60, 'Generando interfaz visual...');
      const visualFiles = await this.generateVisualInterface(this.lastInstruction, adaptedPlan);
      const allFiles = [...generatedFiles, ...visualFiles];

      // Mejorar los archivos HTML con el Agente de Diseño
      this.updateProgress(70, 'Mejorando diseño visual...');
      const enhancedFiles = await this.enhanceHTMLWithDesign(allFiles, adaptedPlan);

      // Generar todos los archivos automáticamente sin solicitar aprobación adicional
      this.updateProgress(90, 'Finalizando generación de archivos...');
      await this.processGeneratedFiles(enhancedFiles);

      return;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Genera archivos a partir del plan
   * @param plan Plan adaptado
   * @returns Archivos generados
   */
  private async generateFilesFromPlan(plan: any): Promise<any[]> {
    try {
      const generatedFiles = [];

      // Añadir mensaje del AgenteLector sobre la generación de código
      this.addChatMessage({
        id: generateUniqueId('msg-lector-generating'),
        sender: 'ai-agent',
        content: `🔨 **AgenteLector**: El Agente Generador de Código está creando ${plan.files.length} archivos según el plan aprobado.`,
        timestamp: Date.now(),
        type: 'agent-report',
        metadata: {
          agentType: 'lector',
          phase: 'generatingCode',
          totalFiles: plan.files.length
        }
      });

      // Generar cada archivo del plan
      for (let i = 0; i < plan.files.length; i++) {
        const file = plan.files[i];
        try {
          // Actualizar progreso por archivo
          const fileProgress = 30 + (40 * (i + 1) / plan.files.length);
          this.updateProgress(fileProgress, `Generando ${file.path}...`);

          // Verificar si es un archivo específico del stack que ya tiene contenido
          if (this.selectedStack && this.isStackSpecificFile(file.path)) {
            const stackFile = this.getStackFileContent(file.path);
            if (stackFile) {
              // Usar el contenido predefinido del stack
              generatedFiles.push({
                ...file,
                content: stackFile.content,
                language: stackFile.language
              });

              this.addChatMessage({
                id: generateUniqueId(`msg-stack-file-${file.path}`),
                sender: 'ai-agent',
                content: `📦 **Stack ${this.selectedStack.name}**: Archivo de configuración ${file.path} generado usando plantilla del stack.`,
                timestamp: Date.now(),
                type: 'progress',
                metadata: {
                  agentType: 'stackIntegration',
                  phase: 'generatingCode',
                  filePath: file.path,
                  stackName: this.selectedStack.name
                }
              });

              continue; // Saltar a la siguiente iteración
            }
          }

          // Crear una tarea para el agente de generación de código
          const codeGenTask: AgentTask = {
            id: generateUniqueId('task'),
            type: 'codeGenerator',
            instruction: this.selectedStack
              ? `Generar código para ${file.path} usando el stack ${this.selectedStack.name}: ${file.description || 'Archivo del proyecto'}`
              : `Generar código para ${file.path}: ${file.description || 'Archivo del proyecto'}`,
            status: 'working',
            startTime: Date.now(),
            metadata: {
              selectedStack: this.selectedStack ? {
                id: this.selectedStack.id,
                name: this.selectedStack.name,
                technologies: this.selectedStack.technologies
              } : undefined
            }
          };

          // Ejecutar el agente de generación de código
          const codeGenResult = await CodeGeneratorAgent.execute(codeGenTask, file, plan.description);

          if (!codeGenResult.success || !codeGenResult.data) {
            console.error(`Error al generar código para ${file.path}:`, codeGenResult.error);
            continue;
          }

          // Verificar que el resultado tenga la estructura esperada
          if (!codeGenResult.data.file && (!codeGenResult.data.files || codeGenResult.data.files.length === 0)) {
            console.error(`Error: No se encontró información de archivo en el resultado para ${file.path}`);

            // Generar un contenido por defecto para evitar errores
            const defaultContent = `// Contenido por defecto para ${file.path}\n// El generador de código no pudo crear contenido válido para este archivo`;

            // Añadir el archivo generado a la lista con contenido por defecto
            generatedFiles.push({
              ...file,
              content: defaultContent,
              language: this.detectLanguageFromPath(file.path)
            });

            // Añadir mensaje de advertencia
            this.addChatMessage({
              id: generateUniqueId(`msg-warning-${file.path}`),
              sender: 'ai-agent',
              content: `⚠️ **AgenteGenerador**: Advertencia: No se pudo generar contenido válido para ${file.path}. Se ha creado un archivo con contenido por defecto.`,
              timestamp: Date.now(),
              type: 'warning',
              metadata: {
                agentType: 'codeGenerator',
                phase: 'generatingCode',
                filePath: file.path
              }
            });
          } else {
            // Obtener el contenido del archivo generado
            let fileContent;

            if (codeGenResult.data.file && codeGenResult.data.file.content) {
              // Si tenemos un solo archivo con contenido
              fileContent = codeGenResult.data.file.content;
            } else if (codeGenResult.data.files && codeGenResult.data.files.length > 0) {
              // Si tenemos un array de archivos, buscar el que coincida con la ruta actual
              const matchingFile = codeGenResult.data.files.find(f => f.path === file.path);
              fileContent = matchingFile?.content;
            }

            // Verificar que el contenido no sea undefined
            if (!fileContent) {
              console.error(`Error: El contenido generado para ${file.path} es undefined o vacío`);

              // Generar un contenido por defecto para evitar errores
              const defaultContent = `// Contenido por defecto para ${file.path}\n// El generador de código no pudo crear contenido válido para este archivo`;

              // Añadir el archivo generado a la lista con contenido por defecto
              generatedFiles.push({
                ...file,
                content: defaultContent,
                language: this.detectLanguageFromPath(file.path)
              });

              // Añadir mensaje de advertencia
              this.addChatMessage({
                id: generateUniqueId(`msg-warning-${file.path}`),
                sender: 'ai-agent',
                content: `⚠️ **AgenteGenerador**: Advertencia: No se pudo generar contenido válido para ${file.path}. Se ha creado un archivo con contenido por defecto.`,
                timestamp: Date.now(),
                type: 'warning',
                metadata: {
                  agentType: 'codeGenerator',
                  phase: 'generatingCode',
                  filePath: file.path
                }
              });
            } else {
              // Añadir el archivo generado a la lista con el contenido generado
              generatedFiles.push({
                ...file,
                content: fileContent,
                language: this.detectLanguageFromPath(file.path)
              });
            }
          }
        } catch (error) {
          console.error(`Error al generar código para ${file.path}:`, error);
        }
      }

      return generatedFiles;
    } catch (error) {
      console.error('Error al generar archivos:', error);
      return plan.files; // Devolver los archivos originales en caso de error
    }
  }

  /**
   * Mejora los archivos HTML con el Agente de Diseño
   * @param files Archivos generados
   * @param plan Plan del proyecto
   * @returns Archivos mejorados
   */
  private async enhanceHTMLWithDesign(files: any[], plan: any): Promise<any[]> {
    try {
      // Verificar que todos los archivos tengan contenido
      const validFiles = files.filter(file => file && file.content !== undefined);

      if (validFiles.length < files.length) {
        console.warn(`Se encontraron ${files.length - validFiles.length} archivos sin contenido que serán ignorados`);

        // Añadir mensaje de advertencia
        this.addChatMessage({
          id: generateUniqueId('msg-warning-files'),
          sender: 'ai-agent',
          content: `⚠️ **AgenteLector**: Advertencia: Se encontraron ${files.length - validFiles.length} archivos sin contenido que serán ignorados durante el proceso de diseño.`,
          timestamp: Date.now(),
          type: 'warning',
          metadata: {
            agentType: 'lector',
            phase: 'designing',
            totalFiles: files.length,
            validFiles: validFiles.length
          }
        });
      }

      // Identificar archivos HTML
      const htmlFiles = validFiles.filter(file =>
        file.path.endsWith('.html') ||
        file.language === 'html' ||
        (file.content && file.content.includes('<!DOCTYPE html>'))
      );

      if (htmlFiles.length === 0) {
        console.log('No se encontraron archivos HTML para mejorar con el Agente de Diseño');
        return files;
      }

      // Añadir mensaje del AgenteLector sobre el Agente de Diseño
      this.addChatMessage({
        id: generateUniqueId('msg-lector-design'),
        sender: 'ai-agent',
        content: `🎨 **AgenteLector**: El Agente de Diseño está mejorando ${htmlFiles.length} archivos HTML con estilos visuales y animaciones.`,
        timestamp: Date.now(),
        type: 'agent-report',
        metadata: {
          agentType: 'lector',
          phase: 'designing',
          totalFiles: htmlFiles.length
        }
      });

      // Actualizar el estado
      this.updatePhase('designing', 'designArchitect');

      // Crear una tarea para el agente de diseño
      const designTask: AgentTask = {
        id: generateUniqueId('task'),
        type: 'designArchitect',
        instruction: `Mejorar los archivos HTML del proyecto "${plan.name || 'sin nombre'}" con estilos visuales y animaciones. Mantener un diseño futurista en azul oscuro coherente con CODESTORM.`,
        status: 'working',
        startTime: Date.now(),
        plan: plan
      };

      // Ejecutar el agente de diseño
      const designResult = await DesignArchitectAgent.execute(designTask);

      if (!designResult.success || !designResult.data) {
        console.error('Error al mejorar los archivos HTML:', designResult.error);
        return files;
      }

      // Actualizar los archivos con los mejorados por el Agente de Diseño
      const enhancedFiles = [...files];

      // Reemplazar los archivos HTML y CSS originales con los mejorados
      if (designResult.data.files && designResult.data.files.length > 0) {
        for (const enhancedFile of designResult.data.files) {
          // Verificar que el archivo mejorado tenga contenido
          if (enhancedFile.content === undefined) {
            console.warn(`El archivo mejorado ${enhancedFile.path} no tiene contenido y será ignorado`);
            continue;
          }

          const index = enhancedFiles.findIndex(f => f.path === enhancedFile.path);

          if (index !== -1) {
            // Reemplazar el archivo existente
            enhancedFiles[index] = {
              ...enhancedFiles[index],
              content: enhancedFile.content,
              enhanced: true
            };
          } else {
            // Añadir el nuevo archivo (probablemente un CSS)
            enhancedFiles.push({
              ...enhancedFile,
              id: generateUniqueId('file'),
              enhanced: true,
              // Asegurarse de que tenga todos los campos necesarios
              language: this.detectLanguageFromPath(enhancedFile.path),
              type: 'file',
              size: enhancedFile.content.length,
              lastModified: Date.now()
            });
          }
        }
      }

      return enhancedFiles;
    } catch (error) {
      console.error('Error al mejorar los archivos HTML:', error);
      return files; // Devolver los archivos originales en caso de error
    }
  }

  /**
   * Procesa los archivos generados automáticamente sin solicitar aprobación
   * @param files Archivos a procesar
   */
  private async processGeneratedFiles(files: any[]): Promise<void> {
    try {
      console.log(`Procesando automáticamente ${files.length} archivos generados`);

      // Añadir mensaje de chat informando sobre el inicio del proceso
      this.addChatMessage({
        id: generateUniqueId('msg-processing-files'),
        sender: 'ai-agent',
        content: `🔄 **AgenteLector**: Iniciando la generación automática de ${files.length} archivos. Este proceso puede tomar unos minutos...`,
        timestamp: Date.now(),
        type: 'notification',
        metadata: {
          agentType: 'lector',
          phase: 'codeGeneration',
          totalFiles: files.length
        }
      });

      // Actualizar el estado
      this.updatePhase('generating', 'codeGenerator');

      const processFiles = async () => {
        const generatedFiles: FileItem[] = [];

        for (const file of files) {
          try {
            // Asegurarse de que file.path no sea undefined
            const filePath = file.path || `archivo-${generatedFiles.length + 1}`;

            // Verificar si el archivo ya existe
            const existingFile = this.files.find(f => f.path === filePath);
            const fileExists = !!existingFile;

            // Añadir mensaje de progreso
            this.addChatMessage({
              id: generateUniqueId(`msg-generating-${filePath}`),
              sender: 'ai-agent',
              content: `⚙️ **AgenteGenerador**: ${fileExists ? 'Actualizando' : 'Generando'} archivo: ${filePath}`,
              timestamp: Date.now(),
              type: 'progress',
              metadata: {
                agentType: 'codeGenerator',
                phase: 'generating',
                filePath: filePath
              }
            });

            // Verificar que file.content no sea undefined
            if (file.content === undefined) {
              throw new Error(`El contenido del archivo ${filePath} es undefined`);
            }

            // Crear el archivo
            const fileItem: FileItem = {
              id: generateUniqueId('file'),
              name: filePath.split('/').pop() || '',
              path: filePath,
              content: file.content,
              language: this.detectLanguageFromPath(filePath),
              type: 'file',
              size: file.content ? file.content.length : 0,
              lastModified: Date.now()
            };

            // Escribir el archivo
            const writeResult = await this.writeFile(fileItem.path, fileItem.content);

            if (writeResult.success) {
              generatedFiles.push(fileItem);

              // Añadir el archivo a la lista de archivos
              this.files = this.files.filter(f => f.path !== filePath);
              this.files.push(fileItem);

              // Notificar a los listeners de archivos
              this.notifyFileListeners();

              // Actualizar archivos en el estado global
              this.updateFilesInState(fileItem);
            }
          } catch (error) {
            console.error(`Error al procesar el archivo ${file.path}:`, error);

            // Añadir mensaje de error
            this.addChatMessage({
              id: generateUniqueId(`msg-error-${file.path}`),
              sender: 'ai-agent',
              content: `❌ **AgenteGenerador**: Error al generar el archivo ${file.path}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
              timestamp: Date.now(),
              type: 'error',
              metadata: {
                agentType: 'codeGenerator',
                phase: 'generating',
                filePath: file.path,
                error: error instanceof Error ? error.message : 'Error desconocido'
              }
            });
          }
        }

        // Actualizar el estado final
        this.updatePhase('awaitingInput', null);

        // Notificar a todos los listeners del estado final
        this.notifyStateListeners();
      };

      await processFiles();

    } catch (error) {
      console.error('Error en processGeneratedFiles:', error);
      this.handleError(error);
    }
  }

  /**
   * Prepara la aprobación por lotes de archivos (método mantenido para compatibilidad)
   * @param files Archivos a aprobar en lote
   * @deprecated Usar processGeneratedFiles en su lugar
   */
  private async prepareFileBatchApproval(files: any[]): Promise<void> {
    // Redirigir al nuevo método de procesamiento automático
    await this.processGeneratedFiles(files);
  }

  /**
   * Maneja la aprobación por lotes de archivos
   * @param approvalId ID de la solicitud de aprobación
   * @param approved Indica si fue aprobada
   * @param approvedItems IDs de los elementos aprobados (para aprobación parcial)
   */
  private handleBatchApproval(approvalId: string, approved: boolean, approvedItems?: string[]): void {
    try {
      console.log(`Manejando aprobación por lotes con ID ${approvalId}, aprobado: ${approved}`);

      if (!this.approvalData || this.approvalData.id !== approvalId) {
        console.warn('No hay una solicitud de aprobación por lotes pendiente o el ID no coincide');
        return;
      }

      // Obtener los elementos aprobados
      const items = this.approvalData.items || [];
      let itemsToProcess: ApprovalItem[] = [];

      if (approved) {
        // Si se aprobaron todos los archivos
        itemsToProcess = items;

        this.addChatMessage({
          id: generateUniqueId('msg-batch-approved'),
          sender: 'ai-agent',
          content: `✅ **AgenteLector**: El usuario ha aprobado todos los archivos. Procediendo a crear ${items.length} archivos.`,
          timestamp: Date.now(),
          type: 'agent-report',
          metadata: {
            agentType: 'lector',
            phase: 'generatingCode',
            totalFiles: items.length
          }
        });
      } else if (approvedItems && approvedItems.length > 0) {
        // Si se aprobaron algunos archivos específicos
        itemsToProcess = items.filter(item => approvedItems.includes(item.id));

        this.addChatMessage({
          id: generateUniqueId('msg-batch-partially-approved'),
          sender: 'ai-agent',
          content: `✅ **AgenteLector**: El usuario ha aprobado ${itemsToProcess.length} de ${items.length} archivos. Procediendo a crear los archivos seleccionados.`,
          timestamp: Date.now(),
          type: 'agent-report',
          metadata: {
            agentType: 'lector',
            phase: 'generatingCode',
            approvedFiles: itemsToProcess.length,
            totalFiles: items.length
          }
        });
      } else {
        // Si se rechazaron todos los archivos
        this.addChatMessage({
          id: generateUniqueId('msg-batch-rejected'),
          sender: 'ai-agent',
          content: `❌ **AgenteLector**: El usuario ha rechazado todos los archivos. Se detendrá el proceso de generación.`,
          timestamp: Date.now(),
          type: 'agent-report',
          metadata: {
            agentType: 'lector',
            phase: 'awaitingInput'
          }
        });

        // Limpiar el estado de aprobación
        this.requiresApproval = false;
        this.approvalData = null;
        this.approvalHandlers = [];
        this.updatePhase('awaitingInput', null);
        return;
      }

      // Procesar los archivos aprobados
      this.processApprovedFiles(itemsToProcess);

      // Limpiar el estado de aprobación
      this.requiresApproval = false;
      this.approvalData = null;
      this.approvalHandlers = [];
      this.updatePhase('generatingCode', 'codeGenerator');
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Procesa los archivos aprobados creándolos en el sistema
   * @param approvedItems Elementos aprobados para crear
   */
  private processApprovedFiles(approvedItems: ApprovalItem[]): void {
    try {
      console.log(`Procesando ${approvedItems.length} archivos aprobados`);

      // Clasificar archivos por tipo
      const htmlFiles: ApprovalItem[] = [];
      const cssFiles: ApprovalItem[] = [];
      const otherFiles: ApprovalItem[] = [];

      // Clasificar los archivos
      for (const item of approvedItems) {
        if (item.path?.endsWith('.html') || item.language === 'html') {
          htmlFiles.push(item);
        } else if (item.path?.endsWith('.css') || item.language === 'css') {
          cssFiles.push(item);
        } else {
          otherFiles.push(item);
        }
      }

      // Procesar primero los archivos CSS (para que estén disponibles para los HTML)
      this.processFileGroup(cssFiles);

      // Procesar archivos HTML
      this.processFileGroup(htmlFiles);

      // Procesar el resto de archivos
      this.processFileGroup(otherFiles);

      // Notificar que se completó la generación de archivos
      this.addChatMessage({
        id: generateUniqueId('msg-batch-complete'),
        sender: 'ai-agent',
        content: `🎉 **AgenteLector**: Se ha completado la generación de ${approvedItems.length} archivos. El proyecto está listo para su uso.`,
        timestamp: Date.now(),
        type: 'agent-report',
        metadata: {
          agentType: 'lector',
          phase: 'complete',
          totalFiles: approvedItems.length,
          htmlFiles: htmlFiles.length,
          cssFiles: cssFiles.length,
          otherFiles: otherFiles.length
        }
      });

      // Añadir mensaje específico sobre los archivos mejorados por el Agente de Diseño
      if (htmlFiles.length > 0 || cssFiles.length > 0) {
        this.addChatMessage({
          id: generateUniqueId('msg-design-complete'),
          sender: 'ai-agent',
          content: `✨ **AgenteDiseño**: He mejorado ${htmlFiles.length} archivos HTML con estilos visuales y animaciones, manteniendo un diseño futurista en azul oscuro coherente con CODESTORM.`,
          timestamp: Date.now(),
          type: 'agent-report',
          metadata: {
            agentType: 'designArchitect',
            phase: 'complete',
            htmlFiles: htmlFiles.length,
            cssFiles: cssFiles.length
          }
        });
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Procesa un grupo de archivos
   * @param items Elementos a procesar
   */
  private processFileGroup(items: ApprovalItem[]): void {
    for (const item of items) {
      if (item.content) {
        const filePath = item.path;
        const fileExists = this.files.some(f => f.path === filePath);

        // Crear o actualizar el archivo
        const result = this.writeFile(filePath, item.content);

        if (result.success) {
          console.log(`Archivo ${fileExists ? 'actualizado' : 'creado'} exitosamente: ${filePath}`);

          // Añadir mensaje informativo al chat
          this.addChatMessage({
            id: generateUniqueId(`msg-file-${fileExists ? 'updated' : 'created'}`),
            sender: 'ai-agent',
            content: `✅ **AgenteLector**: Archivo ${fileExists ? 'actualizado' : 'creado'} exitosamente: ${filePath}`,
            timestamp: Date.now(),
            type: 'agent-report',
            metadata: {
              agentType: 'lector',
              phase: 'generatingCode',
              filePath: filePath,
              action: fileExists ? 'update' : 'create'
            }
          });
        } else {
          console.error(`Error al ${fileExists ? 'actualizar' : 'crear'} archivo: ${filePath}`);

          // Añadir mensaje de error al chat
          this.addChatMessage({
            id: generateUniqueId('msg-file-error'),
            sender: 'system',
            content: `Error al ${fileExists ? 'actualizar' : 'crear'} el archivo ${filePath}. Por favor, intenta nuevamente.`,
            timestamp: Date.now(),
            type: 'error'
          });
        }
      }
    }
  }

  /**
   * Escribe un archivo en el sistema
   * @param filePath Ruta del archivo
   * @param content Contenido del archivo
   * @returns Objeto con success y data
   */
  private writeFile(filePath: string, content: string): { success: boolean; data?: any; error?: string } {
    try {
      // Validar que filePath sea una cadena
      if (typeof filePath !== 'string') {
        throw new Error(`filePath debe ser una cadena, recibido: ${typeof filePath}`);
      }

      // Validar que content sea una cadena
      if (typeof content !== 'string') {
        throw new Error(`content debe ser una cadena, recibido: ${typeof content}`);
      }

      // Crear el archivo directamente sin usar createFile para evitar problemas de sincronización
      const fileItem: FileItem = {
        id: generateUniqueId('file'),
        name: filePath.split('/').pop() || '',
        path: filePath,
        content: content,
        language: this.detectLanguageFromPath(filePath),
        type: 'file',
        size: content.length,
        lastModified: Date.now()
      };

      // Verificar si el archivo ya existe
      const existingFileIndex = this.files.findIndex(f => f.path === filePath);

      if (existingFileIndex >= 0) {
        // Actualizar archivo existente
        this.files[existingFileIndex] = { ...this.files[existingFileIndex], ...fileItem };
      } else {
        // Agregar nuevo archivo
        this.files.push(fileItem);
      }

      // Emitir evento personalizado para sincronización con Constructor
      this.updateFilesInState(fileItem);

      return { success: true, data: fileItem };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error(`Error al escribir el archivo ${filePath}:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Actualiza los archivos en el estado global para sincronización con el Constructor
   * @param fileItem Archivo a actualizar
   */
  private updateFilesInState(fileItem: FileItem): void {
    try {
      // Emitir evento personalizado para notificar al Constructor
      const event = new CustomEvent('codestorm-file-created', {
        detail: {
          file: fileItem,
          source: 'AIIterativeOrchestrator'
        }
      });

      window.dispatchEvent(event);

      console.log(`Archivo sincronizado con el Constructor: ${fileItem.path}`);
    } catch (error) {
      console.warn('Error al sincronizar archivo con el Constructor:', error);
    }
  }

  /**
   * Asegura que el proyecto incluya archivos web básicos (HTML y CSS)
   * @param files Lista de archivos del plan
   * @returns Lista de archivos con archivos web garantizados
   */
  private ensureWebFiles(files: any[]): any[] {
    const webFiles = [...files];

    // Verificar si ya existe un archivo HTML principal
    const hasIndexHtml = webFiles.some(file =>
      file.path && file.path.toLowerCase().includes('index.html')
    );

    // Verificar si ya existe un archivo CSS
    const hasCssFile = webFiles.some(file =>
      file.path && file.path.toLowerCase().endsWith('.css')
    );

    // Añadir index.html si no existe
    if (!hasIndexHtml) {
      webFiles.unshift({
        path: 'index.html',
        description: 'Página principal HTML del proyecto - generada automáticamente por CODESTORM',
        type: 'file',
        priority: 'high'
      });
    }

    // Añadir styles.css si no existe
    if (!hasCssFile) {
      webFiles.push({
        path: 'styles.css',
        description: 'Archivo de estilos CSS del proyecto - generado automáticamente por CODESTORM',
        type: 'file',
        priority: 'medium'
      });
    }

    // Añadir script.js si el proyecto parece necesitar JavaScript y no existe
    const hasJsFile = webFiles.some(file =>
      file.path && file.path.toLowerCase().endsWith('.js')
    );

    if (!hasJsFile && this.shouldIncludeJavaScript(webFiles)) {
      webFiles.push({
        path: 'script.js',
        description: 'Archivo JavaScript del proyecto - generado automáticamente por CODESTORM',
        type: 'file',
        priority: 'low'
      });
    }

    return webFiles;
  }

  /**
   * Determina si el proyecto debería incluir JavaScript
   * @param files Lista de archivos del proyecto
   * @returns true si debería incluir JavaScript
   */
  private shouldIncludeJavaScript(files: any[]): boolean {
    // Incluir JavaScript si el proyecto parece ser interactivo
    const projectDescription = this.projectPlan?.description?.toLowerCase() || '';

    const interactiveKeywords = [
      'interactivo', 'interactive', 'click', 'button', 'form', 'formulario',
      'animation', 'animación', 'dynamic', 'dinámico', 'calculator', 'calculadora',
      'game', 'juego', 'app', 'aplicación', 'todo', 'counter', 'contador'
    ];

    return interactiveKeywords.some(keyword =>
      projectDescription.includes(keyword)
    );
  }

  /**
   * Detecta el lenguaje de programación a partir de la extensión del archivo
   * @param filePath Ruta del archivo
   * @returns Lenguaje de programación detectado
   */
  private detectLanguageFromPath(filePath: string): string {
    // Validar que filePath sea una cadena
    if (typeof filePath !== 'string') {
      console.warn(`detectLanguageFromPath: filePath debe ser una cadena, recibido: ${typeof filePath}`, filePath);
      return 'plaintext';
    }

    const extension = filePath.split('.').pop()?.toLowerCase() || '';

    const extensionMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
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
      'rs': 'rust'
    };

    return extensionMap[extension] || 'plaintext';
  }

  /**
   * Estima el tiempo de generación de un archivo
   * @param file Archivo a estimar
   * @returns Tiempo estimado en segundos
   */
  private estimateFileGenerationTime(file: any): number {
    // Implementación básica: estimar basado en el tipo de archivo
    const fileType = file.type || this.detectLanguageFromPath(file.path || '');

    // Valores por defecto según el tipo de archivo
    const typeTimeMap: { [key: string]: number } = {
      'javascript': 30,
      'typescript': 45,
      'html': 20,
      'css': 15,
      'json': 10,
      'markdown': 5,
      'python': 40,
      'java': 50
    };

    return typeTimeMap[fileType] || 30; // 30 segundos por defecto
  }

  /**
   * Determina la prioridad de un archivo en el proceso de generación
   * @param file Archivo a priorizar
   * @param allFiles Todos los archivos del proyecto
   * @returns Prioridad (1-10, donde 10 es la más alta)
   */
  private determinePriority(file: any, allFiles: any[]): number {
    // Implementación básica: priorizar archivos de configuración y principales
    const filePath = file.path || '';

    if (filePath.includes('package.json') || filePath.includes('tsconfig.json')) {
      return 10; // Máxima prioridad para archivos de configuración
    }

    if (filePath.includes('index') || filePath.includes('main')) {
      return 9; // Alta prioridad para archivos principales
    }

    if (filePath.includes('component') || filePath.includes('service')) {
      return 8; // Prioridad para componentes y servicios
    }

    return 5; // Prioridad media por defecto
  }

  /**
   * Encuentra las dependencias de un archivo
   * @param file Archivo a analizar
   * @param allFiles Todos los archivos del proyecto
   * @returns Lista de IDs de archivos de los que depende
   */
  private findDependencies(file: any, allFiles: any[]): string[] {
    // Implementación básica: buscar dependencias por nombre
    const dependencies: string[] = [];

    // Si no hay path, no podemos determinar dependencias
    if (!file.path) {
      return dependencies;
    }

    // Lógica simple: los componentes dependen de los servicios, los servicios de los modelos, etc.
    if (file.path.includes('component')) {
      // Buscar servicios relacionados
      const serviceFiles = allFiles.filter(f =>
        f.path && f.path.includes('service') && f.id !== file.id
      );

      dependencies.push(...serviceFiles.map(f => f.id));
    }

    return dependencies;
  }

  /**
   * Maneja errores en el flujo de trabajo
   * @param error Error a manejar
   */
  private handleError(error: any): void {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error en AIIterativeOrchestrator:', errorMessage);

    // Añadir mensaje de error al chat
    this.addChatMessage({
      id: generateUniqueId('msg-error'),
      sender: 'system',
      content: `Error: ${errorMessage}`,
      timestamp: Date.now(),
      type: 'error'
    });

    // Actualizar el estado para permitir al usuario continuar
    this.updatePhase('awaitingInput', null);
    this.notifyStateListeners();
  }

  /**
   * Añade un listener para mensajes de chat
   * @param listener Función que recibe los mensajes de chat
   */
  public addChatListener(listener: (messages: ChatMessage[]) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Elimina un listener de mensajes de chat
   * @param listener Función a eliminar
   */
  public removeChatListener(listener: (messages: ChatMessage[]) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Añade un listener para archivos
   * @param listener Función que recibe los archivos
   */
  public addFileListener(listener: (files: FileItem[]) => void): void {
    this.fileListeners.push(listener);
  }

  /**
   * Elimina un listener de archivos
   * @param listener Función a eliminar
   */
  public removeFileListener(listener: (files: FileItem[]) => void): void {
    this.fileListeners = this.fileListeners.filter(l => l !== listener);
  }

  /**
   * Añade un listener para el estado del flujo de trabajo
   * @param listener Función que recibe el estado
   */
  public addStateListener(listener: (state: AIWorkflowState) => void): void {
    this.stateListeners.push(listener);
  }

  /**
   * Elimina un listener de estado
   * @param listener Función a eliminar
   */
  public removeStateListener(listener: (state: AIWorkflowState) => void): void {
    this.stateListeners = this.stateListeners.filter(l => l !== listener);
  }

  /**
   * Añade un listener para solicitudes de aprobación
   * @param listener Función que recibe los datos de aprobación
   */
  public addApprovalListener(listener: (approvalData: ApprovalData | null) => void): void {
    this.approvalListeners.push(listener);
  }

  /**
   * Elimina un listener de aprobación
   * @param listener Función a eliminar
   */
  public removeApprovalListener(listener: (approvalData: ApprovalData | null) => void): void {
    this.approvalListeners = this.approvalListeners.filter(l => l !== listener);
  }

  /**
   * Añade un listener para datos de progreso
   * @param listener Función que recibe los datos de progreso
   */
  public addProgressListener(listener: (progressData: ProgressData | null) => void): void {
    this.progressListeners.push(listener);
  }

  /**
   * Elimina un listener de progreso
   * @param listener Función a eliminar
   */
  public removeProgressListener(listener: (progressData: ProgressData | null) => void): void {
    this.progressListeners = this.progressListeners.filter(l => l !== listener);
  }

  /**
   * Notifica a los listeners de aprobación
   */
  private notifyApprovalListeners(): void {
    this.approvalListeners.forEach(listener => listener(this.approvalData));
  }

  /**
   * Maneja la aprobación o rechazo de una solicitud
   * @param approvalId ID de la solicitud de aprobación
   * @param approved Indica si fue aprobada
   * @param feedback Comentarios opcionales del usuario
   * @param approvedItems IDs de los elementos aprobados (para aprobación parcial)
   */
  public handleApproval(approvalId: string, approved: boolean, feedback?: string, approvedItems?: string[]): void {
    try {
      console.log(`🔄 AIIterativeOrchestrator.handleApproval llamado:`, {
        approvalId,
        approved,
        feedback,
        approvedItems,
        currentApprovalData: this.approvalData ? {
          id: this.approvalData.id,
          type: this.approvalData.type,
          title: this.approvalData.title
        } : null
      });

      // Verificar que exista una solicitud de aprobación pendiente
      if (!this.approvalData || this.approvalData.id !== approvalId) {
        console.warn('❌ No hay una solicitud de aprobación pendiente o el ID no coincide:', {
          expectedId: approvalId,
          currentApprovalId: this.approvalData?.id,
          hasApprovalData: !!this.approvalData
        });

        // Añadir mensaje de error al chat
        this.addChatMessage({
          id: generateUniqueId('msg-approval-error'),
          sender: 'system',
          content: 'Error: No hay una solicitud de aprobación pendiente con ese ID.',
          timestamp: Date.now(),
          type: 'error'
        });

        return;
      }

      console.log(`✅ Solicitud de aprobación válida encontrada. Tipo: ${this.approvalData.type}`);

      // Determinar el tipo de aprobación y llamar al manejador correspondiente
      if (this.approvalData.type === 'batch') {
        // Aprobación por lotes (archivos)
        this.handleBatchApproval(approvalId, approved, approvedItems);
      } else if (this.approvalData.type === 'plan') {
        // Aprobación de plan
        if (approved) {
          // Añadir mensaje de aprobación al chat
          this.addChatMessage({
            id: generateUniqueId('msg-plan-approved'),
            sender: 'ai-agent',
            content: `✅ **AgenteLector**: Plan completo aprobado${feedback ? `: "${feedback}"` : ''}. Iniciando la generación automática de todos los archivos. Este proceso puede tomar unos minutos. Podrás intervenir cuando se complete la generación.`,
            timestamp: Date.now(),
            type: 'agent-report',
            metadata: {
              agentType: 'lector',
              phase: 'planning',
              approved: true,
              isCompletePlan: true
            }
          });

          // Continuar con la generación de código (asíncrono)
          this.continueWithCodeGeneration().catch(error => {
            console.error('Error al continuar con la generación de código:', error);
            this.handleError(error);
          });
        } else {
          // Añadir mensaje de rechazo al chat
          this.addChatMessage({
            id: generateUniqueId('msg-plan-rejected'),
            sender: 'ai-agent',
            content: `❌ **AgenteLector**: El plan ha sido rechazado${feedback ? `: "${feedback}"` : ''}. Por favor, proporciona más detalles o modifica tu solicitud para generar un nuevo plan.`,
            timestamp: Date.now(),
            type: 'agent-report',
            metadata: {
              agentType: 'lector',
              phase: 'planning',
              approved: false
            }
          });

          // Volver al estado inicial
          this.updatePhase('awaitingInput', null);
        }
      } else {
        // Otro tipo de aprobación
        console.warn(`Tipo de aprobación no manejado: ${this.approvalData.type}`);

        // Ejecutar los manejadores de aprobación registrados
        this.approvalHandlers.forEach(handler => {
          handler(approvalId, approved, approvedItems);
        });
      }

      // Limpiar el estado de aprobación si no es una aprobación parcial
      if (!approvedItems || approvedItems.length === 0 || approvedItems.length === this.approvalData.items.length) {
        this.requiresApproval = false;
        this.approvalData = null;
      }

    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Continúa con la generación de código después de la aprobación del plan
   */
  private async continueWithCodeGeneration(): Promise<void> {
    try {
      if (!this.projectPlan) {
        throw new Error('No hay un plan de proyecto para generar código');
      }

      console.log('🚀 Iniciando generación de código con plan aprobado:', {
        title: this.projectPlan.title,
        totalFiles: this.projectPlan.files?.length || 0
      });

      // Actualizar el estado
      this.updatePhase('generatingCode', 'codeGenerator');

      // Generar código a partir del plan (AWAIT AÑADIDO)
      await this.generateCodeFromPlan(this.projectPlan);

      console.log('✅ Generación de código completada exitosamente');
    } catch (error) {
      console.error('❌ Error en continueWithCodeGeneration:', error);
      this.handleError(error);
    }
  }

  /**
   * Procesa una instrucción del usuario
   * @param instruction Instrucción del usuario
   * @param templateId ID de la plantilla seleccionada (opcional)
   */
  public async processUserInstruction(instruction: string, templateId?: string): Promise<void> {
    try {
      // Validar que la instrucción no esté vacía
      if (!instruction.trim()) {
        throw new Error('La instrucción no puede estar vacía');
      }

      // Verificar si es una modificación interactiva
      if (this.isInteractiveModification(instruction)) {
        await this.processInteractiveInstruction(instruction);
        return;
      }

      // Enriquecer la instrucción con el contexto del stack si está seleccionado
      let enrichedInstruction = instruction;
      if (this.selectedStack) {
        enrichedInstruction = this.stackIntegrationService.enrichInstructionWithStack(
          instruction,
          this.selectedStack
        );

        console.log(`[AIIterativeOrchestrator] Instrucción enriquecida con stack ${this.selectedStack.name}`);
      }

      // Guardar la última instrucción (la enriquecida)
      this.lastInstruction = enrichedInstruction;

      // Añadir mensaje de chat indicando que estamos procesando
      this.addChatMessage({
        id: generateUniqueId('msg-processing'),
        sender: 'system',
        content: this.selectedStack
          ? `Procesando tu instrucción con el stack ${this.selectedStack.name}...`
          : 'Procesando tu instrucción...',
        timestamp: Date.now(),
        type: 'notification'
      });

      // Actualizar el estado para mostrar que estamos procesando
      this.updatePhase('planning', 'planner');
      this.updateProgress(5, 'Iniciando planificación del proyecto...');

      // Añadir mensaje del AgenteLector sobre el inicio del proceso
      this.addChatMessage({
        id: generateUniqueId('msg-lector-start'),
        sender: 'ai-agent',
        content: `🔍 **AgenteLector**: Iniciando el proceso de planificación optimizado basado en tu instrucción. El Agente Planificador Avanzado analizará tu solicitud y creará un plan de desarrollo profesional.`,
        timestamp: Date.now(),
        type: 'agent-report',
        metadata: {
          agentType: 'lector',
          phase: 'planning'
        }
      });

      // Crear una tarea para el agente de planificación optimizado
      const plannerTask: AgentTask = {
        id: generateUniqueId('task'),
        type: 'planner',
        instruction: enrichedInstruction, // Usar la instrucción enriquecida
        status: 'working',
        startTime: Date.now(),
        metadata: {
          templateId,
          selectedStack: this.selectedStack ? {
            id: this.selectedStack.id,
            name: this.selectedStack.name,
            technologies: this.selectedStack.technologies
          } : undefined
        }
      };

      // Ejecutar el agente de planificación optimizado
      this.updateProgress(15, 'Analizando instrucción y generando plan...');
      const planResult = await OptimizedPlannerAgent.execute(plannerTask);

      if (!planResult.success || !planResult.data) {
        throw new Error(`Error al generar el plan: ${planResult.error}`);
      }

      // Verificar que el resultado tenga la estructura esperada
      if (!planResult.data.projectStructure) {
        throw new Error('El plan generado no contiene una estructura de proyecto válida');
      }

      // Adaptar el plan para el CodeGeneratorAgent
      let planFiles = this.ensureWebFiles(planResult.data.projectStructure.files || []);

      // Si hay un stack seleccionado, generar archivos específicos del stack
      if (this.selectedStack) {
        const stackFiles = this.stackIntegrationService.generateStackSpecificFiles(
          this.selectedStack,
          planResult.data.projectStructure.name || 'proyecto'
        );

        // Convertir FileItem[] a formato del plan
        const stackPlanFiles = stackFiles.map(file => ({
          path: file.path,
          description: `Archivo de configuración del stack ${this.selectedStack!.name}: ${file.name}`,
          type: 'file',
          priority: 'high',
          dependencies: [],
          size: 'small'
        }));

        // Agregar archivos del stack al plan (al principio para que se generen primero)
        planFiles = [...stackPlanFiles, ...planFiles];

        console.log(`[AIIterativeOrchestrator] Agregados ${stackFiles.length} archivos específicos del stack ${this.selectedStack.name}`);
      }

      const adaptedPlan = {
        title: planResult.data.projectStructure.name || 'Proyecto sin nombre',
        description: planResult.data.projectStructure.description || instruction,
        files: planFiles,
        implementationSteps: planResult.data.implementationSteps || [],
        selectedStack: this.selectedStack // Incluir información del stack en el plan
      };

      // Guardar el plan adaptado
      this.projectPlan = adaptedPlan;

      // Notificar a los listeners del plan
      this.planListeners.forEach(listener => listener(this.projectPlan));

      // Añadir mensaje del AgenteLector sobre el plan generado
      this.addChatMessage({
        id: generateUniqueId('msg-lector-plan'),
        sender: 'ai-agent',
        content: `📋 **AgenteLector**: El Agente Planificador ha generado un plan de desarrollo para "${adaptedPlan.title}". El plan incluye ${adaptedPlan.files.length} archivos a crear.`,
        timestamp: Date.now(),
        type: 'agent-report',
        metadata: {
          agentType: 'lector',
          phase: 'planning',
          planTitle: adaptedPlan.title,
          totalFiles: adaptedPlan.files.length
        }
      });

      // Solicitar aprobación para el plan
      await this.requestPlanApproval(adaptedPlan);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Solicita la aprobación del plan completo
   * @param plan Plan a aprobar
   */
  private async requestPlanApproval(plan: any): Promise<void> {
    try {
      // Crear un único elemento de aprobación para todo el plan
      const planSummary = {
        title: plan.title,
        description: plan.description,
        totalFiles: plan.files.length,
        implementationSteps: plan.implementationSteps.map((step: any) => ({
          title: step.title,
          description: step.description
        })),
        files: plan.files.map((file: any) => ({
          path: file.path,
          description: file.description || `Archivo ${file.path}`
        }))
      };

      const approvalItems = [{
        id: generateUniqueId(`plan-complete`),
        title: `Plan completo: ${plan.title}`,
        description: `Plan de desarrollo completo con ${plan.files.length} archivos y ${plan.implementationSteps.length} pasos de implementación`,
        type: 'plan',
        content: JSON.stringify(planSummary, null, 2),
        language: 'json',
        estimatedTime: plan.files.length * 2, // Estimación aproximada
        priority: 'high'
      }];

      // Crear la solicitud de aprobación
      const approvalData: ApprovalData = {
        id: generateUniqueId('plan-approval'),
        title: `Plan de Desarrollo Completo: ${plan.title}`,
        description: `Por favor, revisa y aprueba el plan de desarrollo completo para "${plan.title}". Una vez aprobado, se generarán automáticamente todos los archivos necesarios sin solicitar aprobaciones adicionales.`,
        type: 'plan',
        items: approvalItems,
        timestamp: Date.now(),
        metadata: {
          planTitle: plan.title,
          planDescription: plan.description,
          totalFiles: plan.files.length,
          totalSteps: plan.implementationSteps.length,
          isCompletePlan: true // Indicador de que es un plan completo
        }
      };

      // Actualizar el estado para requerir aprobación
      this.requiresApproval = true;
      this.approvalData = approvalData;
      this.updatePhase('awaitingApproval', 'planner');

      // Configurar el manejador de aprobación
      this.approvalHandlers = [];
      this.approvalHandlers.push(async (approvalId: string, approved: boolean) => {
        if (approvalId === approvalData.id) {
          if (approved) {
            // Si el plan fue aprobado, continuar con la generación de código
            await this.continueWithCodeGeneration();
          } else {
            // Si el plan fue rechazado, volver al estado inicial
            this.updatePhase('awaitingInput', null);
          }
        }
      });

      // Notificar a los listeners
      this.notifyApprovalListeners();

      // Añadir mensaje de chat solicitando la aprobación
      this.addChatMessage({
        id: generateUniqueId('msg-plan-approval'),
        sender: 'assistant',
        content: `He generado un plan de desarrollo completo para "${plan.title}". Por favor, revisa el plan y aprueba para iniciar la generación automática de todos los archivos. Una vez aprobado, el proceso continuará sin solicitar aprobaciones adicionales.`,
        timestamp: Date.now(),
        type: 'approval-request',
        metadata: {
          approvalId: approvalData.id,
          planTitle: plan.title,
          totalFiles: plan.length,
          isCompletePlan: true
        }
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Pausa el procesamiento actual
   */
  public pauseProcessing(): void {
    this.isPaused = true;

    // Añadir mensaje de chat indicando la pausa
    this.addChatMessage({
      id: generateUniqueId('msg-pause'),
      sender: 'system',
      content: 'Procesamiento pausado. Puedes reanudarlo cuando estés listo.',
      timestamp: Date.now(),
      type: 'notification'
    });
  }

  /**
   * Reanuda el procesamiento pausado
   */
  public resumeProcessing(): void {
    this.isPaused = false;

    // Añadir mensaje de chat indicando la reanudación
    this.addChatMessage({
      id: generateUniqueId('msg-resume'),
      sender: 'system',
      content: 'Procesamiento reanudado.',
      timestamp: Date.now(),
      type: 'notification'
    });
  }

  /**
   * Cancela el procesamiento actual
   */
  public cancelProcessing(): void {
    // Limpiar el estado
    this.requiresApproval = false;
    this.approvalData = null;
    this.approvalHandlers = [];
    this.isPaused = false;

    // Actualizar el estado para permitir al usuario continuar
    this.updatePhase('awaitingInput', null);

    // Añadir mensaje de chat indicando la cancelación
    this.addChatMessage({
      id: generateUniqueId('msg-cancel'),
      sender: 'system',
      content: 'Procesamiento cancelado.',
      timestamp: Date.now(),
      type: 'notification'
    });

    // Notificar a los listeners
    this.notifyStateListeners();
  }

  /**
   * Actualiza la fase actual del flujo de trabajo
   * @param phase Nueva fase
   * @param agentType Tipo de agente activo
   */
  private updatePhase(phase: AIPhase, agentType: string | null): void {
    this.currentPhase = phase;
    this.currentAgentType = agentType;

    // Notificar a los listeners
    this.notifyStateListeners();
  }

  /**
   * Actualiza el progreso del proceso actual
   * @param percentage Porcentaje de progreso (0-100)
   * @param message Mensaje descriptivo del progreso
   */
  private updateProgress(percentage: number, message?: string): void {
    // Crear un objeto ProgressData completo
    this.progress = {
      percentage: Math.min(100, Math.max(0, percentage)),
      currentPhase: this.currentPhase || 'processing',
      startTime: this.progress?.startTime || Date.now(),
      completedItems: Math.floor((percentage / 100) * (this.projectPlan?.files?.length || 1)),
      totalItems: this.projectPlan?.files?.length || 1,
      itemsProgress: this.progress?.itemsProgress || {},
      message: message || `Progreso: ${percentage}%`,
      timestamp: Date.now()
    };

    // Notificar a los listeners de progreso
    this.progressListeners.forEach(listener => listener(this.progress));

    // También notificar a los listeners de estado
    this.notifyStateListeners();
  }

  /**
   * Notifica a los listeners del estado
   */
  private notifyStateListeners(): void {
    const state: AIWorkflowState = {
      phase: this.currentPhase,
      agentType: this.currentAgentType,
      isProcessing: this.isProcessing,
      requiresApproval: this.requiresApproval,
      isPaused: this.isPaused,
      progress: this.progress,
      approvalData: this.approvalData
    };

    this.stateListeners.forEach(listener => listener(state));
  }

  /**
   * Añade un mensaje de chat
   * @param message Mensaje a añadir
   */
  private addChatMessage(message: ChatMessage): void {
    this.chatMessages.push(message);
    this.listeners.forEach(listener => listener(this.chatMessages));
  }

  /**
   * Añade una entrada al registro de actividad
   * @param entry Entrada a añadir
   */
  private addLogEntry(entry: AILogEntry): void {
    this.aiLog.push(entry);
    this.logListeners.forEach(listener => listener(this.aiLog));
  }

  /**
   * Genera archivos de interfaz visual (HTML/CSS) automáticamente
   * @param instruction Instrucción original del usuario
   * @param plan Plan del proyecto
   * @returns Lista de archivos visuales generados
   */
  private async generateVisualInterface(instruction: string, plan: any): Promise<any[]> {
    const visualFiles: any[] = [];

    try {
      console.log('Generando archivos de interfaz visual para el Constructor...');

      // Verificar si ya existen archivos HTML/CSS en el plan
      const existingHtml = plan.files?.find((f: any) => f.path?.endsWith('.html'));
      const existingCss = plan.files?.find((f: any) => f.path?.endsWith('.css'));

      // Solo generar si no existen archivos HTML/CSS
      if (!existingHtml && !existingCss) {
        // Añadir mensaje informativo
        this.addChatMessage({
          id: generateUniqueId('msg-visual-generation'),
          sender: 'ai-agent',
          content: `🎨 **AgenteLector**: Generando archivos de interfaz visual (HTML/CSS) automáticamente para complementar el proyecto.`,
          timestamp: Date.now(),
          type: 'agent-report',
          metadata: {
            agentType: 'lector',
            phase: 'visualGeneration'
          }
        });

        // 1. Generar index.html
        const htmlTask: AgentTask = {
          id: generateUniqueId('task'),
          type: 'codeGenerator',
          instruction: `Generar archivo index.html para: ${instruction}`,
          status: 'working',
          startTime: Date.now()
        };

        const htmlFileDesc = {
          path: 'index.html',
          description: `Página principal del proyecto. Debe incluir: estructura HTML5 semántica, meta tags SEO optimizados, contenido específico basado en "${instruction}", navegación, secciones principales, y enlaces a styles.css. El contenido debe ser completamente personalizado y relevante al contexto del proyecto.`,
          dependencies: ['styles.css']
        };

        const htmlResult = await CodeGeneratorAgent.execute(htmlTask, htmlFileDesc, plan.description);

        if (htmlResult.success && htmlResult.data?.file) {
          visualFiles.push({
            ...htmlResult.data.file,
            language: 'html',
            enhanced: false
          });

          this.addChatMessage({
            id: generateUniqueId('msg-html-generated'),
            sender: 'ai-agent',
            content: `✅ **AgenteGenerador**: Archivo index.html generado exitosamente (${htmlResult.data.file.content?.length || 0} bytes)`,
            timestamp: Date.now(),
            type: 'progress',
            metadata: {
              agentType: 'codeGenerator',
              phase: 'visualGeneration',
              filePath: 'index.html'
            }
          });
        }

        // 2. Generar styles.css
        const cssTask: AgentTask = {
          id: generateUniqueId('task'),
          type: 'codeGenerator',
          instruction: `Generar archivo styles.css para: ${instruction}`,
          status: 'working',
          startTime: Date.now()
        };

        const cssFileDesc = {
          path: 'styles.css',
          description: `Hoja de estilos principal para el proyecto. Debe incluir: reset CSS, variables CSS para colores y espaciado, diseño responsive mobile-first, estilos para todos los componentes del HTML, animaciones suaves, hover effects, tipografía optimizada con Google Fonts, y paleta de colores coherente con el contexto "${instruction}".`,
          dependencies: []
        };

        const cssResult = await CodeGeneratorAgent.execute(cssTask, cssFileDesc, plan.description);

        if (cssResult.success && cssResult.data?.file) {
          visualFiles.push({
            ...cssResult.data.file,
            language: 'css',
            enhanced: false
          });

          this.addChatMessage({
            id: generateUniqueId('msg-css-generated'),
            sender: 'ai-agent',
            content: `✅ **AgenteGenerador**: Archivo styles.css generado exitosamente (${cssResult.data.file.content?.length || 0} bytes)`,
            timestamp: Date.now(),
            type: 'progress',
            metadata: {
              agentType: 'codeGenerator',
              phase: 'visualGeneration',
              filePath: 'styles.css'
            }
          });
        }

        console.log(`Archivos de interfaz visual generados: ${visualFiles.length}`);
      } else {
        console.log('Ya existen archivos HTML/CSS en el plan, omitiendo generación automática');

        this.addChatMessage({
          id: generateUniqueId('msg-visual-skip'),
          sender: 'ai-agent',
          content: `ℹ️ **AgenteLector**: Se detectaron archivos HTML/CSS existentes en el plan. Se omite la generación automática de interfaz visual.`,
          timestamp: Date.now(),
          type: 'notification',
          metadata: {
            agentType: 'lector',
            phase: 'visualGeneration'
          }
        });
      }

      return visualFiles;

    } catch (error) {
      console.error('Error al generar archivos de interfaz visual:', error);

      this.addChatMessage({
        id: generateUniqueId('msg-visual-error'),
        sender: 'ai-agent',
        content: `❌ **AgenteLector**: Error al generar archivos de interfaz visual: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: Date.now(),
        type: 'error',
        metadata: {
          agentType: 'lector',
          phase: 'visualGeneration',
          error: error instanceof Error ? error.message : 'Error desconocido'
        }
      });

      return visualFiles; // Retornar los archivos que se pudieron generar
    }
  }

  /**
   * Verifica si un archivo es específico del stack tecnológico
   * @param filePath Ruta del archivo
   * @returns true si es un archivo específico del stack
   */
  private isStackSpecificFile(filePath: string): boolean {
    if (!this.selectedStack) return false;

    const stackSpecificFiles = [
      'package.json',
      'requirements.txt',
      'Gemfile',
      'pubspec.yaml',
      'netlify.toml',
      '.gitignore',
      'README.md',
      'settings.py',
      'svelte.config.js',
      'qwik.config.ts'
    ];

    const fileName = filePath.split('/').pop() || '';
    return stackSpecificFiles.includes(fileName);
  }

  /**
   * Obtiene el contenido predefinido de un archivo específico del stack
   * @param filePath Ruta del archivo
   * @returns Contenido del archivo o null si no existe
   */
  private getStackFileContent(filePath: string): { content: string; language: string } | null {
    if (!this.selectedStack) return null;

    // Generar archivos específicos del stack usando el servicio de integración
    const stackFiles = this.stackIntegrationService.generateStackSpecificFiles(
      this.selectedStack,
      this.projectPlan?.title || 'proyecto'
    );

    const matchingFile = stackFiles.find(file => file.path === filePath);
    if (matchingFile) {
      return {
        content: matchingFile.content,
        language: matchingFile.language
      };
    }

    return null;
  }

  /**
   * Notifica a todos los listeners de archivos
   */
  private notifyFileListeners(): void {
    this.fileListeners.forEach(listener => listener(this.files));
  }
}