import React, { useState, useEffect } from 'react';
import { AIModel } from '../services/AIModelManager';
import { Brain, Code2, TestTube, Zap, Bot, Sparkles, Cpu, ChevronDown, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface ModelSelectorProps {
  models: AIModel[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onModelStatusUpdate?: (modelId: string, status: 'available' | 'unavailable' | 'limited') => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onSelectModel,
  onModelStatusUpdate
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [lastUsedModel, setLastUsedModel] = useState<string | null>(null);
  const [modelPerformance, setModelPerformance] = useState<Map<string, number>>(new Map());

  const selectedModelData = models.find(m => m.id === selectedModel);

  useEffect(() => {
    // Cargar datos de rendimiento guardados
    const savedPerformance = localStorage.getItem('webai_model_performance');
    if (savedPerformance) {
      setModelPerformance(new Map(JSON.parse(savedPerformance)));
    }
  }, []);

  const handleModelSelect = (modelId: string) => {
    if (modelId !== selectedModel) {
      setLastUsedModel(selectedModel);
      onSelectModel(modelId);
      setIsDropdownOpen(false);

      // Guardar en historial
      const history = JSON.parse(localStorage.getItem('webai_model_history') || '[]');
      history.unshift({ modelId, timestamp: Date.now() });
      localStorage.setItem('webai_model_history', JSON.stringify(history.slice(0, 10)));
    }
  };

  const updateModelPerformance = (modelId: string, responseTime: number) => {
    const newPerformance = new Map(modelPerformance);
    const currentAvg = newPerformance.get(modelId) || responseTime;
    const newAvg = (currentAvg + responseTime) / 2;
    newPerformance.set(modelId, newAvg);
    setModelPerformance(newPerformance);

    // Guardar en localStorage
    localStorage.setItem('webai_model_performance', JSON.stringify(Array.from(newPerformance.entries())));
  };

  // Function to render the appropriate icon based on the icon name
  const renderIcon = (iconName: string, className: string = "h-5 w-5") => {
    const iconProps = { className };

    switch (iconName) {
      case 'Brain':
        return <Brain {...iconProps} />;
      case 'Code2':
        return <Code2 {...iconProps} />;
      case 'TestTube':
        return <TestTube {...iconProps} />;
      case 'Zap':
        return <Zap {...iconProps} />;
      case 'Bot':
        return <Bot {...iconProps} />;
      case 'Sparkles':
        return <Sparkles {...iconProps} />;
      case 'Cpu':
        return <Cpu {...iconProps} />;
      default:
        return <Brain {...iconProps} />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'limited':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'unavailable':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-400';
      case 'limited':
        return 'text-yellow-400';
      case 'unavailable':
        return 'text-red-400';
      default:
        return 'text-green-400';
    }
  };

  const getSpeedBadge = (speed: string) => {
    const colors = {
      fast: 'bg-green-500/20 text-green-400',
      medium: 'bg-yellow-500/20 text-yellow-400',
      slow: 'bg-red-500/20 text-red-400'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[speed as keyof typeof colors]}`}>
        {speed}
      </span>
    );
  };

  return (
    <div className="relative">
      {/* Selector Principal */}
      <div className="bg-codestorm-dark rounded-lg shadow-md border border-codestorm-blue/30 overflow-hidden">
        <div className="bg-codestorm-blue/20 p-3 border-b border-codestorm-blue/30">
          <h2 className="text-sm font-medium text-white flex items-center justify-between">
            <span className="flex items-center">
              <Brain className="h-4 w-4 mr-2 text-codestorm-gold" />
              Modelo de IA Activo
            </span>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="text-codestorm-gold hover:text-white transition-colors"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </h2>
        </div>

        {/* Modelo Seleccionado */}
        {selectedModelData && (
          <div className="p-3 bg-codestorm-blue/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {renderIcon(selectedModelData.icon, "h-6 w-6 text-codestorm-gold")}
                <div className="ml-3">
                  <div className="text-sm font-medium text-white">{selectedModelData.name}</div>
                  <div className="text-xs text-gray-400">{selectedModelData.description}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getSpeedBadge(selectedModelData.speed)}
                {getStatusIcon(selectedModelData.status)}
              </div>
            </div>

            {/* Información adicional */}
            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <span>Tokens máx: {selectedModelData.maxTokens.toLocaleString()}</span>
              <span className={getStatusColor(selectedModelData.status)}>
                {selectedModelData.status === 'available' ? 'Disponible' :
                 selectedModelData.status === 'limited' ? 'Limitado' : 'No disponible'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dropdown de Modelos */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-codestorm-dark rounded-lg shadow-xl border border-codestorm-blue/30 z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-400 mb-2 px-2">Seleccionar modelo:</div>
            {models.map((model) => (
              <div
                key={model.id}
                className={`p-3 rounded-md cursor-pointer transition-all duration-200 mb-1 ${
                  selectedModel === model.id
                    ? 'bg-codestorm-blue/30 border border-codestorm-gold/50'
                    : model.status === 'available'
                    ? 'hover:bg-codestorm-blue/10 border border-transparent'
                    : 'opacity-50 cursor-not-allowed border border-transparent'
                }`}
                onClick={() => model.status === 'available' && handleModelSelect(model.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {renderIcon(model.icon, "h-5 w-5")}
                    <div className="ml-3">
                      <div className="text-sm font-medium text-white flex items-center">
                        {model.name}
                        {selectedModel === model.id && (
                          <CheckCircle className="h-4 w-4 ml-2 text-codestorm-gold" />
                        )}
                      </div>
                      <div className="text-xs text-gray-400">{model.description}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {getSpeedBadge(model.speed)}
                    {getStatusIcon(model.status)}
                  </div>
                </div>

                {/* Fortalezas */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {model.strengths.map((strength, index) => (
                    <span
                      key={index}
                      className="text-xs bg-codestorm-blue/20 text-codestorm-gold px-2 py-1 rounded-full"
                    >
                      {strength}
                    </span>
                  ))}
                </div>

                {/* Información técnica */}
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>Max tokens: {model.maxTokens.toLocaleString()}</span>
                  <span>Calidad: {model.quality}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Información adicional */}
          <div className="border-t border-codestorm-blue/30 p-3 bg-codestorm-blue/5">
            <div className="text-xs text-gray-400">
              💡 Los modelos se alternan automáticamente si uno falla
            </div>
          </div>
        </div>
      )}

      {/* Overlay para cerrar dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default ModelSelector;

