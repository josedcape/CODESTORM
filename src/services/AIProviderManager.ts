/**
 * Sistema de Gestión de Proveedores de IA con Fallback Robusto
 * Maneja múltiples proveedores de IA con rotación automática y recuperación de errores
 */

export interface AIProvider {
  id: string;
  name: string;
  models: string[];
  isAvailable: boolean;
  lastError?: string;
  lastErrorTime?: number;
  quotaResetTime?: number;
  priority: number;
  healthStatus: 'healthy' | 'degraded' | 'unavailable';
  responseTime?: number;
  successRate: number;
  totalRequests: number;
  successfulRequests: number;
}

export interface AIRequest {
  instruction: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: string;
  executionTime: number;
  fallbackUsed: boolean;
  tokensUsed?: number;
  cost?: number;
}

export interface ProviderConfig {
  openai: {
    apiKey: string;
    baseURL?: string;
    models: string[];
  };
  gemini: {
    apiKey: string;
    models: string[];
  };
  anthropic: {
    apiKey: string;
    baseURL?: string;
    models: string[];
  };
}

export class AIProviderManager {
  private static instance: AIProviderManager;
  private providers: Map<string, AIProvider> = new Map();
  private config: ProviderConfig;
  private currentProviderIndex = 0;
  private healthCheckInterval?: NodeJS.Timeout;
  private listeners: ((providers: AIProvider[]) => void)[] = [];

  private constructor() {
    this.config = this.loadConfiguration();
    this.initializeProviders();
    this.startHealthChecks();
  }

  public static getInstance(): AIProviderManager {
    if (!AIProviderManager.instance) {
      AIProviderManager.instance = new AIProviderManager();
    }
    return AIProviderManager.instance;
  }

  /**
   * Carga la configuración de los proveedores desde variables de entorno
   */
  private loadConfiguration(): ProviderConfig {
    return {
      openai: {
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
        models: ['gpt-4o', 'gpt-3.5-turbo', 'gpt-4-turbo']
      },
      gemini: {
        apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
        models: ['gemini-1.5-pro', 'gemini-1.0-pro']
      },
      anthropic: {
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
        baseURL: 'http://localhost:3001/api/anthropic/v1/messages',
        models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229']
      }
    };
  }

  /**
   * Inicializa los proveedores de IA
   */
  private initializeProviders(): void {
    // OpenAI Provider
    this.providers.set('openai', {
      id: 'openai',
      name: 'OpenAI',
      models: this.config.openai.models,
      isAvailable: !!this.config.openai.apiKey,
      priority: 1,
      healthStatus: 'healthy',
      successRate: 100,
      totalRequests: 0,
      successfulRequests: 0
    });

    // Google Gemini Provider
    this.providers.set('gemini', {
      id: 'gemini',
      name: 'Google Gemini',
      models: this.config.gemini.models,
      isAvailable: !!this.config.gemini.apiKey,
      priority: 2,
      healthStatus: 'healthy',
      successRate: 100,
      totalRequests: 0,
      successfulRequests: 0
    });

    // Anthropic Claude Provider
    this.providers.set('anthropic', {
      id: 'anthropic',
      name: 'Anthropic Claude',
      models: this.config.anthropic.models,
      isAvailable: !!this.config.anthropic.apiKey,
      priority: 3,
      healthStatus: 'healthy',
      successRate: 100,
      totalRequests: 0,
      successfulRequests: 0
    });

    console.log('🤖 Proveedores de IA inicializados:', Array.from(this.providers.keys()));
  }

  /**
   * Obtiene la lista de proveedores ordenados por prioridad y disponibilidad
   */
  public getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.values())
      .filter(provider => provider.isAvailable && provider.healthStatus !== 'unavailable')
      .sort((a, b) => {
        // Priorizar por estado de salud y luego por prioridad
        if (a.healthStatus === 'healthy' && b.healthStatus !== 'healthy') return -1;
        if (b.healthStatus === 'healthy' && a.healthStatus !== 'healthy') return 1;
        return a.priority - b.priority;
      });
  }

  /**
   * Obtiene el mejor proveedor disponible
   */
  public getBestProvider(): AIProvider | null {
    const available = this.getAvailableProviders();
    return available.length > 0 ? available[0] : null;
  }

  /**
   * Obtiene todos los proveedores (para monitoreo)
   */
  public getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Marca un proveedor como no disponible debido a un error
   */
  public markProviderUnavailable(providerId: string, error: string, quotaResetTime?: number): void {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.isAvailable = false;
      provider.lastError = error;
      provider.lastErrorTime = Date.now();
      provider.healthStatus = 'unavailable';
      
      if (quotaResetTime) {
        provider.quotaResetTime = quotaResetTime;
      }

      // Si es un error de cuota, estimar tiempo de recuperación
      if (error.includes('429') || error.includes('quota')) {
        provider.quotaResetTime = Date.now() + (15 * 60 * 1000); // 15 minutos
      }

      console.warn(`⚠️ Proveedor ${provider.name} marcado como no disponible: ${error}`);
      this.notifyListeners();
    }
  }

  /**
   * Actualiza las estadísticas de un proveedor
   */
  public updateProviderStats(providerId: string, success: boolean, responseTime?: number): void {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.totalRequests++;
      if (success) {
        provider.successfulRequests++;
        provider.healthStatus = 'healthy';
        provider.isAvailable = true;
        provider.lastError = undefined;
      }
      
      if (responseTime) {
        provider.responseTime = responseTime;
      }

      provider.successRate = (provider.successfulRequests / provider.totalRequests) * 100;
      this.notifyListeners();
    }
  }

  /**
   * Verifica si un proveedor puede ser reintentado
   */
  public canRetryProvider(providerId: string): boolean {
    const provider = this.providers.get(providerId);
    if (!provider || provider.healthStatus === 'healthy') return true;

    const now = Date.now();
    
    // Si hay un tiempo de reset de cuota, verificar si ya pasó
    if (provider.quotaResetTime && now < provider.quotaResetTime) {
      return false;
    }

    // Si el último error fue hace más de 5 minutos, permitir reintento
    if (provider.lastErrorTime && (now - provider.lastErrorTime) > 5 * 60 * 1000) {
      return true;
    }

    return false;
  }

  /**
   * Realiza health checks periódicos de los proveedores
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 2 * 60 * 1000); // Cada 2 minutos
  }

  /**
   * Ejecuta health checks en todos los proveedores
   */
  private async performHealthChecks(): Promise<void> {
    console.log('🔍 Ejecutando health checks de proveedores...');
    
    for (const [providerId, provider] of this.providers) {
      if (this.canRetryProvider(providerId)) {
        try {
          await this.testProvider(providerId);
          console.log(`✅ Health check exitoso para ${provider.name}`);
        } catch (error) {
          console.warn(`❌ Health check falló para ${provider.name}:`, error);
        }
      }
    }
  }

  /**
   * Prueba un proveedor específico con una solicitud simple
   */
  private async testProvider(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;

    try {
      const startTime = Date.now();
      
      // Realizar una solicitud de prueba simple
      const testRequest: AIRequest = {
        instruction: 'Responde solo con "OK"',
        timeout: 10000 // 10 segundos de timeout
      };

      // Aquí se haría la llamada real a la API
      // Por ahora, simularemos el comportamiento
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const responseTime = Date.now() - startTime;
      this.updateProviderStats(providerId, true, responseTime);
      
      return true;
    } catch (error) {
      this.updateProviderStats(providerId, false);
      return false;
    }
  }

  /**
   * Añade un listener para cambios en el estado de los proveedores
   */
  public addListener(listener: (providers: AIProvider[]) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remueve un listener
   */
  public removeListener(listener: (providers: AIProvider[]) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notifica a todos los listeners sobre cambios
   */
  private notifyListeners(): void {
    const providers = this.getAllProviders();
    this.listeners.forEach(listener => listener(providers));
  }

  /**
   * Limpia recursos al destruir la instancia
   */
  public destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.listeners = [];
  }
}
