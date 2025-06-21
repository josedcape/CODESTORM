/**
 * Script de prueba para verificar conexiones reales a las APIs
 * Este script prueba las conexiones reales a OpenAI y Claude a través del proxy
 */

// Cargar variables de entorno
import dotenv from 'dotenv';
dotenv.config();

// Función para probar conexión a OpenAI
async function testOpenAIConnection() {
    console.log('🧪 Probando conexión real a OpenAI...');
    
    try {
        const response = await fetch('http://localhost:3001/api/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Test connection - respond with OK' }]
            })
        });

        console.log(`📡 OpenAI Response Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ OpenAI conectado exitosamente');
            console.log('📝 Respuesta:', data.choices?.[0]?.message?.content || 'Sin contenido');
            return { success: true, provider: 'openai', data };
        } else {
            const errorText = await response.text();
            console.log('❌ Error en OpenAI:', response.status, errorText);
            return { success: false, provider: 'openai', error: errorText };
        }
    } catch (error) {
        console.log('❌ Error de conexión OpenAI:', error.message);
        return { success: false, provider: 'openai', error: error.message };
    }
}

// Función para probar conexión a Claude
async function testClaudeConnection() {
    console.log('🧪 Probando conexión real a Claude...');
    
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
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Test connection - respond with OK' }]
            })
        });

        console.log(`📡 Claude Response Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Claude conectado exitosamente');
            console.log('📝 Respuesta:', data.content?.[0]?.text || 'Sin contenido');
            return { success: true, provider: 'claude', data };
        } else {
            const errorText = await response.text();
            console.log('❌ Error en Claude:', response.status, errorText);
            return { success: false, provider: 'claude', error: errorText };
        }
    } catch (error) {
        console.log('❌ Error de conexión Claude:', error.message);
        return { success: false, provider: 'claude', error: error.message };
    }
}

// Función principal de prueba
async function runRealAPITests() {
    console.log('🚀 Iniciando pruebas de conexión real a APIs...\n');
    
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
    
    // Probar ambas APIs
    const results = await Promise.allSettled([
        testOpenAIConnection(),
        testClaudeConnection()
    ]);
    
    console.log('\n📊 RESUMEN DE RESULTADOS:');
    console.log('========================');
    
    results.forEach((result, index) => {
        const provider = index === 0 ? 'OpenAI' : 'Claude';
        
        if (result.status === 'fulfilled') {
            const { success, error } = result.value;
            if (success) {
                console.log(`✅ ${provider}: CONECTADO`);
            } else {
                console.log(`❌ ${provider}: ERROR - ${error}`);
            }
        } else {
            console.log(`❌ ${provider}: FALLO - ${result.reason}`);
        }
    });
    
    // Determinar estado general
    const successfulConnections = results.filter(r => 
        r.status === 'fulfilled' && r.value.success
    ).length;
    
    console.log('\n🎯 ESTADO GENERAL:');
    if (successfulConnections === 2) {
        console.log('🟢 EXCELENTE: Ambas APIs funcionando');
    } else if (successfulConnections === 1) {
        console.log('🟡 PARCIAL: Una API funcionando (fallback disponible)');
    } else {
        console.log('🔴 CRÍTICO: Ninguna API funcionando');
    }
    
    console.log('\n💡 RECOMENDACIONES:');
    if (successfulConnections < 2) {
        console.log('- Verificar claves API en archivo .env');
        console.log('- Comprobar conectividad a internet');
        console.log('- Revisar configuración del proxy');
    } else {
        console.log('- Sistema listo para testing real de agentes');
        console.log('- Todas las conexiones funcionando correctamente');
    }
}

// Ejecutar si se llama directamente
if (typeof window === 'undefined') {
    // Entorno Node.js
    runRealAPITests().catch(console.error);
} else {
    // Entorno navegador
    console.log('Script cargado. Ejecuta runRealAPITests() para probar las conexiones.');
    window.runRealAPITests = runRealAPITests;
}

// Exportar para uso en otros módulos
export { runRealAPITests, testOpenAIConnection, testClaudeConnection };
