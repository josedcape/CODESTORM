import React, { useState } from 'react';
import { ApprovalStage } from '../../types';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Layers,
  PenTool,
  Brain,
  Code,
  FileEdit,
  Eye,
  Scissors,
  Zap,
  Info
} from 'lucide-react';

interface ProjectRoadmapProps {
  stages: ApprovalStage[];
  currentStageId: string;
  onSelectStage: (stageId: string) => void;
  onGenerateNextStage?: () => void;
  canAdvanceToNextStage?: boolean;
}

const ProjectRoadmap: React.FC<ProjectRoadmapProps> = ({
  stages,
  currentStageId,
  onSelectStage,
  onGenerateNextStage,
  canAdvanceToNextStage = false
}) => {
  const [expandedStages, setExpandedStages] = useState<string[]>([]);
  
  // Función para alternar la expansión de una etapa
  const toggleStage = (stageId: string) => {
    setExpandedStages(prev => 
      prev.includes(stageId)
        ? prev.filter(id => id !== stageId)
        : [...prev, stageId]
    );
  };
  
  // Función para obtener el icono según el tipo de agente
  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'planner':
        return <Brain className="h-4 w-4 text-purple-400" />;
      case 'codeGenerator':
        return <Code className="h-4 w-4 text-blue-400" />;
      case 'fileObserver':
        return <Eye className="h-4 w-4 text-green-400" />;
      case 'fileModifier':
        return <FileEdit className="h-4 w-4 text-yellow-400" />;
      case 'codeSplitter':
        return <Scissors className="h-4 w-4 text-red-400" />;
      case 'lector':
        return <Zap className="h-4 w-4 text-orange-400" />;
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };
  
  // Función para obtener el color según el estado de la etapa
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'modified':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Función para obtener el texto según el estado de la etapa
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprobada';
      case 'rejected':
        return 'Rechazada';
      case 'pending':
        return 'Pendiente';
      case 'modified':
        return 'Modificada';
      default:
        return 'Desconocido';
    }
  };
  
  // Función para obtener el icono según el estado de la etapa
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'modified':
        return <PenTool className="h-4 w-4 text-blue-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };
  
  // Calcular el progreso general del proyecto
  const calculateProgress = () => {
    if (stages.length === 0) return 0;
    
    const completedStages = stages.filter(stage => stage.status === 'approved').length;
    return Math.round((completedStages / stages.length) * 100);
  };
  
  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md border border-codestorm-blue/30 p-4">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
        <Layers className="h-5 w-5 mr-2 text-codestorm-accent" />
        Roadmap del Proyecto
      </h2>
      
      {/* Barra de progreso general */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-300">Progreso general</span>
          <span className="text-sm text-white font-medium">{calculateProgress()}%</span>
        </div>
        <div className="h-2 bg-codestorm-darker rounded-full overflow-hidden">
          <div 
            className="h-full bg-codestorm-accent"
            style={{ width: `${calculateProgress()}%` }}
          ></div>
        </div>
      </div>
      
      {/* Lista de etapas */}
      <div className="space-y-3">
        {stages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No hay etapas definidas para este proyecto</p>
          </div>
        ) : (
          <div className="relative">
            {/* Línea de tiempo vertical */}
            <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-codestorm-blue/20"></div>
            
            {/* Etapas */}
            {stages.map((stage, index) => (
              <div 
                key={stage.id} 
                className={`relative pl-9 ${index !== stages.length - 1 ? 'pb-3' : ''}`}
              >
                {/* Indicador de etapa actual */}
                {stage.id === currentStageId && (
                  <div className="absolute -left-2 top-0 bottom-0 w-1 bg-codestorm-accent rounded-full"></div>
                )}
                
                {/* Círculo de estado */}
                <div 
                  className={`absolute left-2 top-1 w-5 h-5 rounded-full border-2 border-codestorm-darker ${getStatusColor(stage.status)} z-10 flex items-center justify-center`}
                >
                  {getStatusIcon(stage.status)}
                </div>
                
                <div 
                  className={`bg-codestorm-darker rounded-md border ${
                    stage.id === currentStageId 
                      ? 'border-codestorm-accent' 
                      : 'border-codestorm-blue/30'
                  } overflow-hidden`}
                >
                  <div 
                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-codestorm-blue/10 ${
                      stage.id === currentStageId ? 'bg-codestorm-blue/5' : ''
                    }`}
                    onClick={() => toggleStage(stage.id)}
                  >
                    <div className="flex items-center">
                      {getAgentIcon(stage.type)}
                      <div className="ml-2">
                        <h3 className="text-white text-sm font-medium">{stage.title}</h3>
                        <p className="text-gray-400 text-xs">{new Date(stage.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs mr-2 ${
                        stage.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        stage.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        stage.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {getStatusText(stage.status)}
                      </span>
                      
                      {expandedStages.includes(stage.id) ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {expandedStages.includes(stage.id) && (
                    <div className="p-3 border-t border-codestorm-blue/30">
                      <p className="text-gray-300 text-sm mb-3">{stage.description}</p>
                      
                      {/* Cambios de la etapa */}
                      {stage.changes && stage.changes.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-white text-xs font-medium mb-2">Cambios ({stage.changes.length})</h4>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {stage.changes.map(change => (
                              <div 
                                key={change.id} 
                                className="flex items-center justify-between text-xs p-1.5 rounded-md hover:bg-codestorm-blue/5"
                              >
                                <div className="flex items-center">
                                  {change.type === 'create' && <Plus className="h-3 w-3 text-green-400 mr-1.5" />}
                                  {change.type === 'modify' && <Edit className="h-3 w-3 text-blue-400 mr-1.5" />}
                                  {change.type === 'delete' && <Trash className="h-3 w-3 text-red-400 mr-1.5" />}
                                  <span className="text-gray-300">{change.title}</span>
                                </div>
                                <div>
                                  {change.isApproved && <CheckCircle className="h-3 w-3 text-green-400" />}
                                  {change.isRejected && <XCircle className="h-3 w-3 text-red-400" />}
                                  {!change.isApproved && !change.isRejected && <Clock className="h-3 w-3 text-yellow-400" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => onSelectStage(stage.id)}
                          className="px-3 py-1 bg-codestorm-blue/20 hover:bg-codestorm-blue/30 text-white rounded-md text-xs flex items-center transition-colors"
                        >
                          <Eye className="h-3 w-3 mr-1.5" />
                          <span>Ver Detalles</span>
                        </button>
                        
                        {stage.id === currentStageId && stage.status === 'approved' && onGenerateNextStage && (
                          <button
                            onClick={onGenerateNextStage}
                            className={`px-3 py-1 rounded-md text-xs flex items-center transition-colors ${
                              canAdvanceToNextStage
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                            disabled={!canAdvanceToNextStage}
                          >
                            <ArrowRight className="h-3 w-3 mr-1.5" />
                            <span>Siguiente Etapa</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectRoadmap;
