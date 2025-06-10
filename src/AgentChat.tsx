import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Code, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { ChatMessage } from '../../types';
import { AgentState } from '../../pages/Agent';

interface AgentChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  agentState: AgentState;
}

const AgentChat: React.FC<AgentChatProps> = ({
  messages,
  onSendMessage,
  isProcessing,
  agentState
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isProcessing) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const getAgentIcon = (sender: string) => {
    switch (sender) {
      case 'ai-agent':
        return <Bot className="w-4 h-4 text-codestorm-accent" />;
      case 'design-agent':
        return <Sparkles className="w-4 h-4 text-green-400" />;
      default:
        return <Bot className="w-4 h-4 text-codestorm-accent" />;
    }
  };

  const getMessageTypeStyles = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-l-4 border-red-500 bg-red-500/10';
      case 'success':
        return 'border-l-4 border-green-500 bg-green-500/10';
      case 'warning':
        return 'border-l-4 border-yellow-500 bg-yellow-500/10';
      case 'info':
        return 'border-l-4 border-blue-500 bg-blue-500/10';
      case 'notification':
        return 'border-l-4 border-codestorm-accent bg-codestorm-accent/10';
      default:
        return '';
    }
  };

  const formatMessageContent = (content: string) => {
    // Convertir markdown básico a HTML
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-700 px-1 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br>');

    return formatted;
  };

  // Sugerencias de comandos comunes
  const commonCommands = [
    "Añade validación de email al formulario",
    "Optimiza la función de búsqueda",
    "Crea un componente de modal reutilizable",
    "Refactoriza el código para mejor rendimiento",
    "Añade manejo de errores a la API",
    "Implementa lazy loading en las imágenes"
  ];

  return (
    <div className="flex flex-col h-full bg-codestorm-dark rounded-lg">
      {/* Header del chat */}
      <div className="flex items-center justify-between p-4 border-b border-codestorm-blue/30">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-codestorm-accent" />
          <span className="font-medium text-white">Chat Inteligente</span>
          {agentState.activeAgent && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-codestorm-accent/20 rounded-full">
              {getAgentIcon(agentState.activeAgent)}
              <span className="text-xs text-white capitalize">{agentState.activeAgent}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isProcessing && (
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-yellow-400 animate-spin" />
              <span className="text-xs text-yellow-400">Procesando...</span>
            </div>
          )}
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === 'user'
                  ? 'bg-codestorm-accent text-white'
                  : `bg-codestorm-darker text-gray-100 ${getMessageTypeStyles(message.type || '')}`
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.sender !== 'user' && (
                  <div className="flex-shrink-0 mt-1">
                    {getAgentIcon(message.sender)}
                  </div>
                )}
                <div className="flex-1">
                  <div
                    className="text-sm"
                    dangerouslySetInnerHTML={{
                      __html: formatMessageContent(message.content)
                    }}
                  />
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-codestorm-darker text-gray-100 rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-codestorm-accent" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-codestorm-accent rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-codestorm-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-codestorm-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Sugerencias rápidas */}
      {messages.length <= 1 && (
        <div className="p-4 border-t border-codestorm-blue/30">
          <div className="text-xs text-gray-400 mb-2">Sugerencias rápidas:</div>
          <div className="flex flex-wrap gap-2">
            {commonCommands.slice(0, 3).map((command, index) => (
              <button
                key={index}
                onClick={() => setInputValue(command)}
                className="text-xs px-2 py-1 bg-codestorm-blue/20 text-codestorm-accent rounded hover:bg-codestorm-blue/30 transition-colors"
              >
                {command}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input de mensaje */}
      <div className="p-4 border-t border-codestorm-blue/30">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe la modificación que necesitas..."
            className="flex-1 px-3 py-2 bg-codestorm-darker border border-codestorm-blue/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-codestorm-accent"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            className="px-4 py-2 bg-codestorm-accent text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
        
        <div className="text-xs text-gray-500 mt-2">
          💡 Tip: Describe cambios como "añade validación", "optimiza función", "crea componente"
        </div>
      </div>
    </div>
  );
};

export default AgentChat;
