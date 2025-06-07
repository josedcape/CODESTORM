/**
 * VoiceCoordinator - Sistema de coordinación para servicios de voz
 * Previene conflictos entre reconocimiento y síntesis de voz
 * Gestiona acceso exclusivo a SpeechRecognition y SpeechSynthesis
 */

type ServiceType = 'native' | 'advanced' | 'synthesis';

interface ServiceState {
  hasAccess: boolean;
  isRecognitionActive: boolean;
  isSynthesisActive: boolean;
  lastActivity: number;
}

class VoiceCoordinator {
  private services: Map<ServiceType, ServiceState> = new Map();
  private currentActiveService: ServiceType | null = null;
  private debug = true;

  private static instance: VoiceCoordinator | null = null;

  private constructor() {
    // Inicializar estados de servicios
    this.services.set('native', {
      hasAccess: false,
      isRecognitionActive: false,
      isSynthesisActive: false,
      lastActivity: 0
    });

    this.services.set('advanced', {
      hasAccess: false,
      isRecognitionActive: false,
      isSynthesisActive: false,
      lastActivity: 0
    });

    this.services.set('synthesis', {
      hasAccess: false,
      isRecognitionActive: false,
      isSynthesisActive: false,
      lastActivity: 0
    });

    this.log('VoiceCoordinator inicializado con soporte para síntesis');
  }

  public static getInstance(): VoiceCoordinator {
    if (!VoiceCoordinator.instance) {
      VoiceCoordinator.instance = new VoiceCoordinator();
    }
    return VoiceCoordinator.instance;
  }

  /**
   * Solicitar acceso exclusivo al reconocimiento de voz
   */
  public requestAccess(serviceType: ServiceType): boolean {
    const currentState = this.services.get(serviceType);
    if (!currentState) {
      this.log(`Servicio ${serviceType} no reconocido`);
      return false;
    }

    // Si ya tiene acceso, permitir
    if (currentState.hasAccess) {
      this.log(`${serviceType} ya tiene acceso`);
      return true;
    }

    // Verificar si otro servicio está activo
    if (serviceType === 'synthesis') {
      // La síntesis puede coexistir con reconocimiento, pero verificar conflictos
      const nativeState = this.services.get('native');
      const advancedState = this.services.get('advanced');

      // Permitir síntesis si no hay reconocimiento activo o si es compatible
      if ((nativeState?.isRecognitionActive || advancedState?.isRecognitionActive)) {
        this.log(`⚠️ Síntesis solicitada mientras reconocimiento está activo`);
        // Permitir pero con advertencia
      }
    } else {
      // Para reconocimiento, verificar otros servicios de reconocimiento
      const otherService: ServiceType = serviceType === 'native' ? 'advanced' : 'native';
      const otherState = this.services.get(otherService);

      if (otherState?.hasAccess && otherState.isRecognitionActive) {
        this.log(`Acceso denegado a ${serviceType}. ${otherService} está activo`);
        return false;
      }
    }

    // Conceder acceso
    currentState.hasAccess = true;
    currentState.lastActivity = Date.now();
    this.currentActiveService = serviceType;

    this.log(`Acceso concedido a ${serviceType}`);
    return true;
  }

  /**
   * Liberar acceso al reconocimiento de voz
   */
  public releaseAccess(serviceType: ServiceType): void {
    const currentState = this.services.get(serviceType);
    if (!currentState) {
      this.log(`Servicio ${serviceType} no reconocido`);
      return;
    }

    currentState.hasAccess = false;
    currentState.isRecognitionActive = false;
    currentState.lastActivity = Date.now();

    if (this.currentActiveService === serviceType) {
      this.currentActiveService = null;
    }

    this.log(`Acceso liberado por ${serviceType}`);
  }

  /**
   * Verificar si un servicio puede usar el reconocimiento
   */
  public canUseRecognition(serviceType: ServiceType): boolean {
    const currentState = this.services.get(serviceType);
    if (!currentState) {
      this.log(`Servicio ${serviceType} no reconocido`);
      return false;
    }

    // Debe tener acceso y no debe haber otro servicio con reconocimiento activo
    if (!currentState.hasAccess) {
      this.log(`${serviceType} no tiene acceso`);
      return false;
    }

    // Verificar si otro servicio tiene reconocimiento activo
    const otherService: ServiceType = serviceType === 'native' ? 'advanced' : 'native';
    const otherState = this.services.get(otherService);

    if (otherState?.isRecognitionActive) {
      this.log(`${serviceType} no puede usar reconocimiento: ${otherService} está activo`);
      return false;
    }

    return true;
  }

  /**
   * Marcar reconocimiento como activo
   */
  public markRecognitionActive(serviceType: ServiceType): boolean {
    const currentState = this.services.get(serviceType);
    if (!currentState) {
      this.log(`Servicio ${serviceType} no reconocido`);
      return false;
    }

    if (!currentState.hasAccess) {
      this.log(`${serviceType} no tiene acceso para activar reconocimiento`);
      return false;
    }

    // Verificar si otro servicio ya tiene reconocimiento activo
    const otherService: ServiceType = serviceType === 'native' ? 'advanced' : 'native';
    const otherState = this.services.get(otherService);

    if (otherState?.isRecognitionActive) {
      this.log(`No se puede activar ${serviceType}: ${otherService} ya está activo`);
      return false;
    }

    currentState.isRecognitionActive = true;
    currentState.lastActivity = Date.now();

    this.log(`Reconocimiento marcado como activo para ${serviceType}`);
    return true;
  }

  /**
   * Marcar reconocimiento como inactivo
   */
  public markRecognitionInactive(serviceType: ServiceType): void {
    const currentState = this.services.get(serviceType);
    if (!currentState) {
      this.log(`Servicio ${serviceType} no reconocido`);
      return;
    }

    currentState.isRecognitionActive = false;
    currentState.lastActivity = Date.now();

    this.log(`Reconocimiento marcado como inactivo para ${serviceType}`);
  }

  /**
   * Marcar síntesis como activa
   */
  public markSynthesisActive(serviceType: ServiceType = 'synthesis'): boolean {
    const currentState = this.services.get(serviceType);
    if (!currentState || !currentState.hasAccess) {
      this.log(`${serviceType} no tiene acceso para síntesis`);
      return false;
    }

    currentState.isSynthesisActive = true;
    currentState.lastActivity = Date.now();
    this.currentActiveService = serviceType;
    this.log(`${serviceType} síntesis marcada como activa`);
    return true;
  }

  /**
   * Marcar síntesis como inactiva
   */
  public markSynthesisInactive(serviceType: ServiceType = 'synthesis'): void {
    const currentState = this.services.get(serviceType);
    if (currentState) {
      currentState.isSynthesisActive = false;
      currentState.lastActivity = Date.now();
      this.log(`${serviceType} síntesis marcada como inactiva`);

      // Si no hay servicios activos, limpiar servicio activo actual
      if (!this.hasActiveServices()) {
        this.currentActiveService = null;
      }
    }
  }

  /**
   * Verificar si hay servicios activos
   */
  private hasActiveServices(): boolean {
    for (const [, state] of this.services) {
      if (state.isRecognitionActive || state.isSynthesisActive) {
        return true;
      }
    }
    return false;
  }

  /**
   * Obtener estado actual de los servicios
   */
  public getServicesState(): Record<ServiceType, ServiceState> {
    const state: Record<ServiceType, ServiceState> = {} as any;

    this.services.forEach((serviceState, serviceType) => {
      state[serviceType] = { ...serviceState };
    });

    return state;
  }

  /**
   * Obtener servicio activo actual
   */
  public getCurrentActiveService(): ServiceType | null {
    return this.currentActiveService;
  }

  /**
   * Forzar liberación de todos los servicios (para debugging)
   */
  public forceReleaseAll(): void {
    this.log('Forzando liberación de todos los servicios');

    this.services.forEach((state, serviceType) => {
      state.hasAccess = false;
      state.isRecognitionActive = false;
      state.lastActivity = Date.now();
    });

    this.currentActiveService = null;
  }

  /**
   * Logging condicional
   */
  private log(message: string): void {
    if (this.debug) {
      console.log(`[VoiceCoordinator] ${message}`);
    }
  }

  /**
   * Habilitar/deshabilitar debug
   */
  public setDebug(enabled: boolean): void {
    this.debug = enabled;
  }

  /**
   * Obtener información de debug
   */
  public getDebugInfo(): string {
    const state = this.getServicesState();
    const info = [
      `Servicio activo: ${this.currentActiveService || 'ninguno'}`,
      `Native - Acceso: ${state.native.hasAccess}, Reconocimiento: ${state.native.isRecognitionActive}, Síntesis: ${state.native.isSynthesisActive}`,
      `Advanced - Acceso: ${state.advanced.hasAccess}, Reconocimiento: ${state.advanced.isRecognitionActive}, Síntesis: ${state.advanced.isSynthesisActive}`,
      `Synthesis - Acceso: ${state.synthesis.hasAccess}, Síntesis: ${state.synthesis.isSynthesisActive}`
    ];

    return info.join('\n');
  }
}

// Exportar instancia singleton
export const voiceCoordinator = VoiceCoordinator.getInstance();
