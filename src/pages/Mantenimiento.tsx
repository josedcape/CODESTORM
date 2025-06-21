import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Activity, 
  BarChart3, 
  Cpu, 
  Zap, 
  Shield, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Monitor,
  Database,
  Network,
  Clock
} from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { AgentTestingDashboard } from '../components/constructor/AgentTestingDashboard';
import { AgentDistributionMonitor } from '../components/constructor/AgentDistributionMonitor';
import { AgentStatusLights } from '../components/constructor/AgentStatusLights';
import { AgentTestingService, AgentTestSuite } from '../services/AgentTestingService';
import { AgentDistributionService } from '../services/AgentDistributionService';
import { EnhancedAPIService } from '../services/EnhancedAPIService';

const Mantenimiento: React.FC = () => {
  const { isMobile } = useUI();
  const [activeTab, setActiveTab] = useState<'overview' | 'testing' | 'distribution' | 'system'>('overview');
  const [showTestingDashboard, setShowTestingDashboard] = useState(false);
  const [showDistributionMonitor, setShowDistributionMonitor] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [lastTestSuite, setLastTestSuite] = useState<AgentTestSuite | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testingService = AgentTestingService.getInstance();
  const distributionService = AgentDistributionService.getInstance();
  const apiService = EnhancedAPIService.getInstance();

  useEffect(() => {
    loadSystemStatus();
    const interval = setInterval(loadSystemStatus, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const loadSystemStatus = async () => {
    setIsLoading(true);
    try {
      // Cargar estado del sistema
      const [healthCheck, connectionStatus, usageStats, latestTests] = await Promise.all([
        distributionService.healthCheck(),
        apiService.getConnectionStatus(),
        distributionService.getUsageStats(),
        Promise.resolve(testingService.getLatestTestSuite())
      ]);

      setSystemStatus({
        health: healthCheck,
        connection: connectionStatus,
        usage: usageStats,
        lastUpdate: Date.now()
      });

      setLastTestSuite(latestTests);
    } catch (error) {
      console.error('Error loading system status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runQuickHealthCheck = async () => {
    setIsLoading(true);
    try {
      const testSuite = await testingService.runFullTestSuite({
        testTypes: ['basic'],
        timeout: 15000,
        stressTestCount: 1
      });
      setLastTestSuite(testSuite);
      await loadSystemStatus();
    } catch (error) {
      console.error('Error in quick health check:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: boolean | string) => {
    if (typeof status === 'boolean') {
      return status ? 'text-green-400' : 'text-red-400';
    }
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: boolean | string) => {
    if (typeof status === 'boolean') {
      return status ? <CheckCircle className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />;
    }
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'degraded': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'critical': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const tabs = [
    { id: 'overview', name: 'Resumen', icon: Monitor },
    { id: 'testing', name: 'Testing', icon: Activity },
    { id: 'distribution', name: 'Distribución', icon: BarChart3 },
    { id: 'system', name: 'Sistema', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-codestorm-accent" />
              <div>
                <h1 className="text-2xl font-bold text-white">Panel de Mantenimiento</h1>
                <p className="text-gray-400">Monitoreo y testing del sistema de agentes CODESTORM</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={loadSystemStatus}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
              
              <button
                onClick={runQuickHealthCheck}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-codestorm-accent text-white rounded-lg hover:bg-codestorm-accent/80 disabled:opacity-50 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Health Check
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-codestorm-accent text-codestorm-accent'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Estado General</h3>
                  {systemStatus && getStatusIcon(systemStatus.health?.healthy)}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(systemStatus?.health?.healthy || false)}`}>
                  {systemStatus?.health?.healthy ? 'Saludable' : 'Problemas'}
                </div>
                {systemStatus?.health?.issues?.length > 0 && (
                  <div className="mt-2 text-sm text-red-400">
                    {systemStatus.health.issues.length} problema(s) detectado(s)
                  </div>
                )}
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Conectividad</h3>
                  {systemStatus && getStatusIcon(systemStatus.connection?.isConnected)}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(systemStatus?.connection?.isConnected || false)}`}>
                  {systemStatus?.connection?.isConnected ? 'Conectado' : 'Desconectado'}
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  Proveedor: {systemStatus?.connection?.provider || 'N/A'}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Últimas Pruebas</h3>
                  {lastTestSuite && getStatusIcon(lastTestSuite.overallHealth)}
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(lastTestSuite?.overallHealth || 'critical')}`}>
                  {lastTestSuite ? `${lastTestSuite.passedTests}/${lastTestSuite.passedTests + lastTestSuite.failedTests + lastTestSuite.warningTests}` : 'N/A'}
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  {lastTestSuite ? formatTime(lastTestSuite.timestamp) : 'Sin pruebas'}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Uso de APIs</h3>
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-blue-400">
                  {systemStatus ? (systemStatus.usage?.openai?.requests || 0) + (systemStatus.usage?.claude?.requests || 0) : 0}
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  Requests totales
                </div>
              </div>
            </div>

            {/* Agent Status Lights */}
            <AgentStatusLights
              autoRefresh={true}
              refreshInterval={60000}
              onAgentClick={(agentName) => {
                console.log(`Testing agent: ${agentName}`);
              }}
            />

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Acciones Rápidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowTestingDashboard(true)}
                  className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Activity className="w-6 h-6 text-codestorm-accent" />
                  <div className="text-left">
                    <div className="text-white font-medium">Dashboard de Testing</div>
                    <div className="text-gray-400 text-sm">Ejecutar y monitorear pruebas</div>
                  </div>
                </button>

                <button
                  onClick={() => setShowDistributionMonitor(true)}
                  className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                  <div className="text-left">
                    <div className="text-white font-medium">Monitor de Distribución</div>
                    <div className="text-gray-400 text-sm">Ver distribución de agentes</div>
                  </div>
                </button>

                <button
                  onClick={runQuickHealthCheck}
                  disabled={isLoading}
                  className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  <Shield className="w-6 h-6 text-green-400" />
                  <div className="text-left">
                    <div className="text-white font-medium">Health Check Rápido</div>
                    <div className="text-gray-400 text-sm">Verificar estado del sistema</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Issues */}
            {systemStatus?.health?.issues?.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                <h3 className="text-lg font-medium text-red-400 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Problemas Detectados
                </h3>
                <div className="space-y-2">
                  {systemStatus.health.issues.map((issue: string, index: number) => (
                    <div key={index} className="text-red-300 text-sm">• {issue}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'testing' && (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-codestorm-accent mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Dashboard de Testing</h3>
            <p className="text-gray-400 mb-6">Ejecuta y monitorea pruebas detalladas de todos los agentes</p>
            <button
              onClick={() => setShowTestingDashboard(true)}
              className="px-6 py-3 bg-codestorm-accent text-white rounded-lg hover:bg-codestorm-accent/80 transition-colors"
            >
              Abrir Dashboard de Testing
            </button>
          </div>
        )}

        {activeTab === 'distribution' && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Monitor de Distribución</h3>
            <p className="text-gray-400 mb-6">Visualiza la distribución de agentes entre OpenAI y Claude</p>
            <button
              onClick={() => setShowDistributionMonitor(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Abrir Monitor de Distribución
            </button>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Información del Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-medium mb-2">Estado de Conexión</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Conectado:</span>
                      <span className={getStatusColor(systemStatus?.connection?.isConnected || false)}>
                        {systemStatus?.connection?.isConnected ? 'Sí' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Proveedor:</span>
                      <span className="text-white">{systemStatus?.connection?.provider || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Última verificación:</span>
                      <span className="text-white">
                        {systemStatus?.connection?.lastChecked ? formatTime(systemStatus.connection.lastChecked) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-medium mb-2">Estadísticas de Uso</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Requests OpenAI:</span>
                      <span className="text-green-400">{systemStatus?.usage?.openai?.requests || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Requests Claude:</span>
                      <span className="text-blue-400">{systemStatus?.usage?.claude?.requests || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Errores totales:</span>
                      <span className="text-red-400">
                        {(systemStatus?.usage?.openai?.errors || 0) + (systemStatus?.usage?.claude?.errors || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AgentTestingDashboard 
        isVisible={showTestingDashboard}
        onClose={() => setShowTestingDashboard(false)}
      />
      
      <AgentDistributionMonitor 
        isVisible={showDistributionMonitor}
        onClose={() => setShowDistributionMonitor(false)}
      />
    </div>
  );
};

export default Mantenimiento;
