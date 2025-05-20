import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CollapsiblePanel from '../components/CollapsiblePanel';
import FloatingActionButtons from '../components/FloatingActionButtons';
import BrandLogo from '../components/BrandLogo';
import Footer from '../components/Footer';
import { Eye, Loader, Info, Scissors } from 'lucide-react';
import {
  ConstructorState,
  FileItem,
  ApprovalStage,
  ChatMessage,
  CodeAnalysisResult,
  ApprovalStatus,
  FileObserverState,
  AgentTask
} from '../types';
import { availableModels } from '../data/models';
import { useUI } from '../contexts/UIContext';

// Importación de los componentes reales del Constructor
import ProgressBar from '../components/constructor/ProgressBar';
import StageApproval from '../components/constructor/StageApproval';
import InteractiveChat from '../components/constructor/InteractiveChat';
import FileObserverPanel from '../components/constructor/FileObserverPanel';
import CodeSplitterPanel from '../components/constructor/CodeSplitterPanel';

// Importación de los agentes
import { FileObserverAgent } from '../agents/FileObserverAgent';

// Componente principal de la página Constructor
const Constructor: React.FC = () => {
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(false);
  const [instruction, setInstruction] = useState('');

  // Usar el contexto de UI para la responsividad
  const {
    isMobile,
    isTablet,
    expandedPanel,
    setExpandedPanel
  } = useUI();

  // Estado principal del constructor
  const [constructorState, setConstructorState] = useState<ConstructorState>({
    phase: 'planning',
    currentModel: 'Gemini 2.5',
    currentTask: null,
    tasks: [],
    files: [],
    terminal: [],
    projectPlan: null,
    isGeneratingProject: false,
    agentTasks: [],
    orchestrator: false,
    stages: [],
    currentStageId: null,
    sessionId: `session-${Date.now()}`,
    isPaused: false,
    lastModified: Date.now(),
    fileObserver: {
      observedFiles: [],
      fileContexts: [],
      observations: [],
      isActive: false,
      lastScan: Date.now()
    }
  });

  // Estado del chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'system',
      content: 'Bienvenido al Constructor de CODESTORM. Aquí puedes crear proyectos de forma interactiva, aprobando cada etapa del proceso.',
      timestamp: Date.now(),
      type: 'notification'
    }
  ]);

  // Estado para controlar la visibilidad de paneles en móvil
  const [showChat, setShowChat] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showFileObserver, setShowFileObserver] = useState(false);
  const [showCodeSplitter, setShowCodeSplitter] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Estado para la descripción del proceso de desarrollo
  const [processDescription, setProcessDescription] = useState<string>('');
  const [showProcessDescription, setShowProcessDescription] = useState<boolean>(false);

  // Función para actualizar la descripción del proceso según la etapa
  const updateProcessDescription = (phase: string, stageType?: string) => {
    let description = '';

    switch (phase) {
      case 'planning':
        description = 'Analizando tu solicitud y planificando la estructura del proyecto...';
        break;
      case 'development':
        if (stageType === 'planner') {
          description = 'Diseñando la arquitectura y estructura de archivos del proyecto...';
        } else if (stageType === 'codeGenerator') {
          description = 'Generando el código base y los componentes principales...';
        } else if (stageType === 'fileSynchronizer') {
          description = 'Sincronizando archivos y asegurando la consistencia del proyecto...';
        } else if (stageType === 'codeModifier') {
          description = 'Implementando modificaciones y mejoras en el código...';
        } else if (stageType === 'fileObserver') {
          description = 'Analizando la estructura y contenido de los archivos...';
        } else {
          description = 'Trabajando en el desarrollo del proyecto...';
        }
        break;
      case 'testing':
        description = 'Ejecutando pruebas y verificando la funcionalidad del proyecto...';
        break;
      case 'review':
        description = 'Revisando el código y optimizando el rendimiento...';
        break;
      default:
        description = 'Procesando tu solicitud...';
    }

    setProcessDescription(description);
    setShowProcessDescription(true);

    // Ocultar la descripción después de un tiempo si no estamos en fase de inicialización
    if (!isInitializing) {
      setTimeout(() => {
        setShowProcessDescription(false);
      }, 5000);
    }
  };

  // Función para iniciar un nuevo proyecto
  const handleStartProject = () => {
    if (!instruction.trim() || isInitializing) return;

    setIsInitializing(true);
    updateProcessDescription('planning');

    // Simulación de inicio de proyecto (placeholder)
    setTimeout(() => {
      // Crear una etapa de planificación simulada
      const plannerStage: ApprovalStage = {
        id: `stage-planner-${Date.now()}`,
        type: 'planner',
        title: 'Plan del Proyecto',
        description: 'Revisión y aprobación del plan general del proyecto',
        status: 'pending',
        proposal: JSON.stringify({
          projectStructure: {
            name: "Proyecto de Ejemplo",
            description: "Este es un proyecto de ejemplo para demostrar el Constructor",
            files: [
              {
                path: "/index.html",
                description: "Página principal del proyecto"
              },
              {
                path: "/styles.css",
                description: "Estilos del proyecto"
              },
              {
                path: "/script.js",
                description: "Lógica del proyecto"
              }
            ]
          },
          implementationSteps: [
            {
              id: "paso-1",
              title: "Crear estructura básica",
              description: "Crear los archivos principales del proyecto",
              filesToCreate: ["/index.html", "/styles.css", "/script.js"]
            }
          ]
        }, null, 2),
        timestamp: Date.now()
      };

      // Actualizar el estado del constructor
      setConstructorState(prev => ({
        ...prev,
        stages: [plannerStage],
        currentStageId: plannerStage.id,
        phase: 'development',
        lastModified: Date.now()
      }));

      // Añadir mensaje al chat
      addChatMessage({
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        content: 'He creado un plan para tu proyecto. Por favor, revísalo y apruébalo para continuar.',
        timestamp: Date.now(),
        type: 'notification',
        metadata: {
          requiresAction: true,
          stageId: plannerStage.id
        }
      });

      // Actualizar la descripción del proceso
      updateProcessDescription('development', 'planner');

      setIsInitializing(false);
    }, 2000);
  };

  // Función para manejar la aprobación de una etapa
  const handleStageApproval = (stageId: string, feedback?: string) => {
    // Encontrar la etapa actual
    const currentStage = constructorState.stages.find(stage => stage.id === stageId);
    if (!currentStage) return;

    // Mostrar descripción del proceso
    updateProcessDescription('development', currentStage.type);

    // Actualizar el estado de la etapa
    setConstructorState(prev => {
      const updatedStages = prev.stages.map(stage =>
        stage.id === stageId
          ? { ...stage, status: 'approved' as ApprovalStatus, feedback }
          : stage
      );

      return {
        ...prev,
        stages: updatedStages,
        lastModified: Date.now()
      };
    });

    // Añadir mensaje al chat
    addChatMessage({
      id: `msg-approved-${Date.now()}`,
      sender: 'system',
      content: 'Etapa aprobada. Continuando con el proceso...',
      timestamp: Date.now(),
      type: 'notification'
    });
  };

  // Función para manejar la modificación de una etapa
  const handleStageModification = (stageId: string, feedback: string) => {
    // Encontrar la etapa actual
    const currentStage = constructorState.stages.find(stage => stage.id === stageId);
    if (!currentStage) return;

    // Mostrar descripción del proceso
    updateProcessDescription('development', 'codeModifier');

    // Actualizar el estado de la etapa
    setConstructorState(prev => {
      const updatedStages = prev.stages.map(stage =>
        stage.id === stageId
          ? { ...stage, status: 'modified' as ApprovalStatus, feedback }
          : stage
      );

      return {
        ...prev,
        stages: updatedStages,
        isPaused: true,
        lastModified: Date.now()
      };
    });

    // Añadir mensaje al chat
    addChatMessage({
      id: `msg-modified-${Date.now()}`,
      sender: 'user',
      content: `He solicitado modificaciones: ${feedback}`,
      timestamp: Date.now(),
      type: 'text'
    });
  };

  // Función para manejar el rechazo de una etapa
  const handleStageRejection = (stageId: string, feedback: string) => {
    // Encontrar la etapa actual
    const currentStage = constructorState.stages.find(stage => stage.id === stageId);
    if (!currentStage) return;

    // Mostrar descripción del proceso
    updateProcessDescription('planning');

    // Actualizar el estado de la etapa
    setConstructorState(prev => {
      const updatedStages = prev.stages.map(stage =>
        stage.id === stageId
          ? { ...stage, status: 'rejected' as ApprovalStatus, feedback }
          : stage
      );

      return {
        ...prev,
        stages: updatedStages,
        isPaused: true,
        lastModified: Date.now()
      };
    });

    // Añadir mensaje al chat
    addChatMessage({
      id: `msg-rejected-${Date.now()}`,
      sender: 'user',
      content: `He rechazado esta etapa: ${feedback}`,
      timestamp: Date.now(),
      type: 'text'
    });
  };

  // Función para añadir un mensaje al chat
  const addChatMessage = (message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  };

  // Función para enviar un mensaje desde el chat
  const handleSendMessage = (content: string) => {
    // Añadir el mensaje del usuario al chat
    addChatMessage({
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      content,
      timestamp: Date.now(),
      type: 'text'
    });

    // Simular respuesta del asistente
    setTimeout(() => {
      addChatMessage({
        id: `msg-assistant-${Date.now()}`,
        sender: 'assistant',
        content: `He recibido tu mensaje: "${content}". Estoy trabajando en ello...`,
        timestamp: Date.now(),
        type: 'text'
      });
    }, 1000);
  };

  // Función para alternar la vista previa
  const handleTogglePreview = () => {
    setShowPreview(prev => !prev);
  };

  // Función para alternar el chat
  const handleToggleChat = () => {
    setShowChat(prev => !prev);
  };

  // Función para alternar el observador de archivos
  const handleToggleFileObserver = () => {
    const newState = !constructorState.fileObserver?.isActive;

    // Si activamos el observador, ocultamos el separador de código
    if (newState && showCodeSplitter) {
      setShowCodeSplitter(false);
    }

    setConstructorState(prev => ({
      ...prev,
      fileObserver: {
        ...prev.fileObserver!,
        isActive: newState
      }
    }));

    // Si se activa el observador, realizar un escaneo inicial
    if (newState) {
      handleScanFiles();
    }

    // Mostrar mensaje en el chat
    addChatMessage({
      id: `msg-observer-${Date.now()}`,
      sender: 'system',
      content: `Observador de archivos ${newState ? 'activado' : 'desactivado'}.`,
      timestamp: Date.now(),
      type: 'notification'
    });
  };

  // Función para alternar el separador de código
  const handleToggleCodeSplitter = () => {
    setShowCodeSplitter(prev => !prev);

    // Si activamos el separador, ocultamos el observador de archivos
    if (!showCodeSplitter && showFileObserver) {
      setShowFileObserver(false);
    }
  };

  // Función para manejar los archivos generados por el separador de código
  const handleFilesGenerated = (files: FileItem[]) => {
    // Añadir los archivos generados al estado del constructor
    setConstructorState(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }));

    // Añadir mensaje al chat
    addChatMessage({
      id: `msg-files-generated-${Date.now()}`,
      sender: 'system',
      content: `Se han generado ${files.length} archivos a partir del código separado.`,
      timestamp: Date.now(),
      type: 'notification'
    });
  };

  // Función para escanear archivos con el observador
  const handleScanFiles = () => {
    if (!constructorState.fileObserver?.isActive || isScanning) return;

    setIsScanning(true);
    updateProcessDescription('development', 'fileObserver');

    // Crear tarea para el agente de observación
    const observerTask: AgentTask = {
      id: `task-observer-${Date.now()}`,
      type: 'fileObserver',
      instruction: 'Analizar archivos del proyecto',
      status: 'working',
      startTime: Date.now()
    };

    // Ejecutar el agente de observación
    const result = FileObserverAgent.execute(
      observerTask,
      constructorState.files,
      constructorState.fileObserver
    );

    // Actualizar el estado con el resultado
    if (result.success && result.data?.fileObserverState) {
      setConstructorState(prev => ({
        ...prev,
        fileObserver: result.data.fileObserverState
      }));

      // Añadir mensaje al chat si hay nuevas observaciones
      const newObservationsCount =
        result.data.fileObserverState.observations.length -
        (constructorState.fileObserver?.observations.length || 0);

      if (newObservationsCount > 0) {
        addChatMessage({
          id: `msg-observer-scan-${Date.now()}`,
          sender: 'system',
          content: `El observador de archivos ha encontrado ${newObservationsCount} nuevas observaciones.`,
          timestamp: Date.now(),
          type: 'notification'
        });
      }
    }

    // Finalizar el escaneo
    setTimeout(() => {
      setIsScanning(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-codestorm-darker flex flex-col">
      <Header
        showConstructorButton={false}
        onPreviewClick={handleTogglePreview}
        onChatClick={handleToggleChat}
      />

      <main className="flex-1 container mx-auto py-4 px-4">
        <div className="bg-codestorm-dark rounded-lg shadow-md p-6 mb-6">
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white mb-4`}>Constructor de CODESTORM</h1>
          <p className="text-gray-300 mb-6">
            Crea proyectos de forma interactiva con un sistema de aprobación por etapas.
            Tendrás control total sobre cada fase del desarrollo.
          </p>

          {/* Descripción del proceso de desarrollo */}
          {showProcessDescription && (
            <div className="bg-codestorm-blue/10 border border-codestorm-blue/30 rounded-md p-3 mb-4 flex items-center">
              <Loader className="h-5 w-5 text-codestorm-accent mr-2 animate-spin" />
              <p className="text-white text-sm">{processDescription}</p>
            </div>
          )}

          {constructorState.stages.length === 0 && (
            <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex space-x-4'}`}>
              <input
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Describe el proyecto que quieres crear..."
                className="flex-1 bg-codestorm-darker border border-codestorm-blue/30 rounded-md p-3 text-white"
                disabled={isInitializing}
              />
              <button
                onClick={handleStartProject}
                disabled={!instruction.trim() || isInitializing}
                className={`${isMobile ? 'w-full' : ''} px-6 py-3 rounded-md ${
                  !instruction.trim() || isInitializing
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-codestorm-accent hover:bg-blue-600 text-white'
                }`}
              >
                {isInitializing ? 'Iniciando...' : 'Iniciar Proyecto'}
              </button>
            </div>
          )}
        </div>

        {constructorState.stages.length > 0 && (
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-12 gap-6'}`}>
            {/* Panel de progreso - colapsable en móvil */}
            <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-4' : 'col-span-3'} ${
              expandedPanel === 'sidebar' ? 'fixed inset-0 z-40 p-4 bg-codestorm-darker overflow-auto' : ''
            }`}>
              <div className="space-y-4">
                <CollapsiblePanel
                  title="Progreso del Proyecto"
                  type="sidebar"
                  isVisible={true}
                  showCollapseButton={false}
                >
                  <ProgressBar
                    stages={constructorState.stages}
                    currentStageId={constructorState.currentStageId}
                  />
                </CollapsiblePanel>

                {/* Panel del Observador de Archivos */}
                <CollapsiblePanel
                  title="Observador de Archivos"
                  type="explorer"
                  isVisible={showFileObserver}
                  onToggleVisibility={() => setShowFileObserver(!showFileObserver)}
                  showCollapseButton={true}
                >
                  <div className={`${isMobile ? 'h-[300px]' : 'h-[400px]'}`}>
                    <FileObserverPanel
                      files={constructorState.files}
                      observerState={constructorState.fileObserver}
                      onToggleObserver={handleToggleFileObserver}
                      onScanFiles={handleScanFiles}
                      isScanning={isScanning}
                    />
                  </div>
                </CollapsiblePanel>

                <CollapsiblePanel
                  title="Separador de Código"
                  type="explorer"
                  isVisible={showCodeSplitter}
                  onToggleVisibility={handleToggleCodeSplitter}
                  showCollapseButton={true}
                >
                  <div className={`${isMobile ? 'h-[300px]' : 'h-[400px]'}`}>
                    <CodeSplitterPanel
                      onFilesGenerated={handleFilesGenerated}
                    />
                  </div>
                </CollapsiblePanel>
              </div>
            </div>

            {/* Panel principal - se ajusta según el dispositivo */}
            <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-8' : 'col-span-9'} space-y-6`}>
              <CollapsiblePanel
                title="Etapa Actual"
                type="editor"
                isVisible={true}
                showCollapseButton={false}
              >
                <StageApproval
                  stage={constructorState.stages.find(s => s.id === constructorState.currentStageId) || null}
                  onApprove={handleStageApproval}
                  onModify={handleStageModification}
                  onReject={handleStageRejection}
                  isPaused={constructorState.isPaused}
                />
              </CollapsiblePanel>

              <div className={`${isMobile ? 'h-[300px]' : 'h-[400px]'}`}>
                <CollapsiblePanel
                  title="Chat Interactivo"
                  type="terminal"
                  isVisible={true}
                  showCollapseButton={false}
                >
                  <InteractiveChat
                    messages={chatMessages}
                    onSendMessage={handleSendMessage}
                    isProcessing={isInitializing}
                  />
                </CollapsiblePanel>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Botones flotantes para móvil y tablet */}
      {(isMobile || isTablet) && constructorState.stages.length > 0 && (
        <div className="fixed bottom-4 right-4 flex flex-col space-y-2">
          <button
            onClick={() => setShowFileObserver(!showFileObserver)}
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all ${
              showFileObserver ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
            aria-label="Mostrar/ocultar observador de archivos"
          >
            <Eye className="h-5 w-5" />
          </button>

          <button
            onClick={handleToggleCodeSplitter}
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all ${
              showCodeSplitter ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
            aria-label="Mostrar/ocultar separador de código"
          >
            <Scissors className="h-5 w-5" />
          </button>

          <FloatingActionButtons
            onToggleChat={handleToggleChat}
            onTogglePreview={handleTogglePreview}
            showChat={showChat}
          />
        </div>
      )}

      {/* Logo de BOTIDINAMIX */}
      <BrandLogo size="md" showPulse={true} showGlow={true} />

      {/* Pie de página */}
      <Footer showLogo={true} />
    </div>
  );
};

export default Constructor;
