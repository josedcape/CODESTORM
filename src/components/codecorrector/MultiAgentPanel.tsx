import React from 'react';
import { 
  Brain, 
  Search, 
  Wrench, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Clock,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';

interface AgentStatus {
  analyzer: 'success' | 'warning' | 'error' | 'working' | 'idle';
  detector: 'success' | 'warning' | 'error' | 'working' | 'idle';
  generator: 'success' | 'warning' | 'error' | 'working' | 'idle';
}

interface AgentMetrics {
  processingTime: number;
  confidenceScore: number;
  improvementPercentage: number;
  totalIssues: number;
  fixedIssues: number;
}

interface MultiAgentPanelProps {
  agentStatus: AgentStatus;
  currentAgent?: string;
  progress: number;
  message: string;
  metrics?: AgentMetrics;
  isProcessing: boolean;
}

const MultiAgentPanel: React.FC<MultiAgentPanelProps> = ({
  agentStatus,
  currentAgent,
  progress,
  message,
  metrics,
  isProcessing
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'working':
        return <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="w-5 h-5 bg-gray-600 rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-400 bg-green-400/10';
      case 'warning':
        return 'border-yellow-400 bg-yellow-400/10';
      case 'error':
        return 'border-red-400 bg-red-400/10';
      case 'working':
        return 'border-blue-400 bg-blue-400/10 animate-pulse';
      default:
        return 'border-gray-600 bg-gray-600/10';
    }
  };

  const agents = [
    {
      id: 'analyzer',
      name: 'Agente Analizador',
      icon: <Brain className="w-6 h-6" />,
      description: 'Analiza estructura y detecta lenguaje',
      status: agentStatus.analyzer
    },
    {
      id: 'detector',
      name: 'Agente Detector',
      icon: <Search className="w-6 h-6" />,
      description: 'Identifica errores y problemas',
      status: agentStatus.detector
    },
    {
      id: 'generator',
      name: 'Agente Generador',
      icon: <Wrench className="w-6 h-6" />,
      description: 'Genera código corregido',
      status: agentStatus.generator
    }
  ];

  return (
    <div className="bg-codestorm-dark rounded-lg border border-codestorm-blue/30 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Zap className="w-5 h-5 mr-2 text-codestorm-accent" />
          Sistema Multi-Agente
        </h3>
        {isProcessing && (
          <div className="flex items-center text-sm text-blue-400">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-2" />
            Procesando...
          </div>
        )}
      </div>

      {/* Agentes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`p-4 rounded-lg border-2 transition-all duration-300 ${getStatusColor(agent.status)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-white">
                {agent.icon}
                <span className="ml-2 font-medium text-sm">{agent.name}</span>
              </div>
              {getStatusIcon(agent.status)}
            </div>
            <p className="text-xs text-gray-400">{agent.description}</p>
            {currentAgent === agent.name && isProcessing && (
              <div className="mt-2">
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <div 
                    className="bg-blue-400 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div className="bg-codestorm-darker rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-300">{message}</p>
          {currentAgent && (
            <p className="text-xs text-blue-400 mt-1">
              {currentAgent} • {progress}% completado
            </p>
          )}
        </div>
      )}

      {/* Métricas */}
      {metrics && !isProcessing && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-codestorm-darker rounded-lg p-3">
            <div className="flex items-center justify-between">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Tiempo</span>
            </div>
            <p className="text-lg font-semibold text-white mt-1">
              {metrics.processingTime}ms
            </p>
          </div>

          <div className="bg-codestorm-darker rounded-lg p-3">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Confianza</span>
            </div>
            <p className="text-lg font-semibold text-white mt-1">
              {metrics.confidenceScore}%
            </p>
          </div>

          <div className="bg-codestorm-darker rounded-lg p-3">
            <div className="flex items-center justify-between">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Mejora</span>
            </div>
            <p className="text-lg font-semibold text-white mt-1">
              {metrics.improvementPercentage}%
            </p>
          </div>

          <div className="bg-codestorm-darker rounded-lg p-3">
            <div className="flex items-center justify-between">
              <CheckCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-400">Correcciones</span>
            </div>
            <p className="text-lg font-semibold text-white mt-1">
              {metrics.fixedIssues}/{metrics.totalIssues}
            </p>
          </div>
        </div>
      )}

      {/* Barra de progreso general */}
      {isProcessing && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Progreso General</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiAgentPanel;
