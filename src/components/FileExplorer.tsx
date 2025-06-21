import React, { useState, useEffect } from 'react';
import { FileItem } from '../types';
import { Folder, File, Plus, FolderPlus, RefreshCw, Check, Download, Copy, AlertCircle } from 'lucide-react';

interface FileExplorerProps {
  files: FileItem[];
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, selectedFileId, onSelectFile }) => {
  const [showSyncMessage, setShowSyncMessage] = useState(false);
  const [fileCount, setFileCount] = useState(files.length);
  const [actionStatus, setActionStatus] = useState<{
    fileId: string | null;
    action: 'copy' | 'download' | null;
    status: 'success' | 'error' | null;
  }>({ fileId: null, action: null, status: null });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Efecto para detectar cambios en los archivos
  useEffect(() => {
    if (files.length !== fileCount) {
      setFileCount(files.length);
      setShowSyncMessage(true);

      // Ocultar el mensaje después de 3 segundos
      const timer = setTimeout(() => {
        setShowSyncMessage(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [files, fileCount]);

  // Función para manejar el botón de actualización
  const handleRefresh = () => {
    setShowSyncMessage(true);

    // Ocultar el mensaje después de 3 segundos
    setTimeout(() => {
      setShowSyncMessage(false);
    }, 3000);
  };

  // Función para copiar el contenido de un archivo al portapapeles
  const copyFileContent = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation(); // Evitar que se seleccione el archivo

    const file = files.find(f => f.id === fileId);
    if (!file) return;

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
        setActionStatus({ fileId, action: 'copy', status: 'success' });
        setStatusMessage(`Archivo ${file.name} copiado al portapapeles`);
        setTimeout(() => {
          setActionStatus({ fileId: null, action: null, status: null });
          setStatusMessage(null);
        }, 2000);
      } else {
        // Intentar con la API moderna si el método antiguo falla
        navigator.clipboard.writeText(file.content).then(() => {
          setActionStatus({ fileId, action: 'copy', status: 'success' });
          setStatusMessage(`Archivo ${file.name} copiado al portapapeles`);
          setTimeout(() => {
            setActionStatus({ fileId: null, action: null, status: null });
            setStatusMessage(null);
          }, 2000);
        }).catch(err => {
          console.error('Error al copiar al portapapeles:', err);
          setActionStatus({ fileId, action: 'copy', status: 'error' });
          setStatusMessage('No se pudo copiar al portapapeles');
          setTimeout(() => {
            setActionStatus({ fileId: null, action: null, status: null });
            setStatusMessage(null);
          }, 3000);
        });
      }
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
      setActionStatus({ fileId, action: 'copy', status: 'error' });
      setStatusMessage('No se pudo copiar al portapapeles');
      setTimeout(() => {
        setActionStatus({ fileId: null, action: null, status: null });
        setStatusMessage(null);
      }, 3000);
    }
  };

  // Función para descargar un archivo
  const downloadFile = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation(); // Evitar que se seleccione el archivo

    const file = files.find(f => f.id === fileId);
    if (!file) return;

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

      setActionStatus({ fileId, action: 'download', status: 'success' });
      setStatusMessage(`Archivo ${fileName} descargado`);
      setTimeout(() => {
        setActionStatus({ fileId: null, action: null, status: null });
        setStatusMessage(null);
      }, 2000);
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      setActionStatus({ fileId, action: 'download', status: 'error' });
      setStatusMessage('No se pudo descargar el archivo');
      setTimeout(() => {
        setActionStatus({ fileId: null, action: null, status: null });
        setStatusMessage(null);
      }, 3000);
    }
  };

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md h-full border border-codestorm-blue/30 flex flex-col relative">
      <div className="bg-codestorm-blue/20 p-3 border-b border-codestorm-blue/30 flex justify-between items-center">
        <h2 className="text-sm font-medium text-white">Explorador</h2>

        {/* Mensaje de sincronización */}
        {showSyncMessage && (
          <div className="flex items-center text-green-400 text-xs animate-pulse">
            <Check className="h-3 w-3 mr-1" />
            <span>Sincronizado</span>
          </div>
        )}
      </div>

      {/* Mensaje de estado para acciones de archivo */}
      {statusMessage && (
        <div
          className={`absolute top-12 right-2 px-3 py-1.5 rounded-md shadow-lg text-white text-xs z-10 transition-opacity duration-300 ${
            actionStatus.status === 'success' ? 'bg-green-500/80' : 'bg-red-500/80'
          }`}
        >
          {statusMessage}
        </div>
      )}

      <div className="p-2 flex space-x-2 border-b border-codestorm-blue/30">
        <button
          className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
          title="Nuevo archivo"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
          title="Nueva carpeta"
        >
          <FolderPlus className="h-4 w-4" />
        </button>
        <button
          className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
          onClick={handleRefresh}
          title="Actualización automática activada"
        >
          <RefreshCw className={`h-4 w-4 ${showSyncMessage ? 'text-green-400' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        <div className="mb-2">
          <div className="flex items-center text-codestorm-gold mb-1">
            <Folder className="h-4 w-4 mr-1" />
            <span className="text-sm">proyecto</span>
          </div>
          <ul className="pl-4">
            {files.map((file) => (
              <li
                key={file.id}
                className={`flex items-center justify-between py-1 px-2 rounded-md cursor-pointer ${
                  selectedFileId === file.id
                    ? 'bg-codestorm-blue text-white'
                    : 'text-gray-300 hover:bg-codestorm-blue/10'
                }`}
                onClick={() => onSelectFile(file.id)}
              >
                <div className="flex items-center overflow-hidden">
                  <File className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-sm truncate">{file.name}</span>
                </div>
                <div className="flex space-x-1 ml-2">
                  <button
                    className={`p-1 rounded ${
                      actionStatus.fileId === file.id && actionStatus.action === 'copy'
                        ? actionStatus.status === 'success'
                          ? 'text-green-400'
                          : 'text-red-400'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="Copiar contenido"
                    onClick={(e) => copyFileContent(e, file.id)}
                  >
                    {actionStatus.fileId === file.id && actionStatus.action === 'copy' ? (
                      actionStatus.status === 'success' ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5" />
                      )
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    className={`p-1 rounded ${
                      actionStatus.fileId === file.id && actionStatus.action === 'download'
                        ? actionStatus.status === 'success'
                          ? 'text-green-400'
                          : 'text-red-400'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="Descargar archivo"
                    onClick={(e) => downloadFile(e, file.id)}
                  >
                    {actionStatus.fileId === file.id && actionStatus.action === 'download' ? (
                      actionStatus.status === 'success' ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5" />
                      )
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;
