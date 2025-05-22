import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CollapsiblePanel from '../components/CollapsiblePanel';
import BrandLogo from '../components/BrandLogo';
import Footer from '../components/Footer';
import CodeModifierPanel from '../components/codemodifier/CodeModifierPanel';
import { Loader, AlertTriangle, FileText, Folder, Sparkles, Layers, CheckCircle, XCircle } from 'lucide-react';
import {
  FileItem,
  ChatMessage,
  ApprovalData,
  ProgressData
} from '../types';
import { generateUniqueId } from '../utils/idGenerator';
import { useUI } from '../contexts/UIContext';

import InteractiveChat from '../components/constructor/InteractiveChat';
import DirectoryExplorer from '../components/constructor/DirectoryExplorer';
import ErrorNotification from '../components/constructor/ErrorNotification';
import ProjectTemplateSelector from '../components/constructor/ProjectTemplateSelector';
import ApprovalInterface from '../components/constructor/ApprovalInterface';
import ProgressIndicator from '../components/constructor/ProgressIndicator';

// --- AGENT AND SERVICE IMPORTS (USER TO VERIFY PATHS AND EXPORTS) ---
import { PromptEnhancerService, PromptEnhancerResult, EnhancedPrompt } from '../services/PromptEnhancerService';
import { PlannerAgent } from '../agents/PlannerAgent';
import { CodeGeneratorAgent } from '../agents/CodeGeneratorAgent';
import { CodeModifierAgent } from '../agents/CodeModifierAgent';
import { AIIterativeOrchestrator } from '../services/AIIterativeOrchestrator';

// --- DATA STRUCTURES ---
export interface TemplateData {
  id: string;
  name: string;
  description: string;
}

export interface PlanFile {
  path: string;
  reason: string;
  action: 'create' | 'update' | 'delete';
}

export interface Plan {
  description: string;
  files: PlanFile[];
}

interface AIConstructorState {
  currentAIAction: string | null;
  projectFiles: FileItem[];
  isAIBusy: boolean;
  sessionId: string;
  showTemplateSelector: boolean;
  selectedTemplate: TemplateData | null;
}

// --- SERVICE AND AGENT INSTANTIATION ---
const promptEnhancerInstance = new PromptEnhancerService();
const plannerAgentInstance = new PlannerAgent();
const codeGeneratorAgentInstance = new CodeGeneratorAgent();
const codeModifierAgentInstance = new CodeModifierAgent();
const aiIterativeOrchestrator = AIIterativeOrchestrator.getInstance();

// Efectos para suscribirse a los cambios en el estado del orquestrador iterativo
const setupAIOrchestrator = (setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>, setAIState: React.Dispatch<React.SetStateAction<AIConstructorState>>, currentMessages: ChatMessage[]) => {
  // Suscribirse a los mensajes de chat
  const handleChatMessagesUpdate = (messages: ChatMessage[]) => {
    // Filtrar mensajes duplicados
    const newMessages = messages.filter(
      newMsg => !currentMessages.some(existingMsg => existingMsg.id === newMsg.id)
    );

    if (newMessages.length > 0) {
      setChatMessages(prev => [...prev, ...newMessages]);
    }
  };

  // Suscribirse a los archivos
  const handleFilesUpdate = (files: FileItem[]) => {
    setAIState(prev => ({
      ...prev,
      projectFiles: files
    }));
  };

  // Suscribirse al estado del flujo de trabajo
  const handleWorkflowStateUpdate = (state: any) => {
    setAIState(prev => ({
      ...prev,
      isAIBusy: state.isProcessing,
      currentAIAction: state.currentPhase === 'awaitingInput' ? null : state.currentPhase
    }));
  };

  // Añadir listeners
  aiIterativeOrchestrator.addChatListener(handleChatMessagesUpdate);
  aiIterativeOrchestrator.addFileListener(handleFilesUpdate);
  aiIterativeOrchestrator.addStateListener(handleWorkflowStateUpdate);

  // Devolver función de limpieza
  return () => {
    aiIterativeOrchestrator.removeChatListener(handleChatMessagesUpdate);
    aiIterativeOrchestrator.removeFileListener(handleFilesUpdate);
    aiIterativeOrchestrator.removeStateListener(handleWorkflowStateUpdate);
  };
};

const Constructor: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet, isCodeModifierVisible, toggleCodeModifier } = useUI();

  const [aiConstructorState, setAIConstructorState] = useState<AIConstructorState>({
    currentAIAction: 'awaitingInput',
    projectFiles: [],
    isAIBusy: false,
    sessionId: `session-${Date.now()}`,
    showTemplateSelector: false, // Inicialmente oculto
    selectedTemplate: null,
  });

  const [pendingApproval, setPendingApproval] = useState<ApprovalData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: generateUniqueId('welcome'), // Use helper for unique ID
      sender: 'ai',
      content: 'Bienvenido al Constructor de CODESTORM. Describe tu proyecto o tarea a realizar. Después de tu primera instrucción, podrás seleccionar una plantilla para complementarla.',
      timestamp: Date.now(),
      type: 'notification',
      senderType: 'ai',
    },
  ]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [showDirectoryExplorer, setShowDirectoryExplorer] = useState<boolean>(true);
  const [selectedFileForViewing, setSelectedFileForViewing] = useState<FileItem | null>(null);

  // Efecto para suscribirse a los cambios en el estado del orquestrador iterativo
  useEffect(() => {
    // Suscribirse a los mensajes de chat
    const handleChatMessagesUpdate = (messages: ChatMessage[]) => {
      // Filtrar mensajes duplicados
      const newMessages = messages.filter(
        newMsg => !chatMessages.some(existingMsg => existingMsg.id === newMsg.id)
      );

      if (newMessages.length > 0) {
        setChatMessages(prev => [...prev, ...newMessages]);
      }
    };

    // Suscribirse a los archivos
    const handleFilesUpdate = (files: FileItem[]) => {
      setAIConstructorState(prev => ({
        ...prev,
        projectFiles: files
      }));
    };

    // Suscribirse al estado del flujo de trabajo
    const handleWorkflowStateUpdate = (state: AIWorkflowState) => {
      setAIConstructorState(prev => ({
        ...prev,
        isAIBusy: state.isProcessing,
        currentAIAction: state.currentPhase === 'awaitingInput' ? null : state.currentPhase
      }));

      // Manejar solicitudes de aprobación
      if (state.requiresApproval && state.approvalData) {
        setPendingApproval(state.approvalData);
      } else {
        setPendingApproval(null);
      }

      // Manejar actualizaciones de progreso
      if (state.progress) {
        setProgress(state.progress);
      }
    };

    // Suscribirse a las aprobaciones
    const handleApprovalUpdate = (approvalData: ApprovalData) => {
      setPendingApproval(approvalData);
    };

    // Suscribirse al progreso
    const handleProgressUpdate = (progressData: ProgressData) => {
      setProgress(progressData);
    };

    // Añadir listeners
    aiIterativeOrchestrator.addChatListener(handleChatMessagesUpdate);
    aiIterativeOrchestrator.addFileListener(handleFilesUpdate);
    aiIterativeOrchestrator.addStateListener(handleWorkflowStateUpdate);
    aiIterativeOrchestrator.addApprovalListener(handleApprovalUpdate);
    aiIterativeOrchestrator.addProgressListener(handleProgressUpdate);

    // Limpiar al desmontar
    return () => {
      aiIterativeOrchestrator.removeChatListener(handleChatMessagesUpdate);
      aiIterativeOrchestrator.removeFileListener(handleFilesUpdate);
      aiIterativeOrchestrator.removeStateListener(handleWorkflowStateUpdate);
      aiIterativeOrchestrator.removeApprovalListener(handleApprovalUpdate);
      aiIterativeOrchestrator.removeProgressListener(handleProgressUpdate);
    };
  }, [chatMessages]);

  const addChatMessage = (message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  };

  const handleError = (error: any, stage: string) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error durante ${stage}:`, error);
    setErrorMessage(`Error en ${stage}: ${message}`);
    setShowError(true);
    addChatMessage({
      id: generateUniqueId('err'), // Use helper for unique ID
      sender: 'ai',
      content: `Error durante ${stage}: ${message}`,
      timestamp: Date.now(),
      type: 'error',
      senderType: 'ai',
    });
  };

  const handleTemplateSelection = async (template: TemplateData | null) => {
    setAIConstructorState(prev => ({
      ...prev,
      selectedTemplate: template,
      showTemplateSelector: false,
      isAIBusy: true,
      currentAIAction: 'Iniciando proyecto...'
    }));

    // Recuperar la instrucción original del usuario
    const originalInstruction = localStorage.getItem('originalInstruction') || '';

    if (template) {
      // Añadir mensaje de selección de plantilla
      const userMessage = {
        id: generateUniqueId('template-selected'),
        sender: 'user',
        content: `Plantilla seleccionada: ${template.name}`,
        timestamp: Date.now(),
        type: 'text'
      };
      addChatMessage(userMessage);

      // Mensaje informativo sobre la combinación de instrucción y plantilla
      addChatMessage({
        id: generateUniqueId('combining-instruction'),
        sender: 'ai',
        content: 'Combinando tu instrucción original con la plantilla seleccionada para crear un plan de desarrollo más completo...',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai',
      });

      try {
        // Combinar la instrucción original con la plantilla
        const combinedInstruction = `${originalInstruction} utilizando la plantilla de ${template.name}: ${template.description}`;

        // Iniciar el proceso con el orquestrador iterativo usando la instrucción combinada
        await aiIterativeOrchestrator.processUserInstruction(combinedInstruction, template.id);
      } catch (error) {
        handleError(error, 'la inicialización del proyecto');
      } finally {
        setAIConstructorState(prev => ({ ...prev, isAIBusy: false, currentAIAction: 'awaitingInput' }));
      }
    } else {
      // Añadir mensaje de omisión de plantilla
      const userMessage = {
        id: generateUniqueId('template-skipped'),
        sender: 'user',
        content: `Plantilla omitida. Continuando con la instrucción original.`,
        timestamp: Date.now(),
        type: 'text'
      };
      addChatMessage(userMessage);

      try {
        // Procesar la instrucción original sin plantilla
        await aiIterativeOrchestrator.processUserInstruction(originalInstruction);
      } catch (error) {
        handleError(error, 'el procesamiento de la instrucción');
      } finally {
        setAIConstructorState(prev => ({ ...prev, isAIBusy: false, currentAIAction: 'awaitingInput' }));
      }
    }

    // Limpiar la instrucción original del localStorage después de usarla
    localStorage.removeItem('originalInstruction');
  };

  const orchestrateAIActions = async (rawUserInstruction: string) => {
    if (!rawUserInstruction.trim()) {
      addChatMessage({ id: generateUniqueId('err-empty'), sender: 'ai', content: 'Por favor, proporciona una instrucción.', timestamp: Date.now(), type: 'error', senderType: 'ai' });
      return;
    }

    setAIConstructorState(prev => ({ ...prev, isAIBusy: true, currentAIAction: 'Optimizing Prompt...' }));
    addChatMessage({ id: generateUniqueId('ai-status-prompt'), sender: 'ai', content: '[Servicio de Mejora de Prompt] Optimizando instrucción...', timestamp: Date.now(), type: 'system', senderType: 'ai', icon: Sparkles });

    let actualInstructionForAI = rawUserInstruction;

    try {
      const enhancementResult: PromptEnhancerResult = await promptEnhancerInstance.enhancePrompt(rawUserInstruction);

      if (enhancementResult.success && enhancementResult.enhancedPrompt) {
        actualInstructionForAI = enhancementResult.enhancedPrompt.enhancedPrompt;
        addChatMessage({
          id: generateUniqueId('ai-enhanced-prompt'),
          sender: 'ai',
          content: `Instrucción Optimizada: "${actualInstructionForAI}"${enhancementResult.enhancedPrompt.improvements.length > 0 ? `
Mejoras Aplicadas: ${enhancementResult.enhancedPrompt.improvements.join(', ')}` : ''}`,
          timestamp: Date.now(),
          type: 'system',
          senderType: 'ai'
        });
      } else if (enhancementResult.error) {
        handleError(new Error(enhancementResult.error), 'la optimización de la instrucción (PromptEnhancerService.enhancePrompt)');
        addChatMessage({ id: generateUniqueId('ai-enhance-failed'), sender: 'ai', content: 'Error al mejorar el prompt, se usará la instrucción original.', timestamp: Date.now(), type: 'warning', senderType: 'ai' });
      } else {
        addChatMessage({ id: generateUniqueId('ai-enhance-skipped'), sender: 'ai', content: 'No se aplicaron mejoras automáticas al prompt. Se usará la instrucción original.', timestamp: Date.now(), type: 'system', senderType: 'ai' });
      }
    } catch (error) {
      handleError(error, 'la optimización de la instrucción (PromptEnhancerService.enhancePrompt)');
      addChatMessage({ id: generateUniqueId('ai-enhance-exception'), sender: 'ai', content: 'Excepción al mejorar el prompt, se usará la instrucción original.', timestamp: Date.now(), type: 'warning', senderType: 'ai' });
    }

    const isInitialRequest = aiConstructorState.projectFiles.length === 0;
    let plan: Plan;

    try {
      if (isInitialRequest) {
        setAIConstructorState(prev => ({ ...prev, currentAIAction: 'Planning Initial Project...' }));
        addChatMessage({ id: generateUniqueId('ai-plan-start'), sender: 'ai', content: '[Agente Planificador] Creando plan inicial del proyecto...', timestamp: Date.now(), type: 'system', senderType: 'ai' });
        plan = await plannerAgentInstance.developInitialPlan(actualInstructionForAI, aiConstructorState.selectedTemplate || undefined);
      } else {
        setAIConstructorState(prev => ({ ...prev, currentAIAction: 'Planning Modifications...' }));
        addChatMessage({ id: generateUniqueId('ai-plan-mod-start'), sender: 'ai', content: '[Agente Planificador] Analizando solicitud de modificación...', timestamp: Date.now(), type: 'system', senderType: 'ai' });
        plan = await plannerAgentInstance.developModificationPlan(actualInstructionForAI, aiConstructorState.projectFiles);
      }
      addChatMessage({ id: generateUniqueId('ai-plan-done'), sender: 'ai', content: `[Agente Planificador] Plan Recibido: ${plan.description}. Archivos afectados: ${plan.files.map(f => `
  - ${f.path} (${f.action})`).join('')}` , timestamp: Date.now(), type: 'text', senderType: 'ai' });
    } catch (error) {
      handleError(error, 'la planificación por IA (PlannerAgent)');
      setAIConstructorState(prev => ({ ...prev, isAIBusy: false, currentAIAction: 'awaitingInput' }));
      return;
    }

    let updatedProjectFiles = [...aiConstructorState.projectFiles];

    for (const planFile of plan.files) {
      try {
        if (planFile.action === 'create') {
          setAIConstructorState(prev => ({ ...prev, currentAIAction: `Generating Code: ${planFile.path}` }));
          addChatMessage({ id: generateUniqueId(`ai-gen-${planFile.path}`), sender: 'ai', content: `[Agente Generador de Código] Creando '${planFile.path}' (${planFile.reason})...` , timestamp: Date.now(), type: 'system', senderType: 'ai' });

          const generatedResult = await codeGeneratorAgentInstance.generateCode(planFile);

          const writeAPIResult = await default_api.write_file({ path: generatedResult.path, content: generatedResult.content });
          // @ts-ignore
          if (writeAPIResult.write_file_response.status !== 'succeeded') throw new Error(`API Error: No se pudo escribir el archivo ${generatedResult.path}`);

          const newFile: FileItem = { id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, path: generatedResult.path, content: generatedResult.content, type: 'file' };
          updatedProjectFiles = [...updatedProjectFiles.filter(f => f.path !== newFile.path), newFile];
          addChatMessage({ id: generateUniqueId(`ai-gen-done-${planFile.path}`), sender: 'ai', content: `Archivo '${generatedResult.path}' creado/actualizado con éxito por el Agente Generador.` , timestamp: Date.now(), type: 'success', senderType: 'ai' });

        } else if (planFile.action === 'update') {
          setAIConstructorState(prev => ({ ...prev, currentAIAction: `Modifying Code: ${planFile.path}` }));
          addChatMessage({ id: generateUniqueId(`ai-mod-${planFile.path}`), sender: 'ai', content: `[Agente Modificador de Código] Modificando '${planFile.path}' (${planFile.reason})...` , timestamp: Date.now(), type: 'system', senderType: 'ai' });

          const existingFileIndex = updatedProjectFiles.findIndex(f => f.path === planFile.path);
          if (existingFileIndex === -1) throw new Error(`Archivo ${planFile.path} no encontrado en el estado del proyecto para modificar.`);

          // @ts-ignore
          const readFileResult = await default_api.read_file({ path: planFile.path });
          // @ts-ignore
          if (readFileResult.read_file_response.status !== 'succeeded') throw new Error(`API Error: No se pudo leer el archivo ${planFile.path} para modificarlo.`);
          // @ts-ignore
          const currentContent = readFileResult.read_file_response.result;

          const modifiedResult = await codeModifierAgentInstance.modifyCode(planFile, currentContent);

          const writeAPIResult = await default_api.write_file({ path: modifiedResult.path, content: modifiedResult.content });
          // @ts-ignore
          if (writeAPIResult.write_file_response.status !== 'succeeded') throw new Error(`API Error: No se pudo escribir el archivo modificado ${modifiedResult.path}`);

          updatedProjectFiles[existingFileIndex] = { ...updatedProjectFiles[existingFileIndex], content: modifiedResult.content, id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
          addChatMessage({ id: generateUniqueId(`ai-mod-done-${planFile.path}`), sender: 'ai', content: `Archivo '${modifiedResult.path}' modificado con éxito por el Agente Modificador.` , timestamp: Date.now(), type: 'success', senderType: 'ai' });

        } else if (planFile.action === 'delete') {
            setAIConstructorState(prev => ({ ...prev, currentAIAction: `Deleting File: ${planFile.path}` }));
            addChatMessage({ id: generateUniqueId(`ai-del-${planFile.path}`), sender: 'ai', content: `[Sistema de Archivos] Eliminando '${planFile.path}' (${planFile.reason})...` , timestamp: Date.now(), type: 'system', senderType: 'ai' });

            const deleteAPIResult = await default_api.delete_file({ path: planFile.path });
            // @ts-ignore
            if (deleteAPIResult.delete_file_response.status !== 'succeeded') throw new Error(`API Error: No se pudo eliminar el archivo ${planFile.path}`);

            updatedProjectFiles = updatedProjectFiles.filter(f => f.path !== planFile.path);
            addChatMessage({ id: generateUniqueId(`ai-del-done-${planFile.path}`), sender: 'ai', content: `Archivo '${planFile.path}' eliminado con éxito.` , timestamp: Date.now(), type: 'success', senderType: 'ai' });
        }
      } catch (error) {
        handleError(error, `la operación de archivo para ${planFile.path}`);
      }
    }

    setAIConstructorState(prev => ({
      ...prev,
      projectFiles: updatedProjectFiles,
      isAIBusy: false,
      currentAIAction: 'awaitingInput'
    }));
    addChatMessage({ id: generateUniqueId('ai-process-end'), sender: 'ai', content: 'Proceso de IA completado. Listo para tu siguiente instrucción.', timestamp: Date.now(), type: 'notification', senderType: 'ai' });
  };

  const handleSendMessage = async (content: string) => {
    // Validar que el contenido no esté vacío y que no estemos procesando otra solicitud
    if (!content.trim() || aiConstructorState.isAIBusy) return;

    // Crear mensaje del usuario
    const userMessage: ChatMessage = {
      id: generateUniqueId('user'),
      sender: 'user',
      content,
      timestamp: Date.now(),
      type: 'text'
    };
    addChatMessage(userMessage);

    // Mostrar el selector de plantillas después de la primera instrucción del usuario
    // si aún no se ha seleccionado una plantilla
    if (!aiConstructorState.showTemplateSelector && !aiConstructorState.selectedTemplate) {
      // Guardar la instrucción original para combinarla con la plantilla después
      localStorage.setItem('originalInstruction', content);

      // Mostrar mensaje informativo sobre la selección de plantilla
      addChatMessage({
        id: generateUniqueId('template-prompt'),
        sender: 'ai',
        content: 'Ahora puedes seleccionar una plantilla para complementar tu instrucción. La plantilla se combinará con tu descripción inicial para generar un plan más completo.',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai',
      });

      // Mostrar el selector de plantillas
      setAIConstructorState(prev => ({
        ...prev,
        showTemplateSelector: true
      }));

      return; // Detener el flujo aquí hasta que se seleccione una plantilla
    }

    // Actualizar el estado para mostrar que estamos procesando
    setAIConstructorState(prev => ({
      ...prev,
      isAIBusy: true,
      currentAIAction: 'Procesando instrucción...'
    }));

    try {
      // Procesar la instrucción con el orquestrador iterativo
      await aiIterativeOrchestrator.processUserInstruction(content);
    } catch (error) {
      handleError(error, 'el procesamiento de la instrucción');
    } finally {
      // Actualizar el estado para mostrar que hemos terminado
      setAIConstructorState(prev => ({
        ...prev,
        isAIBusy: false,
        currentAIAction: 'awaitingInput'
      }));
    }
  };

  const handleViewFileContent = async (file: FileItem) => {
    setSelectedFileForViewing(file);
    setAIConstructorState(prev => ({ ...prev, currentAIAction: `Reading file: ${file.path}`}));
    addChatMessage({id: generateUniqueId('view-file'), sender: 'system', content: `Cargando contenido de ${file.path}...`, type:'system'});
    try {
        // @ts-ignore
        const result = await default_api.read_file({path: file.path});
        // @ts-ignore
        if (result.read_file_response.status === 'succeeded') {
            // @ts-ignore
            const content = result.read_file_response.result;
            setAIConstructorState(prev => ({
                ...prev,
                projectFiles: prev.projectFiles.map(pf => pf.path === file.path ? {...pf, content } : pf),
                currentAIAction: 'awaitingInput'
            }));
            alert(`Contenido de ${file.path}:

${content}`);
            addChatMessage({id: generateUniqueId('view-file-done'), sender: 'system', content: `Contenido de ${file.path} cargado.`, type:'success'});
        } else {
            // @ts-ignore
            throw new Error(result.read_file_response.error || 'Could not read file');
        }
    } catch (error) {
        handleError(error, `la lectura del archivo ${file.path}`);
        setAIConstructorState(prev => ({ ...prev, currentAIAction: 'awaitingInput'}));
    }
  };

  // Métodos para manejar las aprobaciones
  const handleApprove = (feedback?: string) => {
    if (!pendingApproval) {
      console.warn('Se intentó aprobar, pero no hay una solicitud de aprobación pendiente');

      // Mostrar mensaje de error
      addChatMessage({
        id: generateUniqueId('approval-error'),
        sender: 'system',
        content: 'Error: No hay una solicitud de aprobación pendiente. Por favor, intenta nuevamente.',
        timestamp: Date.now(),
        type: 'error'
      });

      return;
    }

    console.log(`Aprobando solicitud con ID: ${pendingApproval.id}, tipo: ${pendingApproval.type}`);

    // Añadir mensaje de chat indicando la aprobación
    addChatMessage({
      id: generateUniqueId('approval'),
      sender: 'user',
      content: `He aprobado el plan${feedback ? `: ${feedback}` : '.'}`,
      timestamp: Date.now(),
      type: 'approval-response',
      metadata: {
        approvalId: pendingApproval.id,
        approvalStatus: 'approved',
        approvalType: pendingApproval.type
      }
    });

    // Actualizar el estado para mostrar que estamos procesando
    setAIConstructorState(prev => ({
      ...prev,
      isAIBusy: true,
      currentAIAction: 'Procesando aprobación...'
    }));

    try {
      // Llamar al método de aprobación del orquestrador
      aiIterativeOrchestrator.handleApproval(pendingApproval.id, true, feedback, approvedItems);

      console.log('Solicitud de aprobación enviada correctamente');
    } catch (error) {
      console.error('Error al procesar la aprobación:', error);
      handleError(error, 'el procesamiento de la aprobación');
    }
  };

  const handleReject = (feedback: string) => {
    if (!pendingApproval) {
      console.warn('Se intentó rechazar, pero no hay una solicitud de aprobación pendiente');

      // Mostrar mensaje de error
      addChatMessage({
        id: generateUniqueId('rejection-error'),
        sender: 'system',
        content: 'Error: No hay una solicitud de aprobación pendiente. Por favor, intenta nuevamente.',
        timestamp: Date.now(),
        type: 'error'
      });

      return;
    }

    console.log(`Rechazando solicitud con ID: ${pendingApproval.id}, feedback: ${feedback}`);

    // Añadir mensaje de chat indicando el rechazo
    addChatMessage({
      id: generateUniqueId('rejection'),
      sender: 'user',
      content: `He rechazado el plan: ${feedback}`,
      timestamp: Date.now(),
      type: 'approval-response',
      metadata: {
        approvalId: pendingApproval.id,
        approvalStatus: 'rejected',
        approvalType: pendingApproval.type
      }
    });

    // Actualizar el estado para mostrar que estamos procesando
    setAIConstructorState(prev => ({
      ...prev,
      isAIBusy: true,
      currentAIAction: 'Procesando rechazo...'
    }));

    try {
      // Llamar al método de rechazo del orquestrador
      aiIterativeOrchestrator.handleApproval(pendingApproval.id, false, feedback);

      console.log('Solicitud de rechazo enviada correctamente');
    } catch (error) {
      console.error('Error al procesar el rechazo:', error);
      handleError(error, 'el procesamiento del rechazo');
    }
  };

  const handlePartialApprove = (approvedItems: string[], feedback?: string) => {
    if (!pendingApproval) {
      console.warn('Se intentó aprobar parcialmente, pero no hay una solicitud de aprobación pendiente');

      // Mostrar mensaje de error
      addChatMessage({
        id: generateUniqueId('partial-approval-error'),
        sender: 'system',
        content: 'Error: No hay una solicitud de aprobación pendiente. Por favor, intenta nuevamente.',
        timestamp: Date.now(),
        type: 'error'
      });

      return;
    }

    console.log(`Aprobando parcialmente ${approvedItems.length} elementos de la solicitud con ID: ${pendingApproval.id}`);
    console.log('Elementos aprobados:', approvedItems);

    // Añadir mensaje de chat indicando la aprobación parcial
    addChatMessage({
      id: generateUniqueId('partial-approval'),
      sender: 'user',
      content: `He aprobado parcialmente ${pendingApproval.type === 'batch' ? 'los archivos' : 'el plan'} (${approvedItems.length} de ${pendingApproval.items.length} elementos)${feedback ? `: ${feedback}` : '.'}`,
      timestamp: Date.now(),
      type: 'approval-response',
      metadata: {
        approvalId: pendingApproval.id,
        approvalStatus: 'partially-approved',
        approvalType: pendingApproval.type
      }
    });

    // Actualizar el estado para mostrar que estamos procesando
    setAIConstructorState(prev => ({
      ...prev,
      isAIBusy: true,
      currentAIAction: 'Procesando aprobación parcial...'
    }));

    try {
      // Llamar al método de aprobación parcial del orquestrador
      // Nota: El segundo parámetro debe ser true para aprobación parcial
      aiIterativeOrchestrator.handleApproval(pendingApproval.id, true, feedback, approvedItems);

      console.log('Solicitud de aprobación parcial enviada correctamente');
    } catch (error) {
      console.error('Error al procesar la aprobación parcial:', error);
      handleError(error, 'el procesamiento de la aprobación parcial');
    }
  };

  // Métodos para controlar el progreso
  const handlePauseProgress = () => {
    aiIterativeOrchestrator.pauseProcessing();

    // Añadir mensaje de chat indicando la pausa
    addChatMessage({
      id: generateUniqueId('pause'),
      sender: 'system',
      content: 'Proceso pausado. Puedes reanudarlo cuando estés listo.',
      timestamp: Date.now(),
      type: 'system'
    });
  };

  const handleResumeProgress = () => {
    aiIterativeOrchestrator.resumeProcessing();

    // Añadir mensaje de chat indicando la reanudación
    addChatMessage({
      id: generateUniqueId('resume'),
      sender: 'system',
      content: 'Proceso reanudado.',
      timestamp: Date.now(),
      type: 'system'
    });
  };

  const handleCancelProgress = () => {
    aiIterativeOrchestrator.cancelProcessing();

    // Añadir mensaje de chat indicando la cancelación
    addChatMessage({
      id: generateUniqueId('cancel'),
      sender: 'system',
      content: 'Proceso cancelado.',
      timestamp: Date.now(),
      type: 'system'
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-codestorm-darker">
      <Header showConstructorButton={false} />
      <main className="container flex-1 px-4 py-4 mx-auto">
        {aiConstructorState.showTemplateSelector && (
          <div className="p-6 mb-6 rounded-lg shadow-md bg-codestorm-dark">
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-white mb-3`}>
              Selecciona una Plantilla para Complementar tu Instrucción
            </h2>
            <div className="p-3 mb-4 border rounded-md bg-codestorm-blue/10 border-codestorm-blue/30">
              <p className="text-sm text-white">
                <span className="font-semibold">Instrucción recibida:</span> {localStorage.getItem('originalInstruction')}
              </p>
              <p className="mt-2 text-sm text-codestorm-accent">
                Selecciona una plantilla para complementar tu instrucción y crear un plan de desarrollo más completo.
              </p>
            </div>
            <ProjectTemplateSelector onSelectTemplate={handleTemplateSelection} />
            <button
              onClick={() => handleTemplateSelection(null)}
              className="px-4 py-2 mt-4 text-sm text-white bg-gray-600 rounded-md hover:bg-gray-700">
              Continuar sin plantilla
            </button>
          </div>
        )}

        {!aiConstructorState.showTemplateSelector && (
            <div className="p-6 mb-6 rounded-lg shadow-md bg-codestorm-dark">
            <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white mb-4`}>Constructor de CODESTORM (IA Activa)</h1>
            <p className="mb-2 text-gray-300">
                {aiConstructorState.selectedTemplate ? `Plantilla: ${aiConstructorState.selectedTemplate.name}. ` : ''}
                Describe tu proyecto, tarea o las modificaciones deseadas.
            </p>
            {aiConstructorState.isAIBusy && (
                <div className="flex items-center p-3 mb-4 border rounded-md bg-codestorm-blue/10 border-codestorm-blue/30">
                <Loader className="w-5 h-5 mr-2 text-codestorm-accent animate-spin" />
                <p className="text-sm text-white">IA: {aiConstructorState.currentAIAction || 'procesando'}...</p>
                </div>
            )}
            </div>
        )}

        {/* Interfaz de Aprobación */}
        {pendingApproval && (
          <div className="p-6 mb-6 rounded-lg shadow-md bg-codestorm-dark">
            <h2 className="mb-4 text-xl font-bold text-white">Aprobación Requerida</h2>
            <ApprovalInterface
              approvalData={pendingApproval}
              onApprove={handleApprove}
              onReject={handleReject}
              onPartialApprove={handlePartialApprove}
              isLoading={aiConstructorState.isAIBusy}
            />
          </div>
        )}

        {/* Indicador de Progreso */}
        {progress && (
          <div className="p-6 mb-6 rounded-lg shadow-md bg-codestorm-dark">
            <ProgressIndicator
              progress={progress}
              onPause={handlePauseProgress}
              onResume={handleResumeProgress}
              onCancel={handleCancelProgress}
              onViewLog={() => {}}
              isPaused={aiConstructorState.currentAIAction === 'paused'}
              showControls={true}
            />
          </div>
        )}

        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-12 gap-6'}`}>
          <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-4' : 'col-span-3'}`}>
            <CollapsiblePanel
              title="Explorador de Archivos"
              type="explorer"
              isVisible={showDirectoryExplorer}
              onToggleVisibility={() => setShowDirectoryExplorer(!showDirectoryExplorer)}
              showCollapseButton={true}
            >
              <div className={`${isMobile ? 'h-[300px]' : 'h-[400px]'}`}>
                <DirectoryExplorer
                  files={aiConstructorState.projectFiles}
                  onSelectFile={handleViewFileContent}
                  selectedFilePath={selectedFileForViewing?.path}
                />
              </div>
            </CollapsiblePanel>
          </div>
          <div className={`${isMobile ? 'col-span-1' : isTablet ? 'col-span-8' : 'col-span-9'} space-y-6`}>
            <CollapsiblePanel
              title={aiConstructorState.showTemplateSelector ? "Describe tu Proyecto" : "Chat Interactivo con IA"}
              type="terminal"
              isVisible={true}
              showCollapseButton={false}
            >
              <div className={`${isMobile ? 'h-[calc(100vh - 450px)]' : 'h-[600px]'}`}>
                <InteractiveChat
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  isProcessing={aiConstructorState.isAIBusy}
                  isDisabled={aiConstructorState.showTemplateSelector && !aiConstructorState.selectedTemplate}
                />
              </div>
            </CollapsiblePanel>
          </div>
        </div>
      </main>
      <BrandLogo size="md" showPulse={true} showGlow={true} />
      {showError && errorMessage && (
        <ErrorNotification
          message={errorMessage}
          type="error"
          onClose={() => {
            setShowError(false);
            setErrorMessage(null);
          }}
        />
      )}

      {/* Panel de modificación de código */}
      <CodeModifierPanel
        isVisible={isCodeModifierVisible}
        onClose={toggleCodeModifier}
        files={aiConstructorState.projectFiles}
        onApplyChanges={(originalFile: FileItem, modifiedFile: FileItem) => {
          // Actualizar el archivo en el estado
          setAIConstructorState(prev => ({
            ...prev,
            projectFiles: prev.projectFiles.map(f =>
              f.id === originalFile.id ? modifiedFile : f
            )
          }));

          // Añadir mensaje de confirmación
          addChatMessage({
            id: generateUniqueId('file-modified'),
            sender: 'ai',
            content: `Archivo '${modifiedFile.path}' modificado con éxito mediante el Agente Modificador de Código.`,
            timestamp: Date.now(),
            type: 'success',
            senderType: 'ai'
          });

          toggleCodeModifier();
        }}
      />

      <Footer showLogo={true} />
    </div>
  );
};

export default Constructor;
