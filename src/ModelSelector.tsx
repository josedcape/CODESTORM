import React from 'react';
import { AIModel } from '../types';
import { Brain, Code2, TestTube, Zap, Bot, Sparkles, Cpu } from 'lucide-react';

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
  // Function to render the appropriate icon based on the icon name
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Brain':
        return <Brain className="h-5 w-5 text-indigo-400" />;
      case 'Code2':
        return <Code2 className="h-5 w-5 text-blue-400" />;
      case 'TestTube':
        return <TestTube className="h-5 w-5 text-green-400" />;
      case 'Zap':
        return <Zap className="h-5 w-5 text-yellow-400" />;
      case 'Bot':
        return <Bot className="h-5 w-5 text-purple-400" />;
      case 'Sparkles':
        return <Sparkles className="h-5 w-5 text-pink-400" />;
      case 'Cpu':
        return <Cpu className="h-5 w-5 text-red-400" />;
      default:
        return <Brain className="h-5 w-5 text-indigo-400" />;
    }
  };

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md border border-codestorm-blue/30 overflow-hidden">
      <div className="bg-codestorm-blue/20 p-3 border-b border-codestorm-blue/30">
        <h2 className="text-sm font-medium text-white flex items-center">
          <Brain className="h-4 w-4 mr-2 text-codestorm-gold" />
          Seleccionar Modelo IA
        </h2>
      </div>
      <div className="p-2 max-h-[400px] overflow-y-auto">
        {models.map((model) => (
          <div
            key={model.id}
            className={`p-2 rounded-md cursor-pointer transition-colors mb-2 ${
              selectedModel === model.id
                ? 'bg-codestorm-blue border-l-2 border-codestorm-gold'
                : 'hover:bg-codestorm-blue/10'
            }`}
            onClick={() => onSelectModel(model.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-2">
                  {renderIcon(model.icon)}
                </div>
                <h3 className="font-medium text-sm text-white">{model.name}</h3>
              </div>
              {selectedModel === model.id && (
                <span className="text-xs bg-codestorm-gold text-codestorm-dark px-2 py-0.5 rounded-full">
                  Activo
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">{model.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {model.strengths.map((strength, index) => (
                <span
                  key={index}
                  className="text-xs bg-codestorm-blue/30 text-gray-300 px-2 py-0.5 rounded-full"
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

