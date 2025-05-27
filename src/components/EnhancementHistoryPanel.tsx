import React, { useState } from 'react';
import { EnhancedPrompt } from '../services/PromptEnhancerService';
import { 
  Sparkles, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Trash, 
  X,
  Search
} from 'lucide-react';

interface EnhancementHistoryPanelProps {
  history: EnhancedPrompt[];
  onClearHistory: () => void;
  onUsePrompt: (prompt: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

/**
 * Componente que muestra el historial de prompts mejorados
 */
const EnhancementHistoryPanel: React.FC<EnhancementHistoryPanelProps> = ({
  history,
  onClearHistory,
  onUsePrompt,
  isVisible,
  onClose
}) => {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtrar historial según término de búsqueda
  const filteredHistory = searchTerm.trim() 
    ? history.filter(item => 
        item.originalPrompt.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.enhancedPrompt.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : history;
  
  // Ordenar por fecha (más reciente primero)
  const sortedHistory = [...filteredHistory].sort((a, b) => b.timestamp - a.timestamp);
  
  // Función para copiar un prompt al portapapeles
  const copyToClipboard = (text: string, itemId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItemId(itemId);
    setTimeout(() => setCopiedItemId(null), 2000);
  };
  
  // Función para alternar la expansión de un ítem
  const toggleExpand = (itemId: string) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-codestorm-dark rounded-lg shadow-xl border border-codestorm-blue/30 w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Encabezado */}
        <div className="bg-codestorm-blue/20 p-3 border-b border-codestorm-blue/30 flex justify-between items-center">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-codestorm-gold mr-2" />
            <h2 className="text-sm font-medium text-white">Historial de Mejoras</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-codestorm-blue/30 text-gray-400 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Barra de búsqueda */}
        <div className="p-3 border-b border-codestorm-blue/30">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en el historial..."
              className="w-full bg-codestorm-darker border border-codestorm-blue/30 rounded-md pl-9 pr-3 py-2 text-white text-sm placeholder-gray-500"
            />
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>
        
        {/* Contenido */}
        <div className="flex-1 overflow-auto p-3 space-y-3">
          {sortedHistory.length > 0 ? (
            sortedHistory.map((item) => (
              <div 
                key={item.id} 
                className="bg-codestorm-blue/10 rounded-md border border-codestorm-blue/20 overflow-hidden"
              >
                {/* Cabecera del ítem */}
                <div 
                  className="p-3 flex justify-between items-center cursor-pointer hover:bg-codestorm-blue/20"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex items-center">
                    <Sparkles className="h-4 w-4 text-codestorm-gold mr-2" />
                    <div className="text-sm text-white truncate max-w-[300px]">
                      {item.originalPrompt}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                    {expandedItemId === item.id ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {/* Contenido expandido */}
                {expandedItemId === item.id && (
                  <div className="p-3 border-t border-codestorm-blue/20 space-y-3">
                    {/* Prompt original */}
                    <div>
                      <h3 className="text-xs font-medium text-gray-400 mb-1">Original:</h3>
                      <div className="bg-codestorm-darker rounded-md p-2 text-xs text-gray-300 whitespace-pre-wrap">
                        {item.originalPrompt}
                      </div>
                    </div>
                    
                    {/* Prompt mejorado */}
                    <div>
                      <h3 className="text-xs font-medium text-gray-400 mb-1">Mejorado:</h3>
                      <div className="bg-codestorm-blue/20 rounded-md p-2 text-xs text-white whitespace-pre-wrap">
                        {item.enhancedPrompt}
                      </div>
                    </div>
                    
                    {/* Mejoras realizadas */}
                    <div>
                      <h3 className="text-xs font-medium text-gray-400 mb-1">Mejoras:</h3>
                      <ul className="text-xs text-gray-300 space-y-1 pl-4">
                        {item.improvements.map((improvement, index) => (
                          <li key={index} className="list-disc">{improvement}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Acciones */}
                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        onClick={() => copyToClipboard(item.enhancedPrompt, `copy-${item.id}`)}
                        className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white text-xs flex items-center"
                        title="Copiar prompt mejorado"
                      >
                        {copiedItemId === `copy-${item.id}` ? (
                          <Check className="h-3 w-3 mr-1" />
                        ) : (
                          <Copy className="h-3 w-3 mr-1" />
                        )}
                        Copiar
                      </button>
                      <button
                        onClick={() => onUsePrompt(item.enhancedPrompt)}
                        className="p-1.5 rounded bg-codestorm-accent hover:bg-blue-600 text-white text-xs flex items-center"
                        title="Usar este prompt"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Usar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-8">
              {searchTerm ? 'No se encontraron resultados' : 'No hay historial de mejoras'}
            </div>
          )}
        </div>
        
        {/* Acciones */}
        {history.length > 0 && (
          <div className="p-3 border-t border-codestorm-blue/30 flex justify-end">
            <button
              onClick={onClearHistory}
              className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs flex items-center"
            >
              <Trash className="h-3 w-3 mr-1" />
              Limpiar Historial
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancementHistoryPanel;
