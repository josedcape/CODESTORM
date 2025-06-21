import { 
  AgentTask, 
  AgentResult, 
  FileItem, 
  FileContext, 
  FileObservation,
  FileObserverState
} from '../types';

/**
 * Agente de Observación de Archivos
 * 
 * Este agente es responsable de analizar los archivos del proyecto en tiempo real,
 * extraer información contextual y generar observaciones y sugerencias.
 */
export class FileObserverAgent {
  /**
   * Ejecuta el agente de observación para analizar los archivos
   * @param task La tarea asignada al agente
   * @param files Lista actual de archivos
   * @param currentState Estado actual del observador (opcional)
   * @returns Resultado del agente con el análisis de los archivos
   */
  public static execute(
    task: AgentTask, 
    files: FileItem[],
    currentState?: FileObserverState
  ): AgentResult {
    try {
      // Inicializar o usar el estado existente
      const state: FileObserverState = currentState || {
        observedFiles: [],
        fileContexts: [],
        observations: [],
        isActive: true,
        lastScan: Date.now()
      };
      
      // Identificar archivos nuevos o modificados
      const filesToProcess = files.filter(file => {
        // Archivo nuevo (no está en la lista de observados)
        const isNew = !state.observedFiles.includes(file.id);
        
        // Archivo modificado (ya existe un contexto pero puede haber cambiado)
        const existingContext = state.fileContexts.find(ctx => ctx.fileId === file.id);
        const isModified = existingContext && this.hasFileChanged(file, existingContext);
        
        return isNew || isModified;
      });
      
      // Procesar cada archivo
      for (const file of filesToProcess) {
        // Añadir a la lista de archivos observados si es nuevo
        if (!state.observedFiles.includes(file.id)) {
          state.observedFiles.push(file.id);
        }
        
        // Analizar el archivo y crear/actualizar su contexto
        const fileContext = this.analyzeFile(file);
        
        // Actualizar o añadir el contexto del archivo
        const existingContextIndex = state.fileContexts.findIndex(ctx => ctx.fileId === file.id);
        if (existingContextIndex >= 0) {
          state.fileContexts[existingContextIndex] = fileContext;
        } else {
          state.fileContexts.push(fileContext);
        }
        
        // Generar observaciones para el archivo
        const observations = this.generateObservations(file, fileContext, state.fileContexts);
        
        // Añadir las nuevas observaciones
        state.observations = [
          ...state.observations,
          ...observations
        ];
      }
      
      // Actualizar la marca de tiempo del último escaneo
      state.lastScan = Date.now();
      
      return {
        success: true,
        data: {
          fileObserverState: state
        }
      };
    } catch (error) {
      console.error('Error en el agente de observación de archivos:', error);
      return {
        success: false,
        error: `Error al analizar los archivos: ${error}`
      };
    }
  }
  
  /**
   * Verifica si un archivo ha cambiado desde su último análisis
   */
  private static hasFileChanged(file: FileItem, context: FileContext): boolean {
    // Comparar la última actualización con la marca de tiempo del contexto
    return context.lastUpdated < Date.now() - 5000; // Simplificado para este ejemplo
  }
  
  /**
   * Analiza un archivo para extraer su contexto
   */
  private static analyzeFile(file: FileItem): FileContext {
    // Extraer información según el tipo de archivo
    const imports: string[] = [];
    const exports: string[] = [];
    const functions: string[] = [];
    const classes: string[] = [];
    const dependencies: string[] = [];
    
    // Analizar según el lenguaje
    switch (file.language) {
      case 'javascript':
      case 'typescript':
        this.analyzeJavaScript(file.content, imports, exports, functions, classes, dependencies);
        break;
      case 'html':
        this.analyzeHTML(file.content, dependencies);
        break;
      case 'css':
        this.analyzeCSS(file.content, dependencies);
        break;
      // Añadir más lenguajes según sea necesario
    }
    
    // Generar una descripción del archivo
    const description = this.generateFileDescription(file, imports, exports, functions, classes);
    
    return {
      id: `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileId: file.id,
      path: file.path,
      language: file.language,
      imports,
      exports,
      functions,
      classes,
      dependencies,
      description,
      lastUpdated: Date.now()
    };
  }
  
  /**
   * Analiza código JavaScript/TypeScript
   */
  private static analyzeJavaScript(
    content: string,
    imports: string[],
    exports: string[],
    functions: string[],
    classes: string[],
    dependencies: string[]
  ): void {
    // Detectar importaciones
    const importRegex = /import\s+(?:{([^}]+)}|\*\s+as\s+([a-zA-Z0-9_$]+)|([a-zA-Z0-9_$]+))\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importedItems = match[1] || match[2] || match[3];
      const source = match[4];
      
      if (importedItems) {
        imports.push(`${importedItems} from ${source}`);
      }
      
      // Añadir a dependencias si es un paquete externo (no comienza con . o /)
      if (!source.startsWith('.') && !source.startsWith('/')) {
        dependencies.push(source);
      }
    }
    
    // Detectar exportaciones
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)?\s+([a-zA-Z0-9_$]+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    // Detectar funciones
    const functionRegex = /function\s+([a-zA-Z0-9_$]+)\s*\(/g;
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }
    
    // Detectar clases
    const classRegex = /class\s+([a-zA-Z0-9_$]+)(?:\s+extends\s+([a-zA-Z0-9_$]+))?/g;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const extendsClass = match[2] || null;
      classes.push(extendsClass ? `${className} extends ${extendsClass}` : className);
    }
  }
  
  /**
   * Analiza código HTML
   */
  private static analyzeHTML(content: string, dependencies: string[]): void {
    // Detectar scripts y estilos externos
    const scriptRegex = /<script[^>]*src=['"]([^'"]+)['"]/g;
    let match;
    while ((match = scriptRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }
    
    const linkRegex = /<link[^>]*href=['"]([^'"]+)['"]/g;
    while ((match = linkRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }
  }
  
  /**
   * Analiza código CSS
   */
  private static analyzeCSS(content: string, dependencies: string[]): void {
    // Detectar importaciones de CSS
    const importRegex = /@import\s+(?:url\(['"]?([^'")]+)['"]?\)|['"]([^'"]+)['"]);/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      dependencies.push(match[1] || match[2]);
    }
  }
  
  /**
   * Genera una descripción del archivo basada en su análisis
   */
  private static generateFileDescription(
    file: FileItem,
    imports: string[],
    exports: string[],
    functions: string[],
    classes: string[]
  ): string {
    const parts = [];
    
    // Añadir tipo de archivo
    parts.push(`Archivo ${file.language.toUpperCase()}`);
    
    // Añadir información sobre exportaciones
    if (exports.length > 0) {
      parts.push(`exporta ${exports.length} elementos`);
    }
    
    // Añadir información sobre funciones y clases
    if (functions.length > 0 || classes.length > 0) {
      const elements = [];
      if (functions.length > 0) {
        elements.push(`${functions.length} funciones`);
      }
      if (classes.length > 0) {
        elements.push(`${classes.length} clases`);
      }
      parts.push(`contiene ${elements.join(' y ')}`);
    }
    
    // Añadir información sobre importaciones
    if (imports.length > 0) {
      parts.push(`importa de ${imports.length} módulos`);
    }
    
    return parts.join(', ');
  }
  
  /**
   * Genera observaciones para un archivo basadas en su contexto
   */
  private static generateObservations(
    file: FileItem,
    context: FileContext,
    allContexts: FileContext[]
  ): FileObservation[] {
    const observations: FileObservation[] = [];
    
    // Observación básica sobre el archivo
    observations.push({
      id: `obs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileId: file.id,
      observation: `Archivo analizado: ${context.description}`,
      type: 'structure',
      timestamp: Date.now()
    });
    
    // Detectar dependencias circulares
    this.detectCircularDependencies(file, context, allContexts, observations);
    
    // Detectar patrones de código
    this.detectCodePatterns(file, context, observations);
    
    // Generar sugerencias
    this.generateSuggestions(file, context, allContexts, observations);
    
    return observations;
  }
  
  /**
   * Detecta dependencias circulares entre archivos
   */
  private static detectCircularDependencies(
    file: FileItem,
    context: FileContext,
    allContexts: FileContext[],
    observations: FileObservation[]
  ): void {
    // Implementación simplificada para este ejemplo
    // En una implementación real, se haría un análisis más profundo
  }
  
  /**
   * Detecta patrones de código en el archivo
   */
  private static detectCodePatterns(
    file: FileItem,
    context: FileContext,
    observations: FileObservation[]
  ): void {
    // Detectar patrones según el lenguaje
    switch (file.language) {
      case 'javascript':
      case 'typescript':
        // Detectar uso de React hooks
        if (file.content.includes('useState') || file.content.includes('useEffect')) {
          observations.push({
            id: `obs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            fileId: file.id,
            observation: 'Este archivo utiliza React Hooks para gestionar el estado y efectos secundarios.',
            type: 'pattern',
            timestamp: Date.now()
          });
        }
        
        // Detectar componentes de React
        if (file.content.includes('React.FC') || file.content.includes('extends React.Component')) {
          observations.push({
            id: `obs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            fileId: file.id,
            observation: 'Este archivo contiene componentes de React.',
            type: 'pattern',
            timestamp: Date.now()
          });
        }
        break;
    }
  }
  
  /**
   * Genera sugerencias basadas en el análisis del archivo
   */
  private static generateSuggestions(
    file: FileItem,
    context: FileContext,
    allContexts: FileContext[],
    observations: FileObservation[]
  ): void {
    // Sugerencias según el lenguaje
    switch (file.language) {
      case 'javascript':
      case 'typescript':
        // Sugerir división de archivos grandes
        if (file.content.split('\n').length > 300) {
          observations.push({
            id: `obs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            fileId: file.id,
            observation: 'Este archivo es bastante grande. Considera dividirlo en módulos más pequeños para mejorar la mantenibilidad.',
            type: 'suggestion',
            timestamp: Date.now()
          });
        }
        
        // Sugerir uso de TypeScript para archivos JS complejos
        if (file.language === 'javascript' && (context.classes.length > 2 || context.functions.length > 5)) {
          observations.push({
            id: `obs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            fileId: file.id,
            observation: 'Este archivo JavaScript contiene estructuras complejas. Considera migrar a TypeScript para mejorar la seguridad de tipos.',
            type: 'suggestion',
            timestamp: Date.now()
          });
        }
        break;
    }
  }
}
