export interface AIModel {
  id: string;
  name: string;
  description: string;
  strengths: string[];
  icon: string;
}

export type ProjectPhase = 'planning' | 'development' | 'testing' | 'documentation';

export interface Task {
  id: string;
  description: string;
  assignedModel: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  output?: string;
}

export interface ProjectState {
  phase: ProjectPhase;
  currentModel: string;
  currentTask: Task | null;
  tasks: Task[];
  files: FileItem[];
  terminal: TerminalOutput[];
  projectPlan: ProjectPlan | null;
  isGeneratingProject: boolean;
  agentTasks: AgentTask[];
  orchestrator: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
}

export interface CommandAnalysis {
  isValid: boolean;
  summary: string;
  details?: string;
  suggestions?: string[];
  executionTime?: number;
  resourceUsage?: {
    cpu?: string;
    memory?: string;
  };
}

export interface TerminalOutput {
  id: string;
  command: string;
  output: string;
  timestamp: number;
  status: 'success' | 'error' | 'info' | 'warning';
  analysis?: CommandAnalysis;
}

export interface ProjectStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export interface ProjectPlan {
  title: string;
  description: string;
  files: string[];
  steps: ProjectStep[];
  currentStepId: string | null;
}

// Tipos para el sistema multi-agente
export type AgentType = 'planner' | 'codeGenerator' | 'fileSynchronizer' | 'codeModifier';

export type AgentStatus = 'idle' | 'working' | 'completed' | 'failed';

export interface AgentTask {
  id: string;
  type: AgentType;
  instruction: string;
  status: AgentStatus;
  result?: any;
  error?: string;
  startTime: number;
  endTime?: number;
  dependencies?: string[]; // IDs de tareas de las que depende
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface FileDescription {
  path: string;
  description: string;
  dependencies?: string[]; // Otros archivos de los que depende
  content?: string;
}

// Resultado específico del Agente de Planificación
export interface PlannerResult extends AgentResult {
  data?: {
    projectStructure: {
      name: string;
      description: string;
      files: FileDescription[];
    };
    implementationSteps: {
      id: string;
      title: string;
      description: string;
      filesToCreate: string[];
    }[];
  };
}

// Resultado específico del Agente de Generación de Código
export interface CodeGeneratorResult extends AgentResult {
  data?: {
    file: FileItem;
  };
}

// Resultado específico del Agente de Modificación de Código
export interface CodeModifierResult extends AgentResult {
  data?: {
    originalFile: FileItem;
    modifiedFile: FileItem;
    changes: {
      type: 'add' | 'remove' | 'modify';
      description: string;
      lineNumbers?: [number, number]; // [inicio, fin]
    }[];
  };
}