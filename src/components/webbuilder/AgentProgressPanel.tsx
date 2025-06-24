import React from 'react';
import { 
  Cpu, 
  Code, 
  Palette, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Loader2, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { CoordinatorTask } from '../../services/AgentCoordinatorService';

interface AgentProgressPanelProps {
  tasks: CoordinatorTask[];
  onRetry?: (taskId: string) => void;
  onCancel?: () => void;
}

const AgentProgressPanel: React.FC<AgentProgressPanelProps> = ({ 
  tasks, 
  onRetry, 
  onCancel 
}) => {
  const [expandedTasks, setExpandedTasks] = React.useState<string[]>([]);
  
  // Función para alternar la expansión de una tarea
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };
  
  // Función para obtener el icono según el tipo de agente
  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case 'design':
        return <Palette className="h-4 w-4 text-purple-400" />;
      case 'code':
        return <Code className="h-4 w-4 text-blue-400" />;
      case 'coordinator':
      default:
        return <Cpu className="h-4 w-4 text-green-400" />;
    }
  };
  
  // Función para obtener el icono según el estado de la tarea
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'idle':
        return <Clock className="h-4 w-4 text-gray-400" />;
      case 'working':
      default:
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };
  
  // Función para formatear el tiempo transcurrido
  const formatElapsedTime = (startTime: number, endTime?: number) => {
    const elapsed = (endTime || Date.now()) - startTime;
    const seconds = Math.floor(elapsed / 1000);
    
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  // Calcular el progreso general
  const calculateOverallProgress = () => {
    if (tasks.length === 0) return 0;
    
    const mainTask = tasks.find(t => t.agentType === 'coordinator');
    if (mainTask) return mainTask.progress;
    
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.floor(totalProgress / tasks.length);
  };
  
  const overallProgress = calculateOverallProgress();
  
  return (
    <div className="bg-codestorm-darker rounded-lg shadow-lg p-4 h-full overflow-hidden flex flex-col">
      <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
        <Cpu className="h-5 w-5 mr-2 text-codestorm-blue" />
        Progreso de Agentes
      </h2>
      
      {/* Barra de progreso general */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-300">Progreso general</span>
          <span className="text-sm text-gray-300">{overallProgress}%</span>
        </div>
        <div className="w-full bg-codestorm-dark rounded-full h-2.5">
          <div 
            className="bg-codestorm-blue h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          ></div>
        </div>
      </div>
      
      {/* Lista de tareas */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="bg-codestorm-dark rounded-lg overflow-hidden">
            {/* Cabecera de la tarea */}
            <div 
              className="p-3 flex items-center justify-between cursor-pointer hover:bg-codestorm-blue/10"
              onClick={() => toggleTaskExpansion(task.id)}
            >
              <div className="flex items-center">
                {getAgentIcon(task.agentType)}
                <span className="ml-2 text-sm text-white">{task.description}</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(task.status)}
                <span className="text-xs text-gray-400">
                  {formatElapsedTime(task.startTime, task.endTime)}
                </span>
                {expandedTasks.includes(task.id) ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
            
            {/* Detalles de la tarea */}
            {expandedTasks.includes(task.id) && (
              <div className="px-3 pb-3 border-t border-codestorm-blue/20">
                {/* Barra de progreso */}
                <div className="my-2">
                  <div className="w-full bg-codestorm-darker rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        task.status === 'completed' 
                          ? 'bg-green-500' 
                          : task.status === 'failed' 
                            ? 'bg-red-500' 
                            : 'bg-codestorm-blue'
                      }`}
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Información adicional */}
                <div className="text-xs text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>ID:</span>
                    <span>{task.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estado:</span>
                    <span className={`
                      ${task.status === 'completed' ? 'text-green-500' : ''}
                      ${task.status === 'failed' ? 'text-red-500' : ''}
                      ${task.status === 'working' ? 'text-blue-500' : ''}
                    `}>
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inicio:</span>
                    <span>{new Date(task.startTime).toLocaleTimeString()}</span>
                  </div>
                  {task.endTime && (
                    <div className="flex justify-between">
                      <span>Fin:</span>
                      <span>{new Date(task.endTime).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
                
                {/* Mensaje de error */}
                {task.error && (
                  <div className="mt-2 p-2 bg-red-500/20 rounded text-xs text-red-400 flex items-start">
                    <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                    <span>{task.error}</span>
                  </div>
                )}
                
                {/* Botón de reintento */}
                {task.status === 'failed' && onRetry && (
                  <button
                    onClick={() => onRetry(task.id)}
                    className="mt-2 w-full py-1 px-2 bg-codestorm-blue/30 hover:bg-codestorm-blue/50 text-white text-xs rounded flex items-center justify-center"
                  >
                    <Loader2 className="h-3 w-3 mr-1" />
                    Reintentar
                  </button>
                )}
                
                {/* Subtareas */}
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <h4 className="text-xs font-medium text-gray-300">Subtareas</h4>
                    {task.subtasks.map(subtask => (
                      <div key={subtask.id} className="bg-codestorm-darker rounded p-2 flex items-center justify-between">
                        <div className="flex items-center">
                          {getAgentIcon(subtask.agentType)}
                          <span className="ml-2 text-xs text-gray-300">{subtask.description}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(subtask.status)}
                          <span className="text-xs text-gray-400">
                            {formatElapsedTime(subtask.startTime, subtask.endTime)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <Cpu className="h-8 w-8 mb-2 text-gray-500" />
            <p className="text-sm">No hay tareas en ejecución</p>
          </div>
        )}
      </div>
      
      {/* Botón de cancelar */}
      {tasks.some(t => t.status === 'working') && onCancel && (
        <button
          onClick={onCancel}
          className="mt-4 py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded flex items-center justify-center"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Cancelar proceso
        </button>
      )}
    </div>
  );
};

export default AgentProgressPanel;
