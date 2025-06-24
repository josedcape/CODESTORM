import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Minimize2, Maximize2, Bot } from 'lucide-react';

interface FloatingChatButtonProps {
  onClick: () => void;
  isVisible: boolean;
  hasUnreadMessages?: boolean;
  messageCount?: number;
  isProcessing?: boolean;
}

const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({
  onClick,
  isVisible,
  hasUnreadMessages = false,
  messageCount = 0,
  isProcessing = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

  // Show pulse animation when processing or has unread messages
  useEffect(() => {
    setShowPulse(isProcessing || hasUnreadMessages);
  }, [isProcessing, hasUnreadMessages]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap transform transition-all duration-200 ease-out">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>
              {isProcessing ? 'Agente procesando...' : 'Abrir chat inteligente'}
            </span>
          </div>
          {messageCount > 0 && (
            <div className="text-xs text-gray-300 mt-1">
              {messageCount} mensaje{messageCount !== 1 ? 's' : ''}
            </div>
          )}
          {/* Tooltip arrow */}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}

      {/* Main button */}
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative w-14 h-14 bg-gradient-to-r from-green-500 to-blue-500 rounded-full shadow-lg
          hover:shadow-xl transform transition-all duration-300 ease-out
          ${isHovered ? 'scale-110' : 'scale-100'}
          ${showPulse ? 'animate-pulse' : ''}
          focus:outline-none focus:ring-4 focus:ring-green-500/30
        `}
      >
        {/* Background glow effect */}
        <div className={`
          absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-blue-500 opacity-20 blur-lg
          transition-opacity duration-300
          ${isHovered ? 'opacity-40' : 'opacity-20'}
        `} />
        
        {/* Main icon */}
        <div className="relative flex items-center justify-center w-full h-full">
          {isProcessing ? (
            <Bot className="w-6 h-6 text-white animate-bounce" />
          ) : (
            <MessageSquare className="w-6 h-6 text-white" />
          )}
        </div>

        {/* Unread messages indicator */}
        {hasUnreadMessages && messageCount > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <span className="text-white text-xs font-bold">
              {messageCount > 99 ? '99+' : messageCount}
            </span>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping" />
        )}

        {/* Ripple effect on click */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-white opacity-0 hover:opacity-20 transition-opacity duration-200" />
        </div>
      </button>

      {/* Floating particles effect when processing */}
      {isProcessing && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`
                absolute w-2 h-2 bg-green-400 rounded-full opacity-60
                animate-ping
              `}
              style={{
                top: `${20 + i * 15}%`,
                left: `${20 + i * 20}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FloatingChatButton;
