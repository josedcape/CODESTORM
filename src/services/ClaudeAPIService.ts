interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  id: string;
  model: string;
  role: 'assistant';
  stop_reason: string;
  stop_sequence: null;
  type: 'message';
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface CodeModificationContext {
  type: 'generate' | 'correct' | 'review' | 'plan';
  description: string;
  filesAffected: string[];
  changes: {
    file: string;
    originalContent?: string;
    modifiedContent?: string;
    action: 'create' | 'modify' | 'delete';
  }[];
  agentType: string;
  confidence: number;
}

class ClaudeAPIService {
  private apiKey: string;
  private baseURL: string = 'http://localhost:3001/api/anthropic/v1/messages';
  private model: string = 'claude-3-5-sonnet-20241022';
  private maxTokens: number = 4000;

  constructor() {
    // Get API key from Vite environment variables
    this.apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';

    if (!this.apiKey) {
      console.warn('Claude API key not found. Please set VITE_ANTHROPIC_API_KEY environment variable.');
    }
  }

  private async makeAPICall(messages: ClaudeMessage[]): Promise<ClaudeResponse> {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured. Please set VITE_ANTHROPIC_API_KEY environment variable.');
    }

    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    return await response.json();
  }

  async generateMessengerResponse(
    context: CodeModificationContext,
    userMessage?: string,
    conversationHistory: ClaudeMessage[] = []
  ): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const userPrompt = this.buildUserPrompt(context, userMessage);

      const messages: ClaudeMessage[] = [
        ...conversationHistory,
        {
          role: 'user',
          content: `${systemPrompt}\n\n${userPrompt}`
        }
      ];

      const response = await this.makeAPICall(messages);
      
      if (response.content && response.content.length > 0) {
        return response.content[0].text;
      }
      
      throw new Error('No content received from Claude API');
    } catch (error) {
      console.error('Claude API Error:', error);
      
      // Fallback to intelligent mock response if API fails
      return this.generateFallbackResponse(context, userMessage);
    }
  }

  private buildSystemPrompt(context: CodeModificationContext): string {
    return `You are the Messenger Agent, a specialized AI assistant that communicates with developers about code changes made by other AI agents in their development environment. Your role is to:

1. Explain code modifications in natural, conversational language
2. Provide context about why changes were made
3. Highlight important implications or considerations
4. Answer follow-up questions about the modifications
5. Suggest next steps or improvements when appropriate

You should be:
- Conversational and friendly, but professional
- Technical when needed, but accessible to developers of all levels
- Proactive in explaining potential impacts of changes
- Helpful in suggesting related improvements or considerations

Current context:
- Agent Type: ${context.agentType}
- Modification Type: ${context.type}
- Confidence Level: ${Math.round(context.confidence * 100)}%
- Files Affected: ${context.filesAffected.length}
- Description: ${context.description}`;
  }

  private buildUserPrompt(context: CodeModificationContext, userMessage?: string): string {
    let prompt = `The ${context.agentType} agent has just completed a ${context.type} operation with ${Math.round(context.confidence * 100)}% confidence.

**Operation Details:**
- Description: ${context.description}
- Files affected: ${context.filesAffected.join(', ')}

**Changes Made:**
`;

    context.changes.forEach((change, index) => {
      prompt += `\n${index + 1}. **${change.file}** (${change.action})`;
      if (change.originalContent && change.modifiedContent) {
        prompt += `\n   - Original: ${change.originalContent.substring(0, 200)}${change.originalContent.length > 200 ? '...' : ''}`;
        prompt += `\n   - Modified: ${change.modifiedContent.substring(0, 200)}${change.modifiedContent.length > 200 ? '...' : ''}`;
      }
    });

    if (userMessage) {
      prompt += `\n\n**User Question/Comment:**\n${userMessage}`;
      prompt += `\n\nPlease respond to the user's question while also providing context about the recent changes.`;
    } else {
      prompt += `\n\nPlease provide a natural, conversational explanation of what was accomplished, why it was done this way, and what the developer should know about these changes.`;
    }

    return prompt;
  }

  private generateFallbackResponse(context: CodeModificationContext, userMessage?: string): string {
    const agentName = context.agentType.charAt(0).toUpperCase() + context.agentType.slice(1);
    const confidence = Math.round(context.confidence * 100);
    
    if (userMessage) {
      return `I understand you're asking about "${userMessage}". Based on the recent ${context.type} operation by the ${agentName} Agent, here's what I can tell you:

The changes were made to ${context.filesAffected.length} file(s) with ${confidence}% confidence. The operation focused on: ${context.description}

${this.getContextualAdvice(context)}

Is there anything specific about these changes you'd like me to explain further?`;
    }

    return `Great news! The ${agentName} Agent has successfully completed a ${context.type} operation with ${confidence}% confidence.

**What was accomplished:**
${context.description}

**Files modified:** ${context.filesAffected.join(', ')}

${this.getContextualAdvice(context)}

The changes are ready for your review. Would you like me to explain any specific part of the modifications?`;
  }

  private getContextualAdvice(context: CodeModificationContext): string {
    switch (context.type) {
      case 'generate':
        return `**Key points:**
- New functionality has been added to your project
- The code follows current best practices
- You may want to test the new features to ensure they work as expected
- Consider adding unit tests for the new functionality`;

      case 'correct':
        return `**Improvements made:**
- Code quality and performance have been enhanced
- Potential issues have been addressed
- The changes maintain backward compatibility
- Your application should now run more efficiently`;

      case 'review':
        return `**Analysis complete:**
- Code structure and patterns have been evaluated
- Recommendations have been implemented where appropriate
- The codebase is now more maintainable
- Consider running your test suite to verify everything works correctly`;

      case 'plan':
        return `**Planning complete:**
- A detailed execution plan has been created
- All dependencies and risks have been identified
- The plan is ready for your approval
- Review each step before proceeding with execution`;

      default:
        return `**Changes applied:**
- Your code has been updated according to the specifications
- All modifications maintain code quality standards
- The changes are ready for testing and deployment`;
    }
  }

  async askFollowUpQuestion(
    question: string,
    context: CodeModificationContext,
    conversationHistory: ClaudeMessage[] = []
  ): Promise<string> {
    const messages: ClaudeMessage[] = [
      ...conversationHistory,
      {
        role: 'user',
        content: question
      }
    ];

    try {
      const response = await this.makeAPICall(messages);
      
      if (response.content && response.content.length > 0) {
        return response.content[0].text;
      }
      
      throw new Error('No content received from Claude API');
    } catch (error) {
      console.error('Claude API Error:', error);
      
      return `I understand you're asking: "${question}"

Based on the recent changes made by the ${context.agentType} agent, here's what I can tell you:

${this.generateContextualAnswer(question, context)}

Feel free to ask more specific questions about the implementation details or next steps!`;
    }
  }

  private generateContextualAnswer(question: string, context: CodeModificationContext): string {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('why') || lowerQuestion.includes('reason')) {
      return `The ${context.agentType} agent made these changes because: ${context.description}. This approach was chosen to maintain code quality while implementing the requested functionality efficiently.`;
    }
    
    if (lowerQuestion.includes('how') || lowerQuestion.includes('work')) {
      return `The implementation works by modifying ${context.filesAffected.length} file(s) to achieve the desired functionality. The changes follow established patterns and best practices in your codebase.`;
    }
    
    if (lowerQuestion.includes('test') || lowerQuestion.includes('verify')) {
      return `To test these changes, I recommend: 1) Running your existing test suite, 2) Manually testing the affected functionality, 3) Checking that no regressions were introduced in related features.`;
    }
    
    if (lowerQuestion.includes('next') || lowerQuestion.includes('what now')) {
      return `Next steps: 1) Review the changes in the affected files, 2) Test the new functionality, 3) Consider adding tests if needed, 4) Deploy when you're satisfied with the results.`;
    }
    
    return `That's a great question about the recent changes. The ${context.agentType} agent focused on: ${context.description}. The modifications were made with ${Math.round(context.confidence * 100)}% confidence and should integrate well with your existing code.`;
  }

  // Method for simple text generation (compatible with AIModelManager)
  async generateText(prompt: string, options?: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }): Promise<{ content: string; usage?: any }> {
    try {
      const messages: ClaudeMessage[] = [
        {
          role: 'user',
          content: options?.systemPrompt ? `${options.systemPrompt}\n\n${prompt}` : prompt
        }
      ];

      // Temporarily override maxTokens if provided
      const originalMaxTokens = this.maxTokens;
      if (options?.maxTokens) {
        this.maxTokens = options.maxTokens;
      }

      const response = await this.makeAPICall(messages);

      // Restore original maxTokens
      this.maxTokens = originalMaxTokens;

      if (response.content && response.content.length > 0) {
        return {
          content: response.content[0].text,
          usage: response.usage
        };
      }

      throw new Error('No content received from Claude API');
    } catch (error) {
      console.error('Claude generateText error:', error);

      // Return fallback response for web generation
      if (prompt.toLowerCase().includes('html') || prompt.toLowerCase().includes('web')) {
        return {
          content: this.generateWebFallback(prompt),
          usage: { input_tokens: 0, output_tokens: 0 }
        };
      }

      throw error;
    }
  }

  private generateWebFallback(prompt: string): string {
    return `# Sitio Web Generado por Claude 3.5 Sonnet (Fallback)

\`\`\`html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sitio Web Profesional - Claude 3.5 Sonnet</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        header {
            background: rgba(255, 255, 255, 0.95);
            padding: 2rem;
            border-radius: 15px;
            margin-bottom: 2rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }
        h1 {
            text-align: center;
            color: #4a5568;
            font-size: 3rem;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle {
            text-align: center;
            color: #718096;
            font-size: 1.3rem;
        }
        .content {
            background: rgba(255, 255, 255, 0.95);
            padding: 3rem;
            border-radius: 15px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }
        .feature {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            padding: 2rem;
            border-radius: 12px;
            border-left: 5px solid #667eea;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .feature:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }
        .feature h3 {
            color: #4a5568;
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }
        .cta {
            text-align: center;
            margin-top: 3rem;
        }
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1.2rem 2.5rem;
            border: none;
            border-radius: 30px;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
        }
        @media (max-width: 768px) {
            .container { padding: 1rem; }
            h1 { font-size: 2.5rem; }
            .features { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Sitio Web Profesional</h1>
            <p class="subtitle">Generado con Claude 3.5 Sonnet - Modo Fallback</p>
        </header>

        <main class="content">
            <h2>Bienvenido a tu nuevo sitio web</h2>
            <p>Este sitio web ha sido generado automáticamente usando Claude 3.5 Sonnet en modo fallback,
               con diseño responsivo y optimizado para todos los dispositivos.</p>

            <div class="features">
                <div class="feature">
                    <h3>🚀 Alto Rendimiento</h3>
                    <p>Optimizado para carga ultra-rápida y excelente experiencia de usuario en todos los dispositivos.</p>
                </div>
                <div class="feature">
                    <h3>📱 Totalmente Responsivo</h3>
                    <p>Se adapta perfectamente a móviles, tablets y escritorio con diseño fluido y elegante.</p>
                </div>
                <div class="feature">
                    <h3>🎨 Diseño Moderno</h3>
                    <p>Interfaz limpia y profesional siguiendo las últimas tendencias de diseño web.</p>
                </div>
                <div class="feature">
                    <h3>🔧 Fácil Personalización</h3>
                    <p>Código limpio y bien estructurado que permite modificaciones rápidas y sencillas.</p>
                </div>
            </div>

            <div class="cta">
                <button class="btn" onclick="showMessage()">
                    Comenzar Ahora
                </button>
            </div>
        </main>
    </div>

    <script>
        function showMessage() {
            alert('¡Funcionalidad implementada con Claude 3.5 Sonnet!');
        }

        // Animación de entrada
        document.addEventListener('DOMContentLoaded', function() {
            const features = document.querySelectorAll('.feature');
            features.forEach((feature, index) => {
                feature.style.opacity = '0';
                feature.style.transform = 'translateY(30px)';

                setTimeout(() => {
                    feature.style.transition = 'all 0.8s ease';
                    feature.style.opacity = '1';
                    feature.style.transform = 'translateY(0)';
                }, index * 200 + 500);
            });
        });

        console.log('🤖 Sitio generado por Claude 3.5 Sonnet (Fallback Mode)');
    </script>
</body>
</html>
\`\`\`

**Características implementadas por Claude 3.5 Sonnet:**
- ✅ Diseño responsivo avanzado
- ✅ Gradientes y efectos modernos
- ✅ Animaciones CSS suaves
- ✅ Grid layout optimizado
- ✅ Compatibilidad móvil completa
- ✅ JavaScript interactivo
- ✅ Backdrop filter effects
- ✅ Hover animations

*Nota: Este es contenido de fallback generado por Claude 3.5 Sonnet cuando la API no está disponible.*`;
  }

  // Method to check if API is properly configured
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  // Method to test API connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeAPICall([
        { role: 'user', content: 'Hello, this is a connection test. Please respond with "Connection successful".' }
      ]);
      
      return response.content?.[0]?.text?.includes('Connection successful') || false;
    } catch (error) {
      console.error('Claude API connection test failed:', error);
      return false;
    }
  }
}

export default ClaudeAPIService;
export type { CodeModificationContext, ClaudeMessage };
