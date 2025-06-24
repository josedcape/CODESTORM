/**
 * Componente de Diagnóstico de Voz para CODESTORM
 * Ayuda a identificar y resolver problemas con el reconocimiento de voz
 */

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { unifiedVoiceService } from '../services/UnifiedVoiceService';
import { voiceCoordinator } from '../services/VoiceCoordinator';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

const VoiceDiagnostic: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);

    const results: DiagnosticResult[] = [];

    // Test 1: Verificar soporte de Speech Recognition
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        results.push({
          test: 'Soporte de Speech Recognition',
          status: 'success',
          message: 'Speech Recognition está soportado',
          details: `Usando: ${window.SpeechRecognition ? 'SpeechRecognition' : 'webkitSpeechRecognition'}`
        });
      } else {
        results.push({
          test: 'Soporte de Speech Recognition',
          status: 'error',
          message: 'Speech Recognition no está soportado en este navegador',
          details: 'Prueba con Chrome, Edge o Safari'
        });
      }
    } catch (error) {
      results.push({
        test: 'Soporte de Speech Recognition',
        status: 'error',
        message: 'Error al verificar soporte',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }

    // Test 2: Verificar permisos
    try {
      const permissions = await unifiedVoiceService.checkPermissions();
      
      if (permissions.microphone) {
        results.push({
          test: 'Permisos de Micrófono',
          status: 'success',
          message: 'Permisos de micrófono disponibles'
        });
      } else {
        results.push({
          test: 'Permisos de Micrófono',
          status: 'warning',
          message: 'Permisos de micrófono no verificados',
          details: 'Se solicitarán cuando sea necesario'
        });
      }
    } catch (error) {
      results.push({
        test: 'Permisos de Micrófono',
        status: 'error',
        message: 'Error al verificar permisos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }

    // Test 3: Verificar VoiceCoordinator
    try {
      const canRequest = voiceCoordinator.requestAccess('advanced');
      if (canRequest) {
        results.push({
          test: 'VoiceCoordinator',
          status: 'success',
          message: 'VoiceCoordinator funcionando correctamente'
        });
        voiceCoordinator.releaseAccess('advanced');
      } else {
        results.push({
          test: 'VoiceCoordinator',
          status: 'warning',
          message: 'Otro servicio está usando el reconocimiento de voz'
        });
      }
    } catch (error) {
      results.push({
        test: 'VoiceCoordinator',
        status: 'error',
        message: 'Error en VoiceCoordinator',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }

    // Test 4: Verificar inicialización del servicio
    try {
      const initialized = await unifiedVoiceService.initialize({
        language: 'es-ES',
        enableDebug: true,
        componentName: 'VoiceDiagnostic'
      });

      if (initialized) {
        results.push({
          test: 'Inicialización del Servicio',
          status: 'success',
          message: 'Servicio inicializado correctamente'
        });
      } else {
        results.push({
          test: 'Inicialización del Servicio',
          status: 'error',
          message: 'No se pudo inicializar el servicio'
        });
      }
    } catch (error) {
      results.push({
        test: 'Inicialización del Servicio',
        status: 'error',
        message: 'Error al inicializar servicio',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-500 bg-green-500/10';
      case 'warning':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'error':
        return 'border-red-500 bg-red-500/10';
    }
  };

  useEffect(() => {
    // Ejecutar diagnósticos automáticamente al montar
    runDiagnostics();
  }, []);

  return (
    <div className="p-6 bg-codestorm-dark rounded-lg border border-codestorm-accent/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Mic className="w-6 h-6 text-codestorm-accent" />
          <h3 className="text-xl font-semibold text-white">Diagnóstico de Voz</h3>
        </div>
        
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-codestorm-accent hover:bg-codestorm-accent/80 
                     disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Ejecutando...' : 'Ejecutar Diagnóstico'}
        </button>
      </div>

      {diagnostics.length > 0 && (
        <div className="space-y-4">
          {diagnostics.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${getStatusColor(result.status)}`}
            >
              <div className="flex items-center gap-3 mb-2">
                {getStatusIcon(result.status)}
                <h4 className="font-medium text-white">{result.test}</h4>
              </div>
              
              <p className="text-gray-300 mb-2">{result.message}</p>
              
              {result.details && (
                <details className="text-sm text-gray-400">
                  <summary className="cursor-pointer hover:text-gray-300">
                    Ver detalles
                  </summary>
                  <p className="mt-2 p-2 bg-black/20 rounded">{result.details}</p>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-codestorm-accent/20">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-codestorm-accent hover:text-codestorm-accent/80 text-sm"
        >
          {showDetails ? 'Ocultar' : 'Mostrar'} información técnica
        </button>
        
        {showDetails && (
          <div className="mt-4 p-4 bg-black/20 rounded-lg">
            <h5 className="font-medium text-white mb-2">Información del Sistema:</h5>
            <div className="text-sm text-gray-300 space-y-1">
              <p><strong>Navegador:</strong> {navigator.userAgent}</p>
              <p><strong>Idioma:</strong> {navigator.language}</p>
              <p><strong>Plataforma:</strong> {navigator.platform}</p>
              <p><strong>Conexión segura:</strong> {location.protocol === 'https:' ? 'Sí' : 'No'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceDiagnostic;
