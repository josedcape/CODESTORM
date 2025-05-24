import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook personalizado para manejar sonidos de finalización en CODESTORM
 * Reproduce el sonido futur.mp3 cuando se completan procesos
 */
export const useCompletionSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isEnabledRef = useRef<boolean>(true);

  // Inicializar el audio
  useEffect(() => {
    // Crear instancia de audio
    audioRef.current = new Audio('/futur.mp3');
    
    // Configurar propiedades del audio
    if (audioRef.current) {
      audioRef.current.volume = 0.6; // Volumen moderado
      audioRef.current.preload = 'auto'; // Precargar para reproducción inmediata
      
      // Manejar errores de carga
      audioRef.current.addEventListener('error', (e) => {
        console.warn('🔊 Error al cargar sonido de finalización:', e);
      });

      // Manejar carga exitosa
      audioRef.current.addEventListener('canplaythrough', () => {
        console.log('🔊 Sonido de finalización cargado correctamente');
      });
    }

    // Verificar preferencias del usuario desde localStorage
    const soundEnabled = localStorage.getItem('codestorm-completion-sound-enabled');
    if (soundEnabled !== null) {
      isEnabledRef.current = soundEnabled === 'true';
    }

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('error', () => {});
        audioRef.current.removeEventListener('canplaythrough', () => {});
        audioRef.current = null;
      }
    };
  }, []);

  /**
   * Reproduce el sonido de finalización
   * @param delay Retraso en milisegundos antes de reproducir (opcional)
   */
  const playCompletionSound = useCallback((delay: number = 0) => {
    if (!isEnabledRef.current || !audioRef.current) {
      return;
    }

    const playAudio = () => {
      if (audioRef.current) {
        // Resetear el audio al inicio
        audioRef.current.currentTime = 0;
        
        // Reproducir con manejo de errores
        audioRef.current.play().catch((error) => {
          console.warn('🔊 Error al reproducir sonido de finalización:', error);
        });
      }
    };

    if (delay > 0) {
      setTimeout(playAudio, delay);
    } else {
      playAudio();
    }
  }, []);

  /**
   * Habilita o deshabilita el sonido de finalización
   * @param enabled Estado del sonido
   */
  const setCompletionSoundEnabled = useCallback((enabled: boolean) => {
    isEnabledRef.current = enabled;
    localStorage.setItem('codestorm-completion-sound-enabled', enabled.toString());
    
    console.log(`🔊 Sonido de finalización ${enabled ? 'habilitado' : 'deshabilitado'}`);
  }, []);

  /**
   * Obtiene el estado actual del sonido
   */
  const isCompletionSoundEnabled = useCallback(() => {
    return isEnabledRef.current;
  }, []);

  /**
   * Reproduce el sonido con efecto de éxito (volumen gradual)
   */
  const playSuccessSound = useCallback((delay: number = 0) => {
    if (!isEnabledRef.current || !audioRef.current) {
      return;
    }

    const playWithFade = () => {
      if (audioRef.current) {
        // Resetear el audio
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.3; // Empezar con volumen bajo
        
        // Reproducir
        audioRef.current.play().catch((error) => {
          console.warn('🔊 Error al reproducir sonido de éxito:', error);
          return;
        });

        // Fade in gradual
        let currentVolume = 0.3;
        const targetVolume = 0.6;
        const fadeInterval = setInterval(() => {
          if (audioRef.current && currentVolume < targetVolume) {
            currentVolume += 0.05;
            audioRef.current.volume = Math.min(currentVolume, targetVolume);
          } else {
            clearInterval(fadeInterval);
          }
        }, 50);
      }
    };

    if (delay > 0) {
      setTimeout(playWithFade, delay);
    } else {
      playWithFade();
    }
  }, []);

  /**
   * Reproduce el sonido con configuración personalizada
   * @param options Opciones de reproducción
   */
  const playCustomSound = useCallback((options: {
    volume?: number;
    delay?: number;
    fadeIn?: boolean;
  } = {}) => {
    if (!isEnabledRef.current || !audioRef.current) {
      return;
    }

    const { volume = 0.6, delay = 0, fadeIn = false } = options;

    const playAudio = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = fadeIn ? 0.1 : volume;
        
        audioRef.current.play().catch((error) => {
          console.warn('🔊 Error al reproducir sonido personalizado:', error);
          return;
        });

        if (fadeIn) {
          let currentVolume = 0.1;
          const fadeInterval = setInterval(() => {
            if (audioRef.current && currentVolume < volume) {
              currentVolume += 0.05;
              audioRef.current.volume = Math.min(currentVolume, volume);
            } else {
              clearInterval(fadeInterval);
            }
          }, 50);
        }
      }
    };

    if (delay > 0) {
      setTimeout(playAudio, delay);
    } else {
      playAudio();
    }
  }, []);

  /**
   * Precargar el sonido para reproducción inmediata
   */
  const preloadSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, []);

  return {
    playCompletionSound,
    playSuccessSound,
    playCustomSound,
    setCompletionSoundEnabled,
    isCompletionSoundEnabled,
    preloadSound
  };
};

export default useCompletionSound;
