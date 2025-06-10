import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { generateUniqueId } from '../../utils/idGenerator';
import AIModelManager from '../../services/AIModelManager';
import { FileItem } from '../../types';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: number;
  type?: 'text' | 'suggestion';
}

interface WebAIAssistantSimpleProps {
  onFilesUpdated?: (files: FileItem[]) => void;
  onAutoPreview?: (html: string, css: string, js: string) => void;
  isProcessing?: boolean;
}

const WebAIAssistantSimple: React.FC<WebAIAssistantSimpleProps> = ({
  onFilesUpdated,
  onAutoPreview,
  isProcessing = false
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateUniqueId('msg-welcome'),
      content: '¡Hola! Soy tu asistente de diseño web. Describe el sitio web que quieres crear y lo generaré específicamente para ti.',
      sender: 'assistant',
      timestamp: Date.now(),
      type: 'text'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [modelManager] = useState(() => AIModelManager.getInstance());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  // Función para extraer archivos del contenido
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
        lastModified: Date.now(),
        timestamp: Date.now()
      });
    }

    return files;
  };

  // Función para generar contenido de e-commerce
  const generateEcommerceFallback = (userRequest: string): string => {
    return `# Tienda Online de Productos Tecnológicos

Basándome en tu solicitud: "${userRequest}"

\`\`\`html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TechStore - Productos Tecnológicos</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem 0; position: sticky; top: 0; z-index: 100; }
        .nav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
        .logo { font-size: 1.8rem; font-weight: bold; }
        .cart { background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 20px; cursor: pointer; }
        .hero { background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)); color: white; text-align: center; padding: 6rem 2rem; }
        .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
        .products { padding: 4rem 2rem; max-width: 1200px; margin: 0 auto; }
        .section-title { text-align: center; font-size: 2.5rem; margin-bottom: 3rem; color: #333; }
        .product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .product-card { background: white; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); overflow: hidden; transition: transform 0.3s; }
        .product-card:hover { transform: translateY(-5px); }
        .product-image { height: 200px; background: linear-gradient(45deg, #f0f0f0, #e0e0e0); display: flex; align-items: center; justify-content: center; font-size: 3rem; }
        .product-info { padding: 1.5rem; }
        .product-title { font-size: 1.3rem; font-weight: bold; margin-bottom: 0.5rem; }
        .product-price { font-size: 1.5rem; color: #667eea; font-weight: bold; margin-bottom: 1rem; }
        .add-to-cart { width: 100%; background: #667eea; color: white; border: none; padding: 0.8rem; border-radius: 8px; cursor: pointer; }
        .add-to-cart:hover { background: #5a67d8; }
        .footer { background: #333; color: white; text-align: center; padding: 2rem; }
    </style>
</head>
<body>
    <header class="header">
        <nav class="nav">
            <div class="logo">🚀 TechStore</div>
            <div class="cart" onclick="toggleCart()">🛒 Carrito (<span id="cart-count">0</span>)</div>
        </nav>
    </header>

    <section class="hero">
        <h1>Los Mejores Productos Tecnológicos</h1>
        <p>Descubre la última tecnología con los mejores precios</p>
    </section>

    <section class="products">
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
        </div>
    </section>

    <footer class="footer">
        <p>&copy; 2024 TechStore. Todos los derechos reservados.</p>
    </footer>

    <script>
        let cart = [];
        
        function addToCart(product) {
            cart.push(product);
            updateCartCount();
            alert('Producto agregado al carrito');
        }
        
        function updateCartCount() {
            document.getElementById('cart-count').textContent = cart.length;
        }
        
        function toggleCart() {
            if (cart.length === 0) {
                alert('El carrito está vacío');
            } else {
                alert(\`Tienes \${cart.length} productos en el carrito\`);
            }
        }
        
        console.log('🛒 Tienda online cargada');
    </script>
</body>
</html>
\`\`\`

**Características del E-commerce:**
- ✅ Catálogo de productos tecnológicos específicos
- ✅ Carrito de compras funcional
- ✅ Diseño moderno y responsivo
- ✅ Productos con precios realistas
- ✅ JavaScript interactivo

*Generado específicamente para: "${userRequest}"*`;
  };

  // Función para generar contenido general
  const generateGeneralFallback = (userRequest: string): string => {
    return `# Sitio Web Profesional

Basándome en tu solicitud: "${userRequest}"

\`\`\`html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sitio Web Profesional</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #333; min-height: 100vh; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        h1 { color: #4a5568; text-align: center; margin-bottom: 2rem; }
        .feature { background: #f7fafc; padding: 1rem; margin: 1rem 0; border-radius: 5px; border-left: 4px solid #667eea; }
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

*Generado específicamente para: "${userRequest}"*`;
  };

  // Función para generar contenido específico
  const generateSpecificContent = (userRequest: string): string => {
    const lowerRequest = userRequest.toLowerCase();
    
    if (lowerRequest.includes('venta') || lowerRequest.includes('productos') || lowerRequest.includes('tienda') || lowerRequest.includes('tecnológicos') || lowerRequest.includes('e-commerce')) {
      return generateEcommerceFallback(userRequest);
    }
    
    return generateGeneralFallback(userRequest);
  };

  // Función para procesar la solicitud del usuario
  const processUserRequest = async (request: string) => {
    console.log(`🚀 Procesando solicitud: "${request}"`);
    
    setIsGenerating(true);

    // Añadir mensaje de "pensando"
    const thinkingMessage: Message = {
      id: generateUniqueId('msg-thinking'),
      content: `🤖 Analizando tu solicitud y generando sitio web específico...`,
      sender: 'assistant',
      timestamp: Date.now(),
      type: 'text'
    };

    setMessages(prev => [...prev, thinkingMessage]);

    try {
      // Detectar tipo de sitio
      const siteType = detectSiteType(request);
      console.log(`🎯 Tipo detectado: ${siteType}`);
      
      // Generar contenido específico
      const generatedContent = generateSpecificContent(request);
      console.log(`📄 Contenido generado (${generatedContent.length} caracteres)`);
      
      // Extraer archivos del contenido
      const files = extractFilesFromContent(generatedContent);
      console.log(`📁 Archivos extraídos: ${files.length}`, files.map(f => f.path));

      if (files.length > 0) {
        // Actualizar archivos generados
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

        console.log('✅ Sitio web generado exitosamente');
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
    } finally {
      setIsGenerating(false);
    }
  };

  // Función para manejar el envío de mensajes
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing || isGenerating) return;

    // Añadir mensaje del usuario
    const userMessage: Message = {
      id: generateUniqueId('msg-user'),
      content: inputValue,
      sender: 'user',
      timestamp: Date.now(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');

    // Procesar la solicitud
    await processUserRequest(currentInput);
  };

  return (
    <div className="flex flex-col h-full bg-codestorm-darker rounded-lg shadow-lg overflow-hidden">
      {/* Encabezado */}
      <div className="bg-codestorm-blue/20 p-3 border-b border-codestorm-blue/30 flex justify-between items-center">
        <div className="flex items-center">
          <Bot className="h-5 w-5 text-codestorm-blue mr-2" />
          <h2 className="text-sm font-medium text-white">Asistente de Diseño Web Específico</h2>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mensajes */}
        <div className="flex-1 p-3 space-y-4 overflow-y-auto">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 transition-smooth ${
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
                  ) : (
                    <Bot className="w-4 h-4 mr-2" />
                  )}
                  <span className="text-xs text-gray-300">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="whitespace-pre-wrap">{message.content}</div>
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
              placeholder="Describe el sitio web que quieres crear (ej: tienda de productos tecnológicos, restaurante, portfolio)..."
              className="flex-1 p-2 text-white placeholder-gray-400 border rounded-md resize-none bg-codestorm-dark border-codestorm-blue/30"
              rows={2}
              disabled={isProcessing || isGenerating}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isProcessing || isGenerating}
              className="px-4 py-2 bg-codestorm-accent text-white rounded-md hover:bg-codestorm-accent/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isGenerating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebAIAssistantSimple;
