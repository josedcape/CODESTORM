import { 
  AgentTask, 
  AgentType, 
  FileItem, 
  ProjectPlan, 
  ProjectStep, 
  FileSystemCommand,
  PlannerResult,
  CodeGeneratorResult,
  CodeModifierResult
} from '../types';
import { PlannerAgent } from './PlannerAgent';
import { CodeGeneratorAgent } from './CodeGeneratorAgent';
import { CodeModifierAgent } from './CodeModifierAgent';
import { FileSynchronizerAgent } from './FileSynchronizerAgent';

/**
 * Orquestador de Agentes
 * 
 * Esta clase coordina la ejecución de los diferentes agentes especializados
 * y gestiona el flujo de trabajo para la generación y modificación de proyectos.
 */
export class AgentOrchestrator {
  private tasks: AgentTask[] = [];
  private files: FileItem[] = [];
  private projectPlan: ProjectPlan | null = null;
  
  /**
   * Constructor del orquestador
   * @param initialFiles Lista inicial de archivos
   */
  constructor(initialFiles: FileItem[] = []) {
    this.files = [...initialFiles];
  }
  
  /**
   * Inicia el proceso de generación de un proyecto completo
   * @param instruction Instrucción del usuario
   * @returns Promesa con el resultado del proceso
   */
  public async generateProject(instruction: string): Promise<{
    projectPlan: ProjectPlan;
    files: FileItem[];
    tasks: AgentTask[];
  }> {
    try {
      // 1. Crear tarea para el agente de planificación
      const plannerTask = this.createTask('planner', instruction);
      this.tasks.push(plannerTask);
      
      // 2. Ejecutar el agente de planificación
      console.log('Ejecutando agente de planificación...');
      const plannerResult = await PlannerAgent.execute(plannerTask);
      
      // 3. Actualizar el estado de la tarea
      this.updateTaskStatus(plannerTask.id, plannerResult.success ? 'completed' : 'failed', plannerResult);
      
      if (!plannerResult.success || !plannerResult.data) {
        throw new Error('El agente de planificación no pudo generar un plan de proyecto');
      }
      
      // 4. Crear el plan de proyecto
      this.projectPlan = this.createProjectPlan(plannerResult);
      
      // 5. Generar archivos para cada paso del plan
      const generatedFiles: FileItem[] = [];
      
      for (const step of this.projectPlan.steps) {
        // Actualizar el paso actual en el plan
        this.projectPlan.currentStepId = step.id;
        
        // Obtener los archivos a crear en este paso
        const stepData = plannerResult.data.implementationSteps.find(s => s.id === step.id);
        if (!stepData) continue;
        
        // Crear y ejecutar tareas para cada archivo
        for (const filePath of stepData.filesToCreate) {
          // Buscar la descripción del archivo
          const fileDesc = plannerResult.data.projectStructure.files.find(f => f.path === filePath);
          if (!fileDesc) continue;
          
          // Crear tarea para el agente de generación de código
          const codeGenTask = this.createTask(
            'codeGenerator', 
            `Generar código para ${filePath}: ${fileDesc.description}`
          );
          this.tasks.push(codeGenTask);
          
          // Ejecutar el agente de generación de código
          console.log(`Generando código para ${filePath}...`);
          const codeGenResult = await CodeGeneratorAgent.execute(
            codeGenTask, 
            fileDesc, 
            plannerResult.data.projectStructure.description
          );
          
          // Actualizar el estado de la tarea
          this.updateTaskStatus(codeGenTask.id, codeGenResult.success ? 'completed' : 'failed', codeGenResult);
          
          if (codeGenResult.success && codeGenResult.data?.file) {
            generatedFiles.push(codeGenResult.data.file);
          }
        }
        
        // Marcar el paso como completado
        step.status = 'completed';
      }
      
      // 6. Sincronizar los archivos generados
      if (generatedFiles.length > 0) {
        // Crear comandos de sistema de archivos para los archivos generados
        const commands: FileSystemCommand[] = generatedFiles.map(file => ({
          type: 'create',
          path: file.path,
          content: file.content,
          language: file.language
        }));
        
        // Crear tarea para el agente de sincronización
        const syncTask = this.createTask(
          'fileSynchronizer', 
          `Sincronizar ${generatedFiles.length} archivos generados`
        );
        this.tasks.push(syncTask);
        
        // Ejecutar el agente de sincronización
        console.log('Sincronizando archivos...');
        const syncResult = FileSynchronizerAgent.execute(syncTask, this.files, commands);
        
        // Actualizar el estado de la tarea
        this.updateTaskStatus(syncTask.id, syncResult.success ? 'completed' : 'failed', syncResult);
        
        if (syncResult.success && syncResult.data?.files) {
          this.files = syncResult.data.files;
        }
      }
      
      // 7. Finalizar el plan
      this.projectPlan.currentStepId = null;
      
      return {
        projectPlan: this.projectPlan,
        files: this.files,
        tasks: this.tasks
      };
    } catch (error) {
      console.error('Error en el orquestador de agentes:', error);
      throw error;
    }
  }
  
  /**
   * Modifica un archivo existente
   * @param instruction Instrucción del usuario
   * @param fileId ID del archivo a modificar
   * @returns Promesa con el resultado del proceso
   */
  public async modifyFile(instruction: string, fileId: string): Promise<{
    originalFile: FileItem;
    modifiedFile: FileItem;
    tasks: AgentTask[];
  }> {
    try {
      // 1. Buscar el archivo a modificar
      const file = this.files.find(f => f.id === fileId);
      if (!file) {
        throw new Error(`No se encontró el archivo con ID ${fileId}`);
      }
      
      // 2. Crear tarea para el agente de modificación de código
      const modifierTask = this.createTask(
        'codeModifier', 
        `Modificar archivo ${file.path}: ${instruction}`
      );
      this.tasks.push(modifierTask);
      
      // 3. Ejecutar el agente de modificación de código
      console.log(`Modificando archivo ${file.path}...`);
      const modifierResult = await CodeModifierAgent.execute(modifierTask, file);
      
      // 4. Actualizar el estado de la tarea
      this.updateTaskStatus(modifierTask.id, modifierResult.success ? 'completed' : 'failed', modifierResult);
      
      if (!modifierResult.success || !modifierResult.data) {
        throw new Error('El agente de modificación no pudo modificar el archivo');
      }
      
      // 5. Sincronizar el archivo modificado
      const commands: FileSystemCommand[] = [
        {
          type: 'update',
          path: modifierResult.data.modifiedFile.path,
          content: modifierResult.data.modifiedFile.content
        }
      ];
      
      // Crear tarea para el agente de sincronización
      const syncTask = this.createTask(
        'fileSynchronizer', 
        `Sincronizar cambios en ${file.path}`
      );
      this.tasks.push(syncTask);
      
      // Ejecutar el agente de sincronización
      console.log('Sincronizando cambios...');
      const syncResult = FileSynchronizerAgent.execute(syncTask, this.files, commands);
      
      // Actualizar el estado de la tarea
      this.updateTaskStatus(syncTask.id, syncResult.success ? 'completed' : 'failed', syncResult);
      
      if (syncResult.success && syncResult.data?.files) {
        this.files = syncResult.data.files;
      }
      
      return {
        originalFile: modifierResult.data.originalFile,
        modifiedFile: modifierResult.data.modifiedFile,
        tasks: this.tasks
      };
    } catch (error) {
      console.error('Error al modificar archivo:', error);
      throw error;
    }
  }
  
  /**
   * Crea una nueva tarea para un agente
   * @param type Tipo de agente
   * @param instruction Instrucción para el agente
   * @returns Tarea creada
   */
  private createTask(type: AgentType, instruction: string): AgentTask {
    return {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      instruction,
      status: 'working',
      startTime: Date.now()
    };
  }
  
  /**
   * Actualiza el estado de una tarea
   * @param taskId ID de la tarea
   * @param status Nuevo estado
   * @param result Resultado de la tarea
   */
  private updateTaskStatus(taskId: string, status: 'completed' | 'failed', result: any): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      task.result = result;
      task.endTime = Date.now();
    }
  }
  
  /**
   * Crea un plan de proyecto a partir del resultado del agente de planificación
   * @param plannerResult Resultado del agente de planificación
   * @returns Plan de proyecto
   */
  private createProjectPlan(plannerResult: PlannerResult): ProjectPlan {
    if (!plannerResult.data) {
      throw new Error('No hay datos en el resultado del agente de planificación');
    }
    
    // Convertir los pasos de implementación al formato de ProjectStep
    const steps: ProjectStep[] = plannerResult.data.implementationSteps.map(step => ({
      id: step.id,
      title: step.title,
      description: step.description,
      status: 'pending'
    }));
    
    return {
      title: plannerResult.data.projectStructure.name,
      description: plannerResult.data.projectStructure.description,
      files: plannerResult.data.projectStructure.files.map(f => f.path),
      steps,
      currentStepId: steps.length > 0 ? steps[0].id : null
    };
  }
  
  /**
   * Obtiene la lista actual de tareas
   * @returns Lista de tareas
   */
  public getTasks(): AgentTask[] {
    return this.tasks;
  }
  
  /**
   * Obtiene la lista actual de archivos
   * @returns Lista de archivos
   */
  public getFiles(): FileItem[] {
    return this.files;
  }
  
  /**
   * Obtiene el plan de proyecto actual
   * @returns Plan de proyecto
   */
  public getProjectPlan(): ProjectPlan | null {
    return this.projectPlan;
  }
}
