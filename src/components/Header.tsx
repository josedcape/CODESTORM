import React, { useState } from 'react';
import { Terminal, Code, Settings, Eye, MessageSquare, Hammer, ArrowLeft, Menu, X, AlertCircle, Globe, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useUI } from '../contexts/UIContext';
import SoundControlPanel from './SoundControlPanel';

interface HeaderProps {
  onPreviewClick: () => void;
  onChatClick: () => void;
  showConstructorButton?: boolean;
  children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ onPreviewClick, onChatClick, showConstructorButton = true, children }) => {
  const location = useLocation();
  const isConstructorPage = location.pathname === '/constructor';
  const isCodeCorrectorPage = location.pathname === '/codecorrector';
  const isWebAIPage = location.pathname === '/webai';
  const { isMobile, isTablet } = useUI();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Función para alternar el menú móvil
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className={`futuristic-nav ${isMobile ? 'p-3' : 'p-4'} relative z-10 mobile-safe-area`}>
      {/* Partículas de código en el fondo */}
      <div className="absolute inset-0 code-rain opacity-10 z-0"></div>

      <div className="container mx-auto flex justify-between items-center relative z-10">
        <div className="flex items-center space-x-3 group">
          <div className="relative">
            <Terminal className="h-8 w-8 text-blue-400 transition-transform duration-300 group-hover:scale-110 electric-pulse" />
            <div className="absolute inset-0 bg-blue-500 rounded-full filter blur-md opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
          </div>

          <div>
            <h1
              data-text="CODESTORM ASSISTANT"
              className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold futuristic-title tracking-wider`}
            >
              CODESTORM ASSISTANT
            </h1>
            <p className="text-xs text-blue-300 transition-all duration-300 group-hover:text-blue-200">
              {isConstructorPage ? 'Modo Constructor' :
               isCodeCorrectorPage ? 'Corrector de Código' :
               isWebAIPage ? 'Web AI' :
               'Agente Desarrollador Autónomo'}
            </p>
          </div>
        </div>

        {/* Menú para escritorio */}
        {!isMobile && (
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Componentes hijos (botones adicionales) */}
            {children}

            {isConstructorPage || isCodeCorrectorPage || isWebAIPage ? (
              <Link
                to="/menu"
                className="flex items-center space-x-1 bg-blue-900/30 hover:bg-blue-800/40 border border-blue-500/30 rounded-md px-3 py-1.5 transition-all duration-300 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transform hover:-translate-y-0.5 active:translate-y-0"
                title="Ir al menú principal"
              >
                <Home className="h-4 w-4 text-blue-400" />
                <span className="text-blue-300">Menú</span>
              </Link>
            ) : (
              <>
                <button
                  onClick={onPreviewClick}
                  className="flex items-center space-x-1 bg-blue-900/30 hover:bg-blue-800/40 border border-blue-500/30 rounded-md px-3 py-1.5 transition-all duration-300 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transform hover:-translate-y-0.5 active:translate-y-0 electric-btn"
                  title="Previsualizar código"
                >
                  <Eye className="h-4 w-4 text-blue-400 transition-transform duration-300 hover:scale-110" />
                  <span className={`${isTablet ? 'hidden' : ''} text-blue-300`}>Vista Previa</span>
                </button>
                <button
                  onClick={onChatClick}
                  className="flex items-center space-x-1 bg-blue-900/30 hover:bg-blue-800/40 border border-blue-500/30 rounded-md px-3 py-1.5 transition-all duration-300 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transform hover:-translate-y-0.5 active:translate-y-0 electric-btn"
                  title="Abrir chat"
                >
                  <MessageSquare className="h-4 w-4 text-blue-400 transition-transform duration-300 hover:scale-110" />
                  <span className={`${isTablet ? 'hidden' : ''} text-blue-300`}>Chat</span>
                </button>
                {showConstructorButton && (
                  <>
                    <Link
                      to="/constructor"
                      className="flex items-center space-x-1 bg-codestorm-gold/20 hover:bg-codestorm-gold/30 rounded-md px-3 py-1.5 transition-all duration-300 text-codestorm-gold hover:shadow-md hover:shadow-codestorm-gold/20 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 gold-flash"
                      title="Ir al Constructor"
                    >
                      <Hammer className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
                      <span className={isTablet ? 'hidden' : ''}>Constructor</span>
                    </Link>
                    <Link
                      to="/webai"
                      className="flex items-center space-x-1 bg-green-500/20 hover:bg-green-500/30 rounded-md px-3 py-1.5 transition-all duration-300 text-green-400 hover:shadow-md hover:shadow-green-500/20 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                      title="Ir a Web AI"
                    >
                      <Globe className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
                      <span className={isTablet ? 'hidden' : ''}>Web AI</span>
                    </Link>
                    <Link
                      to="/codecorrector"
                      className="flex items-center space-x-1 bg-blue-500/20 hover:bg-blue-500/30 rounded-md px-3 py-1.5 transition-all duration-300 text-blue-400 hover:shadow-md hover:shadow-blue-500/20 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 electric-pulse"
                      title="Ir al Corrector de Código"
                    >
                      <AlertCircle className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
                      <span className={isTablet ? 'hidden' : ''}>Corrector</span>
                    </Link>
                  </>
                )}
              </>
            )}
            <button className="flex items-center space-x-1 bg-blue-900/30 hover:bg-blue-800/40 border border-blue-500/30 rounded-md px-3 py-1.5 transition-all duration-300 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transform hover:-translate-y-0.5 active:translate-y-0 electric-btn">
              <Code className="h-4 w-4 text-blue-400 transition-transform duration-300 hover:scale-110" />
              <span className={`${isTablet ? 'hidden' : ''} text-blue-300`}>Proyectos</span>
            </button>
            {/* Control de sonido */}
            <SoundControlPanel
              size="sm"
              showLabel={false}
              className="flex items-center"
            />

            <button className="flex items-center space-x-1 bg-blue-900/30 hover:bg-blue-800/40 border border-blue-500/30 rounded-md px-3 py-1.5 transition-all duration-300 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transform hover:-translate-y-0.5 active:translate-y-0 electric-btn">
              <Settings className="h-4 w-4 text-blue-400 transition-transform duration-300 hover:scale-110 hover:rotate-45" />
              <span className={`${isTablet ? 'hidden' : ''} text-blue-300`}>Ajustes</span>
            </button>
          </div>
        )}

        {/* Botón de menú para móvil optimizado */}
        {isMobile && (
          <button
            onClick={toggleMenu}
            className="
              mobile-floating-button p-2 rounded-md
              bg-blue-900/30 hover:bg-blue-800/40 border border-blue-500/30
              transition-all duration-200 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)]
              -webkit-tap-highlight-color: transparent
              touch-action: manipulation
              min-w-[44px] min-h-[44px]
              flex items-center justify-center
            "
            aria-label="Menú"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5 text-blue-400" />
            ) : (
              <Menu className="h-5 w-5 text-blue-400" />
            )}
          </button>
        )}
      </div>

      {/* Menú móvil desplegable optimizado */}
      {isMobile && isMenuOpen && (
        <div className="
          mt-4 bg-blue-900/40 backdrop-blur-sm rounded-md p-3
          border border-blue-500/30 animate-slideInDown panel-enter
          shadow-[0_0_15px_rgba(59,130,246,0.2)]
          mobile-safe-area
        ">
          <div className="flex flex-col space-y-2">
            {/* Renderizar children como botones en el menú móvil */}
            {children && React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child, {
                  className: `
                    flex items-center space-x-2 p-3 rounded-md
                    bg-codestorm-accent hover:bg-blue-600 text-white
                    transition-all duration-200 min-h-[44px]
                    -webkit-tap-highlight-color: transparent
                    touch-action: manipulation
                  `,
                  onClick: (e: React.MouseEvent) => {
                    if (child.props.onClick) {
                      child.props.onClick(e);
                    }
                    setIsMenuOpen(false);
                  }
                });
              }
              return child;
            })}

            {isConstructorPage || isCodeCorrectorPage || isWebAIPage ? (
              <Link
                to="/menu"
                className="flex items-center space-x-2 p-2 rounded-md bg-blue-900/30 hover:bg-blue-800/40 border border-blue-500/30 transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="h-5 w-5 text-blue-400" />
                <span className="text-blue-300">Ir al menú principal</span>
              </Link>
            ) : (
              <>
                <button
                  onClick={() => {
                    onPreviewClick();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 p-2 rounded-md bg-blue-900/30 hover:bg-blue-800/40 border border-blue-500/30 transition-all duration-300"
                >
                  <Eye className="h-5 w-5 text-blue-400" />
                  <span className="text-blue-300">Vista Previa</span>
                </button>
                <button
                  onClick={() => {
                    onChatClick();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 p-2 rounded-md bg-blue-900/30 hover:bg-blue-800/40 border border-blue-500/30 transition-all duration-300"
                >
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                  <span className="text-blue-300">Chat</span>
                </button>
                {showConstructorButton && (
                  <>
                    <Link
                      to="/constructor"
                      className="flex items-center space-x-2 p-2 rounded-md bg-codestorm-gold/20 hover:bg-codestorm-gold/30 text-codestorm-gold"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Hammer className="h-5 w-5" />
                      <span>Constructor</span>
                    </Link>
                    <Link
                      to="/codecorrector"
                      className="flex items-center space-x-2 p-2 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <AlertCircle className="h-5 w-5" />
                      <span>Corrector de Código</span>
                    </Link>
                    <Link
                      to="/webai"
                      className="flex items-center space-x-2 p-2 rounded-md bg-green-500/20 hover:bg-green-500/30 text-green-400"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Globe className="h-5 w-5" />
                      <span>Web AI</span>
                    </Link>
                  </>
                )}
              </>
            )}
            <button className="flex items-center space-x-2 p-2 rounded-md bg-blue-900/30 hover:bg-blue-800/40 border border-blue-500/30 transition-all duration-300">
              <Code className="h-5 w-5 text-blue-400" />
              <span className="text-blue-300">Proyectos</span>
            </button>
            {/* Control de sonido para móvil */}
            <div className="p-2 rounded-md bg-blue-900/30 border border-blue-500/30">
              <SoundControlPanel
                size="md"
                showLabel={true}
                className="w-full"
              />
            </div>

            <button className="flex items-center space-x-2 p-2 rounded-md bg-blue-900/30 hover:bg-blue-800/40 border border-blue-500/30 transition-all duration-300">
              <Settings className="h-5 w-5 text-blue-400" />
              <span className="text-blue-300">Ajustes</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
