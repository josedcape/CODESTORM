import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  File,
  FileText,
  Code,
  Image,
  Settings,
  ChevronRight,
  ChevronDown,
  Eye,
  Calendar,
  HardDrive,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Trash2,
  Zap,
  Brain
} from 'lucide-react';
import { ProjectStructure } from '../../pages/Agent';

interface EnhancedFileTreeProps {
  structure: ProjectStructure | null;
  onFileSelect: (file: ProjectStructure) => void;
  selectedFile: ProjectStructure | null;
  onFileCreate?: (parentPath: string, fileName: string, isDirectory: boolean) => void;
  onFileDelete?: (filePath: string) => void;
  onRefresh?: () => void;
  onCodeCorrection?: (file: ProjectStructure) => void;
}

const EnhancedFileTree: React.FC<EnhancedFileTreeProps> = ({
  structure,
  onFileSelect,
  selectedFile,
  onFileCreate,
  onFileDelete,
  onRefresh,
  onCodeCorrection
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showHidden, setShowHidden] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: ProjectStructure;
  } | null>(null);

  // Auto-expand directories with few children
  useEffect(() => {
    if (structure) {
      const autoExpand = (node: ProjectStructure, expanded: Set<string>) => {
        if (node.type === 'directory' && node.children) {
          if (node.children.length <= 3) {
            expanded.add(node.id);
          }
          node.children.forEach(child => autoExpand(child, expanded));
        }
      };
      
      const newExpanded = new Set(expandedNodes);
      autoExpand(structure, newExpanded);
      setExpandedNodes(newExpanded);
    }
  }, [structure]);

  const getFileIcon = (file: ProjectStructure) => {
    if (file.type === 'directory') {
      return expandedNodes.has(file.id) ? 
        <FolderOpen className="w-4 h-4 text-blue-400" /> : 
        <Folder className="w-4 h-4 text-blue-400" />;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'tsx':
      case 'ts':
        return <Code className="w-4 h-4 text-blue-400" />;
      case 'js':
      case 'jsx':
        return <Code className="w-4 h-4 text-yellow-400" />;
      case 'json':
        return <Settings className="w-4 h-4 text-green-400" />;
      case 'md':
      case 'txt':
        return <FileText className="w-4 h-4 text-gray-400" />;
      case 'css':
      case 'scss':
      case 'sass':
        return <Code className="w-4 h-4 text-pink-400" />;
      case 'html':
        return <Code className="w-4 h-4 text-orange-400" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className="w-4 h-4 text-purple-400" />;
      case 'py':
        return <Code className="w-4 h-4 text-green-400" />;
      case 'java':
        return <Code className="w-4 h-4 text-red-400" />;
      case 'cpp':
      case 'c':
        return <Code className="w-4 h-4 text-blue-300" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
    }
  };

  const getFileTypeColor = (file: ProjectStructure) => {
    if (file.type === 'directory') return 'text-blue-300';

    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'tsx':
      case 'ts':
        return 'text-blue-300';
      case 'js':
      case 'jsx':
        return 'text-yellow-300';
      case 'json':
        return 'text-green-300';
      case 'css':
      case 'scss':
      case 'sass':
        return 'text-pink-300';
      case 'html':
        return 'text-orange-300';
      case 'md':
        return 'text-gray-300';
      case 'py':
        return 'text-green-300';
      case 'java':
        return 'text-red-300';
      default:
        return 'text-gray-400';
    }
  };

  // Detectar si un archivo es de código y puede ser corregido
  const isCodeFile = (file: ProjectStructure): boolean => {
    if (file.type !== 'file') return false;

    const extension = file.name.split('.').pop()?.toLowerCase();
    const codeExtensions = [
      'js', 'jsx', 'ts', 'tsx',  // JavaScript/TypeScript
      'py', 'pyw',               // Python
      'java',                    // Java
      'cpp', 'c', 'cc', 'cxx',  // C/C++
      'cs',                      // C#
      'php',                     // PHP
      'rb',                      // Ruby
      'go',                      // Go
      'rs',                      // Rust
      'swift',                   // Swift
      'kt',                      // Kotlin
      'scala',                   // Scala
      'html', 'htm',             // HTML
      'css', 'scss', 'sass',     // CSS
      'json',                    // JSON
      'xml',                     // XML
      'sql'                      // SQL
    ];

    return extension ? codeExtensions.includes(extension) : false;
  };

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const shouldShowFile = (file: ProjectStructure): boolean => {
    // Filter hidden files
    if (!showHidden && file.name.startsWith('.')) {
      return false;
    }

    // Filter by search term
    if (searchTerm && !file.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filter by file type
    if (filterType !== 'all') {
      if (filterType === 'directories' && file.type !== 'directory') {
        return false;
      }
      if (filterType === 'files' && file.type !== 'file') {
        return false;
      }
      if (filterType !== 'directories' && filterType !== 'files') {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension !== filterType) {
          return false;
        }
      }
    }

    return true;
  };

  const handleContextMenu = (e: React.MouseEvent, file: ProjectStructure) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const renderContextMenu = () => {
    if (!contextMenu) return null;

    return (
      <>
        <div 
          className="fixed inset-0 z-40" 
          onClick={closeContextMenu}
        />
        <div 
          className="fixed z-50 bg-codestorm-darker border border-codestorm-blue/30 rounded-lg shadow-lg py-2 min-w-48"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              onFileSelect(contextMenu.file);
              closeContextMenu();
            }}
            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-codestorm-blue/20 flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>Open</span>
          </button>

          {/* Opción de corrección de código para archivos de código */}
          {contextMenu.file.type === 'file' && isCodeFile(contextMenu.file) && onCodeCorrection && (
            <button
              onClick={() => {
                onCodeCorrection(contextMenu.file);
                closeContextMenu();
              }}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-codestorm-blue/20 flex items-center space-x-2"
            >
              <Brain className="w-4 h-4 text-codestorm-accent" />
              <span>Corregir Código</span>
            </button>
          )}
          
          {contextMenu.file.type === 'directory' && onFileCreate && (
            <>
              <button
                onClick={() => {
                  const fileName = prompt('Enter file name:');
                  if (fileName) {
                    onFileCreate(contextMenu.file.path, fileName, false);
                  }
                  closeContextMenu();
                }}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-codestorm-blue/20 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New File</span>
              </button>
              
              <button
                onClick={() => {
                  const dirName = prompt('Enter directory name:');
                  if (dirName) {
                    onFileCreate(contextMenu.file.path, dirName, true);
                  }
                  closeContextMenu();
                }}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-codestorm-blue/20 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Folder</span>
              </button>
            </>
          )}
          
          {onFileDelete && contextMenu.file.id !== 'root' && (
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${contextMenu.file.name}?`)) {
                  onFileDelete(contextMenu.file.path);
                }
                closeContextMenu();
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </>
    );
  };

  const renderNode = (node: ProjectStructure, depth: number = 0) => {
    if (!shouldShowFile(node)) return null;

    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedFile?.id === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className={`
            flex items-center space-x-2 py-1 px-2 rounded cursor-pointer transition-colors group
            ${isSelected ? 'bg-codestorm-accent/20 border border-codestorm-accent/30' : 'hover:bg-codestorm-blue/10'}
          `}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleExpanded(node.id);
            } else {
              onFileSelect(node);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          {/* Expansion icon for directories */}
          {node.type === 'directory' && hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.id);
              }}
              className="p-0.5 hover:bg-codestorm-blue/20 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )}
            </button>
          )}
          
          {/* Spacer for files without children */}
          {(node.type === 'file' || !hasChildren) && (
            <div className="w-4" />
          )}

          {/* File/directory icon */}
          {getFileIcon(node)}

          {/* File name */}
          <span className={`text-sm font-medium ${getFileTypeColor(node)} flex-1 truncate`}>
            {node.name}
          </span>

          {/* File info */}
          {node.type === 'file' && (
            <div className="flex items-center space-x-2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {node.size && (
                <span className="flex items-center space-x-1">
                  <HardDrive className="w-3 h-3" />
                  <span>{formatFileSize(node.size)}</span>
                </span>
              )}
            </div>
          )}

          {/* Quick action buttons */}
          {node.type === 'file' && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Botón de corrección de código para archivos de código */}
              {isCodeFile(node) && onCodeCorrection && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCodeCorrection(node);
                  }}
                  className="p-1 hover:bg-codestorm-accent/20 rounded"
                  title="Corregir código con IA"
                >
                  <Brain className="w-3 h-3 text-codestorm-accent hover:text-blue-300" />
                </button>
              )}

              {/* Botón de abrir archivo */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFileSelect(node);
                }}
                className="p-1 hover:bg-codestorm-accent/20 rounded"
                title="Open file"
              >
                <Eye className="w-3 h-3 text-gray-400 hover:text-codestorm-accent" />
              </button>
            </div>
          )}
        </div>

        {/* Render children if expanded */}
        {node.type === 'directory' && isExpanded && node.children && (
          <div>
            {node.children
              .sort((a, b) => {
                // Directories first, then files
                if (a.type !== b.type) {
                  return a.type === 'directory' ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
              })
              .map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!structure) {
    return (
      <div className="bg-codestorm-dark rounded-lg p-6">
        <div className="text-center text-gray-400">
          <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No project loaded</p>
          <p className="text-sm mt-2">Load a repository or file to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-codestorm-dark rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-codestorm-blue/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Folder className="w-5 h-5 mr-2 text-codestorm-accent" />
            File Explorer
          </h3>
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded transition-colors"
                title="Refresh"
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-10 pr-4 py-2 bg-codestorm-darker border border-codestorm-blue/30 rounded text-white placeholder-gray-400 focus:outline-none focus:border-codestorm-accent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 px-2 py-1 text-sm bg-codestorm-darker border border-codestorm-blue/30 rounded text-white focus:outline-none focus:border-codestorm-accent"
            >
              <option value="all">All Files</option>
              <option value="directories">Directories</option>
              <option value="files">Files Only</option>
              <option value="js">JavaScript</option>
              <option value="ts">TypeScript</option>
              <option value="tsx">React</option>
              <option value="css">Styles</option>
              <option value="json">JSON</option>
              <option value="md">Markdown</option>
            </select>
            
            <button
              onClick={() => setShowHidden(!showHidden)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                showHidden ? 'bg-codestorm-accent text-white' : 'bg-gray-600 text-gray-300'
              }`}
              title="Show hidden files"
            >
              Hidden
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-400 mt-2">{structure.name}</p>
      </div>

      {/* File tree */}
      <div className="max-h-96 overflow-y-auto custom-scrollbar p-2">
        {renderNode(structure)}
      </div>

      {/* Selected file info */}
      {selectedFile && selectedFile.type === 'file' && (
        <div className="p-4 border-t border-codestorm-blue/30 bg-codestorm-darker">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-white">Selected File</h4>
            {isCodeFile(selectedFile) && onCodeCorrection && (
              <button
                onClick={() => onCodeCorrection(selectedFile)}
                className="px-2 py-1 text-xs bg-codestorm-accent/20 text-codestorm-accent rounded border border-codestorm-accent/30 hover:bg-codestorm-accent/30 transition-colors flex items-center space-x-1"
                title="Corregir código con IA"
              >
                <Brain className="w-3 h-3" />
                <span>Corregir</span>
              </button>
            )}
          </div>

          <div className="space-y-1 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Path:</span>
              <span className="text-gray-300 truncate ml-2">{selectedFile.path}</span>
            </div>
            {selectedFile.size && (
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="text-gray-300">{formatFileSize(selectedFile.size)}</span>
              </div>
            )}
            {selectedFile.lastModified && (
              <div className="flex justify-between">
                <span>Modified:</span>
                <span className="text-gray-300">{formatDate(selectedFile.lastModified)}</span>
              </div>
            )}
            {selectedFile.language && (
              <div className="flex justify-between">
                <span>Language:</span>
                <span className="text-gray-300 capitalize">{selectedFile.language}</span>
              </div>
            )}
            {isCodeFile(selectedFile) && (
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="text-codestorm-accent flex items-center space-x-1">
                  <Code className="w-3 h-3" />
                  <span>Code File</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Context menu */}
      {renderContextMenu()}
    </div>
  );
};

export default EnhancedFileTree;
