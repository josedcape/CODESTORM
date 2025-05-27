import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Definir el tipo para el contexto
interface UIContextType {
  // Estado de visibilidad de paneles
  isSidebarVisible: boolean;
  isFileExplorerVisible: boolean;
  isTerminalVisible: boolean;
  isCodeModifierVisible: boolean;

  // Tamaño de pantalla
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;

  // Métodos para cambiar el estado
  toggleSidebar: () => void;
  toggleFileExplorer: () => void;
  toggleTerminal: () => void;
  toggleCodeModifier: () => void;

  // Métodos para establecer el estado
  setSidebarVisible: (visible: boolean) => void;
  setFileExplorerVisible: (visible: boolean) => void;
  setTerminalVisible: (visible: boolean) => void;
  setCodeModifierVisible: (visible: boolean) => void;

  // Estado de panel expandido (para vista móvil)
  expandedPanel: 'sidebar' | 'explorer' | 'editor' | 'terminal' | 'codeModifier' | null;
  setExpandedPanel: (panel: 'sidebar' | 'explorer' | 'editor' | 'terminal' | 'codeModifier' | null) => void;
}

// Crear el contexto con un valor por defecto
const UIContext = createContext<UIContextType | undefined>(undefined);

// Proveedor del contexto
export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Estado para la visibilidad de los paneles
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isFileExplorerVisible, setIsFileExplorerVisible] = useState(true);
  const [isTerminalVisible, setIsTerminalVisible] = useState(true);
  const [isCodeModifierVisible, setIsCodeModifierVisible] = useState(false);

  // Estado para el panel expandido en vista móvil
  const [expandedPanel, setExpandedPanel] = useState<'sidebar' | 'explorer' | 'editor' | 'terminal' | 'codeModifier' | null>(null);

  // Estado para el tamaño de pantalla
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // Efecto para detectar el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640); // sm
      setIsTablet(width >= 640 && width < 1024); // md-lg
      setIsDesktop(width >= 1024); // lg+

      // Ajustar la visibilidad de los paneles según el tamaño de pantalla
      if (width < 640) {
        // En móvil, ocultar sidebar y file explorer por defecto
        setIsSidebarVisible(false);
        setIsFileExplorerVisible(false);
      } else if (width >= 640 && width < 1024) {
        // En tablet, mostrar sidebar pero ocultar file explorer por defecto
        setIsSidebarVisible(true);
        setIsFileExplorerVisible(false);
      } else {
        // En desktop, mostrar todo
        setIsSidebarVisible(true);
        setIsFileExplorerVisible(true);
      }
    };

    // Ejecutar al montar el componente
    handleResize();

    // Añadir listener para cambios de tamaño
    window.addEventListener('resize', handleResize);

    // Limpiar listener al desmontar
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Métodos para cambiar el estado
  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);
  const toggleFileExplorer = () => setIsFileExplorerVisible(!isFileExplorerVisible);
  const toggleTerminal = () => setIsTerminalVisible(!isTerminalVisible);
  const toggleCodeModifier = () => setIsCodeModifierVisible(!isCodeModifierVisible);

  // Valor del contexto
  const value: UIContextType = {
    isSidebarVisible,
    isFileExplorerVisible,
    isTerminalVisible,
    isCodeModifierVisible,
    isMobile,
    isTablet,
    isDesktop,
    toggleSidebar,
    toggleFileExplorer,
    toggleTerminal,
    toggleCodeModifier,
    setSidebarVisible: setIsSidebarVisible,
    setFileExplorerVisible: setIsFileExplorerVisible,
    setTerminalVisible: setIsTerminalVisible,
    setCodeModifierVisible: setIsCodeModifierVisible,
    expandedPanel,
    setExpandedPanel
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI debe ser usado dentro de un UIProvider');
  }
  return context;
};
