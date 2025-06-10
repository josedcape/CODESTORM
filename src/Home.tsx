import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code,
  Wrench,
  Globe,
  Zap,
  ArrowRight,
  Sparkles,
  Bot,
  FileCode,
  Terminal,
  Settings
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BrandLogo from '../components/BrandLogo';
import { useUI } from '../contexts/UIContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useUI();

  // Inicializar reconocimiento de voz global
  useEffect(() => {
    console.log('Inicializando reconocimiento de voz global en página de inicio...');
    import('../utils/voiceInitializer').then(({ initializeVoiceRecognition }) => {
      initializeVoiceRecognition({
        onStormCommand: (command: string) => {
          console.log('Comando STORM recibido en página de inicio:', command);
          // Navegar al Constructor con el comando
          navigate('/constructor', { state: { initialCommand: command } });
        },
        enableDebug: true,
        autoStart: true
      });
    });

    return () => {
      import('../utils/voiceInitializer').then(({ cleanupVoiceRecognition }) => {
        cleanupVoiceRecognition();
      });
    };
  }, [navigate]);

  const features = [
    {
      id: 'constructor',
      title: 'Constructor',
      description: 'Crea proyectos completos con IA avanzada. Sistema iterativo guiado con múltiples agentes especializados.',
      icon: Code,
      color: 'from-blue-500 to-cyan-500',
      path: '/constructor',
      highlights: ['IA Iterativa', 'Multi-Agente', 'Tiempo Real']
    },
    {
      id: 'agent',
      title: 'AGENT',
      description: 'Sistema de gestión de proyectos con IA. Planificación inteligente, ejecución automática y Claude 3.7 Sonnet.',
      icon: Settings,
      color: 'from-purple-500 to-pink-500',
      path: '/agent',
      highlights: ['Gestión IA', 'Claude 3.7', 'Automatización']
    },
    {
      id: 'webai',
      title: 'WebAI',
      description: 'Especializado en crear páginas web estáticas con HTML y CSS puro. Diseño responsive automático.',
      icon: Globe,
      color: 'from-green-500 to-emerald-500',
      path: '/webai',
      highlights: ['HTML/CSS Puro', 'Responsive', 'Sin Frameworks']
    },
    {
      id: 'codecorrector',
      title: 'CodeCorrector',
      description: 'Depura y optimiza tu código existente. Análisis inteligente y corrección automática de errores.',
      icon: Wrench,
      color: 'from-orange-500 to-red-500',
      path: '/codecorrector',
      highlights: ['Depuración', 'Optimización', 'Análisis Inteligente']
    }
  ];

  const handleFeatureClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="flex flex-col min-h-screen bg-codestorm-darker">
      <Header showConstructorButton={false} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <BrandLogo size="xl" showPulse={true} showGlow={true} />
          </div>
          
          <h1 className={`${isMobile ? 'text-3xl' : 'text-5xl'} font-bold text-white mb-6`}>
            Bienvenido a{' '}
            <span className="bg-gradient-to-r from-codestorm-accent to-blue-400 bg-clip-text text-transparent">
              CODESTORM
            </span>
          </h1>
          
          <p className={`${isMobile ? 'text-lg' : 'text-xl'} text-gray-300 mb-8 max-w-3xl mx-auto`}>
            La plataforma de desarrollo asistido por IA más avanzada. Crea, modifica y optimiza código 
            con agentes especializados que trabajan en tiempo real.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center px-4 py-2 bg-codestorm-blue/20 rounded-full border border-codestorm-blue/30">
              <Bot className="w-5 h-5 text-codestorm-accent mr-2" />
              <span className="text-sm text-white">IA Multi-Agente</span>
            </div>
            <div className="flex items-center px-4 py-2 bg-codestorm-blue/20 rounded-full border border-codestorm-blue/30">
              <Zap className="w-5 h-5 text-codestorm-accent mr-2" />
              <span className="text-sm text-white">Tiempo Real</span>
            </div>
            <div className="flex items-center px-4 py-2 bg-codestorm-blue/20 rounded-full border border-codestorm-blue/30">
              <Sparkles className="w-5 h-5 text-codestorm-accent mr-2" />
              <span className="text-sm text-white">Reconocimiento de Voz</span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className={`grid ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-2 xl:grid-cols-4'} gap-8 mb-16`}>
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.id}
                onClick={() => handleFeatureClick(feature.path)}
                className="group relative bg-codestorm-dark rounded-xl p-6 border border-codestorm-blue/20 hover:border-codestorm-accent/50 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-codestorm-accent/20"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`} />
                
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-codestorm-accent transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Highlights */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {feature.highlights.map((highlight, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-codestorm-blue/20 text-codestorm-accent text-xs rounded-md border border-codestorm-blue/30"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>

                {/* Arrow */}
                <div className="flex items-center text-codestorm-accent group-hover:translate-x-2 transition-transform duration-300">
                  <span className="text-sm font-medium mr-2">Explorar</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Start Section */}
        <div className="bg-codestorm-dark rounded-xl p-8 border border-codestorm-blue/20 mb-16">
          <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-white mb-6 text-center`}>
            Inicio Rápido
          </h2>
          
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-6`}>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileCode className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">1. Describe tu proyecto</h3>
              <p className="text-gray-300 text-sm">
                Usa texto o comandos de voz para describir lo que quieres crear
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">2. IA genera el código</h3>
              <p className="text-gray-300 text-sm">
                Los agentes especializados crean automáticamente tu proyecto
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Terminal className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">3. Modifica en tiempo real</h3>
              <p className="text-gray-300 text-sm">
                Ajusta y perfecciona tu código con modificaciones interactivas
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <button
            onClick={() => handleFeatureClick('/constructor')}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-codestorm-accent to-blue-500 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-codestorm-accent transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-codestorm-accent/30"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Comenzar Ahora
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </main>

      <Footer showLogo={false} />
    </div>
  );
};

export default Home;
