/**
 * Coordinador Multi-Agente para Corrección de Código
 * Orquesta los tres agentes especializados de forma sincronizada
 */

import CodeAnalyzerAgent, { CodeStructure, LanguageDetectionResult } from './CodeAnalyzerAgent';
import ErrorDetectorAgent, { ErrorAnalysisResult } from './ErrorDetectorAgent';
import CodeGeneratorAgent, { CodeGenerationResult } from './CodeGeneratorAgent';

export interface MultiAgentAnalysisResult {
  // Resultados del Agente 1 - Analizador
  languageDetection: LanguageDetectionResult;
  codeStructure: CodeStructure;
  
  // Resultados del Agente 2 - Detector de Errores
  errorAnalysis: ErrorAnalysisResult;
  
  // Resultados del Agente 3 - Generador
  codeGeneration: CodeGenerationResult;
  
  // Métricas generales
  overallMetrics: {
    processingTime: number;
    confidenceScore: number;
    improvementPercentage: number;
    recommendedActions: string[];
  };
  
  // Estado de los agentes
  agentStatus: {
    analyzer: 'success' | 'warning' | 'error';
    detector: 'success' | 'warning' | 'error';
    generator: 'success' | 'warning' | 'error';
  };
}

export interface ProgressCallback {
  (stage: string, progress: number, message: string, agentName?: string): void;
}

export interface CorrectionOptions {
  analyzeSecurity: boolean;
  analyzePerformance: boolean;
  generateTests: boolean;
  explainChanges: boolean;
  autoFix: boolean;
  preserveFormatting: boolean;
}

class MultiAgentCodeCorrector {
  private static readonly AGENT_NAMES = {
    ANALYZER: 'Agente Analizador',
    DETECTOR: 'Agente Detector',
    GENERATOR: 'Agente Generador'
  };

  /**
   * Ejecuta el análisis completo con los tres agentes
   */
  static async analyzeCode(
    code: string,
    language: string,
    options: CorrectionOptions,
    onProgress?: ProgressCallback
  ): Promise<MultiAgentAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Fase 1: Agente Analizador
      onProgress?.('analysis', 10, 'Iniciando análisis de código...', this.AGENT_NAMES.ANALYZER);
      
      const languageDetection = await this.runLanguageDetection(code, language, onProgress);
      const detectedLanguage = languageDetection.confidence > 70 ? languageDetection.language : language;
      
      onProgress?.('analysis', 25, 'Analizando estructura del código...', this.AGENT_NAMES.ANALYZER);
      const codeStructure = await this.runStructureAnalysis(code, detectedLanguage, onProgress);
      
      // Fase 2: Agente Detector de Errores
      onProgress?.('detection', 40, 'Detectando errores y problemas...', this.AGENT_NAMES.DETECTOR);
      const errorAnalysis = await this.runErrorDetection(code, detectedLanguage, options, onProgress);
      
      // Fase 3: Agente Generador
      onProgress?.('generation', 70, 'Generando código corregido...', this.AGENT_NAMES.GENERATOR);
      const codeGeneration = await this.runCodeGeneration(
        code, 
        errorAnalysis.errors, 
        detectedLanguage, 
        options, 
        onProgress
      );
      
      // Calcular métricas finales
      onProgress?.('finalization', 90, 'Calculando métricas finales...', 'Sistema');
      const overallMetrics = this.calculateOverallMetrics(
        startTime,
        languageDetection,
        errorAnalysis,
        codeGeneration
      );
      
      const agentStatus = this.evaluateAgentStatus(
        languageDetection,
        errorAnalysis,
        codeGeneration
      );
      
      onProgress?.('complete', 100, 'Análisis completado exitosamente', 'Sistema');
      
      return {
        languageDetection,
        codeStructure,
        errorAnalysis,
        codeGeneration,
        overallMetrics,
        agentStatus
      };
      
    } catch (error) {
      console.error('Error en análisis multi-agente:', error);
      throw new Error(`Error en el análisis: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Ejecuta detección de lenguaje con el Agente Analizador
   */
  private static async runLanguageDetection(
    code: string,
    suggestedLanguage: string,
    onProgress?: ProgressCallback
  ): Promise<LanguageDetectionResult> {
    onProgress?.('analysis', 15, 'Detectando lenguaje de programación...', this.AGENT_NAMES.ANALYZER);
    
    // Simular procesamiento asíncrono
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const detection = CodeAnalyzerAgent.detectLanguage(code);
    
    // Si la confianza es baja, usar el lenguaje sugerido
    if (detection.confidence < 50) {
      return {
        language: suggestedLanguage,
        confidence: 60,
        features: [`Fallback to suggested language: ${suggestedLanguage}`]
      };
    }
    
    return detection;
  }

  /**
   * Ejecuta análisis de estructura con el Agente Analizador
   */
  private static async runStructureAnalysis(
    code: string,
    language: string,
    onProgress?: ProgressCallback
  ): Promise<CodeStructure> {
    onProgress?.('analysis', 30, 'Extrayendo estructura del código...', this.AGENT_NAMES.ANALYZER);
    
    // Simular procesamiento asíncrono
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return CodeAnalyzerAgent.analyzeStructure(code, language);
  }

  /**
   * Ejecuta detección de errores con el Agente Detector
   */
  private static async runErrorDetection(
    code: string,
    language: string,
    options: CorrectionOptions,
    onProgress?: ProgressCallback
  ): Promise<ErrorAnalysisResult> {
    onProgress?.('detection', 50, 'Analizando errores de sintaxis...', this.AGENT_NAMES.DETECTOR);
    await new Promise(resolve => setTimeout(resolve, 400));
    
    onProgress?.('detection', 55, 'Verificando problemas de lógica...', this.AGENT_NAMES.DETECTOR);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (options.analyzeSecurity) {
      onProgress?.('detection', 60, 'Analizando vulnerabilidades de seguridad...', this.AGENT_NAMES.DETECTOR);
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    
    if (options.analyzePerformance) {
      onProgress?.('detection', 65, 'Evaluando problemas de rendimiento...', this.AGENT_NAMES.DETECTOR);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    return ErrorDetectorAgent.analyzeCode(code, language);
  }

  /**
   * Ejecuta generación de código con el Agente Generador
   */
  private static async runCodeGeneration(
    code: string,
    errors: any[],
    language: string,
    options: CorrectionOptions,
    onProgress?: ProgressCallback
  ): Promise<CodeGenerationResult> {
    onProgress?.('generation', 75, 'Aplicando correcciones automáticas...', this.AGENT_NAMES.GENERATOR);
    await new Promise(resolve => setTimeout(resolve, 600));
    
    onProgress?.('generation', 80, 'Optimizando código...', this.AGENT_NAMES.GENERATOR);
    await new Promise(resolve => setTimeout(resolve, 400));
    
    onProgress?.('generation', 85, 'Generando explicaciones...', this.AGENT_NAMES.GENERATOR);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return CodeGeneratorAgent.generateCorrectedCode(code, errors, language);
  }

  /**
   * Calcula métricas generales del análisis
   */
  private static calculateOverallMetrics(
    startTime: number,
    languageDetection: LanguageDetectionResult,
    errorAnalysis: ErrorAnalysisResult,
    codeGeneration: CodeGenerationResult
  ) {
    const processingTime = Date.now() - startTime;
    
    // Calcular puntuación de confianza general
    const confidenceScore = Math.round(
      (languageDetection.confidence + 
       (errorAnalysis.totalIssues > 0 ? 80 : 95) + 
       codeGeneration.qualityScore) / 3
    );
    
    // Calcular porcentaje de mejora
    const improvementPercentage = Math.round(
      codeGeneration.maintainabilityImprovement || 0
    );
    
    // Generar recomendaciones
    const recommendedActions = this.generateRecommendations(
      errorAnalysis,
      codeGeneration
    );
    
    return {
      processingTime,
      confidenceScore,
      improvementPercentage,
      recommendedActions
    };
  }

  /**
   * Evalúa el estado de cada agente
   */
  private static evaluateAgentStatus(
    languageDetection: LanguageDetectionResult,
    errorAnalysis: ErrorAnalysisResult,
    codeGeneration: CodeGenerationResult
  ) {
    return {
      analyzer: languageDetection.confidence > 70 ? 'success' : 'warning' as const,
      detector: errorAnalysis.criticalCount === 0 ? 'success' : 
                errorAnalysis.criticalCount < 3 ? 'warning' : 'error' as const,
      generator: codeGeneration.qualityScore > 80 ? 'success' : 
                codeGeneration.qualityScore > 60 ? 'warning' : 'error' as const
    };
  }

  /**
   * Genera recomendaciones basadas en el análisis
   */
  private static generateRecommendations(
    errorAnalysis: ErrorAnalysisResult,
    codeGeneration: CodeGenerationResult
  ): string[] {
    const recommendations: string[] = [];
    
    if (errorAnalysis.criticalCount > 0) {
      recommendations.push(`Corregir ${errorAnalysis.criticalCount} problema(s) crítico(s) de inmediato`);
    }
    
    if (errorAnalysis.errorCount > 0) {
      recommendations.push(`Revisar ${errorAnalysis.errorCount} error(es) de código`);
    }
    
    if (errorAnalysis.warningCount > 5) {
      recommendations.push('Considerar refactorizar el código para reducir advertencias');
    }
    
    if (codeGeneration.improvementsSummary.performanceOptimizations > 0) {
      recommendations.push('Aplicar optimizaciones de rendimiento sugeridas');
    }
    
    if (codeGeneration.qualityScore < 70) {
      recommendations.push('Mejorar la calidad general del código');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('El código está en buen estado, considerar mejoras menores de estilo');
    }
    
    return recommendations;
  }

  /**
   * Genera reporte completo del análisis
   */
  static generateComprehensiveReport(result: MultiAgentAnalysisResult): string {
    const { languageDetection, errorAnalysis, codeGeneration, overallMetrics } = result;
    
    return `
REPORTE DE ANÁLISIS MULTI-AGENTE
================================

🔍 DETECCIÓN DE LENGUAJE
Lenguaje: ${languageDetection.language}
Confianza: ${languageDetection.confidence.toFixed(1)}%

📊 ANÁLISIS DE ERRORES
Total de problemas: ${errorAnalysis.totalIssues}
- Críticos: ${errorAnalysis.criticalCount}
- Errores: ${errorAnalysis.errorCount}
- Advertencias: ${errorAnalysis.warningCount}
- Sugerencias: ${errorAnalysis.infoCount}

🛠️ CORRECCIONES APLICADAS
Cambios realizados: ${codeGeneration.changes.length}
- Correcciones de sintaxis: ${codeGeneration.improvementsSummary.syntaxFixes}
- Mejoras de lógica: ${codeGeneration.improvementsSummary.logicImprovements}
- Correcciones de seguridad: ${codeGeneration.improvementsSummary.securityFixes}
- Optimizaciones: ${codeGeneration.improvementsSummary.performanceOptimizations}
- Mejoras de estilo: ${codeGeneration.improvementsSummary.styleImprovements}

📈 MÉTRICAS GENERALES
Puntuación de calidad: ${codeGeneration.qualityScore}/100
Mejora de mantenibilidad: ${overallMetrics.improvementPercentage}%
Tiempo de procesamiento: ${overallMetrics.processingTime}ms
Confianza general: ${overallMetrics.confidenceScore}%

💡 RECOMENDACIONES
${overallMetrics.recommendedActions.map(action => `• ${action}`).join('\n')}
    `.trim();
  }

  /**
   * Valida que el código sea analizable
   */
  static validateInput(code: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!code || code.trim().length === 0) {
      errors.push('El código no puede estar vacío');
    }
    
    if (code.length > 100000) {
      errors.push('El código es demasiado largo (máximo 100,000 caracteres)');
    }
    
    // Verificar caracteres válidos
    if (!/^[\x00-\x7F\u00A0-\uFFFF]*$/.test(code)) {
      errors.push('El código contiene caracteres no válidos');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default MultiAgentCodeCorrector;
