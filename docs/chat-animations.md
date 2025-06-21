# Animaciones de Chat en CODESTORM

## Descripción General

CODESTORM incluye un sistema completo de animaciones de borde pulsante con efecto de brillo azul para todos los contenedores de mensajes del chat. Estas animaciones mejoran la experiencia visual manteniendo el diseño futurista azul oscuro característico de la aplicación.

## Clases de Animación Disponibles

### Animaciones Principales

#### `.chat-message-pulse`
- **Uso**: Mensajes generales del asistente
- **Color**: Azul brillante (#3b82f6)
- **Duración**: 3 segundos
- **Efecto**: Pulso suave con brillo azul

#### `.chat-message-pulse-user`
- **Uso**: Mensajes del usuario
- **Color**: Púrpura (#8b5cf6)
- **Duración**: 3.5 segundos
- **Efecto**: Pulso más sutil para diferenciación

#### `.chat-message-pulse-system`
- **Uso**: Mensajes del sistema y notificaciones
- **Color**: Verde (#22c55e)
- **Duración**: 4 segundos
- **Efecto**: Pulso tranquilo para información del sistema

#### `.chat-message-pulse-code`
- **Uso**: Bloques de código y snippets
- **Color**: Amarillo dorado (#fbbf24)
- **Duración**: 2.5 segundos
- **Efecto**: Pulso más rápido para destacar código

### Animaciones Especiales

#### `.chat-message-pulse-error`
- **Uso**: Mensajes de error
- **Color**: Rojo (#ef4444)
- **Duración**: 2 segundos
- **Efecto**: Pulso más intenso para alertas

#### `.chat-message-pulse-success`
- **Uso**: Mensajes de éxito
- **Color**: Verde (#22c55e)
- **Duración**: 3 segundos
- **Efecto**: Pulso celebratorio

#### `.chat-message-pulse-warning`
- **Uso**: Mensajes de advertencia
- **Color**: Naranja (#f59e0b)
- **Duración**: 2.8 segundos
- **Efecto**: Pulso de atención

#### `.chat-message-pulse-important`
- **Uso**: Mensajes importantes que requieren acción
- **Color**: Azul intenso (#3b82f6)
- **Duración**: 2 segundos
- **Efecto**: Pulso más intenso

### Animaciones de Entrada

#### `.chat-message-appear`
- **Uso**: Nuevos mensajes al aparecer
- **Duración**: 0.6 segundos
- **Efecto**: Aparición suave desde abajo con escala

#### `.chat-message-bounce-in`
- **Uso**: Mensajes especiales con entrada dramática
- **Duración**: 0.8 segundos
- **Efecto**: Entrada con rebote elástico

### Variantes Sutiles

#### `.chat-message-pulse-subtle`
- **Uso**: Cuando se necesita menos distracción
- **Color**: Azul suave (#3b82f6 con menor opacidad)
- **Duración**: 4 segundos
- **Efecto**: Pulso muy sutil

## Implementación

### Ejemplo Básico
```tsx
<div className="chat-message-pulse">
  Mensaje del asistente
</div>
```

### Ejemplo con Múltiples Clases
```tsx
<div className="rounded-lg p-3 bg-codestorm-blue/20 text-white chat-message-pulse transition-smooth">
  <div className="flex items-center mb-1">
    <Bot className="w-4 h-4 mr-2" />
    <span className="text-xs opacity-70">12:34 PM</span>
  </div>
  <div className="text-sm">Contenido del mensaje</div>
</div>
```

### Lógica Condicional
```tsx
const getMessageStyle = (message) => {
  let baseStyle = 'rounded-lg p-3 transition-smooth';
  
  if (message.sender === 'user') {
    baseStyle += ' bg-codestorm-accent text-white chat-message-pulse-user';
  } else if (message.type === 'error') {
    baseStyle += ' bg-red-900/20 text-white chat-message-pulse-error';
  } else if (message.type === 'success') {
    baseStyle += ' bg-green-900/20 text-white chat-message-pulse-success';
  } else if (message.type === 'code') {
    baseStyle += ' bg-codestorm-darker text-white chat-message-pulse-code font-mono';
  } else {
    baseStyle += ' bg-codestorm-blue/20 text-white chat-message-pulse';
  }
  
  return baseStyle;
};
```

## Efectos Interactivos

### Hover Effects
Todas las animaciones se intensifican al hacer hover:
- La duración se reduce para crear un efecto más dinámico
- El brillo se intensifica ligeramente

### Responsive Behavior
Las animaciones se mantienen en todos los tamaños de pantalla pero se optimizan para:
- Dispositivos móviles: Animaciones ligeramente más sutiles
- Tablets: Animaciones estándar
- Desktop: Animaciones completas con todos los efectos

## Consideraciones de Rendimiento

### Optimizaciones Implementadas
- Uso de `transform` y `opacity` para animaciones suaves
- `will-change` implícito en las animaciones CSS
- Duración optimizada para no sobrecargar la GPU
- Uso de `ease-in-out` para transiciones naturales

### Mejores Prácticas
- No aplicar múltiples animaciones de pulso simultáneamente
- Usar `transition-smooth` para transiciones de estado
- Combinar con `chat-message-appear` para nuevos mensajes

## Integración con Componentes

### Componentes que Usan las Animaciones
- `InteractiveChat.tsx` - Chat principal del constructor
- `ChatInterface.tsx` - Chat de la página principal
- `WebAIAssistant.tsx` - Chat del asistente web
- `TypingIndicator.tsx` - Indicador de escritura

### Personalización
Para crear nuevas variantes:
1. Definir keyframes en `animations.css`
2. Crear clase de utilidad
3. Aplicar en el componente correspondiente

## Compatibilidad

### Navegadores Soportados
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Fallbacks
En navegadores que no soportan las animaciones:
- Los bordes se mantienen estáticos
- Los colores se preservan
- La funcionalidad no se ve afectada
