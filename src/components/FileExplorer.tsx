import React, { useState } from 'react';
import { FileItem } from '../types';
import { FolderOpen, File, ChevronRight, ChevronDown } from 'lucide-react';

interface FileExplorerProps {
  files: FileItem[];
  onSelectFile: (fileId: string) => void;
  selectedFileId: string | null;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ 
  files, 
  onSelectFile, 
  selectedFileId 
}) => {
  const [expanded, setExpanded] = useState(true);

  // Group files by directory
  const fileStructure: Record<string, FileItem[]> = {};
  
  files.forEach(file => {
    const directory = file.path.split('/').slice(0, -1).join('/') || '/';
    if (!fileStructure[directory]) {
      fileStructure[directory] = [];
    }
    fileStructure[directory].push(file);
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full">
      <div 
        className="flex items-center justify-between mb-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h2 className="text-lg font-semibold flex items-center">
          <FolderOpen className="h-5 w-5 mr-2 text-indigo-600" />
          Files
        </h2>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </div>
      
      {expanded && (
        <div className="space-y-1">
          {Object.entries(fileStructure).map(([directory, dirFiles]) => (
            <div key={directory} className="ml-2">
              <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <FolderOpen className="h-4 w-4 mr-1 text-yellow-500" />
                <span>{directory === '/' ? 'Root' : directory}</span>
              </div>
              <ul className="ml-4 space-y-1">
                {dirFiles.map(file => (
                  <li 
                    key={file.id}
                    className={`flex items-center text-sm py-1 px-2 rounded-md cursor-pointer ${
                      selectedFileId === file.id 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => onSelectFile(file.id)}
                  >
                    <File className="h-4 w-4 mr-1 text-gray-500" />
                    <span>{file.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileExplorer;