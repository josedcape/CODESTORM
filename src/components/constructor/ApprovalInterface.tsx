import React, { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, ChevronDown, ChevronUp, Clock, AlertTriangle,
  Info, Edit, Check, X, FileText, Code, Layers, File,
  FileCode, FileImage, FileJson, FileType
} from 'lucide-react';
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

  // Verificar si es un plan completo
  const isCompletePlan = approvalData.metadata?.isCompletePlan === true;

  // Inicializar todos los elementos seleccionados para aprobación por lotes
  useEffect(() => {
    if (approvalData.type === 'batch' || isCompletePlan) {
      // Seleccionar todos los elementos por defecto para aprobación por lotes o plan completo
      setSelectedItems(approvalData.items.map(item => item.id));
    }
    // Resetear el estado de loading cuando cambia la data de aprobación
    setIsLoading(false);
  }, [approvalData, isCompletePlan]);

  // Resetear el estado de loading cuando cambia el prop isLoading
  useEffect(() => {
    setIsLoading(initialLoading);
  }, [initialLoading]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleItemSelection = (id: string) => {
    // Si es un plan completo, no permitir selección individual
    if (isCompletePlan) return;

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

      // Timeout de seguridad para resetear el estado de loading
      setTimeout(() => {
        setIsLoading(false);
      }, 5000); // 5 segundos de timeout
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

      // Timeout de seguridad para resetear el estado de loading
      setTimeout(() => {
        setIsLoading(false);
      }, 5000); // 5 segundos de timeout
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

      // Timeout de seguridad para resetear el estado de loading
      setTimeout(() => {
        setIsLoading(false);
      }, 5000); // 5 segundos de timeout
    } catch (error) {
      console.error('Error al aprobar parcialmente:', error);
      alert('Ocurrió un error al procesar la aprobación parcial. Por favor, intenta nuevamente.');
      setIsLoading(false);
    }
  };

  const renderApprovalItem = (item: ApprovalItem) => {
    const isExpanded = expandedSections[item.id] || false;
    const isSelected = selectedItems.includes(item.id);
    const isPlanItem = isCompletePlan && item.type === 'plan';

    // Función para formatear el contenido JSON del plan
    const formatPlanContent = (content: string) => {
      try {
        const planData = JSON.parse(content);

        // Extraer información sobre tecnologías y arquitectura de la descripción
        const descriptionText = planData.description || '';

        // Función para extraer tecnologías de la descripción
        const extractTechnologies = (description: string) => {
          const techKeywords = [
            'React', 'Angular', 'Vue', 'JavaScript', 'TypeScript', 'HTML', 'CSS',
            'Node.js', 'Express', 'MongoDB', 'SQL', 'PostgreSQL', 'MySQL',
            'Firebase', 'AWS', 'Docker', 'Kubernetes', 'Python', 'Django', 'Flask',
            'PHP', 'Laravel', 'Tailwind', 'Bootstrap', 'Material UI', 'Redux',
            'GraphQL', 'REST API', 'WebSockets', 'Java', 'Spring', '.NET', 'C#',
            'Ruby', 'Rails', 'Go', 'Rust', 'Swift', 'Kotlin', 'Flutter', 'React Native'
          ];

          const technologies: string[] = [];
          techKeywords.forEach(tech => {
            if (description.includes(tech)) {
              technologies.push(tech);
            }
          });

          return technologies;
        };

        const technologies = extractTechnologies(descriptionText);

        return (
          <div className="space-y-6">
            {/* Sección de descripción del proyecto - Destacada */}
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md border border-blue-300 dark:border-blue-700 shadow-sm">
              <h3 className="text-md font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center">
                <Info className="w-5 h-5 mr-2" /> Descripción del Proyecto
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {planData.description}
              </p>
            </div>

            {/* Sección de tecnologías y arquitectura */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-md border border-purple-200 dark:border-purple-800 shadow-sm">
              <h3 className="text-md font-semibold text-purple-800 dark:text-purple-300 mb-3 flex items-center">
                <Layers className="w-5 h-5 mr-2" /> Arquitectura y Tecnologías
              </h3>

              {technologies.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-2">Tecnologías Detectadas:</h4>
                  <div className="flex flex-wrap gap-2">
                    {technologies.map((tech, idx) => (
                      <span key={idx} className="px-2 py-1 bg-purple-100 dark:bg-purple-800/40 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                La arquitectura y tecnologías se han extraído de la descripción del proyecto.
                Revisa cuidadosamente que sean las adecuadas para tu proyecto.
              </p>
            </div>

            {/* Sección de archivos con mejor visualización */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2" /> Estructura de Archivos ({planData.files?.length || 0})
              </h3>
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                {planData.files?.map((file: any, index: number) => (
                  <div key={index} className="bg-white dark:bg-gray-900/70 p-3 rounded-md border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center">
                      {file.path.endsWith('.html') ? <FileType className="w-4 h-4 mr-1 text-orange-500" /> :
                       file.path.endsWith('.css') ? <FileCode className="w-4 h-4 mr-1 text-blue-500" /> :
                       file.path.endsWith('.js') ? <FileCode className="w-4 h-4 mr-1 text-yellow-500" /> :
                       file.path.endsWith('.json') ? <FileJson className="w-4 h-4 mr-1 text-green-500" /> :
                       <File className="w-4 h-4 mr-1 text-gray-500" />}
                      {file.path}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 pl-5 border-l-2 border-gray-200 dark:border-gray-700">
                      {file.description}
                    </p>
                    {file.dependencies && file.dependencies.length > 0 && (
                      <div className="mt-2 pl-5">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-500">Dependencias:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {file.dependencies.map((dep: string, idx: number) => (
                            <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">
                              {dep}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sección de pasos de implementación mejorada */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-200 dark:border-green-800 shadow-sm">
              <h3 className="text-md font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center">
                <Code className="w-5 h-5 mr-2" /> Plan de Implementación ({planData.implementationSteps?.length || 0} pasos)
              </h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {planData.implementationSteps?.map((step: any, index: number) => (
                  <div key={index} className="bg-white dark:bg-gray-900/70 p-3 rounded-md border-l-4 border border-green-300 dark:border-green-700">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-300 mr-2 text-xs font-bold">
                        {index + 1}
                      </span>
                      {step.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-8 pl-2 border-l-2 border-green-100 dark:border-green-800">
                      {step.description}
                    </p>
                    {step.filesToCreate && step.filesToCreate.length > 0 && (
                      <div className="mt-2 ml-8 pl-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-500">Archivos a crear:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {step.filesToCreate.map((file: string, idx: number) => (
                            <span key={idx} className="text-xs bg-green-100 dark:bg-green-800/40 px-2 py-0.5 rounded text-green-700 dark:text-green-300">
                              {file}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      } catch (e) {
        console.error("Error al parsear el contenido del plan:", e);
        // Si no se puede parsear como JSON, mostrar como texto plano
        return (
          <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {content}
          </pre>
        );
      }
    };

    return (
      <div
        key={item.id}
        className={`mb-4 rounded-md border shadow-sm ${
          isPlanItem
            ? 'border-blue-300 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20'
            : isSelected
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : 'border-gray-300 dark:border-gray-700'
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            {!isPlanItem && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleItemSelection(item.id)}
                className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
            )}
            <h4 className={`font-medium ${isPlanItem ? 'text-blue-800 dark:text-blue-300 text-lg' : 'text-gray-800 dark:text-gray-200'}`}>
              {isPlanItem ? (
                <span className="flex items-center">
                  <Code className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  {item.title || 'Plan Completo'}
                </span>
              ) : (
                item.title || 'Elemento sin título'
              )}
            </h4>
          </div>
          <div className="flex items-center space-x-3">
            {item.estimatedTime && (
              <span className={`text-xs flex items-center ${
                isPlanItem ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full' : 'text-gray-500 dark:text-gray-400'
              }`}>
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
                {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Media' : 'Baja'}
              </span>
            )}
            <button
              onClick={() => toggleSection(item.id)}
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                isPlanItem
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/50'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className={`px-4 pb-4 ${isPlanItem ? '' : 'pl-10'}`}>
            {!isPlanItem && (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{item.description || 'Sin descripción disponible'}</p>

                <div className="flex flex-wrap gap-3 mb-2">
                  {item.path && (
                    <div className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-gray-600 dark:text-gray-400 flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      {item.path}
                    </div>
                  )}

                  {item.language && (
                    <div className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-gray-600 dark:text-gray-400 flex items-center">
                      <Code className="h-3 w-3 mr-1" />
                      {item.language}
                    </div>
                  )}
                </div>

                {item.dependencies && item.dependencies.length > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span className="font-semibold">Dependencias:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.dependencies.map((dep, idx) => (
                        <span key={idx} className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">
                          {dep}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {item.content && (
              <div className={`mt-2 ${isPlanItem ? '' : ''}`}>
                {!isPlanItem && (
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Vista previa:
                  </div>
                )}
                <div className={`${
                  isPlanItem
                    ? ''
                    : 'bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto'
                }`}>
                  {isPlanItem ? (
                    formatPlanContent(item.content)
                  ) : (
                    <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {item.content.length > 300 ? `${item.content.substring(0, 300)}...` : item.content}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Estilos CSS para la barra de desplazamiento personalizada
  const customScrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(59, 130, 246, 0.5);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(59, 130, 246, 0.7);
    }
    .dark .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
    }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(59, 130, 246, 0.3);
    }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(59, 130, 246, 0.5);
    }
  `;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 max-w-4xl mx-auto">
      {/* Estilos para la barra de desplazamiento personalizada */}
      <style>{customScrollbarStyles}</style>

      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {approvalData.title || 'Aprobación Requerida'}
          </h2>
          <div className="flex items-center space-x-2">
            {isCompletePlan ? (
              <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 flex items-center">
                <Code className="w-4 h-4 mr-1" />
                Plan Completo
              </span>
            ) : (
              <span className="px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                Requiere aprobación
              </span>
            )}
          </div>
        </div>

        <p className="mt-2 text-gray-600 dark:text-gray-300">{approvalData.description || 'Por favor, revisa y aprueba los siguientes elementos.'}</p>

        {isCompletePlan && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <span className="font-semibold">Nuevo flujo de trabajo:</span> Al aprobar este plan, todos los archivos se generarán automáticamente sin solicitar aprobaciones adicionales. Podrás intervenir cuando se complete la generación.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          {isCompletePlan ? (
            <>
              <Layers className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Detalles del Plan Completo
            </>
          ) : (
            <>
              <FileText className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
              Elementos a aprobar ({approvalData.items.length})
            </>
          )}
        </h3>
        <div className="space-y-4">
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
              placeholder={isCompletePlan
                ? "Añade comentarios o sugerencias sobre el plan completo..."
                : "Escribe tus comentarios o solicitudes de cambios aquí..."}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              rows={4}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          onClick={handleReject}
          disabled={isLoading}
          className="flex items-center px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors duration-200 border border-red-700"
        >
          <XCircle className="h-5 w-5 mr-2" />
          Rechazar {isCompletePlan ? 'Plan' : ''}
        </button>

        {!isCompletePlan && (
          <button
            onClick={handlePartialApprove}
            disabled={isLoading || selectedItems.length === 0}
            className="flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors duration-200 border border-blue-700"
          >
            <Check className="h-5 w-5 mr-2" />
            Aprobar seleccionados ({selectedItems.length})
          </button>
        )}

        <button
          onClick={handleApprove}
          disabled={isLoading}
          className={`flex items-center px-5 py-2.5 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors duration-200 ${
            isCompletePlan
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border border-green-700'
              : 'bg-green-600 hover:bg-green-700 border border-green-700'
          }`}
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          {isCompletePlan ? 'Aprobar Plan Completo' : 'Aprobar todo'}
        </button>
      </div>
    </div>
  );
};

export default ApprovalInterface;