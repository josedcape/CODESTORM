import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Zap,
  Waves
} from 'lucide-react';
import { useEnhancedVoice } from '../../hooks/useEnhancedVoice';

interface UniversalVoiceIndicatorProps {
  componentName: string;
  onCommand?: (command: string, confidence: number) => void;
  onTranscript?: (transcript: string, confidence: number) => void;
  showTranscript?: boolean;
  showCommands?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const UniversalVoiceIndicator: React.FC<UniversalVoiceIndicatorProps> = ({
  componentName,
  onCommand,
  onTranscript,
  showTranscript = true,
  showCommands = true,
  position = 'bottom-right',
  size = 'md',
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  const {
    voiceState,
    isListening,
    isInitialized,
    isSupported,
    error,
    transcript,
    confidence,
    lastCommand,
    repairAttempts,
    startListening,
    stopListening,
    repair,
    clearError,
    getDebugInfo,
    checkPermissions
  } = useEnhancedVoice({
    componentName,
    onCommand: (command, conf) => {
      setLastActivity(new Date());
      onCommand?.(command, conf);
    },
    onTranscript: (text, conf) => {
      setLastActivity(new Date());
      onTranscript?.(text, conf);
    },
    autoInitialize: true,
    autoRepair: true
  });

  // Obtener clases de posición
  const getPositionClasses = () => {
    const positions = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
    };
    return positions[position];
  };

  // Obtener clases de tamaño
  const getSizeClasses = () => {
    const sizes = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12'
    };
    return sizes[size];
  };

  // Obtener icono según el estado
  const getStateIcon = () => {
    switch (voiceState) {
      case 'listening':
        return <Mic className="w-full h-full animate-pulse" />;
      case 'processing':
        return <Waves className="w-full h-full animate-bounce" />;
      case 'initializing':
      case 'repairing':
        return <Loader2 className="w-full h-full animate-spin" />;
      case 'error':
        return <AlertTriangle className="w-full h-full" />;
      case 'ready':
        return <MicOff className="w-full h-full" />;
      default:
        return <MicOff className="w-full h-full opacity-50" />;
    }
  };

  // Obtener color según el estado
  const getStateColor = () => {
    switch (voiceState) {
      case 'listening':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'processing':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'initializing':
      case 'repairing':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'error':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'ready':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  // Manejar click en el indicador
  const handleClick = () => {
    if (!isSupported) {
      alert('Reconocimiento de voz no soportado en este navegador');
      return;
    }

    if (error) {
      clearError();
      repair();
      return;
    }

    if (isListening) {
      stopListening();
    } else if (isInitialized) {
      startListening();
    }
  };

  // Comandos disponibles para mostrar
  const availableCommands = [
    'abrir vista previa web',
    'abrir corrector de código',
    'cerrar ayuda',
    'ir a chat',
    'mostrar comandos de voz',
    'pantalla completa'
  ];

  if (!isSupported) {
    return null;
  }

  return (
    <div className={`fixed z-50 ${getPositionClasses()} ${className}`}>
      {/* Indicador principal */}
      <div className="relative">
        <button
          onClick={handleClick}
          onMouseEnter={() => setShowDetails(true)}
          onMouseLeave={() => setShowDetails(false)}
          className={`
            ${getSizeClasses()}
            ${getStateColor()}
            rounded-full border-2 transition-all duration-200
            hover:scale-110 active:scale-95
            flex items-center justify-center
            shadow-lg backdrop-blur-sm
          `}
          title={`Reconocimiento de voz - ${voiceState}`}
        >
          {getStateIcon()}
          
          {/* Indicador de actividad */}
          {lastActivity && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
          )}
          
          {/* Indicador de error */}
          {error && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
          )}
        </button>

        {/* Panel de detalles */}
        {showDetails && (
          <div className={`
            absolute ${position.includes('right') ? 'right-0' : 'left-0'} 
            ${position.includes('top') ? 'top-full mt-2' : 'bottom-full mb-2'}
            w-80 p-4 bg-codestorm-dark border border-codestorm-blue/30 rounded-lg shadow-xl
            backdrop-blur-sm z-10
          `}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium text-sm">Reconocimiento de Voz</h3>
              <div className={`px-2 py-1 rounded text-xs ${getStateColor()}`}>
                {voiceState}
              </div>
            </div>

            {/* Estado */}
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Componente:</span>
                <span className="text-white">{componentName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Inicializado:</span>
                <span className={isInitialized ? 'text-green-400' : 'text-red-400'}>
                  {isInitialized ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Escuchando:</span>
                <span className={isListening ? 'text-red-400' : 'text-gray-400'}>
                  {isListening ? '🎤' : '🔇'}
                </span>
              </div>
              {confidence > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Confianza:</span>
                  <span className="text-white">{Math.round(confidence * 100)}%</span>
                </div>
              )}
            </div>

            {/* Transcript actual */}
            {showTranscript && transcript && (
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-1">Transcripción:</div>
                <div className="p-2 bg-codestorm-darker rounded text-xs text-white">
                  "{transcript}"
                </div>
              </div>
            )}

            {/* Último comando */}
            {lastCommand && (
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-1">Último comando:</div>
                <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-200">
                  "{lastCommand}"
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-1">Error:</div>
                <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-200">
                  {error}
                </div>
                <button
                  onClick={() => {
                    clearError();
                    repair();
                  }}
                  className="mt-2 w-full px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded text-xs transition-colors"
                >
                  🔧 Reparar
                </button>
              </div>
            )}

            {/* Comandos disponibles */}
            {showCommands && (
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-2">Comandos disponibles:</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {availableCommands.map(command => (
                    <div
                      key={command}
                      className="text-xs text-gray-300 font-mono bg-codestorm-darker px-2 py-1 rounded"
                    >
                      "{command}"
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="flex space-x-2">
              <button
                onClick={handleClick}
                disabled={!isInitialized}
                className={`
                  flex-1 px-3 py-2 rounded text-xs font-medium transition-colors
                  ${isListening 
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-200' 
                    : 'bg-green-500/20 hover:bg-green-500/30 text-green-200'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isListening ? '🔇 Detener' : '🎤 Iniciar'}
              </button>
              
              <button
                onClick={() => {
                  repair();
                  setShowDetails(false);
                }}
                className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded text-xs transition-colors"
                title="Reparar servicio"
              >
                🔧
              </button>
            </div>

            {/* Debug info */}
            {repairAttempts > 0 && (
              <div className="mt-2 text-xs text-yellow-400">
                Intentos de reparación: {repairAttempts}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversalVoiceIndicator;
