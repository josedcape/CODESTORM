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
    <div className="bg-white rounded-lg shadow-md p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col">
          <label htmlFor="instruction" className="text-sm font-medium text-gray-700 mb-1">
            What would you like to build?
          </label>
          <textarea
            id="instruction"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="E.g., Create a functional modern calculator with a minimalist interface"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px] resize-none"
            disabled={isProcessing}
          />
        </div>
        <div className="flex justify-between items-center">
          <button
            type="button"
            className="flex items-center space-x-1 text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <Mic className="h-4 w-4" />
            <span className="text-sm">Voice Input</span>
          </button>
          <button
            type="submit"
            disabled={!instruction.trim() || isProcessing}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
              !instruction.trim() || isProcessing
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            } transition-colors`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InstructionInput;