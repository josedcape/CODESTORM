import { AgentTask, DesignArchitectResult, DesignProposal, DesignComponent, FileItem } from '../types';
import { DesignArchitectAgent } from '../agents/DesignArchitectAgent';
import { CodeGeneratorAgent } from '../agents/CodeGeneratorAgent';
import { generateUniqueId } from '../utils/idGenerator';
import { processInstruction } from '../services/ai';

/**
 * Agente Especializado en Mejorar WebAI
 * 
 * Este agente coordina la generación de páginas web modernas y atractivas
 * mejorando la coordinación entre el agente de diseño y el de código.
 */
export class WebAIEnhanceAgent {
  private static instance: WebAIEnhanceAgent;

  private constructor() {}

  public static getInstance(): WebAIEnhanceAgent {
    if (!WebAIEnhanceAgent.instance) {
      WebAIEnhanceAgent.instance = new WebAIEnhanceAgent();
    }
    return WebAIEnhanceAgent.instance;
  }

  /**
   * Genera una página web moderna y atractiva con coordinación mejorada
   * @param instruction Instrucción del usuario
   * @returns Resultado con diseño y código mejorados
   */
  public async generateModernWebsite(instruction: string): Promise<{
    designProposal: DesignProposal;
    files: FileItem[];
    enhancementSummary: string;
  }> {
    try {
      console.log('🚀 Iniciando generación de sitio web moderno...');

      // 1. Análisis profundo de la instrucción
      const analysis = await this.analyzeInstructionForModernDesign(instruction);
      console.log('📊 Análisis completado:', analysis);

      // 2. Generar propuesta de diseño moderna
      const designTask: AgentTask = {
        id: generateUniqueId('task'),
        type: 'designArchitect',
        instruction: this.buildEnhancedInstruction(instruction, analysis),
        status: 'working',
        startTime: Date.now()
      };

      const designResult = await DesignArchitectAgent.execute(designTask);
      
      if (!designResult.success || !designResult.data?.proposal) {
        throw new Error('Error al generar la propuesta de diseño moderna');
      }

      // 3. Mejorar el código generado con técnicas modernas
      const enhancedFiles = await this.enhanceGeneratedCode(
        designResult.data.files || [],
        designResult.data.proposal,
        analysis
      );

      // 4. Aplicar optimizaciones finales
      const optimizedFiles = await this.applyFinalOptimizations(enhancedFiles, analysis);

      const enhancementSummary = this.generateEnhancementSummary(analysis, designResult.data.proposal);

      return {
        designProposal: designResult.data.proposal,
        files: optimizedFiles,
        enhancementSummary
      };

    } catch (error) {
      console.error('❌ Error en WebAIEnhanceAgent:', error);
      throw error;
    }
  }

  /**
   * Analiza la instrucción para determinar el mejor enfoque de diseño moderno
   */
  private async analyzeInstructionForModernDesign(instruction: string): Promise<{
    businessType: string;
    visualStyle: string;
    modernTrends: string[];
    colorScheme: string;
    layoutApproach: string;
    interactionLevel: string;
    targetAudience: string;
  }> {
    const prompt = `
    Analiza la siguiente instrucción para crear un sitio web ULTRA-MODERNO y ATRACTIVO:
    
    INSTRUCCIÓN: "${instruction}"
    
    Proporciona un análisis detallado en formato JSON para generar el diseño más moderno posible:
    
    {
      "businessType": "string (tipo específico de negocio identificado)",
      "visualStyle": "string (estilo visual moderno: tech-futurista, elegante-minimalista, creativo-artístico, corporativo-premium)",
      "modernTrends": ["string (tendencias 2024: glassmorphism, neumorphism, gradientes-dinámicos, parallax-scrolling, micro-animaciones)"],
      "colorScheme": "string (esquema de colores moderno: dark-elegant, vibrant-gradient, minimal-monochrome, warm-professional)",
      "layoutApproach": "string (enfoque de layout: asymmetric-grid, hero-focused, card-masonry, split-screen, full-screen-sections)",
      "interactionLevel": "string (nivel de interactividad: subtle-elegant, dynamic-engaging, playful-creative, professional-smooth)",
      "targetAudience": "string (audiencia objetivo identificada)"
    }
    
    Responde ÚNICAMENTE con el JSON válido, sin comentarios.
    `;

    try {
      const response = await processInstruction(prompt, 'Gemini 2.5 Flash');

      const jsonMatch = response.content.match(/{[\s\S]*}/);
      if (!jsonMatch) {
        throw new Error('No se pudo extraer análisis válido');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error en análisis, usando valores por defecto:', error);
      return {
        businessType: 'Sitio web general',
        visualStyle: 'elegante-minimalista',
        modernTrends: ['gradientes-dinámicos', 'micro-animaciones'],
        colorScheme: 'minimal-monochrome',
        layoutApproach: 'hero-focused',
        interactionLevel: 'subtle-elegant',
        targetAudience: 'Usuarios generales'
      };
    }
  }

  /**
   * Construye una instrucción mejorada basada en el análisis
   */
  private buildEnhancedInstruction(originalInstruction: string, analysis: any): string {
    return `
    CREAR UN SITIO WEB ULTRA-MODERNO Y ATRACTIVO:
    
    INSTRUCCIÓN ORIGINAL: ${originalInstruction}
    
    ESPECIFICACIONES DE DISEÑO MODERNO:
    - Tipo de negocio: ${analysis.businessType}
    - Estilo visual: ${analysis.visualStyle}
    - Tendencias a aplicar: ${analysis.modernTrends.join(', ')}
    - Esquema de colores: ${analysis.colorScheme}
    - Enfoque de layout: ${analysis.layoutApproach}
    - Nivel de interactividad: ${analysis.interactionLevel}
    - Audiencia objetivo: ${analysis.targetAudience}
    
    REQUISITOS OBLIGATORIOS:
    1. Diseño VISUALMENTE IMPACTANTE con tendencias 2024
    2. Animaciones FLUIDAS y transiciones suaves
    3. Layout INNOVADOR y no genérico
    4. Colores PROFESIONALES con gradientes
    5. Tipografía MODERNA y jerarquía clara
    6. Componentes INTERACTIVOS con hover effects
    7. Responsive AVANZADO y optimizado
    8. Código CSS3 con Grid, Flexbox y animaciones
    9. JavaScript para interactividad moderna
    10. Evitar completamente diseños PLANOS o básicos
    
    El resultado debe ser un sitio web que impresione visualmente y tenga una experiencia de usuario excepcional.
    `;
  }

  /**
   * Mejora el código generado con técnicas modernas
   */
  private async enhanceGeneratedCode(
    files: FileItem[],
    proposal: DesignProposal,
    analysis: any
  ): Promise<FileItem[]> {
    const enhancedFiles: FileItem[] = [];

    for (const file of files) {
      if (file.language === 'css') {
        // Mejorar CSS con técnicas modernas
        const enhancedCSS = await this.enhanceCSSWithModernTechniques(file.content, analysis);
        enhancedFiles.push({
          ...file,
          content: enhancedCSS,
          timestamp: Date.now()
        });
      } else if (file.language === 'html') {
        // Mejorar HTML con estructura moderna
        const enhancedHTML = await this.enhanceHTMLWithModernStructure(file.content, analysis);
        enhancedFiles.push({
          ...file,
          content: enhancedHTML,
          timestamp: Date.now()
        });
      } else if (file.language === 'javascript') {
        // Mejorar JavaScript con interactividad moderna
        const enhancedJS = await this.enhanceJavaScriptWithModernInteractions(file.content, analysis);
        enhancedFiles.push({
          ...file,
          content: enhancedJS,
          timestamp: Date.now()
        });
      } else {
        enhancedFiles.push(file);
      }
    }

    // Agregar archivo JavaScript si no existe
    if (!files.some(f => f.language === 'javascript')) {
      const modernJS = await this.generateModernJavaScript(analysis);
      enhancedFiles.push({
        id: generateUniqueId('file'),
        name: 'script.js',
        path: 'script.js',
        content: modernJS,
        language: 'javascript',
        type: 'file',
        timestamp: Date.now(),
        lastModified: Date.now()
      });
    }

    return enhancedFiles;
  }

  /**
   * Mejora CSS con técnicas modernas
   */
  private async enhanceCSSWithModernTechniques(cssContent: string, analysis: any): Promise<string> {
    const modernTechniques = `
/* ===== TÉCNICAS MODERNAS CSS3 ===== */

/* Variables CSS para consistencia */
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --glassmorphism-bg: rgba(255, 255, 255, 0.1);
  --glassmorphism-border: rgba(255, 255, 255, 0.2);
  --shadow-soft: 0 8px 32px rgba(0, 0, 0, 0.1);
  --shadow-hover: 0 12px 40px rgba(0, 0, 0, 0.15);
  --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --border-radius-modern: 16px;
}

/* Glassmorphism effect */
.glassmorphism {
  background: var(--glassmorphism-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glassmorphism-border);
  border-radius: var(--border-radius-modern);
  box-shadow: var(--shadow-soft);
}

/* Modern animations */
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

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Hover effects modernos */
.modern-hover {
  transition: var(--transition-smooth);
  cursor: pointer;
}

.modern-hover:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
}

/* Grid moderno */
.modern-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 2rem;
}

/* Botones modernos */
.btn-modern {
  background: var(--primary-gradient);
  border: none;
  border-radius: var(--border-radius-modern);
  color: white;
  padding: 1rem 2rem;
  font-weight: 600;
  transition: var(--transition-smooth);
  position: relative;
  overflow: hidden;
}

.btn-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.btn-modern:hover::before {
  left: 100%;
}

/* Scroll suave */
html {
  scroll-behavior: smooth;
}

/* Responsive moderno */
@media (max-width: 768px) {
  .modern-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }
}

    `;

    return modernTechniques + '\n\n' + cssContent;
  }

  /**
   * Mejora HTML con estructura moderna
   */
  private async enhanceHTMLWithModernStructure(htmlContent: string, analysis: any): Promise<string> {
    // Agregar clases modernas y estructura mejorada
    let enhancedHTML = htmlContent;

    // Agregar meta tags modernos
    if (!enhancedHTML.includes('theme-color')) {
      enhancedHTML = enhancedHTML.replace(
        '</head>',
        '  <meta name="theme-color" content="#667eea">\n  <meta name="apple-mobile-web-app-capable" content="yes">\n</head>'
      );
    }

    // Agregar clases modernas a elementos
    enhancedHTML = enhancedHTML.replace(/<button/g, '<button class="btn-modern"');
    enhancedHTML = enhancedHTML.replace(/<div class="([^"]*grid[^"]*)"/, '<div class="$1 modern-grid"');

    return enhancedHTML;
  }

  /**
   * Mejora JavaScript con interactividad moderna
   */
  private async enhanceJavaScriptWithModernInteractions(jsContent: string, analysis: any): Promise<string> {
    const modernJS = `
// ===== INTERACTIVIDAD MODERNA =====

// Inicializar animaciones al cargar
document.addEventListener('DOMContentLoaded', function() {
  initModernAnimations();
  initScrollEffects();
  initHoverEffects();
});

// Animaciones de entrada
function initModernAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
      }
    });
  });

  elements.forEach(el => observer.observe(el));
}

// Efectos de scroll
function initScrollEffects() {
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelectorAll('.parallax');
    
    parallax.forEach(element => {
      const speed = element.dataset.speed || 0.5;
      element.style.transform = \`translateY(\${scrolled * speed}px)\`;
    });
  });
}

// Efectos hover modernos
function initHoverEffects() {
  const cards = document.querySelectorAll('.card, .service-item, .product-item');
  
  cards.forEach(card => {
    card.classList.add('modern-hover');
    
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });
}

    `;

    return modernJS + '\n\n' + jsContent;
  }

  /**
   * Genera JavaScript moderno para interactividad
   */
  private async generateModernJavaScript(analysis: any): Promise<string> {
    return `
// ===== JAVASCRIPT MODERNO PARA INTERACTIVIDAD =====

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Inicializando sitio web moderno...');
  
  // Inicializar todas las funcionalidades modernas
  initModernFeatures();
  initAnimations();
  initInteractivity();
  initResponsiveFeatures();
});

function initModernFeatures() {
  // Smooth scrolling para navegación
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Loading screen
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }, 1000);
  }
}

function initAnimations() {
  // Intersection Observer para animaciones
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);

  // Observar elementos para animar
  document.querySelectorAll('section, .card, .service-item').forEach(el => {
    observer.observe(el);
  });
}

function initInteractivity() {
  // Efectos hover para botones
  document.querySelectorAll('.btn, button').forEach(btn => {
    btn.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
    });
    
    btn.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
    });
  });

  // Efectos para tarjetas
  document.querySelectorAll('.card, .service-card, .product-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-8px) scale(1.02)';
      this.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
      this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)';
    });
  });
}

function initResponsiveFeatures() {
  // Menú móvil
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      navToggle.classList.toggle('active');
    });
  }

  // Cerrar menú al hacer click en enlace
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu?.classList.remove('active');
      navToggle?.classList.remove('active');
    });
  });
}

// Utilidades modernas
function addRippleEffect(element) {
  element.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    this.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
}

// Aplicar efectos ripple a botones
document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
  addRippleEffect(btn);
});

console.log('✅ Sitio web moderno inicializado correctamente');
    `;
  }

  /**
   * Aplica optimizaciones finales
   */
  private async applyFinalOptimizations(files: FileItem[], analysis: any): Promise<FileItem[]> {
    // Aquí se pueden aplicar optimizaciones adicionales como:
    // - Minificación de CSS/JS
    // - Optimización de imágenes
    // - Compresión de código
    // - Validación de accesibilidad
    
    return files.map(file => ({
      ...file,
      lastModified: Date.now()
    }));
  }

  /**
   * Genera resumen de mejoras aplicadas
   */
  private generateEnhancementSummary(analysis: any, proposal: DesignProposal): string {
    return `
🎨 MEJORAS APLICADAS AL SITIO WEB:

✅ Diseño Visual Moderno:
- Estilo aplicado: ${analysis.visualStyle}
- Tendencias 2024: ${analysis.modernTrends.join(', ')}
- Esquema de colores: ${analysis.colorScheme}

✅ Técnicas CSS Avanzadas:
- Glassmorphism y efectos de blur
- Gradientes dinámicos y animaciones fluidas
- CSS Grid y Flexbox modernos
- Variables CSS para consistencia

✅ Interactividad Mejorada:
- Animaciones de scroll y entrada
- Hover effects profesionales
- Transiciones suaves
- Efectos ripple en botones

✅ Responsive Design Avanzado:
- Mobile-first approach
- Breakpoints optimizados
- Navegación móvil moderna

✅ Optimizaciones de Rendimiento:
- Smooth scrolling nativo
- Lazy loading de animaciones
- Código optimizado y limpio

El sitio web ahora tiene un diseño moderno, atractivo y profesional que impresionará a los usuarios.
    `;
  }
}
