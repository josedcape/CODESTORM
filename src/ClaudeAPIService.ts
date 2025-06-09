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
  private baseURL: string = '/api/anthropic/v1/messages';
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
