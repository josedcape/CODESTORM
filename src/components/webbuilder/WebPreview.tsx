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
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [forceRefresh, setForceRefresh] = useState(0);

  // Función para validar y limpiar JavaScript
  const validateAndCleanJS = (jsCode: string): string => {
    if (!jsCode || jsCode.trim() === '') return '';

    try {
      // Limpiar patrones problemáticos comunes
      let cleanedJS = jsCode
        // Reemplazar querySelector('#') con código seguro
        .replace(/querySelector\s*\(\s*['"`]#['"`]\s*\)/g, 'null /* querySelector con selector vacío removido */')
        .replace(/querySelectorAll\s*\(\s*['"`]#['"`]\s*\)/g, '[] /* querySelectorAll con selector vacío removido */')
        // Reemplazar getElementById('') con código seguro
        .replace(/getElementById\s*\(\s*['"`]['"`]\s*\)/g, 'null /* getElementById con ID vacío removido */')
        // Agregar verificación de existencia para elementos
        .replace(/(\w+)\.addEventListener\s*\(/g, '$1 && $1.addEventListener(');

      // Envolver en try-catch para mayor seguridad
      cleanedJS = `
try {
  // Código JavaScript validado y limpiado
  ${cleanedJS}
} catch (error) {
  console.warn('Error en JavaScript de vista previa:', error);
}`;

      return cleanedJS;
    } catch (error) {
      console.warn('Error al validar JavaScript:', error);
      return '// JavaScript no válido - removido por seguridad';
    }
  };

  // Efecto para detectar cambios en el contenido y forzar actualización completa
  useEffect(() => {
    setLastUpdate(Date.now());
    setForceRefresh(prev => prev + 1); // Forzar re-render del iframe

    console.log('🔄 Vista previa actualizada automáticamente:', {
      htmlLength: html.length,
      cssLength: css.length,
      jsLength: js.length,
      timestamp: new Date().toLocaleTimeString()
    });
  }, [html, css, js]);

  // Función para limpiar y validar HTML
  const cleanHTML = (htmlContent: string): string => {
    if (!htmlContent) return '';

    // Remover DOCTYPE duplicados si existen
    let cleanedHTML = htmlContent;
    const doctypeMatches = htmlContent.match(/<!DOCTYPE[^>]*>/gi);
    if (doctypeMatches && doctypeMatches.length > 1) {
      // Mantener solo el primer DOCTYPE y remover los demás
      for (let i = 1; i < doctypeMatches.length; i++) {
        cleanedHTML = cleanedHTML.replace(doctypeMatches[i], '');
      }
    }

    // Si el HTML ya incluye DOCTYPE y estructura completa, extraer solo el body
    if (cleanedHTML.includes('<!DOCTYPE') && cleanedHTML.includes('<html')) {
      const bodyMatch = cleanedHTML.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        return bodyMatch[1].trim();
      }
    }

    return cleanedHTML.trim();
  };

  // Combinar HTML, CSS y JS en un solo documento
  const combinedCode = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="description" content="Sitio web generado por CODESTORM WebAI">
      <style>
        ${css}
      </style>
    </head>
    <body>
      ${cleanHTML(html)}
      <script>
        // JavaScript validado y limpiado
        ${validateAndCleanJS(js)}

        // Log para confirmar que el contenido se ha actualizado
        console.log('🌐 Sitio web cargado - Última actualización:', new Date(${lastUpdate}).toLocaleTimeString());

        // Función de utilidad para navegación segura
        function setupSafeNavigation() {
          // Manejar enlaces de navegación interna de forma segura
          document.querySelectorAll('a[href^="#"]').forEach(link => {
            const href = link.getAttribute('href');
            if (href && href !== '#' && href.length > 1) {
              link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                  targetElement.scrollIntoView({ behavior: 'smooth' });
                }
              });
            } else if (href === '#') {
              // Para enlaces con href="#", prevenir comportamiento por defecto
              link.addEventListener('click', function(e) {
                e.preventDefault();
              });
            }
          });
        }

        // Ejecutar configuración cuando el DOM esté listo
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', setupSafeNavigation);
        } else {
          setupSafeNavigation();
        }
      </script>
    </body>
    </html>
  `;

  // Función para forzar actualización manual
  const forceRefreshPreview = () => {
    setForceRefresh(prev => prev + 1);
    setLastUpdate(Date.now());
    console.log('🔄 Vista previa actualizada manualmente');

    if (onRefresh) {
      onRefresh();
    }
  };

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

        <div className="flex items-center space-x-3">
          <h2 className="text-sm font-medium">Vista Previa</h2>
          <div className="flex items-center space-x-1 text-xs text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Auto-sync</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-blue-400">
            <span>Actualización #{forceRefresh}</span>
          </div>
          {/* Indicador de código disponible */}
          <div className="flex items-center space-x-1 text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
            <Code className="h-3 w-3" />
            <span>Código disponible</span>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={forceRefreshPreview}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title="Actualizar vista previa"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {onViewCode && (
            <button
              onClick={onViewCode}
              className="flex items-center space-x-1 px-3 py-1.5 rounded bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white transition-all"
              title="Ver código fuente"
            >
              <Code className="h-4 w-4" />
              <span className="text-xs font-medium">Código</span>
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
            key={`preview-${forceRefresh}-${lastUpdate}`}
            srcDoc={combinedCode}
            title="Vista previa del sitio web"
            className="w-full h-[600px] border-0"
            sandbox="allow-same-origin allow-scripts"
            onLoad={() => console.log('🌐 Iframe cargado con nuevo contenido')}
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
