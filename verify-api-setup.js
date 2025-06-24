/**
 * Script para verificar la configuración de APIs en CODESTORM
 * Verifica que las claves API estén configuradas y el proxy funcione
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Cargar variables de entorno
dotenv.config();

console.log('🔍 VERIFICANDO CONFIGURACIÓN DE APIS CODESTORM');
console.log('='.repeat(50));

/**
 * Verificar variables de entorno
 */
function checkEnvironmentVariables() {
    console.log('\n📋 1. VERIFICANDO VARIABLES DE ENTORNO:');
    console.log('-'.repeat(40));
    
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    console.log(`🤖 ANTHROPIC_API_KEY: ${anthropicKey ? '✅ Configurada' : '❌ No configurada'}`);
    if (anthropicKey) {
        console.log(`   📝 Formato: ${anthropicKey.startsWith('sk-ant-') ? '✅ Correcto' : '❌ Incorrecto'}`);
        console.log(`   📏 Longitud: ${anthropicKey.length} caracteres`);
    }
    
    console.log(`🤖 OPENAI_API_KEY: ${openaiKey ? '✅ Configurada' : '❌ No configurada'}`);
    if (openaiKey) {
        console.log(`   📝 Formato: ${openaiKey.startsWith('sk-') ? '✅ Correcto' : '❌ Incorrecto'}`);
        console.log(`   📏 Longitud: ${openaiKey.length} caracteres`);
    }
    
    return { anthropicKey, openaiKey };
}

/**
 * Verificar servidor proxy
 */
async function checkProxyServer() {
    console.log('\n🌐 2. VERIFICANDO SERVIDOR PROXY:');
    console.log('-'.repeat(40));
    
    try {
        const response = await fetch('http://localhost:3001', { timeout: 5000 });
        if (response.ok) {
            const text = await response.text();
            console.log('✅ Servidor proxy funcionando');
            console.log(`📝 Respuesta: ${text.substring(0, 50)}...`);
            return true;
        } else {
            console.log(`❌ Servidor proxy error: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Servidor proxy no disponible: ${error.message}`);
        console.log('💡 Ejecuta: npm run server');
        return false;
    }
}

/**
 * Probar conexión a Anthropic
 */
async function testAnthropicConnection() {
    console.log('\n🧠 3. PROBANDO CONEXIÓN A ANTHROPIC:');
    console.log('-'.repeat(40));
    
    try {
        const response = await fetch('http://localhost:3001/api/anthropic/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Test' }]
            }),
            timeout: 10000
        });
        
        console.log(`📡 Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Anthropic API funcionando correctamente');
            console.log(`📝 Respuesta: ${data.content[0]?.text || 'Sin contenido'}`);
            return true;
        } else if (response.status === 401) {
            const errorData = await response.json();
            console.log('❌ Error de autenticación (401)');
            console.log('💡 Verifica tu ANTHROPIC_API_KEY en el archivo .env');
            console.log(`📝 Error: ${errorData.error?.message || 'Sin mensaje'}`);
            return false;
        } else {
            const errorText = await response.text();
            console.log(`❌ Error ${response.status}: ${errorText.substring(0, 100)}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error de conexión: ${error.message}`);
        return false;
    }
}

/**
 * Probar conexión a OpenAI
 */
async function testOpenAIConnection() {
    console.log('\n🤖 4. PROBANDO CONEXIÓN A OPENAI:');
    console.log('-'.repeat(40));
    
    try {
        const response = await fetch('http://localhost:3001/api/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Test' }]
            }),
            timeout: 10000
        });
        
        console.log(`📡 Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ OpenAI API funcionando correctamente');
            console.log(`📝 Respuesta: ${data.choices[0]?.message?.content || 'Sin contenido'}`);
            return true;
        } else if (response.status === 401) {
            const errorData = await response.json();
            console.log('❌ Error de autenticación (401)');
            console.log('💡 Verifica tu OPENAI_API_KEY en el archivo .env');
            console.log(`📝 Error: ${errorData.error?.message || 'Sin mensaje'}`);
            return false;
        } else {
            const errorText = await response.text();
            console.log(`❌ Error ${response.status}: ${errorText.substring(0, 100)}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error de conexión: ${error.message}`);
        return false;
    }
}

/**
 * Mostrar resumen y recomendaciones
 */
function showSummaryAndRecommendations(results) {
    console.log('\n🎯 RESUMEN DE VERIFICACIÓN:');
    console.log('='.repeat(50));
    
    const { envVars, proxyOk, anthropicOk, openaiOk } = results;
    
    console.log(`📋 Variables de entorno: ${envVars.anthropicKey && envVars.openaiKey ? '✅' : '❌'}`);
    console.log(`🌐 Servidor proxy: ${proxyOk ? '✅' : '❌'}`);
    console.log(`🧠 Anthropic API: ${anthropicOk ? '✅' : '❌'}`);
    console.log(`🤖 OpenAI API: ${openaiOk ? '✅' : '❌'}`);
    
    console.log('\n💡 RECOMENDACIONES:');
    console.log('-'.repeat(30));
    
    if (!envVars.anthropicKey) {
        console.log('❌ Configura ANTHROPIC_API_KEY en .env');
        console.log('   1. Visita: https://console.anthropic.com/');
        console.log('   2. Crea una clave API');
        console.log('   3. Agrégala al archivo .env');
    }
    
    if (!envVars.openaiKey) {
        console.log('❌ Configura OPENAI_API_KEY en .env');
        console.log('   1. Visita: https://platform.openai.com/api-keys');
        console.log('   2. Crea una clave API');
        console.log('   3. Agrégala al archivo .env');
    }
    
    if (!proxyOk) {
        console.log('❌ Inicia el servidor proxy:');
        console.log('   npm run server');
    }
    
    if (proxyOk && envVars.anthropicKey && envVars.openaiKey && (anthropicOk || openaiOk)) {
        console.log('✅ ¡Sistema configurado correctamente!');
        console.log('🚀 CODESTORM listo para usar');
    }
}

/**
 * Función principal
 */
async function main() {
    try {
        // 1. Verificar variables de entorno
        const envVars = checkEnvironmentVariables();
        
        // 2. Verificar servidor proxy
        const proxyOk = await checkProxyServer();
        
        let anthropicOk = false;
        let openaiOk = false;
        
        if (proxyOk) {
            // 3. Probar Anthropic
            anthropicOk = await testAnthropicConnection();
            
            // 4. Probar OpenAI
            openaiOk = await testOpenAIConnection();
        }
        
        // 5. Mostrar resumen
        showSummaryAndRecommendations({
            envVars,
            proxyOk,
            anthropicOk,
            openaiOk
        });
        
    } catch (error) {
        console.error('❌ Error durante la verificación:', error);
    }
}

// Ejecutar verificación
main();
