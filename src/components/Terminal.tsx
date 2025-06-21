import React, { useState } from 'react';
import { TerminalOutput, CommandAnalysis } from '../types';
import {
  Terminal as TerminalIcon,
  X,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Clock,
  Cpu,
  Lightbulb
} from 'lucide-react';

interface TerminalProps {
  outputs: TerminalOutput[];
  onCommandExecuted?: (command: string, output: string) => void;
}

const Terminal: React.FC<TerminalProps> = ({ outputs, onCommandExecuted }) => {
  const [expandedOutputs, setExpandedOutputs] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedOutputs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Efecto para notificar cuando se ejecuta un comando
  React.useEffect(() => {
    if (outputs.length > 0) {
      const latestOutput = outputs[outputs.length - 1];

      // Notificar al componente padre sobre el comando ejecutado
      if (onCommandExecuted && latestOutput.status !== 'info') {
        onCommandExecuted(latestOutput.command, latestOutput.output);
      }
    }
  }, [outputs, onCommandExecuted]);

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md h-full flex flex-col border border-codestorm-blue/30">
      <div className="flex items-center justify-between bg-codestorm-blue/20 p-2 border-b border-codestorm-blue/30">
        <div className="flex items-center">
          <TerminalIcon className="h-4 w-4 text-codestorm-gold mr-2" />
          <span className="font-medium text-sm text-white">Terminal</span>
        </div>
        <div className="flex space-x-1">
          <button className="p-1.5 rounded-md hover:bg-codestorm-blue/30 transition-colors text-gray-400 hover:text-white">
            <Minimize2 className="h-3 w-3" />
          </button>
          <button className="p-1.5 rounded-md hover:bg-codestorm-blue/30 transition-colors text-gray-400 hover:text-white">
            <Maximize2 className="h-3 w-3" />
          </button>
          <button className="p-1.5 rounded-md hover:bg-codestorm-blue/30 transition-colors text-gray-400 hover:text-white">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3 font-mono text-sm bg-codestorm-darker">
        {outputs.map((output) => (
          <div key={output.id} className="mb-4 border-b border-codestorm-blue/10 pb-2">
            <div className="flex items-center text-codestorm-gold">
              <span className="mr-2">$</span>
              <span>{output.command}</span>
            </div>
            <div className={`ml-2 ${getOutputColor(output.status)}`}>
              {output.output}
            </div>

            {output.analysis && (
              <div className="mt-2 ml-2">
                <button
                  onClick={() => toggleExpand(output.id)}
                  className="flex items-center text-xs text-codestorm-accent hover:text-codestorm-gold transition-colors"
                >
                  {expandedOutputs[output.id] ? (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronRight className="h-3 w-3 mr-1" />
                  )}
                  <span>Análisis de comando</span>
                  {getStatusIcon(output.analysis)}
                </button>

                {expandedOutputs[output.id] && (
                  <div className="mt-2 bg-codestorm-blue/5 p-2 rounded border border-codestorm-blue/20 text-xs">
                    <div className="mb-1 text-white font-medium">{output.analysis.summary}</div>

                    {output.analysis.details && (
                      <div className="mb-2 text-gray-300">{output.analysis.details}</div>
                    )}

                    {output.analysis.suggestions && output.analysis.suggestions.length > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center text-yellow-300 mb-1">
                          <Lightbulb className="h-3 w-3 mr-1" />
                          <span>Sugerencias:</span>
                        </div>
                        <ul className="list-disc list-inside text-gray-300">
                          {output.analysis.suggestions.map((suggestion, idx) => (
                            <li key={idx}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {output.analysis.executionTime && (
                      <div className="flex items-center text-gray-400 text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Tiempo: {output.analysis.executionTime}ms</span>
                      </div>
                    )}

                    {output.analysis.resourceUsage && (
                      <div className="flex items-center text-gray-400 text-xs mt-1">
                        <Cpu className="h-3 w-3 mr-1" />
                        <span>
                          {output.analysis.resourceUsage.cpu && `CPU: ${output.analysis.resourceUsage.cpu}`}
                          {output.analysis.resourceUsage.memory && ` | Memoria: ${output.analysis.resourceUsage.memory}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const getStatusIcon = (analysis: CommandAnalysis) => {
  if (analysis.isValid) {
    return <CheckCircle className="h-3 w-3 ml-1 text-green-400" />;
  } else {
    return <AlertCircle className="h-3 w-3 ml-1 text-red-400" />;
  }
};

const getOutputColor = (status: string) => {
  switch (status) {
    case 'success':
      return 'text-green-400';
    case 'error':
      return 'text-red-400';
    case 'warning':
      return 'text-yellow-400';
    case 'info':
    default:
      return 'text-gray-300';
  }
};

export default Terminal;
