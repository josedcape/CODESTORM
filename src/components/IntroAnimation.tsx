import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [animationStage, setAnimationStage] = useState<number>(0);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  // Crear partículas de código con mejor gestión de memoria
  useEffect(() => {
    if (!particlesRef.current) return;

    const particlesContainer = particlesRef.current;
    const particles: HTMLElement[] = [];

    // Solo crear partículas en la primera etapa
    if (animationStage === 0) {
      const containerWidth = particlesContainer.offsetWidth || window.innerWidth;
      const containerHeight = particlesContainer.offsetHeight || window.innerHeight;

      // Limpiar partículas existentes de forma segura
      while (particlesContainer.firstChild) {
        particlesContainer.removeChild(particlesContainer.firstChild);
      }

      // Crear nuevas partículas con mejor rendimiento
      const particleCount = Math.min(Math.floor((containerWidth * containerHeight) / 12000), 60);

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'absolute bg-blue-500 rounded-full opacity-0 pointer-events-none';

        // Tamaño aleatorio optimizado
        const size = Math.random() * 3 + 1.5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        // Posición aleatoria
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;

        // Añadir brillo con mejor rendimiento
        particle.style.boxShadow = `0 0 ${size * 1.5}px rgba(59, 130, 246, 0.6)`;

        // Añadir animación con retraso aleatorio optimizado
        const delay = Math.random() * 1.5;
        particle.style.animation = `particle-fade-in 0.4s ease forwards ${delay}s, particle-float 3s ease-in-out infinite ${delay}s`;

        particles.push(particle);
        particlesContainer.appendChild(particle);
      }

      // Crear partículas de código (1s y 0s) con mejor rendimiento
      const codeParticleCount = Math.min(Math.floor((containerWidth * containerHeight) / 18000), 30);

      for (let i = 0; i < codeParticleCount; i++) {
        const codeParticle = document.createElement('div');
        codeParticle.className = 'absolute text-blue-400 font-mono opacity-0 text-xs pointer-events-none';
        codeParticle.textContent = Math.random() > 0.5 ? '1' : '0';

        // Posición aleatoria
        codeParticle.style.left = `${Math.random() * 100}%`;
        codeParticle.style.top = `${Math.random() * 100}%`;

        // Añadir brillo optimizado
        codeParticle.style.textShadow = '0 0 4px rgba(59, 130, 246, 0.6)';

        // Añadir animación con retraso aleatorio optimizado
        const delay = Math.random() * 1.5;
        codeParticle.style.animation = `code-particle-fade-in 0.4s ease forwards ${delay}s, code-particle-float 4s ease-in-out infinite ${delay}s`;

        particles.push(codeParticle);
        particlesContainer.appendChild(codeParticle);
      }
    }

    // Función de limpieza para evitar memory leaks
    return () => {
      particles.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
      // Limpiar completamente el contenedor al desmontar
      if (particlesContainer) {
        while (particlesContainer.firstChild) {
          particlesContainer.removeChild(particlesContainer.firstChild);
        }
      }
    };
  }, [animationStage]);

  // Avanzar automáticamente a través de las etapas de la animación con timing optimizado
  useEffect(() => {
    if (animationStage === 0) {
      // Mostrar el botón de saltar después de 800ms (más rápido)
      const skipTimer = setTimeout(() => {
        setShowSkipButton(true);
      }, 800);

      // Avanzar a la siguiente etapa después de 1.5 segundos (más rápido)
      const timer = setTimeout(() => {
        setAnimationStage(1);
      }, 1500);

      return () => {
        clearTimeout(timer);
        clearTimeout(skipTimer);
      };
    } else if (animationStage === 1) {
      // Avanzar a la siguiente etapa después de 1.5 segundos (más rápido)
      const timer = setTimeout(() => {
        setAnimationStage(2);
      }, 1500);

      return () => {
        clearTimeout(timer);
      };
    } else if (animationStage === 2) {
      // Completar la animación después de 800ms (más rápido)
      const timer = setTimeout(() => {
        if (onComplete && !isCompleted) {
          setIsCompleted(true);
          onComplete();
        }
      }, 800);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [animationStage, onComplete, isCompleted]);

  // Manejar el clic en el botón de saltar
  const handleSkip = () => {
    if (!isCompleted) {
      setIsCompleted(true);
      onComplete();
    }
  };

  console.log('🎬 IntroAnimation renderizando - Stage:', animationStage, 'Completed:', isCompleted);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[9999] bg-codestorm-darker flex items-center justify-center overflow-hidden transition-opacity duration-500 ${
        animationStage === 2 ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: '#0a0f1c'
      }}
    >
      {/* Partículas y efectos de fondo */}
      <div
        ref={particlesRef}
        className="absolute inset-0 overflow-hidden"
      />

      {/* Rayos eléctricos */}
      <div className={`absolute inset-0 pointer-events-none ${animationStage >= 1 ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000`}>
        <div className="lightning-horizontal absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500 transform -translate-y-1/2"></div>
        <div className="lightning-vertical absolute top-0 bottom-0 left-1/2 w-0.5 bg-blue-500 transform -translate-x-1/2"></div>
        <div className="lightning-diagonal-1 absolute top-0 left-0 bottom-0 right-0 w-0.5 bg-blue-500 origin-top-left transform rotate-45"></div>
        <div className="lightning-diagonal-2 absolute top-0 left-0 bottom-0 right-0 w-0.5 bg-blue-500 origin-top-right transform -rotate-45"></div>
      </div>

      {/* Logo y título */}
      <div
        ref={logoRef}
        className={`relative z-10 text-center transform transition-all duration-1000 ${
          animationStage === 0 ? 'scale-0 opacity-0' :
          animationStage === 1 ? 'scale-1 opacity-100' :
          'scale-1.2 opacity-0'
        }`}
      >
        <div className="mb-4 relative">
          <div className="w-32 h-32 mx-auto relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute inset-2 bg-codestorm-dark rounded-full border-2 border-blue-500 flex items-center justify-center overflow-hidden">
              <div className="code-rain w-full h-full opacity-30"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-bold text-blue-500 electric-pulse">C</span>
              </div>
            </div>
            <div className="absolute inset-0 border-2 border-transparent rounded-full">
              <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin-slow"></div>
            </div>
          </div>
        </div>

        <h1
          data-text="CODESTORM"
          className="text-5xl font-bold futuristic-title tracking-widest mb-2"
        >
          CODESTORM
        </h1>

        <p className="text-blue-300 text-lg">Agente Desarrollador Autónomo</p>
      </div>

      {/* Botón para saltar la animación */}
      {showSkipButton && (
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-full bg-codestorm-dark border border-blue-500/30 text-gray-400 hover:text-white hover:bg-blue-900/30 transition-colors"
          aria-label="Saltar animación"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default IntroAnimation;
