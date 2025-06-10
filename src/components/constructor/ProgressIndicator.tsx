import React, { useState } from 'react';
import { Clock, CheckCircle, AlertTriangle, Pause, Play, X, List, ChevronDown, ChevronUp } from 'lucide-react';
import { ProgressData } from '../../types';

interface ProgressIndicatorProps {
  progress: ProgressData;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onViewLog?: () => void;
  isPaused?: boolean;
  showControls?: boolean;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  onPause,
  onResume,
  onCancel,
  onViewLog,
  isPaused = false,
  showControls = true
}) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // Validación de seguridad para el objeto progress
  if (!progress) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 max-w-4xl mx-auto">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>Cargando información de progreso...</p>
        </div>
      </div>
    );
  }

  // Formatear el tiempo restante
  const formatTimeRemaining = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.ceil(minutes)} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.ceil(minutes % 60);

    return `${hours} h ${remainingMinutes} min`;
  };

  // Calcular el tiempo transcurrido
  const calculateElapsedTime = (): string => {
    if (!progress.startTime) return '0 min';

    const elapsedMs = Date.now() - progress.startTime;
    const elapsedMinutes = elapsedMs / (1000 * 60);

    return formatTimeRemaining(elapsedMinutes);
  };

  // Ordenar los items por porcentaje de progreso (descendente)
  const sortedItems = progress.itemsProgress ? Object.values(progress.itemsProgress).sort((a, b) => {
    // Primero los completados
    if (a.status === 'completed' && b.status !== 'completed') return -1;
    if (a.status !== 'completed' && b.status === 'completed') return 1;

    // Luego por porcentaje
    return b.percentage - a.percentage;
  }) : [];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Progreso del Proyecto
        </h3>
        <div className="flex items-center space-x-2">
          {progress.estimatedTimeRemaining !== undefined && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Clock className="h-4 w-4 mr-1" />
              <span>Tiempo restante: {formatTimeRemaining(progress.estimatedTimeRemaining)}</span>
            </div>
          )}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
          <span>Fase actual: {progress.currentPhase || 'Iniciando...'}</span>
          <span>{(progress.percentage || 0).toFixed(0)}% completado</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${progress.percentage || 0}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Elementos completados: {progress.completedItems || 0} de {progress.totalItems || 0}</span>
          <span>Tiempo transcurrido: {calculateElapsedTime()}</span>
        </div>
      </div>

      {showControls && (
        <div className="flex flex-wrap justify-end space-x-2 mb-4">
          {isPaused ? (
            <button
              onClick={onResume}
              className="flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md"
            >
              <Play className="h-4 w-4 mr-1" />
              Reanudar
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex items-center px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-md"
            >
              <Pause className="h-4 w-4 mr-1" />
              Pausar
            </button>
          )}

          <button
            onClick={onCancel}
            className="flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </button>

          <button
            onClick={onViewLog}
            className="flex items-center px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md"
          >
            <List className="h-4 w-4 mr-1" />
            Ver registro
          </button>
        </div>
      )}

      {showDetails && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-md font-medium text-gray-800 dark:text-white mb-2">
            Desglose por componente
          </h4>
          <div className="space-y-3">
            {sortedItems.map(item => (
              <div key={item.id} className="text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700 dark:text-gray-300">{item.title}</span>
                  <div className="flex items-center">
                    {item.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    )}
                    {item.status === 'failed' && (
                      <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`
                      ${item.status === 'completed' ? 'text-green-500' :
                        item.status === 'failed' ? 'text-red-500' :
                        'text-gray-500 dark:text-gray-400'}
                    `}>
                      {item.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ease-in-out ${
                      item.status === 'completed' ? 'bg-green-500' :
                      item.status === 'failed' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;
