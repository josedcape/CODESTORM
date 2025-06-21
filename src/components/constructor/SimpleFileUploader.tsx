import React, { useRef } from 'react';
import { Upload, FileArchive } from 'lucide-react';

interface SimpleFileUploaderProps {
  onFileSelected: (file: File) => void;
}

const SimpleFileUploader: React.FC<SimpleFileUploaderProps> = ({ onFileSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    console.log('🔍 SimpleFileUploader - Archivos seleccionados:', files);
    if (!files || files.length === 0) {
      console.log('⚠️ No hay archivos seleccionados');
      return;
    }
    
    const file = files[0];
    console.log('📄 Archivo seleccionado:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    onFileSelected(file);
  };

  const openFileSelector = () => {
    console.log('📁 Abriendo selector de archivos simple...');
    console.log('📁 Input ref:', fileInputRef.current);
    fileInputRef.current?.click();
  };

  return (
    <div className="p-4 border-2 border-dashed border-gray-600 rounded-lg">
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,.rar"
        onChange={(e) => {
          console.log('📁 Input onChange triggered');
          handleFileSelect(e.target.files);
          e.target.value = '';
        }}
        style={{ display: 'none' }}
      />
      
      <div className="text-center">
        <FileArchive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-white mb-2">Uploader Simple de Prueba</h3>
        <button
          onClick={openFileSelector}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Seleccionar Archivo ZIP/RAR
        </button>
      </div>
    </div>
  );
};

export default SimpleFileUploader;
