import React, { useRef, useEffect } from 'react';
import { Trash, Copy, Download, Check } from 'lucide-react';

interface TerminalOutputProps {
  output: string[];
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({ output }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = React.useState(false);
  const [isDownloaded, setIsDownloaded] = React.useState(false);

  // Auto-scroll al final cuando se añaden nuevos mensajes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  // Función para limpiar la terminal
  const handleClear = () => {
    // No podemos modificar directamente el output, así que emitimos un evento personalizado
    const event = new CustomEvent('terminal:clear');
    document.dispatchEvent(event);
  };

  // Función para copiar el contenido de la terminal
  const handleCopy = () => {
    const text = output.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Función para descargar el contenido de la terminal
  const handleDownload = () => {
    const text = output.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-output-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2000);
  };

  // Función para colorear la salida según el tipo de mensaje
  const getLineColor = (line: string) => {
    if (line.startsWith('[ERROR]')) return 'text-red-400';
    if (line.startsWith('[WARNING]')) return 'text-yellow-400';
    if (line.startsWith('[SUCCESS]')) return 'text-green-400';
    if (line.startsWith('[INFO]')) return 'text-blue-400';
    if (line.startsWith('[SISTEMA]')) return 'text-purple-400';
    if (line.startsWith('[USUARIO]')) return 'text-codestorm-accent';
    return 'text-gray-300';
  };

  return (
    <div className="flex flex-col h-full border rounded-lg shadow-md bg-codestorm-dark border-codestorm-blue/30">
      <div className="flex items-center justify-between p-3 border-b border-codestorm-blue/30">
        <h2 className="text-sm font-medium text-white">Terminal</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title="Copiar contenido"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title="Descargar contenido"
          >
            {isDownloaded ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
            title="Limpiar terminal"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div
        ref={terminalRef}
        className="flex-1 p-3 overflow-auto font-mono text-sm bg-black"
      >
        {output.length === 0 ? (
          <div className="text-gray-500 italic">
            La terminal está vacía. Las acciones y mensajes aparecerán aquí.
          </div>
        ) : (
          output.map((line, index) => (
            <div key={index} className={`${getLineColor(line)} mb-1`}>
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TerminalOutput;
