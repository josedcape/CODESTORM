/**
 * Servicio Unificado de Reconocimiento de Voz para CODESTORM
 * Proporciona una interfaz consistente para todas las funcionalidades de voz
 * Optimizado para español con coordinación centralizada
 */

import { voiceCoordinator } from './VoiceCoordinator';

export type VoiceState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error'
  | 'disabled'
  | 'initializing'
  | 'ready';

export interface VoiceConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  timeout?: number;
  enableDebug?: boolean;
  componentName?: string;
}

export interface VoiceCallbacks {
  onTranscript?: (transcript: string) => void;
  onFinalTranscript?: (transcript: string) => void;
  onStateChange?: (state: VoiceState) => void;
  onError?: (error: string) => void;
}

export interface VoicePermissions {
  microphone: boolean;
  speechRecognition: boolean;
}

class UnifiedVoiceService {
  private static instance: UnifiedVoiceService | null = null;
  private recognition: SpeechRecognition | null = null;
  private isInitialized = false;
  private currentState: VoiceState = 'idle';
  private currentConfig: VoiceConfig = {};
  private currentCallbacks: VoiceCallbacks = {};
  private activeComponents: Set<string> = new Set();
  private timeoutRef: NodeJS.Timeout | null = null;
  private debug = true;

  // Configuración por defecto optimizada específicamente para español
  private defaultConfig: Required<VoiceConfig> = {
    language: 'es-ES', // Español de España como idioma principal
    continuous: false, // Cambiar a false para mejor precisión en comandos cortos
    interimResults: false, // Cambiar a false para evitar transcripciones parciales incorrectas
    maxAlternatives: 3, // Aumentar para tener más opciones de transcripción
    timeout: 10000, // Reducir timeout para comandos más cortos
    enableDebug: true,
    componentName: 'UnifiedVoiceService'
  };

  // Diccionario de palabras comunes en español para validación
  private spanishWords = new Set([
    'hola', 'adiós', 'gracias', 'por favor', 'sí', 'no', 'buenos días', 'buenas tardes', 'buenas noches',
    'cómo', 'qué', 'cuándo', 'dónde', 'por qué', 'quién', 'cuál', 'cuánto',
    'crear', 'generar', 'hacer', 'construir', 'desarrollar', 'programar', 'codificar',
    'página', 'web', 'aplicación', 'proyecto', 'archivo', 'código', 'función',
    'ayuda', 'asistente', 'comando', 'instrucción', 'tarea', 'trabajo',
    'abrir', 'cerrar', 'guardar', 'cargar', 'ejecutar', 'correr', 'parar',
    'rojo', 'azul', 'verde', 'amarillo', 'negro', 'blanco', 'gris',
    'grande', 'pequeño', 'nuevo', 'viejo', 'rápido', 'lento', 'fácil', 'difícil'
  ]);

  // Patrones de palabras en inglés que deben ser rechazadas
  private englishPatterns = [
    /\b(hello|hi|bye|goodbye|thanks|thank you|yes|no|good morning|good afternoon|good evening)\b/i,
    /\b(travel|hotel|flight|booking|reservation|vacation|holiday)\b/i,
    /\b(create|generate|make|build|develop|program|code)\b/i,
    /\b(page|website|application|project|file|function)\b/i,
    /\b(help|assistant|command|instruction|task|work)\b/i,
    /\b(open|close|save|load|run|execute|stop)\b/i,
    /\b(red|blue|green|yellow|black|white|gray)\b/i,
    /\b(big|small|new|old|fast|slow|easy|hard)\b/i
  ];

  private constructor() {
    this.log('UnifiedVoiceService inicializado');
  }

  public static getInstance(): UnifiedVoiceService {
    if (!UnifiedVoiceService.instance) {
      UnifiedVoiceService.instance = new UnifiedVoiceService();
    }
    return UnifiedVoiceService.instance;
  }

  /**
   * Verificar permisos necesarios
   */
  public async checkPermissions(): Promise<VoicePermissions> {
    const permissions: VoicePermissions = {
      microphone: false,
      speechRecognition: false
    };

    // Verificar soporte de Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    permissions.speechRecognition = !!SpeechRecognition;

    // Verificar permisos de micrófono de manera más permisiva
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Intentar verificar permisos sin solicitar acceso inmediato
        if (navigator.permissions) {
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            permissions.microphone = permissionStatus.state === 'granted' || permissionStatus.state === 'prompt';
          } catch (permError) {
            // Si no se puede verificar permisos, asumir que están disponibles
            this.log('No se pudo verificar permisos específicos, asumiendo disponibilidad');
            permissions.microphone = true;
          }
        } else {
          // Si no hay API de permisos, asumir que están disponibles
          permissions.microphone = true;
        }
      } else {
        this.log('getUserMedia no está disponible');
        permissions.microphone = false;
      }
    } catch (error) {
      this.log('Error al verificar permisos de micrófono:', error);
      // En caso de error, ser permisivo y permitir que el usuario intente usar la funcionalidad
      permissions.microphone = true;
    }

    return permissions;
  }

  /**
   * Inicializar el servicio con configuración específica
   */
  public async initialize(config: VoiceConfig = {}, callbacks: VoiceCallbacks = {}): Promise<boolean> {
    try {
      this.setState('initializing');
      this.log('Inicializando servicio unificado de voz...');

      // Verificar permisos
      const permissions = await this.checkPermissions();
      if (!permissions.speechRecognition) {
        throw new Error('Speech Recognition no está soportado en este navegador');
      }

      // Solo advertir sobre permisos de micrófono, no fallar
      if (!permissions.microphone) {
        this.log('⚠️ Permisos de micrófono no verificados, se solicitarán cuando sea necesario');
      }

      // Solicitar acceso exclusivo
      if (!voiceCoordinator.requestAccess('advanced')) {
        throw new Error('No se pudo obtener acceso exclusivo al reconocimiento de voz');
      }

      // Configurar servicio
      this.currentConfig = { ...this.defaultConfig, ...config };
      this.currentCallbacks = callbacks;
      this.debug = this.currentConfig.enableDebug!;

      // Crear instancia de reconocimiento
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      // Configurar reconocimiento
      this.setupRecognition();

      this.isInitialized = true;
      this.setState('ready');
      this.log('✅ Servicio unificado de voz inicializado correctamente');

      return true;
    } catch (error) {
      const errorMessage = `Error al inicializar: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      this.log('❌ Error de inicialización:', error);
      this.setState('error');
      this.triggerCallback('onError', errorMessage);
      voiceCoordinator.releaseAccess('advanced');
      return false;
    }
  }

  /**
   * Configurar el reconocimiento de voz
   */
  private setupRecognition(): void {
    if (!this.recognition) return;

    const config = this.currentConfig;

    // Configuración básica
    this.recognition.lang = config.language!;
    this.recognition.continuous = config.continuous!;
    this.recognition.interimResults = config.interimResults!;
    this.recognition.maxAlternatives = config.maxAlternatives!;

    // Event handlers
    this.recognition.onstart = () => {
      this.log('🎤 Reconocimiento iniciado');

      if (!voiceCoordinator.markRecognitionActive('advanced')) {
        this.log('⚠️ No se pudo marcar reconocimiento como activo');
        this.recognition?.stop();
        return;
      }

      this.setState('listening');
      this.setupTimeout();
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript;
          this.log('📝 Transcripción final:', transcript);
          this.triggerCallback('onFinalTranscript', finalTranscript);
        } else {
          interimTranscript += transcript;
          this.log('📝 Transcripción intermedia:', transcript);
          this.triggerCallback('onTranscript', interimTranscript);
        }
      }
    };

    this.recognition.onerror = (event) => {
      const errorMessage = `Error de reconocimiento: ${event.error}`;
      this.log('❌ Error:', event);

      // Manejar diferentes tipos de errores
      if (event.error === 'not-allowed') {
        this.log('⚠️ Permisos de micrófono denegados por el usuario');
        this.triggerCallback('onError', 'Permisos de micrófono denegados. Por favor, permite el acceso al micrófono.');
      } else if (event.error === 'no-speech') {
        this.log('⚠️ No se detectó habla');
        // No tratar como error crítico, solo reiniciar
      } else if (event.error === 'network') {
        this.log('⚠️ Error de red en reconocimiento de voz');
        this.triggerCallback('onError', 'Error de conexión. Verifica tu conexión a internet.');
      } else {
        this.triggerCallback('onError', errorMessage);
      }

      voiceCoordinator.markRecognitionInactive('advanced');

      // Solo cambiar a estado de error para errores críticos
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this.setState('error');
      } else {
        this.setState('idle');
      }

      this.clearTimeout();
    };

    this.recognition.onend = () => {
      this.log('🛑 Reconocimiento terminado');
      voiceCoordinator.markRecognitionInactive('advanced');
      this.setState('idle');
      this.clearTimeout();
    };
  }

  /**
   * Iniciar escucha
   */
  public startListening(componentName?: string): boolean {
    if (!this.isInitialized || !this.recognition) {
      this.log('⚠️ Servicio no inicializado');
      return false;
    }

    if (this.currentState === 'listening') {
      this.log('⚠️ Ya está escuchando');
      return false;
    }

    if (!voiceCoordinator.canUseRecognition('advanced')) {
      this.log('⚠️ No se puede usar reconocimiento: otro servicio está activo');
      this.triggerCallback('onError', 'Otro servicio de voz está activo');
      return false;
    }

    try {
      if (componentName) {
        this.activeComponents.add(componentName);
      }

      this.log(`🎤 Iniciando escucha${componentName ? ` para ${componentName}` : ''}...`);
      this.recognition.start();
      return true;
    } catch (error) {
      const errorMessage = `Error al iniciar escucha: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      this.log('❌ Error al iniciar:', error);
      this.triggerCallback('onError', errorMessage);
      return false;
    }
  }

  /**
   * Detener escucha
   */
  public stopListening(componentName?: string): void {
    if (!this.recognition) {
      this.log('⚠️ No hay reconocimiento para detener');
      return;
    }

    if (componentName) {
      this.activeComponents.delete(componentName);
    }

    try {
      this.log(`🛑 Deteniendo escucha${componentName ? ` para ${componentName}` : ''}...`);
      this.recognition.stop();
      this.clearTimeout();
    } catch (error) {
      this.log('❌ Error al detener:', error);
    }
  }

  /**
   * Obtener estado actual
   */
  public getState(): VoiceState {
    return this.currentState;
  }

  /**
   * Verificar si está escuchando
   */
  public isListening(): boolean {
    return this.currentState === 'listening';
  }

  /**
   * Verificar si está inicializado
   */
  public isReady(): boolean {
    return this.isInitialized && this.currentState !== 'error';
  }

  /**
   * Limpiar y liberar recursos
   */
  public cleanup(): void {
    this.log('🧹 Limpiando servicio unificado de voz...');

    this.clearTimeout();

    if (this.recognition && this.currentState === 'listening') {
      try {
        this.recognition.stop();
      } catch (error) {
        this.log('Error al detener reconocimiento durante cleanup:', error);
      }
    }

    voiceCoordinator.releaseAccess('advanced');
    this.activeComponents.clear();
    this.setState('idle');
    this.isInitialized = false;
    this.recognition = null;
  }

  /**
   * Reinicializar el servicio
   */
  public async reinitialize(): Promise<boolean> {
    this.log('🔄 Reinicializando servicio de voz...');

    // Limpiar estado actual
    this.cleanup();

    // Esperar un momento antes de reinicializar
    await new Promise(resolve => setTimeout(resolve, 500));

    // Reinicializar con la configuración actual
    return this.initialize(this.currentConfig, this.currentCallbacks);
  }

  /**
   * Configurar timeout
   */
  private setupTimeout(): void {
    this.clearTimeout();

    if (this.currentConfig.timeout! > 0) {
      this.timeoutRef = setTimeout(() => {
        this.log('⏰ Timeout alcanzado, deteniendo reconocimiento');
        this.stopListening();
      }, this.currentConfig.timeout!);
    }
  }

  /**
   * Limpiar timeout
   */
  private clearTimeout(): void {
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
      this.timeoutRef = null;
    }
  }

  /**
   * Cambiar estado y notificar
   */
  private setState(newState: VoiceState): void {
    if (this.currentState !== newState) {
      this.currentState = newState;
      this.triggerCallback('onStateChange', newState);
    }
  }

  /**
   * Ejecutar callback si existe
   */
  private triggerCallback(callbackName: keyof VoiceCallbacks, ...args: any[]): void {
    const callback = this.currentCallbacks[callbackName];
    if (callback) {
      (callback as any)(...args);
    }
  }

  /**
   * Logging condicional
   */
  private log(message: string, ...args: any[]): void {
    if (this.debug) {
      console.log(`[UnifiedVoiceService] ${message}`, ...args);
    }
  }

  /**
   * Obtener información de debug
   */
  public getDebugInfo(): string {
    const info = [
      `Estado: ${this.currentState}`,
      `Inicializado: ${this.isInitialized}`,
      `Componentes activos: ${Array.from(this.activeComponents).join(', ') || 'ninguno'}`,
      `Configuración: ${JSON.stringify(this.currentConfig, null, 2)}`,
      voiceCoordinator.getDebugInfo()
    ];

    return info.join('\n');
  }
}

// Exportar instancia singleton
export const unifiedVoiceService = UnifiedVoiceService.getInstance();
