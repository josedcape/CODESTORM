import { useState, useEffect } from 'react';

/**
 * Hook personalizado para gestionar la lógica de la animación de introducción
 * @param pageKey - Clave única para identificar la página (opcional)
 * @returns Un objeto con el estado de la animación y funciones para controlarla
 */
const useIntroAnimation = (pageKey?: string) => {
  const [showIntro, setShowIntro] = useState<boolean>(false);

  // Generar la clave de localStorage basada en la página
  const storageKey = pageKey ? `codestorm-intro-seen-${pageKey}` : 'codestorm-intro-seen';

  useEffect(() => {
    try {
      // ALWAYS SHOW INTRO ANIMATION - Clear any existing localStorage flags
      localStorage.removeItem(storageKey);

      // Always show the intro animation for a fresh experience
      console.log(`🎬 ALWAYS showing intro animation for ${pageKey || 'página principal'} - Fresh experience guaranteed!`);
      setShowIntro(true);
    } catch (error) {
      console.error('Error al acceder a localStorage:', error);
      // Even in case of error, show the animation for better UX
      setShowIntro(true);
    }
  }, [storageKey, pageKey]);

  /**
   * Función para completar y ocultar la animación (sin guardar en localStorage)
   */
  const completeIntro = () => {
    // DO NOT save to localStorage - we want the animation to always show
    console.log(`🎬 Intro animation completed for ${pageKey || 'página principal'} - Will show again on next visit!`);

    // Ocultar la animación
    setShowIntro(false);
  };

  /**
   * Función para resetear el estado de la animación (siempre disponible)
   */
  const resetIntro = () => {
    try {
      // Clear any localStorage flags (though they shouldn't exist)
      localStorage.removeItem(storageKey);
      console.log(`🎬 Animation reset for ${pageKey || 'página principal'} - Showing intro again!`);
    } catch (error) {
      console.error('Error al eliminar de localStorage:', error);
    }

    // Mostrar la animación inmediatamente
    setShowIntro(true);
  };

  return {
    showIntro,
    completeIntro,
    resetIntro
  };
};

export default useIntroAnimation;
