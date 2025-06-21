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
 * Configuración distribuida de agentes entre OpenAI y Claude
 * Optimizada para evitar sobrecarga de APIs y mejorar rendimiento
 */
export const DISTRIBUTED_AGENT_CONFIG = {
  // Agentes críticos que requieren máxima precisión - Claude 3.5 Sonnet
  PlannerAgent: {
    provider: 'anthropic' as const,
    model: CLAUDE_3_5_MODELS.sonnet,
    temperature: 0.3,
    maxTokens: 4000,
    reason: 'Planificación requiere análisis complejo y estructurado - Claude es superior'
  },
  OptimizedPlannerAgent: {
    provider: 'anthropic' as const,
    model: CLAUDE_3_5_MODELS.sonnet,
    temperature: 0.3,
    maxTokens: 4000,
    reason: 'Planificación optimizada requiere máxima capacidad analítica'
  },

  // Agentes de generación de código - Optimizados con GPT-O3-Mini para máxima precisión
  CodeGeneratorAgent: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpto3mini,
    temperature: 0.1,
    maxTokens: 4000,
    reason: 'GPT-O3-Mini más preciso para generación de código, menos errores'
  },

  // Agentes de modificación y optimización - GPT-O3-Mini para precisión
  CodeModifierAgent: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpto3mini,
    temperature: 0.05,
    maxTokens: 3000,
    reason: 'GPT-O3-Mini ideal para modificaciones precisas sin errores'
  },

  // Agentes de diseño - Distribuidos
  DesignArchitectAgent: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpt4turbo,
    temperature: 0.4,
    maxTokens: 3000,
    reason: 'GPT-4 Turbo excelente para diseño creativo'
  },
  EnhancedDesignArchitectAgent: {
    provider: 'anthropic' as const,
    model: CLAUDE_3_5_MODELS.sonnet,
    temperature: 0.4,
    maxTokens: 3000,
    reason: 'Claude superior para arquitectura de diseño compleja'
  },

  // Agente especializado en diseño web y landing pages
  ArtistWeb: {
    provider: 'anthropic' as const,
    model: CLAUDE_3_5_MODELS.sonnet,
    temperature: 0.5,
    maxTokens: 4000,
    reason: 'Claude 3.5 Sonnet ideal para diseño creativo de landing pages con animaciones y marketing digital'
  },

  // Agentes de análisis y observación - Claude (más eficientes)
  FileObserverAgent: {
    provider: 'anthropic' as const,
    model: CLAUDE_3_MODELS.haiku,
    temperature: 0.2,
    maxTokens: 2000,
    reason: 'Claude Haiku ideal para análisis rápido de archivos'
  },
  InstructionAnalyzer: {
    provider: 'anthropic' as const,
    model: CLAUDE_3_MODELS.sonnet,
    temperature: 0.3,
    maxTokens: 1500,
    reason: 'Claude superior para análisis de lenguaje natural'
  },

  // Agentes adicionales - GPT-O3-Mini para máxima precisión en código
  CodeSplitterAgent: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpto3mini,
    temperature: 0.1,
    maxTokens: 2000,
    reason: 'GPT-O3-Mini más preciso para separación de código sin errores'
  },
  CodeCorrectorAgent: {
    provider: 'openai' as const,
    model: OPENAI_MODELS.gpto3mini,
    temperature: 0.05,
    maxTokens: 3000,
    reason: 'GPT-O3-Mini excelente para corrección de errores con máxima precisión'
  },

  // Production Agent - Control de calidad final con máxima capacidad
  ProductionAgent: {
    provider: 'anthropic' as const,
    model: CLAUDE_3_5_MODELS.sonnet,
    temperature: 0.2,
    maxTokens: 8192,
    reason: 'Claude 3.5 Sonnet ideal para análisis completo de calidad y optimización sin truncación'
  },

  // Prompt Enhancement Agent - Mejora de descripciones de usuario
  PromptEnhancementAgent: {
    provider: 'anthropic' as const,
    model: CLAUDE_3_5_MODELS.sonnet,
    temperature: 0.7,
    maxTokens: 3072,
    reason: 'Claude 3.5 Sonnet excelente para análisis de lenguaje natural y mejora de prompts'
  }
};

/**
 * Obtiene la configuración distribuida para un agente
 */
export function getDistributedAgentConfig(agentName: string) {
  return DISTRIBUTED_AGENT_CONFIG[agentName as keyof typeof DISTRIBUTED_AGENT_CONFIG] || {
    provider: 'anthropic' as const,
    model: DEFAULT_MODEL,
    temperature: 0.3,
    maxTokens: 3000,
    reason: 'Configuración por defecto'
  };
}

/**
 * Obtiene la configuración recomendada para un agente (legacy)
 */
export function getAgentConfig(agentName: string) {
  const distributedConfig = getDistributedAgentConfig(agentName);
  return {
    model: distributedConfig.model,
    temperature: distributedConfig.temperature,
    maxTokens: distributedConfig.maxTokens,
    reason: distributedConfig.reason
  };
}

/**
 * Determina si un agente debe usar OpenAI o Anthropic
 */
export function getAgentProvider(agentName: string): 'openai' | 'anthropic' {
  const config = getDistributedAgentConfig(agentName);
  return config.provider;
}

/**
 * Obtiene el modelo específico para un agente según su proveedor
 */
export function getAgentModelId(agentName: string): string {
  const config = getDistributedAgentConfig(agentName);
  return config.model.id;
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
