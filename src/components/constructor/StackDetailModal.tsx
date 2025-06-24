import React from 'react';
import {
  X,
  Star,
  Clock,
  Users,
  TrendingUp,
  ExternalLink,
  Code,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Download,
  Globe,
  Smartphone,
  Server,
  Zap,
  Target,
  Award,
  Settings
} from 'lucide-react';
import { TechnologyStack, DifficultyLevel, ModernityStatus } from '../../types/technologyStacks';

interface StackDetailModalProps {
  stack: TechnologyStack;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (stack: TechnologyStack) => void;
  isSelected?: boolean;
}

const StackDetailModal: React.FC<StackDetailModalProps> = ({
  stack,
  isOpen,
  onClose,
  onSelect,
  isSelected = false
}) => {
  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-codestorm-darker rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-codestorm-blue/20">
          <div className="flex items-center">
            <div 
              className="text-3xl mr-4 p-3 rounded-lg"
              style={{ backgroundColor: `${stack.primaryColor}20` }}
            >
              {stack.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{stack.name}</h2>
              <p className="text-gray-400">{stack.shortDescription}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Badges y métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Características
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Facilidad de implementación:</span>
                    <div className="flex">
                      {renderStars(stack.implementationEase)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Calidad de UI:</span>
                    <div className="flex">
                      {renderStars(stack.uiQuality)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Dificultad:</span>
                    <span className={`px-2 py-1 rounded-full text-xs border ${getDifficultyColor(stack.difficultyLevel)}`}>
                      {stack.difficultyLevel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Estado:</span>
                    <span className={`px-2 py-1 rounded-full text-xs border ${getModernityColor(stack.modernityStatus)}`}>
                      {stack.modernityStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Popularidad:</span>
                    <span className="text-green-400 font-semibold">{stack.popularity}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Rendimiento
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Tiempo de carga:</span>
                    <span className="text-white">{stack.performance.loadTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Tiempo de build:</span>
                    <span className="text-white">{stack.performance.buildTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Tamaño del bundle:</span>
                    <span className="text-white">{stack.performance.bundleSize}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Uso de memoria:</span>
                    <span className="text-white">{stack.performance.memoryUsage}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Curva de aprendizaje:</span>
                    <span className="text-white text-sm">{stack.learningCurve}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Descripción completa */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Descripción</h3>
              <p className="text-gray-300 leading-relaxed">{stack.description}</p>
            </div>

            {/* Tecnologías */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <Code className="w-5 h-5 mr-2" />
                Stack Tecnológico
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stack.technologies.map((tech, index) => (
                  <div key={index} className="bg-codestorm-dark rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{tech.name}</span>
                      {tech.version && (
                        <span className="text-xs text-gray-400 bg-gray-600/20 px-2 py-1 rounded">
                          {tech.version}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{tech.role}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Casos de uso */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Casos de Uso Recomendados
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {stack.useCases.map((useCase, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{useCase}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ventajas y Desventajas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                  Ventajas
                </h3>
                <ul className="space-y-2">
                  {stack.advantages.map((advantage, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span>
                      <span className="text-gray-300 text-sm">{advantage}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-orange-400" />
                  Consideraciones
                </h3>
                <ul className="space-y-2">
                  {stack.disadvantages.map((disadvantage, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-orange-400 mr-2">⚠</span>
                      <span className="text-gray-300 text-sm">{disadvantage}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Casos de éxito */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Casos de Éxito
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {stack.successCases.map((successCase, index) => (
                  <div key={index} className="bg-codestorm-dark rounded-lg p-3">
                    <span className="text-white font-medium">{successCase}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requisitos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Prerrequisitos
                </h3>
                <ul className="space-y-2">
                  {stack.prerequisites.map((prereq, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span className="text-gray-300 text-sm">{prereq}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Requisitos del Sistema
                </h3>
                <ul className="space-y-2">
                  {stack.systemRequirements.map((req, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-purple-400 mr-2">•</span>
                      <span className="text-gray-300 text-sm">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recursos */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <ExternalLink className="w-5 h-5 mr-2" />
                Recursos y Enlaces
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                  href={stack.officialWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 bg-codestorm-dark rounded-lg hover:bg-codestorm-blue/20 transition-colors"
                >
                  <Globe className="w-5 h-5 mr-3 text-blue-400" />
                  <span className="text-white">Sitio Oficial</span>
                </a>
                <a
                  href={stack.documentation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 bg-codestorm-dark rounded-lg hover:bg-codestorm-blue/20 transition-colors"
                >
                  <BookOpen className="w-5 h-5 mr-3 text-green-400" />
                  <span className="text-white">Documentación</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="flex items-center justify-between p-6 border-t border-codestorm-blue/20">
          <div className="text-sm text-gray-400">
            Última actualización: {stack.lastUpdate}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={() => onSelect(stack)}
              className={`
                px-6 py-2 rounded-lg font-medium transition-colors
                ${isSelected
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-codestorm-accent text-white hover:bg-blue-600'
                }
              `}
            >
              {isSelected ? 'Seleccionado' : 'Seleccionar Stack'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StackDetailModal;
