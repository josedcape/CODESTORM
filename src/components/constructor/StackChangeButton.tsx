import React, { useState } from 'react';
import {
  Settings,
  ChevronDown,
  Layers,
  Code,
  RefreshCw,
  Check,
  X
} from 'lucide-react';
import { TechnologyStack } from '../../types/technologyStacks';
import { useUI } from '../../contexts/UIContext';

interface StackChangeButtonProps {
  currentStack: TechnologyStack | null;
  onChangeStack: () => void;
  onRemoveStack: () => void;
  className?: string;
}

const StackChangeButton: React.FC<StackChangeButtonProps> = ({
  currentStack,
  onChangeStack,
  onRemoveStack,
  className = ''
}) => {
  const { isMobile } = useUI();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleChangeStack = () => {
    setShowDropdown(false);
    onChangeStack();
  };

  const handleRemoveStack = () => {
    setShowDropdown(false);
    onRemoveStack();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botón principal */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`
          flex items-center px-3 py-2 rounded-lg transition-all duration-200
          ${currentStack 
            ? 'bg-codestorm-accent/20 text-codestorm-accent border border-codestorm-accent/30 hover:bg-codestorm-accent/30' 
            : 'bg-gray-600/20 text-gray-400 border border-gray-600/30 hover:bg-gray-600/30 hover:text-white'
          }
          ${isMobile ? 'text-xs px-2 py-1' : 'text-sm'}
        `}
        title={currentStack ? `Stack actual: ${currentStack.name}` : 'Seleccionar stack tecnológico'}
      >
        {/* Icono y texto */}
        <div className="flex items-center">
          {currentStack ? (
            <>
              <span className="text-lg mr-2">{currentStack.icon}</span>
              {!isMobile && (
                <span className="font-medium">
                  {currentStack.name}
                </span>
              )}
            </>
          ) : (
            <>
              <Layers className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
              {!isMobile && <span>Stack</span>}
            </>
          )}
          <ChevronDown className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} ml-1 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Overlay para cerrar */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Contenido del dropdown */}
          <div className="absolute top-full right-0 mt-2 w-64 bg-codestorm-darker border border-codestorm-blue/30 rounded-lg shadow-xl z-50">
            {/* Header */}
            <div className="p-3 border-b border-codestorm-blue/20">
              <h3 className="text-sm font-semibold text-white flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Gestión de Stack
              </h3>
            </div>

            {/* Stack actual */}
            {currentStack && (
              <div className="p-3 border-b border-codestorm-blue/20">
                <div className="flex items-center mb-2">
                  <span className="text-lg mr-2">{currentStack.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{currentStack.name}</div>
                    <div className="text-xs text-gray-400">{currentStack.shortDescription}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className={`px-2 py-1 rounded text-xs border ${
                    currentStack.difficultyLevel === 'Fácil' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                    currentStack.difficultyLevel === 'Moderado' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                    'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}>
                    {currentStack.difficultyLevel}
                  </span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs">
                    {currentStack.popularity} adopción
                  </span>
                </div>
              </div>
            )}

            {/* Opciones */}
            <div className="p-2">
              {/* Cambiar stack */}
              <button
                onClick={handleChangeStack}
                className="w-full flex items-center px-3 py-2 text-sm text-white hover:bg-codestorm-blue/20 rounded-md transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-3 text-blue-400" />
                <div className="text-left">
                  <div className="font-medium">
                    {currentStack ? 'Cambiar Stack' : 'Seleccionar Stack'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {currentStack ? 'Elegir un stack diferente' : 'Elegir un stack tecnológico'}
                  </div>
                </div>
              </button>

              {/* Remover stack (solo si hay uno seleccionado) */}
              {currentStack && (
                <button
                  onClick={handleRemoveStack}
                  className="w-full flex items-center px-3 py-2 text-sm text-white hover:bg-red-500/20 rounded-md transition-colors"
                >
                  <X className="w-4 h-4 mr-3 text-red-400" />
                  <div className="text-left">
                    <div className="font-medium">Remover Stack</div>
                    <div className="text-xs text-gray-400">
                      Continuar con configuración genérica
                    </div>
                  </div>
                </button>
              )}

              {/* Información adicional */}
              <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-200">
                <div className="flex items-start">
                  <Check className="w-3 h-3 mr-1 mt-0.5 text-blue-400 flex-shrink-0" />
                  <span>
                    Los cambios de stack no afectan los archivos ya generados. 
                    Solo influyen en nuevas generaciones.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StackChangeButton;
