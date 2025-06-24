/**
 * Servicio para manejar la carga y descompresión de archivos comprimidos
 * Soporta archivos ZIP y RAR con límite de almacenamiento de 1GB
 */

import JSZip from 'jszip';
import { FileItem } from '../types';
import { generateUniqueId } from '../utils/idGenerator';

export interface CompressionProgress {
  stage: 'reading' | 'extracting' | 'processing' | 'completed' | 'error';
  progress: number;
  currentFile?: string;
  totalFiles?: number;
  extractedFiles?: number;
  message?: string;
}

export interface CompressionResult {
  success: boolean;
  files: FileItem[];
  error?: string;
  totalSize: number;
  extractedCount: number;
}

export class FileCompressionService {
  private static instance: FileCompressionService;
  private readonly MAX_STORAGE_SIZE = 1024 * 1024 * 1024; // 1GB en bytes
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB por archivo individual
  private progressCallback?: (progress: CompressionProgress) => void;

  private constructor() {}

  public static getInstance(): FileCompressionService {
    if (!FileCompressionService.instance) {
      FileCompressionService.instance = new FileCompressionService();
      console.log('📦 FileCompressionService inicializado con límites:', {
        maxFileSize: '100MB',
        maxStorageSize: '1GB',
        maxFileSizeBytes: FileCompressionService.instance.MAX_FILE_SIZE,
        maxStorageSizeBytes: FileCompressionService.instance.MAX_STORAGE_SIZE
      });
    }
    return FileCompressionService.instance;
  }

  /**
   * Establece el callback para reportar progreso
   */
  public setProgressCallback(callback: (progress: CompressionProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Reporta progreso al callback si está configurado
   */
  private reportProgress(progress: CompressionProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  /**
   * Valida el tamaño del archivo antes de procesarlo
   */
  private validateFileSize(file: File): boolean {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`El archivo ${file.name} excede el límite de 100MB por archivo`);
    }
    return true;
  }

  /**
   * Valida el tamaño total de los archivos extraídos
   */
  private validateTotalSize(totalSize: number): boolean {
    if (totalSize > this.MAX_STORAGE_SIZE) {
      throw new Error(`El contenido descomprimido excede el límite de 1GB`);
    }
    return true;
  }

  /**
   * Detecta el tipo de archivo comprimido basado en la extensión
   */
  private detectCompressionType(fileName: string): 'zip' | 'rar' | 'unknown' {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'zip':
        return 'zip';
      case 'rar':
        return 'rar';
      default:
        return 'unknown';
    }
  }

  /**
   * Procesa archivos ZIP usando JSZip
   */
  private async processZipFile(file: File): Promise<CompressionResult> {
    try {
      this.reportProgress({
        stage: 'reading',
        progress: 10,
        message: 'Leyendo archivo ZIP...'
      });

      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);

      this.reportProgress({
        stage: 'extracting',
        progress: 30,
        message: 'Extrayendo archivos...'
      });

      const files: FileItem[] = [];
      const fileEntries = Object.keys(zipContent.files);
      let totalSize = 0;
      let extractedCount = 0;

      for (let i = 0; i < fileEntries.length; i++) {
        const fileName = fileEntries[i];
        const zipEntry = zipContent.files[fileName];

        // Saltar directorios
        if (zipEntry.dir) {
          continue;
        }

        this.reportProgress({
          stage: 'extracting',
          progress: 30 + (i / fileEntries.length) * 50,
          currentFile: fileName,
          totalFiles: fileEntries.length,
          extractedFiles: extractedCount,
          message: `Extrayendo: ${fileName}`
        });

        try {
          const content = await zipEntry.async('text');
          const fileSize = new Blob([content]).size;

          totalSize += fileSize;

          // Validar tamaño total durante la extracción
          if (totalSize > this.MAX_STORAGE_SIZE) {
            throw new Error(`El contenido descomprimido excede el límite de 1GB`);
          }

          const fileItem: FileItem = {
            id: generateUniqueId('extracted'),
            name: fileName.split('/').pop() || fileName,
            path: fileName.startsWith('/') ? fileName : `/${fileName}`,
            content: content,
            language: this.detectLanguage(fileName),
            timestamp: Date.now(),
            size: fileSize,
            isModified: false
          };

          files.push(fileItem);
          extractedCount++;

        } catch (error) {
          console.warn(`Error extrayendo archivo ${fileName}:`, error);
          // Continuar con el siguiente archivo
        }
      }

      this.reportProgress({
        stage: 'completed',
        progress: 100,
        message: `Extracción completada: ${extractedCount} archivos`
      });

      return {
        success: true,
        files,
        totalSize,
        extractedCount
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido procesando ZIP';

      this.reportProgress({
        stage: 'error',
        progress: 0,
        message: errorMessage
      });

      return {
        success: false,
        files: [],
        error: errorMessage,
        totalSize: 0,
        extractedCount: 0
      };
    }
  }

  /**
   * Procesa archivos RAR (implementación básica)
   * Nota: La descompresión de RAR en el navegador es limitada
   */
  private async processRarFile(file: File): Promise<CompressionResult> {
    try {
      this.reportProgress({
        stage: 'reading',
        progress: 10,
        message: 'Leyendo archivo RAR...'
      });

      // Para archivos RAR, por ahora retornamos un error informativo
      // La descompresión de RAR en el navegador requiere librerías más complejas
      throw new Error('La descompresión de archivos RAR no está completamente soportada en el navegador. Por favor, use archivos ZIP.');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error procesando archivo RAR';

      this.reportProgress({
        stage: 'error',
        progress: 0,
        message: errorMessage
      });

      return {
        success: false,
        files: [],
        error: errorMessage,
        totalSize: 0,
        extractedCount: 0
      };
    }
  }

  /**
   * Detecta el lenguaje de programación basado en la extensión del archivo
   */
  private detectLanguage(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell'
    };

    return languageMap[extension || ''] || 'text';
  }

  /**
   * Método principal para procesar archivos comprimidos
   */
  public async processCompressedFile(file: File): Promise<CompressionResult> {
    try {
      // Validar tamaño del archivo
      this.validateFileSize(file);

      // Detectar tipo de compresión
      const compressionType = this.detectCompressionType(file.name);

      if (compressionType === 'unknown') {
        throw new Error(`Tipo de archivo no soportado: ${file.name}. Solo se admiten archivos ZIP y RAR.`);
      }

      this.reportProgress({
        stage: 'reading',
        progress: 5,
        message: `Procesando archivo ${compressionType.toUpperCase()}...`
      });

      // Procesar según el tipo
      switch (compressionType) {
        case 'zip':
          return await this.processZipFile(file);
        case 'rar':
          return await this.processRarFile(file);
        default:
          throw new Error(`Tipo de compresión no soportado: ${compressionType}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error procesando archivo comprimido';

      this.reportProgress({
        stage: 'error',
        progress: 0,
        message: errorMessage
      });

      return {
        success: false,
        files: [],
        error: errorMessage,
        totalSize: 0,
        extractedCount: 0
      };
    }
  }

  /**
   * Valida si un archivo es un tipo de compresión soportado
   */
  public isSupportedCompressionFile(fileName: string): boolean {
    const compressionType = this.detectCompressionType(fileName);
    return compressionType === 'zip' || compressionType === 'rar';
  }

  /**
   * Obtiene información sobre los límites de almacenamiento
   */
  public getStorageLimits() {
    const limits = {
      maxStorageSize: this.MAX_STORAGE_SIZE,
      maxFileSize: this.MAX_FILE_SIZE,
      maxStorageSizeMB: this.MAX_STORAGE_SIZE / (1024 * 1024),
      maxFileSizeMB: this.MAX_FILE_SIZE / (1024 * 1024),
      maxStorageSizeGB: this.MAX_STORAGE_SIZE / (1024 * 1024 * 1024),
      maxFileSizeMBFormatted: `${this.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      maxStorageSizeFormatted: `${this.MAX_STORAGE_SIZE / (1024 * 1024 * 1024)}GB`
    };

    console.log('📊 Límites de almacenamiento solicitados:', limits);
    return limits;
  }
}
