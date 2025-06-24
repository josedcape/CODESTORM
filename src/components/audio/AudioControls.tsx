import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Speaker,
  Settings,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Zap,
  Headphones
} from 'lucide-react';
import { audioService, AudioSettings } from '../../services/AudioService';
import { nativeVoiceRecognitionService, VoiceRecognitionSettings } from '../../services/NativeVoiceRecognitionService';

interface AudioControlsProps {
  className?: string;
  compact?: boolean;
  showAdvanced?: boolean;
}

const AudioControls: React.FC<AudioControlsProps> = ({
  className = '',
  compact = false,
  showAdvanced = false
}) => {
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(audioService.getSettings());
  const [voiceSettings, setVoiceSettings] = useState<VoiceRecognitionSettings>(nativeVoiceRecognitionService.getSettings());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [testingSound, setTestingSound] = useState<string | null>(null);

  useEffect(() => {
    // Cargar voces disponibles
    setAvailableVoices(audioService.getAvailableVoices());

    // Listener para cambios en síntesis de voz
    const checkSpeaking = setInterval(() => {
      setIsSpeaking(audioService.isSpeaking());
    }, 100);

    // Listener para reconocimiento de voz
    const voiceListener = () => {
      setIsListening(nativeVoiceRecognitionService.isActive());
    };

    nativeVoiceRecognitionService.addEventListener(voiceListener);

    return () => {
      clearInterval(checkSpeaking);
      nativeVoiceRecognitionService.removeEventListener(voiceListener);
    };
  }, []);

  // Actualizar configuración de audio
  const updateAudioSettings = (newSettings: Partial<AudioSettings>) => {
    const updated = { ...audioSettings, ...newSettings };
    setAudioSettings(updated);
    audioService.updateSettings(newSettings);
  };

  // Actualizar configuración de voz
  const updateVoiceSettings = (newSettings: Partial<VoiceRecognitionSettings>) => {
    const updated = { ...voiceSettings, ...newSettings };
    setVoiceSettings(updated);
    nativeVoiceRecognitionService.updateSettings(newSettings);
  };

  // Alternar efectos de sonido
  const toggleSoundEffects = () => {
    updateAudioSettings({ soundEffectsEnabled: !audioSettings.soundEffectsEnabled });
  };

  // Alternar síntesis de voz
  const toggleSpeechSynthesis = () => {
    if (audioSettings.speechSynthesisEnabled && isSpeaking) {
      audioService.stopSpeaking();
    }
    updateAudioSettings({ speechSynthesisEnabled: !audioSettings.speechSynthesisEnabled });
  };

  // Alternar reconocimiento de voz
  const toggleVoiceRecognition = () => {
    if (voiceSettings.enabled && isListening) {
      nativeVoiceRecognitionService.stopListening();
    }
    updateVoiceSettings({ enabled: !voiceSettings.enabled });
  };

  // Probar efecto de sonido
  const testSoundEffect = async (effectId: string) => {
    setTestingSound(effectId);
    await audioService.playSound(effectId);
    setTestingSound(null);
  };

  // Probar síntesis de voz
  const testSpeech = () => {
    audioService.speakText('Hola, soy CODESTORM. Sistema de audio funcionando correctamente.');
  };

  // Activar comando STORM
  const activateStorm = () => {
    // El servicio nativo no tiene activateStormCommand, usar startListening
    nativeVoiceRecognitionService.startListening();
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* Controles compactos */}
        <button
          onClick={toggleSoundEffects}
          className={`p-2 rounded-md transition-colors ${
            audioSettings.soundEffectsEnabled
              ? 'bg-codestorm-blue text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
          title={audioSettings.soundEffectsEnabled ? 'Desactivar efectos de sonido' : 'Activar efectos de sonido'}
        >
          {audioSettings.soundEffectsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleSpeechSynthesis}
          className={`p-2 rounded-md transition-colors ${
            audioSettings.speechSynthesisEnabled
              ? 'bg-codestorm-blue text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
          title={audioSettings.speechSynthesisEnabled ? 'Desactivar síntesis de voz' : 'Activar síntesis de voz'}
        >
          <Speaker className="w-4 h-4" />
        </button>

        <button
          onClick={toggleVoiceRecognition}
          className={`p-2 rounded-md transition-colors ${
            voiceSettings.enabled
              ? isListening
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-codestorm-blue text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
          title={voiceSettings.enabled ? 'Desactivar reconocimiento de voz' : 'Activar reconocimiento de voz'}
        >
          {voiceSettings.enabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        <button
          onClick={activateStorm}
          className="p-2 rounded-md bg-codestorm-accent hover:bg-blue-600 text-white transition-colors"
          title="Activar comando STORM"
        >
          <Zap className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-codestorm-dark border border-codestorm-blue/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Headphones className="w-5 h-5 mr-2" />
          Controles de Audio
        </h3>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Controles principales */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Efectos de sonido */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300">Efectos de Sonido</label>
            <button
              onClick={toggleSoundEffects}
              className={`p-1 rounded ${
                audioSettings.soundEffectsEnabled ? 'bg-codestorm-blue' : 'bg-gray-600'
              }`}
            >
              {audioSettings.soundEffectsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={audioSettings.masterVolume}
            onChange={(e) => updateAudioSettings({ masterVolume: parseFloat(e.target.value) })}
            className="w-full"
            disabled={!audioSettings.soundEffectsEnabled}
          />
        </div>

        {/* Síntesis de voz */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300">Síntesis de Voz</label>
            <div className="flex space-x-1">
              <button
                onClick={testSpeech}
                className="p-1 rounded bg-gray-600 hover:bg-gray-500 text-white"
                disabled={!audioSettings.speechSynthesisEnabled}
              >
                <Play className="w-3 h-3" />
              </button>
              <button
                onClick={toggleSpeechSynthesis}
                className={`p-1 rounded ${
                  audioSettings.speechSynthesisEnabled ? 'bg-codestorm-blue' : 'bg-gray-600'
                }`}
              >
                <Speaker className="w-4 h-4" />
              </button>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={audioSettings.speechVolume}
            onChange={(e) => updateAudioSettings({ speechVolume: parseFloat(e.target.value) })}
            className="w-full"
            disabled={!audioSettings.speechSynthesisEnabled}
          />
        </div>
      </div>

      {/* Reconocimiento de voz */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-300">Reconocimiento de Voz</label>
          <div className="flex space-x-1">
            <button
              onClick={activateStorm}
              className="p-1 rounded bg-codestorm-accent hover:bg-blue-600 text-white"
              title="Comando STORM"
            >
              <Zap className="w-3 h-3" />
            </button>
            <button
              onClick={toggleVoiceRecognition}
              className={`p-1 rounded ${
                voiceSettings.enabled
                  ? isListening
                    ? 'bg-red-600 animate-pulse'
                    : 'bg-codestorm-blue'
                  : 'bg-gray-600'
              }`}
            >
              {voiceSettings.enabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {isListening && (
          <div className="text-xs text-codestorm-accent animate-pulse">
            🎤 Escuchando...
          </div>
        )}
      </div>

      {/* Pruebas de efectos de sonido */}
      {showAdvanced && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Probar Efectos</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(audioService.getAvailableSoundEffects()).map(([id, effect]) => (
              <button
                key={id}
                onClick={() => testSoundEffect(id)}
                disabled={!audioSettings.soundEffectsEnabled || testingSound === id}
                className={`p-2 text-xs rounded border border-codestorm-blue/30 hover:bg-codestorm-blue/20 transition-colors ${
                  testingSound === id ? 'bg-codestorm-blue animate-pulse' : 'bg-codestorm-darker'
                }`}
              >
                {effect.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Configuración avanzada */}
      {showSettings && (
        <div className="border-t border-codestorm-blue/30 pt-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Configuración Avanzada</h4>

          {/* Selección de voz */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Voz</label>
            <select
              value={audioSettings.selectedVoice || ''}
              onChange={(e) => updateAudioSettings({ selectedVoice: e.target.value })}
              className="w-full p-1 text-xs bg-codestorm-darker border border-codestorm-blue/30 rounded text-white"
            >
              <option value="">Voz por defecto</option>
              {availableVoices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Velocidad de habla */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Velocidad: {audioSettings.speechRate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={audioSettings.speechRate}
              onChange={(e) => updateAudioSettings({ speechRate: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Tono de voz */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Tono: {audioSettings.speechPitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={audioSettings.speechPitch}
              onChange={(e) => updateAudioSettings({ speechPitch: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Comando STORM */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400">Comando STORM</label>
            <button
              onClick={() => updateVoiceSettings({ stormCommandEnabled: !voiceSettings.stormCommandEnabled })}
              className={`p-1 rounded text-xs ${
                voiceSettings.stormCommandEnabled ? 'bg-codestorm-accent' : 'bg-gray-600'
              }`}
            >
              {voiceSettings.stormCommandEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioControls;
