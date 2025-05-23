import React, { useState } from 'react';
import { Search, Globe, Tag, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface SEOSettingsProps {
  onSaveSettings: (settings: SEOSettings) => void;
}

export interface SEOSettings {
  title: string;
  description: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonicalUrl: string;
}

const SEOSettings: React.FC<SEOSettingsProps> = ({ onSaveSettings }) => {
  const [settings, setSettings] = useState<SEOSettings>({
    title: '',
    description: '',
    keywords: [],
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    canonicalUrl: ''
  });
  
  const [keyword, setKeyword] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof SEOSettings, string>>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Actualizar un campo
  const updateField = (field: keyof SEOSettings, value: string | string[]) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error si existe
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Añadir una palabra clave
  const addKeyword = () => {
    if (keyword.trim() && !settings.keywords.includes(keyword.trim())) {
      updateField('keywords', [...settings.keywords, keyword.trim()]);
      setKeyword('');
    }
  };

  // Eliminar una palabra clave
  const removeKeyword = (index: number) => {
    const newKeywords = [...settings.keywords];
    newKeywords.splice(index, 1);
    updateField('keywords', newKeywords);
  };

  // Validar los campos
  const validateFields = () => {
    const newErrors: Partial<Record<keyof SEOSettings, string>> = {};
    
    if (!settings.title) {
      newErrors.title = 'El título es obligatorio';
    } else if (settings.title.length > 60) {
      newErrors.title = 'El título debe tener menos de 60 caracteres';
    }
    
    if (!settings.description) {
      newErrors.description = 'La descripción es obligatoria';
    } else if (settings.description.length > 160) {
      newErrors.description = 'La descripción debe tener menos de 160 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardar configuración
  const handleSave = () => {
    if (validateFields()) {
      onSaveSettings(settings);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  return (
    <div className="bg-codestorm-darker rounded-lg shadow-lg p-4 h-full overflow-hidden flex flex-col">
      <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
        <Search className="h-5 w-5 mr-2 text-codestorm-blue" />
        Configuración SEO
      </h2>
      
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-gray-300 text-sm mb-1">Título de la página</label>
            <input
              type="text"
              value={settings.title}
              onChange={(e) => updateField('title', e.target.value)}
              className={`w-full bg-codestorm-dark border ${
                errors.title ? 'border-red-500' : 'border-codestorm-blue/30'
              } rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-codestorm-blue/50`}
              placeholder="Título de tu página web"
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.title}
              </p>
            )}
            <p className="text-gray-400 text-xs mt-1">
              {settings.title.length}/60 caracteres
            </p>
          </div>
          
          {/* Descripción */}
          <div>
            <label className="block text-gray-300 text-sm mb-1">Descripción</label>
            <textarea
              value={settings.description}
              onChange={(e) => updateField('description', e.target.value)}
              className={`w-full bg-codestorm-dark border ${
                errors.description ? 'border-red-500' : 'border-codestorm-blue/30'
              } rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-codestorm-blue/50 h-24`}
              placeholder="Descripción breve de tu página web"
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.description}
              </p>
            )}
            <p className="text-gray-400 text-xs mt-1">
              {settings.description.length}/160 caracteres
            </p>
          </div>
          
          {/* Palabras clave */}
          <div>
            <label className="block text-gray-300 text-sm mb-1">Palabras clave</label>
            <div className="flex">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                className="flex-1 bg-codestorm-dark border border-codestorm-blue/30 rounded-l-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-codestorm-blue/50"
                placeholder="Añadir palabra clave"
              />
              <button
                onClick={addKeyword}
                className="bg-codestorm-blue hover:bg-codestorm-blue/80 text-white px-3 rounded-r-md"
              >
                Añadir
              </button>
            </div>
            
            {settings.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {settings.keywords.map((kw, index) => (
                  <div
                    key={index}
                    className="bg-codestorm-dark text-gray-300 px-2 py-1 rounded-full text-sm flex items-center"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {kw}
                    <button
                      onClick={() => removeKeyword(index)}
                      className="ml-1 text-gray-400 hover:text-red-400"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="border-t border-codestorm-blue/20 pt-4">
            <h3 className="text-white text-sm font-medium mb-3 flex items-center">
              <Globe className="h-4 w-4 mr-1 text-codestorm-blue" />
              Open Graph (Redes sociales)
            </h3>
            
            {/* OG Title */}
            <div className="mb-3">
              <label className="block text-gray-300 text-sm mb-1">Título para redes sociales</label>
              <input
                type="text"
                value={settings.ogTitle}
                onChange={(e) => updateField('ogTitle', e.target.value)}
                className="w-full bg-codestorm-dark border border-codestorm-blue/30 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-codestorm-blue/50"
                placeholder="Título para compartir en redes sociales"
              />
              <p className="text-gray-400 text-xs mt-1">
                Deja en blanco para usar el título principal
              </p>
            </div>
            
            {/* OG Description */}
            <div className="mb-3">
              <label className="block text-gray-300 text-sm mb-1">Descripción para redes sociales</label>
              <textarea
                value={settings.ogDescription}
                onChange={(e) => updateField('ogDescription', e.target.value)}
                className="w-full bg-codestorm-dark border border-codestorm-blue/30 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-codestorm-blue/50 h-20"
                placeholder="Descripción para compartir en redes sociales"
              />
              <p className="text-gray-400 text-xs mt-1">
                Deja en blanco para usar la descripción principal
              </p>
            </div>
            
            {/* OG Image */}
            <div className="mb-3">
              <label className="block text-gray-300 text-sm mb-1">Imagen para redes sociales</label>
              <input
                type="text"
                value={settings.ogImage}
                onChange={(e) => updateField('ogImage', e.target.value)}
                className="w-full bg-codestorm-dark border border-codestorm-blue/30 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-codestorm-blue/50"
                placeholder="URL de la imagen (1200x630 recomendado)"
              />
            </div>
          </div>
          
          <div className="border-t border-codestorm-blue/20 pt-4">
            <h3 className="text-white text-sm font-medium mb-3 flex items-center">
              <FileText className="h-4 w-4 mr-1 text-codestorm-blue" />
              Configuración avanzada
            </h3>
            
            {/* Canonical URL */}
            <div>
              <label className="block text-gray-300 text-sm mb-1">URL canónica</label>
              <input
                type="text"
                value={settings.canonicalUrl}
                onChange={(e) => updateField('canonicalUrl', e.target.value)}
                className="w-full bg-codestorm-dark border border-codestorm-blue/30 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-codestorm-blue/50"
                placeholder="https://tudominio.com/pagina"
              />
              <p className="text-gray-400 text-xs mt-1">
                URL canónica para evitar contenido duplicado
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        {showSuccess && (
          <div className="text-green-400 text-sm flex items-center">
            <CheckCircle className="h-4 w-4 mr-1" />
            Configuración guardada correctamente
          </div>
        )}
        <button
          onClick={handleSave}
          className="ml-auto bg-codestorm-blue hover:bg-codestorm-blue/80 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
        >
          Guardar configuración SEO
        </button>
      </div>
    </div>
  );
};

export default SEOSettings;
