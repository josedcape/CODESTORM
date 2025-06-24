import React, { useEffect, useRef } from 'react';
import { Loader, Zap } from 'lucide-react';
import { useCompletionSound } from '../../hooks/useCompletionSound';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  currentAgent?: string;
  onCancel?: () => void;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Generando código...',
  progress,
  currentAgent,
  onCancel
}) => {
  const { playSuccessSound } = useCompletionSound();
  const wasVisibleRef = useRef(false);
  const completionTriggeredRef = useRef(false);

  // Detectar cuando el loading se completa (progreso llega a 100% o se oculta después de estar visible)
  useEffect(() => {
    if (isVisible) {
      wasVisibleRef.current = true;
      completionTriggeredRef.current = false;
    } else if (wasVisibleRef.current && !completionTriggeredRef.current) {
      // El loading se acaba de completar
      completionTriggeredRef.current = true;

      console.log('🎵 Constructor LoadingOverlay completado - Reproduciendo sonido de finalización');

      // Reproducir sonido con un pequeño delay para que coincida con la animación
      playSuccessSound(300);

      // Reset para la próxima vez
      setTimeout(() => {
        wasVisibleRef.current = false;
      }, 1000);
    }
  }, [isVisible, playSuccessSound]);

  // También detectar cuando el progreso llega a 100%
  useEffect(() => {
    if (progress === 100 && isVisible && !completionTriggeredRef.current) {
      completionTriggeredRef.current = true;

      console.log('🎵 Constructor - Progreso 100% alcanzado - Reproduciendo sonido de finalización');

      // Reproducir sonido cuando se alcanza el 100%
      playSuccessSound(500);
    }
  }, [progress, isVisible, playSuccessSound]);

  if (!isVisible) return null;

  const getAgentIcon = (agent: string) => {
    switch (agent?.toLowerCase()) {
      case 'planner':
        return '🧠';
      case 'codegenerator':
        return '⚡';
      case 'designarchitect':
        return '🎨';
      case 'codemodifier':
        return '🔧';
      case 'fileobserver':
        return '👁️';
      default:
        return '🌩️';
    }
  };

  const getAgentName = (agent: string) => {
    switch (agent?.toLowerCase()) {
      case 'planner':
        return 'Agente Planificador';
      case 'codegenerator':
        return 'Generador de Código';
      case 'designarchitect':
        return 'Arquitecto de Diseño';
      case 'codemodifier':
        return 'Modificador de Código';
      case 'fileobserver':
        return 'Observador de Archivos';
      default:
        return 'Sistema de IA';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
         style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Backdrop con efecto blur */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Contenedor principal */}
      <div className="relative bg-codestorm-dark/95 border border-codestorm-blue/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Efectos de fondo */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-codestorm-blue/10 to-transparent" />
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-codestorm-blue/20 via-transparent to-codestorm-blue/20 blur-sm" />

        {/* Contenido */}
        <div className="relative z-10">
          {/* Spinner principal */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-codestorm-blue/30 border-t-codestorm-blue rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-6 h-6 text-codestorm-blue animate-pulse" />
              </div>
            </div>
          </div>

          {/* Información del agente actual */}
          {currentAgent && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center space-x-2 bg-codestorm-blue/20 px-4 py-2 rounded-full">
                <span className="text-2xl">{getAgentIcon(currentAgent)}</span>
                <span className="text-sm font-medium text-white">
                  {getAgentName(currentAgent)}
                </span>
              </div>
            </div>
          )}

          {/* Mensaje principal */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              🌩️ CODESTORM Trabajando
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {message}
            </p>
          </div>

          {/* Barra de progreso */}
          {progress !== undefined && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Progreso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-codestorm-blue to-blue-400 rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  {/* Efecto de brillo en la barra de progreso */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* Indicadores de actividad */}
          <div className="flex justify-center space-x-2 mb-6">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-codestorm-blue rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.5s'
                }}
              />
            ))}
          </div>

          {/* Botón de cancelar (opcional) */}
          {onCancel && (
            <div className="text-center">
              <button
                onClick={() => {
                  console.log('Cancelando proceso...');
                  onCancel();
                }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors duration-200"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Consejos o información adicional */}
          <div className="mt-6 p-3 bg-codestorm-blue/10 rounded-lg border border-codestorm-blue/20">
            <p className="text-xs text-gray-400 text-center">
              💡 Los agentes de IA están analizando tu solicitud y generando código optimizado
            </p>
          </div>
        </div>

        {/* Efectos de partículas flotantes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400/60 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float 4s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>


    </div>
  );
};

export default LoadingOverlay;
