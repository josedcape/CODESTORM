import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ModelSelector from '../components/ModelSelector';
import InstructionInput from '../components/InstructionInput';
import ProjectStatus from '../components/ProjectStatus';
import FileExplorer from '../components/FileExplorer';
import CodeEditor from '../components/CodeEditor';
import Terminal from '../components/Terminal';
import ProjectPlan from '../components/ProjectPlan';
import AgentStatus from '../components/AgentStatus';
import ChatInterface from '../components/ChatInterface';
import CodePreview from '../components/CodePreview';
import CollapsiblePanel from '../components/CollapsiblePanel';
import FloatingActionButtons from '../components/FloatingActionButtons';
import BrandLogo from '../components/BrandLogo';
import Footer from '../components/Footer';
import CodeModifierPanel from '../components/codemodifier/CodeModifierPanel';
import HelpAssistant from '../components/HelpAssistant';
import IntroAnimation from '../components/IntroAnimation';
import LoadingOverlay from '../components/LoadingOverlay';
import WebTemplateSelector, { WebTemplate } from '../components/webbuilder/WebTemplateSelector';
import ComponentPalette, { WebComponent } from '../components/webbuilder/ComponentPalette';
import VisualEditor from '../components/webbuilder/VisualEditor';
import StyleEditor from '../components/webbuilder/StyleEditor';
import SEOSettings, { SEOSettings as SEOSettingsType } from '../components/webbuilder/SEOSettings';

import WebPreview from '../components/webbuilder/WebPreview';
import WebPageBuilder from '../components/webbuilder/WebPageBuilder';
import WebAIWorkflow from '../components/webbuilder/WebAIWorkflow';
import WebCodeViewer from '../components/webbuilder/WebCodeViewer';
import GenerationSuccessNotification from '../components/webbuilder/GenerationSuccessNotification';
import WebAIResultsPanel from '../components/webbuilder/WebAIResultsPanel';
import { useUI } from '../contexts/UIContext';
import { FileItem, TerminalOutput, ProjectState, AgentTask } from '../types';
import { Menu, Layout, Image, ClipboardEdit, ShoppingCart, Eye, Sparkles } from 'lucide-react';
import AgentCoordinatorService from '../services/AgentCoordinatorService';
import { WebPageGeneratorService } from '../services/WebPageGeneratorService';
import { WebAIWorkflowService } from '../services/WebAIWorkflowService';
import { mergeFilesWithoutDuplicates, removeDuplicateFiles } from '../utils/fileUtils';
import { playSuccessSound, preloadAllSounds } from '../utils/soundUtils';
import '../styles/WebAI.css';

// Componente WebAI especializado en construcción de sitios web estáticos
const WebAI: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Estados específicos para el constructor de sitios web
  const [currentStep, setCurrentStep] = useState<'template' | 'design' | 'content' | 'seo' | 'publish'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<WebTemplate | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<WebComponent[]>([]);
  const [seoSettings, setSeoSettings] = useState<SEOSettingsType | null>(null);
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [showSeoSettings, setShowSeoSettings] = useState(false);

  // Estados para vista previa y archivos generados
  const [showWebPreview, setShowWebPreview] = useState(false);
  const [showCodeViewer, setShowCodeViewer] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [showResultsPanel, setShowResultsPanel] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string>('');
  const [generatedCss, setGeneratedCss] = useState<string>('');
  const [generatedJs, setGeneratedJs] = useState<string>('');
  const [showHelpAssistant, setShowHelpAssistant] = useState(false);

  // Estados para el constructor de páginas web IA
  const [showWebPageBuilder, setShowWebPageBuilder] = useState(false);
  const [showWebAIWorkflow, setShowWebAIWorkflow] = useState(false);
  const [webPageGeneratorService] = useState(() => WebPageGeneratorService.getInstance());

  // Estado para la animación de introducción
  const [showIntro, setShowIntro] = useState<boolean>(false);

  // Estados para el LoadingOverlay
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    currentAgent: '',
    progress: 0,
    message: '',
    canCancel: false
  });

  // Función para completar la animación de introducción
  const completeIntro = () => {
    setShowIntro(false);
    localStorage.setItem('codestorm-intro-seen', 'true');
  };

  // Funciones para manejar el LoadingOverlay
  const startLoading = (agent: string, message: string, canCancel: boolean = false) => {
    setLoadingState({
      isLoading: true,
      currentAgent: agent,
      progress: 0,
      message,
      canCancel
    });
    setIsProcessing(true);
  };

  const updateLoadingProgress = (progress: number, message?: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress,
      message: message || prev.message
    }));
  };

  const stopLoading = () => {
    setLoadingState({
      isLoading: false,
      currentAgent: '',
      progress: 0,
      message: '',
      canCancel: false
    });
    setIsProcessing(false);
  };

  const cancelLoading = () => {
    stopLoading();
    // Aquí se podría añadir lógica adicional para cancelar procesos en curso
  };

  // Comprobar si se debe mostrar la animación de introducción
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('codestorm-intro-seen');
    if (!hasSeenIntro) {
      setShowIntro(true);
    }

    // Precargar sonidos para reproducción rápida
    preloadAllSounds();

    // Inicializar reconocimiento de voz global para WebAI
    console.log('Inicializando reconocimiento de voz en WebAI...');
    import('../utils/voiceInitializer').then(({ initializeVoiceRecognition, cleanupVoiceRecognition }) => {
      initializeVoiceRecognition({
        onStormCommand: (command: string) => {
          console.log('Comando STORM recibido en WebAI:', command);
          handleChatMessage(command);
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

  // Efecto para forzar la renderización de los componentes
  useEffect(() => {
    // Forzar la actualización del DOM para asegurar que los componentes sean visibles
    document.querySelectorAll('.webai-component').forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.display = 'block';
        el.style.visibility = 'visible';
        el.style.opacity = '1';
      }
    });
  }, []);

  // Usar el contexto de UI para la responsividad
  const {
    isSidebarVisible,
    isFileExplorerVisible,
    isTerminalVisible,
    isCodeModifierVisible,
    toggleSidebar,
    toggleFileExplorer,
    toggleTerminal,
    toggleCodeModifier,
    isMobile,
    isTablet,
    expandedPanel
  } = useUI();

  // Estado del proyecto
  const [projectState, setProjectState] = useState<ProjectState>({
    currentModel: 'GPT-4',
    phase: 'planning',
    isGeneratingProject: false,
    files: [],
    terminal: [],
    agentTasks: [],
    orchestrator: false,
    projectPlan: null,
    currentTask: null,
    tasks: [] // Añadido para evitar el error en ProjectStatus
  });

  // Funciones para manejar el estado del proyecto
  const handleSelectModel = (modelId: string) => {
    const modelName = availableModels.find(m => m.id === modelId)?.name || 'GPT-4';
    setProjectState(prev => ({
      ...prev,
      currentModel: modelName
    }));
  };

  const handleSubmitInstruction = (instruction: string) => {
    if (!instruction.trim() || isProcessing) return;

    setIsProcessing(true);

    // Simular procesamiento
    setTimeout(() => {
      // Añadir mensaje a la terminal
      const terminalOutput: TerminalOutput = {
        id: `term-instruction-${Date.now()}`,
        command: `process_instruction "${instruction}"`,
        output: `Procesando instrucción: ${instruction}`,
        timestamp: Date.now(),
        status: 'info' as const,
        analysis: {
          isValid: true,
          summary: 'Procesando instrucción',
          executionTime: 0
        }
      };

      setProjectState(prev => ({
        ...prev,
        terminal: [...prev.terminal, terminalOutput]
      }));

      setIsProcessing(false);
    }, 1500);
  };

  const handleStepComplete = (stepId: string) => {
    console.log('Paso completado:', stepId);
  };

  const handleStepFailed = (stepId: string, reason: string) => {
    console.log('Paso fallido:', stepId, reason);
  };

  const handleTerminalCommand = (command: string) => {
    if (!command.trim()) return;

    // Añadir comando a la terminal
    const terminalOutput: TerminalOutput = {
      id: `term-command-${Date.now()}`,
      command,
      output: `Ejecutando: ${command}`,
      timestamp: Date.now(),
      status: 'info' as const,
      analysis: {
        isValid: true,
        summary: 'Ejecutando comando',
        executionTime: 0
      }
    };

    setProjectState(prev => ({
      ...prev,
      terminal: [...prev.terminal, terminalOutput]
    }));
  };

  // Función para manejar la previsualización del código
  const handleTogglePreview = () => {
    setShowPreview(prev => !prev);
  };

  // Función para manejar el chat
  const handleToggleChat = () => {
    setShowChat(prev => !prev);
  };

  // Función para alternar el asistente de IA
  const handleToggleAssistant = () => {
    setShowAssistant(prev => !prev);
  };

  // Función para manejar el asistente de ayuda
  const handleToggleHelpAssistant = () => {
    setShowHelpAssistant(prev => !prev);
  };

  // Función para manejar la vista previa web
  const handleToggleWebPreview = () => {
    setShowWebPreview(prev => !prev);
  };

  // Función para manejar el constructor de páginas web
  const handleToggleWebPageBuilder = () => {
    setShowWebPageBuilder(prev => !prev);
  };

  // Función para generar página web desde prompt directo
  const handleGenerateFromPrompt = async (prompt: string) => {
    try {
      // Configurar callback de progreso
      webPageGeneratorService.setProgressCallback((progress) => {
        updateLoadingProgress(progress.progress, progress.message);
        setLoadingState(prev => ({ ...prev, currentAgent: progress.currentAgent }));
      });

      // Iniciar loading
      startLoading('ArtistWeb', 'Analizando descripción y generando página web...', true);

      // Parsear el prompt para extraer requisitos automáticamente
      const parsedRequirements = await parsePromptToRequirements(prompt);

      // Generar la página web
      const result = await webPageGeneratorService.generateWebPage(parsedRequirements);

      if (result.success && result.files.length > 0) {
        // Actualizar archivos del proyecto
        const cleanFiles = removeDuplicateFiles(result.files);
        setProjectState(prev => ({
          ...prev,
          files: mergeFilesWithoutDuplicates(prev.files, cleanFiles)
        }));

        // Extraer contenido para vista previa
        const htmlFile = result.files.find(f => f.language === 'html');
        const cssFile = result.files.find(f => f.language === 'css');
        const jsFile = result.files.find(f => f.language === 'javascript');

        if (htmlFile) {
          setGeneratedHtml(htmlFile.content);
          setGeneratedCss(cssFile?.content || '');
          setGeneratedJs(jsFile?.content || '');

          // Reproducir sonido de éxito
          playSuccessSound().then(success => {
            if (success) {
              console.log('🔊 Sonido de éxito reproducido en generación desde prompt');
            }
          });

          // Mostrar automáticamente el panel de resultados
          setShowResultsPanel(true);
          setShowWebPageBuilder(false); // Cerrar el constructor

          console.log('🎉 Página web generada exitosamente:', {
            htmlLines: htmlFile.content.split('\n').length,
            cssLines: (cssFile?.content || '').split('\n').length,
            jsLines: (jsFile?.content || '').split('\n').length
          });
          console.log('🔊 Sonido de éxito reproducido');
        }

        // El constructor ya se cerró arriba

        // Añadir mensaje de éxito a la terminal
        const successOutput = {
          id: `webpage-prompt-success-${Date.now()}`,
          command: 'generate_webpage_from_prompt',
          output: `Página web generada exitosamente desde prompt con ${result.files.length} archivos`,
          timestamp: Date.now(),
          status: 'success' as const,
          analysis: {
            isValid: true,
            summary: 'Página web generada desde prompt con ArtistWeb',
            executionTime: 0
          }
        };

        setProjectState(prev => ({
          ...prev,
          terminal: [...prev.terminal, successOutput]
        }));

      } else {
        throw new Error(result.error || 'Error al generar la página web desde prompt');
      }

    } catch (error) {
      console.error('Error generating web page from prompt:', error);

      // Añadir mensaje de error a la terminal
      const errorOutput = {
        id: `webpage-prompt-error-${Date.now()}`,
        command: 'generate_webpage_from_prompt',
        output: `Error al generar página web desde prompt: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: Date.now(),
        status: 'error' as const,
        analysis: {
          isValid: false,
          summary: 'Error en generación desde prompt',
          executionTime: 0
        }
      };

      setProjectState(prev => ({
        ...prev,
        terminal: [...prev.terminal, errorOutput]
      }));
    } finally {
      stopLoading();
    }
  };

  // Función para parsear prompt a requisitos estructurados
  const parsePromptToRequirements = async (prompt: string): Promise<any> => {
    // Análisis básico del prompt para extraer información
    const requirements = {
      pageTitle: extractPageTitle(prompt),
      pageTheme: extractPageTheme(prompt),
      colorScheme: extractColorScheme(prompt),
      styleRequirements: prompt, // Usar el prompt completo como requisitos de estilo
      targetAudience: extractTargetAudience(prompt)
    };

    return requirements;
  };

  // Funciones auxiliares para extraer información del prompt
  const extractPageTitle = (prompt: string): string => {
    const titlePatterns = [
      /título[:\s]+"([^"]+)"/i,
      /llamada?\s+"([^"]+)"/i,
      /nombre[:\s]+"([^"]+)"/i,
      /para\s+([^,.\n]+)/i
    ];

    for (const pattern of titlePatterns) {
      const match = prompt.match(pattern);
      if (match) return match[1].trim();
    }

    return 'Mi Página Web';
  };

  const extractPageTheme = (prompt: string): string => {
    const themes = [
      { keywords: ['startup', 'empresa', 'negocio', 'corporativo'], theme: 'Sitio web corporativo' },
      { keywords: ['producto', 'landing', 'venta'], theme: 'Landing page de producto' },
      { keywords: ['portafolio', 'portfolio', 'trabajos'], theme: 'Portafolio personal' },
      { keywords: ['servicios', 'consultoría'], theme: 'Página de servicios' },
      { keywords: ['evento', 'conferencia'], theme: 'Sitio de evento' },
      { keywords: ['blog', 'personal'], theme: 'Blog personal' },
      { keywords: ['contacto'], theme: 'Página de contacto' },
      { keywords: ['restaurante', 'comida'], theme: 'Sitio de restaurante' },
      { keywords: ['app', 'aplicación', 'móvil'], theme: 'Página de aplicación móvil' }
    ];

    const lowerPrompt = prompt.toLowerCase();
    for (const { keywords, theme } of themes) {
      if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
        return theme;
      }
    }

    return 'Sitio web corporativo';
  };

  const extractColorScheme = (prompt: string): string => {
    const colorSchemes = [
      { keywords: ['azul', 'blue'], scheme: 'blue-professional' },
      { keywords: ['verde', 'green'], scheme: 'green-modern' },
      { keywords: ['púrpura', 'morado', 'purple'], scheme: 'purple-creative' },
      { keywords: ['naranja', 'orange'], scheme: 'orange-energetic' },
      { keywords: ['rosa', 'pink'], scheme: 'pink-elegant' },
      { keywords: ['gris', 'gray', 'minimalista'], scheme: 'gray-minimal' }
    ];

    const lowerPrompt = prompt.toLowerCase();
    for (const { keywords, scheme } of colorSchemes) {
      if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
        return scheme;
      }
    }

    return 'blue-professional';
  };

  const extractTargetAudience = (prompt: string): string => {
    const audiencePatterns = [
      /audiencia[:\s]+([^,.\n]+)/i,
      /dirigido a\s+([^,.\n]+)/i,
      /para\s+([^,.\n]+)/i,
      /clientes?\s+([^,.\n]+)/i
    ];

    for (const pattern of audiencePatterns) {
      const match = prompt.match(pattern);
      if (match) return match[1].trim();
    }

    return 'Audiencia general';
  };

  // Función para mejorar prompt con ArtistWeb
  const handleEnhancePrompt = async (prompt: string): Promise<{ success: boolean; enhancedPrompt?: string; error?: string }> => {
    try {
      console.log('🎨 Enhancing prompt with ArtistWeb...');

      const result = await webPageGeneratorService.enhancePrompt(prompt);

      if (result.success) {
        // Añadir mensaje de éxito a la terminal
        const successOutput = {
          id: `prompt-enhance-success-${Date.now()}`,
          command: 'enhance_prompt',
          output: `Prompt mejorado exitosamente por ArtistWeb`,
          timestamp: Date.now(),
          status: 'success' as const,
          analysis: {
            isValid: true,
            summary: 'Prompt mejorado con ArtistWeb',
            executionTime: 0
          }
        };

        setProjectState(prev => ({
          ...prev,
          terminal: [...prev.terminal, successOutput]
        }));
      }

      return result;

    } catch (error) {
      console.error('Error enhancing prompt:', error);

      // Añadir mensaje de error a la terminal
      const errorOutput = {
        id: `prompt-enhance-error-${Date.now()}`,
        command: 'enhance_prompt',
        output: `Error al mejorar prompt: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: Date.now(),
        status: 'error' as const,
        analysis: {
          isValid: false,
          summary: 'Error en mejora de prompt',
          executionTime: 0
        }
      };

      setProjectState(prev => ({
        ...prev,
        terminal: [...prev.terminal, errorOutput]
      }));

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  // Función para generar página web con ArtistWeb (workflow guiado)
  const handleGenerateWebPage = async (requirements: any) => {
    try {
      // Configurar callback de progreso
      webPageGeneratorService.setProgressCallback((progress) => {
        updateLoadingProgress(progress.progress, progress.message);
        setLoadingState(prev => ({ ...prev, currentAgent: progress.currentAgent }));
      });

      // Iniciar loading
      startLoading('ArtistWeb', 'Iniciando generación de página web...', true);

      // Generar la página web
      const result = await webPageGeneratorService.generateWebPage(requirements);

      if (result.success && result.files.length > 0) {
        // Actualizar archivos del proyecto
        const cleanFiles = removeDuplicateFiles(result.files);
        setProjectState(prev => ({
          ...prev,
          files: mergeFilesWithoutDuplicates(prev.files, cleanFiles)
        }));

        // Extraer contenido para vista previa
        const htmlFile = result.files.find(f => f.language === 'html');
        const cssFile = result.files.find(f => f.language === 'css');
        const jsFile = result.files.find(f => f.language === 'javascript');

        if (htmlFile) {
          setGeneratedHtml(htmlFile.content);
          setGeneratedCss(cssFile?.content || '');
          setGeneratedJs(jsFile?.content || '');

          // Mostrar automáticamente el panel de resultados
          setShowResultsPanel(true);
          setShowWebPageBuilder(false); // Cerrar el constructor

          console.log('🎉 Página web generada exitosamente desde prompt:', {
            htmlLines: htmlFile.content.split('\n').length,
            cssLines: (cssFile?.content || '').split('\n').length,
            jsLines: (jsFile?.content || '').split('\n').length
          });
        }

        // El constructor ya se cerró arriba

        // Añadir mensaje de éxito a la terminal
        const successOutput = {
          id: `webpage-success-${Date.now()}`,
          command: 'generate_webpage',
          output: `Página web generada exitosamente con ${result.files.length} archivos`,
          timestamp: Date.now(),
          status: 'success' as const,
          analysis: {
            isValid: true,
            summary: 'Página web generada con ArtistWeb',
            executionTime: 0
          }
        };

        setProjectState(prev => ({
          ...prev,
          terminal: [...prev.terminal, successOutput]
        }));

      } else {
        throw new Error(result.error || 'Error al generar la página web');
      }

    } catch (error) {
      console.error('Error generating web page:', error);

      // Añadir mensaje de error a la terminal
      const errorOutput = {
        id: `webpage-error-${Date.now()}`,
        command: 'generate_webpage',
        output: `Error al generar página web: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: Date.now(),
        status: 'error' as const,
        analysis: {
          isValid: false,
          summary: 'Error en generación de página web',
          executionTime: 0
        }
      };

      setProjectState(prev => ({
        ...prev,
        terminal: [...prev.terminal, errorOutput]
      }));
    } finally {
      stopLoading();
    }
  };

  // Función para aplicar cambios del modificador de código
  const handleApplyCodeModifications = (originalFile: FileItem, modifiedFile: FileItem) => {
    // Actualizar el estado con el archivo modificado
    setProjectState(prev => {
      // Encontrar el índice del archivo original
      const fileIndex = prev.files.findIndex(f => f.id === originalFile.id);

      if (fileIndex === -1) return prev;

      // Crear una nueva lista de archivos con el archivo modificado
      const updatedFiles = [...prev.files];
      updatedFiles[fileIndex] = modifiedFile;

      // Añadir mensaje de éxito a la terminal
      const successOutput: TerminalOutput = {
        id: `term-modify-success-${Date.now()}`,
        command: `echo "Archivo ${modifiedFile.path} modificado con éxito"`,
        output: `Archivo ${modifiedFile.path} modificado con éxito mediante el Agente Modificador de Código`,
        timestamp: Date.now(),
        status: 'success' as const,
        analysis: {
          isValid: true,
          summary: 'Archivo modificado con éxito',
          executionTime: Math.floor(Math.random() * 300) + 100
        }
      };

      return {
        ...prev,
        files: updatedFiles,
        terminal: [...prev.terminal, successOutput]
      };
    });
  };

  // Función para manejar los mensajes del chat
  const handleChatMessage = (message: string) => {
    if (!message.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      // Añadir mensaje a la terminal
      const terminalOutput: TerminalOutput = {
        id: `term-chat-${Date.now()}`,
        command: `chat "${message}"`,
        output: `Procesando mensaje: ${message}`,
        timestamp: Date.now(),
        status: 'info' as const,
        analysis: {
          isValid: true,
          summary: 'Procesando mensaje de chat',
          executionTime: 0
        }
      };

      setProjectState(prev => ({
        ...prev,
        terminal: [...prev.terminal, terminalOutput]
      }));

      // Simular procesamiento
      setTimeout(() => {
        setIsProcessing(false);
      }, 1500);
    } catch (error) {
      console.error('Error al procesar el mensaje:', error);

      // Añadir mensaje de error a la terminal
      const errorOutput: TerminalOutput = {
        id: `term-chat-error-${Date.now()}`,
        command: `echo "Error al procesar el mensaje"`,
        output: `Error al procesar el mensaje: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: Date.now(),
        status: 'error' as const,
        analysis: {
          isValid: false,
          summary: 'Error al procesar mensaje de chat',
          executionTime: 0
        }
      };

      setProjectState(prev => ({
        ...prev,
        terminal: [...prev.terminal, errorOutput]
      }));

      setIsProcessing(false);
    }
  };

  // Función para modificar un archivo existente
  const handleModifyFile = (fileId: string, instruction: string) => {
    setIsProcessing(true);

    try {
      const file = projectState.files.find(f => f.id === fileId);
      if (!file) {
        throw new Error(`No se encontró el archivo con ID ${fileId}`);
      }

      // Añadir mensaje a la terminal
      const modifyCommand = `modify_file "${file.path}" "${instruction}"`;
      const terminalOutput: TerminalOutput = {
        id: `term-modify-${Date.now()}`,
        command: modifyCommand,
        output: `Modificando archivo ${file.path}...`,
        timestamp: Date.now(),
        status: 'info' as const,
        analysis: {
          isValid: true,
          summary: 'Modificando archivo',
          executionTime: 0
        }
      };

      setProjectState(prev => ({
        ...prev,
        terminal: [...prev.terminal, terminalOutput]
      }));

      // Simular modificación del archivo
      setTimeout(() => {
        // Actualizar el estado con el archivo modificado
        setProjectState(prev => {
          // Encontrar el índice del archivo original
          const fileIndex = prev.files.findIndex(f => f.id === fileId);

          if (fileIndex === -1) return prev;

          // Crear una nueva lista de archivos con el archivo modificado
          const updatedFiles = [...prev.files];

          // Simular un archivo modificado
          const modifiedFile = {
            ...file,
            content: `// Archivo modificado según instrucción: ${instruction}\n${file.content}`,
            lastModified: Date.now()
          };

          updatedFiles[fileIndex] = modifiedFile;

          // Añadir mensaje de éxito a la terminal
          const successOutput: TerminalOutput = {
            id: `term-modify-success-${Date.now()}`,
            command: `echo "Archivo ${file.path} modificado con éxito"`,
            output: `Archivo ${file.path} modificado con éxito`,
            timestamp: Date.now(),
            status: 'success' as const,
            analysis: {
              isValid: true,
              summary: 'Archivo modificado con éxito',
              executionTime: Math.floor(Math.random() * 300) + 100
            }
          };

          return {
            ...prev,
            files: updatedFiles,
            terminal: [...prev.terminal, successOutput]
          };
        });

        setIsProcessing(false);
      }, 2000);
    } catch (error) {
      console.error('Error al modificar el archivo:', error);

      // Añadir mensaje de error a la terminal
      const errorOutput: TerminalOutput = {
        id: `term-modify-error-${Date.now()}`,
        command: `echo "Error al modificar el archivo"`,
        output: `Error al modificar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: Date.now(),
        status: 'error' as const,
        analysis: {
          isValid: false,
          summary: 'Error al modificar archivo',
          executionTime: 0
        }
      };

      setProjectState(prev => ({
        ...prev,
        terminal: [...prev.terminal, errorOutput]
      }));

      setIsProcessing(false);
    }
  };

  // Funciones específicas para el constructor de sitios web
  const handleSelectTemplate = (template: WebTemplate) => {
    setSelectedTemplate(template);
    setCurrentStep('design');
  };

  const handleAddComponent = (component: WebComponent) => {
    setSelectedComponents(prev => [...prev, component]);
  };

  const handleAddComponents = (components: WebComponent[]) => {
    setSelectedComponents(prev => [...prev, ...components]);
  };

  const handleRemoveComponent = (componentId: string) => {
    setSelectedComponents(prev => prev.filter(comp => comp.id !== componentId));
  };

  const handleMoveComponent = (componentId: string, direction: 'up' | 'down') => {
    setSelectedComponents(prev => {
      const index = prev.findIndex(comp => comp.id === componentId);
      if (index === -1) return prev;

      const newComponents = [...prev];
      if (direction === 'up' && index > 0) {
        // Mover hacia arriba
        [newComponents[index - 1], newComponents[index]] = [newComponents[index], newComponents[index - 1]];
      } else if (direction === 'down' && index < prev.length - 1) {
        // Mover hacia abajo
        [newComponents[index], newComponents[index + 1]] = [newComponents[index + 1], newComponents[index]];
      }

      return newComponents;
    });
  };

  const handleApplyStyles = (styles: any) => {
    console.log('Aplicando estilos:', styles);
    // Implementar la lógica para aplicar estilos
  };

  const handleSaveSeoSettings = (settings: SEOSettingsType) => {
    setSeoSettings(settings);
    console.log('Configuración SEO guardada:', settings);
  };

  const handleViewCode = () => {
    console.log('🔍 Abriendo visor de código generado');
    setShowCodeViewer(true);
  };

  const handleToggleCodeViewer = () => {
    setShowCodeViewer(prev => !prev);
  };

  // Función para descargar el sitio web completo
  const handleDownloadWebsite = () => {
    const combinedContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mi Sitio Web - Generado por CODESTORM</title>
  <style>
${generatedCss}
  </style>
</head>
<body>
${generatedHtml}
  <script>
${generatedJs}
  </script>
</body>
</html>`;

    const blob = new Blob([combinedContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mi-sitio-web-completo.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📥 Sitio web descargado exitosamente');
  };

  // Función para obtener estadísticas del código generado
  const getGeneratedCodeStats = () => {
    return {
      htmlLines: generatedHtml.split('\n').length,
      cssLines: generatedCss.split('\n').length,
      jsLines: generatedJs.split('\n').length
    };
  };

  // Función para manejar el regreso desde el panel de resultados
  const handleBackFromResults = () => {
    setShowResultsPanel(false);
    setShowWebPageBuilder(true);
    // Limpiar los datos generados si se desea
    // setGeneratedHtml('');
    // setGeneratedCss('');
    // setGeneratedJs('');
  };

  // Función para iniciar una nueva generación desde el panel de resultados
  const handleNewGenerationFromResults = () => {
    setShowResultsPanel(false);
    setShowWebPageBuilder(true);
    // Limpiar los datos generados
    setGeneratedHtml('');
    setGeneratedCss('');
    setGeneratedJs('');
    console.log('🆕 Iniciando nueva generación desde panel de resultados');
  };

  // Funciones para el nuevo WebAI Workflow
  const handleStartWebAIWorkflow = () => {
    setShowWebAIWorkflow(true);
    setShowWebPageBuilder(false);
    setShowResultsPanel(false);
  };

  const handleBackFromWebAIWorkflow = () => {
    setShowWebAIWorkflow(false);
  };

  const handleWebAIFilesGenerated = (files: FileItem[]) => {
    // Actualizar el estado del proyecto con los archivos generados
    setProjectState(prev => ({
      ...prev,
      files: mergeFilesWithoutDuplicates(prev.files, files)
    }));

    // Extraer contenido para vista previa
    const htmlFile = files.find(file => file.name === 'index.html');
    const cssFile = files.find(file => file.name === 'styles.css');
    const jsFile = files.find(file => file.name === 'script.js');

    if (htmlFile) {
      setGeneratedHtml(htmlFile.content);
    }
    if (cssFile) {
      setGeneratedCss(cssFile.content);
    }
    if (jsFile) {
      setGeneratedJs(jsFile.content);
    }

    // Activar vista previa automáticamente si hay archivos HTML
    if (htmlFile) {
      handleAutoPreview(
        htmlFile.content,
        cssFile?.content || '',
        jsFile?.content || ''
      );
    }

    // Reproducir sonido de éxito
    playSuccessSound().then(success => {
      if (success) {
        console.log('🔊 Sonido de éxito reproducido en WebAI Workflow');
      }
    });

    // Mostrar panel de resultados
    setShowWebAIWorkflow(false);
    setShowResultsPanel(true);
    setShowSuccessNotification(true);

    console.log('🎉 Archivos generados por WebAI Workflow:', files.map(f => f.name));
    console.log('🔍 Vista previa activada automáticamente para WebAI');
    console.log('🔊 Sonido de éxito reproducido');
  };

  const handleWebAIChatMessage = (message: ChatMessage) => {
    // Añadir mensaje al chat
    setChatMessages(prev => [...prev, message]);
  };

  const handlePublishWebsite = () => {
    // Implementar la lógica para publicar el sitio web
    console.log('Publicar sitio web');
  };

  // Función para manejar la vista previa automática
  const handleAutoPreview = (html: string, css: string, js: string) => {
    console.log('🔍 Activando vista previa automática:', {
      htmlLength: html.length,
      cssLength: css.length,
      jsLength: js.length,
      htmlPreview: html.substring(0, 200) + '...'
    });

    setGeneratedHtml(html);
    setGeneratedCss(css);
    setGeneratedJs(js);

    // Activar vista previa automáticamente a través del panel de resultados
    setShowResultsPanel(true);
    setShowWebPreview(false); // Asegurar que no hay conflictos
    setShowWebAIWorkflow(false);
    setShowWebPageBuilder(false);

    console.log('✅ Vista previa activada a través del panel de resultados');
  };

  // Función para manejar archivos actualizados desde el chat
  const handleFilesUpdated = (files: FileItem[]) => {
    // Usar utilidades para evitar duplicados
    const cleanFiles = removeDuplicateFiles(files);

    // Actualizar el estado del proyecto con los nuevos archivos sin duplicados
    setProjectState(prev => ({
      ...prev,
      files: mergeFilesWithoutDuplicates(prev.files, cleanFiles)
    }));

    // Extraer contenido para vista previa automática
    const htmlFile = files.find(file =>
      file.path.endsWith('.html') &&
      (file.path === 'index.html' || file.path.includes('index'))
    );
    const cssFile = files.find(file =>
      file.path.endsWith('.css') &&
      (file.path === 'styles.css' || file.path.includes('style'))
    );
    const jsFile = files.find(file =>
      file.path.endsWith('.js') &&
      (file.path === 'script.js' || file.path.includes('script'))
    );

    // Si encontramos archivos, activar vista previa automática
    if (htmlFile) {
      handleAutoPreview(
        htmlFile.content,
        cssFile?.content || generatedCss,
        jsFile?.content || generatedJs
      );
    }

    console.log('📁 Archivos actualizados desde el chat:', files.map(f => f.path));
  };

  // Funciones específicas para el asistente de IA
  const handleGenerateWebsite = async (description: string) => {
    setWebsiteDescription(description);

    // Iniciar el LoadingOverlay
    startLoading('Agente Coordinador', 'Iniciando generación del sitio web...', true);

    try {
      // Iniciar el proceso de generación con el coordinador de agentes
      const coordinator = AgentCoordinatorService.getInstance();

      // Configurar listener para recibir actualizaciones de progreso
      const listener = {
        onTaskUpdate: (tasks: any[]) => {
          // Encontrar la tarea principal del coordinador
          const mainTask = tasks.find(task => task.agentType === 'coordinator');
          if (mainTask) {
            const progress = mainTask.progress || 0;
            let message = 'Procesando...';
            let agent = 'Agente Coordinador';

            // Determinar el mensaje y agente basado en las subtareas
            if (mainTask.subtasks && mainTask.subtasks.length > 0) {
              const currentSubtask = mainTask.subtasks.find(subtask => subtask.status === 'working');
              if (currentSubtask) {
                if (currentSubtask.agentType === 'design') {
                  agent = 'Agente de Diseño';
                  message = 'Generando propuesta de diseño...';
                } else if (currentSubtask.agentType === 'code') {
                  agent = 'Agente de Código';
                  message = 'Generando código del sitio web...';
                }
              } else {
                // Si no hay subtareas activas, verificar si hay completadas
                const completedDesign = mainTask.subtasks.find(subtask =>
                  subtask.agentType === 'design' && subtask.status === 'completed'
                );
                const completedCode = mainTask.subtasks.find(subtask =>
                  subtask.agentType === 'code' && subtask.status === 'completed'
                );

                if (completedDesign && !completedCode) {
                  agent = 'Agente de Código';
                  message = 'Iniciando generación de código...';
                } else if (completedDesign && completedCode) {
                  agent = 'Agente Coordinador';
                  message = 'Finalizando generación...';
                }
              }
            }

            updateLoadingProgress(progress, message);
            setLoadingState(prev => ({ ...prev, currentAgent: agent }));
          }
        },
        onFilesGenerated: (files: any[]) => {
          console.log('📁 Archivos generados:', files.length);
          // Activar vista previa automática cuando se generen archivos
          handleFilesUpdated(files);
        },
        onDesignProposalUpdate: (proposal: any) => {
          if (proposal) {
            updateLoadingProgress(50, 'Propuesta de diseño completada');
          }
        },
        onError: (error: string) => {
          console.error('Error del coordinador:', error);
          stopLoading();
        }
      };

      // Registrar el listener
      coordinator.addListener(listener);

      try {
        // Ejecutar la generación
        const result = await coordinator.generateWebsite(description);

        // Remover el listener
        coordinator.removeListener(listener);

        // Si hay archivos generados, actualizar el estado
        if (result.files && result.files.length > 0) {
          // Buscar el archivo HTML principal
          const htmlFile = result.files.find(file => file.path.endsWith('.html'));
          const cssFile = result.files.find(file => file.path.endsWith('.css'));
          const jsFile = result.files.find(file => file.path.endsWith('.js'));

          if (htmlFile) {
            setGeneratedHtml(htmlFile.content);
          }

          if (cssFile) {
            setGeneratedCss(cssFile.content);
          }

          if (jsFile) {
            setGeneratedJs(jsFile.content);
          }

          // Actualizar el estado del proyecto con los archivos generados sin duplicados
          const cleanResultFiles = removeDuplicateFiles(result.files);
          setProjectState(prev => ({
            ...prev,
            files: mergeFilesWithoutDuplicates(prev.files, cleanResultFiles)
          }));

          // Mostrar automáticamente el panel de resultados
          setShowResultsPanel(true);

          console.log('🎉 Página web generada exitosamente desde Constructor:', {
            totalFiles: cleanResultFiles.length,
            htmlContent: htmlFile ? 'Generado' : 'No disponible',
            cssContent: cssFile ? 'Generado' : 'No disponible',
            jsContent: jsFile ? 'Generado' : 'No disponible'
          });
        }

        // Si hay una propuesta de diseño, actualizar el estado
        if (result.designProposal) {
          // Buscar una plantilla que coincida con el tipo de sitio
          const templateType = result.designProposal.siteType || 'general';
          const matchedTemplate = availableTemplates.find(t =>
            t.category.toLowerCase().includes(templateType) ||
            templateType.includes(t.category.toLowerCase())
          );

          if (matchedTemplate) {
            setSelectedTemplate(matchedTemplate);
          }

          // Convertir los componentes de la propuesta a componentes de WebAI
          const webComponents = result.designProposal.components.map(component => {
            // Buscar un componente que coincida con el tipo
            const matchedComponent = availableComponents.find(c =>
              c.category.toLowerCase().includes(component.type) ||
              component.type.includes(c.category.toLowerCase())
            );

            if (matchedComponent) {
              return matchedComponent;
            }

            // Si no hay coincidencia, crear un componente genérico
            return {
              id: component.id,
              name: component.name,
              category: component.type,
              icon: <div className="h-4 w-4 bg-codestorm-blue rounded-full"></div>,
              description: component.description
            };
          });

          // Actualizar los componentes seleccionados
          setSelectedComponents(webComponents);
        }

        // Completar el progreso
        updateLoadingProgress(100, 'Sitio web generado exitosamente');

        // Esperar un momento antes de ocultar el loading
        setTimeout(() => {
          stopLoading();
        }, 1500);

      } catch (coordinatorError) {
        // Remover el listener en caso de error
        coordinator.removeListener(listener);
        throw coordinatorError;
      }

    } catch (error) {
      console.error('Error al generar el sitio web:', error);

      // Añadir mensaje de error a la terminal
      const errorOutput: TerminalOutput = {
        id: `term-generate-error-${Date.now()}`,
        command: `echo "Error al generar el sitio web"`,
        output: `Error al generar el sitio web: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: Date.now(),
        status: 'error' as const,
        analysis: {
          isValid: false,
          summary: 'Error al generar sitio web',
          executionTime: 0
        }
      };

      setProjectState(prev => ({
        ...prev,
        terminal: [...prev.terminal, errorOutput]
      }));

      // Detener el loading en caso de error
      stopLoading();
    }
  };

  // Lista de modelos disponibles
  const availableModels = [
    {
      id: 'gpt4',
      name: 'GPT-4',
      description: 'Modelo avanzado de OpenAI con razonamiento complejo',
      strengths: ['Razonamiento', 'Instrucciones complejas', 'Conocimiento general'],
      icon: 'Sparkles'
    },
    {
      id: 'claude',
      name: 'Claude 3 Opus',
      description: 'Modelo de Anthropic con capacidades de razonamiento y análisis',
      strengths: ['Análisis', 'Seguridad', 'Contexto extenso'],
      icon: 'Bot'
    }
  ];

  // Lista de plantillas disponibles
  const availableTemplates = [
    {
      id: 'template-1',
      name: 'Business Pro',
      category: 'business',
      tags: ['profesional', 'corporativo', 'moderno'],
      thumbnail: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Business+Pro',
      description: 'Plantilla profesional para empresas con diseño moderno y secciones para servicios, equipo y testimonios.'
    },
    {
      id: 'template-2',
      name: 'Creative Portfolio',
      category: 'portfolio',
      tags: ['creativo', 'diseño', 'artístico'],
      thumbnail: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Creative+Portfolio',
      description: 'Muestra tus trabajos creativos con esta plantilla de portafolio elegante y minimalista.'
    },
    {
      id: 'template-3',
      name: 'E-commerce Store',
      category: 'ecommerce',
      tags: ['tienda', 'productos', 'ventas'],
      thumbnail: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=E-commerce+Store',
      description: 'Plantilla completa para tiendas online con catálogo de productos, carrito de compras y proceso de pago.'
    }
  ];

  // Lista de componentes disponibles
  const availableComponents = [
    {
      id: 'navbar',
      name: 'Barra de navegación',
      category: 'navigation',
      icon: <Menu className="h-4 w-4" />,
      description: 'Barra de navegación principal con logo y enlaces.'
    },
    {
      id: 'section',
      name: 'Sección',
      category: 'layout',
      icon: <Layout className="h-4 w-4" />,
      description: 'Contenedor principal para organizar el contenido en secciones.'
    },
    {
      id: 'gallery',
      name: 'Galería',
      category: 'media',
      icon: <Image className="h-4 w-4" />,
      description: 'Galería de imágenes con diseño grid o carrusel.'
    },
    {
      id: 'contact-form',
      name: 'Formulario de contacto',
      category: 'forms',
      icon: <ClipboardEdit className="h-4 w-4" />,
      description: 'Formulario de contacto con campos personalizables.'
    },
    {
      id: 'product-grid',
      name: 'Cuadrícula de productos',
      category: 'ecommerce',
      icon: <ShoppingCart className="h-4 w-4" />,
      description: 'Muestra productos en una cuadrícula con imágenes, títulos y precios.'
    },
    {
      id: 'footer',
      name: 'Pie de página',
      category: 'navigation',
      icon: <Menu className="h-4 w-4" />,
      description: 'Pie de página con enlaces, información de contacto y derechos de autor.'
    }
  ];

  // Obtener el archivo seleccionado
  const selectedFile = selectedFileId
    ? projectState.files.find(file => file.id === selectedFileId)
    : null;

  return (
    <div className="min-h-screen bg-codestorm-darker flex flex-col webai-component">
      {/* Animación de introducción */}
      {showIntro && <IntroAnimation onComplete={completeIntro} />}

      <Header
        onPreviewClick={handleTogglePreview}
        onChatClick={handleToggleChat}
        showConstructorButton={true}
      />

      <main className="flex-1 container mx-auto py-4 px-4 webai-component">
        {/* Título de la página */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Constructor de Sitios Web Estáticos</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Crea sitios web estáticos profesionales con HTML5, CSS3 y JavaScript vanilla. Optimizados para SEO, accesibilidad y rendimiento ultra-rápido.
          </p>

          {/* Botones de modo */}
          <div className="flex justify-center mt-4 space-x-6">
            <button
              onClick={() => setShowWebPageBuilder(false)}
              className={`px-6 py-3 rounded-lg transition-all duration-200 font-medium ${
                !showWebPageBuilder
                  ? 'bg-codestorm-blue text-white shadow-lg'
                  : 'bg-codestorm-dark text-gray-300 hover:bg-codestorm-blue/20'
              }`}
            >
              📋 Modo Manual
            </button>
            <button
              onClick={() => setShowWebPageBuilder(true)}
              className={`px-6 py-3 rounded-lg transition-all duration-200 font-medium ${
                showWebPageBuilder
                  ? 'bg-gradient-to-r from-codestorm-blue to-purple-600 text-white shadow-lg'
                  : 'bg-codestorm-dark text-gray-300 hover:bg-gradient-to-r hover:from-codestorm-blue/20 hover:to-purple-600/20'
              }`}
            >
              🎨 Página Web IA
            </button>
          </div>
        </div>

        {/* Indicador de pasos (solo visible en modo manual) */}
        {!showWebPageBuilder && (
          <div className="mb-8">
            <div className="flex justify-center items-center">
              <div className={`flex items-center ${currentStep === 'template' ? 'text-codestorm-blue' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'template' ? 'bg-codestorm-blue text-white' : 'bg-codestorm-dark text-gray-400'}`}>1</div>
                <span className="ml-2">Plantilla</span>
              </div>
              <div className="w-12 h-1 mx-2 bg-codestorm-dark"></div>
              <div className={`flex items-center ${currentStep === 'design' ? 'text-codestorm-blue' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'design' ? 'bg-codestorm-blue text-white' : 'bg-codestorm-dark text-gray-400'}`}>2</div>
                <span className="ml-2">Diseño</span>
              </div>
              <div className="w-12 h-1 mx-2 bg-codestorm-dark"></div>
              <div className={`flex items-center ${currentStep === 'content' ? 'text-codestorm-blue' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'content' ? 'bg-codestorm-blue text-white' : 'bg-codestorm-dark text-gray-400'}`}>3</div>
                <span className="ml-2">Contenido</span>
              </div>
              <div className="w-12 h-1 mx-2 bg-codestorm-dark"></div>
              <div className={`flex items-center ${currentStep === 'seo' ? 'text-codestorm-blue' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'seo' ? 'bg-codestorm-blue text-white' : 'bg-codestorm-dark text-gray-400'}`}>4</div>
                <span className="ml-2">SEO</span>
              </div>
              <div className="w-12 h-1 mx-2 bg-codestorm-dark"></div>
              <div className={`flex items-center ${currentStep === 'publish' ? 'text-codestorm-blue' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'publish' ? 'bg-codestorm-blue text-white' : 'bg-codestorm-dark text-gray-400'}`}>5</div>
                <span className="ml-2">Publicar</span>
              </div>
            </div>
          </div>
        )}

        {/* Panel de Resultados de Generación */}
        {showResultsPanel ? (
          <div className="grid grid-cols-12 gap-4 webai-component">
            <div className="col-span-12 h-[700px]">
              <WebAIResultsPanel
                html={generatedHtml}
                css={generatedCss}
                js={generatedJs}
                onBack={handleBackFromResults}
                onNewGeneration={handleNewGenerationFromResults}
              />
            </div>
          </div>
        ) : showWebAIWorkflow ? (
          <div className="grid grid-cols-12 gap-4 webai-component">
            <div className="col-span-12 h-[700px]">
              <WebAIWorkflow
                onBack={handleBackFromWebAIWorkflow}
                onFilesGenerated={handleWebAIFilesGenerated}
                onChatMessage={handleWebAIChatMessage}
              />
            </div>
          </div>
        ) : showWebPageBuilder ? (
          <div className="grid grid-cols-12 gap-4 webai-component">
            <div className="col-span-12 h-[700px]">
              <WebPageBuilder
                onGeneratePage={handleGenerateWebPage}
                onGenerateFromPrompt={handleGenerateFromPrompt}
                onEnhancePrompt={handleEnhancePrompt}
                onBack={() => setShowWebPageBuilder(false)}
                isProcessing={isProcessing}
                onFilesGenerated={(files) => {
                  console.log('Files generated from unified planning:', files);
                  // Convert files to the expected format
                  const htmlFile = files.find(f => f.type === 'html');
                  const cssFile = files.find(f => f.type === 'css');
                  const jsFile = files.find(f => f.type === 'javascript');

                  if (htmlFile) setGeneratedHtml(htmlFile.content);
                  if (cssFile) setGeneratedCss(cssFile.content);
                  if (jsFile) setGeneratedJs(jsFile.content);

                  // Show results panel
                  setShowWebPageBuilder(false);
                  setShowResultsPanel(true);
                  setShowSuccessNotification(true);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-4 webai-component">
            {/* Opciones principales para generar página web */}
            {!showWebPageBuilder && !showWebAIWorkflow && !showResultsPanel && (
              <div className="col-span-12 flex items-center justify-center h-[500px]">
                <div className="text-center space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-white">Constructor de Sitios Web con IA</h2>
                    <p className="text-gray-300 text-lg max-w-3xl">
                      Crea sitios web profesionales usando inteligencia artificial.
                      Elige el método que mejor se adapte a tu estilo de trabajo.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {/* WebAI Workflow - Nuevo método recomendado */}
                    <div className="bg-codestorm-darker rounded-lg p-6 border border-purple-600/50 hover:border-purple-600 transition-all duration-200">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">WebAI Workflow</h3>
                            <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">RECOMENDADO</span>
                          </div>
                        </div>

                        <p className="text-gray-300 text-sm">
                          Nuevo flujo inteligente con aprobación de planes, mejora de prompts y generación coordinada de agentes especializados.
                        </p>

                        <ul className="space-y-2 text-sm text-gray-300">
                          <li className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span>Mejora automática de prompts</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span>Aprobación de planes detallados</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span>Generación coordinada de archivos</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span>HTML, CSS y JS profesionales</span>
                          </li>
                        </ul>

                        <button
                          onClick={handleStartWebAIWorkflow}
                          className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-600/80 hover:to-blue-600/80 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg"
                        >
                          <Sparkles className="h-5 w-5" />
                          <span>Iniciar WebAI Workflow</span>
                        </button>
                      </div>
                    </div>

                    {/* Método clásico */}
                    <div className="bg-codestorm-darker rounded-lg p-6 border border-gray-700 hover:border-codestorm-blue transition-all duration-200">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-codestorm-blue to-green-600 rounded-lg flex items-center justify-center">
                            <Layout className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">Método Clásico</h3>
                            <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded-full">TRADICIONAL</span>
                          </div>
                        </div>

                        <p className="text-gray-300 text-sm">
                          Método original con formularios guiados o prompts directos. Ideal para usuarios que prefieren el control manual.
                        </p>

                        <ul className="space-y-2 text-sm text-gray-300">
                          <li className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-codestorm-blue rounded-full"></div>
                            <span>Formularios paso a paso</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Prompts directos</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Generación inmediata</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span>Control manual completo</span>
                          </li>
                        </ul>

                        <button
                          onClick={() => setShowWebPageBuilder(true)}
                          className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-codestorm-blue to-green-600 hover:from-codestorm-blue/80 hover:to-green-600/80 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg"
                        >
                          <Layout className="h-5 w-5" />
                          <span>Usar Método Clásico</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-8 text-sm text-gray-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>ArtistWeb (Claude)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>CodeGenerator (GPT-4O)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Planner (Claude)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contenido según el paso actual */}
            {currentStep === 'template' && (
              <div className="col-span-12">
                <WebTemplateSelector onSelectTemplate={handleSelectTemplate} />
              </div>
            )}

            {currentStep === 'design' && (
              <>
                {/* Panel de componentes */}
                <div className="col-span-12 md:col-span-3">
                  <ComponentPalette onSelectComponent={handleAddComponent} />
                </div>

                {/* Editor visual */}
                <div className="col-span-12 md:col-span-6">
                  <VisualEditor
                    selectedComponents={selectedComponents}
                    onAddComponent={handleAddComponent}
                    onRemoveComponent={handleRemoveComponent}
                    onMoveComponent={handleMoveComponent}
                    onPreview={handleTogglePreview}
                    onSave={() => setCurrentStep('content')}
                    onViewCode={handleViewCode}
                  />
                </div>

                {/* Editor de estilos */}
                <div className="col-span-12 md:col-span-3">
                  <StyleEditor onApplyStyles={handleApplyStyles} />
                </div>
              </>
            )}

            {currentStep === 'seo' && (
              <div className="col-span-12 md:col-span-8 md:col-start-3">
                <SEOSettings onSaveSettings={handleSaveSeoSettings} />
              </div>
            )}

            {currentStep === 'publish' && (
              <div className="col-span-12 md:col-span-8 md:col-start-3 bg-codestorm-darker rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Publicar tu sitio web</h2>
                <p className="text-gray-300 mb-6">Tu sitio web está listo para ser publicado. Revisa los detalles y haz clic en el botón para publicarlo.</p>

                <div className="bg-codestorm-dark rounded-md p-4 mb-6">
                  <h3 className="text-lg font-medium text-white mb-2">Detalles del sitio</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Plantilla:</span>
                      <span className="text-white">{selectedTemplate?.name || 'No seleccionada'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Componentes:</span>
                      <span className="text-white">{selectedComponents.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">SEO:</span>
                      <span className="text-white">{seoSettings ? 'Configurado' : 'No configurado'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handlePublishWebsite}
                    className="bg-codestorm-blue hover:bg-codestorm-blue/80 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200"
                  >
                    Publicar sitio web
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Vista previa del código */}
      {showPreview && (
        <CodePreview
          files={projectState.files}
          onClose={handleTogglePreview}
        />
      )}

      {/* Vista previa web */}
      {showWebPreview && (
        <WebPreview
          html={generatedHtml}
          css={generatedCss}
          js={generatedJs}
          onClose={handleToggleWebPreview}
          onRefresh={() => console.log('Actualizando vista previa')}
          onViewCode={handleViewCode}
        />
      )}

      {/* Visor de código */}
      {showCodeViewer && (
        <WebCodeViewer
          html={generatedHtml}
          css={generatedCss}
          js={generatedJs}
          onClose={handleToggleCodeViewer}
          onPreview={() => setShowWebPreview(true)}
        />
      )}

      {/* Notificación de éxito */}
      <GenerationSuccessNotification
        isVisible={showSuccessNotification}
        onViewPreview={() => setShowWebPreview(true)}
        onViewCode={() => setShowCodeViewer(true)}
        onDownload={handleDownloadWebsite}
        onClose={() => setShowSuccessNotification(false)}
        stats={generatedHtml ? getGeneratedCodeStats() : undefined}
      />

      {/* Panel de modificación de código */}
      <CodeModifierPanel
        isVisible={isCodeModifierVisible}
        onClose={toggleCodeModifier}
        files={projectState.files}
        onApplyChanges={handleApplyCodeModifications}
      />

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

      {/* Pie de página */}
      <Footer showLogo={true} />

      {/* LoadingOverlay */}
      <LoadingOverlay
        isVisible={loadingState.isLoading}
        currentAgent={loadingState.currentAgent}
        progress={loadingState.progress}
        message={loadingState.message}
        canCancel={loadingState.canCancel}
        onCancel={cancelLoading}
      />

      {/* Asistente de ayuda */}
      <HelpAssistant
        isOpen={showHelpAssistant}
        onClose={handleToggleHelpAssistant}
      />
    </div>
  );
};

export default WebAI;
