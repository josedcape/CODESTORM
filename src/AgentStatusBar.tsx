import React from 'react';
import { Sparkles, Shield, Eye, Activity, Clock, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { AgentState } from '../../pages/Agent';

interface AgentStatusBarProps {
  agentState: AgentState;
  onAgentSelect: (agent: 'generator' | 'corrector' | 'reviewer') => void;
}

const AgentStatusBar: React.FC<AgentStatusBarProps> = ({ agentState, onAgentSelect }) => {
  const agents = [
    {
      id: 'generator' as const,
      name: 'Generador',
      icon: Sparkles,
      description: 'Crea nuevas funciones y componentes',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      status: agentState.activeTasks.find(t => t.type === 'generate')?.status || 'idle'
    },
    {
      id: 'corrector' as const,
      name: 'Corrector',
      icon: Shield,
      description: 'Analiza y optimiza código existente',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      status: agentState.activeTasks.find(t => t.type === 'correct')?.status || 'idle'
    },
    {
      id: 'reviewer' as const,
      name: 'Revisor',
      icon: Eye,
      description: 'Monitorea cambios y sugiere mejoras',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30',
      status: agentState.activeTasks.find(t => t.type === 'review')?.status || 'idle'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-progress':
        return <Activity className="w-4 h-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'text-blue-400';
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'Trabajando';
      case 'completed':
        return 'Completado';
      case 'failed':
        return 'Error';
      case 'pending':
        return 'Pendiente';
      default:
        return 'Inactivo';
    }
  };

  return (
    <div className="mb-6 p-4 rounded-lg shadow-md bg-codestorm-dark">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center">
          <Activity className="w-5 h-5 mr-2 text-codestorm-accent" />
          Estado de Agentes
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <span>Tareas activas: {agentState.activeTasks.length}</span>
          <span>•</span>
          <span>Completadas: {agentState.completedTasks.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const isActive = agentState.activeAgent === agent.id;
          const isWorking = agent.status === 'in-progress';
          
          return (
            <div
              key={agent.id}
              onClick={() => onAgentSelect(agent.id)}
              className={`
                relative p-4 rounded-lg border cursor-pointer transition-all duration-300
                ${isActive 
                  ? `${agent.bgColor} ${agent.borderColor} border-2` 
                  : 'bg-codestorm-darker border-codestorm-blue/30 hover:border-codestorm-blue/50'
                }
                ${isWorking ? 'animate-pulse' : ''}
              `}
            >
              {/* Indicador de actividad */}
              {isWorking && (
                <div className="absolute top-2 right-2">
                  <div className={`w-3 h-3 rounded-full ${agent.color.replace('text-', 'bg-')} animate-ping`}></div>
                </div>
              )}

              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${agent.bgColor}`}>
                  <agent.icon className={`w-6 h-6 ${agent.color}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white">{agent.name}</h3>
                    <div className={`flex items-center space-x-1 ${getStatusColor(agent.status)}`}>
                      {getStatusIcon(agent.status)}
                      <span className="text-xs">{getStatusText(agent.status)}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-400 mt-1">{agent.description}</p>
                  
                  {/* Métricas del agente */}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>
                      Tareas: {agentState.completedTasks.filter(t => t.type === agent.id.replace('generator', 'generate').replace('corrector', 'correct').replace('reviewer', 'review')).length}
                    </span>
                    {agent.status === 'in-progress' && (
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>En progreso</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Barra de progreso para tareas activas */}
              {isWorking && (
                <div className="mt-3">
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full ${agent.color.replace('text-', 'bg-')} animate-pulse`}
                      style={{ width: '60%' }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resumen de actividad reciente */}
      {agentState.activeTasks.length > 0 && (
        <div className="mt-4 p-3 bg-codestorm-darker rounded-lg">
          <h4 className="text-sm font-medium text-white mb-2">Actividad Reciente</h4>
          <div className="space-y-2">
            {agentState.activeTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    task.type === 'generate' ? 'bg-green-400' :
                    task.type === 'correct' ? 'bg-blue-400' : 'bg-yellow-400'
                  } animate-pulse`}></div>
                  <span className="text-gray-300 truncate max-w-[200px]">{task.description}</span>
                </div>
                <span className="text-gray-500">
                  {Math.floor((Date.now() - task.startTime) / 1000)}s
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estadísticas globales */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-2 bg-codestorm-darker rounded">
          <div className="text-lg font-bold text-green-400">{agentState.appliedModifications.length}</div>
          <div className="text-xs text-gray-400">Modificaciones</div>
        </div>
        <div className="p-2 bg-codestorm-darker rounded">
          <div className="text-lg font-bold text-blue-400">{agentState.pendingModifications.length}</div>
          <div className="text-xs text-gray-400">Pendientes</div>
        </div>
        <div className="p-2 bg-codestorm-darker rounded">
          <div className="text-lg font-bold text-yellow-400">{agentState.projectFiles.length}</div>
          <div className="text-xs text-gray-400">Archivos</div>
        </div>
        <div className="p-2 bg-codestorm-darker rounded">
          <div className="text-lg font-bold text-codestorm-accent">
            {agentState.completedTasks.length > 0 ? 
              Math.round(agentState.completedTasks.filter(t => t.endTime).reduce((acc, t) => acc + (t.endTime! - t.startTime), 0) / agentState.completedTasks.filter(t => t.endTime).length / 1000) : 0
            }s
          </div>
          <div className="text-xs text-gray-400">Tiempo Prom.</div>
        </div>
      </div>
    </div>
  );
};

export default AgentStatusBar;
