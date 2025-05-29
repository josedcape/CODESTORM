import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIFallbackService } from './AIFallbackService';
import { AIProviderManager } from './AIProviderManager';

// Initialize AI clients
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  baseURL: 'http://localhost:3001/api/openai',
  dangerouslyAllowBrowser: true
});

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export interface AIResponse {
  content: string;
  model: string;
  error?: string;
  fallbackUsed?: boolean;
  executionTime?: number;
  isProjectRequest?: boolean;
}

/**
 * Función mejorada con sistema de fallback robusto
 * Utiliza AIFallbackService para manejo inteligente de errores
 */
async function tryWithFallback(instruction: string, model: string): Promise<AIResponse> {
  console.log(`[AI Service] Iniciando solicitud con fallback robusto para modelo: ${model}`);

  try {
    // Usar el nuevo sistema de fallback
    const fallbackService = AIFallbackService.getInstance();

    const result = await fallbackService.executeWithFallback({
      instruction,
      model,
      timeout: 30000 // 30 segundos de timeout
    });

    if (result.success && result.response) {
      console.log(`[AI Service] ✅ Éxito con ${result.finalProvider} después de ${result.fallbacksUsed} fallbacks`);

      return {
        content: result.response.content,
        model: result.response.model,
        fallbackUsed: result.fallbacksUsed > 0,
        executionTime: result.totalTime,
        isProjectRequest: instruction.toLowerCase().includes('crea') &&
          (instruction.toLowerCase().includes('proyecto') ||
           instruction.toLowerCase().includes('aplicación') ||
           instruction.toLowerCase().includes('programa') ||
           instruction.toLowerCase().includes('calculadora') ||
           instruction.toLowerCase().includes('juego') ||
           instruction.toLowerCase().includes('web'))
      };
    } else {
      // Si el sistema de fallback falló completamente
      const lastAttempt = result.attempts[result.attempts.length - 1];
      const errorMessage = lastAttempt?.error || 'Todos los proveedores de IA están temporalmente no disponibles';

      console.error(`[AI Service] ❌ Sistema de fallback falló completamente: ${errorMessage}`);

      // Generar mensaje de error informativo basado en los intentos
      let detailedError = '🚫 **Todos los servicios de IA están temporalmente no disponibles**\n\n';
      detailedError += '**Intentos realizados:**\n';

      result.attempts.forEach((attempt, index) => {
        const status = attempt.success ? '✅' : '❌';
        detailedError += `${index + 1}. ${status} ${attempt.providerId} (${attempt.model})\n`;
        if (attempt.error) {
          detailedError += `   Error: ${attempt.error}\n`;
        }
      });

      detailedError += '\n**Recomendaciones:**\n';
      detailedError += '• ⏰ Espera 15-30 minutos y vuelve a intentar\n';
      detailedError += '• 🔄 Verifica tu conexión a internet\n';
      detailedError += '• 🛠️ Continúa trabajando con archivos existentes\n';
      detailedError += '• 📝 Simplifica tu solicitud y reintenta\n';

      throw new Error(detailedError);
    }
  } catch (error) {
    // Si hay un error en el sistema de fallback mismo, usar el método original como último recurso
    console.warn(`[AI Service] Error en sistema de fallback, usando método original: ${error}`);

    try {
      const response = await processInstruction(instruction, model);
      return {
        ...response,
        fallbackUsed: false
      };
    } catch (originalError) {
      console.error(`[AI Service] ❌ Método original también falló: ${originalError}`);
      throw originalError;
    }
  }
}

export async function processInstruction(instruction: string, model: string): Promise<AIResponse> {
  try {
    // Determinar si es una solicitud de proyecto completo
    const isProjectRequest = instruction.toLowerCase().includes('crea') &&
      (instruction.toLowerCase().includes('proyecto') ||
       instruction.toLowerCase().includes('aplicación') ||
       instruction.toLowerCase().includes('programa') ||
       instruction.toLowerCase().includes('calculadora') ||
       instruction.toLowerCase().includes('juego') ||
       instruction.toLowerCase().includes('web'));

    switch (model) {
      case 'GPT-4O':
        try {
          console.log('Using OpenAI GPT-4O API');
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "Eres un experto desarrollador de Python especializado en arquitectura, diseño de sistemas y algoritmos complejos."
              },
              {
                role: "user",
                content: instruction
              }
            ]
          });
          return {
            content: completion.choices[0].message.content || '',
            model: 'GPT-4O',
            isProjectRequest
          };
        } catch (error) {
          console.error('Error with OpenAI GPT-4O API:', error);
          throw error;
        }

      case 'GPT-O3 Mini':
        try {
          console.log('Using OpenAI GPT-O3 Mini API');
          const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "Eres un experto en implementación de código, optimización y depuración."
              },
              {
                role: "user",
                content: instruction
              }
            ]
          });
          return {
            content: completion.choices[0].message.content || '',
            model: 'GPT-O3 Mini',
            isProjectRequest
          };
        } catch (error) {
          console.error('Error with OpenAI GPT-O3 Mini API:', error);
          throw error;
        }

      case 'Gemini 2.5':
        try {
          console.log('Using Gemini 2.5 API');
          const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
          const result = await geminiModel.generateContent(instruction);
          const response = await result.response;
          return {
            content: response.text(),
            model: 'Gemini 2.5',
            isProjectRequest
          };
        } catch (error) {
          console.error('Error with Gemini 2.5 API:', error);
          throw error;
        }

      case 'Gemini 2.0 Flash':
        try {
          console.log('Using Gemini 2.0 Flash API');
          const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
          const result = await geminiModel.generateContent(instruction);
          const response = await result.response;
          return {
            content: response.text(),
            model: 'Gemini 2.0 Flash',
            isProjectRequest
          };
        } catch (error) {
          console.error('Error with Gemini 2.0 Flash API:', error);
          throw error;
        }

      case 'Claude 3.7':
        try {
          console.log('Using Claude 3.7 API');

          // Usar fetch directamente para tener más control sobre los encabezados
          const response = await fetch('http://localhost:3001/api/anthropic/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: "claude-3-opus-20240229",
              max_tokens: 1024,
              messages: [
                {
                  role: "user",
                  content: instruction
                }
              ]
            })
          });

          if (!response.ok) {
            throw new Error(`Error en la API de Claude: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();

          return {
            content: data.content[0].text,
            model: 'Claude 3.7',
            executionTime: Math.floor(Math.random() * 2000) + 1000, // Tiempo simulado
            isProjectRequest
          };
        } catch (error) {
          console.error('Error with Claude 3.7 API:', error);
          throw error;
        }

      case 'Claude 3.5 Sonnet V2':
        try {
          console.log('Using Claude 3.5 Sonnet V2 API');

          // Usar fetch directamente para tener más control sobre los encabezados
          const response = await fetch('http://localhost:3001/api/anthropic/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: "claude-3-sonnet-20240229",
              max_tokens: 1024,
              messages: [
                {
                  role: "user",
                  content: instruction
                }
              ]
            })
          });

          if (!response.ok) {
            throw new Error(`Error en la API de Claude: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();

          return {
            content: data.content[0].text,
            model: 'Claude 3.5 Sonnet V2',
            executionTime: Math.floor(Math.random() * 1500) + 800, // Tiempo simulado
            isProjectRequest
          };
        } catch (error) {
          console.error('Error with Claude 3.5 Sonnet V2 API:', error);
          throw error;
        }

      case 'Qwen2.5-Omni-7B':
        try {
          console.log('Using Qwen2.5-Omni-7B API');
          // Simulación de respuesta para Qwen2.5-Omni-7B (modelo local)
          // En una implementación real, esto se conectaría a un servicio local que ejecuta el modelo
          return {
            content: `# Respuesta generada por Qwen2.5-Omni-7B (modelo local)\n\n${instruction}\n\n# Código generado:\n\ndef main():\n    print("Implementación generada por Qwen2.5-Omni-7B")\n    # Aquí iría la implementación real\n\nif __name__ == "__main__":\n    main()`,
            model: 'Qwen2.5-Omni-7B',
            isProjectRequest
          };
        } catch (error) {
          console.error('Error with Qwen2.5-Omni-7B API:', error);
          throw error;
        }

      default:
        throw new Error(`Modelo desconocido: ${model}`);
    }
  } catch (error) {
    console.error('Error procesando instrucción:', error);
    if (error instanceof Error && error.message.includes('429')) {
      throw error; // Dejar que tryWithFallback maneje el error de cuota
    }
    return {
      content: '',
      model,
      error: error instanceof Error ? error.message : 'Ocurrió un error desconocido'
    };
  }
}

export { tryWithFallback };

