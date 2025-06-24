// Tipos para los agentes
export type AgentStatus = 'idle' | 'working' | 'completed' | 'failed';

export interface AgentTask {
  id: string;
  type: string;
  instruction: string;
  status: AgentStatus;
  startTime: number;
  endTime?: number;
  plan?: any;
}

export interface AgentResult {
  success: boolean;
  error?: string;
  data?: any;
  metadata?: any;
}

// Tipos para el Agente de Diseño
export interface DesignProposal {
  id: string;
  title: string;
  description: string;
  siteType: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  components: DesignComponent[];
  layout: string;
  createdAt: number;
}

export interface DesignComponent {
  id: string;
  name: string;
  type: string;
  description: string;
  position: string;
  properties: any;
}

export interface DesignArchitectResult extends AgentResult {
  data?: {
    proposal?: DesignProposal;
    components?: DesignComponent[];
    files?: FileItem[];
    designSummary?: string;
    styleGuide?: {
      colors: string[];
      fonts: string[];
      components: string[];
    };
  };
}

// Tipos para el Agente de Código
export interface FileDescription {
  path: string;
  description: string;
  dependencies?: string[];
}

export interface CodeGeneratorResult extends AgentResult {
  data?: {
    file?: FileItem;
    files?: FileItem[];
  };
}

// Tipos para el sistema de archivos
export interface FileItem {
  id: string;
  name: string;
  path: string;
  content: string;
  language?: string;
  type?: string;
  isNew?: boolean;
  timestamp: number;
  lastModified?: number;
}

// Tipos para la terminal
export interface TerminalOutput {
  id: string;
  command: string;
  output: string;
  timestamp: number;
  status: 'success' | 'error' | 'info' | 'warning';
  analysis?: {
    isValid: boolean;
    summary: string;
    executionTime: number;
  };
}

// Tipos para el estado del proyecto
export interface ProjectState {
  currentModel: string;
  phase: string;
  isGeneratingProject: boolean;
  files: FileItem[];
  terminal: TerminalOutput[];
  agentTasks: AgentTask[];
  orchestrator: boolean;
  projectPlan: any;
  currentTask: any;
  tasks: any[];
}

// Tipos para el plan del proyecto
export interface ProjectPlan {
  id: string;
  title: string;
  description: string;
  steps: ProjectStep[];
  createdAt: number;
  updatedAt: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface ProjectStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  tasks: ProjectTask[];
  dependencies?: string[];
  startTime?: number;
  endTime?: number;
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo?: string;
  startTime?: number;
  endTime?: number;
}
