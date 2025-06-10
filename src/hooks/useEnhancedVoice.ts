/**
 * Hook mejorado para reconocimiento de voz en CODESTORM
 * Utiliza el EnhancedVoiceService con optimizaciones para español
 * Incluye comandos específicos y auto-reparación
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  enhancedVoiceService, 
  EnhancedVoiceState, 
  EnhancedVoiceConfig, 
  VoiceCallbacks,
  TechnicalTerm 
} from '../services/EnhancedVoiceService';

export interface UseEnhancedVoiceOptions extends EnhancedVoiceConfig {
  onTranscript?: (transcript: string, confidence: number) => void;
  onFinalTranscript?: (transcript: string, confidence: number) => void;
  onCommand?: (command: string, confidence: number) => void;
  onError?: (error: string) => void;
  componentName?: string;
  autoInitialize?: boolean;
  autoRepair?: boolean;
}

export interface UseEnhancedVoiceReturn {
  // Estado
  voiceState: EnhancedVoiceState;
  isListening: boolean;
  isInitialized: boolean;
  isSupported: boolean;
  error: string | null;
  transcript: string;
  confidence: number;
  lastCommand: string | null;
  repairAttempts: number;

  // Acciones
  initialize: () => Promise<boolean>;
  startListening: () => boolean;
  stopListening: () => void;
  resetTranscript: () => void;
  cleanup: () => void;
  repair: () => Promise<boolean>;
  clearError: () => void;

  // Información
  getDebugInfo: () => string;
  getTechnicalTerms: () => TechnicalTerm[];
  checkPermissions: () => Promise<{
    speechRecognition: boolean;
    microphone: boolean;
    details: string[];
  }>;
}

export const useEnhancedVoice = (options: UseEnhancedVoiceOptions = {}): UseEnhancedVoiceReturn => {
  const {
    onTranscript,
    onFinalTranscript,
    onCommand,
    onError,
    componentName = 'UnknownComponent',
    autoInitialize = true,
    autoRepair = true,
    ...voiceConfig
  } = options;

  // Estado local
  const [voiceState, setVoiceState] = useState<EnhancedVoiceState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [repairAttempts, setRepairAttempts] = useState(0);

  // Referencias para callbacks
  const componentNameRef = useRef(componentName);
  const callbacksRef = useRef<VoiceCallbacks>({});

  // Actualizar referencias
  useEffect(() => {
    componentNameRef.current = componentName;
    callbacksRef.current = {
      onTranscript: (transcript: string, confidence: number) => {
        setTranscript(transcript);
        setConfidence(confidence);
        onTranscript?.(transcript, confidence);
      },
      onFinalTranscript: (transcript: string, confidence: number) => {
        setTranscript(transcript);
        setConfidence(confidence);
        onFinalTranscript?.(transcript, confidence);
      },
      onCommand: (command: string, confidence: number) => {
        setLastCommand(command);
        onCommand?.(command, confidence);
        console.log(`🎤 [${componentNameRef.current}] Comando detectado: "${command}" (${Math.round(confidence * 100)}%)`);
      },
      onError: (error: string) => {
        setError(error);
        onError?.(error);
        console.error(`❌ [${componentNameRef.current}] Error de voz: ${error}`);
      },
      onStateChange: (state: EnhancedVoiceState) => {
        setVoiceState(state);
        setIsListening(state === 'listening');
        setIsInitialized(state === 'ready' || state === 'listening' || state === 'processing');
        
        if (state === 'error' && autoRepair) {
          console.log(`🔧 [${componentNameRef.current}] Auto-reparación habilitada, intentando reparar...`);
          setTimeout(() => repair(), 1000);
        }
      },
      onStart: () => {
        console.log(`🎤 [${componentNameRef.current}] Reconocimiento iniciado`);
        setError(null);
      },
      onEnd: () => {
        console.log(`🔇 [${componentNameRef.current}] Reconocimiento terminado`);
      }
    };
  }, [onTranscript, onFinalTranscript, onCommand, onError, componentName, autoRepair]);

  // Función de inicialización
  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      console.log(`🎤 [${componentNameRef.current}] Inicializando reconocimiento de voz mejorado...`);

      setError(null);
      setVoiceState('initializing');

      // Configuración optimizada para español
      const config: EnhancedVoiceConfig = {
        language: 'es-ES',
        continuous: false,
        interimResults: true,
        maxAlternatives: 5,
        timeout: 15000,
        enableDebug: true,
        enablePostProcessing: true,
        enableTechnicalTerms: true,
        enableCommandRecognition: true,
        confidenceThreshold: 0.7,
        componentName: componentNameRef.current,
        ...voiceConfig
      };

      const success = await enhancedVoiceService.initialize(config, callbacksRef.current);

      if (success) {
        setIsInitialized(true);
        setIsSupported(true);
        setVoiceState('ready');
        console.log(`✅ [${componentNameRef.current}] Reconocimiento de voz mejorado inicializado`);
      } else {
        setIsInitialized(false);
        setIsSupported(false);
        setVoiceState('error');
        console.error(`❌ [${componentNameRef.current}] Error al inicializar reconocimiento de voz`);
      }

      return success;
    } catch (error) {
      console.error(`❌ [${componentNameRef.current}] Error en inicialización:`, error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
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
      return false;
    }

    console.log(`🎤 [${componentNameRef.current}] Iniciando escucha...`);
    const success = enhancedVoiceService.startListening();
    
    if (success) {
      setError(null);
      setLastCommand(null);
    }
    
    return success;
  }, [isInitialized]);

  // Función para detener escucha
  const stopListening = useCallback((): void => {
    console.log(`🔇 [${componentNameRef.current}] Deteniendo escucha...`);
    enhancedVoiceService.stopListening();
  }, []);

  // Función para limpiar transcript
  const resetTranscript = useCallback((): void => {
    setTranscript('');
    setConfidence(0);
    setLastCommand(null);
  }, []);

  // Función de limpieza
  const cleanup = useCallback((): void => {
    console.log(`🔄 [${componentNameRef.current}] Limpiando recursos...`);
    enhancedVoiceService.cleanup();
    setVoiceState('idle');
    setIsListening(false);
    setIsInitialized(false);
    setError(null);
    setTranscript('');
    setConfidence(0);
    setLastCommand(null);
  }, []);

  // Función de reparación
  const repair = useCallback(async (): Promise<boolean> => {
    console.log(`🔧 [${componentNameRef.current}] Iniciando reparación manual...`);
    
    try {
      // Limpiar estado actual
      cleanup();
      
      // Esperar un momento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reinicializar
      const success = await initialize();
      
      if (success) {
        console.log(`✅ [${componentNameRef.current}] Reparación exitosa`);
        setRepairAttempts(0);
      } else {
        console.log(`❌ [${componentNameRef.current}] Reparación falló`);
        setRepairAttempts(prev => prev + 1);
      }
      
      return success;
    } catch (error) {
      console.error(`❌ [${componentNameRef.current}] Error durante reparación:`, error);
      setRepairAttempts(prev => prev + 1);
      return false;
    }
  }, [cleanup, initialize]);

  // Función para limpiar errores
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // Función para obtener información de debug
  const getDebugInfo = useCallback((): string => {
    const info = [
      `Componente: ${componentNameRef.current}`,
      `Estado: ${voiceState}`,
      `Inicializado: ${isInitialized}`,
      `Escuchando: ${isListening}`,
      `Soportado: ${isSupported}`,
      `Error: ${error || 'ninguno'}`,
      `Transcript: "${transcript}"`,
      `Confianza: ${Math.round(confidence * 100)}%`,
      `Último comando: ${lastCommand || 'ninguno'}`,
      `Intentos de reparación: ${repairAttempts}`
    ];

    return info.join('\n');
  }, [voiceState, isInitialized, isListening, isSupported, error, transcript, confidence, lastCommand, repairAttempts]);

  // Función para obtener términos técnicos
  const getTechnicalTerms = useCallback((): TechnicalTerm[] => {
    return enhancedVoiceService.getTechnicalTerms();
  }, []);

  // Función para verificar permisos
  const checkPermissions = useCallback(async () => {
    return await enhancedVoiceService.checkPermissions();
  }, []);

  // Auto-inicialización
  useEffect(() => {
    if (autoInitialize && !isInitialized && voiceState === 'idle') {
      initialize();
    }
  }, [autoInitialize, isInitialized, voiceState, initialize]);

  // Sincronizar estado con el servicio
  useEffect(() => {
    const syncState = () => {
      const serviceState = enhancedVoiceService.getState();
      const serviceListening = enhancedVoiceService.isListening();
      const serviceReady = enhancedVoiceService.isReady();
      const serviceRepairAttempts = enhancedVoiceService.getRepairAttempts();

      setVoiceState(serviceState);
      setIsListening(serviceListening);
      setIsInitialized(serviceReady);
      setRepairAttempts(serviceRepairAttempts);
    };

    // Sincronizar inmediatamente
    syncState();

    // Configurar intervalo de sincronización
    const syncInterval = setInterval(syncState, 2000);

    return () => {
      clearInterval(syncInterval);
    };
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      console.log(`🔄 [${componentNameRef.current}] Desmontando hook...`);
      // No hacer cleanup automático para permitir reutilización del servicio
    };
  }, []);

  return {
    // Estado
    voiceState,
    isListening,
    isInitialized,
    isSupported,
    error,
    transcript,
    confidence,
    lastCommand,
    repairAttempts,

    // Acciones
    initialize,
    startListening,
    stopListening,
    resetTranscript,
    cleanup,
    repair,
    clearError,

    // Información
    getDebugInfo,
    getTechnicalTerms,
    checkPermissions
  };
};
