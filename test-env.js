import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

console.log('🔍 VERIFICANDO VARIABLES DE ENTORNO:');
console.log('=====================================');

console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Configurada' : '❌ No configurada'}`);
if (process.env.OPENAI_API_KEY) {
    console.log(`  - Longitud: ${process.env.OPENAI_API_KEY.length} caracteres`);
    console.log(`  - Formato: ${process.env.OPENAI_API_KEY.startsWith('sk-') ? '✅ Correcto' : '❌ Incorrecto'}`);
    console.log(`  - Primeros 10 chars: ${process.env.OPENAI_API_KEY.substring(0, 10)}...`);
}

console.log(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Configurada' : '❌ No configurada'}`);
if (process.env.ANTHROPIC_API_KEY) {
    console.log(`  - Longitud: ${process.env.ANTHROPIC_API_KEY.length} caracteres`);
    console.log(`  - Formato: ${process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-') ? '✅ Correcto' : '❌ Incorrecto'}`);
    console.log(`  - Primeros 15 chars: ${process.env.ANTHROPIC_API_KEY.substring(0, 15)}...`);
}

console.log('\n🧪 PROBANDO CONEXIÓN DIRECTA A OPENAI:');
console.log('======================================');

// Probar conexión directa a OpenAI
try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            max_tokens: 5,
            messages: [{ role: 'user', content: 'Test' }]
        })
    });

    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
        const data = await response.json();
        console.log('✅ OpenAI API funcionando directamente');
        console.log(`Respuesta: ${data.choices[0]?.message?.content || 'Sin contenido'}`);
    } else {
        const errorData = await response.json();
        console.log('❌ Error en OpenAI API:');
        console.log(JSON.stringify(errorData, null, 2));
    }
} catch (error) {
    console.log('❌ Error de conexión:', error.message);
}
