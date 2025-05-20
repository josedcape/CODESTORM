import React from 'react';
import { FileItem } from '../types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Save, Copy, Download } from 'lucide-react';

interface CodeEditorProps {
  file: FileItem | null;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ file }) => {
  if (!file) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 h-full flex items-center justify-center">
        <p className="text-gray-500">Select a file to view its content</p>
      </div>
    );
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(file.content);
  };

  return (
    <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center">
          <span className="font-medium">{file.name}</span>
          <span className="ml-2 text-xs text-gray-500">{file.path}</span>
        </div>
        <div className="flex space-x-2">
          <button 
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            title="Save"
          >
            <Save className="h-4 w-4 text-gray-600" />
          </button>
          <button 
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            title="Copy to clipboard"
            onClick={copyToClipboard}
          >
            <Copy className="h-4 w-4 text-gray-600" />
          </button>
          <button 
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            title="Download file"
          >
            <Download className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          language={file.language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            minHeight: '100%',
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