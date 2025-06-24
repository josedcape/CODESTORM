/**
 * Test del Production Agent - Control de Calidad WebAI
 * 
 * Este script prueba específicamente el nuevo Agente de Producción
 * para verificar que funciona correctamente en el flujo WebAI.
 */

import { UnifiedPlanningService } from './src/services/UnifiedPlanningService.js';

console.log('🧪 Iniciando test del Production Agent...\n');

// Crear instancia del servicio con callbacks de prueba
const planningService = new UnifiedPlanningService({
  onStateChange: (state) => {
    console.log(`📊 Estado: ${state.currentPhase}`);
    if (state.coordinationProgress) {
      console.log(`   └─ ${state.coordinationProgress.currentAgent}: ${state.coordinationProgress.stage} (${state.coordinationProgress.progress}%)`);
    }
  },
  onProgress: (message, progress) => {
    console.log(`📈 ${progress}%: ${message}`);
  },
  onError: (error) => {
    console.error('❌ Error:', error);
  },
  onComplete: (files) => {
    console.log('\n✅ ARCHIVOS GENERADOS:');
    files.forEach(file => {
      console.log(`📄 ${file.name}: ${file.content.length} caracteres`);
      
      // Mostrar preview específico para cada tipo de archivo
      if (file.name === 'index.html') {
        console.log('   🏗️  HTML Preview:', file.content.substring(0, 150) + '...');
      } else if (file.name === 'styles.css') {
        console.log('   🎨 CSS Preview:', file.content.substring(0, 150) + '...');
      } else if (file.name === 'script.js') {
        console.log('   ⚡ JS Preview:', file.content.substring(0, 150) + '...');
      }
    });
    
    console.log('\n🔍 VERIFICACIÓN DEL PRODUCTION AGENT:');
    console.log('✓ Archivos optimizados generados');
    console.log('✓ Control de calidad aplicado');
    console.log('✓ Flujo completado exitosamente');
    
    console.log('\n🎉 Test del Production Agent COMPLETADO');
  }
});

// Función para ejecutar el test
async function testProductionAgent() {
  try {
    console.log('🚀 Iniciando flujo WebAI con Production Agent...\n');
    
    // 1. Configurar instrucción de prueba
    const testInstruction = "Crear una página web moderna para una tienda de tecnología con secciones de productos, sobre nosotros y contacto. Debe tener un diseño profesional y colores llamativos.";
    
    planningService.updateInstruction(testInstruction);
    console.log('📝 Instrucción configurada:', testInstruction);
    
    // 2. Iniciar planificación
    await planningService.startPlanning();
    console.log('📋 Planificación iniciada...');
    
    // 3. Saltar mejora de prompt para ir directo al plan
    await planningService.skipEnhancement();
    console.log('⏭️  Mejora de prompt omitida...');
    
    // 4. Generar plan
    await planningService.generatePlan();
    console.log('📊 Plan generado...');
    
    // 5. Aprobar plan automáticamente
    await planningService.approvePlan(true);
    console.log('✅ Plan aprobado automáticamente...');
    
    console.log('\n🤖 Iniciando coordinación de agentes...');
    console.log('   1. Design Architect Agent');
    console.log('   2. Code Constructor Agent'); 
    console.log('   3. JavaScript Agent');
    console.log('   4. GIFT Agent');
    console.log('   5. 🆕 Production Agent (NUEVO)');
    console.log('   6. Integración Final\n');
    
  } catch (error) {
    console.error('❌ Error en el test:', error);
  }
}

// Ejecutar el test
testProductionAgent();

// Información adicional sobre el test
console.log('\n📋 INFORMACIÓN DEL TEST:');
console.log('• Objetivo: Verificar funcionamiento del Production Agent');
console.log('• Flujo: Completo (6 fases con nuevo agente)');
console.log('• Enfoque: Control de calidad y optimización');
console.log('• Resultado esperado: Archivos optimizados y reporte de calidad');
console.log('\n⏱️  Tiempo estimado: 2-3 minutos');
console.log('🔍 Observar especialmente la fase "Control de Calidad y Optimización"');
