import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Loader, Copy, Save, Download, Check, AlertTriangle } from 'lucide-react';

interface CodeEditorProps {
  content: string;
  language: string;
  path: string | null;
  onChange: (newContent: string) => void;
  readOnly?: boolean;
  onSave?: (content: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  content,
  language,
  path,
  onChange,
  readOnly = false,
  onSave
}) => {
  const [value, setValue] = useState(content);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Actualizar el valor cuando cambia el contenido
  useEffect(() => {
    setValue(content);
    setHasChanges(false);
  }, [content]);

  // Manejar cambios en el editor
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setValue(value);
      onChange(value);
      setHasChanges(value !== content);
    }
  };

  // Función para copiar el código al portapapeles
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Función para guardar el código
  const handleSave = () => {
    if (onSave) {
      onSave(value);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      setHasChanges(false);
    }
  };

  // Función para descargar el código como archivo
  const handleDownload = () => {
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = path ? path.split('/').pop() || 'code.txt' : 'code.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2000);
  };

  return (
    <div className="flex flex-col h-full border rounded-lg shadow-md bg-codestorm-dark border-codestorm-blue/30">
      <div className="flex items-center justify-between p-3 border-b border-codestorm-blue/30">
        <div className="flex items-center">
          <h2 className="text-sm font-medium text-white">
            {path ? path : 'Editor de Código'}
          </h2>
          {hasChanges && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
              Modificado
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title="Copiar código"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          {onSave && (
            <button
              onClick={handleSave}
              className={`p-1.5 rounded ${
                hasChanges
                  ? 'text-yellow-400 hover:bg-yellow-500/20'
                  : 'text-gray-400 hover:bg-codestorm-blue/20 hover:text-white'
              }`}
              title="Guardar cambios"
              disabled={!hasChanges}
            >
              {isSaved ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            onClick={handleDownload}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title="Descargar archivo"
          >
            {isDownloaded ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            readOnly,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
            lineNumbers: 'on',
            tabSize: 2,
            insertSpaces: true,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            contextmenu: true,
            folding: true,
            showFoldingControls: 'always',
            formatOnPaste: true,
            formatOnType: true,
            renderLineHighlight: 'all',
            renderWhitespace: 'none',
            renderIndentGuides: true,
            colorDecorators: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            quickSuggestions: true,
            quickSuggestionsDelay: 100,
            parameterHints: { enabled: true },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoIndent: 'full',
            autoSurround: 'languageDefined',
            codeLens: true,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 12,
              horizontalScrollbarSize: 12,
              alwaysConsumeMouseWheel: false
            }
          }}
          loading={<Loader className="w-8 h-8 text-codestorm-accent animate-spin" />}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
