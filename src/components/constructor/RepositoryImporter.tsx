import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FolderOpen,
  FileText,
  Archive,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Download,
  Folder,
  File
} from 'lucide-react';
import {
  repositoryImportService,
  ImportedRepository,
  ImportProgress,
  DirectoryStructure,
  DirectoryNode
} from '../../services/RepositoryImportService';
import { FileItem } from '../../types';

interface RepositoryImporterProps {
  onRepositoryImported: (repository: ImportedRepository) => void;
  onClose: () => void;
  isOpen: boolean;
}

const RepositoryImporter: React.FC<RepositoryImporterProps> = ({
  onRepositoryImported,
  onClose,
  isOpen
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importedRepo, setImportedRepo] = useState<ImportedRepository | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manejar drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, []);

  // Manejar selección de archivo
  const handleFileSelection = async (file: File) => {
    if (!repositoryImportService.isSupportedFormat(file.name)) {
      setError(`Formato no soportado: ${file.name}. Formatos soportados: ${repositoryImportService.getSupportedFormats().join(', ')}`);
      return;
    }

    setError(null);
    setIsImporting(true);
    setImportProgress(null);
    setImportedRepo(null);

    try {
      const repository = await repositoryImportService.importRepository(
        file,
        (progress) => {
          setImportProgress(progress);
        }
      );

      setImportedRepo(repository);
      setIsImporting(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error importando repositorio');
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  // Manejar click en input de archivo
  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  // Confirmar importación
  const handleConfirmImport = () => {
    if (importedRepo) {
      onRepositoryImported(importedRepo);
      onClose();
    }
  };

  // Alternar expansión de carpetas
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  // Renderizar estructura de directorios
  const renderDirectoryStructure = (structure: DirectoryStructure, level = 0) => {
    return Object.entries(structure).map(([name, node]) => (
      <DirectoryItem
        key={node.path}
        node={node}
        level={level}
        isExpanded={expandedFolders.has(node.path)}
        onToggle={() => toggleFolder(node.path)}
      />
    ));
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-codestorm-dark border border-codestorm-blue/30 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-codestorm-blue/30">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-codestorm-accent/20">
              <Archive className="w-6 h-6 text-codestorm-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Importar Repositorio</h2>
              <p className="text-sm text-gray-400">Carga archivos comprimidos (ZIP, RAR, etc.)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!isImporting && !importedRepo && (
            <>
              {/* Zona de drop */}
              <div
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                  ${isDragOver
                    ? 'border-codestorm-accent bg-codestorm-accent/10'
                    : 'border-gray-600 hover:border-codestorm-blue'
                  }
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className={`p-4 rounded-full ${isDragOver ? 'bg-codestorm-accent/20' : 'bg-gray-700'}`}>
                    <Upload className={`w-8 h-8 ${isDragOver ? 'text-codestorm-accent' : 'text-gray-400'}`} />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      {isDragOver ? 'Suelta el archivo aquí' : 'Arrastra tu repositorio aquí'}
                    </h3>
                    <p className="text-gray-400 mb-4">
                      O haz clic para seleccionar un archivo
                    </p>
                    
                    <button
                      onClick={handleFileInputClick}
                      className="px-6 py-2 bg-codestorm-accent hover:bg-blue-600 text-white rounded-md transition-colors"
                    >
                      Seleccionar Archivo
                    </button>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,.rar,.7z,.tar,.tar.gz,.tgz"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              {/* Formatos soportados */}
              <div className="mt-6 p-4 bg-codestorm-darker rounded-lg">
                <h4 className="text-sm font-medium text-white mb-2">Formatos Soportados:</h4>
                <div className="flex flex-wrap gap-2">
                  {repositoryImportService.getSupportedFormats().map(format => (
                    <span
                      key={format}
                      className="px-2 py-1 bg-codestorm-blue/20 text-codestorm-accent text-xs rounded"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-red-400 font-medium">Error</h4>
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Progreso de importación */}
          {isImporting && importProgress && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-6 h-6 text-codestorm-accent animate-spin" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">
                      {importProgress.stage === 'reading' && 'Leyendo archivo...'}
                      {importProgress.stage === 'extracting' && 'Extrayendo archivos...'}
                      {importProgress.stage === 'processing' && 'Procesando estructura...'}
                    </span>
                    <span className="text-codestorm-accent text-sm">
                      {Math.round(importProgress.progress)}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-codestorm-accent h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress.progress}%` }}
                    />
                  </div>
                  
                  {importProgress.currentFile && (
                    <p className="text-gray-400 text-sm mt-2">
                      {importProgress.currentFile}
                    </p>
                  )}
                  
                  {importProgress.totalFiles && importProgress.processedFiles && (
                    <p className="text-gray-400 text-sm mt-1">
                      {importProgress.processedFiles} de {importProgress.totalFiles} archivos
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Repositorio importado */}
          {importedRepo && (
            <div className="space-y-6">
              {/* Información del repositorio */}
              <div className="bg-codestorm-darker rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div>
                    <h3 className="text-lg font-medium text-white">{importedRepo.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {importedRepo.totalFiles} archivos • {formatFileSize(importedRepo.totalSize)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vista previa de la estructura */}
              <div className="bg-codestorm-darker rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Estructura del Repositorio</h4>
                <div className="max-h-64 overflow-y-auto">
                  {renderDirectoryStructure(importedRepo.structure)}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmImport}
                  className="flex-1 px-4 py-2 bg-codestorm-accent hover:bg-blue-600 text-white rounded-md transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Importar Repositorio</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar elementos del directorio
const DirectoryItem: React.FC<{
  node: DirectoryNode;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ node, level, isExpanded, onToggle }) => {
  const paddingLeft = level * 20;

  return (
    <div>
      <div
        className={`
          flex items-center space-x-2 py-1 px-2 rounded cursor-pointer
          hover:bg-codestorm-blue/10 transition-colors
        `}
        style={{ paddingLeft }}
        onClick={node.type === 'directory' ? onToggle : undefined}
      >
        {node.type === 'directory' ? (
          <Folder className={`w-4 h-4 ${isExpanded ? 'text-codestorm-accent' : 'text-gray-400'}`} />
        ) : (
          <File className="w-4 h-4 text-gray-400" />
        )}
        
        <span className="text-white text-sm flex-1">{node.name}</span>
        
        {node.type === 'file' && node.size && (
          <span className="text-gray-500 text-xs">
            {(node.size / 1024).toFixed(1)} KB
          </span>
        )}
      </div>

      {node.type === 'directory' && isExpanded && node.children && (
        <div>
          {Object.entries(node.children).map(([name, childNode]) => (
            <DirectoryItem
              key={childNode.path}
              node={childNode}
              level={level + 1}
              isExpanded={false}
              onToggle={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RepositoryImporter;
