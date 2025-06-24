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
  Clock,
  Brain,
  Eye,
  Sliders
} from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import IntroAnimation from '../components/IntroAnimation';
import AudioControls from '../components/AudioControls';
import { AgentTestingDashboard } from '../components/constructor/AgentTestingDashboard';
import { AgentDistributionMonitor } from '../components/constructor/AgentDistributionMonitor';
import { AgentStatusLights } from '../components/constructor/AgentStatusLights';
import { GlobalModelSelector } from '../components/constructor/GlobalModelSelector';
import { RealTimeMonitoringDashboard } from '../components/constructor/RealTimeMonitoringDashboard';
import { AgentTestingService, AgentTestSuite } from '../services/AgentTestingService';
import { AgentDistributionService } from '../services/AgentDistributionService';
import { EnhancedAPIService } from '../services/EnhancedAPIService';
import { SystemMonitoringService, SystemMetrics } from '../services/SystemMonitoringService';
import { getGlobalModelConfig, getAllConfiguredAgents } from '../config/claudeModels';
import TokenUsageDashboard from '../components/TokenUsageDashboard';
import TokenAlertModal from '../components/TokenAlertModal';
import TokenTrackingTest from '../components/TokenTrackingTest';
import { useTokenTracking } from '../hooks/useTokenTracking';
import { useTokenTrackingMiddleware } from '../utils/tokenTrackingMiddleware';

const Mantenimiento: React.FC = () => {
  const { isMobile } = useUI();
  const [showIntro, setShowIntro] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'testing' | 'distribution' | 'system' | 'models' | 'monitoring' | 'tokens'>('overview');
  const [showTestingDashboard, setShowTestingDashboard] = useState(false);
  const [showDistributionMonitor, setShowDistributionMonitor] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showRealTimeMonitoring, setShowRealTimeMonitoring] = useState(false);
  const [showTokenAlerts, setShowTokenAlerts] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [lastTestSuite, setLastTestSuite] = useState<AgentTestSuite | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [globalConfig, setGlobalConfig] = useState(getGlobalModelConfig());

  // Token tracking
  const tokenTracking = useTokenTrackingMiddleware();
  const activeAlerts = tokenTracking.trackingState.alerts.filter(alert => !alert.acknowledged);

  const testingService = AgentTestingService.getInstance();
  const distributionService = AgentDistributionService.getInstance();
  const apiService = EnhancedAPIService.getInstance();
  const monitoringService = SystemMonitoringService.getInstance();

  useEffect(() => {
    loadSystemStatus();
    loadSystemMetrics();

    const interval = setInterval(() => {
      loadSystemStatus();
      loadSystemMetrics();
    }, 30000); // Actualizar cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const loadSystemStatus = async () => {
    setIsLoading(true);
    try {
      // Cargar estado del sistema (legacy)
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

  const loadSystemMetrics = async () => {
    try {
      const metrics = await monitoringService.updateMetrics();
      setSystemMetrics(metrics);
      setGlobalConfig(getGlobalModelConfig());
    } catch (error) {
      console.error('Error loading system metrics:', error);
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
    { id: 'tokens', name: 'Tokens', icon: Zap, badge: activeAlerts.length > 0 ? activeAlerts.length : undefined },
    { id: 'monitoring', name: 'Monitoreo', icon: Eye },
    { id: 'models', name: 'Modelos IA', icon: Brain },
    { id: 'testing', name: 'Testing', icon: Activity },
    { id: 'distribution', name: 'Distribución', icon: BarChart3 },
    { id: 'system', name: 'Sistema', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Intro Animation */}
      {showIntro && (
        <IntroAnimation
          onComplete={() => setShowIntro(false)}
          pageName="Mantenimiento"
          duration={2500}
          skipable={true}
        />
      )}

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
              {/* Audio Controls */}
              <AudioControls showFullControls={true} />

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
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors whitespace-nowrap relative ${
                    activeTab === tab.id
                      ? 'border-codestorm-accent text-codestorm-accent'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                  {tab.badge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowRealTimeMonitoring(true)}
                  className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Eye className="w-6 h-6 text-codestorm-accent" />
                  <div className="text-left">
                    <div className="text-white font-medium">Monitoreo en Tiempo Real</div>
                    <div className="text-gray-400 text-sm">Dashboard de métricas avanzadas</div>
                  </div>
                </button>

                <button
                  onClick={() => setShowModelSelector(true)}
                  className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Brain className="w-6 h-6 text-purple-400" />
                  <div className="text-left">
                    <div className="text-white font-medium">Configurar Modelos IA</div>
                    <div className="text-gray-400 text-sm">Gestionar modelos de agentes</div>
                  </div>
                </button>

                <button
                  onClick={() => setShowTestingDashboard(true)}
                  className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Activity className="w-6 h-6 text-green-400" />
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
                  <Shield className="w-6 h-6 text-yellow-400" />
                  <div className="text-left">
                    <div className="text-white font-medium">Health Check Rápido</div>
                    <div className="text-gray-400 text-sm">Verificar estado del sistema</div>
                  </div>
                </button>

                <button
                  onClick={loadSystemMetrics}
                  disabled={isLoading}
                  className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-6 h-6 text-orange-400 ${isLoading ? 'animate-spin' : ''}`} />
                  <div className="text-left">
                    <div className="text-white font-medium">Actualizar Métricas</div>
                    <div className="text-gray-400 text-sm">Refrescar datos del sistema</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Real-time Metrics Preview */}
            {systemMetrics && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-codestorm-accent" />
                  Métricas en Tiempo Real
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Agentes Saludables</div>
                    <div className="text-2xl font-bold text-green-400">
                      {systemMetrics.agents.filter(a => a.status === 'healthy').length}/{systemMetrics.agents.length}
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Tiempo Promedio</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {systemMetrics.performance.averageResponseTime < 1000
                        ? `${Math.round(systemMetrics.performance.averageResponseTime)}ms`
                        : `${(systemMetrics.performance.averageResponseTime / 1000).toFixed(1)}s`
                      }
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Proxy API</div>
                    <div className={`text-2xl font-bold ${systemMetrics.proxy.isRunning ? 'text-green-400' : 'text-red-400'}`}>
                      {systemMetrics.proxy.isRunning ? 'Activo' : 'Inactivo'}
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Modelo Default</div>
                    <div className="text-2xl font-bold text-purple-400">
                      {systemMetrics.globalConfig.defaultModel.provider}
                    </div>
                  </div>
                </div>
              </div>
            )}

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

        {activeTab === 'monitoring' && (
          <div className="text-center py-12">
            <Eye className="w-16 h-16 text-codestorm-accent mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Monitoreo en Tiempo Real</h3>
            <p className="text-gray-400 mb-6">Dashboard avanzado con métricas detalladas del sistema</p>
            <button
              onClick={() => setShowRealTimeMonitoring(true)}
              className="px-6 py-3 bg-codestorm-accent text-white rounded-lg hover:bg-codestorm-accent/80 transition-colors"
            >
              Abrir Dashboard de Monitoreo
            </button>
          </div>
        )}

        {activeTab === 'tokens' && (
          <div className="space-y-6">
            {/* Token Alerts Banner */}
            {activeAlerts.length > 0 && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                    <div>
                      <h3 className="text-red-400 font-semibold">
                        {activeAlerts.length} Alerta{activeAlerts.length !== 1 ? 's' : ''} de Token{activeAlerts.length !== 1 ? 's' : ''} Activa{activeAlerts.length !== 1 ? 's' : ''}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Algunos agentes han alcanzado umbrales críticos de uso de tokens
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTokenAlerts(true)}
                    className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors"
                  >
                    Ver Alertas
                  </button>
                </div>
              </div>
            )}

            {/* Token Usage Dashboard */}
            <TokenUsageDashboard />

            {/* Token Tracking Test */}
            <TokenTrackingTest />
          </div>
        )}

        {activeTab === 'models' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                Configuración Global de Modelos IA
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-white font-medium mb-2">Modelo Por Defecto</h4>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-400 mb-1">
                      {globalConfig.defaultModel.provider}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {globalConfig.defaultModel.modelId}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-medium mb-2">Estadísticas</h4>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-400 mb-1">
                      {getAllConfiguredAgents().length}
                    </div>
                    <div className="text-gray-400 text-sm">
                      Agentes configurados • {Object.keys(globalConfig.agentOverrides).length} personalizados
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowModelSelector(true)}
                  className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Configurar Modelos
                </button>
              </div>
            </div>

            {/* Agent Models Overview */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Modelos por Agente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getAllConfiguredAgents().slice(0, 9).map(agentName => {
                  const hasOverride = !!globalConfig.agentOverrides[agentName];
                  const provider = hasOverride
                    ? globalConfig.agentOverrides[agentName].provider
                    : globalConfig.defaultModel.provider;

                  return (
                    <div key={agentName} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium text-sm">{agentName}</h4>
                        {hasOverride && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {provider} • {hasOverride ? 'Personalizado' : 'Por defecto'}
                      </div>
                    </div>
                  );
                })}
              </div>
              {getAllConfiguredAgents().length > 9 && (
                <div className="text-center mt-4">
                  <span className="text-gray-400 text-sm">
                    Y {getAllConfiguredAgents().length - 9} agentes más...
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'testing' && (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Dashboard de Testing</h3>
            <p className="text-gray-400 mb-6">Ejecuta y monitorea pruebas detalladas de todos los agentes</p>
            <button
              onClick={() => setShowTestingDashboard(true)}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
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

      <GlobalModelSelector
        isVisible={showModelSelector}
        onClose={() => setShowModelSelector(false)}
        onConfigChange={() => {
          setGlobalConfig(getGlobalModelConfig());
          loadSystemMetrics();
        }}
      />

      <RealTimeMonitoringDashboard
        isVisible={showRealTimeMonitoring}
        onClose={() => setShowRealTimeMonitoring(false)}
      />

      <TokenAlertModal
        alerts={activeAlerts}
        isVisible={showTokenAlerts}
        onClose={() => setShowTokenAlerts(false)}
        onAcknowledge={(alertId) => {
          tokenTracking.acknowledgeAlert(alertId);
        }}
        onAcknowledgeAll={() => {
          activeAlerts.forEach(alert => tokenTracking.acknowledgeAlert(alert.id));
          setShowTokenAlerts(false);
        }}
        onResetAgent={(agentName) => {
          if (window.confirm(`¿Estás seguro de que quieres resetear los tokens para ${agentName}?`)) {
            tokenTracking.resetAgentTokens(agentName);
          }
        }}
        onViewDashboard={() => {
          setShowTokenAlerts(false);
          setActiveTab('tokens');
        }}
      />
    </div>
  );
};

export default Mantenimiento;
