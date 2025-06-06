/**
 * Agente 1 - Analizador de Código
 * Observa y analiza el código ingresado en tiempo real
 */

export interface CodeStructure {
  functions: FunctionInfo[];
  classes: ClassInfo[];
  variables: VariableInfo[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  complexity: ComplexityMetrics;
}

export interface FunctionInfo {
  name: string;
  lineStart: number;
  lineEnd: number;
  parameters: string[];
  returnType?: string;
  isAsync: boolean;
  complexity: number;
}

export interface ClassInfo {
  name: string;
  lineStart: number;
  lineEnd: number;
  methods: FunctionInfo[];
  properties: VariableInfo[];
  extends?: string;
  implements?: string[];
}

export interface VariableInfo {
  name: string;
  type?: string;
  line: number;
  scope: 'global' | 'function' | 'class' | 'block';
  isConstant: boolean;
}

export interface ImportInfo {
  module: string;
  imports: string[];
  line: number;
  isDefault: boolean;
}

export interface ExportInfo {
  name: string;
  line: number;
  isDefault: boolean;
}

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  maintainabilityIndex: number;
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  features: string[];
}

class CodeAnalyzerAgent {
  private static readonly LANGUAGE_PATTERNS = {
    javascript: [
      /\b(function|const|let|var|=>|async|await)\b/g,
      /\b(console\.log|document\.|window\.)\b/g,
      /\b(require|import|export)\b/g
    ],
    typescript: [
      /\b(interface|type|enum|namespace)\b/g,
      /:\s*(string|number|boolean|any|void)\b/g,
      /\b(public|private|protected|readonly)\b/g
    ],
    python: [
      /\b(def|class|import|from|if __name__|print)\b/g,
      /\b(self|cls)\b/g,
      /^\s*#.*$/gm
    ],
    java: [
      /\b(public|private|protected|static|final|class|interface)\b/g,
      /\b(System\.out\.println|String|int|boolean)\b/g,
      /\bimport\s+[\w.]+;/g
    ],
    cpp: [
      /\b(#include|using namespace|std::)\b/g,
      /\b(int|char|float|double|void|bool)\b/g,
      /\b(cout|cin|endl)\b/g
    ],
    csharp: [
      /\b(using|namespace|public|private|static|class|interface)\b/g,
      /\b(Console\.WriteLine|string|int|bool)\b/g,
      /\[.*\]/g
    ]
  };

  /**
   * Detecta automáticamente el lenguaje de programación
   */
  static detectLanguage(code: string): LanguageDetectionResult {
    const scores: { [key: string]: number } = {};
    const features: { [key: string]: string[] } = {};

    for (const [language, patterns] of Object.entries(this.LANGUAGE_PATTERNS)) {
      scores[language] = 0;
      features[language] = [];

      for (const pattern of patterns) {
        const matches = code.match(pattern);
        if (matches) {
          scores[language] += matches.length;
          features[language].push(`${matches.length} ${pattern.source} matches`);
        }
      }
    }

    // Encontrar el lenguaje con mayor puntuación
    const bestMatch = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] > scores[b[0]] ? a : b
    );

    const totalMatches = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const confidence = totalMatches > 0 ? (scores[bestMatch[0]] / totalMatches) * 100 : 0;

    return {
      language: bestMatch[0],
      confidence: Math.min(confidence, 95), // Cap at 95% to show uncertainty
      features: features[bestMatch[0]]
    };
  }

  /**
   * Analiza la estructura del código
   */
  static analyzeStructure(code: string, language: string): CodeStructure {
    const lines = code.split('\n');
    
    return {
      functions: this.extractFunctions(code, language),
      classes: this.extractClasses(code, language),
      variables: this.extractVariables(code, language),
      imports: this.extractImports(code, language),
      exports: this.extractExports(code, language),
      complexity: this.calculateComplexity(code, language)
    };
  }

  /**
   * Extrae información de funciones
   */
  private static extractFunctions(code: string, language: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const lines = code.split('\n');

    const patterns = {
      javascript: /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*:\s*(?:async\s+)?\()/g,
      typescript: /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(|(\w+)\s*:\s*(?:async\s+)?\()/g,
      python: /def\s+(\w+)\s*\(/g,
      java: /(?:public|private|protected)?\s*(?:static\s+)?(?:\w+\s+)?(\w+)\s*\(/g,
      cpp: /(?:\w+\s+)?(\w+)\s*\([^)]*\)\s*{/g,
      csharp: /(?:public|private|protected)?\s*(?:static\s+)?(?:\w+\s+)?(\w+)\s*\(/g
    };

    const pattern = patterns[language as keyof typeof patterns];
    if (!pattern) return functions;

    lines.forEach((line, index) => {
      const matches = line.match(pattern);
      if (matches) {
        const functionName = matches[1] || matches[2] || matches[3];
        if (functionName) {
          functions.push({
            name: functionName,
            lineStart: index + 1,
            lineEnd: this.findFunctionEnd(lines, index, language),
            parameters: this.extractParameters(line),
            isAsync: line.includes('async'),
            complexity: this.calculateFunctionComplexity(lines, index)
          });
        }
      }
    });

    return functions;
  }

  /**
   * Extrae información de clases
   */
  private static extractClasses(code: string, language: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    const lines = code.split('\n');

    const patterns = {
      javascript: /class\s+(\w+)(?:\s+extends\s+(\w+))?/g,
      typescript: /class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?/g,
      python: /class\s+(\w+)(?:\(([^)]+)\))?:/g,
      java: /(?:public\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?/g,
      cpp: /class\s+(\w+)(?:\s*:\s*(?:public|private|protected)\s+(\w+))?/g,
      csharp: /(?:public\s+)?class\s+(\w+)(?:\s*:\s*(\w+))?/g
    };

    const pattern = patterns[language as keyof typeof patterns];
    if (!pattern) return classes;

    lines.forEach((line, index) => {
      const matches = line.match(pattern);
      if (matches) {
        const className = matches[1];
        if (className) {
          classes.push({
            name: className,
            lineStart: index + 1,
            lineEnd: this.findClassEnd(lines, index, language),
            methods: [],
            properties: [],
            extends: matches[2],
            implements: matches[3] ? matches[3].split(',').map(s => s.trim()) : undefined
          });
        }
      }
    });

    return classes;
  }

  /**
   * Extrae información de variables
   */
  private static extractVariables(code: string, language: string): VariableInfo[] {
    const variables: VariableInfo[] = [];
    const lines = code.split('\n');

    const patterns = {
      javascript: /(?:const|let|var)\s+(\w+)/g,
      typescript: /(?:const|let|var)\s+(\w+)(?:\s*:\s*(\w+))?/g,
      python: /(\w+)\s*=/g,
      java: /(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+)?(\w+)\s+(\w+)/g,
      cpp: /(?:int|char|float|double|bool|string)\s+(\w+)/g,
      csharp: /(?:public|private|protected)?\s*(?:static\s+)?(?:readonly\s+)?(\w+)\s+(\w+)/g
    };

    const pattern = patterns[language as keyof typeof patterns];
    if (!pattern) return variables;

    lines.forEach((line, index) => {
      const matches = [...line.matchAll(pattern)];
      matches.forEach(match => {
        const varName = match[1] || match[2];
        if (varName) {
          variables.push({
            name: varName,
            type: match[2] || match[1],
            line: index + 1,
            scope: this.determineScope(lines, index),
            isConstant: line.includes('const') || line.includes('final') || line.includes('readonly')
          });
        }
      });
    });

    return variables;
  }

  /**
   * Extrae información de imports
   */
  private static extractImports(code: string, language: string): ImportInfo[] {
    const imports: ImportInfo[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      if (line.trim().startsWith('import') || line.trim().startsWith('from')) {
        const importMatch = line.match(/import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/);
        if (importMatch) {
          imports.push({
            module: importMatch[3],
            imports: importMatch[1] ? importMatch[1].split(',').map(s => s.trim()) : [importMatch[2]],
            line: index + 1,
            isDefault: !!importMatch[2]
          });
        }
      }
    });

    return imports;
  }

  /**
   * Extrae información de exports
   */
  private static extractExports(code: string, language: string): ExportInfo[] {
    const exports: ExportInfo[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      if (line.trim().startsWith('export')) {
        const exportMatch = line.match(/export\s+(?:default\s+)?(?:function\s+|class\s+|const\s+|let\s+|var\s+)?(\w+)/);
        if (exportMatch) {
          exports.push({
            name: exportMatch[1],
            line: index + 1,
            isDefault: line.includes('default')
          });
        }
      }
    });

    return exports;
  }

  /**
   * Calcula métricas de complejidad
   */
  private static calculateComplexity(code: string, language: string): ComplexityMetrics {
    const lines = code.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    
    // Complejidad ciclomática básica
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(code);
    
    // Complejidad cognitiva
    const cognitiveComplexity = this.calculateCognitiveComplexity(code);
    
    // Índice de mantenibilidad
    const maintainabilityIndex = this.calculateMaintainabilityIndex(
      nonEmptyLines.length,
      cyclomaticComplexity,
      cognitiveComplexity
    );

    return {
      cyclomaticComplexity,
      cognitiveComplexity,
      linesOfCode: nonEmptyLines.length,
      maintainabilityIndex
    };
  }

  // Métodos auxiliares privados
  private static findFunctionEnd(lines: string[], startIndex: number, language: string): number {
    let braceCount = 0;
    let inFunction = false;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('{')) {
        braceCount += (line.match(/{/g) || []).length;
        inFunction = true;
      }
      
      if (line.includes('}')) {
        braceCount -= (line.match(/}/g) || []).length;
        if (inFunction && braceCount === 0) {
          return i + 1;
        }
      }
    }

    return startIndex + 1;
  }

  private static findClassEnd(lines: string[], startIndex: number, language: string): number {
    return this.findFunctionEnd(lines, startIndex, language);
  }

  private static extractParameters(line: string): string[] {
    const paramMatch = line.match(/\(([^)]*)\)/);
    if (!paramMatch || !paramMatch[1]) return [];
    
    return paramMatch[1]
      .split(',')
      .map(param => param.trim())
      .filter(param => param.length > 0);
  }

  private static calculateFunctionComplexity(lines: string[], startIndex: number): number {
    let complexity = 1; // Base complexity
    const functionEnd = this.findFunctionEnd(lines, startIndex, 'javascript');
    
    for (let i = startIndex; i < functionEnd; i++) {
      const line = lines[i];
      // Count decision points
      if (line.match(/\b(if|else|while|for|switch|case|catch|&&|\|\|)\b/)) {
        complexity++;
      }
    }
    
    return complexity;
  }

  private static determineScope(lines: string[], lineIndex: number): 'global' | 'function' | 'class' | 'block' {
    // Simplified scope detection
    for (let i = lineIndex; i >= 0; i--) {
      const line = lines[i];
      if (line.includes('function') || line.includes('def')) return 'function';
      if (line.includes('class')) return 'class';
      if (line.includes('{')) return 'block';
    }
    return 'global';
  }

  private static calculateCyclomaticComplexity(code: string): number {
    const decisionPoints = code.match(/\b(if|else|while|for|switch|case|catch|&&|\|\|)\b/g);
    return (decisionPoints?.length || 0) + 1;
  }

  private static calculateCognitiveComplexity(code: string): number {
    // Simplified cognitive complexity calculation
    const complexPatterns = code.match(/\b(if|else|while|for|switch|case|catch|try|&&|\|\|)\b/g);
    return complexPatterns?.length || 0;
  }

  private static calculateMaintainabilityIndex(loc: number, cyclomatic: number, cognitive: number): number {
    // Simplified maintainability index (0-100 scale)
    const baseScore = 100;
    const locPenalty = Math.min(loc * 0.1, 30);
    const complexityPenalty = Math.min((cyclomatic + cognitive) * 2, 40);
    
    return Math.max(0, baseScore - locPenalty - complexityPenalty);
  }
}

export default CodeAnalyzerAgent;
