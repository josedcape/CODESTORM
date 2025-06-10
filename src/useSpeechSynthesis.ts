/**
 * Hook personalizado para síntesis de voz en CODESTORM
 * Proporciona una interfaz simple para usar síntesis de voz en componentes React
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { speechSynthesisService, SpeechConfig, SpeechStatus, SpeechState } from '../services/SpeechSynthesisService';

export interface UseSpeechSynthesisOptions {
  autoInitialize?: boolean;
  defaultConfig?: Partial<SpeechConfig>;
  onStateChange?: (state: SpeechState) => void;
  onError?: (error: string) => void;
  componentName?: string;
}

export interface UseSpeechSynthesisReturn {
  // Estado
  isInitialized: boolean;
  isSupported: boolean;
  status: SpeechStatus;
  voices: SpeechSynthesisVoice[];
  spanishVoices: SpeechSynthesisVoice[];
  
  // Acciones principales
  speak: (text: string, config?: Partial<SpeechConfig>) => string;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  
  // Configuración
  setPreferredVoice: (voice: SpeechSynthesisVoice) => void;
  updateConfig: (config: Partial<SpeechConfig>) => void;
  
  // Utilidades
  initialize: () => Promise<boolean>;
  cleanup: () => void;
  isPlaying: boolean;
  isPaused: boolean;
  canSpeak: boolean;
}

export const useSpeechSynthesis = (options: UseSpeechSynthesisOptions = {}): UseSpeechSynthesisReturn => {
  const {
    autoInitialize = true,
    defaultConfig = {},
    onStateChange,
    onError,
    componentName = 'UnknownComponent'
  } = options;

  // Estado local
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [status, setStatus] = useState<SpeechStatus>({
    state: 'idle',
    currentItem: null,
    queueLength: 0,
    progress: 0,
    currentCharIndex: 0
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [spanishVoices, setSpanishVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Referencias
  const componentNameRef = useRef(componentName);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Verificar soporte
  useEffect(() => {
    const supported = !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
    setIsSupported(supported);
    
    if (!supported) {
      console.warn(`⚠️ [${componentNameRef.current}] SpeechSynthesis no soportado`);
      onError?.('Síntesis de voz no soportada en este navegador');
    }
  }, [onError]);

  // Función de inicialización
  const initialize = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn(`⚠️ [${componentNameRef.current}] No se puede inicializar: no hay soporte`);
      return false;
    }

    try {
      console.log(`🔊 [${componentNameRef.current}] Inicializando síntesis de voz...`);
      
      const success = await speechSynthesisService.initialize();
      
      if (success) {
        setIsInitialized(true);
        
        // Actualizar configuración por defecto si se proporciona
        if (Object.keys(defaultConfig).length > 0) {
          speechSynthesisService.updateDefaultConfig(defaultConfig);
        }
        
        // Cargar voces
        setVoices(speechSynthesisService.getVoices());
        setSpanishVoices(speechSynthesisService.getSpanishVoices());
        
        console.log(`✅ [${componentNameRef.current}] Síntesis de voz inicializada`);
      } else {
        console.error(`❌ [${componentNameRef.current}] Error al inicializar síntesis de voz`);
        onError?.('No se pudo inicializar la síntesis de voz');
      }
      
      return success;
    } catch (error) {
      const errorMessage = `Error de inicialización: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      console.error(`❌ [${componentNameRef.current}] ${errorMessage}`);
      onError?.(errorMessage);
      return false;
    }
  }, [isSupported, defaultConfig, onError]);

  // Función para hablar
  const speak = useCallback((text: string, config: Partial<SpeechConfig> = {}): string => {
    if (!isInitialized) {
      console.warn(`⚠️ [${componentNameRef.current}] Servicio no inicializado`);
      onError?.('Servicio de síntesis no inicializado');
      return '';
    }

    if (!text.trim()) {
      console.warn(`⚠️ [${componentNameRef.current}] Texto vacío`);
      return '';
    }

    console.log(`🔊 [${componentNameRef.current}] Reproduciendo: "${text.substring(0, 50)}..."`);
    
    const speechId = speechSynthesisService.speak(text, {
      ...config,
      onStart: () => {
        console.log(`▶️ [${componentNameRef.current}] Síntesis iniciada`);
        config.onStart?.();
      },
      onEnd: () => {
        console.log(`✅ [${componentNameRef.current}] Síntesis completada`);
        config.onEnd?.();
      },
      onError: (error) => {
        console.error(`❌ [${componentNameRef.current}] Error en síntesis:`, error);
        onError?.(error);
        config.onError?.(error);
      }
    });

    return speechId;
  }, [isInitialized, onError]);

  // Funciones de control
  const pause = useCallback((): void => {
    console.log(`⏸️ [${componentNameRef.current}] Pausando síntesis`);
    speechSynthesisService.pause();
  }, []);

  const resume = useCallback((): void => {
    console.log(`▶️ [${componentNameRef.current}] Reanudando síntesis`);
    speechSynthesisService.resume();
  }, []);

  const stop = useCallback((): void => {
    console.log(`⏹️ [${componentNameRef.current}] Deteniendo síntesis`);
    speechSynthesisService.stop();
  }, []);

  // Funciones de configuración
  const setPreferredVoice = useCallback((voice: SpeechSynthesisVoice): void => {
    console.log(`🎤 [${componentNameRef.current}] Cambiando voz a: ${voice.name}`);
    speechSynthesisService.setPreferredVoice(voice);
  }, []);

  const updateConfig = useCallback((config: Partial<SpeechConfig>): void => {
    console.log(`⚙️ [${componentNameRef.current}] Actualizando configuración`);
    speechSynthesisService.updateDefaultConfig(config);
  }, []);

  // Función de limpieza
  const cleanup = useCallback((): void => {
    console.log(`🧹 [${componentNameRef.current}] Limpiando recursos de síntesis`);
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setIsInitialized(false);
  }, []);

  // Suscribirse a cambios de estado
  useEffect(() => {
    if (isInitialized) {
      const unsubscribe = speechSynthesisService.subscribe((newStatus) => {
        setStatus(newStatus);
        onStateChange?.(newStatus.state);
      });
      
      unsubscribeRef.current = unsubscribe;
      
      return () => {
        unsubscribe();
      };
    }
  }, [isInitialized, onStateChange]);

  // Inicialización automática
  useEffect(() => {
    if (isSupported && autoInitialize && !isInitialized) {
      const initTimer = setTimeout(() => {
        initialize().catch(error => {
          console.warn(`⚠️ [${componentNameRef.current}] Inicialización automática falló:`, error);
        });
      }, 100);
      
      return () => clearTimeout(initTimer);
    }
  }, [isSupported, autoInitialize, isInitialized, initialize]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      console.log(`🔄 [${componentNameRef.current}] Desmontando componente, limpiando recursos...`);
      cleanup();
    };
  }, [cleanup]);

  // Estados derivados
  const isPlaying = status.state === 'speaking';
  const isPaused = status.state === 'paused';
  const canSpeak = isInitialized && isSupported && status.state !== 'error';

  return {
    // Estado
    isInitialized,
    isSupported,
    status,
    voices,
    spanishVoices,
    
    // Acciones principales
    speak,
    pause,
    resume,
    stop,
    
    // Configuración
    setPreferredVoice,
    updateConfig,
    
    // Utilidades
    initialize,
    cleanup,
    isPlaying,
    isPaused,
    canSpeak
  };
};

export default useSpeechSynthesis;
