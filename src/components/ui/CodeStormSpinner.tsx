import React from 'react';
import { Zap, Code, Cpu, Layers, GitBranch } from 'lucide-react';

interface CodeStormSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'minimal' | 'particles';
}

const CodeStormSpinner: React.FC<CodeStormSpinnerProps> = ({
  message = 'Generando código...',
  size = 'medium',
  variant = 'default'
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const containerSizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  if (variant === 'minimal') {
    return (
      <div className="flex items-center space-x-3">
        <div className={`${sizeClasses[size]} relative`}>
          <div className="absolute inset-0 rounded-full border-2 border-codestorm-blue/30"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-codestorm-blue animate-spin"></div>
          <div className="absolute inset-2 rounded-full border border-transparent border-t-blue-400 animate-spin animation-delay-150"></div>
        </div>
        {message && (
          <span className="text-sm text-gray-300 animate-pulse">{message}</span>
        )}
      </div>
    );
  }

  if (variant === 'particles') {
    return (
      <div className={`flex flex-col items-center ${containerSizeClasses[size]}`}>
        <div className="relative">
          {/* Partículas flotantes */}
          <div className="absolute -inset-8">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-blue-400 rounded-full animate-ping"
                style={{
                  left: `${Math.cos(i * 45 * Math.PI / 180) * 30 + 30}px`,
                  top: `${Math.sin(i * 45 * Math.PI / 180) * 30 + 30}px`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '2s'
                }}
              />
            ))}
          </div>

          {/* Núcleo central */}
          <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
            <Code className="w-6 h-6 text-codestorm-blue animate-pulse" />
            <div className="absolute inset-0 rounded-full border border-codestorm-blue/50 animate-ping"></div>
          </div>
        </div>

        {message && (
          <p className="mt-4 text-sm text-gray-300 text-center animate-pulse">
            {message}
          </p>
        )}
      </div>
    );
  }

  // Variant por defecto - Tormenta de código completa
  return (
    <div className={`flex flex-col items-center ${containerSizeClasses[size]}`}>
      {/* Contenedor principal del spinner */}
      <div className="relative">
        {/* Anillo exterior con rayos */}
        <div className="absolute -inset-4">
          <div className="w-20 h-20 relative">
            {/* Rayos giratorios */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-6 bg-gradient-to-t from-transparent via-blue-400 to-transparent"
                style={{
                  left: '50%',
                  top: '0',
                  transformOrigin: '50% 40px',
                  transform: `translateX(-50%) rotate(${i * 60}deg)`,
                  animation: `spin 2s linear infinite`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Anillo medio con engranajes */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-codestorm-blue/30 animate-spin-slow"></div>
          <div className="absolute inset-1 rounded-full border border-blue-400/50 animate-spin-reverse"></div>

          {/* Iconos giratorios */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-8 h-8">
              <Cpu className="absolute inset-0 w-4 h-4 text-codestorm-blue animate-pulse" style={{ top: '0', left: '50%', transform: 'translateX(-50%)' }} />
              <GitBranch className="absolute inset-0 w-4 h-4 text-blue-400 animate-pulse" style={{ bottom: '0', left: '50%', transform: 'translateX(-50%)', animationDelay: '0.5s' }} />
              <Layers className="absolute inset-0 w-4 h-4 text-blue-300 animate-pulse" style={{ left: '0', top: '50%', transform: 'translateY(-50%)', animationDelay: '1s' }} />
              <Code className="absolute inset-0 w-4 h-4 text-blue-500 animate-pulse" style={{ right: '0', top: '50%', transform: 'translateY(-50%)', animationDelay: '1.5s' }} />
            </div>
          </div>
        </div>

        {/* Núcleo central con rayo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center animate-pulse">
            <Zap className="w-3 h-3 text-white" />
          </div>
        </div>

        {/* Efectos de partículas */}
        <div className="absolute -inset-6">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-60"
              style={{
                left: `${Math.cos(i * 30 * Math.PI / 180) * 25 + 25}px`,
                top: `${Math.sin(i * 30 * Math.PI / 180) * 25 + 25}px`,
                animation: `float 3s ease-in-out infinite`,
                animationDelay: `${i * 0.25}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div className="mt-6 text-center">
          <p className="text-sm font-medium text-white animate-pulse">
            {message}
          </p>
          <div className="mt-2 flex justify-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 bg-codestorm-blue rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      )}


    </div>
  );
};

export default CodeStormSpinner;
