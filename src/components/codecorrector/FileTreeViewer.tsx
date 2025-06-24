import React, { useState, useCallback } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  Clock,
  HardDrive
} from 'lucide-react';
import { FileNode, FileDecompressionService } from '../../services/FileDecompressionService';

interface FileTreeViewerProps {
  fileTree: FileNode[];
  selectedFile?: FileNode | null;
  onFileSelect: (file: FileNode) => void;
  onToggleDirectory?: (path: string) => void;
  className?: string;
  showFileInfo?: boolean;
}

interface FileTreeNodeProps {
  node: FileNode;
  level: number;
  selectedFile?: FileNode | null;
  onFileSelect: (file: FileNode) => void;
  onToggleDirectory?: (path: string) => void;
  showFileInfo?: boolean;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  node,
  level,
  selectedFile,
  onFileSelect,
  onToggleDirectory,
  showFileInfo = true
}) => {
  const [isExpanded, setIsExpanded] = useState(node.isExpanded || false);
  const isSelected = selectedFile?.path === node.path;
  const isDirectory = node.type === 'directory';
  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = useCallback(() => {
    if (isDirectory && hasChildren) {
      const newExpanded = !isExpanded;
      setIsExpanded(newExpanded);
      onToggleDirectory?.(node.path);
    }
  }, [isDirectory, hasChildren, isExpanded, node.path, onToggleDirectory]);

  const handleSelect = useCallback(() => {
    if (node.type === 'file') {
      onFileSelect(node);
    } else {
      handleToggle();
    }
  }, [node, onFileSelect, handleToggle]);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileTypeColor = (extension?: string) => {
    if (!extension) return 'text-gray-400';
    
    const colorMap: Record<string, string> = {
      '.js': 'text-yellow-400',
      '.jsx': 'text-blue-400',
      '.ts': 'text-blue-500',
      '.tsx': 'text-blue-400',
      '.html': 'text-orange-400',
      '.htm': 'text-orange-400',
      '.css': 'text-pink-400',
      '.scss': 'text-pink-500',
      '.sass': 'text-pink-500',
      '.json': 'text-green-400',
      '.xml': 'text-gray-400',
      '.md': 'text-blue-300',
      '.txt': 'text-gray-300',
      '.py': 'text-green-500',
      '.java': 'text-red-400',
      '.c': 'text-blue-600',
      '.cpp': 'text-blue-600',
      '.cs': 'text-purple-400',
      '.php': 'text-purple-500',
      '.rb': 'text-red-500',
      '.go': 'text-cyan-400',
      '.rs': 'text-orange-500',
      '.swift': 'text-orange-400',
      '.kt': 'text-purple-600',
      '.sql': 'text-blue-400',
      '.sh': 'text-green-600',
      '.bat': 'text-gray-500',
      '.yml': 'text-yellow-500',
      '.yaml': 'text-yellow-500'
    };

    return colorMap[extension.toLowerCase()] || 'text-gray-400';
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1 px-2 rounded cursor-pointer transition-colors duration-150 ${
          isSelected 
            ? 'bg-codestorm-accent/20 text-codestorm-accent border-l-2 border-codestorm-accent' 
            : 'hover:bg-codestorm-blue/10 text-gray-300 hover:text-white'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleSelect}
      >
        {/* Expand/Collapse Icon */}
        {isDirectory && hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            className="mr-1 p-0.5 hover:bg-codestorm-blue/20 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}

        {/* File/Folder Icon */}
        <div className="mr-2 flex-shrink-0">
          {isDirectory ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-400" />
            ) : (
              <Folder className="w-4 h-4 text-blue-500" />
            )
          ) : (
            <File className={`w-4 h-4 ${getFileTypeColor(node.extension)}`} />
          )}
        </div>

        {/* File/Folder Name */}
        <span className="flex-1 truncate text-sm font-medium">
          {node.name}
        </span>

        {/* File Info */}
        {showFileInfo && node.type === 'file' && (
          <div className="flex items-center space-x-2 text-xs text-gray-500 ml-2">
            {node.size !== undefined && (
              <span className="flex items-center">
                <HardDrive className="w-3 h-3 mr-1" />
                {FileDecompressionService.formatFileSize(node.size)}
              </span>
            )}
            {node.lastModified && (
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatDate(node.lastModified)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Children */}
      {isDirectory && hasChildren && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              onToggleDirectory={onToggleDirectory}
              showFileInfo={showFileInfo}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTreeViewer: React.FC<FileTreeViewerProps> = ({
  fileTree,
  selectedFile,
  onFileSelect,
  onToggleDirectory,
  className = '',
  showFileInfo = true
}) => {
  const totalFiles = FileDecompressionService.getAllFiles(fileTree).length;
  const totalSize = FileDecompressionService.getAllFiles(fileTree)
    .reduce((sum, file) => sum + (file.size || 0), 0);

  if (fileTree.length === 0) {
    return (
      <div className={`bg-codestorm-dark rounded-lg border border-codestorm-blue/30 p-6 ${className}`}>
        <div className="text-center text-gray-400">
          <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No files loaded</p>
          <p className="text-xs mt-1">Upload a ZIP file to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-codestorm-dark rounded-lg border border-codestorm-blue/30 ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-codestorm-blue/30">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium flex items-center">
            <Folder className="w-4 h-4 mr-2 text-blue-400" />
            Project Files
          </h3>
          <div className="text-xs text-gray-400">
            {totalFiles} files • {FileDecompressionService.formatFileSize(totalSize)}
          </div>
        </div>
      </div>

      {/* File Tree */}
      <div className="p-2 max-h-96 overflow-y-auto custom-scrollbar">
        {fileTree.map((node) => (
          <FileTreeNode
            key={node.id}
            node={node}
            level={0}
            selectedFile={selectedFile}
            onFileSelect={onFileSelect}
            onToggleDirectory={onToggleDirectory}
            showFileInfo={showFileInfo}
          />
        ))}
      </div>

      {/* Footer with selection info */}
      {selectedFile && (
        <div className="p-3 border-t border-codestorm-blue/30 bg-codestorm-blue/5">
          <div className="text-xs text-gray-400">
            <div className="font-medium text-white mb-1">Selected: {selectedFile.name}</div>
            <div className="flex items-center space-x-4">
              <span>Path: {selectedFile.path}</span>
              {selectedFile.size !== undefined && (
                <span>Size: {FileDecompressionService.formatFileSize(selectedFile.size)}</span>
              )}
              {selectedFile.extension && (
                <span>Type: {selectedFile.extension.toUpperCase()}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileTreeViewer;
