import React, { useState } from 'react';
import { FileItem } from '../../types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  File, 
  Plus, 
  Trash, 
  Edit, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  X,
  Eye,
  ArrowLeftRight
} from 'lucide-react';

interface ChangePreviewProps {
  originalFiles: FileItem[];
  modifiedFiles: FileItem[];
  onApprove: () => void;
  onReject: () => void;
}

const ChangePreview: React.FC<ChangePreviewProps> = ({
  originalFiles,
  modifiedFiles,
  onApprove,
  onReject
}) => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(true);
  
  // Determinar qué archivos se han añadido, modificado o eliminado
  const addedFiles: FileItem[] = modifiedFiles.filter(
    file => !originalFiles.some(f => f.id === file.id)
  );
  
  const removedFiles: FileItem[] = originalFiles.filter(
    file => !modifiedFiles.some(f => f.id === file.id)
  );
  
  const modifiedFileIds: string[] = modifiedFiles
    .filter(file => 
      originalFiles.some(f => f.id === file.id && f.content !== file.content)
    )
    .map(file => file.id);
  
  // Obtener el archivo seleccionado
  const selectedOriginalFile = originalFiles.find(f => f.id === selectedFileId);
  const selectedModifiedFile = modifiedFiles.find(f => f.id === selectedFileId);
  
  // Determinar el tipo de cambio para el archivo seleccionado
  const getChangeType = (fileId: string) => {
    if (addedFiles.some(f => f.id === fileId)) return 'added';
    if (removedFiles.some(f => f.id === fileId)) return 'removed';
    if (modifiedFileIds.includes(fileId)) return 'modified';
    return 'unchanged';
  };
  
  // Renderizar el icono según el tipo de cambio
  const renderChangeIcon = (fileId: string) => {
    const changeType = getChangeType(fileId);
    
    switch (changeType) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'removed':
        return <Trash className="h-4 w-4 text-red-500" />;
      case 'modified':
        return <Edit className="h-4 w-4 text-yellow-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Renderizar el contenido del archivo
  const renderFileContent = () => {
    if (!selectedFileId) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <File className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-center">
            Selecciona un archivo para ver los cambios
          </p>
        </div>
      );
    }
    
    const changeType = getChangeType(selectedFileId);
    
    if (changeType === 'added') {
      return (
        <div className="h-full">
          <div className="bg-green-500/10 p-2 border-b border-green-500/30">
            <div className="flex items-center">
              <Plus className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-green-400 text-sm">Archivo añadido</span>
            </div>
          </div>
          
          <div className="h-[calc(100%-2.5rem)] overflow-auto">
            <SyntaxHighlighter
              language={selectedModifiedFile?.language || 'text'}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '1rem',
                background: '#0a1120',
                minHeight: '100%',
                borderRadius: 0,
              }}
              showLineNumbers
            >
              {selectedModifiedFile?.content || ''}
            </SyntaxHighlighter>
          </div>
        </div>
      );
    }
    
    if (changeType === 'removed') {
      return (
        <div className="h-full">
          <div className="bg-red-500/10 p-2 border-b border-red-500/30">
            <div className="flex items-center">
              <Trash className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-red-400 text-sm">Archivo eliminado</span>
            </div>
          </div>
          
          <div className="h-[calc(100%-2.5rem)] overflow-auto">
            <SyntaxHighlighter
              language={selectedOriginalFile?.language || 'text'}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '1rem',
                background: '#0a1120',
                minHeight: '100%',
                borderRadius: 0,
              }}
              showLineNumbers
            >
              {selectedOriginalFile?.content || ''}
            </SyntaxHighlighter>
          </div>
        </div>
      );
    }
    
    if (changeType === 'modified') {
      if (showDiff) {
        // Mostrar vista de diferencias
        return (
          <div className="h-full">
            <div className="bg-yellow-500/10 p-2 border-b border-yellow-500/30 flex justify-between items-center">
              <div className="flex items-center">
                <Edit className="h-4 w-4 text-yellow-500 mr-2" />
                <span className="text-yellow-400 text-sm">Archivo modificado</span>
              </div>
              <button
                onClick={() => setShowDiff(false)}
                className="flex items-center text-xs text-gray-400 hover:text-white"
                title="Ver archivos por separado"
              >
                <ArrowLeftRight className="h-3 w-3 mr-1" />
                <span>Ver por separado</span>
              </button>
            </div>
            
            <div className="h-[calc(100%-2.5rem)] overflow-auto">
              {/* Aquí iría un componente de diff más sofisticado */}
              <div className="grid grid-cols-2 h-full">
                <div className="border-r border-gray-700">
                  <div className="bg-red-500/10 p-1 text-xs text-center text-red-400">
                    Original
                  </div>
                  <SyntaxHighlighter
                    language={selectedOriginalFile?.language || 'text'}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      background: '#0a1120',
                      minHeight: 'calc(100% - 1.5rem)',
                      borderRadius: 0,
                    }}
                    showLineNumbers
                  >
                    {selectedOriginalFile?.content || ''}
                  </SyntaxHighlighter>
                </div>
                <div>
                  <div className="bg-green-500/10 p-1 text-xs text-center text-green-400">
                    Modificado
                  </div>
                  <SyntaxHighlighter
                    language={selectedModifiedFile?.language || 'text'}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      background: '#0a1120',
                      minHeight: 'calc(100% - 1.5rem)',
                      borderRadius: 0,
                    }}
                    showLineNumbers
                  >
                    {selectedModifiedFile?.content || ''}
                  </SyntaxHighlighter>
                </div>
              </div>
            </div>
          </div>
        );
      } else {
        // Mostrar vista de antes/después
        return (
          <div className="h-full">
            <div className="bg-yellow-500/10 p-2 border-b border-yellow-500/30 flex justify-between items-center">
              <div className="flex items-center">
                <Edit className="h-4 w-4 text-yellow-500 mr-2" />
                <span className="text-yellow-400 text-sm">Archivo modificado</span>
              </div>
              <button
                onClick={() => setShowDiff(true)}
                className="flex items-center text-xs text-gray-400 hover:text-white"
                title="Ver diferencias lado a lado"
              >
                <Eye className="h-3 w-3 mr-1" />
                <span>Ver diferencias</span>
              </button>
            </div>
            
            <div className="h-[calc(100%-2.5rem)] overflow-auto">
              <SyntaxHighlighter
                language={selectedModifiedFile?.language || 'text'}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  background: '#0a1120',
                  minHeight: '100%',
                  borderRadius: 0,
                }}
                showLineNumbers
              >
                {selectedModifiedFile?.content || ''}
              </SyntaxHighlighter>
            </div>
          </div>
        );
      }
    }
    
    // Archivo sin cambios
    return (
      <div className="h-full">
        <div className="bg-gray-700/30 p-2 border-b border-gray-600">
          <div className="flex items-center">
            <File className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-gray-400 text-sm">Archivo sin cambios</span>
          </div>
        </div>
        
        <div className="h-[calc(100%-2.5rem)] overflow-auto">
          <SyntaxHighlighter
            language={selectedOriginalFile?.language || 'text'}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: '#0a1120',
              minHeight: '100%',
              borderRadius: 0,
            }}
            showLineNumbers
          >
            {selectedOriginalFile?.content || ''}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md border border-codestorm-blue/30 flex flex-col h-full">
      <div className="p-3 border-b border-codestorm-blue/30">
        <h2 className="text-sm font-medium text-white">Vista Previa de Cambios</h2>
      </div>
      
      <div className="flex-1 flex">
        {/* Lista de archivos */}
        <div className="w-64 border-r border-codestorm-blue/30 overflow-y-auto">
          <div className="p-2">
            {addedFiles.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center text-xs text-green-400 mb-1">
                  <Plus className="h-3 w-3 mr-1" />
                  <span>Archivos añadidos ({addedFiles.length})</span>
                </div>
                <div className="space-y-1">
                  {addedFiles.map(file => (
                    <div
                      key={file.id}
                      className={`flex items-center p-2 rounded-md cursor-pointer ${
                        selectedFileId === file.id
                          ? 'bg-codestorm-blue text-white'
                          : 'text-gray-300 hover:bg-codestorm-blue/10'
                      }`}
                      onClick={() => setSelectedFileId(file.id)}
                    >
                      <Plus className="h-3 w-3 text-green-500 mr-2" />
                      <span className="text-sm truncate">{file.path}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {modifiedFileIds.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center text-xs text-yellow-400 mb-1">
                  <Edit className="h-3 w-3 mr-1" />
                  <span>Archivos modificados ({modifiedFileIds.length})</span>
                </div>
                <div className="space-y-1">
                  {modifiedFiles
                    .filter(file => modifiedFileIds.includes(file.id))
                    .map(file => (
                      <div
                        key={file.id}
                        className={`flex items-center p-2 rounded-md cursor-pointer ${
                          selectedFileId === file.id
                            ? 'bg-codestorm-blue text-white'
                            : 'text-gray-300 hover:bg-codestorm-blue/10'
                        }`}
                        onClick={() => setSelectedFileId(file.id)}
                      >
                        <Edit className="h-3 w-3 text-yellow-500 mr-2" />
                        <span className="text-sm truncate">{file.path}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {removedFiles.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center text-xs text-red-400 mb-1">
                  <Trash className="h-3 w-3 mr-1" />
                  <span>Archivos eliminados ({removedFiles.length})</span>
                </div>
                <div className="space-y-1">
                  {removedFiles.map(file => (
                    <div
                      key={file.id}
                      className={`flex items-center p-2 rounded-md cursor-pointer ${
                        selectedFileId === file.id
                          ? 'bg-codestorm-blue text-white'
                          : 'text-gray-300 hover:bg-codestorm-blue/10'
                      }`}
                      onClick={() => setSelectedFileId(file.id)}
                    >
                      <Trash className="h-3 w-3 text-red-500 mr-2" />
                      <span className="text-sm truncate">{file.path}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Archivos sin cambios */}
            <div>
              <div className="flex items-center text-xs text-gray-400 mb-1">
                <File className="h-3 w-3 mr-1" />
                <span>Archivos sin cambios</span>
              </div>
              <div className="space-y-1">
                {modifiedFiles
                  .filter(file => 
                    !addedFiles.some(f => f.id === file.id) && 
                    !modifiedFileIds.includes(file.id)
                  )
                  .map(file => (
                    <div
                      key={file.id}
                      className={`flex items-center p-2 rounded-md cursor-pointer ${
                        selectedFileId === file.id
                          ? 'bg-codestorm-blue text-white'
                          : 'text-gray-300 hover:bg-codestorm-blue/10'
                      }`}
                      onClick={() => setSelectedFileId(file.id)}
                    >
                      <File className="h-3 w-3 text-gray-500 mr-2" />
                      <span className="text-sm truncate">{file.path}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Contenido del archivo */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            {renderFileContent()}
          </div>
          
          <div className="p-3 border-t border-codestorm-blue/30 flex justify-between">
            <div className="text-sm text-gray-400">
              {addedFiles.length > 0 && <span className="mr-3">+{addedFiles.length} añadidos</span>}
              {modifiedFileIds.length > 0 && <span className="mr-3">~{modifiedFileIds.length} modificados</span>}
              {removedFiles.length > 0 && <span>-{removedFiles.length} eliminados</span>}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={onReject}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm flex items-center"
              >
                <X className="h-4 w-4 mr-1" />
                <span>Rechazar</span>
              </button>
              <button
                onClick={onApprove}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm flex items-center"
              >
                <Check className="h-4 w-4 mr-1" />
                <span>Aprobar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePreview;
