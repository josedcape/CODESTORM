/**
 * Hook unificado para reconocimiento de voz en CODESTORM
 * Proporciona una interfaz simple y consistente para todos los componentes
 * Utiliza el UnifiedVoiceService para coordinación centralizada
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { unifiedVoiceService, VoiceState, VoiceConfig, VoiceCallbacks } from '../services/UnifiedVoiceService';

export interface UseUnifiedVoiceOptions extends VoiceConfig {
  onTranscript?: (transcript: string) => void;
  onFinalTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
  componentName?: string;
  autoInitialize?: boolean;
}

export interface UseUnifiedVoiceReturn {
  // Estado
  voiceState: VoiceState;
  isListening: boolean;
  isInitialized: boolean;
  isSupported: boolean;
  error: string | null;
  transcript: string;
  
  // Acciones
  initialize: () => Promise<boolean>;
  startListening: () => boolean;
  stopListening: () => void;
  resetTranscript: () => void;
  cleanup: () => void;
  
  // Información
  getDebugInfo: () => string;
}

export const useUnifiedVoice = (options: UseUnifiedVoiceOptions = {}): UseUnifiedVoiceReturn => {
  const {
    onTranscript,
    onFinalTranscript,
    onError,
    componentName = 'UnknownComponent',
    autoInitialize = true,
    ...voiceConfig
  } = options;

  // Estado local
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');

  // Referencias
  const componentNameRef = useRef(componentName);
  const callbacksRef = useRef<VoiceCallbacks>({});

  // Actualizar referencias
  useEffect(() => {
    componentNameRef.current = componentName;
    callbacksRef.current = {
      onTranscript: (text: string) => {
        setTranscript(text);
        onTranscript?.(text);
      },
      onFinalTranscript: (text: string) => {
        setTranscript(text);
        onFinalTranscript?.(text);
      },
      onStateChange: (state: VoiceState) => {
        setVoiceState(state);
        setIsListening(state === 'listening');
        
        // Limpiar error cuando el estado cambia a algo válido
        if (state !== 'error') {
          setError(null);
        }
      },
      onError: (errorMessage: string) => {
        setError(errorMessage);
        setVoiceState('error');
        setIsListening(false);
        onError?.(errorMessage);
      }
    };
  }, [onTranscript, onFinalTranscript, onError, componentName]);

  // Función de inicialización
  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      console.log(`🎤 [${componentNameRef.current}] Inicializando reconocimiento de voz...`);
      
      setError(null);
      setVoiceState('initializing');

      const success = await unifiedVoiceService.initialize(voiceConfig, callbacksRef.current);
      
      if (success) {
        setIsInitialized(true);
        setVoiceState('ready');
        console.log(`✅ [${componentNameRef.current}] Reconocimiento de voz inicializado`);
      } else {
        setIsInitialized(false);
        setIsSupported(false);
        setVoiceState('error');
        console.error(`❌ [${componentNameRef.current}] Error al inicializar reconocimiento de voz`);
      }

      return success;
    } catch (error) {
      const errorMessage = `Error de inicialización: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      console.error(`❌ [${componentNameRef.current}] ${errorMessage}`);
      setError(errorMessage);
      setIsInitialized(false);
      setIsSupported(false);
      setVoiceState('error');
      return false;
    }
  }, [voiceConfig]);

  // Función para iniciar escucha
  const startListening = useCallback((): boolean => {
    if (!isInitialized) {
      console.warn(`⚠️ [${componentNameRef.current}] Servicio no inicializado`);
      setError('Servicio de voz no inicializado');
      return false;
    }

    console.log(`🎤 [${componentNameRef.current}] Iniciando escucha...`);
    setTranscript('');
    setError(null);
    
    const success = unifiedVoiceService.startListening(componentNameRef.current);
    
    if (!success) {
      console.error(`❌ [${componentNameRef.current}] No se pudo iniciar la escucha`);
    }
    
    return success;
  }, [isInitialized]);

  // Función para detener escucha
  const stopListening = useCallback((): void => {
    console.log(`🛑 [${componentNameRef.current}] Deteniendo escucha...`);
    unifiedVoiceService.stopListening(componentNameRef.current);
  }, []);

  // Función para resetear transcript
  const resetTranscript = useCallback((): void => {
    setTranscript('');
    console.log(`🔄 [${componentNameRef.current}] Transcript reseteado`);
  }, []);

  // Función de limpieza
  const cleanup = useCallback((): void => {
    console.log(`🧹 [${componentNameRef.current}] Limpiando recursos de voz...`);
    stopListening();
    setIsInitialized(false);
    setVoiceState('idle');
    setIsListening(false);
    setError(null);
    setTranscript('');
  }, [stopListening]);

  // Función para obtener información de debug
  const getDebugInfo = useCallback((): string => {
    const localInfo = [
      `Componente: ${componentNameRef.current}`,
      `Estado local: ${voiceState}`,
      `Escuchando: ${isListening}`,
      `Inicializado: ${isInitialized}`,
      `Soportado: ${isSupported}`,
      `Error: ${error || 'ninguno'}`,
      `Transcript: "${transcript}"`,
      '--- Servicio Unificado ---',
      unifiedVoiceService.getDebugInfo()
    ];
    
    return localInfo.join('\n');
  }, [voiceState, isListening, isInitialized, isSupported, error, transcript]);

  // Verificar soporte inicial
  useEffect(() => {
    const checkSupport = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const supported = !!SpeechRecognition;
      
      setIsSupported(supported);
      
      if (!supported) {
        setVoiceState('disabled');
        setError('Reconocimiento de voz no soportado en este navegador');
        console.warn(`⚠️ [${componentNameRef.current}] Reconocimiento de voz no soportado`);
      }
      
      return supported;
    };

    if (checkSupport() && autoInitialize) {
      initialize();
    }
  }, [autoInitialize, initialize]);

  // Sincronizar estado con el servicio
  useEffect(() => {
    const syncState = () => {
      const serviceState = unifiedVoiceService.getState();
      const serviceListening = unifiedVoiceService.isListening();
      const serviceReady = unifiedVoiceService.isReady();
      
      setVoiceState(serviceState);
      setIsListening(serviceListening);
      setIsInitialized(serviceReady);
    };

    // Sincronizar inmediatamente
    syncState();

    // Configurar intervalo de sincronización (opcional, para casos edge)
    const syncInterval = setInterval(syncState, 1000);

    return () => {
      clearInterval(syncInterval);
    };
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      console.log(`🔄 [${componentNameRef.current}] Desmontando componente, limpiando recursos...`);
      cleanup();
    };
  }, [cleanup]);

  return {
    // Estado
    voiceState,
    isListening,
    isInitialized,
    isSupported,
    error,
    transcript,
    
    // Acciones
    initialize,
    startListening,
    stopListening,
    resetTranscript,
    cleanup,
    
    // Información
    getDebugInfo
  };
};

export default useUnifiedVoice;
