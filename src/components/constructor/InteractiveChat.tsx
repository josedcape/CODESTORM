import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChatMessage, ApprovalStage } from '../../types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { generateUniqueId } from '../../utils/idGenerator';
import { useUI } from '../../contexts/UIContext';
import { useAudioIntegration } from '../../hooks/useAudioIntegration';
import VoiceInputButton from '../audio/VoiceInputButton';
import StormIndicator from '../audio/StormIndicator';
import AudioControls from '../audio/AudioControls';
import {
  Send,
  User,
  Bot,
  Bell,
  Clock,
  Edit,
  Check,
  X,
  Copy,
  Trash,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  History,
  Info,
  Layers,
  MessageSquare,
  Eye,
  EyeOff,
  FileText,
  AlertCircle,
  CheckCircle,
  Code
} from 'lucide-react';
import { PromptEnhancerService, EnhancedPrompt } from '../../services/PromptEnhancerService';
import { SpecializedEnhancerService, SpecializedEnhanceResult } from '../../services/SpecializedEnhancerService';
import { nativeVoiceRecognitionService } from '../../services/NativeVoiceRecognitionService';
import EnhancedPromptDialog from '../../components/EnhancedPromptDialog';
import EnhancementHistoryPanel from '../../components/EnhancementHistoryPanel';
import StageSidebar from './StageSidebar';
import TypingIndicator from '../ui/TypingIndicator';

interface InteractiveChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  isProcessing: boolean;
  currentStage?: ApprovalStage | null;
  onApproveStage?: (stageId: string, feedback?: string) => void;
  onModifyStage?: (stageId: string, feedback: string) => void;
  onRejectStage?: (stageId: string, feedback: string) => void;
  isPaused?: boolean;
  isDisabled?: boolean;
  currentAgent?: string;
  processingMessage?: string;
}

// Número de mensajes recientes que se mostrarán expandidos por defecto
const DEFAULT_EXPANDED_MESSAGES = 4;

const InteractiveChat: React.FC<InteractiveChatProps> = ({
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  isProcessing,
  currentStage = null,
  onApproveStage,
  onModifyStage,
  onRejectStage,
  isPaused = false,
  isDisabled = false,
  currentAgent,
  processingMessage
}) => {
  const [inputValue, setInputValue] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showHistory, setShowHistory] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Estado para la funcionalidad de mejora de prompts
  const [enhancePromptEnabled, setEnhancePromptEnabled] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [currentEnhancedPrompt, setCurrentEnhancedPrompt] = useState<EnhancedPrompt | null>(null);
  const [showEnhancedPromptDialog, setShowEnhancedPromptDialog] = useState(false);
  const [showEnhancementHistory, setShowEnhancementHistory] = useState(false);
  const [currentSpecializedResult, setCurrentSpecializedResult] = useState<SpecializedEnhanceResult | null>(null);

  // Estado para la ventana lateral de etapas
  const [showStageSidebar, setShowStageSidebar] = useState(false);

  // Estados para el sistema de colapso de mensajes
  const [collapsedMessageIds, setCollapsedMessageIds] = useState<Set<string>>(new Set());
  const [expandAllMessages, setExpandAllMessages] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());

  // Hook para responsividad
  const { isMobile, isTablet } = useUI();

  // Hook para integración de audio
  const audio = useAudioIntegration({
    enableSpeechSynthesis: true,
    enableSoundEffects: true,
    enableVoiceRecognition: true,
    autoSpeakResponses: false,
    playMessageSounds: true
  });

  // Estados adicionales para audio
  const [showAudioControls, setShowAudioControls] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll al final de los mensajes cuando se añade uno nuevo
  useEffect(() => {
    if (showHistory && chatContainerRef.current) {
      // Solo hacer scroll automático si el usuario está cerca del final
      const container = chatContainerRef.current;
      const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;

      if (isNearBottom) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
      }
    }
  }, [messages.length, showHistory]);

  // Efecto para marcar nuevos mensajes con animación
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];

      // Verificar si este mensaje ya fue procesado
      if (!newMessageIds.has(latestMessage.id)) {
        setNewMessageIds(prev => {
          const newSet = new Set(prev);
          newSet.add(latestMessage.id);
          return newSet;
        });

        // Reproducir sonido y síntesis de voz para respuestas del asistente
        if (latestMessage.sender === 'assistant' || latestMessage.sender === 'ai-agent') {
          audio.playMessageReceived();

          // Síntesis de voz para respuestas del asistente
          if (latestMessage.type === 'text' && latestMessage.content.length < 300) {
            audio.speakResponse(latestMessage.content);
          }
        }

        // Eliminar la marca de "nuevo" después de 2 segundos
        setTimeout(() => {
          setNewMessageIds(current => {
            const updatedSet = new Set(current);
            updatedSet.delete(latestMessage.id);
            return updatedSet;
          });
        }, 2000);
      }
    }
  }, [messages.length]);

  // Efecto para auto-colapsar mensajes antiguos cuando hay nuevos mensajes
  useEffect(() => {
    if (messages.length > DEFAULT_EXPANDED_MESSAGES && !expandAllMessages) {
      const messageIdsToCollapse = messages
        .slice(0, messages.length - DEFAULT_EXPANDED_MESSAGES)
        .map(msg => msg.id);

      setCollapsedMessageIds(new Set(messageIdsToCollapse));
    }
  }, [messages.length, expandAllMessages]);

  // Función para enviar un mensaje
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    // Reproducir sonido de envío
    audio.playMessageSent();

    // Si la mejora de prompts está habilitada, mejorar el prompt
    if (enhancePromptEnabled && !isEnhancing) {
      setIsEnhancing(true);
      audio.playProcessStart();

      try {
        // Usar el servicio especializado que detecta automáticamente el contexto Constructor
        const result = await SpecializedEnhancerService.enhanceWithSpecializedAgent(inputValue, 'constructor');

        if (result.success && result.enhancedPrompt) {
          setCurrentEnhancedPrompt(result.enhancedPrompt);
          setCurrentSpecializedResult(result);
          setShowEnhancedPromptDialog(true);
          audio.playProcessComplete();

          console.log('⚙️ Constructor: Prompt mejorado con agente especializado para aplicaciones complejas');
        } else {
          // Si hay un error, enviar el mensaje original
          onSendMessage(inputValue);
          setInputValue('');
          audio.playError();
        }
      } catch (error) {
        console.error('Error al mejorar el prompt con agente especializado:', error);
        // En caso de error, enviar el mensaje original
        onSendMessage(inputValue);
        setInputValue('');
        audio.playError();
      } finally {
        setIsEnhancing(false);
      }
    } else {
      // Si la mejora de prompts está deshabilitada, enviar el mensaje original
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  // Función para usar el prompt original
  const handleUseOriginalPrompt = () => {
    if (currentEnhancedPrompt) {
      onSendMessage(currentEnhancedPrompt.originalPrompt);
      setShowEnhancedPromptDialog(false);
      setCurrentEnhancedPrompt(null);
    }
  };

  // Función para usar el prompt mejorado
  const handleUseEnhancedPrompt = () => {
    if (currentEnhancedPrompt) {
      onSendMessage(currentEnhancedPrompt.enhancedPrompt);
      setShowEnhancedPromptDialog(false);
      setCurrentEnhancedPrompt(null);
    }
  };

  // Función para alternar la mejora de prompts
  const toggleEnhancePrompt = () => {
    setEnhancePromptEnabled(!enhancePromptEnabled);
  };

  // Funciones para reconocimiento de voz
  const handleVoiceTranscript = (transcript: string) => {
    setVoiceTranscript(transcript);
    setInputValue(transcript);
  };

  const handleVoiceFinalTranscript = (transcript: string) => {
    setInputValue(transcript);
    setVoiceTranscript('');
  };

  const handleStormCommand = (command: string) => {
    setInputValue(command);
    // Auto-enviar comando STORM inmediatamente
    setTimeout(() => {
      if (command.trim()) {
        onSendMessage(command);
        setInputValue('');
        audio.playMessageSent();
      }
    }, 100);
  };

  // Configurar callback automático para STORM
  useEffect(() => {
    nativeVoiceRecognitionService.setStormCommandCallback(handleStormCommand);

    return () => {
      nativeVoiceRecognitionService.removeStormCommandCallback();
    };
  }, []);

  // Función para mostrar el historial de mejoras
  const showEnhancementHistoryPanel = () => {
    setShowEnhancementHistory(true);
  };

  // Función para usar un prompt del historial
  const usePromptFromHistory = (prompt: string) => {
    setInputValue(prompt);
    setShowEnhancementHistory(false);
  };

  // Función para alternar la visibilidad de la ventana lateral de etapas
  const toggleStageSidebar = () => {
    setShowStageSidebar(prev => !prev);
  };

  // Función para alternar el colapso de un mensaje específico
  const toggleMessageCollapse = (messageId: string) => {
    setCollapsedMessageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // Función para alternar el colapso de todos los mensajes
  const toggleAllMessagesCollapse = () => {
    setExpandAllMessages(prev => !prev);
    if (!expandAllMessages) {
      // Si estamos expandiendo todos, vaciar el conjunto de mensajes colapsados
      setCollapsedMessageIds(new Set());
    } else {
      // Si estamos colapsando todos, colapsar todos excepto los últimos DEFAULT_EXPANDED_MESSAGES
      const messageIdsToCollapse = messages
        .slice(0, Math.max(0, messages.length - DEFAULT_EXPANDED_MESSAGES))
        .map(msg => msg.id);
      setCollapsedMessageIds(new Set(messageIdsToCollapse));
    }
  };

  // Función para manejar el envío con Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Función para limpiar el historial de mejoras
  const clearEnhancementHistory = () => {
    PromptEnhancerService.clearEnhancementHistory();
    setShowEnhancementHistory(false);
  };

  // Función para iniciar la edición de un mensaje
  const startEditing = (message: ChatMessage) => {
    if (message.sender !== 'user') return;
    setEditingMessageId(message.id);
    setEditValue(message.content);
  };

  // Función para guardar la edición de un mensaje
  const saveEdit = () => {
    if (!editingMessageId || !onEditMessage) return;
    onEditMessage(editingMessageId, editValue);
    setEditingMessageId(null);
    setEditValue('');
  };

  // Función para cancelar la edición de un mensaje
  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditValue('');
  };

  // Función para copiar el contenido de un mensaje
  const copyMessageContent = (message: ChatMessage) => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopiedMessageId(message.id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    });
  };

  // Función para renderizar el contenido de un mensaje
  const renderMessageContent = (message: ChatMessage) => {
    // Detectar si el contenido es muy largo
    const isLongContent = message.content.length > 500;

    if (message.type === 'code') {
      // Detectar el lenguaje del código
      const language = message.metadata?.language ||
                      (message.content.includes('<html') ? 'html' :
                       message.content.includes('function') ? 'javascript' :
                       message.content.includes('import ') ? 'javascript' :
                       message.content.includes('class ') ? 'javascript' :
                       message.content.includes('def ') ? 'python' : 'text');

      return (
        <div className="relative">
          <div className="absolute top-0 right-0 z-10 bg-codestorm-darker text-xs text-gray-400 px-2 py-0.5 rounded-bl">
            {language}
          </div>
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '0.75rem',
              paddingTop: '1.5rem', // Espacio para la etiqueta de lenguaje
              background: '#0a1120',
              borderRadius: '0.375rem',
              maxHeight: isLongContent ? '300px' : 'none',
              overflowY: isLongContent ? 'auto' : 'visible',
            }}
            showLineNumbers
            wrapLongLines={true}
          >
            {message.content}
          </SyntaxHighlighter>
        </div>
      );
    } else if (message.type === 'notification') {
      // Detectar si la notificación está relacionada con una etapa
      const isStageNotification =
        message.content.includes('etapa') ||
        message.content.includes('Etapa') ||
        message.metadata?.stageId;

      return (
        <div className="flex items-start">
          {isStageNotification ? (
            <Bell className="h-4 w-4 text-codestorm-gold mr-2 flex-shrink-0 mt-0.5" />
          ) : (
            <Bell className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
          )}
          <span className={`whitespace-pre-wrap ${isStageNotification ? 'text-codestorm-gold' : ''}`}>
            {message.content}
          </span>
        </div>
      );
    } else if (message.type === 'proposal') {
      // Intentar detectar si es JSON
      let isJson = false;
      try {
        JSON.parse(message.content);
        isJson = true;
      } catch {
        // No es JSON
      }

      if (isJson) {
        return (
          <div className="relative">
            <div className="absolute top-0 right-0 z-10 bg-codestorm-darker text-xs text-gray-400 px-2 py-0.5 rounded-bl">
              JSON
            </div>
            <SyntaxHighlighter
              language="json"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '0.75rem',
                paddingTop: '1.5rem',
                background: '#0a1120',
                borderRadius: '0.375rem',
                maxHeight: isLongContent ? '300px' : 'none',
                overflowY: isLongContent ? 'auto' : 'visible',
              }}
              showLineNumbers
            >
              {message.content}
            </SyntaxHighlighter>
          </div>
        );
      } else {
        return (
          <div className="p-3 whitespace-pre-wrap rounded-md bg-codestorm-darker">
            {message.content}
          </div>
        );
      }
    } else {
      // Mensaje de texto normal
      return (
        <div className={`whitespace-pre-wrap ${isLongContent ? 'max-h-[300px] overflow-y-auto pr-2' : ''}`}>
          {message.content}
        </div>
      );
    }
  };

  // Función para renderizar un mensaje
  const renderMessage = (message: ChatMessage) => {
    // Si estamos editando este mensaje, mostrar el formulario de edición
    if (editingMessageId === message.id) {
      return (
        <div className="p-3 border rounded-lg bg-codestorm-blue/20 border-codestorm-blue/40">
          <div className="flex items-center mb-2">
            <Edit className="w-4 h-4 mr-2 text-blue-400" />
            <span className="text-xs text-blue-400">Editando mensaje</span>
          </div>

          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full p-2 mb-2 text-sm text-white border rounded-md bg-codestorm-darker border-codestorm-blue/30"
            rows={3}
          />

          <div className="flex justify-end space-x-2">
            <button
              onClick={cancelEdit}
              className="px-3 py-1 text-xs text-white bg-gray-700 rounded-md hover:bg-gray-600"
            >
              <X className="inline w-3 h-3 mr-1" />
              <span>Cancelar</span>
            </button>
            <button
              onClick={saveEdit}
              className="px-3 py-1 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-500"
            >
              <Check className="inline w-3 h-3 mr-1" />
              <span>Guardar</span>
            </button>
          </div>
        </div>
      );
    }

    // Determinar el ancho máximo según el tipo de mensaje
    const getMaxWidth = () => {
      // Mensajes de código o con contenido largo necesitan más espacio
      if (message.type === 'code') {
        return 'max-w-[90%] sm:max-w-[85%]';
      }

      // Mensajes de notificación o sistema pueden ser más anchos
      if (message.type === 'notification' || message.sender === 'system') {
        return 'max-w-[90%] sm:max-w-[80%]';
      }

      // Mensajes normales
      return 'max-w-[80%] sm:max-w-[70%]';
    };

    // Determinar el estilo según el tipo de mensaje
    const getMessageStyle = () => {
      // Estilo base para todos los mensajes con animación de pulso
      let baseStyle = 'rounded-lg p-3 break-words transition-smooth';

      // Estilo según el remitente con animaciones específicas
      if (message.sender === 'user') {
        baseStyle += ' bg-codestorm-accent text-white chat-message-pulse-user';
      } else if (message.sender === 'system') {
        baseStyle += ' bg-codestorm-blue/10 text-gray-300 chat-message-pulse-system';
      } else {
        baseStyle += ' bg-codestorm-blue/20 text-white chat-message-pulse';
      }

      // Estilo adicional según el tipo de mensaje
      if (message.type === 'notification') {
        baseStyle += ' border-l-2 border-l-yellow-500 chat-message-pulse-warning';
        // Remover animaciones anteriores para usar la específica
        baseStyle = baseStyle.replace('chat-message-pulse-user', '').replace('chat-message-pulse-system', '').replace('chat-message-pulse ', '');
      } else if (message.type === 'code') {
        baseStyle += ' font-mono';
        // Remover la animación de usuario/sistema para código y usar la específica
        baseStyle = baseStyle.replace('chat-message-pulse-user', '').replace('chat-message-pulse-system', '').replace('chat-message-pulse ', '');
        baseStyle += ' chat-message-pulse-code';
      } else if (message.type === 'error') {
        baseStyle += ' chat-message-pulse-error';
        // Remover animaciones anteriores para usar la específica
        baseStyle = baseStyle.replace('chat-message-pulse-user', '').replace('chat-message-pulse-system', '').replace('chat-message-pulse ', '');
      } else if (message.type === 'success') {
        baseStyle += ' chat-message-pulse-success';
        // Remover animaciones anteriores para usar la específica
        baseStyle = baseStyle.replace('chat-message-pulse-user', '').replace('chat-message-pulse-system', '').replace('chat-message-pulse ', '');
      } else if (message.metadata?.requiresAction) {
        baseStyle += ' border-l-2 border-l-codestorm-gold chat-message-pulse-important';
        // Remover animaciones anteriores para usar la específica
        baseStyle = baseStyle.replace('chat-message-pulse-user', '').replace('chat-message-pulse-system', '').replace('chat-message-pulse ', '');
      }

      return baseStyle;
    };

    return (
      <div
        className={`${getMaxWidth()} ${getMessageStyle()} shadow-sm`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {message.sender === 'user' ? (
              <User className="w-4 h-4 mr-2 text-white" />
            ) : message.sender === 'system' ? (
              <Bell className="w-4 h-4 mr-2 text-gray-400" />
            ) : (
              <Bot className="w-4 h-4 mr-2 text-codestorm-gold" />
            )}
            <span className="text-xs opacity-70">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>

            {/* Etiqueta para el tipo de mensaje */}
            {message.type !== 'text' && (
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded-sm bg-black/20 text-gray-300">
                {message.type === 'code' ? 'código' :
                 message.type === 'notification' ? 'notificación' :
                 message.type === 'proposal' ? 'propuesta' : ''}
              </span>
            )}
          </div>

          <div className="flex ml-2 space-x-1">
            {message.sender === 'user' && onEditMessage && (
              <button
                onClick={() => startEditing(message)}
                className="p-1 rounded hover:bg-black/20 text-white/70 hover:text-white"
                title="Editar mensaje"
              >
                <Edit className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={() => copyMessageContent(message)}
              className="p-1 rounded hover:bg-black/20 text-white/70 hover:text-white"
              title="Copiar contenido"
            >
              {copiedMessageId === message.id ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>

            {message.sender === 'user' && onDeleteMessage && (
              <button
                onClick={() => onDeleteMessage(message.id)}
                className="p-1 rounded hover:bg-black/20 text-white/70 hover:text-white"
                title="Eliminar mensaje"
              >
                <Trash className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className={`text-sm ${message.type === 'code' ? 'overflow-x-auto' : ''}`}>
          {renderMessageContent(message)}
        </div>

        {message.metadata?.requiresAction && (
          <div className="mt-2 text-xs bg-yellow-500/20 text-yellow-400 p-1.5 rounded flex items-center">
            <Bell className="w-3 h-3 mr-1" />
            <span>Requiere tu acción</span>
          </div>
        )}

        {/* Referencia a etapa si existe */}
        {message.metadata?.stageId && (
          <div className="mt-2 text-xs bg-codestorm-blue/20 text-blue-300 p-1.5 rounded flex items-center">
            <Info className="w-3 h-3 mr-1" />
            <span>Relacionado con una etapa del proyecto</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`
      flex flex-col h-full border rounded-lg shadow-md bg-codestorm-dark border-codestorm-blue/30 overflow-hidden
      ${isMobile ? 'mobile-chat-container mobile-safe-area' : ''}
    `}>
      <div className={`
        flex items-center justify-between border-b border-codestorm-blue/30 flex-shrink-0
        ${isMobile ? 'p-2' : 'p-3'}
      `}>
        <h2 className={`font-medium text-white ${isMobile ? 'text-xs' : 'text-sm'}`}>Chat Interactivo</h2>

        <div className={`flex ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
          {/* Controles de audio compactos */}
          <AudioControls
            compact={true}
            className={isMobile ? 'scale-90' : ''}
          />

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`
              rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white
              transition-all duration-200 -webkit-tap-highlight-color: transparent
              ${isMobile ? 'p-1 min-w-[32px] min-h-[32px]' : 'p-1.5'}
            `}
            title={showHistory ? 'Ocultar historial' : 'Mostrar historial'}
          >
            {showHistory ? (
              <ChevronDown className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
            ) : (
              <ChevronUp className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
            )}
          </button>

          <button
            onClick={toggleAllMessagesCollapse}
            className={`
              rounded hover:bg-codestorm-blue/20 hover:text-white
              transition-all duration-200 -webkit-tap-highlight-color: transparent
              ${isMobile ? 'p-1 min-w-[32px] min-h-[32px]' : 'p-1.5'}
              ${expandAllMessages ? 'text-codestorm-gold' : 'text-gray-400'}
            `}
            title={expandAllMessages ? 'Colapsar mensajes antiguos' : 'Expandir todos los mensajes'}
          >
            {expandAllMessages ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={showEnhancementHistoryPanel}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title="Historial de mejoras"
          >
            <History className="w-4 h-4" />
          </button>

          {currentStage && onApproveStage && onModifyStage && onRejectStage && (
            <button
              onClick={toggleStageSidebar}
              className={`p-1.5 rounded ${showStageSidebar ? 'bg-codestorm-accent text-white' : 'text-gray-400 hover:bg-codestorm-blue/20 hover:text-white'}`}
              title={showStageSidebar ? 'Ocultar etapa actual' : 'Mostrar etapa actual'}
            >
              <Layers className="w-4 h-4" />
            </button>
          )}

          {onDeleteMessage && (
            <button
              onClick={() => {
                if (window.confirm('¿Estás seguro de que quieres limpiar el historial de chat?')) {
                  messages.forEach(msg => {
                    if (msg.sender === 'user') {
                      onDeleteMessage(msg.id);
                    }
                  });
                }
              }}
              className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
              title="Limpiar historial"
            >
              <Trash className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div
        ref={chatContainerRef}
        className={`
          flex-1 overflow-y-auto min-h-0 mobile-chat-messages
          ${isMobile ? 'p-2 space-y-2' : 'p-3 space-y-4'}
        `}
        style={{
          display: showHistory ? 'block' : 'none',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Agrupar mensajes por día */}
        {(() => {
          const messagesByDay: { [key: string]: ChatMessage[] } = {};

          // Agrupar mensajes por día
          messages.forEach(message => {
            const date = new Date(message.timestamp);
            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

            if (!messagesByDay[dateKey]) {
              messagesByDay[dateKey] = [];
            }

            messagesByDay[dateKey].push(message);
          });

          // Renderizar mensajes agrupados por día
          return Object.entries(messagesByDay).map(([dateKey, dayMessages], index) => {
            const date = new Date(dayMessages[0].timestamp);
            const dateStr = date.toLocaleDateString();

            return (
              <div key={dateKey} className="mb-6">
                {/* Separador de fecha */}
                {index > 0 && (
                  <div className="flex items-center justify-center my-4">
                    <div className="flex-grow h-px bg-codestorm-blue/30"></div>
                    <div className="px-3 text-xs text-gray-400">{dateStr}</div>
                    <div className="flex-grow h-px bg-codestorm-blue/30"></div>
                  </div>
                )}

                {/* Mensajes del día */}
                <div className="space-y-4">
                  {dayMessages.map((message) => {
                    // Determinar si este mensaje es parte de una etapa
                    const isStageMessage = message.metadata?.stageId ||
                                          message.content.includes('Etapa aprobada') ||
                                          message.content.includes('siguiente etapa');

                    return (
                      <div
                        key={`${message.id}-${Math.random().toString(36).substring(2, 9)}`}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Contenedor especial para mensajes de etapas */}
                        <div className={isStageMessage ? 'relative w-full max-w-[95%]' : ''}>
                          {/* Indicador visual para mensajes de etapas */}
                          {isStageMessage && (
                            <div className="absolute top-0 bottom-0 left-0 w-1 rounded-full bg-codestorm-gold"></div>
                          )}

                          {/* Mensaje con padding adicional si es de etapa */}
                          <div className={`${isStageMessage ? 'pl-3' : ''} ${message.sender === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
                            {/* Verificar si el mensaje está colapsado */}
                            {collapsedMessageIds.has(message.id) ? (
                              <div
                                className={`rounded-lg p-2 cursor-pointer transition-all duration-300 ${
                                  message.sender === 'user' ? 'bg-codestorm-accent/50' : 'bg-codestorm-blue/10'
                                } hover:bg-codestorm-blue/30 flex items-center space-x-2`}
                                onClick={() => toggleMessageCollapse(message.id)}
                              >
                                <ChevronDown className="w-3 h-3" />
                                <div className="flex items-center text-xs">
                                  {message.sender === 'user' ? (
                                    <User className="w-3 h-3 mr-1" />
                                  ) : message.sender === 'system' ? (
                                    <Bell className="w-3 h-3 mr-1" />
                                  ) : message.sender === 'ai-agent' ? (
                                    <Code className="w-3 h-3 mr-1" />
                                  ) : message.sender === 'design-agent' ? (
                                    <FileText className="w-3 h-3 mr-1" />
                                  ) : (
                                    <Bot className="w-3 h-3 mr-1" />
                                  )}
                                  <span>
                                    {message.type === 'code' ? 'Código' :
                                     message.type === 'notification' ? 'Notificación' :
                                     message.type === 'file-creation' ? 'Creación de archivo' :
                                     message.type === 'file-modification' ? 'Modificación de archivo' :
                                     message.content.length > 30 ? `${message.content.substring(0, 30)}...` : message.content}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className={`${newMessageIds.has(message.id) ? 'chat-message-appear' : 'animate-fadeIn'}`}>
                                {renderMessage(message)}
                                <div className="flex justify-end mt-1">
                                  <button
                                    onClick={() => toggleMessageCollapse(message.id)}
                                    className="p-1 text-xs text-gray-400 rounded hover:bg-codestorm-blue/20 hover:text-white transition-smooth"
                                    title="Colapsar mensaje"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}

        {messages.length === 0 && !isProcessing && (
          <div className="py-4 text-center text-gray-400">
            No hay mensajes aún
          </div>
        )}

        {/* Indicador de escritura cuando está procesando */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="max-w-[80%]">
              <TypingIndicator
                agent={currentAgent || 'ai'}
                message={processingMessage || 'Procesando tu solicitud...'}
                variant="default"
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className={`border-t border-codestorm-blue/30 flex-shrink-0 mobile-chat-input ${isMobile ? 'p-2' : 'p-3'}`}>
        <div className={`flex flex-col ${isMobile ? 'space-y-1' : 'space-y-2'}`}>
          <div className={`flex ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isDisabled ? "Selecciona una plantilla para continuar..." : "Escribe un mensaje..."}
              className={`
                flex-1 text-white placeholder-gray-500 border rounded-md resize-none bg-codestorm-darker transition-smooth
                -webkit-tap-highlight-color: transparent
                ${isMobile ? 'p-2 text-sm' : 'p-2'}
                ${isEnhancing
                  ? 'border-codestorm-accent shadow-glow-blue animate-pulse-subtle'
                  : isDisabled
                  ? 'border-gray-600 bg-gray-800 cursor-not-allowed'
                  : 'border-codestorm-blue/30 hover:border-codestorm-blue/50 focus:border-codestorm-blue focus:ring-1 focus:ring-codestorm-blue/50'
                }
              `}
              rows={isMobile ? 1 : 2}
              disabled={isProcessing || isEnhancing || isDisabled}
            />
            <div className={`flex ${isMobile ? 'flex-row space-x-1' : 'flex-col justify-between space-y-2'}`}>
              {/* Botón de micrófono */}
              <VoiceInputButton
                onTranscript={handleVoiceTranscript}
                onFinalTranscript={handleVoiceFinalTranscript}
                disabled={isProcessing || isEnhancing || isDisabled}
                size={isMobile ? 'sm' : 'md'}
                autoSend={false}
                showTranscript={false}
                className="relative"
              />

              <button
                onClick={toggleEnhancePrompt}
                className={`
                  rounded-md transition-all duration-200 -webkit-tap-highlight-color: transparent
                  ${isMobile ? 'p-2 min-w-[40px] min-h-[40px]' : 'p-2'}
                  ${enhancePromptEnabled
                    ? 'bg-purple-600 text-white shadow-glow-blue'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                  }
                `}
                title={enhancePromptEnabled ? 'Desactivar mejora de prompts' : 'Activar mejora de prompts'}
              >
                <Sparkles className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} ${enhancePromptEnabled ? 'animate-pulse' : ''}`} />
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing || isEnhancing || isDisabled}
                className={`
                  rounded-md transition-smooth -webkit-tap-highlight-color: transparent
                  ${isMobile ? 'p-2 min-w-[40px] min-h-[40px]' : 'p-2'}
                  ${!inputValue.trim() || isProcessing || isEnhancing || isDisabled
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-codestorm-accent hover:bg-blue-600 text-white btn-hover-glow'
                  }
                `}
                title={isDisabled ? "Selecciona una plantilla para continuar" : "Enviar mensaje"}
              >
                {isEnhancing ? (
                  <Sparkles className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} animate-pulse`} />
                ) : (
                  <Send className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                )}
              </button>
            </div>
          </div>

          {enhancePromptEnabled && (
            <div className="flex items-center justify-between px-2 py-1 text-xs border rounded-md bg-purple-900/30 border-purple-500/30">
              <div className="flex items-center">
                <Sparkles className="w-3 h-3 mr-1 text-purple-400" />
                <span className="text-purple-300">Mejora de prompts activada</span>
              </div>
              <button
                onClick={showEnhancementHistoryPanel}
                className="text-purple-300 transition-colors hover:text-white"
                title="Ver historial de mejoras"
              >
                <History className="w-3 h-3" />
              </button>
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center text-xs text-gray-400">
              <Clock className="w-3 h-3 mr-1 animate-spin" />
              <span>Procesando...</span>
            </div>
          )}

          {isEnhancing && (
            <div className="flex items-center px-2 py-1 text-xs border rounded-md bg-purple-900/30 border-purple-500/30 animate-pulse-subtle shadow-glow-blue">
              <Sparkles className="w-3 h-3 mr-1 text-purple-400 animate-pulse" />
              <span className="text-purple-300">Mejorando prompt...</span>
              <div className="flex ml-2 space-x-1">
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Diálogo de prompt mejorado */}
      {currentEnhancedPrompt && (
        <EnhancedPromptDialog
          enhancedPrompt={currentEnhancedPrompt}
          onClose={() => setShowEnhancedPromptDialog(false)}
          onUseOriginal={handleUseOriginalPrompt}
          onUseEnhanced={handleUseEnhancedPrompt}
          isVisible={showEnhancedPromptDialog}
        />
      )}

      {/* Panel de historial de mejoras */}
      <EnhancementHistoryPanel
        history={PromptEnhancerService.getEnhancementHistory()}
        onClearHistory={clearEnhancementHistory}
        onUsePrompt={usePromptFromHistory}
        isVisible={showEnhancementHistory}
        onClose={() => setShowEnhancementHistory(false)}
      />

      {/* Ventana lateral de etapas */}
      {currentStage && onApproveStage && onModifyStage && onRejectStage && (
        <StageSidebar
          stage={currentStage}
          onApprove={onApproveStage}
          onModify={onModifyStage}
          onReject={onRejectStage}
          isPaused={isPaused}
          isOpen={showStageSidebar}
          onToggle={toggleStageSidebar}
        />
      )}

      {/* Indicador de comando STORM */}
      <StormIndicator onCommand={handleStormCommand} />
    </div>
  );
};

export default InteractiveChat;
