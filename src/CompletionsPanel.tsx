import React, { useState, useEffect } from 'react';
import { Zap, Code, ArrowRight, CheckCircle, Clock, Sparkles } from 'lucide-react';

interface Completion {
  id: string;
  trigger: string;
  suggestion: string;
  type: 'function' | 'component' | 'import' | 'variable';
  confidence: number;
  context: string;
  preview: string;
}

interface CompletionsPanelProps {
  isActive: boolean;
  currentFile?: string;
}

const CompletionsPanel: React.FC<CompletionsPanelProps> = ({ isActive, currentFile }) => {
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [selectedCompletion, setSelectedCompletion] = useState<Completion | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Simulación de completions inteligentes
  useEffect(() => {
    if (isActive) {
      generateCompletions();
    }
  }, [isActive, currentFile]);

  const generateCompletions = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const mockCompletions: Completion[] = [
        {
          id: 'comp-1',
          trigger: 'useState',
          suggestion: 'useState<number>(0)',
          type: 'function',
          confidence: 0.95,
          context: 'React Hook para estado local',
          preview: `const [count, setCount] = useState<number>(0);`
        },
        {
          id: 'comp-2',
          trigger: 'useEffect',
          suggestion: 'useEffect(() => {}, [])',
          type: 'function',
          confidence: 0.92,
          context: 'React Hook para efectos secundarios',
          preview: `useEffect(() => {
  // Efecto aquí
}, []);`
        },
        {
          id: 'comp-3',
          trigger: 'interface',
          suggestion: 'interface Props {\n  // propiedades\n}',
          type: 'component',
          confidence: 0.88,
          context: 'Definición de interfaz TypeScript',
          preview: `interface Props {
  title: string;
  onClick: () => void;
}`
        },
        {
          id: 'comp-4',
          trigger: 'import',
          suggestion: "import React from 'react';",
          type: 'import',
          confidence: 0.98,
          context: 'Importación de React',
          preview: `import React from 'react';`
        },
        {
          id: 'comp-5',
          trigger: 'const component',
          suggestion: 'const Component: React.FC = () => {\n  return (\n    <div></div>\n  );\n};',
          type: 'component',
          confidence: 0.90,
          context: 'Componente funcional de React',
          preview: `const Component: React.FC = () => {
  return (
    <div>
      {/* Contenido del componente */}
    </div>
  );
};`
        },
        {
          id: 'comp-6',
          trigger: 'handleClick',
          suggestion: 'const handleClick = () => {\n  // Lógica del click\n};',
          type: 'function',
          confidence: 0.85,
          context: 'Manejador de eventos de click',
          preview: `const handleClick = () => {
  console.log('Click manejado');
};`
        }
      ];

      setCompletions(mockCompletions);
      setIsGenerating(false);
    }, 1500);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'function':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'component':
        return <Code className="w-4 h-4 text-green-400" />;
      case 'import':
        return <ArrowRight className="w-4 h-4 text-blue-400" />;
      case 'variable':
        return <CheckCircle className="w-4 h-4 text-purple-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'function':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'component':
        return 'border-green-500/30 bg-green-500/10';
      case 'import':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'variable':
        return 'border-purple-500/30 bg-purple-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  return (
    <div className="h-full bg-codestorm-dark rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-codestorm-blue/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-codestorm-accent" />
            <span className="font-medium text-white">Completions Inteligentes</span>
          </div>
          <div className="flex items-center space-x-2">
            {isGenerating && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-yellow-400 animate-spin" />
                <span className="text-xs text-yellow-400">Generando...</span>
              </div>
            )}
            <button
              onClick={generateCompletions}
              disabled={isGenerating}
              className="text-xs px-2 py-1 bg-codestorm-accent/20 text-codestorm-accent rounded hover:bg-codestorm-accent/30 transition-colors disabled:opacity-50"
            >
              Actualizar
            </button>
          </div>
        </div>
        
        {currentFile && (
          <div className="text-xs text-gray-400 mt-2">
            Contexto: {currentFile}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex h-full">
        {/* Lista de completions */}
        <div className="w-1/2 border-r border-codestorm-blue/30 overflow-y-auto custom-scrollbar">
          <div className="p-4">
            {isGenerating ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Sparkles className="w-8 h-8 text-codestorm-accent animate-pulse mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Generando completions...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {completions.map((completion) => (
                  <div
                    key={completion.id}
                    onClick={() => setSelectedCompletion(completion)}
                    className={`
                      p-3 rounded-lg border cursor-pointer transition-all duration-200
                      ${selectedCompletion?.id === completion.id 
                        ? `${getTypeColor(completion.type)} border-2` 
                        : 'bg-codestorm-darker border-codestorm-blue/30 hover:border-codestorm-blue/50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(completion.type)}
                        <span className="text-sm font-medium text-white">
                          {completion.trigger}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {Math.round(completion.confidence * 100)}%
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-1">{completion.context}</p>
                    
                    <div className="text-xs text-gray-500 mt-2 capitalize">
                      {completion.type}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview del completion seleccionado */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {selectedCompletion ? (
            <div className="p-4">
              {/* Información del completion */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  {getTypeIcon(selectedCompletion.type)}
                  <h3 className="font-medium text-white">{selectedCompletion.trigger}</h3>
                  <span className="text-xs bg-codestorm-accent/20 text-codestorm-accent px-2 py-1 rounded capitalize">
                    {selectedCompletion.type}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{selectedCompletion.context}</p>
                <div className="text-xs text-gray-500 mt-1">
                  Confianza: {Math.round(selectedCompletion.confidence * 100)}%
                </div>
              </div>

              {/* Preview del código */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-white mb-2 flex items-center">
                  <Code className="w-4 h-4 mr-2 text-codestorm-accent" />
                  Preview
                </h4>
                <div className="bg-codestorm-darker rounded border border-codestorm-blue/30 p-3">
                  <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap">
                    {selectedCompletion.preview}
                  </pre>
                </div>
              </div>

              {/* Sugerencia rápida */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-white mb-2">Sugerencia Rápida</h4>
                <div className="bg-codestorm-darker rounded border border-green-500/30 p-3">
                  <code className="text-xs font-mono text-green-300">
                    {selectedCompletion.suggestion}
                  </code>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Aplicar</span>
                </button>
                <button className="flex items-center space-x-2 px-3 py-2 bg-codestorm-blue/20 text-codestorm-accent border border-codestorm-blue/30 rounded hover:bg-codestorm-blue/30 transition-colors">
                  <Code className="w-4 h-4" />
                  <span className="text-sm">Copiar</span>
                </button>
              </div>

              {/* Completions relacionados */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-white mb-2">Completions Relacionados</h4>
                <div className="space-y-2">
                  {completions
                    .filter(c => c.id !== selectedCompletion.id && c.type === selectedCompletion.type)
                    .slice(0, 3)
                    .map((related) => (
                      <div
                        key={related.id}
                        onClick={() => setSelectedCompletion(related)}
                        className="p-2 bg-codestorm-darker rounded border border-codestorm-blue/30 cursor-pointer hover:border-codestorm-blue/50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(related.type)}
                          <span className="text-sm text-white">{related.trigger}</span>
                          <span className="text-xs text-gray-400">
                            {Math.round(related.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Selecciona un completion para ver el preview</p>
                <p className="text-sm text-gray-500 mt-2">
                  Los completions se generan basándose en el contexto del archivo actual
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompletionsPanel;
