import React, { useState } from 'react';
import { Volume2, VolumeX, Settings, X } from 'lucide-react';
import { useCompletionSounds } from '../hooks/useCompletionSounds';

interface AudioControlsProps {
  className?: string;
  showFullControls?: boolean;
}

/**
 * Componente de controles de audio para sonidos de finalización
 */
export const AudioControls: React.FC<AudioControlsProps> = ({
  className = '',
  showFullControls = false
}) => {
  const {
    audioSettings,
    isSoundEnabled,
    toggleSounds,
    toggleCompletionSounds,
    setVolume,
    playSuccess
  } = useCompletionSounds();

  const [showSettings, setShowSettings] = useState(false);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const testSound = async () => {
    await playSuccess('Prueba');
  };

  if (!showFullControls) {
    // Versión compacta - solo botón de toggle
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={toggleSounds}
          className={`p-2 rounded-lg transition-colors duration-200 ${
            isSoundEnabled
              ? 'text-green-400 hover:text-green-300 hover:bg-green-400/10'
              : 'text-gray-500 hover:text-gray-400 hover:bg-gray-500/10'
          }`}
          title={isSoundEnabled ? 'Sonidos habilitados' : 'Sonidos deshabilitados'}
        >
          {isSoundEnabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </button>
      </div>
    );
  }

  // Versión completa con todos los controles
  return (
    <div className={`relative ${className}`}>
      {/* Botón principal */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
          isSoundEnabled
            ? 'text-green-400 hover:text-green-300 hover:bg-green-400/10'
            : 'text-gray-500 hover:text-gray-400 hover:bg-gray-500/10'
        }`}
      >
        {isSoundEnabled ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
        <Settings className="w-4 h-4" />
      </button>

      {/* Panel de configuración */}
      {showSettings && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-codestorm-dark border border-gray-600 rounded-lg shadow-xl z-50">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Configuración de Audio</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Controles */}
            <div className="space-y-4">
              {/* Toggle general de sonidos */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">
                  Sonidos habilitados
                </label>
                <button
                  onClick={toggleSounds}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    audioSettings.enabled ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      audioSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle sonidos de finalización */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">
                  Sonidos de finalización
                </label>
                <button
                  onClick={toggleCompletionSounds}
                  disabled={!audioSettings.enabled}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    audioSettings.completionSoundEnabled && audioSettings.enabled 
                      ? 'bg-green-600' 
                      : 'bg-gray-600'
                  } ${!audioSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      audioSettings.completionSoundEnabled && audioSettings.enabled 
                        ? 'translate-x-6' 
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Control de volumen */}
              <div className="space-y-2">
                <label className="text-sm text-gray-300">
                  Volumen: {Math.round(audioSettings.volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={audioSettings.volume}
                  onChange={handleVolumeChange}
                  disabled={!audioSettings.enabled}
                  className={`w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer ${
                    !audioSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Botón de prueba */}
              <button
                onClick={testSound}
                disabled={!isSoundEnabled}
                className={`w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                  isSoundEnabled
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Probar Sonido
              </button>

              {/* Información */}
              <div className="text-xs text-gray-400 border-t border-gray-600 pt-3">
                <p>Los sonidos se reproducen automáticamente cuando se completan procesos de generación de código.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioControls;
