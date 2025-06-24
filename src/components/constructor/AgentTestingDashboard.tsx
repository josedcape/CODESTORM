import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  Zap,
  Cpu,
  Activity,
  BarChart3,
  Settings
} from 'lucide-react';
import { AgentTestingService, AgentTestSuite, AgentTestResult, TestConfiguration } from '../../services/AgentTestingService';
import { getDistributedAgentConfig } from '../../config/claudeModels';

interface AgentTestingDashboardProps {
  isVisible?: boolean;
  onClose?: () => void;
}

export const AgentTestingDashboard: React.FC<AgentTestingDashboardProps> = ({
  isVisible = false,
  onClose
}) => {
  const [testSuite, setTestSuite] = useState<AgentTestSuite | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [testConfig, setTestConfig] = useState<TestConfiguration>({
    testTypes: ['basic', 'functional'],
    timeout: 30000,
    stressTestCount: 3
  });
  const [logs, setLogs] = useState<string[]>([]);

  const testingService = AgentTestingService.getInstance();

  useEffect(() => {
    if (isVisible) {
      loadLatestResults();
      const interval = setInterval(() => {
        setIsRunning(testingService.isTestRunning());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const loadLatestResults = () => {
    const latest = testingService.getLatestTestSuite();
    setTestSuite(latest);
  };

  const runFullTest = async () => {
    try {
      setIsRunning(true);
      addLog('🧪 Iniciando suite completa de pruebas...');
      
      const results = await testingService.runFullTestSuite(testConfig);
      setTestSuite(results);
      
      addLog(`✅ Pruebas completadas: ${results.passedTests}/${results.totalAgents} exitosas`);
    } catch (error) {
      addLog(`❌ Error en las pruebas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runSingleAgentTest = async (agentName: string) => {
    try {
      addLog(`🔍 Probando agente: ${agentName}`);
      
      const result = await testingService.testAgent(agentName, 'functional');
      
      // Actualizar resultados
      if (testSuite) {
        const updatedResults = testSuite.results.map(r => 
          r.agentName === agentName && r.testType === 'functional' ? result : r
        );
        setTestSuite({ ...testSuite, results: updatedResults });
      }
      
      addLog(`${result.status === 'success' ? '✅' : '❌'} ${agentName}: ${result.status}`);
    } catch (error) {
      addLog(`❌ Error probando ${agentName}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  const getStatusIcon = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />;
    }
  };

  const getProviderIcon = (provider: 'openai' | 'claude') => {
    return provider === 'openai' 
      ? <Zap className="w-4 h-4 text-green-400" />
      : <Cpu className="w-4 h-4 text-blue-400" />;
  };

  const getHealthColor = (health: 'healthy' | 'degraded' | 'critical') => {
    switch (health) {
      case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-codestorm-accent" />
            <h2 className="text-xl font-semibold text-white">Dashboard de Testing de Agentes</h2>
            {testSuite && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                testSuite.overallHealth === 'healthy' ? 'bg-green-500/20 text-green-400' :
                testSuite.overallHealth === 'degraded' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {testSuite.overallHealth.toUpperCase()}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Controls */}
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={runFullTest}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-2 bg-codestorm-accent text-white rounded-lg hover:bg-codestorm-accent/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {isRunning ? 'Ejecutando...' : 'Ejecutar Todas las Pruebas'}
              </button>
              
              <button
                onClick={loadLatestResults}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>

              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-400" />
                <select
                  value={testConfig.timeout}
                  onChange={(e) => setTestConfig(prev => ({ ...prev, timeout: Number(e.target.value) }))}
                  className="bg-gray-800 text-white rounded px-3 py-1 text-sm border border-gray-600"
                >
                  <option value={15000}>15s timeout</option>
                  <option value={30000}>30s timeout</option>
                  <option value={60000}>60s timeout</option>
                </select>
              </div>
            </div>

            {/* Summary Stats */}
            {testSuite && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Exitosas</span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">{testSuite.passedTests}</div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-300">Advertencias</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">{testSuite.warningTests}</div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="text-gray-300">Errores</span>
                  </div>
                  <div className="text-2xl font-bold text-red-400">{testSuite.failedTests}</div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300">Tiempo Promedio</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {testSuite.averageResponseTime.toFixed(0)}ms
                  </div>
                </div>
              </div>
            )}

            {/* Agent Grid */}
            {testSuite && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Estado de Agentes
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.keys(getDistributedAgentConfig('PlannerAgent')).map(agentName => {
                    const agentConfig = getDistributedAgentConfig(agentName);
                    const agentResults = testSuite.results.filter(r => r.agentName === agentName);
                    const latestResult = agentResults[agentResults.length - 1];
                    
                    return (
                      <div
                        key={agentName}
                        className={`bg-gray-700 rounded-lg p-3 cursor-pointer transition-all hover:bg-gray-600 ${
                          selectedAgent === agentName ? 'ring-2 ring-codestorm-accent' : ''
                        }`}
                        onClick={() => setSelectedAgent(selectedAgent === agentName ? null : agentName)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getProviderIcon(agentConfig.provider)}
                            <span className="text-white text-sm font-medium">{agentName}</span>
                          </div>
                          {latestResult && getStatusIcon(latestResult.status)}
                        </div>
                        
                        <div className="text-xs text-gray-400 mb-2">
                          {agentConfig.model.name}
                        </div>
                        
                        {latestResult && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">
                              {latestResult.responseTime}ms
                            </span>
                            <span className="text-gray-400">
                              Q: {latestResult.metrics.responseQuality.toFixed(0)}%
                            </span>
                          </div>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            runSingleAgentTest(agentName);
                          }}
                          className="w-full mt-2 px-2 py-1 bg-codestorm-accent/20 text-codestorm-accent rounded text-xs hover:bg-codestorm-accent/30 transition-colors"
                        >
                          Probar
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {testSuite && testSuite.recommendations.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <h3 className="text-lg font-medium text-yellow-400 mb-3">Recomendaciones</h3>
                <div className="space-y-2">
                  {testSuite.recommendations.map((rec, index) => (
                    <div key={index} className="text-yellow-300 text-sm">• {rec}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Logs */}
          <div className="w-80 border-l border-gray-700 bg-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">Logs de Pruebas</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-xs text-gray-300 font-mono">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentTestingDashboard;
