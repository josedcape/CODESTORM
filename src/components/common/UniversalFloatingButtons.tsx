import React, { useState } from 'react';
import FloatingActionButtons from '../FloatingActionButtons';
import UniversalWebPreviewButton from './UniversalWebPreviewButton';
import EnhancedHelpAssistant from './EnhancedHelpAssistant';
import UniversalVoiceIndicator from './UniversalVoiceIndicator';
import { FileItem } from '../../types';

interface UniversalFloatingButtonsProps {
  onToggleChat: () => void;
  onTogglePreview: () => void;
  onToggleCodeModifier?: () => void;
  onToggleHelpAssistant?: () => void;
  onOpenWebPreview?: () => void;
  onOpenCodeCorrector?: () => void;
  showChat: boolean;
  showCodeModifier?: boolean;
  showHelpAssistant?: boolean;
  files?: FileItem[];
  projectName?: string;
  currentPage?: string;
}

const UniversalFloatingButtons: React.FC<UniversalFloatingButtonsProps> = ({
  onToggleChat,
  onTogglePreview,
  onToggleCodeModifier,
  onToggleHelpAssistant,
  onOpenWebPreview,
  onOpenCodeCorrector,
  showChat,
  showCodeModifier = false,
  showHelpAssistant = false,
  files = [],
  projectName,
  currentPage = 'home'
}) => {
  const [isEnhancedHelpOpen, setIsEnhancedHelpOpen] = useState(false);

  console.log('🔄 Renderizando UniversalFloatingButtons', {
    filesCount: files.length,
    projectName,
    currentPage,
    showHelpAssistant
  });

  // Manejar apertura del asistente mejorado
  const handleToggleEnhancedHelp = () => {
    setIsEnhancedHelpOpen(!isEnhancedHelpOpen);
    // También llamar al handler original si existe
    onToggleHelpAssistant?.();
  };

  return (
    <>
      {/* Botones flotantes originales */}
      <FloatingActionButtons
        onToggleChat={onToggleChat}
        onTogglePreview={onTogglePreview}
        onToggleCodeModifier={onToggleCodeModifier}
        onToggleHelpAssistant={handleToggleEnhancedHelp}
        showChat={showChat}
        showCodeModifier={showCodeModifier}
        showHelpAssistant={showHelpAssistant}
      />

      {/* Botón de vista previa web universal */}
      <UniversalWebPreviewButton
        files={files}
        projectName={projectName}
      />

      {/* Indicador de voz universal */}
      <UniversalVoiceIndicator
        componentName={`UniversalVoice-${currentPage}`}
        position="bottom-left"
        size="md"
        showTranscript={true}
        showCommands={true}
        onCommand={(command, confidence) => {
          console.log(`🎤 [UniversalFloatingButtons] Comando recibido: "${command}" (${Math.round(confidence * 100)}%)`);

          // Procesar comandos específicos
          if (command.includes('abrir vista previa web')) {
            onOpenWebPreview?.();
          } else if (command.includes('abrir corrector de código')) {
            onOpenCodeCorrector?.();
          } else if (command.includes('cerrar ayuda')) {
            setIsEnhancedHelpOpen(false);
          } else if (command.includes('mostrar ayuda') || command.includes('abrir ayuda')) {
            setIsEnhancedHelpOpen(true);
          }
        }}
      />

      {/* Asistente de ayuda mejorado */}
      <EnhancedHelpAssistant
        isOpen={isEnhancedHelpOpen}
        onClose={() => setIsEnhancedHelpOpen(false)}
        onOpenWebPreview={onOpenWebPreview}
        onOpenCodeCorrector={onOpenCodeCorrector}
      />
    </>
  );
};

export default UniversalFloatingButtons;
