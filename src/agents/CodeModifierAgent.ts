import { AgentTask, CodeModifierResult, FileItem } from '../types';
import { processInstruction } from '../services/ai';

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
      // Construir el prompt para el modelo de IA
      const prompt = this.buildPrompt(task.instruction, file);

      // Procesar la instrucción con el modelo de IA Gemini
      const response = await processInstruction(prompt, 'Gemini 2.5');

      // Extraer el contenido modificado y los cambios
      const { modifiedContent, changes } = this.extractModifications(response.content, file.content);

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
          model: response.model,
          executionTime: response.executionTime
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
