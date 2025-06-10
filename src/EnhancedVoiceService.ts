/**
 * Servicio Mejorado de Reconocimiento de Voz para CODESTORM
 * Optimizado específicamente para español con comandos técnicos
 * Incluye filtros de post-procesamiento y auto-reparación
 */

import { voiceCoordinator } from './VoiceCoordinator';

export type EnhancedVoiceState = 
  | 'idle'
  | 'listening' 
  | 'processing'
  | 'speaking'
  | 'error'
  | 'disabled'
  | 'initializing'
  | 'ready'
  | 'repairing';

export interface EnhancedVoiceConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  timeout?: number;
  enableDebug?: boolean;
  componentName?: string;
  enablePostProcessing?: boolean;
  enableTechnicalTerms?: boolean;
  enableCommandRecognition?: boolean;
  confidenceThreshold?: number;
}

export interface VoiceCallbacks {
  onTranscript?: (transcript: string, confidence: number) => void;
  onFinalTranscript?: (transcript: string, confidence: number) => void;
  onCommand?: (command: string, confidence: number) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: EnhancedVoiceState) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface TechnicalTerm {
  original: string;
  corrected: string;
  confidence: number;
  category: 'programming' | 'web' | 'framework' | 'command' | 'general';
}

class EnhancedVoiceService {
  private static instance: EnhancedVoiceService | null = null;
  
  private recognition: SpeechRecognition | null = null;
  private currentState: EnhancedVoiceState = 'idle';
  private currentConfig: Required<EnhancedVoiceConfig> = {
    language: 'es-ES',
    continuous: false,
    interimResults: true,
    maxAlternatives: 5,
    timeout: 15000,
    enableDebug: true,
    componentName: 'EnhancedVoiceService',
    enablePostProcessing: true,
    enableTechnicalTerms: true,
    enableCommandRecognition: true,
    confidenceThreshold: 0.7
  };
  
  private currentCallbacks: VoiceCallbacks = {};
  private isInitialized = false;
  private debug = true;
  private lastTranscript = '';
  private recognitionTimeout: NodeJS.Timeout | null = null;
  private repairAttempts = 0;
  private maxRepairAttempts = 3;

  // Diccionario de términos técnicos en español para CODESTORM
  private technicalTerms: TechnicalTerm[] = [
    // Comandos de CODESTORM
    { original: 'abrir vista previa web', corrected: 'abrir vista previa web', confidence: 1.0, category: 'command' },
    { original: 'abrir corrector de código', corrected: 'abrir corrector de código', confidence: 1.0, category: 'command' },
    { original: 'cerrar ayuda', corrected: 'cerrar ayuda', confidence: 1.0, category: 'command' },
    { original: 'mostrar comandos de voz', corrected: 'mostrar comandos de voz', confidence: 1.0, category: 'command' },
    { original: 'pantalla completa', corrected: 'pantalla completa', confidence: 1.0, category: 'command' },
    
    // Términos de programación
    { original: 'javascript', corrected: 'JavaScript', confidence: 0.9, category: 'programming' },
    { original: 'java script', corrected: 'JavaScript', confidence: 0.9, category: 'programming' },
    { original: 'html', corrected: 'HTML', confidence: 0.9, category: 'web' },
    { original: 'css', corrected: 'CSS', confidence: 0.9, category: 'web' },
    { original: 'react', corrected: 'React', confidence: 0.9, category: 'framework' },
    { original: 'typescript', corrected: 'TypeScript', confidence: 0.9, category: 'programming' },
    { original: 'type script', corrected: 'TypeScript', confidence: 0.9, category: 'programming' },
    { original: 'node js', corrected: 'Node.js', confidence: 0.9, category: 'framework' },
    { original: 'nodejs', corrected: 'Node.js', confidence: 0.9, category: 'framework' },
    
    // Términos de CODESTORM
    { original: 'code storm', corrected: 'CODESTORM', confidence: 1.0, category: 'general' },
    { original: 'codestorm', corrected: 'CODESTORM', confidence: 1.0, category: 'general' },
    { original: 'botidinamix', corrected: 'BOTIDINAMIX', confidence: 1.0, category: 'general' },
    { original: 'web ai', corrected: 'WebAI', confidence: 1.0, category: 'general' },
    { original: 'webai', corrected: 'WebAI', confidence: 1.0, category: 'general' },
    
    // Comandos de navegación
    { original: 'ir a chat', corrected: 'ir a chat', confidence: 1.0, category: 'command' },
    { original: 'ir a tutoriales', corrected: 'ir a tutoriales', confidence: 1.0, category: 'command' },
    { original: 'limpiar chat', corrected: 'limpiar chat', confidence: 1.0, category: 'command' },
    { original: 'exportar conversación', corrected: 'exportar conversación', confidence: 1.0, category: 'command' }
  ];

  // Patrones de comandos reconocidos
  private commandPatterns = [
    /^(abrir|mostrar|activar)\s+(vista previa web|preview web|vista web)/i,
    /^(abrir|mostrar|activar)\s+(corrector|corrector de código|code corrector)/i,
    /^(cerrar|ocultar)\s+(ayuda|asistente|modal)/i,
    /^(ir a|cambiar a|mostrar)\s+(chat|conversación)/i,
    /^(ir a|cambiar a|mostrar)\s+(tutoriales|guías)/i,
    /^(mostrar|ver|listar)\s+(comandos|comandos de voz)/i,
    /^(pantalla completa|fullscreen|maximizar)/i,
    /^(limpiar|borrar)\s+(chat|conversación|mensajes)/i
  ];

  private constructor() {
    this.log('EnhancedVoiceService inicializado');
  }

  public static getInstance(): EnhancedVoiceService {
    if (!EnhancedVoiceService.instance) {
      EnhancedVoiceService.instance = new EnhancedVoiceService();
    }
    return EnhancedVoiceService.instance;
  }

  private log(message: string, ...args: any[]): void {
    if (this.debug) {
      console.log(`🎤 [${this.currentConfig.componentName}] ${message}`, ...args);
    }
  }

  private setState(newState: EnhancedVoiceState): void {
    if (this.currentState !== newState) {
      this.log(`Estado cambiado: ${this.currentState} → ${newState}`);
      this.currentState = newState;
      this.currentCallbacks.onStateChange?.(newState);
    }
  }

  /**
   * Verificar permisos y compatibilidad
   */
  public async checkPermissions(): Promise<{
    speechRecognition: boolean;
    microphone: boolean;
    details: string[];
  }> {
    const details: string[] = [];
    let speechRecognition = false;
    let microphone = false;

    // Verificar Speech Recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      speechRecognition = true;
      details.push('✅ Speech Recognition API disponible');
    } else {
      details.push('❌ Speech Recognition API no disponible');
    }

    // Verificar permisos de micrófono
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphone = true;
        details.push('✅ Permisos de micrófono concedidos');
        
        // Cerrar stream inmediatamente
        stream.getTracks().forEach(track => track.stop());
      } else {
        details.push('❌ getUserMedia no disponible');
      }
    } catch (error) {
      details.push(`⚠️ Error al verificar micrófono: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    return { speechRecognition, microphone, details };
  }

  /**
   * Post-procesamiento de texto para mejorar precisión
   */
  private postProcessTranscript(transcript: string): {
    processed: string;
    confidence: number;
    corrections: TechnicalTerm[];
  } {
    if (!this.currentConfig.enablePostProcessing) {
      return { processed: transcript, confidence: 1.0, corrections: [] };
    }

    let processed = transcript.toLowerCase().trim();
    const corrections: TechnicalTerm[] = [];
    let totalConfidence = 1.0;

    // Aplicar correcciones de términos técnicos
    if (this.currentConfig.enableTechnicalTerms) {
      for (const term of this.technicalTerms) {
        const regex = new RegExp(`\\b${term.original}\\b`, 'gi');
        if (regex.test(processed)) {
          processed = processed.replace(regex, term.corrected);
          corrections.push(term);
          totalConfidence = Math.min(totalConfidence, term.confidence);
        }
      }
    }

    // Normalizar espacios y puntuación
    processed = processed
      .replace(/\s+/g, ' ')
      .replace(/[.,;:!?]+$/, '')
      .trim();

    this.log('Post-procesamiento:', { original: transcript, processed, corrections });

    return { processed, confidence: totalConfidence, corrections };
  }

  /**
   * Detectar si el texto es un comando
   */
  private detectCommand(text: string): { isCommand: boolean; command?: string; confidence: number } {
    if (!this.currentConfig.enableCommandRecognition) {
      return { isCommand: false, confidence: 0 };
    }

    const normalizedText = text.toLowerCase().trim();

    for (const pattern of this.commandPatterns) {
      if (pattern.test(normalizedText)) {
        this.log('Comando detectado:', { text: normalizedText, pattern: pattern.source });
        return { isCommand: true, command: normalizedText, confidence: 0.9 };
      }
    }

    return { isCommand: false, confidence: 0 };
  }

  /**
   * Configurar el reconocimiento de voz
   */
  private setupRecognition(): void {
    if (!this.recognition) return;

    // Configuración optimizada para español
    this.recognition.lang = this.currentConfig.language;
    this.recognition.continuous = this.currentConfig.continuous;
    this.recognition.interimResults = this.currentConfig.interimResults;
    this.recognition.maxAlternatives = this.currentConfig.maxAlternatives;

    // Event handlers
    this.recognition.onstart = () => {
      this.log('Reconocimiento iniciado');
      this.setState('listening');
      this.currentCallbacks.onStart?.();
      
      // Configurar timeout
      if (this.currentConfig.timeout > 0) {
        this.recognitionTimeout = setTimeout(() => {
          this.log('Timeout alcanzado, deteniendo reconocimiento');
          this.stopListening();
        }, this.currentConfig.timeout);
      }
    };

    this.recognition.onresult = (event) => {
      this.setState('processing');
      
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 0.8;

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Procesar transcripción intermedia
      if (interimTranscript && this.currentConfig.interimResults) {
        const processed = this.postProcessTranscript(interimTranscript);
        this.currentCallbacks.onTranscript?.(processed.processed, processed.confidence);
      }

      // Procesar transcripción final
      if (finalTranscript) {
        const processed = this.postProcessTranscript(finalTranscript);
        this.lastTranscript = processed.processed;

        // Detectar comandos
        const commandDetection = this.detectCommand(processed.processed);
        if (commandDetection.isCommand && commandDetection.command) {
          this.currentCallbacks.onCommand?.(commandDetection.command, commandDetection.confidence);
        }

        this.currentCallbacks.onFinalTranscript?.(processed.processed, processed.confidence);
        this.log('Transcripción final:', { original: finalTranscript, processed: processed.processed });
      }
    };

    this.recognition.onerror = (event) => {
      this.log('Error de reconocimiento:', event.error);
      this.setState('error');
      
      const errorMessage = this.getErrorMessage(event.error);
      this.currentCallbacks.onError?.(errorMessage);

      // Auto-reparación en caso de errores específicos
      if (this.shouldAttemptRepair(event.error)) {
        this.attemptRepair();
      }
    };

    this.recognition.onend = () => {
      this.log('Reconocimiento terminado');
      this.setState('ready');
      this.currentCallbacks.onEnd?.();
      
      if (this.recognitionTimeout) {
        clearTimeout(this.recognitionTimeout);
        this.recognitionTimeout = null;
      }
    };
  }

  /**
   * Obtener mensaje de error legible
   */
  private getErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      'no-speech': 'No se detectó voz. Asegúrate de hablar claramente.',
      'audio-capture': 'Error al capturar audio. Verifica tu micrófono.',
      'not-allowed': 'Permisos de micrófono denegados. Permite el acceso al micrófono.',
      'network': 'Error de red. Verifica tu conexión a internet.',
      'service-not-allowed': 'Servicio de reconocimiento no permitido.',
      'bad-grammar': 'Error en la gramática de reconocimiento.',
      'language-not-supported': 'Idioma no soportado.'
    };

    return errorMessages[error] || `Error desconocido: ${error}`;
  }

  /**
   * Determinar si se debe intentar reparación automática
   */
  private shouldAttemptRepair(error: string): boolean {
    const repairableErrors = ['audio-capture', 'network', 'service-not-allowed'];
    return repairableErrors.includes(error) && this.repairAttempts < this.maxRepairAttempts;
  }

  /**
   * Intentar reparación automática
   */
  private async attemptRepair(): Promise<void> {
    this.repairAttempts++;
    this.setState('repairing');
    this.log(`Intentando reparación automática (intento ${this.repairAttempts}/${this.maxRepairAttempts})`);

    try {
      // Limpiar estado actual
      this.cleanup();
      
      // Esperar un momento antes de reinicializar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reinicializar
      const success = await this.initialize(this.currentConfig, this.currentCallbacks);
      
      if (success) {
        this.log('✅ Reparación automática exitosa');
        this.repairAttempts = 0;
      } else {
        this.log('❌ Reparación automática falló');
      }
    } catch (error) {
      this.log('❌ Error durante reparación automática:', error);
    }
  }

  /**
   * Inicializar el servicio
   */
  public async initialize(config: EnhancedVoiceConfig = {}, callbacks: VoiceCallbacks = {}): Promise<boolean> {
    try {
      this.setState('initializing');
      this.log('Inicializando servicio mejorado de voz...');

      // Verificar permisos
      const permissions = await this.checkPermissions();
      if (!permissions.speechRecognition) {
        throw new Error('Speech Recognition no está soportado en este navegador');
      }

      // Solicitar acceso exclusivo
      if (!voiceCoordinator.requestAccess('advanced')) {
        throw new Error('No se pudo obtener acceso exclusivo al reconocimiento de voz');
      }

      // Configurar servicio
      this.currentConfig = { ...this.currentConfig, ...config };
      this.currentCallbacks = callbacks;
      this.debug = this.currentConfig.enableDebug;

      // Crear instancia de reconocimiento
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      // Configurar reconocimiento
      this.setupRecognition();

      this.isInitialized = true;
      this.setState('ready');
      this.log('✅ Servicio mejorado de voz inicializado correctamente');

      return true;
    } catch (error) {
      this.log('❌ Error al inicializar servicio de voz:', error);
      this.setState('error');
      this.currentCallbacks.onError?.(error instanceof Error ? error.message : 'Error desconocido');
      return false;
    }
  }

  /**
   * Iniciar escucha
   */
  public startListening(): boolean {
    if (!this.isInitialized || !this.recognition) {
      this.log('❌ Servicio no inicializado');
      return false;
    }

    if (this.currentState === 'listening') {
      this.log('⚠️ Ya está escuchando');
      return true;
    }

    try {
      this.log('Iniciando escucha...');
      this.recognition.start();
      return true;
    } catch (error) {
      this.log('❌ Error al iniciar escucha:', error);
      this.currentCallbacks.onError?.(error instanceof Error ? error.message : 'Error al iniciar escucha');
      return false;
    }
  }

  /**
   * Detener escucha
   */
  public stopListening(): void {
    if (this.recognition && this.currentState === 'listening') {
      this.log('Deteniendo escucha...');
      this.recognition.stop();
    }

    if (this.recognitionTimeout) {
      clearTimeout(this.recognitionTimeout);
      this.recognitionTimeout = null;
    }
  }

  /**
   * Limpiar recursos
   */
  public cleanup(): void {
    this.log('Limpiando recursos...');
    
    this.stopListening();
    
    if (this.recognition) {
      this.recognition.onstart = null;
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.recognition = null;
    }

    voiceCoordinator.releaseAccess('advanced');
    this.isInitialized = false;
    this.setState('idle');
  }

  // Getters
  public getState(): EnhancedVoiceState { return this.currentState; }
  public isListening(): boolean { return this.currentState === 'listening'; }
  public isReady(): boolean { return this.currentState === 'ready'; }
  public getLastTranscript(): string { return this.lastTranscript; }
  public getTechnicalTerms(): TechnicalTerm[] { return this.technicalTerms; }
  public getRepairAttempts(): number { return this.repairAttempts; }
}

// Exportar instancia singleton
export const enhancedVoiceService = EnhancedVoiceService.getInstance();
