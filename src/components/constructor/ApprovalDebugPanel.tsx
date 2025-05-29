import React, { useState, useEffect } from 'react';
import {
  Bug,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Terminal,
  Activity
} from 'lucide-react';
import { ApprovalData } from '../../types';

interface ApprovalDebugPanelProps {
  approvalData: ApprovalData | null;
  isAIBusy: boolean;
  currentAction: string | null;
  onForceApproval?: () => void;
  onResetState?: () => void;
}

interface DebugLog {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  data?: any;
}

const ApprovalDebugPanel: React.FC<ApprovalDebugPanelProps> = ({
  approvalData,
  isAIBusy,
  currentAction,
  onForceApproval,
  onResetState
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [approvalAttempts, setApprovalAttempts] = useState(0);
  const [lastApprovalTime, setLastApprovalTime] = useState<number | null>(null);

  // Función para añadir logs de debug
  const addDebugLog = (level: DebugLog['level'], message: string, data?: any) => {
    const log: DebugLog = {
      id: `debug-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      level,
      message,
      data
    };

    setDebugLogs(prev => [...prev.slice(-19), log]); // Mantener solo los últimos 20 logs
  };

  // Monitorear cambios en approvalData
  useEffect(() => {
    if (approvalData) {
      addDebugLog('info', 'Nueva solicitud de aprobación detectada', {
        id: approvalData.id,
        type: approvalData.type,
        title: approvalData.title,
        isCompletePlan: approvalData.metadata?.isCompletePlan
      });
    } else {
      addDebugLog('warn', 'Solicitud de aprobación eliminada o no disponible');
    }
  }, [approvalData]);

  // Monitorear cambios en el estado de AI
  useEffect(() => {
    if (isAIBusy) {
      addDebugLog('info', `AI ocupada: ${currentAction || 'Procesando...'}`);
    } else {
      addDebugLog('success', 'AI disponible para nuevas instrucciones');
    }
  }, [isAIBusy, currentAction]);

  // Función para simular aprobación manual
  const handleManualApproval = () => {
    if (!approvalData) {
      addDebugLog('error', 'No hay datos de aprobación para procesar');
      return;
    }

    setApprovalAttempts(prev => prev + 1);
    setLastApprovalTime(Date.now());

    addDebugLog('info', `Intento de aprobación manual #${approvalAttempts + 1}`, {
      approvalId: approvalData.id,
      timestamp: Date.now()
    });

    // Guardar estado en localStorage como backup
    localStorage.setItem('codestorm_approval_backup', JSON.stringify({
      approvalData,
      timestamp: Date.now(),
      attempt: approvalAttempts + 1
    }));

    if (onForceApproval) {
      onForceApproval();
    }
  };

  // Función para resetear el estado
  const handleResetState = () => {
    setApprovalAttempts(0);
    setLastApprovalTime(null);
    setDebugLogs([]);
    localStorage.removeItem('codestorm_approval_backup');

    addDebugLog('info', 'Estado de aprobación reseteado');

    if (onResetState) {
      onResetState();
    }
  };

  // Función para recuperar estado desde localStorage
  const handleRecoverState = () => {
    const backup = localStorage.getItem('codestorm_approval_backup');
    if (backup) {
      try {
        const data = JSON.parse(backup);
        addDebugLog('info', 'Estado recuperado desde localStorage', data);
      } catch (error) {
        addDebugLog('error', 'Error al recuperar estado desde localStorage', error);
      }
    } else {
      addDebugLog('warn', 'No hay estado de backup disponible');
    }
  };

  const getStatusColor = (level: DebugLog['level']) => {
    switch (level) {
      case 'success': return 'text-green-400';
      case 'warn': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-blue-400';
    }
  };

  const getStatusIcon = (level: DebugLog['level']) => {
    switch (level) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'warn': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        {/* Notificación flotante */}
        {approvalData && (
          <div className="mb-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
            <div className="text-xs font-bold">🚀 ¡PLAN LISTO PARA APROBAR!</div>
            <div className="text-xs opacity-90">Haz clic aquí para aprobar tu plan de desarrollo</div>
          </div>
        )}

        <button
          onClick={() => setIsVisible(true)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-105"
          title="Abrir Panel de Forzar Aprobación"
        >
          <div className="flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-800 to-emerald-800 border-b border-green-700">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-300" />
          <span className="text-white font-bold">FORZAR APROBACIÓN</span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-green-200 hover:text-white transition-colors"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>

      {/* Estado Actual */}
      <div className="p-3 border-b border-gray-700">
        <h4 className="text-sm font-medium text-white mb-2">Estado Actual</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Aprobación Pendiente:</span>
            <span className={approvalData ? 'text-green-400' : 'text-red-400'}>
              {approvalData ? 'Sí' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">AI Ocupada:</span>
            <span className={isAIBusy ? 'text-yellow-400' : 'text-green-400'}>
              {isAIBusy ? 'Sí' : 'No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Intentos:</span>
            <span className="text-white">{approvalAttempts}</span>
          </div>
          {lastApprovalTime && (
            <div className="flex justify-between">
              <span className="text-gray-400">Último Intento:</span>
              <span className="text-white">
                {new Date(lastApprovalTime).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controles de Aprobación Forzada */}
      <div className="p-3 border-b border-gray-700">
        <h4 className="text-sm font-medium text-green-300 mb-2">🚀 Herramientas de Aprobación</h4>
        <div className="space-y-2">
          <button
            onClick={handleManualApproval}
            disabled={!approvalData}
            className="w-full px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded transition-colors font-medium"
          >
            ✅ APROBAR PLAN AHORA
          </button>
          <button
            onClick={handleResetState}
            className="w-full px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors"
          >
            🔄 Reiniciar Sistema
          </button>
          <button
            onClick={handleRecoverState}
            className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
          >
            💾 Recuperar Datos
          </button>
        </div>
      </div>

      {/* Historial de Actividad */}
      <div className="p-3">
        <h4 className="text-sm font-medium text-blue-300 mb-2">📋 Historial de Actividad</h4>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {debugLogs.length === 0 ? (
            <p className="text-xs text-gray-400">Sistema listo para aprobar planes</p>
          ) : (
            debugLogs.slice(-10).map(log => (
              <div key={log.id} className="flex items-start space-x-2 text-xs">
                <div className={`flex-shrink-0 ${getStatusColor(log.level)}`}>
                  {getStatusIcon(log.level)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-300 break-words">{log.message}</div>
                  <div className="text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalDebugPanel;
