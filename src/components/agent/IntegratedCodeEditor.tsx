import React, { useState, useRef, useEffect } from 'react';
import { 
  Save, 
  Search, 
  Replace, 
  Maximize2, 
  Minimize2, 
  Copy, 
  Download,
  RotateCcw,
  FileText,
  Code,
  Settings,
  Eye,
  EyeOff,
  Tabs,
  SplitSquareHorizontal,
  Square,
  X,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  GitCompare
} from 'lucide-react';
import { FileItem } from '../../types';

// Monaco Editor will be loaded dynamically to avoid SSR issues
let MonacoEditor: any = null;

interface IntegratedCodeEditorProps {
  files: FileItem[];
  activeFile: FileItem | null;
  onFileSelect: (file: FileItem) => void;
  onFileSave: (file: FileItem, content: string) => void;
  onFileClose: (file: FileItem) => void;
  mode: 'single' | 'split' | 'tabs';
  onModeChange: (mode: 'single' | 'split' | 'tabs') => void;
  showOriginalComparison?: boolean;
  originalContent?: {[path: string]: string};
  onRefreshFiles?: () => void;
}

const IntegratedCodeEditor: React.FC<IntegratedCodeEditorProps> = ({
  files,
  activeFile,
  onFileSelect,
  onFileSave,
  onFileClose,
  mode,
  onModeChange,
  showOriginalComparison = false,
  originalContent = {},
  onRefreshFiles
}) => {
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [content, setContent] = useState('');
  const [isModified, setIsModified] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState('vs-dark');
  const [wordWrap, setWordWrap] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Load Monaco Editor dynamically
  useEffect(() => {
    const loadMonaco = async () => {
      try {
        const monaco = await import('@monaco-editor/react');
        MonacoEditor = monaco.default;
        setIsEditorReady(true);
      } catch (error) {
        console.error('Failed to load Monaco Editor:', error);
        setIsEditorReady(true);
      }
    };

    loadMonaco();
  }, []);

  // Update content when active file changes
  useEffect(() => {
    if (activeFile?.content !== undefined) {
      setContent(activeFile.content);
      setIsModified(false);
    }
  }, [activeFile]);

  const handleContentChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
      setIsModified(activeFile ? value !== activeFile.content : false);
    }
  };

  const handleSave = async () => {
    if (!activeFile || !isModified) return;

    setSaveStatus('saving');
    try {
      await onFileSave(activeFile, content);
      setIsModified(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleSearch = () => {
    if (editorRef.current && searchTerm) {
      editorRef.current.trigger('', 'actions.find');
    }
  };

  const handleReplace = () => {
    if (editorRef.current && searchTerm && replaceTerm) {
      const model = editorRef.current.getModel();
      if (model) {
        const matches = model.findMatches(searchTerm, false, false, false, null, false);
        matches.forEach((match: any) => {
          editorRef.current.executeEdits('replace', [{
            range: match.range,
            text: replaceTerm
          }]);
        });
      }
    }
  };

  const getLanguage = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'tsx':
      case 'jsx':
        return 'typescript';
      case 'ts':
        return 'typescript';
      case 'js':
        return 'javascript';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cpp':
      case 'c':
        return 'cpp';
      default:
        return 'plaintext';
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
  };

  const downloadFile = () => {
    if (!activeFile) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasChanges = (file: FileItem): boolean => {
    return originalContent[file.path] && originalContent[file.path] !== file.content;
  };

  if (!activeFile) {
    return (
      <div className="h-full flex items-center justify-center bg-codestorm-dark">
        <div className="text-center p-8">
          <Code className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-white mb-2">No hay archivos abiertos</h3>
          <p className="text-gray-400 mb-4">
            {files.length === 0 
              ? 'No hay archivos disponibles para editar'
              : 'Selecciona un archivo de la lista para comenzar a editar'
            }
          </p>
          {onRefreshFiles && (
            <button
              onClick={onRefreshFiles}
              className="px-4 py-2 bg-codestorm-accent text-white rounded hover:bg-codestorm-accent/80 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2 inline" />
              Actualizar archivos
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-codestorm-dark rounded-lg overflow-hidden h-full flex flex-col ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      {/* Header */}
      <div className="p-4 border-b border-codestorm-blue/30 bg-codestorm-darker">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Code className="w-5 h-5 text-codestorm-accent" />
            <div>
              <h3 className="font-semibold text-white flex items-center">
                {activeFile.name}
                {isModified && <span className="ml-2 w-2 h-2 bg-yellow-400 rounded-full"></span>}
                {hasChanges(activeFile) && <GitCompare className="ml-2 w-4 h-4 text-blue-400" />}
              </h3>
              <div className="text-xs text-gray-400 flex items-center space-x-4">
                <span>{activeFile.path}</span>
                <span className="capitalize">{getLanguage(activeFile.name)}</span>
                {isModified && <span className="text-yellow-400">• Modificado</span>}
                {saveStatus === 'saved' && <span className="text-green-400">• Guardado</span>}
                {saveStatus === 'saving' && <span className="text-blue-400">• Guardando...</span>}
                {saveStatus === 'error' && <span className="text-red-400">• Error al guardar</span>}
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center space-x-2">
            {/* Mode selector */}
            <div className="flex items-center space-x-1 mr-4">
              <button
                onClick={() => onModeChange('tabs')}
                className={`p-1.5 rounded ${mode === 'tabs' ? 'bg-codestorm-accent text-white' : 'text-gray-400 hover:text-white'}`}
                title="Vista de pestañas"
              >
                <Tabs className="w-4 h-4" />
              </button>
              <button
                onClick={() => onModeChange('split')}
                className={`p-1.5 rounded ${mode === 'split' ? 'bg-codestorm-accent text-white' : 'text-gray-400 hover:text-white'}`}
                title="Vista dividida"
              >
                <SplitSquareHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={() => onModeChange('single')}
                className={`p-1.5 rounded ${mode === 'single' ? 'bg-codestorm-accent text-white' : 'text-gray-400 hover:text-white'}`}
                title="Vista única"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>

            {/* Action buttons */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-1.5 rounded hover:bg-codestorm-blue/30 transition-colors ${showSearch ? 'text-codestorm-accent' : 'text-gray-400 hover:text-white'}`}
              title="Buscar"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={handleSave}
              disabled={!isModified || saveStatus === 'saving'}
              className={`p-1.5 rounded hover:bg-codestorm-blue/30 transition-colors ${
                isModified ? 'text-green-400 hover:text-green-300' : 'text-gray-400'
              } ${saveStatus === 'saving' ? 'animate-pulse' : ''}`}
              title="Guardar"
            >
              {saveStatus === 'saving' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : saveStatus === 'saved' ? (
                <CheckCircle className="w-4 h-4" />
              ) : saveStatus === 'error' ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={copyToClipboard}
              className="p-1.5 rounded hover:bg-codestorm-blue/30 transition-colors text-gray-400 hover:text-white"
              title="Copiar contenido"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={downloadFile}
              className="p-1.5 rounded hover:bg-codestorm-blue/30 transition-colors text-gray-400 hover:text-white"
              title="Descargar archivo"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded hover:bg-codestorm-blue/30 transition-colors text-gray-400 hover:text-white"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded hover:bg-codestorm-blue/30 transition-colors ${showSettings ? 'text-codestorm-accent' : 'text-gray-400 hover:text-white'}`}
              title="Configuración"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="mt-3 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-1 bg-codestorm-dark border border-codestorm-blue/30 rounded text-white text-sm focus:outline-none focus:border-codestorm-accent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <input
              type="text"
              placeholder="Reemplazar..."
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              className="flex-1 px-3 py-1 bg-codestorm-dark border border-codestorm-blue/30 rounded text-white text-sm focus:outline-none focus:border-codestorm-accent"
              onKeyPress={(e) => e.key === 'Enter' && handleReplace()}
            />
            <button
              onClick={handleSearch}
              className="px-3 py-1 bg-codestorm-accent text-white rounded text-sm hover:bg-codestorm-accent/80"
            >
              Buscar
            </button>
            <button
              onClick={handleReplace}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Reemplazar
            </button>
          </div>
        )}

        {/* Settings panel */}
        {showSettings && (
          <div className="mt-3 p-3 bg-codestorm-dark rounded border border-codestorm-blue/30">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-gray-400 mb-1">Tema</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full px-2 py-1 bg-codestorm-darker border border-codestorm-blue/30 rounded text-white"
                >
                  <option value="vs-dark">Oscuro</option>
                  <option value="light">Claro</option>
                  <option value="hc-black">Alto contraste</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Tamaño de fuente</label>
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-gray-400">{fontSize}px</span>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center text-gray-400">
                  <input
                    type="checkbox"
                    checked={wordWrap}
                    onChange={(e) => setWordWrap(e.target.checked)}
                    className="mr-2"
                  />
                  Ajuste de línea
                </label>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center text-gray-400">
                  <input
                    type="checkbox"
                    checked={showLineNumbers}
                    onChange={(e) => setShowLineNumbers(e.target.checked)}
                    className="mr-2"
                  />
                  Números de línea
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        {isEditorReady && MonacoEditor ? (
          <MonacoEditor
            height="100%"
            language={getLanguage(activeFile.name)}
            value={content}
            onChange={handleContentChange}
            theme={theme}
            options={{
              minimap: { enabled: isFullscreen },
              lineNumbers: showLineNumbers ? 'on' : 'off',
              wordWrap: wordWrap ? 'on' : 'off',
              fontSize: fontSize,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              renderWhitespace: 'selection',
              selectOnLineNumbers: true,
              roundedSelection: false,
              readOnly: false,
              cursorStyle: 'line',
              mouseWheelZoom: true,
              contextmenu: true,
              folding: true,
              foldingStrategy: 'auto',
              showFoldingControls: 'always',
              disableLayerHinting: true,
              enableSplitViewResizing: false,
              renderLineHighlight: 'all'
            }}
            onMount={(editor, monaco) => {
              editorRef.current = editor;
              monacoRef.current = monaco;
            }}
          />
        ) : (
          // Fallback textarea if Monaco fails to load
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="w-full h-full p-4 bg-codestorm-darker text-gray-300 font-mono text-sm resize-none focus:outline-none border-none"
            style={{ minHeight: '100%' }}
          />
        )}
      </div>
    </div>
  );
};

export default IntegratedCodeEditor;
