import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CollapsiblePanel from '../components/CollapsiblePanel';
import BrandLogo from '../components/BrandLogo';
import Footer from '../components/Footer';
import CodeModifierPanel from '../components/codemodifier/CodeModifierPanel';
import LoadingOverlay from '../components/LoadingOverlay';
import HelpAssistant from '../components/HelpAssistant';
import FloatingActionButtons from '../components/FloatingActionButtons';
import {
  Loader,
  AlertTriangle,
  FileText,
  Folder,
  Sparkles,
  Layers,
  CheckCircle,
  XCircle,
  Terminal,
  Code,
  Eye,
  RefreshCw,
  Monitor,
  Split,
  Archive
} from 'lucide-react';
import {
  FileItem,
  ChatMessage,
  ApprovalData,
  ProgressData
} from '../types';
<<<<<<< HEAD
import { TechnologyStack } from '../types/technologyStacks';
import { AIIterativeOrchestrator } from '../services/AIIterativeOrchestrator';
import { generateUniqueId } from '../utils/idGenerator';
import { useUI } from '../contexts/UIContext';
import ApprovalMonitoringService from '../services/ApprovalMonitoringService';
=======
import { generateUniqueId } from '../utils/idGenerator';
import { useUI } from '../contexts/UIContext';
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c

import InteractiveChat from '../components/constructor/InteractiveChat';
import DirectoryExplorer from '../components/constructor/DirectoryExplorer';
import ErrorNotification from '../components/constructor/ErrorNotification';
import ProjectTemplateSelector from '../components/constructor/ProjectTemplateSelector';
<<<<<<< HEAD
import TechnologyStackCarousel from '../components/constructor/TechnologyStackCarousel';
import StackDetailModal from '../components/constructor/StackDetailModal';
import WorkflowSelector from '../components/constructor/WorkflowSelector';
import StackChangeButton from '../components/constructor/StackChangeButton';
import StackRecommendation from '../components/constructor/StackRecommendation';
import { StackRecommendationService, StackRecommendation as StackRecommendationType } from '../services/StackRecommendationService';
import ApprovalInterface from '../components/constructor/ApprovalInterface';
import ProgressIndicator from '../components/constructor/ProgressIndicator';
import ApprovalDebugPanel from '../components/constructor/ApprovalDebugPanel';
import RobustApprovalSystem from '../components/constructor/RobustApprovalSystem';
import ManualApprovalCommand from '../components/constructor/ManualApprovalCommand';
=======
import ApprovalInterface from '../components/constructor/ApprovalInterface';
import ProgressIndicator from '../components/constructor/ProgressIndicator';
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c

// Nuevos componentes para el Constructor mejorado
import CodeEditor from '../components/constructor/CodeEditor';
import TerminalOutput from '../components/constructor/TerminalOutput';
import EnhancedPreviewPanel from '../components/constructor/EnhancedPreviewPanel';
import RepositoryImporter from '../components/constructor/RepositoryImporter';
import { ImportedRepository } from '../services/RepositoryImportService';

// --- AGENT AND SERVICE IMPORTS (USER TO VERIFY PATHS AND EXPORTS) ---
import { PromptEnhancerService, PromptEnhancerResult, EnhancedPrompt } from '../services/PromptEnhancerService';
import { PlannerAgent } from '../agents/PlannerAgent';
import { CodeGeneratorAgent } from '../agents/CodeGeneratorAgent';
import { CodeModifierAgent } from '../agents/CodeModifierAgent';
<<<<<<< HEAD
=======
import { AIIterativeOrchestrator } from '../services/AIIterativeOrchestrator';
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c

// --- DATA STRUCTURES ---
export interface TemplateData {
  id: string;
  name: string;
  description: string;
}

export interface PlanFile {
  path: string;
  reason: string;
  action: 'create' | 'update' | 'delete';
}

export interface Plan {
  description: string;
  files: PlanFile[];
}

interface AIConstructorState {
  currentAIAction: string | null;
  projectFiles: FileItem[];
  isAIBusy: boolean;
  sessionId: string;
  showTemplateSelector: boolean;
  selectedTemplate: TemplateData | null;
  terminalOutput: string[];
  previewUrl: string | null;
  activeTab: 'files' | 'editor' | 'terminal' | 'preview';
  editorContent: string;
  currentFilePath: string | null;
  currentAgent: string | null;
  loadingProgress: number;
  showLoadingOverlay: boolean;
  showRepositoryImporter: boolean;
  importedRepository: ImportedRepository | null;
}

// --- SERVICE AND AGENT INSTANTIATION ---
const promptEnhancerInstance = new PromptEnhancerService();
const plannerAgentInstance = new PlannerAgent();
const codeGeneratorAgentInstance = new CodeGeneratorAgent();
const codeModifierAgentInstance = new CodeModifierAgent();
const aiIterativeOrchestrator = AIIterativeOrchestrator.getInstance();
<<<<<<< HEAD
const approvalMonitoring = ApprovalMonitoringService.getInstance();
=======
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c

// Efectos para suscribirse a los cambios en el estado del orquestrador iterativo
const setupAIOrchestrator = (setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>, setAIState: React.Dispatch<React.SetStateAction<AIConstructorState>>, currentMessages: ChatMessage[]) => {
  // Suscribirse a los mensajes de chat
  const handleChatMessagesUpdate = (messages: ChatMessage[]) => {
    // Filtrar mensajes duplicados
    const newMessages = messages.filter(
      newMsg => !currentMessages.some(existingMsg => existingMsg.id === newMsg.id)
    );

    if (newMessages.length > 0) {
      setChatMessages(prev => [...prev, ...newMessages]);
    }
  };

  // Suscribirse a los archivos
  const handleFilesUpdate = (files: FileItem[]) => {
    setAIState(prev => ({
      ...prev,
      projectFiles: files
    }));
  };

  // Suscribirse al estado del flujo de trabajo
  const handleWorkflowStateUpdate = (state: any) => {
    setAIState(prev => ({
      ...prev,
      isAIBusy: state.isProcessing,
      currentAIAction: state.currentPhase === 'awaitingInput' ? null : state.currentPhase
    }));
  };

  // Añadir listeners
  aiIterativeOrchestrator.addChatListener(handleChatMessagesUpdate);
  aiIterativeOrchestrator.addFileListener(handleFilesUpdate);
  aiIterativeOrchestrator.addStateListener(handleWorkflowStateUpdate);

  // Devolver función de limpieza
  return () => {
    aiIterativeOrchestrator.removeChatListener(handleChatMessagesUpdate);
    aiIterativeOrchestrator.removeFileListener(handleFilesUpdate);
    aiIterativeOrchestrator.removeStateListener(handleWorkflowStateUpdate);
  };
};

const Constructor: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet, isCodeModifierVisible, toggleCodeModifier } = useUI();

  const [aiConstructorState, setAIConstructorState] = useState<AIConstructorState>({
    currentAIAction: 'awaitingInput',
    projectFiles: [],
    isAIBusy: false,
    sessionId: `session-${Date.now()}`,
    showTemplateSelector: false, // Inicialmente oculto
    selectedTemplate: null,
    terminalOutput: [],
    previewUrl: null,
    activeTab: 'files',
    editorContent: '',
    currentFilePath: null,
    currentAgent: null,
    loadingProgress: 0,
    showLoadingOverlay: false,
    showRepositoryImporter: false,
    importedRepository: null,
  });

<<<<<<< HEAD
  // Estados para el sistema de stacks de tecnología
  const [selectedStack, setSelectedStack] = useState<TechnologyStack | null>(null);
  const [showStackModal, setShowStackModal] = useState(false);
  const [showStackSelector, setShowStackSelector] = useState(false);

  // Estados para el flujo de selección flexible
  const [showWorkflowSelector, setShowWorkflowSelector] = useState(false);
  const [workflowChoice, setWorkflowChoice] = useState<'stack' | 'generic' | null>(null);
  const [hasUserChosenWorkflow, setHasUserChosenWorkflow] = useState(false);

  // Estados para el sistema de recomendación inteligente
  const [showStackRecommendation, setShowStackRecommendation] = useState(false);
  const [currentRecommendation, setCurrentRecommendation] = useState<StackRecommendationType | null>(null);
  const [recommendationService] = useState(() => StackRecommendationService.getInstance());

  // Efecto para limpiar el stack al desmontar el componente
  useEffect(() => {
    return () => {
      const orchestrator = AIIterativeOrchestrator.getInstance();
      orchestrator.clearSelectedStack();
    };
  }, []);

  const [pendingApproval, setPendingApproval] = useState<ApprovalData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);

  // Estados para el sistema robusto de aprobación
  const [useRobustApproval, setUseRobustApproval] = useState(false);
  const [approvalFailureCount, setApprovalFailureCount] = useState(0);
  const [lastApprovalError, setLastApprovalError] = useState<string | null>(null);
  const [showManualCommand, setShowManualCommand] = useState(false);

=======
  const [pendingApproval, setPendingApproval] = useState<ApprovalData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);

>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: generateUniqueId('welcome'), // Use helper for unique ID
      sender: 'ai-agent',
      content: 'Bienvenido al Constructor de CODESTORM. Describe tu proyecto o tarea a realizar. Después de tu primera instrucción, podrás seleccionar una plantilla para complementarla.',
      timestamp: Date.now(),
      type: 'notification',
    },
  ]);

  // Función para determinar el lenguaje basado en la extensión del archivo
  const getLanguageFromFilePath = (filePath: string | null): string => {
    if (!filePath) return 'javascript';

    const extension = filePath.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js': return 'javascript';
      case 'jsx': return 'javascript';
      case 'ts': return 'typescript';
      case 'tsx': return 'typescript';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'py': return 'python';
      default: return 'javascript';
    }
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [showDirectoryExplorer, setShowDirectoryExplorer] = useState<boolean>(true);
  const [selectedFileForViewing, setSelectedFileForViewing] = useState<FileItem | null>(null);
  const [showHelpAssistant, setShowHelpAssistant] = useState(false);

  // Efecto para suscribirse a los cambios en el estado del orquestrador iterativo
  useEffect(() => {
    // Suscribirse a los mensajes de chat
    const handleChatMessagesUpdate = (messages: ChatMessage[]) => {
      // Usar callback para evitar dependencia de chatMessages
      setChatMessages(prev => {
        // Filtrar mensajes duplicados usando el estado anterior
        const newMessages = messages.filter(
          newMsg => !prev.some(existingMsg => existingMsg.id === newMsg.id)
        );

        if (newMessages.length > 0) {
          return [...prev, ...newMessages];
        }
        return prev;
      });
    };

    // Suscribirse a los archivos
    const handleFilesUpdate = (files: FileItem[]) => {
      setAIConstructorState(prev => ({
        ...prev,
        projectFiles: files
      }));
    };

    // Suscribirse al estado del flujo de trabajo
    const handleWorkflowStateUpdate = (state: any) => {
      console.log('Estado del workflow actualizado:', state);

      // Mapear fases a mensajes descriptivos
      const getPhaseMessage = (phase: string, agentType: string | null) => {
        switch (phase) {
          case 'planning':
            return 'Analizando solicitud y creando plan de desarrollo...';
          case 'codeGeneration':
            return 'Generando código del proyecto...';
          case 'codeModification':
            return 'Modificando archivos existentes...';
          case 'fileObservation':
            return 'Analizando estructura de archivos...';
          case 'designArchitecture':
            return 'Diseñando arquitectura visual...';
          case 'awaitingInput':
            return null;
          default:
            return agentType ? `Ejecutando ${agentType}...` : 'Procesando...';
        }
      };

      // Mapear tipos de agente a nombres legibles
      const getAgentName = (agentType: string | null) => {
        switch (agentType) {
          case 'planner':
            return 'planner';
          case 'codeGenerator':
            return 'codegenerator';
          case 'codeModifier':
            return 'codemodifier';
          case 'fileObserver':
            return 'fileobserver';
          case 'designArchitect':
            return 'designarchitect';
          default:
            return agentType;
        }
      };

      const phaseMessage = getPhaseMessage(state.phase, state.agentType);
      const isProcessing = state.isProcessing || state.phase !== 'awaitingInput';

      setAIConstructorState(prev => ({
        ...prev,
        isAIBusy: isProcessing,
        currentAIAction: phaseMessage,
        showLoadingOverlay: isProcessing && !state.requiresApproval, // No mostrar overlay durante aprobaciones
        currentAgent: getAgentName(state.agentType),
        loadingProgress: state.progress?.percentage || (isProcessing ? 25 : 0)
      }));

      // Manejar solicitudes de aprobación
      if (state.requiresApproval && state.approvalData) {
        setPendingApproval(state.approvalData);
<<<<<<< HEAD
        // Iniciar monitoreo de la nueva solicitud
        approvalMonitoring.startMonitoring(state.approvalData);
=======
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c
      } else {
        setPendingApproval(null);
      }

      // Manejar actualizaciones de progreso
      if (state.progress) {
        setProgress(state.progress);
      }
    };

    // Suscribirse a las aprobaciones
    const handleApprovalUpdate = (approvalData: ApprovalData) => {
      setPendingApproval(approvalData);
    };

    // Suscribirse al progreso
    const handleProgressUpdate = (progressData: ProgressData) => {
      console.log('Progreso actualizado:', progressData);
      setProgress(progressData);

      // Actualizar también el progreso en el estado del constructor
      if (progressData) {
        setAIConstructorState(prev => ({
          ...prev,
          loadingProgress: progressData.percentage || progressData.progress || prev.loadingProgress
        }));
      }
    };

    // Listener para eventos de archivos creados por el orquestrador
    const handleFileCreated = (event: CustomEvent) => {
      const { file } = event.detail;
      console.log('Archivo recibido del orquestrador:', file);

      setAIConstructorState(prev => {
        // Verificar si el archivo ya existe
        const existingFileIndex = prev.projectFiles.findIndex(f => f.path === file.path);

        let updatedFiles;
        if (existingFileIndex >= 0) {
          // Actualizar archivo existente
          updatedFiles = [...prev.projectFiles];
          updatedFiles[existingFileIndex] = { ...updatedFiles[existingFileIndex], ...file };
        } else {
          // Añadir nuevo archivo
          updatedFiles = [...prev.projectFiles, file];
        }

        return {
          ...prev,
          projectFiles: updatedFiles,
          terminalOutput: [...prev.terminalOutput, `[SUCCESS] Archivo sincronizado: ${file.path}`]
        };
      });
    };

    // Añadir listeners
    aiIterativeOrchestrator.addChatListener(handleChatMessagesUpdate);
    aiIterativeOrchestrator.addFileListener(handleFilesUpdate);
    aiIterativeOrchestrator.addStateListener(handleWorkflowStateUpdate);
    aiIterativeOrchestrator.addApprovalListener(handleApprovalUpdate);
    aiIterativeOrchestrator.addProgressListener(handleProgressUpdate);

    // Registrar listener para eventos de archivos
    window.addEventListener('codestorm-file-created', handleFileCreated as EventListener);

    // Inicializar reconocimiento de voz global para Constructor
    console.log('Inicializando reconocimiento de voz en Constructor...');
    import('../utils/voiceInitializer').then(({ initializeVoiceRecognition }) => {
      initializeVoiceRecognition({
        onStormCommand: (command: string) => {
          console.log('Comando STORM recibido en Constructor:', command);
          // Aquí se puede integrar con el chat del Constructor
        },
        enableDebug: true,
        autoStart: true
      });
    });

    // Limpiar al desmontar
    return () => {
      aiIterativeOrchestrator.removeChatListener(handleChatMessagesUpdate);
      aiIterativeOrchestrator.removeFileListener(handleFilesUpdate);
      aiIterativeOrchestrator.removeStateListener(handleWorkflowStateUpdate);
      aiIterativeOrchestrator.removeApprovalListener(handleApprovalUpdate);
      aiIterativeOrchestrator.removeProgressListener(handleProgressUpdate);
      window.removeEventListener('codestorm-file-created', handleFileCreated as EventListener);

      // Limpiar reconocimiento de voz
      import('../utils/voiceInitializer').then(({ cleanupVoiceRecognition }) => {
        cleanupVoiceRecognition();
      });
    };
<<<<<<< HEAD
  }, []); // Empty dependency array is correct here - we only want to set up listeners once
=======
  }, []); // Eliminar dependencia de chatMessages para evitar re-renderizados infinitos
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c

  const addChatMessage = (message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  };

  const handleError = (error: any, stage: string) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error durante ${stage}:`, error);
    setErrorMessage(`Error en ${stage}: ${message}`);
    setShowError(true);
    addChatMessage({
      id: generateUniqueId('err'), // Use helper for unique ID
      sender: 'ai',
      content: `Error durante ${stage}: ${message}`,
      timestamp: Date.now(),
      type: 'error',
      senderType: 'ai',
    });
  };

  // Funciones para el importador de repositorios
  const handleOpenRepositoryImporter = () => {
    setAIConstructorState(prev => ({
      ...prev,
      showRepositoryImporter: true
    }));
  };

  const handleCloseRepositoryImporter = () => {
    setAIConstructorState(prev => ({
      ...prev,
      showRepositoryImporter: false
    }));
  };

  const handleRepositoryImported = (repository: ImportedRepository) => {
    // Integrar archivos del repositorio con los archivos del proyecto
    setAIConstructorState(prev => ({
      ...prev,
      projectFiles: [...prev.projectFiles, ...repository.files],
      importedRepository: repository,
      showRepositoryImporter: false,
      terminalOutput: [
        ...prev.terminalOutput,
        `[SUCCESS] Repositorio "${repository.name}" importado exitosamente`,
        `[INFO] ${repository.totalFiles} archivos cargados`,
        `[INFO] Tamaño total: ${(repository.totalSize / 1024).toFixed(2)} KB`
      ]
    }));

    // Añadir mensaje al chat
    addChatMessage({
      id: generateUniqueId('repo-imported'),
      sender: 'ai',
      content: `✅ Repositorio "${repository.name}" importado exitosamente. Se han cargado ${repository.totalFiles} archivos. Ahora puedes navegar por la estructura y modificar cualquier archivo usando comandos de voz o texto.`,
      timestamp: Date.now(),
      type: 'success',
      senderType: 'ai',
    });
  };

<<<<<<< HEAD
  // Función para manejar la selección de stack de tecnología
  const handleStackSelection = async (stack: TechnologyStack) => {
    setSelectedStack(stack);
    setShowStackSelector(false);

    // Marcar que el usuario ha elegido un flujo de trabajo
    setHasUserChosenWorkflow(true);
    setWorkflowChoice('stack');

    // Configurar el stack en el orquestrador de IA
    const orchestrator = AIIterativeOrchestrator.getInstance();
    orchestrator.setSelectedStack(stack);

    // Agregar mensaje al chat sobre la selección del stack
    addChatMessage({
      id: generateUniqueId('stack-selected'),
      sender: 'ai',
      content: `🚀 Excelente elección! Has seleccionado **${stack.name}** para tu proyecto.\n\n**Características principales:**\n• Dificultad: ${stack.difficultyLevel}\n• Popularidad: ${stack.popularity}\n• Ideal para: ${stack.recommendedFor.join(', ')}\n• Tecnologías: ${stack.technologies.map(t => t.name).join(', ')}\n\nComenzaré a generar tu proyecto optimizado para este stack.`,
      timestamp: Date.now(),
      type: 'notification',
      senderType: 'ai',
    });

    // Verificar si hay un prompt mejorado guardado desde el modal de mejora
    const enhancedPromptForStack = localStorage.getItem('enhancedPromptForStack');
    const originalInstruction = localStorage.getItem('originalInstruction');

    if (enhancedPromptForStack) {
      // Procesar el prompt mejorado con el stack seleccionado
      console.log('🔧 Constructor: Procesando prompt mejorado con stack seleccionado');

      // Limpiar el prompt mejorado del localStorage
      localStorage.removeItem('enhancedPromptForStack');

      // Configurar el estado para procesamiento
      setAIConstructorState(prev => ({
        ...prev,
        isAIBusy: true,
        currentAIAction: 'Generando plan con prompt mejorado y stack seleccionado...',
        currentAgent: 'planner',
        showLoadingOverlay: true,
        loadingProgress: 15
      }));

      // Procesar el prompt mejorado con el stack seleccionado
      try {
        await orchestrator.processUserInstruction(enhancedPromptForStack);
      } catch (error) {
        console.error('Error al procesar prompt mejorado con stack:', error);
        addChatMessage({
          id: generateUniqueId('enhanced-stack-error'),
          sender: 'ai',
          content: `❌ Error al procesar el prompt mejorado con el stack seleccionado: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          timestamp: Date.now(),
          type: 'error',
          senderType: 'ai',
        });

        setAIConstructorState(prev => ({
          ...prev,
          isAIBusy: false,
          currentAIAction: 'awaitingInput',
          showLoadingOverlay: false,
          loadingProgress: 0
        }));
      }
    } else if (originalInstruction) {
      // Procesar la instrucción original si existe
      // Limpiar la instrucción del localStorage
      localStorage.removeItem('originalInstruction');

      // Configurar el estado para procesamiento
      setAIConstructorState(prev => ({
        ...prev,
        isAIBusy: true,
        currentAIAction: 'Generando plan con stack seleccionado...',
        currentAgent: 'planner',
        showLoadingOverlay: true,
        loadingProgress: 15
      }));

      // Procesar la instrucción con el stack seleccionado
      try {
        await orchestrator.processUserInstruction(originalInstruction);
      } catch (error) {
        console.error('Error al procesar instrucción con stack:', error);
        addChatMessage({
          id: generateUniqueId('stack-error'),
          sender: 'ai',
          content: `❌ Error al procesar la instrucción con el stack seleccionado: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          timestamp: Date.now(),
          type: 'error',
          senderType: 'ai',
        });

        setAIConstructorState(prev => ({
          ...prev,
          isAIBusy: false,
          currentAIAction: 'awaitingInput',
          showLoadingOverlay: false,
          loadingProgress: 0
        }));
      }
    } else {
      // Configurar el estado para continuar con el desarrollo
      setAIConstructorState(prev => ({
        ...prev,
        isAIBusy: false,
        currentAIAction: 'awaitingInput'
      }));
    }
  };

  // Función para mostrar el modal de detalles del stack
  const handleShowStackDetails = (stack: TechnologyStack) => {
    setSelectedStack(stack);
    setShowStackModal(true);
  };

  // Función para seleccionar stack desde el modal
  const handleSelectStackFromModal = (stack: TechnologyStack) => {
    handleStackSelection(stack);
    setShowStackModal(false);
  };

  // Funciones para el flujo de selección flexible
  const handleSelectStackWorkflow = () => {
    console.log('🎯 handleSelectStackWorkflow called');
    setWorkflowChoice('stack');
    setHasUserChosenWorkflow(true);
    setShowWorkflowSelector(false);
    setShowStackSelector(true);
    console.log('🎯 States updated - showStackSelector should be true');

    addChatMessage({
      id: generateUniqueId('workflow-stack-selected'),
      sender: 'ai',
      content: '🎯 Perfecto! Has elegido usar un **stack tecnológico específico**. Esto te permitirá obtener código optimizado y archivos de configuración automáticos.\n\nAhora selecciona el stack que mejor se adapte a tu proyecto:',
      timestamp: Date.now(),
      type: 'notification',
      senderType: 'ai',
    });
  };

  const handleSelectGenericWorkflow = () => {
    setWorkflowChoice('generic');
    setHasUserChosenWorkflow(true);
    setShowWorkflowSelector(false);

    addChatMessage({
      id: generateUniqueId('workflow-generic-selected'),
      sender: 'ai',
      content: '⚡ Entendido! Has elegido continuar con **configuración genérica**. Esto te da máxima flexibilidad para mencionar cualquier tecnología durante el desarrollo.\n\nProcederé a generar tu proyecto con configuración adaptable. ¡Comencemos!',
      timestamp: Date.now(),
      type: 'notification',
      senderType: 'ai',
    });

    // Procesar la instrucción original inmediatamente
    const originalInstruction = localStorage.getItem('originalInstruction');
    if (originalInstruction) {
      localStorage.removeItem('originalInstruction');

      setAIConstructorState(prev => ({
        ...prev,
        isAIBusy: true,
        currentAIAction: 'Generando plan con configuración genérica...',
        currentAgent: 'planner'
      }));

      // Procesar sin stack específico
      const orchestrator = AIIterativeOrchestrator.getInstance();
      orchestrator.processUserInstruction(originalInstruction).catch(error => {
        console.error('Error al procesar instrucción genérica:', error);
        addChatMessage({
          id: generateUniqueId('generic-error'),
          sender: 'ai',
          content: `❌ Error al procesar la instrucción: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          timestamp: Date.now(),
          type: 'error',
          senderType: 'ai',
        });

        setAIConstructorState(prev => ({
          ...prev,
          isAIBusy: false,
          currentAIAction: 'awaitingInput'
        }));
      });
    }
  };

  // Función para cambiar el stack desde el botón de la interfaz
  const handleChangeStackFromButton = () => {
    setShowStackSelector(true);

    addChatMessage({
      id: generateUniqueId('stack-change-initiated'),
      sender: 'ai',
      content: selectedStack
        ? `🔄 Cambiando desde **${selectedStack.name}**. Selecciona un nuevo stack tecnológico:`
        : '🚀 Selecciona un stack tecnológico para optimizar tu proyecto:',
      timestamp: Date.now(),
      type: 'notification',
      senderType: 'ai',
    });
  };

  // Función para remover el stack actual
  const handleRemoveStack = () => {
    const previousStack = selectedStack;
    setSelectedStack(null);
    setWorkflowChoice('generic');

    // Limpiar el stack del orquestrador
    const orchestrator = AIIterativeOrchestrator.getInstance();
    orchestrator.clearSelectedStack();

    addChatMessage({
      id: generateUniqueId('stack-removed'),
      sender: 'ai',
      content: previousStack
        ? `🔄 Stack **${previousStack.name}** removido. Ahora continuaré con configuración genérica flexible. Puedes mencionar tecnologías específicas cuando las necesites.`
        : '✅ Configuración cambiada a modo genérico.',
      timestamp: Date.now(),
      type: 'notification',
      senderType: 'ai',
    });
  };

  // Funciones para el sistema de recomendación inteligente
  const generateStackRecommendation = (instruction: string) => {
    console.log('🧠 Generando recomendación para:', instruction);

    try {
      const recommendation = recommendationService.recommendStack(instruction);
      setCurrentRecommendation(recommendation);
      setShowStackRecommendation(true);

      console.log('🎯 Recomendación generada:', recommendation);

      addChatMessage({
        id: generateUniqueId('recommendation-generated'),
        sender: 'ai',
        content: `🧠 He analizado tu proyecto y encontré el stack tecnológico más apropiado. **${recommendation.stack.name}** tiene un ${Math.round(recommendation.score)}% de compatibilidad con tus necesidades.\n\n¿Te gustaría usar esta recomendación o prefieres explorar todas las opciones disponibles?`,
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai',
      });

    } catch (error) {
      console.error('Error al generar recomendación:', error);

      // Fallback al flujo de selección manual
      setShowWorkflowSelector(true);

      addChatMessage({
        id: generateUniqueId('recommendation-error'),
        sender: 'ai',
        content: '🤔 No pude generar una recomendación automática para tu proyecto. Te mostraré todas las opciones disponibles para que puedas elegir el stack más apropiado.',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai',
      });
    }
  };

  const handleAcceptRecommendation = () => {
    if (!currentRecommendation) return;

    console.log('✅ Usuario acepta recomendación:', currentRecommendation.stack.name);

    // Marcar que el usuario ha elegido un flujo de trabajo
    setHasUserChosenWorkflow(true);
    setWorkflowChoice('stack');
    setShowStackRecommendation(false);

    // Seleccionar el stack recomendado
    handleStackSelection(currentRecommendation.stack);

    addChatMessage({
      id: generateUniqueId('recommendation-accepted'),
      sender: 'ai',
      content: `🎉 ¡Excelente! Has aceptado la recomendación de **${currentRecommendation.stack.name}**. Este stack es perfecto para tu proyecto porque:\n\n${currentRecommendation.reasons.slice(0, 3).map(reason => `• ${reason}`).join('\n')}\n\nComenzaré a generar tu proyecto optimizado para este stack.`,
      timestamp: Date.now(),
      type: 'notification',
      senderType: 'ai',
    });
  };

  const handleRejectRecommendation = () => {
    console.log('❌ Usuario rechaza recomendación, mostrando selector manual');

    // Marcar que el usuario ha elegido el flujo de selección manual
    setWorkflowChoice('stack');
    setShowStackRecommendation(false);
    setShowStackSelector(true);

    addChatMessage({
      id: generateUniqueId('recommendation-rejected'),
      sender: 'ai',
      content: '👍 Entendido. Te mostraré todos los stacks tecnológicos disponibles para que puedas explorar y elegir el que más te convenga.',
      timestamp: Date.now(),
      type: 'notification',
      senderType: 'ai',
    });
  };

=======
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c
  const handleTemplateSelection = async (template: TemplateData | null) => {
    setAIConstructorState(prev => ({
      ...prev,
      selectedTemplate: template,
      showTemplateSelector: false,
      isAIBusy: true,
      currentAIAction: 'Iniciando proyecto...',
      showLoadingOverlay: true,
      currentAgent: 'planner',
      loadingProgress: 10
    }));

    // Recuperar la instrucción original del usuario
    const originalInstruction = localStorage.getItem('originalInstruction') || '';

    if (template) {
      // Añadir mensaje de selección de plantilla
      const userMessage = {
        id: generateUniqueId('template-selected'),
        sender: 'user',
        content: `Plantilla seleccionada: ${template.name}`,
        timestamp: Date.now(),
        type: 'text'
      };
      addChatMessage(userMessage);

      // Mensaje informativo sobre la combinación de instrucción y plantilla
      addChatMessage({
        id: generateUniqueId('combining-instruction'),
        sender: 'ai',
        content: 'Combinando tu instrucción original con la plantilla seleccionada para crear un plan de desarrollo más completo...',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai',
      });

      try {
        // Combinar la instrucción original con la plantilla
        const combinedInstruction = `${originalInstruction} utilizando la plantilla de ${template.name}: ${template.description}`;

        // Iniciar el proceso con el orquestrador iterativo usando la instrucción combinada
        await aiIterativeOrchestrator.processUserInstruction(combinedInstruction, template.id);
      } catch (error) {
        handleError(error, 'la inicialización del proyecto');
      } finally {
        setAIConstructorState(prev => ({
          ...prev,
          isAIBusy: false,
          currentAIAction: 'awaitingInput',
          showLoadingOverlay: false,
          currentAgent: null,
          loadingProgress: 0
        }));
      }
    } else {
      // Añadir mensaje de omisión de plantilla
      const userMessage = {
        id: generateUniqueId('template-skipped'),
        sender: 'user',
        content: `Plantilla omitida. Continuando con la instrucción original.`,
        timestamp: Date.now(),
        type: 'text'
      };
      addChatMessage(userMessage);

      try {
        // Procesar la instrucción original sin plantilla
        await aiIterativeOrchestrator.processUserInstruction(originalInstruction);
      } catch (error) {
        handleError(error, 'el procesamiento de la instrucción');
      } finally {
        setAIConstructorState(prev => ({
          ...prev,
          isAIBusy: false,
          currentAIAction: 'awaitingInput',
          showLoadingOverlay: false,
          currentAgent: null,
          loadingProgress: 0
        }));
      }
    }

    // Limpiar la instrucción original del localStorage después de usarla
    localStorage.removeItem('originalInstruction');
  };

  // FUNCIÓN OBSOLETA ELIMINADA - Se usa AIIterativeOrchestrator en su lugar
  // Esta función ha sido reemplazada por el sistema de orquestación iterativa

  const handleSendMessage = async (content: string) => {
    // Validar que el contenido no esté vacío y que no estemos procesando otra solicitud
    if (!content.trim() || aiConstructorState.isAIBusy) return;

    // Crear mensaje del usuario
    const userMessage: ChatMessage = {
      id: generateUniqueId('user'),
      sender: 'user',
      content,
      timestamp: Date.now(),
      type: 'text'
    };
    addChatMessage(userMessage);

    // Verificar si es una modificación interactiva
    const isModification = aiConstructorState.projectFiles.length > 0 && (
      content.toLowerCase().includes('modifica') ||
      content.toLowerCase().includes('cambia') ||
      content.toLowerCase().includes('actualiza') ||
      content.toLowerCase().includes('edita') ||
      content.toLowerCase().includes('añade') ||
      content.toLowerCase().includes('agrega') ||
      content.toLowerCase().includes('crea') ||
      content.toLowerCase().includes('nuevo') ||
      content.toLowerCase().includes('elimina') ||
      content.toLowerCase().includes('borra') ||
      content.toLowerCase().includes('renombra') ||
      content.toLowerCase().includes('modify') ||
      content.toLowerCase().includes('change') ||
      content.toLowerCase().includes('update') ||
      content.toLowerCase().includes('edit') ||
      content.toLowerCase().includes('add') ||
      content.toLowerCase().includes('create') ||
      content.toLowerCase().includes('new') ||
      content.toLowerCase().includes('delete') ||
      content.toLowerCase().includes('remove') ||
      content.toLowerCase().includes('rename') ||
      // Verificar si menciona archivos específicos
      aiConstructorState.projectFiles.some(file =>
        content.toLowerCase().includes(file.name.toLowerCase()) ||
        content.toLowerCase().includes(file.path.toLowerCase())
      )
    );

<<<<<<< HEAD
    // Sistema de recomendación inteligente para la primera instrucción del usuario
    // si aún no se ha elegido un flujo de trabajo y no es una modificación
    if (!hasUserChosenWorkflow && !isModification && chatMessages.filter(m => m.sender === 'user').length === 1) {
      // Guardar la instrucción original para procesarla después
      localStorage.setItem('originalInstruction', content);

      // Mostrar mensaje de análisis
      addChatMessage({
        id: generateUniqueId('analyzing-project'),
        sender: 'ai',
        content: '🧠 Analizando tu proyecto para encontrar el stack tecnológico más apropiado...\n\nEstoy evaluando:\n• Tipo de aplicación y requisitos\n• Complejidad del proyecto\n• Tecnologías mencionadas\n• Mejores prácticas recomendadas',
=======
    // Mostrar el selector de plantillas después de la primera instrucción del usuario
    // si aún no se ha seleccionado una plantilla y no es una modificación
    if (!aiConstructorState.showTemplateSelector && !aiConstructorState.selectedTemplate && !isModification) {
      // Guardar la instrucción original para combinarla con la plantilla después
      localStorage.setItem('originalInstruction', content);

      // Mostrar mensaje informativo sobre la selección de plantilla
      addChatMessage({
        id: generateUniqueId('template-prompt'),
        sender: 'ai',
        content: 'Ahora puedes seleccionar una plantilla para complementar tu instrucción. La plantilla se combinará con tu descripción inicial para generar un plan más completo.',
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai',
      });

<<<<<<< HEAD
      // Generar recomendación inteligente después de un breve delay para UX
      setTimeout(() => {
        generateStackRecommendation(content);
      }, 1500);

      return; // Detener el flujo aquí hasta que se procese la recomendación
    }

    // Verificar si estamos esperando una decisión del usuario sobre el stack
    if (showStackRecommendation || showWorkflowSelector || showStackSelector) {
      console.log('🛑 Esperando decisión del usuario sobre stack, no procesando instrucción aún');
      return;
    }

    // Verificar si el usuario ha elegido un flujo de trabajo
    if (!hasUserChosenWorkflow && !isModification) {
      console.log('🛑 Usuario no ha elegido flujo de trabajo, no procesando instrucción');
      return;
=======
      // Mostrar el selector de plantillas
      setAIConstructorState(prev => ({
        ...prev,
        showTemplateSelector: true
      }));

      return; // Detener el flujo aquí hasta que se seleccione una plantilla
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c
    }

    if (isModification) {
      // Añadir mensaje indicando que es una modificación interactiva
      addChatMessage({
        id: generateUniqueId('mod-info'),
        sender: 'system',
        content: '🔧 Detectada solicitud de modificación interactiva. Procesando cambios en tiempo real...',
        timestamp: Date.now(),
        type: 'info'
      });
    }

    // Actualizar el estado para mostrar que estamos procesando
    setAIConstructorState(prev => ({
      ...prev,
      isAIBusy: true,
      currentAIAction: isModification ? 'Aplicando modificaciones...' : 'Procesando instrucción...',
      showLoadingOverlay: true,
      currentAgent: isModification ? 'codemodifier' : 'codegenerator',
      loadingProgress: 15,
      terminalOutput: [...prev.terminalOutput, `[SISTEMA] ${isModification ? 'Aplicando modificaciones' : 'Procesando instrucción'}...`]
    }));

    try {
      // Procesar la instrucción con el orquestrador iterativo
      await aiIterativeOrchestrator.processUserInstruction(content);

      // Añadir mensaje de éxito a la terminal
      setAIConstructorState(prev => ({
        ...prev,
        terminalOutput: [...prev.terminalOutput, `[SUCCESS] ${isModification ? 'Modificación aplicada' : 'Instrucción procesada'} correctamente`]
      }));
    } catch (error) {
      handleError(error, isModification ? 'la aplicación de modificaciones' : 'el procesamiento de la instrucción');
    } finally {
      // Actualizar el estado para mostrar que hemos terminado
      setAIConstructorState(prev => ({
        ...prev,
        isAIBusy: false,
        currentAIAction: 'awaitingInput',
        showLoadingOverlay: false,
        currentAgent: null,
        loadingProgress: 0
      }));
    }
  };

<<<<<<< HEAD
  // Función para abrir el selector de stack desde el modal de mejora de prompt
  const handleOpenStackSelectorFromPrompt = () => {
    console.log('🔧 Constructor: Abriendo selector de stack desde modal de mejora de prompt');
    setShowStackSelector(true);

    addChatMessage({
      id: generateUniqueId('stack-selector-from-prompt'),
      sender: 'ai',
      content: '🚀 Selecciona el stack tecnológico que mejor se adapte a tu proyecto mejorado:',
      timestamp: Date.now(),
      type: 'notification',
      senderType: 'ai',
    });
  };

  // Función para procesar instrucción con stack después de selección desde modal de mejora
  const handleProcessWithStack = (enhancedPrompt: string) => {
    console.log('🔧 Constructor: Procesando instrucción mejorada con stack seleccionado');

    // Procesar la instrucción mejorada con el stack seleccionado
    handleSendMessage(enhancedPrompt);
  };

=======
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c
  const handleViewFileContent = async (file: FileItem) => {
    setSelectedFileForViewing(file);
    setAIConstructorState(prev => ({
      ...prev,
      currentAIAction: `Reading file: ${file.path}`,
      terminalOutput: [...prev.terminalOutput, `[INFO] Cargando contenido de ${file.path}...`]
    }));

    addChatMessage({
      id: generateUniqueId('view-file'),
      sender: 'system',
      content: `Cargando contenido de ${file.path}...`,
      type:'system'
    });

    try {
        // Verificar si el archivo ya tiene contenido
        if (file.content !== undefined && file.content !== null && file.content !== '') {
            // El archivo ya tiene contenido, usarlo directamente
            setAIConstructorState(prev => ({
                ...prev,
                currentAIAction: 'awaitingInput',
                editorContent: file.content,
                currentFilePath: file.path,
                activeTab: 'editor', // Cambiar automáticamente a la pestaña del editor
                terminalOutput: [...prev.terminalOutput, `[SUCCESS] Archivo cargado: ${file.path}`]
            }));

            addChatMessage({
              id: generateUniqueId('view-file-done'),
              sender: 'system',
              content: `Contenido de ${file.path} cargado. Puedes verlo en el panel de Editor.`,
              type:'success'
            });
        } else {
            // El archivo no tiene contenido, crear contenido por defecto basado en la extensión
            const extension = file.path.split('.').pop()?.toLowerCase() || '';
            let defaultContent = '';

            switch (extension) {
                case 'html':
                    defaultContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documento</title>
</head>
<body>
    <!-- Contenido generado por CODESTORM -->
    <h1>Hola Mundo</h1>
</body>
</html>`;
                    break;
                case 'css':
                    defaultContent = `/* Estilos generados por CODESTORM */
/* Archivo: ${file.path} */

body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
}`;
                    break;
                case 'js':
                case 'jsx':
                    defaultContent = `// Archivo: ${file.path}
// Generado por CODESTORM

console.log('Hola desde ${file.path}');

// Tu código aquí...`;
                    break;
                case 'ts':
                case 'tsx':
                    defaultContent = `// Archivo: ${file.path}
// Generado por CODESTORM

interface Props {
    // Define tus props aquí
}

// Tu código TypeScript aquí...
console.log('Hola desde ${file.path}');`;
                    break;
                case 'py':
                    defaultContent = `# Archivo: ${file.path}
# Generado por CODESTORM

def main():
    print("Hola desde ${file.path}")

if __name__ == "__main__":
    main()`;
                    break;
                case 'md':
                    defaultContent = `# ${file.path}

Este archivo fue generado por CODESTORM.

## Descripción

Agrega aquí la descripción de tu proyecto.

## Uso

Instrucciones de uso...`;
                    break;
                default:
                    defaultContent = `// Archivo: ${file.path}
// Generado por CODESTORM
// Contenido pendiente de generación

// Tu código aquí...`;
            }

            // Actualizar el archivo con contenido por defecto
            setAIConstructorState(prev => ({
                ...prev,
                projectFiles: prev.projectFiles.map(pf =>
                    pf.path === file.path ? {...pf, content: defaultContent } : pf
                ),
                currentAIAction: 'awaitingInput',
                editorContent: defaultContent,
                currentFilePath: file.path,
                activeTab: 'editor', // Cambiar automáticamente a la pestaña del editor
                terminalOutput: [...prev.terminalOutput, `[INFO] Archivo cargado con contenido por defecto: ${file.path}`]
            }));

            addChatMessage({
              id: generateUniqueId('view-file-done'),
              sender: 'system',
              content: `Archivo ${file.path} cargado con contenido por defecto. Puedes editarlo en el panel de Editor.`,
              type:'info'
            });
        }
    } catch (error) {
        console.error(`Error al cargar el archivo ${file.path}:`, error);
        handleError(error, `la lectura del archivo ${file.path}`);
        setAIConstructorState(prev => ({
          ...prev,
          currentAIAction: 'awaitingInput',
          terminalOutput: [...prev.terminalOutput, `[ERROR] Error al cargar ${file.path}: ${error instanceof Error ? error.message : 'Error desconocido'}`]
        }));
    }
  };

<<<<<<< HEAD
  // Métodos para manejar las aprobaciones con sistema robusto
  const handleApprove = (feedback?: string) => {
    console.log('🎯 handleApprove llamado con feedback:', feedback);

    if (!pendingApproval) {
      console.warn('❌ Se intentó aprobar, pero no hay una solicitud de aprobación pendiente');
      setApprovalFailureCount(prev => prev + 1);
      setLastApprovalError('No hay solicitud de aprobación pendiente');
=======
  // Métodos para manejar las aprobaciones
  const handleApprove = (feedback?: string) => {
    if (!pendingApproval) {
      console.warn('Se intentó aprobar, pero no hay una solicitud de aprobación pendiente');
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c

      // Mostrar mensaje de error
      addChatMessage({
        id: generateUniqueId('approval-error'),
        sender: 'system',
        content: 'Error: No hay una solicitud de aprobación pendiente. Por favor, intenta nuevamente.',
        timestamp: Date.now(),
        type: 'error'
      });

<<<<<<< HEAD
      // Activar sistema robusto después de 2 fallos
      if (approvalFailureCount >= 1) {
        setUseRobustApproval(true);
        console.log('🛡️ Activando sistema robusto de aprobación');
      }

      return;
    }

    console.log(`✅ Aprobando solicitud con ID: ${pendingApproval.id}, tipo: ${pendingApproval.type}`);

    // Registrar intento de aprobación en el monitoreo
    approvalMonitoring.recordApprovalAttempt(pendingApproval.id, {
      feedback: feedback?.substring(0, 100), // Limitar longitud
      type: pendingApproval.type,
      isCompletePlan: pendingApproval.metadata?.isCompletePlan
    });
=======
      return;
    }

    console.log(`Aprobando solicitud con ID: ${pendingApproval.id}, tipo: ${pendingApproval.type}`);
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c

    // Añadir mensaje de chat indicando la aprobación
    addChatMessage({
      id: generateUniqueId('approval'),
      sender: 'user',
      content: `He aprobado el plan${feedback ? `: ${feedback}` : '.'}`,
      timestamp: Date.now(),
      type: 'approval-response',
      metadata: {
        approvalId: pendingApproval.id,
        approvalStatus: 'approved',
        approvalType: pendingApproval.type
      }
    });

    // Actualizar el estado para mostrar que estamos procesando
    setAIConstructorState(prev => ({
      ...prev,
      isAIBusy: true,
      currentAIAction: 'Procesando aprobación...'
    }));

    try {
<<<<<<< HEAD
      // Guardar backup antes de procesar
      const approvalBackup = {
        approvalData: pendingApproval,
        feedback,
        timestamp: Date.now(),
        attempt: approvalFailureCount + 1
      };
      localStorage.setItem('codestorm_approval_backup', JSON.stringify(approvalBackup));

=======
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c
      // Para planes completos, no necesitamos pasar approvedItems
      if (pendingApproval.metadata?.isCompletePlan) {
        // Llamar al método de aprobación del orquestrador sin approvedItems
        aiIterativeOrchestrator.handleApproval(pendingApproval.id, true, feedback);
      } else {
        // Para otros tipos de aprobación, usar todos los items como approvedItems
        const allItems = pendingApproval.items.map(item => item.id);
        aiIterativeOrchestrator.handleApproval(pendingApproval.id, true, feedback, allItems);
      }

<<<<<<< HEAD
      console.log('✅ Solicitud de aprobación enviada correctamente');

      // Registrar éxito en el monitoreo
      approvalMonitoring.recordApprovalSuccess(pendingApproval.id, Date.now() - Date.now(), {
        feedback: feedback?.substring(0, 100)
      });

      // Resetear contador de fallos en caso de éxito
      setApprovalFailureCount(0);
      setLastApprovalError(null);

      // Timeout de seguridad para detectar si la aprobación no se procesa
      setTimeout(() => {
        if (pendingApproval && aiConstructorState.isAIBusy) {
          console.warn('⚠️ La aprobación no se procesó en el tiempo esperado');
          setApprovalFailureCount(prev => prev + 1);
          setLastApprovalError('Timeout en procesamiento de aprobación');
          setUseRobustApproval(true);
        }
      }, 15000); // 15 segundos

    } catch (error) {
      console.error('❌ Error al procesar la aprobación:', error);

      // Registrar fallo en el monitoreo
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      approvalMonitoring.recordApprovalFailure(pendingApproval.id, errorMessage, {
        feedback: feedback?.substring(0, 100),
        attempt: approvalFailureCount + 1
      });

      setApprovalFailureCount(prev => prev + 1);
      setLastApprovalError(errorMessage);

      // Activar sistema robusto después de errores
      if (approvalFailureCount >= 1) {
        setUseRobustApproval(true);
      }

=======
      console.log('Solicitud de aprobación enviada correctamente');
    } catch (error) {
      console.error('Error al procesar la aprobación:', error);
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c
      handleError(error, 'el procesamiento de la aprobación');
    }
  };

  const handleReject = (feedback: string) => {
    if (!pendingApproval) {
      console.warn('Se intentó rechazar, pero no hay una solicitud de aprobación pendiente');

      // Mostrar mensaje de error
      addChatMessage({
        id: generateUniqueId('rejection-error'),
        sender: 'system',
        content: 'Error: No hay una solicitud de aprobación pendiente. Por favor, intenta nuevamente.',
        timestamp: Date.now(),
        type: 'error'
      });

      return;
    }

    console.log(`Rechazando solicitud con ID: ${pendingApproval.id}, feedback: ${feedback}`);

    // Añadir mensaje de chat indicando el rechazo
    addChatMessage({
      id: generateUniqueId('rejection'),
      sender: 'user',
      content: `He rechazado el plan: ${feedback}`,
      timestamp: Date.now(),
      type: 'approval-response',
      metadata: {
        approvalId: pendingApproval.id,
        approvalStatus: 'rejected',
        approvalType: pendingApproval.type
      }
    });

    // Actualizar el estado para mostrar que estamos procesando
    setAIConstructorState(prev => ({
      ...prev,
      isAIBusy: true,
      currentAIAction: 'Procesando rechazo...'
    }));

    try {
      // Llamar al método de rechazo del orquestrador
      aiIterativeOrchestrator.handleApproval(pendingApproval.id, false, feedback);

      console.log('Solicitud de rechazo enviada correctamente');
    } catch (error) {
      console.error('Error al procesar el rechazo:', error);
      handleError(error, 'el procesamiento del rechazo');
    }
  };

<<<<<<< HEAD
  // Funciones para el sistema robusto de aprobación
  const handleForceApproval = () => {
    console.log('🔥 Aprobación forzada activada');

    if (!pendingApproval) {
      console.error('❌ No hay solicitud de aprobación para forzar');
      return;
    }

    // Añadir mensaje de aprobación forzada
    addChatMessage({
      id: generateUniqueId('force-approval'),
      sender: 'user',
      content: '🔥 He forzado la aprobación del plan debido a problemas técnicos.',
      timestamp: Date.now(),
      type: 'approval-response',
      metadata: {
        approvalId: pendingApproval.id,
        approvalStatus: 'force-approved',
        approvalType: pendingApproval.type
      }
    });

    // Intentar múltiples métodos de aprobación
    try {
      // Método 1: Aprobación directa
      aiIterativeOrchestrator.handleApproval(pendingApproval.id, true, 'Aprobación forzada por el usuario');

      // Método 2: Si el anterior falla, intentar con timeout
      setTimeout(() => {
        if (pendingApproval) {
          console.log('🔄 Reintentando aprobación forzada...');
          aiIterativeOrchestrator.handleApproval(pendingApproval.id, true, 'Aprobación forzada - reintento');
        }
      }, 2000);

      // Método 3: Limpiar estado manualmente si es necesario
      setTimeout(() => {
        if (pendingApproval) {
          console.log('🧹 Limpiando estado de aprobación manualmente...');
          setPendingApproval(null);
          setAIConstructorState(prev => ({
            ...prev,
            isAIBusy: false,
            currentAIAction: null
          }));
        }
      }, 5000);

    } catch (error) {
      console.error('❌ Error en aprobación forzada:', error);
    }
  };

  const handleResetApprovalState = () => {
    console.log('🔄 Reseteando estado de aprobación');

    setApprovalFailureCount(0);
    setLastApprovalError(null);
    setUseRobustApproval(false);

    // Limpiar estado de AI
    setAIConstructorState(prev => ({
      ...prev,
      isAIBusy: false,
      currentAIAction: null
    }));

    // Limpiar backup
    localStorage.removeItem('codestorm_approval_backup');

    addChatMessage({
      id: generateUniqueId('reset-approval'),
      sender: 'system',
      content: '🔄 Estado de aprobación reseteado. Puedes intentar aprobar nuevamente.',
      timestamp: Date.now(),
      type: 'notification'
    });
  };

=======
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c
  const handlePartialApprove = (approvedItems: string[], feedback?: string) => {
    if (!pendingApproval) {
      console.warn('Se intentó aprobar parcialmente, pero no hay una solicitud de aprobación pendiente');

      // Mostrar mensaje de error
      addChatMessage({
        id: generateUniqueId('partial-approval-error'),
        sender: 'system',
        content: 'Error: No hay una solicitud de aprobación pendiente. Por favor, intenta nuevamente.',
        timestamp: Date.now(),
        type: 'error'
      });

      return;
    }

    console.log(`Aprobando parcialmente ${approvedItems.length} elementos de la solicitud con ID: ${pendingApproval.id}`);
    console.log('Elementos aprobados:', approvedItems);

    // Añadir mensaje de chat indicando la aprobación parcial
    addChatMessage({
      id: generateUniqueId('partial-approval'),
      sender: 'user',
      content: `He aprobado parcialmente ${pendingApproval.type === 'batch' ? 'los archivos' : 'el plan'} (${approvedItems.length} de ${pendingApproval.items.length} elementos)${feedback ? `: ${feedback}` : '.'}`,
      timestamp: Date.now(),
      type: 'approval-response',
      metadata: {
        approvalId: pendingApproval.id,
        approvalStatus: 'partially-approved',
        approvalType: pendingApproval.type
      }
    });

    // Actualizar el estado para mostrar que estamos procesando
    setAIConstructorState(prev => ({
      ...prev,
      isAIBusy: true,
      currentAIAction: 'Procesando aprobación parcial...'
    }));

    try {
      // Llamar al método de aprobación parcial del orquestrador
      // Nota: El segundo parámetro debe ser true para aprobación parcial
      aiIterativeOrchestrator.handleApproval(pendingApproval.id, true, feedback, approvedItems);

      console.log('Solicitud de aprobación parcial enviada correctamente');
    } catch (error) {
      console.error('Error al procesar la aprobación parcial:', error);
      handleError(error, 'el procesamiento de la aprobación parcial');
    }
  };

  // Métodos para controlar el progreso
  const handlePauseProgress = () => {
    aiIterativeOrchestrator.pauseProcessing();

    // Añadir mensaje de chat indicando la pausa
    addChatMessage({
      id: generateUniqueId('pause'),
      sender: 'system',
      content: 'Proceso pausado. Puedes reanudarlo cuando estés listo.',
      timestamp: Date.now(),
      type: 'system'
    });
  };

  const handleResumeProgress = () => {
    aiIterativeOrchestrator.resumeProcessing();

    // Añadir mensaje de chat indicando la reanudación
    addChatMessage({
      id: generateUniqueId('resume'),
      sender: 'system',
      content: 'Proceso reanudado.',
      timestamp: Date.now(),
      type: 'system'
    });
  };

  const handleCancelProgress = () => {
    aiIterativeOrchestrator.cancelProcessing();

    // Añadir mensaje de chat indicando la cancelación
    addChatMessage({
      id: generateUniqueId('cancel'),
      sender: 'system',
      content: 'Proceso cancelado.',
      timestamp: Date.now(),
      type: 'system'
    });
  };

  // Función para manejar el asistente de ayuda
  const handleToggleHelpAssistant = () => {
    setShowHelpAssistant(prev => !prev);
  };

<<<<<<< HEAD
  // Debug logs
  console.log('🔍 Debug states:', {
    showStackSelector,
    showWorkflowSelector,
    hasUserChosenWorkflow,
    workflowChoice,
    selectedStack: selectedStack?.name
  });

=======
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c
  return (
    <div className="flex flex-col min-h-screen bg-codestorm-darker">
      <Header showConstructorButton={false} />
      <main className="container flex-1 px-4 py-4 mx-auto">
<<<<<<< HEAD
        {/* Recomendación inteligente de stack */}
        {showStackRecommendation && currentRecommendation && (
          <div className="mb-6">
            <StackRecommendation
              recommendation={currentRecommendation}
              onAcceptRecommendation={handleAcceptRecommendation}
              onSelectManually={handleRejectRecommendation}
              originalInstruction={localStorage.getItem('originalInstruction') || ''}
            />
          </div>
        )}

        {/* Selector de flujo de trabajo */}
        {showWorkflowSelector && (
          <div className="mb-6">
            <WorkflowSelector
              onSelectStackWorkflow={handleSelectStackWorkflow}
              onSelectGenericWorkflow={handleSelectGenericWorkflow}
              originalInstruction={localStorage.getItem('originalInstruction') || ''}
            />
          </div>
        )}

        {/* Selector de stack tecnológico */}
        {showStackSelector && (
          <div className="mb-6">
            <div className="p-4 mb-4 rounded-lg shadow-md bg-codestorm-dark">
              <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-white mb-3`}>
                🚀 Selecciona tu Stack de Tecnología
              </h2>
              <div className="p-3 mb-4 border rounded-md bg-codestorm-blue/10 border-codestorm-blue/30">
                <p className="text-sm text-white">
                  <span className="font-semibold">Instrucción recibida:</span> {localStorage.getItem('originalInstruction')}
                </p>
                <p className="mt-2 text-sm text-codestorm-accent">
                  Selecciona el stack tecnológico que mejor se adapte a tu proyecto. Cada opción incluye información detallada sobre facilidad, rendimiento y casos de uso.
                </p>
              </div>
            </div>

            <TechnologyStackCarousel
              onSelectStack={handleStackSelection}
              onShowDetails={handleShowStackDetails}
              selectedStackId={selectedStack?.id}
              className="mb-4"
            />

            <div className="flex justify-center">
              <button
                onClick={() => {
                  setShowStackSelector(false);
                  if (!hasUserChosenWorkflow) {
                    // Si llegamos aquí desde el flujo de trabajo, cambiar a genérico
                    handleSelectGenericWorkflow();
                  } else {
                    // Si llegamos aquí desde el botón de cambio, mantener estado actual
                    addChatMessage({
                      id: generateUniqueId('stack-selection-cancelled'),
                      sender: 'ai',
                      content: 'Selección de stack cancelada. Continuando con la configuración actual.',
                      timestamp: Date.now(),
                      type: 'notification',
                      senderType: 'ai',
                    });
                  }
                }}
                className="px-6 py-2 text-sm text-white bg-gray-600 rounded-md hover:bg-gray-700 transition-colors"
              >
                {!hasUserChosenWorkflow ? 'Continuar sin stack específico' : 'Cancelar selección'}
              </button>
            </div>
          </div>
        )}

        {!showStackSelector && !showWorkflowSelector && !showStackRecommendation && (
          <div className="p-6 mb-6 rounded-lg shadow-md bg-codestorm-dark">
            <div className="flex items-center justify-between mb-4">
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white`}>
                Constructor de CODESTORM (IA Activa)
              </h1>

              {/* Botón de cambio de stack */}
              {hasUserChosenWorkflow && (
                <StackChangeButton
                  currentStack={selectedStack}
                  onChangeStack={handleChangeStackFromButton}
                  onRemoveStack={handleRemoveStack}
                />
              )}
            </div>

            <p className="mb-2 text-gray-300">
              {selectedStack ? (
                <span className="flex items-center">
                  <span className="text-2xl mr-2">{selectedStack.icon}</span>
                  <span>
                    <strong>Stack seleccionado:</strong> {selectedStack.name}
                    <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                      {selectedStack.difficultyLevel}
                    </span>
                  </span>
                </span>
              ) : workflowChoice === 'generic' ? (
                <span className="flex items-center">
                  <span className="text-2xl mr-2">⚡</span>
                  <span>
                    <strong>Modo:</strong> Configuración Genérica
                    <span className="ml-2 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                      Flexible
                    </span>
                  </span>
                </span>
              ) : ''}
              {(selectedStack || workflowChoice === 'generic') ? ' | ' : ''}Describe tu proyecto, tarea o las modificaciones deseadas.
            </p>

            {selectedStack && (
              <div className="p-3 mb-4 border rounded-md bg-blue-500/10 border-blue-500/30">
                <p className="text-sm text-blue-300">
                  <strong>Stack activo:</strong> {selectedStack.shortDescription}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Tecnologías principales: {selectedStack.technologies.slice(0, 3).map(t => t.name).join(', ')}
                  {selectedStack.technologies.length > 3 && ` y ${selectedStack.technologies.length - 3} más`}
                </p>
              </div>
            )}

            {workflowChoice === 'generic' && !selectedStack && (
              <div className="p-3 mb-4 border rounded-md bg-yellow-500/10 border-yellow-500/30">
                <p className="text-sm text-yellow-300">
                  <strong>Modo genérico activo:</strong> Máxima flexibilidad tecnológica
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Puedes mencionar cualquier tecnología durante el desarrollo. Usa el botón "Stack" para cambiar a modo específico.
                </p>
              </div>
            )}
=======
        {aiConstructorState.showTemplateSelector && (
          <div className="p-6 mb-6 rounded-lg shadow-md bg-codestorm-dark">
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-white mb-3`}>
              Selecciona una Plantilla para Complementar tu Instrucción
            </h2>
            <div className="p-3 mb-4 border rounded-md bg-codestorm-blue/10 border-codestorm-blue/30">
              <p className="text-sm text-white">
                <span className="font-semibold">Instrucción recibida:</span> {localStorage.getItem('originalInstruction')}
              </p>
              <p className="mt-2 text-sm text-codestorm-accent">
                Selecciona una plantilla para complementar tu instrucción y crear un plan de desarrollo más completo.
              </p>
            </div>
            <ProjectTemplateSelector onSelectTemplate={handleTemplateSelection} />
            <button
              onClick={() => handleTemplateSelection(null)}
              className="px-4 py-2 mt-4 text-sm text-white bg-gray-600 rounded-md hover:bg-gray-700">
              Continuar sin plantilla
            </button>
          </div>
        )}

        {!aiConstructorState.showTemplateSelector && (
          <div className="p-6 mb-6 rounded-lg shadow-md bg-codestorm-dark">
            <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white mb-4`}>Constructor de CODESTORM (IA Activa)</h1>
            <p className="mb-2 text-gray-300">
              {aiConstructorState.selectedTemplate ? `Plantilla: ${aiConstructorState.selectedTemplate.name}. ` : ''}
              Describe tu proyecto, tarea o las modificaciones deseadas.
            </p>


>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c

            {aiConstructorState.isAIBusy && (
              <div className="flex items-center p-3 mb-4 border rounded-md bg-codestorm-blue/10 border-codestorm-blue/30">
                <Loader className="w-5 h-5 mr-2 text-codestorm-accent animate-spin" />
                <p className="text-sm text-white">IA: {aiConstructorState.currentAIAction || 'procesando'}...</p>
              </div>
            )}
          </div>
        )}

        {/* Interfaz de Aprobación */}
        {pendingApproval && (
          <div className="p-6 mb-6 rounded-lg shadow-md bg-codestorm-dark">
<<<<<<< HEAD
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Aprobación Requerida</h2>
              {(useRobustApproval || approvalFailureCount > 0) && (
                <div className="flex items-center space-x-2">
                  <div className="px-3 py-1 bg-yellow-600 text-yellow-100 text-xs rounded-full">
                    Sistema Robusto Activo
                  </div>
                  {approvalFailureCount > 0 && (
                    <div className="px-3 py-1 bg-red-600 text-red-100 text-xs rounded-full">
                      {approvalFailureCount} Fallos
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mostrar error si existe */}
            {lastApprovalError && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-red-300 text-sm">Último error: {lastApprovalError}</span>
                </div>
              </div>
            )}

            {/* Sistema de Aprobación Robusto o Normal */}
            {useRobustApproval ? (
              <RobustApprovalSystem
                approvalData={pendingApproval}
                onApprove={handleApprove}
                onReject={handleReject}
                onPartialApprove={handlePartialApprove}
                isLoading={aiConstructorState.isAIBusy}
              />
            ) : (
              <ApprovalInterface
                approvalData={pendingApproval}
                onApprove={handleApprove}
                onReject={handleReject}
                onPartialApprove={handlePartialApprove}
                isLoading={aiConstructorState.isAIBusy}
              />
            )}

            {/* Controles de Emergencia */}
            {(useRobustApproval || approvalFailureCount > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h3 className="text-sm font-medium text-white mb-2">Controles de Emergencia</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleForceApproval}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                  >
                    🔥 Forzar Aprobación
                  </button>
                  <button
                    onClick={handleResetApprovalState}
                    className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors"
                  >
                    🔄 Resetear Estado
                  </button>
                  <button
                    onClick={() => setUseRobustApproval(!useRobustApproval)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                  >
                    {useRobustApproval ? '📱 Modo Normal' : '🛡️ Modo Robusto'}
                  </button>
                  <button
                    onClick={() => setShowManualCommand(!showManualCommand)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                  >
                    💻 Terminal
                  </button>
                </div>
              </div>
            )}
=======
            <h2 className="mb-4 text-xl font-bold text-white">Aprobación Requerida</h2>
            <ApprovalInterface
              approvalData={pendingApproval}
              onApprove={handleApprove}
              onReject={handleReject}
              onPartialApprove={handlePartialApprove}
              isLoading={aiConstructorState.isAIBusy}
            />
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c
          </div>
        )}

        {/* Indicador de Progreso */}
        {progress && (
          <div className="p-6 mb-6 rounded-lg shadow-md bg-codestorm-dark">
            <ProgressIndicator
              progress={progress}
              onPause={handlePauseProgress}
              onResume={handleResumeProgress}
              onCancel={handleCancelProgress}
              onViewLog={() => {}}
              isPaused={aiConstructorState.currentAIAction === 'paused'}
              showControls={true}
            />
          </div>
        )}

        {/* Nueva estructura de dos columnas para el Constructor */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-12 gap-6'}`}>
          {/* Columna Izquierda - Chat Interactivo */}
          <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-5' : 'col-span-4'}`}>
            <CollapsiblePanel
              title={aiConstructorState.showTemplateSelector ? "Describe tu Proyecto" : "Chat Interactivo con IA"}
              type="terminal"
              isVisible={true}
              showCollapseButton={false}
            >
              <div className={`${isMobile ? 'h-[calc(100vh - 450px)]' : 'h-[calc(100vh - 200px)]'} relative`}>
                <InteractiveChat
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  isProcessing={aiConstructorState.isAIBusy}
                  isDisabled={aiConstructorState.showTemplateSelector && !aiConstructorState.selectedTemplate}
                  currentAgent={aiConstructorState.currentAgent || undefined}
                  processingMessage={aiConstructorState.currentAIAction || undefined}
<<<<<<< HEAD
                  disablePromptEnhancement={false}
                  onOpenStackSelector={handleOpenStackSelectorFromPrompt}
                  onProcessWithStack={handleProcessWithStack}
=======
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c
                />
              </div>
            </CollapsiblePanel>
          </div>

          {/* Columna Derecha - Paneles de Desarrollo */}
          <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-7' : 'col-span-8'} space-y-4`}>
            {/* Tabs para cambiar entre paneles */}
            <div className="flex border-b border-codestorm-blue/30">
              <button
                className={`px-4 py-2 text-sm font-medium ${aiConstructorState.activeTab === 'files' ? 'text-codestorm-accent border-b-2 border-codestorm-accent' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setAIConstructorState(prev => ({ ...prev, activeTab: 'files' }))}
              >
                <Folder className="inline-block w-4 h-4 mr-2" />
                Explorador
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${aiConstructorState.activeTab === 'editor' ? 'text-codestorm-accent border-b-2 border-codestorm-accent' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setAIConstructorState(prev => ({ ...prev, activeTab: 'editor' }))}
              >
                <Code className="inline-block w-4 h-4 mr-2" />
                Editor
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${aiConstructorState.activeTab === 'terminal' ? 'text-codestorm-accent border-b-2 border-codestorm-accent' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setAIConstructorState(prev => ({ ...prev, activeTab: 'terminal' }))}
              >
                <Terminal className="inline-block w-4 h-4 mr-2" />
                Terminal
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${aiConstructorState.activeTab === 'preview' ? 'text-codestorm-accent border-b-2 border-codestorm-accent' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setAIConstructorState(prev => ({ ...prev, activeTab: 'preview' }))}
              >
                <Monitor className="inline-block w-4 h-4 mr-2" />
                Vista Previa
              </button>
              <div className="flex-grow"></div>
              <button
                className="px-4 py-2 text-sm font-medium text-codestorm-accent hover:text-white bg-codestorm-accent/10 hover:bg-codestorm-accent/20 rounded-md transition-colors"
                onClick={handleOpenRepositoryImporter}
                title="Importar repositorio comprimido (ZIP, RAR, etc.)"
              >
                <Archive className="inline-block w-4 h-4 mr-2" />
                Importar Repo
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white ml-2"
                title="Vista dividida (próximamente)"
              >
                <Split className="inline-block w-4 h-4" />
              </button>
            </div>

            {/* Panel de Explorador de Archivos */}
            <div className={`${aiConstructorState.activeTab === 'files' ? 'block' : 'hidden'} h-[calc(100vh-280px)]`}>
              <DirectoryExplorer
                files={aiConstructorState.projectFiles}
                onSelectFile={handleViewFileContent}
                selectedFilePath={aiConstructorState.currentFilePath}
              />
            </div>

            {/* Panel de Editor de Código */}
            <div className={`${aiConstructorState.activeTab === 'editor' ? 'block' : 'hidden'} h-[calc(100vh-280px)]`}>
              <CodeEditor
                content={aiConstructorState.editorContent}
                language={aiConstructorState.currentFilePath ? getLanguageFromFilePath(aiConstructorState.currentFilePath) : 'javascript'}
                path={aiConstructorState.currentFilePath}
                onChange={(newContent) => setAIConstructorState(prev => ({ ...prev, editorContent: newContent }))}
                readOnly={false}
              />
            </div>

            {/* Panel de Terminal/Consola */}
            <div className={`${aiConstructorState.activeTab === 'terminal' ? 'block' : 'hidden'} h-[calc(100vh-280px)]`}>
              <TerminalOutput
                output={aiConstructorState.terminalOutput}
              />
            </div>

            {/* Panel de Vista Previa */}
            <div className={`${aiConstructorState.activeTab === 'preview' ? 'block' : 'hidden'} h-[calc(100vh-280px)]`}>
              <EnhancedPreviewPanel
                files={aiConstructorState.projectFiles}
                onRefresh={() => {
                  // Refrescar la vista previa
                  setAIConstructorState(prev => ({
                    ...prev,
                    terminalOutput: [...prev.terminalOutput, `[INFO] Refrescando vista previa...`]
                  }));

                  // Añadir mensaje al chat
                  addChatMessage({
                    id: generateUniqueId('preview-refresh'),
                    sender: 'system',
                    content: 'Vista previa actualizada con los archivos más recientes.',
                    timestamp: Date.now(),
                    type: 'info'
                  });
                }}
                onError={(error) => {
                  setAIConstructorState(prev => ({
                    ...prev,
                    terminalOutput: [...prev.terminalOutput, `[ERROR] Error en vista previa: ${error}`]
                  }));

                  addChatMessage({
                    id: generateUniqueId('preview-error'),
                    sender: 'system',
                    content: `Error en la vista previa: ${error}`,
                    timestamp: Date.now(),
                    type: 'error'
                  });
                }}
                onSuccess={(message) => {
                  setAIConstructorState(prev => ({
                    ...prev,
                    terminalOutput: [...prev.terminalOutput, `[SUCCESS] ${message}`]
                  }));
                }}
              />
            </div>
          </div>
        </div>
      </main>
      <BrandLogo size="md" showPulse={true} showGlow={true} />
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

      {/* Panel de modificación de código */}
      <CodeModifierPanel
        isVisible={isCodeModifierVisible}
        onClose={toggleCodeModifier}
        files={aiConstructorState.projectFiles}
        onApplyChanges={(originalFile: FileItem, modifiedFile: FileItem) => {
          // Actualizar el archivo en el estado
          setAIConstructorState(prev => ({
            ...prev,
            projectFiles: prev.projectFiles.map(f =>
              f.id === originalFile.id ? modifiedFile : f
            )
          }));

          // Añadir mensaje de confirmación
          addChatMessage({
            id: generateUniqueId('file-modified'),
            sender: 'ai',
            content: `Archivo '${modifiedFile.path}' modificado con éxito mediante el Agente Modificador de Código.`,
            timestamp: Date.now(),
            type: 'success',
            senderType: 'ai'
          });

          toggleCodeModifier();
        }}
      />

      {/* Botones flotantes */}
      <FloatingActionButtons
        onToggleChat={() => {}} // No hay chat separado en Constructor
        onTogglePreview={() => setAIConstructorState(prev => ({ ...prev, activeTab: 'preview' }))}
        onToggleCodeModifier={toggleCodeModifier}
        onToggleHelpAssistant={handleToggleHelpAssistant}
        showChat={false}
        showCodeModifier={isCodeModifierVisible}
        showHelpAssistant={showHelpAssistant}
      />

      <Footer showLogo={true} />

      {/* Repository Importer */}
      <RepositoryImporter
        isOpen={aiConstructorState.showRepositoryImporter}
        onClose={handleCloseRepositoryImporter}
        onRepositoryImported={handleRepositoryImported}
      />

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={aiConstructorState.showLoadingOverlay}
        message={aiConstructorState.currentAIAction || 'Procesando...'}
        progress={aiConstructorState.loadingProgress}
        currentAgent={aiConstructorState.currentAgent || undefined}
        canCancel={true}
        onCancel={() => {
          console.log('Cancelando proceso desde LoadingOverlay...');
          // Cancelar el proceso en el orquestrador
          aiIterativeOrchestrator.cancelProcessing();

          // Actualizar el estado local
          setAIConstructorState(prev => ({
            ...prev,
            showLoadingOverlay: false,
            isAIBusy: false,
            currentAIAction: 'awaitingInput',
            currentAgent: null,
            loadingProgress: 0
          }));
        }}
      />

      {/* Asistente de ayuda */}
      <HelpAssistant
        isOpen={showHelpAssistant}
        onClose={handleToggleHelpAssistant}
      />
<<<<<<< HEAD

      {/* Modal de detalles del stack */}
      {selectedStack && (
        <StackDetailModal
          stack={selectedStack}
          isOpen={showStackModal}
          onClose={() => setShowStackModal(false)}
          onSelect={handleSelectStackFromModal}
          isSelected={true}
        />
      )}

      {/* Panel de Forzar Aprobación */}
      <ApprovalDebugPanel
        approvalData={pendingApproval}
        isAIBusy={aiConstructorState.isAIBusy}
        currentAction={aiConstructorState.currentAIAction}
        onForceApproval={handleForceApproval}
        onResetState={handleResetApprovalState}
      />

      {/* Terminal de Comandos Manual */}
      <ManualApprovalCommand
        approvalData={pendingApproval}
        onApprove={handleApprove}
        onReject={handleReject}
        isVisible={showManualCommand}
        onToggleVisibility={() => setShowManualCommand(!showManualCommand)}
      />
=======
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c
    </div>
  );
};

export default Constructor;
