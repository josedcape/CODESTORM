import { useState, useEffect } from 'react';

/**
 * Hook personalizado para gestionar la lógica de la animación de introducción
 * @param pageKey - Clave única para identificar la página (opcional)
 * @returns Un objeto con el estado de la animación y funciones para controlarla
 */
const useIntroAnimation = (pageKey?: string) => {
  // Inicializar con true para mostrar la animación por defecto
  const [showIntro, setShowIntro] = useState<boolean>(true);

  // Generar la clave de localStorage basada en la página
  const storageKey = pageKey ? `codestorm-intro-seen-${pageKey}` : 'codestorm-intro-seen';

  useEffect(() => {
    // Pequeño delay para asegurar que el componente se monte correctamente
    const timer = setTimeout(() => {
      try {
        // Comprobar si el usuario ya ha visto la animación para esta página específica
        const hasSeenIntro = localStorage.getItem(storageKey);

        console.log(`🎬 Verificando intro para ${pageKey || 'página principal'}:`, hasSeenIntro);
        console.log(`🎬 StorageKey:`, storageKey);

        if (!hasSeenIntro || hasSeenIntro !== 'true') {
          // Si no ha visto la animación, mostrarla
          console.log(`🎬 Mostrando animación de introducción para ${pageKey || 'página principal'}`);
          setShowIntro(true);
        } else {
          console.log(`🎬 El usuario ya ha visto la animación para ${pageKey || 'página principal'}`);
          setShowIntro(false);
        }
      } catch (error) {
        console.error('Error al acceder a localStorage:', error);
        // En caso de error, mostrar la animación para estar seguros
        console.log('🎬 Error en localStorage, mostrando animación por seguridad');
        setShowIntro(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [storageKey, pageKey]);

  /**
   * Función para marcar la animación como vista y ocultarla
   */
  const completeIntro = () => {
    console.log(`🎬 Completando intro para ${pageKey || 'página principal'}`);

    try {
      // Guardar en localStorage que el usuario ya ha visto la animación para esta página
      localStorage.setItem(storageKey, 'true');
      console.log(`🎬 Animación completada y marcada como vista para ${pageKey || 'página principal'}`);
      console.log(`🎬 Valor guardado en localStorage:`, localStorage.getItem(storageKey));
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
    }

    // Ocultar la animación
    setShowIntro(false);
    console.log(`🎬 showIntro establecido a false`);
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
