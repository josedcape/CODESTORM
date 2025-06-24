import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Volume2, VolumeX, Loader, SkipForward } from 'lucide-react';
import IntroAnimation from './IntroAnimation';
import { useUI } from '../contexts/UIContext';

interface StartupSequenceProps {
  onComplete?: () => void;
  skipable?: boolean;
}

const StartupSequence: React.FC<StartupSequenceProps> = ({
  onComplete,
  skipable = true
}) => {
  const { isMobile, isTablet } = useUI();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Estados de la secuencia
  const [currentStage, setCurrentStage] = useState<'video' | 'intro' | 'complete'>('video');
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => setIsVideoLoading(true);
    const handleCanPlay = () => {
      setIsVideoLoading(false);
      // Auto-play cuando esté listo
      video.play().catch((error) => {
        console.log('Autoplay failed:', error);
        setIsVideoPlaying(false);
      });
    };
    const handleError = () => {
      setHasVideoError(true);
      setIsVideoLoading(false);
      // Si el video falla, pasar directamente a la intro
      setTimeout(() => setCurrentStage('intro'), 1000);
    };
    const handlePlay = () => setIsVideoPlaying(true);
    const handlePause = () => setIsVideoPlaying(false);
    const handleEnded = () => {
      console.log('🎬 Video completed, starting intro animation');
      setCurrentStage('intro');
    };
    const handleTimeUpdate = () => {
      if (video.duration) {
        setVideoProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isVideoPlaying) {
      video.pause();
    } else {
      video.play().catch((error) => {
        console.error('Play failed:', error);
      });
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const skipToIntro = () => {
    console.log('🎬 Skipping video, starting intro animation');
    setCurrentStage('intro');
  };

  const skipToMenu = () => {
    console.log('🎬 Skipping entire sequence, going to menu');
    setCurrentStage('complete');
    navigate('/menu');
  };

  const handleIntroComplete = () => {
    console.log('🎬 Intro animation completed, navigating to menu');
    setCurrentStage('complete');
    if (onComplete) {
      onComplete();
    } else {
      navigate('/menu');
    }
  };

  const handleVideoClick = () => {
    // No mostrar controles, solo permitir skip con botones
    // El video se reproduce automáticamente sin controles visibles
  };

  // Manejar teclas de acceso rápido
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!skipable) return;

      if (e.key === 'Escape') {
        skipToMenu();
      } else if (e.key === 'Enter' && currentStage === 'video') {
        skipToIntro();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [skipable, currentStage]);

  // Renderizar la etapa de video
  if (currentStage === 'video') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
        {/* Video Container */}
        <div className="relative w-full h-full flex items-center justify-center">

          {/* Loading State */}
          {isVideoLoading && !hasVideoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <div className="flex flex-col items-center">
                <Loader className="w-12 h-12 text-codestorm-accent animate-spin mb-4" />
                <span className="text-white text-lg">Cargando CODESTORM...</span>
                <span className="text-gray-400 text-sm mt-2">Preparando experiencia</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {hasVideoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 mb-4 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2 text-xl">Video no disponible</h3>
                <p className="text-gray-400 text-sm mb-6">
                  No se pudo cargar codestorm.mp4
                </p>
                <button
                  onClick={skipToIntro}
                  className="px-6 py-3 bg-codestorm-accent text-white rounded-lg hover:bg-codestorm-accent/80 transition-colors"
                >
                  Continuar a la Intro
                </button>
              </div>
            </div>
          )}

          {/* Video Element */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted={isMuted}
            playsInline
            onClick={handleVideoClick}
          >
            <source src="/codestorm.mp4" type="video/mp4" />
          </video>

          {/* Skip Controls Only - No Video Controls */}
          {skipable && !isVideoLoading && !hasVideoError && (
            <div className="absolute bottom-6 right-6">
              <div className="flex items-center space-x-3">
                <button
                  onClick={skipToIntro}
                  className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition-colors text-sm backdrop-blur-sm"
                  title="Saltar a intro (Enter)"
                >
                  <SkipForward className="w-4 h-4 mr-1 inline" />
                  Intro
                </button>
                <button
                  onClick={skipToMenu}
                  className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors text-sm backdrop-blur-sm"
                  title="Saltar todo (ESC)"
                >
                  Menú
                </button>
              </div>
            </div>
          )}

          {/* Skip Instructions */}
          {skipable && !isMobile && !isTablet && (
            <div className="absolute top-6 left-6 text-white/70 text-sm">
              <div className="bg-black/50 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-codestorm-accent font-semibold mb-1">CODESTORM</div>
                <div>ESC: Ir al menú</div>
                <div>Enter: Saltar a intro</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Renderizar la etapa de intro
  if (currentStage === 'intro') {
    return (
      <IntroAnimation
        onComplete={handleIntroComplete}
        pageName="CODESTORM"
        duration={2500}
        skipable={skipable}
      />
    );
  }

  // Etapa completada - no renderizar nada
  return null;
};

export default StartupSequence;
