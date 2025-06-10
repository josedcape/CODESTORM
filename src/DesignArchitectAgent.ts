import {
  AgentTask,
  AgentResult,
  DesignArchitectResult,
  DesignProposal,
  DesignComponent,
  FileItem
} from '../types';
import { generateUniqueId } from '../utils/idGenerator';
import { callGeminiAPI } from '../services/AIService';
import { ColorPaletteService, ColorPalette, ColorDetectionResult } from '../services/ColorPaletteService';
import { CSSGeneratorService, CSSGenerationOptions } from '../services/CSSGeneratorService';

export class DesignArchitectAgent {
  private static instance: DesignArchitectAgent;

  private constructor() {}

  public static getInstance(): DesignArchitectAgent {
    if (!DesignArchitectAgent.instance) {
      DesignArchitectAgent.instance = new DesignArchitectAgent();
    }
    return DesignArchitectAgent.instance;
  }

  /**
   * Ejecuta una tarea del agente de diseño arquitectónico con detección inteligente de colores
   * @param task Tarea a ejecutar
   * @returns Resultado de la tarea
   */
  public static async execute(task: AgentTask): Promise<DesignArchitectResult> {
    try {
      const agent = DesignArchitectAgent.getInstance();

      // Detectar colores e industria en la instrucción
      const colorDetection = ColorPaletteService.detectColorsInInstruction(task.instruction);
      console.log('🎨 Detección de colores:', colorDetection);

      // Sugerir paleta basada en la detección
      const suggestedPalette = ColorPaletteService.suggestPalette(colorDetection);
      console.log('🎨 Paleta sugerida:', suggestedPalette.name, '-', suggestedPalette.description);

      // Agregar información de color al task
      const enhancedTask = {
        ...task,
        colorDetection,
        suggestedPalette
      };

      switch (task.type) {
        case 'designArchitect':
          if (task.instruction.includes('mockup') || task.instruction.includes('wireframe') || task.instruction.includes('diseño')) {
            return await agent.generateDesignProposal(enhancedTask);
          } else if (task.instruction.includes('HTML') || task.instruction.includes('estilos') || task.instruction.includes('animaciones')) {
            return await agent.enhanceHTMLWithStyles(enhancedTask);
          } else if (task.instruction.toLowerCase().includes('color') || task.instruction.toLowerCase().includes('cambiar')) {
            return await agent.applyColorChanges(enhancedTask);
          } else {
            return await agent.generateUIComponents(enhancedTask);
          }
        default:
          throw new Error(`Tipo de tarea no soportado: ${task.type}`);
      }
    } catch (error) {
      console.error('Error en DesignArchitectAgent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en DesignArchitectAgent'
      };
    }
  }

  /**
   * Aplica cambios de color específicos al sitio web
   * @param task Tarea con instrucciones de cambio de color
   * @returns Resultado con los archivos actualizados
   */
  private async applyColorChanges(task: any): Promise<DesignArchitectResult> {
    try {
      console.log('🎨 Aplicando cambios de color inteligentes...');

      // Obtener la paleta sugerida
      const palette = task.suggestedPalette as ColorPalette;

      // Generar CSS optimizado con la nueva paleta
      const cssOptions: CSSGenerationOptions = {
        includeAnimations: true,
        includeHoverEffects: true,
        includeGradients: true,
        includeShadows: true,
        responsiveBreakpoints: true,
        accessibilityOptimized: true
      };

      const optimizedCSS = CSSGeneratorService.generateCompleteCSS(palette, cssOptions);

      // Generar HTML básico si no existe
      const htmlContent = this.generateBasicHTML(task.instruction, palette);

      // Crear archivos actualizados
      const files: FileItem[] = [
        {
          id: generateUniqueId('file'),
          name: 'index.html',
          path: 'index.html',
          content: htmlContent,
          language: 'html',
          type: 'file',
          size: htmlContent.length,
          timestamp: Date.now(),
          lastModified: Date.now()
        },
        {
          id: generateUniqueId('file'),
          name: 'styles.css',
          path: 'styles.css',
          content: optimizedCSS,
          language: 'css',
          type: 'file',
          size: optimizedCSS.length,
          timestamp: Date.now(),
          lastModified: Date.now()
        }
      ];

      // Crear propuesta básica
      const proposal: DesignProposal = {
        id: generateUniqueId('proposal'),
        title: `Aplicación de Paleta ${palette.name}`,
        description: `Se ha aplicado la paleta de colores "${palette.name}" (${palette.description}) al sitio web con detección inteligente de colores.`,
        style: 'modern',
        colorPalette: {
          primary: palette.primary,
          secondary: palette.secondary,
          accent: palette.accent,
          background: palette.background,
          text: palette.text.primary,
          neutral: palette.neutral.medium
        },
        typography: {
          headingFont: 'Inter, sans-serif',
          bodyFont: 'Inter, sans-serif',
          baseSize: '16px',
          scale: 1.25
        },
        responsive: true,
        accessibility: {
          level: 'AA',
          features: ['Contraste adecuado', 'Etiquetas ARIA', 'Navegación por teclado']
        },
        previewImages: [],
        components: [],
        htmlPreview: htmlContent,
        cssPreview: optimizedCSS
      };

      return {
        success: true,
        data: {
          proposal,
          components: [],
          files,
          colorInfo: {
            detectedColors: task.colorDetection.detectedColors,
            appliedPalette: palette.name,
            category: palette.category
          }
        }
      };

    } catch (error) {
      console.error('Error al aplicar cambios de color:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al aplicar cambios de color'
      };
    }
  }

  /**
   * Genera una propuesta de diseño basada en la instrucción con detección inteligente de colores
   * @param task Tarea con la instrucción para generar la propuesta
   * @returns Resultado con la propuesta de diseño
   */
  private async generateDesignProposal(task: any): Promise<DesignArchitectResult> {
    try {
      // Construir prompt con información de colores detectados
      const prompt = this.buildEnhancedDesignProposalPrompt(task.instruction, task.plan, task.colorDetection, task.suggestedPalette);

      const response = await callGeminiAPI(prompt, {
        temperature: 0.7,
        maxOutputTokens: 8192,
        topK: 40,
        topP: 0.95,
      });

      if (!response || !response.trim()) {
        throw new Error('No se recibió respuesta de la API de Gemini');
      }

      // Extraer la propuesta de diseño del JSON en la respuesta
      const designProposal = this.extractDesignProposalFromResponse(response);

      // Aplicar paleta de colores detectada a la propuesta
      if (task.suggestedPalette) {
        designProposal.colorPalette = {
          primary: task.suggestedPalette.primary,
          secondary: task.suggestedPalette.secondary,
          accent: task.suggestedPalette.accent,
          background: task.suggestedPalette.background,
          text: task.suggestedPalette.text.primary,
          neutral: task.suggestedPalette.neutral.medium
        };
      }

      // Generar componentes basados en la propuesta
      const components = this.generateComponentsFromProposal(designProposal);

      // Generar archivos HTML/CSS/JS optimizados con la paleta de colores
      const files = await this.generateOptimizedFilesFromComponents(components, designProposal, task.suggestedPalette);

      return {
        success: true,
        data: {
          proposal: designProposal,
          components,
          files,
          colorInfo: {
            detectedColors: task.colorDetection?.detectedColors || [],
            appliedPalette: task.suggestedPalette?.name || 'Default',
            category: task.suggestedPalette?.category || 'tecnologia'
          }
        }
      };
    } catch (error) {
      console.error('Error al generar propuesta de diseño:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al generar propuesta de diseño'
      };
    }
  }

  /**
   * Genera HTML básico con paleta de colores aplicada
   * @param instruction Instrucción del usuario
   * @param palette Paleta de colores
   * @returns HTML básico
   */
  private generateBasicHTML(instruction: string, palette: ColorPalette): string {
    const businessType = instruction.toLowerCase().includes('restaurante') ? 'restaurante' :
                        instruction.toLowerCase().includes('tecnología') || instruction.toLowerCase().includes('software') ? 'tecnología' :
                        instruction.toLowerCase().includes('salud') || instruction.toLowerCase().includes('médico') ? 'salud' :
                        'negocio';

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Sitio web profesional con paleta de colores ${palette.name}">
    <title>Sitio Web - ${palette.name}</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <header role="banner">
        <nav role="navigation" aria-label="Navegación principal" class="container">
            <div class="nav-brand">
                <h1>Mi ${businessType.charAt(0).toUpperCase() + businessType.slice(1)}</h1>
            </div>
            <ul class="nav-links">
                <li><a href="#inicio">Inicio</a></li>
                <li><a href="#acerca">Acerca</a></li>
                <li><a href="#servicios">Servicios</a></li>
                <li><a href="#contacto">Contacto</a></li>
            </ul>
        </nav>
    </header>

    <main role="main">
        <section id="inicio" class="hero" aria-labelledby="hero-title">
            <div class="container">
                <h1 id="hero-title">Bienvenido a Nuestro ${businessType.charAt(0).toUpperCase() + businessType.slice(1)}</h1>
                <p>Descubre la excelencia en cada detalle con nuestra nueva paleta de colores ${palette.name}.</p>
                <a href="#servicios" class="btn btn-primary">Conoce Más</a>
            </div>
        </section>

        <section id="acerca" class="section" aria-labelledby="about-title">
            <div class="container">
                <h2 id="about-title">Acerca de Nosotros</h2>
                <div class="grid grid-2">
                    <div>
                        <p>Somos una empresa comprometida con la excelencia y la innovación. Nuestra nueva identidad visual refleja nuestros valores y profesionalismo.</p>
                        <p>Con la paleta ${palette.name}, transmitimos confianza y modernidad en cada interacción.</p>
                    </div>
                    <div class="card">
                        <h3>Nuestra Misión</h3>
                        <p>Brindar servicios de calidad excepcional con un diseño que refleje profesionalismo y confianza.</p>
                    </div>
                </div>
            </div>
        </section>

        <section id="servicios" class="section bg-neutral-light" aria-labelledby="services-title">
            <div class="container">
                <h2 id="services-title">Nuestros Servicios</h2>
                <div class="grid grid-3">
                    <div class="card">
                        <h3>Servicio Premium</h3>
                        <p>Experiencia de alta calidad con atención personalizada.</p>
                        <a href="#contacto" class="btn btn-secondary">Más Info</a>
                    </div>
                    <div class="card">
                        <h3>Consultoría</h3>
                        <p>Asesoramiento experto para tus necesidades específicas.</p>
                        <a href="#contacto" class="btn btn-secondary">Más Info</a>
                    </div>
                    <div class="card">
                        <h3>Soporte</h3>
                        <p>Acompañamiento continuo para garantizar tu satisfacción.</p>
                        <a href="#contacto" class="btn btn-secondary">Más Info</a>
                    </div>
                </div>
            </div>
        </section>

        <section id="contacto" class="section" aria-labelledby="contact-title">
            <div class="container">
                <h2 id="contact-title">Contáctanos</h2>
                <div class="grid grid-2">
                    <div>
                        <h3>Información de Contacto</h3>
                        <p>Estamos aquí para ayudarte. Contáctanos y descubre cómo podemos trabajar juntos.</p>
                        <div class="contact-info">
                            <p><strong>Email:</strong> info@mi${businessType}.com</p>
                            <p><strong>Teléfono:</strong> +1 (555) 123-4567</p>
                            <p><strong>Dirección:</strong> 123 Calle Principal, Ciudad</p>
                        </div>
                    </div>
                    <form class="contact-form">
                        <div class="form-group">
                            <label for="name" class="form-label">Nombre</label>
                            <input type="text" id="name" name="name" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label for="email" class="form-label">Email</label>
                            <input type="email" id="email" name="email" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label for="message" class="form-label">Mensaje</label>
                            <textarea id="message" name="message" class="form-input" rows="4" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Enviar Mensaje</button>
                    </form>
                </div>
            </div>
        </section>
    </main>

    <footer role="contentinfo">
        <div class="container">
            <p>&copy; 2024 Mi ${businessType.charAt(0).toUpperCase() + businessType.slice(1)}. Todos los derechos reservados.</p>
            <p>Diseñado con la paleta ${palette.name} - ${palette.description}</p>
        </div>
    </footer>

    <script>
        // Navegación suave
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

        // Formulario de contacto
        document.querySelector('.contact-form').addEventListener('submit', function(e) {
            e.preventDefault();
            alert('¡Gracias por tu mensaje! Te contactaremos pronto.');
            this.reset();
        });
    </script>
</body>
</html>`;
  }

  /**
   * Construye un prompt mejorado con información de colores detectados
   * @param instruction Instrucción del usuario
   * @param plan Plan del proyecto
   * @param colorDetection Detección de colores
   * @param suggestedPalette Paleta sugerida
   * @returns Prompt mejorado
   */
  private buildEnhancedDesignProposalPrompt(
    instruction: string,
    plan?: any,
    colorDetection?: ColorDetectionResult,
    suggestedPalette?: ColorPalette
  ): string {
    const basePrompt = this.buildDesignProposalPrompt(instruction, plan);

    if (!colorDetection || !suggestedPalette) {
      return basePrompt;
    }

    const colorInfo = `

    INFORMACIÓN DE COLORES DETECTADOS:
    - Colores mencionados: ${colorDetection.detectedColors.join(', ') || 'Ninguno específico'}
    - Descriptores de color: ${colorDetection.colorDescriptions.join(', ') || 'Ninguno específico'}
    - Categoría sugerida: ${colorDetection.suggestedCategory}
    - Confianza de detección: ${(colorDetection.confidence * 100).toFixed(0)}%

    PALETA PROFESIONAL SUGERIDA: "${suggestedPalette.name}"
    - Descripción: ${suggestedPalette.description}
    - Categoría: ${suggestedPalette.category}
    - Color primario: ${suggestedPalette.primary}
    - Color secundario: ${suggestedPalette.secondary}
    - Color de acento: ${suggestedPalette.accent}
    - Fondo: ${suggestedPalette.background}
    - Texto principal: ${suggestedPalette.text.primary}

    INSTRUCCIONES ESPECÍFICAS PARA COLORES:
    1. USAR OBLIGATORIAMENTE la paleta "${suggestedPalette.name}" en todo el diseño
    2. Aplicar los colores de manera consistente en todos los elementos
    3. Asegurar contraste adecuado para accesibilidad (WCAG 2.1 AA)
    4. Incluir variaciones de color para estados hover y activos
    5. Usar gradientes sutiles cuando sea apropiado
    6. Aplicar la paleta tanto en el HTML como en el CSS generado
    7. Mencionar específicamente la paleta aplicada en la descripción del proyecto

    IMPORTANTE: El resultado debe reflejar claramente el uso de la paleta "${suggestedPalette.name}" y ser apropiado para la categoría "${suggestedPalette.category}".
    `;

    return basePrompt + colorInfo;
  }

  /**
   * Genera archivos optimizados con paleta de colores aplicada
   * @param components Componentes generados
   * @param proposal Propuesta de diseño
   * @param palette Paleta de colores
   * @returns Archivos optimizados
   */
  private async generateOptimizedFilesFromComponents(
    components: DesignComponent[],
    proposal: DesignProposal,
    palette?: ColorPalette
  ): Promise<FileItem[]> {
    try {
      const files: FileItem[] = [];

      // Generar HTML optimizado
      let htmlContent = proposal.htmlPreview || this.generateHTMLFromComponents(components);

      // Generar CSS optimizado con paleta de colores
      let cssContent = proposal.cssPreview || this.generateCSSFromComponents(components);

      if (palette) {
        // Aplicar CSS optimizado con la paleta profesional
        const cssOptions: CSSGenerationOptions = {
          includeAnimations: true,
          includeHoverEffects: true,
          includeGradients: true,
          includeShadows: true,
          responsiveBreakpoints: true,
          accessibilityOptimized: true
        };

        const optimizedCSS = CSSGeneratorService.generateCompleteCSS(palette, cssOptions);
        cssContent = optimizedCSS + '\n\n/* Estilos específicos del componente */\n' + cssContent;
      }

      // Archivo HTML
      files.push({
        id: generateUniqueId('file'),
        name: 'index.html',
        path: 'index.html',
        content: htmlContent,
        language: 'html',
        type: 'file',
        size: htmlContent.length,
        lastModified: Date.now()
      });

      // Archivo CSS
      files.push({
        id: generateUniqueId('file'),
        name: 'styles.css',
        path: 'styles.css',
        content: cssContent,
        language: 'css',
        type: 'file',
        size: cssContent.length,
        lastModified: Date.now()
      });

      // Archivo JavaScript si existe
      if (proposal.jsPreview) {
        files.push({
          id: generateUniqueId('file'),
          name: 'script.js',
          path: 'script.js',
          content: proposal.jsPreview,
          language: 'javascript',
          type: 'file',
          size: proposal.jsPreview.length,
          lastModified: Date.now()
        });
      }

      return files;
    } catch (error) {
      console.error('Error al generar archivos optimizados:', error);
      // Fallback a método original
      return this.generateFilesFromComponents(components, proposal);
    }
  }

  /**
   * Genera componentes de UI basados en la instrucción con detección de colores
   * @param task Tarea con la instrucción para generar los componentes
   * @returns Resultado con los componentes generados
   */
  private async generateUIComponents(task: any): Promise<DesignArchitectResult> {
    try {
      const prompt = this.buildUIComponentsPrompt(task.instruction, task.plan);

      const response = await callGeminiAPI(prompt, {
        temperature: 0.7,
        maxOutputTokens: 8192,
        topK: 40,
        topP: 0.95,
      });

      if (!response || !response.trim()) {
        throw new Error('No se recibió respuesta de la API de Gemini');
      }

      // Extraer los componentes del JSON en la respuesta
      const components = this.extractComponentsFromResponse(response);

      // Crear una propuesta básica basada en los componentes
      const proposal = this.createProposalFromComponents(components, task.instruction);

      // Generar archivos HTML/CSS/JS basados en los componentes
      const files = await this.generateFilesFromComponents(components, proposal);

      return {
        success: true,
        data: {
          proposal,
          components,
          files
        }
      };
    } catch (error) {
      console.error('Error al generar componentes de UI:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al generar componentes de UI'
      };
    }
  }

  /**
   * Construye el prompt para generar una propuesta de diseño específica para sitios web estáticos
   * @param instruction Instrucción del usuario
   * @param plan Plan del proyecto (opcional)
   * @returns Prompt para la API de Gemini optimizado para web estática
   */
  private buildDesignProposalPrompt(instruction: string, plan?: any): string {
    const projectName = plan?.name || 'Sitio Web Moderno';
    const projectDescription = plan?.description || instruction;

    return `
    Eres un DISEÑADOR WEB SENIOR especializado en crear sitios web ULTRA-MODERNOS, ATRACTIVOS y PROFESIONALES usando HTML5, CSS3 avanzado y JavaScript vanilla. Tu especialidad es generar páginas web que impresionen visualmente y tengan una experiencia de usuario excepcional.

    INSTRUCCIÓN DEL USUARIO: ${instruction}

    NOMBRE DEL PROYECTO: ${projectName}
    DESCRIPCIÓN: ${projectDescription}

    ${plan ? `PLAN DEL PROYECTO: ${JSON.stringify(plan, null, 2)}` : ''}

    🎨 ESTÁNDARES DE DISEÑO MODERNO OBLIGATORIOS:
    Tu tarea es crear un sitio web que sea VISUALMENTE IMPACTANTE con:
    1. DISEÑO ULTRA-MODERNO con tendencias 2024 (glassmorphism, neumorphism, gradientes dinámicos)
    2. ANIMACIONES FLUIDAS y transiciones suaves en CSS3 y JavaScript
    3. LAYOUT AVANZADO con CSS Grid y Flexbox para diseños complejos
    4. TIPOGRAFÍA MODERNA con jerarquía visual clara y fuentes Google Fonts premium
    5. PALETA DE COLORES PROFESIONAL con gradientes y efectos visuales
    6. COMPONENTES INTERACTIVOS con hover effects y micro-animaciones
    7. DISEÑO RESPONSIVE AVANZADO con breakpoints optimizados

    🔍 ANÁLISIS PROFUNDO PARA DISEÑO MODERNO:
    Antes de generar el código, analiza la instrucción para crear un diseño IMPACTANTE:
    1. ¿Qué tipo específico de negocio/producto requiere qué ESTILO VISUAL único?
    2. ¿Qué EMOCIONES debe transmitir el diseño (confianza, innovación, elegancia, etc.)?
    3. ¿Qué TENDENCIAS DE DISEÑO 2024 son apropiadas para esta industria?
    4. ¿Qué ELEMENTOS VISUALES ÚNICOS pueden diferenciarlo de la competencia?
    5. ¿Qué INTERACCIONES y ANIMACIONES mejorarían la experiencia del usuario?
    6. ¿Qué LAYOUT INNOVADOR puede hacer el sitio más atractivo?
    7. ¿Qué EFECTOS VISUALES (parallax, glassmorphism, etc.) son apropiados?
    8. ¿Qué MICRO-ANIMACIONES pueden hacer el sitio más dinámico?

    ✨ REQUISITOS OBLIGATORIOS PARA DISEÑO MODERNO Y ATRACTIVO:
    1. 🎨 DISEÑO VISUAL IMPACTANTE: Usar tendencias 2024 (glassmorphism, gradientes dinámicos, sombras suaves)
    2. 🚀 ANIMACIONES FLUIDAS: Transiciones CSS3, hover effects, loading animations, scroll animations
    3. 📱 RESPONSIVE AVANZADO: Mobile-first con breakpoints inteligentes y layouts adaptativos
    4. 🎯 PERSONALIZACIÓN EXTREMA: Contenido 100% específico, sin placeholders genéricos
    5. 🏗️ LAYOUT MODERNO: CSS Grid avanzado, Flexbox, positioning creativo
    6. 🎭 EFECTOS VISUALES: Parallax, blur effects, gradient overlays, clip-path
    7. 🔤 TIPOGRAFÍA PREMIUM: Google Fonts modernas, jerarquía visual clara, spacing perfecto
    8. 🌈 PALETA PROFESIONAL: Colores coherentes, gradientes sutiles, contraste optimizado
    9. ⚡ INTERACTIVIDAD: Botones animados, formularios elegantes, navegación fluida
    10. 🎪 MICRO-ANIMACIONES: Loading spinners, button states, card hover effects

    Responde ÚNICAMENTE con un objeto JSON con la siguiente estructura para sitios web ULTRA-MODERNOS:

    {
      "analysis": {
        "businessType": "string (tipo específico de negocio/producto/servicio identificado)",
        "visualStyle": "string (estilo visual moderno apropiado: minimalista-elegante, tech-futurista, creativo-artístico, corporativo-premium, etc.)",
        "emotionalTone": "string (tono emocional: confianza, innovación, elegancia, dinamismo, etc.)",
        "modernTrends": ["string (tendencias 2024 aplicables: glassmorphism, neumorphism, gradientes dinámicos, etc.)"],
        "targetAudience": "string (público objetivo identificado)",
        "uniqueElements": ["string (elementos únicos que diferenciarán este sitio)"],
        "interactionLevel": "string (nivel de interactividad: básica, intermedia, avanzada)",
        "visualComplexity": "string (complejidad visual: limpia, moderada, rica)",
        "designInspiration": "string (inspiración de diseño específica para esta industria)"
      },
      "proposal": {
        "id": "string (identificador único)",
        "title": "string (título específico basado en la solicitud del usuario)",
        "description": "string (descripción detallada del sitio web moderno específico)",
        "style": "string (estilo visual moderno específico)",
        "siteType": "modern-static",
        "designSystem": {
          "theme": "string (tema visual: dark-elegant, light-minimal, vibrant-creative, etc.)",
          "visualEffects": ["string (efectos visuales a aplicar: glassmorphism, parallax, gradient-overlays, etc.)"],
          "animationStyle": "string (estilo de animaciones: subtle, dynamic, playful, professional)",
          "layoutApproach": "string (enfoque de layout: grid-masonry, asymmetric, card-based, hero-focused, etc.)"
        },
        "colorPalette": {
          "primary": "string (color primario moderno)",
          "secondary": "string (color secundario complementario)",
          "accent": "string (color de acento vibrante)",
          "background": "string (fondo principal)",
          "surface": "string (color de superficies/tarjetas)",
          "text": "string (texto principal)",
          "textSecondary": "string (texto secundario)",
          "gradient1": "string (gradiente primario CSS)",
          "gradient2": "string (gradiente secundario CSS)",
          "shadow": "string (color de sombras)"
        },
        "typography": {
          "headingFont": "string (fuente moderna para títulos - Google Fonts premium)",
          "bodyFont": "string (fuente legible para texto - Google Fonts)",
          "accentFont": "string (fuente decorativa opcional - Google Fonts)",
          "baseSize": "16px",
          "scale": 1.25,
          "lineHeight": 1.6,
          "fontWeights": {
            "light": 300,
            "regular": 400,
            "medium": 500,
            "semibold": 600,
            "bold": 700
          }
        },
        "spacing": {
          "unit": "8px",
          "sections": "80px",
          "components": "24px",
          "elements": "16px"
        },
        "responsive": true,
        "seo": {
          "title": "string (título SEO específico)",
          "description": "string (meta descripción específica)",
          "keywords": ["string (palabras clave relevantes)"],
          "ogTitle": "string (título para redes sociales)",
          "ogDescription": "string (descripción para redes sociales)"
        },
        "accessibility": {
          "level": "AA",
          "features": ["semantic-html", "alt-text", "keyboard-navigation", "color-contrast", "aria-labels"]
        },
        "components": [
          {
            "id": "string (identificador único)",
            "name": "string (nombre específico del componente)",
            "type": "string (modern-header, hero-dynamic, services-grid, gallery-masonry, contact-elegant, footer-minimal, etc.)",
            "description": "string (descripción específica del componente moderno)",
            "visualFeatures": ["string (características visuales: glassmorphism, hover-animations, gradient-bg, etc.)"],
            "interactionLevel": "string (nivel de interactividad del componente)",
            "htmlTemplate": "string (código HTML5 semántico con clases modernas)",
            "cssStyles": "string (código CSS3 avanzado con animaciones y efectos)",
            "jsCode": "string (código JavaScript para interactividad moderna)"
          }
        ],
        "htmlPreview": "string (código HTML5 COMPLETO, MODERNO Y ATRACTIVO con estructura semántica - OBLIGATORIO)",
        "cssPreview": "string (código CSS3 AVANZADO con Grid, Flexbox, animaciones, gradientes y efectos modernos - OBLIGATORIO)",
        "jsPreview": "string (código JavaScript vanilla para interactividad moderna y animaciones - RECOMENDADO)"
      }
    }

    🎨 EJEMPLOS DE DISEÑO MODERNO Y ATRACTIVO:

    Si el usuario solicita "sitio web para software de contabilidad":
    - ESTILO VISUAL: Tech-futurista con glassmorphism y gradientes azul-púrpura
    - HERO DINÁMICO: Animación de números/gráficos, CTA con hover effect, parallax sutil
    - CARACTERÍSTICAS: Grid de tarjetas con hover animations, iconos animados, progress bars
    - TESTIMONIOS: Carrusel con blur effects, avatares con border gradients
    - PRECIOS: Tarjetas con glassmorphism, botones con ripple effect, badges animados
    - COLORES: Gradientes tech (#667eea → #764ba2), acentos dorados (#f093fb → #f5576c)

    Si el usuario solicita "sitio web para restaurante italiano":
    - ESTILO VISUAL: Elegante-cálido con overlays de gradiente y tipografía premium
    - HERO CINEMATOGRÁFICO: Video background con overlay gradient, texto con fade-in animation
    - MENÚ INTERACTIVO: Grid masonry con hover zoom, filtros animados, modal elegante
    - GALERÍA: Parallax scrolling, lightbox moderno, lazy loading con skeleton
    - RESERVAS: Formulario con glassmorphism, date picker elegante, confirmación animada
    - COLORES: Paleta cálida (#ff6b6b → #feca57), acentos dorados (#ff9ff3 → #f368e0)

    🏗️ ESTRUCTURA HTML5 MODERNA Y ATRACTIVA:
    <!DOCTYPE html>
    <html lang="es" class="scroll-smooth">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="[DESCRIPCIÓN SEO ESPECÍFICA Y ATRACTIVA]">
        <meta name="keywords" content="[PALABRAS CLAVE ESPECÍFICAS]">
        <meta property="og:title" content="[TÍTULO PARA REDES SOCIALES]">
        <meta property="og:description" content="[DESCRIPCIÓN PARA REDES SOCIALES]">
        <meta property="og:type" content="website">
        <meta property="og:image" content="[URL DE IMAGEN PREVIEW]">
        <meta name="theme-color" content="[COLOR PRIMARIO]">
        <title>[TÍTULO SEO ESPECÍFICO Y ATRACTIVO]</title>

        <!-- Preload critical resources -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=[FUENTE_PRINCIPAL]:wght@300;400;500;600;700&family=[FUENTE_SECUNDARIA]:wght@400;500&display=swap" rel="stylesheet">

        <!-- Critical CSS inline for performance -->
        <style>[CRITICAL CSS INLINE PARA ABOVE-THE-FOLD]</style>
        <link rel="stylesheet" href="styles.css">

        <!-- Favicon and app icons -->
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="icon" type="image/png" href="/favicon.png">
    </head>
    <body class="antialiased">
        <!-- Loading screen with animation -->
        <div id="loading-screen" class="loading-screen">
            <div class="loading-animation">[ANIMACIÓN DE CARGA MODERNA]</div>
        </div>

        <!-- Modern header with glassmorphism -->
        <header class="header-modern" role="banner">
            <nav class="nav-container" role="navigation" aria-label="Navegación principal">
                <div class="nav-brand">
                    <a href="#inicio" class="brand-logo">[LOGO/MARCA ESPECÍFICA]</a>
                </div>
                <ul class="nav-menu">
                    <li><a href="#inicio" class="nav-link active">Inicio</a></li>
                    <li><a href="#acerca" class="nav-link">Acerca</a></li>
                    <li><a href="#servicios" class="nav-link">Servicios</a></li>
                    <li><a href="#contacto" class="nav-link">Contacto</a></li>
                </ul>
                <button class="nav-toggle" aria-label="Menú móvil">
                    <span></span><span></span><span></span>
                </button>
            </nav>
        </header>

        <main role="main">
            <!-- Hero section with dynamic background -->
            <section id="inicio" class="hero-modern" aria-labelledby="hero-title">
                <div class="hero-background">
                    <div class="hero-gradient"></div>
                    <div class="hero-shapes">[FORMAS GEOMÉTRICAS ANIMADAS]</div>
                </div>
                <div class="hero-content">
                    <h1 id="hero-title" class="hero-title">[TÍTULO PRINCIPAL IMPACTANTE]</h1>
                    <p class="hero-subtitle">[SUBTÍTULO ESPECÍFICO Y ATRACTIVO]</p>
                    <div class="hero-actions">
                        <button class="btn-primary">[CTA PRINCIPAL]</button>
                        <button class="btn-secondary">[CTA SECUNDARIO]</button>
                    </div>
                </div>
                <div class="hero-scroll-indicator">
                    <div class="scroll-arrow"></div>
                </div>
            </section>

            <!-- About section with modern layout -->
            <section id="acerca" class="section-modern about-section" aria-labelledby="about-title">
                <div class="container">
                    <div class="section-header">
                        <h2 id="about-title" class="section-title">[TÍTULO SOBRE NOSOTROS]</h2>
                        <p class="section-subtitle">[SUBTÍTULO ESPECÍFICO]</p>
                    </div>
                    <div class="about-grid">
                        [CONTENIDO ESPECÍFICO CON LAYOUT MODERNO]
                    </div>
                </div>
            </section>

            <!-- Services with interactive cards -->
            <section id="servicios" class="section-modern services-section" aria-labelledby="services-title">
                <div class="container">
                    <div class="section-header">
                        <h2 id="services-title" class="section-title">[TÍTULO SERVICIOS/PRODUCTOS]</h2>
                        <p class="section-subtitle">[SUBTÍTULO ESPECÍFICO]</p>
                    </div>
                    <div class="services-grid">
                        [TARJETAS DE SERVICIOS CON HOVER EFFECTS]
                    </div>
                </div>
            </section>

            <!-- Contact with modern form -->
            <section id="contacto" class="section-modern contact-section" aria-labelledby="contact-title">
                <div class="container">
                    <div class="section-header">
                        <h2 id="contact-title" class="section-title">[TÍTULO CONTACTO]</h2>
                        <p class="section-subtitle">[SUBTÍTULO ESPECÍFICO]</p>
                    </div>
                    <div class="contact-content">
                        [FORMULARIO MODERNO Y INFORMACIÓN DE CONTACTO]
                    </div>
                </div>
            </section>
        </main>

        <!-- Modern footer -->
        <footer class="footer-modern" role="contentinfo">
            <div class="container">
                [PIE DE PÁGINA MODERNO CON INFORMACIÓN ESPECÍFICA]
            </div>
        </footer>

        <!-- Scripts for modern interactions -->
        <script src="script.js"></script>
        <script>
            // Initialize modern interactions
            document.addEventListener('DOMContentLoaded', function() {
                initModernAnimations();
                initScrollEffects();
                initInteractiveElements();
            });
        </script>
    </body>
    </html>

    IMPORTANTE PARA NAVEGACIÓN SEGURA:
    - Usar IDs únicos y descriptivos para secciones (ej: id="inicio", id="acerca", id="servicios")
    - Enlaces de navegación deben apuntar a IDs válidos (ej: href="#inicio", href="#acerca")
    - NUNCA usar href="#" sin un ID válido
    - Todos los elementos interactivos deben tener IDs únicos y descriptivos

    ✅ VALIDACIÓN FINAL PARA SITIOS WEB MODERNOS Y ATRACTIVOS:
    - ¿El diseño es VISUALMENTE IMPACTANTE y moderno (tendencias 2024)?
    - ¿Se aplicaron efectos visuales modernos (glassmorphism, gradientes, animaciones)?
    - ¿El layout es INNOVADOR y diferente a sitios web básicos?
    - ¿Las animaciones y transiciones son FLUIDAS y profesionales?
    - ¿La tipografía es MODERNA y tiene jerarquía visual clara?
    - ¿Los colores forman una paleta PROFESIONAL y coherente?
    - ¿Los componentes tienen INTERACTIVIDAD y hover effects?
    - ¿El diseño responsive es AVANZADO y optimizado?
    - ¿Se evitaron completamente los diseños PLANOS y genéricos?
    - ¿El sitio transmite la EMOCIÓN y personalidad apropiada?
    - ¿Cada elemento tiene un propósito ESPECÍFICO para el negocio/producto?
    - ¿El código CSS incluye Grid, Flexbox, animaciones y efectos modernos?
    `;
  }

  /**
   * Construye un prompt de análisis para la instrucción del usuario
   * @param instruction Instrucción del usuario
   * @returns Prompt de análisis
   */
  private buildInstructionAnalysisPrompt(instruction: string): string {
    return `
    ANÁLISIS DE LA INSTRUCCIÓN DEL USUARIO:
    "${instruction}"

    Este análisis ayudará a generar contenido completamente personalizado.
    `;
  }

  /**
   * Construye el prompt para generar componentes de UI personalizados
   * @param instruction Instrucción del usuario
   * @param plan Plan del proyecto (opcional)
   * @returns Prompt para la API de Gemini
   */
  private buildUIComponentsPrompt(instruction: string, plan?: any): string {
    const projectName = plan?.name || 'Proyecto Web';
    const projectDescription = plan?.description || instruction;

    return `
    Eres un experto desarrollador frontend especializado en crear componentes de UI completamente personalizados. Tu tarea es analizar la instrucción específica del usuario y crear componentes que se adapten EXACTAMENTE a lo que solicita.

    INSTRUCCIÓN DEL USUARIO: ${instruction}

    NOMBRE DEL PROYECTO: ${projectName}
    DESCRIPCIÓN: ${projectDescription}

    ${plan ? `PLAN DEL PROYECTO: ${JSON.stringify(plan, null, 2)}` : ''}

    ANÁLISIS REQUERIDO:
    Antes de crear los componentes, analiza:
    1. ¿Qué tipo específico de negocio, producto o servicio se menciona?
    2. ¿Qué componentes específicos necesita esta solicitud?
    3. ¿Qué funcionalidades particulares se requieren?
    4. ¿Hay algún estilo o diseño específico mencionado?

    REQUISITOS PARA LOS COMPONENTES:
    1. PERSONALIZACIÓN TOTAL: Cada componente debe ser específico para la solicitud
    2. CONTENIDO REALISTA: Usar texto y datos relevantes al contexto solicitado
    3. FUNCIONALIDAD ESPECÍFICA: Adaptar la funcionalidad a las necesidades expresadas
    4. DISEÑO COHERENTE: Mantener consistencia con el contexto del negocio/producto
    5. SIN PLACEHOLDERS: Evitar contenido genérico o de ejemplo
    6. ACCESIBILIDAD: Seguir mejores prácticas de accesibilidad web
    7. RESPONSIVE: Diseño adaptable a diferentes dispositivos

    Responde ÚNICAMENTE con un objeto JSON VÁLIDO sin comentarios. NO incluyas comentarios como /* */ o // en el JSON.

    {
      "analysis": {
        "businessContext": "string (contexto específico del negocio/producto)",
        "requiredComponents": ["string (componentes específicos identificados)"],
        "functionalRequirements": ["string (funcionalidades específicas requeridas)"]
      },
      "components": [
        {
          "id": "string (identificador único)",
          "name": "string (nombre específico del componente)",
          "type": "string (tipo específico del componente)",
          "description": "string (descripción específica del componente)",
          "businessRelevance": "string (cómo este componente es relevante para la solicitud)",
          "properties": {
            "prop1": "value1 (valores específicos para el contexto)",
            "prop2": "value2"
          },
          "styles": {
            "style1": "value1 (estilos apropiados para el contexto)",
            "style2": "value2"
          },
          "htmlTemplate": "string (código HTML específico y personalizado)",
          "cssStyles": "string (código CSS específico y personalizado)",
          "jsCode": "string (código JavaScript específico si es necesario)"
        }
      ]
    }

    IMPORTANTE: El JSON debe ser completamente válido, sin comentarios, sin comas finales y con todas las comillas correctamente cerradas.
    `;
  }

  /**
   * Extrae la propuesta de diseño de la respuesta de la API
   * @param response Respuesta de la API
   * @returns Propuesta de diseño
   */
  private extractDesignProposalFromResponse(response: string): DesignProposal {
    try {
      console.log('🔍 Iniciando extracción de propuesta de diseño...');

      // Extraer el JSON de la respuesta
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                        response.match(/{[\s\S]*}/);

      if (!jsonMatch) {
        throw new Error('No se encontró un objeto JSON válido en la respuesta');
      }

      let jsonString = jsonMatch[0].replace(/```json\n|```/g, '');
      console.log('📝 JSON extraído, longitud:', jsonString.length);

      // Verificar si la respuesta contiene HTML en lugar de JSON
      if (jsonString.includes('<!DOCTYPE') || jsonString.includes('<html')) {
        console.error('La respuesta contiene HTML en lugar de JSON válido');
        console.error('Respuesta original:', response);
        throw new Error('La respuesta del agente contiene HTML en lugar de JSON válido');
      }

      // Limpiar comentarios de JavaScript del JSON
      console.log('🧹 Limpiando JSON...');
      jsonString = this.cleanJSONString(jsonString);
      console.log('✅ JSON limpiado exitosamente');

      // Intentar parsear el JSON con manejo de errores mejorado
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(jsonString);
        console.log('✅ JSON parseado exitosamente');
      } catch (parseError) {
        console.error('❌ Error al parsear JSON:', parseError);
        console.error('📍 Posición del error:', (parseError as any).message);

        // Intentar mostrar el contexto del error
        if ((parseError as any).message.includes('position')) {
          const position = parseInt((parseError as any).message.match(/position (\d+)/)?.[1] || '0');
          const start = Math.max(0, position - 50);
          const end = Math.min(jsonString.length, position + 50);
          console.error('🔍 Contexto del error:', jsonString.substring(start, end));
        }

        throw new Error(`Error de parsing JSON: ${(parseError as any).message}`);
      }

      // Verificar si hay análisis en la respuesta
      if (parsedResponse.analysis) {
        console.log('Análisis de la instrucción:', parsedResponse.analysis);
      }

      const proposal = parsedResponse.proposal;

      if (!proposal) {
        throw new Error('La respuesta no contiene una propuesta de diseño válida');
      }

      // Validar que el contenido sea personalizado
      this.validatePersonalizedContent(proposal, parsedResponse.analysis);

      // Asegurarse de que la propuesta tenga un ID único
      if (!proposal.id) {
        proposal.id = generateUniqueId('design-proposal');
      }

      // Asegurarse de que cada componente tenga un ID único
      if (proposal.components) {
        proposal.components = proposal.components.map((component: any) => ({
          ...component,
          id: component.id || generateUniqueId('component')
        }));
      }

      return proposal as DesignProposal;
    } catch (error) {
      console.error('Error al extraer la propuesta de diseño:', error);
      console.error('Respuesta original:', response);

      // Generar propuesta básica como fallback
      const fallbackComponents = this.generateFallbackComponents();
      return this.createProposalFromComponents(fallbackComponents, 'Propuesta de respaldo');
    }
  }

  /**
   * Valida que el contenido generado sea personalizado y no genérico
   * @param proposal Propuesta de diseño
   * @param analysis Análisis de la instrucción
   */
  private validatePersonalizedContent(proposal: any, analysis?: any): void {
    const genericTerms = ['lorem ipsum', 'empresa xyz', 'tu empresa', 'ejemplo', 'placeholder', 'demo'];
    const content = JSON.stringify(proposal).toLowerCase();

    // Verificar si hay términos genéricos
    const hasGenericContent = genericTerms.some(term => content.includes(term));

    if (hasGenericContent) {
      console.warn('Advertencia: Se detectó contenido genérico en la propuesta generada');
    }

    // Verificar que hay contenido HTML y CSS
    if (!proposal.htmlPreview || !proposal.cssPreview) {
      throw new Error('La propuesta debe incluir código HTML y CSS completo');
    }

    // Verificar que el HTML tiene contenido sustancial
    if (proposal.htmlPreview.length < 500) {
      console.warn('Advertencia: El HTML generado parece ser muy básico');
    }

    // Log del análisis para debugging
    if (analysis) {
      console.log('Validación de personalización:', {
        businessType: analysis.businessType,
        purpose: analysis.purpose,
        industry: analysis.industry,
        hasGenericContent
      });
    }
  }

  /**
   * Extrae los componentes de la respuesta de la API
   * @param response Respuesta de la API
   * @returns Array de componentes
   */
  private extractComponentsFromResponse(response: string): DesignComponent[] {
    try {
      // Extraer el JSON de la respuesta
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                        response.match(/{[\s\S]*}/);

      if (!jsonMatch) {
        throw new Error('No se encontró un objeto JSON válido en la respuesta');
      }

      let jsonString = jsonMatch[0].replace(/```json\n|```/g, '');

      // Limpiar comentarios de JavaScript del JSON
      jsonString = this.cleanJSONString(jsonString);

      const parsedResponse = JSON.parse(jsonString);

      const components = parsedResponse.components;

      if (!components || !Array.isArray(components)) {
        throw new Error('La respuesta no contiene componentes válidos');
      }

      // Asegurarse de que cada componente tenga un ID único
      return components.map((component: any) => ({
        ...component,
        id: component.id || generateUniqueId('component')
      }));
    } catch (error) {
      console.error('Error al extraer los componentes:', error);
      console.error('Respuesta original:', response);

      // Intentar generar componentes básicos como fallback
      return this.generateFallbackComponents();
    }
  }

  /**
   * Limpia el string JSON removiendo comentarios y caracteres problemáticos
   * @param jsonString String JSON a limpiar
   * @returns String JSON limpio
   */
  private cleanJSONString(jsonString: string): string {
    try {
      // Verificar si el string contiene HTML (indicador de respuesta malformada)
      if (jsonString.includes('<!DOCTYPE') || jsonString.includes('<html')) {
        console.warn('Respuesta contiene HTML en lugar de JSON válido');
        throw new Error('Respuesta contiene HTML en lugar de JSON');
      }

      // Remover backticks que pueden estar envolviendo el JSON
      jsonString = jsonString.replace(/^`+|`+$/g, '');

      // Remover comentarios de línea única
      jsonString = jsonString.replace(/\/\/.*$/gm, '');

      // Remover comentarios de bloque
      jsonString = jsonString.replace(/\/\*[\s\S]*?\*\//g, '');

      // Remover comas finales antes de } o ]
      jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');

      // Escapar comillas dentro de strings que no están escapadas
      jsonString = this.fixUnescapedQuotes(jsonString);

      // Remover espacios en blanco excesivos pero preservar estructura
      jsonString = jsonString.replace(/\s+/g, ' ').trim();

      // Validar que las llaves estén balanceadas
      if (!this.areJsonBracesBalanced(jsonString)) {
        throw new Error('JSON con llaves desbalanceadas');
      }

      return jsonString;
    } catch (error) {
      console.warn('Error al limpiar JSON, intentando reparación automática:', error);
      return this.attemptJsonRepair(jsonString);
    }
  }

  /**
   * Intenta reparar un JSON malformado
   * @param jsonString String JSON potencialmente malformado
   * @returns String JSON reparado
   */
  private attemptJsonRepair(jsonString: string): string {
    try {
      // Intentar encontrar el JSON válido más largo posible
      let cleanJson = jsonString;

      // Remover caracteres problemáticos al final
      cleanJson = cleanJson.replace(/[,\s]*$/, '');

      // Si termina con una coma seguida de }, remover la coma
      cleanJson = cleanJson.replace(/,(\s*})/, '$1');

      // Asegurar que termine con }
      if (!cleanJson.endsWith('}')) {
        // Encontrar la última llave de apertura sin cerrar
        const openBraces = (cleanJson.match(/{/g) || []).length;
        const closeBraces = (cleanJson.match(/}/g) || []).length;
        const missingBraces = openBraces - closeBraces;

        for (let i = 0; i < missingBraces; i++) {
          cleanJson += '}';
        }
      }

      // Intentar parsear para validar
      JSON.parse(cleanJson);
      return cleanJson;
    } catch (error) {
      console.error('No se pudo reparar el JSON automáticamente:', error);
      throw new Error('JSON irreparable');
    }
  }

  /**
   * Verifica si las llaves del JSON están balanceadas
   * @param jsonString String JSON a verificar
   * @returns true si están balanceadas
   */
  private areJsonBracesBalanced(jsonString: string): boolean {
    let braceCount = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
        }
      }
    }

    return braceCount === 0;
  }

  /**
   * Intenta arreglar comillas no escapadas en el JSON
   * @param jsonString String JSON con posibles comillas no escapadas
   * @returns String JSON con comillas arregladas
   */
  private fixUnescapedQuotes(jsonString: string): string {
    // Esta es una implementación básica - en casos complejos podría necesitar más trabajo
    return jsonString.replace(/([^\\])"/g, (match, p1) => {
      // Si la comilla no está precedida por una barra invertida, podría necesitar escape
      // Pero esto es complejo de hacer correctamente sin un parser completo
      return match;
    });
  }

  /**
   * Genera componentes básicos como fallback cuando falla el parsing
   * @returns Array de componentes básicos
   */
  private generateFallbackComponents(): DesignComponent[] {
    return [
      {
        id: generateUniqueId('component'),
        name: 'Encabezado',
        type: 'header',
        description: 'Encabezado principal con navegación',
        properties: {
          title: 'Mi Sitio Web',
          navigation: ['Inicio', 'Acerca de', 'Contacto']
        }
      },
      {
        id: generateUniqueId('component'),
        name: 'Sección Principal',
        type: 'hero',
        description: 'Sección hero con título y descripción',
        properties: {
          title: 'Bienvenido',
          subtitle: 'Descripción del sitio web',
          hasButton: true
        }
      },
      {
        id: generateUniqueId('component'),
        name: 'Contenido',
        type: 'content',
        description: 'Sección de contenido principal',
        properties: {
          layout: 'single-column',
          hasImages: false
        }
      },
      {
        id: generateUniqueId('component'),
        name: 'Pie de Página',
        type: 'footer',
        description: 'Pie de página con información de contacto',
        properties: {
          copyright: true,
          links: ['Privacidad', 'Términos']
        }
      }
    ];
  }

  /**
   * Genera componentes basados en la propuesta de diseño
   * @param proposal Propuesta de diseño
   * @returns Array de componentes
   */
  private generateComponentsFromProposal(proposal: DesignProposal): DesignComponent[] {
    return proposal.components || [];
  }

  /**
   * Crea una propuesta de diseño básica cuando no se puede generar desde la API
   * @param components Array de componentes
   * @param instruction Instrucción original
   * @returns Propuesta de diseño básica
   */
  private createProposalFromComponents(components: DesignComponent[], instruction: string): DesignProposal {
    const projectTitle = instruction.length > 50 ? `${instruction.substring(0, 50)}...` : instruction;

    // Generar HTML básico personalizado basado en la instrucción
    const basicHtml = this.generateBasicPersonalizedHTML(projectTitle, instruction);
    const basicCss = this.generateBasicPersonalizedCSS(projectTitle);

    return {
      id: generateUniqueId('design-proposal'),
      title: projectTitle,
      description: `Propuesta generada como respaldo basada en la instrucción: ${instruction}`,
      components,
      style: 'modern',
      colorPalette: {
        primary: '#3b82f6',
        secondary: '#10b981',
        accent: '#8b5cf6',
        background: '#ffffff',
        text: '#1f2937'
      },
      typography: {
        headingFont: 'Inter, sans-serif',
        bodyFont: 'Inter, sans-serif',
        baseSize: '16px',
        scale: 1.25
      },
      responsive: true,
      accessibility: {
        level: 'AA',
        features: ['Contraste adecuado', 'Etiquetas ARIA', 'Navegación por teclado']
      },
      previewImages: [],
      htmlPreview: basicHtml,
      cssPreview: basicCss
    };
  }

  /**
   * Genera HTML básico personalizado cuando la API falla
   * @param projectTitle Título del proyecto
   * @param instruction Instrucción original
   * @returns HTML básico personalizado
   */
  private generateBasicPersonalizedHTML(projectTitle: string, instruction: string): string {
    // Extraer palabras clave de la instrucción para personalizar el contenido
    const keywords = this.extractKeywordsFromInstruction(instruction);

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectTitle}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <h1 class="header-title">${projectTitle}</h1>
            <nav class="nav">
                <ul class="nav-list">
                    <li><a href="#inicio" class="nav-link">Inicio</a></li>
                    <li><a href="#informacion" class="nav-link">Información</a></li>
                    <li><a href="#contacto" class="nav-link">Contacto</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <main class="main">
        <section id="inicio" class="hero">
            <div class="container">
                <h2 class="hero-title">${projectTitle}</h2>
                <p class="hero-description">Basado en su solicitud: ${instruction}</p>
                <p class="hero-note">Esta es una versión básica. Para obtener contenido completamente personalizado, por favor proporcione más detalles específicos sobre su negocio o proyecto.</p>
                <button class="btn btn-primary">Más Información</button>
            </div>
        </section>

        <section id="informacion" class="info">
            <div class="container">
                <h2 class="section-title">Información del Proyecto</h2>
                <div class="info-content">
                    <p>Palabras clave identificadas: ${keywords.join(', ')}</p>
                    <p>Para generar contenido más específico y personalizado, proporcione detalles adicionales sobre:</p>
                    <ul>
                        <li>Tipo específico de negocio o industria</li>
                        <li>Productos o servicios ofrecidos</li>
                        <li>Público objetivo</li>
                        <li>Características deseadas para la página web</li>
                    </ul>
                </div>
            </div>
        </section>
    </main>

    <footer id="contacto" class="footer">
        <div class="container">
            <div class="footer-content">
                <p>Proyecto generado por CODESTORM</p>
                <p>Para personalización completa, proporcione más detalles específicos</p>
            </div>
        </div>
    </footer>
</body>
</html>`;
  }

  /**
   * Extrae palabras clave de la instrucción del usuario
   * @param instruction Instrucción del usuario
   * @returns Array de palabras clave
   */
  private extractKeywordsFromInstruction(instruction: string): string[] {
    const stopWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'una', 'crear', 'generar', 'hacer', 'página', 'web', 'sitio'];
    const words = instruction.toLowerCase().split(/\s+/);
    return words.filter(word => word.length > 3 && !stopWords.includes(word)).slice(0, 5);
  }

  /**
   * Genera CSS básico personalizado cuando la API falla
   * @param projectTitle Título del proyecto
   * @returns CSS básico personalizado
   */
  private generateBasicPersonalizedCSS(projectTitle: string): string {
    return `/* Estilos básicos para ${projectTitle} */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #10b981;
  --color-accent: #8b5cf6;
  --color-background: #ffffff;
  --color-text: #1f2937;
  --color-dark: #0f172a;
  --color-light: #f8fafc;

  --font-heading: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-base-size: 16px;
  --font-scale: 1.25;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-body);
  font-size: var(--font-base-size);
  color: var(--color-text);
  background-color: var(--color-background);
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header */
.header {
  background: linear-gradient(135deg, var(--color-dark), var(--color-primary));
  color: white;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 1.5rem;
  font-weight: bold;
}

.nav-list {
  display: flex;
  list-style: none;
  gap: 2rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: var(--color-accent);
}

/* Hero Section */
.hero {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  padding: 4rem 0;
  text-align: center;
}

.hero-title {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  animation: fadeInUp 1s ease;
}

.hero-description {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  animation: fadeInUp 1s ease 0.2s both;
}

.hero-note {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-bottom: 2rem;
  animation: fadeInUp 1s ease 0.3s both;
}

.btn {
  display: inline-block;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: fadeInUp 1s ease 0.4s both;
}

.btn-primary {
  background-color: var(--color-accent);
  color: white;
}

.btn-primary:hover {
  background-color: #7c3aed;
  transform: translateY(-2px);
}

/* Info Section */
.info {
  padding: 4rem 0;
  background-color: var(--color-light);
}

.section-title {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 2rem;
  color: var(--color-dark);
}

.info-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.info-content ul {
  text-align: left;
  margin: 2rem 0;
  padding-left: 2rem;
}

.info-content li {
  margin-bottom: 0.5rem;
}

/* Footer */
.footer {
  background-color: var(--color-dark);
  color: white;
  padding: 2rem 0;
  text-align: center;
}

.footer-content p {
  margin-bottom: 0.5rem;
}

/* Animations */
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

/* Responsive */
@media (max-width: 768px) {
  .header .container {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-list {
    gap: 1rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-description {
    font-size: 1rem;
  }
}`;
  }

  /**
   * Genera archivos basados en los componentes
   * @param components Array de componentes
   * @param proposal Propuesta de diseño
   * @returns Array de archivos
   */
  /**
   * Mejora archivos HTML con estilos visuales
   * @param task Tarea con la instrucción para mejorar los archivos HTML
   * @returns Resultado con los archivos mejorados
   */
  private async enhanceHTMLWithStyles(task: AgentTask): Promise<DesignArchitectResult> {
    try {
      // Extraer los archivos HTML del plan
      const htmlFiles = this.extractHTMLFilesFromPlan(task.plan);

      if (htmlFiles.length === 0) {
        throw new Error('No se encontraron archivos HTML para mejorar');
      }

      // Construir el prompt para mejorar los archivos HTML
      const prompt = this.buildEnhanceHTMLPrompt(task.instruction, htmlFiles);

      // Llamar a la API de Gemini
      const response = await callGeminiAPI(prompt, {
        temperature: 0.7,
        maxOutputTokens: 8192,
        topK: 40,
        topP: 0.95,
      });

      if (!response || !response.trim()) {
        throw new Error('No se recibió respuesta de la API de Gemini');
      }

      // Extraer los archivos mejorados de la respuesta
      const enhancedFiles = this.extractEnhancedFilesFromResponse(response, htmlFiles);

      return {
        success: true,
        data: {
          files: enhancedFiles,
          designSummary: 'Archivos HTML mejorados con estilos visuales y animaciones, manteniendo un diseño futurista en azul oscuro coherente con CODESTORM.',
          styleGuide: {
            colors: ['#0f172a', '#1e293b', '#3b82f6', '#60a5fa', '#93c5fd'],
            fonts: ['Inter, sans-serif', 'Roboto Mono, monospace'],
            components: ['Botones', 'Tarjetas', 'Formularios', 'Navegación']
          }
        }
      };
    } catch (error) {
      console.error('Error al mejorar archivos HTML:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al mejorar archivos HTML'
      };
    }
  }

  /**
   * Extrae archivos HTML del plan
   * @param plan Plan del proyecto
   * @returns Array de archivos HTML
   */
  private extractHTMLFilesFromPlan(plan: any): any[] {
    if (!plan || !plan.files || !Array.isArray(plan.files)) {
      return [];
    }

    return plan.files.filter((file: any) => {
      return file.path?.endsWith('.html') ||
             file.language === 'html' ||
             (file.content && file.content.includes('<!DOCTYPE html>'));
    });
  }

  /**
   * Construye el prompt para mejorar archivos HTML
   * @param instruction Instrucción del usuario
   * @param htmlFiles Archivos HTML a mejorar
   * @returns Prompt para la API de Gemini
   */
  private buildEnhanceHTMLPrompt(instruction: string, htmlFiles: any[]): string {
    const filesContent = htmlFiles.map(file => {
      return `
ARCHIVO: ${file.path}
CONTENIDO:
\`\`\`html
${file.content || '<!-- Contenido no disponible -->'}
\`\`\`
`;
    }).join('\n\n');

    return `
    Eres un experto diseñador frontend especializado en mejorar archivos HTML con estilos visuales y animaciones. Tu tarea es mejorar los siguientes archivos HTML con estilos visuales apropiados, siguiendo estas directrices:

    1. Mantener un diseño futurista en azul oscuro coherente con CODESTORM
    2. Añadir animaciones sutiles para mejorar la experiencia de usuario
    3. Asegurar que el diseño sea responsive y accesible
    4. Utilizar CSS moderno (preferiblemente con variables CSS)
    5. Mantener la estructura HTML original, solo añadiendo clases y estilos

    INSTRUCCIÓN: ${instruction}

    ARCHIVOS HTML A MEJORAR:
    ${filesContent}

    Para cada archivo HTML, debes:
    1. Crear o mejorar un archivo CSS correspondiente
    2. Añadir clases y atributos al HTML para aplicar los estilos
    3. Añadir animaciones sutiles donde sea apropiado

    Responde ÚNICAMENTE con un objeto JSON con la siguiente estructura:

    {
      "files": [
        {
          "path": "ruta/al/archivo.html",
          "content": "contenido HTML mejorado",
          "language": "html",
          "type": "html"
        },
        {
          "path": "ruta/al/archivo.css",
          "content": "contenido CSS",
          "language": "css",
          "type": "css"
        }
      ],
      "summary": "Descripción de las mejoras realizadas"
    }
    `;
  }

  /**
   * Extrae los archivos mejorados de la respuesta de la API
   * @param response Respuesta de la API
   * @param originalFiles Archivos originales
   * @returns Array de archivos mejorados
   */
  private extractEnhancedFilesFromResponse(response: string, originalFiles: any[]): any[] {
    try {
      // Extraer el JSON de la respuesta
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                        response.match(/{[\s\S]*}/);

      if (!jsonMatch) {
        throw new Error('No se encontró un objeto JSON válido en la respuesta');
      }

      const jsonString = jsonMatch[0].replace(/```json\n|```/g, '');
      const parsedResponse = JSON.parse(jsonString);

      if (!parsedResponse.files || !Array.isArray(parsedResponse.files)) {
        throw new Error('La respuesta no contiene archivos válidos');
      }

      // Asegurarse de que cada archivo tenga los campos necesarios
      return parsedResponse.files.map((file: any) => {
        // Si es un archivo HTML, asegurarse de que incluya el enlace al CSS
        if (file.path.endsWith('.html') && file.content) {
          // Buscar el CSS correspondiente
          const cssFile = parsedResponse.files.find((f: any) =>
            f.path.endsWith('.css') &&
            f.path.includes(file.path.replace('.html', ''))
          );

          // Si hay un CSS correspondiente, asegurarse de que el HTML lo incluya
          if (cssFile && !file.content.includes(cssFile.path)) {
            // Añadir el enlace al CSS en el head
            file.content = file.content.replace(
              /<\/head>/i,
              `  <link rel="stylesheet" href="${cssFile.path}">\n</head>`
            );
          }
        }

        return {
          path: file.path,
          content: file.content,
          language: file.language || this.detectLanguageFromPath(file.path),
          type: file.type || 'file'
        };
      });
    } catch (error) {
      console.error('Error al extraer los archivos mejorados:', error);
      // En caso de error, devolver los archivos originales
      return originalFiles;
    }
  }

  /**
   * Detecta el lenguaje de programación a partir de la extensión del archivo
   * @param filePath Ruta del archivo
   * @returns Lenguaje de programación detectado
   */
  private detectLanguageFromPath(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase() || '';

    const extensionMap: { [key: string]: string } = {
      'html': 'html',
      'css': 'css',
      'js': 'javascript',
      'ts': 'typescript',
      'json': 'json',
      'md': 'markdown'
    };

    return extensionMap[extension] || 'plaintext';
  }

  private async generateFilesFromComponents(components: DesignComponent[], proposal: DesignProposal): Promise<FileItem[]> {
    const files: FileItem[] = [];
    const timestamp = Date.now();

    // Generar archivo CSS principal
    const mainCssContent = `
/* Estilos generados para ${proposal.title} */
:root {
  --color-primary: ${proposal.colorPalette.primary};
  --color-secondary: ${proposal.colorPalette.secondary};
  --color-accent: ${proposal.colorPalette.accent};
  --color-background: ${proposal.colorPalette.background};
  --color-text: ${proposal.colorPalette.text};

  --font-heading: ${proposal.typography.headingFont};
  --font-body: ${proposal.typography.bodyFont};
  --font-base-size: ${proposal.typography.baseSize};
  --font-scale: ${proposal.typography.scale};
}

body {
  font-family: var(--font-body);
  font-size: var(--font-base-size);
  color: var(--color-text);
  background-color: var(--color-background);
  line-height: 1.5;
  margin: 0;
  padding: 0;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  margin-top: 0;
}

h1 { font-size: calc(var(--font-base-size) * var(--font-scale) * var(--font-scale) * var(--font-scale)); }
h2 { font-size: calc(var(--font-base-size) * var(--font-scale) * var(--font-scale)); }
h3 { font-size: calc(var(--font-base-size) * var(--font-scale)); }

/* Estilos responsive */
@media (max-width: 768px) {
  :root {
    --font-base-size: calc(${proposal.typography.baseSize} * 0.9);
  }
}

${proposal.cssPreview || ''}
`;

    files.push({
      id: generateUniqueId('file'),
      name: 'styles.css',
      path: 'styles.css',
      content: mainCssContent,
      language: 'css',
      timestamp,
      type: 'file'
    });

    // Generar archivo HTML principal si existe
    if (proposal.htmlPreview) {
      files.push({
        id: generateUniqueId('file'),
        name: 'index.html',
        path: 'index.html',
        content: proposal.htmlPreview,
        language: 'html',
        timestamp,
        type: 'file'
      });
    }

    // Generar archivos para cada componente
    for (const component of components) {
      if (component.htmlTemplate) {
        files.push({
          id: generateUniqueId('file'),
          name: `${component.name.toLowerCase().replace(/\s+/g, '-')}.html`,
          path: `components/${component.name.toLowerCase().replace(/\s+/g, '-')}.html`,
          content: component.htmlTemplate,
          language: 'html',
          timestamp,
          type: 'file'
        });
      }

      if (component.cssStyles) {
        files.push({
          id: generateUniqueId('file'),
          name: `${component.name.toLowerCase().replace(/\s+/g, '-')}.css`,
          path: `components/${component.name.toLowerCase().replace(/\s+/g, '-')}.css`,
          content: component.cssStyles,
          language: 'css',
          timestamp,
          type: 'file'
        });
      }

      if (component.jsCode) {
        files.push({
          id: generateUniqueId('file'),
          name: `${component.name.toLowerCase().replace(/\s+/g, '-')}.js`,
          path: `scripts/${component.name.toLowerCase().replace(/\s+/g, '-')}.js`,
          content: component.jsCode,
          language: 'javascript',
          timestamp,
          type: 'file'
        });
      }
    }

    return files;
  }
}
