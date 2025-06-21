import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft, Wand2, Eye, RefreshCw, MessageSquare, CheckCircle, XCircle, FileText, Code, Palette } from 'lucide-react';
import { WebAIWorkflowService, WebAIWorkflowState, WebPagePlan } from '../../services/WebAIWorkflowService';
import { ChatMessage, FileItem, ApprovalData } from '../../types';
import ApprovalInterface from '../constructor/ApprovalInterface';

interface WebAIWorkflowProps {
  onBack: () => void;
  onFilesGenerated: (files: FileItem[]) => void;
  onChatMessage: (message: ChatMessage) => void;
}

const WebAIWorkflow: React.FC<WebAIWorkflowProps> = ({
  onBack,
  onFilesGenerated,
  onChatMessage
}) => {
  const [workflowService] = useState(() => WebAIWorkflowService.getInstance());
  const [workflowState, setWorkflowState] = useState<WebAIWorkflowState>(workflowService.getState());
  const [userInstruction, setUserInstruction] = useState<string>('');
  const [showEnhancedPrompt, setShowEnhancedPrompt] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);

  useEffect(() => {
    // Subscribe to workflow state changes
    workflowService.onStateChange((state) => {
      setWorkflowState(state);
    });

    // Subscribe to chat messages
    workflowService.onChatMessage((message) => {
      onChatMessage(message);
    });

    // Subscribe to file updates
    workflowService.onFileUpdate((files) => {
      onFilesGenerated(files);
    });

    return () => {
      // Cleanup would go here if needed
    };
  }, [workflowService, onChatMessage, onFilesGenerated]);

  const handleStartWorkflow = async () => {
    if (userInstruction.trim().length < 1) {
      alert('Por favor, escribe una descripción antes de iniciar el workflow.');
      return;
    }

    try {
      console.log('🚀 Iniciando WebAI Workflow con instrucción:', userInstruction);
      await workflowService.startWorkflow(userInstruction);
      console.log('✅ Workflow iniciado exitosamente');
    } catch (error) {
      console.error('❌ Error al iniciar workflow:', error);
      alert(`Error al iniciar el workflow: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleEnhancePrompt = async () => {
    setIsEnhancing(true);

    try {
      console.log('🎨 Iniciando mejora de prompt en workflow...');
      const result = await workflowService.enhancePrompt();

      if (result.success) {
        setShowEnhancedPrompt(true);
        console.log('✅ Prompt mejorado exitosamente en workflow');
      } else {
        console.error('❌ Error al mejorar prompt en workflow:', result.error);
        alert(`Error al mejorar el prompt: ${result.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('❌ Error inesperado al mejorar prompt en workflow:', error);
      alert(`Error inesperado al mejorar el prompt: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleProceedWithPrompt = async (useEnhanced: boolean) => {
    try {
      console.log(`🚀 Procediendo con prompt ${useEnhanced ? 'mejorado' : 'original'}...`);
      await workflowService.proceedWithPrompt(useEnhanced);
      setShowEnhancedPrompt(false);
      console.log('✅ Procedimiento completado exitosamente');
    } catch (error) {
      console.error('❌ Error al proceder con prompt:', error);
      alert(`Error al proceder: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleSkipEnhancement = async () => {
    try {
      console.log('⏭️ Saltando mejora de prompt...');
      await workflowService.skipEnhancement();
      console.log('✅ Mejora saltada exitosamente');
    } catch (error) {
      console.error('❌ Error al saltar mejora:', error);
      alert(`Error al saltar mejora: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleApprovePlan = async (approved: boolean, feedback?: string) => {
    try {
      console.log(`${approved ? '✅' : '❌'} ${approved ? 'Aprobando' : 'Rechazando'} plan...`);
      await workflowService.approvePlan(approved, feedback);
      console.log(`✅ Plan ${approved ? 'aprobado' : 'rechazado'} exitosamente`);
    } catch (error) {
      console.error('❌ Error al procesar aprobación del plan:', error);
      alert(`Error al procesar aprobación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const getCurrentStepName = (): string => {
    const currentStep = workflowService.getCurrentStep();
    return currentStep ? currentStep.name : 'Inicio';
  };

  const getStepProgress = (): number => {
    return Math.round((workflowState.currentStep / (workflowState.steps.length - 1)) * 100);
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Progreso del Workflow</h3>
        <span className="text-sm text-gray-400">{getStepProgress()}% completado</span>
      </div>
      <div className="w-full bg-codestorm-darker rounded-full h-2">
        <div
          className="bg-gradient-to-r from-codestorm-blue to-purple-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${getStepProgress()}%` }}
        />
      </div>
      <div className="mt-2 text-sm text-gray-300">
        Paso actual: {getCurrentStepName()}
      </div>
    </div>
  );

  const renderInstructionInput = () => (
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
          onChange={(e) => setUserInstruction(e.target.value)}
          placeholder="Ejemplo: Quiero una landing page moderna para mi startup de tecnología. Debe tener un diseño minimalista con colores azul y blanco, una sección hero impactante con call-to-action, sección de características del producto, testimonios de clientes, y un formulario de contacto. El estilo debe ser profesional pero innovador, con animaciones suaves y diseño responsive..."
          rows={8}
          className="w-full px-4 py-3 bg-codestorm-dark border border-gray-600 rounded-md text-white placeholder-gray-400 focus:border-purple-600 focus:outline-none resize-none"
        />
        <div className="mt-2 text-sm text-gray-400">
          Describe tu página web. Sé específico sobre colores, estilo, contenido y funcionalidades.
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 bg-codestorm-darker text-gray-300 rounded-md hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>

        <button
          onClick={handleStartWorkflow}
          disabled={userInstruction.trim().length < 1 || workflowState.isProcessing}
          className={`flex items-center space-x-2 px-8 py-3 rounded-md font-medium transition-all ${
            userInstruction.trim().length >= 1 && !workflowState.isProcessing
              ? 'bg-gradient-to-r from-codestorm-blue to-purple-600 hover:from-codestorm-blue/80 hover:to-purple-600/80 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Sparkles className="h-5 w-5" />
          <span>Iniciar Workflow</span>
        </button>
      </div>
    </div>
  );

  const renderPromptEnhancement = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Mejorar descripción</h3>
        <p className="text-gray-300">
          ¿Te gustaría que la IA mejore tu descripción para obtener mejores resultados?
        </p>
      </div>

      {!showEnhancedPrompt ? (
        <div className="bg-codestorm-darker rounded-lg p-6 border border-gray-700">
          <div className="flex items-center space-x-2 mb-3">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <h4 className="text-sm font-medium text-gray-300">Tu descripción actual</h4>
          </div>
          <div className="text-sm text-gray-300 bg-codestorm-dark rounded p-3 max-h-32 overflow-y-auto mb-4">
            {workflowState.userInstruction}
          </div>

          <div className="flex justify-center space-x-3">
            <button
              onClick={handleSkipEnhancement}
              disabled={false}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors disabled:opacity-50"
            >
              <span>Continuar sin mejorar</span>
            </button>

            <button
              onClick={handleEnhancePrompt}
              disabled={isEnhancing}
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
                {workflowState.userInstruction}
              </div>
            </div>

            {/* Enhanced Prompt */}
            <div className="bg-codestorm-darker rounded-lg p-4 border border-purple-600/50">
              <div className="flex items-center space-x-2 mb-3">
                <Wand2 className="h-4 w-4 text-purple-400" />
                <h4 className="text-sm font-medium text-purple-300">Descripción mejorada por IA</h4>
              </div>
              <div className="text-sm text-white bg-codestorm-dark rounded p-3 max-h-32 overflow-y-auto">
                {workflowState.enhancedPrompt}
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-3">
            <button
              onClick={() => handleProceedWithPrompt(false)}
              disabled={false}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Usar Original</span>
            </button>

            <button
              onClick={() => handleProceedWithPrompt(true)}
              disabled={false}
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

  const renderPlanApproval = () => {
    if (!workflowState.approvalData) return null;

    return (
      <div className="space-y-6">
        <ApprovalInterface
          approvalData={workflowState.approvalData}
          onApprove={(feedback) => handleApprovePlan(true, feedback)}
          onReject={(feedback) => handleApprovePlan(false, feedback)}
          isLoading={workflowState.isProcessing}
        />
      </div>
    );
  };

  const renderGenerationProgress = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Generando archivos</h3>
        <p className="text-gray-300">
          Los agentes especializados están creando tu página web...
        </p>
      </div>

      <div className="bg-codestorm-darker rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-codestorm-blue"></div>
          <span className="text-white font-medium">Generando archivos...</span>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-codestorm-dark rounded-lg p-4">
            <FileText className="h-8 w-8 text-orange-400 mx-auto mb-2" />
            <div className="text-sm text-gray-300">HTML</div>
            <div className="text-xs text-gray-400">Estructura</div>
          </div>
          <div className="bg-codestorm-dark rounded-lg p-4">
            <Palette className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-sm text-gray-300">CSS</div>
            <div className="text-xs text-gray-400">Estilos</div>
          </div>
          <div className="bg-codestorm-dark rounded-lg p-4">
            <Code className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-sm text-gray-300">JavaScript</div>
            <div className="text-xs text-gray-400">Funcionalidad</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (workflowState.requiresApproval) {
      return renderPlanApproval();
    }

    switch (workflowState.currentStep) {
      case 0:
        return renderInstructionInput();
      case 1:
        return renderPromptEnhancement();
      case 2:
      case 3:
        return workflowState.isProcessing ? renderGenerationProgress() : renderPlanApproval();
      case 4:
        return workflowState.isProcessing ? renderGenerationProgress() : (
          <div className="text-center space-y-6">
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">¡Página web generada!</h3>
              <p className="text-gray-300">
                Se han creado 3 archivos: index.html, styles.css y script.js
              </p>
            </div>
            <button
              onClick={() => workflowService.resetWorkflow()}
              className="flex items-center space-x-2 px-6 py-3 bg-codestorm-blue hover:bg-codestorm-blue/80 text-white rounded-md transition-colors mx-auto"
            >
              <Sparkles className="h-5 w-5" />
              <span>Crear Nueva Página</span>
            </button>
          </div>
        );
      default:
        return renderInstructionInput();
    }
  };

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-lg p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-codestorm-blue to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">WebAI Workflow</h2>
            <p className="text-gray-400 text-sm">Generación inteligente de páginas web</p>
          </div>
        </div>
        {workflowState.currentStep === 0 && (
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-3 py-2 bg-codestorm-darker rounded-md text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </button>
        )}
      </div>

      {/* Progress Indicator */}
      {workflowState.currentStep > 0 && renderStepIndicator()}

      {/* Content */}
      <div className="flex-1">
        {renderContent()}
      </div>
    </div>
  );
};

export default WebAIWorkflow;
