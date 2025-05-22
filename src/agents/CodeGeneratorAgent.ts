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
   * Construye el prompt para el modelo de IA
   * @param fileDescription Descripción del archivo a generar
   * @param projectContext Contexto general del proyecto
   * @returns Prompt formateado para el modelo de IA
   */
  private static buildPrompt(fileDescription: FileDescription, projectContext: string): string {
    const fileExtension = fileDescription.path.split('.').pop() || '';
    const language = this.getLanguageFromExtension(fileExtension);

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
   * Extrae el contenido de código de la respuesta del modelo de IA
   * @param responseContent Contenido de la respuesta del modelo de IA
   * @param filePath Ruta del archivo para determinar el lenguaje
   * @returns Contenido del código extraído
   */
  private static extractCodeContent(responseContent: string, filePath: string): string {
    const fileExtension = filePath.split('.').pop() || '';
    const language = this.getLanguageFromExtension(fileExtension);

    // Intentar extraer el código del bloque de código
    const codeBlockRegex = new RegExp(`\`\`\`(?:${language})?\\s*([\\s\\S]*?)\\s*\`\`\``, 'i');
    const match = responseContent.match(codeBlockRegex);

    if (match && match[1]) {
      return match[1].trim();
    }

    // Si no hay bloque de código, usar todo el contenido
    return responseContent.trim();
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
