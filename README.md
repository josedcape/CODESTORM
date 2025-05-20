# CODESTORM

CODESTORM es un Agente Desarrollador Autónomo que utiliza modelos de IA para generar código y soluciones de programación.

![CODESTORM Logo](https://via.placeholder.com/150x150.png?text=CODESTORM)

## Características

- **Múltiples modelos de IA**: Integración con varios modelos de IA como Claude, GPT y Gemini
- **Análisis de terminal**: Analiza y valida los resultados de comandos ejecutados
- **Editor de código integrado**: Visualiza y edita código generado
- **Explorador de archivos**: Gestiona los archivos del proyecto
- **Interfaz intuitiva**: Diseño moderno y fácil de usar

## Tecnologías utilizadas

- React
- TypeScript
- Tailwind CSS
- Vite
- Express (para el servidor proxy)

## Requisitos previos

- Node.js (v14 o superior)
- npm o yarn

## Instalación

1. Clona este repositorio:
```bash
git clone https://github.com/tu-usuario/codestorm.git
cd codestorm
```

2. Instala las dependencias:
```bash
npm install
# o
yarn install
```

3. Crea un archivo `.env` en la raíz del proyecto con tus claves API:
```
VITE_OPENAI_API_KEY=tu_clave_de_openai
VITE_ANTHROPIC_API_KEY=tu_clave_de_anthropic
VITE_GEMINI_API_KEY=tu_clave_de_gemini
PORT=3001
```

## Uso

Para iniciar la aplicación en modo desarrollo:

```bash
npm run start
# o
yarn start
```

Esto iniciará tanto el servidor proxy como la aplicación frontend.

## Estructura del proyecto

```
codestorm/
├── public/              # Archivos estáticos
├── src/                 # Código fuente
│   ├── components/      # Componentes React
│   ├── services/        # Servicios (AI, terminal)
│   ├── data/            # Datos estáticos
│   ├── types/           # Definiciones de tipos TypeScript
│   ├── App.tsx          # Componente principal
│   └── main.tsx         # Punto de entrada
├── server.js            # Servidor proxy para APIs
└── ...
```

## Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue para discutir los cambios importantes antes de crear un pull request.

## Licencia

[MIT](LICENSE)
