import React, { useState } from 'react';
import { Smartphone, Tablet, Monitor, Save, Undo, Redo, Eye, Code, Settings, Plus, Trash, Move, Copy, Image } from 'lucide-react';
import { WebComponent } from './ComponentPalette';

interface VisualEditorProps {
  selectedComponents: WebComponent[];
  onAddComponent: (component: WebComponent) => void;
  onRemoveComponent: (componentId: string) => void;
  onMoveComponent: (componentId: string, direction: 'up' | 'down') => void;
  onPreview: () => void;
  onSave: () => void;
  onViewCode: () => void;
}

const VisualEditor: React.FC<VisualEditorProps> = ({
  selectedComponents,
  onAddComponent,
  onRemoveComponent,
  onMoveComponent,
  onPreview,
  onSave,
  onViewCode
}) => {
  const [viewportSize, setViewportSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  // Función para renderizar un componente según su tipo
  const renderComponent = (component: WebComponent) => {
    const isSelected = component.id === selectedComponentId;
    const componentClasses = `relative p-4 border-2 ${isSelected ? 'border-codestorm-blue' : 'border-dashed border-gray-600'} rounded-md mb-4 hover:border-codestorm-blue/50 transition-colors duration-200`;

    switch (component.id) {
      case 'section':
        return (
          <div className={componentClasses}>
            <div className="bg-codestorm-dark/50 p-8 rounded-md flex items-center justify-center min-h-[100px]">
              <p className="text-gray-400 text-center">Sección</p>
            </div>
            {renderComponentControls(component)}
          </div>
        );

      case 'heading':
        return (
          <div className={componentClasses}>
            <h2 className="text-2xl font-bold text-white">Título de ejemplo</h2>
            {renderComponentControls(component)}
          </div>
        );

      case 'paragraph':
        return (
          <div className={componentClasses}>
            <p className="text-gray-300">
              Este es un párrafo de ejemplo. Aquí puedes añadir el contenido que desees mostrar en tu sitio web.
              Haz clic para editar este texto y personalizarlo según tus necesidades.
            </p>
            {renderComponentControls(component)}
          </div>
        );

      case 'button':
        return (
          <div className={componentClasses}>
            <button className="bg-codestorm-blue hover:bg-codestorm-blue/80 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200">
              Botón de ejemplo
            </button>
            {renderComponentControls(component)}
          </div>
        );

      case 'image':
        return (
          <div className={componentClasses}>
            <div className="bg-codestorm-dark/50 p-4 rounded-md flex items-center justify-center min-h-[150px]">
              <div className="text-center">
                <Image className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-400">Imagen</p>
              </div>
            </div>
            {renderComponentControls(component)}
          </div>
        );

      case 'columns':
        return (
          <div className={componentClasses}>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-codestorm-dark/50 p-4 rounded-md flex items-center justify-center min-h-[100px]">
                <p className="text-gray-400">Columna 1</p>
              </div>
              <div className="bg-codestorm-dark/50 p-4 rounded-md flex items-center justify-center min-h-[100px]">
                <p className="text-gray-400">Columna 2</p>
              </div>
            </div>
            {renderComponentControls(component)}
          </div>
        );

      case 'navbar':
        return (
          <div className={componentClasses}>
            <div className="bg-codestorm-dark/70 p-4 rounded-md flex justify-between items-center">
              <div className="text-white font-bold">Logo</div>
              <div className="flex space-x-4">
                <span className="text-gray-300 hover:text-white cursor-pointer">Inicio</span>
                <span className="text-gray-300 hover:text-white cursor-pointer">Servicios</span>
                <span className="text-gray-300 hover:text-white cursor-pointer">Acerca de</span>
                <span className="text-gray-300 hover:text-white cursor-pointer">Contacto</span>
              </div>
            </div>
            {renderComponentControls(component)}
          </div>
        );

      case 'contact-form':
        return (
          <div className={componentClasses}>
            <div className="bg-codestorm-dark/50 p-4 rounded-md">
              <div className="mb-4">
                <label className="block text-gray-300 mb-2 text-sm">Nombre</label>
                <input type="text" className="w-full bg-codestorm-dark border border-gray-600 rounded-md py-2 px-3 text-white" placeholder="Tu nombre" />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2 text-sm">Email</label>
                <input type="email" className="w-full bg-codestorm-dark border border-gray-600 rounded-md py-2 px-3 text-white" placeholder="tu@email.com" />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2 text-sm">Mensaje</label>
                <textarea className="w-full bg-codestorm-dark border border-gray-600 rounded-md py-2 px-3 text-white h-24" placeholder="Tu mensaje"></textarea>
              </div>
              <button className="bg-codestorm-blue hover:bg-codestorm-blue/80 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200">
                Enviar mensaje
              </button>
            </div>
            {renderComponentControls(component)}
          </div>
        );

      default:
        return (
          <div className={componentClasses}>
            <div className="bg-codestorm-dark/50 p-4 rounded-md flex items-center justify-center min-h-[80px]">
              <div className="flex items-center">
                {component.icon}
                <p className="text-gray-400 ml-2">{component.name}</p>
              </div>
            </div>
            {renderComponentControls(component)}
          </div>
        );
    }
  };

  // Renderizar controles para un componente seleccionado
  const renderComponentControls = (component: WebComponent) => {
    const isSelected = component.id === selectedComponentId;

    if (!isSelected) return null;

    return (
      <div className="absolute -top-3 -right-3 flex space-x-1">
        <button
          className="bg-codestorm-dark text-gray-300 hover:text-white p-1 rounded-md"
          onClick={() => onMoveComponent(component.id, 'up')}
          title="Mover arriba"
        >
          <Move className="h-4 w-4" />
        </button>
        <button
          className="bg-codestorm-dark text-gray-300 hover:text-white p-1 rounded-md"
          onClick={() => {/* Implementar duplicación */}}
          title="Duplicar"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          className="bg-codestorm-dark text-red-400 hover:text-red-300 p-1 rounded-md"
          onClick={() => onRemoveComponent(component.id)}
          title="Eliminar"
        >
          <Trash className="h-4 w-4" />
        </button>
      </div>
    );
  };

  // Obtener estilo según el tamaño de viewport seleccionado
  const getViewportStyle = () => {
    switch (viewportSize) {
      case 'mobile':
        return { maxWidth: '375px' };
      case 'tablet':
        return { maxWidth: '768px' };
      case 'desktop':
      default:
        return { maxWidth: '100%' };
    }
  };

  return (
    <div className="bg-codestorm-darker rounded-lg shadow-lg h-full flex flex-col overflow-hidden">
      {/* Barra de herramientas */}
      <div className="bg-codestorm-dark p-3 border-b border-codestorm-blue/30 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            className={`p-1.5 rounded ${viewportSize === 'mobile' ? 'bg-codestorm-blue/30 text-white' : 'text-gray-400 hover:bg-codestorm-blue/20 hover:text-white'}`}
            onClick={() => setViewportSize('mobile')}
            title="Vista móvil"
          >
            <Smartphone className="h-4 w-4" />
          </button>
          <button
            className={`p-1.5 rounded ${viewportSize === 'tablet' ? 'bg-codestorm-blue/30 text-white' : 'text-gray-400 hover:bg-codestorm-blue/20 hover:text-white'}`}
            onClick={() => setViewportSize('tablet')}
            title="Vista tablet"
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button
            className={`p-1.5 rounded ${viewportSize === 'desktop' ? 'bg-codestorm-blue/30 text-white' : 'text-gray-400 hover:bg-codestorm-blue/20 hover:text-white'}`}
            onClick={() => setViewportSize('desktop')}
            title="Vista escritorio"
          >
            <Monitor className="h-4 w-4" />
          </button>
        </div>

        <div className="flex space-x-2">
          <button
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            onClick={() => {/* Implementar deshacer */}}
            title="Deshacer"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            onClick={() => {/* Implementar rehacer */}}
            title="Rehacer"
          >
            <Redo className="h-4 w-4" />
          </button>
          <button
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            onClick={onPreview}
            title="Vista previa"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            onClick={onViewCode}
            title="Ver código"
          >
            <Code className="h-4 w-4" />
          </button>
          <button
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            onClick={() => {/* Implementar configuración */}}
            title="Configuración"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            className="ml-2 px-3 py-1.5 bg-codestorm-blue hover:bg-codestorm-blue/80 text-white rounded-md flex items-center"
            onClick={onSave}
          >
            <Save className="h-4 w-4 mr-1" />
            <span className="text-sm">Guardar</span>
          </button>
        </div>
      </div>

      {/* Área de edición */}
      <div className="flex-1 overflow-y-auto p-4">
        <div
          className="bg-codestorm-dark rounded-md mx-auto transition-all duration-300 min-h-[500px]"
          style={getViewportStyle()}
        >
          {selectedComponents.length > 0 ? (
            <div className="p-4">
              {selectedComponents.map((component, index) => (
                <div
                  key={`${component.id}-${index}`}
                  onClick={() => setSelectedComponentId(component.id)}
                >
                  {renderComponent(component)}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[500px] text-center">
              <div>
                <Plus className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Selecciona componentes del panel izquierdo para comenzar a construir tu sitio web</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualEditor;
