import React, { useState, useEffect } from 'react';
import { useUI } from '../contexts/UIContext';
import { Bot } from 'lucide-react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
  showGlow?: boolean;
}

/**
 * Componente que muestra el logo de BOTIDINAMIX con animaciones
 */
const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showPulse = true,
  showGlow = true
}) => {
  const { isMobile } = useUI();
  const [isHovered, setIsHovered] = useState(false);
  const [randomDelay, setRandomDelay] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Efecto para generar un retraso aleatorio para las animaciones
  useEffect(() => {
    setRandomDelay(Math.random() * 2);
  }, []);

  // Determinar el tamaño del logo según la prop size
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return isMobile ? 'w-12 h-12' : 'w-16 h-16';
      case 'lg':
        return isMobile ? 'w-20 h-20' : 'w-24 h-24';
      case 'md':
      default:
        return isMobile ? 'w-16 h-16' : 'w-20 h-20';
    }
  };

  // Clases para las animaciones
  const getAnimationClasses = () => {
    const classes = [];

    if (showPulse) {
      classes.push('animate-pulse-slow');
    }

    if (showGlow && isHovered) {
      classes.push('filter drop-shadow-lg shadow-codestorm-accent');
    }

    return classes.join(' ');
  };

  // Ya no usamos animación de rotación
  const getHoverStyle = () => {
    return {
      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
    };
  };

  return (
    <div
      className={`fixed z-50 ${isMobile ? 'top-4 left-4' : 'top-6 left-6'} cursor-pointer transition-all duration-500 transform hover:scale-110 ${getAnimationClasses()}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animationDelay: `${randomDelay}s`,
      }}
    >
      <div
        className={`relative ${getSizeClasses()} rounded-full overflow-hidden bg-codestorm-darker border-2 border-codestorm-blue/30`}
        style={getHoverStyle()}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-codestorm-blue/20 to-codestorm-accent/20 z-0"></div>

        {!imageError ? (
          <img
            src="/botidinamix-logo.svg"
            alt="BOTIDINAMIX Logo"
            className="w-full h-full object-contain z-10 relative p-1"
            onError={(e) => {
              console.error('Error cargando logo BOTIDINAMIX');
              setImageError(true);
            }}
          />
        ) : (
          // Fallback: Ícono de robot con texto
          <div className="w-full h-full flex flex-col items-center justify-center z-10 relative p-1">
            <Bot className="w-1/2 h-1/2 text-codestorm-accent" />
            <span className="text-xs font-bold text-codestorm-accent mt-1">BOTIDINAMIX</span>
          </div>
        )}

        {showGlow && (
          <div className={`absolute inset-0 bg-codestorm-accent/10 z-20 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>
        )}

        {/* Efecto de destello en el borde */}
        <div
          className={`absolute inset-0 border-2 border-codestorm-accent/50 rounded-full z-30 transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          style={{
            boxShadow: isHovered ? '0 0 15px rgba(59, 130, 246, 0.5)' : 'none'
          }}
        ></div>
      </div>

      {/* Texto que aparece al hacer hover */}
      <div
        className={`absolute ${isMobile ? '-bottom-10 left-1/2 transform -translate-x-1/2' : '-right-32 top-1/2 transform -translate-y-1/2'} bg-codestorm-dark px-3 py-1 rounded-full text-xs text-codestorm-accent border border-codestorm-blue/30 whitespace-nowrap transition-all duration-300 ${
          isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        BOTIDINAMIX AI
      </div>
    </div>
  );
};

export default BrandLogo;
