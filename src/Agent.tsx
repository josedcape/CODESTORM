import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CollapsiblePanel from '../components/CollapsiblePanel';
import BrandLogo from '../components/BrandLogo';
import Footer from '../components/Footer';
import LoadingOverlay from '../components/LoadingOverlay';
import HelpAssistant from '../components/HelpAssistant';
import UniversalFloatingButtons from '../components/common/UniversalFloatingButtons';
import CodeCorrectionModal from '../components/agent/CodeCorrectionModal';
import {
  Bot,
  Code,
  Eye,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  GitBranch,
  FileText,
  Monitor,
  Users,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Brain,
  Shield,
  Activity,
  FolderOpen,
  Target,
  MessageSquare,
  X
} from 'lucide-react';
import {
  FileItem,
  ChatMessage,
  ApprovalData,
  ProgressData
} from '../types';
import { generateUniqueId } from '../utils/idGenerator';
import { useUI } from '../contexts/UIContext';

// Importar componentes específicos del Agent
import AgentChat from '../components/agent/AgentChat';
import ContextEngine from '../components/agent/ContextEngine';
import NextEditPanel from '../components/agent/NextEditPanel';
import CompletionsPanel from '../components/agent/CompletionsPanel';
import CodebaseAnalyzer from '../components/agent/CodebaseAnalyzer';
import TeamCollaboration from '../components/agent/TeamCollaboration';
import AgentStatusBar from '../components/agent/AgentStatusBar';
import AugmentStyleInterface from '../components/agent/AugmentStyleInterface';
import ProjectLoader from '../components/agent/ProjectLoader';
import ProjectExplorer from '../components/agent/ProjectExplorer';
import ProjectPlanner from '../components/agent/ProjectPlanner';
import ExecutionMonitor from '../components/agent/ExecutionMonitor';
import FilePreview from '../components/agent/FilePreview';
import EnhancedCodeEditor from '../components/agent/EnhancedCodeEditor';
import EnhancedFileTree from '../components/agent/EnhancedFileTree';
import MessengerAgent from '../components/agent/MessengerAgent';
import FileModificationIndicator from '../components/agent/FileModificationIndicator';
import IntegratedCodeEditor from '../components/agent/IntegratedCodeEditor';
import FileExplorer from '../components/agent/FileExplorer';
import { DesignArchitectAgent } from '../agents/DesignArchitectAgent';
import { CodeModificationContext } from '../services/ClaudeAPIService';
import ExecutionService, { StepExecutionResult, ExecutionCallbacks } from '../services/ExecutionService';

// Tipos específicos para el sistema Agent
export interface AgentTask {
  id: string;
  type: 'generate' | 'correct' | 'review';
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  agentName: string;
  startTime: number;
  endTime?: number;
  result?: any;
  files?: string[];
}

export interface CodeModification {
  id: string;
  filePath: string;
  originalContent: string;
  proposedContent: string;
  description: string;
  agentType: 'generator' | 'corrector' | 'reviewer';
  confidence: number;
  timestamp: number;
  approved: boolean;
}

// Nuevos tipos para gestión de proyectos
export interface ProjectRepository {
  id: string;
  name: string;
  url?: string;
  type: 'github' | 'gitlab' | 'zip' | 'local';
  branch?: string;
  size: number;
  lastModified: number;
  structure: ProjectStructure;
}

export interface ProjectStructure {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: number;
  children?: ProjectStructure[];
  content?: string;
  language?: string;
  isExpanded?: boolean;
}

export interface ProjectPlan {
  id: string;
  title: string;
  description: string;
  estimatedTime: number; // en minutos
  complexity: 'low' | 'medium' | 'high' | 'critical';
  steps: PlanStep[];
  risks: string[];
  dependencies: string[];
  createdAt: number;
  status: 'draft' | 'pending-approval' | 'approved' | 'executing' | 'completed' | 'failed';
}

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  type: 'create' | 'modify' | 'delete' | 'analyze';
  targetFiles: string[];
  estimatedTime: number;
  order: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'skipped';
  dependencies: string[];
  backup?: string; // backup content before modification
  diff?: {
    original: string;
    modified: string;
  };
}

export interface ProjectExecution {
  id: string;
  planId: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  currentStepId: string | null;
  progress: number; // 0-100
  startTime: number;
  endTime?: number;
  logs: ExecutionLog[];
  backups: ProjectBackup[];
}

export interface ExecutionLog {
  id: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  stepId?: string;
  details?: any;
}

export interface ProjectBackup {
  id: string;
  timestamp: number;
  description: string;
  files: { [path: string]: string }; // path -> content
  stepId: string;
}

export interface AgentState {
  currentTask: AgentTask | null;
  activeTasks: AgentTask[];
  completedTasks: AgentTask[];
  pendingModifications: CodeModification[];
  appliedModifications: CodeModification[];
  isProcessing: boolean;
  activeAgent: 'generator' | 'corrector' | 'reviewer' | 'planner' | null;
  contextAnalysis: any;
  projectFiles: FileItem[];
  selectedFile: FileItem | null;
  previewMode: boolean;
  collaborationMode: boolean;

  // Nuevas propiedades para gestión de proyectos
  currentProject: ProjectRepository | null;
  projectStructure: ProjectStructure | null;
  currentPlan: ProjectPlan | null;
  execution: ProjectExecution | null;
  isLoadingProject: boolean;
  projectManagementMode: boolean;

  // Nuevas propiedades para el flujo mejorado
  workflowPhase: 'initial' | 'planning' | 'approval' | 'executing' | 'continuous' | 'completed';
  hasCreatedFiles: boolean;
  continuousMode: boolean;
  autoExecutor: {
    isActive: boolean;
    currentTask: string | null;
    progress: number;
    logs: string[];
  };
}

const Agent: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet, isCodeModifierVisible, toggleCodeModifier } = useUI();

  const [agentState, setAgentState] = useState<AgentState>({
    currentTask: null,
    activeTasks: [],
    completedTasks: [],
    pendingModifications: [],
    appliedModifications: [],
    isProcessing: false,
    activeAgent: null,
    contextAnalysis: null,
    projectFiles: [],
    selectedFile: null,
    previewMode: false,
    collaborationMode: false,

    // Nuevas propiedades para gestión de proyectos
    currentProject: null,
    projectStructure: null,
    currentPlan: null,
    execution: null,
    isLoadingProject: false,
    projectManagementMode: false,

    // Nuevas propiedades para el flujo mejorado
    workflowPhase: 'initial',
    hasCreatedFiles: false,
    continuousMode: false,
    autoExecutor: {
      isActive: false,
      currentTask: null,
      progress: 0,
      logs: []
    }
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: generateUniqueId('welcome'),
      sender: 'ai-agent',
      content: '🤖 **Bienvenido al Sistema AGENT de CODESTORM con Editor Integrado**\n\nSoy tu asistente de desarrollo inteligente con flujo de trabajo avanzado:\n\n**Fase 1**: 📋 Elaboro un plan detallado basado en tus instrucciones\n**Fase 2**: ✅ Presento el plan para tu aprobación\n**Fase 3**: 🚀 Ejecuto automáticamente y creo archivos\n**Fase 4**: 📝 Editor integrado para revisar y editar código\n**Fase 5**: 🔄 Modo continuo para modificaciones incrementales\n\n💡 **El sistema inicia completamente vacío** - Los archivos se generarán automáticamente cuando ejecutes un plan.\n\n¡Describe tu proyecto y comenzaré a planificar!',
      timestamp: Date.now(),
      type: 'notification',
    },
  ]);

  const [activeTab, setActiveTab] = useState<'chat' | 'context' | 'preview' | 'collaboration' | 'project' | 'planner' | 'execution' | 'messenger' | 'autoexecutor' | 'editor'>('chat');
  const [selectedProjectFile, setSelectedProjectFile] = useState<ProjectStructure | null>(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [showEnhancedEditor, setShowEnhancedEditor] = useState(false);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [messengerContext, setMessengerContext] = useState<CodeModificationContext | null>(null);
  const [messengerConversation, setMessengerConversation] = useState<Array<{
    id: string;
    sender: 'user' | 'messenger';
    content: string;
    timestamp: number;
  }>>([]);
  const [executionService] = useState(() => new ExecutionService());
  const [currentExecutionStatus, setCurrentExecutionStatus] = useState<string>('');
  const [showHelpAssistant, setShowHelpAssistant] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  // Estados para el editor integrado
  const [editorFiles, setEditorFiles] = useState<FileItem[]>([]);
  const [activeEditorFile, setActiveEditorFile] = useState<FileItem | null>(null);
  const [editorMode, setEditorMode] = useState<'single' | 'split' | 'tabs'>('tabs');
  const [showGeneratedFiles, setShowGeneratedFiles] = useState(false);
  const [originalContent, setOriginalContent] = useState<{[path: string]: string}>({});

  // Estado para el modal de corrección de código
  const [showCodeCorrectionModal, setShowCodeCorrectionModal] = useState(false);
  const [selectedFileForCorrection, setSelectedFileForCorrection] = useState<ProjectStructure | null>(null);
  const [modifiedFiles, setModifiedFiles] = useState<Set<string>>(new Set());

  // El sistema inicia completamente vacío - sin archivos de demostración
  // Los archivos se generarán automáticamente cuando se ejecute un plan

  // Función para actualizar archivos del editor
  const updateEditorFiles = () => {
    // Guardar contenido original para comparación
    const newOriginalContent: {[path: string]: string} = {};
    agentState.projectFiles.forEach(file => {
      if (!originalContent[file.path]) {
        newOriginalContent[file.path] = file.content;
      }
    });

    setOriginalContent(prev => ({ ...prev, ...newOriginalContent }));
    setEditorFiles(agentState.projectFiles);

    // Seleccionar el primer archivo si no hay ninguno activo
    if (!activeEditorFile && agentState.projectFiles.length > 0) {
      setActiveEditorFile(agentState.projectFiles[0]);
    }
  };

  // Efecto para sincronizar archivos del editor con archivos del proyecto
  useEffect(() => {
    if (agentState.projectFiles.length > 0 && editorFiles.length === 0) {
      // Auto-cargar archivos en el editor cuando se crean por primera vez
      updateEditorFiles();
    } else if (agentState.projectFiles.length > editorFiles.length) {
      // Sincronizar cuando se agregan nuevos archivos
      updateEditorFiles();
    }
  }, [agentState.projectFiles.length, editorFiles.length, activeEditorFile]);

  // Efecto para mostrar notificación cuando se generan archivos
  useEffect(() => {
    if (showGeneratedFiles && agentState.projectFiles.length > 0) {
      const timer = setTimeout(() => {
        setShowGeneratedFiles(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showGeneratedFiles]);

  const addChatMessage = (message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  };

  const handleError = (error: any, stage: string) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error durante ${stage}:`, error);
    setErrorMessage(`Error en ${stage}: ${message}`);
    setShowError(true);
    addChatMessage({
      id: generateUniqueId('err'),
      sender: 'ai-agent',
      content: `❌ Error durante ${stage}: ${message}`,
      timestamp: Date.now(),
      type: 'error',
    });
  };

  // Funciones para el modal de corrección de código
  const handleCodeCorrection = (file: ProjectStructure) => {
    setSelectedFileForCorrection(file);
    setShowCodeCorrectionModal(true);

    // Agregar mensaje al chat
    addChatMessage({
      id: generateUniqueId('correction'),
      sender: 'ai-agent',
      content: `🧠 **Iniciando corrección de código**\n\nArchivo: \`${file.name}\`\nRuta: \`${file.path}\`\n\nAbriendo el sistema multi-agente para analizar y optimizar el código...`,
      timestamp: Date.now(),
      type: 'notification',
    });
  };

  const handleSaveFile = (filePath: string, content: string) => {
    // Actualizar el contenido del archivo en la estructura del proyecto
    const updateFileContent = (structure: ProjectStructure): ProjectStructure => {
      if (structure.path === filePath) {
        return {
          ...structure,
          content,
          lastModified: Date.now()
        };
      }

      if (structure.children) {
        return {
          ...structure,
          children: structure.children.map(updateFileContent)
        };
      }

      return structure;
    };

    if (agentState.projectStructure) {
      const updatedStructure = updateFileContent(agentState.projectStructure);
      setAgentState(prev => ({
        ...prev,
        projectStructure: updatedStructure
      }));
    }

    // Marcar archivo como modificado
    setModifiedFiles(prev => new Set(prev).add(filePath));

    // Agregar mensaje de éxito al chat
    addChatMessage({
      id: generateUniqueId('save'),
      sender: 'ai-agent',
      content: `✅ **Archivo guardado exitosamente**\n\nArchivo: \`${filePath}\`\nFecha: ${new Date().toLocaleString()}\n\nLos cambios han sido aplicados al proyecto.`,
      timestamp: Date.now(),
      type: 'success',
    });
  };

  const handleFileUpdate = (file: ProjectStructure) => {
    // Actualizar el archivo seleccionado si es el mismo
    if (selectedProjectFile?.id === file.id) {
      setSelectedProjectFile(file);
    }
  };

  const handleCloseCodeCorrectionModal = () => {
    setShowCodeCorrectionModal(false);
    setSelectedFileForCorrection(null);
  };

  // Inicializar reconocimiento de voz global para Agent
  useEffect(() => {
    console.log('Inicializando reconocimiento de voz en Agent...');
    import('../utils/voiceInitializer').then(({ initializeVoiceRecognition, cleanupVoiceRecognition }) => {
      initializeVoiceRecognition({
        onStormCommand: (command: string) => {
          console.log('Comando STORM recibido en Agent:', command);

          const lowerCommand = command.toLowerCase();

          // Comandos específicos para corrección de código
          if (lowerCommand.includes('corregir código') || lowerCommand.includes('corregir archivo')) {
            if (selectedProjectFile && selectedProjectFile.type === 'file') {
              handleCodeCorrection(selectedProjectFile);
              addChatMessage({
                id: generateUniqueId('voice'),
                sender: 'ai-agent',
                content: `🎤 **Comando de voz ejecutado**\n\nComando: "${command}"\nAcción: Abriendo corrector de código para ${selectedProjectFile.name}`,
                timestamp: Date.now(),
                type: 'notification',
              });
            } else {
              addChatMessage({
                id: generateUniqueId('voice'),
                sender: 'ai-agent',
                content: `🎤 **Comando de voz**\n\nComando: "${command}"\n⚠️ Selecciona un archivo de código primero para usar esta función.`,
                timestamp: Date.now(),
                type: 'warning',
              });
            }
          }
          // Comando para cambiar a la pestaña de proyecto
          else if (lowerCommand.includes('mostrar proyecto') || lowerCommand.includes('ver archivos')) {
            setActiveTab('project');
            addChatMessage({
              id: generateUniqueId('voice'),
              sender: 'ai-agent',
              content: `🎤 **Comando de voz ejecutado**\n\nComando: "${command}"\nAcción: Cambiando a vista de proyecto`,
              timestamp: Date.now(),
              type: 'notification',
            });
          }
          // Comando genérico
          else {
            addChatMessage({
              id: generateUniqueId('voice'),
              sender: 'user',
              content: `🎤 Comando de voz: ${command}`,
              timestamp: Date.now(),
              type: 'text',
            });
          }
        },
        enableDebug: true,
        autoStart: true
      });
    });

    return () => {
      import('../utils/voiceInitializer').then(({ cleanupVoiceRecognition }) => {
        cleanupVoiceRecognition();
      });
    };
  }, [selectedProjectFile]);

  // Función principal para procesar mensajes del usuario con flujo mejorado
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || agentState.isProcessing) return;

    // Añadir mensaje del usuario
    const userMessage: ChatMessage = {
      id: generateUniqueId('user'),
      sender: 'user',
      content: message,
      timestamp: Date.now(),
      type: 'text'
    };
    addChatMessage(userMessage);

    // Iniciar procesamiento
    setAgentState(prev => ({
      ...prev,
      isProcessing: true,
      activeAgent: 'planner'
    }));

    try {
      // Determinar la fase del flujo de trabajo
      switch (agentState.workflowPhase) {
        case 'initial':
          await handleInitialPlanning(message);
          break;
        case 'continuous':
          await handleContinuousModification(message);
          break;
        default:
          // Fallback al flujo original si es necesario
          await simulateAgentWorkflow(message);
      }
    } catch (error) {
      handleError(error, 'el procesamiento del mensaje');
    } finally {
      setAgentState(prev => ({
        ...prev,
        isProcessing: false,
        activeAgent: null
      }));
    }
  };

  // Nueva función para manejar la planificación inicial
  const handleInitialPlanning = async (instruction: string) => {
    setAgentState(prev => ({
      ...prev,
      workflowPhase: 'planning',
      activeAgent: 'planner'
    }));

    addChatMessage({
      id: generateUniqueId('planning-start'),
      sender: 'ai-agent',
      content: '🎯 **Fase 1: Planificación Detallada**\n\nAnalizando tus instrucciones y creando un plan de desarrollo completo...',
      timestamp: Date.now(),
      type: 'notification',
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Crear un plan detallado basado en las instrucciones
    const detailedPlan = await createDetailedPlan(instruction);

    setAgentState(prev => ({
      ...prev,
      currentPlan: detailedPlan,
      workflowPhase: 'approval'
    }));

    addChatMessage({
      id: generateUniqueId('plan-ready'),
      sender: 'ai-agent',
      content: `✅ **Plan Creado**\n\n**Título**: ${detailedPlan.title}\n**Pasos**: ${detailedPlan.steps.length}\n**Tiempo estimado**: ${Math.floor(detailedPlan.estimatedTime / 60)}h ${detailedPlan.estimatedTime % 60}m\n**Complejidad**: ${detailedPlan.complexity}\n\n🔍 **Revisa el plan en la pestaña "Planificador" y apruébalo para continuar.**`,
      timestamp: Date.now(),
      type: 'success',
    });

    // Cambiar automáticamente al tab del planificador
    setActiveTab('planner');
  };

  // Nueva función para manejar modificaciones continuas
  const handleContinuousModification = async (instruction: string) => {
    setAgentState(prev => ({
      ...prev,
      autoExecutor: {
        ...prev.autoExecutor,
        isActive: true,
        currentTask: instruction,
        progress: 0,
        logs: []
      }
    }));

    addChatMessage({
      id: generateUniqueId('continuous-start'),
      sender: 'ai-agent',
      content: '🔄 **Modo Continuo Activado**\n\nProcesando nueva instrucción para modificar archivos existentes...',
      timestamp: Date.now(),
      type: 'notification',
    });

    await executeIncrementalModification(instruction);
  };

  // Función para crear un plan detallado
  const createDetailedPlan = async (instruction: string): Promise<ProjectPlan> => {
    // Simular análisis inteligente de la instrucción
    await new Promise(resolve => setTimeout(resolve, 1500));

    const planSteps: PlanStep[] = [];
    let estimatedTime = 0;
    let complexity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    // Analizar la instrucción para determinar qué archivos crear/modificar
    const lowerInstruction = instruction.toLowerCase();
    const includesHTML = lowerInstruction.includes('html') || lowerInstruction.includes('página') || lowerInstruction.includes('sitio') || lowerInstruction.includes('web');

    if (lowerInstruction.includes('aplicación') || lowerInstruction.includes('app') || lowerInstruction.includes('proyecto')) {
      // Plan para una aplicación completa
      planSteps.push(
        {
          id: generateUniqueId('step'),
          title: 'Configuración inicial del proyecto',
          description: 'Crear estructura base y archivos de configuración',
          type: 'create',
          targetFiles: ['package.json', 'tsconfig.json', 'src/index.tsx'],
          estimatedTime: 15,
          order: 1,
          status: 'pending',
          dependencies: []
        },
        {
          id: generateUniqueId('step'),
          title: 'Componentes principales',
          description: 'Crear componentes React principales de la aplicación',
          type: 'create',
          targetFiles: ['src/App.tsx', 'src/components/Header.tsx', 'src/components/Footer.tsx'],
          estimatedTime: 30,
          order: 2,
          status: 'pending',
          dependencies: []
        },
        {
          id: generateUniqueId('step'),
          title: 'Estilos y diseño',
          description: 'Implementar estilos CSS y diseño responsivo',
          type: 'create',
          targetFiles: ['src/styles/main.css', 'src/styles/components.css'],
          estimatedTime: 25,
          order: 3,
          status: 'pending',
          dependencies: []
        },
        {
          id: generateUniqueId('step'),
          title: 'Funcionalidad específica',
          description: `Implementar la funcionalidad solicitada: ${instruction}`,
          type: 'create',
          targetFiles: ['src/pages/MainPage.tsx', 'src/utils/helpers.ts'],
          estimatedTime: 45,
          order: 4,
          status: 'pending',
          dependencies: []
        }
      );

      // Agregar paso de diseño HTML si se requiere
      if (includesHTML) {
        planSteps.push({
          id: generateUniqueId('step'),
          title: 'Diseño HTML con Agente de Diseño',
          description: `Crear páginas HTML profesionales usando el agente de diseño: ${instruction}`,
          type: 'create',
          targetFiles: ['public/index.html', 'public/about.html'],
          estimatedTime: 35,
          order: 5,
          status: 'pending',
          dependencies: []
        });
        estimatedTime += 35;
      }

      estimatedTime = includesHTML ? 150 : 115;
      complexity = 'high';
    } else if (lowerInstruction.includes('componente')) {
      // Plan para un componente específico
      planSteps.push(
        {
          id: generateUniqueId('step'),
          title: 'Crear componente base',
          description: `Crear el componente ${instruction}`,
          type: 'create',
          targetFiles: ['src/components/NewComponent.tsx'],
          estimatedTime: 20,
          order: 1,
          status: 'pending',
          dependencies: []
        },
        {
          id: generateUniqueId('step'),
          title: 'Estilos del componente',
          description: 'Agregar estilos CSS para el componente',
          type: 'create',
          targetFiles: ['src/styles/NewComponent.css'],
          estimatedTime: 15,
          order: 2,
          status: 'pending',
          dependencies: []
        }
      );
      estimatedTime = 35;
      complexity = 'low';
    } else if (includesHTML || lowerInstruction.includes('página') || lowerInstruction.includes('sitio')) {
      // Plan específico para páginas HTML con agente de diseño
      planSteps.push(
        {
          id: generateUniqueId('step'),
          title: 'Análisis de diseño',
          description: 'Analizar requerimientos de diseño y estructura',
          type: 'analyze',
          targetFiles: [],
          estimatedTime: 10,
          order: 1,
          status: 'pending',
          dependencies: []
        },
        {
          id: generateUniqueId('step'),
          title: 'Generación HTML con Agente de Diseño',
          description: `Crear páginas HTML profesionales: ${instruction}`,
          type: 'create',
          targetFiles: ['index.html', 'styles.css'],
          estimatedTime: 40,
          order: 2,
          status: 'pending',
          dependencies: []
        },
        {
          id: generateUniqueId('step'),
          title: 'Optimización y responsividad',
          description: 'Optimizar diseño para diferentes dispositivos',
          type: 'create',
          targetFiles: ['responsive.css', 'scripts.js'],
          estimatedTime: 25,
          order: 3,
          status: 'pending',
          dependencies: []
        }
      );
      estimatedTime = 75;
      complexity = 'medium';
    } else {
      // Plan genérico
      planSteps.push(
        {
          id: generateUniqueId('step'),
          title: 'Análisis de requerimientos',
          description: 'Analizar y planificar la implementación',
          type: 'analyze',
          targetFiles: [],
          estimatedTime: 10,
          order: 1,
          status: 'pending',
          dependencies: []
        },
        {
          id: generateUniqueId('step'),
          title: 'Implementación',
          description: `Implementar: ${instruction}`,
          type: 'create',
          targetFiles: ['src/implementation.tsx'],
          estimatedTime: 30,
          order: 2,
          status: 'pending',
          dependencies: []
        }
      );
      estimatedTime = 40;
      complexity = 'medium';
    }

    return {
      id: generateUniqueId('plan'),
      title: `Plan para: ${instruction}`,
      description: `Plan detallado para implementar "${instruction}"`,
      estimatedTime,
      complexity,
      steps: planSteps,
      risks: [
        'Posibles conflictos con código existente',
        'Dependencias externas pueden requerir instalación',
        'Tiempo de implementación puede variar según complejidad'
      ],
      dependencies: ['react', 'typescript'],
      createdAt: Date.now(),
      status: 'pending-approval'
    };
  };

  // Simular el flujo de trabajo de los agentes especializados
  const simulateAgentWorkflow = async (instruction: string) => {
    // Paso 1: Agente Revisor analiza el contexto
    addChatMessage({
      id: generateUniqueId('reviewer-start'),
      sender: 'ai-agent',
      content: '👁️ **Agente Revisor**: Analizando el contexto actual del proyecto...',
      timestamp: Date.now(),
      type: 'notification',
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Paso 2: Determinar qué tipo de modificación se necesita
    const isGenerationTask = instruction.toLowerCase().includes('crea') ||
                            instruction.toLowerCase().includes('añade') ||
                            instruction.toLowerCase().includes('nuevo');

    const isCorrectionTask = instruction.toLowerCase().includes('optimiza') ||
                            instruction.toLowerCase().includes('mejora') ||
                            instruction.toLowerCase().includes('corrige');

    if (isGenerationTask) {
      // Activar Agente Generador
      setAgentState(prev => ({ ...prev, activeAgent: 'generator' }));

      addChatMessage({
        id: generateUniqueId('generator-start'),
        sender: 'ai-agent',
        content: '🔧 **Agente Generador**: Creando nueva funcionalidad basada en tu solicitud...',
        timestamp: Date.now(),
        type: 'notification',
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generar modificación propuesta
      const newModification: CodeModification = {
        id: generateUniqueId('mod'),
        filePath: '/src/pages/Home.tsx',
        originalContent: agentState.projectFiles.find(f => f.path === '/src/pages/Home.tsx')?.content || '',
        proposedContent: generateNewCode(instruction),
        description: `Implementación de: ${instruction}`,
        agentType: 'generator',
        confidence: 0.89,
        timestamp: Date.now(),
        approved: false
      };

      setAgentState(prev => ({
        ...prev,
        pendingModifications: [...prev.pendingModifications, newModification]
      }));

      addChatMessage({
        id: generateUniqueId('generator-complete'),
        sender: 'ai-agent',
        content: '✅ **Agente Generador**: He creado una propuesta de implementación. Revisa los cambios en el panel de Preview.',
        timestamp: Date.now(),
        type: 'success',
      });

      // Trigger Messenger Agent
      const context: CodeModificationContext = {
        type: 'generate',
        description: instruction,
        filesAffected: [newModification.filePath],
        changes: [{
          file: newModification.filePath,
          originalContent: newModification.originalContent,
          modifiedContent: newModification.proposedContent,
          action: 'create'
        }],
        agentType: 'generator',
        confidence: newModification.confidence
      };
      setMessengerContext(context);

    } else if (isCorrectionTask) {
      // Activar Agente Corrector
      setAgentState(prev => ({ ...prev, activeAgent: 'corrector' }));

      addChatMessage({
        id: generateUniqueId('corrector-start'),
        sender: 'ai-agent',
        content: '🛡️ **Agente Corrector**: Analizando el código para optimizaciones...',
        timestamp: Date.now(),
        type: 'notification',
      });

      await new Promise(resolve => setTimeout(resolve, 2500));

      // Generar optimización propuesta
      const optimization: CodeModification = {
        id: generateUniqueId('opt'),
        filePath: '/src/pages/Home.tsx',
        originalContent: agentState.projectFiles.find(f => f.path === '/src/pages/Home.tsx')?.content || '',
        proposedContent: optimizeCode(instruction),
        description: `Optimización: ${instruction}`,
        agentType: 'corrector',
        confidence: 0.94,
        timestamp: Date.now(),
        approved: false
      };

      setAgentState(prev => ({
        ...prev,
        pendingModifications: [...prev.pendingModifications, optimization]
      }));

      addChatMessage({
        id: generateUniqueId('corrector-complete'),
        sender: 'ai-agent',
        content: '✅ **Agente Corrector**: He identificado optimizaciones. Los cambios están listos para revisión.',
        timestamp: Date.now(),
        type: 'success',
      });

      // Trigger Messenger Agent
      const context: CodeModificationContext = {
        type: 'correct',
        description: instruction,
        filesAffected: [optimization.filePath],
        changes: [{
          file: optimization.filePath,
          originalContent: optimization.originalContent,
          modifiedContent: optimization.proposedContent,
          action: 'modify'
        }],
        agentType: 'corrector',
        confidence: optimization.confidence
      };
      setMessengerContext(context);
    }

    // Paso 3: Agente Revisor valida los cambios
    setAgentState(prev => ({ ...prev, activeAgent: 'reviewer' }));

    addChatMessage({
      id: generateUniqueId('reviewer-validate'),
      sender: 'ai-agent',
      content: '👁️ **Agente Revisor**: Validando coherencia y calidad de los cambios propuestos...',
      timestamp: Date.now(),
      type: 'notification',
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    addChatMessage({
      id: generateUniqueId('workflow-complete'),
      sender: 'ai-agent',
      content: '🎯 **Sistema AGENT**: Análisis completado. Los cambios están listos para tu aprobación en el panel de Preview.',
      timestamp: Date.now(),
      type: 'success',
    });

    // Cambiar automáticamente al tab de preview
    setActiveTab('preview');
  };

  // Generar código nuevo basado en la instrucción
  const generateNewCode = (instruction: string): string => {
    // Simulación de generación de código
    if (instruction.toLowerCase().includes('validación')) {
      return `import React, { useState, useCallback } from 'react';

const Home: React.FC = () => {
  const [count, setCount] = useState(0);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = useCallback((email: string) => {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (value && !validateEmail(value)) {
      setEmailError('Por favor ingresa un email válido');
    } else {
      setEmailError('');
    }
  };

  const handleIncrement = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  return (
    <div className="home-container">
      <h1>Bienvenido a mi aplicación</h1>
      <p>Contador: {count}</p>
      <button onClick={handleIncrement}>
        Incrementar
      </button>

      <div className="email-section">
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="tu@email.com"
        />
        {emailError && <span className="error">{emailError}</span>}
      </div>
    </div>
  );
};

export default Home;`;
    }

    return agentState.projectFiles.find(f => f.path === '/src/pages/Home.tsx')?.content || '';
  };

  // Optimizar código existente
  const optimizeCode = (instruction: string): string => {
    return `import React, { useState, useCallback, useMemo } from 'react';

const Home: React.FC = () => {
  const [count, setCount] = useState(0);

  // Optimización: useCallback para evitar re-renders innecesarios
  const handleIncrement = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  // Optimización: useMemo para cálculos costosos
  const expensiveValue = useMemo(() => {
    return count * 2; // Simulación de cálculo costoso
  }, [count]);

  return (
    <div className="home-container">
      <h1>Bienvenido a mi aplicación</h1>
      <p>Contador: {count}</p>
      <p>Valor calculado: {expensiveValue}</p>
      <button onClick={handleIncrement}>
        Incrementar
      </button>
    </div>
  );
};

export default React.memo(Home);`;
  };

  // Manejar aprobación de modificaciones
  const handleApproveModification = (modificationId: string) => {
    setAgentState(prev => {
      const modification = prev.pendingModifications.find(m => m.id === modificationId);
      if (!modification) return prev;

      // Aplicar la modificación al archivo
      const updatedFiles = prev.projectFiles.map(file =>
        file.path === modification.filePath
          ? { ...file, content: modification.proposedContent }
          : file
      );

      // Mover la modificación a aplicadas
      const updatedPending = prev.pendingModifications.filter(m => m.id !== modificationId);
      const updatedApplied = [...prev.appliedModifications, { ...modification, approved: true }];

      return {
        ...prev,
        projectFiles: updatedFiles,
        pendingModifications: updatedPending,
        appliedModifications: updatedApplied
      };
    });

    addChatMessage({
      id: generateUniqueId('approved'),
      sender: 'ai-agent',
      content: '✅ Modificación aplicada exitosamente. El código ha sido actualizado.',
      timestamp: Date.now(),
      type: 'success',
    });
  };

  // Manejar rechazo de modificaciones
  const handleRejectModification = (modificationId: string) => {
    setAgentState(prev => ({
      ...prev,
      pendingModifications: prev.pendingModifications.filter(m => m.id !== modificationId)
    }));

    addChatMessage({
      id: generateUniqueId('rejected'),
      sender: 'ai-agent',
      content: '❌ Modificación rechazada. Puedes solicitar cambios alternativos.',
      timestamp: Date.now(),
      type: 'notification',
    });
  };

  // Funciones para gestión de proyectos
  const handleProjectLoad = async (project: ProjectRepository) => {
    setAgentState(prev => ({
      ...prev,
      isLoadingProject: true
    }));

    try {
      // Procesar la estructura del proyecto para extraer archivos
      const projectFiles = extractFilesFromStructure(project.structure);

      // Contar archivos reales (no directorios)
      const fileCount = countFiles(project.structure);

      setAgentState(prev => ({
        ...prev,
        currentProject: project,
        projectStructure: project.structure,
        projectFiles: projectFiles, // Actualizar también la lista de archivos del proyecto
        isLoadingProject: false,
        projectManagementMode: true
      }));

      addChatMessage({
        id: generateUniqueId('project-loaded'),
        sender: 'ai-agent',
        content: `✅ Proyecto "${project.name}" cargado exitosamente. ${fileCount} archivos detectados (${formatFileSize(project.size)}).`,
        timestamp: Date.now(),
        type: 'success',
      });

      // Cambiar automáticamente al tab de proyecto
      setActiveTab('project');

    } catch (error) {
      setAgentState(prev => ({
        ...prev,
        isLoadingProject: false
      }));

      handleError(error, 'la carga del proyecto');
    }
  };

  // Función auxiliar para extraer archivos de la estructura
  const extractFilesFromStructure = (structure: ProjectStructure): FileItem[] => {
    const files: FileItem[] = [];

    const extractFromNode = (node: ProjectStructure) => {
      if (node.type === 'file') {
        files.push({
          id: node.id,
          name: node.name,
          path: node.path,
          content: node.content || '',
          language: node.language || 'text',
          timestamp: node.lastModified || Date.now(),
          size: node.size,
          lastModified: node.lastModified
        });
      }

      if (node.children) {
        node.children.forEach(extractFromNode);
      }
    };

    extractFromNode(structure);
    return files;
  };

  // Función auxiliar para contar archivos
  const countFiles = (structure: ProjectStructure): number => {
    let count = 0;

    const countInNode = (node: ProjectStructure) => {
      if (node.type === 'file') {
        count++;
      }
      if (node.children) {
        node.children.forEach(countInNode);
      }
    };

    countInNode(structure);
    return count;
  };

  // Función auxiliar para formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (file: ProjectStructure) => {
    setSelectedProjectFile(file);
    if (file.type === 'file') {
      setShowEnhancedEditor(true);
    }
  };

  const handleFileSave = (content: string) => {
    if (selectedProjectFile) {
      // Update the file content in the project structure
      const updateFileContent = (node: ProjectStructure): ProjectStructure => {
        if (node.id === selectedProjectFile.id) {
          return { ...node, content };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(updateFileContent)
          };
        }
        return node;
      };

      if (agentState.projectStructure) {
        const updatedStructure = updateFileContent(agentState.projectStructure);
        setAgentState(prev => ({
          ...prev,
          projectStructure: updatedStructure
        }));
      }

      // Create messenger context for file save
      const context: CodeModificationContext = {
        type: 'correct',
        description: `File ${selectedProjectFile.name} has been manually edited`,
        filesAffected: [selectedProjectFile.path],
        changes: [{
          file: selectedProjectFile.path,
          originalContent: selectedProjectFile.content,
          modifiedContent: content,
          action: 'modify'
        }],
        agentType: 'user',
        confidence: 1.0
      };

      setMessengerContext(context);
      setActiveTab('messenger');

      addChatMessage({
        id: generateUniqueId('file-saved'),
        sender: 'ai-agent',
        content: `💾 File saved: ${selectedProjectFile.name}. The Messenger Agent will provide insights about your changes.`,
        timestamp: Date.now(),
        type: 'success',
      });
    }
  };

  const generateProjectPlan = async (instruction: string) => {
    setAgentState(prev => ({
      ...prev,
      activeAgent: 'planner',
      isProcessing: true
    }));

    addChatMessage({
      id: generateUniqueId('planner-start'),
      sender: 'ai-agent',
      content: '🎯 **Agente de Planificación**: Analizando el proyecto y creando plan detallado...',
      timestamp: Date.now(),
      type: 'notification',
    });

    try {
      // Simular análisis y creación del plan
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockPlan: ProjectPlan = {
        id: generateUniqueId('plan'),
        title: `Plan para: ${instruction}`,
        description: `Plan detallado para implementar "${instruction}" en el proyecto ${agentState.currentProject?.name}`,
        estimatedTime: Math.floor(Math.random() * 120) + 30, // 30-150 minutos
        complexity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
        steps: [
          {
            id: generateUniqueId('step'),
            title: 'Análisis de código existente',
            description: 'Revisar la estructura actual y identificar puntos de integración',
            type: 'analyze',
            targetFiles: ['/src/App.tsx', '/src/index.tsx'],
            estimatedTime: 15,
            order: 1,
            status: 'pending',
            dependencies: []
          },
          {
            id: generateUniqueId('step'),
            title: 'Crear nuevos componentes',
            description: 'Implementar los componentes necesarios para la funcionalidad',
            type: 'create',
            targetFiles: ['/src/components/NewComponent.tsx'],
            estimatedTime: 45,
            order: 2,
            status: 'pending',
            dependencies: []
          },
          {
            id: generateUniqueId('step'),
            title: 'Modificar archivos existentes',
            description: 'Actualizar componentes existentes para integrar la nueva funcionalidad',
            type: 'modify',
            targetFiles: ['/src/App.tsx'],
            estimatedTime: 30,
            order: 3,
            status: 'pending',
            dependencies: []
          }
        ],
        risks: [
          'Posibles conflictos con código existente',
          'Cambios pueden afectar funcionalidad actual',
          'Dependencias externas pueden requerir actualización'
        ],
        dependencies: ['react', 'typescript'],
        createdAt: Date.now(),
        status: 'pending-approval'
      };

      setAgentState(prev => ({
        ...prev,
        currentPlan: mockPlan,
        isProcessing: false,
        activeAgent: null
      }));

      addChatMessage({
        id: generateUniqueId('plan-created'),
        sender: 'ai-agent',
        content: `✅ **Plan creado**: ${mockPlan.steps.length} pasos identificados. Tiempo estimado: ${Math.floor(mockPlan.estimatedTime / 60)}h ${mockPlan.estimatedTime % 60}m. Revisa el plan en la pestaña "Planificador".`,
        timestamp: Date.now(),
        type: 'success',
      });

      // Cambiar al tab del planificador
      setActiveTab('planner');

    } catch (error) {
      setAgentState(prev => ({
        ...prev,
        isProcessing: false,
        activeAgent: null
      }));

      handleError(error, 'la creación del plan');
    }
  };

  // Messenger Agent handlers
  const handleMessengerResponse = (response: string) => {
    const messengerMessage = {
      id: generateUniqueId('messenger'),
      sender: 'messenger' as const,
      content: response,
      timestamp: Date.now()
    };

    setMessengerConversation(prev => [...prev, messengerMessage]);

    // Also add to main chat
    addChatMessage({
      id: generateUniqueId('messenger-chat'),
      sender: 'ai-agent',
      content: `🤖 **Messenger Agent**: ${response}`,
      timestamp: Date.now(),
      type: 'notification',
    });
  };


  // Función para ejecutar modificaciones incrementales
  const executeIncrementalModification = async (instruction: string) => {
    const updateProgress = (progress: number, message: string) => {
      setAgentState(prev => ({
        ...prev,
        autoExecutor: {
          ...prev.autoExecutor,
          progress,
          logs: [...prev.autoExecutor.logs, `${new Date().toLocaleTimeString()}: ${message}`]
        }
      }));
    };

    try {
      updateProgress(10, 'Analizando instrucción...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      updateProgress(30, 'Identificando archivos a modificar...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      updateProgress(50, 'Aplicando modificaciones...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular modificación de archivos existentes
      const modifiedFiles = agentState.projectFiles.map(file => {
        if (file.name.includes('.tsx') || file.name.includes('.ts')) {
          return {
            ...file,
            content: file.content + `\n\n// Modificación aplicada: ${instruction}\n// Timestamp: ${new Date().toISOString()}`,
            timestamp: Date.now()
          };
        }
        return file;
      });

      setAgentState(prev => ({
        ...prev,
        projectFiles: modifiedFiles
      }));

      updateProgress(80, 'Validando cambios...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      updateProgress(100, 'Modificación completada exitosamente');

      addChatMessage({
        id: generateUniqueId('incremental-complete'),
        sender: 'ai-agent',
        content: `✅ **Modificación Incremental Completada**\n\nInstrucción: "${instruction}"\nArchivos modificados: ${modifiedFiles.filter(f => f.name.includes('.tsx') || f.name.includes('.ts')).length}\n\n🔄 Puedes continuar enviando nuevas instrucciones para más modificaciones.`,
        timestamp: Date.now(),
        type: 'success',
      });

    } catch (error) {
      addChatMessage({
        id: generateUniqueId('incremental-error'),
        sender: 'ai-agent',
        content: `❌ Error durante la modificación incremental: ${error}`,
        timestamp: Date.now(),
        type: 'error',
      });
    } finally {
      setAgentState(prev => ({
        ...prev,
        autoExecutor: {
          ...prev.autoExecutor,
          isActive: false,
          currentTask: null
        }
      }));
    }
  };

  // Funciones mejoradas para manejo del plan
  const handleApprovePlan = async () => {
    if (!agentState.currentPlan) return;

    setAgentState(prev => ({
      ...prev,
      currentPlan: prev.currentPlan ? {
        ...prev.currentPlan,
        status: 'approved'
      } : null,
      workflowPhase: 'executing'
    }));

    addChatMessage({
      id: generateUniqueId('plan-approved'),
      sender: 'ai-agent',
      content: '✅ **Plan Aprobado** - Iniciando ejecución automática...',
      timestamp: Date.now(),
      type: 'success',
    });

    // Ejecutar automáticamente el plan aprobado
    await handleExecutePlan();
  };

  const handleRejectPlan = () => {
    setAgentState(prev => ({
      ...prev,
      currentPlan: null,
      workflowPhase: 'initial'
    }));

    addChatMessage({
      id: generateUniqueId('plan-rejected'),
      sender: 'ai-agent',
      content: '❌ **Plan Rechazado** - Puedes enviar nuevas instrucciones para crear un plan diferente.',
      timestamp: Date.now(),
      type: 'notification',
    });

    // Volver al tab de chat para nuevas instrucciones
    setActiveTab('chat');
  };

  const handleExecutePlan = async () => {
    if (!agentState.currentPlan) return;

    const execution: ProjectExecution = {
      id: generateUniqueId('execution'),
      planId: agentState.currentPlan.id,
      status: 'running',
      currentStepId: agentState.currentPlan.steps[0]?.id || null,
      progress: 0,
      startTime: Date.now(),
      logs: [],
      backups: []
    };

    setAgentState(prev => ({
      ...prev,
      execution: execution,
      currentPlan: prev.currentPlan ? {
        ...prev.currentPlan,
        status: 'executing'
      } : null
    }));

    addChatMessage({
      id: generateUniqueId('execution-start'),
      sender: 'ai-agent',
      content: '🚀 Iniciando ejecución del plan. Monitorea el progreso en la pestaña "Ejecución".',
      timestamp: Date.now(),
      type: 'notification',
    });

    // Cambiar al tab de ejecución
    setActiveTab('execution');

    // Simular ejecución de pasos
    simulateExecution(execution);
  };

  const simulateExecution = async (execution: ProjectExecution) => {
    if (!agentState.currentPlan) return;

    const steps = agentState.currentPlan.steps.sort((a, b) => a.order - b.order);

    // Setup execution callbacks
    const callbacks: ExecutionCallbacks = {
      onStatusUpdate: (status: string, level: 'info' | 'warning' | 'error' | 'success') => {
        setCurrentExecutionStatus(status);

        // Add status update to chat
        addChatMessage({
          id: generateUniqueId('status'),
          sender: 'ai-agent',
          content: `⚙️ **Execution Status**: ${status}`,
          timestamp: Date.now(),
          type: level === 'error' ? 'error' : 'notification',
        });
      },

      onStepComplete: (stepId: string, result: StepExecutionResult) => {
        // Update step status in plan
        setAgentState(prev => ({
          ...prev,
          currentPlan: prev.currentPlan ? {
            ...prev.currentPlan,
            steps: prev.currentPlan.steps.map(s =>
              s.id === stepId ? { ...s, status: 'completed' as const } : s
            )
          } : null
        }));

        // Add completion message to chat
        const step = steps.find(s => s.id === stepId);
        if (step) {
          addChatMessage({
            id: generateUniqueId('step-complete'),
            sender: 'ai-agent',
            content: `✅ **Step Completed**: ${step.title} - ${result.filesModified.length} files modified in ${Math.round(result.executionTime / 1000)}s`,
            timestamp: Date.now(),
            type: 'success',
          });

          // Add warnings if any
          if (result.warnings.length > 0) {
            addChatMessage({
              id: generateUniqueId('warnings'),
              sender: 'ai-agent',
              content: `⚠️ **Warnings**: ${result.warnings.join(', ')}`,
              timestamp: Date.now(),
              type: 'warning',
            });
          }
        }
      },

      onProgressUpdate: (progress: number) => {
        setAgentState(prev => ({
          ...prev,
          execution: prev.execution ? {
            ...prev.execution,
            progress: progress
          } : null
        }));
      },

      onLogAdd: (log: ExecutionLog) => {
        setAgentState(prev => ({
          ...prev,
          execution: prev.execution ? {
            ...prev.execution,
            logs: [...prev.execution.logs, log]
          } : null
        }));
      },

      onBackupCreate: (backup: ProjectBackup) => {
        setAgentState(prev => ({
          ...prev,
          execution: prev.execution ? {
            ...prev.execution,
            backups: [...prev.execution.backups, backup]
          } : null
        }));

        addChatMessage({
          id: generateUniqueId('backup'),
          sender: 'ai-agent',
          content: `💾 **Backup Created**: ${backup.description} (${Object.keys(backup.files).length} files)`,
          timestamp: Date.now(),
          type: 'notification',
        });
      },

      onMessengerTrigger: (context: CodeModificationContext) => {
        // Trigger Messenger Agent with automatic response
        setMessengerContext(context);

        // Add notification that Messenger Agent is analyzing
        addChatMessage({
          id: generateUniqueId('messenger-analyzing'),
          sender: 'ai-agent',
          content: `🤖 **Messenger Agent**: Analyzing step completion and preparing insights...`,
          timestamp: Date.now(),
          type: 'notification',
        });
      }
    };

    // Execute each step with realistic timing
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      // Update current step
      setAgentState(prev => ({
        ...prev,
        execution: prev.execution ? {
          ...prev.execution,
          currentStepId: step.id
        } : null
      }));

      // Update step status to in-progress
      setAgentState(prev => ({
        ...prev,
        currentPlan: prev.currentPlan ? {
          ...prev.currentPlan,
          steps: prev.currentPlan.steps.map(s =>
            s.id === step.id ? { ...s, status: 'in-progress' as const } : s
          )
        } : null
      }));

      addChatMessage({
        id: generateUniqueId('step-start'),
        sender: 'ai-agent',
        content: `🚀 **Starting Step ${i + 1}/${steps.length}**: ${step.title}`,
        timestamp: Date.now(),
        type: 'notification',
      });

      try {
        // Execute step with realistic timing and detailed progress
        const result = await executionService.executeStep(step, callbacks);

        // Update overall progress
        const overallProgress = Math.round(((i + 1) / steps.length) * 100);
        callbacks.onProgressUpdate(overallProgress);

      } catch (error) {
        // Handle step failure
        setAgentState(prev => ({
          ...prev,
          currentPlan: prev.currentPlan ? {
            ...prev.currentPlan,
            steps: prev.currentPlan.steps.map(s =>
              s.id === step.id ? { ...s, status: 'failed' as const } : s
            )
          } : null,
          execution: prev.execution ? {
            ...prev.execution,
            status: 'failed'
          } : null
        }));

        addChatMessage({
          id: generateUniqueId('step-failed'),
          sender: 'ai-agent',
          content: `❌ **Step Failed**: ${step.title} - ${error}`,
          timestamp: Date.now(),
          type: 'error',
        });
        return;
      }
    }

    // Finalize execution
    setAgentState(prev => ({
      ...prev,
      execution: prev.execution ? {
        ...prev.execution,
        status: 'completed',
        endTime: Date.now(),
        currentStepId: null
      } : null,
      currentPlan: prev.currentPlan ? {
        ...prev.currentPlan,
        status: 'completed'
      } : null
    }));

    setCurrentExecutionStatus('');

    // Crear archivos con integración del agente de diseño
    const createdFiles: FileItem[] = [];

    for (const step of steps) {
      for (const filePath of step.targetFiles) {
        const fileName = filePath.split('/').pop() || 'unknown';

        // Generar contenido usando el agente de diseño para archivos HTML
        const content = await generateFileContent(
          filePath,
          step.description,
          agentState.currentPlan?.title || step.description
        );

        createdFiles.push({
          id: generateUniqueId('file'),
          name: fileName,
          path: filePath,
          content,
          language: getLanguageFromPath(filePath),
          timestamp: Date.now()
        });

        // Agregar mensaje específico según el método de generación
        if (fileName.endsWith('.html')) {
          // Verificar si el contenido incluye "CODESTORM Agent" (fallback) o es del agente de diseño
          if (content.includes('sistema de fallback avanzado')) {
            addChatMessage({
              id: generateUniqueId('fallback-html-used'),
              sender: 'ai-agent',
              content: `⚠️ **Sistema de Fallback Activado** - Archivo HTML "${fileName}" generado con plantilla avanzada (API no disponible).`,
              timestamp: Date.now(),
              type: 'warning',
            });
          } else {
            addChatMessage({
              id: generateUniqueId('design-agent-used'),
              sender: 'ai-agent',
              content: `🎨 **Agente de Diseño Activado** - Archivo HTML "${fileName}" generado con diseño profesional.`,
              timestamp: Date.now(),
              type: 'success',
            });
          }
        }
      }
    }

    // Actualizar el estado con los archivos creados
    setAgentState(prev => ({
      ...prev,
      projectFiles: [...prev.projectFiles, ...createdFiles],
      hasCreatedFiles: true,
      workflowPhase: 'continuous',
      continuousMode: true
    }));

    addChatMessage({
      id: generateUniqueId('execution-complete'),
      sender: 'ai-agent',
      content: `🎉 **Ejecución Completada Exitosamente!**\n\n✅ ${steps.length} pasos ejecutados\n📁 ${createdFiles.length} archivos creados\n\n🔄 **Modo Continuo Activado**: Ahora puedes enviar nuevas instrucciones para modificar los archivos creados sin necesidad de recargar la página.`,
      timestamp: Date.now(),
      type: 'success',
    });

    // Cambiar al tab de chat para el modo continuo
    setActiveTab('chat');

    // Trigger final Messenger Agent summary
    const finalContext: CodeModificationContext = {
      type: 'plan',
      description: `Complete execution of plan: ${agentState.currentPlan.title}`,
      filesAffected: steps.flatMap(s => s.targetFiles),
      changes: steps.flatMap(s => s.targetFiles.map(file => ({
        file,
        action: s.type as 'create' | 'modify' | 'delete'
      }))),
      agentType: 'planner',
      confidence: 0.98
    };
    setMessengerContext(finalContext);

    // Actualizar archivos del editor y mostrar automáticamente
    updateEditorFiles();
    setShowGeneratedFiles(true);

    // Cambiar automáticamente al editor para revisar archivos
    setTimeout(() => {
      setActiveTab('editor');
      addChatMessage({
        id: generateUniqueId('review-files'),
        sender: 'ai-agent',
        content: `📝 **Archivos listos para revisión**\n\nSe han creado ${createdFiles.length} archivos. Puedes revisarlos en la pestaña "Editor" antes de continuar con nuevas modificaciones.`,
        timestamp: Date.now(),
        type: 'notification',
      });
    }, 2000);
  };



  // Funciones para el editor integrado
  const handleEditorFileSelect = (file: FileItem) => {
    setActiveEditorFile(file);
  };

  const handleEditorFileSave = async (file: FileItem, content: string) => {
    // Actualizar el contenido del archivo en el estado
    const updatedFiles = agentState.projectFiles.map(f =>
      f.id === file.id ? { ...f, content, timestamp: Date.now() } : f
    );

    setAgentState(prev => ({
      ...prev,
      projectFiles: updatedFiles
    }));

    // Actualizar también en editorFiles
    setEditorFiles(updatedFiles);
    setActiveEditorFile({ ...file, content, timestamp: Date.now() });

    // Marcar archivo como modificado
    setModifiedFiles(prev => new Set(prev).add(file.path));

    // Agregar mensaje de éxito
    addChatMessage({
      id: generateUniqueId('file-saved'),
      sender: 'ai-agent',
      content: `💾 **Archivo guardado**: ${file.name}\n\nLos cambios han sido aplicados al proyecto.`,
      timestamp: Date.now(),
      type: 'success',
    });

    // Trigger Messenger Agent para análisis de cambios
    const context: CodeModificationContext = {
      type: 'correct',
      description: `Archivo ${file.name} editado manualmente`,
      filesAffected: [file.path],
      changes: [{
        file: file.path,
        originalContent: originalContent[file.path] || '',
        modifiedContent: content,
        action: 'modify'
      }],
      agentType: 'user',
      confidence: 1.0
    };
    setMessengerContext(context);
  };

  const handleEditorFileClose = (file: FileItem) => {
    const remainingFiles = editorFiles.filter(f => f.id !== file.id);
    setEditorFiles(remainingFiles);

    if (activeEditorFile?.id === file.id) {
      setActiveEditorFile(remainingFiles.length > 0 ? remainingFiles[0] : null);
    }
  };

  const handleRefreshEditorFiles = () => {
    updateEditorFiles();
    addChatMessage({
      id: generateUniqueId('files-refreshed'),
      sender: 'ai-agent',
      content: '🔄 **Archivos actualizados** en el editor.',
      timestamp: Date.now(),
      type: 'notification',
    });
  };

  // Función auxiliar para generar contenido de archivos con integración del agente de diseño
  const generateFileContent = async (filePath: string, description: string, instruction?: string): Promise<string> => {
    const fileName = filePath.split('/').pop() || '';

    // Si es un archivo HTML, usar el agente de diseño con fallback robusto
    if (fileName.endsWith('.html')) {
      try {
        console.log('🎨 Intentando usar agente de diseño para archivo HTML:', fileName);

        const designTask = {
          id: generateUniqueId('design-task'),
          type: 'designArchitect' as const,
          instruction: instruction || description,
          priority: 'high' as const,
          status: 'pending' as const,
          createdAt: Date.now(),
          estimatedTime: 15
        };

        const designResult = await DesignArchitectAgent.execute(designTask);

        if (designResult.success && designResult.data?.files) {
          // Buscar el archivo HTML generado por el agente de diseño
          const htmlFile = designResult.data.files.find(file => file.name.endsWith('.html'));
          if (htmlFile) {
            console.log('✅ Archivo HTML generado por agente de diseño');
            return htmlFile.content;
          }
        }

        console.log('⚠️ Agente de diseño no devolvió archivos, usando fallback avanzado');
      } catch (error) {
        console.error('❌ Error en agente de diseño (posible cuota excedida), usando fallback:', error);

        // Verificar si es un error de cuota específicamente
        if (error instanceof Error && error.message.includes('quota')) {
          console.log('🚫 Cuota de API excedida, generando HTML con plantilla avanzada');
        }
      }

      // Fallback: HTML específico según el tipo de proyecto
      return generateSpecificHTML(fileName, instruction || description, description);

    }

    if (fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) {
      return `import React from 'react';

interface ${fileName.replace(/\.(tsx|jsx)$/, '')}Props {
  // Props interface
}

const ${fileName.replace(/\.(tsx|jsx)$/, '')}: React.FC<${fileName.replace(/\.(tsx|jsx)$/, '')}Props> = () => {
  return (
    <div className="${fileName.replace(/\.(tsx|jsx)$/, '').toLowerCase()}-container">
      <h1>${description}</h1>
      <p>Este componente fue generado automáticamente por CODESTORM Agent.</p>
    </div>
  );
};

export default ${fileName.replace(/\.(tsx|jsx)$/, '')};`;
    }

    if (fileName.endsWith('.ts')) {
      return `// ${description}
// Generado automáticamente por CODESTORM Agent

export interface ${fileName.replace('.ts', '')}Interface {
  // Interface definition
}

export class ${fileName.replace('.ts', '')} {
  constructor() {
    // Constructor implementation
  }

  // Methods implementation
}

export default ${fileName.replace('.ts', '')};`;
    }

    if (fileName.endsWith('.css')) {
      return `/* ${description} */
/* Generado automáticamente por CODESTORM Agent */

.${fileName.replace('.css', '')}-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.${fileName.replace('.css', '')}-container h1 {
  color: #333;
  margin-bottom: 1rem;
}

.${fileName.replace('.css', '')}-container p {
  color: #666;
  line-height: 1.6;
}`;
    }

    if (fileName === 'package.json') {
      return `{
  "name": "codestorm-generated-project",
  "version": "1.0.0",
  "description": "${description}",
  "main": "src/index.tsx",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^4.9.5"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  }
}`;
    }

    if (fileName === 'tsconfig.json') {
      return `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}`;
    }

    return `// ${description}
// Generado automáticamente por CODESTORM Agent
// Archivo: ${filePath}

console.log('Archivo generado: ${fileName}');`;
  };

  // Función auxiliar para generar HTML específico según el tipo de proyecto
  const generateSpecificHTML = (fileName: string, instruction: string, description: string): string => {
    const pageTitle = fileName.replace('.html', '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const lowerInstruction = instruction.toLowerCase();

    // Detectar el tipo de página/sitio
    if (lowerInstruction.includes('restaurante') || lowerInstruction.includes('comida')) {
      return generateRestaurantHTML(pageTitle, instruction);
    } else if (lowerInstruction.includes('empresa') || lowerInstruction.includes('corporativo') || lowerInstruction.includes('negocio')) {
      return generateBusinessHTML(pageTitle, instruction);
    } else if (lowerInstruction.includes('portfolio') || lowerInstruction.includes('portafolio')) {
      return generatePortfolioHTML(pageTitle, instruction);
    } else if (lowerInstruction.includes('tienda') || lowerInstruction.includes('ecommerce') || lowerInstruction.includes('shop')) {
      return generateEcommerceHTML(pageTitle, instruction);
    } else if (lowerInstruction.includes('blog') || lowerInstruction.includes('noticias')) {
      return generateBlogHTML(pageTitle, instruction);
    } else {
      return generateGenericHTML(pageTitle, instruction, description);
    }
  };

  // Función para generar HTML de restaurante
  const generateRestaurantHTML = (title: string, instruction: string): string => {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Restaurante</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
  <style>
    :root {
      --primary-color: #d97706;
      --secondary-color: #92400e;
      --accent-color: #fbbf24;
      --background-dark: #1f2937;
      --text-primary: #111827;
      --text-light: #6b7280;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      line-height: 1.6;
      color: var(--text-primary);
    }

    .hero {
      background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"><rect fill="%23d97706" width="1200" height="600"/><circle fill="%23fbbf24" cx="300" cy="150" r="50" opacity="0.3"/><circle fill="%23fbbf24" cx="900" cy="450" r="80" opacity="0.2"/></svg>');
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: white;
    }

    .hero h1 {
      font-family: 'Playfair Display', serif;
      font-size: 4rem;
      margin-bottom: 1rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    }

    .hero p {
      font-size: 1.5rem;
      margin-bottom: 2rem;
      max-width: 600px;
    }

    .cta-button {
      background: var(--accent-color);
      color: var(--background-dark);
      padding: 1rem 2rem;
      border: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 1.1rem;
      cursor: pointer;
      transition: transform 0.3s ease;
    }

    .cta-button:hover {
      transform: translateY(-3px);
    }

    .menu-section {
      padding: 4rem 2rem;
      background: #f9fafb;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .section-title {
      font-family: 'Playfair Display', serif;
      font-size: 3rem;
      text-align: center;
      margin-bottom: 3rem;
      color: var(--primary-color);
    }

    .menu-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .menu-item {
      background: white;
      padding: 2rem;
      border-radius: 15px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      transition: transform 0.3s ease;
    }

    .menu-item:hover {
      transform: translateY(-5px);
    }

    .codestorm-badge {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--primary-color);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.8rem;
      z-index: 1000;
    }
  </style>
</head>
<body>
  <section class="hero">
    <div>
      <h1>${title}</h1>
      <p>Experiencia culinaria excepcional</p>
      <p>${instruction}</p>
      <button class="cta-button">
        <i class="fas fa-utensils"></i> Ver Menú
      </button>
    </div>
  </section>

  <section class="menu-section">
    <div class="container">
      <h2 class="section-title">Nuestro Menú</h2>
      <div class="menu-grid">
        <div class="menu-item">
          <h3><i class="fas fa-leaf"></i> Entradas</h3>
          <p>Deliciosas opciones para comenzar tu experiencia gastronómica.</p>
        </div>
        <div class="menu-item">
          <h3><i class="fas fa-drumstick-bite"></i> Platos Principales</h3>
          <p>Especialidades de la casa preparadas con ingredientes frescos.</p>
        </div>
        <div class="menu-item">
          <h3><i class="fas fa-ice-cream"></i> Postres</h3>
          <p>Dulces tentaciones para cerrar con broche de oro.</p>
        </div>
      </div>
    </div>
  </section>

  <div class="codestorm-badge">
    <i class="fas fa-magic"></i> CODESTORM
  </div>

  <script>
    console.log('🍽️ Restaurante generado por CODESTORM');
  </script>
</body>
</html>`;
  };

  // Función para generar HTML de empresa
  const generateBusinessHTML = (title: string, instruction: string): string => {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Empresa</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
  <style>
    :root {
      --primary-color: #1e40af;
      --secondary-color: #3b82f6;
      --accent-color: #60a5fa;
      --background: #f8fafc;
      --text-primary: #1e293b;
      --text-secondary: #64748b;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      line-height: 1.6;
      color: var(--text-primary);
      background: var(--background);
    }

    .navbar {
      background: white;
      padding: 1rem 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .hero {
      padding: 8rem 2rem 4rem;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
      color: white;
      text-align: center;
    }

    .hero h1 {
      font-size: 3.5rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
    }

    .hero p {
      font-size: 1.25rem;
      margin-bottom: 2rem;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .services {
      padding: 4rem 2rem;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 3rem;
    }

    .service-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      text-align: center;
      transition: transform 0.3s ease;
    }

    .service-card:hover {
      transform: translateY(-5px);
    }

    .service-icon {
      font-size: 3rem;
      color: var(--primary-color);
      margin-bottom: 1rem;
    }

    .codestorm-badge {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--primary-color);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.8rem;
      z-index: 1000;
    }
  </style>
</head>
<body>
  <nav class="navbar">
    <div class="nav-container">
      <div class="logo">
        <i class="fas fa-building"></i> ${title}
      </div>
    </div>
  </nav>

  <section class="hero">
    <div class="container">
      <h1>${title}</h1>
      <p>${instruction}</p>
      <p>Soluciones empresariales innovadoras para el futuro</p>
    </div>
  </section>

  <section class="services">
    <div class="container">
      <h2 style="text-align: center; font-size: 2.5rem; margin-bottom: 1rem;">Nuestros Servicios</h2>
      <div class="services-grid">
        <div class="service-card">
          <div class="service-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <h3>Consultoría</h3>
          <p>Asesoramiento estratégico para el crecimiento de su empresa.</p>
        </div>
        <div class="service-card">
          <div class="service-icon">
            <i class="fas fa-cogs"></i>
          </div>
          <h3>Tecnología</h3>
          <p>Soluciones tecnológicas avanzadas y personalizadas.</p>
        </div>
        <div class="service-card">
          <div class="service-icon">
            <i class="fas fa-users"></i>
          </div>
          <h3>Recursos Humanos</h3>
          <p>Gestión integral del talento humano en su organización.</p>
        </div>
      </div>
    </div>
  </section>

  <div class="codestorm-badge">
    <i class="fas fa-magic"></i> CODESTORM
  </div>

  <script>
    console.log('🏢 Sitio empresarial generado por CODESTORM');
  </script>
</body>
</html>`;
  };

  // Función para generar HTML genérico (fallback mejorado)
  const generateGenericHTML = (title: string, instruction: string, description: string): string => {
    // Usar el HTML avanzado que ya definimos anteriormente
    return generateFileContent(title + '.html', description, instruction);
  };

  // Función auxiliar para detectar el lenguaje del archivo
  const getLanguageFromPath = (filePath: string): string => {
    const extension = filePath.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'tsx':
      case 'jsx':
        return 'typescript';
      case 'ts':
        return 'typescript';
      case 'js':
        return 'javascript';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'text';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-codestorm-darker">
      <Header
        showConstructorButton={false}
        onPreviewClick={() => {}}
        onChatClick={() => {}}
      />
      <main className="container flex-1 px-4 py-4 mx-auto">
        {/* Título y descripción */}
        <div className="p-6 mb-6 rounded-lg shadow-md bg-codestorm-dark">
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white mb-4 flex items-center`}>
            <Bot className="w-8 h-8 mr-3 text-codestorm-accent" />
            Sistema AGENT - Desarrollo Inteligente
          </h1>
          <p className="mb-2 text-gray-300">
            Asistente de desarrollo con IA que modifica código en tiempo real mediante lenguaje natural.
          </p>
          
          {/* Indicadores de estado del flujo de trabajo */}
          {agentState.isProcessing && (
            <div className="flex items-center p-3 mb-4 border rounded-md bg-codestorm-blue/10 border-codestorm-blue/30">
              <Activity className="w-5 h-5 mr-2 text-codestorm-accent animate-spin" />
              <div className="flex-1">
                <p className="text-sm text-white">
                  Agente {agentState.activeAgent} procesando...
                </p>
                <p className="text-xs text-gray-400">
                  Fase: {agentState.workflowPhase === 'planning' ? 'Planificación' :
                         agentState.workflowPhase === 'approval' ? 'Esperando aprobación' :
                         agentState.workflowPhase === 'executing' ? 'Ejecutando plan' :
                         agentState.workflowPhase === 'continuous' ? 'Modo continuo' : 'Inicial'}
                </p>
              </div>
            </div>
          )}

          {/* Indicador del ejecutor automático */}
          {agentState.autoExecutor.isActive && (
            <div className="p-3 mb-4 border rounded-md bg-green-500/10 border-green-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-green-400 animate-pulse" />
                  <p className="text-sm text-white font-medium">Ejecutor Automático Activo</p>
                </div>
                <span className="text-xs text-green-400">{agentState.autoExecutor.progress}%</span>
              </div>
              <div className="w-full bg-codestorm-darker rounded-full h-2 mb-2">
                <div
                  className="bg-green-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${agentState.autoExecutor.progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400">
                Tarea: {agentState.autoExecutor.currentTask}
              </p>
            </div>
          )}

          {/* Indicador de modo continuo */}
          {agentState.continuousMode && !agentState.isProcessing && (
            <div className="flex items-center p-3 mb-4 border rounded-md bg-purple-500/10 border-purple-500/30">
              <RotateCcw className="w-5 h-5 mr-2 text-purple-400" />
              <div className="flex-1">
                <p className="text-sm text-white font-medium">Modo Continuo Activado</p>
                <p className="text-xs text-gray-400">
                  Archivos creados: {agentState.projectFiles.length} | Puedes enviar nuevas instrucciones
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Barra de estado de agentes */}
        <AgentStatusBar 
          agentState={agentState}
          onAgentSelect={(agent) => setAgentState(prev => ({ ...prev, activeAgent: agent }))}
        />

        {/* Layout principal */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-12 gap-6'}`}>
          {/* Columna Izquierda - Chat y Controles */}
          <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-5' : 'col-span-4'}`}>
            <div className="space-y-4">
              {/* Tabs de navegación */}
              <div className="flex border-b border-codestorm-blue/30 overflow-x-auto">
                <button
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'chat' ? 'text-codestorm-accent border-b-2 border-codestorm-accent' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setActiveTab('chat')}
                >
                  <Bot className="inline-block w-4 h-4 mr-2" />
                  Chat
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'project' ? 'text-codestorm-accent border-b-2 border-codestorm-accent' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setActiveTab('project')}
                >
                  <FolderOpen className="inline-block w-4 h-4 mr-2" />
                  Proyecto
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'context' ? 'text-codestorm-accent border-b-2 border-codestorm-accent' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setActiveTab('context')}
                >
                  <Brain className="inline-block w-4 h-4 mr-2" />
                  Contexto
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'messenger' ? 'text-codestorm-accent border-b-2 border-codestorm-accent' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setActiveTab('messenger')}
                >
                  <MessageSquare className="inline-block w-4 h-4 mr-2" />
                  Messenger
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'autoexecutor' ? 'text-codestorm-accent border-b-2 border-codestorm-accent' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setActiveTab('autoexecutor')}
                >
                  <Zap className="inline-block w-4 h-4 mr-2" />
                  Auto Executor
                  {agentState.autoExecutor.isActive && (
                    <span className="ml-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  )}
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'editor' ? 'text-codestorm-accent border-b-2 border-codestorm-accent' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setActiveTab('editor')}
                >
                  <Code className="inline-block w-4 h-4 mr-2" />
                  Editor
                  {editorFiles.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-codestorm-accent text-xs rounded-full">
                      {editorFiles.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Contenido de las tabs */}
              {activeTab === 'chat' && (
                <CollapsiblePanel
                  title={`Chat Inteligente ${agentState.continuousMode ? '(Modo Continuo)' : ''}`}
                  type="terminal"
                  isVisible={true}
                  showCollapseButton={false}
                >
                  <div className={`${isMobile ? 'h-[calc(100vh - 500px)]' : 'h-[calc(100vh - 300px)]'} relative`}>
                    {/* Indicador de modo continuo en el chat */}
                    {agentState.continuousMode && !agentState.isProcessing && (
                      <div className="absolute top-0 left-0 right-0 z-10 p-2 bg-purple-500/20 border-b border-purple-500/30">
                        <div className="flex items-center text-sm text-purple-300">
                          <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                          <span>Modo continuo activo - Envía nuevas instrucciones para modificar archivos</span>
                        </div>
                      </div>
                    )}
                    <div className={agentState.continuousMode && !agentState.isProcessing ? 'pt-10' : ''}>
                      <AgentChat
                        messages={chatMessages}
                        onSendMessage={handleSendMessage}
                        isProcessing={agentState.isProcessing}
                        agentState={agentState}
                      />
                    </div>
                  </div>
                </CollapsiblePanel>
              )}

              {activeTab === 'project' && (
                <div className="space-y-4">
                  {!agentState.currentProject ? (
                    <ProjectLoader
                      onProjectLoad={handleProjectLoad}
                      isLoading={agentState.isLoadingProject}
                    />
                  ) : (
                    <EnhancedFileTree
                      structure={agentState.projectStructure}
                      onFileSelect={handleFileSelect}
                      selectedFile={selectedProjectFile}
                      onCodeCorrection={handleCodeCorrection}
                      onRefresh={() => {
                        addChatMessage({
                          id: generateUniqueId('refresh'),
                          sender: 'ai-agent',
                          content: '🔄 Refreshing project structure...',
                          timestamp: Date.now(),
                          type: 'notification',
                        });
                      }}
                    />
                  )}
                </div>
              )}

              {activeTab === 'messenger' && (
                <CollapsiblePanel
                  title="Messenger Agent"
                  type="terminal"
                  isVisible={true}
                  showCollapseButton={false}
                >
                  <div className={`${isMobile ? 'h-[calc(100vh - 500px)]' : 'h-[calc(100vh - 300px)]'} relative`}>
                    <MessengerAgent
                      isActive={!!messengerContext}
                      context={messengerContext}
                      onResponse={handleMessengerResponse}
                      conversationHistory={messengerConversation}
                    />
                  </div>
                </CollapsiblePanel>
              )}

              {activeTab === 'autoexecutor' && (
                <CollapsiblePanel
                  title="Ejecutor Automático"
                  type="terminal"
                  isVisible={true}
                  showCollapseButton={false}
                >
                  <div className={`${isMobile ? 'h-[calc(100vh - 500px)]' : 'h-[calc(100vh - 300px)]'} relative`}>
                    <div className="p-4 space-y-4">
                      {/* Estado del ejecutor */}
                      <div className="p-4 bg-codestorm-darker rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-white flex items-center">
                            <Zap className="w-5 h-5 mr-2 text-codestorm-accent" />
                            Estado del Ejecutor
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            agentState.autoExecutor.isActive
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            {agentState.autoExecutor.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>

                        {agentState.autoExecutor.currentTask && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-400 mb-1">Tarea Actual:</p>
                            <p className="text-white">{agentState.autoExecutor.currentTask}</p>
                          </div>
                        )}

                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                            <span>Progreso</span>
                            <span>{agentState.autoExecutor.progress}%</span>
                          </div>
                          <div className="w-full bg-codestorm-dark rounded-full h-2">
                            <div
                              className="bg-codestorm-accent h-2 rounded-full transition-all duration-300"
                              style={{ width: `${agentState.autoExecutor.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Fase del Flujo:</p>
                            <p className="text-white capitalize">{agentState.workflowPhase}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Archivos Creados:</p>
                            <p className="text-white">{agentState.projectFiles.length}</p>
                          </div>
                        </div>
                      </div>

                      {/* Logs del ejecutor */}
                      <div className="p-4 bg-codestorm-darker rounded-lg">
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                          <FileText className="w-5 h-5 mr-2 text-codestorm-accent" />
                          Logs de Ejecución
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {agentState.autoExecutor.logs.length > 0 ? (
                            agentState.autoExecutor.logs.map((log, index) => (
                              <div key={index} className="p-2 bg-codestorm-dark rounded text-sm">
                                <span className="text-gray-400">{log}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-400 text-sm">No hay logs disponibles</p>
                          )}
                        </div>
                      </div>

                      {/* Controles del modo continuo */}
                      {agentState.continuousMode && (
                        <div className="p-4 bg-codestorm-darker rounded-lg">
                          <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                            <RotateCcw className="w-5 h-5 mr-2 text-purple-400" />
                            Modo Continuo
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Estado:</span>
                              <span className="text-green-400">Activado</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Archivos en proyecto:</span>
                              <span className="text-white">{agentState.projectFiles.length}</span>
                            </div>
                            <p className="text-sm text-gray-400 mt-3">
                              El modo continuo está activo. Puedes enviar nuevas instrucciones en el chat
                              para modificar los archivos existentes sin necesidad de recargar la página.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsiblePanel>
              )}

              {activeTab === 'editor' && (
                <CollapsiblePanel
                  title="Editor de Código Integrado"
                  type="terminal"
                  isVisible={true}
                  showCollapseButton={false}
                >
                  <div className={`${isMobile ? 'h-[calc(100vh - 500px)]' : 'h-[calc(100vh - 300px)]'} relative`}>
                    {editorFiles.length > 0 ? (
                      <div className="h-full flex">
                        {/* File Explorer Sidebar */}
                        <div className="w-80 border-r border-codestorm-blue/30">
                          <FileExplorer
                            files={editorFiles}
                            activeFile={activeEditorFile}
                            onFileSelect={handleEditorFileSelect}
                            onFileClose={handleEditorFileClose}
                            onRefreshFiles={handleRefreshEditorFiles}
                            showOriginalComparison={true}
                            originalContent={originalContent}
                            mode={editorMode}
                          />
                        </div>

                        {/* Code Editor */}
                        <div className="flex-1">
                          <IntegratedCodeEditor
                            files={editorFiles}
                            activeFile={activeEditorFile}
                            onFileSelect={handleEditorFileSelect}
                            onFileSave={handleEditorFileSave}
                            onFileClose={handleEditorFileClose}
                            mode={editorMode}
                            onModeChange={setEditorMode}
                            showOriginalComparison={true}
                            originalContent={originalContent}
                            onRefreshFiles={handleRefreshEditorFiles}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center p-8">
                          <Code className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-lg font-semibold text-white mb-2">No hay archivos para editar</h3>
                          <p className="text-gray-400 mb-4">
                            {agentState.workflowPhase === 'initial'
                              ? 'Crea un plan y ejecútalo para generar archivos que puedas editar'
                              : agentState.workflowPhase === 'continuous'
                              ? 'Los archivos del proyecto aparecerán aquí automáticamente'
                              : 'Los archivos generados aparecerán aquí una vez completada la ejecución'
                            }
                          </p>
                          <div className="space-y-2">
                            {agentState.workflowPhase === 'initial' && (
                              <button
                                onClick={() => setActiveTab('chat')}
                                className="px-4 py-2 bg-codestorm-accent text-white rounded hover:bg-codestorm-accent/80 transition-colors"
                              >
                                Ir al Chat para crear un plan
                              </button>
                            )}
                            {agentState.projectFiles.length > 0 && (
                              <button
                                onClick={() => {
                                  updateEditorFiles();
                                  addChatMessage({
                                    id: generateUniqueId('load-files'),
                                    sender: 'ai-agent',
                                    content: `📁 **Archivos cargados** en el editor: ${agentState.projectFiles.length} archivos disponibles.`,
                                    timestamp: Date.now(),
                                    type: 'success',
                                  });
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                              >
                                Cargar archivos del proyecto
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsiblePanel>
              )}

              {activeTab === 'context' && (
                <CollapsiblePanel
                  title="Motor de Contexto"
                  type="terminal"
                  isVisible={true}
                  showCollapseButton={false}
                >
                  <div className={`${isMobile ? 'h-[calc(100vh - 500px)]' : 'h-[calc(100vh - 300px)]'} relative`}>
                    <ContextEngine
                      projectFiles={agentState.projectFiles}
                      contextAnalysis={agentState.contextAnalysis}
                      onAnalyze={() => {
                        addChatMessage({
                          id: generateUniqueId('context-analysis'),
                          sender: 'ai-agent',
                          content: '🧠 Analizando contexto del proyecto...',
                          timestamp: Date.now(),
                          type: 'notification',
                        });
                      }}
                    />
                  </div>
                </CollapsiblePanel>
              )}
            </div>
          </div>

          {/* Columna Derecha - Paneles de Trabajo */}
          <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-7' : 'col-span-8'} space-y-4`}>
            {/* Tabs para paneles de trabajo */}
            <div className="flex border-b border-codestorm-blue/30 overflow-x-auto">
              <button
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'preview' ? 'text-codestorm-accent border-b-2 border-codestorm-accent' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('preview')}
              >
                <Eye className="inline-block w-4 h-4 mr-2" />
                Preview
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'planner' ? 'text-codestorm-accent border-b-2 border-codestorm-accent' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('planner')}
              >
                <Target className="inline-block w-4 h-4 mr-2" />
                Planificador
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'execution' ? 'text-codestorm-accent border-b-2 border-codestorm-accent' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('execution')}
              >
                <Activity className="inline-block w-4 h-4 mr-2" />
                Ejecución
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'collaboration' ? 'text-codestorm-accent border-b-2 border-codestorm-accent' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('collaboration')}
              >
                <Users className="inline-block w-4 h-4 mr-2" />
                Colaboración
              </button>
            </div>

            {/* Contenido de los paneles de trabajo */}
            <div className={`${isMobile ? 'h-[70vh]' : 'h-[calc(100vh-280px)]'} overflow-hidden`}>
              {activeTab === 'preview' && (
                <NextEditPanel
                  pendingModifications={agentState.pendingModifications}
                  selectedFile={agentState.selectedFile}
                  onApprove={handleApproveModification}
                  onReject={handleRejectModification}
                />
              )}

              {activeTab === 'planner' && (
                <div className="h-full">
                  {agentState.currentPlan ? (
                    <ProjectPlanner
                      plan={agentState.currentPlan}
                      onApprovePlan={handleApprovePlan}
                      onRejectPlan={handleRejectPlan}
                      onModifyPlan={(plan) => {
                        setAgentState(prev => ({ ...prev, currentPlan: plan }));
                      }}
                      onApproveStep={(stepId) => {
                        // Implementar aprobación de paso individual
                        console.log('Aprobar paso:', stepId);
                      }}
                      onRejectStep={(stepId) => {
                        // Implementar rechazo de paso individual
                        console.log('Rechazar paso:', stepId);
                      }}
                      isExecuting={agentState.execution?.status === 'running'}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center p-8 bg-codestorm-dark rounded-lg max-w-md">
                        <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold text-white mb-2">No hay plan activo</h3>
                        <p className="text-gray-400 mb-4">
                          {agentState.workflowPhase === 'initial'
                            ? 'Envía una instrucción en el chat para crear un plan de desarrollo detallado'
                            : agentState.workflowPhase === 'planning'
                            ? 'Creando plan... Por favor espera'
                            : agentState.workflowPhase === 'continuous'
                            ? 'Plan ejecutado exitosamente. Ahora estás en modo continuo'
                            : 'El plan ha sido procesado'
                          }
                        </p>
                        {(agentState.workflowPhase === 'completed' || agentState.workflowPhase === 'continuous') && (
                          <button
                            onClick={() => {
                              setAgentState(prev => ({ ...prev, workflowPhase: 'initial' }));
                              setActiveTab('chat');
                            }}
                            className="px-4 py-2 bg-codestorm-accent text-white rounded hover:bg-codestorm-accent/80 transition-colors"
                          >
                            Crear Nuevo Plan
                          </button>
                        )}
                        {agentState.workflowPhase === 'initial' && (
                          <button
                            onClick={() => setActiveTab('chat')}
                            className="px-4 py-2 bg-codestorm-accent text-white rounded hover:bg-codestorm-accent/80 transition-colors"
                          >
                            Ir al Chat
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'execution' && (
                <ExecutionMonitor
                  execution={agentState.execution}
                  onPause={() => {
                    setAgentState(prev => ({
                      ...prev,
                      execution: prev.execution ? { ...prev.execution, status: 'paused' } : null
                    }));
                  }}
                  onResume={() => {
                    setAgentState(prev => ({
                      ...prev,
                      execution: prev.execution ? { ...prev.execution, status: 'running' } : null
                    }));
                  }}
                  onStop={() => {
                    setAgentState(prev => ({
                      ...prev,
                      execution: prev.execution ? { ...prev.execution, status: 'failed' } : null
                    }));
                  }}
                  onRollback={(backupId) => {
                    addChatMessage({
                      id: generateUniqueId('rollback'),
                      sender: 'ai-agent',
                      content: `🔄 Restaurando backup: ${backupId}`,
                      timestamp: Date.now(),
                      type: 'notification',
                    });
                  }}
                />
              )}

              {activeTab === 'collaboration' && (
                <TeamCollaboration
                  agentState={agentState}
                  onShareInsight={(insight) => {
                    addChatMessage({
                      id: generateUniqueId('insight-shared'),
                      sender: 'ai-agent',
                      content: `💡 Insight compartido: ${insight.title}`,
                      timestamp: Date.now(),
                      type: 'notification',
                    });
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Asistente de ayuda */}
      <HelpAssistant
        isOpen={showHelpAssistant}
        onClose={() => setShowHelpAssistant(false)}
      />

      {/* Logo de BOTIDINAMIX */}
      <BrandLogo size="md" showPulse={true} showGlow={true} />

      {/* Pie de página */}
      <Footer showLogo={true} />

      {/* Enhanced Code Editor Modal */}
      {showEnhancedEditor && selectedProjectFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full ${isEditorFullscreen ? 'h-full' : 'max-w-6xl max-h-[90vh]'} overflow-hidden`}>
            <EnhancedCodeEditor
              file={selectedProjectFile}
              onSave={handleFileSave}
              onClose={() => {
                setShowEnhancedEditor(false);
                setSelectedProjectFile(null);
                setIsEditorFullscreen(false);
              }}
              isFullscreen={isEditorFullscreen}
              onToggleFullscreen={() => setIsEditorFullscreen(!isEditorFullscreen)}
            />
          </div>
        </div>
      )}

      {/* Modal de corrección de código */}
      {showCodeCorrectionModal && selectedFileForCorrection && (
        <CodeCorrectionModal
          isOpen={showCodeCorrectionModal}
          file={selectedFileForCorrection}
          onClose={handleCloseCodeCorrectionModal}
          onSave={handleSaveFile}
          onFileUpdate={handleFileUpdate}
        />
      )}

      {/* Indicador de archivos modificados */}
      <FileModificationIndicator
        modifiedFiles={modifiedFiles}
        onClearModifications={() => setModifiedFiles(new Set())}
        onViewFile={(filePath) => {
          // Buscar y seleccionar el archivo en la estructura del proyecto
          const findFile = (structure: ProjectStructure): ProjectStructure | null => {
            if (structure.path === filePath) return structure;
            if (structure.children) {
              for (const child of structure.children) {
                const found = findFile(child);
                if (found) return found;
              }
            }
            return null;
          };

          if (agentState.projectStructure) {
            const file = findFile(agentState.projectStructure);
            if (file) {
              setSelectedProjectFile(file);
              setActiveTab('project');
            }
          }
        }}
      />

      {/* Panel de debug flotante */}
      <div className="fixed top-6 right-6 bg-black/80 text-white p-3 rounded-lg text-xs z-50 max-w-xs">
        <h4 className="font-bold mb-2">🔍 Debug Estado</h4>
        <div className="space-y-1">
          <div>Plan: {agentState.currentPlan ? `${agentState.currentPlan.status}` : 'null'}</div>
          <div>Ejecución: {agentState.execution ? 'activa' : 'null'}</div>
          <div>Modo continuo: {agentState.continuousMode ? 'sí' : 'no'}</div>
          <div>Procesando: {agentState.isProcessing ? 'sí' : 'no'}</div>
          <div>Archivos generados: {showGeneratedFiles ? 'sí' : 'no'}</div>
          <div>Editor files: {editorFiles.length}</div>
        </div>
      </div>

      {/* Botón de prueba siempre visible */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🧪 BOTÓN DE PRUEBA FUNCIONANDO!');
          console.log('Estado actual:', {
            plan: agentState.currentPlan?.status,
            execution: agentState.execution,
            continuousMode: agentState.continuousMode,
            isProcessing: agentState.isProcessing,
            showGeneratedFiles,
            editorFilesLength: editorFiles.length
          });
          alert('¡Botón de prueba funcionando! Ver consola para detalles.');
          addChatMessage({
            id: generateUniqueId('test-button'),
            sender: 'ai-agent',
            content: '🧪 **Botón de Prueba** - Los event handlers están funcionando correctamente.',
            timestamp: Date.now(),
            type: 'success',
          });
        }}
        className="fixed bottom-6 right-6 bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg transition-colors z-50 cursor-pointer"
        title="Botón de Prueba"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Botón flotante para ejecutar plan aprobado */}
      {agentState.currentPlan?.status === 'approved' && !agentState.execution && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🚀 Ejecutando plan aprobado...');
            handleExecutePlan();
          }}
          className="fixed bottom-20 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-colors z-40 cursor-pointer"
          title="Ejecutar Plan"
        >
          <Play className="w-6 h-6" />
        </button>
      )}

      {/* Botón flotante para modo continuo */}
      {agentState.continuousMode && !agentState.isProcessing && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔄 Activando modo continuo...');
            setActiveTab('chat');
            addChatMessage({
              id: generateUniqueId('continuous-activated'),
              sender: 'ai-agent',
              content: '🔄 **Modo Continuo Activado** - Envía nuevas instrucciones para modificar archivos.',
              timestamp: Date.now(),
              type: 'notification',
            });
          }}
          className="fixed bottom-32 right-6 bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-full shadow-lg transition-colors z-40 animate-pulse cursor-pointer"
          title="Modo Continuo - Enviar nueva instrucción"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      )}

      {/* Botón flotante para revisar archivos generados */}
      {showGeneratedFiles && editorFiles.length > 0 && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📝 Abriendo editor para revisar archivos...');
            setActiveTab('editor');
            addChatMessage({
              id: generateUniqueId('editor-opened'),
              sender: 'ai-agent',
              content: `📝 **Editor Abierto** - Revisando ${editorFiles.length} archivos generados.`,
              timestamp: Date.now(),
              type: 'notification',
            });
          }}
          className="fixed bottom-44 right-6 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-colors z-40 animate-bounce cursor-pointer"
          title="Revisar archivos generados"
        >
          <Code className="w-5 h-5" />
        </button>
      )}

      {/* Notificación flotante de archivos generados */}
      {showGeneratedFiles && (
        <div className="fixed top-20 right-6 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <div>
                <p className="font-semibold">Archivos generados</p>
                <p className="text-sm opacity-90">{editorFiles.length} archivos listos para revisar</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('❌ Cerrando notificación de archivos generados...');
                setShowGeneratedFiles(false);
              }}
              className="ml-3 text-white hover:text-gray-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📝 Abriendo editor desde notificación...');
                setActiveTab('editor');
                setShowGeneratedFiles(false);
                addChatMessage({
                  id: generateUniqueId('notification-review'),
                  sender: 'ai-agent',
                  content: `📝 **Revisando archivos** - ${editorFiles.length} archivos abiertos en el editor.`,
                  timestamp: Date.now(),
                  type: 'notification',
                });
              }}
              className="px-3 py-1 bg-white/20 rounded text-sm hover:bg-white/30 transition-colors cursor-pointer"
            >
              Revisar
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('⏰ Posponiendo revisión de archivos...');
                setShowGeneratedFiles(false);
              }}
              className="px-3 py-1 bg-white/10 rounded text-sm hover:bg-white/20 transition-colors cursor-pointer"
            >
              Después
            </button>
          </div>
        </div>
      )}

      {/* Botones flotantes universales */}
      <UniversalFloatingButtons
        onToggleChat={() => {
          console.log('💬 Cambiando a chat desde botones universales...');
          setActiveTab('chat');
          addChatMessage({
            id: generateUniqueId('universal-chat'),
            sender: 'ai-agent',
            content: '💬 **Chat Activado** - ¿En qué puedo ayudarte?',
            timestamp: Date.now(),
            type: 'notification',
          });
        }}
        onTogglePreview={() => {
          console.log('👁️ Abriendo vista previa desde botones universales...');
          if (agentState.projectFiles.length > 0) {
            setActiveTab('editor');
            addChatMessage({
              id: generateUniqueId('universal-preview'),
              sender: 'ai-agent',
              content: `👁️ **Vista Previa** - Mostrando ${agentState.projectFiles.length} archivos del proyecto.`,
              timestamp: Date.now(),
              type: 'notification',
            });
          } else {
            addChatMessage({
              id: generateUniqueId('universal-preview-empty'),
              sender: 'ai-agent',
              content: '⚠️ **Sin archivos** - Crea un plan primero para generar archivos que previsualizar.',
              timestamp: Date.now(),
              type: 'warning',
            });
          }
        }}
        onToggleHelpAssistant={() => {
          console.log('❓ Activando asistente de ayuda...');
          setShowHelpAssistant(!showHelpAssistant);
        }}
        onOpenWebPreview={() => {
          console.log('🌐 Abriendo vista previa web desde Agent');
          if (agentState.projectFiles.length > 0) {
            addChatMessage({
              id: generateUniqueId('web-preview'),
              sender: 'ai-agent',
              content: '🌐 **Vista Previa Web** - Preparando archivos para vista previa en navegador...',
              timestamp: Date.now(),
              type: 'notification',
            });
          } else {
            addChatMessage({
              id: generateUniqueId('web-preview-empty'),
              sender: 'ai-agent',
              content: '⚠️ **Sin archivos** - Genera archivos primero para crear una vista previa web.',
              timestamp: Date.now(),
              type: 'warning',
            });
          }
        }}
        onOpenCodeCorrector={() => {
          console.log('🔧 Abriendo corrector de código desde Agent');
          if (agentState.projectFiles.length > 0) {
            setActiveTab('context');
            addChatMessage({
              id: generateUniqueId('code-corrector'),
              sender: 'ai-agent',
              content: '🔧 **Corrector de Código** - Analizando archivos del proyecto para optimización...',
              timestamp: Date.now(),
              type: 'notification',
            });
          } else {
            addChatMessage({
              id: generateUniqueId('code-corrector-empty'),
              sender: 'ai-agent',
              content: '⚠️ **Sin archivos** - Genera archivos primero para usar el corrector de código.',
              timestamp: Date.now(),
              type: 'warning',
            });
          }
        }}
        showChat={activeTab === 'chat'}
        showHelpAssistant={showHelpAssistant}
        files={agentState.projectFiles}
        projectName={agentState.currentProject?.name || 'Proyecto Agent'}
        currentPage="agent"
      />
    </div>
  );
};

export default Agent;
