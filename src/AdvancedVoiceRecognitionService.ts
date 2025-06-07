/**
 * Servicio de Reconocimiento de Voz Avanzado para CODESTORM
 * Sistema tradicional activado por botón - Sin detección de palabra clave
 * Optimizado para español con coordinación de servicios
 */

import { voiceCoordinator } from './VoiceCoordinator';
import { audio } from '../utils/audioManager';

export interface VoiceRecognitionConfig {
  onTranscript?: (transcript: string) => void;
  onStateChange?: (state: VoiceState) => void;
  onError?: (error: string) => void;
  enableDebug?: boolean;
}

export type VoiceState = 
  | 'inactive'           // No está escuchando
  | 'listening'          // Escuchando comando de voz
  | 'processing'         // Procesando transcripción
  | 'error'             // Estado de error
  | 'timeout';          // Timeout alcanzado

class AdvancedVoiceRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private currentState: VoiceState = 'inactive';
  private isInitialized = false;
  private config: VoiceRecognitionConfig = {};
  private listeningTimeout: NodeJS.Timeout | null = null;
  private isListening = false;

  private static instance: AdvancedVoiceRecognitionService | null = null;

  private constructor() {}

  public static getInstance(): AdvancedVoiceRecognitionService {
    if (!AdvancedVoiceRecognitionService.instance) {
      AdvancedVoiceRecognitionService.instance = new AdvancedVoiceRecognitionService();
    }
    return AdvancedVoiceRecognitionService.instance;
  }

  // Verificar soporte de Web Speech API
  private isWebSpeechSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  // Inicializar el servicio
  public initialize(config: VoiceRecognitionConfig): boolean {
    if (this.isInitialized) {
      this.log('Servicio ya inicializado');
      return true;
    }

    if (!this.isWebSpeechSupported()) {
      this.handleError('Web Speech API no está soportada en este navegador');
      return false;
    }

    // Solicitar acceso exclusivo al coordinador
    if (!voiceCoordinator.requestAccess('advanced')) {
      this.log('⚠️ No se pudo obtener acceso exclusivo al reconocimiento de voz');
      return false;
    }

    this.config = { ...config };

    try {
      // Detener el servicio nativo temporalmente
      this.log('🛑 Deteniendo servicio nativo para activar sistema avanzado');

      this.setupRecognition();
      this.isInitialized = true;
      
      this.log('✅ Servicio de reconocimiento de voz inicializado correctamente');
      
      return true;
    } catch (error) {
      voiceCoordinator.releaseAccess('advanced');
      this.handleError(`Error al inicializar reconocimiento de voz: ${error}`);
      return false;
    }
  }

  // Configurar reconocimiento de voz
  private setupRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    if (this.recognition) {
      this.recognition.lang = 'es-ES';
      this.recognition.interimResults = false;
      this.recognition.continuous = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.log('🎤 Reconocimiento de voz iniciado');
        this.setState('listening');
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        this.handleResult(event);
      };

      this.recognition.onend = () => {
        this.log('🎤 Reconocimiento de voz finalizado');
        this.handleEnd();
      };

      this.recognition.onerror = (event: any) => {
        this.log(`❌ Error en reconocimiento de voz: ${event.error}`);
        this.handleError(event);
      };
    }
  }

  // Iniciar reconocimiento de voz
  startListening(): boolean {
    if (!this.isInitialized || !this.recognition) {
      this.log('⚠️ Servicio no inicializado o reconocimiento no disponible');
      return false;
    }

    // Verificar acceso con el coordinador
    if (!voiceCoordinator.canUseRecognition('advanced')) {
      this.log('⚠️ No se puede iniciar reconocimiento: otro servicio está usando el reconocimiento');
      return false;
    }

    if (this.isListening) {
      this.log('Ya está escuchando');
      return false;
    }

    try {
      this.log('🎤 Iniciando reconocimiento de voz...');
      
      // Marcar reconocimiento como activo
      if (!voiceCoordinator.markRecognitionActive('advanced')) {
        this.log('⚠️ No se pudo marcar reconocimiento como activo');
        return false;
      }
      
      this.recognition.start();
      
      // Timeout de 20 segundos
      this.listeningTimeout = setTimeout(() => {
        this.log('⏰ Timeout de reconocimiento de voz');
        this.setState('timeout');
        this.stopListening();
      }, 20000);
      
      return true;
    } catch (error) {
      this.log(`Error al iniciar reconocimiento de voz: ${error}`);
      voiceCoordinator.markRecognitionInactive('advanced');
      return false;
    }
  }

  // Detener reconocimiento de voz
  stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        this.log(`Error al detener reconocimiento: ${error}`);
      }
    }
    
    if (this.listeningTimeout) {
      clearTimeout(this.listeningTimeout);
      this.listeningTimeout = null;
    }
    
    this.isListening = false;
    voiceCoordinator.markRecognitionInactive('advanced');
    this.setState('inactive');
  }

  // Manejar resultado de reconocimiento
  private handleResult(event: any) {
    if (this.listeningTimeout) {
      clearTimeout(this.listeningTimeout);
      this.listeningTimeout = null;
    }

    const transcript = event.results[event.resultIndex][0].transcript;
    this.log(`📝 Transcripción recibida: "${transcript}"`);
    
    this.setState('processing');
    
    // Notificar transcripción
    this.config.onTranscript?.(transcript);
    
    // Reproducir sonido de confirmación
    audio.playProcessComplete();
  }

  // Manejar fin de reconocimiento
  private handleEnd() {
    if (this.listeningTimeout) {
      clearTimeout(this.listeningTimeout);
      this.listeningTimeout = null;
    }
    
    this.isListening = false;
    voiceCoordinator.markRecognitionInactive('advanced');
    this.setState('inactive');
    
    this.log('🎤 Reconocimiento finalizado');
  }

  // Manejar error en reconocimiento
  private handleError(event: any) {
    if (this.listeningTimeout) {
      clearTimeout(this.listeningTimeout);
      this.listeningTimeout = null;
    }
    
    this.isListening = false;
    voiceCoordinator.markRecognitionInactive('advanced');
    
    let errorMessage = 'Error en el reconocimiento de voz';
    switch (event.error) {
      case 'not-allowed':
        errorMessage = 'Permisos de micrófono denegados. Por favor, permite el acceso al micrófono.';
        break;
      case 'no-speech':
        errorMessage = 'No se detectó voz. Intenta hablar más cerca del micrófono.';
        break;
      case 'audio-capture':
        errorMessage = 'No se pudo acceder al micrófono. Verifica que esté conectado.';
        break;
      case 'network':
        errorMessage = 'Error de red. Verifica tu conexión a internet.';
        break;
      case 'service-not-allowed':
        errorMessage = 'Servicio de reconocimiento de voz no disponible.';
        break;
    }
    
    this.setState('error');
    this.config.onError?.(errorMessage);
    this.log(`❌ ${errorMessage}`);
  }

  // Cambiar estado y notificar
  private setState(newState: VoiceState) {
    if (this.currentState !== newState) {
      this.currentState = newState;
      this.log(`🔄 Estado cambiado a: ${newState}`);
      this.config.onStateChange?.(newState);
    }
  }

  // Logging condicional
  private log(message: string) {
    if (this.config.enableDebug) {
      console.log(`[AdvancedVoiceService] ${message}`);
    }
  }

  // Métodos públicos para control externo
  
  // Obtener estado actual
  getCurrentState(): VoiceState {
    return this.currentState;
  }

  // Verificar si está escuchando
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  // Verificar si está inicializado
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  // Destruir el servicio
  destroy() {
    this.log('🛑 Destruyendo servicio de reconocimiento de voz');
    
    this.stopListening();
    
    // Liberar acceso en el coordinador
    voiceCoordinator.releaseAccess('advanced');
    
    this.setState('inactive');
    this.isInitialized = false;
    AdvancedVoiceRecognitionService.instance = null;
  }
}

// Exportar instancia singleton
export const advancedVoiceService = AdvancedVoiceRecognitionService.getInstance();
