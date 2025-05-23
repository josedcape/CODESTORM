import React, { useState, useEffect } from 'react';
import { Monitor, Tablet, Smartphone, RefreshCw, Code, Download, Copy, Check, X } from 'lucide-react';

interface WebPreviewProps {
  html: string;
  css?: string;
  js?: string;
  onClose: () => void;
  onRefresh?: () => void;
  onViewCode?: () => void;
}

const WebPreview: React.FC<WebPreviewProps> = ({
  html,
  css = '',
  js = '',
  onClose,
  onRefresh,
  onViewCode
}) => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Combinar HTML, CSS y JS en un solo documento
  const combinedCode = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${css}
      </style>
    </head>
    <body>
      ${html}
      <script>
        ${js}
      </script>
    </body>
    </html>
  `;
  
  // Función para copiar el código al portapapeles
  const copyToClipboard = () => {
    navigator.clipboard.writeText(combinedCode).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };
  
  // Función para descargar el código como archivo HTML
  const downloadAsHtml = () => {
    const blob = new Blob([combinedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mi-sitio-web.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Efecto para manejar el modo pantalla completa
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);
  
  // Determinar el ancho de la vista previa según el dispositivo seleccionado
  const getPreviewWidth = () => {
    switch (device) {
      case 'mobile':
        return 'w-[375px]';
      case 'tablet':
        return 'w-[768px]';
      case 'desktop':
      default:
        return 'w-full max-w-[1200px]';
    }
  };
  
  return (
    <div className={`
      bg-codestorm-darker text-white
      ${isFullscreen ? 'fixed inset-0 z-50' : 'rounded-lg shadow-lg'}
      flex flex-col overflow-hidden
    `}>
      {/* Barra de herramientas */}
      <div className="bg-codestorm-blue/20 p-3 border-b border-codestorm-blue/30 flex justify-between items-center">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded ${device === 'desktop' ? 'bg-codestorm-blue/30 text-white' : 'text-gray-400 hover:bg-codestorm-blue/20 hover:text-white'}`}
            title="Vista de escritorio"
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`p-1.5 rounded ${device === 'tablet' ? 'bg-codestorm-blue/30 text-white' : 'text-gray-400 hover:bg-codestorm-blue/20 hover:text-white'}`}
            title="Vista de tablet"
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded ${device === 'mobile' ? 'bg-codestorm-blue/30 text-white' : 'text-gray-400 hover:bg-codestorm-blue/20 hover:text-white'}`}
            title="Vista de móvil"
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>
        
        <h2 className="text-sm font-medium">Vista Previa</h2>
        
        <div className="flex items-center space-x-1">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
              title="Actualizar vista previa"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
          
          {onViewCode && (
            <button
              onClick={onViewCode}
              className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
              title="Ver código"
            >
              <Code className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={copyToClipboard}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title="Copiar código HTML"
          >
            {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </button>
          
          <button
            onClick={downloadAsHtml}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title="Descargar como HTML"
          >
            <Download className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isFullscreen ? (
                <>
                  <path d="M8 3v4a1 1 0 0 1-1 1H3" />
                  <path d="M21 8h-4a1 1 0 0 1-1-1V3" />
                  <path d="M3 16h4a1 1 0 0 1 1 1v4" />
                  <path d="M16 21v-4a1 1 0 0 1 1-1h4" />
                </>
              ) : (
                <>
                  <path d="M3 8V5a2 2 0 0 1 2-2h3" />
                  <path d="M16 3h3a2 2 0 0 1 2 2v3" />
                  <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
                  <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
                </>
              )}
            </svg>
          </button>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded text-gray-400 hover:bg-red-500/20 hover:text-red-400"
            title="Cerrar vista previa"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Contenido de la vista previa */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className={`mx-auto bg-white shadow-lg transition-all duration-300 ${getPreviewWidth()}`}>
          <iframe
            srcDoc={combinedCode}
            title="Vista previa del sitio web"
            className="w-full h-[600px] border-0"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </div>
      
      {/* Barra de estado */}
      <div className="bg-codestorm-blue/10 p-2 border-t border-codestorm-blue/30 flex justify-between items-center text-xs text-gray-400">
        <div>
          Dispositivo: {device === 'desktop' ? 'Escritorio' : device === 'tablet' ? 'Tablet' : 'Móvil'}
        </div>
        <div>
          Presiona ESC para salir del modo pantalla completa
        </div>
      </div>
    </div>
  );
};

export default WebPreview;
