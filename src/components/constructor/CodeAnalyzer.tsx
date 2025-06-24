import React, { useState } from 'react';
import { CodeIssue, CodeAnalysisResult, FileItem } from '../../types';
import { AlertTriangle, AlertCircle, Info, Check, X, ChevronDown, ChevronUp, Code, Zap } from 'lucide-react';
import { CodeAnalysisService } from '../../services/codeAnalysis';

interface CodeAnalyzerProps {
  file: FileItem;
  onApplyFix: (fileId: string, updatedContent: string) => void;
  onClose: () => void;
}

const CodeAnalyzer: React.FC<CodeAnalyzerProps> = ({ file, onApplyFix, onClose }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CodeAnalysisResult | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<string[]>([]);
  const [isApplyingFix, setIsApplyingFix] = useState<string | null>(null);
  
  // Función para analizar el código
  const analyzeCode = async () => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    
    try {
      const result = await CodeAnalysisService.analyzeFile(file);
      setAnalysisResult(result);
      
      // Expandir automáticamente los problemas críticos
      const criticalIssueIds = result.issues
        .filter(issue => issue.level === 'critical')
        .map(issue => issue.id);
      
      setExpandedIssues(criticalIssueIds);
    } catch (error) {
      console.error('Error al analizar el código:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Función para alternar la expansión de un problema
  const toggleIssueExpansion = (issueId: string) => {
    setExpandedIssues(prev => 
      prev.includes(issueId)
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };
  
  // Función para aplicar una corrección automática
  const applyAutoFix = async (issue: CodeIssue) => {
    if (isApplyingFix) return;
    
    setIsApplyingFix(issue.id);
    
    try {
      const fixedCode = await CodeAnalysisService.applyAutoFix(file, issue);
      onApplyFix(file.id, fixedCode);
      
      // Marcar el problema como ignorado (resuelto)
      if (analysisResult) {
        const updatedIssues = analysisResult.issues.map(i => 
          i.id === issue.id
            ? { ...i, isIgnored: true, ignoreReason: 'Corrección aplicada automáticamente' }
            : i
        );
        
        setAnalysisResult({
          ...analysisResult,
          issues: updatedIssues,
          summary: {
            critical: updatedIssues.filter(i => i.level === 'critical' && !i.isIgnored).length,
            warning: updatedIssues.filter(i => i.level === 'warning' && !i.isIgnored).length,
            suggestion: updatedIssues.filter(i => i.level === 'suggestion' && !i.isIgnored).length
          }
        });
      }
    } catch (error) {
      console.error('Error al aplicar la corrección automática:', error);
    } finally {
      setIsApplyingFix(null);
    }
  };
  
  // Función para ignorar un problema
  const ignoreIssue = (issue: CodeIssue, reason: string) => {
    if (!analysisResult) return;
    
    const updatedIssues = analysisResult.issues.map(i => 
      i.id === issue.id
        ? { ...i, isIgnored: true, ignoreReason: reason }
        : i
    );
    
    setAnalysisResult({
      ...analysisResult,
      issues: updatedIssues,
      summary: {
        critical: updatedIssues.filter(i => i.level === 'critical' && !i.isIgnored).length,
        warning: updatedIssues.filter(i => i.level === 'warning' && !i.isIgnored).length,
        suggestion: updatedIssues.filter(i => i.level === 'suggestion' && !i.isIgnored).length
      }
    });
  };
  
  // Renderizar el icono según el nivel del problema
  const renderIssueIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'suggestion':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md border border-codestorm-blue/30 flex flex-col h-full">
      <div className="flex items-center justify-between bg-codestorm-blue/20 p-3 border-b border-codestorm-blue/30">
        <div className="flex items-center">
          <Code className="h-5 w-5 text-codestorm-gold mr-2" />
          <h2 className="text-sm font-medium text-white">Analizador de Código</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={analyzeCode}
            disabled={isAnalyzing}
            className={`p-1.5 rounded-md ${
              isAnalyzing
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-codestorm-blue/30 hover:bg-codestorm-blue/50 text-white'
            }`}
            title="Analizar código"
          >
            {isAnalyzing ? (
              <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-codestorm-blue/30 text-gray-400 hover:text-white"
            title="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {!analysisResult && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Code className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-center">
              Haz clic en el botón de análisis para detectar problemas en el código
            </p>
          </div>
        )}
        
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="h-10 w-10 border-4 border-codestorm-blue border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white">Analizando código...</p>
          </div>
        )}
        
        {analysisResult && !isAnalyzing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-codestorm-blue/10 p-3 rounded-md">
              <h3 className="text-white font-medium">Resultados del análisis</h3>
              <div className="flex space-x-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                  <span className="text-sm text-white">{analysisResult.summary.critical}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
                  <span className="text-sm text-white">{analysisResult.summary.warning}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                  <span className="text-sm text-white">{analysisResult.summary.suggestion}</span>
                </div>
              </div>
            </div>
            
            {analysisResult.issues.length === 0 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-md p-4 text-center">
                <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-400">¡No se encontraron problemas en el código!</p>
              </div>
            )}
            
            <div className="space-y-2">
              {analysisResult.issues
                .filter(issue => !issue.isIgnored)
                .map(issue => (
                  <div 
                    key={issue.id}
                    className={`border rounded-md overflow-hidden ${
                      issue.level === 'critical' ? 'border-red-500/30 bg-red-500/5' :
                      issue.level === 'warning' ? 'border-yellow-500/30 bg-yellow-500/5' :
                      'border-blue-500/30 bg-blue-500/5'
                    }`}
                  >
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer"
                      onClick={() => toggleIssueExpansion(issue.id)}
                    >
                      <div className="flex items-center">
                        {renderIssueIcon(issue.level)}
                        <span className="ml-2 text-white">{issue.message}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">
                          Línea {issue.lineStart}{issue.lineStart !== issue.lineEnd ? `-${issue.lineEnd}` : ''}
                        </span>
                        {expandedIssues.includes(issue.id) ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    {expandedIssues.includes(issue.id) && (
                      <div className="p-3 border-t border-gray-700">
                        <p className="text-sm text-gray-300 mb-3">{issue.description}</p>
                        
                        <div className="bg-codestorm-darker rounded-md p-3 mb-3">
                          <h4 className="text-xs text-gray-400 mb-1">Sugerencia:</h4>
                          <p className="text-sm text-white font-mono whitespace-pre-wrap">{issue.suggestion}</p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => applyAutoFix(issue)}
                            disabled={!!isApplyingFix}
                            className={`px-3 py-1.5 rounded-md text-sm ${
                              isApplyingFix === issue.id
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            {isApplyingFix === issue.id ? 'Aplicando...' : 'Aplicar corrección'}
                          </button>
                          <button
                            onClick={() => ignoreIssue(issue, 'Ignorado manualmente por el usuario')}
                            className="px-3 py-1.5 rounded-md bg-gray-600 hover:bg-gray-700 text-white text-sm"
                          >
                            Ignorar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
            
            {analysisResult.issues.some(issue => issue.isIgnored) && (
              <div className="mt-4">
                <h3 className="text-sm text-gray-400 mb-2">Problemas ignorados:</h3>
                <div className="space-y-1">
                  {analysisResult.issues
                    .filter(issue => issue.isIgnored)
                    .map(issue => (
                      <div 
                        key={`ignored-${issue.id}`}
                        className="flex items-center justify-between p-2 bg-gray-800/30 rounded-md"
                      >
                        <div className="flex items-center">
                          {renderIssueIcon(issue.level)}
                          <span className="ml-2 text-gray-400 text-sm">{issue.message}</span>
                        </div>
                        <span className="text-xs text-gray-500">{issue.ignoreReason}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeAnalyzer;
