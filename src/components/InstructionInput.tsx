import React, { useState } from 'react';
import { Send, Mic, Loader2 } from 'lucide-react';

interface InstructionInputProps {
  onSubmitInstruction: (instruction: string) => void;
  isProcessing: boolean;
}

const InstructionInput: React.FC<InstructionInputProps> = ({
  onSubmitInstruction,
  isProcessing
}) => {
  const [instruction, setInstruction] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instruction.trim() && !isProcessing) {
      onSubmitInstruction(instruction);
      setInstruction('');
    }
  };

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md p-4 border border-codestorm-blue/30">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col">
          <label htmlFor="instruction" className="text-sm font-medium text-white mb-1">
            ¿Qué te gustaría construir?
          </label>
          <textarea
            id="instruction"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Ej: Crear una calculadora funcional moderna con interfaz minimalista"
            className="w-full p-3 bg-codestorm-darker border border-codestorm-blue/40 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-codestorm-accent focus:border-codestorm-accent min-h-[100px] resize-none"
            disabled={isProcessing}
          />
        </div>
        <div className="flex justify-between items-center">
          <button
            type="button"
            className="flex items-center space-x-1 text-gray-300 hover:text-codestorm-gold transition-colors"
          >
            <Mic className="h-4 w-4" />
            <span className="text-sm">Entrada de Voz</span>
          </button>
          <button
            type="submit"
            disabled={!instruction.trim() || isProcessing}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
              !instruction.trim() || isProcessing
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-codestorm-accent hover:bg-blue-600 text-white'
            } transition-colors`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Enviar</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InstructionInput;