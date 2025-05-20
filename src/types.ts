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
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
}

export interface TerminalOutput {
  id: string;
  command: string;
  output: string;
  timestamp: number;
  status: 'success' | 'error' | 'info';
}