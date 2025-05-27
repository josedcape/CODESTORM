import React, { useState, useRef } from 'react';
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
  Edit,
  Home,
  HelpCircle
} from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { useNavigate } from 'react-router-dom';

interface FloatingActionButtonsProps {
  onToggleChat: () => void;
  onTogglePreview: () => void;
  onToggleCodeModifier?: () => void;
  onToggleHelpAssistant?: () => void;
  showChat: boolean;
  showCodeModifier?: boolean;
  showHelpAssistant?: boolean;
}

const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  onToggleChat,
  onTogglePreview,
  onToggleCodeModifier,
  onToggleHelpAssistant,
  showChat,
  showCodeModifier = false,
  showHelpAssistant = false
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const laserContainerRef = useRef<HTMLDivElement>(null);
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

  // Función para navegar al menú principal
  const handleGoToMainMenu = () => {
    navigate('/menu');
    setIsMenuOpen(false);
  };

  // Función para crear el efecto láser
  const createLaserEffect = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Crear el elemento del efecto láser
    const laser = document.createElement('div');
    laser.className = 'laser-effect';
    laser.style.cssText = `
      position: fixed;
      left: ${centerX}px;
      top: ${centerY}px;
      width: 4px;
      height: 4px;
      background: radial-gradient(circle, #3b82f6 0%, #1d4ed8 50%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      animation: laserExpand 400ms ease-out forwards;
      box-shadow:
        0 0 10px #3b82f6,
        0 0 20px #3b82f6,
        0 0 30px #3b82f6;
    `;

    // Agregar los keyframes si no existen
    if (!document.querySelector('#laser-keyframes')) {
      const style = document.createElement('style');
      style.id = 'laser-keyframes';
      style.textContent = `
        @keyframes laserExpand {
          0% {
            width: 4px;
            height: 4px;
            opacity: 1;
            box-shadow:
              0 0 10px #3b82f6,
              0 0 20px #3b82f6,
              0 0 30px #3b82f6;
          }
          50% {
            width: 60px;
            height: 60px;
            opacity: 0.8;
            box-shadow:
              0 0 20px #3b82f6,
              0 0 40px #3b82f6,
              0 0 60px #3b82f6,
              0 0 80px #1d4ed8;
          }
          100% {
            width: 120px;
            height: 120px;
            opacity: 0;
            box-shadow:
              0 0 30px #3b82f6,
              0 0 60px #3b82f6,
              0 0 90px #3b82f6,
              0 0 120px #1d4ed8;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Agregar el efecto al DOM
    document.body.appendChild(laser);

    // Remover el efecto después de la animación
    setTimeout(() => {
      if (laser.parentNode) {
        laser.parentNode.removeChild(laser);
      }
    }, 400);
  };

  // Función wrapper para manejar clicks con efecto láser
  const handleButtonClick = (originalHandler: () => void) => {
    return (event: React.MouseEvent<HTMLButtonElement>) => {
      createLaserEffect(event);
      originalHandler();
    };
  };

  return (
    <>
      {/* Botón principal flotante optimizado para móvil */}
      <button
        onClick={handleButtonClick(toggleMenu)}
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
          {/* Botón para ir al menú principal */}
          <button
            onClick={handleButtonClick(handleGoToMainMenu)}
            className={`
              mobile-floating-button
              ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}
              rounded-full shadow-lg flex items-center justify-center
              transform hover:scale-105 active:scale-95 transition-all duration-200
              -webkit-tap-highlight-color: transparent touch-action: manipulation
              bg-codestorm-accent text-white hover:bg-blue-600
            `}
            aria-label="Ir al menú principal"
            style={{ animationDelay: '0ms' }}
          >
            <Home className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </button>

          {/* Botón para mostrar/ocultar sidebar */}
          <button
            onClick={handleButtonClick(toggleSidebar)}
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
            onClick={handleButtonClick(toggleFileExplorer)}
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
            onClick={handleButtonClick(toggleTerminal)}
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
            onClick={handleButtonClick(onToggleChat)}
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
            onClick={handleButtonClick(onTogglePreview)}
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
              onClick={handleButtonClick(onToggleCodeModifier)}
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

          {/* Botón para asistente de ayuda */}
          {onToggleHelpAssistant && (
            <button
              onClick={handleButtonClick(onToggleHelpAssistant)}
              className={`
                mobile-floating-button
                ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}
                rounded-full shadow-lg flex items-center justify-center
                transform hover:scale-105 active:scale-95 transition-all duration-200
                -webkit-tap-highlight-color: transparent touch-action: manipulation
                ${showHelpAssistant ? 'bg-codestorm-gold text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
              `}
              aria-label="Asistente de ayuda"
              style={{ animationDelay: '350ms' }}
            >
              <HelpCircle className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
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
