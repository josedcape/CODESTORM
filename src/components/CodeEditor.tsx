import React from 'react';
import { FileItem } from '../types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Save, Copy, Download, ArrowLeft } from 'lucide-react';

interface CodeEditorProps {
  file: FileItem | null;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ file }) => {
  if (!file) {
    return (
      <div className="bg-codestorm-dark rounded-lg shadow-md p-4 h-full flex items-center justify-center border border-codestorm-blue/30">
        <p className="text-gray-500">Selecciona un archivo para ver su contenido</p>
      </div>
    );
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(file.content);
  };

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md h-full flex flex-col border border-codestorm-blue/30 overflow-hidden">
      <div className="flex items-center justify-between bg-codestorm-blue/20 p-2 border-b border-codestorm-blue/30">
        <div className="flex items-center">
          <ArrowLeft className="h-4 w-4 text-gray-400 mr-2" />
          <span className="font-medium text-sm text-white">{file.name}</span>
          <span className="ml-2 text-xs text-gray-400">{file.path}</span>
        </div>
        <div className="flex space-x-1">
          <button 
            className="p-1.5 rounded-md hover:bg-codestorm-blue/30 transition-colors text-gray-400 hover:text-white"
            title="Guardar"
          >
            <Save className="h-4 w-4" />
          </button>
          <button 
            className="p-1.5 rounded-md hover:bg-codestorm-blue/30 transition-colors text-gray-400 hover:text-white"
            title="Copiar al portapapeles"
            onClick={copyToClipboard}
          >
            <Copy className="h-4 w-4" />
          </button>
          <button 
            className="p-1.5 rounded-md hover:bg-codestorm-blue/30 transition-colors text-gray-400 hover:text-white"
            title="Descargar archivo"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          language={file.language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: '#0a1120',
            minHeight: '100%',
            borderRadius: 0,
          }}
          showLineNumbers
        >
          {file.content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeEditor;
