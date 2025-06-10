import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface APIStatus {
  name: string;
  status: 'online' | 'limited' | 'offline' | 'checking';
  lastCheck: number;
  error?: string;
  responseTime?: number;
}

interface APIStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

const APIStatusIndicator: React.FC<APIStatusIndicatorProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [apiStatuses, setApiStatuses] = useState<APIStatus[]>([
    { name: 'Gemini', status: 'checking', lastCheck: Date.now() },
    { name: 'Claude', status: 'checking', lastCheck: Date.now() },
    { name: 'OpenAI', status: 'checking', lastCheck: Date.now() }
  ]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkAPIStatus = async () => {
    setIsChecking(true);
    
    const newStatuses: APIStatus[] = [];

    // Verificar Gemini
    try {
      const startTime = Date.now();
      const { callGeminiAPI } = await import('../services/AIService');
      await callGeminiAPI('test', { maxOutputTokens: 10 });
      newStatuses.push({
        name: 'Gemini',
        status: 'online',
        lastCheck: Date.now(),
        responseTime: Date.now() - startTime
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      let status: 'limited' | 'offline' = 'offline';
      
      if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        status = 'limited';
      }
      
      newStatuses.push({
        name: 'Gemini',
        status,
        lastCheck: Date.now(),
        error: errorMessage
      });
    }

    // Verificar Claude
    try {
      const startTime = Date.now();
      const { default: ClaudeAPIService } = await import('../services/ClaudeAPIService');
      const claudeService = new ClaudeAPIService();
      await claudeService.generateText('test', { maxTokens: 10 });
      newStatuses.push({
        name: 'Claude',
        status: 'online',
        lastCheck: Date.now(),
        responseTime: Date.now() - startTime
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      let status: 'limited' | 'offline' = 'offline';
      
      if (errorMessage.includes('429') || errorMessage.includes('rate')) {
        status = 'limited';
      }
      
      newStatuses.push({
        name: 'Claude',
        status,
        lastCheck: Date.now(),
        error: errorMessage
      });
    }

    // Verificar OpenAI (simulado)
    newStatuses.push({
      name: 'OpenAI',
      status: 'limited',
      lastCheck: Date.now(),
      error: 'No implementado aún'
    });

    setApiStatuses(newStatuses);
    setIsChecking(false);
  };

  useEffect(() => {
    checkAPIStatus();
    
    // Verificar cada 5 minutos
    const interval = setInterval(checkAPIStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: APIStatus['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'limited':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'checking':
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: APIStatus['status']) => {
    switch (status) {
      case 'online':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'limited':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'offline':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'checking':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    }
  };

  const getOverallStatus = () => {
    const onlineCount = apiStatuses.filter(api => api.status === 'online').length;
    const limitedCount = apiStatuses.filter(api => api.status === 'limited').length;
    const offlineCount = apiStatuses.filter(api => api.status === 'offline').length;

    if (onlineCount > 0) return 'online';
    if (limitedCount > 0) return 'limited';
    return 'offline';
  };

  const overallStatus = getOverallStatus();

  return (
    <div className={`relative ${className}`}>
      {/* Indicador principal */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all ${getStatusColor(overallStatus)}`}
        title="Estado de las APIs de IA"
      >
        {overallStatus === 'online' ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-xs font-medium">
          {overallStatus === 'online' ? 'IA Activa' : 
           overallStatus === 'limited' ? 'IA Limitada' : 'IA Offline'}
        </span>
        {isChecking && <RefreshCw className="w-3 h-3 animate-spin" />}
      </button>

      {/* Panel expandido */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-codestorm-darker border border-purple-500/30 rounded-lg shadow-xl z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">Estado de APIs de IA</h3>
              <button
                onClick={checkAPIStatus}
                disabled={isChecking}
                className="p-1 hover:bg-purple-500/10 rounded transition-colors"
                title="Verificar estado"
              >
                <RefreshCw className={`w-4 h-4 text-purple-400 ${isChecking ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-3">
              {apiStatuses.map((api) => (
                <div key={api.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(api.status)}
                    <span className="text-sm text-white">{api.name}</span>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-xs px-2 py-1 rounded ${getStatusColor(api.status)}`}>
                      {api.status === 'online' ? 'Activo' :
                       api.status === 'limited' ? 'Limitado' :
                       api.status === 'offline' ? 'Offline' : 'Verificando'}
                    </div>
                    {api.responseTime && (
                      <div className="text-xs text-gray-400 mt-1">
                        {api.responseTime}ms
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {showDetails && (
              <div className="mt-4 pt-3 border-t border-purple-500/30">
                <div className="text-xs text-gray-400">
                  <div>Última verificación: {new Date(Math.max(...apiStatuses.map(api => api.lastCheck))).toLocaleTimeString()}</div>
                  <div className="mt-1">
                    Sistema de fallback: {overallStatus !== 'offline' ? 'Activo' : 'Contenido local'}
                  </div>
                </div>
              </div>
            )}

            {/* Errores */}
            {apiStatuses.some(api => api.error) && (
              <div className="mt-4 pt-3 border-t border-red-500/30">
                <div className="text-xs text-red-400 space-y-1">
                  {apiStatuses.filter(api => api.error).map((api) => (
                    <div key={api.name}>
                      <strong>{api.name}:</strong> {api.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default APIStatusIndicator;
