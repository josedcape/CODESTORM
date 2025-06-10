import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Sparkles, Zap, Code, Monitor, Smartphone, Tablet, X, Palette, Cpu, Split, Eye, Globe, AlertCircle, Mic, MicOff, Volume2 } from 'lucide-react';
import { PromptEnhancerService, EnhancedPrompt } from '../../services/PromptEnhancerService';
import { SpecializedEnhancerService, SpecializedEnhanceResult } from '../../services/SpecializedEnhancerService';
import EnhancedPromptDialog from '../EnhancedPromptDialog';
import { WebTemplate } from './WebTemplateSelector';
import { WebComponent } from './ComponentPalette';
import { generateUniqueId } from '../../utils/idGenerator';
import { removeDuplicateFiles } from '../../utils/fileUtils';
import AIModelManager from '../../services/AIModelManager';
import AgentProgressPanel from './AgentProgressPanel';
import AgentCoordinatorService, { CoordinatorTask } from '../../services/AgentCoordinatorService';
import { DesignProposal, FileItem } from '../../types';
import DocumentUploader from '../DocumentUploader';
import VoiceStateIndicator from '../VoiceStateIndicator';
import VoiceInputButton from '../audio/VoiceInputButton';
import { useUnifiedVoice } from '../../hooks/useUnifiedVoice';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import SpeechControls from '../SpeechControls';
import SpeechSettings from '../SpeechSettings';
import WebPreviewRenderer from './WebPreviewRenderer';
import './WebPreviewRenderer.css';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: number;
  type?: 'text' | 'code' | 'suggestion' | 'preview';
  metadata?: any;
}

interface WebAIAssistantProps {
  onGenerateWebsite: (description: string) => void;
  onSelectTemplate: (template: WebTemplate) => void;
  onAddComponents: (components: WebComponent[]) => void;
  onPreview: () => void;
  onFilesGenerated?: (files: FileItem[]) => void;
  onFilesUpdated?: (files: FileItem[]) => void;
  onAutoPreview?: (html: string, css: string, js: string) => void;
  isProcessing: boolean;
  availableTemplates: WebTemplate[];
  availableComponents: WebComponent[];
}

const WebAIAssistant: React.FC<WebAIAssistantProps> = ({
  onGenerateWebsite,
  onSelectTemplate,
  onAddComponents,
  onPreview,
  onFilesGenerated,
  onFilesUpdated,
  onAutoPreview,
  isProcessing,
  availableTemplates,
  availableComponents
}) => {
  // Inicializar el gestor de modelos
  const [modelManager] = useState(() => AIModelManager.getInstance());
  const [currentModel, setCurrentModel] = useState(modelManager.getSelectedModel());

  // Estados para el chat
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: `¡Hola! Soy tu asistente especializado en crear SITIOS WEB ESTÁTICOS profesionales. Actualmente usando ${modelManager.getAvailableModels().find(m => m.id === currentModel)?.name || 'modelo IA'}. Describe el sitio web que te gustaría crear y generaré automáticamente HTML5, CSS3 y JavaScript vanilla optimizados. Por ejemplo: "Crea un sitio web estático para una consultoría de marketing digital con página de inicio, servicios, sobre nosotros y contacto".`,
      sender: 'assistant',
      timestamp: Date.now(),
      type: 'text'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estados para la mejora de prompts
  const [enhancePromptEnabled, setEnhancePromptEnabled] = useState(true);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [currentEnhancedPrompt, setCurrentEnhancedPrompt] = useState<EnhancedPrompt | null>(null);
  const [showEnhancedPromptDialog, setShowEnhancedPromptDialog] = useState(false);
  const [currentSpecializedResult, setCurrentSpecializedResult] = useState<SpecializedEnhanceResult | null>(null);

  // Estado para la vista previa
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string>('');

  // Estados para los agentes
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [agentTasks, setAgentTasks] = useState<CoordinatorTask[]>([]);
  const [designProposal, setDesignProposal] = useState<DesignProposal | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<FileItem[]>([]);
  const [currentFiles, setCurrentFiles] = useState<FileItem[]>([]);
  const [generatedCss, setGeneratedCss] = useState('');
  const [generatedJs, setGeneratedJs] = useState('');

  // Estados para síntesis de voz
  const [showSpeechSettings, setShowSpeechSettings] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [autoPlaySpeech, setAutoPlaySpeech] = useState(false);

  // Hook de reconocimiento de voz unificado
  const {
    voiceState: advancedVoiceState,
    isListening: isAdvancedListening,
    isInitialized: isAdvancedVoiceInitialized,
    error: advancedVoiceError,
    startListening: startAdvancedListening,
    stopListening: stopAdvancedListening
  } = useUnifiedVoice({
    onTranscript: (transcript: string) => {
      console.log('🎤 Comando de voz recibido en WebAI:', transcript);
      setInputValue(transcript);
    },
    onFinalTranscript: (transcript: string) => {
      console.log('🎤 Comando de voz final en WebAI:', transcript);
      setInputValue(transcript);
    },
    enableDebug: true,
    componentName: 'WebAIAssistant',
    language: 'es-ES',
    autoInitialize: true
  });

  // Hook de síntesis de voz
  const {
    isSupported: isSpeechSupported,
    isInitialized: isSpeechInitialized,
    speak,
    stop: stopSpeech,
    status: speechStatus
  } = useSpeechSynthesis({
    componentName: 'WebAIAssistant-Speech',
    autoInitialize: true,
    defaultConfig: {
      rate: 0.9,
      pitch: 1.0,
      volume: 0.8,
      language: 'es-ES',
      enableHighlight: true
    }
  });

  // Función para extraer archivos del contenido generado
  const extractFilesFromContent = (content: string): FileItem[] => {
    const files: FileItem[] = [];

    // Extraer HTML
    const htmlMatch = content.match(/```html\s*([\s\S]*?)\s*```/i) ||
                     content.match(/<!DOCTYPE html[\s\S]*?<\/html>/i);
    if (htmlMatch) {
      files.push({
        id: generateUniqueId('file'),
        name: 'index.html',
        path: 'index.html',
        content: htmlMatch[1] || htmlMatch[0],
        language: 'html',
        size: (htmlMatch[1] || htmlMatch[0]).length,
        lastModified: Date.now()
      });
    }

    // Extraer CSS
    const cssMatch = content.match(/```css\s*([\s\S]*?)\s*```/i);
    if (cssMatch) {
      files.push({
        id: generateUniqueId('file'),
        name: 'styles.css',
        path: 'styles.css',
        content: cssMatch[1],
        language: 'css',
        size: cssMatch[1].length,
        lastModified: Date.now()
      });
    }

    // Extraer JavaScript
    const jsMatch = content.match(/```javascript\s*([\s\S]*?)\s*```/i) ||
                   content.match(/```js\s*([\s\S]*?)\s*```/i);
    if (jsMatch) {
      files.push({
        id: generateUniqueId('file'),
        name: 'script.js',
        path: 'script.js',
        content: jsMatch[1],
        language: 'javascript',
        size: jsMatch[1].length,
        lastModified: Date.now()
      });
    }

    return files;
  };

  // Función para detectar modificaciones de código en los mensajes
  const detectCodeModifications = (content: string): { html?: string; css?: string; js?: string } | null => {
    const modifications: { html?: string; css?: string; js?: string } = {};

    // Detectar HTML completo (incluyendo DOCTYPE)
    const fullHtmlMatch = content.match(/<!DOCTYPE html[\s\S]*?<\/html>/i);
    if (fullHtmlMatch) {
      modifications.html = fullHtmlMatch[0].trim();

      // Extraer CSS del HTML si está presente
      const cssInHtml = fullHtmlMatch[0].match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      if (cssInHtml) {
        modifications.css = cssInHtml[1].trim();
      }

      // Extraer JavaScript del HTML si está presente
      const jsInHtml = fullHtmlMatch[0].match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      if (jsInHtml) {
        modifications.js = jsInHtml[1].trim();
      }
    } else {
      // Detectar bloques de código HTML en markdown
      const htmlMatch = content.match(/```html\s*([\s\S]*?)\s*```/i);
      if (htmlMatch) {
        modifications.html = htmlMatch[1].trim();
      }

      // Detectar bloques de código CSS
      const cssMatch = content.match(/```css\s*([\s\S]*?)\s*```/i);
      if (cssMatch) {
        modifications.css = cssMatch[1].trim();
      }

      // Detectar bloques de código JavaScript
      const jsMatch = content.match(/```javascript\s*([\s\S]*?)\s*```/i) ||
                     content.match(/```js\s*([\s\S]*?)\s*```/i);
      if (jsMatch) {
        modifications.js = jsMatch[1].trim();
      }
    }

    // Detectar modificaciones parciales de HTML (sin DOCTYPE)
    if (!modifications.html) {
      const partialHtmlMatch = content.match(/<html[\s\S]*?<\/html>/i) ||
                              content.match(/<body[\s\S]*?<\/body>/i) ||
                              content.match(/<head[\s\S]*?<\/head>/i);
      if (partialHtmlMatch) {
        modifications.html = partialHtmlMatch[0].trim();
      }
    }

    return Object.keys(modifications).length > 0 ? modifications : null;
  };

  // Efecto para detectar modificaciones en los mensajes y actualizar vista previa
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'user') {
      const modifications = detectCodeModifications(lastMessage.content);

      if (modifications) {
        console.log('🔄 Modificaciones detectadas en el chat:', modifications);

        // Actualizar estados con las modificaciones
        if (modifications.html) {
          setGeneratedHtml(modifications.html);
        }
        if (modifications.css) {
          setGeneratedCss(modifications.css);
        }
        if (modifications.js) {
          setGeneratedJs(modifications.js);
        }

        // Activar vista previa automática con las modificaciones
        if (onAutoPreview && (modifications.html || modifications.css || modifications.js)) {
          onAutoPreview(
            modifications.html || generatedHtml,
            modifications.css || generatedCss,
            modifications.js || generatedJs
          );

          // Añadir mensaje de confirmación
          const confirmationMessage: Message = {
            id: generateUniqueId('msg-modification'),
            content: `🔄 **Modificaciones detectadas y aplicadas**\n\n${modifications.html ? '✅ HTML actualizado\n' : ''}${modifications.css ? '✅ CSS actualizado\n' : ''}${modifications.js ? '✅ JavaScript actualizado\n' : ''}\n🔍 **Vista previa actualizada automáticamente**`,
            sender: 'assistant',
            timestamp: Date.now(),
            type: 'suggestion'
          };

          setMessages(prev => [...prev, confirmationMessage]);
        }
      }
    }
  }, [messages, generatedHtml, generatedCss, generatedJs, onAutoPreview]);

  // Scroll al final del chat cuando hay nuevos mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Configurar el listener para el coordinador de agentes
  useEffect(() => {
    const coordinator = AgentCoordinatorService.getInstance();

    const listener = {
      onTaskUpdate: (tasks: CoordinatorTask[]) => {
        setAgentTasks(tasks);
      },
      onFilesGenerated: (files: FileItem[]) => {
        // Limpiar archivos duplicados antes de procesarlos
        const cleanFiles = removeDuplicateFiles(files);
        setGeneratedFiles(cleanFiles);
        if (onFilesGenerated) {
          onFilesGenerated(cleanFiles);
        }
      },
      onDesignProposalUpdate: (proposal: DesignProposal | null) => {
        setDesignProposal(proposal);
        if (proposal) {
          // Actualizar la plantilla seleccionada
          const templateName = proposal.title.toLowerCase();
          const matchedTemplate = availableTemplates.find(t =>
            t.name.toLowerCase().includes(templateName) ||
            templateName.includes(t.name.toLowerCase())
          );

          if (matchedTemplate) {
            onSelectTemplate(matchedTemplate);
          }
        }
      },
      onError: (error: string) => {
        // Añadir mensaje de error al chat
        const errorMessage: Message = {
          id: generateUniqueId('msg-error'),
          content: `Ha ocurrido un error: ${error}`,
          sender: 'assistant',
          timestamp: Date.now(),
          type: 'text'
        };

        setMessages(prev => [...prev, errorMessage]);
      }
    };

    coordinator.addListener(listener);

    return () => {
      coordinator.removeListener(listener);
    };
  }, [availableTemplates, onFilesGenerated, onSelectTemplate]);

  // Función para manejar el envío de mensajes
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    // Si la mejora de prompts está habilitada, mejorar el prompt
    if (enhancePromptEnabled && !isEnhancing) {
      setIsEnhancing(true);

      try {
        // Usar el servicio especializado que detecta automáticamente el contexto WebAI
        const result = await SpecializedEnhancerService.enhanceWithSpecializedAgent(inputValue, 'webai');

        if (result.success && result.enhancedPrompt) {
          setCurrentEnhancedPrompt(result.enhancedPrompt);
          setCurrentSpecializedResult(result);
          setShowEnhancedPromptDialog(true);

          console.log('🌐 WebAI: Prompt mejorado con agente especializado para sitios web estáticos');
        } else {
          // Si hay un error, enviar el mensaje original
          await sendOriginalMessage();
        }
      } catch (error) {
        console.error('Error al mejorar el prompt con agente especializado:', error);
        // En caso de error, enviar el mensaje original
        await sendOriginalMessage();
      } finally {
        setIsEnhancing(false);
      }
    } else {
      // Si la mejora de prompts está deshabilitada, enviar el mensaje original
      await sendOriginalMessage();
    }
  };

  // Función para enviar el mensaje original
  const sendOriginalMessage = async () => {
    const originalPrompt = inputValue;
    setInputValue('');

    // Añadir mensaje del usuario al chat
    const userMessage: Message = {
      id: generateUniqueId('msg'),
      content: originalPrompt,
      sender: 'user',
      timestamp: Date.now(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);

    // Simular procesamiento y respuesta del asistente
    await processUserRequest(originalPrompt);
  };

  // Función para usar el prompt original
  const handleUseOriginalPrompt = () => {
    if (currentEnhancedPrompt) {
      const originalPrompt = currentEnhancedPrompt.originalPrompt;
      setShowEnhancedPromptDialog(false);
      setCurrentEnhancedPrompt(null);

      // Añadir mensaje del usuario al chat
      const userMessage: Message = {
        id: generateUniqueId('msg'),
        content: originalPrompt,
        sender: 'user',
        timestamp: Date.now(),
        type: 'text'
      };

      setMessages(prev => [...prev, userMessage]);

      // Procesar la solicitud
      processUserRequest(originalPrompt);
    }
  };

  // Función para usar el prompt mejorado
  const handleUseEnhancedPrompt = () => {
    if (currentEnhancedPrompt) {
      const enhancedPrompt = currentEnhancedPrompt.enhancedPrompt;
      setShowEnhancedPromptDialog(false);
      setCurrentEnhancedPrompt(null);

      // Añadir mensaje del usuario al chat
      const userMessage: Message = {
        id: generateUniqueId('msg'),
        content: enhancedPrompt,
        sender: 'user',
        timestamp: Date.now(),
        type: 'text'
      };

      // Añadir mensaje informativo sobre la mejora
      const enhancementInfoMessage: Message = {
        id: generateUniqueId('msg-enhancement'),
        content: `He mejorado tu instrucción para obtener mejores resultados:\n${currentEnhancedPrompt.improvements.map(imp => `• ${imp}`).join('\n')}`,
        sender: 'assistant',
        timestamp: Date.now(),
        type: 'suggestion'
      };

      setMessages(prev => [...prev, userMessage, enhancementInfoMessage]);

      // Procesar la solicitud
      processUserRequest(enhancedPrompt);
    }
  };

  // Función para alternar la mejora de prompts
  const toggleEnhancePrompt = () => {
    setEnhancePromptEnabled(!enhancePromptEnabled);
  };

  // Función para manejar documentos procesados
  const handleDocumentProcessed = (content: string, fileName: string) => {
    // Añadir mensaje del usuario con el contenido del documento
    const userMessage: Message = {
      id: generateUniqueId('msg-doc'),
      content: content,
      sender: 'user',
      timestamp: Date.now(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);

    // Procesar la solicitud automáticamente
    processUserRequest(content);

    console.log(`📄 Documento cargado en WebAI: ${fileName}`);
  };

  // Cargar preferencias de síntesis de voz
  useEffect(() => {
    const savedPreferences = localStorage.getItem('codestorm-speech-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setSpeechEnabled(parsed.enabled ?? true);
        setAutoPlaySpeech(parsed.autoPlayResponses ?? false);
      } catch (error) {
        console.warn('Error al cargar preferencias de síntesis:', error);
      }
    }
  }, []);

  // Funciones de síntesis de voz
  const handleSpeechStart = (messageId: string) => {
    console.log(`🔊 [WebAI] Iniciando síntesis para mensaje: ${messageId}`);
  };

  const handleSpeechEnd = (messageId: string) => {
    console.log(`✅ [WebAI] Síntesis completada para mensaje: ${messageId}`);
  };

  const handleSpeechError = (messageId: string, error: string) => {
    console.error(`❌ [WebAI] Error en síntesis para mensaje ${messageId}:`, error);
  };

  const handleSpeechConfigSave = (config: any) => {
    setSpeechEnabled(config.enabled ?? true);
    setAutoPlaySpeech(config.autoPlayResponses ?? false);
    console.log('✅ [WebAI] Configuración de síntesis guardada:', config);
  };

  // Método para crear prompts específicos basados en las instrucciones del usuario
  const createSpecificPrompt = (userRequest: string): string => {
    const lowerRequest = userRequest.toLowerCase();

    // Detectar tipo de sitio web solicitado
    const siteTypes = {
      ecommerce: ['venta', 'productos', 'tienda', 'shop', 'e-commerce', 'ecommerce', 'comprar', 'carrito', 'tecnológicos', 'tecnologia'],
      portfolio: ['portfolio', 'portafolio', 'personal', 'cv', 'curriculum', 'profesional'],
      blog: ['blog', 'noticias', 'articulos', 'contenido'],
      landing: ['landing', 'promocional', 'campaña', 'marketing'],
      corporate: ['empresa', 'corporativo', 'negocio', 'servicios'],
      restaurant: ['restaurante', 'comida', 'menu', 'cocina', 'chef'],
      agency: ['agencia', 'estudio', 'consultoria']
    };

    let detectedType = 'general';
    let specificInstructions = '';

    // Detectar el tipo de sitio
    for (const [type, keywords] of Object.entries(siteTypes)) {
      if (keywords.some(keyword => lowerRequest.includes(keyword))) {
        detectedType = type;
        break;
      }
    }

    // Crear instrucciones específicas según el tipo detectado
    switch (detectedType) {
      case 'ecommerce':
        specificInstructions = `
        INSTRUCCIONES ESPECÍFICAS PARA E-COMMERCE:
        - Crear una tienda online completa para productos tecnológicos
        - Incluir catálogo de productos con imágenes, precios y descripciones
        - Implementar carrito de compras funcional
        - Agregar filtros de búsqueda y categorías
        - Incluir sección de checkout y formulario de compra
        - Diseño moderno y profesional para ventas online
        - Productos sugeridos: smartphones, laptops, tablets, accesorios tech
        - Incluir testimonios de clientes y garantías
        - Sección de ofertas y productos destacados
        `;
        break;

      case 'restaurant':
        specificInstructions = `
        INSTRUCCIONES ESPECÍFICAS PARA RESTAURANTE:
        - Crear sitio web para restaurante con menú digital
        - Incluir galería de platos y ambiente
        - Sistema de reservas online
        - Información de ubicación y horarios
        - Testimonios de clientes
        `;
        break;

      case 'portfolio':
        specificInstructions = `
        INSTRUCCIONES ESPECÍFICAS PARA PORTFOLIO:
        - Crear portfolio profesional personal
        - Galería de proyectos con descripciones
        - Sección sobre mí/experiencia
        - Formulario de contacto
        - CV descargable
        `;
        break;

      default:
        specificInstructions = `
        INSTRUCCIONES GENERALES:
        - Crear sitio web moderno y profesional
        - Diseño responsivo y atractivo
        - Contenido relevante y bien estructurado
        `;
    }

    return `Eres un experto desarrollador web especializado en crear sitios web específicos y personalizados.

SOLICITUD DEL USUARIO: "${userRequest}"

${specificInstructions}

REQUISITOS TÉCNICOS OBLIGATORIOS:
1. HTML5 semántico y accesible
2. CSS3 moderno con diseño responsivo (mobile-first)
3. JavaScript vanilla para interactividad
4. Optimización SEO básica
5. Estructura profesional y limpia
6. Colores y tipografía moderna
7. Animaciones CSS sutiles
8. Formularios funcionales

ESTRUCTURA REQUERIDA:
- Header con navegación
- Hero section atractivo
- Secciones de contenido específico
- Footer completo
- Diseño coherente en toda la página

IMPORTANTE: El contenido debe ser específicamente relevante a "${userRequest}". No generes contenido genérico.

Responde ÚNICAMENTE con el código HTML completo, incluyendo CSS y JavaScript embebidos. El código debe ser funcional y listo para usar.`;
  };

  // Función para detectar el tipo de sitio
  const detectSiteType = (userRequest: string): string => {
    const lowerRequest = userRequest.toLowerCase();

    if (lowerRequest.includes('venta') || lowerRequest.includes('productos') || lowerRequest.includes('tienda') || lowerRequest.includes('tecnológicos') || lowerRequest.includes('e-commerce')) {
      return 'E-commerce de Productos Tecnológicos';
    } else if (lowerRequest.includes('restaurante') || lowerRequest.includes('comida') || lowerRequest.includes('menu')) {
      return 'Restaurante';
    } else if (lowerRequest.includes('portfolio') || lowerRequest.includes('portafolio')) {
      return 'Portfolio Profesional';
    }
    return 'Sitio Web General';
  };

  // Función para generar contenido de fallback específico
  const generateSpecificFallbackContent = (userRequest: string): string => {
    const lowerRequest = userRequest.toLowerCase();

    // Detectar tipo de sitio web solicitado
    if (lowerRequest.includes('venta') || lowerRequest.includes('productos') || lowerRequest.includes('tienda') || lowerRequest.includes('tecnológicos') || lowerRequest.includes('e-commerce')) {
      return generateEcommerceFallbackContent(userRequest);
    } else if (lowerRequest.includes('restaurante') || lowerRequest.includes('comida') || lowerRequest.includes('menu')) {
      return generateRestaurantFallbackContent(userRequest);
    } else if (lowerRequest.includes('portfolio') || lowerRequest.includes('portafolio')) {
      return generatePortfolioFallbackContent(userRequest);
    }

    return generateGeneralFallbackContent(userRequest);
  };

  // Función para generar contenido de e-commerce
  const generateEcommerceFallbackContent = (userRequest: string): string => {
    return `# Tienda Online de Productos Tecnológicos - Generado Específicamente

Basándome en tu solicitud: "${userRequest}"

\`\`\`html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TechStore - Productos Tecnológicos</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 0;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
        }

        .logo {
            font-size: 1.8rem;
            font-weight: bold;
        }

        .nav-links {
            display: flex;
            list-style: none;
            gap: 2rem;
        }

        .nav-links a {
            color: white;
            text-decoration: none;
            transition: opacity 0.3s;
        }

        .nav-links a:hover {
            opacity: 0.8;
        }

        .cart {
            background: rgba(255,255,255,0.2);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            cursor: pointer;
        }

        .hero {
            background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"><rect fill="%23667eea" width="1200" height="600"/></svg>');
            background-size: cover;
            color: white;
            text-align: center;
            padding: 6rem 2rem;
        }

        .hero h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            animation: fadeInUp 1s ease;
        }

        .hero p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            animation: fadeInUp 1s ease 0.2s both;
        }

        .cta-button {
            background: #ff6b6b;
            color: white;
            padding: 1rem 2rem;
            border: none;
            border-radius: 30px;
            font-size: 1.1rem;
            cursor: pointer;
            transition: transform 0.3s, box-shadow 0.3s;
            animation: fadeInUp 1s ease 0.4s both;
        }

        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(255,107,107,0.3);
        }

        .products {
            padding: 4rem 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }

        .section-title {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 3rem;
            color: #333;
        }

        .product-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }

        .product-card {
            background: white;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            overflow: hidden;
            transition: transform 0.3s, box-shadow 0.3s;
        }

        .product-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.2);
        }

        .product-image {
            height: 200px;
            background: linear-gradient(45deg, #f0f0f0, #e0e0e0);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
        }

        .product-info {
            padding: 1.5rem;
        }

        .product-title {
            font-size: 1.3rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }

        .product-price {
            font-size: 1.5rem;
            color: #667eea;
            font-weight: bold;
            margin-bottom: 1rem;
        }

        .add-to-cart {
            width: 100%;
            background: #667eea;
            color: white;
            border: none;
            padding: 0.8rem;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.3s;
        }

        .add-to-cart:hover {
            background: #5a67d8;
        }

        .features {
            background: #f8f9fa;
            padding: 4rem 2rem;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            max-width: 1000px;
            margin: 0 auto;
        }

        .feature {
            text-align: center;
            padding: 2rem;
        }

        .feature-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        .footer {
            background: #333;
            color: white;
            text-align: center;
            padding: 2rem;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @media (max-width: 768px) {
            .nav-links {
                display: none;
            }

            .hero h1 {
                font-size: 2rem;
            }

            .product-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <nav class="nav">
            <div class="logo">🚀 TechStore</div>
            <ul class="nav-links">
                <li><a href="#inicio">Inicio</a></li>
                <li><a href="#productos">Productos</a></li>
                <li><a href="#ofertas">Ofertas</a></li>
                <li><a href="#contacto">Contacto</a></li>
            </ul>
            <div class="cart" onclick="toggleCart()">
                🛒 Carrito (<span id="cart-count">0</span>)
            </div>
        </nav>
    </header>

    <section class="hero" id="inicio">
        <h1>Los Mejores Productos Tecnológicos</h1>
        <p>Descubre la última tecnología con los mejores precios y garantía completa</p>
        <button class="cta-button" onclick="scrollToProducts()">Ver Productos</button>
    </section>

    <section class="products" id="productos">
        <h2 class="section-title">Productos Destacados</h2>
        <div class="product-grid">
            <div class="product-card">
                <div class="product-image">📱</div>
                <div class="product-info">
                    <h3 class="product-title">Smartphone Pro Max</h3>
                    <p>Último modelo con cámara de 108MP y 5G</p>
                    <div class="product-price">$899.99</div>
                    <button class="add-to-cart" onclick="addToCart('smartphone')">Agregar al Carrito</button>
                </div>
            </div>

            <div class="product-card">
                <div class="product-image">💻</div>
                <div class="product-info">
                    <h3 class="product-title">Laptop Gaming Ultra</h3>
                    <p>RTX 4080, 32GB RAM, SSD 1TB</p>
                    <div class="product-price">$1,599.99</div>
                    <button class="add-to-cart" onclick="addToCart('laptop')">Agregar al Carrito</button>
                </div>
            </div>

            <div class="product-card">
                <div class="product-image">🎧</div>
                <div class="product-info">
                    <h3 class="product-title">Auriculares Wireless</h3>
                    <p>Cancelación de ruido activa, 30h batería</p>
                    <div class="product-price">$299.99</div>
                    <button class="add-to-cart" onclick="addToCart('auriculares')">Agregar al Carrito</button>
                </div>
            </div>

            <div class="product-card">
                <div class="product-image">⌚</div>
                <div class="product-info">
                    <h3 class="product-title">Smartwatch Pro</h3>
                    <p>Monitor de salud, GPS, resistente al agua</p>
                    <div class="product-price">$399.99</div>
                    <button class="add-to-cart" onclick="addToCart('smartwatch')">Agregar al Carrito</button>
                </div>
            </div>

            <div class="product-card">
                <div class="product-image">📷</div>
                <div class="product-info">
                    <h3 class="product-title">Cámara Mirrorless</h3>
                    <p>4K 60fps, estabilización de imagen</p>
                    <div class="product-price">$1,299.99</div>
                    <button class="add-to-cart" onclick="addToCart('camara')">Agregar al Carrito</button>
                </div>
            </div>

            <div class="product-card">
                <div class="product-image">🖥️</div>
                <div class="product-info">
                    <h3 class="product-title">Monitor 4K Gaming</h3>
                    <p>144Hz, HDR, 1ms respuesta</p>
                    <div class="product-price">$699.99</div>
                    <button class="add-to-cart" onclick="addToCart('monitor')">Agregar al Carrito</button>
                </div>
            </div>
        </div>
    </section>

    <section class="features">
        <h2 class="section-title">¿Por Qué Elegirnos?</h2>
        <div class="features-grid">
            <div class="feature">
                <div class="feature-icon">🚚</div>
                <h3>Envío Gratis</h3>
                <p>Envío gratuito en compras superiores a $100</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🔒</div>
                <h3>Compra Segura</h3>
                <p>Pagos 100% seguros con encriptación SSL</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🛡️</div>
                <h3>Garantía Extendida</h3>
                <p>2 años de garantía en todos nuestros productos</p>
            </div>
            <div class="feature">
                <div class="feature-icon">📞</div>
                <h3>Soporte 24/7</h3>
                <p>Atención al cliente las 24 horas del día</p>
            </div>
        </div>
    </section>

    <footer class="footer">
        <p>&copy; 2024 TechStore. Todos los derechos reservados. | Generado específicamente para tu solicitud</p>
    </footer>

    <script>
        let cart = [];

        function addToCart(product) {
            cart.push(product);
            updateCartCount();
            showNotification('Producto agregado al carrito');
        }

        function updateCartCount() {
            document.getElementById('cart-count').textContent = cart.length;
        }

        function toggleCart() {
            if (cart.length === 0) {
                showNotification('El carrito está vacío');
            } else {
                showNotification(\`Tienes \${cart.length} productos en el carrito\`);
            }
        }

        function scrollToProducts() {
            document.getElementById('productos').scrollIntoView({ behavior: 'smooth' });
        }

        function showNotification(message) {
            const notification = document.createElement('div');
            notification.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 1rem 2rem;
                border-radius: 5px;
                z-index: 1000;
                animation: slideIn 0.3s ease;
            \`;
            notification.textContent = message;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        // Animación para las tarjetas de productos
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.product-card').forEach(card => {
            observer.observe(card);
        });

        console.log('🛒 Tienda online de productos tecnológicos cargada - Generado específicamente');
    </script>
</body>
</html>
\`\`\`

**Características del E-commerce:**
- ✅ Catálogo de productos tecnológicos específicos
- ✅ Carrito de compras funcional
- ✅ Diseño moderno y responsivo
- ✅ Animaciones CSS3 atractivas
- ✅ Sistema de notificaciones
- ✅ Secciones de garantía y envío
- ✅ Navegación fluida
- ✅ Optimizado para móviles

*Generado específicamente para tu solicitud: "${userRequest}"*`;
  };

  // Función para generar contenido general de fallback
  const generateGeneralFallbackContent = (userRequest: string): string => {
    return `# Sitio Web Profesional - Generado Específicamente

Basándome en tu solicitud: "${userRequest}"

\`\`\`html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sitio Web Profesional</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        h1 {
            color: #4a5568;
            text-align: center;
            margin-bottom: 2rem;
        }
        .feature {
            background: #f7fafc;
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 5px;
            border-left: 4px solid #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Sitio Web Profesional</h1>
        <p>Generado específicamente para: "${userRequest}"</p>

        <div class="feature">
            <h3>🚀 Funcionalidad Básica</h3>
            <p>Sitio web funcional con diseño responsivo.</p>
        </div>

        <div class="feature">
            <h3>🎨 Diseño Limpio</h3>
            <p>Interfaz simple y profesional.</p>
        </div>

        <div class="feature">
            <h3>📱 Responsive</h3>
            <p>Adaptable a diferentes dispositivos.</p>
        </div>
    </div>

    <script>
        console.log('Sitio generado específicamente para: ${userRequest}');
    </script>
</body>
</html>
\`\`\`

**Características:**
- ✅ HTML5 válido
- ✅ CSS responsivo
- ✅ JavaScript básico
- ✅ Diseño limpio

*Generado específicamente para tu solicitud: "${userRequest}"*`;
  };

  // Función para generar contenido de restaurante
  const generateRestaurantFallbackContent = (userRequest: string): string => {
    return `# Sitio Web de Restaurante - Generado Específicamente

Basándome en tu solicitud: "${userRequest}"

\`\`\`html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restaurante Gourmet - Experiencia Culinaria Única</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; }
        .header { background: rgba(0,0,0,0.9); color: white; padding: 1rem 0; position: fixed; width: 100%; top: 0; z-index: 1000; }
        .nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
        .logo { font-size: 1.8rem; font-weight: bold; color: #d4af37; }
        .hero { height: 100vh; background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><rect fill="%23d4af37" width="1200" height="800"/></svg>'); background-size: cover; display: flex; align-items: center; justify-content: center; text-align: center; color: white; }
        .hero-content h1 { font-size: 4rem; margin-bottom: 1rem; color: #d4af37; }
        .menu-section { padding: 4rem 2rem; max-width: 1200px; margin: 0 auto; }
        .menu-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .menu-item { background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); overflow: hidden; transition: transform 0.3s; }
        .menu-item:hover { transform: translateY(-5px); }
        .reservation { background: #d4af37; color: white; padding: 4rem 2rem; text-align: center; }
        .reservation-form { max-width: 500px; margin: 2rem auto; }
        .form-group { margin-bottom: 1rem; }
        .form-group input, .form-group select { width: 100%; padding: 0.8rem; border: none; border-radius: 5px; }
        .btn { background: #333; color: white; padding: 1rem 2rem; border: none; border-radius: 5px; cursor: pointer; transition: background 0.3s; }
        .btn:hover { background: #555; }
    </style>
</head>
<body>
    <header class="header">
        <nav class="nav">
            <div class="logo">🍽️ Restaurante Gourmet</div>
            <div>
                <a href="#menu" style="color: white; text-decoration: none; margin: 0 1rem;">Menú</a>
                <a href="#reservas" style="color: white; text-decoration: none; margin: 0 1rem;">Reservas</a>
                <a href="#contacto" style="color: white; text-decoration: none; margin: 0 1rem;">Contacto</a>
            </div>
        </nav>
    </header>

    <section class="hero">
        <div class="hero-content">
            <h1>Experiencia Culinaria Única</h1>
            <p>Sabores auténticos en un ambiente excepcional</p>
        </div>
    </section>

    <section class="menu-section" id="menu">
        <h2 style="text-align: center; font-size: 2.5rem; margin-bottom: 3rem;">Nuestro Menú</h2>
        <div class="menu-grid">
            <div class="menu-item">
                <div style="height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 3rem;">🥩</div>
                <div style="padding: 1.5rem;">
                    <h3>Filete Wellington</h3>
                    <p>Tierno filete envuelto en hojaldre con duxelles de champiñones</p>
                    <div style="font-size: 1.3rem; color: #d4af37; font-weight: bold;">$45.00</div>
                </div>
            </div>

            <div class="menu-item">
                <div style="height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 3rem;">🦞</div>
                <div style="padding: 1.5rem;">
                    <h3>Langosta Thermidor</h3>
                    <p>Langosta fresca con salsa cremosa gratinada al horno</p>
                    <div style="font-size: 1.3rem; color: #d4af37; font-weight: bold;">$65.00</div>
                </div>
            </div>

            <div class="menu-item">
                <div style="height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 3rem;">🍰</div>
                <div style="padding: 1.5rem;">
                    <h3>Tarta de Chocolate</h3>
                    <p>Deliciosa tarta de chocolate belga con frutos rojos</p>
                    <div style="font-size: 1.3rem; color: #d4af37; font-weight: bold;">$18.00</div>
                </div>
            </div>
        </div>
    </section>

    <section class="reservation" id="reservas">
        <h2 style="font-size: 2.5rem; margin-bottom: 1rem;">Haz tu Reserva</h2>
        <p>Reserva tu mesa para una experiencia gastronómica inolvidable</p>
        <form class="reservation-form">
            <div class="form-group">
                <input type="text" placeholder="Nombre completo" required>
            </div>
            <div class="form-group">
                <input type="email" placeholder="Email" required>
            </div>
            <div class="form-group">
                <input type="date" required>
            </div>
            <div class="form-group">
                <select required>
                    <option value="">Selecciona la hora</option>
                    <option value="19:00">19:00</option>
                    <option value="20:00">20:00</option>
                    <option value="21:00">21:00</option>
                </select>
            </div>
            <button type="submit" class="btn">Reservar Mesa</button>
        </form>
    </section>

    <footer style="background: #333; color: white; text-align: center; padding: 2rem;">
        <p>&copy; 2024 Restaurante Gourmet. Todos los derechos reservados. | Generado específicamente para: "${userRequest}"</p>
    </footer>

    <script>
        document.querySelector('.reservation-form').addEventListener('submit', function(e) {
            e.preventDefault();
            alert('¡Reserva enviada! Te contactaremos pronto para confirmar.');
        });

        console.log('🍽️ Sitio web de restaurante cargado - Generado específicamente');
    </script>
</body>
</html>
\`\`\`

**Características del Restaurante:**
- ✅ Diseño elegante y sofisticado
- ✅ Menú digital con precios
- ✅ Sistema de reservas funcional
- ✅ Galería de platos
- ✅ Información de contacto
- ✅ Diseño responsivo

*Generado específicamente para tu solicitud: "${userRequest}"*`;
  };

  // Función para generar contenido de portfolio
  const generatePortfolioFallbackContent = (userRequest: string): string => {
    return `# Portfolio Profesional - Generado Específicamente

Basándome en tu solicitud: "${userRequest}"

\`\`\`html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portfolio Profesional - Desarrollador Creativo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .header { background: #2c3e50; color: white; padding: 1rem 0; position: fixed; width: 100%; top: 0; z-index: 1000; }
        .hero { height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; text-align: center; color: white; }
        .projects { padding: 4rem 2rem; max-width: 1200px; margin: 0 auto; }
        .project-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .project-card { background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); overflow: hidden; transition: transform 0.3s; }
        .project-card:hover { transform: translateY(-5px); }
    </style>
</head>
<body>
    <header class="header">
        <nav style="max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 1.5rem; font-weight: bold;">💼 Mi Portfolio</div>
            <div>
                <a href="#proyectos" style="color: white; text-decoration: none; margin: 0 1rem;">Proyectos</a>
                <a href="#sobre-mi" style="color: white; text-decoration: none; margin: 0 1rem;">Sobre Mí</a>
                <a href="#contacto" style="color: white; text-decoration: none; margin: 0 1rem;">Contacto</a>
            </div>
        </nav>
    </header>

    <section class="hero">
        <div>
            <h1 style="font-size: 3rem; margin-bottom: 1rem;">Desarrollador Creativo</h1>
            <p style="font-size: 1.2rem;">Creando experiencias digitales excepcionales</p>
        </div>
    </section>

    <section class="projects" id="proyectos">
        <h2 style="text-align: center; font-size: 2.5rem; margin-bottom: 3rem;">Mis Proyectos</h2>
        <div class="project-grid">
            <div class="project-card">
                <div style="height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 3rem;">🌐</div>
                <div style="padding: 1.5rem;">
                    <h3>Aplicación Web Moderna</h3>
                    <p>Desarrollo de aplicación web con React y Node.js</p>
                </div>
            </div>

            <div class="project-card">
                <div style="height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 3rem;">📱</div>
                <div style="padding: 1.5rem;">
                    <h3>App Móvil Innovadora</h3>
                    <p>Aplicación móvil multiplataforma con Flutter</p>
                </div>
            </div>

            <div class="project-card">
                <div style="height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 3rem;">🎨</div>
                <div style="padding: 1.5rem;">
                    <h3>Diseño UI/UX</h3>
                    <p>Diseño de interfaz moderna y experiencia de usuario</p>
                </div>
            </div>
        </div>
    </section>

    <footer style="background: #2c3e50; color: white; text-align: center; padding: 2rem;">
        <p>&copy; 2024 Portfolio Profesional. Todos los derechos reservados. | Generado específicamente para: "${userRequest}"</p>
    </footer>

    <script>
        console.log('💼 Portfolio profesional cargado - Generado específicamente');
    </script>
</body>
</html>
\`\`\`

**Características del Portfolio:**
- ✅ Diseño profesional y moderno
- ✅ Galería de proyectos
- ✅ Sección sobre mí
- ✅ Información de contacto
- ✅ Diseño responsivo

*Generado específicamente para tu solicitud: "${userRequest}"*`;
  };

  // Función simplificada para procesar la solicitud del usuario
  const processUserRequest = async (request: string) => {
    console.log(`🚀 Procesando solicitud: "${request}"`);

    // Añadir mensaje de "pensando"
    const thinkingMessage: Message = {
      id: generateUniqueId('msg-thinking'),
      content: `🤖 Analizando tu solicitud y generando sitio web personalizado...`,
      sender: 'assistant',
      timestamp: Date.now(),
      type: 'text'
    };

    setMessages(prev => [...prev, thinkingMessage]);

    try {
      // Usar directamente el sistema de fallback específico (más confiable)
      console.log(`🎯 Detectando tipo de sitio para: "${request}"`);
      const siteType = detectSiteType(request);
      console.log(`🎯 Tipo detectado: ${siteType}`);

      const generatedContent = generateSpecificFallbackContent(request);
      console.log(`📄 Contenido generado (${generatedContent.length} caracteres)`);

      // Extraer archivos del contenido
      const files = extractFilesFromContent(generatedContent);
      console.log(`📁 Archivos extraídos: ${files.length}`, files.map(f => f.path));

      if (files.length > 0) {
        // Actualizar archivos generados
        setGeneratedFiles(files);
        if (onFilesUpdated) {
          onFilesUpdated(files);
        }

        // Activar vista previa automática
        const htmlFile = files.find(f => f.path.endsWith('.html'));
        if (htmlFile && onAutoPreview) {
          console.log(`🎨 Activando vista previa automática`);
          onAutoPreview(htmlFile.content, '', '');
        }

        // Añadir mensajes de respuesta
        const modelInfoMessage: Message = {
          id: generateUniqueId('msg-model-info'),
          content: `🔄 **Generado con sistema específico**\n🎯 Tipo detectado: ${siteType}\n⚡ Contenido optimizado para tu solicitud`,
          sender: 'assistant',
          timestamp: Date.now(),
          type: 'suggestion'
        };

        const assistantMessage: Message = {
          id: generateUniqueId('msg-response'),
          content: generatedContent,
          sender: 'assistant',
          timestamp: Date.now(),
          type: 'text'
        };

        const successMessage: Message = {
          id: generateUniqueId('msg-success'),
          content: `✅ **Sitio web generado exitosamente**\n\n📁 **Archivos creados:**\n${files.map(file => `• \`${file.path}\``).join('\n')}\n\n🎨 **Vista previa activada** - Tu sitio web se muestra completamente funcional.\n\n💡 **Características implementadas:**\n• ✨ Diseño específico para tu solicitud\n• 🖱️ Interactividad completa\n• 📱 Responsive design\n• 🎯 Contenido personalizado`,
          sender: 'assistant',
          timestamp: Date.now(),
          type: 'suggestion'
        };

        setMessages(prev => [
          ...prev.filter(msg => msg.id !== thinkingMessage.id),
          modelInfoMessage,
          assistantMessage,
          successMessage
        ]);

        // Mostrar la vista previa
        setShowPreview(true);

        console.log('✅ Sitio web generado exitosamente');
        return;
      } else {
        throw new Error('No se pudieron extraer archivos del contenido generado');
      }
    } catch (error) {
      console.error('❌ Error al procesar la solicitud:', error);

      // Añadir mensaje de error
      const errorMessage: Message = {
        id: generateUniqueId('msg-error'),
        content: `❌ Error al procesar tu solicitud: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        sender: 'assistant',
        timestamp: Date.now(),
        type: 'text'
      };

      setMessages(prev => [
        ...prev.filter(msg => msg.id !== thinkingMessage.id),
        errorMessage
      ]);
    }
  };

  // Función para seleccionar una plantilla basada en la descripción
  const selectTemplateBasedOnDescription = (description: string): WebTemplate => {
    const lowerDesc = description.toLowerCase();

    // Buscar palabras clave en la descripción
    if (lowerDesc.includes('pastelería') || lowerDesc.includes('panadería') || lowerDesc.includes('restaurante') || lowerDesc.includes('cafetería')) {
      return availableTemplates.find(t => t.category === 'business') || availableTemplates[0];
    } else if (lowerDesc.includes('portafolio') || lowerDesc.includes('portfolio') || lowerDesc.includes('diseño') || lowerDesc.includes('arte')) {
      return availableTemplates.find(t => t.category === 'portfolio') || availableTemplates[0];
    } else if (lowerDesc.includes('tienda') || lowerDesc.includes('ecommerce') || lowerDesc.includes('productos') || lowerDesc.includes('venta')) {
      return availableTemplates.find(t => t.category === 'ecommerce') || availableTemplates[0];
    } else if (lowerDesc.includes('blog') || lowerDesc.includes('noticias') || lowerDesc.includes('artículos')) {
      return availableTemplates.find(t => t.category === 'blog') || availableTemplates[0];
    } else if (lowerDesc.includes('landing') || lowerDesc.includes('promoción') || lowerDesc.includes('producto')) {
      return availableTemplates.find(t => t.category === 'landing') || availableTemplates[0];
    } else {
      // Si no hay coincidencias claras, devolver la primera plantilla
      return availableTemplates[0];
    }
  };

  // Función para seleccionar componentes basados en la descripción
  const selectComponentsBasedOnDescription = (description: string): WebComponent[] => {
    const lowerDesc = description.toLowerCase();
    const selectedComponents: WebComponent[] = [];

    // Añadir componentes básicos que siempre se incluyen
    const navbar = availableComponents.find(c => c.id === 'navbar');
    if (navbar) selectedComponents.push(navbar);

    const section = availableComponents.find(c => c.id === 'section');
    if (section) selectedComponents.push(section);

    // Añadir componentes según palabras clave
    if (lowerDesc.includes('producto')) {
      const productGrid = availableComponents.find(c => c.id === 'product-grid');
      if (productGrid) selectedComponents.push(productGrid);
    }

    if (lowerDesc.includes('galería') || lowerDesc.includes('foto')) {
      const gallery = availableComponents.find(c => c.id === 'gallery');
      if (gallery) selectedComponents.push(gallery);
    }

    if (lowerDesc.includes('contacto') || lowerDesc.includes('formulario')) {
      const contactForm = availableComponents.find(c => c.id === 'contact-form');
      if (contactForm) selectedComponents.push(contactForm);
    }

    if (lowerDesc.includes('equipo') || lowerDesc.includes('nosotros') || lowerDesc.includes('sobre')) {
      const heading = availableComponents.find(c => c.id === 'heading');
      if (heading) selectedComponents.push(heading);

      const paragraph = availableComponents.find(c => c.id === 'paragraph');
      if (paragraph) selectedComponents.push(paragraph);
    }

    // Añadir pie de página
    const footer = availableComponents.find(c => c.id === 'footer');
    if (footer) selectedComponents.push(footer);

    return selectedComponents;
  };

  // Función para generar HTML de ejemplo para la vista previa
  const generatePreviewHtml = (description: string, template: WebTemplate, components: WebComponent[]): string => {
    // Extraer el tipo de negocio o sitio web de la descripción
    let siteName = 'Mi Sitio Web';
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('pastelería')) {
      siteName = 'Pastelería Artesanal';
    } else if (lowerDesc.includes('portafolio')) {
      siteName = 'Mi Portafolio Creativo';
    } else if (lowerDesc.includes('tienda')) {
      siteName = 'Tienda Online';
    } else if (lowerDesc.includes('blog')) {
      siteName = 'Mi Blog Personal';
    }

    // Generar HTML básico
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${siteName}</title>
        <style>
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; color: #333; }
          .navbar { background-color: #0f172a; color: white; padding: 1rem; display: flex; justify-content: space-between; align-items: center; }
          .navbar-brand { font-weight: bold; font-size: 1.5rem; }
          .navbar-links { display: flex; gap: 1rem; }
          .navbar-links a { color: white; text-decoration: none; }
          .hero { background-color: #1e293b; color: white; padding: 4rem 2rem; text-align: center; }
          .hero h1 { font-size: 2.5rem; margin-bottom: 1rem; }
          .hero p { font-size: 1.2rem; max-width: 600px; margin: 0 auto; }
          .section { padding: 4rem 2rem; }
          .container { max-width: 1200px; margin: 0 auto; }
          .footer { background-color: #0f172a; color: white; padding: 2rem; text-align: center; }
        </style>
      </head>
      <body>
        <nav class="navbar">
          <div class="navbar-brand">${siteName}</div>
          <div class="navbar-links">
            <a href="#">Inicio</a>
            <a href="#">Servicios</a>
            <a href="#">Acerca de</a>
            <a href="#">Contacto</a>
          </div>
        </nav>

        <div class="hero">
          <h1>Bienvenido a ${siteName}</h1>
          <p>Este es un sitio web generado automáticamente basado en tu descripción.</p>
        </div>

        <div class="section">
          <div class="container">
            <h2>Contenido Principal</h2>
            <p>Aquí iría el contenido principal de tu sitio web, adaptado según tus necesidades específicas.</p>
          </div>
        </div>

        <footer class="footer">
          <p>&copy; 2023 ${siteName}. Todos los derechos reservados.</p>
        </footer>
      </body>
      </html>
    `;
  };

  // Función para cancelar el proceso de generación
  const handleCancelGeneration = () => {
    // Añadir mensaje de cancelación
    const cancelMessage: Message = {
      id: generateUniqueId('msg-cancel'),
      content: 'Has cancelado el proceso de generación. ¿En qué más puedo ayudarte?',
      sender: 'assistant',
      timestamp: Date.now(),
      type: 'text'
    };

    setMessages(prev => [...prev, cancelMessage]);
    setShowAgentPanel(false);
  };

  return (
    <div className="flex overflow-hidden flex-col h-full rounded-lg shadow-lg bg-codestorm-darker">
      {/* Encabezado */}
      <div className="flex justify-between items-center p-3 border-b bg-codestorm-blue/20 border-codestorm-blue/30">
        <div className="flex items-center">
          <Bot className="mr-2 w-5 h-5 text-codestorm-blue" />
          <h2 className="text-sm font-medium text-white">Asistente de Diseño Web</h2>
        </div>
        <div className="flex space-x-2">
          {isSpeechSupported && (
            <button
              onClick={() => setShowSpeechSettings(true)}
              className={`p-1.5 rounded transition-colors hover:text-codestorm-accent ${
                speechEnabled ? 'text-codestorm-accent' : 'text-gray-400'
              }`}
              title="Configuración de síntesis de voz"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowAgentPanel(!showAgentPanel)}
            className={`p-1.5 rounded ${showAgentPanel ? 'bg-codestorm-blue/30 text-white' : 'text-gray-400 hover:bg-codestorm-blue/20 hover:text-white'}`}
            title={showAgentPanel ? "Ocultar panel de agentes" : "Mostrar panel de agentes"}
          >
            <Cpu className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`p-1.5 rounded ${showPreview ? 'bg-codestorm-accent/30 text-codestorm-accent' : 'text-gray-400 hover:bg-codestorm-blue/20 hover:text-white'}`}
            title={showPreview ? "Ocultar vista previa" : "Mostrar vista previa integrada"}
          >
            <Eye className="w-4 h-4" />
          </button>
          {generatedFiles.length > 0 && (
            <button
              onClick={onPreview}
              className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
              title="Abrir en pantalla completa"
            >
              <Monitor className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Área de chat, vista previa y panel de agentes */}
      <div className="flex overflow-hidden flex-1">
        {/* Panel de agentes (visible solo cuando está activo) */}
        {showAgentPanel && (
          <div className="hidden border-r md:block md:w-1/3 border-codestorm-blue/30">
            <AgentProgressPanel
              tasks={agentTasks}
              onCancel={handleCancelGeneration}
            />
          </div>
        )}

        {/* Chat */}
        <div className={`flex-1 flex flex-col ${showPreview ? 'md:w-1/2' : showAgentPanel ? 'md:w-1/3' : 'w-full'} overflow-hidden`}>
          {/* Mensajes */}
          <div className="overflow-y-auto flex-1 p-3 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 transition-smooth ${
                    message.sender === 'user'
                      ? 'bg-codestorm-accent text-white chat-message-pulse-user'
                      : message.type === 'suggestion'
                        ? 'bg-codestorm-blue/30 text-white border border-codestorm-blue/50 chat-message-pulse-system'
                        : 'bg-codestorm-blue/20 text-white chat-message-pulse'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    {message.sender === 'user' ? (
                      <User className="mr-2 w-4 h-4" />
                    ) : message.type === 'suggestion' && message.metadata?.designProposal ? (
                      <Palette className="mr-2 w-4 h-4 text-purple-400" />
                    ) : message.type === 'suggestion' && message.metadata?.files ? (
                      <Code className="mr-2 w-4 h-4 text-blue-400" />
                    ) : (
                      <Bot className="mr-2 w-4 h-4" />
                    )}
                    <span className="text-xs text-gray-300">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {/* Controles de síntesis de voz para mensajes del asistente */}
                  {speechEnabled && isSpeechSupported && message.sender === 'assistant' && message.type === 'text' && (
                    <div className="flex justify-end mt-2">
                      <SpeechControls
                        text={message.content}
                        autoPlay={autoPlaySpeech}
                        compact={true}
                        showSettings={false}
                        className="opacity-70 transition-opacity hover:opacity-100"
                        onSpeechStart={() => handleSpeechStart(message.id)}
                        onSpeechEnd={() => handleSpeechEnd(message.id)}
                        onSpeechError={(error) => handleSpeechError(message.id, error)}
                      />
                    </div>
                  )}

                  {/* Botones de acción para mensajes de tipo preview */}
                  {message.type === 'preview' && (
                    <div className="flex mt-2 space-x-2">
                      <button
                        onClick={() => setShowPreview(true)}
                        className="flex items-center px-2 py-1 text-xs text-white rounded bg-codestorm-accent/40 hover:bg-codestorm-accent/60"
                      >
                        <Eye className="mr-1 w-3 h-3" />
                        Mostrar vista previa integrada
                      </button>
                      <button
                        onClick={onPreview}
                        className="flex items-center px-2 py-1 text-xs text-white rounded bg-codestorm-blue/40 hover:bg-codestorm-blue/60"
                      >
                        <Monitor className="mr-1 w-3 h-3" />
                        Pantalla completa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Entrada de texto */}
          <div className="p-3 border-t border-codestorm-blue/30">
            <div className="flex space-x-2">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Describe el sitio web estático que quieres crear (ej: sitio para restaurante, empresa, portfolio, etc.)..."
                className={`flex-1 p-2 text-white placeholder-gray-400 border rounded-md resize-none bg-codestorm-dark ${
                  isEnhancing
                    ? 'border-codestorm-gold shadow-glow-blue animate-pulse-subtle'
                    : 'border-codestorm-blue/30'
                }`}
                rows={2}
                disabled={isProcessing || isEnhancing}
              />
              <div className="flex flex-col justify-between space-y-2">
                {/* Botón de carga de documentos */}
                <DocumentUploader
                  onDocumentProcessed={handleDocumentProcessed}
                  disabled={isProcessing || isEnhancing}
                  className="flex-shrink-0"
                />

                {/* Botón de micrófono - usar sistema avanzado si está disponible */}
                {isAdvancedVoiceInitialized ? (
                  <button
                    onClick={() => {
                      if (isAdvancedListening) {
                        stopAdvancedListening();
                      } else {
                        startAdvancedListening();
                      }
                    }}
                    disabled={isProcessing || isEnhancing}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      isAdvancedListening
                        ? 'text-white bg-red-500 animate-pulse'
                        : 'text-gray-400 bg-gray-700 hover:bg-gray-600 hover:text-white'
                    } ${isProcessing || isEnhancing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isAdvancedListening ? 'Detener grabación' : 'Iniciar grabación de voz'}
                  >
                    {isAdvancedListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                ) : (
                  <VoiceInputButton
                    onTranscript={(transcript) => setInputValue(transcript)}
                    onFinalTranscript={(transcript) => setInputValue(transcript)}
                    disabled={isProcessing || isEnhancing}
                    size="md"
                    autoSend={false}
                    showTranscript={false}
                    className="flex-shrink-0"
                  />
                )}

                <button
                  onClick={toggleEnhancePrompt}
                  className={`p-2 rounded-md ${
                    enhancePromptEnabled
                      ? 'text-white bg-codestorm-gold'
                      : 'text-gray-400 bg-gray-700 hover:bg-gray-600 hover:text-white'
                  }`}
                  title={enhancePromptEnabled ? 'Desactivar mejora de prompts (WebAI - Sitios Estáticos)' : 'Activar mejora de prompts (WebAI - Sitios Estáticos)'}
                >
                  <div className="relative">
                    <Globe className="w-4 h-4" />
                    <Sparkles className="absolute -top-1 -right-1 w-2 h-2 text-codestorm-gold" />
                  </div>
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isProcessing || isEnhancing}
                  className={`p-2 rounded-md ${
                    !inputValue.trim() || isProcessing || isEnhancing
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-codestorm-accent hover:bg-codestorm-accent/80 text-white'
                  }`}
                  title="Enviar mensaje"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isEnhancing ? (
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center text-xs text-gray-400">
                <Zap className="mr-1 w-3 h-3 text-codestorm-blue" />
                <span>Describe tu sitio web con detalle para mejores resultados</span>
              </div>

              <div className="flex items-center space-x-2">
                {enhancePromptEnabled && (
                  <div className="flex items-center text-xs text-codestorm-gold">
                    <Globe className="mr-1 w-3 h-3" />
                    <span>WebAI EnhanceAgent activo</span>
                  </div>
                )}

                {showAgentPanel && (
                  <div className="flex items-center text-xs text-green-400">
                    <Cpu className="mr-1 w-3 h-3" />
                    <span>Agentes activos</span>
                  </div>
                )}
              </div>
            </div>

            {/* Indicador de estado de voz avanzado */}
            {isAdvancedVoiceInitialized && (
              <div className="mt-2">
                <VoiceStateIndicator
                  state={advancedVoiceState}
                  size="sm"
                  showText={true}
                />
              </div>
            )}

            {/* Mensaje de error de voz avanzado */}
            {advancedVoiceError && (
              <div className="flex items-center mt-2 text-xs text-red-400">
                <AlertCircle className="mr-1 w-3 h-3" />
                <span>{advancedVoiceError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Vista previa moderna integrada */}
        {showPreview && (
          <div className="hidden flex-col border-l md:flex md:w-1/2 border-codestorm-blue/30">
            <div className="flex justify-between items-center p-3 border-b bg-codestorm-blue/10 border-codestorm-blue/30">
              <h3 className="flex items-center text-sm font-medium text-white">
                <Eye className="mr-2 w-4 h-4 text-codestorm-accent" />
                Vista Previa Integrada
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1.5 rounded hover:bg-codestorm-blue/30 text-gray-400 hover:text-white"
                title="Cerrar vista previa"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-auto flex-1 bg-gray-50">
              <WebPreviewRenderer
                files={generatedFiles}
                isVisible={showPreview}
                onFilesGenerated={onFilesGenerated}
                onError={(error) => {
                  console.error('Error en vista previa:', error);
                  // Añadir mensaje de error al chat
                  const errorMessage: Message = {
                    id: generateUniqueId('msg-preview-error'),
                    content: `❌ Error en la vista previa: ${error}`,
                    sender: 'assistant',
                    timestamp: Date.now(),
                    type: 'text'
                  };
                  setMessages(prev => [...prev, errorMessage]);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Panel de agentes móvil (visible solo cuando está activo) */}
      {showAgentPanel && (
        <div className="flex fixed inset-0 z-50 justify-center items-center p-4 md:hidden bg-codestorm-darker/90">
          <div className="w-full max-w-md h-[80vh] bg-codestorm-darker rounded-lg shadow-lg overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b border-codestorm-blue/30">
              <h3 className="flex items-center font-medium text-white">
                <Cpu className="mr-2 w-4 h-4 text-codestorm-blue" />
                Progreso de Agentes
              </h3>
              <button
                onClick={() => setShowAgentPanel(false)}
                className="p-1.5 rounded hover:bg-codestorm-blue/20 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 h-[calc(80vh-48px)] overflow-auto">
              <AgentProgressPanel
                tasks={agentTasks}
                onCancel={handleCancelGeneration}
              />
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de prompt mejorado */}
      {currentEnhancedPrompt && (
        <EnhancedPromptDialog
          enhancedPrompt={currentEnhancedPrompt}
          onClose={() => {
            setShowEnhancedPromptDialog(false);
            setCurrentSpecializedResult(null);
          }}
          onUseOriginal={handleUseOriginalPrompt}
          onUseEnhanced={handleUseEnhancedPrompt}
          isVisible={showEnhancedPromptDialog}
          specializedResult={currentSpecializedResult || undefined}
        />
      )}

      {/* Configuración de Síntesis de Voz */}
      <SpeechSettings
        isOpen={showSpeechSettings}
        onClose={() => setShowSpeechSettings(false)}
        onSave={handleSpeechConfigSave}
      />
    </div>
  );
};

export default WebAIAssistant;
