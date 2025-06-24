import { EnhancedAPIService } from './EnhancedAPIService';
import { getDistributedAgentConfig } from '../config/claudeModels';
import { buildOptimizedPrompt } from '../config/optimizedPrompts';
import { FileItem } from '../types';

interface WebPageRequirements {
  pageTitle: string;
  pageTheme: string;
  colorScheme: string;
  styleRequirements: string;
  targetAudience: string;
}

interface GenerationProgress {
  stage: 'planning' | 'design' | 'code' | 'optimization' | 'complete';
  progress: number;
  message: string;
  currentAgent: string;
}

interface WebPageGenerationResult {
  files: FileItem[];
  designConcept: string;
  success: boolean;
  error?: string;
}

export class WebPageGeneratorService {
  private static instance: WebPageGeneratorService;
  private apiService: EnhancedAPIService;
  private progressCallback?: (progress: GenerationProgress) => void;

  private constructor() {
    this.apiService = EnhancedAPIService.getInstance();
  }

  public static getInstance(): WebPageGeneratorService {
    if (!WebPageGeneratorService.instance) {
      WebPageGeneratorService.instance = new WebPageGeneratorService();
    }
    return WebPageGeneratorService.instance;
  }

  public setProgressCallback(callback: (progress: GenerationProgress) => void) {
    this.progressCallback = callback;
  }

  private updateProgress(stage: GenerationProgress['stage'], progress: number, message: string, currentAgent: string) {
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, message, currentAgent });
    }
  }

  public async enhancePrompt(originalPrompt: string): Promise<{ success: boolean; enhancedPrompt?: string; error?: string }> {
    try {
      console.log('🎨 Enhancing user prompt with ArtistWeb agent...');

      const artistConfig = getDistributedAgentConfig('ArtistWeb');

      const enhancePrompt = `Como experto en diseño web y marketing digital, mejora y expande la siguiente descripción de página web para que sea más completa y detallada:

DESCRIPCIÓN ORIGINAL:
"${originalPrompt}"

INSTRUCCIONES PARA MEJORAR:
1. Mantén la intención y propósito original del usuario
2. Agrega detalles específicos sobre diseño visual y estilo
3. Sugiere elementos de marketing y conversión apropiados
4. Incluye consideraciones técnicas modernas (responsive, SEO, accesibilidad)
5. Especifica paletas de colores y tipografía profesional
6. Describe animaciones y efectos visuales apropiados
7. Sugiere estructura de contenido optimizada
8. Mantén un tono profesional pero creativo

FORMATO DE RESPUESTA:
Proporciona una descripción mejorada y expandida que incluya todos los elementos necesarios para crear una página web moderna y efectiva. La descripción debe ser clara, específica y actionable.

IMPORTANTE: No uses formato de lista ni bullets, escribe un párrafo fluido y natural que describa completamente la página web deseada.`;

      const response = await this.apiService.sendMessage(enhancePrompt, {
        model: artistConfig.model.id,
        temperature: 0.6, // Slightly higher for creativity
        maxTokens: 2000,
        agentName: 'ArtistWeb'
      });

      if (!response.success) {
        throw new Error(response.error || 'Error al mejorar el prompt');
      }

      return {
        success: true,
        enhancedPrompt: response.data || originalPrompt
      };

    } catch (error) {
      console.error('Error enhancing prompt:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al mejorar el prompt'
      };
    }
  }

  public async generateWebPage(requirements: WebPageRequirements): Promise<WebPageGenerationResult> {
    try {
      this.updateProgress('planning', 10, 'Iniciando planificación del proyecto...', 'PlannerAgent');

      // Step 1: Planning with PlannerAgent
      const projectPlan = await this.createProjectPlan(requirements);
      this.updateProgress('planning', 25, 'Plan del proyecto completado', 'PlannerAgent');

      // Step 2: Design concept with ArtistWeb
      this.updateProgress('design', 40, 'Creando concepto de diseño...', 'ArtistWeb');
      const designConcept = await this.createDesignConcept(requirements, projectPlan);
      this.updateProgress('design', 60, 'Concepto de diseño completado', 'ArtistWeb');

      // Step 3: Code generation with CodeGeneratorAgent
      this.updateProgress('code', 75, 'Generando código de la página...', 'CodeGeneratorAgent');
      const files = await this.generateCode(requirements, designConcept);
      this.updateProgress('code', 90, 'Código generado exitosamente', 'CodeGeneratorAgent');

      // Step 4: Final optimization
      this.updateProgress('optimization', 95, 'Optimizando archivos finales...', 'CodeGeneratorAgent');
      const optimizedFiles = await this.optimizeFiles(files);
      
      this.updateProgress('complete', 100, 'Página web generada exitosamente', 'Sistema');

      return {
        files: optimizedFiles,
        designConcept,
        success: true
      };

    } catch (error) {
      console.error('Error generating web page:', error);
      return {
        files: [],
        designConcept: '',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  private async createProjectPlan(requirements: WebPageRequirements): Promise<string> {
    const plannerConfig = getDistributedAgentConfig('PlannerAgent');
    
    const planPrompt = `Crea un plan detallado para desarrollar una página web con las siguientes especificaciones:

TÍTULO: ${requirements.pageTitle}
TEMA: ${requirements.pageTheme}
COLORES: ${requirements.colorScheme}
AUDIENCIA: ${requirements.targetAudience || 'General'}
REQUISITOS ESPECIALES: ${requirements.styleRequirements || 'Ninguno'}

El plan debe incluir:
1. Estructura de la página (secciones principales)
2. Elementos clave a incluir
3. Estrategia de contenido
4. Consideraciones técnicas
5. Objetivos de conversión

Responde con un plan estructurado y detallado.`;

    const response = await this.apiService.sendMessage(planPrompt, {
      model: plannerConfig.model.id,
      temperature: plannerConfig.temperature,
      maxTokens: plannerConfig.maxTokens,
      agentName: 'PlannerAgent'
    });

    if (!response.success) {
      throw new Error(response.error || 'Error al crear plan del proyecto');
    }

    return response.data || '';
  }

  private async createDesignConcept(requirements: WebPageRequirements, projectPlan: string): Promise<string> {
    const artistConfig = getDistributedAgentConfig('ArtistWeb');
    
    const { systemPrompt, userPrompt } = buildOptimizedPrompt('ArtistWeb', {
      pageTitle: requirements.pageTitle,
      pageTheme: requirements.pageTheme,
      colorScheme: requirements.colorScheme,
      styleRequirements: requirements.styleRequirements || 'Diseño moderno y atractivo',
      targetAudience: requirements.targetAudience || 'Audiencia general'
    });

    const designPrompt = `${userPrompt}

PLAN DEL PROYECTO:
${projectPlan}

INSTRUCCIONES ADICIONALES:
- Crea un concepto de diseño detallado que incluya la estructura visual
- Especifica los elementos de animación y efectos visuales
- Define la paleta de colores específica basada en: ${requirements.colorScheme}
- Describe la tipografía y jerarquía visual
- Incluye estrategias de call-to-action
- Considera la experiencia móvil

Responde con un concepto de diseño completo y detallado que sirva como guía para la implementación.`;

    const response = await this.apiService.sendMessage(designPrompt, {
      model: artistConfig.model.id,
      temperature: artistConfig.temperature,
      maxTokens: artistConfig.maxTokens,
      systemPrompt: systemPrompt,
      agentName: 'ArtistWeb'
    });

    if (!response.success) {
      throw new Error(response.error || 'Error al crear concepto de diseño');
    }

    return response.data || '';
  }

  private async generateCode(requirements: WebPageRequirements, designConcept: string): Promise<FileItem[]> {
    const codeConfig = getDistributedAgentConfig('CodeGeneratorAgent');
    
    const { systemPrompt, userPrompt } = buildOptimizedPrompt('ArtistWeb', {
      pageTitle: requirements.pageTitle,
      pageTheme: requirements.pageTheme,
      colorScheme: requirements.colorScheme,
      styleRequirements: requirements.styleRequirements || 'Diseño moderno y atractivo',
      targetAudience: requirements.targetAudience || 'Audiencia general'
    });

    const codePrompt = `${userPrompt}

CONCEPTO DE DISEÑO:
${designConcept}

INSTRUCCIONES ESPECÍFICAS:
- Implementa exactamente el diseño descrito en el concepto
- Usa HTML5 semántico y accesible
- CSS3 moderno con animaciones suaves
- JavaScript vanilla para interactividad
- Diseño completamente responsive
- Optimizado para velocidad de carga
- Incluye meta tags para SEO

IMPORTANTE: Genera exactamente 3 archivos separados como se especifica en el formato de salida.`;

    const response = await this.apiService.sendMessage(codePrompt, {
      model: codeConfig.model.id,
      temperature: codeConfig.temperature,
      maxTokens: codeConfig.maxTokens,
      systemPrompt: systemPrompt,
      agentName: 'CodeGeneratorAgent'
    });

    if (!response.success) {
      throw new Error(response.error || 'Error al generar código');
    }

    return this.parseGeneratedFiles(response.data || '');
  }

  private parseGeneratedFiles(content: string): FileItem[] {
    const files: FileItem[] = [];
    
    // Parse HTML file
    const htmlMatch = content.match(/\*\*index\.html\*\*\s*```html\s*([\s\S]*?)```/);
    if (htmlMatch) {
      files.push({
        id: `html-${Date.now()}`,
        name: 'index.html',
        path: 'index.html',
        content: htmlMatch[1].trim(),
        type: 'file',
        language: 'html',
        lastModified: Date.now()
      });
    }

    // Parse CSS file
    const cssMatch = content.match(/\*\*styles\.css\*\*\s*```css\s*([\s\S]*?)```/);
    if (cssMatch) {
      files.push({
        id: `css-${Date.now()}`,
        name: 'styles.css',
        path: 'styles.css',
        content: cssMatch[1].trim(),
        type: 'file',
        language: 'css',
        lastModified: Date.now()
      });
    }

    // Parse JavaScript file
    const jsMatch = content.match(/\*\*script\.js\*\*\s*```javascript\s*([\s\S]*?)```/);
    if (jsMatch) {
      files.push({
        id: `js-${Date.now()}`,
        name: 'script.js',
        path: 'script.js',
        content: jsMatch[1].trim(),
        type: 'file',
        language: 'javascript',
        lastModified: Date.now()
      });
    }

    // If no files were parsed, try alternative parsing
    if (files.length === 0) {
      files.push(...this.fallbackFileParsing(content));
    }

    return files;
  }

  private fallbackFileParsing(content: string): FileItem[] {
    const files: FileItem[] = [];
    
    // Try to extract any HTML content
    const htmlMatches = content.match(/```html\s*([\s\S]*?)```/g);
    if (htmlMatches && htmlMatches.length > 0) {
      const htmlContent = htmlMatches[0].replace(/```html\s*/, '').replace(/```$/, '').trim();
      files.push({
        id: `html-fallback-${Date.now()}`,
        name: 'index.html',
        path: 'index.html',
        content: htmlContent,
        type: 'file',
        language: 'html',
        lastModified: Date.now()
      });
    }

    // Try to extract any CSS content
    const cssMatches = content.match(/```css\s*([\s\S]*?)```/g);
    if (cssMatches && cssMatches.length > 0) {
      const cssContent = cssMatches[0].replace(/```css\s*/, '').replace(/```$/, '').trim();
      files.push({
        id: `css-fallback-${Date.now()}`,
        name: 'styles.css',
        path: 'styles.css',
        content: cssContent,
        type: 'file',
        language: 'css',
        lastModified: Date.now()
      });
    }

    // Try to extract any JavaScript content
    const jsMatches = content.match(/```javascript\s*([\s\S]*?)```/g);
    if (jsMatches && jsMatches.length > 0) {
      const jsContent = jsMatches[0].replace(/```javascript\s*/, '').replace(/```$/, '').trim();
      files.push({
        id: `js-fallback-${Date.now()}`,
        name: 'script.js',
        path: 'script.js',
        content: jsContent,
        type: 'file',
        language: 'javascript',
        lastModified: Date.now()
      });
    }

    return files;
  }

  private async optimizeFiles(files: FileItem[]): Promise<FileItem[]> {
    // Basic optimization: ensure proper file structure and add missing elements
    const optimizedFiles = [...files];

    // Ensure we have at least an HTML file
    if (!optimizedFiles.find(f => f.language === 'html')) {
      optimizedFiles.push({
        id: `html-default-${Date.now()}`,
        name: 'index.html',
        path: 'index.html',
        content: this.getDefaultHTML(),
        type: 'file',
        language: 'html',
        lastModified: Date.now()
      });
    }

    // Ensure we have at least a CSS file
    if (!optimizedFiles.find(f => f.language === 'css')) {
      optimizedFiles.push({
        id: `css-default-${Date.now()}`,
        name: 'styles.css',
        path: 'styles.css',
        content: this.getDefaultCSS(),
        type: 'file',
        language: 'css',
        lastModified: Date.now()
      });
    }

    return optimizedFiles;
  }

  private getDefaultHTML(): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi Página Web</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <nav>
            <h1>Mi Página Web</h1>
        </nav>
    </header>
    
    <main>
        <section class="hero">
            <h2>Bienvenido a mi sitio web</h2>
            <p>Esta es una página web moderna y atractiva.</p>
            <button class="cta-button">Comenzar</button>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2024 Mi Página Web. Todos los derechos reservados.</p>
    </footer>
    
    <script src="script.js"></script>
</body>
</html>`;
  }

  private getDefaultCSS(): string {
    return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
}

header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem 0;
}

nav {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
}

.hero {
    text-align: center;
    padding: 4rem 2rem;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.hero h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #333;
}

.cta-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem 2rem;
    border: none;
    border-radius: 5px;
    font-size: 1.1rem;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.cta-button:hover {
    transform: translateY(-2px);
}

footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 2rem 0;
}`;
  }
}
