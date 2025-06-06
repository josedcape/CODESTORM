/**
 * Componente de Mensaje de Chat con Síntesis de Voz Integrada
 * Proporciona mensajes de chat con controles de síntesis de voz y resaltado de texto
 */

import React, { useState, useRef, useEffect } from 'react';
import { User, Bot, Volume2, VolumeX } from 'lucide-react';
import SpeechControls from './SpeechControls';

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  metadata?: {
    agent?: string;
    type?: string;
    [key: string]: any;
  };
}

export interface ChatMessageWithSpeechProps {
  message: ChatMessage;
  enableSpeech?: boolean;
  autoPlaySpeech?: boolean;
  showTimestamp?: boolean;
  className?: string;
  onSpeechStart?: (messageId: string) => void;
  onSpeechEnd?: (messageId: string) => void;
  onSpeechError?: (messageId: string, error: string) => void;
}

const ChatMessageWithSpeech: React.FC<ChatMessageWithSpeechProps> = ({
  message,
  enableSpeech = true,
  autoPlaySpeech = false,
  showTimestamp = true,
  className = '',
  onSpeechStart,
  onSpeechEnd,
  onSpeechError
}) => {
  const [highlightedText, setHighlightedText] = useState<string>('');
  const [highlightRange, setHighlightRange] = useState<{ start: number; end: number } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Manejar resaltado de texto durante síntesis
  const handleHighlight = (charIndex: number, charLength: number) => {
    if (!contentRef.current) return;

    const text = message.content;
    const start = Math.max(0, charIndex);
    const end = Math.min(text.length, charIndex + charLength);
    
    setHighlightRange({ start, end });
    
    // Actualizar texto resaltado
    const before = text.substring(0, start);
    const highlighted = text.substring(start, end);
    const after = text.substring(end);
    
    setHighlightedText(`${before}<mark class="bg-codestorm-accent/30 text-codestorm-accent rounded px-1">${highlighted}</mark>${after}`);
  };

  // Limpiar resaltado cuando termine la síntesis
  const handleSpeechEnd = () => {
    setHighlightedText('');
    setHighlightRange(null);
    onSpeechEnd?.(message.id);
  };

  // Formatear timestamp
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Determinar si debe mostrar controles de voz (solo para mensajes del bot)
  const shouldShowSpeechControls = enableSpeech && !message.isUser && message.content.trim().length > 0;

  return (
    <div className={`flex gap-3 p-4 rounded-lg transition-all duration-300 ${
      message.isUser 
        ? 'bg-codestorm-accent/10 border-l-4 border-codestorm-accent ml-8' 
        : 'bg-codestorm-darker/50 border-l-4 border-gray-600 mr-8'
    } ${className}`}>
      
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        message.isUser 
          ? 'bg-codestorm-accent text-white' 
          : 'bg-gray-600 text-gray-200'
      }`}>
        {message.isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Contenido del mensaje */}
      <div className="flex-1 min-w-0">
        {/* Header del mensaje */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${
              message.isUser ? 'text-codestorm-accent' : 'text-gray-300'
            }`}>
              {message.isUser ? 'Tú' : (message.metadata?.agent || 'Asistente')}
            </span>
            
            {showTimestamp && (
              <span className="text-xs text-gray-500">
                {formatTimestamp(message.timestamp)}
              </span>
            )}
          </div>

          {/* Controles de síntesis de voz */}
          {shouldShowSpeechControls && (
            <SpeechControls
              text={message.content}
              autoPlay={autoPlaySpeech}
              compact={true}
              showSettings={false}
              className="opacity-70 hover:opacity-100 transition-opacity"
              onSpeechStart={() => onSpeechStart?.(message.id)}
              onSpeechEnd={handleSpeechEnd}
              onSpeechError={(error) => onSpeechError?.(message.id, error)}
              highlightCallback={handleHighlight}
            />
          )}
        </div>

        {/* Contenido del mensaje con resaltado */}
        <div 
          ref={contentRef}
          className="text-gray-200 leading-relaxed whitespace-pre-wrap break-words"
          dangerouslySetInnerHTML={
            highlightedText 
              ? { __html: highlightedText }
              : undefined
          }
        >
          {!highlightedText && message.content}
        </div>

        {/* Metadata adicional */}
        {message.metadata && Object.keys(message.metadata).length > 1 && (
          <div className="mt-2 pt-2 border-t border-gray-700/50">
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-400">
                Información adicional
              </summary>
              <div className="mt-1 space-y-1">
                {Object.entries(message.metadata).map(([key, value]) => (
                  key !== 'agent' && (
                    <div key={key} className="flex gap-2">
                      <span className="font-medium">{key}:</span>
                      <span>{String(value)}</span>
                    </div>
                  )
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessageWithSpeech;
