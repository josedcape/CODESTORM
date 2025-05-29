import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Zap, 
  Activity,
  RefreshCw,
  Eye,
  EyeOff,
  TrendingUp,
  Server
} from 'lucide-react';
import { AIProvider } from '../services/AIProviderManager';
import { AIProviderManager } from '../services/AIProviderManager';

interface AIProviderStatusProps {
  isVisible?: boolean;
  onToggle?: () => void;
  className?: string;
}

const AIProviderStatus: React.FC<AIProviderStatusProps> = ({ 
  isVisible = false, 
  onToggle,
  className = '' 
}) => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const providerManager = AIProviderManager.getInstance();
    
    // Cargar estado inicial
    setProviders(providerManager.getAllProviders());
    
    // Suscribirse a actualizaciones
    const handleProviderUpdate = (updatedProviders: AIProvider[]) => {
      setProviders(updatedProviders);
      setLastUpdate(new Date());
    };
    
    providerManager.addListener(handleProviderUpdate);
    
    return () => {
      providerManager.removeListener(handleProviderUpdate);
    };
  }, []);

  const getStatusIcon = (provider: AIProvider) => {
    if (!provider.isAvailable) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    
    switch (provider.healthStatus) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unavailable':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (provider: AIProvider) => {
    if (!provider.isAvailable) {
      return 'No disponible';
    }
    
    switch (provider.healthStatus) {
      case 'healthy':
        return 'Funcionando';
      case 'degraded':
        return 'Degradado';
      case 'unavailable':
        return 'No disponible';
      default:
        return 'Desconocido';
    }
  };

  const getStatusColor = (provider: AIProvider) => {
    if (!provider.isAvailable) return 'border-red-500/30 bg-red-500/10';
    
    switch (provider.healthStatus) {
      case 'healthy':
        return 'border-green-500/30 bg-green-500/10';
      case 'degraded':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'unavailable':
        return 'border-red-500/30 bg-red-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatDuration = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getQuotaResetTime = (provider: AIProvider) => {
    if (!provider.quotaResetTime) return null;
    
    const now = Date.now();
    if (now >= provider.quotaResetTime) return null;
    
    const diff = provider.quotaResetTime - now;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 p-3 bg-codestorm-blue hover:bg-codestorm-blue/80 text-white rounded-full shadow-lg transition-colors"
        title="Ver estado de APIs de IA"
      >
        <Activity className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-codestorm-dark border border-codestorm-blue/30 rounded-lg shadow-xl max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-codestorm-blue/30">
          <div className="flex items-center space-x-2">
            <Server className="h-5 w-5 text-codestorm-accent" />
            <h3 className="text-sm font-semibold text-white">Estado de APIs de IA</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-codestorm-blue/20 rounded transition-colors"
              title={isExpanded ? "Contraer" : "Expandir"}
            >
              {isExpanded ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-codestorm-blue/20 rounded transition-colors"
              title="Cerrar"
            >
              <XCircle className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Provider List */}
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className={`p-3 rounded-lg border ${getStatusColor(provider)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(provider)}
                  <span className="text-sm font-medium text-white">
                    {provider.name}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {getStatusText(provider)}
                </span>
              </div>

              {isExpanded && (
                <div className="space-y-2 text-xs text-gray-300">
                  {/* Modelos disponibles */}
                  <div>
                    <span className="text-gray-400">Modelos:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {provider.models.map((model) => (
                        <span
                          key={model}
                          className="px-2 py-1 bg-codestorm-blue/20 rounded text-xs"
                        >
                          {model}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-400">Éxito:</span>
                      <span className="ml-1 text-green-400">
                        {provider.successRate.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Solicitudes:</span>
                      <span className="ml-1">{provider.totalRequests}</span>
                    </div>
                  </div>

                  {/* Tiempo de respuesta */}
                  {provider.responseTime && (
                    <div>
                      <span className="text-gray-400">Respuesta:</span>
                      <span className="ml-1">{provider.responseTime}ms</span>
                    </div>
                  )}

                  {/* Error información */}
                  {provider.lastError && (
                    <div>
                      <span className="text-gray-400">Último error:</span>
                      <div className="text-red-400 text-xs mt-1 break-words">
                        {provider.lastError}
                      </div>
                      <div className="text-gray-500 text-xs">
                        Hace {formatDuration(provider.lastErrorTime)}
                      </div>
                    </div>
                  )}

                  {/* Tiempo de reset de cuota */}
                  {getQuotaResetTime(provider) && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-yellow-400" />
                      <span className="text-gray-400">Reset en:</span>
                      <span className="text-yellow-400 font-mono">
                        {getQuotaResetTime(provider)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-codestorm-blue/30 bg-codestorm-blue/5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <RefreshCw className="h-3 w-3" />
              <span>Actualizado: {lastUpdate.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span>
                {providers.filter(p => p.isAvailable && p.healthStatus === 'healthy').length}/
                {providers.length} activos
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIProviderStatus;
