/**
 * Servicio de Reconocimiento de Voz Nativo para CODESTORM
 * Reemplaza Annyang.js con webkitSpeechRecognition nativo
 * Optimizado para español con detección de comandos STORM
 */

import { voiceCoordinator } from './VoiceCoordinator';
export interface VoiceRecognitionSettings {
  enabled: boolean;
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  stormCommandEnabled: boolean;
  autoSend: boolean;
  debug: boolean;
}

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives: string[];
}

export interface VoiceRecognitionEvent {
  type: 'start' | 'end' | 'result' | 'error' | 'storm-detected';
  data?: any;
  timestamp: number;
}

export type VoiceRecognitionListener = (event: VoiceRecognitionEvent) => void;

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

class NativeVoiceRecognitionService {
  private settings: VoiceRecognitionSettings;
  private listeners: VoiceRecognitionListener[] = [];
  private isInitialized: boolean = false;
  private isListening: boolean = false;
  private isStormListening: boolean = false;
  private autoListeningAfterStorm: boolean = false;
  private currentTranscript: string = '';

  // Instancias de reconocimiento
  private keywordRecognition: any = null;
  private mainRecognition: any = null;

  // Configuración de STORM - Palabras clave mejoradas para español
  private stormKeywords: string[] = [
    'storm', 'tormenta', 'codestorm', 'code storm',
    'estorm', 'torm', 'stor', 'hola', 'ola'
  ];
  private stormCommandCallback: ((command: string) => void) | null = null;
  private stormTimeout: NodeJS.Timeout | null = null;

  // Control de estado
  private keywordDetectionActive: boolean = false;
  private mainRecognitionActive: boolean = false;

  constructor() {
    this.settings = this.loadSettings();
    this.initialize();
  }

  /**
   * Inicializa el servicio de reconocimiento de voz nativo
   */
  private initialize(): void {
    if (!this.isWebSpeechSupported()) {
      console.warn('Web Speech API no está soportada en este navegador');
      return;
    }

    // Solicitar acceso al coordinador de voz
    if (!voiceCoordinator.requestAccess('native')) {
      if (this.settings.debug) {
        console.log('Servicio nativo no pudo obtener acceso - sistema avanzado está activo');
      }
      return;
    }
    this.initializeRecognitionInstances();
    this.isInitialized = true;

    if (this.settings.debug) {
      console.log('Servicio de reconocimiento de voz nativo inicializado correctamente');
    }
  }

  /**
   * Verifica si Web Speech API está soportada
   */
  private isWebSpeechSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  /**
   * Inicializa las instancias de reconocimiento
   */
  private initializeRecognitionInstances(): void {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // Reconocimiento para detección de palabras clave STORM
    this.keywordRecognition = new SpeechRecognition();
    this.setupKeywordRecognition();

    // Reconocimiento principal para comandos
    this.mainRecognition = new SpeechRecognition();
    this.setupMainRecognition();
  }

  /**
   * Configura el reconocimiento de palabras clave
   */
  private setupKeywordRecognition(): void {
    if (!this.keywordRecognition) return;

    // Configuración para detección continua de palabras clave
    this.keywordRecognition.lang = this.settings.language;
    this.keywordRecognition.continuous = true;
    this.keywordRecognition.interimResults = false;
    this.keywordRecognition.maxAlternatives = 1;

    // Eventos para detección de palabras clave
    this.keywordRecognition.onstart = () => {
      this.keywordDetectionActive = true;
      if (this.settings.debug) {
        console.log('Detección de palabras clave STORM iniciada');
      }
    };

    this.keywordRecognition.onresult = (event: any) => {
      this.handleKeywordRecognitionResult(event);
    };

    this.keywordRecognition.onend = () => {
      this.keywordDetectionActive = false;
      voiceCoordinator.markRecognitionInactive('native');
      if (this.settings.debug) {
        console.log('Detección de palabras clave terminada');
      }

      // Reiniciar automáticamente si está habilitado
      if (this.settings.stormCommandEnabled && !this.isStormListening) {
        setTimeout(() => {
          this.startKeywordDetection();
        }, 1000);
      }
    };

    this.keywordRecognition.onerror = (event: any) => {
      console.error('Error en detección de palabras clave:', event.error);
      this.keywordDetectionActive = false;
      voiceCoordinator.markRecognitionInactive('native');

      // Reintentar después de un error
      setTimeout(() => {
        if (this.settings.stormCommandEnabled) {
          this.startKeywordDetection();
        }
      }, 2000);
    };
  }

  /**
   * Configura el reconocimiento principal
   */
  private setupMainRecognition(): void {
    if (!this.mainRecognition) return;

    // Configuración para comandos principales
    this.mainRecognition.lang = this.settings.language;
    this.mainRecognition.continuous = false;
    this.mainRecognition.interimResults = false;
    this.mainRecognition.maxAlternatives = this.settings.maxAlternatives;

    // Eventos para reconocimiento principal
    this.mainRecognition.onstart = () => {
      this.isListening = true;
      this.mainRecognitionActive = true;
      this.emitEvent({ type: 'start', timestamp: Date.now() });

      if (this.settings.debug) {
        console.log('Reconocimiento principal iniciado');
      }
    };

    this.mainRecognition.onresult = (event: any) => {
      this.handleMainRecognitionResult(event);
    };

    this.mainRecognition.onend = () => {
      this.isListening = false;
      this.mainRecognitionActive = false;
      voiceCoordinator.markRecognitionInactive('native');
      this.emitEvent({ type: 'end', timestamp: Date.now() });

      if (this.settings.debug) {
        console.log('Reconocimiento principal terminado');
      }

      // Limpiar timeout de STORM si existe
      if (this.stormTimeout) {
        clearTimeout(this.stormTimeout);
        this.stormTimeout = null;
      }

      this.isStormListening = false;
      this.autoListeningAfterStorm = false;

      // Reiniciar detección de palabras clave
      if (this.settings.stormCommandEnabled) {
        setTimeout(() => {
          this.startKeywordDetection();
        }, 500);
      }
    };

    this.mainRecognition.onerror = (event: any) => {
      console.error('Error en reconocimiento principal:', event.error);
      this.isListening = false;
      this.mainRecognitionActive = false;
      voiceCoordinator.markRecognitionInactive('native');

      this.emitEvent({
        type: 'error',
        data: { error: event.error, message: 'Error en reconocimiento principal' },
        timestamp: Date.now()
      });

      // Reiniciar detección de palabras clave después de un error
      setTimeout(() => {
        if (this.settings.stormCommandEnabled) {
          this.startKeywordDetection();
        }
      }, 1000);
    };
  }

  /**
   * Maneja los resultados de detección de palabras clave
   */
  private handleKeywordRecognitionResult(event: any): void {
    const results = event.results;
    const lastResult = results[results.length - 1];

    if (lastResult.isFinal) {
      const transcript = lastResult[0].transcript.toLowerCase().trim();

      if (this.settings.debug) {
        console.log('Palabra detectada:', transcript);
      }

      // Verificar si contiene palabra clave STORM
      if (this.detectStormKeyword(transcript)) {
        this.handleStormDetection(transcript);
      }
    }
  }

  /**
   * Maneja los resultados del reconocimiento principal
   */
  private handleMainRecognitionResult(event: any): void {
    const results = event.results;
    const lastResult = results[results.length - 1];

    if (lastResult.isFinal) {
      const transcript = lastResult[0].transcript.trim();
      const confidence = lastResult[0].confidence || 1.0;

      this.currentTranscript = transcript;

      const result: VoiceRecognitionResult = {
        transcript,
        confidence,
        isFinal: true,
        alternatives: Array.from(lastResult).map((alt: any) => alt.transcript)
      };

      if (this.settings.debug) {
        console.log('Comando reconocido:', transcript);
      }

      // Si estamos en modo STORM, procesar como comando
      if (this.isStormListening && this.stormCommandCallback) {
        this.stormCommandCallback(transcript);

        this.emitEvent({
          type: 'storm-detected',
          data: {
            transcript,
            command: transcript,
            autoSend: true
          },
          timestamp: Date.now()
        });
      } else {
        // Emitir como resultado normal
        this.emitEvent({
          type: 'result',
          data: result,
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * Detecta si el texto contiene una palabra clave STORM
   */
  private detectStormKeyword(transcript: string): boolean {
    const normalizedTranscript = transcript.toLowerCase().trim();
    const words = normalizedTranscript.split(/\s+/);

    // Verificar coincidencias exactas y parciales
    const hasKeyword = this.stormKeywords.some(keyword => {
      const normalizedKeyword = keyword.toLowerCase();

      // Coincidencia exacta en el transcript completo
      if (normalizedTranscript.includes(normalizedKeyword)) {
        return true;
      }

      // Coincidencia en palabras individuales
      return words.some(word => {
        // Coincidencia exacta
        if (word === normalizedKeyword) {
          return true;
        }

        // Coincidencia parcial (palabra contiene keyword o viceversa)
        if (word.includes(normalizedKeyword) || normalizedKeyword.includes(word)) {
          return true;
        }

        // Verificar similitud fonética para errores de reconocimiento
        return this.isSimilarWord(word, normalizedKeyword);
      });
    });

    if (hasKeyword && this.settings.debug) {
      console.log(`🎯 Palabra clave STORM detectada en: "${transcript}"`);
    }

    return hasKeyword;
  }

  /**
   * Verifica si dos palabras son similares fonéticamente
   */
  private isSimilarWord(word1: string, word2: string): boolean {
    // Casos específicos para errores comunes de reconocimiento en español
    const commonMistakes: { [key: string]: string[] } = {
      'storm': ['estorm', 'torm', 'stor', 'travel', 'travel'],
      'hola': ['ola', 'olla', 'holla'],
      'tormenta': ['tormenta', 'tormento', 'torment']
    };

    // Verificar errores comunes
    for (const [correct, mistakes] of Object.entries(commonMistakes)) {
      if ((word1 === correct && mistakes.includes(word2)) ||
          (word2 === correct && mistakes.includes(word1))) {
        return true;
      }
    }

    // Verificar similitud por longitud y caracteres comunes
    if (Math.abs(word1.length - word2.length) <= 2) {
      const commonChars = this.countCommonCharacters(word1, word2);
      const minLength = Math.min(word1.length, word2.length);
      return commonChars / minLength >= 0.6; // 60% de similitud
    }

    return false;
  }

  /**
   * Cuenta caracteres comunes entre dos palabras
   */
  private countCommonCharacters(word1: string, word2: string): number {
    const chars1 = word1.split('');
    const chars2 = word2.split('');
    let common = 0;

    chars1.forEach(char => {
      const index = chars2.indexOf(char);
      if (index !== -1) {
        common++;
        chars2.splice(index, 1); // Remover para evitar contar duplicados
      }
    });

    return common;
  }

  /**
   * Maneja la detección de comando STORM
   */
  private handleStormDetection(transcript: string): void {
    if (this.settings.debug) {
      console.log('Comando STORM detectado:', transcript);
    }

    // Detener detección de palabras clave
    this.stopKeywordDetection();

    // Activar modo STORM
    this.isStormListening = true;

    // Emitir evento de detección STORM
    this.emitEvent({
      type: 'storm-detected',
      data: { keyword: transcript },
      timestamp: Date.now()
    });

    // Verificar si el transcript ya contiene un comando después de STORM
    const stormIndex = this.findStormKeywordIndex(transcript);
    if (stormIndex !== -1) {
      const commandPart = this.extractCommandAfterStorm(transcript, stormIndex);
      if (commandPart.trim()) {
        // Ya hay un comando, procesarlo directamente
        if (this.stormCommandCallback) {
          this.stormCommandCallback(commandPart);
        }
        return;
      }
    }

    // Iniciar reconocimiento principal para capturar el comando
    this.startMainRecognition();

    // Configurar timeout para volver a detección de palabras clave
    this.stormTimeout = setTimeout(() => {
      if (this.isStormListening) {
        this.stopMainRecognition();
        this.isStormListening = false;
        this.startKeywordDetection();
      }
    }, 20000); // 20 segundos como se especificó
  }

  /**
   * Encuentra el índice de la palabra clave STORM en el transcript
   */
  private findStormKeywordIndex(transcript: string): number {
    const words = transcript.toLowerCase().split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      if (this.stormKeywords.some(keyword => words[i].includes(keyword))) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Extrae el comando después de la palabra clave STORM
   */
  private extractCommandAfterStorm(transcript: string, stormIndex: number): string {
    const words = transcript.split(/\s+/);
    return words.slice(stormIndex + 1).join(' ');
  }

  /**
   * Inicia la detección de palabras clave
   */
  public startKeywordDetection(): void {
    if (!this.isInitialized || !this.settings.stormCommandEnabled || this.keywordDetectionActive) {
      return;
    }

    // Verificar acceso con el coordinador
    if (!voiceCoordinator.canUseRecognition('native')) {
      if (this.settings.debug) {
        console.log('No se puede iniciar detección nativa: otro servicio está usando el reconocimiento');
      }
      return;
    }
    try {
      if (this.settings.debug) {
        console.log('Iniciando detección de palabras clave STORM...');
      }

      // Marcar reconocimiento como activo
      if (!voiceCoordinator.markRecognitionActive('native')) {
        if (this.settings.debug) {
          console.log('No se pudo marcar reconocimiento nativo como activo');
        }
        return;
      }

      this.keywordRecognition.start();
    } catch (error) {
      console.error('Error al iniciar detección de palabras clave:', error);
      voiceCoordinator.markRecognitionInactive('native');
    }
  }

  /**
   * Detiene la detección de palabras clave
   */
  public stopKeywordDetection(): void {
    if (this.keywordDetectionActive && this.keywordRecognition) {
      try {
        this.keywordRecognition.stop();
        voiceCoordinator.markRecognitionInactive('native');
      } catch (error) {
        console.error('Error al detener detección de palabras clave:', error);
        voiceCoordinator.markRecognitionInactive('native');
      }
    }
  }

  /**
   * Inicia el reconocimiento principal
   */
  public startMainRecognition(): void {
    if (!this.isInitialized || this.mainRecognitionActive) {
      return;
    }

    try {
      if (this.settings.debug) {
        console.log('Iniciando reconocimiento principal...');
      }

      // Marcar reconocimiento como activo
      if (!voiceCoordinator.markRecognitionActive('native')) {
        if (this.settings.debug) {
          console.log('No se pudo marcar reconocimiento principal como activo');
        }
        return;
      }

      this.mainRecognition.start();
    } catch (error) {
      console.error('Error al iniciar reconocimiento principal:', error);
      voiceCoordinator.markRecognitionInactive('native');
    }
  }

  /**
   * Detiene el reconocimiento principal
   */
  public stopMainRecognition(): void {
    if (this.mainRecognitionActive && this.mainRecognition) {
      try {
        this.mainRecognition.stop();
        voiceCoordinator.markRecognitionInactive('native');
      } catch (error) {
        console.error('Error al detener reconocimiento principal:', error);
        voiceCoordinator.markRecognitionInactive('native');
      }
    }
  }

  /**
   * Métodos públicos para compatibilidad con la API existente
   */

  /**
   * Inicializa el reconocimiento de voz globalmente
   */
  public initializeGlobalVoiceRecognition(): void {
    if (!this.isInitialized) {
      this.initialize();
    }

    if (this.settings.enabled && this.settings.stormCommandEnabled) {
      this.startKeywordDetection();
    }
  }

  /**
   * Inicia el reconocimiento de voz
   */
  public startListening(): void {
    if (this.settings.enabled && this.isInitialized) {
      this.startKeywordDetection();
    }
  }

  /**
   * Detiene el reconocimiento de voz
   */
  public stopListening(): void {
    this.stopKeywordDetection();
    this.stopMainRecognition();

    if (this.stormTimeout) {
      clearTimeout(this.stormTimeout);
      this.stormTimeout = null;
    }

    this.isStormListening = false;

    // Liberar acceso en el coordinador
    voiceCoordinator.releaseAccess('native');
  }

  /**
   * Configura el callback para comandos STORM
   */
  public setStormCommandCallback(callback: (command: string) => void): void {
    this.stormCommandCallback = callback;
  }

  /**
   * Remueve el callback de comandos STORM
   */
  public removeStormCommandCallback(): void {
    this.stormCommandCallback = null;
  }

  /**
   * Añade un listener de eventos
   */
  public addEventListener(listener: VoiceRecognitionListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remueve un listener de eventos
   */
  public removeEventListener(listener: VoiceRecognitionListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Emite un evento a todos los listeners
   */
  private emitEvent(event: VoiceRecognitionEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error en listener de reconocimiento de voz:', error);
      }
    });
  }

  /**
   * Obtiene la configuración actual
   */
  public getSettings(): VoiceRecognitionSettings {
    return { ...this.settings };
  }

  /**
   * Actualiza la configuración
   */
  public updateSettings(newSettings: Partial<VoiceRecognitionSettings>): void {
    this.settings = { ...this.settings, ...newSettings };

    // Reinicializar si es necesario
    if (this.isInitialized) {
      this.stopListening();
      this.initializeRecognitionInstances();

      if (this.settings.enabled && this.settings.stormCommandEnabled) {
        this.startKeywordDetection();
      }
    }
  }

  /**
   * Verifica si el reconocimiento está activo
   */
  public isActive(): boolean {
    return this.keywordDetectionActive || this.mainRecognitionActive;
  }

  /**
   * Verifica si está en modo STORM
   */
  public isInStormMode(): boolean {
    return this.isStormListening;
  }

  /**
   * Obtiene el último transcript reconocido
   */
  public getLastTranscript(): string {
    return this.currentTranscript;
  }

  /**
   * Carga la configuración por defecto
   */
  private loadSettings(): VoiceRecognitionSettings {
    return {
      enabled: true,
      language: 'es-ES',
      continuous: false, // Para comandos principales
      interimResults: false, // Para comandos principales
      maxAlternatives: 5,
      stormCommandEnabled: true,
      autoSend: true,
      debug: true // Habilitado para diagnóstico
    };
  }

  /**
   * Reinicia el reconocimiento si se detiene inesperadamente
   */
  public ensureListening(): void {
    if (this.settings.enabled && this.isInitialized && !this.keywordDetectionActive && !this.isStormListening) {
      setTimeout(() => {
        this.startKeywordDetection();
      }, 1000);
    }
  }

  /**
   * Limpia todos los recursos
   */
  public cleanup(): void {
    this.stopListening();
    this.listeners = [];
    this.stormCommandCallback = null;
    this.isInitialized = false;
  }
}

// Exportar instancia singleton
export const nativeVoiceRecognitionService = new NativeVoiceRecognitionService();
export default nativeVoiceRecognitionService;
