import React, { useState, useMemo } from 'react';
import { FileItem } from '../../types';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Maximize2, 
  Minimize2,
  FileText,
  GitCompare,
  RotateCcw
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface FileComparisonPanelProps {
  originalFiles: FileItem[];
  modifiedFiles: FileItem[];
  isVisible: boolean;
  onClose: () => void;
  onFileSelect?: (originalFile: FileItem, modifiedFile: FileItem) => void;
}

interface FileDiff {
  lineNumber: number;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  originalContent?: string;
  modifiedContent?: string;
}

const FileComparisonPanel: React.FC<FileComparisonPanelProps> = ({
  originalFiles,
  modifiedFiles,
  isVisible,
  onClose,
  onFileSelect
}) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [syncScroll, setSyncScroll] = useState(true);

  // Calculate file differences
  const fileDiffs = useMemo(() => {
    return modifiedFiles.map((modifiedFile, index) => {
      const originalFile = originalFiles[index];
      if (!originalFile) return [];

      const originalLines = originalFile.content.split('\n');
      const modifiedLines = modifiedFile.content.split('\n');
      const diffs: FileDiff[] = [];

      const maxLines = Math.max(originalLines.length, modifiedLines.length);

      for (let i = 0; i < maxLines; i++) {
        const originalLine = originalLines[i] || '';
        const modifiedLine = modifiedLines[i] || '';

        if (originalLine === modifiedLine) {
          diffs.push({
            lineNumber: i + 1,
            type: 'unchanged',
            originalContent: originalLine,
            modifiedContent: modifiedLine
          });
        } else if (!originalLine && modifiedLine) {
          diffs.push({
            lineNumber: i + 1,
            type: 'added',
            modifiedContent: modifiedLine
          });
        } else if (originalLine && !modifiedLine) {
          diffs.push({
            lineNumber: i + 1,
            type: 'removed',
            originalContent: originalLine
          });
        } else {
          diffs.push({
            lineNumber: i + 1,
            type: 'modified',
            originalContent: originalLine,
            modifiedContent: modifiedLine
          });
        }
      }

      return diffs;
    });
  }, [originalFiles, modifiedFiles]);

  const currentOriginalFile = originalFiles[selectedFileIndex];
  const currentModifiedFile = modifiedFiles[selectedFileIndex];
  const currentDiffs = fileDiffs[selectedFileIndex] || [];

  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c'
    };
    return languageMap[ext || ''] || 'text';
  };

  const renderDiffLine = (diff: FileDiff, side: 'original' | 'modified') => {
    const content = side === 'original' ? diff.originalContent : diff.modifiedContent;
    const lineClass = `
      px-4 py-1 text-sm font-mono leading-relaxed border-l-4 
      ${diff.type === 'added' && side === 'modified' ? 'bg-green-900/30 border-green-500' : ''}
      ${diff.type === 'removed' && side === 'original' ? 'bg-red-900/30 border-red-500' : ''}
      ${diff.type === 'modified' ? 'bg-yellow-900/30 border-yellow-500' : ''}
      ${diff.type === 'unchanged' ? 'bg-transparent border-transparent' : ''}
    `;

    return (
      <div key={`${side}-${diff.lineNumber}`} className={lineClass}>
        <div className="flex">
          {showLineNumbers && (
            <span className="w-12 text-gray-500 text-right mr-4 select-none">
              {content !== undefined ? diff.lineNumber : ''}
            </span>
          )}
          <span className="flex-1 whitespace-pre-wrap break-all">
            {content || (side === 'original' && diff.type === 'added' ? '' : content)}
          </span>
        </div>
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm ${isExpanded ? '' : 'p-4'}`}>
      <div className={`bg-codestorm-darker border border-codestorm-blue/30 rounded-lg shadow-2xl ${
        isExpanded ? 'w-full h-full' : 'w-full h-full max-w-7xl max-h-[90vh] mx-auto mt-4'
      } flex flex-col`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-codestorm-blue/30">
          <div className="flex items-center space-x-4">
            <GitCompare className="w-6 h-6 text-codestorm-accent" />
            <h2 className="text-xl font-bold text-white">Comparación de Archivos</h2>
            <span className="text-sm text-gray-400">
              {modifiedFiles.length} archivo{modifiedFiles.length !== 1 ? 's' : ''} modificado{modifiedFiles.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              className="p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded-md transition-colors"
              title={showLineNumbers ? 'Ocultar números de línea' : 'Mostrar números de línea'}
            >
              {showLineNumbers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded-md transition-colors"
              title={isExpanded ? 'Minimizar' : 'Maximizar'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-md transition-colors"
              title="Cerrar comparación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* File Navigation */}
        {modifiedFiles.length > 1 && (
          <div className="flex items-center justify-between p-3 bg-codestorm-dark border-b border-codestorm-blue/20">
            <button
              onClick={() => setSelectedFileIndex(Math.max(0, selectedFileIndex - 1))}
              disabled={selectedFileIndex === 0}
              className="flex items-center space-x-2 px-3 py-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-codestorm-accent" />
              <span className="text-white font-medium">
                {currentModifiedFile?.name || 'Archivo'}
              </span>
              <span className="text-gray-400">
                ({selectedFileIndex + 1} de {modifiedFiles.length})
              </span>
            </div>
            
            <button
              onClick={() => setSelectedFileIndex(Math.min(modifiedFiles.length - 1, selectedFileIndex + 1))}
              disabled={selectedFileIndex === modifiedFiles.length - 1}
              className="flex items-center space-x-2 px-3 py-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Comparison Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Original File Panel */}
          <div className="flex-1 flex flex-col border-r border-codestorm-blue/30">
            <div className="flex items-center justify-between p-3 bg-codestorm-dark border-b border-codestorm-blue/20">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-red-400" />
                <span className="text-white font-medium">Original</span>
              </div>
              <span className="text-xs text-gray-400">
                {currentOriginalFile?.content.split('\n').length || 0} líneas
              </span>
            </div>
            <div className="flex-1 overflow-auto bg-codestorm-darker">
              {currentDiffs.map((diff) => renderDiffLine(diff, 'original'))}
            </div>
          </div>

          {/* Modified File Panel */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between p-3 bg-codestorm-dark border-b border-codestorm-blue/20">
              <div className="flex items-center space-x-2">
                <GitCompare className="w-4 h-4 text-green-400" />
                <span className="text-white font-medium">Modificado</span>
              </div>
              <span className="text-xs text-gray-400">
                {currentModifiedFile?.content.split('\n').length || 0} líneas
              </span>
            </div>
            <div className="flex-1 overflow-auto bg-codestorm-darker">
              {currentDiffs.map((diff) => renderDiffLine(diff, 'modified'))}
            </div>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="p-3 bg-codestorm-dark border-t border-codestorm-blue/20">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">
                  {currentDiffs.filter(d => d.type === 'added').length} líneas agregadas
                </span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-300">
                  {currentDiffs.filter(d => d.type === 'removed').length} líneas eliminadas
                </span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-300">
                  {currentDiffs.filter(d => d.type === 'modified').length} líneas modificadas
                </span>
              </span>
            </div>
            <span className="text-gray-400">
              Archivo: {getLanguage(currentModifiedFile?.name || '')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileComparisonPanel;
