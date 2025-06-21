import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Clock, FileText, ArrowRight, AlertTriangle, Info } from 'lucide-react';
import { DevelopmentPlan } from '../../services/ConstructorWorkflowService';
import { useUI } from '../../contexts/UIContext';

interface DevelopmentPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (approved: boolean) => void;
  plan: DevelopmentPlan;
  userInstruction: string;
  stackName: string;
  templateName: string;
}

const DevelopmentPlanModal: React.FC<DevelopmentPlanModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  plan,
  userInstruction,
  stackName,
  templateName
}) => {
  const { isMobile } = useUI();
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getComplexityLabel = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'Baja';
      case 'medium': return 'Media';
      case 'high': return 'Alta';
      default: return 'Desconocida';
    }
  };

  const handleApprove = () => {
    onApprove(true);
  };

  const handleReject = () => {
    onApprove(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative bg-codestorm-darker rounded-xl border border-codestorm-blue/30 shadow-2xl
        ${isMobile ? 'w-full h-full' : 'w-[90vw] h-[85vh] max-w-5xl'}
        flex flex-col overflow-hidden
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-codestorm-blue/20">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              📋 Plan de Desarrollo Generado
            </h2>
            <p className="text-gray-400 text-sm">
              Revisa el plan detallado antes de proceder con el desarrollo
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Project Summary */}
          <div className="bg-codestorm-dark rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Resumen del Proyecto</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Instrucción Original:</label>
                <p className="text-white">{userInstruction}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Stack Tecnológico:</label>
                <p className="text-white">{stackName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Plantilla:</label>
                <p className="text-white">{templateName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Duración Estimada:</label>
                <p className="text-white">{plan.estimatedDuration}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm border ${getComplexityColor(plan.complexity)}`}>
                Complejidad: {getComplexityLabel(plan.complexity)}
              </span>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-sm">
                {plan.steps.length} pasos
              </span>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-sm">
                {plan.technologies.length} tecnologías
              </span>
            </div>
          </div>

          {/* Plan Details */}
          <div className="bg-codestorm-dark rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Plan Detallado</h3>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-codestorm-accent hover:text-blue-300 transition-colors"
              >
                {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
              </button>
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-semibold text-white mb-2">{plan.title}</h4>
              <p className="text-gray-300">{plan.description}</p>
            </div>

            {/* Architecture */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
                <Info className="w-5 h-5 mr-2" />
                Arquitectura
              </h4>
              <p className="text-gray-300 bg-codestorm-darker p-3 rounded-lg">
                {plan.architecture}
              </p>
            </div>

            {/* Technologies */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">Tecnologías a Utilizar</h4>
              <div className="flex flex-wrap gap-2">
                {plan.technologies.map((tech, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-codestorm-blue/20 text-blue-300 rounded-full text-sm"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Development Steps */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Pasos de Desarrollo
              </h4>
              <div className="space-y-4">
                {plan.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="bg-codestorm-darker rounded-lg p-4 border border-codestorm-blue/20"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-codestorm-accent rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-white font-semibold">{step.title}</h5>
                          <span className="text-sm text-gray-400 flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {step.estimatedTime}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-3">{step.description}</p>
                        
                        {showDetails && (
                          <div className="space-y-2">
                            {/* Files to create/modify */}
                            {step.files.length > 0 && (
                              <div>
                                <span className="text-xs font-medium text-gray-400">Archivos:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {step.files.map((file, fileIndex) => (
                                    <span
                                      key={fileIndex}
                                      className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs"
                                    >
                                      {file}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Dependencies */}
                            {step.dependencies.length > 0 && (
                              <div>
                                <span className="text-xs font-medium text-gray-400">Dependencias:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {step.dependencies.map((dep, depIndex) => (
                                    <span
                                      key={depIndex}
                                      className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded text-xs"
                                    >
                                      Paso {dep}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-yellow-400 font-semibold mb-1">Importante</h4>
                <p className="text-yellow-200 text-sm">
                  Una vez que apruebes este plan, el sistema de agentes especializados comenzará 
                  el desarrollo automático. Podrás supervisar el progreso y hacer ajustes durante 
                  el proceso.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-codestorm-blue/20">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              ¿El plan se ajusta a tus expectativas?
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleReject}
                className="px-6 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg font-medium hover:bg-red-600/30 transition-all duration-200 flex items-center space-x-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Rechazar</span>
              </button>
              <button
                onClick={handleApprove}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 hover:scale-105 transition-all duration-200 flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Aprobar y Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevelopmentPlanModal;
