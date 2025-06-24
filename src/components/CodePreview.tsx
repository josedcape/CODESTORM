import React, { useState, useEffect, useRef } from 'react';
import { FileItem } from '../types';
import { Eye, Code, RefreshCw, ExternalLink, X, Smartphone, Tablet, Monitor, Maximize, Minimize, RotateCw } from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { removeDuplicateFiles, generateFileKey, validateFileKeys, fixDuplicateIds } from '../utils/fileUtils';

interface CodePreviewProps {
  files: FileItem[];
  onClose: () => void;
}

const CodePreview: React.FC<CodePreviewProps> = ({ files, onClose }) => {
  const { isMobile, isTablet } = useUI();

  // Procesar archivos para eliminar duplicados y validar claves
  const processedFiles = React.useMemo(() => {
    // Primero eliminar duplicados basados en path
    let cleanFiles = removeDuplicateFiles(files);

    // Validar que no hay claves duplicadas
    const validation = validateFileKeys(cleanFiles);
    if (!validation.isValid) {
      console.warn('🚨 Claves duplicadas detectadas en CodePreview:', {
        duplicatePaths: validation.duplicates,
        duplicateIds: validation.duplicateIds
      });

      // Corregir IDs duplicados si los hay
      if (validation.duplicateIds.length > 0) {
        cleanFiles = fixDuplicateIds(cleanFiles);
        console.log('✅ IDs duplicados corregidos en CodePreview');
      }
    }

    return cleanFiles;
  }, [files]);

  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewportSize, setViewportSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastModified, setLastModified] = useState<number>(Date.now());
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Filtrar archivos por tipo usando archivos procesados
  const htmlFiles = processedFiles.filter(file => file.path.endsWith('.html'));
  const cssFiles = processedFiles.filter(file => file.path.endsWith('.css'));
  const jsFiles = processedFiles.filter(file => file.path.endsWith('.js'));
  const otherFiles = processedFiles.filter(file =>
    !file.path.endsWith('.html') &&
    !file.path.endsWith('.css') &&
    !file.path.endsWith('.js')
  );

  // Establecer el primer archivo HTML como activo por defecto
  useEffect(() => {
    if (htmlFiles.length > 0 && !activeTab) {
      setActiveTab(htmlFiles[0].id);
    } else if (processedFiles.length > 0 && !activeTab) {
      setActiveTab(processedFiles[0].id);
    }
  }, [processedFiles, htmlFiles, activeTab]);

  // Generar una vista previa en tiempo real para proyectos web
  useEffect(() => {
    if (htmlFiles.length > 0) {
      generatePreview();
      setLastModified(Date.now());
    }
  }, [activeTab]);

  // Configurar el temporizador de actualización automática
  useEffect(() => {
    if (autoRefresh && htmlFiles.length > 0) {
      refreshTimerRef.current = setInterval(() => {
        generatePreview();
        setLastModified(Date.now());
      }, 3000); // Actualizar cada 3 segundos
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [autoRefresh, htmlFiles.length]);

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [previewUrl]);

  const generatePreview = () => {
    if (htmlFiles.length === 0) {
      setError('No hay archivos HTML para previsualizar');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Encontrar el archivo HTML activo o usar el primero
      const activeHtml = activeTab && processedFiles.find(f => f.id === activeTab && f.path.endsWith('.html'));
      const htmlFile = activeHtml || htmlFiles[0];

      // Obtener el contenido HTML
      let htmlContent = htmlFile.content;

      // Corregir rutas de imágenes
      htmlContent = fixImagePaths(htmlContent);

      // Inyectar CSS
      if (cssFiles.length > 0) {
        const styleTag = cssFiles.map(css =>
          `<style>${css.content}</style>`
        ).join('\n');

        // Insertar estilos antes de </head>
        htmlContent = htmlContent.replace('</head>', `${styleTag}</head>`);
      }

      // Inyectar JavaScript con manejo de errores
      if (jsFiles.length > 0) {
        const scriptTag = jsFiles.map(js =>
          `<script>
            try {
              ${js.content}
            } catch (error) {
              console.error('Error en script:', error);
            }
          </script>`
        ).join('\n');

        // Insertar scripts antes de </body>
        htmlContent = htmlContent.replace('</body>', `${scriptTag}</body>`);
      }

      // Añadir manejo de errores para imágenes
      htmlContent = htmlContent.replace(/<img([^>]*)src=["']([^"']+)["']([^>]*)>/gi,
        '<img$1src="$2"$3 onerror="this.onerror=null; this.src=\'data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'100\\\' height=\\\'100\\\' viewBox=\\\'0 0 100 100\\\'><rect fill=\\\'%23f0f0f0\\\' width=\\\'100\\\' height=\\\'100\\\'/><path fill=\\\'%23cccccc\\\' d=\\\'M36.5,22.5h27v55h-27V22.5z\\\'/><text x=\\\'50\\\' y=\\\'50\\\' font-family=\\\'Arial\\\' font-size=\\\'8\\\' text-anchor=\\\'middle\\\' fill=\\\'%23999999\\\'>Imagen no disponible</text></svg>\\\'; this.style.padding=\'10px\'; this.style.boxSizing=\'border-box\';">');

      // Añadir meta viewport para dispositivos móviles
      const viewportMeta = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">';
      if (!htmlContent.includes('<meta name="viewport"')) {
        htmlContent = htmlContent.replace('<head>', `<head>\n  ${viewportMeta}`);
      }

      // Añadir manejo global de errores
      const errorHandling = `
        <script>
          window.addEventListener('error', function(e) {
            console.error('Error en la página:', e.message);
            const errorDiv = document.createElement('div');
            errorDiv.style.position = 'fixed';
            errorDiv.style.bottom = '10px';
            errorDiv.style.left = '10px';
            errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
            errorDiv.style.color = 'white';
            errorDiv.style.padding = '5px 10px';
            errorDiv.style.borderRadius = '3px';
            errorDiv.style.fontSize = '12px';
            errorDiv.style.zIndex = '9999';
            errorDiv.textContent = 'Error: ' + e.message;
            document.body.appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 5000);
            return false;
          });
        </script>
      `;

      // Añadir script para comunicación con el padre
      const communicationScript = `
        <script>
          // Notificar al padre cuando el DOM está listo
          window.addEventListener('DOMContentLoaded', function() {
            window.parent.postMessage({ type: 'DOM_READY' }, '*');
          });

          // Notificar al padre cuando todos los recursos están cargados
          window.addEventListener('load', function() {
            window.parent.postMessage({ type: 'RESOURCES_LOADED' }, '*');
          });

          // Notificar al padre sobre errores
          window.addEventListener('error', function(e) {
            window.parent.postMessage({
              type: 'ERROR',
              message: e.message,
              source: e.filename,
              line: e.lineno
            }, '*');
          });

          // Notificar al padre sobre clics en elementos
          document.addEventListener('click', function(e) {
            window.parent.postMessage({
              type: 'ELEMENT_CLICKED',
              tagName: e.target.tagName,
              id: e.target.id,
              className: e.target.className
            }, '*');
          });
        </script>
      `;

      // Insertar scripts antes de </body>
      htmlContent = htmlContent.replace('</body>', `${errorHandling}${communicationScript}</body>`);

      // Crear un blob y generar URL
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      // Limpiar URL anterior si existe
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(url);
    } catch (err) {
      setError('Error al generar la vista previa');
      console.error('Error al generar la vista previa:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para corregir rutas de imágenes
  const fixImagePaths = (htmlContent: string) => {
    // Reemplazar rutas relativas con un placeholder para imágenes
    return htmlContent.replace(
      /<img([^>]*)src=["'](?!data:|http|https|blob:)([^"']+)["']([^>]*)>/gi,
      (match, before, src, after) => {
        // Buscar si tenemos el archivo en nuestros archivos
        const imagePath = src.startsWith('/') ? src : `/${src}`;
        const imageFile = processedFiles.find(f => f.path === imagePath);

        if (imageFile && imageFile.content) {
          // Si es una imagen en base64, usarla directamente
          if (imageFile.content.startsWith('data:image')) {
            return `<img${before}src="${imageFile.content}"${after}>`;
          }
        }

        // Si no encontramos la imagen, usar un placeholder
        return `<img${before}src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect fill='%23f0f0f0' width='100' height='100'/><text x='50' y='50' font-family='Arial' font-size='8' text-anchor='middle' fill='%23999999'>Imagen no disponible</text></svg>"${after}>`;
      }
    );
  };

  // Función para manejar mensajes del iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type) {
        switch (event.data.type) {
          case 'DOM_READY':
            console.log('DOM del iframe está listo');
            break;
          case 'RESOURCES_LOADED':
            console.log('Todos los recursos del iframe están cargados');
            break;
          case 'ERROR':
            console.error(`Error en iframe: ${event.data.message} en ${event.data.source}:${event.data.line}`);
            break;
          case 'ELEMENT_CLICKED':
            console.log(`Elemento clickeado: ${event.data.tagName}#${event.data.id}.${event.data.className}`);
            break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Escuchar eventos de modificación de archivos para actualización automática
  useEffect(() => {
    const handleFileModified = (event: CustomEvent) => {
      const { file, isStaticFile, timestamp } = event.detail;

      if (isStaticFile) {
        console.log('🔄 CodePreview: Archivo estático modificado detectado, actualizando vista previa:', file.path);

        // Actualizar timestamp de última modificación
        setLastModified(timestamp);

        // Si el archivo modificado es HTML y hay archivos HTML, regenerar vista previa
        if (file.path.endsWith('.html') || file.path.endsWith('.htm')) {
          console.log('📄 Archivo HTML modificado, regenerando vista previa...');
          generatePreview();
        }
        // Si es CSS o JS y hay archivos HTML, también regenerar
        else if ((file.path.endsWith('.css') || file.path.endsWith('.js')) && htmlFiles.length > 0) {
          console.log('🎨 Archivo CSS/JS modificado, regenerando vista previa...');
          generatePreview();
        }
      }
    };

    // Agregar listener para el evento personalizado
    window.addEventListener('codestorm-file-modified', handleFileModified as EventListener);

    return () => {
      window.removeEventListener('codestorm-file-modified', handleFileModified as EventListener);
    };
  }, [htmlFiles.length, generatePreview]);

  // Función para cambiar el tamaño de la vista previa
  const getViewportStyle = () => {
    switch (viewportSize) {
      case 'mobile':
        return { width: '375px', height: '100%', margin: '0 auto' };
      case 'tablet':
        return { width: '768px', height: '100%', margin: '0 auto' };
      case 'desktop':
      default:
        return { width: '100%', height: '100%' };
    }
  };

  // Función para alternar el modo de pantalla completa
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Función para alternar la actualización automática
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const activeFile = activeTab ? processedFiles.find(f => f.id === activeTab) : null;

  return (
    <div className={`fixed inset-0 bg-black/70 z-50 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`bg-codestorm-darker rounded-lg shadow-xl flex flex-col ${
        isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[90vh]'
      }`}>
        <div className="bg-codestorm-dark p-3 rounded-t-lg border-b border-codestorm-blue/30 flex justify-between items-center">
          <h2 className="text-lg font-medium text-white flex items-center">
            <Eye className="h-5 w-5 mr-2 text-codestorm-gold" />
            Vista Previa del Código
          </h2>
          <div className="flex items-center space-x-2">
            {/* Controles de tamaño de viewport */}
            <div className="flex items-center bg-codestorm-darker rounded-md mr-2">
              <button
                onClick={() => setViewportSize('mobile')}
                className={`p-1.5 rounded-l ${
                  viewportSize === 'mobile' ? 'bg-codestorm-blue/30 text-white' : 'text-gray-400 hover:bg-codestorm-blue/20 hover:text-white'
                }`}
                title="Vista móvil"
              >
                <Smartphone className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewportSize('tablet')}
                className={`p-1.5 ${
                  viewportSize === 'tablet' ? 'bg-codestorm-blue/30 text-white' : 'text-gray-400 hover:bg-codestorm-blue/20 hover:text-white'
                }`}
                title="Vista tablet"
              >
                <Tablet className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewportSize('desktop')}
                className={`p-1.5 rounded-r ${
                  viewportSize === 'desktop' ? 'bg-codestorm-blue/30 text-white' : 'text-gray-400 hover:bg-codestorm-blue/20 hover:text-white'
                }`}
                title="Vista escritorio"
              >
                <Monitor className="h-4 w-4" />
              </button>
            </div>

            {/* Botón de actualización automática */}
            <button
              onClick={toggleAutoRefresh}
              className={`p-1.5 rounded ${
                autoRefresh ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:bg-codestorm-blue/20 hover:text-white'
              }`}
              title={autoRefresh ? "Desactivar actualización automática" : "Activar actualización automática"}
            >
              <RotateCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin-slow' : ''}`} />
            </button>

            {/* Botón de pantalla completa */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>

            {/* Botón de cerrar */}
            <button
              onClick={onClose}
              className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
              title="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Barra lateral con pestañas de archivos */}
          {!isFullscreen && (
            <div className="w-full md:w-64 bg-codestorm-dark border-r border-codestorm-blue/30 overflow-y-auto">
              {htmlFiles.length > 0 && (
                <div className="p-2">
                  <h3 className="text-xs font-medium text-gray-400 mb-1 uppercase">HTML</h3>
                  <div className="space-y-1">
                    {htmlFiles.map(file => (
                      <button
                        key={generateFileKey(file)}
                        className={`w-full text-left px-2 py-1 rounded text-sm ${
                          activeTab === file.id
                            ? 'bg-codestorm-blue text-white'
                            : 'text-gray-300 hover:bg-codestorm-blue/10'
                        }`}
                        onClick={() => setActiveTab(file.id)}
                      >
                        {file.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {cssFiles.length > 0 && (
                <div className="p-2 border-t border-codestorm-blue/20">
                  <h3 className="text-xs font-medium text-gray-400 mb-1 uppercase">CSS</h3>
                  <div className="space-y-1">
                    {cssFiles.map(file => (
                      <button
                        key={generateFileKey(file)}
                        className={`w-full text-left px-2 py-1 rounded text-sm ${
                          activeTab === file.id
                            ? 'bg-codestorm-blue text-white'
                            : 'text-gray-300 hover:bg-codestorm-blue/10'
                        }`}
                        onClick={() => setActiveTab(file.id)}
                      >
                        {file.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {jsFiles.length > 0 && (
                <div className="p-2 border-t border-codestorm-blue/20">
                  <h3 className="text-xs font-medium text-gray-400 mb-1 uppercase">JavaScript</h3>
                  <div className="space-y-1">
                    {jsFiles.map(file => (
                      <button
                        key={generateFileKey(file)}
                        className={`w-full text-left px-2 py-1 rounded text-sm ${
                          activeTab === file.id
                            ? 'bg-codestorm-blue text-white'
                            : 'text-gray-300 hover:bg-codestorm-blue/10'
                        }`}
                        onClick={() => setActiveTab(file.id)}
                      >
                        {file.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {otherFiles.length > 0 && (
                <div className="p-2 border-t border-codestorm-blue/20">
                  <h3 className="text-xs font-medium text-gray-400 mb-1 uppercase">Otros Archivos</h3>
                  <div className="space-y-1">
                    {otherFiles.map(file => (
                      <button
                        key={generateFileKey(file)}
                        className={`w-full text-left px-2 py-1 rounded text-sm ${
                          activeTab === file.id
                            ? 'bg-codestorm-blue text-white'
                            : 'text-gray-300 hover:bg-codestorm-blue/10'
                        }`}
                        onClick={() => setActiveTab(file.id)}
                      >
                        {file.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Área de previsualización */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Barra de herramientas */}
            <div className="bg-codestorm-dark p-2 border-b border-codestorm-blue/30 flex justify-between items-center">
              <div className="text-sm text-white">
                {activeFile ? activeFile.path : 'Ningún archivo seleccionado'}
                {autoRefresh && (
                  <span className="ml-2 text-xs text-green-400">
                    (Actualización automática activada)
                  </span>
                )}
                {lastModified && (
                  <span className="ml-2 text-xs text-gray-400">
                    Última actualización: {new Date(lastModified).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                {htmlFiles.length > 0 && (
                  <button
                    onClick={generatePreview}
                    className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
                    title="Actualizar vista previa"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                )}
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
                    title="Abrir en nueva pestaña"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-hidden bg-white">
              {activeFile && activeFile.path.endsWith('.html') && previewUrl ? (
                <div className="w-full h-full relative bg-gray-100 flex items-center justify-center overflow-auto">
                  <div
                    className={`bg-white ${viewportSize !== 'desktop' ? 'shadow-lg border border-gray-200 rounded-md' : ''}`}
                    style={getViewportStyle()}
                  >
                    <iframe
                      ref={iframeRef}
                      src={previewUrl}
                      className="w-full h-full border-0"
                      title="Vista previa"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-presentation"
                      onLoad={() => console.log('iframe cargado')}
                    />
                  </div>

                  {/* Indicador de tamaño */}
                  {viewportSize !== 'desktop' && (
                    <div className="absolute bottom-2 right-2 bg-codestorm-dark text-white text-xs px-2 py-1 rounded-md opacity-70">
                      {viewportSize === 'mobile' ? '375px' : '768px'}
                    </div>
                  )}
                </div>
              ) : activeFile ? (
                <div className="bg-codestorm-darker p-4 h-full overflow-auto">
                  <pre className="text-white text-sm font-mono whitespace-pre-wrap">
                    <code>{activeFile.content}</code>
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 bg-codestorm-darker">
                  <div className="flex flex-col items-center">
                    <Code className="h-12 w-12 mb-2 opacity-30" />
                    <p>Selecciona un archivo para ver su contenido</p>
                  </div>
                </div>
              )}

              {/* Mensaje de error */}
              {error && (
                <div className="absolute bottom-4 left-4 bg-red-500/80 text-white px-3 py-2 rounded-md text-sm shadow-lg">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodePreview;
