# 🛡️ Sistema de Fallback Robusto para APIs de IA

## 📋 Descripción General

El Sistema de Fallback Robusto de CODESTORM Constructor garantiza la continuidad del servicio de IA mediante la gestión inteligente de múltiples proveedores de IA, detección automática de errores y rotación transparente entre servicios disponibles.

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **AIProviderManager** - Gestión de proveedores de IA
2. **AIFallbackService** - Lógica de fallback inteligente  
3. **AIConfigurationService** - Validación de configuraciones
4. **AIProviderStatus** - Monitoreo visual del estado
5. **AIFallbackNotifications** - Notificaciones de cambios

### Flujo de Funcionamiento

```
Solicitud de IA → AIFallbackService → AIProviderManager → Proveedor Disponible
                      ↓ (si falla)
                 Detectar Error → Marcar Proveedor → Siguiente Proveedor
                      ↓ (si todos fallan)
                 Modo Offline → Notificar Usuario → Continuar Trabajo
```

## 🔧 Configuración

### 1. Variables de Entorno

Copia `.env.example` a `.env` y configura tus API keys:

```bash
# OpenAI
VITE_OPENAI_API_KEY=sk-your-openai-key

# Google Gemini  
VITE_GEMINI_API_KEY=your-gemini-key

# Anthropic Claude
VITE_ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

### 2. Proveedores Soportados

| Proveedor | Modelos | Endpoint | Proxy Requerido |
|-----------|---------|----------|-----------------|
| **OpenAI** | gpt-4o, gpt-3.5-turbo | localhost:3001/api/openai | ✅ |
| **Gemini** | gemini-1.5-pro, gemini-1.0-pro | generativelanguage.googleapis.com | ❌ |
| **Anthropic** | claude-3-opus, claude-3-sonnet | localhost:3001/api/anthropic | ✅ |

### 3. Configuración Mínima

Para funcionamiento básico, configura **al menos un proveedor**:

```bash
# Opción 1: Solo OpenAI
VITE_OPENAI_API_KEY=sk-your-key

# Opción 2: Solo Gemini (más fácil, sin proxy)
VITE_GEMINI_API_KEY=your-key

# Opción 3: Solo Anthropic
VITE_ANTHROPIC_API_KEY=sk-ant-your-key
```

## 🚀 Características del Sistema

### ✅ Detección Inteligente de Errores

- **Errores de Cuota (429)**: Rotación automática + tiempo de espera
- **Errores de Conexión**: Retry con delay + fallback
- **Timeouts**: Simplificación de solicitud + retry
- **Errores de API**: Fallback inmediato a otro proveedor

### 🔄 Rotación Automática

```typescript
// Orden de prioridad automático:
1. Proveedor con mejor health status
2. Proveedor con menor tiempo de respuesta  
3. Proveedor con mayor tasa de éxito
4. Proveedor configurado más recientemente
```

### 📊 Monitoreo en Tiempo Real

- **Estado de cada proveedor** (healthy/degraded/unavailable)
- **Estadísticas de uso** (requests, success rate, response time)
- **Tiempo de recuperación** para errores de cuota
- **Health checks automáticos** cada 2 minutos

### 🔔 Notificaciones Inteligentes

- **Éxito sin fallback**: Notificación discreta (3s)
- **Éxito con fallback**: Advertencia informativa (5s)  
- **Fallo completo**: Error detallado (8s)
- **Cambio de proveedor**: Notificación de transición

## 🎯 Uso del Sistema

### Integración Automática

El sistema funciona **automáticamente** sin intervención del usuario:

```typescript
// Uso normal - el fallback es transparente
const response = await processInstruction("Crea una calculadora", "GPT-4O");
// Si GPT-4O falla → automáticamente prueba Gemini → luego Claude
```

### Monitoreo Manual

Accede al estado de las APIs desde la interfaz:

1. **Botón de estado** (esquina inferior derecha)
2. **Panel expandible** con detalles de cada proveedor
3. **Estadísticas en tiempo real**
4. **Recomendaciones de configuración**

## 🛠️ Configuración Avanzada

### Personalización de Timeouts

```bash
# Timeout por solicitud (30 segundos)
VITE_AI_REQUEST_TIMEOUT=30000

# Delay entre fallbacks (2 segundos)  
VITE_AI_FALLBACK_DELAY=2000

# Máximo de reintentos (3 intentos)
VITE_AI_MAX_RETRIES=3
```

### Health Checks Personalizados

```bash
# Intervalo de health checks (2 minutos)
VITE_AI_HEALTH_CHECK_INTERVAL=120000

# Habilitar logging detallado
VITE_ENABLE_FALLBACK_LOGGING=true
```

## 🔍 Debugging y Troubleshooting

### Logs del Sistema

Revisa la consola del navegador para logs detallados:

```
[AI Service] Iniciando solicitud con fallback robusto para modelo: GPT-4O
🤖 Intentando con OpenAI (gpt-4o)...
❌ Falló OpenAI (gpt-4o): Request failed with status code 429
🤖 Intentando con Google Gemini (gemini-1.5-pro)...
✅ Éxito con Google Gemini (gemini-1.5-pro) en 1247ms
```

### Problemas Comunes

| Problema | Causa | Solución |
|----------|-------|----------|
| "No hay proveedores disponibles" | API keys no configuradas | Configura al menos una API key |
| "Todos los proveedores fallaron" | Límites de cuota excedidos | Espera 15-30 min o configura más proveedores |
| "Error de conexión" | Proxy no ejecutándose | Inicia el servidor proxy en puerto 3001 |
| "API key inválida" | Key incorrecta o expirada | Verifica y actualiza la API key |

### Modo de Testing

Habilita simulación de errores para testing:

```bash
VITE_ENABLE_ERROR_SIMULATION=true
VITE_DEV_MODE=true
```

## 📈 Métricas y Estadísticas

### Estadísticas Disponibles

- **Total de solicitudes** por proveedor
- **Tasa de éxito** (%)
- **Tiempo de respuesta promedio** (ms)
- **Número de fallbacks** ejecutados
- **Tiempo de inactividad** por errores de cuota

### Acceso a Métricas

```typescript
// Obtener estadísticas programáticamente
const fallbackService = AIFallbackService.getInstance();
const stats = fallbackService.getFallbackStats();

console.log('Estadísticas de fallback:', stats);
```

## 🔒 Seguridad y Mejores Prácticas

### Seguridad de API Keys

- ✅ **Nunca** hardcodees API keys en el código
- ✅ Usa variables de entorno (`.env`)
- ✅ Añade `.env` a `.gitignore`
- ✅ Rota las keys regularmente
- ✅ Configura límites de gasto en cada plataforma

### Optimización de Costos

- ✅ Configura **múltiples proveedores** para evitar sobre-uso de uno solo
- ✅ Monitorea el **uso y costos** regularmente
- ✅ Usa **modelos más económicos** para tareas simples
- ✅ Implementa **límites de uso** en tu aplicación

### Disponibilidad

- ✅ Configura **al menos 2 proveedores** para redundancia
- ✅ Monitorea el **estado de salud** regularmente
- ✅ Implementa **alertas** para fallos críticos
- ✅ Mantén **documentación actualizada** de configuración

## 🚀 Próximas Mejoras

### Funcionalidades Planificadas

- [ ] **Balanceador de carga** inteligente
- [ ] **Cache de respuestas** para reducir llamadas
- [ ] **Métricas avanzadas** con dashboard
- [ ] **Alertas por email/webhook** para administradores
- [ ] **Configuración dinámica** sin reinicio
- [ ] **Soporte para más proveedores** (Cohere, Hugging Face, etc.)

### Contribuciones

¿Tienes ideas para mejorar el sistema? ¡Contribuye!

1. Fork el repositorio
2. Crea una rama para tu feature
3. Implementa mejoras en `/src/services/`
4. Añade tests y documentación
5. Crea un Pull Request

---

## 📞 Soporte

Si tienes problemas con el sistema de fallback:

1. **Revisa los logs** en la consola del navegador
2. **Verifica la configuración** de API keys
3. **Consulta la documentación** de cada proveedor
4. **Abre un issue** en GitHub con detalles del problema

**¡El sistema está diseñado para ser resiliente y mantener CODESTORM Constructor siempre funcionando!** 🎉
