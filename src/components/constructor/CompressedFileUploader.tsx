/**
 * Componente para cargar y descomprimir archivos ZIP/RAR
 * Integrado con el sistema de archivos del Constructor
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileArchive,
  AlertCircle,
  CheckCircle,
  Loader,
  X,
  HardDrive,
  File,
  Folder
} from 'lucide-react';
import { FileCompressionService, CompressionProgress, CompressionResult } from '../../services/FileCompressionService';
import { FileItem } from '../../types';

interface CompressedFileUploaderProps {
  onFilesExtracted: (files: FileItem[]) => void;
  onError?: (error: string) => void;
  className?: string;
}

const CompressedFileUploader: React.FC<CompressedFileUploaderProps> = ({
  onFilesExtracted,
  onError,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<CompressionProgress | null>(null);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const compressionService = FileCompressionService.getInstance();

  // Configurar callback de progreso
  React.useEffect(() => {
    console.log('🔧 CompressedFileUploader montado');
    compressionService.setProgressCallback((progress: CompressionProgress) => {
      console.log('📊 Progreso de compresión:', progress);
      setProgress(progress);
    });

    return () => {
      console.log('🔧 CompressedFileUploader desmontado');
    };
  }, []);

  /**
   * Valida si el archivo es soportado
   */
  const validateFile = (file: File): boolean => {
    console.log('🔍 Validando archivo:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    if (!compressionService.isSupportedCompressionFile(file.name)) {
      const error = `Tipo de archivo no soportado: ${file.name}. Solo se admiten archivos ZIP y RAR.`;
      console.log('❌ Archivo no soportado:', error);
      onError?.(error);
      return false;
    }

    console.log('✅ Archivo válido');
    return true;
  };

  /**
   * Procesa el archivo seleccionado
   */
  const processFile = async (file: File) => {
    console.log('🔄 Iniciando procesamiento de archivo:', file.name);

    if (!validateFile(file)) {
      console.log('❌ Archivo no válido');
      return;
    }

    setIsProcessing(true);
    setProgress(null);
    setResult(null);
    setShowResult(false);

    try {
      console.log('📦 Procesando archivo con servicio de compresión...');
      const result = await compressionService.processCompressedFile(file);
      console.log('✅ Resultado del procesamiento:', result);

      setResult(result);
      setShowResult(true);

      if (result.success) {
        console.log('🎉 Extracción exitosa, notificando archivos:', result.files.length);
        // Notificar archivos extraídos al componente padre
        onFilesExtracted(result.files);
      } else {
        console.log('❌ Error en la extracción:', result.error);
        onError?.(result.error || 'Error desconocido durante la extracción');
      }
    } catch (error) {
      console.error('💥 Error crítico procesando archivo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error procesando archivo';
      onError?.(errorMessage);
      setResult({
        success: false,
        files: [],
        error: errorMessage,
        totalSize: 0,
        extractedCount: 0
      });
      setShowResult(true);
    } finally {
      console.log('🏁 Finalizando procesamiento');
      setIsProcessing(false);
    }
  };

  /**
   * Maneja la selección de archivos
   */
  const handleFileSelect = (files: FileList | null) => {
    console.log('📂 Archivos seleccionados:', files);
    if (!files || files.length === 0) {
      console.log('⚠️ No hay archivos seleccionados');
      return;
    }

    const file = files[0];
    console.log('📄 Archivo a procesar:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    processFile(file);
  };

  /**
   * Maneja el evento de drop
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  /**
   * Maneja el evento de drag over
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  /**
   * Maneja el evento de drag leave
   */
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  /**
   * Abre el selector de archivos
   */
  const openFileSelector = () => {
    console.log('📁 Abriendo selector de archivos...');
    console.log('📁 Referencia del input:', fileInputRef.current);
    fileInputRef.current?.click();
  };

  /**
   * Cierra el modal de resultado
   */
  const closeResult = () => {
    setShowResult(false);
    setResult(null);
    setProgress(null);
  };

  /**
   * Formatea el tamaño en bytes a una representación legible
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Obtiene información sobre los límites
   */
  const limits = compressionService.getStorageLimits();

  return (
    <div className={`relative ${className}`}>
      {/* Input oculto para selección de archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,.rar,application/zip,application/x-rar-compressed"
        onChange={(e) => {
          console.log('📁 Input file onChange triggered');
          handleFileSelect(e.target.files);
          // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
          e.target.value = '';
        }}
        className="hidden"
        style={{ display: 'none' }}
      />

      {/* Área de carga */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${isDragOver
            ? 'border-codestorm-accent bg-codestorm-accent/10'
            : 'border-gray-600 hover:border-codestorm-accent/50 hover:bg-codestorm-dark/50'
          }
          ${isProcessing ? 'pointer-events-none opacity-50' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={(e) => {
          console.log('🖱️ Click en área de carga detectado');
          e.preventDefault();
          e.stopPropagation();
          openFileSelector();
        }}
      >
        <div className="flex flex-col items-center space-y-4">
          {isProcessing ? (
            <Loader className="h-12 w-12 text-codestorm-accent animate-spin" />
          ) : (
            <FileArchive className={`h-12 w-12 ${isDragOver ? 'text-codestorm-accent' : 'text-gray-400'}`} />
          )}

          <div>
            <h3 className="text-lg font-medium text-white mb-2">
              {isProcessing ? 'Procesando archivo...' : 'Cargar archivo comprimido'}
            </h3>
            <p className="text-gray-400 text-sm">
              {isProcessing
                ? (progress?.message || 'Extrayendo archivos...')
                : 'Arrastra un archivo ZIP o RAR aquí, o haz clic para seleccionar'
              }
            </p>
          </div>

          {/* Barra de progreso */}
          {isProcessing && progress && (
            <div className="w-full max-w-md">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>{progress.stage}</span>
                <span>{progress.progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-codestorm-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              {progress.currentFile && (
                <div className="text-xs text-gray-500 mt-1 truncate">
                  {progress.currentFile}
                </div>
              )}
            </div>
          )}

          {/* Información de límites */}
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <HardDrive className="h-3 w-3" />
              <span>Límite: {limits.maxFileSizeMB}MB por archivo, {limits.maxStorageSizeMB}MB total</span>
            </div>
            <div>Formatos soportados: ZIP, RAR</div>
          </div>

          {/* Botón de prueba adicional */}
          {!isProcessing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('🔘 Botón de prueba clickeado');
                openFileSelector();
              }}
              className="mt-4 px-4 py-2 bg-codestorm-accent text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Seleccionar Archivo
            </button>
          )}
        </div>
      </div>

      {/* Modal de resultado */}
      {showResult && result && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-codestorm-dark rounded-lg p-6 max-w-md w-full mx-4 border border-codestorm-blue/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                Resultado de la extracción
              </h3>
              <button
                onClick={closeResult}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {result.success ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span>Extracción completada exitosamente</span>
                  </div>

                  <div className="bg-codestorm-darker rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Archivos extraídos:</span>
                      <span className="text-white">{result.extractedCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Tamaño total:</span>
                      <span className="text-white">{formatFileSize(result.totalSize)}</span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-400">
                    Los archivos han sido agregados al explorador de archivos.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <span>Error en la extracción</span>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{result.error}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={closeResult}
                  className="px-4 py-2 bg-codestorm-accent text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompressedFileUploader;
