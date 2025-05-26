import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  X,
  Bot,
  Layers,
  Globe,
  Mic,
  Upload,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Workflow,
  Shield,
  AlertTriangle,
  MessageSquare,
  Send,
  Copy,
  Download,
  MicOff,
  Loader2,
  HelpCircle
} from 'lucide-react';
import DocumentUploader from './DocumentUploader';
import VoiceStateIndicator from './VoiceStateIndicator';
import { useUnifiedVoice } from '../hooks/useUnifiedVoice';
import { tryWithFallback } from '../services/ai';

// Tipos para las secciones de ayuda
interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: HelpContent[];
  isExpanded?: boolean;
}

interface HelpContent {
  type: 'text' | 'list' | 'steps' | 'warning' | 'tip';
  content: string | string[];
  icon?: React.ReactNode;
}

// Tipos para el sistema de chat
interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: number;
  type?: 'text' | 'code' | 'suggestion';
  metadata?: {
    context?: string;
    confidence?: number;
    sources?: string[];
    model?: string;
    executionTime?: number;
  };
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
  category: 'general' | 'agents' | 'voice' | 'documents' | 'troubleshooting';
}

interface HelpAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const CodestormHelpAssistant: React.FC<HelpAssistantProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview']);
  const [currentPage, setCurrentPage] = useState<string>('main');

  // Estado del chat
  const [activeTab, setActiveTab] = useState<'help' | 'chat'>('help');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Hook de reconocimiento de voz unificado
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
    },
    onFinalTranscript: (transcript: string) => {
      setInputValue(transcript);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    enableDebug: true,
    componentName: 'HelpAssistant-Chat',
    language: 'es-ES',
    autoInitialize: true
  });

  // Detectar la página actual
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/constructor')) {
      setCurrentPage('constructor');
    } else if (path.includes('/codecorrector')) {
      setCurrentPage('codecorrector');
    } else if (path.includes('/webai')) {
      setCurrentPage('webai');
    } else {
      setCurrentPage('main');
    }
  }, [location]);

  // Función para alternar secciones expandidas
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Acciones rápidas del chat
  const getQuickActions = (): QuickAction[] => [
    {
      id: 'agents-overview',
      label: '¿Cómo funcionan los agentes?',
      icon: <Layers className="w-4 h-4" />,
      prompt: 'Explícame cómo funcionan los 9 agentes especializados de CODESTORM y cómo trabajan coordinadamente.',
      category: 'agents'
    },
    {
      id: 'voice-setup',
      label: 'Configurar reconocimiento de voz',
      icon: <Mic className="w-4 h-4" />,
      prompt: 'Ayúdame a configurar y usar el sistema de reconocimiento de voz en español de CODESTORM.',
      category: 'voice'
    },
    {
      id: 'document-upload',
      label: 'Cómo cargar documentos',
      icon: <Upload className="w-4 h-4" />,
      prompt: 'Explícame cómo cargar y procesar documentos en CODESTORM, qué formatos soporta y cómo se procesan.',
      category: 'documents'
    },
    {
      id: 'troubleshooting',
      label: 'Solucionar problemas',
      icon: <AlertTriangle className="w-4 h-4" />,
      prompt: 'Tengo un problema con CODESTORM. ¿Puedes ayudarme a diagnosticar y solucionarlo?',
      category: 'troubleshooting'
    },
    {
      id: 'workflow-help',
      label: 'Flujo de trabajo iterativo',
      icon: <Workflow className="w-4 h-4" />,
      prompt: 'Explícame el sistema de "Perfeccionamiento Iterativo Guiado por IA" y cómo usarlo efectivamente.',
      category: 'general'
    },
    {
      id: 'mobile-optimization',
      label: 'Uso en móviles',
      icon: <Shield className="w-4 h-4" />,
      prompt: 'Ayúdame a optimizar mi experiencia de uso de CODESTORM en dispositivos móviles.',
      category: 'general'
    }
  ];

  // Función para generar respuestas del asistente especializado
  const generateAssistantResponse = async (userInput: string, context: string): Promise<{
    content: string;
    type?: 'text' | 'code' | 'suggestion';
    metadata?: {
      context?: string;
      confidence?: number;
      sources?: string[];
      model?: string;
      executionTime?: number;
    };
  }> => {
    // Prompt profesional especializado para el asistente CODESTORM
    const systemPrompt = `Eres el Especialista Técnico de CODESTORM desarrollado por BOTIDINAMIX AI. Tu rol es ser un experto completo en el sistema CODESTORM y proporcionar ayuda técnica precisa y profesional.

CONOCIMIENTO ESPECIALIZADO COMPLETO:

🤖 SISTEMA DE AGENTES ESPECIALIZADOS:
- Agente de Planificación: Analiza requisitos y crea planes de desarrollo estructurados
- Agente de Generación de Código: Crea código basado en especificaciones técnicas precisas
- Agente de Sincronización: Mantiene consistencia entre archivos y dependencias
- Agente de Modificación: Aplica cambios y mejoras al código existente
- Agente de Observación: Monitorea cambios y dependencias en tiempo real
- Agente de Distribución: Organiza y estructura archivos del proyecto
- Agente de Seguimiento: Rastrea progreso y validaciones de cada etapa
- Agente Lector: Analiza y comprende código existente para contexto
- Agente Diseñador: Crea interfaces y componentes visuales

🎤 SISTEMA DE RECONOCIMIENTO DE VOZ:
- Optimizado específicamente para español (es-ES)
- Utiliza API nativa Speech Recognition del navegador
- VoiceCoordinator para evitar conflictos entre múltiples instancias
- UnifiedVoiceService para coordinación centralizada
- Configuración avanzada con validación de idioma
- Integrado en todas las páginas: Constructor, WebAI, CodeCorrector, HelpAssistant

📄 SISTEMA DE CARGA DE DOCUMENTOS:
- Formatos soportados: PDF, TXT, DOC, DOCX, MD
- Procesamiento inteligente con extracción de contenido relevante
- Generación automática de prompts contextuales
- Análisis de código en documentos técnicos
- Tamaño máximo: 5MB por archivo

🏗️ ARQUITECTURA Y FLUJO DE TRABAJO:
- Sistema de "Perfeccionamiento Iterativo Guiado por IA"
- Validación obligatoria del usuario entre etapas
- Chat interactivo en tiempo real con IA real (no simulada)
- Vista previa en tiempo real con renderizado automático
- Diseño futurista azul oscuro consistente

📱 PÁGINAS ESPECIALIZADAS:
- Constructor: Desarrollo iterativo con chat avanzado y agentes coordinados
- WebAI: Creación de páginas web estáticas HTML/CSS puro sin frameworks
- CodeCorrector: Análisis automático y reparación de código con agente especializado
- Principal: Desarrollo autónomo con sistema multi-agente completo

🔧 OPTIMIZACIÓN MÓVIL:
- Elementos táctiles mínimo 44px para fácil interacción
- Tiempo de respuesta <100ms para feedback inmediato
- Funciones accesibles con una mano
- Gestos táctiles intuitivos
- Interfaz responsive automática

CONTEXTO ACTUAL: ${context === 'constructor' ? 'Página Constructor - Desarrollo Iterativo con chat avanzado y agentes especializados coordinados' :
                   context === 'codecorrector' ? 'Página CodeCorrector - Análisis automático y reparación de código con agente especializado' :
                   context === 'webai' ? 'Página WebAI - Creación de páginas web estáticas HTML/CSS puro sin frameworks' :
                   'Página Principal - Desarrollo Autónomo con sistema multi-agente completo'}

INSTRUCCIONES ESPECÍFICAS:
- Responde SIEMPRE en español con terminología técnica precisa
- Usa formato markdown para estructurar las respuestas
- Incluye emojis relevantes para mejorar la legibilidad
- Proporciona ejemplos prácticos y pasos detallados cuando sea relevante
- Mantén un tono profesional pero accesible
- Incluye información contextual específica según la página actual
- Para problemas técnicos, ofrece soluciones paso a paso numeradas
- Menciona BOTIDINAMIX AI como desarrollador cuando sea apropiado
- Si la consulta es sobre funcionalidades específicas, explica cómo usarlas en el contexto actual
- Para troubleshooting, proporciona múltiples opciones de solución

CONSULTA DEL USUARIO: ${userInput}`;

    const startTime = Date.now();

    try {
      // Llamar a la API real usando tryWithFallback
      console.log('🤖 [HelpAssistant] Generando respuesta con IA real...');
      const response = await tryWithFallback(systemPrompt, 'Gemini 2.5');

      if (response.error) {
        throw new Error(response.error);
      }

      const executionTime = Date.now() - startTime;
      console.log(`✅ [HelpAssistant] Respuesta generada en ${executionTime}ms con modelo ${response.model}`);

      return {
        content: response.content,
        type: 'text',
        metadata: {
          context,
          confidence: 0.95,
          sources: ['CODESTORM Knowledge Base', 'BOTIDINAMIX AI Documentation', 'IA Real'],
          model: response.model,
          executionTime
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('❌ [HelpAssistant] Error al generar respuesta:', error);

      // Respuesta de fallback en caso de error de API
      const fallbackResponse = `❌ **Error de Conexión con IA**

Lo siento, no pude conectar con el servicio de IA en este momento.

**🔧 Posibles soluciones:**
• Verifica tu conexión a internet
• Refresca la página e intenta nuevamente
• Si el problema persiste, contacta al soporte técnico

**💡 Mientras tanto, puedes:**
• Usar las acciones rápidas para consultas comunes
• Revisar las guías de ayuda en la pestaña correspondiente
• Cargar documentos para análisis offline

**🆘 Soporte:**
BOTIDINAMIX AI - Soporte técnico disponible 24/7

Error técnico: ${error instanceof Error ? error.message : 'Error desconocido'}`;

      return {
        content: fallbackResponse,
        type: 'text',
        metadata: {
          context,
          confidence: 0.1,
          sources: ['Sistema de Fallback'],
          model: 'Fallback',
          executionTime
        }
      };
    }
  };

  // Funciones del chat
  const handleSendMessage = async () => {
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
      // Generar respuesta real del asistente especializado
      const response = await generateAssistantResponse(userMessage.content, currentPage);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        content: response.content,
        sender: 'assistant',
        timestamp: Date.now(),
        type: response.type || 'text',
        metadata: response.metadata
      };

      // Añadir respuesta inmediatamente (sin simulación de tiempo)
      setChatMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
      setIsProcessing(false);

      // Scroll al final del chat
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }

    } catch (error) {
      console.error('❌ [HelpAssistant] Error al procesar mensaje:', error);

      // Crear mensaje de error para mostrar al usuario
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: `❌ **Error al procesar tu consulta**\n\nOcurrió un error inesperado. Por favor, intenta nuevamente o contacta al soporte técnico.\n\nError: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        sender: 'assistant',
        timestamp: Date.now(),
        type: 'text',
        metadata: {
          context: currentPage,
          confidence: 0,
          sources: ['Sistema de Error'],
          model: 'Error Handler'
        }
      };

      setChatMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
      setIsProcessing(false);
    }
  };

  const handleDocumentProcessed = (content: string, fileName: string) => {
    const documentMessage = `He cargado el documento "${fileName}". Aquí está el contenido:\n\n${content}\n\nPor favor, analiza este contenido en el contexto de CODESTORM y ayúdame según lo que necesite.`;
    setInputValue(documentMessage);
  };

  const handleQuickAction = (action: QuickAction) => {
    setInputValue(action.prompt);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const exportConversation = () => {
    const conversation = chatMessages.map(msg =>
      `[${new Date(msg.timestamp).toLocaleString()}] ${msg.sender.toUpperCase()}: ${msg.content}`
    ).join('\n\n');

    const blob = new Blob([conversation], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codestorm-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Configuración de contenido de ayuda según la página actual
  const getHelpSections = (): HelpSection[] => {
    const commonSections: HelpSection[] = [
      {
        id: 'overview',
        title: 'Visión General de CODESTORM',
        icon: <Bot className="w-5 h-5 text-codestorm-accent" />,
        content: [
          {
            type: 'text' as const,
            content: 'CODESTORM es un asistente de desarrollo autónomo desarrollado por BOTIDINAMIX AI que utiliza múltiples agentes especializados para crear, modificar y optimizar código de manera inteligente.'
          },
          {
            type: 'list' as const,
            content: [
              'Sistema de agentes coordinados (Planificación, Generación, Modificación, etc.)',
              'Reconocimiento de voz en español integrado',
              'Carga y procesamiento inteligente de documentos',
              'Vista previa en tiempo real',
              'Arquitectura modular y escalable'
            ]
          }
        ]
      },
      {
        id: 'agents',
        title: 'Sistema de Agentes Especializados',
        icon: <Layers className="w-5 h-5 text-codestorm-accent" />,
        content: [
          {
            type: 'text' as const,
            content: 'CODESTORM utiliza 9 agentes especializados que trabajan coordinadamente:'
          },
          {
            type: 'list' as const,
            content: [
              'Agente de Planificación: Analiza requisitos y crea planes de desarrollo',
              'Agente de Generación: Crea código basado en especificaciones',
              'Agente de Sincronización: Mantiene consistencia entre archivos',
              'Agente de Modificación: Aplica cambios y mejoras al código',
              'Agente de Observación: Monitorea cambios y dependencias',
              'Agente de Distribución: Organiza y estructura archivos',
              'Agente de Seguimiento: Rastrea progreso y validaciones',
              'Agente Lector: Analiza y comprende código existente',
              'Agente Diseñador: Crea interfaces y componentes visuales'
            ]
          }
        ]
      },
      {
        id: 'voice',
        title: 'Reconocimiento de Voz',
        icon: <Mic className="w-5 h-5 text-codestorm-accent" />,
        content: [
          {
            type: 'text' as const,
            content: 'Sistema avanzado de reconocimiento de voz optimizado para español:'
          },
          {
            type: 'steps' as const,
            content: [
              'Presiona el botón de micrófono en el chat',
              'Habla claramente en español',
              'El sistema procesará tu voz automáticamente',
              'Revisa el texto transcrito antes de enviar'
            ]
          },
          {
            type: 'tip' as const,
            content: 'Para mejores resultados, habla en un ambiente silencioso y con pronunciación clara.',
            icon: <Lightbulb className="w-4 h-4 text-yellow-400" />
          }
        ]
      },
      {
        id: 'documents',
        title: 'Carga de Documentos',
        icon: <Upload className="w-5 h-5 text-codestorm-accent" />,
        content: [
          {
            type: 'text' as const,
            content: 'Sistema inteligente de procesamiento de documentos:'
          },
          {
            type: 'list' as const,
            content: [
              'Soporta PDF, TXT, DOC, DOCX, MD',
              'Extracción automática de contenido relevante',
              'Generación de prompts contextuales',
              'Análisis de código en documentos técnicos'
            ]
          },
          {
            type: 'steps' as const,
            content: [
              'Haz clic en el botón de carga de documentos',
              'Selecciona uno o múltiples archivos',
              'El sistema procesará automáticamente el contenido',
              'Usa la información extraída en tus consultas'
            ]
          }
        ]
      },
      {
        id: 'mobile',
        title: 'Optimización Móvil y Accesibilidad',
        icon: <Shield className="w-5 h-5 text-codestorm-accent" />,
        content: [
          {
            type: 'text' as const,
            content: 'CODESTORM está optimizado para dispositivos móviles con funciones táctiles avanzadas:'
          },
          {
            type: 'list' as const,
            content: [
              'Elementos de toque mínimo de 44px para fácil interacción',
              'Tiempo de respuesta táctil menor a 100ms',
              'Funciones accesibles con una sola mano',
              'Interfaz adaptativa según el tamaño de pantalla',
              'Gestos táctiles intuitivos'
            ]
          },
          {
            type: 'tip' as const,
            content: 'En móviles, usa gestos de deslizamiento para navegar entre paneles y toca prolongadamente para opciones adicionales.'
          }
        ]
      },
      {
        id: 'troubleshooting',
        title: 'Solución de Problemas Comunes',
        icon: <AlertTriangle className="w-5 h-5 text-codestorm-accent" />,
        content: [
          {
            type: 'text' as const,
            content: 'Soluciones para problemas frecuentes:'
          },
          {
            type: 'list' as const,
            content: [
              'Si el reconocimiento de voz no funciona: Verifica permisos de micrófono',
              'Si los documentos no se cargan: Revisa el formato y tamaño del archivo',
              'Si la vista previa no se actualiza: Refresca la página o reinicia el servidor',
              'Si los agentes no responden: Verifica la conexión a internet',
              'Si hay errores de compilación: Revisa la sintaxis del código generado'
            ]
          },
          {
            type: 'warning' as const,
            content: 'Si persisten los problemas, reinicia la aplicación o contacta al soporte técnico.'
          }
        ]
      }
    ];

    // Secciones específicas según la página
    const pageSpecificSections: Record<string, HelpSection[]> = {
      constructor: [
        {
          id: 'constructor-workflow',
          title: 'Flujo de Trabajo Constructor',
          icon: <Workflow className="w-5 h-5 text-codestorm-accent" />,
          content: [
            {
              type: 'text' as const,
              content: 'El Constructor utiliza el sistema de "Perfeccionamiento Iterativo Guiado por IA":'
            },
            {
              type: 'steps' as const,
              content: [
                'Describe tu proyecto en el chat interactivo',
                'El sistema analiza y planifica automáticamente',
                'Revisa y aprueba cada etapa antes de continuar',
                'Aplica modificaciones iterativas según feedback',
                'Exporta el proyecto final'
              ]
            },
            {
              type: 'warning' as const,
              content: 'Debes aprobar explícitamente cada etapa antes de avanzar. El sistema no continuará sin tu validación.'
            }
          ]
        }
      ],
      codecorrector: [
        {
          id: 'correction-process',
          title: 'Proceso de Corrección',
          icon: <Shield className="w-5 h-5 text-codestorm-accent" />,
          content: [
            {
              type: 'text' as const,
              content: 'El CodeCorrector analiza y repara código automáticamente:'
            },
            {
              type: 'steps' as const,
              content: [
                'Carga tu código o pégalo en el editor',
                'El agente analiza errores y problemas',
                'Revisa las correcciones sugeridas',
                'Aplica las correcciones selectivamente',
                'Valida el código corregido'
              ]
            }
          ]
        }
      ],
      webai: [
        {
          id: 'webai-features',
          title: 'Creación de Páginas Web',
          icon: <Globe className="w-5 h-5 text-codestorm-accent" />,
          content: [
            {
              type: 'text' as const,
              content: 'WebAI se especializa en crear páginas web estáticas:'
            },
            {
              type: 'list' as const,
              content: [
                'HTML/CSS puro sin frameworks',
                'Diseños responsivos automáticos',
                'Componentes visuales interactivos',
                'Optimización para móviles',
                'Vista previa en tiempo real'
              ]
            }
          ]
        }
      ]
    };

    return [...commonSections, ...(pageSpecificSections[currentPage] || [])];
  };

  const helpSections = getHelpSections();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-6xl max-h-[90vh] mx-4 bg-codestorm-darker border border-codestorm-blue/30 shadow-2xl rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-codestorm-dark to-codestorm-darker border-codestorm-blue/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-codestorm-blue/20">
              <Bot className="w-6 h-6 text-codestorm-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Asistente CODESTORM
              </h2>
              <p className="text-sm text-codestorm-accent">
                {currentPage === 'constructor' && 'Modo Constructor - Desarrollo Iterativo'}
                {currentPage === 'codecorrector' && 'Modo CodeCorrector - Análisis y Reparación'}
                {currentPage === 'webai' && 'Modo WebAI - Creación de Páginas Web'}
                {currentPage === 'main' && 'Asistente Principal - Desarrollo Autónomo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 transition-all duration-200 rounded-lg hover:text-white hover:bg-codestorm-blue/20"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-codestorm-blue/20 bg-codestorm-dark/50">
          <button
            onClick={() => setActiveTab('help')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all duration-200 ${
              activeTab === 'help'
                ? 'text-codestorm-accent border-b-2 border-codestorm-accent bg-codestorm-blue/10'
                : 'text-gray-400 hover:text-white hover:bg-codestorm-blue/5'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Guías de Ayuda
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all duration-200 ${
              activeTab === 'chat'
                ? 'text-codestorm-accent border-b-2 border-codestorm-accent bg-codestorm-blue/10'
                : 'text-gray-400 hover:text-white hover:bg-codestorm-blue/5'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat Interactivo
            {isVoiceInitialized && (
              <VoiceStateIndicator
                voiceState={voiceState}
                isListening={isListening}
                error={voiceError}
                size="small"
                showLabel={false}
                compact={true}
              />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === 'help' && (
            <div className="p-6 space-y-4">
              {helpSections.map((section) => (
                <div key={section.id} className="overflow-hidden border rounded-lg bg-codestorm-dark/50 border-codestorm-blue/20">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="flex items-center justify-between w-full p-4 text-left transition-colors hover:bg-codestorm-blue/10"
                  >
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <h3 className="font-semibold text-white">{section.title}</h3>
                    </div>
                    {expandedSections.includes(section.id) ? (
                      <ChevronDown className="w-5 h-5 text-codestorm-accent" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-codestorm-accent" />
                    )}
                  </button>

                  {expandedSections.includes(section.id) && (
                    <div className="p-4 pt-0 space-y-3">
                      {section.content.map((item, index) => (
                        <div key={index}>
                          {item.type === 'text' && (
                            <p className="leading-relaxed text-gray-300">{item.content}</p>
                          )}

                          {item.type === 'list' && Array.isArray(item.content) && (
                            <ul className="space-y-2">
                              {item.content.map((listItem, listIndex) => (
                                <li key={listIndex} className="flex items-start gap-2 text-gray-300">
                                  <div className="w-1.5 h-1.5 bg-codestorm-accent rounded-full mt-2 flex-shrink-0"></div>
                                  <span>{listItem}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {item.type === 'steps' && Array.isArray(item.content) && (
                            <ol className="space-y-2">
                              {item.content.map((step, stepIndex) => (
                                <li key={stepIndex} className="flex items-start gap-3 text-gray-300">
                                  <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 text-sm font-semibold rounded-full bg-codestorm-blue/20 text-codestorm-accent">
                                    {stepIndex + 1}
                                  </div>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          )}

                          {item.type === 'warning' && (
                            <div className="flex items-start gap-3 p-3 border rounded-lg bg-red-500/10 border-red-500/20">
                              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                              <p className="text-red-200">{item.content}</p>
                            </div>
                          )}

                          {item.type === 'tip' && (
                            <div className="flex items-start gap-3 p-3 border rounded-lg bg-yellow-500/10 border-yellow-500/20">
                              {item.icon || <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />}
                              <p className="text-yellow-200">{item.content}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex flex-col h-full">
              {/* Quick Actions */}
              <div className="p-4 border-b border-codestorm-blue/20 bg-codestorm-dark/30">
                <h4 className="mb-3 text-sm font-medium text-codestorm-accent">Acciones Rápidas</h4>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {getQuickActions().map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      className="flex items-center gap-2 p-2 text-xs text-left transition-all duration-200 border rounded-lg bg-codestorm-dark/50 border-codestorm-blue/20 hover:bg-codestorm-blue/10 hover:border-codestorm-blue/40"
                    >
                      {action.icon}
                      <span className="text-gray-300">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Messages */}
              <div
                ref={chatContainerRef}
                className="flex-1 p-4 space-y-4 overflow-y-auto"
              >
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Bot className="w-16 h-16 mb-4 text-codestorm-accent/50" />
                    <h3 className="mb-2 text-lg font-semibold text-white">
                      ¡Hola! Soy tu Especialista Técnico de CODESTORM
                    </h3>
                    <p className="mb-4 text-gray-400">
                      Desarrollado por BOTIDINAMIX AI. Pregúntame cualquier cosa sobre CODESTORM.
                    </p>
                    <p className="text-sm text-codestorm-accent">
                      Usa las acciones rápidas arriba o escribe tu consulta abajo.
                    </p>
                  </div>
                )}

                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.sender === 'assistant' && (
                      <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-full bg-codestorm-blue/20">
                        <Bot className="w-4 h-4 text-codestorm-accent" />
                      </div>
                    )}

                    <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-1' : ''}`}>
                      <div
                        className={`p-3 rounded-lg ${
                          message.sender === 'user'
                            ? 'bg-codestorm-blue text-white'
                            : 'bg-codestorm-dark border border-codestorm-blue/20 text-gray-300'
                        }`}
                      >
                        <div className="prose-sm prose max-w-none">
                          {message.content.split('\n').map((line, index) => (
                            <p key={index} className={`${index > 0 ? 'mt-2' : ''} ${message.sender === 'user' ? 'text-white' : 'text-gray-300'}`}>
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        {message.sender === 'assistant' && (
                          <button
                            onClick={() => copyMessage(message.content)}
                            className="p-1 text-gray-500 transition-colors hover:text-codestorm-accent"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {message.sender === 'user' && (
                      <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-full bg-codestorm-accent/20">
                        <span className="text-sm font-semibold text-codestorm-accent">U</span>
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-full bg-codestorm-blue/20">
                      <Bot className="w-4 h-4 text-codestorm-accent" />
                    </div>
                    <div className="flex items-center gap-1 p-3 border rounded-lg bg-codestorm-dark border-codestorm-blue/20">
                      <div className="w-2 h-2 rounded-full bg-codestorm-accent animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-codestorm-accent animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-codestorm-accent animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      <span className="ml-2 text-sm text-gray-400">Especialista escribiendo...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-codestorm-blue/20 bg-codestorm-dark/30">
                <div className="flex flex-col gap-3">
                  {/* Document Uploader */}
                  <div className="flex items-center gap-2">
                    <DocumentUploader
                      onDocumentProcessed={handleDocumentProcessed}
                      maxFileSize={5 * 1024 * 1024} // 5MB
                      acceptedTypes={['.pdf', '.txt', '.doc', '.docx', '.md']}
                      className="flex-shrink-0"
                    />
                    {chatMessages.length > 0 && (
                      <button
                        onClick={exportConversation}
                        className="p-2 text-gray-400 transition-colors hover:text-codestorm-accent"
                        title="Exportar conversación"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="flex items-end gap-2">
                    <div className="relative flex-1">
                      <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Pregúntame sobre CODESTORM... (Enter para enviar, Shift+Enter para nueva línea)"
                        className="w-full p-3 text-white border rounded-lg resize-none bg-codestorm-dark border-codestorm-blue/20 focus:outline-none focus:border-codestorm-blue/50 focus:ring-1 focus:ring-codestorm-blue/50"
                        rows={2}
                        disabled={isProcessing}
                      />
                      {transcript && (
                        <div className="absolute top-0 right-0 p-1">
                          <span className="text-xs text-codestorm-accent">🎤</span>
                        </div>
                      )}
                    </div>

                    {/* Voice Button */}
                    <button
                      onClick={isListening ? stopListening : startListening}
                      disabled={!isVoiceInitialized}
                      className={`p-3 rounded-lg transition-all duration-200 ${
                        isListening
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-codestorm-blue/20 hover:bg-codestorm-blue/30 text-codestorm-accent'
                      } ${!isVoiceInitialized ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={isListening ? 'Detener grabación' : 'Iniciar grabación de voz'}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    {/* Send Button */}
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isProcessing}
                      className="p-3 text-white transition-colors rounded-lg bg-codestorm-blue hover:bg-codestorm-blue/80 disabled:bg-gray-600 disabled:cursor-not-allowed"
                      title="Enviar mensaje"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Voice Error */}
                  {voiceError && (
                    <div className="flex items-center gap-2 p-2 text-sm text-red-400 border rounded-lg bg-red-500/10 border-red-500/20">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Error de voz: {voiceError}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-codestorm-dark border-codestorm-blue/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Bot className="w-4 h-4" />
              <span>BOTIDINAMIX AI - Todos los derechos reservados © 2025</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 font-medium text-white transition-colors rounded-lg bg-codestorm-blue hover:bg-codestorm-blue/80"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodestormHelpAssistant;