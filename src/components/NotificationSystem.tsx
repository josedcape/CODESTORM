import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle, Zap } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'system';
  title: string;
  message: string;
  duration?: number; // en milisegundos, 0 = permanente
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: number;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onDismiss,
  position = 'top-right',
  maxNotifications = 5
}) => {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Mostrar solo las notificaciones más recientes
    const recent = notifications
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxNotifications);
    
    setVisibleNotifications(recent);
  }, [notifications, maxNotifications]);

  useEffect(() => {
    // Auto-dismiss notifications with duration
    const timers: NodeJS.Timeout[] = [];

    visibleNotifications.forEach((notification) => {
      if (notification.duration && notification.duration > 0) {
        const timer = setTimeout(() => {
          onDismiss(notification.id);
        }, notification.duration);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [visibleNotifications, onDismiss]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
      case 'system':
        return <Zap className="w-5 h-5 text-purple-400" />;
    }
  };

  const getStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/30 text-green-100';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-100';
      case 'error':
        return 'bg-red-500/10 border-red-500/30 text-red-100';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-100';
      case 'system':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-100';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
    }
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-3 max-w-sm w-full`}>
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`
            border rounded-lg p-4 shadow-lg backdrop-blur-sm
            transform transition-all duration-300 ease-in-out
            ${getStyles(notification.type)}
            ${index === 0 ? 'scale-100' : 'scale-95 opacity-90'}
          `}
          style={{
            animation: 'slideIn 0.3s ease-out',
            animationDelay: `${index * 0.1}s`
          }}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(notification.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-white">
                    {notification.title}
                  </h4>
                  <p className="text-sm mt-1 opacity-90">
                    {notification.message}
                  </p>
                </div>
                
                <button
                  onClick={() => onDismiss(notification.id)}
                  className="flex-shrink-0 ml-2 p-1 hover:bg-white/10 rounded transition-colors"
                  title="Cerrar notificación"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {notification.action && (
                <div className="mt-3">
                  <button
                    onClick={notification.action.onClick}
                    className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors"
                  >
                    {notification.action.label}
                  </button>
                </div>
              )}
              
              <div className="text-xs opacity-60 mt-2">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          {/* Barra de progreso para notificaciones con duración */}
          {notification.duration && notification.duration > 0 && (
            <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/30 rounded-full"
                style={{
                  animation: `shrink ${notification.duration}ms linear`,
                  transformOrigin: 'left'
                }}
              />
            </div>
          )}
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes shrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </div>
  );
};

// Hook para manejar notificaciones
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    return newNotification.id;
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Métodos de conveniencia
  const success = (title: string, message: string, duration = 5000) => {
    return addNotification({ type: 'success', title, message, duration });
  };

  const error = (title: string, message: string, duration = 0) => {
    return addNotification({ type: 'error', title, message, duration });
  };

  const warning = (title: string, message: string, duration = 7000) => {
    return addNotification({ type: 'warning', title, message, duration });
  };

  const info = (title: string, message: string, duration = 5000) => {
    return addNotification({ type: 'info', title, message, duration });
  };

  const system = (title: string, message: string, duration = 0) => {
    return addNotification({ type: 'system', title, message, duration });
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAll,
    success,
    error,
    warning,
    info,
    system
  };
};

export default NotificationSystem;
