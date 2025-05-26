/**
 * Panel de Pruebas de Reconocimiento de Voz
 * Componente para validar el funcionamiento del sistema unificado de voz
 */

import React, { useState } from 'react';
import { Mic, MicOff, Play, Square, RefreshCw, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { useUnifiedVoice } from '../hooks/useUnifiedVoice';
import { unifiedVoiceService } from '../services/UnifiedVoiceService';
import { voiceCoordinator } from '../services/VoiceCoordinator';
import VoiceStateIndicator from './VoiceStateIndicator';

const VoiceTestPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Hook de voz unificado para pruebas
  const {
    voiceState,
    isListening,
    isInitialized,
    isSupported,
    error,
    transcript,
    initialize,
    startListening,
    stopListening,
    resetTranscript,
    cleanup,
    getDebugInfo
  } = useUnifiedVoice({
    onTranscript: (text: string) => {
      addTestResult(`📝 Transcripción intermedia: "${text}"`);
    },
    onFinalTranscript: (text: string) => {
      addTestResult(`✅ Transcripción final: "${text}"`);
    },
    onError: (errorMessage: string) => {
      addTestResult(`❌ Error: ${errorMessage}`);
    },
    componentName: 'VoiceTestPanel',
    language: 'es-ES',
    enableDebug: true,
    autoInitialize: false
  });

  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const runVoiceTest = async () => {
    addTestResult('🧪 Iniciando prueba de reconocimiento de voz...');
    
    try {
      // Limpiar resultados anteriores
      setTestResults([]);
      
      // Verificar soporte
      if (!isSupported) {
        addTestResult('❌ Reconocimiento de voz no soportado en este navegador');
        return;
      }
      
      // Inicializar si no está inicializado
      if (!isInitialized) {
        addTestResult('🔄 Inicializando servicio de voz...');
        const success = await initialize();
        if (!success) {
          addTestResult('❌ Error al inicializar el servicio de voz');
          return;
        }
        addTestResult('✅ Servicio de voz inicializado correctamente');
      }
      
      // Iniciar escucha
      addTestResult('🎤 Iniciando escucha de voz...');
      const started = startListening();
      if (started) {
        addTestResult('✅ Escucha iniciada. Habla ahora en español...');
        
        // Auto-detener después de 10 segundos
        setTimeout(() => {
          if (isListening) {
            stopListening();
            addTestResult('⏰ Prueba completada (timeout de 10 segundos)');
          }
        }, 10000);
      } else {
        addTestResult('❌ No se pudo iniciar la escucha');
      }
      
    } catch (error) {
      addTestResult(`❌ Error durante la prueba: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    resetTranscript();
  };

  const forceCleanup = () => {
    addTestResult('🧹 Forzando limpieza del sistema de voz...');
    cleanup();
    voiceCoordinator.forceReleaseAll();
    addTestResult('✅ Limpieza completada');
  };

  const getStatusColor = () => {
    if (error) return 'text-red-400';
    if (!isSupported) return 'text-gray-400';
    if (!isInitialized) return 'text-yellow-400';
    if (isListening) return 'text-green-400';
    return 'text-blue-400';
  };

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="w-5 h-5" />;
    if (!isSupported) return <MicOff className="w-5 h-5" />;
    if (isListening) return <Mic className="w-5 h-5 animate-pulse" />;
    if (isInitialized) return <CheckCircle className="w-5 h-5" />;
    return <RefreshCw className="w-5 h-5" />;
  };

  return (
    <div className="p-6 bg-codestorm-darker border border-codestorm-blue/30 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Mic className="w-6 h-6 text-codestorm-accent" />
          Panel de Pruebas de Voz
        </h2>
        <VoiceStateIndicator
          voiceState={voiceState}
          isListening={isListening}
          error={error}
          size="medium"
          showLabel={true}
        />
      </div>

      {/* Estado del Sistema */}
      <div className="mb-6 p-4 bg-codestorm-dark/50 border border-codestorm-blue/20 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">Estado del Sistema</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={getStatusColor()}>
              Estado: {voiceState}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={isSupported ? 'text-green-400' : 'text-red-400'}>
              Soportado: {isSupported ? 'Sí' : 'No'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={isInitialized ? 'text-green-400' : 'text-yellow-400'}>
              Inicializado: {isInitialized ? 'Sí' : 'No'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={isListening ? 'text-green-400' : 'text-gray-400'}>
              Escuchando: {isListening ? 'Sí' : 'No'}
            </span>
          </div>
        </div>
        
        {error && (
          <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
            Error: {error}
          </div>
        )}
        
        {transcript && (
          <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-blue-400 text-sm">
            Transcript: "{transcript}"
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={runVoiceTest}
          disabled={isListening}
          className="flex items-center gap-2 px-4 py-2 bg-codestorm-blue hover:bg-codestorm-blue/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <Play className="w-4 h-4" />
          Ejecutar Prueba
        </button>
        
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={!isInitialized}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white'
          }`}
        >
          {isListening ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {isListening ? 'Detener' : 'Iniciar'}
        </button>
        
        <button
          onClick={clearResults}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Limpiar
        </button>
        
        <button
          onClick={forceCleanup}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors"
        >
          <AlertCircle className="w-4 h-4" />
          Forzar Limpieza
        </button>
        
        <button
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
        >
          <Info className="w-4 h-4" />
          Debug Info
        </button>
      </div>

      {/* Resultados de Pruebas */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Resultados de Pruebas</h3>
        <div className="bg-codestorm-dark/50 border border-codestorm-blue/20 rounded-lg p-4 max-h-64 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay resultados de pruebas aún. Ejecuta una prueba para ver los resultados.</p>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm text-gray-300 font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Debug Info */}
      {showDebugInfo && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Información de Debug</h3>
          <div className="bg-codestorm-dark/50 border border-codestorm-blue/20 rounded-lg p-4">
            <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto">
              {getDebugInfo()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceTestPanel;
