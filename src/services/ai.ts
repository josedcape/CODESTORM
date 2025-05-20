import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

// Initialize AI clients
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
});

export interface AIResponse {
  content: string;
  model: string;
  error?: string;
  fallbackUsed?: boolean;
}

async function tryWithFallback(instruction: string, model: string): Promise<AIResponse> {
  try {
    // First try with the requested model
    return await processInstruction(instruction, model);
  } catch (error) {
    if (error instanceof Error && error.message.includes('429')) {
      // If we get a quota error and the original model was GPT-4O,
      // try with alternative models in sequence
      if (model === 'GPT-4O') {
        console.log('OpenAI quota exceeded, trying Gemini...');
        try {
          const geminiResponse = await processInstruction(instruction, 'GPT-O3 Mini');
          return {
            ...geminiResponse,
            fallbackUsed: true
          };
        } catch (geminiError) {
          console.log('Gemini failed, trying Anthropic...');
          try {
            const anthropicResponse = await processInstruction(instruction, 'Gemini 2.5');
            return {
              ...anthropicResponse,
              fallbackUsed: true
            };
          } catch (anthropicError) {
            throw new Error('All available AI providers failed. Please try again later.');
          }
        }
      }
    }
    throw error;
  }
}

export async function processInstruction(instruction: string, model: string): Promise<AIResponse> {
  try {
    switch (model) {
      case 'GPT-4O':
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an expert Python developer specializing in architecture, system design, and complex algorithms."
            },
            {
              role: "user",
              content: instruction
            }
          ]
        });
        return {
          content: completion.choices[0].message.content || '',
          model: 'GPT-4O'
        };

      case 'GPT-O3 Mini':
        const geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await geminiModel.generateContent(instruction);
        const response = await result.response;
        return {
          content: response.text(),
          model: 'GPT-O3 Mini'
        };

      case 'Gemini 2.5':
        const msg = await anthropic.messages.create({
          model: "claude-3-opus-20240229",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: instruction
            }
          ]
        });
        return {
          content: msg.content[0].text,
          model: 'Gemini 2.5'
        };

      default:
        throw new Error(`Unknown model: ${model}`);
    }
  } catch (error) {
    console.error('Error processing instruction:', error);
    if (error instanceof Error && error.message.includes('429')) {
      throw error; // Let tryWithFallback handle the quota error
    }
    return {
      content: '',
      model,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export { tryWithFallback }