import React, { useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';

interface StageApprovalProps {
  stage: ApprovalStage | null;
  onApprove: (stageId: string, feedback?: string) => void;
  onModify: (stageId: string, feedback: string) => void;
  onReject: (stageId: string, feedback: string) => void;
  isPaused?: boolean;
}

const StageApproval: React.FC<StageApprovalProps> = ({ 
  stage, 
  onApprove, 
  onModify, 
  onReject,
  isPaused = false
}) => {
  const [feedback, setFeedback] = useState('');
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  
  if (!stage) {
    return (
      <div className="bg-codestorm-dark rounded-lg shadow-md p-6 border border-codestorm-blue/30">
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
        <pre className="text-white text-sm whitespace-pre-wrap font-mono bg-codestorm-darker rounded-md p-4 max-h-[300px] overflow-y-auto">
          {stage.proposal}
        </pre>
      );
    }
  };
  
  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md p-6 border border-codestorm-blue/30">
      <div className="flex items-start mb-4">
        <div className="mr-4">
          {getAgentIcon()}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-white">{stage.title}</h2>
              <p className="text-sm text-gray-400">{getAgentName()}</p>
            </div>
            
            {/* Indicador de estado */}
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
          </div>
          
          <p className="text-gray-300 text-sm mt-2">{stage.description}</p>
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
      
      {/* Comentarios anteriores */}
      {stage.feedback && (
        <div className="mb-4">
          <h3 className="text-white font-medium mb-2">Comentarios anteriores</h3>
          <div className="bg-codestorm-blue/10 rounded-md p-3 border border-codestorm-blue/30">
            <p className="text-sm text-white">{stage.feedback}</p>
          </div>
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
          
          <div className="flex space-x-3">
            <button
              onClick={() => onApprove(stage.id, feedback || undefined)}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm flex items-center justify-center"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Aprobar</span>
            </button>
            <button
              onClick={() => onModify(stage.id, feedback)}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center justify-center"
              disabled={!feedback.trim()}
            >
              <PenTool className="h-4 w-4 mr-2" />
              <span>Modificar</span>
            </button>
            <button
              onClick={() => onReject(stage.id, feedback)}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm flex items-center justify-center"
              disabled={!feedback.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              <span>Rechazar</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default StageApproval;
