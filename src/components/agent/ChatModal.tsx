import React, { useState, useEffect, useRef } from 'react';
import { X, Minimize2, Maximize2, MessageSquare, Settings, History } from 'lucide-react';
import EnhancedChatInterface from './EnhancedChatInterface';
import TypingIndicator from './TypingIndicator';
import { ChatMessage, FileItem } from '../../types';

interface ChatModalProps {
  isVisible: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  isProcessing: boolean;
  processingStage?: 'analyzing' | 'processing' | 'generating' | 'finalizing';
  processingProgress?: number;
  onFileClick?: (file: FileItem) => void;
  onCopyCode?: (code: string) => void;
  title?: string;
  subtitle?: string;
}

const ChatModal: React.FC<ChatModalProps> = ({
  isVisible,
  onClose,
  messages,
  isProcessing,
  processingStage = 'processing',
  processingProgress = 0,
  onFileClick,
  onCopyCode,
  title = "Chat Inteligente del Sistema",
  subtitle = "Interacción avanzada con el agente de desarrollo"
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset position when modal opens
  useEffect(() => {
    if (isVisible) {
      setPosition({ x: 0, y: 0 });
      setIsMinimized(false);
    }
  }, [isVisible]);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || isMaximized) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Constrain to viewport
    const maxX = window.innerWidth - 400; // Modal width
    const maxY = window.innerHeight - 600; // Modal height
    
    setPosition({
      x: Math.max(-200, Math.min(maxX, newX)),
      y: Math.max(0, Math.min(maxY, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, position, isMaximized]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const modalClasses = `
    fixed z-50 bg-codestorm-darker border border-codestorm-blue/30 rounded-lg shadow-2xl
    transition-all duration-300 ease-out
    ${isMaximized 
      ? 'inset-4' 
      : isMinimized 
        ? 'w-80 h-12' 
        : 'w-96 h-[600px] md:w-[500px] md:h-[700px] lg:w-[600px] lg:h-[800px]'
    }
    ${!isMaximized && !isMinimized ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' : ''}
  `;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={modalClasses}
        style={
          !isMaximized && !isMinimized
            ? {
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`
              }
            : isMinimized
            ? {
                bottom: '20px',
                right: '20px',
                transform: 'none'
              }
            : {}
        }
      >
        {/* Header */}
        <div 
          className={`
            flex items-center justify-between p-4 border-b border-codestorm-blue/30 cursor-move
            ${isMinimized ? 'rounded-lg' : 'rounded-t-lg'}
          `}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            {!isMinimized && (
              <div>
                <h3 className="text-white font-semibold text-lg">{title}</h3>
                <p className="text-gray-400 text-sm">{subtitle}</p>
              </div>
            )}
            {isMinimized && (
              <span className="text-white font-medium">Chat ({messages.length})</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Minimize/Restore button */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded-md transition-colors"
              title={isMinimized ? 'Restaurar' : 'Minimizar'}
            >
              <Minimize2 className="w-4 h-4" />
            </button>

            {/* Maximize/Restore button */}
            {!isMinimized && (
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded-md transition-colors"
                title={isMaximized ? 'Restaurar' : 'Maximizar'}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-md transition-colors"
              title="Cerrar chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chat Interface */}
            <div className="flex-1 overflow-hidden">
              <EnhancedChatInterface
                messages={messages}
                isProcessing={isProcessing}
                onFileClick={onFileClick}
                onCopyCode={onCopyCode}
              />
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="p-3 border-t border-codestorm-blue/20 bg-codestorm-dark">
                <TypingIndicator
                  isVisible={isProcessing}
                  stage={processingStage}
                  progress={processingProgress}
                />
              </div>
            )}

            {/* Footer with stats */}
            <div className="p-3 border-t border-codestorm-blue/20 bg-codestorm-dark">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>{messages.length} mensajes</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <History className="w-3 h-3" />
                    <span>Sesión activa</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {isProcessing && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span>Procesando...</span>
                    </div>
                  )}
                  <span>ESC para cerrar</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatModal;
