import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Share, Bell, Clock, CheckCircle, AlertTriangle, Code, GitBranch } from 'lucide-react';
import { AgentState } from '../../pages/Agent';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: number;
}

interface Insight {
  id: string;
  type: 'suggestion' | 'warning' | 'info' | 'question';
  title: string;
  description: string;
  author: string;
  timestamp: number;
  file?: string;
  shared: boolean;
  responses: number;
}

interface TeamCollaborationProps {
  agentState: AgentState;
  onShareInsight: (insight: Insight) => void;
}

const TeamCollaboration: React.FC<TeamCollaborationProps> = ({ agentState, onShareInsight }) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [newInsightText, setNewInsightText] = useState('');
  const [activeTab, setActiveTab] = useState<'team' | 'insights' | 'activity'>('insights');

  useEffect(() => {
    // Simular datos del equipo
    const mockTeamMembers: TeamMember[] = [
      {
        id: 'member-1',
        name: 'Ana García',
        role: 'Frontend Developer',
        avatar: '👩‍💻',
        status: 'online',
        lastSeen: Date.now()
      },
      {
        id: 'member-2',
        name: 'Carlos López',
        role: 'Backend Developer',
        avatar: '👨‍💻',
        status: 'away',
        lastSeen: Date.now() - 300000
      },
      {
        id: 'member-3',
        name: 'María Rodríguez',
        role: 'UI/UX Designer',
        avatar: '🎨',
        status: 'online',
        lastSeen: Date.now()
      },
      {
        id: 'member-4',
        name: 'David Chen',
        role: 'DevOps Engineer',
        avatar: '⚙️',
        status: 'offline',
        lastSeen: Date.now() - 3600000
      }
    ];

    const mockInsights: Insight[] = [
      {
        id: 'insight-1',
        type: 'suggestion',
        title: 'Optimización de Performance',
        description: 'He notado que el componente Home se re-renderiza mucho. ¿Qué opinan de usar React.memo?',
        author: 'Ana García',
        timestamp: Date.now() - 1800000,
        file: '/src/pages/Home.tsx',
        shared: true,
        responses: 3
      },
      {
        id: 'insight-2',
        type: 'warning',
        title: 'Posible Memory Leak',
        description: 'Detecté que no estamos limpiando los event listeners en algunos componentes.',
        author: 'Carlos López',
        timestamp: Date.now() - 3600000,
        shared: true,
        responses: 1
      },
      {
        id: 'insight-3',
        type: 'info',
        title: 'Nueva Librería de UI',
        description: 'Encontré una librería que podría mejorar nuestros componentes de formulario.',
        author: 'María Rodríguez',
        timestamp: Date.now() - 7200000,
        shared: false,
        responses: 0
      },
      {
        id: 'insight-4',
        type: 'question',
        title: 'Estrategia de Testing',
        description: '¿Deberíamos implementar más tests de integración para los nuevos features?',
        author: 'David Chen',
        timestamp: Date.now() - 10800000,
        shared: true,
        responses: 5
      }
    ];

    setTeamMembers(mockTeamMembers);
    setInsights(mockInsights);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-400';
      case 'away':
        return 'bg-yellow-400';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'suggestion':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'info':
        return <Bell className="w-4 h-4 text-blue-400" />;
      case 'question':
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      default:
        return <Code className="w-4 h-4 text-gray-400" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'suggestion':
        return 'border-green-500/30 bg-green-500/10';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'info':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'question':
        return 'border-purple-500/30 bg-purple-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const handleShareInsight = () => {
    if (newInsightText.trim()) {
      const newInsight: Insight = {
        id: `insight-${Date.now()}`,
        type: 'info',
        title: 'Nuevo Insight',
        description: newInsightText,
        author: 'Tú',
        timestamp: Date.now(),
        shared: true,
        responses: 0
      };
      
      setInsights(prev => [newInsight, ...prev]);
      setNewInsightText('');
      onShareInsight(newInsight);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `hace ${days}d`;
    if (hours > 0) return `hace ${hours}h`;
    if (minutes > 0) return `hace ${minutes}m`;
    return 'ahora';
  };

  return (
    <div className="h-full bg-codestorm-dark rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-codestorm-blue/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-codestorm-accent" />
            <span className="font-medium text-white">Colaboración en Equipo</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-400">
              {teamMembers.filter(m => m.status === 'online').length} en línea
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mt-3">
          <button
            onClick={() => setActiveTab('insights')}
            className={`text-sm px-3 py-1 rounded ${
              activeTab === 'insights' 
                ? 'bg-codestorm-accent text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Insights ({insights.length})
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`text-sm px-3 py-1 rounded ${
              activeTab === 'team' 
                ? 'bg-codestorm-accent text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Equipo ({teamMembers.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`text-sm px-3 py-1 rounded ${
              activeTab === 'activity' 
                ? 'bg-codestorm-accent text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Actividad
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'insights' && (
          <div className="p-4">
            {/* Crear nuevo insight */}
            <div className="mb-4 p-3 bg-codestorm-darker rounded-lg border border-codestorm-blue/30">
              <textarea
                value={newInsightText}
                onChange={(e) => setNewInsightText(e.target.value)}
                placeholder="Comparte un insight con tu equipo..."
                className="w-full bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleShareInsight}
                  disabled={!newInsightText.trim()}
                  className="flex items-center space-x-1 px-3 py-1 bg-codestorm-accent text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Share className="w-4 h-4" />
                  <span className="text-sm">Compartir</span>
                </button>
              </div>
            </div>

            {/* Lista de insights */}
            <div className="space-y-3">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  onClick={() => setSelectedInsight(insight)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedInsight?.id === insight.id 
                      ? `${getInsightColor(insight.type)} border-2` 
                      : 'bg-codestorm-darker border-codestorm-blue/30 hover:border-codestorm-blue/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{insight.title}</h3>
                        <p className="text-sm text-gray-300 mt-1">{insight.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                          <span>{insight.author}</span>
                          <span>{formatTimeAgo(insight.timestamp)}</span>
                          {insight.file && <span>{insight.file.split('/').pop()}</span>}
                          {insight.responses > 0 && (
                            <span className="flex items-center space-x-1">
                              <MessageSquare className="w-3 h-3" />
                              <span>{insight.responses}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {insight.shared && (
                      <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                        Compartido
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="p-4">
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-4 bg-codestorm-darker rounded-lg border border-codestorm-blue/30"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-codestorm-blue rounded-full flex items-center justify-center text-lg">
                        {member.avatar}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-codestorm-dark ${getStatusColor(member.status)}`}></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{member.name}</h3>
                      <p className="text-sm text-gray-400">{member.role}</p>
                      <p className="text-xs text-gray-500">
                        {member.status === 'online' ? 'En línea' : 
                         member.status === 'away' ? 'Ausente' : 
                         `Desconectado ${formatTimeAgo(member.lastSeen)}`}
                      </p>
                    </div>
                    <button className="p-2 bg-codestorm-accent/20 text-codestorm-accent rounded hover:bg-codestorm-accent/30 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="p-4">
            <div className="space-y-3">
              <div className="p-3 bg-codestorm-darker rounded-lg border border-codestorm-blue/30">
                <div className="flex items-center space-x-2">
                  <GitBranch className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white">Ana García creó una nueva rama: feature/optimization</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">hace 15 minutos</div>
              </div>
              
              <div className="p-3 bg-codestorm-darker rounded-lg border border-codestorm-blue/30">
                <div className="flex items-center space-x-2">
                  <Code className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white">Carlos López hizo commit en main</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">hace 1 hora</div>
              </div>
              
              <div className="p-3 bg-codestorm-darker rounded-lg border border-codestorm-blue/30">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-white">María Rodríguez comentó en el PR #123</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">hace 2 horas</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamCollaboration;
