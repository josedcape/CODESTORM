import { TechnologyStack } from '../types/technologyStacks';
import { FileItem } from '../types';
import { generateUniqueId } from '../utils/idGenerator';

/**
 * Servicio de Integración de Stack Tecnológico
 * 
 * Este servicio se encarga de integrar la información del stack seleccionado
 * con el sistema de generación de código, adaptando planes, archivos y configuraciones
 * según las características específicas del stack elegido.
 */
export class StackIntegrationService {
  private static instance: StackIntegrationService;

  private constructor() {}

  public static getInstance(): StackIntegrationService {
    if (!StackIntegrationService.instance) {
      StackIntegrationService.instance = new StackIntegrationService();
    }
    return StackIntegrationService.instance;
  }

  /**
   * Combina la instrucción del usuario con el contexto del stack seleccionado
   * @param originalInstruction Instrucción original del usuario
   * @param selectedStack Stack tecnológico seleccionado
   * @returns Instrucción enriquecida con contexto del stack
   */
  public enrichInstructionWithStack(
    originalInstruction: string,
    selectedStack: TechnologyStack
  ): string {
    const stackContext = this.buildStackContext(selectedStack);
    
    return `${originalInstruction}

CONTEXTO DEL STACK TECNOLÓGICO SELECCIONADO:
${stackContext}

INSTRUCCIONES ESPECÍFICAS:
- Utilizar exclusivamente las tecnologías del stack seleccionado: ${selectedStack.technologies.map(t => t.name).join(', ')}
- Seguir las mejores prácticas y convenciones de ${selectedStack.name}
- Generar la estructura de archivos apropiada para ${selectedStack.name}
- Incluir archivos de configuración específicos del stack
- Implementar según el nivel de dificultad: ${selectedStack.difficultyLevel}
- Optimizar para los casos de uso: ${selectedStack.useCases.slice(0, 3).join(', ')}`;
  }

  /**
   * Construye el contexto detallado del stack para el prompt
   * @param stack Stack tecnológico
   * @returns Contexto formateado
   */
  private buildStackContext(stack: TechnologyStack): string {
    return `
STACK: ${stack.name}
DESCRIPCIÓN: ${stack.description}
DIFICULTAD: ${stack.difficultyLevel}
MODERNIDAD: ${stack.modernityStatus}
POPULARIDAD: ${stack.popularity}

TECNOLOGÍAS PRINCIPALES:
${stack.technologies.map(tech => 
  `- ${tech.name} (${tech.role})${tech.version ? ` - Versión: ${tech.version}` : ''}`
).join('\n')}

CASOS DE USO RECOMENDADOS:
${stack.useCases.map(useCase => `- ${useCase}`).join('\n')}

VENTAJAS CLAVE:
${stack.advantages.map(advantage => `- ${advantage}`).join('\n')}

REQUISITOS PREVIOS:
${stack.prerequisites.map(req => `- ${req}`).join('\n')}

REQUISITOS DEL SISTEMA:
${stack.systemRequirements.map(req => `- ${req}`).join('\n')}`;
  }

  /**
   * Genera archivos iniciales específicos del stack
   * @param stack Stack tecnológico seleccionado
   * @param projectName Nombre del proyecto
   * @returns Array de archivos iniciales
   */
  public generateStackSpecificFiles(
    stack: TechnologyStack,
    projectName: string
  ): FileItem[] {
    const files: FileItem[] = [];

    // Generar archivos base del stack
    stack.initialFiles.forEach(initialFile => {
      files.push({
        id: generateUniqueId('file'),
        name: this.getFileNameFromPath(initialFile.path),
        path: initialFile.path,
        content: this.adaptFileContent(initialFile.content, projectName, stack),
        language: this.getLanguageFromPath(initialFile.path),
        type: 'file',
        isNew: true,
        timestamp: Date.now()
      });
    });

    // Generar archivos de configuración específicos del stack
    const configFiles = this.generateConfigurationFiles(stack, projectName);
    files.push(...configFiles);

    // Generar README específico del stack
    const readmeFile = this.generateStackReadme(stack, projectName);
    files.push(readmeFile);

    return files;
  }

  /**
   * Genera archivos de configuración específicos del stack
   * @param stack Stack tecnológico
   * @param projectName Nombre del proyecto
   * @returns Array de archivos de configuración
   */
  private generateConfigurationFiles(
    stack: TechnologyStack,
    projectName: string
  ): FileItem[] {
    const files: FileItem[] = [];

    switch (stack.id) {
      case 'mern-stack':
      case 'mean-stack':
        files.push(this.generatePackageJson(stack, projectName));
        files.push(this.generateNodeGitignore());
        break;

      case 'django':
        files.push(this.generateRequirementsTxt(stack));
        files.push(this.generateDjangoSettings(projectName));
        files.push(this.generatePythonGitignore());
        break;

      case 'rails':
        files.push(this.generateGemfile(stack));
        files.push(this.generateRailsGitignore());
        break;

      case 'flutter':
        files.push(this.generatePubspecYaml(stack, projectName));
        files.push(this.generateFlutterGitignore());
        break;

      case 'react-native':
        files.push(this.generateReactNativePackageJson(stack, projectName));
        files.push(this.generateReactNativeGitignore());
        break;

      case 'sveltekit':
        files.push(this.generateSvelteKitPackageJson(stack, projectName));
        files.push(this.generateSvelteKitConfig());
        break;

      case 'qwik':
        files.push(this.generateQwikPackageJson(stack, projectName));
        files.push(this.generateQwikConfig());
        break;

      case 'jamstack':
        files.push(this.generateJAMStackPackageJson(stack, projectName));
        files.push(this.generateNetlifyToml());
        break;
    }

    return files;
  }

  /**
   * Genera package.json para stacks de Node.js
   */
  private generatePackageJson(stack: TechnologyStack, projectName: string): FileItem {
    const dependencies: Record<string, string> = {};
    const devDependencies: Record<string, string> = {};

    // Agregar dependencias según el stack
    stack.technologies.forEach(tech => {
      switch (tech.name.toLowerCase()) {
        case 'react':
          dependencies['react'] = '^18.2.0';
          dependencies['react-dom'] = '^18.2.0';
          devDependencies['@types/react'] = '^18.2.0';
          devDependencies['@types/react-dom'] = '^18.2.0';
          break;
        case 'angular':
          dependencies['@angular/core'] = '^17.0.0';
          dependencies['@angular/common'] = '^17.0.0';
          dependencies['@angular/platform-browser'] = '^17.0.0';
          break;
        case 'express.js':
        case 'express':
          dependencies['express'] = '^4.18.0';
          devDependencies['@types/express'] = '^4.17.0';
          break;
        case 'mongodb':
          dependencies['mongodb'] = '^6.0.0';
          dependencies['mongoose'] = '^8.0.0';
          break;
        case 'node.js':
        case 'nodejs':
          // Node.js es el runtime, no una dependencia
          break;
      }
    });

    const packageContent = {
      name: projectName.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: `Proyecto ${stack.name} generado por CODESTORM`,
      main: stack.id.includes('react') ? 'src/index.js' : 'server.js',
      scripts: this.generateNpmScripts(stack),
      dependencies,
      devDependencies,
      keywords: [stack.name.toLowerCase(), 'codestorm', 'generated'],
      author: 'CODESTORM Generator',
      license: 'MIT'
    };

    return {
      id: generateUniqueId('file'),
      name: 'package.json',
      path: 'package.json',
      content: JSON.stringify(packageContent, null, 2),
      language: 'json',
      type: 'file',
      isNew: true,
      timestamp: Date.now()
    };
  }

  /**
   * Genera scripts de npm según el stack
   */
  private generateNpmScripts(stack: TechnologyStack): Record<string, string> {
    const scripts: Record<string, string> = {};

    switch (stack.id) {
      case 'mern-stack':
        scripts['start'] = 'node server.js';
        scripts['dev'] = 'concurrently "npm run server" "npm run client"';
        scripts['server'] = 'nodemon server.js';
        scripts['client'] = 'cd client && npm start';
        scripts['build'] = 'cd client && npm run build';
        break;

      case 'mean-stack':
        scripts['start'] = 'node server.js';
        scripts['dev'] = 'concurrently "npm run server" "npm run client"';
        scripts['server'] = 'nodemon server.js';
        scripts['client'] = 'cd client && ng serve';
        scripts['build'] = 'cd client && ng build';
        break;

      case 'react-native':
        scripts['start'] = 'react-native start';
        scripts['android'] = 'react-native run-android';
        scripts['ios'] = 'react-native run-ios';
        scripts['test'] = 'jest';
        break;

      case 'sveltekit':
        scripts['dev'] = 'vite dev';
        scripts['build'] = 'vite build';
        scripts['preview'] = 'vite preview';
        scripts['check'] = 'svelte-kit sync && svelte-check --tsconfig ./tsconfig.json';
        break;

      case 'qwik':
        scripts['build'] = 'qwik build';
        scripts['build.client'] = 'vite build';
        scripts['build.preview'] = 'vite build --ssr src/entry.preview.tsx';
        scripts['build.server'] = 'vite build -c adapters/express/vite.config.ts';
        scripts['dev'] = 'vite --mode ssr';
        scripts['dev.debug'] = 'node --inspect-brk ./node_modules/vite/bin/vite.js --mode ssr --force';
        scripts['fmt'] = 'prettier --write .';
        scripts['fmt.check'] = 'prettier --check .';
        scripts['lint'] = 'eslint "src/**/*.ts*"';
        scripts['preview'] = 'qwik build preview && vite preview --open';
        scripts['start'] = 'vite --open --mode ssr';
        scripts['qwik'] = 'qwik';
        break;

      default:
        scripts['start'] = 'node index.js';
        scripts['dev'] = 'nodemon index.js';
        scripts['test'] = 'echo "Error: no test specified" && exit 1';
    }

    return scripts;
  }

  /**
   * Utilidades para manejo de archivos
   */
  private getFileNameFromPath(path: string): string {
    return path.split('/').pop() || path;
  }

  private getLanguageFromPath(path: string): string {
    const extension = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'rb': 'ruby',
      'dart': 'dart',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml'
    };
    return languageMap[extension || ''] || 'text';
  }

  private adaptFileContent(
    content: string,
    projectName: string,
    stack: TechnologyStack
  ): string {
    return content
      .replace(/\$\{projectName\}/g, projectName)
      .replace(/\$\{stackName\}/g, stack.name)
      .replace(/\$\{stackDescription\}/g, stack.description);
  }

  // Métodos para generar archivos específicos (continuará en la siguiente parte)
  private generateRequirementsTxt(stack: TechnologyStack): FileItem {
    const requirements = [
      'Django>=5.0.0',
      'djangorestframework>=3.14.0',
      'django-cors-headers>=4.3.0',
      'psycopg2-binary>=2.9.0',
      'redis>=5.0.0',
      'celery>=5.3.0',
      'python-decouple>=3.8'
    ];

    return {
      id: generateUniqueId('file'),
      name: 'requirements.txt',
      path: 'requirements.txt',
      content: requirements.join('\n'),
      language: 'text',
      type: 'file',
      isNew: true,
      timestamp: Date.now()
    };
  }

  private generateStackReadme(stack: TechnologyStack, projectName: string): FileItem {
    const content = `# ${projectName}

Proyecto generado con **CODESTORM** usando el stack **${stack.name}**.

## Descripción

${stack.description}

## Tecnologías Utilizadas

${stack.technologies.map(tech => 
  `- **${tech.name}** (${tech.role})${tech.version ? ` - v${tech.version}` : ''}`
).join('\n')}

## Requisitos Previos

${stack.prerequisites.map(req => `- ${req}`).join('\n')}

## Requisitos del Sistema

${stack.systemRequirements.map(req => `- ${req}`).join('\n')}

## Instalación

${stack.setupInstructions.map((instruction, index) => 
  `${index + 1}. ${instruction}`
).join('\n')}

## Características del Stack

- **Dificultad**: ${stack.difficultyLevel}
- **Modernidad**: ${stack.modernityStatus}
- **Popularidad**: ${stack.popularity}
- **Curva de aprendizaje**: ${stack.learningCurve}

## Casos de Uso Ideales

${stack.useCases.map(useCase => `- ${useCase}`).join('\n')}

## Ventajas

${stack.advantages.map(advantage => `- ${advantage}`).join('\n')}

## Recursos Adicionales

- [Documentación Oficial](${stack.documentation})
- [Sitio Web](${stack.officialWebsite})

---

*Generado por CODESTORM - Constructor de Aplicaciones con IA*
`;

    return {
      id: generateUniqueId('file'),
      name: 'README.md',
      path: 'README.md',
      content,
      language: 'markdown',
      type: 'file',
      isNew: true,
      timestamp: Date.now()
    };
  }

  // Métodos adicionales para otros tipos de archivos de configuración
  private generateNodeGitignore(): FileItem {
    const content = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity`;

    return {
      id: generateUniqueId('file'),
      name: '.gitignore',
      path: '.gitignore',
      content,
      language: 'text',
      type: 'file',
      isNew: true,
      timestamp: Date.now()
    };
  }

  // Placeholder methods for other stack-specific files
  private generateDjangoSettings(projectName: string): FileItem {
    // Implementation for Django settings
    return {
      id: generateUniqueId('file'),
      name: 'settings.py',
      path: `${projectName}/settings.py`,
      content: '# Django settings - Generated by CODESTORM',
      language: 'python',
      type: 'file',
      isNew: true,
      timestamp: Date.now()
    };
  }

  private generatePythonGitignore(): FileItem {
    // Implementation for Python .gitignore
    return this.generateNodeGitignore(); // Placeholder
  }

  private generateGemfile(stack: TechnologyStack): FileItem {
    // Implementation for Ruby Gemfile
    return {
      id: generateUniqueId('file'),
      name: 'Gemfile',
      path: 'Gemfile',
      content: '# Ruby Gemfile - Generated by CODESTORM',
      language: 'ruby',
      type: 'file',
      isNew: true,
      timestamp: Date.now()
    };
  }

  private generateRailsGitignore(): FileItem {
    // Implementation for Rails .gitignore
    return this.generateNodeGitignore(); // Placeholder
  }

  private generatePubspecYaml(stack: TechnologyStack, projectName: string): FileItem {
    // Implementation for Flutter pubspec.yaml
    return {
      id: generateUniqueId('file'),
      name: 'pubspec.yaml',
      path: 'pubspec.yaml',
      content: '# Flutter pubspec.yaml - Generated by CODESTORM',
      language: 'yaml',
      type: 'file',
      isNew: true,
      timestamp: Date.now()
    };
  }

  private generateFlutterGitignore(): FileItem {
    // Implementation for Flutter .gitignore
    return this.generateNodeGitignore(); // Placeholder
  }

  private generateReactNativePackageJson(stack: TechnologyStack, projectName: string): FileItem {
    // Implementation for React Native package.json
    return this.generatePackageJson(stack, projectName);
  }

  private generateReactNativeGitignore(): FileItem {
    // Implementation for React Native .gitignore
    return this.generateNodeGitignore(); // Placeholder
  }

  private generateSvelteKitPackageJson(stack: TechnologyStack, projectName: string): FileItem {
    // Implementation for SvelteKit package.json
    return this.generatePackageJson(stack, projectName);
  }

  private generateSvelteKitConfig(): FileItem {
    // Implementation for SvelteKit config
    return {
      id: generateUniqueId('file'),
      name: 'svelte.config.js',
      path: 'svelte.config.js',
      content: '// SvelteKit config - Generated by CODESTORM',
      language: 'javascript',
      type: 'file',
      isNew: true,
      timestamp: Date.now()
    };
  }

  private generateQwikPackageJson(stack: TechnologyStack, projectName: string): FileItem {
    // Implementation for Qwik package.json
    return this.generatePackageJson(stack, projectName);
  }

  private generateQwikConfig(): FileItem {
    // Implementation for Qwik config
    return {
      id: generateUniqueId('file'),
      name: 'qwik.config.ts',
      path: 'qwik.config.ts',
      content: '// Qwik config - Generated by CODESTORM',
      language: 'typescript',
      type: 'file',
      isNew: true,
      timestamp: Date.now()
    };
  }

  private generateJAMStackPackageJson(stack: TechnologyStack, projectName: string): FileItem {
    // Implementation for JAMstack package.json
    return this.generatePackageJson(stack, projectName);
  }

  private generateNetlifyToml(): FileItem {
    // Implementation for Netlify config
    return {
      id: generateUniqueId('file'),
      name: 'netlify.toml',
      path: 'netlify.toml',
      content: '# Netlify config - Generated by CODESTORM',
      language: 'toml',
      type: 'file',
      isNew: true,
      timestamp: Date.now()
    };
  }
}
