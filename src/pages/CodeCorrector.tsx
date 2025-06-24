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
  BarChart3,
  Upload,
  FolderOpen,
  File,
  GitCompare,
  MessageSquare,
  Download,
  Save,
  RotateCcw,
  Archive,
  Tabs
} from 'lucide-react';
import {
  FileItem
} from '../types';
import { useUI } from '../contexts/UIContext';

// Import original CodeCorrector components
import LanguageSelector from '../components/codecorrector/LanguageSelector';
import CodeEditorPanel from '../components/codecorrector/CodeEditorPanel';
import CodeAnalysisPanel from '../components/codecorrector/CodeAnalysisPanel';
import CorrectionOptions from '../components/codecorrector/CorrectionOptions';
import CorrectionHistory from '../components/codecorrector/CorrectionHistory';
import MultiAgentPanel from '../components/codecorrector/MultiAgentPanel';
import CodeDiffViewer from '../components/codecorrector/CodeDiffViewer';
import RealTimeAnalyzer from '../components/codecorrector/RealTimeAnalyzer';

// Import original multi-agent system
import MultiAgentCodeCorrector, {
  MultiAgentAnalysisResult,
  CorrectionOptions as MultiAgentOptions
} from '../services/codeAnalysis/MultiAgentCodeCorrector';

// Import new file management components
import FileUploadZone from '../components/codecorrector/FileUploadZone';
import FileTreeViewer from '../components/codecorrector/FileTreeViewer';
import FileContentViewer from '../components/codecorrector/FileContentViewer';
import FileChatModifier from '../components/codecorrector/FileChatModifier';
import FileDiffViewer from '../components/codecorrector/FileDiffViewer';

// Import file management services
import {
  FileDecompressionService,
  FileNode,
  DecompressionResult
} from '../services/FileDecompressionService';

interface ModificationHistory {
  id: string;
  fileName: string;
  filePath: string;
  timestamp: number;
  originalContent: string;
  modifiedContent: string;
  explanation: string;
}

type WorkflowMode = 'direct-code' | 'file-management';

const CodeCorrector: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet, expandedPanel, isCodeModifierVisible, toggleCodeModifier } = useUI();

  // Workflow mode state
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>('direct-code');

  // Original CodeCorrector state
  const [originalCode, setOriginalCode] = useState('');
  const [correctedCode, setCorrectedCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');

  // Multi-agent system state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<MultiAgentAnalysisResult | null>(null);

  // Original UI state
  const [showChat, setShowChat] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showHelpAssistant, setShowHelpAssistant] = useState(false);
  const [realTimeAnalysisEnabled, setRealTimeAnalysisEnabled] = useState(true);
  const [activePanel, setActivePanel] = useState<'analysis' | 'diff' | 'realtime'>('analysis');

  // Original correction options
  const [correctionOptions, setCorrectionOptions] = useState<MultiAgentOptions>({
    analyzeSecurity: true,
    analyzePerformance: true,
    generateTests: false,
    explainChanges: true,
    autoFix: false,
    preserveFormatting: true
  });

  // Original correction history
  const [correctionHistory, setCorrectionHistory] = useState<any[]>([]);

  // File management state
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // File modification state
  const [modificationHistory, setModificationHistory] = useState<ModificationHistory[]>([]);
  const [currentDiff, setCurrentDiff] = useState<{
    originalContent: string;
    modifiedContent: string;
    fileName: string;
  } | null>(null);

  // File management UI state
  const [activeView, setActiveView] = useState<'upload' | 'files' | 'diff'>('upload');

  // Original multi-agent progress handler
  const handleProgress = useCallback((stage: string, progressValue: number, message: string, agentName?: string) => {
    setProgress(progressValue);
    setProgressMessage(message);
    if (agentName) {
      setCurrentAgent(agentName);
    }
  }, []);

  // Original multi-agent analysis function
  const analyzeCodeWithMultiAgent = async () => {
    if (!originalCode.trim() || isProcessing) return;

    // Validate input
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

      // Add to history if successful
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

  // File upload handlers
  const handleFilesExtracted = useCallback((result: DecompressionResult) => {
    if (result.success) {
      setFileTree(result.fileTree);
      setActiveView('files');
      setUploadError(null);

      // Determine message based on file count
      if (result.totalFiles === 1) {
        console.log(`✅ Successfully processed individual file: ${result.fileTree[0]?.name}`);
      } else {
        console.log(`✅ Successfully extracted ${result.totalFiles} files from archive`);
      }
    } else {
      setUploadError(result.error || 'Failed to process files');
    }
    setIsUploading(false);
  }, []);

  const handleUploadError = useCallback((error: string) => {
    setUploadError(error);
    setIsUploading(false);
  }, []);

  // File selection handlers
  const handleFileSelect = useCallback((file: FileNode) => {
    setSelectedFile(file);
    setCurrentDiff(null);
    console.log(`📁 Selected file: ${file.name} (${file.path})`);
  }, []);

  const handleToggleDirectory = useCallback((path: string) => {
    setFileTree(prevTree => {
      const updateNode = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.path === path && node.type === 'directory') {
            return { ...node, isExpanded: !node.isExpanded };
          }
          if (node.children) {
            return { ...node, children: updateNode(node.children) };
          }
          return node;
        });
      };
      return updateNode(prevTree);
    });
  }, []);

  // Original event handlers
  const handleToggleChat = () => setShowChat(prev => !prev);
  const handleTogglePreview = () => setShowPreview(prev => !prev);
  const handleToggleHelpAssistant = () => setShowHelpAssistant(prev => !prev);

  const handleApplyChanges = (correctedCode: string) => {
    setOriginalCode(correctedCode);
    setCorrectedCode('');
    setAnalysisResult(null);
  };

  const handleSelectHistoryItem = (item: any) => {
    console.log('Seleccionado del historial:', item.id);
  };

  const handleClearHistory = () => {
    setCorrectionHistory([]);
  };

  const handleApplyChange = (changeId: string) => {
    if (!analysisResult) return;

    const change = analysisResult.codeGeneration.changes.find(c => c.id === changeId);
    if (change) {
      const lines = originalCode.split('\n');
      lines[change.lineNumber - 1] = change.correctedCode;
      setOriginalCode(lines.join('\n'));
    }
  };

  const handleRejectChange = (changeId: string) => {
    console.log('Rechazando cambio:', changeId);
  };

  // Enhanced file modification handler that uses multi-agent system with large file support
  const handleFileModified = useCallback(async (filePath: string, newContent: string, explanation: string) => {
    if (!selectedFile) return;

    // If we're in file management mode, use the multi-agent system for analysis
    if (workflowMode === 'file-management' && typeof selectedFile.content === 'string') {
      try {
        setIsProcessing(true);

        // Use the multi-agent system to analyze the modification
        const fileExtension = selectedFile.extension || '';
        const detectedLanguage = getLanguageFromExtension(fileExtension);
        const lines = newContent.split('\n');
        const isLargeFile = lines.length > 1000;

        if (isLargeFile) {
          // For large files, use chunked analysis
          console.log(`🔄 Analyzing large file (${lines.length} lines) with chunked multi-agent analysis`);

          const chunkSize = 500;
          const chunks: string[] = [];

          // Split into chunks
          for (let i = 0; i < lines.length; i += chunkSize) {
            const chunk = lines.slice(i, i + chunkSize).join('\n');
            chunks.push(chunk);
          }

          // Analyze each chunk
          const analyzedChunks: string[] = [];
          let overallConfidence = 0;
          let totalImprovements = 0;

          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const chunkProgress = ((i + 1) / chunks.length) * 100;

            handleProgress(
              'analysis',
              chunkProgress,
              `Analyzing chunk ${i + 1}/${chunks.length}...`,
              'Multi-Agent Analyzer'
            );

            try {
              const chunkResult = await MultiAgentCodeCorrector.analyzeCode(
                chunk,
                detectedLanguage,
                correctionOptions,
                (stage, progress, message, agent) => {
                  // Adjust progress for chunk
                  const adjustedProgress = chunkProgress + (progress / chunks.length);
                  handleProgress(stage, adjustedProgress, `Chunk ${i + 1}: ${message}`, agent);
                }
              );

              if (chunkResult.overallMetrics.confidenceScore > 70) {
                analyzedChunks.push(chunkResult.codeGeneration.correctedCode);
                overallConfidence += chunkResult.overallMetrics.confidenceScore;
                totalImprovements += chunkResult.codeGeneration.changes.length;
              } else {
                analyzedChunks.push(chunk);
              }

            } catch (chunkError) {
              console.warn(`Chunk ${i + 1} analysis failed, using original:`, chunkError);
              analyzedChunks.push(chunk);
            }
          }

          // Combine analyzed chunks
          const enhancedContent = analyzedChunks.join('\n');
          const avgConfidence = overallConfidence / chunks.length;

          if (avgConfidence > 70 && enhancedContent !== newContent) {
            newContent = enhancedContent;
            explanation += ` (Enhanced by chunked multi-agent analysis: ${totalImprovements} improvements across ${chunks.length} chunks, avg confidence: ${avgConfidence.toFixed(1)}%)`;
          }

        } else {
          // Standard analysis for smaller files
          const result = await MultiAgentCodeCorrector.analyzeCode(
            newContent,
            detectedLanguage,
            correctionOptions,
            handleProgress
          );

          // If the analysis suggests improvements, use the corrected version
          if (result.overallMetrics.confidenceScore > 70 && result.codeGeneration.correctedCode !== newContent) {
            newContent = result.codeGeneration.correctedCode;
            explanation += ` (Enhanced by multi-agent analysis: ${result.codeGeneration.summary})`;
          }
        }

      } catch (error) {
        console.warn('Multi-agent analysis failed, using original modification:', error);
      } finally {
        setIsProcessing(false);
      }
    }

    // Update file tree with new content
    const updatedTree = FileDecompressionService.updateFileContent(fileTree, filePath, newContent);
    setFileTree(updatedTree);

    // Update selected file
    const updatedFile = { ...selectedFile, content: newContent };
    setSelectedFile(updatedFile);

    // Add to modification history
    const historyItem: ModificationHistory = {
      id: `mod_${Date.now()}`,
      fileName: selectedFile.name,
      filePath: selectedFile.path,
      timestamp: Date.now(),
      originalContent: typeof selectedFile.content === 'string' ? selectedFile.content : '',
      modifiedContent: newContent,
      explanation
    };
    setModificationHistory(prev => [historyItem, ...prev]);

    // Show diff
    setCurrentDiff({
      originalContent: typeof selectedFile.content === 'string' ? selectedFile.content : '',
      modifiedContent: newContent,
      fileName: selectedFile.name
    });
    setActiveView('diff');

    console.log(`✅ File modified: ${selectedFile.name}`);
  }, [selectedFile, fileTree, workflowMode, correctionOptions, handleProgress]);

  // Helper function to detect language from file extension
  const getLanguageFromExtension = (extension: string): string => {
    const langMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.c': 'c',
      '.cpp': 'cpp',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'css',
      '.json': 'json',
      '.xml': 'xml',
      '.yaml': 'yaml',
      '.yml': 'yaml'
    };
    return langMap[extension.toLowerCase()] || 'javascript';
  };

  // Diff handlers
  const handleAcceptChanges = useCallback(() => {
    if (!currentDiff) return;

    // Changes are already applied to the file tree
    setCurrentDiff(null);
    setActiveView('files');
    console.log('✅ Changes accepted');
  }, [currentDiff]);

  const handleRejectChanges = useCallback(() => {
    if (!currentDiff || !selectedFile) return;

    // Revert changes in file tree
    const revertedTree = FileDecompressionService.updateFileContent(
      fileTree,
      selectedFile.path,
      currentDiff.originalContent
    );
    setFileTree(revertedTree);

    // Update selected file
    const revertedFile = { ...selectedFile, content: currentDiff.originalContent };
    setSelectedFile(revertedFile);

    // Remove from history
    setModificationHistory(prev => prev.slice(1));

    setCurrentDiff(null);
    setActiveView('files');
    console.log('❌ Changes rejected');
  }, [currentDiff, selectedFile, fileTree]);

  // Original export functions
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

  // Alias for compatibility
  const analyzeCode = analyzeCodeWithMultiAgent;

  // Download handlers
  const handleDownloadFile = useCallback(async () => {
    if (!selectedFile || !selectedFile.content) return;

    const blob = new Blob([selectedFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleDownloadProject = useCallback(async () => {
    if (fileTree.length === 0) return;

    try {
      setIsProcessing(true);
      const blob = await FileDecompressionService.createArchive(fileTree, 'modified_project.zip');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'modified_project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('📦 Project downloaded successfully');
    } catch (error) {
      console.error('Failed to download project:', error);
      setUploadError('Failed to create project archive');
    } finally {
      setIsProcessing(false);
    }
  }, [fileTree]);

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
            Sistema avanzado de corrección de código con análisis multi-agente y gestión de archivos integrada.
          </p>

          {/* Workflow Mode Selector */}
          <div className="bg-codestorm-blue/10 border border-codestorm-blue/30 rounded-md p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-medium">Modo de Trabajo:</span>
              <div className="flex bg-codestorm-darker rounded-md p-1">
                <button
                  onClick={() => setWorkflowMode('direct-code')}
                  className={`px-4 py-2 text-sm rounded transition-colors ${
                    workflowMode === 'direct-code'
                      ? 'bg-codestorm-accent text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Code className="w-4 h-4 mr-2 inline" />
                  Código Directo
                </button>
                <button
                  onClick={() => setWorkflowMode('file-management')}
                  className={`px-4 py-2 text-sm rounded transition-colors ${
                    workflowMode === 'file-management'
                      ? 'bg-codestorm-accent text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <FolderOpen className="w-4 h-4 mr-2 inline" />
                  Gestión de Archivos
                </button>
              </div>
            </div>

            {/* Mode descriptions */}
            <div className="text-sm text-gray-400">
              {workflowMode === 'direct-code' ? (
                <div className="flex items-start">
                  <Info className="h-4 w-4 text-codestorm-accent mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white mb-1">Análisis Multi-Agente Directo</p>
                    <p>Escribe o pega código directamente para análisis inmediato con tres agentes especializados: Analizador, Detector de Errores y Generador de Código.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start">
                  <Info className="h-4 w-4 text-codestorm-accent mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white mb-1">Gestión de Archivos con IA</p>
                    <p>Sube archivos ZIP, navega por la estructura de archivos y modifica código usando instrucciones en lenguaje natural con análisis multi-agente integrado.</p>
                  </div>
                </div>
              )}
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

        {/* Content based on workflow mode */}
        {workflowMode === 'direct-code' ? (
          /* DIRECT CODE WORKFLOW */
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-12 gap-6'}`}>
            {/* Left Panel - Configuration and Controls */}
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

                  {/* Additional buttons */}
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

              {/* Real-time analysis panel */}
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

            {/* Center Panel - Code Editors */}
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

              {/* Corrected code editor */}
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

            {/* Right Panel - Analysis and Results */}
            <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-12' : 'col-span-4'} space-y-4`}>
              {/* Loading spinner during processing */}
              {isProcessing && (
                <LoadingSpinner
                  message={progressMessage || 'Procesando código...'}
                  progress={progress}
                  subMessage={currentAgent ? `${currentAgent} trabajando...` : undefined}
                  size="large"
                  variant="primary"
                />
              )}

              {/* Analysis tabs */}
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
                        <GitCompare className="w-4 h-4 inline mr-2" />
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
                          analysisResult={analysisResult}
                          onApplyChange={handleApplyChange}
                          onRejectChange={handleRejectChange}
                        />
                      )}

                      {activePanel === 'diff' && (
                        <CodeDiffViewer
                          originalCode={originalCode}
                          correctedCode={correctedCode}
                          changes={analysisResult.codeGeneration.changes}
                          language={selectedLanguage}
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

              {/* Initial state */}
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
        ) : (
          /* FILE MANAGEMENT WORKFLOW */
          <div>
            {/* Action Bar for File Management */}
            <div className="mb-6">
              <div className="bg-codestorm-dark rounded-lg border border-codestorm-blue/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* View Toggle */}
                    <div className="flex bg-codestorm-darker rounded-md p-1">
                      <button
                        onClick={() => setActiveView('upload')}
                        className={`px-3 py-2 text-sm rounded transition-colors ${
                          activeView === 'upload'
                            ? 'bg-codestorm-accent text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Upload className="w-4 h-4 mr-2 inline" />
                        Upload
                      </button>
                      <button
                        onClick={() => setActiveView('files')}
                        disabled={fileTree.length === 0}
                        className={`px-3 py-2 text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          activeView === 'files'
                            ? 'bg-codestorm-accent text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <FolderOpen className="w-4 h-4 mr-2 inline" />
                        Files
                      </button>
                      <button
                        onClick={() => setActiveView('diff')}
                        disabled={!currentDiff}
                        className={`px-3 py-2 text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          activeView === 'diff'
                            ? 'bg-codestorm-accent text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <GitCompare className="w-4 h-4 mr-2 inline" />
                        Diff
                      </button>
                    </div>

                    {/* Status */}
                    {fileTree.length > 0 && (
                      <div className="text-sm text-gray-400">
                        {FileDecompressionService.getAllFiles(fileTree).length === 1
                          ? `Individual file loaded: ${fileTree[0]?.name}`
                          : `${FileDecompressionService.getAllFiles(fileTree).length} files loaded from archive`
                        }
                        {modificationHistory.length > 0 && (
                          <span className="ml-2 text-codestorm-accent">
                            • {modificationHistory.length} modifications
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    {fileTree.length > 0 && (
                      <>
                        <button
                          onClick={handleDownloadProject}
                          disabled={isProcessing}
                          className="px-3 py-2 bg-green-600/20 text-green-400 border border-green-600/30 rounded text-sm hover:bg-green-600/30 transition-colors disabled:opacity-50 flex items-center"
                        >
                          {isProcessing ? (
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 mr-2" />
                          )}
                          Download Project
                        </button>

                        <button
                          onClick={() => setShowChat(!showChat)}
                          className={`px-3 py-2 border rounded text-sm transition-colors flex items-center ${
                            showChat
                              ? 'bg-codestorm-accent/20 text-codestorm-accent border-codestorm-accent/30'
                              : 'bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-blue-600/30'
                          }`}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          {showChat ? 'Hide Chat' : 'Show Chat'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* File Management Content */}
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : showChat ? 'grid-cols-12 gap-6' : 'grid-cols-1'}`}>

              {/* Upload View */}
              {activeView === 'upload' && (
                <div className={`${isMobile ? 'col-span-1' : showChat ? 'col-span-8' : 'col-span-1'}`}>
                  <FileUploadZone
                    onFilesExtracted={handleFilesExtracted}
                    onError={handleUploadError}
                    disabled={isUploading}
                    className="h-full"
                  />

                  {uploadError && (
                    <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-red-400 font-medium">Upload Error</h4>
                          <p className="text-red-300 text-sm mt-1">{uploadError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Files View */}
              {activeView === 'files' && (
                <>
                  {/* File Tree */}
                  <div className={`${isMobile ? 'col-span-1' : showChat ? 'col-span-4' : 'col-span-4'}`}>
                    <FileTreeViewer
                      fileTree={fileTree}
                      selectedFile={selectedFile}
                      onFileSelect={handleFileSelect}
                      onToggleDirectory={handleToggleDirectory}
                      className="h-full"
                    />
                  </div>

                  {/* File Content Viewer */}
                  <div className={`${isMobile ? 'col-span-1' : showChat ? 'col-span-4' : 'col-span-8'}`}>
                    <FileContentViewer
                      file={selectedFile}
                      className="h-full"
                      readOnly={true}
                      showLineNumbers={true}
                    />

                    {selectedFile && (
                      <div className="mt-4 flex justify-between space-x-2">
                        <button
                          onClick={handleDownloadFile}
                          className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded text-sm hover:bg-blue-600/30 transition-colors flex items-center"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download File
                        </button>

                        {/* Apply Multi-Agent Analysis to Selected File */}
                        {selectedFile.type === 'file' && typeof selectedFile.content === 'string' && (
                          <button
                            onClick={async () => {
                              setOriginalCode(selectedFile.content as string);
                              setSelectedLanguage(getLanguageFromExtension(selectedFile.extension || ''));
                              await analyzeCodeWithMultiAgent();
                            }}
                            disabled={isProcessing}
                            className="px-3 py-2 bg-codestorm-accent/20 text-codestorm-accent border border-codestorm-accent/30 rounded text-sm hover:bg-codestorm-accent/30 transition-colors flex items-center disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Loader className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Brain className="w-4 h-4 mr-2" />
                            )}
                            Analizar con Multi-Agente
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Diff View */}
              {activeView === 'diff' && currentDiff && (
                <div className={`${isMobile ? 'col-span-1' : showChat ? 'col-span-8' : 'col-span-1'}`}>
                  <FileDiffViewer
                    originalContent={currentDiff.originalContent}
                    modifiedContent={currentDiff.modifiedContent}
                    fileName={currentDiff.fileName}
                    onAcceptChanges={handleAcceptChanges}
                    onRejectChanges={handleRejectChanges}
                    className="h-full"
                    showActions={true}
                  />
                </div>
              )}

              {/* Chat Panel */}
              {showChat && (
                <div className={`${isMobile ? 'col-span-1' : 'col-span-4'}`}>
                  <FileChatModifier
                    selectedFile={selectedFile}
                    onFileModified={handleFileModified}
                    onError={setUploadError}
                    className="h-full"
                    disabled={!selectedFile || selectedFile.type !== 'file'}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        {/* Modification History Panel - Only show in file management mode */}
        {workflowMode === 'file-management' && modificationHistory.length > 0 && (
          <div className="mt-6">
            <div className="bg-codestorm-dark rounded-lg border border-codestorm-blue/30 p-4">
              <h3 className="text-white font-medium mb-4 flex items-center">
                <RotateCcw className="w-5 h-5 mr-2 text-codestorm-accent" />
                Historial de Modificaciones
              </h3>

              <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                {modificationHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-codestorm-blue/10 border border-codestorm-blue/20 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <File className="w-4 h-4 text-blue-400" />
                          <span className="text-white font-medium text-sm">{item.fileName}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{item.explanation}</p>
                      </div>

                      <button
                        onClick={() => {
                          setCurrentDiff({
                            originalContent: item.originalContent,
                            modifiedContent: item.modifiedContent,
                            fileName: item.fileName
                          });
                          setActiveView('diff');
                        }}
                        className="px-2 py-1 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded text-xs hover:bg-blue-600/30 transition-colors"
                      >
                        Ver Diff
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setModificationHistory([])}
                  className="px-3 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded text-sm hover:bg-red-600/30 transition-colors"
                >
                  Limpiar Historial
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Buttons */}
      <FloatingActionButtons
        onToggleChat={handleToggleChat}
        onTogglePreview={handleTogglePreview}
        onToggleCodeModifier={toggleCodeModifier}
        onToggleHelpAssistant={handleToggleHelpAssistant}
        showChat={showChat}
        showCodeModifier={isCodeModifierVisible}
        showHelpAssistant={showHelpAssistant}
      />

      {/* Brand Logo */}
      <BrandLogo size="md" showPulse={true} showGlow={true} />

      {/* Code Modifier Panel */}
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

      {/* Help Assistant */}
      {showHelpAssistant && (
        <HelpAssistant
          onClose={handleToggleHelpAssistant}
          context="codecorrector"
        />
      )}

      <Footer showLogo={true} />
    </div>
  );
};

export default CodeCorrector;
