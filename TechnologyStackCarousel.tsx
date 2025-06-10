import React, { useState, useRef, useEffect } from 'react';
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
  Zap
} from 'lucide-react';
import { TechnologyStack, StackFilter, ProjectType, DifficultyLevel, ModernityStatus } from '../../types/technologyStacks';
import { technologyStacks, stackCategories } from '../../data/technologyStacks';
import { useUI } from '../../contexts/UIContext';

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
  const carouselRef = useRef<HTMLDivElement>(null);

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

  // Navegación del carrusel
  const goToPrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

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
          <h2 className="text-2xl font-bold text-white mb-2">
            🚀 Plantillas de Tecnología
          </h2>
          <p className="text-gray-400 text-sm">
            Selecciona el stack perfecto para tu proyecto
          </p>
        </div>

        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${showFilters
                ? 'bg-codestorm-accent text-white'
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

      {/* Contador de resultados */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">
          {filteredStacks.length} stack{filteredStacks.length !== 1 ? 's' : ''} encontrado{filteredStacks.length !== 1 ? 's' : ''}
        </p>

        {/* Controles de navegación */}
        {filteredStacks.length > cardsPerView && (
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="p-2 rounded-md bg-codestorm-darker text-gray-400 hover:text-white hover:bg-codestorm-blue/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-400">
              {currentIndex + 1} - {Math.min(currentIndex + cardsPerView, filteredStacks.length)} de {filteredStacks.length}
            </span>
            <button
              onClick={goToNext}
              disabled={currentIndex >= maxIndex}
              className="p-2 rounded-md bg-codestorm-darker text-gray-400 hover:text-white hover:bg-codestorm-blue/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Carrusel de tarjetas */}
      <div className="relative overflow-hidden" ref={carouselRef}>
        <div
          className="flex transition-transform duration-300 ease-in-out"
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
                  relative bg-codestorm-darker rounded-lg border-2 transition-all duration-300 cursor-pointer h-full
                  ${selectedStackId === stack.id
                    ? 'border-codestorm-accent shadow-lg shadow-codestorm-accent/20'
                    : 'border-codestorm-blue/30 hover:border-codestorm-blue/50'
                  }
                  ${hoveredStack === stack.id ? 'transform scale-105' : ''}
                `}
                onClick={() => onSelectStack(stack)}
                onMouseEnter={() => setHoveredStack(stack.id)}
                onMouseLeave={() => setHoveredStack(null)}
              >
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
