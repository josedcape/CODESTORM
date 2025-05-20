# CODESTORM

<div align="center">
  <img src="public/botidinamix-logo.svg" alt="BOTIDINAMIX Logo" width="150" height="150"/>
  <h3>Plataforma de Desarrollo Autónomo Impulsada por IA</h3>
  <p><i>Desarrollado por BOTIDINAMIX AI</i></p>
</div>

## 🌩️ ¿Qué es CODESTORM?

CODESTORM es una plataforma avanzada de desarrollo autónomo que revoluciona la forma en que se crean aplicaciones y soluciones de software. Utilizando un sistema de agentes especializados impulsados por IA, CODESTORM automatiza y optimiza todo el proceso de desarrollo, desde la planificación inicial hasta la generación y organización del código.

La plataforma está diseñada para:
- **Acelerar el desarrollo** de proyectos complejos mediante la automatización inteligente
- **Mejorar la calidad del código** a través de análisis y optimizaciones continuas
- **Facilitar la colaboración** entre humanos e IA en el proceso de desarrollo
- **Proporcionar una experiencia interactiva** con retroalimentación en tiempo real

## ✨ Características Principales

### 🤖 Sistema de Agentes Especializados

CODESTORM implementa una arquitectura modular con agentes especializados que trabajan en conjunto:

| Agente | Función |
|--------|---------|
| **Agente de Planificación** | Analiza los requisitos y crea planes detallados de desarrollo |
| **Agente de Generación de Código** | Produce código de alta calidad basado en los planes establecidos |
| **Agente de Sincronización de Archivos** | Mantiene sincronizados los archivos entre el terminal y el explorador |
| **Agente de Modificación de Código** | Realiza cambios inteligentes en el código existente |
| **Agente de Observación de Archivos** | Monitorea en tiempo real los archivos creados y su estructura |
| **Agente de Distribución de Archivos** | Separa el código generado en archivos independientes |

### 🔍 Función "Enhance Prompt"

Una característica innovadora que mejora automáticamente las instrucciones del usuario antes de enviarlas al sistema:
- Clarifica requisitos ambiguos
- Añade detalles técnicos relevantes
- Optimiza la estructura de la solicitud
- Mejora la precisión de los resultados generados

### 🏗️ Constructor con Sistema de Aprobación por Etapas

Un flujo de trabajo conversacional que otorga al usuario control total sobre el proceso de creación:
- Sistema de aprobación por etapas para validar cada fase del desarrollo
- Chat interactivo avanzado para comunicación fluida con los agentes
- Corrector de código inteligente que sugiere mejoras y soluciones
- Visualización en tiempo real del progreso del proyecto

### ✂️ Separador de Código

Herramienta especializada que:
- Analiza bloques de código extensos
- Identifica componentes lógicos y funcionales
- Separa el código en archivos independientes con la estructura adecuada
- Mantiene la coherencia entre los archivos generados

### 👁️ Observador de Archivos

Sistema de monitoreo que:
- Analiza en tiempo real la estructura y contenido de los archivos
- Proporciona visualizaciones del árbol de archivos
- Mejora las sugerencias durante el desarrollo
- Comunica información relevante a otros agentes del sistema

### 🎨 Interfaz Moderna y Responsiva

- Diseño adaptable para dispositivos móviles y de escritorio
- Animaciones sutiles inspiradas en el concepto de "tormenta de código"
- Paneles colapsables para optimizar el espacio de trabajo
- Botones flotantes para acceso rápido a funciones principales
- Temas visuales personalizables

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React, TypeScript, Tailwind CSS
- **Modelos de IA**: Claude (Anthropic), GPT (OpenAI), Gemini (Google)
- **Herramientas de Desarrollo**: Vite, ESLint, TypeScript
- **Backend**: Express (servidor proxy para APIs)
- **Utilidades**: JSZip, File-Saver, React Router, XTerm

## 🚀 Instalación y Configuración

### Requisitos Previos

- Node.js (v16 o superior)
- npm (v8 o superior) o yarn (v1.22 o superior)
- Acceso a las APIs de los modelos de IA (OpenAI, Anthropic, Google)

### Paso a Paso

1. **Clonar el Repositorio**

   ```bash
   git clone https://github.com/tu-usuario/codestorm.git
   cd codestorm
   ```

2. **Instalar Dependencias**

   ```bash
   npm install
   # o
   yarn install
   ```

3. **Configurar Variables de Entorno**

   Crea un archivo `.env` en la raíz del proyecto:

   ```env
   VITE_OPENAI_API_KEY=tu_clave_de_openai
   VITE_ANTHROPIC_API_KEY=tu_clave_de_anthropic
   VITE_GEMINI_API_KEY=tu_clave_de_gemini
   PORT=3001
   ```

4. **Iniciar la Aplicación**

   ```bash
   npm run start
   # o
   yarn start
   ```

   Esto iniciará tanto el servidor proxy como la aplicación frontend.

5. **Acceder a la Aplicación**

   Abre tu navegador y visita:

   ```
   http://localhost:3001
   ```

## 📂 Estructura del Proyecto

```plaintext
codestorm/
├── public/                  # Archivos estáticos
│   ├── botidinamix-logo.svg # Logo de BOTIDINAMIX
│   └── ...                  # Otros recursos estáticos
├── src/                     # Código fuente
│   ├── agents/              # Implementación de agentes IA
│   ├── components/          # Componentes React
│   │   ├── constructor/     # Componentes del Constructor
│   │   └── ...              # Otros componentes
│   ├── contexts/            # Contextos de React
│   ├── data/                # Datos estáticos
│   ├── pages/               # Páginas principales
│   ├── services/            # Servicios (AI, terminal)
│   ├── App.tsx              # Componente principal
│   └── main.tsx             # Punto de entrada
├── server.js                # Servidor proxy para APIs
├── package.json             # Dependencias y scripts
├── tailwind.config.js       # Configuración de Tailwind
└── vite.config.js           # Configuración de Vite
```

## 📸 Capturas de Pantalla

<div align="center">
  <img src="https://i.imgur.com/example1.png" alt="Interfaz Principal" width="80%"/>
  <p><i>Interfaz Principal de CODESTORM</i></p>

  <img src="https://i.imgur.com/example2.png" alt="Constructor" width="80%"/>
  <p><i>Página del Constructor con Sistema de Aprobación por Etapas</i></p>

  <img src="https://i.imgur.com/example3.png" alt="Separador de Código" width="80%"/>
  <p><i>Separador de Código en Acción</i></p>
</div>

## 🤝 Contribuir

Las contribuciones son bienvenidas y apreciadas. Para contribuir:

1. Haz un fork del repositorio
2. Crea una rama para tu característica (`git checkout -b feature/amazing-feature`)
3. Realiza tus cambios y haz commit (`git commit -m 'Add some amazing feature'`)
4. Sube tus cambios (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - consulta el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- Desarrollado por el equipo de BOTIDINAMIX AI
- Inspirado en las necesidades reales de desarrolladores
- Impulsado por modelos de IA de vanguardia

---

<div align="center">
  <p>BOTIDINAMIX AI - Todos los derechos reservados © 2025</p>
</div>
