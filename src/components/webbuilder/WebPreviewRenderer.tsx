import React, { useState, useEffect, useRef } from 'react';
import { FileItem } from '../../types';

interface WebPreviewRendererProps {
  files: FileItem[];
  isVisible: boolean;
  onError?: (error: string) => void;
  onFilesGenerated?: (files: FileItem[]) => void;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

interface ViewportConfig {
  width: number;
  height: number;
  label: string;
  icon: string;
}

const VIEWPORT_CONFIGS: Record<ViewportSize, ViewportConfig> = {
  desktop: { width: 1200, height: 800, label: 'Desktop', icon: '🖥️' },
  tablet: { width: 768, height: 1024, label: 'Tablet', icon: '📱' },
  mobile: { width: 375, height: 667, label: 'Mobile', icon: '📱' }
};

export const WebPreviewRenderer: React.FC<WebPreviewRendererProps> = ({
  files,
  isVisible,
  onError,
  onFilesGenerated
}) => {
  const [currentViewport, setCurrentViewport] = useState<ViewportSize>('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generar contenido HTML completo con CSS y JS integrados
  const generateCompleteHTML = (files: FileItem[]): string => {
    const htmlFile = files.find(f => f.language === 'html' || f.path.endsWith('.html'));
    const cssFiles = files.filter(f => f.language === 'css' || f.path.endsWith('.css'));
    const jsFiles = files.filter(f => f.language === 'javascript' || f.path.endsWith('.js'));

    if (!htmlFile) {
      return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Vista Previa - WebAI</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 2rem;
            }

            .message {
              text-align: center;
              padding: 3rem;
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
              border-radius: 20px;
              border: 1px solid rgba(255, 255, 255, 0.2);
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
              max-width: 500px;
              animation: fadeInUp 0.6s ease forwards;
            }

            .message h2 {
              font-size: 2rem;
              margin-bottom: 1rem;
              background: linear-gradient(45deg, #fff, #f0f9ff);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }

            .message p {
              font-size: 1.1rem;
              opacity: 0.9;
              line-height: 1.6;
            }

            .loading-dots {
              display: inline-block;
              margin-left: 0.5rem;
            }

            .loading-dots::after {
              content: '';
              animation: dots 1.5s infinite;
            }

            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes dots {
              0%, 20% { content: ''; }
              40% { content: '.'; }
              60% { content: '..'; }
              80%, 100% { content: '...'; }
            }
          </style>
        </head>
        <body>
          <div class="message">
            <h2>🎨 Vista Previa WebAI</h2>
            <p>Genera un sitio web para ver la vista previa integrada con todas las funcionalidades<span class="loading-dots"></span></p>
            <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
              <h3 style="margin: 0 0 1rem 0; font-size: 1.2rem;">💡 Ejemplo de solicitud:</h3>
              <p style="margin: 0 0 1.5rem 0; font-style: italic; opacity: 0.8;">"Crea un sitio web moderno para una agencia de marketing digital con página de inicio, servicios, portafolio y contacto"</p>
              <button
                onclick="window.parent.postMessage({type: 'loadExampleSite'}, '*')"
                style="
                  background: linear-gradient(45deg, #6366f1, #f59e0b);
                  color: white;
                  border: none;
                  padding: 0.75rem 1.5rem;
                  border-radius: 25px;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
                "
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(99, 102, 241, 0.4)'"
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(99, 102, 241, 0.3)'"
              >
                🚀 Cargar Sitio de Ejemplo
              </button>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    let htmlContent = htmlFile.content;

    // Inyectar CSS en el head
    if (cssFiles.length > 0) {
      const allCSS = cssFiles.map(f => f.content).join('\n\n');
      const cssTag = `<style>\n${allCSS}\n</style>`;
      
      if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `${cssTag}\n</head>`);
      } else {
        htmlContent = htmlContent.replace('<html', `<head>${cssTag}</head>\n<html`);
      }
    }

    // Inyectar JavaScript antes del cierre del body
    if (jsFiles.length > 0) {
      const allJS = jsFiles.map(f => f.content).join('\n\n');
      const jsTag = `<script>\n${allJS}\n</script>`;
      
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', `${jsTag}\n</body>`);
      } else {
        htmlContent += `\n${jsTag}`;
      }
    }

    // Asegurar viewport meta tag para responsive
    if (!htmlContent.includes('viewport')) {
      const viewportTag = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
      if (htmlContent.includes('<head>')) {
        htmlContent = htmlContent.replace('<head>', `<head>\n${viewportTag}`);
      }
    }

    // Agregar estilos base para la vista previa
    const baseStyles = `
      <style>
        /* Estilos base para vista previa */
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        
        /* Asegurar que las animaciones funcionen */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-in {
          animation: fadeIn 0.6s ease forwards;
        }
        
        /* Estilos para elementos interactivos */
        button, .btn {
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        button:hover, .btn:hover {
          transform: translateY(-2px);
        }
        
        /* Responsive helpers */
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
        }
        
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }
      </style>
    `;

    if (htmlContent.includes('</head>')) {
      htmlContent = htmlContent.replace('</head>', `${baseStyles}\n</head>`);
    }

    return htmlContent;
  };

  // Función para cargar sitio de ejemplo
  const loadExampleSite = async () => {
    setIsLoading(true);
    try {
      // Cargar archivos del sitio de ejemplo
      const [htmlResponse, cssResponse, jsResponse] = await Promise.all([
        fetch('/example-site/index.html'),
        fetch('/example-site/styles.css'),
        fetch('/example-site/script.js')
      ]);

      const [htmlContent, cssContent, jsContent] = await Promise.all([
        htmlResponse.text(),
        cssResponse.text(),
        jsResponse.text()
      ]);

      // Crear archivos de ejemplo
      const exampleFiles = [
        {
          id: 'example-html',
          name: 'index.html',
          path: 'index.html',
          content: htmlContent,
          language: 'html',
          type: 'file' as const,
          size: htmlContent.length,
          timestamp: Date.now(),
          lastModified: Date.now()
        },
        {
          id: 'example-css',
          name: 'styles.css',
          path: 'styles.css',
          content: cssContent,
          language: 'css',
          type: 'file' as const,
          size: cssContent.length,
          timestamp: Date.now(),
          lastModified: Date.now()
        },
        {
          id: 'example-js',
          name: 'script.js',
          path: 'script.js',
          content: jsContent,
          language: 'javascript',
          type: 'file' as const,
          size: jsContent.length,
          timestamp: Date.now(),
          lastModified: Date.now()
        }
      ];

      // Notificar archivos cargados
      if (onFilesGenerated) {
        onFilesGenerated(exampleFiles);
      }

      // Generar vista previa
      const completeHTML = generateCompleteHTML(exampleFiles);
      setPreviewContent(completeHTML);
      setIsLoading(false);

      console.log('🚀 Sitio de ejemplo cargado correctamente');
    } catch (error) {
      console.error('Error cargando sitio de ejemplo:', error);
      onError?.('Error cargando el sitio de ejemplo');
      setIsLoading(false);
    }
  };

  // Listener para mensajes del iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'loadExampleSite') {
        loadExampleSite();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onFilesGenerated]);

  // Actualizar vista previa cuando cambien los archivos
  useEffect(() => {
    if (files && files.length > 0 && isVisible) {
      setIsLoading(true);
      try {
        const completeHTML = generateCompleteHTML(files);
        setPreviewContent(completeHTML);
        setIsLoading(false);
      } catch (error) {
        console.error('Error generando vista previa:', error);
        onError?.(error instanceof Error ? error.message : 'Error generando vista previa');
        setIsLoading(false);
      }
    }
  }, [files, isVisible]);

  // Actualizar iframe cuando cambie el contenido
  useEffect(() => {
    if (iframeRef.current && previewContent) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        doc.open();
        doc.write(previewContent);
        doc.close();
        
        // Agregar event listeners para interactividad
        iframe.onload = () => {
          const iframeWindow = iframe.contentWindow;
          if (iframeWindow && (iframeWindow as any).console) {
            // Interceptar console.log para debugging
            (iframeWindow as any).console.log = (...args: any[]) => {
              console.log('[Preview]', ...args);
            };
            
            // Manejar errores en el iframe
            iframeWindow.onerror = (message, source, lineno, colno, error) => {
              console.error('[Preview Error]', { message, source, lineno, colno, error });
              return true;
            };
          }
        };
      }
    }
  }, [previewContent]);

  const handleViewportChange = (viewport: ViewportSize) => {
    setCurrentViewport(viewport);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const refreshPreview = () => {
    if (files && files.length > 0) {
      setIsLoading(true);
      setTimeout(() => {
        const completeHTML = generateCompleteHTML(files);
        setPreviewContent(completeHTML);
        setIsLoading(false);
      }, 500);
    }
  };

  const currentConfig = VIEWPORT_CONFIGS[currentViewport];

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className={`web-preview-renderer ${isFullscreen ? 'fullscreen' : ''}`}
    >
      {/* Controles de Vista Previa */}
      <div className="preview-controls">
        <div className="viewport-controls">
          <span className="controls-label">Vista:</span>
          {Object.entries(VIEWPORT_CONFIGS).map(([key, config]) => (
            <button
              key={key}
              className={`viewport-btn ${currentViewport === key ? 'active' : ''}`}
              onClick={() => handleViewportChange(key as ViewportSize)}
              title={config.label}
            >
              {config.icon} {config.label}
            </button>
          ))}
        </div>
        
        <div className="preview-actions">
          <button 
            className="action-btn refresh-btn"
            onClick={refreshPreview}
            title="Actualizar Vista Previa"
          >
            🔄 Actualizar
          </button>
          <button 
            className="action-btn fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
          >
            {isFullscreen ? '🗗' : '🗖'} {isFullscreen ? 'Salir' : 'Pantalla Completa'}
          </button>
        </div>
      </div>

      {/* Información del Viewport */}
      <div className="viewport-info">
        <span className="viewport-size">
          {currentConfig.width} × {currentConfig.height}px
        </span>
        {isLoading && (
          <span className="loading-indicator">
            ⏳ Cargando...
          </span>
        )}
      </div>

      {/* Frame de Vista Previa */}
      <div 
        className="preview-frame-container"
        style={{
          width: isFullscreen ? '100%' : `${currentConfig.width}px`,
          height: isFullscreen ? 'calc(100vh - 120px)' : `${currentConfig.height}px`,
          maxWidth: '100%'
        }}
      >
        <iframe
          ref={iframeRef}
          className="preview-iframe"
          title="Vista Previa del Sitio Web"
          sandbox="allow-scripts allow-forms allow-popups allow-modals"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: isFullscreen ? '0' : '8px',
            boxShadow: isFullscreen ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        />
        
        {isLoading && (
          <div className="preview-loading">
            <div className="loading-spinner"></div>
            <p>Renderizando vista previa...</p>
          </div>
        )}
      </div>

      {/* Información de Funcionalidades */}
      <div className="preview-features">
        <div className="feature-tag">✨ Animaciones CSS3</div>
        <div className="feature-tag">🖱️ Interactividad JS</div>
        <div className="feature-tag">📱 Responsive Design</div>
        <div className="feature-tag">🎨 Efectos Modernos</div>
      </div>
    </div>
  );
};

export default WebPreviewRenderer;
