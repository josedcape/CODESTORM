/**
 * Utilidades de Reparación para el Sistema de Reconocimiento de Voz
 * Proporciona funciones para diagnosticar y reparar problemas comunes
 */

import { unifiedVoiceService } from '../services/UnifiedVoiceService';
import { voiceCoordinator } from '../services/VoiceCoordinator';

export interface RepairResult {
  success: boolean;
  message: string;
  details?: string;
  actions?: string[];
}

/**
 * Reparar problemas de inicialización
 */
export const repairInitialization = async (): Promise<RepairResult> => {
  const actions: string[] = [];
  
  try {
    actions.push('Limpiando estado del servicio...');
    unifiedVoiceService.cleanup();
    
    actions.push('Liberando acceso del coordinador...');
    voiceCoordinator.releaseAccess('advanced');
    voiceCoordinator.releaseAccess('native');
    
    actions.push('Esperando estabilización...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    actions.push('Reinicializando servicio...');
    const success = await unifiedVoiceService.initialize({
      language: 'es-ES',
      enableDebug: true,
      componentName: 'VoiceRepair'
    });
    
    if (success) {
      return {
        success: true,
        message: 'Servicio de voz reparado exitosamente',
        actions
      };
    } else {
      return {
        success: false,
        message: 'No se pudo reparar el servicio de voz',
        details: 'La reinicialización falló',
        actions
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error durante la reparación',
      details: error instanceof Error ? error.message : 'Error desconocido',
      actions
    };
  }
};

/**
 * Reparar problemas de permisos
 */
export const repairPermissions = async (): Promise<RepairResult> => {
  const actions: string[] = [];
  
  try {
    actions.push('Verificando soporte del navegador...');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      return {
        success: false,
        message: 'Navegador no compatible',
        details: 'Este navegador no soporta reconocimiento de voz. Prueba con Chrome, Edge o Safari.',
        actions
      };
    }
    
    actions.push('Solicitando permisos de micrófono...');
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        actions.push('Permisos concedidos, cerrando stream...');
        stream.getTracks().forEach(track => track.stop());
        
        return {
          success: true,
          message: 'Permisos de micrófono reparados',
          details: 'El usuario ha concedido permisos de micrófono',
          actions
        };
      } catch (permError) {
        return {
          success: false,
          message: 'Permisos de micrófono denegados',
          details: 'El usuario debe permitir el acceso al micrófono en la configuración del navegador',
          actions
        };
      }
    } else {
      return {
        success: false,
        message: 'API de medios no disponible',
        details: 'getUserMedia no está disponible en este contexto',
        actions
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error al reparar permisos',
      details: error instanceof Error ? error.message : 'Error desconocido',
      actions
    };
  }
};

/**
 * Reparar conflictos del coordinador
 */
export const repairCoordinator = async (): Promise<RepairResult> => {
  const actions: string[] = [];
  
  try {
    actions.push('Obteniendo estado del coordinador...');
    const debugInfo = voiceCoordinator.getDebugInfo();
    
    actions.push('Liberando todos los accesos...');
    voiceCoordinator.releaseAccess('native');
    voiceCoordinator.releaseAccess('advanced');
    
    actions.push('Marcando servicios como inactivos...');
    voiceCoordinator.markRecognitionInactive('native');
    voiceCoordinator.markRecognitionInactive('advanced');
    
    actions.push('Esperando estabilización...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    actions.push('Verificando estado final...');
    const finalDebugInfo = voiceCoordinator.getDebugInfo();
    
    return {
      success: true,
      message: 'Coordinador de voz reparado',
      details: `Estado inicial: ${debugInfo}\nEstado final: ${finalDebugInfo}`,
      actions
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error al reparar coordinador',
      details: error instanceof Error ? error.message : 'Error desconocido',
      actions
    };
  }
};

/**
 * Reparación completa del sistema de voz
 */
export const repairVoiceSystem = async (): Promise<RepairResult> => {
  const actions: string[] = [];
  const results: RepairResult[] = [];
  
  try {
    actions.push('Iniciando reparación completa del sistema de voz...');
    
    // Paso 1: Reparar coordinador
    actions.push('Paso 1: Reparando coordinador...');
    const coordinatorResult = await repairCoordinator();
    results.push(coordinatorResult);
    actions.push(...(coordinatorResult.actions || []));
    
    // Paso 2: Reparar permisos
    actions.push('Paso 2: Reparando permisos...');
    const permissionsResult = await repairPermissions();
    results.push(permissionsResult);
    actions.push(...(permissionsResult.actions || []));
    
    // Paso 3: Reparar inicialización
    actions.push('Paso 3: Reparando inicialización...');
    const initResult = await repairInitialization();
    results.push(initResult);
    actions.push(...(initResult.actions || []));
    
    // Evaluar resultado general
    const allSuccessful = results.every(r => r.success);
    const someSuccessful = results.some(r => r.success);
    
    if (allSuccessful) {
      return {
        success: true,
        message: 'Sistema de voz completamente reparado',
        details: 'Todos los componentes funcionan correctamente',
        actions
      };
    } else if (someSuccessful) {
      return {
        success: false,
        message: 'Reparación parcial completada',
        details: 'Algunos componentes siguen con problemas',
        actions
      };
    } else {
      return {
        success: false,
        message: 'No se pudo reparar el sistema de voz',
        details: 'Todos los intentos de reparación fallaron',
        actions
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error durante la reparación completa',
      details: error instanceof Error ? error.message : 'Error desconocido',
      actions
    };
  }
};

/**
 * Obtener recomendaciones basadas en el navegador
 */
export const getBrowserRecommendations = (): string[] => {
  const recommendations: string[] = [];
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('firefox')) {
    recommendations.push('Firefox tiene soporte limitado para reconocimiento de voz');
    recommendations.push('Considera usar Chrome o Edge para mejor compatibilidad');
  }
  
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    recommendations.push('Safari requiere iOS 14.5+ o macOS Big Sur+ para reconocimiento de voz');
  }
  
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    recommendations.push('El reconocimiento de voz requiere HTTPS en producción');
    recommendations.push('Asegúrate de que el sitio use una conexión segura');
  }
  
  if (userAgent.includes('mobile')) {
    recommendations.push('En dispositivos móviles, toca el botón de micrófono para activar la escucha');
    recommendations.push('Evita usar reconocimiento continuo en móviles para ahorrar batería');
  }
  
  return recommendations;
};

/**
 * Verificar configuración del sistema
 */
export const checkSystemConfiguration = (): { [key: string]: boolean | string } => {
  return {
    speechRecognitionSupport: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    httpsEnabled: location.protocol === 'https:' || location.hostname === 'localhost',
    mediaDevicesSupport: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    permissionsApiSupport: !!navigator.permissions,
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform
  };
};
