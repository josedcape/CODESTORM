import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  RefreshCw, 
  ExternalLink, 
  Maximize2, 
  Minimize2, 
  Monitor, 
  Tablet, 
  Smartphone,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { FileItem } from '../../types';

interface WebPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileItem[];
  projectName?: string;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const WebPreviewModal: React.FC<WebPreviewModalProps> = ({
  isOpen,
  onClose,
  files,
  projectName = 'Proyecto Web'
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Detectar archivos web en el proyecto
  const hasWebFiles = useCallback(() => {
    return files.some(file => 
      file.path.endsWith('.html') || 
      file.path.endsWith('.htm') ||
      file.path.endsWith('.css') ||
      file.path.endsWith('.js')
    );
  }, [files]);

  // Encontrar archivo HTML principal
  const findMainHtmlFile = useCallback(() => {
    // Buscar index.html primero
    let mainFile = files.find(file => 
      file.path.toLowerCase().includes('index.html')
    );
    
    // Si no hay index.html, buscar cualquier archivo HTML
    if (!mainFile) {
      mainFile = files.find(file => 
        file.path.endsWith('.html') || file.path.endsWith('.htm')
      );
    }
    
    return mainFile;
  }, [files]);

  // Generar HTML completo con CSS y JS integrados
  const generateCompleteHtml = useCallback(() => {
    const mainHtmlFile = findMainHtmlFile();
    if (!mainHtmlFile) {
      throw new Error('No se encontró archivo HTML principal');
    }

    let htmlContent = mainHtmlFile.content;
    
    // Recopilar todos los archivos CSS
    const cssFiles = files.filter(file => file.path.endsWith('.css'));
    const cssContent = cssFiles.map(file => file.content).join('\n');
    
    // Recopilar todos los archivos JS
    const jsFiles = files.filter(file => file.path.endsWith('.js'));
    const jsContent = jsFiles.map(file => file.content).join('\n');

    // Inyectar CSS en el head
    if (cssContent) {
      const cssTag = `<style type="text/css">\n${cssContent}\n</style>`;
      
      if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `${cssTag}\n</head>`);
      } else {
        htmlContent = `<head>\n${cssTag}\n</head>\n${htmlContent}`;
      }
    }

    // Inyectar JS antes del cierre del body
    if (jsContent) {
      const jsTag = `<script type="text/javascript">\n${jsContent}\n</script>`;
      
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', `${jsTag}\n</body>`);
      } else {
        htmlContent = `${htmlContent}\n${jsTag}`;
      }
    }

    // Asegurar que tenga estructura HTML básica
    if (!htmlContent.includes('<html')) {
      htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
</head>
<body>
${htmlContent}
</body>
</html>`;
    }

    return htmlContent;
  }, [files, findMainHtmlFile, projectName]);

  // Crear URL de vista previa
  const createPreviewUrl = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);

      if (!hasWebFiles()) {
        throw new Error('No se encontraron archivos web en el proyecto');
      }

      const completeHtml = generateCompleteHtml();
      const blob = new Blob([completeHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      setPreviewUrl(url);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar vista previa');
      setIsLoading(false);
    }
  }, [hasWebFiles, generateCompleteHtml]);

  // Actualizar vista previa cuando cambien los archivos
  useEffect(() => {
    if (isOpen && hasWebFiles()) {
      createPreviewUrl();
    }

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, files, createPreviewUrl, hasWebFiles]);

  // Manejar refresh
  const handleRefresh = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setRefreshKey(prev => prev + 1);
    createPreviewUrl();
  };

  // Abrir en nueva pestaña
  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  // Obtener dimensiones del viewport
  const getViewportDimensions = () => {
    switch (viewportSize) {
      case 'mobile':
        return { width: '375px', height: '667px' };
      case 'tablet':
        return { width: '768px', height: '1024px' };
      default:
        return { width: '100%', height: '100%' };
    }
  };

  // Manejar tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    console.log('🔒 Modal cerrado, no renderizando');
    return null;
  }

  console.log('🎭 Renderizando WebPreviewModal', { isOpen, filesCount: files.length, projectName });

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-2 sm:p-4"
      style={{ zIndex: 9999 }}
    >
      <div className={`bg-codestorm-dark rounded-lg shadow-xl border border-codestorm-blue/30 ${
        isFullscreen 
          ? 'w-full h-full' 
          : 'w-full max-w-[95vw] xl:max-w-6xl h-[95vh] max-h-[800px]'
      } flex flex-col overflow-hidden`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-codestorm-blue/30 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <Monitor className="w-5 h-5 sm:w-6 sm:h-6 text-codestorm-accent flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-white truncate">
                Vista Previa Web
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 truncate">{projectName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Controles de viewport */}
            <div className="hidden sm:flex items-center space-x-1 bg-codestorm-darker rounded-md p-1">
              <button
                onClick={() => setViewportSize('desktop')}
                className={`p-1.5 rounded transition-colors ${
                  viewportSize === 'desktop' 
                    ? 'bg-codestorm-accent text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Vista escritorio"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewportSize('tablet')}
                className={`p-1.5 rounded transition-colors ${
                  viewportSize === 'tablet' 
                    ? 'bg-codestorm-accent text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Vista tablet"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewportSize('mobile')}
                className={`p-1.5 rounded transition-colors ${
                  viewportSize === 'mobile' 
                    ? 'bg-codestorm-accent text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Vista móvil"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* Botones de acción */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded transition-colors disabled:opacity-50"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={handleOpenInNewTab}
              disabled={!previewUrl}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded transition-colors disabled:opacity-50"
              title="Abrir en nueva pestaña"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded transition-colors"
              title={isFullscreen ? 'Ventana' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-100 flex items-center justify-center">
          {error ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Error en la vista previa</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-codestorm-accent text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center p-8">
              <Loader2 className="w-8 h-8 text-codestorm-accent animate-spin mb-4" />
              <p className="text-gray-600">Cargando vista previa...</p>
            </div>
          ) : previewUrl ? (
            <div 
              className={`bg-white shadow-lg transition-all duration-300 ${
                viewportSize === 'desktop' ? 'w-full h-full' : 'rounded-lg overflow-hidden'
              }`}
              style={viewportSize !== 'desktop' ? getViewportDimensions() : {}}
            >
              <iframe
                ref={iframeRef}
                key={`preview-${refreshKey}`}
                src={previewUrl}
                className="w-full h-full border-0"
                title="Vista previa web"
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-presentation"
                onLoad={() => setIsLoading(false)}
              />
              
              {/* Indicador de tamaño */}
              {viewportSize !== 'desktop' && (
                <div className="absolute bottom-2 right-2 bg-codestorm-dark text-white text-xs px-2 py-1 rounded-md opacity-70">
                  {getViewportDimensions().width} × {getViewportDimensions().height}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Monitor className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No hay archivos web</h3>
              <p className="text-gray-600">Este proyecto no contiene archivos HTML, CSS o JavaScript para mostrar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebPreviewModal;
