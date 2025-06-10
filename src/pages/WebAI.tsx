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
import AIModelManager from '../services/AIModelManager';
import UniversalFloatingButtons from '../components/common/UniversalFloatingButtons';
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
import WebAIAssistantSimple from '../components/webbuilder/WebAIAssistantSimple';
import WebPreview from '../components/webbuilder/WebPreview';
import { useUI } from '../contexts/UIContext';
import { FileItem, TerminalOutput, ProjectState, AgentTask } from '../types';
import { Menu, Layout, Image, ClipboardEdit, ShoppingCart, Eye } from 'lucide-react';
import AgentCoordinatorService from '../services/AgentCoordinatorService';
import { mergeFilesWithoutDuplicates, removeDuplicateFiles } from '../utils/fileUtils';
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

  // Estados para el asistente de IA
  const [showAssistant, setShowAssistant] = useState(false);
  const [showWebPreview, setShowWebPreview] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string>('');
  const [generatedCss, setGeneratedCss] = useState<string>('');
  const [generatedJs, setGeneratedJs] = useState<string>('');
  const [showHelpAssistant, setShowHelpAssistant] = useState(false);
  const [websiteDescription, setWebsiteDescription] = useState<string>('');

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
    currentModel: 'Gemini 1.5 Pro',
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
    const modelName = availableModels.find(m => m.id === modelId)?.name || 'Gemini 1.5 Pro';
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
    // Implementar la lógica para ver el código generado
    console.log('Ver código generado');
  };

  const handlePublishWebsite = () => {
    // Implementar la lógica para publicar el sitio web
    console.log('Publicar sitio web');
  };

  // Función para manejar la vista previa automática
  const handleAutoPreview = (html: string, css: string, js: string) => {
    setGeneratedHtml(html);
    setGeneratedCss(css);
    setGeneratedJs(js);

    // Activar vista previa automáticamente
    setShowWebPreview(true);

    console.log('🔍 Vista previa activada automáticamente:', {
      htmlLength: html.length,
      cssLength: css.length,
      jsLength: js.length
    });
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

          // Mostrar la vista previa
          setShowWebPreview(true);
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

  // Inicializar el gestor de modelos
  const [modelManager] = useState(() => AIModelManager.getInstance());
  const [availableModels, setAvailableModels] = useState(modelManager.getAvailableModels());
  const [selectedModel, setSelectedModel] = useState(modelManager.getSelectedModel());
  const [modelNotification, setModelNotification] = useState<string | null>(null);

  // Actualizar modelos cuando cambie el estado
  useEffect(() => {
    const updateModels = () => {
      setAvailableModels(modelManager.getAvailableModels());
    };

    // Actualizar cada 30 segundos para verificar estado de modelos
    const interval = setInterval(updateModels, 30000);
    return () => clearInterval(interval);
  }, [modelManager]);

  // Manejar cambio de modelo
  const handleModelChange = (modelId: string) => {
    try {
      modelManager.setSelectedModel(modelId);
      setSelectedModel(modelId);

      const model = availableModels.find(m => m.id === modelId);
      setModelNotification(`🤖 Cambiado a ${model?.name}`);

      // Limpiar notificación después de 3 segundos
      setTimeout(() => setModelNotification(null), 3000);

      console.log(`🔄 Modelo cambiado a: ${model?.name}`);
    } catch (error) {
      console.error('Error al cambiar modelo:', error);
      setModelNotification(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setTimeout(() => setModelNotification(null), 5000);
    }
  };

  // Manejar actualización de estado de modelo
  const handleModelStatusUpdate = (modelId: string, status: 'available' | 'unavailable' | 'limited') => {
    modelManager.updateModelStatus(modelId, status);
    setAvailableModels(modelManager.getAvailableModels());

    const model = availableModels.find(m => m.id === modelId);
    const statusText = status === 'available' ? 'disponible' : status === 'limited' ? 'limitado' : 'no disponible';
    setModelNotification(`📊 ${model?.name} ahora está ${statusText}`);
    setTimeout(() => setModelNotification(null), 3000);
  };

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
        {/* Notificación de cambio de modelo */}
        {modelNotification && (
          <div className="fixed top-20 right-6 bg-codestorm-blue text-white p-4 rounded-lg shadow-lg z-50 max-w-sm animate-slide-in">
            <div className="flex items-center">
              <div className="mr-3">
                {modelNotification.includes('❌') ? '❌' :
                 modelNotification.includes('📊') ? '📊' : '🤖'}
              </div>
              <div>
                <p className="font-medium">{modelNotification}</p>
              </div>
            </div>
          </div>
        )}

        {/* Título de la página */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Constructor de Sitios Web Estáticos</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Crea sitios web estáticos profesionales con HTML5, CSS3 y JavaScript vanilla. Optimizados para SEO, accesibilidad y rendimiento ultra-rápido.
          </p>

          {/* Selector de Modelos */}
          <div className="mt-6 mb-4">
            <div className="max-w-md mx-auto">
              <ModelSelector
                models={availableModels}
                selectedModel={selectedModel}
                onSelectModel={handleModelChange}
                onModelStatusUpdate={handleModelStatusUpdate}
              />
            </div>
          </div>

          {/* Botones de modo */}
          <div className="flex justify-center mt-4 space-x-4">
            <button
              onClick={() => setShowAssistant(false)}
              className={`px-4 py-2 rounded-md transition-all duration-200 ${
                !showAssistant
                  ? 'bg-codestorm-blue text-white'
                  : 'bg-codestorm-dark text-gray-300 hover:bg-codestorm-blue/20'
              }`}
            >
              Modo Manual
            </button>
            <button
              onClick={() => setShowAssistant(true)}
              className={`px-4 py-2 rounded-md transition-all duration-200 ${
                showAssistant
                  ? 'bg-codestorm-blue text-white'
                  : 'bg-codestorm-dark text-gray-300 hover:bg-codestorm-blue/20'
              }`}
            >
              Asistente IA
            </button>
          </div>
        </div>

        {/* Indicador de pasos (solo visible en modo manual) */}
        {!showAssistant && (
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

        {/* Asistente de IA */}
        {showAssistant ? (
          <div className="grid grid-cols-12 gap-4 webai-component">
            <div className="col-span-12 h-[700px]">
              <WebAIAssistantSimple
                onFilesUpdated={handleFilesUpdated}
                onAutoPreview={handleAutoPreview}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-4 webai-component">
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

      {/* Panel de modificación de código */}
      <CodeModifierPanel
        isVisible={isCodeModifierVisible}
        onClose={toggleCodeModifier}
        files={projectState.files}
        onApplyChanges={handleApplyCodeModifications}
      />

      {/* Botones flotantes universales */}
      <UniversalFloatingButtons
        onToggleChat={handleToggleChat}
        onTogglePreview={handleTogglePreview}
        onToggleCodeModifier={toggleCodeModifier}
        onToggleHelpAssistant={handleToggleHelpAssistant}
        onOpenWebPreview={() => {
          // Abrir vista previa web con archivos de WebAI
          console.log('🌐 Abriendo vista previa web desde WebAI');
          setShowPreview(true);
        }}
        onOpenCodeCorrector={() => {
          // Abrir corrector de código desde WebAI
          console.log('🔧 Abriendo corrector de código desde WebAI');
          toggleCodeModifier();
        }}
        showChat={showChat}
        showCodeModifier={isCodeModifierVisible}
        showHelpAssistant={showHelpAssistant}
        files={projectState.files}
        projectName={projectState.projectName || 'Proyecto WebAI'}
        currentPage="webai"
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
