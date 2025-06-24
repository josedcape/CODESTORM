import React, { useState } from 'react';
import { Search, Layout, Type, Image, FileText, Box, List, ClipboardEdit, ShoppingCart, Menu, ChevronDown, ChevronUp } from 'lucide-react';

export interface WebComponent {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  description: string;
}

interface ComponentPaletteProps {
  onSelectComponent: (component: WebComponent) => void;
}

const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onSelectComponent }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['layout', 'content']);

  // Categorías de componentes
  const categories = [
    { id: 'layout', name: 'Diseño', icon: <Layout className="h-4 w-4" /> },
    { id: 'content', name: 'Contenido', icon: <FileText className="h-4 w-4" /> },
    { id: 'media', name: 'Media', icon: <Image className="h-4 w-4" /> },
    { id: 'navigation', name: 'Navegación', icon: <Menu className="h-4 w-4" /> },
    { id: 'forms', name: 'Formularios', icon: <ClipboardEdit className="h-4 w-4" /> },
    { id: 'ecommerce', name: 'E-commerce', icon: <ShoppingCart className="h-4 w-4" /> }
  ];

  // Componentes disponibles
  const components: WebComponent[] = [
    // Componentes de diseño
    {
      id: 'section',
      name: 'Sección',
      category: 'layout',
      icon: <Layout className="h-4 w-4" />,
      description: 'Contenedor principal para organizar el contenido en secciones.'
    },
    {
      id: 'container',
      name: 'Contenedor',
      category: 'layout',
      icon: <Box className="h-4 w-4" />,
      description: 'Contenedor flexible para agrupar elementos.'
    },
    {
      id: 'columns',
      name: 'Columnas',
      category: 'layout',
      icon: <Layout className="h-4 w-4" />,
      description: 'Divide el contenido en columnas responsivas.'
    },
    {
      id: 'spacer',
      name: 'Espaciador',
      category: 'layout',
      icon: <Box className="h-4 w-4" />,
      description: 'Añade espacio vertical entre elementos.'
    },

    // Componentes de contenido
    {
      id: 'heading',
      name: 'Título',
      category: 'content',
      icon: <Type className="h-4 w-4" />,
      description: 'Títulos y subtítulos para tu contenido.'
    },
    {
      id: 'paragraph',
      name: 'Párrafo',
      category: 'content',
      icon: <FileText className="h-4 w-4" />,
      description: 'Bloques de texto para tu contenido.'
    },
    {
      id: 'button',
      name: 'Botón',
      category: 'content',
      icon: <Box className="h-4 w-4" />,
      description: 'Botones personalizables para llamadas a la acción.'
    },
    {
      id: 'list',
      name: 'Lista',
      category: 'content',
      icon: <List className="h-4 w-4" />,
      description: 'Listas ordenadas o desordenadas.'
    },

    // Componentes de media
    {
      id: 'image',
      name: 'Imagen',
      category: 'media',
      icon: <Image className="h-4 w-4" />,
      description: 'Añade imágenes a tu sitio web.'
    },
    {
      id: 'gallery',
      name: 'Galería',
      category: 'media',
      icon: <Image className="h-4 w-4" />,
      description: 'Muestra múltiples imágenes en una galería.'
    },
    {
      id: 'video',
      name: 'Video',
      category: 'media',
      icon: <Image className="h-4 w-4" />,
      description: 'Integra videos de YouTube, Vimeo u otras plataformas.'
    },

    // Componentes de navegación
    {
      id: 'navbar',
      name: 'Barra de navegación',
      category: 'navigation',
      icon: <Menu className="h-4 w-4" />,
      description: 'Barra de navegación principal para tu sitio.'
    },
    {
      id: 'menu',
      name: 'Menú',
      category: 'navigation',
      icon: <Menu className="h-4 w-4" />,
      description: 'Menú desplegable para navegación.'
    },
    {
      id: 'footer',
      name: 'Pie de página',
      category: 'navigation',
      icon: <Menu className="h-4 w-4" />,
      description: 'Pie de página con enlaces y copyright.'
    },

    // Componentes de formularios
    {
      id: 'contact-form',
      name: 'Formulario de contacto',
      category: 'forms',
      icon: <ClipboardEdit className="h-4 w-4" />,
      description: 'Formulario completo para que los visitantes te contacten.'
    },
    {
      id: 'input',
      name: 'Campo de texto',
      category: 'forms',
      icon: <ClipboardEdit className="h-4 w-4" />,
      description: 'Campo de entrada para formularios.'
    },
    {
      id: 'checkbox',
      name: 'Casilla de verificación',
      category: 'forms',
      icon: <ClipboardEdit className="h-4 w-4" />,
      description: 'Casillas de verificación para formularios.'
    },

    // Componentes de e-commerce
    {
      id: 'product-card',
      name: 'Tarjeta de producto',
      category: 'ecommerce',
      icon: <ShoppingCart className="h-4 w-4" />,
      description: 'Muestra productos con imagen, título, precio y botón de compra.'
    },
    {
      id: 'product-grid',
      name: 'Cuadrícula de productos',
      category: 'ecommerce',
      icon: <ShoppingCart className="h-4 w-4" />,
      description: 'Muestra múltiples productos en una cuadrícula.'
    },
    {
      id: 'cart',
      name: 'Carrito de compras',
      category: 'ecommerce',
      icon: <ShoppingCart className="h-4 w-4" />,
      description: 'Carrito de compras para tu tienda online.'
    }
  ];

  // Filtrar componentes según búsqueda
  const filteredComponents = components.filter(component =>
    component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    component.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Agrupar componentes por categoría
  const groupedComponents = categories.map(category => ({
    ...category,
    components: filteredComponents.filter(component => component.category === category.id)
  }));

  // Alternar la expansión de una categoría
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="bg-codestorm-darker rounded-lg shadow-lg p-4 h-full overflow-hidden flex flex-col">
      <h2 className="text-lg font-semibold text-white mb-3">Componentes</h2>

      {/* Barra de búsqueda */}
      <div className="relative mb-3">
        <input
          type="text"
          placeholder="Buscar componentes..."
          className="w-full bg-codestorm-dark border border-codestorm-blue/30 rounded-md py-1.5 pl-8 pr-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-codestorm-blue/50"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
      </div>

      {/* Lista de componentes agrupados por categoría */}
      <div className="flex-1 overflow-y-auto pr-1">
        {groupedComponents.map(category => (
          <div key={category.id} className="mb-2">
            <button
              className="w-full flex items-center justify-between bg-codestorm-dark hover:bg-codestorm-dark/70 rounded-md px-3 py-2 text-white text-sm font-medium"
              onClick={() => toggleCategory(category.id)}
            >
              <div className="flex items-center">
                {category.icon}
                <span className="ml-2">{category.name}</span>
                <span className="ml-2 text-xs text-gray-400">({category.components.length})</span>
              </div>
              {expandedCategories.includes(category.id) ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>

            {expandedCategories.includes(category.id) && category.components.length > 0 && (
              <div className="mt-1 ml-2 space-y-1">
                {category.components.map(component => (
                  <div
                    key={component.id}
                    className="flex items-center px-3 py-2 rounded-md hover:bg-codestorm-blue/10 cursor-pointer text-sm text-gray-300 hover:text-white"
                    onClick={() => onSelectComponent(component)}
                    title={component.description}
                  >
                    {component.icon}
                    <span className="ml-2">{component.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComponentPalette;
