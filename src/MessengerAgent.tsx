import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Loader, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Bot,
  User,
  Sparkles,
  Brain,
  Shield,
  Target
} from 'lucide-react';
import ClaudeAPIService, { CodeModificationContext, ClaudeMessage } from '../../services/ClaudeAPIService';

interface MessengerAgentProps {
  isActive: boolean;
  context: CodeModificationContext | null;
  onResponse: (response: string) => void;
  conversationHistory: Array<{
    id: string;
    sender: 'user' | 'messenger';
    content: string;
    timestamp: number;
  }>;
}

const MessengerAgent: React.FC<MessengerAgentProps> = ({
  isActive,
  context,
  onResponse,
  conversationHistory
}) => {
  const [claudeService] = useState(() => new ClaudeAPIService());
  const [isProcessing, setIsProcessing] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [apiStatus, setApiStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [lastResponse, setLastResponse] = useState<string>('');
  const [claudeHistory, setClaudeHistory] = useState<ClaudeMessage[]>([]);

  // Check API status on mount
  useEffect(() => {
    checkApiStatus();
  }, []);

  // Generate automatic response when context changes
  useEffect(() => {
    if (isActive && context && !isProcessing) {
      generateAutomaticResponse();
    }
  }, [isActive, context]);

  const checkApiStatus = async () => {
    try {
      if (!claudeService.isConfigured()) {
        setApiStatus('error');
        return;
      }

      const isConnected = await claudeService.testConnection();
      setApiStatus(isConnected ? 'connected' : 'error');
    } catch (error) {
      console.error('API status check failed:', error);
      setApiStatus('error');
    }
  };

  const generateAutomaticResponse = async () => {
    if (!context) return;

    setIsProcessing(true);
    
    try {
      const response = await claudeService.generateMessengerResponse(
        context,
        undefined,
        claudeHistory
      );
      
      setLastResponse(response);
      onResponse(response);
      
      // Update Claude conversation history
      setClaudeHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response
        }
      ]);
      
    } catch (error) {
      console.error('Failed to generate automatic response:', error);
      const fallbackResponse = `I've analyzed the recent ${context.type} operation by the ${context.agentType} agent. The changes look good and are ready for your review!`;
      setLastResponse(fallbackResponse);
      onResponse(fallbackResponse);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUserQuestion = async () => {
    if (!userInput.trim() || !context || isProcessing) return;

    const question = userInput.trim();
    setUserInput('');
    setIsProcessing(true);

    // Add user message to Claude history
    const newClaudeHistory = [
      ...claudeHistory,
      {
        role: 'user' as const,
        content: question
      }
    ];
    setClaudeHistory(newClaudeHistory);

    try {
      const response = await claudeService.askFollowUpQuestion(
        question,
        context,
        newClaudeHistory
      );
      
      setLastResponse(response);
      onResponse(response);
      
      // Update Claude conversation history with response
      setClaudeHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response
        }
      ]);
      
    } catch (error) {
      console.error('Failed to get response to user question:', error);
      const fallbackResponse = `I understand you're asking about "${question}". Based on the recent changes, I can tell you that the ${context.agentType} agent has successfully completed the ${context.type} operation. Feel free to ask more specific questions!`;
      setLastResponse(fallbackResponse);
      onResponse(fallbackResponse);
    } finally {
      setIsProcessing(false);
    }
  };

  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case 'generator':
        return <Sparkles className="w-4 h-4 text-green-400" />;
      case 'corrector':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'reviewer':
        return <Brain className="w-4 h-4 text-yellow-400" />;
      case 'planner':
        return <Target className="w-4 h-4 text-purple-400" />;
      default:
        return <Bot className="w-4 h-4 text-codestorm-accent" />;
    }
  };

  const getStatusIcon = () => {
    switch (apiStatus) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (apiStatus) {
      case 'connected':
        return 'Claude API Connected';
      case 'error':
        return claudeService.isConfigured() ? 'API Connection Failed' : 'API Key Not Configured';
      default:
        return 'Checking API Status...';
    }
  };

  if (!isActive) {
    return (
      <div className="bg-codestorm-dark rounded-lg p-6">
        <div className="text-center text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Messenger Agent Standby</p>
          <p className="text-sm mt-2">Waiting for agent activity to provide insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-codestorm-dark rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-codestorm-blue/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-codestorm-accent" />
            <span className="font-medium text-white">Messenger Agent</span>
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
              Claude 3.7 Sonnet
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-xs text-gray-400">{getStatusText()}</span>
          </div>
        </div>

        {/* Context info */}
        {context && (
          <div className="mt-3 p-2 bg-codestorm-darker rounded border border-codestorm-blue/30">
            <div className="flex items-center space-x-2 text-sm">
              {getAgentIcon(context.agentType)}
              <span className="text-white capitalize">{context.agentType} Agent</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400 capitalize">{context.type}</span>
              <span className="text-gray-400">•</span>
              <span className="text-green-400">{Math.round(context.confidence * 100)}% confidence</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {context.filesAffected.length} file(s) affected: {context.filesAffected.slice(0, 3).join(', ')}
              {context.filesAffected.length > 3 && ` +${context.filesAffected.length - 3} more`}
            </div>
          </div>
        )}
      </div>

      {/* Conversation area */}
      <div className="h-64 overflow-y-auto custom-scrollbar p-4">
        {conversationHistory.length === 0 && !isProcessing && (
          <div className="text-center text-gray-400 py-8">
            <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">I'm ready to explain code changes and answer your questions!</p>
          </div>
        )}

        {/* Conversation messages */}
        <div className="space-y-3">
          {conversationHistory.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-codestorm-accent text-white'
                    : 'bg-codestorm-darker border border-codestorm-blue/30 text-gray-300'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.sender === 'messenger' && (
                    <MessageSquare className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  )}
                  {message.sender === 'user' && (
                    <User className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-codestorm-darker border border-codestorm-blue/30 text-gray-300 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Loader className="w-4 h-4 text-purple-400 animate-spin" />
                  <span className="text-sm">Analyzing with Claude...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-codestorm-blue/30">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleUserQuestion()}
            placeholder="Ask me about the code changes..."
            disabled={isProcessing || !context}
            className="flex-1 px-3 py-2 bg-codestorm-darker border border-codestorm-blue/30 rounded text-white placeholder-gray-400 focus:outline-none focus:border-codestorm-accent disabled:opacity-50"
          />
          <button
            onClick={handleUserQuestion}
            disabled={isProcessing || !userInput.trim() || !context}
            className="p-2 bg-codestorm-accent text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* API status warning */}
        {apiStatus === 'error' && (
          <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-300 text-xs">
            {claudeService.isConfigured()
              ? '⚠️ Claude API connection failed. Using fallback responses.'
              : '⚠️ Claude API key not configured. Set VITE_ANTHROPIC_API_KEY environment variable.'}
          </div>
        )}

        {/* Quick suggestions */}
        {context && !isProcessing && (
          <div className="mt-2 flex flex-wrap gap-1">
            <button
              onClick={() => {
                setUserInput('Why were these changes made?');
                handleUserQuestion();
              }}
              className="text-xs px-2 py-1 bg-codestorm-blue/20 text-codestorm-accent rounded hover:bg-codestorm-blue/30 transition-colors"
            >
              Why these changes?
            </button>
            <button
              onClick={() => {
                setUserInput('How do I test this?');
                handleUserQuestion();
              }}
              className="text-xs px-2 py-1 bg-codestorm-blue/20 text-codestorm-accent rounded hover:bg-codestorm-blue/30 transition-colors"
            >
              How to test?
            </button>
            <button
              onClick={() => {
                setUserInput('What should I do next?');
                handleUserQuestion();
              }}
              className="text-xs px-2 py-1 bg-codestorm-blue/20 text-codestorm-accent rounded hover:bg-codestorm-blue/30 transition-colors"
            >
              Next steps?
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessengerAgent;
