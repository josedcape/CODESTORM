import React from 'react';
import { 
  Search, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader, 
  Clock, 
  Target,
  Edit3,
  BarChart3,
  FileCheck,
  Zap
} from 'lucide-react';
import { AutomaticModificationProcess } from '../hooks/useAutomaticModification';

interface AutomaticModificationPanelProps {
  currentProcess: AutomaticModificationProcess | null;
  onCancel?: () => void;
  onClear?: () => void;
}

/**
 * Panel para mostrar el progreso y resultados de modificaciones automáticas
 */
export const AutomaticModificationPanel: React.FC<AutomaticModificationPanelProps> = ({
  currentProcess,
  onCancel,
  onClear
}) => {
  if (!currentProcess) {
    return (
      <div className="p-6 bg-codestorm-darker border border-gray-700 rounded-lg text-center">
        <Zap className="w-8 h-8 text-purple-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-white mb-2">
          Sistema de Modificación Automática
        </h3>
        <p className="text-gray-400 text-sm">
          Listo para analizar y modificar archivos automáticamente
        </p>
      </div>
    );
  }

  const { state, instruction, timestamp, filesModified } = currentProcess;
  const { currentPhase, progress, detectionResult, modificationResult, error, analysisLog } = state;

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'detecting':
        return <Search className="w-4 h-4 text-blue-400 animate-pulse" />;
      case 'analyzing':
        return <Target className="w-4 h-4 text-yellow-400 animate-pulse" />;
      case 'modifying':
        return <Edit3 className="w-4 h-4 text-purple-400 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'detecting':
        return 'Detectando Archivos';
      case 'analyzing':
        return 'Analizando Código';
      case 'modifying':
        return 'Aplicando Cambios';
      case 'completed':
        return 'Completado';
      case 'error':
        return 'Error';
      default:
        return 'Preparando';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Header del proceso */}
      <div className="p-4 bg-codestorm-darker border border-purple-500/30 rounded-lg">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {getPhaseIcon(currentPhase)}
            <div>
              <h3 className="text-white font-medium">
                {getPhaseLabel(currentPhase)}
              </h3>
              <p className="text-xs text-gray-400">
                Iniciado: {formatTimestamp(timestamp)}
              </p>
            </div>
          </div>
          
          {state.isProcessing && onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Cancelar
            </button>
          )}
          
          {!state.isProcessing && onClear && (
            <button
              onClick={onClear}
              className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Instrucción */}
        <div className="p-3 bg-codestorm-card border border-gray-600 rounded">
          <p className="text-sm text-gray-300">
            <span className="text-purple-400 font-medium">Instrucción:</span> {instruction}
          </p>
        </div>

        {/* Barra de progreso */}
        {state.isProcessing && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progreso</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Error</span>
            </div>
            <p className="text-sm text-red-300 mt-1">{error}</p>
          </div>
        )}
      </div>

      {/* Resultados de detección */}
      {detectionResult && (
        <div className="p-4 bg-codestorm-darker border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-blue-400" />
            <h4 className="text-white font-medium">Detección de Archivos</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Archivos detectados:</span>
              <span className="text-sm text-white font-medium">
                {detectionResult.targetFiles.length}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Confianza:</span>
              <span className="text-sm text-white font-medium">
                {(detectionResult.confidence * 100).toFixed(1)}%
              </span>
            </div>

            {detectionResult.targetFiles.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Archivos objetivo:</p>
                <div className="space-y-1">
                  {detectionResult.targetFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <FileText className="w-3 h-3 text-blue-400" />
                      <span className="text-gray-300">{file.path}</span>
                      <span className="text-gray-500">({file.language || 'unknown'})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-2 bg-codestorm-card border border-gray-600 rounded">
              <p className="text-xs text-gray-300">{detectionResult.analysisReason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Resultados de modificación */}
      {modificationResult && (
        <div className="p-4 bg-codestorm-darker border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <FileCheck className="w-4 h-4 text-green-400" />
            <h4 className="text-white font-medium">Resultados de Modificación</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="text-center p-3 bg-codestorm-card border border-gray-600 rounded">
              <div className="text-lg font-bold text-green-400">
                {modificationResult.modifiedFiles.length}
              </div>
              <div className="text-xs text-gray-400">Archivos Modificados</div>
            </div>
            
            <div className="text-center p-3 bg-codestorm-card border border-gray-600 rounded">
              <div className="text-lg font-bold text-purple-400">
                {modificationResult.changes.reduce((sum, change) => sum + change.linesChanged, 0)}
              </div>
              <div className="text-xs text-gray-400">Líneas Cambiadas</div>
            </div>
          </div>

          {modificationResult.changes.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Cambios aplicados:</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {modificationResult.changes.map((change, index) => (
                  <div key={index} className="p-2 bg-codestorm-card border border-gray-600 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <Edit3 className="w-3 h-3 text-purple-400" />
                      <span className="text-xs text-white font-medium">{change.filePath}</span>
                      <span className="text-xs text-gray-500">({change.linesChanged} líneas)</span>
                    </div>
                    <p className="text-xs text-gray-300">{change.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log de análisis */}
      {analysisLog.length > 0 && (
        <div className="p-4 bg-codestorm-darker border border-gray-600 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <h4 className="text-white font-medium">Log de Proceso</h4>
          </div>
          
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {analysisLog.map((log, index) => (
              <div key={index} className="text-xs text-gray-300 font-mono">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomaticModificationPanel;
