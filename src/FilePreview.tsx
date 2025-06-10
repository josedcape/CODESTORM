import React, { useState } from 'react';
import { 
  FileText, 
  Code, 
  Eye, 
  Download, 
  Copy, 
  Maximize2, 
  Minimize2,
  Search,
  RotateCcw,
  Save
} from 'lucide-react';
import { ProjectStructure } from '../../pages/Agent';

interface FilePreviewProps {
  file: ProjectStructure | null;
  onClose: () => void;
  onSave?: (content: string) => void;
  isEditable?: boolean;
}

const FilePreview: React.FC<FilePreviewProps> = ({ 
  file, 
  onClose, 
  onSave, 
  isEditable = false 
}) => {
  const [content, setContent] = useState(file?.content || '');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModified, setIsModified] = useState(false);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setIsModified(newContent !== file?.content);
  };

  const handleSave = () => {
    if (onSave && isModified) {
      onSave(content);
      setIsModified(false);
    }
  };

  const handleReset = () => {
    setContent(file?.content || '');
    setIsModified(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      // Aquí podrías mostrar una notificación de éxito
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
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

  const getLanguageForHighlighting = (filename: string): string => {
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
        return 'text';
    }
  };

  const highlightSearchTerm = (text: string, term: string): string => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-300 text-black">$1</mark>');
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
          <p>Selecciona un archivo para ver su contenido</p>
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
                {file.language && <span className="capitalize">{file.language}</span>}
                {isModified && <span className="text-yellow-400">• Modificado</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="pl-8 pr-3 py-1 text-sm bg-codestorm-dark border border-codestorm-blue/30 rounded text-white placeholder-gray-400 focus:outline-none focus:border-codestorm-accent"
              />
            </div>

            {/* Botones de acción */}
            <button
              onClick={copyToClipboard}
              className="p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded transition-colors"
              title="Copiar contenido"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={downloadFile}
              className="p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded transition-colors"
              title="Descargar archivo"
            >
              <Download className="w-4 h-4" />
            </button>

            {isEditable && isModified && (
              <>
                <button
                  onClick={handleReset}
                  className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 rounded transition-colors"
                  title="Deshacer cambios"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={handleSave}
                  className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded transition-colors"
                  title="Guardar cambios"
                >
                  <Save className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded transition-colors"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {!isFullscreen && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded transition-colors"
                title="Cerrar"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido del archivo */}
      <div className={`${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-96'} overflow-auto custom-scrollbar`}>
        {isEditable ? (
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="w-full h-full p-4 bg-transparent text-gray-300 font-mono text-sm resize-none focus:outline-none"
            style={{ minHeight: '100%' }}
          />
        ) : (
          <div className="p-4">
            <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap">
              <code
                dangerouslySetInnerHTML={{
                  __html: highlightSearchTerm(content, searchTerm)
                }}
              />
            </pre>
          </div>
        )}
      </div>

      {/* Footer con información adicional */}
      <div className="p-3 border-t border-codestorm-blue/30 bg-codestorm-darker">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Líneas: {content.split('\n').length}</span>
            <span>Caracteres: {content.length}</span>
            {file.lastModified && (
              <span>
                Modificado: {new Date(file.lastModified).toLocaleDateString('es-ES')}
              </span>
            )}
          </div>
          
          {isEditable && (
            <div className="flex items-center space-x-2">
              <span className={isModified ? 'text-yellow-400' : 'text-green-400'}>
                {isModified ? 'Sin guardar' : 'Guardado'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreview;
