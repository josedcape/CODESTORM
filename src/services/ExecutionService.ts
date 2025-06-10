import { ProjectPlan, PlanStep, ProjectExecution, ExecutionLog, ProjectBackup } from '../pages/Agent';
import { CodeModificationContext } from './ClaudeAPIService';

interface ExecutionCallbacks {
  onStatusUpdate: (status: string, level: 'info' | 'warning' | 'error' | 'success') => void;
  onStepComplete: (stepId: string, result: StepExecutionResult) => void;
  onProgressUpdate: (progress: number) => void;
  onLogAdd: (log: ExecutionLog) => void;
  onBackupCreate: (backup: ProjectBackup) => void;
  onMessengerTrigger: (context: CodeModificationContext) => void;
}

interface StepExecutionResult {
  success: boolean;
  filesModified: string[];
  changes: {
    file: string;
    originalContent?: string;
    modifiedContent?: string;
    action: 'create' | 'modify' | 'delete';
  }[];
  warnings: string[];
  errors: string[];
  executionTime: number;
}

interface ExecutionPhase {
  name: string;
  duration: number; // in milliseconds
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
}

class ExecutionService {
  private isExecuting = false;
  private isPaused = false;
  private currentExecution: ProjectExecution | null = null;
  private callbacks: ExecutionCallbacks | null = null;

  // Realistic execution phases for different step types
  private getExecutionPhases(step: PlanStep): ExecutionPhase[] {
    const basePhases: ExecutionPhase[] = [
      {
        name: 'initialization',
        duration: 2000,
        message: `Initializing ${step.type} operation for ${step.title}...`,
        level: 'info'
      },
      {
        name: 'analysis',
        duration: 3000,
        message: 'Analyzing project structure and dependencies...',
        level: 'info'
      }
    ];

    switch (step.type) {
      case 'analyze':
        return [
          ...basePhases,
          {
            name: 'scanning',
            duration: 4000,
            message: 'Scanning codebase for patterns and issues...',
            level: 'info'
          },
          {
            name: 'evaluation',
            duration: 3000,
            message: 'Evaluating code quality and structure...',
            level: 'info'
          },
          {
            name: 'reporting',
            duration: 2000,
            message: 'Generating analysis report...',
            level: 'success'
          }
        ];

      case 'create':
        return [
          ...basePhases,
          {
            name: 'template',
            duration: 3000,
            message: 'Generating code template and structure...',
            level: 'info'
          },
          {
            name: 'implementation',
            duration: 8000,
            message: 'Implementing functionality and best practices...',
            level: 'info'
          },
          {
            name: 'validation',
            duration: 4000,
            message: 'Validating syntax and type checking...',
            level: 'info'
          },
          {
            name: 'optimization',
            duration: 3000,
            message: 'Optimizing code and applying formatting...',
            level: 'info'
          },
          {
            name: 'completion',
            duration: 2000,
            message: 'File creation completed successfully',
            level: 'success'
          }
        ];

      case 'modify':
        return [
          ...basePhases,
          {
            name: 'backup',
            duration: 2000,
            message: 'Creating backup of original file...',
            level: 'info'
          },
          {
            name: 'parsing',
            duration: 3000,
            message: 'Parsing existing code structure...',
            level: 'info'
          },
          {
            name: 'modification',
            duration: 6000,
            message: 'Applying modifications while preserving functionality...',
            level: 'info'
          },
          {
            name: 'integration',
            duration: 4000,
            message: 'Integrating changes with existing codebase...',
            level: 'info'
          },
          {
            name: 'testing',
            duration: 5000,
            message: 'Running compatibility and regression tests...',
            level: 'info'
          },
          {
            name: 'completion',
            duration: 2000,
            message: 'File modification completed successfully',
            level: 'success'
          }
        ];

      case 'delete':
        return [
          ...basePhases,
          {
            name: 'dependency_check',
            duration: 4000,
            message: 'Checking for dependencies and references...',
            level: 'warning'
          },
          {
            name: 'backup',
            duration: 2000,
            message: 'Creating backup before deletion...',
            level: 'info'
          },
          {
            name: 'cleanup',
            duration: 3000,
            message: 'Cleaning up imports and references...',
            level: 'info'
          },
          {
            name: 'deletion',
            duration: 1000,
            message: 'Removing file from project...',
            level: 'info'
          },
          {
            name: 'completion',
            duration: 1000,
            message: 'File deletion completed successfully',
            level: 'success'
          }
        ];

      default:
        return [
          ...basePhases,
          {
            name: 'execution',
            duration: 5000,
            message: 'Executing operation...',
            level: 'info'
          },
          {
            name: 'completion',
            duration: 1000,
            message: 'Operation completed successfully',
            level: 'success'
          }
        ];
    }
  }

  async executeStep(step: PlanStep, callbacks: ExecutionCallbacks): Promise<StepExecutionResult> {
    this.callbacks = callbacks;
    const phases = this.getExecutionPhases(step);
    const startTime = Date.now();
    
    // Log step start
    callbacks.onLogAdd({
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      level: 'info',
      message: `Starting step: ${step.title}`,
      stepId: step.id
    });

    // Create backup if modifying or deleting
    if (step.type === 'modify' || step.type === 'delete') {
      const backup: ProjectBackup = {
        id: `backup-${Date.now()}`,
        timestamp: Date.now(),
        description: `Backup before ${step.type}: ${step.title}`,
        files: step.targetFiles.reduce((acc, file) => {
          acc[file] = `// Original content of ${file}\n// Backed up at ${new Date().toISOString()}`;
          return acc;
        }, {} as { [path: string]: string }),
        stepId: step.id
      };
      callbacks.onBackupCreate(backup);
    }

    // Execute each phase with realistic timing
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      
      // Check if paused
      while (this.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update status
      callbacks.onStatusUpdate(phase.message, phase.level);
      
      // Log phase start
      callbacks.onLogAdd({
        id: `log-${Date.now()}-${i}`,
        timestamp: Date.now(),
        level: phase.level,
        message: phase.message,
        stepId: step.id
      });

      // Simulate realistic execution time
      await this.simulatePhaseExecution(phase.duration);
      
      // Update progress within the step
      const phaseProgress = ((i + 1) / phases.length) * 100;
      callbacks.onStatusUpdate(
        `${phase.message} (${Math.round(phaseProgress)}%)`,
        phase.level
      );
    }

    // Generate realistic execution result
    const result = this.generateStepResult(step, Date.now() - startTime);
    
    // Log step completion
    callbacks.onLogAdd({
      id: `log-complete-${Date.now()}`,
      timestamp: Date.now(),
      level: 'success',
      message: `Step completed: ${step.title} (${result.filesModified.length} files affected)`,
      stepId: step.id,
      details: {
        filesModified: result.filesModified,
        executionTime: result.executionTime,
        warnings: result.warnings
      }
    });

    // Trigger Messenger Agent with context
    const messengerContext: CodeModificationContext = {
      type: step.type as any,
      description: step.description,
      filesAffected: result.filesModified,
      changes: result.changes,
      agentType: 'planner',
      confidence: 0.95
    };
    callbacks.onMessengerTrigger(messengerContext);

    return result;
  }

  private async simulatePhaseExecution(duration: number): Promise<void> {
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    while (Date.now() < endTime) {
      // Check if paused
      while (this.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Small delay to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private generateStepResult(step: PlanStep, executionTime: number): StepExecutionResult {
    const filesModified = [...step.targetFiles];
    const changes = step.targetFiles.map(file => ({
      file,
      originalContent: step.type !== 'create' ? `// Original content of ${file}` : undefined,
      modifiedContent: `// Modified content of ${file}\n// ${step.description}\n// Generated at ${new Date().toISOString()}`,
      action: step.type as 'create' | 'modify' | 'delete'
    }));

    const warnings: string[] = [];
    const errors: string[] = [];

    // Add realistic warnings based on step type
    if (step.type === 'modify' && step.targetFiles.length > 3) {
      warnings.push('Multiple files modified - ensure thorough testing');
    }
    
    if (step.type === 'delete') {
      warnings.push('File deletion may affect dependent modules');
    }

    if (step.type === 'create' && step.targetFiles.some(f => f.includes('component'))) {
      warnings.push('New component created - update exports and imports as needed');
    }

    return {
      success: true,
      filesModified,
      changes,
      warnings,
      errors,
      executionTime
    };
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  stop(): void {
    this.isExecuting = false;
    this.isPaused = false;
  }

  isCurrentlyExecuting(): boolean {
    return this.isExecuting;
  }

  isPausedState(): boolean {
    return this.isPaused;
  }
}

export default ExecutionService;
export type { StepExecutionResult, ExecutionCallbacks };
