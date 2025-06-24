import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Loader } from 'lucide-react';
import { useUI } from '../contexts/UIContext';

interface HeroVideoProps {
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  poster?: string;
}

const HeroVideo: React.FC<HeroVideoProps> = ({
  className = '',
  autoplay = true,
  muted = true,
  loop = true,
  controls = true,
  poster
}) => {
  const { isMobile, isTablet } = useUI();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isMuted, setIsMuted] = useState(muted);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    // Attempt autoplay
    if (autoplay && !hasError) {
      video.play().catch((error) => {
        console.log('Autoplay failed:', error);
        setIsPlaying(false);
      });
    }

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [autoplay, hasError]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
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

  const handleVideoClick = () => {
    if (isMobile || isTablet) {
      setShowControls(!showControls);
      // Hide controls after 3 seconds
      setTimeout(() => setShowControls(false), 3000);
    } else {
      togglePlay();
    }
  };

  if (hasError) {
    return (
      <div className={`relative w-full bg-codestorm-dark rounded-lg overflow-hidden ${className}`}>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-16 h-16 mb-4 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Play className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-white font-semibold mb-2">Video no disponible</h3>
          <p className="text-gray-400 text-sm">
            No se pudo cargar el video de presentación
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full bg-codestorm-dark rounded-lg overflow-hidden group border border-codestorm-blue/30 ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-codestorm-dark z-10">
          <div className="flex flex-col items-center">
            <Loader className="w-8 h-8 text-codestorm-accent animate-spin mb-2" />
            <span className="text-gray-400 text-sm">Cargando video CODESTORM...</span>
          </div>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-auto min-h-[300px] max-h-[70vh] object-cover cursor-pointer bg-codestorm-darker"
        autoPlay={autoplay}
        muted={muted}
        loop={loop}
        playsInline
        poster={poster}
        onClick={handleVideoClick}
        onMouseEnter={() => !isMobile && setShowControls(true)}
        onMouseLeave={() => !isMobile && setShowControls(false)}
        style={{ minHeight: '300px' }}
      >
        <source src="/codestorm.mp4" type="video/mp4" />
        <p className="text-gray-400 p-8 text-center">
          Tu navegador no soporta el elemento video.
          <br />
          <span className="text-codestorm-accent">Video: codestorm.mp4</span>
        </p>
      </video>

      {/* Custom Controls */}
      {controls && (showControls || isMobile || isTablet) && !isLoading && (
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls || isMobile || isTablet ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlay}
                className="p-2 bg-codestorm-accent/20 hover:bg-codestorm-accent/30 rounded-full transition-colors"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </button>

              {/* Mute/Unmute Button */}
              <button
                onClick={toggleMute}
                className="p-2 bg-codestorm-accent/20 hover:bg-codestorm-accent/30 rounded-full transition-colors"
                title={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
            </div>

            {/* Video Info */}
            <div className="text-right">
              <div className="text-xs text-gray-300">
                Video de presentación CODESTORM
              </div>
              {loop && (
                <div className="text-xs text-gray-400">
                  Reproducción en bucle
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-codestorm-darker/30 to-transparent pointer-events-none" />

      {/* Play button overlay when paused */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="p-4 bg-black/50 rounded-full backdrop-blur-sm">
            <Play className="w-12 h-12 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroVideo;
