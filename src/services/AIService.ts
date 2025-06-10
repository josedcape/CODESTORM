import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API client
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

/**
 * Llama a la API de Gemini con un prompt y opciones
 * @param prompt Prompt a enviar a la API
 * @param options Opciones de generación
 * @returns Texto generado por la API
 */
export async function callGeminiAPI(prompt: string, options?: {
  temperature?: number;
  maxOutputTokens?: number;
  topK?: number;
  topP?: number;
}): Promise<string> {
  try {
    console.log('Llamando a la API de Gemini con prompt:', prompt.substring(0, 100) + '...');

    // Verificar si hay API key
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error('API Key de Gemini no configurada');
    }

    // Configurar el modelo de Gemini
    const geminiModel = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: options?.temperature || 0.7,
        maxOutputTokens: options?.maxOutputTokens || 8192,
        topK: options?.topK || 40,
        topP: options?.topP || 0.95,
      }
    });

    // Generar contenido con retry automático
    let lastError: Error | null = null;
    const maxRetries = 2;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;

        // Verificar si la respuesta fue bloqueada
        if (response.promptFeedback?.blockReason) {
          throw new Error(`Contenido bloqueado: ${response.promptFeedback.blockReason}`);
        }

        const text = response.text();

        if (!text || text.trim().length === 0) {
          throw new Error('Gemini devolvió contenido vacío');
        }

        console.log('Respuesta de Gemini recibida:', text.substring(0, 100) + '...');
        return text;

      } catch (attemptError) {
        lastError = attemptError as Error;
        console.warn(`Intento ${attempt}/${maxRetries} falló:`, lastError.message);

        // Si es error 429, esperar antes del siguiente intento
        if (lastError.message.includes('429') && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // Backoff exponencial
          console.log(`Esperando ${waitTime}ms antes del siguiente intento...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (attempt < maxRetries) {
          // Para otros errores, esperar menos tiempo
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    throw lastError || new Error('Error desconocido en Gemini API');

  } catch (error) {
    console.error('Error al llamar a la API de Gemini:', error);

    // Mejorar el mensaje de error basado en el tipo
    let errorMessage = 'Error al llamar a la API de Gemini';

    if (error instanceof Error) {
      if (error.message.includes('429')) {
        errorMessage = 'Límite de tasa de Gemini excedido (429)';
      } else if (error.message.includes('401')) {
        errorMessage = 'API Key de Gemini inválida (401)';
      } else if (error.message.includes('403')) {
        errorMessage = 'Acceso denegado a Gemini API (403)';
      } else if (error.message.includes('quota')) {
        errorMessage = 'Cuota de Gemini API agotada';
      } else {
        errorMessage = `Gemini API Error: ${error.message}`;
      }
    }

    throw new Error(errorMessage);
  }
}
