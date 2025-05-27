import { AgentTask, CodeGeneratorResult, FileDescription, FileItem } from '../types';
import { processInstruction } from '../services/ai';
import { mapLanguage } from '../services/projectGenerator';
import { generateUniqueId } from '../utils/idGenerator';

/**
 * Agente de Generación de Código
 *
 * Este agente es responsable de generar el código para un archivo específico
 * basándose en la descripción del archivo y el contexto del proyecto.
 */
export class CodeGeneratorAgent {
  /**
   * Ejecuta el agente de generación de código
   * @param task La tarea asignada al agente
   * @param fileDescriptionOrNull Descripción del archivo a generar (opcional)
   * @param projectContextOrNull Contexto general del proyecto (opcional)
   * @returns Resultado del agente con el archivo generado o los archivos generados
   */
  public static async execute(
    task: AgentTask,
    fileDescriptionOrNull?: FileDescription | null,
    projectContextOrNull?: string | null
  ): Promise<CodeGeneratorResult> {
    try {
      // Verificar si tenemos un plan en la tarea
      if (task.plan) {
        // Si tenemos un plan, generar múltiples archivos
        console.log('Ejecutando CodeGeneratorAgent con plan:', JSON.stringify(task.plan, null, 2));
        return await this.executeWithPlan(task);
      } else if (fileDescriptionOrNull && projectContextOrNull) {
        // Si tenemos una descripción de archivo y contexto, generar un solo archivo
        console.log('Ejecutando CodeGeneratorAgent con descripción de archivo:',
          JSON.stringify(fileDescriptionOrNull, null, 2));
        return await this.executeSingleFile(task, fileDescriptionOrNull, projectContextOrNull);
      } else {
        // Si no tenemos suficiente información, devolver un error
        console.error('Error en CodeGeneratorAgent: Información insuficiente', {
          hasPlan: !!task.plan,
          hasFileDescription: !!fileDescriptionOrNull,
          hasProjectContext: !!projectContextOrNull
        });
        throw new Error('Se requiere un plan o una descripción de archivo y contexto para generar código');
      }
    } catch (error) {
      console.error('Error en CodeGeneratorAgent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en el agente de generación de código'
      };
    }
  }

  /**
   * Ejecuta el agente de generación de código para crear múltiples archivos a partir de un plan
   * @param task La tarea asignada al agente
   * @returns Resultado del agente con los archivos generados
   */
  private static async executeWithPlan(task: AgentTask): Promise<CodeGeneratorResult> {
    try {
      // Verificar que la tarea tenga un plan
      if (!task.plan) {
        throw new Error('La tarea no contiene un plan');
      }

      // Verificar que el plan tenga la estructura esperada
      if (!task.plan.files) {
        throw new Error('El plan no contiene una propiedad "files"');
      }

      if (!Array.isArray(task.plan.files)) {
        throw new Error('La propiedad "files" del plan no es un array');
      }

      if (task.plan.files.length === 0) {
        throw new Error('El plan no contiene archivos para generar');
      }

      const fileDescriptions: FileDescription[] = task.plan.files;
      const projectContext = task.plan.description || task.instruction;

      console.log(`🔧 CodeGeneratorAgent: Iniciando generación de ${fileDescriptions.length} archivos según plan aprobado`);
      console.log('📋 Plan del proyecto:', {
        title: task.plan.title,
        description: projectContext,
        totalFiles: fileDescriptions.length,
        files: fileDescriptions.map(f => ({ path: f.path, description: f.description }))
      });

      // Generar cada archivo del plan
      const generatedFiles: FileItem[] = [];
      const failedFiles: string[] = [];

      for (let i = 0; i < fileDescriptions.length; i++) {
        const fileDescription = fileDescriptions[i];

        try {
          // Verificar que la descripción del archivo tenga la estructura esperada
          if (!fileDescription.path) {
            console.warn('Descripción de archivo sin ruta, omitiendo:', fileDescription);
            failedFiles.push('archivo sin ruta');
            continue;
          }

          if (!fileDescription.description) {
            console.warn(`Archivo ${fileDescription.path} sin descripción, usando descripción genérica`);
            fileDescription.description = `Archivo ${fileDescription.path} del proyecto`;
          }

          console.log(`📝 Generando archivo ${i + 1}/${fileDescriptions.length}: ${fileDescription.path}`);
          console.log(`📄 Descripción: ${fileDescription.description}`);

          // Construir el prompt mejorado para el modelo de IA
          const prompt = this.buildEnhancedPrompt(fileDescription, projectContext, fileDescriptions, task.plan);

          // Procesar la instrucción con el modelo de IA Gemini
          const response = await processInstruction(prompt, 'Gemini 2.5');

          if (!response.content) {
            throw new Error(`El modelo de IA no devolvió contenido para ${fileDescription.path}`);
          }

          // Extraer el contenido del archivo con validación mejorada
          const fileContent = this.extractCodeContent(response.content, fileDescription.path);

          if (!fileContent || fileContent.trim().length === 0) {
            throw new Error(`No se pudo extraer contenido válido para ${fileDescription.path}`);
          }

          // Validar que el contenido generado sea apropiado para el tipo de archivo
          const validationResult = this.validateGeneratedContent(fileContent, fileDescription.path, fileDescription.description);
          if (!validationResult.isValid) {
            console.warn(`⚠️ Contenido generado para ${fileDescription.path} no pasó validación: ${validationResult.reason}`);
            // Intentar generar contenido por defecto mejorado
            const defaultContent = this.generateEnhancedDefaultContent(fileDescription.path, fileDescription.description, projectContext);
            if (defaultContent) {
              console.log(`🔄 Usando contenido por defecto mejorado para ${fileDescription.path}`);
            }
          }

          // Crear el objeto FileItem
          const file: FileItem = {
            id: generateUniqueId('file'),
            name: this.getFileNameFromPath(fileDescription.path),
            path: fileDescription.path,
            content: fileContent,
            type: this.getLanguageFromPath(fileDescription.path),
            isNew: true,
            timestamp: Date.now(),
            lastModified: Date.now()
          };

          generatedFiles.push(file);
          console.log(`✅ Archivo generado exitosamente: ${fileDescription.path} (${fileContent.length} caracteres)`);

        } catch (error) {
          console.error(`❌ Error al generar el archivo ${fileDescription.path}:`, error);
          failedFiles.push(fileDescription.path);

          // Intentar generar un archivo básico como fallback
          try {
            const fallbackContent = this.generateEnhancedDefaultContent(fileDescription.path, fileDescription.description, projectContext);
            if (fallbackContent) {
              const fallbackFile: FileItem = {
                id: generateUniqueId('file'),
                name: this.getFileNameFromPath(fileDescription.path),
                path: fileDescription.path,
                content: fallbackContent,
                type: this.getLanguageFromPath(fileDescription.path),
                isNew: true,
                timestamp: Date.now(),
                lastModified: Date.now()
              };
              generatedFiles.push(fallbackFile);
              console.log(`🔄 Archivo de fallback generado para: ${fileDescription.path}`);
            }
          } catch (fallbackError) {
            console.error(`❌ Error al generar fallback para ${fileDescription.path}:`, fallbackError);
          }
        }
      }

      if (generatedFiles.length === 0) {
        throw new Error('No se pudo generar ningún archivo del plan');
      }

      const successRate = (generatedFiles.length / fileDescriptions.length) * 100;
      console.log(`📊 Generación completada: ${generatedFiles.length}/${fileDescriptions.length} archivos (${successRate.toFixed(1)}% éxito)`);

      if (failedFiles.length > 0) {
        console.warn(`⚠️ Archivos que fallaron: ${failedFiles.join(', ')}`);
      }

      return {
        success: true,
        data: { files: generatedFiles },
        metadata: {
          totalFiles: generatedFiles.length,
          plannedFiles: fileDescriptions.length,
          successRate: successRate,
          failedFiles: failedFiles
        }
      };
    } catch (error) {
      console.error('Error en executeWithPlan:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al generar archivos del plan'
      };
    }
  }

  /**
   * Ejecuta el agente de generación de código para crear un solo archivo
   * @param task La tarea asignada al agente
   * @param fileDescription Descripción del archivo a generar
   * @param projectContext Contexto general del proyecto
   * @returns Resultado del agente con el archivo generado
   */
  private static async executeSingleFile(
    task: AgentTask,
    fileDescription: FileDescription,
    projectContext: string
  ): Promise<CodeGeneratorResult> {
    try {
      // Construir el prompt para el modelo de IA
      const prompt = this.buildPrompt(fileDescription, projectContext);

      // Procesar la instrucción con el modelo de IA Gemini
      const response = await processInstruction(prompt, 'Gemini 2.5');

      // Extraer el contenido del archivo
      const fileContent = this.extractCodeContent(response.content, fileDescription.path);

      // Crear el objeto FileItem
      const file: FileItem = {
        id: generateUniqueId('file'),
        name: this.getFileNameFromPath(fileDescription.path),
        path: fileDescription.path,
        content: fileContent,
        type: this.getLanguageFromPath(fileDescription.path),
        isNew: true,
        timestamp: Date.now(),
        lastModified: Date.now()
      };

      return {
        success: true,
        data: { file, files: [file] },
        metadata: {
          model: response.model,
          executionTime: response.executionTime
        }
      };
    } catch (error) {
      console.error('Error en executeSingleFile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en el agente de generación de código'
      };
    }
  }

  /**
   * Construye el prompt para el modelo de IA específico para sitios web estáticos
   * @param fileDescription Descripción del archivo a generar
   * @param projectContext Contexto general del proyecto
   * @returns Prompt formateado para el modelo de IA optimizado para web estática
   */
  private static buildPrompt(fileDescription: FileDescription, projectContext: string): string {
    const fileExtension = fileDescription.path.split('.').pop() || '';
    const language = this.getLanguageFromExtension(fileExtension);
    const isWebFile = ['html', 'css', 'js'].includes(fileExtension.toLowerCase());

    if (isWebFile) {
      return this.buildStaticWebPrompt(fileDescription, projectContext, language);
    } else {
      return this.buildGeneralPrompt(fileDescription, projectContext, language);
    }
  }

  /**
   * Construye un prompt mejorado que incluye contexto del plan completo
   * @param fileDescription Descripción del archivo a generar
   * @param projectContext Contexto general del proyecto
   * @param allFiles Todas las descripciones de archivos del plan
   * @param plan Plan completo del proyecto
   * @returns Prompt mejorado con contexto completo
   */
  private static buildEnhancedPrompt(
    fileDescription: FileDescription,
    projectContext: string,
    allFiles: FileDescription[],
    plan: any
  ): string {
    const fileExtension = fileDescription.path.split('.').pop() || '';
    const language = this.getLanguageFromExtension(fileExtension);
    const isWebFile = ['html', 'css', 'js'].includes(fileExtension.toLowerCase());

    // Obtener archivos relacionados (dependencias)
    const relatedFiles = allFiles.filter(f =>
      fileDescription.dependencies?.includes(f.path) ||
      f.dependencies?.includes(fileDescription.path)
    );

    // Construir contexto de archivos relacionados
    const relatedFilesContext = relatedFiles.length > 0
      ? `\n\nARCHIVOS RELACIONADOS:\n${relatedFiles.map(f => `- ${f.path}: ${f.description}`).join('\n')}`
      : '';

    // Construir contexto del plan completo
    const planContext = `
CONTEXTO DEL PLAN COMPLETO:
- Título del proyecto: ${plan.title || 'Proyecto'}
- Descripción: ${projectContext}
- Total de archivos: ${allFiles.length}
- Archivos del proyecto: ${allFiles.map(f => f.path).join(', ')}
${relatedFilesContext}

ARCHIVO ACTUAL A GENERAR:
- Ruta: ${fileDescription.path}
- Descripción: ${fileDescription.description}
- Lenguaje: ${language}
- Dependencias: ${fileDescription.dependencies?.join(', ') || 'Ninguna'}
`;

    if (isWebFile) {
      return this.buildEnhancedStaticWebPrompt(fileDescription, projectContext, language, planContext);
    } else {
      return this.buildEnhancedGeneralPrompt(fileDescription, projectContext, language, planContext);
    }
  }

  /**
   * Valida que el contenido generado sea apropiado para el tipo de archivo
   * @param content Contenido generado
   * @param filePath Ruta del archivo
   * @param description Descripción del archivo
   * @returns Resultado de la validación
   */
  private static validateGeneratedContent(content: string, filePath: string, description: string): {
    isValid: boolean;
    reason?: string;
  } {
    const fileExtension = filePath.split('.').pop()?.toLowerCase() || '';

    // Validaciones básicas
    if (!content || content.trim().length === 0) {
      return { isValid: false, reason: 'Contenido vacío' };
    }

    if (content.length < 10) {
      return { isValid: false, reason: 'Contenido demasiado corto' };
    }

    // Validaciones específicas por tipo de archivo
    switch (fileExtension) {
      case 'html':
        if (!content.includes('<') || !content.includes('>')) {
          return { isValid: false, reason: 'No contiene etiquetas HTML válidas' };
        }
        break;

      case 'css':
        if (!content.includes('{') || !content.includes('}')) {
          return { isValid: false, reason: 'No contiene reglas CSS válidas' };
        }
        break;

      case 'js':
      case 'jsx':
        // Verificar que no sea solo comentarios
        const codeLines = content.split('\n').filter(line =>
          line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('/*')
        );
        if (codeLines.length === 0) {
          return { isValid: false, reason: 'Solo contiene comentarios, sin código ejecutable' };
        }
        break;

      case 'json':
        try {
          JSON.parse(content);
        } catch {
          return { isValid: false, reason: 'JSON inválido' };
        }
        break;
    }

    return { isValid: true };
  }

  /**
   * Genera contenido por defecto mejorado basado en el contexto del proyecto
   * @param filePath Ruta del archivo
   * @param description Descripción del archivo
   * @param projectContext Contexto del proyecto
   * @returns Contenido por defecto mejorado
   */
  private static generateEnhancedDefaultContent(filePath: string, description: string, projectContext: string): string {
    const fileExtension = filePath.split('.').pop()?.toLowerCase() || '';
    const fileName = filePath.split('/').pop() || '';
    const projectName = projectContext.split(' ').slice(0, 3).join(' ') || 'Proyecto';

    switch (fileExtension) {
      case 'html':
        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <h1>${projectName}</h1>
    </header>

    <main>
        <section>
            <h2>Bienvenido</h2>
            <p>${description}</p>
        </section>
    </main>

    <footer>
        <p>&copy; 2024 ${projectName}</p>
    </footer>

    <script src="script.js"></script>
</body>
</html>`;

      case 'css':
        return `/* ${description} */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f4f4f4;
}

header {
    background: #333;
    color: #fff;
    padding: 1rem 0;
    text-align: center;
}

main {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 0 1rem;
}

section {
    background: #fff;
    padding: 2rem;
    margin-bottom: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

footer {
    background: #333;
    color: #fff;
    text-align: center;
    padding: 1rem 0;
    margin-top: 2rem;
}`;

      case 'js':
      case 'jsx':
        return `// ${description}

document.addEventListener('DOMContentLoaded', function() {
    console.log('${projectName} - ${fileName} cargado correctamente');

    // Inicialización del proyecto
    init();
});

function init() {
    // Configuración inicial
    setupEventListeners();
    loadContent();
}

function setupEventListeners() {
    // Configurar event listeners
    console.log('Event listeners configurados');
}

function loadContent() {
    // Cargar contenido dinámico
    console.log('Contenido cargado');
}

// Exportar funciones si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        init,
        setupEventListeners,
        loadContent
    };
}`;

      case 'json':
        return `{
  "name": "${projectName.toLowerCase().replace(/\s+/g, '-')}",
  "version": "1.0.0",
  "description": "${description}",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}`;

      case 'md':
        return `# ${projectName}

${description}

## Descripción

Este archivo forma parte del proyecto ${projectName}.

## Uso

Instrucciones de uso aquí.

## Contribuir

Instrucciones para contribuir al proyecto.
`;

      default:
        return `// ${description}
// Archivo: ${filePath}
// Proyecto: ${projectName}

// TODO: Implementar funcionalidad específica para este archivo
console.log('Archivo ${fileName} inicializado');
`;
    }
  }

  /**
   * Construye el prompt específico para archivos de sitios web estáticos
   * @param fileDescription Descripción del archivo a generar
   * @param projectContext Contexto general del proyecto
   * @param language Lenguaje del archivo
   * @returns Prompt optimizado para sitios web estáticos
   */
  private static buildStaticWebPrompt(fileDescription: FileDescription, projectContext: string, language: string): string {
    const fileExtension = fileDescription.path.split('.').pop() || '';

    return `
Actúa como un desarrollador web experto especializado en crear SITIOS WEB ESTÁTICOS profesionales usando únicamente HTML5, CSS3 y JavaScript vanilla. Tu especialidad es generar código optimizado, semántico y completamente funcional para hosting estático.

CONTEXTO DEL PROYECTO (SITIO WEB ESTÁTICO):
${projectContext}

ARCHIVO A GENERAR:
Ruta: ${fileDescription.path}
Descripción: ${fileDescription.description}
Tipo: ${language.toUpperCase()} para sitio web estático
${fileDescription.dependencies ? `Dependencias: ${fileDescription.dependencies.join(', ')}` : ''}

ESPECIALIZACIÓN EN WEB ESTÁTICA - Tu tarea es generar código que:

${this.getFileTypeSpecificRequirements(fileExtension, fileDescription)}

REQUISITOS OBLIGATORIOS PARA SITIOS WEB ESTÁTICOS:
1. CÓDIGO PURO: Solo HTML5, CSS3 y JavaScript vanilla (sin frameworks)
2. SEMÁNTICA: HTML5 semántico con elementos apropiados (header, nav, main, section, article, aside, footer)
3. SEO OPTIMIZADO: Meta tags completos, títulos descriptivos, alt text, structured data
4. RESPONSIVE: Mobile-first design con breakpoints optimizados
5. ACCESIBILIDAD: ARIA labels, contraste adecuado, navegación por teclado
6. RENDIMIENTO: Código optimizado para carga rápida
7. COMPATIBILIDAD: Funcional en todos los navegadores modernos
8. PERSONALIZACIÓN: Contenido específico basado en el contexto del proyecto
9. SIN PLACEHOLDERS: Evitar contenido genérico como "Lorem ipsum"
10. ESTRUCTURA LIMPIA: Código bien organizado y comentado

IMPORTANTE:
- El código debe ser completamente funcional y listo para producción
- Incluye comentarios explicativos donde sea necesario
- Asegúrate de que el código sea eficiente y siga las mejores prácticas web
- No omitas partes importantes del código
- Genera contenido realista y específico para el contexto del proyecto

Responde ÚNICAMENTE con el código del archivo, sin explicaciones adicionales antes o después.
Usa el formato de bloque de código con el lenguaje apropiado:

\`\`\`${language}
// Tu código aquí
\`\`\`
`;
  }

  /**
   * Construye el prompt mejorado específico para archivos de sitios web estáticos
   * @param fileDescription Descripción del archivo a generar
   * @param projectContext Contexto general del proyecto
   * @param language Lenguaje del archivo
   * @param planContext Contexto del plan completo
   * @returns Prompt mejorado para archivos web
   */
  private static buildEnhancedStaticWebPrompt(
    fileDescription: FileDescription,
    projectContext: string,
    language: string,
    planContext: string
  ): string {
    return `
Actúa como un desarrollador web frontend experto especializado en ${language}. Necesito que generes el código para un archivo específico dentro de un proyecto web estático.

${planContext}

INSTRUCCIONES ESPECÍFICAS:
1. Genera código ${language} limpio, moderno y bien estructurado
2. Sigue las mejores prácticas de desarrollo web
3. Asegúrate de que el código sea responsive y accesible
4. Incluye comentarios explicativos cuando sea necesario
5. El código debe ser funcional y estar listo para producción
6. Considera las dependencias y archivos relacionados mencionados
7. Mantén consistencia con el resto del proyecto

REQUISITOS TÉCNICOS:
- Usa HTML5 semántico si es un archivo HTML
- Aplica CSS moderno con Flexbox/Grid si es CSS
- Usa JavaScript ES6+ si es un archivo JS
- Optimiza para rendimiento y SEO
- Asegura compatibilidad cross-browser

FORMATO DE RESPUESTA:
Devuelve ÚNICAMENTE el código ${language} sin explicaciones adicionales. El código debe estar entre bloques de código:

\`\`\`${language}
// Tu código aquí
\`\`\`

IMPORTANTE: El archivo debe cumplir exactamente con la descripción proporcionada y integrarse perfectamente con el resto del proyecto.
`;
  }

  /**
   * Construye el prompt mejorado para archivos no web
   * @param fileDescription Descripción del archivo a generar
   * @param projectContext Contexto general del proyecto
   * @param language Lenguaje del archivo
   * @param planContext Contexto del plan completo
   * @returns Prompt mejorado para archivos generales
   */
  private static buildEnhancedGeneralPrompt(
    fileDescription: FileDescription,
    projectContext: string,
    language: string,
    planContext: string
  ): string {
    return `
Actúa como un desarrollador de software experto especializado en ${language}. Necesito que generes el código para un archivo específico dentro de un proyecto de software.

${planContext}

INSTRUCCIONES ESPECÍFICAS:
1. Genera código ${language} limpio, eficiente y bien documentado
2. Sigue las mejores prácticas y convenciones del lenguaje
3. Implementa patrones de diseño apropiados cuando sea necesario
4. Incluye manejo de errores robusto
5. El código debe ser mantenible y escalable
6. Considera las dependencias y archivos relacionados mencionados
7. Mantén consistencia con la arquitectura del proyecto

REQUISITOS TÉCNICOS:
- Usa las características modernas del lenguaje ${language}
- Implementa validaciones apropiadas
- Optimiza para rendimiento
- Incluye documentación en el código
- Sigue principios SOLID cuando sea aplicable

FORMATO DE RESPUESTA:
Devuelve ÚNICAMENTE el código ${language} sin explicaciones adicionales. El código debe estar entre bloques de código:

\`\`\`${language}
// Tu código aquí
\`\`\`

IMPORTANTE: El archivo debe cumplir exactamente con la descripción proporcionada y integrarse perfectamente con el resto del proyecto.
`;
  }

  /**
   * Construye el prompt general para archivos no web
   * @param fileDescription Descripción del archivo a generar
   * @param projectContext Contexto general del proyecto
   * @param language Lenguaje del archivo
   * @returns Prompt general
   */
  private static buildGeneralPrompt(fileDescription: FileDescription, projectContext: string, language: string): string {
    return `
Actúa como un desarrollador de software experto especializado en ${language}. Necesito que generes el código para un archivo específico dentro de un proyecto.

CONTEXTO DEL PROYECTO:
${projectContext}

ARCHIVO A GENERAR:
Ruta: ${fileDescription.path}
Descripción: ${fileDescription.description}
${fileDescription.dependencies ? `Dependencias: ${fileDescription.dependencies.join(', ')}` : ''}

Tu tarea es:
1. Generar el código completo para este archivo.
2. Asegurarte de que el código sea funcional, bien estructurado y siga las mejores prácticas.
3. Incluir comentarios explicativos donde sea necesario.
4. Asegurarte de que el código sea compatible con las dependencias mencionadas.
5. Implementar todas las funcionalidades descritas en la descripción del archivo.
6. Usar nombres de variables y funciones descriptivos y en español.
7. Seguir las convenciones de estilo estándar para el lenguaje.

IMPORTANTE:
- El código debe ser completo y funcional, no solo un esqueleto o pseudocódigo.
- Incluye manejo de errores apropiado.
- Asegúrate de que el código sea eficiente y siga las mejores prácticas.
- No omitas partes importantes del código.

Responde ÚNICAMENTE con el código del archivo, sin explicaciones adicionales antes o después.
Usa el formato de bloque de código con el lenguaje apropiado:

\`\`\`${language}
// Tu código aquí
\`\`\`
`;
  }

  /**
   * Obtiene los requisitos específicos según el tipo de archivo web
   * @param fileExtension Extensión del archivo
   * @param fileDescription Descripción del archivo
   * @returns Requisitos específicos para el tipo de archivo
   */
  private static getFileTypeSpecificRequirements(fileExtension: string, fileDescription: FileDescription): string {
    switch (fileExtension.toLowerCase()) {
      case 'html':
        return `
REQUISITOS ESPECÍFICOS PARA HTML5:
1. Estructura DOCTYPE html5 completa
2. Meta tags SEO optimizados (title, description, keywords, og:tags)
3. Viewport meta tag para responsive design
4. Elementos semánticos apropiados (header, nav, main, section, article, aside, footer)
5. ARIA labels para accesibilidad
6. Alt text descriptivo para todas las imágenes
7. Enlaces a hojas de estilo y scripts externos
8. Structured data (JSON-LD) cuando sea apropiado
9. Contenido específico y realista basado en el contexto del proyecto
10. Formularios accesibles con labels apropiados (si aplica)`;

      case 'css':
        return `
REQUISITOS ESPECÍFICOS PARA CSS3:
1. Reset CSS o normalize para consistencia entre navegadores
2. Variables CSS para colores y espaciado
3. Diseño responsive con mobile-first approach
4. Flexbox y/o CSS Grid para layouts modernos
5. Animaciones y transiciones suaves
6. Hover effects y estados interactivos
7. Tipografía optimizada con Google Fonts
8. Colores con buen contraste para accesibilidad
9. Media queries para diferentes dispositivos
10. Optimización para rendimiento (evitar selectores complejos)`;

      case 'js':
        return `
REQUISITOS ESPECÍFICOS PARA JAVASCRIPT VANILLA:
1. Código ES6+ moderno pero compatible
2. Event listeners para interactividad con validación de elementos
3. Manipulación del DOM eficiente con verificación de existencia
4. Validación de formularios (si aplica) con manejo de errores
5. Animaciones y efectos visuales suaves
6. Manejo de errores robusto y defensivo
7. Código modular y bien organizado
8. Comentarios explicativos
9. Optimización para rendimiento
10. Funcionalidades específicas del contexto del proyecto

IMPORTANTE PARA EVITAR ERRORES:
- SIEMPRE verificar que los elementos existen antes de manipularlos
- NUNCA usar selectores vacíos como querySelector('#') o querySelector('')
- Usar try-catch para operaciones que pueden fallar
- Validar que los elementos tienen los atributos necesarios antes de usarlos
- Para enlaces con href="#", usar preventDefault() y manejar la navegación apropiadamente

EJEMPLO DE CÓDIGO SEGURO:
// ✅ CORRECTO - Verificar existencia antes de usar
const element = document.querySelector('#mi-elemento');
if (element) {
  element.addEventListener('click', function(e) {
    e.preventDefault();
    // Lógica aquí
  });
}

// ❌ INCORRECTO - No verificar existencia
document.querySelector('#').addEventListener('click', ...); // Error!

// ✅ CORRECTO - Manejo de enlaces de navegación
document.querySelectorAll('a[href^="#"]').forEach(link => {
  if (link.getAttribute('href') !== '#') {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
});`;

      default:
        return `
REQUISITOS GENERALES:
1. Código limpio y bien estructurado
2. Comentarios explicativos apropiados
3. Manejo de errores
4. Optimización para rendimiento
5. Compatibilidad con el contexto del proyecto`;
    }
  }

  /**
   * Extrae el contenido de código de la respuesta del modelo de IA
   * @param responseContent Contenido de la respuesta del modelo de IA
   * @param filePath Ruta del archivo para determinar el lenguaje
   * @returns Contenido del código extraído
   */
  private static extractCodeContent(responseContent: string, filePath: string): string {
    // Verificar que responseContent no sea undefined o null
    if (!responseContent) {
      console.warn(`extractCodeContent: responseContent es ${responseContent} para ${filePath}`);
      return this.generateDefaultContent(filePath);
    }

    const fileExtension = filePath.split('.').pop() || '';
    const language = this.getLanguageFromExtension(fileExtension);

    // Intentar extraer el código del bloque de código
    const codeBlockRegex = new RegExp(`\`\`\`(?:${language})?\\s*([\\s\\S]*?)\\s*\`\`\``, 'i');
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
    console.warn(`No se pudo extraer contenido válido para ${filePath}, generando contenido por defecto`);
    return this.generateDefaultContent(filePath);
  }

  /**
   * Genera un contenido por defecto para un archivo basado en su extensión
   * @param filePath Ruta del archivo
   * @returns Contenido por defecto
   */
  private static generateDefaultContent(filePath: string): string {
    const fileExtension = filePath.split('.').pop() || '';
    const fileName = filePath.split('/').pop() || '';

    switch (fileExtension.toLowerCase()) {
      case 'html':
        return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CODESTORM - ${fileName.replace('.html', '')}</title>
  <link rel="stylesheet" href="styles.css">
  <style>
    /* Estilos integrados para vista previa inmediata */
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      text-align: center;
      background: rgba(255, 255, 255, 0.1);
      padding: 40px;
      border-radius: 15px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      max-width: 600px;
      margin: 20px;
    }
    h1 {
      font-size: 2.5em;
      margin-bottom: 20px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      background: linear-gradient(45deg, #64b5f6, #42a5f5);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    p {
      font-size: 1.2em;
      opacity: 0.9;
      line-height: 1.6;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    .feature {
      background: rgba(255, 255, 255, 0.05);
      padding: 20px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .cta-button {
      background: linear-gradient(45deg, #42a5f5, #1976d2);
      color: white;
      padding: 12px 30px;
      border: none;
      border-radius: 25px;
      font-size: 1.1em;
      cursor: pointer;
      margin-top: 20px;
      transition: transform 0.3s ease;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(66, 165, 245, 0.4);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌩️ CODESTORM</h1>
    <p>Tu proyecto está listo para ser desarrollado</p>
    <p>Esta página fue generada automáticamente por el sistema de IA de CODESTORM</p>

    <div class="features">
      <div class="feature">
        <h3>⚡ Rápido</h3>
        <p>Desarrollo acelerado con IA</p>
      </div>
      <div class="feature">
        <h3>🎨 Moderno</h3>
        <p>Diseño contemporáneo y responsive</p>
      </div>
      <div class="feature">
        <h3>🔧 Personalizable</h3>
        <p>Fácil de modificar y extender</p>
      </div>
    </div>

    <button class="cta-button" onclick="alert('¡Funcionalidad lista para implementar!')">
      Comenzar
    </button>
  </div>

  <script>
    // Animación de entrada
    document.addEventListener('DOMContentLoaded', function() {
      const container = document.querySelector('.container');
      container.style.opacity = '0';
      container.style.transform = 'translateY(30px)';

      setTimeout(() => {
        container.style.transition = 'all 0.8s ease';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
      }, 100);

      console.log('🌩️ CODESTORM - Página cargada correctamente');
    });
  </script>
</body>
</html>`;

      case 'css':
        return `/* Estilos principales para ${filePath} - Generado por CODESTORM */

/* Reset y configuración base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  min-height: 100vh;
}

/* Contenedor principal */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Tipografía */
h1, h2, h3, h4, h5, h6 {
  margin-bottom: 1rem;
  font-weight: 600;
  line-height: 1.2;
}

h1 {
  font-size: 2.5rem;
  background: linear-gradient(45deg, #64b5f6, #42a5f5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

h2 {
  font-size: 2rem;
  color: #1976d2;
}

h3 {
  font-size: 1.5rem;
  color: #42a5f5;
}

p {
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

/* Enlaces */
a {
  color: #42a5f5;
  text-decoration: none;
  transition: color 0.3s ease;
}

a:hover {
  color: #1976d2;
  text-decoration: underline;
}

/* Botones */
.btn {
  display: inline-block;
  padding: 12px 24px;
  background: linear-gradient(45deg, #42a5f5, #1976d2);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(66, 165, 245, 0.4);
}

.btn-secondary {
  background: linear-gradient(45deg, #78909c, #546e7a);
}

.btn-secondary:hover {
  box-shadow: 0 5px 15px rgba(120, 144, 156, 0.4);
}

/* Tarjetas */
.card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
}

/* Grid system */
.grid {
  display: grid;
  gap: 20px;
}

.grid-2 {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.grid-3 {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.grid-4 {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

/* Utilidades */
.text-center {
  text-align: center;
}

.text-white {
  color: white;
}

.mb-1 { margin-bottom: 0.5rem; }
.mb-2 { margin-bottom: 1rem; }
.mb-3 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 2rem; }

.mt-1 { margin-top: 0.5rem; }
.mt-2 { margin-top: 1rem; }
.mt-3 { margin-top: 1.5rem; }
.mt-4 { margin-top: 2rem; }

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }

  h1 {
    font-size: 2rem;
  }

  h2 {
    font-size: 1.5rem;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}

/* Animaciones */
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

.fade-in-up {
  animation: fadeInUp 0.8s ease;
}

/* Efectos especiales */
.glass-effect {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.gradient-text {
  background: linear-gradient(45deg, #64b5f6, #42a5f5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Tema CODESTORM */
.codestorm-primary {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

.codestorm-accent {
  background: linear-gradient(45deg, #42a5f5, #1976d2);
}

.codestorm-dark {
  background: #0d1421;
  color: white;
}

.codestorm-blue {
  color: #42a5f5;
}`;

      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return `// Contenido por defecto generado para ${filePath}
// El generador de código no pudo crear contenido válido para este archivo

function init() {
  console.log("Archivo ${fileName} cargado correctamente");
}

// Inicializar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', init);`;

      default:
        return `// Contenido por defecto generado para ${filePath}
// El generador de código no pudo crear contenido válido para este archivo
// Tipo de archivo: ${fileExtension}`;
    }
  }

  /**
   * Obtiene el nombre de archivo de una ruta
   * @param path Ruta del archivo
   * @returns Nombre del archivo
   */
  private static getFileNameFromPath(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1];
  }

  /**
   * Determina el lenguaje basado en la extensión del archivo
   * @param extension Extensión del archivo
   * @returns Lenguaje correspondiente
   */
  private static getLanguageFromExtension(extension: string): string {
    switch (extension.toLowerCase()) {
      case 'py':
        return 'python';
      case 'js':
        return 'javascript';
      case 'ts':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return extension.toLowerCase();
    }
  }

  /**
   * Determina el lenguaje basado en la ruta del archivo
   * @param path Ruta del archivo
   * @returns Lenguaje correspondiente para el sistema
   */
  private static getLanguageFromPath(path: string): string {
    const extension = path.split('.').pop() || '';
    return this.getLanguageFromExtension(extension);
  }
}
