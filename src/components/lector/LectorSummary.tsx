import React from 'react';
import { FileAnalysis, FileChangeAnalysis, FileAnalysisLevel } from '../../types';
import { 
  FileText, 
  AlertTriangle, 
  Info, 
  AlertCircle,
  Eye,
  ExternalLink
} from 'lucide-react';

interface LectorSummaryProps {
  fileAnalysis: FileAnalysis | null;
  changeAnalysis: FileChangeAnalysis | null;
  onViewDetails: () => void;
}

const LectorSummary: React.FC<LectorSummaryProps> = ({
  fileAnalysis,
  changeAnalysis,
  onViewDetails
}) => {
  if (!fileAnalysis) {
    return (
      <div className="bg-codestorm-darker rounded-lg p-4 border border-codestorm-blue/30 flex items-center">
        <Eye className="h-5 w-5 text-gray-400 mr-3" />
        <div>
          <p className="text-gray-300 text-sm">Analizando archivo...</p>
        </div>
      </div>
    );
  }
  
  // Contar impactos por nivel
  const impactCounts = {
    critical: 0,
    important: 0,
    normal: 0,
    info: 0
  };
  
  if (changeAnalysis) {
    changeAnalysis.impacts.forEach(impact => {
      impactCounts[impact.level]++;
    });
  }
  
  // Función para obtener el icono según el nivel de impacto
  const getImpactIcon = (level: FileAnalysisLevel) => {
    switch (level) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'important':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'normal':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-gray-400" />;
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };
  
  return (
    <div className="bg-codestorm-darker rounded-lg p-4 border border-codestorm-blue/30">
      <div className="flex items-start">
        <FileText className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-sm font-medium">
              Análisis de {fileAnalysis.path}
            </h3>
            <button
              onClick={onViewDetails}
              className="text-blue-400 hover:text-blue-300 text-xs flex items-center"
            >
              <span>Ver detalles</span>
              <ExternalLink className="h-3 w-3 ml-1" />
            </button>
          </div>
          
          <p className="text-gray-400 text-xs mt-1">
            {fileAnalysis.purpose} - {fileAnalysis.description}
          </p>
          
          {fileAnalysis.criticalAreas.length > 0 && (
            <div className="mt-2">
              <p className="text-gray-300 text-xs font-medium">Áreas críticas:</p>
              <ul className="mt-1 space-y-1">
                {fileAnalysis.criticalAreas.map((area, index) => (
                  <li key={index} className="text-gray-400 text-xs flex items-center">
                    <AlertTriangle className="h-3 w-3 text-red-500 mr-1.5 flex-shrink-0" />
                    {area.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {changeAnalysis && (
            <div className="mt-3 pt-3 border-t border-codestorm-blue/20">
              <p className="text-gray-300 text-xs font-medium">Impacto de los cambios:</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {impactCounts.critical > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-full px-2 py-0.5 text-xs flex items-center">
                    {getImpactIcon('critical')}
                    <span className="text-red-400 ml-1">{impactCounts.critical} críticos</span>
                  </div>
                )}
                {impactCounts.important > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-full px-2 py-0.5 text-xs flex items-center">
                    {getImpactIcon('important')}
                    <span className="text-yellow-400 ml-1">{impactCounts.important} importantes</span>
                  </div>
                )}
                {impactCounts.normal > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-full px-2 py-0.5 text-xs flex items-center">
                    {getImpactIcon('normal')}
                    <span className="text-blue-400 ml-1">{impactCounts.normal} normales</span>
                  </div>
                )}
                {(impactCounts.critical + impactCounts.important + impactCounts.normal) === 0 && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-full px-2 py-0.5 text-xs flex items-center">
                    <Info className="h-4 w-4 text-green-500" />
                    <span className="text-green-400 ml-1">Sin impactos significativos</span>
                  </div>
                )}
              </div>
              
              <p className="text-gray-400 text-xs mt-2">
                {changeAnalysis.recommendation}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LectorSummary;
