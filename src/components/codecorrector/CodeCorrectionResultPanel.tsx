import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CodeError, CodeCorrectionResult } from '../../types';
import { diffLines, Change } from 'diff';
import {
  Copy,
  Download,
  Check,
  ArrowLeftRight,
  Eye,
  Save,
  BarChart2,
  AlertCircle,
  AlertTriangle,
  Info,
  Zap,
  X,
  Code,
  FileText,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import FileSaver from 'file-saver';

interface CodeCorrectionResultPanelProps {
  result: CodeCorrectionResult;
  onApplyChanges: (correctedCode: string) => void;
  onClose?: () => void;
  isVisible: boolean;
}

const CodeCorrectionResultPanel: React.FC<CodeCorrectionResultPanelProps> = ({
  result,
  onApplyChanges,
  onClose,
  isVisible
}) => {
  const [showDiff, setShowDiff] = useState<boolean>(true);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [diffChanges, setDiffChanges] = useState<Change[]>([]);
  const [isAnimating, setIsAnimating] = useState<boolean>(true);

  // Calcular las diferencias entre el código original y el corregido
  useEffect(() => {
    if (result) {
      const changes = diffLines(result.originalCode, result.correctedCode);
      setDiffChanges(changes);
      
      // Iniciar animación de entrada
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [result]);

  // Función para copiar el código corregido al portapapeles
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result.correctedCode);
      setCopyStatus('success');
      setStatusMessage('¡Código copiado al portapapeles!');
      
      setTimeout(() => {
        setCopyStatus('idle');
        setStatusMessage(null);
      }, 2000);
    } catch (error) {
      setCopyStatus('error');
      setStatusMessage('Error al copiar el código');
      
      setTimeout(() => {
        setCopyStatus('idle');
        setStatusMessage(null);
      }, 2000);
    }
  };

  // Función para descargar el código corregido como archivo
  const downloadCode = () => {
    try {
      const blob = new Blob([result.correctedCode], { type: 'text/plain;charset=utf-8' });
      const fileExtension = getFileExtensionFromLanguage(result.language);
      FileSaver.saveAs(blob, `corrected_code${fileExtension}`);
      
      setStatusMessage('Código descargado correctamente');
      setTimeout(() => setStatusMessage(null), 2000);
    } catch (error) {
      setStatusMessage('Error al descargar el código');
      setTimeout(() => setStatusMessage(null), 2000);
    }
  };

  // Función para aplicar los cambios
  const handleApplyChanges = () => {
    onApplyChanges(result.correctedCode);
    setStatusMessage('Cambios aplicados correctamente');
    setTimeout(() => setStatusMessage(null), 2000);
  };

  // Función para obtener la extensión de archivo según el lenguaje
  const getFileExtensionFromLanguage = (language: string): string => {
    const extensionMap: Record<string, string> = {
      javascript: '.js',
      typescript: '.ts',
      python: '.py',
      java: '.java',
      csharp: '.cs',
      cpp: '.cpp',
      php: '.php',
      ruby: '.rb',
      go: '.go',
      rust: '.rs',
      html: '.html',
      css: '.css',
      json: '.json',
      xml: '.xml',
      yaml: '.yaml',
      markdown: '.md',
      sql: '.sql'
    };
    
    return extensionMap[language.toLowerCase()] || '.txt';
  };

  // Función para renderizar el icono según el tipo de error
  const renderErrorTypeIcon = (type: string) => {
    switch (type) {
      case 'syntax':
        return <Code className="h-4 w-4 text-red-400" />;
      case 'logic':
        return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      case 'security':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'performance':
        return <Zap className="h-4 w-4 text-yellow-400" />;
      case 'style':
        return <FileText className="h-4 w-4 text-blue-400" />;
      case 'bestPractice':
        return <Info className="h-4 w-4 text-purple-400" />;
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  // Función para renderizar el icono según la severidad del error
  const renderSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-gray-400" />;
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  // Si no hay resultado o no es visible, no mostrar nada
  if (!result || !isVisible) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
        isAnimating ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div 
        className={`bg-codestorm-dark rounded-lg shadow-xl border border-codestorm-blue/30 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden transition-transform duration-500 ${
          isAnimating ? 'scale-95' : 'scale-100'
        }`}
      >
        {/* Encabezado */}
        <div className="bg-codestorm-blue/20 p-4 border-b border-codestorm-blue/30 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500 animate-pulse-subtle" />
            Corrección Completada
            <span className="ml-3 text-sm font-normal text-gray-400 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {(result.executionTime / 1000).toFixed(2)}s
            </span>
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDiff(!showDiff)}
              className="p-2 rounded-md bg-codestorm-blue/20 hover:bg-codestorm-blue/30 text-white flex items-center transition-colors"
              title={showDiff ? "Ver código final" : "Ver diferencias"}
            >
              {showDiff ? (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  <span className="text-sm">Ver código final</span>
                </>
              ) : (
                <>
                  <ArrowLeftRight className="h-4 w-4 mr-1" />
                  <span className="text-sm">Ver diferencias</span>
                </>
              )}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                title="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Panel principal de código */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto relative">
              {showDiff ? (
                // Vista de diferencias
                <div className="p-4">
                  <div className="bg-codestorm-darker rounded-md overflow-hidden">
                    {diffChanges.map((part, index) => (
                      <div 
                        key={index} 
                        className={`font-mono text-sm ${
                          part.added 
                            ? 'bg-green-900/30 border-l-4 border-green-500' 
                            : part.removed 
                              ? 'bg-red-900/30 border-l-4 border-red-500 line-through opacity-70' 
                              : 'border-l-4 border-transparent'
                        }`}
                      >
                        <SyntaxHighlighter
                          language={result.language}
                          style={vscDarkPlus}
                          customStyle={{
                            margin: 0,
                            padding: '0.5rem 1rem',
                            background: 'transparent',
                            fontSize: '0.875rem'
                          }}
                          showLineNumbers={false}
                          wrapLines={true}
                          lineProps={() => ({
                            style: {
                              display: 'block',
                              width: '100%'
                            }
                          })}
                        >
                          {part.value}
                        </SyntaxHighlighter>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Vista de código final
                <div className="p-4">
                  <SyntaxHighlighter
                    language={result.language}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      background: '#0a1120',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    showLineNumbers
                  >
                    {result.correctedCode}
                  </SyntaxHighlighter>
                </div>
              )}
            </div>
            
            {/* Barra de acciones */}
            <div className="p-4 border-t border-codestorm-blue/30 bg-codestorm-darker flex flex-wrap gap-2">
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-codestorm-blue/20 hover:bg-codestorm-blue/30 text-white rounded-md flex items-center transition-colors"
              >
                <Copy className="h-4 w-4 mr-2" />
                <span>Copiar código</span>
              </button>
              <button
                onClick={downloadCode}
                className="px-4 py-2 bg-codestorm-blue/20 hover:bg-codestorm-blue/30 text-white rounded-md flex items-center transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                <span>Descargar</span>
              </button>
              <button
                onClick={handleApplyChanges}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center transition-colors ml-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                <span>Aplicar cambios</span>
              </button>
            </div>
          </div>
          
          {/* Panel lateral de estadísticas */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-codestorm-blue/30 bg-codestorm-darker overflow-auto">
            <div className="p-4">
              <h3 className="text-white font-medium mb-4 flex items-center">
                <BarChart2 className="h-5 w-5 mr-2 text-codestorm-accent" />
                Resumen de Correcciones
              </h3>
              
              {/* Estadísticas generales */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-codestorm-blue/10 rounded-md p-3 border border-codestorm-blue/20">
                  <div className="text-2xl font-bold text-white">{result.summary.totalErrors}</div>
                  <div className="text-xs text-gray-400">Errores Encontrados</div>
                </div>
                <div className="bg-codestorm-blue/10 rounded-md p-3 border border-codestorm-blue/20">
                  <div className="text-2xl font-bold text-green-400">{result.summary.fixedErrors}</div>
                  <div className="text-xs text-gray-400">Errores Corregidos</div>
                </div>
              </div>
              
              {/* Errores por tipo */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-white mb-2">Errores por Tipo</h4>
                <div className="space-y-2">
                  {Object.entries(result.summary.errorsByType).map(([type, count]) => (
                    count > 0 && (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center">
                          {renderErrorTypeIcon(type)}
                          <span className="ml-2 text-sm text-gray-300">
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </span>
                        </div>
                        <span className="text-sm text-white font-medium">{count}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
              
              {/* Errores por severidad */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-white mb-2">Errores por Severidad</h4>
                <div className="space-y-2">
                  {Object.entries(result.summary.errorsBySeverity).map(([severity, count]) => (
                    count > 0 && (
                      <div key={severity} className="flex items-center justify-between">
                        <div className="flex items-center">
                          {renderSeverityIcon(severity)}
                          <span className="ml-2 text-sm text-gray-300">
                            {severity.charAt(0).toUpperCase() + severity.slice(1)}
                          </span>
                        </div>
                        <span className="text-sm text-white font-medium">{count}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
              
              {/* Leyenda de colores */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-white mb-2">Leyenda</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-900/30 border-l-2 border-green-500 mr-2"></div>
                    <span className="text-gray-300">Código añadido</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-900/30 border-l-2 border-red-500 mr-2"></div>
                    <span className="text-gray-300">Código eliminado</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-transparent border-l-2 border-transparent mr-2"></div>
                    <span className="text-gray-300">Código sin cambios</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mensaje de estado */}
        {statusMessage && (
          <div 
            className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-md text-white text-sm ${
              copyStatus === 'success' ? 'bg-green-600' : 
              copyStatus === 'error' ? 'bg-red-600' : 
              'bg-blue-600'
            } shadow-glow-blue animate-pulse-subtle`}
          >
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeCorrectionResultPanel;
