# Asistente CODESTORM - Guía de Uso

## Descripción General

El **Asistente CODESTORM** es un componente especializado que proporciona ayuda contextual y guías detalladas para todas las funcionalidades de CODESTORM. Ha sido completamente transformado para actuar como un experto en el sistema.

## Características Principales

### 🎯 **Ayuda Contextual**
- Detecta automáticamente la página actual (Constructor, WebAI, CodeCorrector, Principal)
- Proporciona información específica según el contexto
- Adapta el contenido a la funcionalidad activa

### 🧠 **Conocimiento Especializado**
- **Sistema de Agentes**: Explica los 9 agentes especializados y su coordinación
- **Reconocimiento de Voz**: Guías para el sistema de voz en español
- **Carga de Documentos**: Instrucciones para procesamiento inteligente
- **Optimización Móvil**: Consejos para uso táctil y accesibilidad
- **Troubleshooting**: Soluciones para problemas comunes

### 🎨 **Diseño Futurista**
- Interfaz consistente con el tema azul oscuro de CODESTORM
- Animaciones y efectos visuales integrados
- Responsive y optimizado para móviles
- Iconografía coherente con Lucide React

## Secciones de Ayuda

### **Secciones Comunes** (Disponibles en todas las páginas)

1. **Visión General de CODESTORM**
   - Introducción al sistema
   - Características principales
   - Arquitectura modular

2. **Sistema de Agentes Especializados**
   - Agente de Planificación
   - Agente de Generación de Código
   - Agente de Sincronización
   - Agente de Modificación
   - Agente de Observación
   - Agente de Distribución
   - Agente de Seguimiento
   - Agente Lector
   - Agente Diseñador

3. **Reconocimiento de Voz**
   - Configuración para español
   - Pasos de uso
   - Consejos de optimización

4. **Carga de Documentos**
   - Formatos soportados
   - Proceso de carga
   - Procesamiento inteligente

5. **Optimización Móvil y Accesibilidad**
   - Funciones táctiles
   - Gestos intuitivos
   - Accesibilidad con una mano

6. **Solución de Problemas Comunes**
   - Troubleshooting paso a paso
   - Errores frecuentes
   - Contacto de soporte

### **Secciones Específicas por Página**

#### **Página Constructor**
- **Flujo de Trabajo Constructor**
  - Sistema de "Perfeccionamiento Iterativo Guiado por IA"
  - Validación obligatoria entre etapas
  - Proceso de desarrollo iterativo

#### **Página CodeCorrector**
- **Proceso de Corrección**
  - Análisis automático de errores
  - Aplicación selectiva de correcciones
  - Validación de código reparado

#### **Página WebAI**
- **Creación de Páginas Web**
  - HTML/CSS puro sin frameworks
  - Diseños responsivos
  - Vista previa en tiempo real

## Tipos de Contenido

### **📝 Texto Explicativo**
Información descriptiva y conceptual sobre las funcionalidades.

### **📋 Listas**
Enumeración de características, funciones o elementos importantes.

### **🔢 Pasos Numerados**
Guías paso a paso para procesos específicos.

### **⚠️ Advertencias**
Información crítica que el usuario debe conocer.

### **💡 Consejos**
Recomendaciones y mejores prácticas para optimizar el uso.

## Integración con CODESTORM

### **Detección Automática de Contexto**
```typescript
// El componente detecta automáticamente la página actual
const location = useLocation();
useEffect(() => {
  const path = location.pathname;
  if (path.includes('/constructor')) {
    setCurrentPage('constructor');
  } else if (path.includes('/codecorrector')) {
    setCurrentPage('codecorrector');
  } else if (path.includes('/webai')) {
    setCurrentPage('webai');
  } else {
    setCurrentPage('main');
  }
}, [location]);
```

### **Secciones Expandibles**
- Sistema de acordeón para organizar información
- Estado persistente de secciones expandidas
- Navegación intuitiva con iconos

### **Responsive Design**
- Adaptación automática a diferentes tamaños de pantalla
- Optimización para dispositivos móviles
- Gestos táctiles integrados

## Uso del Componente

### **Props Interface**
```typescript
interface HelpAssistantProps {
  isOpen: boolean;      // Controla la visibilidad del modal
  onClose: () => void;  // Función para cerrar el asistente
}
```

### **Ejemplo de Implementación**
```typescript
import CodestormHelpAssistant from './components/HelpAssistant';

const [showHelp, setShowHelp] = useState(false);

<CodestormHelpAssistant
  isOpen={showHelp}
  onClose={() => setShowHelp(false)}
/>
```

## Beneficios del Nuevo Asistente

### **🚀 Para Usuarios Nuevos**
- Introducción completa al sistema
- Guías paso a paso para cada funcionalidad
- Explicación clara de conceptos avanzados

### **⚡ Para Usuarios Experimentados**
- Referencia rápida de funcionalidades
- Troubleshooting especializado
- Consejos de optimización

### **📱 Para Usuarios Móviles**
- Guías específicas para interacción táctil
- Optimización de gestos
- Accesibilidad mejorada

### **🔧 Para Desarrolladores**
- Documentación técnica integrada
- Explicación de la arquitectura de agentes
- Mejores prácticas de desarrollo

## Conclusión

El **Asistente CODESTORM** transformado proporciona una experiencia de ayuda completa y contextual que guía a los usuarios a través de todas las capacidades del sistema, desde funcionalidades básicas hasta características avanzadas, manteniendo siempre la coherencia visual y la usabilidad optimizada para todos los dispositivos.
