/**
 * Selector global de modelos de IA para todos los agentes del sistema
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Brain,
  Zap,
  RefreshCw,
  Check,
  X,
  ChevronDown,
  Info,
  Save,
  RotateCcw
} from 'lucide-react';
import {
  getAllAvailableModels,
  getGlobalModelConfig,
  setDefaultModel,
  setAgentModelOverride,
  removeAgentModelOverride,
  getAllConfiguredAgents,
  getEffectiveAgentConfig,
  DEFAULT_GLOBAL_CONFIG,
  updateGlobalModelConfig
} from '../../config/claudeModels';
import { useTokenTracking } from '../../hooks/useTokenTracking';

interface GlobalModelSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onConfigChange?: () => void;
}

export const GlobalModelSelector: React.FC<GlobalModelSelectorProps> = ({
  isVisible,
  onClose,
  onConfigChange
}) => {
  const [globalConfig, setGlobalConfig] = useState(getGlobalModelConfig());
  const [availableModels] = useState(getAllAvailableModels());
  const [configuredAgents] = useState(getAllConfiguredAgents());
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic'>(globalConfig.defaultModel.provider);
  const [selectedModel, setSelectedModel] = useState(globalConfig.defaultModel.modelId);
  const [agentOverrides, setAgentOverrides] = useState(globalConfig.agentOverrides);
  const [hasChanges, setHasChanges] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Token tracking
  const { trackingState } = useTokenTracking();

  useEffect(() => {
    if (isVisible) {
      const currentConfig = getGlobalModelConfig();
      setGlobalConfig(currentConfig);
      setSelectedProvider(currentConfig.defaultModel.provider);
      setSelectedModel(currentConfig.defaultModel.modelId);
      setAgentOverrides(currentConfig.agentOverrides);
      setHasChanges(false);
    }
  }, [isVisible]);

  const handleDefaultModelChange = (provider: 'openai' | 'anthropic', modelId: string) => {
    setSelectedProvider(provider);
    setSelectedModel(modelId);
    setHasChanges(true);
  };

  const handleAgentOverride = (agentName: string, provider: 'openai' | 'anthropic', modelId: string) => {
    const newOverrides = {
      ...agentOverrides,
      [agentName]: {
        provider,
        modelId,
        temperature: agentOverrides[agentName]?.temperature ?? 0.3,
        maxTokens: agentOverrides[agentName]?.maxTokens ?? 4000,
        reason: `Configuración personalizada para ${agentName}`
      }
    };
    setAgentOverrides(newOverrides);
    setHasChanges(true);
  };

  const handleRemoveOverride = (agentName: string) => {
    const newOverrides = { ...agentOverrides };
    delete newOverrides[agentName];
    setAgentOverrides(newOverrides);
    setHasChanges(true);
  };

  const applyChanges = async () => {
    setIsApplying(true);
    try {
      // Aplicar modelo por defecto
      setDefaultModel(selectedProvider, selectedModel);

      // Aplicar overrides de agentes
      Object.entries(agentOverrides).forEach(([agentName, config]) => {
        setAgentModelOverride(agentName, config.provider, config.modelId, {
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          reason: config.reason
        });
      });

      // Remover overrides eliminados
      const currentOverrides = getGlobalModelConfig().agentOverrides;
      Object.keys(currentOverrides).forEach(agentName => {
        if (!agentOverrides[agentName]) {
          removeAgentModelOverride(agentName);
        }
      });

      setHasChanges(false);
      onConfigChange?.();

      console.log('✅ Configuración de modelos aplicada exitosamente');
    } catch (error) {
      console.error('❌ Error aplicando configuración:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const resetToDefaults = () => {
    updateGlobalModelConfig(DEFAULT_GLOBAL_CONFIG);
    setSelectedProvider(DEFAULT_GLOBAL_CONFIG.defaultModel.provider);
    setSelectedModel(DEFAULT_GLOBAL_CONFIG.defaultModel.modelId);
    setAgentOverrides({});
    setHasChanges(true);
  };

  const getModelDisplayName = (provider: 'openai' | 'anthropic', modelId: string) => {
    const models = availableModels[provider];
    const model = Object.values(models).find(m => m.id === modelId);
    return model?.name || modelId;
  };

  const getAgentCurrentModel = (agentName: string) => {
    const config = getEffectiveAgentConfig(agentName);
    return {
      provider: config.provider,
      modelId: config.model.id,
      name: config.model.name || config.model.id
    };
  };

  const getChangesSummary = () => {
    const changes = [];
    const currentConfig = getGlobalModelConfig();

    // Verificar cambio en modelo por defecto
    if (selectedProvider !== currentConfig.defaultModel.provider ||
        selectedModel !== currentConfig.defaultModel.modelId) {
      changes.push({
        type: 'default',
        description: `Modelo por defecto: ${selectedProvider} - ${getModelDisplayName(selectedProvider, selectedModel)}`
      });
    }

    // Verificar cambios en overrides
    const currentOverrides = Object.keys(currentConfig.agentOverrides);
    const newOverrides = Object.keys(agentOverrides);

    // Nuevos overrides
    newOverrides.forEach(agentName => {
      if (!currentOverrides.includes(agentName)) {
        const override = agentOverrides[agentName];
        changes.push({
          type: 'new_override',
          description: `${agentName}: ${override.provider} - ${getModelDisplayName(override.provider, override.modelId)}`
        });
      }
    });

    // Overrides removidos
    currentOverrides.forEach(agentName => {
      if (!newOverrides.includes(agentName)) {
        changes.push({
          type: 'removed_override',
          description: `${agentName}: Volver a configuración por defecto`
        });
      }
    });

    return changes;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-4xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-codestorm-accent" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Configuración Global de Modelos</h2>
              <p className="text-gray-400 text-xs sm:text-sm">Gestiona los modelos de IA para todos los agentes del sistema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Default Model Configuration */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-codestorm-accent" />
              Modelo Por Defecto
            </h3>
            <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
              <p className="text-gray-400 text-xs sm:text-sm mb-4">
                Este modelo se aplicará a todos los agentes que no tengan una configuración específica.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Provider Selection */}
                <div>
                  <label className="block text-white font-medium mb-2 text-sm">Proveedor</label>
                  <div className="space-y-2">
                    {Object.keys(availableModels).map(provider => (
                      <label key={provider} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="defaultProvider"
                          value={provider}
                          checked={selectedProvider === provider}
                          onChange={(e) => {
                            const newProvider = e.target.value as 'openai' | 'anthropic';
                            const firstModel = Object.keys(availableModels[newProvider])[0];
                            handleDefaultModelChange(newProvider, firstModel);
                          }}
                          className="text-codestorm-accent"
                        />
                        <span className="text-white capitalize text-sm">{provider}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-white font-medium mb-2 text-sm">Modelo</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => handleDefaultModelChange(selectedProvider, e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-codestorm-accent focus:outline-none text-sm"
                  >
                    {Object.values(availableModels[selectedProvider]).map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.maxTokens} tokens)
                      </option>
                    ))}
                  </select>
                  <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                    {availableModels[selectedProvider][selectedModel]?.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Token Usage Summary */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Uso de Tokens por Agente
            </h3>
            <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.values(trackingState.agentUsage)
                  .filter(agent => agent.totalTokens > 0)
                  .sort((a, b) => b.totalTokens - a.totalTokens)
                  .slice(0, 6)
                  .map(agent => {
                    const formatNumber = (num: number) => {
                      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
                      return num.toString();
                    };

                    const getUsageColor = (tokens: number) => {
                      if (tokens >= 100000) return 'text-red-400';
                      if (tokens >= 90000) return 'text-yellow-400';
                      return 'text-green-400';
                    };

                    return (
                      <div key={agent.agentName} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-white font-medium text-sm truncate">
                            {agent.agentName.replace('Agent', '')}
                          </h4>
                          <span className={`text-xs font-semibold ${getUsageColor(agent.totalTokens)}`}>
                            {formatNumber(agent.totalTokens)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          Sesión: {formatNumber(agent.sessionTokens)} • Llamadas: {agent.apiCalls}
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-1 mt-2">
                          <div
                            className={`h-1 rounded-full transition-all duration-300 ${
                              agent.totalTokens >= 100000 ? 'bg-red-500' :
                              agent.totalTokens >= 90000 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min((agent.totalTokens / 100000) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
              {Object.values(trackingState.agentUsage).filter(agent => agent.totalTokens > 0).length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">No hay datos de uso de tokens disponibles</p>
                </div>
              )}
            </div>
          </div>

          {/* Agent-Specific Overrides */}
          <div className="mb-4">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              Configuraciones Específicas por Agente
            </h3>

            <div className="space-y-2 sm:space-y-3">
              {configuredAgents.map(agentName => {
                const currentModel = getAgentCurrentModel(agentName);
                const hasOverride = !!agentOverrides[agentName];

                return (
                  <div key={agentName} className="bg-gray-800 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-white font-medium text-sm sm:text-base truncate">{agentName}</h4>
                        <p className="text-gray-400 text-xs sm:text-sm">
                          Actual: {currentModel.name} ({currentModel.provider})
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {hasOverride && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded whitespace-nowrap">
                            Personalizado
                          </span>
                        )}
                        {hasOverride && (
                          <button
                            onClick={() => handleRemoveOverride(agentName)}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                            title="Remover configuración personalizada"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <select
                        value={hasOverride ? agentOverrides[agentName].provider : selectedProvider}
                        onChange={(e) => {
                          const provider = e.target.value as 'openai' | 'anthropic';
                          const firstModel = Object.keys(availableModels[provider])[0];
                          handleAgentOverride(agentName, provider, firstModel);
                        }}
                        className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-codestorm-accent focus:outline-none text-sm w-full"
                      >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                      </select>

                      <select
                        value={hasOverride ? agentOverrides[agentName].modelId : selectedModel}
                        onChange={(e) => {
                          const provider = hasOverride ? agentOverrides[agentName].provider : selectedProvider;
                          handleAgentOverride(agentName, provider, e.target.value);
                        }}
                        className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-codestorm-accent focus:outline-none text-sm w-full"
                      >
                        {Object.values(availableModels[hasOverride ? agentOverrides[agentName].provider : selectedProvider]).map(model => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Changes Summary - Collapsible */}
        {hasChanges && showSummary && (
          <div className="flex-shrink-0 border-t border-gray-700 bg-gray-800/50">
            <div className="p-4">
              <h4 className="text-white font-medium text-sm mb-2">Resumen de Cambios:</h4>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {getChangesSummary().map((change, index) => (
                  <div key={index} className="text-xs text-gray-300">
                    • {change.description}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 border-t border-gray-700 bg-gray-900">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                onClick={resetToDefaults}
                className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Restaurar Defaults</span>
                <span className="sm:hidden">Restaurar</span>
              </button>

              {hasChanges && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <Info className="w-4 h-4" />
                    <span className="hidden sm:inline">Hay cambios sin aplicar</span>
                    <span className="sm:hidden">Cambios pendientes</span>
                  </div>
                  <button
                    onClick={() => setShowSummary(!showSummary)}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    {showSummary ? 'Ocultar' : 'Ver detalles'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 text-gray-400 hover:text-white transition-colors text-center"
              >
                Cancelar
              </button>
              <button
                onClick={applyChanges}
                disabled={!hasChanges || isApplying}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-codestorm-accent text-white rounded-lg hover:bg-codestorm-accent/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[140px]"
              >
                {isApplying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Aplicando...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Aplicar Cambios</span>
                    <span className="sm:hidden">Aplicar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
