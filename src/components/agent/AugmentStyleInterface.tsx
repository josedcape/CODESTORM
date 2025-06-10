import React, { useState, useEffect } from 'react';
import { Brain, Zap, Eye, Code, ArrowRight, CheckCircle, Clock, Sparkles, Search, FileText } from 'lucide-react';

interface AugmentFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'processing' | 'idle';
  lastUsed?: number;
}

interface CodeSuggestion {
  id: string;
  type: 'completion' | 'refactor' | 'optimization';
  title: string;
  description: string;
  code: string;
  confidence: number;
  file: string;
}

interface AugmentStyleInterfaceProps {
  isActive: boolean;
  onFeatureActivate: (featureId: string) => void;
}

const AugmentStyleInterface: React.FC<AugmentStyleInterfaceProps> = ({ 
  isActive, 
  onFeatureActivate 
}) => {
  const [activeFeature, setActiveFeature] = useState<string>('context-engine');
  const [suggestions, setSuggestions] = useState<CodeSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const features: AugmentFeature[] = [
    {
      id: 'context-engine',
      name: 'Context Engine',
      description: 'Motor de contexto que entiende tu codebase completo',
      icon: <Brain className="w-5 h-5" />,
      status: 'active',
      lastUsed: Date.now() - 300000
    },
    {
      id: 'next-edit',
      name: 'Next Edit',
      description: 'Guía paso a paso para modificaciones complejas',
      icon: <ArrowRight className="w-5 h-5" />,
      status: 'idle',
      lastUsed: Date.now() - 600000
    },
    {
      id: 'completions',
      name: 'Completions',
      description: 'Autocompletado inteligente en tiempo real',
      icon: <Zap className="w-5 h-5" />,
      status: 'processing',
      lastUsed: Date.now() - 120000
    },
    {
      id: 'code-review',
      name: 'Code Review',
      description: 'Revisión automática de calidad de código',
      icon: <Eye className="w-5 h-5" />,
      status: 'idle',
      lastUsed: Date.now() - 900000
    }
  ];

  useEffect(() => {
    if (isActive) {
      generateSuggestions();
    }
  }, [isActive, activeFeature]);

  const generateSuggestions = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const mockSuggestions: CodeSuggestion[] = [
        {
          id: 'sugg-1',
          type: 'completion',
          title: 'useState Hook',
          description: 'Autocompletado para estado de React',
          code: 'const [state, setState] = useState(initialValue);',
          confidence: 0.95,
          file: '/src/components/Example.tsx'
        },
        {
          id: 'sugg-2',
          type: 'refactor',
          title: 'Extract Component',
          description: 'Extraer lógica repetida en componente reutilizable',
          code: 'const ReusableButton = ({ onClick, children }) => {\n  return <button onClick={onClick}>{children}</button>;\n};',
          confidence: 0.88,
          file: '/src/pages/Home.tsx'
        },
        {
          id: 'sugg-3',
          type: 'optimization',
          title: 'Memoization',
          description: 'Optimizar re-renders con React.memo',
          code: 'const MemoizedComponent = React.memo(Component);',
          confidence: 0.92,
          file: '/src/components/List.tsx'
        }
      ];

      setSuggestions(mockSuggestions);
      setIsAnalyzing(false);
    }, 1500);
  };

  const getFeatureStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'processing':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'idle':
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getSuggestionTypeColor = (type: string) => {
    switch (type) {
      case 'completion':
        return 'text-blue-400 bg-blue-500/20';
      case 'refactor':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'optimization':
        return 'text-green-400 bg-green-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'now';
  };

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    suggestion.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full bg-codestorm-dark rounded-lg overflow-hidden">
      {/* Header estilo Augment */}
      <div className="p-4 border-b border-codestorm-blue/30 bg-gradient-to-r from-codestorm-dark to-codestorm-blue/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-codestorm-accent/20 rounded-lg">
              <Sparkles className="w-6 h-6 text-codestorm-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Augment-Style AI</h2>
              <p className="text-sm text-gray-400">Asistente de desarrollo inteligente</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-xs text-gray-400">{isActive ? 'Activo' : 'Inactivo'}</span>
          </div>
        </div>

        {/* Barra de búsqueda estilo Augment */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ask me anything about your code..."
            className="w-full pl-10 pr-4 py-3 bg-codestorm-darker border border-codestorm-blue/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-codestorm-accent focus:ring-1 focus:ring-codestorm-accent"
          />
        </div>
      </div>

      {/* Features Grid */}
      <div className="p-4 border-b border-codestorm-blue/30">
        <h3 className="text-sm font-medium text-white mb-3">Características Principales</h3>
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature) => (
            <div
              key={feature.id}
              onClick={() => {
                setActiveFeature(feature.id);
                onFeatureActivate(feature.id);
              }}
              className={`
                p-3 rounded-lg border cursor-pointer transition-all duration-200
                ${activeFeature === feature.id 
                  ? `${getFeatureStatusColor(feature.status)} border-2` 
                  : 'bg-codestorm-darker border-codestorm-blue/30 hover:border-codestorm-blue/50'
                }
              `}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className={`${feature.status === 'active' ? 'text-green-400' : feature.status === 'processing' ? 'text-blue-400' : 'text-gray-400'}`}>
                  {feature.icon}
                </div>
                <span className="text-sm font-medium text-white">{feature.name}</span>
              </div>
              <p className="text-xs text-gray-400">{feature.description}</p>
              {feature.lastUsed && (
                <div className="text-xs text-gray-500 mt-1">
                  Usado {formatTimeAgo(feature.lastUsed)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions Panel */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Sugerencias Inteligentes</h3>
            {isAnalyzing && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-xs text-blue-400">Analizando...</span>
              </div>
            )}
          </div>

          {isAnalyzing ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Brain className="w-8 h-8 text-codestorm-accent animate-pulse mx-auto mb-2" />
                <p className="text-sm text-gray-400">Generando sugerencias...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="p-4 bg-codestorm-darker rounded-lg border border-codestorm-blue/30 hover:border-codestorm-blue/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded capitalize ${getSuggestionTypeColor(suggestion.type)}`}>
                        {suggestion.type}
                      </span>
                      <h4 className="font-medium text-white">{suggestion.title}</h4>
                    </div>
                    <div className="text-xs text-gray-400">
                      {Math.round(suggestion.confidence * 100)}%
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-3">{suggestion.description}</p>
                  
                  <div className="bg-black/30 rounded p-3 mb-3">
                    <pre className="text-xs font-mono text-green-300 whitespace-pre-wrap">
                      {suggestion.code}
                    </pre>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <FileText className="w-3 h-3" />
                      <span>{suggestion.file}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors">
                        Aplicar
                      </button>
                      <button className="text-xs px-2 py-1 bg-codestorm-blue/20 text-codestorm-accent rounded hover:bg-codestorm-blue/30 transition-colors">
                        Ver más
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredSuggestions.length === 0 && !isAnalyzing && (
                <div className="text-center py-8">
                  <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No hay sugerencias disponibles</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {searchQuery ? 'Intenta con otros términos' : 'Escribe código para obtener sugerencias'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer estilo Augment */}
      <div className="p-3 border-t border-codestorm-blue/30 bg-codestorm-darker">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Powered by Claude Sonnet 3.7</span>
          <div className="flex items-center space-x-4">
            <span>{suggestions.length} sugerencias</span>
            <span>•</span>
            <span>{features.filter(f => f.status === 'active').length} activas</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AugmentStyleInterface;
