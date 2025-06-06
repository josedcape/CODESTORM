import React from 'react';
import { ApprovalStage } from '../../types';
import { 
  Brain, 
  Code, 
  RefreshCw, 
  FileEdit, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  PenTool,
  XCircle
} from 'lucide-react';

interface ProgressBarProps {
  stages: ApprovalStage[];
  currentStageId: string | null;
  onSelectStage?: (stageId: string) => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  stages, 
  currentStageId,
  onSelectStage
}) => {
  // Función para obtener el icono según el tipo de agente
  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'planner':
        return <Brain className="h-4 w-4" />;
      case 'codeGenerator':
        return <Code className="h-4 w-4" />;
      case 'fileSynchronizer':
        return <RefreshCw className="h-4 w-4" />;
      case 'codeModifier':
        return <FileEdit className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };
  
  // Función para obtener el icono según el estado de la etapa
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'modified':
        return <PenTool className="h-4 w-4 text-blue-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Función para obtener el color de fondo según el estado de la etapa
  const getStageBackgroundColor = (stage: ApprovalStage, isCurrent: boolean) => {
    if (isCurrent) {
      return 'bg-codestorm-blue/30 border-l-2 border-codestorm-accent';
    }
    
    switch (stage.status) {
      case 'approved':
        return 'bg-green-500/10 border-l-2 border-green-500';
      case 'pending':
        return 'bg-codestorm-blue/10';
      case 'modified':
        return 'bg-blue-500/10 border-l-2 border-blue-500';
      case 'rejected':
        return 'bg-red-500/10 border-l-2 border-red-500';
      default:
        return 'bg-codestorm-blue/10';
    }
  };
  
  // Función para obtener el texto de estado
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprobado';
      case 'pending':
        return 'Pendiente';
      case 'modified':
        return 'Modificado';
      case 'rejected':
        return 'Rechazado';
      default:
        return 'Desconocido';
    }
  };
  
  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md p-4 border border-codestorm-blue/30">
      <h2 className="text-sm font-medium text-white mb-3">Progreso del Constructor</h2>
      
      <div className="relative">
        {/* Línea de progreso */}
        {stages.length > 0 && (
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-codestorm-blue/20 z-0"></div>
        )}
        
        <div className="space-y-2 relative z-10">
          {stages.map((stage, index) => {
            const isCurrent = stage.id === currentStageId;
            
            return (
              <div 
                key={stage.id} 
                className={`flex items-start p-2 rounded-md transition-colors ${
                  getStageBackgroundColor(stage, isCurrent)
                } ${onSelectStage ? 'cursor-pointer hover:bg-codestorm-blue/20' : ''}`}
                onClick={() => onSelectStage && onSelectStage(stage.id)}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-codestorm-blue/20 mr-3">
                  {getAgentIcon(stage.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-white">{stage.title}</h3>
                    <div className="flex items-center">
                      {getStatusIcon(stage.status)}
                      <span className="text-xs ml-1 text-gray-400">
                        {getStatusText(stage.status)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-1">{stage.description}</p>
                  
                  {stage.feedback && (
                    <div className="mt-2 text-xs bg-codestorm-blue/10 p-2 rounded-md border border-codestorm-blue/20">
                      <span className="text-gray-400">Comentarios:</span>
                      <p className="text-white mt-1">{stage.feedback}</p>
                    </div>
                  )}
                  
                  {/* Indicador de tiempo */}
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      {new Date(stage.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {stages.length === 0 && (
        <div className="text-gray-400 text-sm text-center py-4">
          No hay etapas activas
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
