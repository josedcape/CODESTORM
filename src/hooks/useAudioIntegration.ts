/**
 * Hook para integración de audio en componentes de CODESTORM
 * Proporciona funcionalidades de síntesis de voz, efectos de sonido y reconocimiento de voz
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { audioService } from '../services/AudioService';
import { nativeVoiceRecognitionService, VoiceRecognitionEvent } from '../services/NativeVoiceRecognitionService';

export interface AudioIntegrationOptions {
  enableSpeechSynthesis?: boolean;
  enableSoundEffects?: boolean;
  enableVoiceRecognition?: boolean;
  autoSpeakResponses?: boolean;
  playMessageSounds?: boolean;
  voiceActivationKeyword?: string;
}

export interface AudioIntegrationState {
  isSpeaking: boolean;
  isListening: boolean;
  isStormMode: boolean;
  currentTranscript: string;
  audioEnabled: boolean;
  voiceEnabled: boolean;
  hasAudioPermission: boolean;
}

export interface AudioIntegrationActions {
  speakText: (text: string, options?: any) => Promise<void>;
  stopSpeaking: () => void;
  startListening: () => void;
  stopListening: () => void;
  playSound: (effectId: string) => Promise<void>;
  playMessageSent: () => Promise<void>;
  playMessageReceived: () => Promise<void>;
  playProcessStart: () => Promise<void>;
  playProcessComplete: () => Promise<void>;
  playError: () => Promise<void>;
  activateStorm: () => void;
  toggleAudio: () => void;
  toggleVoice: () => void;
}

export const useAudioIntegration = (
  options: AudioIntegrationOptions = {}
): AudioIntegrationState & AudioIntegrationActions => {
  const {
    enableSpeechSynthesis = true,
    enableSoundEffects = true,
    enableVoiceRecognition = true,
    autoSpeakResponses = false,
    playMessageSounds = true,
    voiceActivationKeyword = 'storm'
  } = options;

  const [state, setState] = useState<AudioIntegrationState>({
    isSpeaking: false,
    isListening: false,
    isStormMode: false,
    currentTranscript: '',
    audioEnabled: true,
    voiceEnabled: true,
    hasAudioPermission: false
  });

  const speakingCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const lastSpokenText = useRef<string>('');

  // Verificar estado de síntesis de voz
  useEffect(() => {
    const checkSpeakingStatus = () => {
      const currentSpeaking = audioService.isSpeaking();
      setState(prev => {
        // Solo actualizar si el estado realmente cambió
        if (prev.isSpeaking !== currentSpeaking) {
          return {
            ...prev,
            isSpeaking: currentSpeaking
          };
        }
        return prev;
      });
    };

    speakingCheckInterval.current = setInterval(checkSpeakingStatus, 500);

    return () => {
      if (speakingCheckInterval.current) {
        clearInterval(speakingCheckInterval.current);
      }
    };
  }, []);

  // Listener para eventos de reconocimiento de voz
  useEffect(() => {
    const handleVoiceEvent = (event: VoiceRecognitionEvent) => {
      switch (event.type) {
        case 'start':
          setState(prev => ({
            ...prev,
            isListening: true,
            isStormMode: nativeVoiceRecognitionService.isInStormMode()
          }));
          break;

        case 'result':
          setState(prev => ({
            ...prev,
            currentTranscript: event.data?.transcript || ''
          }));
          break;

        case 'end':
          setState(prev => ({
            ...prev,
            isListening: false,
            isStormMode: false
          }));
          break;

        case 'storm-detected':
          setState(prev => ({
            ...prev,
            isStormMode: true
          }));
          break;

        case 'error':
          setState(prev => ({
            ...prev,
            isListening: false,
            isStormMode: false
          }));
          break;
      }
    };

    if (enableVoiceRecognition) {
      nativeVoiceRecognitionService.addEventListener(handleVoiceEvent);
    }

    return () => {
      if (enableVoiceRecognition) {
        nativeVoiceRecognitionService.removeEventListener(handleVoiceEvent);
      }
    };
  }, [enableVoiceRecognition]);

  // Verificar permisos de audio
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Para el servicio nativo, simplemente verificamos si está soportado
        const hasPermission = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        setState(prev => ({
          ...prev,
          hasAudioPermission: hasPermission
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          hasAudioPermission: false
        }));
      }
    };

    if (enableVoiceRecognition) {
      checkPermissions();
    }
  }, [enableVoiceRecognition]);

  // Funciones de síntesis de voz
  const speakText = useCallback(async (text: string, options?: any) => {
    if (!enableSpeechSynthesis || !state.audioEnabled || !text.trim()) return;

    // Evitar repetir el mismo texto
    if (lastSpokenText.current === text) return;
    lastSpokenText.current = text;

    try {
      await audioService.speakText(text, options);
    } catch (error) {
      console.error('Error en síntesis de voz:', error);
    }
  }, [enableSpeechSynthesis, state.audioEnabled]);

  const stopSpeaking = useCallback(() => {
    audioService.stopSpeaking();
    lastSpokenText.current = '';
  }, []);

  // Funciones de reconocimiento de voz
  const startListening = useCallback(() => {
    if (!enableVoiceRecognition || !state.voiceEnabled || !state.hasAudioPermission) return;
    nativeVoiceRecognitionService.startListening();
  }, [enableVoiceRecognition, state.voiceEnabled, state.hasAudioPermission]);

  const stopListening = useCallback(() => {
    nativeVoiceRecognitionService.stopListening();
  }, []);

  const activateStorm = useCallback(() => {
    if (!enableVoiceRecognition || !state.voiceEnabled) return;
    // El servicio nativo no tiene activateStormCommand, usar startListening
    nativeVoiceRecognitionService.startListening();
  }, [enableVoiceRecognition, state.voiceEnabled]);

  // Funciones de efectos de sonido
  const playSound = useCallback(async (effectId: string) => {
    if (!enableSoundEffects || !state.audioEnabled) return;

    try {
      await audioService.playSound(effectId);
    } catch (error) {
      console.error('Error reproduciendo efecto de sonido:', error);
    }
  }, [enableSoundEffects, state.audioEnabled]);

  // Efectos de sonido específicos
  const playMessageSent = useCallback(async () => {
    if (playMessageSounds) {
      await playSound('messageTransmit');
    }
  }, [playSound, playMessageSounds]);

  const playMessageReceived = useCallback(async () => {
    if (playMessageSounds) {
      await playSound('voiceListening');
    }
  }, [playSound, playMessageSounds]);

  const playProcessStart = useCallback(async () => {
    await playSound('systemStart');
  }, [playSound]);

  const playProcessComplete = useCallback(async () => {
    await playSound('processComplete');
  }, [playSound]);

  const playError = useCallback(async () => {
    await playSound('systemError');
  }, [playSound]);

  // Controles de configuración
  const toggleAudio = useCallback(() => {
    setState(prev => {
      const newAudioEnabled = !prev.audioEnabled;

      // Detener síntesis si se desactiva
      if (!newAudioEnabled && prev.isSpeaking) {
        audioService.stopSpeaking();
      }

      return {
        ...prev,
        audioEnabled: newAudioEnabled
      };
    });
  }, []);

  const toggleVoice = useCallback(() => {
    setState(prev => {
      const newVoiceEnabled = !prev.voiceEnabled;

      // Detener reconocimiento si se desactiva
      if (!newVoiceEnabled && prev.isListening) {
        nativeVoiceRecognitionService.stopListening();
      }

      return {
        ...prev,
        voiceEnabled: newVoiceEnabled
      };
    });
  }, []);

  // Función para hablar respuestas automáticamente
  const speakResponse = useCallback(async (text: string) => {
    if (autoSpeakResponses && enableSpeechSynthesis) {
      // Filtrar texto para síntesis (remover markdown, etc.)
      const cleanText = text
        .replace(/```[\s\S]*?```/g, '[código]')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/#{1,6}\s+/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim();

      if (cleanText && cleanText.length < 500) { // Limitar longitud
        await speakText(cleanText);
      }
    }
  }, [autoSpeakResponses, enableSpeechSynthesis, speakText]);

  return {
    // Estado
    ...state,

    // Acciones
    speakText,
    stopSpeaking,
    startListening,
    stopListening,
    playSound,
    playMessageSent,
    playMessageReceived,
    playProcessStart,
    playProcessComplete,
    playError,
    activateStorm,
    toggleAudio,
    toggleVoice,

    // Función adicional para respuestas automáticas
    speakResponse
  };
};
