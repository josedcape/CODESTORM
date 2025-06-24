import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Settings } from 'lucide-react';
import { useCompletionSound } from '../hooks/useCompletionSound';

interface SoundControlPanelProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Panel de control para configurar los sonidos de CODESTORM
 */
const SoundControlPanel: React.FC<SoundControlPanelProps> = ({
  className = '',
  showLabel = true,
  size = 'md'
}) => {
  const { 
    isCompletionSoundEnabled, 
    setCompletionSoundEnabled, 
    playCompletionSound 
  } = useCompletionSound();
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Cargar estado inicial
  useEffect(() => {
    setSoundEnabled(isCompletionSoundEnabled());
  }, [isCompletionSoundEnabled]);

  // Manejar cambio de estado del sonido
  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    setCompletionSoundEnabled(newState);
    
    // Reproducir sonido de prueba si se habilita
    if (newState) {
      playCompletionSound(200);
    }
  };

  // Reproducir sonido de prueba
  const handleTestSound = () => {
    playCompletionSound();
  };

  // Obtener clases de tamaño
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          button: 'p-1.5',
          icon: 'h-3 w-3',
          text: 'text-xs'
        };
      case 'lg':
        return {
          button: 'p-3',
          icon: 'h-6 w-6',
          text: 'text-base'
        };
      default:
        return {
          button: 'p-2',
          icon: 'h-4 w-4',
          text: 'text-sm'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`relative ${className}`}>
      {/* Botón principal de control de sonido */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleToggleSound}
          className={`
            ${sizeClasses.button}
            rounded-lg transition-all duration-200
            ${soundEnabled 
              ? 'bg-codestorm-blue/20 text-codestorm-blue hover:bg-codestorm-blue/30' 
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }
            border border-transparent hover:border-codestorm-blue/30
          `}
          title={soundEnabled ? 'Deshabilitar sonidos' : 'Habilitar sonidos'}
        >
          {soundEnabled ? (
            <Volume2 className={sizeClasses.icon} />
          ) : (
            <VolumeX className={sizeClasses.icon} />
          )}
        </button>

        {showLabel && (
          <span className={`${sizeClasses.text} text-gray-300`}>
            {soundEnabled ? 'Sonidos activados' : 'Sonidos desactivados'}
          </span>
        )}

        {/* Botón de configuración */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`
            ${sizeClasses.button}
            rounded-lg transition-all duration-200
            text-gray-400 hover:text-white hover:bg-codestorm-blue/20
            border border-transparent hover:border-codestorm-blue/30
          `}
          title="Configurar sonidos"
        >
          <Settings className={sizeClasses.icon} />
        </button>
      </div>

      {/* Panel de configuración expandido */}
      {showSettings && (
        <div className="absolute top-full left-0 mt-2 bg-codestorm-dark border border-codestorm-blue/30 rounded-lg shadow-xl p-4 min-w-64 z-50">
          <h4 className="text-white font-medium mb-3 flex items-center">
            <Volume2 className="h-4 w-4 mr-2 text-codestorm-blue" />
            Configuración de Sonidos
          </h4>
          
          <div className="space-y-3">
            {/* Control principal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Sonidos de finalización</span>
              <button
                onClick={handleToggleSound}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${soundEnabled ? 'bg-codestorm-blue' : 'bg-gray-600'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${soundEnabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {/* Botón de prueba */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Probar sonido</span>
              <button
                onClick={handleTestSound}
                disabled={!soundEnabled}
                className={`
                  px-3 py-1 rounded text-xs transition-colors
                  ${soundEnabled 
                    ? 'bg-codestorm-blue/20 text-codestorm-blue hover:bg-codestorm-blue/30' 
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                🔊 Reproducir
              </button>
            </div>

            {/* Información */}
            <div className="pt-2 border-t border-gray-700">
              <p className="text-xs text-gray-400">
                Los sonidos se reproducen cuando se completan procesos de generación de código.
              </p>
            </div>
          </div>

          {/* Botón para cerrar */}
          <button
            onClick={() => setShowSettings(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default SoundControlPanel;
