import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Zap, AlertTriangle, CheckCircle, BarChart3, Download, FileText } from 'lucide-react';
import { AgentDistributionService } from '../../services/AgentDistributionService';
import { AgentTestingService } from '../../services/AgentTestingService';
import { generateErrorReport, downloadErrorReport } from '../../utils/testingReports';

interface AgentDistributionMonitorProps {
  isVisible?: boolean;
  onClose?: () => void;
}

interface UsageStats {
  openai: { requests: number; errors: number; lastUsed: number };
  claude: { requests: number; errors: number; lastUsed: number };
  distribution: { openai: string[]; claude: string[] };
  recommendations: string[];
}

export const AgentDistributionMonitor: React.FC<AgentDistributionMonitorProps> = ({
  isVisible = false,
  onClose
}) => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const distributionService = AgentDistributionService.getInstance();
  const testingService = AgentTestingService.getInstance();

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const usageStats = distributionService.getUsageStats();
      const health = await distributionService.healthCheck();
      
      setStats(usageStats);
      setHealthStatus(health);
    } catch (error) {
      console.error('Error loading agent distribution stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      loadStats();
      const interval = setInterval(loadStats, 10000); // Actualizar cada 10 segundos
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const getProviderColor = (provider: 'openai' | 'claude') => {
    return provider === 'openai' ? 'text-green-400' : 'text-blue-400';
  };

  const getProviderBg = (provider: 'openai' | 'claude') => {
    return provider === 'openai' ? 'bg-green-500/20' : 'bg-blue-500/20';
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'Nunca';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Hace menos de 1 min';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `Hace ${hours}h ${minutes % 60}min`;
  };

  const generateAndDownloadErrorReport = async (format: 'json' | 'txt' | 'pdf' = 'txt') => {
    setIsGeneratingReport(true);
    try {
      // Obtener los últimos resultados de testing
      const latestTestSuite = testingService.getLatestTestSuite();

      if (!latestTestSuite) {
        alert('No hay resultados de testing disponibles. Ejecuta primero las pruebas de agentes.');
        return;
      }

      // Verificar si hay errores para reportar
      const hasErrors = latestTestSuite.results.some(r => r.status === 'error' || r.status === 'warning');

      if (!hasErrors) {
        alert('¡Excelente! No se encontraron errores en la última ejecución de pruebas.');
        return;
      }

      // Generar el informe de errores
      const errorReport = generateErrorReport(latestTestSuite);

      // Descargar el informe
      downloadErrorReport(errorReport, format);

      console.log('✅ Informe de errores generado y descargado exitosamente');

    } catch (error) {
      console.error('Error generando informe de errores:', error);
      alert('Error al generar el informe de errores. Revisa la consola para más detalles.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-codestorm-accent" />
            <h2 className="text-xl font-semibold text-white">Monitor de Distribución de Agentes</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-codestorm-accent"></div>
              <span className="ml-3 text-gray-300">Cargando estadísticas...</span>
            </div>
          ) : (
            <>
              {/* Health Status */}
              {healthStatus && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Estado de Salud del Sistema
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    {healthStatus.healthy ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    )}
                    <span className={healthStatus.healthy ? 'text-green-400' : 'text-red-400'}>
                      {healthStatus.healthy ? 'Sistema Saludable' : 'Problemas Detectados'}
                    </span>
                  </div>
                  
                  {healthStatus.issues.length > 0 && (
                    <div className="space-y-1">
                      {healthStatus.issues.map((issue: string, index: number) => (
                        <div key={index} className="text-red-300 text-sm flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          {issue}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Provider Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-400" />
                    OpenAI
                  </h3>
                  {stats && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Solicitudes:</span>
                        <span className="text-green-400">{stats.openai.requests}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Errores:</span>
                        <span className="text-red-400">{stats.openai.errors}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Último uso:</span>
                        <span className="text-gray-400">{formatTime(stats.openai.lastUsed)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Tasa de éxito:</span>
                        <span className="text-green-400">
                          {stats.openai.requests > 0 
                            ? `${(((stats.openai.requests - stats.openai.errors) / stats.openai.requests) * 100).toFixed(1)}%`
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-blue-400" />
                    Claude
                  </h3>
                  {stats && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Solicitudes:</span>
                        <span className="text-blue-400">{stats.claude.requests}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Errores:</span>
                        <span className="text-red-400">{stats.claude.errors}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Último uso:</span>
                        <span className="text-gray-400">{formatTime(stats.claude.lastUsed)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Tasa de éxito:</span>
                        <span className="text-blue-400">
                          {stats.claude.requests > 0 
                            ? `${(((stats.claude.requests - stats.claude.errors) / stats.claude.requests) * 100).toFixed(1)}%`
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Agent Distribution */}
              {stats && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-3">Distribución de Agentes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-green-400 font-medium mb-2">OpenAI ({stats.distribution.openai.length} agentes)</h4>
                      <div className="space-y-1">
                        {stats.distribution.openai.map((agent, index) => (
                          <div key={index} className="text-sm text-gray-300 bg-green-500/10 px-2 py-1 rounded">
                            {agent}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-blue-400 font-medium mb-2">Claude ({stats.distribution.claude.length} agentes)</h4>
                      <div className="space-y-1">
                        {stats.distribution.claude.map((agent, index) => (
                          <div key={index} className="text-sm text-gray-300 bg-blue-500/10 px-2 py-1 rounded">
                            {agent}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {stats && stats.recommendations.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-yellow-400 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Recomendaciones de Optimización
                  </h3>
                  <div className="space-y-2">
                    {stats.recommendations.map((recommendation, index) => (
                      <div key={index} className="text-yellow-300 text-sm">
                        • {recommendation}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={loadStats}
                    className="px-4 py-2 bg-codestorm-accent text-white rounded-lg hover:bg-codestorm-accent/80 transition-colors"
                  >
                    Actualizar Estadísticas
                  </button>
                  <button
                    onClick={() => {
                      distributionService.resetStats();
                      loadStats();
                    }}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Reiniciar Estadísticas
                  </button>
                </div>

                {/* Error Report Section */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-red-400" />
                    Informe de Errores
                  </h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Genera un informe detallado de errores basado en los últimos resultados de testing de agentes.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => generateAndDownloadErrorReport('txt')}
                      disabled={isGeneratingReport}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {isGeneratingReport ? 'Generando...' : 'Descargar Informe (TXT)'}
                    </button>

                    <button
                      onClick={() => generateAndDownloadErrorReport('json')}
                      disabled={isGeneratingReport}
                      className="px-4 py-2 bg-red-600/80 text-white rounded-lg hover:bg-red-700/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {isGeneratingReport ? 'Generando...' : 'Descargar Informe (JSON)'}
                    </button>

                    <button
                      onClick={() => generateAndDownloadErrorReport('pdf')}
                      disabled={isGeneratingReport}
                      className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      {isGeneratingReport ? 'Generando...' : 'Descargar Informe (PDF)'}
                    </button>
                  </div>

                  <div className="mt-3 text-xs text-gray-400">
                    💡 El informe incluye solo agentes con errores o advertencias, métricas de rendimiento y recomendaciones de corrección.
                    <br />
                    📄 Formatos disponibles: TXT (legible), JSON (estructurado), PDF (profesional con gráficos)
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDistributionMonitor;
