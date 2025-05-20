import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { TerminalOutput } from '../types';
import 'xterm/css/xterm.css';

interface TerminalProps {
  outputs: TerminalOutput[];
}

const Terminal: React.FC<TerminalProps> = ({ outputs }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal if it doesn't exist
    if (!xtermRef.current) {
      xtermRef.current = new XTerm({
        cursorBlink: true,
        theme: {
          background: '#1E1E1E',
          foreground: '#FFFFFF',
          cursor: '#FFFFFF',
          selectionBackground: '#4D4D4D',
        },
      });

      fitAddonRef.current = new FitAddon();
      xtermRef.current.loadAddon(fitAddonRef.current);
      xtermRef.current.open(terminalRef.current);
      fitAddonRef.current.fit();
    }

    // Clear terminal
    xtermRef.current.clear();

    // Write all outputs to terminal
    outputs.forEach(output => {
      const timestamp = new Date(output.timestamp).toLocaleTimeString();
      const statusColor = output.status === 'error' ? '\x1b[31m' : output.status === 'success' ? '\x1b[32m' : '\x1b[34m';
      
      xtermRef.current?.writeln(`\x1b[90m[${timestamp}]\x1b[0m ${statusColor}${output.status.toUpperCase()}\x1b[0m: $ ${output.command}`);
      
      if (output.output) {
        output.output.split('\n').forEach(line => {
          xtermRef.current?.writeln(`  ${line}`);
        });
      }
      
      xtermRef.current?.writeln('');
    });

    // Handle resize
    const handleResize = () => {
      fitAddonRef.current?.fit();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [outputs]);

  return (
    <div className="bg-[#1E1E1E] rounded-lg shadow-md p-0 h-full">
      <div className="bg-gray-800 text-white px-3 py-2 rounded-t-lg flex items-center">
        <div className="flex space-x-2 mr-3">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span className="text-sm font-mono">Terminal</span>
      </div>
      <div ref={terminalRef} className="h-[calc(100%-36px)]" />
    </div>
  );
};

export default Terminal;