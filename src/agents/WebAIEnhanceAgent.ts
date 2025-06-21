import { processInstruction } from '../services/ai';
import { generateUniqueId } from '../utils/idGenerator';

export interface WebAIEnhanceResult {
  success: boolean;
  data?: {
    originalInstruction: string;
    enhancedInstruction: string;
    analysisDetails: {
      businessType: string;
      industry: string;
      targetAudience: string;
      requiredPages: string[];
      designStyle: string;
      colorPalette: string[];
      keyFeatures: string[];
    };
    technicalSpecs: {
      htmlStructure: string[];
      cssFeatures: string[];
      jsFeatures: string[];
      seoRequirements: string[];
      accessibilityFeatures: string[];
    };
  };
  error?: string;
}

/**
 * Agente especializado en mejorar instrucciones para sitios web estáticos
 * Optimiza las instrucciones del usuario para generar sitios web profesionales
 * usando HTML5, CSS3 y JavaScript vanilla
 */
export class WebAIEnhanceAgent {
  /**
   * Mejora una instrucción del usuario para sitios web estáticos
   * @param instruction Instrucción original del usuario
   * @returns Resultado con la instrucción mejorada
   */
  static async enhance(instruction: string): Promise<WebAIEnhanceResult> {
    try {
      if (!instruction || instruction.trim().length === 0) {
        throw new Error('La instrucción no puede estar vacía');
      }

      console.log('🌐 WebAI EnhanceAgent: Procesando instrucción para sitio web estático');

      // Construir el prompt especializado
      const prompt = this.buildEnhancePrompt(instruction);

      // Llamar a la API de IA (Claude o OpenAI)
      const response = await processInstruction(prompt, 'Claude 3.5 Sonnet V2');

      if (!response || !response.content || !response.content.trim()) {
        throw new Error('No se recibió respuesta de la API de IA');
      }

      // Extraer y procesar la respuesta
      const result = this.parseEnhanceResponse(response.content, instruction);

      console.log('✅ WebAI EnhanceAgent: Instrucción mejorada exitosamente');
      return result;

    } catch (error) {
      console.error('❌ Error en WebAI EnhanceAgent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al mejorar la instrucción'
      };
    }
  }

  /**
   * Construye el prompt especializado para sitios web estáticos
   * @param instruction Instrucción original del usuario
   * @returns Prompt optimizado para IA (Claude/OpenAI)
   */
  private static buildEnhancePrompt(instruction: string): string {
    return `
Eres un experto consultor en desarrollo de sitios web estáticos profesionales. Tu especialidad es transformar instrucciones vagas o básicas en especificaciones técnicas detalladas y profesionales para sitios web estáticos usando HTML5, CSS3 y JavaScript vanilla.

INSTRUCCIÓN ORIGINAL DEL USUARIO:
"${instruction}"

Tu tarea es analizar esta instrucción y crear una versión mejorada y detallada que incluya:

1. ANÁLISIS DEL NEGOCIO:
   - Tipo específico de negocio/industria
   - Público objetivo identificado
   - Propósito principal del sitio web
   - Competencia y posicionamiento

2. ESTRUCTURA DEL SITIO WEB ESTÁTICO:
   - Páginas específicas necesarias (index.html, about.html, services.html, contact.html, etc.)
   - Secciones principales por página
   - Navegación y arquitectura de información
   - Jerarquía de contenido

3. ESPECIFICACIONES TÉCNICAS PARA SITIO ESTÁTICO:
   - HTML5 semántico con elementos apropiados
   - CSS3 moderno con variables CSS y flexbox/grid
   - JavaScript vanilla para interactividad (sin frameworks)
   - Diseño responsive mobile-first
   - Optimización para hosting estático

4. SEO Y ACCESIBILIDAD:
   - Meta tags específicos para la industria
   - Structured data apropiado
   - ARIA labels y accesibilidad WCAG 2.1 AA
   - Optimización de rendimiento para sitios estáticos
   - URLs amigables y estructura de enlaces

5. DISEÑO VISUAL:
   - Paleta de colores apropiada para la industria
   - Tipografías web optimizadas
   - Estilo visual coherente con el sector
   - Elementos gráficos y multimedia necesarios

6. CONTENIDO PERSONALIZADO:
   - Secciones específicas relevantes al negocio
   - Llamadas a la acción apropiadas
   - Formularios necesarios (contacto, suscripción, etc.)
   - Integración con redes sociales si es relevante

IMPORTANTE:
- Enfócate EXCLUSIVAMENTE en sitios web estáticos (HTML/CSS/JS vanilla)
- NO menciones frameworks como React, Vue, Angular
- NO incluyas funcionalidades que requieran backend complejo
- SÍ incluye funcionalidades que se puedan lograr con JavaScript vanilla
- Mantén el enfoque en rendimiento y simplicidad de hosting estático

Responde ÚNICAMENTE con un objeto JSON con la siguiente estructura:

{
  "analysis": {
    "businessType": "string (tipo específico de negocio)",
    "industry": "string (industria específica)",
    "targetAudience": "string (público objetivo identificado)",
    "purpose": "string (propósito principal del sitio)",
    "requiredPages": ["array de páginas específicas necesarias"],
    "designStyle": "string (estilo de diseño apropiado)",
    "colorPalette": ["array de colores hex apropiados"],
    "keyFeatures": ["array de características clave del sitio"]
  },
  "technicalSpecs": {
    "htmlStructure": ["array de elementos HTML5 semánticos necesarios"],
    "cssFeatures": ["array de características CSS3 modernas a usar"],
    "jsFeatures": ["array de funcionalidades JavaScript vanilla"],
    "seoRequirements": ["array de requisitos SEO específicos"],
    "accessibilityFeatures": ["array de características de accesibilidad"]
  },
  "enhancedInstruction": "string (instrucción mejorada y detallada de 200-400 palabras que incluya todos los aspectos técnicos, de diseño y de contenido específicos para crear un sitio web estático profesional)"
}

El JSON debe ser completamente válido, sin comentarios y con todas las especificaciones técnicas detalladas para un sitio web estático profesional.
    `;
  }

  /**
   * Parsea la respuesta de la API y extrae la información mejorada
   * @param response Respuesta de la API
   * @param originalInstruction Instrucción original
   * @returns Resultado parseado
   */
  private static parseEnhanceResponse(response: string, originalInstruction: string): WebAIEnhanceResult {
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
      if (!parsedResponse.analysis || !parsedResponse.technicalSpecs || !parsedResponse.enhancedInstruction) {
        throw new Error('La respuesta no tiene la estructura esperada');
      }

      return {
        success: true,
        data: {
          originalInstruction,
          enhancedInstruction: parsedResponse.enhancedInstruction,
          analysisDetails: {
            businessType: parsedResponse.analysis.businessType || 'No especificado',
            industry: parsedResponse.analysis.industry || 'General',
            targetAudience: parsedResponse.analysis.targetAudience || 'Público general',
            requiredPages: parsedResponse.analysis.requiredPages || ['index.html'],
            designStyle: parsedResponse.analysis.designStyle || 'Moderno',
            colorPalette: parsedResponse.analysis.colorPalette || ['#3b82f6', '#10b981'],
            keyFeatures: parsedResponse.analysis.keyFeatures || []
          },
          technicalSpecs: {
            htmlStructure: parsedResponse.technicalSpecs.htmlStructure || [],
            cssFeatures: parsedResponse.technicalSpecs.cssFeatures || [],
            jsFeatures: parsedResponse.technicalSpecs.jsFeatures || [],
            seoRequirements: parsedResponse.technicalSpecs.seoRequirements || [],
            accessibilityFeatures: parsedResponse.technicalSpecs.accessibilityFeatures || []
          }
        }
      };

    } catch (error) {
      console.error('Error al parsear respuesta de WebAI EnhanceAgent:', error);

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
  private static generateBasicEnhancement(originalInstruction: string): WebAIEnhanceResult {
    const enhancedInstruction = `Crear sitio web estático profesional basado en: "${originalInstruction}".

Especificaciones técnicas: HTML5 semántico con estructura header/nav/main/footer, CSS3 moderno con variables CSS y diseño responsive mobile-first usando flexbox/grid, JavaScript vanilla para interactividad básica sin dependencias externas.

Características: Diseño responsive optimizado para todos los dispositivos, SEO básico con meta tags apropiados, accesibilidad WCAG 2.1 AA con ARIA labels, formulario de contacto funcional, navegación suave entre secciones, optimización para hosting estático.

Páginas incluidas: Página principal (index.html) con hero section y contenido principal, página de información adicional si es relevante, página de contacto con formulario funcional.

Diseño visual: Paleta de colores profesional apropiada para el contexto, tipografía web optimizada, elementos visuales coherentes, animaciones CSS sutiles para mejor experiencia de usuario.`;

    return {
      success: true,
      data: {
        originalInstruction,
        enhancedInstruction,
        analysisDetails: {
          businessType: 'Sitio web general',
          industry: 'General',
          targetAudience: 'Público general',
          requiredPages: ['index.html', 'contact.html'],
          designStyle: 'Moderno y profesional',
          colorPalette: ['#3b82f6', '#10b981', '#8b5cf6'],
          keyFeatures: ['Responsive', 'SEO optimizado', 'Accesible', 'Formulario de contacto']
        },
        technicalSpecs: {
          htmlStructure: ['HTML5 semántico', 'Estructura header/nav/main/footer', 'Meta tags SEO'],
          cssFeatures: ['Variables CSS', 'Flexbox/Grid', 'Responsive design', 'Animaciones CSS'],
          jsFeatures: ['Navegación suave', 'Validación de formularios', 'Interactividad básica'],
          seoRequirements: ['Meta tags', 'Structured data básico', 'URLs amigables'],
          accessibilityFeatures: ['ARIA labels', 'Contraste adecuado', 'Navegación por teclado']
        }
      }
    };
  }
}
