import React, { useState, useEffect, useCallback } from 'react';
import { Monitor, Globe } from 'lucide-react';
import { FileItem } from '../../types';
import WebPreviewModal from './WebPreviewModal';

interface UniversalWebPreviewButtonProps {
  files: FileItem[];
  projectName?: string;
  className?: string;
}

const UniversalWebPreviewButton: React.FC<UniversalWebPreviewButtonProps> = ({
  files,
  projectName,
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasWebFiles, setHasWebFiles] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Detectar archivos web en el proyecto
  const detectWebFiles = useCallback(() => {
    console.log('🔍 Detectando archivos web...', { filesCount: files.length, files: files.map(f => f.path) });

    const webExtensions = ['.html', '.htm', '.css', '.js'];
    const hasWeb = files.some(file =>
      webExtensions.some(ext => file.path.toLowerCase().endsWith(ext))
    );

    setHasWebFiles(hasWeb);

    // Mostrar el botón solo si hay archivos web y al menos un HTML
    const hasHtml = files.some(file =>
      file.path.toLowerCase().endsWith('.html') ||
      file.path.toLowerCase().endsWith('.htm')
    );

    console.log('🌐 Resultado detección:', { hasWeb, hasHtml, willShow: hasWeb && hasHtml });

    // TEMPORAL: Mostrar siempre para debugging
    setIsVisible(true);
    // setIsVisible(hasWeb && hasHtml);
  }, [files]);

  // Detectar cambios en archivos
  useEffect(() => {
    detectWebFiles();
  }, [detectWebFiles]);

  // Escuchar eventos de modificación de archivos
  useEffect(() => {
    const handleFileModified = (event: CustomEvent) => {
      const { file, isStaticFile } = event.detail;
      
      if (isStaticFile && (
        file.path.endsWith('.html') || 
        file.path.endsWith('.css') || 
        file.path.endsWith('.js')
      )) {
        // Re-detectar archivos web cuando se modifiquen
        setTimeout(() => {
          detectWebFiles();
        }, 100);
      }
    };

    window.addEventListener('codestorm-file-modified', handleFileModified as EventListener);
    
    return () => {
      window.removeEventListener('codestorm-file-modified', handleFileModified as EventListener);
    };
  }, [detectWebFiles]);

  const handleOpenModal = () => {
    console.log('🚀 Abriendo modal de vista previa web');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    console.log('❌ Cerrando modal de vista previa web');
    setIsModalOpen(false);
  };

  // No mostrar el botón si no hay archivos web relevantes
  if (!isVisible) {
    console.log('❌ Botón no visible, retornando null');
    return null;
  }

  console.log('✅ Botón visible, renderizando...');

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={handleOpenModal}
        className={`
          fixed z-50 bottom-32 right-6 w-16 h-16
          rounded-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-2xl
          flex items-center justify-center
          hover:from-purple-600 hover:to-blue-600 transition-all duration-200
          transform hover:scale-110 active:scale-95
          group border-4 border-white
          ${className}
        `}
        title="Vista previa web"
        aria-label="Abrir vista previa web"
        style={{ zIndex: 9999 }}
      >
        <div className="relative">
          <Globe className="h-8 w-8 text-white" />

          {/* Indicador de archivos web */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        </div>

        {/* Tooltip */}
        <div className="absolute right-full mr-3 px-3 py-2 bg-codestorm-dark text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          🌐 Vista previa web
          <div className="absolute top-1/2 left-full w-0 h-0 border-l-4 border-l-codestorm-dark border-y-4 border-y-transparent transform -translate-y-1/2" />
        </div>
      </button>

      {/* Modal de vista previa */}
      <WebPreviewModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        files={files}
        projectName={projectName}
      />
    </>
  );
};

export default UniversalWebPreviewButton;
