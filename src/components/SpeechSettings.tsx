/**
 * Componente de Configuración Global de Síntesis de Voz
 * Permite configurar preferencias de síntesis de voz para toda la aplicación
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Mic2, 
  Save, 
  RotateCcw,
  TestTube,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { SpeechConfig } from '../services/SpeechSynthesisService';

export interface SpeechSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (config: Partial<SpeechConfig>) => void;
}

interface SpeechPreferences extends Partial<SpeechConfig> {
  enabled: boolean;
  autoPlayResponses: boolean;
  enableInAllChats: boolean;
}

const SpeechSettings: React.FC<SpeechSettingsProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [preferences, setPreferences] = useState<SpeechPreferences>({
    enabled: true,
    autoPlayResponses: false,
    enableInAllChats: true,
    rate: 0.9,
    pitch: 1.0,
    volume: 0.8,
    language: 'es-ES',
    enableHighlight: true
  });

  const [testText, setTestText] = useState('Hola, esta es una prueba de síntesis de voz en español.');
  const [isTesting, setIsTesting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const {
    isSupported,
    isInitialized,
    voices,
    spanishVoices,
    speak,
    stop,
    setPreferredVoice,
    updateConfig,
    status
  } = useSpeechSynthesis({
    componentName: 'SpeechSettings',
    defaultConfig: preferences
  });

  // Cargar preferencias guardadas
  useEffect(() => {
    const savedPreferences = localStorage.getItem('codestorm-speech-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Error al cargar preferencias de voz:', error);
      }
    }
  }, []);

  // Actualizar configuración cuando cambien las preferencias
  useEffect(() => {
    if (isInitialized) {
      updateConfig(preferences);
    }
  }, [preferences, isInitialized, updateConfig]);

  // Manejar cambios en preferencias
  const handlePreferenceChange = (key: keyof SpeechPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Cambiar voz seleccionada
  const handleVoiceChange = (voiceName: string) => {
    const voice = voices.find(v => v.name === voiceName);
    if (voice) {
      setPreferredVoice(voice);
      handlePreferenceChange('voice', voice);
    }
  };

  // Probar síntesis de voz
  const handleTest = () => {
    if (!testText.trim() || isTesting) return;
    
    setIsTesting(true);
    speak(testText, {
      ...preferences,
      onEnd: () => setIsTesting(false),
      onError: () => setIsTesting(false)
    });
  };

  // Detener prueba
  const handleStopTest = () => {
    stop();
    setIsTesting(false);
  };

  // Guardar configuración
  const handleSave = () => {
    try {
      localStorage.setItem('codestorm-speech-preferences', JSON.stringify(preferences));
      onSave?.(preferences);
      setHasChanges(false);
      
      // Mostrar confirmación visual
      const button = document.getElementById('save-button');
      if (button) {
        button.classList.add('bg-green-500');
        setTimeout(() => {
          button.classList.remove('bg-green-500');
        }, 1000);
      }
    } catch (error) {
      console.error('Error al guardar preferencias:', error);
    }
  };

  // Restaurar valores por defecto
  const handleReset = () => {
    const defaultPreferences: SpeechPreferences = {
      enabled: true,
      autoPlayResponses: false,
      enableInAllChats: true,
      rate: 0.9,
      pitch: 1.0,
      volume: 0.8,
      language: 'es-ES',
      enableHighlight: true
    };
    
    setPreferences(defaultPreferences);
    setHasChanges(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-codestorm-dark border border-codestorm-accent/30 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-codestorm-accent/20">
          <div className="flex items-center gap-3">
            <Volume2 className="w-6 h-6 text-codestorm-accent" />
            <h2 className="text-xl font-semibold text-white">Configuración de Síntesis de Voz</h2>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-codestorm-accent/20 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Estado del sistema */}
          <div className="flex items-center gap-3 p-4 bg-codestorm-darker/50 rounded-lg">
            {isSupported ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <div>
              <p className="text-white font-medium">
                {isSupported ? 'Síntesis de voz soportada' : 'Síntesis de voz no soportada'}
              </p>
              <p className="text-sm text-gray-400">
                {isSupported 
                  ? `${spanishVoices.length} voces en español disponibles`
                  : 'Tu navegador no soporta síntesis de voz'
                }
              </p>
            </div>
          </div>

          {isSupported && (
            <>
              {/* Configuración general */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-codestorm-accent" />
                  Configuración General
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={preferences.enabled}
                      onChange={(e) => handlePreferenceChange('enabled', e.target.checked)}
                      className="accent-codestorm-accent"
                    />
                    <span className="text-gray-300">Habilitar síntesis de voz</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={preferences.autoPlayResponses}
                      onChange={(e) => handlePreferenceChange('autoPlayResponses', e.target.checked)}
                      className="accent-codestorm-accent"
                      disabled={!preferences.enabled}
                    />
                    <span className="text-gray-300">Reproducir respuestas automáticamente</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={preferences.enableInAllChats}
                      onChange={(e) => handlePreferenceChange('enableInAllChats', e.target.checked)}
                      className="accent-codestorm-accent"
                      disabled={!preferences.enabled}
                    />
                    <span className="text-gray-300">Habilitar en todos los chats</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={preferences.enableHighlight}
                      onChange={(e) => handlePreferenceChange('enableHighlight', e.target.checked)}
                      className="accent-codestorm-accent"
                      disabled={!preferences.enabled}
                    />
                    <span className="text-gray-300">Resaltar texto durante reproducción</span>
                  </label>
                </div>
              </div>

              {/* Selección de voz */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Mic2 className="w-5 h-5 text-codestorm-accent" />
                  Voz
                </h3>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Voz preferida:</label>
                  <select
                    value={preferences.voice?.name || ''}
                    onChange={(e) => handleVoiceChange(e.target.value)}
                    disabled={!preferences.enabled}
                    className="w-full p-3 bg-codestorm-darker border border-codestorm-accent/30 rounded-lg text-white disabled:opacity-50"
                  >
                    <option value="">Voz por defecto del sistema</option>
                    {spanishVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang}) {voice.localService ? '(Local)' : '(Red)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Controles de audio */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Controles de Audio</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Velocidad */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Velocidad: {preferences.rate?.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={preferences.rate || 0.9}
                      onChange={(e) => handlePreferenceChange('rate', parseFloat(e.target.value))}
                      disabled={!preferences.enabled}
                      className="w-full accent-codestorm-accent disabled:opacity-50"
                    />
                  </div>

                  {/* Tono */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Tono: {preferences.pitch?.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={preferences.pitch || 1.0}
                      onChange={(e) => handlePreferenceChange('pitch', parseFloat(e.target.value))}
                      disabled={!preferences.enabled}
                      className="w-full accent-codestorm-accent disabled:opacity-50"
                    />
                  </div>

                  {/* Volumen */}
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Volumen: {Math.round((preferences.volume || 0.8) * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={preferences.volume || 0.8}
                      onChange={(e) => handlePreferenceChange('volume', parseFloat(e.target.value))}
                      disabled={!preferences.enabled}
                      className="w-full accent-codestorm-accent disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Prueba de voz */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-codestorm-accent" />
                  Prueba de Voz
                </h3>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Texto de prueba:</label>
                  <textarea
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    disabled={!preferences.enabled}
                    className="w-full p-3 bg-codestorm-darker border border-codestorm-accent/30 rounded-lg text-white resize-none disabled:opacity-50"
                    rows={3}
                    placeholder="Escribe un texto para probar la síntesis de voz..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={isTesting ? handleStopTest : handleTest}
                    disabled={!preferences.enabled || !testText.trim()}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isTesting 
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-codestorm-accent hover:bg-codestorm-accent/80 text-white'
                    }`}
                  >
                    {isTesting ? (
                      <>
                        <VolumeX className="w-4 h-4" />
                        Detener
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        Probar
                      </>
                    )}
                  </button>

                  {status.state === 'speaking' && (
                    <div className="flex items-center gap-2 text-codestorm-accent">
                      <div className="w-2 h-2 bg-codestorm-accent rounded-full animate-pulse" />
                      <span className="text-sm">Reproduciendo...</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-codestorm-accent/20">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar por defecto
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            
            <button
              id="save-button"
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center gap-2 px-4 py-2 bg-codestorm-accent hover:bg-codestorm-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechSettings;
