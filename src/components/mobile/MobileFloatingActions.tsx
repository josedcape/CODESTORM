import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  X, 
  MessageSquare, 
  Eye, 
  Settings, 
  Code, 
  Download,
  Copy,
  Share,
  Menu
} from 'lucide-react';

interface FloatingAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
  badge?: number;
}

interface MobileFloatingActionsProps {
  actions: FloatingAction[];
  position?: 'bottom-left' | 'bottom-right' | 'bottom-center';
  layout?: 'vertical' | 'horizontal' | 'grid';
  mainIcon?: React.ReactNode;
  mainLabel?: string;
  className?: string;
  autoClose?: boolean;
  hapticFeedback?: boolean;
}

const MobileFloatingActions: React.FC<MobileFloatingActionsProps> = ({
  actions,
  position = 'bottom-right',
  layout = 'vertical',
  mainIcon = <Plus className="w-6 h-6" />,
  mainLabel = 'Acciones',
  className = '',
  autoClose = true,
  hapticFeedback = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pressedAction, setPressedAction] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Manejar feedback háptico
  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!hapticFeedback || !('vibrate' in navigator)) return;
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    
    navigator.vibrate(patterns[type]);
  };

  // Alternar menú
  const toggleMenu = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setIsOpen(!isOpen);
    triggerHapticFeedback('light');
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  // Ejecutar acción
  const handleActionClick = (action: FloatingAction) => {
    if (action.disabled) return;
    
    triggerHapticFeedback('medium');
    action.onClick();
    
    if (autoClose) {
      setIsOpen(false);
    }
  };

  // Manejar presión larga
  const handleTouchStart = (actionId: string) => {
    setPressedAction(actionId);
    triggerHapticFeedback('light');
    
    longPressTimer.current = setTimeout(() => {
      triggerHapticFeedback('heavy');
    }, 500);
  };

  const handleTouchEnd = () => {
    setPressedAction(null);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Cerrar menú con tecla Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Clases de posicionamiento
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-center':
        return 'bottom-6 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
      default:
        return 'bottom-6 right-6';
    }
  };

  // Clases de layout
  const getLayoutClasses = () => {
    switch (layout) {
      case 'horizontal':
        return 'flex-row space-x-3';
      case 'grid':
        return 'grid grid-cols-2 gap-3';
      case 'vertical':
      default:
        return 'flex-col space-y-3';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`fixed z-50 ${getPositionClasses()} ${className}`}
    >
      {/* Overlay de fondo cuando está abierto */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Contenedor de acciones */}
      <div className={`flex ${getLayoutClasses()} ${isOpen ? 'mb-4' : ''}`}>
        {/* Acciones secundarias */}
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            onTouchStart={() => handleTouchStart(action.id)}
            onTouchEnd={handleTouchEnd}
            disabled={action.disabled}
            className={`
              mobile-floating-button
              ${action.color || 'bg-codestorm-blue hover:bg-blue-600'}
              ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'shadow-lg'}
              ${pressedAction === action.id ? 'scale-95' : 'hover:scale-105'}
              ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
              text-white
              transition-all duration-300 ease-out
            `}
            style={{
              transitionDelay: isOpen ? `${index * 50}ms` : '0ms'
            }}
            aria-label={action.label}
          >
            <div className="relative">
              {action.icon}
              {action.badge && action.badge > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                  {action.badge > 99 ? '99+' : action.badge}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Botón principal */}
      <button
        onClick={toggleMenu}
        disabled={isAnimating}
        className={`
          mobile-floating-button
          bg-codestorm-accent hover:bg-blue-600
          text-white shadow-lg
          ${isOpen ? 'rotate-45' : 'rotate-0'}
          ${isAnimating ? 'scale-95' : 'hover:scale-105'}
          transition-all duration-300 ease-out
        `}
        aria-label={mainLabel}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-6 h-6" /> : mainIcon}
      </button>

      {/* Etiquetas de acciones (solo en pantallas grandes) */}
      {isOpen && (
        <div className={`hidden sm:flex ${getLayoutClasses()} ${layout === 'horizontal' ? 'mb-4' : 'mr-16'}`}>
          {actions.map((action, index) => (
            <div
              key={`label-${action.id}`}
              className={`
                bg-codestorm-dark text-white text-sm px-3 py-1 rounded-md shadow-lg
                ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                transition-all duration-300 ease-out pointer-events-none
              `}
              style={{
                transitionDelay: isOpen ? `${index * 50 + 100}ms` : '0ms'
              }}
            >
              {action.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileFloatingActions;
