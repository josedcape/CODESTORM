import { useState, useEffect } from 'react';

/**
 * Hook personalizado para gestionar la lógica de la animación de introducción
 * @returns Un objeto con el estado de la animación y funciones para controlarla
 */
const useIntroAnimation = () => {
  const [showIntro, setShowIntro] = useState<boolean>(false);

  useEffect(() => {
    // Para propósitos de desarrollo, siempre mostrar la animación
    // Comentar esta línea para producción
    setShowIntro(true);

    try {
      // Comprobar si el usuario ya ha visto la animación
      const hasSeenIntro = localStorage.getItem('codestorm-intro-seen');

      if (!hasSeenIntro) {
        // Si no ha visto la animación, mostrarla
        console.log('Mostrando animación de introducción');
        setShowIntro(true);
      } else {
        console.log('El usuario ya ha visto la animación');
        // Para propósitos de desarrollo, mostrar la animación de todos modos
        // Comentar esta línea para producción
        setShowIntro(true);
      }
    } catch (error) {
      console.error('Error al acceder a localStorage:', error);
      // En caso de error, mostrar la animación de todos modos
      setShowIntro(true);
    }
  }, []);

  /**
   * Función para marcar la animación como vista y ocultarla
   */
  const completeIntro = () => {
    try {
      // Guardar en localStorage que el usuario ya ha visto la animación
      localStorage.setItem('codestorm-intro-seen', 'true');
      console.log('Animación completada y marcada como vista');
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
      localStorage.removeItem('codestorm-intro-seen');
      console.log('Estado de la animación reseteado');
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
