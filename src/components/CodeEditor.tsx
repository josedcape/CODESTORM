import React, { useState } from 'react';
import { FileItem } from '../types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Save, Copy, Download, ArrowLeft, Check, AlertCircle } from 'lucide-react';

interface CodeEditorProps {
  file: FileItem | null;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ file }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!file) {
    return (
      <div className="bg-codestorm-dark rounded-lg shadow-md p-4 h-full flex items-center justify-center border border-codestorm-blue/30">
        <p className="text-gray-500">Selecciona un archivo para ver su contenido</p>
      </div>
    );
  }

  // Función para copiar al portapapeles
  const copyToClipboard = () => {
    try {
      // Método alternativo para copiar al portapapeles
      const textArea = document.createElement('textarea');
      textArea.value = file.content;
      textArea.style.position = 'fixed';  // Evita desplazamiento
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        setCopyStatus('success');
        setStatusMessage('Código copiado al portapapeles');
        setTimeout(() => {
          setCopyStatus('idle');
          setStatusMessage(null);
        }, 2000);
      } else {
        // Intentar con la API moderna si el método antiguo falla
        navigator.clipboard.writeText(file.content).then(() => {
          setCopyStatus('success');
          setStatusMessage('Código copiado al portapapeles');
          setTimeout(() => {
            setCopyStatus('idle');
            setStatusMessage(null);
          }, 2000);
        }).catch(err => {
          console.error('Error al copiar al portapapeles:', err);
          setCopyStatus('error');
          setStatusMessage('No se pudo copiar al portapapeles');
          setTimeout(() => {
            setCopyStatus('idle');
            setStatusMessage(null);
          }, 3000);
        });
      }
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
      setCopyStatus('error');
      setStatusMessage('No se pudo copiar al portapapeles');
      setTimeout(() => {
        setCopyStatus('idle');
        setStatusMessage(null);
      }, 3000);
    }
  };

  // Función para guardar el archivo
  const saveFile = () => {
    try {
      // Crear un elemento <a> temporal
      const element = document.createElement('a');
      const fileContent = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(fileContent);

      // Extraer el nombre del archivo de la ruta
      const fileName = file.path.split('/').pop() || file.name;
      element.download = fileName;

      // Añadir al DOM, hacer clic y luego eliminar
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      // Liberar el objeto URL
      setTimeout(() => {
        URL.revokeObjectURL(element.href);
      }, 100);

      setSaveStatus('success');
      setStatusMessage(`Archivo ${fileName} guardado`);
      setTimeout(() => {
        setSaveStatus('idle');
        setStatusMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Error al guardar el archivo:', error);
      setSaveStatus('error');
      setStatusMessage('No se pudo guardar el archivo');
      setTimeout(() => {
        setSaveStatus('idle');
        setStatusMessage(null);
      }, 3000);
    }
  };

  // Función para descargar el archivo
  const downloadFile = () => {
    try {
      // Crear un elemento <a> temporal
      const element = document.createElement('a');
      const fileContent = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(fileContent);

      // Extraer el nombre del archivo de la ruta
      const fileName = file.path.split('/').pop() || file.name;
      element.download = fileName;

      // Añadir al DOM, hacer clic y luego eliminar
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      // Liberar el objeto URL
      setTimeout(() => {
        URL.revokeObjectURL(element.href);
      }, 100);

      setDownloadStatus('success');
      setStatusMessage(`Archivo ${fileName} descargado`);
      setTimeout(() => {
        setDownloadStatus('idle');
        setStatusMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      setDownloadStatus('error');
      setStatusMessage('No se pudo descargar el archivo');
      setTimeout(() => {
        setDownloadStatus('idle');
        setStatusMessage(null);
      }, 3000);
    }
  };

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md h-full flex flex-col border border-codestorm-blue/30 overflow-hidden relative">
      <div className="flex items-center justify-between bg-codestorm-blue/20 p-2 border-b border-codestorm-blue/30">
        <div className="flex items-center">
          <ArrowLeft className="h-4 w-4 text-gray-400 mr-2" />
          <span className="font-medium text-sm text-white">{file.name}</span>
          <span className="ml-2 text-xs text-gray-400">{file.path}</span>
        </div>
        <div className="flex space-x-1">
          <button
            className={`p-1.5 rounded-md hover:bg-codestorm-blue/30 transition-colors ${
              saveStatus === 'idle' ? 'text-gray-400 hover:text-white' :
              saveStatus === 'success' ? 'text-green-400' : 'text-red-400'
            }`}
            title="Guardar archivo"
            onClick={saveFile}
          >
            {saveStatus === 'success' ? (
              <Check className="h-4 w-4" />
            ) : saveStatus === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </button>
          <button
            className={`p-1.5 rounded-md hover:bg-codestorm-blue/30 transition-colors ${
              copyStatus === 'idle' ? 'text-gray-400 hover:text-white' :
              copyStatus === 'success' ? 'text-green-400' : 'text-red-400'
            }`}
            title="Copiar al portapapeles"
            onClick={copyToClipboard}
          >
            {copyStatus === 'success' ? (
              <Check className="h-4 w-4" />
            ) : copyStatus === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <button
            className={`p-1.5 rounded-md hover:bg-codestorm-blue/30 transition-colors ${
              downloadStatus === 'idle' ? 'text-gray-400 hover:text-white' :
              downloadStatus === 'success' ? 'text-green-400' : 'text-red-400'
            }`}
            title="Descargar archivo"
            onClick={downloadFile}
          >
            {downloadStatus === 'success' ? (
              <Check className="h-4 w-4" />
            ) : downloadStatus === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}
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

      {/* Mensaje de estado */}
      {statusMessage && (
        <div
          className={`absolute bottom-4 right-4 px-4 py-2 rounded-md shadow-lg text-white text-sm transition-opacity duration-300 ${
            copyStatus === 'success' || saveStatus === 'success' || downloadStatus === 'success'
              ? 'bg-green-500/80'
              : 'bg-red-500/80'
          }`}
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
