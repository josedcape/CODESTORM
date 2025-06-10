import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CollapsiblePanel from '../components/CollapsiblePanel';
import FloatingActionButtons from '../components/FloatingActionButtons';
import BrandLogo from '../components/BrandLogo';
import Footer from '../components/Footer';
import CodeModifierPanel from '../components/codemodifier/CodeModifierPanel';
import HelpAssistant from '../components/HelpAssistant';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Zap,
  AlertCircle,
  Code,
  Info,
  CheckCircle,
  Loader,
  Shield,
  Gauge,
  FileText,
  Brain,
  Search,
  Wrench,
  Activity,
  BarChart3
} from 'lucide-react';
import {
  FileItem
} from '../types';
import { useUI } from '../contexts/UIContext';

// Importación de los componentes del Corrector de Código Multi-Agente
import LanguageSelector from '../components/codecorrector/LanguageSelector';
import CodeEditorPanel from '../components/codecorrector/CodeEditorPanel';
import CodeAnalysisPanel from '../components/codecorrector/CodeAnalysisPanel';
import CorrectionOptions from '../components/codecorrector/CorrectionOptions';
import CorrectionHistory from '../components/codecorrector/CorrectionHistory';
import MultiAgentPanel from '../components/codecorrector/MultiAgentPanel';
import CodeDiffViewer from '../components/codecorrector/CodeDiffViewer';
import RealTimeAnalyzer from '../components/codecorrector/RealTimeAnalyzer';

// Importación del sistema multi-agente
import MultiAgentCodeCorrector, {
  MultiAgentAnalysisResult,
  CorrectionOptions as MultiAgentOptions
} from '../services/codeAnalysis/MultiAgentCodeCorrector';

const CodeCorrector: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet, expandedPanel, isCodeModifierVisible, toggleCodeModifier } = useUI();

  // Estado principal del código
  const [originalCode, setOriginalCode] = useState('');
  const [correctedCode, setCorrectedCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');

  // Estado del sistema multi-agente
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<MultiAgentAnalysisResult | null>(null);

  // Estado de la interfaz
  const [showChat, setShowChat] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showHelpAssistant, setShowHelpAssistant] = useState(false);
  const [realTimeAnalysisEnabled, setRealTimeAnalysisEnabled] = useState(true);
  const [activePanel, setActivePanel] = useState<'analysis' | 'diff' | 'realtime'>('analysis');

  // Opciones de corrección multi-agente
  const [correctionOptions, setCorrectionOptions] = useState<MultiAgentOptions>({
    analyzeSecurity: true,
    analyzePerformance: true,
    generateTests: false,
    explainChanges: true,
    autoFix: false,
    preserveFormatting: true
  });

  // Historial de correcciones
  const [correctionHistory, setCorrectionHistory] = useState<any[]>([]);

  // Callback para el progreso del análisis multi-agente
  const handleProgress = useCallback((stage: string, progressValue: number, message: string, agentName?: string) => {
    setProgress(progressValue);
    setProgressMessage(message);
    if (agentName) {
      setCurrentAgent(agentName);
    }
  }, []);

  // Función principal de análisis multi-agente
  const analyzeCodeWithMultiAgent = async () => {
    if (!originalCode.trim() || isProcessing) return;

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

      // Agregar al historial si fue exitoso
      if (result.overallMetrics.confidenceScore > 70) {
        const historyItem = {
          id: `history-${Date.now()}`,
          timestamp: Date.now(),
          language: selectedLanguage,
          originalCodeSnippet: originalCode.length > 200
            ? `${originalCode.substring(0, 200)}...`
            : originalCode,
          correctedCodeSnippet: result.codeGeneration.correctedCode.length > 200
            ? `${result.codeGeneration.correctedCode.substring(0, 200)}...`
            : result.codeGeneration.correctedCode,
          errorCount: result.errorAnalysis.totalIssues,
          fixedCount: result.codeGeneration.changes.length
        };
        setCorrectionHistory(prev => [historyItem, ...prev]);
      }

    } catch (error) {
      console.error('Error en análisis multi-agente:', error);
      alert(`Error durante el análisis: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsProcessing(false);
      setCurrentAgent('');
      setProgress(100);
    }
  };

  // Funciones de manejo de eventos
  const handleToggleChat = () => setShowChat(prev => !prev);
  const handleTogglePreview = () => setShowPreview(prev => !prev);
  const handleToggleHelpAssistant = () => setShowHelpAssistant(prev => !prev);

  const handleApplyChanges = (correctedCode: string) => {
    setOriginalCode(correctedCode);
    setCorrectedCode('');
    setAnalysisResult(null);
  };

  const handleSelectHistoryItem = (item: any) => {
    // Implementar lógica para cargar del historial
    console.log('Seleccionado del historial:', item.id);
  };

  const handleClearHistory = () => {
    setCorrectionHistory([]);
  };

  const handleApplyChange = (changeId: string) => {
    if (!analysisResult) return;

    const change = analysisResult.codeGeneration.changes.find(c => c.id === changeId);
    if (change) {
      // Aplicar cambio específico
      const lines = originalCode.split('\n');
      lines[change.lineNumber - 1] = change.correctedCode;
      setOriginalCode(lines.join('\n'));
    }
  };

  const handleRejectChange = (changeId: string) => {
    // Implementar lógica para rechazar cambio específico
    console.log('Rechazando cambio:', changeId);
  };

  // Inicializar reconocimiento de voz global para CodeCorrector
  useEffect(() => {
    console.log('Inicializando reconocimiento de voz en CodeCorrector...');
    import('../utils/voiceInitializer').then(({ initializeVoiceRecognition, cleanupVoiceRecognition }) => {
      initializeVoiceRecognition({
        onStormCommand: (command: string) => {
          console.log('Comando STORM recibido en CodeCorrector:', command);
          // Procesar comando como instrucción de corrección
          if (command.toLowerCase().includes('analizar')) {
            analyzeCodeWithMultiAgent();
          } else if (command.toLowerCase().includes('limpiar')) {
            setOriginalCode('');
            setCorrectedCode('');
            setAnalysisResult(null);
          }
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
  }, []);

  // Función para exportar código corregido
  const exportCorrectedCode = () => {
    if (!correctedCode) return;

    const blob = new Blob([correctedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corrected_code.${selectedLanguage === 'javascript' ? 'js' : selectedLanguage}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Función principal de análisis (alias para compatibilidad)
  const analyzeCode = analyzeCodeWithMultiAgent;
  // Función para generar reporte completo
  const generateReport = () => {
    if (!analysisResult) return;

    const report = MultiAgentCodeCorrector.generateComprehensiveReport(analysisResult);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code_analysis_report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-codestorm-darker flex flex-col">
      <Header
        onPreviewClick={handleTogglePreview}
        onChatClick={handleToggleChat}
        showConstructorButton={true}
      />

      <main className="flex-1 container mx-auto py-4 px-4">
        {/* Header Section */}
        <div className="bg-codestorm-dark rounded-lg shadow-md p-6 mb-6">
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white mb-4 flex items-center`}>
            <Brain className="h-6 w-6 mr-2 text-codestorm-gold electric-pulse" />
            Corrector de Código Multi-Agente
          </h1>
          <p className="text-gray-300 mb-6">
            Sistema avanzado de corrección de código con tres agentes especializados que trabajan en sincronía para analizar, detectar errores y generar código optimizado.
          </p>

          {/* Descripción de los agentes */}
          <div className="bg-codestorm-blue/10 border border-codestorm-blue/30 rounded-md p-3 mb-4">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-codestorm-accent mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-white text-sm">
                <span className="font-medium">Agentes Especializados:</span>
                <span className="ml-2 flex flex-wrap gap-2 mt-1">
                  <span className="inline-flex items-center text-xs bg-codestorm-blue/20 px-2 py-1 rounded-md">
                    <Brain className="h-3 w-3 mr-1 text-blue-400" />
                    Analizador de Código
                  </span>
                  <span className="inline-flex items-center text-xs bg-codestorm-blue/20 px-2 py-1 rounded-md">
                    <Search className="h-3 w-3 mr-1 text-yellow-400" />
                    Detector de Errores
                  </span>
                  <span className="inline-flex items-center text-xs bg-codestorm-blue/20 px-2 py-1 rounded-md">
                    <Wrench className="h-3 w-3 mr-1 text-green-400" />
                    Generador de Código
                  </span>
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Multi-Agent Status Panel */}
        <div className="mb-6">
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

        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-12 gap-6'}`}>
          {/* Panel izquierdo - opciones y controles */}
          <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-4' : 'col-span-3'} space-y-4`}>
            <CollapsiblePanel
              title="Configuración"
              type="sidebar"
              isVisible={true}
              showCollapseButton={false}
            >
              <div className="space-y-4 p-2">
                <LanguageSelector
                  selectedLanguage={selectedLanguage}
                  onSelectLanguage={setSelectedLanguage}
                />

                <CorrectionOptions
                  onOptionsChange={setCorrectionOptions}
                  isProcessing={isProcessing}
                />

                <button
                  onClick={analyzeCode}
                  disabled={!originalCode.trim() || isProcessing}
                  className={`w-full px-4 py-2 rounded-md ${
                    !originalCode.trim() || isProcessing
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-codestorm-accent hover:bg-blue-600 text-white electric-btn'
                  } flex items-center justify-center`}
                >
                  {isProcessing ? (
                    <>
                      <Loader className="h-5 w-5 mr-2 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Analizar Multi-Agente
                    </>
                  )}
                </button>

                {/* Botones adicionales */}
                {analysisResult && (
                  <div className="space-y-2">
                    <button
                      onClick={exportCorrectedCode}
                      disabled={!correctedCode}
                      className="w-full px-3 py-2 text-sm bg-green-600/20 text-green-300 rounded border border-green-600/30 hover:bg-green-600/30 transition-colors disabled:opacity-50"
                    >
                      Exportar Código
                    </button>
                    <button
                      onClick={generateReport}
                      className="w-full px-3 py-2 text-sm bg-blue-600/20 text-blue-300 rounded border border-blue-600/30 hover:bg-blue-600/30 transition-colors"
                    >
                      Generar Reporte
                    </button>
                  </div>
                )}

                <CorrectionHistory
                  history={correctionHistory}
                  onSelectHistoryItem={handleSelectHistoryItem}
                  onClearHistory={handleClearHistory}
                />
              </div>
            </CollapsiblePanel>

            {/* Panel de análisis en tiempo real */}
            <CollapsiblePanel
              title="Análisis en Tiempo Real"
              type="sidebar"
              isVisible={true}
              showCollapseButton={true}
            >
              <div className="p-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-300">Habilitado</span>
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
            </CollapsiblePanel>
          </div>

          {/* Panel central - editor de código */}
          <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-8' : 'col-span-5'} space-y-4`}>
            <CollapsiblePanel
              title="Editor de Código Original"
              type="editor"
              isVisible={true}
              showCollapseButton={false}
            >
              <div className="h-[calc(50vh-150px)]">
                <CodeEditorPanel
                  code={originalCode}
                  language={selectedLanguage}
                  errors={analysisResult?.errorAnalysis.errors || []}
                  onCodeChange={setOriginalCode}
                  readOnly={false}
                  title="Código a analizar"
                />
              </div>
            </CollapsiblePanel>

            {/* Editor de código corregido */}
            {correctedCode && (
              <CollapsiblePanel
                title="Código Corregido"
                type="editor"
                isVisible={true}
                showCollapseButton={false}
              >
                <div className="h-[calc(50vh-150px)]">
                  <CodeEditorPanel
                    code={correctedCode}
                    language={selectedLanguage}
                    onCodeChange={() => {}}
                    readOnly={true}
                    title="Versión optimizada"
                  />
                  <div className="flex justify-end mt-2 space-x-2">
                    <button
                      onClick={() => handleApplyChanges(correctedCode)}
                      className="px-3 py-1 text-sm bg-green-600/20 text-green-300 rounded border border-green-600/30 hover:bg-green-600/30 transition-colors"
                    >
                      Aplicar Cambios
                    </button>
                  </div>
                </div>
              </CollapsiblePanel>
            )}
          </div>

          {/* Panel derecho - análisis y resultados */}
          <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-12' : 'col-span-4'} space-y-4`}>
            {/* Spinner de carga durante procesamiento */}
            {isProcessing && (
              <LoadingSpinner
                message={progressMessage || 'Procesando código...'}
                progress={progress}
                subMessage={currentAgent ? `${currentAgent} trabajando...` : undefined}
                size="large"
                variant="primary"
              />
            )}

            {/* Pestañas de análisis */}
            {!isProcessing && analysisResult && (
              <>
                <div className="bg-codestorm-dark rounded-lg border border-codestorm-blue/30">
                  <div className="flex border-b border-codestorm-blue/30">
                    <button
                      onClick={() => setActivePanel('analysis')}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                        activePanel === 'analysis'
                          ? 'bg-codestorm-blue/20 text-white border-b-2 border-codestorm-accent'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4 inline mr-2" />
                      Análisis
                    </button>
                    <button
                      onClick={() => setActivePanel('diff')}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                        activePanel === 'diff'
                          ? 'bg-codestorm-blue/20 text-white border-b-2 border-codestorm-accent'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Code className="w-4 h-4 inline mr-2" />
                      Diferencias
                    </button>
                    <button
                      onClick={() => setActivePanel('realtime')}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                        activePanel === 'realtime'
                          ? 'bg-codestorm-blue/20 text-white border-b-2 border-codestorm-accent'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Activity className="w-4 h-4 inline mr-2" />
                      Tiempo Real
                    </button>
                  </div>

                  <div className="p-4 h-[calc(100vh-400px)] overflow-y-auto">
                    {activePanel === 'analysis' && (
                      <CodeAnalysisPanel
                        errors={analysisResult.errorAnalysis.errors}
                        onSelectError={(error) => console.log('Error seleccionado:', error)}
                        executionTime={analysisResult.overallMetrics.processingTime}
                      />
                    )}

                    {activePanel === 'diff' && (
                      <CodeDiffViewer
                        originalCode={originalCode}
                        correctedCode={correctedCode}
                        changes={analysisResult.codeGeneration.changes}
                        language={selectedLanguage}
                        onApplyChange={handleApplyChange}
                        onRejectChange={handleRejectChange}
                      />
                    )}

                    {activePanel === 'realtime' && (
                      <RealTimeAnalyzer
                        code={originalCode}
                        language={selectedLanguage}
                        isEnabled={realTimeAnalysisEnabled}
                      />
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Estado inicial */}
            {!isProcessing && !analysisResult && (
              <div className="bg-codestorm-dark rounded-lg shadow-md h-[calc(100vh-300px)] flex items-center justify-center border border-codestorm-blue/30">
                <div className="text-center p-6">
                  <Brain className="h-16 w-16 text-codestorm-gold mx-auto mb-4 opacity-30" />
                  <h3 className="text-xl font-medium text-white mb-2">Sistema Multi-Agente Listo</h3>
                  <p className="text-gray-400 max-w-md">
                    Escribe tu código y activa el análisis multi-agente para obtener correcciones inteligentes y optimizaciones avanzadas.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Botones flotantes */}
      <FloatingActionButtons
        onToggleChat={handleToggleChat}
        onTogglePreview={handleTogglePreview}
        onToggleCodeModifier={toggleCodeModifier}
        onToggleHelpAssistant={handleToggleHelpAssistant}
        showChat={showChat}
        showCodeModifier={isCodeModifierVisible}
        showHelpAssistant={showHelpAssistant}
      />

      {/* Logo de BOTIDINAMIX */}
      <BrandLogo size="md" showPulse={true} showGlow={true} />

      {/* Panel de modificación de código */}
      <CodeModifierPanel
        isVisible={isCodeModifierVisible}
        onClose={toggleCodeModifier}
        files={[
          {
            id: 'sample-file-1',
            name: `code.${selectedLanguage === 'javascript' ? 'js' : selectedLanguage}`,
            path: `/code.${selectedLanguage === 'javascript' ? 'js' : selectedLanguage}`,
            content: originalCode || `// Código de ejemplo en ${selectedLanguage}\nconsole.log('Hola mundo');`,
            language: selectedLanguage,
            type: 'file',
            isNew: true,
            timestamp: Date.now(),
            lastModified: Date.now()
          }
        ]}
        onApplyChanges={(originalFile: FileItem, modifiedFile: FileItem) => {
          setOriginalCode(modifiedFile.content);
          toggleCodeModifier();
        }}
      />

      {/* Asistente de ayuda */}
      {showHelpAssistant && (
        <HelpAssistant
          onClose={handleToggleHelpAssistant}
          context="codecorrector"
        />
      )}

      {/* Pie de página */}
      <Footer showLogo={true} />


    </div>
  );
};

export default CodeCorrector;
