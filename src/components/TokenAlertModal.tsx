import React from 'react';
import { AlertTriangle, X, CheckCircle, BarChart3, Trash2 } from 'lucide-react';
import { TokenAlert } from '../hooks/useTokenTracking';

interface TokenAlertModalProps {
  alerts: TokenAlert[];
  isVisible: boolean;
  onClose: () => void;
  onAcknowledge: (alertId: string) => void;
  onAcknowledgeAll: () => void;
  onResetAgent: (agentName: string) => void;
  onViewDashboard: () => void;
}

const TokenAlertModal: React.FC<TokenAlertModalProps> = ({
  alerts,
  isVisible,
  onClose,
  onAcknowledge,
  onAcknowledgeAll,
  onResetAgent,
  onViewDashboard
}) => {
  if (!isVisible || alerts.length === 0) return null;

  const criticalAlerts = alerts.filter(alert => alert.type === 'critical');
  const warningAlerts = alerts.filter(alert => alert.type === 'warning');

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getAlertIcon = (type: 'warning' | 'critical') => {
    return type === 'critical' ? (
      <AlertTriangle className="w-6 h-6 text-red-400" />
    ) : (
      <AlertTriangle className="w-6 h-6 text-yellow-400" />
    );
  };

  const getAlertBorderColor = (type: 'warning' | 'critical') => {
    return type === 'critical' ? 'border-red-500/50' : 'border-yellow-500/50';
  };

  const getAlertBgColor = (type: 'warning' | 'critical') => {
    return type === 'critical' ? 'bg-red-900/20' : 'bg-yellow-900/20';
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-codestorm-darker border border-codestorm-blue/30 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-codestorm-blue/30">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-6 h-6 ${criticalAlerts.length > 0 ? 'text-red-400' : 'text-yellow-400'}`} />
              <div>
                <h2 className="text-xl font-bold text-white">
                  Alertas de Uso de Tokens
                </h2>
                <p className="text-gray-400 text-sm">
                  {alerts.length} alerta{alerts.length !== 1 ? 's' : ''} activa{alerts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            
            {/* Critical Alerts */}
            {criticalAlerts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Alertas Críticas ({criticalAlerts.length})
                </h3>
                <div className="space-y-3">
                  {criticalAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border ${getAlertBorderColor(alert.type)} ${getAlertBgColor(alert.type)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getAlertIcon(alert.type)}
                            <h4 className="text-white font-medium">{alert.agentName}</h4>
                          </div>
                          
                          <div className="text-sm space-y-1">
                            <p className="text-gray-300">
                              <span className="text-red-400 font-semibold">
                                {formatNumber(alert.currentTokens)} tokens
                              </span>
                              {' '}utilizados (límite: {formatNumber(alert.threshold)})
                            </p>
                            <p className="text-gray-400">
                              Detectado: {new Date(alert.timestamp).toLocaleString()}
                            </p>
                            <p className="text-red-300 font-medium">
                              ⚠️ Se ha alcanzado el límite crítico. Se recomienda resetear el contador o revisar el uso.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => onAcknowledge(alert.id)}
                            className="px-3 py-1 bg-green-600/20 text-green-400 border border-green-600/30 rounded hover:bg-green-600/30 transition-colors text-sm"
                            title="Marcar como visto"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onResetAgent(alert.agentName)}
                            className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded hover:bg-red-600/30 transition-colors text-sm"
                            title="Resetear contador"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning Alerts */}
            {warningAlerts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Advertencias ({warningAlerts.length})
                </h3>
                <div className="space-y-3">
                  {warningAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border ${getAlertBorderColor(alert.type)} ${getAlertBgColor(alert.type)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getAlertIcon(alert.type)}
                            <h4 className="text-white font-medium">{alert.agentName}</h4>
                          </div>
                          
                          <div className="text-sm space-y-1">
                            <p className="text-gray-300">
                              <span className="text-yellow-400 font-semibold">
                                {formatNumber(alert.currentTokens)} tokens
                              </span>
                              {' '}utilizados (límite: {formatNumber(alert.threshold)})
                            </p>
                            <p className="text-gray-400">
                              Detectado: {new Date(alert.timestamp).toLocaleString()}
                            </p>
                            <p className="text-yellow-300">
                              ⚠️ Se acerca al límite crítico. Monitorear el uso.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => onAcknowledge(alert.id)}
                            className="px-3 py-1 bg-green-600/20 text-green-400 border border-green-600/30 rounded hover:bg-green-600/30 transition-colors text-sm"
                            title="Marcar como visto"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-blue-400 font-medium mb-2">💡 Recomendaciones</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Revisa el dashboard de tokens para análisis detallado</li>
                <li>• Considera resetear contadores de agentes con uso excesivo</li>
                <li>• Optimiza las instrucciones para reducir el consumo de tokens</li>
                <li>• Monitorea patrones de uso para identificar tendencias</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-codestorm-blue/30">
            <div className="flex gap-2">
              <button
                onClick={onAcknowledgeAll}
                className="px-4 py-2 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg hover:bg-green-600/30 transition-colors"
              >
                <CheckCircle className="w-4 h-4 mr-2 inline" />
                Marcar Todas como Vistas
              </button>
              
              <button
                onClick={onViewDashboard}
                className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition-colors"
              >
                <BarChart3 className="w-4 h-4 mr-2 inline" />
                Ver Dashboard
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600/20 text-gray-400 border border-gray-600/30 rounded-lg hover:bg-gray-600/30 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TokenAlertModal;
