import React from 'react';
import { Heart, Code, Zap, RefreshCw } from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import useIntroAnimation from '../hooks/useIntroAnimation';

interface FooterProps {
  showLogo?: boolean;
}

/**
 * Componente de pie de página para la aplicación
 */
const Footer: React.FC<FooterProps> = ({ showLogo = true }) => {
  const { isMobile } = useUI();
  const currentYear = new Date().getFullYear();
  const { resetIntro } = useIntroAnimation();

  return (
    <footer className="bg-gradient-to-r from-codestorm-blue/20 to-codestorm-accent/20 border-t border-codestorm-blue/30 py-3 px-4 mt-auto">
      <div className="container mx-auto">
        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-row justify-between'} items-center`}>
          {/* Información de copyright */}
          <div className="flex items-center space-x-1 text-gray-300 text-sm">
            <span className="text-codestorm-gold">BOTIDINAMIX AI</span>
            <span>-</span>
            <span>Todos los derechos reservados © {currentYear}</span>
          </div>

          {/* Separador en móvil */}
          {isMobile && (
            <div className="w-full h-px bg-gradient-to-r from-transparent via-codestorm-blue/30 to-transparent"></div>
          )}

          {/* Enlaces y créditos */}
          <div className="flex items-center space-x-4">
            {showLogo && (
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                <span>Powered by</span>
                <div className="flex items-center space-x-1 text-codestorm-accent">
                  <Code className="h-3 w-3" />
                  <span className="font-semibold">CODESTORM</span>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <span>Creado con</span>
              <Heart className="h-3 w-3 text-red-500" />
              <span>y</span>
              <Zap className="h-3 w-3 text-codestorm-gold" />
            </div>

            {/* Botón para resetear la animación de introducción (solo para desarrollo) */}
            <button
              onClick={resetIntro}
              className="flex items-center space-x-1 text-xs text-gray-400 hover:text-codestorm-accent transition-colors"
              title="Resetear animación de introducción"
            >
              <RefreshCw className="h-3 w-3" />
              <span className="hidden md:inline">Resetear intro</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
