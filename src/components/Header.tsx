import React, { useState } from 'react';
import { Terminal, Code, Settings, Eye, MessageSquare, Hammer, ArrowLeft, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useUI } from '../contexts/UIContext';

interface HeaderProps {
  onPreviewClick: () => void;
  onChatClick: () => void;
  showConstructorButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onPreviewClick, onChatClick, showConstructorButton = true }) => {
  const location = useLocation();
  const isConstructorPage = location.pathname === '/constructor';
  const { isMobile, isTablet } = useUI();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Función para alternar el menú móvil
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2 group">
          <Terminal className="h-8 w-8 text-codestorm-gold transition-transform duration-300 group-hover:scale-110 electric-pulse" />
          <div>
            <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold bg-gradient-to-r from-codestorm-gold to-codestorm-accent bg-clip-text text-transparent gold-flash`}>CODESTORM</h1>
            <p className="text-xs text-gray-200 transition-all duration-300 group-hover:text-white">
              {isConstructorPage ? 'Modo Constructor' : 'Agente Desarrollador Autónomo'}
            </p>
          </div>
        </div>

        {/* Menú para escritorio */}
        {!isMobile && (
          <div className="flex items-center space-x-2 md:space-x-4">
            {isConstructorPage ? (
              <Link
                to="/"
                className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 rounded-md px-3 py-1.5 transition-colors"
                title="Volver a la página principal"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver</span>
              </Link>
            ) : (
              <>
                <button
                  onClick={onPreviewClick}
                  className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 rounded-md px-3 py-1.5 transition-all duration-300 hover:shadow-md hover:shadow-white/10 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 electric-btn"
                  title="Previsualizar código"
                >
                  <Eye className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
                  <span className={isTablet ? 'hidden' : ''}>Vista Previa</span>
                </button>
                <button
                  onClick={onChatClick}
                  className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 rounded-md px-3 py-1.5 transition-all duration-300 hover:shadow-md hover:shadow-white/10 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 electric-btn"
                  title="Abrir chat"
                >
                  <MessageSquare className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
                  <span className={isTablet ? 'hidden' : ''}>Chat</span>
                </button>
                {showConstructorButton && (
                  <Link
                    to="/constructor"
                    className="flex items-center space-x-1 bg-codestorm-gold/20 hover:bg-codestorm-gold/30 rounded-md px-3 py-1.5 transition-all duration-300 text-codestorm-gold hover:shadow-md hover:shadow-codestorm-gold/20 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 gold-flash"
                    title="Ir al Constructor"
                  >
                    <Hammer className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
                    <span className={isTablet ? 'hidden' : ''}>Constructor</span>
                  </Link>
                )}
              </>
            )}
            <button className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 rounded-md px-3 py-1.5 transition-all duration-300 hover:shadow-md hover:shadow-white/10 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 electric-btn">
              <Code className="h-4 w-4 transition-transform duration-300 hover:scale-110" />
              <span className={isTablet ? 'hidden' : ''}>Proyectos</span>
            </button>
            <button className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 rounded-md px-3 py-1.5 transition-all duration-300 hover:shadow-md hover:shadow-white/10 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 electric-btn">
              <Settings className="h-4 w-4 transition-transform duration-300 hover:scale-110 hover:rotate-45" />
              <span className={isTablet ? 'hidden' : ''}>Ajustes</span>
            </button>
          </div>
        )}

        {/* Botón de menú para móvil */}
        {isMobile && (
          <button
            onClick={toggleMenu}
            className="p-2 rounded-md bg-white/10 hover:bg-white/20"
            aria-label="Menú"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        )}
      </div>

      {/* Menú móvil desplegable */}
      {isMobile && isMenuOpen && (
        <div className="mt-4 bg-codestorm-blue/20 rounded-md p-2 border border-codestorm-blue/30 animate-slideInDown panel-enter">
          <div className="flex flex-col space-y-2">
            {isConstructorPage ? (
              <Link
                to="/"
                className="flex items-center space-x-2 p-2 rounded-md bg-white/10 hover:bg-white/20"
                onClick={() => setIsMenuOpen(false)}
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Volver a la página principal</span>
              </Link>
            ) : (
              <>
                <button
                  onClick={() => {
                    onPreviewClick();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 p-2 rounded-md bg-white/10 hover:bg-white/20"
                >
                  <Eye className="h-5 w-5" />
                  <span>Vista Previa</span>
                </button>
                <button
                  onClick={() => {
                    onChatClick();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 p-2 rounded-md bg-white/10 hover:bg-white/20"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Chat</span>
                </button>
                {showConstructorButton && (
                  <Link
                    to="/constructor"
                    className="flex items-center space-x-2 p-2 rounded-md bg-codestorm-gold/20 hover:bg-codestorm-gold/30 text-codestorm-gold"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Hammer className="h-5 w-5" />
                    <span>Constructor</span>
                  </Link>
                )}
              </>
            )}
            <button className="flex items-center space-x-2 p-2 rounded-md bg-white/10 hover:bg-white/20">
              <Code className="h-5 w-5" />
              <span>Proyectos</span>
            </button>
            <button className="flex items-center space-x-2 p-2 rounded-md bg-white/10 hover:bg-white/20">
              <Settings className="h-5 w-5" />
              <span>Ajustes</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
