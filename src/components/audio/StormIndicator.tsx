import React, { useState, useEffect } from 'react';
import { Zap, Mic, Volume2, X } from 'lucide-react';
import { nativeVoiceRecognitionService, VoiceRecognitionEvent } from '../../services/NativeVoiceRecognitionService';
import { audioService } from '../../services/AudioService';

interface StormIndicatorProps {
  onCommand?: (command: string) => void;
  className?: string;
}

const StormIndicator: React.FC<StormIndicatorProps> = ({
  onCommand,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | null = null;

    const handleVoiceEvent = (event: VoiceRecognitionEvent) => {
      switch (event.type) {
        case 'storm-detected':
          const eventData = event.data;

          if (eventData?.autoSend && eventData?.command) {
            // Comando completo detectado, enviar automáticamente
            if (onCommand) {
              onCommand(eventData.command);
            }
            // No mostrar interfaz, es automático
            return;
          }

          if (eventData?.autoListen) {
            // Mostrar interfaz de escucha automática
            setIsVisible(true);
            setIsListening(true);
            setTranscript('');
            setCountdown(15); // Más tiempo para comando completo
            setPulseAnimation(true);

            // Iniciar countdown
            countdownInterval = setInterval(() => {
              setCountdown(prev => {
                if (prev <= 1) {
                  // Timeout alcanzado
                  setIsVisible(false);
                  setIsListening(false);
                  if (countdownInterval) clearInterval(countdownInterval);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          } else {
            // Modo manual tradicional
            setIsVisible(true);
            setIsListening(true);
            setTranscript('');
            setCountdown(10);
            setPulseAnimation(true);

            // Iniciar countdown
            countdownInterval = setInterval(() => {
              setCountdown(prev => {
                if (prev <= 1) {
                  // Timeout alcanzado
                  setIsVisible(false);
                  setIsListening(false);
                  if (countdownInterval) clearInterval(countdownInterval);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          }
          break;

        case 'start':
          if (nativeVoiceRecognitionService.isInStormMode()) {
            setIsListening(true);
            setPulseAnimation(true);
          }
          break;

        case 'result':
          if (nativeVoiceRecognitionService.isInStormMode()) {
            const result = event.data;
            setTranscript(result.transcript);

            if (result.isFinal && result.transcript.trim()) {
              // Comando completado
              if (onCommand) {
                onCommand(result.transcript.trim());
              }
              handleClose();
            }
          }
          break;

        case 'end':
          if (nativeVoiceRecognitionService.isInStormMode()) {
            setIsListening(false);
            setPulseAnimation(false);

            // Si hay transcript, procesarlo
            if (transcript.trim() && onCommand) {
              onCommand(transcript.trim());
            }

            setTimeout(() => {
              setIsVisible(false);
            }, 1000);
          }
          break;

        case 'error':
          if (nativeVoiceRecognitionService.isInStormMode()) {
            setIsListening(false);
            setPulseAnimation(false);
            setTimeout(() => {
              setIsVisible(false);
            }, 2000);
          }
          break;
      }
    };

    nativeVoiceRecognitionService.addEventListener(handleVoiceEvent);

    return () => {
      nativeVoiceRecognitionService.removeEventListener(handleVoiceEvent);
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [onCommand, transcript]);

  const handleClose = () => {
    nativeVoiceRecognitionService.stopListening();
    setIsVisible(false);
    setIsListening(false);
    setTranscript('');
    setCountdown(0);
    setPulseAnimation(false);
  };

  const handlePlayback = () => {
    if (transcript) {
      audioService.speakText(`Comando recibido: ${transcript}`);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
      <div className="relative">
        {/* Círculos de animación */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-32 h-32 rounded-full border-2 border-codestorm-accent/30 ${pulseAnimation ? 'animate-ping' : ''}`} />
          <div className={`absolute w-24 h-24 rounded-full border-2 border-codestorm-accent/50 ${pulseAnimation ? 'animate-ping' : ''}`} style={{ animationDelay: '0.5s' }} />
          <div className={`absolute w-16 h-16 rounded-full border-2 border-codestorm-accent/70 ${pulseAnimation ? 'animate-ping' : ''}`} style={{ animationDelay: '1s' }} />
        </div>

        {/* Contenedor principal */}
        <div className="relative bg-codestorm-dark border-2 border-codestorm-accent rounded-2xl p-8 shadow-2xl shadow-codestorm-accent/20 min-w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full bg-codestorm-accent ${pulseAnimation ? 'animate-pulse' : ''}`}>
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">COMANDO STORM</h2>
                <p className="text-sm text-codestorm-accent">Sistema de voz activado</p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Estado actual */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Mic className={`w-5 h-5 ${isListening ? 'text-red-400 animate-pulse' : 'text-gray-400'}`} />
                <span className="text-white font-medium">
                  {isListening ? 'Escuchando comando automáticamente...' : 'Preparando...'}
                </span>
              </div>

              {countdown > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-codestorm-accent flex items-center justify-center">
                    <span className="text-sm font-bold text-codestorm-accent">{countdown}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Barra de progreso del countdown */}
            {countdown > 0 && (
              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <div
                  className="bg-codestorm-accent h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(countdown / 10) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Transcript en tiempo real */}
          <div className="mb-6">
            <div className="bg-codestorm-darker rounded-lg p-4 min-h-[80px] border border-codestorm-blue/30">
              {transcript ? (
                <div className="space-y-2">
                  <div className="text-white text-lg">{transcript}</div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePlayback}
                      className="p-1 rounded bg-codestorm-blue/20 hover:bg-codestorm-blue/40 text-white transition-colors"
                      title="Reproducir comando"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-400">Presiona Enter o espera para enviar</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Habla tu comando...</p>
                    <p className="text-xs mt-1">Ejemplo: "Crear una calculadora"</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">
              <p>• Di "STORM" seguido de tu comando</p>
              <p>• Presiona Escape para cancelar</p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                Cancelar
              </button>

              {transcript && (
                <button
                  onClick={() => {
                    if (onCommand) onCommand(transcript.trim());
                    handleClose();
                  }}
                  className="px-4 py-2 rounded-md bg-codestorm-accent hover:bg-blue-600 text-white transition-colors"
                >
                  Enviar Comando
                </button>
              )}
            </div>
          </div>

          {/* Efectos visuales de fondo */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {/* Partículas flotantes */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-codestorm-accent rounded-full opacity-30 animate-float"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 3) * 20}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${3 + i * 0.5}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Indicador de nivel de audio */}
        {isListening && (
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-codestorm-accent rounded-full animate-pulse"
                  style={{
                    height: `${8 + Math.random() * 16}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StormIndicator;
