import {
  getModelIdForTask,
  getModelForTask,
  isValidModel,
  DEFAULT_MODEL,
  getDistributedAgentConfig,
  getAgentProvider,
  getAgentModelId,
  OPENAI_MODELS
} from '../config/claudeModels';

/**
 * Enhanced API Service with connection retry logic and error handling
 * Provides robust connection to Claude models (correctos) and OpenAI APIs
 */

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  retryCount?: number;
  fallbackUsed?: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface APIConnectionStatus {
  isConnected: boolean;
  lastChecked: number;
  errorCount: number;
  provider: 'anthropic' | 'openai' | 'local' | 'none';
}

/**
 * Enhanced API Service with intelligent retry and fallback mechanisms
 */
export class EnhancedAPIService {
  private static instance: EnhancedAPIService;
  private connectionStatus: APIConnectionStatus = {
    isConnected: false,
    lastChecked: 0,
    errorCount: 0,
    provider: 'none'
  };

  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };

  private constructor() {}

  public static getInstance(): EnhancedAPIService {
    if (!EnhancedAPIService.instance) {
      EnhancedAPIService.instance = new EnhancedAPIService();
    }
    return EnhancedAPIService.instance;
  }

  /**
   * Test API connection with exponential backoff retry
   */
  public async testConnection(): Promise<APIConnectionStatus> {
    console.log('🔍 Testing API connections...');
    
    // Test Anthropic API first (preferred)
    const anthropicResult = await this.testAnthropicConnection();
    if (anthropicResult.success) {
      this.connectionStatus = {
        isConnected: true,
        lastChecked: Date.now(),
        errorCount: 0,
        provider: 'anthropic'
      };
      console.log('✅ Anthropic API connected successfully');
      return this.connectionStatus;
    }

    // Fallback to OpenAI
    const openaiResult = await this.testOpenAIConnection();
    if (openaiResult.success) {
      this.connectionStatus = {
        isConnected: true,
        lastChecked: Date.now(),
        errorCount: 0,
        provider: 'openai'
      };
      console.log('✅ OpenAI API connected successfully (fallback)');
      return this.connectionStatus;
    }

    // No connection available
    this.connectionStatus = {
      isConnected: false,
      lastChecked: Date.now(),
      errorCount: this.connectionStatus.errorCount + 1,
      provider: 'none'
    };
    console.log('❌ No API connections available');
    return this.connectionStatus;
  }

  /**
   * Test Anthropic API connection with correct syntax
   */
  private async testAnthropicConnection(): Promise<APIResponse> {
    try {
      console.log('🧪 Testing Anthropic API connection...');

      const response = await this.makeRequestWithRetry('http://localhost:3002/api/anthropic/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
          // No enviamos x-api-key desde frontend, el proxy lo maneja
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL.id, // Usar modelo por defecto de la configuración
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Test connection' }]
        })
      });

      if (response.ok) {
        console.log('✅ Anthropic API test successful');
      } else {
        const errorText = await response.text();
        console.error('❌ Anthropic API test failed:', response.status, errorText);
      }

      return { success: response.ok };
    } catch (error) {
      console.error('❌ Anthropic connection test failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Test OpenAI API connection
   */
  private async testOpenAIConnection(): Promise<APIResponse> {
    try {
      console.log('🧪 Testing OpenAI API connection...');

      const response = await this.makeRequestWithRetry('http://localhost:3002/api/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // No enviamos Authorization desde frontend, el proxy lo maneja
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // Usar modelo más básico para test
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Test connection' }]
        })
      });

      if (response.ok) {
        console.log('✅ OpenAI API test successful');
      } else {
        const errorText = await response.text();
        console.error('❌ OpenAI API test failed:', response.status, errorText);
      }

      return { success: response.ok };
    } catch (error) {
      console.error('❌ OpenAI connection test failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Make API request with exponential backoff retry
   */
  private async makeRequestWithRetry(
    url: string, 
    options: RequestInit, 
    retryCount = 0
  ): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok && retryCount < this.retryConfig.maxRetries) {
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount),
          this.retryConfig.maxDelay
        );
        
        console.log(`⏳ Request failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.retryConfig.maxRetries})`);
        await this.sleep(delay);
        return this.makeRequestWithRetry(url, options, retryCount + 1);
      }

      return response;
    } catch (error) {
      if (retryCount < this.retryConfig.maxRetries) {
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount),
          this.retryConfig.maxDelay
        );
        
        console.log(`⏳ Connection error, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.retryConfig.maxRetries})`);
        await this.sleep(delay);
        return this.makeRequestWithRetry(url, options, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Send message to AI with automatic provider selection and fallback
   */
  public async sendMessage(
    message: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
      taskType?: 'complex' | 'balanced' | 'fast' | 'default';
      agentName?: string; // Nuevo parámetro para distribución de agentes
    } = {}
  ): Promise<APIResponse<string>> {
    // Ensure we have a valid connection
    if (!this.connectionStatus.isConnected || Date.now() - this.connectionStatus.lastChecked > 300000) {
      await this.testConnection();
    }

    if (!this.connectionStatus.isConnected) {
      return {
        success: false,
        error: 'No API connections available. Please check your internet connection and API keys.',
        fallbackUsed: false
      };
    }

    try {
      // Determinar proveedor basado en el agente si se especifica
      let preferredProvider = this.connectionStatus.provider;

      if (options.agentName) {
        preferredProvider = getAgentProvider(options.agentName);
        console.log(`🎯 Agent ${options.agentName} configured to use ${preferredProvider}`);
      }

      // Usar proveedor preferido
      if (preferredProvider === 'anthropic') {
        return await this.sendAnthropicMessage(message, options);
      } else if (preferredProvider === 'openai') {
        return await this.sendOpenAIMessage(message, options);
      }

      // Fallback al proveedor disponible
      if (this.connectionStatus.provider === 'anthropic') {
        return await this.sendAnthropicMessage(message, options);
      } else if (this.connectionStatus.provider === 'openai') {
        return await this.sendOpenAIMessage(message, options);
      } else {
        return {
          success: false,
          error: 'No valid API provider configured',
          fallbackUsed: false
        };
      }
    } catch (error) {
      console.error('API request failed:', error);

      // Try fallback provider
      if (this.connectionStatus.provider === 'anthropic') {
        console.log('🔄 Trying OpenAI fallback...');
        const fallbackResult = await this.sendOpenAIMessage(message, options);
        return { ...fallbackResult, fallbackUsed: true };
      } else if (this.connectionStatus.provider === 'openai') {
        console.log('🔄 Trying Anthropic fallback...');
        const fallbackResult = await this.sendAnthropicMessage(message, options);
        return { ...fallbackResult, fallbackUsed: true };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown API error',
        fallbackUsed: false
      };
    }
  }

  /**
   * Get the best Claude model for the task using centralized configuration
   */
  private getClaudeModel(taskType?: string): string {
    return getModelIdForTask(taskType);
  }

  /**
   * Send message to Anthropic Claude with correct API syntax
   */
  private async sendAnthropicMessage(
    message: string,
    options: any
  ): Promise<APIResponse<string>> {
    // Determinar el mejor modelo para la tarea
    let modelToUse = options.model || this.getClaudeModel(options.taskType);

    // Si se especifica un agente, usar su modelo configurado
    if (options.agentName) {
      const agentConfig = getDistributedAgentConfig(options.agentName);
      if (agentConfig.provider === 'anthropic') {
        modelToUse = agentConfig.model.id;
        console.log(`🤖 Using Claude model ${modelToUse} for agent ${options.agentName}`);
      }
    }

    // Construir el payload según la sintaxis correcta de Anthropic
    const requestBody: any = {
      model: modelToUse,
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.7,
      messages: [{ role: 'user', content: message }]
    };

    // Agregar system prompt si existe (sintaxis correcta de Anthropic)
    if (options.systemPrompt) {
      requestBody.system = options.systemPrompt;
    }

    console.log(`🔄 Sending request to Claude ${modelToUse} via proxy...`);

    const response = await this.makeRequestWithRetry('http://localhost:3002/api/anthropic/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
        // No enviamos x-api-key desde frontend, el proxy lo maneja automáticamente
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Anthropic API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Claude response received successfully`);

    return {
      success: true,
      data: data.content[0]?.text || 'No response content',
      executionTime: Date.now() - Date.now() // Se calculará en el nivel superior
    };
  }

  /**
   * Send message to OpenAI
   */
  private async sendOpenAIMessage(
    message: string,
    options: any
  ): Promise<APIResponse<string>> {
    const messages = options.systemPrompt
      ? [
          { role: 'system', content: options.systemPrompt },
          { role: 'user', content: message }
        ]
      : [{ role: 'user', content: message }];

    // Determinar el mejor modelo para la tarea
    let modelToUse = options.model || 'gpt-4o';

    // Si se especifica un agente, usar su modelo configurado
    if (options.agentName) {
      const agentConfig = getDistributedAgentConfig(options.agentName);
      if (agentConfig.provider === 'openai') {
        modelToUse = agentConfig.model.id;
        console.log(`🤖 Using OpenAI model ${modelToUse} for agent ${options.agentName}`);
      }
    }

    console.log(`🔄 Sending request to OpenAI ${modelToUse} via proxy...`);

    const response = await this.makeRequestWithRetry('http://localhost:3002/api/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // No enviamos Authorization desde frontend, el proxy lo maneja automáticamente
      },
      body: JSON.stringify({
        model: modelToUse,
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.7,
        messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenAI API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ OpenAI response received successfully`);

    return {
      success: true,
      data: data.choices[0]?.message?.content || 'No response content',
      executionTime: Date.now() - Date.now() // Se calculará en el nivel superior
    };
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus(): APIConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset connection status (force reconnection test)
   */
  public resetConnection(): void {
    this.connectionStatus = {
      isConnected: false,
      lastChecked: 0,
      errorCount: 0,
      provider: 'none'
    };
  }
}
