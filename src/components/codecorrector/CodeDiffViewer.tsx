import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Minus, 
  Edit3,
  Copy,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';

interface DiffChange {
  type: 'add' | 'remove' | 'modify';
  lineNumber: number;
  oldContent?: string;
  newContent?: string;
  context: string[];
}

interface CorrectionChange {
  id: string;
  lineNumber: number;
  originalCode: string;
  correctedCode: string;
  reason: string;
  type: 'fix' | 'improvement' | 'optimization';
  confidence: number;
}

interface CodeDiffViewerProps {
  originalCode: string;
  correctedCode: string;
  changes: CorrectionChange[];
  language: string;
  onApplyChange?: (changeId: string) => void;
  onRejectChange?: (changeId: string) => void;
}

const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({
  originalCode,
  correctedCode,
  changes,
  language,
  onApplyChange,
  onRejectChange
}) => {
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set());
  const [showOnlyChanges, setShowOnlyChanges] = useState(false);
  const [copiedChangeId, setCopiedChangeId] = useState<string | null>(null);

  const toggleChange = (changeId: string) => {
    const newExpanded = new Set(expandedChanges);
    if (newExpanded.has(changeId)) {
      newExpanded.delete(changeId);
    } else {
      newExpanded.add(changeId);
    }
    setExpandedChanges(newExpanded);
  };

  const copyToClipboard = async (text: string, changeId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedChangeId(changeId);
      setTimeout(() => setCopiedChangeId(null), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'fix':
        return <Minus className="w-4 h-4 text-red-400" />;
      case 'improvement':
        return <Edit3 className="w-4 h-4 text-blue-400" />;
      case 'optimization':
        return <Plus className="w-4 h-4 text-green-400" />;
      default:
        return <Edit3 className="w-4 h-4 text-gray-400" />;
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'fix':
        return 'border-red-400/30 bg-red-400/5';
      case 'improvement':
        return 'border-blue-400/30 bg-blue-400/5';
      case 'optimization':
        return 'border-green-400/30 bg-green-400/5';
      default:
        return 'border-gray-400/30 bg-gray-400/5';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-400';
    if (confidence >= 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  const originalLines = originalCode.split('\n');
  const correctedLines = correctedCode.split('\n');

  return (
    <div className="bg-codestorm-dark rounded-lg border border-codestorm-blue/30">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-codestorm-blue/30">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Edit3 className="w-5 h-5 mr-2 text-codestorm-accent" />
          Comparación de Cambios
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowOnlyChanges(!showOnlyChanges)}
            className="flex items-center px-3 py-1 text-sm bg-codestorm-darker rounded border border-codestorm-blue/30 text-gray-300 hover:text-white transition-colors"
          >
            {showOnlyChanges ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {showOnlyChanges ? 'Mostrar todo' : 'Solo cambios'}
          </button>
          <span className="text-sm text-gray-400">
            {changes.length} cambio{changes.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Changes List */}
      <div className="max-h-96 overflow-y-auto">
        {changes.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Edit3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No se detectaron cambios en el código</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {changes.map((change) => (
              <div
                key={change.id}
                className={`border rounded-lg transition-all duration-200 ${getChangeTypeColor(change.type)}`}
              >
                {/* Change Header */}
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5"
                  onClick={() => toggleChange(change.id)}
                >
                  <div className="flex items-center space-x-3">
                    {expandedChanges.has(change.id) ? 
                      <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    }
                    {getChangeTypeIcon(change.type)}
                    <div>
                      <p className="text-sm font-medium text-white">
                        Línea {change.lineNumber}: {change.reason}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          change.type === 'fix' ? 'bg-red-400/20 text-red-300' :
                          change.type === 'improvement' ? 'bg-blue-400/20 text-blue-300' :
                          'bg-green-400/20 text-green-300'
                        }`}>
                          {change.type === 'fix' ? 'Corrección' :
                           change.type === 'improvement' ? 'Mejora' : 'Optimización'}
                        </span>
                        <span className={`text-xs ${getConfidenceColor(change.confidence)}`}>
                          {Math.round(change.confidence * 100)}% confianza
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(change.correctedCode, change.id);
                      }}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                      title="Copiar código corregido"
                    >
                      {copiedChangeId === change.id ? 
                        <Check className="w-4 h-4 text-green-400" /> :
                        <Copy className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>

                {/* Change Details */}
                {expandedChanges.has(change.id) && (
                  <div className="border-t border-white/10 p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Original Code */}
                      <div>
                        <h4 className="text-sm font-medium text-red-300 mb-2 flex items-center">
                          <Minus className="w-3 h-3 mr-1" />
                          Código Original
                        </h4>
                        <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                            {change.originalCode}
                          </pre>
                        </div>
                      </div>

                      {/* Corrected Code */}
                      <div>
                        <h4 className="text-sm font-medium text-green-300 mb-2 flex items-center">
                          <Plus className="w-3 h-3 mr-1" />
                          Código Corregido
                        </h4>
                        <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                            {change.correctedCode}
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {(onApplyChange || onRejectChange) && (
                      <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-white/10">
                        {onRejectChange && (
                          <button
                            onClick={() => onRejectChange(change.id)}
                            className="px-3 py-1 text-sm bg-red-600/20 text-red-300 rounded border border-red-600/30 hover:bg-red-600/30 transition-colors"
                          >
                            Rechazar
                          </button>
                        )}
                        {onApplyChange && (
                          <button
                            onClick={() => onApplyChange(change.id)}
                            className="px-3 py-1 text-sm bg-green-600/20 text-green-300 rounded border border-green-600/30 hover:bg-green-600/30 transition-colors"
                          >
                            Aplicar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {changes.length > 0 && (
        <div className="border-t border-codestorm-blue/30 p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-red-300">
                {changes.filter(c => c.type === 'fix').length} Correcciones
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-300">
                {changes.filter(c => c.type === 'improvement').length} Mejoras
              </p>
            </div>
            <div>
              <p className="text-sm text-green-300">
                {changes.filter(c => c.type === 'optimization').length} Optimizaciones
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeDiffViewer;
