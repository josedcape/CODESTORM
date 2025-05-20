import React from 'react';
import { Terminal, Code, Settings, Eye, MessageSquare } from 'lucide-react';

interface HeaderProps {
  onPreviewClick: () => void;
  onChatClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onPreviewClick, onChatClick }) => {
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
          <button
            onClick={onPreviewClick}
            className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 rounded-md px-3 py-1.5 transition-colors"
            title="Previsualizar código"
          >
            <Eye className="h-4 w-4" />
            <span>Vista Previa</span>
          </button>
          <button
            onClick={onChatClick}
            className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 rounded-md px-3 py-1.5 transition-colors"
            title="Abrir chat"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat</span>
          </button>
          <button className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 rounded-md px-3 py-1.5 transition-colors">
            <Code className="h-4 w-4" />
            <span>Proyectos</span>
          </button>
          <button className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 rounded-md px-3 py-1.5 transition-colors">
            <Settings className="h-4 w-4" />
            <span>Ajustes</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
