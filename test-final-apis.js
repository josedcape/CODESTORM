/**
 * Script de prueba final para verificar que ambas APIs funcionen correctamente
 */

console.log('🧪 PRUEBA FINAL DE APIS CODESTORM');
console.log('='.repeat(40));

/**
 * Probar OpenAI a través del proxy
 */
async function testOpenAI() {
    console.log('\n🤖 PROBANDO OPENAI:');
    console.log('-'.repeat(20));
    
    try {
        const response = await fetch('http://localhost:3002/api/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                max_tokens: 20,
                messages: [{ role: 'user', content: 'Responde brevemente: ¿Qué es JavaScript?' }]
            })
        });

        console.log(`📡 Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ OpenAI funcionando correctamente');
            console.log(`📝 Respuesta: ${data.choices[0]?.message?.content || 'Sin contenido'}`);
            return true;
        } else {
            const errorData = await response.json();
            console.log('❌ Error en OpenAI:', JSON.stringify(errorData, null, 2));
            return false;
        }
    } catch (error) {
        console.log('❌ Error de conexión OpenAI:', error.message);
        return false;
    }
}

/**
 * Probar Anthropic a través del proxy
 */
async function testAnthropic() {
    console.log('\n🧠 PROBANDO ANTHROPIC:');
    console.log('-'.repeat(20));
    
    try {
        const response = await fetch('http://localhost:3002/api/anthropic/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 20,
                messages: [{ role: 'user', content: 'Responde brevemente: ¿Qué es TypeScript?' }]
            })
        });

        console.log(`📡 Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Anthropic funcionando correctamente');
            console.log(`📝 Respuesta: ${data.content[0]?.text || 'Sin contenido'}`);
            return true;
        } else {
            const errorData = await response.json();
            console.log('❌ Error en Anthropic:', JSON.stringify(errorData, null, 2));
            return false;
        }
    } catch (error) {
        console.log('❌ Error de conexión Anthropic:', error.message);
        return false;
    }
}

/**
 * Función principal
 */
async function main() {
    try {
        // Verificar que el proxy esté funcionando
        console.log('🌐 Verificando proxy...');
        const proxyResponse = await fetch('http://localhost:3002');
        if (!proxyResponse.ok) {
            console.log('❌ Proxy no disponible en puerto 3002');
            console.log('💡 Ejecuta: node simple-proxy.js');
            return;
        }
        console.log('✅ Proxy funcionando en puerto 3002');

        // Probar ambas APIs
        const openaiOk = await testOpenAI();
        const anthropicOk = await testAnthropic();

        // Resumen final
        console.log('\n🎯 RESUMEN FINAL:');
        console.log('='.repeat(20));
        console.log(`🤖 OpenAI: ${openaiOk ? '✅ FUNCIONANDO' : '❌ ERROR'}`);
        console.log(`🧠 Anthropic: ${anthropicOk ? '✅ FUNCIONANDO' : '❌ ERROR'}`);
        
        if (openaiOk && anthropicOk) {
            console.log('\n🎉 ¡AMBAS APIS FUNCIONANDO CORRECTAMENTE!');
            console.log('🚀 CODESTORM listo para usar con:');
            console.log('   - GPT-4O-Mini para generación de código');
            console.log('   - Claude para planificación y diseño');
        } else if (openaiOk) {
            console.log('\n✅ OpenAI funcionando - CODESTORM operativo');
            console.log('⚠️  Anthropic con problemas - Solo GPT disponible');
        } else {
            console.log('\n❌ Problemas de conectividad');
            console.log('💡 Verifica las claves API en .env');
        }

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error);
    }
}

// Ejecutar pruebas
main();
