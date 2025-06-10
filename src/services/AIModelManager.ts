import { callGeminiAPI } from './AIService';
import ClaudeAPIService from './ClaudeAPIService';

export interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: 'google' | 'anthropic' | 'openai';
  version: string;
  strengths: string[];
  icon: string;
  status: 'available' | 'unavailable' | 'limited';
  maxTokens: number;
  costPerToken?: number;
  speed: 'fast' | 'medium' | 'slow';
  quality: 'high' | 'medium' | 'low';
}

export interface ModelResponse {
  success: boolean;
  content?: string;
  model: string;
  tokensUsed?: number;
  responseTime?: number;
  error?: string;
}

export interface ModelConfig {
  temperature: number;
  maxOutputTokens: number;
  topK?: number;
  topP?: number;
}

class AIModelManager {
  private static instance: AIModelManager;
  private selectedModel: string = 'gemini-2-flash';
  private modelConfigs: Map<string, ModelConfig> = new Map();
  private modelStatus: Map<string, 'available' | 'unavailable' | 'limited'> = new Map();
  private claudeService: ClaudeAPIService;

  private constructor() {
    console.log('🚀 Inicializando AIModelManager...');
    this.claudeService = new ClaudeAPIService();
    this.initializeModels();
    this.loadUserPreferences();
    console.log('✅ AIModelManager inicializado correctamente');
  }

  public static getInstance(): AIModelManager {
    if (!AIModelManager.instance) {
      AIModelManager.instance = new AIModelManager();
    }
    return AIModelManager.instance;
  }

  private initializeModels(): void {
    // Configuraciones optimizadas para generación de páginas web
    this.modelConfigs.set('gemini-2-flash', {
      temperature: 0.7,
      maxOutputTokens: 8192,
      topK: 40,
      topP: 0.95
    });

    this.modelConfigs.set('claude-3.5-sonnet', {
      temperature: 0.6,
      maxOutputTokens: 4096,
      topK: 40,
      topP: 0.9
    });

    this.modelConfigs.set('gemini-1.5-pro', {
      temperature: 0.8,
      maxOutputTokens: 8192,
      topK: 35,
      topP: 0.9
    });

    // Inicializar estados como disponibles
    this.modelStatus.set('gemini-2-flash', 'available');
    this.modelStatus.set('claude-3.5-sonnet', 'available');
    this.modelStatus.set('gemini-1.5-pro', 'available');
  }

  public getAvailableModels(): AIModel[] {
    return [
      {
        id: 'gemini-2-flash',
        name: 'Gemini 2.0 Flash',
        description: 'Modelo más reciente de Google, optimizado para velocidad y calidad',
        provider: 'google',
        version: '2.0',
        strengths: ['Velocidad extrema', 'Multimodal', 'Generación web', 'Creatividad'],
        icon: 'Zap',
        status: this.modelStatus.get('gemini-2-flash') || 'available',
        maxTokens: 8192,
        speed: 'fast',
        quality: 'high'
      },
      {
        id: 'claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        description: 'Modelo avanzado de Anthropic con excelente razonamiento',
        provider: 'anthropic',
        version: '3.5',
        strengths: ['Razonamiento', 'Análisis', 'Seguridad', 'Contexto extenso'],
        icon: 'Bot',
        status: this.modelStatus.get('claude-3.5-sonnet') || 'available',
        maxTokens: 4096,
        speed: 'medium',
        quality: 'high'
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Modelo estable de Google con capacidades multimodales',
        provider: 'google',
        version: '1.5',
        strengths: ['Estabilidad', 'Multimodal', 'Razonamiento', 'Creatividad'],
        icon: 'Brain',
        status: this.modelStatus.get('gemini-1.5-pro') || 'available',
        maxTokens: 8192,
        speed: 'medium',
        quality: 'high'
      }
    ];
  }

  public getSelectedModel(): string {
    return this.selectedModel;
  }

  public setSelectedModel(modelId: string): void {
    const models = this.getAvailableModels();
    const model = models.find(m => m.id === modelId);
    
    if (model && model.status === 'available') {
      this.selectedModel = modelId;
      this.saveUserPreferences();
      console.log(`🤖 Modelo cambiado a: ${model.name}`);
    } else {
      throw new Error(`Modelo ${modelId} no disponible`);
    }
  }

  public async generateContent(prompt: string, options?: Partial<ModelConfig>): Promise<ModelResponse> {
    const startTime = Date.now();
    const model = this.getAvailableModels().find(m => m.id === this.selectedModel);
    
    if (!model) {
      throw new Error(`Modelo ${this.selectedModel} no encontrado`);
    }

    const config = { ...this.modelConfigs.get(this.selectedModel)!, ...options };

    try {
      let content: string;
      
      switch (this.selectedModel) {
        case 'gemini-2-flash':
          content = await this.callGemini2Flash(prompt, config);
          break;
        case 'claude-3.5-sonnet':
          content = await this.callClaude35Sonnet(prompt, config);
          break;
        case 'gemini-1.5-pro':
          content = await this.callGemini15Pro(prompt, config);
          break;
        default:
          throw new Error(`Modelo ${this.selectedModel} no implementado`);
      }

      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        content,
        model: this.selectedModel,
        responseTime,
        tokensUsed: this.estimateTokens(content)
      };

    } catch (error) {
      console.error(`Error con modelo ${this.selectedModel}:`, error);
      
      // Intentar fallback automático
      const fallbackResponse = await this.tryFallback(prompt, config, error as Error);
      if (fallbackResponse) {
        return fallbackResponse;
      }

      // Marcar modelo como no disponible temporalmente
      this.modelStatus.set(this.selectedModel, 'unavailable');
      
      return {
        success: false,
        model: this.selectedModel,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  private async callGemini2Flash(prompt: string, config: ModelConfig): Promise<string> {
    // Por ahora usar Gemini 1.5 Pro como implementación de Gemini 2.0 Flash
    // hasta que esté disponible oficialmente
    return await callGeminiAPI(prompt, {
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      topK: config.topK,
      topP: config.topP
    });
  }

  private async callClaude35Sonnet(prompt: string, config: ModelConfig): Promise<string> {
    try {
      const response = await this.claudeService.generateText(prompt, {
        temperature: config.temperature,
        maxTokens: config.maxOutputTokens
      });
      return response.content;
    } catch (error) {
      console.error('Error calling Claude 3.5 Sonnet:', error);
      // Fallback a contenido generado localmente
      return this.generateLocalFallback(prompt);
    }
  }

  private generateLocalFallback(prompt: string): string {
    // Analizar el prompt para detectar el tipo de sitio
    const lowerPrompt = prompt.toLowerCase();

    // Detectar tipo de sitio web solicitado
    let siteType = 'general';
    if (lowerPrompt.includes('venta') || lowerPrompt.includes('productos') || lowerPrompt.includes('tienda') || lowerPrompt.includes('tecnológicos') || lowerPrompt.includes('e-commerce')) {
      siteType = 'ecommerce';
    } else if (lowerPrompt.includes('restaurante') || lowerPrompt.includes('comida') || lowerPrompt.includes('menu')) {
      siteType = 'restaurant';
    } else if (lowerPrompt.includes('portfolio') || lowerPrompt.includes('portafolio')) {
      siteType = 'portfolio';
    }

    // Generar contenido específico según el tipo
    switch (siteType) {
      case 'ecommerce':
        return this.generateEcommerceFallback(prompt);
      case 'restaurant':
        return this.generateRestaurantFallback(prompt);
      case 'portfolio':
        return this.generatePortfolioFallback(prompt);
      default:
        return this.generateGeneralFallback(prompt);
    }
  }

  private generateEcommerceFallback(prompt: string): string {
    return `# Tienda Online de Productos Tecnológicos - Generado Localmente

Basándome en tu solicitud: "${prompt.substring(0, 100)}..."

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
        <p>&copy; 2024 TechStore. Todos los derechos reservados. | Generado con sistema de fallback local</p>
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

        console.log('🛒 Tienda online de productos tecnológicos cargada - Sistema de fallback local');
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

*Nota: Este es contenido de fallback específico para e-commerce generado localmente.*`;
  }

  private generateRestaurantFallback(prompt: string): string {
    return `# Sitio Web de Restaurante - Generado Localmente

Basándome en tu solicitud: "${prompt.substring(0, 100)}..."

\`\`\`html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restaurante Gourmet - Experiencia Culinaria Única</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Georgia', serif;
            line-height: 1.6;
            color: #333;
        }

        .header {
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 1rem 0;
            position: fixed;
            width: 100%;
            top: 0;
            z-index: 1000;
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
            color: #d4af37;
        }

        .hero {
            height: 100vh;
            background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><rect fill="%23d4af37" width="1200" height="800"/></svg>');
            background-size: cover;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: white;
        }

        .hero-content h1 {
            font-size: 4rem;
            margin-bottom: 1rem;
            color: #d4af37;
        }

        .menu-section {
            padding: 4rem 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }

        .menu-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }

        .menu-item {
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            overflow: hidden;
            transition: transform 0.3s;
        }

        .menu-item:hover {
            transform: translateY(-5px);
        }

        .reservation {
            background: #d4af37;
            color: white;
            padding: 4rem 2rem;
            text-align: center;
        }

        .reservation-form {
            max-width: 500px;
            margin: 2rem auto;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .form-group input, .form-group select {
            width: 100%;
            padding: 0.8rem;
            border: none;
            border-radius: 5px;
        }

        .btn {
            background: #333;
            color: white;
            padding: 1rem 2rem;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
        }

        .btn:hover {
            background: #555;
        }
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
        <p>&copy; 2024 Restaurante Gourmet. Todos los derechos reservados. | Generado con sistema de fallback local</p>
    </footer>

    <script>
        document.querySelector('.reservation-form').addEventListener('submit', function(e) {
            e.preventDefault();
            alert('¡Reserva enviada! Te contactaremos pronto para confirmar.');
        });

        console.log('🍽️ Sitio web de restaurante cargado - Sistema de fallback local');
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

*Nota: Este es contenido de fallback específico para restaurante generado localmente.*`;
  }

  private generatePortfolioFallback(prompt: string): string {
    return `# Portfolio Profesional - Generado Localmente

Basándome en tu solicitud: "${prompt.substring(0, 100)}..."

\`\`\`html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portfolio Profesional - Desarrollador Creativo</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
        }

        .header {
            background: #2c3e50;
            color: white;
            padding: 1rem 0;
            position: fixed;
            width: 100%;
            top: 0;
            z-index: 1000;
        }

        .hero {
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: white;
        }

        .projects {
            padding: 4rem 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }

        .project-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }

        .project-card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            overflow: hidden;
            transition: transform 0.3s;
        }

        .project-card:hover {
            transform: translateY(-5px);
        }
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
        <p>&copy; 2024 Portfolio Profesional. Todos los derechos reservados. | Generado con sistema de fallback local</p>
    </footer>

    <script>
        console.log('💼 Portfolio profesional cargado - Sistema de fallback local');
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

*Nota: Este es contenido de fallback específico para portfolio generado localmente.*`;
  }

  private generateGeneralFallback(prompt: string): string {
    return `# Sitio Web Profesional - Generado Localmente

Basándome en tu solicitud: "${prompt.substring(0, 100)}..."

Este es contenido generado localmente cuando los servicios de IA no están disponibles.

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
        <p>Este contenido fue generado usando el sistema de fallback local cuando los servicios de IA no están disponibles.</p>

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
        console.log('Sitio generado con sistema de fallback local');
    </script>
</body>
</html>
\`\`\`

**Características:**
- ✅ HTML5 válido
- ✅ CSS responsivo
- ✅ JavaScript básico
- ✅ Diseño limpio

*Nota: Este es contenido de fallback general generado localmente.*`;
  }

  private async callGemini15Pro(prompt: string, config: ModelConfig): Promise<string> {
    return await callGeminiAPI(prompt, {
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      topK: config.topK,
      topP: config.topP
    });
  }

  private async tryFallback(prompt: string, config: ModelConfig, originalError: Error): Promise<ModelResponse | null> {
    const availableModels = this.getAvailableModels().filter(m => 
      m.id !== this.selectedModel && m.status === 'available'
    );

    for (const model of availableModels) {
      try {
        console.log(`🔄 Intentando fallback con ${model.name}...`);
        
        const originalModel = this.selectedModel;
        this.selectedModel = model.id;
        
        const result = await this.generateContent(prompt, config);
        
        // Restaurar modelo original pero marcar el resultado como fallback
        this.selectedModel = originalModel;
        
        return {
          ...result,
          model: `${originalModel} → ${model.id} (fallback)`
        };
        
      } catch (fallbackError) {
        console.error(`Fallback con ${model.name} también falló:`, fallbackError);
        this.modelStatus.set(model.id, 'unavailable');
      }
    }

    return null;
  }

  private estimateTokens(text: string): number {
    // Estimación aproximada: ~4 caracteres por token
    return Math.ceil(text.length / 4);
  }

  public updateModelStatus(modelId: string, status: 'available' | 'unavailable' | 'limited'): void {
    this.modelStatus.set(modelId, status);
  }

  public getModelStatus(modelId: string): 'available' | 'unavailable' | 'limited' {
    return this.modelStatus.get(modelId) || 'unavailable';
  }

  private saveUserPreferences(): void {
    localStorage.setItem('webai_selected_model', this.selectedModel);
  }

  private loadUserPreferences(): void {
    const saved = localStorage.getItem('webai_selected_model');
    if (saved && this.getAvailableModels().some(m => m.id === saved)) {
      this.selectedModel = saved;
    }
  }

  public resetModelStatuses(): void {
    this.modelStatus.clear();
    this.initializeModels();
  }
}

export default AIModelManager;
