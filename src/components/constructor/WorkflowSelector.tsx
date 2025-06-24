import React from 'react';
import {
  Zap,
  Code,
  ArrowRight,
  Sparkles,
  Settings,
  Layers,
  Target,
  Rocket
} from 'lucide-react';
import { useUI } from '../../contexts/UIContext';

interface WorkflowSelectorProps {
  onSelectStackWorkflow: () => void;
  onSelectGenericWorkflow: () => void;
  originalInstruction: string;
  className?: string;
}

const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({
  onSelectStackWorkflow,
  onSelectGenericWorkflow,
  originalInstruction,
  className = ''
}) => {
  const { isMobile, isTablet } = useUI();

  return (
    <div className={`bg-codestorm-dark rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-codestorm-accent/20 p-3 rounded-full">
            <Target className="w-8 h-8 text-codestorm-accent" />
          </div>
        </div>
        <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white mb-3`}>
          🎯 Elige tu Flujo de Desarrollo
        </h2>
        <p className="text-gray-300 text-sm leading-relaxed">
          Para optimizar tu experiencia de desarrollo, puedes elegir entre dos enfoques diferentes:
        </p>
      </div>

      {/* Instrucción recibida */}
      <div className="p-4 mb-6 border rounded-lg bg-codestorm-blue/10 border-codestorm-blue/30">
        <h3 className="text-sm font-semibold text-codestorm-accent mb-2">
          📝 Tu Instrucción:
        </h3>
        <p className="text-white text-sm leading-relaxed">
          "{originalInstruction}"
        </p>
      </div>

      {/* Opciones de flujo */}
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-6'}`}>
        
        {/* Opción 1: Con Stack Tecnológico */}
        <div className="group">
          <button
            onClick={onSelectStackWorkflow}
            className="w-full p-6 bg-codestorm-darker border-2 border-codestorm-blue/30 rounded-lg hover:border-codestorm-accent hover:bg-codestorm-accent/5 transition-all duration-300 text-left group-hover:scale-105"
          >
            {/* Header de la opción */}
            <div className="flex items-center mb-4">
              <div className="bg-codestorm-accent/20 p-2 rounded-lg mr-3">
                <Rocket className="w-6 h-6 text-codestorm-accent" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Stack Tecnológico Específico
                </h3>
                <p className="text-xs text-codestorm-accent">
                  Recomendado para mejores resultados
                </p>
              </div>
            </div>

            {/* Descripción */}
            <p className="text-gray-300 text-sm mb-4 leading-relaxed">
              Selecciona un stack tecnológico optimizado para tu proyecto. Obtendrás código específico, 
              archivos de configuración automáticos y mejores prácticas.
            </p>

            {/* Características */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-xs text-gray-400">
                <Sparkles className="w-3 h-3 mr-2 text-green-400" />
                <span>Código optimizado para tecnologías específicas</span>
              </div>
              <div className="flex items-center text-xs text-gray-400">
                <Settings className="w-3 h-3 mr-2 text-green-400" />
                <span>Archivos de configuración automáticos</span>
              </div>
              <div className="flex items-center text-xs text-gray-400">
                <Layers className="w-3 h-3 mr-2 text-green-400" />
                <span>Estructura de proyecto profesional</span>
              </div>
              <div className="flex items-center text-xs text-gray-400">
                <Target className="w-3 h-3 mr-2 text-green-400" />
                <span>Mejores prácticas del stack seleccionado</span>
              </div>
            </div>

            {/* Stacks disponibles preview */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Stacks disponibles:</p>
              <div className="flex flex-wrap gap-1">
                {['MERN', 'MEAN', 'Django', 'Rails', 'Flutter', 'React Native', 'SvelteKit', 'Qwik'].map((stack) => (
                  <span
                    key={stack}
                    className="px-2 py-1 bg-codestorm-blue/20 text-blue-300 rounded text-xs"
                  >
                    {stack}
                  </span>
                ))}
              </div>
            </div>

            {/* Call to action */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                Seleccionar Stack
              </span>
              <ArrowRight className="w-4 h-4 text-codestorm-accent group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Opción 2: Configuración Genérica */}
        <div className="group">
          <button
            onClick={onSelectGenericWorkflow}
            className="w-full p-6 bg-codestorm-darker border-2 border-gray-600/30 rounded-lg hover:border-gray-500 hover:bg-gray-600/5 transition-all duration-300 text-left group-hover:scale-105"
          >
            {/* Header de la opción */}
            <div className="flex items-center mb-4">
              <div className="bg-gray-500/20 p-2 rounded-lg mr-3">
                <Code className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Configuración Genérica
                </h3>
                <p className="text-xs text-gray-400">
                  Desarrollo flexible y adaptable
                </p>
              </div>
            </div>

            {/* Descripción */}
            <p className="text-gray-300 text-sm mb-4 leading-relaxed">
              Continúa con desarrollo genérico. Puedes mencionar tecnologías específicas 
              durante la conversación según tus necesidades.
            </p>

            {/* Características */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-xs text-gray-400">
                <Zap className="w-3 h-3 mr-2 text-yellow-400" />
                <span>Inicio rápido sin configuraciones previas</span>
              </div>
              <div className="flex items-center text-xs text-gray-400">
                <Settings className="w-3 h-3 mr-2 text-yellow-400" />
                <span>Flexibilidad total en tecnologías</span>
              </div>
              <div className="flex items-center text-xs text-gray-400">
                <Code className="w-3 h-3 mr-2 text-yellow-400" />
                <span>Adaptación durante el desarrollo</span>
              </div>
              <div className="flex items-center text-xs text-gray-400">
                <Sparkles className="w-3 h-3 mr-2 text-yellow-400" />
                <span>Ideal para proyectos experimentales</span>
              </div>
            </div>

            {/* Casos de uso */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Ideal para:</p>
              <div className="flex flex-wrap gap-1">
                {['Prototipos', 'Experimentación', 'Proyectos mixtos', 'Aprendizaje'].map((useCase) => (
                  <span
                    key={useCase}
                    className="px-2 py-1 bg-gray-600/20 text-gray-400 rounded text-xs"
                  >
                    {useCase}
                  </span>
                ))}
              </div>
            </div>

            {/* Call to action */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                Continuar sin Stack
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start">
          <div className="bg-blue-500/20 p-1 rounded mr-3 mt-0.5">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-300 mb-1">
              💡 ¿No estás seguro?
            </h4>
            <p className="text-xs text-blue-200 leading-relaxed">
              Puedes cambiar tu elección en cualquier momento usando el botón "Cambiar Stack" 
              en la interfaz principal. Tu progreso se mantendrá intacto.
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div className="p-3 bg-codestorm-accent/10 rounded-lg">
          <div className="text-lg font-bold text-codestorm-accent">85%</div>
          <div className="text-xs text-gray-400">Usuarios prefieren Stack Específico</div>
        </div>
        <div className="p-3 bg-gray-500/10 rounded-lg">
          <div className="text-lg font-bold text-gray-400">15%</div>
          <div className="text-xs text-gray-400">Usuarios prefieren Genérico</div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowSelector;
