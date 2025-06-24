/**
 * Configuración de modelos Claude correctos
 * Actualizado con los modelos reales disponibles en 2024
 */

export interface ClaudeModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  costTier: 'low' | 'medium' | 'high';
  bestFor: string[];
  version: string;
}

/**
 * Modelos Claude 3 disponibles
 */
export const CLAUDE_3_MODELS: Record<string, ClaudeModel> = {
  haiku: {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    description: 'Rápido y eficiente, ideal para tareas que requieren respuestas rápidas',
    maxTokens: 200000,
    costTier: 'low',
    bestFor: ['respuestas rápidas', 'análisis simple', 'tareas básicas'],
    version: '3.0'
  },
  sonnet: {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    description: 'Equilibrio entre velocidad y capacidad, adecuado para una amplia gama de aplicaciones',
    maxTokens: 200000,
    costTier: 'medium',
    bestFor: ['desarrollo general', 'análisis equilibrado', 'tareas intermedias'],
    version: '3.0'
  },
  opus: {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    description: 'El más potente de la familia Claude 3, diseñado para tareas complejas',
    maxTokens: 200000,
    costTier: 'high',
    bestFor: ['tareas complejas', 'razonamiento avanzado', 'análisis profundo'],
    version: '3.0'
  }
};

/**
 * Modelos Claude 3.5 disponibles (más recientes y avanzados)
 */
export const CLAUDE_3_5_MODELS: Record<string, ClaudeModel> = {
  haiku: {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    description: 'Versión mejorada de Haiku con mejor rendimiento',
    maxTokens: 200000,
    costTier: 'low',
    bestFor: ['respuestas rápidas mejoradas', 'análisis eficiente', 'tareas básicas optimizadas'],
    version: '3.5'
  },
  sonnet: {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'El modelo más inteligente y potente de Anthropic hasta la fecha',
    maxTokens: 200000,
    costTier: 'medium',
    bestFor: ['programación avanzada', 'análisis complejo', 'generación de código', 'tareas creativas'],
    version: '3.5'
  }
};

/**
 * Todos los modelos disponibles
 */
export const ALL_CLAUDE_MODELS = {
  ...CLAUDE_3_MODELS,
  ...CLAUDE_3_5_MODELS
};

/**
 * Modelo por defecto (el más avanzado)
 */
export const DEFAULT_MODEL = CLAUDE_3_5_MODELS.sonnet;

/**
 * Configuración de modelos por tipo de tarea
 */
export const TASK_MODEL_MAPPING = {
  // Tareas rápidas y simples
  fast: CLAUDE_3_5_MODELS.haiku,
  quick: CLAUDE_3_MODELS.haiku,
  simple: CLAUDE_3_MODELS.haiku,

  // Tareas equilibradas
  balanced: CLAUDE_3_MODELS.sonnet,
  general: CLAUDE_3_MODELS.sonnet,
  standard: CLAUDE_3_MODELS.sonnet,

  // Tareas complejas y avanzadas
  complex: CLAUDE_3_5_MODELS.sonnet,  // Usar 3.5 Sonnet para tareas complejas
  advanced: CLAUDE_3_5_MODELS.sonnet,
  programming: CLAUDE_3_5_MODELS.sonnet,
  creative: CLAUDE_3_5_MODELS.sonnet,

  // Tareas que requieren máximo poder
  maximum: CLAUDE_3_MODELS.opus,
  research: CLAUDE_3_MODELS.opus,
  analysis: CLAUDE_3_MODELS.opus,

  // Por defecto
  default: CLAUDE_3_5_MODELS.sonnet
};

/**
 * Obtiene el modelo más apropiado para un tipo de tarea
 */
export function getModelForTask(taskType?: string): ClaudeModel {
  if (!taskType) {
    return DEFAULT_MODEL;
  }

  const normalizedTaskType = taskType.toLowerCase();
  return TASK_MODEL_MAPPING[normalizedTaskType as keyof typeof TASK_MODEL_MAPPING] || DEFAULT_MODEL;
}

/**
 * Obtiene el ID del modelo para un tipo de tarea
 */
export function getModelIdForTask(taskType?: string): string {
  return getModelForTask(taskType).id;
}

/**
 * Valida si un modelo existe
 */
export function isValidModel(modelId: string): boolean {
  return Object.values(ALL_CLAUDE_MODELS).some(model => model.id === modelId);
}

/**
 * Obtiene información de un modelo por su ID
 */
export function getModelInfo(modelId: string): ClaudeModel | null {
  return Object.values(ALL_CLAUDE_MODELS).find(model => model.id === modelId) || null;
}

/**
 * Configuración de modelos OpenAI para distribución de carga
 */
export interface OpenAIModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  costTier: 'low' | 'medium' | 'high';
  bestFor: string[];
  provider: 'openai';
}

export const OPENAI_MODELS: Record<string, OpenAIModel> = {
  gpt4o: {
    id: 'gpt-4o',
    name: 'GPT-4O',
    description: 'Modelo más avanzado de OpenAI, excelente para programación',
    maxTokens: 128000,
    costTier: 'high',
    bestFor: ['programación avanzada', 'análisis complejo', 'razonamiento'],
    provider: 'openai'
  },
  gpt4omini: {
    id: 'gpt-4o-mini',
    name: 'GPT-4O Mini',
    description: 'Versión optimizada de GPT-4O, más rápida y económica',
    maxTokens: 128000,
    costTier: 'medium',
    bestFor: ['tareas generales', 'análisis rápido', 'modificaciones'],
    provider: 'openai'
  },
  gpt4turbo: {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Versión turbo de GPT-4, equilibrio entre velocidad y capacidad',
    maxTokens: 128000,
    costTier: 'medium',
    bestFor: ['desarrollo general', 'análisis equilibrado', 'diseño'],
    provider: 'openai'
  },
  gpto3mini: {
    id: 'gpt-o3-mini',
    name: 'GPT-O3-Mini',
    description: 'Modelo más avanzado y preciso de OpenAI, optimizado para generación de código',
    maxTokens: 65536,
    costTier: 'low',
    bestFor: ['generación de código precisa', 'corrección de errores', 'optimización', 'debugging'],
    provider: 'openai'
  }
};

/**
 * Configuración global de modelos disponibles
 */
export const AVAILABLE_MODELS = {
  openai: {
    'gpt-4o-mini': {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'openai',
      maxTokens: 16384,
      description: 'Modelo optimizado de OpenAI, rápido y eficiente'
    },
    'gpt-4-turbo': {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      maxTokens: 128000,
      description: 'Modelo avanzado de OpenAI con alta capacidad'
    },
    'gpt-o3-mini': {
      id: 'gpt-o3-mini',
      name: 'GPT-O3 Mini',
      provider: 'openai',
      maxTokens: 8192,
      description: 'Modelo de última generación optimizado'
    }
  },
  anthropic: {
    'claude-3-5-sonnet-20241022': {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet V2',
      provider: 'anthropic',
      maxTokens: 8192,
      description: 'Modelo avanzado de Anthropic con excelente razonamiento'
    },
    'claude-3-sonnet-20240229': {
      id: 'claude-3-sonnet-20240229',
      name: 'Claude 3 Sonnet',
      provider: 'anthropic',
      maxTokens: 4096,
      description: 'Modelo equilibrado de Anthropic'
    },
    'claude-3-haiku-20240307': {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      provider: 'anthropic',
      maxTokens: 4096,
      description: 'Modelo rápido y eficiente de Anthropic'
    }
  }
} as const;

/**
 * Configuración global del sistema de modelos
 */
export interface GlobalModelConfig {
  defaultModel: {
    provider: 'openai' | 'anthropic';
    modelId: string;
  };
  agentOverrides: Record<string, {
    provider: 'openai' | 'anthropic';
    modelId: string;
    temperature?: number;
    maxTokens?: number;
    reason?: string;
  }>;
}

/**
 * Configuración por defecto del sistema (GPT-4o-mini como solicitado)
 */
export const DEFAULT_GLOBAL_CONFIG: GlobalModelConfig = {
  defaultModel: {
    provider: 'openai',
    modelId: 'gpt-4o-mini'
  },
  agentOverrides: {}
};

/**
 * Estado global de configuración de modelos
 */
let globalModelConfig: GlobalModelConfig = { ...DEFAULT_GLOBAL_CONFIG };

/**
 * Configuración distribuida de agentes (mantenida para compatibilidad)
 * Ahora usa la configuración global como base
 */
export const DISTRIBUTED_AGENT_CONFIG = {
  // Agentes críticos que requieren máxima precisión
  PlannerAgent: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpt4omini,
    temperature: 0.3,
    maxTokens: 4000,
    reason: 'Planificación requiere análisis complejo y estructurado'
  },
  OptimizedPlannerAgent: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpt4omini,
    temperature: 0.3,
    maxTokens: 4000,
    reason: 'Planificación optimizada requiere máxima capacidad analítica'
  },

  // Agentes de generación de código
  CodeGeneratorAgent: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpt4omini,
    temperature: 0.1,
    maxTokens: 4000,
    reason: 'Generación de código precisa y eficiente'
  },
  HTMLAgent: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpt4omini,
    temperature: 0.1,
    maxTokens: 6000,
    reason: 'Generación de HTML estructurado y semántico'
  },
  CSSAgent: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpt4omini,
    temperature: 0.2,
    maxTokens: 6000,
    reason: 'Generación de CSS moderno y responsive'
  },
  JavaScriptAgent: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpt4omini,
    temperature: 0.1,
    maxTokens: 6000,
    reason: 'Generación de JavaScript funcional y optimizado'
  },
  GIFTAgent: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpt4omini,
    temperature: 0.3,
    maxTokens: 4000,
    reason: 'Generación de gráficos, iconos, efectos y transiciones'
  },

  // Agentes de modificación y optimización
  CodeModifierAgent: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpt4omini,
    temperature: 0.05,
    maxTokens: 3000,
    reason: 'Modificaciones precisas sin errores'
  },

  // Agentes de diseño
  DesignArchitectAgent: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpt4omini,
    temperature: 0.4,
    maxTokens: 3000,
    reason: 'Diseño creativo y arquitectura web'
  },
  EnhancedDesignArchitectAgent: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpt4omini,
    temperature: 0.4,
    maxTokens: 3000,
    reason: 'Arquitectura de diseño compleja'
  },
  ArtistWeb: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpt4omini,
    temperature: 0.5,
    maxTokens: 4000,
    reason: 'Diseño creativo de landing pages con animaciones'
  },

  // Agentes de análisis y observación
  FileObserverAgent: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpt4omini,
    temperature: 0.2,
    maxTokens: 2000,
    reason: 'Análisis rápido de archivos'
  },
  InstructionAnalyzer: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpt4omini,
    temperature: 0.3,
    maxTokens: 1500,
    reason: 'Análisis de lenguaje natural'
  },

  // Agentes adicionales
  CodeSplitterAgent: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpt4omini,
    temperature: 0.1,
    maxTokens: 2000,
    reason: 'Separación de código precisa'
  },
  CodeCorrectorAgent: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpt4omini,
    temperature: 0.05,
    maxTokens: 3000,
    reason: 'Corrección de errores con máxima precisión'
  },

  // Production Agent - Control de calidad final
  ProductionAgent: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpt4omini,
    temperature: 0.2,
    maxTokens: 8192,
    reason: 'Análisis completo de calidad y optimización'
  },

  // Prompt Enhancement Agent - Mejora de descripciones de usuario
  PromptEnhancementAgent: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpt4omini,
    temperature: 0.7,
    maxTokens: 3072,
    reason: 'Análisis de lenguaje natural y mejora de prompts'
  }
};

/**
 * Funciones de gestión de configuración global de modelos
 */

/**
 * Actualiza la configuración global de modelos
 */
export function updateGlobalModelConfig(config: Partial<GlobalModelConfig>): void {
  globalModelConfig = {
    ...globalModelConfig,
    ...config,
    agentOverrides: {
      ...globalModelConfig.agentOverrides,
      ...(config.agentOverrides || {})
    }
  };

  console.log('🔧 Configuración global de modelos actualizada:', globalModelConfig);
}

/**
 * Obtiene la configuración global actual
 */
export function getGlobalModelConfig(): GlobalModelConfig {
  return { ...globalModelConfig };
}

/**
 * Establece el modelo por defecto para todos los agentes
 */
export function setDefaultModel(provider: 'openai' | 'anthropic', modelId: string): void {
  updateGlobalModelConfig({
    defaultModel: { provider, modelId }
  });
}

/**
 * Establece una configuración específica para un agente
 */
export function setAgentModelOverride(
  agentName: string,
  provider: 'openai' | 'anthropic',
  modelId: string,
  options?: { temperature?: number; maxTokens?: number; reason?: string }
): void {
  updateGlobalModelConfig({
    agentOverrides: {
      [agentName]: {
        provider,
        modelId,
        ...options
      }
    }
  });
}

/**
 * Elimina la configuración específica de un agente (vuelve al default)
 */
export function removeAgentModelOverride(agentName: string): void {
  const newOverrides = { ...globalModelConfig.agentOverrides };
  delete newOverrides[agentName];

  updateGlobalModelConfig({
    agentOverrides: newOverrides
  });
}

/**
 * Obtiene la configuración efectiva para un agente (considerando overrides y default global)
 */
export function getEffectiveAgentConfig(agentName: string) {
  // Verificar si hay override específico para este agente
  const override = globalModelConfig.agentOverrides[agentName];
  if (override) {
    const modelInfo = getModelInfoByProvider(override.provider, override.modelId);
    return {
      provider: override.provider,
      model: modelInfo,
      temperature: override.temperature ?? 0.3,
      maxTokens: override.maxTokens ?? modelInfo.maxTokens,
      reason: override.reason ?? `Configuración personalizada para ${agentName}`
    };
  }

  // Usar configuración distribuida si existe
  const distributedConfig = DISTRIBUTED_AGENT_CONFIG[agentName as keyof typeof DISTRIBUTED_AGENT_CONFIG];
  if (distributedConfig) {
    return distributedConfig;
  }

  // Usar configuración global por defecto
  const defaultModel = getModelInfoByProvider(globalModelConfig.defaultModel.provider, globalModelConfig.defaultModel.modelId);
  return {
    provider: globalModelConfig.defaultModel.provider,
    model: defaultModel,
    temperature: 0.3,
    maxTokens: defaultModel.maxTokens,
    reason: 'Configuración global por defecto'
  };
}

/**
 * Obtiene información de un modelo específico por proveedor
 */
export function getModelInfoByProvider(provider: 'openai' | 'anthropic', modelId: string) {
  const models = AVAILABLE_MODELS[provider];
  const model = Object.values(models).find(m => m.id === modelId);

  if (!model) {
    console.warn(`Modelo ${modelId} no encontrado en ${provider}, usando fallback`);
    return provider === 'openai'
      ? AVAILABLE_MODELS.openai['gpt-4o-mini']
      : AVAILABLE_MODELS.anthropic['claude-3-5-sonnet-20241022'];
  }

  return model;
}

/**
 * Obtiene la configuración distribuida para un agente (actualizada para usar configuración global)
 */
export function getDistributedAgentConfig(agentName: string) {
  return getEffectiveAgentConfig(agentName);
}

/**
 * Obtiene la configuración recomendada para un agente (legacy)
 */
export function getAgentConfig(agentName: string) {
  const effectiveConfig = getEffectiveAgentConfig(agentName);
  return {
    model: effectiveConfig.model,
    temperature: effectiveConfig.temperature,
    maxTokens: effectiveConfig.maxTokens,
    reason: effectiveConfig.reason
  };
}

/**
 * Determina si un agente debe usar OpenAI o Anthropic
 */
export function getAgentProvider(agentName: string): 'openai' | 'anthropic' {
  const config = getEffectiveAgentConfig(agentName);
  return config.provider;
}

/**
 * Obtiene el modelo específico para un agente según su proveedor
 */
export function getAgentModelId(agentName: string): string {
  const config = getEffectiveAgentConfig(agentName);
  return config.model.id;
}

/**
 * Obtiene lista de todos los modelos disponibles
 */
export function getAllAvailableModels() {
  return AVAILABLE_MODELS;
}

/**
 * Obtiene lista de agentes configurados
 */
export function getAllConfiguredAgents(): string[] {
  return Object.keys(DISTRIBUTED_AGENT_CONFIG);
}

/**
 * Información sobre las capacidades de cada modelo
 */
export const MODEL_CAPABILITIES = {
  [CLAUDE_3_5_MODELS.sonnet.id]: {
    programming: 'Excelente',
    reasoning: 'Excelente',
    creativity: 'Muy bueno',
    speed: 'Bueno',
    cost: 'Medio',
    recommended: true
  },
  [CLAUDE_3_MODELS.opus.id]: {
    programming: 'Muy bueno',
    reasoning: 'Excelente',
    creativity: 'Excelente',
    speed: 'Lento',
    cost: 'Alto',
    recommended: false // Muy costoso para uso general
  },
  [CLAUDE_3_MODELS.sonnet.id]: {
    programming: 'Bueno',
    reasoning: 'Bueno',
    creativity: 'Bueno',
    speed: 'Bueno',
    cost: 'Medio',
    recommended: true
  },
  [CLAUDE_3_5_MODELS.haiku.id]: {
    programming: 'Básico',
    reasoning: 'Básico',
    creativity: 'Básico',
    speed: 'Muy rápido',
    cost: 'Bajo',
    recommended: true // Para tareas simples
  },
  [CLAUDE_3_MODELS.haiku.id]: {
    programming: 'Básico',
    reasoning: 'Básico',
    creativity: 'Básico',
    speed: 'Rápido',
    cost: 'Bajo',
    recommended: false // 3.5 Haiku es mejor
  }
};

/**
 * Obtiene el mejor modelo para un tipo específico de tarea de programación
 */
export function getBestModelForProgramming(complexity: 'basic' | 'intermediate' | 'advanced' = 'intermediate'): ClaudeModel {
  switch (complexity) {
    case 'basic':
      return CLAUDE_3_5_MODELS.haiku;
    case 'intermediate':
      return CLAUDE_3_MODELS.sonnet;
    case 'advanced':
      return CLAUDE_3_5_MODELS.sonnet; // El más avanzado para programación
    default:
      return CLAUDE_3_5_MODELS.sonnet;
  }
}

/**
 * Configuración de fallback si no hay conexión
 */
export const FALLBACK_CONFIG = {
  useLocalTemplates: true,
  maxRetries: 3,
  retryDelay: 2000,
  fallbackModel: CLAUDE_3_MODELS.haiku // Modelo más básico como fallback
};
