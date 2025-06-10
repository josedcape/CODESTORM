/**
 * Servicio para cargar repositorios reales de GitHub
 * Utiliza la API pública de GitHub para obtener la estructura de archivos
 */

import { ProjectStructure } from '../pages/Agent';

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

export interface GitHubRepoInfo {
  name: string;
  full_name: string;
  description: string;
  size: number;
  updated_at: string;
  default_branch: string;
}

interface DownloadStats {
  totalFiles: number;
  successfulDownloads: number;
  failedDownloads: number;
  skippedFiles: number;
  oversizedFiles: number;
  failedFiles: string[];
  warnings: string[];
}

class GitHubRepositoryService {
  private readonly baseUrl = 'https://api.github.com';
  private readonly maxFileSize = 1024 * 1024; // 1MB límite para archivos individuales
  private readonly maxFiles = 2000; // Límite aumentado para repositorios grandes
  private readonly batchSize = 100; // Procesar archivos en lotes
  private downloadStats: DownloadStats = {
    totalFiles: 0,
    successfulDownloads: 0,
    failedDownloads: 0,
    skippedFiles: 0,
    oversizedFiles: 0,
    failedFiles: [],
    warnings: []
  };

  /**
   * Extrae información del repositorio desde una URL de GitHub
   */
  public parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?(?:\/.*)?$/,
      /^([^\/]+)\/([^\/]+)$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace(/\.git$/, '')
        };
      }
    }

    return null;
  }

  /**
   * Obtiene información básica del repositorio
   */
  public async getRepositoryInfo(owner: string, repo: string): Promise<GitHubRepoInfo> {
    const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Repositorio no encontrado. Verifica que sea público y que la URL sea correcta.');
      } else if (response.status === 403) {
        throw new Error('Límite de API alcanzado. Intenta nuevamente en unos minutos.');
      }
      throw new Error(`Error al acceder al repositorio: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Obtiene la estructura completa del repositorio
   */
  public async getRepositoryStructure(
    owner: string, 
    repo: string, 
    branch: string = 'main',
    onProgress?: (progress: { current: number; total: number; file?: string }) => void
  ): Promise<ProjectStructure> {
    try {
      // Primero intentar con la rama especificada, luego con 'master' si falla
      let repoInfo: GitHubRepoInfo;
      try {
        repoInfo = await this.getRepositoryInfo(owner, repo);
        branch = branch || repoInfo.default_branch;
      } catch (error) {
        throw error;
      }

      // Obtener el árbol completo del repositorio
      const treeResponse = await fetch(
        `${this.baseUrl}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
      );

      if (!treeResponse.ok) {
        if (treeResponse.status === 404) {
          throw new Error(`Rama '${branch}' no encontrada. Verifica el nombre de la rama.`);
        }
        throw new Error(`Error al obtener estructura: ${treeResponse.statusText}`);
      }

      const treeData: GitHubTreeResponse = await treeResponse.json();

      if (treeData.truncated) {
        console.warn('El repositorio es muy grande, algunos archivos pueden no estar incluidos');
      }

      // Separar archivos y directorios
      const allFiles = treeData.tree.filter(item => item.type === 'blob');
      const allDirectories = treeData.tree.filter(item => item.type === 'tree');

      // Filtrar archivos por tamaño y tipo
      const validFiles = allFiles.filter(item => {
        const size = item.size || 0;
        const isBinary = this.isBinaryFile(item.path);

        // Omitir archivos binarios grandes o archivos de texto muy grandes
        if (isBinary && size > 100 * 1024) { // 100KB para binarios
          return false;
        }

        return size <= this.maxFileSize;
      });

      const oversizedFiles = allFiles.filter(item => !validFiles.includes(item));

      if (oversizedFiles.length > 0) {
        console.warn(`⚠️ ${oversizedFiles.length} archivos omitidos por ser demasiado grandes (>1MB)`);
      }

      // Inicializar estadísticas de descarga
      this.downloadStats = {
        totalFiles: Math.min(validFiles.length, this.maxFiles),
        successfulDownloads: 0,
        failedDownloads: 0,
        skippedFiles: 0,
        oversizedFiles: oversizedFiles.length,
        failedFiles: [],
        warnings: []
      };

      // Construir la estructura de directorios con TODOS los archivos válidos
      const structure = await this.buildProjectStructure(
        validFiles,
        allDirectories,
        owner,
        repo,
        repoInfo.name,
        onProgress
      );

      return structure;

    } catch (error) {
      console.error('Error obteniendo estructura del repositorio:', error);
      throw error;
    }
  }

  /**
   * Construye la estructura del proyecto desde los archivos de GitHub
   */
  private async buildProjectStructure(
    files: GitHubTreeItem[],
    directories: GitHubTreeItem[],
    owner: string,
    repo: string,
    repoName: string,
    onProgress?: (progress: { current: number; total: number; file?: string }) => void
  ): Promise<ProjectStructure> {
    const structure: ProjectStructure = {
      id: 'root',
      name: repoName,
      path: '/',
      type: 'directory',
      isExpanded: true,
      children: []
    };

    // Crear mapa de directorios
    const dirMap = new Map<string, ProjectStructure>();
    dirMap.set('/', structure);

    // Crear directorios
    directories.forEach(dir => {
      const pathParts = dir.path.split('/');
      let currentPath = '';
      
      pathParts.forEach((part) => {
        const parentPath = currentPath || '/';
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const fullPath = `/${currentPath}`;

        if (!dirMap.has(fullPath)) {
          const dirNode: ProjectStructure = {
            id: `dir-${currentPath.replace(/[^a-zA-Z0-9]/g, '-')}`,
            name: part,
            path: fullPath,
            type: 'directory',
            isExpanded: false,
            children: []
          };

          dirMap.set(fullPath, dirNode);
          
          const parent = dirMap.get(parentPath);
          if (parent && parent.children) {
            parent.children.push(dirNode);
          }
        }
      });
    });

    // Procesar archivos con contenido
    let processedFiles = 0;
    const totalFiles = Math.min(files.length, this.maxFiles);

    // Procesar archivos en lotes para mejor rendimiento
    for (let i = 0; i < totalFiles; i += this.batchSize) {
      const batch = files.slice(i, Math.min(i + this.batchSize, totalFiles));

      // Procesar lote en paralelo
      await Promise.all(batch.map(async (file, batchIndex) => {
        try {
          const currentIndex = i + batchIndex;
          onProgress?.({
            current: currentIndex + 1,
            total: totalFiles,
            file: file.path
          });

          const content = await this.getFileContent(owner, repo, file.path, file.size);

          // Verificar si el contenido indica un error
          const isErrorContent = content.includes('❌ ERROR CARGANDO ARCHIVO');

          if (isErrorContent) {
            this.downloadStats.failedDownloads++;
            this.downloadStats.failedFiles.push(file.path);
          } else {
            this.downloadStats.successfulDownloads++;
          }

          const pathParts = file.path.split('/');
          const fileName = pathParts.pop() || file.path;
          const dirPath = pathParts.length > 0 ? `/${pathParts.join('/')}` : '/';

          const fileNode: ProjectStructure = {
            id: `file-${file.path.replace(/[^a-zA-Z0-9]/g, '-')}`,
            name: fileName,
            path: `/${file.path}`,
            type: 'file',
            size: file.size,
            lastModified: Date.now(),
            language: this.detectLanguageFromExtension(fileName),
            content: content
          };

          const parentDir = dirMap.get(dirPath);
          if (parentDir && parentDir.children) {
            parentDir.children.push(fileNode);
          }

          processedFiles++;

        } catch (error) {
          console.warn(`❌ Error cargando archivo ${file.path}:`, error);
          this.downloadStats.failedDownloads++;
          this.downloadStats.failedFiles.push(file.path);
          processedFiles++;
        }
      }));

      // Pausa entre lotes para evitar rate limiting
      if (i + this.batchSize < totalFiles) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Ordenar children en cada directorio
    this.sortStructureChildren(structure);

    // Reportar estadísticas de descarga
    this.reportDownloadStats();

    return structure;
  }

  /**
   * Obtiene el contenido de un archivo específico con validación completa
   */
  private async getFileContent(owner: string, repo: string, path: string, expectedSize?: number): Promise<string> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(
          `${this.baseUrl}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'CODESTORM-Agent/1.0'
            }
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Archivo no encontrado: ${path}`);
          } else if (response.status === 403) {
            throw new Error(`Acceso denegado al archivo: ${path}`);
          } else if (response.status === 422) {
            throw new Error(`Archivo demasiado grande para la API: ${path}`);
          }
          throw new Error(`Error ${response.status}: ${response.statusText} para ${path}`);
        }

        const data = await response.json();

        // Validar que tenemos los datos necesarios
        if (!data) {
          throw new Error(`Respuesta vacía para archivo: ${path}`);
        }

        // Manejar diferentes tipos de contenido
        let content: string;

        if (data.content && data.encoding === 'base64') {
          // Decodificar contenido base64 con validación
          content = this.decodeBase64Content(data.content, path);
        } else if (data.content) {
          // Contenido ya en texto plano
          content = data.content;
        } else if (data.download_url) {
          // Fallback: descargar directamente desde la URL
          content = await this.downloadFromUrl(data.download_url, path);
        } else {
          throw new Error(`No se pudo obtener contenido para: ${path}`);
        }

        // Validar integridad del contenido
        this.validateFileContent(content, expectedSize, path, data.size);

        return content;

      } catch (error) {
        lastError = error as Error;
        console.warn(`❌ Intento ${attempt}/${maxRetries} falló para ${path}:`, error);

        if (attempt < maxRetries) {
          // Esperar antes del siguiente intento (backoff exponencial)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // Si todos los intentos fallaron, devolver contenido de error informativo
    const errorContent = this.generateErrorContent(path, lastError);
    console.error(`🚨 Error definitivo cargando ${path} después de ${maxRetries} intentos:`, lastError);
    return errorContent;
  }

  /**
   * Decodifica contenido base64 con validación robusta
   */
  private decodeBase64Content(base64Content: string, filePath: string): string {
    try {
      // Limpiar el contenido base64 (remover saltos de línea y espacios)
      const cleanBase64 = base64Content.replace(/[\r\n\s]/g, '');

      // Validar que es base64 válido
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
        throw new Error(`Contenido base64 inválido para ${filePath}`);
      }

      // Decodificar
      const decoded = atob(cleanBase64);

      // Validar que la decodificación fue exitosa
      if (decoded.length === 0 && cleanBase64.length > 0) {
        throw new Error(`Decodificación base64 resultó en contenido vacío para ${filePath}`);
      }

      return decoded;
    } catch (error) {
      console.error(`Error decodificando base64 para ${filePath}:`, error);
      throw new Error(`Error en decodificación base64: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Descarga contenido directamente desde URL como fallback
   */
  private async downloadFromUrl(downloadUrl: string, filePath: string): Promise<string> {
    try {
      const response = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'CODESTORM-Agent/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Error descargando desde URL: ${response.status} ${response.statusText}`);
      }

      const content = await response.text();

      if (content.length === 0) {
        console.warn(`⚠️ Contenido vacío descargado para ${filePath}`);
      }

      return content;
    } catch (error) {
      console.error(`Error descargando desde URL para ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Valida la integridad del contenido descargado
   */
  private validateFileContent(content: string, expectedSize: number | undefined, filePath: string, apiSize?: number): void {
    // Validar que el contenido no esté vacío para archivos que deberían tener contenido
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    const shouldHaveContent = fileExtension && !['png', 'jpg', 'jpeg', 'gif', 'ico', 'svg', 'woff', 'woff2', 'ttf', 'eot'].includes(fileExtension);

    if (shouldHaveContent && content.length === 0) {
      console.warn(`⚠️ Archivo de texto ${filePath} tiene contenido vacío`);
    }

    // Validar tamaño si está disponible
    if (expectedSize && Math.abs(content.length - expectedSize) > expectedSize * 0.1) {
      console.warn(`⚠️ Discrepancia de tamaño para ${filePath}: esperado ~${expectedSize}, obtenido ${content.length}`);
    }

    if (apiSize && Math.abs(content.length - apiSize) > apiSize * 0.1) {
      console.warn(`⚠️ Discrepancia con tamaño de API para ${filePath}: API reporta ${apiSize}, obtenido ${content.length}`);
    }

    // Validar que el contenido parece válido para el tipo de archivo
    this.validateContentFormat(content, filePath);
  }

  /**
   * Valida que el formato del contenido sea apropiado para el tipo de archivo
   */
  private validateContentFormat(content: string, filePath: string): void {
    const extension = filePath.split('.').pop()?.toLowerCase();

    if (!extension) return;

    try {
      switch (extension) {
        case 'json':
          JSON.parse(content);
          break;
        case 'xml':
        case 'html':
          if (!content.includes('<') && content.length > 0) {
            console.warn(`⚠️ Archivo ${extension.toUpperCase()} ${filePath} no parece contener markup válido`);
          }
          break;
        case 'js':
        case 'ts':
        case 'jsx':
        case 'tsx':
          if (content.includes('\0')) {
            console.warn(`⚠️ Archivo JavaScript/TypeScript ${filePath} contiene caracteres nulos (posible archivo binario)`);
          }
          break;
      }
    } catch (error) {
      if (extension === 'json') {
        console.warn(`⚠️ Archivo JSON ${filePath} no es JSON válido:`, error);
      }
    }
  }

  /**
   * Genera contenido de error informativo cuando falla la descarga
   */
  private generateErrorContent(filePath: string, error: Error | null): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const timestamp = new Date().toISOString();

    const errorInfo = error ? error.message : 'Error desconocido';

    // Generar comentario apropiado según el tipo de archivo
    const commentStart = this.getCommentStart(extension || '');

    return `${commentStart} ❌ ERROR CARGANDO ARCHIVO
${commentStart} Archivo: ${filePath}
${commentStart} Error: ${errorInfo}
${commentStart} Timestamp: ${timestamp}
${commentStart}
${commentStart} Este archivo no se pudo cargar desde GitHub.
${commentStart} Posibles causas:
${commentStart} - Archivo demasiado grande (>1MB)
${commentStart} - Problemas de conectividad
${commentStart} - Límites de API alcanzados
${commentStart} - Archivo binario o corrupto
${commentStart}
${commentStart} Intenta recargar el repositorio o verifica la conectividad.`;
  }

  /**
   * Obtiene el inicio de comentario apropiado para cada tipo de archivo
   */
  private getCommentStart(extension: string): string {
    const commentMap: { [key: string]: string } = {
      'js': '//',
      'jsx': '//',
      'ts': '//',
      'tsx': '//',
      'java': '//',
      'cpp': '//',
      'c': '//',
      'cs': '//',
      'php': '//',
      'go': '//',
      'rs': '//',
      'css': '/*',
      'scss': '//',
      'sass': '//',
      'py': '#',
      'rb': '#',
      'sh': '#',
      'yaml': '#',
      'yml': '#',
      'html': '<!--',
      'xml': '<!--',
      'md': '<!--',
      'sql': '--',
      'bat': 'REM'
    };

    return commentMap[extension] || '#';
  }

  /**
   * Detecta si un archivo es binario basándose en su extensión
   */
  private isBinaryFile(filePath: string): boolean {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const binaryExtensions = [
      // Imágenes
      'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'svg', 'webp', 'tiff', 'tif',
      // Audio
      'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a',
      // Video
      'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv',
      // Archivos comprimidos
      'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz',
      // Ejecutables
      'exe', 'dll', 'so', 'dylib', 'bin',
      // Fuentes
      'woff', 'woff2', 'ttf', 'otf', 'eot',
      // Documentos binarios
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      // Otros
      'db', 'sqlite', 'sqlite3'
    ];

    return extension ? binaryExtensions.includes(extension) : false;
  }

  /**
   * Detecta el lenguaje de programación por extensión de archivo
   */
  private detectLanguageFromExtension(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'txt': 'text',
      'sh': 'bash',
      'bat': 'batch',
      'dockerfile': 'dockerfile',
      'gitignore': 'text',
      'env': 'text'
    };
    return languageMap[extension || ''] || 'text';
  }

  /**
   * Reporta estadísticas detalladas de la descarga
   */
  private reportDownloadStats(): void {
    const stats = this.downloadStats;
    const successRate = stats.totalFiles > 0 ? (stats.successfulDownloads / stats.totalFiles * 100).toFixed(1) : '0';

    console.group('📊 Estadísticas de Descarga del Repositorio');
    console.log(`✅ Archivos descargados exitosamente: ${stats.successfulDownloads}/${stats.totalFiles} (${successRate}%)`);

    if (stats.failedDownloads > 0) {
      console.warn(`❌ Archivos con errores: ${stats.failedDownloads}`);
      console.warn('Archivos problemáticos:', stats.failedFiles);
    }

    if (stats.oversizedFiles > 0) {
      console.warn(`📏 Archivos omitidos por tamaño (>1MB): ${stats.oversizedFiles}`);
    }

    if (stats.warnings.length > 0) {
      console.warn('⚠️ Advertencias:', stats.warnings);
    }

    // Mostrar resumen en consola para el usuario
    if (stats.failedDownloads > 0 || stats.oversizedFiles > 0) {
      console.warn(`
🔍 RESUMEN DE CARGA:
• Total de archivos procesados: ${stats.totalFiles}
• Descargas exitosas: ${stats.successfulDownloads}
• Errores de descarga: ${stats.failedDownloads}
• Archivos omitidos por tamaño: ${stats.oversizedFiles}
• Tasa de éxito: ${successRate}%

${stats.failedDownloads > 0 ? '⚠️ Algunos archivos no se pudieron descargar completamente. Revisa la consola para más detalles.' : ''}
${stats.oversizedFiles > 0 ? '📏 Algunos archivos fueron omitidos por ser demasiado grandes (>1MB).' : ''}
      `);
    } else {
      console.log(`✅ ¡Descarga completa! Todos los ${stats.totalFiles} archivos se descargaron exitosamente.`);
    }

    console.groupEnd();
  }

  /**
   * Ordena recursivamente los children de la estructura
   */
  private sortStructureChildren(node: ProjectStructure): void {
    if (node.children) {
      // Ordenar: directorios primero, luego archivos, ambos alfabéticamente
      node.children.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      // Recursivamente ordenar children
      node.children.forEach(child => this.sortStructureChildren(child));
    }
  }
}

export default GitHubRepositoryService;
