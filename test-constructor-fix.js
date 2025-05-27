// Test script to verify the constructor/builder page fix
// This script simulates the file construction process to ensure no blank page occurs

import { AIIterativeOrchestrator } from './src/services/AIIterativeOrchestrator.js';

async function testFileConstructionProcess() {
  console.log('🧪 Testing file construction process...');
  
  try {
    // Get the orchestrator instance
    const orchestrator = AIIterativeOrchestrator.getInstance();
    
    // Mock files to simulate the construction process
    const mockFiles = [
      {
        path: 'index.html',
        content: '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Test Page</h1></body></html>',
        language: 'html'
      },
      {
        path: 'styles.css',
        content: 'body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }',
        language: 'css'
      },
      {
        path: 'script.js',
        content: 'console.log("Test script loaded");',
        language: 'javascript'
      }
    ];
    
    console.log('📁 Mock files created:', mockFiles.length);
    
    // Test the processGeneratedFiles method
    console.log('🔄 Testing processGeneratedFiles method...');
    
    // Add listeners to monitor the process
    let filesUpdated = false;
    let stateUpdated = false;
    let messagesReceived = 0;
    
    const fileListener = (files) => {
      console.log('📄 Files updated:', files.length);
      filesUpdated = true;
    };
    
    const stateListener = (state) => {
      console.log('🔄 State updated:', state.phase);
      stateUpdated = true;
    };
    
    const chatListener = (messages) => {
      console.log('💬 Chat messages received:', messages.length);
      messagesReceived = messages.length;
    };
    
    // Add listeners
    orchestrator.addFileListener(fileListener);
    orchestrator.addStateListener(stateListener);
    orchestrator.addChatListener(chatListener);
    
    // Simulate the file construction process
    console.log('🚀 Starting file construction simulation...');
    
    // This should complete without causing a blank page
    await orchestrator.processGeneratedFiles(mockFiles);
    
    console.log('✅ File construction completed successfully!');
    
    // Verify the results
    console.log('📊 Test Results:');
    console.log('  - Files updated:', filesUpdated);
    console.log('  - State updated:', stateUpdated);
    console.log('  - Messages received:', messagesReceived);
    
    // Clean up listeners
    orchestrator.removeFileListener(fileListener);
    orchestrator.removeStateListener(stateListener);
    orchestrator.removeChatListener(chatListener);
    
    if (filesUpdated && stateUpdated && messagesReceived > 0) {
      console.log('🎉 All tests passed! The blank page issue should be fixed.');
      return true;
    } else {
      console.log('❌ Some tests failed. There might still be issues.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
  testFileConstructionProcess().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testFileConstructionProcess };
