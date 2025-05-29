import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorNotificationProps {
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseTime?: number;
  type?: 'error' | 'warning' | 'info';
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  message,
  onClose,
  autoClose = true,
  autoCloseTime = 5000,
  type = 'error'
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, autoCloseTime);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseTime, onClose]);

  if (!isVisible) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return 'bg-red-500/20 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/30';
      case 'info':
        return 'bg-blue-500/20 border-blue-500/30';
      default:
        return 'bg-red-500/20 border-red-500/30';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-red-400';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-red-500';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border ${getBackgroundColor()} animate-slideInDown`}>
      <div className="flex items-start">
        <AlertTriangle className={`h-5 w-5 ${getIconColor()} mr-3 flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <p className={`${getTextColor()} font-medium`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false);
              onClose();
            }}
            className={`ml-3 p-1 rounded-full hover:bg-black/20 ${getTextColor()}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorNotification;
