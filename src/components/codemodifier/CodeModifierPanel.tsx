import React, { useState, useEffect } from 'react';
import { 
  FileItem, 
  CodeModifierResult,
  AgentTask
} from '../../types';
import { 
  X, 
  Edit, 
  Code, 
  FileText, 
  CheckCircle, 
  XCircle, 
  ArrowLeftRight,
  RefreshCw,
  Save,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CodeModifierAgent } from '../../agents/CodeModifierAgent';
import { generateUniqueId } from '../../utils/idGenerator';
import { diffLines, Change } from 'diff';

interface CodeModifierPanelProps {
  isVisible: boolean;
  onClose: () => void;
  files: FileItem[];
  onApplyChanges: (originalFile: FileItem, modifiedFile: FileItem) => void;
}

const CodeModifierPanel: React.FC<CodeModifierPanelProps> = ({
  isVisible,
  onClose,
  files,
  onApplyChanges
}) => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [instruction, setInstruction] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<CodeModifierResult | null>(null);
  const [showDiff, setShowDiff] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  // Limpiar el estado cuando se cierra el panel
  useEffect(() => {
    if (!isVisible) {
      setSelectedFileId(null);
      setInstruction('');
      setResult(null);
      setShowDiff(false);
      setError(null);
      setValidationMessage(null);
    }
  }, [isVisible]);

  // Obtener el archivo seleccionado
  const selectedFile = selectedFileId ? files.find(f => f.id === selectedFileId) : null;

  // Manejar la selección de archivo
  const handleFileSelect = (fileId: string) => {
    setSelectedFileId(fileId);
    setResult(null);
    setShowDiff(false);
    setError(null);
    setValidationMessage(null);
  };

  // Manejar el cambio de instrucción
  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInstruction(e.target.value);
    setValidationMessage(null);
  };

  // Manejar la modificación del código
  const handleModifyCode = async () => {
    if (!selectedFile) {
      setValidationMessage('Por favor, selecciona un archivo para modificar.');
      return;
    }

    if (!instruction.trim()) {
      setValidationMessage('Por favor, ingresa una instrucción para modificar el código.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Crear una tarea para el agente de modificación
      const modifierTask: AgentTask = {
        id: generateUniqueId('task'),
        type: 'codeModifier',
        instruction: instruction,
        status: 'working',
        startTime: Date.now()
      };

      // Ejecutar el agente de modificación
      const modifierResult = await CodeModifierAgent.execute(modifierTask, selectedFile);
      
      setResult(modifierResult);
      setShowDiff(true);
    } catch (error) {
      console.error('Error al modificar el código:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido al modificar el código');
    } finally {
      setIsProcessing(false);
    }
  };

  // Manejar la aplicación de cambios
  const handleApplyChanges = () => {
    if (result?.success && result.data) {
      onApplyChanges(result.data.originalFile, result.data.modifiedFile);
      onClose();
    }
  };

  // Renderizar el diff entre el código original y el modificado
  const renderDiff = () => {
    if (!result?.success || !result.data) return null;

    const { originalFile, modifiedFile } = result.data;
    const changes = diffLines(originalFile.content, modifiedFile.content);

    return (
      <div className="mt-4 bg-codestorm-darker rounded-md p-2 overflow-auto max-h-[400px]">
        {changes.map((change, i) => (
          <div 
            key={i} 
            className={`font-mono text-xs whitespace-pre ${
              change.added ? 'bg-green-900/30 text-green-300' : 
              change.removed ? 'bg-red-900/30 text-red-300' : 
              'text-gray-300'
            }`}
          >
            {change.value}
          </div>
        ))}
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-codestorm-dark rounded-lg shadow-xl border border-codestorm-blue/30 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Encabezado */}
        <div className="bg-codestorm-blue/20 p-3 border-b border-codestorm-blue/30 flex justify-between items-center">
          <div className="flex items-center">
            <Edit className="h-5 w-5 text-codestorm-accent mr-2" />
            <h2 className="text-sm font-medium text-white">Modificador de Código</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-codestorm-blue/30 text-gray-400 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Selector de archivo */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Seleccionar archivo</label>
            <select
              value={selectedFileId || ''}
              onChange={(e) => handleFileSelect(e.target.value)}
              className="w-full bg-codestorm-darker border border-codestorm-blue/30 rounded-md p-2 text-white text-sm"
              disabled={isProcessing}
            >
              <option value="">Selecciona un archivo...</option>
              {files.map((file) => (
                <option key={file.id} value={file.id}>
                  {file.path}
                </option>
              ))}
            </select>
          </div>

          {/* Instrucción */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Instrucción de modificación</label>
            <textarea
              value={instruction}
              onChange={handleInstructionChange}
              placeholder="Describe los cambios que deseas realizar en el código..."
              className="w-full bg-codestorm-darker border border-codestorm-blue/30 rounded-md p-2 text-white text-sm min-h-[100px]"
              disabled={isProcessing}
            />
          </div>

          {/* Mensaje de validación */}
          {validationMessage && (
            <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-md p-3 text-yellow-300 text-sm flex items-start">
              <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{validationMessage}</span>
            </div>
          )}

          {/* Archivo original */}
          {selectedFile && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white flex items-center">
                  <FileText className="h-4 w-4 text-codestorm-blue mr-2" />
                  Archivo Original: {selectedFile.path}
                </h3>
                <div className="flex space-x-2">
                  {result?.success && (
                    <button
                      onClick={() => setShowDiff(!showDiff)}
                      className="p-1.5 rounded hover:bg-codestorm-blue/30 text-gray-400 hover:text-white text-xs flex items-center"
                    >
                      <ArrowLeftRight className="h-3 w-3 mr-1" />
                      {showDiff ? 'Ver código' : 'Ver diferencias'}
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-codestorm-darker rounded-md overflow-hidden">
                <SyntaxHighlighter
                  language={selectedFile.language}
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, maxHeight: '200px' }}
                  showLineNumbers
                >
                  {selectedFile.content}
                </SyntaxHighlighter>
              </div>
            </div>
          )}

          {/* Resultado de la modificación */}
          {result?.success && result.data && (
            <div>
              <h3 className="text-sm font-medium text-white flex items-center mb-2">
                <Code className="h-4 w-4 text-codestorm-accent mr-2" />
                Código Modificado
              </h3>
              
              {showDiff ? (
                renderDiff()
              ) : (
                <div className="bg-codestorm-darker rounded-md overflow-hidden">
                  <SyntaxHighlighter
                    language={result.data.modifiedFile.language}
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, maxHeight: '200px' }}
                    showLineNumbers
                  >
                    {result.data.modifiedFile.content}
                  </SyntaxHighlighter>
                </div>
              )}

              {/* Cambios realizados */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-white flex items-center mb-2">
                  <Info className="h-4 w-4 text-codestorm-gold mr-2" />
                  Cambios Realizados
                </h4>
                <ul className="space-y-2">
                  {result.data.changes.map((change, index) => (
                    <li key={index} className="bg-codestorm-blue/10 rounded-md p-2 border border-codestorm-blue/20 text-sm text-gray-300">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs mr-2 ${
                        change.type === 'add' ? 'bg-green-900/50 text-green-300' :
                        change.type === 'remove' ? 'bg-red-900/50 text-red-300' :
                        'bg-blue-900/50 text-blue-300'
                      }`}>
                        {change.type === 'add' ? 'Añadido' : 
                         change.type === 'remove' ? 'Eliminado' : 
                         'Modificado'}
                      </span>
                      {change.description}
                      {change.lineNumbers && (
                        <span className="text-xs text-gray-400 ml-2">
                          (Líneas {change.lineNumbers[0]}-{change.lineNumbers[1]})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-900/30 border border-red-600/50 rounded-md p-3 text-red-300 text-sm flex items-start">
              <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="bg-codestorm-blue/10 p-3 border-t border-codestorm-blue/30 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm flex items-center"
            disabled={isProcessing}
          >
            <X className="h-4 w-4 mr-2" />
            <span>Cancelar</span>
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={handleModifyCode}
              className="px-4 py-2 bg-codestorm-blue hover:bg-blue-600 text-white rounded-md text-sm flex items-center"
              disabled={isProcessing || !selectedFileId || !instruction.trim()}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  <span>Modificar Código</span>
                </>
              )}
            </button>
            
            {result?.success && result.data && (
              <button
                onClick={handleApplyChanges}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                <span>Aplicar Cambios</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeModifierPanel;
