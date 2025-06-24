import { AgentTestSuite, AgentTestResult } from '../services/AgentTestingService';
import { getDistributedAgentConfig } from '../config/claudeModels';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface DetailedReport {
  summary: {
    totalAgents: number;
    totalTests: number;
    successRate: number;
    averageResponseTime: number;
    overallHealth: 'healthy' | 'degraded' | 'critical';
    timestamp: number;
  };
  providerBreakdown: {
    openai: {
      agentCount: number;
      successRate: number;
      averageResponseTime: number;
      agents: string[];
    };
    claude: {
      agentCount: number;
      successRate: number;
      averageResponseTime: number;
      agents: string[];
    };
  };
  agentDetails: Array<{
    agentName: string;
    provider: 'openai' | 'claude';
    model: string;
    status: 'success' | 'warning' | 'error';
    responseTime: number;
    quality: number;
    issues: string[];
    recommendations: string[];
  }>;
  systemRecommendations: string[];
  criticalIssues: string[];
  performanceMetrics: {
    fastestAgent: { name: string; time: number };
    slowestAgent: { name: string; time: number };
    highestQuality: { name: string; quality: number };
    lowestQuality: { name: string; quality: number };
  };
}

/**
 * Genera un reporte detallado basado en los resultados de testing
 */
export function generateDetailedReport(testSuite: AgentTestSuite): DetailedReport {
  const { results } = testSuite;
  
  // Calcular métricas generales
  const totalTests = results.length;
  const successfulTests = results.filter(r => r.status === 'success').length;
  const successRate = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;
  const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / totalTests;

  // Breakdown por proveedor
  const openaiResults = results.filter(r => r.provider === 'openai');
  const claudeResults = results.filter(r => r.provider === 'claude');
  
  const openaiSuccess = openaiResults.filter(r => r.status === 'success').length;
  const claudeSuccess = claudeResults.filter(r => r.status === 'success').length;
  
  const openaiSuccessRate = openaiResults.length > 0 ? (openaiSuccess / openaiResults.length) * 100 : 0;
  const claudeSuccessRate = claudeResults.length > 0 ? (claudeSuccess / claudeResults.length) * 100 : 0;
  
  const openaiAvgTime = openaiResults.length > 0 
    ? openaiResults.reduce((sum, r) => sum + r.responseTime, 0) / openaiResults.length 
    : 0;
  const claudeAvgTime = claudeResults.length > 0 
    ? claudeResults.reduce((sum, r) => sum + r.responseTime, 0) / claudeResults.length 
    : 0;

  // Obtener agentes únicos por proveedor
  const openaiAgents = [...new Set(openaiResults.map(r => r.agentName))];
  const claudeAgents = [...new Set(claudeResults.map(r => r.agentName))];

  // Detalles por agente
  const agentDetails = [...new Set(results.map(r => r.agentName))].map(agentName => {
    const agentResults = results.filter(r => r.agentName === agentName);
    const latestResult = agentResults[agentResults.length - 1];
    const config = getDistributedAgentConfig(agentName);
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (latestResult.responseTime > 20000) {
      issues.push('Tiempo de respuesta lento (>20s)');
      recommendations.push('Considerar optimizar el prompt o cambiar de modelo');
    }
    
    if (latestResult.metrics.responseQuality < 50) {
      issues.push('Calidad de respuesta baja (<50%)');
      recommendations.push('Revisar el prompt funcional del agente');
    }
    
    if (latestResult.status === 'error') {
      issues.push('Fallo en la conectividad');
      recommendations.push('Verificar configuración de API y conectividad');
    }
    
    return {
      agentName,
      provider: config.provider,
      model: config.model.name,
      status: latestResult.status,
      responseTime: latestResult.responseTime,
      quality: latestResult.metrics.responseQuality,
      issues,
      recommendations
    };
  });

  // Métricas de rendimiento
  const sortedByTime = [...results].sort((a, b) => a.responseTime - b.responseTime);
  const sortedByQuality = [...results].sort((a, b) => b.metrics.responseQuality - a.metrics.responseQuality);
  
  const performanceMetrics = {
    fastestAgent: {
      name: sortedByTime[0]?.agentName || 'N/A',
      time: sortedByTime[0]?.responseTime || 0
    },
    slowestAgent: {
      name: sortedByTime[sortedByTime.length - 1]?.agentName || 'N/A',
      time: sortedByTime[sortedByTime.length - 1]?.responseTime || 0
    },
    highestQuality: {
      name: sortedByQuality[0]?.agentName || 'N/A',
      quality: sortedByQuality[0]?.metrics.responseQuality || 0
    },
    lowestQuality: {
      name: sortedByQuality[sortedByQuality.length - 1]?.agentName || 'N/A',
      quality: sortedByQuality[sortedByQuality.length - 1]?.metrics.responseQuality || 0
    }
  };

  // Problemas críticos
  const criticalIssues: string[] = [];
  const errorResults = results.filter(r => r.status === 'error');
  
  if (errorResults.length > 0) {
    criticalIssues.push(`${errorResults.length} agentes no funcionan correctamente`);
  }
  
  if (successRate < 50) {
    criticalIssues.push('Tasa de éxito general muy baja (<50%)');
  }
  
  if (averageResponseTime > 25000) {
    criticalIssues.push('Tiempo de respuesta promedio muy alto (>25s)');
  }

  // Recomendaciones del sistema
  const systemRecommendations: string[] = [];
  
  if (openaiSuccessRate < claudeSuccessRate - 20) {
    systemRecommendations.push('Considerar mover más agentes a Claude debido a mejor rendimiento');
  } else if (claudeSuccessRate < openaiSuccessRate - 20) {
    systemRecommendations.push('Considerar mover más agentes a OpenAI debido a mejor rendimiento');
  }
  
  if (openaiAvgTime > claudeAvgTime * 1.5) {
    systemRecommendations.push('OpenAI muestra tiempos de respuesta más lentos');
  } else if (claudeAvgTime > openaiAvgTime * 1.5) {
    systemRecommendations.push('Claude muestra tiempos de respuesta más lentos');
  }
  
  if (successRate > 90) {
    systemRecommendations.push('Sistema funcionando óptimamente');
  } else if (successRate > 70) {
    systemRecommendations.push('Sistema funcionando bien con algunas mejoras posibles');
  } else {
    systemRecommendations.push('Sistema requiere atención inmediata');
  }

  return {
    summary: {
      totalAgents: [...new Set(results.map(r => r.agentName))].length,
      totalTests,
      successRate,
      averageResponseTime,
      overallHealth: testSuite.overallHealth,
      timestamp: testSuite.timestamp
    },
    providerBreakdown: {
      openai: {
        agentCount: openaiAgents.length,
        successRate: openaiSuccessRate,
        averageResponseTime: openaiAvgTime,
        agents: openaiAgents
      },
      claude: {
        agentCount: claudeAgents.length,
        successRate: claudeSuccessRate,
        averageResponseTime: claudeAvgTime,
        agents: claudeAgents
      }
    },
    agentDetails,
    systemRecommendations,
    criticalIssues,
    performanceMetrics
  };
}

/**
 * Exporta un reporte a formato JSON
 */
export function exportReportAsJSON(report: DetailedReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Exporta un reporte a formato de texto legible
 */
export function exportReportAsText(report: DetailedReport): string {
  const { summary, providerBreakdown, agentDetails, systemRecommendations, criticalIssues, performanceMetrics } = report;
  
  let text = `REPORTE DE TESTING DE AGENTES CODESTORM\n`;
  text += `=========================================\n\n`;
  
  text += `RESUMEN GENERAL\n`;
  text += `---------------\n`;
  text += `Fecha: ${new Date(summary.timestamp).toLocaleString()}\n`;
  text += `Total de Agentes: ${summary.totalAgents}\n`;
  text += `Total de Pruebas: ${summary.totalTests}\n`;
  text += `Tasa de Éxito: ${summary.successRate.toFixed(1)}%\n`;
  text += `Tiempo Promedio: ${summary.averageResponseTime.toFixed(0)}ms\n`;
  text += `Estado General: ${summary.overallHealth.toUpperCase()}\n\n`;
  
  text += `DISTRIBUCIÓN POR PROVEEDOR\n`;
  text += `--------------------------\n`;
  text += `OpenAI:\n`;
  text += `  - Agentes: ${providerBreakdown.openai.agentCount}\n`;
  text += `  - Tasa de Éxito: ${providerBreakdown.openai.successRate.toFixed(1)}%\n`;
  text += `  - Tiempo Promedio: ${providerBreakdown.openai.averageResponseTime.toFixed(0)}ms\n`;
  text += `  - Agentes: ${providerBreakdown.openai.agents.join(', ')}\n\n`;
  
  text += `Claude:\n`;
  text += `  - Agentes: ${providerBreakdown.claude.agentCount}\n`;
  text += `  - Tasa de Éxito: ${providerBreakdown.claude.successRate.toFixed(1)}%\n`;
  text += `  - Tiempo Promedio: ${providerBreakdown.claude.averageResponseTime.toFixed(0)}ms\n`;
  text += `  - Agentes: ${providerBreakdown.claude.agents.join(', ')}\n\n`;
  
  if (criticalIssues.length > 0) {
    text += `PROBLEMAS CRÍTICOS\n`;
    text += `------------------\n`;
    criticalIssues.forEach(issue => {
      text += `⚠️ ${issue}\n`;
    });
    text += `\n`;
  }
  
  text += `MÉTRICAS DE RENDIMIENTO\n`;
  text += `-----------------------\n`;
  text += `Agente Más Rápido: ${performanceMetrics.fastestAgent.name} (${performanceMetrics.fastestAgent.time}ms)\n`;
  text += `Agente Más Lento: ${performanceMetrics.slowestAgent.name} (${performanceMetrics.slowestAgent.time}ms)\n`;
  text += `Mayor Calidad: ${performanceMetrics.highestQuality.name} (${performanceMetrics.highestQuality.quality.toFixed(1)}%)\n`;
  text += `Menor Calidad: ${performanceMetrics.lowestQuality.name} (${performanceMetrics.lowestQuality.quality.toFixed(1)}%)\n\n`;
  
  text += `RECOMENDACIONES\n`;
  text += `---------------\n`;
  systemRecommendations.forEach(rec => {
    text += `💡 ${rec}\n`;
  });
  text += `\n`;
  
  text += `DETALLES POR AGENTE\n`;
  text += `-------------------\n`;
  agentDetails.forEach(agent => {
    text += `${agent.agentName} (${agent.provider} - ${agent.model}):\n`;
    text += `  Estado: ${agent.status.toUpperCase()}\n`;
    text += `  Tiempo: ${agent.responseTime}ms\n`;
    text += `  Calidad: ${agent.quality.toFixed(1)}%\n`;
    if (agent.issues.length > 0) {
      text += `  Problemas: ${agent.issues.join(', ')}\n`;
    }
    if (agent.recommendations.length > 0) {
      text += `  Recomendaciones: ${agent.recommendations.join(', ')}\n`;
    }
    text += `\n`;
  });
  
  return text;
}

/**
 * Interfaz para el informe específico de errores
 */
export interface ErrorReport {
  executiveSummary: {
    totalAgents: number;
    failedAgents: number;
    errorRate: number;
    criticalErrors: number;
    warningCount: number;
    timestamp: number;
    testDuration: number;
  };
  failedAgents: {
    agentName: string;
    provider: 'openai' | 'claude';
    model: string;
    errorType: 'connectivity' | 'timeout' | 'invalid_response' | 'api_error' | 'unknown';
    errorMessage: string;
    timestamp: number;
    responseTime: number;
    testType: string;
    retryCount?: number;
  }[];
  performanceMetrics: {
    agentName: string;
    provider: 'openai' | 'claude';
    averageResponseTime: number;
    successRate: number;
    lastSuccessfulTest: number | null;
    consecutiveFailures: number;
  }[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: 'connectivity' | 'performance' | 'configuration' | 'api_limits';
    description: string;
    affectedAgents: string[];
    suggestedAction: string;
  }[];
  errorPatterns: {
    pattern: string;
    frequency: number;
    affectedAgents: string[];
    possibleCause: string;
  }[];
}

/**
 * Genera un informe específico de errores basado en los resultados de testing
 */
export function generateErrorReport(testSuite: AgentTestSuite): ErrorReport {
  const { results } = testSuite;

  // Filtrar solo resultados con errores o warnings
  const failedResults = results.filter(r => r.status === 'error' || r.status === 'warning');
  const errorResults = results.filter(r => r.status === 'error');
  const warningResults = results.filter(r => r.status === 'warning');

  // Resumen ejecutivo
  const totalAgents = [...new Set(results.map(r => r.agentName))].length;
  const failedAgents = [...new Set(failedResults.map(r => r.agentName))].length;
  const errorRate = totalAgents > 0 ? (failedAgents / totalAgents) * 100 : 0;

  // Agentes fallidos con detalles
  const failedAgentDetails = failedResults.map(result => ({
    agentName: result.agentName,
    provider: result.provider,
    model: result.model,
    errorType: categorizeError(result.error || ''),
    errorMessage: result.error || 'Error desconocido',
    timestamp: result.timestamp,
    responseTime: result.responseTime,
    testType: result.testType,
    retryCount: 0 // TODO: Implementar conteo de reintentos
  }));

  // Métricas de rendimiento por agente
  const agentNames = [...new Set(results.map(r => r.agentName))];
  const performanceMetrics = agentNames.map(agentName => {
    const agentResults = results.filter(r => r.agentName === agentName);
    const successfulResults = agentResults.filter(r => r.status === 'success');
    const successRate = agentResults.length > 0 ? (successfulResults.length / agentResults.length) * 100 : 0;
    const avgResponseTime = agentResults.reduce((sum, r) => sum + r.responseTime, 0) / agentResults.length;
    const lastSuccessful = successfulResults.length > 0 ?
      Math.max(...successfulResults.map(r => r.timestamp)) : null;

    // Contar fallos consecutivos
    let consecutiveFailures = 0;
    const sortedResults = agentResults.sort((a, b) => b.timestamp - a.timestamp);
    for (const result of sortedResults) {
      if (result.status === 'error') {
        consecutiveFailures++;
      } else {
        break;
      }
    }

    const agentConfig = getDistributedAgentConfig(agentName);

    return {
      agentName,
      provider: agentConfig.provider,
      averageResponseTime: avgResponseTime,
      successRate,
      lastSuccessfulTest: lastSuccessful,
      consecutiveFailures
    };
  });

  // Generar recomendaciones
  const recommendations = generateErrorRecommendations(failedResults, performanceMetrics);

  // Detectar patrones de error
  const errorPatterns = detectErrorPatterns(failedResults);

  return {
    executiveSummary: {
      totalAgents,
      failedAgents,
      errorRate,
      criticalErrors: errorResults.length,
      warningCount: warningResults.length,
      timestamp: testSuite.timestamp,
      testDuration: testSuite.duration
    },
    failedAgents: failedAgentDetails,
    performanceMetrics,
    recommendations,
    errorPatterns
  };
}

/**
 * Categoriza el tipo de error basado en el mensaje
 */
function categorizeError(errorMessage: string): 'connectivity' | 'timeout' | 'invalid_response' | 'api_error' | 'unknown' {
  const message = errorMessage.toLowerCase();

  if (message.includes('econnrefused') || message.includes('connection') || message.includes('network')) {
    return 'connectivity';
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'timeout';
  }
  if (message.includes('invalid') || message.includes('malformed') || message.includes('parse')) {
    return 'invalid_response';
  }
  if (message.includes('api') || message.includes('unauthorized') || message.includes('rate limit')) {
    return 'api_error';
  }

  return 'unknown';
}

/**
 * Genera recomendaciones específicas basadas en los errores detectados
 */
function generateErrorRecommendations(
  failedResults: AgentTestResult[],
  performanceMetrics: ErrorReport['performanceMetrics']
): ErrorReport['recommendations'] {
  const recommendations: ErrorReport['recommendations'] = [];

  // Analizar errores de conectividad
  const connectivityErrors = failedResults.filter(r =>
    r.error?.toLowerCase().includes('econnrefused') ||
    r.error?.toLowerCase().includes('connection')
  );

  if (connectivityErrors.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'connectivity',
      description: 'Múltiples errores de conectividad detectados',
      affectedAgents: [...new Set(connectivityErrors.map(r => r.agentName))],
      suggestedAction: 'Verificar que el servidor proxy esté ejecutándose en el puerto 3001 y que las APIs estén accesibles'
    });
  }

  // Analizar agentes con múltiples fallos consecutivos
  const criticalAgents = performanceMetrics.filter(m => m.consecutiveFailures >= 3);
  if (criticalAgents.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'performance',
      description: 'Agentes con múltiples fallos consecutivos',
      affectedAgents: criticalAgents.map(a => a.agentName),
      suggestedAction: 'Revisar configuración específica de estos agentes y considerar redistribución a otro proveedor'
    });
  }

  // Analizar problemas por proveedor
  const openaiErrors = failedResults.filter(r => r.provider === 'openai').length;
  const claudeErrors = failedResults.filter(r => r.provider === 'claude').length;

  if (openaiErrors > claudeErrors * 2) {
    recommendations.push({
      priority: 'medium',
      category: 'configuration',
      description: 'Alta tasa de errores en agentes de OpenAI',
      affectedAgents: [...new Set(failedResults.filter(r => r.provider === 'openai').map(r => r.agentName))],
      suggestedAction: 'Verificar API key de OpenAI y considerar redistribuir algunos agentes a Claude'
    });
  } else if (claudeErrors > openaiErrors * 2) {
    recommendations.push({
      priority: 'medium',
      category: 'configuration',
      description: 'Alta tasa de errores en agentes de Claude',
      affectedAgents: [...new Set(failedResults.filter(r => r.provider === 'claude').map(r => r.agentName))],
      suggestedAction: 'Verificar API key de Claude y considerar redistribuir algunos agentes a OpenAI'
    });
  }

  // Analizar timeouts
  const timeoutErrors = failedResults.filter(r =>
    r.error?.toLowerCase().includes('timeout') || r.responseTime > 30000
  );

  if (timeoutErrors.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'performance',
      description: 'Múltiples errores de timeout detectados',
      affectedAgents: [...new Set(timeoutErrors.map(r => r.agentName))],
      suggestedAction: 'Aumentar el timeout de las pruebas o optimizar las consultas a los agentes'
    });
  }

  return recommendations;
}

/**
 * Detecta patrones comunes en los errores
 */
function detectErrorPatterns(failedResults: AgentTestResult[]): ErrorReport['errorPatterns'] {
  const patterns: { [key: string]: { count: number; agents: Set<string> } } = {};

  failedResults.forEach(result => {
    const error = result.error || 'Error desconocido';

    // Normalizar el mensaje de error para detectar patrones
    let pattern = error;

    // Patrones comunes
    if (error.includes('ECONNREFUSED')) {
      pattern = 'Connection refused to proxy server';
    } else if (error.includes('timeout')) {
      pattern = 'Request timeout';
    } else if (error.includes('API key')) {
      pattern = 'API key authentication error';
    } else if (error.includes('rate limit')) {
      pattern = 'API rate limit exceeded';
    } else if (error.includes('Invalid response')) {
      pattern = 'Invalid API response format';
    }

    if (!patterns[pattern]) {
      patterns[pattern] = { count: 0, agents: new Set() };
    }

    patterns[pattern].count++;
    patterns[pattern].agents.add(result.agentName);
  });

  return Object.entries(patterns)
    .map(([pattern, data]) => ({
      pattern,
      frequency: data.count,
      affectedAgents: Array.from(data.agents),
      possibleCause: getPossibleCause(pattern)
    }))
    .sort((a, b) => b.frequency - a.frequency);
}

/**
 * Obtiene la posible causa de un patrón de error
 */
function getPossibleCause(pattern: string): string {
  const causes: { [key: string]: string } = {
    'Connection refused to proxy server': 'El servidor proxy no está ejecutándose o no es accesible',
    'Request timeout': 'Latencia alta en la red o sobrecarga del servidor',
    'API key authentication error': 'Clave API inválida o expirada',
    'API rate limit exceeded': 'Demasiadas solicitudes en poco tiempo',
    'Invalid API response format': 'Problema en la respuesta del proveedor de IA'
  };

  return causes[pattern] || 'Causa desconocida - requiere investigación manual';
}

/**
 * Descarga un reporte como archivo
 */
export function downloadReport(report: DetailedReport, format: 'json' | 'txt' = 'txt'): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `codestorm-agent-report-${timestamp}.${format}`;

  let content: string;
  let mimeType: string;
  
  if (format === 'json') {
    content = exportReportAsJSON(report);
    mimeType = 'application/json';
  } else {
    content = exportReportAsText(report);
    mimeType = 'text/plain';
  }
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Exporta un informe de errores a formato JSON
 */
export function exportErrorReportAsJSON(report: ErrorReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Exporta un informe de errores a formato de texto legible
 */
export function exportErrorReportAsText(report: ErrorReport): string {
  const { executiveSummary, failedAgents, performanceMetrics, recommendations, errorPatterns } = report;

  let text = `INFORME DE ERRORES - SISTEMA DE TESTING CODESTORM\n`;
  text += `=====================================================\n\n`;

  // Resumen ejecutivo
  text += `📊 RESUMEN EJECUTIVO\n`;
  text += `-------------------\n`;
  text += `Fecha del reporte: ${new Date(executiveSummary.timestamp).toLocaleString()}\n`;
  text += `Duración del test: ${(executiveSummary.testDuration / 1000).toFixed(1)}s\n`;
  text += `Total de agentes: ${executiveSummary.totalAgents}\n`;
  text += `Agentes fallidos: ${executiveSummary.failedAgents}\n`;
  text += `Tasa de error: ${executiveSummary.errorRate.toFixed(1)}%\n`;
  text += `Errores críticos: ${executiveSummary.criticalErrors}\n`;
  text += `Advertencias: ${executiveSummary.warningCount}\n\n`;

  // Estado general
  const healthStatus = executiveSummary.errorRate < 10 ? '🟢 SALUDABLE' :
                      executiveSummary.errorRate < 30 ? '🟡 DEGRADADO' : '🔴 CRÍTICO';
  text += `Estado del sistema: ${healthStatus}\n\n`;

  // Agentes fallidos
  if (failedAgents.length > 0) {
    text += `❌ AGENTES CON ERRORES (${failedAgents.length})\n`;
    text += `---------------------------\n`;

    failedAgents.forEach((agent, index) => {
      text += `${index + 1}. ${agent.agentName}\n`;
      text += `   Proveedor: ${agent.provider.toUpperCase()}\n`;
      text += `   Modelo: ${agent.model}\n`;
      text += `   Tipo de error: ${agent.errorType}\n`;
      text += `   Mensaje: ${agent.errorMessage}\n`;
      text += `   Tiempo de respuesta: ${agent.responseTime}ms\n`;
      text += `   Tipo de test: ${agent.testType}\n`;
      text += `   Timestamp: ${new Date(agent.timestamp).toLocaleString()}\n\n`;
    });
  }

  // Métricas de rendimiento
  text += `📈 MÉTRICAS DE RENDIMIENTO\n`;
  text += `-------------------------\n`;

  const criticalPerformance = performanceMetrics.filter(m => m.successRate < 50 || m.consecutiveFailures >= 3);
  const warningPerformance = performanceMetrics.filter(m => m.successRate < 80 && m.successRate >= 50);
  const healthyPerformance = performanceMetrics.filter(m => m.successRate >= 80 && m.consecutiveFailures < 3);

  if (criticalPerformance.length > 0) {
    text += `🔴 Agentes críticos (${criticalPerformance.length}):\n`;
    criticalPerformance.forEach(agent => {
      text += `   • ${agent.agentName} (${agent.provider}): ${agent.successRate.toFixed(1)}% éxito, ${agent.consecutiveFailures} fallos consecutivos\n`;
    });
    text += `\n`;
  }

  if (warningPerformance.length > 0) {
    text += `🟡 Agentes con advertencias (${warningPerformance.length}):\n`;
    warningPerformance.forEach(agent => {
      text += `   • ${agent.agentName} (${agent.provider}): ${agent.successRate.toFixed(1)}% éxito, ${agent.averageResponseTime.toFixed(0)}ms promedio\n`;
    });
    text += `\n`;
  }

  if (healthyPerformance.length > 0) {
    text += `🟢 Agentes saludables (${healthyPerformance.length}):\n`;
    healthyPerformance.forEach(agent => {
      text += `   • ${agent.agentName} (${agent.provider}): ${agent.successRate.toFixed(1)}% éxito\n`;
    });
    text += `\n`;
  }

  // Patrones de error
  if (errorPatterns.length > 0) {
    text += `🔍 PATRONES DE ERROR DETECTADOS\n`;
    text += `------------------------------\n`;

    errorPatterns.forEach((pattern, index) => {
      text += `${index + 1}. ${pattern.pattern}\n`;
      text += `   Frecuencia: ${pattern.frequency} ocurrencias\n`;
      text += `   Agentes afectados: ${pattern.affectedAgents.join(', ')}\n`;
      text += `   Posible causa: ${pattern.possibleCause}\n\n`;
    });
  }

  // Recomendaciones
  if (recommendations.length > 0) {
    text += `💡 RECOMENDACIONES DE CORRECCIÓN\n`;
    text += `-------------------------------\n`;

    const highPriority = recommendations.filter(r => r.priority === 'high');
    const mediumPriority = recommendations.filter(r => r.priority === 'medium');
    const lowPriority = recommendations.filter(r => r.priority === 'low');

    if (highPriority.length > 0) {
      text += `🔴 PRIORIDAD ALTA:\n`;
      highPriority.forEach((rec, index) => {
        text += `${index + 1}. ${rec.description}\n`;
        text += `   Categoría: ${rec.category}\n`;
        text += `   Agentes afectados: ${rec.affectedAgents.join(', ')}\n`;
        text += `   Acción sugerida: ${rec.suggestedAction}\n\n`;
      });
    }

    if (mediumPriority.length > 0) {
      text += `🟡 PRIORIDAD MEDIA:\n`;
      mediumPriority.forEach((rec, index) => {
        text += `${index + 1}. ${rec.description}\n`;
        text += `   Categoría: ${rec.category}\n`;
        text += `   Agentes afectados: ${rec.affectedAgents.join(', ')}\n`;
        text += `   Acción sugerida: ${rec.suggestedAction}\n\n`;
      });
    }

    if (lowPriority.length > 0) {
      text += `🟢 PRIORIDAD BAJA:\n`;
      lowPriority.forEach((rec, index) => {
        text += `${index + 1}. ${rec.description}\n`;
        text += `   Categoría: ${rec.category}\n`;
        text += `   Agentes afectados: ${rec.affectedAgents.join(', ')}\n`;
        text += `   Acción sugerida: ${rec.suggestedAction}\n\n`;
      });
    }
  }

  text += `\n---\n`;
  text += `Reporte generado por CODESTORM Agent Testing System\n`;
  text += `Timestamp: ${new Date().toISOString()}\n`;

  return text;
}



/**
 * Genera y descarga un informe de errores en formato PDF profesional
 */
export function generatePDFErrorReport(report: ErrorReport): void {
  try {
    // Crear nuevo documento PDF
    const doc = new jsPDF();

    // Configuración de colores corporativos CODESTORM
    const colors = {
      primary: [0, 123, 255], // Azul CODESTORM
      secondary: [108, 117, 125], // Gris
      success: [40, 167, 69], // Verde
      warning: [255, 193, 7], // Amarillo
      danger: [220, 53, 69], // Rojo
      dark: [33, 37, 41], // Negro
      light: [248, 249, 250] // Gris claro
    };

    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Función auxiliar para agregar nueva página si es necesario
    const checkPageBreak = (requiredSpace: number = 20) => {
      if (yPosition + requiredSpace > doc.internal.pageSize.height - 20) {
        doc.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    // Función auxiliar para agregar texto con wrap
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return lines.length * (fontSize * 0.35); // Retorna altura usada
    };

    // ENCABEZADO DEL DOCUMENTO
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Logo y título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('CODESTORM', margin, 25);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Informe de Errores del Sistema de Testing', margin, 35);

    // Fecha y hora
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, pageWidth - margin - 60, 25);
    doc.text(`Duración del test: ${(report.executiveSummary.testDuration / 1000).toFixed(1)}s`, pageWidth - margin - 60, 35);

    yPosition = 50;

    // RESUMEN EJECUTIVO
    doc.setTextColor(...colors.dark);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 RESUMEN EJECUTIVO', margin, yPosition);
    yPosition += 15;

    // Crear tabla de resumen
    const summaryData = [
      ['Total de Agentes', report.executiveSummary.totalAgents.toString()],
      ['Agentes Fallidos', report.executiveSummary.failedAgents.toString()],
      ['Tasa de Error', `${report.executiveSummary.errorRate.toFixed(1)}%`],
      ['Errores Críticos', report.executiveSummary.criticalErrors.toString()],
      ['Advertencias', report.executiveSummary.warningCount.toString()],
      ['Estado del Sistema', report.executiveSummary.errorRate < 10 ? '🟢 SALUDABLE' :
                            report.executiveSummary.errorRate < 30 ? '🟡 DEGRADADO' : '🔴 CRÍTICO']
    ];

    (doc as any).autoTable({
      startY: yPosition,
      head: [['Métrica', 'Valor']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: colors.primary, textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: colors.light },
      margin: { left: margin, right: margin },
      styles: { fontSize: 10 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // AGENTES CON ERRORES
    if (report.failedAgents.length > 0) {
      checkPageBreak(40);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.danger);
      doc.text(`❌ AGENTES CON ERRORES (${report.failedAgents.length})`, margin, yPosition);
      yPosition += 15;

      // Crear tabla de agentes fallidos
      const failedAgentsData = report.failedAgents.map(agent => [
        agent.agentName,
        agent.provider.toUpperCase(),
        agent.model,
        agent.errorType,
        agent.errorMessage.length > 50 ? agent.errorMessage.substring(0, 50) + '...' : agent.errorMessage,
        `${agent.responseTime}ms`,
        new Date(agent.timestamp).toLocaleTimeString()
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Agente', 'Proveedor', 'Modelo', 'Tipo Error', 'Mensaje', 'Tiempo', 'Hora']],
        body: failedAgentsData,
        theme: 'grid',
        headStyles: { fillColor: colors.danger, textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: colors.light },
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 25 }, // Agente
          1: { cellWidth: 20 }, // Proveedor
          2: { cellWidth: 25 }, // Modelo
          3: { cellWidth: 20 }, // Tipo Error
          4: { cellWidth: 50 }, // Mensaje
          5: { cellWidth: 15 }, // Tiempo
          6: { cellWidth: 20 }  // Hora
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // MÉTRICAS DE RENDIMIENTO
    checkPageBreak(40);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('📈 MÉTRICAS DE RENDIMIENTO', margin, yPosition);
    yPosition += 15;

    // Separar agentes por estado
    const criticalAgents = report.performanceMetrics.filter(m => m.successRate < 50 || m.consecutiveFailures >= 3);
    const warningAgents = report.performanceMetrics.filter(m => m.successRate < 80 && m.successRate >= 50);
    const healthyAgents = report.performanceMetrics.filter(m => m.successRate >= 80 && m.consecutiveFailures < 3);

    // Agentes críticos
    if (criticalAgents.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.danger);
      doc.text(`🔴 Agentes Críticos (${criticalAgents.length}):`, margin, yPosition);
      yPosition += 10;

      const criticalData = criticalAgents.map(agent => [
        agent.agentName,
        agent.provider.toUpperCase(),
        `${agent.successRate.toFixed(1)}%`,
        `${agent.averageResponseTime.toFixed(0)}ms`,
        agent.consecutiveFailures.toString(),
        agent.lastSuccessfulTest ? new Date(agent.lastSuccessfulTest).toLocaleString() : 'Nunca'
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Agente', 'Proveedor', 'Éxito', 'Tiempo Prom.', 'Fallos Consec.', 'Último Éxito']],
        body: criticalData,
        theme: 'grid',
        headStyles: { fillColor: colors.danger, textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [255, 240, 240] },
        margin: { left: margin, right: margin },
        styles: { fontSize: 9 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Agentes con advertencias
    if (warningAgents.length > 0) {
      checkPageBreak(30);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.warning);
      doc.text(`🟡 Agentes con Advertencias (${warningAgents.length}):`, margin, yPosition);
      yPosition += 10;

      const warningData = warningAgents.map(agent => [
        agent.agentName,
        agent.provider.toUpperCase(),
        `${agent.successRate.toFixed(1)}%`,
        `${agent.averageResponseTime.toFixed(0)}ms`
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Agente', 'Proveedor', 'Tasa de Éxito', 'Tiempo Promedio']],
        body: warningData,
        theme: 'grid',
        headStyles: { fillColor: colors.warning, textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [255, 252, 230] },
        margin: { left: margin, right: margin },
        styles: { fontSize: 9 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // RECOMENDACIONES
    if (report.recommendations.length > 0) {
      checkPageBreak(40);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.primary);
      doc.text('💡 RECOMENDACIONES DE CORRECCIÓN', margin, yPosition);
      yPosition += 15;

      // Separar por prioridad
      const highPriority = report.recommendations.filter(r => r.priority === 'high');
      const mediumPriority = report.recommendations.filter(r => r.priority === 'medium');
      const lowPriority = report.recommendations.filter(r => r.priority === 'low');

      // Recomendaciones de alta prioridad
      if (highPriority.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.danger);
        doc.text('🔴 PRIORIDAD ALTA:', margin, yPosition);
        yPosition += 10;

        highPriority.forEach((rec, index) => {
          checkPageBreak(25);

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colors.dark);
          doc.text(`${index + 1}. ${rec.description}`, margin + 5, yPosition);
          yPosition += 7;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(...colors.secondary);

          const categoryText = `Categoría: ${rec.category}`;
          doc.text(categoryText, margin + 10, yPosition);
          yPosition += 5;

          const agentsText = `Agentes afectados: ${rec.affectedAgents.join(', ')}`;
          const agentsHeight = addWrappedText(agentsText, margin + 10, yPosition, contentWidth - 20, 9);
          yPosition += agentsHeight + 2;

          const actionText = `Acción sugerida: ${rec.suggestedAction}`;
          const actionHeight = addWrappedText(actionText, margin + 10, yPosition, contentWidth - 20, 9);
          yPosition += actionHeight + 8;
        });
      }

      // Recomendaciones de prioridad media
      if (mediumPriority.length > 0) {
        checkPageBreak(20);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.warning);
        doc.text('🟡 PRIORIDAD MEDIA:', margin, yPosition);
        yPosition += 10;

        mediumPriority.forEach((rec, index) => {
          checkPageBreak(20);

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colors.dark);
          doc.text(`${index + 1}. ${rec.description}`, margin + 5, yPosition);
          yPosition += 7;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(...colors.secondary);

          const actionText = `Acción: ${rec.suggestedAction}`;
          const actionHeight = addWrappedText(actionText, margin + 10, yPosition, contentWidth - 20, 9);
          yPosition += actionHeight + 8;
        });
      }
    }

    // PATRONES DE ERROR
    if (report.errorPatterns.length > 0) {
      checkPageBreak(40);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.primary);
      doc.text('🔍 PATRONES DE ERROR DETECTADOS', margin, yPosition);
      yPosition += 15;

      const patternData = report.errorPatterns.map(pattern => [
        pattern.pattern,
        pattern.frequency.toString(),
        pattern.affectedAgents.join(', '),
        pattern.possibleCause
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Patrón', 'Frecuencia', 'Agentes Afectados', 'Posible Causa']],
        body: patternData,
        theme: 'grid',
        headStyles: { fillColor: colors.primary, textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: colors.light },
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 20 },
          2: { cellWidth: 40 },
          3: { cellWidth: 70 }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // PIE DE PÁGINA
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Línea separadora
      doc.setDrawColor(...colors.secondary);
      doc.line(margin, doc.internal.pageSize.height - 25, pageWidth - margin, doc.internal.pageSize.height - 25);

      // Información del pie
      doc.setFontSize(8);
      doc.setTextColor(...colors.secondary);
      doc.setFont('helvetica', 'normal');
      doc.text('Generado por CODESTORM Agent Testing System', margin, doc.internal.pageSize.height - 15);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin - 30, doc.internal.pageSize.height - 15);
      doc.text(new Date().toISOString(), pageWidth - margin - 80, doc.internal.pageSize.height - 10);
    }

    // Descargar el PDF
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `codestorm-error-report-${timestamp}.pdf`;
    doc.save(filename);

  } catch (error) {
    console.error('Error generando PDF:', error);
    throw new Error('Error al generar el informe PDF. Revisa la consola para más detalles.');
  }
}

/**
 * Descarga un informe de errores como archivo (incluyendo PDF)
 */
export function downloadErrorReport(report: ErrorReport, format: 'json' | 'txt' | 'pdf' = 'txt'): void {
  if (format === 'pdf') {
    generatePDFErrorReport(report);
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `codestorm-error-report-${timestamp}.${format}`;

  let content: string;
  let mimeType: string;

  if (format === 'json') {
    content = exportErrorReportAsJSON(report);
    mimeType = 'application/json';
  } else {
    content = exportErrorReportAsText(report);
    mimeType = 'text/plain';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
