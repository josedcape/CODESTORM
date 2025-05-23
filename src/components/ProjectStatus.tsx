import React from 'react';
import { ProjectState, Task, ProjectPhase } from '../types';
import { CheckCircle2, Clock, AlertCircle, List } from 'lucide-react';

interface ProjectStatusProps {
  projectState?: ProjectState;
  phase?: ProjectPhase;
  currentTask?: Task | null;
  isGeneratingProject?: boolean;
  tasks?: Task[];
}

const ProjectStatus: React.FC<ProjectStatusProps> = ({ projectState, phase, currentTask, isGeneratingProject, tasks }) => {
  // Si se proporciona projectState, usar sus propiedades, de lo contrario usar las props individuales
  const currentPhase = projectState?.phase || phase || 'planning';
  const currentTaskData = projectState?.currentTask || currentTask;
  const isGenerating = projectState?.isGeneratingProject || isGeneratingProject || false;
  const tasksList = projectState?.tasks || tasks || [];
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-400" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getPhaseColor = (phase: ProjectPhase) => {
    switch (phase) {
      case 'planning':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-700';
      case 'development':
        return 'bg-blue-900/30 text-blue-400 border-blue-700';
      case 'testing':
        return 'bg-green-900/30 text-green-400 border-green-700';
      case 'documentation':
        return 'bg-purple-900/30 text-purple-400 border-purple-700';
    }
  };

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md border border-codestorm-blue/30">
      <div className="bg-codestorm-blue/20 p-3 border-b border-codestorm-blue/30 flex items-center">
        <List className="h-4 w-4 text-codestorm-gold mr-2" />
        <h2 className="text-sm font-medium text-white">Estado del Proyecto</h2>
      </div>
      <div className="p-3">
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">Fase Actual</div>
          <div className={`text-sm px-2 py-1 rounded border ${getPhaseColor(currentPhase)}`}>
            {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)}
          </div>
        </div>

        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">Tarea Actual</div>
          {currentTaskData ? (
            <div className="text-sm text-white">
              {currentTaskData.description}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No hay tarea activa
            </div>
          )}
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-1">Historial de Tareas</div>
          {tasksList.length > 0 ? (
            <ul className="space-y-2">
              {tasksList.map((task: Task) => (
                <li key={task.id} className="flex items-start">
                  <div className="mt-0.5 mr-2">
                    {getStatusIcon(task.status)}
                  </div>
                  <div className="text-xs text-gray-300">
                    {task.description}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No hay tareas completadas
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectStatus;
