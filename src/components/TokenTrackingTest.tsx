import React, { useState } from 'react';
import { Play, BarChart3, AlertTriangle, RefreshCw } from 'lucide-react';
import { useTokenTracking } from '../hooks/useTokenTracking';
import { manualTokenTracking } from '../utils/tokenTrackingMiddleware';

interface TokenTrackingTestProps {
  className?: string;
}

const TokenTrackingTest: React.FC<TokenTrackingTestProps> = ({ className = '' }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  
  const {
    trackingState,
    trackTokenUsage,
    getUsageStats,
    resetAllTokens,
    WARNING_THRESHOLD,
    CRITICAL_THRESHOLD
  } = useTokenTracking();

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTokenTrackingTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      addTestResult('🧪 Iniciando test del sistema de tracking de tokens...');
      
      // Test 1: Track tokens for different agents
      addTestResult('📊 Test 1: Tracking de tokens por agente');
      
      const testAgents = [
        { name: 'HTMLAgent', tokens: 1500 },
        { name: 'CSSAgent', tokens: 2000 },
        { name: 'JavaScriptAgent', tokens: 3500 },
        { name: 'CodeModifierAgent', tokens: 2500 }
      ];

      for (const agent of testAgents) {
        trackTokenUsage(agent.name, agent.tokens);
        addTestResult(`✅ ${agent.name}: ${agent.tokens} tokens tracked`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Test 2: Manual token tracking
      addTestResult('📊 Test 2: Manual token tracking');
      manualTokenTracking('PlanningAgent', 4000);
      addTestResult('✅ PlanningAgent: 4000 tokens tracked manually');

      // Test 3: Multiple calls to same agent
      addTestResult('📊 Test 3: Múltiples llamadas al mismo agente');
      trackTokenUsage('HTMLAgent', 500);
      trackTokenUsage('HTMLAgent', 750);
      addTestResult('✅ HTMLAgent: 2 llamadas adicionales tracked');

      // Test 4: Test warning threshold
      addTestResult('📊 Test 4: Testing warning threshold');
      trackTokenUsage('TestAgent', WARNING_THRESHOLD - 1000);
      addTestResult('✅ TestAgent cerca del warning threshold');
      
      trackTokenUsage('TestAgent', 2000);
      addTestResult('⚠️ TestAgent debería generar warning alert');

      // Test 5: Test critical threshold
      addTestResult('📊 Test 5: Testing critical threshold');
      trackTokenUsage('CriticalTestAgent', CRITICAL_THRESHOLD + 1000);
      addTestResult('🚨 CriticalTestAgent debería generar critical alert');

      // Test 6: Get usage statistics
      addTestResult('📊 Test 6: Estadísticas de uso');
      const stats = getUsageStats();
      addTestResult(`📈 Total tokens: ${stats.totalTokensAllTime}`);
      addTestResult(`📈 Total API calls: ${stats.totalApiCalls}`);
      addTestResult(`📈 Agente más usado: ${stats.mostUsedAgent}`);
      addTestResult(`📈 Alertas activas: ${stats.activeAlertsCount}`);

      addTestResult('✅ Test completado exitosamente!');
      
    } catch (error) {
      addTestResult(`❌ Error en test: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const resetTokens = () => {
    resetAllTokens();
    addTestResult('🔄 Todos los contadores de tokens han sido reseteados');
  };

  const stats = getUsageStats();
  const activeAlerts = trackingState.alerts.filter(alert => !alert.acknowledged);

  return (
    <div className={`bg-codestorm-dark rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            Token Tracking System Test
          </h3>
          <p className="text-gray-400 mt-1">
            Prueba el sistema de seguimiento de tokens
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={runTokenTrackingTest}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4 mr-2 inline" />
            {isRunning ? 'Ejecutando...' : 'Ejecutar Test'}
          </button>
          
          <button
            onClick={resetTokens}
            className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2 inline" />
            Reset
          </button>
        </div>
      </div>

      {/* Current Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-codestorm-darker p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Total Tokens</div>
          <div className="text-2xl font-bold text-white">
            {stats.totalTokensAllTime.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-codestorm-darker p-4 rounded-lg">
          <div className="text-gray-400 text-sm">API Calls</div>
          <div className="text-2xl font-bold text-white">
            {stats.totalApiCalls}
          </div>
        </div>
        
        <div className="bg-codestorm-darker p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Alertas Activas</div>
          <div className="text-2xl font-bold text-red-400">
            {stats.activeAlertsCount}
          </div>
        </div>
        
        <div className="bg-codestorm-darker p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Agente Top</div>
          <div className="text-lg font-bold text-white truncate">
            {stats.mostUsedAgent}
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h4 className="text-red-400 font-semibold">
              Alertas Activas ({activeAlerts.length})
            </h4>
          </div>
          <div className="space-y-1">
            {activeAlerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="text-sm text-red-300">
                • {alert.agentName}: {alert.currentTokens.toLocaleString()} tokens ({alert.type})
              </div>
            ))}
            {activeAlerts.length > 3 && (
              <div className="text-sm text-red-400">
                Y {activeAlerts.length - 3} alertas más...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-semibold">Resultados del Test</h4>
          {testResults.length > 0 && (
            <button
              onClick={clearTestResults}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
        
        <div className="bg-codestorm-darker rounded-lg p-4 max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">
                Haz clic en "Ejecutar Test" para probar el sistema de tracking
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`text-sm font-mono ${
                    result.includes('❌') ? 'text-red-400' :
                    result.includes('⚠️') ? 'text-yellow-400' :
                    result.includes('🚨') ? 'text-red-500' :
                    result.includes('✅') ? 'text-green-400' :
                    'text-gray-300'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Agent Usage Summary */}
      <div className="mt-6">
        <h4 className="text-white font-semibold mb-3">Uso por Agente</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.values(trackingState.agentUsage)
            .filter(agent => agent.totalTokens > 0)
            .sort((a, b) => b.totalTokens - a.totalTokens)
            .map(agent => (
              <div key={agent.agentName} className="bg-codestorm-darker p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-white font-medium text-sm truncate">
                    {agent.agentName}
                  </h5>
                  <span className="text-xs text-gray-400">
                    {agent.totalTokens.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {agent.apiCalls} llamadas • Promedio: {agent.averageTokensPerCall}
                </div>
                <div className="w-full bg-gray-600 rounded-full h-1 mt-2">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      agent.totalTokens >= CRITICAL_THRESHOLD ? 'bg-red-500' :
                      agent.totalTokens >= WARNING_THRESHOLD ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((agent.totalTokens / CRITICAL_THRESHOLD) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default TokenTrackingTest;
