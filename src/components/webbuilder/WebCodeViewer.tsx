import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Code, 
  Copy, 
  Download, 
  Eye, 
  X, 
  FileText, 
  Palette, 
  Zap, 
  Check, 
  AlertCircle,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface WebCodeViewerProps {
  html: string;
  css?: string;
  js?: string;
  onClose: () => void;
  onPreview?: () => void;
}

type FileType = 'html' | 'css' | 'js';

const WebCodeViewer: React.FC<WebCodeViewerProps> = ({
  html,
  css = '',
  js = '',
  onClose,
  onPreview
}) => {
  const [activeTab, setActiveTab] = useState<FileType>('html');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<{ [key in FileType]?: 'idle' | 'success' | 'error' }>({});

  // Función para obtener el contenido del archivo activo
  const getActiveContent = () => {
    switch (activeTab) {
      case 'html':
        return html;
      case 'css':
        return css;
      case 'js':
        return js;
      default:
        return '';
    }
  };

  // Función para obtener el lenguaje de sintaxis
  const getLanguage = (type: FileType) => {
    switch (type) {
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'js':
        return 'javascript';
      default:
        return 'text';
    }
  };

  // Función para obtener el icono del archivo
  const getFileIcon = (type: FileType) => {
    switch (type) {
      case 'html':
        return <FileText className="h-4 w-4" />;
      case 'css':
        return <Palette className="h-4 w-4" />;
      case 'js':
        return <Zap className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  // Función para copiar código al portapapeles
  const copyToClipboard = async (type: FileType) => {
    try {
      const content = type === 'html' ? html : type === 'css' ? css : js;
      await navigator.clipboard.writeText(content);
      
      setCopyStatus(prev => ({ ...prev, [type]: 'success' }));
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [type]: 'idle' }));
      }, 2000);
    } catch (error) {
      setCopyStatus(prev => ({ ...prev, [type]: 'error' }));
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [type]: 'idle' }));
      }, 2000);
    }
  };

  // Función para descargar archivo
  const downloadFile = (type: FileType) => {
    const content = type === 'html' ? html : type === 'css' ? css : js;
    const extension = type === 'js' ? 'js' : type;
    const mimeType = type === 'html' ? 'text/html' : type === 'css' ? 'text/css' : 'text/javascript';
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mi-sitio-web.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Función para descargar todos los archivos como ZIP (simulado)
  const downloadAllFiles = () => {
    // Para una implementación completa, se podría usar JSZip
    // Por ahora, descargamos el HTML completo con CSS y JS embebido
    const combinedContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mi Sitio Web - Generado por CODESTORM</title>
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
</html>`;

    const blob = new Blob([combinedContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mi-sitio-web-completo.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Obtener estadísticas del código
  const getCodeStats = () => {
    return {
      html: {
        lines: html.split('\n').length,
        chars: html.length,
        size: new Blob([html]).size
      },
      css: {
        lines: css.split('\n').length,
        chars: css.length,
        size: new Blob([css]).size
      },
      js: {
        lines: js.split('\n').length,
        chars: js.length,
        size: new Blob([js]).size
      }
    };
  };

  const stats = getCodeStats();

  return (
    <div className={`
      bg-codestorm-darker text-white
      ${isFullscreen ? 'fixed inset-0 z-50' : 'rounded-lg shadow-lg'}
      flex flex-col overflow-hidden
    `}>
      {/* Header */}
      <div className="bg-codestorm-blue/20 p-4 border-b border-codestorm-blue/30 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Code className="h-5 w-5 text-codestorm-accent" />
          <h2 className="text-lg font-semibold">Código Generado</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>•</span>
            <span>{stats.html.lines + stats.css.lines + stats.js.lines} líneas totales</span>
            <span>•</span>
            <span>{Math.round((stats.html.size + stats.css.size + stats.js.size) / 1024)} KB</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onPreview && (
            <button
              onClick={onPreview}
              className="flex items-center space-x-2 px-3 py-1.5 bg-codestorm-blue/30 hover:bg-codestorm-blue/50 rounded-md transition-colors"
              title="Ver vista previa"
            >
              <Eye className="h-4 w-4" />
              <span className="text-sm">Vista Previa</span>
            </button>
          )}
          
          <button
            onClick={downloadAllFiles}
            className="flex items-center space-x-2 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 rounded-md transition-colors"
            title="Descargar sitio completo"
          >
            <Download className="h-4 w-4" />
            <span className="text-sm">Descargar Todo</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-gray-400 hover:bg-red-500/20 hover:text-red-400"
            title="Cerrar visor de código"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-codestorm-dark border-b border-gray-700 flex">
        {(['html', 'css', 'js'] as FileType[]).map((type) => {
          const isActive = activeTab === type;
          const hasContent = type === 'html' ? html.length > 0 : type === 'css' ? css.length > 0 : js.length > 0;
          
          return (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              disabled={!hasContent}
              className={`
                flex items-center space-x-2 px-4 py-3 border-b-2 transition-all
                ${isActive 
                  ? 'border-codestorm-accent text-white bg-codestorm-darker' 
                  : hasContent
                    ? 'border-transparent text-gray-400 hover:text-white hover:bg-codestorm-darker/50'
                    : 'border-transparent text-gray-600 cursor-not-allowed'
                }
              `}
            >
              {getFileIcon(type)}
              <span className="font-medium uppercase">{type}</span>
              <span className="text-xs bg-codestorm-blue/20 px-1.5 py-0.5 rounded">
                {type === 'html' ? stats.html.lines : type === 'css' ? stats.css.lines : stats.js.lines} líneas
              </span>
              {!hasContent && (
                <AlertCircle className="h-3 w-3 text-gray-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* File Actions */}
        <div className="bg-codestorm-dark p-2 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>Archivo: {activeTab.toUpperCase()}</span>
            <span>•</span>
            <span>{getActiveContent().split('\n').length} líneas</span>
            <span>•</span>
            <span>{getActiveContent().length} caracteres</span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => copyToClipboard(activeTab)}
              className="flex items-center space-x-1 px-2 py-1 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
              title={`Copiar código ${activeTab.toUpperCase()}`}
            >
              {copyStatus[activeTab] === 'success' ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : copyStatus[activeTab] === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="text-xs">Copiar</span>
            </button>

            <button
              onClick={() => downloadFile(activeTab)}
              className="flex items-center space-x-1 px-2 py-1 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
              title={`Descargar archivo ${activeTab.toUpperCase()}`}
            >
              <Download className="h-4 w-4" />
              <span className="text-xs">Descargar</span>
            </button>
          </div>
        </div>

        {/* Code Display */}
        <div className="flex-1 overflow-auto">
          {getActiveContent() ? (
            <SyntaxHighlighter
              language={getLanguage(activeTab)}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '1rem',
                background: '#0a1120',
                minHeight: '100%',
                borderRadius: 0,
                fontSize: '14px',
                lineHeight: '1.5'
              }}
              showLineNumbers
              wrapLines
              lineNumberStyle={{
                minWidth: '3em',
                paddingRight: '1em',
                color: '#6b7280',
                borderRight: '1px solid #374151',
                marginRight: '1em'
              }}
            >
              {getActiveContent()}
            </SyntaxHighlighter>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="flex flex-col items-center space-y-2">
                <AlertCircle className="h-12 w-12 opacity-30" />
                <p>No hay contenido {activeTab.toUpperCase()} generado</p>
                <p className="text-sm">Este archivo está vacío o no fue generado</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-codestorm-blue/10 p-2 border-t border-codestorm-blue/30 flex justify-between items-center text-xs text-gray-400">
        <div>
          Generado por CODESTORM WebAI • {new Date().toLocaleDateString()}
        </div>
        <div className="flex items-center space-x-4">
          <span>HTML: {stats.html.lines} líneas</span>
          <span>CSS: {stats.css.lines} líneas</span>
          <span>JS: {stats.js.lines} líneas</span>
        </div>
      </div>
    </div>
  );
};

export default WebCodeViewer;
