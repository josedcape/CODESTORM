import React, { useState, useEffect } from 'react';
import { FileItem } from '../types';
import { Folder, File, Plus, FolderPlus, RefreshCw, Check } from 'lucide-react';

interface FileExplorerProps {
  files: FileItem[];
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, selectedFileId, onSelectFile }) => {
  const [showSyncMessage, setShowSyncMessage] = useState(false);
  const [fileCount, setFileCount] = useState(files.length);

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

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md h-full border border-codestorm-blue/30 flex flex-col">
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
                className={`flex items-center py-1 px-2 rounded-md cursor-pointer ${
                  selectedFileId === file.id
                    ? 'bg-codestorm-blue text-white'
                    : 'text-gray-300 hover:bg-codestorm-blue/10'
                }`}
                onClick={() => onSelectFile(file.id)}
              >
                <File className="h-4 w-4 mr-2" />
                <span className="text-sm">{file.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;
