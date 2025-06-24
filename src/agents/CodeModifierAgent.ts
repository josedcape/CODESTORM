import { AgentTask, CodeModifierResult, FileItem } from '../types';
import { processInstruction } from '../services/ai';
import { generateUniqueId } from '../utils/idGenerator';
import { EnhancedAPIService } from '../services/EnhancedAPIService';
import { getDistributedAgentConfig } from '../config/claudeModels';
import { buildOptimizedPrompt } from '../config/optimizedPrompts';

/**
 * Agente de Modificación de Código
 *
 * Este agente es responsable de modificar el código existente en un archivo
 * basándose en la instrucción del usuario.
 */
export class CodeModifierAgent {
  /**
   * Ejecuta el agente de modificación de código para alterar un archivo existente
   * @param task La tarea asignada al agente
   * @param file Archivo a modificar
   * @returns Resultado del agente con el archivo modificado y los cambios realizados
   */
  public static async execute(
    task: AgentTask,
    file: FileItem
  ): Promise<CodeModifierResult> {
    try {
      // Verificar si necesitamos generar un archivo index.html
      if (task.instruction.toLowerCase().includes('index.html') ||
          task.instruction.toLowerCase().includes('página web') ||
          task.instruction.toLowerCase().includes('sitio web') ||
          task.instruction.toLowerCase().includes('html')) {

        return await this.generateIndexHtml(task);
      }

      // Usar EnhancedAPIService con GPT-O3-Mini para mayor precisión
      const apiService = EnhancedAPIService.getInstance();
      const agentConfig = getDistributedAgentConfig('CodeModifierAgent');

      // Construir prompt optimizado
      const { systemPrompt, userPrompt } = buildOptimizedPrompt('CodeModifierAgent', {
        language: file.language,
        currentCode: file.content,
        instructions: task.instruction
      });

      // Procesar la instrucción con GPT-O3-Mini
      const response = await apiService.sendMessage(userPrompt, {
        agentName: 'CodeModifierAgent',
        maxTokens: agentConfig.maxTokens,
        temperature: agentConfig.temperature,
        systemPrompt: systemPrompt
      });

      // Extraer el contenido modificado y los cambios
      const { modifiedContent, changes } = this.extractModifications(response.data || '', file.content);

      // Crear el objeto FileItem modificado
      const modifiedFile: FileItem = {
        ...file,
        content: modifiedContent
      };

      return {
        success: true,
        data: {
          originalFile: file,
          modifiedFile,
          changes
        },
        metadata: {
          model: 'GPT-O3-Mini',
          executionTime: Date.now() - Date.now() // Se calculará en el servicio
        }
      };
    } catch (error) {
      console.error('Error en CodeModifierAgent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en el agente de modificación de código'
      };
    }
  }

  /**
   * Genera un archivo index.html basado en las instrucciones del usuario
   * @param task La tarea asignada al agente
   * @returns Resultado del agente con el archivo index.html generado
   */
  private static async generateIndexHtml(task: AgentTask): Promise<CodeModifierResult> {
    try {
      // Crear un archivo index.html vacío o con contenido básico
      const indexHtmlFile: FileItem = {
        id: generateUniqueId('file'),
        name: 'index.html',
        path: '/index.html',
        content: '<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Página Web</title>\n</head>\n<body>\n  <h1>Contenido Inicial</h1>\n</body>\n</html>',
        language: 'html',
        type: 'file',
        isNew: true,
        timestamp: Date.now(),
        lastModified: Date.now()
      };

      // Construir el prompt para el modelo de IA
      const prompt = `
Actúa como un desarrollador web experto especializado en HTML, CSS y JavaScript. Necesito que generes un archivo index.html según la siguiente instrucción.

INSTRUCCIÓN DEL USUARIO:
${task.instruction}

IMPORTANTE:
1. Sigue EXACTAMENTE las instrucciones del usuario para crear el archivo index.html.
2. Incluye todo el código HTML, CSS (en una etiqueta <style>) y JavaScript (en una etiqueta <script>) necesario.
3. Asegúrate de que el código sea válido, moderno y siga las mejores prácticas.
4. Incluye comentarios explicativos para las secciones principales.
5. Utiliza un diseño responsive que funcione en dispositivos móviles y de escritorio.
6. Incluye metadatos apropiados en el <head>.
7. Utiliza un estilo visual moderno y atractivo.

Responde con:
1. El código completo del archivo index.html en un bloque de código.
2. Un resumen de las características implementadas en formato JSON.

Formato de respuesta:

\`\`\`html
<!DOCTYPE html>
<html lang="es">
<!-- Código HTML completo aquí -->
</html>
\`\`\`

\`\`\`json
{
  "changes": [
    {
      "type": "create",
      "description": "Creación del archivo index.html según las instrucciones",
      "features": ["característica1", "característica2"]
    }
  ]
}
\`\`\`
`;

      // Procesar la instrucción con el modelo de IA Claude
      const response = await processInstruction(prompt, 'Claude 3.5 Sonnet V2');

      // Extraer el contenido del archivo index.html
      const { modifiedContent, changes } = this.extractModifications(response.content, indexHtmlFile.content);

      // Crear el objeto FileItem modificado
      const modifiedFile: FileItem = {
        ...indexHtmlFile,
        content: modifiedContent
      };

      return {
        success: true,
        data: {
          originalFile: indexHtmlFile,
          modifiedFile,
          changes
        },
        metadata: {
          model: response.model,
          executionTime: response.executionTime
        }
      };
    } catch (error) {
      console.error('Error al generar index.html:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al generar index.html'
      };
    }
  }

  /**
   * Construye el prompt para el modelo de IA
   * @param instruction Instrucción del usuario
   * @param file Archivo a modificar
   * @returns Prompt formateado para el modelo de IA
   */
  private static buildPrompt(instruction: string, file: FileItem): string {
    return `
Actúa como un desarrollador de software experto especializado en ${file.language}. Necesito que modifiques el código de un archivo existente según la siguiente instrucción.

ARCHIVO A MODIFICAR:
Ruta: ${file.path}
Lenguaje: ${file.language}

INSTRUCCIÓN DEL USUARIO:
${instruction}

CÓDIGO ACTUAL:
\`\`\`${file.language}
${file.content}
\`\`\`

Tu tarea es:
1. Modificar el código según la instrucción del usuario.
2. Mantener la estructura y estilo del código original.
3. Asegurarte de que el código modificado sea funcional y siga las mejores prácticas.
4. Incluir comentarios explicativos para los cambios realizados.
5. Asegurarte de que los cambios sean mínimos y enfocados en lo solicitado.
6. Mantener la compatibilidad con el resto del código.
7. Preservar la funcionalidad existente a menos que se indique lo contrario.

IMPORTANTE:
- No reescribas todo el archivo si solo necesitas hacer cambios pequeños.
- Mantén el mismo estilo de codificación (indentación, convenciones de nombres, etc.).
- Asegúrate de que el código modificado compile y funcione correctamente.
- Si añades nuevas funciones, asegúrate de que sean compatibles con las existentes.
- Usa nombres de variables y funciones descriptivos y en español.

Responde con:
1. El código completo modificado en un bloque de código.
2. Un resumen de los cambios realizados en formato JSON.

Formato de respuesta:

\`\`\`${file.language}
// Código modificado aquí
\`\`\`

\`\`\`json
{
  "changes": [
    {
      "type": "add" | "remove" | "modify",
      "description": "Descripción del cambio",
      "lineNumbers": [inicio, fin]
    }
  ]
}
\`\`\`
`;
  }

  /**
   * Extrae el contenido modificado y los cambios realizados
   * @param responseContent Contenido de la respuesta del modelo de IA
   * @param originalContent Contenido original del archivo
   * @returns Contenido modificado y cambios realizados
   */
  private static extractModifications(responseContent: string, originalContent: string): {
    modifiedContent: string;
    changes: CodeModifierResult['data']['changes'];
  } {
    // Extraer el código modificado
    const codeBlockRegex = /```(?:\w+)?\s*([\s\S]*?)```/;
    const codeMatch = responseContent.match(codeBlockRegex);

    let modifiedContent = originalContent;
    if (codeMatch && codeMatch[1]) {
      modifiedContent = codeMatch[1].trim();
    }

    // Extraer los cambios
    const changesRegex = /```json\s*([\s\S]*?)```/;
    const changesMatch = responseContent.match(changesRegex);

    let changes: CodeModifierResult['data']['changes'] = [];
    if (changesMatch && changesMatch[1]) {
      try {
        const parsedChanges = JSON.parse(changesMatch[1]);
        if (parsedChanges.changes && Array.isArray(parsedChanges.changes)) {
          changes = parsedChanges.changes;
        }
      } catch (error) {
        console.error('Error al parsear los cambios:', error);
      }
    }

    // Si no se pudieron extraer los cambios, generar un cambio genérico
    if (changes.length === 0) {
      changes = [
        {
          type: 'modify',
          description: 'Modificación del archivo según la instrucción del usuario'
        }
      ];
    }

    return { modifiedContent, changes };
  }
}
