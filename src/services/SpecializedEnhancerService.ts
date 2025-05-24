import { WebAIEnhanceAgent, WebAIEnhanceResult } from '../agents/WebAIEnhanceAgent';
import { ConstructorEnhanceAgent, ConstructorEnhanceResult } from '../agents/ConstructorEnhanceAgent';
import { EnhancedPrompt } from './PromptEnhancerService';

export type PageContext = 'webai' | 'constructor' | 'main';

export interface SpecializedEnhanceResult {
  success: boolean;
  enhancedPrompt?: EnhancedPrompt;
  context?: PageContext;
  agentType?: string;
  analysisDetails?: any;
  technicalSpecs?: any;
  error?: string;
}

/**
 * Servicio especializado que detecta el contexto de la página y usa el agente apropiado
 * para mejorar las instrucciones del usuario
 */
export class SpecializedEnhancerService {
  private static enhancementHistory: EnhancedPrompt[] = [];

  /**
   * Detecta el contexto actual de la página
   * @returns El contexto detectado
   */
  static detectPageContext(): PageContext {
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/webai')) {
      return 'webai';
    } else if (currentPath.includes('/constructor')) {
      return 'constructor';
    } else {
      return 'main';
    }
  }

  /**
   * Mejora una instrucción usando el agente especializado apropiado según el contexto
   * @param instruction Instrucción original del usuario
   * @param forceContext Contexto forzado (opcional)
   * @returns Resultado con la instrucción mejorada
   */
  static async enhanceWithSpecializedAgent(
    instruction: string, 
    forceContext?: PageContext
  ): Promise<SpecializedEnhanceResult> {
    try {
      if (!instruction || instruction.trim().length === 0) {
        return {
          success: false,
          error: 'La instrucción no puede estar vacía'
        };
      }

      // Detectar contexto
      const context = forceContext || this.detectPageContext();
      
      console.log(`🎯 SpecializedEnhancer: Detectado contexto '${context}' para instrucción`);

      let result: SpecializedEnhanceResult;

      // Usar el agente apropiado según el contexto
      switch (context) {
        case 'webai':
          result = await this.enhanceForWebAI(instruction);
          break;
        case 'constructor':
          result = await this.enhanceForConstructor(instruction);
          break;
        case 'main':
        default:
          // Para la página principal, usar el agente de constructor por defecto
          result = await this.enhanceForConstructor(instruction);
          break;
      }

      // Agregar información de contexto al resultado
      if (result.success && result.enhancedPrompt) {
        result.context = context;
        
        // Guardar en el historial
        this.enhancementHistory.push(result.enhancedPrompt);
        
        // Limitar el historial a los últimos 50 elementos
        if (this.enhancementHistory.length > 50) {
          this.enhancementHistory = this.enhancementHistory.slice(-50);
        }
      }

      return result;

    } catch (error) {
      console.error('Error en SpecializedEnhancerService:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al mejorar la instrucción'
      };
    }
  }

  /**
   * Mejora una instrucción para WebAI (sitios web estáticos)
   * @param instruction Instrucción original
   * @returns Resultado mejorado para WebAI
   */
  private static async enhanceForWebAI(instruction: string): Promise<SpecializedEnhanceResult> {
    try {
      console.log('🌐 Usando WebAI EnhanceAgent para sitios web estáticos');
      
      const webaiResult: WebAIEnhanceResult = await WebAIEnhanceAgent.enhance(instruction);
      
      if (!webaiResult.success || !webaiResult.data) {
        return {
          success: false,
          error: webaiResult.error || 'Error en WebAI EnhanceAgent'
        };
      }

      // Convertir resultado de WebAI al formato estándar
      const enhancedPrompt: EnhancedPrompt = {
        id: `webai-enhanced-${Date.now()}`,
        originalPrompt: webaiResult.data.originalInstruction,
        enhancedPrompt: webaiResult.data.enhancedInstruction,
        improvements: [
          `Optimizado para sitios web estáticos (${webaiResult.data.analysisDetails.businessType})`,
          `Especificaciones técnicas: HTML5, CSS3, JavaScript vanilla`,
          `Páginas identificadas: ${webaiResult.data.analysisDetails.requiredPages.join(', ')}`,
          `Estilo de diseño: ${webaiResult.data.analysisDetails.designStyle}`,
          `Características clave: ${webaiResult.data.analysisDetails.keyFeatures.join(', ')}`
        ],
        timestamp: Date.now()
      };

      return {
        success: true,
        enhancedPrompt,
        context: 'webai',
        agentType: 'WebAI EnhanceAgent',
        analysisDetails: webaiResult.data.analysisDetails,
        technicalSpecs: webaiResult.data.technicalSpecs
      };

    } catch (error) {
      console.error('Error en enhanceForWebAI:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error en WebAI enhancement'
      };
    }
  }

  /**
   * Mejora una instrucción para Constructor (aplicaciones complejas)
   * @param instruction Instrucción original
   * @returns Resultado mejorado para Constructor
   */
  private static async enhanceForConstructor(instruction: string): Promise<SpecializedEnhanceResult> {
    try {
      console.log('⚙️ Usando Constructor EnhanceAgent para aplicaciones complejas');
      
      const constructorResult = await ConstructorEnhanceAgent.enhance(instruction);
      
      if (!constructorResult.success || !constructorResult.data) {
        return {
          success: false,
          error: constructorResult.error || 'Error en Constructor EnhanceAgent'
        };
      }

      // Convertir resultado de Constructor al formato estándar
      const enhancedPrompt: EnhancedPrompt = {
        id: `constructor-enhanced-${Date.now()}`,
        originalPrompt: constructorResult.data.originalInstruction,
        enhancedPrompt: constructorResult.data.enhancedInstruction,
        improvements: [
          `Optimizado para aplicaciones web complejas (${constructorResult.data.analysisDetails.applicationType})`,
          `Nivel de complejidad: ${constructorResult.data.analysisDetails.complexity}`,
          `Stack recomendado: ${constructorResult.data.architectureSpecs.recommendedStack.join(', ')}`,
          `Características principales: ${constructorResult.data.analysisDetails.coreFeatures.join(', ')}`,
          `Optimizaciones: ${constructorResult.data.architectureSpecs.performanceOptimizations.join(', ')}`
        ],
        timestamp: Date.now()
      };

      return {
        success: true,
        enhancedPrompt,
        context: 'constructor',
        agentType: 'Constructor EnhanceAgent',
        analysisDetails: constructorResult.data.analysisDetails,
        technicalSpecs: constructorResult.data.architectureSpecs
      };

    } catch (error) {
      console.error('Error en enhanceForConstructor:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error en Constructor enhancement'
      };
    }
  }

  /**
   * Obtiene el historial de mejoras especializadas
   * @returns Array de prompts mejorados
   */
  static getEnhancementHistory(): EnhancedPrompt[] {
    return [...this.enhancementHistory].reverse(); // Más recientes primero
  }

  /**
   * Limpia el historial de mejoras
   */
  static clearEnhancementHistory(): void {
    this.enhancementHistory = [];
  }

  /**
   * Obtiene información sobre el agente que se usaría para el contexto actual
   * @param context Contexto opcional
   * @returns Información del agente
   */
  static getAgentInfo(context?: PageContext): { name: string; icon: string; description: string } {
    const currentContext = context || this.detectPageContext();
    
    switch (currentContext) {
      case 'webai':
        return {
          name: 'WebAI EnhanceAgent',
          icon: '🌐',
          description: 'Especializado en sitios web estáticos con HTML5, CSS3 y JavaScript vanilla'
        };
      case 'constructor':
        return {
          name: 'Constructor EnhanceAgent',
          icon: '⚙️',
          description: 'Especializado en aplicaciones web complejas con frameworks modernos'
        };
      case 'main':
      default:
        return {
          name: 'Constructor EnhanceAgent',
          icon: '⚙️',
          description: 'Especializado en aplicaciones web complejas con frameworks modernos'
        };
    }
  }

  /**
   * Verifica si una instrucción necesita mejora
   * @param instruction Instrucción a verificar
   * @returns True si necesita mejora
   */
  static needsEnhancement(instruction: string): boolean {
    if (!instruction || instruction.trim().length < 10) {
      return true;
    }

    const context = this.detectPageContext();
    const lowercaseInstruction = instruction.toLowerCase();

    // Verificaciones específicas por contexto
    if (context === 'webai') {
      // Para WebAI, verificar si menciona tecnologías específicas de sitios estáticos
      const staticWebKeywords = ['html', 'css', 'javascript', 'sitio', 'página', 'web', 'estático'];
      const hasStaticKeywords = staticWebKeywords.some(keyword => lowercaseInstruction.includes(keyword));
      
      // Si no menciona tecnologías específicas, probablemente necesita mejora
      return !hasStaticKeywords || instruction.split(' ').length < 5;
    } else {
      // Para Constructor, verificar si menciona frameworks o funcionalidades complejas
      const complexAppKeywords = ['app', 'aplicación', 'react', 'vue', 'angular', 'dashboard', 'crud'];
      const hasComplexKeywords = complexAppKeywords.some(keyword => lowercaseInstruction.includes(keyword));
      
      // Si no menciona tecnologías específicas, probablemente necesita mejora
      return !hasComplexKeywords || instruction.split(' ').length < 5;
    }
  }
}
