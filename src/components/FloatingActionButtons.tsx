import React, { useState } from 'react';
import {
  Menu,
  X,
  Sidebar,
  FolderTree,
  Terminal as TerminalIcon,
  Code,
  MessageSquare,
  Eye,
  Download,
  ChevronUp,
  Edit
} from 'lucide-react';
import { useUI } from '../contexts/UIContext';

interface FloatingActionButtonsProps {
  onToggleChat: () => void;
  onTogglePreview: () => void;
  onToggleCodeModifier?: () => void;
  showChat: boolean;
  showCodeModifier?: boolean;
}

const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  onToggleChat,
  onTogglePreview,
  onToggleCodeModifier,
  showChat,
  showCodeModifier = false
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    toggleSidebar,
    toggleFileExplorer,
    toggleTerminal,
    isSidebarVisible,
    isFileExplorerVisible,
    isTerminalVisible,
    expandedPanel,
    setExpandedPanel,
    isMobile
  } = useUI();

  // Función para alternar el menú
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Función para manejar la expansión de paneles
  const handlePanelExpand = (panel: 'sidebar' | 'explorer' | 'editor' | 'terminal' | null) => {
    if (expandedPanel === panel) {
      setExpandedPanel(null);
    } else {
      setExpandedPanel(panel);
    }
  };

  return (
    <>
      {/* Botón principal flotante optimizado para móvil */}
      <button
        onClick={toggleMenu}
        className={`
          fixed z-50 mobile-floating-button
          ${isMobile ? 'bottom-4 left-4 w-12 h-12' : 'bottom-6 left-6 w-14 h-14'}
          rounded-full bg-codestorm-accent shadow-lg
          flex items-center justify-center
          hover:bg-blue-600 transition-all duration-200
          transform hover:scale-105 active:scale-95
          -webkit-tap-highlight-color: transparent
          touch-action: manipulation
        `}
        aria-label="Menú de acciones"
      >
        {isMenuOpen ? (
          <X className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-white`} />
        ) : (
          <Menu className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-white`} />
        )}
      </button>

      {/* Menú de acciones optimizado para móvil */}
      {isMenuOpen && (
        <div className={`
          fixed z-50 animate-fadeIn
          ${isMobile
            ? 'bottom-4 left-4 right-4 flex flex-row justify-around bg-codestorm-dark/95 backdrop-blur-sm rounded-lg p-3 border border-codestorm-blue/30'
            : 'bottom-24 left-6 flex flex-col-reverse space-y-reverse space-y-3'
          }
        `}>
          {/* Botón para mostrar/ocultar sidebar */}
          <button
            onClick={toggleSidebar}
            className={`
              mobile-floating-button
              ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}
              rounded-full shadow-lg flex items-center justify-center
              transform hover:scale-105 active:scale-95 transition-all duration-200
              -webkit-tap-highlight-color: transparent touch-action: manipulation
              ${isSidebarVisible ? 'bg-codestorm-blue text-white' : 'bg-gray-700 text-gray-300'}
            `}
            aria-label="Mostrar/ocultar sidebar"
            style={{ animationDelay: '50ms' }}
          >
            <Sidebar className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </button>

          {/* Botón para mostrar/ocultar explorador de archivos */}
          <button
            onClick={toggleFileExplorer}
            className={`
              mobile-floating-button
              ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}
              rounded-full shadow-lg flex items-center justify-center
              transform hover:scale-105 active:scale-95 transition-all duration-200
              -webkit-tap-highlight-color: transparent touch-action: manipulation
              ${isFileExplorerVisible ? 'bg-codestorm-blue text-white' : 'bg-gray-700 text-gray-300'}
            `}
            aria-label="Mostrar/ocultar explorador de archivos"
            style={{ animationDelay: '100ms' }}
          >
            <FolderTree className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </button>

          {/* Botón para mostrar/ocultar terminal */}
          <button
            onClick={toggleTerminal}
            className={`
              mobile-floating-button
              ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}
              rounded-full shadow-lg flex items-center justify-center
              transform hover:scale-105 active:scale-95 transition-all duration-200
              -webkit-tap-highlight-color: transparent touch-action: manipulation
              ${isTerminalVisible ? 'bg-codestorm-blue text-white' : 'bg-gray-700 text-gray-300'}
            `}
            aria-label="Mostrar/ocultar terminal"
            style={{ animationDelay: '150ms' }}
          >
            <TerminalIcon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </button>

          {/* Botón para alternar chat/terminal */}
          <button
            onClick={onToggleChat}
            className={`
              mobile-floating-button
              ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}
              rounded-full shadow-lg flex items-center justify-center
              transform hover:scale-105 active:scale-95 transition-all duration-200
              -webkit-tap-highlight-color: transparent touch-action: manipulation
              ${showChat ? 'bg-codestorm-blue text-white' : 'bg-gray-700 text-gray-300'}
            `}
            aria-label="Alternar chat/terminal"
            style={{ animationDelay: '200ms' }}
          >
            <MessageSquare className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </button>

          {/* Botón para vista previa */}
          <button
            onClick={onTogglePreview}
            className={`
              mobile-floating-button
              ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}
              rounded-full bg-gray-700 shadow-lg flex items-center justify-center text-gray-300
              transform hover:scale-105 active:scale-95 transition-all duration-200 hover:bg-gray-600
              -webkit-tap-highlight-color: transparent touch-action: manipulation
            `}
            aria-label="Vista previa"
            style={{ animationDelay: '250ms' }}
          >
            <Eye className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </button>

          {/* Botón para modificador de código */}
          {onToggleCodeModifier && (
            <button
              onClick={onToggleCodeModifier}
              className={`
                mobile-floating-button
                ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}
                rounded-full shadow-lg flex items-center justify-center
                transform hover:scale-105 active:scale-95 transition-all duration-200
                -webkit-tap-highlight-color: transparent touch-action: manipulation
                ${showCodeModifier ? 'bg-codestorm-accent text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
              `}
              aria-label="Modificar código"
              style={{ animationDelay: '300ms' }}
            >
              <Edit className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
            </button>
          )}
        </div>
      )}

      {/* Botones de expansión para móvil optimizados */}
      {isMobile && expandedPanel && (
        <button
          onClick={() => setExpandedPanel(null)}
          className="
            fixed top-20 left-4 mobile-floating-button
            w-10 h-10 rounded-full bg-codestorm-blue/80 shadow-lg
            flex items-center justify-center z-50
            -webkit-tap-highlight-color: transparent touch-action: manipulation
            transition-all duration-200 hover:bg-codestorm-blue
          "
          aria-label="Contraer panel"
        >
          <ChevronUp className="h-4 w-4 text-white" />
        </button>
      )}
    </>
  );
};

export default FloatingActionButtons;
