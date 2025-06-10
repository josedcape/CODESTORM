import React, { useState } from 'react';
import { 
  File, 
  FileText, 
  Code, 
  Image, 
  Settings, 
  X,
  Plus,
  RefreshCw,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  GitCompare,
  Clock,
  HardDrive,
  Eye,
  Edit3
} from 'lucide-react';
import { FileItem } from '../../types';

interface FileExplorerProps {
  files: FileItem[];
  activeFile: FileItem | null;
  onFileSelect: (file: FileItem) => void;
  onFileClose: (file: FileItem) => void;
  onRefreshFiles?: () => void;
  showOriginalComparison?: boolean;
  originalContent?: {[path: string]: string};
  mode: 'single' | 'split' | 'tabs';
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFile,
  onFileSelect,
  onFileClose,
  onRefreshFiles,
  showOriginalComparison = false,
  originalContent = {},
  mode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'modified' | 'size' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState<'all' | 'modified' | 'new' | 'code'>('all');

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'tsx':
      case 'jsx':
      case 'ts':
      case 'js':
        return <Code className="w-4 h-4 text-blue-400" />;
      case 'css':
      case 'scss':
      case 'sass':
        return <FileText className="w-4 h-4 text-pink-400" />;
      case 'html':
        return <FileText className="w-4 h-4 text-orange-400" />;
      case 'json':
        return <Settings className="w-4 h-4 text-yellow-400" />;
      case 'md':
        return <FileText className="w-4 h-4 text-gray-400" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className="w-4 h-4 text-green-400" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasChanges = (file: FileItem): boolean => {
    return originalContent[file.path] && originalContent[file.path] !== file.content;
  };

  const isNewFile = (file: FileItem): boolean => {
    return !originalContent[file.path];
  };

  const filteredAndSortedFiles = files
    .filter(file => {
      // Filter by search term
      if (searchTerm && !file.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filter by type
      switch (filterType) {
        case 'modified':
          return hasChanges(file);
        case 'new':
          return isNewFile(file);
        case 'code':
          return /\.(tsx?|jsx?|css|html|json|md)$/i.test(file.name);
        default:
          return true;
      }
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'modified':
          comparison = (a.timestamp || 0) - (b.timestamp || 0);
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'type':
          const extA = a.name.split('.').pop() || '';
          const extB = b.name.split('.').pop() || '';
          comparison = extA.localeCompare(extB);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="h-full bg-codestorm-dark rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-codestorm-blue/30 bg-codestorm-darker">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center">
            <FileText className="w-5 h-5 mr-2 text-codestorm-accent" />
            Archivos del Proyecto
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">
              {filteredAndSortedFiles.length} de {files.length}
            </span>
            {onRefreshFiles && (
              <button
                onClick={onRefreshFiles}
                className="p-1.5 rounded hover:bg-codestorm-blue/30 transition-colors text-gray-400 hover:text-white"
                title="Actualizar archivos"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search and filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar archivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-codestorm-dark border border-codestorm-blue/30 rounded text-white text-sm focus:outline-none focus:border-codestorm-accent"
            />
          </div>

          <div className="flex items-center space-x-2">
            {/* Filter dropdown */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-2 py-1 bg-codestorm-dark border border-codestorm-blue/30 rounded text-white text-xs focus:outline-none focus:border-codestorm-accent"
            >
              <option value="all">Todos</option>
              <option value="modified">Modificados</option>
              <option value="new">Nuevos</option>
              <option value="code">Código</option>
            </select>

            {/* Sort dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 bg-codestorm-dark border border-codestorm-blue/30 rounded text-white text-xs focus:outline-none focus:border-codestorm-accent"
            >
              <option value="name">Nombre</option>
              <option value="modified">Modificado</option>
              <option value="size">Tamaño</option>
              <option value="type">Tipo</option>
            </select>

            {/* Sort order */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 rounded hover:bg-codestorm-blue/30 transition-colors text-gray-400 hover:text-white"
              title={`Ordenar ${sortOrder === 'asc' ? 'descendente' : 'ascendente'}`}
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedFiles.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
            <p className="text-gray-400 text-sm">
              {files.length === 0 
                ? 'No hay archivos disponibles'
                : 'No se encontraron archivos con los filtros aplicados'
              }
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredAndSortedFiles.map((file) => (
              <div
                key={file.id}
                className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                  activeFile?.id === file.id
                    ? 'bg-codestorm-accent/20 border border-codestorm-accent/30'
                    : 'hover:bg-codestorm-blue/10'
                }`}
                onClick={() => onFileSelect(file)}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(file.name)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-white text-sm font-medium truncate">
                        {file.name}
                      </span>
                      {hasChanges(file) && (
                        <GitCompare className="w-3 h-3 text-blue-400 flex-shrink-0" title="Archivo modificado" />
                      )}
                      {isNewFile(file) && (
                        <Plus className="w-3 h-3 text-green-400 flex-shrink-0" title="Archivo nuevo" />
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-400">
                      <span className="truncate">{file.path}</span>
                      {file.size && <span>{formatFileSize(file.size)}</span>}
                      {file.timestamp && (
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(file.timestamp)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileSelect(file);
                    }}
                    className="p-1 rounded hover:bg-codestorm-accent/20 text-gray-400 hover:text-codestorm-accent"
                    title="Editar archivo"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  
                  {mode === 'tabs' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileClose(file);
                      }}
                      className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                      title="Cerrar archivo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with stats */}
      <div className="p-3 border-t border-codestorm-blue/30 bg-codestorm-darker">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span>{files.length} archivos</span>
            {showOriginalComparison && (
              <>
                <span>{files.filter(f => hasChanges(f)).length} modificados</span>
                <span>{files.filter(f => isNewFile(f)).length} nuevos</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <HardDrive className="w-3 h-3" />
            <span>
              {formatFileSize(files.reduce((total, file) => total + (file.size || 0), 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;
