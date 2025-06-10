/**
 * Agente 2 - Detector de Errores
 * Identifica errores de sintaxis, lógica, seguridad y mejores prácticas
 */

export interface CodeError {
  id: string;
  type: 'syntax' | 'logic' | 'security' | 'performance' | 'style' | 'best-practice';
  severity: 'critical' | 'error' | 'warning' | 'info';
  message: string;
  description: string;
  lineStart: number;
  lineEnd: number;
  columnStart?: number;
  columnEnd?: number;
  code: string;
  suggestion: string;
  fixable: boolean;
  rule?: string;
  category: string;
}

export interface DiffChange {
  type: 'add' | 'remove' | 'modify';
  lineNumber: number;
  oldContent?: string;
  newContent?: string;
  context: string[];
}

export interface ErrorAnalysisResult {
  errors: CodeError[];
  warnings: CodeError[];
  suggestions: CodeError[];
  totalIssues: number;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  diff: DiffChange[];
}

class ErrorDetectorAgent {
  private static readonly ERROR_PATTERNS = {
    javascript: {
      syntax: [
        { pattern: /\b(var|let|const)\s+(\w+)\s*=\s*$/, message: 'Incomplete variable declaration', severity: 'error' as const },
        { pattern: /function\s+\w+\s*\([^)]*\)\s*$/, message: 'Function missing body', severity: 'error' as const },
        { pattern: /if\s*\([^)]*\)\s*$/, message: 'If statement missing body', severity: 'error' as const },
        { pattern: /\{\s*$/, message: 'Unclosed block', severity: 'warning' as const },
        { pattern: /console\.log\(.*[^;]$/, message: 'Missing semicolon', severity: 'warning' as const }
      ],
      logic: [
        { pattern: /if\s*\(\s*true\s*\)/, message: 'Condition is always true', severity: 'warning' as const },
        { pattern: /if\s*\(\s*false\s*\)/, message: 'Condition is always false', severity: 'warning' as const },
        { pattern: /==\s*true|true\s*==/, message: 'Unnecessary comparison with true', severity: 'info' as const },
        { pattern: /==\s*false|false\s*==/, message: 'Unnecessary comparison with false', severity: 'info' as const },
        { pattern: /(\w+)\s*==\s*\1/, message: 'Variable compared to itself', severity: 'warning' as const }
      ],
      security: [
        { pattern: /eval\s*\(/, message: 'Use of eval() is dangerous', severity: 'critical' as const },
        { pattern: /innerHTML\s*=/, message: 'innerHTML can lead to XSS vulnerabilities', severity: 'warning' as const },
        { pattern: /document\.write\s*\(/, message: 'document.write can be dangerous', severity: 'warning' as const },
        { pattern: /setTimeout\s*\(\s*["']/, message: 'setTimeout with string is dangerous', severity: 'warning' as const }
      ],
      performance: [
        { pattern: /for\s*\([^)]*\.length[^)]*\)/, message: 'Cache array length in loop', severity: 'info' as const },
        { pattern: /\+\s*["']|["']\s*\+/, message: 'Use template literals instead of concatenation', severity: 'info' as const },
        { pattern: /new\s+RegExp\s*\(/, message: 'Use regex literal instead of RegExp constructor', severity: 'info' as const }
      ],
      style: [
        { pattern: /\t/, message: 'Use spaces instead of tabs', severity: 'info' as const },
        { pattern: /\s+$/, message: 'Trailing whitespace', severity: 'info' as const },
        { pattern: /var\s+/, message: 'Use let or const instead of var', severity: 'warning' as const },
        { pattern: /function\s*\(/, message: 'Consider using arrow functions', severity: 'info' as const }
      ]
    },
    python: {
      syntax: [
        { pattern: /def\s+\w+\s*\([^)]*\):\s*$/, message: 'Function missing body', severity: 'error' as const },
        { pattern: /if\s+.*:\s*$/, message: 'If statement missing body', severity: 'error' as const },
        { pattern: /class\s+\w+.*:\s*$/, message: 'Class missing body', severity: 'error' as const }
      ],
      logic: [
        { pattern: /if\s+True:/, message: 'Condition is always True', severity: 'warning' as const },
        { pattern: /if\s+False:/, message: 'Condition is always False', severity: 'warning' as const },
        { pattern: /==\s*True|True\s*==/, message: 'Use "is True" instead of "== True"', severity: 'info' as const }
      ],
      security: [
        { pattern: /eval\s*\(/, message: 'Use of eval() is dangerous', severity: 'critical' as const },
        { pattern: /exec\s*\(/, message: 'Use of exec() is dangerous', severity: 'critical' as const },
        { pattern: /input\s*\(/, message: 'input() can be dangerous in Python 2', severity: 'warning' as const }
      ],
      style: [
        { pattern: /\t/, message: 'Use 4 spaces instead of tabs (PEP 8)', severity: 'info' as const },
        { pattern: /\s+$/, message: 'Trailing whitespace', severity: 'info' as const },
        { pattern: /^[a-z]+[A-Z]/, message: 'Use snake_case for variables (PEP 8)', severity: 'info' as const }
      ]
    }
  };

  /**
   * Analiza el código y detecta errores
   */
  static analyzeCode(code: string, language: string): ErrorAnalysisResult {
    const errors: CodeError[] = [];
    const lines = code.split('\n');

    // Detectar errores por categoría
    const syntaxErrors = this.detectSyntaxErrors(code, language, lines);
    const logicErrors = this.detectLogicErrors(code, language, lines);
    const securityErrors = this.detectSecurityIssues(code, language, lines);
    const performanceIssues = this.detectPerformanceIssues(code, language, lines);
    const styleIssues = this.detectStyleIssues(code, language, lines);

    errors.push(...syntaxErrors, ...logicErrors, ...securityErrors, ...performanceIssues, ...styleIssues);

    // Categorizar errores por severidad
    const critical = errors.filter(e => e.severity === 'critical');
    const errorLevel = errors.filter(e => e.severity === 'error');
    const warnings = errors.filter(e => e.severity === 'warning');
    const suggestions = errors.filter(e => e.severity === 'info');

    return {
      errors: errors,
      warnings: warnings,
      suggestions: suggestions,
      totalIssues: errors.length,
      criticalCount: critical.length,
      errorCount: errorLevel.length,
      warningCount: warnings.length,
      infoCount: suggestions.length,
      diff: this.generateDiff(code, errors)
    };
  }

  /**
   * Detecta errores de sintaxis
   */
  private static detectSyntaxErrors(code: string, language: string, lines: string[]): CodeError[] {
    const errors: CodeError[] = [];
    const patterns = this.ERROR_PATTERNS[language as keyof typeof this.ERROR_PATTERNS]?.syntax || [];

    lines.forEach((line, index) => {
      patterns.forEach((pattern, patternIndex) => {
        if (pattern.pattern.test(line)) {
          errors.push({
            id: `syntax-${index}-${patternIndex}`,
            type: 'syntax',
            severity: pattern.severity,
            message: pattern.message,
            description: `Syntax issue detected: ${pattern.message}`,
            lineStart: index + 1,
            lineEnd: index + 1,
            code: line.trim(),
            suggestion: this.generateSuggestion('syntax', line, pattern.message),
            fixable: true,
            rule: `syntax-${patternIndex}`,
            category: 'Syntax'
          });
        }
      });
    });

    return errors;
  }

  /**
   * Detecta errores de lógica
   */
  private static detectLogicErrors(code: string, language: string, lines: string[]): CodeError[] {
    const errors: CodeError[] = [];
    const patterns = this.ERROR_PATTERNS[language as keyof typeof this.ERROR_PATTERNS]?.logic || [];

    lines.forEach((line, index) => {
      patterns.forEach((pattern, patternIndex) => {
        if (pattern.pattern.test(line)) {
          errors.push({
            id: `logic-${index}-${patternIndex}`,
            type: 'logic',
            severity: pattern.severity,
            message: pattern.message,
            description: `Logic issue detected: ${pattern.message}`,
            lineStart: index + 1,
            lineEnd: index + 1,
            code: line.trim(),
            suggestion: this.generateSuggestion('logic', line, pattern.message),
            fixable: true,
            rule: `logic-${patternIndex}`,
            category: 'Logic'
          });
        }
      });
    });

    return errors;
  }

  /**
   * Detecta problemas de seguridad
   */
  private static detectSecurityIssues(code: string, language: string, lines: string[]): CodeError[] {
    const errors: CodeError[] = [];
    const patterns = this.ERROR_PATTERNS[language as keyof typeof this.ERROR_PATTERNS]?.security || [];

    lines.forEach((line, index) => {
      patterns.forEach((pattern, patternIndex) => {
        if (pattern.pattern.test(line)) {
          errors.push({
            id: `security-${index}-${patternIndex}`,
            type: 'security',
            severity: pattern.severity,
            message: pattern.message,
            description: `Security vulnerability detected: ${pattern.message}`,
            lineStart: index + 1,
            lineEnd: index + 1,
            code: line.trim(),
            suggestion: this.generateSuggestion('security', line, pattern.message),
            fixable: false,
            rule: `security-${patternIndex}`,
            category: 'Security'
          });
        }
      });
    });

    return errors;
  }

  /**
   * Detecta problemas de rendimiento
   */
  private static detectPerformanceIssues(code: string, language: string, lines: string[]): CodeError[] {
    const errors: CodeError[] = [];
    const patterns = this.ERROR_PATTERNS[language as keyof typeof this.ERROR_PATTERNS]?.performance || [];

    lines.forEach((line, index) => {
      patterns.forEach((pattern, patternIndex) => {
        if (pattern.pattern.test(line)) {
          errors.push({
            id: `performance-${index}-${patternIndex}`,
            type: 'performance',
            severity: pattern.severity,
            message: pattern.message,
            description: `Performance issue detected: ${pattern.message}`,
            lineStart: index + 1,
            lineEnd: index + 1,
            code: line.trim(),
            suggestion: this.generateSuggestion('performance', line, pattern.message),
            fixable: true,
            rule: `performance-${patternIndex}`,
            category: 'Performance'
          });
        }
      });
    });

    return errors;
  }

  /**
   * Detecta problemas de estilo
   */
  private static detectStyleIssues(code: string, language: string, lines: string[]): CodeError[] {
    const errors: CodeError[] = [];
    const patterns = this.ERROR_PATTERNS[language as keyof typeof this.ERROR_PATTERNS]?.style || [];

    lines.forEach((line, index) => {
      patterns.forEach((pattern, patternIndex) => {
        if (pattern.pattern.test(line)) {
          errors.push({
            id: `style-${index}-${patternIndex}`,
            type: 'style',
            severity: pattern.severity,
            message: pattern.message,
            description: `Style issue detected: ${pattern.message}`,
            lineStart: index + 1,
            lineEnd: index + 1,
            code: line.trim(),
            suggestion: this.generateSuggestion('style', line, pattern.message),
            fixable: true,
            rule: `style-${patternIndex}`,
            category: 'Style'
          });
        }
      });
    });

    return errors;
  }

  /**
   * Genera sugerencias de corrección
   */
  private static generateSuggestion(type: string, line: string, message: string): string {
    const suggestions = {
      'Missing semicolon': line + ';',
      'Use let or const instead of var': line.replace(/var\s+/, 'const '),
      'Use template literals instead of concatenation': 'Use `${variable}` syntax instead',
      'Trailing whitespace': line.trimEnd(),
      'Use spaces instead of tabs': line.replace(/\t/g, '  '),
      'Condition is always true': 'Remove unnecessary condition',
      'Condition is always false': 'Remove unreachable code',
      'Use of eval() is dangerous': 'Consider safer alternatives like JSON.parse()',
      'innerHTML can lead to XSS vulnerabilities': 'Use textContent or sanitize input'
    };

    return suggestions[message as keyof typeof suggestions] || `Fix: ${message}`;
  }

  /**
   * Genera diff visual de cambios
   */
  private static generateDiff(originalCode: string, errors: CodeError[]): DiffChange[] {
    const changes: DiffChange[] = [];
    const lines = originalCode.split('\n');

    errors.forEach(error => {
      if (error.fixable && error.suggestion !== error.code) {
        changes.push({
          type: 'modify',
          lineNumber: error.lineStart,
          oldContent: error.code,
          newContent: error.suggestion,
          context: [
            lines[error.lineStart - 2] || '',
            lines[error.lineStart - 1] || '',
            lines[error.lineStart] || ''
          ]
        });
      }
    });

    return changes;
  }

  /**
   * Categoriza errores por severidad
   */
  static categorizeErrors(errors: CodeError[]): {
    critical: CodeError[];
    errors: CodeError[];
    warnings: CodeError[];
    info: CodeError[];
  } {
    return {
      critical: errors.filter(e => e.severity === 'critical'),
      errors: errors.filter(e => e.severity === 'error'),
      warnings: errors.filter(e => e.severity === 'warning'),
      info: errors.filter(e => e.severity === 'info')
    };
  }

  /**
   * Genera reporte de análisis
   */
  static generateReport(result: ErrorAnalysisResult): string {
    const { totalIssues, criticalCount, errorCount, warningCount, infoCount } = result;

    return `
Code Analysis Report
===================
Total Issues: ${totalIssues}
Critical: ${criticalCount}
Errors: ${errorCount}
Warnings: ${warningCount}
Suggestions: ${infoCount}

${result.errors.map(error =>
  `Line ${error.lineStart}: ${error.severity.toUpperCase()} - ${error.message}`
).join('\n')}
    `.trim();
  }

  /**
   * Valida la sintaxis básica del código
   */
  static validateSyntax(code: string, language: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      switch (language) {
        case 'javascript':
        case 'typescript':
          // Validaciones básicas para JS/TS
          if (code.includes('function') && !code.includes('{')) {
            errors.push('Function declaration missing opening brace');
          }
          break;
        case 'python':
          // Validaciones básicas para Python
          const lines = code.split('\n');
          lines.forEach((line, index) => {
            if (line.trim().endsWith(':') && index === lines.length - 1) {
              errors.push(`Line ${index + 1}: Statement missing body`);
            }
          });
          break;
      }
    } catch (error) {
      errors.push(`Syntax validation error: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default ErrorDetectorAgent;
