import React from 'react';
import { Heart, Code, Zap } from 'lucide-react';
import { useUI } from '../contexts/UIContext';

interface FooterProps {
  showLogo?: boolean;
}

/**
 * Componente de pie de página para la aplicación
 */
const Footer: React.FC<FooterProps> = ({ showLogo = true }) => {
  const { isMobile } = useUI();
  const currentYear = new Date().getFullYear();
  
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
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
