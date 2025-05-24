import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Volume2,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { nativeVoiceRecognitionService, VoiceRecognitionEvent, VoiceRecognitionResult } from '../../services/NativeVoiceRecognitionService';
import { audioService } from '../../services/AudioService';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  autoSend?: boolean;
  showTranscript?: boolean;
  placeholder?: string;
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  onFinalTranscript,
  disabled = false,
  className = '',
  size = 'md',
  autoSend = false,
  showTranscript = true,
  placeholder = 'Presiona para hablar...'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [isStormMode, setIsStormMode] = useState(false);

  const mobileOpt = useMobileOptimization();
  const transcriptRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Verificar permisos de micrófono al montar
    checkMicrophonePermission();

    // Listener para eventos de reconocimiento de voz
    const handleVoiceEvent = (event: VoiceRecognitionEvent) => {
      switch (event.type) {
        case 'start':
          setIsListening(true);
          setIsProcessing(false);
          setError(null);
          setTranscript('');
          mobileOpt.triggerHapticFeedback('light');
          break;

        case 'result':
          const result = event.data as VoiceRecognitionResult;
          setTranscript(result.transcript);
          setConfidence(result.confidence);
          onTranscript(result.transcript);

          if (result.isFinal) {
            setIsProcessing(true);
            if (onFinalTranscript) {
              onFinalTranscript(result.transcript);
            }

            if (autoSend && result.transcript.trim()) {
              // Auto-enviar después de un breve delay
              timeoutRef.current = setTimeout(() => {
                handleStopListening();
              }, 500);
            }
          }
          break;

        case 'end':
          setIsListening(false);
          setIsProcessing(false);
          mobileOpt.triggerHapticFeedback('medium');
          break;

        case 'error':
          setIsListening(false);
          setIsProcessing(false);
          setError(event.data?.message || 'Error en reconocimiento de voz');
          mobileOpt.triggerHapticFeedback('heavy');
          audioService.playSystemError();
          break;

        case 'storm-detected':
          setIsStormMode(true);
          setTimeout(() => setIsStormMode(false), 2000);
          break;
      }
    };

    nativeVoiceRecognitionService.addEventListener(handleVoiceEvent);

    // Cleanup
    return () => {
      nativeVoiceRecognitionService.removeEventListener(handleVoiceEvent);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onTranscript, onFinalTranscript, autoSend, mobileOpt]);

  // Verificar permisos de micrófono
  const checkMicrophonePermission = async () => {
    try {
      // Para el servicio nativo, simplemente verificamos si está soportado
      const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setHasPermission(isSupported);
    } catch (error) {
      setHasPermission(false);
      setError('No se pudo acceder al micrófono');
    }
  };

  // Iniciar escucha
  const handleStartListening = async () => {
    if (disabled || isListening || !hasPermission) return;

    setError(null);

    // Verificar permisos nuevamente
    if (hasPermission === null) {
      await checkMicrophonePermission();
      return;
    }

    // Verificar soporte nativo
    const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    if (!isSupported) {
      setError('Reconocimiento de voz no soportado en este navegador');
      return;
    }

    // Reproducir sonido de activación
    audioService.playVoiceListening();

    // Iniciar reconocimiento
    nativeVoiceRecognitionService.startListening();
  };

  // Detener escucha
  const handleStopListening = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    nativeVoiceRecognitionService.stopListening();
  };

  // Alternar escucha
  const handleToggleListening = () => {
    if (isListening) {
      handleStopListening();
    } else {
      handleStartListening();
    }
  };

  // Limpiar transcript
  const handleClearTranscript = () => {
    setTranscript('');
    setError(null);
    // El servicio nativo no necesita limpiar transcript explícitamente
  };

  // Reproducir transcript
  const handlePlayTranscript = () => {
    if (transcript) {
      audioService.speakText(transcript);
    }
  };

  // Manejar tecla Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isListening) {
        handleStopListening();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isListening]);

  // Clases de tamaño
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // Estado del botón
  const getButtonState = () => {
    if (disabled || hasPermission === false) return 'disabled';
    if (isStormMode) return 'storm';
    if (isListening) return 'listening';
    if (isProcessing) return 'processing';
    if (error) return 'error';
    if (transcript) return 'success';
    return 'idle';
  };

  const buttonState = getButtonState();

  // Clases del botón según el estado
  const getButtonClasses = () => {
    const baseClasses = `
      ${sizeClasses[size]} rounded-full flex items-center justify-center
      transition-all duration-200 border-2 relative overflow-hidden
      ${className}
    `;

    switch (buttonState) {
      case 'disabled':
        return `${baseClasses} bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed`;
      case 'storm':
        return `${baseClasses} bg-codestorm-accent border-codestorm-accent text-white animate-pulse shadow-lg shadow-codestorm-accent/50`;
      case 'listening':
        return `${baseClasses} bg-red-600 border-red-500 text-white animate-pulse shadow-lg shadow-red-500/50`;
      case 'processing':
        return `${baseClasses} bg-yellow-600 border-yellow-500 text-white`;
      case 'error':
        return `${baseClasses} bg-red-700 border-red-600 text-white`;
      case 'success':
        return `${baseClasses} bg-green-600 border-green-500 text-white`;
      default:
        return `${baseClasses} bg-codestorm-blue border-codestorm-blue/50 text-white hover:bg-codestorm-blue/80 hover:border-codestorm-blue`;
    }
  };

  // Icono según el estado
  const getIcon = () => {
    const iconClass = iconSizes[size];

    switch (buttonState) {
      case 'disabled':
        return <MicOff className={iconClass} />;
      case 'listening':
        return <Square className={iconClass} />;
      case 'processing':
        return <Loader2 className={`${iconClass} animate-spin`} />;
      case 'error':
        return <AlertCircle className={iconClass} />;
      case 'success':
        return <CheckCircle className={iconClass} />;
      default:
        return <Mic className={iconClass} />;
    }
  };

  return (
    <div className="relative">
      {/* Botón principal */}
      <button
        onClick={handleToggleListening}
        disabled={disabled || hasPermission === false}
        className={getButtonClasses()}
        title={
          buttonState === 'disabled' ? 'Micrófono no disponible' :
          buttonState === 'listening' ? 'Presiona para detener (Esc)' :
          buttonState === 'processing' ? 'Procesando...' :
          buttonState === 'error' ? error || 'Error' :
          'Presiona para hablar'
        }
      >
        {getIcon()}

        {/* Indicador de nivel de audio */}
        {isListening && (
          <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" />
        )}
      </button>

      {/* Transcript en tiempo real */}
      {showTranscript && (transcript || error) && (
        <div className="absolute top-full left-0 mt-2 min-w-[200px] max-w-[300px] z-50">
          <div className="bg-codestorm-dark border border-codestorm-blue/30 rounded-lg p-3 shadow-lg">
            {error ? (
              <div className="text-red-400 text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            ) : (
              <>
                <div className="text-white text-sm mb-2" ref={transcriptRef}>
                  {transcript || placeholder}
                </div>

                {confidence > 0 && (
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span>Confianza: {Math.round(confidence * 100)}%</span>
                    {isListening && <span className="animate-pulse">🎤 Escuchando...</span>}
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={handlePlayTranscript}
                    disabled={!transcript}
                    className="p-1 rounded bg-codestorm-blue/20 hover:bg-codestorm-blue/40 text-white disabled:opacity-50"
                    title="Reproducir"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>

                  <button
                    onClick={handleClearTranscript}
                    className="p-1 rounded bg-gray-600/20 hover:bg-gray-600/40 text-white"
                    title="Limpiar"
                  >
                    <Square className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Indicador de comando STORM */}
      {isStormMode && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-codestorm-accent text-white text-xs px-2 py-1 rounded animate-bounce">
          STORM
        </div>
      )}
    </div>
  );
};

export default VoiceInputButton;
