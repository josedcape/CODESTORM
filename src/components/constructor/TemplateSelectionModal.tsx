import React, { useState } from 'react';
import { X, ArrowRight, Code, Clock, Star, Filter, Search } from 'lucide-react';
import { TechnologyStack } from '../../types/technologyStacks';
import { TemplateOption } from '../../services/ConstructorWorkflowService';
import { useUI } from '../../contexts/UIContext';

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TemplateOption) => void;
  selectedStack: TechnologyStack;
  userInstruction: string;
}

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  selectedStack,
  userInstruction
}) => {
  const { isMobile } = useUI();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [complexityFilter, setComplexityFilter] = useState('all');

  // Generate templates based on the selected stack
  const generateTemplates = (): TemplateOption[] => {
    const baseTemplates: TemplateOption[] = [
      {
        id: 'basic-starter',
        name: 'Proyecto Básico',
        description: 'Configuración inicial con estructura básica y ejemplos simples',
        category: 'starter',
        technologies: selectedStack.technologies.map(t => t.name),
        complexity: 'beginner',
        estimatedTime: '1-2 horas',
        preview: 'Estructura básica con archivos de configuración y ejemplos'
      },
      {
        id: 'full-featured',
        name: 'Aplicación Completa',
        description: 'Proyecto completo con autenticación, base de datos y API',
        category: 'full-stack',
        technologies: selectedStack.technologies.map(t => t.name),
        complexity: 'advanced',
        estimatedTime: '1-2 días',
        preview: 'Aplicación completa con todas las funcionalidades principales'
      },
      {
        id: 'api-only',
        name: 'API Backend',
        description: 'Enfoque en backend con API REST y documentación',
        category: 'backend',
        technologies: selectedStack.technologies.filter(t => !t.name.includes('React') && !t.name.includes('Angular')).map(t => t.name),
        complexity: 'intermediate',
        estimatedTime: '4-6 horas',
        preview: 'API REST con endpoints documentados y middleware'
      },
      {
        id: 'frontend-spa',
        name: 'Frontend SPA',
        description: 'Single Page Application con componentes reutilizables',
        category: 'frontend',
        technologies: selectedStack.technologies.filter(t => t.name.includes('React') || t.name.includes('Angular') || t.name.includes('Vue')).map(t => t.name),
        complexity: 'intermediate',
        estimatedTime: '3-5 horas',
        preview: 'SPA con routing, estado global y componentes modulares'
      },
      {
        id: 'microservices',
        name: 'Microservicios',
        description: 'Arquitectura de microservicios con contenedores',
        category: 'architecture',
        technologies: [...selectedStack.technologies.map(t => t.name), 'Docker', 'Kubernetes'],
        complexity: 'advanced',
        estimatedTime: '2-3 días',
        preview: 'Múltiples servicios independientes con comunicación API'
      },
      {
        id: 'mvp-rapid',
        name: 'MVP Rápido',
        description: 'Producto mínimo viable para validación rápida',
        category: 'mvp',
        technologies: selectedStack.technologies.map(t => t.name),
        complexity: 'beginner',
        estimatedTime: '2-4 horas',
        preview: 'Funcionalidades esenciales para validar la idea'
      }
    ];

    return baseTemplates.filter(template => {
      // Filter by search term
      if (searchTerm && !template.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !template.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filter by category
      if (categoryFilter !== 'all' && template.category !== categoryFilter) {
        return false;
      }

      // Filter by complexity
      if (complexityFilter !== 'all' && template.complexity !== complexityFilter) {
        return false;
      }

      return true;
    });
  };

  const templates = generateTemplates();

  if (!isOpen) return null;

  const handleTemplateSelect = (template: TemplateOption) => {
    setSelectedTemplate(template);
  };

  const handleConfirmSelection = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'starter': return '🚀';
      case 'full-stack': return '🏗️';
      case 'backend': return '⚙️';
      case 'frontend': return '🎨';
      case 'architecture': return '🏛️';
      case 'mvp': return '⚡';
      default: return '📦';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative bg-codestorm-darker rounded-xl border border-codestorm-blue/30 shadow-2xl
        ${isMobile ? 'w-full h-full' : 'w-[90vw] h-[85vh] max-w-6xl'}
        flex flex-col overflow-hidden
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-codestorm-blue/20">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              📋 Selecciona una Plantilla
            </h2>
            <p className="text-gray-400 text-sm mb-2">
              Elige la plantilla que mejor se adapte a tu proyecto con {selectedStack.name}
            </p>
            {userInstruction && (
              <div className="p-3 bg-codestorm-blue/10 rounded-lg border border-codestorm-blue/20">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-codestorm-accent">Tu proyecto:</span> {userInstruction}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-codestorm-blue/20 bg-codestorm-dark">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar plantillas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-codestorm-darker border border-codestorm-blue/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-codestorm-blue/50"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-codestorm-darker border border-codestorm-blue/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-codestorm-blue/50"
            >
              <option value="all">Todas las categorías</option>
              <option value="starter">Inicio</option>
              <option value="full-stack">Full Stack</option>
              <option value="backend">Backend</option>
              <option value="frontend">Frontend</option>
              <option value="architecture">Arquitectura</option>
              <option value="mvp">MVP</option>
            </select>

            {/* Complexity Filter */}
            <select
              value={complexityFilter}
              onChange={(e) => setComplexityFilter(e.target.value)}
              className="px-3 py-2 bg-codestorm-darker border border-codestorm-blue/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-codestorm-blue/50"
            >
              <option value="all">Todas las complejidades</option>
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`
                  relative bg-codestorm-dark rounded-lg border-2 transition-all duration-300 cursor-pointer p-6
                  ${selectedTemplate?.id === template.id
                    ? 'border-codestorm-accent shadow-lg shadow-codestorm-accent/20 scale-105'
                    : 'border-codestorm-blue/30 hover:border-codestorm-blue/50 hover:scale-102'
                  }
                `}
              >
                {/* Selection indicator */}
                {selectedTemplate?.id === template.id && (
                  <div className="absolute -top-2 -right-2 bg-codestorm-accent rounded-full p-1">
                    <Star className="w-4 h-4 text-white fill-current" />
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getCategoryIcon(template.category)}</span>
                    <div>
                      <h3 className="text-lg font-bold text-white">{template.name}</h3>
                      <p className="text-sm text-gray-400 capitalize">{template.category}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                  {template.description}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs border ${getComplexityColor(template.complexity)}`}>
                    {template.complexity}
                  </span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {template.estimatedTime}
                  </span>
                </div>

                {/* Technologies */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
                    <Code className="w-4 h-4 mr-1" />
                    Tecnologías
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {template.technologies.slice(0, 3).map((tech, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-codestorm-blue/20 text-blue-300 rounded text-xs"
                      >
                        {tech}
                      </span>
                    ))}
                    {template.technologies.length > 3 && (
                      <span className="px-2 py-1 bg-gray-600/20 text-gray-400 rounded text-xs">
                        +{template.technologies.length - 3} más
                      </span>
                    )}
                  </div>
                </div>

                {/* Preview */}
                {template.preview && (
                  <div className="text-xs text-gray-400 italic">
                    {template.preview}
                  </div>
                )}
              </div>
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No se encontraron plantillas
              </h3>
              <p className="text-gray-400 mb-4">
                Intenta ajustar los filtros para encontrar más opciones
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setComplexityFilter('all');
                }}
                className="px-4 py-2 bg-codestorm-accent text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-codestorm-blue/20">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {selectedTemplate ? `Seleccionado: ${selectedTemplate.name}` : 'Selecciona una plantilla para continuar'}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={!selectedTemplate}
                className={`
                  px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
                  ${selectedTemplate
                    ? 'bg-codestorm-accent text-white hover:bg-blue-600 hover:scale-105'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelectionModal;
