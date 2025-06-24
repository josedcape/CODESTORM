import {
  AgentTask,
  FileItem,
  CodeCorrectorResult,
  CodeError,
  CodeErrorType,
  CodeErrorSeverity,
  CodeCorrectionResult
} from '../types';
import { processInstruction } from '../services/ai';

/**
 * Agente de Corrección de Código
 *
 * Este agente es responsable de analizar y corregir código, identificando errores
 * de sintaxis, lógica, seguridad y rendimiento, y generando versiones corregidas.
 */
export class CodeCorrectorAgent {
  /**
   * Ejecuta el agente de corrección de código para analizar y corregir un archivo
   * @param task La tarea asignada al agente
   * @param code Código a analizar y corregir
   * @param language Lenguaje de programación del código
   * @param options Opciones adicionales para la corrección
   * @returns Resultado del agente con el análisis y correcciones
   */
  public static async execute(
    task: AgentTask,
    code: string,
    language: string,
    options: {
      analyzeSecurity?: boolean;
      analyzePerformance?: boolean;
      generateTests?: boolean;
      explainChanges?: boolean;
    } = {}
  ): Promise<CodeCorrectorResult> {
    try {
      console.log('Iniciando análisis de código:', { language, codeLength: code.length, options });

      // Validar entrada
      if (!code || code.trim() === '') {
        throw new Error('El código a analizar está vacío');
      }

      // Construir el prompt para el modelo de IA
      const prompt = this.buildPrompt(code, language, options);
      console.log('Prompt construido, enviando al modelo...');

      // Procesar la instrucción con el modelo de IA Claude
      let response;
      try {
        response = await processInstruction(prompt, 'Claude 3.5 Sonnet V2');
        console.log('Respuesta recibida del modelo:', {
          model: response.model,
          contentLength: response.content?.length || 0,
          executionTime: response.executionTime
        });
      } catch (aiError) {
        console.error('Error al procesar con Claude, intentando con modelo alternativo:', aiError);
        // Intentar con un modelo alternativo si Claude falla
        response = await processInstruction(prompt, 'GPT-4O');
        console.log('Respuesta recibida del modelo alternativo:', {
          model: response.model,
          contentLength: response.content?.length || 0
        });
      }

      // Verificar que la respuesta tenga contenido
      if (!response.content || response.content.trim() === '') {
        throw new Error('El modelo de IA devolvió una respuesta vacía');
      }

      // Analizar la respuesta para extraer los errores y correcciones
      console.log('Analizando respuesta del modelo...');
      const analysis = this.parseResponse(response.content, code, language);
      console.log('Análisis completado:', {
        errorsFound: analysis.errors.length,
        hasCorrectedCode: analysis.correctedCode !== code
      });

      // Si se proporcionó un archivo, crear versiones original y corregida
      let originalFile: FileItem | undefined;
      let correctedFile: FileItem | undefined;

      if (task.metadata?.fileId) {
        originalFile = {
          id: task.metadata.fileId as string,
          name: task.metadata.fileName as string,
          path: task.metadata.filePath as string,
          content: code,
          language
        };

        correctedFile = {
          id: `corrected-${originalFile.id}`,
          name: `corrected-${originalFile.name}`,
          path: `corrected/${originalFile.path}`,
          content: analysis.correctedCode,
          language
        };
      }

      // Asegurarse de que haya al menos un error para que se muestren los resultados
      if (analysis.errors.length === 0 && analysis.correctedCode !== code) {
        console.log('No se encontraron errores pero hay código corregido, añadiendo error genérico');
        const genericError: CodeError = {
          id: `error-${Date.now()}-auto`,
          type: 'style',
          severity: 'info',
          message: 'Mejoras de código aplicadas',
          description: 'Se han aplicado mejoras al código que no corresponden a errores específicos.',
          lineStart: 1,
          lineEnd: code.split('\n').length,
          code: code,
          suggestion: 'Revisar el código corregido para ver las mejoras aplicadas.',
          fixed: true
        };

        analysis.errors.push(genericError);
        analysis.summary.totalErrors = 1;
        analysis.summary.fixedErrors = 1;
        analysis.summary.errorsByType.style = 1;
        analysis.summary.errorsBySeverity.info = 1;
      }

      return {
        success: true,
        data: {
          analysis,
          originalFile,
          correctedFile
        },
        metadata: {
          model: response.model,
          executionTime: response.executionTime || Date.now(),
          options
        }
      };
    } catch (error) {
      console.error('Error en CodeCorrectorAgent:', error);

      // Crear un resultado de error que aún muestre algo al usuario
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido en el agente de corrección de código';

      // Crear un error genérico para mostrar al usuario
      const genericError: CodeError = {
        id: `error-${Date.now()}-system`,
        type: 'syntax',
        severity: 'critical',
        message: 'Error en el análisis',
        description: `Ocurrió un error durante el análisis: ${errorMessage}`,
        lineStart: 1,
        lineEnd: 1,
        code: '',
        suggestion: 'Intenta nuevamente con un código diferente o contacta al soporte.',
        fixed: false
      };

      const errorAnalysis: CodeCorrectionResult = {
        originalCode: code || '',
        correctedCode: code || '',
        errors: [genericError],
        summary: {
          totalErrors: 1,
          fixedErrors: 0,
          errorsByType: {
            syntax: 1,
            logic: 0,
            security: 0,
            performance: 0,
            style: 0,
            bestPractice: 0
          },
          errorsBySeverity: {
            critical: 1,
            high: 0,
            medium: 0,
            low: 0,
            info: 0
          }
        },
        executionTime: Date.now(),
        language: language || 'javascript'
      };

      return {
        success: false,
        error: errorMessage,
        data: {
          analysis: errorAnalysis
        }
      };
    }
  }

  /**
   * Construye el prompt para el modelo de IA
   * @param code Código a analizar
   * @param language Lenguaje de programación
   * @param options Opciones adicionales
   * @returns Prompt para el modelo de IA
   */
  private static buildPrompt(
    code: string,
    language: string,
    options: {
      analyzeSecurity?: boolean;
      analyzePerformance?: boolean;
      generateTests?: boolean;
      explainChanges?: boolean;
    }
  ): string {
    return `
TAREA: ANÁLISIS Y CORRECCIÓN DE CÓDIGO

Eres un experto en análisis y corrección de código. Tu tarea es analizar el siguiente código en ${language},
identificar errores y problemas, y proporcionar una versión corregida.

CÓDIGO A ANALIZAR:
\`\`\`${language}
${code}
\`\`\`

INSTRUCCIONES:
1. Analiza el código en busca de los siguientes tipos de errores:
   - Errores de sintaxis
   - Errores de lógica
   - ${options.analyzeSecurity ? 'Problemas de seguridad' : ''}
   - ${options.analyzePerformance ? 'Problemas de rendimiento' : ''}
   - Problemas de estilo y mejores prácticas

2. Para cada error encontrado, proporciona:
   - Tipo de error (syntax, logic, security, performance, style, bestPractice)
   - Severidad (critical, high, medium, low, info)
   - Mensaje breve describiendo el problema
   - Descripción detallada del problema
   - Líneas afectadas (inicio y fin)
   - Sugerencia de corrección

3. Proporciona una versión completamente corregida del código.

4. ${options.generateTests ? 'Genera tests unitarios para verificar la corrección.' : ''}

5. ${options.explainChanges ? 'Explica los cambios realizados y por qué mejoran el código.' : ''}

FORMATO DE RESPUESTA:
Responde en formato JSON con la siguiente estructura:
{
  "errors": [
    {
      "type": "tipo_de_error",
      "severity": "severidad",
      "message": "mensaje_breve",
      "description": "descripción_detallada",
      "lineStart": número_línea_inicio,
      "lineEnd": número_línea_fin,
      "code": "código_con_error",
      "suggestion": "sugerencia_de_corrección"
    }
  ],
  "correctedCode": "código_completo_corregido",
  "summary": {
    "totalErrors": número_total_errores,
    "errorsByType": {
      "syntax": número,
      "logic": número,
      "security": número,
      "performance": número,
      "style": número,
      "bestPractice": número
    },
    "errorsBySeverity": {
      "critical": número,
      "high": número,
      "medium": número,
      "low": número,
      "info": número
    }
  }${options.generateTests ? ',\n  "tests": "código_de_tests"' : ''}${options.explainChanges ? ',\n  "explanation": "explicación_de_cambios"' : ''}
}
`;
  }

  /**
   * Analiza la respuesta del modelo de IA para extraer los errores y correcciones
   * @param responseContent Contenido de la respuesta del modelo
   * @param originalCode Código original
   * @param language Lenguaje de programación
   * @returns Resultado del análisis y corrección
   */
  private static parseResponse(
    responseContent: string,
    originalCode: string,
    language: string
  ): CodeCorrectionResult {
    try {
      console.log('Respuesta del modelo:', responseContent);

      // Intentar diferentes patrones para extraer el JSON
      let jsonStr = '';
      let parsedResponse = null;

      // Intento 1: Buscar bloques de código JSON con ```json
      const jsonCodeBlockMatch = responseContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonCodeBlockMatch && jsonCodeBlockMatch[1]) {
        jsonStr = jsonCodeBlockMatch[1].trim();
        try {
          parsedResponse = JSON.parse(jsonStr);
          console.log('JSON extraído de bloque de código:', parsedResponse);
        } catch (e) {
          console.warn('Error al parsear JSON del bloque de código:', e);
        }
      }

      // Intento 2: Buscar cualquier objeto JSON en la respuesta
      if (!parsedResponse) {
        const jsonObjectMatch = responseContent.match(/{[\s\S]*?}/);
        if (jsonObjectMatch) {
          jsonStr = jsonObjectMatch[0].trim();
          try {
            parsedResponse = JSON.parse(jsonStr);
            console.log('JSON extraído de objeto en texto:', parsedResponse);
          } catch (e) {
            console.warn('Error al parsear JSON del objeto en texto:', e);
          }
        }
      }

      // Intento 3: Buscar cualquier array JSON en la respuesta
      if (!parsedResponse) {
        const jsonArrayMatch = responseContent.match(/\[[\s\S]*?\]/);
        if (jsonArrayMatch) {
          jsonStr = jsonArrayMatch[0].trim();
          try {
            parsedResponse = JSON.parse(jsonStr);
            console.log('JSON extraído de array en texto:', parsedResponse);
          } catch (e) {
            console.warn('Error al parsear JSON del array en texto:', e);
          }
        }
      }

      // Si no se pudo extraer JSON, crear una respuesta básica
      if (!parsedResponse) {
        console.warn('No se pudo extraer JSON de la respuesta, generando respuesta básica');

        // Extraer código corregido si existe
        const codeBlockMatch = responseContent.match(/```[\w]*\s*([\s\S]*?)\s*```/);
        const correctedCode = codeBlockMatch ? codeBlockMatch[1].trim() : originalCode;

        // Crear un error genérico
        const genericError = {
          id: `error-${Date.now()}`,
          type: 'syntax' as CodeErrorType,
          severity: 'medium' as CodeErrorSeverity,
          message: 'Análisis de código completado',
          description: 'El modelo no proporcionó un análisis detallado, pero generó una versión corregida del código.',
          lineStart: 1,
          lineEnd: originalCode.split('\n').length,
          code: originalCode,
          suggestion: 'Revisar el código corregido para ver los cambios realizados.',
          fixed: true
        };

        parsedResponse = {
          errors: [genericError],
          correctedCode: correctedCode,
          summary: {
            totalErrors: 1,
            errorsByType: {
              syntax: 1,
              logic: 0,
              security: 0,
              performance: 0,
              style: 0,
              bestPractice: 0
            },
            errorsBySeverity: {
              critical: 0,
              high: 0,
              medium: 1,
              low: 0,
              info: 0
            }
          }
        };
      }

      // Mapear los errores al formato esperado
      const errors: CodeError[] = (parsedResponse.errors || []).map((error: any, index: number) => ({
        id: `error-${Date.now()}-${index}`,
        type: this.validateErrorType(error.type),
        severity: this.validateErrorSeverity(error.severity),
        message: error.message || 'Error no especificado',
        description: error.description || '',
        lineStart: error.lineStart || 0,
        lineEnd: error.lineEnd || 0,
        code: error.code || '',
        suggestion: error.suggestion || '',
        fixed: true // Asumimos que todos los errores están corregidos en el código corregido
      }));

      // Contar errores por tipo y severidad
      const errorsByType: Record<CodeErrorType, number> = {
        syntax: 0,
        logic: 0,
        security: 0,
        performance: 0,
        style: 0,
        bestPractice: 0
      };

      const errorsBySeverity: Record<CodeErrorSeverity, number> = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
      };

      errors.forEach(error => {
        errorsByType[error.type]++;
        errorsBySeverity[error.severity]++;
      });

      // Asegurarse de que correctedCode no sea undefined o null
      const correctedCode = parsedResponse.correctedCode || originalCode;

      // Asegurarse de que haya al menos un error si hay código corregido y es diferente al original
      if (errors.length === 0 && correctedCode !== originalCode) {
        const genericError: CodeError = {
          id: `error-${Date.now()}-auto`,
          type: 'style',
          severity: 'info',
          message: 'Mejoras de código aplicadas',
          description: 'Se han aplicado mejoras al código que no corresponden a errores específicos.',
          lineStart: 1,
          lineEnd: originalCode.split('\n').length,
          code: originalCode,
          suggestion: 'Revisar el código corregido para ver las mejoras aplicadas.',
          fixed: true
        };

        errors.push(genericError);
        errorsByType.style++;
        errorsBySeverity.info++;
      }

      console.log('Análisis completado:', {
        errorsCount: errors.length,
        hasCorrections: correctedCode !== originalCode
      });

      return {
        originalCode,
        correctedCode,
        errors,
        summary: {
          totalErrors: errors.length,
          fixedErrors: errors.length, // Asumimos que todos los errores están corregidos
          errorsByType,
          errorsBySeverity
        },
        executionTime: Date.now(),
        language
      };
    } catch (error) {
      console.error('Error al analizar la respuesta:', error);

      // Devolver un resultado por defecto en caso de error
      return {
        originalCode,
        correctedCode: originalCode,
        errors: [],
        summary: {
          totalErrors: 0,
          fixedErrors: 0,
          errorsByType: {
            syntax: 0,
            logic: 0,
            security: 0,
            performance: 0,
            style: 0,
            bestPractice: 0
          },
          errorsBySeverity: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0
          }
        },
        executionTime: Date.now(),
        language
      };
    }
  }

  /**
   * Valida y normaliza el tipo de error
   * @param type Tipo de error proporcionado
   * @returns Tipo de error normalizado
   */
  private static validateErrorType(type: string): CodeErrorType {
    const validTypes: CodeErrorType[] = ['syntax', 'logic', 'security', 'performance', 'style', 'bestPractice'];

    // Normalizar el tipo (convertir a camelCase si es necesario)
    const normalizedType = type.toLowerCase().replace(/[^a-z]/g, '') as CodeErrorType;

    if (normalizedType === 'bestpractice' || normalizedType === 'bestpractices') {
      return 'bestPractice';
    }

    return validTypes.includes(normalizedType as CodeErrorType)
      ? normalizedType as CodeErrorType
      : 'syntax';
  }

  /**
   * Valida y normaliza la severidad del error
   * @param severity Severidad proporcionada
   * @returns Severidad normalizada
   */
  private static validateErrorSeverity(severity: string): CodeErrorSeverity {
    const validSeverities: CodeErrorSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];

    // Normalizar la severidad
    const normalizedSeverity = severity.toLowerCase() as CodeErrorSeverity;

    return validSeverities.includes(normalizedSeverity)
      ? normalizedSeverity
      : 'medium';
  }
}
