import React, { useState, useEffect } from 'react';
import { ApprovalStage } from '../../types';
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
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Info
} from 'lucide-react';

interface StageSidebarProps {
  stage: ApprovalStage | null;
  onApprove: (stageId: string, feedback?: string) => void;
  onModify: (stageId: string, feedback: string) => void;
  onReject: (stageId: string, feedback: string) => void;
  isPaused?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

const StageSidebar: React.FC<StageSidebarProps> = ({
  stage,
  onApprove,
  onModify,
  onReject,
  isPaused = false,
  isOpen,
  onToggle
}) => {
  const [feedback, setFeedback] = useState('');
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  // Limpiar el feedback cuando cambia la etapa
  useEffect(() => {
    setFeedback('');
  }, [stage?.id]);

  // Si no hay etapa, mostrar mensaje
  if (!stage) {
    return isOpen ? (
      <div className={`fixed top-20 bottom-4 right-4 w-80 bg-codestorm-dark rounded-lg shadow-lg border border-codestorm-blue/30 flex flex-col z-40 transition-all duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-3 border-b border-codestorm-blue/30">
          <h3 className="text-white font-medium">Etapa Actual</h3>
          <div className="flex space-x-1">
            <button
              onClick={onToggle}
              className="p-1.5 rounded-md hover:bg-codestorm-blue/20 text-gray-400 hover:text-white"
              title="Cerrar panel"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 flex flex-col items-center justify-center text-gray-400">
          <Clock className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-center text-sm">
            No hay etapa activa para revisar
          </p>
        </div>
      </div>
    ) : (
      <button
        onClick={onToggle}
        className="fixed top-1/2 right-0 transform -translate-y-1/2 bg-codestorm-dark hover:bg-codestorm-darker border border-codestorm-blue/30 border-r-0 rounded-l-md p-2 text-white z-40"
        title="Mostrar etapa actual"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    );
  }

  // Función para obtener el icono según el tipo de agente
  const getAgentIcon = () => {
    switch (stage.type) {
      case 'planner':
        return <Brain className="h-5 w-5 text-purple-400" />;
      case 'codeGenerator':
        return <Code className="h-5 w-5 text-blue-400" />;
      case 'fileSynchronizer':
        return <RefreshCw className="h-5 w-5 text-green-400" />;
      case 'codeModifier':
        return <FileEdit className="h-5 w-5 text-yellow-400" />;
      default:
        return <Code className="h-5 w-5 text-gray-400" />;
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
              padding: '0.75rem',
              background: '#0a1120',
              borderRadius: '0.375rem',
              maxHeight: '200px',
              overflowY: 'auto',
              fontSize: '0.75rem'
            }}
            showLineNumbers
          >
            {JSON.stringify(parsedJson, null, 2)}
          </SyntaxHighlighter>
        );
      } catch (e) {
        // Si no es JSON válido, mostrar como texto plano
        return (
          <pre className="text-white text-xs whitespace-pre-wrap font-mono bg-codestorm-darker rounded-md p-3 max-h-[200px] overflow-y-auto">
            {stage.proposal}
          </pre>
        );
      }
    } else {
      // Mostrar como texto plano
      return (
        <pre className="text-white text-xs whitespace-pre-wrap font-mono bg-codestorm-darker rounded-md p-3 max-h-[200px] overflow-y-auto">
          {stage.proposal}
        </pre>
      );
    }
  };

  // Botón flotante para mostrar el panel cuando está cerrado
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-1/2 right-0 transform -translate-y-1/2 bg-codestorm-dark hover:bg-codestorm-darker border border-codestorm-blue/30 border-r-0 rounded-l-md p-2 text-white z-40"
        title="Mostrar etapa actual"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    );
  }

  // Panel minimizado
  if (isMinimized) {
    return (
      <div className="fixed top-20 right-4 bg-codestorm-dark rounded-lg shadow-lg border border-codestorm-blue/30 p-3 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getAgentIcon()}
            <h3 className="text-white font-medium ml-2 text-sm">{stage.title}</h3>
          </div>
          <div className="flex space-x-1 ml-3">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 rounded-md hover:bg-codestorm-blue/20 text-gray-400 hover:text-white"
              title="Expandir"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              onClick={onToggle}
              className="p-1 rounded-md hover:bg-codestorm-blue/20 text-gray-400 hover:text-white"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Panel completo
  return (
    <div className={`fixed top-20 bottom-4 right-4 w-80 bg-codestorm-dark rounded-lg shadow-lg border border-codestorm-blue/30 flex flex-col z-40 transition-all duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-center justify-between p-3 border-b border-codestorm-blue/30">
        <div className="flex items-center">
          {getAgentIcon()}
          <div className="ml-2">
            <h3 className="text-white font-medium text-sm">{stage.title}</h3>
            <p className="text-gray-400 text-xs">{getAgentName()}</p>
          </div>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-md hover:bg-codestorm-blue/20 text-gray-400 hover:text-white"
            title="Minimizar"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md hover:bg-codestorm-blue/20 text-gray-400 hover:text-white"
            title="Cerrar panel"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-3 overflow-y-auto">
        <p className="text-gray-300 text-xs mb-3">{stage.description}</p>

        {/* Indicador de estado */}
        <div className="flex justify-between items-center mb-3">
          <div className={`px-2 py-0.5 rounded-full text-xs ${
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
            {new Date(stage.timestamp).toLocaleTimeString()}
          </div>
        </div>

        {/* Mensaje de pausa */}
        {isPaused && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-2 mb-3 flex items-start">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-400">
              Proceso en pausa. Revisa los comentarios.
            </p>
          </div>
        )}

        {/* Propuesta */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-white text-xs font-medium">Propuesta</h4>

            {/* Toggle para cambiar la visualización */}
            {stage.type === 'planner' && (
              <button
                onClick={() => setShowJsonPreview(!showJsonPreview)}
                className="text-xs text-gray-400 hover:text-white"
              >
                {showJsonPreview ? 'Texto' : 'JSON'}
              </button>
            )}
          </div>

          {renderProposal()}
        </div>

        {/* Comentarios anteriores */}
        {stage.feedback && (
          <div className="mb-3">
            <h4 className="text-white text-xs font-medium mb-1">Comentarios anteriores</h4>
            <div className="bg-codestorm-blue/10 rounded-md p-2 border border-codestorm-blue/30">
              <p className="text-xs text-white">{stage.feedback}</p>
            </div>
          </div>
        )}

        {/* Mensaje informativo sobre la necesidad de tomar una decisión */}
        {stage.status === 'pending' && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-md p-2 mb-3 flex items-start">
            <Info className="h-4 w-4 text-blue-400 mr-1.5 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-400">
              Debes aprobar o rechazar esta etapa para continuar con el proceso.
            </p>
          </div>
        )}

        {/* Mensaje de validación si existe */}
        {validationMessage && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-2 mb-3 flex items-start">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1.5 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-400">{validationMessage}</p>
          </div>
        )}

        {/* Formulario de comentarios */}
        {stage.status === 'pending' && (
          <>
            <div className="mb-3">
              <label className="block text-gray-300 text-xs mb-1">Comentarios:</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full bg-codestorm-darker border border-codestorm-blue/30 rounded-md p-2 text-white text-xs"
                rows={2}
                placeholder="Añade comentarios o solicita modificaciones..."
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => onApprove(stage.id, feedback || undefined)}
                className="flex-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs flex items-center justify-center transition-colors"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                <span>Aprobar</span>
              </button>
              <button
                onClick={() => onModify(stage.id, feedback)}
                className={`flex-1 px-2 py-1.5 ${
                  !feedback.trim()
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } rounded-md text-xs flex items-center justify-center transition-colors`}
                disabled={!feedback.trim()}
              >
                <PenTool className="h-3 w-3 mr-1" />
                <span>Modificar</span>
              </button>
              <button
                onClick={() => onReject(stage.id, feedback)}
                className={`flex-1 px-2 py-1.5 ${
                  !feedback.trim()
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                } rounded-md text-xs flex items-center justify-center transition-colors`}
                disabled={!feedback.trim()}
              >
                <XCircle className="h-3 w-3 mr-1" />
                <span>Rechazar</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StageSidebar;
