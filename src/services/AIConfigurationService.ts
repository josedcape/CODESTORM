/**
 * Servicio de Configuración de APIs de IA
 * Verifica y valida las configuraciones de los proveedores de IA
 */

export interface APIConfiguration {
  provider: string;
  name: string;
  isConfigured: boolean;
  isValid: boolean;
  lastValidated?: number;
  error?: string;
  models: string[];
  endpoint?: string;
  status: 'not-configured' | 'configured' | 'valid' | 'invalid' | 'testing';
}

export interface ConfigurationReport {
  totalProviders: number;
  configuredProviders: number;
  validProviders: number;
  configurations: APIConfiguration[];
  recommendations: string[];
  overallStatus: 'none' | 'partial' | 'complete';
}

export class AIConfigurationService {
  private static instance: AIConfigurationService;
  private configurations: Map<string, APIConfiguration> = new Map();
  private listeners: ((report: ConfigurationReport) => void)[] = [];

  private constructor() {
    this.initializeConfigurations();
  }

  public static getInstance(): AIConfigurationService {
    if (!AIConfigurationService.instance) {
      AIConfigurationService.instance = new AIConfigurationService();
    }
    return AIConfigurationService.instance;
  }

  /**
   * Inicializa las configuraciones de los proveedores
   */
  private initializeConfigurations(): void {
    // OpenAI Configuration
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    this.configurations.set('openai', {
      provider: 'openai',
      name: 'OpenAI',
      isConfigured: !!openaiKey && openaiKey.length > 0,
      isValid: false,
      models: ['gpt-4o', 'gpt-3.5-turbo', 'gpt-4-turbo'],
      endpoint: 'http://localhost:3001/api/openai',
      status: openaiKey ? 'configured' : 'not-configured'
    });

    // Google Gemini Configuration
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.configurations.set('gemini', {
      provider: 'gemini',
      name: 'Google Gemini',
      isConfigured: !!geminiKey && geminiKey.length > 0,
      isValid: false,
      models: ['gemini-1.5-pro', 'gemini-1.0-pro'],
      endpoint: 'https://generativelanguage.googleapis.com',
      status: geminiKey ? 'configured' : 'not-configured'
    });

    // Anthropic Claude Configuration
    const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    this.configurations.set('anthropic', {
      provider: 'anthropic',
      name: 'Anthropic Claude',
      isConfigured: !!anthropicKey && anthropicKey.length > 0,
      isValid: false,
      models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
      endpoint: 'http://localhost:3001/api/anthropic/v1/messages',
      status: anthropicKey ? 'configured' : 'not-configured'
    });

    console.log('🔧 Configuraciones de IA inicializadas');
    this.notifyListeners();
  }

  /**
   * Valida todas las configuraciones
   */
  public async validateAllConfigurations(): Promise<ConfigurationReport> {
    console.log('🔍 Validando todas las configuraciones de IA...');

    const validationPromises = Array.from(this.configurations.keys()).map(
      providerId => this.validateConfiguration(providerId)
    );

    await Promise.allSettled(validationPromises);
    
    const report = this.generateReport();
    this.notifyListeners();
    
    return report;
  }

  /**
   * Valida una configuración específica
   */
  public async validateConfiguration(providerId: string): Promise<boolean> {
    const config = this.configurations.get(providerId);
    if (!config) {
      console.warn(`⚠️ Configuración no encontrada para proveedor: ${providerId}`);
      return false;
    }

    if (!config.isConfigured) {
      config.status = 'not-configured';
      config.error = 'API key no configurada';
      return false;
    }

    config.status = 'testing';
    this.notifyListeners();

    try {
      console.log(`🧪 Validando configuración de ${config.name}...`);
      
      const isValid = await this.testProviderConnection(providerId);
      
      config.isValid = isValid;
      config.lastValidated = Date.now();
      config.status = isValid ? 'valid' : 'invalid';
      config.error = isValid ? undefined : 'Falló la validación de conexión';

      console.log(`${isValid ? '✅' : '❌'} Validación de ${config.name}: ${isValid ? 'exitosa' : 'fallida'}`);
      
      return isValid;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      config.isValid = false;
      config.status = 'invalid';
      config.error = errorMessage;
      config.lastValidated = Date.now();

      console.error(`❌ Error validando ${config.name}: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Prueba la conexión con un proveedor específico
   */
  private async testProviderConnection(providerId: string): Promise<boolean> {
    const config = this.configurations.get(providerId);
    if (!config) return false;

    try {
      switch (providerId) {
        case 'openai':
          return await this.testOpenAIConnection();
        case 'gemini':
          return await this.testGeminiConnection();
        case 'anthropic':
          return await this.testAnthropicConnection();
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error probando conexión ${providerId}:`, error);
      return false;
    }
  }

  /**
   * Prueba la conexión con OpenAI
   */
  private async testOpenAIConnection(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001/api/openai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error probando OpenAI:', error);
      return false;
    }
  }

  /**
   * Prueba la conexión con Gemini
   */
  private async testGeminiConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error probando Gemini:', error);
      return false;
    }
  }

  /**
   * Prueba la conexión con Anthropic
   */
  private async testAnthropicConnection(): Promise<boolean> {
    try {
      // Hacer una solicitud simple para verificar la conexión
      const response = await fetch('http://localhost:3001/api/anthropic/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: "claude-3-sonnet-20240229",
          max_tokens: 10,
          messages: [
            {
              role: "user",
              content: "Test"
            }
          ]
        })
      });

      return response.ok || response.status === 429; // 429 significa que la API funciona pero hay límite de cuota
    } catch (error) {
      console.error('Error probando Anthropic:', error);
      return false;
    }
  }

  /**
   * Genera un reporte de configuración
   */
  public generateReport(): ConfigurationReport {
    const configurations = Array.from(this.configurations.values());
    const configuredProviders = configurations.filter(c => c.isConfigured).length;
    const validProviders = configurations.filter(c => c.isValid).length;
    
    let overallStatus: 'none' | 'partial' | 'complete' = 'none';
    if (validProviders === configurations.length) {
      overallStatus = 'complete';
    } else if (validProviders > 0) {
      overallStatus = 'partial';
    }

    const recommendations: string[] = [];
    
    // Generar recomendaciones
    if (configuredProviders === 0) {
      recommendations.push('🔑 Configura al menos una API key para usar CODESTORM Constructor');
      recommendations.push('📖 Consulta la documentación para obtener las API keys');
    } else if (validProviders === 0) {
      recommendations.push('🔍 Verifica que las API keys sean válidas');
      recommendations.push('🌐 Comprueba tu conexión a internet');
    } else if (validProviders < configurations.length) {
      recommendations.push('⚡ Configura más proveedores para mejor redundancia');
      recommendations.push('🛡️ Múltiples proveedores mejoran la disponibilidad');
    } else {
      recommendations.push('✅ ¡Excelente! Todos los proveedores están configurados');
      recommendations.push('🚀 CODESTORM Constructor está listo para usar');
    }

    return {
      totalProviders: configurations.length,
      configuredProviders,
      validProviders,
      configurations,
      recommendations,
      overallStatus
    };
  }

  /**
   * Obtiene la configuración de un proveedor específico
   */
  public getConfiguration(providerId: string): APIConfiguration | undefined {
    return this.configurations.get(providerId);
  }

  /**
   * Obtiene todas las configuraciones
   */
  public getAllConfigurations(): APIConfiguration[] {
    return Array.from(this.configurations.values());
  }

  /**
   * Añade un listener para cambios en la configuración
   */
  public addListener(listener: (report: ConfigurationReport) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remueve un listener
   */
  public removeListener(listener: (report: ConfigurationReport) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notifica a los listeners sobre cambios
   */
  private notifyListeners(): void {
    const report = this.generateReport();
    this.listeners.forEach(listener => listener(report));
  }

  /**
   * Revalida todas las configuraciones periódicamente
   */
  public startPeriodicValidation(intervalMinutes: number = 10): void {
    setInterval(() => {
      console.log('🔄 Ejecutando validación periódica de configuraciones...');
      this.validateAllConfigurations();
    }, intervalMinutes * 60 * 1000);
  }
}
