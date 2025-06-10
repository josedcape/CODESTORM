import React, { useState, useEffect } from 'react';
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
  Folder,
  Terminal,
  Code,
  Monitor,
  Archive,
  Bot
} from 'lucide-react';
import {
  FileItem,
  ChatMessage,
  ApprovalData,
  ProgressData,
  TechnologyStack
} from '../types';
import { generateUniqueId } from '../utils/idGenerator';
import { useUI } from '../contexts/UIContext';

import InteractiveChat from '../components/constructor/InteractiveChat';
import DirectoryExplorer from '../components/constructor/DirectoryExplorer';
import ErrorNotification from '../components/constructor/ErrorNotification';
import ProjectTemplateSelector from '../components/constructor/ProjectTemplateSelector';
import ApprovalInterface from '../components/constructor/ApprovalInterface';
import ProgressIndicator from '../components/constructor/ProgressIndicator';
import TechnologyStackCarousel from '../components/constructor/TechnologyStackCarousel';
import EnhancedPromptDialog from '../components/EnhancedPromptDialog';
import CodeEditor from '../components/constructor/CodeEditor';
import TerminalOutput from '../components/constructor/TerminalOutput';
import EnhancedPreviewPanel from '../components/constructor/EnhancedPreviewPanel';
import RepositoryImporter from '../components/constructor/RepositoryImporter';
import { ImportedRepository } from '../services/RepositoryImportService';
import APIStatusIndicator from '../components/APIStatusIndicator';
import NotificationSystem, { useNotifications } from '../components/NotificationSystem';

// Servicios y agentes
import { PromptEnhancerService } from '../services/PromptEnhancerService';
import { AIIterativeOrchestrator } from '../services/AIIterativeOrchestrator';

// Interfaces
export interface TemplateData {
  id: string;
  name: string;
  description: string;
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
  showEnhancePromptDialog: boolean;
  enhancedPrompt: string | null;
  originalInstruction: string | null;
  showTechnologyStackCarousel: boolean;
  selectedTechnologyStack: TechnologyStack | null;
  workflowStep: 'initial' | 'enhancing' | 'stack-selection' | 'template-selection' | 'processing';
}

// Instancias de servicios
const promptEnhancerInstance = new PromptEnhancerService();
const aiIterativeOrchestrator = AIIterativeOrchestrator.getInstance();

const Agent: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet, isCodeModifierVisible, toggleCodeModifier } = useUI();
  const notifications = useNotifications();

  const [aiConstructorState, setAIConstructorState] = useState<AIConstructorState>({
    currentAIAction: 'awaitingInput',
    projectFiles: [],
    isAIBusy: false,
    sessionId: `session-${Date.now()}`,
    showTemplateSelector: false,
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
    showEnhancePromptDialog: false,
    enhancedPrompt: null,
    originalInstruction: null,
    showTechnologyStackCarousel: false,
    selectedTechnologyStack: null,
    workflowStep: 'initial',
  });

  const [pendingApproval, setPendingApproval] = useState<ApprovalData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: generateUniqueId('welcome'),
      sender: 'ai-agent',
      content: `🤖 **Bienvenido al Sistema AGENT de CODESTORM**

¡Hola! Soy tu asistente de desarrollo inteligente. Estoy aquí para ayudarte a:

• **Crear proyectos completos** desde cero
• **Modificar código existente** con comandos naturales
• **Generar documentación** y optimizar rendimiento
• **Resolver problemas** y depurar errores

**Cómo empezar:**
1. Describe tu proyecto o tarea en lenguaje natural
2. Usa comandos como "crea una app web", "modifica el archivo X", "optimiza el código"
3. Revisa las respuestas y archivos generados en los paneles

**Estado del sistema:** Verificando APIs de IA... 🔄

¡Comencemos a construir algo increíble juntos!`,
      timestamp: Date.now(),
      type: 'notification',
    },
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [showHelpAssistant, setShowHelpAssistant] = useState(false);

  // Efecto de bienvenida
  useEffect(() => {
    const timer = setTimeout(() => {
      notifications.system(
        'Sistema AGENT Iniciado',
        'Todas las funcionalidades están disponibles. ¡Comienza describiendo tu proyecto!',
        5000
      );
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

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

  // Funciones básicas
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
      sender: 'ai',
      content: `Error durante ${stage}: ${message}`,
      timestamp: Date.now(),
      type: 'error',
      senderType: 'ai',
    });
  };

  // Función mejorada para enviar mensajes con procesamiento real
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || aiConstructorState.isAIBusy) return;

    const userMessage: ChatMessage = {
      id: generateUniqueId('user'),
      sender: 'user',
      content,
      timestamp: Date.now(),
      type: 'text'
    };
    addChatMessage(userMessage);

    // Marcar como ocupado
    setAIConstructorState(prev => ({
      ...prev,
      isAIBusy: true,
      currentAIAction: 'Analizando solicitud...'
    }));

    try {
      // Importar dinámicamente los servicios necesarios
      const { AIIterativeOrchestrator } = await import('../services/AIIterativeOrchestrator');
      const { default: AIModelManager } = await import('../services/AIModelManager');

      const orchestrator = AIIterativeOrchestrator.getInstance();
      const modelManager = AIModelManager.getInstance();

      // Mensaje de inicio de procesamiento
      addChatMessage({
        id: generateUniqueId('processing'),
        sender: 'ai-agent',
        content: `🤖 **AGENT**: Procesando tu solicitud: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"\n\nAnalizando con sistema de IA avanzado...`,
        timestamp: Date.now(),
        type: 'info'
      });

      setAIConstructorState(prev => ({
        ...prev,
        currentAIAction: 'Generando respuesta con IA...'
      }));

      // Intentar generar respuesta con el modelo de IA
      try {
        const response = await modelManager.generateContent(content, {
          temperature: 0.7,
          maxOutputTokens: 4096
        });

        if (response.success && response.content) {
          // Respuesta exitosa
          addChatMessage({
            id: generateUniqueId('ai-response'),
            sender: 'ai-agent',
            content: `✅ **Respuesta del Sistema AGENT**:\n\n${response.content}\n\n*Modelo usado: ${response.model}*`,
            timestamp: Date.now(),
            type: 'success'
          });

          // Notificación de éxito
          notifications.success(
            'IA Procesada Exitosamente',
            `Respuesta generada con ${response.model}`,
            3000
          );

          // Si la respuesta contiene código o archivos, procesarlos
          if (response.content.includes('```') || content.toLowerCase().includes('crear') || content.toLowerCase().includes('generar')) {
            setAIConstructorState(prev => ({
              ...prev,
              currentAIAction: 'Procesando archivos generados...'
            }));

            notifications.info(
              'Generando Archivos',
              'Procesando código y creando archivos del proyecto...',
              0
            );

            // Procesar con el orquestrador para generar archivos
            await orchestrator.processUserInstruction(content);
          }

        } else {
          // Error en la respuesta
          throw new Error(response.error || 'No se pudo generar respuesta');
        }

      } catch (aiError) {
        console.error('Error en generación de IA:', aiError);

        // Notificación de fallback
        notifications.warning(
          'Sistema de Fallback Activado',
          'La IA principal no está disponible. Usando sistema local.',
          5000
        );

        // Mensaje de fallback con información útil
        addChatMessage({
          id: generateUniqueId('fallback'),
          sender: 'ai-agent',
          content: `⚠️ **Sistema de Fallback Activado**\n\nLa IA principal no está disponible temporalmente, pero puedo ayudarte con:\n\n• **Análisis de tu solicitud**: "${content}"\n• **Sugerencias**: Intenta ser más específico sobre lo que necesitas\n• **Comandos disponibles**: crear, modificar, optimizar, documentar\n\n*Error: ${aiError instanceof Error ? aiError.message : 'Servicio no disponible'}*`,
          timestamp: Date.now(),
          type: 'warning'
        });

        // Intentar procesamiento básico con el orquestrador
        try {
          await orchestrator.processUserInstruction(content);
        } catch (orchestratorError) {
          console.error('Error en orquestrador:', orchestratorError);

          addChatMessage({
            id: generateUniqueId('basic-response'),
            sender: 'ai-agent',
            content: `🔧 **Procesamiento Básico**\n\nHe registrado tu solicitud: "${content}"\n\nPara obtener mejores resultados:\n1. Verifica tu conexión a internet\n2. Intenta comandos más específicos\n3. Usa el explorador de archivos para trabajar con código existente`,
            timestamp: Date.now(),
            type: 'info'
          });
        }
      }

    } catch (error) {
      console.error('Error general en handleSendMessage:', error);

      // Notificación de error
      notifications.error(
        'Error del Sistema',
        'No se pudo procesar la solicitud. Verifica tu conexión.',
        0
      );

      addChatMessage({
        id: generateUniqueId('error'),
        sender: 'ai-agent',
        content: `❌ **Error del Sistema**\n\nNo se pudo procesar tu solicitud debido a un error técnico.\n\n**Solicitud**: "${content}"\n**Error**: ${error instanceof Error ? error.message : 'Error desconocido'}\n\nPor favor, intenta nuevamente o usa comandos más simples.`,
        timestamp: Date.now(),
        type: 'error'
      });

    } finally {
      // Limpiar estado de ocupado
      setAIConstructorState(prev => ({
        ...prev,
        isAIBusy: false,
        currentAIAction: null
      }));
    }
  };

  // Funciones básicas para los handlers
  const handleOpenRepositoryImporter = () => {
    setAIConstructorState(prev => ({ ...prev, showRepositoryImporter: true }));
  };

  const handleCloseRepositoryImporter = () => {
    setAIConstructorState(prev => ({ ...prev, showRepositoryImporter: false }));
  };

  const handleRepositoryImported = (repository: ImportedRepository) => {
    setAIConstructorState(prev => ({
      ...prev,
      projectFiles: [...prev.projectFiles, ...repository.files],
      importedRepository: repository,
      showRepositoryImporter: false,
    }));
  };

  const handleViewFileContent = async (file: FileItem) => {
    setAIConstructorState(prev => ({
      ...prev,
      editorContent: file.content || '',
      currentFilePath: file.path,
      activeTab: 'editor'
    }));
  };

  const handleToggleHelpAssistant = () => {
    setShowHelpAssistant(prev => !prev);
  };

  // Handlers básicos para aprobaciones
  const handleApprove = (feedback?: string) => {
    addChatMessage({
      id: generateUniqueId('approval'),
      sender: 'user',
      content: `Plan aprobado${feedback ? `: ${feedback}` : '.'}`,
      timestamp: Date.now(),
      type: 'approval-response'
    });
  };

  const handleReject = (feedback: string) => {
    addChatMessage({
      id: generateUniqueId('rejection'),
      sender: 'user',
      content: `Plan rechazado: ${feedback}`,
      timestamp: Date.now(),
      type: 'approval-response'
    });
  };

  const handlePartialApprove = (approvedItems: string[], feedback?: string) => {
    addChatMessage({
      id: generateUniqueId('partial-approval'),
      sender: 'user',
      content: `Aprobación parcial de ${approvedItems.length} elementos`,
      timestamp: Date.now(),
      type: 'approval-response'
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-codestorm-darker">
      <Header showConstructorButton={false} />
      
      {/* Título prominente AGENT */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 shadow-lg">
        <div className="container mx-auto">
          <div className="flex items-center justify-center">
            <Bot className="w-8 h-8 text-white mr-3" />
            <h1 className="text-4xl font-bold text-white tracking-wide">AGENT</h1>
          </div>
          <p className="text-center text-white/90 mt-2 text-lg">
            Sistema de desarrollo inteligente con gestión de proyectos y planificación automática
          </p>

          {/* Indicador de estado de APIs */}
          <div className="flex justify-center mt-4">
            <APIStatusIndicator showDetails={true} />
          </div>
        </div>
      </div>

      <main className="container flex-1 px-4 py-4 mx-auto">
        <div className="p-6 mb-6 rounded-lg shadow-md bg-codestorm-dark">
          <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white mb-4 flex items-center`}>
            <Bot className="w-6 h-6 mr-2 text-purple-400" />
            Sistema AGENT Activo
          </h2>
          <p className="mb-2 text-gray-300">
            Describe tu proyecto, tarea o las modificaciones deseadas usando el sistema de agentes especializados.
          </p>

          {aiConstructorState.isAIBusy && (
            <div className="flex items-center p-3 mb-4 border rounded-md bg-purple-500/10 border-purple-500/30">
              <Loader className="w-5 h-5 mr-2 text-purple-400 animate-spin" />
              <p className="text-sm text-white">AGENT: {aiConstructorState.currentAIAction || 'procesando'}...</p>
            </div>
          )}
        </div>

        {/* Estructura de dos columnas para el AGENT */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-12 gap-6'}`}>
          {/* Columna Izquierda - Chat Interactivo */}
          <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-5' : 'col-span-4'}`}>
            <CollapsiblePanel
              title="Chat Interactivo con AGENT"
              type="terminal"
              isVisible={true}
              showCollapseButton={false}
            >
              <div className={`${isMobile ? 'h-[calc(100vh - 450px)]' : 'h-[calc(100vh - 200px)]'} relative`}>
                <InteractiveChat
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  isProcessing={aiConstructorState.isAIBusy}
                  isDisabled={false}
                  currentAgent={aiConstructorState.currentAgent || undefined}
                  processingMessage={aiConstructorState.currentAIAction || undefined}
                />
              </div>
            </CollapsiblePanel>
          </div>

          {/* Columna Derecha - Paneles de Desarrollo */}
          <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-7' : 'col-span-8'} space-y-4`}>
            {/* Tabs para cambiar entre paneles */}
            <div className="flex border-b border-purple-500/30">
              <button
                className={`px-4 py-2 text-sm font-medium ${aiConstructorState.activeTab === 'files' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setAIConstructorState(prev => ({ ...prev, activeTab: 'files' }))}
              >
                <Folder className="inline-block w-4 h-4 mr-2" />
                Explorador
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${aiConstructorState.activeTab === 'editor' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setAIConstructorState(prev => ({ ...prev, activeTab: 'editor' }))}
              >
                <Code className="inline-block w-4 h-4 mr-2" />
                Editor
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${aiConstructorState.activeTab === 'terminal' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setAIConstructorState(prev => ({ ...prev, activeTab: 'terminal' }))}
              >
                <Terminal className="inline-block w-4 h-4 mr-2" />
                Terminal
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${aiConstructorState.activeTab === 'preview' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setAIConstructorState(prev => ({ ...prev, activeTab: 'preview' }))}
              >
                <Monitor className="inline-block w-4 h-4 mr-2" />
                Vista Previa
              </button>
              <div className="flex-grow"></div>
              <button
                className="px-4 py-2 text-sm font-medium text-purple-400 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 rounded-md transition-colors"
                onClick={handleOpenRepositoryImporter}
                title="Importar repositorio comprimido (ZIP, RAR, etc.)"
              >
                <Archive className="inline-block w-4 h-4 mr-2" />
                Importar Repo
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
                language={getLanguageFromFilePath(aiConstructorState.currentFilePath)}
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
                onRefresh={() => {}}
                onError={(error) => {}}
                onSuccess={(message) => {}}
              />
            </div>
          </div>
        </div>
      </main>

      <BrandLogo size="md" showPulse={true} showGlow={true} />

      {/* Componentes adicionales */}
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

      <CodeModifierPanel
        isVisible={isCodeModifierVisible}
        onClose={toggleCodeModifier}
        files={aiConstructorState.projectFiles}
        onApplyChanges={(originalFile: FileItem, modifiedFile: FileItem) => {
          setAIConstructorState(prev => ({
            ...prev,
            projectFiles: prev.projectFiles.map(f =>
              f.id === originalFile.id ? modifiedFile : f
            )
          }));
          toggleCodeModifier();
        }}
      />

      <FloatingActionButtons
        onToggleChat={() => {}}
        onTogglePreview={() => setAIConstructorState(prev => ({ ...prev, activeTab: 'preview' }))}
        onToggleCodeModifier={toggleCodeModifier}
        onToggleHelpAssistant={handleToggleHelpAssistant}
        showChat={false}
        showCodeModifier={isCodeModifierVisible}
        showHelpAssistant={showHelpAssistant}
      />

      <Footer showLogo={true} />

      <RepositoryImporter
        isOpen={aiConstructorState.showRepositoryImporter}
        onClose={handleCloseRepositoryImporter}
        onRepositoryImported={handleRepositoryImported}
      />

      <HelpAssistant
        isOpen={showHelpAssistant}
        onClose={handleToggleHelpAssistant}
      />

      {/* Sistema de notificaciones */}
      <NotificationSystem
        notifications={notifications.notifications}
        onDismiss={notifications.dismissNotification}
        position="top-right"
        maxNotifications={3}
      />
    </div>
  );
};

export default Agent;
