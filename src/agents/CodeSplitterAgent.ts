import {
  AgentTask,
  AgentResult,
  FileItem,
  CodeSplitResult
} from '../types';

/**
 * Agente de Separación de Código
 *
 * Este agente es responsable de analizar el código generado,
 * identificar las secciones y crear los archivos correspondientes.
 */
export class CodeSplitterAgent {
  /**
   * Ejecuta el agente para separar el código en archivos
   * @param task La tarea asignada al agente
   * @param code El código a separar
   * @returns Resultado del agente con los archivos generados
   */
  public static execute(
    task: AgentTask,
    code: string
  ): AgentResult {
    try {
      // Analizar el código y extraer los archivos
      const files = this.extractFiles(code);

      if (files.length === 0) {
        return {
          success: false,
          error: 'No se pudieron identificar archivos en el código proporcionado'
        };
      }

      return {
        success: true,
        data: {
          files,
          message: `Se han extraído ${files.length} archivos del código`
        } as CodeSplitResult
      };
    } catch (error) {
      console.error('Error en el agente de separación de código:', error);
      return {
        success: false,
        error: `Error al separar el código: ${error}`
      };
    }
  }

  /**
   * Extrae los archivos del código proporcionado
   * @param code El código a analizar
   * @returns Array de objetos FileItem
   */
  private static extractFiles(code: string): FileItem[] {
    const files: FileItem[] = [];

    // Patrones mejorados para identificar archivos en el código
    const filePatterns = [
      // Patrón para comentarios de estilo: // src/components/File.tsx
      /\/\/\s*((?:src\/|\.\/)?[^\s]+\.[a-zA-Z]+)[\r\n]+([\s\S]+?)(?=\/\/\s*(?:src\/|\.\/)|$)/g,

      // Patrón para comentarios de estilo: /* src/components/File.tsx */
      /\/\*\s*((?:src\/|\.\/)?[^\s]+\.[a-zA-Z]+)\s*\*\/[\r\n]+([\s\S]+?)(?=\/\*\s*(?:src\/|\.\/)|$)/g,

      // Patrón para comentarios de estilo: # src/components/File.tsx
      /#\s*((?:src\/|\.\/)?[^\s]+\.[a-zA-Z]+)[\r\n]+([\s\S]+?)(?=#\s*(?:src\/|\.\/)|$)/g,

      // Patrón para archivos con nombre explícito: **archivo.tsx**
      /\*\*\s*((?:src\/|\.\/)?[^\s]+\.[a-zA-Z]+)\s*\*\*[\r\n]+([\s\S]+?)(?=\*\*\s*(?:src\/|\.\/)|$)/g,

      // Patrón para archivos con formato markdown: ### archivo.tsx
      /###\s*((?:src\/|\.\/)?[^\s]+\.[a-zA-Z]+)[\r\n]+([\s\S]+?)(?=###\s*(?:src\/|\.\/)|$)/g,

      // Patrón para archivos con formato: File: archivo.tsx
      /File:\s*((?:src\/|\.\/)?[^\s]+\.[a-zA-Z]+)[\r\n]+([\s\S]+?)(?=File:\s*(?:src\/|\.\/)|$)/g,

      // Patrón para archivos con formato: Archivo: archivo.tsx
      /Archivo:\s*((?:src\/|\.\/)?[^\s]+\.[a-zA-Z]+)[\r\n]+([\s\S]+?)(?=Archivo:\s*(?:src\/|\.\/)|$)/g
    ];

    // Buscar coincidencias con cada patrón
    for (const pattern of filePatterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const rawPath = match[1].trim();
        const content = match[2].trim();

        if (rawPath && content) {
          // Normalizar la ruta del archivo
          const normalizedPath = this.normalizePath(rawPath);

          // Extraer el nombre del archivo y la extensión
          const pathParts = normalizedPath.split('/');
          const name = pathParts[pathParts.length - 1];
          const extension = name.split('.').pop() || '';

          // Determinar el lenguaje basado en la extensión
          const language = this.getLanguageFromExtension(extension);

          // Limpiar el contenido del archivo
          const cleanContent = this.cleanFileContent(content, language);

          // Crear un ID único para el archivo
          const id = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          files.push({
            id,
            name,
            path: normalizedPath,
            content: cleanContent,
            language
          });
        }
      }
    }

    // Si no se encontraron archivos con los patrones anteriores,
    // intentar identificar archivos por bloques de código
    if (files.length === 0) {
      files.push(...this.extractFilesByCodeBlocks(code));
    }

    // Eliminar archivos duplicados
    return this.removeDuplicateFiles(files);
  }

  /**
   * Extrae archivos basados en bloques de código
   * @param code El código a analizar
   * @returns Array de objetos FileItem
   */
  private static extractFilesByCodeBlocks(code: string): FileItem[] {
    const files: FileItem[] = [];

    // Patrones mejorados para bloques de código
    const codeBlockPatterns = [
      // Bloques de código con lenguaje especificado: ```typescript
      /```([a-zA-Z]+)\n([\s\S]*?)```/g,

      // Bloques de código sin lenguaje especificado: ```
      /```\n([\s\S]*?)```/g,

      // Bloques de código con indentación (4 espacios)
      /(?:^|\n)((?:    .+\n?)+)/g
    ];

    let blockIndex = 0;

    for (const pattern of codeBlockPatterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        blockIndex++;

        let language = '';
        let content = '';

        if (match.length === 3) {
          // Patrón con lenguaje especificado
          language = match[1];
          content = match[2].trim();
        } else {
          // Patrón sin lenguaje especificado
          content = match[1].trim();
        }

        if (content && content.length > 50) { // Solo procesar bloques significativos
          // Intentar determinar el tipo de archivo por el contenido
          const fileInfo = this.inferFileInfo(content, blockIndex, language);

          if (fileInfo) {
            // Limpiar el contenido del archivo
            const cleanContent = this.cleanFileContent(content, fileInfo.language);

            files.push({
              id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: fileInfo.name,
              path: fileInfo.path,
              content: cleanContent,
              language: fileInfo.language
            });
          }
        }
      }
    }

    return files;
  }

  /**
   * Infiere información del archivo basado en su contenido
   * @param content El contenido del archivo
   * @param index Índice del bloque de código
   * @param suggestedLanguage Lenguaje sugerido del bloque de código
   * @returns Información del archivo o null si no se puede determinar
   */
  private static inferFileInfo(content: string, index: number, suggestedLanguage?: string): { name: string; path: string; language: string } | null {
    // Buscar pistas en el contenido para determinar el tipo de archivo

    // Verificar si es un componente React/TypeScript
    if (content.includes('import React') || content.includes('React.FC') || content.includes('JSX.Element')) {
      const componentMatch = content.match(/(?:export\s+(?:default\s+)?(?:class|const|function)\s+([A-Z][a-zA-Z0-9]+))|(?:(?:class|const|function)\s+([A-Z][a-zA-Z0-9]+))/);
      if (componentMatch) {
        const componentName = componentMatch[1] || componentMatch[2];
        return {
          name: `${componentName}.tsx`,
          path: `src/components/${componentName}.tsx`,
          language: 'typescript'
        };
      }
    }

    // Verificar si es un hook de React
    if (content.includes('useState') || content.includes('useEffect') || content.match(/export\s+(?:const|function)\s+use[A-Z]/)) {
      const hookMatch = content.match(/export\s+(?:const|function)\s+(use[A-Z][a-zA-Z0-9]+)/);
      if (hookMatch) {
        const hookName = hookMatch[1];
        return {
          name: `${hookName}.ts`,
          path: `src/hooks/${hookName}.ts`,
          language: 'typescript'
        };
      }
    }

    // Verificar si es un servicio o utilidad
    if (content.includes('export class') || content.includes('export const') || content.includes('export function')) {
      const serviceMatch = content.match(/export\s+(?:class|const|function)\s+([A-Z][a-zA-Z0-9]+)/);
      if (serviceMatch) {
        const serviceName = serviceMatch[1];
        const isService = serviceName.includes('Service') || serviceName.includes('API') || serviceName.includes('Client');
        const isUtil = serviceName.includes('Utils') || serviceName.includes('Helper') || serviceName.includes('Util');

        if (isService) {
          return {
            name: `${serviceName}.ts`,
            path: `src/services/${serviceName}.ts`,
            language: 'typescript'
          };
        } else if (isUtil) {
          return {
            name: `${serviceName}.ts`,
            path: `src/utils/${serviceName}.ts`,
            language: 'typescript'
          };
        }
      }
    }

    // Verificar si es un archivo CSS/SCSS
    if (content.includes('{') && content.includes('}') &&
        (content.includes('margin') || content.includes('padding') || content.includes('color') || content.includes('display'))) {
      const isSCSS = content.includes('$') || content.includes('@mixin') || content.includes('@include');
      const extension = isSCSS ? 'scss' : 'css';
      return {
        name: `styles${index}.${extension}`,
        path: `src/styles/styles${index}.${extension}`,
        language: extension
      };
    }

    // Verificar si es un archivo de configuración
    if (content.includes('"name"') && content.includes('"version"') && content.includes('"dependencies"')) {
      return {
        name: 'package.json',
        path: 'package.json',
        language: 'json'
      };
    }

    // Verificar si es un archivo de prueba
    if (content.includes('test(') || content.includes('describe(') || content.includes('it(') || content.includes('expect(')) {
      return {
        name: `test${index}.test.tsx`,
        path: `src/tests/test${index}.test.tsx`,
        language: 'typescript'
      };
    }

    // Verificar si es HTML
    if (content.includes('<!DOCTYPE') || content.includes('<html') || content.includes('<body')) {
      return {
        name: `index${index}.html`,
        path: `public/index${index}.html`,
        language: 'html'
      };
    }

    // Verificar si es un archivo de tipos TypeScript
    if (content.includes('interface ') || content.includes('type ') || content.includes('enum ')) {
      return {
        name: `types${index}.ts`,
        path: `src/types/types${index}.ts`,
        language: 'typescript'
      };
    }

    // Usar el lenguaje sugerido si está disponible
    if (suggestedLanguage) {
      const extension = this.getExtensionFromLanguage(suggestedLanguage);
      return {
        name: `file${index}.${extension}`,
        path: `src/generated/file${index}.${extension}`,
        language: suggestedLanguage
      };
    }

    // Si no se puede determinar, crear un archivo genérico
    return {
      name: `file${index}.txt`,
      path: `src/generated/file${index}.txt`,
      language: 'text'
    };
  }

  /**
   * Determina el lenguaje basado en la extensión del archivo
   * @param extension La extensión del archivo
   * @returns El lenguaje correspondiente
   */
  private static getLanguageFromExtension(extension: string): string {
    const extensionMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'css': 'css',
      'scss': 'scss',
      'html': 'html',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rb': 'ruby',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin'
    };

    return extensionMap[extension.toLowerCase()] || 'text';
  }

  /**
   * Obtiene la extensión de archivo basada en el lenguaje
   * @param language El lenguaje de programación
   * @returns La extensión correspondiente
   */
  private static getExtensionFromLanguage(language: string): string {
    const languageMap: Record<string, string> = {
      'javascript': 'js',
      'typescript': 'ts',
      'jsx': 'jsx',
      'tsx': 'tsx',
      'css': 'css',
      'scss': 'scss',
      'html': 'html',
      'json': 'json',
      'markdown': 'md',
      'python': 'py',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'csharp': 'cs',
      'go': 'go',
      'ruby': 'rb',
      'php': 'php',
      'swift': 'swift',
      'kotlin': 'kt'
    };

    return languageMap[language.toLowerCase()] || 'txt';
  }

  /**
   * Normaliza la ruta del archivo
   * @param path La ruta del archivo
   * @returns La ruta normalizada
   */
  private static normalizePath(path: string): string {
    // Remover prefijos innecesarios
    let normalizedPath = path.replace(/^\.\//, '');

    // Asegurar que comience con src/ si no tiene un prefijo específico
    if (!normalizedPath.startsWith('src/') && !normalizedPath.startsWith('public/') && !normalizedPath.startsWith('package.json')) {
      normalizedPath = `src/${normalizedPath}`;
    }

    return normalizedPath;
  }

  /**
   * Limpia el contenido del archivo removiendo caracteres innecesarios
   * @param content El contenido del archivo
   * @param language El lenguaje del archivo
   * @returns El contenido limpio
   */
  private static cleanFileContent(content: string, language: string): string {
    let cleanContent = content;

    // Remover marcadores de bloques de código
    cleanContent = cleanContent.replace(/^```[a-zA-Z]*\n?/, '');
    cleanContent = cleanContent.replace(/\n?```$/, '');

    // Remover espacios en blanco excesivos al inicio y final
    cleanContent = cleanContent.trim();

    // Para archivos de código, asegurar que terminen con nueva línea
    if (['javascript', 'typescript', 'css', 'html', 'json'].includes(language)) {
      if (!cleanContent.endsWith('\n')) {
        cleanContent += '\n';
      }
    }

    return cleanContent;
  }

  /**
   * Elimina archivos duplicados basándose en el nombre y contenido
   * @param files Array de archivos
   * @returns Array de archivos sin duplicados
   */
  private static removeDuplicateFiles(files: FileItem[]): FileItem[] {
    const uniqueFiles: FileItem[] = [];
    const seenFiles = new Set<string>();

    for (const file of files) {
      // Crear una clave única basada en el nombre y un hash del contenido
      const contentHash = this.simpleHash(file.content);
      const fileKey = `${file.name}-${contentHash}`;

      if (!seenFiles.has(fileKey)) {
        seenFiles.add(fileKey);
        uniqueFiles.push(file);
      }
    }

    return uniqueFiles;
  }

  /**
   * Genera un hash simple para el contenido
   * @param content El contenido a hashear
   * @returns Un hash simple del contenido
   */
  private static simpleHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
