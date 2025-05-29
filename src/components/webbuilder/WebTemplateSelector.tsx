import React, { useState } from 'react';
import { Search, Filter, Grid, List, ChevronRight } from 'lucide-react';

export interface WebTemplate {
  id: string;
  name: string;
  category: string;
  tags: string[];
  thumbnail: string;
  description: string;
}

interface WebTemplateSelectorProps {
  onSelectTemplate: (template: WebTemplate) => void;
}

const WebTemplateSelector: React.FC<WebTemplateSelectorProps> = ({ onSelectTemplate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Categorías de plantillas
  const categories = [
    { id: 'all', name: 'Todas' },
    { id: 'business', name: 'Negocios' },
    { id: 'portfolio', name: 'Portafolio' },
    { id: 'ecommerce', name: 'Tienda Online' },
    { id: 'blog', name: 'Blog' },
    { id: 'landing', name: 'Landing Page' },
    { id: 'personal', name: 'Personal' }
  ];

  // Plantillas de ejemplo
  const templates: WebTemplate[] = [
    {
      id: 'template-1',
      name: 'Business Pro',
      category: 'business',
      tags: ['profesional', 'corporativo', 'moderno'],
      thumbnail: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Business+Pro',
      description: 'Plantilla profesional para empresas con diseño moderno y secciones para servicios, equipo y testimonios.'
    },
    {
      id: 'template-2',
      name: 'Creative Portfolio',
      category: 'portfolio',
      tags: ['creativo', 'diseño', 'artístico'],
      thumbnail: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Creative+Portfolio',
      description: 'Muestra tus trabajos creativos con esta plantilla de portafolio elegante y minimalista.'
    },
    {
      id: 'template-3',
      name: 'Online Shop',
      category: 'ecommerce',
      tags: ['tienda', 'productos', 'ventas'],
      thumbnail: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Online+Shop',
      description: 'Plantilla completa para tienda online con catálogo de productos, carrito de compras y proceso de pago.'
    },
    {
      id: 'template-4',
      name: 'Blog Standard',
      category: 'blog',
      tags: ['blog', 'artículos', 'contenido'],
      thumbnail: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Blog+Standard',
      description: 'Diseño optimizado para blogs con categorías, comentarios y diseño responsivo.'
    },
    {
      id: 'template-5',
      name: 'Product Launch',
      category: 'landing',
      tags: ['lanzamiento', 'producto', 'conversión'],
      thumbnail: 'https://via.placeholder.com/300x200/ec4899/ffffff?text=Product+Launch',
      description: 'Landing page de alto impacto para lanzamientos de productos o servicios.'
    },
    {
      id: 'template-6',
      name: 'Personal Resume',
      category: 'personal',
      tags: ['cv', 'personal', 'profesional'],
      thumbnail: 'https://via.placeholder.com/300x200/14b8a6/ffffff?text=Personal+Resume',
      description: 'Plantilla para CV online con secciones para experiencia, habilidades y educación.'
    }
  ];

  // Filtrar plantillas según búsqueda y categoría
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === null || selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-codestorm-darker rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-semibold text-white mb-4">Selecciona una plantilla</h2>
      
      {/* Barra de búsqueda */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Buscar plantillas..."
          className="w-full bg-codestorm-dark border border-codestorm-blue/30 rounded-md py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-codestorm-blue/50"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>
      
      {/* Filtros de categoría */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(category => (
          <button
            key={category.id}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedCategory === category.id || (category.id === 'all' && selectedCategory === null)
                ? 'bg-codestorm-blue text-white'
                : 'bg-codestorm-dark text-gray-300 hover:bg-codestorm-blue/20'
            }`}
            onClick={() => setSelectedCategory(category.id === 'all' ? null : category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
      
      {/* Controles de vista */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-400">
          {filteredTemplates.length} plantillas encontradas
        </div>
        <div className="flex space-x-2">
          <button
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-codestorm-blue/30 text-white' : 'text-gray-400 hover:bg-codestorm-blue/20'}`}
            onClick={() => setViewMode('grid')}
            title="Vista de cuadrícula"
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-codestorm-blue/30 text-white' : 'text-gray-400 hover:bg-codestorm-blue/20'}`}
            onClick={() => setViewMode('list')}
            title="Vista de lista"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Lista de plantillas */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-codestorm-dark rounded-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105 cursor-pointer border border-transparent hover:border-codestorm-blue/30"
              onClick={() => onSelectTemplate(template)}
            >
              <img
                src={template.thumbnail}
                alt={template.name}
                className="w-full h-40 object-cover"
              />
              <div className="p-3">
                <h3 className="text-white font-medium">{template.name}</h3>
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{template.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {template.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="text-xs bg-codestorm-blue/20 text-blue-300 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="flex bg-codestorm-dark rounded-md overflow-hidden hover:bg-codestorm-dark/70 transition-all duration-200 cursor-pointer border border-transparent hover:border-codestorm-blue/30"
              onClick={() => onSelectTemplate(template)}
            >
              <img
                src={template.thumbnail}
                alt={template.name}
                className="w-24 h-16 object-cover"
              />
              <div className="p-3 flex-1">
                <h3 className="text-white font-medium">{template.name}</h3>
                <p className="text-gray-400 text-sm line-clamp-1">{template.description}</p>
              </div>
              <div className="flex items-center pr-3">
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WebTemplateSelector;
