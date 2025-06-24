import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  GitCompare,
  Eye,
  Columns,
  RotateCcw,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Edit,
  ChevronUp,
  ChevronDown,
  Zap,
  Hash
} from 'lucide-react';

interface DiffLine {
  lineNumber: number;
  type: 'added' | 'removed' | 'unchanged' | 'modified';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

interface FileDiffViewerProps {
  originalContent: string;
  modifiedContent: string;
  fileName: string;
  onAcceptChanges?: () => void;
  onRejectChanges?: () => void;
  className?: string;
  showActions?: boolean;
}

interface VirtualizedDiffState {
  startLine: number;
  endLine: number;
  totalLines: number;
  scrollTop: number;
  containerHeight: number;
}

const DIFF_VIRTUALIZATION_THRESHOLD = 300; // Lines threshold for diff virtualization
const DIFF_LINE_HEIGHT = 24; // Height per diff line in pixels
const DIFF_VISIBLE_BUFFER = 30; // Extra lines to render above/below visible area
const LARGE_DIFF_PAGINATION_SIZE = 100; // Lines per page for very large diffs

const FileDiffViewer: React.FC<FileDiffViewerProps> = ({
  originalContent,
  modifiedContent,
  fileName,
  onAcceptChanges,
  onRejectChanges,
  className = '',
  showActions = true
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');
  const [currentPage, setCurrentPage] = useState(1);
  const [virtualizedState, setVirtualizedState] = useState<VirtualizedDiffState>({
    startLine: 0,
    endLine: 0,
    totalLines: 0,
    scrollTop: 0,
    containerHeight: 400
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const { diffLines, isLargeDiff, shouldVirtualize } = useMemo(() => {
    const originalLines = originalContent.split('\n');
    const modifiedLines = modifiedContent.split('\n');
    const lines: DiffLine[] = [];

    // Optimized diff algorithm for large files
    const maxLines = Math.max(originalLines.length, modifiedLines.length);
    const isLarge = maxLines > 1000;
    const shouldUseVirtualization = maxLines > DIFF_VIRTUALIZATION_THRESHOLD;

    // For very large files, use a more efficient diff algorithm
    if (isLarge) {
      // Batch process lines to avoid blocking the UI
      const batchSize = 100;
      for (let batch = 0; batch < Math.ceil(maxLines / batchSize); batch++) {
        const startIdx = batch * batchSize;
        const endIdx = Math.min(startIdx + batchSize, maxLines);

        for (let i = startIdx; i < endIdx; i++) {
          const originalLine = originalLines[i] || '';
          const modifiedLine = modifiedLines[i] || '';

          if (i >= originalLines.length) {
            lines.push({
              lineNumber: i + 1,
              type: 'added',
              content: modifiedLine,
              newLineNumber: i + 1
            });
          } else if (i >= modifiedLines.length) {
            lines.push({
              lineNumber: i + 1,
              type: 'removed',
              content: originalLine,
              oldLineNumber: i + 1
            });
          } else if (originalLine !== modifiedLine) {
            if (originalLine.trim() === '') {
              lines.push({
                lineNumber: i + 1,
                type: 'added',
                content: modifiedLine,
                newLineNumber: i + 1
              });
            } else if (modifiedLine.trim() === '') {
              lines.push({
                lineNumber: i + 1,
                type: 'removed',
                content: originalLine,
                oldLineNumber: i + 1
              });
            } else {
              lines.push({
                lineNumber: i + 1,
                type: 'modified',
                content: modifiedLine,
                oldLineNumber: i + 1,
                newLineNumber: i + 1
              });
            }
          } else {
            lines.push({
              lineNumber: i + 1,
              type: 'unchanged',
              content: originalLine,
              oldLineNumber: i + 1,
              newLineNumber: i + 1
            });
          }
        }
      }
    } else {
      // Standard diff for smaller files
      for (let i = 0; i < maxLines; i++) {
        const originalLine = originalLines[i] || '';
        const modifiedLine = modifiedLines[i] || '';

        if (i >= originalLines.length) {
          lines.push({
            lineNumber: i + 1,
            type: 'added',
            content: modifiedLine,
            newLineNumber: i + 1
          });
        } else if (i >= modifiedLines.length) {
          lines.push({
            lineNumber: i + 1,
            type: 'removed',
            content: originalLine,
            oldLineNumber: i + 1
          });
        } else if (originalLine !== modifiedLine) {
          if (originalLine.trim() === '') {
            lines.push({
              lineNumber: i + 1,
              type: 'added',
              content: modifiedLine,
              newLineNumber: i + 1
            });
          } else if (modifiedLine.trim() === '') {
            lines.push({
              lineNumber: i + 1,
              type: 'removed',
              content: originalLine,
              oldLineNumber: i + 1
            });
          } else {
            lines.push({
              lineNumber: i + 1,
              type: 'modified',
              content: modifiedLine,
              oldLineNumber: i + 1,
              newLineNumber: i + 1
            });
          }
        } else {
          lines.push({
            lineNumber: i + 1,
            type: 'unchanged',
            content: originalLine,
            oldLineNumber: i + 1,
            newLineNumber: i + 1
          });
        }
      }
    }

    return { diffLines: lines, isLargeDiff: isLarge, shouldVirtualize: shouldUseVirtualization };
  }, [originalContent, modifiedContent]);

  const stats = useMemo(() => {
    const added = diffLines.filter(line => line.type === 'added').length;
    const removed = diffLines.filter(line => line.type === 'removed').length;
    const modified = diffLines.filter(line => line.type === 'modified').length;
    const unchanged = diffLines.filter(line => line.type === 'unchanged').length;

    return { added, removed, modified, unchanged, total: diffLines.length };
  }, [diffLines]);

  // Virtualization setup
  useEffect(() => {
    if (shouldVirtualize && diffLines.length > 0) {
      const containerHeight = containerRef.current?.clientHeight || 400;
      const visibleLines = Math.floor(containerHeight / DIFF_LINE_HEIGHT);

      setVirtualizedState(prev => ({
        ...prev,
        totalLines: diffLines.length,
        containerHeight,
        endLine: Math.min(visibleLines + DIFF_VISIBLE_BUFFER, diffLines.length)
      }));
    }
  }, [diffLines, shouldVirtualize]);

  // Handle scroll for virtualization
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!shouldVirtualize) return;

    const scrollTop = e.currentTarget.scrollTop;
    const containerHeight = e.currentTarget.clientHeight;
    const visibleLines = Math.floor(containerHeight / DIFF_LINE_HEIGHT);

    const startLine = Math.max(0, Math.floor(scrollTop / DIFF_LINE_HEIGHT) - DIFF_VISIBLE_BUFFER);
    const endLine = Math.min(
      diffLines.length,
      startLine + visibleLines + (DIFF_VISIBLE_BUFFER * 2)
    );

    setVirtualizedState(prev => ({
      ...prev,
      startLine,
      endLine,
      scrollTop,
      containerHeight
    }));
  }, [shouldVirtualize, diffLines.length]);

  // Pagination for very large diffs
  const totalPages = Math.ceil(diffLines.length / LARGE_DIFF_PAGINATION_SIZE);
  const getPaginatedDiffLines = useCallback(() => {
    if (!isLargeDiff || shouldVirtualize) return diffLines;

    const startIndex = (currentPage - 1) * LARGE_DIFF_PAGINATION_SIZE;
    const endIndex = Math.min(startIndex + LARGE_DIFF_PAGINATION_SIZE, diffLines.length);
    return diffLines.slice(startIndex, endIndex);
  }, [diffLines, currentPage, isLargeDiff, shouldVirtualize]);

  const getLineIcon = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return <Plus className="w-3 h-3 text-green-400" />;
      case 'removed':
        return <Minus className="w-3 h-3 text-red-400" />;
      case 'modified':
        return <Edit className="w-3 h-3 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getLineClass = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return 'bg-green-900/30 border-l-2 border-green-500';
      case 'removed':
        return 'bg-red-900/30 border-l-2 border-red-500';
      case 'modified':
        return 'bg-yellow-900/30 border-l-2 border-yellow-500';
      default:
        return 'bg-transparent';
    }
  };

  const renderVirtualizedSideBySide = () => {
    const { startLine, endLine } = virtualizedState;
    const visibleDiffLines = diffLines.slice(startLine, endLine);
    const originalLines = originalContent.split('\n');
    const modifiedLines = modifiedContent.split('\n');

    return (
      <div
        ref={containerRef}
        className="grid grid-cols-2 gap-px bg-codestorm-blue/20 overflow-auto"
        style={{ height: '400px' }}
        onScroll={handleScroll}
      >
        {/* Original Content */}
        <div className="bg-codestorm-dark">
          <div className="p-2 bg-codestorm-blue/10 border-b border-codestorm-blue/30 sticky top-0 z-10">
            <h4 className="text-sm font-medium text-white flex items-center">
              <Minus className="w-4 h-4 mr-2 text-red-400" />
              Original
            </h4>
          </div>
          <div className="font-mono text-sm relative">
            {/* Virtual spacer above */}
            <div style={{ height: startLine * DIFF_LINE_HEIGHT }} />

            {visibleDiffLines.map((diffLine, index) => {
              const actualLineIndex = startLine + index;
              const originalLine = originalLines[diffLine.oldLineNumber ? diffLine.oldLineNumber - 1 : actualLineIndex] || '';
              const isChanged = diffLine.type !== 'unchanged';

              return (
                <div
                  key={`orig-${actualLineIndex}`}
                  className={`flex items-start px-2 py-1 ${
                    isChanged ? getLineClass(diffLine.type) : ''
                  }`}
                  style={{ height: DIFF_LINE_HEIGHT }}
                >
                  <span className="w-8 text-gray-500 text-xs mr-2 flex-shrink-0">
                    {diffLine.oldLineNumber || ''}
                  </span>
                  <span className="flex-1 text-gray-300 whitespace-pre-wrap">
                    {originalLine || ' '}
                  </span>
                  {isChanged && (
                    <span className="ml-2 flex-shrink-0">
                      {getLineIcon(diffLine.type)}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Virtual spacer below */}
            <div style={{ height: (diffLines.length - endLine) * DIFF_LINE_HEIGHT }} />
          </div>
        </div>

        {/* Modified Content */}
        <div className="bg-codestorm-dark">
          <div className="p-2 bg-codestorm-blue/10 border-b border-codestorm-blue/30 sticky top-0 z-10">
            <h4 className="text-sm font-medium text-white flex items-center">
              <Plus className="w-4 h-4 mr-2 text-green-400" />
              Modified
            </h4>
          </div>
          <div className="font-mono text-sm relative">
            {/* Virtual spacer above */}
            <div style={{ height: startLine * DIFF_LINE_HEIGHT }} />

            {visibleDiffLines.map((diffLine, index) => {
              const actualLineIndex = startLine + index;
              const modifiedLine = modifiedLines[diffLine.newLineNumber ? diffLine.newLineNumber - 1 : actualLineIndex] || '';
              const isChanged = diffLine.type !== 'unchanged';

              return (
                <div
                  key={`mod-${actualLineIndex}`}
                  className={`flex items-start px-2 py-1 ${
                    isChanged ? getLineClass(diffLine.type) : ''
                  }`}
                  style={{ height: DIFF_LINE_HEIGHT }}
                >
                  <span className="w-8 text-gray-500 text-xs mr-2 flex-shrink-0">
                    {diffLine.newLineNumber || ''}
                  </span>
                  <span className="flex-1 text-gray-300 whitespace-pre-wrap">
                    {modifiedLine || ' '}
                  </span>
                  {isChanged && (
                    <span className="ml-2 flex-shrink-0">
                      {getLineIcon(diffLine.type)}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Virtual spacer below */}
            <div style={{ height: (diffLines.length - endLine) * DIFF_LINE_HEIGHT }} />
          </div>
        </div>
      </div>
    );
  };

  const renderSideBySide = () => {
    if (shouldVirtualize) {
      return renderVirtualizedSideBySide();
    }

    const displayLines = isLargeDiff ? getPaginatedDiffLines() : diffLines;
    const originalLines = originalContent.split('\n');
    const modifiedLines = modifiedContent.split('\n');

    return (
      <div className="grid grid-cols-2 gap-px bg-codestorm-blue/20 max-h-96 overflow-auto">
        {/* Original Content */}
        <div className="bg-codestorm-dark">
          <div className="p-2 bg-codestorm-blue/10 border-b border-codestorm-blue/30">
            <h4 className="text-sm font-medium text-white flex items-center">
              <Minus className="w-4 h-4 mr-2 text-red-400" />
              Original
            </h4>
          </div>
          <div className="font-mono text-sm">
            {displayLines.map((diffLine, index) => {
              const originalLine = originalLines[diffLine.oldLineNumber ? diffLine.oldLineNumber - 1 : index] || '';
              const isChanged = diffLine.type !== 'unchanged';

              return (
                <div
                  key={`orig-${index}`}
                  className={`flex items-start px-2 py-1 ${
                    isChanged ? getLineClass(diffLine.type) : ''
                  }`}
                >
                  <span className="w-8 text-gray-500 text-xs mr-2 flex-shrink-0">
                    {diffLine.oldLineNumber || ''}
                  </span>
                  <span className="flex-1 text-gray-300 whitespace-pre-wrap">
                    {originalLine || ' '}
                  </span>
                  {isChanged && (
                    <span className="ml-2 flex-shrink-0">
                      {getLineIcon(diffLine.type)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modified Content */}
        <div className="bg-codestorm-dark">
          <div className="p-2 bg-codestorm-blue/10 border-b border-codestorm-blue/30">
            <h4 className="text-sm font-medium text-white flex items-center">
              <Plus className="w-4 h-4 mr-2 text-green-400" />
              Modified
            </h4>
          </div>
          <div className="font-mono text-sm">
            {displayLines.map((diffLine, index) => {
              const modifiedLine = modifiedLines[diffLine.newLineNumber ? diffLine.newLineNumber - 1 : index] || '';
              const isChanged = diffLine.type !== 'unchanged';

              return (
                <div
                  key={`mod-${index}`}
                  className={`flex items-start px-2 py-1 ${
                    isChanged ? getLineClass(diffLine.type) : ''
                  }`}
                >
                  <span className="w-8 text-gray-500 text-xs mr-2 flex-shrink-0">
                    {diffLine.newLineNumber || ''}
                  </span>
                  <span className="flex-1 text-gray-300 whitespace-pre-wrap">
                    {modifiedLine || ' '}
                  </span>
                  {isChanged && (
                    <span className="ml-2 flex-shrink-0">
                      {getLineIcon(diffLine.type)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderUnified = () => {
    const displayLines = shouldVirtualize ? diffLines.slice(virtualizedState.startLine, virtualizedState.endLine) :
                        isLargeDiff ? getPaginatedDiffLines() : diffLines;

    if (shouldVirtualize) {
      return (
        <div
          ref={containerRef}
          className="bg-codestorm-dark font-mono text-sm overflow-auto"
          style={{ height: '400px' }}
          onScroll={handleScroll}
        >
          {/* Virtual spacer above */}
          <div style={{ height: virtualizedState.startLine * DIFF_LINE_HEIGHT }} />

          {displayLines.map((line, index) => {
            const actualIndex = virtualizedState.startLine + index;
            return (
              <div
                key={actualIndex}
                className={`flex items-start px-2 py-1 ${getLineClass(line.type)}`}
                style={{ height: DIFF_LINE_HEIGHT }}
              >
                <span className="w-8 text-gray-500 text-xs mr-2 flex-shrink-0">
                  {line.type === 'removed' ? line.oldLineNumber : line.newLineNumber}
                </span>
                <span className="w-4 mr-2 flex-shrink-0">
                  {getLineIcon(line.type)}
                </span>
                <span className="flex-1 text-gray-300 whitespace-pre-wrap">
                  {line.content || ' '}
                </span>
              </div>
            );
          })}

          {/* Virtual spacer below */}
          <div style={{ height: (diffLines.length - virtualizedState.endLine) * DIFF_LINE_HEIGHT }} />
        </div>
      );
    }

    return (
      <div className="bg-codestorm-dark font-mono text-sm max-h-96 overflow-auto">
        {displayLines.map((line, index) => (
          <div
            key={index}
            className={`flex items-start px-2 py-1 ${getLineClass(line.type)}`}
          >
            <span className="w-8 text-gray-500 text-xs mr-2 flex-shrink-0">
              {line.type === 'removed' ? line.oldLineNumber : line.newLineNumber}
            </span>
            <span className="w-4 mr-2 flex-shrink-0">
              {getLineIcon(line.type)}
            </span>
            <span className="flex-1 text-gray-300 whitespace-pre-wrap">
              {line.content || ' '}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (originalContent === modifiedContent) {
    return (
      <div className={`bg-codestorm-dark rounded-lg border border-codestorm-blue/30 ${className}`}>
        <div className="p-6 text-center text-gray-400">
          <GitCompare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No changes detected</p>
          <p className="text-sm mt-1">The file content is identical</p>
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
            <GitCompare className="w-5 h-5 text-codestorm-accent" />
            <div>
              <h3 className="text-white font-medium">File Diff</h3>
              <p className="text-xs text-gray-400">{fileName}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex bg-codestorm-darker rounded-md p-1">
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  viewMode === 'side-by-side'
                    ? 'bg-codestorm-accent text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Side by side view"
              >
                <Columns className="w-3 h-3" />
              </button>
              <button
                onClick={() => setViewMode('unified')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  viewMode === 'unified'
                    ? 'bg-codestorm-accent text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Unified view"
              >
                <Eye className="w-3 h-3" />
              </button>
            </div>

            {/* Action Buttons */}
            {showActions && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onAcceptChanges}
                  className="px-3 py-1 bg-green-600/20 text-green-400 border border-green-600/30 rounded text-sm hover:bg-green-600/30 transition-colors flex items-center"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Accept
                </button>
                <button
                  onClick={onRejectChanges}
                  className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded text-sm hover:bg-red-600/30 transition-colors flex items-center"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats and Large File Indicators */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <span className="flex items-center">
              <Plus className="w-3 h-3 mr-1 text-green-400" />
              {stats.added} added
            </span>
            <span className="flex items-center">
              <Minus className="w-3 h-3 mr-1 text-red-400" />
              {stats.removed} removed
            </span>
            <span className="flex items-center">
              <Edit className="w-3 h-3 mr-1 text-yellow-400" />
              {stats.modified} modified
            </span>
            <span>{stats.unchanged} unchanged</span>
            {isLargeDiff && (
              <span className="text-yellow-400 font-medium flex items-center">
                <Hash className="w-3 h-3 mr-1" />
                Large Diff ({stats.total} lines)
              </span>
            )}
            {shouldVirtualize && (
              <span className="text-blue-400 font-medium flex items-center">
                <Zap className="w-3 h-3 mr-1" />
                Virtualized
              </span>
            )}
          </div>

          {/* Pagination Controls for Large Diffs */}
          {isLargeDiff && !shouldVirtualize && totalPages > 1 && (
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

      {/* Diff Content */}
      <div className="max-h-96 overflow-auto custom-scrollbar">
        {viewMode === 'side-by-side' ? renderSideBySide() : renderUnified()}
      </div>
    </div>
  );
};

export default FileDiffViewer;
