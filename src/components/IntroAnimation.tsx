import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [animationStage, setAnimationStage] = useState<number>(0);
  const [showSkipButton, setShowSkipButton] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  // Crear partículas de código
  useEffect(() => {
    if (particlesRef.current && animationStage === 0) {
      const particlesContainer = particlesRef.current;
      const containerWidth = particlesContainer.offsetWidth;
      const containerHeight = particlesContainer.offsetHeight;
      
      // Limpiar partículas existentes
      particlesContainer.innerHTML = '';
      
      // Crear nuevas partículas
      const particleCount = Math.min(Math.floor((containerWidth * containerHeight) / 10000), 100);
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'absolute bg-blue-500 rounded-full opacity-0';
        
        // Tamaño aleatorio
        const size = Math.random() * 4 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Posición aleatoria
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Añadir brillo
        particle.style.boxShadow = `0 0 ${size * 2}px rgba(59, 130, 246, 0.8)`;
        
        // Añadir animación con retraso aleatorio
        const delay = Math.random() * 2;
        particle.style.animation = `particle-fade-in 0.5s ease forwards ${delay}s, particle-float 3s ease-in-out infinite ${delay}s`;
        
        particlesContainer.appendChild(particle);
      }
      
      // Crear partículas de código (1s y 0s)
      const codeParticleCount = Math.min(Math.floor((containerWidth * containerHeight) / 15000), 50);
      
      for (let i = 0; i < codeParticleCount; i++) {
        const codeParticle = document.createElement('div');
        codeParticle.className = 'absolute text-blue-400 font-mono opacity-0 text-xs';
        codeParticle.textContent = Math.random() > 0.5 ? '1' : '0';
        
        // Posición aleatoria
        codeParticle.style.left = `${Math.random() * 100}%`;
        codeParticle.style.top = `${Math.random() * 100}%`;
        
        // Añadir brillo
        codeParticle.style.textShadow = '0 0 5px rgba(59, 130, 246, 0.8)';
        
        // Añadir animación con retraso aleatorio
        const delay = Math.random() * 2;
        codeParticle.style.animation = `code-particle-fade-in 0.5s ease forwards ${delay}s, code-particle-float 4s ease-in-out infinite ${delay}s`;
        
        particlesContainer.appendChild(codeParticle);
      }
    }
  }, [animationStage]);

  // Avanzar automáticamente a través de las etapas de la animación
  useEffect(() => {
    if (animationStage === 0) {
      // Mostrar el botón de saltar después de 1 segundo
      const skipTimer = setTimeout(() => {
        setShowSkipButton(true);
      }, 1000);
      
      // Avanzar a la siguiente etapa después de 2 segundos
      const timer = setTimeout(() => {
        setAnimationStage(1);
      }, 2000);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(skipTimer);
      };
    } else if (animationStage === 1) {
      // Avanzar a la siguiente etapa después de 2 segundos
      const timer = setTimeout(() => {
        setAnimationStage(2);
      }, 2000);
      
      return () => {
        clearTimeout(timer);
      };
    } else if (animationStage === 2) {
      // Completar la animación después de 1 segundo
      const timer = setTimeout(() => {
        onComplete();
      }, 1000);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [animationStage, onComplete]);

  // Manejar el clic en el botón de saltar
  const handleSkip = () => {
    onComplete();
  };

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-50 bg-codestorm-darker flex items-center justify-center overflow-hidden transition-opacity duration-500 ${
        animationStage === 2 ? 'opacity-0' : 'opacity-100'
      }`}
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
