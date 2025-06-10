import React from 'react';
import { HistoryEvent } from '../../types';
import { 
  Clock, 
  Code, 
  FileText, 
  Flag, 
  Info, 
  Lightbulb, 
  MessageSquare, 
  AlertTriangle,
  Calendar,
  Tag,
  Link as LinkIcon,
  X
} from 'lucide-react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface EventDetailsProps {
  event: HistoryEvent;
  onClose: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ event, onClose }) => {
  // Función para obtener el icono según el tipo de evento
  const getEventIcon = () => {
    switch (event.type) {
      case 'stage-start':
        return <Flag className="w-5 h-5 text-green-400" />;
      case 'stage-complete':
        return <Flag className="w-5 h-5 text-green-500" />;
      case 'code-generated':
        return <Code className="w-5 h-5 text-blue-400" />;
      case 'file-created':
        return <FileText className="w-5 h-5 text-yellow-400" />;
      case 'file-modified':
        return <FileText className="w-5 h-5 text-orange-400" />;
      case 'decision-made':
        return <Lightbulb className="w-5 h-5 text-purple-400" />;
      case 'user-feedback':
        return <MessageSquare className="w-5 h-5 text-indigo-400" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'milestone':
        return <Flag className="w-5 h-5 text-codestorm-gold" />;
      default:
        return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  // Función para obtener el color de fondo según la importancia
  const getImportanceColor = () => {
    switch (event.importance) {
      case 'high':
        return 'text-codestorm-gold';
      case 'medium':
        return 'text-blue-400';
      case 'low':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  // Formatear fecha
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="bg-codestorm-dark border border-codestorm-blue/30 rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-codestorm-blue/30 flex justify-between items-center bg-blue-900/30">
        <div className="flex items-center space-x-2">
          {getEventIcon()}
          <h3 className="text-lg font-medium text-white">{event.title}</h3>
        </div>
        
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-codestorm-blue/20 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-1 bg-codestorm-darker px-2 py-1 rounded-md">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">{formatDate(event.timestamp)}</span>
          </div>
          
          <div className="flex items-center space-x-1 bg-codestorm-darker px-2 py-1 rounded-md">
            <Tag className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">{event.type}</span>
          </div>
          
          <div className="flex items-center space-x-1 bg-codestorm-darker px-2 py-1 rounded-md">
            <Info className="w-4 h-4 text-gray-400" />
            <span className={`text-sm ${getImportanceColor()}`}>
              Importancia: {event.importance}
            </span>
          </div>
          
          {event.stageId && (
            <div className="flex items-center space-x-1 bg-codestorm-darker px-2 py-1 rounded-md">
              <LinkIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">
                Etapa: {event.stageType || 'Desconocida'}
              </span>
            </div>
          )}
        </div>
        
        <div className="bg-codestorm-darker p-4 rounded-md">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Descripción</h4>
          <p className="text-sm text-gray-400 whitespace-pre-wrap">{event.description}</p>
        </div>
        
        {event.codeSnippet && (
          <div className="bg-codestorm-darker p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Código</h4>
            <div className="relative">
              <div className="absolute top-0 right-0 z-10 bg-codestorm-dark text-xs text-gray-400 px-2 py-0.5 rounded-bl">
                {event.language || 'text'}
              </div>
              <SyntaxHighlighter
                language={event.language || 'text'}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '0.75rem',
                  paddingTop: '1.5rem',
                  background: '#0a1120',
                  borderRadius: '0.375rem',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}
                showLineNumbers
                wrapLongLines
              >
                {event.codeSnippet}
              </SyntaxHighlighter>
            </div>
          </div>
        )}
        
        {event.relatedFiles && event.relatedFiles.length > 0 && (
          <div className="bg-codestorm-darker p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Archivos relacionados</h4>
            <div className="space-y-1">
              {event.relatedFiles.map((file, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-2 p-2 rounded bg-codestorm-dark/50"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">{file}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="bg-codestorm-darker p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Metadatos</h4>
            <div className="text-xs font-mono text-gray-400 bg-codestorm-dark p-2 rounded overflow-x-auto">
              <pre>{JSON.stringify(event.metadata, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
