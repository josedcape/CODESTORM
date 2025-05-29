import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle,
  ArrowRight,
  Brain,
  Target,
  Zap,
  Settings,
  Info,
  Star,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';
import { StackRecommendation as StackRecommendationType } from '../../services/StackRecommendationService';
import { useUI } from '../../contexts/UIContext';

interface StackRecommendationProps {
  recommendation: StackRecommendationType;
  onAcceptRecommendation: () => void;
  onSelectManually: () => void;
  originalInstruction: string;
  className?: string;
}

const StackRecommendation: React.FC<StackRecommendationProps> = ({
  recommendation,
  onAcceptRecommendation,
  onSelectManually,
  originalInstruction,
  className = ''
}) => {
  const { isMobile, isTablet } = useUI();
  const [showDetails, setShowDetails] = useState(false);

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className={`bg-codestorm-dark rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-codestorm-accent/20 p-3 rounded-full">
            <Brain className="w-8 h-8 text-codestorm-accent" />
          </div>
        </div>
        <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white mb-3`}>
          🧠 Recomendación Inteligente de Stack
        </h2>
        <p className="text-gray-300 text-sm leading-relaxed">
          He analizado tu proyecto y encontré el stack tecnológico más apropiado para tus necesidades.
        </p>
      </div>

      {/* Instrucción analizada */}
      <div className="p-4 mb-6 border rounded-lg bg-codestorm-blue/10 border-codestorm-blue/30">
        <h3 className="text-sm font-semibold text-codestorm-accent mb-2 flex items-center">
          <Target className="w-4 h-4 mr-2" />
          Análisis de tu Proyecto:
        </h3>
        <p className="text-white text-sm leading-relaxed mb-3">
          "{originalInstruction}"
        </p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-gray-400">Tipo:</span>
            <span className="text-white ml-2">{recommendation.projectType}</span>
          </div>
          <div>
            <span className="text-gray-400">Complejidad:</span>
            <span className="text-white ml-2 capitalize">{recommendation.complexity}</span>
          </div>
        </div>
      </div>

      {/* Stack recomendado */}
      <div className="p-6 mb-6 border-2 border-codestorm-accent/30 rounded-lg bg-codestorm-accent/5">
        {/* Header del stack */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-3xl mr-3">{recommendation.stack.icon}</span>
            <div>
              <h3 className="text-xl font-bold text-white">{recommendation.stack.name}</h3>
              <p className="text-sm text-gray-300">{recommendation.stack.shortDescription}</p>
            </div>
          </div>
          
          {/* Score y confianza */}
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(recommendation.score)}`}>
              {Math.round(recommendation.score)}%
            </div>
            <div className={`px-2 py-1 rounded text-xs border ${getConfidenceColor(recommendation.confidence)}`}>
              {recommendation.confidence === 'high' ? 'Alta confianza' :
               recommendation.confidence === 'medium' ? 'Confianza media' : 'Baja confianza'}
            </div>
          </div>
        </div>

        {/* Características principales */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-2 text-yellow-400" />
            <span className="text-sm text-gray-300">
              Dificultad: <span className="text-white">{recommendation.stack.difficultyLevel}</span>
            </span>
          </div>
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
            <span className="text-sm text-gray-300">
              Popularidad: <span className="text-white">{recommendation.stack.popularity}</span>
            </span>
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2 text-blue-400" />
            <span className="text-sm text-gray-300">
              Comunidad: <span className="text-white">{recommendation.stack.communitySupport}</span>
            </span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-purple-400" />
            <span className="text-sm text-gray-300">
              Curva: <span className="text-white">{recommendation.stack.learningCurve}</span>
            </span>
          </div>
        </div>

        {/* Tecnologías principales */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-white mb-2">Tecnologías principales:</h4>
          <div className="flex flex-wrap gap-2">
            {recommendation.stack.technologies.slice(0, 4).map((tech, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-codestorm-blue/20 text-blue-300 rounded-full text-xs border border-codestorm-blue/30"
              >
                {tech.name}
              </span>
            ))}
            {recommendation.stack.technologies.length > 4 && (
              <span className="px-3 py-1 bg-gray-600/20 text-gray-400 rounded-full text-xs">
                +{recommendation.stack.technologies.length - 4} más
              </span>
            )}
          </div>
        </div>

        {/* Razones de la recomendación */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-codestorm-accent" />
            ¿Por qué este stack?
          </h4>
          <div className="space-y-2">
            {recommendation.reasons.slice(0, 3).map((reason, index) => (
              <div key={index} className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-300">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Palabras clave coincidentes */}
        {recommendation.matchedKeywords.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-white mb-2">Coincidencias detectadas:</h4>
            <div className="flex flex-wrap gap-1">
              {recommendation.matchedKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs border border-green-500/30"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Botón para ver más detalles */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full p-2 text-sm text-codestorm-accent hover:bg-codestorm-accent/10 rounded transition-colors flex items-center justify-center"
        >
          <Info className="w-4 h-4 mr-2" />
          {showDetails ? 'Ocultar detalles' : 'Ver más detalles del stack'}
        </button>

        {/* Detalles expandidos */}
        {showDetails && (
          <div className="mt-4 p-4 bg-codestorm-darker rounded-lg">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <h5 className="text-sm font-semibold text-white mb-2">Casos de uso ideales:</h5>
                <div className="flex flex-wrap gap-1">
                  {recommendation.stack.useCases.map((useCase, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs"
                    >
                      {useCase}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-semibold text-white mb-2">Ventajas principales:</h5>
                <ul className="space-y-1">
                  {recommendation.stack.advantages.slice(0, 3).map((advantage, index) => (
                    <li key={index} className="text-sm text-gray-300 flex items-start">
                      <span className="text-green-400 mr-2">•</span>
                      {advantage}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Opciones de acción */}
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
        {/* Aceptar recomendación */}
        <button
          onClick={onAcceptRecommendation}
          className="group p-4 bg-codestorm-accent hover:bg-codestorm-accent/80 rounded-lg transition-all duration-300 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-3 text-white" />
              <div>
                <div className="font-semibold text-white">Usar Recomendación</div>
                <div className="text-xs text-white/80">Comenzar con {recommendation.stack.name}</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Selección manual */}
        <button
          onClick={onSelectManually}
          className="group p-4 bg-codestorm-darker border border-gray-600/30 hover:border-gray-500 hover:bg-gray-600/5 rounded-lg transition-all duration-300 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="w-5 h-5 mr-3 text-gray-400" />
              <div>
                <div className="font-semibold text-white">Elegir Manualmente</div>
                <div className="text-xs text-gray-400">Ver todos los stacks disponibles</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Nota informativa */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start">
          <Info className="w-4 h-4 mr-2 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-blue-200 leading-relaxed">
              Esta recomendación se basa en el análisis inteligente de tu proyecto. 
              Puedes cambiar de stack en cualquier momento durante el desarrollo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StackRecommendation;
