/**
 * Agente 3 - Generador de Código Corregido
 * Genera código nuevo y corregido basado en los análisis previos
 */

import { CodeError } from './ErrorDetectorAgent';

export interface CorrectionChange {
  id: string;
  lineNumber: number;
  originalCode: string;
  correctedCode: string;
  reason: string;
  type: 'fix' | 'improvement' | 'optimization';
  confidence: number;
}

export interface CodeGenerationResult {
  correctedCode: string;
  changes: CorrectionChange[];
  explanations: string[];
  improvementsSummary: {
    syntaxFixes: number;
    logicImprovements: number;
    securityFixes: number;
    performanceOptimizations: number;
    styleImprovements: number;
  };
  qualityScore: number;
  maintainabilityImprovement: number;
}

class CodeGeneratorAgent {
  private static readonly CORRECTION_RULES = {
    javascript: {
      'Missing semicolon': (line: string) => line.trim() + ';',
      'Use let or const instead of var': (line: string) => line.replace(/var\s+/, 'const '),
      'Use template literals instead of concatenation': (line: string) => 
        this.convertToTemplateLiteral(line),
      'Trailing whitespace': (line: string) => line.trimEnd(),
      'Use spaces instead of tabs': (line: string) => line.replace(/\t/g, '  '),
      'Consider using arrow functions': (line: string) => 
        this.convertToArrowFunction(line),
      'Cache array length in loop': (line: string) => 
        this.optimizeArrayLoop(line),
      'Use === instead of ==': (line: string) => 
        line.replace(/([^=!])=([^=])/g, '$1===$2'),
      'Remove unnecessary comparison with true': (line: string) =>
        line.replace(/==\s*true|true\s*==/g, '').replace(/if\s*\(\s*(.+?)\s*\)/, 'if ($1)'),
      'Remove unnecessary comparison with false': (line: string) =>
        line.replace(/==\s*false|false\s*==/g, '').replace(/if\s*\(\s*(.+?)\s*\)/, 'if (!$1)')
    },
    python: {
      'Use 4 spaces instead of tabs (PEP 8)': (line: string) => line.replace(/\t/g, '    '),
      'Trailing whitespace': (line: string) => line.trimEnd(),
      'Use snake_case for variables (PEP 8)': (line: string) => 
        this.convertToSnakeCase(line),
      'Use "is True" instead of "== True"': (line: string) =>
        line.replace(/==\s*True/g, 'is True').replace(/True\s*==/g, 'is True'),
      'Use "is False" instead of "== False"': (line: string) =>
        line.replace(/==\s*False/g, 'is False').replace(/False\s*==/g, 'is False'),
      'Add docstring to function': (line: string) => 
        this.addPythonDocstring(line)
    },
    typescript: {
      'Add type annotations': (line: string) => this.addTypeAnnotations(line),
      'Use interface instead of type for object shapes': (line: string) =>
        line.replace(/type\s+(\w+)\s*=\s*{/, 'interface $1 {'),
      'Use readonly for immutable properties': (line: string) =>
        this.addReadonlyModifiers(line)
    }
  };

  /**
   * Genera código corregido basado en errores detectados
   */
  static generateCorrectedCode(
    originalCode: string, 
    errors: CodeError[], 
    language: string
  ): CodeGenerationResult {
    const lines = originalCode.split('\n');
    const changes: CorrectionChange[] = [];
    const explanations: string[] = [];
    let correctedLines = [...lines];

    // Aplicar correcciones línea por línea
    errors.forEach((error, index) => {
      if (error.fixable) {
        const correction = this.applyCorrectionRule(
          error, 
          correctedLines[error.lineStart - 1], 
          language
        );

        if (correction) {
          const change: CorrectionChange = {
            id: `change-${index}`,
            lineNumber: error.lineStart,
            originalCode: lines[error.lineStart - 1],
            correctedCode: correction.correctedCode,
            reason: correction.reason,
            type: this.determineChangeType(error.type),
            confidence: correction.confidence
          };

          changes.push(change);
          correctedLines[error.lineStart - 1] = correction.correctedCode;
          explanations.push(
            `Line ${error.lineStart}: ${error.message} → ${correction.reason}`
          );
        }
      }
    });

    // Aplicar mejoras adicionales
    const additionalImprovements = this.applyAdditionalImprovements(
      correctedLines, 
      language
    );
    
    changes.push(...additionalImprovements.changes);
    explanations.push(...additionalImprovements.explanations);
    correctedLines = additionalImprovements.improvedLines;

    // Calcular métricas de mejora
    const improvementsSummary = this.calculateImprovements(changes);
    const qualityScore = this.calculateQualityScore(originalCode, correctedLines.join('\n'));
    const maintainabilityImprovement = this.calculateMaintainabilityImprovement(
      originalCode, 
      correctedLines.join('\n')
    );

    return {
      correctedCode: correctedLines.join('\n'),
      changes,
      explanations,
      improvementsSummary,
      qualityScore,
      maintainabilityImprovement
    };
  }

  /**
   * Aplica regla de corrección específica
   */
  private static applyCorrectionRule(
    error: CodeError, 
    line: string, 
    language: string
  ): { correctedCode: string; reason: string; confidence: number } | null {
    const rules = this.CORRECTION_RULES[language as keyof typeof this.CORRECTION_RULES];
    if (!rules) return null;

    const rule = rules[error.message as keyof typeof rules];
    if (!rule) {
      // Regla genérica basada en la sugerencia del error
      return {
        correctedCode: error.suggestion,
        reason: `Applied suggestion: ${error.message}`,
        confidence: 0.7
      };
    }

    try {
      const correctedCode = rule(line);
      return {
        correctedCode,
        reason: `Applied rule: ${error.message}`,
        confidence: 0.9
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Aplica mejoras adicionales al código
   */
  private static applyAdditionalImprovements(
    lines: string[], 
    language: string
  ): {
    improvedLines: string[];
    changes: CorrectionChange[];
    explanations: string[];
  } {
    const changes: CorrectionChange[] = [];
    const explanations: string[] = [];
    const improvedLines = [...lines];

    switch (language) {
      case 'javascript':
      case 'typescript':
        this.applyJavaScriptImprovements(improvedLines, changes, explanations);
        break;
      case 'python':
        this.applyPythonImprovements(improvedLines, changes, explanations);
        break;
    }

    return { improvedLines, changes, explanations };
  }

  /**
   * Aplica mejoras específicas de JavaScript
   */
  private static applyJavaScriptImprovements(
    lines: string[], 
    changes: CorrectionChange[], 
    explanations: string[]
  ): void {
    lines.forEach((line, index) => {
      // Convertir funciones a arrow functions cuando sea apropiado
      if (line.includes('function(') && !line.includes('function ')) {
        const arrowFunction = line.replace(
          /function\s*\(([^)]*)\)\s*{/,
          '($1) => {'
        );
        if (arrowFunction !== line) {
          changes.push({
            id: `improvement-${index}`,
            lineNumber: index + 1,
            originalCode: line,
            correctedCode: arrowFunction,
            reason: 'Converted to arrow function for better readability',
            type: 'improvement',
            confidence: 0.8
          });
          lines[index] = arrowFunction;
          explanations.push(`Line ${index + 1}: Converted to arrow function`);
        }
      }

      // Agregar const para variables que no cambian
      if (line.includes('let ') && !this.isVariableReassigned(lines, index)) {
        const constVersion = line.replace(/let\s+/, 'const ');
        changes.push({
          id: `const-${index}`,
          lineNumber: index + 1,
          originalCode: line,
          correctedCode: constVersion,
          reason: 'Changed to const as variable is not reassigned',
          type: 'improvement',
          confidence: 0.9
        });
        lines[index] = constVersion;
        explanations.push(`Line ${index + 1}: Changed let to const`);
      }
    });
  }

  /**
   * Aplica mejoras específicas de Python
   */
  private static applyPythonImprovements(
    lines: string[], 
    changes: CorrectionChange[], 
    explanations: string[]
  ): void {
    lines.forEach((line, index) => {
      // Agregar type hints donde sea apropiado
      if (line.includes('def ') && !line.includes('->') && !line.includes(':')) {
        const withTypeHints = this.addPythonTypeHints(line);
        if (withTypeHints !== line) {
          changes.push({
            id: `typehint-${index}`,
            lineNumber: index + 1,
            originalCode: line,
            correctedCode: withTypeHints,
            reason: 'Added type hints for better code documentation',
            type: 'improvement',
            confidence: 0.7
          });
          lines[index] = withTypeHints;
          explanations.push(`Line ${index + 1}: Added type hints`);
        }
      }
    });
  }

  /**
   * Determina el tipo de cambio basado en el tipo de error
   */
  private static determineChangeType(errorType: string): 'fix' | 'improvement' | 'optimization' {
    switch (errorType) {
      case 'syntax':
      case 'logic':
      case 'security':
        return 'fix';
      case 'performance':
        return 'optimization';
      case 'style':
      case 'best-practice':
      default:
        return 'improvement';
    }
  }

  /**
   * Calcula resumen de mejoras
   */
  private static calculateImprovements(changes: CorrectionChange[]) {
    return {
      syntaxFixes: changes.filter(c => c.type === 'fix' && c.reason.includes('syntax')).length,
      logicImprovements: changes.filter(c => c.reason.includes('logic')).length,
      securityFixes: changes.filter(c => c.reason.includes('security')).length,
      performanceOptimizations: changes.filter(c => c.type === 'optimization').length,
      styleImprovements: changes.filter(c => c.type === 'improvement').length
    };
  }

  /**
   * Calcula puntuación de calidad del código
   */
  private static calculateQualityScore(originalCode: string, correctedCode: string): number {
    const originalLines = originalCode.split('\n').filter(line => line.trim());
    const correctedLines = correctedCode.split('\n').filter(line => line.trim());
    
    // Factores de calidad
    const lengthFactor = Math.min(correctedLines.length / Math.max(originalLines.length, 1), 1.2);
    const complexityReduction = this.estimateComplexityReduction(originalCode, correctedCode);
    
    return Math.min(100, 70 + (complexityReduction * 20) + (lengthFactor * 10));
  }

  /**
   * Calcula mejora en mantenibilidad
   */
  private static calculateMaintainabilityImprovement(
    originalCode: string, 
    correctedCode: string
  ): number {
    // Estimación simple basada en métricas básicas
    const originalComplexity = this.estimateCodeComplexity(originalCode);
    const correctedComplexity = this.estimateCodeComplexity(correctedCode);
    
    return Math.max(0, ((originalComplexity - correctedComplexity) / originalComplexity) * 100);
  }

  // Métodos auxiliares
  private static convertToTemplateLiteral(line: string): string {
    // Conversión básica de concatenación a template literal
    return line.replace(/(['"])(.*?)\1\s*\+\s*(\w+)/g, '`$2${$3}`');
  }

  private static convertToArrowFunction(line: string): string {
    return line.replace(/function\s*\(([^)]*)\)\s*{/, '($1) => {');
  }

  private static optimizeArrayLoop(line: string): string {
    return line.replace(
      /for\s*\(\s*(\w+)\s*=\s*0;\s*\1\s*<\s*(\w+)\.length/,
      'for (let $1 = 0, len = $2.length; $1 < len'
    );
  }

  private static convertToSnakeCase(line: string): string {
    return line.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  }

  private static addPythonDocstring(line: string): string {
    if (line.includes('def ')) {
      return line + '\n    """Function description."""';
    }
    return line;
  }

  private static addTypeAnnotations(line: string): string {
    // Agregar anotaciones de tipo básicas
    return line.replace(/(\w+)\s*=\s*(\d+)/, '$1: number = $2')
               .replace(/(\w+)\s*=\s*(['"][^'"]*['"])/, '$1: string = $2');
  }

  private static addReadonlyModifiers(line: string): string {
    return line.replace(/(\w+):\s*(string|number|boolean)/, 'readonly $1: $2');
  }

  private static addPythonTypeHints(line: string): string {
    return line.replace(/def\s+(\w+)\s*\(([^)]*)\):/, 'def $1($2) -> None:');
  }

  private static isVariableReassigned(lines: string[], currentIndex: number): boolean {
    const varMatch = lines[currentIndex].match(/let\s+(\w+)/);
    if (!varMatch) return false;
    
    const varName = varMatch[1];
    return lines.slice(currentIndex + 1).some(line => 
      line.includes(`${varName} =`) && !line.includes(`let ${varName}`)
    );
  }

  private static estimateComplexityReduction(original: string, corrected: string): number {
    const originalComplexity = this.estimateCodeComplexity(original);
    const correctedComplexity = this.estimateCodeComplexity(corrected);
    
    return Math.max(0, (originalComplexity - correctedComplexity) / originalComplexity);
  }

  private static estimateCodeComplexity(code: string): number {
    const complexityIndicators = [
      /\b(if|else|while|for|switch|case|try|catch)\b/g,
      /\b(function|def|class)\b/g,
      /[{}]/g
    ];
    
    return complexityIndicators.reduce((total, pattern) => {
      const matches = code.match(pattern);
      return total + (matches ? matches.length : 0);
    }, 0);
  }
}

export default CodeGeneratorAgent;
