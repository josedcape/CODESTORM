import React from 'react';
import { Bot, Code, Cpu, Zap } from 'lucide-react';

interface TypingIndicatorProps {
  agent?: string;
  message?: string;
  variant?: 'default' | 'minimal' | 'compact';
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  agent = 'ai',
  message = 'Escribiendo...',
  variant = 'default'
}) => {
  const getAgentIcon = (agentType: string) => {
    switch (agentType.toLowerCase()) {
      case 'planner':
        return <Cpu className="w-4 h-4 text-blue-400" />;
      case 'codegenerator':
        return <Code className="w-4 h-4 text-green-400" />;
      case 'codemodifier':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      default:
        return <Bot className="w-4 h-4 text-codestorm-blue" />;
    }
  };

  const getAgentName = (agentType: string) => {
    switch (agentType.toLowerCase()) {
      case 'planner':
        return 'Agente Planificador';
      case 'codegenerator':
        return 'Generador de Código';
      case 'codemodifier':
        return 'Modificador de Código';
      default:
        return 'Asistente IA';
    }
  };

  if (variant === 'minimal') {
    return (
      <div className="flex items-center space-x-2 text-gray-400">
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-codestorm-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1 h-1 bg-codestorm-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1 h-1 bg-codestorm-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <span className="text-xs">{message}</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center space-x-2 p-2 bg-codestorm-blue/10 rounded-lg border border-codestorm-blue/20 chat-message-pulse-system transition-smooth">
        {getAgentIcon(agent)}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300">{getAgentName(agent)}</span>
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-codestorm-blue rounded-full animate-typing" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-1 bg-codestorm-blue rounded-full animate-typing" style={{ animationDelay: '200ms' }}></div>
            <div className="w-1 h-1 bg-codestorm-blue rounded-full animate-typing" style={{ animationDelay: '400ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Variant por defecto
  return (
    <div className="flex items-start space-x-3 p-3 bg-codestorm-blue/10 rounded-lg border border-codestorm-blue/20 chat-message-pulse-system transition-smooth"
         style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="flex-shrink-0">
        {getAgentIcon(agent)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-medium text-white">{getAgentName(agent)}</span>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-codestorm-blue rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
            <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
          </div>
        </div>

        <p className="text-sm text-gray-300">{message}</p>

        {/* Barra de progreso animada */}
        <div className="mt-2 w-full bg-gray-700 rounded-full h-1 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-codestorm-blue to-blue-400 rounded-full relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
