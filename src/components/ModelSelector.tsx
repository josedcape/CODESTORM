import React from 'react';
import { AIModel } from '../types';
import { Brain } from 'lucide-react';

interface ModelSelectorProps {
  models: AIModel[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  models, 
  selectedModel, 
  onSelectModel 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-3 flex items-center">
        <Brain className="h-5 w-5 mr-2 text-indigo-600" />
        AI Models
      </h2>
      <div className="space-y-2">
        {models.map((model) => (
          <div 
            key={model.id}
            className={`p-3 rounded-md cursor-pointer transition-colors ${
              selectedModel === model.id 
                ? 'bg-indigo-100 border-l-4 border-indigo-600' 
                : 'hover:bg-gray-100'
            }`}
            onClick={() => onSelectModel(model.id)}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{model.name}</h3>
              {selectedModel === model.id && (
                <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{model.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {model.strengths.map((strength, index) => (
                <span 
                  key={index}
                  className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full"
                >
                  {strength}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelSelector;