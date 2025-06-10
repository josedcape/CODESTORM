import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
  progress?: number;
  subMessage?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'accent';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Cargando...',
  progress,
  subMessage,
  size = 'medium',
  variant = 'primary'
}) => {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  };

  const variantClasses = {
    primary: 'spinner-primary',
    secondary: 'spinner-secondary',
    accent: 'spinner-accent'
  };

  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner-content">
        {/* Spinner animado */}
        <div className={`loading-spinner ${sizeClasses[size]} ${variantClasses[variant]}`}>
          <div className="spinner-ring">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>

        {/* Mensaje principal */}
        <div className="loading-message">
          <h3>{message}</h3>
          {subMessage && <p className="loading-submessage">{subMessage}</p>}
        </div>

        {/* Barra de progreso */}
        {progress !== undefined && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <span className="progress-text">{Math.round(progress)}%</span>
          </div>
        )}

        {/* Indicadores de actividad */}
        <div className="activity-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
