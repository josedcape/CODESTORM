import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FileItem, FileAnalysis, FileContext, FileObservation } from '../../types';
import {
  Folder,
  FolderOpen,
  File,
  ChevronRight,
  ChevronDown,
  Search,
  FileText,
  Code,
  Eye,
  RefreshCw,
  AlertTriangle,
  Info,
  Zap,
  Clock,
  Plus,
  Edit,
  Trash,
  Filter,
  ArrowUpDown,
  Check,
  Layers,
  GitBranch,
  GitFork
} from 'lucide-react';

interface DirectoryNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: DirectoryNode[];
  file?: FileItem;
}

interface DirectoryExplorerProps {
  files: FileItem[];
  onSelectFile: (file: FileItem) => void;
  onAnalyzeFile?: (file: FileItem) => void;
  fileAnalyses?: FileAnalysis[];
  fileContexts?: FileContext[];
  fileObservations?: FileObservation[];
  selectedFilePath?: string;
  onCreateFile?: (path: string, content: string) => void;
  onCreateFolder?: (path: string) => void;
  onDeleteFile?: (file: FileItem) => void;
  onRenameFile?: (file: FileItem, newName: string) => void;
  onRefresh?: () => void;
  lastUpdated?: number;
  showRealTimeUpdates?: boolean;
}

const DirectoryExplorer: React.FC<DirectoryExplorerProps> = ({
  files,
  onSelectFile,
  onAnalyzeFile,
  fileAnalyses = [],
  fileContexts = [],
  fileObservations = [],
  selectedFilePath,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onRenameFile,
  onRefresh,
  lastUpdated = Date.now(),
  showRealTimeUpdates = true
}) => {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'modified'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showSyncMessage, setShowSyncMessage] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newItemPath, setNewItemPath] = useState('');
  const [newItemContent, setNewItemContent] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuFile, setContextMenuFile] = useState<FileItem | null>(null);
  const prevFilesCountRef = useRef(files.length);

  // Construir la estructura de directorios a partir de los archivos
  const directoryTree = useMemo(() => {
    const root: DirectoryNode = {
      name: 'root',
      path: '/',
      isDirectory: true,
      children: []
    };

    // Función para encontrar o crear un directorio en el árbol
    const findOrCreateDirectory = (path: string): DirectoryNode => {
      if (path === '/' || path === '') return root;

      const parts = path.split('/').filter(Boolean);
      let currentNode = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const currentPath = '/' + parts.slice(0, i + 1).join('/');

        let childNode = currentNode.children.find(child => child.name === part);

        if (!childNode) {
          childNode = {
            name: part,
            path: currentPath,
            isDirectory: true,
            children: []
          };
          currentNode.children.push(childNode);
        }

        currentNode = childNode;
      }

      return currentNode;
    };

    // Añadir cada archivo al árbol
    files.forEach(file => {
      const filePath = file.path;
      const lastSlashIndex = filePath.lastIndexOf('/');
      const directoryPath = lastSlashIndex >= 0 ? filePath.substring(0, lastSlashIndex) : '/';
      const fileName = lastSlashIndex >= 0 ? filePath.substring(lastSlashIndex + 1) : filePath;

      const directoryNode = findOrCreateDirectory(directoryPath);

      // Verificar si el archivo ya existe en el directorio
      const existingFile = directoryNode.children.find(child =>
        !child.isDirectory && child.name === fileName
      );

      if (!existingFile) {
        directoryNode.children.push({
          name: fileName,
          path: filePath,
          isDirectory: false,
          children: [],
          file
        });
      }
    });

    // Ordenar: primero directorios, luego archivos (alfabéticamente)
    const sortNode = (node: DirectoryNode) => {
      node.children.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

      node.children.forEach(child => {
        if (child.isDirectory) {
          sortNode(child);
        }
      });
    };

    sortNode(root);
    return root;
  }, [files]);

  // Expandir automáticamente el directorio raíz al inicio
  useEffect(() => {
    if (expandedFolders.length === 0 && directoryTree.children.length > 0) {
      setExpandedFolders(['/']);
    }
  }, [directoryTree.children.length, expandedFolders.length]);

  // Detectar cambios en los archivos y mostrar notificación
  useEffect(() => {
    if (showRealTimeUpdates && files.length !== prevFilesCountRef.current) {
      setShowSyncMessage(true);
      prevFilesCountRef.current = files.length;

      // Ocultar el mensaje después de 3 segundos
      const timer = setTimeout(() => {
        setShowSyncMessage(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [files.length, showRealTimeUpdates]);

  // Detectar cambios en lastUpdated
  useEffect(() => {
    if (showRealTimeUpdates && lastUpdated) {
      setShowSyncMessage(true);

      // Ocultar el mensaje después de 3 segundos
      const timer = setTimeout(() => {
        setShowSyncMessage(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [lastUpdated, showRealTimeUpdates]);

  // Función para alternar la expansión de un directorio
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev =>
      prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  // Función para obtener el icono según el tipo de archivo
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <Code className="h-4 w-4 text-yellow-400" />;
      case 'html':
      case 'htm':
        return <Code className="h-4 w-4 text-orange-400" />;
      case 'css':
      case 'scss':
      case 'sass':
        return <Code className="h-4 w-4 text-blue-400" />;
      case 'json':
        return <Code className="h-4 w-4 text-green-400" />;
      case 'md':
        return <FileText className="h-4 w-4 text-gray-400" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  };

  // Función para verificar si un archivo tiene análisis
  const hasAnalysis = (filePath: string) => {
    return fileAnalyses.some(analysis => analysis.path === filePath);
  };

  // Función para verificar si un archivo tiene áreas críticas
  const hasCriticalAreas = (filePath: string) => {
    const analysis = fileAnalyses.find(analysis => analysis.path === filePath);
    return analysis && analysis.criticalAreas.length > 0;
  };

  // Función para manejar la creación de un nuevo archivo
  const handleCreateFile = () => {
    if (onCreateFile && newItemPath && newItemContent) {
      onCreateFile(newItemPath, newItemContent);
      setIsCreatingFile(false);
      setNewItemPath('');
      setNewItemContent('');
    }
  };

  // Función para manejar la creación de una nueva carpeta
  const handleCreateFolder = () => {
    if (onCreateFolder && newItemPath) {
      onCreateFolder(newItemPath);
      setIsCreatingFolder(false);
      setNewItemPath('');
    }
  };

  // Función para manejar la eliminación de un archivo
  const handleDeleteFile = (file: FileItem) => {
    if (onDeleteFile) {
      onDeleteFile(file);
    }
  };

  // Función para manejar el cambio de nombre de un archivo
  const handleRenameFile = (file: FileItem, newName: string) => {
    if (onRenameFile) {
      onRenameFile(file, newName);
    }
  };

  // Función para manejar el botón de actualización
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }

    setShowSyncMessage(true);

    // Ocultar el mensaje después de 3 segundos
    setTimeout(() => {
      setShowSyncMessage(false);
    }, 3000);
  };

  // Función para mostrar el menú contextual
  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuFile(file);
    setShowContextMenu(true);
  };

  // Función para cerrar el menú contextual
  const closeContextMenu = () => {
    setShowContextMenu(false);
    setContextMenuFile(null);
  };

  // Función para obtener el número de observaciones para un archivo
  const getObservationCount = (filePath: string) => {
    return fileObservations.filter(obs => obs.fileId === filePath).length;
  };

  // Función para obtener el contexto de un archivo
  const getFileContext = (filePath: string) => {
    return fileContexts.find(ctx => ctx.path === filePath);
  };

  // Función recursiva para renderizar el árbol de directorios
  const renderTree = (node: DirectoryNode, level: number = 0) => {
    // Si estamos buscando, filtrar los nodos que no coinciden
    if (isSearching && searchTerm && !node.path.toLowerCase().includes(searchTerm.toLowerCase())) {
      // Si es un directorio, verificar si alguno de sus hijos coincide
      if (node.isDirectory) {
        const matchingChildren = node.children.filter(child =>
          child.path.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (matchingChildren.length === 0) {
          return null;
        }
      } else {
        return null;
      }
    }

    return (
      <div key={node.path} style={{ marginLeft: `${level * 16}px` }}>
        {node.isDirectory ? (
          <div>
            <div
              className={`flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-codestorm-blue/10 ${
                expandedFolders.includes(node.path) ? 'bg-codestorm-blue/5' : ''
              }`}
              onClick={() => toggleFolder(node.path)}
            >
              {node.children.length > 0 ? (
                expandedFolders.includes(node.path) ? (
                  <ChevronDown className="h-4 w-4 text-gray-400 mr-1" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400 mr-1" />
                )
              ) : (
                <div className="w-4 mr-1" />
              )}

              {expandedFolders.includes(node.path) ? (
                <FolderOpen className="h-4 w-4 text-yellow-400 mr-2" />
              ) : (
                <Folder className="h-4 w-4 text-yellow-400 mr-2" />
              )}

              <span className="text-sm text-gray-300 truncate">
                {node.name === 'root' ? '/' : node.name}
              </span>
            </div>

            {expandedFolders.includes(node.path) && (
              <div>
                {node.children.map(child => renderTree(child, level + 1))}
              </div>
            )}
          </div>
        ) : (
          <div
            className={`flex items-center justify-between py-1 px-2 rounded-md cursor-pointer hover:bg-codestorm-blue/10 ${
              selectedFilePath === node.path ? 'bg-codestorm-blue/20 border-l-2 border-codestorm-accent' : ''
            }`}
            onClick={() => node.file && onSelectFile(node.file)}
            onContextMenu={(e) => node.file && handleContextMenu(e, node.file)}
          >
            <div className="flex items-center overflow-hidden">
              <div className="w-4 mr-1" />
              {getFileIcon(node.name)}
              <span className="ml-2 text-sm text-gray-300 truncate">{node.name}</span>

              {/* Indicador de archivo nuevo */}
              {node.file && Date.now() - node.file.timestamp < 60000 && (
                <span className="ml-2 px-1 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                  Nuevo
                </span>
              )}

              {/* Indicador de archivo modificado */}
              {node.file && node.file.isModified && (
                <span className="ml-2 px-1 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                  Modificado
                </span>
              )}

              {/* Indicador de observaciones */}
              {node.file && getObservationCount(node.file.id) > 0 && (
                <span className="ml-2 px-1 py-0.5 text-xs bg-codestorm-blue/30 rounded-full text-white">
                  {getObservationCount(node.file.id)}
                </span>
              )}
            </div>

            <div className="flex items-center">
              {hasCriticalAreas(node.path) && (
                <div className="mr-1" title="Contiene áreas críticas">
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                </div>
              )}

              {/* Indicador de dependencias */}
              {node.file && getFileContext(node.file.path)?.dependencies?.length > 0 && (
                <div className="mr-1" title={`Tiene ${getFileContext(node.file.path)?.dependencies?.length} dependencias`}>
                  <GitFork className="h-3 w-3 text-purple-400" />
                </div>
              )}

              {hasAnalysis(node.path) ? (
                <div className="mr-1" title="Archivo analizado">
                  <Info className="h-3 w-3 text-blue-400" />
                </div>
              ) : onAnalyzeFile && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    node.file && onAnalyzeFile(node.file);
                  }}
                  className="p-1 rounded-md hover:bg-codestorm-blue/20 text-gray-500 hover:text-blue-400"
                  title="Analizar archivo"
                >
                  <Eye className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md border border-codestorm-blue/30 flex flex-col h-full">
      <div className="bg-codestorm-blue/20 p-3 border-b border-codestorm-blue/30 flex justify-between items-center">
        <h2 className="text-sm font-medium text-white">Explorador de Archivos</h2>

        <div className="flex space-x-2">
          {/* Mensaje de sincronización */}
          {showSyncMessage && (
            <div className="flex items-center text-green-400 text-xs animate-pulse mr-2">
              <Check className="h-3 w-3 mr-1" />
              <span>Sincronizado</span>
            </div>
          )}

          <button
            onClick={() => setIsSearching(!isSearching)}
            className={`p-1.5 rounded ${
              isSearching ? 'bg-codestorm-blue/20 text-white' : 'text-gray-400 hover:bg-codestorm-blue/10 hover:text-white'
            }`}
            title="Buscar archivos"
          >
            <Search className="h-4 w-4" />
          </button>

          <button
            onClick={handleRefresh}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/10 hover:text-white"
            title="Actualizar"
          >
            <RefreshCw className={`h-4 w-4 ${showSyncMessage ? 'text-green-400' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-2 flex flex-wrap space-x-2 border-b border-codestorm-blue/30">
        <button
          onClick={() => setIsCreatingFile(true)}
          className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
          title="Nuevo archivo"
          disabled={!onCreateFile}
        >
          <Plus className="h-4 w-4" />
        </button>

        <button
          onClick={() => setIsCreatingFolder(true)}
          className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
          title="Nueva carpeta"
          disabled={!onCreateFolder}
        >
          <Folder className="h-4 w-4" />
        </button>

        <div className="flex-1"></div>

        <div className="flex items-center">
          <Filter className="h-4 w-4 text-gray-400 mr-1" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-codestorm-darker border border-codestorm-blue/30 rounded-md py-1 px-2 text-white text-xs"
          >
            <option value="all">Todos</option>
            <option value="modified">Modificados</option>
            <option value="new">Nuevos</option>
            <option value="critical">Críticos</option>
            <option value="analyzed">Analizados</option>
          </select>
        </div>

        <div className="flex items-center">
          <ArrowUpDown className="h-4 w-4 text-gray-400 mr-1" />
          <select
            value={`${sortBy}-${sortDirection}`}
            onChange={(e) => {
              const [newSortBy, newSortDirection] = e.target.value.split('-') as ['name' | 'type' | 'modified', 'asc' | 'desc'];
              setSortBy(newSortBy);
              setSortDirection(newSortDirection);
            }}
            className="bg-codestorm-darker border border-codestorm-blue/30 rounded-md py-1 px-2 text-white text-xs"
          >
            <option value="name-asc">Nombre ↑</option>
            <option value="name-desc">Nombre ↓</option>
            <option value="type-asc">Tipo ↑</option>
            <option value="type-desc">Tipo ↓</option>
            <option value="modified-desc">Recientes</option>
          </select>
        </div>
      </div>

      {isSearching && (
        <div className="p-3 border-b border-codestorm-blue/30">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar archivos..."
              className="w-full bg-codestorm-darker border border-codestorm-blue/30 rounded-md py-1.5 px-3 text-white text-sm pl-8"
            />
            <Search className="h-4 w-4 text-gray-400 absolute left-2 top-2" />
          </div>
        </div>
      )}

      {/* Formulario para crear nuevo archivo */}
      {isCreatingFile && (
        <div className="p-3 border-b border-codestorm-blue/30">
          <h3 className="text-sm font-medium text-white mb-2">Nuevo Archivo</h3>
          <div className="space-y-2">
            <input
              type="text"
              value={newItemPath}
              onChange={(e) => setNewItemPath(e.target.value)}
              placeholder="Ruta del archivo (ej: /src/components/MiComponente.tsx)"
              className="w-full bg-codestorm-darker border border-codestorm-blue/30 rounded-md py-1.5 px-3 text-white text-sm"
            />
            <textarea
              value={newItemContent}
              onChange={(e) => setNewItemContent(e.target.value)}
              placeholder="Contenido del archivo"
              className="w-full bg-codestorm-darker border border-codestorm-blue/30 rounded-md py-1.5 px-3 text-white text-sm h-20"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsCreatingFile(false)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateFile}
                className="px-3 py-1 bg-codestorm-accent hover:bg-blue-600 text-white rounded-md text-xs"
                disabled={!newItemPath || !newItemContent}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario para crear nueva carpeta */}
      {isCreatingFolder && (
        <div className="p-3 border-b border-codestorm-blue/30">
          <h3 className="text-sm font-medium text-white mb-2">Nueva Carpeta</h3>
          <div className="space-y-2">
            <input
              type="text"
              value={newItemPath}
              onChange={(e) => setNewItemPath(e.target.value)}
              placeholder="Ruta de la carpeta (ej: /src/components/miCarpeta)"
              className="w-full bg-codestorm-darker border border-codestorm-blue/30 rounded-md py-1.5 px-3 text-white text-sm"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsCreatingFolder(false)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-3 py-1 bg-codestorm-accent hover:bg-blue-600 text-white rounded-md text-xs"
                disabled={!newItemPath}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-2">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Folder className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-center text-sm">No hay archivos para mostrar</p>
          </div>
        ) : (
          renderTree(directoryTree)
        )}
      </div>

      {/* Menú contextual */}
      {showContextMenu && contextMenuFile && (
        <div
          className="fixed bg-codestorm-darker border border-codestorm-blue/30 rounded-md shadow-lg z-50 overflow-hidden"
          style={{
            top: contextMenuPosition.y,
            left: contextMenuPosition.x
          }}
        >
          <div className="py-1">
            <button
              onClick={() => {
                onSelectFile(contextMenuFile);
                closeContextMenu();
              }}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-codestorm-blue/20 flex items-center"
            >
              <Eye className="h-4 w-4 mr-2" />
              <span>Ver archivo</span>
            </button>

            {onAnalyzeFile && (
              <button
                onClick={() => {
                  onAnalyzeFile(contextMenuFile);
                  closeContextMenu();
                }}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-codestorm-blue/20 flex items-center"
              >
                <Zap className="h-4 w-4 mr-2" />
                <span>Analizar</span>
              </button>
            )}

            {onDeleteFile && (
              <button
                onClick={() => {
                  handleDeleteFile(contextMenuFile);
                  closeContextMenu();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 flex items-center"
              >
                <Trash className="h-4 w-4 mr-2" />
                <span>Eliminar</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectoryExplorer;
