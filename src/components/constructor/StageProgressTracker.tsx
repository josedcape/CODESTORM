import React from 'react';
import { ApprovalStage, FileItem } from '../../types';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart2,
  FileText,
  Code,
  Folder,
  Zap,
  ArrowRight,
  ChevronRight,
  Plus,
  Edit,
  Trash
} from 'lucide-react';

interface StageProgressTrackerProps {
  stages: ApprovalStage[];
  files: FileItem[];
  currentStageId: string;
  onViewStage: (stageId: string) => void;
  onNextStage?: () => void;
  canAdvanceToNextStage?: boolean;
}

const StageProgressTracker: React.FC<StageProgressTrackerProps> = ({
  stages,
  files,
  currentStageId,
  onViewStage,
  onNextStage,
  canAdvanceToNextStage = false
}) => {
  // Calcular el progreso general del proyecto
  const calculateProgress = () => {
    if (stages.length === 0) return 0;
    
    const completedStages = stages.filter(stage => stage.status === 'approved').length;
    return Math.round((completedStages / stages.length) * 100);
  };
  
  // Calcular el progreso de la etapa actual
  const calculateCurrentStageProgress = () => {
    const currentStage = stages.find(stage => stage.id === currentStageId);
    
    if (!currentStage || !currentStage.changes || currentStage.changes.length === 0) {
      return currentStage?.status === 'approved' ? 100 : 0;
    }
    
    const approvedChanges = currentStage.changes.filter(change => change.isApproved).length;
    return Math.round((approvedChanges / currentStage.changes.length) * 100);
  };
  
  // Obtener estadísticas de archivos
  const getFileStats = () => {
    const totalFiles = files.length;
    const jsFiles = files.filter(file => file.language === 'javascript' || file.language === 'typescript').length;
    const cssFiles = files.filter(file => file.language === 'css' || file.language === 'scss').length;
    const htmlFiles = files.filter(file => file.language === 'html').length;
    const otherFiles = totalFiles - jsFiles - cssFiles - htmlFiles;
    
    return { totalFiles, jsFiles, cssFiles, htmlFiles, otherFiles };
  };
  
  // Obtener estadísticas de cambios
  const getChangeStats = () => {
    let created = 0;
    let modified = 0;
    let deleted = 0;
    
    stages.forEach(stage => {
      if (stage.changes) {
        created += stage.changes.filter(change => change.type === 'create').length;
        modified += stage.changes.filter(change => change.type === 'modify').length;
        deleted += stage.changes.filter(change => change.type === 'delete').length;
      }
    });
    
    return { created, modified, deleted };
  };
  
  // Obtener la etapa actual
  const currentStage = stages.find(stage => stage.id === currentStageId);
  
  // Obtener estadísticas
  const fileStats = getFileStats();
  const changeStats = getChangeStats();
  
  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md border border-codestorm-blue/30 p-4">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
        <BarChart2 className="h-5 w-5 mr-2 text-codestorm-accent" />
        Progreso del Proyecto
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Progreso general */}
        <div className="bg-codestorm-darker rounded-lg p-4 border border-codestorm-blue/20">
          <h3 className="text-white text-sm font-medium mb-2">Progreso General</h3>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400">Etapas completadas: {stages.filter(stage => stage.status === 'approved').length}/{stages.length}</span>
            <span className="text-sm text-white font-medium">{calculateProgress()}%</span>
          </div>
          <div className="h-2 bg-codestorm-blue/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-codestorm-accent"
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="bg-codestorm-blue/5 rounded-md p-2 flex flex-col items-center">
              <div className="text-2xl font-bold text-white">{stages.length}</div>
              <div className="text-xs text-gray-400">Etapas Totales</div>
            </div>
            <div className="bg-codestorm-blue/5 rounded-md p-2 flex flex-col items-center">
              <div className="text-2xl font-bold text-green-400">{stages.filter(stage => stage.status === 'approved').length}</div>
              <div className="text-xs text-gray-400">Etapas Aprobadas</div>
            </div>
          </div>
        </div>
        
        {/* Progreso de la etapa actual */}
        <div className="bg-codestorm-darker rounded-lg p-4 border border-codestorm-blue/20">
          <h3 className="text-white text-sm font-medium mb-2">Etapa Actual</h3>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400">
              {currentStage?.title || 'No hay etapa actual'}
            </span>
            <span className="text-sm text-white font-medium">{calculateCurrentStageProgress()}%</span>
          </div>
          <div className="h-2 bg-codestorm-blue/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-codestorm-accent"
              style={{ width: `${calculateCurrentStageProgress()}%` }}
            ></div>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="bg-codestorm-blue/5 rounded-md p-2 flex flex-col items-center">
              <div className="text-xl font-bold text-white">
                {currentStage?.changes?.length || 0}
              </div>
              <div className="text-xs text-gray-400">Cambios</div>
            </div>
            <div className="bg-codestorm-blue/5 rounded-md p-2 flex flex-col items-center">
              <div className="text-xl font-bold text-green-400">
                {currentStage?.changes?.filter(c => c.isApproved).length || 0}
              </div>
              <div className="text-xs text-gray-400">Aprobados</div>
            </div>
            <div className="bg-codestorm-blue/5 rounded-md p-2 flex flex-col items-center">
              <div className="text-xl font-bold text-red-400">
                {currentStage?.changes?.filter(c => c.isRejected).length || 0}
              </div>
              <div className="text-xs text-gray-400">Rechazados</div>
            </div>
          </div>
          
          {currentStage && (
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => onViewStage(currentStage.id)}
                className="px-3 py-1 bg-codestorm-blue/20 hover:bg-codestorm-blue/30 text-white rounded-md text-xs flex items-center transition-colors"
              >
                <ChevronRight className="h-3 w-3 mr-1" />
                <span>Ver Detalles</span>
              </button>
              
              {currentStage.status === 'approved' && onNextStage && (
                <button
                  onClick={onNextStage}
                  className={`px-3 py-1 rounded-md text-xs flex items-center transition-colors ${
                    canAdvanceToNextStage
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!canAdvanceToNextStage}
                >
                  <ArrowRight className="h-3 w-3 mr-1" />
                  <span>Siguiente Etapa</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estadísticas de archivos */}
        <div className="bg-codestorm-darker rounded-lg p-4 border border-codestorm-blue/20">
          <h3 className="text-white text-sm font-medium mb-3 flex items-center">
            <FileText className="h-4 w-4 mr-2 text-blue-400" />
            Estadísticas de Archivos
          </h3>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">Total de archivos</span>
                <span className="text-xs text-white">{fileStats.totalFiles}</span>
              </div>
              <div className="h-2 bg-codestorm-blue/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '100%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">JavaScript/TypeScript</span>
                <span className="text-xs text-white">{fileStats.jsFiles}</span>
              </div>
              <div className="h-2 bg-codestorm-blue/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500"
                  style={{ width: `${fileStats.totalFiles ? (fileStats.jsFiles / fileStats.totalFiles) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">CSS/SCSS</span>
                <span className="text-xs text-white">{fileStats.cssFiles}</span>
              </div>
              <div className="h-2 bg-codestorm-blue/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500"
                  style={{ width: `${fileStats.totalFiles ? (fileStats.cssFiles / fileStats.totalFiles) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">HTML</span>
                <span className="text-xs text-white">{fileStats.htmlFiles}</span>
              </div>
              <div className="h-2 bg-codestorm-blue/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500"
                  style={{ width: `${fileStats.totalFiles ? (fileStats.htmlFiles / fileStats.totalFiles) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">Otros</span>
                <span className="text-xs text-white">{fileStats.otherFiles}</span>
              </div>
              <div className="h-2 bg-codestorm-blue/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500"
                  style={{ width: `${fileStats.totalFiles ? (fileStats.otherFiles / fileStats.totalFiles) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Estadísticas de cambios */}
        <div className="bg-codestorm-darker rounded-lg p-4 border border-codestorm-blue/20">
          <h3 className="text-white text-sm font-medium mb-3 flex items-center">
            <Code className="h-4 w-4 mr-2 text-green-400" />
            Estadísticas de Cambios
          </h3>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-codestorm-blue/5 rounded-md p-3 flex flex-col items-center">
              <Plus className="h-5 w-5 text-green-400 mb-1" />
              <div className="text-xl font-bold text-white">{changeStats.created}</div>
              <div className="text-xs text-gray-400">Creados</div>
            </div>
            
            <div className="bg-codestorm-blue/5 rounded-md p-3 flex flex-col items-center">
              <Edit className="h-5 w-5 text-blue-400 mb-1" />
              <div className="text-xl font-bold text-white">{changeStats.modified}</div>
              <div className="text-xs text-gray-400">Modificados</div>
            </div>
            
            <div className="bg-codestorm-blue/5 rounded-md p-3 flex flex-col items-center">
              <Trash className="h-5 w-5 text-red-400 mb-1" />
              <div className="text-xl font-bold text-white">{changeStats.deleted}</div>
              <div className="text-xs text-gray-400">Eliminados</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-white text-xs font-medium mb-2">Distribución de Cambios</h4>
            <div className="h-4 bg-codestorm-blue/10 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-green-500"
                style={{ 
                  width: `${
                    changeStats.created + changeStats.modified + changeStats.deleted > 0
                      ? (changeStats.created / (changeStats.created + changeStats.modified + changeStats.deleted)) * 100
                      : 0
                  }%` 
                }}
              ></div>
              <div 
                className="h-full bg-blue-500"
                style={{ 
                  width: `${
                    changeStats.created + changeStats.modified + changeStats.deleted > 0
                      ? (changeStats.modified / (changeStats.created + changeStats.modified + changeStats.deleted)) * 100
                      : 0
                  }%` 
                }}
              ></div>
              <div 
                className="h-full bg-red-500"
                style={{ 
                  width: `${
                    changeStats.created + changeStats.modified + changeStats.deleted > 0
                      ? (changeStats.deleted / (changeStats.created + changeStats.modified + changeStats.deleted)) * 100
                      : 0
                  }%` 
                }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-400">
              <span>Creados</span>
              <span>Modificados</span>
              <span>Eliminados</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StageProgressTracker;
