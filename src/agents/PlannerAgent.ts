import { AgentTask, FileDescription, PlannerResult } from '../types';
import { processInstruction } from '../services/ai';

/**
 * Agente de Planificación
 *
 * Este agente es responsable de analizar la solicitud del usuario y definir la estructura del proyecto,
 * incluyendo los archivos necesarios, sus propósitos y los pasos de implementación.
 */
export class PlannerAgent {
  /**
   * Ejecuta el agente de planificación para generar un plan de proyecto
   * @param task La tarea asignada al agente
   * @returns Resultado del agente con la estructura del proyecto y pasos de implementación
   */
  public static async execute(task: AgentTask): Promise<PlannerResult> {
    try {
      // Construir el prompt para el modelo de IA
      const prompt = this.buildPrompt(task.instruction);

      // Procesar la instrucción con el modelo de IA Claude
      const response = await processInstruction(prompt, 'Claude 3.5 Sonnet V2');

      // Extraer la estructura del proyecto y los pasos de implementación
      const result = this.parseResponse(response.content);

      return {
        success: true,
        data: result,
        metadata: {
          model: response.model,
          executionTime: response.executionTime
        }
      };
    } catch (error) {
      console.error('Error en PlannerAgent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en el agente de planificación'
      };
    }
  }

  /**
   * Construye el prompt para el modelo de IA
   * @param instruction La instrucción del usuario
   * @returns Prompt formateado para el modelo de IA
   */
  private static buildPrompt(instruction: string): string {
    return `
Actúa como un arquitecto de software experto. Necesito que analices la siguiente solicitud y generes un plan detallado para implementar un proyecto de software:

SOLICITUD DEL USUARIO: "${instruction}"

Tu tarea es:

1. Analizar la solicitud y determinar la estructura del proyecto.
2. Identificar todos los archivos necesarios.
3. Definir los pasos de implementación.

IMPORTANTE: Debes proporcionar descripciones muy detalladas y completas tanto para el proyecto como para cada archivo y paso de implementación. El usuario necesita entender claramente qué se va a construir y cómo funcionará antes de aprobar el plan.

Para la descripción del proyecto:
- Explica claramente el propósito y funcionalidad del proyecto
- Detalla las características principales que tendrá
- Menciona las tecnologías que se utilizarán y por qué
- Incluye información sobre la arquitectura general

Para cada archivo:
- Explica detalladamente su propósito específico
- Describe qué componentes o funcionalidades contendrá
- Menciona cómo se relaciona con otros archivos
- Incluye detalles técnicos relevantes

Para cada paso de implementación:
- Proporciona una explicación clara de lo que se realizará
- Detalla el objetivo técnico de cada paso
- Explica cómo contribuye al proyecto general
- Menciona cualquier consideración importante

Responde con un JSON estructurado de la siguiente manera:

{
  "projectStructure": {
    "name": "Nombre del proyecto",
    "description": "Descripción extensa y detallada del proyecto, incluyendo propósito, funcionalidades, tecnologías y arquitectura",
    "files": [
      {
        "path": "ruta/al/archivo.ext",
        "description": "Descripción detallada del propósito, contenido y funcionamiento del archivo",
        "dependencies": ["ruta/a/otro/archivo.ext"] // Opcional: archivos de los que depende
      }
    ]
  },
  "implementationSteps": [
    {
      "id": "paso-1",
      "title": "Título del paso",
      "description": "Descripción extensa y detallada del paso, explicando qué se implementará, cómo y por qué",
      "filesToCreate": ["ruta/al/archivo.ext"]
    }
  ]
}

Asegúrate de que:
- La estructura sea coherente y siga las mejores prácticas para el tipo de proyecto solicitado.
- Cada archivo tenga un propósito claro y específico.
- Los pasos de implementación sean lógicos y secuenciales.
- Incluyas todos los archivos necesarios para que el proyecto funcione correctamente.
- Para proyectos web, incluye archivos HTML, CSS y JavaScript.
- Para proyectos Python, incluye archivos .py y requirements.txt.
- Para proyectos más complejos, organiza los archivos en carpetas apropiadas.

IMPORTANTE:
1. Responde ÚNICAMENTE con el JSON, sin texto adicional antes o después.
2. Asegúrate de que el JSON sea válido y esté correctamente formateado.
3. No uses comillas simples, usa siempre comillas dobles para las claves y valores en el JSON.
4. No incluyas comentarios dentro del JSON.
`;
  }

  /**
   * Analiza la respuesta del modelo de IA y extrae la estructura del proyecto
   * @param responseContent Contenido de la respuesta del modelo de IA
   * @returns Estructura del proyecto y pasos de implementación
   */
  private static parseResponse(responseContent: string): PlannerResult['data'] {
    try {
      // Intentar extraer el JSON de la respuesta
      const jsonMatch = responseContent.match(/```json\s*([\s\S]*?)\s*```/) ||
                        responseContent.match(/\{[\s\S]*\}/);

      let jsonContent = '';
      if (jsonMatch) {
        jsonContent = jsonMatch[0].replace(/```json|```/g, '').trim();
      } else {
        jsonContent = responseContent.trim();
      }

      // Parsear el JSON
      const parsedData = JSON.parse(jsonContent);

      // Validar la estructura del JSON
      if (!parsedData.projectStructure || !parsedData.implementationSteps) {
        throw new Error('La respuesta no contiene la estructura esperada');
      }

      // Asegurarse de que cada paso tenga un ID
      parsedData.implementationSteps = parsedData.implementationSteps.map((step: any, index: number) => {
        if (!step.id) {
          step.id = `step-${index + 1}`;
        }
        return step;
      });

      return parsedData;
    } catch (error) {
      console.error('Error al parsear la respuesta del modelo:', error);

      // Crear una estructura básica si no se puede parsear la respuesta
      return this.createFallbackStructure();
    }
  }

  /**
   * Crea una estructura básica de proyecto en caso de error
   * @returns Estructura básica de proyecto
   */
  private static createFallbackStructure(): PlannerResult['data'] {
    return {
      projectStructure: {
        name: 'Proyecto sin nombre',
        description: 'No se pudo generar una descripción del proyecto',
        files: [
          {
            path: 'main.py',
            description: 'Archivo principal del proyecto'
          },
          {
            path: 'README.md',
            description: 'Documentación del proyecto'
          }
        ]
      },
      implementationSteps: [
        {
          id: 'step-1',
          title: 'Crear estructura básica',
          description: 'Crear los archivos principales del proyecto',
          filesToCreate: ['main.py', 'README.md']
        }
      ]
    };
  }
}
