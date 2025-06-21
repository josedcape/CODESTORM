import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Info } from 'lucide-react';

interface SoundNotificationProps {
  show: boolean;
  onDismiss: () => void;
}

const SoundNotification: React.FC<SoundNotificationProps> = ({ show, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for animation to complete
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  if (!show && !isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    }`}>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Volume2 className="h-5 w-5 text-blue-200" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium">Audio Habilitado</h4>
            <p className="text-xs text-blue-100 mt-1">
              Los sonidos de éxito se reproducirán automáticamente al completar procesos.
            </p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="flex-shrink-0 text-blue-200 hover:text-white transition-colors"
          >
            <VolumeX className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SoundNotification;
