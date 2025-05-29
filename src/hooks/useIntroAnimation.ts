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
    }
  }, [storageKey, pageKey]);

  /**
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

    // Ocultar la animación
    setShowIntro(false);
  };

  /**
   * Función para resetear el estado de la animación (para pruebas)
   */
  const resetIntro = () => {
    try {
      // Eliminar la marca de localStorage
      localStorage.removeItem(storageKey);
      console.log(`Estado de la animación reseteado para ${pageKey || 'página principal'}`);
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