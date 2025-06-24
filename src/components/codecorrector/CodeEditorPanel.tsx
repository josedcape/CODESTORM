import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CodeError } from '../../types';
import { AlertCircle, Copy, Download, Trash, RotateCcw } from 'lucide-react';

interface CodeEditorPanelProps {
  code: string;
  language: string;
  errors?: CodeError[];
  onCodeChange: (code: string) => void;
  readOnly?: boolean;
  title?: string;
}

const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({
  code,
  language,
  errors = [],
  onCodeChange,
  readOnly = false,
  title = 'Código a corregir'
}) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [localCode, setLocalCode] = useState(code);

  useEffect(() => {
    setLocalCode(code);
  }, [code]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setLocalCode(newCode);
    onCodeChange(newCode);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(localCode);
      setCopyStatus('success');
      setStatusMessage('Código copiado al portapapeles');
      setTimeout(() => {
        setCopyStatus('idle');
        setStatusMessage(null);
      }, 2000);
    } catch (error) {
      setCopyStatus('error');
      setStatusMessage('Error al copiar el código');
      setTimeout(() => {
        setCopyStatus('idle');
        setStatusMessage(null);
      }, 2000);
    }
  };

  const downloadCode = () => {
    try {
      const fileExtension = language === 'javascript' ? 'js' : 
                           language === 'typescript' ? 'ts' :
                           language === 'python' ? 'py' :
                           language === 'java' ? 'java' :
                           language === 'csharp' ? 'cs' :
                           language === 'html' ? 'html' :
                           language === 'css' ? 'css' : 'txt';
      
      const fileName = `code.${fileExtension}`;
      const blob = new Blob([localCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setStatusMessage('Código descargado correctamente');
      setTimeout(() => setStatusMessage(null), 2000);
    } catch (error) {
      setStatusMessage('Error al descargar el código');
      setTimeout(() => setStatusMessage(null), 2000);
    }
  };

  const clearCode = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar todo el código?')) {
      setLocalCode('');
      onCodeChange('');
    }
  };

  const resetCode = () => {
    if (window.confirm('¿Estás seguro de que quieres restablecer el código original?')) {
      setLocalCode(code);
      onCodeChange(code);
    }
  };

  // Renderizar marcadores de error si hay errores
  const renderErrorMarkers = () => {
    if (!errors || errors.length === 0) return null;

    return (
      <div className="absolute right-0 top-0 bottom-0 w-6 z-10">
        {errors.map((error) => {
          // Calcular la posición vertical del marcador basada en la línea del error
          const totalLines = localCode.split('\n').length;
          const position = ((error.lineStart / totalLines) * 100);
          
          return (
            <div 
              key={error.id}
              className={`absolute right-1 w-4 h-4 rounded-full cursor-pointer transform -translate-y-1/2 ${
                error.severity === 'critical' ? 'bg-red-500' :
                error.severity === 'high' ? 'bg-orange-500' :
                error.severity === 'medium' ? 'bg-yellow-500' :
                error.severity === 'low' ? 'bg-blue-500' : 'bg-gray-500'
              }`}
              style={{ top: `${position}%` }}
              title={error.message}
            >
              <AlertCircle className="h-4 w-4 text-white" />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md h-full flex flex-col border border-codestorm-blue/30 overflow-hidden relative">
      <div className="flex items-center justify-between bg-codestorm-blue/20 p-2 border-b border-codestorm-blue/30">
        <div className="flex items-center">
          <span className="font-medium text-sm text-white">{title}</span>
        </div>
        <div className="flex space-x-1">
          <button
            className="p-1.5 rounded-md hover:bg-codestorm-blue/30 transition-colors text-gray-400 hover:text-white"
            title="Copiar al portapapeles"
            onClick={copyToClipboard}
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            className="p-1.5 rounded-md hover:bg-codestorm-blue/30 transition-colors text-gray-400 hover:text-white"
            title="Descargar código"
            onClick={downloadCode}
          >
            <Download className="h-4 w-4" />
          </button>
          {!readOnly && (
            <>
              <button
                className="p-1.5 rounded-md hover:bg-codestorm-blue/30 transition-colors text-gray-400 hover:text-white"
                title="Limpiar código"
                onClick={clearCode}
              >
                <Trash className="h-4 w-4" />
              </button>
              <button
                className="p-1.5 rounded-md hover:bg-codestorm-blue/30 transition-colors text-gray-400 hover:text-white"
                title="Restablecer código"
                onClick={resetCode}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto relative">
        {renderErrorMarkers()}
        
        {readOnly ? (
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: '#0a1120',
              minHeight: '100%',
              borderRadius: 0,
            }}
            showLineNumbers
            wrapLines
            lineProps={(lineNumber) => {
              const lineError = errors.find(
                error => lineNumber >= error.lineStart && lineNumber <= error.lineEnd
              );
              
              if (lineError) {
                return {
                  style: { 
                    display: 'block',
                    backgroundColor: lineError.severity === 'critical' ? 'rgba(220, 38, 38, 0.2)' :
                                    lineError.severity === 'high' ? 'rgba(249, 115, 22, 0.2)' :
                                    lineError.severity === 'medium' ? 'rgba(234, 179, 8, 0.2)' :
                                    lineError.severity === 'low' ? 'rgba(59, 130, 246, 0.2)' : 
                                    'rgba(107, 114, 128, 0.2)',
                    borderLeft: lineError.severity === 'critical' ? '3px solid rgb(220, 38, 38)' :
                              lineError.severity === 'high' ? '3px solid rgb(249, 115, 22)' :
                              lineError.severity === 'medium' ? '3px solid rgb(234, 179, 8)' :
                              lineError.severity === 'low' ? '3px solid rgb(59, 130, 246)' : 
                              '3px solid rgb(107, 114, 128)',
                  }
                };
              }
              return {};
            }}
          >
            {localCode}
          </SyntaxHighlighter>
        ) : (
          <textarea
            value={localCode}
            onChange={handleCodeChange}
            className="w-full h-full bg-codestorm-darker text-white font-mono p-4 resize-none focus:outline-none"
            placeholder="Pega aquí tu código..."
            spellCheck={false}
            style={{ minHeight: '300px' }}
          />
        )}
      </div>
      
      {statusMessage && (
        <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-md text-white text-sm ${
          copyStatus === 'success' ? 'bg-green-600' : 
          copyStatus === 'error' ? 'bg-red-600' : 
          'bg-blue-600'
        }`}>
          {statusMessage}
        </div>
      )}
    </div>
  );
};

export default CodeEditorPanel;
