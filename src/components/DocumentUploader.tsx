import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface DocumentUploaderProps {
  onDocumentProcessed: (content: string, fileName: string) => void;
  disabled?: boolean;
  className?: string;
  acceptedTypes?: string[];
  maxFileSize?: number; // en MB
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onDocumentProcessed,
  disabled = false,
  className = '',
  acceptedTypes = ['.txt', '.md', '.json', '.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.py', '.java', '.cpp', '.c', '.php', '.rb', '.go', '.rs', '.swift', '.kt'],
  maxFileSize = 5 // 5MB por defecto
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    if (disabled || isProcessing) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamaño del archivo
    if (file.size > maxFileSize * 1024 * 1024) {
      setUploadStatus('error');
      setStatusMessage(`El archivo es demasiado grande. Máximo ${maxFileSize}MB.`);
      setTimeout(() => {
        setUploadStatus('idle');
        setStatusMessage('');
      }, 3000);
      return;
    }

    // Validar tipo de archivo
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      setUploadStatus('error');
      setStatusMessage('Tipo de archivo no soportado.');
      setTimeout(() => {
        setUploadStatus('idle');
        setStatusMessage('');
      }, 3000);
      return;
    }

    setIsProcessing(true);
    setUploadStatus('idle');
    setStatusMessage('Procesando documento...');

    try {
      const content = await readFileContent(file);
      
      // Procesar el contenido según el tipo de archivo
      const processedContent = await processFileContent(content, file.name, fileExtension);
      
      // Llamar al callback con el contenido procesado
      onDocumentProcessed(processedContent, file.name);
      
      setUploadStatus('success');
      setStatusMessage(`Documento "${file.name}" cargado exitosamente.`);
      
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setTimeout(() => {
        setUploadStatus('idle');
        setStatusMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Error al procesar documento:', error);
      setUploadStatus('error');
      setStatusMessage('Error al procesar el documento.');
      setTimeout(() => {
        setUploadStatus('idle');
        setStatusMessage('');
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result as string;
        resolve(content);
      };
      
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };
      
      reader.readAsText(file, 'UTF-8');
    });
  };

  const processFileContent = async (content: string, fileName: string, extension: string): Promise<string> => {
    // Crear un prompt contextual basado en el tipo de archivo y contenido
    let processedContent = '';

    switch (extension) {
      case '.md':
        processedContent = `He cargado un documento Markdown llamado "${fileName}". Aquí está el contenido:\n\n${content}\n\nPor favor, analiza este contenido y ayúdame según lo que necesite.`;
        break;
      
      case '.txt':
        processedContent = `He cargado un archivo de texto llamado "${fileName}". Contenido:\n\n${content}\n\nPor favor, analiza este contenido y ayúdame según lo que necesite.`;
        break;
      
      case '.json':
        try {
          JSON.parse(content); // Validar que es JSON válido
          processedContent = `He cargado un archivo JSON llamado "${fileName}". Aquí está la estructura:\n\n\`\`\`json\n${content}\n\`\`\`\n\nPor favor, analiza esta estructura de datos y ayúdame según lo que necesite.`;
        } catch {
          processedContent = `He cargado un archivo que debería ser JSON llamado "${fileName}", pero parece tener errores de formato. Contenido:\n\n${content}\n\nPor favor, ayúdame a corregir el formato JSON.`;
        }
        break;
      
      case '.js':
      case '.jsx':
        processedContent = `He cargado un archivo JavaScript llamado "${fileName}". Código:\n\n\`\`\`javascript\n${content}\n\`\`\`\n\nPor favor, analiza este código y ayúdame según lo que necesite.`;
        break;
      
      case '.ts':
      case '.tsx':
        processedContent = `He cargado un archivo TypeScript llamado "${fileName}". Código:\n\n\`\`\`typescript\n${content}\n\`\`\`\n\nPor favor, analiza este código y ayúdame según lo que necesite.`;
        break;
      
      case '.html':
        processedContent = `He cargado un archivo HTML llamado "${fileName}". Código:\n\n\`\`\`html\n${content}\n\`\`\`\n\nPor favor, analiza este código HTML y ayúdame según lo que necesite.`;
        break;
      
      case '.css':
        processedContent = `He cargado un archivo CSS llamado "${fileName}". Estilos:\n\n\`\`\`css\n${content}\n\`\`\`\n\nPor favor, analiza estos estilos y ayúdame según lo que necesite.`;
        break;
      
      case '.py':
        processedContent = `He cargado un archivo Python llamado "${fileName}". Código:\n\n\`\`\`python\n${content}\n\`\`\`\n\nPor favor, analiza este código Python y ayúdame según lo que necesite.`;
        break;
      
      default:
        // Para otros tipos de archivo, usar el contenido tal como está
        const language = extension.substring(1); // Remover el punto
        processedContent = `He cargado un archivo de código llamado "${fileName}" (${language}). Código:\n\n\`\`\`${language}\n${content}\n\`\`\`\n\nPor favor, analiza este código y ayúdame según lo que necesite.`;
        break;
    }

    return processedContent;
  };

  const getStatusIcon = () => {
    if (isProcessing) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    
    switch (uploadStatus) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Upload className="w-4 h-4" />;
    }
  };

  const getButtonClass = () => {
    let baseClass = `p-2 rounded-md transition-all duration-200 ${className}`;
    
    if (disabled || isProcessing) {
      return `${baseClass} bg-gray-600 text-gray-400 cursor-not-allowed`;
    }
    
    switch (uploadStatus) {
      case 'success':
        return `${baseClass} bg-green-600 hover:bg-green-700 text-white`;
      case 'error':
        return `${baseClass} bg-red-600 hover:bg-red-700 text-white`;
      default:
        return `${baseClass} bg-codestorm-accent hover:bg-blue-600 text-white hover:shadow-glow-blue`;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleFileSelect}
        disabled={disabled || isProcessing}
        className={getButtonClass()}
        title={statusMessage || "Cargar documento"}
      >
        {getStatusIcon()}
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* Tooltip de estado */}
      {statusMessage && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-codestorm-darker border border-codestorm-blue/30 rounded-md text-xs text-white whitespace-nowrap z-10">
          {statusMessage}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-codestorm-blue/30"></div>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;
