import { useCallback, useEffect, useState } from 'react';
import { 
  playCompletionSound, 
  getAudioSettings, 
  saveAudioSettings, 
  AudioSettings 
} from '../utils/soundUtils';

/**
 * Hook para manejar sonidos de finalización de procesos
 */
export const useCompletionSounds = () => {
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => getAudioSettings());

  // Actualizar configuración de audio
  const updateAudioSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    const updatedSettings = { ...audioSettings, ...newSettings };
    setAudioSettings(updatedSettings);
    saveAudioSettings(updatedSettings);
  }, [audioSettings]);

  // Reproducir sonido de finalización
  const playSuccess = useCallback(async (processName?: string): Promise<boolean> => {
    return await playCompletionSound(processName);
  }, []);

  // Reproducir sonido específico para Constructor
  const playConstructorComplete = useCallback(async (): Promise<boolean> => {
    return await playCompletionSound('Constructor');
  }, []);

  // Reproducir sonido específico para Agent
  const playAgentComplete = useCallback(async (): Promise<boolean> => {
    return await playCompletionSound('Agent');
  }, []);

  // Reproducir sonido específico para WebAI
  const playWebAIComplete = useCallback(async (): Promise<boolean> => {
    return await playCompletionSound('WebAI');
  }, []);

  // Alternar habilitación de sonidos
  const toggleSounds = useCallback(() => {
    updateAudioSettings({ enabled: !audioSettings.enabled });
  }, [audioSettings.enabled, updateAudioSettings]);

  // Alternar sonidos de finalización específicamente
  const toggleCompletionSounds = useCallback(() => {
    updateAudioSettings({ completionSoundEnabled: !audioSettings.completionSoundEnabled });
  }, [audioSettings.completionSoundEnabled, updateAudioSettings]);

  // Cambiar volumen
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    updateAudioSettings({ volume: clampedVolume });
  }, [updateAudioSettings]);

  // Verificar si los sonidos están habilitados
  const isSoundEnabled = audioSettings.enabled && audioSettings.completionSoundEnabled;

  return {
    // Estado
    audioSettings,
    isSoundEnabled,
    
    // Acciones de reproducción
    playSuccess,
    playConstructorComplete,
    playAgentComplete,
    playWebAIComplete,
    
    // Configuración
    updateAudioSettings,
    toggleSounds,
    toggleCompletionSounds,
    setVolume
  };
};

export default useCompletionSounds;
