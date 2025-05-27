import React, { useState } from 'react';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Wifi, 
  WifiOff, 
  Zap, 
  ZapOff,
  Vibrate,
  Eye,
  EyeOff,
  Clock,
  Image,
  TouchpadOff
} from 'lucide-react';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';
import MobileTabSystem from './MobileTabSystem';
import MobileFloatingActions from './MobileFloatingActions';

const MobileTestPage: React.FC = () => {
  const mobileOpt = useMobileOptimization();
  const [testResults, setTestResults] = useState<string[]>([]);

  // Función para añadir resultado de prueba
  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  // Pruebas de funcionalidad
  const testHapticFeedback = (type: 'light' | 'medium' | 'heavy') => {
    mobileOpt.triggerHapticFeedback(type);
    addTestResult(`Feedback háptico ${type} activado`);
  };

  const testPerformanceOptimization = () => {
    const shouldOptimize = mobileOpt.optimizeForPerformance();
    addTestResult(`Optimización de rendimiento: ${shouldOptimize ? 'Activada' : 'Desactivada'}`);
  };

  const testAnimationDuration = () => {
    const baseMs = 1000;
    const optimizedMs = mobileOpt.getOptimalAnimationDuration(baseMs);
    addTestResult(`Duración de animación optimizada: ${baseMs}ms → ${optimizedMs}ms`);
  };

  const testImageQuality = () => {
    const quality = mobileOpt.getOptimalImageQuality();
    addTestResult(`Calidad de imagen recomendada: ${quality}`);
  };

  // Componentes de prueba para las pestañas
  const TestChatComponent = () => (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-white">Chat de Prueba</h3>
      <div className="space-y-2">
        <div className="bg-codestorm-blue/20 p-3 rounded-lg chat-message-pulse">
          <p className="text-sm">Mensaje del asistente con animación de pulso</p>
        </div>
        <div className="bg-codestorm-accent p-3 rounded-lg chat-message-pulse-user ml-auto max-w-[80%]">
          <p className="text-sm">Mensaje del usuario con animación específica</p>
        </div>
        <div className="bg-green-900/20 p-3 rounded-lg chat-message-pulse-success">
          <p className="text-sm">Mensaje de éxito con animación verde</p>
        </div>
      </div>
    </div>
  );

  const TestFileExplorer = () => (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Explorador de Archivos</h3>
      <div className="space-y-2">
        {['index.html', 'styles.css', 'script.js', 'README.md'].map((file, index) => (
          <div 
            key={file}
            className="mobile-file-item bg-codestorm-blue/10 hover:bg-codestorm-blue/20 cursor-pointer"
            onClick={() => {
              mobileOpt.triggerHapticFeedback('light');
              addTestResult(`Archivo seleccionado: ${file}`);
            }}
          >
            <span className="text-sm text-white">{file}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const TestCodeEditor = () => (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Editor de Código</h3>
      <div className="mobile-code-editor">
        <div className="mobile-code-toolbar">
          <button 
            className="px-3 py-1 bg-codestorm-blue/20 rounded text-sm text-white"
            onClick={() => {
              mobileOpt.triggerHapticFeedback('medium');
              addTestResult('Código guardado');
            }}
          >
            Guardar
          </button>
          <button 
            className="px-3 py-1 bg-green-600/20 rounded text-sm text-white"
            onClick={() => {
              mobileOpt.triggerHapticFeedback('medium');
              addTestResult('Código ejecutado');
            }}
          >
            Ejecutar
          </button>
        </div>
        <div className="mobile-code-content bg-codestorm-darker p-3 rounded mt-2">
          <pre className="text-sm text-green-400 font-mono">
{`function helloWorld() {
  console.log("¡Hola desde CODESTORM móvil!");
  return "Optimizado para móviles";
}`}
          </pre>
        </div>
      </div>
    </div>
  );

  const TestTerminal = () => (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Terminal</h3>
      <div className="mobile-terminal">
        <div className="mobile-terminal-output">
          <div className="text-green-400 font-mono text-sm">
            <p>$ npm install codestorm-mobile</p>
            <p>✓ Optimizaciones móviles instaladas</p>
            <p>✓ Feedback háptico configurado</p>
            <p>✓ Animaciones optimizadas</p>
            <p>$ _</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Configurar pestañas de prueba
  const testTabs = [
    {
      id: 'chat',
      label: 'Chat',
      icon: <Smartphone className="w-5 h-5" />,
      content: <TestChatComponent />,
      badge: 2
    },
    {
      id: 'files',
      label: 'Archivos',
      icon: <Tablet className="w-5 h-5" />,
      content: <TestFileExplorer />
    },
    {
      id: 'editor',
      label: 'Editor',
      icon: <Monitor className="w-5 h-5" />,
      content: <TestCodeEditor />
    },
    {
      id: 'terminal',
      label: 'Terminal',
      icon: <Zap className="w-5 h-5" />,
      content: <TestTerminal />
    }
  ];

  // Acciones flotantes de prueba
  const testActions = [
    {
      id: 'haptic-light',
      icon: <Vibrate className="w-5 h-5" />,
      label: 'Haptic Light',
      onClick: () => testHapticFeedback('light')
    },
    {
      id: 'haptic-medium',
      icon: <Vibrate className="w-5 h-5" />,
      label: 'Haptic Medium',
      onClick: () => testHapticFeedback('medium')
    },
    {
      id: 'haptic-heavy',
      icon: <Vibrate className="w-5 h-5" />,
      label: 'Haptic Heavy',
      onClick: () => testHapticFeedback('heavy')
    },
    {
      id: 'test-performance',
      icon: <Zap className="w-5 h-5" />,
      label: 'Test Performance',
      onClick: testPerformanceOptimization
    }
  ];

  return (
    <div className="h-screen bg-codestorm-dark text-white flex flex-col">
      {/* Header de información del dispositivo */}
      <div className="p-4 bg-codestorm-blue/10 border-b border-codestorm-blue/30">
        <h1 className="text-xl font-bold mb-2">CODESTORM - Pruebas Móviles</h1>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {mobileOpt.isMobile ? <Smartphone className="w-4 h-4" /> : 
               mobileOpt.isTablet ? <Tablet className="w-4 h-4" /> : 
               <Monitor className="w-4 h-4" />}
              <span>
                {mobileOpt.isMobile ? 'Móvil' : 
                 mobileOpt.isTablet ? 'Tablet' : 'Desktop'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {mobileOpt.touchDevice ? <TouchpadOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{mobileOpt.touchDevice ? 'Touch' : 'No Touch'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {mobileOpt.connectionSpeed === 'slow' ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              <span>Conexión: {mobileOpt.connectionSpeed}</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {mobileOpt.isLowEndDevice ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
              <span>{mobileOpt.isLowEndDevice ? 'Gama Baja' : 'Gama Alta'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {mobileOpt.shouldReduceAnimations() ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{mobileOpt.shouldReduceAnimations() ? 'Animaciones Reducidas' : 'Animaciones Completas'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              <span>Calidad: {mobileOpt.getOptimalImageQuality()}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-400">
          {mobileOpt.screenWidth} x {mobileOpt.screenHeight} | {mobileOpt.orientation} | DPR: {mobileOpt.devicePixelRatio}
        </div>
      </div>

      {/* Sistema de pestañas móviles */}
      <div className="flex-1 overflow-hidden">
        <MobileTabSystem
          tabs={testTabs}
          defaultTab="chat"
          onTabChange={(tabId) => addTestResult(`Pestaña cambiada a: ${tabId}`)}
        />
      </div>

      {/* Panel de resultados de pruebas */}
      <div className="h-32 p-2 bg-codestorm-darker border-t border-codestorm-blue/30 overflow-y-auto">
        <h3 className="text-sm font-semibold mb-2">Resultados de Pruebas:</h3>
        <div className="space-y-1 text-xs">
          {testResults.slice(-5).map((result, index) => (
            <div key={index} className="text-gray-300">{result}</div>
          ))}
        </div>
      </div>

      {/* Botones flotantes de prueba */}
      <MobileFloatingActions
        actions={testActions}
        position="bottom-right"
        layout="vertical"
        hapticFeedback={true}
      />
    </div>
  );
};

export default MobileTestPage;
