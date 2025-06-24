import React, { useState } from 'react';
import { CorrectionHistoryItem } from '../../types';
import { History, Clock, Code, AlertCircle, Check, ChevronDown, ChevronUp, Trash } from 'lucide-react';

interface CorrectionHistoryProps {
  history: CorrectionHistoryItem[];
  onSelectHistoryItem: (item: CorrectionHistoryItem) => void;
  onClearHistory: () => void;
}

const CorrectionHistory: React.FC<CorrectionHistoryProps> = ({
  history,
  onSelectHistoryItem,
  onClearHistory
}) => {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleClearHistory = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar todo el historial de correcciones?')) {
      onClearHistory();
    }
  };

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md border border-codestorm-blue/30 overflow-hidden">
      <div 
        className="bg-codestorm-blue/20 p-3 border-b border-codestorm-blue/30 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-white font-medium flex items-center">
          <History className="h-5 w-5 mr-2 text-codestorm-gold" />
          Historial de Correcciones
          <span className="ml-2 text-xs bg-codestorm-blue/30 px-2 py-0.5 rounded-full text-white">
            {history.length}
          </span>
        </h3>
        <div className="flex items-center">
          {history.length > 0 && (
            <button 
              className="mr-2 text-gray-400 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10"
              onClick={(e) => {
                e.stopPropagation();
                handleClearHistory();
              }}
              title="Borrar historial"
            >
              <Trash className="h-4 w-4" />
            </button>
          )}
          <button className="text-gray-400 hover:text-white">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="max-h-80 overflow-y-auto">
          {history.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              No hay correcciones en el historial
            </div>
          ) : (
            <ul className="divide-y divide-codestorm-blue/30">
              {history.map((item) => (
                <li key={item.id} className="p-3 hover:bg-codestorm-blue/10">
                  <div 
                    className="cursor-pointer"
                    onClick={() => {
                      setExpandedItemId(expandedItemId === item.id ? null : item.id);
                      onSelectHistoryItem(item);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Code className="h-4 w-4 mr-2 text-blue-400" />
                        <span className="text-white font-medium">
                          {item.language.charAt(0).toUpperCase() + item.language.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(item.timestamp)}
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-1 text-xs">
                      <div className="flex items-center text-red-400 mr-3">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {item.errorCount} errores
                      </div>
                      <div className="flex items-center text-green-400">
                        <Check className="h-3 w-3 mr-1" />
                        {item.fixedCount} corregidos
                      </div>
                    </div>
                    
                    {expandedItemId === item.id && (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-codestorm-darker p-2 rounded-md">
                          <div className="text-gray-400 mb-1">Original:</div>
                          <pre className="text-white overflow-x-auto whitespace-pre-wrap">
                            {item.originalCodeSnippet.length > 100 
                              ? `${item.originalCodeSnippet.substring(0, 100)}...` 
                              : item.originalCodeSnippet}
                          </pre>
                        </div>
                        <div className="bg-codestorm-darker p-2 rounded-md">
                          <div className="text-gray-400 mb-1">Corregido:</div>
                          <pre className="text-white overflow-x-auto whitespace-pre-wrap">
                            {item.correctedCodeSnippet.length > 100 
                              ? `${item.correctedCodeSnippet.substring(0, 100)}...` 
                              : item.correctedCodeSnippet}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default CorrectionHistory;
