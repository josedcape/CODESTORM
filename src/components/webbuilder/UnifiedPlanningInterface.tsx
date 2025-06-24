import React, { useState } from 'react';
import {
  CheckCircle, XCircle, ChevronDown, ChevronUp, Clock, AlertTriangle,
  Info, Edit, Check, X, FileText, Code, Layers, File,
  FileCode, FileImage, FileJson, FileType, Sparkles, Eye,
  RefreshCw, Wand2, MessageSquare, Palette
} from 'lucide-react';

export interface WebPagePlan {
  id: string;
  title: string;
  description: string;
  structure: Array<{
    id: string;
    section: string;
    description: string;
    content: string[];
  }>;
  design: {
    colorScheme: string;
    typography: string;
    layout: string;
    style: string;
  };
  functionality: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
}

export interface UnifiedPlanningProps {
  // Input phase
  userInstruction: string;
  onInstructionChange: (instruction: string) => void;
  onStartPlanning: () => void;
  onStartDirectPlanning?: () => void;
  onGoToEnhancement?: () => void;

  // Enhancement phase
  enhancedPrompt?: string;
  isEnhancing: boolean;
  onEnhancePrompt: () => void;
  onSkipEnhancement: () => void;
  onUseEnhanced: () => void;
  onUseOriginal: () => void;

  // Planning phase
  plan?: WebPagePlan;
  isGeneratingPlan: boolean;

  // Approval phase
  onApprovePlan: (approved: boolean, feedback?: string) => void;
  onRejectPlan: (feedback: string) => void;

  // State
  currentPhase: 'input' | 'enhancement' | 'planning' | 'approval' | 'coordination' | 'generation' | 'completed';
  isProcessing: boolean;
  coordinationProgress?: {
    stage: string;
    progress: number;
    currentAgent: string;
  };

  // Generated files for preview
  generatedFiles?: {
    html: string;
    css: string;
    js: string;
  };

  // Callbacks
  onBack?: () => void;
}

const UnifiedPlanningInterface: React.FC<UnifiedPlanningProps> = ({
  userInstruction,
  onInstructionChange,
  onStartPlanning,
  enhancedPrompt,
  isEnhancing,
  onEnhancePrompt,
  onSkipEnhancement,
  onUseEnhanced,
  onUseOriginal,
  plan,
  isGeneratingPlan,
  onApprovePlan,
  onRejectPlan,
  currentPhase,
  isProcessing,
  coordinationProgress,
  generatedFiles,
  onBack,
  onGoToEnhancement,
  onStartDirectPlanning
}) => {
  const [feedback, setFeedback] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<'plan' | 'preview'>('plan');

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleApprove = () => {
    onApprovePlan(true, feedback.trim() || undefined);
    setFeedback('');
    setShowFeedbackInput(false);
  };

  const handleReject = () => {
    if (!feedback.trim()) {
      setShowFeedbackInput(true);
      return;
    }
    onRejectPlan(feedback.trim());
    setFeedback('');
    setShowFeedbackInput(false);
  };

  const renderInputPhase = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Describe tu página web</h3>
        <p className="text-gray-300">
          Describe en detalle la página web que quieres crear. Sé específico sobre el contenido, diseño y funcionalidades.
        </p>
      </div>

      <div className="bg-codestorm-darker rounded-lg p-6 border border-gray-700">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Descripción completa de tu página web
        </label>
        <textarea
          value={userInstruction}
          onChange={(e) => onInstructionChange(e.target.value)}
          placeholder="Ejemplo: Quiero una landing page moderna para mi startup de tecnología. Debe tener un diseño minimalista con colores azul y blanco, una sección hero impactante con call-to-action, sección de características del producto, testimonios de clientes, y un formulario de contacto. El estilo debe ser profesional pero innovador, con animaciones suaves y diseño responsive..."
          rows={8}
          className="w-full px-4 py-3 bg-codestorm-dark border border-gray-600 rounded-md text-white placeholder-gray-400 focus:border-purple-600 focus:outline-none resize-none"
        />
        <div className="mt-2 text-sm text-gray-400">
          Mínimo 10 caracteres. Sé específico sobre colores, estilo, contenido y funcionalidades.
        </div>
      </div>

      <div className="flex justify-between items-center">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 bg-codestorm-darker text-gray-300 rounded-md hover:text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Volver</span>
          </button>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onStartDirectPlanning || onStartPlanning}
            disabled={userInstruction.trim().length < 10 || isProcessing}
            className={`flex items-center space-x-2 px-6 py-3 rounded-md font-medium transition-all ${
              userInstruction.trim().length >= 10 && !isProcessing
                ? 'bg-gradient-to-r from-codestorm-blue to-purple-600 hover:from-codestorm-blue/80 hover:to-purple-600/80 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className="h-5 w-5" />
            <span>Crear Plan Directo</span>
          </button>

          <button
            onClick={onGoToEnhancement}
            disabled={userInstruction.trim().length < 10 || isProcessing || !onGoToEnhancement}
            className={`flex items-center space-x-2 px-6 py-3 rounded-md font-medium transition-all ${
              userInstruction.trim().length >= 10 && !isProcessing && onGoToEnhancement
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-600/80 hover:to-blue-600/80 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Wand2 className="h-5 w-5" />
            <span>Mejorar Prompt</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderEnhancementPhase = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Mejorar descripción</h3>
        <p className="text-gray-300">
          ¿Te gustaría que la IA mejore tu descripción para obtener mejores resultados?
        </p>
      </div>

      {!enhancedPrompt ? (
        <div className="bg-codestorm-darker rounded-lg p-6 border border-gray-700">
          <div className="flex items-center space-x-2 mb-3">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <h4 className="text-sm font-medium text-gray-300">Tu descripción actual</h4>
          </div>
          <div className="text-sm text-gray-300 bg-codestorm-dark rounded p-3 max-h-32 overflow-y-auto mb-4">
            {userInstruction}
          </div>

          <div className="flex justify-center space-x-3">
            <button
              onClick={onSkipEnhancement}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors disabled:opacity-50"
            >
              <span>Continuar sin mejorar</span>
            </button>

            <button
              onClick={onEnhancePrompt}
              disabled={isEnhancing || isProcessing}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-600/80 hover:to-blue-600/80 text-white rounded-md transition-all disabled:opacity-50"
            >
              <Wand2 className="h-4 w-4" />
              <span>{isEnhancing ? 'Mejorando...' : 'Mejorar Prompt'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Prompt */}
            <div className="bg-codestorm-darker rounded-lg p-4 border border-gray-700">
              <div className="flex items-center space-x-2 mb-3">
                <MessageSquare className="h-4 w-4 text-gray-400" />
                <h4 className="text-sm font-medium text-gray-300">Descripción original</h4>
              </div>
              <div className="text-sm text-gray-300 bg-codestorm-dark rounded p-3 max-h-32 overflow-y-auto">
                {userInstruction}
              </div>
            </div>

            {/* Enhanced Prompt */}
            <div className="bg-codestorm-darker rounded-lg p-4 border border-purple-600/50">
              <div className="flex items-center space-x-2 mb-3">
                <Wand2 className="h-4 w-4 text-purple-400" />
                <h4 className="text-sm font-medium text-purple-300">Descripción mejorada por IA</h4>
              </div>
              <div className="text-sm text-white bg-codestorm-dark rounded p-3 max-h-32 overflow-y-auto">
                {enhancedPrompt}
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-3">
            <button
              onClick={onUseOriginal}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Usar Original</span>
            </button>

            <button
              onClick={onUseEnhanced}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md transition-colors disabled:opacity-50"
            >
              <Eye className="h-4 w-4" />
              <span>Usar Mejorada</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderPlanningPhase = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Generando plan</h3>
        <p className="text-gray-300">
          La IA está creando un plan detallado para tu página web...
        </p>
      </div>

      <div className="bg-codestorm-darker rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-codestorm-blue"></div>
          <span className="text-white font-medium">Analizando y planificando...</span>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-codestorm-dark rounded-lg p-4">
            <Layers className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-sm text-gray-300">Estructura</div>
            <div className="text-xs text-gray-400">Secciones y layout</div>
          </div>
          <div className="bg-codestorm-dark rounded-lg p-4">
            <FileText className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-sm text-gray-300">Contenido</div>
            <div className="text-xs text-gray-400">Textos y elementos</div>
          </div>
          <div className="bg-codestorm-dark rounded-lg p-4">
            <Code className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-sm text-gray-300">Funcionalidad</div>
            <div className="text-xs text-gray-400">Interacciones</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApprovalPhase = () => {
    if (!plan) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Revisar Plan</h3>
          <p className="text-gray-300">
            Revisa el plan generado y decide si proceder con la generación de archivos.
          </p>
        </div>

        {/* Plan Overview */}
        <div className="bg-codestorm-darker rounded-lg p-6 border border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="h-5 w-5 text-blue-400" />
            <h4 className="text-lg font-semibold text-white">{plan.title}</h4>
          </div>
          <p className="text-gray-300 mb-4">{plan.description}</p>

          {/* Design Specifications */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-300 mb-2">Especificaciones de Diseño</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Colores:</span>
                <span className="text-white ml-2">{plan.design.colorScheme}</span>
              </div>
              <div>
                <span className="text-gray-400">Tipografía:</span>
                <span className="text-white ml-2">{plan.design.typography}</span>
              </div>
              <div>
                <span className="text-gray-400">Layout:</span>
                <span className="text-white ml-2">{plan.design.layout}</span>
              </div>
              <div>
                <span className="text-gray-400">Estilo:</span>
                <span className="text-white ml-2">{plan.design.style}</span>
              </div>
            </div>
          </div>

          {/* Structure Sections */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-300 mb-2">Estructura de Secciones</h5>
            <div className="space-y-2">
              {plan.structure.map((section) => (
                <div key={section.id} className="bg-codestorm-dark rounded p-3">
                  <div className="flex items-center justify-between">
                    <h6 className="text-white font-medium">{section.section}</h6>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="text-gray-400 hover:text-white"
                    >
                      {expandedSections[section.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                  {expandedSections[section.id] && (
                    <div className="mt-2">
                      <p className="text-gray-300 text-sm mb-2">{section.description}</p>
                      <div className="text-xs text-gray-400">
                        <strong>Contenido:</strong> {section.content.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Functionality */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-300 mb-2">Funcionalidades</h5>
            <div className="flex flex-wrap gap-2">
              {plan.functionality.map((func, index) => (
                <span key={index} className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-xs">
                  {func}
                </span>
              ))}
            </div>
          </div>

          {/* Complexity */}
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">Complejidad estimada:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              plan.estimatedComplexity === 'low' ? 'bg-green-600/20 text-green-300' :
              plan.estimatedComplexity === 'medium' ? 'bg-yellow-600/20 text-yellow-300' :
              'bg-red-600/20 text-red-300'
            }`}>
              {plan.estimatedComplexity === 'low' ? 'Baja' :
               plan.estimatedComplexity === 'medium' ? 'Media' : 'Alta'}
            </span>
          </div>
        </div>

        {/* Feedback Input */}
        {showFeedbackInput && (
          <div className="bg-codestorm-darker rounded-lg p-4 border border-yellow-600/50">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Comentarios (requerido para rechazar)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Explica qué cambios necesitas en el plan..."
              rows={3}
              className="w-full px-3 py-2 bg-codestorm-dark border border-gray-600 rounded text-white placeholder-gray-400 focus:border-yellow-600 focus:outline-none"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
          >
            <XCircle className="h-5 w-5" />
            <span>Rechazar Plan</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-md transition-all disabled:opacity-50"
          >
            <CheckCircle className="h-5 w-5" />
            <span>Aprobar y Generar</span>
          </button>
        </div>
      </div>
    );
  };

  const renderCoordinationPhase = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Coordinando Agentes Especializados</h3>
        <p className="text-gray-300">
          Los agentes especializados están trabajando en tu página web...
        </p>
      </div>

      <div className="bg-codestorm-darker rounded-lg p-6 border border-gray-700">
        {coordinationProgress && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-medium">{coordinationProgress.stage}</span>
              <span className="text-gray-400 text-sm">{coordinationProgress.progress}%</span>
            </div>

            <div className="w-full bg-codestorm-dark rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${coordinationProgress.progress}%` }}
              />
            </div>

            <div className="text-center">
              <div className="text-purple-400 font-medium">{coordinationProgress.currentAgent}</div>
              <div className="text-gray-400 text-sm">Agente activo</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
          <div className={`bg-codestorm-dark rounded-lg p-4 border-2 transition-all ${
            coordinationProgress?.currentAgent === 'Design Architect Agent'
              ? 'border-purple-600 bg-purple-600/10'
              : 'border-gray-700'
          }`}>
            <Palette className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-sm text-gray-300 text-center">Design Architect</div>
            <div className="text-xs text-gray-400 text-center">CSS y Estilos</div>
          </div>

          <div className={`bg-codestorm-dark rounded-lg p-4 border-2 transition-all ${
            coordinationProgress?.currentAgent === 'Code Constructor Agent'
              ? 'border-blue-600 bg-blue-600/10'
              : 'border-gray-700'
          }`}>
            <FileText className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-sm text-gray-300 text-center">Code Constructor</div>
            <div className="text-xs text-gray-400 text-center">HTML Estructura</div>
          </div>

          <div className={`bg-codestorm-dark rounded-lg p-4 border-2 transition-all ${
            coordinationProgress?.currentAgent === 'JavaScript Agent'
              ? 'border-yellow-600 bg-yellow-600/10'
              : 'border-gray-700'
          }`}>
            <Code className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-sm text-gray-300 text-center">JavaScript Agent</div>
            <div className="text-xs text-gray-400 text-center">Funcionalidad</div>
          </div>

          <div className={`bg-codestorm-dark rounded-lg p-4 border-2 transition-all ${
            coordinationProgress?.currentAgent === 'GIFT Agent'
              ? 'border-pink-600 bg-pink-600/10'
              : 'border-gray-700'
          }`}>
            <Sparkles className="h-8 w-8 text-pink-400 mx-auto mb-2" />
            <div className="text-sm text-gray-300 text-center">GIFT Agent</div>
            <div className="text-xs text-gray-400 text-center">Iconos y Animaciones</div>
          </div>

          <div className={`bg-codestorm-dark rounded-lg p-4 border-2 transition-all ${
            coordinationProgress?.currentAgent === 'Production Agent'
              ? 'border-green-600 bg-green-600/10'
              : 'border-gray-700'
          }`}>
            <Eye className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-sm text-gray-300 text-center">Production Agent</div>
            <div className="text-xs text-gray-400 text-center">Control de Calidad</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompletedPhase = () => {
    // Crear el documento HTML completo para la vista previa
    const createPreviewDocument = () => {
      if (!generatedFiles) return '';

      return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vista Previa - CODESTORM WebAI</title>
  <style>
    ${generatedFiles.css}
  </style>
</head>
<body>
  ${generatedFiles.html}
  <script>
    ${generatedFiles.js}
  </script>
</body>
</html>`;
    };

    return (
      <div className="space-y-6">
        {/* Header de éxito */}
        <div className="text-center">
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">¡Página web generada!</h3>
            <p className="text-gray-300">
              Se han creado 3 archivos optimizados: index.html, styles.css y script.js
            </p>
            <p className="text-gray-400 text-sm mt-2">
              ✅ Revisado por el Production Agent para garantizar calidad profesional
            </p>
          </div>
        </div>

        {/* Pestañas de navegación */}
        {generatedFiles && (
          <div className="bg-codestorm-darker rounded-lg border border-gray-700">
            {/* Tab Headers */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setActiveTab('plan')}
                className={`px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === 'plan'
                    ? 'text-white bg-codestorm-dark border-b-2 border-green-500'
                    : 'text-gray-400 hover:text-white hover:bg-codestorm-dark/50'
                }`}
              >
                <CheckCircle className="inline-block w-4 h-4 mr-2" />
                Resumen del Plan
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === 'preview'
                    ? 'text-white bg-codestorm-dark border-b-2 border-green-500'
                    : 'text-gray-400 hover:text-white hover:bg-codestorm-dark/50'
                }`}
              >
                <Eye className="inline-block w-4 h-4 mr-2" />
                Vista Previa
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'plan' ? (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Plan Ejecutado Exitosamente</h4>
                  {plan && (
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-400">Título:</span>
                        <span className="text-white ml-2">{plan.title}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Descripción:</span>
                        <p className="text-gray-300 mt-1">{plan.description}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Secciones implementadas:</span>
                        <div className="mt-2 space-y-1">
                          {plan.structure.map((section, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-400" />
                              <span className="text-gray-300">{section.section}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Funcionalidades:</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {plan.functionality.map((func, index) => (
                            <span key={index} className="bg-green-600/20 text-green-300 px-2 py-1 rounded text-xs">
                              {func}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-white">Vista Previa de la Página Web</h4>
                    <div className="text-sm text-gray-400">
                      HTML: {generatedFiles.html.split('\n').length} líneas •
                      CSS: {generatedFiles.css.split('\n').length} líneas •
                      JS: {generatedFiles.js.split('\n').length} líneas
                    </div>
                  </div>

                  {/* Vista previa en iframe */}
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="bg-white shadow-lg mx-auto" style={{ maxWidth: '1200px' }}>
                      <iframe
                        srcDoc={createPreviewDocument()}
                        title="Vista previa de la página web generada"
                        className="w-full h-[600px] border-0 rounded"
                        sandbox="allow-same-origin allow-scripts"
                      />
                    </div>
                  </div>

                  <div className="text-center text-sm text-gray-400">
                    ✨ Vista previa en tiempo real de tu página web generada
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCurrentPhase = () => {
    switch (currentPhase) {
      case 'input':
        return renderInputPhase();
      case 'enhancement':
        return renderEnhancementPhase();
      case 'planning':
        return renderPlanningPhase();
      case 'approval':
        return renderApprovalPhase();
      case 'coordination':
        return renderCoordinationPhase();
      case 'completed':
        return renderCompletedPhase();
      default:
        return renderInputPhase();
    }
  };

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-lg p-6 h-full">
      {renderCurrentPhase()}
    </div>
  );
};

export default UnifiedPlanningInterface;
