import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  FolderOpen,
  Code,
  Terminal,
  Eye,
  Settings,
  FileText,
  Play
} from 'lucide-react';
import MobileTabSystem from './MobileTabSystem';
import { useUI } from '../../contexts/UIContext';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

interface MobileLayoutProps {
  chatComponent?: React.ReactNode;
  fileExplorerComponent?: React.ReactNode;
  codeEditorComponent?: React.ReactNode;
  terminalComponent?: React.ReactNode;
  previewComponent?: React.ReactNode;
  className?: string;
  defaultTab?: string;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  chatComponent,
  fileExplorerComponent,
  codeEditorComponent,
  terminalComponent,
  previewComponent,
  className = '',
  defaultTab = 'chat'
}) => {
  const { isMobile, isTablet } = useUI();
  const mobileOpt = useMobileOptimization();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [unreadCounts, setUnreadCounts] = useState({
    chat: 0,
    files: 0,
    editor: 0,
    terminal: 0,
    preview: 0
  });

  // Solo mostrar el layout móvil en dispositivos móviles
  if (!isMobile && !isTablet) {
    return (
      <div className={className}>
        {/* Layout normal para desktop */}
        <div className="grid grid-cols-12 gap-4 h-full">
          <div className="col-span-3">{chatComponent}</div>
          <div className="col-span-3">{fileExplorerComponent}</div>
          <div className="col-span-3">{codeEditorComponent}</div>
          <div className="col-span-3">{terminalComponent}</div>
        </div>
      </div>
    );
  }

  // Configurar pestañas disponibles
  const tabs = [
    {
      id: 'chat',
      label: 'Chat',
      icon: <MessageSquare className="w-5 h-5" />,
      content: (
        <div className="mobile-chat-container">
          {chatComponent || (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Chat no disponible</p>
              </div>
            </div>
          )}
        </div>
      ),
      badge: unreadCounts.chat
    },
    {
      id: 'files',
      label: 'Archivos',
      icon: <FolderOpen className="w-5 h-5" />,
      content: (
        <div className="mobile-file-explorer">
          {fileExplorerComponent || (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Explorador no disponible</p>
              </div>
            </div>
          )}
        </div>
      ),
      badge: unreadCounts.files
    },
    {
      id: 'editor',
      label: 'Editor',
      icon: <Code className="w-5 h-5" />,
      content: (
        <div className="mobile-code-editor">
          {codeEditorComponent || (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Code className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Editor no disponible</p>
              </div>
            </div>
          )}
        </div>
      ),
      badge: unreadCounts.editor
    },
    {
      id: 'terminal',
      label: 'Terminal',
      icon: <Terminal className="w-5 h-5" />,
      content: (
        <div className="mobile-terminal">
          {terminalComponent || (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Terminal className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Terminal no disponible</p>
              </div>
            </div>
          )}
        </div>
      ),
      badge: unreadCounts.terminal
    }
  ];

  // Añadir pestaña de vista previa si está disponible
  if (previewComponent) {
    tabs.push({
      id: 'preview',
      label: 'Vista',
      icon: <Eye className="w-5 h-5" />,
      content: (
        <div className="h-full overflow-hidden">
          {previewComponent}
        </div>
      ),
      badge: unreadCounts.preview
    });
  }

  // Manejar cambio de pestaña
  const handleTabChange = (tabId: string) => {
    // Feedback háptico para cambio de pestaña
    mobileOpt.triggerHapticFeedback('light');

    setActiveTab(tabId);

    // Limpiar contador de no leídos para la pestaña activa
    setUnreadCounts(prev => ({
      ...prev,
      [tabId]: 0
    }));
  };

  // Simular actualizaciones de contadores (esto se conectaría con los componentes reales)
  useEffect(() => {
    const interval = setInterval(() => {
      // Aquí se conectarían los contadores reales de cada componente
      // Por ahora es solo una simulación
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`mobile-layout ${className}`}>
      <MobileTabSystem
        tabs={tabs}
        defaultTab={activeTab}
        onTabChange={handleTabChange}
        className="h-full"
      />
    </div>
  );
};

export default MobileLayout;