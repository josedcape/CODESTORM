import React, { useState, useMemo } from 'react';
import { StageChange, FileItem } from '../../types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Plus,
  Trash,
  Edit,
  FileText,
  Filter,
  Search,
  Code,
  ChevronDown,
  ChevronUp,
  Eye,
  ArrowLeftRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { diffLines, Change } from 'diff';

interface DetailedChangesViewerProps {
  changes: StageChange[];
  originalFiles: FileItem[];
  onApproveChange?: (changeId: string) => void;
  onRejectChange?: (changeId: string) => void;
}

const DetailedChangesViewer: React.FC<DetailedChangesViewerProps> = ({
  changes,
  originalFiles,
  onApproveChange,
  onRejectChange
}) => {
  const [expandedChangeId, setExpandedChangeId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDiff, setShowDiff] = useState<boolean>(true);
  
  // Extraer todos los lenguajes únicos de los cambios
  const availableLanguages = useMemo(() => {
    const languages = new Set<string>();
    changes.forEach(change => {
      if (change.language) {
        languages.add(change.language);
      }
    });
    return Array.from(languages);
  }, [changes]);
  
  // Filtrar los cambios según los criterios seleccionados
  const filteredChanges = useMemo(() => {
    return changes.filter(change => {
      // Filtrar por tipo
      if (filterType !== 'all' && change.type !== filterType) {
        return false;
      }
      
      // Filtrar por lenguaje
      if (filterLanguage !== 'all' && change.language !== filterLanguage) {
        return false;
      }
      
      // Filtrar por término de búsqueda
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          change.title.toLowerCase().includes(searchLower) ||
          change.description.toLowerCase().includes(searchLower) ||
          change.path?.toLowerCase().includes(searchLower) ||
          change.content?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [changes, filterType, filterLanguage, searchTerm]);
  
  // Función para obtener el contenido original de un archivo
  const getOriginalContent = (path: string): string => {
    const originalFile = originalFiles.find(file => file.path === path);
    return originalFile ? originalFile.content : '';
  };
  
  // Función para generar el diff entre el contenido original y el modificado
  const generateDiff = (originalContent: string, newContent: string): Change[] => {
    return diffLines(originalContent, newContent);
  };
  
  // Función para renderizar el diff con colores
  const renderDiff = (diff: Change[]) => {
    return (
      <div className="bg-codestorm-darker rounded-md p-2 font-mono text-sm overflow-auto max-h-[400px]">
        {diff.map((part, index) => (
          <div 
            key={index} 
            className={`${
              part.added 
                ? 'bg-green-900/30 text-green-300 border-l-2 border-green-500' 
                : part.removed 
                  ? 'bg-red-900/30 text-red-300 border-l-2 border-red-500' 
                  : 'text-gray-300'
            } py-0.5 px-2 whitespace-pre-wrap`}
          >
            {part.value}
          </div>
        ))}
      </div>
    );
  };
  
  // Función para renderizar un cambio específico
  const renderChange = (change: StageChange) => {
    const isExpanded = expandedChangeId === change.id;
    
    // Obtener el icono según el tipo de cambio
    const getChangeIcon = () => {
      switch (change.type) {
        case 'create':
          return <Plus className="h-4 w-4 text-green-400" />;
        case 'modify':
          return <Edit className="h-4 w-4 text-blue-400" />;
        case 'delete':
          return <Trash className="h-4 w-4 text-red-400" />;
        default:
          return <Info className="h-4 w-4 text-gray-400" />;
      }
    };
    
    return (
      <div 
        key={change.id} 
        className="bg-codestorm-darker rounded-md border border-codestorm-blue/30 overflow-hidden mb-4"
      >
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-codestorm-blue/10"
          onClick={() => setExpandedChangeId(isExpanded ? null : change.id)}
        >
          <div className="flex items-center">
            {getChangeIcon()}
            <div className="ml-2">
              <p className="text-white text-sm">{change.title}</p>
              <p className="text-gray-400 text-xs">{change.path}</p>
            </div>
          </div>
          <div className="flex items-center">
            {change.isApproved && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs mr-2">
                Aprobado
              </span>
            )}
            {change.isRejected && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs mr-2">
                Rechazado
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="p-3 border-t border-codestorm-blue/30">
            <p className="text-gray-300 text-sm mb-3">{change.description}</p>
            
            {change.type === 'create' && change.content && (
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-300 text-xs font-medium">Nuevo archivo:</p>
                </div>
                <SyntaxHighlighter
                  language={change.language || 'javascript'}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: '0.75rem',
                    background: '#0a1120',
                    borderRadius: '0.375rem',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    fontSize: '0.75rem'
                  }}
                  showLineNumbers
                >
                  {change.content}
                </SyntaxHighlighter>
              </div>
            )}
            
            {change.type === 'modify' && change.content && change.path && (
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-300 text-xs font-medium">Cambios:</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDiff(!showDiff);
                    }}
                    className="flex items-center text-xs text-gray-400 hover:text-white"
                  >
                    {showDiff ? (
                      <>
                        <ArrowLeftRight className="h-3 w-3 mr-1" />
                        <span>Ver por separado</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        <span>Ver diferencias</span>
                      </>
                    )}
                  </button>
                </div>
                
                {showDiff ? (
                  // Mostrar diferencias
                  renderDiff(generateDiff(getOriginalContent(change.path), change.content))
                ) : (
                  // Mostrar antes/después
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-300 text-xs mb-1">Original:</p>
                      <SyntaxHighlighter
                        language={change.language || 'javascript'}
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0,
                          padding: '0.75rem',
                          background: '#0a1120',
                          borderRadius: '0.375rem',
                          maxHeight: '300px',
                          overflowY: 'auto',
                          fontSize: '0.75rem'
                        }}
                        showLineNumbers
                      >
                        {getOriginalContent(change.path)}
                      </SyntaxHighlighter>
                    </div>
                    <div>
                      <p className="text-gray-300 text-xs mb-1">Modificado:</p>
                      <SyntaxHighlighter
                        language={change.language || 'javascript'}
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0,
                          padding: '0.75rem',
                          background: '#0a1120',
                          borderRadius: '0.375rem',
                          maxHeight: '300px',
                          overflowY: 'auto',
                          fontSize: '0.75rem'
                        }}
                        showLineNumbers
                      >
                        {change.content}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {change.type === 'delete' && change.path && (
              <div className="mb-3">
                <p className="text-gray-300 text-xs font-medium mb-2">Archivo a eliminar:</p>
                <SyntaxHighlighter
                  language={change.language || 'javascript'}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: '0.75rem',
                    background: '#0a1120',
                    borderRadius: '0.375rem',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    fontSize: '0.75rem'
                  }}
                  showLineNumbers
                >
                  {getOriginalContent(change.path)}
                </SyntaxHighlighter>
              </div>
            )}
            
            {!change.isApproved && !change.isRejected && onApproveChange && onRejectChange && (
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onApproveChange(change.id);
                  }}
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs flex items-center transition-colors"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  <span>Aprobar</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRejectChange(change.id);
                  }}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs flex items-center transition-colors"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  <span>Rechazar</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md border border-codestorm-blue/30 p-4">
      {/* Filtros y búsqueda */}
      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-codestorm-darker border border-codestorm-blue/30 rounded-md py-1 px-2 text-white text-sm"
          >
            <option value="all">Todos los tipos</option>
            <option value="create">Creados</option>
            <option value="modify">Modificados</option>
            <option value="delete">Eliminados</option>
          </select>
        </div>
        
        {availableLanguages.length > 0 && (
          <div className="flex items-center space-x-2">
            <Code className="h-4 w-4 text-gray-400" />
            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="bg-codestorm-darker border border-codestorm-blue/30 rounded-md py-1 px-2 text-white text-sm"
            >
              <option value="all">Todos los lenguajes</option>
              {availableLanguages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        )}
        
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar cambios..."
            className="w-full bg-codestorm-darker border border-codestorm-blue/30 rounded-md py-1 px-2 text-white text-sm pl-8"
          />
          <Search className="h-4 w-4 text-gray-400 absolute left-2 top-1.5" />
        </div>
      </div>
      
      {/* Lista de cambios */}
      <div className="space-y-2">
        {filteredChanges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <AlertTriangle className="h-8 w-8 mb-2 opacity-30" />
            <p>No se encontraron cambios con los filtros seleccionados</p>
          </div>
        ) : (
          filteredChanges.map(change => renderChange(change))
        )}
      </div>
    </div>
  );
};

export default DetailedChangesViewer;
