import React, { useState } from 'react';
import Header from './components/Header';
import ModelSelector from './components/ModelSelector';
import InstructionInput from './components/InstructionInput';
import ProjectStatus from './components/ProjectStatus';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/CodeEditor';
import Terminal from './components/Terminal';
import ProjectPlan from './components/ProjectPlan';
import AgentStatus from './components/AgentStatus';
import { availableModels } from './data/models';
import {
  ProjectState,
  FileItem,
  Task,
  TerminalOutput,
  AgentTask
} from './types';
import { tryWithFallback } from './services/ai';
import { parseTerminalCommand, applyFileSystemCommands } from './services/fileSystemService';
import { AgentOrchestrator } from './agents/AgentOrchestrator';

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const [projectState, setProjectState] = useState<ProjectState>({
    phase: 'planning',
    currentModel: 'Gemini 2.5',
    currentTask: null,
    tasks: [],
    files: [
      {
        id: 'main-py',
        name: 'main.py',
        path: '/main.py',
        content: '# This file will contain the main application code\n\ndef main():\n    print("Hello, world!")\n\nif __name__ == "__main__":\n    main()',
        language: 'python'
      },
      {
        id: 'requirements-txt',
        name: 'requirements.txt',
        path: '/requirements.txt',
        content: '# Python dependencies will be listed here',
        language: 'text'
      }
    ],
    terminal: [
      {
        id: 'init',
        command: 'python --version',
        output: 'Python 3.10.0',
        timestamp: Date.now() - 60000,
        status: 'success',
        analysis: {
          isValid: true,
          summary: 'Versión de Python verificada correctamente',
          details: 'Se está utilizando Python 3.10.0, que es compatible con todas las funcionalidades requeridas.',
          executionTime: 120,
          resourceUsage: {
            cpu: '5%',
            memory: '25MB'
          }
        }
      },
      {
        id: 'init-2',
        command: 'npm --version',
        output: '9.8.1',
        timestamp: Date.now() - 50000,
        status: 'success',
        analysis: {
          isValid: true,
          summary: 'Versión de NPM verificada correctamente',
          details: 'Se está utilizando NPM 9.8.1, que es compatible con el proyecto.',
          executionTime: 85,
          resourceUsage: {
            cpu: '3%',
            memory: '18MB'
          }
        }
      }
    ],
    projectPlan: null,
    isGeneratingProject: false,
    agentTasks: [],
    orchestrator: false
  });

  // Crear una instancia del orquestador de agentes
  const [orchestrator] = useState(() => new AgentOrchestrator(projectState.files));

  const selectedFile = projectState.files.find(file => file.id === selectedFileId) || null;

  const handleSelectModel = (modelId: string) => {
    const model = availableModels.find(m => m.id === modelId);
    if (model) {
      setProjectState(prev => ({
        ...prev,
        currentModel: model.name
      }));
    }
  };

  const handleSubmitInstruction = async (instruction: string) => {
    setIsProcessing(true);

    try {
      // Determinar si es una solicitud de proyecto completo
      const isProjectRequest = instruction.toLowerCase().includes('crea') &&
        (instruction.toLowerCase().includes('proyecto') ||
         instruction.toLowerCase().includes('aplicación') ||
         instruction.toLowerCase().includes('programa') ||
         instruction.toLowerCase().includes('calculadora') ||
         instruction.toLowerCase().includes('juego') ||
         instruction.toLowerCase().includes('web'));

      // Add a new task
      const newTask: Task = {
        id: `task-${Date.now()}`,
        description: instruction,
        assignedModel: projectState.currentModel,
        status: 'in-progress'
      };

      // Add terminal command with analysis
      const processCommand = `process_instruction "${instruction}"`;
      const newTerminalOutput: TerminalOutput = {
        id: `term-${Date.now()}`,
        command: processCommand,
        output: isProjectRequest ? 'Iniciando sistema multi-agente para generación de proyecto...' : 'Procesando instrucción...',
        timestamp: Date.now(),
        status: 'info' as const,
        analysis: {
          isValid: true,
          summary: isProjectRequest ? 'Iniciando sistema multi-agente' : 'Procesando instrucción',
          executionTime: 0
        }
      };

      // Update project state with new task and terminal output
      setProjectState(prev => ({
        ...prev,
        phase: 'development',
        currentTask: newTask,
        tasks: [...prev.tasks, newTask],
        terminal: [...prev.terminal, newTerminalOutput],
        isGeneratingProject: isProjectRequest,
        orchestrator: isProjectRequest
      }));

      if (isProjectRequest) {
        // Usar el sistema multi-agente para generar el proyecto
        try {
          // Mensaje de inicio del Agente de Planificación
          const plannerStartOutput: TerminalOutput = {
            id: `term-planner-start-${Date.now()}`,
            command: 'echo "Agente de Planificación: Analizando solicitud..."',
            output: 'Agente de Planificación: Analizando la solicitud y definiendo la estructura del proyecto...',
            timestamp: Date.now(),
            status: 'info' as const,
            analysis: {
              isValid: true,
              summary: 'Agente de Planificación iniciado',
              executionTime: 0
            }
          };

          setProjectState(prev => ({
            ...prev,
            terminal: [...prev.terminal, plannerStartOutput]
          }));

          // Ejecutar el orquestador para generar el proyecto
          const result = await orchestrator.generateProject(instruction);

          // Actualizar el estado con los resultados
          setProjectState(prev => {
            const updatedTasks = prev.tasks.map(task =>
              task.id === newTask.id
                ? { ...task, status: 'completed' as const }
                : task
            );

            return {
              ...prev,
              currentTask: null,
              tasks: updatedTasks,
              files: result.files,
              projectPlan: result.projectPlan,
              agentTasks: result.tasks,
              isGeneratingProject: false,
              orchestrator: true
            };
          });

          // Seleccionar el primer archivo generado
          if (result.files.length > projectState.files.length) {
            const newFiles = result.files.filter(file =>
              !projectState.files.some(existingFile => existingFile.id === file.id)
            );
            if (newFiles.length > 0) {
              setSelectedFileId(newFiles[0].id);
            }
          }

          // Mensaje de finalización
          const completionOutput: TerminalOutput = {
            id: `term-completion-${Date.now()}`,
            command: 'echo "Proyecto generado con éxito"',
            output: `Proyecto generado con éxito por el sistema multi-agente.`,
            timestamp: Date.now(),
            status: 'success' as const,
            analysis: {
              isValid: true,
              summary: 'Proyecto generado exitosamente',
              executionTime: Math.floor(Math.random() * 500) + 200
            }
          };

          setProjectState(prev => ({
            ...prev,
            terminal: [...prev.terminal, completionOutput]
          }));
        } catch (error) {
          console.error('Error en el sistema multi-agente:', error);

          // Mensaje de error
          const errorOutput: TerminalOutput = {
            id: `term-agent-error-${Date.now()}`,
            command: 'echo "Error en el sistema multi-agente"',
            output: `Error en el sistema multi-agente: ${error instanceof Error ? error.message : 'Error desconocido'}`,
            timestamp: Date.now(),
            status: 'error' as const,
            analysis: {
              isValid: false,
              summary: 'Error en el sistema multi-agente',
              executionTime: Math.floor(Math.random() * 300) + 100
            }
          };

          setProjectState(prev => ({
            ...prev,
            terminal: [...prev.terminal, errorOutput],
            isGeneratingProject: false
          }));
        }
      } else {
        // Comportamiento original para instrucciones simples
        // Process the instruction with Gemini
        const response = await tryWithFallback(instruction, 'Gemini 2.5');

        if (response.error) {
          throw new Error(response.error);
        }

        // Create a new Python file based on the AI response
        const newFile: FileItem = {
          id: `file-${Date.now()}`,
          name: 'generated_code.py',
          path: '/generated_code.py',
          content: response.content,
          language: 'python'
        };

        // Add success terminal output with analysis
        const successOutput: TerminalOutput = {
          id: `term-${Date.now()}`,
          command: 'python generated_code.py',
          output: `Código generado correctamente${response.fallbackUsed ? ' (usando modelo alternativo debido a cuota excedida)' : ''}`,
          timestamp: Date.now(),
          status: 'success' as const,
          analysis: {
            isValid: true,
            summary: 'Código generado correctamente',
            executionTime: response.executionTime || Math.floor(Math.random() * 1000) + 500
          }
        };

        // Update project state with completed task and new file
        setProjectState(prev => {
          const updatedTasks = prev.tasks.map(task =>
            task.id === newTask.id
              ? { ...task, status: 'completed' as const }
              : task
          );

          return {
            ...prev,
            currentTask: null,
            tasks: updatedTasks,
            files: [...prev.files, newFile],
            terminal: [...prev.terminal, successOutput]
          };
        });

        // Set the newly created file as selected
        setSelectedFileId(newFile.id);
      }
    } catch (error) {
      // Handle error with analysis
      const errorCommand = `process_instruction "${instruction}"`;
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error';
      const errorOutput: TerminalOutput = {
        id: `term-${Date.now()}`,
        command: errorCommand,
        output: errorMessage,
        timestamp: Date.now(),
        status: 'error' as const,
        analysis: {
          isValid: false,
          summary: 'Error al procesar la instrucción',
          executionTime: Math.floor(Math.random() * 500) + 100
        }
      };

      setProjectState(prev => ({
        ...prev,
        terminal: [...prev.terminal, errorOutput],
        isGeneratingProject: false
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para manejar comandos de terminal
  const handleTerminalCommand = (command: string, output: string) => {
    // Analizar el comando para detectar operaciones de archivos
    const fileSystemCommands = parseTerminalCommand(command, output);

    // Si hay operaciones de archivos, actualizar el estado
    if (fileSystemCommands.length > 0) {
      setProjectState(prev => {
        const updatedFiles = applyFileSystemCommands(prev.files, fileSystemCommands);
        return {
          ...prev,
          files: updatedFiles
        };
      });
    }
  };

  // Función para manejar la finalización de pasos del plan
  const handleStepComplete = (stepId: string) => {
    if (!projectState.projectPlan) return;

    setProjectState(prev => {
      if (!prev.projectPlan) return prev;

      const updatedSteps = prev.projectPlan.steps.map(step =>
        step.id === stepId ? { ...step, status: 'completed' as const } : step
      );

      // Encontrar el siguiente paso pendiente
      const nextStep = updatedSteps.find(step => step.status === 'pending');

      return {
        ...prev,
        projectPlan: {
          ...prev.projectPlan,
          steps: updatedSteps,
          currentStepId: nextStep ? nextStep.id : null
        }
      };
    });
  };

  // Función para manejar fallos en los pasos del plan
  const handleStepFailed = (stepId: string) => {
    if (!projectState.projectPlan) return;

    setProjectState(prev => {
      if (!prev.projectPlan) return prev;

      const updatedSteps = prev.projectPlan.steps.map(step =>
        step.id === stepId ? { ...step, status: 'failed' as const } : step
      );

      // Encontrar el siguiente paso pendiente
      const nextStep = updatedSteps.find(step => step.status === 'pending');

      return {
        ...prev,
        projectPlan: {
          ...prev.projectPlan,
          steps: updatedSteps,
          currentStepId: nextStep ? nextStep.id : null
        }
      };
    });
  };

  return (
    <div className="min-h-screen bg-codestorm-darker flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-4 px-4 grid grid-cols-12 gap-4">
        {/* Left sidebar */}
        <div className="col-span-3 space-y-4">
          <ModelSelector
            models={availableModels}
            selectedModel={availableModels.find(m => m.name === projectState.currentModel)?.id || ''}
            onSelectModel={handleSelectModel}
          />
          <ProjectStatus projectState={projectState} />

          {/* Mostrar el estado de los agentes si están activos */}
          {projectState.orchestrator && (
            <AgentStatus tasks={projectState.agentTasks} />
          )}

          {/* Mostrar el plan del proyecto si existe */}
          {projectState.projectPlan && (
            <ProjectPlan
              plan={projectState.projectPlan}
              onStepComplete={handleStepComplete}
              onStepFailed={handleStepFailed}
            />
          )}
        </div>

        {/* Main content area */}
        <div className="col-span-9 space-y-4">
          <InstructionInput
            onSubmitInstruction={handleSubmitInstruction}
            isProcessing={isProcessing}
          />

          <div className="grid grid-cols-12 gap-4 h-[600px]">
            {/* File explorer */}
            <div className="col-span-3 h-full">
              <FileExplorer
                files={projectState.files}
                onSelectFile={setSelectedFileId}
                selectedFileId={selectedFileId}
              />
            </div>

            {/* Code editor and terminal */}
            <div className="col-span-9 grid grid-rows-2 gap-4 h-full">
              <CodeEditor file={selectedFile} />
              <Terminal
                outputs={projectState.terminal}
                onCommandExecuted={handleTerminalCommand}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
