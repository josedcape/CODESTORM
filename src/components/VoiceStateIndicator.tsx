import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export type VoiceState = 
  | 'idle' 
  | 'listening' 
  | 'processing' 
  | 'speaking' 
  | 'error' 
  | 'disabled'
  | 'initializing'
  | 'ready';

interface VoiceStateIndicatorProps {
  voiceState: VoiceState;
  isListening?: boolean;
  isSpeaking?: boolean;
  error?: string | null;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  compact?: boolean;
}

const VoiceStateIndicator: React.FC<VoiceStateIndicatorProps> = ({
  voiceState,
  isListening = false,
  isSpeaking = false,
  error = null,
  className = '',
  size = 'medium',
  showLabel = true,
  compact = false
}) => {
  const getStateIcon = () => {
    switch (voiceState) {
      case 'listening':
        return <Mic className={`${getSizeClass()} text-green-400 animate-pulse`} />;
      case 'processing':
        return <Loader2 className={`${getSizeClass()} text-blue-400 animate-spin`} />;
      case 'speaking':
        return <Volume2 className={`${getSizeClass()} text-purple-400 animate-pulse`} />;
      case 'error':
        return <AlertCircle className={`${getSizeClass()} text-red-400`} />;
      case 'disabled':
        return <MicOff className={`${getSizeClass()} text-gray-500`} />;
      case 'initializing':
        return <Loader2 className={`${getSizeClass()} text-yellow-400 animate-spin`} />;
      case 'ready':
        return <CheckCircle className={`${getSizeClass()} text-green-400`} />;
      case 'idle':
      default:
        return <Mic className={`${getSizeClass()} text-gray-400`} />;
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'w-3 h-3';
      case 'large':
        return 'w-6 h-6';
      case 'medium':
      default:
        return 'w-4 h-4';
    }
  };

  const getStateLabel = () => {
    switch (voiceState) {
      case 'listening':
        return 'Escuchando...';
      case 'processing':
        return 'Procesando...';
      case 'speaking':
        return 'Hablando...';
      case 'error':
        return error || 'Error de voz';
      case 'disabled':
        return 'Voz deshabilitada';
      case 'initializing':
        return 'Inicializando...';
      case 'ready':
        return 'Listo para comandos';
      case 'idle':
      default:
        return 'Voz inactiva';
    }
  };

  const getStateColor = () => {
    switch (voiceState) {
      case 'listening':
        return 'text-green-400';
      case 'processing':
        return 'text-blue-400';
      case 'speaking':
        return 'text-purple-400';
      case 'error':
        return 'text-red-400';
      case 'disabled':
        return 'text-gray-500';
      case 'initializing':
        return 'text-yellow-400';
      case 'ready':
        return 'text-green-400';
      case 'idle':
      default:
        return 'text-gray-400';
    }
  };

  const getContainerClass = () => {
    let baseClass = `flex items-center ${className}`;
    
    if (compact) {
      baseClass += ' space-x-1';
    } else {
      baseClass += ' space-x-2 p-2 rounded-md bg-codestorm-dark/50 border border-codestorm-blue/20';
    }
    
    return baseClass;
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 'text-xs';
      case 'large':
        return 'text-sm';
      case 'medium':
      default:
        return 'text-xs';
    }
  };

  if (compact) {
    return (
      <div className={getContainerClass()} title={getStateLabel()}>
        {getStateIcon()}
        {showLabel && (
          <span className={`${getStateColor()} ${getTextSize()} font-medium`}>
            {getStateLabel()}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={getContainerClass()}>
      <div className="flex items-center space-x-2">
        {getStateIcon()}
        {showLabel && (
          <div className="flex flex-col">
            <span className={`${getStateColor()} ${getTextSize()} font-medium`}>
              {getStateLabel()}
            </span>
            {error && voiceState === 'error' && (
              <span className="text-xs text-red-300 opacity-75 max-w-32 truncate">
                {error}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Indicador visual adicional para estados activos */}
      {(voiceState === 'listening' || voiceState === 'processing' || voiceState === 'speaking') && (
        <div className="flex space-x-1 ml-2">
          <div className={`w-1 h-1 rounded-full ${getStateColor()} animate-pulse`}></div>
          <div className={`w-1 h-1 rounded-full ${getStateColor()} animate-pulse`} style={{ animationDelay: '0.2s' }}></div>
          <div className={`w-1 h-1 rounded-full ${getStateColor()} animate-pulse`} style={{ animationDelay: '0.4s' }}></div>
        </div>
      )}
    </div>
  );
};

export default VoiceStateIndicator;
