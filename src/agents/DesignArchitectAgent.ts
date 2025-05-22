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
   * Ejecuta una tarea del agente de diseño arquitectónico
   * @param task Tarea a ejecutar
   * @returns Resultado de la tarea
   */
  public static async execute(task: AgentTask): Promise<DesignArchitectResult> {
    try {
      const agent = DesignArchitectAgent.getInstance();

      switch (task.type) {
        case 'designArchitect':
          if (task.instruction.includes('mockup') || task.instruction.includes('wireframe') || task.instruction.includes('diseño')) {
            return await agent.generateDesignProposal(task);
          } else if (task.instruction.includes('HTML') || task.instruction.includes('estilos') || task.instruction.includes('animaciones')) {
            return await agent.enhanceHTMLWithStyles(task);
          } else {
            return await agent.generateUIComponents(task);
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
   * Genera una propuesta de diseño basada en la instrucción
   * @param task Tarea con la instrucción para generar la propuesta
   * @returns Resultado con la propuesta de diseño
   */
  private async generateDesignProposal(task: AgentTask): Promise<DesignArchitectResult> {
    try {
      const prompt = this.buildDesignProposalPrompt(task.instruction, task.plan);

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

      // Generar componentes basados en la propuesta
      const components = this.generateComponentsFromProposal(designProposal);

      // Generar archivos HTML/CSS/JS basados en los componentes
      const files = await this.generateFilesFromComponents(components, designProposal);

      return {
        success: true,
        data: {
          proposal: designProposal,
          components,
          files
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
   * Genera componentes de UI basados en la instrucción
   * @param task Tarea con la instrucción para generar los componentes
   * @returns Resultado con los componentes generados
   */
  private async generateUIComponents(task: AgentTask): Promise<DesignArchitectResult> {
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
   * Construye el prompt para generar una propuesta de diseño
   * @param instruction Instrucción del usuario
   * @param plan Plan del proyecto (opcional)
   * @returns Prompt para la API de Gemini
   */
  private buildDesignProposalPrompt(instruction: string, plan?: any): string {
    return `
    Eres un experto diseñador de interfaces de usuario y arquitecto de frontend. Tu tarea es crear una propuesta de diseño detallada basada en la siguiente instrucción:

    INSTRUCCIÓN: ${instruction}

    ${plan ? `PLAN DEL PROYECTO: ${JSON.stringify(plan, null, 2)}` : ''}

    Genera una propuesta de diseño completa que incluya:
    1. Un estilo visual coherente con paleta de colores
    2. Tipografía y escala de tamaños
    3. Componentes principales de la interfaz
    4. Consideraciones de accesibilidad y responsive design
    5. Mockups o wireframes conceptuales (descritos en HTML/CSS)

    Responde ÚNICAMENTE con un objeto JSON con la siguiente estructura:

    {
      "proposal": {
        "id": "string (identificador único)",
        "title": "string (título descriptivo)",
        "description": "string (descripción detallada)",
        "style": "string (minimal, modern, corporate, playful, dark, light, custom)",
        "colorPalette": {
          "primary": "string (código hexadecimal)",
          "secondary": "string (código hexadecimal)",
          "accent": "string (código hexadecimal)",
          "background": "string (código hexadecimal)",
          "text": "string (código hexadecimal)"
        },
        "typography": {
          "headingFont": "string (nombre de fuente)",
          "bodyFont": "string (nombre de fuente)",
          "baseSize": "string (tamaño base, ej: '16px')",
          "scale": "number (factor de escala)"
        },
        "responsive": true,
        "accessibility": {
          "level": "string (A, AA, AAA)",
          "features": ["string (características de accesibilidad)"]
        },
        "components": [
          {
            "id": "string (identificador único)",
            "name": "string (nombre descriptivo)",
            "type": "string (page, layout, component, form, navigation, etc.)",
            "description": "string (descripción detallada)",
            "htmlTemplate": "string (código HTML)",
            "cssStyles": "string (código CSS)",
            "jsCode": "string (código JavaScript, si es necesario)"
          }
        ],
        "htmlPreview": "string (código HTML completo de la página principal)",
        "cssPreview": "string (código CSS completo)"
      }
    }
    `;
  }

  /**
   * Construye el prompt para generar componentes de UI
   * @param instruction Instrucción del usuario
   * @param plan Plan del proyecto (opcional)
   * @returns Prompt para la API de Gemini
   */
  private buildUIComponentsPrompt(instruction: string, plan?: any): string {
    return `
    Eres un experto desarrollador frontend especializado en crear componentes de UI reutilizables y accesibles. Tu tarea es crear componentes basados en la siguiente instrucción:

    INSTRUCCIÓN: ${instruction}

    ${plan ? `PLAN DEL PROYECTO: ${JSON.stringify(plan, null, 2)}` : ''}

    Genera componentes de UI que:
    1. Sean reutilizables y modulares
    2. Sigan las mejores prácticas de accesibilidad
    3. Tengan un diseño responsive
    4. Incluyan HTML, CSS y JavaScript (si es necesario)

    Responde ÚNICAMENTE con un objeto JSON con la siguiente estructura:

    {
      "components": [
        {
          "id": "string (identificador único)",
          "name": "string (nombre descriptivo)",
          "type": "string (button, card, form, navigation, etc.)",
          "description": "string (descripción detallada)",
          "properties": {
            "prop1": "value1",
            "prop2": "value2"
          },
          "styles": {
            "style1": "value1",
            "style2": "value2"
          },
          "htmlTemplate": "string (código HTML)",
          "cssStyles": "string (código CSS)",
          "jsCode": "string (código JavaScript, si es necesario)"
        }
      ]
    }
    `;
  }

  /**
   * Extrae la propuesta de diseño de la respuesta de la API
   * @param response Respuesta de la API
   * @returns Propuesta de diseño
   */
  private extractDesignProposalFromResponse(response: string): DesignProposal {
    try {
      // Extraer el JSON de la respuesta
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                        response.match(/{[\s\S]*}/);

      if (!jsonMatch) {
        throw new Error('No se encontró un objeto JSON válido en la respuesta');
      }

      const jsonString = jsonMatch[0].replace(/```json\n|```/g, '');
      const parsedResponse = JSON.parse(jsonString);

      const proposal = parsedResponse.proposal;

      if (!proposal) {
        throw new Error('La respuesta no contiene una propuesta de diseño válida');
      }

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
      throw new Error('No se pudo extraer la propuesta de diseño de la respuesta');
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

      const jsonString = jsonMatch[0].replace(/```json\n|```/g, '');
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
      throw new Error('No se pudieron extraer los componentes de la respuesta');
    }
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
   * Crea una propuesta de diseño basada en los componentes
   * @param components Array de componentes
   * @param instruction Instrucción original
   * @returns Propuesta de diseño
   */
  private createProposalFromComponents(components: DesignComponent[], instruction: string): DesignProposal {
    return {
      id: generateUniqueId('design-proposal'),
      title: `Propuesta de UI basada en: ${instruction.substring(0, 50)}...`,
      description: `Propuesta generada automáticamente basada en la instrucción: ${instruction}`,
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
      previewImages: []
    };
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
      path: 'src/styles/styles.css',
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
        path: 'src/index.html',
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
          path: `src/components/${component.name.toLowerCase().replace(/\s+/g, '-')}.html`,
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
          path: `src/styles/components/${component.name.toLowerCase().replace(/\s+/g, '-')}.css`,
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
          path: `src/scripts/${component.name.toLowerCase().replace(/\s+/g, '-')}.js`,
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
