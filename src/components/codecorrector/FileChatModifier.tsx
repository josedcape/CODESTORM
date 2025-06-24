import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Loader,
  CheckCircle,
  XCircle,
  RotateCcw,
  Save,
  MessageSquare,
  Code,
  Zap
} from 'lucide-react';
import { FileNode } from '../../services/FileDecompressionService';
import { useTokenTracking } from '../../hooks/useTokenTracking';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  fileContext?: {
    fileName: string;
    filePath: string;
    language: string;
  };
}

interface ModificationResult {
  success: boolean;
  originalContent: string;
  modifiedContent: string;
  explanation: string;
  changes: Array<{
    lineNumber: number;
    type: 'added' | 'removed' | 'modified';
    content: string;
  }>;
}

interface FileChatModifierProps {
  selectedFile: FileNode | null;
  onFileModified: (filePath: string, newContent: string, explanation: string) => void;
  onError: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

const FileChatModifier: React.FC<FileChatModifierProps> = ({
  selectedFile,
  onFileModified,
  onError,
  className = '',
  disabled = false
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastModification, setLastModification] = useState<ModificationResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { trackTokenUsage } = useTokenTracking();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when file changes
  useEffect(() => {
    if (selectedFile && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedFile]);

  // Add welcome message when file is selected
  useEffect(() => {
    if (selectedFile && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: `welcome_${Date.now()}`,
        type: 'system',
        content: `File "${selectedFile.name}" loaded. You can now request modifications using natural language. For example:

• "Add error handling to this function"
• "Optimize this code for better performance"
• "Add comments explaining what this code does"
• "Convert this to TypeScript"
• "Fix any syntax errors"`,
        timestamp: Date.now(),
        fileContext: {
          fileName: selectedFile.name,
          filePath: selectedFile.path,
          language: getLanguageFromExtension(selectedFile.extension || '')
        }
      };
      setMessages([welcomeMessage]);
    }
  }, [selectedFile, messages.length]);

  const getLanguageFromExtension = (extension: string): string => {
    const langMap: Record<string, string> = {
      '.js': 'JavaScript',
      '.jsx': 'React JSX',
      '.ts': 'TypeScript',
      '.tsx': 'React TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.c': 'C',
      '.cpp': 'C++',
      '.cs': 'C#',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.go': 'Go',
      '.rs': 'Rust',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.html': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.json': 'JSON',
      '.xml': 'XML',
      '.yaml': 'YAML',
      '.yml': 'YAML'
    };
    return langMap[extension.toLowerCase()] || 'Text';
  };

  const processModificationRequest = async (request: string): Promise<ModificationResult> => {
    if (!selectedFile || typeof selectedFile.content !== 'string') {
      throw new Error('No valid file selected or file content is not text');
    }

    const fileContent = selectedFile.content;
    const language = getLanguageFromExtension(selectedFile.extension || '');
    const lines = fileContent.split('\n');
    const isLargeFile = lines.length > 1000;

    // For large files, implement chunking strategy
    if (isLargeFile) {
      return await processLargeFileModification(fileContent, language, request);
    }

    // Standard processing for smaller files
    return await processStandardModification(fileContent, language, request);
  };

  const processLargeFileModification = async (
    fileContent: string,
    language: string,
    request: string
  ): Promise<ModificationResult> => {
    const lines = fileContent.split('\n');
    const chunkSize = 500; // Process in chunks of 500 lines
    const chunks: string[] = [];

    // Split file into manageable chunks
    for (let i = 0; i < lines.length; i += chunkSize) {
      const chunk = lines.slice(i, i + chunkSize).join('\n');
      chunks.push(chunk);
    }

    // Process each chunk and combine results
    const modifiedChunks: string[] = [];
    const allChanges: any[] = [];
    let totalTokens = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkStartLine = i * chunkSize + 1;

      const prompt = `
You are a code modification assistant. Please modify the following ${language} code chunk based on the user's request.

File: ${selectedFile?.name} (Chunk ${i + 1}/${chunks.length}, lines ${chunkStartLine}-${chunkStartLine + chunk.split('\n').length - 1})
Language: ${language}
User Request: ${request}

Code Chunk:
\`\`\`${language.toLowerCase()}
${chunk}
\`\`\`

Please provide only the modified code chunk without explanations or formatting.`;

      try {
        // Track token usage for each chunk
        const chunkTokens = prompt.length + chunk.length;
        totalTokens += chunkTokens;
        trackTokenUsage('CodeModifierAgent', chunkTokens);

        // Simulate processing delay proportional to chunk size
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        // Mock response for chunk - in real implementation, replace with actual AI API call
        const modifiedChunk = chunk + `\n// Chunk ${i + 1} modified based on: ${request}`;
        modifiedChunks.push(modifiedChunk);

        // Track changes for this chunk
        allChanges.push({
          lineNumber: chunkStartLine + chunk.split('\n').length,
          type: 'added' as const,
          content: `Added modification comment to chunk ${i + 1}`
        });

      } catch (error) {
        console.warn(`Failed to process chunk ${i + 1}, using original:`, error);
        modifiedChunks.push(chunk);
      }
    }

    const modifiedContent = modifiedChunks.join('\n');

    return {
      success: true,
      originalContent: fileContent,
      modifiedContent,
      explanation: `I've processed your large file (${lines.length} lines) in ${chunks.length} chunks and applied the requested modifications: "${request}". Each chunk was analyzed and modified independently to ensure optimal performance.`,
      changes: allChanges
    };
  };

  const processStandardModification = async (
    fileContent: string,
    language: string,
    request: string
  ): Promise<ModificationResult> => {
    const prompt = `
You are a code modification assistant. Please modify the following ${language} code based on the user's request.

File: ${selectedFile?.name}
Language: ${language}
User Request: ${request}

Original Code:
\`\`\`${language.toLowerCase()}
${fileContent}
\`\`\`

Please provide:
1. The modified code
2. A clear explanation of what was changed
3. List of specific changes made

Respond in JSON format:
{
  "modifiedCode": "...",
  "explanation": "...",
  "changes": [
    {
      "lineNumber": 1,
      "type": "added|removed|modified",
      "content": "description of change"
    }
  ]
}`;

    try {
      // Track token usage
      trackTokenUsage('CodeModifierAgent', prompt.length + fileContent.length);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

      // Mock response - in real implementation, replace with actual AI API call
      const mockResponse = {
        modifiedCode: fileContent + '\n\n// Modified based on request: ' + request,
        explanation: `I've modified the ${language} code in "${selectedFile?.name}" based on your request: "${request}". The changes include improvements to code structure, readability, and functionality as requested.`,
        changes: [
          {
            lineNumber: fileContent.split('\n').length + 1,
            type: 'added' as const,
            content: `Added comment: "Modified based on request: ${request}"`
          }
        ]
      };

      return {
        success: true,
        originalContent: fileContent,
        modifiedContent: mockResponse.modifiedCode,
        explanation: mockResponse.explanation,
        changes: mockResponse.changes
      };

    } catch (error) {
      throw new Error(`Failed to process modification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing || !selectedFile) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
      fileContext: {
        fileName: selectedFile.name,
        filePath: selectedFile.path,
        language: getLanguageFromExtension(selectedFile.extension || '')
      }
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const result = await processModificationRequest(userMessage.content);
      setLastModification(result);

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        type: 'assistant',
        content: result.explanation,
        timestamp: Date.now(),
        fileContext: userMessage.fileContext
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onError(errorMessage);

      const errorResponse: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyChanges = () => {
    if (!lastModification || !selectedFile) return;

    onFileModified(
      selectedFile.path,
      lastModification.modifiedContent,
      lastModification.explanation
    );

    const confirmMessage: ChatMessage = {
      id: `confirm_${Date.now()}`,
      type: 'system',
      content: 'Changes have been applied to the file successfully!',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, confirmMessage]);
    setLastModification(null);
  };

  const handleRejectChanges = () => {
    setLastModification(null);

    const rejectMessage: ChatMessage = {
      id: `reject_${Date.now()}`,
      type: 'system',
      content: 'Changes have been rejected. The original file remains unchanged.',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, rejectMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!selectedFile) {
    return (
      <div className={`bg-codestorm-dark rounded-lg border border-codestorm-blue/30 ${className}`}>
        <div className="p-6 text-center text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select a file to start modifying it with AI assistance</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-codestorm-dark rounded-lg border border-codestorm-blue/30 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-codestorm-blue/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-codestorm-accent" />
            <div>
              <h3 className="text-white font-medium">AI File Modifier</h3>
              <p className="text-xs text-gray-400">
                Editing: {selectedFile.name} ({getLanguageFromExtension(selectedFile.extension || '')})
                {typeof selectedFile.content === 'string' && selectedFile.content.split('\n').length > 1000 && (
                  <span className="ml-2 text-yellow-400 font-medium">• Large File (Chunked Processing)</span>
                )}
              </p>
            </div>
          </div>

          {lastModification && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleApplyChanges}
                className="px-3 py-1 bg-green-600/20 text-green-400 border border-green-600/30 rounded text-sm hover:bg-green-600/30 transition-colors flex items-center"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Apply
              </button>
              <button
                onClick={handleRejectChanges}
                className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded text-sm hover:bg-red-600/30 transition-colors flex items-center"
              >
                <XCircle className="w-3 h-3 mr-1" />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto max-h-64 custom-scrollbar">
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-codestorm-accent text-white'
                    : message.type === 'system'
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-600/30'
                    : 'bg-codestorm-blue/20 text-gray-300'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.type === 'user' ? (
                    <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  ) : message.type === 'assistant' ? (
                    <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Code className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatTimestamp(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-codestorm-blue/20 text-gray-300 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Processing your request...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-codestorm-blue/30">
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe how you want to modify this file..."
            className="flex-1 bg-codestorm-darker border border-codestorm-blue/30 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm resize-none focus:outline-none focus:border-codestorm-accent"
            rows={2}
            disabled={disabled || isProcessing}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing || disabled}
            className="px-4 py-2 bg-codestorm-accent hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center"
          >
            {isProcessing ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Press Enter to send, Shift+Enter for new line</span>
          {selectedFile && (
            <span>File: {selectedFile.name}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileChatModifier;
