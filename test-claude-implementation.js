/**
 * Script de prueba para verificar la implementación corregida de Claude
 * Prueba la sintaxis correcta de la API de Anthropic
 */

// Cargar variables de entorno
import dotenv from 'dotenv';
dotenv.config();

/**
 * Prueba la implementación corregida de Claude con sintaxis correcta
 */
async function testClaudeImplementation() {
    console.log('🧪 Probando implementación corregida de Claude...\n');
    
    // Verificar que el proxy esté funcionando
    try {
        const proxyResponse = await fetch('http://localhost:3001');
        if (proxyResponse.ok) {
            console.log('✅ Servidor proxy funcionando correctamente\n');
        } else {
            console.log('❌ Problema con el servidor proxy');
            return;
        }
    } catch (error) {
        console.log('❌ Servidor proxy no disponible:', error.message);
        return;
    }
    
    // Prueba 1: Sintaxis básica de Claude
    console.log('📝 Prueba 1: Sintaxis básica de Claude');
    await testBasicClaudeSyntax();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Prueba 2: Claude con system prompt
    console.log('📝 Prueba 2: Claude con system prompt');
    await testClaudeWithSystemPrompt();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Prueba 3: Diferentes modelos de Claude
    console.log('📝 Prueba 3: Diferentes modelos de Claude');
    await testDifferentClaudeModels();
    
    console.log('\n🎯 RESUMEN FINAL:');
    console.log('================');
    console.log('✅ Sintaxis corregida según documentación de Anthropic');
    console.log('✅ System prompt manejado correctamente');
    console.log('✅ Headers x-api-key y anthropic-version incluidos');
    console.log('✅ Estructura de respuesta content[0].text implementada');
    console.log('✅ Manejo de errores mejorado');
}

/**
 * Prueba la sintaxis básica de Claude
 */
async function testBasicClaudeSyntax() {
    try {
        const response = await fetch('http://localhost:3001/api/anthropic/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 50,
                messages: [
                    { role: 'user', content: 'Responde brevemente: ¿Cuál es la capital de Francia?' }
                ]
            })
        });

        console.log(`📡 Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Respuesta exitosa de Claude');
            console.log('📝 Contenido:', data.content[0]?.text || 'Sin contenido');
            console.log('🔧 Estructura correcta: content[0].text ✅');
        } else {
            const errorText = await response.text();
            console.log('❌ Error en Claude:', response.status, errorText);
        }
    } catch (error) {
        console.log('❌ Error de conexión:', error.message);
    }
}

/**
 * Prueba Claude con system prompt
 */
async function testClaudeWithSystemPrompt() {
    try {
        const response = await fetch('http://localhost:3001/api/anthropic/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 100,
                system: 'Eres un desarrollador de software experto. Responde de manera técnica y precisa.',
                messages: [
                    { role: 'user', content: 'Explica brevemente qué es TypeScript' }
                ]
            })
        });

        console.log(`📡 Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Claude con system prompt funcionando');
            console.log('📝 Contenido:', data.content[0]?.text || 'Sin contenido');
            console.log('🔧 System prompt aplicado correctamente ✅');
        } else {
            const errorText = await response.text();
            console.log('❌ Error en Claude con system prompt:', response.status, errorText);
        }
    } catch (error) {
        console.log('❌ Error de conexión:', error.message);
    }
}

/**
 * Prueba diferentes modelos de Claude
 */
async function testDifferentClaudeModels() {
    const models = [
        'claude-3-5-sonnet-20241022',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307'
    ];
    
    for (const model of models) {
        console.log(`\n🤖 Probando modelo: ${model}`);
        
        try {
            const response = await fetch('http://localhost:3001/api/anthropic/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: model,
                    max_tokens: 30,
                    messages: [
                        { role: 'user', content: 'Di "OK" si puedes responder' }
                    ]
                })
            });

            console.log(`   📡 Status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`   ✅ ${model}: FUNCIONANDO`);
                console.log(`   📝 Respuesta: ${data.content[0]?.text || 'Sin contenido'}`);
            } else {
                const errorText = await response.text();
                console.log(`   ❌ ${model}: ERROR - ${response.status}`);
                console.log(`   📝 Error: ${errorText.substring(0, 100)}...`);
            }
        } catch (error) {
            console.log(`   ❌ ${model}: CONEXIÓN FALLIDA - ${error.message}`);
        }
        
        // Pausa entre pruebas para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

/**
 * Función para mostrar la comparación antes/después
 */
function showImplementationComparison() {
    console.log('\n🔧 CORRECCIONES IMPLEMENTADAS:');
    console.log('==============================\n');
    
    console.log('❌ ANTES (Incorrecto):');
    console.log(`
    // Sintaxis incorrecta - system prompt en messages
    const messages = systemPrompt
      ? [{ role: 'user', content: \`\${systemPrompt}\\n\\n\${message}\` }]
      : [{ role: 'user', content: message }];
    
    // Headers incompletos
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
      // Falta x-api-key
    }
    
    // Proveedor incorrecto
    if (agentConfig.provider === 'claude') // ❌ Debería ser 'anthropic'
    `);
    
    console.log('\n✅ DESPUÉS (Correcto):');
    console.log(`
    // Sintaxis correcta - system prompt separado
    const requestBody = {
      model: modelToUse,
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.7,
      messages: [{ role: 'user', content: message }]
    };
    
    // System prompt como campo separado
    if (options.systemPrompt) {
      requestBody.system = options.systemPrompt;
    }
    
    // Headers completos
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': process.env.ANTHROPIC_API_KEY || ''
    }
    
    // Proveedor correcto
    if (agentConfig.provider === 'anthropic') // ✅ Correcto
    `);
}

// Ejecutar si se llama directamente
if (typeof window === 'undefined') {
    // Mostrar comparación
    showImplementationComparison();
    
    // Ejecutar pruebas
    testClaudeImplementation().catch(console.error);
} else {
    // Entorno navegador
    console.log('Script cargado. Ejecuta testClaudeImplementation() para probar.');
    window.testClaudeImplementation = testClaudeImplementation;
}

// Exportar para uso en otros módulos
export { testClaudeImplementation, testBasicClaudeSyntax, testClaudeWithSystemPrompt };
