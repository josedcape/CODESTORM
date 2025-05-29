import React, { useState } from 'react';
import { AlertTriangle, Clock, RefreshCw, Info, X } from 'lucide-react';

interface QuotaErrorNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  onRetry: () => void;
  errorDetails?: string;
}

const QuotaErrorNotification: React.FC<QuotaErrorNotificationProps> = ({
  isVisible,
  onClose,
  onRetry,
  errorDetails
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-codestorm-darker border border-red-500/30 rounded-lg max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/20 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Límite de API Alcanzado</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Se ha excedido la cuota de la API de Gemini. El sistema intentó usar modelos alternativos 
            pero todos están temporalmente limitados.
          </p>

          {/* Status */}
          <div className="bg-codestorm-blue/10 border border-codestorm-blue/30 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Estado del Sistema</span>
            </div>
            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Gemini 2.5:</span>
                <span className="text-red-400">Cuota excedida</span>
              </div>
              <div className="flex justify-between">
                <span>Claude 3.5:</span>
                <span className="text-yellow-400">Intentando...</span>
              </div>
              <div className="flex justify-between">
                <span>Modelos alternativos:</span>
                <span className="text-yellow-400">Disponibles</span>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-white">💡 Sugerencias:</h4>
            <ul className="space-y-1 text-xs text-gray-400">
              <li className="flex items-start space-x-2">
                <span className="text-blue-400">•</span>
                <span>Espera 15-30 minutos y vuelve a intentar</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400">•</span>
                <span>Usa instrucciones más simples y específicas</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400">•</span>
                <span>Divide tu proyecto en partes más pequeñas</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-400">•</span>
                <span>Refresca la página e intenta nuevamente</span>
              </li>
            </ul>
          </div>

          {/* Error Details */}
          {errorDetails && (
            <div className="space-y-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center space-x-2 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <Info className="w-3 h-3" />
                <span>{showDetails ? 'Ocultar' : 'Mostrar'} detalles técnicos</span>
              </button>
              
              {showDetails && (
                <div className="bg-gray-800/50 border border-gray-700 rounded p-2">
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap break-words">
                    {errorDetails}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-2">
            <button
              onClick={onRetry}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-codestorm-accent hover:bg-codestorm-accent/80 text-white rounded-md transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reintentar</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors text-sm font-medium"
            >
              Cerrar
            </button>
          </div>

          {/* Timer */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Tiempo recomendado de espera: 15-30 minutos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotaErrorNotification;
