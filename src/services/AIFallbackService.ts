/**
 * Servicio de Fallback Inteligente para APIs de IA
 * Maneja la rotación automática entre proveedores y recuperación de errores
 */

import { AIProviderManager, AIProvider, AIRequest, AIResponse } from './AIProviderManager';
import { processInstruction } from './ai';

export interface FallbackAttempt {
  providerId: string;
  model: string;
  success: boolean;
  error?: string;
  responseTime?: number;
  timestamp: number;
}

export interface FallbackResult {
  success: boolean;
  response?: AIResponse;
  attempts: FallbackAttempt[];
  finalProvider?: string;
  totalTime: number;
  fallbacksUsed: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class AIFallbackService {
  private static instance: AIFallbackService;
  private providerManager: AIProviderManager;
  private retryConfig: RetryConfig;
  private fallbackHistory: FallbackAttempt[] = [];
  private listeners: ((result: FallbackResult) => void)[] = [];

  private constructor() {
    this.providerManager = AIProviderManager.getInstance();
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 segundo
      maxDelay: 30000, // 30 segundos
      backoffMultiplier: 2
    };
  }

  public static getInstance(): AIFallbackService {
    if (!AIFallbackService.instance) {
      AIFallbackService.instance = new AIFallbackService();
    }
    return AIFallbackService.instance;
  }

  /**
   * Ejecuta una solicitud con fallback automático
   */
  public async executeWithFallback(request: AIRequest): Promise<FallbackResult> {
    const startTime = Date.now();
    const attempts: FallbackAttempt[] = [];
    let lastError: string = '';

    console.log('🔄 Iniciando solicitud con fallback automático...');

    // Obtener proveedores disponibles ordenados por prioridad
    const availableProviders = this.providerManager.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      return this.createFailureResult(attempts, startTime, 'No hay proveedores de IA disponibles');
    }

    // Intentar con cada proveedor disponible
    for (const provider of availableProviders) {
      for (const model of provider.models) {
        try {
          console.log(`🤖 Intentando con ${provider.name} (${model})...`);
          
          const attemptStartTime = Date.now();
          const response = await this.makeRequest(provider.id, model, request);
          const responseTime = Date.now() - attemptStartTime;

          // Registrar intento exitoso
          const attempt: FallbackAttempt = {
            providerId: provider.id,
            model,
            success: true,
            responseTime,
            timestamp: Date.now()
          };
          attempts.push(attempt);

          // Actualizar estadísticas del proveedor
          this.providerManager.updateProviderStats(provider.id, true, responseTime);

          console.log(`✅ Éxito con ${provider.name} (${model}) en ${responseTime}ms`);

          const result: FallbackResult = {
            success: true,
            response: {
              content: response.content,
              model,
              provider: provider.name,
              executionTime: responseTime,
              fallbackUsed: attempts.length > 1,
              tokensUsed: response.tokensUsed,
              cost: response.cost
            },
            attempts,
            finalProvider: provider.id,
            totalTime: Date.now() - startTime,
            fallbacksUsed: attempts.length - 1
          };

          this.notifyListeners(result);
          return result;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          lastError = errorMessage;

          console.warn(`❌ Falló ${provider.name} (${model}): ${errorMessage}`);

          // Registrar intento fallido
          const attempt: FallbackAttempt = {
            providerId: provider.id,
            model,
            success: false,
            error: errorMessage,
            responseTime: Date.now() - Date.now(),
            timestamp: Date.now()
          };
          attempts.push(attempt);

          // Analizar el tipo de error y marcar el proveedor si es necesario
          this.handleProviderError(provider.id, errorMessage);

          // Si es un error de cuota o conexión, pasar al siguiente proveedor inmediatamente
          if (this.isQuotaError(errorMessage) || this.isConnectionError(errorMessage)) {
            console.log(`⏭️ Error crítico detectado, saltando a siguiente proveedor...`);
            break; // Salir del bucle de modelos para este proveedor
          }

          // Para otros errores, intentar con el siguiente modelo del mismo proveedor
          continue;
        }
      }
    }

    // Si llegamos aquí, todos los proveedores fallaron
    return this.createFailureResult(attempts, startTime, lastError);
  }

  /**
   * Realiza una solicitud a un proveedor específico
   */
  private async makeRequest(providerId: string, model: string, request: AIRequest): Promise<any> {
    // Mapear el modelo al formato esperado por el servicio ai.ts
    const modelMap: { [key: string]: string } = {
      'gpt-4o': 'GPT-4O',
      'gpt-3.5-turbo': 'GPT-O3 Mini',
      'gemini-1.5-pro': 'Gemini 2.5',
      'gemini-1.0-pro': 'Gemini 2.0 Flash',
      'claude-3-opus-20240229': 'Claude 3.7',
      'claude-3-sonnet-20240229': 'Claude 3.5 Sonnet V2'
    };

    const mappedModel = modelMap[model] || model;
    
    // Usar el servicio existente de ai.ts
    const response = await processInstruction(request.instruction, mappedModel);
    
    return {
      content: response.content,
      tokensUsed: response.tokensUsed,
      cost: response.cost
    };
  }

  /**
   * Maneja errores específicos de proveedores
   */
  private handleProviderError(providerId: string, error: string): void {
    if (this.isQuotaError(error)) {
      // Error de cuota - marcar como no disponible temporalmente
      this.providerManager.markProviderUnavailable(
        providerId, 
        error, 
        Date.now() + (15 * 60 * 1000) // 15 minutos
      );
    } else if (this.isConnectionError(error)) {
      // Error de conexión - marcar como no disponible por 5 minutos
      this.providerManager.markProviderUnavailable(
        providerId, 
        error, 
        Date.now() + (5 * 60 * 1000) // 5 minutos
      );
    } else {
      // Otros errores - actualizar estadísticas pero mantener disponible
      this.providerManager.updateProviderStats(providerId, false);
    }
  }

  /**
   * Detecta errores de cuota
   */
  private isQuotaError(error: string): boolean {
    const quotaKeywords = ['429', 'quota', 'exceeded', 'rate limit', 'too many requests'];
    return quotaKeywords.some(keyword => error.toLowerCase().includes(keyword.toLowerCase()));
  }

  /**
   * Detecta errores de conexión
   */
  private isConnectionError(error: string): boolean {
    const connectionKeywords = [
      'ERR_CONNECTION_REFUSED',
      'ECONNREFUSED',
      'connection refused',
      'network error',
      'Failed to fetch',
      'timeout',
      'ETIMEDOUT'
    ];
    return connectionKeywords.some(keyword => error.toLowerCase().includes(keyword.toLowerCase()));
  }

  /**
   * Crea un resultado de fallo
   */
  private createFailureResult(attempts: FallbackAttempt[], startTime: number, error: string): FallbackResult {
    const result: FallbackResult = {
      success: false,
      attempts,
      totalTime: Date.now() - startTime,
      fallbacksUsed: attempts.length
    };

    console.error(`❌ Todos los proveedores fallaron. Último error: ${error}`);
    this.notifyListeners(result);
    return result;
  }

  /**
   * Obtiene estadísticas de fallback
   */
  public getFallbackStats(): {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    averageResponseTime: number;
    providerUsage: { [key: string]: number };
  } {
    const totalAttempts = this.fallbackHistory.length;
    const successfulAttempts = this.fallbackHistory.filter(a => a.success).length;
    const failedAttempts = totalAttempts - successfulAttempts;
    
    const responseTimes = this.fallbackHistory
      .filter(a => a.responseTime)
      .map(a => a.responseTime!);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    const providerUsage: { [key: string]: number } = {};
    this.fallbackHistory.forEach(attempt => {
      providerUsage[attempt.providerId] = (providerUsage[attempt.providerId] || 0) + 1;
    });

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      averageResponseTime,
      providerUsage
    };
  }

  /**
   * Limpia el historial de fallbacks
   */
  public clearHistory(): void {
    this.fallbackHistory = [];
  }

  /**
   * Añade un listener para resultados de fallback
   */
  public addListener(listener: (result: FallbackResult) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remueve un listener
   */
  public removeListener(listener: (result: FallbackResult) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notifica a los listeners sobre resultados
   */
  private notifyListeners(result: FallbackResult): void {
    this.listeners.forEach(listener => listener(result));
    
    // Agregar al historial
    this.fallbackHistory.push(...result.attempts);
    
    // Mantener solo los últimos 100 intentos
    if (this.fallbackHistory.length > 100) {
      this.fallbackHistory = this.fallbackHistory.slice(-100);
    }
  }
}
