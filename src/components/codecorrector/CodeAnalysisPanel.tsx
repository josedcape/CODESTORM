import React, { useState } from 'react';
import { CodeError, CodeErrorType, CodeErrorSeverity } from '../../types';
import { AlertCircle, AlertTriangle, Info, Check, ChevronDown, ChevronUp, Code, Clock } from 'lucide-react';

interface CodeAnalysisPanelProps {
  errors: CodeError[];
  onSelectError: (error: CodeError) => void;
  executionTime?: number;
}

const CodeAnalysisPanel: React.FC<CodeAnalysisPanelProps> = ({
  errors,
  onSelectError,
  executionTime
}) => {
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<CodeErrorType | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<CodeErrorSeverity | 'all'>('all');

  // Contar errores por tipo y severidad
  const errorCounts = {
    byType: {
      syntax: errors.filter(e => e.type === 'syntax').length,
      logic: errors.filter(e => e.type === 'logic').length,
      security: errors.filter(e => e.type === 'security').length,
      performance: errors.filter(e => e.type === 'performance').length,
      style: errors.filter(e => e.type === 'style').length,
      bestPractice: errors.filter(e => e.type === 'bestPractice').length
    },
    bySeverity: {
      critical: errors.filter(e => e.severity === 'critical').length,
      high: errors.filter(e => e.severity === 'high').length,
      medium: errors.filter(e => e.severity === 'medium').length,
      low: errors.filter(e => e.severity === 'low').length,
      info: errors.filter(e => e.severity === 'info').length
    }
  };

  // Filtrar errores según los filtros seleccionados
  const filteredErrors = errors.filter(error => {
    const typeMatch = filterType === 'all' || error.type === filterType;
    const severityMatch = filterSeverity === 'all' || error.severity === filterSeverity;
    return typeMatch && severityMatch;
  });

  // Función para obtener el icono según la severidad
  const getSeverityIcon = (severity: CodeErrorSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-gray-400" />;
    }
  };

  // Función para obtener el color según la severidad
  const getSeverityColor = (severity: CodeErrorSeverity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500 border-red-500 bg-red-500/10';
      case 'high':
        return 'text-orange-500 border-orange-500 bg-orange-500/10';
      case 'medium':
        return 'text-yellow-500 border-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'text-blue-500 border-blue-500 bg-blue-500/10';
      case 'info':
        return 'text-gray-400 border-gray-400 bg-gray-400/10';
    }
  };

  // Función para obtener el nombre legible del tipo de error
  const getErrorTypeName = (type: CodeErrorType) => {
    switch (type) {
      case 'syntax':
        return 'Sintaxis';
      case 'logic':
        return 'Lógica';
      case 'security':
        return 'Seguridad';
      case 'performance':
        return 'Rendimiento';
      case 'style':
        return 'Estilo';
      case 'bestPractice':
        return 'Mejores Prácticas';
    }
  };

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md h-full flex flex-col border border-codestorm-blue/30 overflow-hidden">
      <div className="bg-codestorm-blue/20 p-3 border-b border-codestorm-blue/30">
        <h3 className="text-white font-medium flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 text-codestorm-gold" />
          Análisis de Código
          {executionTime && (
            <span className="ml-auto text-xs text-gray-400 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {(executionTime / 1000).toFixed(2)}s
            </span>
          )}
        </h3>
      </div>

      {/* Resumen de errores */}
      <div className="p-3 border-b border-codestorm-blue/30 bg-codestorm-darker">
        <div className="flex flex-wrap gap-2 mb-2">
          <div className="text-xs font-medium bg-codestorm-blue/20 text-white px-2 py-1 rounded-md">
            Total: {errors.length}
          </div>
          {Object.entries(errorCounts.bySeverity).map(([severity, count]) => {
            if (count === 0) return null;
            return (
              <div 
                key={severity}
                className={`text-xs font-medium px-2 py-1 rounded-md ${getSeverityColor(severity as CodeErrorSeverity)}`}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1)}: {count}
              </div>
            );
          })}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mt-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as CodeErrorType | 'all')}
            className="text-xs bg-codestorm-darker border border-codestorm-blue/30 rounded-md px-2 py-1 text-white"
          >
            <option value="all">Todos los tipos</option>
            {Object.entries(errorCounts.byType).map(([type, count]) => (
              <option key={type} value={type}>
                {getErrorTypeName(type as CodeErrorType)} ({count})
              </option>
            ))}
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as CodeErrorSeverity | 'all')}
            className="text-xs bg-codestorm-darker border border-codestorm-blue/30 rounded-md px-2 py-1 text-white"
          >
            <option value="all">Todas las severidades</option>
            {Object.entries(errorCounts.bySeverity).map(([severity, count]) => (
              <option key={severity} value={severity}>
                {severity.charAt(0).toUpperCase() + severity.slice(1)} ({count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de errores */}
      <div className="flex-1 overflow-auto">
        {filteredErrors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-gray-400">
            <Check className="h-12 w-12 mb-2 text-green-500" />
            <p className="text-center">
              {errors.length === 0 
                ? "No se encontraron problemas en el código" 
                : "No hay errores que coincidan con los filtros seleccionados"}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-codestorm-blue/30">
            {filteredErrors.map((error) => (
              <li key={error.id} className="p-3 hover:bg-codestorm-blue/10">
                <div 
                  className="flex items-start cursor-pointer"
                  onClick={() => {
                    setExpandedErrorId(expandedErrorId === error.id ? null : error.id);
                    onSelectError(error);
                  }}
                >
                  <div className="mr-3 mt-1">
                    {getSeverityIcon(error.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-white">{error.message}</h4>
                      <button className="text-gray-400 hover:text-white">
                        {expandedErrorId === error.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <span className={`mr-2 px-1.5 py-0.5 rounded ${getSeverityColor(error.severity)}`}>
                        {error.severity}
                      </span>
                      <span className="mr-2 px-1.5 py-0.5 rounded bg-codestorm-blue/20 text-blue-300">
                        {getErrorTypeName(error.type)}
                      </span>
                      <span className="flex items-center">
                        <Code className="h-3 w-3 mr-1" />
                        Línea {error.lineStart}{error.lineStart !== error.lineEnd ? `-${error.lineEnd}` : ''}
                      </span>
                    </div>
                    
                    {expandedErrorId === error.id && (
                      <div className="mt-2 text-sm text-gray-300">
                        <p className="mb-2">{error.description}</p>
                        {error.suggestion && (
                          <div className="mt-2">
                            <h5 className="text-xs font-medium text-codestorm-gold mb-1">Sugerencia:</h5>
                            <pre className="text-xs bg-codestorm-darker p-2 rounded-md overflow-x-auto">
                              {error.suggestion}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CodeAnalysisPanel;
