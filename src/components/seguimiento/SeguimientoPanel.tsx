import React, { useState, useEffect } from 'react';
import { HistoryEvent, ProjectHistory, StageDocumentation, SeguimientoState } from '../../types';
import HistoryTimeline from './HistoryTimeline';
import EventDetails from './EventDetails';
import { Clock, FileText, Info, Lightbulb, MessageSquare, RefreshCw, X } from 'lucide-react';

interface SeguimientoPanelProps {
  seguimientoState: SeguimientoState;
  onClose?: () => void;
  onRefresh?: () => void;
  onEventClick?: (event: HistoryEvent) => void;
  className?: string;
}

const SeguimientoPanel: React.FC<SeguimientoPanelProps> = ({
  seguimientoState,
  onClose,
  onRefresh,
  onEventClick,
  className = ''
}) => {
  const [selectedEvent, setSelectedEvent] = useState<HistoryEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'stats' | 'current'>('timeline');
  const [stats, setStats] = useState<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    totalStages: number;
    completedStages: number;
    totalFiles: number;
    totalDecisions: number;
  }>({
    totalEvents: 0,
    eventsByType: {},
    totalStages: 0,
    completedStages: 0,
    totalFiles: 0,
    totalDecisions: 0
  });

  // Calcular estadísticas cuando cambia el estado
  useEffect(() => {
    if (seguimientoState && seguimientoState.history) {
      const { history } = seguimientoState;
      
      // Contar eventos por tipo
      const eventsByType: Record<string, number> = {};
      history.events.forEach(event => {
        if (!eventsByType[event.type]) {
          eventsByType[event.type] = 0;
        }
        eventsByType[event.type]++;
      });
      
      // Contar etapas completadas
      const completedStages = history.stages.filter(stage => 
        stage.status === 'approved' || stage.endTime !== undefined
      ).length;
      
      // Contar archivos únicos
      const uniqueFiles = new Set<string>();
      history.stages.forEach(stage => {
        stage.files.forEach(file => {
          uniqueFiles.add(file.fileId);
        });
      });
      
      // Contar decisiones
      let totalDecisions = 0;
      history.stages.forEach(stage => {
        totalDecisions += stage.decisions.length;
      });
      
      setStats({
        totalEvents: history.events.length,
        eventsByType,
        totalStages: history.stages.length,
        completedStages,
        totalFiles: uniqueFiles.size,
        totalDecisions
      });
    }
  }, [seguimientoState]);

  // Manejar clic en un evento
  const handleEventClick = (event: HistoryEvent) => {
    setSelectedEvent(event);
    if (onEventClick) {
      onEventClick(event);
    }
  };

  // Obtener la etapa actual
  const getCurrentStage = (): StageDocumentation | undefined => {
    if (!seguimientoState.currentStageId || !seguimientoState.history) {
      return undefined;
    }
    
    return seguimientoState.history.stages.find(
      stage => stage.stageId === seguimientoState.currentStageId
    );
  };

  // Renderizar el contenido según la pestaña activa
  const renderContent = () => {
    switch (activeTab) {
      case 'timeline':
        return (
          <HistoryTimeline
            history={seguimientoState.history}
            onEventClick={handleEventClick}
            className="h-full"
          />
        );
      
      case 'stats':
        return (
          <div className="p-4 h-full overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-codestorm-darker p-4 rounded-lg border border-codestorm-blue/20">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Resumen del Proyecto</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Total de etapas:</span>
                    <span className="text-sm text-white">{stats.totalStages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Etapas completadas:</span>
                    <span className="text-sm text-white">{stats.completedStages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Progreso:</span>
                    <span className="text-sm text-white">
                      {stats.totalStages > 0 
                        ? Math.round((stats.completedStages / stats.totalStages) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-codestorm-dark rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ 
                        width: `${stats.totalStages > 0 
                          ? Math.round((stats.completedStages / stats.totalStages) * 100) 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-codestorm-darker p-4 rounded-lg border border-codestorm-blue/20">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Actividad</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Total de eventos:</span>
                    <span className="text-sm text-white">{stats.totalEvents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Archivos afectados:</span>
                    <span className="text-sm text-white">{stats.totalFiles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Decisiones tomadas:</span>
                    <span className="text-sm text-white">{stats.totalDecisions}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-codestorm-darker p-4 rounded-lg border border-codestorm-blue/20">
              <h4 className="text-sm font-medium text-gray-300 mb-4">Eventos por Tipo</h4>
              <div className="space-y-3">
                {Object.entries(stats.eventsByType).map(([type, count]) => (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">{type}:</span>
                      <span className="text-sm text-white">{count}</span>
                    </div>
                    <div className="w-full bg-codestorm-dark rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          type === 'stage-start' || type === 'stage-complete' ? 'bg-green-500' :
                          type === 'code-generated' ? 'bg-blue-500' :
                          type === 'file-created' || type === 'file-modified' ? 'bg-yellow-500' :
                          type === 'decision-made' ? 'bg-purple-500' :
                          type === 'user-feedback' ? 'bg-indigo-500' :
                          type === 'error' ? 'bg-red-500' :
                          type === 'milestone' ? 'bg-codestorm-gold' : 'bg-gray-500'
                        }`} 
                        style={{ 
                          width: `${Math.min(100, (count / stats.totalEvents) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'current':
        const currentStage = getCurrentStage();
        
        if (!currentStage) {
          return (
            <div className="flex items-center justify-center h-full text-gray-400">
              No hay una etapa activa actualmente
            </div>
          );
        }
        
        return (
          <div className="p-4 h-full overflow-y-auto">
            <div className="bg-codestorm-darker p-4 rounded-lg border border-codestorm-blue/20 mb-4">
              <h4 className="text-lg font-medium text-white mb-2">{currentStage.title}</h4>
              <p className="text-sm text-gray-300 mb-4">{currentStage.description}</p>
              
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center space-x-1 bg-codestorm-dark px-2 py-1 rounded-md">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">
                    Inicio: {new Date(currentStage.startTime).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1 bg-codestorm-dark px-2 py-1 rounded-md">
                  <Info className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">
                    Estado: {currentStage.status}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1 bg-codestorm-dark px-2 py-1 rounded-md">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">
                    Archivos: {currentStage.files.length}
                  </span>
                </div>
              </div>
            </div>
            
            {currentStage.events.length > 0 && (
              <div className="bg-codestorm-darker p-4 rounded-lg border border-codestorm-blue/20 mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Eventos Recientes</h4>
                <div className="space-y-2">
                  {currentStage.events.slice(0, 5).map(event => (
                    <div 
                      key={event.id}
                      className="p-2 rounded-md bg-codestorm-dark hover:bg-codestorm-dark/70 cursor-pointer"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">{event.title}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {currentStage.decisions.length > 0 && (
              <div className="bg-codestorm-darker p-4 rounded-lg border border-codestorm-blue/20">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Decisiones</h4>
                <div className="space-y-2">
                  {currentStage.decisions.map(decision => (
                    <div 
                      key={decision.id}
                      className="p-2 rounded-md bg-codestorm-dark"
                    >
                      <div className="flex items-start space-x-2">
                        <Lightbulb className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-300">{decision.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{decision.reasoning}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`bg-codestorm-dark border border-codestorm-blue/30 rounded-lg shadow-md flex flex-col ${className}`}>
      <div className="p-3 border-b border-codestorm-blue/30 flex justify-between items-center bg-blue-900/30">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-codestorm-gold" />
          <h3 className="text-lg font-medium text-white">Agente de Seguimiento</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-md hover:bg-codestorm-blue/20 text-gray-400 hover:text-white transition-colors"
              title="Actualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-codestorm-blue/20 text-gray-400 hover:text-white transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      <div className="border-b border-codestorm-blue/30 bg-codestorm-darker">
        <div className="flex">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'timeline' 
                ? 'text-white border-b-2 border-codestorm-gold' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('timeline')}
          >
            Línea de Tiempo
          </button>
          
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'stats' 
                ? 'text-white border-b-2 border-codestorm-gold' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('stats')}
          >
            Estadísticas
          </button>
          
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'current' 
                ? 'text-white border-b-2 border-codestorm-gold' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('current')}
          >
            Etapa Actual
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
      
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <EventDetails 
              event={selectedEvent} 
              onClose={() => setSelectedEvent(null)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SeguimientoPanel;
