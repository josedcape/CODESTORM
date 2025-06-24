import React, { useState } from 'react';
import {
  Code,
  Server,
  Globe,
  Smartphone,
  Database,
  Terminal,
  Cpu,
  Layers,
  ChevronRight,
  ChevronDown,
  Check,
  Search,
  FileText,
  FolderTree
} from 'lucide-react';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'web' | 'mobile' | 'backend' | 'fullstack' | 'data' | 'other';
  language: string;
  frameworks: string[];
  structure: {
    directories: {
      path: string;
      description: string;
    }[];
    files: {
      path: string;
      description: string;
    }[];
  };
  dependencies: {
    name: string;
    version: string;
    description: string;
  }[];
  scripts: {
    name: string;
    command: string;
    description: string;
  }[];
  configuration: {
    name: string;
    description: string;
    content: string;
  }[];
}

interface ProjectTemplateSelectorProps {
  onSelectTemplate: (template: ProjectTemplate) => void;
}

const ProjectTemplateSelector: React.FC<ProjectTemplateSelectorProps> = ({
  onSelectTemplate
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  
  // Plantillas predefinidas
  const templates: ProjectTemplate[] = [
    // Plantilla para aplicación web React
    {
      id: 'react-web-app',
      name: 'Aplicación Web React',
      description: 'Aplicación web moderna con React, TypeScript y Tailwind CSS',
      icon: <Globe className="h-6 w-6 text-blue-400" />,
      category: 'web',
      language: 'TypeScript',
      frameworks: ['React', 'Tailwind CSS'],
      structure: {
        directories: [
          { path: '/src', description: 'Código fuente principal' },
          { path: '/src/components', description: 'Componentes React reutilizables' },
          { path: '/src/pages', description: 'Páginas de la aplicación' },
          { path: '/src/hooks', description: 'Hooks personalizados' },
          { path: '/src/contexts', description: 'Contextos de React' },
          { path: '/src/utils', description: 'Funciones de utilidad' },
          { path: '/src/types', description: 'Definiciones de tipos TypeScript' },
          { path: '/src/assets', description: 'Recursos estáticos' },
          { path: '/public', description: 'Archivos públicos' },
          { path: '/tests', description: 'Pruebas unitarias y de integración' }
        ],
        files: [
          { path: '/src/App.tsx', description: 'Componente principal de la aplicación' },
          { path: '/src/index.tsx', description: 'Punto de entrada de la aplicación' },
          { path: '/src/vite-env.d.ts', description: 'Definiciones de tipos para Vite' },
          { path: '/index.html', description: 'Archivo HTML principal' },
          { path: '/tsconfig.json', description: 'Configuración de TypeScript' },
          { path: '/package.json', description: 'Configuración de dependencias' },
          { path: '/tailwind.config.js', description: 'Configuración de Tailwind CSS' },
          { path: '/vite.config.ts', description: 'Configuración de Vite' }
        ]
      },
      dependencies: [
        { name: 'react', version: '^18.2.0', description: 'Biblioteca principal de React' },
        { name: 'react-dom', version: '^18.2.0', description: 'Renderizador de React para el DOM' },
        { name: 'react-router-dom', version: '^6.8.0', description: 'Enrutador para React' },
        { name: 'tailwindcss', version: '^3.2.4', description: 'Framework CSS utilitario' },
        { name: 'typescript', version: '^4.9.5', description: 'Superset tipado de JavaScript' },
        { name: 'vite', version: '^4.1.0', description: 'Bundler y servidor de desarrollo' }
      ],
      scripts: [
        { name: 'dev', command: 'vite', description: 'Inicia el servidor de desarrollo' },
        { name: 'build', command: 'tsc && vite build', description: 'Compila la aplicación para producción' },
        { name: 'preview', command: 'vite preview', description: 'Previsualiza la versión de producción' },
        { name: 'test', command: 'vitest', description: 'Ejecuta las pruebas' }
      ],
      configuration: [
        { 
          name: 'tsconfig.json', 
          description: 'Configuración de TypeScript', 
          content: '{\n  "compilerOptions": {\n    "target": "ESNext",\n    "useDefineForClassFields": true,\n    "lib": ["DOM", "DOM.Iterable", "ESNext"],\n    "allowJs": false,\n    "skipLibCheck": true,\n    "esModuleInterop": false,\n    "allowSyntheticDefaultImports": true,\n    "strict": true,\n    "forceConsistentCasingInFileNames": true,\n    "module": "ESNext",\n    "moduleResolution": "Node",\n    "resolveJsonModule": true,\n    "isolatedModules": true,\n    "noEmit": true,\n    "jsx": "react-jsx"\n  },\n  "include": ["src"],\n  "references": [{ "path": "./tsconfig.node.json" }]\n}'
        },
        { 
          name: 'tailwind.config.js', 
          description: 'Configuración de Tailwind CSS', 
          content: 'module.exports = {\n  content: [\n    "./index.html",\n    "./src/**/*.{js,ts,jsx,tsx}",\n  ],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n}'
        }
      ]
    },
    
    // Plantilla para API con Python y FastAPI
    {
      id: 'python-fastapi',
      name: 'API con Python y FastAPI',
      description: 'API RESTful con Python, FastAPI y SQLAlchemy',
      icon: <Server className="h-6 w-6 text-green-400" />,
      category: 'backend',
      language: 'Python',
      frameworks: ['FastAPI', 'SQLAlchemy', 'Pydantic'],
      structure: {
        directories: [
          { path: '/src', description: 'Código fuente principal' },
          { path: '/src/api', description: 'Endpoints de la API' },
          { path: '/src/models', description: 'Modelos de datos' },
          { path: '/src/schemas', description: 'Esquemas Pydantic' },
          { path: '/src/services', description: 'Lógica de negocio' },
          { path: '/src/db', description: 'Configuración de base de datos' },
          { path: '/src/utils', description: 'Funciones de utilidad' },
          { path: '/tests', description: 'Pruebas unitarias y de integración' },
          { path: '/docs', description: 'Documentación' }
        ],
        files: [
          { path: '/src/main.py', description: 'Punto de entrada de la aplicación' },
          { path: '/src/config.py', description: 'Configuración de la aplicación' },
          { path: '/src/db/database.py', description: 'Configuración de la base de datos' },
          { path: '/src/db/models.py', description: 'Modelos SQLAlchemy' },
          { path: '/src/api/deps.py', description: 'Dependencias de la API' },
          { path: '/requirements.txt', description: 'Dependencias del proyecto' },
          { path: '/.env', description: 'Variables de entorno' },
          { path: '/Dockerfile', description: 'Configuración de Docker' }
        ]
      },
      dependencies: [
        { name: 'fastapi', version: '^0.95.0', description: 'Framework web para APIs' },
        { name: 'uvicorn', version: '^0.21.1', description: 'Servidor ASGI' },
        { name: 'sqlalchemy', version: '^2.0.7', description: 'ORM para bases de datos' },
        { name: 'pydantic', version: '^1.10.7', description: 'Validación de datos' },
        { name: 'alembic', version: '^1.10.2', description: 'Migraciones de base de datos' },
        { name: 'pytest', version: '^7.3.1', description: 'Framework de pruebas' }
      ],
      scripts: [
        { name: 'start', command: 'uvicorn src.main:app --reload', description: 'Inicia el servidor de desarrollo' },
        { name: 'test', command: 'pytest', description: 'Ejecuta las pruebas' },
        { name: 'migrate', command: 'alembic upgrade head', description: 'Ejecuta las migraciones' },
        { name: 'docker-build', command: 'docker build -t myapi .', description: 'Construye la imagen Docker' }
      ],
      configuration: [
        { 
          name: 'requirements.txt', 
          description: 'Dependencias del proyecto', 
          content: 'fastapi>=0.95.0\nuvicorn>=0.21.1\nsqlalchemy>=2.0.7\npydantic>=1.10.7\nalembic>=1.10.2\npytest>=7.3.1\npython-dotenv>=1.0.0\npsycopg2-binary>=2.9.5'
        },
        { 
          name: '.env', 
          description: 'Variables de entorno', 
          content: 'DATABASE_URL=postgresql://postgres:postgres@localhost/mydb\nSECRET_KEY=mysecretkey\nDEBUG=True\nALLOW_ORIGINS=http://localhost:3000,http://localhost:8000'
        }
      ]
    },
    
    // Plantilla para aplicación móvil con React Native
    {
      id: 'react-native-app',
      name: 'Aplicación Móvil React Native',
      description: 'Aplicación móvil multiplataforma con React Native y TypeScript',
      icon: <Smartphone className="h-6 w-6 text-purple-400" />,
      category: 'mobile',
      language: 'TypeScript',
      frameworks: ['React Native', 'Expo'],
      structure: {
        directories: [
          { path: '/src', description: 'Código fuente principal' },
          { path: '/src/components', description: 'Componentes React Native' },
          { path: '/src/screens', description: 'Pantallas de la aplicación' },
          { path: '/src/navigation', description: 'Configuración de navegación' },
          { path: '/src/hooks', description: 'Hooks personalizados' },
          { path: '/src/contexts', description: 'Contextos de React' },
          { path: '/src/utils', description: 'Funciones de utilidad' },
          { path: '/src/types', description: 'Definiciones de tipos TypeScript' },
          { path: '/src/assets', description: 'Recursos estáticos' },
          { path: '/tests', description: 'Pruebas unitarias y de integración' }
        ],
        files: [
          { path: '/App.tsx', description: 'Componente principal de la aplicación' },
          { path: '/app.json', description: 'Configuración de Expo' },
          { path: '/tsconfig.json', description: 'Configuración de TypeScript' },
          { path: '/package.json', description: 'Configuración de dependencias' },
          { path: '/babel.config.js', description: 'Configuración de Babel' },
          { path: '/metro.config.js', description: 'Configuración de Metro' }
        ]
      },
      dependencies: [
        { name: 'react', version: '18.2.0', description: 'Biblioteca principal de React' },
        { name: 'react-native', version: '0.71.6', description: 'Framework para aplicaciones móviles' },
        { name: 'expo', version: '~48.0.10', description: 'Plataforma para React Native' },
        { name: '@react-navigation/native', version: '^6.1.6', description: 'Navegación para React Native' },
        { name: '@react-navigation/stack', version: '^6.3.16', description: 'Navegación de tipo stack' },
        { name: 'typescript', version: '^4.9.5', description: 'Superset tipado de JavaScript' }
      ],
      scripts: [
        { name: 'start', command: 'expo start', description: 'Inicia el servidor de desarrollo' },
        { name: 'android', command: 'expo start --android', description: 'Inicia en Android' },
        { name: 'ios', command: 'expo start --ios', description: 'Inicia en iOS' },
        { name: 'web', command: 'expo start --web', description: 'Inicia en web' },
        { name: 'test', command: 'jest', description: 'Ejecuta las pruebas' }
      ],
      configuration: [
        { 
          name: 'app.json', 
          description: 'Configuración de Expo', 
          content: '{\n  "expo": {\n    "name": "MyApp",\n    "slug": "my-app",\n    "version": "1.0.0",\n    "orientation": "portrait",\n    "icon": "./assets/icon.png",\n    "splash": {\n      "image": "./assets/splash.png",\n      "resizeMode": "contain",\n      "backgroundColor": "#ffffff"\n    },\n    "updates": {\n      "fallbackToCacheTimeout": 0\n    },\n    "assetBundlePatterns": [\n      "**/*"\n    ],\n    "ios": {\n      "supportsTablet": true\n    },\n    "android": {\n      "adaptiveIcon": {\n        "foregroundImage": "./assets/adaptive-icon.png",\n        "backgroundColor": "#FFFFFF"\n      }\n    },\n    "web": {\n      "favicon": "./assets/favicon.png"\n    }\n  }\n}'
        },
        { 
          name: 'tsconfig.json', 
          description: 'Configuración de TypeScript', 
          content: '{\n  "extends": "expo/tsconfig.base",\n  "compilerOptions": {\n    "strict": true,\n    "baseUrl": "./",\n    "paths": {\n      "*": ["src/*"]\n    }\n  }\n}'
        }
      ]
    }
  ];
  
  // Filtrar plantillas según la categoría y el término de búsqueda
  const filteredTemplates = templates.filter(template => {
    // Filtrar por categoría
    if (selectedCategory !== 'all' && template.category !== selectedCategory) {
      return false;
    }
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        template.name.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower) ||
        template.language.toLowerCase().includes(searchLower) ||
        template.frameworks.some(fw => fw.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });
  
  // Función para alternar la expansión de una plantilla
  const toggleTemplate = (templateId: string) => {
    setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
  };
  
  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md border border-codestorm-blue/30 p-4">
      <h2 className="text-xl font-semibold text-white mb-4">Selecciona una Plantilla de Proyecto</h2>
      
      {/* Búsqueda y filtros */}
      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar plantillas..."
            className="w-full bg-codestorm-darker border border-codestorm-blue/30 rounded-md py-2 px-3 text-white text-sm pl-9"
          />
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-codestorm-darker border border-codestorm-blue/30 rounded-md py-2 px-3 text-white text-sm"
        >
          <option value="all">Todas las categorías</option>
          <option value="web">Aplicaciones Web</option>
          <option value="mobile">Aplicaciones Móviles</option>
          <option value="backend">Backend / API</option>
          <option value="fullstack">Full Stack</option>
          <option value="data">Ciencia de Datos</option>
          <option value="other">Otros</option>
        </select>
      </div>
      
      {/* Lista de plantillas */}
      <div className="space-y-3">
        {filteredTemplates.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No se encontraron plantillas que coincidan con los criterios de búsqueda</p>
          </div>
        ) : (
          filteredTemplates.map(template => (
            <div 
              key={template.id} 
              className="bg-codestorm-darker rounded-md border border-codestorm-blue/30 overflow-hidden"
            >
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-codestorm-blue/10"
                onClick={() => toggleTemplate(template.id)}
              >
                <div className="flex items-center">
                  {template.icon}
                  <div className="ml-3">
                    <h3 className="text-white font-medium">{template.name}</h3>
                    <p className="text-gray-400 text-sm">{template.description}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex space-x-2 mr-4">
                    <span className="px-2 py-0.5 bg-codestorm-blue/20 text-blue-300 rounded-full text-xs">
                      {template.language}
                    </span>
                    {template.frameworks.slice(0, 2).map(framework => (
                      <span key={framework} className="px-2 py-0.5 bg-codestorm-blue/10 text-gray-300 rounded-full text-xs">
                        {framework}
                      </span>
                    ))}
                  </div>
                  {expandedTemplate === template.id ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
              
              {expandedTemplate === template.id && (
                <div className="p-4 border-t border-codestorm-blue/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-white font-medium mb-2 flex items-center">
                        <FolderTree className="h-4 w-4 mr-2 text-blue-400" />
                        Estructura del Proyecto
                      </h4>
                      <div className="bg-codestorm-darker rounded-md p-3 border border-codestorm-blue/20 max-h-60 overflow-y-auto">
                        <div className="mb-2">
                          <h5 className="text-sm font-medium text-white mb-1">Directorios</h5>
                          <ul className="space-y-1">
                            {template.structure.directories.map(dir => (
                              <li key={dir.path} className="text-xs text-gray-300 flex">
                                <span className="text-blue-400 mr-1">{dir.path}</span>
                                <span className="text-gray-500">- {dir.description}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-white mb-1">Archivos</h5>
                          <ul className="space-y-1">
                            {template.structure.files.map(file => (
                              <li key={file.path} className="text-xs text-gray-300 flex">
                                <span className="text-green-400 mr-1">{file.path}</span>
                                <span className="text-gray-500">- {file.description}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-medium mb-2 flex items-center">
                        <Code className="h-4 w-4 mr-2 text-purple-400" />
                        Dependencias y Scripts
                      </h4>
                      <div className="bg-codestorm-darker rounded-md p-3 border border-codestorm-blue/20 max-h-60 overflow-y-auto">
                        <div className="mb-2">
                          <h5 className="text-sm font-medium text-white mb-1">Dependencias</h5>
                          <ul className="space-y-1">
                            {template.dependencies.slice(0, 5).map(dep => (
                              <li key={dep.name} className="text-xs text-gray-300">
                                <span className="text-purple-400">{dep.name}</span>
                                <span className="text-gray-500"> ({dep.version})</span>
                                {dep.description && <span className="text-gray-500"> - {dep.description}</span>}
                              </li>
                            ))}
                            {template.dependencies.length > 5 && (
                              <li className="text-xs text-gray-500">
                                Y {template.dependencies.length - 5} más...
                              </li>
                            )}
                          </ul>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-white mb-1">Scripts</h5>
                          <ul className="space-y-1">
                            {template.scripts.map(script => (
                              <li key={script.name} className="text-xs text-gray-300">
                                <span className="text-yellow-400">{script.name}</span>
                                <span className="text-gray-500"> - {script.description}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => onSelectTemplate(template)}
                      className="px-4 py-2 bg-codestorm-accent hover:bg-blue-600 text-white rounded-md text-sm flex items-center transition-colors"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      <span>Seleccionar Plantilla</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectTemplateSelector;
