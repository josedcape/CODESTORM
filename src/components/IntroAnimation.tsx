import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Code, Sparkles, Cpu, Globe, Wrench } from 'lucide-react';

interface IntroAnimationProps {
  onComplete?: () => void;
  pageName?: string;
  skipable?: boolean;
  duration?: number;
}

const IntroAnimation: React.FC<IntroAnimationProps> = ({
  onComplete,
  pageName = 'CODESTORM',
  skipable = true,
  duration = 5000
}) => {
  const [animationStage, setAnimationStage] = useState<number>(0);
  const [isSkipped, setIsSkipped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Iconos según la página
  const getPageIcon = () => {
    switch (pageName.toLowerCase()) {
      case 'constructor':
        return <Code className="w-12 h-12 text-blue-400" />;
      case 'agent':
        return <Cpu className="w-12 h-12 text-purple-400" />;
      case 'webai':
        return <Globe className="w-12 h-12 text-green-400" />;
      case 'mantenimiento':
        return <Wrench className="w-12 h-12 text-orange-400" />;
      default:
        return <Zap className="w-12 h-12 text-blue-500" />;
    }
  };

  // Colores según la página
  const getPageColors = () => {
    switch (pageName.toLowerCase()) {
      case 'constructor':
        return { primary: 'blue-500', secondary: 'blue-300' };
      case 'agent':
        return { primary: 'purple-500', secondary: 'purple-300' };
      case 'webai':
        return { primary: 'green-500', secondary: 'green-300' };
      case 'mantenimiento':
        return { primary: 'orange-500', secondary: 'orange-300' };
      default:
        return { primary: 'blue-500', secondary: 'blue-300' };
    }
  };

  const colors = getPageColors();

  // Manejar skip
  const handleSkip = () => {
    if (!skipable) return;
    setIsSkipped(true);
    setAnimationStage(2);
  };

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

  // Manejar tecla ESC para skip
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && skipable) {
        handleSkip();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [skipable]);

  // Avanzar automáticamente a través de las etapas de la animación
  useEffect(() => {
    if (isSkipped) return;

    if (animationStage === 0) {
      // Avanzar a la siguiente etapa después de duration/3
      const timer = setTimeout(() => {
        setAnimationStage(1);
      }, duration / 3);

      return () => {
        clearTimeout(timer);
      };
    } else if (animationStage === 1) {
      // Avanzar a la siguiente etapa después de duration/3
      const timer = setTimeout(() => {
        setAnimationStage(2);
      }, duration / 3);

      return () => {
        clearTimeout(timer);
      };
    } else if (animationStage === 2) {
      // Completar la animación después de duration/3
      const timer = setTimeout(() => {
        console.log(`🎬 IntroAnimation - ${pageName} animation completed`);
        // Call onComplete callback if provided
        if (onComplete) {
          onComplete();
        } else {
          // Fallback: navigate to menu if no callback provided
          console.log('🎬 IntroAnimation - No callback provided, navigating to menu');
          navigate('/menu');
        }
      }, duration / 3);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [animationStage, onComplete, navigate, duration, pageName, isSkipped]);



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
            <div className={`absolute inset-0 bg-${colors.primary} rounded-full opacity-20 animate-pulse`}></div>
            <div className={`absolute inset-2 bg-codestorm-dark rounded-full border-2 border-${colors.primary} flex items-center justify-center overflow-hidden`}>
              <div className="code-rain w-full h-full opacity-30"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                {pageName === 'CODESTORM' ? (
                  <span className={`text-5xl font-bold text-${colors.primary} electric-pulse`}>C</span>
                ) : (
                  <div className="electric-pulse">
                    {getPageIcon()}
                  </div>
                )}
              </div>
            </div>
            <div className="absolute inset-0 border-2 border-transparent rounded-full">
              <div className={`absolute inset-0 border-t-2 border-${colors.primary} rounded-full animate-spin-slow`}></div>
            </div>
          </div>
        </div>

        <h1
          data-text={pageName}
          className="text-5xl font-bold futuristic-title tracking-widest mb-2"
        >
          {pageName}
        </h1>

        <p className={`text-${colors.secondary} text-lg`}>
          {pageName === 'CODESTORM' ? 'Agente Desarrollador Autónomo' :
           pageName === 'Constructor' ? 'Desarrollo Paso a Paso' :
           pageName === 'Agent' ? 'Modificaciones Interactivas' :
           pageName === 'WebAI' ? 'Generación Web Inteligente' :
           pageName === 'Mantenimiento' ? 'Gestión del Sistema' :
           'Plataforma de Desarrollo IA'}
        </p>
      </div>

      {/* Botón de skip */}
      {skipable && (
        <button
          onClick={handleSkip}
          className={`absolute bottom-8 right-8 px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-600 rounded-lg hover:border-gray-400 transform transition-all duration-300 ${
            animationStage > 0 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          Saltar (ESC)
        </button>
      )}
    </div>
  );
};

export default IntroAnimation;
