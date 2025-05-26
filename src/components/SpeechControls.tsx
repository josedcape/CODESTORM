/**
 * Componente de Controles de Síntesis de Voz para CODESTORM
 * Proporciona controles visuales para reproducir, pausar y configurar síntesis de voz
 */

import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Mic2,
  SkipForward,
  RotateCcw
} from 'lucide-react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { SpeechConfig } from '../services/SpeechSynthesisService';

export interface SpeechControlsProps {
  text: string;
  className?: string;
  showSettings?: boolean;
  autoPlay?: boolean;
  compact?: boolean;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onSpeechError?: (error: string) => void;
  highlightCallback?: (charIndex: number, charLength: number) => void;
}

const SpeechControls: React.FC<SpeechControlsProps> = ({
  text,
  className = '',
  showSettings = true,
  autoPlay = false,
  compact = false,
  onSpeechStart,
  onSpeechEnd,
  onSpeechError,
  highlightCallback
}) => {
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [speechConfig, setSpeechConfig] = useState<Partial<SpeechConfig>>({
    rate: 0.9,
    pitch: 1.0,
    volume: 0.8,
    autoPlay: autoPlay,
    enableHighlight: !!highlightCallback
  });

  const {
    isSupported,
    isInitialized,
    status,
    voices,
    spanishVoices,
    speak,
    pause,
    resume,
    stop,
    setPreferredVoice,
    updateConfig,
    isPlaying,
    isPaused,
    canSpeak
  } = useSpeechSynthesis({
    componentName: 'SpeechControls',
    defaultConfig: speechConfig,
    onStateChange: (state) => {
      if (state === 'speaking') {
        onSpeechStart?.();
      } else if (state === 'idle') {
        onSpeechEnd?.();
      }
    },
    onError: onSpeechError
  });

  // Reproducir automáticamente si está habilitado
  useEffect(() => {
    if (autoPlay && canSpeak && text.trim() && !isPlaying) {
      handleSpeak();
    }
  }, [autoPlay, canSpeak, text]);

  // Manejar reproducción
  const handleSpeak = () => {
    if (!text.trim()) return;
    
    speak(text, {
      ...speechConfig,
      onHighlight: highlightCallback
    });
  };

  // Manejar pausa/reanudación
  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      handleSpeak();
    }
  };

  // Manejar detener
  const handleStop = () => {
    stop();
  };

  // Actualizar configuración
  const handleConfigChange = (newConfig: Partial<SpeechConfig>) => {
    setSpeechConfig(prev => ({ ...prev, ...newConfig }));
    updateConfig(newConfig);
  };

  // Cambiar voz
  const handleVoiceChange = (voiceName: string) => {
    const voice = voices.find(v => v.name === voiceName);
    if (voice) {
      setPreferredVoice(voice);
      handleConfigChange({ voice });
    }
  };

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <VolumeX className="w-4 h-4" />
        <span className="text-xs">Síntesis no soportada</span>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
        <div className="w-4 h-4 border-2 border-codestorm-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs">Cargando síntesis...</span>
      </div>
    );
  }

  const buttonClass = `
    p-2 rounded-lg transition-all duration-300 
    hover:bg-codestorm-accent/20 hover:scale-105
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
    border border-codestorm-accent/30 hover:border-codestorm-accent/60
  `;

  const activeButtonClass = `
    ${buttonClass} bg-codestorm-accent/30 border-codestorm-accent text-codestorm-accent
  `;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Controles principales */}
      <div className="flex items-center gap-1">
        {/* Botón Play/Pause */}
        <button
          onClick={handlePlayPause}
          disabled={!canSpeak || !text.trim()}
          className={isPlaying || isPaused ? activeButtonClass : buttonClass}
          title={isPlaying ? 'Pausar' : isPaused ? 'Reanudar' : 'Reproducir'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>

        {/* Botón Stop */}
        {(isPlaying || isPaused) && (
          <button
            onClick={handleStop}
            className={buttonClass}
            title="Detener"
          >
            <Square className="w-4 h-4" />
          </button>
        )}

        {/* Indicador de estado */}
        {!compact && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            {isPlaying && (
              <>
                <Volume2 className="w-3 h-3 text-codestorm-accent animate-pulse" />
                <span>Reproduciendo...</span>
              </>
            )}
            {isPaused && (
              <>
                <Pause className="w-3 h-3 text-yellow-500" />
                <span>Pausado</span>
              </>
            )}
            {status.queueLength > 0 && (
              <span className="text-codestorm-accent">
                ({status.queueLength} en cola)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Configuración */}
      {showSettings && (
        <div className="relative">
          <button
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className={showSettingsPanel ? activeButtonClass : buttonClass}
            title="Configuración de voz"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Panel de configuración */}
          {showSettingsPanel && (
            <div className="absolute top-full right-0 mt-2 p-4 bg-codestorm-dark border border-codestorm-accent/30 rounded-lg shadow-xl z-50 min-w-[280px]">
              <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Mic2 className="w-4 h-4 text-codestorm-accent" />
                Configuración de Voz
              </h4>

              {/* Selección de voz */}
              <div className="mb-3">
                <label className="block text-xs text-gray-300 mb-1">Voz:</label>
                <select
                  value={speechConfig.voice?.name || ''}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  className="w-full p-2 bg-codestorm-darker border border-codestorm-accent/30 rounded text-white text-xs"
                >
                  <option value="">Voz por defecto</option>
                  {spanishVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* Velocidad */}
              <div className="mb-3">
                <label className="block text-xs text-gray-300 mb-1">
                  Velocidad: {speechConfig.rate?.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speechConfig.rate || 0.9}
                  onChange={(e) => handleConfigChange({ rate: parseFloat(e.target.value) })}
                  className="w-full accent-codestorm-accent"
                />
              </div>

              {/* Tono */}
              <div className="mb-3">
                <label className="block text-xs text-gray-300 mb-1">
                  Tono: {speechConfig.pitch?.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speechConfig.pitch || 1.0}
                  onChange={(e) => handleConfigChange({ pitch: parseFloat(e.target.value) })}
                  className="w-full accent-codestorm-accent"
                />
              </div>

              {/* Volumen */}
              <div className="mb-3">
                <label className="block text-xs text-gray-300 mb-1">
                  Volumen: {Math.round((speechConfig.volume || 0.8) * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={speechConfig.volume || 0.8}
                  onChange={(e) => handleConfigChange({ volume: parseFloat(e.target.value) })}
                  className="w-full accent-codestorm-accent"
                />
              </div>

              {/* Opciones */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={speechConfig.enableHighlight || false}
                    onChange={(e) => handleConfigChange({ enableHighlight: e.target.checked })}
                    className="accent-codestorm-accent"
                  />
                  Resaltar texto
                </label>
              </div>

              {/* Botón de reset */}
              <button
                onClick={() => {
                  const defaultConfig = { rate: 0.9, pitch: 1.0, volume: 0.8 };
                  setSpeechConfig(defaultConfig);
                  handleConfigChange(defaultConfig);
                }}
                className="mt-3 w-full p-2 bg-codestorm-accent/20 hover:bg-codestorm-accent/30 border border-codestorm-accent/30 rounded text-xs text-white transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3 h-3" />
                Restaurar valores por defecto
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpeechControls;
