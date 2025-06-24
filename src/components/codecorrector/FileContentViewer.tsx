import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  File,
  Download,
  Copy,
  Eye,
  Code,
  Image,
  FileText,
  AlertCircle,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  Hash,
  Zap
} from 'lucide-react';
import { FileNode, FileDecompressionService } from '../../services/FileDecompressionService';

interface FileContentViewerProps {
  file: FileNode | null;
  className?: string;
  onContentChange?: (content: string) => void;
  readOnly?: boolean;
  showLineNumbers?: boolean;
}

interface VirtualizedViewState {
  startLine: number;
  endLine: number;
  totalLines: number;
  lineHeight: number;
  containerHeight: number;
  scrollTop: number;
}

const VIRTUALIZATION_THRESHOLD = 500; // Lines threshold for virtualization
const LINE_HEIGHT = 20; // Height per line in pixels
const VISIBLE_BUFFER = 50; // Extra lines to render above/below visible area

const FileContentViewer: React.FC<FileContentViewerProps> = ({
  file,
  className = '',
  onContentChange,
  readOnly = true,
  showLineNumbers = true
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'code' | 'raw' | 'preview'>('code');
  const [virtualizedView, setVirtualizedView] = useState<VirtualizedViewState>({
    startLine: 0,
    endLine: 0,
    totalLines: 0,
    lineHeight: LINE_HEIGHT,
    containerHeight: 400,
    scrollTop: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [linesPerPage] = useState(100);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { fileContent, fileLines, isLargeFile, shouldVirtualize } = useMemo(() => {
    if (!file || !file.content) {
      return { fileContent: '', fileLines: [], isLargeFile: false, shouldVirtualize: false };
    }

    let content = '';
    if (typeof file.content === 'string') {
      content = file.content;
    } else if (file.content instanceof ArrayBuffer) {
      try {
        content = new TextDecoder('utf-8').decode(file.content);
      } catch {
        content = '[Binary file - cannot display as text]';
      }
    }

    const lines = content.split('\n');
    const lineCount = lines.length;
    const isLarge = FileDecompressionService.isLargeFile(content);
    const shouldUseVirtualization = lineCount > VIRTUALIZATION_THRESHOLD;

    return {
      fileContent: content,
      fileLines: lines,
      isLargeFile: isLarge,
      shouldVirtualize: shouldUseVirtualization
    };
  }, [file]);

  // Update virtualized view when file changes
  useEffect(() => {
    if (shouldVirtualize && fileLines.length > 0) {
      const containerHeight = containerRef.current?.clientHeight || 400;
      const visibleLines = Math.floor(containerHeight / LINE_HEIGHT);

      setVirtualizedView(prev => ({
        ...prev,
        totalLines: fileLines.length,
        containerHeight,
        endLine: Math.min(visibleLines + VISIBLE_BUFFER, fileLines.length)
      }));
    }
  }, [fileLines, shouldVirtualize]);

  // Handle scroll for virtualization
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!shouldVirtualize) return;

    const scrollTop = e.currentTarget.scrollTop;
    const containerHeight = e.currentTarget.clientHeight;
    const visibleLines = Math.floor(containerHeight / LINE_HEIGHT);

    const startLine = Math.max(0, Math.floor(scrollTop / LINE_HEIGHT) - VISIBLE_BUFFER);
    const endLine = Math.min(
      fileLines.length,
      startLine + visibleLines + (VISIBLE_BUFFER * 2)
    );

    setVirtualizedView(prev => ({
      ...prev,
      startLine,
      endLine,
      scrollTop,
      containerHeight
    }));
  }, [shouldVirtualize, fileLines.length]);

  const languageMap: Record<string, string> = {
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.html': 'html',
    '.htm': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.sass': 'sass',
    '.json': 'json',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.md': 'markdown',
    '.py': 'python',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cs': 'csharp',
    '.php': 'php',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.sql': 'sql',
    '.sh': 'bash',
    '.bat': 'batch',
    '.ps1': 'powershell',
    '.dockerfile': 'dockerfile',
    '.gitignore': 'gitignore',
    '.env': 'bash',
    '.config': 'json',
    '.ini': 'ini',
    '.properties': 'properties',
    '.log': 'log'
  };

  const getLanguage = (extension?: string): string => {
    if (!extension) return 'text';
    return languageMap[extension.toLowerCase()] || 'text';
  };

  const isTextFile = (extension?: string): boolean => {
    if (!extension) return false;
    return Object.keys(languageMap).includes(extension.toLowerCase()) ||
           ['.txt', '.log', '.md'].includes(extension.toLowerCase());
  };

  const isImageFile = (extension?: string): boolean => {
    if (!extension) return false;
    return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].includes(extension.toLowerCase());
  };

  const handleCopy = async () => {
    if (!fileContent) return;

    try {
      await navigator.clipboard.writeText(fileContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  };

  const handleDownload = () => {
    if (!file || !fileContent) return;

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileIcon = () => {
    if (!file) return <File className="w-5 h-5" />;

    if (isImageFile(file.extension)) {
      return <Image className="w-5 h-5 text-purple-400" />;
    } else if (isTextFile(file.extension)) {
      return <Code className="w-5 h-5 text-blue-400" />;
    } else {
      return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  // Pagination logic for very large files
  const getPaginatedContent = useCallback(() => {
    if (!shouldVirtualize || fileLines.length <= VIRTUALIZATION_THRESHOLD) {
      return fileContent;
    }

    const startIndex = (currentPage - 1) * linesPerPage;
    const endIndex = Math.min(startIndex + linesPerPage, fileLines.length);
    return fileLines.slice(startIndex, endIndex).join('\n');
  }, [fileLines, currentPage, linesPerPage, shouldVirtualize, fileContent]);

  const totalPages = Math.ceil(fileLines.length / linesPerPage);

  // Render virtualized content for large files
  const renderVirtualizedContent = () => {
    const { startLine, endLine, totalLines, scrollTop } = virtualizedView;
    const visibleLines = fileLines.slice(startLine, endLine);

    return (
      <div
        ref={containerRef}
        className="relative overflow-auto h-96"
        onScroll={handleScroll}
        style={{ height: '400px' }}
      >
        {/* Virtual spacer for content above visible area */}
        <div style={{ height: startLine * LINE_HEIGHT }} />

        {/* Visible content */}
        <div ref={contentRef}>
          {visibleLines.map((line, index) => {
            const lineNumber = startLine + index + 1;
            return (
              <div
                key={lineNumber}
                className="flex text-sm font-mono"
                style={{ height: LINE_HEIGHT }}
              >
                {showLineNumbers && (
                  <div className="w-16 text-gray-500 text-right pr-4 flex-shrink-0 select-none">
                    {lineNumber}
                  </div>
                )}
                <div className="flex-1 text-gray-300 whitespace-pre-wrap">
                  {line || ' '}
                </div>
              </div>
            );
          })}
        </div>

        {/* Virtual spacer for content below visible area */}
        <div style={{ height: (totalLines - endLine) * LINE_HEIGHT }} />
      </div>
    );
  };

  const renderContent = () => {
    if (!file) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <File className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Select a file to view its contents</p>
          </div>
        </div>
      );
    }

    if (!fileContent || fileContent === '[Binary file - cannot display as text]') {
      return (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
            <p className="font-medium">Cannot display file content</p>
            <p className="text-sm mt-1">
              {file.content instanceof ArrayBuffer ? 'Binary file' : 'Empty or corrupted file'}
            </p>
          </div>
        </div>
      );
    }

    if (isImageFile(file.extension) && viewMode === 'preview') {
      return (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <Image className="w-12 h-12 mx-auto mb-3 text-purple-400" />
            <p>Image preview not available</p>
            <p className="text-sm mt-1">Switch to raw view to see file data</p>
          </div>
        </div>
      );
    }

    if (viewMode === 'raw') {
      if (shouldVirtualize) {
        return renderVirtualizedContent();
      }
      return (
        <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono p-4 overflow-auto max-h-96">
          {fileContent}
        </pre>
      );
    }

    // Code view with optimized rendering for large files
    if (shouldVirtualize) {
      return renderVirtualizedContent();
    }

    // Standard rendering for smaller files
    const language = getLanguage(file.extension);
    const displayContent = isLargeFile ? getPaginatedContent() : fileContent;

    return (
      <div className="overflow-auto max-h-96">
        <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono p-4 bg-gray-900 rounded">
          <code className={`language-${language}`}>
            {displayContent}
          </code>
        </pre>
      </div>
    );
  };

  if (!file) {
    return (
      <div className={`bg-codestorm-dark rounded-lg border border-codestorm-blue/30 ${className}`}>
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-codestorm-dark rounded-lg border border-codestorm-blue/30 ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-codestorm-blue/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getFileIcon()}
            <div>
              <h3 className="text-white font-medium">{file.name}</h3>
              <p className="text-xs text-gray-400">{file.path}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggles */}
            {isTextFile(file.extension) && (
              <div className="flex bg-codestorm-darker rounded-md p-1">
                <button
                  onClick={() => setViewMode('code')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    viewMode === 'code'
                      ? 'bg-codestorm-accent text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Code className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    viewMode === 'raw'
                      ? 'bg-codestorm-accent text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                </button>
                {isImageFile(file.extension) && (
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      viewMode === 'preview'
                        ? 'bg-codestorm-accent text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <button
              onClick={handleCopy}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded transition-colors"
              title="Copy content"
            >
              {copySuccess ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={handleDownload}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* File Info */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            {file.extension && (
              <span>Type: {file.extension.toUpperCase()}</span>
            )}
            {file.size !== undefined && (
              <span>Size: {(file.size / 1024).toFixed(1)} KB</span>
            )}
            {fileContent && (
              <span className={isLargeFile ? 'text-yellow-400 font-medium' : ''}>
                Lines: {fileLines.length}
                {isLargeFile && ' (Large File)'}
              </span>
            )}
            <span>Language: {getLanguage(file.extension)}</span>
            {shouldVirtualize && (
              <span className="text-blue-400 font-medium flex items-center">
                <Zap className="w-3 h-3 mr-1" />
                Virtualized
              </span>
            )}
          </div>

          {/* Pagination Controls for Large Files */}
          {isLargeFile && !shouldVirtualize && totalPages > 1 && (
            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <span className="text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-auto custom-scrollbar">
        {renderContent()}
      </div>
    </div>
  );
};

export default FileContentViewer;
