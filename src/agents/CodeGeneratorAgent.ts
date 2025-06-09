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
   * @param technologyStack Stack tecnológico seleccionado (opcional)
   * @returns Resultado del agente con el archivo generado o los archivos generados
   */
  public static async execute(
    task: AgentTask,
    fileDescriptionOrNull?: FileDescription | null,
    projectContextOrNull?: string | null,
    technologyStack?: any
  ): Promise<CodeGeneratorResult> {
    try {
      // Verificar si tenemos un plan en la tarea
      if (task.plan) {
        // Si tenemos un plan, generar múltiples archivos
        console.log('Ejecutando CodeGeneratorAgent con plan:', JSON.stringify(task.plan, null, 2));
        return await this.executeWithPlan(task, technologyStack);
      } else if (fileDescriptionOrNull && projectContextOrNull) {
        // Si tenemos una descripción de archivo y contexto, generar un solo archivo
        console.log('Ejecutando CodeGeneratorAgent con descripción de archivo:',
          JSON.stringify(fileDescriptionOrNull, null, 2));
        return await this.executeSingleFile(task, fileDescriptionOrNull, projectContextOrNull, technologyStack);
      } else {
        // Si no tenemos suficiente información, devolver un error
        console.error('Error en CodeGeneratorAgent: Información insuficiente', {
          hasPlan: !!task.plan,
          hasFileDescription: !!fileDescriptionOrNull,
          hasProjectContext: !!projectContextOrNull,
          hasTechnologyStack: !!technologyStack
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
   * @param technologyStack Stack tecnológico seleccionado (opcional)
   * @returns Resultado del agente con los archivos generados
   */
  private static async executeWithPlan(task: AgentTask, technologyStack?: any): Promise<CodeGeneratorResult> {
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

      // Generar cada archivo del plan
      const generatedFiles: FileItem[] = [];

      for (const fileDescription of fileDescriptions) {
        try {
          // Verificar que la descripción del archivo tenga la estructura esperada
          if (!fileDescription.path) {
            console.warn('Descripción de archivo sin ruta, omitiendo:', fileDescription);
            continue;
          }

          // Construir el prompt para el modelo de IA
          const prompt = this.buildPrompt(fileDescription, projectContext, technologyStack);

          // Procesar la instrucción con el modelo de IA Gemini
          const response = await processInstruction(prompt, 'Gemini 2.5 Flash');

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

          generatedFiles.push(file);
        } catch (error) {
          console.error(`Error al generar el archivo ${fileDescription.path}:`, error);
          // Continuar con el siguiente archivo
        }
      }

      if (generatedFiles.length === 0) {
        throw new Error('No se pudo generar ningún archivo del plan');
      }

      return {
        success: true,
        data: { files: generatedFiles },
        metadata: {
          totalFiles: generatedFiles.length,
          plannedFiles: fileDescriptions.length
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
   * @param technologyStack Stack tecnológico seleccionado (opcional)
   * @returns Resultado del agente con el archivo generado
   */
  private static async executeSingleFile(
    task: AgentTask,
    fileDescription: FileDescription,
    projectContext: string,
    technologyStack?: any
  ): Promise<CodeGeneratorResult> {
    try {
      // Construir el prompt para el modelo de IA
      const prompt = this.buildPrompt(fileDescription, projectContext, technologyStack);

      // Procesar la instrucción con el modelo de IA Gemini
      const response = await processInstruction(prompt, 'Gemini 2.5 Flash');

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
   * Construye el prompt para el modelo de IA específico para el stack tecnológico seleccionado
   * @param fileDescription Descripción del archivo a generar
   * @param projectContext Contexto general del proyecto
   * @param technologyStack Stack tecnológico seleccionado (opcional)
   * @returns Prompt formateado para el modelo de IA optimizado para el stack tecnológico
   */
  private static buildPrompt(fileDescription: FileDescription, projectContext: string, technologyStack?: any): string {
    const fileExtension = fileDescription.path.split('.').pop() || '';
    const language = this.getLanguageFromExtension(fileExtension);

    // Si tenemos un stack tecnológico, usar prompt específico
    if (technologyStack) {
      return this.buildTechnologyStackPrompt(fileDescription, projectContext, language, technologyStack);
    }

    // Fallback a los prompts existentes
    const isWebFile = ['html', 'css', 'js'].includes(fileExtension.toLowerCase());
    if (isWebFile) {
      return this.buildStaticWebPrompt(fileDescription, projectContext, language);
    } else {
      return this.buildGeneralPrompt(fileDescription, projectContext, language);
    }
  }

  /**
   * Construye el prompt específico para el stack tecnológico seleccionado
   * @param fileDescription Descripción del archivo a generar
   * @param projectContext Contexto general del proyecto
   * @param language Lenguaje del archivo
   * @param technologyStack Stack tecnológico seleccionado
   * @returns Prompt optimizado para el stack tecnológico específico
   */
  private static buildTechnologyStackPrompt(
    fileDescription: FileDescription,
    projectContext: string,
    language: string,
    technologyStack: any
  ): string {
    const stackName = technologyStack.name || 'Stack Tecnológico';
    const technologies = technologyStack.technologies || [];
    const features = technologyStack.features || [];
    const complexity = technologyStack.complexity || 'intermediate';
    const category = technologyStack.category || 'general';

    return `
Actúa como un desarrollador experto especializado en ${stackName} (${category}). Tu especialidad es generar código profesional, optimizado y siguiendo las mejores prácticas para este stack tecnológico específico.

STACK TECNOLÓGICO SELECCIONADO: ${stackName}
CATEGORÍA: ${category.toUpperCase()}
COMPLEJIDAD: ${complexity.toUpperCase()}
TECNOLOGÍAS: ${technologies.join(', ')}

CONTEXTO DEL PROYECTO:
${projectContext}

ARCHIVO A GENERAR:
Ruta: ${fileDescription.path}
Descripción: ${fileDescription.description}
Tipo: ${language.toUpperCase()}
${fileDescription.dependencies ? `Dependencias: ${fileDescription.dependencies.join(', ')}` : ''}

CARACTERÍSTICAS DEL STACK:
${features.map((feature, index) => `${index + 1}. ${feature}`).join('\n')}

REQUISITOS ESPECÍFICOS PARA ${stackName}:
${this.getTechnologyStackRequirements(technologyStack, language)}

INSTRUCCIONES GENERALES:
1. Generar código completo y funcional específico para ${stackName}
2. Seguir las convenciones y mejores prácticas del stack tecnológico
3. Implementar todas las funcionalidades descritas
4. Asegurar compatibilidad con las tecnologías del stack: ${technologies.join(', ')}
5. Optimizar para el nivel de complejidad: ${complexity}
6. Incluir comentarios explicativos apropiados
7. Manejar errores de forma robusta
8. Seguir patrones de diseño apropiados para el stack

IMPORTANTE:
- El código debe ser completamente funcional y listo para producción
- Usar las tecnologías específicas del stack seleccionado
- Seguir las convenciones de nomenclatura del stack
- Implementar las características mencionadas cuando sea relevante
- No omitir partes importantes del código

Responde ÚNICAMENTE con el código del archivo, sin explicaciones adicionales antes o después.
Usa el formato de bloque de código con el lenguaje apropiado:

\`\`\`${language}
// Tu código aquí
\`\`\`
`;
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
   * Obtiene los requisitos específicos para un stack tecnológico
   * @param technologyStack Stack tecnológico seleccionado
   * @param language Lenguaje del archivo
   * @returns Requisitos específicos para el stack tecnológico
   */
  private static getTechnologyStackRequirements(technologyStack: any, language: string): string {
    const stackName = technologyStack.name || 'Stack Tecnológico';
    const technologies = technologyStack.technologies || [];
    const category = technologyStack.category || 'general';

    // Requisitos específicos por categoría de stack
    switch (category.toLowerCase()) {
      case 'frontend':
        return `
REQUISITOS ESPECÍFICOS PARA FRONTEND (${stackName}):
1. Componentes reutilizables y modulares
2. Estado de aplicación bien gestionado
3. Routing dinámico y navegación fluida
4. Responsive design y mobile-first approach
5. Optimización de rendimiento (lazy loading, code splitting)
6. Accesibilidad (ARIA labels, navegación por teclado)
7. SEO optimizado (meta tags, structured data)
8. Integración con APIs REST/GraphQL
9. Manejo de errores y estados de carga
10. Testing unitario y de integración
11. Uso específico de: ${technologies.join(', ')}
12. Bundling y optimización de assets`;

      case 'backend':
        return `
REQUISITOS ESPECÍFICOS PARA BACKEND (${stackName}):
1. API RESTful bien estructurada
2. Autenticación y autorización robusta
3. Validación de datos de entrada
4. Manejo de errores y logging
5. Conexión y gestión de base de datos
6. Middleware para funcionalidades transversales
7. Documentación de API (OpenAPI/Swagger)
8. Testing unitario y de integración
9. Configuración por entornos
10. Seguridad (CORS, rate limiting, sanitización)
11. Uso específico de: ${technologies.join(', ')}
12. Monitoreo y métricas`;

      case 'fullstack':
        return `
REQUISITOS ESPECÍFICOS PARA FULLSTACK (${stackName}):
1. Arquitectura cliente-servidor bien definida
2. API RESTful o GraphQL
3. Autenticación end-to-end
4. Estado compartido entre frontend y backend
5. Routing tanto en cliente como servidor
6. SSR/SSG cuando sea apropiado
7. Optimización de rendimiento full-stack
8. Manejo de errores en ambos extremos
9. Testing integral (E2E, unitario, integración)
10. Deployment y CI/CD
11. Uso específico de: ${technologies.join(', ')}
12. Monitoreo y analytics`;

      case 'mobile':
        return `
REQUISITOS ESPECÍFICOS PARA MOBILE (${stackName}):
1. Interfaz nativa o híbrida optimizada
2. Navegación móvil intuitiva
3. Gestión de estado local y remoto
4. Integración con APIs nativas del dispositivo
5. Optimización de rendimiento móvil
6. Manejo de conectividad offline
7. Push notifications
8. Almacenamiento local seguro
9. Testing en múltiples dispositivos
10. App store compliance
11. Uso específico de: ${technologies.join(', ')}
12. Analytics y crash reporting`;

      case 'desktop':
        return `
REQUISITOS ESPECÍFICOS PARA DESKTOP (${stackName}):
1. Interfaz de usuario nativa del SO
2. Menús y shortcuts del sistema
3. Integración con el sistema operativo
4. Manejo de archivos y directorios
5. Configuración y preferencias persistentes
6. Auto-updater y versionado
7. Packaging para múltiples plataformas
8. Optimización de memoria y CPU
9. Testing en diferentes SO
10. Instaladores y distribución
11. Uso específico de: ${technologies.join(', ')}
12. Logging y debugging`;

      case 'ai':
        return `
REQUISITOS ESPECÍFICOS PARA AI (${stackName}):
1. Integración con modelos de IA/ML
2. Procesamiento de datos de entrada
3. Manejo de respuestas asíncronas
4. Validación y sanitización de prompts
5. Rate limiting y gestión de cuotas
6. Caching de respuestas cuando sea apropiado
7. Manejo de errores de API de IA
8. Logging de interacciones
9. Interfaz conversacional intuitiva
10. Configuración de parámetros de modelo
11. Uso específico de: ${technologies.join(', ')}
12. Monitoreo de costos y uso`;

      case 'blockchain':
        return `
REQUISITOS ESPECÍFICOS PARA BLOCKCHAIN (${stackName}):
1. Integración con wallets y redes blockchain
2. Smart contracts deployment y interacción
3. Manejo de transacciones y gas fees
4. Validación de direcciones y firmas
5. Interfaz web3 user-friendly
6. Manejo de estados de transacción
7. Seguridad y auditoría de contratos
8. Testing en testnets
9. Integración con proveedores RPC
10. Manejo de múltiples redes
11. Uso específico de: ${technologies.join(', ')}
12. Monitoreo de eventos blockchain`;

      default:
        return `
REQUISITOS GENERALES PARA ${stackName}:
1. Código limpio y bien estructurado
2. Documentación clara y completa
3. Manejo robusto de errores
4. Testing apropiado para el tipo de aplicación
5. Configuración por entornos
6. Logging y debugging
7. Optimización de rendimiento
8. Seguridad apropiada
9. Uso específico de: ${technologies.join(', ')}
10. Mejores prácticas del stack seleccionado`;
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
