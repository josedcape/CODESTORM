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
import { CodeGeneratorAgent } from '../agents/CodeGeneratorAgent';
import { CodeModifierAgent } from '../agents/CodeModifierAgent';
import { FileObserverAgent } from '../agents/FileObserverAgent';
import { DesignArchitectAgent } from '../agents/DesignArchitectAgent';
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

      // Generar código para cada archivo
      const generatedFiles = await this.generateFilesFromPlan(adaptedPlan);

      // Mejorar los archivos HTML con el Agente de Diseño
      const enhancedFiles = await this.enhanceHTMLWithDesign(generatedFiles, adaptedPlan);

      // Preparar para solicitar aprobación por lotes
      this.prepareFileBatchApproval(enhancedFiles);
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
      for (const file of plan.files) {
        try {
          // Crear una tarea para el agente de generación de código
          const codeGenTask: AgentTask = {
            id: generateUniqueId('task'),
            type: 'codeGenerator',
            instruction: `Generar código para ${file.path}: ${file.description || 'Archivo del proyecto'}`,
            status: 'working',
            startTime: Date.now()
          };

          // Ejecutar el agente de generación de código
          const codeGenResult = await CodeGeneratorAgent.execute(codeGenTask, file, plan.description);

          if (!codeGenResult.success || !codeGenResult.data) {
            console.error(`Error al generar código para ${file.path}:`, codeGenResult.error);
            continue;
          }

          // Añadir el archivo generado a la lista
          generatedFiles.push({
            ...file,
            content: codeGenResult.data.content,
            language: this.detectLanguageFromPath(file.path)
          });

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
      // Identificar archivos HTML
      const htmlFiles = files.filter(file =>
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
              enhanced: true
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
   * Prepara la aprobación por lotes de archivos
   * @param files Archivos a aprobar en lote
   */
  private prepareFileBatchApproval(files: any[]): void {
    try {
      console.log(`Preparando aprobación por lotes para ${files.length} archivos`);

      // Limpiar cualquier manejador de aprobación anterior para evitar duplicados
      this.approvalHandlers = [];

      // Crear los elementos de aprobación para cada archivo
      const approvalItems: ApprovalItem[] = files.map((file, index) => {
        // Asegurarse de que file.path no sea undefined
        const filePath = file.path || `archivo-${index + 1}`;

        // Verificar si el archivo ya existe
        const existingFile = this.files.find(f => f.path === filePath);
        const fileExists = !!existingFile;

        // Generar contenido para el archivo si no lo tiene
        if (!file.content) {
          console.log(`Generando contenido para archivo ${filePath}`);
          file.content = `// Contenido generado para ${filePath}\n// Este es un archivo de ejemplo`;
        }

        // Si el archivo ya existe, obtener el contenido actual
        let existingContent = '';
        if (fileExists && existingFile) {
          existingContent = existingFile.content || '';
        }

        return {
          id: generateUniqueId(`approval-item-${index}`),
          title: fileExists ? `Actualizar: ${filePath}` : filePath,
          description: file.description || `Archivo generado para ${filePath}. Revisa el contenido y aprueba si es correcto.`,
          type: 'file',
          path: filePath,
          language: this.detectLanguageFromPath(filePath),
          estimatedTime: this.estimateFileGenerationTime(file),
          priority: this.determinePriority(file, files),
          dependencies: this.findDependencies(file, files),
          content: file.content,
          metadata: fileExists ? {
            fileExists: true,
            existingContent: existingContent,
            action: 'update'
          } : {
            fileExists: false,
            action: 'create'
          }
        };
      });

      // Crear la solicitud de aprobación por lotes
      const approvalData: ApprovalData = {
        id: generateUniqueId('batch-approval'),
        title: `Aprobación de archivos (${files.length} archivos)`,
        description: `Por favor, revisa y aprueba la generación de estos ${files.length} archivos. Puedes aprobar todos, rechazar todos, o seleccionar archivos específicos para aprobar.`,
        type: 'batch',
        items: approvalItems,
        timestamp: Date.now(),
        metadata: {
          totalFiles: files.length,
          batchApproval: true
        }
      };

      // Mensaje del AgenteLector sobre la solicitud de aprobación por lotes
      this.addChatMessage({
        id: generateUniqueId('msg-lector-batch-approval'),
        sender: 'ai-agent',
        content: `📝 **AgenteLector**: El Agente Diseñador ha preparado ${files.length} archivos para tu revisión. Por favor, revisa y aprueba estos archivos para continuar con el proceso.`,
        timestamp: Date.now(),
        type: 'agent-report',
        metadata: {
          agentType: 'lector',
          phase: 'awaitingApproval',
          totalFiles: files.length
        }
      });

      // Actualizar el estado para requerir aprobación
      this.requiresApproval = true;
      this.approvalData = approvalData;
      this.updatePhase('awaitingApproval', 'codeGenerator');

      // Configurar el manejador de aprobación para el lote
      this.approvalHandlers.push((approvalId: string, approved: boolean, approvedItems?: string[]) => {
        if (approvalId === approvalData.id) {
          this.handleBatchApproval(approvalId, approved, approvedItems);
        }
      });

      // Notificar a los listeners
      this.notifyApprovalListeners();

      // Añadir mensaje de chat solicitando la aprobación
      this.addChatMessage({
        id: generateUniqueId('msg-batch-approval'),
        sender: 'assistant',
        content: `Necesito tu aprobación para generar ${files.length} archivos. Por favor, revisa los archivos y aprueba para continuar.`,
        timestamp: Date.now(),
        type: 'approval-request',
        metadata: {
          approvalId: approvalData.id,
          totalFiles: files.length,
          batchApproval: true
        }
      });
    } catch (error) {
      this.handleError(error);
    }
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

        if (result) {
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
   * @returns True si se creó o actualizó correctamente, false en caso contrario
   */
  private writeFile(filePath: string, content: string): boolean {
    try {
      // Crear o actualizar el archivo en el sistema usando la función importada
      const result = createFile(
        {
          path: filePath,
          content: content,
          language: this.detectLanguageFromPath(filePath)
        },
        this.files,
        this.fileListeners,
        this.addChatMessage.bind(this),
        generateUniqueId
      );

      return !!result;
    } catch (error) {
      console.error(`Error al escribir el archivo ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Detecta el lenguaje de programación a partir de la extensión del archivo
   * @param filePath Ruta del archivo
   * @returns Lenguaje de programación detectado
   */
  private detectLanguageFromPath(filePath: string): string {
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
      console.log(`Manejando aprobación con ID ${approvalId}, aprobado: ${approved}`);

      // Verificar que exista una solicitud de aprobación pendiente
      if (!this.approvalData || this.approvalData.id !== approvalId) {
        console.warn('No hay una solicitud de aprobación pendiente o el ID no coincide');

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
            content: `✅ **AgenteLector**: El usuario ha aprobado el plan${feedback ? `: "${feedback}"` : ''}. Procediendo con la generación de código.`,
            timestamp: Date.now(),
            type: 'agent-report',
            metadata: {
              agentType: 'lector',
              phase: 'planning',
              approved: true
            }
          });

          // Continuar con la generación de código
          this.continueWithCodeGeneration();
        } else {
          // Añadir mensaje de rechazo al chat
          this.addChatMessage({
            id: generateUniqueId('msg-plan-rejected'),
            sender: 'ai-agent',
            content: `❌ **AgenteLector**: El usuario ha rechazado el plan${feedback ? `: "${feedback}"` : ''}. Volviendo al estado inicial.`,
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
  private continueWithCodeGeneration(): void {
    try {
      if (!this.projectPlan) {
        throw new Error('No hay un plan de proyecto para generar código');
      }

      // Actualizar el estado
      this.updatePhase('generatingCode', 'codeGenerator');

      // Generar código a partir del plan
      this.generateCodeFromPlan(this.projectPlan);
    } catch (error) {
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

      // Guardar la última instrucción
      this.lastInstruction = instruction;

      // Añadir mensaje de chat indicando que estamos procesando
      this.addChatMessage({
        id: generateUniqueId('msg-processing'),
        sender: 'system',
        content: 'Procesando tu instrucción...',
        timestamp: Date.now(),
        type: 'notification'
      });

      // Actualizar el estado para mostrar que estamos procesando
      this.updatePhase('planning', 'planner');

      // Añadir mensaje del AgenteLector sobre el inicio del proceso
      this.addChatMessage({
        id: generateUniqueId('msg-lector-start'),
        sender: 'ai-agent',
        content: `🔍 **AgenteLector**: Iniciando el proceso de planificación basado en tu instrucción. El Agente Planificador analizará tu solicitud y creará un plan de desarrollo.`,
        timestamp: Date.now(),
        type: 'agent-report',
        metadata: {
          agentType: 'lector',
          phase: 'planning'
        }
      });

      // Crear una tarea para el agente de planificación
      const plannerTask: AgentTask = {
        id: generateUniqueId('task'),
        type: 'planner',
        instruction,
        status: 'working',
        startTime: Date.now(),
        metadata: {
          templateId
        }
      };

      // Ejecutar el agente de planificación
      const planResult = await PlannerAgent.execute(plannerTask);

      if (!planResult.success || !planResult.data) {
        throw new Error(`Error al generar el plan: ${planResult.error}`);
      }

      // Verificar que el resultado tenga la estructura esperada
      if (!planResult.data.projectStructure) {
        throw new Error('El plan generado no contiene una estructura de proyecto válida');
      }

      // Adaptar el plan para el CodeGeneratorAgent
      const adaptedPlan = {
        title: planResult.data.projectStructure.name || 'Proyecto sin nombre',
        description: planResult.data.projectStructure.description || instruction,
        files: planResult.data.projectStructure.files || [],
        implementationSteps: planResult.data.implementationSteps || []
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
   * Solicita la aprobación del plan
   * @param plan Plan a aprobar
   */
  private async requestPlanApproval(plan: any): Promise<void> {
    try {
      // Crear los elementos de aprobación para cada archivo del plan
      const approvalItems = plan.files.map((file: any, index: number) => {
        return {
          id: generateUniqueId(`plan-item-${index}`),
          title: file.path,
          description: file.description || `Archivo ${file.path}`,
          type: 'file',
          path: file.path,
          language: this.detectLanguageFromPath(file.path),
          estimatedTime: this.estimateFileGenerationTime(file),
          priority: this.determinePriority(file, plan.files),
          dependencies: this.findDependencies(file, plan.files),
          metadata: {
            fileType: file.type || 'unknown',
            purpose: file.purpose || 'No especificado'
          }
        };
      });

      // Crear la solicitud de aprobación
      const approvalData: ApprovalData = {
        id: generateUniqueId('plan-approval'),
        title: `Plan de desarrollo: ${plan.title}`,
        description: plan.description,
        type: 'plan',
        items: approvalItems,
        timestamp: Date.now(),
        metadata: {
          totalFiles: plan.files.length,
          implementationSteps: plan.implementationSteps.length
        }
      };

      // Actualizar el estado para requerir aprobación
      this.requiresApproval = true;
      this.approvalData = approvalData;
      this.updatePhase('awaitingApproval', 'planner');

      // Configurar el manejador de aprobación
      this.approvalHandlers = [];
      this.approvalHandlers.push((approvalId: string, approved: boolean) => {
        if (approvalId === approvalData.id) {
          if (approved) {
            // Si el plan fue aprobado, continuar con la generación de código
            this.continueWithCodeGeneration();
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
        content: `He generado un plan de desarrollo para "${plan.title}". Por favor, revisa el plan y aprueba para continuar con la generación de código.`,
        timestamp: Date.now(),
        type: 'approval-request',
        metadata: {
          approvalId: approvalData.id,
          planTitle: plan.title,
          totalFiles: plan.files.length
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
   * Notifica a los listeners del estado
   */
  private notifyStateListeners(): void {
    const state: AIWorkflowState = {
      phase: this.currentPhase,
      agentType: this.currentAgentType,
      isProcessing: this.isProcessing,
      requiresApproval: this.requiresApproval,
      isPaused: this.isPaused
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
}
