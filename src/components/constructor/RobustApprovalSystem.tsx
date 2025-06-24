import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle, XCircle, AlertTriangle, Clock, RefreshCw, 
  Shield, Zap, Terminal, Save, RotateCcw, Play
} from 'lucide-react';
import { ApprovalData } from '../../types';

interface RobustApprovalSystemProps {
  approvalData: ApprovalData;
  onApprove: (feedback?: string) => void;
  onReject: (feedback: string) => void;
  onPartialApprove: (approvedItems: string[], feedback?: string) => void;
  isLoading?: boolean;
}

interface ApprovalState {
  status: 'idle' | 'confirming' | 'processing' | 'retrying' | 'failed' | 'success';
  attempts: number;
  lastError?: string;
  confirmationRequired: boolean;
  backupSaved: boolean;
}

const RobustApprovalSystem: React.FC<RobustApprovalSystemProps> = ({
  approvalData,
  onApprove,
  onReject,
  onPartialApprove,
  isLoading = false
}) => {
  const [approvalState, setApprovalState] = useState<ApprovalState>({
    status: 'idle',
    attempts: 0,
    confirmationRequired: false,
    backupSaved: false
  });
  
  const [feedback, setFeedback] = useState<string>('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [manualCommand, setManualCommand] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  const isCompletePlan = approvalData.metadata?.isCompletePlan === true;

  // Inicializar elementos seleccionados
  useEffect(() => {
    if (isCompletePlan) {
      setSelectedItems(approvalData.items.map(item => item.id));
    }
  }, [approvalData, isCompletePlan]);

  // Guardar backup automáticamente
  useEffect(() => {
    const backup = {
      approvalData,
      timestamp: Date.now(),
      userFeedback: feedback,
      selectedItems
    };
    
    localStorage.setItem('codestorm_approval_backup', JSON.stringify(backup));
    setApprovalState(prev => ({ ...prev, backupSaved: true }));
  }, [approvalData, feedback, selectedItems]);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  // Función principal de aprobación con reintentos
  const handleRobustApproval = async (type: 'full' | 'partial' | 'reject') => {
    console.log(`🚀 RobustApprovalSystem: Iniciando aprobación ${type}`);
    
    setApprovalState(prev => ({
      ...prev,
      status: 'processing',
      attempts: prev.attempts + 1,
      lastError: undefined
    }));

    try {
      // Timeout de seguridad
      timeoutRef.current = setTimeout(() => {
        console.warn('⏰ Timeout en aprobación, iniciando reintento...');
        handleRetry(type);
      }, 10000); // 10 segundos

      switch (type) {
        case 'full':
          await executeApproval(() => onApprove(feedback.trim() || undefined));
          break;
        case 'partial':
          if (selectedItems.length === 0) {
            throw new Error('No hay elementos seleccionados para aprobación parcial');
          }
          await executeApproval(() => onPartialApprove(selectedItems, feedback.trim() || undefined));
          break;
        case 'reject':
          if (!feedback.trim()) {
            throw new Error('Se requiere feedback para rechazar');
          }
          await executeApproval(() => onReject(feedback));
          break;
      }

      // Si llegamos aquí, la aprobación fue exitosa
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      setApprovalState(prev => ({
        ...prev,
        status: 'success'
      }));

      // Limpiar backup después del éxito
      setTimeout(() => {
        localStorage.removeItem('codestorm_approval_backup');
      }, 5000);

    } catch (error) {
      console.error('❌ Error en aprobación robusta:', error);
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      setApprovalState(prev => ({
        ...prev,
        status: 'failed',
        lastError: error instanceof Error ? error.message : 'Error desconocido'
      }));

      // Programar reintento automático
      if (approvalState.attempts < 3) {
        retryTimeoutRef.current = setTimeout(() => {
          handleRetry(type);
        }, 2000);
      }
    }
  };

  // Función auxiliar para ejecutar la aprobación
  const executeApproval = async (approvalFunction: () => void) => {
    return new Promise<void>((resolve, reject) => {
      try {
        approvalFunction();
        
        // Simular un pequeño delay para permitir que el sistema procese
        setTimeout(() => {
          resolve();
        }, 1000);
      } catch (error) {
        reject(error);
      }
    });
  };

  // Función de reintento
  const handleRetry = (type: 'full' | 'partial' | 'reject') => {
    console.log(`🔄 Reintentando aprobación ${type}, intento #${approvalState.attempts + 1}`);
    
    setApprovalState(prev => ({
      ...prev,
      status: 'retrying'
    }));

    setTimeout(() => {
      handleRobustApproval(type);
    }, 1000);
  };

  // Función de aprobación con confirmación
  const handleApprovalWithConfirmation = (type: 'full' | 'partial' | 'reject') => {
    if (isCompletePlan && type === 'full') {
      setShowConfirmationModal(true);
      setApprovalState(prev => ({ ...prev, status: 'confirming' }));
    } else {
      handleRobustApproval(type);
    }
  };

  // Confirmar aprobación desde modal
  const confirmApproval = () => {
    setShowConfirmationModal(false);
    handleRobustApproval('full');
  };

  // Función de aprobación manual por comando
  const handleManualCommand = () => {
    const command = manualCommand.toLowerCase().trim();
    
    if (command === 'aprobar' || command === 'approve') {
      handleRobustApproval('full');
    } else if (command === 'rechazar' || command === 'reject') {
      if (!feedback.trim()) {
        setFeedback('Rechazado manualmente por el usuario');
      }
      handleRobustApproval('reject');
    } else if (command === 'forzar' || command === 'force') {
      // Aprobación forzada sin validaciones
      console.log('🔥 Aprobación forzada activada');
      onApprove(feedback.trim() || 'Aprobación forzada por el usuario');
    }
    
    setManualCommand('');
    setShowManualInput(false);
  };

  // Función para resetear el estado
  const resetApprovalState = () => {
    setApprovalState({
      status: 'idle',
      attempts: 0,
      confirmationRequired: false,
      backupSaved: false
    });
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
  };

  // Función para recuperar desde backup
  const recoverFromBackup = () => {
    const backup = localStorage.getItem('codestorm_approval_backup');
    if (backup) {
      try {
        const data = JSON.parse(backup);
        setFeedback(data.userFeedback || '');
        setSelectedItems(data.selectedItems || []);
        console.log('✅ Estado recuperado desde backup');
      } catch (error) {
        console.error('❌ Error al recuperar backup:', error);
      }
    }
  };

  const getStatusColor = () => {
    switch (approvalState.status) {
      case 'processing': return 'bg-blue-600';
      case 'retrying': return 'bg-yellow-600';
      case 'failed': return 'bg-red-600';
      case 'success': return 'bg-green-600';
      case 'confirming': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusText = () => {
    switch (approvalState.status) {
      case 'processing': return 'Procesando...';
      case 'retrying': return `Reintentando (${approvalState.attempts}/3)...`;
      case 'failed': return 'Error - Reintentando automáticamente';
      case 'success': return '¡Aprobación exitosa!';
      case 'confirming': return 'Esperando confirmación';
      default: return 'Listo para aprobar';
    }
  };

  return (
    <div className="space-y-4">
      {/* Estado del Sistema */}
      <div className={`p-3 rounded-lg ${getStatusColor()} bg-opacity-20 border border-current`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            <span className="text-sm font-medium text-white">
              {getStatusText()}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-300">
            <span>Intentos: {approvalState.attempts}</span>
            {approvalState.backupSaved && (
              <div className="flex items-center space-x-1">
                <Save className="w-3 h-3" />
                <span>Backup</span>
              </div>
            )}
          </div>
        </div>
        
        {approvalState.lastError && (
          <div className="mt-2 text-xs text-red-300">
            Error: {approvalState.lastError}
          </div>
        )}
      </div>

      {/* Controles Principales */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleApprovalWithConfirmation('full')}
          disabled={isLoading || approvalState.status === 'processing'}
          className={`flex items-center px-4 py-2 text-white rounded-md transition-colors ${
            isCompletePlan
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
              : 'bg-green-600 hover:bg-green-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {isCompletePlan ? 'Aprobar Plan Completo' : 'Aprobar Todo'}
        </button>

        {!isCompletePlan && (
          <button
            onClick={() => handleApprovalWithConfirmation('partial')}
            disabled={isLoading || selectedItems.length === 0 || approvalState.status === 'processing'}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Aprobar Seleccionados ({selectedItems.length})
          </button>
        )}

        <button
          onClick={() => handleApprovalWithConfirmation('reject')}
          disabled={isLoading || approvalState.status === 'processing'}
          className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Rechazar
        </button>
      </div>

      {/* Controles de Emergencia */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={resetApprovalState}
          className="flex items-center px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </button>

        <button
          onClick={recoverFromBackup}
          className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
        >
          <Save className="w-3 h-3 mr-1" />
          Recuperar
        </button>

        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
        >
          <Terminal className="w-3 h-3 mr-1" />
          Manual
        </button>
      </div>

      {/* Input Manual */}
      {showManualInput && (
        <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
          <label className="block text-sm font-medium text-white mb-2">
            Comando Manual (aprobar/rechazar/forzar):
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={manualCommand}
              onChange={(e) => setManualCommand(e.target.value)}
              placeholder="Escribe: aprobar, rechazar, o forzar"
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleManualCommand()}
            />
            <button
              onClick={handleManualCommand}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
            >
              <Play className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Feedback Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">
          Comentarios (opcional):
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Añade comentarios sobre tu decisión..."
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          rows={3}
        />
      </div>

      {/* Modal de Confirmación */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">
                Confirmar Aprobación de Plan Completo
              </h3>
            </div>
            
            <p className="text-gray-300 mb-4">
              Estás a punto de aprobar un plan completo. Esto iniciará la generación automática 
              de todos los archivos sin solicitar aprobaciones adicionales.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={confirmApproval}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                Confirmar Aprobación
              </button>
              <button
                onClick={() => setShowConfirmationModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RobustApprovalSystem;
