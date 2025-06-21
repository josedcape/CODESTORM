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
  Plus
} from 'lucide-react';
import {
  ChatMessage,
  FileItem
} from '../types';

// Simplified technology stack interface for Constructor
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

// Workflow step interface
interface WorkflowStep {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  icon: React.ReactNode;
}

// Simple workflow state
interface SimpleWorkflowState {
  currentStep: number;
  isProcessing: boolean;
  userInstruction: string;
  selectedStack: SimpleTechnologyStack | null;
  selectedTemplate: 'basic' | 'advanced' | null;
  steps: WorkflowStep[];
  generatedFiles: FileItem[];
  currentProgress: CodeGenerationProgress | null;
}

const Constructor: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useUI();

  // Code generation service
  const codeGenerationService = ConstructorCodeGenerationService.getInstance();

  // Initialize workflow steps
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
      description: 'Proyecto completado y listo',
      status: 'pending',
      icon: <CheckCircle className="w-4 h-4" />
    }
  ];

  // State management
  const [workflowState, setWorkflowState] = useState<SimpleWorkflowState>({
    currentStep: 0,
    isProcessing: false,
    userInstruction: '',
    selectedStack: null,
    selectedTemplate: null,
    steps: initialSteps,
    generatedFiles: [],
    currentProgress: null
  });

  // File explorer state
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'editor' | 'preview' | 'upload'>('files');
  const [showCompressedUploader, setShowCompressedUploader] = useState(false);

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

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: generateUniqueId('welcome'),
      sender: 'ai',
      content: '🚀 Bienvenido al Constructor de CODESTORM. Describe tu proyecto para comenzar el proceso de desarrollo paso a paso.',
      timestamp: Date.now(),
      type: 'notification',
      senderType: 'ai'
    },
  ]);

  // Input state
  const [userInput, setUserInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Test API connection
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

  // Setup code generation service listeners
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

  // Simple workflow progression
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

        return {
          ...prev,
          currentStep: nextStep,
          steps: newSteps
        };
      }

      return prev;
    });
  };

  // Technology stack options
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

  // Handle technology stack selection
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

  // Workflow handler functions
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

  // Handle template selection
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

  // Handle real code generation
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
          isProcessing: false
        }));

        // Reproducir sonido de éxito
        playSuccessSound().then(success => {
          if (success) {
            console.log('🔊 Sonido de éxito reproducido en Constructor');
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

        console.log('🔊 Sonido de éxito reproducido en Constructor');

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

        // Advance to completion
        setTimeout(() => {
          advanceWorkflow();
        }, 2000);
      } else {
        setChatMessages(prev => [...prev, {
          id: generateUniqueId('generation-error'),
          sender: 'ai',
          content: `❌ Error en la generación: ${result.error}`,
          timestamp: Date.now(),
          type: 'error',
          senderType: 'ai'
        }]);

        // Show partial results if any files were generated
        if (result.files.length > 0) {
          setWorkflowState(prev => ({
            ...prev,
            generatedFiles: result.files,
            isProcessing: false
          }));

          setChatMessages(prev => [...prev, {
            id: generateUniqueId('partial-success'),
            sender: 'ai',
            content: `⚠️ Generación parcial: ${result.files.length} archivos creados antes del error`,
            timestamp: Date.now(),
            type: 'warning',
            senderType: 'ai'
          }]);
        } else {
          setWorkflowState(prev => ({ ...prev, isProcessing: false }));
        }
      }
    } catch (error) {
      console.error('Error in code generation:', error);

      let errorMessage = 'Error desconocido';
      if (error instanceof Error) {
        if (error.message.includes('CONNECTION_REFUSED')) {
          errorMessage = 'No se pudo conectar con los servicios de IA. Verifique su conexión a internet.';
        } else if (error.message.includes('API')) {
          errorMessage = 'Error en la API de IA. Verifique las claves de API en las variables de entorno.';
        } else {
          errorMessage = error.message;
        }
      }

      setChatMessages(prev => [...prev, {
        id: generateUniqueId('generation-error'),
        sender: 'ai',
        content: `❌ Error inesperado: ${errorMessage}`,
        timestamp: Date.now(),
        type: 'error',
        senderType: 'ai'
      }]);

      // Offer retry option
      setChatMessages(prev => [...prev, {
        id: generateUniqueId('retry-suggestion'),
        sender: 'ai',
        content: '💡 Sugerencia: Verifique su conexión a internet y las claves API, luego intente nuevamente.',
        timestamp: Date.now(),
        type: 'info',
        senderType: 'ai'
      }]);

      setWorkflowState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleResetWorkflow = () => {
    setWorkflowState({
      currentStep: 0,
      isProcessing: false,
      userInstruction: '',
      selectedStack: null,
      selectedTemplate: null,
      steps: initialSteps,
      generatedFiles: [],
      currentProgress: null
    });
    setChatMessages([{
      id: generateUniqueId('reset'),
      sender: 'ai',
      content: '🔄 Workflow reiniciado. Puedes comenzar con una nueva instrucción.',
      timestamp: Date.now(),
      type: 'notification',
      senderType: 'ai'
    }]);
    setUserInput('');
    setSelectedFile(null);
    setActiveTab('files');
  };

  // Enhanced prompt functionality
  const handleEnhancePrompt = async () => {
    if (!userInput.trim()) return;

    setIsSubmitting(true);
    try {
      // Add user message showing original input
      setChatMessages(prev => [...prev, {
        id: generateUniqueId('enhance-original'),
        sender: 'user',
        content: `Mejorar prompt: "${userInput}"`,
        timestamp: Date.now(),
        type: 'text',
        senderType: 'user'
      }]);

      // Show enhancement in progress
      setChatMessages(prev => [...prev, {
        id: generateUniqueId('enhance-progress'),
        sender: 'ai',
        content: '✨ Mejorando tu instrucción para obtener mejores resultados...',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai'
      }]);

      // Simulate prompt enhancement
      setTimeout(() => {
        const enhancedPrompt = `${userInput} - Desarrollar con las mejores prácticas, código limpio, documentación completa, manejo de errores, y diseño responsive.`;
        setUserInput(enhancedPrompt);

        setChatMessages(prev => [...prev, {
          id: generateUniqueId('enhance-result'),
          sender: 'ai',
          content: `✅ Prompt mejorado: "${enhancedPrompt}"`,
          timestamp: Date.now(),
          type: 'success',
          senderType: 'ai'
        }]);
        setIsSubmitting(false);
      }, 1500);
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      setIsSubmitting(false);
    }
  };

  // Handle compressed file extraction
  const handleFilesExtracted = (extractedFiles: FileItem[]) => {
    setWorkflowState(prev => ({
      ...prev,
      generatedFiles: [...prev.generatedFiles, ...extractedFiles]
    }));

    // Add success message to chat
    setChatMessages(prev => [...prev, {
      id: generateUniqueId('files-extracted'),
      sender: 'ai',
      content: `✅ ${extractedFiles.length} archivos extraídos exitosamente del archivo comprimido`,
      timestamp: Date.now(),
      type: 'success',
      senderType: 'ai'
    }]);

    // Switch to files tab to show extracted files
    setActiveTab('files');
    setShowCompressedUploader(false);
  };

  // Handle compression errors
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

  // Toggle compressed file uploader
  const toggleCompressedUploader = () => {
    console.log('🔄 Toggling compressed uploader:', {
      currentState: showCompressedUploader,
      currentTab: activeTab,
      willShow: !showCompressedUploader,
      hasGeneratedFiles: workflowState.generatedFiles.length > 0
    });

    setShowCompressedUploader(!showCompressedUploader);

    if (!showCompressedUploader) {
      console.log('📁 Activating upload tab');
      setActiveTab('upload');

      // Si no hay archivos generados, crear algunos archivos dummy para mostrar el panel
      if (workflowState.generatedFiles.length === 0) {
        console.log('📂 No hay archivos generados, creando estructura temporal para mostrar uploader');
        // No necesitamos crear archivos dummy, solo asegurar que el panel se muestre
      }
    } else {
      console.log('📂 Returning to files tab');
      setActiveTab('files');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'Enter':
            event.preventDefault();
            handleSubmitInstruction();
            break;
          case 'r':
            event.preventDefault();
            handleResetWorkflow();
            break;
          case 'u':
            event.preventDefault();
            toggleCompressedUploader();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userInput, showCompressedUploader]);

  // Simple workflow progress component
  const WorkflowProgressComponent = () => (
    <div className="bg-codestorm-dark rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-white mb-4">Progreso del Desarrollo</h2>
      <div className="space-y-3">
        {workflowState.steps.map((step, index) => (
          <div key={step.id} className="flex items-center space-x-3">
            <div className={`flex-shrink-0 ${
              step.status === 'completed' ? 'text-green-400' :
              step.status === 'in-progress' ? 'text-codestorm-accent' :
              step.status === 'error' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {step.icon}
            </div>
            <div className="flex-1">
              <div className={`text-sm font-medium ${
                step.status === 'completed' ? 'text-green-400' :
                step.status === 'in-progress' ? 'text-codestorm-accent' :
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
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-codestorm-darker">
      <Header showConstructorButton={false} />

      <main className="container flex-1 px-4 py-4 mx-auto">
        {/* Workflow Progress */}
        <WorkflowProgressComponent />

        {/* Main Content */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-12 gap-6'}`}>
          {/* Left Column - Input and Chat */}
          <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-5' : 'col-span-4'}`}>
            <div className="bg-codestorm-dark rounded-lg p-6 mb-6">
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white mb-4`}>
                🚀 Constructor de CODESTORM
              </h1>
              <p className="text-gray-300 mb-4">
                Desarrollo paso a paso con aprobación en cada etapa
              </p>

              {/* API Connection Status */}
              <div className="mb-6 p-3 rounded-lg border border-gray-600/30 bg-gray-800/50">
                <div className="flex items-center justify-between">
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
              </div>

              {/* Input Section */}
              {workflowState.currentStep === 0 && (
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

                    {workflowState.currentStep === 4 && !workflowState.isProcessing && (
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

            {/* Chat Messages */}
            <div className="bg-codestorm-dark rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Mensajes del Sistema</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-codestorm-accent/20 text-white ml-4'
                        : 'bg-codestorm-darker text-gray-300 mr-4'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        message.sender === 'user' ? 'bg-codestorm-accent' : 'bg-green-400'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm">{message.content}</p>
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Development Panels */}
          <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-7' : 'col-span-8'}`}>
            <div className="space-y-4">
              {/* Tabs for different views - Siempre visibles */}
              <div className="flex border-b border-codestorm-blue/30">
                <button
                  className={`px-4 py-2 text-sm font-medium ${
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
                  className={`px-4 py-2 text-sm font-medium ${
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
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'editor'
                      ? 'text-codestorm-accent border-b-2 border-codestorm-accent'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('editor')}
                  disabled={!selectedFile}
                >
                  <Code className="inline-block w-4 h-4 mr-2" />
                  Editor {selectedFile && `(${selectedFile.name})`}
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'preview'
                      ? 'text-codestorm-accent border-b-2 border-codestorm-accent'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('preview')}
                >
                  <Eye className="inline-block w-4 h-4 mr-2" />
                  Vista Previa
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

              {/* Compressed File Uploader - Siempre disponible */}
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
            </div>
          </div>
        </div>
      </main>

      <BrandLogo size="md" showPulse={true} showGlow={true} />

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

      <Footer showLogo={true} />
    </div>
  );
};

export default Constructor;
