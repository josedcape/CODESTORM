import React, { useState } from 'react';
import {
  FileItem,
  FileContext,
  FileObservation,
  FileObserverState,
  FileAnalysis,
  FileChangeAnalysis
} from '../../types';
import {
  Eye,
  EyeOff,
  FileText,
  Code,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  Zap,
  ChevronDown,
  ChevronUp,
  Info,
  Link,
  Package,
  CodeSquare,
  Layers,
  Search,
  ExternalLink
} from 'lucide-react';
import LectorSummary from '../lector/LectorSummary';

interface FileObserverPanelProps {
  files: FileItem[];
  observerState: FileObserverState | undefined;
  onToggleObserver: () => void;
  onScanFiles: () => void;
  isScanning: boolean;
  fileAnalyses?: FileAnalysis[];
  onAnalyzeFile?: (file: FileItem) => void;
  onViewFileDetails?: (file: FileItem) => void;
}

const FileObserverPanel: React.FC<FileObserverPanelProps> = ({
  files,
  observerState,
  onToggleObserver,
  onScanFiles,
  isScanning,
  fileAnalyses = [],
  onAnalyzeFile,
  onViewFileDetails
}) => {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'context' | 'observations' | 'analysis'>('context');

  // Si no hay estado del observador, mostrar mensaje
  if (!observerState) {
    return (
      <div className="bg-codestorm-dark rounded-lg shadow-md p-6 border border-codestorm-blue/30">
        <div className="flex flex-col items-center justify-center text-gray-400 py-8">
          <EyeOff className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-center text-lg">
            Observador de Archivos Inactivo
          </p>
          <p className="text-center text-sm mt-2">
            Activa el observador para analizar los archivos del proyecto
          </p>
          <button
            onClick={onToggleObserver}
            className="mt-4 px-4 py-2 bg-codestorm-blue hover:bg-blue-600 text-white rounded-md text-sm"
          >
            Activar Observador
          </button>
        </div>
      </div>
    );
  }

  // Obtener estadísticas
  const totalFiles = observerState.observedFiles.length;
  const totalObservations = observerState.observations.length;
  const lastScanTime = new Date(observerState.lastScan).toLocaleTimeString();

  // Agrupar observaciones por tipo
  const observationsByType = {
    dependency: observerState.observations.filter(obs => obs.type === 'dependency'),
    structure: observerState.observations.filter(obs => obs.type === 'structure'),
    pattern: observerState.observations.filter(obs => obs.type === 'pattern'),
    suggestion: observerState.observations.filter(obs => obs.type === 'suggestion'),
    warning: observerState.observations.filter(obs => obs.type === 'warning')
  };

  // Función para obtener el icono según el tipo de observación
  const getObservationIcon = (type: string) => {
    switch (type) {
      case 'dependency':
        return <Link className="h-4 w-4 text-blue-400" />;
      case 'structure':
        return <Layers className="h-4 w-4 text-purple-400" />;
      case 'pattern':
        return <Code className="h-4 w-4 text-green-400" />;
      case 'suggestion':
        return <Lightbulb className="h-4 w-4 text-yellow-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  // Función para renderizar el contexto de un archivo
  const renderFileContext = (context: FileContext) => {
    return (
      <div className="space-y-3">
        <div className="bg-codestorm-blue/10 p-3 rounded-md border border-codestorm-blue/20">
          <h4 className="text-sm font-medium text-white mb-1">Descripción</h4>
          <p className="text-xs text-gray-300">{context.description}</p>
        </div>

        {context.imports.length > 0 && (
          <div>
            <div className="flex items-center text-sm text-white mb-1">
              <Package className="h-4 w-4 mr-1 text-blue-400" />
              <h4 className="font-medium">Importaciones ({context.imports.length})</h4>
            </div>
            <ul className="text-xs text-gray-300 space-y-1 pl-5">
              {context.imports.slice(0, 5).map((imp, index) => (
                <li key={index} className="list-disc">{imp}</li>
              ))}
              {context.imports.length > 5 && (
                <li className="text-gray-400 italic">Y {context.imports.length - 5} más...</li>
              )}
            </ul>
          </div>
        )}

        {context.exports.length > 0 && (
          <div>
            <div className="flex items-center text-sm text-white mb-1">
              <Zap className="h-4 w-4 mr-1 text-yellow-400" />
              <h4 className="font-medium">Exportaciones ({context.exports.length})</h4>
            </div>
            <ul className="text-xs text-gray-300 space-y-1 pl-5">
              {context.exports.slice(0, 5).map((exp, index) => (
                <li key={index} className="list-disc">{exp}</li>
              ))}
              {context.exports.length > 5 && (
                <li className="text-gray-400 italic">Y {context.exports.length - 5} más...</li>
              )}
            </ul>
          </div>
        )}

        {context.functions.length > 0 && (
          <div>
            <div className="flex items-center text-sm text-white mb-1">
              <CodeSquare className="h-4 w-4 mr-1 text-green-400" />
              <h4 className="font-medium">Funciones ({context.functions.length})</h4>
            </div>
            <ul className="text-xs text-gray-300 space-y-1 pl-5">
              {context.functions.slice(0, 5).map((func, index) => (
                <li key={index} className="list-disc">{func}</li>
              ))}
              {context.functions.length > 5 && (
                <li className="text-gray-400 italic">Y {context.functions.length - 5} más...</li>
              )}
            </ul>
          </div>
        )}

        {context.classes.length > 0 && (
          <div>
            <div className="flex items-center text-sm text-white mb-1">
              <Layers className="h-4 w-4 mr-1 text-purple-400" />
              <h4 className="font-medium">Clases ({context.classes.length})</h4>
            </div>
            <ul className="text-xs text-gray-300 space-y-1 pl-5">
              {context.classes.slice(0, 5).map((cls, index) => (
                <li key={index} className="list-disc">{cls}</li>
              ))}
              {context.classes.length > 5 && (
                <li className="text-gray-400 italic">Y {context.classes.length - 5} más...</li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Función para renderizar las observaciones de un archivo
  const renderFileObservations = (fileId: string) => {
    const fileObservations = observerState.observations.filter(obs => obs.fileId === fileId);

    if (fileObservations.length === 0) {
      return (
        <div className="text-center text-gray-400 py-4">
          No hay observaciones para este archivo
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {fileObservations.map(observation => (
          <div
            key={observation.id}
            className={`p-2 rounded-md ${
              observation.type === 'warning' ? 'bg-red-500/10 border border-red-500/30' :
              observation.type === 'suggestion' ? 'bg-yellow-500/10 border border-yellow-500/30' :
              observation.type === 'pattern' ? 'bg-green-500/10 border border-green-500/30' :
              observation.type === 'dependency' ? 'bg-blue-500/10 border border-blue-500/30' :
              'bg-purple-500/10 border border-purple-500/30'
            }`}
          >
            <div className="flex items-start">
              {getObservationIcon(observation.type)}
              <div className="ml-2">
                <p className="text-xs text-white">{observation.observation}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(observation.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md border border-codestorm-blue/30 flex flex-col h-full">
      <div className="bg-codestorm-blue/20 p-3 border-b border-codestorm-blue/30 flex justify-between items-center">
        <div className="flex items-center">
          <Eye className={`h-5 w-5 mr-2 ${observerState.isActive ? 'text-green-400' : 'text-gray-400'}`} />
          <h2 className="text-sm font-medium text-white">Observador de Archivos</h2>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={onScanFiles}
            disabled={isScanning || !observerState.isActive}
            className={`p-1.5 rounded ${
              isScanning ? 'text-green-400' :
              !observerState.isActive ? 'text-gray-600 cursor-not-allowed' :
              'text-gray-400 hover:bg-codestorm-blue/20 hover:text-white'
            }`}
            title="Escanear archivos"
          >
            <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onToggleObserver}
            className={`p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white`}
            title={observerState.isActive ? "Desactivar observador" : "Activar observador"}
          >
            {observerState.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="p-3 border-b border-codestorm-blue/30">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-codestorm-blue/10 p-2 rounded-md text-center">
            <p className="text-xs text-gray-400">Archivos</p>
            <p className="text-lg font-medium text-white">{totalFiles}</p>
          </div>

          <div className="bg-codestorm-blue/10 p-2 rounded-md text-center">
            <p className="text-xs text-gray-400">Observaciones</p>
            <p className="text-lg font-medium text-white">{totalObservations}</p>
          </div>

          <div className="bg-codestorm-blue/10 p-2 rounded-md text-center">
            <p className="text-xs text-gray-400">Último escaneo</p>
            <p className="text-sm font-medium text-white">{lastScanTime}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <div className="space-y-2">
          {files.map(file => {
            const isExpanded = expandedFile === file.id;
            const fileContext = observerState.fileContexts.find(ctx => ctx.fileId === file.id);
            const fileObservationsCount = observerState.observations.filter(obs => obs.fileId === file.id).length;

            return (
              <div key={file.id} className="bg-codestorm-blue/10 rounded-md overflow-hidden">
                <div
                  className="flex items-center justify-between p-2 cursor-pointer hover:bg-codestorm-blue/20"
                  onClick={() => setExpandedFile(isExpanded ? null : file.id)}
                >
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-white">{file.name}</span>
                    {fileObservationsCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-codestorm-blue/30 rounded-full text-white">
                        {fileObservationsCount}
                      </span>
                    )}
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-codestorm-blue/20 p-3">
                    <div className="flex border-b border-codestorm-blue/20 mb-3">
                      <button
                        className={`px-3 py-1 text-sm ${
                          activeTab === 'context'
                            ? 'text-white border-b-2 border-codestorm-accent'
                            : 'text-gray-400 hover:text-white'
                        }`}
                        onClick={() => setActiveTab('context')}
                      >
                        Contexto
                      </button>
                      <button
                        className={`px-3 py-1 text-sm ${
                          activeTab === 'observations'
                            ? 'text-white border-b-2 border-codestorm-accent'
                            : 'text-gray-400 hover:text-white'
                        }`}
                        onClick={() => setActiveTab('observations')}
                      >
                        Observaciones {fileObservationsCount > 0 && `(${fileObservationsCount})`}
                      </button>
                      <button
                        className={`px-3 py-1 text-sm ${
                          activeTab === 'analysis'
                            ? 'text-white border-b-2 border-codestorm-accent'
                            : 'text-gray-400 hover:text-white'
                        }`}
                        onClick={() => {
                          setActiveTab('analysis');
                          // Si no hay análisis para este archivo y existe la función para analizar, llamarla
                          if (onAnalyzeFile && !fileAnalyses.some(analysis => analysis.fileId === file.id)) {
                            onAnalyzeFile(file);
                          }
                        }}
                      >
                        Análisis Profundo
                      </button>
                    </div>

                    {activeTab === 'context' ? (
                      fileContext ? renderFileContext(fileContext) : (
                        <div className="text-center text-gray-400 py-4">
                          No hay información de contexto disponible
                        </div>
                      )
                    ) : activeTab === 'observations' ? (
                      renderFileObservations(file.id)
                    ) : (
                      // Pestaña de análisis
                      <div>
                        {fileAnalyses.some(analysis => analysis.fileId === file.id) ? (
                          <div>
                            <LectorSummary
                              fileAnalysis={fileAnalyses.find(analysis => analysis.fileId === file.id) || null}
                              changeAnalysis={null}
                              onViewDetails={() => onViewFileDetails && onViewFileDetails(file)}
                            />

                            {onViewFileDetails && (
                              <div className="mt-3 text-center">
                                <button
                                  onClick={() => onViewFileDetails(file)}
                                  className="px-3 py-1.5 bg-codestorm-accent hover:bg-blue-600 text-white rounded-md text-xs flex items-center justify-center mx-auto transition-colors"
                                >
                                  <Search className="h-3 w-3 mr-1.5" />
                                  <span>Ver análisis completo</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-4">
                            {onAnalyzeFile ? (
                              <>
                                <FileText className="h-8 w-8 text-gray-500 mb-2" />
                                <p className="text-gray-400 text-sm mb-3">Analizando archivo...</p>
                                <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 animate-pulse"></div>
                                </div>
                              </>
                            ) : (
                              <>
                                <FileText className="h-8 w-8 text-gray-500 mb-2" />
                                <p className="text-gray-400 text-sm">No hay análisis disponible</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {files.length === 0 && (
            <div className="text-center text-gray-400 py-4">
              No hay archivos para observar
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-codestorm-blue/30">
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 rounded-full bg-yellow-400 mr-1"></div>
            <span className="text-gray-300">Sugerencias: {observationsByType.suggestion.length}</span>
          </div>

          <div className="flex items-center text-xs">
            <div className="w-3 h-3 rounded-full bg-red-400 mr-1"></div>
            <span className="text-gray-300">Advertencias: {observationsByType.warning.length}</span>
          </div>

          <div className="flex items-center text-xs">
            <div className="w-3 h-3 rounded-full bg-blue-400 mr-1"></div>
            <span className="text-gray-300">Dependencias: {observationsByType.dependency.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileObserverPanel;
