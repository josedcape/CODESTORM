import React from 'react';
import { FileItem } from '../types';
import { Folder, File, Plus, FolderPlus, RefreshCw } from 'lucide-react';

interface FileExplorerProps {
  files: FileItem[];
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, selectedFileId, onSelectFile }) => {
  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md h-full border border-codestorm-blue/30 flex flex-col">
      <div className="bg-codestorm-blue/20 p-3 border-b border-codestorm-blue/30 flex justify-between items-center">
        <h2 className="text-sm font-medium text-white">Explorador</h2>
      </div>
      
      <div className="p-2 flex space-x-2 border-b border-codestorm-blue/30">
        <button className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white">
          <Plus className="h-4 w-4" />
        </button>
        <button className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white">
          <FolderPlus className="h-4 w-4" />
        </button>
        <button className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-auto p-2">
        <div className="mb-2">
          <div className="flex items-center text-codestorm-gold mb-1">
            <Folder className="h-4 w-4 mr-1" />
            <span className="text-sm">proyecto</span>
          </div>
          <ul className="pl-4">
            {files.map((file) => (
              <li 
                key={file.id}
                className={`flex items-center py-1 px-2 rounded-md cursor-pointer ${
                  selectedFileId === file.id 
                    ? 'bg-codestorm-blue text-white' 
                    : 'text-gray-300 hover:bg-codestorm-blue/10'
                }`}
                onClick={() => onSelectFile(file.id)}
              >
                <File className="h-4 w-4 mr-2" />
                <span className="text-sm">{file.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;
