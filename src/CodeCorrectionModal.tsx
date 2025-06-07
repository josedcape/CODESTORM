import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Brain,
  Search,
  Wrench,
  Zap,
  Save,
  Download,
  FileText,
  MessageSquare,
  Settings,
  Activity,
  BarChart3,
  Code,
  Maximize2,
  Minimize2,
  Menu
} from 'lucide-react';
import { ProjectStructure } from '../../pages/Agent';
import MultiAgentCodeCorrector, { 
  MultiAgentAnalysisResult, 
  CorrectionOptions as MultiAgentOptions 
} from '../../services/codeAnalysis/MultiAgentCodeCorrector';
import MultiAgentPanel from '../codecorrector/MultiAgentPanel';
import CodeDiffViewer from '../codecorrector/CodeDiffViewer';
import RealTimeAnalyzer from '../codecorrector/RealTimeAnalyzer';
import CodeEditorPanel from '../codecorrector/CodeEditorPanel';
import LanguageSelector from '../codecorrector/LanguageSelector';
import LoadingSpinner from '../LoadingSpinner';

interface CodeCorrectionModalProps {
  isOpen: boolean;
  file: ProjectStructure;
  onClose: () => void;
  onSave: (filePath: string, content: string) => void;
  onFileUpdate?: (file: ProjectStructure) => void;
}

const CodeCorrectionModal: React.FC<CodeCorrectionModalProps> = ({
  isOpen,
  file,
  onClose,
  onSave,
  onFileUpdate
}) => {
  // Estado principal
  const [originalCode, setOriginalCode] = useState(file.content || '');
  const [correctedCode, setCorrectedCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(file.language || 'javascript');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Estado del sistema multi-agente
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<MultiAgentAnalysisResult | null>(null);
  
  // Estado de la interfaz
  const [activePanel, setActivePanel] = useState<'analysis' | 'diff' | 'realtime' | 'instructions'>('instructions');
  const [realTimeAnalysisEnabled, setRealTimeAnalysisEnabled] = useState(true);
  const [naturalLanguageInstruction, setNaturalLanguageInstruction] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);

  // Opciones de corrección
  const [correctionOptions, setCorrectionOptions] = useState<MultiAgentOptions>({
    analyzeSecurity: true,
    analyzePerformance: true,
    generateTests: false,
    explainChanges: true,
    autoFix: false,
    preserveFormatting: true
  });

  // Detectar lenguaje automáticamente basado en la extensión del archivo
  useEffect(() => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'cpp',
      'cs': 'csharp'
    };
    
    if (extension && languageMap[extension]) {
      setSelectedLanguage(languageMap[extension]);
    }
  }, [file.name]);

  // Callback para el progreso del análisis multi-agente
  const handleProgress = useCallback((stage: string, progressValue: number, message: string, agentName?: string) => {
    setProgress(progressValue);
    setProgressMessage(message);
    if (agentName) {
      setCurrentAgent(agentName);
    }
  }, []);

  // Procesar instrucciones en lenguaje natural
  const processNaturalLanguageInstruction = (instruction: string) => {
    const lowerInstruction = instruction.toLowerCase();
    const newOptions = { ...correctionOptions };

    // Detectar intenciones específicas
    if (lowerInstruction.includes('optimiza') || lowerInstruction.includes('rendimiento')) {
      newOptions.analyzePerformance = true;
      newOptions.autoFix = true;
    }
    
    if (lowerInstruction.includes('seguridad') || lowerInstruction.includes('vulnerabilidad')) {
      newOptions.analyzeSecurity = true;
      newOptions.autoFix = true;
    }
    
    if (lowerInstruction.includes('test') || lowerInstruction.includes('prueba')) {
      newOptions.generateTests = true;
    }
    
    if (lowerInstruction.includes('comentario') || lowerInstruction.includes('documentación')) {
      newOptions.explainChanges = true;
    }
    
    if (lowerInstruction.includes('corrige todo') || lowerInstruction.includes('arregla todo')) {
      newOptions.autoFix = true;
      newOptions.analyzeSecurity = true;
      newOptions.analyzePerformance = true;
    }

    setCorrectionOptions(newOptions);
  };

  // Función principal de análisis multi-agente
  const analyzeCodeWithMultiAgent = async () => {
    if (!originalCode.trim() || isProcessing) return;

    // Procesar instrucción en lenguaje natural si existe
    if (naturalLanguageInstruction.trim()) {
      processNaturalLanguageInstruction(naturalLanguageInstruction);
    }

    // Validar entrada
    const validation = MultiAgentCodeCorrector.validateInput(originalCode);
    if (!validation.isValid) {
      alert(`Error en el código: ${validation.errors.join(', ')}`);
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProgressMessage('Iniciando análisis multi-agente...');
    setAnalysisResult(null);
    setCorrectedCode('');

    try {
      const result = await MultiAgentCodeCorrector.analyzeCode(
        originalCode,
        selectedLanguage,
        correctionOptions,
        handleProgress
      );

      setAnalysisResult(result);
      setCorrectedCode(result.codeGeneration.correctedCode);
      setHasUnsavedChanges(true);
      
      // Cambiar automáticamente al panel de análisis
      setActivePanel('analysis');

    } catch (error) {
      console.error('Error en análisis multi-agente:', error);
      alert(`Error durante el análisis: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsProcessing(false);
      setCurrentAgent('');
      setProgress(100);
    }
  };

  // Aplicar cambios al archivo
  const handleApplyChanges = () => {
    if (correctedCode) {
      setOriginalCode(correctedCode);
      onSave(file.path, correctedCode);
      setHasUnsavedChanges(false);
      
      // Actualizar el archivo en el contexto padre si es posible
      if (onFileUpdate) {
        onFileUpdate({
          ...file,
          content: correctedCode,
          lastModified: Date.now()
        });
      }
    }
  };

  // Exportar código corregido
  const exportCorrectedCode = () => {
    if (!correctedCode) return;
    
    const blob = new Blob([correctedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corrected_${file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generar reporte completo
  const generateReport = () => {
    if (!analysisResult) return;
    
    const report = MultiAgentCodeCorrector.generateComprehensiveReport(analysisResult);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_report_${file.name.replace(/\.[^/.]+$/, '')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Manejar cierre del modal
  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-2 sm:p-4">
      <div className={`bg-codestorm-dark rounded-lg shadow-xl border border-codestorm-blue/30 ${
        isFullscreen
          ? 'w-full h-full'
          : 'w-full max-w-[95vw] xl:max-w-7xl h-[95vh] max-h-[900px]'
      } flex flex-col overflow-hidden`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-codestorm-blue/30 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-codestorm-accent flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-white truncate">
                Corrector Multi-Agente
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 truncate">{file.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {hasUnsavedChanges && (
              <span className="hidden sm:inline text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                Cambios sin guardar
              </span>
            )}

            {/* Botón para mostrar/ocultar panel izquierdo en pantallas pequeñas */}
            <button
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              className="lg:hidden p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded transition-colors"
              title={showLeftPanel ? 'Ocultar panel' : 'Mostrar panel'}
            >
              <Menu className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded transition-colors"
              title={isFullscreen ? 'Ventana' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handleClose}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* Overlay para cerrar panel en móvil */}
          {showLeftPanel && (
            <div
              className="lg:hidden fixed inset-0 bg-black/30 z-[5]"
              onClick={() => setShowLeftPanel(false)}
            />
          )}

          {/* Panel izquierdo - Configuración e instrucciones */}
          {showLeftPanel && (
            <div className="w-72 sm:w-80 lg:w-80 border-r border-codestorm-blue/30 flex flex-col flex-shrink-0 lg:relative absolute lg:static bg-codestorm-dark z-10 h-full lg:h-auto">
            {/* Pestañas de configuración */}
            <div className="flex border-b border-codestorm-blue/30 flex-shrink-0">
              <button
                onClick={() => setActivePanel('instructions')}
                className={`flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  activePanel === 'instructions'
                    ? 'bg-codestorm-blue/20 text-white border-b-2 border-codestorm-accent'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Instrucciones</span>
                <span className="sm:hidden">Config</span>
              </button>
              <button
                onClick={() => setActivePanel('realtime')}
                className={`flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  activePanel === 'realtime'
                    ? 'bg-codestorm-blue/20 text-white border-b-2 border-codestorm-accent'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Tiempo Real</span>
                <span className="sm:hidden">Live</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
              {activePanel === 'instructions' && (
                <div className="space-y-4">
                  {/* Instrucciones en lenguaje natural */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Instrucciones en Español
                    </label>
                    <textarea
                      value={naturalLanguageInstruction}
                      onChange={(e) => setNaturalLanguageInstruction(e.target.value)}
                      placeholder="Ej: Optimiza este código para mejor rendimiento y corrige todos los errores de sintaxis"
                      className="w-full h-20 sm:h-24 px-3 py-2 bg-codestorm-darker border border-codestorm-blue/30 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:border-codestorm-accent resize-none"
                    />
                  </div>

                  {/* Selector de lenguaje */}
                  <LanguageSelector
                    selectedLanguage={selectedLanguage}
                    onSelectLanguage={setSelectedLanguage}
                  />

                  {/* Opciones de corrección */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-white">Opciones de Análisis</h3>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={correctionOptions.analyzeSecurity}
                        onChange={(e) => setCorrectionOptions(prev => ({
                          ...prev,
                          analyzeSecurity: e.target.checked
                        }))}
                        className="rounded border-codestorm-blue/30 bg-codestorm-darker text-codestorm-accent focus:ring-codestorm-accent"
                      />
                      <span className="text-sm text-gray-300">Analizar seguridad</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={correctionOptions.analyzePerformance}
                        onChange={(e) => setCorrectionOptions(prev => ({
                          ...prev,
                          analyzePerformance: e.target.checked
                        }))}
                        className="rounded border-codestorm-blue/30 bg-codestorm-darker text-codestorm-accent focus:ring-codestorm-accent"
                      />
                      <span className="text-sm text-gray-300">Optimizar rendimiento</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={correctionOptions.generateTests}
                        onChange={(e) => setCorrectionOptions(prev => ({
                          ...prev,
                          generateTests: e.target.checked
                        }))}
                        className="rounded border-codestorm-blue/30 bg-codestorm-darker text-codestorm-accent focus:ring-codestorm-accent"
                      />
                      <span className="text-sm text-gray-300">Generar tests</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={correctionOptions.explainChanges}
                        onChange={(e) => setCorrectionOptions(prev => ({
                          ...prev,
                          explainChanges: e.target.checked
                        }))}
                        className="rounded border-codestorm-blue/30 bg-codestorm-darker text-codestorm-accent focus:ring-codestorm-accent"
                      />
                      <span className="text-sm text-gray-300">Explicar cambios</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={correctionOptions.autoFix}
                        onChange={(e) => setCorrectionOptions(prev => ({
                          ...prev,
                          autoFix: e.target.checked
                        }))}
                        className="rounded border-codestorm-blue/30 bg-codestorm-darker text-codestorm-accent focus:ring-codestorm-accent"
                      />
                      <span className="text-sm text-gray-300">Aplicar correcciones automáticamente</span>
                    </label>
                  </div>

                  {/* Botón de análisis */}
                  <button
                    onClick={analyzeCodeWithMultiAgent}
                    disabled={!originalCode.trim() || isProcessing}
                    className={`w-full px-4 py-3 rounded-md font-medium transition-colors ${
                      !originalCode.trim() || isProcessing
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-codestorm-accent hover:bg-blue-600 text-white'
                    } flex items-center justify-center space-x-2`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Analizando...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Analizar Multi-Agente</span>
                      </>
                    )}
                  </button>

                  {/* Botones de acción */}
                  {analysisResult && (
                    <div className="space-y-2 pt-4 border-t border-codestorm-blue/30">
                      <button
                        onClick={handleApplyChanges}
                        disabled={!correctedCode}
                        className="w-full px-3 py-2 text-sm bg-green-600/20 text-green-300 rounded border border-green-600/30 hover:bg-green-600/30 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Aplicar Cambios</span>
                      </button>
                      
                      <button
                        onClick={exportCorrectedCode}
                        disabled={!correctedCode}
                        className="w-full px-3 py-2 text-sm bg-blue-600/20 text-blue-300 rounded border border-blue-600/30 hover:bg-blue-600/30 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Exportar Código</span>
                      </button>
                      
                      <button
                        onClick={generateReport}
                        className="w-full px-3 py-2 text-sm bg-purple-600/20 text-purple-300 rounded border border-purple-600/30 hover:bg-purple-600/30 transition-colors flex items-center justify-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Generar Reporte</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activePanel === 'realtime' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Análisis en tiempo real</span>
                    <button
                      onClick={() => setRealTimeAnalysisEnabled(!realTimeAnalysisEnabled)}
                      className={`w-10 h-5 rounded-full transition-colors ${
                        realTimeAnalysisEnabled ? 'bg-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        realTimeAnalysisEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  
                  <RealTimeAnalyzer
                    code={originalCode}
                    language={selectedLanguage}
                    isEnabled={realTimeAnalysisEnabled}
                  />
                </div>
              )}
            </div>
            </div>
          )}

          {/* Panel central y derecho */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Panel Multi-Agente */}
            {(isProcessing || analysisResult) && (
              <div className="border-b border-codestorm-blue/30 flex-shrink-0">
                <MultiAgentPanel
                  agentStatus={{
                    analyzer: isProcessing && currentAgent.includes('Analizador') ? 'working' : 
                             analysisResult?.agentStatus.analyzer || 'idle',
                    detector: isProcessing && currentAgent.includes('Detector') ? 'working' : 
                             analysisResult?.agentStatus.detector || 'idle',
                    generator: isProcessing && currentAgent.includes('Generador') ? 'working' : 
                              analysisResult?.agentStatus.generator || 'idle'
                  }}
                  currentAgent={currentAgent}
                  progress={progress}
                  message={progressMessage}
                  metrics={analysisResult ? {
                    processingTime: analysisResult.overallMetrics.processingTime,
                    confidenceScore: analysisResult.overallMetrics.confidenceScore,
                    improvementPercentage: analysisResult.overallMetrics.improvementPercentage,
                    totalIssues: analysisResult.errorAnalysis.totalIssues,
                    fixedIssues: analysisResult.codeGeneration.changes.length
                  } : undefined}
                  isProcessing={isProcessing}
                />
              </div>
            )}

            {/* Contenido principal */}
            <div className="flex-1 flex min-h-0">
              {/* Editor de código */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex border-b border-codestorm-blue/30 flex-shrink-0">
                  <div className="flex-1 px-3 sm:px-4 py-2 bg-codestorm-darker">
                    <span className="text-xs sm:text-sm font-medium text-white">Código Original</span>
                  </div>
                  {correctedCode && (
                    <div className="flex-1 px-3 sm:px-4 py-2 bg-codestorm-blue/10">
                      <span className="text-xs sm:text-sm font-medium text-white">Código Corregido</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex min-h-0">
                  <div className="flex-1 min-w-0">
                    <CodeEditorPanel
                      code={originalCode}
                      language={selectedLanguage}
                      errors={analysisResult?.errorAnalysis.errors || []}
                      onCodeChange={setOriginalCode}
                      readOnly={false}
                      title=""
                    />
                  </div>

                  {correctedCode && (
                    <div className="flex-1 border-l border-codestorm-blue/30 min-w-0">
                      <CodeEditorPanel
                        code={correctedCode}
                        language={selectedLanguage}
                        onCodeChange={() => {}}
                        readOnly={true}
                        title=""
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Panel de análisis */}
              {analysisResult && (
                <div className="w-72 sm:w-80 lg:w-80 border-l border-codestorm-blue/30 flex flex-col flex-shrink-0">
                  <div className="flex border-b border-codestorm-blue/30 flex-shrink-0">
                    <button
                      onClick={() => setActivePanel('analysis')}
                      className={`flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                        activePanel === 'analysis'
                          ? 'bg-codestorm-blue/20 text-white border-b-2 border-codestorm-accent'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Análisis</span>
                      <span className="sm:hidden">Stats</span>
                    </button>
                    <button
                      onClick={() => setActivePanel('diff')}
                      className={`flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                        activePanel === 'diff'
                          ? 'bg-codestorm-blue/20 text-white border-b-2 border-codestorm-accent'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Code className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                      Diff
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
                    {activePanel === 'analysis' && (
                      <div className="space-y-4">
                        {/* Métricas generales */}
                        <div className="bg-codestorm-darker rounded-lg p-3">
                          <h4 className="text-sm font-medium text-white mb-2">Métricas Generales</h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Confianza:</span>
                              <span className="text-white">{analysisResult.overallMetrics.confidenceScore}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Mejora:</span>
                              <span className="text-white">{analysisResult.overallMetrics.improvementPercentage}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Problemas:</span>
                              <span className="text-white">{analysisResult.errorAnalysis.totalIssues}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Correcciones:</span>
                              <span className="text-white">{analysisResult.codeGeneration.changes.length}</span>
                            </div>
                          </div>
                        </div>

                        {/* Errores por categoría */}
                        <div className="bg-codestorm-darker rounded-lg p-3">
                          <h4 className="text-sm font-medium text-white mb-2">Errores Detectados</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-red-400">Críticos:</span>
                              <span className="text-white">{analysisResult.errorAnalysis.criticalCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-orange-400">Errores:</span>
                              <span className="text-white">{analysisResult.errorAnalysis.errorCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-yellow-400">Advertencias:</span>
                              <span className="text-white">{analysisResult.errorAnalysis.warningCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-400">Sugerencias:</span>
                              <span className="text-white">{analysisResult.errorAnalysis.infoCount}</span>
                            </div>
                          </div>
                        </div>

                        {/* Recomendaciones */}
                        <div className="bg-codestorm-darker rounded-lg p-3">
                          <h4 className="text-sm font-medium text-white mb-2">Recomendaciones</h4>
                          <div className="space-y-1">
                            {analysisResult.overallMetrics.recommendedActions.map((action, index) => (
                              <div key={index} className="text-xs text-gray-300">
                                • {action}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activePanel === 'diff' && (
                      <CodeDiffViewer
                        originalCode={originalCode}
                        correctedCode={correctedCode}
                        changes={analysisResult.codeGeneration.changes}
                        language={selectedLanguage}
                        onApplyChange={(changeId) => {
                          const change = analysisResult.codeGeneration.changes.find(c => c.id === changeId);
                          if (change) {
                            const lines = originalCode.split('\n');
                            lines[change.lineNumber - 1] = change.correctedCode;
                            setOriginalCode(lines.join('\n'));
                            setHasUnsavedChanges(true);
                          }
                        }}
                        onRejectChange={(changeId) => {
                          console.log('Rechazando cambio:', changeId);
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeCorrectionModal;
