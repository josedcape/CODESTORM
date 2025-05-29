import React from 'react';
import { RefreshCw, ExternalLink, AlertTriangle, Globe } from 'lucide-react';

interface PreviewPanelProps {
  url: string | null;
  onRefresh: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ url, onRefresh }) => {
  // Función para abrir la vista previa en una nueva pestaña
  const handleOpenInNewTab = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg shadow-md bg-codestorm-dark border-codestorm-blue/30">
      <div className="flex items-center justify-between p-3 border-b border-codestorm-blue/30">
        <div className="flex items-center">
          <h2 className="text-sm font-medium text-white">Vista Previa</h2>
          {url && (
            <span className="ml-2 text-xs text-gray-400 truncate max-w-[200px]">
              {url}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onRefresh}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title="Refrescar vista previa"
            disabled={!url}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title="Abrir en nueva pestaña"
            disabled={!url}
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 bg-white">
        {url ? (
          <iframe
            src={url}
            className="w-full h-full border-none"
            title="Vista previa"
            sandbox="allow-scripts allow-same-origin allow-forms"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-codestorm-darker">
            <Globe className="w-16 h-16 mb-4 text-gray-600" />
            <p className="text-gray-400 text-center">
              No hay vista previa disponible.
              <br />
              <span className="text-sm">
                La vista previa se mostrará cuando el agente IA genere una aplicación web.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;
