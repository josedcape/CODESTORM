import React, { useState } from 'react';
import { HistoryEvent, ProjectHistory, StageDocumentation } from '../../types';
import { 
  Clock, 
  Code, 
  FileText, 
  Flag, 
  Info, 
  Lightbulb, 
  MessageSquare, 
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Calendar,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface HistoryTimelineProps {
  history: ProjectHistory;
  onEventClick?: (event: HistoryEvent) => void;
  onStageClick?: (stage: StageDocumentation) => void;
  className?: string;
}

const HistoryTimeline: React.FC<HistoryTimelineProps> = ({
  history,
  onEventClick,
  onStageClick,
  className = ''
}) => {
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<string>('all');
  const [expandAll, setExpandAll] = useState(false);

  // Función para alternar la expansión de una etapa
  const toggleStage = (stageId: string) => {
    setExpandedStages(prev => ({
      ...prev,
      [stageId]: !prev[stageId]
    }));
  };

  // Función para expandir o colapsar todas las etapas
  const toggleExpandAll = () => {
    const newExpandAll = !expandAll;
    setExpandAll(newExpandAll);
    
    const newExpandedStages: Record<string, boolean> = {};
    history.stages.forEach(stage => {
      newExpandedStages[stage.stageId] = newExpandAll;
    });
    
    setExpandedStages(newExpandedStages);
  };

  // Función para obtener el icono según el tipo de evento
  const getEventIcon = (event: HistoryEvent) => {
    switch (event.type) {
      case 'stage-start':
        return <Flag className="w-4 h-4 text-green-400" />;
      case 'stage-complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'code-generated':
        return <Code className="w-4 h-4 text-blue-400" />;
      case 'file-created':
        return <FileText className="w-4 h-4 text-yellow-400" />;
      case 'file-modified':
        return <FileText className="w-4 h-4 text-orange-400" />;
      case 'decision-made':
        return <Lightbulb className="w-4 h-4 text-purple-400" />;
      case 'user-feedback':
        return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'milestone':
        return <Flag className="w-4 h-4 text-codestorm-gold" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  // Función para obtener el color de fondo según la importancia
  const getImportanceClass = (importance: 'high' | 'medium' | 'low') => {
    switch (importance) {
      case 'high':
        return 'border-l-4 border-l-codestorm-gold';
      case 'medium':
        return 'border-l-2 border-l-blue-500';
      case 'low':
        return 'border-l border-l-gray-500';
      default:
        return '';
    }
  };

  // Filtrar eventos según el filtro seleccionado
  const filteredEvents = history.events.filter(event => {
    if (filter === 'all') return true;
    return event.type === filter;
  });

  // Agrupar eventos por etapa
  const eventsByStage: Record<string, HistoryEvent[]> = {};
  
  // Inicializar con todas las etapas
  history.stages.forEach(stage => {
    eventsByStage[stage.stageId] = [];
  });
  
  // Agrupar eventos
  filteredEvents.forEach(event => {
    if (event.stageId) {
      if (!eventsByStage[event.stageId]) {
        eventsByStage[event.stageId] = [];
      }
      eventsByStage[event.stageId].push(event);
    }
  });

  // Formatear fecha
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className={`bg-codestorm-dark border border-codestorm-blue/30 rounded-lg shadow-md ${className}`}>
      <div className="p-4 border-b border-codestorm-blue/30 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Historial del Proyecto</h3>
        
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-codestorm-darker text-gray-300 text-sm rounded-md border border-codestorm-blue/30 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Todos los eventos</option>
            <option value="stage-start">Inicio de etapa</option>
            <option value="stage-complete">Fin de etapa</option>
            <option value="code-generated">Código generado</option>
            <option value="file-created">Archivo creado</option>
            <option value="file-modified">Archivo modificado</option>
            <option value="decision-made">Decisión tomada</option>
            <option value="user-feedback">Feedback de usuario</option>
            <option value="milestone">Hitos</option>
            <option value="error">Errores</option>
          </select>
          
          <button
            onClick={toggleExpandAll}
            className="bg-blue-900/30 hover:bg-blue-800/40 border border-blue-500/30 rounded-md px-2 py-1 text-sm text-blue-300 transition-all duration-300 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)]"
          >
            {expandAll ? 'Colapsar todo' : 'Expandir todo'}
          </button>
        </div>
      </div>
      
      <div className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        {history.stages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No hay etapas registradas en el historial
          </div>
        ) : (
          <div className="space-y-4">
            {history.stages.map((stage) => (
              <div 
                key={stage.stageId} 
                className="bg-codestorm-darker rounded-lg border border-codestorm-blue/20 overflow-hidden"
              >
                <div 
                  className="p-3 bg-blue-900/30 flex items-center justify-between cursor-pointer hover:bg-blue-900/40 transition-colors"
                  onClick={() => toggleStage(stage.stageId)}
                >
                  <div className="flex items-center space-x-2">
                    {stage.stageType === 'planner' ? (
                      <Lightbulb className="w-5 h-5 text-codestorm-gold" />
                    ) : stage.stageType === 'codeGenerator' ? (
                      <Code className="w-5 h-5 text-blue-400" />
                    ) : stage.stageType === 'fileSynchronizer' ? (
                      <ArrowRight className="w-5 h-5 text-green-400" />
                    ) : stage.stageType === 'codeModifier' ? (
                      <FileText className="w-5 h-5 text-orange-400" />
                    ) : stage.stageType === 'fileObserver' ? (
                      <Info className="w-5 h-5 text-purple-400" />
                    ) : stage.stageType === 'seguimiento' ? (
                      <Clock className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Info className="w-5 h-5 text-gray-400" />
                    )}
                    <h4 className="font-medium text-white">{stage.title}</h4>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-400 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(stage.startTime)}
                    </span>
                    
                    {expandedStages[stage.stageId] ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {expandedStages[stage.stageId] && (
                  <div className="p-3 space-y-3">
                    <div className="text-sm text-gray-300 mb-4">
                      {stage.description}
                    </div>
                    
                    {eventsByStage[stage.stageId]?.length > 0 ? (
                      <div className="space-y-2 pl-4 border-l border-codestorm-blue/20">
                        {eventsByStage[stage.stageId].map((event) => (
                          <div 
                            key={event.id}
                            className={`p-2 rounded-md bg-codestorm-dark/50 hover:bg-codestorm-dark cursor-pointer ${getImportanceClass(event.importance)}`}
                            onClick={() => onEventClick && onEventClick(event)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {getEventIcon(event)}
                                <span className="text-sm font-medium text-gray-200">{event.title}</span>
                              </div>
                              <span className="text-xs text-gray-400">{formatDate(event.timestamp)}</span>
                            </div>
                            
                            <div className="mt-1 text-xs text-gray-400 line-clamp-2">
                              {event.description}
                            </div>
                            
                            {event.relatedFiles && event.relatedFiles.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {event.relatedFiles.map((file, index) => (
                                  <span 
                                    key={index}
                                    className="text-xs bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded-sm"
                                  >
                                    {file}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-gray-500 text-sm">
                        No hay eventos para esta etapa
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTimeline;
