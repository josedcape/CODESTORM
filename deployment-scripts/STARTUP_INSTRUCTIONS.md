# CODESTORM - Instrucciones de Inicio

## Configuración Corregida

### Problema Identificado
Había un conflicto de configuración donde tanto `vite.config.ts` como `server.js` intentaban usar el puerto 3001, causando problemas de inicio.

### Solución Implementada

**Arquitectura de Puertos:**
- **Puerto 3001**: Servidor proxy (server.js) - Maneja las APIs de OpenAI y Anthropic
- **Puerto 5173**: Servidor de desarrollo Vite - Sirve la aplicación React

**Configuración Actualizada:**
1. `server.js` ejecuta en puerto 3001 como servidor proxy
2. `vite.config.ts` configurado para ejecutar en puerto 5173 y hacer proxy a localhost:3001
3. `package.json` actualizado para especificar el puerto correcto

## Instrucciones de Inicio

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
Asegúrate de que el archivo `.env` contenga:
```
VITE_OPENAI_API_KEY=tu_clave_openai
VITE_ANTHROPIC_API_KEY=tu_clave_anthropic
```

### 3. Iniciar la Aplicación
```bash
npm run start
```

Este comando ejecutará:
- Servidor proxy en puerto 3001
- Servidor de desarrollo Vite en puerto 5173

### 4. Acceder a la Aplicación
- **URL Principal**: http://localhost:5173
- **Servidor Proxy**: http://localhost:3001

## Verificación de Funcionamiento

### Logs Esperados
```
[0] Servidor proxy ejecutándose en http://localhost:3001
[1] VITE v5.4.8 ready in 1206 ms
[1] ➜ Local: http://localhost:5173/
```

### Solución de Problemas

**Si el puerto 3001 está ocupado:**
```bash
# Encontrar el proceso que usa el puerto
netstat -ano | findstr :3001
# Terminar el proceso
taskkill /PID [número_del_proceso] /F
```

**Si el puerto 5173 está ocupado:**
```bash
# Encontrar el proceso que usa el puerto
netstat -ano | findstr :5173
# Terminar el proceso
taskkill /PID [número_del_proceso] /F
```

## Correcciones Aplicadas

### 1. Error de filePath.split
- ✅ Corregido en `AIIterativeOrchestrator.ts`
- ✅ Validación de tipos añadida
- ✅ Manejo de errores mejorado

### 2. Coordinación de Agentes
- ✅ Sincronización entre página principal y Constructor
- ✅ Eventos personalizados para comunicación
- ✅ Listeners actualizados en Constructor

### 3. Configuración de Proxy
- ✅ Separación clara de responsabilidades
- ✅ Eliminación de conflictos de puerto
- ✅ Configuración optimizada

## Estado Actual
- ✅ Aplicación lista para ejecutar
- ✅ Errores críticos corregidos
- ✅ Configuración optimizada
- ✅ Documentación actualizada
