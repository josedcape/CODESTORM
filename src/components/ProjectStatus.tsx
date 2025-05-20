import React from 'react';
import { ProjectState, ProjectPhase } from '../types';
import { 
  Lightbulb, 
  Code, 
  TestTube, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

interface ProjectStatusProps {
  projectState: ProjectState;
}

const ProjectStatus: React.FC<ProjectStatusProps> = ({ projectState }) => {
  const getPhaseIcon = (phase: ProjectPhase) => {
    switch (phase) {
      case 'planning':
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case 'development':
        return <Code className="h-5 w-5 text-blue-500" />;
      case 'testing':
        return <TestTube className="h-5 w-5 text-green-500" />;
      case 'documentation':
        return <FileText className="h-5 w-5 text-purple-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getPhaseColor = (phase: ProjectPhase) => {
    switch (phase) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'development':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'testing':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'documentation':
        return 'bg-purple-100 text-purple-800 border-purple-300';
    }
  };

  const completedTasks = projectState.tasks.filter(task => task.status === 'completed').length;
  const totalTasks = projectState.tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-3">Project Status</h2>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {getPhaseIcon(projectState.phase)}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-sm ${getPhaseColor(projectState.phase)}`}>
              {projectState.phase.charAt(0).toUpperCase() + projectState.phase.slice(1)}
            </span>
          </div>
          <span className="text-sm font-medium">{progress}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Current Model</h3>
          <p className="text-sm">{projectState.currentModel}</p>
        </div>
        
        {projectState.currentTask && (
          <div>
            <h3 className="text-sm font-medium text-gray-700">Current Task</h3>
            <div className="flex items-center mt-1">
              {getStatusIcon(projectState.currentTask.status)}
              <p className="text-sm ml-2">{projectState.currentTask.description}</p>
            </div>
          </div>
        )}
        
        <div>
          <h3 className="text-sm font-medium text-gray-700">Next Steps</h3>
          <ul className="mt-1 space-y-1">
            {projectState.tasks
              .filter(task => task.status === 'pending')
              .slice(0, 3)
              .map(task => (
                <li key={task.id} className="flex items-center text-sm">
                  {getStatusIcon(task.status)}
                  <span className="ml-2">{task.description}</span>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProjectStatus;