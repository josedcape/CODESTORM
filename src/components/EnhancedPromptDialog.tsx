import React from 'react';
import { EnhancedPrompt } from '../services/PromptEnhancerService';
import { SpecializedEnhanceResult } from '../services/SpecializedEnhancerService';
import {
  X,
  Check,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Info,
  Globe,
  Settings
} from 'lucide-react';

interface EnhancedPromptDialogProps {
  enhancedPrompt: EnhancedPrompt;
  onClose: () => void;
  onUseOriginal: () => void;
  onUseEnhanced: () => void;
  isVisible: boolean;
  specializedResult?: SpecializedEnhanceResult;
  onSelectTechnology?: () => void; // Nueva prop para seleccionar tecnología
}

/**
 * Componente que muestra un diálogo con la versión original y mejorada de un prompt
 * y permite al usuario elegir cuál utilizar
 */
const EnhancedPromptDialog: React.FC<EnhancedPromptDialogProps> = ({
  enhancedPrompt,
  onClose,
  onUseOriginal,
  onUseEnhanced,
  isVisible,
  specializedResult,
  onSelectTechnology
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-codestorm-dark rounded-lg shadow-xl border border-codestorm-blue/30 w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Encabezado */}
        <div className="bg-codestorm-blue/20 p-3 border-b border-codestorm-blue/30 flex justify-between items-center">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-codestorm-gold mr-2" />
            <div className="flex flex-col">
              <h2 className="text-sm font-medium text-white">Mejora de Prompt</h2>
              {specializedResult && (
                <div className="flex items-center mt-1">
                  {specializedResult.context === 'webai' ? (
                    <Globe className="h-3 w-3 text-blue-400 mr-1" />
                  ) : (
                    <Settings className="h-3 w-3 text-green-400 mr-1" />
                  )}
                  <span className="text-xs text-gray-300">
                    {specializedResult.agentType || 'Agente Especializado'}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-codestorm-blue/30 text-gray-400 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Mejoras realizadas */}
          <div className="bg-codestorm-blue/10 rounded-md p-3 border border-codestorm-blue/20">
            <h3 className="text-sm font-medium text-white mb-2 flex items-center">
              <Info className="h-4 w-4 text-codestorm-gold mr-2" />
              Mejoras Realizadas
            </h3>
            <ul className="space-y-1">
              {enhancedPrompt.improvements.map((improvement, index) => (
                <li key={index} className="text-xs text-gray-300 flex items-start">
                  <span className="text-codestorm-gold mr-2">•</span>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>

          {/* Prompt original */}
          <div>
            <h3 className="text-sm font-medium text-white mb-2">Prompt Original</h3>
            <div className="bg-codestorm-darker rounded-md p-3 border border-gray-700 text-sm text-gray-300 whitespace-pre-wrap">
              {enhancedPrompt.originalPrompt}
            </div>
          </div>

          {/* Flecha de transformación */}
          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-codestorm-accent" />
          </div>

          {/* Prompt mejorado */}
          <div>
            <h3 className="text-sm font-medium text-white mb-2 flex items-center">
              <Sparkles className="h-4 w-4 text-codestorm-gold mr-2" />
              Prompt Mejorado
            </h3>
            <div className="bg-codestorm-blue/10 rounded-md p-3 border border-codestorm-blue/30 text-sm text-white whitespace-pre-wrap">
              {enhancedPrompt.enhancedPrompt}
            </div>
          </div>

          {/* Advertencia */}
          <div className="flex items-start text-xs text-yellow-400">
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
            <p>
              La mejora de prompts es una característica experimental. Revisa siempre el contenido mejorado
              antes de enviarlo para asegurarte de que refleja correctamente tu intención.
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="p-4 border-t border-codestorm-blue/30 flex justify-between items-center">
          {/* Botón de seleccionar tecnología a la izquierda */}
          {onSelectTechnology && (
            <button
              onClick={onSelectTechnology}
              className="px-4 py-2 rounded-md bg-codestorm-gold hover:bg-yellow-600 text-codestorm-dark text-sm font-medium flex items-center transition-colors"
            >
              <Layers className="h-4 w-4 mr-2" />
              SELECCIONAR TECNOLOGÍA
            </button>
          )}

          {/* Botones principales a la derecha */}
          <div className="flex space-x-3">
            <button
              onClick={onUseOriginal}
              className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              Usar Original
            </button>
            <button
              onClick={onUseEnhanced}
              className="px-4 py-2 rounded-md bg-codestorm-accent hover:bg-blue-600 text-white text-sm flex items-center"
            >
              <Check className="h-4 w-4 mr-2" />
              Usar Mejorado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPromptDialog;