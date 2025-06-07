import React from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileText,
  X
} from 'lucide-react';

interface FileModificationIndicatorProps {
  modifiedFiles: Set<string>;
  onClearModifications?: () => void;
  onViewFile?: (filePath: string) => void;
}

const FileModificationIndicator: React.FC<FileModificationIndicatorProps> = ({
  modifiedFiles,
  onClearModifications,
  onViewFile
}) => {
  if (modifiedFiles.size === 0) return null;

  const modifiedFilesArray = Array.from(modifiedFiles);

  return (
    <div className="fixed bottom-4 left-4 bg-codestorm-dark border border-green-500/30 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <h3 className="text-sm font-medium text-white">
            Archivos Modificados
          </h3>
        </div>
        {onClearModifications && (
          <button
            onClick={onClearModifications}
            className="p-1 text-gray-400 hover:text-white hover:bg-codestorm-blue/20 rounded transition-colors"
            title="Limpiar notificaciones"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {modifiedFilesArray.map((filePath, index) => (
          <div
            key={index}
            className="flex items-center space-x-2 text-xs text-gray-300 p-2 bg-codestorm-darker rounded cursor-pointer hover:bg-codestorm-blue/10 transition-colors"
            onClick={() => onViewFile?.(filePath)}
          >
            <FileText className="w-3 h-3 text-green-400 flex-shrink-0" />
            <span className="truncate flex-1" title={filePath}>
              {filePath.split('/').pop()}
            </span>
            <Clock className="w-3 h-3 text-gray-500 flex-shrink-0" />
          </div>
        ))}
      </div>
      
      <div className="mt-2 pt-2 border-t border-codestorm-blue/30">
        <p className="text-xs text-gray-400">
          {modifiedFiles.size} archivo{modifiedFiles.size !== 1 ? 's' : ''} modificado{modifiedFiles.size !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};

export default FileModificationIndicator;
