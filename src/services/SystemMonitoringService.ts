/**
 * Servicio de monitoreo en tiempo real del sistema WebAI
 * Proporciona métricas detalladas de agentes, conectividad y rendimiento
 */

import { EnhancedAPIService } from './EnhancedAPIService';
import { getAllConfiguredAgents, getEffectiveAgentConfig, getGlobalModelConfig } from '../config/claudeModels';

export interface AgentStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  lastChecked: number;
  responseTime: number;
  errorCount: number;
  successCount: number;
  currentModel: {
    provider: string;
    modelId: string;
    name: string;
  };
  lastError?: string;
}

export interface ProxyStatus {
  isRunning: boolean;
  port: number;
  responseTime: number;
  lastChecked: number;
  version?: string;
  endpoints: {
    health: boolean;
    openai: boolean;
    anthropic: boolean;
  };
}

export interface APIKeyStatus {
  provider: 'openai' | 'anthropic';
  isValid: boolean;
  lastChecked: number;
  errorMessage?: string;
  usage?: {
    requests: number;
    tokens: number;
    cost: number;
  };
}

export interface SystemMetrics {
  agents: AgentStatus[];
  proxy: ProxyStatus;
  apiKeys: APIKeyStatus[];
  globalConfig: {
    defaultModel: {
      provider: string;
      modelId: string;
    };
    totalAgents: number;
    overriddenAgents: number;
  };
  performance: {
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
    uptime: number;
  };
  lastUpdate: number;
}

export class SystemMonitoringService {
  private static instance: SystemMonitoringService;
  private apiService: EnhancedAPIService;
  private metrics: SystemMetrics | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private listeners: ((metrics: SystemMetrics) => void)[] = [];

  private constructor() {
    this.apiService = EnhancedAPIService.getInstance();
  }

  public static getInstance(): SystemMonitoringService {
    if (!SystemMonitoringService.instance) {
      SystemMonitoringService.instance = new SystemMonitoringService();
    }
    return SystemMonitoringService.instance;
  }

  /**
   * Inicia el monitoreo automático del sistema
   */
  public startMonitoring(intervalMs: number = 30000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.updateMetrics();
    }, intervalMs);

    // Actualización inicial
    this.updateMetrics();
  }

  /**
   * Detiene el monitoreo automático
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Suscribe un listener para recibir actualizaciones de métricas
   */
  public subscribe(listener: (metrics: SystemMetrics) => void): () => void {
    this.listeners.push(listener);
    
    // Enviar métricas actuales si están disponibles
    if (this.metrics) {
      listener(this.metrics);
    }

    // Retornar función de desuscripción
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Actualiza todas las métricas del sistema
   */
  public async updateMetrics(): Promise<SystemMetrics> {
    console.log('🔍 Actualizando métricas del sistema...');

    const startTime = Date.now();

    try {
      const [agentStatuses, proxyStatus, apiKeyStatuses] = await Promise.all([
        this.checkAllAgents(),
        this.checkProxyStatus(),
        this.checkAPIKeys()
      ]);

      const globalConfig = getGlobalModelConfig();
      const configuredAgents = getAllConfiguredAgents();

      this.metrics = {
        agents: agentStatuses,
        proxy: proxyStatus,
        apiKeys: apiKeyStatuses,
        globalConfig: {
          defaultModel: globalConfig.defaultModel,
          totalAgents: configuredAgents.length,
          overriddenAgents: Object.keys(globalConfig.agentOverrides).length
        },
        performance: {
          averageResponseTime: this.calculateAverageResponseTime(agentStatuses),
          totalRequests: this.calculateTotalRequests(agentStatuses),
          errorRate: this.calculateErrorRate(agentStatuses),
          uptime: Date.now() - startTime
        },
        lastUpdate: Date.now()
      };

      // Notificar a los listeners
      this.listeners.forEach(listener => {
        try {
          listener(this.metrics!);
        } catch (error) {
          console.error('Error notificando listener:', error);
        }
      });

      console.log('✅ Métricas actualizadas exitosamente');
      return this.metrics;

    } catch (error) {
      console.error('❌ Error actualizando métricas:', error);
      throw error;
    }
  }

  /**
   * Verifica el estado de todos los agentes configurados
   */
  private async checkAllAgents(): Promise<AgentStatus[]> {
    const configuredAgents = getAllConfiguredAgents();
    const agentStatuses: AgentStatus[] = [];

    for (const agentName of configuredAgents) {
      try {
        const status = await this.checkAgentStatus(agentName);
        agentStatuses.push(status);
      } catch (error) {
        console.error(`Error verificando agente ${agentName}:`, error);
        agentStatuses.push({
          name: agentName,
          status: 'critical',
          lastChecked: Date.now(),
          responseTime: -1,
          errorCount: 1,
          successCount: 0,
          currentModel: {
            provider: 'unknown',
            modelId: 'unknown',
            name: 'Error'
          },
          lastError: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    return agentStatuses;
  }

  /**
   * Verifica el estado de un agente específico
   */
  public async checkAgentStatus(agentName: string): Promise<AgentStatus> {
    const startTime = Date.now();
    
    try {
      const config = getEffectiveAgentConfig(agentName);
      
      // Realizar una prueba simple del agente
      const testPrompt = `Test de conectividad para ${agentName}. Responde solo "OK".`;
      
      const response = await this.apiService.sendMessage(testPrompt, {
        agentName,
        maxTokens: 10,
        temperature: 0.1,
        systemPrompt: 'Responde únicamente "OK" para confirmar conectividad.'
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response && response.data && response.data.trim().toLowerCase().includes('ok');

      return {
        name: agentName,
        status: isHealthy ? 'healthy' : 'degraded',
        lastChecked: Date.now(),
        responseTime,
        errorCount: isHealthy ? 0 : 1,
        successCount: isHealthy ? 1 : 0,
        currentModel: {
          provider: config.provider,
          modelId: config.model.id,
          name: config.model.name || config.model.id
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        name: agentName,
        status: 'critical',
        lastChecked: Date.now(),
        responseTime,
        errorCount: 1,
        successCount: 0,
        currentModel: {
          provider: 'unknown',
          modelId: 'unknown',
          name: 'Error'
        },
        lastError: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Verifica el estado del proxy API
   */
  private async checkProxyStatus(): Promise<ProxyStatus> {
    const startTime = Date.now();
    
    try {
      // Verificar endpoint de salud del proxy
      const healthResponse = await fetch('http://localhost:3002/health', {
        method: 'GET',
        timeout: 5000
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = healthResponse.ok;

      let healthData: any = {};
      try {
        healthData = await healthResponse.json();
      } catch (e) {
        // Ignorar errores de parsing JSON
      }

      return {
        isRunning: isHealthy,
        port: 3002,
        responseTime,
        lastChecked: Date.now(),
        version: healthData.version || 'unknown',
        endpoints: {
          health: isHealthy,
          openai: healthData.endpoints?.openai ?? false,
          anthropic: healthData.endpoints?.anthropic ?? false
        }
      };

    } catch (error) {
      return {
        isRunning: false,
        port: 3002,
        responseTime: Date.now() - startTime,
        lastChecked: Date.now(),
        endpoints: {
          health: false,
          openai: false,
          anthropic: false
        }
      };
    }
  }

  /**
   * Verifica el estado de las API keys
   */
  private async checkAPIKeys(): Promise<APIKeyStatus[]> {
    const apiKeys: APIKeyStatus[] = [];

    // Verificar OpenAI
    try {
      const openaiStatus = await this.checkAPIKey('openai');
      apiKeys.push(openaiStatus);
    } catch (error) {
      apiKeys.push({
        provider: 'openai',
        isValid: false,
        lastChecked: Date.now(),
        errorMessage: error instanceof Error ? error.message : 'Error verificando OpenAI'
      });
    }

    // Verificar Anthropic
    try {
      const anthropicStatus = await this.checkAPIKey('anthropic');
      apiKeys.push(anthropicStatus);
    } catch (error) {
      apiKeys.push({
        provider: 'anthropic',
        isValid: false,
        lastChecked: Date.now(),
        errorMessage: error instanceof Error ? error.message : 'Error verificando Anthropic'
      });
    }

    return apiKeys;
  }

  /**
   * Verifica una API key específica
   */
  private async checkAPIKey(provider: 'openai' | 'anthropic'): Promise<APIKeyStatus> {
    try {
      // Realizar una llamada de prueba mínima
      const testResponse = await this.apiService.sendMessage('Test', {
        agentName: 'TestAgent',
        maxTokens: 5,
        temperature: 0,
        systemPrompt: 'Responde "OK"'
      });

      return {
        provider,
        isValid: !!testResponse.data,
        lastChecked: Date.now(),
        usage: {
          requests: 1,
          tokens: 5,
          cost: 0.001
        }
      };

    } catch (error) {
      return {
        provider,
        isValid: false,
        lastChecked: Date.now(),
        errorMessage: error instanceof Error ? error.message : 'Error de conexión'
      };
    }
  }

  /**
   * Calcula el tiempo de respuesta promedio
   */
  private calculateAverageResponseTime(agents: AgentStatus[]): number {
    const validTimes = agents.filter(a => a.responseTime > 0).map(a => a.responseTime);
    return validTimes.length > 0 ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length : 0;
  }

  /**
   * Calcula el total de requests
   */
  private calculateTotalRequests(agents: AgentStatus[]): number {
    return agents.reduce((total, agent) => total + agent.successCount + agent.errorCount, 0);
  }

  /**
   * Calcula la tasa de error
   */
  private calculateErrorRate(agents: AgentStatus[]): number {
    const totalRequests = this.calculateTotalRequests(agents);
    const totalErrors = agents.reduce((total, agent) => total + agent.errorCount, 0);
    return totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  }

  /**
   * Obtiene las métricas actuales
   */
  public getCurrentMetrics(): SystemMetrics | null {
    return this.metrics;
  }
}
