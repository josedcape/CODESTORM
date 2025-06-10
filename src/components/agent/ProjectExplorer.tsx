import React, { useState } from 'react';
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
  HardDrive
} from 'lucide-react';
import { ProjectStructure } from '../../pages/Agent';

interface ProjectExplorerProps {
  structure: ProjectStructure | null;
  onFileSelect: (file: ProjectStructure) => void;
  selectedFile: ProjectStructure | null;
}

const ProjectExplorer: React.FC<ProjectExplorerProps> = ({ 
  structure, 
  onFileSelect, 
  selectedFile 
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

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
      case 'js':
      case 'jsx':
        return <Code className="w-4 h-4 text-yellow-400" />;
      case 'json':
        return <Settings className="w-4 h-4 text-green-400" />;
      case 'md':
      case 'txt':
        return <FileText className="w-4 h-4 text-gray-400" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className="w-4 h-4 text-purple-400" />;
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
        return 'text-pink-300';
      case 'html':
        return 'text-orange-300';
      case 'md':
        return 'text-gray-300';
      default:
        return 'text-gray-400';
    }
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
    return new Date(timestamp).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderNode = (node: ProjectStructure, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedFile?.id === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className={`
            flex items-center space-x-2 py-1 px-2 rounded cursor-pointer transition-colors
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
        >
          {/* Icono de expansión para directorios */}
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
          
          {/* Espaciador para archivos sin hijos */}
          {(node.type === 'file' || !hasChildren) && (
            <div className="w-4" />
          )}

          {/* Icono del archivo/directorio */}
          {getFileIcon(node)}

          {/* Nombre del archivo */}
          <span className={`text-sm font-medium ${getFileTypeColor(node)} flex-1`}>
            {node.name}
          </span>

          {/* Información adicional para archivos */}
          {node.type === 'file' && (
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              {node.size && (
                <span className="flex items-center space-x-1">
                  <HardDrive className="w-3 h-3" />
                  <span>{formatFileSize(node.size)}</span>
                </span>
              )}
              {node.lastModified && (
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(node.lastModified)}</span>
                </span>
              )}
            </div>
          )}

          {/* Botón de vista previa para archivos */}
          {node.type === 'file' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileSelect(node);
              }}
              className="p-1 hover:bg-codestorm-accent/20 rounded"
              title="Vista previa"
            >
              <Eye className="w-3 h-3 text-gray-400 hover:text-codestorm-accent" />
            </button>
          )}
        </div>

        {/* Renderizar hijos si está expandido */}
        {node.type === 'directory' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
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
          <p>No hay proyecto cargado</p>
          <p className="text-sm mt-2">Carga un repositorio o archivo para comenzar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-codestorm-dark rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-codestorm-blue/30">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Folder className="w-5 h-5 mr-2 text-codestorm-accent" />
          Explorador de Proyecto
        </h3>
        <p className="text-sm text-gray-400 mt-1">{structure.name}</p>
      </div>

      {/* Árbol de archivos */}
      <div className="max-h-96 overflow-y-auto custom-scrollbar p-2">
        {renderNode(structure)}
      </div>

      {/* Información del archivo seleccionado */}
      {selectedFile && selectedFile.type === 'file' && (
        <div className="p-4 border-t border-codestorm-blue/30 bg-codestorm-darker">
          <h4 className="text-sm font-medium text-white mb-2">Archivo Seleccionado</h4>
          <div className="space-y-1 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Ruta:</span>
              <span className="text-gray-300">{selectedFile.path}</span>
            </div>
            {selectedFile.size && (
              <div className="flex justify-between">
                <span>Tamaño:</span>
                <span className="text-gray-300">{formatFileSize(selectedFile.size)}</span>
              </div>
            )}
            {selectedFile.lastModified && (
              <div className="flex justify-between">
                <span>Modificado:</span>
                <span className="text-gray-300">{formatDate(selectedFile.lastModified)}</span>
              </div>
            )}
            {selectedFile.language && (
              <div className="flex justify-between">
                <span>Lenguaje:</span>
                <span className="text-gray-300 capitalize">{selectedFile.language}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectExplorer;
