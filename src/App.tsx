import React, { useState } from 'react';
import Header from './components/Header';
import ModelSelector from './components/ModelSelector';
import InstructionInput from './components/InstructionInput';
import ProjectStatus from './components/ProjectStatus';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/CodeEditor';
import Terminal from './components/Terminal';
import { availableModels } from './data/models';
import { ProjectState, FileItem, Task, CommandAnalysis } from './types';
import { processInstruction, tryWithFallback } from './services/ai';
import { analyzeCommandOutput } from './services/terminalAnalyzer';

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const [projectState, setProjectState] = useState<ProjectState>({
    phase: 'planning',
    currentModel: 'GPT-4O',
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
    ]
  });

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
      // Add a new task
      const newTask: Task = {
        id: `task-${Date.now()}`,
        description: instruction,
        assignedModel: projectState.currentModel,
        status: 'in-progress'
      };

      // Add terminal command with analysis
      const processCommand = `process_instruction "${instruction}"`;
      const newTerminalOutput = {
        id: `term-${Date.now()}`,
        command: processCommand,
        output: 'Processing instruction...',
        timestamp: Date.now(),
        status: 'info' as const,
        analysis: analyzeCommandOutput(
          processCommand,
          'Processing instruction...',
          'info',
          0
        )
      };

      // Update project state with new task and terminal output
      setProjectState(prev => ({
        ...prev,
        phase: 'development',
        currentTask: newTask,
        tasks: [...prev.tasks, newTask],
        terminal: [...prev.terminal, newTerminalOutput]
      }));

      // Process the instruction with the selected AI model and fallback handling
      const response = await tryWithFallback(instruction, projectState.currentModel);

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
      const successCommand = 'python generated_code.py';
      const successOutput = {
        id: `term-${Date.now()}`,
        command: successCommand,
        output: `Code generated successfully${response.fallbackUsed ? ' (using fallback model due to OpenAI quota exceeded)' : ''}`,
        timestamp: Date.now(),
        status: 'success' as const,
        analysis: analyzeCommandOutput(
          successCommand,
          `Code generated successfully${response.fallbackUsed ? ' (using fallback model due to OpenAI quota exceeded)' : ''}`,
          'success',
          response.executionTime || Math.floor(Math.random() * 1000) + 500
        )
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
    } catch (error) {
      // Handle error with analysis
      const errorCommand = `process_instruction "${instruction}"`;
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      const errorOutput = {
        id: `term-${Date.now()}`,
        command: errorCommand,
        output: errorMessage,
        timestamp: Date.now(),
        status: 'error' as const,
        analysis: analyzeCommandOutput(
          errorCommand,
          errorMessage,
          'error',
          Math.floor(Math.random() * 500) + 100
        )
      };

      setProjectState(prev => ({
        ...prev,
        terminal: [...prev.terminal, errorOutput]
      }));
    } finally {
      setIsProcessing(false);
    }
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
              <Terminal outputs={projectState.terminal} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
