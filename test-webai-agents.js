// Test script para verificar que los agentes de WebAI están funcionando
import { UnifiedPlanningService } from './src/services/UnifiedPlanningService.js';

console.log('🧪 Iniciando prueba de agentes WebAI...');

// Crear instancia del servicio
const planningService = new UnifiedPlanningService({
  onStateChange: (state) => {
    console.log('📊 Estado cambiado:', state.currentPhase);
  },
  onProgress: (message, progress) => {
    console.log(`📈 Progreso ${progress}%: ${message}`);
  },
  onError: (error) => {
    console.error('❌ Error:', error);
  },
  onComplete: (files) => {
    console.log('✅ Archivos generados:', files.length);
    files.forEach(file => {
      console.log(`📄 ${file.name}: ${file.content.length} caracteres`);
      console.log(`📄 Preview de ${file.name}:`, file.content.substring(0, 200) + '...');
    });
  }
});

// Función de prueba
async function testWebAIAgents() {
  try {
    console.log('🎯 Iniciando generación de plan...');
    
    // Generar plan
    await planningService.generatePlan('crea una página de ventas de productos de cocina');
    
    console.log('✅ Plan generado exitosamente');
    
    // Aprobar plan para iniciar coordinación de agentes
    console.log('🚀 Iniciando coordinación de agentes...');
    await planningService.approvePlan();
    
    console.log('🎉 Prueba completada exitosamente');
    
  } catch (error) {
    console.error('💥 Error en la prueba:', error);
  }
}

// Ejecutar prueba
testWebAIAgents();
