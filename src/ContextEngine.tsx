import React, { useState, useEffect } from 'react';
import { Brain, Search, FileText, GitBranch, Zap, RefreshCw, Eye, Code, Database, Network } from 'lucide-react';
import { FileItem } from '../../types';

interface ContextEngineProps {
  projectFiles: FileItem[];
  contextAnalysis: any;
  onAnalyze: () => void;
}

interface DependencyNode {
  id: string;
  name: string;
  type: 'component' | 'function' | 'variable' | 'import';
  file: string;
  connections: string[];
  importance: number;
}

interface ContextInsight {
  id: string;
  type: 'suggestion' | 'warning' | 'info';
  title: string;
  description: string;
  files: string[];
  confidence: number;
}

const ContextEngine: React.FC<ContextEngineProps> = ({
  projectFiles,
  contextAnalysis,
  onAnalyze
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [dependencies, setDependencies] = useState<DependencyNode[]>([]);
  const [insights, setInsights] = useState<ContextInsight[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Simular análisis de dependencias
  useEffect(() => {
    if (projectFiles.length > 0) {
      simulateContextAnalysis();
    }
  }, [projectFiles]);

  const simulateContextAnalysis = () => {
    setIsAnalyzing(true);
    
    // Simular análisis de dependencias
    setTimeout(() => {
      const mockDependencies: DependencyNode[] = [
        {
          id: 'app-component',
          name: 'App',
          type: 'component',
          file: '/src/App.tsx',
          connections: ['home-component', 'router-import'],
          importance: 0.9
        },
        {
          id: 'home-component',
          name: 'Home',
          type: 'component',
          file: '/src/pages/Home.tsx',
          connections: ['useState-hook', 'counter-state'],
          importance: 0.7
        },
        {
          id: 'useState-hook',
          name: 'useState',
          type: 'import',
          file: '/src/pages/Home.tsx',
          connections: ['counter-state'],
          importance: 0.8
        },
        {
          id: 'counter-state',
          name: 'count',
          type: 'variable',
          file: '/src/pages/Home.tsx',
          connections: ['increment-function'],
          importance: 0.6
        },
        {
          id: 'increment-function',
          name: 'setCount',
          type: 'function',
          file: '/src/pages/Home.tsx',
          connections: [],
          importance: 0.5
        }
      ];

      const mockInsights: ContextInsight[] = [
        {
          id: 'insight-1',
          type: 'suggestion',
          title: 'Optimización de Estado',
          description: 'El componente Home podría beneficiarse de useCallback para la función de incremento',
          files: ['/src/pages/Home.tsx'],
          confidence: 0.85
        },
        {
          id: 'insight-2',
          type: 'warning',
          title: 'Falta Manejo de Errores',
          description: 'No se detectó manejo de errores en los componentes principales',
          files: ['/src/App.tsx', '/src/pages/Home.tsx'],
          confidence: 0.92
        },
        {
          id: 'insight-3',
          type: 'info',
          title: 'Estructura Limpia',
          description: 'La arquitectura del proyecto sigue buenas prácticas de React',
          files: ['/src/App.tsx'],
          confidence: 0.78
        }
      ];

      setDependencies(mockDependencies);
      setInsights(mockInsights);
      setIsAnalyzing(false);
    }, 2000);
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'component':
        return 'bg-green-500/20 border-green-500/50 text-green-400';
      case 'function':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
      case 'variable':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      case 'import':
        return 'bg-purple-500/20 border-purple-500/50 text-purple-400';
      default:
        return 'bg-gray-500/20 border-gray-500/50 text-gray-400';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'suggestion':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'warning':
        return <Eye className="w-4 h-4 text-red-400" />;
      case 'info':
        return <FileText className="w-4 h-4 text-blue-400" />;
      default:
        return <Brain className="w-4 h-4 text-gray-400" />;
    }
  };

  const filteredDependencies = dependencies.filter(dep =>
    dep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dep.file.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full bg-codestorm-dark rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-codestorm-blue/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-codestorm-accent" />
            <span className="font-medium text-white">Motor de Contexto</span>
          </div>
          <button
            onClick={simulateContextAnalysis}
            disabled={isAnalyzing}
            className="flex items-center space-x-1 px-3 py-1 bg-codestorm-accent/20 text-codestorm-accent rounded hover:bg-codestorm-accent/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
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
            placeholder="Buscar en el contexto..."
            className="w-full pl-10 pr-4 py-2 bg-codestorm-darker border border-codestorm-blue/30 rounded text-white placeholder-gray-400 focus:outline-none focus:border-codestorm-accent"
          />
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isAnalyzing ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Brain className="w-12 h-12 text-codestorm-accent animate-pulse mx-auto mb-4" />
              <p className="text-white">Analizando contexto del proyecto...</p>
              <p className="text-sm text-gray-400 mt-2">Identificando dependencias y patrones</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Estadísticas del proyecto */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-codestorm-darker rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-400">Archivos</span>
                </div>
                <div className="text-xl font-bold text-white mt-1">{projectFiles.length}</div>
              </div>
              <div className="p-3 bg-codestorm-darker rounded-lg">
                <div className="flex items-center space-x-2">
                  <Network className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-400">Dependencias</span>
                </div>
                <div className="text-xl font-bold text-white mt-1">{dependencies.length}</div>
              </div>
            </div>

            {/* Insights del contexto */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3 flex items-center">
                <Zap className="w-4 h-4 mr-2 text-yellow-400" />
                Insights del Código
              </h3>
              <div className="space-y-2">
                {insights.map((insight) => (
                  <div
                    key={insight.id}
                    className="p-3 bg-codestorm-darker rounded-lg border border-codestorm-blue/30"
                  >
                    <div className="flex items-start space-x-2">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-white">{insight.title}</h4>
                          <span className="text-xs text-gray-400">{Math.round(insight.confidence * 100)}%</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{insight.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {insight.files.map((file, index) => (
                            <span
                              key={index}
                              className="text-xs px-2 py-1 bg-codestorm-blue/20 text-codestorm-accent rounded"
                            >
                              {file.split('/').pop()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mapa de dependencias */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3 flex items-center">
                <GitBranch className="w-4 h-4 mr-2 text-blue-400" />
                Mapa de Dependencias
              </h3>
              <div className="space-y-2">
                {filteredDependencies.map((dep) => (
                  <div
                    key={dep.id}
                    className={`p-3 rounded-lg border ${getNodeColor(dep.type)} cursor-pointer hover:opacity-80 transition-opacity`}
                    onClick={() => setSelectedFile(projectFiles.find(f => f.path === dep.file) || null)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Code className="w-4 h-4" />
                        <span className="font-medium">{dep.name}</span>
                        <span className="text-xs opacity-70 capitalize">{dep.type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-xs opacity-70">
                          {Math.round(dep.importance * 100)}% importancia
                        </div>
                        <div className="text-xs bg-black/20 px-2 py-1 rounded">
                          {dep.connections.length} conexiones
                        </div>
                      </div>
                    </div>
                    <div className="text-xs opacity-70 mt-1">{dep.file}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Archivo seleccionado */}
            {selectedFile && (
              <div>
                <h3 className="text-sm font-medium text-white mb-3 flex items-center">
                  <Eye className="w-4 h-4 mr-2 text-green-400" />
                  Archivo Seleccionado
                </h3>
                <div className="p-3 bg-codestorm-darker rounded-lg border border-green-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{selectedFile.name}</span>
                    <span className="text-xs text-gray-400">{selectedFile.language}</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-2">{selectedFile.path}</div>
                  <div className="text-xs text-gray-300">
                    {selectedFile.content?.split('\n').length || 0} líneas
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContextEngine;
