import React, { useState } from 'react';
import { Zap, Shield, Gauge, Beaker, FileText, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface CorrectionOptionsProps {
  onOptionsChange: (options: {
    analyzeSecurity: boolean;
    analyzePerformance: boolean;
    generateTests: boolean;
    explainChanges: boolean;
  }) => void;
  isProcessing: boolean;
}

const CorrectionOptions: React.FC<CorrectionOptionsProps> = ({
  onOptionsChange,
  isProcessing
}) => {
  const [options, setOptions] = useState({
    analyzeSecurity: true,
    analyzePerformance: true,
    generateTests: false,
    explainChanges: true
  });
  const [isExpanded, setIsExpanded] = useState(false);

  const handleOptionChange = (option: keyof typeof options) => {
    const newOptions = {
      ...options,
      [option]: !options[option]
    };
    setOptions(newOptions);
    onOptionsChange(newOptions);
  };

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md border border-codestorm-blue/30 overflow-hidden">
      <div 
        className="bg-codestorm-blue/20 p-3 border-b border-codestorm-blue/30 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-white font-medium flex items-center">
          <Zap className="h-5 w-5 mr-2 text-codestorm-gold" />
          Opciones avanzadas
        </h3>
        <button className="text-gray-400 hover:text-white">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="analyzeSecurity"
              checked={options.analyzeSecurity}
              onChange={() => handleOptionChange('analyzeSecurity')}
              disabled={isProcessing}
              className="h-4 w-4 rounded border-gray-600 text-codestorm-accent focus:ring-codestorm-accent/50 bg-codestorm-darker"
            />
            <label htmlFor="analyzeSecurity" className="ml-2 flex items-center text-white">
              <Shield className="h-4 w-4 mr-1 text-green-500" />
              Verificar seguridad
              <span className="ml-2 text-xs text-gray-400">
                (Detecta vulnerabilidades y problemas de seguridad)
              </span>
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="analyzePerformance"
              checked={options.analyzePerformance}
              onChange={() => handleOptionChange('analyzePerformance')}
              disabled={isProcessing}
              className="h-4 w-4 rounded border-gray-600 text-codestorm-accent focus:ring-codestorm-accent/50 bg-codestorm-darker"
            />
            <label htmlFor="analyzePerformance" className="ml-2 flex items-center text-white">
              <Gauge className="h-4 w-4 mr-1 text-blue-500" />
              Analizar complejidad
              <span className="ml-2 text-xs text-gray-400">
                (Identifica problemas de rendimiento y optimizaciones)
              </span>
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="generateTests"
              checked={options.generateTests}
              onChange={() => handleOptionChange('generateTests')}
              disabled={isProcessing}
              className="h-4 w-4 rounded border-gray-600 text-codestorm-accent focus:ring-codestorm-accent/50 bg-codestorm-darker"
            />
            <label htmlFor="generateTests" className="ml-2 flex items-center text-white">
              <Beaker className="h-4 w-4 mr-1 text-purple-500" />
              Generar tests
              <span className="ml-2 text-xs text-gray-400">
                (Crea tests unitarios para verificar la corrección)
              </span>
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="explainChanges"
              checked={options.explainChanges}
              onChange={() => handleOptionChange('explainChanges')}
              disabled={isProcessing}
              className="h-4 w-4 rounded border-gray-600 text-codestorm-accent focus:ring-codestorm-accent/50 bg-codestorm-darker"
            />
            <label htmlFor="explainChanges" className="ml-2 flex items-center text-white">
              <FileText className="h-4 w-4 mr-1 text-yellow-500" />
              Explicar cambios
              <span className="ml-2 text-xs text-gray-400">
                (Proporciona explicaciones detalladas de las correcciones)
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorrectionOptions;
