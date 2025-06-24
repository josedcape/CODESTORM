import React, { useState, useCallback, useRef } from 'react';
import {
  Upload,
  File,
  AlertCircle,
  CheckCircle,
  Loader,
  X,
  Archive,
  FolderOpen,
  FileText,
  Code,
  Settings,
  FileImage
} from 'lucide-react';
import {
  FileDecompressionService,
  DecompressionProgress,
  DecompressionResult
} from '../../services/FileDecompressionService';

interface FileUploadZoneProps {
  onFilesExtracted: (result: DecompressionResult) => void;
  onError: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

interface UploadState {
  isDragOver: boolean;
  isProcessing: boolean;
  progress: DecompressionProgress | null;
  error: string | null;
  success: boolean;
  detectedFileType: 'archive' | 'individual' | null;
  validationWarning: string | null;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesExtracted,
  onError,
  className = '',
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    isDragOver: false,
    isProcessing: false,
    progress: null,
    error: null,
    success: false,
    detectedFileType: null,
    validationWarning: null
  });

  const resetState = useCallback(() => {
    setUploadState({
      isDragOver: false,
      isProcessing: false,
      progress: null,
      error: null,
      success: false,
      detectedFileType: null,
      validationWarning: null
    });
  }, []);

  const handleProgress = useCallback((progress: DecompressionProgress) => {
    setUploadState(prev => ({ ...prev, progress }));
  }, []);

  const processFile = useCallback(async (file: File) => {
    resetState();

    try {
      // Validate file and detect type
      const validation = FileDecompressionService.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const fileType = validation.fileType!;
      setUploadState(prev => ({
        ...prev,
        isProcessing: true,
        detectedFileType: fileType
      }));

      // Process file (archive or individual)
      const result = await FileDecompressionService.processFile(file, handleProgress);

      if (result.success) {
        setUploadState(prev => ({
          ...prev,
          success: true,
          isProcessing: false
        }));
        onFilesExtracted(result);

        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setUploadState(prev => ({ ...prev, success: false }));
        }, 3000);
      } else {
        throw new Error(result.error || 'Failed to process file');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadState(prev => ({
        ...prev,
        error: errorMessage,
        isProcessing: false,
        detectedFileType: null
      }));
      onError(errorMessage);
    }
  }, [handleProgress, onFilesExtracted, onError, resetState]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;

    const file = files[0];
    processFile(file);
  }, [processFile, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      // Detect file type on drag over
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        const fileType = FileDecompressionService.getFileType(file);
        setUploadState(prev => ({
          ...prev,
          isDragOver: true,
          detectedFileType: fileType === 'unsupported' ? null : fileType
        }));
      } else {
        setUploadState(prev => ({ ...prev, isDragOver: true }));
      }
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadState(prev => ({ ...prev, isDragOver: false }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadState(prev => ({ ...prev, isDragOver: false }));

    if (disabled) return;

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [handleFileSelect, disabled]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input value to allow re-uploading the same file
    e.target.value = '';
  }, [handleFileSelect]);

  const dismissError = useCallback(() => {
    setUploadState(prev => ({ ...prev, error: null }));
  }, []);

  const getProgressColor = () => {
    if (!uploadState.progress) return 'bg-blue-500';

    switch (uploadState.progress.stage) {
      case 'reading': return 'bg-blue-500';
      case 'extracting': return 'bg-yellow-500';
      case 'processing': return 'bg-green-500';
      case 'complete': return 'bg-green-600';
      default: return 'bg-blue-500';
    }
  };

  const getStageIcon = () => {
    if (!uploadState.progress) return <Upload className="w-5 h-5" />;

    switch (uploadState.progress.stage) {
      case 'reading': return <File className="w-5 h-5" />;
      case 'extracting': return <Archive className="w-5 h-5" />;
      case 'processing': return <FolderOpen className="w-5 h-5" />;
      case 'complete': return <CheckCircle className="w-5 h-5" />;
      default: return <Upload className="w-5 h-5" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Upload Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer
          ${uploadState.isDragOver
            ? 'border-codestorm-accent bg-codestorm-accent/10'
            : 'border-codestorm-blue/30 hover:border-codestorm-blue/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${uploadState.isProcessing ? 'pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,.jar,.war,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.php,.rb,.go,.rs,.swift,.kt,.html,.htm,.css,.scss,.sass,.json,.xml,.yaml,.yml,.md,.txt,.log,.sh,.bat,.ps1,.env,.config,.ini,.vue,.svelte"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Processing State */}
        {uploadState.isProcessing && uploadState.progress && (
          <div className="space-y-4">
            <div className="flex items-center justify-center text-codestorm-accent">
              <Loader className="w-8 h-8 animate-spin mr-3" />
              {getStageIcon()}
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white">
                {uploadState.progress.message}
              </h3>

              {uploadState.progress.currentFile && (
                <p className="text-sm text-gray-400 truncate">
                  {uploadState.progress.currentFile}
                </p>
              )}

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                  style={{ width: `${uploadState.progress.progress}%` }}
                />
              </div>

              <p className="text-xs text-gray-500">
                {Math.round(uploadState.progress.progress)}% complete
              </p>
            </div>
          </div>
        )}

        {/* Success State */}
        {uploadState.success && !uploadState.isProcessing && (
          <div className="space-y-3">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-medium text-white">Files Extracted Successfully!</h3>
            <p className="text-sm text-gray-400">
              Your project files are now ready for editing
            </p>
          </div>
        )}

        {/* Default State */}
        {!uploadState.isProcessing && !uploadState.success && !uploadState.error && (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4 text-codestorm-accent">
              {uploadState.detectedFileType === 'individual' ? (
                <FileText className="w-12 h-12" />
              ) : uploadState.detectedFileType === 'archive' ? (
                <Archive className="w-12 h-12" />
              ) : (
                <>
                  <Archive className="w-8 h-8" />
                  <Upload className="w-12 h-12" />
                  <FileText className="w-8 h-8" />
                </>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium text-white">
                {uploadState.detectedFileType === 'individual'
                  ? 'Upload Individual File'
                  : uploadState.detectedFileType === 'archive'
                  ? 'Upload Project Archive'
                  : 'Upload Files or Archives'
                }
              </h3>
              <p className="text-gray-400">
                {uploadState.detectedFileType === 'individual'
                  ? 'Drop a code file here, or click to browse'
                  : uploadState.detectedFileType === 'archive'
                  ? 'Drop a ZIP archive here, or click to browse'
                  : 'Drag and drop ZIP archives or individual code files here, or click to browse'
                }
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                {uploadState.detectedFileType === 'individual' ? (
                  <>
                    <span className="flex items-center">
                      <Code className="w-3 h-3 mr-1" />
                      Code files
                    </span>
                    <span>Max 10MB</span>
                  </>
                ) : uploadState.detectedFileType === 'archive' ? (
                  <>
                    <span className="flex items-center">
                      <Archive className="w-3 h-3 mr-1" />
                      ZIP archives
                    </span>
                    <span>Max 200MB</span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center">
                      <Archive className="w-3 h-3 mr-1" />
                      Archives
                    </span>
                    <span className="flex items-center">
                      <Code className="w-3 h-3 mr-1" />
                      Code files
                    </span>
                    <span>Max 200MB/10MB</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {uploadState.error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-red-400 font-medium">Upload Failed</h4>
                <p className="text-red-300 text-sm mt-1">{uploadState.error}</p>
              </div>
            </div>
            <button
              onClick={dismissError}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Supported Formats Info */}
      {!uploadState.isProcessing && !uploadState.success && !uploadState.error && (
        <div className="mt-4 space-y-3">
          {/* Archive Formats */}
          <div className="p-3 bg-codestorm-blue/10 border border-codestorm-blue/30 rounded-lg">
            <div className="flex items-start">
              <Archive className="w-4 h-4 text-codestorm-accent mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-400">
                <p className="font-medium text-white mb-1">Archive Formats:</p>
                <ul className="space-y-1">
                  <li>• ZIP archives (.zip)</li>
                  <li>• Java archives (.jar, .war)</li>
                  <li>• Maximum archive size: 200MB</li>
                  <li>• Automatic extraction and file tree generation</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Individual File Formats */}
          <div className="p-3 bg-green-900/10 border border-green-600/30 rounded-lg">
            <div className="flex items-start">
              <FileText className="w-4 h-4 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-400">
                <p className="font-medium text-white mb-1">Individual File Formats:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="font-medium text-green-400 mb-1">Code Files:</p>
                    <ul className="space-y-0.5">
                      <li>• JavaScript (.js, .jsx)</li>
                      <li>• TypeScript (.ts, .tsx)</li>
                      <li>• Python (.py)</li>
                      <li>• Java (.java)</li>
                      <li>• C/C++ (.c, .cpp)</li>
                      <li>• C# (.cs)</li>
                      <li>• PHP (.php)</li>
                      <li>• Ruby (.rb)</li>
                      <li>• Go (.go)</li>
                      <li>• Rust (.rs)</li>
                      <li>• Swift (.swift)</li>
                      <li>• Kotlin (.kt)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-green-400 mb-1">Web & Config:</p>
                    <ul className="space-y-0.5">
                      <li>• HTML (.html, .htm)</li>
                      <li>• CSS (.css, .scss, .sass)</li>
                      <li>• Vue (.vue)</li>
                      <li>• Svelte (.svelte)</li>
                      <li>• JSON (.json)</li>
                      <li>• XML (.xml)</li>
                      <li>• YAML (.yaml, .yml)</li>
                      <li>• Markdown (.md)</li>
                      <li>• Text (.txt)</li>
                      <li>• Config (.env, .config, .ini)</li>
                      <li>• Scripts (.sh, .bat, .ps1)</li>
                      <li>• Logs (.log)</li>
                    </ul>
                  </div>
                </div>
                <p className="mt-2 text-yellow-400">• Maximum individual file size: 10MB (up to 2000 lines)</p>
                <p className="text-blue-400">• Large files automatically use optimized rendering</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;
