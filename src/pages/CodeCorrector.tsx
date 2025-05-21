import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CollapsiblePanel from '../components/CollapsiblePanel';
import FloatingActionButtons from '../components/FloatingActionButtons';
import BrandLogo from '../components/BrandLogo';
import Footer from '../components/Footer';
import {
  Zap,
  AlertCircle,
  Code,
  Info,
  CheckCircle,
  Loader,
  Shield,
  Gauge,
  FileText
} from 'lucide-react';
import {
  AgentTask,
  CodeError,
  CodeCorrectionResult,
  CorrectionHistoryItem
} from '../types';
import { useUI } from '../contexts/UIContext';

// Importación de los componentes del Corrector de Código
import LanguageSelector from '../components/codecorrector/LanguageSelector';
import CodeEditorPanel from '../components/codecorrector/CodeEditorPanel';
import CodeAnalysisPanel from '../components/codecorrector/CodeAnalysisPanel';
import CorrectionOptions from '../components/codecorrector/CorrectionOptions';
import CorrectionHistory from '../components/codecorrector/CorrectionHistory';
import CodeCorrectionResultPanel from '../components/codecorrector/CodeCorrectionResultPanel';

// Importación del agente de corrección de código
import { CodeCorrectorAgent } from '../agents/CodeCorrectorAgent';

const CodeCorrector: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet, expandedPanel } = useUI();

  // Estado para el código y análisis
  const [originalCode, setOriginalCode] = useState('');
  const [correctedCode, setCorrectedCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<CodeError[]>([]);
  const [selectedError, setSelectedError] = useState<CodeError | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [correctionHistory, setCorrectionHistory] = useState<CorrectionHistoryItem[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showResultPanel, setShowResultPanel] = useState(false);
  const [correctionResult, setCorrectionResult] = useState<CodeCorrectionResult | null>(null);

  // Opciones de corrección
  const [correctionOptions, setCorrectionOptions] = useState({
    analyzeSecurity: true,
    analyzePerformance: true,
    generateTests: false,
    explainChanges: true
  });

  // Función para manejar el chat
  const handleToggleChat = () => {
    setShowChat(prev => !prev);
  };

  // Función para manejar la vista previa
  const handleTogglePreview = () => {
    setShowPreview(prev => !prev);
  };

  // Función para analizar y corregir el código
  const analyzeCode = async () => {
    if (!originalCode.trim() || isProcessing) return;

    setIsProcessing(true);
    setErrors([]);
    setCorrectedCode('');
    setSelectedError(null);

    try {
      console.log('Iniciando análisis de código:', {
        language: selectedLanguage,
        codeLength: originalCode.length,
        options: correctionOptions
      });

      // Crear tarea para el agente de corrección
      const correctorTask: AgentTask = {
        id: `task-corrector-${Date.now()}`,
        type: 'codeCorrector',
        instruction: 'Analizar y corregir código',
        status: 'working',
        startTime: Date.now()
      };

      // Ejecutar el agente de corrección
      const result = await CodeCorrectorAgent.execute(
        correctorTask,
        originalCode,
        selectedLanguage,
        correctionOptions
      );

      console.log('Resultado del análisis:', {
        success: result.success,
        hasData: !!result.data,
        hasAnalysis: !!result.data?.analysis,
        errorMessage: result.error
      });

      // Procesar el resultado incluso si no fue exitoso pero tiene datos de análisis
      if (result.data?.analysis) {
        const analysis = result.data.analysis;

        console.log('Análisis recibido:', {
          errorsCount: analysis.errors.length,
          hasCorrectedCode: analysis.correctedCode !== originalCode,
          executionTime: analysis.executionTime
        });

        // Actualizar el estado con los resultados
        setErrors(analysis.errors);
        setCorrectedCode(analysis.correctedCode);
        setExecutionTime(analysis.executionTime);

        // Crear el objeto de resultado de corrección completo
        const fullResult: CodeCorrectionResult = {
          originalCode,
          correctedCode: analysis.correctedCode,
          errors: analysis.errors,
          summary: analysis.summary,
          executionTime: analysis.executionTime,
          language: selectedLanguage
        };

        // Guardar el resultado completo y mostrar el panel de resultados
        setCorrectionResult(fullResult);
        setShowResultPanel(true);

        // Añadir al historial solo si fue exitoso
        if (result.success) {
          const historyItem: CorrectionHistoryItem = {
            id: `history-${Date.now()}`,
            timestamp: Date.now(),
            language: selectedLanguage,
            originalCodeSnippet: originalCode.length > 200
              ? `${originalCode.substring(0, 200)}...`
              : originalCode,
            correctedCodeSnippet: analysis.correctedCode.length > 200
              ? `${analysis.correctedCode.substring(0, 200)}...`
              : analysis.correctedCode,
            errorCount: analysis.summary.totalErrors,
            fixedCount: analysis.summary.fixedErrors
          };

          setCorrectionHistory(prev => [historyItem, ...prev]);
        }

        // Si no hay errores pero el código corregido es diferente, añadir un error genérico
        if (analysis.errors.length === 0 && analysis.correctedCode !== originalCode) {
          console.log('No hay errores pero el código corregido es diferente, añadiendo error genérico');
          const genericError: CodeError = {
            id: `error-${Date.now()}-auto`,
            type: 'style',
            severity: 'info',
            message: 'Mejoras de código aplicadas',
            description: 'Se han aplicado mejoras al código que no corresponden a errores específicos.',
            lineStart: 1,
            lineEnd: originalCode.split('\n').length,
            code: originalCode,
            suggestion: 'Revisar el código corregido para ver las mejoras aplicadas.',
            fixed: true
          };

          setErrors([genericError]);
        }
      } else if (!result.success) {
        console.error('Error al analizar el código:', result.error);

        // Crear un error genérico para mostrar al usuario
        const errorMessage = result.error || 'Error desconocido en el análisis';
        const genericError: CodeError = {
          id: `error-${Date.now()}-system`,
          type: 'syntax',
          severity: 'critical',
          message: 'Error en el análisis',
          description: `Ocurrió un error durante el análisis: ${errorMessage}`,
          lineStart: 1,
          lineEnd: 1,
          code: '',
          suggestion: 'Intenta nuevamente con un código diferente o contacta al soporte.',
          fixed: false
        };

        setErrors([genericError]);
        setCorrectedCode(originalCode);
      }
    } catch (error) {
      console.error('Error en el proceso de corrección:', error);

      // Crear un error genérico para mostrar al usuario
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const genericError: CodeError = {
        id: `error-${Date.now()}-exception`,
        type: 'syntax',
        severity: 'critical',
        message: 'Error inesperado',
        description: `Ocurrió un error inesperado: ${errorMessage}`,
        lineStart: 1,
        lineEnd: 1,
        code: '',
        suggestion: 'Intenta nuevamente con un código diferente o contacta al soporte.',
        fixed: false
      };

      setErrors([genericError]);
      setCorrectedCode(originalCode);
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para seleccionar un error
  const handleSelectError = (error: CodeError) => {
    setSelectedError(error);
  };

  // Función para seleccionar un elemento del historial
  const handleSelectHistoryItem = (item: CorrectionHistoryItem) => {
    // Aquí podrías implementar la lógica para cargar el código del historial
    // Por ahora, solo mostramos un mensaje
    alert(`Seleccionado: ${item.id}`);
  };

  // Función para limpiar el historial
  const handleClearHistory = () => {
    setCorrectionHistory([]);
  };

  // Función para aplicar los cambios del código corregido
  const handleApplyChanges = (correctedCode: string) => {
    setOriginalCode(correctedCode);
    setCorrectedCode('');
    setErrors([]);
    setShowResultPanel(false);
  };

  // Función para cerrar el panel de resultados
  const handleCloseResultPanel = () => {
    setShowResultPanel(false);
  };

  return (
    <div className="min-h-screen bg-codestorm-darker flex flex-col">
      <Header
        onPreviewClick={handleTogglePreview}
        onChatClick={handleToggleChat}
        showConstructorButton={true}
      />

      <main className="flex-1 container mx-auto py-4 px-4">
        <div className="bg-codestorm-dark rounded-lg shadow-md p-6 mb-6">
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white mb-4 flex items-center`}>
            <Code className="h-6 w-6 mr-2 text-codestorm-gold electric-pulse" />
            Corrector de Código
          </h1>
          <p className="text-gray-300 mb-6">
            Este corrector utiliza modelos avanzados de IA para analizar tu código, corregir errores y optimizar siguiendo las mejores prácticas.
          </p>

          {/* Descripción de las capacidades */}
          <div className="bg-codestorm-blue/10 border border-codestorm-blue/30 rounded-md p-3 mb-4">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-codestorm-accent mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-white text-sm">
                <span className="font-medium">Capacidades:</span>
                <span className="ml-2 flex flex-wrap gap-2 mt-1">
                  <span className="inline-flex items-center text-xs bg-codestorm-blue/20 px-2 py-1 rounded-md">
                    <AlertCircle className="h-3 w-3 mr-1 text-red-400" />
                    Errores de sintaxis
                  </span>
                  <span className="inline-flex items-center text-xs bg-codestorm-blue/20 px-2 py-1 rounded-md">
                    <AlertCircle className="h-3 w-3 mr-1 text-yellow-400" />
                    Errores de lógica
                  </span>
                  <span className="inline-flex items-center text-xs bg-codestorm-blue/20 px-2 py-1 rounded-md">
                    <Shield className="h-3 w-3 mr-1 text-green-400" />
                    Problemas de seguridad
                  </span>
                  <span className="inline-flex items-center text-xs bg-codestorm-blue/20 px-2 py-1 rounded-md">
                    <Gauge className="h-3 w-3 mr-1 text-blue-400" />
                    Optimización de rendimiento
                  </span>
                  <span className="inline-flex items-center text-xs bg-codestorm-blue/20 px-2 py-1 rounded-md">
                    <FileText className="h-3 w-3 mr-1 text-purple-400" />
                    Mejores prácticas
                  </span>
                </span>
              </p>
            </div>
          </div>
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
                      Analizar y Corregir
                    </>
                  )}
                </button>

                <CorrectionHistory
                  history={correctionHistory}
                  onSelectHistoryItem={handleSelectHistoryItem}
                  onClearHistory={handleClearHistory}
                />
              </div>
            </CollapsiblePanel>
          </div>

          {/* Panel central - editor de código */}
          <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-8' : 'col-span-5'} space-y-4`}>
            <CollapsiblePanel
              title="Editor de Código"
              type="editor"
              isVisible={true}
              showCollapseButton={false}
            >
              <div className="h-[calc(100vh-300px)]">
                <CodeEditorPanel
                  code={originalCode}
                  language={selectedLanguage}
                  errors={errors}
                  onCodeChange={setOriginalCode}
                  readOnly={false}
                  title="Código a corregir"
                />
              </div>
            </CollapsiblePanel>
          </div>

          {/* Panel derecho - resultados y análisis */}
          <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-12' : 'col-span-4'} space-y-4`}>
            {isProcessing ? (
              <div className="bg-codestorm-dark rounded-lg shadow-md h-[calc(100vh-300px)] flex items-center justify-center border border-codestorm-blue/30">
                <div className="text-center p-6">
                  <Loader className="h-16 w-16 text-codestorm-accent mx-auto mb-4 animate-spin" />
                  <h3 className="text-xl font-medium text-white mb-2">Analizando código...</h3>
                  <p className="text-gray-400 max-w-md">
                    Estamos procesando tu código. Esto puede tomar unos momentos dependiendo de la complejidad.
                  </p>
                </div>
              </div>
            ) : errors.length > 0 || correctedCode !== originalCode ? (
              <>
                <CollapsiblePanel
                  title="Análisis"
                  type="editor"
                  isVisible={true}
                  showCollapseButton={false}
                >
                  <div className="h-[calc(50vh-200px)]">
                    <CodeAnalysisPanel
                      errors={errors}
                      onSelectError={handleSelectError}
                      executionTime={executionTime || undefined}
                    />
                  </div>
                </CollapsiblePanel>

                <CollapsiblePanel
                  title="Código Corregido"
                  type="editor"
                  isVisible={true}
                  showCollapseButton={false}
                >
                  <div className="h-[calc(50vh-200px)]">
                    <CodeEditorPanel
                      code={correctedCode}
                      language={selectedLanguage}
                      onCodeChange={() => {}}
                      readOnly={true}
                      title="Versión corregida"
                    />
                  </div>
                </CollapsiblePanel>
              </>
            ) : (
              <div className="bg-codestorm-dark rounded-lg shadow-md h-[calc(100vh-300px)] flex items-center justify-center border border-codestorm-blue/30">
                <div className="text-center p-6">
                  <CheckCircle className="h-16 w-16 text-codestorm-gold mx-auto mb-4 opacity-30" />
                  <h3 className="text-xl font-medium text-white mb-2">Listo para analizar</h3>
                  <p className="text-gray-400 max-w-md">
                    Escribe o pega tu código en el editor y haz clic en "Analizar y Corregir" para comenzar.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Botones flotantes para móvil y tablet */}
      {(isMobile || isTablet) && (
        <FloatingActionButtons
          onToggleChat={handleToggleChat}
          onTogglePreview={handleTogglePreview}
          showChat={showChat}
        />
      )}

      {/* Logo de BOTIDINAMIX */}
      <BrandLogo size="md" showPulse={true} showGlow={true} />

      {/* Pie de página */}
      <Footer showLogo={true} />

      {/* Panel de resultados de corrección */}
      {correctionResult && (
        <CodeCorrectionResultPanel
          result={correctionResult}
          onApplyChanges={handleApplyChanges}
          onClose={handleCloseResultPanel}
          isVisible={showResultPanel}
        />
      )}
    </div>
  );
};

export default CodeCorrector;
