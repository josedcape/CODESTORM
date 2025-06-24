import React, { useState, useEffect } from 'react';
import { Palette, Type, Monitor, Sparkles, ArrowRight, ArrowLeft, MessageSquare, Settings, Wand2, RefreshCw, Eye } from 'lucide-react';
import UnifiedPlanningInterface, { WebPagePlan } from './UnifiedPlanningInterface';
import { UnifiedPlanningService, PlanningState } from '../../services/UnifiedPlanningService';

interface WebPageRequirements {
  pageTitle: string;
  pageTheme: string;
  colorScheme: string;
  styleRequirements: string;
  targetAudience: string;
}

interface WebPageBuilderProps {
  onGeneratePage: (requirements: WebPageRequirements) => void;
  onGenerateFromPrompt: (prompt: string) => void;
  onEnhancePrompt: (prompt: string) => Promise<{ success: boolean; enhancedPrompt?: string; error?: string }>;
  onBack: () => void;
  isProcessing: boolean;
  onFilesGenerated?: (files: Array<{ name: string; content: string; type: string }>) => void;
}

const WebPageBuilder: React.FC<WebPageBuilderProps> = ({
  onGeneratePage,
  onGenerateFromPrompt,
  onEnhancePrompt,
  onBack,
  isProcessing,
  onFilesGenerated
}) => {
  const [workflowMode, setWorkflowMode] = useState<'select' | 'guided' | 'prompt'>('select');
  const [currentStep, setCurrentStep] = useState<'plan' | 'requirements' | 'generate'>('plan');
  const [requirements, setRequirements] = useState<WebPageRequirements>({
    pageTitle: '',
    pageTheme: '',
    colorScheme: '',
    styleRequirements: '',
    targetAudience: ''
  });
  const [directPrompt, setDirectPrompt] = useState<string>('');
  const [enhancedPrompt, setEnhancedPrompt] = useState<string>('');
  const [showEnhancedPrompt, setShowEnhancedPrompt] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [originalPrompt, setOriginalPrompt] = useState<string>('');

  // Unified Planning State
  const [planningService, setPlanningService] = useState<UnifiedPlanningService | null>(null);
  const [planningState, setPlanningState] = useState<PlanningState | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [progressValue, setProgressValue] = useState<number>(0);

  // Initialize unified planning service
  useEffect(() => {
    if (workflowMode === 'unified' && !planningService) {
      const service = new UnifiedPlanningService({
        onStateChange: (state) => {
          setPlanningState(state);
        },
        onProgress: (message, progress) => {
          setProgressMessage(message);
          setProgressValue(progress);
        },
        onError: (error) => {
          console.error('Planning error:', error);
          alert(`Error en el proceso: ${error}`);
        },
        onComplete: (files) => {
          console.log('Files generated:', files);
          if (onFilesGenerated) {
            onFilesGenerated(files);
          }
        }
      });
      setPlanningService(service);
      setPlanningState(service.getState());
    }
  }, [workflowMode, planningService, onFilesGenerated]);

  const handleNext = () => {
    if (currentStep === 'plan') {
      setCurrentStep('requirements');
    } else if (currentStep === 'requirements') {
      setCurrentStep('generate');
    }
  };

  const handlePrevious = () => {
    if (currentStep === 'requirements') {
      setCurrentStep('plan');
    } else if (currentStep === 'generate') {
      setCurrentStep('requirements');
    }
  };

  const handleGenerate = () => {
    onGeneratePage(requirements);
  };

  const handleGenerateFromPrompt = async () => {
    const promptToUse = showEnhancedPrompt ? enhancedPrompt : directPrompt;

    if (!promptToUse.trim()) {
      alert('Por favor, escribe una descripción antes de generar la página web.');
      return;
    }

    if (promptToUse.trim().length < 10) {
      alert('Por favor, escribe al menos 10 caracteres para generar la página web.');
      return;
    }

    try {
      console.log('🚀 Iniciando generación de página web...');
      onGenerateFromPrompt(promptToUse);
    } catch (error) {
      console.error('❌ Error generating web page:', error);
      alert(`Error al generar la página web: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleEnhancePrompt = async () => {
    if (directPrompt.trim().length < 10) {
      alert('Por favor, escribe al menos 10 caracteres para mejorar el prompt.');
      return;
    }

    setIsEnhancing(true);
    setOriginalPrompt(directPrompt);

    try {
      console.log('🎨 Iniciando mejora de prompt...');
      const result = await onEnhancePrompt(directPrompt);

      if (result.success && result.enhancedPrompt) {
        setEnhancedPrompt(result.enhancedPrompt);
        setShowEnhancedPrompt(true);
        console.log('✅ Prompt mejorado exitosamente');
      } else {
        console.error('❌ Error enhancing prompt:', result.error);
        alert(`Error al mejorar el prompt: ${result.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('❌ Error enhancing prompt:', error);
      alert(`Error inesperado al mejorar el prompt: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleRevertToOriginal = () => {
    setShowEnhancedPrompt(false);
    setEnhancedPrompt('');
  };

  const handleUseEnhanced = () => {
    setDirectPrompt(enhancedPrompt);
    setShowEnhancedPrompt(false);
    setEnhancedPrompt('');
  };

  const handleSelectWorkflow = (mode: 'guided' | 'prompt') => {
    setWorkflowMode(mode);
    if (mode === 'guided') {
      setCurrentStep('plan');
    }
    // Reset prompt enhancement state when switching workflows
    setShowEnhancedPrompt(false);
    setEnhancedPrompt('');
    setOriginalPrompt('');

    // Initialize planning service for prompt mode
    if (mode === 'prompt' && !planningService) {
      const service = new UnifiedPlanningService({
        onStateChange: (state) => {
          setPlanningState(state);
        },
        onProgress: (message, progress) => {
          setProgressMessage(message);
          setProgressValue(progress);
        },
        onError: (error) => {
          console.error('Planning error:', error);
          alert(`Error en el proceso: ${error}`);
        },
        onComplete: (files) => {
          console.log('Files generated:', files);
          if (onFilesGenerated) {
            onFilesGenerated(files);
          }
        }
      });
      setPlanningService(service);
      setPlanningState(service.getState());
    }
  };

  // Unified Planning Handlers
  const handleUnifiedInstructionChange = (instruction: string) => {
    if (planningService) {
      planningService.updateInstruction(instruction);
    }
  };

  const handleUnifiedStartPlanning = async () => {
    if (planningService) {
      try {
        await planningService.startPlanning();
      } catch (error) {
        console.error('Error starting planning:', error);
        alert(`Error al iniciar planificación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }
  };

  const handleUnifiedStartDirectPlanning = async () => {
    if (planningService) {
      try {
        await planningService.startDirectPlanning();
      } catch (error) {
        console.error('Error starting direct planning:', error);
        alert(`Error al iniciar planificación directa: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }
  };

  const handleUnifiedGoToEnhancement = () => {
    if (planningService) {
      try {
        planningService.goToEnhancement();
      } catch (error) {
        console.error('Error going to enhancement:', error);
        alert(`Error al ir a mejora: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }
  };

  const handleUnifiedEnhancePrompt = async () => {
    if (planningService) {
      try {
        await planningService.enhancePrompt();
      } catch (error) {
        console.error('Error enhancing prompt:', error);
      }
    }
  };

  const handleUnifiedSkipEnhancement = async () => {
    if (planningService) {
      try {
        await planningService.skipEnhancement();
      } catch (error) {
        console.error('Error skipping enhancement:', error);
      }
    }
  };

  const handleUnifiedUseEnhanced = async () => {
    if (planningService) {
      try {
        await planningService.useEnhancedPrompt();
      } catch (error) {
        console.error('Error using enhanced prompt:', error);
      }
    }
  };

  const handleUnifiedUseOriginal = async () => {
    if (planningService) {
      try {
        await planningService.useOriginalPrompt();
      } catch (error) {
        console.error('Error using original prompt:', error);
      }
    }
  };

  const handleUnifiedApprovePlan = async (approved: boolean, feedback?: string) => {
    if (planningService) {
      try {
        if (approved) {
          await planningService.approvePlan(feedback);
        } else {
          await planningService.rejectPlan(feedback || 'Plan rechazado sin comentarios');
        }
      } catch (error) {
        console.error('Error processing plan approval:', error);
      }
    }
  };

  const handleUnifiedRejectPlan = async (feedback: string) => {
    if (planningService) {
      try {
        await planningService.rejectPlan(feedback);
      } catch (error) {
        console.error('Error rejecting plan:', error);
      }
    }
  };

  const isRequirementsComplete = () => {
    return requirements.pageTitle.trim() !== '' &&
           requirements.pageTheme.trim() !== '' &&
           requirements.colorScheme.trim() !== '';
  };

  const colorSchemeOptions = [
    { name: 'Azul Profesional', value: 'blue-professional', colors: ['#1e40af', '#3b82f6', '#93c5fd'] },
    { name: 'Verde Moderno', value: 'green-modern', colors: ['#059669', '#10b981', '#6ee7b7'] },
    { name: 'Púrpura Creativo', value: 'purple-creative', colors: ['#7c3aed', '#8b5cf6', '#c4b5fd'] },
    { name: 'Naranja Energético', value: 'orange-energetic', colors: ['#ea580c', '#f97316', '#fed7aa'] },
    { name: 'Rosa Elegante', value: 'pink-elegant', colors: ['#db2777', '#ec4899', '#f9a8d4'] },
    { name: 'Gris Minimalista', value: 'gray-minimal', colors: ['#374151', '#6b7280', '#d1d5db'] }
  ];

  const themeOptions = [
    'Sitio web corporativo',
    'Landing page de producto',
    'Portafolio personal',
    'Página de servicios',
    'Sitio de evento',
    'Blog personal',
    'Página de contacto',
    'Sitio de restaurante',
    'Página de aplicación móvil',
    'Sitio de consultoría'
  ];

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-lg p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-codestorm-blue to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Constructor de Páginas Web</h2>
            <p className="text-gray-400 text-sm">Crea páginas web modernas y atractivas</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-3 py-2 bg-codestorm-darker rounded-md text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>
      </div>

      {/* Progress Steps - Only for guided workflow */}
      {workflowMode === 'guided' && (
        <div className="flex items-center justify-center mb-8">
        <div className={`flex items-center ${currentStep === 'plan' ? 'text-codestorm-blue' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'plan' ? 'bg-codestorm-blue text-white' : 'bg-codestorm-darker text-gray-400'}`}>1</div>
          <span className="ml-2">Plan</span>
        </div>
        <div className="w-12 h-1 mx-2 bg-codestorm-darker"></div>
        <div className={`flex items-center ${currentStep === 'requirements' ? 'text-codestorm-blue' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'requirements' ? 'bg-codestorm-blue text-white' : 'bg-codestorm-darker text-gray-400'}`}>2</div>
          <span className="ml-2">Requisitos</span>
        </div>
        <div className="w-12 h-1 mx-2 bg-codestorm-darker"></div>
        <div className={`flex items-center ${currentStep === 'generate' ? 'text-codestorm-blue' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'generate' ? 'bg-codestorm-blue text-white' : 'bg-codestorm-darker text-gray-400'}`}>3</div>
          <span className="ml-2">Generar</span>
        </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1">
        {workflowMode === 'select' && (
          <div className="text-center space-y-8">
            <div className="bg-gradient-to-r from-codestorm-blue/20 to-purple-600/20 rounded-lg p-6 border border-codestorm-blue/30">
              <h3 className="text-2xl font-bold text-white mb-4">
                ¿Cómo prefieres crear tu página web?
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                Elige el método que mejor se adapte a tu estilo de trabajo
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Guided Workflow Option */}
              <div
                onClick={() => handleSelectWorkflow('guided')}
                className="bg-codestorm-darker rounded-lg p-6 border border-gray-700 hover:border-codestorm-blue cursor-pointer transition-all duration-200 hover:bg-codestorm-darker/80"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-codestorm-blue rounded-lg flex items-center justify-center">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Workflow Guiado</h4>
                    <p className="text-gray-400">Paso a paso estructurado</p>
                  </div>
                </div>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-codestorm-blue rounded-full"></div>
                    <span>Formularios organizados</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-codestorm-blue rounded-full"></div>
                    <span>Selección visual de colores</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-codestorm-blue rounded-full"></div>
                    <span>Opciones predefinidas</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-codestorm-blue rounded-full"></div>
                    <span>Perfecto para principiantes</span>
                  </li>
                </ul>
              </div>

              {/* Enhanced Direct Prompt Option */}
              <div
                onClick={() => handleSelectWorkflow('prompt')}
                className="bg-codestorm-darker rounded-lg p-6 border border-gray-700 hover:border-purple-600 cursor-pointer transition-all duration-200 hover:bg-codestorm-darker/80"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Prompt Directo</h4>
                    <p className="text-gray-400">Con planificación y aprobación</p>
                  </div>
                </div>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span>Descripción en lenguaje natural</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span>Mejora opcional de prompt</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span>Plan detallado para aprobación</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span>Coordinación de agentes especializados</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Direct Prompt with Planning Workflow */}
        {workflowMode === 'prompt' && planningState && (
          <UnifiedPlanningInterface
            userInstruction={planningState.userInstruction}
            onInstructionChange={handleUnifiedInstructionChange}
            onStartPlanning={handleUnifiedStartPlanning}
            onStartDirectPlanning={handleUnifiedStartDirectPlanning}
            onGoToEnhancement={handleUnifiedGoToEnhancement}
            enhancedPrompt={planningState.enhancedPrompt}
            isEnhancing={planningState.isProcessing && planningState.currentPhase === 'enhancement'}
            onEnhancePrompt={handleUnifiedEnhancePrompt}
            onSkipEnhancement={handleUnifiedSkipEnhancement}
            onUseEnhanced={handleUnifiedUseEnhanced}
            onUseOriginal={handleUnifiedUseOriginal}
            plan={planningState.plan}
            isGeneratingPlan={planningState.isProcessing && planningState.currentPhase === 'planning'}
            onApprovePlan={handleUnifiedApprovePlan}
            onRejectPlan={handleUnifiedRejectPlan}
            currentPhase={planningState.currentPhase}
            isProcessing={planningState.isProcessing}
            coordinationProgress={planningState.coordinationProgress}
            generatedFiles={planningState.generatedFiles}
            onBack={() => setWorkflowMode('select')}
          />
        )}

        {workflowMode === 'guided' && currentStep === 'plan' && (
          <div className="text-center space-y-6">
            <div className="bg-gradient-to-r from-codestorm-blue/20 to-purple-600/20 rounded-lg p-6 border border-codestorm-blue/30">
              <h3 className="text-2xl font-bold text-white mb-4">
                Entiendo que quieres una página web moderna y visualmente atractiva
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                Voy a ayudarte a crear una página web impresionante que capture la atención de tus visitantes
                y los motive a tomar acción. Para esto, necesito recopilar algunos detalles importantes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-codestorm-darker rounded-lg p-4 border border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <Type className="h-5 w-5 text-codestorm-blue" />
                  <h4 className="font-semibold text-white">Título de la página</h4>
                </div>
                <p className="text-gray-400 text-sm">El nombre principal de tu sitio web</p>
              </div>

              <div className="bg-codestorm-darker rounded-lg p-4 border border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <Monitor className="h-5 w-5 text-codestorm-blue" />
                  <h4 className="font-semibold text-white">Tema/Propósito</h4>
                </div>
                <p className="text-gray-400 text-sm">El tipo de sitio web que necesitas</p>
              </div>

              <div className="bg-codestorm-darker rounded-lg p-4 border border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <Palette className="h-5 w-5 text-codestorm-blue" />
                  <h4 className="font-semibold text-white">Esquema de colores</h4>
                </div>
                <p className="text-gray-400 text-sm">Los colores que mejor representen tu marca</p>
              </div>

              <div className="bg-codestorm-darker rounded-lg p-4 border border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <Sparkles className="h-5 w-5 text-codestorm-blue" />
                  <h4 className="font-semibold text-white">Estilo específico</h4>
                </div>
                <p className="text-gray-400 text-sm">Cualquier requerimiento de diseño especial</p>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="flex items-center space-x-2 bg-codestorm-blue hover:bg-codestorm-blue/80 text-white font-medium py-3 px-6 rounded-md transition-colors mx-auto"
            >
              <span>Comenzar</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {workflowMode === 'guided' && currentStep === 'requirements' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">Especifica los detalles de tu página web</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Título de la página */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título de la página *
                </label>
                <input
                  type="text"
                  value={requirements.pageTitle}
                  onChange={(e) => setRequirements(prev => ({ ...prev, pageTitle: e.target.value }))}
                  placeholder="Ej: Mi Empresa Innovadora"
                  className="w-full px-3 py-2 bg-codestorm-darker border border-gray-600 rounded-md text-white placeholder-gray-400 focus:border-codestorm-blue focus:outline-none"
                />
              </div>

              {/* Tema/Propósito */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tema/Propósito *
                </label>
                <select
                  value={requirements.pageTheme}
                  onChange={(e) => setRequirements(prev => ({ ...prev, pageTheme: e.target.value }))}
                  className="w-full px-3 py-2 bg-codestorm-darker border border-gray-600 rounded-md text-white focus:border-codestorm-blue focus:outline-none"
                >
                  <option value="">Selecciona un tema</option>
                  {themeOptions.map((theme) => (
                    <option key={theme} value={theme}>{theme}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Esquema de colores */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Esquema de colores *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {colorSchemeOptions.map((scheme) => (
                  <button
                    key={scheme.value}
                    onClick={() => setRequirements(prev => ({ ...prev, colorScheme: scheme.value }))}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      requirements.colorScheme === scheme.value
                        ? 'border-codestorm-blue bg-codestorm-blue/20'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex space-x-1 mb-2">
                      {scheme.colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-white">{scheme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Audiencia objetivo */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Audiencia objetivo
              </label>
              <input
                type="text"
                value={requirements.targetAudience}
                onChange={(e) => setRequirements(prev => ({ ...prev, targetAudience: e.target.value }))}
                placeholder="Ej: Profesionales jóvenes, Empresas tecnológicas, etc."
                className="w-full px-3 py-2 bg-codestorm-darker border border-gray-600 rounded-md text-white placeholder-gray-400 focus:border-codestorm-blue focus:outline-none"
              />
            </div>

            {/* Requisitos de estilo */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Requisitos de estilo específicos
              </label>
              <textarea
                value={requirements.styleRequirements}
                onChange={(e) => setRequirements(prev => ({ ...prev, styleRequirements: e.target.value }))}
                placeholder="Ej: Animaciones suaves, diseño minimalista, efectos de parallax, etc."
                rows={3}
                className="w-full px-3 py-2 bg-codestorm-darker border border-gray-600 rounded-md text-white placeholder-gray-400 focus:border-codestorm-blue focus:outline-none resize-none"
              />
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                className="flex items-center space-x-2 px-4 py-2 bg-codestorm-darker text-gray-300 rounded-md hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Anterior</span>
              </button>

              <button
                onClick={handleNext}
                disabled={!isRequirementsComplete()}
                className={`flex items-center space-x-2 px-6 py-2 rounded-md font-medium transition-colors ${
                  isRequirementsComplete()
                    ? 'bg-codestorm-blue hover:bg-codestorm-blue/80 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>Continuar</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {workflowMode === 'guided' && currentStep === 'generate' && (
          <div className="text-center space-y-6">
            <div className="bg-codestorm-darker rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Resumen del proyecto</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <span className="text-gray-400">Título:</span>
                  <p className="text-white font-medium">{requirements.pageTitle}</p>
                </div>
                <div>
                  <span className="text-gray-400">Tema:</span>
                  <p className="text-white font-medium">{requirements.pageTheme}</p>
                </div>
                <div>
                  <span className="text-gray-400">Colores:</span>
                  <p className="text-white font-medium">
                    {colorSchemeOptions.find(s => s.value === requirements.colorScheme)?.name}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Audiencia:</span>
                  <p className="text-white font-medium">{requirements.targetAudience || 'General'}</p>
                </div>
              </div>

              {requirements.styleRequirements && (
                <div className="mt-4 text-left">
                  <span className="text-gray-400">Requisitos especiales:</span>
                  <p className="text-white font-medium">{requirements.styleRequirements}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={isProcessing}
                className="flex items-center space-x-2 px-4 py-2 bg-codestorm-darker text-gray-300 rounded-md hover:text-white transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Anterior</span>
              </button>

              <button
                onClick={handleGenerate}
                disabled={isProcessing}
                className="flex items-center space-x-2 bg-gradient-to-r from-codestorm-blue to-purple-600 hover:from-codestorm-blue/80 hover:to-purple-600/80 text-white font-medium py-3 px-8 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-5 w-5" />
                <span>{isProcessing ? 'Generando...' : 'Generar Página Web'}</span>
              </button>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default WebPageBuilder;
