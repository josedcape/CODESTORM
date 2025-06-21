import React, { useState } from 'react';
import { X, ArrowRight, Info } from 'lucide-react';
import { TechnologyStack } from '../../types/technologyStacks';
import TechnologyStackCarousel from './TechnologyStackCarousel';
import { useUI } from '../../contexts/UIContext';

interface TechnologyStackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStack: (stack: TechnologyStack) => void;
  userInstruction: string;
}

const TechnologyStackModal: React.FC<TechnologyStackModalProps> = ({
  isOpen,
  onClose,
  onSelectStack,
  userInstruction
}) => {
  const { isMobile } = useUI();
  const [selectedStack, setSelectedStack] = useState<TechnologyStack | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  const handleStackSelect = (stack: TechnologyStack) => {
    setSelectedStack(stack);
  };

  const handleConfirmSelection = () => {
    if (selectedStack) {
      onSelectStack(selectedStack);
      onClose();
    }
  };

  const handleShowDetails = (stack: TechnologyStack) => {
    setSelectedStack(stack);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative bg-codestorm-darker rounded-xl border border-codestorm-blue/30 shadow-2xl
        ${isMobile ? 'w-full h-full' : 'w-[95vw] h-[90vh] max-w-7xl'}
        flex flex-col overflow-hidden
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-codestorm-blue/20">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              🚀 Selecciona tu Stack Tecnológico
            </h2>
            <p className="text-gray-400 text-sm">
              Elige el stack que mejor se adapte a tu proyecto
            </p>
            {userInstruction && (
              <div className="mt-3 p-3 bg-codestorm-blue/10 rounded-lg border border-codestorm-blue/20">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-codestorm-accent">Tu proyecto:</span> {userInstruction}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {!showDetails ? (
            <div className="h-full overflow-y-auto p-6">
              <TechnologyStackCarousel
                onSelectStack={handleStackSelect}
                onShowDetails={handleShowDetails}
                selectedStackId={selectedStack?.id}
                className="h-full"
              />
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-6">
              {/* Stack Details View */}
              {selectedStack && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleCloseDetails}
                      className="flex items-center text-codestorm-accent hover:text-blue-300 transition-colors"
                    >
                      ← Volver a la selección
                    </button>
                  </div>

                  <div className="bg-codestorm-dark rounded-lg p-6">
                    <div className="flex items-start space-x-4 mb-6">
                      <div 
                        className="text-4xl p-3 rounded-lg"
                        style={{ backgroundColor: `${selectedStack.primaryColor}20` }}
                      >
                        {selectedStack.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {selectedStack.name}
                        </h3>
                        <p className="text-gray-300 mb-4">
                          {selectedStack.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                            {selectedStack.popularity} adopción
                          </span>
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                            {selectedStack.difficultyLevel}
                          </span>
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                            {selectedStack.modernityStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Technologies */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Tecnologías Incluidas</h4>
                        <div className="space-y-2">
                          {selectedStack.technologies.map((tech, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-codestorm-darker rounded-lg">
                              <div>
                                <span className="text-white font-medium">{tech.name}</span>
                                <p className="text-sm text-gray-400">{tech.role}</p>
                              </div>
                              {tech.version && (
                                <span className="text-xs text-codestorm-accent bg-codestorm-blue/20 px-2 py-1 rounded">
                                  {tech.version}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Use Cases */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Casos de Uso Ideales</h4>
                        <ul className="space-y-2">
                          {selectedStack.useCases.map((useCase, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-codestorm-accent mr-2 mt-1">•</span>
                              <span className="text-gray-300">{useCase}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Advantages */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Ventajas</h4>
                        <ul className="space-y-2">
                          {selectedStack.advantages.slice(0, 5).map((advantage, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-green-400 mr-2 mt-1">✓</span>
                              <span className="text-gray-300">{advantage}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Performance Metrics */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Métricas de Rendimiento</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Tiempo de carga:</span>
                            <span className="text-white">{selectedStack.performance.loadTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Tiempo de build:</span>
                            <span className="text-white">{selectedStack.performance.buildTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Tamaño del bundle:</span>
                            <span className="text-white">{selectedStack.performance.bundleSize}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Uso de memoria:</span>
                            <span className="text-white">{selectedStack.performance.memoryUsage}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Prerequisites */}
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-white mb-3">Requisitos Previos</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedStack.prerequisites.map((prereq, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm"
                          >
                            {prereq}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Success Cases */}
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-white mb-3">Casos de Éxito</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedStack.successCases.map((successCase, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm"
                          >
                            {successCase}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-codestorm-blue/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">
                {selectedStack ? `Seleccionado: ${selectedStack.name}` : 'Selecciona un stack para continuar'}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={!selectedStack}
                className={`
                  px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
                  ${selectedStack
                    ? 'bg-codestorm-accent text-white hover:bg-blue-600 hover:scale-105'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnologyStackModal;
