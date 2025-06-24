import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  Clock,
  Zap,
  Activity,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { useTokenTracking, TokenUsage, TokenAlert } from '../hooks/useTokenTracking';

interface TokenUsageDashboardProps {
  className?: string;
}

const TokenUsageDashboard: React.FC<TokenUsageDashboardProps> = ({ className = '' }) => {
  const {
    trackingState,
    acknowledgeAlert,
    resetAgentTokens,
    resetAllTokens,
    getUsageStats,
    exportUsageData,
    WARNING_THRESHOLD,
    CRITICAL_THRESHOLD
  } = useTokenTracking();

  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<'totalTokens' | 'sessionTokens' | 'apiCalls'>('totalTokens');

  const stats = getUsageStats();
  const activeAlerts = trackingState.alerts.filter(alert => !alert.acknowledged);
  const sortedAgents = Object.values(trackingState.agentUsage).sort((a, b) => b[sortBy] - a[sortBy]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getUsagePercentage = (tokens: number, threshold: number = CRITICAL_THRESHOLD) => {
    return Math.min((tokens / threshold) * 100, 100);
  };

  const getUsageColor = (tokens: number) => {
    if (tokens >= CRITICAL_THRESHOLD) return 'text-red-400';
    if (tokens >= WARNING_THRESHOLD) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getProgressBarColor = (tokens: number) => {
    if (tokens >= CRITICAL_THRESHOLD) return 'bg-red-500';
    if (tokens >= WARNING_THRESHOLD) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const toggleDetails = (agentName: string) => {
    setShowDetails(prev => ({
      ...prev,
      [agentName]: !prev[agentName]
    }));
  };

  const handleResetAgent = (agentName: string) => {
    if (window.confirm(`¿Estás seguro de que quieres resetear los tokens para ${agentName}?`)) {
      resetAgentTokens(agentName);
    }
  };

  const handleResetAll = () => {
    if (window.confirm('¿Estás seguro de que quieres resetear TODOS los contadores de tokens?')) {
      resetAllTokens();
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            Monitoreo de Tokens
          </h2>
          <p className="text-gray-400 mt-1">
            Seguimiento en tiempo real del consumo de tokens por agente IA
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={exportUsageData}
            className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition-colors"
            title="Exportar datos de uso"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetAll}
            className="px-3 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors"
            title="Resetear todos los contadores"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-red-400 font-semibold">
              Alertas Activas ({activeAlerts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {activeAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between bg-red-900/30 p-3 rounded-lg">
                <div>
                  <span className="text-white font-medium">{alert.agentName}</span>
                  <span className="text-red-400 ml-2">
                    {formatNumber(alert.currentTokens)} tokens
                  </span>
                  <span className="text-gray-400 text-sm ml-2">
                    ({alert.type === 'critical' ? 'Crítico' : 'Advertencia'})
                  </span>
                </div>
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded hover:bg-red-600/30 transition-colors text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-codestorm-dark p-4 rounded-lg border border-codestorm-blue/30">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400 text-sm">Total Tokens</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatNumber(stats.totalTokensAllTime)}
          </div>
        </div>

        <div className="bg-codestorm-dark p-4 rounded-lg border border-codestorm-blue/30">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-gray-400 text-sm">Sesión Actual</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatNumber(stats.totalSessionTokens)}
          </div>
        </div>

        <div className="bg-codestorm-dark p-4 rounded-lg border border-codestorm-blue/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-gray-400 text-sm">API Calls</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.totalApiCalls}
          </div>
        </div>

        <div className="bg-codestorm-dark p-4 rounded-lg border border-codestorm-blue/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-400 text-sm">Duración Sesión</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatDuration(stats.sessionDuration)}
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-4">
        <span className="text-gray-400 text-sm">Ordenar por:</span>
        <div className="flex gap-2">
          {[
            { key: 'totalTokens', label: 'Total' },
            { key: 'sessionTokens', label: 'Sesión' },
            { key: 'apiCalls', label: 'Llamadas' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key as any)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                sortBy === key
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                  : 'bg-gray-600/20 text-gray-400 border border-gray-600/30 hover:bg-gray-600/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Agent Usage List */}
      <div className="space-y-3">
        {sortedAgents.map((agent) => (
          <div key={agent.agentName} className="bg-codestorm-dark rounded-lg border border-codestorm-blue/30 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-white font-medium">{agent.agentName}</h3>
                  <span className={`text-sm ${getUsageColor(agent.totalTokens)}`}>
                    {formatNumber(agent.totalTokens)} tokens
                  </span>
                  {agent.totalTokens >= WARNING_THRESHOLD && (
                    <AlertTriangle className={`w-4 h-4 ${
                      agent.totalTokens >= CRITICAL_THRESHOLD ? 'text-red-400' : 'text-yellow-400'
                    }`} />
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleDetails(agent.agentName)}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                    title="Ver detalles"
                  >
                    {showDetails[agent.agentName] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleResetAgent(agent.agentName)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    title="Resetear contador"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progreso hacia límite crítico</span>
                  <span>{getUsagePercentage(agent.totalTokens).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(agent.totalTokens)}`}
                    style={{ width: `${getUsagePercentage(agent.totalTokens)}%` }}
                  />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Sesión:</span>
                  <span className="text-white ml-2">{formatNumber(agent.sessionTokens)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Llamadas:</span>
                  <span className="text-white ml-2">{agent.apiCalls}</span>
                </div>
                <div>
                  <span className="text-gray-400">Promedio:</span>
                  <span className="text-white ml-2">{agent.averageTokensPerCall}</span>
                </div>
              </div>

              {/* Detailed Stats */}
              {showDetails[agent.agentName] && (
                <div className="mt-4 pt-4 border-t border-gray-600/30">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Último uso:</span>
                      <span className="text-white ml-2">
                        {agent.lastUsed ? new Date(agent.lastUsed).toLocaleString() : 'Nunca'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Tokens restantes:</span>
                      <span className={`ml-2 ${getUsageColor(CRITICAL_THRESHOLD - agent.totalTokens)}`}>
                        {formatNumber(Math.max(0, CRITICAL_THRESHOLD - agent.totalTokens))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TokenUsageDashboard;
