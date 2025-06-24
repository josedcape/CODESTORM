import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Loader2, Sparkles, Zap } from 'lucide-react';
import { PromptEnhancerService, EnhancedPrompt } from '../services/PromptEnhancerService';
import EnhancedPromptDialog from './EnhancedPromptDialog';

interface InstructionInputProps {
  onSubmitInstruction: (instruction: string) => void;
  isProcessing: boolean;
}

const InstructionInput: React.FC<InstructionInputProps> = ({
  onSubmitInstruction,
  isProcessing
}) => {
  const [instruction, setInstruction] = useState('');
  const [enhancePromptEnabled, setEnhancePromptEnabled] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [currentEnhancedPrompt, setCurrentEnhancedPrompt] = useState<EnhancedPrompt | null>(null);
  const [showEnhancedPromptDialog, setShowEnhancedPromptDialog] = useState(false);
  const [showSparkleEffect, setShowSparkleEffect] = useState(false);

  // Referencia para el botón de mejora de prompts
  const enhanceButtonRef = useRef<HTMLButtonElement>(null);

  // Efecto para manejar la animación de destello
  useEffect(() => {
    if (showSparkleEffect) {
      const timer = setTimeout(() => {
        setShowSparkleEffect(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showSparkleEffect]);

  // Función para alternar la mejora de prompts
  const toggleEnhancePrompt = () => {
    setEnhancePromptEnabled(!enhancePromptEnabled);
    setShowSparkleEffect(true);
  };

  // Función para usar el prompt original
  const handleUseOriginalPrompt = () => {
    if (currentEnhancedPrompt) {
      onSubmitInstruction(currentEnhancedPrompt.originalPrompt);
      setShowEnhancedPromptDialog(false);
      setCurrentEnhancedPrompt(null);
      setInstruction('');
    }
  };

  // Función para usar el prompt mejorado
  const handleUseEnhancedPrompt = () => {
    if (currentEnhancedPrompt) {
      onSubmitInstruction(currentEnhancedPrompt.enhancedPrompt);
      setShowEnhancedPromptDialog(false);
      setCurrentEnhancedPrompt(null);
      setInstruction('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || isProcessing) return;

    // Si la mejora de prompts está habilitada, mejorar el prompt
    if (enhancePromptEnabled && !isEnhancing) {
      setIsEnhancing(true);

      try {
        const result = await PromptEnhancerService.enhancePrompt(instruction);

        if (result.success && result.enhancedPrompt) {
          setCurrentEnhancedPrompt(result.enhancedPrompt);
          setShowEnhancedPromptDialog(true);
        } else {
          // Si hay un error, enviar el mensaje original
          onSubmitInstruction(instruction);
          setInstruction('');
        }
      } catch (error) {
        console.error('Error al mejorar el prompt:', error);
        // En caso de error, enviar el mensaje original
        onSubmitInstruction(instruction);
        setInstruction('');
      } finally {
        setIsEnhancing(false);
      }
    } else {
      // Si la mejora de prompts está deshabilitada, enviar el mensaje original
      onSubmitInstruction(instruction);
      setInstruction('');
    }
  };

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md p-4 border border-codestorm-blue/30">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="instruction" className="text-sm font-medium text-white">
              ¿Qué te gustaría construir?
            </label>
            <div className="relative">
              <button
                type="button"
                ref={enhanceButtonRef}
                onClick={toggleEnhancePrompt}
                className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs transition-all duration-300 ${
                  enhancePromptEnabled
                    ? 'bg-codestorm-gold text-white shadow-lg shadow-codestorm-gold/20'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                } ${showSparkleEffect ? 'animate-pulse-fast' : ''}`}
              >
                <Sparkles className={`h-3 w-3 ${showSparkleEffect ? 'animate-spin-slow' : ''}`} />
                <span>Mejorar Instrucción</span>
                {showSparkleEffect && (
                  <span className="absolute inset-0 rounded-md bg-codestorm-gold/20 animate-ping-fast"></span>
                )}
              </button>
            </div>
          </div>
          <div className="relative">
            <textarea
              id="instruction"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Ej: Crear una calculadora funcional moderna con interfaz minimalista"
              className={`w-full p-3 bg-codestorm-darker border border-codestorm-blue/40 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-codestorm-accent focus:border-codestorm-accent min-h-[100px] resize-none transition-all duration-300 ${
                enhancePromptEnabled ? 'border-codestorm-gold/50 shadow-sm shadow-codestorm-gold/20' : ''
              }`}
              disabled={isProcessing || isEnhancing}
            />
            {enhancePromptEnabled && (
              <div className="absolute top-2 right-2">
                <Sparkles className="h-4 w-4 text-codestorm-gold animate-pulse-slow" />
              </div>
            )}
          </div>
          {enhancePromptEnabled && (
            <div className="flex items-center mt-1 text-xs text-codestorm-gold">
              <Sparkles className="h-3 w-3 mr-1" />
              <span>Mejora de instrucciones activada</span>
            </div>
          )}
          {isEnhancing && (
            <div className="flex items-center mt-1 text-xs text-codestorm-gold">
              <Sparkles className="h-3 w-3 mr-1 animate-spin-slow" />
              <span>Mejorando instrucción...</span>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center">
          <button
            type="button"
            className="flex items-center space-x-1 text-gray-300 hover:text-codestorm-gold transition-colors group"
          >
            <Mic className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-sm">Entrada de Voz</span>
          </button>
          <button
            type="submit"
            disabled={!instruction.trim() || isProcessing || isEnhancing}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              !instruction.trim() || isProcessing || isEnhancing
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-codestorm-accent hover:bg-blue-600 text-white shadow-md hover:shadow-lg hover:shadow-codestorm-accent/20'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : isEnhancing ? (
              <>
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span>Mejorando...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Enviar</span>
              </>
            )}
            <span className="absolute inset-0 rounded-md bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
          </button>
        </div>

        {/* Diálogo de prompt mejorado */}
        {currentEnhancedPrompt && (
          <EnhancedPromptDialog
            enhancedPrompt={currentEnhancedPrompt}
            onClose={() => setShowEnhancedPromptDialog(false)}
            onUseOriginal={handleUseOriginalPrompt}
            onUseEnhanced={handleUseEnhancedPrompt}
            isVisible={showEnhancedPromptDialog}
          />
        )}
      </form>
    </div>
  );
};

export default InstructionInput;