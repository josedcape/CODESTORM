import OpenAI from 'openai';

// Initialize AI clients
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  baseURL: 'http://localhost:3003/api/openai',
  dangerouslyAllowBrowser: true
});

export interface AIResponse {
  content: string;
  model: string;
  error?: string;
  fallbackUsed?: boolean;
  executionTime?: number;
  isProjectRequest?: boolean;
}

async function tryWithFallback(instruction: string, model: string): Promise<AIResponse> {
  try {
    // First try with the requested model
    return await processInstruction(instruction, model);
  } catch (error) {
    if (error instanceof Error && error.message.includes('429')) {
      // If we get a quota error, try with alternative models in sequence
      console.log(`${model} quota exceeded, trying fallback models...`);

      // Define fallback order - OpenAI first, then Claude models (Gemini removed)
      const fallbackOrder = [
        'GPT-4O',
        'Claude 3.5 Sonnet V2',
        'GPT-4O-Mini'
      ];

      // Try each fallback model
      for (const fallbackModel of fallbackOrder) {
        if (fallbackModel !== model) { // Skip if it's the original model
          try {
            console.log(`Trying fallback model: ${fallbackModel}`);
            const response = await processInstruction(instruction, fallbackModel);
            return {
              ...response,
              fallbackUsed: true
            };
          } catch (fallbackError) {
            console.log(`Fallback model ${fallbackModel} failed`);
            // Continue to next fallback model
          }
        }
      }
    }
    throw error;
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

      case 'GPT-4O-Mini':
        try {
          console.log('Using OpenAI GPT-4O-Mini API');
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "Eres un desarrollador de software experto especializado en generar código de alta calidad y eficiente. Tu objetivo es producir código funcional, optimizado y que siga las mejores prácticas de desarrollo."
              },
              {
                role: "user",
                content: instruction
              }
            ],
            temperature: 0.2, // Temperatura balanceada para eficiencia y creatividad
            max_tokens: 4000
          });
          return {
            content: completion.choices[0].message.content || '',
            model: 'GPT-4O-Mini',
            isProjectRequest
          };
        } catch (error) {
          console.error('Error with OpenAI GPT-4O-Mini API:', error);
          throw error;
        }



      case 'Claude 3.7':
        try {
          console.log('Using Claude 3.7 API');

          // Usar fetch directamente para tener más control sobre los encabezados
          const response = await fetch('http://localhost:3003/api/anthropic/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: "claude-3-opus-20240229",
              max_tokens: 4096,
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
          const response = await fetch('http://localhost:3003/api/anthropic/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: "claude-3-5-sonnet-20241022",
              max_tokens: 4096,
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

