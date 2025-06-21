/**
 * Utilidad para inicializar el reconocimiento de voz nativo de manera consistente
 * en todas las páginas de CODESTORM
 * Actualizado para usar NativeVoiceRecognitionService en lugar de Annyang
 */

export interface VoiceInitializerOptions {
  onStormCommand?: (command: string) => void;
  enableDebug?: boolean;
  autoStart?: boolean;
}

/**
 * Inicializa el reconocimiento de voz nativo con configuración estándar
 */
export const initializeVoiceRecognition = async (options: VoiceInitializerOptions = {}) => {
  try {
    console.log('Inicializando reconocimiento de voz nativo...');

    // Importar dinámicamente el nuevo servicio nativo
    const { nativeVoiceRecognitionService } = await import('../services/NativeVoiceRecognitionService');

    // Verificar que el servicio esté disponible
    if (!nativeVoiceRecognitionService) {
      console.warn('NativeVoiceRecognitionService no está disponible');
      return null;
    }

    // Actualizar configuración si se especifica
    if (options.enableDebug !== undefined) {
      nativeVoiceRecognitionService.updateSettings({ debug: options.enableDebug });
    }

    // Inicializar el reconocimiento global
    nativeVoiceRecognitionService.initializeGlobalVoiceRecognition();

    // Configurar callback si se proporciona
    if (options.onStormCommand) {
      nativeVoiceRecognitionService.setStormCommandCallback(options.onStormCommand);
    }

    console.log('Reconocimiento de voz nativo inicializado correctamente');
    return nativeVoiceRecognitionService;

  } catch (error) {
    console.error('Error al inicializar reconocimiento de voz nativo:', error);
    return null;
  }
};

/**
 * Limpia los callbacks del reconocimiento de voz nativo
 */
export const cleanupVoiceRecognition = async () => {
  try {
    const { nativeVoiceRecognitionService } = await import('../services/NativeVoiceRecognitionService');
    nativeVoiceRecognitionService.removeStormCommandCallback();
    console.log('Callbacks de reconocimiento de voz nativo limpiados');
  } catch (error) {
    console.error('Error al limpiar reconocimiento de voz nativo:', error);
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
