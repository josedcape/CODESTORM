import React, { useState } from 'react';
import CodeStormSpinner from '../ui/CodeStormSpinner';
import LoadingOverlay from '../constructor/LoadingOverlay';

const SpinnerTest: React.FC = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [currentAgent, setCurrentAgent] = useState('codegenerator');
  const [progress, setProgress] = useState(45);

  const agents = ['planner', 'codegenerator', 'codemodifier', 'designarchitect'];

  const simulateProgress = () => {
    setShowOverlay(true);
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setShowOverlay(false);
          setProgress(0);
        }, 1000);
      }
    }, 500);
  };

  return (
    <div className="p-6 space-y-6 bg-codestorm-dark rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">🧪 Prueba de Spinners</h2>
      
      {/* Controles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Spinner Individual</h3>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowSpinner(!showSpinner)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {showSpinner ? 'Ocultar' : 'Mostrar'} Spinner
            </button>
            
            <select
              value={currentAgent}
              onChange={(e) => setCurrentAgent(e.target.value)}
              className="px-3 py-2 bg-codestorm-darker text-white rounded-md border border-codestorm-blue/30"
            >
              {agents.map(agent => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
          </div>

          {showSpinner && (
            <div className="p-4 bg-codestorm-darker rounded-lg">
              <CodeStormSpinner 
                message={`Trabajando con ${currentAgent}...`}
                size="medium"
                variant="default"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Loading Overlay</h3>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              {showOverlay ? 'Ocultar' : 'Mostrar'} Overlay
            </button>
            
            <button
              onClick={simulateProgress}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Simular Progreso
            </button>
          </div>

          <div className="text-sm text-gray-300">
            Progreso actual: {progress}%
          </div>
        </div>
      </div>

      {/* Variantes de Spinner */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Variantes de Spinner</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-codestorm-darker rounded-lg">
            <h4 className="text-sm font-medium text-white mb-2">Default</h4>
            <CodeStormSpinner 
              message="Generando código..."
              size="small"
              variant="default"
            />
          </div>
          
          <div className="p-4 bg-codestorm-darker rounded-lg">
            <h4 className="text-sm font-medium text-white mb-2">Minimal</h4>
            <CodeStormSpinner 
              message="Procesando..."
              size="small"
              variant="minimal"
            />
          </div>
          
          <div className="p-4 bg-codestorm-darker rounded-lg">
            <h4 className="text-sm font-medium text-white mb-2">Particles</h4>
            <CodeStormSpinner 
              message="Analizando..."
              size="small"
              variant="particles"
            />
          </div>
        </div>
      </div>

      {/* Estado actual */}
      <div className="p-4 bg-codestorm-blue/10 rounded-lg border border-codestorm-blue/30">
        <h4 className="text-sm font-medium text-white mb-2">Estado Actual</h4>
        <div className="text-sm text-gray-300 space-y-1">
          <div>Spinner Individual: {showSpinner ? '✅ Activo' : '❌ Inactivo'}</div>
          <div>Loading Overlay: {showOverlay ? '✅ Activo' : '❌ Inactivo'}</div>
          <div>Agente Actual: {currentAgent}</div>
          <div>Progreso: {progress}%</div>
        </div>
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={showOverlay}
        message={`Trabajando con ${currentAgent}...`}
        progress={progress}
        currentAgent={currentAgent}
        onCancel={() => {
          setShowOverlay(false);
          setProgress(0);
        }}
      />
    </div>
  );
};

export default SpinnerTest;
