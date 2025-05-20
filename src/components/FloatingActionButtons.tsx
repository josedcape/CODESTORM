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
  ChevronUp
} from 'lucide-react';
import { useUI } from '../contexts/UIContext';

interface FloatingActionButtonsProps {
  onToggleChat: () => void;
  onTogglePreview: () => void;
  showChat: boolean;
}

const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  onToggleChat,
  onTogglePreview,
  showChat
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
      {/* Botón principal flotante */}
      <button
        onClick={toggleMenu}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-codestorm-accent shadow-lg flex items-center justify-center z-50 hover:bg-blue-600 transition-colors transform hover:scale-105 active:scale-95"
        aria-label="Menú de acciones"
      >
        {isMenuOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Menu className="h-6 w-6 text-white" />
        )}
      </button>

      {/* Menú de acciones */}
      {isMenuOpen && (
        <div className="fixed bottom-24 right-6 flex flex-col-reverse space-y-reverse space-y-3 z-50 animate-fadeIn">
          {/* Botón para mostrar/ocultar sidebar */}
          <button
            onClick={toggleSidebar}
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all ${
              isSidebarVisible ? 'bg-codestorm-blue text-white' : 'bg-gray-700 text-gray-300'
            }`}
            aria-label="Mostrar/ocultar sidebar"
            style={{ animationDelay: '50ms' }}
          >
            <Sidebar className="h-5 w-5" />
          </button>

          {/* Botón para mostrar/ocultar explorador de archivos */}
          <button
            onClick={toggleFileExplorer}
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all ${
              isFileExplorerVisible ? 'bg-codestorm-blue text-white' : 'bg-gray-700 text-gray-300'
            }`}
            aria-label="Mostrar/ocultar explorador de archivos"
            style={{ animationDelay: '100ms' }}
          >
            <FolderTree className="h-5 w-5" />
          </button>

          {/* Botón para mostrar/ocultar terminal */}
          <button
            onClick={toggleTerminal}
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all ${
              isTerminalVisible ? 'bg-codestorm-blue text-white' : 'bg-gray-700 text-gray-300'
            }`}
            aria-label="Mostrar/ocultar terminal"
            style={{ animationDelay: '150ms' }}
          >
            <TerminalIcon className="h-5 w-5" />
          </button>

          {/* Botón para alternar chat/terminal */}
          <button
            onClick={onToggleChat}
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all ${
              showChat ? 'bg-codestorm-blue text-white' : 'bg-gray-700 text-gray-300'
            }`}
            aria-label="Alternar chat/terminal"
            style={{ animationDelay: '200ms' }}
          >
            <MessageSquare className="h-5 w-5" />
          </button>

          {/* Botón para vista previa */}
          <button
            onClick={onTogglePreview}
            className="w-12 h-12 rounded-full bg-gray-700 shadow-lg flex items-center justify-center text-gray-300 transform hover:scale-105 active:scale-95 transition-all hover:bg-gray-600"
            aria-label="Vista previa"
            style={{ animationDelay: '250ms' }}
          >
            <Eye className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Botones de expansión para móvil */}
      {isMobile && expandedPanel && (
        <button
          onClick={() => setExpandedPanel(null)}
          className="fixed top-20 right-4 w-10 h-10 rounded-full bg-codestorm-blue/80 shadow-lg flex items-center justify-center z-50"
          aria-label="Contraer panel"
        >
          <ChevronUp className="h-5 w-5 text-white" />
        </button>
      )}
    </>
  );
};

export default FloatingActionButtons;
