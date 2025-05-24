/**
 * Servicio de Reconocimiento de Voz para CODESTORM
 * Implementado con Annyang.js para mejor precisión en español
 */

import annyang from 'annyang';
import { audioService } from './AudioService';

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
  alternatives?: string[];
}

export interface VoiceRecognitionEvent {
  type: 'start' | 'result' | 'end' | 'error' | 'storm-detected';
  data?: any;
  timestamp: number;
}

type VoiceRecognitionListener = (event: VoiceRecognitionEvent) => void;

class VoiceRecognitionService {
  private isListening: boolean = false;
  private isStormListening: boolean = false;
  private listeners: VoiceRecognitionListener[] = [];
  private settings: VoiceRecognitionSettings;
  private currentTranscript: string = '';
  private stormKeywords: string[] = ['storm', 'tormenta', 'codestorm'];
  private stormTimeout: NodeJS.Timeout | null = null;
  private autoListeningAfterStorm: boolean = false;
  private stormCommandCallback: ((command: string) => void) | null = null;
  private isInitialized: boolean = false;
  private generalCommands: { [key: string]: any } = {};

  constructor() {
    this.settings = this.loadSettings();
    this.initializeAnnyang();
    this.setupStormListener();
  }

  /**
   * Inicializa Annyang para reconocimiento de voz
   */
  private initializeAnnyang(): void {
    if (!annyang) {
      console.warn('Annyang no está disponible');
      return;
    }

    // Configurar idioma para español con configuración específica
    annyang.setLanguage(this.settings.language);

    // Configurar opciones específicas para español
    if (annyang.getSpeechRecognizer) {
      const recognition = annyang.getSpeechRecognizer();
      if (recognition) {
        recognition.lang = this.settings.language;
        recognition.continuous = this.settings.continuous;
        recognition.interimResults = this.settings.interimResults;
        recognition.maxAlternatives = this.settings.maxAlternatives;
      }
    }

    // Habilitar debug si está configurado
    if (this.settings.debug) {
      annyang.debug(true);
      console.log('Annyang debug habilitado');
    }

    // Configurar comandos específicos para STORM
    this.setupStormCommands();

    // Configurar eventos de Annyang
    this.setupAnnyangEvents();

    this.isInitialized = true;
    console.log(`Annyang inicializado correctamente para ${this.settings.language}`);
  }

  /**
   * Configura los comandos específicos para STORM
   */
  private setupStormCommands(): void {
    const commands: { [key: string]: any } = {};

    // Comandos para activar STORM
    this.stormKeywords.forEach(keyword => {
      // Comando simple (solo la palabra clave)
      commands[keyword] = () => {
        console.log(`Comando STORM detectado: ${keyword}`);
        this.handleStormActivation();
      };

      // Comandos con instrucciones directas (más flexibles)
      commands[`${keyword} *instruction`] = (instruction: string) => {
        console.log(`Comando STORM con instrucción: ${keyword} ${instruction}`);
        this.handleStormWithCommand(instruction);
      };

      // Variaciones adicionales para mejor detección
      commands[`*prefix ${keyword}`] = (prefix: string) => {
        console.log(`STORM detectado con prefijo: ${prefix} ${keyword}`);
        this.handleStormActivation();
      };

      commands[`*prefix ${keyword} *instruction`] = (prefix: string, instruction: string) => {
        console.log(`STORM completo detectado: ${prefix} ${keyword} ${instruction}`);
        this.handleStormWithCommand(instruction);
      };
    });

    // Comando comodín para capturar cualquier habla
    commands['*speech'] = (speech: string) => {
      console.log(`Habla general detectada: ${speech}`);
      this.handleGeneralSpeech(speech);
    };

    annyang.addCommands(commands);
    this.generalCommands = commands;

    console.log('Comandos STORM configurados:', Object.keys(commands));
  }

  /**
   * Configura los eventos de Annyang
   */
  private setupAnnyangEvents(): void {
    // Evento cuando inicia el reconocimiento
    annyang.addCallback('start', () => {
      this.isListening = true;
      this.emitEvent({ type: 'start', timestamp: Date.now() });

      // Reproducir sonido de activación si no es comando STORM
      if (!this.isStormListening) {
        audioService.playVoiceListening();
      }
    });

    // Evento cuando se obtiene un resultado
    annyang.addCallback('result', (phrases: string[]) => {
      if (phrases && phrases.length > 0) {
        const transcript = phrases[0];
        this.currentTranscript = transcript;

        const result: VoiceRecognitionResult = {
          transcript,
          confidence: 1.0, // Annyang no proporciona confidence, asumimos alta confianza
          isFinal: true,
          alternatives: phrases
        };

        this.emitEvent({
          type: 'result',
          data: result,
          timestamp: Date.now()
        });
      }
    });

    // Evento cuando termina el reconocimiento
    annyang.addCallback('end', () => {
      this.isListening = false;
      this.emitEvent({ type: 'end', timestamp: Date.now() });

      // Reproducir sonido de finalización solo si no es STORM
      if (!this.isStormListening) {
        audioService.playVoiceDeactivation();
      }

      // Limpiar timeout de STORM si existe
      if (this.stormTimeout) {
        clearTimeout(this.stormTimeout);
        this.stormTimeout = null;
      }

      // Si no estamos en modo STORM, reiniciar automáticamente para comandos globales
      if (!this.isStormListening && this.settings.stormCommandEnabled) {
        console.log('Reconocimiento terminado, reiniciando para comandos STORM...');
        setTimeout(() => {
          this.ensureListening();
        }, 1000);
      }

      this.isStormListening = false;
    });

    // Evento de error
    annyang.addCallback('error', (error: any) => {
      console.error('Error en reconocimiento de voz:', error);
      this.emitEvent({
        type: 'error',
        data: { error: error.message || 'Error desconocido' },
        timestamp: Date.now()
      });

      this.isListening = false;
      this.isStormListening = false;
    });

    // Evento cuando no se reconoce ningún comando específico
    annyang.addCallback('resultNoMatch', (phrases: string[]) => {
      console.log('No se reconoció comando específico, pero se detectó habla:', phrases);

      // Si hay frases detectadas, procesarlas como habla general
      if (phrases && phrases.length > 0) {
        const transcript = phrases[0];
        console.log('Procesando habla libre:', transcript);
        this.handleGeneralSpeech(transcript);
      }
    });

    // Evento adicional para capturar resultados de speech recognition
    annyang.addCallback('soundstart', () => {
      console.log('Sonido detectado, iniciando reconocimiento...');
    });

    annyang.addCallback('speechstart', () => {
      console.log('Habla detectada, procesando...');
    });

    annyang.addCallback('speechend', () => {
      console.log('Fin del habla detectado');
    });
  }

  /**
   * Maneja la activación simple de STORM
   */
  private handleStormActivation(): void {
    this.emitEvent({
      type: 'storm-detected',
      data: {
        transcript: 'STORM',
        autoListen: true
      },
      timestamp: Date.now()
    });

    // Reproducir sonido de activación
    audioService.playVoiceActivation();

    // Activar escucha automática para el comando
    this.autoListeningAfterStorm = true;
    this.stopListening();
    setTimeout(() => {
      this.startAutoStormListening();
    }, 800);
  }

  /**
   * Maneja STORM con comando directo
   */
  private handleStormWithCommand(instruction: string): void {
    if (instruction && instruction.trim().length > 0) {
      this.emitEvent({
        type: 'storm-detected',
        data: {
          transcript: `STORM ${instruction}`,
          command: instruction.trim(),
          autoSend: true
        },
        timestamp: Date.now()
      });

      // Reproducir sonido de éxito
      audioService.playProcessComplete();

      // Ejecutar callback si existe
      if (this.stormCommandCallback) {
        this.stormCommandCallback(instruction.trim());
      }
    }
  }

  /**
   * Maneja el habla general
   */
  private handleGeneralSpeech(text: string): void {
    // Si estamos en modo auto-listening después de STORM
    if (this.autoListeningAfterStorm && text && text.trim().length > 0) {
      this.emitEvent({
        type: 'storm-detected',
        data: {
          transcript: text,
          command: text.trim(),
          autoSend: true
        },
        timestamp: Date.now()
      });

      // Ejecutar callback si existe
      if (this.stormCommandCallback) {
        this.stormCommandCallback(text.trim());
      }

      // Reproducir sonido de éxito
      audioService.playProcessComplete();

      // Resetear modo auto-listening
      this.autoListeningAfterStorm = false;
      this.stopListening();
      return;
    }

    // Verificar si contiene comando STORM
    if (this.settings.stormCommandEnabled && this.detectStormCommand(text)) {
      const command = this.extractCommandFromStormText(text);
      if (command && command.trim().length > 0) {
        this.handleStormWithCommand(command);
      } else {
        this.handleStormActivation();
      }
      return;
    }

    // Emitir como resultado normal
    const result: VoiceRecognitionResult = {
      transcript: text,
      confidence: 1.0,
      isFinal: true,
      alternatives: [text]
    };

    this.emitEvent({
      type: 'result',
      data: result,
      timestamp: Date.now()
    });
  }

  /**
   * Configura el listener global para el comando STORM
   */
  private setupStormListener(): void {
    if (!this.settings.stormCommandEnabled) return;

    // Listener global para detectar STORM en cualquier momento
    document.addEventListener('keydown', (event) => {
      // Activar con Ctrl+Shift+S o Alt+S
      if ((event.ctrlKey && event.shiftKey && event.key === 'S') ||
          (event.altKey && event.key === 's')) {
        event.preventDefault();
        this.activateStormCommand();
      }
    });
  }

  /**
   * Detecta el comando STORM en el texto
   */
  private detectStormCommand(text: string): boolean {
    const normalizedText = text.toLowerCase().trim();

    // Verificar si contiene alguna de las palabras clave de STORM
    return this.stormKeywords.some(keyword => {
      return normalizedText.includes(keyword) ||
             normalizedText.startsWith(keyword) ||
             normalizedText.endsWith(keyword);
    });
  }

  /**
   * Extrae el comando después de la palabra clave STORM
   */
  private extractCommandFromStormText(text: string): string {
    const normalizedText = text.toLowerCase().trim();

    for (const keyword of this.stormKeywords) {
      const keywordIndex = normalizedText.indexOf(keyword);
      if (keywordIndex !== -1) {
        // Extraer texto después de la palabra clave
        const afterKeyword = text.substring(keywordIndex + keyword.length).trim();
        if (afterKeyword.length > 0) {
          return afterKeyword;
        }
      }
    }

    return '';
  }

  /**
   * Inicia escucha automática después de detectar STORM
   */
  private startAutoStormListening(): void {
    if (!this.settings.enabled || !this.isInitialized) return;

    this.isStormListening = true;
    this.startListening();

    // Timeout para comando STORM
    this.stormTimeout = setTimeout(() => {
      if (this.isStormListening) {
        this.stopListening();
        this.autoListeningAfterStorm = false;
      }
    }, 15000); // 15 segundos de timeout para comando completo
  }

  /**
   * Activa el comando STORM manualmente
   */
  public activateStormCommand(): void {
    if (!this.settings.enabled || !this.isInitialized) return;

    this.isStormListening = true;
    audioService.playVoiceActivation();

    this.startListening();

    // Timeout para comando STORM
    this.stormTimeout = setTimeout(() => {
      if (this.isStormListening) {
        this.stopListening();
      }
    }, 10000); // 10 segundos de timeout
  }

  /**
   * Inicia el reconocimiento de voz
   */
  public startListening(): void {
    if (!this.settings.enabled || !this.isInitialized || this.isListening) return;

    try {
      console.log('Iniciando reconocimiento de voz con Annyang...');
      annyang.start({
        autoRestart: true, // Habilitar reinicio automático
        continuous: this.settings.continuous
      });
    } catch (error) {
      console.error('Error iniciando reconocimiento de voz:', error);
      this.emitEvent({
        type: 'error',
        data: { error: 'start_failed', message: 'No se pudo iniciar el reconocimiento de voz' },
        timestamp: Date.now()
      });

      // Reintentar después de un breve delay
      setTimeout(() => {
        this.ensureListening();
      }, 2000);
    }
  }

  /**
   * Detiene el reconocimiento de voz
   */
  public stopListening(): void {
    if (this.isListening) {
      annyang.abort();
    }

    if (this.stormTimeout) {
      clearTimeout(this.stormTimeout);
      this.stormTimeout = null;
    }
  }

  /**
   * Verifica si está escuchando actualmente
   */
  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  /**
   * Verifica si está en modo comando STORM
   */
  public isStormMode(): boolean {
    return this.isStormListening;
  }

  /**
   * Obtiene el transcript actual
   */
  public getCurrentTranscript(): string {
    return this.currentTranscript;
  }

  /**
   * Limpia el transcript actual
   */
  public clearTranscript(): void {
    this.currentTranscript = '';
  }

  /**
   * Añade un listener de eventos
   */
  public addListener(listener: VoiceRecognitionListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remueve un listener de eventos
   */
  public removeListener(listener: VoiceRecognitionListener): void {
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
   * Actualiza la configuración
   */
  public updateSettings(newSettings: Partial<VoiceRecognitionSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();

    // Reinicializar Annyang si es necesario
    if (this.isInitialized) {
      annyang.setLanguage(this.settings.language);
      if (this.settings.debug) {
        annyang.debug(true);
      }
    }
  }

  /**
   * Obtiene la configuración actual
   */
  public getSettings(): VoiceRecognitionSettings {
    return { ...this.settings };
  }

  /**
   * Verifica si el reconocimiento de voz está soportado
   */
  public isSupported(): boolean {
    return annyang !== null && this.isInitialized;
  }

  /**
   * Registra un callback para comandos STORM
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
   * Inicializa el reconocimiento de voz globalmente
   * Debe ser llamado desde cada página para habilitar STORM
   */
  public initializeGlobalVoiceRecognition(): void {
    if (!this.isInitialized) {
      console.log('Inicializando reconocimiento de voz global...');
      this.initializeAnnyang();
    }

    // Iniciar reconocimiento automático para comandos STORM
    if (this.settings.enabled && this.settings.stormCommandEnabled) {
      console.log('Iniciando reconocimiento automático para comandos STORM...');
      this.startListening();
    }
  }

  /**
   * Reinicia el reconocimiento de voz si se detiene
   */
  public ensureListening(): void {
    if (this.settings.enabled && this.isInitialized && !this.isListening) {
      console.log('Reiniciando reconocimiento de voz...');
      setTimeout(() => {
        this.startListening();
      }, 1000);
    }
  }

  /**
   * Solicita permisos de micrófono
   */
  public async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Error solicitando permisos de micrófono:', error);
      return false;
    }
  }

  /**
   * Carga la configuración desde localStorage
   */
  private loadSettings(): VoiceRecognitionSettings {
    const defaultSettings: VoiceRecognitionSettings = {
      enabled: true,
      language: 'es-ES', // Español de España como principal
      continuous: true, // Continuo para mejor detección de STORM
      interimResults: true,
      maxAlternatives: 5, // Más alternativas para mejor precisión
      stormCommandEnabled: true,
      autoSend: true, // Auto-envío habilitado por defecto
      debug: true // Debug habilitado para diagnóstico
    };

    try {
      const saved = localStorage.getItem('codestorm-voice-settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch (error) {
      console.warn('Error cargando configuración de voz:', error);
      return defaultSettings;
    }
  }

  /**
   * Guarda la configuración en localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('codestorm-voice-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Error guardando configuración de voz:', error);
    }
  }
}

// Instancia singleton
export const voiceRecognitionService = new VoiceRecognitionService();
export default VoiceRecognitionService;
