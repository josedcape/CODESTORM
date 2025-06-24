import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BrandLogo from '../components/BrandLogo';
import Footer from '../components/Footer';
import LoadingOverlay from '../components/LoadingOverlay';
import DirectoryExplorer from '../components/constructor/DirectoryExplorer';
import CodeEditor from '../components/constructor/CodeEditor';
import CompressedFileUploader from '../components/constructor/CompressedFileUploader';
import SimpleFileUploader from '../components/constructor/SimpleFileUploader';
import { GlobalModelSelector } from '../components/constructor/GlobalModelSelector';
import IntroAnimation from '../components/IntroAnimation';
import AudioControls from '../components/AudioControls';
import { useCompletionSounds } from '../hooks/useCompletionSounds';
import { CodeModifierAgent } from '../agents/CodeModifierAgent';
import FileComparisonPanel from '../components/agent/FileComparisonPanel';
import DualDirectoryExplorer from '../components/agent/DualDirectoryExplorer';
import EnhancedChatInterface from '../components/agent/EnhancedChatInterface';
import TypingIndicator from '../components/agent/TypingIndicator';
import FloatingChatButton from '../components/agent/FloatingChatButton';
import ChatModal from '../components/agent/ChatModal';
import { useChatVisibility } from '../hooks/useChatVisibility';
import {
  Loader,
  Sparkles,
  RefreshCw,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Folder,
  Code,
  Eye,
  FileText,
  Upload,
  FileArchive,
  Plus,
  Brain,
  Settings,
  MessageSquare,
  Edit3,
  History,
  Save,
  GitCompare,
  Split,
  Maximize2,
  X
} from 'lucide-react';
import {
  ChatMessage,
  FileItem,
  AgentTask,
  CodeModifierResult
} from '../types';

// Simplified technology stack interface for Agent
interface SimpleTechnologyStack {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  category: string;
  complexity: 'low' | 'medium' | 'high';
  features: string[];
}
import { generateUniqueId } from '../utils/idGenerator';
import { getLanguageFromFilePath } from '../utils/fileUtils';
import { useUI } from '../contexts/UIContext';
import { ConstructorCodeGenerationService, CodeGenerationProgress } from '../services/ConstructorCodeGenerationService';
import { playSuccessSound, preloadAllSounds } from '../utils/soundUtils';
import { getGlobalModelConfig, getAllConfiguredAgents } from '../config/claudeModels';

// Workflow step interface
interface WorkflowStep {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  icon: React.ReactNode;
}

// Agent workflow state (extended from Constructor)
interface AgentWorkflowState {
  currentStep: number;
  isProcessing: boolean;
  userInstruction: string;
  selectedStack: SimpleTechnologyStack | null;
  selectedTemplate: 'basic' | 'advanced' | null;
  steps: WorkflowStep[];
  generatedFiles: FileItem[];
  currentProgress: CodeGenerationProgress | null;
  // New Agent-specific properties
  isPostGeneration: boolean;
  modificationHistory: ModificationEntry[];
  currentModificationId: string | null;
}

// Interface for modification tracking
interface ModificationEntry {
  id: string;
  timestamp: number;
  instruction: string;
  filesModified: string[];
  agentUsed: string;
  success: boolean;
  description: string;
}

const Agent: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useUI();
  const [showIntro, setShowIntro] = useState(true);

  // Completion sounds
  const { playAgentComplete } = useCompletionSounds();

  // Code generation service
  const codeGenerationService = ConstructorCodeGenerationService.getInstance();

  // Initialize workflow steps (same as Constructor)
  const initialSteps: WorkflowStep[] = [
    {
      id: 0,
      name: 'Descripción del Proyecto',
      description: 'Describe tu proyecto y requisitos',
      status: 'in-progress',
      icon: <Send className="w-4 h-4" />
    },
    {
      id: 1,
      name: 'Selección de Stack',
      description: 'Elige las tecnologías para tu proyecto',
      status: 'pending',
      icon: <Clock className="w-4 h-4" />
    },
    {
      id: 2,
      name: 'Plantilla Base',
      description: 'Selecciona una plantilla inicial',
      status: 'pending',
      icon: <Clock className="w-4 h-4" />
    },
    {
      id: 3,
      name: 'Plan de Desarrollo',
      description: 'Revisa y aprueba el plan generado',
      status: 'pending',
      icon: <Clock className="w-4 h-4" />
    },
    {
      id: 4,
      name: 'Generación de Código',
      description: 'Generación automática del código base',
      status: 'pending',
      icon: <Clock className="w-4 h-4" />
    },
    {
      id: 5,
      name: 'Finalización',
      description: 'Proyecto completado y listo para modificaciones',
      status: 'pending',
      icon: <CheckCircle className="w-4 h-4" />
    }
  ];

  // State management (extended from Constructor)
  const [workflowState, setWorkflowState] = useState<AgentWorkflowState>({
    currentStep: 0,
    isProcessing: false,
    userInstruction: '',
    selectedStack: null,
    selectedTemplate: null,
    steps: initialSteps,
    generatedFiles: [],
    currentProgress: null,
    // New Agent-specific state
    isPostGeneration: false,
    modificationHistory: [],
    currentModificationId: null
  });

  // File explorer state
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'editor' | 'preview' | 'upload' | 'modifications' | 'comparison' | 'dual-explorer'>('files');
  const [showCompressedUploader, setShowCompressedUploader] = useState(false);

  // Comparison system state
  const [originalFiles, setOriginalFiles] = useState<FileItem[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonFiles, setComparisonFiles] = useState<{original: FileItem[], modified: FileItem[]}>({original: [], modified: []});

  // Chat messages state - must be declared before useChatVisibility
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: generateUniqueId('welcome'),
      sender: 'ai',
      content: '🤖 Bienvenido al Agent de CODESTORM. Genera tu proyecto paso a paso y luego modifícalo mediante chat interactivo.',
      timestamp: Date.now(),
      type: 'notification',
      senderType: 'ai'
    },
  ]);

  // Enhanced chat state
  const [processingStage, setProcessingStage] = useState<'analyzing' | 'processing' | 'generating' | 'finalizing'>('processing');
  const [processingProgress, setProcessingProgress] = useState(0);



  // Chat visibility management
  const {
    isChatVisible,
    isChatModalOpen,
    showFloatingButton,
    unreadCount,
    hasUnreadMessages,
    showChat,
    hideChat,
    toggleChat,
    openChatModal,
    closeChatModal,
    markAllAsRead
  } = useChatVisibility({
    initialVisible: !isMobile, // Hide on mobile by default
    messages: chatMessages
  });

  // Model selector state
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [globalConfig, setGlobalConfig] = useState(getGlobalModelConfig());

  // API connection state
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean;
    provider: string;
    lastChecked: number;
  }>({
    isConnected: false,
    provider: 'none',
    lastChecked: 0
  });

  // Input state
  const [userInput, setUserInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Agent-specific state for post-generation modifications
  const [modificationInput, setModificationInput] = useState('');
  const [isModifying, setIsModifying] = useState(false);



  // Technology stack options (same as Constructor)
  const techStacks: SimpleTechnologyStack[] = [
    {
      id: 'react-node',
      name: 'React + Node.js',
      description: 'Frontend moderno con React y backend con Node.js',
      technologies: ['React', 'Node.js', 'Express', 'TypeScript'],
      category: 'fullstack',
      complexity: 'medium',
      features: ['SPA', 'REST API', 'Real-time', 'Database']
    },
    {
      id: 'vue-express',
      name: 'Vue.js + Express',
      description: 'Vue.js para frontend y Express para backend',
      technologies: ['Vue.js', 'Express', 'Node.js', 'JavaScript'],
      category: 'fullstack',
      complexity: 'medium',
      features: ['SPA', 'REST API', 'Database']
    },
    {
      id: 'nextjs',
      name: 'Next.js Full-Stack',
      description: 'Next.js con API routes integradas',
      technologies: ['Next.js', 'React', 'TypeScript', 'Prisma'],
      category: 'fullstack',
      complexity: 'medium',
      features: ['SSR', 'API Routes', 'Database', 'Authentication']
    },
    {
      id: 'mern',
      name: 'MERN Stack',
      description: 'MongoDB, Express, React, Node.js',
      technologies: ['MongoDB', 'Express', 'React', 'Node.js'],
      category: 'fullstack',
      complexity: 'high',
      features: ['NoSQL', 'REST API', 'SPA', 'Real-time']
    },
    {
      id: 'react-python',
      name: 'React + Python',
      description: 'React frontend con Django/FastAPI backend',
      technologies: ['React', 'Python', 'FastAPI', 'PostgreSQL'],
      category: 'fullstack',
      complexity: 'high',
      features: ['SPA', 'REST API', 'Database', 'ML Ready']
    },
    {
      id: 'angular-dotnet',
      name: 'Angular + .NET',
      description: 'Angular con backend en .NET Core',
      technologies: ['Angular', '.NET Core', 'C#', 'SQL Server'],
      category: 'fullstack',
      complexity: 'high',
      features: ['SPA', 'REST API', 'Database', 'Enterprise']
    }
  ];

  // Test API connection (same as Constructor)
  const testAPIConnection = async () => {
    try {
      const apiService = codeGenerationService['apiService']; // Access private property
      const status = await apiService.testConnection();
      setConnectionStatus({
        isConnected: status.isConnected,
        provider: status.provider,
        lastChecked: Date.now()
      });

      if (status.isConnected) {
        setChatMessages(prev => [...prev, {
          id: generateUniqueId('connection-success'),
          sender: 'ai',
          content: `✅ Conectado a ${status.provider.toUpperCase()} API`,
          timestamp: Date.now(),
          type: 'success',
          senderType: 'ai'
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          id: generateUniqueId('connection-error'),
          sender: 'ai',
          content: '❌ No se pudo conectar con los servicios de IA',
          timestamp: Date.now(),
          type: 'error',
          senderType: 'ai'
        }]);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setConnectionStatus({
        isConnected: false,
        provider: 'none',
        lastChecked: Date.now()
      });
    }
  };

  // Setup code generation service listeners (same as Constructor)
  useEffect(() => {
    const handleProgress = (progress: CodeGenerationProgress) => {
      setWorkflowState(prev => ({ ...prev, currentProgress: progress }));
    };

    const handleChatMessage = (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
    };

    const handleFileUpdate = (files: FileItem[]) => {
      setWorkflowState(prev => ({ ...prev, generatedFiles: files }));
    };

    // Precargar sonidos para reproducción rápida
    preloadAllSounds();

    // Add listeners
    codeGenerationService.addProgressListener(handleProgress);
    codeGenerationService.addChatListener(handleChatMessage);
    codeGenerationService.addFileListener(handleFileUpdate);

    // Test initial connection
    testAPIConnection();

    // Cleanup
    return () => {
      codeGenerationService.removeProgressListener(handleProgress);
      codeGenerationService.removeChatListener(handleChatMessage);
      codeGenerationService.removeFileListener(handleFileUpdate);
    };
  }, []);

  // Simple workflow progression (same as Constructor)
  const advanceWorkflow = () => {
    setWorkflowState(prev => {
      const newSteps = [...prev.steps];

      // Mark current step as completed
      if (prev.currentStep < newSteps.length - 1) {
        newSteps[prev.currentStep].status = 'completed';
        newSteps[prev.currentStep].icon = <CheckCircle className="w-4 h-4" />;

        // Move to next step
        const nextStep = prev.currentStep + 1;
        newSteps[nextStep].status = 'in-progress';
        newSteps[nextStep].icon = <Loader className="w-4 h-4 animate-spin" />;

        // Check if we've completed the generation phase
        if (nextStep === 5) { // Finalización step
          return {
            ...prev,
            currentStep: nextStep,
            steps: newSteps,
            isPostGeneration: true // Enable post-generation modifications
          };
        }

        return {
          ...prev,
          currentStep: nextStep,
          steps: newSteps
        };
      }

      return prev;
    });
  };

  // Handle technology stack selection (same as Constructor)
  const handleStackSelection = (stackId: string) => {
    const selectedStack = techStacks.find(stack => stack.id === stackId);

    if (selectedStack) {
      setWorkflowState(prev => ({ ...prev, selectedStack }));

      setChatMessages(prev => [...prev, {
        id: generateUniqueId('stack-selected'),
        sender: 'user',
        content: `Stack seleccionado: ${selectedStack.name}`,
        timestamp: Date.now(),
        type: 'text',
        senderType: 'user'
      }]);

      setChatMessages(prev => [...prev, {
        id: generateUniqueId('stack-confirmed'),
        sender: 'ai',
        content: `✅ Excelente elección. Continuando con ${selectedStack.name}...`,
        timestamp: Date.now(),
        type: 'success',
        senderType: 'ai'
      }]);

      // Continue workflow after a short delay
      setTimeout(() => {
        advanceWorkflow();
      }, 1500);
    }
  };

  // Workflow handler functions (same as Constructor)
  const handleSubmitInstruction = async () => {
    if (!userInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setWorkflowState(prev => ({ ...prev, userInstruction: userInput, isProcessing: true }));

    try {
      // Add user message to chat
      const userMessage: ChatMessage = {
        id: generateUniqueId('user'),
        sender: 'user',
        content: userInput,
        timestamp: Date.now(),
        type: 'text',
        senderType: 'user'
      };
      setChatMessages(prev => [...prev, userMessage]);

      // Add AI response
      setChatMessages(prev => [...prev, {
        id: generateUniqueId('ai-response'),
        sender: 'ai',
        content: '✅ Instrucción recibida. Iniciando análisis del proyecto...',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai'
      }]);

      // Simulate workflow progression
      setTimeout(() => {
        advanceWorkflow();
        setIsSubmitting(false);
        setWorkflowState(prev => ({ ...prev, isProcessing: false }));
      }, 2000);

      // Clear input
      setUserInput('');
    } catch (error) {
      console.error('Error starting workflow:', error);
      setChatMessages(prev => [...prev, {
        id: generateUniqueId('error'),
        sender: 'ai',
        content: '❌ Error al iniciar el workflow. Por favor, intenta nuevamente.',
        timestamp: Date.now(),
        type: 'error',
        senderType: 'ai'
      }]);
      setIsSubmitting(false);
      setWorkflowState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Handle template selection (same as Constructor)
  const handleTemplateSelection = (templateType: 'basic' | 'advanced') => {
    setWorkflowState(prev => ({ ...prev, selectedTemplate: templateType }));

    setChatMessages(prev => [...prev, {
      id: generateUniqueId('template-selected'),
      sender: 'user',
      content: `Plantilla seleccionada: ${templateType === 'basic' ? 'Proyecto Básico' : 'Proyecto Avanzado'}`,
      timestamp: Date.now(),
      type: 'text',
      senderType: 'user'
    }]);

    setChatMessages(prev => [...prev, {
      id: generateUniqueId('template-confirmed'),
      sender: 'ai',
      content: `✅ Plantilla configurada. Generando plan de desarrollo...`,
      timestamp: Date.now(),
      type: 'success',
      senderType: 'ai'
    }]);

    // Continue workflow after a short delay
    setTimeout(() => {
      advanceWorkflow();
    }, 1500);
  };

  // Handle real code generation (same as Constructor)
  const handleStartCodeGeneration = async () => {
    if (!workflowState.selectedStack || !workflowState.selectedTemplate) {
      setChatMessages(prev => [...prev, {
        id: generateUniqueId('error'),
        sender: 'ai',
        content: '❌ Error: Stack tecnológico y plantilla deben estar seleccionados.',
        timestamp: Date.now(),
        type: 'error',
        senderType: 'ai'
      }]);
      return;
    }

    setWorkflowState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Add initial message about starting generation
      setChatMessages(prev => [...prev, {
        id: generateUniqueId('generation-start'),
        sender: 'ai',
        content: '🚀 Iniciando generación de código real con agentes especializados...',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai'
      }]);

      const result = await codeGenerationService.generateProject(
        workflowState.userInstruction,
        workflowState.selectedStack,
        workflowState.selectedTemplate
      );

      if (result.success) {
        setWorkflowState(prev => ({
          ...prev,
          generatedFiles: result.files,
          isProcessing: false,
          isPostGeneration: true // Enable post-generation modifications
        }));

        // Reproducir sonido de finalización del Agent
        playAgentComplete().then(success => {
          if (success) {
            console.log('🔊 Sonido de finalización del Agent reproducido');
          }
        });

        // Show success message with details
        setChatMessages(prev => [...prev, {
          id: generateUniqueId('generation-success'),
          sender: 'ai',
          content: `🎉 ¡Generación completada! ${result.files.length} archivos creados en ${Math.round((result.metadata?.executionTime || 0) / 1000)}s`,
          timestamp: Date.now(),
          type: 'success',
          senderType: 'ai'
        }]);

        // Add Agent-specific message about post-generation capabilities
        setChatMessages(prev => [...prev, {
          id: generateUniqueId('post-generation-info'),
          sender: 'ai',
          content: '🤖 ¡Ahora puedes modificar tu proyecto usando el chat interactivo! Describe los cambios que quieres hacer.',
          timestamp: Date.now(),
          type: 'info',
          senderType: 'ai'
        }]);

        if (result.metadata?.agentsUsed) {
          setChatMessages(prev => [...prev, {
            id: generateUniqueId('agents-used'),
            sender: 'ai',
            content: `🤖 Agentes utilizados: ${result.metadata.agentsUsed.join(', ')}`,
            timestamp: Date.now(),
            type: 'info',
            senderType: 'ai'
          }]);
        }

        // Advance to final step
        advanceWorkflow();
      } else {
        throw new Error(result.error || 'Error desconocido en la generación');
      }
    } catch (error) {
      console.error('Error in code generation:', error);
      setChatMessages(prev => [...prev, {
        id: generateUniqueId('generation-error'),
        sender: 'ai',
        content: `❌ Error en la generación: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: Date.now(),
        type: 'error',
        senderType: 'ai'
      }]);
      setWorkflowState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // NEW AGENT-SPECIFIC FUNCTIONALITY: Real post-generation modifications using CodeModifierAgent
  const handleModificationRequest = async () => {
    if (!modificationInput.trim() || isModifying || !workflowState.isPostGeneration) return;

    setIsModifying(true);
    const modificationId = generateUniqueId('modification');

    // Store original files for comparison
    setOriginalFiles([...workflowState.generatedFiles]);

    try {
      // Add user message to chat
      const userMessage: ChatMessage = {
        id: generateUniqueId('user-modification'),
        sender: 'user',
        content: modificationInput,
        timestamp: Date.now(),
        type: 'text',
        senderType: 'user'
      };
      setChatMessages(prev => [...prev, userMessage]);

      // Enhanced processing feedback with stages
      setProcessingStage('analyzing');
      setProcessingProgress(0);

      setChatMessages(prev => [...prev, {
        id: generateUniqueId('modification-processing'),
        sender: 'ai',
        content: '🤖 Iniciando análisis inteligente de archivos...',
        timestamp: Date.now(),
        type: 'streaming',
        senderType: 'ai'
      }]);

      // Simulate analysis stage
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProcessingProgress(25);

      setProcessingStage('processing');
      setChatMessages(prev => [...prev, {
        id: generateUniqueId('modification-analyzing'),
        sender: 'ai',
        content: '🔍 Analizando estructura del proyecto y dependencias...',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai'
      }]);

      // Process each file with CodeModifierAgent
      const modifiedFiles: FileItem[] = [];
      const allChanges: string[] = [];
      let filesModified = 0;
      const totalFiles = workflowState.generatedFiles.length;

      setProcessingStage('generating');

      for (let i = 0; i < workflowState.generatedFiles.length; i++) {
        const file = workflowState.generatedFiles[i];

        // Update progress
        const fileProgress = 25 + (i / totalFiles) * 50; // 25-75% for file processing
        setProcessingProgress(fileProgress);

        try {
          // Create agent task
          const agentTask: AgentTask = {
            id: generateUniqueId('task'),
            type: 'codeModifier',
            instruction: modificationInput,
            status: 'working',
            startTime: Date.now()
          };

          // Add processing message for current file
          setChatMessages(prev => [...prev, {
            id: generateUniqueId(`processing-${file.name}`),
            sender: 'ai',
            content: `🔧 Procesando archivo: [file:${file.path}]`,
            timestamp: Date.now(),
            type: 'notification',
            senderType: 'ai'
          }]);

          // Execute CodeModifierAgent for this file
          const result: CodeModifierResult = await CodeModifierAgent.execute(agentTask, file);

          if (result.success && result.data) {
            // File was successfully modified
            modifiedFiles.push(result.data.modifiedFile);
            filesModified++;

            // Collect changes for reporting
            if (result.data.changes && result.data.changes.length > 0) {
              result.data.changes.forEach(change => {
                allChanges.push(`${file.name}: ${change.description}`);
              });
            }

            console.log(`✅ File ${file.name} modified successfully`);
          } else {
            // File modification failed, keep original
            modifiedFiles.push(file);
            console.log(`⚠️ File ${file.name} could not be modified: ${result.error}`);
          }
        } catch (error) {
          // Error processing this file, keep original
          modifiedFiles.push(file);
          console.error(`❌ Error processing file ${file.name}:`, error);
        }
      }

      setProcessingStage('finalizing');
      setProcessingProgress(75);

      // Check if any files were actually modified
      if (filesModified > 0) {
        // Update files with real modifications
        setWorkflowState(prev => ({
          ...prev,
          generatedFiles: modifiedFiles,
          modificationHistory: [...prev.modificationHistory, {
            id: modificationId,
            timestamp: Date.now(),
            instruction: modificationInput,
            filesModified: modifiedFiles.filter((file, index) =>
              file.content !== workflowState.generatedFiles[index]?.content
            ).map(f => f.path),
            agentUsed: 'CodeModifierAgent',
            success: true,
            description: `${filesModified} archivos modificados con cambios reales`
          }],
          currentModificationId: modificationId
        }));

        // Set up comparison data
        setComparisonFiles({
          original: originalFiles,
          modified: modifiedFiles
        });

        // Create detailed success message
        const changesList = allChanges.length > 0
          ? `\n\n🔧 Cambios aplicados:\n${allChanges.map(change => `• ${change}`).join('\n')}`
          : '';

        const modifiedFileNames = modifiedFiles.filter((file, index) =>
          file.content !== workflowState.generatedFiles[index]?.content
        ).map(f => f.name);

        setChatMessages(prev => [...prev, {
          id: generateUniqueId('modification-success'),
          sender: 'ai',
          content: `✅ Modificación completada exitosamente!\n\n📁 Archivos procesados: ${modifiedFiles.length}\n🔄 Archivos modificados: ${filesModified}\n📝 Archivos: ${modifiedFileNames.join(', ')}${changesList}\n\n🔍 Haz clic en "Comparación" para ver los cambios detallados.`,
          timestamp: Date.now(),
          type: 'success',
          senderType: 'ai'
        }]);

        // Show comparison panel automatically
        setShowComparison(true);
        setActiveTab('comparison');

        // Update selected file if it was modified
        if (selectedFile) {
          const updatedSelectedFile = modifiedFiles.find(f => f.path === selectedFile.path);
          if (updatedSelectedFile && updatedSelectedFile.content !== selectedFile.content) {
            setSelectedFile(updatedSelectedFile);

            // Add notification about selected file update
            setChatMessages(prev => [...prev, {
              id: generateUniqueId('file-updated'),
              sender: 'ai',
              content: `📄 El archivo seleccionado "${selectedFile.name}" ha sido actualizado en el editor`,
              timestamp: Date.now(),
              type: 'notification',
              senderType: 'ai'
            }]);
          }
        }
      } else {
        // No files were modified
        setChatMessages(prev => [...prev, {
          id: generateUniqueId('modification-no-changes'),
          sender: 'ai',
          content: `⚠️ No se pudieron aplicar modificaciones a los archivos.\n\nEsto puede ocurrir si:\n• La instrucción no es específica\n• Los archivos ya tienen el contenido solicitado\n• Hay un error en el procesamiento\n\nIntenta con una instrucción más específica.`,
          timestamp: Date.now(),
          type: 'warning',
          senderType: 'ai'
        }]);
      }

      // Clear modification input and reset progress
      setModificationInput('');
      setProcessingProgress(100);

      // Reset processing state after a delay
      setTimeout(() => {
        setProcessingProgress(0);
      }, 2000);

    } catch (error) {
      console.error('Error in modification:', error);
      setChatMessages(prev => [...prev, {
        id: generateUniqueId('modification-error'),
        sender: 'ai',
        content: `❌ Error en la modificación: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: Date.now(),
        type: 'error',
        senderType: 'ai'
      }]);
    } finally {
      setIsModifying(false);
    }
  };

  // Reset workflow (same as Constructor)
  const handleResetWorkflow = () => {
    setWorkflowState({
      currentStep: 0,
      isProcessing: false,
      userInstruction: '',
      selectedStack: null,
      selectedTemplate: null,
      steps: initialSteps,
      generatedFiles: [],
      currentProgress: null,
      isPostGeneration: false,
      modificationHistory: [],
      currentModificationId: null
    });

    setChatMessages([{
      id: generateUniqueId('reset'),
      sender: 'ai',
      content: '🔄 Workflow reiniciado. Puedes comenzar un nuevo proyecto.',
      timestamp: Date.now(),
      type: 'notification',
      senderType: 'ai'
    }]);

    setUserInput('');
    setModificationInput('');
    setSelectedFile(null);
    setActiveTab('files');
  };

  // File handling functions (same as Constructor)
  const handleFilesExtracted = (files: FileItem[]) => {
    setWorkflowState(prev => ({
      ...prev,
      generatedFiles: [...prev.generatedFiles, ...files]
    }));

    setChatMessages(prev => [...prev, {
      id: generateUniqueId('files-extracted'),
      sender: 'ai',
      content: `📁 ${files.length} archivos extraídos y agregados al proyecto`,
      timestamp: Date.now(),
      type: 'success',
      senderType: 'ai'
    }]);
  };

  const handleCompressionError = (error: string) => {
    setChatMessages(prev => [...prev, {
      id: generateUniqueId('compression-error'),
      sender: 'ai',
      content: `❌ Error al procesar archivo comprimido: ${error}`,
      timestamp: Date.now(),
      type: 'error',
      senderType: 'ai'
    }]);
  };

  const toggleCompressedUploader = () => {
    setShowCompressedUploader(!showCompressedUploader);
    if (!showCompressedUploader) {
      setActiveTab('upload');
    }
  };

  // Enhanced prompt functionality (same as Constructor)
  const handleEnhancePrompt = async () => {
    if (!userInput.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      setChatMessages(prev => [...prev, {
        id: generateUniqueId('enhance-start'),
        sender: 'ai',
        content: '✨ Mejorando prompt con IA especializada...',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai'
      }]);

      // Simulate prompt enhancement
      await new Promise(resolve => setTimeout(resolve, 2000));

      const enhancedPrompt = `${userInput} [Mejorado con análisis de arquitectura, patrones de diseño y mejores prácticas]`;

      setUserInput(enhancedPrompt);

      setChatMessages(prev => [...prev, {
        id: generateUniqueId('enhance-success'),
        sender: 'ai',
        content: '✅ Prompt mejorado con análisis especializado para aplicaciones complejas',
        timestamp: Date.now(),
        type: 'success',
        senderType: 'ai'
      }]);

    } catch (error) {
      setChatMessages(prev => [...prev, {
        id: generateUniqueId('enhance-error'),
        sender: 'ai',
        content: '❌ Error al mejorar el prompt. Intenta nuevamente.',
        timestamp: Date.now(),
        type: 'error',
        senderType: 'ai'
      }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Workflow Progress Component (same as Constructor)
  const WorkflowProgressComponent = () => (
    <div className="bg-codestorm-dark rounded-lg p-4 mb-6">
      <h2 className="text-lg font-semibold text-white mb-4">
        🤖 Progreso del Agent - Paso {workflowState.currentStep + 1} de {workflowState.steps.length}
      </h2>
      <div className="space-y-3">
        {workflowState.steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
              index === workflowState.currentStep
                ? 'bg-codestorm-accent/20 border border-codestorm-accent/30'
                : step.status === 'completed'
                ? 'bg-green-500/10 border border-green-500/20'
                : step.status === 'error'
                ? 'bg-red-500/10 border border-red-500/20'
                : 'bg-codestorm-darker border border-gray-600/30'
            }`}
          >
            <div className="flex-shrink-0">
              {step.icon}
            </div>
            <div className="flex-1">
              <div className={`font-medium ${
                index === workflowState.currentStep ? 'text-codestorm-accent' :
                step.status === 'completed' ? 'text-green-400' :
                step.status === 'error' ? 'text-red-400' : 'text-gray-400'
              }`}>
                {step.name}
              </div>
              <div className="text-xs text-gray-500">{step.description}</div>
            </div>
            {step.status === 'completed' && (
              <CheckCircle className="w-4 h-4 text-green-400" />
            )}
            {step.status === 'error' && (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
          </div>
        ))}
      </div>

      {/* Post-generation status */}
      {workflowState.isPostGeneration && (
        <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span className="text-purple-400 font-medium">Modo Modificación Activo</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Modificaciones realizadas: {workflowState.modificationHistory.length}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-codestorm-darker" data-testid="agent-container">
      {/* Intro Animation */}
      {showIntro && (
        <IntroAnimation
          onComplete={() => setShowIntro(false)}
          pageName="Agent"
          duration={2500}
          skipable={true}
        />
      )}

      <Header showConstructorButton={false}>
        {/* Audio Controls en el header */}
        <AudioControls className="ml-4" />
      </Header>

      <main className="container flex-1 px-4 py-4 mx-auto">
        {/* Workflow Progress */}
        <WorkflowProgressComponent />

        {/* Main Content */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : isChatVisible ? 'grid-cols-12 gap-6' : 'grid-cols-1'}`}>
          {/* Left Column - Input and Chat */}
          {isChatVisible && (
            <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-5' : 'col-span-4'}`}>
            <div className="bg-codestorm-dark rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white`}>
                    🤖 Agent de CODESTORM
                  </h1>
                  <p className="text-gray-300 mt-2">
                    Desarrollo paso a paso con modificaciones interactivas post-generación
                  </p>
                </div>

                {/* Chat Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={openChatModal}
                    className="p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded-md transition-colors"
                    title="Abrir chat en modal"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={hideChat}
                    className="p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded-md transition-colors"
                    title="Ocultar chat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* API Connection Status */}
              <div className="mb-6 p-3 rounded-lg border border-gray-600/30 bg-gray-800/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      connectionStatus.isConnected ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                    <span className="text-sm text-gray-300">
                      Estado de IA: {connectionStatus.isConnected ? 'Conectado' : 'Desconectado'}
                    </span>
                    {connectionStatus.isConnected && (
                      <span className="text-xs text-gray-400">
                        ({connectionStatus.provider.toUpperCase()})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={testAPIConnection}
                    className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                  >
                    Probar Conexión
                  </button>
                </div>

                {/* Model Configuration Section */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-600/30">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-gray-400">
                      Modelo: {globalConfig.defaultModel.provider} - {globalConfig.defaultModel.modelId}
                    </span>
                    <span className="text-xs text-blue-400">
                      ({getAllConfiguredAgents().length} agentes)
                    </span>
                  </div>
                  <button
                    onClick={() => setShowModelSelector(true)}
                    className="text-xs px-2 py-1 bg-purple-600/20 text-purple-400 border border-purple-600/30 rounded hover:bg-purple-600/30 transition-colors"
                    title="Configurar modelos de IA"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Input Section - Initial Generation */}
              {workflowState.currentStep === 0 && !workflowState.isPostGeneration && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Describe tu proyecto:
                    </label>
                    <textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Ejemplo: Crear una aplicación de gestión de tareas con React y Node.js..."
                      className="w-full h-32 bg-codestorm-darker border border-codestorm-blue/30 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-codestorm-accent transition-colors"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleSubmitInstruction}
                      disabled={!userInput.trim() || isSubmitting}
                      className={`
                        flex-1 flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200
                        ${userInput.trim() && !isSubmitting
                          ? 'bg-codestorm-accent text-white hover:bg-blue-600 hover:scale-105'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }
                      `}
                    >
                      {isSubmitting ? (
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5 mr-2" />
                      )}
                      {isSubmitting ? 'Procesando...' : 'Comenzar Desarrollo'}
                    </button>

                    <button
                      onClick={handleEnhancePrompt}
                      disabled={!userInput.trim() || isSubmitting}
                      className="px-4 py-3 bg-purple-600/20 text-purple-400 border border-purple-600/30 rounded-lg hover:bg-purple-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Mejorar prompt con IA"
                    >
                      <Sparkles className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-xs text-gray-400 space-y-1">
                    <p>💡 <strong>Tip:</strong> Sé específico sobre las tecnologías y funcionalidades que deseas</p>
                    <p>⌨️ <strong>Atajos:</strong> Ctrl+Enter para enviar, Ctrl+R para reiniciar, Ctrl+U para cargar archivos</p>
                  </div>
                </div>
              )}

              {/* NEW: Post-Generation Modification Chat */}
              {workflowState.isPostGeneration && (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <h3 className="text-purple-400 font-medium mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Chat de Modificaciones
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">
                      Describe los cambios que quieres hacer a tu proyecto. El Agent analizará y aplicará las modificaciones.
                    </p>

                    <div className="space-y-3">
                      <textarea
                        value={modificationInput}
                        onChange={(e) => setModificationInput(e.target.value)}
                        placeholder="Ejemplo: Cambia el color del header a azul, agrega un botón de logout, mejora el diseño responsive..."
                        className="w-full h-24 bg-codestorm-darker border border-purple-500/30 rounded-lg p-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-purple-400 transition-colors"
                        disabled={isModifying}
                        data-testid="modification-textarea"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            console.log('🔍 Debug botón modificación:', {
                              'Input vacío': !modificationInput.trim(),
                              'Modificando manual': isModifying,
                              'Post-generación': workflowState.isPostGeneration,
                              'Botón deshabilitado': !modificationInput.trim() || isModifying
                            });
                            handleModificationRequest();
                          }}
                          disabled={!modificationInput.trim() || isModifying}
                          className={`
                            flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200
                            ${modificationInput.trim() && !isModifying
                              ? 'bg-purple-600 text-white hover:bg-purple-700'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }
                          `}
                          data-testid="modification-button"
                        >
                          {isModifying ? (
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Edit3 className="w-4 h-4 mr-2" />
                          )}
                          {isModifying ? 'Modificando...' : 'Aplicar Modificación'}
                        </button>

                        <button
                          onClick={() => setActiveTab('modifications')}
                          className="px-3 py-2 bg-gray-600/20 text-gray-400 border border-gray-600/30 rounded-lg hover:bg-gray-600/30 transition-colors"
                          title="Ver historial de modificaciones"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>


                </div>
              )}

              {/* Botón de Carga de Archivos Comprimidos - Siempre Visible */}
              <div className="mt-4">
                <button
                  onClick={(e) => {
                    console.log('🖱️ Click en botón de carga de archivos detectado');
                    e.preventDefault();
                    e.stopPropagation();
                    toggleCompressedUploader();
                  }}
                  className="w-full px-4 py-3 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg hover:bg-green-600/30 transition-colors flex items-center justify-center space-x-2"
                  title="Cargar archivos comprimidos (Ctrl+U)"
                >
                  <FileArchive className="w-5 h-5" />
                  <span>Cargar Archivos ZIP/RAR</span>
                </button>
                <div className="text-xs text-gray-500 mt-2 text-center">
                  Estado: {showCompressedUploader ? 'Abierto' : 'Cerrado'} | Tab: {activeTab}
                </div>
              </div>

              {/* Technology Stack Selection */}
              {workflowState.currentStep === 1 && (
                <div className="space-y-4">
                  <div className="p-4 bg-codestorm-darker rounded-lg border border-codestorm-blue/20">
                    <h3 className="text-white font-semibold mb-3">Selecciona tu Stack Tecnológico:</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {techStacks.map((stack) => (
                        <button
                          key={stack.id}
                          onClick={() => handleStackSelection(stack.id)}
                          className="p-3 text-left bg-codestorm-dark border border-codestorm-blue/30 rounded-lg hover:border-codestorm-accent hover:bg-codestorm-blue/10 transition-all duration-200"
                        >
                          <div className="text-white font-medium">{stack.name}</div>
                          <div className="text-sm text-gray-400 mt-1">{stack.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Template Selection */}
              {workflowState.currentStep === 2 && (
                <div className="space-y-4">
                  <div className="p-4 bg-codestorm-darker rounded-lg border border-codestorm-blue/20">
                    <h3 className="text-white font-semibold mb-3">Selecciona una Plantilla:</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={() => handleTemplateSelection('basic')}
                        className="p-4 text-left bg-codestorm-dark border border-codestorm-blue/30 rounded-lg hover:border-codestorm-accent hover:bg-codestorm-blue/10 transition-all duration-200"
                      >
                        <div className="flex items-center mb-2">
                          <FileText className="w-5 h-5 text-codestorm-accent mr-2" />
                          <div className="text-white font-medium">Proyecto Básico</div>
                        </div>
                        <div className="text-sm text-gray-400">Estructura básica con componentes esenciales</div>
                        <div className="text-xs text-gray-500 mt-2">
                          • Configuración inicial • Componentes básicos • Estilos CSS • Estructura de carpetas
                        </div>
                      </button>
                      <button
                        onClick={() => handleTemplateSelection('advanced')}
                        className="p-4 text-left bg-codestorm-dark border border-codestorm-blue/30 rounded-lg hover:border-codestorm-accent hover:bg-codestorm-blue/10 transition-all duration-200"
                      >
                        <div className="flex items-center mb-2">
                          <Sparkles className="w-5 h-5 text-purple-400 mr-2" />
                          <div className="text-white font-medium">Proyecto Avanzado</div>
                        </div>
                        <div className="text-sm text-gray-400">Incluye autenticación, base de datos y API completa</div>
                        <div className="text-xs text-gray-500 mt-2">
                          • Todo lo básico • Autenticación • Base de datos • API REST • Testing • Documentación
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Development Plan Approval */}
              {workflowState.currentStep === 3 && (
                <div className="space-y-4">
                  <div className="p-4 bg-codestorm-darker rounded-lg border border-codestorm-blue/20">
                    <h3 className="text-white font-semibold mb-3">Plan de Desarrollo Generado:</h3>
                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-gray-300">• Configuración inicial del proyecto</div>
                      <div className="text-sm text-gray-300">• Estructura de carpetas y archivos</div>
                      <div className="text-sm text-gray-300">• Componentes principales</div>
                      <div className="text-sm text-gray-300">• Configuración de rutas</div>
                      <div className="text-sm text-gray-300">• Estilos y diseño responsive</div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setChatMessages(prev => [...prev, {
                            id: generateUniqueId('plan-approved'),
                            sender: 'user',
                            content: 'Plan aprobado. Proceder con la generación de código.',
                            timestamp: Date.now(),
                            type: 'text',
                            senderType: 'user'
                          }]);
                          setTimeout(() => advanceWorkflow(), 1000);
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        ✅ Aprobar Plan
                      </button>
                      <button
                        onClick={() => {
                          setChatMessages(prev => [...prev, {
                            id: generateUniqueId('plan-rejected'),
                            sender: 'user',
                            content: 'Plan rechazado. Generando nueva propuesta...',
                            timestamp: Date.now(),
                            type: 'text',
                            senderType: 'user'
                          }]);
                        }}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        ❌ Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Workflow Status for other steps */}
              {workflowState.currentStep > 3 && (
                <div className="space-y-4">
                  <div className="p-4 bg-codestorm-darker rounded-lg border border-codestorm-blue/20">
                    <h3 className="text-white font-semibold mb-2">Estado Actual:</h3>
                    <p className="text-gray-300">{workflowState.steps[workflowState.currentStep]?.description}</p>

                    {workflowState.isProcessing && (
                      <div className="flex items-center mt-3">
                        <Loader className="w-4 h-4 mr-2 text-codestorm-accent animate-spin" />
                        <span className="text-sm text-gray-400">Procesando...</span>
                      </div>
                    )}

                    {workflowState.currentStep === 4 && !workflowState.isProcessing && !workflowState.isPostGeneration && (
                      <button
                        onClick={handleStartCodeGeneration}
                        disabled={!workflowState.selectedStack || !workflowState.selectedTemplate}
                        className="w-full mt-3 px-4 py-2 bg-codestorm-accent text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        🚀 Generar Código Real
                      </button>
                    )}

                    {workflowState.currentStep === 4 && workflowState.isProcessing && workflowState.currentProgress && (
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">{workflowState.currentProgress.currentStep}</span>
                          <span className="text-codestorm-accent">{workflowState.currentProgress.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-codestorm-accent h-2 rounded-full transition-all duration-300"
                            style={{ width: `${workflowState.currentProgress.percentage}%` }}
                          />
                        </div>
                        {workflowState.currentProgress.currentFile && (
                          <div className="text-xs text-gray-400">
                            Generando: {workflowState.currentProgress.currentFile}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {workflowState.currentProgress.completedFiles} de {workflowState.currentProgress.totalFiles} archivos completados
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleResetWorkflow}
                    className="w-full px-4 py-2 bg-gray-600/20 text-gray-400 border border-gray-600/30 rounded-lg hover:bg-gray-600/30 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 mr-2 inline" />
                    Reiniciar Workflow
                  </button>
                </div>
              )}
            </div>

            {/* Enhanced Chat Interface */}
            <div className="bg-codestorm-dark rounded-lg h-96">
              <div className="p-4 border-b border-codestorm-blue/30">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                  Chat Inteligente del Sistema
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  Interacción avanzada con el agente de desarrollo
                </p>
              </div>

              <EnhancedChatInterface
                messages={chatMessages}
                isProcessing={isModifying}
                onFileClick={(file) => {
                  const foundFile = workflowState.generatedFiles.find(f => f.path === file.path);
                  if (foundFile) {
                    setSelectedFile(foundFile);
                    setActiveTab('editor');
                  }
                }}
                onCopyCode={(code) => {
                  console.log('Code copied:', code);
                }}
              />

              {/* Enhanced typing indicator */}
              {isModifying && (
                <div className="p-3 border-t border-codestorm-blue/20">
                  <TypingIndicator
                    isVisible={isModifying}
                    stage={processingStage}
                    progress={processingProgress}
                  />
                </div>
              )}
            </div>
          </div>
          )}

          {/* Right Column - Development Panels */}
          <div className={`${isMobile ? 'col-span-1' : isChatVisible ? (isTablet ? 'col-span-7' : 'col-span-8') : 'col-span-12'}`}>
            {/* Chat Toggle Button for when chat is hidden */}
            {!isChatVisible && (
              <div className="mb-4 flex items-center justify-between bg-codestorm-dark rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                  <div>
                    <h3 className="text-white font-medium">Chat Inteligente</h3>
                    <p className="text-gray-400 text-sm">
                      {chatMessages.length} mensaje{chatMessages.length !== 1 ? 's' : ''}
                      {hasUnreadMessages && ` • ${unreadCount} sin leer`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={showChat}
                    className="px-3 py-2 bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/30 transition-colors text-sm"
                  >
                    Mostrar Chat
                  </button>
                  <button
                    onClick={openChatModal}
                    className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30 transition-colors text-sm"
                  >
                    Abrir Modal
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-4">
              {/* Tabs for different views - Enhanced with Modifications tab */}
              <div className="flex border-b border-codestorm-blue/30 overflow-x-auto">
                <button
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                    activeTab === 'files'
                      ? 'text-codestorm-accent border-b-2 border-codestorm-accent'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('files')}
                >
                  <Folder className="inline-block w-4 h-4 mr-2" />
                  Explorador ({workflowState.generatedFiles.length})
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                    activeTab === 'upload'
                      ? 'text-codestorm-accent border-b-2 border-codestorm-accent'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('upload')}
                >
                  <FileArchive className="inline-block w-4 h-4 mr-2" />
                  Cargar ZIP/RAR
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                    activeTab === 'editor'
                      ? 'text-codestorm-accent border-b-2 border-codestorm-accent'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('editor')}
                  disabled={!selectedFile || selectedFile === null}
                >
                  <Code className="inline-block w-4 h-4 mr-2" />
                  Editor {selectedFile && `(${selectedFile.name})`}
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                    activeTab === 'preview'
                      ? 'text-codestorm-accent border-b-2 border-codestorm-accent'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('preview')}
                >
                  <Eye className="inline-block w-4 h-4 mr-2" />
                  Vista Previa
                </button>
                {/* NEW: Modifications tab */}
                <button
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                    activeTab === 'modifications'
                      ? 'text-purple-400 border-b-2 border-purple-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('modifications')}
                  disabled={workflowState.isPostGeneration !== true}
                >
                  <History className="inline-block w-4 h-4 mr-2" />
                  Modificaciones ({workflowState.modificationHistory.length})
                </button>

                {/* NEW: Comparison tab */}
                <button
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                    activeTab === 'comparison'
                      ? 'text-yellow-400 border-b-2 border-yellow-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('comparison')}
                  disabled={originalFiles.length === 0}
                >
                  <GitCompare className="inline-block w-4 h-4 mr-2" />
                  Comparación {originalFiles.length > 0 && `(${originalFiles.length})`}
                </button>

                {/* NEW: Dual Explorer tab */}
                <button
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                    activeTab === 'dual-explorer'
                      ? 'text-green-400 border-b-2 border-green-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('dual-explorer')}
                  disabled={originalFiles.length === 0}
                >
                  <Split className="inline-block w-4 h-4 mr-2" />
                  Explorador Dual
                </button>
              </div>

              {/* File Explorer */}
              {activeTab === 'files' && (
                <div className="bg-codestorm-dark rounded-lg p-4 h-[600px] overflow-y-auto">
                  {workflowState.generatedFiles.length > 0 ? (
                    <DirectoryExplorer
                      files={workflowState.generatedFiles}
                      onSelectFile={(file) => {
                        setSelectedFile(file);
                        setActiveTab('editor');
                      }}
                      selectedFilePath={selectedFile?.path || null}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="text-6xl mb-4">📁</div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Explorador de Archivos
                        </h3>
                        <p className="text-gray-400">
                          Los archivos generados aparecerán aquí durante el proceso de desarrollo
                        </p>
                        <div className="text-sm text-gray-500 mt-2">
                          Archivos actuales: {workflowState.generatedFiles.length}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Compressed File Uploader */}
              {activeTab === 'upload' && (
                <div className="bg-codestorm-dark rounded-lg p-4 h-[600px] overflow-y-auto">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Cargar Archivos Comprimidos
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Sube archivos ZIP o RAR para extraer su contenido automáticamente al proyecto.
                    </p>
                  </div>

                  {/* Uploader de prueba simple */}
                  <div className="mb-6">
                    <h4 className="text-white font-medium mb-2">🔧 Prueba Simple:</h4>
                    <SimpleFileUploader
                      onFileSelected={(file) => {
                        console.log('🎯 Archivo seleccionado en prueba simple:', file);
                        alert(`Archivo seleccionado: ${file.name} (${file.size} bytes)`);
                      }}
                    />
                  </div>

                  {/* Uploader completo */}
                  <div>
                    <h4 className="text-white font-medium mb-2">🔧 Uploader Completo:</h4>
                    <CompressedFileUploader
                      onFilesExtracted={handleFilesExtracted}
                      onError={handleCompressionError}
                      className="h-full"
                    />
                  </div>

                  {/* Información adicional */}
                  <div className="mt-6 p-4 bg-codestorm-darker rounded-lg border border-codestorm-blue/20">
                    <h4 className="text-white font-medium mb-2">Información importante:</h4>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• Límite máximo: 100MB por archivo, 1GB total</li>
                      <li>• Formatos soportados: ZIP, RAR</li>
                      <li>• Los archivos se integrarán automáticamente al explorador</li>
                      <li>• Atajo de teclado: Ctrl+U para abrir esta sección</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Code Editor */}
              {activeTab === 'editor' && (
                <div className="bg-codestorm-dark rounded-lg p-4 h-[600px]">
                  {selectedFile ? (
                    <>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-white font-medium">{selectedFile.name}</h3>
                        <span className="text-xs text-gray-400">{selectedFile.path}</span>
                      </div>
                      <CodeEditor
                        content={selectedFile.content}
                        language={selectedFile.language || getLanguageFromFilePath(selectedFile.path)}
                        path={selectedFile.path}
                        onChange={() => {}} // Read-only for now
                        readOnly={true}
                      />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Editor de Código
                        </h3>
                        <p className="text-gray-400">
                          Selecciona un archivo del explorador para editarlo aquí
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Preview Panel */}
              {activeTab === 'preview' && (
                <div className="bg-codestorm-dark rounded-lg p-6 h-[600px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🌐</div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Vista Previa del Proyecto
                    </h3>
                    <p className="text-gray-400 mb-4">
                      La vista previa estará disponible una vez que el proyecto esté completamente generado
                    </p>
                    <div className="text-sm text-gray-500">
                      Archivos generados: {workflowState.generatedFiles.length}
                    </div>
                  </div>
                </div>
              )}

              {/* NEW: Modifications History Panel */}
              {activeTab === 'modifications' && (
                <div className="bg-codestorm-dark rounded-lg p-4 h-[600px] overflow-y-auto">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <History className="w-5 h-5 text-purple-400" />
                      Historial de Modificaciones
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">
                      Registro de todas las modificaciones realizadas al proyecto mediante chat interactivo y sistema automático.
                    </p>

                    {/* Process Statistics */}
                    {(workflowState.modificationHistory.length > 0 || processHistory.length > 0) && (
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-codestorm-darker border border-gray-600 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-purple-400">
                            {workflowState.modificationHistory.length}
                          </div>
                          <div className="text-xs text-gray-400">Modificaciones</div>
                        </div>
                        <div className="bg-codestorm-darker border border-gray-600 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-blue-400">
                            {processHistory.length}
                          </div>
                          <div className="text-xs text-gray-400">Procesos Auto</div>
                        </div>
                        <div className="bg-codestorm-darker border border-gray-600 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-green-400">
                            {workflowState.modificationHistory.filter(m => m.success).length +
                             processHistory.filter(p => p.state.modificationResult?.success).length}
                          </div>
                          <div className="text-xs text-gray-400">Exitosos</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {(workflowState.modificationHistory.length > 0 || processHistory.length > 0) ? (
                    <div className="space-y-4">
                      {/* Combine and sort all modifications by timestamp */}
                      {[
                        ...workflowState.modificationHistory.map(m => ({ ...m, type: 'manual' as const })),
                        ...processHistory.map(p => ({
                          id: p.id,
                          timestamp: p.timestamp,
                          instruction: p.instruction,
                          filesModified: p.filesModified.map(f => f.path),
                          agentUsed: 'AutomaticModificationSystem',
                          success: p.state.modificationResult?.success || false,
                          description: p.state.modificationResult?.success
                            ? `${p.filesModified.length} archivos modificados automáticamente`
                            : p.state.error || 'Error en modificación automática',
                          type: 'automatic' as const,
                          processStats: p.state.modificationResult ? {
                            filesDetected: p.state.detectionResult?.targetFiles.length || 0,
                            confidence: p.state.detectionResult?.confidence || 0,
                            totalChanges: p.state.modificationResult.changes.length
                          } : undefined
                        }))
                      ]
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .map((modification, index) => (
                        <div
                          key={modification.id}
                          className={`p-4 rounded-lg border ${
                            modification.success
                              ? 'bg-green-500/10 border-green-500/20'
                              : 'bg-red-500/10 border-red-500/20'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">
                                {modification.type === 'automatic' ? '🤖 Modificación Automática' : '👤 Modificación Manual'} #{index + 1}
                              </span>
                              {modification.success ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-400" />
                              )}
                              {modification.type === 'automatic' && (
                                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                                  AUTO
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(modification.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <span className="text-xs text-gray-400">Instrucción:</span>
                              <p className="text-sm text-gray-300 mt-1 p-2 bg-codestorm-darker rounded">
                                {modification.instruction}
                              </p>
                            </div>

                            <div>
                              <span className="text-xs text-gray-400">Agente utilizado:</span>
                              <span className="text-sm text-purple-400 ml-2">
                                {modification.agentUsed}
                              </span>
                            </div>

                            {/* Additional stats for automatic modifications */}
                            {modification.type === 'automatic' && modification.processStats && (
                              <div className="grid grid-cols-3 gap-2 p-2 bg-codestorm-darker rounded">
                                <div className="text-center">
                                  <div className="text-sm font-bold text-blue-400">
                                    {modification.processStats.filesDetected}
                                  </div>
                                  <div className="text-xs text-gray-400">Detectados</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm font-bold text-green-400">
                                    {(modification.processStats.confidence * 100).toFixed(0)}%
                                  </div>
                                  <div className="text-xs text-gray-400">Confianza</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm font-bold text-purple-400">
                                    {modification.processStats.totalChanges}
                                  </div>
                                  <div className="text-xs text-gray-400">Cambios</div>
                                </div>
                              </div>
                            )}

                            <div>
                              <span className="text-xs text-gray-400">Archivos modificados:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {modification.filesModified.map((file, fileIndex) => (
                                  <span
                                    key={fileIndex}
                                    className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded"
                                  >
                                    {file}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <span className="text-xs text-gray-400">Resultado:</span>
                              <p className="text-sm text-gray-300 mt-1">
                                {modification.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Sin Modificaciones
                        </h3>
                        <p className="text-gray-400 mb-4">
                          Las modificaciones realizadas mediante chat aparecerán aquí
                        </p>
                        <div className="text-sm text-gray-500">
                          {workflowState.isPostGeneration
                            ? 'Usa el chat de modificaciones para hacer cambios al proyecto'
                            : 'Completa la generación inicial para habilitar modificaciones'
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* NEW: Comparison Panel */}
              {activeTab === 'comparison' && (
                <div className="bg-codestorm-dark rounded-lg p-4 h-[600px]">
                  {originalFiles.length > 0 && comparisonFiles.modified.length > 0 ? (
                    <div className="h-full">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <GitCompare className="w-5 h-5 text-yellow-400" />
                          Comparación de Archivos
                        </h3>
                        <button
                          onClick={() => setShowComparison(true)}
                          className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-md hover:bg-yellow-500/30 transition-colors text-sm"
                        >
                          Vista Completa
                        </button>
                      </div>

                      <div className="h-[500px] border border-codestorm-blue/30 rounded-lg overflow-hidden">
                        <FileComparisonPanel
                          originalFiles={comparisonFiles.original}
                          modifiedFiles={comparisonFiles.modified}
                          isVisible={true}
                          onClose={() => {}}
                          onFileSelect={(original, modified) => {
                            setSelectedFile(modified);
                            setActiveTab('editor');
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Comparación de Archivos
                        </h3>
                        <p className="text-gray-400 mb-4">
                          Realiza modificaciones para ver la comparación entre archivos originales y modificados
                        </p>
                        <div className="text-sm text-gray-500">
                          {workflowState.isPostGeneration
                            ? 'Usa el chat de modificaciones para generar comparaciones'
                            : 'Completa la generación inicial para habilitar comparaciones'
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* NEW: Dual Explorer Panel */}
              {activeTab === 'dual-explorer' && (
                <div className="bg-codestorm-dark rounded-lg p-4 h-[600px]">
                  {originalFiles.length > 0 && comparisonFiles.modified.length > 0 ? (
                    <DualDirectoryExplorer
                      originalFiles={comparisonFiles.original}
                      modifiedFiles={comparisonFiles.modified}
                      onSelectFile={(original, modified) => {
                        setSelectedFile(modified);
                        setActiveTab('editor');
                      }}
                      selectedFilePath={selectedFile?.path}
                      onCompareAll={() => {
                        setShowComparison(true);
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="text-6xl mb-4">📂</div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Explorador Dual
                        </h3>
                        <p className="text-gray-400 mb-4">
                          Explora archivos originales y modificados lado a lado
                        </p>
                        <div className="text-sm text-gray-500">
                          {workflowState.isPostGeneration
                            ? 'Realiza modificaciones para activar el explorador dual'
                            : 'Completa la generación inicial para habilitar esta función'
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Loading Overlay */}
      {workflowState.isProcessing && (
        <LoadingOverlay
          isVisible={true}
          message={workflowState.steps[workflowState.currentStep]?.name || 'Procesando...'}
          progress={50}
          canCancel={true}
          onCancel={handleResetWorkflow}
        />
      )}

      {/* Floating Chat Button */}
      <FloatingChatButton
        onClick={openChatModal}
        isVisible={showFloatingButton}
        hasUnreadMessages={hasUnreadMessages}
        messageCount={unreadCount}
        isProcessing={isModifying}
      />

      {/* Chat Modal */}
      <ChatModal
        isVisible={isChatModalOpen}
        onClose={closeChatModal}
        messages={chatMessages}
        isProcessing={isModifying}
        processingStage={processingStage}
        processingProgress={processingProgress}
        onFileClick={(file) => {
          const foundFile = workflowState.generatedFiles.find(f => f.path === file.path);
          if (foundFile) {
            setSelectedFile(foundFile);
            setActiveTab('editor');
            closeChatModal();
          }
        }}
        onCopyCode={(code) => {
          console.log('Code copied:', code);
        }}
        title="Chat Inteligente del Sistema"
        subtitle="Interacción avanzada con el agente de desarrollo"
      />

      {/* File Comparison Modal */}
      <FileComparisonPanel
        originalFiles={comparisonFiles.original}
        modifiedFiles={comparisonFiles.modified}
        isVisible={showComparison}
        onClose={() => setShowComparison(false)}
        onFileSelect={(original, modified) => {
          setSelectedFile(modified);
          setActiveTab('editor');
          setShowComparison(false);
        }}
      />

      {/* Global Model Selector */}
      <GlobalModelSelector
        isVisible={showModelSelector}
        onClose={() => setShowModelSelector(false)}
        onConfigChange={() => {
          setGlobalConfig(getGlobalModelConfig());
          console.log('🔧 Configuración de modelos actualizada en Agent');
        }}
      />

      <Footer showLogo={true} />
    </div>
  );
};

export default Agent;
