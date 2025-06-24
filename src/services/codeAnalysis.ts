import { CodeIssue, CodeIssueLevel, CodeAnalysisResult, FileItem } from '../types';
import { processInstruction } from './ai';

/**
 * Servicio para analizar código y detectar problemas
 */
export class CodeAnalysisService {
  /**
   * Analiza un archivo en busca de problemas
   * @param file Archivo a analizar
   * @returns Resultado del análisis
   */
  public static async analyzeFile(file: FileItem): Promise<CodeAnalysisResult> {
    try {
      // Determinar el tipo de análisis según el lenguaje
      const analysisType = this.getAnalysisTypeForLanguage(file.language);
      
      // Construir el prompt para el modelo de IA
      const prompt = this.buildAnalysisPrompt(file, analysisType);
      
      // Procesar la instrucción con el modelo de IA
      const response = await processInstruction(prompt, 'Claude 3.5 Sonnet V2');
      
      // Extraer los problemas del código
      const issues = this.parseAnalysisResponse(response.content, file.path);
      
      // Contar los problemas por nivel
      const summary = {
        critical: issues.filter(issue => issue.level === 'critical').length,
        warning: issues.filter(issue => issue.level === 'warning').length,
        suggestion: issues.filter(issue => issue.level === 'suggestion').length
      };
      
      return {
        fileId: file.id,
        issues,
        summary
      };
    } catch (error) {
      console.error('Error al analizar el código:', error);
      
      // Devolver un resultado vacío en caso de error
      return {
        fileId: file.id,
        issues: [],
        summary: { critical: 0, warning: 0, suggestion: 0 }
      };
    }
  }
  
  /**
   * Construye el prompt para el análisis de código
   * @param file Archivo a analizar
   * @param analysisType Tipo de análisis a realizar
   * @returns Prompt para el modelo de IA
   */
  private static buildAnalysisPrompt(file: FileItem, analysisType: string): string {
    return `
Actúa como un experto en análisis estático de código para ${file.language}. Necesito que analices el siguiente código en busca de problemas.

ARCHIVO A ANALIZAR:
Ruta: ${file.path}
Lenguaje: ${file.language}

CÓDIGO:
\`\`\`${file.language}
${file.content}
\`\`\`

TIPO DE ANÁLISIS: ${analysisType}

Tu tarea es:
1. Identificar problemas de código como errores de sintaxis, problemas de seguridad, ineficiencias y malas prácticas.
2. Clasificar cada problema por severidad: "critical" (errores graves), "warning" (advertencias) o "suggestion" (sugerencias).
3. Proporcionar una descripción detallada de cada problema.
4. Sugerir una solución específica para cada problema.
5. Indicar las líneas exactas donde se encuentra cada problema.

Responde con un JSON estructurado de la siguiente manera:

\`\`\`json
{
  "issues": [
    {
      "level": "critical|warning|suggestion",
      "message": "Breve descripción del problema",
      "description": "Explicación detallada del problema",
      "lineStart": 10,
      "lineEnd": 12,
      "suggestion": "Código o explicación de cómo solucionar el problema"
    }
  ]
}
\`\`\`

IMPORTANTE:
- Sé específico y preciso en la identificación de problemas.
- Proporciona sugerencias de código concretas y aplicables.
- Incluye solo problemas reales, no inventes problemas que no existen.
- Si no hay problemas, devuelve un array vacío.
- Asegúrate de que el JSON sea válido.
`;
  }
  
  /**
   * Determina el tipo de análisis según el lenguaje
   * @param language Lenguaje del archivo
   * @returns Tipo de análisis a realizar
   */
  private static getAnalysisTypeForLanguage(language: string): string {
    switch (language.toLowerCase()) {
      case 'javascript':
        return 'Análisis de JavaScript (sintaxis, patrones, seguridad, rendimiento)';
      case 'typescript':
        return 'Análisis de TypeScript (tipos, sintaxis, patrones, seguridad)';
      case 'python':
        return 'Análisis de Python (PEP8, seguridad, patrones, rendimiento)';
      case 'html':
        return 'Análisis de HTML (accesibilidad, semántica, validación)';
      case 'css':
        return 'Análisis de CSS (compatibilidad, rendimiento, buenas prácticas)';
      case 'java':
        return 'Análisis de Java (patrones, seguridad, rendimiento)';
      case 'c#':
      case 'csharp':
        return 'Análisis de C# (patrones, seguridad, rendimiento)';
      case 'php':
        return 'Análisis de PHP (seguridad, patrones, rendimiento)';
      case 'go':
        return 'Análisis de Go (idiomático, rendimiento, seguridad)';
      case 'rust':
        return 'Análisis de Rust (seguridad de memoria, patrones, rendimiento)';
      default:
        return 'Análisis general (sintaxis, patrones, seguridad, rendimiento)';
    }
  }
  
  /**
   * Analiza la respuesta del modelo de IA y extrae los problemas
   * @param responseContent Contenido de la respuesta
   * @param filePath Ruta del archivo analizado
   * @returns Lista de problemas encontrados
   */
  private static parseAnalysisResponse(responseContent: string, filePath: string): CodeIssue[] {
    try {
      // Extraer el JSON de la respuesta
      const jsonMatch = responseContent.match(/```json\s*([\s\S]*?)\s*```/) ||
                        responseContent.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error('No se pudo extraer JSON de la respuesta');
        return [];
      }
      
      const jsonContent = jsonMatch[0].replace(/```json|```/g, '').trim();
      const parsedData = JSON.parse(jsonContent);
      
      if (!parsedData.issues || !Array.isArray(parsedData.issues)) {
        console.error('La respuesta no contiene un array de issues');
        return [];
      }
      
      // Convertir los problemas al formato esperado
      return parsedData.issues.map((issue: any, index: number) => ({
        id: `issue-${Date.now()}-${index}`,
        level: this.validateIssueLevel(issue.level),
        message: issue.message || 'Problema sin descripción',
        description: issue.description || issue.message || 'Sin detalles adicionales',
        lineStart: this.validateLineNumber(issue.lineStart),
        lineEnd: this.validateLineNumber(issue.lineEnd, issue.lineStart),
        filePath,
        suggestion: issue.suggestion || 'No hay sugerencia disponible',
        isIgnored: false
      }));
    } catch (error) {
      console.error('Error al parsear la respuesta del análisis:', error);
      return [];
    }
  }
  
  /**
   * Valida el nivel de un problema
   * @param level Nivel del problema
   * @returns Nivel validado
   */
  private static validateIssueLevel(level: string): CodeIssueLevel {
    if (level === 'critical' || level === 'warning' || level === 'suggestion') {
      return level as CodeIssueLevel;
    }
    
    // Intentar mapear otros valores comunes
    if (level === 'error') return 'critical';
    if (level === 'warn') return 'warning';
    if (level === 'info' || level === 'hint') return 'suggestion';
    
    // Valor por defecto
    return 'warning';
  }
  
  /**
   * Valida un número de línea
   * @param lineNumber Número de línea a validar
   * @param defaultValue Valor por defecto si no es válido
   * @returns Número de línea validado
   */
  private static validateLineNumber(lineNumber: any, defaultValue: number = 1): number {
    const num = parseInt(lineNumber);
    return isNaN(num) || num < 1 ? defaultValue : num;
  }
  
  /**
   * Aplica una corrección automática a un archivo
   * @param file Archivo a corregir
   * @param issue Problema a corregir
   * @returns Contenido corregido del archivo
   */
  public static async applyAutoFix(file: FileItem, issue: CodeIssue): Promise<string> {
    try {
      // Construir el prompt para la corrección
      const prompt = this.buildFixPrompt(file, issue);
      
      // Procesar la instrucción con el modelo de IA
      const response = await processInstruction(prompt, 'Claude 3.5 Sonnet V2');
      
      // Extraer el código corregido
      const fixedCode = this.extractFixedCode(response.content, file.language);
      
      return fixedCode || file.content;
    } catch (error) {
      console.error('Error al aplicar corrección automática:', error);
      return file.content;
    }
  }
  
  /**
   * Construye el prompt para la corrección automática
   * @param file Archivo a corregir
   * @param issue Problema a corregir
   * @returns Prompt para el modelo de IA
   */
  private static buildFixPrompt(file: FileItem, issue: CodeIssue): string {
    return `
Actúa como un experto en ${file.language}. Necesito que corrijas un problema específico en el siguiente código.

ARCHIVO:
Ruta: ${file.path}
Lenguaje: ${file.language}

CÓDIGO ORIGINAL:
\`\`\`${file.language}
${file.content}
\`\`\`

PROBLEMA A CORREGIR:
- Nivel: ${issue.level}
- Mensaje: ${issue.message}
- Descripción: ${issue.description}
- Líneas afectadas: ${issue.lineStart} a ${issue.lineEnd}
- Sugerencia: ${issue.suggestion}

Tu tarea es:
1. Corregir ÚNICAMENTE el problema especificado.
2. Mantener el resto del código exactamente igual.
3. Asegurarte de que la solución sea correcta y siga las mejores prácticas.

Responde ÚNICAMENTE con el código completo corregido en un bloque de código:

\`\`\`${file.language}
// Código corregido aquí
\`\`\`
`;
  }
  
  /**
   * Extrae el código corregido de la respuesta
   * @param responseContent Contenido de la respuesta
   * @param language Lenguaje del archivo
   * @returns Código corregido
   */
  private static extractFixedCode(responseContent: string, language: string): string | null {
    const codeBlockRegex = new RegExp(`\`\`\`(?:${language})?\\s*([\\s\\S]*?)\\s*\`\`\``, 'i');
    const match = responseContent.match(codeBlockRegex);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    return null;
  }
}
