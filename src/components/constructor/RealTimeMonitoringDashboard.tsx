/**
 * Dashboard de monitoreo en tiempo real del sistema WebAI
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  Database, 
  Network, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Play,
  Pause,
  Zap,
  Brain,
  Server,
  Key,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { SystemMonitoringService, SystemMetrics, AgentStatus } from '../../services/SystemMonitoringService';

interface RealTimeMonitoringDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export const RealTimeMonitoringDashboard: React.FC<RealTimeMonitoringDashboardProps> = ({
  isVisible,
  onClose
}) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [monitoringService] = useState(() => SystemMonitoringService.getInstance());

  useEffect(() => {
    if (isVisible) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [isVisible]);

  const startMonitoring = () => {
    setIsMonitoring(true);
    monitoringService.startMonitoring(15000); // Actualizar cada 15 segundos
    
    // Suscribirse a actualizaciones
    const unsubscribe = monitoringService.subscribe((newMetrics) => {
      setMetrics(newMetrics);
    });

    return unsubscribe;
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    monitoringService.stopMonitoring();
  };

  const refreshMetrics = async () => {
    setIsLoading(true);
    try {
      await monitoringService.updateMetrics();
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testAgent = async (agentName: string) => {
    setIsLoading(true);
    try {
      await monitoringService.checkAgentStatus(agentName);
      await refreshMetrics();
    } catch (error) {
      console.error(`Error testing agent ${agentName}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'critical': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 0) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-7xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-codestorm-accent" />
            <div>
              <h2 className="text-xl font-bold text-white">Monitoreo en Tiempo Real</h2>
              <p className="text-gray-400 text-sm">
                Dashboard de métricas y estado del sistema WebAI
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={refreshMetrics}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            
            <button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isMonitoring 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isMonitoring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isMonitoring ? 'Pausar' : 'Iniciar'}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          {!metrics ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-codestorm-accent animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Cargando métricas del sistema...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* System Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Proxy Status */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      Proxy API
                    </h3>
                    {getStatusIcon(metrics.proxy.isRunning ? 'healthy' : 'critical')}
                  </div>
                  <div className={`text-lg font-bold ${metrics.proxy.isRunning ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.proxy.isRunning ? 'Activo' : 'Inactivo'}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Puerto {metrics.proxy.port} • {formatResponseTime(metrics.proxy.responseTime)}
                  </div>
                </div>

                {/* API Keys Status */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      API Keys
                    </h3>
                    {getStatusIcon(metrics.apiKeys.every(k => k.isValid) ? 'healthy' : 'critical')}
                  </div>
                  <div className="text-lg font-bold text-blue-400">
                    {metrics.apiKeys.filter(k => k.isValid).length}/{metrics.apiKeys.length}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {metrics.apiKeys.map(k => k.provider).join(', ')}
                  </div>
                </div>

                {/* Performance */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Rendimiento
                    </h3>
                    <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-lg font-bold text-blue-400">
                    {formatResponseTime(metrics.performance.averageResponseTime)}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Promedio • {metrics.performance.errorRate.toFixed(1)}% errores
                  </div>
                </div>

                {/* Global Config */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Configuración
                    </h3>
                    <Database className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-lg font-bold text-purple-400">
                    {metrics.globalConfig.defaultModel.provider}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {metrics.globalConfig.totalAgents} agentes • {metrics.globalConfig.overriddenAgents} personalizados
                  </div>
                </div>
              </div>

              {/* Agents Status */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-codestorm-accent" />
                  Estado de Agentes
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {metrics.agents.map((agent) => (
                    <div 
                      key={agent.name}
                      className={`bg-gray-700 rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-600 ${
                        selectedAgent === agent.name ? 'ring-2 ring-codestorm-accent' : ''
                      }`}
                      onClick={() => setSelectedAgent(selectedAgent === agent.name ? null : agent.name)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{agent.name}</h4>
                        {getStatusIcon(agent.status)}
                      </div>
                      
                      <div className={`text-sm font-medium mb-1 ${getStatusColor(agent.status)}`}>
                        {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                      </div>
                      
                      <div className="text-gray-400 text-xs space-y-1">
                        <div>Modelo: {agent.currentModel.name}</div>
                        <div>Respuesta: {formatResponseTime(agent.responseTime)}</div>
                        <div>Última verificación: {formatTime(agent.lastChecked)}</div>
                        {agent.lastError && (
                          <div className="text-red-400 text-xs mt-2 truncate" title={agent.lastError}>
                            Error: {agent.lastError}
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          testAgent(agent.name);
                        }}
                        disabled={isLoading}
                        className="mt-3 w-full px-3 py-1 bg-codestorm-accent text-white text-xs rounded hover:bg-codestorm-accent/80 disabled:opacity-50 transition-colors"
                      >
                        Probar Agente
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Agent Info */}
              {selectedAgent && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-white mb-4">
                    Detalles de {selectedAgent}
                  </h3>
                  
                  {(() => {
                    const agent = metrics.agents.find(a => a.name === selectedAgent);
                    if (!agent) return null;
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-white font-medium mb-2">Estado Actual</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Estado:</span>
                              <span className={getStatusColor(agent.status)}>
                                {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Tiempo de respuesta:</span>
                              <span className="text-white">{formatResponseTime(agent.responseTime)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Éxitos:</span>
                              <span className="text-green-400">{agent.successCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Errores:</span>
                              <span className="text-red-400">{agent.errorCount}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-white font-medium mb-2">Configuración</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Proveedor:</span>
                              <span className="text-white">{agent.currentModel.provider}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Modelo:</span>
                              <span className="text-white">{agent.currentModel.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">ID del modelo:</span>
                              <span className="text-gray-300 text-xs">{agent.currentModel.modelId}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* System Info */}
              <div className="text-center text-gray-400 text-sm">
                Última actualización: {formatTime(metrics.lastUpdate)} • 
                Monitoreo {isMonitoring ? 'activo' : 'pausado'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
