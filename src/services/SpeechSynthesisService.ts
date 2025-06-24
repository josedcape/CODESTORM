/**
 * Servicio de Síntesis de Voz Nativa para CODESTORM
 * Proporciona síntesis de voz robusta con configuración optimizada para español
 * Integrado con VoiceCoordinator para evitar conflictos
 */

import { voiceCoordinator } from './VoiceCoordinator';

export interface SpeechConfig {
  voice?: SpeechSynthesisVoice | null;
  rate?: number; // 0.1 - 10
  pitch?: number; // 0 - 2
  volume?: number; // 0 - 1
  language?: string;
  autoPlay?: boolean;
  enableHighlight?: boolean;
}

export interface SpeechQueueItem {
  id: string;
  text: string;
  config: Required<SpeechConfig>;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onHighlight?: (charIndex: number, charLength: number) => void;
}

export type SpeechState = 'idle' | 'speaking' | 'paused' | 'error' | 'loading';

export interface SpeechStatus {
  state: SpeechState;
  currentItem: SpeechQueueItem | null;
  queueLength: number;
  progress: number; // 0-100
  currentCharIndex: number;
}

class SpeechSynthesisService {
  private static instance: SpeechSynthesisService | null = null;
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private queue: SpeechQueueItem[] = [];
  private currentItem: SpeechQueueItem | null = null;
  private state: SpeechState = 'idle';
  private voices: SpeechSynthesisVoice[] = [];
  private preferredVoice: SpeechSynthesisVoice | null = null;
  private isInitialized = false;
  private debug = true;
  private listeners: Set<(status: SpeechStatus) => void> = new Set();

  // Configuración por defecto optimizada para español
  private defaultConfig: Required<SpeechConfig> = {
    voice: null,
    rate: 0.9, // Velocidad ligeramente más lenta para mejor comprensión
    pitch: 1.0, // Tono natural
    volume: 0.8, // Volumen moderado
    language: 'es-ES',
    autoPlay: false,
    enableHighlight: true
  };

  private constructor() {
    this.synthesis = window.speechSynthesis;
    this.log('SpeechSynthesisService inicializado');
  }

  public static getInstance(): SpeechSynthesisService {
    if (!SpeechSynthesisService.instance) {
      SpeechSynthesisService.instance = new SpeechSynthesisService();
    }
    return SpeechSynthesisService.instance;
  }

  /**
   * Inicializar el servicio
   */
  public async initialize(): Promise<boolean> {
    try {
      this.log('Inicializando servicio de síntesis de voz...');

      // Verificar soporte
      if (!this.synthesis) {
        throw new Error('SpeechSynthesis no está soportado en este navegador');
      }

      // Cargar voces
      await this.loadVoices();

      // Seleccionar voz preferida
      this.selectPreferredVoice();

      // Configurar eventos globales
      this.setupGlobalEvents();

      this.isInitialized = true;
      this.setState('idle');
      this.log('✅ Servicio de síntesis de voz inicializado correctamente');

      return true;
    } catch (error) {
      this.log('❌ Error al inicializar síntesis de voz:', error);
      this.setState('error');
      return false;
    }
  }

  /**
   * Cargar voces disponibles
   */
  private async loadVoices(): Promise<void> {
    return new Promise((resolve) => {
      const loadVoicesImpl = () => {
        this.voices = this.synthesis.getVoices();
        this.log(`Voces cargadas: ${this.voices.length}`);

        if (this.voices.length > 0) {
          resolve();
        } else {
          // Algunas veces las voces no están disponibles inmediatamente
          setTimeout(loadVoicesImpl, 100);
        }
      };

      // Escuchar evento de voces cargadas
      this.synthesis.onvoiceschanged = loadVoicesImpl;

      // Intentar cargar inmediatamente
      loadVoicesImpl();
    });
  }

  /**
   * Seleccionar voz preferida para español
   */
  private selectPreferredVoice(): void {
    // Buscar voces en español por orden de preferencia
    const spanishVoicePreferences = [
      'es-ES', 'es-MX', 'es-AR', 'es-CO', 'es-CL', 'es-PE', 'es-VE'
    ];

    for (const langCode of spanishVoicePreferences) {
      const voice = this.voices.find(v =>
        v.lang.startsWith(langCode) && v.localService
      );

      if (voice) {
        this.preferredVoice = voice;
        this.defaultConfig.voice = voice;
        this.log(`Voz preferida seleccionada: ${voice.name} (${voice.lang})`);
        return;
      }
    }

    // Fallback: cualquier voz en español
    const anySpanishVoice = this.voices.find(v => v.lang.startsWith('es'));
    if (anySpanishVoice) {
      this.preferredVoice = anySpanishVoice;
      this.defaultConfig.voice = anySpanishVoice;
      this.log(`Voz fallback seleccionada: ${anySpanishVoice.name} (${anySpanishVoice.lang})`);
    } else {
      this.log('⚠️ No se encontraron voces en español');
    }
  }

  /**
   * Configurar eventos globales
   */
  private setupGlobalEvents(): void {
    // Pausar síntesis cuando se pierde el foco
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'speaking') {
        this.pause();
      }
    });

    // Detener síntesis al cerrar la página
    window.addEventListener('beforeunload', () => {
      this.stop();
    });
  }

  /**
   * Añadir texto a la cola de síntesis
   */
  public speak(text: string, config: Partial<SpeechConfig> = {}): string {
    if (!this.isInitialized) {
      this.log('⚠️ Servicio no inicializado');
      return '';
    }

    const id = `speech_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const finalConfig = { ...this.defaultConfig, ...config };

    const item: SpeechQueueItem = {
      id,
      text: text.trim(),
      config: finalConfig,
      onStart: config.onStart,
      onEnd: config.onEnd,
      onError: config.onError,
      onHighlight: config.onHighlight
    };

    this.queue.push(item);
    this.log(`Texto añadido a la cola: "${text.substring(0, 50)}..."`);

    // Procesar cola si está inactiva
    if (this.state === 'idle') {
      this.processQueue();
    }

    this.notifyListeners();
    return id;
  }

  /**
   * Procesar cola de síntesis
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0 || this.state === 'speaking') {
      return;
    }

    // Solicitar acceso al coordinador de voz
    if (!voiceCoordinator.requestAccess('synthesis')) {
      this.log('⚠️ No se pudo obtener acceso para síntesis de voz');
      return;
    }

    // Marcar síntesis como activa
    voiceCoordinator.markSynthesisActive('synthesis');

    const item = this.queue.shift()!;
    this.currentItem = item;
    this.setState('speaking');

    try {
      await this.speakItem(item);
    } catch (error) {
      this.log('❌ Error al reproducir:', error);
      this.setState('error');
      item.onError?.(error instanceof Error ? error.message : 'Error desconocido');
    }

    // Continuar con el siguiente elemento
    this.currentItem = null;
    voiceCoordinator.markSynthesisInactive('synthesis');
    voiceCoordinator.releaseAccess('synthesis');

    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 100);
    } else {
      this.setState('idle');
    }

    this.notifyListeners();
  }

  /**
   * Reproducir un elemento específico
   */
  private async speakItem(item: SpeechQueueItem): Promise<void> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(item.text);

      // Configurar utterance
      utterance.voice = item.config.voice;
      utterance.rate = item.config.rate;
      utterance.pitch = item.config.pitch;
      utterance.volume = item.config.volume;
      utterance.lang = item.config.language;

      // Eventos
      utterance.onstart = () => {
        this.log(`🔊 Iniciando síntesis: "${item.text.substring(0, 30)}..."`);
        item.onStart?.();
        this.notifyListeners();
      };

      utterance.onend = () => {
        this.log(`✅ Síntesis completada`);
        item.onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.log(`❌ Error en síntesis:`, event.error);
        reject(new Error(event.error));
      };

      // Resaltado de texto (si está habilitado)
      if (item.config.enableHighlight) {
        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            item.onHighlight?.(event.charIndex, event.charLength || 1);
          }
        };
      }

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  /**
   * Pausar síntesis
   */
  public pause(): void {
    if (this.state === 'speaking') {
      this.synthesis.pause();
      this.setState('paused');
      this.log('⏸️ Síntesis pausada');
      this.notifyListeners();
    }
  }

  /**
   * Reanudar síntesis
   */
  public resume(): void {
    if (this.state === 'paused') {
      this.synthesis.resume();
      this.setState('speaking');
      this.log('▶️ Síntesis reanudada');
      this.notifyListeners();
    }
  }

  /**
   * Detener síntesis
   */
  public stop(): void {
    this.synthesis.cancel();
    this.queue = [];
    this.currentItem = null;
    this.currentUtterance = null;
    this.setState('idle');
    voiceCoordinator.markSynthesisInactive('synthesis');
    voiceCoordinator.releaseAccess('synthesis');
    this.log('⏹️ Síntesis detenida');
    this.notifyListeners();
  }

  /**
   * Obtener estado actual
   */
  public getStatus(): SpeechStatus {
    return {
      state: this.state,
      currentItem: this.currentItem,
      queueLength: this.queue.length,
      progress: this.calculateProgress(),
      currentCharIndex: 0 // TODO: Implementar seguimiento de caracteres
    };
  }

  /**
   * Calcular progreso
   */
  private calculateProgress(): number {
    if (!this.currentItem || this.state !== 'speaking') {
      return 0;
    }
    // TODO: Implementar cálculo de progreso más preciso
    return 50;
  }

  /**
   * Obtener voces disponibles
   */
  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  /**
   * Obtener voces en español
   */
  public getSpanishVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang.startsWith('es'));
  }

  /**
   * Establecer voz preferida
   */
  public setPreferredVoice(voice: SpeechSynthesisVoice): void {
    this.preferredVoice = voice;
    this.defaultConfig.voice = voice;
    this.log(`Voz preferida cambiada a: ${voice.name} (${voice.lang})`);
  }

  /**
   * Actualizar configuración por defecto
   */
  public updateDefaultConfig(config: Partial<SpeechConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
    this.log('Configuración por defecto actualizada');
  }

  /**
   * Suscribirse a cambios de estado
   */
  public subscribe(listener: (status: SpeechStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Cambiar estado y notificar
   */
  private setState(newState: SpeechState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.log(`Estado cambiado a: ${newState}`);
    }
  }

  /**
   * Notificar a los listeners
   */
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        this.log('Error en listener:', error);
      }
    });
  }

  /**
   * Logging condicional
   */
  private log(message: string, ...args: any[]): void {
    if (this.debug) {
      console.log(`[SpeechSynthesisService] ${message}`, ...args);
    }
  }

  /**
   * Habilitar/deshabilitar debug
   */
  public setDebug(enabled: boolean): void {
    this.debug = enabled;
  }

  /**
   * Limpiar recursos
   */
  public cleanup(): void {
    this.stop();
    this.listeners.clear();
    this.isInitialized = false;
    this.log('🧹 Recursos de síntesis limpiados');
  }
}

// Exportar instancia singleton
export const speechSynthesisService = SpeechSynthesisService.getInstance();
