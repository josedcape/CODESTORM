import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Globe,
  Maximize2,
  Minimize2,
  Monitor,
  Tablet,
  Smartphone,
  FileText,
  ChevronDown,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';
import { FileItem } from '../../types';

interface EnhancedPreviewPanelProps {
  files: FileItem[];
  onRefresh: () => void;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';
type PreviewStatus = 'loading' | 'success' | 'error' | 'empty';

const EnhancedPreviewPanel: React.FC<EnhancedPreviewPanelProps> = ({
  files,
  onRefresh,
  onError,
  onSuccess
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [selectedHtmlFile, setSelectedHtmlFile] = useState<string>('index.html');
  const [previewContent, setPreviewContent] = useState<string>('');
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>('empty');
  const [errors, setErrors] = useState<string[]>([]);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Obtener archivos HTML disponibles
  const htmlFiles = files.filter(file =>
    file.path.toLowerCase().endsWith('.html') && file.content
  );

  // Obtener archivos CSS disponibles
  const cssFiles = files.filter(file =>
    file.path.toLowerCase().endsWith('.css') && file.content
  );

  // Obtener archivos JS disponibles
  const jsFiles = files.filter(file =>
    file.path.toLowerCase().endsWith('.js') && file.content
  );

  // Dimensiones según el tipo de dispositivo
  const getDeviceDimensions = () => {
    switch (deviceType) {
      case 'mobile':
        return { width: '375px', height: '667px' };
      case 'tablet':
        return { width: '768px', height: '1024px' };
      default:
        return { width: '100%', height: '100%' };
    }
  };

  // Generar contenido HTML completo con CSS y JS integrados
  const generatePreviewContent = useCallback(() => {
    setPreviewStatus('loading');
    setErrors([]);

    try {
      // Buscar el archivo HTML seleccionado
      let htmlFile = htmlFiles.find(file =>
        file.path.toLowerCase().includes(selectedHtmlFile.toLowerCase())
      );

      // Si no se encuentra, usar el primer archivo HTML disponible
      if (!htmlFile && htmlFiles.length > 0) {
        htmlFile = htmlFiles[0];
        setSelectedHtmlFile(htmlFile.path);
      }

      if (!htmlFile) {
        // Generar HTML por defecto si no existe
        const defaultHtml = generateDefaultHTML();
        setPreviewContent(defaultHtml);
        setPreviewStatus('success');
        onSuccess?.('Vista previa generada con contenido por defecto');
        return;
      }

      let htmlContent = htmlFile.content;

      // Inyectar CSS en el HTML
      if (cssFiles.length > 0) {
        const cssContent = cssFiles.map(file => file.content).join('\n\n');
        const styleTag = `<style>\n${cssContent}\n</style>`;

        // Insertar antes del cierre de </head> o al inicio del <body>
        if (htmlContent.includes('</head>')) {
          htmlContent = htmlContent.replace('</head>', `${styleTag}\n</head>`);
        } else if (htmlContent.includes('<body>')) {
          htmlContent = htmlContent.replace('<body>', `<body>\n${styleTag}`);
        } else {
          htmlContent = `${styleTag}\n${htmlContent}`;
        }
      }

      // Inyectar JavaScript en el HTML
      if (jsFiles.length > 0) {
        const jsContent = jsFiles.map(file => file.content).join('\n\n');
        const scriptTag = `<script>\n${jsContent}\n</script>`;

        // Insertar antes del cierre de </body> o al final
        if (htmlContent.includes('</body>')) {
          htmlContent = htmlContent.replace('</body>', `${scriptTag}\n</body>`);
        } else {
          htmlContent = `${htmlContent}\n${scriptTag}`;
        }
      }

      // Validar HTML básico
      const validationErrors = validateHTML(htmlContent);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        onError?.(`Errores de validación: ${validationErrors.join(', ')}`);
      }

      setPreviewContent(htmlContent);
      setPreviewStatus('success');
      onSuccess?.(`Vista previa actualizada: ${htmlFile.path}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setErrors([errorMessage]);
      setPreviewStatus('error');
      onError?.(errorMessage);
    }
  }, [htmlFiles, cssFiles, jsFiles, selectedHtmlFile, onError, onSuccess]);

  // Generar HTML por defecto
  const generateDefaultHTML = () => {
    const cssContent = cssFiles.length > 0 ? cssFiles.map(f => f.content).join('\n') : `
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 40px;
  border-radius: 15px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

h1 {
  font-size: 2.5em;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

p {
  font-size: 1.2em;
  opacity: 0.9;
}
`;

    const jsContent = jsFiles.length > 0 ? jsFiles.map(f => f.content).join('\n') : `
console.log('¡Bienvenido a CODESTORM!');
document.addEventListener('DOMContentLoaded', function() {
  console.log('Página cargada correctamente');
});
`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CODESTORM - Vista Previa</title>
    <style>
${cssContent}
    </style>
</head>
<body>
    <div class="container">
        <h1>🌩️ CODESTORM</h1>
        <p>Tu proyecto está listo para ser desarrollado</p>
        <p>Esta es una vista previa generada automáticamente</p>
    </div>
    <script>
${jsContent}
    </script>
</body>
</html>`;
  };

  // Validación básica de HTML
  const validateHTML = (html: string): string[] => {
    const errors: string[] = [];

    if (!html.includes('<!DOCTYPE')) {
      errors.push('Falta declaración DOCTYPE');
    }

    if (!html.includes('<html')) {
      errors.push('Falta etiqueta <html>');
    }

    if (!html.includes('<head>') && !html.includes('<head ')) {
      errors.push('Falta etiqueta <head>');
    }

    if (!html.includes('<body>') && !html.includes('<body ')) {
      errors.push('Falta etiqueta <body>');
    }

    return errors;
  };

  // Efecto para regenerar la vista previa cuando cambien los archivos
  useEffect(() => {
    if (files.length > 0) {
      generatePreviewContent();
    } else {
      setPreviewStatus('empty');
      setPreviewContent('');
    }
  }, [files, selectedHtmlFile, generatePreviewContent]);

  // Función para abrir en nueva pestaña
  const handleOpenInNewTab = () => {
    if (previewContent) {
      const blob = new Blob([previewContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  // Función para alternar pantalla completa
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const dimensions = getDeviceDimensions();

  return (
    <div className={`flex flex-col h-full border rounded-lg shadow-md bg-codestorm-dark border-codestorm-blue/30 ${
      isFullscreen ? 'fixed inset-0 z-50' : ''
    }`}>
      {/* Header con controles */}
      <div className="flex items-center justify-between p-3 border-b border-codestorm-blue/30">
        <div className="flex items-center space-x-3">
          <h2 className="text-sm font-medium text-white">Vista Previa</h2>

          {/* Selector de archivo HTML */}
          {htmlFiles.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowFileSelector(!showFileSelector)}
                className="flex items-center px-2 py-1 text-xs bg-codestorm-blue/20 text-white rounded hover:bg-codestorm-blue/30"
              >
                <FileText className="w-3 h-3 mr-1" />
                {selectedHtmlFile}
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>

              {showFileSelector && (
                <div className="absolute top-full left-0 mt-1 bg-codestorm-dark border border-codestorm-blue/30 rounded shadow-lg z-10">
                  {htmlFiles.map(file => (
                    <button
                      key={file.id}
                      onClick={() => {
                        setSelectedHtmlFile(file.path);
                        setShowFileSelector(false);
                      }}
                      className="block w-full px-3 py-2 text-xs text-left text-white hover:bg-codestorm-blue/20"
                    >
                      {file.path}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Indicador de estado */}
          <div className="flex items-center">
            {previewStatus === 'loading' && (
              <Loader className="w-4 h-4 text-blue-400 animate-spin" />
            )}
            {previewStatus === 'success' && (
              <CheckCircle className="w-4 h-4 text-green-400" />
            )}
            {previewStatus === 'error' && (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Selector de dispositivo */}
          <div className="flex border border-codestorm-blue/30 rounded">
            <button
              onClick={() => setDeviceType('desktop')}
              className={`p-1.5 ${deviceType === 'desktop' ? 'bg-codestorm-blue text-white' : 'text-gray-400 hover:text-white'}`}
              title="Vista de escritorio"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceType('tablet')}
              className={`p-1.5 ${deviceType === 'tablet' ? 'bg-codestorm-blue text-white' : 'text-gray-400 hover:text-white'}`}
              title="Vista de tablet"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceType('mobile')}
              className={`p-1.5 ${deviceType === 'mobile' ? 'bg-codestorm-blue text-white' : 'text-gray-400 hover:text-white'}`}
              title="Vista móvil"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* Controles de acción */}
          <button
            onClick={generatePreviewContent}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title="Refrescar vista previa"
            disabled={previewStatus === 'loading'}
          >
            <RefreshCw className={`w-4 h-4 ${previewStatus === 'loading' ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenInNewTab}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title="Abrir en nueva pestaña"
            disabled={!previewContent}
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Área de errores */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-900/20 border-b border-red-500/30">
          <div className="flex items-start">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-300 font-medium">Errores de validación:</p>
              <ul className="text-xs text-red-400 mt-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Área de vista previa */}
      <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
        {previewStatus === 'empty' ? (
          <div className="flex flex-col items-center justify-center h-full bg-codestorm-darker rounded-lg p-8">
            <Globe className="w-12 h-12 mb-4 text-gray-500" />
            <p className="text-gray-400 text-center mb-2">
              No hay contenido para previsualizar
            </p>
            <p className="text-xs text-gray-500 text-center">
              Los archivos HTML se generarán automáticamente con tu proyecto
            </p>
          </div>
        ) : previewStatus === 'loading' ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader className="w-8 h-8 text-blue-400 animate-spin mb-4" />
            <p className="text-gray-400">Generando vista previa...</p>
          </div>
        ) : previewContent ? (
          <div
            className="bg-white rounded-lg shadow-lg overflow-hidden"
            style={{
              width: dimensions.width,
              height: dimensions.height,
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={previewContent}
              className="w-full h-full border-none"
              title="Vista previa del proyecto"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <XCircle className="w-12 h-12 mb-4 text-red-400" />
            <p className="text-red-300 text-center">
              Error al generar la vista previa
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPreviewPanel;