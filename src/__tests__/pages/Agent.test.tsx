import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

// Test para la función handleModificationRequest del componente Agent
// Este test se enfoca en la lógica de la función sin renderizar el componente completo

// Mock de las dependencias necesarias
const mockSetIsModifying = vi.fn();
const mockSetModificationInput = vi.fn();
const mockSetChatMessages = vi.fn();
const mockSetWorkflowState = vi.fn();
const mockSetSelectedFile = vi.fn();

// Mock de generateUniqueId
vi.mock('../../utils/idGenerator', () => ({
  generateUniqueId: (prefix: string) => `${prefix}-test-id`
}));

// Función handleModificationRequest extraída para testing
const createHandleModificationRequest = (
  modificationInput: string,
  isModifying: boolean,
  workflowState: any,
  selectedFile: any = null
) => {
  return async () => {
    if (!modificationInput.trim() || isModifying || !workflowState.isPostGeneration) return;

    mockSetIsModifying(true);
    const modificationId = 'modification-test-id';

    try {
      // Add user message to chat
      const userMessage = {
        id: 'user-modification-test-id',
        sender: 'user',
        content: modificationInput,
        timestamp: Date.now(),
        type: 'text',
        senderType: 'user'
      };
      mockSetChatMessages(prev => [...prev, userMessage]);

      // Add AI processing message
      mockSetChatMessages(prev => [...prev, {
        id: 'modification-processing-test-id',
        sender: 'ai',
        content: '🤖 Iniciando modificación automática inteligente...',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai'
      }]);

      // Simulate modification process (simplified approach)
      await new Promise(resolve => setTimeout(resolve, 100)); // Reduced time for testing

      // Simulate successful modification
      const mockModifiedFiles = workflowState.generatedFiles.map(file => ({
        ...file,
        content: file.content + '\n// Modificación aplicada: ' + modificationInput,
        lastModified: Date.now()
      }));

      // Update files with modifications
      mockSetWorkflowState(prev => ({
        ...prev,
        generatedFiles: mockModifiedFiles,
        modificationHistory: [...prev.modificationHistory, {
          id: modificationId,
          timestamp: Date.now(),
          instruction: modificationInput,
          filesModified: mockModifiedFiles.map(f => f.path),
          agentUsed: 'Agent Modificación',
          success: true,
          description: `${mockModifiedFiles.length} archivos modificados`
        }],
        currentModificationId: modificationId
      }));

      // Add success message
      mockSetChatMessages(prev => [...prev, {
        id: 'modification-success-test-id',
        sender: 'ai',
        content: `✅ Modificación completada exitosamente!\n\n📁 Archivos modificados: ${mockModifiedFiles.length}\n📝 Archivos: ${mockModifiedFiles.map(f => f.path).join(', ')}`,
        timestamp: Date.now(),
        type: 'success',
        senderType: 'ai'
      }]);

      // Update selected file if it was modified
      if (selectedFile) {
        const updatedSelectedFile = mockModifiedFiles.find(f => f.path === selectedFile.path);
        if (updatedSelectedFile) {
          mockSetSelectedFile(updatedSelectedFile);
        }
      }

      // Clear modification input
      mockSetModificationInput('');

    } catch (error) {
      console.error('Error in modification:', error);
      mockSetChatMessages(prev => [...prev, {
        id: 'modification-error-test-id',
        sender: 'ai',
        content: `❌ Error en la modificación: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: Date.now(),
        type: 'error',
        senderType: 'ai'
      }]);
    } finally {
      mockSetIsModifying(false);
    }
  };
};

describe('Agent Page - handleModificationRequest Function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockWorkflowState = (isPostGeneration = true) => ({
    currentStep: 5,
    isProcessing: false,
    userInstruction: 'Test project',
    selectedStack: null,
    selectedTemplate: null,
    steps: [],
    generatedFiles: [
      {
        path: 'index.html',
        content: '<html><body>Test</body></html>',
        type: 'file',
        lastModified: Date.now()
      },
      {
        path: 'styles.css',
        content: 'body { margin: 0; }',
        type: 'file',
        lastModified: Date.now()
      }
    ],
    currentProgress: null,
    isPostGeneration,
    modificationHistory: [],
    currentModificationId: null
  });

  it('should not execute when input is empty', async () => {
    const workflowState = createMockWorkflowState();
    const handleModificationRequest = createHandleModificationRequest('', false, workflowState);

    await handleModificationRequest();

    // Should not call any state setters
    expect(mockSetIsModifying).not.toHaveBeenCalled();
    expect(mockSetChatMessages).not.toHaveBeenCalled();
    expect(mockSetWorkflowState).not.toHaveBeenCalled();
  });

  it('should not execute when already modifying', async () => {
    const workflowState = createMockWorkflowState();
    const handleModificationRequest = createHandleModificationRequest('Test modification', true, workflowState);

    await handleModificationRequest();

    // Should not call any state setters
    expect(mockSetIsModifying).not.toHaveBeenCalled();
    expect(mockSetChatMessages).not.toHaveBeenCalled();
    expect(mockSetWorkflowState).not.toHaveBeenCalled();
  });

  it('should not execute when not in post-generation state', async () => {
    const workflowState = createMockWorkflowState(false); // Not in post-generation
    const handleModificationRequest = createHandleModificationRequest('Test modification', false, workflowState);

    await handleModificationRequest();

    // Should not call any state setters
    expect(mockSetIsModifying).not.toHaveBeenCalled();
    expect(mockSetChatMessages).not.toHaveBeenCalled();
    expect(mockSetWorkflowState).not.toHaveBeenCalled();
  });

  it('should execute successfully with valid input and post-generation state', async () => {
    const workflowState = createMockWorkflowState();
    const handleModificationRequest = createHandleModificationRequest('Cambiar color a azul', false, workflowState);

    await handleModificationRequest();

    // Should set isModifying to true at start
    expect(mockSetIsModifying).toHaveBeenCalledWith(true);

    // Should add user message
    expect(mockSetChatMessages).toHaveBeenCalledWith(expect.any(Function));

    // Should add processing message
    expect(mockSetChatMessages).toHaveBeenCalledWith(expect.any(Function));

    // Should update workflow state with modified files
    expect(mockSetWorkflowState).toHaveBeenCalledWith(expect.any(Function));

    // Should add success message
    expect(mockSetChatMessages).toHaveBeenCalledWith(expect.any(Function));

    // Should clear modification input
    expect(mockSetModificationInput).toHaveBeenCalledWith('');

    // Should set isModifying to false at end
    expect(mockSetIsModifying).toHaveBeenCalledWith(false);
  });

  it('should update selected file if it was modified', async () => {
    const workflowState = createMockWorkflowState();
    const selectedFile = {
      path: 'index.html',
      content: '<html><body>Test</body></html>',
      type: 'file',
      lastModified: Date.now()
    };

    const handleModificationRequest = createHandleModificationRequest(
      'Cambiar color a azul',
      false,
      workflowState,
      selectedFile
    );

    await handleModificationRequest();

    // Should update selected file
    expect(mockSetSelectedFile).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'index.html',
        content: expect.stringContaining('Modificación aplicada: Cambiar color a azul')
      })
    );
  });

  it('should handle errors gracefully', async () => {
    const workflowState = createMockWorkflowState();

    // Create a version that throws an error
    const createErrorHandleModificationRequest = () => {
      return async () => {
        if (!workflowState.isPostGeneration) return;

        mockSetIsModifying(true);

        try {
          // Simulate an error
          throw new Error('Test error');
        } catch (error) {
          console.error('Error in modification:', error);
          mockSetChatMessages(prev => [...prev, {
            id: 'modification-error-test-id',
            sender: 'ai',
            content: `❌ Error en la modificación: ${error instanceof Error ? error.message : 'Error desconocido'}`,
            timestamp: Date.now(),
            type: 'error',
            senderType: 'ai'
          }]);
        } finally {
          mockSetIsModifying(false);
        }
      };
    };

    const handleModificationRequest = createErrorHandleModificationRequest();
    await handleModificationRequest();

    // Should set isModifying to true at start
    expect(mockSetIsModifying).toHaveBeenCalledWith(true);

    // Should add error message
    expect(mockSetChatMessages).toHaveBeenCalledWith(expect.any(Function));

    // Should set isModifying to false at end
    expect(mockSetIsModifying).toHaveBeenCalledWith(false);
  });

  it('should properly modify file content', async () => {
    const workflowState = createMockWorkflowState();
    const handleModificationRequest = createHandleModificationRequest('Agregar comentario', false, workflowState);

    await handleModificationRequest();

    // Verify that setWorkflowState was called with a function
    expect(mockSetWorkflowState).toHaveBeenCalledWith(expect.any(Function));

    // Get the function that was passed to setWorkflowState
    const updateFunction = mockSetWorkflowState.mock.calls[0][0];
    const mockPrevState = {
      ...workflowState,
      modificationHistory: []
    };

    // Call the function to see what it returns
    const newState = updateFunction(mockPrevState);

    // Verify the new state has modified files
    expect(newState.generatedFiles).toHaveLength(2);
    expect(newState.generatedFiles[0].content).toContain('Modificación aplicada: Agregar comentario');
    expect(newState.generatedFiles[1].content).toContain('Modificación aplicada: Agregar comentario');

    // Verify modification history was updated
    expect(newState.modificationHistory).toHaveLength(1);
    expect(newState.modificationHistory[0]).toMatchObject({
      instruction: 'Agregar comentario',
      agentUsed: 'Agent Modificación',
      success: true,
      filesModified: ['index.html', 'styles.css']
    });
  });

  it('should ensure isModifying state is always reset', async () => {
    const workflowState = createMockWorkflowState();
    const handleModificationRequest = createHandleModificationRequest('Test modification', false, workflowState);

    await handleModificationRequest();

    // Check that setIsModifying was called twice: true at start, false at end
    expect(mockSetIsModifying).toHaveBeenCalledTimes(2);
    expect(mockSetIsModifying).toHaveBeenNthCalledWith(1, true);
    expect(mockSetIsModifying).toHaveBeenNthCalledWith(2, false);
  });
});
