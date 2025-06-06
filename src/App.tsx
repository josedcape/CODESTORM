import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Constructor from './pages/Constructor';
import CodeCorrector from './pages/CodeCorrector';
import WebAI from './pages/WebAI';
import VoiceTestPage from './pages/VoiceTestPage';
import Agent from './pages/Agent';
import Header from './components/Header';
import ModelSelector from './components/ModelSelector';
import InstructionInput from './components/InstructionInput';
import ProjectStatus from './components/ProjectStatus';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/CodeEditor';
import Terminal from './components/Terminal';
import ProjectPlan from './components/ProjectPlan';
import AgentStatus from './components/AgentStatus';
import ChatInterface from './components/ChatInterface';
import ProjectExporter from './components/ProjectExporter';
import CodePreview from './components/CodePreview';
import CollapsiblePanel from './components/CollapsiblePanel';
import UniversalFloatingButtons from './components/common/UniversalFloatingButtons';
import WebPreviewTest from './components/common/WebPreviewTest';
import SimpleWebPreviewButton from './components/common/SimpleWebPreviewButton';
import BrandLogo from './components/BrandLogo';
import Footer from './components/Footer';
import HelpAssistant from './components/HelpAssistant';
import CodeModifierPanel from './components/codemodifier/CodeModifierPanel';
import IntroAnimation from './components/IntroAnimation';
import useIntroAnimation from './hooks/useIntroAnimation';
import { availableModels } from './data/models';
import {
  ProjectState,
  FileItem,
  Task,
  TerminalOutput,
  CodeModifierResult
} from './types';
import { tryWithFallback } from './services/ai';
import { parseTerminalCommand, applyFileSystemCommands } from './services/fileSystemService';
import { AgentOrchestrator } from './agents/AgentOrchestrator';
import { useUI } from './contexts/UIContext';

// Componente principal que contiene la aplicación original
const MainApp: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showHelpAssistant, setShowHelpAssistant] = useState(false);

  // Animación de introducción removida - ahora está en la página Menu

  // Inicializar reconocimiento de voz global
  useEffect(() => {
    console.log('Inicializando reconocimiento de voz global en página principal...');
    import('./utils/voiceInitializer').then(({ initializeVoiceRecognition, cleanupVoiceRecognition }) => {
      initializeVoiceRecognition({
        onStormCommand: (command: string) => {
          console.log('Comando STORM recibido en página principal:', command);
          // Aquí se puede procesar el comando como una instrucción
          handleSubmitInstruction(command);
        },
        enableDebug: true,
        autoStart: true
      });
    });

    return () => {
      import('./utils/voiceInitializer').then(({ cleanupVoiceRecognition }) => {
        cleanupVoiceRecognition();
      });
    };
  }, []);

  // Para propósitos de desarrollo, forzar la animación
  // Comentar esta línea para producción
  // useEffect(() => {
  //   localStorage.removeItem('codestorm-intro-seen');
  // }, []);

  // Usar el contexto de UI para la responsividad
  const {
    isSidebarVisible,
    isFileExplorerVisible,
    isTerminalVisible,
    isCodeModifierVisible,
    toggleSidebar,
    toggleFileExplorer,
    toggleTerminal,
    toggleCodeModifier,
    isMobile,
    isTablet,
    expandedPanel
  } = useUI();

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

          // Si se generó una propuesta de diseño, mostrar mensaje informativo
          if (result.designProposal) {
            const designInfoOutput: TerminalOutput = {
              id: `term-design-info-${Date.now()}`,
              command: 'echo "Propuesta de diseño generada"',
              output: `Agente de Diseño: Se ha generado una propuesta visual para el proyecto. Los archivos HTML y CSS han sido creados automáticamente.`,
              timestamp: Date.now(),
              status: 'info' as const,
              analysis: {
                isValid: true,
                summary: 'Propuesta de diseño generada',
                executionTime: Math.floor(Math.random() * 200) + 100
              }
            };

            setProjectState(prev => ({
              ...prev,
              terminal: [...prev.terminal, designInfoOutput]
            }));
          }

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

  // Función para manejar mensajes del chat
  const handleChatMessage = async (message: string, fileId?: string) => {
    setIsProcessing(true);

    try {
      // Si hay un archivo seleccionado, modificarlo
      if (fileId) {
        await handleModifyFile(fileId, message);
      } else {
        // Procesar como una instrucción normal
        await handleSubmitInstruction(message);
      }
    } catch (error) {
      console.error('Error al procesar mensaje del chat:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para modificar un archivo existente
  const handleModifyFile = async (fileId: string, instruction: string) => {
    setIsProcessing(true);

    try {
      const file = projectState.files.find(f => f.id === fileId);
      if (!file) {
        throw new Error(`No se encontró el archivo con ID ${fileId}`);
      }

      // Añadir mensaje a la terminal
      const modifyCommand = `modify_file "${file.path}" "${instruction}"`;
      const terminalOutput: TerminalOutput = {
        id: `term-modify-${Date.now()}`,
        command: modifyCommand,
        output: `Modificando archivo ${file.path}...`,
        timestamp: Date.now(),
        status: 'info' as const,
        analysis: {
          isValid: true,
          summary: 'Modificando archivo',
          executionTime: 0
        }
      };

      setProjectState(prev => ({
        ...prev,
        terminal: [...prev.terminal, terminalOutput]
      }));

      // Usar el orquestador para modificar el archivo
      const result = await orchestrator.modifyFile(instruction, fileId);

      // Actualizar el estado con el archivo modificado
      setProjectState(prev => {
        // Encontrar el índice del archivo original
        const fileIndex = prev.files.findIndex(f => f.id === fileId);

        if (fileIndex === -1) return prev;

        // Crear una nueva lista de archivos con el archivo modificado
        const updatedFiles = [...prev.files];
        updatedFiles[fileIndex] = result.modifiedFile;

        // Añadir mensaje de éxito a la terminal
        const successOutput: TerminalOutput = {
          id: `term-modify-success-${Date.now()}`,
          command: `echo "Archivo ${file.path} modificado con éxito"`,
          output: `Archivo ${file.path} modificado con éxito`,
          timestamp: Date.now(),
          status: 'success' as const,
          analysis: {
            isValid: true,
            summary: 'Archivo modificado con éxito',
            executionTime: Math.floor(Math.random() * 500) + 200
          }
        };

        return {
          ...prev,
          files: updatedFiles,
          terminal: [...prev.terminal, successOutput],
          agentTasks: [...prev.agentTasks, ...result.tasks]
        };
      });
    } catch (error) {
      console.error('Error al modificar archivo:', error);

      // Añadir mensaje de error a la terminal
      const errorOutput: TerminalOutput = {
        id: `term-modify-error-${Date.now()}`,
        command: 'echo "Error al modificar archivo"',
        output: `Error al modificar archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: Date.now(),
        status: 'error' as const,
        analysis: {
          isValid: false,
          summary: 'Error al modificar archivo',
          executionTime: Math.floor(Math.random() * 300) + 100
        }
      };

      setProjectState(prev => ({
        ...prev,
        terminal: [...prev.terminal, errorOutput]
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para manejar la previsualización del código
  const handleTogglePreview = () => {
    setShowPreview(prev => !prev);
  };

  // Función para manejar el chat
  const handleToggleChat = () => {
    setShowChat(prev => !prev);
  };

  // Función para manejar el asistente de ayuda
  const handleToggleHelpAssistant = () => {
    setShowHelpAssistant(prev => !prev);
  };

  // Función para detectar si un archivo es estático y afecta la vista previa
  const isStaticWebFile = (file: FileItem): boolean => {
    const staticExtensions = ['.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx', '.json', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
    const staticPaths = ['index.html', 'styles.css', 'style.css', 'main.css', 'app.css', 'script.js', 'main.js', 'app.js'];

    // Verificar por extensión
    const hasStaticExtension = staticExtensions.some(ext =>
      file.path.toLowerCase().endsWith(ext) || file.name.toLowerCase().endsWith(ext)
    );

    // Verificar por nombre de archivo común
    const hasStaticName = staticPaths.some(path =>
      file.path.toLowerCase().includes(path) || file.name.toLowerCase() === path
    );

    // Verificar por contenido HTML/CSS/JS
    const hasWebContent = file.content && (
      file.content.includes('<!DOCTYPE html>') ||
      file.content.includes('<html') ||
      file.content.includes('<style>') ||
      file.content.includes('body {') ||
      file.content.includes('function ') ||
      file.content.includes('const ') ||
      file.content.includes('var ') ||
      file.content.includes('let ')
    );

    return hasStaticExtension || hasStaticName || hasWebContent;
  };

  // Función para aplicar cambios del modificador de código
  const handleApplyCodeModifications = (originalFile: FileItem, modifiedFile: FileItem) => {
    // Detectar si es un archivo estático que afecta la vista previa
    const isStaticFile = isStaticWebFile(modifiedFile);

    // Actualizar el estado con el archivo modificado
    setProjectState(prev => {
      // Encontrar el índice del archivo original
      const fileIndex = prev.files.findIndex(f => f.id === originalFile.id);

      if (fileIndex === -1) return prev;

      // Crear una nueva lista de archivos con el archivo modificado
      const updatedFiles = [...prev.files];
      updatedFiles[fileIndex] = modifiedFile;

      // Añadir mensaje de éxito a la terminal
      const successOutput: TerminalOutput = {
        id: `term-modify-success-${Date.now()}`,
        command: `echo "Archivo ${modifiedFile.path} modificado con éxito"`,
        output: `Archivo ${modifiedFile.path} modificado con éxito mediante el Agente Modificador de Código${isStaticFile ? ' - Vista previa actualizada automáticamente' : ''}`,
        timestamp: Date.now(),
        status: 'success' as const,
        analysis: {
          isValid: true,
          summary: 'Archivo modificado con éxito',
          executionTime: Math.floor(Math.random() * 300) + 100
        }
      };

      return {
        ...prev,
        files: updatedFiles,
        terminal: [...prev.terminal, successOutput]
      };
    });

    // Si es un archivo estático y la vista previa está abierta, forzar actualización
    if (isStaticFile && showPreview) {
      console.log('🔄 Archivo estático modificado, actualizando vista previa automáticamente:', modifiedFile.path);

      // Pequeño delay para asegurar que el estado se haya actualizado
      setTimeout(() => {
        // Disparar evento personalizado para notificar al CodePreview
        const event = new CustomEvent('codestorm-file-modified', {
          detail: {
            file: modifiedFile,
            isStaticFile: true,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(event);
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-codestorm-darker flex flex-col">
      <Header
        onPreviewClick={handleTogglePreview}
        onChatClick={handleToggleChat}
        showConstructorButton={true}
      />

      <main className="flex-1 container mx-auto py-4 px-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left sidebar - colapsable en móvil y tablet */}
          {isSidebarVisible && (
            <div className={`${isMobile ? 'col-span-12' : isTablet ? 'col-span-4' : 'col-span-3'} space-y-4 ${
              expandedPanel === 'sidebar' ? 'fixed inset-0 z-40 p-4 bg-codestorm-darker overflow-auto' : ''
            }`}>
              <CollapsiblePanel
                title="Configuración"
                type="sidebar"
                isVisible={true}
                onToggleVisibility={toggleSidebar}
                showCollapseButton={!isMobile}
              >
                <div className="space-y-4 p-2">
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

                  {/* Exportador de proyecto */}
                  <ProjectExporter
                    files={projectState.files}
                    selectedFileId={selectedFileId}
                    projectName={projectState.projectPlan?.title || 'codestorm-project'}
                  />
                </div>
              </CollapsiblePanel>
            </div>
          )}

          {/* Main content area - se ajusta según la visibilidad del sidebar */}
          <div className={`${
            isMobile
              ? 'col-span-12'
              : isTablet
                ? isSidebarVisible ? 'col-span-8' : 'col-span-12'
                : isSidebarVisible ? 'col-span-9' : 'col-span-12'
          } space-y-4`}>
            <InstructionInput
              onSubmitInstruction={handleSubmitInstruction}
              isProcessing={isProcessing}
            />

            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-12'} gap-4 ${isMobile ? 'h-auto' : 'h-[600px]'}`}>
              {/* File explorer - colapsable en móvil */}
              {isFileExplorerVisible && (
                <div className={`${
                  isMobile
                    ? 'col-span-1'
                    : isTablet
                      ? 'col-span-4'
                      : 'col-span-3'
                } h-full ${
                  expandedPanel === 'explorer' ? 'fixed inset-0 z-40 p-4 bg-codestorm-darker overflow-auto' : ''
                }`}>
                  <CollapsiblePanel
                    title="Explorador de Archivos"
                    type="explorer"
                    isVisible={true}
                    onToggleVisibility={toggleFileExplorer}
                    showCollapseButton={!isMobile}
                  >
                    <FileExplorer
                      files={projectState.files}
                      onSelectFile={setSelectedFileId}
                      selectedFileId={selectedFileId}
                    />
                  </CollapsiblePanel>
                </div>
              )}

              {/* Code editor and terminal/chat - se ajusta según la visibilidad del explorador */}
              <div className={`${
                isMobile
                  ? 'col-span-1'
                  : isTablet
                    ? isFileExplorerVisible ? 'col-span-8' : 'col-span-12'
                    : isFileExplorerVisible ? 'col-span-9' : 'col-span-12'
              } ${isMobile ? 'space-y-4' : 'grid grid-rows-2 gap-4 h-full'}`}>
                <CollapsiblePanel
                  title="Editor de Código"
                  type="editor"
                  isVisible={true}
                  showCollapseButton={false}
                >
                  <CodeEditor file={selectedFile} />
                </CollapsiblePanel>

                <CollapsiblePanel
                  title={showChat ? "Chat" : "Terminal"}
                  type="terminal"
                  isVisible={isTerminalVisible}
                  onToggleVisibility={toggleTerminal}
                  showCollapseButton={!isMobile}
                >
                  {showChat ? (
                    <ChatInterface
                      onSendMessage={handleChatMessage}
                      onModifyFile={handleModifyFile}
                      isProcessing={isProcessing}
                      files={projectState.files}
                      selectedFileId={selectedFileId}
                    />
                  ) : (
                    <Terminal
                      outputs={projectState.terminal}
                      onCommandExecuted={handleTerminalCommand}
                    />
                  )}
                </CollapsiblePanel>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Vista previa del código */}
      {showPreview && (
        <CodePreview
          files={projectState.files}
          onClose={handleTogglePreview}
        />
      )}

      {/* Panel de modificación de código */}
      <CodeModifierPanel
        isVisible={isCodeModifierVisible}
        onClose={toggleCodeModifier}
        files={projectState.files}
        onApplyChanges={handleApplyCodeModifications}
      />

      {/* Botones flotantes universales */}
      <UniversalFloatingButtons
        onToggleChat={handleToggleChat}
        onTogglePreview={handleTogglePreview}
        onToggleCodeModifier={toggleCodeModifier}
        onToggleHelpAssistant={handleToggleHelpAssistant}
        onOpenWebPreview={() => {
          // Lógica para abrir vista previa web desde home
          console.log('🌐 Abriendo vista previa web desde Home');
        }}
        onOpenCodeCorrector={() => {
          // Lógica para abrir corrector de código desde home
          console.log('🔧 Abriendo corrector de código desde Home');
        }}
        showChat={showChat}
        showCodeModifier={isCodeModifierVisible}
        showHelpAssistant={showHelpAssistant}
        files={projectState.files}
        projectName={projectState.projectName || 'Proyecto CODESTORM'}
        currentPage="home"
      />

      {/* Asistente de ayuda */}
      <HelpAssistant
        isOpen={showHelpAssistant}
        onClose={handleToggleHelpAssistant}
      />

      {/* Logo de BOTIDINAMIX */}
      <BrandLogo size="md" showPulse={true} showGlow={true} />

      {/* Componente de prueba para vista previa web */}
      <WebPreviewTest />

      {/* Botón simple de prueba */}
      <SimpleWebPreviewButton />

      {/* Pie de página */}
      <Footer showLogo={true} />
    </div>
  );
};

// Componente MainApp con animación de introducción
const MainAppWithIntro: React.FC = () => {
  // Hook para manejar la animación de introducción específica para la página principal
  const { showIntro, completeIntro } = useIntroAnimation('home');

  // TEMPORAL: Para testing - descomentar para resetear animaciones
  // useEffect(() => {
  //   localStorage.removeItem('codestorm-intro-seen-home');
  //   localStorage.removeItem('codestorm-intro-seen-menu');
  //   console.log('🧹 Limpiando localStorage para testing');
  // }, []);

  // Renderizar la animación de introducción si está activa
  if (showIntro) {
    return <IntroAnimation onComplete={completeIntro} />;
  }

  // Renderizar la aplicación principal
  return <MainApp />;
};

// Componente principal que maneja el enrutamiento
function App() {
  return (
    <Routes>
      <Route path="/" element={<Menu />} />
      <Route path="/home" element={<MainAppWithIntro />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/constructor" element={<ConstructorPage />} />
      <Route path="/codecorrector" element={<CodeCorrectorPage />} />
      <Route path="/webai" element={<WebAIPage />} />
      <Route path="/agent" element={<AgentPage />} />
      <Route path="/voice-test" element={<VoiceTestPage />} />
    </Routes>
  );
}

// Página Constructor que utiliza el componente real
const ConstructorPage: React.FC = () => {
  return <Constructor />;
};

// Página CodeCorrector que utiliza el componente real
const CodeCorrectorPage: React.FC = () => {
  return <CodeCorrector />;
};

// Página WebAI que utiliza el componente real
const WebAIPage: React.FC = () => {
  return <WebAI />;
};

// Página Agent que utiliza el componente real
const AgentPage: React.FC = () => {
  return <Agent />;
};

export default App;
