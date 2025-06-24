import { 
  getDistributedAgentConfig, 
  getAgentProvider, 
  getAgentModelId,
  DISTRIBUTED_AGENT_CONFIG 
} from '../config/claudeModels';
import { EnhancedAPIService } from './EnhancedAPIService';

/**
 * Servicio de Distribución de Agentes
 * Centraliza la lógica de distribución entre OpenAI y Claude
 * para optimizar el uso de APIs y evitar sobrecarga
 */
export class AgentDistributionService {
  private static instance: AgentDistributionService;
  private apiService = EnhancedAPIService.getInstance();
  
  // Estadísticas de uso por proveedor
  private usageStats = {
    openai: { requests: 0, errors: 0, lastUsed: 0 },
    claude: { requests: 0, errors: 0, lastUsed: 0 }
  };

  private constructor() {}

  public static getInstance(): AgentDistributionService {
    if (!AgentDistributionService.instance) {
      AgentDistributionService.instance = new AgentDistributionService();
    }
    return AgentDistributionService.instance;
  }

  /**
   * Ejecuta un agente usando la configuración distribuida
   */
  public async executeAgent(
    agentName: string,
    prompt: string,
    options: {
      systemPrompt?: string;
      maxTokens?: number;
      temperature?: number;
      timeout?: number;
    } = {}
  ): Promise<{
    success: boolean;
    data?: string;
    error?: string;
    provider?: 'openai' | 'claude';
    model?: string;
    fallbackUsed?: boolean;
    executionTime?: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Obtener configuración del agente
      const agentConfig = getDistributedAgentConfig(agentName);
      const provider = agentConfig.provider;
      
      console.log(`🎯 [AgentDistribution] ${agentName} → ${provider} (${agentConfig.model.name})`);
      
      // Actualizar estadísticas
      this.usageStats[provider].requests++;
      this.usageStats[provider].lastUsed = Date.now();
      
      // Preparar opciones para la API
      const apiOptions = {
        agentName,
        systemPrompt: options.systemPrompt,
        maxTokens: options.maxTokens || agentConfig.maxTokens,
        temperature: options.temperature || agentConfig.temperature
      };
      
      // Ejecutar con timeout si se especifica
      let response;
      if (options.timeout) {
        response = await Promise.race([
          this.apiService.sendMessage(prompt, apiOptions),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), options.timeout)
          )
        ]) as any;
      } else {
        response = await this.apiService.sendMessage(prompt, apiOptions);
      }
      
      const executionTime = Date.now() - startTime;
      
      if (!response.success) {
        this.usageStats[provider].errors++;
        return {
          success: false,
          error: response.error,
          provider,
          model: agentConfig.model.name,
          executionTime
        };
      }
      
      return {
        success: true,
        data: response.data,
        provider,
        model: agentConfig.model.name,
        fallbackUsed: response.fallbackUsed || false,
        executionTime
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const provider = getAgentProvider(agentName);
      this.usageStats[provider].errors++;
      
      console.error(`❌ [AgentDistribution] Error en ${agentName}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        provider,
        executionTime
      };
    }
  }

  /**
   * Obtiene estadísticas de uso de los proveedores
   */
  public getUsageStats() {
    return {
      ...this.usageStats,
      distribution: this.getAgentDistribution(),
      recommendations: this.getOptimizationRecommendations()
    };
  }

  /**
   * Obtiene la distribución actual de agentes
   */
  public getAgentDistribution() {
    const distribution = { openai: [], claude: [] } as { 
      openai: string[], 
      claude: string[] 
    };
    
    Object.entries(DISTRIBUTED_AGENT_CONFIG).forEach(([agentName, config]) => {
      distribution[config.provider].push(agentName);
    });
    
    return distribution;
  }

  /**
   * Proporciona recomendaciones de optimización
   */
  private getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const { openai, claude } = this.usageStats;
    
    // Verificar balance de carga
    const totalRequests = openai.requests + claude.requests;
    if (totalRequests > 0) {
      const openaiPercentage = (openai.requests / totalRequests) * 100;
      const claudePercentage = (claude.requests / totalRequests) * 100;
      
      if (openaiPercentage > 70) {
        recommendations.push('Considerar mover más agentes a Claude para balancear la carga');
      } else if (claudePercentage > 70) {
        recommendations.push('Considerar mover más agentes a OpenAI para balancear la carga');
      }
    }
    
    // Verificar tasas de error
    if (openai.requests > 0 && (openai.errors / openai.requests) > 0.1) {
      recommendations.push('Alta tasa de errores en OpenAI - verificar conectividad');
    }
    
    if (claude.requests > 0 && (claude.errors / claude.requests) > 0.1) {
      recommendations.push('Alta tasa de errores en Claude - verificar conectividad');
    }
    
    return recommendations;
  }

  /**
   * Reinicia las estadísticas de uso
   */
  public resetStats(): void {
    this.usageStats = {
      openai: { requests: 0, errors: 0, lastUsed: 0 },
      claude: { requests: 0, errors: 0, lastUsed: 0 }
    };
  }

  /**
   * Verifica el estado de salud de la distribución
   */
  public async healthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    providers: {
      openai: { available: boolean; latency?: number };
      claude: { available: boolean; latency?: number };
    };
  }> {
    const issues: string[] = [];
    const providers = {
      openai: { available: false, latency: undefined as number | undefined },
      claude: { available: false, latency: undefined as number | undefined }
    };
    
    try {
      // Verificar conectividad con ambos proveedores
      const connectionStatus = await this.apiService.testConnection();
      
      if (connectionStatus.isConnected) {
        if (connectionStatus.provider === 'openai') {
          providers.openai.available = true;
        } else if (connectionStatus.provider === 'anthropic') {
          providers.claude.available = true;
        }
      } else {
        issues.push('No hay conectividad con ningún proveedor de IA');
      }
      
      // Verificar balance de agentes
      const distribution = this.getAgentDistribution();
      const openaiCount = distribution.openai.length;
      const claudeCount = distribution.claude.length;
      
      if (openaiCount === 0) {
        issues.push('No hay agentes asignados a OpenAI');
      }
      
      if (claudeCount === 0) {
        issues.push('No hay agentes asignados a Claude');
      }
      
      const healthy = issues.length === 0;
      
      return { healthy, issues, providers };
      
    } catch (error) {
      issues.push(`Error en health check: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return { healthy: false, issues, providers };
    }
  }
}

export default AgentDistributionService;
