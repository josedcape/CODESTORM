/**
 * Servicio para importar y descomprimir repositorios en CODESTORM
 * Soporta archivos ZIP, RAR y otros formatos comprimidos
 */

import JSZip from 'jszip';
import { FileItem } from '../types';

export interface ImportedRepository {
  name: string;
  files: FileItem[];
  structure: DirectoryStructure;
  totalFiles: number;
  totalSize: number;
}

export interface DirectoryStructure {
  [key: string]: DirectoryNode;
}

export interface DirectoryNode {
  type: 'file' | 'directory';
  name: string;
  path: string;
  size?: number;
  content?: string;
  children?: DirectoryStructure;
  extension?: string;
  lastModified?: Date;
}

export interface ImportProgress {
  stage: 'reading' | 'extracting' | 'processing' | 'complete' | 'error';
  progress: number;
  currentFile?: string;
  totalFiles?: number;
  processedFiles?: number;
  error?: string;
}

export type ImportProgressCallback = (progress: ImportProgress) => void;

class RepositoryImportService {
  private supportedFormats = [
    '.zip',
    '.rar',
    '.7z',
    '.tar',
    '.tar.gz',
    '.tgz'
  ];

  /**
   * Verifica si el formato de archivo es soportado
   */
  public isSupportedFormat(fileName: string): boolean {
    const extension = this.getFileExtension(fileName);
    return this.supportedFormats.includes(extension);
  }

  /**
   * Obtiene la extensión del archivo
   */
  private getFileExtension(fileName: string): string {
    const name = fileName.toLowerCase();
    
    // Verificar extensiones compuestas
    if (name.endsWith('.tar.gz')) return '.tar.gz';
    if (name.endsWith('.tar.bz2')) return '.tar.bz2';
    
    // Extensión simple
    const lastDot = name.lastIndexOf('.');
    return lastDot !== -1 ? name.substring(lastDot) : '';
  }

  /**
   * Importa un repositorio desde un archivo comprimido
   */
  public async importRepository(
    file: File,
    onProgress?: ImportProgressCallback
  ): Promise<ImportedRepository> {
    try {
      // Verificar formato soportado
      if (!this.isSupportedFormat(file.name)) {
        throw new Error(`Formato de archivo no soportado: ${this.getFileExtension(file.name)}`);
      }

      // Notificar inicio
      onProgress?.({
        stage: 'reading',
        progress: 0,
        currentFile: file.name
      });

      // Leer archivo
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      
      onProgress?.({
        stage: 'extracting',
        progress: 25,
        currentFile: file.name
      });

      // Extraer archivos según el formato
      const extractedFiles = await this.extractFiles(arrayBuffer, file.name, onProgress);

      onProgress?.({
        stage: 'processing',
        progress: 75,
        totalFiles: extractedFiles.length
      });

      // Procesar estructura de directorios
      const structure = this.buildDirectoryStructure(extractedFiles);
      const fileItems = this.convertToFileItems(extractedFiles);

      const repository: ImportedRepository = {
        name: this.getRepositoryName(file.name),
        files: fileItems,
        structure,
        totalFiles: extractedFiles.length,
        totalSize: this.calculateTotalSize(extractedFiles)
      };

      onProgress?.({
        stage: 'complete',
        progress: 100,
        totalFiles: extractedFiles.length,
        processedFiles: extractedFiles.length
      });

      return repository;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      onProgress?.({
        stage: 'error',
        progress: 0,
        error: errorMessage
      });

      throw new Error(`Error importando repositorio: ${errorMessage}`);
    }
  }

  /**
   * Lee un archivo como ArrayBuffer
   */
  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Error leyendo archivo'));
        }
      };
      
      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extrae archivos según el formato
   */
  private async extractFiles(
    arrayBuffer: ArrayBuffer,
    fileName: string,
    onProgress?: ImportProgressCallback
  ): Promise<ExtractedFile[]> {
    const extension = this.getFileExtension(fileName);

    switch (extension) {
      case '.zip':
        return this.extractZipFiles(arrayBuffer, onProgress);
      
      case '.rar':
        throw new Error('Formato RAR no soportado actualmente. Use ZIP como alternativa.');
      
      case '.7z':
        throw new Error('Formato 7Z no soportado actualmente. Use ZIP como alternativa.');
      
      case '.tar':
      case '.tar.gz':
      case '.tgz':
        throw new Error('Formato TAR no soportado actualmente. Use ZIP como alternativa.');
      
      default:
        throw new Error(`Formato no soportado: ${extension}`);
    }
  }

  /**
   * Extrae archivos ZIP
   */
  private async extractZipFiles(
    arrayBuffer: ArrayBuffer,
    onProgress?: ImportProgressCallback
  ): Promise<ExtractedFile[]> {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(arrayBuffer);
    
    const files: ExtractedFile[] = [];
    const fileNames = Object.keys(zipContent.files);
    let processedCount = 0;

    for (const fileName of fileNames) {
      const zipEntry = zipContent.files[fileName];
      
      if (!zipEntry.dir) {
        try {
          const content = await zipEntry.async('text');
          
          files.push({
            name: this.getFileName(fileName),
            path: fileName,
            content,
            size: content.length,
            lastModified: zipEntry.date || new Date(),
            extension: this.getFileExtension(fileName)
          });

          processedCount++;
          
          onProgress?.({
            stage: 'extracting',
            progress: 25 + (processedCount / fileNames.length) * 50,
            currentFile: fileName,
            totalFiles: fileNames.length,
            processedFiles: processedCount
          });

        } catch (error) {
          console.warn(`Error extrayendo archivo ${fileName}:`, error);
        }
      }
    }

    return files;
  }

  /**
   * Construye la estructura de directorios
   */
  private buildDirectoryStructure(files: ExtractedFile[]): DirectoryStructure {
    const structure: DirectoryStructure = {};

    files.forEach(file => {
      const pathParts = file.path.split('/').filter(part => part.length > 0);
      let currentLevel = structure;

      pathParts.forEach((part, index) => {
        if (index === pathParts.length - 1) {
          // Es un archivo
          currentLevel[part] = {
            type: 'file',
            name: part,
            path: file.path,
            size: file.size,
            content: file.content,
            extension: file.extension,
            lastModified: file.lastModified
          };
        } else {
          // Es un directorio
          if (!currentLevel[part]) {
            currentLevel[part] = {
              type: 'directory',
              name: part,
              path: pathParts.slice(0, index + 1).join('/'),
              children: {}
            };
          }
          currentLevel = currentLevel[part].children!;
        }
      });
    });

    return structure;
  }

  /**
   * Convierte archivos extraídos a FileItems
   */
  private convertToFileItems(files: ExtractedFile[]): FileItem[] {
    return files.map(file => ({
      id: this.generateFileId(file.path),
      name: file.name,
      content: file.content,
      type: this.getFileType(file.extension),
      path: file.path,
      size: file.size,
      lastModified: file.lastModified,
      isDirectory: false
    }));
  }

  /**
   * Obtiene el nombre del repositorio desde el nombre del archivo
   */
  private getRepositoryName(fileName: string): string {
    const nameWithoutExtension = fileName.replace(/\.(zip|rar|7z|tar|tar\.gz|tgz)$/i, '');
    return nameWithoutExtension || 'Repositorio Importado';
  }

  /**
   * Obtiene el nombre del archivo desde la ruta
   */
  private getFileName(filePath: string): string {
    const parts = filePath.split('/');
    return parts[parts.length - 1];
  }

  /**
   * Calcula el tamaño total de los archivos
   */
  private calculateTotalSize(files: ExtractedFile[]): number {
    return files.reduce((total, file) => total + file.size, 0);
  }

  /**
   * Genera un ID único para el archivo
   */
  private generateFileId(path: string): string {
    return `imported_${Date.now()}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  /**
   * Determina el tipo de archivo basado en la extensión
   */
  private getFileType(extension: string): string {
    const typeMap: { [key: string]: string } = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'javascript',
      '.tsx': 'typescript',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.json': 'json',
      '.md': 'markdown',
      '.txt': 'text',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.vue': 'vue',
      '.svelte': 'svelte'
    };

    return typeMap[extension.toLowerCase()] || 'text';
  }

  /**
   * Obtiene los formatos soportados
   */
  public getSupportedFormats(): string[] {
    return [...this.supportedFormats];
  }
}

interface ExtractedFile {
  name: string;
  path: string;
  content: string;
  size: number;
  lastModified: Date;
  extension: string;
}

export const repositoryImportService = new RepositoryImportService();
export default repositoryImportService;
