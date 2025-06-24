#!/usr/bin/env node

/**
 * Script para configurar CODESTORM en modo público
 * Uso: node setup-public.js [local|public]
 */

import fs from 'fs';
import path from 'path';

const mode = process.argv[2] || 'public';

const configs = {
  local: {
    viteConfig: 'vite.config.local.ts',
    serverHost: 'localhost',
    description: 'Configuración local (localhost)'
  },
  public: {
    viteConfig: 'vite.config.public.ts',
    serverHost: '181.58.39.18',
    description: 'Configuración pública (181.58.39.18)'
  }
};

function setupMode(targetMode) {
  if (!configs[targetMode]) {
    console.error('❌ Modo no válido. Usa: local o public');
    process.exit(1);
  }

  const config = configs[targetMode];
  
  try {
    // Copiar la configuración de Vite correspondiente
    const sourceConfig = config.viteConfig;
    const targetConfig = 'vite.config.ts';
    
    if (fs.existsSync(sourceConfig)) {
      fs.copyFileSync(sourceConfig, targetConfig);
      console.log(`✅ Configuración cambiada a: ${config.description}`);
      console.log(`📁 Archivo copiado: ${sourceConfig} → ${targetConfig}`);
    } else {
      console.error(`❌ Archivo de configuración no encontrado: ${sourceConfig}`);
      process.exit(1);
    }

    // Mostrar instrucciones
    console.log('\n🚀 Instrucciones de uso:');
    if (targetMode === 'public') {
      console.log('   npm run start:public');
      console.log('\n🌐 URLs de acceso:');
      console.log('   - Local: http://localhost:5173');
      console.log('   - Público: http://181.58.39.18:5173');
      console.log('\n⚠️  Asegúrate de que los puertos 3001 y 5173 estén abiertos en tu firewall');
    } else {
      console.log('   npm run start');
      console.log('\n🌐 URL de acceso:');
      console.log('   - Local: http://localhost:5173');
    }

  } catch (error) {
    console.error('❌ Error al configurar el modo:', error.message);
    process.exit(1);
  }
}

console.log('🔧 CODESTORM - Configurador de Red');
console.log('=====================================');
setupMode(mode);
