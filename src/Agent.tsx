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
  MessageSquare
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
    projectManagementMode: false
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: generateUniqueId('welcome'),
      sender: 'ai-agent',
      content: '🤖 **Bienvenido al Sistema AGENT de CODESTORM**\n\nSoy tu asistente de desarrollo inteligente con tres agentes especializados:\n\n🔧 **Generador**: Crea nuevas funciones y componentes\n🛡️ **Corrector**: Analiza y optimiza código existente\n👁️ **Revisor**: Monitorea cambios y sugiere mejoras\n\nDescribe cualquier modificación que necesites en lenguaje natural.',
      timestamp: Date.now(),
      type: 'notification',
    },
  ]);

  const [activeTab, setActiveTab] = useState<'chat' | 'context' | 'preview' | 'collaboration' | 'project' | 'planner' | 'execution' | 'messenger'>('chat');
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

  // Estado para el modal de corrección de código
  const [showCodeCorrectionModal, setShowCodeCorrectionModal] = useState(false);
  const [selectedFileForCorrection, setSelectedFileForCorrection] = useState<ProjectStructure | null>(null);
  const [modifiedFiles, setModifiedFiles] = useState<Set<string>>(new Set());

  // Simulación de archivos del proyecto para demostración
  useEffect(() => {
    const demoFiles: FileItem[] = [
      {
        id: 'app-tsx',
        name: 'App.tsx',
        path: '/src/App.tsx',
        content: `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;`,
        language: 'typescript',
        timestamp: Date.now() - 86400000
      },
      {
        id: 'home-tsx',
        name: 'Home.tsx',
        path: '/src/pages/Home.tsx',
        content: `import React, { useState } from 'react';

const Home: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="home-container">
      <h1>Bienvenido a mi aplicación</h1>
      <p>Contador: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Incrementar
      </button>
    </div>
  );
};

export default Home;`,
        language: 'typescript',
        timestamp: Date.now() - 172800000
      },
      {
        id: 'styles-css',
        name: 'styles.css',
        path: '/src/styles.css',
        content: `.home-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.home-container h1 {
  color: #333;
  margin-bottom: 1rem;
}

.home-container button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.home-container button:hover {
  background-color: #0056b3;
}`,
        language: 'css',
        timestamp: Date.now() - 259200000
      }
    ];

    setAgentState(prev => ({
      ...prev,
      projectFiles: demoFiles,
      selectedFile: demoFiles[0]
    }));
  }, []);

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

  // Función principal para procesar mensajes del usuario
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
      activeAgent: 'reviewer' // Comenzar con el agente revisor
    }));

    try {
      // Si hay un proyecto cargado, usar el flujo de planificación
      if (agentState.projectManagementMode && agentState.currentProject) {
        await generateProjectPlan(message);
      } else {
        // Flujo original para proyectos simples
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


  // Funciones para manejo del plan
  const handleApprovePlan = () => {
    if (!agentState.currentPlan) return;

    setAgentState(prev => ({
      ...prev,
      currentPlan: prev.currentPlan ? {
        ...prev.currentPlan,
        status: 'approved'
      } : null
    }));

    addChatMessage({
      id: generateUniqueId('plan-approved'),
      sender: 'ai-agent',
      content: '✅ Plan aprobado. Puedes ejecutarlo cuando estés listo.',
      timestamp: Date.now(),
      type: 'success',
    });
  };

  const handleRejectPlan = () => {
    setAgentState(prev => ({
      ...prev,
      currentPlan: null
    }));

    addChatMessage({
      id: generateUniqueId('plan-rejected'),
      sender: 'ai-agent',
      content: '❌ Plan rechazado. Puedes solicitar un nuevo plan con diferentes especificaciones.',
      timestamp: Date.now(),
      type: 'notification',
    });
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

    addChatMessage({
      id: generateUniqueId('execution-complete'),
      sender: 'ai-agent',
      content: `🎉 **Execution Completed Successfully!** All ${steps.length} steps have been executed. The Messenger Agent will provide a comprehensive summary.`,
      timestamp: Date.now(),
      type: 'success',
    });

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
          
          {agentState.isProcessing && (
            <div className="flex items-center p-3 mb-4 border rounded-md bg-codestorm-blue/10 border-codestorm-blue/30">
              <Activity className="w-5 h-5 mr-2 text-codestorm-accent animate-spin" />
              <p className="text-sm text-white">
                Agente {agentState.activeAgent} procesando...
              </p>
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
              </div>

              {/* Contenido de las tabs */}
              {activeTab === 'chat' && (
                <CollapsiblePanel
                  title="Chat Inteligente"
                  type="terminal"
                  isVisible={true}
                  showCollapseButton={false}
                >
                  <div className={`${isMobile ? 'h-[calc(100vh - 500px)]' : 'h-[calc(100vh - 300px)]'} relative`}>
                    <AgentChat
                      messages={chatMessages}
                      onSendMessage={handleSendMessage}
                      isProcessing={agentState.isProcessing}
                      agentState={agentState}
                    />
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

      {/* Botón flotante para ejecutar plan aprobado */}
      {agentState.currentPlan?.status === 'approved' && !agentState.execution && (
        <button
          onClick={handleExecutePlan}
          className="fixed bottom-20 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-colors z-40"
          title="Ejecutar Plan"
        >
          <Play className="w-6 h-6" />
        </button>
      )}

      {/* Botones flotantes universales */}
      <UniversalFloatingButtons
        onToggleChat={() => {}}
        onTogglePreview={() => {}}
        onToggleHelpAssistant={() => {}}
        onOpenWebPreview={() => {
          // Abrir vista previa web con archivos del proyecto Agent
          console.log('🌐 Abriendo vista previa web desde Agent');
        }}
        onOpenCodeCorrector={() => {
          // Abrir corrector de código desde Agent
          console.log('🔧 Abriendo corrector de código desde Agent');
        }}
        showChat={false}
        showHelpAssistant={false}
        files={agentState.projectFiles}
        projectName={agentState.currentProject?.name || 'Proyecto Agent'}
        currentPage="agent"
      />
    </div>
  );
};

export default Agent;
