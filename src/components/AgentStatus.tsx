import React from 'react';
import { AgentTask, AgentType } from '../types';
import { Brain, Code, RefreshCw, FileEdit, CheckCircle, Clock, AlertCircle, Circle, Eye, Scissors, Bug, BookOpen, Users, Palette } from 'lucide-react';

interface AgentStatusProps {
  tasks: AgentTask[];
}

const AgentStatus: React.FC<AgentStatusProps> = ({ tasks }) => {
  // Agrupar tareas por tipo de agente
  const tasksByType: Record<AgentType, AgentTask[]> = {
    planner: [],
    codeGenerator: [],
    fileSynchronizer: [],
    codeModifier: [],
    fileObserver: [],
    codeSplitter: [],
    codeCorrector: [],
    seguimiento: [],
    lector: [],
    designArchitect: []
  };

  tasks.forEach(task => {
    tasksByType[task.type].push(task);
  });

  // Obtener el estado general de cada tipo de agente
  const agentStatus: Record<AgentType, 'idle' | 'working' | 'completed' | 'failed'> = {
    planner: getAgentStatus(tasksByType.planner),
    codeGenerator: getAgentStatus(tasksByType.codeGenerator),
    fileSynchronizer: getAgentStatus(tasksByType.fileSynchronizer),
    codeModifier: getAgentStatus(tasksByType.codeModifier),
    fileObserver: getAgentStatus(tasksByType.fileObserver),
    codeSplitter: getAgentStatus(tasksByType.codeSplitter),
    codeCorrector: getAgentStatus(tasksByType.codeCorrector),
    seguimiento: getAgentStatus(tasksByType.seguimiento),
    lector: getAgentStatus(tasksByType.lector),
    designArchitect: getAgentStatus(tasksByType.designArchitect)
  };

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md p-4 border border-codestorm-blue/30">
      <h2 className="text-sm font-medium text-white mb-3">Estado de Agentes</h2>

      <div className="space-y-2">
        <AgentStatusItem
          type="planner"
          status={agentStatus.planner}
          taskCount={tasksByType.planner.length}
          icon={<Brain className="h-4 w-4" />}
        />

        <AgentStatusItem
          type="codeGenerator"
          status={agentStatus.codeGenerator}
          taskCount={tasksByType.codeGenerator.length}
          icon={<Code className="h-4 w-4" />}
        />

        <AgentStatusItem
          type="fileSynchronizer"
          status={agentStatus.fileSynchronizer}
          taskCount={tasksByType.fileSynchronizer.length}
          icon={<RefreshCw className="h-4 w-4" />}
        />

        <AgentStatusItem
          type="codeModifier"
          status={agentStatus.codeModifier}
          taskCount={tasksByType.codeModifier.length}
          icon={<FileEdit className="h-4 w-4" />}
        />

        <AgentStatusItem
          type="fileObserver"
          status={agentStatus.fileObserver}
          taskCount={tasksByType.fileObserver.length}
          icon={<Eye className="h-4 w-4" />}
        />

        <AgentStatusItem
          type="codeSplitter"
          status={agentStatus.codeSplitter}
          taskCount={tasksByType.codeSplitter.length}
          icon={<Scissors className="h-4 w-4" />}
        />

        <AgentStatusItem
          type="codeCorrector"
          status={agentStatus.codeCorrector}
          taskCount={tasksByType.codeCorrector.length}
          icon={<Bug className="h-4 w-4" />}
        />

        <AgentStatusItem
          type="seguimiento"
          status={agentStatus.seguimiento}
          taskCount={tasksByType.seguimiento.length}
          icon={<BookOpen className="h-4 w-4" />}
        />

        <AgentStatusItem
          type="lector"
          status={agentStatus.lector}
          taskCount={tasksByType.lector.length}
          icon={<Users className="h-4 w-4" />}
        />

        <AgentStatusItem
          type="designArchitect"
          status={agentStatus.designArchitect}
          taskCount={tasksByType.designArchitect.length}
          icon={<Palette className="h-4 w-4" />}
        />
      </div>
    </div>
  );
};

interface AgentStatusItemProps {
  type: AgentType;
  status: 'idle' | 'working' | 'completed' | 'failed';
  taskCount: number;
  icon: React.ReactNode;
}

const AgentStatusItem: React.FC<AgentStatusItemProps> = ({ type, status, taskCount, icon }) => {
  const getAgentName = (type: AgentType): string => {
    switch (type) {
      case 'planner':
        return 'Agente de Planificación';
      case 'codeGenerator':
        return 'Agente de Generación de Código';
      case 'fileSynchronizer':
        return 'Agente de Sincronización de Archivos';
      case 'codeModifier':
        return 'Agente de Modificación de Código';
      case 'fileObserver':
        return 'Agente de Observación de Archivos';
      case 'codeSplitter':
        return 'Agente de Separación de Código';
      case 'codeCorrector':
        return 'Agente de Corrección de Código';
      case 'seguimiento':
        return 'Agente de Seguimiento';
      case 'lector':
        return 'Agente Lector';
      case 'designArchitect':
        return 'Agente de Diseño Arquitectónico';
      default:
        return 'Agente Desconocido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'working':
        return <Clock className="h-4 w-4 text-blue-400 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 border-green-500/30';
      case 'working':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'failed':
        return 'bg-red-500/10 border-red-500/30';
      default:
        return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <div className={`flex items-center p-2 rounded border ${getStatusColor(status)}`}>
      <div className="mr-2 text-codestorm-gold">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-xs font-medium text-white">{getAgentName(type)}</div>
        <div className="text-xs text-gray-400">
          {taskCount > 0 ? `${taskCount} tarea${taskCount !== 1 ? 's' : ''}` : 'Sin tareas'}
        </div>
      </div>
      <div className="ml-2">
        {getStatusIcon(status)}
      </div>
    </div>
  );
};

/**
 * Determina el estado general de un agente basado en sus tareas
 * @param tasks Lista de tareas del agente
 * @returns Estado general del agente
 */
function getAgentStatus(tasks: AgentTask[]): 'idle' | 'working' | 'completed' | 'failed' {
  if (tasks.length === 0) {
    return 'idle';
  }

  // Si hay alguna tarea en progreso, el agente está trabajando
  if (tasks.some(task => task.status === 'working')) {
    return 'working';
  }

  // Si todas las tareas están completadas, el agente está completado
  if (tasks.every(task => task.status === 'completed')) {
    return 'completed';
  }

  // Si hay alguna tarea fallida, el agente ha fallado
  if (tasks.some(task => task.status === 'failed')) {
    return 'failed';
  }

  // Por defecto, el agente está inactivo
  return 'idle';
}

export default AgentStatus;
