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
import { generateUniqueId } from '../utils/idGenerator';
import { useUI } from '../contexts/UIContext';

import InteractiveChat from '../components/constructor/InteractiveChat';
import DirectoryExplorer from '../components/constructor/DirectoryExplorer';
import ErrorNotification from '../components/constructor/ErrorNotification';
import TechnologyStackCarousel from '../components/constructor/TechnologyStackCarousel';
import QuotaErrorNotification from '../components/QuotaErrorNotification';
import { TechnologyStack } from '../types/technologyStacks';

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
import { AIIterativeOrchestrator } from '../services/AIIterativeOrchestrator';

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

  const [pendingApproval, setPendingApproval] = useState<ApprovalData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);

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
  const [showQuotaError, setShowQuotaError] = useState(false);
  const [quotaErrorDetails, setQuotaErrorDetails] = useState('');

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
  }, []); // Eliminar dependencia de chatMessages para evitar re-renderizados infinitos

  const addChatMessage = (message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  };

  const handleError = (error: any, stage: string) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error durante ${stage}:`, error);

    // Detectar errores de cuota específicamente
    if (message.includes('429') || message.includes('quota') || message.includes('exceeded')) {
      setQuotaErrorDetails(message);
      setShowQuotaError(true);

      // Mensaje específico para errores de cuota en el chat
      addChatMessage({
        id: generateUniqueId('quota-err'),
        sender: 'system',
        content: `🚫 **Límite de API Alcanzado** - Se ha excedido la cuota de la API. El sistema intentó usar modelos alternativos. Por favor, espera 15-30 minutos e intenta nuevamente.`,
        timestamp: Date.now(),
        type: 'error',
        senderType: 'ai',
      });
    } else {
      // Error normal
      setErrorMessage(`Error en ${stage}: ${message}`);
      setShowError(true);
      addChatMessage({
        id: generateUniqueId('err'),
        sender: 'ai',
        content: `Error durante ${stage}: ${message}`,
        timestamp: Date.now(),
        type: 'error',
        senderType: 'ai',
      });
    }
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

// Función para manejar la selección de stacks tecnológicos
const handleStackSelection = async (stack: TechnologyStack) => {
  console.log('Stack seleccionado:', stack);

  // Convertir TechnologyStack a ProjectTemplate para compatibilidad
  const templateFromStack = {
    id: stack.id,
    name: stack.name,
    description: stack.description,
    icon: stack.icon,
    category: 'fullstack' as const,
    language: stack.technologies[0]?.name || 'JavaScript',
    frameworks: stack.technologies.map(tech => tech.name),
    structure: {
      directories: [],
      files: []
    },
    dependencies: stack.technologies.map(tech => ({
      name: tech.name,
      version: tech.version || 'latest',
      description: tech.role
    })),
    scripts: [],
    configuration: []
  };

  // Recuperar la instrucción (original o mejorada) del usuario
  const originalInstruction = localStorage.getItem('originalInstruction') || '';
  const enhancedInstruction = localStorage.getItem('enhancedInstruction') || '';
  const finalInstruction = enhancedInstruction || originalInstruction;

  // Validar que tenemos una instrucción válida
  if (!finalInstruction.trim()) {
    console.error('No se encontró instrucción válida para procesar');
    addChatMessage({
      id: generateUniqueId('error-no-instruction'),
      sender: 'system',
      content: '❌ Error: No se encontró una instrucción válida. Por favor, proporciona una descripción del proyecto antes de seleccionar el stack tecnológico.',
      timestamp: Date.now(),
      type: 'error'
    });
    return;
  }

  // Actualizar el estado con el stack seleccionado - MANTENER ESTADO PERSISTENTE
  setAIConstructorState(prev => ({
    ...prev,
    selectedTemplate: templateFromStack,
    showTemplateSelector: false,
    isAIBusy: true,
    currentAIAction: 'Iniciando proyecto con stack tecnológico...',
    showLoadingOverlay: true,
    currentAgent: 'planner',
    loadingProgress: 10
  }));

  // Añadir mensaje de selección de stack
  const userMessage = {
    id: generateUniqueId('stack-selected'),
    sender: 'user',
    content: `Stack tecnológico seleccionado: ${stack.name}`,
    timestamp: Date.now(),
    type: 'text'
  };
  addChatMessage(userMessage);

  // Mensaje informativo sobre la combinación de instrucción y stack
  const instructionType = enhancedInstruction ? 'instrucción mejorada' : 'instrucción original';
  addChatMessage({
    id: generateUniqueId('combining-instruction-stack'),
    sender: 'ai',
    content: `🚀 Excelente elección! Combinando tu ${instructionType} con el stack ${stack.name} para crear un proyecto optimizado con las mejores prácticas...`,
    timestamp: Date.now(),
    type: 'notification',
    senderType: 'ai',
  });

  try {
    // Crear instrucción mejorada con información del stack
    const stackInfo = `
Stack Tecnológico: ${stack.name}
Descripción: ${stack.description}
Tecnologías principales: ${stack.technologies.map(tech => `${tech.name} (${tech.role})`).join(', ')}
Nivel de dificultad: ${stack.difficultyLevel}
Casos de uso recomendados: ${stack.useCases.join(', ')}
Instrucciones de setup: ${stack.setupInstructions.join(' -> ')}
`;

    const combinedInstruction = `${finalInstruction}

Utiliza el siguiente stack tecnológico:
${stackInfo}

Genera archivos iniciales basados en las mejores prácticas para este stack.`;

    // Iniciar el proceso con el orquestrador iterativo usando la instrucción combinada
    await aiIterativeOrchestrator.processUserInstruction(combinedInstruction, stack.id);

    // Mensaje de éxito
    addChatMessage({
      id: generateUniqueId('stack-integration-success'),
      sender: 'system',
      content: `✅ Stack ${stack.name} integrado exitosamente. Iniciando generación de código...`,
      timestamp: Date.now(),
      type: 'success'
    });

  } catch (error) {
    console.error('Error en handleStackSelection:', error);

    // Restaurar estado en caso de error
    setAIConstructorState(prev => ({
      ...prev,
      selectedTemplate: null,
      showTemplateSelector: true,
      isAIBusy: false,
      currentAIAction: 'awaitingInput',
      showLoadingOverlay: false,
      currentAgent: null,
      loadingProgress: 0
    }));

    // Mostrar error específico
    addChatMessage({
      id: generateUniqueId('stack-selection-error'),
      sender: 'system',
      content: `❌ Error al procesar el stack ${stack.name}: ${error instanceof Error ? error.message : 'Error desconocido'}. Puedes intentar seleccionar otro stack o reintentar.`,
      timestamp: Date.now(),
      type: 'error'
    });

    handleError(error, 'la inicialización del proyecto con stack tecnológico');
  } finally {
    // Solo limpiar el estado de carga si no hubo error
    setAIConstructorState(prev => ({
      ...prev,
      isAIBusy: false,
      currentAIAction: 'awaitingInput',
      showLoadingOverlay: false,
      currentAgent: null,
      loadingProgress: 0
    }));

    // Limpiar las instrucciones del localStorage después de usarlas exitosamente
    localStorage.removeItem('originalInstruction');
    localStorage.removeItem('enhancedInstruction');
  }
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

    // Mostrar el selector de plantillas después de la primera instrucción del usuario
    // si aún no se ha seleccionado una plantilla y no es una modificación
    if (!aiConstructorState.showTemplateSelector && !aiConstructorState.selectedTemplate && !isModification) {
      // Guardar la instrucción original para combinarla con la plantilla después
      localStorage.setItem('originalInstruction', content);

      // Mostrar mensaje informativo sobre la selección de stack tecnológico
      addChatMessage({
        id: generateUniqueId('stack-prompt'),
        sender: 'ai',
        content: '🚀 ¡Perfecto! Ahora puedes seleccionar un stack tecnológico para tu proyecto. Tenemos stacks modernos como MERN, MEVN, Next.js, React Native, Flutter, JAMstack y muchos más. El stack se combinará con tu descripción para generar un proyecto optimizado.',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai',
      });

      // Mostrar el selector de plantillas
      setAIConstructorState(prev => ({
        ...prev,
        showTemplateSelector: true
      }));

      return; // Detener el flujo aquí hasta que se seleccione una plantilla
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

  // Métodos para manejar las aprobaciones
  const handleApprove = (feedback?: string) => {
    if (!pendingApproval) {
      console.warn('Se intentó aprobar, pero no hay una solicitud de aprobación pendiente');

      // Mostrar mensaje de error
      addChatMessage({
        id: generateUniqueId('approval-error'),
        sender: 'system',
        content: 'Error: No hay una solicitud de aprobación pendiente. Por favor, intenta nuevamente.',
        timestamp: Date.now(),
        type: 'error'
      });

      return;
    }

    console.log(`Aprobando solicitud con ID: ${pendingApproval.id}, tipo: ${pendingApproval.type}`);

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
      // Para planes completos, no necesitamos pasar approvedItems
      if (pendingApproval.metadata?.isCompletePlan) {
        // Llamar al método de aprobación del orquestrador sin approvedItems
        aiIterativeOrchestrator.handleApproval(pendingApproval.id, true, feedback);
      } else {
        // Para otros tipos de aprobación, usar todos los items como approvedItems
        const allItems = pendingApproval.items.map(item => item.id);
        aiIterativeOrchestrator.handleApproval(pendingApproval.id, true, feedback, allItems);
      }

      console.log('Solicitud de aprobación enviada correctamente');
    } catch (error) {
      console.error('Error al procesar la aprobación:', error);
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

  // Funciones para manejar errores de cuota
  const handleCloseQuotaError = () => {
    setShowQuotaError(false);
    setQuotaErrorDetails('');
  };

  const handleRetryAfterQuotaError = () => {
    setShowQuotaError(false);
    setQuotaErrorDetails('');

    // Mostrar mensaje de reintento
    addChatMessage({
      id: generateUniqueId('retry-after-quota'),
      sender: 'user',
      content: 'Reintentando después del error de cuota...',
      timestamp: Date.now(),
      type: 'text'
    });

    // Intentar procesar la última instrucción nuevamente
    const lastInstruction = localStorage.getItem('originalInstruction');
    if (lastInstruction) {
      handleSendMessage(lastInstruction);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-codestorm-darker">
      <Header showConstructorButton={false} />
      <main className="container flex-1 px-4 py-4 mx-auto">
        {aiConstructorState.showTemplateSelector && (
          <div className="p-6 mb-6 rounded-lg shadow-md bg-codestorm-dark">
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-white mb-3`}>
              🚀 Selecciona un Stack Tecnológico para tu Proyecto
            </h2>
            <div className="p-3 mb-4 border rounded-md bg-codestorm-blue/10 border-codestorm-blue/30">
              {(() => {
                const originalInstruction = localStorage.getItem('originalInstruction') || '';
                const enhancedInstruction = localStorage.getItem('enhancedInstruction') || '';
                const displayInstruction = enhancedInstruction || originalInstruction;
                const instructionType = enhancedInstruction ? 'Instrucción Mejorada' : 'Instrucción Original';

                return (
                  <>
                    <p className="text-sm text-white">
                      <span className="font-semibold">{instructionType}:</span> {displayInstruction}
                    </p>
                    {enhancedInstruction && (
                      <div className="mt-2 p-2 bg-green-900/20 border border-green-500/30 rounded">
                        <p className="text-xs text-green-400 flex items-center">
                          <span className="mr-1">✨</span>
                          Esta instrucción ha sido mejorada por el agente especializado para obtener mejores resultados.
                        </p>
                      </div>
                    )}
                    <p className="mt-2 text-sm text-codestorm-accent">
                      Selecciona el stack tecnológico perfecto para tu proyecto. Incluye tecnologías modernas, mejores prácticas y configuración optimizada.
                    </p>
                  </>
                );
              })()}
            </div>
            <TechnologyStackCarousel
              onSelectStack={handleStackSelection}
              selectedStackId={aiConstructorState.selectedTemplate?.id}
              className="mb-4"
            />
            <button
              onClick={() => handleTemplateSelection(null)}
              className="px-4 py-2 mt-4 text-sm text-white bg-gray-600 rounded-md hover:bg-gray-700">
              Continuar sin stack tecnológico
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
            <h2 className="mb-4 text-xl font-bold text-white">Aprobación Requerida</h2>
            <ApprovalInterface
              approvalData={pendingApproval}
              onApprove={handleApprove}
              onReject={handleReject}
              onPartialApprove={handlePartialApprove}
              isLoading={aiConstructorState.isAIBusy}
            />
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

      {/* Notificación de error de cuota */}
      <QuotaErrorNotification
        isVisible={showQuotaError}
        onClose={handleCloseQuotaError}
        onRetry={handleRetryAfterQuotaError}
        errorDetails={quotaErrorDetails}
      />
    </div>
  );
};

export default Constructor;