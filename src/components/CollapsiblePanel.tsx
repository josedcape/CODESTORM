import React, { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { useUI } from '../contexts/UIContext';

interface CollapsiblePanelProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  type: 'sidebar' | 'explorer' | 'editor' | 'terminal';
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  showCollapseButton?: boolean;
  showExpandButton?: boolean;
}

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  icon,
  children,
  type,
  isVisible = true,
  onToggleVisibility,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  showCollapseButton = true,
  showExpandButton = true
}) => {
  const {
    isMobile,
    isTablet,
    expandedPanel,
    setExpandedPanel
  } = useUI();

  // Determinar si el panel está expandido
  const isExpanded = expandedPanel === type;

  // Función para expandir/contraer el panel
  const toggleExpand = () => {
    if (isExpanded) {
      setExpandedPanel(null);
    } else {
      setExpandedPanel(type);
    }
  };

  // Si el panel no es visible, no renderizar nada
  if (!isVisible) {
    return null;
  }

  // Determinar las clases CSS basadas en el estado
  const panelClasses = `
    bg-codestorm-dark rounded-lg shadow-md border border-codestorm-blue/30 flex flex-col
    ${isExpanded && (isMobile || isTablet) ? 'fixed inset-0 z-40 animate-slideInUp' : ''}
    ${className}
    transition-all duration-300 ease-in-out
  `;

  return (
    <div className={panelClasses}>
      <div className={`flex items-center justify-between bg-codestorm-blue/20 p-2 border-b border-codestorm-blue/30 ${headerClassName}`}>
        <div className="flex items-center">
          {icon && <div className="mr-2">{icon}</div>}
          <span className="font-medium text-sm text-white">{title}</span>
        </div>
        <div className="flex space-x-1">
          {/* Botón para expandir/contraer en móvil y tablet */}
          {(isMobile || isTablet) && showExpandButton && (
            <button
              onClick={toggleExpand}
              className="p-1.5 rounded-md hover:bg-codestorm-blue/30 transition-all text-gray-400 hover:text-white transform hover:scale-110 active:scale-95"
              title={isExpanded ? "Contraer" : "Expandir"}
            >
              {isExpanded ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </button>
          )}

          {/* Botón para mostrar/ocultar */}
          {showCollapseButton && onToggleVisibility && (
            <button
              onClick={onToggleVisibility}
              className="p-1.5 rounded-md hover:bg-codestorm-blue/30 transition-all text-gray-400 hover:text-white transform hover:scale-110 active:scale-95"
              title="Ocultar panel"
            >
              {type === 'sidebar' || type === 'explorer' ? (
                <ChevronLeft className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className={`flex-1 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default CollapsiblePanel;
