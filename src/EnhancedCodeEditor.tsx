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
  EyeOff
} from 'lucide-react';
import { ProjectStructure } from '../../pages/Agent';

// Monaco Editor will be loaded dynamically to avoid SSR issues
let MonacoEditor: any = null;

interface EnhancedCodeEditorProps {
  file: ProjectStructure | null;
  onSave: (content: string) => void;
  onClose: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const EnhancedCodeEditor: React.FC<EnhancedCodeEditorProps> = ({
  file,
  onSave,
  onClose,
  isFullscreen = false,
  onToggleFullscreen
}) => {
  const [content, setContent] = useState(file?.content || '');
  const [originalContent, setOriginalContent] = useState(file?.content || '');
  const [isModified, setIsModified] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState('vs-dark');
  
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
        // Fallback to basic textarea if Monaco fails to load
        setIsEditorReady(true);
      }
    };

    loadMonaco();
  }, []);

  // Update content when file changes
  useEffect(() => {
    if (file?.content !== undefined) {
      setContent(file.content);
      setOriginalContent(file.content);
      setIsModified(false);
    }
  }, [file]);

  const handleContentChange = (value: string | undefined) => {
    const newContent = value || '';
    setContent(newContent);
    setIsModified(newContent !== originalContent);
  };

  const handleSave = () => {
    onSave(content);
    setOriginalContent(content);
    setIsModified(false);
  };

  const handleReset = () => {
    setContent(originalContent);
    setIsModified(false);
  };

  const handleSearch = () => {
    if (editorRef.current && searchTerm) {
      const editor = editorRef.current;
      editor.trigger('', 'actions.find', {
        searchString: searchTerm,
        replaceString: replaceTerm,
        isRegex: false,
        matchCase: false,
        matchWholeWord: false
      });
    }
  };

  const handleReplace = () => {
    if (editorRef.current && searchTerm && replaceTerm) {
      const editor = editorRef.current;
      const model = editor.getModel();
      if (model) {
        const newContent = model.getValue().replace(new RegExp(searchTerm, 'g'), replaceTerm);
        setContent(newContent);
        setIsModified(newContent !== originalContent);
      }
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const downloadFile = () => {
    if (!file) return;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLanguage = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'scss':
      case 'sass':
        return 'scss';
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
      case 'xml':
        return 'xml';
      case 'yaml':
      case 'yml':
        return 'yaml';
      default:
        return 'plaintext';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!file) {
    return (
      <div className="bg-codestorm-dark rounded-lg p-6">
        <div className="text-center text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a file to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-codestorm-dark rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      {/* Header */}
      <div className="p-4 border-b border-codestorm-blue/30 bg-codestorm-darker">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Code className="w-5 h-5 text-codestorm-accent" />
            <div>
              <h3 className="font-semibold text-white">{file.name}</h3>
              <div className="text-xs text-gray-400 flex items-center space-x-4">
                <span>{file.path}</span>
                {file.size && <span>{formatFileSize(file.size)}</span>}
                <span className="capitalize">{getLanguage(file.name)}</span>
                {isModified && <span className="text-yellow-400">• Modified</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search Toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded transition-colors ${showSearch ? 'bg-codestorm-accent text-white' : 'text-gray-400 hover:text-white hover:bg-codestorm-blue/20'}`}
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Settings */}
            <div className="relative group">
              <button className="p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded transition-colors">
                <Settings className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 bg-codestorm-darker border border-codestorm-blue/30 rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-48">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Line Numbers</span>
                    <button
                      onClick={() => setShowLineNumbers(!showLineNumbers)}
                      className={`p-1 rounded ${showLineNumbers ? 'text-green-400' : 'text-gray-400'}`}
                    >
                      {showLineNumbers ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Word Wrap</span>
                    <button
                      onClick={() => setWordWrap(!wordWrap)}
                      className={`px-2 py-1 text-xs rounded ${wordWrap ? 'bg-codestorm-accent text-white' : 'bg-gray-600 text-gray-300'}`}
                    >
                      {wordWrap ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Font Size</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                        className="px-1 py-0.5 text-xs bg-gray-600 text-white rounded"
                      >
                        -
                      </button>
                      <span className="text-xs text-gray-300 w-6 text-center">{fontSize}</span>
                      <button
                        onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                        className="px-1 py-0.5 text-xs bg-gray-600 text-white rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <button
              onClick={copyToClipboard}
              className="p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded transition-colors"
              title="Copy content"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={downloadFile}
              className="p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>

            {isModified && (
              <>
                <button
                  onClick={handleReset}
                  className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 rounded transition-colors"
                  title="Reset changes"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={handleSave}
                  className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded transition-colors"
                  title="Save changes"
                >
                  <Save className="w-4 h-4" />
                </button>
              </>
            )}

            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded transition-colors"
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded transition-colors"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Search/Replace Panel */}
        {showSearch && (
          <div className="mt-4 p-3 bg-codestorm-dark rounded border border-codestorm-blue/30">
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="flex-1 px-3 py-1 text-sm bg-codestorm-darker border border-codestorm-blue/30 rounded text-white placeholder-gray-400 focus:outline-none focus:border-codestorm-accent"
              />
              <button
                onClick={handleSearch}
                className="px-3 py-1 text-sm bg-codestorm-accent text-white rounded hover:bg-blue-600 transition-colors"
              >
                Find
              </button>
              <button
                onClick={() => setShowReplace(!showReplace)}
                className={`px-3 py-1 text-sm rounded transition-colors ${showReplace ? 'bg-yellow-500 text-white' : 'bg-gray-600 text-gray-300'}`}
              >
                Replace
              </button>
            </div>
            
            {showReplace && (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={replaceTerm}
                  onChange={(e) => setReplaceTerm(e.target.value)}
                  placeholder="Replace with..."
                  className="flex-1 px-3 py-1 text-sm bg-codestorm-darker border border-codestorm-blue/30 rounded text-white placeholder-gray-400 focus:outline-none focus:border-codestorm-accent"
                />
                <button
                  onClick={handleReplace}
                  className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                >
                  Replace All
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className={`${isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-96'}`}>
        {isEditorReady && MonacoEditor ? (
          <MonacoEditor
            height="100%"
            language={getLanguage(file.name)}
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

      {/* Footer */}
      <div className="p-3 border-t border-codestorm-blue/30 bg-codestorm-darker">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Lines: {content.split('\n').length}</span>
            <span>Characters: {content.length}</span>
            <span>Language: {getLanguage(file.name)}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={isModified ? 'text-yellow-400' : 'text-green-400'}>
              {isModified ? 'Unsaved changes' : 'Saved'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCodeEditor;
