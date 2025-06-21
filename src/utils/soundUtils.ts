/**
 * Utilidades para reproducir sonidos en la aplicación
 */

/**
 * Reproduce un archivo de sonido con manejo mejorado de permisos
 * @param soundFile - Nombre del archivo de sonido (ej: 'futur.mp3')
 * @param volume - Volumen del sonido (0.0 a 1.0)
 */
export const playSound = (soundFile: string, volume: number = 0.5): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      console.log(`🔊 Intentando reproducir sonido: ${soundFile}`);

      const audio = new Audio(`/${soundFile}`);
      audio.volume = Math.max(0, Math.min(1, volume));

      // Configurar eventos del audio
      audio.addEventListener('loadstart', () => {
        console.log(`📥 Iniciando carga de ${soundFile}`);
      });

      audio.addEventListener('canplay', () => {
        console.log(`✅ Audio ${soundFile} listo para reproducir`);
      });

      audio.addEventListener('ended', () => {
        console.log(`🎵 Reproducción de ${soundFile} completada`);
        resolve(true);
      });

      audio.addEventListener('error', (error) => {
        console.warn(`❌ Error al cargar ${soundFile}:`, error);
        resolve(false);
      });

      // Intentar reproducir
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`🎶 Sonido ${soundFile} reproduciéndose exitosamente`);
          })
          .catch(error => {
            console.warn(`⚠️ No se pudo reproducir ${soundFile}:`, error.message);

            // Intentar reproducir después de interacción del usuario
            if (error.name === 'NotAllowedError') {
              console.log('🔒 Reproducción bloqueada por política del navegador. Esperando interacción del usuario...');

              // Crear función para reproducir después de click
              const playAfterInteraction = () => {
                audio.play()
                  .then(() => {
                    console.log(`🎶 Sonido ${soundFile} reproducido después de interacción`);
                    resolve(true);
                  })
                  .catch(() => resolve(false));

                // Remover listener después del primer uso
                document.removeEventListener('click', playAfterInteraction);
                document.removeEventListener('keydown', playAfterInteraction);
              };

              // Agregar listeners para interacción
              document.addEventListener('click', playAfterInteraction, { once: true });
              document.addEventListener('keydown', playAfterInteraction, { once: true });
            }

            resolve(false);
          });
      }

    } catch (error) {
      console.warn(`💥 Error crítico al crear audio para ${soundFile}:`, error);
      resolve(false);
    }
  });
};

/**
 * Reproduce el sonido de éxito (futur.mp3) con logging mejorado
 */
export const playSuccessSound = async (): Promise<boolean> => {
  console.log('🎉 Reproduciendo sonido de éxito...');
  const result = await playSound('futur.mp3', 0.6);

  if (result) {
    console.log('✅ Sonido de éxito reproducido correctamente');
  } else {
    console.warn('⚠️ No se pudo reproducir el sonido de éxito');
  }

  return result;
};

/**
 * Reproduce el sonido de trueno
 */
export const playThunderSound = async (): Promise<boolean> => {
  console.log('⚡ Reproduciendo sonido de trueno...');
  return await playSound('trueno.mp3', 0.4);
};

/**
 * Precargar un archivo de sonido para reproducción más rápida
 * @param soundFile - Nombre del archivo de sonido
 */
export const preloadSound = (soundFile: string): void => {
  try {
    const audio = new Audio(`/${soundFile}`);
    audio.preload = 'auto';
    console.log(`🎵 Sonido precargado: ${soundFile}`);
  } catch (error) {
    console.warn('Error al precargar sonido:', error);
  }
};

/**
 * Precargar todos los sonidos de la aplicación
 */
export const preloadAllSounds = (): void => {
  console.log('🎵 Precargando todos los sonidos...');
  preloadSound('futur.mp3');
  preloadSound('trueno.mp3');

  // Habilitar audio después de la primera interacción
  enableAudioAfterInteraction();
};

/**
 * Habilita el audio después de la primera interacción del usuario
 */
export const enableAudioAfterInteraction = (): void => {
  let audioEnabled = false;

  const enableAudio = () => {
    if (audioEnabled) return;

    console.log('🔓 Habilitando audio después de interacción del usuario');

    // Crear y reproducir un audio silencioso para "desbloquear" el audio
    const silentAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    silentAudio.volume = 0.01;

    silentAudio.play()
      .then(() => {
        console.log('✅ Audio habilitado exitosamente');
        audioEnabled = true;
      })
      .catch(() => {
        console.log('⚠️ No se pudo habilitar el audio automáticamente');
      });
  };

  // Agregar listeners para diferentes tipos de interacción
  const events = ['click', 'touchstart', 'keydown'];

  events.forEach(event => {
    document.addEventListener(event, enableAudio, { once: true, passive: true });
  });

  console.log('🎧 Listeners de audio configurados para primera interacción');
};
