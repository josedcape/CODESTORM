import { processInstruction } from '../services/ai';
import { generateUniqueId } from '../utils/idGenerator';

export interface ConstructorEnhanceResult {
  success: boolean;
  data?: {
    originalInstruction: string;
    enhancedInstruction: string;
    analysisDetails: {
      applicationType: string;
      complexity: string;
      targetUsers: string;
      coreFeatures: string[];
      technicalRequirements: string[];
      scalabilityNeeds: string[];
    };
    architectureSpecs: {
      recommendedStack: string[];
      componentStructure: string[];
      stateManagement: string[];
      apiRequirements: string[];
      performanceOptimizations: string[];
    };
  };
  error?: string;
}

/**
 * Agente especializado en mejorar instrucciones para aplicaciones web complejas
 * Optimiza las instrucciones del usuario para generar aplicaciones funcionales
 * con frameworks modernos y arquitectura escalable
 */
export class ConstructorEnhanceAgent {
  /**
   * Mejora una instrucción del usuario para aplicaciones web complejas
   * @param instruction Instrucción original del usuario
   * @returns Resultado con la instrucción mejorada
   */
  static async enhance(instruction: string): Promise<ConstructorEnhanceResult> {
    try {
      if (!instruction || instruction.trim().length === 0) {
        throw new Error('La instrucción no puede estar vacía');
      }

      console.log('⚙️ Constructor EnhanceAgent: Procesando instrucción para aplicación compleja');

      // Construir el prompt especializado
      const prompt = this.buildEnhancePrompt(instruction);

      // Llamar a la API de IA
      const response = await processInstruction(prompt, 'Claude 3.5 Sonnet V2');

      if (!response || !response.content || !response.content.trim()) {
        throw new Error('No se recibió respuesta de la API de IA');
      }

      // Extraer y procesar la respuesta
      const result = this.parseEnhanceResponse(response.content, instruction);

      console.log('✅ Constructor EnhanceAgent: Instrucción mejorada exitosamente');
      return result;

    } catch (error) {
      console.error('❌ Error en Constructor EnhanceAgent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al mejorar la instrucción'
      };
    }
  }

  /**
   * Construye el prompt especializado para aplicaciones web complejas
   * @param instruction Instrucción original del usuario
   * @returns Prompt optimizado para IA (Claude/OpenAI)
   */
  private static buildEnhancePrompt(instruction: string): string {
    return `
Eres un experto arquitecto de software especializado en aplicaciones web modernas y escalables. Tu especialidad es transformar ideas básicas en especificaciones técnicas detalladas para aplicaciones web funcionales usando frameworks modernos y mejores prácticas de desarrollo.

INSTRUCCIÓN ORIGINAL DEL USUARIO:
"${instruction}"

Tu tarea es analizar esta instrucción y crear una versión mejorada y detallada que incluya:

1. ANÁLISIS DE LA APLICACIÓN:
   - Tipo específico de aplicación (SPA, PWA, Dashboard, E-commerce, etc.)
   - Nivel de complejidad (Simple, Intermedio, Complejo, Enterprise)
   - Usuarios objetivo y casos de uso principales
   - Funcionalidades core vs. funcionalidades secundarias

2. ARQUITECTURA DE LA APLICACIÓN:
   - Stack tecnológico recomendado (React/Vue/Angular + librerías)
   - Estructura de componentes y organización de archivos
   - Manejo de estado global (Context, Redux, Zustand, etc.)
   - Routing y navegación de la aplicación
   - Patrones de diseño aplicables

3. FUNCIONALIDADES ESPECÍFICAS:
   - Sistema de autenticación y autorización si es necesario
   - CRUD operations detalladas
   - Integración con APIs y servicios externos
   - Funcionalidades en tiempo real (WebSockets, SSE)
   - Manejo de archivos y multimedia

4. EXPERIENCIA DE USUARIO AVANZADA:
   - Flujos de usuario detallados
   - Estados de carga y feedback visual
   - Manejo de errores y validaciones
   - Responsive design y accesibilidad
   - Animaciones y transiciones

5. RENDIMIENTO Y ESCALABILIDAD:
   - Optimizaciones de rendimiento (lazy loading, code splitting)
   - Caching strategies y manejo de datos
   - SEO para SPAs si es aplicable
   - PWA features si es relevante
   - Consideraciones de escalabilidad

6. INTEGRACIÓN Y DATOS:
   - APIs necesarias y estructura de endpoints
   - Base de datos y modelado de datos
   - Autenticación y seguridad
   - Testing strategy (unit, integration, e2e)

IMPORTANTE:
- Enfócate en aplicaciones web FUNCIONALES y DINÁMICAS
- Incluye frameworks modernos y herramientas de desarrollo
- Considera funcionalidades avanzadas como real-time, offline, etc.
- Piensa en escalabilidad y mantenibilidad del código
- Incluye consideraciones de UX/UI avanzadas

Responde ÚNICAMENTE con un objeto JSON con la siguiente estructura:

{
  "analysis": {
    "applicationType": "string (tipo específico de aplicación)",
    "complexity": "string (nivel de complejidad)",
    "targetUsers": "string (usuarios objetivo detallados)",
    "coreFeatures": ["array de funcionalidades principales"],
    "technicalRequirements": ["array de requisitos técnicos"],
    "scalabilityNeeds": ["array de necesidades de escalabilidad"]
  },
  "architectureSpecs": {
    "recommendedStack": ["array de tecnologías recomendadas"],
    "componentStructure": ["array de estructura de componentes"],
    "stateManagement": ["array de estrategias de manejo de estado"],
    "apiRequirements": ["array de requisitos de API"],
    "performanceOptimizations": ["array de optimizaciones de rendimiento"]
  },
  "enhancedInstruction": "string (instrucción mejorada y detallada de 300-500 palabras que incluya arquitectura, funcionalidades, stack tecnológico, UX/UI, y consideraciones de escalabilidad para crear una aplicación web moderna y funcional)"
}

El JSON debe ser completamente válido, sin comentarios y con todas las especificaciones técnicas detalladas para una aplicación web moderna y escalable.
    `;
  }

  /**
   * Parsea la respuesta de la API y extrae la información mejorada
   * @param response Respuesta de la API
   * @param originalInstruction Instrucción original
   * @returns Resultado parseado
   */
  private static parseEnhanceResponse(response: string, originalInstruction: string): ConstructorEnhanceResult {
    try {
      // Extraer JSON de la respuesta
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/{[\s\S]*}/);

      if (!jsonMatch) {
        throw new Error('No se encontró un objeto JSON válido en la respuesta');
      }

      let jsonString = jsonMatch[0].replace(/```json\n|```/g, '');

      // Limpiar comentarios y caracteres problemáticos
      jsonString = this.cleanJSONString(jsonString);

      const parsedResponse = JSON.parse(jsonString);

      // Validar estructura de respuesta
      if (!parsedResponse.analysis || !parsedResponse.architectureSpecs || !parsedResponse.enhancedInstruction) {
        throw new Error('La respuesta no tiene la estructura esperada');
      }

      return {
        success: true,
        data: {
          originalInstruction,
          enhancedInstruction: parsedResponse.enhancedInstruction,
          analysisDetails: {
            applicationType: parsedResponse.analysis.applicationType || 'Aplicación web general',
            complexity: parsedResponse.analysis.complexity || 'Intermedio',
            targetUsers: parsedResponse.analysis.targetUsers || 'Usuarios generales',
            coreFeatures: parsedResponse.analysis.coreFeatures || [],
            technicalRequirements: parsedResponse.analysis.technicalRequirements || [],
            scalabilityNeeds: parsedResponse.analysis.scalabilityNeeds || []
          },
          architectureSpecs: {
            recommendedStack: parsedResponse.architectureSpecs.recommendedStack || [],
            componentStructure: parsedResponse.architectureSpecs.componentStructure || [],
            stateManagement: parsedResponse.architectureSpecs.stateManagement || [],
            apiRequirements: parsedResponse.architectureSpecs.apiRequirements || [],
            performanceOptimizations: parsedResponse.architectureSpecs.performanceOptimizations || []
          }
        }
      };

    } catch (error) {
      console.error('Error al parsear respuesta de Constructor EnhanceAgent:', error);

      // Generar mejora básica como fallback
      return this.generateBasicEnhancement(originalInstruction);
    }
  }

  /**
   * Limpia el string JSON removiendo comentarios y caracteres problemáticos
   * @param jsonString String JSON a limpiar
   * @returns String JSON limpio
   */
  private static cleanJSONString(jsonString: string): string {
    return jsonString
      .replace(/\/\/.*$/gm, '') // Remover comentarios de línea
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remover comentarios de bloque
      .replace(/,(\s*[}\]])/g, '$1') // Remover comas finales
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
  }

  /**
   * Genera una mejora básica como fallback cuando falla el parsing
   * @param originalInstruction Instrucción original
   * @returns Resultado básico mejorado
   */
  private static generateBasicEnhancement(originalInstruction: string): ConstructorEnhanceResult {
    const enhancedInstruction = `Desarrollar aplicación web moderna basada en: "${originalInstruction}".

Arquitectura: Aplicación React con TypeScript, estructura de componentes modular, Context API para estado global, React Router para navegación, y organización de archivos escalable.

Funcionalidades principales: Interfaz de usuario intuitiva y responsive, sistema CRUD completo, validación de formularios, manejo de estados de carga y error, autenticación básica si es necesario.

Stack tecnológico: React 18+ con hooks modernos, TypeScript para type safety, CSS Modules o Styled Components para estilos, Axios para llamadas API, React Query para cache de datos.

UX/UI: Diseño responsive mobile-first, componentes reutilizables, feedback visual para acciones del usuario, manejo de errores user-friendly, navegación intuitiva.

Optimizaciones: Lazy loading de componentes, code splitting, optimización de renders, SEO básico para SPAs, PWA features básicas si es aplicable.`;

    return {
      success: true,
      data: {
        originalInstruction,
        enhancedInstruction,
        analysisDetails: {
          applicationType: 'Aplicación web SPA',
          complexity: 'Intermedio',
          targetUsers: 'Usuarios finales generales',
          coreFeatures: ['Interfaz intuitiva', 'CRUD operations', 'Responsive design'],
          technicalRequirements: ['React', 'TypeScript', 'API integration'],
          scalabilityNeeds: ['Componentes modulares', 'Estado escalable', 'Código mantenible']
        },
        architectureSpecs: {
          recommendedStack: ['React', 'TypeScript', 'Context API', 'React Router'],
          componentStructure: ['Componentes funcionales', 'Custom hooks', 'Estructura modular'],
          stateManagement: ['Context API', 'useState/useReducer', 'React Query'],
          apiRequirements: ['REST API', 'Axios', 'Error handling'],
          performanceOptimizations: ['Lazy loading', 'Code splitting', 'Memoization']
        }
      }
    };
  }
}
