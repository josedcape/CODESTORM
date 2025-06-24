import React, { useState } from 'react';
import { 
  FileItem, 
  AgentTask 
} from '../../types';
import { 
  Scissors, 
  FileText, 
  Check, 
  AlertTriangle, 
  Loader, 
  ChevronDown, 
  ChevronUp, 
  Code, 
  Save, 
  Copy, 
  Folder
} from 'lucide-react';
import { CodeSplitterAgent } from '../../agents/CodeSplitterAgent';

interface CodeSplitterPanelProps {
  onFilesGenerated: (files: FileItem[]) => void;
}

/**
 * Panel para el agente de separación de código
 * Permite al usuario ingresar código y separarlo en archivos
 */
const CodeSplitterPanel: React.FC<CodeSplitterPanelProps> = ({
  onFilesGenerated
}) => {
  const [code, setCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  
  /**
   * Maneja el proceso de separación de código
   */
  const handleSplitCode = async () => {
    if (!code.trim()) {
      setError('Por favor, ingresa código para separar');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Crear tarea para el agente
      const task: AgentTask = {
        id: `task-splitter-${Date.now()}`,
        type: 'codeSplitter',
        instruction: 'Separar código en archivos',
        status: 'working',
        startTime: Date.now()
      };
      
      // Ejecutar el agente de separación de código
      const result = CodeSplitterAgent.execute(task, code);
      
      if (result.success && result.data?.files) {
        setGeneratedFiles(result.data.files);
        setSuccess(result.data.message || 'Código separado exitosamente');
        onFilesGenerated(result.data.files);
      } else {
        setError(result.error || 'Error al separar el código');
      }
    } catch (error) {
      setError(`Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Maneja la expansión/colapso de un archivo
   */
  const toggleFileExpansion = (fileId: string) => {
    setExpandedFileId(expandedFileId === fileId ? null : fileId);
  };
  
  /**
   * Copia el contenido de un archivo al portapapeles
   */
  const copyFileContent = (content: string) => {
    navigator.clipboard.writeText(content);
    setSuccess('Contenido copiado al portapapeles');
    setTimeout(() => setSuccess(null), 2000);
  };
  
  /**
   * Determina el icono para un archivo según su lenguaje
   */
  const getFileIcon = (language: string) => {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return <Code className="h-4 w-4 text-yellow-400" />;
      case 'css':
      case 'scss':
        return <Code className="h-4 w-4 text-blue-400" />;
      case 'html':
        return <Code className="h-4 w-4 text-orange-400" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };
  
  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md border border-codestorm-blue/30 flex flex-col h-full">
      <div className="bg-codestorm-blue/20 p-3 border-b border-codestorm-blue/30 flex justify-between items-center">
        <div className="flex items-center">
          <Scissors className="h-5 w-5 mr-2 text-codestorm-accent" />
          <h2 className="text-sm font-medium text-white">Separador de Código</h2>
        </div>
      </div>
      
      <div className="p-3 flex-1 overflow-auto">
        <div className="mb-4">
          <label htmlFor="code-input" className="block text-sm font-medium text-white mb-1">
            Ingresa el código a separar:
          </label>
          <textarea
            id="code-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Pega aquí el código generado que deseas separar en archivos..."
            className="w-full h-40 bg-codestorm-darker border border-codestorm-blue/30 rounded-md p-3 text-white placeholder-gray-500 resize-none"
            disabled={isProcessing}
          />
        </div>
        
        <div className="flex justify-end mb-4">
          <button
            onClick={handleSplitCode}
            disabled={!code.trim() || isProcessing}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
              !code.trim() || isProcessing
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-codestorm-accent hover:bg-blue-600 text-white'
            } transition-colors`}
          >
            {isProcessing ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <Scissors className="h-4 w-4" />
                <span>Separar Código</span>
              </>
            )}
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm flex items-start">
            <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-md text-green-400 text-sm flex items-start">
            <Check className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
            <p>{success}</p>
          </div>
        )}
        
        {generatedFiles.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-white mb-2 flex items-center">
              <Folder className="h-4 w-4 mr-2 text-codestorm-accent" />
              Archivos Generados ({generatedFiles.length})
            </h3>
            
            <div className="space-y-2">
              {generatedFiles.map((file) => (
                <div key={file.id} className="bg-codestorm-blue/10 rounded-md overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-2 cursor-pointer hover:bg-codestorm-blue/20"
                    onClick={() => toggleFileExpansion(file.id)}
                  >
                    <div className="flex items-center">
                      {getFileIcon(file.language)}
                      <span className="ml-2 text-sm text-white">{file.path}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyFileContent(file.content);
                        }}
                        className="p-1 rounded hover:bg-codestorm-blue/30 text-gray-400 hover:text-white"
                        title="Copiar contenido"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      
                      {expandedFileId === file.id ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {expandedFileId === file.id && (
                    <div className="border-t border-codestorm-blue/20 p-3">
                      <pre className="text-xs text-gray-300 overflow-x-auto p-2 bg-codestorm-darker rounded-md">
                        <code>{file.content}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {generatedFiles.length > 0 && (
        <div className="p-3 border-t border-codestorm-blue/30 flex justify-end">
          <button
            onClick={() => onFilesGenerated(generatedFiles)}
            className="flex items-center space-x-2 px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Guardar Todos los Archivos</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CodeSplitterPanel;
