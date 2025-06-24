import React, { useState } from 'react';
import { FileItem } from '../../types';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Code, 
  Image, 
  File,
  ChevronDown,
  ChevronRight,
  GitCompare,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface DualDirectoryExplorerProps {
  originalFiles: FileItem[];
  modifiedFiles: FileItem[];
  onSelectFile: (originalFile: FileItem, modifiedFile: FileItem) => void;
  selectedFilePath?: string;
  onCompareAll?: () => void;
}

interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: FileTreeNode[];
  originalFile?: FileItem;
  modifiedFile?: FileItem;
  hasChanges?: boolean;
}

const DualDirectoryExplorer: React.FC<DualDirectoryExplorerProps> = ({
  originalFiles,
  modifiedFiles,
  onSelectFile,
  selectedFilePath,
  onCompareAll
}) => {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [activePanel, setActivePanel] = useState<'original' | 'modified' | 'both'>('both');

  // Build file tree structure
  const buildFileTree = (files: FileItem[], type: 'original' | 'modified'): FileTreeNode[] => {
    const tree: FileTreeNode[] = [];
    const pathMap = new Map<string, FileTreeNode>();

    files.forEach(file => {
      const pathParts = file.path.split('/').filter(part => part);
      let currentPath = '';
      let currentLevel = tree;

      pathParts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!pathMap.has(currentPath)) {
          const isDirectory = index < pathParts.length - 1;
          const node: FileTreeNode = {
            name: part,
            path: currentPath,
            isDirectory,
            children: [],
            ...(type === 'original' ? { originalFile: isDirectory ? undefined : file } : { modifiedFile: isDirectory ? undefined : file })
          };

          pathMap.set(currentPath, node);
          currentLevel.push(node);
        }

        const node = pathMap.get(currentPath)!;
        currentLevel = node.children;
      });
    });

    return tree;
  };

  // Merge original and modified trees
  const mergeFileTrees = (): FileTreeNode[] => {
    const originalTree = buildFileTree(originalFiles, 'original');
    const modifiedTree = buildFileTree(modifiedFiles, 'modified');
    const mergedMap = new Map<string, FileTreeNode>();

    // Add original files
    const addToMerged = (nodes: FileTreeNode[]) => {
      nodes.forEach(node => {
        mergedMap.set(node.path, { ...node });
        addToMerged(node.children);
      });
    };

    addToMerged(originalTree);

    // Merge modified files
    const mergeModified = (nodes: FileTreeNode[]) => {
      nodes.forEach(node => {
        if (mergedMap.has(node.path)) {
          const existing = mergedMap.get(node.path)!;
          existing.modifiedFile = node.modifiedFile;
          
          // Check if file has changes
          if (existing.originalFile && existing.modifiedFile) {
            existing.hasChanges = existing.originalFile.content !== existing.modifiedFile.content;
          }
        } else {
          mergedMap.set(node.path, { ...node, hasChanges: true });
        }
        mergeModified(node.children);
      });
    };

    mergeModified(modifiedTree);

    // Convert back to tree structure
    const result: FileTreeNode[] = [];
    const pathToNode = new Map<string, FileTreeNode>();

    Array.from(mergedMap.values()).forEach(node => {
      pathToNode.set(node.path, { ...node, children: [] });
    });

    Array.from(mergedMap.values()).forEach(node => {
      const newNode = pathToNode.get(node.path)!;
      const parentPath = node.path.split('/').slice(0, -1).join('/');
      
      if (parentPath && pathToNode.has(parentPath)) {
        pathToNode.get(parentPath)!.children.push(newNode);
      } else {
        result.push(newNode);
      }
    });

    return result;
  };

  const fileTree = mergeFileTrees();

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const getFileIcon = (filename: string, hasChanges?: boolean) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const iconClass = `h-4 w-4 mr-2 ${hasChanges ? 'text-yellow-400' : 'text-gray-400'}`;
    
    if (['js', 'jsx', 'ts', 'tsx'].includes(ext || '')) {
      return <Code className={iconClass} />;
    } else if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '')) {
      return <Image className={iconClass} />;
    } else if (['html', 'css', 'json', 'md'].includes(ext || '')) {
      return <FileText className={iconClass} />;
    }
    return <File className={iconClass} />;
  };

  const getFileStatus = (node: FileTreeNode) => {
    if (!node.originalFile && node.modifiedFile) {
      return { icon: <CheckCircle2 className="h-3 w-3 text-green-400" />, label: 'Nuevo' };
    } else if (node.originalFile && !node.modifiedFile) {
      return { icon: <AlertCircle className="h-3 w-3 text-red-400" />, label: 'Eliminado' };
    } else if (node.hasChanges) {
      return { icon: <GitCompare className="h-3 w-3 text-yellow-400" />, label: 'Modificado' };
    }
    return { icon: <Clock className="h-3 w-3 text-gray-400" />, label: 'Sin cambios' };
  };

  const renderFileNode = (node: FileTreeNode, level: number = 0): React.ReactNode => {
    const status = getFileStatus(node);
    
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

              <span className="text-sm text-gray-300 flex-1">{node.name}</span>
              
              {/* Folder status indicator */}
              {node.children.some(child => child.hasChanges) && (
                <div className="ml-2" title="Contiene archivos modificados">
                  <GitCompare className="h-3 w-3 text-yellow-400" />
                </div>
              )}
            </div>

            {expandedFolders.includes(node.path) && (
              <div>
                {node.children.map(child => renderFileNode(child, level + 1))}
              </div>
            )}
          </div>
        ) : (
          <div
            className={`flex items-center justify-between py-1 px-2 rounded-md cursor-pointer hover:bg-codestorm-blue/10 ${
              selectedFilePath === node.path ? 'bg-codestorm-blue/20 border-l-2 border-codestorm-accent' : ''
            }`}
            onClick={() => {
              if (node.originalFile && node.modifiedFile) {
                onSelectFile(node.originalFile, node.modifiedFile);
              }
            }}
          >
            <div className="flex items-center overflow-hidden flex-1">
              <div className="w-4 mr-1" />
              {getFileIcon(node.name, node.hasChanges)}
              <span className="text-sm text-gray-300 truncate">{node.name}</span>
              
              {/* File status badge */}
              <div className="ml-2 flex items-center space-x-1" title={status.label}>
                {status.icon}
              </div>
            </div>

            {/* File panels indicator */}
            <div className="flex items-center space-x-1 ml-2">
              {node.originalFile && (
                <div className="w-2 h-2 bg-red-400 rounded-full" title="Original disponible" />
              )}
              {node.modifiedFile && (
                <div className="w-2 h-2 bg-green-400 rounded-full" title="Modificado disponible" />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getChangedFilesCount = () => {
    return modifiedFiles.filter((modFile, index) => {
      const origFile = originalFiles[index];
      return origFile && origFile.content !== modFile.content;
    }).length;
  };

  return (
    <div className="h-full flex flex-col bg-codestorm-dark rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-codestorm-blue/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold flex items-center">
            <GitCompare className="w-5 h-5 mr-2 text-codestorm-accent" />
            Explorador Dual
          </h3>
          
          {onCompareAll && (
            <button
              onClick={onCompareAll}
              className="px-3 py-1 bg-codestorm-accent/20 text-codestorm-accent rounded-md hover:bg-codestorm-accent/30 transition-colors text-sm"
            >
              Comparar Todo
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-4 text-xs text-gray-400">
          <span className="flex items-center space-x-1">
            <RotateCcw className="w-3 h-3" />
            <span>{originalFiles.length} originales</span>
          </span>
          <span className="flex items-center space-x-1">
            <GitCompare className="w-3 h-3" />
            <span>{modifiedFiles.length} modificados</span>
          </span>
          <span className="flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-yellow-400" />
            <span>{getChangedFilesCount()} con cambios</span>
          </span>
        </div>

        {/* Panel Toggle */}
        <div className="flex mt-3 bg-codestorm-darker rounded-md p-1">
          {(['original', 'modified', 'both'] as const).map((panel) => (
            <button
              key={panel}
              onClick={() => setActivePanel(panel)}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                activePanel === panel
                  ? 'bg-codestorm-accent text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {panel === 'original' ? 'Original' : panel === 'modified' ? 'Modificado' : 'Ambos'}
            </button>
          ))}
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {fileTree.length > 0 ? (
          <div className="space-y-1">
            {fileTree.map(node => renderFileNode(node))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <GitCompare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No hay archivos para comparar</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-codestorm-blue/20 bg-codestorm-darker">
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex items-center justify-between">
            <span>Leyenda:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              <span>Original</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>Modificado</span>
            </div>
            <div className="flex items-center space-x-1">
              <GitCompare className="w-3 h-3 text-yellow-400" />
              <span>Con cambios</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              <span>Nuevo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DualDirectoryExplorer;
