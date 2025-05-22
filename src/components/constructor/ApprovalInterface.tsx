import React, { useState } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Clock, AlertTriangle, Info, Edit, Check, X } from 'lucide-react';
import { ApprovalData, ApprovalItem } from '../../types';

interface ApprovalInterfaceProps {
  approvalData: ApprovalData;
  onApprove: (feedback?: string) => void;
  onReject: (feedback: string) => void;
  onPartialApprove: (approvedItems: string[], feedback?: string) => void;
  isLoading?: boolean;
}

const ApprovalInterface: React.FC<ApprovalInterfaceProps> = ({
  approvalData,
  onApprove,
  onReject,
  onPartialApprove,
  isLoading: initialLoading = false
}) => {
  const [feedback, setFeedback] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFeedbackInput, setShowFeedbackInput] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const handleApprove = () => {
    console.log('Aprobando todos los elementos en ApprovalInterface');

    // Deshabilitar botones durante el procesamiento
    setIsLoading(true);

    try {
      onApprove(feedback.trim() || undefined);
    } catch (error) {
      console.error('Error al aprobar:', error);
      alert('Ocurrió un error al procesar la aprobación. Por favor, intenta nuevamente.');
      setIsLoading(false);
    }
  };

  const handleReject = () => {
    if (!feedback.trim()) {
      alert('Por favor, proporciona comentarios sobre por qué rechazas esta propuesta.');
      return;
    }

    console.log('Rechazando propuesta con feedback:', feedback);

    // Deshabilitar botones durante el procesamiento
    setIsLoading(true);

    try {
      onReject(feedback);
    } catch (error) {
      console.error('Error al rechazar:', error);
      alert('Ocurrió un error al procesar el rechazo. Por favor, intenta nuevamente.');
      setIsLoading(false);
    }
  };

  const handlePartialApprove = () => {
    if (selectedItems.length === 0) {
      alert('Por favor, selecciona al menos un elemento para aprobar parcialmente.');
      return;
    }

    console.log(`Aprobando parcialmente ${selectedItems.length} elementos:`, selectedItems);

    // Deshabilitar botones durante el procesamiento
    setIsLoading(true);

    try {
      onPartialApprove(selectedItems, feedback.trim() || undefined);
    } catch (error) {
      console.error('Error al aprobar parcialmente:', error);
      alert('Ocurrió un error al procesar la aprobación parcial. Por favor, intenta nuevamente.');
      setIsLoading(false);
    }
  };

  const renderApprovalItem = (item: ApprovalItem) => {
    const isExpanded = expandedSections[item.id] || false;
    const isSelected = selectedItems.includes(item.id);

    return (
      <div
        key={item.id}
        className={`mb-2 p-3 rounded-md border ${isSelected ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-700'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleItemSelection(item.id)}
              className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <h4 className="font-medium text-gray-800 dark:text-gray-200">{item.title || 'Elemento sin título'}</h4>
          </div>
          <div className="flex items-center space-x-2">
            {item.estimatedTime && (
              <span className="text-xs flex items-center text-gray-500 dark:text-gray-400">
                <Clock className="h-3 w-3 mr-1" />
                {item.estimatedTime} min
              </span>
            )}
            {item.priority && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                item.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              }`}>
                {item.priority}
              </span>
            )}
            <button
              onClick={() => toggleSection(item.id)}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-2 pl-6">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{item.description || 'Sin descripción disponible'}</p>

            {item.path && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span className="font-semibold">Ruta:</span> {item.path}
              </div>
            )}

            {item.language && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span className="font-semibold">Lenguaje:</span> {item.language}
              </div>
            )}

            {item.dependencies && item.dependencies.length > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span className="font-semibold">Dependencias:</span> {item.dependencies.join(', ')}
              </div>
            )}

            {item.content && (
              <div className="mt-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Vista previa:</div>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                  {item.content.length > 300 ? `${item.content.substring(0, 300)}...` : item.content}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 max-w-4xl mx-auto">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {approvalData.title || 'Aprobación Requerida'}
          </h2>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
              Requiere aprobación
            </span>
          </div>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-300">{approvalData.description || 'Por favor, revisa y aprueba los siguientes elementos.'}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
          Elementos a aprobar ({approvalData.items.length})
        </h3>
        <div className="space-y-2">
          {approvalData.items.map(renderApprovalItem)}
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowFeedbackInput(!showFeedbackInput)}
          className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <Edit className="h-4 w-4 mr-1" />
          {showFeedbackInput ? 'Ocultar comentarios' : 'Añadir comentarios o solicitar cambios'}
        </button>

        {showFeedbackInput && (
          <div className="mt-2">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Escribe tus comentarios o solicitudes de cambios aquí..."
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              rows={4}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-end space-x-2">
        <button
          onClick={handleReject}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <XCircle className="h-5 w-5 mr-1" />
          Rechazar
        </button>

        <button
          onClick={handlePartialApprove}
          disabled={isLoading || selectedItems.length === 0}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="h-5 w-5 mr-1" />
          Aprobar seleccionados ({selectedItems.length})
        </button>

        <button
          onClick={handleApprove}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="h-5 w-5 mr-1" />
          Aprobar todo
        </button>
      </div>
    </div>
  );
};

export default ApprovalInterface;
