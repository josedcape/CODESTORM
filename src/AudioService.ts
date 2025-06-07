/**
 * Servicio de Audio para CODESTORM
 * Maneja efectos de sonido futuristas, síntesis de voz y configuraciones de audio
 */

export interface AudioSettings {
  soundEffectsEnabled: boolean;
  speechSynthesisEnabled: boolean;
  voiceRecognitionEnabled: boolean;
  masterVolume: number;
  speechVolume: number;
  speechRate: number;
  speechPitch: number;
  selectedVoice: string | null;
  language: string;
}

export interface SoundEffect {
  id: string;
  name: string;
  description: string;
  frequency: number;
  duration: number;
  type: 'sine' | 'square' | 'sawtooth' | 'triangle';
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
}

class AudioService {
  private audioContext: AudioContext | null = null;
  private settings: AudioSettings;
  private speechSynthesis: SpeechSynthesis | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  // Efectos de sonido futuristas predefinidos
  private soundEffects: Record<string, SoundEffect> = {
    systemStart: {
      id: 'systemStart',
      name: 'Inicio de Sistema',
      description: 'Sonido de activación futurista',
      frequency: 440,
      duration: 0.8,
      type: 'sine',
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.6, release: 0.3 }
    },
    processComplete: {
      id: 'processComplete',
      name: 'Proceso Completado',
      description: 'Sonido de éxito futurista',
      frequency: 660,
      duration: 0.6,
      type: 'triangle',
      envelope: { attack: 0.05, decay: 0.1, sustain: 0.8, release: 0.2 }
    },
    messageTransmit: {
      id: 'messageTransmit',
      name: 'Transmisión de Mensaje',
      description: 'Sonido de envío de datos',
      frequency: 880,
      duration: 0.4,
      type: 'square',
      envelope: { attack: 0.02, decay: 0.05, sustain: 0.7, release: 0.15 }
    },
    systemError: {
      id: 'systemError',
      name: 'Error del Sistema',
      description: 'Sonido de alerta futurista',
      frequency: 220,
      duration: 1.0,
      type: 'sawtooth',
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.4 }
    },
    voiceActivation: {
      id: 'voiceActivation',
      name: 'Activación de Voz',
      description: 'Sonido de comando STORM',
      frequency: 550,
      duration: 0.3,
      type: 'sine',
      envelope: { attack: 0.01, decay: 0.05, sustain: 0.9, release: 0.1 }
    },
    voiceListening: {
      id: 'voiceListening',
      name: 'Escuchando',
      description: 'Sonido de reconocimiento activo',
      frequency: 330,
      duration: 0.2,
      type: 'triangle',
      envelope: { attack: 0.01, decay: 0.02, sustain: 0.95, release: 0.05 }
    }
  };

  constructor() {
    this.settings = this.loadSettings();
    this.initializeAudio();
    this.initializeSpeechSynthesis();
  }

  /**
   * Inicializa el contexto de audio
   */
  private async initializeAudio(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Reanudar el contexto si está suspendido
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.warn('Web Audio API no soportada:', error);
    }
  }

  /**
   * Inicializa la síntesis de voz
   */
  private initializeSpeechSynthesis(): void {
    if ('speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
      this.loadAvailableVoices();
      
      // Escuchar cambios en las voces disponibles
      this.speechSynthesis.addEventListener('voiceschanged', () => {
        this.loadAvailableVoices();
      });
    } else {
      console.warn('Speech Synthesis API no soportada');
    }
  }

  /**
   * Carga las voces disponibles
   */
  private loadAvailableVoices(): void {
    if (this.speechSynthesis) {
      this.availableVoices = this.speechSynthesis.getVoices();
      
      // Seleccionar voz por defecto en español si no hay una seleccionada
      if (!this.settings.selectedVoice && this.availableVoices.length > 0) {
        const spanishVoice = this.availableVoices.find(voice => 
          voice.lang.startsWith('es') || voice.lang.startsWith('spa')
        );
        
        if (spanishVoice) {
          this.settings.selectedVoice = spanishVoice.name;
          this.saveSettings();
        }
      }
    }
  }

  /**
   * Reproduce un efecto de sonido
   */
  public async playSound(effectId: string, volume: number = 1): Promise<void> {
    if (!this.settings.soundEffectsEnabled || !this.audioContext) return;

    const effect = this.soundEffects[effectId];
    if (!effect) {
      console.warn(`Efecto de sonido no encontrado: ${effectId}`);
      return;
    }

    try {
      // Crear oscilador
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      // Configurar oscilador
      oscillator.type = effect.type;
      oscillator.frequency.setValueAtTime(effect.frequency, this.audioContext.currentTime);
      
      // Configurar envelope ADSR
      const now = this.audioContext.currentTime;
      const { attack, decay, sustain, release } = effect.envelope;
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume * this.settings.masterVolume, now + attack);
      gainNode.gain.linearRampToValueAtTime(volume * this.settings.masterVolume * sustain, now + attack + decay);
      gainNode.gain.setValueAtTime(volume * this.settings.masterVolume * sustain, now + effect.duration - release);
      gainNode.gain.linearRampToValueAtTime(0, now + effect.duration);
      
      // Conectar nodos
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Reproducir
      oscillator.start(now);
      oscillator.stop(now + effect.duration);
      
    } catch (error) {
      console.error('Error reproduciendo efecto de sonido:', error);
    }
  }

  /**
   * Sintetiza texto a voz
   */
  public async speakText(text: string, options?: Partial<SpeechSynthesisUtterance>): Promise<void> {
    if (!this.settings.speechSynthesisEnabled || !this.speechSynthesis) return;

    // Cancelar síntesis anterior si está en curso
    this.stopSpeaking();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configurar voz
      const selectedVoice = this.availableVoices.find(voice => 
        voice.name === this.settings.selectedVoice
      );
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      // Configurar parámetros
      utterance.volume = this.settings.speechVolume * this.settings.masterVolume;
      utterance.rate = this.settings.speechRate;
      utterance.pitch = this.settings.speechPitch;
      utterance.lang = this.settings.language;
      
      // Aplicar opciones adicionales
      if (options) {
        Object.assign(utterance, options);
      }
      
      // Eventos
      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };
      
      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`Error en síntesis de voz: ${event.error}`));
      };
      
      // Iniciar síntesis
      this.currentUtterance = utterance;
      this.speechSynthesis!.speak(utterance);
    });
  }

  /**
   * Detiene la síntesis de voz actual
   */
  public stopSpeaking(): void {
    if (this.speechSynthesis && this.currentUtterance) {
      this.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Verifica si está hablando actualmente
   */
  public isSpeaking(): boolean {
    return this.speechSynthesis ? this.speechSynthesis.speaking : false;
  }

  /**
   * Obtiene las voces disponibles
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices;
  }

  /**
   * Obtiene los efectos de sonido disponibles
   */
  public getAvailableSoundEffects(): Record<string, SoundEffect> {
    return this.soundEffects;
  }

  /**
   * Actualiza la configuración
   */
  public updateSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  /**
   * Obtiene la configuración actual
   */
  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /**
   * Carga la configuración desde localStorage
   */
  private loadSettings(): AudioSettings {
    const defaultSettings: AudioSettings = {
      soundEffectsEnabled: true,
      speechSynthesisEnabled: true,
      voiceRecognitionEnabled: true,
      masterVolume: 0.7,
      speechVolume: 0.8,
      speechRate: 1.0,
      speechPitch: 1.0,
      selectedVoice: null,
      language: 'es-ES'
    };

    try {
      const saved = localStorage.getItem('codestorm-audio-settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch (error) {
      console.warn('Error cargando configuración de audio:', error);
      return defaultSettings;
    }
  }

  /**
   * Guarda la configuración en localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('codestorm-audio-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Error guardando configuración de audio:', error);
    }
  }

  /**
   * Reproduce sonido de inicio del sistema
   */
  public playSystemStart(): Promise<void> {
    return this.playSound('systemStart');
  }

  /**
   * Reproduce sonido de proceso completado
   */
  public playProcessComplete(): Promise<void> {
    return this.playSound('processComplete');
  }

  /**
   * Reproduce sonido de transmisión de mensaje
   */
  public playMessageTransmit(): Promise<void> {
    return this.playSound('messageTransmit');
  }

  /**
   * Reproduce sonido de error del sistema
   */
  public playSystemError(): Promise<void> {
    return this.playSound('systemError');
  }

  /**
   * Reproduce sonido de activación de voz
   */
  public playVoiceActivation(): Promise<void> {
    return this.playSound('voiceActivation');
  }

  /**
   * Reproduce sonido de escucha activa
   */
  public playVoiceListening(): Promise<void> {
    return this.playSound('voiceListening');
  }
}

// Instancia singleton
export const audioService = new AudioService();
export default AudioService;
