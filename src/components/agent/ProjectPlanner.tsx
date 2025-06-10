import React, { useState } from 'react';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Plus, 
  Minus, 
  Edit3,
  Play,
  Pause,
  RotateCcw,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';
import { ProjectPlan, PlanStep } from '../../pages/Agent';

interface ProjectPlannerProps {
  plan: ProjectPlan | null;
  onApprovePlan: () => void;
  onRejectPlan: () => void;
  onModifyPlan: (plan: ProjectPlan) => void;
  onApproveStep: (stepId: string) => void;
  onRejectStep: (stepId: string) => void;
  isExecuting: boolean;
}

const ProjectPlanner: React.FC<ProjectPlannerProps> = ({
  plan,
  onApprovePlan,
  onRejectPlan,
  onModifyPlan,
  onApproveStep,
  onRejectStep,
  isExecuting
}) => {
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [showRisks, setShowRisks] = useState(false);

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'create':
        return <Plus className="w-4 h-4 text-green-400" />;
      case 'modify':
        return <Edit3 className="w-4 h-4 text-blue-400" />;
      case 'delete':
        return <Minus className="w-4 h-4 text-red-400" />;
      case 'analyze':
        return <Brain className="w-4 h-4 text-purple-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'in-progress':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'failed':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'skipped':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low':
        return 'text-green-400 bg-green-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'high':
        return 'text-orange-400 bg-orange-500/20';
      case 'critical':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (!plan) {
    return (
      <div className="bg-codestorm-dark rounded-lg p-6">
        <div className="text-center text-gray-400">
          <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay plan de proyecto</p>
          <p className="text-sm mt-2">Solicita modificaciones para generar un plan automático</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-codestorm-dark rounded-lg overflow-hidden">
      {/* Header del plan */}
      <div className="p-4 border-b border-codestorm-blue/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Target className="w-5 h-5 mr-2 text-codestorm-accent" />
              Plan de Proyecto
            </h3>
            <p className="text-sm text-gray-400 mt-1">{plan.title}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded capitalize ${getComplexityColor(plan.complexity)}`}>
              {plan.complexity}
            </span>
            <span className="text-xs text-gray-400 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {formatTime(plan.estimatedTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Descripción y métricas */}
      <div className="p-4 border-b border-codestorm-blue/30">
        <p className="text-sm text-gray-300 mb-4">{plan.description}</p>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-codestorm-darker rounded">
            <div className="text-lg font-bold text-blue-400">{plan.steps.length}</div>
            <div className="text-xs text-gray-400">Pasos</div>
          </div>
          <div className="p-3 bg-codestorm-darker rounded">
            <div className="text-lg font-bold text-green-400">
              {plan.steps.filter(s => s.status === 'completed').length}
            </div>
            <div className="text-xs text-gray-400">Completados</div>
          </div>
          <div className="p-3 bg-codestorm-darker rounded">
            <div className="text-lg font-bold text-yellow-400">{plan.risks.length}</div>
            <div className="text-xs text-gray-400">Riesgos</div>
          </div>
        </div>
      </div>

      {/* Botones de acción del plan */}
      {plan.status === 'pending-approval' && (
        <div className="p-4 border-b border-codestorm-blue/30 bg-codestorm-darker">
          <div className="flex items-center justify-between">
            <div className="text-sm text-yellow-300 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Plan pendiente de aprobación
            </div>
            <div className="flex space-x-2">
              <button
                onClick={onRejectPlan}
                className="px-3 py-1 text-sm bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors"
              >
                Rechazar
              </button>
              <button
                onClick={onApprovePlan}
                className="px-3 py-1 text-sm bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors"
              >
                Aprobar Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de pasos */}
      <div className="max-h-96 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-3">
          {plan.steps
            .sort((a, b) => a.order - b.order)
            .map((step, index) => (
              <div
                key={step.id}
                className={`p-3 rounded-lg border ${getStepStatusColor(step.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-gray-400 w-6">
                        {index + 1}
                      </span>
                      {getStepIcon(step.type)}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{step.title}</h4>
                      <p className="text-sm text-gray-300 mt-1">{step.description}</p>
                      
                      {step.targetFiles.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-400 mb-1">Archivos afectados:</div>
                          <div className="flex flex-wrap gap-1">
                            {step.targetFiles.map((file, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 bg-codestorm-blue/20 text-codestorm-accent rounded"
                              >
                                {file.split('/').pop()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(step.estimatedTime)}
                        </span>
                        <span className="capitalize">{step.type}</span>
                        <span className="capitalize">{step.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción del paso */}
                  {plan.status === 'approved' && step.status === 'pending' && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => onRejectStep(step.id)}
                        className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                        title="Rechazar paso"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onApproveStep(step.id)}
                        className="p-1 text-green-400 hover:bg-green-500/20 rounded"
                        title="Aprobar paso"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Sección de riesgos */}
      {plan.risks.length > 0 && (
        <div className="border-t border-codestorm-blue/30">
          <button
            onClick={() => setShowRisks(!showRisks)}
            className="w-full p-4 text-left hover:bg-codestorm-blue/10 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-400 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Riesgos Identificados ({plan.risks.length})
              </span>
              <span className="text-gray-400">
                {showRisks ? '−' : '+'}
              </span>
            </div>
          </button>
          
          {showRisks && (
            <div className="px-4 pb-4">
              <div className="space-y-2">
                {plan.risks.map((risk, index) => (
                  <div
                    key={index}
                    className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm text-yellow-200"
                  >
                    {risk}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estado de ejecución */}
      {plan.status === 'executing' && (
        <div className="p-4 border-t border-codestorm-blue/30 bg-blue-500/10">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-300 flex items-center">
              <Play className="w-4 h-4 mr-2 animate-pulse" />
              Ejecutando plan...
            </div>
            <div className="text-xs text-gray-400">
              {plan.steps.filter(s => s.status === 'completed').length} / {plan.steps.length} pasos
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPlanner;
