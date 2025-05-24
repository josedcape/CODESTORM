/**
 * Utilidad para inicializar el reconocimiento de voz de manera consistente
 * en todas las páginas de CODESTORM
 */

export interface VoiceInitializerOptions {
  onStormCommand?: (command: string) => void;
  enableDebug?: boolean;
  autoStart?: boolean;
}

/**
 * Inicializa el reconocimiento de voz con configuración estándar
 */
export const initializeVoiceRecognition = async (options: VoiceInitializerOptions = {}) => {
  try {
    console.log('Inicializando reconocimiento de voz...');
    
    // Importar dinámicamente el servicio
    const { voiceRecognitionService } = await import('../services/VoiceRecognitionService');
    
    // Verificar que el servicio esté disponible
    if (!voiceRecognitionService) {
      console.warn('VoiceRecognitionService no está disponible');
      return null;
    }

    // Inicializar el reconocimiento global
    voiceRecognitionService.initializeGlobalVoiceRecognition();
    
    // Configurar callback si se proporciona
    if (options.onStormCommand) {
      voiceRecognitionService.setStormCommandCallback(options.onStormCommand);
    }

    console.log('Reconocimiento de voz inicializado correctamente');
    return voiceRecognitionService;
    
  } catch (error) {
    console.error('Error al inicializar reconocimiento de voz:', error);
    return null;
  }
};

/**
 * Limpia los callbacks del reconocimiento de voz
 */
export const cleanupVoiceRecognition = async () => {
  try {
    const { voiceRecognitionService } = await import('../services/VoiceRecognitionService');
    voiceRecognitionService.removeStormCommandCallback();
    console.log('Callbacks de reconocimiento de voz limpiados');
  } catch (error) {
    console.error('Error al limpiar reconocimiento de voz:', error);
  }
};

/**
 * Hook personalizado para usar reconocimiento de voz en componentes React
 */
export const useVoiceRecognition = (options: VoiceInitializerOptions = {}) => {
  const initializeVoice = async () => {
    return await initializeVoiceRecognition(options);
  };

  const cleanup = async () => {
    await cleanupVoiceRecognition();
  };

  return {
    initializeVoice,
    cleanup
  };
};
