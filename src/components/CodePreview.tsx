import React, { useState, useEffect } from 'react';
import { FileItem } from '../types';
import { Eye, Code, RefreshCw, ExternalLink, X } from 'lucide-react';

interface CodePreviewProps {
  files: FileItem[];
  onClose: () => void;
}

const CodePreview: React.FC<CodePreviewProps> = ({ files, onClose }) => {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtrar archivos por tipo
  const htmlFiles = files.filter(file => file.path.endsWith('.html'));
  const cssFiles = files.filter(file => file.path.endsWith('.css'));
  const jsFiles = files.filter(file => file.path.endsWith('.js'));
  const otherFiles = files.filter(file => 
    !file.path.endsWith('.html') && 
    !file.path.endsWith('.css') && 
    !file.path.endsWith('.js')
  );
  
  // Establecer el primer archivo HTML como activo por defecto
  useEffect(() => {
    if (htmlFiles.length > 0 && !activeTab) {
      setActiveTab(htmlFiles[0].id);
    } else if (files.length > 0 && !activeTab) {
      setActiveTab(files[0].id);
    }
  }, [files, htmlFiles, activeTab]);
  
  // Generar una vista previa en tiempo real para proyectos web
  useEffect(() => {
    if (htmlFiles.length > 0) {
      generatePreview();
    }
  }, [activeTab]);
  
  const generatePreview = () => {
    if (htmlFiles.length === 0) {
      setError('No hay archivos HTML para previsualizar');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Encontrar el archivo HTML activo o usar el primero
      const activeHtml = activeTab && files.find(f => f.id === activeTab && f.path.endsWith('.html'));
      const htmlFile = activeHtml || htmlFiles[0];
      
      // Obtener el contenido HTML
      let htmlContent = htmlFile.content;
      
      // Inyectar CSS
      if (cssFiles.length > 0) {
        const styleTag = cssFiles.map(css => 
          `<style>${css.content}</style>`
        ).join('\\n');
        
        // Insertar estilos antes de </head>
        htmlContent = htmlContent.replace('</head>', `${styleTag}</head>`);
      }
      
      // Inyectar JavaScript
      if (jsFiles.length > 0) {
        const scriptTag = jsFiles.map(js => 
          `<script>${js.content}</script>`
        ).join('\\n');
        
        // Insertar scripts antes de </body>
        htmlContent = htmlContent.replace('</body>', `${scriptTag}</body>`);
      }
      
      // Crear un blob y generar URL
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Limpiar URL anterior si existe
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      setPreviewUrl(url);
    } catch (err) {
      setError('Error al generar la vista previa');
      console.error('Error al generar la vista previa:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const activeFile = activeTab ? files.find(f => f.id === activeTab) : null;
  
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-codestorm-darker rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        <div className="bg-codestorm-dark p-3 rounded-t-lg border-b border-codestorm-blue/30 flex justify-between items-center">
          <h2 className="text-lg font-medium text-white flex items-center">
            <Eye className="h-5 w-5 mr-2 text-codestorm-gold" />
            Vista Previa del Código
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Barra lateral con pestañas de archivos */}
          <div className="w-full md:w-64 bg-codestorm-dark border-r border-codestorm-blue/30 overflow-y-auto">
            {htmlFiles.length > 0 && (
              <div className="p-2">
                <h3 className="text-xs font-medium text-gray-400 mb-1 uppercase">HTML</h3>
                <div className="space-y-1">
                  {htmlFiles.map(file => (
                    <button
                      key={file.id}
                      className={`w-full text-left px-2 py-1 rounded text-sm ${
                        activeTab === file.id
                          ? 'bg-codestorm-blue text-white'
                          : 'text-gray-300 hover:bg-codestorm-blue/10'
                      }`}
                      onClick={() => setActiveTab(file.id)}
                    >
                      {file.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {cssFiles.length > 0 && (
              <div className="p-2 border-t border-codestorm-blue/20">
                <h3 className="text-xs font-medium text-gray-400 mb-1 uppercase">CSS</h3>
                <div className="space-y-1">
                  {cssFiles.map(file => (
                    <button
                      key={file.id}
                      className={`w-full text-left px-2 py-1 rounded text-sm ${
                        activeTab === file.id
                          ? 'bg-codestorm-blue text-white'
                          : 'text-gray-300 hover:bg-codestorm-blue/10'
                      }`}
                      onClick={() => setActiveTab(file.id)}
                    >
                      {file.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {jsFiles.length > 0 && (
              <div className="p-2 border-t border-codestorm-blue/20">
                <h3 className="text-xs font-medium text-gray-400 mb-1 uppercase">JavaScript</h3>
                <div className="space-y-1">
                  {jsFiles.map(file => (
                    <button
                      key={file.id}
                      className={`w-full text-left px-2 py-1 rounded text-sm ${
                        activeTab === file.id
                          ? 'bg-codestorm-blue text-white'
                          : 'text-gray-300 hover:bg-codestorm-blue/10'
                      }`}
                      onClick={() => setActiveTab(file.id)}
                    >
                      {file.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {otherFiles.length > 0 && (
              <div className="p-2 border-t border-codestorm-blue/20">
                <h3 className="text-xs font-medium text-gray-400 mb-1 uppercase">Otros Archivos</h3>
                <div className="space-y-1">
                  {otherFiles.map(file => (
                    <button
                      key={file.id}
                      className={`w-full text-left px-2 py-1 rounded text-sm ${
                        activeTab === file.id
                          ? 'bg-codestorm-blue text-white'
                          : 'text-gray-300 hover:bg-codestorm-blue/10'
                      }`}
                      onClick={() => setActiveTab(file.id)}
                    >
                      {file.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Área de previsualización */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Barra de herramientas */}
            <div className="bg-codestorm-dark p-2 border-b border-codestorm-blue/30 flex justify-between items-center">
              <div className="text-sm text-white">
                {activeFile ? activeFile.path : 'Ningún archivo seleccionado'}
              </div>
              <div className="flex space-x-2">
                {htmlFiles.length > 0 && (
                  <button
                    onClick={generatePreview}
                    className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
                    title="Actualizar vista previa"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                )}
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded text-gray-400 hover:bg-codestorm-blue/20 hover:text-white"
                    title="Abrir en nueva pestaña"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
            
            {/* Contenido */}
            <div className="flex-1 overflow-hidden">
              {activeFile && activeFile.path.endsWith('.html') && previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title="Vista previa"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : activeFile ? (
                <div className="bg-codestorm-darker p-4 h-full overflow-auto">
                  <pre className="text-white text-sm font-mono whitespace-pre-wrap">
                    <code>{activeFile.content}</code>
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="flex flex-col items-center">
                    <Code className="h-12 w-12 mb-2 opacity-30" />
                    <p>Selecciona un archivo para ver su contenido</p>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="absolute bottom-4 right-4 bg-red-500/80 text-white px-4 py-2 rounded shadow-lg">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodePreview;
