import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Sparkles, Zap, Code, Monitor, Smartphone, Tablet, X, Palette, Cpu, Split } from 'lucide-react';
import { PromptEnhancerService, EnhancedPrompt } from '../../services/PromptEnhancerService';
import EnhancedPromptDialog from '../EnhancedPromptDialog';
import { WebTemplate } from './WebTemplateSelector';
import { WebComponent } from './ComponentPalette';
import { generateUniqueId } from '../../utils/idGenerator';
import AgentProgressPanel from './AgentProgressPanel';
import AgentCoordinatorService, { CoordinatorTask } from '../../services/AgentCoordinatorService';
import { DesignProposal, FileItem } from '../../types';

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
  isProcessing,
  availableTemplates,
  availableComponents
}) => {
  // Estados para el chat
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: '¡Hola! Soy tu asistente de diseño web. Describe el sitio web que te gustaría crear y te ayudaré a construirlo automáticamente. Por ejemplo: "Crea un sitio web para una pastelería artesanal con sección de productos, galería de fotos y formulario de contacto".',
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

  // Estado para la vista previa
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string>('');

  // Estados para los agentes
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [agentTasks, setAgentTasks] = useState<CoordinatorTask[]>([]);
  const [designProposal, setDesignProposal] = useState<DesignProposal | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<FileItem[]>([]);

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
        setGeneratedFiles(files);
        if (onFilesGenerated) {
          onFilesGenerated(files);
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
        const result = await PromptEnhancerService.enhancePrompt(inputValue);

        if (result.success && result.enhancedPrompt) {
          setCurrentEnhancedPrompt(result.enhancedPrompt);
          setShowEnhancedPromptDialog(true);
        } else {
          // Si hay un error, enviar el mensaje original
          await sendOriginalMessage();
        }
      } catch (error) {
        console.error('Error al mejorar el prompt:', error);
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

  // Función para procesar la solicitud del usuario
  const processUserRequest = async (request: string) => {
    // Añadir mensaje de "pensando"
    const thinkingMessage: Message = {
      id: generateUniqueId('msg-thinking'),
      content: 'Analizando tu solicitud y generando un sitio web personalizado...',
      sender: 'assistant',
      timestamp: Date.now(),
      type: 'text'
    };

    setMessages(prev => [...prev, thinkingMessage]);

    // Mostrar el panel de agentes
    setShowAgentPanel(true);

    try {
      // Iniciar el proceso de generación con el coordinador de agentes
      const coordinator = AgentCoordinatorService.getInstance();
      const result = await coordinator.generateWebsite(request);

      // Si hay una propuesta de diseño
      if (result.designProposal) {
        // Añadir mensaje con la propuesta de diseño
        const designMessage: Message = {
          id: generateUniqueId('msg-design'),
          content: `El Agente de Diseño ha creado una propuesta para tu sitio web: "${result.designProposal.title}". ${result.designProposal.description}`,
          sender: 'assistant',
          timestamp: Date.now(),
          type: 'suggestion',
          metadata: { designProposal: result.designProposal }
        };

        // Añadir mensaje con los componentes
        const componentsMessage: Message = {
          id: generateUniqueId('msg-components'),
          content: `Se han diseñado los siguientes componentes:\n${result.designProposal.components.map(comp => `• ${comp.name}: ${comp.description}`).join('\n')}`,
          sender: 'assistant',
          timestamp: Date.now(),
          type: 'suggestion',
          metadata: { components: result.designProposal.components }
        };

        // Añadir mensaje con la paleta de colores
        const colorsMessage: Message = {
          id: generateUniqueId('msg-colors'),
          content: `Paleta de colores seleccionada:\n• Principal: ${result.designProposal.colorPalette.primary}\n• Secundario: ${result.designProposal.colorPalette.secondary}\n• Acento: ${result.designProposal.colorPalette.accent}\n• Fondo: ${result.designProposal.colorPalette.background}\n• Texto: ${result.designProposal.colorPalette.text}`,
          sender: 'assistant',
          timestamp: Date.now(),
          type: 'suggestion',
          metadata: { colors: result.designProposal.colorPalette }
        };

        // Actualizar mensajes
        setMessages(prev => [
          ...prev.filter(msg => msg.id !== thinkingMessage.id), // Eliminar mensaje de "pensando"
          designMessage,
          componentsMessage,
          colorsMessage
        ]);
      }

      // Si hay archivos generados
      if (result.files && result.files.length > 0) {
        // Encontrar el archivo HTML principal
        const htmlFile = result.files.find(file => file.path.endsWith('.html'));
        if (htmlFile) {
          setGeneratedHtml(htmlFile.content);
        }

        // Añadir mensaje con los archivos generados
        const filesMessage: Message = {
          id: generateUniqueId('msg-files'),
          content: `El Agente de Código ha generado ${result.files.length} archivos para tu sitio web:\n${result.files.map(file => `• ${file.path}`).join('\n')}`,
          sender: 'assistant',
          timestamp: Date.now(),
          type: 'suggestion',
          metadata: { files: result.files }
        };

        // Añadir mensaje con la vista previa
        const previewMessage: Message = {
          id: generateUniqueId('msg-preview'),
          content: 'He generado una vista previa de tu sitio web. Puedes verla en diferentes dispositivos y realizar ajustes según tus preferencias.',
          sender: 'assistant',
          timestamp: Date.now(),
          type: 'preview'
        };

        // Añadir mensaje con opciones para continuar
        const optionsMessage: Message = {
          id: generateUniqueId('msg-options'),
          content: '¿Qué te gustaría hacer ahora?\n• Editar manualmente el diseño\n• Añadir más componentes\n• Cambiar la plantilla\n• Continuar con la siguiente etapa',
          sender: 'assistant',
          timestamp: Date.now(),
          type: 'suggestion'
        };

        // Actualizar mensajes
        setMessages(prev => [
          ...prev,
          filesMessage,
          previewMessage,
          optionsMessage
        ]);

        // Mostrar la vista previa
        setShowPreview(true);
      }

      // Notificar que se ha generado un sitio web
      onGenerateWebsite(request);
    } catch (error) {
      console.error('Error al procesar la solicitud:', error);

      // Añadir mensaje de error
      const errorMessage: Message = {
        id: generateUniqueId('msg-error'),
        content: `Ha ocurrido un error al procesar tu solicitud: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        sender: 'assistant',
        timestamp: Date.now(),
        type: 'text'
      };

      // Actualizar mensajes
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== thinkingMessage.id), // Eliminar mensaje de "pensando"
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
    <div className="flex flex-col h-full bg-codestorm-darker rounded-lg shadow-lg overflow-hidden">
      {/* Encabezado */}
      <div className="bg-codestorm-blue/20 p-3 border-b border-codestorm-blue/30 flex justify-between items-center">
        <div className="flex items-center">
          <Bot className="h-5 w-5 text-codestorm-blue mr-2" />
          <h2 className="text-sm font-medium text-white">Asistente de Diseño Web</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAgentPanel(!showAgentPanel)}
            className={`p-1.5 rounded ${showAgentPanel ? 'bg-codestorm-blue/30 text-white' : 'text-gray-400 hover:bg-codestorm-blue/20 hover:text-white'}`}
            title={showAgentPanel ? "Ocultar panel de agentes" : "Mostrar panel de agentes"}
          >
            <Cpu className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPreviewDevice('desktop')}
            className={`p-1.5 rounded ${previewDevice === 'desktop' ? 'bg-codestorm-blue/30 text-white' : 'text-gray-400 hover:bg-codestorm-blue/20 hover:text-white'}`}
            title="Vista de escritorio"
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPreviewDevice('tablet')}
            className={`p-1.5 rounded ${previewDevice === 'tablet' ? 'bg-codestorm-blue/30 text-white' : 'text-gray-400 hover:bg-codestorm-blue/20 hover:text-white'}`}
            title="Vista de tablet"
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPreviewDevice('mobile')}
            className={`p-1.5 rounded ${previewDevice === 'mobile' ? 'bg-codestorm-blue/30 text-white' : 'text-gray-400 hover:bg-codestorm-blue/20 hover:text-white'}`}
            title="Vista de móvil"
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Área de chat, vista previa y panel de agentes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel de agentes (visible solo cuando está activo) */}
        {showAgentPanel && (
          <div className="hidden md:block md:w-1/3 border-r border-codestorm-blue/30">
            <AgentProgressPanel
              tasks={agentTasks}
              onCancel={handleCancelGeneration}
            />
          </div>
        )}

        {/* Chat */}
        <div className={`flex-1 flex flex-col ${showPreview ? 'md:w-1/2' : showAgentPanel ? 'md:w-1/3' : 'w-full'} overflow-hidden`}>
          {/* Mensajes */}
          <div className="flex-1 p-3 space-y-4 overflow-y-auto">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-codestorm-accent text-white'
                      : message.type === 'suggestion'
                        ? 'bg-codestorm-blue/30 text-white border border-codestorm-blue/50'
                        : 'bg-codestorm-blue/20 text-white'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4 mr-2" />
                    ) : message.type === 'suggestion' && message.metadata?.designProposal ? (
                      <Palette className="w-4 h-4 mr-2 text-purple-400" />
                    ) : message.type === 'suggestion' && message.metadata?.files ? (
                      <Code className="w-4 h-4 mr-2 text-blue-400" />
                    ) : (
                      <Bot className="w-4 h-4 mr-2" />
                    )}
                    <span className="text-xs text-gray-300">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {/* Botones de acción para mensajes de tipo preview */}
                  {message.type === 'preview' && (
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={onPreview}
                        className="px-2 py-1 bg-codestorm-blue/40 hover:bg-codestorm-blue/60 text-white text-xs rounded flex items-center"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Ver en pantalla completa
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
                placeholder="Describe el sitio web que quieres crear..."
                className={`flex-1 p-2 text-white placeholder-gray-400 border rounded-md resize-none bg-codestorm-dark ${
                  isEnhancing
                    ? 'border-codestorm-gold shadow-glow-blue animate-pulse-subtle'
                    : 'border-codestorm-blue/30'
                }`}
                rows={2}
                disabled={isProcessing || isEnhancing}
              />
              <div className="flex flex-col justify-between space-y-2">
                <button
                  onClick={toggleEnhancePrompt}
                  className={`p-2 rounded-md ${
                    enhancePromptEnabled
                      ? 'bg-codestorm-gold text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                  }`}
                  title={enhancePromptEnabled ? 'Desactivar mejora de prompts' : 'Activar mejora de prompts'}
                >
                  <Sparkles className="w-4 h-4" />
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

            <div className="mt-2 flex justify-between items-center">
              <div className="flex items-center text-xs text-gray-400">
                <Zap className="w-3 h-3 mr-1 text-codestorm-blue" />
                <span>Describe tu sitio web con detalle para mejores resultados</span>
              </div>

              <div className="flex items-center space-x-2">
                {enhancePromptEnabled && (
                  <div className="flex items-center text-xs text-codestorm-gold">
                    <Sparkles className="w-3 h-3 mr-1" />
                    <span>Mejora de prompts activada</span>
                  </div>
                )}

                {showAgentPanel && (
                  <div className="flex items-center text-xs text-green-400">
                    <Cpu className="w-3 h-3 mr-1" />
                    <span>Agentes activos</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Vista previa */}
        {showPreview && (
          <div className="hidden md:flex md:w-1/2 border-l border-codestorm-blue/30 flex-col">
            <div className="p-3 bg-codestorm-blue/10 border-b border-codestorm-blue/30 flex justify-between items-center">
              <h3 className="text-sm font-medium text-white">Vista Previa</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1.5 rounded hover:bg-codestorm-blue/30 text-gray-400 hover:text-white"
                title="Cerrar vista previa"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-100">
              <div
                className={`mx-auto bg-white shadow-lg transition-all duration-300 ${
                  previewDevice === 'mobile'
                    ? 'w-[375px]'
                    : previewDevice === 'tablet'
                      ? 'w-[768px]'
                      : 'w-full max-w-[1200px]'
                }`}
              >
                <iframe
                  srcDoc={generatedHtml}
                  title="Vista previa del sitio web"
                  className="w-full h-[500px] border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel de agentes móvil (visible solo cuando está activo) */}
      {showAgentPanel && (
        <div className="md:hidden fixed inset-0 z-50 bg-codestorm-darker/90 flex items-center justify-center p-4">
          <div className="w-full max-w-md h-[80vh] bg-codestorm-darker rounded-lg shadow-lg overflow-hidden">
            <div className="flex justify-between items-center p-3 border-b border-codestorm-blue/30">
              <h3 className="text-white font-medium flex items-center">
                <Cpu className="h-4 w-4 mr-2 text-codestorm-blue" />
                Progreso de Agentes
              </h3>
              <button
                onClick={() => setShowAgentPanel(false)}
                className="p-1.5 rounded hover:bg-codestorm-blue/20 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
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
          onClose={() => setShowEnhancedPromptDialog(false)}
          onUseOriginal={handleUseOriginalPrompt}
          onUseEnhanced={handleUseEnhancedPrompt}
          isVisible={showEnhancedPromptDialog}
        />
      )}
    </div>
  );
};

export default WebAIAssistant;
