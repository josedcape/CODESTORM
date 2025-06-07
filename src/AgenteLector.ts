import {
  AgentTask,
  AgentResult,
  FileItem,
  FileAnalysis,
  FileSection,
  FileDependency,
  FileChangeAnalysis,
  FileChangeImpact,
  LectorState,
  LectorResult,
  FileAnalysisLevel
} from '../types';

/**
 * Agente Lector
 *
 * Este agente es responsable de analizar archivos antes de su modificación,
 * comprender su estructura, propósito y funcionalidad, y evaluar el impacto
 * de los cambios propuestos.
 */
export class AgenteLector {
  /**
   * Ejecuta el agente lector para analizar un archivo
   * @param task La tarea asignada al agente
   * @param file El archivo a analizar
   * @param proposedChanges Cambios propuestos (opcional)
   * @param currentState Estado actual del lector (opcional)
   * @returns Resultado del agente con el análisis del archivo
   */
  public static execute(
    task: AgentTask,
    file: FileItem,
    proposedChanges?: string,
    currentState?: LectorState
  ): AgentResult {
    try {
      // Inicializar o usar el estado existente
      const state: LectorState = currentState || {
        analyzedFiles: [],
        pendingChanges: [],
        isActive: true,
        lastAnalysis: Date.now()
      };

      // Verificar si el archivo ya ha sido analizado
      const existingAnalysis = state.analyzedFiles.find(analysis => analysis.fileId === file.id);

      // Si ya existe un análisis y no hay cambios propuestos, devolver el análisis existente
      if (existingAnalysis && !proposedChanges) {
        return {
          success: true,
          data: {
            fileAnalysis: existingAnalysis,
            lectorState: state
          }
        };
      }

      // Analizar el archivo
      const fileAnalysis = existingAnalysis || this.analyzeFile(file);

      // Si no hay un análisis existente, añadirlo al estado
      if (!existingAnalysis) {
        state.analyzedFiles.push(fileAnalysis);
      }

      // Si hay cambios propuestos, analizar el impacto
      if (proposedChanges) {
        const changeAnalysis = this.analyzeChanges(file, proposedChanges, fileAnalysis);

        // Añadir el análisis de cambios al estado
        state.pendingChanges = [
          ...state.pendingChanges.filter(change => change.originalFile.id !== file.id),
          changeAnalysis
        ];

        return {
          success: true,
          data: {
            fileAnalysis,
            changeAnalysis,
            lectorState: state
          }
        };
      }

      // Actualizar la marca de tiempo del último análisis
      state.lastAnalysis = Date.now();

      return {
        success: true,
        data: {
          fileAnalysis,
          lectorState: state
        }
      };
    } catch (error) {
      console.error('Error en el agente lector:', error);
      return {
        success: false,
        error: `Error al analizar el archivo: ${error}`
      };
    }
  }

  /**
   * Analiza un archivo para extraer su estructura, propósito y funcionalidad
   */
  private static analyzeFile(file: FileItem): FileAnalysis {
    // Dividir el contenido en líneas
    const lines = file.content.split('\n');

    // Extraer información según el tipo de archivo
    const sections: FileSection[] = [];
    const dependencies: FileDependency[] = [];

    // Analizar según el lenguaje
    switch (file.language) {
      case 'javascript':
      case 'typescript':
        this.analyzeJavaScript(file, lines, sections, dependencies);
        break;
      case 'html':
        this.analyzeHTML(file, lines, sections, dependencies);
        break;
      case 'css':
        this.analyzeCSS(file, lines, sections, dependencies);
        break;
      // Añadir más lenguajes según sea necesario
    }

    // Identificar áreas críticas
    const criticalAreas = this.identifyCriticalAreas(sections);

    // Generar una descripción del archivo
    const purpose = this.determineFilePurpose(file, sections, dependencies);
    const description = this.generateFileDescription(file, sections, dependencies);

    return {
      id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileId: file.id,
      path: file.path,
      language: file.language,
      purpose,
      description,
      sections,
      dependencies,
      criticalAreas,
      timestamp: Date.now()
    };
  }

  /**
   * Analiza los cambios propuestos y su impacto
   */
  private static analyzeChanges(
    file: FileItem,
    proposedChanges: string,
    fileAnalysis: FileAnalysis
  ): FileChangeAnalysis {
    // Analizar el impacto de los cambios
    const impacts: FileChangeImpact[] = [];

    // Identificar secciones afectadas
    const affectedSections = this.identifyAffectedSections(fileAnalysis.sections, proposedChanges);

    // Evaluar impacto en áreas críticas
    for (const area of fileAnalysis.criticalAreas) {
      const affectedCriticalSections = area.sections.filter(sectionId =>
        affectedSections.some(section => section.id === sectionId)
      );

      if (affectedCriticalSections.length > 0) {
        impacts.push({
          id: `impact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          description: `Los cambios afectan a un área crítica: ${area.description}`,
          level: 'critical',
          affectedFiles: [file.path],
          affectedFunctionality: area.description,
          recommendation: 'Revisar cuidadosamente los cambios y asegurar que no rompen la funcionalidad existente.'
        });
      }
    }

    // Evaluar impacto en dependencias
    const affectedDependencies = this.identifyAffectedDependencies(fileAnalysis.dependencies, proposedChanges);

    for (const dependency of affectedDependencies) {
      impacts.push({
        id: `impact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: `Los cambios afectan a una dependencia: ${dependency.description}`,
        level: dependency.isRequired ? 'critical' : 'important',
        affectedFiles: [dependency.path],
        affectedFunctionality: `Dependencia ${dependency.type}: ${dependency.description}`,
        recommendation: dependency.isRequired
          ? 'Asegurar que los cambios mantienen la compatibilidad con los archivos dependientes.'
          : 'Verificar que los cambios no afectan negativamente a los archivos relacionados.'
      });
    }

    // Generar resumen y recomendación
    const summary = this.generateChangeSummary(impacts);
    const recommendation = this.generateChangeRecommendation(impacts);

    return {
      originalFile: file,
      proposedChanges,
      impacts,
      summary,
      recommendation,
      timestamp: Date.now()
    };
  }

  /**
   * Analiza código JavaScript/TypeScript
   */
  private static analyzeJavaScript(
    file: FileItem,
    lines: string[],
    sections: FileSection[],
    dependencies: FileDependency[]
  ): void {
    // Detectar importaciones
    const importRegex = /import\s+(?:{([^}]+)}|\*\s+as\s+([a-zA-Z0-9_$]+)|([a-zA-Z0-9_$]+))\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    let content = file.content;

    while ((match = importRegex.exec(content)) !== null) {
      const importedItems = match[1] || match[2] || match[3];
      const source = match[4];

      // Añadir a dependencias
      dependencies.push({
        path: source,
        type: 'import',
        description: `Importa ${importedItems} desde ${source}`,
        isRequired: true
      });
    }

    // Detectar exportaciones
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)?\s+([a-zA-Z0-9_$]+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      const exportedItem = match[1];
      const startLine = this.getLineNumber(content, match.index);

      // Buscar el final de la exportación
      let endLine = startLine;
      let braceCount = 0;
      let inClass = false;

      // Si es una clase o función, buscar su final
      if (content.substring(match.index).includes('{')) {
        inClass = true;
        for (let i = startLine; i < lines.length; i++) {
          const line = lines[i];
          braceCount += (line.match(/{/g) || []).length;
          braceCount -= (line.match(/}/g) || []).length;

          if (braceCount === 0 && inClass) {
            endLine = i;
            break;
          }
        }
      }

      // Crear sección para la exportación
      const sectionContent = lines.slice(startLine - 1, endLine + 1).join('\n');
      sections.push({
        id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startLine,
        endLine: endLine + 1,
        content: sectionContent,
        description: `Exportación de ${exportedItem}`,
        isCritical: true,
        dependencies: []
      });
    }

    // Detectar funciones
    const functionRegex = /function\s+([a-zA-Z0-9_$]+)\s*\(/g;
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1];
      const startLine = this.getLineNumber(content, match.index);

      // Buscar el final de la función
      let endLine = startLine;
      let braceCount = 0;
      let inFunction = false;

      for (let i = startLine - 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('{') && !inFunction) {
          inFunction = true;
        }

        if (inFunction) {
          braceCount += (line.match(/{/g) || []).length;
          braceCount -= (line.match(/}/g) || []).length;

          if (braceCount === 0) {
            endLine = i + 1;
            break;
          }
        }
      }

      // Crear sección para la función
      const sectionContent = lines.slice(startLine - 1, endLine).join('\n');
      sections.push({
        id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startLine,
        endLine,
        content: sectionContent,
        description: `Función ${functionName}`,
        isCritical: false,
        dependencies: []
      });
    }

    // Detectar clases
    const classRegex = /class\s+([a-zA-Z0-9_$]+)(?:\s+extends\s+([a-zA-Z0-9_$]+))?/g;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const extendsClass = match[2];
      const startLine = this.getLineNumber(content, match.index);

      // Buscar el final de la clase
      let endLine = startLine;
      let braceCount = 0;
      let inClass = false;

      for (let i = startLine - 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('{') && !inClass) {
          inClass = true;
        }

        if (inClass) {
          braceCount += (line.match(/{/g) || []).length;
          braceCount -= (line.match(/}/g) || []).length;

          if (braceCount === 0) {
            endLine = i + 1;
            break;
          }
        }
      }

      // Crear sección para la clase
      const sectionContent = lines.slice(startLine - 1, endLine).join('\n');
      const classDependencies: FileDependency[] = [];

      // Si extiende otra clase, añadir dependencia
      if (extendsClass) {
        classDependencies.push({
          path: 'unknown', // No podemos saber el archivo exacto
          type: 'inheritance',
          description: `Hereda de la clase ${extendsClass}`,
          isRequired: true
        });
      }

      sections.push({
        id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startLine,
        endLine,
        content: sectionContent,
        description: `Clase ${className}${extendsClass ? ` que extiende ${extendsClass}` : ''}`,
        isCritical: true,
        dependencies: classDependencies
      });
    }
  }

  /**
   * Analiza código HTML
   */
  private static analyzeHTML(
    file: FileItem,
    lines: string[],
    sections: FileSection[],
    dependencies: FileDependency[]
  ): void {
    const content = file.content;

    // Detectar scripts y estilos externos
    const scriptRegex = /<script[^>]*src=['"]([^'"]+)['"]/g;
    let match;

    while ((match = scriptRegex.exec(content)) !== null) {
      const src = match[1];
      dependencies.push({
        path: src,
        type: 'reference',
        description: `Script externo: ${src}`,
        isRequired: true
      });
    }

    const linkRegex = /<link[^>]*href=['"]([^'"]+)['"]/g;
    while ((match = linkRegex.exec(content)) !== null) {
      const href = match[1];
      if (href.endsWith('.css')) {
        dependencies.push({
          path: href,
          type: 'reference',
          description: `Hoja de estilo externa: ${href}`,
          isRequired: true
        });
      }
    }

    // Detectar secciones principales (head, body, etc.)
    const headRegex = /<head[^>]*>([\s\S]*?)<\/head>/;
    const headMatch = headRegex.exec(content);
    if (headMatch) {
      const startLine = this.getLineNumber(content, headMatch.index);
      const endLine = this.getLineNumber(content, headMatch.index + headMatch[0].length);

      sections.push({
        id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startLine,
        endLine,
        content: headMatch[0],
        description: 'Sección head del documento HTML',
        isCritical: true,
        dependencies: []
      });
    }

    const bodyRegex = /<body[^>]*>([\s\S]*?)<\/body>/;
    const bodyMatch = bodyRegex.exec(content);
    if (bodyMatch) {
      const startLine = this.getLineNumber(content, bodyMatch.index);
      const endLine = this.getLineNumber(content, bodyMatch.index + bodyMatch[0].length);

      sections.push({
        id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startLine,
        endLine,
        content: bodyMatch[0],
        description: 'Sección body del documento HTML',
        isCritical: true,
        dependencies: []
      });
    }
  }

  /**
   * Analiza código CSS
   */
  private static analyzeCSS(
    file: FileItem,
    lines: string[],
    sections: FileSection[],
    dependencies: FileDependency[]
  ): void {
    const content = file.content;

    // Detectar importaciones de CSS
    const importRegex = /@import\s+(?:url\(['"]?([^'")]+)['"]?\)|['"]([^'"]+)['"]);/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1] || match[2];
      dependencies.push({
        path: importPath,
        type: 'import',
        description: `Importa estilos de ${importPath}`,
        isRequired: true
      });
    }

    // Detectar reglas de estilo
    const ruleRegex = /([^{]+){\s*([^}]*)\s*}/g;
    while ((match = ruleRegex.exec(content)) !== null) {
      const selector = match[1].trim();
      const startLine = this.getLineNumber(content, match.index);
      const endLine = this.getLineNumber(content, match.index + match[0].length);

      sections.push({
        id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startLine,
        endLine,
        content: match[0],
        description: `Regla de estilo para "${selector}"`,
        isCritical: false,
        dependencies: []
      });
    }
  }

  /**
   * Obtiene el número de línea a partir de un índice en el contenido
   */
  private static getLineNumber(content: string, index: number): number {
    const lines = content.substring(0, index).split('\n');
    return lines.length;
  }

  /**
   * Identifica áreas críticas en el archivo
   */
  private static identifyCriticalAreas(sections: FileSection[]): { description: string; sections: string[] }[] {
    const criticalAreas: { description: string; sections: string[] }[] = [];

    // Identificar secciones críticas
    const criticalSections = sections.filter(section => section.isCritical);

    // Agrupar secciones críticas por tipo
    const exportSections = criticalSections.filter(section => section.description.includes('Exportación'));
    if (exportSections.length > 0) {
      criticalAreas.push({
        description: 'Exportaciones del módulo',
        sections: exportSections.map(section => section.id)
      });
    }

    const classSections = criticalSections.filter(section => section.description.includes('Clase'));
    if (classSections.length > 0) {
      criticalAreas.push({
        description: 'Definiciones de clases',
        sections: classSections.map(section => section.id)
      });
    }

    return criticalAreas;
  }

  /**
   * Determina el propósito principal del archivo
   */
  private static determineFilePurpose(
    file: FileItem,
    sections: FileSection[],
    dependencies: FileDependency[]
  ): string {
    // Determinar el propósito según el tipo de archivo y su contenido
    if (file.language === 'javascript' || file.language === 'typescript') {
      const hasReactImport = dependencies.some(dep => dep.path.includes('react'));
      const hasComponentClass = sections.some(section =>
        section.description.includes('Clase') &&
        (section.content.includes('extends React.Component') || section.content.includes('React.FC'))
      );

      if (hasReactImport && hasComponentClass) {
        return 'Componente de React';
      }

      const hasExports = sections.some(section => section.description.includes('Exportación'));
      if (hasExports) {
        return 'Módulo JavaScript/TypeScript';
      }
    } else if (file.language === 'html') {
      return 'Documento HTML';
    } else if (file.language === 'css') {
      return 'Hoja de estilos CSS';
    }

    return 'Archivo de código';
  }

  /**
   * Genera una descripción del archivo basada en su análisis
   */
  private static generateFileDescription(
    file: FileItem,
    sections: FileSection[],
    dependencies: FileDependency[]
  ): string {
    const parts = [];

    // Añadir tipo de archivo
    parts.push(`Archivo ${file.language.toUpperCase()}`);

    // Añadir información sobre secciones
    const exportSections = sections.filter(section => section.description.includes('Exportación'));
    if (exportSections.length > 0) {
      parts.push(`exporta ${exportSections.length} elementos`);
    }

    const functionSections = sections.filter(section => section.description.includes('Función'));
    if (functionSections.length > 0) {
      parts.push(`contiene ${functionSections.length} funciones`);
    }

    const classSections = sections.filter(section => section.description.includes('Clase'));
    if (classSections.length > 0) {
      parts.push(`define ${classSections.length} clases`);
    }

    // Añadir información sobre dependencias
    if (dependencies.length > 0) {
      parts.push(`tiene ${dependencies.length} dependencias externas`);
    }

    return parts.join(', ');
  }

  /**
   * Identifica las secciones afectadas por los cambios propuestos
   */
  private static identifyAffectedSections(
    sections: FileSection[],
    proposedChanges: string
  ): FileSection[] {
    // Implementación simplificada: considera que todas las secciones podrían verse afectadas
    // En una implementación real, se analizaría el diff entre el archivo original y los cambios
    return sections;
  }

  /**
   * Identifica las dependencias afectadas por los cambios propuestos
   */
  private static identifyAffectedDependencies(
    dependencies: FileDependency[],
    proposedChanges: string
  ): FileDependency[] {
    // Implementación simplificada: considera que todas las dependencias podrían verse afectadas
    // En una implementación real, se analizaría el diff entre el archivo original y los cambios
    return dependencies;
  }

  /**
   * Genera un resumen de los impactos de los cambios
   */
  private static generateChangeSummary(impacts: FileChangeImpact[]): string {
    if (impacts.length === 0) {
      return 'Los cambios propuestos no parecen tener un impacto significativo en la funcionalidad existente.';
    }

    const criticalImpacts = impacts.filter(impact => impact.level === 'critical');
    const importantImpacts = impacts.filter(impact => impact.level === 'important');
    const normalImpacts = impacts.filter(impact => impact.level === 'normal');

    const parts = [];

    if (criticalImpacts.length > 0) {
      parts.push(`${criticalImpacts.length} impactos críticos que requieren atención inmediata`);
    }

    if (importantImpacts.length > 0) {
      parts.push(`${importantImpacts.length} impactos importantes que deben ser revisados`);
    }

    if (normalImpacts.length > 0) {
      parts.push(`${normalImpacts.length} impactos normales`);
    }

    return `Los cambios propuestos tienen ${parts.join(', ')}.`;
  }

  /**
   * Genera una recomendación basada en los impactos de los cambios
   */
  private static generateChangeRecommendation(impacts: FileChangeImpact[]): string {
    if (impacts.length === 0) {
      return 'Puede proceder con los cambios propuestos con confianza.';
    }

    const criticalImpacts = impacts.filter(impact => impact.level === 'critical');

    if (criticalImpacts.length > 0) {
      return 'Se recomienda revisar cuidadosamente los impactos críticos antes de proceder con los cambios.';
    }

    return 'Revise los impactos identificados y proceda con precaución.';
  }
}
