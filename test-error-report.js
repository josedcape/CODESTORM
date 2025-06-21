/**
 * Script de prueba para verificar la funcionalidad de informes de errores
 * Este script simula datos de testing y genera un informe de errores de ejemplo
 */

import { generateErrorReport, downloadErrorReport } from './src/utils/testingReports.js';

// Datos de prueba simulados
const mockTestSuite = {
  id: 'test-suite-001',
  timestamp: Date.now(),
  duration: 45000,
  totalAgents: 5,
  passedTests: 2,
  failedTests: 3,
  overallHealth: 'degraded',
  results: [
    {
      agentName: 'PlannerAgent',
      provider: 'openai',
      model: 'gpt-4',
      status: 'error',
      responseTime: 0,
      timestamp: Date.now() - 1000,
      testType: 'basic',
      error: 'ECONNREFUSED: Connection refused to proxy server',
      metrics: {
        connectivity: false,
        responseQuality: 0,
        modelCorrect: false,
        fallbackWorking: false
      }
    },
    {
      agentName: 'CodeGeneratorAgent',
      provider: 'claude',
      model: 'claude-3-sonnet',
      status: 'error',
      responseTime: 30000,
      timestamp: Date.now() - 2000,
      testType: 'functional',
      error: 'Request timeout after 30 seconds',
      metrics: {
        connectivity: true,
        responseQuality: 0,
        modelCorrect: false,
        fallbackWorking: false
      }
    },
    {
      agentName: 'FileObserverAgent',
      provider: 'openai',
      model: 'gpt-4',
      status: 'warning',
      responseTime: 5000,
      timestamp: Date.now() - 3000,
      testType: 'basic',
      error: 'Response quality below threshold',
      metrics: {
        connectivity: true,
        responseQuality: 45,
        modelCorrect: true,
        fallbackWorking: true
      }
    },
    {
      agentName: 'DesignArchitectAgent',
      provider: 'claude',
      model: 'claude-3-sonnet',
      status: 'success',
      responseTime: 2000,
      timestamp: Date.now() - 4000,
      testType: 'functional',
      metrics: {
        connectivity: true,
        responseQuality: 85,
        modelCorrect: true,
        fallbackWorking: true
      }
    },
    {
      agentName: 'CodeModifierAgent',
      provider: 'openai',
      model: 'gpt-4',
      status: 'success',
      responseTime: 1500,
      timestamp: Date.now() - 5000,
      testType: 'basic',
      metrics: {
        connectivity: true,
        responseQuality: 90,
        modelCorrect: true,
        fallbackWorking: true
      }
    }
  ]
};

console.log('🧪 Iniciando prueba de generación de informe de errores...');

try {
  // Generar el informe de errores
  const errorReport = generateErrorReport(mockTestSuite);
  
  console.log('✅ Informe de errores generado exitosamente');
  console.log('📊 Resumen del informe:');
  console.log(`   - Total de agentes: ${errorReport.executiveSummary.totalAgents}`);
  console.log(`   - Agentes fallidos: ${errorReport.executiveSummary.failedAgents}`);
  console.log(`   - Tasa de error: ${errorReport.executiveSummary.errorRate.toFixed(1)}%`);
  console.log(`   - Errores críticos: ${errorReport.executiveSummary.criticalErrors}`);
  console.log(`   - Advertencias: ${errorReport.executiveSummary.warningCount}`);
  console.log(`   - Recomendaciones: ${errorReport.recommendations.length}`);
  console.log(`   - Patrones detectados: ${errorReport.errorPatterns.length}`);
  
  // Mostrar algunos detalles
  console.log('\n🔍 Agentes con errores:');
  errorReport.failedAgents.forEach((agent, index) => {
    console.log(`   ${index + 1}. ${agent.agentName} (${agent.provider}) - ${agent.errorType}: ${agent.errorMessage}`);
  });
  
  console.log('\n💡 Recomendaciones principales:');
  errorReport.recommendations.slice(0, 3).forEach((rec, index) => {
    console.log(`   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.description}`);
  });
  
  console.log('\n🧪 Prueba completada exitosamente!');
  
} catch (error) {
  console.error('❌ Error durante la prueba:', error);
}
