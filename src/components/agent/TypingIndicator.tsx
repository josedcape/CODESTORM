import React, { useState, useEffect } from 'react';
import { Bot, Loader2, Brain, Code, FileText, Sparkles } from 'lucide-react';

interface TypingIndicatorProps {
  isVisible: boolean;
  stage?: 'analyzing' | 'processing' | 'generating' | 'finalizing';
  message?: string;
  progress?: number;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  isVisible, 
  stage = 'processing',
  message,
  progress 
}) => {
  const [dots, setDots] = useState('');
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const stageMessages = {
    analyzing: [
      'Analizando archivos del proyecto...',
      'Identificando patrones de código...',
      'Evaluando estructura del proyecto...',
      'Detectando dependencias...'
    ],
    processing: [
      'Procesando instrucciones...',
      'Aplicando modificaciones inteligentes...',
      'Optimizando cambios...',
      'Validando coherencia...'
    ],
    generating: [
      'Generando código modificado...',
      'Aplicando mejores prácticas...',
      'Integrando cambios...',
      'Verificando sintaxis...'
    ],
    finalizing: [
      'Finalizando modificaciones...',
      'Preparando resultados...',
      'Actualizando archivos...',
      'Completando proceso...'
    ]
  };

  const stageIcons = {
    analyzing: <Brain className="w-4 h-4 text-blue-400" />,
    processing: <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />,
    generating: <Code className="w-4 h-4 text-green-400" />,
    finalizing: <Sparkles className="w-4 h-4 text-yellow-400" />
  };

  const stageColors = {
    analyzing: 'text-blue-400',
    processing: 'text-purple-400',
    generating: 'text-green-400',
    finalizing: 'text-yellow-400'
  };

  // Animate dots
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Cycle through stage messages
  useEffect(() => {
    if (!isVisible) return;

    const messages = stageMessages[stage];
    const interval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible, stage]);

  if (!isVisible) return null;

  const currentStageMessage = message || stageMessages[stage][currentMessageIndex];

  return (
    <div className="flex items-center space-x-3 p-4 bg-codestorm-darker rounded-lg mr-8 border border-codestorm-blue/20">
      {/* Agent Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium text-sm text-white">Agente CODESTORM</span>
          <div className="flex items-center space-x-1">
            {stageIcons[stage]}
            <span className={`text-xs font-medium ${stageColors[stage]}`}>
              {stage.charAt(0).toUpperCase() + stage.slice(1)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Animated dots */}
          <div className="flex space-x-1">
            <div 
              className="w-2 h-2 bg-green-400 rounded-full animate-bounce" 
              style={{ animationDelay: '0ms' }} 
            />
            <div 
              className="w-2 h-2 bg-green-400 rounded-full animate-bounce" 
              style={{ animationDelay: '150ms' }} 
            />
            <div 
              className="w-2 h-2 bg-green-400 rounded-full animate-bounce" 
              style={{ animationDelay: '300ms' }} 
            />
          </div>
          
          {/* Message */}
          <span className="text-sm text-gray-300">
            {currentStageMessage}{dots}
          </span>
        </div>
        
        {/* Progress bar */}
        {progress !== undefined && (
          <div className="mt-2">
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-400 h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Progreso</span>
              <span>{Math.round(progress || 0)}%</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Stage indicator */}
      <div className="flex flex-col items-center space-y-1">
        <div className={`w-3 h-3 rounded-full ${
          stage === 'analyzing' ? 'bg-blue-400' :
          stage === 'processing' ? 'bg-purple-400' :
          stage === 'generating' ? 'bg-green-400' :
          'bg-yellow-400'
        } animate-pulse`} />
        <div className="text-xs text-gray-500">
          {stage === 'analyzing' ? '1/4' :
           stage === 'processing' ? '2/4' :
           stage === 'generating' ? '3/4' :
           '4/4'}
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
