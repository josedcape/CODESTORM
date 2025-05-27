export interface AIModel {
  id: string;
  name: string;
  description: string;
  strengths: string[];
  icon: string;
}

export type ProjectPhase = 'planning' | 'development' | 'testing' | 'documentation';

// Tipos para el flujo de trabajo iterativo guiado por IA
export type AIPhase =
  | 'planning'
  | 'generatingCode'
  | 'modifyingFile'
  | 'analyzingCode'
  | 'awaitingInput'
  | 'complete'
  | 'awaitingApproval'
  | 'designingUI'
  | 'designing'
  | 'paused';

export interface AILogEntry {
  id: string;
  timestamp: number;
  phase: AIPhase;
  agentType: string;
  action: string;
  details: string;
  relatedFiles?: string[];
}

export interface AIWorkflowState {
  currentPhase: AIPhase;
  lastInstruction: string;
  currentAgentType: string | null;
  log: AILogEntry[];
  isProcessing: boolean;
  requiresApproval?: boolean;
  approvalData?: ApprovalData;
  progress?: ProgressData;
}

export interface ApprovalData {
  id: string;
  title: string;
  description: string;
  type: 'plan' | 'code' | 'design' | 'modification' | 'batch' | 'file';
  items: ApprovalItem[];
  feedback?: string;
  timestamp: number;
  approved?: boolean;
  rejected?: boolean;
  partiallyApproved?: boolean;
  metadata?: any;
}

export interface ApprovalItem {
  id: string;
  title: string;
  description: string;
  type: 'file' | 'component' | 'feature' | 'dependency';
  path?: string;
  content?: string;
  language?: string;
  approved?: boolean;
  rejected?: boolean;
  feedback?: string;
  estimatedTime?: number; // en minutos
  priority?: 'high' | 'medium' | 'low';
  dependencies?: string[]; // IDs de otros items de los que depende
}

export interface ProgressData {
  percentage: number;
  currentPhase: string;
  estimatedTimeRemaining?: number; // en minutos
  startTime: number;
  completedItems: number;
  totalItems: number;
  itemsProgress: {
    [key: string]: {
      id: string;
      title: string;
      percentage: number;
      status: 'pending' | 'in-progress' | 'completed' | 'failed';
    }
  };
}

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
  timestamp: number;
  isModified?: boolean;
  isNew?: boolean;
  lastModified?: number;
  size?: number;
  type?: string;
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
export type AgentType = 'planner' | 'codeGenerator' | 'fileSynchronizer' | 'codeModifier' | 'fileObserver' | 'codeSplitter' | 'codeCorrector' | 'seguimiento' | 'lector' | 'designArchitect';

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
    file?: FileItem;
    files?: FileItem[];
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

// Comandos para el sistema de archivos
export type FileSystemCommandType = 'create' | 'update' | 'delete' | 'rename' | 'move';

export interface FileSystemCommand {
  type: FileSystemCommandType;
  path: string;
  content?: string;
  newPath?: string; // Para comandos rename y move
  language?: string; // Para comandos create
}

// Tipos para el sistema de aprobación por etapas (Constructor)
export type ApprovalStatus = 'pending' | 'approved' | 'modified' | 'rejected';

export interface StageChange {
  id: string;
  title: string;
  description: string;
  type: 'create' | 'modify' | 'delete' | 'other';
  path?: string;
  content?: string;
  language?: string;
  isApproved?: boolean;
  isRejected?: boolean;
  feedback?: string;
}

export interface ApprovalStage {
  id: string;
  type: AgentType;
  title: string;
  description: string;
  status: ApprovalStatus;
  proposal: string;
  feedback?: string;
  timestamp: number;
  changes?: StageChange[];
  isGrouped?: boolean;
}

export interface ConstructorState extends ProjectState {
  // Estado del flujo de trabajo tradicional (por etapas)
  stages: ApprovalStage[];
  currentStageId: string | null;
  isPaused: boolean;

  // Estado del flujo de trabajo iterativo guiado por IA
  aiWorkflow: AIWorkflowState;
  useIterativeWorkflow: boolean; // Indica si se usa el flujo iterativo o el tradicional

  // Datos comunes
  sessionId: string;
  lastModified: number;
  fileObserver?: FileObserverState;
  seguimiento?: SeguimientoState;
}

// Tipos para el chat interactivo del Constructor
export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system' | 'ai-agent' | 'design-agent';
  content: string;
  timestamp: number;
  type: 'text' | 'code' | 'proposal' | 'notification' | 'ai-log' | 'file-creation' | 'file-modification' | 'approval-request' | 'approval-response' | 'design-proposal' | 'progress-update' | 'error' | 'warning' | 'success' | 'system';
  metadata?: {
    language?: string;
    stageId?: string;
    requiresAction?: boolean;
    fileId?: string;
    agentType?: string;
    phase?: AIPhase;
    files?: string[];
    reasoning?: string;
    action?: string;
    approvalId?: string;
    approvalType?: 'plan' | 'code' | 'design' | 'modification';
    approvalStatus?: 'pending' | 'approved' | 'rejected' | 'partially-approved';
    progressPercentage?: number;
    estimatedTimeRemaining?: number;
    designPreview?: string; // URL o base64 de la imagen
    diffView?: {
      original: string;
      modified: string;
      path: string;
    };
    icon?: React.ComponentType<any>;
  };
}

// Tipos para el analizador de código
export type CodeIssueLevel = 'critical' | 'warning' | 'suggestion';

export interface CodeIssue {
  id: string;
  level: CodeIssueLevel;
  message: string;
  description: string;
  lineStart: number;
  lineEnd: number;
  filePath: string;
  suggestion?: string;
  isIgnored: boolean;
  ignoreReason?: string;
}

export interface CodeAnalysisResult {
  fileId: string;
  issues: CodeIssue[];
  summary: {
    critical: number;
    warning: number;
    suggestion: number;
  };
}

// Tipos para el Agente de Observación de Archivos
export interface FileContext {
  id: string;
  fileId: string;
  path: string;
  language: string;
  imports: string[];
  exports: string[];
  functions: string[];
  classes: string[];
  dependencies: string[];
  description: string;
  lastUpdated: number;
}

export interface FileObservation {
  id: string;
  fileId: string;
  observation: string;
  type: 'dependency' | 'structure' | 'pattern' | 'suggestion' | 'warning';
  timestamp: number;
  relatedFiles?: string[];
}

export interface FileObserverState {
  observedFiles: string[];
  fileContexts: FileContext[];
  observations: FileObservation[];
  isActive: boolean;
  lastScan: number;
}

// Tipos para el Agente de Separación de Código
export interface CodeSplitResult {
  files: FileItem[];
  message: string;
}

// Tipos para el Corrector de Código
export type CodeErrorType = 'syntax' | 'logic' | 'security' | 'performance' | 'style' | 'bestPractice';
export type CodeErrorSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface CodeError {
  id: string;
  type: CodeErrorType;
  severity: CodeErrorSeverity;
  message: string;
  description: string;
  lineStart: number;
  lineEnd: number;
  code: string;
  suggestion: string;
  fixed: boolean;
}

export interface CodeCorrectionResult {
  originalCode: string;
  correctedCode: string;
  errors: CodeError[];
  summary: {
    totalErrors: number;
    fixedErrors: number;
    errorsByType: Record<CodeErrorType, number>;
    errorsBySeverity: Record<CodeErrorSeverity, number>;
  };
  executionTime: number;
  language: string;
}

// Resultado específico del Agente de Corrección de Código
export interface CodeCorrectorResult extends AgentResult {
  data?: {
    analysis: CodeCorrectionResult;
    originalFile?: FileItem;
    correctedFile?: FileItem;
  };
}

// Resultado específico del Agente de Diseño
export interface DesignArchitectResult extends AgentResult {
  data?: {
    files: {
      path: string;
      content: string;
      language: string;
      type: 'html' | 'css' | 'js';
      description?: string;
    }[];
    designSummary?: string;
    styleGuide?: {
      colors: string[];
      fonts: string[];
      components: string[];
    };
  };
}

export interface CorrectionHistoryItem {
  id: string;
  timestamp: number;
  language: string;
  originalCodeSnippet: string;
  correctedCodeSnippet: string;
  errorCount: number;
  fixedCount: number;
}

// Tipos para el Agente de Seguimiento
export type HistoryEventType = 'stage-start' | 'stage-complete' | 'code-generated' | 'file-created' | 'file-modified' | 'decision-made' | 'user-feedback' | 'error' | 'milestone';

export interface HistoryEvent {
  id: string;
  type: HistoryEventType;
  title: string;
  description: string;
  timestamp: number;
  stageId?: string;
  stageType?: AgentType;
  relatedFiles?: string[];
  codeSnippet?: string;
  language?: string;
  metadata?: Record<string, any>;
  importance: 'high' | 'medium' | 'low';
}

export interface StageDocumentation {
  stageId: string;
  stageType: AgentType;
  title: string;
  description: string;
  startTime: number;
  endTime?: number;
  status: ApprovalStatus;
  events: HistoryEvent[];
  decisions: {
    id: string;
    description: string;
    reasoning: string;
    timestamp: number;
  }[];
  files: {
    fileId: string;
    path: string;
    action: 'created' | 'modified' | 'deleted';
    description: string;
  }[];
  userFeedback?: string;
}

export interface ProjectHistory {
  projectId: string;
  name: string;
  description: string;
  startTime: number;
  lastUpdated: number;
  stages: StageDocumentation[];
  events: HistoryEvent[];
  milestones: {
    id: string;
    title: string;
    description: string;
    timestamp: number;
    stageId: string;
  }[];
}

export interface SeguimientoState {
  isActive: boolean;
  currentStageId?: string;
  history: ProjectHistory;
  lastEvent?: HistoryEvent;
  isDocumenting: boolean;
  pendingEvents: HistoryEvent[];
}

// Resultado específico del Agente de Seguimiento
export interface SeguimientoResult extends AgentResult {
  data?: {
    event: HistoryEvent;
    stageDocumentation?: StageDocumentation;
    projectHistory?: ProjectHistory;
  };
}

// Tipos para el Agente Lector
export type FileAnalysisLevel = 'critical' | 'important' | 'normal' | 'info';

export interface FileDependency {
  path: string;
  type: 'import' | 'export' | 'reference' | 'inheritance' | 'usage';
  description: string;
  isRequired: boolean;
}

export interface FileSection {
  id: string;
  startLine: number;
  endLine: number;
  content: string;
  description: string;
  isCritical: boolean;
  dependencies: FileDependency[];
}

export interface FileAnalysis {
  id: string;
  fileId: string;
  path: string;
  language: string;
  purpose: string;
  description: string;
  sections: FileSection[];
  dependencies: FileDependency[];
  criticalAreas: {
    description: string;
    sections: string[]; // IDs de las secciones críticas
  }[];
  timestamp: number;
}

export interface FileChangeImpact {
  id: string;
  description: string;
  level: FileAnalysisLevel;
  affectedFiles: string[];
  affectedFunctionality: string;
  recommendation: string;
}

export interface FileChangeAnalysis {
  originalFile: FileItem;
  proposedChanges: string;
  impacts: FileChangeImpact[];
  summary: string;
  recommendation: string;
  timestamp: number;
}

export interface LectorState {
  analyzedFiles: FileAnalysis[];
  pendingChanges: FileChangeAnalysis[];
  isActive: boolean;
  lastAnalysis: number;
}

// Tipos para el Agente de Diseño Arquitectónico
export type DesignComponentType = 'page' | 'layout' | 'component' | 'form' | 'navigation' | 'modal' | 'card' | 'button' | 'input' | 'table';
export type DesignStyle = 'minimal' | 'modern' | 'corporate' | 'playful' | 'dark' | 'light' | 'custom';

export interface DesignComponent {
  id: string;
  name: string;
  type: DesignComponentType;
  description: string;
  properties: {
    [key: string]: any;
  };
  children?: string[]; // IDs de componentes hijos
  parentId?: string;
  styles?: {
    [key: string]: string;
  };
  events?: {
    [key: string]: string;
  };
  previewImage?: string; // URL o base64 de la imagen
  htmlTemplate?: string;
  cssStyles?: string;
  jsCode?: string;
}

export interface DesignProposal {
  id: string;
  title: string;
  description: string;
  components: DesignComponent[];
  style: DesignStyle;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    [key: string]: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    baseSize: string;
    scale: number;
  };
  responsive: boolean;
  accessibility: {
    level: 'A' | 'AA' | 'AAA';
    features: string[];
  };
  previewImages: string[]; // URLs o base64 de las imágenes
  htmlPreview?: string;
  cssPreview?: string;
}

export interface DesignArchitectResult extends AgentResult {
  data?: {
    proposal?: DesignProposal;
    components?: DesignComponent[];
    files?: any[];
    designSummary?: string;
    styleGuide?: {
      colors: string[];
      fonts: string[];
      components: string[];
    };
  };
}

export interface DesignArchitectState {
  currentProposal?: DesignProposal;
  approvedComponents: DesignComponent[];
  generatedFiles: string[];
  isActive: boolean;
  lastUpdate: number;
}

export interface LectorResult extends AgentResult {
  data?: {
    fileAnalysis?: FileAnalysis;
    changeAnalysis?: FileChangeAnalysis;
    lectorState?: LectorState;
  };
}