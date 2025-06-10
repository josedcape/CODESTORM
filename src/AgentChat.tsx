import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Bot, User, Sparkles, Code, CheckCircle, AlertTriangle, Clock,
  Play, Pause, Square, List, FileText, Settings, Zap, Brain,
  GitBranch, Target, Layers, Workflow, ChevronRight, ChevronDown,
  Plus, Trash2, Edit3, Eye, Download, Upload, RefreshCw
} from 'lucide-react';
import { ChatMessage, FileItem, TechnologyStack, ApprovalData, ProgressData } from '../types';
import { AIIterativeOrchestrator } from '../services/AIIterativeOrchestrator';
import { PromptEnhancerService } from '../services/PromptEnhancerService';
import TechnologyStackCarousel from '../components/constructor/TechnologyStackCarousel';
import ApprovalInterface from '../components/constructor/ApprovalInterface';
import ProgressIndicator from '../components/constructor/ProgressIndicator';
import { generateUniqueId } from '../utils/idGenerator';

// Interfaces para el sistema de tareas
interface TaskItem {
  id: string;
  instruction: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: string;
  error?: string;
  estimatedTime?: number;
  actualTime?: number;
  dependencies?: string[];
  tags?: string[];
}

interface TaskQueue {
  tasks: TaskItem[];
  currentTask: TaskItem | null;
  isProcessing: boolean;
  totalCompleted: number;
  totalFailed: number;
}

interface AgentChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
  files: FileItem[];
  onFileUpdate: (files: FileItem[]) => void;
  onTabChange: (tab: string) => void;
  currentFilePath?: string | null;
  onFileSelect?: (file: FileItem) => void;
}

const AgentChat: React.FC<AgentChatProps> = ({
  messages,
  onSendMessage,
  isProcessing,
  files,
  onFileUpdate,
  onTabChange,
  currentFilePath,
  onFileSelect
}) => {
  // Estados básicos del chat
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Estados para el sistema de tareas
  const [taskQueue, setTaskQueue] = useState<TaskQueue>({
    tasks: [],
    currentTask: null,
    isProcessing: false,
    totalCompleted: 0,
    totalFailed: 0
  });

  // Estados para funcionalidades avanzadas
  const [showTechnologyStack, setShowTechnologyStack] = useState(false);
  const [selectedTechnologyStack, setSelectedTechnologyStack] = useState<TechnologyStack | null>(null);
  const [pendingApproval, setPendingApproval] = useState<ApprovalData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [showTaskQueue, setShowTaskQueue] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);

  // Servicios
  const aiOrchestrator = AIIterativeOrchestrator.getInstance();
  const promptEnhancer = new PromptEnhancerService();

  // Funciones básicas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Configurar listeners del orquestrador
  useEffect(() => {
    const handleChatUpdate = (newMessages: ChatMessage[]) => {
      // Los mensajes ya se manejan en el componente padre
    };

    const handleFileUpdate = (newFiles: FileItem[]) => {
      onFileUpdate(newFiles);
    };

    const handleStateUpdate = (state: any) => {
      if (state.requiresApproval && state.approvalData) {
        setPendingApproval(state.approvalData);
      } else {
        setPendingApproval(null);
      }
    };

    const handleProgressUpdate = (progressData: ProgressData) => {
      setProgress(progressData);
    };

    // Suscribirse a los eventos
    aiOrchestrator.addChatListener(handleChatUpdate);
    aiOrchestrator.addFileListener(handleFileUpdate);
    aiOrchestrator.addStateListener(handleStateUpdate);
    aiOrchestrator.addProgressListener(handleProgressUpdate);

    return () => {
      aiOrchestrator.removeChatListener(handleChatUpdate);
      aiOrchestrator.removeFileListener(handleFileUpdate);
      aiOrchestrator.removeStateListener(handleStateUpdate);
      aiOrchestrator.removeProgressListener(handleProgressUpdate);
    };
  }, [onFileUpdate]);

  // Sistema de gestión de tareas
  const addTaskToQueue = useCallback((instruction: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
    const newTask: TaskItem = {
      id: generateUniqueId('task'),
      instruction,
      status: 'pending',
      priority,
      createdAt: Date.now(),
      estimatedTime: estimateTaskTime(instruction),
      tags: extractTaskTags(instruction)
    };

    setTaskQueue(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
    }));

    return newTask;
  }, []);

  const processNextTask = useCallback(async () => {
    if (taskQueue.isProcessing || taskQueue.tasks.length === 0) return;

    const nextTask = taskQueue.tasks.find(task => task.status === 'pending');
    if (!nextTask) return;

    setTaskQueue(prev => ({
      ...prev,
      currentTask: nextTask,
      isProcessing: true,
      tasks: prev.tasks.map(task =>
        task.id === nextTask.id
          ? { ...task, status: 'processing', startedAt: Date.now() }
          : task
      )
    }));

    try {
      await aiOrchestrator.processUserInstruction(nextTask.instruction);

      setTaskQueue(prev => ({
        ...prev,
        currentTask: null,
        isProcessing: false,
        totalCompleted: prev.totalCompleted + 1,
        tasks: prev.tasks.map(task =>
          task.id === nextTask.id
            ? {
                ...task,
                status: 'completed',
                completedAt: Date.now(),
                actualTime: Date.now() - (task.startedAt || task.createdAt)
              }
            : task
        )
      }));
    } catch (error) {
      setTaskQueue(prev => ({
        ...prev,
        currentTask: null,
        isProcessing: false,
        totalFailed: prev.totalFailed + 1,
        tasks: prev.tasks.map(task =>
          task.id === nextTask.id
            ? {
                ...task,
                status: 'failed',
                completedAt: Date.now(),
                error: error instanceof Error ? error.message : 'Error desconocido'
              }
            : task
        )
      }));
    }
  }, [taskQueue, aiOrchestrator]);

  // Procesar tareas automáticamente
  useEffect(() => {
    if (!taskQueue.isProcessing && taskQueue.tasks.some(task => task.status === 'pending')) {
      const timer = setTimeout(processNextTask, 1000);
      return () => clearTimeout(timer);
    }
  }, [taskQueue, processNextTask]);

  // Funciones auxiliares para el sistema de tareas
  const estimateTaskTime = (instruction: string): number => {
    const words = instruction.split(' ').length;
    const complexity = detectComplexity(instruction);
    const baseTime = words * 1000; // 1 segundo por palabra
    const complexityMultiplier = { low: 1, medium: 2, high: 4 };
    return baseTime * complexityMultiplier[complexity];
  };

  const detectComplexity = (instruction: string): 'low' | 'medium' | 'high' => {
    const complexKeywords = ['refactor', 'optimize', 'architecture', 'database', 'api', 'integration'];
    const mediumKeywords = ['component', 'function', 'class', 'module', 'service'];

    const lowerInstruction = instruction.toLowerCase();

    if (complexKeywords.some(keyword => lowerInstruction.includes(keyword))) {
      return 'high';
    } else if (mediumKeywords.some(keyword => lowerInstruction.includes(keyword))) {
      return 'medium';
    }
    return 'low';
  };

  const extractTaskTags = (instruction: string): string[] => {
    const tags: string[] = [];
    const lowerInstruction = instruction.toLowerCase();

    if (lowerInstruction.includes('ui') || lowerInstruction.includes('interface')) tags.push('UI');
    if (lowerInstruction.includes('api') || lowerInstruction.includes('backend')) tags.push('Backend');
    if (lowerInstruction.includes('database') || lowerInstruction.includes('db')) tags.push('Database');
    if (lowerInstruction.includes('test') || lowerInstruction.includes('testing')) tags.push('Testing');
    if (lowerInstruction.includes('fix') || lowerInstruction.includes('bug')) tags.push('Bugfix');
    if (lowerInstruction.includes('optimize') || lowerInstruction.includes('performance')) tags.push('Performance');

    return tags;
  };

  // Función principal para enviar mensajes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const instruction = inputValue.trim();
    setInputValue('');

    // Detectar si es una modificación de archivo existente
    const isFileModification = detectFileModification(instruction);

    if (isFileModification && files.length > 0) {
      // Procesar como modificación inmediata
      await handleFileModification(instruction);
    } else {
      // Verificar si debe mejorar el prompt
      if (shouldEnhancePrompt(instruction)) {
        await handlePromptEnhancement(instruction);
      } else {
        // Agregar a la cola de tareas
        addTaskToQueue(instruction, detectComplexity(instruction) as any);
        onSendMessage(instruction);
      }
    }
  };

  // Detectar modificaciones de archivos
  const detectFileModification = (instruction: string): boolean => {
    const modificationKeywords = [
      'modifica', 'cambia', 'actualiza', 'edita', 'modify', 'change', 'update', 'edit',
      'añade', 'agrega', 'add', 'elimina', 'borra', 'remove', 'delete'
    ];

    const lowerInstruction = instruction.toLowerCase();
    const hasModificationKeywords = modificationKeywords.some(keyword =>
      lowerInstruction.includes(keyword)
    );

    const mentionsFiles = files.some(file =>
      lowerInstruction.includes(file.name.toLowerCase()) ||
      lowerInstruction.includes(file.path.toLowerCase())
    );

    return hasModificationKeywords || mentionsFiles;
  };

  // Manejar modificaciones de archivos
  const handleFileModification = async (instruction: string) => {
    try {
      onSendMessage(instruction);

      // Mostrar mensaje de procesamiento
      const processingMessage: ChatMessage = {
        id: generateUniqueId('processing'),
        sender: 'ai-agent',
        content: '🔧 Procesando modificación de archivos...',
        timestamp: Date.now(),
        type: 'info'
      };

      // Procesar con el orquestrador
      await aiOrchestrator.processInteractiveInstruction(instruction);

    } catch (error) {
      console.error('Error en modificación de archivo:', error);
    }
  };

  // Determinar si debe mejorar el prompt
  const shouldEnhancePrompt = (instruction: string): boolean => {
    return instruction.length < 20 ||
           !instruction.includes(' ') ||
           instruction.split(' ').length < 3;
  };

  // Manejar mejora de prompts
  const handlePromptEnhancement = async (instruction: string) => {
    setIsEnhancingPrompt(true);

    try {
      const enhanceResult = await promptEnhancer.enhancePrompt(instruction, 'agent');

      if (enhanceResult.success && enhanceResult.enhancedPrompt) {
        // Mostrar prompt mejorado al usuario
        const enhancedMessage: ChatMessage = {
          id: generateUniqueId('enhanced'),
          sender: 'ai-agent',
          content: `✨ **Prompt mejorado**: ${enhanceResult.enhancedPrompt.enhancedPrompt}\n\n¿Deseas usar esta versión mejorada?`,
          timestamp: Date.now(),
          type: 'info'
        };

        // Agregar a la cola con el prompt mejorado
        addTaskToQueue(enhanceResult.enhancedPrompt.enhancedPrompt, 'medium');
        onSendMessage(instruction);
      } else {
        // Si falla la mejora, procesar normalmente
        addTaskToQueue(instruction, 'medium');
        onSendMessage(instruction);
      }
    } catch (error) {
      console.error('Error al mejorar prompt:', error);
      addTaskToQueue(instruction, 'medium');
      onSendMessage(instruction);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // Funciones para manejo de aprobaciones
  const handleApprove = (feedback?: string) => {
    if (!pendingApproval) return;

    try {
      aiOrchestrator.handleApproval(pendingApproval.id, true, feedback);
      setPendingApproval(null);
    } catch (error) {
      console.error('Error al aprobar:', error);
    }
  };

  const handleReject = (feedback: string) => {
    if (!pendingApproval) return;

    try {
      aiOrchestrator.handleApproval(pendingApproval.id, false, feedback);
      setPendingApproval(null);
    } catch (error) {
      console.error('Error al rechazar:', error);
    }
  };

  const handlePartialApprove = (approvedItems: string[], feedback?: string) => {
    if (!pendingApproval) return;

    try {
      aiOrchestrator.handleApproval(pendingApproval.id, true, feedback, approvedItems);
      setPendingApproval(null);
    } catch (error) {
      console.error('Error en aprobación parcial:', error);
    }
  };

  // Funciones para el stack tecnológico
  const handleTechnologyStackSelection = (stack: TechnologyStack) => {
    setSelectedTechnologyStack(stack);
    setShowTechnologyStack(false);

    // Agregar mensaje sobre el stack seleccionado
    const stackMessage: ChatMessage = {
      id: generateUniqueId('stack-selected'),
      sender: 'ai-agent',
      content: `🛠️ **Stack tecnológico seleccionado**: ${stack.name}\n\n${stack.description}\n\n**Tecnologías**: ${stack.technologies.join(', ')}`,
      timestamp: Date.now(),
      type: 'success'
    };
  };

  // Funciones de utilidad para iconos y estilos
  const getAgentIcon = (sender: string) => {
    switch (sender) {
      case 'ai-agent':
        return <Bot className="w-4 h-4 text-purple-400" />;
      case 'design-agent':
        return <Sparkles className="w-4 h-4 text-green-400" />;
      case 'planner':
        return <Target className="w-4 h-4 text-blue-400" />;
      case 'codeGenerator':
        return <Code className="w-4 h-4 text-yellow-400" />;
      case 'codeModifier':
        return <Edit3 className="w-4 h-4 text-orange-400" />;
      case 'fileObserver':
        return <Eye className="w-4 h-4 text-cyan-400" />;
      default:
        return <Bot className="w-4 h-4 text-purple-400" />;
    }
  };

  const getMessageTypeStyles = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-l-4 border-red-500 bg-red-500/10';
      case 'success':
        return 'border-l-4 border-green-500 bg-green-500/10';
      case 'warning':
        return 'border-l-4 border-yellow-500 bg-yellow-500/10';
      case 'info':
        return 'border-l-4 border-blue-500 bg-blue-500/10';
      case 'notification':
        return 'border-l-4 border-purple-500 bg-purple-500/10';
      case 'agent-report':
        return 'border-l-4 border-cyan-500 bg-cyan-500/10';
      case 'approval-response':
        return 'border-l-4 border-orange-500 bg-orange-500/10';
      default:
        return '';
    }
  };

  const getTaskStatusIcon = (status: TaskItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
    }
  };

  const getPriorityColor = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-400 bg-red-500/10';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10';
      case 'low':
        return 'text-green-400 bg-green-500/10';
    }
  };

  const formatMessageContent = (content: string) => {
    // Convertir markdown básico a HTML con soporte mejorado
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-gray-300">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-700 px-2 py-1 rounded text-sm font-mono text-purple-300">$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800 p-3 rounded mt-2 mb-2 overflow-x-auto"><code class="text-sm font-mono text-green-300">$1</code></pre>')
      .replace(/#{1,6}\s+(.*)/g, '<h3 class="text-lg font-semibold text-white mt-2 mb-1">$1</h3>')
      .replace(/\n/g, '<br>');

    return formatted;
  };

  // Funciones para gestión de archivos
  const handleFileAction = (action: string, file?: FileItem) => {
    switch (action) {
      case 'view':
        if (file && onFileSelect) {
          onFileSelect(file);
          onTabChange('editor');
        }
        break;
      case 'edit':
        if (file) {
          setInputValue(`Modifica el archivo ${file.path} para `);
          inputRef.current?.focus();
        }
        break;
      case 'delete':
        if (file) {
          setInputValue(`Elimina el archivo ${file.path}`);
          inputRef.current?.focus();
        }
        break;
    }
  };

  // Sugerencias de comandos inteligentes basadas en el contexto
  const getSmartSuggestions = (): string[] => {
    const baseSuggestions = [
      "Añade validación de email al formulario",
      "Optimiza la función de búsqueda",
      "Crea un componente de modal reutilizable",
      "Refactoriza el código para mejor rendimiento",
      "Añade manejo de errores a la API",
      "Implementa lazy loading en las imágenes"
    ];

    const fileSuggestions: string[] = [];

    // Sugerencias basadas en archivos existentes
    if (files.length > 0) {
      const hasReactFiles = files.some(f => f.path.includes('.tsx') || f.path.includes('.jsx'));
      const hasStyleFiles = files.some(f => f.path.includes('.css') || f.path.includes('.scss'));
      const hasConfigFiles = files.some(f => f.path.includes('config') || f.path.includes('.json'));

      if (hasReactFiles) {
        fileSuggestions.push("Añade PropTypes al componente React");
        fileSuggestions.push("Implementa React.memo para optimización");
        fileSuggestions.push("Añade hooks personalizados");
      }

      if (hasStyleFiles) {
        fileSuggestions.push("Optimiza los estilos CSS");
        fileSuggestions.push("Añade variables CSS personalizadas");
        fileSuggestions.push("Implementa diseño responsivo");
      }

      if (hasConfigFiles) {
        fileSuggestions.push("Actualiza la configuración del proyecto");
        fileSuggestions.push("Añade variables de entorno");
      }
    }

    return [...fileSuggestions, ...baseSuggestions].slice(0, 6);
  };

  const smartSuggestions = getSmartSuggestions();

  return (
    <div className="flex flex-col h-full bg-codestorm-dark rounded-lg">
      {/* Header del chat mejorado */}
      <div className="flex items-center justify-between p-4 border-b border-purple-500/30">
        <div className="flex items-center space-x-3">
          <Bot className="w-6 h-6 text-purple-400" />
          <div>
            <span className="font-medium text-white">AGENT Chat</span>
            <div className="text-xs text-gray-400">Sistema de desarrollo inteligente</div>
          </div>
          {taskQueue.currentTask && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-purple-500/20 rounded-full">
              <RefreshCw className="w-3 h-3 text-purple-400 animate-spin" />
              <span className="text-xs text-white">Procesando tarea</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Indicador de progreso */}
          {progress && (
            <div className="flex items-center space-x-2">
              <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-400 transition-all duration-300"
                  style={{ width: `${progress.percentage || 0}%` }}
                />
              </div>
              <span className="text-xs text-purple-400">{progress.percentage || 0}%</span>
            </div>
          )}

          {/* Botón de cola de tareas */}
          <button
            onClick={() => setShowTaskQueue(!showTaskQueue)}
            className="flex items-center space-x-1 px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 rounded-md transition-colors"
            title="Ver cola de tareas"
          >
            <List className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-400">{taskQueue.tasks.length}</span>
          </button>

          {/* Botón de opciones avanzadas */}
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="p-1 hover:bg-purple-500/10 rounded-md transition-colors"
            title="Opciones avanzadas"
          >
            <Settings className="w-4 h-4 text-purple-400" />
          </button>
        </div>
      </div>

      {/* Panel de opciones avanzadas */}
      {showAdvancedOptions && (
        <div className="p-4 border-b border-purple-500/30 bg-purple-500/5">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowTechnologyStack(true)}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 rounded-md text-xs transition-colors"
            >
              <Layers className="w-3 h-3" />
              <span>Stack Tecnológico</span>
            </button>
            <button
              onClick={() => onTabChange('files')}
              className="flex items-center space-x-1 px-3 py-1 bg-green-500/10 hover:bg-green-500/20 rounded-md text-xs transition-colors"
            >
              <FileText className="w-3 h-3" />
              <span>Explorador</span>
            </button>
            <button
              onClick={() => onTabChange('terminal')}
              className="flex items-center space-x-1 px-3 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-md text-xs transition-colors"
            >
              <Code className="w-3 h-3" />
              <span>Terminal</span>
            </button>
          </div>
        </div>
      )}

      {/* Cola de tareas */}
      {showTaskQueue && (
        <div className="p-4 border-b border-purple-500/30 bg-purple-500/5 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Cola de Tareas</h3>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span>Completadas: {taskQueue.totalCompleted}</span>
              <span>Fallidas: {taskQueue.totalFailed}</span>
            </div>
          </div>

          {taskQueue.tasks.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-4">
              No hay tareas en la cola
            </div>
          ) : (
            <div className="space-y-2">
              {taskQueue.tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-codestorm-darker rounded-md">
                  <div className="flex items-center space-x-2 flex-1">
                    {getTaskStatusIcon(task.status)}
                    <span className="text-sm text-white truncate">{task.instruction}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex space-x-1">
                        {task.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-xs px-1 py-0.5 bg-gray-600 rounded text-gray-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {taskQueue.tasks.length > 5 && (
                <div className="text-center text-xs text-gray-400">
                  +{taskQueue.tasks.length - 5} tareas más
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Área de mensajes mejorada */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                message.sender === 'user'
                  ? 'bg-purple-500 text-white'
                  : `bg-codestorm-darker text-gray-100 ${getMessageTypeStyles(message.type || '')}`
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.sender !== 'user' && (
                  <div className="flex-shrink-0 mt-1">
                    {getAgentIcon(message.sender)}
                  </div>
                )}
                <div className="flex-1">
                  <div
                    className="text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: formatMessageContent(message.content)
                    }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                    {message.metadata?.agentType && (
                      <div className="text-xs text-purple-400 capitalize">
                        {message.metadata.agentType}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {(isProcessing || taskQueue.isProcessing || isEnhancingPrompt) && (
          <div className="flex justify-start">
            <div className="bg-codestorm-darker text-gray-100 rounded-lg p-3 max-w-[80%] border-l-4 border-purple-500">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-purple-400" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm">
                  {isEnhancingPrompt ? 'Mejorando instrucción...' :
                   taskQueue.isProcessing ? `Procesando: ${taskQueue.currentTask?.instruction.slice(0, 30)}...` :
                   'Procesando...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Interface de aprobación */}
      {pendingApproval && (
        <div className="p-4 border-t border-purple-500/30 bg-purple-500/5">
          <ApprovalInterface
            approvalData={pendingApproval}
            onApprove={handleApprove}
            onReject={handleReject}
            onPartialApprove={handlePartialApprove}
            isLoading={isProcessing}
          />
        </div>
      )}

      {/* Indicador de progreso */}
      {progress && (
        <div className="p-4 border-t border-purple-500/30">
          <ProgressIndicator
            progress={progress}
            onPause={() => {}}
            onResume={() => {}}
            onCancel={() => aiOrchestrator.cancelProcessing()}
            onViewLog={() => {}}
            isPaused={false}
            showControls={true}
          />
        </div>
      )}

      {/* Panel de archivos rápido */}
      {files.length > 0 && (
        <div className="p-4 border-t border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Archivos del proyecto:</span>
            <button
              onClick={() => onTabChange('files')}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              Ver todos
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {files.slice(0, 6).map((file) => (
              <button
                key={file.id}
                onClick={() => handleFileAction('view', file)}
                className="text-xs px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 rounded text-purple-300 transition-colors"
                title={file.path}
              >
                {file.name}
              </button>
            ))}
            {files.length > 6 && (
              <span className="text-xs text-gray-400 px-2 py-1">
                +{files.length - 6} más
              </span>
            )}
          </div>
        </div>
      )}

      {/* Sugerencias inteligentes */}
      {messages.length <= 1 && (
        <div className="p-4 border-t border-purple-500/30">
          <div className="text-xs text-gray-400 mb-2">Sugerencias inteligentes:</div>
          <div className="flex flex-wrap gap-2">
            {smartSuggestions.slice(0, 3).map((command, index) => (
              <button
                key={index}
                onClick={() => setInputValue(command)}
                className="text-xs px-3 py-1 bg-purple-500/10 text-purple-300 rounded hover:bg-purple-500/20 transition-colors"
              >
                {command}
              </button>
            ))}
          </div>

          {files.length === 0 && (
            <div className="mt-3 p-3 bg-blue-500/10 rounded-md">
              <div className="text-xs text-blue-300 mb-1">💡 Consejo:</div>
              <div className="text-xs text-gray-300">
                Comienza describiendo tu proyecto. Por ejemplo: "Crea una aplicación web de tareas con React y TypeScript"
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input de mensaje mejorado */}
      <div className="p-4 border-t border-purple-500/30">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  files.length > 0
                    ? "Describe modificaciones, mejoras o nuevas funcionalidades..."
                    : "Describe tu proyecto o tarea a realizar..."
                }
                className="w-full px-4 py-3 bg-codestorm-darker border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all"
                disabled={isProcessing || taskQueue.isProcessing}
              />
              {isEnhancingPrompt && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!inputValue.trim() || isProcessing || taskQueue.isProcessing}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 font-medium"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">
                {taskQueue.isProcessing ? 'Procesando...' : 'Enviar'}
              </span>
            </button>
          </div>

          {/* Acciones rápidas */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {files.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setInputValue("Optimiza el código del proyecto")}
                    className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 transition-colors"
                  >
                    Optimizar
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputValue("Añade comentarios al código")}
                    className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-colors"
                  >
                    Documentar
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputValue("Refactoriza el código para mejor legibilidad")}
                    className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded hover:bg-yellow-500/20 transition-colors"
                  >
                    Refactorizar
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-400">
              {taskQueue.tasks.length > 0 && (
                <span>{taskQueue.tasks.filter(t => t.status === 'pending').length} pendientes</span>
              )}
              <span>AGENT activo</span>
            </div>
          </div>
        </form>

        <div className="text-xs text-gray-500 mt-3 flex items-center justify-between">
          <div>
            💡 <strong>Tip:</strong> Usa comandos como "modifica archivo.js para añadir validación" o "crea componente modal"
          </div>
          {selectedTechnologyStack && (
            <div className="text-purple-400">
              Stack: {selectedTechnologyStack.name}
            </div>
          )}
        </div>
      </div>

      {/* Componentes modales */}
      {showTechnologyStack && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-codestorm-dark rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <TechnologyStackCarousel
              isVisible={showTechnologyStack}
              instruction={inputValue || "Selecciona el stack tecnológico para tu proyecto"}
              onSelectStack={handleTechnologyStackSelection}
              onClose={() => setShowTechnologyStack(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentChat;
