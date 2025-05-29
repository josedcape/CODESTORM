import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Actualizar el estado para mostrar la UI de error
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Llamar al callback de error si se proporciona
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Si se proporciona un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de error por defecto
      return (
        <div className="min-h-screen bg-codestorm-dark flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-codestorm-blue/10 border border-codestorm-blue/30 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-16 w-16 text-red-500" />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">
              ¡Oops! Algo salió mal
            </h2>
            
            <p className="text-gray-300 mb-4">
              Se ha producido un error inesperado en la aplicación. Esto puede deberse a:
            </p>
            
            <ul className="text-sm text-gray-400 text-left mb-6 space-y-1">
              <li>• Problemas de conectividad con los servicios de IA</li>
              <li>• Límites de cuota de API excedidos</li>
              <li>• Error temporal en el componente</li>
            </ul>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="text-sm text-gray-400 cursor-pointer mb-2">
                  Detalles del error (desarrollo)
                </summary>
                <div className="bg-red-900/20 border border-red-500/30 rounded p-3 text-xs text-red-300 overflow-auto max-h-32">
                  <div className="font-mono">
                    <div className="font-bold mb-1">Error:</div>
                    <div className="mb-2">{this.state.error.message}</div>
                    <div className="font-bold mb-1">Stack:</div>
                    <div>{this.state.error.stack}</div>
                  </div>
                </div>
              </details>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-codestorm-accent hover:bg-codestorm-accent/80 text-codestorm-dark font-medium rounded-md transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Ir al Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
