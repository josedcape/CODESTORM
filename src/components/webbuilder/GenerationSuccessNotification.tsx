import React, { useEffect, useState } from 'react';
import { CheckCircle, Eye, Code, Download, X, Sparkles } from 'lucide-react';

interface GenerationSuccessNotificationProps {
  isVisible: boolean;
  onViewPreview: () => void;
  onViewCode: () => void;
  onDownload: () => void;
  onClose: () => void;
  stats?: {
    htmlLines: number;
    cssLines: number;
    jsLines: number;
  };
}

const GenerationSuccessNotification: React.FC<GenerationSuccessNotificationProps> = ({
  isVisible,
  onViewPreview,
  onViewCode,
  onDownload,
  onClose,
  stats
}) => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldShow(true);
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setShouldShow(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, 10000);

      return () => clearTimeout(timer);
    } else {
      setShouldShow(false);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`
      fixed top-4 right-4 z-50 transition-all duration-300 transform
      ${shouldShow ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg shadow-2xl p-4 max-w-md border border-green-500/30">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-200" />
            <h3 className="font-semibold text-sm">¡Página Web Generada!</h3>
          </div>
          <button
            onClick={() => {
              setShouldShow(false);
              setTimeout(onClose, 300);
            }}
            className="text-green-200 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-green-100 text-sm mb-2">
            Tu sitio web ha sido creado exitosamente con tecnología IA.
          </p>
          
          {stats && (
            <div className="flex items-center space-x-4 text-xs text-green-200 bg-green-700/30 rounded px-2 py-1">
              <span>HTML: {stats.htmlLines} líneas</span>
              <span>CSS: {stats.cssLines} líneas</span>
              <span>JS: {stats.jsLines} líneas</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                onViewPreview();
                setShouldShow(false);
                setTimeout(onClose, 300);
              }}
              className="flex-1 flex items-center justify-center space-x-2 bg-white/20 hover:bg-white/30 rounded-md py-2 px-3 transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">Ver Sitio</span>
            </button>
            
            <button
              onClick={() => {
                onViewCode();
                setShouldShow(false);
                setTimeout(onClose, 300);
              }}
              className="flex-1 flex items-center justify-center space-x-2 bg-white/20 hover:bg-white/30 rounded-md py-2 px-3 transition-colors"
            >
              <Code className="h-4 w-4" />
              <span className="text-sm font-medium">Ver Código</span>
            </button>
          </div>
          
          <button
            onClick={() => {
              onDownload();
              setShouldShow(false);
              setTimeout(onClose, 300);
            }}
            className="w-full flex items-center justify-center space-x-2 bg-emerald-700/50 hover:bg-emerald-700/70 rounded-md py-2 px-3 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span className="text-sm font-medium">Descargar Sitio</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-green-500/30 flex items-center justify-center space-x-1 text-xs text-green-200">
          <Sparkles className="h-3 w-3" />
          <span>Generado por CODESTORM WebAI</span>
        </div>

        {/* Progress bar for auto-hide */}
        <div className="mt-2 w-full bg-green-700/30 rounded-full h-1 overflow-hidden">
          <div 
            className="h-full bg-green-300 rounded-full transition-all duration-[10000ms] ease-linear"
            style={{
              width: shouldShow ? '0%' : '100%',
              transform: shouldShow ? 'translateX(-100%)' : 'translateX(0%)'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default GenerationSuccessNotification;
