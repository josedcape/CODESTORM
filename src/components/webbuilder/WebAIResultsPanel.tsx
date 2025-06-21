import React, { useState, useEffect } from 'react';
import {
  Eye,
  Code,
  Download,
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Copy,
  Check,
  FileText,
  Palette,
  Zap,
  Sparkles,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface WebAIResultsPanelProps {
  html: string;
  css?: string;
  js?: string;
  onBack: () => void;
  onNewGeneration: () => void;
}

type ViewMode = 'preview' | 'code';
type DeviceMode = 'desktop' | 'tablet' | 'mobile';
type CodeTab = 'html' | 'css' | 'js';

const WebAIResultsPanel: React.FC<WebAIResultsPanelProps> = ({
  html,
  css = '',
  js = '',
  onBack,
  onNewGeneration
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [activeCodeTab, setActiveCodeTab] = useState<CodeTab>('html');
  const [copyStatus, setCopyStatus] = useState<{ [key in CodeTab]?: boolean }>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh preview when content changes
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [html, css, js]);

  // Get device viewport styles
  const getDeviceStyles = () => {
    switch (deviceMode) {
      case 'mobile':
        return { width: '375px', height: '667px' };
      case 'tablet':
        return { width: '768px', height: '1024px' };
      case 'desktop':
      default:
        return { width: '100%', height: '100%' };
    }
  };

  // Get code content for active tab
  const getActiveCodeContent = () => {
    switch (activeCodeTab) {
      case 'html': return html;
      case 'css': return css;
      case 'js': return js;
      default: return '';
    }
  };

  // Get language for syntax highlighting
  const getLanguage = (tab: CodeTab) => {
    switch (tab) {
      case 'html': return 'html';
      case 'css': return 'css';
      case 'js': return 'javascript';
      default: return 'text';
    }
  };

  // Get file icon
  const getFileIcon = (tab: CodeTab) => {
    switch (tab) {
      case 'html': return <FileText className="h-4 w-4" />;
      case 'css': return <Palette className="h-4 w-4" />;
      case 'js': return <Zap className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
  };

  // Copy code to clipboard
  const copyToClipboard = async (tab: CodeTab) => {
    try {
      const content = getActiveCodeContent();
      await navigator.clipboard.writeText(content);
      setCopyStatus(prev => ({ ...prev, [tab]: true }));
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [tab]: false }));
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  // Download file
  const downloadFile = (tab: CodeTab) => {
    const content = tab === 'html' ? html : tab === 'css' ? css : js;
    const extension = tab === 'js' ? 'js' : tab;
    const mimeType = tab === 'html' ? 'text/html' : tab === 'css' ? 'text/css' : 'text/javascript';

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

  // Download complete website
  const downloadComplete = () => {
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

  // Create preview document
  const createPreviewDocument = () => {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vista Previa - CODESTORM</title>
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
  };

  // Get code statistics
  const getCodeStats = () => {
    return {
      html: { lines: html.split('\n').length, chars: html.length },
      css: { lines: css.split('\n').length, chars: css.length },
      js: { lines: js.split('\n').length, chars: js.length }
    };
  };

  const stats = getCodeStats();

  return (
    <div className="h-full bg-codestorm-darker text-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 border-b border-green-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-green-200" />
              <h1 className="text-xl font-bold text-white">¡Página Web Generada Exitosamente!</h1>
            </div>
            <div className="hidden md:flex items-center space-x-4 text-sm text-green-200">
              <span>HTML: {stats.html.lines} líneas</span>
              <span>CSS: {stats.css.lines} líneas</span>
              <span>JS: {stats.js.lines} líneas</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onNewGeneration}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden md:inline">Nueva Página</span>
            </button>

            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden md:inline">Volver</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="bg-codestorm-dark border-b border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                viewMode === 'preview'
                  ? 'bg-codestorm-blue text-white'
                  : 'text-gray-400 hover:text-white hover:bg-codestorm-blue/20'
              }`}
            >
              <Eye className="h-4 w-4" />
              <span>Vista Previa</span>
            </button>

            <button
              onClick={() => setViewMode('code')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                viewMode === 'code'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-purple-600/20'
              }`}
            >
              <Code className="h-4 w-4" />
              <span>Código Fuente</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={downloadComplete}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded-md transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="hidden md:inline">Descargar Sitio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'preview' ? (
          <div className="h-full flex flex-col">
            {/* Device Selector */}
            <div className="bg-codestorm-dark p-3 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setDeviceMode('desktop')}
                  className={`p-2 rounded ${deviceMode === 'desktop' ? 'bg-codestorm-blue text-white' : 'text-gray-400 hover:text-white'}`}
                  title="Vista de escritorio"
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeviceMode('tablet')}
                  className={`p-2 rounded ${deviceMode === 'tablet' ? 'bg-codestorm-blue text-white' : 'text-gray-400 hover:text-white'}`}
                  title="Vista de tablet"
                >
                  <Tablet className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeviceMode('mobile')}
                  className={`p-2 rounded ${deviceMode === 'mobile' ? 'bg-codestorm-blue text-white' : 'text-gray-400 hover:text-white'}`}
                  title="Vista de móvil"
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>Dispositivo: {deviceMode === 'desktop' ? 'Escritorio' : deviceMode === 'tablet' ? 'Tablet' : 'Móvil'}</span>
                <button
                  onClick={() => setRefreshKey(prev => prev + 1)}
                  className="p-1 hover:text-white"
                  title="Actualizar vista previa"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-gray-100 p-4 overflow-auto">
              <div className="flex justify-center">
                <div
                  className="bg-white shadow-lg transition-all duration-300"
                  style={getDeviceStyles()}
                >
                  <iframe
                    key={`preview-${refreshKey}`}
                    srcDoc={createPreviewDocument()}
                    title="Vista previa del sitio web"
                    className="w-full h-full border-0"
                    sandbox="allow-same-origin allow-scripts"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Code Tabs */}
            <div className="bg-codestorm-dark border-b border-gray-700 flex">
              {(['html', 'css', 'js'] as CodeTab[]).map((tab) => {
                const isActive = activeCodeTab === tab;
                const hasContent = tab === 'html' ? html.length > 0 : tab === 'css' ? css.length > 0 : js.length > 0;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveCodeTab(tab)}
                    disabled={!hasContent}
                    className={`
                      flex items-center space-x-2 px-4 py-3 border-b-2 transition-all
                      ${isActive
                        ? 'border-purple-500 text-white bg-codestorm-darker'
                        : hasContent
                          ? 'border-transparent text-gray-400 hover:text-white hover:bg-codestorm-darker/50'
                          : 'border-transparent text-gray-600 cursor-not-allowed'
                      }
                    `}
                  >
                    {getFileIcon(tab)}
                    <span className="font-medium uppercase">{tab}</span>
                    <span className="text-xs bg-codestorm-blue/20 px-1.5 py-0.5 rounded">
                      {tab === 'html' ? stats.html.lines : tab === 'css' ? stats.css.lines : stats.js.lines} líneas
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Code Actions */}
            <div className="bg-codestorm-dark p-2 border-b border-gray-700 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>Archivo: {activeCodeTab.toUpperCase()}</span>
                <span>•</span>
                <span>{getActiveCodeContent().split('\n').length} líneas</span>
                <span>•</span>
                <span>{getActiveCodeContent().length} caracteres</span>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => copyToClipboard(activeCodeTab)}
                  className="flex items-center space-x-1 px-2 py-1 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
                >
                  {copyStatus[activeCodeTab] ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="text-xs">Copiar</span>
                </button>

                <button
                  onClick={() => downloadFile(activeCodeTab)}
                  className="flex items-center space-x-1 px-2 py-1 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
                >
                  <Download className="h-4 w-4" />
                  <span className="text-xs">Descargar</span>
                </button>
              </div>
            </div>

            {/* Code Display */}
            <div className="flex-1 overflow-auto">
              {getActiveCodeContent() ? (
                <SyntaxHighlighter
                  language={getLanguage(activeCodeTab)}
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
                  {getActiveCodeContent()}
                </SyntaxHighlighter>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="flex flex-col items-center space-y-2">
                    <Code className="h-12 w-12 opacity-30" />
                    <p>No hay contenido {activeCodeTab.toUpperCase()} generado</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebAIResultsPanel;
