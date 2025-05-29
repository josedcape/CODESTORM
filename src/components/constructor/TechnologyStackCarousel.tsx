import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  Users,
  TrendingUp,
  Filter,
  Search,
  Info,
  Check,
  ExternalLink,
  Code,
  Smartphone,
  Globe,
  Server,
  Zap,
  Play,
  Pause
} from 'lucide-react';
import { TechnologyStack, StackFilter, ProjectType, DifficultyLevel, ModernityStatus } from '../../types/technologyStacks';
import { technologyStacks, stackCategories } from '../../data/technologyStacks';
import { useUI } from '../../contexts/UIContext';
import '../../styles/TechnologyStackCarousel.css';

interface TechnologyStackCarouselProps {
  onSelectStack: (stack: TechnologyStack) => void;
  onShowDetails?: (stack: TechnologyStack) => void;
  selectedStackId?: string;
  className?: string;
}

const TechnologyStackCarousel: React.FC<TechnologyStackCarouselProps> = ({
  onSelectStack,
  onShowDetails,
  selectedStackId,
  className = ''
}) => {
  const { isMobile, isTablet } = useUI();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filters, setFilters] = useState<StackFilter>({
    type: 'all',
    difficulty: 'all',
    modernity: 'all',
    searchTerm: ''
  });
  const [hoveredStack, setHoveredStack] = useState<string | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Filtrar stacks según los criterios seleccionados
  const filteredStacks = technologyStacks.filter(stack => {
    // Filtro por categoría
    if (selectedCategory !== 'all') {
      const category = stackCategories.find(cat => cat.id === selectedCategory);
      if (category && !category.stacks.some(s => s.id === stack.id)) {
        return false;
      }
    }

    // Filtro por tipo de proyecto
    if (filters.type !== 'all' && !stack.recommendedFor.includes(filters.type)) {
      return false;
    }

    // Filtro por dificultad
    if (filters.difficulty !== 'all' && stack.difficultyLevel !== filters.difficulty) {
      return false;
    }

    // Filtro por modernidad
    if (filters.modernity !== 'all' && stack.modernityStatus !== filters.modernity) {
      return false;
    }

    // Filtro por término de búsqueda
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (
        stack.name.toLowerCase().includes(searchLower) ||
        stack.description.toLowerCase().includes(searchLower) ||
        stack.technologies.some(tech => tech.name.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  // Calcular cuántas tarjetas mostrar por vista
  const cardsPerView = isMobile ? 1 : isTablet ? 2 : 3;
  const maxIndex = Math.max(0, filteredStacks.length - cardsPerView);

  // Navegación del carrusel mejorada con animaciones
  const goToPrevious = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(prev => {
      const newIndex = prev === 0 ? maxIndex : Math.max(0, prev - 1);
      setTimeout(() => setIsAnimating(false), 300);
      return newIndex;
    });
  }, [isAnimating, maxIndex]);

  const goToNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(prev => {
      const newIndex = prev >= maxIndex ? 0 : Math.min(maxIndex, prev + 1);
      setTimeout(() => setIsAnimating(false), 300);
      return newIndex;
    });
  }, [isAnimating, maxIndex]);

  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 300);
  }, [isAnimating, currentIndex]);

  // Auto-play functionality
  const startAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      if (!isPaused) {
        goToNext();
      }
    }, 4000);
  }, [goToNext, isPaused]);

  const stopAutoPlay = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(prev => {
      const newState = !prev;
      if (newState) {
        startAutoPlay();
      } else {
        stopAutoPlay();
      }
      return newState;
    });
  }, [startAutoPlay, stopAutoPlay]);

  // Touch/Swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        goToPrevious();
        break;
      case 'ArrowRight':
        e.preventDefault();
        goToNext();
        break;
      case ' ':
        e.preventDefault();
        toggleAutoPlay();
        break;
      case 'Escape':
        e.preventDefault();
        setShowFilters(false);
        break;
    }
  }, [goToPrevious, goToNext, toggleAutoPlay]);

  // Effects
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isAutoPlaying) {
      startAutoPlay();
    } else {
      stopAutoPlay();
    }
    return () => stopAutoPlay();
  }, [isAutoPlaying, startAutoPlay, stopAutoPlay]);

  useEffect(() => {
    // Reset current index when filters change
    setCurrentIndex(0);
  }, [filters, selectedCategory]);

  // Renderizar estrellas de calificación
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-600'
        }`}
      />
    ));
  };

  // Obtener color del badge de dificultad
  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'Fácil': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Moderado': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Avanzado': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Obtener color del badge de modernidad
  const getModernityColor = (modernity: ModernityStatus) => {
    switch (modernity) {
      case 'Reciente': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Establecido': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Legacy': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Obtener icono según el tipo de proyecto
  const getProjectTypeIcon = (types: ProjectType[]) => {
    if (types.includes('Mobile')) return <Smartphone className="w-4 h-4" />;
    if (types.includes('Web')) return <Globe className="w-4 h-4" />;
    if (types.includes('Enterprise')) return <Server className="w-4 h-4" />;
    return <Code className="w-4 h-4" />;
  };

  return (
    <div className={`bg-codestorm-dark rounded-lg p-6 ${className}`}>
      {/* Header con título y controles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
            🚀 Plantillas de Tecnología
            {isAutoPlaying && (
              <span className="ml-3 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 animate-pulse">
                Auto-play activo
              </span>
            )}
          </h2>
          <p className="text-gray-400 text-sm">
            Selecciona el stack perfecto para tu proyecto • Usa ← → para navegar • Espacio para auto-play
          </p>
        </div>

        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <button
            onClick={toggleAutoPlay}
            className={`
              px-3 py-2 rounded-md text-sm font-medium transition-all duration-300
              ${isAutoPlaying
                ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                : 'bg-codestorm-darker text-gray-400 hover:text-white hover:bg-codestorm-blue/20'
              }
            `}
            title={isAutoPlaying ? 'Pausar auto-play' : 'Iniciar auto-play'}
          >
            {isAutoPlaying ? (
              <Pause className="w-4 h-4 mr-2 inline" />
            ) : (
              <Play className="w-4 h-4 mr-2 inline" />
            )}
            Auto-play
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              px-3 py-2 rounded-md text-sm font-medium transition-all duration-300
              ${showFilters
                ? 'bg-codestorm-accent text-white shadow-lg shadow-codestorm-accent/20'
                : 'bg-codestorm-darker text-gray-400 hover:text-white hover:bg-codestorm-blue/20'
              }
            `}
          >
            <Filter className="w-4 h-4 mr-2 inline" />
            Filtros
          </button>
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="bg-codestorm-darker rounded-lg p-4 mb-6 space-y-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tecnologías..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 bg-codestorm-dark border border-codestorm-blue/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-codestorm-blue/50"
            />
          </div>

          {/* Filtros en grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Categoría</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-codestorm-dark border border-codestorm-blue/30 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-codestorm-blue/50"
              >
                <option value="all">Todas las categorías</option>
                {stackCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de proyecto */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Proyecto</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as ProjectType | 'all' }))}
                className="w-full bg-codestorm-dark border border-codestorm-blue/30 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-codestorm-blue/50"
              >
                <option value="all">Todos los tipos</option>
                <option value="Web">Web</option>
                <option value="Mobile">Mobile</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Startup">Startup</option>
                <option value="API">API</option>
                <option value="Desktop">Desktop</option>
              </select>
            </div>

            {/* Dificultad */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Dificultad</label>
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value as DifficultyLevel | 'all' }))}
                className="w-full bg-codestorm-dark border border-codestorm-blue/30 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-codestorm-blue/50"
              >
                <option value="all">Todas las dificultades</option>
                <option value="Fácil">Fácil</option>
                <option value="Moderado">Moderado</option>
                <option value="Avanzado">Avanzado</option>
              </select>
            </div>

            {/* Modernidad */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Modernidad</label>
              <select
                value={filters.modernity}
                onChange={(e) => setFilters(prev => ({ ...prev, modernity: e.target.value as ModernityStatus | 'all' }))}
                className="w-full bg-codestorm-dark border border-codestorm-blue/30 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-codestorm-blue/50"
              >
                <option value="all">Todas</option>
                <option value="Reciente">Reciente</option>
                <option value="Establecido">Establecido</option>
                <option value="Legacy">Legacy</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Contador de resultados y controles */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">
          {filteredStacks.length} stack{filteredStacks.length !== 1 ? 's' : ''} encontrado{filteredStacks.length !== 1 ? 's' : ''}
        </p>

        {/* Controles de navegación mejorados */}
        {filteredStacks.length > cardsPerView && (
          <div className="flex items-center space-x-3">
            <button
              onClick={goToPrevious}
              disabled={isAnimating}
              className="carousel-nav-button group p-3 rounded-lg bg-codestorm-darker text-gray-400 hover:text-white hover:bg-codestorm-blue/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:animate-laser-glow"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              title="Anterior (←)"
            >
              <ChevronLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            <div className="flex items-center px-4 py-2 bg-codestorm-darker/50 rounded-lg backdrop-blur-sm">
              <span className="text-sm text-gray-400 font-medium">
                {currentIndex + 1} - {Math.min(currentIndex + cardsPerView, filteredStacks.length)} de {filteredStacks.length}
              </span>
            </div>

            <button
              onClick={goToNext}
              disabled={isAnimating}
              className="carousel-nav-button group p-3 rounded-lg bg-codestorm-darker text-gray-400 hover:text-white hover:bg-codestorm-blue/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:animate-laser-glow"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              title="Siguiente (→)"
            >
              <ChevronRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {/* Indicadores de posición (dots) mejorados */}
      {filteredStacks.length > cardsPerView && (
        <div className="flex justify-center mb-6">
          <div className="flex space-x-3 p-2 bg-codestorm-darker/50 rounded-full backdrop-blur-sm">
            {Array.from({ length: maxIndex + 1 }, (_, index) => (
              <button
                key={index}
                onClick={() => {
                  goToSlide(index);
                  // Efecto de rebote al hacer clic
                  const dot = document.getElementById(`dot-${index}`);
                  if (dot) {
                    dot.classList.add('animate-bounce-dot');
                    setTimeout(() => dot.classList.remove('animate-bounce-dot'), 1000);
                  }
                }}
                className={`
                  carousel-dot w-3 h-3 rounded-full transition-all duration-300 relative
                  ${index === currentIndex
                    ? 'bg-codestorm-accent shadow-lg shadow-codestorm-accent/50 scale-125 animate-pulse-subtle'
                    : 'bg-gray-600 hover:bg-gray-500 hover:scale-110'
                  }
                  ${isAnimating ? 'pointer-events-none' : ''}
                `}
                disabled={isAnimating}
                id={`dot-${index}`}
                title={`Ir a la página ${index + 1}`}
              >
                {/* Efecto de glow interno */}
                {index === currentIndex && (
                  <div className="absolute inset-0 rounded-full bg-codestorm-accent/30 animate-ping" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Carrusel de tarjetas con soporte táctil */}
      <div
        className="relative overflow-hidden carousel-container"
        ref={carouselRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className={`flex carousel-track transition-all duration-300 ease-in-out ${isAnimating ? 'pointer-events-none' : ''}`}
          style={{
            transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`,
            width: `${(filteredStacks.length / cardsPerView) * 100}%`
          }}
        >
          {filteredStacks.map((stack) => (
            <div
              key={stack.id}
              className={`flex-shrink-0 px-2`}
              style={{ width: `${100 / filteredStacks.length}%` }}
            >
              <div
                className={`
                  stack-card relative bg-codestorm-darker rounded-lg border-2 cursor-pointer h-full overflow-hidden
                  transition-all duration-300 ease-in-out group
                  ${selectedStackId === stack.id
                    ? 'stack-card-selected border-codestorm-accent shadow-2xl shadow-codestorm-accent/30 scale-105 animate-pulse-subtle'
                    : 'border-codestorm-blue/30 hover:border-codestorm-blue/60'
                  }
                  ${hoveredStack === stack.id
                    ? 'transform scale-105 shadow-2xl shadow-blue-500/20 border-blue-400/60 animate-laser-glow'
                    : ''
                  }
                `}
                onClick={() => {
                  onSelectStack(stack);
                  // Efecto de pulso al seleccionar
                  const element = document.getElementById(`stack-${stack.id}`);
                  if (element) {
                    element.classList.add('animate-pulse');
                    setTimeout(() => element.classList.remove('animate-pulse'), 600);
                  }
                }}
                onMouseEnter={() => {
                  setHoveredStack(stack.id);
                  setIsPaused(true);
                }}
                onMouseLeave={() => {
                  setHoveredStack(null);
                  setIsPaused(false);
                }}
                id={`stack-${stack.id}`}
              >
                {/* Efecto láser/glow de fondo */}
                <div className={`
                  absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  bg-gradient-to-r from-transparent via-blue-500/10 to-transparent
                  animate-pulse
                `} />

                {/* Efecto de brillo en los bordes */}
                <div className={`
                  absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  bg-gradient-to-r from-blue-500/20 via-transparent to-purple-500/20
                  blur-sm -z-10
                `} />
                {/* Badge de selección */}
                {selectedStackId === stack.id && (
                  <div className="absolute -top-2 -right-2 bg-codestorm-accent rounded-full p-1 z-10">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Header de la tarjeta */}
                <div className="p-4 border-b border-codestorm-blue/20">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div
                        className="text-2xl mr-3 p-2 rounded-lg"
                        style={{ backgroundColor: `${stack.primaryColor}20` }}
                      >
                        {stack.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{stack.name}</h3>
                        <p className="text-sm text-gray-400">{stack.shortDescription}</p>
                      </div>
                    </div>
                    {getProjectTypeIcon(stack.recommendedFor)}
                  </div>

                  {/* Badges de estado */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs border ${getDifficultyColor(stack.difficultyLevel)}`}>
                      {stack.difficultyLevel}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs border ${getModernityColor(stack.modernityStatus)}`}>
                      {stack.modernityStatus}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                      {stack.popularity} adopción
                    </span>
                  </div>

                  {/* Métricas principales */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center">
                      <div className="flex mr-2">
                        {renderStars(stack.implementationEase)}
                      </div>
                      <span className="text-xs text-gray-400">Facilidad</span>
                    </div>
                    <div className="flex items-center">
                      <div className="flex mr-2">
                        {renderStars(stack.uiQuality)}
                      </div>
                      <span className="text-xs text-gray-400">UI Quality</span>
                    </div>
                  </div>
                </div>

                {/* Contenido principal */}
                <div className="p-4 space-y-4">
                  {/* Descripción */}
                  <p className="text-sm text-gray-300 line-clamp-3">
                    {stack.description}
                  </p>

                  {/* Tecnologías principales */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
                      <Code className="w-4 h-4 mr-1" />
                      Tecnologías
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {stack.technologies.slice(0, 4).map((tech, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-codestorm-blue/20 text-blue-300 rounded text-xs"
                        >
                          {tech.name}
                        </span>
                      ))}
                      {stack.technologies.length > 4 && (
                        <span className="px-2 py-1 bg-gray-600/20 text-gray-400 rounded text-xs">
                          +{stack.technologies.length - 4} más
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Casos de uso */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Ideal para
                    </h4>
                    <ul className="text-xs text-gray-300 space-y-1">
                      {stack.useCases.slice(0, 3).map((useCase, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-codestorm-accent mr-1">•</span>
                          {useCase}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Métricas de rendimiento */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-gray-400" />
                      <span className="text-gray-400">Carga:</span>
                      <span className="text-white ml-1">{stack.performance.loadTime}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-3 h-3 mr-1 text-gray-400" />
                      <span className="text-gray-400">GitHub:</span>
                      <span className="text-white ml-1">{stack.community.githubStars}</span>
                    </div>
                  </div>

                  {/* Ventajas principales */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
                      <Zap className="w-4 h-4 mr-1" />
                      Ventajas
                    </h4>
                    <ul className="text-xs text-gray-300 space-y-1">
                      {stack.advantages.slice(0, 3).map((advantage, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-400 mr-1">✓</span>
                          {advantage}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer con acciones */}
                <div className="p-4 border-t border-codestorm-blue/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(stack.officialWebsite, '_blank');
                        }}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Sitio oficial"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onShowDetails) {
                            onShowDetails(stack);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Más información"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-xs text-gray-400">
                      Actualizado {stack.lastUpdate}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mensaje cuando no hay resultados */}
      {filteredStacks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No se encontraron stacks
          </h3>
          <p className="text-gray-400 mb-4">
            Intenta ajustar los filtros para encontrar más opciones
          </p>
          <button
            onClick={() => {
              setFilters({ type: 'all', difficulty: 'all', modernity: 'all', searchTerm: '' });
              setSelectedCategory('all');
            }}
            className="px-4 py-2 bg-codestorm-accent text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
};

export default TechnologyStackCarousel;
