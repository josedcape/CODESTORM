import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  FolderOpen, 
  Code, 
  Terminal, 
  Eye,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  badge?: number;
}

interface MobileTabSystemProps {
  tabs: TabItem[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

const MobileTabSystem: React.FC<MobileTabSystemProps> = ({
  tabs,
  defaultTab,
  onTabChange,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const tabHeaderRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  // Manejar cambio de pestaña
  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab || isTransitioning) return;

    setIsTransitioning(true);
    setActiveTab(tabId);
    onTabChange?.(tabId);

    // Scroll automático al tab activo
    scrollToActiveTab(tabId);

    // Finalizar transición
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  // Scroll automático al tab activo
  const scrollToActiveTab = (tabId: string) => {
    if (!tabHeaderRef.current) return;

    const tabButton = tabHeaderRef.current.querySelector(`[data-tab="${tabId}"]`) as HTMLElement;
    if (tabButton) {
      tabButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  };

  // Navegación con gestos táctiles
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;

    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - touchStartX.current;
    const deltaY = touchY - touchStartY.current;

    // Solo procesar si el movimiento es más horizontal que vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
      setIsDragging(true);
      setSwipeDirection(deltaX > 0 ? 'right' : 'left');
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || !swipeDirection) {
      setSwipeDirection(null);
      return;
    }

    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    let newIndex = currentIndex;

    if (swipeDirection === 'left' && currentIndex < tabs.length - 1) {
      newIndex = currentIndex + 1;
    } else if (swipeDirection === 'right' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    }

    if (newIndex !== currentIndex) {
      handleTabChange(tabs[newIndex].id);
    }

    setSwipeDirection(null);
    setIsDragging(false);
  };

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
        
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
          e.preventDefault();
          handleTabChange(tabs[currentIndex - 1].id);
        } else if (e.key === 'ArrowRight' && currentIndex < tabs.length - 1) {
          e.preventDefault();
          handleTabChange(tabs[currentIndex + 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, tabs]);

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className={`mobile-tab-container ${className}`}>
      {/* Header de pestañas */}
      <div 
        ref={tabHeaderRef}
        className="mobile-tab-header"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            data-tab={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`mobile-tab-button ${activeTab === tab.id ? 'active' : ''}`}
            disabled={isTransitioning}
          >
            <div className="flex items-center gap-2">
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Contenido de pestañas */}
      <div 
        className="mobile-tab-content mobile-swipe-area"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Indicadores de deslizamiento */}
        {isDragging && (
          <>
            <div className={`mobile-swipe-indicator left ${swipeDirection === 'right' ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`mobile-swipe-indicator right ${swipeDirection === 'left' ? 'opacity-100' : 'opacity-0'}`} />
          </>
        )}

        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`mobile-tab-panel ${
              activeTab === tab.id ? 'active' : 
              tabs.findIndex(t => t.id === tab.id) < tabs.findIndex(t => t.id === activeTab) ? 'prev' : ''
            }`}
          >
            {tab.content}
          </div>
        ))}
      </div>

      {/* Navegación inferior para móviles muy pequeños */}
      <div className="sm:hidden flex justify-between items-center p-2 bg-codestorm-dark border-t border-codestorm-blue/30">
        <button
          onClick={() => {
            const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
            if (currentIndex > 0) {
              handleTabChange(tabs[currentIndex - 1].id);
            }
          }}
          disabled={tabs.findIndex(tab => tab.id === activeTab) === 0 || isTransitioning}
          className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white hover:bg-codestorm-blue/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1">
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              className={`w-2 h-2 rounded-full transition-colors ${
                activeTab === tab.id ? 'bg-codestorm-accent' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => {
            const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
            if (currentIndex < tabs.length - 1) {
              handleTabChange(tabs[currentIndex + 1].id);
            }
          }}
          disabled={tabs.findIndex(tab => tab.id === activeTab) === tabs.length - 1 || isTransitioning}
          className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white hover:bg-codestorm-blue/20 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MobileTabSystem;
