import React, { useState, useEffect } from 'react';
import { Download, Copy, Archive, Check, FileDown, Clipboard } from 'lucide-react';
import { FileItem } from '../types';
// @ts-ignore - Ignorar error de tipos para JSZip
import JSZip from 'jszip';
// @ts-ignore - Ignorar error de tipos para file-saver
import { saveAs } from 'file-saver';

interface ProjectExporterProps {
  files: FileItem[];
  selectedFileId: string | null;
  projectName?: string;
}

const ProjectExporter: React.FC<ProjectExporterProps> = ({
  files,
  selectedFileId,
  projectName = 'codestorm-project'
}) => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Función para copiar el contenido de un archivo al portapapeles
  const copyFileContent = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    try {
      // Método alternativo para copiar al portapapeles
      const textArea = document.createElement('textarea');
      textArea.value = file.content;
      textArea.style.position = 'fixed';  // Evita desplazamiento
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        setCopiedFile(fileId);
        setTimeout(() => setCopiedFile(null), 2000);
      } else {
        // Intentar con la API moderna si el método antiguo falla
        navigator.clipboard.writeText(file.content).then(() => {
          setCopiedFile(fileId);
          setTimeout(() => setCopiedFile(null), 2000);
        }).catch(err => {
          console.error('Error al copiar al portapapeles:', err);
          alert('No se pudo copiar al portapapeles. Por favor, intenta de nuevo.');
        });
      }
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
      alert('No se pudo copiar al portapapeles. Por favor, intenta de nuevo.');
    }
  };

  // Función para descargar un archivo individual
  const downloadFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    try {
      // Crear un elemento <a> temporal
      const element = document.createElement('a');
      const fileContent = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(fileContent);

      // Extraer el nombre del archivo de la ruta
      const fileName = file.path.split('/').pop() || file.name;
      element.download = fileName;

      // Añadir al DOM, hacer clic y luego eliminar
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      // Liberar el objeto URL
      setTimeout(() => {
        URL.revokeObjectURL(element.href);
      }, 100);
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      alert('Error al descargar el archivo. Por favor, intenta de nuevo.');
    }
  };

  // Función para descargar todo el proyecto como un archivo ZIP
  const downloadProject = async () => {
    if (files.length === 0) return;

    setIsExporting(true);

    try {
      const zip = new JSZip();

      // Organizar archivos en carpetas
      files.forEach(file => {
        // Eliminar la barra inicial si existe
        const path = file.path.startsWith('/') ? file.path.substring(1) : file.path;
        zip.file(path, file.content);
      });

      // Generar el archivo ZIP
      const content = await zip.generateAsync({ type: 'blob' });

      // Crear un elemento <a> temporal para la descarga
      const element = document.createElement('a');
      element.href = URL.createObjectURL(content);
      element.download = `${projectName}.zip`;

      // Añadir al DOM, hacer clic y luego eliminar
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      // Liberar el objeto URL
      setTimeout(() => {
        URL.revokeObjectURL(element.href);
      }, 100);
    } catch (error) {
      console.error('Error al exportar el proyecto:', error);
      alert('Error al exportar el proyecto. Por favor, intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  // Función para copiar todo el proyecto como un objeto JSON
  const copyProjectAsJson = () => {
    const projectData = {
      name: projectName,
      files: files.map(file => ({
        path: file.path,
        content: file.content,
        language: file.language
      }))
    };

    try {
      const jsonString = JSON.stringify(projectData, null, 2);

      // Método alternativo para copiar al portapapeles
      const textArea = document.createElement('textarea');
      textArea.value = jsonString;
      textArea.style.position = 'fixed';  // Evita desplazamiento
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        setCopiedFile('project');
        setTimeout(() => setCopiedFile(null), 2000);
      } else {
        // Intentar con la API moderna si el método antiguo falla
        navigator.clipboard.writeText(jsonString).then(() => {
          setCopiedFile('project');
          setTimeout(() => setCopiedFile(null), 2000);
        }).catch(err => {
          console.error('Error al copiar el proyecto al portapapeles:', err);
          alert('No se pudo copiar el proyecto al portapapeles. Por favor, intenta de nuevo.');
        });
      }
    } catch (error) {
      console.error('Error al copiar el proyecto al portapapeles:', error);
      alert('No se pudo copiar el proyecto al portapapeles. Por favor, intenta de nuevo.');
    }
  };

  return (
    <div className="bg-codestorm-dark rounded-lg shadow-md p-4 border border-codestorm-blue/30">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-medium text-white">Exportar Proyecto</h2>
        <div className="flex space-x-2">
          <button
            onClick={downloadProject}
            disabled={isExporting || files.length === 0}
            className={`p-1.5 rounded ${
              isExporting || files.length === 0
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-codestorm-gold hover:bg-codestorm-blue/20'
            }`}
            title="Descargar proyecto como ZIP"
          >
            <Archive className="h-4 w-4" />
          </button>
          <button
            onClick={copyProjectAsJson}
            disabled={files.length === 0}
            className={`p-1.5 rounded ${
              files.length === 0
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-codestorm-gold hover:bg-codestorm-blue/20'
            }`}
            title="Copiar proyecto como JSON"
          >
            {copiedFile === 'project' ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Clipboard className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {files.length === 0 ? (
          <div className="text-gray-400 text-xs text-center py-2">
            No hay archivos para exportar
          </div>
        ) : (
          files.map(file => (
            <div
              key={file.id}
              className={`flex items-center justify-between p-2 rounded ${
                selectedFileId === file.id
                  ? 'bg-codestorm-blue/30'
                  : 'hover:bg-codestorm-blue/10'
              }`}
            >
              <div className="text-sm text-white truncate flex-1">{file.path}</div>
              <div className="flex space-x-1">
                <button
                  onClick={() => copyFileContent(file.id)}
                  className="p-1 rounded text-gray-400 hover:text-white"
                  title="Copiar contenido"
                >
                  {copiedFile === file.id ? (
                    <Check className="h-3.5 w-3.5 text-green-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  onClick={() => downloadFile(file.id)}
                  className="p-1 rounded text-gray-400 hover:text-white"
                  title="Descargar archivo"
                >
                  <FileDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-codestorm-blue/30">
        <button
          onClick={downloadProject}
          disabled={isExporting || files.length === 0}
          className={`w-full py-2 px-3 rounded flex items-center justify-center space-x-2 ${
            isExporting || files.length === 0
              ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
              : 'bg-codestorm-accent hover:bg-blue-600 text-white'
          }`}
        >
          {isExporting ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Exportando...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Descargar Proyecto</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProjectExporter;
