import React from 'react';
import { Terminal, Code, Settings } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Terminal className="h-8 w-8 text-codestorm-gold" />
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-codestorm-gold to-codestorm-accent bg-clip-text text-transparent">CODESTORM</h1>
            <p className="text-xs text-gray-200">Agente Desarrollador Autónomo</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 rounded-md px-3 py-1.5 transition-colors">
            <Code className="h-4 w-4" />
            <span>Projects</span>
          </button>
          <button className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 rounded-md px-3 py-1.5 transition-colors">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
