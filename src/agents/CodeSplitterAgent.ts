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
    
    // Patrones para identificar archivos en el código
    const filePatterns = [
      // Patrón para comentarios de estilo: // src/components/File.tsx
      /\/\/\s*(src\/[^\s]+\.[a-zA-Z]+)[\r\n]+([\s\S]+?)(?=\/\/\s*src\/|$)/g,
      
      // Patrón para comentarios de estilo: /* src/components/File.tsx */
      /\/\*\s*(src\/[^\s]+\.[a-zA-Z]+)\s*\*\/[\r\n]+([\s\S]+?)(?=\/\*\s*src\/|$)/g,
      
      // Patrón para comentarios de estilo: # src/components/File.tsx
      /#\s*(src\/[^\s]+\.[a-zA-Z]+)[\r\n]+([\s\S]+?)(?=#\s*src\/|$)/g
    ];
    
    // Buscar coincidencias con cada patrón
    for (const pattern of filePatterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const path = match[1].trim();
        const content = match[2].trim();
        
        if (path && content) {
          // Extraer el nombre del archivo y la extensión
          const pathParts = path.split('/');
          const name = pathParts[pathParts.length - 1];
          const extension = name.split('.').pop() || '';
          
          // Determinar el lenguaje basado en la extensión
          const language = this.getLanguageFromExtension(extension);
          
          // Crear un ID único para el archivo
          const id = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          files.push({
            id,
            name,
            path,
            content,
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
    
    return files;
  }
  
  /**
   * Extrae archivos basados en bloques de código
   * @param code El código a analizar
   * @returns Array de objetos FileItem
   */
  private static extractFilesByCodeBlocks(code: string): FileItem[] {
    const files: FileItem[] = [];
    
    // Buscar bloques de código que parezcan archivos completos
    const codeBlocks = code.split(/```(?:[a-zA-Z]+)?\n/);
    
    for (let i = 1; i < codeBlocks.length; i += 2) {
      if (i < codeBlocks.length) {
        const content = codeBlocks[i].replace(/```$/, '').trim();
        
        // Intentar determinar el tipo de archivo por el contenido
        const fileInfo = this.inferFileInfo(content, i);
        
        if (fileInfo) {
          files.push({
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: fileInfo.name,
            path: fileInfo.path,
            content,
            language: fileInfo.language
          });
        }
      }
    }
    
    return files;
  }
  
  /**
   * Infiere información del archivo basado en su contenido
   * @param content El contenido del archivo
   * @param index Índice del bloque de código
   * @returns Información del archivo o null si no se puede determinar
   */
  private static inferFileInfo(content: string, index: number): { name: string; path: string; language: string } | null {
    // Buscar pistas en el contenido para determinar el tipo de archivo
    
    // Verificar si es un componente React
    if (content.includes('import React') || content.includes('React.FC')) {
      const componentMatch = content.match(/(?:class|const|function)\s+([A-Z][a-zA-Z0-9]+)/);
      if (componentMatch) {
        const componentName = componentMatch[1];
        return {
          name: `${componentName}.tsx`,
          path: `src/components/${componentName}.tsx`,
          language: 'typescript'
        };
      }
    }
    
    // Verificar si es un archivo CSS
    if (content.includes('{') && content.includes('}') && 
        (content.includes('margin') || content.includes('padding') || content.includes('color'))) {
      return {
        name: `style${index}.css`,
        path: `src/styles/style${index}.css`,
        language: 'css'
      };
    }
    
    // Verificar si es un archivo de prueba
    if (content.includes('test(') || content.includes('describe(') || content.includes('it(')) {
      return {
        name: `test${index}.test.tsx`,
        path: `src/tests/test${index}.test.tsx`,
        language: 'typescript'
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
}
