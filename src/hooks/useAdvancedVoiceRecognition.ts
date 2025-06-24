import { useState, useEffect, useRef, useCallback } from 'react';
import { voiceCoordinator } from '../services/VoiceCoordinator';

export type VoiceState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error'
  | 'disabled'
  | 'initializing'
  | 'ready';

interface UseAdvancedVoiceRecognitionOptions {
  onTranscript?: (transcript: string) => void;
  onFinalTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
  enableDebug?: boolean;
  componentName?: string;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  timeout?: number;
}

interface UseAdvancedVoiceRecognitionReturn {
  voiceState: VoiceState;
  isListening: boolean;
  isInitialized: boolean;
  error: string | null;
  transcript: string;
  confidence: number;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

export const useAdvancedVoiceRecognition = (
  options: UseAdvancedVoiceRecognitionOptions = {}
): UseAdvancedVoiceRecognitionReturn => {
  const {
    onTranscript,
    onFinalTranscript,
    onError,
    enableDebug = false,
    componentName = 'AdvancedVoiceRecognition',
    language = 'es-ES',
    continuous = true,
    interimResults = true,
    maxAlternatives = 1,
    timeout = 20000
  } = options;

  // Estados
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isSupported, setIsSupported] = useState(false);

  // Referencias
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isStartingRef = useRef(false);

  // Función de debug
  const debugLog = useCallback((message: string, data?: any) => {
    if (enableDebug) {
      console.log(`🎤 [${componentName}] ${message}`, data || '');
    }
  }, [enableDebug, componentName]);

  // Verificar soporte del navegador
  useEffect(() => {
    const checkSupport = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const supported = !!SpeechRecognition;
      setIsSupported(supported);

      if (!supported) {
        setVoiceState('disabled');
        setError('Reconocimiento de voz no soportado en este navegador');
        debugLog('Reconocimiento de voz no soportado');
        return false;
      }

      return true;
    };

    if (checkSupport()) {
      initializeRecognition();
    }
  }, []);

  // Inicializar reconocimiento de voz
  const initializeRecognition = useCallback(() => {
    try {
      setVoiceState('initializing');
      debugLog('Inicializando reconocimiento de voz...');

      // Solicitar acceso exclusivo al coordinador
      if (!voiceCoordinator.requestAccess('advanced')) {
        debugLog('⚠️ No se pudo obtener acceso exclusivo al reconocimiento de voz');
        setError('Otro servicio de voz está activo');
        setVoiceState('error');
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        voiceCoordinator.releaseAccess('advanced');
        throw new Error('SpeechRecognition no está disponible');
      }

      const recognition = new SpeechRecognition();

      // Configuración
      recognition.lang = language;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.maxAlternatives = maxAlternatives;

      // Event handlers
      recognition.onstart = () => {
        debugLog('Reconocimiento iniciado');

        // Marcar reconocimiento como activo en el coordinador
        if (!voiceCoordinator.markRecognitionActive('advanced')) {
          debugLog('⚠️ No se pudo marcar reconocimiento como activo');
          recognition.stop();
          return;
        }

        setVoiceState('listening');
        setIsListening(true);
        setError(null);
        isStartingRef.current = false;

        // Configurar timeout
        if (timeout > 0) {
          timeoutRef.current = setTimeout(() => {
            debugLog('Timeout alcanzado, deteniendo reconocimiento');
            stopListening();
          }, timeout);
        }
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptText = result[0].transcript;
          const confidenceScore = result[0].confidence || 0;

          if (result.isFinal) {
            finalTranscript += transcriptText;
            setConfidence(confidenceScore);
            debugLog('Transcripción final:', { text: transcriptText, confidence: confidenceScore });
          } else {
            interimTranscript += transcriptText;
            debugLog('Transcripción intermedia:', transcriptText);
          }
        }

        // Actualizar transcript
        const fullTranscript = finalTranscript || interimTranscript;
        setTranscript(fullTranscript);

        // Callbacks
        if (interimTranscript && onTranscript) {
          onTranscript(interimTranscript);
        }

        if (finalTranscript && onFinalTranscript) {
          onFinalTranscript(finalTranscript);
          // Auto-detener después de transcripción final si no es continuo
          if (!continuous) {
            setTimeout(() => stopListening(), 100);
          }
        }
      };

      recognition.onerror = (event) => {
        const errorMessage = `Error de reconocimiento: ${event.error}`;
        debugLog('Error:', event);

        // Marcar reconocimiento como inactivo y liberar acceso
        voiceCoordinator.markRecognitionInactive('advanced');

        setError(errorMessage);
        setVoiceState('error');
        setIsListening(false);
        isStartingRef.current = false;

        if (onError) {
          onError(errorMessage);
        }

        // Limpiar timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // Reintentar automáticamente en algunos casos
        if (event.error === 'network' || event.error === 'audio-capture') {
          setTimeout(() => {
            if (!isListening) {
              debugLog('Reintentando reconocimiento automáticamente...');
              setVoiceState('idle');
              setError(null);
            }
          }, 2000);
        }
      };

      recognition.onend = () => {
        debugLog('Reconocimiento terminado');

        // Marcar reconocimiento como inactivo
        voiceCoordinator.markRecognitionInactive('advanced');

        setIsListening(false);
        setVoiceState('idle');
        isStartingRef.current = false;

        // Limpiar timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };

      recognitionRef.current = recognition;
      setIsInitialized(true);
      setVoiceState('ready');
      debugLog('Reconocimiento inicializado correctamente');

    } catch (error) {
      const errorMessage = `Error al inicializar: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      debugLog('Error de inicialización:', error);
      setError(errorMessage);
      setVoiceState('error');
      setIsInitialized(false);

      if (onError) {
        onError(errorMessage);
      }
    }
  }, [language, continuous, interimResults, maxAlternatives, timeout, onTranscript, onFinalTranscript, onError, debugLog]);

  // Iniciar escucha
  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isInitialized || isStartingRef.current) {
      debugLog('No se puede iniciar: reconocimiento no disponible o ya iniciando');
      return;
    }

    if (isListening) {
      debugLog('Ya está escuchando');
      return;
    }

    // Verificar si puede usar el reconocimiento
    if (!voiceCoordinator.canUseRecognition('advanced')) {
      debugLog('⚠️ No se puede usar reconocimiento: otro servicio está activo');
      setError('Otro servicio de voz está activo');
      return;
    }

    try {
      isStartingRef.current = true;
      setError(null);
      setTranscript('');
      setConfidence(0);
      debugLog('Iniciando escucha...');
      recognitionRef.current.start();
    } catch (error) {
      const errorMessage = `Error al iniciar escucha: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      debugLog('Error al iniciar:', error);
      setError(errorMessage);
      setVoiceState('error');
      isStartingRef.current = false;

      if (onError) {
        onError(errorMessage);
      }
    }
  }, [isInitialized, isListening, onError, debugLog]);

  // Detener escucha
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) {
      debugLog('No hay reconocimiento para detener');
      return;
    }

    try {
      debugLog('Deteniendo escucha...');
      recognitionRef.current.stop();

      // Limpiar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } catch (error) {
      debugLog('Error al detener:', error);
    }
  }, [debugLog]);

  // Resetear transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    debugLog('Transcript reseteado');
  }, [debugLog]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
      // Liberar acceso al coordinador al desmontar
      voiceCoordinator.releaseAccess('advanced');
    };
  }, [isListening]);

  return {
    voiceState,
    isListening,
    isInitialized,
    error,
    transcript,
    confidence,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  };
};
