import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, FileItem } from '../../types';
import { 
  User, 
  Bot, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Copy,
  Check,
  Clock,
  Loader2,
  Sparkles
} from 'lucide-react';

interface EnhancedChatInterfaceProps {
  messages: ChatMessage[];
  isProcessing: boolean;
  onFileClick?: (file: FileItem) => void;
  onCopyCode?: (code: string) => void;
}

interface TypingIndicatorProps {
  isVisible: boolean;
}

interface StreamingMessageProps {
  content: string;
  isComplete: boolean;
}

interface ExpandableSection {
  id: string;
  title: string;
  content: string;
  isExpanded: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="flex items-center space-x-2 p-3 bg-codestorm-darker rounded-lg mr-4">
      <Bot className="w-4 h-4 text-green-400" />
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm text-gray-400">El agente está procesando...</span>
    </div>
  );
};

const StreamingMessage: React.FC<StreamingMessageProps> = ({ content, isComplete }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isComplete) {
      setDisplayedContent(content);
      return;
    }

    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(content.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 20); // Adjust speed as needed

      return () => clearTimeout(timer);
    }
  }, [content, currentIndex, isComplete]);

  return (
    <div className="relative">
      <span className="whitespace-pre-wrap">{displayedContent}</span>
      {!isComplete && currentIndex < content.length && (
        <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-1" />
      )}
    </div>
  );
};

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  messages,
  isProcessing,
  onFileClick,
  onCopyCode
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleCopy = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set([...prev, itemId]));
      onCopyCode?.(text);
      
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const parseMessageContent = (content: string) => {
    // Parse file references like [file:path/to/file.js]
    const fileRegex = /\[file:([^\]]+)\]/g;
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const changeListRegex = /🔧 Cambios aplicados:\n((?:• [^\n]+\n?)+)/g;

    let parsedContent = content;
    const fileReferences: { path: string; id: string }[] = [];
    const codeBlocks: { language: string; code: string; id: string }[] = [];
    const changeLists: { changes: string[]; id: string }[] = [];

    // Extract file references
    let fileMatch;
    while ((fileMatch = fileRegex.exec(content)) !== null) {
      const filePath = fileMatch[1];
      const id = `file-${Date.now()}-${Math.random()}`;
      fileReferences.push({ path: filePath, id });
    }

    // Extract code blocks
    let codeMatch;
    while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
      const language = codeMatch[1] || 'text';
      const code = codeMatch[2];
      const id = `code-${Date.now()}-${Math.random()}`;
      codeBlocks.push({ language, code, id });
    }

    // Extract change lists
    let changeMatch;
    while ((changeMatch = changeListRegex.exec(content)) !== null) {
      const changesText = changeMatch[1];
      const changes = changesText.split('\n').filter(line => line.trim().startsWith('•')).map(line => line.trim().substring(1).trim());
      const id = `changes-${Date.now()}-${Math.random()}`;
      changeLists.push({ changes, id });
    }

    return {
      parsedContent,
      fileReferences,
      codeBlocks,
      changeLists
    };
  };

  const renderMessage = (message: ChatMessage) => {
    const { parsedContent, fileReferences, codeBlocks, changeLists } = parseMessageContent(message.content);
    const isUser = message.sender === 'user';
    const isStreaming = message.type === 'streaming';

    return (
      <div
        key={message.id}
        className={`p-4 rounded-lg ${
          isUser
            ? 'bg-codestorm-accent/20 text-white ml-8'
            : 'bg-codestorm-darker text-gray-300 mr-8'
        } ${message.type === 'error' ? 'border-l-4 border-red-500' : ''}
        ${message.type === 'success' ? 'border-l-4 border-green-500' : ''}
        ${message.type === 'warning' ? 'border-l-4 border-yellow-500' : ''}`}
      >
        <div className="flex items-start space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser ? 'bg-codestorm-accent' : 'bg-green-500'
          }`}>
            {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-medium text-sm">
                {isUser ? 'Usuario' : 'Agente CODESTORM'}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
              {message.type === 'notification' && (
                <Sparkles className="w-4 h-4 text-blue-400" />
              )}
            </div>
            
            <div className="space-y-3">
              {/* Main content */}
              <div className="text-sm leading-relaxed">
                {isStreaming ? (
                  <StreamingMessage 
                    content={parsedContent} 
                    isComplete={message.type !== 'streaming'} 
                  />
                ) : (
                  <span className="whitespace-pre-wrap">{parsedContent}</span>
                )}
              </div>

              {/* File references */}
              {fileReferences.length > 0 && (
                <div className="space-y-2">
                  {fileReferences.map(({ path, id }) => (
                    <button
                      key={id}
                      onClick={() => onFileClick?.({ path, name: path.split('/').pop() || path } as FileItem)}
                      className="flex items-center space-x-2 px-3 py-2 bg-codestorm-blue/20 rounded-md hover:bg-codestorm-blue/30 transition-colors text-sm"
                    >
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-300">{path}</span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}

              {/* Code blocks */}
              {codeBlocks.length > 0 && (
                <div className="space-y-3">
                  {codeBlocks.map(({ language, code, id }) => (
                    <div key={id} className="bg-black/50 rounded-md overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
                        <span className="text-xs text-gray-400">{language}</span>
                        <button
                          onClick={() => handleCopy(code, id)}
                          className="flex items-center space-x-1 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          {copiedItems.has(id) ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3 text-sm overflow-x-auto">
                        <code className="text-gray-300">{code}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              {/* Change lists */}
              {changeLists.length > 0 && (
                <div className="space-y-2">
                  {changeLists.map(({ changes, id }) => (
                    <div key={id} className="bg-yellow-900/20 border border-yellow-500/30 rounded-md">
                      <button
                        onClick={() => toggleSection(id)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-yellow-900/30 transition-colors"
                      >
                        <span className="text-sm font-medium text-yellow-300">
                          Detalles de cambios ({changes.length} modificaciones)
                        </span>
                        {expandedSections.has(id) ? (
                          <ChevronUp className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-yellow-400" />
                        )}
                      </button>
                      
                      {expandedSections.has(id) && (
                        <div className="px-3 pb-3 space-y-1">
                          {changes.map((change, index) => (
                            <div key={index} className="flex items-start space-x-2 text-sm">
                              <span className="text-yellow-400 mt-1">•</span>
                              <span className="text-gray-300">{change}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map(renderMessage)}
        
        {/* Typing indicator */}
        <TypingIndicator isVisible={isProcessing} />
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default EnhancedChatInterface;
