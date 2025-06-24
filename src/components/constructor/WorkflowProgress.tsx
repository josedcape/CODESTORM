import React from 'react';
import { Check, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { WorkflowStep } from '../../services/ConstructorWorkflowService';
import { useUI } from '../../contexts/UIContext';

interface WorkflowProgressProps {
  steps: WorkflowStep[];
  currentStep: number;
  className?: string;
}

const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  steps,
  currentStep,
  className = ''
}) => {
  const { isMobile } = useUI();

  const getStepIcon = (step: WorkflowStep, index: number) => {
    if (step.status === 'completed') {
      return <Check className="w-4 h-4 text-white" />;
    } else if (step.status === 'in-progress') {
      return <Clock className="w-4 h-4 text-white animate-spin" />;
    } else if (step.status === 'failed') {
      return <AlertCircle className="w-4 h-4 text-white" />;
    } else {
      return <span className="text-white font-bold text-sm">{index + 1}</span>;
    }
  };

  const getStepColor = (step: WorkflowStep, index: number) => {
    if (step.status === 'completed') {
      return 'bg-green-500 border-green-500';
    } else if (step.status === 'in-progress') {
      return 'bg-codestorm-accent border-codestorm-accent';
    } else if (step.status === 'failed') {
      return 'bg-red-500 border-red-500';
    } else if (index <= currentStep) {
      return 'bg-gray-600 border-gray-600';
    } else {
      return 'bg-gray-800 border-gray-700';
    }
  };

  const getConnectorColor = (index: number) => {
    if (index < currentStep || steps[index].status === 'completed') {
      return 'bg-green-500';
    } else if (index === currentStep && steps[index].status === 'in-progress') {
      return 'bg-codestorm-accent';
    } else {
      return 'bg-gray-700';
    }
  };

  if (isMobile) {
    // Mobile: Vertical layout
    return (
      <div className={`bg-codestorm-dark rounded-lg p-4 ${className}`}>
        <h3 className="text-lg font-bold text-white mb-4">Progreso del Workflow</h3>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-3">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div className={`
                  w-8 h-8 rounded-full border-2 flex items-center justify-center
                  ${getStepColor(step, index)}
                `}>
                  {getStepIcon(step, index)}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-0.5 h-8 mt-2 ${getConnectorColor(index)}`} />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold ${
                  step.status === 'completed' ? 'text-green-400' :
                  step.status === 'in-progress' ? 'text-codestorm-accent' :
                  step.status === 'failed' ? 'text-red-400' :
                  'text-gray-400'
                }`}>
                  {step.name}
                </h4>
                <p className="text-sm text-gray-400 mt-1">{step.description}</p>
                {step.status === 'in-progress' && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-codestorm-accent h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Desktop: Horizontal layout
  return (
    <div className={`bg-codestorm-dark rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-bold text-white mb-6 text-center">Progreso del Workflow</h3>
      
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step */}
            <div className="flex flex-col items-center space-y-2 flex-1">
              {/* Step indicator */}
              <div className={`
                w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300
                ${getStepColor(step, index)}
                ${step.status === 'in-progress' ? 'shadow-lg shadow-codestorm-accent/50' : ''}
              `}>
                {getStepIcon(step, index)}
              </div>

              {/* Step label */}
              <div className="text-center max-w-24">
                <h4 className={`text-sm font-semibold ${
                  step.status === 'completed' ? 'text-green-400' :
                  step.status === 'in-progress' ? 'text-codestorm-accent' :
                  step.status === 'failed' ? 'text-red-400' :
                  'text-gray-400'
                }`}>
                  {step.name}
                </h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {step.description}
                </p>
              </div>

              {/* Progress bar for current step */}
              {step.status === 'in-progress' && (
                <div className="w-full max-w-20">
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div className="bg-codestorm-accent h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Connector */}
            {index < steps.length - 1 && (
              <div className="flex items-center px-4">
                <div className={`h-0.5 w-12 transition-all duration-300 ${getConnectorColor(index)}`} />
                <ArrowRight className={`w-4 h-4 ml-2 ${
                  index < currentStep || steps[index].status === 'completed' ? 'text-green-400' :
                  index === currentStep && steps[index].status === 'in-progress' ? 'text-codestorm-accent' :
                  'text-gray-600'
                }`} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Current step details */}
      {currentStep < steps.length && (
        <div className="mt-6 p-4 bg-codestorm-darker rounded-lg border border-codestorm-blue/20">
          <div className="flex items-center space-x-3">
            <div className={`
              w-8 h-8 rounded-full border-2 flex items-center justify-center
              ${getStepColor(steps[currentStep], currentStep)}
            `}>
              {getStepIcon(steps[currentStep], currentStep)}
            </div>
            <div>
              <h4 className="text-white font-semibold">{steps[currentStep].name}</h4>
              <p className="text-gray-400 text-sm">{steps[currentStep].description}</p>
            </div>
          </div>
          
          {steps[currentStep].status === 'in-progress' && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                <span>Procesando...</span>
                <span>60%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-codestorm-accent h-2 rounded-full transition-all duration-300 animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completion message */}
      {currentStep >= steps.length && steps.every(step => step.status === 'completed') && (
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-green-400 font-semibold">Workflow Completado</h4>
              <p className="text-green-300 text-sm">Todos los pasos han sido ejecutados exitosamente</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowProgress;
