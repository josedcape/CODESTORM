import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Clock, 
  Activity,
  FileText,
  Code,
  Save,
  History
} from 'lucide-react';
import { ProjectExecution, ExecutionLog, ProjectBackup } from '../../pages/Agent';

interface ExecutionMonitorProps {
  execution: ProjectExecution | null;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRollback: (backupId: string) => void;
  onStepComplete?: (stepId: string, result: any) => void;
  onStatusUpdate?: (status: string, level: 'info' | 'warning' | 'error' | 'success') => void;
}

const ExecutionMonitor: React.FC<ExecutionMonitorProps> = ({
  execution,
  onPause,
  onResume,
  onStop,
  onRollback,
  onStepComplete,
  onStatusUpdate
}) => {
  const [showLogs, setShowLogs] = useState(true);
  const [showBackups, setShowBackups] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ExecutionLog | null>(null);

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-green-300 bg-green-500/10 border-green-500/20';
      case 'error':
        return 'text-red-300 bg-red-500/10 border-red-500/20';
      case 'warning':
        return 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'text-blue-300 bg-blue-500/10 border-blue-500/20';
    }
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (start: number, end?: number): string => {
    const duration = (end || Date.now()) - start;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (!execution) {
    return (
      <div className="bg-codestorm-dark rounded-lg p-6">
        <div className="text-center text-gray-400">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay ejecución activa</p>
          <p className="text-sm mt-2">Aprueba un plan para comenzar la ejecución</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-codestorm-dark rounded-lg overflow-hidden">
      {/* Header con controles */}
      <div className="p-4 border-b border-codestorm-blue/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Activity className="w-5 h-5 mr-2 text-codestorm-accent" />
              Monitor de Ejecución
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Estado: <span className="capitalize text-white">{execution.status}</span>
            </p>
          </div>
          
          {/* Controles de ejecución */}
          <div className="flex items-center space-x-2">
            {execution.status === 'running' && (
              <button
                onClick={onPause}
                className="p-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded hover:bg-yellow-500/30 transition-colors"
                title="Pausar ejecución"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
            
            {execution.status === 'paused' && (
              <button
                onClick={onResume}
                className="p-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors"
                title="Reanudar ejecución"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            
            {(execution.status === 'running' || execution.status === 'paused') && (
              <button
                onClick={onStop}
                className="p-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors"
                title="Detener ejecución"
              >
                <Square className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Progreso</span>
            <span>{execution.progress}%</span>
          </div>
          <div className="w-full bg-codestorm-darker rounded-full h-2">
            <div 
              className="bg-codestorm-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${execution.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Información de tiempo */}
        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Iniciado: {formatTime(execution.startTime)}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <Activity className="w-4 h-4" />
            <span>Duración: {formatDuration(execution.startTime, execution.endTime)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-codestorm-blue/30">
        <button
          onClick={() => {
            setShowLogs(true);
            setShowBackups(false);
          }}
          className={`px-4 py-2 text-sm font-medium ${
            showLogs 
              ? 'text-codestorm-accent border-b-2 border-codestorm-accent' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FileText className="inline-block w-4 h-4 mr-2" />
          Logs ({execution.logs.length})
        </button>
        <button
          onClick={() => {
            setShowLogs(false);
            setShowBackups(true);
          }}
          className={`px-4 py-2 text-sm font-medium ${
            showBackups 
              ? 'text-codestorm-accent border-b-2 border-codestorm-accent' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <History className="inline-block w-4 h-4 mr-2" />
          Backups ({execution.backups.length})
        </button>
      </div>

      {/* Contenido de logs */}
      {showLogs && (
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-2">
            {execution.logs.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No hay logs disponibles</p>
              </div>
            ) : (
              execution.logs
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                    className={`p-3 rounded border cursor-pointer transition-colors ${getLogColor(log.level)} ${
                      selectedLog?.id === log.id ? 'ring-2 ring-codestorm-accent' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {getLogIcon(log.level)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{log.message}</span>
                          <span className="text-xs opacity-70">{formatTime(log.timestamp)}</span>
                        </div>
                        
                        {selectedLog?.id === log.id && log.details && (
                          <div className="mt-2 p-2 bg-black/20 rounded text-xs">
                            <pre className="whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Contenido de backups */}
      {showBackups && (
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-3">
            {execution.backups.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Save className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No hay backups disponibles</p>
              </div>
            ) : (
              execution.backups
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((backup) => (
                  <div
                    key={backup.id}
                    className="p-3 bg-codestorm-darker rounded border border-codestorm-blue/30"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-white">{backup.description}</h4>
                        <div className="text-xs text-gray-400 mt-1">
                          <span>{formatTime(backup.timestamp)}</span>
                          <span className="mx-2">•</span>
                          <span>{Object.keys(backup.files).length} archivos</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onRollback(backup.id)}
                        className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded hover:bg-yellow-500/30 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3 inline mr-1" />
                        Restaurar
                      </button>
                    </div>
                    
                    {/* Lista de archivos en el backup */}
                    <div className="mt-2">
                      <div className="text-xs text-gray-400 mb-1">Archivos incluidos:</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.keys(backup.files).slice(0, 5).map((filePath, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-codestorm-blue/20 text-codestorm-accent rounded"
                          >
                            {filePath.split('/').pop()}
                          </span>
                        ))}
                        {Object.keys(backup.files).length > 5 && (
                          <span className="text-xs px-2 py-1 bg-gray-500/20 text-gray-400 rounded">
                            +{Object.keys(backup.files).length - 5} más
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Estado final */}
      {execution.status === 'completed' && (
        <div className="p-4 border-t border-codestorm-blue/30 bg-green-500/10">
          <div className="flex items-center space-x-2 text-green-300">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Ejecución completada exitosamente</span>
          </div>
        </div>
      )}

      {execution.status === 'failed' && (
        <div className="p-4 border-t border-codestorm-blue/30 bg-red-500/10">
          <div className="flex items-center space-x-2 text-red-300">
            <XCircle className="w-4 h-4" />
            <span className="text-sm">Ejecución falló - Revisa los logs para más detalles</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionMonitor;
