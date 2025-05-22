import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Trash, Code, FileEdit, Sparkles, History, Clock } from 'lucide-react';
import { FileItem } from '../types';
import { PromptEnhancerService, EnhancedPrompt } from '../services/PromptEnhancerService';
import EnhancedPromptDialog from './EnhancedPromptDialog';
import EnhancementHistoryPanel from './EnhancementHistoryPanel';
import { generateUniqueId } from '../utils/idGenerator';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: number;
  relatedFileId?: string;
}

interface ChatInterfaceProps {
  onSendMessage: (message: string, fileId?: string) => Promise<void>;
  onModifyFile: (fileId: string, instruction: string) => Promise<void>;
  isProcessing: boolean;
  files: FileItem[];
  selectedFileId: string | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSendMessage,
  onModifyFile,
  isProcessing,
  files,
  selectedFileId
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: '¡Hola! Soy tu asistente de CODESTORM. Puedo ayudarte a crear y modificar código. ¿Qué te gustaría hacer hoy?',
      sender: 'assistant',
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isModifyingFile, setIsModifyingFile] = useState(false);

  // Estado para la funcionalidad de mejora de prompts
  const [enhancePromptEnabled, setEnhancePromptEnabled] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [currentEnhancedPrompt, setCurrentEnhancedPrompt] = useState<EnhancedPrompt | null>(null);
  const [showEnhancedPromptDialog, setShowEnhancedPromptDialog] = useState(false);
  const [showEnhancementHistory, setShowEnhancementHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll al final de los mensajes cuando se añade uno nuevo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    // Si la mejora de prompts está habilitada, mejorar el prompt
    if (enhancePromptEnabled && !isEnhancing && !isModifyingFile) {
      setIsEnhancing(true);

      try {
        const result = await PromptEnhancerService.enhancePrompt(inputValue);

        if (result.success && result.enhancedPrompt) {
          setCurrentEnhancedPrompt(result.enhancedPrompt);
          setShowEnhancedPromptDialog(true);
        } else {
          // Si hay un error, enviar el mensaje original
          await sendOriginalMessage();
        }
      } catch (error) {
        console.error('Error al mejorar el prompt:', error);
        // En caso de error, enviar el mensaje original
        await sendOriginalMessage();
      } finally {
        setIsEnhancing(false);
      }
    } else {
      // Si la mejora de prompts está deshabilitada, enviar el mensaje original
      await sendOriginalMessage();
    }
  };

  // Función para enviar el mensaje original
  const sendOriginalMessage = async () => {
    const newMessage: Message = {
      id: generateUniqueId('msg'),
      content: inputValue,
      sender: 'user',
      timestamp: Date.now(),
      relatedFileId: isModifyingFile ? selectedFileId || undefined : undefined
    };

    setMessages(prev => [...prev, newMessage]);
    const currentInput = inputValue;
    setInputValue('');

    try {
      if (isModifyingFile && selectedFileId) {
        await onModifyFile(selectedFileId, currentInput);

        // Añadir mensaje de confirmación
        setMessages(prev => [
          ...prev,
          {
            id: generateUniqueId('msg-response'),
            content: `He modificado el archivo según tus instrucciones. Puedes ver los cambios en el editor.`,
            sender: 'assistant',
            timestamp: Date.now(),
            relatedFileId: selectedFileId
          }
        ]);
      } else {
        await onSendMessage(currentInput);

        // El mensaje de respuesta se añadirá desde el componente padre
      }
    } catch (error) {
      // Añadir mensaje de error
      setMessages(prev => [
        ...prev,
        {
          id: generateUniqueId('msg-error'),
          content: `Lo siento, ocurrió un error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          sender: 'assistant',
          timestamp: Date.now()
        }
      ]);
    }
  };

  // Función para usar el prompt original
  const handleUseOriginalPrompt = async () => {
    if (currentEnhancedPrompt) {
      const originalPrompt = currentEnhancedPrompt.originalPrompt;
      setShowEnhancedPromptDialog(false);
      setCurrentEnhancedPrompt(null);

      // Establecer el valor del input y luego enviarlo
      setInputValue(originalPrompt);

      // Usar setTimeout para asegurar que el estado se actualice antes de enviar
      setTimeout(async () => {
        const newMessage: Message = {
          id: generateUniqueId('msg'),
          content: originalPrompt,
          sender: 'user',
          timestamp: Date.now()
        };

        setMessages(prev => [...prev, newMessage]);

        try {
          await onSendMessage(originalPrompt);
        } catch (error) {
          // Añadir mensaje de error
          setMessages(prev => [
            ...prev,
            {
              id: generateUniqueId('msg-error'),
              content: `Lo siento, ocurrió un error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
              sender: 'assistant',
              timestamp: Date.now()
            }
          ]);
        }
      }, 0);
    }
  };

  // Función para usar el prompt mejorado
  const handleUseEnhancedPrompt = async () => {
    if (currentEnhancedPrompt) {
      const enhancedPrompt = currentEnhancedPrompt.enhancedPrompt;
      setShowEnhancedPromptDialog(false);
      setCurrentEnhancedPrompt(null);

      // Establecer el valor del input y luego enviarlo
      setInputValue(enhancedPrompt);

      // Usar setTimeout para asegurar que el estado se actualice antes de enviar
      setTimeout(async () => {
        const newMessage: Message = {
          id: generateUniqueId('msg'),
          content: enhancedPrompt,
          sender: 'user',
          timestamp: Date.now()
        };

        setMessages(prev => [...prev, newMessage]);

        try {
          await onSendMessage(enhancedPrompt);
        } catch (error) {
          // Añadir mensaje de error
          setMessages(prev => [
            ...prev,
            {
              id: generateUniqueId('msg-error'),
              content: `Lo siento, ocurrió un error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
              sender: 'assistant',
              timestamp: Date.now()
            }
          ]);
        }
      }, 0);
    }
  };

  // Función para alternar la mejora de prompts
  const toggleEnhancePrompt = () => {
    setEnhancePromptEnabled(!enhancePromptEnabled);
  };

  // Función para usar un prompt del historial
  const usePromptFromHistory = (prompt: string) => {
    setInputValue(prompt);
    setShowEnhancementHistory(false);
  };

  // Función para limpiar el historial de mejoras
  const clearEnhancementHistory = () => {
    PromptEnhancerService.clearEnhancementHistory();
    setShowEnhancementHistory(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startFileModification = () => {
    if (!selectedFileId) {
      setMessages(prev => [
        ...prev,
        {
          id: generateUniqueId('msg-error'),
          content: 'Por favor, selecciona primero un archivo para modificar.',
          sender: 'assistant',
          timestamp: Date.now()
        }
      ]);
      return;
    }

    const selectedFile = files.find(file => file.id === selectedFileId);
    if (!selectedFile) return;

    setIsModifyingFile(true);
    setMessages(prev => [
      ...prev,
      {
        id: generateUniqueId('msg-file-mod'),
        content: `¿Qué cambios te gustaría hacer en el archivo "${selectedFile.name}"?`,
        sender: 'assistant',
        timestamp: Date.now(),
        relatedFileId: selectedFileId
      }
    ]);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        content: 'Chat limpiado. ¿En qué puedo ayudarte ahora?',
        sender: 'assistant',
        timestamp: Date.now()
      }
    ]);
    setIsModifyingFile(false);
  };

  // Añadir un mensaje del asistente (para ser llamado desde el componente padre)
  const addAssistantMessage = (content: string, fileId?: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: generateUniqueId('msg-assistant'),
        content,
        sender: 'assistant',
        timestamp: Date.now(),
        relatedFileId: fileId
      }
    ]);
  };

  return (
    <div className="flex flex-col h-full border rounded-lg shadow-md bg-codestorm-dark border-codestorm-blue/30">
      <div className="flex items-center justify-between p-3 border-b bg-codestorm-blue/20 border-codestorm-blue/30">
        <h2 className="text-sm font-medium text-white">Asistente de CODESTORM</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowEnhancementHistory(true)}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title="Historial de mejoras"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={startFileModification}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title="Modificar archivo seleccionado"
            disabled={!selectedFileId || isProcessing}
          >
            <FileEdit className="w-4 h-4" />
          </button>
          <button
            onClick={clearChat}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title="Limpiar chat"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-3 space-y-4 overflow-auto">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === 'user'
                  ? 'bg-codestorm-accent text-white'
                  : 'bg-codestorm-blue/20 text-white'
              } ${message.relatedFileId ? 'border-l-2 border-codestorm-gold' : ''}`}
            >
              <div className="flex items-center mb-1">
                {message.sender === 'user' ? (
                  <User className="w-4 h-4 mr-2" />
                ) : (
                  <Bot className="w-4 h-4 mr-2" />
                )}
                <span className="text-xs opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              {message.relatedFileId && (
                <div className="flex items-center mt-1 text-xs text-codestorm-gold">
                  <Code className="w-3 h-3 mr-1" />
                  <span>
                    {files.find(f => f.id === message.relatedFileId)?.name || 'Archivo'}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-codestorm-blue/30">
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isModifyingFile
                  ? "Describe los cambios que quieres hacer en el archivo..."
                  : "Escribe un mensaje..."
              }
              className="flex-1 p-2 text-white placeholder-gray-400 border rounded-md resize-none bg-codestorm-darker border-codestorm-blue/40 focus:ring-2 focus:ring-codestorm-accent focus:border-codestorm-accent"
              rows={2}
              disabled={isProcessing || isEnhancing}
            />
            <div className="flex flex-col justify-between space-y-2">
              <button
                onClick={toggleEnhancePrompt}
                className={`p-2 rounded-md ${
                  enhancePromptEnabled
                    ? 'bg-codestorm-gold text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                }`}
                title={enhancePromptEnabled ? 'Desactivar mejora de prompts' : 'Activar mejora de prompts'}
                disabled={isModifyingFile}
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing || isEnhancing}
                className={`p-2 rounded-md ${
                  !inputValue.trim() || isProcessing || isEnhancing
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-codestorm-accent hover:bg-blue-600 text-white'
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isEnhancing ? (
                  <Sparkles className="w-5 h-5 animate-pulse" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {isModifyingFile && (
            <div className="flex items-center text-xs text-codestorm-gold">
              <FileEdit className="w-3 h-3 mr-1" />
              <span>
                Modificando: {files.find(f => f.id === selectedFileId)?.name || 'archivo seleccionado'}
              </span>
            </div>
          )}

          {enhancePromptEnabled && !isModifyingFile && (
            <div className="flex items-center text-xs text-codestorm-gold">
              <Sparkles className="w-3 h-3 mr-1" />
              <span>Mejora de prompts activada</span>
            </div>
          )}

          {isEnhancing && (
            <div className="flex items-center text-xs text-codestorm-gold">
              <Sparkles className="w-3 h-3 mr-1 animate-pulse" />
              <span>Mejorando prompt...</span>
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
    </div>
  );
};

export default ChatInterface;
