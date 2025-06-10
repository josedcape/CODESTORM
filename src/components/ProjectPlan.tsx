import React from 'react';
import { ProjectPlan as ProjectPlanType, ProjectStep } from '../types';
import { CheckCircle, Circle, Clock, AlertCircle, ChevronDown, ChevronRight, FileText } from 'lucide-react';

interface ProjectPlanProps {
  plan: ProjectPlanType;
  onStepComplete: (stepId: string) => void;
  onStepFailed: (stepId: string) => void;
}

const ProjectPlan: React.FC<ProjectPlanProps> = ({ plan, onStepComplete, onStepFailed }) => {
  const [expanded, setExpanded] = React.useState(true);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-400 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md p-4 border border-codestorm-blue/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <button
            onClick={toggleExpand}
            className="mr-2 text-codestorm-accent hover:text-codestorm-gold"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <h3 className="text-white font-medium">{plan.title}</h3>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4">
          <div className="text-sm text-gray-300">{plan.description}</div>

          <div>
            <h4 className="text-sm font-medium text-codestorm-gold mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              Archivos necesarios
            </h4>
            <ul className="text-xs text-gray-300 space-y-1 ml-6">
              {plan.files.map((file, index) => (
                <li key={index} className="list-disc">
                  <code className="bg-codestorm-blue/10 px-1 py-0.5 rounded">{file}</code>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-codestorm-gold mb-2">Pasos de implementación</h4>
            <div className="space-y-2">
              {plan.steps.map((step) => (
                <StepItem
                  key={step.id}
                  step={step}
                  isActive={step.id === plan.currentStepId}
                  onComplete={() => onStepComplete(step.id)}
                  onFailed={() => onStepFailed(step.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface StepItemProps {
  step: ProjectStep;
  isActive: boolean;
  onComplete: () => void;
  onFailed: () => void;
}

const StepItem: React.FC<StepItemProps> = ({ step, isActive, onComplete, onFailed }) => {
  const [expanded, setExpanded] = React.useState(isActive);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-400 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div
      className={`border-l-2 pl-3 py-1 ${
        isActive
          ? 'border-codestorm-accent bg-codestorm-blue/10'
          : step.status === 'completed'
          ? 'border-green-500'
          : step.status === 'failed'
          ? 'border-red-500'
          : 'border-gray-600'
      } rounded-r`}
    >
      <div className="flex items-center">
        <div className="mr-2">{getStepIcon(step.status)}</div>
        <div
          className="flex-1 text-sm font-medium cursor-pointer"
          onClick={toggleExpand}
        >
          {step.title}
        </div>
        {isActive && step.status === 'in-progress' && (
          <div className="flex space-x-1">
            <button
              onClick={onComplete}
              className="px-2 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
            >
              Completado
            </button>
            <button
              onClick={onFailed}
              className="px-2 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            >
              Fallido
            </button>
          </div>
        )}
      </div>
      {expanded && (
        <div className="mt-1 text-xs text-gray-300 whitespace-pre-line">
          {step.description}
        </div>
      )}
    </div>
  );
};

export default ProjectPlan;
