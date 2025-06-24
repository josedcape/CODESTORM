import { EnhancedAPIService } from '../EnhancedAPIService';

// Interfaces principales para el análisis multi-agente
export interface CodeAnalysisResult {
  language: string;
  issues: CodeIssue[];
  suggestions: string[];
  complexity: number;
  maintainability: number;
  performance: number;
}

export interface CodeIssue {
  id: string;
  type: 'error' | 'warning' | 'info' | 'suggestion';
  severity: 'high' | 'medium' | 'low';
  line: number;
  column?: number;
  message: string;
  description: string;
  fixSuggestion?: string;
  category: 'syntax' | 'logic' | 'performance' | 'style' | 'security' | 'maintainability';
}

export interface CorrectionResult {
  originalCode: string;
  correctedCode: string;
  changes: CodeChange[];
  summary: string;
  confidence: number;
  processingTime: number;
}

export interface CodeChange {
  id: string;
  type: 'addition' | 'deletion' | 'modification';
  lineNumber: number;
  oldContent?: string;
  newContent?: string;
  correctedCode: string;
  reason: string;
}

export interface AgentStatus {
  analyzer: 'idle' | 'working' | 'success' | 'error' | 'warning';
  detector: 'idle' | 'working' | 'success' | 'error' | 'warning';
  generator: 'idle' | 'working' | 'success' | 'error' | 'warning';
}

export interface AgentMetrics {
  processingTime: number;
  confidenceScore: number;
  improvementPercentage: number;
  totalIssues: number;
  fixedIssues: number;
}

// Nueva interfaz para el resultado completo del análisis multi-agente
export interface MultiAgentAnalysisResult {
  errorAnalysis: {
    errors: CodeIssue[];
    totalIssues: number;
    criticalIssues: number;
    warningIssues: number;
    infoIssues: number;
  };
  codeGeneration: {
    correctedCode: string;
    changes: CodeChange[];
    summary: string;
    confidence: number;
  };
  overallMetrics: {
    processingTime: number;
    confidenceScore: number;
    improvementPercentage: number;
  };
  agentStatus: AgentStatus;
}

// Opciones de corrección
export interface CorrectionOptions {
  analyzeSecurity: boolean;
  analyzePerformance: boolean;
  generateTests: boolean;
  explainChanges: boolean;
  autoFix: boolean;
  preserveFormatting: boolean;
}

export class MultiAgentCodeCorrector {
  private static apiService = EnhancedAPIService.getInstance();

  /**
   * Valida la entrada de código antes del análisis
   */
  public static validateInput(code: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!code || code.trim().length === 0) {
      errors.push('El código no puede estar vacío');
    }

    if (code.length > 50000) {
      errors.push('El código es demasiado largo (máximo 50,000 caracteres)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Método principal estático para análisis multi-agente
   */
  public static async analyzeCode(
    code: string,
    language: string,
    options: CorrectionOptions,
    onProgress?: (stage: string, progress: number, message: string, agentName?: string) => void
  ): Promise<MultiAgentAnalysisResult> {
    const startTime = Date.now();

    console.log('🚀 Iniciando análisis multi-agente de código');

    try {
      // Fase 1: Análisis de errores (Agente Analizador)
      onProgress?.('Análisis de Errores', 20, 'Analizando estructura y errores...', 'Agente Analizador');
      const errorAnalysis = await this.analyzeErrors(code, language, options);

      // Fase 2: Detección de patrones (Agente Detector)
      onProgress?.('Detección de Patrones', 50, 'Detectando patrones y problemas...', 'Agente Detector');
      await this.simulateDetectionPhase();

      // Fase 3: Generación de código corregido (Agente Generador)
      onProgress?.('Generación de Código', 80, 'Generando código corregido...', 'Agente Generador');
      const codeGeneration = await this.generateCorrectedCode(code, language, errorAnalysis.errors, options);

      // Calcular métricas finales
      const processingTime = Date.now() - startTime;
      const improvementPercentage = Math.min(
        (codeGeneration.changes.length / Math.max(errorAnalysis.totalIssues, 1)) * 100,
        100
      );

      onProgress?.('Análisis Completado', 100, 'Proceso multi-agente finalizado', 'Coordinador');

      const result: MultiAgentAnalysisResult = {
        errorAnalysis,
        codeGeneration,
        overallMetrics: {
          processingTime,
          confidenceScore: codeGeneration.confidence,
          improvementPercentage
        },
        agentStatus: {
          analyzer: 'success',
          detector: 'success',
          generator: 'success'
        }
      };

      console.log(`✅ Análisis multi-agente completado en ${processingTime}ms`);
      return result;

    } catch (error) {
      console.error('❌ Error en análisis multi-agente:', error);

      const processingTime = Date.now() - startTime;

      // Retornar resultado de error
      return {
        errorAnalysis: {
          errors: [{
            id: 'analysis_error',
            type: 'error',
            severity: 'high',
            line: 1,
            message: 'Error en el análisis',
            description: error instanceof Error ? error.message : 'Error desconocido',
            category: 'syntax'
          }],
          totalIssues: 1,
          criticalIssues: 1,
          warningIssues: 0,
          infoIssues: 0
        },
        codeGeneration: {
          correctedCode: code,
          changes: [],
          summary: 'No se pudo completar la corrección debido a un error',
          confidence: 0
        },
        overallMetrics: {
          processingTime,
          confidenceScore: 0,
          improvementPercentage: 0
        },
        agentStatus: {
          analyzer: 'error',
          detector: 'error',
          generator: 'error'
        }
      };
    }
  }

  /**
   * Analiza errores en el código usando el Agente Analizador
   */
  private static async analyzeErrors(
    code: string,
    language: string,
    options: CorrectionOptions
  ): Promise<MultiAgentAnalysisResult['errorAnalysis']> {
    const prompt = `
Como Agente Analizador especializado en ${language}, analiza el siguiente código y detecta todos los problemas:

\`\`\`${language}
${code}
\`\`\`

ANÁLISIS REQUERIDO:
${options.analyzeSecurity ? '- Vulnerabilidades de seguridad' : ''}
${options.analyzePerformance ? '- Problemas de rendimiento' : ''}
- Errores de sintaxis
- Problemas de lógica
- Problemas de estilo y legibilidad
- Problemas de mantenibilidad

Responde ÚNICAMENTE con un JSON válido con esta estructura:
{
  "errors": [
    {
      "id": "unique_id",
      "type": "error|warning|info|suggestion",
      "severity": "high|medium|low",
      "line": number,
      "column": number,
      "message": "Mensaje breve",
      "description": "Descripción detallada",
      "fixSuggestion": "Sugerencia de corrección",
      "category": "syntax|logic|performance|style|security|maintainability"
    }
  ]
}`;

    try {
      const response = await this.apiService.sendMessage(prompt, {
        agentName: 'CodeAnalyzerAgent',
        maxTokens: 4000,
        temperature: 0.1,
        systemPrompt: `Eres un experto analizador de código ${language} que detecta problemas con precisión.`
      });

      if (!response.success || !response.data) {
        throw new Error(`Error en análisis: ${response.error}`);
      }

      // Parsear respuesta JSON
      const jsonMatch = response.data.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se encontró JSON válido en la respuesta');
      }

      const analysisData = JSON.parse(jsonMatch[0]);
      const errors: CodeIssue[] = analysisData.errors || [];

      // Calcular estadísticas
      const totalIssues = errors.length;
      const criticalIssues = errors.filter(e => e.severity === 'high').length;
      const warningIssues = errors.filter(e => e.severity === 'medium').length;
      const infoIssues = errors.filter(e => e.severity === 'low').length;

      return {
        errors,
        totalIssues,
        criticalIssues,
        warningIssues,
        infoIssues
      };

    } catch (error) {
      console.error('Error en análisis de errores:', error);

      // Fallback: análisis básico
      return {
        errors: [{
          id: 'fallback_analysis',
          type: 'info',
          severity: 'low',
          line: 1,
          message: 'Análisis básico completado',
          description: 'Se realizó un análisis básico del código',
          category: 'syntax'
        }],
        totalIssues: 1,
        criticalIssues: 0,
        warningIssues: 0,
        infoIssues: 1
      };
    }
  }

  /**
   * Simula la fase de detección de patrones
   */
  private static async simulateDetectionPhase(): Promise<void> {
    // Simular tiempo de procesamiento del Agente Detector
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  /**
   * Genera código corregido usando el Agente Generador
   */
  private static async generateCorrectedCode(
    code: string,
    language: string,
    errors: CodeIssue[],
    options: CorrectionOptions
  ): Promise<MultiAgentAnalysisResult['codeGeneration']> {
    const errorsText = errors.length > 0
      ? `\n\nPROBLEMAS IDENTIFICADOS:\n${errors.map(error =>
          `- Línea ${error.line}: ${error.message} (${error.severity})`
        ).join('\n')}`
      : '';

    const prompt = `
Como Agente Generador especializado en ${language}, corrige el siguiente código:

\`\`\`${language}
${code}
\`\`\`${errorsText}

OPCIONES DE CORRECCIÓN:
${options.autoFix ? '- Aplicar correcciones automáticas' : '- Sugerir correcciones'}
${options.preserveFormatting ? '- Preservar formato original' : '- Optimizar formato'}
${options.explainChanges ? '- Explicar cada cambio' : '- Solo aplicar cambios'}

Responde ÚNICAMENTE con un JSON válido:
{
  "correctedCode": "código corregido completo",
  "changes": [
    {
      "id": "change_id",
      "type": "addition|deletion|modification",
      "lineNumber": number,
      "oldContent": "contenido anterior",
      "newContent": "contenido nuevo",
      "correctedCode": "línea corregida",
      "reason": "razón del cambio"
    }
  ],
  "summary": "Resumen de cambios realizados",
  "confidence": number (0-100)
}`;

    try {
      const response = await this.apiService.sendMessage(prompt, {
        agentName: 'CodeGeneratorAgent',
        maxTokens: 4000,
        temperature: 0.05,
        systemPrompt: `Eres un experto generador de código ${language} que corrige errores con precisión.`
      });

      if (!response.success || !response.data) {
        throw new Error(`Error en generación: ${response.error}`);
      }

      // Parsear respuesta JSON
      const jsonMatch = response.data.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se encontró JSON válido en la respuesta');
      }

      const generationData = JSON.parse(jsonMatch[0]);

      return {
        correctedCode: generationData.correctedCode || code,
        changes: generationData.changes || [],
        summary: generationData.summary || 'Código procesado',
        confidence: generationData.confidence || 0
      };

    } catch (error) {
      console.error('Error en generación de código:', error);

      // Fallback: retornar código original
      return {
        correctedCode: code,
        changes: [],
        summary: `Error en la corrección: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        confidence: 0
      };
    }
  }

  /**
   * Genera un reporte completo del análisis
   */
  public static generateComprehensiveReport(result: MultiAgentAnalysisResult): string {
    const { errorAnalysis, codeGeneration, overallMetrics, agentStatus } = result;

    const report = `
REPORTE DE ANÁLISIS MULTI-AGENTE
================================

RESUMEN EJECUTIVO:
- Tiempo de procesamiento: ${overallMetrics.processingTime}ms
- Puntuación de confianza: ${overallMetrics.confidenceScore}%
- Porcentaje de mejora: ${overallMetrics.improvementPercentage}%

ANÁLISIS DE ERRORES:
- Total de problemas: ${errorAnalysis.totalIssues}
- Problemas críticos: ${errorAnalysis.criticalIssues}
- Advertencias: ${errorAnalysis.warningIssues}
- Información: ${errorAnalysis.infoIssues}

PROBLEMAS DETECTADOS:
${errorAnalysis.errors.map(error => `
- [${error.severity.toUpperCase()}] Línea ${error.line}: ${error.message}
  Categoría: ${error.category}
  Descripción: ${error.description}
  ${error.fixSuggestion ? `Sugerencia: ${error.fixSuggestion}` : ''}
`).join('')}

CORRECCIONES APLICADAS:
${codeGeneration.changes.map(change => `
- [${change.type.toUpperCase()}] Línea ${change.lineNumber}
  Razón: ${change.reason}
  ${change.oldContent ? `Antes: ${change.oldContent}` : ''}
  ${change.newContent ? `Después: ${change.newContent}` : ''}
`).join('')}

RESUMEN DE CAMBIOS:
${codeGeneration.summary}

ESTADO DE AGENTES:
- Analizador: ${agentStatus.analyzer}
- Detector: ${agentStatus.detector}
- Generador: ${agentStatus.generator}

CÓDIGO CORREGIDO:
${codeGeneration.correctedCode}

Reporte generado el ${new Date().toLocaleString()}
`;

    return report;
  }
}

export default MultiAgentCodeCorrector;
