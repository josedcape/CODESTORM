import React, { useState, useEffect } from 'react';
import { Search, FileText, AlertTriangle, CheckCircle, TrendingUp, Database, Code, GitBranch } from 'lucide-react';
import { FileItem } from '../../types';

interface AnalysisResult {
  id: string;
  type: 'quality' | 'performance' | 'security' | 'maintainability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  file: string;
  line?: number;
  suggestion: string;
  impact: number;
}

interface CodebaseAnalyzerProps {
  projectFiles: FileItem[];
  onAnalysisComplete?: (results: AnalysisResult[]) => void;
}

const CodebaseAnalyzer: React.FC<CodebaseAnalyzerProps> = ({ projectFiles, onAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (projectFiles.length > 0) {
      performAnalysis();
    }
  }, [projectFiles]);

  const performAnalysis = () => {
    setIsAnalyzing(true);
    
    // Simulación de análisis de código
    setTimeout(() => {
      const mockResults: AnalysisResult[] = [
        {
          id: 'analysis-1',
          type: 'performance',
          severity: 'medium',
          title: 'Optimización de Re-renders',
          description: 'El componente Home se re-renderiza innecesariamente',
          file: '/src/pages/Home.tsx',
          line: 8,
          suggestion: 'Usar useCallback para la función handleIncrement',
          impact: 0.7
        },
        {
          id: 'analysis-2',
          type: 'quality',
          severity: 'low',
          title: 'Falta PropTypes',
          description: 'Los componentes no tienen validación de props',
          file: '/src/pages/Home.tsx',
          suggestion: 'Añadir interfaces TypeScript para las props',
          impact: 0.4
        },
        {
          id: 'analysis-3',
          type: 'maintainability',
          severity: 'medium',
          title: 'Código Duplicado',
          description: 'Estilos similares se repiten en múltiples archivos',
          file: '/src/styles.css',
          line: 15,
          suggestion: 'Crear clases CSS reutilizables',
          impact: 0.6
        },
        {
          id: 'analysis-4',
          type: 'security',
          severity: 'high',
          title: 'Validación de Entrada',
          description: 'No hay validación de datos de entrada del usuario',
          file: '/src/pages/Home.tsx',
          suggestion: 'Implementar validación de formularios',
          impact: 0.8
        },
        {
          id: 'analysis-5',
          type: 'performance',
          severity: 'low',
          title: 'Bundle Size',
          description: 'Algunas importaciones no se usan',
          file: '/src/App.tsx',
          line: 3,
          suggestion: 'Remover importaciones no utilizadas',
          impact: 0.3
        },
        {
          id: 'analysis-6',
          type: 'quality',
          severity: 'medium',
          title: 'Manejo de Errores',
          description: 'No hay manejo de errores en los componentes',
          file: '/src/App.tsx',
          suggestion: 'Implementar Error Boundaries',
          impact: 0.7
        }
      ];

      setAnalysisResults(mockResults);
      setIsAnalyzing(false);
      onAnalysisComplete?.(mockResults);
    }, 3000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500 bg-red-500/20 border-red-500/30';
      case 'high':
        return 'text-orange-500 bg-orange-500/20 border-orange-500/30';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30';
      case 'low':
        return 'text-green-500 bg-green-500/20 border-green-500/30';
      default:
        return 'text-gray-500 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return <TrendingUp className="w-4 h-4" />;
      case 'quality':
        return <CheckCircle className="w-4 h-4" />;
      case 'security':
        return <AlertTriangle className="w-4 h-4" />;
      case 'maintainability':
        return <Code className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'performance':
        return 'text-blue-400';
      case 'quality':
        return 'text-green-400';
      case 'security':
        return 'text-red-400';
      case 'maintainability':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const filteredResults = analysisResults.filter(result => {
    const matchesCategory = selectedCategory === 'all' || result.type === selectedCategory;
    const matchesSearch = result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.file.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', name: 'Todos', count: analysisResults.length },
    { id: 'performance', name: 'Rendimiento', count: analysisResults.filter(r => r.type === 'performance').length },
    { id: 'quality', name: 'Calidad', count: analysisResults.filter(r => r.type === 'quality').length },
    { id: 'security', name: 'Seguridad', count: analysisResults.filter(r => r.type === 'security').length },
    { id: 'maintainability', name: 'Mantenibilidad', count: analysisResults.filter(r => r.type === 'maintainability').length }
  ];

  const severityStats = {
    critical: analysisResults.filter(r => r.severity === 'critical').length,
    high: analysisResults.filter(r => r.severity === 'high').length,
    medium: analysisResults.filter(r => r.severity === 'medium').length,
    low: analysisResults.filter(r => r.severity === 'low').length
  };

  return (
    <div className="h-full bg-codestorm-dark rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-codestorm-blue/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-codestorm-accent" />
            <span className="font-medium text-white">Analizador de Código</span>
          </div>
          <button
            onClick={performAnalysis}
            disabled={isAnalyzing}
            className="flex items-center space-x-1 px-3 py-1 bg-codestorm-accent/20 text-codestorm-accent rounded hover:bg-codestorm-accent/30 transition-colors disabled:opacity-50"
          >
            <Search className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span className="text-sm">Analizar</span>
          </button>
        </div>

        {/* Barra de búsqueda */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar problemas..."
            className="w-full pl-10 pr-4 py-2 bg-codestorm-darker border border-codestorm-blue/30 rounded text-white placeholder-gray-400 focus:outline-none focus:border-codestorm-accent"
          />
        </div>
      </div>

      {/* Estadísticas */}
      <div className="p-4 border-b border-codestorm-blue/30">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-2 bg-red-500/20 rounded">
            <div className="text-lg font-bold text-red-400">{severityStats.critical + severityStats.high}</div>
            <div className="text-xs text-gray-400">Críticos</div>
          </div>
          <div className="p-2 bg-yellow-500/20 rounded">
            <div className="text-lg font-bold text-yellow-400">{severityStats.medium}</div>
            <div className="text-xs text-gray-400">Medios</div>
          </div>
          <div className="p-2 bg-green-500/20 rounded">
            <div className="text-lg font-bold text-green-400">{severityStats.low}</div>
            <div className="text-xs text-gray-400">Bajos</div>
          </div>
          <div className="p-2 bg-codestorm-accent/20 rounded">
            <div className="text-lg font-bold text-codestorm-accent">{projectFiles.length}</div>
            <div className="text-xs text-gray-400">Archivos</div>
          </div>
        </div>
      </div>

      {/* Filtros por categoría */}
      <div className="p-4 border-b border-codestorm-blue/30">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedCategory === category.id
                  ? 'bg-codestorm-accent text-white'
                  : 'bg-codestorm-darker text-gray-400 hover:text-white'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isAnalyzing ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Database className="w-12 h-12 text-codestorm-accent animate-pulse mx-auto mb-4" />
              <p className="text-white">Analizando código...</p>
              <p className="text-sm text-gray-400 mt-2">Detectando problemas y oportunidades de mejora</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredResults.map((result) => (
              <div
                key={result.id}
                className={`p-4 rounded-lg border ${getSeverityColor(result.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded ${getTypeColor(result.type)}`}>
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-white">{result.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded capitalize ${getSeverityColor(result.severity)}`}>
                          {result.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mt-1">{result.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        <span>{result.file}</span>
                        {result.line && <span>Línea {result.line}</span>}
                        <span>Impacto: {Math.round(result.impact * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-codestorm-darker rounded border border-codestorm-blue/30">
                  <div className="text-xs text-gray-400 mb-1">Sugerencia:</div>
                  <div className="text-sm text-green-300">{result.suggestion}</div>
                </div>
              </div>
            ))}

            {filteredResults.length === 0 && !isAnalyzing && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-white">No se encontraron problemas</p>
                <p className="text-sm text-gray-400 mt-2">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'El código está en buen estado'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodebaseAnalyzer;
