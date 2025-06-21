import { AgentDistributionService } from './AgentDistributionService';
import { getDistributedAgentConfig, DISTRIBUTED_AGENT_CONFIG } from '../config/claudeModels';
import { generateUniqueId } from '../utils/idGenerator';

export interface AgentTestResult {
  agentName: string;
  provider: 'openai' | 'claude';
  model: string;
  status: 'success' | 'warning' | 'error';
  responseTime: number;
  timestamp: number;
  testType: 'basic' | 'functional' | 'stress' | 'fallback';
  response?: string;
  error?: string;
  metrics: {
    connectivity: boolean;
    responseQuality: number; // 0-100
    modelCorrect: boolean;
    fallbackWorking?: boolean;
  };
}

export interface AgentTestSuite {
  id: string;
  timestamp: number;
  totalAgents: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  averageResponseTime: number;
  results: AgentTestResult[];
  recommendations: string[];
  overallHealth: 'healthy' | 'degraded' | 'critical';
}

export interface TestConfiguration {
  testTypes: ('basic' | 'functional' | 'stress' | 'fallback')[];
  timeout: number;
  stressTestCount: number;
  includeAgents?: string[];
  excludeAgents?: string[];
}

export class AgentTestingService {
  private static instance: AgentTestingService;
  private distributionService = AgentDistributionService.getInstance();
  private testHistory: AgentTestSuite[] = [];
  private isRunning = false;

  private constructor() {}

  public static getInstance(): AgentTestingService {
    if (!AgentTestingService.instance) {
      AgentTestingService.instance = new AgentTestingService();
    }
    return AgentTestingService.instance;
  }

  /**
   * Ejecuta un conjunto completo de pruebas para todos los agentes
   */
  public async runFullTestSuite(config: TestConfiguration = {
    testTypes: ['basic', 'functional'],
    timeout: 30000,
    stressTestCount: 3
  }): Promise<AgentTestSuite> {
    if (this.isRunning) {
      throw new Error('Ya hay una suite de pruebas en ejecución');
    }

    this.isRunning = true;
    const suiteId = generateUniqueId('test-suite');
    const startTime = Date.now();

    try {
      console.log('🧪 Iniciando suite completa de pruebas de agentes...');
      
      const agentNames = Object.keys(DISTRIBUTED_AGENT_CONFIG);
      const filteredAgents = this.filterAgents(agentNames, config);
      
      const results: AgentTestResult[] = [];
      
      // Ejecutar pruebas para cada agente
      for (const agentName of filteredAgents) {
        console.log(`🔍 Probando agente: ${agentName}`);
        
        for (const testType of config.testTypes) {
          try {
            const result = await this.testAgent(agentName, testType, config.timeout);
            results.push(result);
          } catch (error) {
            results.push({
              agentName,
              provider: getDistributedAgentConfig(agentName).provider,
              model: getDistributedAgentConfig(agentName).model.name,
              status: 'error',
              responseTime: 0,
              timestamp: Date.now(),
              testType,
              error: error instanceof Error ? error.message : 'Error desconocido',
              metrics: {
                connectivity: false,
                responseQuality: 0,
                modelCorrect: false
              }
            });
          }
        }
      }

      // Calcular métricas del conjunto
      const passedTests = results.filter(r => r.status === 'success').length;
      const failedTests = results.filter(r => r.status === 'error').length;
      const warningTests = results.filter(r => r.status === 'warning').length;
      const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

      // Determinar salud general
      const successRate = passedTests / results.length;
      let overallHealth: 'healthy' | 'degraded' | 'critical';
      if (successRate >= 0.9) overallHealth = 'healthy';
      else if (successRate >= 0.7) overallHealth = 'degraded';
      else overallHealth = 'critical';

      const suite: AgentTestSuite = {
        id: suiteId,
        timestamp: startTime,
        totalAgents: filteredAgents.length,
        passedTests,
        failedTests,
        warningTests,
        averageResponseTime,
        results,
        recommendations: this.generateRecommendations(results),
        overallHealth
      };

      // Guardar en historial
      this.testHistory.unshift(suite);
      if (this.testHistory.length > 10) {
        this.testHistory = this.testHistory.slice(0, 10);
      }

      console.log(`✅ Suite de pruebas completada: ${passedTests}/${results.length} exitosas`);
      return suite;

    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Prueba un agente específico
   */
  public async testAgent(
    agentName: string, 
    testType: 'basic' | 'functional' | 'stress' | 'fallback',
    timeout: number = 30000
  ): Promise<AgentTestResult> {
    const startTime = Date.now();
    const agentConfig = getDistributedAgentConfig(agentName);
    
    try {
      let result: AgentTestResult;
      
      switch (testType) {
        case 'basic':
          result = await this.runBasicTest(agentName, timeout);
          break;
        case 'functional':
          result = await this.runFunctionalTest(agentName, timeout);
          break;
        case 'stress':
          result = await this.runStressTest(agentName, timeout);
          break;
        case 'fallback':
          result = await this.runFallbackTest(agentName, timeout);
          break;
        default:
          throw new Error(`Tipo de prueba no soportado: ${testType}`);
      }

      result.responseTime = Date.now() - startTime;
      return result;

    } catch (error) {
      return {
        agentName,
        provider: agentConfig.provider,
        model: agentConfig.model.name,
        status: 'error',
        responseTime: Date.now() - startTime,
        timestamp: Date.now(),
        testType,
        error: error instanceof Error ? error.message : 'Error desconocido',
        metrics: {
          connectivity: false,
          responseQuality: 0,
          modelCorrect: false
        }
      };
    }
  }

  /**
   * Prueba básica de conectividad
   */
  private async runBasicTest(agentName: string, timeout: number): Promise<AgentTestResult> {
    const agentConfig = getDistributedAgentConfig(agentName);
    const prompt = 'Responde con "OK" si puedes procesar esta solicitud.';

    const response = await Promise.race([
      this.distributionService.executeAgent(agentName, prompt, {
        systemPrompt: 'Responde brevemente para confirmar conectividad.',
        maxTokens: 50,
        temperature: 0.1
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]) as any;

    const responseQuality = this.evaluateBasicResponse(response.data || '');

    return {
      agentName,
      provider: agentConfig.provider,
      model: agentConfig.model.name,
      status: response.success ? 'success' : 'error',
      responseTime: response.executionTime || 0,
      timestamp: Date.now(),
      testType: 'basic',
      response: response.data,
      error: response.error,
      metrics: {
        connectivity: response.success,
        responseQuality,
        modelCorrect: true,
        fallbackWorking: response.fallbackUsed
      }
    };
  }

  /**
   * Prueba funcional específica del dominio del agente
   */
  private async runFunctionalTest(agentName: string, timeout: number): Promise<AgentTestResult> {
    const agentConfig = getDistributedAgentConfig(agentName);
    const prompt = this.getFunctionalPrompt(agentName);

    const response = await Promise.race([
      this.distributionService.executeAgent(agentName, prompt, {
        systemPrompt: this.getSystemPrompt(agentName),
        maxTokens: agentConfig.maxTokens,
        temperature: agentConfig.temperature
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]) as any;

    const responseQuality = this.evaluateFunctionalResponse(agentName, response.data || '');

    return {
      agentName,
      provider: agentConfig.provider,
      model: agentConfig.model.name,
      status: this.determineStatus(response.success, responseQuality),
      responseTime: response.executionTime || 0,
      timestamp: Date.now(),
      testType: 'functional',
      response: response.data,
      error: response.error,
      metrics: {
        connectivity: response.success,
        responseQuality,
        modelCorrect: true,
        fallbackWorking: response.fallbackUsed
      }
    };
  }

  /**
   * Prueba de estrés con múltiples requests
   */
  private async runStressTest(agentName: string, timeout: number): Promise<AgentTestResult> {
    const agentConfig = getDistributedAgentConfig(agentName);
    const prompt = 'Prueba de estrés: responde brevemente.';

    const promises = Array(3).fill(null).map(() =>
      this.distributionService.executeAgent(agentName, prompt, {
        systemPrompt: 'Responde brevemente.',
        maxTokens: 100,
        temperature: 0.1
      })
    );

    const startTime = Date.now();
    const results = await Promise.allSettled(promises);
    const responseTime = Date.now() - startTime;

    const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
    const successRate = successCount / results.length;

    return {
      agentName,
      provider: agentConfig.provider,
      model: agentConfig.model.name,
      status: successRate >= 0.7 ? 'success' : successRate >= 0.3 ? 'warning' : 'error',
      responseTime,
      timestamp: Date.now(),
      testType: 'stress',
      response: `${successCount}/${results.length} requests exitosos`,
      metrics: {
        connectivity: successRate > 0,
        responseQuality: successRate * 100,
        modelCorrect: true
      }
    };
  }

  /**
   * Prueba de fallback - Intenta una operación real con timeout corto para probar recuperación
   */
  private async runFallbackTest(agentName: string, timeout: number): Promise<AgentTestResult> {
    const agentConfig = getDistributedAgentConfig(agentName);
    const prompt = 'Test de fallback: responde brevemente si recibes este mensaje.';

    try {
      // Intentar una operación real con timeout más corto para probar fallback
      const shortTimeout = Math.min(timeout, 10000); // Máximo 10 segundos

      const response = await Promise.race([
        this.distributionService.executeAgent(agentName, prompt, {
          systemPrompt: 'Responde brevemente para confirmar que el sistema de fallback funciona.',
          maxTokens: 50,
          temperature: 0.1
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Fallback timeout')), shortTimeout)
        )
      ]) as any;

      const responseQuality = this.evaluateBasicResponse(response.data || '');

      return {
        agentName,
        provider: agentConfig.provider,
        model: agentConfig.model.name,
        status: response.success ? 'success' : 'error',
        responseTime: response.executionTime || 0,
        timestamp: Date.now(),
        testType: 'fallback',
        response: response.data,
        error: response.error,
        metrics: {
          connectivity: response.success,
          responseQuality,
          modelCorrect: true,
          fallbackWorking: response.fallbackUsed || false
        }
      };
    } catch (error) {
      // Si falla, reportar el error real
      return {
        agentName,
        provider: agentConfig.provider,
        model: agentConfig.model.name,
        status: 'error',
        responseTime: timeout,
        timestamp: Date.now(),
        testType: 'fallback',
        error: error instanceof Error ? error.message : 'Error desconocido en prueba de fallback',
        metrics: {
          connectivity: false,
          responseQuality: 0,
          modelCorrect: false,
          fallbackWorking: false
        }
      };
    }
  }

  /**
   * Filtra agentes según la configuración
   */
  private filterAgents(agentNames: string[], config: TestConfiguration): string[] {
    let filtered = agentNames;

    if (config.includeAgents && config.includeAgents.length > 0) {
      filtered = filtered.filter(name => config.includeAgents!.includes(name));
    }

    if (config.excludeAgents && config.excludeAgents.length > 0) {
      filtered = filtered.filter(name => !config.excludeAgents!.includes(name));
    }

    return filtered;
  }

  /**
   * Obtiene prompt funcional específico para cada tipo de agente
   */
  private getFunctionalPrompt(agentName: string): string {
    const prompts: Record<string, string> = {
      'PlannerAgent': 'Crea un plan básico para una aplicación web simple con HTML y CSS.',
      'OptimizedPlannerAgent': 'Analiza y planifica una aplicación de gestión de tareas.',
      'CodeGeneratorAgent': 'Genera código HTML básico para una página de inicio.',
      'CodeModifierAgent': 'Modifica este código CSS: body { margin: 0; } para añadir padding.',
      'EnhancedDesignArchitectAgent': 'Diseña la arquitectura visual para un sitio web corporativo.',
      'DesignArchitectAgent': 'Crea un diseño responsive para una landing page.',
      'FileObserverAgent': 'Analiza la estructura de archivos de un proyecto web básico.',
      'CodeSplitterAgent': 'Separa este código en archivos: HTML con CSS inline.',
      'CodeCorrectorAgent': 'Corrige errores en este JavaScript: console.log("hello"',
      'InstructionAnalyzer': 'Analiza esta instrucción: "Crear una página web moderna"'
    };

    return prompts[agentName] || 'Ejecuta una tarea básica de tu especialidad.';
  }

  /**
   * Obtiene system prompt específico para cada agente
   */
  private getSystemPrompt(agentName: string): string {
    const systemPrompts: Record<string, string> = {
      'PlannerAgent': 'Eres un planificador de proyectos. Responde con un plan estructurado.',
      'OptimizedPlannerAgent': 'Eres un planificador optimizado. Crea planes detallados y eficientes.',
      'CodeGeneratorAgent': 'Eres un generador de código. Produce código limpio y funcional.',
      'CodeModifierAgent': 'Eres un modificador de código. Realiza cambios precisos y eficientes.',
      'EnhancedDesignArchitectAgent': 'Eres un arquitecto de diseño. Crea diseños profesionales.',
      'DesignArchitectAgent': 'Eres un diseñador. Crea interfaces atractivas y funcionales.',
      'FileObserverAgent': 'Eres un observador de archivos. Analiza estructuras de proyecto.',
      'CodeSplitterAgent': 'Eres un separador de código. Organiza código en archivos apropiados.',
      'CodeCorrectorAgent': 'Eres un corrector de código. Identifica y corrige errores.',
      'InstructionAnalyzer': 'Eres un analizador de instrucciones. Interpreta requisitos claramente.'
    };

    return systemPrompts[agentName] || 'Eres un asistente especializado. Responde apropiadamente.';
  }

  /**
   * Evalúa la calidad de respuesta básica
   */
  private evaluateBasicResponse(response: string): number {
    if (!response || response.trim().length === 0) return 0;
    if (response.toLowerCase().includes('ok') || response.toLowerCase().includes('sí')) return 100;
    if (response.length > 10 && response.length < 200) return 80;
    return 50;
  }

  /**
   * Evalúa la calidad de respuesta funcional
   */
  private evaluateFunctionalResponse(agentName: string, response: string): number {
    if (!response || response.trim().length === 0) return 0;

    const keywords: Record<string, string[]> = {
      'PlannerAgent': ['plan', 'paso', 'estructura', 'archivo'],
      'OptimizedPlannerAgent': ['optimizado', 'eficiente', 'estructura', 'implementación'],
      'CodeGeneratorAgent': ['html', 'código', '<', '>'],
      'CodeModifierAgent': ['padding', 'css', 'modificado'],
      'EnhancedDesignArchitectAgent': ['diseño', 'arquitectura', 'visual'],
      'DesignArchitectAgent': ['responsive', 'diseño', 'landing'],
      'FileObserverAgent': ['archivo', 'estructura', 'proyecto'],
      'CodeSplitterAgent': ['separar', 'archivo', 'organizar'],
      'CodeCorrectorAgent': ['error', 'corregir', 'javascript'],
      'InstructionAnalyzer': ['análisis', 'requisito', 'instrucción']
    };

    const agentKeywords = keywords[agentName] || [];
    const foundKeywords = agentKeywords.filter(keyword =>
      response.toLowerCase().includes(keyword.toLowerCase())
    );

    const keywordScore = (foundKeywords.length / agentKeywords.length) * 60;
    const lengthScore = Math.min(response.length / 100, 1) * 40;

    return Math.min(keywordScore + lengthScore, 100);
  }

  /**
   * Determina el estado basado en éxito y calidad
   */
  private determineStatus(success: boolean, quality: number): 'success' | 'warning' | 'error' {
    if (!success) return 'error';
    if (quality >= 70) return 'success';
    if (quality >= 40) return 'warning';
    return 'error';
  }

  /**
   * Genera recomendaciones basadas en los resultados
   */
  private generateRecommendations(results: AgentTestResult[]): string[] {
    const recommendations: string[] = [];

    const errorResults = results.filter(r => r.status === 'error');
    const slowResults = results.filter(r => r.responseTime > 20000);
    const lowQualityResults = results.filter(r => r.metrics.responseQuality < 50);

    if (errorResults.length > 0) {
      recommendations.push(`${errorResults.length} agentes tienen errores críticos que requieren atención inmediata`);
    }

    if (slowResults.length > 0) {
      recommendations.push(`${slowResults.length} agentes tienen tiempos de respuesta lentos (>20s)`);
    }

    if (lowQualityResults.length > 0) {
      recommendations.push(`${lowQualityResults.length} agentes producen respuestas de baja calidad`);
    }

    const claudeErrors = errorResults.filter(r => r.provider === 'claude').length;
    const openaiErrors = errorResults.filter(r => r.provider === 'openai').length;

    if (claudeErrors > openaiErrors * 2) {
      recommendations.push('Considerar redistribuir más agentes a OpenAI debido a problemas con Claude');
    } else if (openaiErrors > claudeErrors * 2) {
      recommendations.push('Considerar redistribuir más agentes a Claude debido a problemas con OpenAI');
    }

    if (recommendations.length === 0) {
      recommendations.push('Todos los agentes funcionan correctamente');
    }

    return recommendations;
  }

  /**
   * Obtiene el historial de pruebas
   */
  public getTestHistory(): AgentTestSuite[] {
    return [...this.testHistory];
  }

  /**
   * Obtiene el último resultado de pruebas
   */
  public getLatestTestSuite(): AgentTestSuite | null {
    return this.testHistory[0] || null;
  }

  /**
   * Verifica si hay pruebas en ejecución
   */
  public isTestRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Limpia el historial de pruebas
   */
  public clearHistory(): void {
    this.testHistory = [];
  }

}
