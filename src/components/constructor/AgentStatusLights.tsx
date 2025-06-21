import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Zap, 
  Cpu, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { AgentTestingService, AgentTestResult } from '../../services/AgentTestingService';
import { getDistributedAgentConfig, DISTRIBUTED_AGENT_CONFIG } from '../../config/claudeModels';

interface AgentStatusLightsProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onAgentClick?: (agentName: string) => void;
}

interface AgentLightStatus {
  agentName: string;
  provider: 'openai' | 'claude';
  model: string;
  status: 'success' | 'warning' | 'error' | 'testing' | 'unknown';
  lastTested?: number;
  responseTime?: number;
  quality?: number;
}

export const AgentStatusLights: React.FC<AgentStatusLightsProps> = ({
  autoRefresh = true,
  refreshInterval = 30000,
  onAgentClick
}) => {
  const [agentStatuses, setAgentStatuses] = useState<AgentLightStatus[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  const testingService = AgentTestingService.getInstance();

  // Inicializar estados de agentes
  useEffect(() => {
    const initialStatuses: AgentLightStatus[] = Object.keys(DISTRIBUTED_AGENT_CONFIG).map(agentName => {
      const config = getDistributedAgentConfig(agentName);
      return {
        agentName,
        provider: config.provider,
        model: config.model.name,
        status: 'unknown'
      };
    });
    setAgentStatuses(initialStatuses);
    
    // Cargar resultados previos si existen
    loadPreviousResults();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshAllAgents();
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const loadPreviousResults = () => {
    const latestSuite = testingService.getLatestTestSuite();
    if (latestSuite) {
      updateStatusesFromResults(latestSuite.results);
      setLastUpdate(latestSuite.timestamp);
    }
  };

  const updateStatusesFromResults = (results: AgentTestResult[]) => {
    setAgentStatuses(prev => prev.map(status => {
      const agentResults = results.filter(r => r.agentName === status.agentName);
      const latestResult = agentResults[agentResults.length - 1];
      
      if (latestResult) {
        return {
          ...status,
          status: latestResult.status,
          lastTested: latestResult.timestamp,
          responseTime: latestResult.responseTime,
          quality: latestResult.metrics.responseQuality
        };
      }
      return status;
    }));
  };

  const refreshAllAgents = async () => {
    setIsRefreshing(true);
    try {
      const testSuite = await testingService.runFullTestSuite({
        testTypes: ['basic'],
        timeout: 15000,
        stressTestCount: 1
      });
      
      updateStatusesFromResults(testSuite.results);
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Error refreshing agent statuses:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const testSingleAgent = async (agentName: string) => {
    // Marcar agente como "testing"
    setAgentStatuses(prev => prev.map(status => 
      status.agentName === agentName 
        ? { ...status, status: 'testing' }
        : status
    ));

    try {
      const result = await testingService.testAgent(agentName, 'basic', 15000);
      
      // Actualizar estado del agente
      setAgentStatuses(prev => prev.map(status => 
        status.agentName === agentName 
          ? {
              ...status,
              status: result.status,
              lastTested: result.timestamp,
              responseTime: result.responseTime,
              quality: result.metrics.responseQuality
            }
          : status
      ));
    } catch (error) {
      // Marcar como error
      setAgentStatuses(prev => prev.map(status => 
        status.agentName === agentName 
          ? { ...status, status: 'error', lastTested: Date.now() }
          : status
      ));
    }
  };

  const getLightColor = (status: AgentLightStatus['status']) => {
    switch (status) {
      case 'success': return 'text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]';
      case 'warning': return 'text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]';
      case 'error': return 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]';
      case 'testing': return 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse';
      case 'unknown': return 'text-gray-400';
    }
  };

  const getProviderIcon = (provider: 'openai' | 'claude') => {
    return provider === 'openai' 
      ? <Zap className="w-3 h-3 text-green-400" />
      : <Cpu className="w-3 h-3 text-blue-400" />;
  };

  const getStatusIcon = (status: AgentLightStatus['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'testing': return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'unknown': return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const getHealthyCount = () => agentStatuses.filter(s => s.status === 'success').length;
  const getWarningCount = () => agentStatuses.filter(s => s.status === 'warning').length;
  const getErrorCount = () => agentStatuses.filter(s => s.status === 'error').length;

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Lightbulb className="w-6 h-6 text-codestorm-accent" />
          <h3 className="text-lg font-medium text-white">Estado de Agentes</h3>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Status Summary */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-green-400">{getHealthyCount()}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-yellow-400">{getWarningCount()}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span className="text-red-400">{getErrorCount()}</span>
            </div>
          </div>
          
          <button
            onClick={refreshAllAgents}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Probando...' : 'Probar Todo'}
          </button>
        </div>
      </div>

      {/* Agent Lights Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {agentStatuses.map((agent) => (
          <div
            key={agent.agentName}
            className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-all duration-200"
            onClick={() => {
              testSingleAgent(agent.agentName);
              onAgentClick?.(agent.agentName);
            }}
          >
            {/* Light Bulb */}
            <div className="flex justify-center mb-3">
              <Lightbulb className={`w-8 h-8 ${getLightColor(agent.status)}`} />
            </div>
            
            {/* Agent Info */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                {getProviderIcon(agent.provider)}
                <span className="text-white text-sm font-medium truncate">
                  {agent.agentName.replace('Agent', '')}
                </span>
              </div>
              
              <div className="flex items-center justify-center gap-1 mb-2">
                {getStatusIcon(agent.status)}
                <span className="text-xs text-gray-400 capitalize">
                  {agent.status}
                </span>
              </div>
              
              {/* Metrics */}
              {agent.lastTested && (
                <div className="text-xs text-gray-500 space-y-1">
                  <div>⏱️ {agent.responseTime}ms</div>
                  {agent.quality !== undefined && (
                    <div>📊 {agent.quality.toFixed(0)}%</div>
                  )}
                  <div>🕒 {formatTime(agent.lastTested)}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Last Update */}
      {lastUpdate > 0 && (
        <div className="mt-4 text-center text-xs text-gray-500">
          Última actualización: {new Date(lastUpdate).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default AgentStatusLights;
