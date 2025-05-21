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
export type AgentType = 'planner' | 'codeGenerator' | 'fileSynchronizer' | 'codeModifier' | 'fileObserver' | 'codeSplitter' | 'codeCorrector' | 'seguimiento' | 'lector';

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
  stages: ApprovalStage[];
  currentStageId: string | null;
  sessionId: string;
  isPaused: boolean;
  lastModified: number;
  fileObserver?: FileObserverState;
  seguimiento?: SeguimientoState;
}

// Tipos para el chat interactivo del Constructor
export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  type: 'text' | 'code' | 'proposal' | 'notification';
  metadata?: {
    language?: string;
    stageId?: string;
    requiresAction?: boolean;
    fileId?: string;
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

export interface LectorResult extends AgentResult {
  data?: {
    fileAnalysis?: FileAnalysis;
    changeAnalysis?: FileChangeAnalysis;
    lectorState?: LectorState;
  };
}