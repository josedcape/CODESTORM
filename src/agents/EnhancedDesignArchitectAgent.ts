import { AgentTask, FileItem, AgentResult } from '../types';
import { generateUniqueId } from '../utils/idGenerator';
import { EnhancedAPIService } from '../services/EnhancedAPIService';

export interface DesignRequirements {
  style: 'modern' | 'classic' | 'minimal' | 'corporate' | 'creative';
  colorScheme: 'light' | 'dark' | 'auto' | 'custom';
  layout: 'single-page' | 'multi-page' | 'dashboard' | 'landing';
  responsive: boolean;
  animations: boolean;
  framework: 'vanilla' | 'tailwind' | 'bootstrap' | 'material-ui' | 'styled-components';
}

export interface EnhancedDesignArchitectResult extends AgentResult {
  data?: {
    htmlFiles: FileItem[];
    cssFiles: FileItem[];
    designSystem: any;
    componentStructure: any;
  };
}

/**
 * Enhanced Design Architect Agent - Usa modelos Claude correctos
 * Especializado en generar archivos HTML y CSS profesionales
 */
export class EnhancedDesignArchitectAgent {
  private static apiService = EnhancedAPIService.getInstance();

  /**
   * Ejecuta tarea de arquitectura de diseño con modelos Claude correctos
   */
  public static async execute(
    task: AgentTask,
    projectDescription: string,
    designRequirements?: Partial<DesignRequirements>
  ): Promise<EnhancedDesignArchitectResult> {
    console.log('🎨 EnhancedDesignArchitectAgent: Iniciando generación de diseño...');

    try {
      // Analizar requisitos de diseño usando Claude 3.5 Sonnet (más avanzado)
      const analyzedRequirements = await this.analyzeDesignRequirements(
        task.instruction,
        projectDescription,
        designRequirements
      );

      // Generar sistema de diseño usando Claude 3.5 Sonnet
      const designSystem = await this.generateDesignSystem(analyzedRequirements);

      // Generar archivos HTML usando Claude 3.5 Sonnet para tareas complejas
      const htmlFiles = await this.generateHTMLFiles(analyzedRequirements, designSystem);

      // Generar archivos CSS usando Claude 3.5 Sonnet
      const cssFiles = await this.generateCSSFiles(analyzedRequirements, designSystem);

      // Generar estructura de componentes
      const componentStructure = await this.generateComponentStructure(analyzedRequirements);

      return {
        success: true,
        data: {
          htmlFiles,
          cssFiles,
          designSystem,
          componentStructure
        },
        executionTime: Date.now() - task.startTime,
        agentType: 'enhancedDesignArchitect'
      };

    } catch (error) {
      console.error('EnhancedDesignArchitectAgent error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en generación de diseño',
        executionTime: Date.now() - task.startTime,
        agentType: 'enhancedDesignArchitect'
      };
    }
  }

  /**
   * Analiza requisitos de diseño usando Claude 3.5 Sonnet
   */
  private static async analyzeDesignRequirements(
    instruction: string,
    projectDescription: string,
    providedRequirements?: Partial<DesignRequirements>
  ): Promise<DesignRequirements> {
    const prompt = `
Analiza la siguiente instrucción de proyecto para extraer requisitos de diseño:

INSTRUCCIÓN: ${instruction}
DESCRIPCIÓN: ${projectDescription}

Basándote en esta información, determina los requisitos de diseño más apropiados:

1. Estilo preferido (modern, classic, minimal, corporate, creative)
2. Esquema de colores (light, dark, auto, custom)
3. Tipo de layout (single-page, multi-page, dashboard, landing)
4. Necesidad de diseño responsive
5. Necesidad de animaciones
6. Framework CSS preferido

Responde con un objeto JSON válido con estos requisitos de diseño.
`;

    const response = await this.apiService.sendMessage(prompt, {
      agentName: 'EnhancedDesignArchitectAgent',
      systemPrompt: 'Eres un experto en diseño UX/UI. Analiza requisitos de proyectos para determinar las mejores opciones de diseño. Siempre responde con JSON válido.',
      maxTokens: 1000,
      temperature: 0.3 // Más determinístico para análisis
    });

    if (!response.success) {
      // Fallback a requisitos por defecto
      return {
        style: 'modern',
        colorScheme: 'light',
        layout: 'single-page',
        responsive: true,
        animations: false,
        framework: 'tailwind',
        ...providedRequirements
      };
    }

    try {
      const analyzed = JSON.parse(response.data || '{}');
      return {
        style: analyzed.style || 'modern',
        colorScheme: analyzed.colorScheme || 'light',
        layout: analyzed.layout || 'single-page',
        responsive: analyzed.responsive !== false,
        animations: analyzed.animations || false,
        framework: analyzed.framework || 'tailwind',
        ...providedRequirements
      };
    } catch {
      // Fallback si falla el parsing JSON
      return {
        style: 'modern',
        colorScheme: 'light',
        layout: 'single-page',
        responsive: true,
        animations: false,
        framework: 'tailwind',
        ...providedRequirements
      };
    }
  }

  /**
   * Genera sistema de diseño usando Claude 3.5 Sonnet
   */
  private static async generateDesignSystem(requirements: DesignRequirements): Promise<any> {
    const prompt = `
Crea un sistema de diseño completo para un proyecto ${requirements.style} con esquema ${requirements.colorScheme}.

Requisitos:
- Estilo: ${requirements.style}
- Esquema de colores: ${requirements.colorScheme}
- Framework: ${requirements.framework}
- Responsive: ${requirements.responsive}
- Animaciones: ${requirements.animations}

Genera un sistema de diseño que incluya:
1. Paleta de colores (primario, secundario, acento, neutros)
2. Escala tipográfica (familias, tamaños, pesos)
3. Sistema de espaciado
4. Especificaciones de componentes
5. Sistema de grid/layout

Responde con un objeto JSON detallado con el sistema de diseño completo.
`;

    const response = await this.apiService.sendMessage(prompt, {
      systemPrompt: 'Eres un experto en sistemas de diseño. Crea sistemas de diseño completos y profesionales. Siempre responde con JSON válido.',
      maxTokens: 2000,
      taskType: 'complex', // Usar Claude 3.5 Sonnet para sistemas complejos
      temperature: 0.4
    });

    if (!response.success) {
      // Sistema de diseño de fallback
      return {
        colors: {
          primary: '#3B82F6',
          secondary: '#64748B',
          accent: '#F59E0B',
          background: requirements.colorScheme === 'dark' ? '#1F2937' : '#FFFFFF',
          text: requirements.colorScheme === 'dark' ? '#F9FAFB' : '#1F2937'
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
          sizes: { sm: '14px', md: '16px', lg: '18px', xl: '24px', xxl: '32px' }
        },
        spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', xxl: '48px' }
      };
    }

    try {
      return JSON.parse(response.data || '{}');
    } catch {
      return {
        colors: {
          primary: '#3B82F6',
          secondary: '#64748B',
          accent: '#F59E0B',
          background: requirements.colorScheme === 'dark' ? '#1F2937' : '#FFFFFF',
          text: requirements.colorScheme === 'dark' ? '#F9FAFB' : '#1F2937'
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
          sizes: { sm: '14px', md: '16px', lg: '18px', xl: '24px', xxl: '32px' }
        },
        spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', xxl: '48px' }
      };
    }
  }

  /**
   * Genera archivos HTML usando Claude 3.5 Sonnet
   */
  private static async generateHTMLFiles(
    requirements: DesignRequirements,
    designSystem: any
  ): Promise<FileItem[]> {
    const htmlFiles: FileItem[] = [];

    if (requirements.layout === 'single-page') {
      const htmlContent = await this.generateSinglePageHTML(requirements, designSystem);
      htmlFiles.push({
        id: generateUniqueId('file'),
        name: 'index.html',
        path: 'index.html',
        content: htmlContent,
        language: 'html',
        type: 'file',
        isNew: true,
        timestamp: Date.now()
      });
    } else {
      // Generar múltiples páginas HTML
      const pages = ['index', 'about', 'services', 'contact'];
      for (const page of pages) {
        const htmlContent = await this.generatePageHTML(page, requirements, designSystem);
        htmlFiles.push({
          id: generateUniqueId('file'),
          name: `${page}.html`,
          path: `${page}.html`,
          content: htmlContent,
          language: 'html',
          type: 'file',
          isNew: true,
          timestamp: Date.now()
        });
      }
    }

    return htmlFiles;
  }

  /**
   * Genera HTML de página única usando Claude 3.5 Sonnet
   */
  private static async generateSinglePageHTML(
    requirements: DesignRequirements,
    designSystem: any
  ): Promise<string> {
    const prompt = `
Genera un documento HTML5 completo y profesional para una aplicación ${requirements.style} de página única.

Requisitos de diseño:
- Estilo: ${requirements.style}
- Esquema de colores: ${requirements.colorScheme}
- Framework: ${requirements.framework}
- Responsive: ${requirements.responsive}
- Animaciones: ${requirements.animations}

Sistema de diseño: ${JSON.stringify(designSystem)}

Crea HTML semántico que incluya:
1. DOCTYPE y meta tags apropiados
2. Elementos HTML5 semánticos (header, nav, main, section, footer)
3. Atributos de accesibilidad (ARIA labels, alt texts)
4. Estructura SEO-friendly
5. Meta tag de viewport responsive
6. Clases CSS apropiadas para el framework seleccionado

El HTML debe ser production-ready y seguir las mejores prácticas modernas.
`;

    const response = await this.apiService.sendMessage(prompt, {
      systemPrompt: 'Eres un experto desarrollador HTML. Genera código HTML limpio, semántico y accesible siguiendo las mejores prácticas modernas.',
      maxTokens: 3000,
      taskType: 'complex', // Usar Claude 3.5 Sonnet para generación compleja
      temperature: 0.2 // Más determinístico para código
    });

    return response.data || this.getFallbackHTML();
  }

  /**
   * Genera archivos CSS usando Claude 3.5 Sonnet
   */
  private static async generateCSSFiles(
    requirements: DesignRequirements,
    designSystem: any
  ): Promise<FileItem[]> {
    const cssFiles: FileItem[] = [];

    // CSS principal
    const mainCSS = await this.generateMainCSS(requirements, designSystem);
    cssFiles.push({
      id: generateUniqueId('file'),
      name: 'styles.css',
      path: 'css/styles.css',
      content: mainCSS,
      language: 'css',
      type: 'file',
      isNew: true,
      timestamp: Date.now()
    });

    // CSS responsive si es necesario
    if (requirements.responsive) {
      const responsiveCSS = await this.generateResponsiveCSS(requirements, designSystem);
      cssFiles.push({
        id: generateUniqueId('file'),
        name: 'responsive.css',
        path: 'css/responsive.css',
        content: responsiveCSS,
        language: 'css',
        type: 'file',
        isNew: true,
        timestamp: Date.now()
      });
    }

    return cssFiles;
  }

  /**
   * Genera CSS principal usando Claude 3.5 Sonnet
   */
  private static async generateMainCSS(
    requirements: DesignRequirements,
    designSystem: any
  ): Promise<string> {
    const prompt = `
Genera CSS completo y profesional para un sitio web ${requirements.style}.

Sistema de diseño: ${JSON.stringify(designSystem)}
Framework: ${requirements.framework}
Esquema de colores: ${requirements.colorScheme}
Animaciones: ${requirements.animations}

Crea CSS que incluya:
1. CSS Reset/Normalize moderno
2. Variables CSS personalizadas
3. Estilos tipográficos
4. Estilos de layout (flexbox/grid)
5. Estilos de componentes
6. Implementación del esquema de colores
${requirements.animations ? '7. Animaciones y transiciones suaves' : ''}

Genera CSS production-ready siguiendo las mejores prácticas modernas.
`;

    const response = await this.apiService.sendMessage(prompt, {
      systemPrompt: 'Eres un experto desarrollador CSS. Genera código CSS limpio, moderno y mantenible.',
      maxTokens: 3500,
      taskType: 'complex', // Usar Claude 3.5 Sonnet para CSS complejo
      temperature: 0.2
    });

    return response.data || this.getFallbackCSS();
  }

  /**
   * Genera CSS responsive usando Claude 3 Sonnet (equilibrado)
   */
  private static async generateResponsiveCSS(
    requirements: DesignRequirements,
    designSystem: any
  ): Promise<string> {
    const prompt = `
Genera CSS responsive para un sitio web ${requirements.style}.

Crea media queries responsive para:
1. Mobile (320px - 768px)
2. Tablet (768px - 1024px)
3. Desktop (1024px+)

Incluye ajustes responsive para tipografía, espaciado y layout.
`;

    const response = await this.apiService.sendMessage(prompt, {
      systemPrompt: 'Eres un experto en diseño web responsive. Genera CSS responsive completo.',
      maxTokens: 2000,
      taskType: 'balanced', // Usar Claude 3 Sonnet para tareas equilibradas
      temperature: 0.2
    });

    return response.data || this.getFallbackResponsiveCSS();
  }

  /**
   * Genera página HTML específica
   */
  private static async generatePageHTML(
    pageName: string,
    requirements: DesignRequirements,
    designSystem: any
  ): Promise<string> {
    const prompt = `
Genera un documento HTML5 completo para la página "${pageName}" de un sitio web ${requirements.style}.

Crea contenido apropiado y estructura para este tipo de página específica.
`;

    const response = await this.apiService.sendMessage(prompt, {
      systemPrompt: 'Eres un experto desarrollador HTML. Genera HTML semántico para tipos específicos de páginas.',
      maxTokens: 2500,
      taskType: 'balanced', // Usar Claude 3 Sonnet para páginas individuales
      temperature: 0.3
    });

    return response.data || this.getFallbackHTML(pageName);
  }

  /**
   * Genera estructura de componentes
   */
  private static async generateComponentStructure(requirements: DesignRequirements): Promise<any> {
    return {
      components: ['Header', 'Navigation', 'Hero', 'Content', 'Footer'],
      layout: requirements.layout,
      framework: requirements.framework,
      responsive: requirements.responsive
    };
  }

  /**
   * HTML de fallback
   */
  private static getFallbackHTML(pageName = 'index'): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageName.charAt(0).toUpperCase() + pageName.slice(1)} - CODESTORM Project</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <header>
        <nav>
            <h1>CODESTORM Project</h1>
        </nav>
    </header>
    <main>
        <section>
            <h2>Bienvenido a ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}</h2>
            <p>Esta página fue generada por CODESTORM Constructor usando modelos Claude correctos.</p>
        </section>
    </main>
    <footer>
        <p>&copy; 2025 CODESTORM Project</p>
    </footer>
</body>
</html>`;
  }

  /**
   * CSS de fallback
   */
  private static getFallbackCSS(): string {
    return `/* CODESTORM Generated Styles - Claude 3.5 Sonnet */
:root {
    --primary-color: #3B82F6;
    --secondary-color: #64748B;
    --accent-color: #F59E0B;
    --background-color: #FFFFFF;
    --text-color: #1F2937;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    line-height: 1.6;
    color: var(--text-color);
    background-color: var(--background-color);
}

header {
    background-color: var(--primary-color);
    color: white;
    padding: 1rem 0;
}

nav h1 {
    text-align: center;
    font-size: 2rem;
}

main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

section {
    margin-bottom: 2rem;
}

footer {
    background-color: #f8f9fa;
    text-align: center;
    padding: 1rem;
    margin-top: 2rem;
}`;
  }

  /**
   * CSS responsive de fallback
   */
  private static getFallbackResponsiveCSS(): string {
    return `/* Responsive Styles - Claude 3.5 Sonnet */
@media (max-width: 768px) {
    main {
        padding: 1rem;
    }
    
    nav h1 {
        font-size: 1.5rem;
    }
}

@media (min-width: 1024px) {
    main {
        padding: 3rem;
    }
}`;
  }
}
