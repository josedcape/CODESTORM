import { tryWithFallback } from './ai';
import { EnhancedAPIService } from './EnhancedAPIService';
import { generateUniqueId } from '../utils/idGenerator';
import { WebPagePlan } from '../components/webbuilder/UnifiedPlanningInterface';
import { getDistributedAgentConfig } from '../config/claudeModels';

export interface PlanningState {
  currentPhase: 'input' | 'enhancement' | 'planning' | 'approval' | 'coordination' | 'generation' | 'completed';
  userInstruction: string;
  enhancedPrompt?: string;
  plan?: WebPagePlan;
  isProcessing: boolean;
  error?: string;
  coordinationProgress?: {
    stage: string;
    progress: number;
    currentAgent: string;
  };
  generatedFiles?: {
    html: string;
    css: string;
    js: string;
  };
}

export interface PlanningCallbacks {
  onStateChange: (state: PlanningState) => void;
  onProgress: (message: string, progress: number) => void;
  onError: (error: string) => void;
  onComplete: (files: Array<{ name: string; content: string; type: string }>) => void;
}

export class UnifiedPlanningService {
  private state: PlanningState;
  private callbacks: PlanningCallbacks;
  private apiService = EnhancedAPIService.getInstance();

  constructor(callbacks: PlanningCallbacks) {
    this.callbacks = callbacks;
    this.state = {
      currentPhase: 'input',
      userInstruction: '',
      isProcessing: false
    };
  }

  public getState(): PlanningState {
    return { ...this.state };
  }

  public updateInstruction(instruction: string): void {
    this.state.userInstruction = instruction;
    this.emitStateChange();
  }

  public async startPlanning(): Promise<void> {
    if (!this.state.userInstruction.trim()) {
      throw new Error('La instrucción no puede estar vacía');
    }

    this.state.currentPhase = 'enhancement';
    this.state.isProcessing = false;
    this.emitStateChange();
  }

  public async startDirectPlanning(): Promise<void> {
    if (!this.state.userInstruction.trim()) {
      throw new Error('La instrucción no puede estar vacía');
    }

    this.state.currentPhase = 'planning';
    this.state.isProcessing = true;
    this.emitStateChange();
    await this.generatePlan();
  }

  public goToEnhancement(): void {
    this.state.currentPhase = 'enhancement';
    this.state.isProcessing = false;
    this.emitStateChange();
  }

  public async enhancePrompt(): Promise<{ success: boolean; enhancedPrompt?: string; error?: string }> {
    try {
      // Validar que hay instrucción del usuario
      if (!this.state.userInstruction || this.state.userInstruction.trim().length < 5) {
        throw new Error('La instrucción del usuario es demasiado corta para mejorar');
      }

      this.state.isProcessing = true;
      this.emitStateChange();
      this.callbacks.onProgress('Mejorando descripción con IA...', 25);

      console.log('✨ Iniciando mejora de prompt para:', this.state.userInstruction);

      const enhancementPrompt = `
Como experto en desarrollo web y UX, mejora la siguiente descripción de página web para hacerla más específica, detallada y técnicamente precisa:

DESCRIPCIÓN ORIGINAL: "${this.state.userInstruction}"

INSTRUCCIONES PARA MEJORA:
1. MANTÉN LA ESENCIA: Conserva el propósito y tema principal de la descripción original
2. AGREGA ESPECIFICIDAD: Incluye detalles concretos sobre el contenido y funcionalidades
3. DEFINE ESTRUCTURA: Especifica secciones, páginas y elementos necesarios
4. INCLUYE FUNCIONALIDADES: Detalla características interactivas y técnicas
5. ESPECIFICA DISEÑO: Menciona estilo visual, colores, tipografía apropiados
6. DEFINE AUDIENCIA: Clarifica el público objetivo y sus necesidades
7. AÑADE CONTEXTO: Incluye información sobre el propósito comercial o personal

FORMATO DE RESPUESTA:
Proporciona una descripción mejorada que sea:
- Específica y detallada (mínimo 100 palabras)
- Técnicamente viable para desarrollo web
- Orientada a resultados concretos
- Clara en objetivos y funcionalidades
- Completa en alcance y estructura
- Profesional y bien estructurada

EJEMPLO DE MEJORA:
Original: "Una página para mi negocio"
Mejorada: "Una página web profesional para [tipo de negocio] que incluya una sección hero con llamada a la acción, galería de productos/servicios, testimonios de clientes, información de contacto con formulario, y diseño responsive moderno con colores corporativos que transmita confianza y profesionalismo al público objetivo de [audiencia específica]."

IMPORTANTE:
- La descripción mejorada debe ser una versión expandida y más precisa de la original
- NO cambies el tema o propósito principal
- Mantén el tono apropiado para el tipo de proyecto
- Incluye detalles técnicos relevantes

Responde ÚNICAMENTE con la descripción mejorada, sin explicaciones adicionales.
`;

      // Usar configuración distribuida para PromptEnhancementAgent
      const agentConfig = getDistributedAgentConfig('PromptEnhancementAgent');
      console.log(`✨ Usando configuración: ${agentConfig.model.id} con ${agentConfig.maxTokens} tokens`);

      const response = await this.apiService.sendMessage(enhancementPrompt, {
        agentName: 'PromptEnhancementAgent',
        maxTokens: agentConfig.maxTokens,
        temperature: agentConfig.temperature,
        systemPrompt: 'Eres un experto en desarrollo web y UX especializado en mejorar descripciones de proyectos web. Tu trabajo es expandir y detallar las ideas del usuario manteniendo su esencia original.'
      });

      if (!response.success || !response.data) {
        throw new Error(`Error al mejorar prompt: ${response.error || 'Respuesta vacía del servicio de IA'}`);
      }

      console.log('✨ Respuesta recibida del PromptEnhancementAgent');

      // Extraer y validar contenido mejorado
      const enhancedContent = response.data.trim();

      if (!enhancedContent || enhancedContent.length < 20) {
        throw new Error('La respuesta del agente de mejora es demasiado corta o vacía');
      }

      // Validar que la mejora es sustancialmente diferente del original
      if (enhancedContent.toLowerCase() === this.state.userInstruction.toLowerCase()) {
        console.warn('✨ La mejora es idéntica al original, usando de todas formas');
      }

      this.state.enhancedPrompt = enhancedContent;
      this.state.isProcessing = false;
      this.emitStateChange();
      this.callbacks.onProgress('Descripción mejorada exitosamente', 100);

      console.log('✨ Prompt mejorado exitosamente:');
      console.log('✨ Original:', this.state.userInstruction);
      console.log('✨ Mejorado:', this.state.enhancedPrompt);

      return { success: true, enhancedPrompt: this.state.enhancedPrompt };

    } catch (error) {
      console.error('✨ Error en enhancePrompt:', error);

      // Intentar fallback con mejora básica local
      try {
        console.log('✨ Intentando fallback con mejora básica...');
        const basicEnhancement = this.generateBasicEnhancement(this.state.userInstruction);

        if (basicEnhancement && basicEnhancement.length > this.state.userInstruction.length) {
          this.state.enhancedPrompt = basicEnhancement;
          this.state.isProcessing = false;
          this.emitStateChange();
          this.callbacks.onProgress('Descripción mejorada con fallback básico', 100);

          console.log('✨ Fallback exitoso:');
          console.log('✨ Original:', this.state.userInstruction);
          console.log('✨ Mejorado (fallback):', this.state.enhancedPrompt);

          return { success: true, enhancedPrompt: this.state.enhancedPrompt };
        }
      } catch (fallbackError) {
        console.error('✨ Error en fallback:', fallbackError);
      }

      this.state.isProcessing = false;
      this.state.error = error instanceof Error ? error.message : 'Error desconocido al mejorar el prompt';
      this.emitStateChange();
      this.callbacks.onError(`${this.state.error}. Puedes continuar con la descripción original usando "Omitir Mejora".`);

      return { success: false, error: this.state.error };
    }
  }

  public async skipEnhancement(): Promise<void> {
    this.state.currentPhase = 'planning';
    this.state.isProcessing = true;
    this.emitStateChange();
    await this.generatePlan();
  }

  public async useEnhancedPrompt(): Promise<void> {
    if (!this.state.enhancedPrompt) {
      throw new Error('No hay prompt mejorado disponible');
    }
    this.state.userInstruction = this.state.enhancedPrompt;
    this.state.currentPhase = 'planning';
    this.state.isProcessing = true;
    this.emitStateChange();
    await this.generatePlan();
  }

  public async useOriginalPrompt(): Promise<void> {
    this.state.currentPhase = 'planning';
    this.state.isProcessing = true;
    this.emitStateChange();
    await this.generatePlan();
  }

  private async generatePlan(): Promise<void> {
    try {
      this.callbacks.onProgress('Generando plan detallado...', 60);

      // Usar la instrucción específica del usuario (mejorada si existe)
      const userInstruction = this.state.enhancedPrompt || this.state.userInstruction;
      console.log('📋 Generando plan específico para:', userInstruction);

      const planPrompt = `
Crea un plan detallado para desarrollar ESPECÍFICAMENTE la siguiente página web del usuario:

INSTRUCCIÓN ESPECÍFICA DEL USUARIO: ${userInstruction}

IMPORTANTE: El plan debe ser ESPECÍFICO para esta instrucción, no genérico. Analiza cuidadosamente lo que el usuario quiere y crea un plan personalizado.

Analiza la instrucción del usuario y genera un plan estructurado en formato JSON que sea ESPECÍFICO para su solicitud:

ESTRUCTURA JSON REQUERIDA:
{
  "title": "Título específico basado en la instrucción del usuario",
  "description": "Descripción detallada del proyecto específico",
  "structure": [
    {
      "section": "Nombre de sección específica",
      "description": "Descripción específica de esta sección",
      "content": ["Contenido específico 1", "Contenido específico 2", "etc"]
    }
  ],
  "design": {
    "colorScheme": "Esquema de colores apropiado para el proyecto específico",
    "typography": "Tipografía apropiada para el tipo de proyecto",
    "layout": "Layout específico para las necesidades del proyecto",
    "style": "Estilo visual apropiado para el contexto"
  },
  "functionality": ["Funcionalidad específica 1", "Funcionalidad específica 2"],
  "estimatedComplexity": "low|medium|high"
}

REQUISITOS ESPECÍFICOS:
1. El título debe reflejar exactamente lo que el usuario pidió
2. Las secciones deben ser apropiadas para el tipo de página solicitada
3. El contenido debe ser específico al contexto (no genérico)
4. El diseño debe ser apropiado para el propósito de la página
5. Las funcionalidades deben ser relevantes para el proyecto específico

IMPORTANTE: NO generes un plan genérico. Analiza la instrucción del usuario y crea un plan personalizado.

Responde ÚNICAMENTE con el JSON válido, sin texto adicional.
`;

      // Usar EnhancedAPIService para mayor robustez
      const response = await this.apiService.sendMessage(planPrompt, {
        agentName: 'PlanningAgent',
        maxTokens: 3072,
        temperature: 0.8,
        systemPrompt: 'Eres un experto en planificación de proyectos web especializado en crear planes detallados y específicos basados en las necesidades del usuario.'
      });

      if (!response.success || !response.data) {
        throw new Error(`Error al generar plan: ${response.error}`);
      }

      const plan = this.parseWebPagePlan(response.data);

      this.state.plan = plan;
      this.state.currentPhase = 'approval';
      this.state.isProcessing = false;
      this.emitStateChange();
      this.callbacks.onProgress('Plan generado exitosamente', 80);

    } catch (error) {
      this.state.isProcessing = false;
      this.state.error = error instanceof Error ? error.message : 'Error al generar el plan';
      this.emitStateChange();
      this.callbacks.onError(this.state.error);
    }
  }

  private parseWebPagePlan(content: string): WebPagePlan {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          id: generateUniqueId('plan'),
          title: parsed.title || 'Página Web',
          description: parsed.description || 'Página web generada automáticamente',
          structure: parsed.structure || [],
          design: parsed.design || {
            colorScheme: 'Moderno y profesional',
            typography: 'Sans-serif limpia',
            layout: 'Responsive',
            style: 'Minimalista'
          },
          functionality: parsed.functionality || [],
          estimatedComplexity: parsed.estimatedComplexity || 'medium'
        };
      }
    } catch (error) {
      console.error('Error parsing web page plan:', error);
    }

    // Fallback plan if parsing fails - usar instrucción del usuario
    const userInstruction = this.state.enhancedPrompt || this.state.userInstruction;
    return {
      id: generateUniqueId('plan'),
      title: userInstruction.length > 50 ? userInstruction.substring(0, 50) + '...' : userInstruction,
      description: `Página web específica: ${userInstruction}`,
      structure: [
        {
          id: generateUniqueId('section'),
          section: 'Header',
          description: 'Encabezado con navegación',
          content: ['Logo', 'Menú de navegación']
        },
        {
          id: generateUniqueId('section'),
          section: 'Hero',
          description: 'Sección principal de impacto',
          content: ['Título principal', 'Subtítulo', 'Call-to-action']
        },
        {
          id: generateUniqueId('section'),
          section: 'Content',
          description: 'Contenido principal',
          content: ['Información relevante', 'Características']
        },
        {
          id: generateUniqueId('section'),
          section: 'Footer',
          description: 'Pie de página',
          content: ['Información de contacto', 'Enlaces adicionales']
        }
      ],
      design: {
        colorScheme: 'Azul y blanco profesional',
        typography: 'Sans-serif moderna',
        layout: 'Responsive y centrado',
        style: 'Limpio y minimalista'
      },
      functionality: ['Navegación suave', 'Diseño responsive', 'Animaciones CSS'],
      estimatedComplexity: 'medium'
    };
  }

  public async approvePlan(feedback?: string): Promise<void> {
    if (!this.state.plan) {
      throw new Error('No hay plan disponible para aprobar');
    }

    this.state.currentPhase = 'coordination';
    this.state.isProcessing = true;
    this.emitStateChange();
    await this.coordinateAgents();
  }

  public async rejectPlan(feedback: string): Promise<void> {
    this.state.currentPhase = 'input';
    this.state.plan = undefined;
    this.state.enhancedPrompt = undefined;
    this.state.isProcessing = false;
    this.state.error = `Plan rechazado: ${feedback}`;
    this.emitStateChange();
    this.callbacks.onError(`Plan rechazado. ${feedback}`);
  }

  private async coordinateAgents(): Promise<void> {
    try {
      if (!this.state.plan) {
        throw new Error('No hay plan disponible');
      }

      const plan = this.state.plan;

      // Phase 1: Design Architect Agent
      this.state.coordinationProgress = {
        stage: 'Diseño y Estilos',
        progress: 25,
        currentAgent: 'Design Architect Agent'
      };
      this.emitStateChange();
      this.callbacks.onProgress('Coordinando agentes especializados - Generando diseño...', 25);

      console.log('🎨 Iniciando Design Architect Agent...');
      const cssContent = await this.generateCSSWithDesignAgent(plan);
      console.log('🎨 CSS generado:', cssContent.length, 'caracteres');
      console.log('🎨 Primeras 200 caracteres del CSS:', cssContent.substring(0, 200));

      // Phase 2: Code Constructor Agent
      this.state.coordinationProgress = {
        stage: 'Estructura HTML',
        progress: 50,
        currentAgent: 'Code Constructor Agent'
      };
      this.emitStateChange();
      this.callbacks.onProgress('Generando estructura HTML...', 50);

      console.log('🏗️ Iniciando Code Constructor Agent...');
      const htmlContent = await this.generateHTMLWithCodeAgent(plan);
      console.log('🏗️ HTML generado:', htmlContent.length, 'caracteres');
      console.log('🏗️ Primeras 200 caracteres del HTML:', htmlContent.substring(0, 200));

      // Phase 3: JavaScript Enhancement
      this.state.coordinationProgress = {
        stage: 'Funcionalidad JavaScript',
        progress: 60,
        currentAgent: 'JavaScript Agent'
      };
      this.emitStateChange();
      this.callbacks.onProgress('Añadiendo funcionalidad JavaScript...', 60);

      console.log('⚡ Iniciando JavaScript Agent...');
      const jsContent = await this.generateJavaScript(plan);
      console.log('⚡ JavaScript generado:', jsContent.length, 'caracteres');
      console.log('⚡ Primeras 200 caracteres del JS:', jsContent.substring(0, 200));

      // Phase 4: GIFT Agent (Graphics, Icons, Features & Transitions)
      this.state.coordinationProgress = {
        stage: 'Elementos Visuales y Animaciones',
        progress: 70,
        currentAgent: 'GIFT Agent'
      };
      this.emitStateChange();
      this.callbacks.onProgress('Generando iconos, animaciones y elementos visuales...', 70);

      console.log('🎨 Iniciando GIFT Agent (Graphics, Icons, Features & Transitions)...');
      const { enhancedHTML, enhancedCSS } = await this.generateVisualEnhancements(plan, htmlContent, cssContent);
      console.log('🎨 HTML enriquecido:', enhancedHTML.length, 'caracteres');
      console.log('🎨 CSS enriquecido:', enhancedCSS.length, 'caracteres');

      // Phase 5: Production Agent (Quality Control)
      this.state.coordinationProgress = {
        stage: 'Control de Calidad y Optimización',
        progress: 85,
        currentAgent: 'Production Agent'
      };
      this.emitStateChange();
      this.callbacks.onProgress('Analizando calidad y optimizando código final...', 85);

      console.log('🔍 Iniciando Production Agent (Control de Calidad)...');
      const { finalHTML, finalCSS, finalJS, qualityReport } = await this.performQualityControl(plan, enhancedHTML, enhancedCSS, jsContent);
      console.log('🔍 Análisis de calidad completado');
      console.log('🔍 Reporte de calidad:', qualityReport);

      // Phase 6: Final Integration
      this.state.coordinationProgress = {
        stage: 'Integración Final',
        progress: 100,
        currentAgent: 'Coordinator'
      };
      this.emitStateChange();
      this.callbacks.onProgress('Integrando archivos finales...', 100);

      const files = [
        { name: 'index.html', content: finalHTML, type: 'html' },
        { name: 'styles.css', content: finalCSS, type: 'css' },
        { name: 'script.js', content: finalJS, type: 'javascript' }
      ];

      console.log('📁 Archivos generados:');
      files.forEach(file => {
        console.log(`📄 ${file.name}: ${file.content.length} caracteres`);
        console.log(`📄 ${file.name} preview:`, file.content.substring(0, 100) + '...');
      });

      // Guardar archivos generados en el estado para la vista previa
      this.state.generatedFiles = {
        html: finalHTML,
        css: finalCSS,
        js: finalJS
      };

      this.state.currentPhase = 'completed';
      this.state.isProcessing = false;
      this.state.coordinationProgress = undefined;
      this.emitStateChange();
      this.callbacks.onComplete(files);

    } catch (error) {
      this.state.isProcessing = false;
      this.state.error = error instanceof Error ? error.message : 'Error en coordinación de agentes';
      this.emitStateChange();
      this.callbacks.onError(this.state.error);
    }
  }

  private async generateCSSWithDesignAgent(plan: WebPagePlan): Promise<string> {
    console.log('🎨 Design Architect Agent - Intentando generar CSS...');

    try {
      const designPrompt = `
Como Design Architect Agent especializado, crea un archivo CSS COMPLETO y FUNCIONAL basado en este plan:

PROYECTO: ${plan.title}
DESCRIPCIÓN: ${plan.description}
DISEÑO ESPECIFICADO: ${JSON.stringify(plan.design, null, 2)}
ESTRUCTURA DE SECCIONES: ${JSON.stringify(plan.structure, null, 2)}

INSTRUCCIONES CRÍTICAS:
1. Genera CSS COMPLETO que funcione inmediatamente
2. Incluye TODOS los estilos necesarios para cada sección del plan
3. Crea un sistema de diseño cohesivo y profesional apropiado para "${plan.title}"
4. Implementa colores y tipografía específicos para el tipo de proyecto
5. Diseña layouts responsive con Grid y Flexbox
6. Añade animaciones y transiciones suaves
7. Implementa hover effects y micro-interacciones
8. Optimiza para rendimiento y accesibilidad
9. ASEGÚRATE de que los estilos sean VISIBLES y CONTRASTANTES

ESTRUCTURA CSS REQUERIDA (CLASES ESPECÍFICAS):
:root {
  /* Variables CSS para colores específicos del proyecto */
  --primary-color: /* Color principal apropiado para ${plan.title} */;
  --secondary-color: /* Color secundario */;
  --accent-color: /* Color de acento */;
  --text-color: /* Color de texto legible */;
  --bg-color: /* Color de fondo */;
  --font-primary: /* Fuente principal */;
  --font-secondary: /* Fuente secundaria */;
}

CLASES CSS OBLIGATORIAS:
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.header { /* Estilos para encabezado */ }
.nav { /* Estilos para navegación */ }
.hero { /* Estilos para sección principal con colores visibles */ }
.section { /* Estilos para secciones generales */ }
.footer { /* Estilos para pie de página */ }
.grid { /* Sistema de grillas responsive */ }
.card { /* Tarjetas con sombras y efectos */ }
.button { /* Botones con colores contrastantes */ }
.form-control { /* Controles de formulario */ }
.fade-in { /* Animación de entrada */ }

ESPECIFICACIONES TÉCNICAS:
- Mobile-first approach
- Usar flexbox y CSS Grid
- Variables CSS para consistencia
- Transiciones suaves (0.3s ease)
- Box-shadow para profundidad
- Border-radius para modernidad
- Tipografía escalable (rem/em)
- Colores accesibles (contraste WCAG)

ESPECIFICACIONES TÉCNICAS OBLIGATORIAS:
- Colores contrastantes y visibles (NO usar solo blancos/grises)
- Backgrounds con colores sólidos o gradientes
- Tipografía legible con tamaños apropiados
- Espaciado generoso entre elementos
- Sombras y efectos visuales para profundidad
- Hover effects llamativos
- Responsive design completo

GENERA UN ARCHIVO CSS COMPLETO DE MÍNIMO 200 LÍNEAS que haga que la página se vea PROFESIONAL, COLORIDA y ATRACTIVA.

IMPORTANTE: Los estilos deben ser VISIBLES y CONTRASTANTES, no sutiles.

Responde ÚNICAMENTE con el código CSS completo, sin explicaciones ni comentarios adicionales.
`;

      console.log('🎨 Intentando llamada a API para CSS...');

      // Usar EnhancedAPIService como en Constructor
      const response = await this.apiService.sendMessage(designPrompt, {
        agentName: 'DesignArchitectAgent',
        maxTokens: 4096,
        temperature: 0.7,
        systemPrompt: 'Eres un diseñador web experto especializado en CSS moderno y responsive.'
      });

      if (!response.success || !response.data) {
        throw new Error(`Error al generar CSS: ${response.error}`);
      }

      console.log('🎨 API respondió exitosamente para CSS');

      // Usar extracción robusta de código
      const cssContent = this.extractCodeContent(response.data, 'css');
      console.log(`🎨 CSS extraído: ${cssContent.length} caracteres`);

      return cssContent;
    } catch (error) {
      console.error('🎨 Error generating CSS with Design Agent:', error);
      console.log('🎨 Usando fallback CSS profesional...');
      // Fallback CSS
      return this.generateFallbackCSS(plan);
    }
  }

  private async generateHTMLWithCodeAgent(plan: WebPagePlan): Promise<string> {
    console.log('🏗️ Code Constructor Agent - Intentando generar HTML...');

    try {
      const codePrompt = `
Como Code Constructor Agent especializado, crea un archivo HTML COMPLETO y FUNCIONAL basado en este plan:

PROYECTO: ${plan.title}
DESCRIPCIÓN: ${plan.description}
ESTRUCTURA REQUERIDA: ${JSON.stringify(plan.structure, null, 2)}
FUNCIONALIDADES: ${plan.functionality.join(', ')}

INSTRUCCIONES CRÍTICAS:
1. Genera HTML COMPLETO que funcione inmediatamente
2. Incluye CONTENIDO REAL Y PROFESIONAL (NO lorem ipsum)
3. Implementa TODAS las secciones especificadas en el plan
4. Crea estructura HTML5 semántica y accesible
5. USA LAS CLASES CSS EXACTAS que se generaron en el CSS
6. Configura meta tags completos para SEO
7. Incluye atributos de accesibilidad (ARIA, alt, etc.)
8. Prepara estructura para funcionalidades JavaScript

CLASES CSS DISPONIBLES (USAR EXACTAMENTE ESTAS):
- .container (contenedor principal)
- .header (encabezado)
- .nav (navegación)
- .hero (sección principal)
- .section (secciones generales)
- .footer (pie de página)
- .grid (sistema de grillas)
- .card (tarjetas)
- .button (botones)
- .form-control (controles de formulario)
- .fade-in (animación de entrada)

ESTRUCTURA HTML REQUERIDA (USAR CLASES CSS EXACTAS):
<header class="header">
  <div class="container">
    <nav class="nav">
      <!-- Navegación con clases CSS -->
    </nav>
  </div>
</header>

<main>
  <section class="hero">
    <div class="container">
      <!-- Contenido hero con clases CSS -->
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="grid">
        <div class="card">
          <!-- Contenido con clases CSS -->
        </div>
      </div>
    </div>
  </section>
</main>

<footer class="footer">
  <div class="container">
    <!-- Footer con clases CSS -->
  </footer>
</footer>

IMPORTANTE: SIEMPRE usar las clases CSS (.container, .header, .nav, .hero, .section, .footer, .grid, .card, .button, .form-control)

CONTENIDO ESPECÍFICO PARA CADA SECCIÓN:
${plan.structure.map(section => `
- SECCIÓN "${section.section}":
  * Título: ${section.section}
  * Descripción: ${section.description}
  * Contenido específico: ${section.content.join(', ')}
  * Debe incluir contenido real y profesional relacionado con "${plan.title}"
`).join('')}

REQUISITOS DE CONTENIDO:
- Títulos descriptivos y profesionales
- Párrafos con contenido real relacionado con el proyecto
- Listas, enlaces, botones funcionales
- Formularios con campos apropiados
- Imágenes con alt text descriptivo
- Navegación entre secciones
- Call-to-action relevantes
- Información de contacto real

ESPECIFICACIONES TÉCNICAS:
- HTML5 semántico (header, nav, main, section, article, aside, footer)
- Meta tags completos (viewport, description, keywords, author)
- Atributos ARIA para accesibilidad
- IDs únicos para navegación
- Classes CSS apropiadas
- Estructura preparada para JavaScript
- Enlaces relativos a archivos CSS y JS

EJEMPLO DE ESTRUCTURA OBLIGATORIA:
<header class="header">
  <div class="container">
    <nav class="nav">
      <h1>Logo/Título</h1>
      <ul>
        <li><a href="#inicio" class="button">Inicio</a></li>
        <li><a href="#productos" class="button">Productos</a></li>
      </ul>
    </nav>
  </div>
</header>

<main>
  <section class="hero">
    <div class="container">
      <h1>Título Principal</h1>
      <p>Descripción atractiva</p>
      <a href="#contacto" class="button">Botón Principal</a>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <h2>Sección de Contenido</h2>
      <div class="grid">
        <div class="card">
          <h3>Elemento 1</h3>
          <p>Contenido específico</p>
        </div>
      </div>
    </div>
  </section>
</main>

<footer class="footer">
  <div class="container">
    <p>Información de contacto</p>
  </div>
</footer>

GENERA UN ARCHIVO HTML COMPLETO DE MÍNIMO 150 LÍNEAS usando EXACTAMENTE estas clases CSS.

CRÍTICO: SIEMPRE usar class="container", class="header", class="nav", class="hero", class="section", class="footer", class="grid", class="card", class="button"

Responde ÚNICAMENTE con el código HTML completo, sin explicaciones ni comentarios adicionales.
`;

      console.log('🏗️ Intentando llamada a API para HTML...');

      // Usar EnhancedAPIService como en Constructor
      const response = await this.apiService.sendMessage(codePrompt, {
        agentName: 'CodeConstructorAgent',
        maxTokens: 4096,
        temperature: 0.7,
        systemPrompt: 'Eres un desarrollador web experto especializado en HTML5 semántico y accesible.'
      });

      if (!response.success || !response.data) {
        throw new Error(`Error al generar HTML: ${response.error}`);
      }

      console.log('🏗️ API respondió exitosamente para HTML');

      // Usar extracción robusta de código
      const htmlContent = this.extractCodeContent(response.data, 'html');
      console.log(`🏗️ HTML extraído: ${htmlContent.length} caracteres`);

      return htmlContent;
    } catch (error) {
      console.error('🏗️ Error generating HTML with Code Agent:', error);
      console.log('🏗️ Usando fallback HTML profesional...');
      // Fallback HTML
      return this.generateFallbackHTML(plan);
    }
  }

  private async generateHTML(plan: WebPagePlan): Promise<string> {
    const htmlPrompt = `
Genera un archivo HTML completo y profesional basado en el siguiente plan:

TÍTULO: ${plan.title}
DESCRIPCIÓN: ${plan.description}
ESTRUCTURA: ${JSON.stringify(plan.structure, null, 2)}
DISEÑO: ${JSON.stringify(plan.design, null, 2)}
FUNCIONALIDADES: ${plan.functionality.join(', ')}

Requisitos:
1. HTML5 semántico y accesible
2. Meta tags completos para SEO
3. Estructura responsive
4. Enlaces a styles.css y script.js
5. Contenido real y profesional (no lorem ipsum)
6. Atributos alt en imágenes
7. Estructura clara con header, main, sections y footer

Responde SOLO con el código HTML, sin explicaciones.
`;

    const response = await tryWithFallback(htmlPrompt, 'Claude 3.5 Sonnet V2');
    return response.content.trim();
  }

  private async generateCSS(plan: WebPagePlan): Promise<string> {
    const cssPrompt = `
Genera un archivo CSS completo y profesional basado en el siguiente plan:

TÍTULO: ${plan.title}
DESCRIPCIÓN: ${plan.description}
DISEÑO: ${JSON.stringify(plan.design, null, 2)}
ESTRUCTURA: ${JSON.stringify(plan.structure, null, 2)}

Requisitos:
1. CSS moderno con variables CSS
2. Diseño completamente responsive (mobile-first)
3. Animaciones y transiciones suaves
4. Tipografía profesional
5. Esquema de colores coherente
6. Grid y Flexbox para layouts
7. Hover effects y micro-interacciones
8. Optimizado para rendimiento

Responde SOLO con el código CSS, sin explicaciones.
`;

    const response = await tryWithFallback(cssPrompt, 'Claude 3.5 Sonnet V2');
    return response.content.trim();
  }

  private async generateJavaScript(plan: WebPagePlan): Promise<string> {
    console.log('⚡ JavaScript Agent - Intentando generar JS...');

    try {
      const jsPrompt = `
Como JavaScript Agent especializado, crea un archivo JavaScript COMPLETO y FUNCIONAL basado en este plan:

PROYECTO: ${plan.title}
FUNCIONALIDADES REQUERIDAS: ${plan.functionality.join(', ')}
ESTRUCTURA DE SECCIONES: ${JSON.stringify(plan.structure, null, 2)}

INSTRUCCIONES CRÍTICAS:
1. Genera JavaScript COMPLETO que funcione inmediatamente
2. Implementa TODAS las funcionalidades especificadas
3. Crea interactividad real y profesional
4. Usa JavaScript vanilla moderno (ES6+)
5. Incluye manejo de eventos y animaciones
6. Optimiza para rendimiento y experiencia de usuario

FUNCIONALIDADES OBLIGATORIAS:
1. DOMContentLoaded event listener principal
2. Navegación suave entre secciones (smooth scroll)
3. Menu responsive toggle (hamburger menu)
4. Animaciones al scroll (Intersection Observer)
5. Formularios funcionales con validación
6. Efectos hover y interacciones
7. Lazy loading de imágenes
8. Manejo de errores y fallbacks

ESTRUCTURA JAVASCRIPT REQUERIDA:
- Event listener principal DOMContentLoaded
- Funciones para navegación suave
- Sistema de animaciones al scroll
- Manejo de formularios
- Efectos interactivos
- Utilidades y helpers
- Inicialización de componentes

ESPECIFICACIONES TÉCNICAS:
- ES6+ syntax (const, let, arrow functions)
- Intersection Observer API para animaciones
- Event delegation para performance
- Debouncing para scroll events
- Error handling con try-catch
- Console logs informativos
- Código modular y reutilizable

FUNCIONALIDADES ESPECÍFICAS PARA ESTE PROYECTO:
${plan.structure.map(section => `
- Funcionalidad para sección "${section.section}":
  * Animación de entrada
  * Interactividad específica
  * Navegación hacia esta sección
`).join('')}

GENERA UN ARCHIVO JAVASCRIPT COMPLETO DE MÍNIMO 100 LÍNEAS con funcionalidad real e interactividad profesional.

Responde ÚNICAMENTE con el código JavaScript completo, sin explicaciones ni comentarios adicionales.
`;

      console.log('⚡ Intentando llamada a API para JavaScript...');

      // Usar EnhancedAPIService como en Constructor
      const response = await this.apiService.sendMessage(jsPrompt, {
        agentName: 'JavaScriptAgent',
        maxTokens: 4096,
        temperature: 0.7,
        systemPrompt: 'Eres un desarrollador JavaScript experto especializado en vanilla JS moderno e interactividad web.'
      });

      if (!response.success || !response.data) {
        throw new Error(`Error al generar JavaScript: ${response.error}`);
      }

      console.log('⚡ API respondió exitosamente para JavaScript');

      // Usar extracción robusta de código
      const jsContent = this.extractCodeContent(response.data, 'js');
      console.log(`⚡ JavaScript extraído: ${jsContent.length} caracteres`);

      return jsContent;
    } catch (error) {
      console.error('⚡ Error generating JavaScript:', error);
      console.log('⚡ Usando fallback JavaScript profesional...');
      // Fallback JavaScript
      return this.generateFallbackJS(plan);
    }
  }

  /**
   * GIFT Agent (Graphics, Icons, Features & Transitions)
   * Enriquece el HTML y CSS con elementos visuales, iconos SVG, animaciones y efectos
   */
  private async generateVisualEnhancements(plan: WebPagePlan, htmlContent: string, cssContent: string): Promise<{ enhancedHTML: string, enhancedCSS: string }> {
    console.log('🎨 GIFT Agent - Iniciando enriquecimiento visual...');

    try {
      // Prompt para el GIFT Agent
      const giftPrompt = `
Como GIFT Agent (Graphics, Icons, Features & Transitions) especializado, enriquece el HTML y CSS existente con elementos visuales profesionales:

PROYECTO: ${plan.title}
DESCRIPCIÓN: ${plan.description}
ESTRUCTURA: ${JSON.stringify(plan.structure, null, 2)}

HTML ACTUAL:
${htmlContent}

CSS ACTUAL:
${cssContent}

RESPONSABILIDADES DEL GIFT AGENT:

1. **ICONOS SVG PERSONALIZADOS**:
   - Crear iconos SVG inline coherentes con el diseño
   - Iconos para navegación, características, servicios
   - Iconos decorativos apropiados para "${plan.title}"
   - SVG optimizados y accesibles

2. **ELEMENTOS GRÁFICOS**:
   - Ilustraciones SVG simples y elegantes
   - Elementos decorativos (líneas, formas, patrones)
   - Gráficos que complementen el contenido

3. **ANIMACIONES CSS AVANZADAS**:
   - Keyframes para animaciones personalizadas
   - Transiciones suaves y profesionales
   - Micro-interacciones en hover/focus
   - Animaciones de entrada (fade-in, slide-in, scale)

4. **EFECTOS VISUALES**:
   - Gradientes modernos y atractivos
   - Sombras con profundidad
   - Efectos de hover llamativos
   - Elementos decorativos con CSS

5. **EMOJIS Y SÍMBOLOS**:
   - Emojis apropiados para el contexto
   - Símbolos Unicode decorativos
   - Posicionamiento estratégico

INSTRUCCIONES ESPECÍFICAS:

**PARA HTML ENRIQUECIDO**:
- Insertar iconos SVG inline donde sea apropiado
- Agregar emojis contextuales en títulos y contenido
- Mantener estructura semántica existente
- Agregar clases para nuevas animaciones

**PARA CSS ENRIQUECIDO**:
- Agregar nuevas animaciones @keyframes
- Crear efectos hover avanzados
- Implementar gradientes y sombras
- Añadir transiciones suaves
- Mantener responsive design

EJEMPLOS DE ICONOS SVG REQUERIDOS:
- Icono de menú hamburguesa
- Iconos de navegación (home, about, contact)
- Iconos de características/servicios
- Iconos de redes sociales
- Iconos decorativos

EJEMPLOS DE ANIMACIONES:
- fadeInUp, slideInLeft, scaleIn
- Hover effects para botones y cards
- Animaciones de loading/spinner
- Parallax effects sutiles

ESPECIFICACIONES TÉCNICAS:
- SVG inline optimizados (viewBox, sin dimensiones fijas)
- Animaciones CSS puras (sin JavaScript)
- Performance optimizado
- Accesibilidad mantenida
- Responsive en todos los elementos

FORMATO DE RESPUESTA:
Responde con un JSON válido con esta estructura exacta:
{
  "enhancedHTML": "HTML completo con iconos SVG y emojis insertados",
  "enhancedCSS": "CSS completo con nuevas animaciones y efectos visuales"
}

IMPORTANTE:
- Mantén TODO el contenido HTML y CSS existente
- SOLO agrega elementos visuales y mejoras
- Los iconos SVG deben ser inline, no referencias externas
- Las animaciones deben ser suaves y profesionales
- Asegúrate de que el JSON sea válido

Responde ÚNICAMENTE con el JSON, sin explicaciones adicionales.
`;

      console.log('🎨 Enviando prompt al GIFT Agent...');

      const response = await this.apiService.sendMessage(giftPrompt, {
        agentName: 'GIFTAgent',
        maxTokens: 6144,
        temperature: 0.8,
        systemPrompt: 'Eres un especialista en elementos visuales, iconos SVG, animaciones CSS y efectos gráficos para web.'
      });

      if (!response.success || !response.data) {
        throw new Error(`Error al generar enriquecimiento visual: ${response.error}`);
      }

      console.log('🎨 GIFT Agent respondió exitosamente');

      // Intentar parsear la respuesta JSON
      let enhancedContent;
      try {
        // Limpiar la respuesta para extraer solo el JSON
        const cleanResponse = response.data.trim();
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          enhancedContent = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No se encontró JSON válido en la respuesta');
        }
      } catch (parseError) {
        console.warn('🎨 Error parseando JSON del GIFT Agent, usando contenido original:', parseError);
        return {
          enhancedHTML: htmlContent,
          enhancedCSS: cssContent
        };
      }

      // Validar que el contenido enriquecido existe
      if (!enhancedContent.enhancedHTML || !enhancedContent.enhancedCSS) {
        console.warn('🎨 Contenido enriquecido incompleto, usando original');
        return {
          enhancedHTML: htmlContent,
          enhancedCSS: cssContent
        };
      }

      console.log('🎨 Enriquecimiento visual completado exitosamente');
      console.log(`🎨 HTML enriquecido: ${enhancedContent.enhancedHTML.length} caracteres`);
      console.log(`🎨 CSS enriquecido: ${enhancedContent.enhancedCSS.length} caracteres`);

      return {
        enhancedHTML: enhancedContent.enhancedHTML,
        enhancedCSS: enhancedContent.enhancedCSS
      };

    } catch (error) {
      console.error('🎨 Error en GIFT Agent:', error);
      console.log('🎨 Usando contenido original sin enriquecimiento');

      // Fallback: devolver contenido original
      return {
        enhancedHTML: htmlContent,
        enhancedCSS: cssContent
      };
    }
  }

  /**
   * Production Agent - Control de Calidad y Optimización Final
   * Analiza la página web generada para detectar problemas y aplicar optimizaciones
   */
  private async performQualityControl(
    plan: WebPagePlan,
    htmlContent: string,
    cssContent: string,
    jsContent: string
  ): Promise<{ finalHTML: string, finalCSS: string, finalJS: string, qualityReport: string }> {
    console.log('🔍 Production Agent - Iniciando control de calidad...');

    try {
      // Validar contenido de entrada
      if (!htmlContent || !cssContent || !jsContent) {
        console.warn('🔍 Contenido de entrada incompleto detectado');
        console.log(`🔍 HTML: ${htmlContent?.length || 0} chars, CSS: ${cssContent?.length || 0} chars, JS: ${jsContent?.length || 0} chars`);
      }

      // Prompt optimizado para el Production Agent
      const productionPrompt = `
Como Production Agent especializado en control de calidad web, analiza y optimiza los archivos finales de la página web.

PROYECTO: ${plan.title}
DESCRIPCIÓN: ${plan.description}

ARCHIVOS A ANALIZAR:

HTML ACTUAL (${htmlContent.length} caracteres):
${htmlContent}

CSS ACTUAL (${cssContent.length} caracteres):
${cssContent}

JAVASCRIPT ACTUAL (${jsContent.length} caracteres):
${jsContent}

TAREAS DE CONTROL DE CALIDAD:

1. **VALIDACIÓN ESTRUCTURAL**:
   - Verificar HTML semántico y válido
   - Asegurar estructura DOCTYPE correcta (sin duplicados)
   - Validar etiquetas cerradas correctamente
   - Comprobar meta tags esenciales

2. **OPTIMIZACIÓN DE CÓDIGO**:
   - Limpiar código redundante o innecesario
   - Optimizar selectores CSS
   - Mejorar eficiencia de JavaScript
   - Eliminar comentarios de desarrollo

3. **MEJORAS DE RENDIMIENTO**:
   - Optimizar carga de recursos
   - Minimizar reflows y repaints
   - Mejorar tiempo de carga
   - Aplicar lazy loading donde sea apropiado

4. **ACCESIBILIDAD Y UX**:
   - Añadir atributos ARIA necesarios
   - Verificar contraste de colores
   - Asegurar navegación por teclado
   - Mejorar experiencia móvil

FORMATO DE RESPUESTA OBLIGATORIO:

REPORTE_CALIDAD:
[Descripción detallada de problemas encontrados y correcciones aplicadas]

HTML_OPTIMIZADO:
\`\`\`html
[Código HTML completo corregido y optimizado - DEBE incluir DOCTYPE, html, head y body completos]
\`\`\`

CSS_OPTIMIZADO:
\`\`\`css
[Código CSS completo corregido y optimizado - DEBE incluir todos los estilos necesarios]
\`\`\`

JS_OPTIMIZADO:
\`\`\`javascript
[Código JavaScript completo corregido y optimizado - DEBE incluir toda la funcionalidad]
\`\`\`

REGLAS CRÍTICAS:
- NUNCA truncar o cortar código a la mitad
- MANTENER toda la funcionalidad existente
- ASEGURAR que cada sección de código esté COMPLETA
- NO duplicar DOCTYPE o etiquetas HTML
- PRESERVAR toda la estructura y contenido
- SOLO optimizar y mejorar, NUNCA eliminar características

Responde EXACTAMENTE con el formato especificado arriba.
`;

      console.log('🔍 Enviando análisis a Production Agent...');

      // Usar configuración distribuida para Production Agent
      const agentConfig = getDistributedAgentConfig('ProductionAgent');
      console.log(`🔍 Usando configuración: ${agentConfig.model.id} con ${agentConfig.maxTokens} tokens`);

      const response = await this.apiService.sendMessage(productionPrompt, {
        agentName: 'ProductionAgent',
        maxTokens: agentConfig.maxTokens,
        temperature: agentConfig.temperature,
        systemPrompt: 'Eres un experto en control de calidad web. Tu trabajo es optimizar código sin truncarlo ni eliminarlo. SIEMPRE devuelve código completo y funcional.'
      });

      if (!response.success || !response.data) {
        throw new Error(`Error en Production Agent: ${response.error}`);
      }

      console.log('🔍 Production Agent respondió exitosamente');
      console.log(`🔍 Respuesta recibida: ${response.data.length} caracteres`);

      // Extraer el reporte de calidad y los archivos optimizados con patrones mejorados
      const responseContent = response.data;

      // Extraer reporte de calidad con patrón más robusto
      const reportMatch = responseContent.match(/REPORTE_CALIDAD:\s*([\s\S]*?)(?=HTML_OPTIMIZADO:|$)/i);
      const qualityReport = reportMatch ? reportMatch[1].trim() : 'Análisis de calidad completado';

      // Extraer HTML optimizado con múltiples patrones de fallback
      let finalHTML = this.extractCodeWithFallback(responseContent, 'html', htmlContent);

      // Extraer CSS optimizado con múltiples patrones de fallback
      let finalCSS = this.extractCodeWithFallback(responseContent, 'css', cssContent);

      // Extraer JavaScript optimizado con múltiples patrones de fallback
      let finalJS = this.extractCodeWithFallback(responseContent, 'javascript', jsContent);

      // Validación de integridad del código extraído
      const validationResults = this.validateExtractedCode(finalHTML, finalCSS, finalJS, htmlContent, cssContent, jsContent);

      if (!validationResults.isValid) {
        console.warn('🔍 Código extraído no válido, usando archivos originales');
        console.log('🔍 Problemas detectados:', validationResults.issues);
        finalHTML = htmlContent;
        finalCSS = cssContent;
        finalJS = jsContent;
      }

      // Limpiar duplicados de DOCTYPE si existen
      finalHTML = this.cleanDuplicateDoctype(finalHTML);

      console.log('🔍 Archivos optimizados extraídos exitosamente');
      console.log(`🔍 HTML final: ${finalHTML.length} caracteres`);
      console.log(`🔍 CSS final: ${finalCSS.length} caracteres`);
      console.log(`🔍 JS final: ${finalJS.length} caracteres`);

      return {
        finalHTML: finalHTML || htmlContent,
        finalCSS: finalCSS || cssContent,
        finalJS: finalJS || jsContent,
        qualityReport: qualityReport
      };

    } catch (error) {
      console.error('🔍 Error en Production Agent:', error);
      console.log('🔍 Usando archivos originales sin optimización');

      // Fallback: devolver archivos originales
      return {
        finalHTML: htmlContent,
        finalCSS: cssContent,
        finalJS: jsContent,
        qualityReport: `Control de calidad omitido debido a error técnico: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * Extrae código con múltiples patrones de fallback para mayor robustez
   */
  private extractCodeWithFallback(responseContent: string, codeType: string, fallbackContent: string): string {
    const patterns = [
      // Patrón principal con tipo específico
      new RegExp(`${codeType.toUpperCase()}_OPTIMIZADO:\\s*\`\`\`${codeType}\\s*([\\s\\S]*?)\\s*\`\`\``, 'i'),
      // Patrón sin tipo específico
      new RegExp(`${codeType.toUpperCase()}_OPTIMIZADO:\\s*\`\`\`\\s*([\\s\\S]*?)\\s*\`\`\``, 'i'),
      // Patrón genérico con tipo
      new RegExp(`\`\`\`${codeType}\\s*([\\s\\S]*?)\\s*\`\`\``, 'i'),
      // Patrón más flexible
      new RegExp(`${codeType.toUpperCase()}[^:]*:\\s*\`\`\`[^\\n]*\\n([\\s\\S]*?)\\n\`\`\``, 'i')
    ];

    for (const pattern of patterns) {
      const match = responseContent.match(pattern);
      if (match && match[1] && match[1].trim()) {
        const extractedCode = match[1].trim();
        console.log(`🔍 Código ${codeType} extraído exitosamente con patrón: ${pattern.source.substring(0, 50)}...`);
        return extractedCode;
      }
    }

    console.warn(`🔍 No se pudo extraer código ${codeType}, usando contenido original`);
    return fallbackContent;
  }

  /**
   * Valida la integridad del código extraído
   */
  private validateExtractedCode(
    html: string,
    css: string,
    js: string,
    originalHtml: string,
    originalCss: string,
    originalJs: string
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Validar HTML
    if (!html || html.length < 50) {
      issues.push('HTML demasiado corto o vacío');
    } else if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
      issues.push('HTML no contiene estructura básica');
    } else if (html.length < originalHtml.length * 0.5) {
      issues.push('HTML significativamente más corto que el original');
    }

    // Validar CSS
    if (!css || css.length < 20) {
      issues.push('CSS demasiado corto o vacío');
    } else if (css.length < originalCss.length * 0.3) {
      issues.push('CSS significativamente más corto que el original');
    }

    // Validar JavaScript
    if (!js || js.length < 10) {
      issues.push('JavaScript demasiado corto o vacío');
    } else if (js.length < originalJs.length * 0.3) {
      issues.push('JavaScript significativamente más corto que el original');
    }

    // Verificar truncación
    if (html.endsWith('...') || css.endsWith('...') || js.endsWith('...')) {
      issues.push('Código aparenta estar truncado (termina en ...)');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Limpia DOCTYPE duplicados del HTML
   */
  private cleanDuplicateDoctype(html: string): string {
    // Contar ocurrencias de DOCTYPE
    const doctypeMatches = html.match(/<!DOCTYPE[^>]*>/gi);

    if (doctypeMatches && doctypeMatches.length > 1) {
      console.log('🔍 DOCTYPE duplicado detectado, limpiando...');
      // Mantener solo el primer DOCTYPE
      let cleanedHtml = html;
      for (let i = 1; i < doctypeMatches.length; i++) {
        cleanedHtml = cleanedHtml.replace(doctypeMatches[i], '');
      }
      return cleanedHtml.trim();
    }

    return html;
  }

  /**
   * Genera una mejora básica del prompt cuando falla la IA
   */
  private generateBasicEnhancement(originalInstruction: string): string {
    if (!originalInstruction || originalInstruction.trim().length < 5) {
      return originalInstruction;
    }

    const instruction = originalInstruction.trim().toLowerCase();

    // Detectar tipo de proyecto
    let projectType = 'sitio web';
    let enhancements: string[] = [];

    if (instruction.includes('restaurante') || instruction.includes('comida') || instruction.includes('cocina')) {
      projectType = 'restaurante';
      enhancements = [
        'menú digital interactivo con categorías de platos',
        'galería de fotos de comida y ambiente',
        'sistema de reservas online',
        'información del chef y historia del restaurante',
        'testimonios de clientes',
        'horarios y ubicación con mapa',
        'diseño cálido que refleje la identidad gastronómica'
      ];
    } else if (instruction.includes('tienda') || instruction.includes('shop') || instruction.includes('venta')) {
      projectType = 'tienda online';
      enhancements = [
        'catálogo de productos con filtros de búsqueda',
        'carrito de compras y proceso de checkout',
        'galería de imágenes de productos',
        'sistema de reseñas y valoraciones',
        'información de envíos y devoluciones',
        'testimonios de clientes',
        'diseño moderno que inspire confianza en las compras'
      ];
    } else if (instruction.includes('empresa') || instruction.includes('negocio') || instruction.includes('corporat')) {
      projectType = 'empresa';
      enhancements = [
        'sección sobre nosotros con historia y valores',
        'servicios detallados con descripciones',
        'equipo de trabajo con perfiles profesionales',
        'testimonios y casos de éxito',
        'formulario de contacto y cotizaciones',
        'blog o noticias de la industria',
        'diseño profesional que transmita credibilidad'
      ];
    } else if (instruction.includes('portfolio') || instruction.includes('portafolio') || instruction.includes('personal')) {
      projectType = 'portfolio personal';
      enhancements = [
        'galería de proyectos con descripciones detalladas',
        'sección sobre mí con experiencia profesional',
        'habilidades y tecnologías dominadas',
        'testimonios de clientes o empleadores',
        'blog personal o artículos técnicos',
        'formulario de contacto para oportunidades',
        'diseño creativo que refleje personalidad profesional'
      ];
    } else {
      // Mejora genérica
      enhancements = [
        'sección hero con llamada a la acción clara',
        'contenido organizado en secciones lógicas',
        'galería de imágenes relevantes',
        'testimonios o reseñas de usuarios',
        'información de contacto accesible',
        'diseño responsive para todos los dispositivos',
        'navegación intuitiva y fácil de usar'
      ];
    }

    const enhancedDescription = `Una página web profesional para ${projectType} que incluya:

• ${enhancements.join('\n• ')}

El diseño debe ser moderno, responsive y optimizado para la experiencia del usuario, con colores y tipografía apropiados para el sector. La página debe cargar rápidamente y ser fácil de navegar tanto en dispositivos móviles como de escritorio.

Funcionalidades técnicas: navegación suave, animaciones CSS sutiles, formularios funcionales, optimización SEO básica, y compatibilidad con navegadores modernos.`;

    return enhancedDescription;
  }

  public reset(): void {
    this.state = {
      currentPhase: 'input',
      userInstruction: '',
      isProcessing: false
    };
    this.emitStateChange();
  }

  private emitStateChange(): void {
    this.callbacks.onStateChange({ ...this.state });
  }

  /**
   * Extrae el contenido de código de la respuesta del modelo de IA (copiado de Constructor)
   * @param responseContent Contenido de la respuesta del modelo de IA
   * @param fileType Tipo de archivo (html, css, js)
   * @returns Contenido del código extraído
   */
  private extractCodeContent(responseContent: string, fileType: string): string {
    // Verificar que responseContent no sea undefined o null
    if (!responseContent) {
      console.warn(`extractCodeContent: responseContent es ${responseContent} para ${fileType}`);
      return this.generateDefaultContent(fileType);
    }

    // Intentar extraer el código del bloque de código
    const codeBlockRegex = new RegExp(`\`\`\`(?:${fileType})?\\s*([\\s\\S]*?)\\s*\`\`\``, 'i');
    const match = responseContent.match(codeBlockRegex);

    if (match && match[1] && match[1].trim()) {
      return match[1].trim();
    }

    // Si no hay bloque de código o está vacío, intentar usar todo el contenido
    const trimmedContent = responseContent.trim();
    if (trimmedContent) {
      return trimmedContent;
    }

    // Si todo lo anterior falla, generar un contenido por defecto
    console.warn(`No se pudo extraer contenido válido para ${fileType}, generando contenido por defecto`);
    return this.generateDefaultContent(fileType);
  }

  /**
   * Genera contenido por defecto cuando falla la extracción
   * @param fileType Tipo de archivo
   * @returns Contenido por defecto
   */
  private generateDefaultContent(fileType: string): string {
    switch (fileType.toLowerCase()) {
      case 'html':
        return this.generateFallbackHTML({ title: 'Página Web', description: 'Página generada automáticamente', structure: [], design: { colors: [], fonts: [], layout: '' }, functionality: [] });
      case 'css':
        return this.generateFallbackCSS({ title: 'Página Web', description: 'Página generada automáticamente', structure: [], design: { colors: [], fonts: [], layout: '' }, functionality: [] });
      case 'js':
      case 'javascript':
        return this.generateFallbackJS({ title: 'Página Web', description: 'Página generada automáticamente', structure: [], design: { colors: [], fonts: [], layout: '' }, functionality: [] });
      default:
        return `// Contenido por defecto para ${fileType}\nconsole.log('Archivo generado automáticamente');`;
    }
  }

  private generateFallbackCSS(plan: WebPagePlan): string {
    return `/* Professional CSS - ${plan.title} */
:root {
  --primary-color: #2563eb;
  --secondary-color: #1e40af;
  --accent-color: #f59e0b;
  --text-color: #1f2937;
  --text-light: #6b7280;
  --bg-color: #ffffff;
  --bg-light: #f8fafc;
  --border-color: #e5e7eb;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --border-radius: 8px;
  --transition: all 0.3s ease;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--bg-color);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header Styles */
.header {
  background: var(--bg-color);
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
}

.nav-list {
  display: flex;
  list-style: none;
  gap: 2rem;
}

.nav-link {
  text-decoration: none;
  color: var(--text-color);
  font-weight: 500;
  transition: var(--transition);
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
}

.nav-link:hover {
  color: var(--primary-color);
  background-color: var(--bg-light);
}

.nav-toggle {
  display: none;
  flex-direction: column;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.nav-toggle span {
  width: 25px;
  height: 3px;
  background: var(--text-color);
  margin: 3px 0;
  transition: var(--transition);
}

/* Hero Section */
.hero {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 6rem 0;
  text-align: center;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.hero-description {
  font-size: 1.25rem;
  margin-bottom: 2.5rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 2rem;
  border-radius: var(--border-radius);
  text-decoration: none;
  font-weight: 600;
  transition: var(--transition);
  border: 2px solid transparent;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary {
  background: var(--accent-color);
  color: white;
}

.btn-primary:hover {
  background: #d97706;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  background: transparent;
  color: white;
  border-color: white;
}

.btn-secondary:hover {
  background: white;
  color: var(--primary-color);
}

/* Sections */
.section {
  padding: 5rem 0;
}

.section:nth-child(even) {
  background-color: var(--bg-light);
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-title {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.section-description {
  font-size: 1.125rem;
  color: var(--text-light);
  max-width: 600px;
  margin: 0 auto;
}

/* Grid Layout */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

/* Cards */
.card {
  background: var(--bg-color);
  padding: 2rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  transition: var(--transition);
  text-align: center;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
}

.card-icon {
  width: 60px;
  height: 60px;
  background: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: white;
  font-size: 1.5rem;
}

.card h3 {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.card p {
  color: var(--text-light);
  margin-bottom: 1.5rem;
}

.card-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
  transition: var(--transition);
}

.card-link:hover {
  color: var(--secondary-color);
}

/* Contact Section */
.contact {
  background: var(--bg-light);
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  margin-top: 3rem;
}

.contact-info h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.contact-info p {
  margin-bottom: 0.5rem;
  color: var(--text-light);
}

/* Forms */
.contact-form {
  background: var(--bg-color);
  padding: 2rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 1rem;
  transition: var(--transition);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

/* Footer */
.footer {
  background: var(--text-color);
  color: white;
  padding: 3rem 0 1rem;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-section h3,
.footer-section h4 {
  margin-bottom: 1rem;
}

.footer-section ul {
  list-style: none;
}

.footer-section ul li {
  margin-bottom: 0.5rem;
}

.footer-section a {
  color: #d1d5db;
  text-decoration: none;
  transition: var(--transition);
}

.footer-section a:hover {
  color: white;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.footer-bottom {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid #374151;
  color: #9ca3af;
}

/* Responsive Design */
@media (max-width: 768px) {
  .nav-list {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg-color);
    flex-direction: column;
    padding: 1rem;
    box-shadow: var(--shadow);
  }

  .nav-list.active {
    display: flex;
  }

  .nav-toggle {
    display: flex;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .contact-content {
    grid-template-columns: 1fr;
  }

  .grid {
    grid-template-columns: 1fr;
  }

  .container {
    padding: 0 15px;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 4rem 0;
  }

  .hero-title {
    font-size: 2rem;
  }

  .section {
    padding: 3rem 0;
  }

  .section-title {
    font-size: 2rem;
  }
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

.animate-fade-in {
  animation: fadeInUp 0.6s ease-out;
}`;
  }

  private generateFallbackHTML(plan: WebPagePlan): string {
    const navigationItems = plan.structure.map(section =>
      `<li><a href="#${section.section.toLowerCase().replace(/\s+/g, '-')}">${section.section}</a></li>`
    ).join('');

    const sectionsHTML = plan.structure.map(section => {
      const sectionId = section.section.toLowerCase().replace(/\s+/g, '-');
      const contentCards = section.content.map(item => `
                    <div class="card">
                        <div class="card-icon">
                            <i class="icon-${item.toLowerCase().replace(/\s+/g, '-')}"></i>
                        </div>
                        <h3>${item}</h3>
                        <p>Descubre todo lo que necesitas saber sobre ${item.toLowerCase()}. Ofrecemos soluciones profesionales y personalizadas para satisfacer tus necesidades específicas.</p>
                        <a href="#contacto" class="card-link">Más información</a>
                    </div>
      `).join('');

      return `
        <section id="${sectionId}" class="section">
            <div class="container">
                <div class="section-header">
                    <h2 class="section-title">${section.section}</h2>
                    <p class="section-description">${section.description}</p>
                </div>
                <div class="grid">
                    ${contentCards}
                </div>
            </div>
        </section>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${plan.title} | Soluciones Profesionales</title>
    <meta name="description" content="${plan.description}">
    <meta name="keywords" content="${plan.title}, servicios profesionales, soluciones, calidad">
    <meta name="author" content="${plan.title}">
    <meta property="og:title" content="${plan.title}">
    <meta property="og:description" content="${plan.description}">
    <meta property="og:type" content="website">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <h1 class="logo-text">${plan.title}</h1>
                </div>
                <nav class="nav">
                    <button class="nav-toggle" aria-label="Abrir menú">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                    <ul class="nav-list">
                        <li><a href="#inicio" class="nav-link">Inicio</a></li>
                        ${navigationItems}
                        <li><a href="#contacto" class="nav-link">Contacto</a></li>
                    </ul>
                </nav>
            </div>
        </div>
    </header>

    <main class="main">
        <section id="inicio" class="hero">
            <div class="container">
                <div class="hero-content">
                    <h1 class="hero-title">${plan.title}</h1>
                    <p class="hero-description">${plan.description}</p>
                    <div class="hero-actions">
                        <a href="#${plan.structure[0]?.section.toLowerCase().replace(/\s+/g, '-') || 'servicios'}" class="btn btn-primary">Conocer Más</a>
                        <a href="#contacto" class="btn btn-secondary">Contactar</a>
                    </div>
                </div>
            </div>
        </section>

        ${sectionsHTML}

        <section id="contacto" class="contact">
            <div class="container">
                <div class="section-header">
                    <h2 class="section-title">Contacto</h2>
                    <p class="section-description">¿Listo para comenzar? Contáctanos y descubre cómo podemos ayudarte.</p>
                </div>
                <div class="contact-content">
                    <div class="contact-info">
                        <div class="contact-item">
                            <h3>Información de Contacto</h3>
                            <p>📧 info@${plan.title.toLowerCase().replace(/\s+/g, '')}.com</p>
                            <p>📞 +1 (555) 123-4567</p>
                            <p>📍 Ciudad, País</p>
                        </div>
                    </div>
                    <form class="contact-form">
                        <div class="form-group">
                            <label for="name">Nombre completo</label>
                            <input type="text" id="name" name="name" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Correo electrónico</label>
                            <input type="email" id="email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="message">Mensaje</label>
                            <textarea id="message" name="message" rows="5" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Enviar Mensaje</button>
                    </form>
                </div>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>${plan.title}</h3>
                    <p>Comprometidos con la excelencia y la satisfacción de nuestros clientes.</p>
                </div>
                <div class="footer-section">
                    <h4>Enlaces Rápidos</h4>
                    <ul>
                        ${navigationItems}
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Síguenos</h4>
                    <div class="social-links">
                        <a href="#" aria-label="Facebook">Facebook</a>
                        <a href="#" aria-label="Twitter">Twitter</a>
                        <a href="#" aria-label="LinkedIn">LinkedIn</a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 ${plan.title}. Todos los derechos reservados.</p>
            </div>
        </div>
    </footer>

    <script src="script.js"></script>
</body>
</html>`;
  }

  private generateFallbackJS(plan: WebPagePlan): string {
    return `// Professional JavaScript for ${plan.title}
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 ${plan.title} - Página cargada exitosamente');

    // ===== NAVIGATION SYSTEM =====
    const navToggle = document.querySelector('.nav-toggle');
    const navList = document.querySelector('.nav-list');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    if (navToggle && navList) {
        navToggle.addEventListener('click', function() {
            navList.classList.toggle('active');
            this.classList.toggle('active');
        });

        // Close menu when clicking on a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navList.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }

    // Smooth scrolling for navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ===== SCROLL ANIMATIONS =====
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const scrollObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.card, .section-header, .hero-content');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        scrollObserver.observe(el);
    });

    // ===== INTERACTIVE EFFECTS =====

    // Enhanced button interactions
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
            this.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
        });

        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '';
        });

        btn.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(-1px) scale(1.02)';
        });

        btn.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
        });
    });

    // Enhanced card interactions
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
            this.style.boxShadow = '0 15px 35px rgba(0,0,0,0.1)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        });
    });

    // ===== FORM HANDLING =====
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Get form data
            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            const message = formData.get('message');

            // Basic validation
            if (!name || !email || !message) {
                showNotification('Por favor, completa todos los campos', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showNotification('Por favor, ingresa un email válido', 'error');
                return;
            }

            // Simulate form submission
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;

            submitBtn.textContent = 'Enviando...';
            submitBtn.disabled = true;

            setTimeout(() => {
                showNotification('¡Mensaje enviado correctamente! Te contactaremos pronto.', 'success');
                this.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }

    // ===== UTILITY FUNCTIONS =====

    function isValidEmail(email) {
        const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
        return emailRegex.test(email);
    }

    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = \`notification notification-\${type}\`;
        notification.innerHTML = \`
            <div class="notification-content">
                <span class="notification-message">\${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        \`;

        // Add styles
        notification.style.cssText = \`
            position: fixed;
            top: 20px;
            right: 20px;
            background: \${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 400px;
        \`;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // ===== SCROLL EFFECTS =====

    let lastScrollTop = 0;
    const header = document.querySelector('.header');

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Header hide/show on scroll
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }

        lastScrollTop = scrollTop;
    });

    // ===== LAZY LOADING =====

    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        img.addEventListener('load', () => {
            img.style.opacity = '1';
        });
        imageObserver.observe(img);
    });

    // ===== PERFORMANCE OPTIMIZATION =====

    // Debounce function for scroll events
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ===== ACCESSIBILITY ENHANCEMENTS =====

    // Keyboard navigation for mobile menu
    if (navToggle) {
        navToggle.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    }

    // Focus management for modal-like behaviors
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close mobile menu if open
            if (navList && navList.classList.contains('active')) {
                navList.classList.remove('active');
                navToggle.classList.remove('active');
                navToggle.focus();
            }
        }
    });

    // ===== INITIALIZATION COMPLETE =====
    console.log('✅ Todas las funcionalidades JavaScript cargadas correctamente');
    console.log('📱 Navegación móvil:', navToggle ? 'Activada' : 'No requerida');
    console.log('🎨 Animaciones:', animatedElements.length, 'elementos animados');
    console.log('📝 Formularios:', contactForm ? 'Configurado' : 'No encontrado');

    // Dispatch custom event to indicate page is fully loaded
    window.dispatchEvent(new CustomEvent('pageFullyLoaded', {
        detail: { title: '${plan.title}', timestamp: new Date() }
    }));
});`;
  }
}
