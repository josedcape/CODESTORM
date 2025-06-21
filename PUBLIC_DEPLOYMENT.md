# CODESTORM - Configuración para Acceso Público

## 📡 Configuración de Red Pública

Este documento explica cómo configurar CODESTORM para ser accesible desde una dirección IP pública.

### 🔧 Cambios Realizados

#### 1. Configuración de Vite (`vite.config.ts`)
- **Host**: Configurado para escuchar en `0.0.0.0` (todas las interfaces de red)
- **Puerto**: 5173 (accesible públicamente)
- **Proxy**: Configurado para usar la IP pública `181.58.39.18:3001`

#### 2. Configuración del Servidor Proxy (`server.js`)
- **Host**: Configurado para escuchar en `0.0.0.0`
- **Puerto**: 3001 (accesible públicamente)
- **CORS**: Configurado para permitir acceso desde:
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`
  - `http://181.58.39.18:5173`
  - `http://181.58.39.18:3001`

#### 3. Scripts de Package.json
- **`npm run start:public`**: Inicia ambos servidores en modo público
- **`npm run dev:public`**: Inicia solo el servidor de desarrollo en modo público

### 🚀 Instrucciones de Uso

#### Método Recomendado: Configuración Automática
```bash
# Configurar para acceso público
npm run setup:public

# Iniciar en modo público
npm run start:public
```

#### Método Alternativo: Scripts Directos
```bash
# Opción 1: Inicio completo público
npm run start:public

# Opción 2: Inicio manual
# Terminal 1: Servidor proxy
npm run proxy

# Terminal 2: Servidor de desarrollo público
npm run dev:public
```

#### Volver a Configuración Local
```bash
# Configurar para acceso local
npm run setup:local

# Iniciar en modo local
npm run start
```

### 🌐 URLs de Acceso

Una vez iniciado, CODESTORM estará disponible en:

- **Acceso Local**: `http://localhost:5173`
- **Acceso Público**: `http://181.58.39.18:5173`
- **Servidor Proxy**: `http://181.58.39.18:3001`

### 🔒 Consideraciones de Seguridad

#### ⚠️ Importante
- **Firewall**: Asegúrate de que los puertos 3001 y 5173 estén abiertos en tu firewall
- **Router**: Configura el port forwarding en tu router si es necesario
- **Variables de Entorno**: Mantén seguras tus API keys en el archivo `.env`

#### 🛡️ Recomendaciones
1. **Usar HTTPS**: Para producción, considera usar un proxy reverso con SSL
2. **Autenticación**: Implementa autenticación si planeas usar esto públicamente
3. **Rate Limiting**: Considera implementar límites de velocidad
4. **Monitoreo**: Supervisa el uso y los logs del servidor

### 🔧 Configuración de Red

#### Router/Firewall
Asegúrate de que estos puertos estén configurados:
- **Puerto 3001**: Servidor proxy (APIs)
- **Puerto 5173**: Aplicación web

#### Variables de Entorno
El archivo `.env` debe contener:
```env
VITE_OPENAI_API_KEY=tu_clave_openai
VITE_ANTHROPIC_API_KEY=tu_clave_anthropic
PORT=3001
```

### 🐛 Solución de Problemas

#### Problema: No se puede acceder desde IP externa
**Solución**: Verifica que:
1. El firewall permita los puertos 3001 y 5173
2. El router tenga port forwarding configurado
3. Los servidores estén ejecutándose con `0.0.0.0` como host

#### Problema: Error de CORS
**Solución**: Verifica que la IP esté incluida en la configuración CORS del `server.js`

#### Problema: Proxy no funciona
**Solución**: Asegúrate de que el servidor proxy esté ejecutándose en el puerto 3001

### 📝 Logs Esperados

Al ejecutar `npm run start:public`, deberías ver:
```
[0] Servidor proxy ejecutándose en:
[0]   - Local: http://localhost:3001
[0]   - Red: http://181.58.39.18:3001
[0]   - Todas las interfaces: http://0.0.0.0:3001
[1] VITE v5.4.8 ready in 1206 ms
[1] ➜ Local: http://localhost:5173/
[1] ➜ Network: http://181.58.39.18:5173/
```

### 🔄 Volver a Configuración Local

Para volver a la configuración local, ejecuta:
```bash
npm run start
```

Esto usará la configuración original con `localhost`.
