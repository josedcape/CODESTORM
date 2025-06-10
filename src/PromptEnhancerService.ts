/**
 * Servicio para mejorar prompts de usuario
 * 
 * Este servicio analiza los prompts del usuario y los mejora para hacerlos
 * más claros, específicos y efectivos para el asistente.
 */

export interface EnhancedPrompt {
  id: string;
  originalPrompt: string;
  enhancedPrompt: string;
  improvements: string[];
  timestamp: number;
}

export interface PromptEnhancerResult {
  success: boolean;
  enhancedPrompt?: EnhancedPrompt;
  error?: string;
}

/**
 * Clase que proporciona métodos para mejorar prompts de usuario
 */
export class PromptEnhancerService {
  private static enhancementHistory: EnhancedPrompt[] = [];
  
  /**
   * Mejora un prompt de usuario analizando su contenido y haciendo sugerencias
   * @param originalPrompt El prompt original del usuario
   * @returns Un resultado con el prompt mejorado o un error
   */
  public static async enhancePrompt(originalPrompt: string): Promise<PromptEnhancerResult> {
    try {
      // Validar que el prompt no esté vacío
      if (!originalPrompt.trim()) {
        return {
          success: false,
          error: 'El prompt está vacío'
        };
      }
      
      // Analizar el prompt para identificar problemas
      const improvements: string[] = [];
      let enhancedPrompt = originalPrompt;
      
      // Verificar si el prompt es demasiado corto
      if (originalPrompt.split(' ').length < 3) {
        improvements.push('Prompt demasiado corto, se añadió más contexto');
        enhancedPrompt = this.expandShortPrompt(enhancedPrompt);
      }
      
      // Verificar si el prompt es ambiguo
      if (this.isAmbiguous(originalPrompt)) {
        improvements.push('Prompt ambiguo, se añadió más especificidad');
        enhancedPrompt = this.clarifyAmbiguity(enhancedPrompt);
      }
      
      // Verificar si falta contexto técnico
      if (this.lacksTechnicalContext(originalPrompt)) {
        improvements.push('Falta contexto técnico, se añadieron detalles técnicos');
        enhancedPrompt = this.addTechnicalContext(enhancedPrompt);
      }
      
      // Verificar si falta estructura
      if (this.lacksStructure(originalPrompt)) {
        improvements.push('Falta estructura, se organizó el prompt');
        enhancedPrompt = this.addStructure(enhancedPrompt);
      }
      
      // Si no se hicieron mejoras, devolver el original con un mensaje
      if (improvements.length === 0) {
        improvements.push('El prompt ya está bien formulado');
      }
      
      // Crear el objeto de prompt mejorado
      const result: EnhancedPrompt = {
        id: `enhanced-${Date.now()}`,
        originalPrompt,
        enhancedPrompt,
        improvements,
        timestamp: Date.now()
      };
      
      // Guardar en el historial
      this.enhancementHistory.push(result);
      
      // Limitar el historial a los últimos 50 elementos
      if (this.enhancementHistory.length > 50) {
        this.enhancementHistory = this.enhancementHistory.slice(-50);
      }
      
      return {
        success: true,
        enhancedPrompt: result
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al mejorar el prompt: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }
  
  /**
   * Obtiene el historial de prompts mejorados
   * @returns Array con el historial de prompts mejorados
   */
  public static getEnhancementHistory(): EnhancedPrompt[] {
    return [...this.enhancementHistory];
  }
  
  /**
   * Limpia el historial de prompts mejorados
   */
  public static clearEnhancementHistory(): void {
    this.enhancementHistory = [];
  }
  
  /**
   * Verifica si un prompt es ambiguo
   * @param prompt El prompt a verificar
   * @returns true si el prompt es ambiguo, false en caso contrario
   */
  private static isAmbiguous(prompt: string): boolean {
    const ambiguousTerms = [
      'algo', 'cosa', 'esto', 'eso', 'aquello', 'tal', 'cual',
      'hacer', 'crear', 'implementar', 'desarrollar', 'construir',
      'mejor', 'bueno', 'malo', 'bien', 'mal',
      'rápido', 'lento', 'grande', 'pequeño'
    ];
    
    const words = prompt.toLowerCase().split(/\s+/);
    
    // Verificar si hay términos ambiguos sin contexto
    return ambiguousTerms.some(term => words.includes(term));
  }
  
  /**
   * Verifica si un prompt carece de contexto técnico
   * @param prompt El prompt a verificar
   * @returns true si el prompt carece de contexto técnico, false en caso contrario
   */
  private static lacksTechnicalContext(prompt: string): boolean {
    const technicalTerms = [
      'javascript', 'typescript', 'react', 'vue', 'angular', 'node',
      'html', 'css', 'sass', 'less', 'tailwind', 'bootstrap',
      'api', 'rest', 'graphql', 'http', 'websocket',
      'database', 'sql', 'nosql', 'mongodb', 'postgresql',
      'función', 'clase', 'método', 'interfaz', 'tipo',
      'componente', 'hook', 'estado', 'prop', 'context'
    ];
    
    const promptLower = prompt.toLowerCase();
    
    // Verificar si hay al menos un término técnico
    return !technicalTerms.some(term => promptLower.includes(term));
  }
  
  /**
   * Verifica si un prompt carece de estructura
   * @param prompt El prompt a verificar
   * @returns true si el prompt carece de estructura, false en caso contrario
   */
  private static lacksStructure(prompt: string): boolean {
    // Verificar si hay numeración, viñetas o secciones
    const hasNumbering = /\d+\.\s/.test(prompt);
    const hasBullets = /[-*•]\s/.test(prompt);
    const hasSections = /\b(primero|segundo|tercero|luego|después|finalmente)\b/i.test(prompt);
    
    return !(hasNumbering || hasBullets || hasSections);
  }
  
  /**
   * Expande un prompt corto añadiendo más contexto
   * @param prompt El prompt a expandir
   * @returns El prompt expandido
   */
  private static expandShortPrompt(prompt: string): string {
    // Simulación de expansión de prompt corto
    return `Por favor, necesito ${prompt}. Proporciona una implementación detallada con ejemplos de código y explicaciones paso a paso.`;
  }
  
  /**
   * Clarifica ambigüedades en un prompt
   * @param prompt El prompt a clarificar
   * @returns El prompt clarificado
   */
  private static clarifyAmbiguity(prompt: string): string {
    // Simulación de clarificación de ambigüedades
    // En una implementación real, se utilizaría un modelo de lenguaje para esto
    let clarified = prompt;
    
    // Reemplazar términos ambiguos con alternativas más específicas
    clarified = clarified.replace(/\b(algo|cosa)\b/gi, 'una funcionalidad específica');
    clarified = clarified.replace(/\b(esto|eso|aquello)\b/gi, 'este componente');
    clarified = clarified.replace(/\b(hacer|crear)\b/gi, 'implementar');
    clarified = clarified.replace(/\b(mejor|bueno)\b/gi, 'optimizado');
    
    // Añadir una solicitud de especificidad al final
    clarified += ' Asegúrate de que la implementación sea compatible con la arquitectura existente y siga las mejores prácticas de desarrollo.';
    
    return clarified;
  }
  
  /**
   * Añade contexto técnico a un prompt
   * @param prompt El prompt al que añadir contexto técnico
   * @returns El prompt con contexto técnico añadido
   */
  private static addTechnicalContext(prompt: string): string {
    // Simulación de adición de contexto técnico
    // En una implementación real, se analizaría el contexto del proyecto
    return `${prompt} Utiliza React con TypeScript y asegúrate de que el código sea modular, reutilizable y siga los principios SOLID. Implementa manejo de errores adecuado y documentación clara.`;
  }
  
  /**
   * Añade estructura a un prompt
   * @param prompt El prompt al que añadir estructura
   * @returns El prompt estructurado
   */
  private static addStructure(prompt: string): string {
    // Simulación de adición de estructura
    // En una implementación real, se analizaría el contenido para estructurarlo adecuadamente
    return `Por favor, implementa lo siguiente:\n\n1. ${prompt}\n\n2. Asegúrate de que el código esté bien documentado\n3. Incluye pruebas unitarias\n4. Proporciona ejemplos de uso`;
  }
}
