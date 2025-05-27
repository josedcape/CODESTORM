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
<<<<<<< HEAD
      // ALWAYS SHOW INTRO ANIMATION - Clear any existing localStorage flags
      localStorage.removeItem(storageKey);

      // Always show the intro animation for a fresh experience
      console.log(`🎬 ALWAYS showing intro animation for ${pageKey || 'página principal'} - Fresh experience guaranteed!`);
      setShowIntro(true);
    } catch (error) {
      console.error('Error al acceder a localStorage:', error);
      // Even in case of error, show the animation for better UX
      setShowIntro(true);
=======
      // Comprobar si el usuario ya ha visto la animación para esta página específica
      const hasSeenIntro = localStorage.getItem(storageKey);

      if (!hasSeenIntro) {
        // Si no ha visto la animación, mostrarla
        console.log(`Mostrando animación de introducción para ${pageKey || 'página principal'}`);
        setShowIntro(true);
      } else {
        console.log(`El usuario ya ha visto la animación para ${pageKey || 'página principal'}`);
        setShowIntro(false);
      }
    } catch (error) {
      console.error('Error al acceder a localStorage:', error);
      // En caso de error, no mostrar la animación
      setShowIntro(false);
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c
    }
  }, [storageKey, pageKey]);

  /**
<<<<<<< HEAD
   * Función para completar y ocultar la animación (sin guardar en localStorage)
   */
  const completeIntro = () => {
    // DO NOT save to localStorage - we want the animation to always show
    console.log(`🎬 Intro animation completed for ${pageKey || 'página principal'} - Will show again on next visit!`);
=======
   * Función para marcar la animación como vista y ocultarla
   */
  const completeIntro = () => {
    try {
      // Guardar en localStorage que el usuario ya ha visto la animación para esta página
      localStorage.setItem(storageKey, 'true');
      console.log(`Animación completada y marcada como vista para ${pageKey || 'página principal'}`);
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
    }
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c

    // Ocultar la animación
    setShowIntro(false);
  };

  /**
<<<<<<< HEAD
   * Función para resetear el estado de la animación (siempre disponible)
   */
  const resetIntro = () => {
    try {
      // Clear any localStorage flags (though they shouldn't exist)
      localStorage.removeItem(storageKey);
      console.log(`🎬 Animation reset for ${pageKey || 'página principal'} - Showing intro again!`);
=======
   * Función para resetear el estado de la animación (para pruebas)
   */
  const resetIntro = () => {
    try {
      // Eliminar la marca de localStorage
      localStorage.removeItem(storageKey);
      console.log(`Estado de la animación reseteado para ${pageKey || 'página principal'}`);
>>>>>>> f8bc7e627aae05b91394794e61b3ad52fb438c1c
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
