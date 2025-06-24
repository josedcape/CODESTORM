import React from 'react';
import { useTokenTracking } from '../hooks/useTokenTracking';

export interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    executionTime?: number;
    provider?: string;
  };
}

export interface TokenTrackingConfig {
  trackTokenUsage: (agentName: string, tokensUsed: number) => void;
}

// Global token tracking instance
let globalTokenTracker: TokenTrackingConfig | null = null;

export const setGlobalTokenTracker = (tracker: TokenTrackingConfig) => {
  globalTokenTracker = tracker;
};

// Extract token usage from different AI provider responses
export const extractTokenUsage = (response: any, provider: string): number => {
  try {
    switch (provider.toLowerCase()) {
      case 'openai':
        // OpenAI response format
        if (response?.usage?.total_tokens) {
          return response.usage.total_tokens;
        }
        if (response?.data?.usage?.total_tokens) {
          return response.data.usage.total_tokens;
        }
        break;

      case 'anthropic':
        // Anthropic Claude response format
        if (response?.usage?.input_tokens && response?.usage?.output_tokens) {
          return response.usage.input_tokens + response.usage.output_tokens;
        }
        if (response?.metadata?.usage?.input_tokens && response?.metadata?.usage?.output_tokens) {
          return response.metadata.usage.input_tokens + response.metadata.usage.output_tokens;
        }
        break;

      case 'google':
        // Google AI response format
        if (response?.usageMetadata?.totalTokenCount) {
          return response.usageMetadata.totalTokenCount;
        }
        break;

      case 'cohere':
        // Cohere response format
        if (response?.meta?.tokens?.input_tokens && response?.meta?.tokens?.output_tokens) {
          return response.meta.tokens.input_tokens + response.meta.tokens.output_tokens;
        }
        break;

      default:
        // Generic fallback - try common token fields
        if (response?.tokens) return response.tokens;
        if (response?.token_count) return response.token_count;
        if (response?.usage?.total_tokens) return response.usage.total_tokens;
        break;
    }

    // If no tokens found, estimate based on content length
    const content = response?.content || response?.data?.content || response?.text || '';
    if (typeof content === 'string') {
      // Rough estimation: ~4 characters per token for English text
      return Math.ceil(content.length / 4);
    }

    return 0;
  } catch (error) {
    console.warn('Error extracting token usage:', error);
    return 0;
  }
};

// Middleware function to wrap AI API calls
export const withTokenTracking = async <T>(
  agentName: string,
  apiCall: () => Promise<T>,
  provider: string = 'unknown'
): Promise<T> => {
  const startTime = Date.now();

  try {
    const result = await apiCall();
    const executionTime = Date.now() - startTime;

    // Extract token usage from the response
    let tokensUsed = 0;

    if (result && typeof result === 'object') {
      tokensUsed = extractTokenUsage(result, provider);
    }

    // Track the token usage if tracker is available
    if (globalTokenTracker && tokensUsed > 0) {
      globalTokenTracker.trackTokenUsage(agentName, tokensUsed);

      console.log(`🔢 Token Usage Tracked:`, {
        agent: agentName,
        tokens: tokensUsed,
        provider,
        executionTime: `${executionTime}ms`
      });
    }

    // Add metadata to the result if it's an object
    if (result && typeof result === 'object' && 'metadata' in result) {
      (result as any).metadata = {
        ...(result as any).metadata,
        tokensUsed,
        executionTime,
        provider,
        agentName
      };
    }

    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;

    console.error(`❌ API call failed for ${agentName}:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: `${executionTime}ms`,
      provider
    });

    throw error;
  }
};

// Decorator function for agent methods
export const trackTokens = (agentName: string, provider: string = 'unknown') => {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value;

    if (!originalMethod) return descriptor;

    descriptor.value = async function (...args: any[]) {
      return withTokenTracking(
        agentName,
        () => originalMethod.apply(this, args),
        provider
      );
    } as T;

    return descriptor;
  };
};

// Utility function to manually track tokens (for cases where automatic tracking isn't possible)
export const manualTokenTracking = (agentName: string, tokensUsed: number) => {
  if (globalTokenTracker) {
    globalTokenTracker.trackTokenUsage(agentName, tokensUsed);
    console.log(`🔢 Manual Token Tracking:`, { agent: agentName, tokens: tokensUsed });
  }
};

// Hook to initialize token tracking in components
export const useTokenTrackingMiddleware = () => {
  const tokenTracking = useTokenTracking();

  // Set up global tracker
  React.useEffect(() => {
    setGlobalTokenTracker({
      trackTokenUsage: tokenTracking.trackTokenUsage
    });

    return () => {
      globalTokenTracker = null;
    };
  }, [tokenTracking.trackTokenUsage]);

  return {
    ...tokenTracking,
    withTokenTracking,
    manualTokenTracking
  };
};

// Export types and utilities
export type {
  TokenTrackingConfig
};
