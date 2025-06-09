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
    
    // Configurar el modelo de Gemini
    const geminiModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: options?.temperature || 0.7,
        maxOutputTokens: options?.maxOutputTokens || 8192,
        topK: options?.topK || 40,
        topP: options?.topP || 0.95,
      }
    });
    
    // Generar contenido
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Respuesta de Gemini recibida:', text.substring(0, 100) + '...');
    
    return text;
  } catch (error) {
    console.error('Error al llamar a la API de Gemini:', error);
    throw new Error(`Error al llamar a la API de Gemini: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}
