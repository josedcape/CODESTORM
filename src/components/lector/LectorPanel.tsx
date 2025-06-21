import React, { useState, useEffect } from 'react';
import { 
  FileItem, 
  FileAnalysis, 
  FileChangeAnalysis, 
  FileSection, 
  FileChangeImpact,
  FileAnalysisLevel
} from '../../types';
import { 
  FileText, 
  AlertTriangle, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp,
  Eye,
  Code,
  Info,
  AlertCircle,
  Zap
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface LectorPanelProps {
  file: FileItem;
  fileAnalysis: FileAnalysis | null;
  changeAnalysis: FileChangeAnalysis | null;
  onApproveChanges: () => void;
  onRejectChanges: () => void;
  isVisible: boolean;
  onClose: () => void;
}

const LectorPanel: React.FC<LectorPanelProps> = ({
  file,
  fileAnalysis,
  changeAnalysis,
  onApproveChanges,
  onRejectChanges,
  isVisible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'comparison'>('analysis');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedImpacts, setExpandedImpacts] = useState<string[]>([]);
  
  // Restablecer el estado cuando cambia el archivo
  useEffect(() => {
    setActiveTab('analysis');
    setExpandedSections([]);
    setExpandedImpacts([]);
  }, [file.id]);
  
  if (!isVisible) return null;
  
  // Función para alternar la expansión de una sección
  const toggleSection = (sectionId: string) => {
    if (expandedSections.includes(sectionId)) {
      setExpandedSections(expandedSections.filter(id => id !== sectionId));
    } else {
      setExpandedSections([...expandedSections, sectionId]);
    }
  };
  
  // Función para alternar la expansión de un impacto
  const toggleImpact = (impactId: string) => {
    if (expandedImpacts.includes(impactId)) {
      setExpandedImpacts(expandedImpacts.filter(id => id !== impactId));
    } else {
      setExpandedImpacts([...expandedImpacts, impactId]);
    }
  };
  
  // Función para obtener el color según el nivel de impacto
  const getImpactColor = (level: FileAnalysisLevel): string => {
    switch (level) {
      case 'critical':
        return 'text-red-500';
      case 'important':
        return 'text-yellow-500';
      case 'normal':
        return 'text-blue-500';
      case 'info':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };
  
  // Función para obtener el icono según el nivel de impacto
  const getImpactIcon = (level: FileAnalysisLevel) => {
    switch (level) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'important':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'normal':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-gray-400" />;
      default:
        return <Info className="h-5 w-5 text-gray-400" />;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-codestorm-dark rounded-lg shadow-xl border border-codestorm-blue/30 w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-4 border-b border-codestorm-blue/30">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-blue-400 mr-2" />
            <h2 className="text-white font-medium">
              Análisis de Archivo: <span className="text-blue-400">{file.path}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-codestorm-blue/20 text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Pestañas */}
        <div className="flex border-b border-codestorm-blue/30">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'analysis'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Análisis del Archivo
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'comparison'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            } ${!changeAnalysis ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!changeAnalysis}
          >
            Comparación de Cambios
          </button>
        </div>
        
        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'analysis' ? (
            // Pestaña de análisis
            fileAnalysis ? (
              <div className="space-y-4">
                {/* Información general */}
                <div className="bg-codestorm-darker rounded-lg p-4 border border-codestorm-blue/30">
                  <h3 className="text-white font-medium mb-2">Información General</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">
                        <span className="text-gray-300">Tipo:</span> {fileAnalysis.language.toUpperCase()}
                      </p>
                      <p className="text-gray-400 text-sm">
                        <span className="text-gray-300">Propósito:</span> {fileAnalysis.purpose}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">
                        <span className="text-gray-300">Descripción:</span> {fileAnalysis.description}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Áreas críticas */}
                {fileAnalysis.criticalAreas.length > 0 && (
                  <div className="bg-codestorm-darker rounded-lg p-4 border border-codestorm-blue/30">
                    <h3 className="text-white font-medium mb-2">Áreas Críticas</h3>
                    <div className="space-y-2">
                      {fileAnalysis.criticalAreas.map((area, index) => (
                        <div key={index} className="bg-red-500/10 rounded-md p-3 border border-red-500/30">
                          <div className="flex items-start">
                            <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-white text-sm font-medium">{area.description}</p>
                              <p className="text-gray-400 text-xs mt-1">
                                Secciones afectadas: {area.sections.length}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Secciones del archivo */}
                <div className="bg-codestorm-darker rounded-lg p-4 border border-codestorm-blue/30">
                  <h3 className="text-white font-medium mb-2">Secciones del Archivo</h3>
                  <div className="space-y-2">
                    {fileAnalysis.sections.map((section) => (
                      <div 
                        key={section.id} 
                        className={`rounded-md border ${
                          section.isCritical 
                            ? 'border-red-500/30 bg-red-500/5' 
                            : 'border-codestorm-blue/30 bg-codestorm-blue/5'
                        }`}
                      >
                        <div 
                          className="flex items-center justify-between p-3 cursor-pointer"
                          onClick={() => toggleSection(section.id)}
                        >
                          <div className="flex items-center">
                            {section.isCritical ? (
                              <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                            ) : (
                              <Code className="h-4 w-4 text-blue-400 mr-2" />
                            )}
                            <div>
                              <p className="text-white text-sm">{section.description}</p>
                              <p className="text-gray-400 text-xs">
                                Líneas {section.startLine}-{section.endLine}
                              </p>
                            </div>
                          </div>
                          {expandedSections.includes(section.id) ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        
                        {expandedSections.includes(section.id) && (
                          <div className="p-3 border-t border-codestorm-blue/30">
                            <SyntaxHighlighter
                              language={fileAnalysis.language}
                              style={vscDarkPlus}
                              customStyle={{
                                margin: 0,
                                padding: '0.75rem',
                                background: '#0a1120',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem'
                              }}
                              showLineNumbers
                              startingLineNumber={section.startLine}
                            >
                              {section.content}
                            </SyntaxHighlighter>
                            
                            {section.dependencies.length > 0 && (
                              <div className="mt-3">
                                <p className="text-gray-300 text-xs font-medium mb-2">Dependencias:</p>
                                <ul className="space-y-1">
                                  {section.dependencies.map((dep, index) => (
                                    <li key={index} className="text-gray-400 text-xs flex items-center">
                                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                        dep.isRequired ? 'bg-red-500' : 'bg-yellow-500'
                                      }`}></span>
                                      {dep.description}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Eye className="h-12 w-12 mb-4 opacity-30" />
                <p>Analizando archivo...</p>
              </div>
            )
          ) : (
            // Pestaña de comparación
            changeAnalysis ? (
              <div className="space-y-4">
                {/* Resumen de cambios */}
                <div className="bg-codestorm-darker rounded-lg p-4 border border-codestorm-blue/30">
                  <h3 className="text-white font-medium mb-2">Resumen de Cambios</h3>
                  <p className="text-gray-300 text-sm">{changeAnalysis.summary}</p>
                  
                  <div className="mt-3 p-3 bg-blue-500/10 rounded-md border border-blue-500/30">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                      <p className="text-blue-300 text-sm">{changeAnalysis.recommendation}</p>
                    </div>
                  </div>
                </div>
                
                {/* Impactos */}
                {changeAnalysis.impacts.length > 0 && (
                  <div className="bg-codestorm-darker rounded-lg p-4 border border-codestorm-blue/30">
                    <h3 className="text-white font-medium mb-2">Impactos Identificados</h3>
                    <div className="space-y-2">
                      {changeAnalysis.impacts.map((impact) => (
                        <div 
                          key={impact.id} 
                          className={`rounded-md border ${
                            impact.level === 'critical' 
                              ? 'border-red-500/30 bg-red-500/5' 
                              : impact.level === 'important'
                                ? 'border-yellow-500/30 bg-yellow-500/5'
                                : 'border-blue-500/30 bg-blue-500/5'
                          }`}
                        >
                          <div 
                            className="flex items-center justify-between p-3 cursor-pointer"
                            onClick={() => toggleImpact(impact.id)}
                          >
                            <div className="flex items-center">
                              {getImpactIcon(impact.level)}
                              <div className="ml-2">
                                <p className={`text-sm font-medium ${getImpactColor(impact.level)}`}>
                                  {impact.description}
                                </p>
                              </div>
                            </div>
                            {expandedImpacts.includes(impact.id) ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          
                          {expandedImpacts.includes(impact.id) && (
                            <div className="p-3 border-t border-codestorm-blue/30">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-gray-300 text-xs font-medium mb-1">Funcionalidad afectada:</p>
                                  <p className="text-gray-400 text-xs">{impact.affectedFunctionality}</p>
                                </div>
                                <div>
                                  <p className="text-gray-300 text-xs font-medium mb-1">Archivos afectados:</p>
                                  <ul className="space-y-1">
                                    {impact.affectedFiles.map((file, index) => (
                                      <li key={index} className="text-gray-400 text-xs">{file}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                              <div className="mt-3">
                                <p className="text-gray-300 text-xs font-medium mb-1">Recomendación:</p>
                                <p className="text-gray-400 text-xs">{impact.recommendation}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Comparación de código */}
                <div className="bg-codestorm-darker rounded-lg p-4 border border-codestorm-blue/30">
                  <h3 className="text-white font-medium mb-2">Comparación de Código</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-300 text-xs font-medium mb-2">Código Original:</p>
                      <SyntaxHighlighter
                        language={file.language}
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0,
                          padding: '0.75rem',
                          background: '#0a1120',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          maxHeight: '400px'
                        }}
                        showLineNumbers
                      >
                        {file.content}
                      </SyntaxHighlighter>
                    </div>
                    <div>
                      <p className="text-gray-300 text-xs font-medium mb-2">Cambios Propuestos:</p>
                      <SyntaxHighlighter
                        language={file.language}
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0,
                          padding: '0.75rem',
                          background: '#0a1120',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          maxHeight: '400px'
                        }}
                        showLineNumbers
                      >
                        {changeAnalysis.proposedChanges}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Zap className="h-12 w-12 mb-4 opacity-30" />
                <p>No hay cambios propuestos para analizar</p>
              </div>
            )
          )}
        </div>
        
        {/* Pie */}
        <div className="p-4 border-t border-codestorm-blue/30 flex justify-between">
          <div className="text-gray-400 text-sm">
            {fileAnalysis && (
              <span>Analizado el {new Date(fileAnalysis.timestamp).toLocaleString()}</span>
            )}
          </div>
          
          {changeAnalysis && activeTab === 'comparison' && (
            <div className="flex space-x-3">
              <button
                onClick={onRejectChanges}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm flex items-center transition-colors"
              >
                <X className="h-4 w-4 mr-1.5" />
                <span>Rechazar Cambios</span>
              </button>
              <button
                onClick={onApproveChanges}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm flex items-center transition-colors"
              >
                <Check className="h-4 w-4 mr-1.5" />
                <span>Aprobar Cambios</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LectorPanel;
