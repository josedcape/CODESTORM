import { ApprovalData } from '../types';

export interface ApprovalMonitorEvent {
  id: string;
  timestamp: number;
  type: 'approval_requested' | 'approval_attempted' | 'approval_failed' | 'approval_timeout' | 'approval_success';
  approvalId?: string;
  error?: string;
  metadata?: any;
}

export interface ApprovalHealthStatus {
  isHealthy: boolean;
  failureCount: number;
  lastFailureTime?: number;
  averageResponseTime: number;
  successRate: number;
  recommendations: string[];
}

class ApprovalMonitoringService {
  private static instance: ApprovalMonitoringService;
  private events: ApprovalMonitorEvent[] = [];
  private listeners: Array<(event: ApprovalMonitorEvent) => void> = [];
  private healthListeners: Array<(status: ApprovalHealthStatus) => void> = [];
  private approvalTimeouts: Map<string, NodeJS.Timeout> = new Map();
  
  private readonly MAX_EVENTS = 100;
  private readonly TIMEOUT_THRESHOLD = 15000; // 15 segundos
  private readonly FAILURE_THRESHOLD = 3;

  public static getInstance(): ApprovalMonitoringService {
    if (!ApprovalMonitoringService.instance) {
      ApprovalMonitoringService.instance = new ApprovalMonitoringService();
    }
    return ApprovalMonitoringService.instance;
  }

  /**
   * Registra un evento de monitoreo
   */
  public recordEvent(type: ApprovalMonitorEvent['type'], approvalId?: string, error?: string, metadata?: any): void {
    const event: ApprovalMonitorEvent = {
      id: `event-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type,
      approvalId,
      error,
      metadata
    };

    // Añadir evento y mantener solo los últimos MAX_EVENTS
    this.events.push(event);
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Notificar a los listeners
    this.listeners.forEach(listener => listener(event));

    // Actualizar estado de salud
    this.updateHealthStatus();

    console.log(`📊 ApprovalMonitoring: ${type}`, { approvalId, error, metadata });
  }

  /**
   * Inicia el monitoreo de una solicitud de aprobación
   */
  public startMonitoring(approvalData: ApprovalData): void {
    this.recordEvent('approval_requested', approvalData.id, undefined, {
      type: approvalData.type,
      title: approvalData.title,
      itemCount: approvalData.items.length
    });

    // Configurar timeout para detectar aprobaciones que no se procesan
    const timeoutId = setTimeout(() => {
      this.recordEvent('approval_timeout', approvalData.id, 'La aprobación no se procesó en el tiempo esperado');
      this.approvalTimeouts.delete(approvalData.id);
    }, this.TIMEOUT_THRESHOLD);

    this.approvalTimeouts.set(approvalData.id, timeoutId);
  }

  /**
   * Registra un intento de aprobación
   */
  public recordApprovalAttempt(approvalId: string, metadata?: any): void {
    this.recordEvent('approval_attempted', approvalId, undefined, metadata);
  }

  /**
   * Registra un fallo de aprobación
   */
  public recordApprovalFailure(approvalId: string, error: string, metadata?: any): void {
    this.recordEvent('approval_failed', approvalId, error, metadata);
    
    // Limpiar timeout si existe
    const timeoutId = this.approvalTimeouts.get(approvalId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.approvalTimeouts.delete(approvalId);
    }
  }

  /**
   * Registra una aprobación exitosa
   */
  public recordApprovalSuccess(approvalId: string, responseTime?: number, metadata?: any): void {
    this.recordEvent('approval_success', approvalId, undefined, {
      responseTime,
      ...metadata
    });

    // Limpiar timeout si existe
    const timeoutId = this.approvalTimeouts.get(approvalId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.approvalTimeouts.delete(approvalId);
    }
  }

  /**
   * Obtiene el estado de salud del sistema de aprobación
   */
  public getHealthStatus(): ApprovalHealthStatus {
    const recentEvents = this.events.filter(e => Date.now() - e.timestamp < 300000); // Últimos 5 minutos
    const failures = recentEvents.filter(e => e.type === 'approval_failed' || e.type === 'approval_timeout');
    const successes = recentEvents.filter(e => e.type === 'approval_success');
    const attempts = recentEvents.filter(e => e.type === 'approval_attempted');

    const failureCount = failures.length;
    const totalAttempts = attempts.length;
    const successRate = totalAttempts > 0 ? (successes.length / totalAttempts) * 100 : 100;

    // Calcular tiempo promedio de respuesta
    const responseTimes = successes
      .map(e => e.metadata?.responseTime)
      .filter(time => typeof time === 'number');
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    const isHealthy = failureCount < this.FAILURE_THRESHOLD && successRate > 70;
    const lastFailure = failures[failures.length - 1];

    // Generar recomendaciones
    const recommendations: string[] = [];
    
    if (failureCount >= this.FAILURE_THRESHOLD) {
      recommendations.push('Activar sistema robusto de aprobación');
      recommendations.push('Verificar conectividad y estado del orquestrador');
    }
    
    if (successRate < 50) {
      recommendations.push('Considerar usar aprobación manual por comandos');
      recommendations.push('Revisar logs del sistema para identificar problemas');
    }
    
    if (averageResponseTime > 10000) {
      recommendations.push('El sistema está respondiendo lentamente');
      recommendations.push('Considerar reiniciar el proceso de aprobación');
    }

    if (recentEvents.some(e => e.type === 'approval_timeout')) {
      recommendations.push('Se detectaron timeouts en aprobaciones');
      recommendations.push('Usar función de forzar aprobación si es necesario');
    }

    return {
      isHealthy,
      failureCount,
      lastFailureTime: lastFailure?.timestamp,
      averageResponseTime,
      successRate,
      recommendations
    };
  }

  /**
   * Actualiza y notifica el estado de salud
   */
  private updateHealthStatus(): void {
    const status = this.getHealthStatus();
    this.healthListeners.forEach(listener => listener(status));
  }

  /**
   * Obtiene eventos recientes
   */
  public getRecentEvents(limit: number = 20): ApprovalMonitorEvent[] {
    return this.events.slice(-limit).reverse();
  }

  /**
   * Obtiene estadísticas del sistema
   */
  public getStatistics() {
    const last24h = this.events.filter(e => Date.now() - e.timestamp < 86400000); // 24 horas
    
    return {
      totalEvents: this.events.length,
      eventsLast24h: last24h.length,
      failuresLast24h: last24h.filter(e => e.type === 'approval_failed').length,
      timeoutsLast24h: last24h.filter(e => e.type === 'approval_timeout').length,
      successesLast24h: last24h.filter(e => e.type === 'approval_success').length,
      averageResponseTime: this.getHealthStatus().averageResponseTime,
      successRate: this.getHealthStatus().successRate
    };
  }

  /**
   * Añade un listener para eventos
   */
  public addEventListener(listener: (event: ApprovalMonitorEvent) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remueve un listener de eventos
   */
  public removeEventListener(listener: (event: ApprovalMonitorEvent) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Añade un listener para el estado de salud
   */
  public addHealthListener(listener: (status: ApprovalHealthStatus) => void): void {
    this.healthListeners.push(listener);
  }

  /**
   * Remueve un listener del estado de salud
   */
  public removeHealthListener(listener: (status: ApprovalHealthStatus) => void): void {
    this.healthListeners = this.healthListeners.filter(l => l !== listener);
  }

  /**
   * Limpia todos los eventos y reinicia el monitoreo
   */
  public reset(): void {
    this.events = [];
    
    // Limpiar todos los timeouts
    this.approvalTimeouts.forEach(timeout => clearTimeout(timeout));
    this.approvalTimeouts.clear();
    
    this.recordEvent('approval_requested', undefined, undefined, { action: 'system_reset' });
  }

  /**
   * Exporta los datos de monitoreo para debugging
   */
  public exportData() {
    return {
      events: this.events,
      healthStatus: this.getHealthStatus(),
      statistics: this.getStatistics(),
      activeTimeouts: Array.from(this.approvalTimeouts.keys()),
      timestamp: Date.now()
    };
  }
}

export default ApprovalMonitoringService;
