import React, { useState, useEffect } from 'react';
import { Folder, FolderOpen, X } from 'lucide-react';

interface DirectoryExplorerButtonProps {
  onClick: () => void;
  isActive: boolean;
  filesCount: number;
  hasNewFiles?: boolean;
}

const DirectoryExplorerButton: React.FC<DirectoryExplorerButtonProps> = ({
  onClick,
  isActive,
  filesCount,
  hasNewFiles = false
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [prevFilesCount, setPrevFilesCount] = useState(filesCount);
  
  // Detectar cambios en el número de archivos
  useEffect(() => {
    if (filesCount !== prevFilesCount) {
      setIsAnimating(true);
      setShowBadge(true);
      
      // Detener la animación después de 2 segundos
      const animationTimer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
      
      // Ocultar el badge después de 5 segundos
      const badgeTimer = setTimeout(() => {
        setShowBadge(false);
      }, 5000);
      
      setPrevFilesCount(filesCount);
      
      return () => {
        clearTimeout(animationTimer);
        clearTimeout(badgeTimer);
      };
    }
  }, [filesCount, prevFilesCount]);
  
  return (
    <button
      onClick={onClick}
      className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all relative ${
        isActive 
          ? 'bg-codestorm-accent text-white' 
          : isAnimating 
            ? 'bg-green-600 text-white' 
            : 'bg-gray-700 text-gray-300'
      }`}
      aria-label="Explorador de directorios"
    >
      {isActive ? (
        <FolderOpen className="h-6 w-6" />
      ) : (
        <Folder className={`h-6 w-6 ${isAnimating ? 'animate-pulse' : ''}`} />
      )}
      
      {/* Indicador de número de archivos */}
      {filesCount > 0 && (
        <div 
          className={`absolute -top-1 -right-1 bg-codestorm-darker text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border border-codestorm-blue/30 ${
            showBadge ? 'animate-bounce' : ''
          }`}
        >
          {filesCount > 99 ? '99+' : filesCount}
        </div>
      )}
      
      {/* Indicador de archivos nuevos */}
      {hasNewFiles && (
        <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border border-white"></div>
      )}
    </button>
  );
};

export default DirectoryExplorerButton;
