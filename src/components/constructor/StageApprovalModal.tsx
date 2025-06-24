import React, { useState, useEffect } from 'react';
import { ApprovalStage, StageChange, FileItem } from '../../types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  CheckCircle,
  XCircle,
  PenTool,
  Brain,
  Code,
  RefreshCw,
  FileEdit,
  Clock,
  AlertTriangle,
  X,
  Maximize2,
  Minimize2,
  Info,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash,
  Edit,
  ArrowRight,
  FileText,
  BarChart2,
  List
} from 'lucide-react';
import DetailedChangesViewer from './DetailedChangesViewer';

interface StageApprovalModalProps {
  stage: ApprovalStage | null;
  onApprove: (stageId: string, feedback?: string) => void;
  onModify: (stageId: string, feedback: string) => void;
  onReject: (stageId: string, feedback: string) => void;
  onNextStage?: () => void;
  canAdvanceToNextStage?: boolean;
  isPaused?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onApproveChange?: (stageId: string, changeId: string) => void;
  onRejectChange?: (stageId: string, changeId: string) => void;
  originalFiles?: FileItem[]; // Archivos originales para comparar cambios
}

const StageApprovalModal: React.FC<StageApprovalModalProps> = ({
  stage,
  onApprove,
  onModify,
  onReject,
  onNextStage,
  canAdvanceToNextStage = false,
  isPaused = false,
  isOpen,
  onClose,
  onApproveChange,
  onRejectChange,
  originalFiles = []
}) => {
  const [feedback, setFeedback] = useState('');
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [expandedChanges, setExpandedChanges] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'proposal' | 'changes' | 'detailed' | 'metrics'>('proposal');

  // Limpiar el feedback cuando cambia la etapa
  useEffect(() => {
    setFeedback('');
  }, [stage?.id]);

  // Si no está abierto, no renderizar nada
  if (!isOpen) return null;

  // Si no hay etapa, mostrar mensaje
  if (!stage) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-codestorm-dark rounded-lg shadow-md p-6 border border-codestorm-blue/30 w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-white">Etapa Actual</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-codestorm-blue/20 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center text-gray-400 py-8">
            <Clock className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-center text-lg">
              No hay etapa activa para revisar
            </p>
            <p className="text-center text-sm mt-2">
              Inicia un nuevo proyecto o espera a que se genere la siguiente etapa
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Función para obtener el icono según el tipo de agente
  const getAgentIcon = () => {
    switch (stage.type) {
      case 'planner':
        return <Brain className="h-6 w-6 text-purple-400" />;
      case 'codeGenerator':
        return <Code className="h-6 w-6 text-blue-400" />;
      case 'fileSynchronizer':
        return <RefreshCw className="h-6 w-6 text-green-400" />;
      case 'codeModifier':
        return <FileEdit className="h-6 w-6 text-yellow-400" />;
      default:
        return <Code className="h-6 w-6 text-gray-400" />;
    }
  };

  // Función para obtener el nombre del agente
  const getAgentName = () => {
    switch (stage.type) {
      case 'planner':
        return 'Agente de Planificación';
      case 'codeGenerator':
        return 'Agente de Generación de Código';
      case 'fileSynchronizer':
        return 'Agente de Sincronización de Archivos';
      case 'codeModifier':
        return 'Agente de Modificación de Código';
      default:
        return 'Agente Desconocido';
    }
  };

  // Función para renderizar el contenido de la propuesta
  const renderProposal = () => {
    // Intentar parsear como JSON para una mejor visualización
    if (showJsonPreview) {
      try {
        const parsedJson = JSON.parse(stage.proposal);
        return (
          <SyntaxHighlighter
            language="json"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: '#0a1120',
              borderRadius: '0.375rem',
              maxHeight: isFullscreen ? 'calc(70vh - 200px)' : '300px',
              overflowY: 'auto'
            }}
            showLineNumbers
          >
            {JSON.stringify(parsedJson, null, 2)}
          </SyntaxHighlighter>
        );
      } catch (e) {
        // Si no es JSON válido, mostrar como texto plano
        return (
          <pre className="text-white text-sm whitespace-pre-wrap font-mono bg-codestorm-darker rounded-md p-4 max-h-[300px] overflow-y-auto">
            {stage.proposal}
          </pre>
        );
      }
    } else {
      // Mostrar como texto plano
      return (
        <pre className={`text-white text-sm whitespace-pre-wrap font-mono bg-codestorm-darker rounded-md p-4 overflow-y-auto ${
          isFullscreen ? 'max-h-[calc(70vh-200px)]' : 'max-h-[300px]'
        }`}>
          {stage.proposal}
        </pre>
      );
    }
  };

  // Función para manejar la aprobación
  const handleApprove = () => {
    onApprove(stage.id, feedback || undefined);
    onClose();
  };

  // Función para manejar la modificación
  const handleModify = () => {
    if (!feedback.trim()) return;
    onModify(stage.id, feedback);
    onClose();
  };

  // Función para manejar el rechazo
  const handleReject = () => {
    if (!feedback.trim()) return;
    onReject(stage.id, feedback);
    onClose();
  };

  // Función para alternar el modo de pantalla completa
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Función para alternar la expansión de un cambio
  const toggleChange = (changeId: string) => {
    setExpandedChanges(prev =>
      prev.includes(changeId)
        ? prev.filter(id => id !== changeId)
        : [...prev, changeId]
    );
  };

  // Función para obtener el icono según el tipo de cambio
  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'create':
        return <Plus className="h-4 w-4 text-green-400" />;
      case 'modify':
        return <Edit className="h-4 w-4 text-blue-400" />;
      case 'delete':
        return <Trash className="h-4 w-4 text-red-400" />;
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`bg-codestorm-dark rounded-lg shadow-md border border-codestorm-blue/30 overflow-hidden transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-4 w-auto h-auto'
          : 'w-full max-w-2xl max-h-[90vh] overflow-y-auto'
      }`}>
        <div className="sticky top-0 bg-codestorm-dark border-b border-codestorm-blue/30 p-4 flex items-center justify-between z-10">
          <div className="flex items-center">
            {getAgentIcon()}
            <div className="ml-3">
              <h2 className="text-lg font-medium text-white">{stage.title}</h2>
              <p className="text-sm text-gray-400">{getAgentName()}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-md hover:bg-codestorm-blue/20 text-gray-400 hover:text-white"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-codestorm-blue/20 text-gray-400 hover:text-white"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-300 text-sm mb-4">{stage.description}</p>

          {/* Pestañas para alternar entre propuesta y cambios */}
          {stage.isGrouped && stage.changes && stage.changes.length > 0 && (
            <div className="flex flex-wrap border-b border-codestorm-blue/20 mb-4">
              <button
                className={`px-3 py-1.5 text-sm ${
                  activeTab === 'proposal'
                    ? 'text-white border-b-2 border-codestorm-accent'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('proposal')}
              >
                Propuesta
              </button>
              <button
                className={`px-3 py-1.5 text-sm ${
                  activeTab === 'changes'
                    ? 'text-white border-b-2 border-codestorm-accent'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('changes')}
              >
                <List className="h-3 w-3 inline-block mr-1" />
                Cambios ({stage.changes.length})
              </button>
              <button
                className={`px-3 py-1.5 text-sm ${
                  activeTab === 'detailed'
                    ? 'text-white border-b-2 border-codestorm-accent'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('detailed')}
              >
                <Code className="h-3 w-3 inline-block mr-1" />
                Detallado
              </button>
              <button
                className={`px-3 py-1.5 text-sm ${
                  activeTab === 'metrics'
                    ? 'text-white border-b-2 border-codestorm-accent'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('metrics')}
              >
                <BarChart2 className="h-3 w-3 inline-block mr-1" />
                Métricas
              </button>
            </div>
          )}

          {/* Indicador de estado */}
          <div className="flex justify-between items-center mb-4">
            <div className={`px-3 py-1 rounded-full text-xs ${
              stage.status === 'approved' ? 'bg-green-500/20 text-green-400' :
              stage.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
              stage.status === 'modified' ? 'bg-blue-500/20 text-blue-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {stage.status === 'approved' ? 'Aprobado' :
               stage.status === 'pending' ? 'Pendiente' :
               stage.status === 'modified' ? 'Modificado' :
               'Rechazado'}
            </div>

            <div className="text-xs text-gray-400">
              {new Date(stage.timestamp).toLocaleString()}
            </div>
          </div>

          {/* Mensaje de pausa */}
          {isPaused && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3 mb-4 flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium">Proceso en pausa</p>
                <p className="text-sm text-gray-300 mt-1">
                  El proceso está en pausa debido a una solicitud de modificación o rechazo.
                  Revisa los comentarios y realiza los cambios necesarios.
                </p>
              </div>
            </div>
          )}

          {/* Propuesta */}
          {(!stage.isGrouped || activeTab === 'proposal') && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium">Propuesta</h3>

                {/* Toggle para cambiar la visualización */}
                {stage.type === 'planner' && (
                  <button
                    onClick={() => setShowJsonPreview(!showJsonPreview)}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    {showJsonPreview ? 'Ver como texto' : 'Ver como JSON'}
                  </button>
                )}
              </div>

              {renderProposal()}
            </div>
          )}

          {/* Cambios agrupados */}
          {stage.isGrouped && stage.changes && stage.changes.length > 0 && activeTab === 'changes' && (
            <div className="mb-4">
              <h3 className="text-white font-medium mb-2">Cambios Propuestos</h3>
              <div className="space-y-2">
                {stage.changes.map((change) => (
                  <div
                    key={change.id}
                    className="bg-codestorm-darker rounded-md border border-codestorm-blue/30 overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-codestorm-blue/10"
                      onClick={() => toggleChange(change.id)}
                    >
                      <div className="flex items-center">
                        {getChangeIcon(change.type)}
                        <div className="ml-2">
                          <p className="text-white text-sm">{change.title}</p>
                          <p className="text-gray-400 text-xs">{change.path}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {change.isApproved && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs mr-2">
                            Aprobado
                          </span>
                        )}
                        {change.isRejected && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs mr-2">
                            Rechazado
                          </span>
                        )}
                        {expandedChanges.includes(change.id) ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {expandedChanges.includes(change.id) && (
                      <div className="p-3 border-t border-codestorm-blue/30">
                        <p className="text-gray-300 text-sm mb-3">{change.description}</p>

                        {change.content && (
                          <div className="mb-3">
                            <p className="text-gray-300 text-xs mb-1">Contenido:</p>
                            <SyntaxHighlighter
                              language={change.language || 'javascript'}
                              style={vscDarkPlus}
                              customStyle={{
                                margin: 0,
                                padding: '0.75rem',
                                background: '#0a1120',
                                borderRadius: '0.375rem',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                fontSize: '0.75rem'
                              }}
                              showLineNumbers
                            >
                              {change.content}
                            </SyntaxHighlighter>
                          </div>
                        )}

                        {!change.isApproved && !change.isRejected && onApproveChange && onRejectChange && (
                          <div className="flex space-x-2 mt-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onApproveChange(stage.id, change.id);
                              }}
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs flex items-center transition-colors"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              <span>Aprobar</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRejectChange(stage.id, change.id);
                              }}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs flex items-center transition-colors"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              <span>Rechazar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visualización detallada de cambios */}
          {stage.isGrouped && stage.changes && stage.changes.length > 0 && activeTab === 'detailed' && (
            <div className="mb-4">
              <DetailedChangesViewer
                changes={stage.changes}
                originalFiles={originalFiles}
                onApproveChange={(changeId) => onApproveChange && onApproveChange(stage.id, changeId)}
                onRejectChange={(changeId) => onRejectChange && onRejectChange(stage.id, changeId)}
              />
            </div>
          )}

          {/* Métricas de cambios */}
          {stage.isGrouped && stage.changes && stage.changes.length > 0 && activeTab === 'metrics' && (
            <div className="mb-4">
              <h3 className="text-white font-medium mb-2">Métricas de Cambios</h3>
              <div className="bg-codestorm-darker rounded-lg p-4 border border-codestorm-blue/30">
                {/* Resumen de cambios */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-codestorm-blue/10 rounded-md p-3 border border-codestorm-blue/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 text-xs">Archivos creados</span>
                      <Plus className="h-4 w-4 text-green-400" />
                    </div>
                    <p className="text-2xl font-semibold text-white">
                      {stage.changes.filter(c => c.type === 'create').length}
                    </p>
                  </div>

                  <div className="bg-codestorm-blue/10 rounded-md p-3 border border-codestorm-blue/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 text-xs">Archivos modificados</span>
                      <Edit className="h-4 w-4 text-blue-400" />
                    </div>
                    <p className="text-2xl font-semibold text-white">
                      {stage.changes.filter(c => c.type === 'modify').length}
                    </p>
                  </div>

                  <div className="bg-codestorm-blue/10 rounded-md p-3 border border-codestorm-blue/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 text-xs">Archivos eliminados</span>
                      <Trash className="h-4 w-4 text-red-400" />
                    </div>
                    <p className="text-2xl font-semibold text-white">
                      {stage.changes.filter(c => c.type === 'delete').length}
                    </p>
                  </div>
                </div>

                {/* Distribución por lenguaje */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-white mb-2">Distribución por lenguaje</h4>
                  <div className="space-y-2">
                    {Object.entries(
                      stage.changes.reduce((acc, change) => {
                        const lang = change.language || 'desconocido';
                        acc[lang] = (acc[lang] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([language, count]) => (
                      <div key={language} className="flex items-center">
                        <div className="w-24 text-xs text-gray-300">{language}</div>
                        <div className="flex-1 h-2 bg-codestorm-darker rounded-full overflow-hidden">
                          <div
                            className="h-full bg-codestorm-accent"
                            style={{ width: `${(count / stage.changes.length) * 100}%` }}
                          ></div>
                        </div>
                        <div className="w-8 text-right text-xs text-gray-300 ml-2">{count}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Estado de aprobación */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Estado de aprobación</h4>
                  <div className="flex items-center mb-2">
                    <div className="flex-1 h-4 bg-codestorm-darker rounded-full overflow-hidden">
                      <div className="flex h-full">
                        <div
                          className="h-full bg-green-500"
                          style={{
                            width: `${(stage.changes.filter(c => c.isApproved).length / stage.changes.length) * 100}%`
                          }}
                        ></div>
                        <div
                          className="h-full bg-red-500"
                          style={{
                            width: `${(stage.changes.filter(c => c.isRejected).length / stage.changes.length) * 100}%`
                          }}
                        ></div>
                        <div
                          className="h-full bg-gray-500"
                          style={{
                            width: `${(stage.changes.filter(c => !c.isApproved && !c.isRejected).length / stage.changes.length) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                      <span className="text-gray-300">Aprobados: {stage.changes.filter(c => c.isApproved).length}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                      <span className="text-gray-300">Rechazados: {stage.changes.filter(c => c.isRejected).length}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-500 rounded-full mr-1"></div>
                      <span className="text-gray-300">Pendientes: {stage.changes.filter(c => !c.isApproved && !c.isRejected).length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comentarios anteriores */}
          {stage.feedback && (
            <div className="mb-4">
              <h3 className="text-white font-medium mb-2">Comentarios anteriores</h3>
              <div className="bg-codestorm-blue/10 rounded-md p-3 border border-codestorm-blue/30">
                <p className="text-sm text-white">{stage.feedback}</p>
              </div>
            </div>
          )}

          {/* Mensaje informativo sobre la necesidad de tomar una decisión */}
          {stage.status === 'pending' && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-md p-3 mb-4 flex items-start">
              <Info className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-400 font-medium">Acción requerida</p>
                <p className="text-sm text-gray-300 mt-1">
                  Debes aprobar o rechazar esta etapa para continuar con el proceso de desarrollo.
                  No podrás avanzar a la siguiente etapa hasta que tomes una decisión.
                </p>
              </div>
            </div>
          )}

          {/* Mensaje de validación si existe */}
          {validationMessage && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3 mb-4 flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-400">{validationMessage}</p>
            </div>
          )}

          {/* Formulario de comentarios */}
          {stage.status === 'pending' && (
            <>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-1">Comentarios o modificaciones:</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full bg-codestorm-darker border border-codestorm-blue/30 rounded-md p-3 text-white text-sm"
                  rows={3}
                  placeholder="Opcional: Añade comentarios o solicita modificaciones específicas..."
                />
              </div>

              <div className="flex flex-col space-y-3">
                <div className="flex space-x-3">
                  <button
                    onClick={handleApprove}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm flex items-center justify-center transition-colors"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Aprobar</span>
                  </button>
                  <button
                    onClick={handleModify}
                    className={`flex-1 px-4 py-2 ${
                      !feedback.trim()
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } rounded-md text-sm flex items-center justify-center transition-colors`}
                    disabled={!feedback.trim()}
                  >
                    <PenTool className="h-4 w-4 mr-2" />
                    <span>Modificar</span>
                  </button>
                  <button
                    onClick={handleReject}
                    className={`flex-1 px-4 py-2 ${
                      !feedback.trim()
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    } rounded-md text-sm flex items-center justify-center transition-colors`}
                    disabled={!feedback.trim()}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    <span>Rechazar</span>
                  </button>
                </div>

                {/* Botón para avanzar a la siguiente etapa */}
                {stage.status === 'approved' && onNextStage && (
                  <button
                    onClick={onNextStage}
                    className={`px-4 py-2 rounded-md text-sm flex items-center justify-center transition-colors ${
                      canAdvanceToNextStage
                        ? 'bg-codestorm-accent hover:bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!canAdvanceToNextStage}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    <span>Avanzar a la Siguiente Etapa</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StageApprovalModal;
