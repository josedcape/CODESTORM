import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Code, 
  TrendingUp,
  Zap,
  Eye
} from 'lucide-react';
import { debounce } from 'lodash';

interface RealTimeMetrics {
  linesOfCode: number;
  complexity: number;
  issues: number;
  quality: number;
  language: string;
  confidence: number;
}

interface LiveIssue {
  line: number;
  type: 'error' | 'warning' | 'info';
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface RealTimeAnalyzerProps {
  code: string;
  language: string;
  onMetricsChange?: (metrics: RealTimeMetrics) => void;
  onIssuesChange?: (issues: LiveIssue[]) => void;
  isEnabled: boolean;
}

const RealTimeAnalyzer: React.FC<RealTimeAnalyzerProps> = ({
  code,
  language,
  onMetricsChange,
  onIssuesChange,
  isEnabled
}) => {
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    linesOfCode: 0,
    complexity: 0,
    issues: 0,
    quality: 100,
    language: language,
    confidence: 0
  });

  const [issues, setIssues] = useState<LiveIssue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<number>(0);

  // Análisis en tiempo real con debounce
  const analyzeCode = useCallback(
    debounce(async (codeToAnalyze: string) => {
      if (!isEnabled || !codeToAnalyze.trim()) {
        setMetrics(prev => ({ ...prev, linesOfCode: 0, complexity: 0, issues: 0, quality: 100 }));
        setIssues([]);
        return;
      }

      setIsAnalyzing(true);
      
      try {
        // Simular análisis en tiempo real
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const lines = codeToAnalyze.split('\n').filter(line => line.trim());
        const newMetrics = calculateMetrics(codeToAnalyze, language);
        const newIssues = detectLiveIssues(codeToAnalyze, language);
        
        setMetrics(newMetrics);
        setIssues(newIssues);
        setLastAnalysis(Date.now());
        
        onMetricsChange?.(newMetrics);
        onIssuesChange?.(newIssues);
        
      } catch (error) {
        console.error('Error in real-time analysis:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 500),
    [language, isEnabled, onMetricsChange, onIssuesChange]
  );

  useEffect(() => {
    analyzeCode(code);
  }, [code, analyzeCode]);

  const calculateMetrics = (code: string, lang: string): RealTimeMetrics => {
    const lines = code.split('\n').filter(line => line.trim());
    const linesOfCode = lines.length;
    
    // Calcular complejidad básica
    const complexityIndicators = [
      /\b(if|else|while|for|switch|case|try|catch)\b/g,
      /\b(function|def|class)\b/g,
      /[{}]/g
    ];
    
    const complexity = complexityIndicators.reduce((total, pattern) => {
      const matches = code.match(pattern);
      return total + (matches ? matches.length : 0);
    }, 0);

    // Detectar lenguaje con confianza
    const languagePatterns = {
      javascript: [/\b(function|const|let|var|=>)\b/g, /console\.log/g],
      python: [/\b(def|class|import|print)\b/g, /^\s*#/gm],
      java: [/\b(public|private|class|interface)\b/g, /System\.out/g],
      cpp: [/\b(#include|using namespace|std::)\b/g, /cout|cin/g]
    };

    let detectedLang = lang;
    let confidence = 50;
    
    if (languagePatterns[lang as keyof typeof languagePatterns]) {
      const patterns = languagePatterns[lang as keyof typeof languagePatterns];
      const matches = patterns.reduce((total, pattern) => {
        const found = code.match(pattern);
        return total + (found ? found.length : 0);
      }, 0);
      confidence = Math.min(95, 50 + matches * 10);
    }

    // Calcular calidad básica
    const qualityFactors = {
      hasComments: /\/\/|\/\*|\#/.test(code) ? 10 : 0,
      hasProperIndentation: /^\s{2,4}/.test(code) ? 10 : 0,
      noLongLines: lines.every(line => line.length <= 120) ? 10 : 0,
      hasVariableDeclarations: /\b(const|let|var)\b/.test(code) ? 10 : 0
    };

    const quality = Math.max(0, 100 - complexity * 2 + Object.values(qualityFactors).reduce((a, b) => a + b, 0));

    return {
      linesOfCode,
      complexity,
      issues: detectLiveIssues(code, lang).length,
      quality: Math.min(100, quality),
      language: detectedLang,
      confidence
    };
  };

  const detectLiveIssues = (code: string, lang: string): LiveIssue[] => {
    const issues: LiveIssue[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      // Detectar problemas comunes
      if (line.includes('console.log') && lang === 'javascript') {
        issues.push({
          line: index + 1,
          type: 'warning',
          message: 'console.log statement found',
          severity: 'low'
        });
      }

      if (line.trim().endsWith(';') === false && line.includes('=') && lang === 'javascript') {
        issues.push({
          line: index + 1,
          type: 'warning',
          message: 'Missing semicolon',
          severity: 'medium'
        });
      }

      if (line.includes('eval(')) {
        issues.push({
          line: index + 1,
          type: 'error',
          message: 'Use of eval() is dangerous',
          severity: 'critical'
        });
      }

      if (line.length > 120) {
        issues.push({
          line: index + 1,
          type: 'info',
          message: 'Line too long (>120 characters)',
          severity: 'low'
        });
      }

      if (/\t/.test(line)) {
        issues.push({
          line: index + 1,
          type: 'info',
          message: 'Use spaces instead of tabs',
          severity: 'low'
        });
      }
    });

    return issues;
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return 'text-green-400';
    if (quality >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-blue-400" />;
    }
  };

  if (!isEnabled) {
    return (
      <div className="bg-codestorm-dark rounded-lg border border-codestorm-blue/30 p-4">
        <div className="text-center text-gray-400">
          <Eye className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Análisis en tiempo real deshabilitado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-codestorm-dark rounded-lg border border-codestorm-blue/30">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-codestorm-blue/30">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Activity className="w-5 h-5 mr-2 text-codestorm-accent" />
          Análisis en Tiempo Real
        </h3>
        <div className="flex items-center space-x-2">
          {isAnalyzing && (
            <div className="flex items-center text-sm text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-2" />
              Analizando...
            </div>
          )}
          <span className="text-xs text-gray-400">
            {lastAnalysis > 0 && `Actualizado hace ${Math.round((Date.now() - lastAnalysis) / 1000)}s`}
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-codestorm-darker rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <Code className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Líneas</span>
            </div>
            <p className="text-lg font-semibold text-white">{metrics.linesOfCode}</p>
          </div>

          <div className="bg-codestorm-darker rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-400">Complejidad</span>
            </div>
            <p className="text-lg font-semibold text-white">{metrics.complexity}</p>
          </div>

          <div className="bg-codestorm-darker rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-gray-400">Problemas</span>
            </div>
            <p className="text-lg font-semibold text-white">{metrics.issues}</p>
          </div>

          <div className="bg-codestorm-darker rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Calidad</span>
            </div>
            <p className={`text-lg font-semibold ${getQualityColor(metrics.quality)}`}>
              {Math.round(metrics.quality)}%
            </p>
          </div>
        </div>

        {/* Language Detection */}
        <div className="bg-codestorm-darker rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Lenguaje detectado:</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-white capitalize">{metrics.language}</span>
              <span className="text-xs text-gray-400">({metrics.confidence}% confianza)</span>
            </div>
          </div>
        </div>

        {/* Live Issues */}
        {issues.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-white mb-2">Problemas Detectados:</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {issues.slice(0, 5).map((issue, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm p-2 bg-codestorm-darker rounded">
                  {getIssueIcon(issue.type)}
                  <span className="text-gray-400">Línea {issue.line}:</span>
                  <span className="text-gray-300">{issue.message}</span>
                </div>
              ))}
              {issues.length > 5 && (
                <p className="text-xs text-gray-400 text-center">
                  +{issues.length - 5} problemas más...
                </p>
              )}
            </div>
          </div>
        )}

        {/* No Issues */}
        {issues.length === 0 && code.trim() && (
          <div className="text-center text-green-400 py-4">
            <CheckCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No se detectaron problemas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeAnalyzer;
