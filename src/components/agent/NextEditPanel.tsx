import React, { useState } from 'react';
import { Eye, CheckCircle, XCircle, Code, FileText, ArrowRight, Clock, Sparkles, AlertTriangle } from 'lucide-react';
import { FileItem } from '../../types';
import { CodeModification } from '../../pages/Agent';

interface NextEditPanelProps {
  pendingModifications: CodeModification[];
  selectedFile: FileItem | null;
  onApprove: (modificationId: string) => void;
  onReject: (modificationId: string) => void;
}

const NextEditPanel: React.FC<NextEditPanelProps> = ({
  pendingModifications,
  selectedFile,
  onApprove,
  onReject
}) => {
  const [selectedModification, setSelectedModification] = useState<CodeModification | null>(null);
  const [previewMode, setPreviewMode] = useState<'side-by-side' | 'unified'>('side-by-side');

  // Simulación de modificaciones pendientes para demostración
  const mockModifications: CodeModification[] = [
    {
      id: 'mod-1',
      filePath: '/src/pages/Home.tsx',
      originalContent: `const Home: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="home-container">
      <h1>Bienvenido a mi aplicación</h1>
      <p>Contador: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Incrementar
      </button>
    </div>
  );
};`,
      proposedContent: `const Home: React.FC = () => {
  const [count, setCount] = useState(0);

  const handleIncrement = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  return (
    <div className="home-container">
      <h1>Bienvenido a mi aplicación</h1>
      <p>Contador: {count}</p>
      <button onClick={handleIncrement}>
        Incrementar
      </button>
      <button onClick={() => setCount(0)} className="reset-btn">
        Resetear
      </button>
    </div>
  );
};`,
      description: 'Optimización con useCallback y botón de reset',
      agentType: 'corrector',
      confidence: 0.92,
      timestamp: Date.now() - 30000,
      approved: false
    },
    {
      id: 'mod-2',
      filePath: '/src/styles.css',
      originalContent: `.home-container button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.home-container button:hover {
  background-color: #0056b3;
}`,
      proposedContent: `.home-container button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0.25rem;
}

.home-container button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
}

.home-container .reset-btn {
  background-color: #dc3545;
}

.home-container .reset-btn:hover {
  background-color: #c82333;
}`,
      description: 'Mejoras visuales y estilos para el botón de reset',
      agentType: 'generator',
      confidence: 0.88,
      timestamp: Date.now() - 15000,
      approved: false
    }
  ];

  const modifications = pendingModifications.length > 0 ? pendingModifications : mockModifications;

  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case 'generator':
        return <Sparkles className="w-4 h-4 text-green-400" />;
      case 'corrector':
        return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case 'reviewer':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Code className="w-4 h-4 text-gray-400" />;
    }
  };

  const getAgentColor = (agentType: string) => {
    switch (agentType) {
      case 'generator':
        return 'border-green-500/30 bg-green-500/10';
      case 'corrector':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'reviewer':
        return 'border-yellow-500/30 bg-yellow-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const renderCodeComparison = (modification: CodeModification) => {
    const originalLines = modification.originalContent.split('\n');
    const proposedLines = modification.proposedContent.split('\n');

    if (previewMode === 'side-by-side') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-white mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-red-400" />
              Original
            </h4>
            <div className="bg-codestorm-darker rounded border border-red-500/30 p-3 text-xs font-mono">
              {originalLines.map((line, index) => (
                <div key={index} className="text-gray-300">
                  <span className="text-gray-500 mr-3">{index + 1}</span>
                  {line}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-green-400" />
              Propuesto
            </h4>
            <div className="bg-codestorm-darker rounded border border-green-500/30 p-3 text-xs font-mono">
              {proposedLines.map((line, index) => (
                <div key={index} className="text-gray-300">
                  <span className="text-gray-500 mr-3">{index + 1}</span>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    } else {
      // Modo unificado - mostrar diferencias
      return (
        <div>
          <h4 className="text-sm font-medium text-white mb-2 flex items-center">
            <Code className="w-4 h-4 mr-2 text-codestorm-accent" />
            Vista Unificada
          </h4>
          <div className="bg-codestorm-darker rounded border border-codestorm-blue/30 p-3 text-xs font-mono">
            {/* Simplificado: mostrar solo las líneas propuestas con indicadores */}
            {proposedLines.map((line, index) => {
              const isNew = !originalLines.includes(line);
              return (
                <div key={index} className={`${isNew ? 'bg-green-500/20 text-green-300' : 'text-gray-300'}`}>
                  <span className="text-gray-500 mr-3">{index + 1}</span>
                  <span className={`mr-2 ${isNew ? 'text-green-400' : 'text-gray-500'}`}>
                    {isNew ? '+' : ' '}
                  </span>
                  {line}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="h-full bg-codestorm-dark rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-codestorm-blue/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-codestorm-accent" />
            <span className="font-medium text-white">Preview de Cambios</span>
            <span className="text-xs bg-codestorm-accent/20 text-codestorm-accent px-2 py-1 rounded">
              {modifications.length} pendientes
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPreviewMode('side-by-side')}
              className={`text-xs px-2 py-1 rounded ${
                previewMode === 'side-by-side' 
                  ? 'bg-codestorm-accent text-white' 
                  : 'bg-codestorm-darker text-gray-400 hover:text-white'
              }`}
            >
              Lado a lado
            </button>
            <button
              onClick={() => setPreviewMode('unified')}
              className={`text-xs px-2 py-1 rounded ${
                previewMode === 'unified' 
                  ? 'bg-codestorm-accent text-white' 
                  : 'bg-codestorm-darker text-gray-400 hover:text-white'
              }`}
            >
              Unificado
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex h-full">
        {/* Lista de modificaciones */}
        <div className="w-1/3 border-r border-codestorm-blue/30 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-3">
            {modifications.map((modification) => (
              <div
                key={modification.id}
                onClick={() => setSelectedModification(modification)}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all duration-200
                  ${selectedModification?.id === modification.id 
                    ? `${getAgentColor(modification.agentType)} border-2` 
                    : 'bg-codestorm-darker border-codestorm-blue/30 hover:border-codestorm-blue/50'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getAgentIcon(modification.agentType)}
                    <span className="text-sm font-medium text-white capitalize">
                      {modification.agentType}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {Math.round(modification.confidence * 100)}%
                  </div>
                </div>
                
                <p className="text-sm text-gray-300 mt-2">{modification.description}</p>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {modification.filePath.split('/').pop()}
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{Math.floor((Date.now() - modification.timestamp) / 1000)}s</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview del cambio seleccionado */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {selectedModification ? (
            <div className="p-4">
              {/* Información del cambio */}
              <div className="mb-4 p-3 bg-codestorm-darker rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-white">{selectedModification.description}</h3>
                  <div className="flex items-center space-x-2">
                    {getAgentIcon(selectedModification.agentType)}
                    <span className="text-sm text-gray-400 capitalize">{selectedModification.agentType}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  Archivo: {selectedModification.filePath}
                </div>
                <div className="text-sm text-gray-400">
                  Confianza: {Math.round(selectedModification.confidence * 100)}%
                </div>
              </div>

              {/* Comparación de código */}
              {renderCodeComparison(selectedModification)}

              {/* Botones de acción */}
              <div className="flex items-center justify-center space-x-4 mt-6">
                <button
                  onClick={() => onReject(selectedModification.id)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Rechazar</span>
                </button>
                <button
                  onClick={() => onApprove(selectedModification.id)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Aprobar</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Selecciona una modificación para ver el preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NextEditPanel;
