import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CollapsiblePanel from '../components/CollapsiblePanel';
import FloatingActionButtons from '../components/FloatingActionButtons';
import BrandLogo from '../components/BrandLogo';
import Footer from '../components/Footer';
import { Eye, Loader, Info, Scissors, Clock, Layers, AlertTriangle, FileText, Folder, ArrowRight, BarChart2, Plus, Edit, Trash } from 'lucide-react';
import {
  ConstructorState,
  FileItem,
  ApprovalStage,
  ChatMessage,
  CodeAnalysisResult,
  ApprovalStatus,
  FileObserverState,
  AgentTask,
  SeguimientoState,
  HistoryEvent,
  FileAnalysis,
  FileChangeAnalysis,
  LectorState
} from '../types';
import { availableModels } from '../data/models';
import { useUI } from '../contexts/UIContext';

// Importación de los componentes reales del Constructor
import ProgressBar from '../components/constructor/ProgressBar';
import StageApproval from '../components/constructor/StageApproval';
import StageApprovalModal from '../components/constructor/StageApprovalModal';
import InteractiveChat from '../components/constructor/InteractiveChat';
import FileObserverPanel from '../components/constructor/FileObserverPanel';
import CodeSplitterPanel from '../components/constructor/CodeSplitterPanel';
import SeguimientoPanel from '../components/seguimiento/SeguimientoPanel';
import ErrorNotification from '../components/constructor/ErrorNotification';

// Importación de componentes del Agente Lector
import LectorPanel from '../components/lector/LectorPanel';
import LectorSummary from '../components/lector/LectorSummary';
import LectorButton from '../components/lector/LectorButton';

// Importación del explorador de directorios
import DirectoryExplorer from '../components/constructor/DirectoryExplorer';
import DirectoryExplorerButton from '../components/constructor/DirectoryExplorerButton';

// Importación de los nuevos componentes
import ProjectTemplateSelector from '../components/constructor/ProjectTemplateSelector';
import ProjectRoadmap from '../components/constructor/ProjectRoadmap';
import StageProgressTracker from '../components/constructor/StageProgressTracker';

// Importación de los agentes
import { FileObserverAgent } from '../agents/FileObserverAgent';
import { AgenteLector } from '../agents/AgenteLector';

// Importación de servicios
import { SeguimientoService } from '../services/SeguimientoService';
import { LectorService } from '../services/LectorService';

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

  // Inicializar el servicio de seguimiento
  const seguimientoService = SeguimientoService.getInstance();

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
    },
    seguimiento: seguimientoService.getState()
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
  const [showSeguimiento, setShowSeguimiento] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<HistoryEvent | null>(null);

  // Estado para controlar la visibilidad de la modal de etapa
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [currentStage, setCurrentStage] = useState<ApprovalStage | null>(null);

  // Estado para mensajes de error
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  // Estado para la descripción del proceso de desarrollo
  const [processDescription, setProcessDescription] = useState<string>('');
  const [showProcessDescription, setShowProcessDescription] = useState<boolean>(false);

  // Estado para el Agente Lector
  const [showLector, setShowLector] = useState<boolean>(false);
  const [currentFileAnalysis, setCurrentFileAnalysis] = useState<FileAnalysis | null>(null);
  const [currentChangeAnalysis, setCurrentChangeAnalysis] = useState<FileChangeAnalysis | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [lectorState, setLectorState] = useState<LectorState>({
    analyzedFiles: [],
    pendingChanges: [],
    isActive: true,
    lastAnalysis: Date.now()
  });

  // Estado para el explorador de directorios
  const [showDirectoryExplorer, setShowDirectoryExplorer] = useState<boolean>(false);

  // Estado para los nuevos componentes
  const [showTemplateSelector, setShowTemplateSelector] = useState<boolean>(true);
  const [showRoadmap, setShowRoadmap] = useState<boolean>(false);
  const [showProgressTracker, setShowProgressTracker] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Efecto para suscribirse a los cambios en el estado del servicio de seguimiento
  useEffect(() => {
    const handleSeguimientoStateChange = (state: SeguimientoState) => {
      setConstructorState(prev => ({
        ...prev,
        seguimiento: state,
        lastModified: Date.now()
      }));
    };

    // Añadir listener
    seguimientoService.addListener(handleSeguimientoStateChange);

    // Activar el agente de seguimiento
    seguimientoService.activate();

    // Limpiar al desmontar
    return () => {
      seguimientoService.removeListener(handleSeguimientoStateChange);
    };
  }, []);

  // Efecto para suscribirse a los cambios en el estado del servicio del Agente Lector
  useEffect(() => {
    const handleLectorStateChange = (state: LectorState) => {
      setLectorState(state);
    };

    const lectorService = LectorService.getInstance();
    const unsubscribe = lectorService.subscribe(handleLectorStateChange);

    return () => {
      unsubscribe();
    };
  }, []);

  // Efecto para actualizar la etapa actual cuando cambie el estado del constructor
  useEffect(() => {
    if (isStageModalOpen && constructorState.currentStageId) {
      const stage = constructorState.stages.find(s => s.id === constructorState.currentStageId) || null;
      setCurrentStage(stage);
    }
  }, [constructorState.currentStageId, constructorState.stages, isStageModalOpen]);

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
  const handleStartProject = async () => {
    if (!instruction.trim() || isInitializing) return;

    setIsInitializing(true);
    updateProcessDescription('planning');

    // Iniciar el proyecto en el servicio de seguimiento
    await seguimientoService.iniciarProyecto(
      "Proyecto CODESTORM",
      instruction.trim()
    );

    // Añadir mensaje al chat
    addChatMessage({
      id: `msg-template-${Date.now()}`,
      sender: 'assistant',
      content: 'He registrado tu solicitud. Ahora estamos configurando tu proyecto basado en tus instrucciones.',
      timestamp: Date.now(),
      type: 'notification'
    });

    // Añadir mensaje con las instrucciones del usuario
    addChatMessage({
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      content: instruction.trim(),
      timestamp: Date.now(),
      type: 'text'
    });

    setIsInitializing(false);

    // Continuar con la selección de plantilla
    handleTemplateSelection(null);
  };

  // Función para manejar la selección de una plantilla
  const handleTemplateSelection = async (template: any) => {
    setIsInitializing(true);
    updateProcessDescription('planning');

    // Si se seleccionó una plantilla específica
    if (template) {
      setSelectedTemplate(template);
      setShowTemplateSelector(false);

      // Añadir mensaje al chat sobre la plantilla seleccionada
      addChatMessage({
        id: `msg-template-selected-${Date.now()}`,
        sender: 'user',
        content: `He seleccionado la plantilla: ${template.name}`,
        timestamp: Date.now(),
        type: 'text'
      });
    } else {
      // Si no hay plantilla seleccionada, mostrar el selector
      setShowTemplateSelector(true);

      // Añadir mensaje al chat sobre la selección de plantilla
      addChatMessage({
        id: `msg-template-prompt-${Date.now()}`,
        sender: 'assistant',
        content: 'Para comenzar, selecciona una plantilla para tu proyecto. Esto nos ayudará a estructurar mejor el desarrollo.',
        timestamp: Date.now(),
        type: 'notification'
      });

      setIsInitializing(false);
      return;
    }

    // Simulación de inicio de proyecto con la plantilla seleccionada
    setTimeout(async () => {
      // Crear una etapa de planificación basada en la plantilla
      const plannerStage: ApprovalStage = {
        id: `stage-planner-${Date.now()}`,
        type: 'planner',
        title: 'Plan del Proyecto',
        description: `Revisión y aprobación del plan para ${template.name}`,
        status: 'pending',
        proposal: JSON.stringify({
          projectStructure: {
            name: template.name,
            description: template.description,
            files: template.structure.files.map((file: any) => ({
              path: file.path,
              description: file.description
            }))
          },
          implementationSteps: [
            {
              id: "paso-1",
              title: "Crear estructura básica",
              description: `Crear los archivos principales para ${template.name}`,
              filesToCreate: template.structure.files.map((file: any) => file.path)
            }
          ],
          dependencies: template.dependencies,
          configuration: template.configuration
        }, null, 2),
        timestamp: Date.now(),
        changes: template.structure.files.map((file: any) => ({
          id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: `Crear ${file.path}`,
          description: file.description,
          type: 'create',
          path: file.path,
          language: file.path.split('.').pop() || '',
          content: ''
        }))
      };

      // Actualizar el estado del constructor
      setConstructorState(prev => ({
        ...prev,
        stages: [plannerStage],
        currentStageId: plannerStage.id,
        phase: 'development',
        lastModified: Date.now()
      }));

      // Documentar la etapa con el agente de seguimiento
      const seguimientoMessage = await seguimientoService.documentarEtapa(plannerStage);

      // Añadir mensaje al chat
      addChatMessage({
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        content: `He creado un plan para tu proyecto basado en la plantilla "${template.name}". Por favor, revísalo y apruébalo para continuar.`,
        timestamp: Date.now(),
        type: 'notification',
        metadata: {
          requiresAction: true,
          stageId: plannerStage.id
        }
      });

      // Añadir mensaje del agente de seguimiento si existe
      if (seguimientoMessage) {
        addChatMessage(seguimientoMessage);
      }

      // Mostrar el roadmap y el tracker de progreso
      setShowRoadmap(true);
      setShowProgressTracker(true);

      // Actualizar la descripción del proceso
      updateProcessDescription('development', 'planner');

      setIsInitializing(false);
    }, 2000);
  };

  // Función para manejar la aprobación de una etapa
  const handleStageApproval = async (stageId: string, feedback?: string) => {
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

    // Registrar evento de aprobación en el agente de seguimiento
    const approvalEvent = await seguimientoService.registrarEvento(
      'stage-complete',
      `Etapa aprobada: ${currentStage.title}`,
      feedback ? `La etapa "${currentStage.title}" ha sido aprobada con el siguiente feedback: ${feedback}`
               : `La etapa "${currentStage.title}" ha sido aprobada sin feedback adicional.`,
      currentStage.id
    );

    // Añadir mensaje al chat
    addChatMessage({
      id: `msg-approved-${Date.now()}`,
      sender: 'system',
      content: 'Etapa aprobada. Continuando con el proceso...',
      timestamp: Date.now(),
      type: 'notification'
    });

    // Añadir mensaje del agente de seguimiento si existe
    if (approvalEvent) {
      addChatMessage(approvalEvent);
    }

    // Generar la siguiente etapa después de un breve retraso
    setTimeout(() => {
      generateNextStage(currentStage);
    }, 1000);
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

  // Función para generar la siguiente etapa basada en la etapa actual
  const generateNextStage = async (currentStage: ApprovalStage) => {
    // Validar que la etapa actual esté aprobada antes de continuar
    if (currentStage.status !== 'approved') {
      setErrorMessage('Debes aprobar la etapa actual antes de continuar. Por favor, revisa y aprueba la implementación actual.');
      setShowError(true);
      return;
    }
    // Determinar qué tipo de etapa generar a continuación
    type AgentType = 'planner' | 'codeGenerator' | 'fileSynchronizer' | 'codeModifier' | 'fileObserver' | 'lector';
    let nextStageType: AgentType = 'codeGenerator';
    let nextStageTitle = '';
    let nextStageDescription = '';
    let nextStageProposal = '';

    // Lógica para determinar la siguiente etapa basada en la etapa actual
    switch (currentStage.type) {
      case 'planner':
        nextStageType = 'codeGenerator';
        nextStageTitle = 'Generación de Código Base';
        nextStageDescription = 'Revisión y aprobación del código base generado';

        // Crear una propuesta de código basada en el plan aprobado
        try {
          const planData = JSON.parse(currentStage.proposal);
          const files = planData.projectStructure?.files || [];

          // Generar código HTML básico para demostración
          if (files.some(f => f.path.includes('.html'))) {
            nextStageProposal = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proyecto CODESTORM</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>Mi Proyecto CODESTORM</h1>
    <nav>
      <ul>
        <li><a href="#">Inicio</a></li>
        <li><a href="#">Acerca de</a></li>
        <li><a href="#">Contacto</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <section>
      <h2>Bienvenido a mi proyecto</h2>
      <p>Este es un proyecto generado con CODESTORM.</p>
    </section>
  </main>

  <footer>
    <p>&copy; 2025 CODESTORM - Todos los derechos reservados</p>
  </footer>

  <script src="script.js"></script>
</body>
</html>`;
          } else {
            nextStageProposal = `// Código base generado para el proyecto
console.log("Proyecto CODESTORM iniciado");

function iniciarAplicacion() {
  console.log("Aplicación iniciada correctamente");
  return true;
}

// Exportar funciones principales
export {
  iniciarAplicacion
};`;
          }
        } catch (error) {
          console.error('Error al parsear la propuesta del plan:', error);
          nextStageProposal = `// Código base generado para el proyecto
console.log("Proyecto CODESTORM iniciado");`;
        }
        break;

      case 'codeGenerator':
        nextStageType = 'fileSynchronizer';
        nextStageTitle = 'Sincronización de Archivos';
        nextStageDescription = 'Revisión y aprobación de la estructura de archivos sincronizada';
        nextStageProposal = JSON.stringify({
          syncedFiles: [
            {
              path: "/index.html",
              status: "created",
              size: "1.2kb"
            },
            {
              path: "/styles.css",
              status: "created",
              size: "0.5kb"
            },
            {
              path: "/script.js",
              status: "created",
              size: "0.8kb"
            }
          ],
          summary: "Se han sincronizado 3 archivos correctamente."
        }, null, 2);
        break;

      case 'fileSynchronizer':
        nextStageType = 'codeModifier';
        nextStageTitle = 'Modificación de Código';
        nextStageDescription = 'Revisión y aprobación de las modificaciones al código';
        nextStageProposal = `// Código modificado con mejoras
import { useState, useEffect } from 'react';

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Cargar datos iniciales
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  return (
    <div className="app">
      <h1>Aplicación Mejorada</h1>
      <div className="data-container">
        {data.map(item => (
          <div key={item.id} className="data-item">
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;`;
        break;

      case 'codeModifier':
        nextStageType = 'fileObserver';
        nextStageTitle = 'Observación de Archivos';
        nextStageDescription = 'Revisión y aprobación del análisis de archivos';
        nextStageProposal = JSON.stringify({
          observations: [
            {
              fileId: "file-1",
              path: "/index.html",
              issues: [
                {
                  type: "accessibility",
                  description: "Falta atributo alt en imágenes",
                  severity: "medium"
                }
              ]
            },
            {
              fileId: "file-2",
              path: "/styles.css",
              issues: []
            },
            {
              fileId: "file-3",
              path: "/script.js",
              issues: [
                {
                  type: "performance",
                  description: "Posible fuga de memoria en event listeners",
                  severity: "high"
                }
              ]
            }
          ],
          summary: "Se encontraron 2 problemas en 2 archivos."
        }, null, 2);
        break;

      default:
        // Si no sabemos qué etapa sigue, volvemos a la planificación
        nextStageType = 'planner';
        nextStageTitle = 'Revisión del Plan';
        nextStageDescription = 'Revisión y aprobación del plan actualizado';
        nextStageProposal = JSON.stringify({
          projectStructure: {
            name: "Proyecto Actualizado",
            description: "Versión actualizada del proyecto",
            files: [
              {
                path: "/index.html",
                description: "Página principal actualizada"
              },
              {
                path: "/styles.css",
                description: "Estilos actualizados"
              },
              {
                path: "/script.js",
                description: "Lógica actualizada"
              }
            ]
          }
        }, null, 2);
    }

    // Crear la nueva etapa
    const newStage: ApprovalStage = {
      id: `stage-${nextStageType}-${Date.now()}`,
      type: nextStageType,
      title: nextStageTitle,
      description: nextStageDescription,
      status: 'pending',
      proposal: nextStageProposal,
      timestamp: Date.now()
    };

    // Actualizar el estado del constructor con la nueva etapa
    setConstructorState(prev => ({
      ...prev,
      stages: [...prev.stages, newStage],
      currentStageId: newStage.id,
      isPaused: false,
      lastModified: Date.now()
    }));

    // Documentar la nueva etapa con el agente de seguimiento
    const seguimientoMessage = await seguimientoService.documentarEtapa(newStage);

    // Añadir mensaje al chat sobre la nueva etapa
    addChatMessage({
      id: `msg-new-stage-${Date.now()}`,
      sender: 'assistant',
      content: `He creado la siguiente etapa: ${nextStageTitle}. Por favor, revísala y apruébala para continuar.`,
      timestamp: Date.now(),
      type: 'notification',
      metadata: {
        requiresAction: true,
        stageId: newStage.id
      }
    });

    // Añadir mensaje del agente de seguimiento si existe
    if (seguimientoMessage) {
      addChatMessage(seguimientoMessage);
    }

    // Transferir información entre etapas
    if (currentStage) {
      const transferMessage = await seguimientoService.transferirInformacion(
        currentStage.id,
        newStage.id
      );

      if (transferMessage) {
        addChatMessage(transferMessage);
      }
    }

    // Actualizar la descripción del proceso
    updateProcessDescription('development', nextStageType);
  };

  // Función para añadir un mensaje al chat
  const addChatMessage = (message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  };

  // Función para enviar un mensaje desde el chat
  const handleSendMessage = async (content: string) => {
    // Añadir el mensaje del usuario al chat
    addChatMessage({
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      content,
      timestamp: Date.now(),
      type: 'text'
    });

    // Procesar el mensaje con el agente de seguimiento
    const seguimientoResponse = await seguimientoService.procesarMensajeUsuario(
      content,
      constructorState.currentStageId || undefined
    );

    // Si hay una respuesta del agente de seguimiento, añadirla al chat
    if (seguimientoResponse) {
      addChatMessage(seguimientoResponse);
    } else {
      // Si no hay respuesta del agente de seguimiento, simular respuesta del asistente
      setTimeout(() => {
        addChatMessage({
          id: `msg-assistant-${Date.now()}`,
          sender: 'assistant',
          content: `He recibido tu mensaje: "${content}". Estoy trabajando en ello...`,
          timestamp: Date.now(),
          type: 'text'
        });
      }, 1000);
    }
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

    // Si activamos el separador, ocultamos el observador de archivos y el seguimiento
    if (!showCodeSplitter && (showFileObserver || showSeguimiento)) {
      setShowFileObserver(false);
      setShowSeguimiento(false);
    }
  };

  // Función para alternar el panel de seguimiento
  const handleToggleSeguimiento = () => {
    setShowSeguimiento(prev => !prev);

    // Si activamos el seguimiento, ocultamos el observador de archivos y el separador de código
    if (!showSeguimiento && (showFileObserver || showCodeSplitter || showDirectoryExplorer)) {
      setShowFileObserver(false);
      setShowCodeSplitter(false);
      setShowDirectoryExplorer(false);
    }
  };

  // Función para alternar el explorador de directorios
  const handleToggleDirectoryExplorer = () => {
    setShowDirectoryExplorer(prev => !prev);

    // Si activamos el explorador de directorios, ocultamos el observador de archivos, el separador de código y el seguimiento
    if (!showDirectoryExplorer && (showFileObserver || showCodeSplitter || showSeguimiento)) {
      setShowFileObserver(false);
      setShowCodeSplitter(false);
      setShowSeguimiento(false);
    }
  };

  // Función para manejar el clic en un evento del historial
  const handleEventClick = (event: HistoryEvent) => {
    setSelectedEvent(event);

    // Si el evento está relacionado con un archivo, podríamos mostrar ese archivo
    if (event.relatedFiles && event.relatedFiles.length > 0) {
      // Aquí podríamos implementar la lógica para mostrar el archivo
      console.log('Archivo relacionado:', event.relatedFiles[0]);
    }
  };

  // Función para abrir la modal de etapa
  const openStageModal = () => {
    // Obtener la etapa actual
    const stage = constructorState.stages.find(s => s.id === constructorState.currentStageId) || null;
    setCurrentStage(stage);
    setIsStageModalOpen(true);
  };

  // Función para cerrar la modal de etapa
  const closeStageModal = () => {
    setIsStageModalOpen(false);
  };

  // Función para validar si se puede avanzar a la siguiente etapa
  const canAdvanceToNextStage = (): boolean => {
    const currentStage = constructorState.stages.find(s => s.id === constructorState.currentStageId);
    if (!currentStage) return false;

    // Solo se puede avanzar si la etapa actual está aprobada
    return currentStage.status === 'approved';
  };

  // Funciones para el Agente Lector

  // Función para abrir el panel del Agente Lector
  const openLectorPanel = (file: FileItem) => {
    setSelectedFile(file);

    // Buscar si ya existe un análisis para este archivo
    const existingAnalysis = lectorState.analyzedFiles.find(analysis => analysis.fileId === file.id);
    if (existingAnalysis) {
      setCurrentFileAnalysis(existingAnalysis);
    } else {
      setCurrentFileAnalysis(null);
      // Analizar el archivo
      analyzeLectorFile(file);
    }

    // Buscar si hay cambios pendientes para este archivo
    const existingChanges = lectorState.pendingChanges.find(change => change.originalFile.id === file.id);
    if (existingChanges) {
      setCurrentChangeAnalysis(existingChanges);
    } else {
      setCurrentChangeAnalysis(null);
    }

    setShowLector(true);
  };

  // Función para cerrar el panel del Agente Lector
  const closeLectorPanel = () => {
    setShowLector(false);
  };

  // Función para analizar un archivo con el Agente Lector
  const analyzeLectorFile = async (file: FileItem) => {
    try {
      const lectorService = LectorService.getInstance();
      const analysis = await lectorService.analyzeFile(file);

      if (analysis) {
        setCurrentFileAnalysis(analysis);

        // Actualizar el estado del lector
        setLectorState(lectorService.getState());

        // Si el archivo es el seleccionado actualmente, actualizar el análisis actual
        if (selectedFile && selectedFile.id === file.id) {
          setCurrentFileAnalysis(analysis);
        }
      }
    } catch (error) {
      console.error('Error al analizar archivo con el Agente Lector:', error);
    }
  };

  // Función para analizar cambios propuestos con el Agente Lector
  const analyzeLectorChanges = async (file: FileItem, proposedChanges: string) => {
    try {
      const lectorService = LectorService.getInstance();
      const analysis = await lectorService.analyzeChanges(file, proposedChanges);

      if (analysis) {
        // Actualizar el estado del lector
        setLectorState(lectorService.getState());

        // Si el archivo es el seleccionado actualmente, actualizar el análisis de cambios actual
        if (selectedFile && selectedFile.id === file.id) {
          setCurrentChangeAnalysis(analysis);
        }

        return analysis;
      }
    } catch (error) {
      console.error('Error al analizar cambios con el Agente Lector:', error);
    }

    return null;
  };

  // Función para aprobar cambios analizados por el Agente Lector
  const approveLectorChanges = () => {
    if (!currentChangeAnalysis) return;

    // Aquí se implementaría la lógica para aplicar los cambios aprobados
    // Por ejemplo, actualizar el archivo en el estado del constructor

    // Cerrar el panel
    closeLectorPanel();

    // Mostrar mensaje de éxito
    setErrorMessage('Cambios aprobados y aplicados correctamente.');
    setShowError(true);
  };

  // Función para rechazar cambios analizados por el Agente Lector
  const rejectLectorChanges = () => {
    if (!currentChangeAnalysis) return;

    // Aquí se implementaría la lógica para rechazar los cambios

    // Cerrar el panel
    closeLectorPanel();

    // Mostrar mensaje
    setErrorMessage('Cambios rechazados. No se han aplicado modificaciones.');
    setShowError(true);
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
      >
        {constructorState.stages.length > 0 && (
          <button
            onClick={openStageModal}
            className="ml-4 px-3 py-1.5 bg-codestorm-accent hover:bg-blue-600 text-white rounded-md text-sm flex items-center transition-colors"
          >
            <Layers className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Ver Etapa Actual</span>
            <span className="sm:hidden">Etapa</span>
          </button>
        )}
      </Header>

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
            <div className="space-y-6">
              {/* Instrucciones iniciales */}
              <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex space-x-4'} ${
                showTemplateSelector ? 'animate-pulse-subtle' : ''
              }`}>
                <input
                  type="text"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="Describe el proyecto que quieres crear..."
                  className={`flex-1 bg-codestorm-darker border border-codestorm-blue/30 rounded-md p-3 text-white ${
                    showTemplateSelector ? 'border-codestorm-accent/50 shadow-glow-blue' : ''
                  }`}
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

              {/* Selector de plantillas */}
              {showTemplateSelector && (
                <div className={`mt-4 animate-pulse-subtle shadow-glow-blue rounded-lg overflow-hidden`}>
                  <ProjectTemplateSelector onSelectTemplate={handleTemplateSelection} />
                </div>
              )}
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

                {/* Roadmap del proyecto */}
                {showRoadmap && (
                  <CollapsiblePanel
                    title="Roadmap del Proyecto"
                    type="sidebar"
                    isVisible={true}
                    showCollapseButton={false}
                  >
                    <ProjectRoadmap
                      stages={constructorState.stages}
                      currentStageId={constructorState.currentStageId || ''}
                      onSelectStage={(stageId) => {
                        setConstructorState(prev => ({
                          ...prev,
                          currentStageId: stageId
                        }));
                        openStageModal();
                      }}
                      onGenerateNextStage={() => {
                        const currentStage = constructorState.stages.find(s => s.id === constructorState.currentStageId);
                        if (currentStage && canAdvanceToNextStage()) {
                          generateNextStage(currentStage);
                        }
                      }}
                      canAdvanceToNextStage={canAdvanceToNextStage()}
                    />
                  </CollapsiblePanel>
                )}

                {/* Métricas de progreso */}
                {showProgressTracker && (
                  <CollapsiblePanel
                    title="Métricas de Progreso"
                    type="sidebar"
                    isVisible={true}
                    showCollapseButton={false}
                  >
                    <StageProgressTracker
                      stages={constructorState.stages}
                      files={constructorState.files}
                      currentStageId={constructorState.currentStageId || ''}
                      onViewStage={(stageId) => {
                        setConstructorState(prev => ({
                          ...prev,
                          currentStageId: stageId
                        }));
                        openStageModal();
                      }}
                      onNextStage={() => {
                        const currentStage = constructorState.stages.find(s => s.id === constructorState.currentStageId);
                        if (currentStage && canAdvanceToNextStage()) {
                          generateNextStage(currentStage);
                        }
                      }}
                      canAdvanceToNextStage={canAdvanceToNextStage()}
                    />
                  </CollapsiblePanel>
                )}

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
                      fileAnalyses={lectorState.analyzedFiles}
                      onAnalyzeFile={(file) => {
                        setSelectedFile(file);
                        analyzeLectorFile(file);
                      }}
                      onViewFileDetails={(file) => {
                        setSelectedFile(file);
                        openLectorPanel(file);
                      }}
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

                <CollapsiblePanel
                  title="Explorador de Directorios"
                  type="explorer"
                  isVisible={showDirectoryExplorer}
                  onToggleVisibility={handleToggleDirectoryExplorer}
                  showCollapseButton={true}
                >
                  <div className={`${isMobile ? 'h-[300px]' : 'h-[400px]'}`}>
                    <DirectoryExplorer
                      files={constructorState.files}
                      onSelectFile={(file) => {
                        setSelectedFile(file);
                        openLectorPanel(file);
                      }}
                      onAnalyzeFile={(file) => {
                        setSelectedFile(file);
                        analyzeLectorFile(file);
                      }}
                      fileAnalyses={lectorState.analyzedFiles}
                      selectedFilePath={selectedFile?.path}
                    />
                  </div>
                </CollapsiblePanel>

                <CollapsiblePanel
                  title="Agente de Seguimiento"
                  type="explorer"
                  isVisible={showSeguimiento}
                  onToggleVisibility={handleToggleSeguimiento}
                  showCollapseButton={true}
                >
                  <div className={`${isMobile ? 'h-[300px]' : 'h-[400px]'}`}>
                    {constructorState.seguimiento && (
                      <SeguimientoPanel
                        seguimientoState={constructorState.seguimiento}
                        onEventClick={handleEventClick}
                        onRefresh={() => {
                          // Actualizar el estado del seguimiento
                          setConstructorState(prev => ({
                            ...prev,
                            lastModified: Date.now()
                          }));
                        }}
                      />
                    )}
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
                <div className="bg-codestorm-dark rounded-lg shadow-md p-6 border border-codestorm-blue/30">
                  <div className="flex flex-col items-center justify-center text-gray-400 py-8">
                    <Layers className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-center text-lg">
                      La etapa actual está disponible en una ventana modal
                    </p>
                    <p className="text-center text-sm mt-2">
                      Haz clic en el botón "Ver Etapa Actual" en la barra de navegación o en el botón flotante para abrirla
                    </p>
                    <div className="flex flex-col items-center mt-4 space-y-3">
                      <button
                        onClick={openStageModal}
                        className="px-4 py-2 bg-codestorm-accent hover:bg-blue-600 text-white rounded-md text-sm flex items-center justify-center transition-colors"
                      >
                        <Layers className="h-4 w-4 mr-2" />
                        <span>Abrir Etapa Actual</span>
                      </button>

                      {/* Botón para avanzar a la siguiente etapa con validación */}
                      {constructorState.stages.length > 0 && (
                        <button
                          onClick={() => {
                            if (canAdvanceToNextStage()) {
                              // Obtener la etapa actual
                              const currentStage = constructorState.stages.find(s => s.id === constructorState.currentStageId);
                              if (currentStage) {
                                generateNextStage(currentStage);
                              }
                            } else {
                              setErrorMessage('Debes aprobar la etapa actual antes de continuar. Por favor, revisa y aprueba la implementación actual.');
                              setShowError(true);
                            }
                          }}
                          className={`px-4 py-2 rounded-md text-sm flex items-center justify-center transition-colors ${
                            canAdvanceToNextStage()
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          }`}
                          disabled={!canAdvanceToNextStage()}
                        >
                          <span>Avanzar a la Siguiente Etapa</span>
                          {!canAdvanceToNextStage() && (
                            <AlertTriangle className="h-4 w-4 ml-2 text-yellow-500" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
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
                    onEditMessage={(id, content) => {
                      // Implementar edición de mensajes si es necesario
                      console.log('Editar mensaje:', id, content);
                    }}
                    onDeleteMessage={(id) => {
                      // Implementar eliminación de mensajes si es necesario
                      console.log('Eliminar mensaje:', id);
                    }}
                    isProcessing={isInitializing}
                    currentStage={constructorState.stages.find(s => s.id === constructorState.currentStageId) || null}
                    onApproveStage={handleStageApproval}
                    onModifyStage={handleStageModification}
                    onRejectStage={handleStageRejection}
                    isPaused={constructorState.isPaused}
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

          <button
            onClick={handleToggleSeguimiento}
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all ${
              showSeguimiento ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
            aria-label="Mostrar/ocultar agente de seguimiento"
          >
            <Clock className="h-5 w-5" />
          </button>

          <DirectoryExplorerButton
            onClick={handleToggleDirectoryExplorer}
            isActive={showDirectoryExplorer}
            filesCount={constructorState.files.length}
            hasNewFiles={constructorState.files.some(file => Date.now() - (file.timestamp || 0) < 60000)}
          />

          <button
            onClick={() => {
              setShowRoadmap(!showRoadmap);
              setShowProgressTracker(!showProgressTracker);
            }}
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all ${
              showRoadmap ? 'bg-codestorm-accent text-white' : 'bg-gray-700 text-gray-300'
            }`}
            aria-label="Mostrar/ocultar roadmap y métricas"
          >
            <BarChart2 className="h-5 w-5" />
          </button>

          <button
            onClick={openStageModal}
            className="w-12 h-12 rounded-full shadow-lg bg-codestorm-accent text-white flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all"
            aria-label="Ver etapa actual"
          >
            <Layers className="h-5 w-5" />
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

      {/* Modal de etapa actual */}
      <StageApprovalModal
        stage={currentStage}
        onApprove={handleStageApproval}
        onModify={handleStageModification}
        onReject={handleStageRejection}
        onNextStage={() => {
          // Obtener la etapa actual
          const stage = constructorState.stages.find(s => s.id === constructorState.currentStageId);
          if (stage && canAdvanceToNextStage()) {
            generateNextStage(stage);
            closeStageModal();
          }
        }}
        canAdvanceToNextStage={canAdvanceToNextStage()}
        isPaused={constructorState.isPaused}
        isOpen={isStageModalOpen}
        onClose={closeStageModal}
        originalFiles={constructorState.files} // Pasar los archivos originales para comparar cambios
        onApproveChange={(stageId, changeId) => {
          // Implementar la lógica para aprobar un cambio específico
          if (currentStage && currentStage.changes) {
            const updatedChanges = currentStage.changes.map(change =>
              change.id === changeId
                ? { ...change, isApproved: true, isRejected: false }
                : change
            );

            // Actualizar el estado del constructor
            setConstructorState(prev => ({
              ...prev,
              stages: prev.stages.map(stage =>
                stage.id === stageId
                  ? { ...stage, changes: updatedChanges }
                  : stage
              )
            }));

            // Actualizar la etapa actual en el estado local
            setCurrentStage(prev =>
              prev && prev.id === stageId
                ? { ...prev, changes: updatedChanges }
                : prev
            );
          }
        }}
        onRejectChange={(stageId, changeId) => {
          // Implementar la lógica para rechazar un cambio específico
          if (currentStage && currentStage.changes) {
            const updatedChanges = currentStage.changes.map(change =>
              change.id === changeId
                ? { ...change, isRejected: true, isApproved: false }
                : change
            );

            // Actualizar el estado del constructor
            setConstructorState(prev => ({
              ...prev,
              stages: prev.stages.map(stage =>
                stage.id === stageId
                  ? { ...stage, changes: updatedChanges }
                  : stage
              )
            }));

            // Actualizar la etapa actual en el estado local
            setCurrentStage(prev =>
              prev && prev.id === stageId
                ? { ...prev, changes: updatedChanges }
                : prev
            );
          }
        }}
      />

      {/* Notificación de error */}
      {showError && errorMessage && (
        <ErrorNotification
          message={errorMessage}
          type="error"
          onClose={() => {
            setShowError(false);
            setErrorMessage(null);
          }}
        />
      )}

      {/* Panel del Agente Lector */}
      {selectedFile && (
        <LectorPanel
          file={selectedFile}
          fileAnalysis={currentFileAnalysis}
          changeAnalysis={currentChangeAnalysis}
          onApproveChanges={approveLectorChanges}
          onRejectChanges={rejectLectorChanges}
          isVisible={showLector}
          onClose={closeLectorPanel}
        />
      )}

      {/* Botón flotante del Agente Lector */}
      <LectorButton
        onClick={() => {
          // Si hay un archivo seleccionado, abrir el panel
          if (selectedFile) {
            setShowLector(true);
          } else {
            // Mostrar mensaje de error
            setErrorMessage('Selecciona un archivo para analizar con el Agente Lector.');
            setShowError(true);
          }
        }}
        hasWarnings={lectorState.pendingChanges.length > 0}
        isActive={showLector}
        position="bottom-left"
      />

      {/* Pie de página */}
      <Footer showLogo={true} />
    </div>
  );
};

export default Constructor;
