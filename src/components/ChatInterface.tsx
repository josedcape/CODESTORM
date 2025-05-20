import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Trash, Code, FileEdit } from 'lucide-react';
import { FileItem } from '../types';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll al final de los mensajes cuando se añade uno nuevo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: inputValue,
      sender: 'user',
      timestamp: Date.now(),
      relatedFileId: isModifyingFile ? selectedFileId || undefined : undefined
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    try {
      if (isModifyingFile && selectedFileId) {
        await onModifyFile(selectedFileId, inputValue);
        
        // Añadir mensaje de confirmación
        setMessages(prev => [
          ...prev,
          {
            id: `msg-response-${Date.now()}`,
            content: `He modificado el archivo según tus instrucciones. Puedes ver los cambios en el editor.`,
            sender: 'assistant',
            timestamp: Date.now(),
            relatedFileId: selectedFileId
          }
        ]);
      } else {
        await onSendMessage(inputValue);
        
        // El mensaje de respuesta se añadirá desde el componente padre
      }
    } catch (error) {
      // Añadir mensaje de error
      setMessages(prev => [
        ...prev,
        {
          id: `msg-error-${Date.now()}`,
          content: `Lo siento, ocurrió un error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          sender: 'assistant',
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsModifyingFile(false);
    }
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
          id: `msg-error-${Date.now()}`,
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
        id: `msg-file-mod-${Date.now()}`,
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
        id: `msg-assistant-${Date.now()}`,
        content,
        sender: 'assistant',
        timestamp: Date.now(),
        relatedFileId: fileId
      }
    ]);
  };

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md h-full border border-codestorm-blue/30 flex flex-col">
      <div className="bg-codestorm-blue/20 p-3 border-b border-codestorm-blue/30 flex justify-between items-center">
        <h2 className="text-sm font-medium text-white">Asistente de CODESTORM</h2>
        <div className="flex space-x-2">
          <button
            onClick={startFileModification}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title="Modificar archivo seleccionado"
            disabled={!selectedFileId || isProcessing}
          >
            <FileEdit className="h-4 w-4" />
          </button>
          <button
            onClick={clearChat}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title="Limpiar chat"
          >
            <Trash className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-4">
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
                  <User className="h-4 w-4 mr-2" />
                ) : (
                  <Bot className="h-4 w-4 mr-2" />
                )}
                <span className="text-xs opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              {message.relatedFileId && (
                <div className="mt-1 text-xs flex items-center text-codestorm-gold">
                  <Code className="h-3 w-3 mr-1" />
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
        <div className="flex items-center space-x-2">
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isModifyingFile
                ? "Describe los cambios que quieres hacer en el archivo..."
                : "Escribe un mensaje..."
            }
            className="flex-1 bg-codestorm-darker border border-codestorm-blue/40 rounded-md p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-codestorm-accent focus:border-codestorm-accent resize-none"
            rows={2}
            disabled={isProcessing}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            className={`p-2 rounded-md ${
              !inputValue.trim() || isProcessing
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-codestorm-accent hover:bg-blue-600 text-white'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        {isModifyingFile && (
          <div className="mt-1 text-xs flex items-center text-codestorm-gold">
            <FileEdit className="h-3 w-3 mr-1" />
            <span>
              Modificando: {files.find(f => f.id === selectedFileId)?.name || 'archivo seleccionado'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
