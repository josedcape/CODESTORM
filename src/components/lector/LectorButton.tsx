import React from 'react';
import { Eye, AlertTriangle } from 'lucide-react';

interface LectorButtonProps {
  onClick: () => void;
  hasWarnings?: boolean;
  isActive?: boolean;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
}

const LectorButton: React.FC<LectorButtonProps> = ({
  onClick,
  hasWarnings = false,
  isActive = false,
  position = 'bottom-right',
  size = 'md'
}) => {
  // Determinar la posición
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-left': 'top-4 left-4'
  };
  
  // Determinar el tamaño
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14'
  };
  
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };
  
  return (
    <button
      onClick={onClick}
      className={`fixed ${positionClasses[position]} ${sizeClasses[size]} rounded-full shadow-lg flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all ${
        isActive 
          ? 'bg-blue-600 text-white' 
          : 'bg-codestorm-dark text-gray-300 border border-codestorm-blue/30'
      }`}
      title="Agente Lector"
    >
      <Eye className={iconSizes[size]} />
      
      {/* Indicador de advertencias */}
      {hasWarnings && (
        <div className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-codestorm-dark">
          <AlertTriangle className="h-3 w-3 text-white" />
        </div>
      )}
    </button>
  );
};

export default LectorButton;
