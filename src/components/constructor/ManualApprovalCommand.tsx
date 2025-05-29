import React, { useState, useEffect } from 'react';
import { Terminal, Send, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { ApprovalData } from '../../types';

interface ManualApprovalCommandProps {
  approvalData: ApprovalData | null;
  onApprove: (feedback?: string) => void;
  onReject: (feedback: string) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const ManualApprovalCommand: React.FC<ManualApprovalCommandProps> = ({
  approvalData,
  onApprove,
  onReject,
  isVisible,
  onToggleVisibility
}) => {
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [output, setOutput] = useState<Array<{
    type: 'info' | 'success' | 'error' | 'command';
    message: string;
    timestamp: number;
  }>>([]);

  // Comandos disponibles
  const availableCommands = [
    'aprobar',
    'aprobar "comentario"',
    'rechazar "motivo"',
    'estado',
    'ayuda',
    'limpiar',
    'forzar'
  ];

  useEffect(() => {
    if (isVisible && approvalData) {
      addOutput('info', `Sistema de comando manual activado. Solicitud: ${approvalData.title}`);
      addOutput('info', 'Escribe "ayuda" para ver comandos disponibles.');
    }
  }, [isVisible, approvalData]);

  const addOutput = (type: 'info' | 'success' | 'error' | 'command', message: string) => {
    setOutput(prev => [...prev.slice(-19), {
      type,
      message,
      timestamp: Date.now()
    }]);
  };

  const executeCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();
    addOutput('command', `> ${cmd}`);

    if (!approvalData) {
      addOutput('error', 'No hay solicitud de aprobación pendiente');
      return;
    }

    try {
      if (trimmedCmd === 'aprobar' || trimmedCmd.startsWith('aprobar ')) {
        // Extraer comentario si existe
        const match = cmd.match(/aprobar\s+"([^"]+)"/i);
        const feedback = match ? match[1] : undefined;
        
        addOutput('success', `Ejecutando aprobación${feedback ? ` con comentario: "${feedback}"` : ''}`);
        onApprove(feedback);
        
      } else if (trimmedCmd.startsWith('rechazar ')) {
        // Extraer motivo (requerido)
        const match = cmd.match(/rechazar\s+"([^"]+)"/i);
        if (!match) {
          addOutput('error', 'Formato incorrecto. Usa: rechazar "motivo del rechazo"');
          return;
        }
        
        const feedback = match[1];
        addOutput('success', `Ejecutando rechazo con motivo: "${feedback}"`);
        onReject(feedback);
        
      } else if (trimmedCmd === 'estado') {
        addOutput('info', `ID: ${approvalData.id}`);
        addOutput('info', `Tipo: ${approvalData.type}`);
        addOutput('info', `Título: ${approvalData.title}`);
        addOutput('info', `Elementos: ${approvalData.items.length}`);
        addOutput('info', `Plan completo: ${approvalData.metadata?.isCompletePlan ? 'Sí' : 'No'}`);
        
      } else if (trimmedCmd === 'forzar') {
        addOutput('success', 'Ejecutando aprobación forzada...');
        onApprove('Aprobación forzada mediante comando manual');
        
      } else if (trimmedCmd === 'ayuda') {
        addOutput('info', 'Comandos disponibles:');
        addOutput('info', '  aprobar - Aprobar sin comentarios');
        addOutput('info', '  aprobar "comentario" - Aprobar con comentarios');
        addOutput('info', '  rechazar "motivo" - Rechazar con motivo');
        addOutput('info', '  estado - Mostrar información de la solicitud');
        addOutput('info', '  forzar - Aprobación forzada');
        addOutput('info', '  limpiar - Limpiar terminal');
        addOutput('info', '  ayuda - Mostrar esta ayuda');
        
      } else if (trimmedCmd === 'limpiar') {
        setOutput([]);
        addOutput('info', 'Terminal limpiado');
        
      } else {
        addOutput('error', `Comando no reconocido: "${cmd}". Escribe "ayuda" para ver comandos disponibles.`);
      }
    } catch (error) {
      addOutput('error', `Error al ejecutar comando: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    // Añadir al historial
    setCommandHistory(prev => [...prev.slice(-19), command]);
    setHistoryIndex(-1);

    executeCommand(command);
    setCommand('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCommand(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Autocompletar comando
      const partial = command.toLowerCase();
      const matches = availableCommands.filter(cmd => cmd.startsWith(partial));
      if (matches.length === 1) {
        setCommand(matches[0]);
      }
    }
  };

  const getOutputIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'error': return <XCircle className="w-3 h-3 text-red-400" />;
      case 'command': return <Terminal className="w-3 h-3 text-blue-400" />;
      default: return <Info className="w-3 h-3 text-gray-400" />;
    }
  };

  const getOutputColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-300';
      case 'error': return 'text-red-300';
      case 'command': return 'text-blue-300';
      default: return 'text-gray-300';
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisibility}
        className="fixed bottom-16 right-4 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg z-40 transition-colors"
        title="Abrir Terminal de Comandos"
      >
        <Terminal className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-purple-400" />
          <span className="text-white font-medium">Terminal de Comandos</span>
        </div>
        <button
          onClick={onToggleVisibility}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Output */}
      <div className="flex-1 p-3 overflow-y-auto bg-black text-sm font-mono">
        {output.length === 0 ? (
          <div className="text-gray-500">Terminal listo. Escribe un comando...</div>
        ) : (
          output.map((item, index) => (
            <div key={index} className="flex items-start space-x-2 mb-1">
              {getOutputIcon(item.type)}
              <span className={getOutputColor(item.type)}>
                {item.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-purple-400 font-mono">$</span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un comando..."
            className="flex-1 bg-transparent text-white font-mono text-sm outline-none"
            disabled={!approvalData}
          />
          <button
            type="submit"
            disabled={!command.trim() || !approvalData}
            className="p-1 text-purple-400 hover:text-purple-300 disabled:text-gray-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {/* Ayuda rápida */}
        <div className="mt-2 text-xs text-gray-500">
          Comandos: aprobar, rechazar "motivo", estado, forzar, ayuda
        </div>
      </form>
    </div>
  );
};

export default ManualApprovalCommand;
