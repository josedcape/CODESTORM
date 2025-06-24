import { useState, useCallback } from 'react';
import { FileItem } from '../types';
import {
  AutomaticFileModificationService,
  AutomaticModificationResult,
  FileDetectionResult
} from '../services/AutomaticFileModificationService';
import { generateUniqueId } from '../utils/idGenerator';

/**
 * Estado del proceso de modificación automática
 */
export interface AutomaticModificationState {
  isProcessing: boolean;
  currentPhase: 'idle' | 'detecting' | 'analyzing' | 'modifying' | 'completed' | 'error';
  progress: number;
  detectionResult: FileDetectionResult | null;
  modificationResult: AutomaticModificationResult | null;
  error: string | null;
  analysisLog: string[];
}

/**
 * Interfaz para el resultado del proceso completo
 */
export interface AutomaticModificationProcess {
  id: string;
  instruction: string;
  timestamp: number;
  state: AutomaticModificationState;
  filesModified: FileItem[];
  originalFiles: FileItem[];
}

/**
 * Hook para manejar modificaciones automáticas de archivos
 */
export const useAutomaticModification = () => {
  const [currentProcess, setCurrentProcess] = useState<AutomaticModificationProcess | null>(null);
  const [processHistory, setProcessHistory] = useState<AutomaticModificationProcess[]>([]);

  const modificationService = AutomaticFileModificationService.getInstance();

  /**
   * Inicia el proceso de modificación automática
   */
  const startAutomaticModification = useCallback(async (
    instruction: string,
    projectFiles: FileItem[],
    projectContext?: string
  ): Promise<AutomaticModificationResult> => {
    const processId = generateUniqueId('auto-mod');

    // Inicializar el proceso
    const initialProcess: AutomaticModificationProcess = {
      id: processId,
      instruction,
      timestamp: Date.now(),
      state: {
        isProcessing: true,
        currentPhase: 'detecting',
        progress: 0,
        detectionResult: null,
        modificationResult: null,
        error: null,
        analysisLog: ['🚀 Iniciando proceso de modificación automática...']
      },
      filesModified: [],
      originalFiles: []
    };

    setCurrentProcess(initialProcess);

    try {
      // Fase 1: Detección de archivos (0-30%)
      updateProcessState(processId, {
        currentPhase: 'detecting',
        progress: 10,
        analysisLog: ['🔍 Analizando instrucción y detectando archivos objetivo...']
      });

      const detectionResult = await modificationService.detectTargetFiles(
        instruction,
        projectFiles,
        projectContext
      );

      updateProcessState(processId, {
        currentPhase: 'analyzing',
        progress: 30,
        detectionResult,
        analysisLog: [
          '✅ Detección completada',
          `📁 Archivos detectados: ${detectionResult.targetFiles.length}`,
          `🎯 Confianza: ${(detectionResult.confidence * 100).toFixed(1)}%`,
          `📝 Razón: ${detectionResult.analysisReason}`
        ]
      });

      if (detectionResult.targetFiles.length === 0) {
        throw new Error('No se detectaron archivos relevantes para modificar');
      }

      // Fase 2: Aplicación de modificaciones (30-90%)
      updateProcessState(processId, {
        currentPhase: 'modifying',
        progress: 40,
        analysisLog: ['🔧 Aplicando modificaciones automáticas...']
      });

      const modificationResult = await modificationService.applyAutomaticModifications(
        instruction,
        detectionResult.targetFiles,
        projectFiles
      );

      // Fase 3: Finalización (90-100%)
      updateProcessState(processId, {
        isProcessing: false,
        currentPhase: 'completed',
        progress: 100,
        modificationResult,
        analysisLog: [
          '🎉 Proceso completado exitosamente',
          `📝 Archivos modificados: ${modificationResult.modifiedFiles.length}`,
          `🔄 Cambios aplicados: ${modificationResult.changes.length}`,
          ...modificationResult.analysisLog
        ]
      });

      // Actualizar archivos modificados en el proceso
      setCurrentProcess(prev => prev ? {
        ...prev,
        filesModified: modificationResult.modifiedFiles,
        originalFiles: modificationResult.originalFiles
      } : null);

      // Agregar al historial
      const completedProcess = {
        ...initialProcess,
        state: {
          ...initialProcess.state,
          isProcessing: false,
          currentPhase: 'completed' as const,
          progress: 100,
          detectionResult,
          modificationResult
        },
        filesModified: modificationResult.modifiedFiles,
        originalFiles: modificationResult.originalFiles
      };

      setProcessHistory(prev => [completedProcess, ...prev.slice(0, 9)]); // Mantener últimos 10

      return modificationResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      updateProcessState(processId, {
        isProcessing: false,
        currentPhase: 'error',
        progress: 0,
        error: errorMessage,
        analysisLog: [`❌ Error: ${errorMessage}`]
      });

      // Agregar proceso fallido al historial
      const failedProcess = {
        ...initialProcess,
        state: {
          ...initialProcess.state,
          isProcessing: false,
          currentPhase: 'error' as const,
          error: errorMessage
        }
      };

      setProcessHistory(prev => [failedProcess, ...prev.slice(0, 9)]);

      throw error;
    }
  }, []);

  /**
   * Actualiza el estado del proceso actual
   */
  const updateProcessState = useCallback((
    processId: string,
    updates: Partial<AutomaticModificationState>
  ) => {
    setCurrentProcess(prev => {
      if (!prev || prev.id !== processId) return prev;

      return {
        ...prev,
        state: {
          ...prev.state,
          ...updates,
          analysisLog: updates.analysisLog || prev.state.analysisLog
        }
      };
    });
  }, []);

  /**
   * Cancela el proceso actual
   */
  const cancelCurrentProcess = useCallback(() => {
    setCurrentProcess(prev => {
      if (!prev) return null;

      return {
        ...prev,
        state: {
          ...prev.state,
          isProcessing: false,
          currentPhase: 'error',
          error: 'Proceso cancelado por el usuario'
        }
      };
    });
  }, []);

  /**
   * Limpia el proceso actual
   */
  const clearCurrentProcess = useCallback(() => {
    setCurrentProcess(null);
  }, []);

  /**
   * Obtiene el progreso actual como porcentaje
   */
  const getProgressPercentage = useCallback((): number => {
    return currentProcess?.state.progress || 0;
  }, [currentProcess]);

  /**
   * Obtiene el mensaje de estado actual
   */
  const getCurrentStatusMessage = useCallback((): string => {
    if (!currentProcess) return 'Sin proceso activo';

    const { currentPhase, error } = currentProcess.state;

    if (error) return `Error: ${error}`;

    switch (currentPhase) {
      case 'detecting':
        return 'Detectando archivos objetivo...';
      case 'analyzing':
        return 'Analizando archivos detectados...';
      case 'modifying':
        return 'Aplicando modificaciones...';
      case 'completed':
        return 'Proceso completado exitosamente';
      case 'error':
        return 'Error en el proceso';
      default:
        return 'Preparando...';
    }
  }, [currentProcess]);

  /**
   * Verifica si hay un proceso en ejecución
   */
  const isProcessing = useCallback((): boolean => {
    return currentProcess?.state.isProcessing || false;
  }, [currentProcess]);

  /**
   * Obtiene estadísticas del proceso actual
   */
  const getProcessStats = useCallback(() => {
    if (!currentProcess) return null;

    const { detectionResult, modificationResult } = currentProcess.state;

    return {
      filesDetected: detectionResult?.targetFiles.length || 0,
      filesModified: modificationResult?.modifiedFiles.length || 0,
      confidence: detectionResult?.confidence || 0,
      totalChanges: modificationResult?.changes.length || 0,
      linesChanged: modificationResult?.changes.reduce((sum, change) => sum + change.linesChanged, 0) || 0
    };
  }, [currentProcess]);

  return {
    // Estado
    currentProcess,
    processHistory,

    // Acciones
    startAutomaticModification,
    cancelCurrentProcess,
    clearCurrentProcess,

    // Utilidades
    getProgressPercentage,
    getCurrentStatusMessage,
    isProcessing,
    getProcessStats
  };
};

export default useAutomaticModification;
