/**
 * Página de Pruebas del Sistema de Reconocimiento de Voz
 * Para validar el funcionamiento del sistema unificado de voz en CODESTORM
 */

import React from 'react';
import { ArrowLeft, TestTube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VoiceTestPanel from '../components/VoiceTestPanel';
import BrandLogo from '../components/BrandLogo';

const VoiceTestPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-codestorm-dark via-codestorm-darker to-black">
      {/* Header */}
      <div className="border-b border-codestorm-blue/20 bg-codestorm-darker/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <BrandLogo />
            
            {/* Título */}
            <div className="flex items-center gap-3">
              <TestTube className="w-6 h-6 text-codestorm-accent" />
              <h1 className="text-xl font-bold text-white">
                Pruebas de Reconocimiento de Voz
              </h1>
            </div>
            
            {/* Botón de regreso */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-codestorm-blue/20 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Sistema Unificado de Reconocimiento de Voz
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            Esta página permite probar y validar el funcionamiento del sistema de reconocimiento de voz 
            optimizado para español en CODESTORM. El sistema utiliza coordinación centralizada para 
            evitar conflictos entre múltiples instancias de reconocimiento.
          </p>
        </div>

        {/* Información del Sistema */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-codestorm-darker border border-codestorm-blue/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">🎯 Características</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Optimizado para español (es-ES)</li>
              <li>• Coordinación centralizada</li>
              <li>• Manejo robusto de errores</li>
              <li>• Transcripción en tiempo real</li>
              <li>• Compatibilidad multi-navegador</li>
            </ul>
          </div>
          
          <div className="bg-codestorm-darker border border-codestorm-blue/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">🔧 Componentes</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• UnifiedVoiceService</li>
              <li>• VoiceCoordinator</li>
              <li>• useUnifiedVoice Hook</li>
              <li>• VoiceStateIndicator</li>
              <li>• Manejo de permisos</li>
            </ul>
          </div>
          
          <div className="bg-codestorm-darker border border-codestorm-blue/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">✅ Validaciones</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Soporte del navegador</li>
              <li>• Permisos de micrófono</li>
              <li>• Inicialización correcta</li>
              <li>• Transcripción precisa</li>
              <li>• Limpieza de recursos</li>
            </ul>
          </div>
        </div>

        {/* Panel de Pruebas */}
        <VoiceTestPanel />

        {/* Instrucciones */}
        <div className="mt-8 bg-codestorm-darker border border-codestorm-blue/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📋 Instrucciones de Uso</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-codestorm-accent mb-2">Prueba Automática:</h4>
              <ol className="space-y-1 text-gray-300 text-sm">
                <li>1. Haz clic en "Ejecutar Prueba"</li>
                <li>2. Permite el acceso al micrófono si se solicita</li>
                <li>3. Habla claramente en español cuando aparezca el indicador</li>
                <li>4. Observa los resultados en tiempo real</li>
                <li>5. La prueba se detiene automáticamente después de 10 segundos</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-codestorm-accent mb-2">Prueba Manual:</h4>
              <ol className="space-y-1 text-gray-300 text-sm">
                <li>1. Haz clic en "Iniciar" para comenzar la escucha</li>
                <li>2. Habla cuando veas el indicador de escucha activo</li>
                <li>3. Haz clic en "Detener" para finalizar</li>
                <li>4. Revisa la transcripción generada</li>
                <li>5. Usa "Limpiar" para resetear los resultados</li>
              </ol>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-200 text-sm">
              <strong>Nota:</strong> Para obtener mejores resultados, asegúrate de estar en un ambiente silencioso 
              y habla claramente. El sistema está optimizado para español pero puede reconocer otros idiomas 
              con menor precisión.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            BOTIDINAMIX AI - Sistema de Reconocimiento de Voz Unificado © 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceTestPage;
