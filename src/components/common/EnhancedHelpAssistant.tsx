import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  X,
  Bot,
  Layers,
  Globe,
  Mic,
  MicOff,
  Upload,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Workflow,
  Shield,
  AlertTriangle,
  MessageSquare,
  Send,
  Download,
  Loader2,
  HelpCircle,
  Volume2,
  VolumeX,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Eye,
  Code,
  Monitor,
  Smartphone,
  Tablet,
  Home,
  Maximize2,
  Minimize2,
  Info,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  Navigation,
  Target,
  Compass
} from 'lucide-react';
import { useUnifiedVoice } from '../../hooks/useUnifiedVoice';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { tryWithFallback } from '../../services/ai';

// Tipos para el sistema de ayuda contextual
interface ContextualHelp {
  page: string;
  title: string;
  description: string;
  quickActions: QuickAction[];
  tutorials: Tutorial[];
  tips: ContextualTip[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
  category: 'navigation' | 'feature' | 'troubleshooting' | 'voice' | 'tutorial';
  priority: number;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  action?: string;
  element?: string;
  screenshot?: string;
}

interface ContextualTip {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'tip';
  icon: React.ReactNode;
  showOnce?: boolean;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: number;
  type?: 'text' | 'code' | 'suggestion' | 'tutorial';
  metadata?: {
    context?: string;
    confidence?: number;
    sources?: string[];
    model?: string;
    executionTime?: number;
    actions?: string[];
  };
}

interface VoiceCommand {
  command: string;
  action: () => void;
  description: string;
  category: 'navigation' | 'modal' | 'feature' | 'help';
}

interface EnhancedHelpAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWebPreview?: () => void;
  onOpenCodeCorrector?: () => void;
}

const EnhancedHelpAssistant: React.FC<EnhancedHelpAssistantProps> = ({
  isOpen,
  onClose,
  onOpenWebPreview,
  onOpenCodeCorrector
}) => {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [activeTab, setActiveTab] = useState<'help' | 'chat' | 'tutorials' | 'voice'>('help');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Estado del chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Estado de voz
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [autoPlaySpeech, setAutoPlaySpeech] = useState(false);
  const [showVoiceCommands, setShowVoiceCommands] = useState(false);

  // Estado de tutoriales
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);

  // Referencias
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Hook de reconocimiento de voz unificado con comandos específicos
  const {
    voiceState,
    isListening,
    isInitialized: isVoiceInitialized,
    error: voiceError,
    transcript,
    startListening,
    stopListening,
    resetTranscript
  } = useUnifiedVoice({
    onTranscript: (transcript: string) => {
      setInputValue(transcript);
      processVoiceCommand(transcript);
    },
    onFinalTranscript: (transcript: string) => {
      setInputValue(transcript);
      processVoiceCommand(transcript);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    enableDebug: true,
    componentName: 'EnhancedHelpAssistant',
    language: 'es-ES',
    autoInitialize: true,
    continuous: false,
    interimResults: true
  });

  // Hook de síntesis de voz mejorado
  const {
    isSupported: isSpeechSupported,
    isInitialized: isSpeechInitialized,
    speak,
    stop: stopSpeech,
    status: speechStatus,
    voices
  } = useSpeechSynthesis({
    componentName: 'EnhancedHelpAssistant-Speech',
    autoInitialize: true,
    defaultConfig: {
      rate: 0.9,
      pitch: 1.0,
      volume: 0.8,
      language: 'es-ES',
      enableHighlight: true
    }
  });

  // Detectar página actual y configurar contexto
  useEffect(() => {
    const path = location.pathname;
    let page = 'home';

    if (path.includes('/webai')) {
      page = 'webai';
    } else if (path.includes('/agent')) {
      page = 'agent';
    } else if (path.includes('/constructor')) {
      page = 'constructor';
    } else if (path.includes('/codecorrector')) {
      page = 'codecorrector';
    }

    setCurrentPage(page);
    console.log(`🎯 [EnhancedHelpAssistant] Página detectada: ${page}`);
  }, [location]);

  // Comandos de voz específicos para CODESTORM
  const getVoiceCommands = useCallback((): VoiceCommand[] => [
    {
      command: 'abrir vista previa web',
      action: () => onOpenWebPreview?.(),
      description: 'Abre el modal de vista previa web universal',
      category: 'modal'
    },
    {
      command: 'abrir corrector de código',
      action: () => onOpenCodeCorrector?.(),
      description: 'Abre el corrector de código multi-agente',
      category: 'modal'
    },
    {
      command: 'cerrar ayuda',
      action: () => onClose(),
      description: 'Cierra el asistente de ayuda',
      category: 'navigation'
    },
    {
      command: 'ir a chat',
      action: () => setActiveTab('chat'),
      description: 'Cambia a la pestaña de chat',
      category: 'navigation'
    },
    {
      command: 'ir a tutoriales',
      action: () => setActiveTab('tutorials'),
      description: 'Cambia a la pestaña de tutoriales',
      category: 'navigation'
    },
    {
      command: 'mostrar comandos de voz',
      action: () => setShowVoiceCommands(true),
      description: 'Muestra la lista de comandos de voz disponibles',
      category: 'help'
    },
    {
      command: 'pantalla completa',
      action: () => setIsFullscreen(!isFullscreen),
      description: 'Alterna el modo pantalla completa',
      category: 'feature'
    },
    {
      command: 'limpiar chat',
      action: () => setChatMessages([]),
      description: 'Limpia todos los mensajes del chat',
      category: 'feature'
    }
  ], [onOpenWebPreview, onOpenCodeCorrector, onClose, isFullscreen]);

  // Procesar comandos de voz
  const processVoiceCommand = useCallback((transcript: string) => {
    if (!voiceEnabled) return;

    const commands = getVoiceCommands();
    const normalizedTranscript = transcript.toLowerCase().trim();

    console.log(`🎤 [EnhancedHelpAssistant] Procesando comando: "${normalizedTranscript}"`);

    for (const command of commands) {
      if (normalizedTranscript.includes(command.command)) {
        console.log(`✅ [EnhancedHelpAssistant] Comando reconocido: ${command.command}`);
        command.action();

        // Feedback visual y auditivo
        if (speechEnabled) {
          speak(`Ejecutando: ${command.description}`);
        }

        // Limpiar transcript después de ejecutar comando
        setTimeout(() => {
          resetTranscript();
          setInputValue('');
        }, 1000);

        return;
      }
    }

    // Si no es un comando específico, mantener como entrada de chat
    console.log(`💬 [EnhancedHelpAssistant] Texto para chat: "${normalizedTranscript}"`);
  }, [voiceEnabled, speechEnabled, getVoiceCommands, speak, resetTranscript]);

  // Obtener ayuda contextual según la página actual
  const getContextualHelp = useCallback((): ContextualHelp => {
    const baseHelp = {
      quickActions: [
        {
          id: 'voice-setup',
          label: 'Configurar reconocimiento de voz',
          icon: <Mic className="w-4 h-4" />,
          prompt: 'Ayúdame a configurar y optimizar el sistema de reconocimiento de voz en español de CODESTORM.',
          category: 'voice' as const,
          priority: 1
        },
        {
          id: 'troubleshooting',
          label: 'Solucionar problemas',
          icon: <AlertTriangle className="w-4 h-4" />,
          prompt: 'Tengo un problema con CODESTORM. ¿Puedes ayudarme a diagnosticar y solucionarlo paso a paso?',
          category: 'troubleshooting' as const,
          priority: 2
        }
      ],
      tips: [
        {
          id: 'voice-tip',
          title: 'Comandos de Voz',
          content: 'Usa comandos como "abrir vista previa web" o "mostrar comandos de voz" para navegar rápidamente.',
          type: 'tip' as const,
          icon: <Mic className="w-4 h-4" />
        }
      ]
    };

    switch (currentPage) {
      case 'webai':
        return {
          page: 'webai',
          title: 'WebAI - Constructor de Sitios Web',
          description: 'Crea sitios web completos con HTML, CSS y JavaScript usando IA avanzada.',
          quickActions: [
            ...baseHelp.quickActions,
            {
              id: 'webai-tutorial',
              label: 'Tutorial de WebAI',
              icon: <Globe className="w-4 h-4" />,
              prompt: 'Enséñame cómo crear un sitio web completo usando WebAI paso a paso.',
              category: 'tutorial' as const,
              priority: 1
            },
            {
              id: 'web-preview',
              label: 'Usar vista previa web',
              icon: <Monitor className="w-4 h-4" />,
              prompt: 'Explícame cómo usar el modal de vista previa web para ver mis sitios en tiempo real.',
              category: 'feature' as const,
              priority: 2
            }
          ],
          tutorials: [
            {
              id: 'webai-basic',
              title: 'Crear tu primer sitio web',
              description: 'Aprende a crear un sitio web completo desde cero',
              estimatedTime: '10 minutos',
              difficulty: 'beginner' as const,
              steps: [
                {
                  id: 'step1',
                  title: 'Describir el sitio web',
                  description: 'Escribe una descripción detallada del sitio que quieres crear',
                  action: 'Usa el chat para describir tu sitio web ideal'
                },
                {
                  id: 'step2',
                  title: 'Generar el código',
                  description: 'WebAI generará automáticamente HTML, CSS y JavaScript',
                  action: 'Espera a que se genere el código completo'
                },
                {
                  id: 'step3',
                  title: 'Vista previa',
                  description: 'Usa el botón flotante 🌐 para ver tu sitio en acción',
                  action: 'Haz clic en el botón de vista previa web'
                }
              ]
            }
          ],
          tips: [
            ...baseHelp.tips,
            {
              id: 'webai-tip',
              title: 'Vista Previa Web',
              content: 'El botón flotante 🌐 aparece automáticamente cuando tienes archivos web. Úsalo para ver tu sitio en diferentes dispositivos.',
              type: 'info' as const,
              icon: <Monitor className="w-4 h-4" />
            }
          ]
        };

      case 'agent':
        return {
          page: 'agent',
          title: 'Agent - Sistema Multi-Agente',
          description: 'Gestiona proyectos complejos con el sistema de agentes especializados de CODESTORM.',
          quickActions: [
            ...baseHelp.quickActions,
            {
              id: 'agent-tutorial',
              label: 'Tutorial del sistema Agent',
              icon: <Bot className="w-4 h-4" />,
              prompt: 'Explícame cómo funciona el sistema de agentes especializados y cómo usarlo efectivamente.',
              category: 'tutorial' as const,
              priority: 1
            },
            {
              id: 'code-corrector',
              label: 'Usar corrector de código',
              icon: <Code className="w-4 h-4" />,
              prompt: 'Enséñame a usar el corrector de código multi-agente para mejorar mi código.',
              category: 'feature' as const,
              priority: 2
            }
          ],
          tutorials: [
            {
              id: 'agent-workflow',
              title: 'Flujo de trabajo con agentes',
              description: 'Aprende a coordinar múltiples agentes para proyectos complejos',
              estimatedTime: '15 minutos',
              difficulty: 'intermediate' as const,
              steps: [
                {
                  id: 'step1',
                  title: 'Cargar proyecto',
                  description: 'Carga o crea un nuevo proyecto en el sistema Agent',
                  action: 'Usa el explorador de archivos para cargar tu proyecto'
                },
                {
                  id: 'step2',
                  title: 'Configurar agentes',
                  description: 'Selecciona qué agentes necesitas para tu proyecto',
                  action: 'Revisa la lista de agentes disponibles'
                },
                {
                  id: 'step3',
                  title: 'Ejecutar plan',
                  description: 'Deja que los agentes trabajen coordinadamente',
                  action: 'Inicia la ejecución del plan de desarrollo'
                }
              ]
            }
          ],
          tips: [
            ...baseHelp.tips,
            {
              id: 'agent-tip',
              title: 'Corrector Multi-Agente',
              content: 'Haz clic en "Corregir Código" en cualquier archivo para usar el sistema de 3 agentes especializados.',
              type: 'success' as const,
              icon: <Zap className="w-4 h-4" />
            }
          ]
        };

      default:
        return {
          page: 'home',
          title: 'CODESTORM - Inicio',
          description: 'Plataforma de desarrollo autónomo impulsada por IA desarrollada por BOTIDINAMIX AI.',
          quickActions: [
            ...baseHelp.quickActions,
            {
              id: 'getting-started',
              label: 'Primeros pasos',
              icon: <Play className="w-4 h-4" />,
              prompt: 'Soy nuevo en CODESTORM. ¿Puedes darme una guía completa para empezar?',
              category: 'tutorial' as const,
              priority: 1
            },
            {
              id: 'features-overview',
              label: 'Funcionalidades principales',
              icon: <Layers className="w-4 h-4" />,
              prompt: 'Explícame todas las funcionalidades principales de CODESTORM y cómo usarlas.',
              category: 'feature' as const,
              priority: 2
            }
          ],
          tutorials: [
            {
              id: 'codestorm-intro',
              title: 'Introducción a CODESTORM',
              description: 'Conoce las funcionalidades principales de la plataforma',
              estimatedTime: '5 minutos',
              difficulty: 'beginner' as const,
              steps: [
                {
                  id: 'step1',
                  title: 'Explorar la interfaz',
                  description: 'Familiarízate con la navegación y los botones flotantes',
                  action: 'Observa los elementos de la interfaz principal'
                },
                {
                  id: 'step2',
                  title: 'Probar reconocimiento de voz',
                  description: 'Activa el micrófono y prueba comandos básicos',
                  action: 'Di "mostrar comandos de voz" para ver opciones'
                },
                {
                  id: 'step3',
                  title: 'Navegar entre páginas',
                  description: 'Explora WebAI, Agent y otras secciones',
                  action: 'Usa el menú de navegación principal'
                }
              ]
            }
          ],
          tips: [
            ...baseHelp.tips,
            {
              id: 'navigation-tip',
              title: 'Navegación Rápida',
              content: 'Usa los botones flotantes en la esquina inferior derecha para acceder rápidamente a funcionalidades.',
              type: 'info' as const,
              icon: <Navigation className="w-4 h-4" />
            }
          ]
        };
    }
  }, [currentPage]);

  // Generar respuesta del asistente con contexto mejorado
  const generateAssistantResponse = useCallback(async (userInput: string): Promise<ChatMessage> => {
    const contextualHelp = getContextualHelp();
    const startTime = Date.now();

    const systemPrompt = `Eres el Asistente Técnico Avanzado de CODESTORM desarrollado por BOTIDINAMIX AI.

CONTEXTO ACTUAL:
- Página: ${contextualHelp.title}
- Descripción: ${contextualHelp.description}
- Usuario en: ${currentPage}

FUNCIONALIDADES NUEVAS IMPORTANTES:
🌐 MODAL DE VISTA PREVIA WEB UNIVERSAL:
- Botón flotante inteligente que aparece automáticamente con archivos web
- Renderizado real de HTML + CSS + JavaScript en iframe sandbox
- Controles responsivos: desktop (100%), tablet (768px), móvil (375px)
- Actualización automática al modificar archivos
- Disponible en TODAS las páginas: Home, WebAI, Agent
- Comandos de voz: "abrir vista previa web"

🔧 CORRECTOR DE CÓDIGO MULTI-AGENTE MEJORADO:
- Sistema de 3 agentes especializados: Analizador, Detector, Generador
- Interfaz completamente responsiva para móviles, tablets y desktop
- Instrucciones en lenguaje natural en español
- Panel móvil con botón hamburguesa para pantallas pequeñas
- Editor dual con diff viewer y aplicación selectiva de cambios
- Comandos de voz: "abrir corrector de código"

🎤 RECONOCIMIENTO DE VOZ OPTIMIZADO:
- Configuración específica para español (es-ES) con máxima precisión
- Comandos específicos: "abrir vista previa web", "abrir corrector de código", "cerrar ayuda"
- Integrado en TODAS las páginas con coordinación centralizada
- Auto-reparación automática y diagnóstico visual
- Feedback visual cuando está activo

📱 RESPONSIVIDAD UNIVERSAL:
- Todos los modales adaptados para cualquier tamaño de pantalla
- Breakpoints: móvil (<640px), tablet (640-1024px), desktop (>1024px)
- Navegación optimizada para dispositivos táctiles

INSTRUCCIONES:
- Responde SIEMPRE en español con terminología técnica precisa
- Usa formato markdown para estructurar respuestas
- Incluye emojis relevantes para mejorar legibilidad
- Proporciona ejemplos prácticos y pasos detallados
- Menciona comandos de voz cuando sea relevante
- Para problemas técnicos, ofrece soluciones paso a paso
- Enfócate en las nuevas funcionalidades si son relevantes

CONSULTA: ${userInput}`;

    try {
      console.log('🤖 [EnhancedHelpAssistant] Generando respuesta con IA...');
      const response = await tryWithFallback(systemPrompt, 'Gemini 2.5 Flash');

      if (response.error) {
        throw new Error(response.error);
      }

      const executionTime = Date.now() - startTime;
      console.log(`✅ [EnhancedHelpAssistant] Respuesta generada en ${executionTime}ms`);

      return {
        id: `assistant-${Date.now()}`,
        content: response.content,
        sender: 'assistant',
        timestamp: Date.now(),
        type: 'text',
        metadata: {
          context: currentPage,
          confidence: 0.95,
          sources: ['CODESTORM Knowledge Base', 'BOTIDINAMIX AI', 'IA Real'],
          model: response.model,
          executionTime,
          actions: extractActions(response.content)
        }
      };

    } catch (error) {
      console.error('❌ [EnhancedHelpAssistant] Error:', error);

      return {
        id: `error-${Date.now()}`,
        content: `❌ **Error de Conexión**\n\nNo pude conectar con el servicio de IA.\n\n**🔧 Soluciones:**\n• Verifica tu conexión a internet\n• Refresca la página\n• Intenta usar comandos de voz\n\n**💡 Comandos disponibles:**\n• "abrir vista previa web"\n• "abrir corrector de código"\n• "mostrar comandos de voz"`,
        sender: 'assistant',
        timestamp: Date.now(),
        type: 'text',
        metadata: {
          context: currentPage,
          confidence: 0.1,
          sources: ['Sistema de Fallback'],
          model: 'Fallback'
        }
      };
    }
  }, [currentPage, getContextualHelp]);

  // Extraer acciones sugeridas del contenido de respuesta
  const extractActions = (content: string): string[] => {
    const actions: string[] = [];

    if (content.includes('vista previa web')) {
      actions.push('open-web-preview');
    }
    if (content.includes('corrector de código')) {
      actions.push('open-code-corrector');
    }
    if (content.includes('comandos de voz')) {
      actions.push('show-voice-commands');
    }

    return actions;
  };

  // Manejar envío de mensaje
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: inputValue.trim(),
      sender: 'user',
      timestamp: Date.now(),
      type: 'text'
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    setIsTyping(true);

    try {
      const assistantMessage = await generateAssistantResponse(userMessage.content);

      setChatMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
      setIsProcessing(false);

      // Auto-reproducir respuesta si está habilitado
      if (autoPlaySpeech && speechEnabled && assistantMessage.content) {
        speak(assistantMessage.content);
      }

      // Scroll al final
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);

    } catch (error) {
      console.error('❌ [EnhancedHelpAssistant] Error al procesar mensaje:', error);
      setIsTyping(false);
      setIsProcessing(false);
    }
  }, [inputValue, isProcessing, generateAssistantResponse, autoPlaySpeech, speechEnabled, speak]);

  // Manejar acción rápida
  const handleQuickAction = useCallback((action: QuickAction) => {
    setInputValue(action.prompt);
    setActiveTab('chat');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Manejar tecla Enter
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Inicializar mensaje de bienvenida
  useEffect(() => {
    if (isOpen && chatMessages.length === 0) {
      const contextualHelp = getContextualHelp();
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        content: `¡Hola! 👋 Soy tu asistente técnico de CODESTORM.\n\nEstás en: **${contextualHelp.title}**\n${contextualHelp.description}\n\n**🎤 Comandos de voz disponibles:**\n• "abrir vista previa web" - Abre el modal de vista previa\n• "abrir corrector de código" - Abre el corrector multi-agente\n• "mostrar comandos de voz" - Ver todos los comandos\n\n**💡 Tip:** Puedes usar tanto texto como voz para interactuar conmigo.`,
        sender: 'assistant',
        timestamp: Date.now(),
        type: 'text',
        metadata: {
          context: currentPage,
          confidence: 1.0,
          sources: ['Sistema de Bienvenida']
        }
      };

      setChatMessages([welcomeMessage]);
    }
  }, [isOpen, currentPage, getContextualHelp, chatMessages.length]);

  if (!isOpen) return null;

  const contextualHelp = getContextualHelp();

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-2 sm:p-4`}
      style={{ zIndex: 9999 }}
    >
      <div className={`bg-codestorm-dark rounded-lg shadow-xl border border-codestorm-blue/30 ${
        isFullscreen
          ? 'w-full h-full'
          : 'w-full max-w-[95vw] xl:max-w-5xl h-[95vh] max-h-[800px]'
      } flex flex-col overflow-hidden`}>

        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-codestorm-blue/30 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-codestorm-accent flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-white truncate">
                Asistente de CODESTORM
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 truncate">{contextualHelp.title}</p>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Indicador de voz */}
            {isVoiceInitialized && (
              <div className={`p-1.5 sm:p-2 rounded transition-colors ${
                isListening
                  ? 'bg-red-500/20 text-red-400'
                  : voiceEnabled
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
              }`}>
                {isListening ? (
                  <Mic className="w-4 h-4 animate-pulse" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )}
              </div>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded transition-colors"
              title={isFullscreen ? 'Ventana' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-codestorm-blue/30 flex-shrink-0">
          {[
            { id: 'help', label: 'Ayuda', icon: <HelpCircle className="w-4 h-4" /> },
            { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'tutorials', label: 'Tutoriales', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'voice', label: 'Voz', icon: <Mic className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-codestorm-blue/20 text-white border-b-2 border-codestorm-accent'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'help' && (
            <div className="h-full overflow-y-auto p-4 space-y-4">
              {/* Acciones rápidas */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Zap className="w-5 h-5 text-codestorm-accent mr-2" />
                  Acciones Rápidas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {contextualHelp.quickActions
                    .sort((a, b) => a.priority - b.priority)
                    .map(action => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      className="p-3 bg-codestorm-darker border border-codestorm-blue/30 rounded-lg hover:bg-codestorm-blue/10 transition-colors text-left group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-codestorm-accent group-hover:text-white transition-colors">
                          {action.icon}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{action.label}</div>
                          <div className="text-gray-400 text-xs mt-1 capitalize">{action.category}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tips contextuales */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Lightbulb className="w-5 h-5 text-codestorm-accent mr-2" />
                  Tips Contextuales
                </h3>
                <div className="space-y-3">
                  {contextualHelp.tips.map(tip => (
                    <div
                      key={tip.id}
                      className={`p-3 rounded-lg border ${
                        tip.type === 'info' ? 'bg-blue-500/10 border-blue-500/30 text-blue-200' :
                        tip.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200' :
                        tip.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-200' :
                        'bg-purple-500/10 border-purple-500/30 text-purple-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {tip.icon}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{tip.title}</div>
                          <div className="text-xs mt-1 opacity-90">{tip.content}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="h-full flex flex-col">
              {/* Chat messages */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {chatMessages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-codestorm-accent text-white'
                        : 'bg-codestorm-darker border border-codestorm-blue/30 text-gray-200'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      {message.metadata && (
                        <div className="mt-2 text-xs opacity-70 flex items-center space-x-2">
                          <span>{message.metadata.model}</span>
                          {message.metadata.executionTime && (
                            <span>• {message.metadata.executionTime}ms</span>
                          )}
                          {message.metadata.confidence && (
                            <span>• {Math.round(message.metadata.confidence * 100)}%</span>
                          )}
                        </div>
                      )}
                      {/* Botones de acción */}
                      {message.metadata?.actions && message.metadata.actions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.metadata.actions.map(action => (
                            <button
                              key={action}
                              onClick={() => {
                                if (action === 'open-web-preview') onOpenWebPreview?.();
                                if (action === 'open-code-corrector') onOpenCodeCorrector?.();
                                if (action === 'show-voice-commands') setShowVoiceCommands(true);
                              }}
                              className="px-2 py-1 text-xs bg-codestorm-blue/20 hover:bg-codestorm-blue/30 rounded transition-colors"
                            >
                              {action === 'open-web-preview' && '🌐 Vista Previa'}
                              {action === 'open-code-corrector' && '🔧 Corrector'}
                              {action === 'show-voice-commands' && '🎤 Comandos'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-codestorm-darker border border-codestorm-blue/30 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-codestorm-accent" />
                        <span className="text-sm text-gray-400">Escribiendo...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat input */}
              <div className="border-t border-codestorm-blue/30 p-4 flex-shrink-0">
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Escribe tu pregunta o usa comandos de voz..."
                      className="w-full px-3 py-2 bg-codestorm-darker border border-codestorm-blue/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-codestorm-accent resize-none"
                      rows={2}
                      disabled={isProcessing}
                    />
                    {transcript && (
                      <div className="absolute bottom-full left-0 right-0 mb-1 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-200 text-xs">
                        🎤 {transcript}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={isListening ? stopListening : startListening}
                      disabled={!isVoiceInitialized}
                      className={`p-2 rounded transition-colors ${
                        isListening
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : isVoiceInitialized
                            ? 'bg-codestorm-blue hover:bg-codestorm-blue/80 text-white'
                            : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      }`}
                      title={isListening ? 'Detener grabación' : 'Iniciar grabación de voz'}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isProcessing}
                      className="p-2 bg-codestorm-accent hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded transition-colors"
                      title="Enviar mensaje"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {voiceError && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-200 text-xs">
                    ⚠️ Error de voz: {voiceError}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tutorials' && (
            <div className="h-full overflow-y-auto p-4 space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <BookOpen className="w-5 h-5 text-codestorm-accent mr-2" />
                Tutoriales Disponibles
              </h3>

              <div className="space-y-3">
                {contextualHelp.tutorials.map(tutorial => (
                  <div
                    key={tutorial.id}
                    className="p-4 bg-codestorm-darker border border-codestorm-blue/30 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-white font-medium">{tutorial.title}</h4>
                        <p className="text-gray-400 text-sm mt-1">{tutorial.description}</p>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span>{tutorial.estimatedTime}</span>
                        <span className={`px-2 py-1 rounded ${
                          tutorial.difficulty === 'beginner' ? 'bg-green-500/20 text-green-300' :
                          tutorial.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {tutorial.difficulty}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {tutorial.steps.map((step, index) => (
                        <div
                          key={step.id}
                          className="flex items-start space-x-3 p-2 rounded hover:bg-codestorm-blue/10 transition-colors"
                        >
                          <div className="flex-shrink-0 w-6 h-6 bg-codestorm-accent text-white rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium">{step.title}</div>
                            <div className="text-gray-400 text-xs mt-1">{step.description}</div>
                            {step.action && (
                              <div className="text-codestorm-accent text-xs mt-1">💡 {step.action}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setActiveTutorial(tutorial);
                        setCurrentStep(0);
                      }}
                      className="mt-3 w-full px-4 py-2 bg-codestorm-accent hover:bg-blue-600 text-white rounded transition-colors text-sm"
                    >
                      Iniciar Tutorial
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="h-full overflow-y-auto p-4 space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <Mic className="w-5 h-5 text-codestorm-accent mr-2" />
                Configuración de Voz
              </h3>

              {/* Estado de voz */}
              <div className="p-4 bg-codestorm-darker border border-codestorm-blue/30 rounded-lg">
                <h4 className="text-white font-medium mb-3">Estado del Sistema</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reconocimiento:</span>
                    <span className={isVoiceInitialized ? 'text-green-400' : 'text-red-400'}>
                      {isVoiceInitialized ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Síntesis:</span>
                    <span className={isSpeechSupported ? 'text-green-400' : 'text-red-400'}>
                      {isSpeechSupported ? '✅ Disponible' : '❌ No disponible'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estado:</span>
                    <span className="text-white capitalize">{voiceState}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Escuchando:</span>
                    <span className={isListening ? 'text-red-400' : 'text-gray-400'}>
                      {isListening ? '🎤 Activo' : '🔇 Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comandos de voz */}
              <div className="p-4 bg-codestorm-darker border border-codestorm-blue/30 rounded-lg">
                <h4 className="text-white font-medium mb-3">Comandos Disponibles</h4>
                <div className="space-y-2">
                  {getVoiceCommands().map(command => (
                    <div
                      key={command.command}
                      className="flex items-start space-x-3 p-2 rounded hover:bg-codestorm-blue/10 transition-colors"
                    >
                      <div className="text-codestorm-accent text-sm font-mono">
                        "{command.command}"
                      </div>
                      <div className="text-gray-400 text-xs">
                        {command.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Configuración */}
              <div className="p-4 bg-codestorm-darker border border-codestorm-blue/30 rounded-lg">
                <h4 className="text-white font-medium mb-3">Configuración</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={voiceEnabled}
                      onChange={(e) => setVoiceEnabled(e.target.checked)}
                      className="rounded border-codestorm-blue/30 bg-codestorm-darker text-codestorm-accent focus:ring-codestorm-accent"
                    />
                    <span className="text-white text-sm">Habilitar reconocimiento de voz</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={speechEnabled}
                      onChange={(e) => setSpeechEnabled(e.target.checked)}
                      className="rounded border-codestorm-blue/30 bg-codestorm-darker text-codestorm-accent focus:ring-codestorm-accent"
                    />
                    <span className="text-white text-sm">Habilitar síntesis de voz</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={autoPlaySpeech}
                      onChange={(e) => setAutoPlaySpeech(e.target.checked)}
                      className="rounded border-codestorm-blue/30 bg-codestorm-darker text-codestorm-accent focus:ring-codestorm-accent"
                    />
                    <span className="text-white text-sm">Reproducir respuestas automáticamente</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedHelpAssistant;