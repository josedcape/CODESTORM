import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Clock,
  Zap,
  ArrowRight,
  X
} from 'lucide-react';
import { FallbackResult } from '../services/AIFallbackService';
import { AIFallbackService } from '../services/AIFallbackService';

interface FallbackNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
  fallbackResult?: FallbackResult;
  isVisible: boolean;
}

interface AIFallbackNotificationsProps {
  maxNotifications?: number;
  defaultDuration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const AIFallbackNotifications: React.FC<AIFallbackNotificationsProps> = ({
  maxNotifications = 3,
  defaultDuration = 5000,
  position = 'top-right'
}) => {
  const [notifications, setNotifications] = useState<FallbackNotification[]>([]);

  useEffect(() => {
    const fallbackService = AIFallbackService.getInstance();

    const handleFallbackResult = (result: FallbackResult) => {
      const notification = createNotificationFromResult(result);
      addNotification(notification);
    };

    fallbackService.addListener(handleFallbackResult);

    return () => {
      fallbackService.removeListener(handleFallbackResult);
    };
  }, []);

  const createNotificationFromResult = (result: FallbackResult): FallbackNotification => {
    const id = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();

    if (result.success) {
      if (result.fallbacksUsed === 0) {
        // Éxito sin fallback
        return {
          id,
          type: 'success',
          title: '✅ IA Respondió',
          message: `Respuesta exitosa con ${result.finalProvider}`,
          timestamp,
          duration: 3000,
          fallbackResult: result,
          isVisible: true
        };
      } else {
        // Éxito con fallback
        return {
          id,
          type: 'warning',
          title: '🔄 Fallback Exitoso',
          message: `Cambió a ${result.finalProvider} después de ${result.fallbacksUsed} intento(s)`,
          timestamp,
          duration: 5000,
          fallbackResult: result,
          isVisible: true
        };
      }
    } else {
      // Fallo completo
      return {
        id,
        type: 'error',
        title: '❌ Todos los Proveedores Fallaron',
        message: `${result.attempts.length} intentos fallidos en ${Math.round(result.totalTime / 1000)}s`,
        timestamp,
        duration: 8000,
        fallbackResult: result,
        isVisible: true
      };
    }
  };

  const addNotification = (notification: FallbackNotification) => {
    setNotifications(prev => {
      const newNotifications = [notification, ...prev];
      
      // Limitar el número de notificaciones
      if (newNotifications.length > maxNotifications) {
        return newNotifications.slice(0, maxNotifications);
      }
      
      return newNotifications;
    });

    // Auto-remove notification after duration
    if (notification.duration) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isVisible: false } : notif
      )
    );

    // Remove from array after animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 300);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'info':
        return <RefreshCw className="h-5 w-5 text-blue-500" />;
      default:
        return <RefreshCw className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColors = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/30 text-green-100';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-100';
      case 'error':
        return 'bg-red-500/10 border-red-500/30 text-red-100';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-100';
      default:
        return 'bg-gray-500/10 border-gray-500/30 text-gray-100';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2 max-w-sm`}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            transform transition-all duration-300 ease-in-out
            ${notification.isVisible 
              ? 'translate-x-0 opacity-100 scale-100' 
              : 'translate-x-full opacity-0 scale-95'
            }
            ${getNotificationColors(notification.type)}
            border rounded-lg p-4 shadow-lg backdrop-blur-sm
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  {notification.title}
                </div>
                <div className="text-xs opacity-90 mt-1">
                  {notification.message}
                </div>
                
                {/* Detalles adicionales para fallback */}
                {notification.fallbackResult && (
                  <div className="mt-2 space-y-1">
                    {notification.fallbackResult.success && notification.fallbackResult.fallbacksUsed > 0 && (
                      <div className="flex items-center space-x-1 text-xs opacity-75">
                        <ArrowRight className="h-3 w-3" />
                        <span>
                          {notification.fallbackResult.attempts
                            .filter(a => !a.success)
                            .map(a => a.providerId)
                            .join(' → ')} → {notification.fallbackResult.finalProvider}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-3 text-xs opacity-75">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(notification.fallbackResult.totalTime)}</span>
                      </div>
                      
                      {notification.fallbackResult.response?.executionTime && (
                        <div className="flex items-center space-x-1">
                          <Zap className="h-3 w-3" />
                          <span>{formatDuration(notification.fallbackResult.response.executionTime)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Barra de progreso para duración */}
          {notification.duration && (
            <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white/40 rounded-full transition-all ease-linear"
                style={{
                  animation: `shrink ${notification.duration}ms linear forwards`
                }}
              />
            </div>
          )}
        </div>
      ))}
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default AIFallbackNotifications;
