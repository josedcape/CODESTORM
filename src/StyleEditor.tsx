import React, { useState } from 'react';
import { Palette, Type, Layout, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

interface StyleEditorProps {
  onApplyStyles: (styles: any) => void;
}

const StyleEditor: React.FC<StyleEditorProps> = ({ onApplyStyles }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['typography', 'colors']);
  
  // Estado para los estilos
  const [styles, setStyles] = useState({
    typography: {
      fontFamily: 'Inter',
      fontSize: '16px',
      fontWeight: 'normal',
      lineHeight: '1.5',
      textAlign: 'left',
      color: '#ffffff'
    },
    colors: {
      primary: '#3b82f6',
      secondary: '#10b981',
      background: '#0f172a',
      text: '#ffffff',
      accent: '#8b5cf6'
    },
    spacing: {
      padding: '16px',
      margin: '16px',
      borderRadius: '4px'
    },
    layout: {
      width: '100%',
      height: 'auto',
      display: 'block'
    }
  });

  // Alternar la expansión de una sección
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Actualizar un estilo
  const updateStyle = (category: string, property: string, value: string) => {
    setStyles(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [property]: value
      }
    }));
    
    // Aplicar los estilos actualizados
    onApplyStyles({
      ...styles,
      [category]: {
        ...styles[category as keyof typeof styles],
        [property]: value
      }
    });
  };

  // Opciones de fuentes
  const fontOptions = [
    { value: 'Inter', label: 'Inter' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Open Sans', label: 'Open Sans' }
  ];

  // Opciones de peso de fuente
  const fontWeightOptions = [
    { value: 'normal', label: 'Normal' },
    { value: 'medium', label: 'Medium' },
    { value: 'semibold', label: 'Semibold' },
    { value: 'bold', label: 'Bold' }
  ];

  // Opciones de alineación de texto
  const textAlignOptions = [
    { value: 'left', label: 'Izquierda' },
    { value: 'center', label: 'Centro' },
    { value: 'right', label: 'Derecha' },
    { value: 'justify', label: 'Justificado' }
  ];

  return (
    <div className="bg-codestorm-darker rounded-lg shadow-lg p-4 h-full overflow-hidden flex flex-col">
      <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
        <Palette className="h-5 w-5 mr-2 text-codestorm-blue" />
        Editor de estilos
      </h2>
      
      <div className="flex-1 overflow-y-auto pr-1">
        {/* Sección de tipografía */}
        <div className="mb-3">
          <button
            className="w-full flex items-center justify-between bg-codestorm-dark hover:bg-codestorm-dark/70 rounded-md px-3 py-2 text-white text-sm font-medium"
            onClick={() => toggleSection('typography')}
          >
            <div className="flex items-center">
              <Type className="h-4 w-4" />
              <span className="ml-2">Tipografía</span>
            </div>
            {expandedSections.includes('typography') ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
          
          {expandedSections.includes('typography') && (
            <div className="mt-2 space-y-3 px-2">
              <div>
                <label className="block text-gray-300 text-xs mb-1">Fuente</label>
                <select
                  className="w-full bg-codestorm-dark border border-codestorm-blue/30 rounded-md py-1.5 px-3 text-sm text-white"
                  value={styles.typography.fontFamily}
                  onChange={(e) => updateStyle('typography', 'fontFamily', e.target.value)}
                >
                  {fontOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-xs mb-1">Tamaño de fuente</label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="12"
                    max="36"
                    step="1"
                    value={parseInt(styles.typography.fontSize)}
                    onChange={(e) => updateStyle('typography', 'fontSize', `${e.target.value}px`)}
                    className="flex-1 mr-2"
                  />
                  <span className="text-white text-sm">{styles.typography.fontSize}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 text-xs mb-1">Peso de fuente</label>
                <select
                  className="w-full bg-codestorm-dark border border-codestorm-blue/30 rounded-md py-1.5 px-3 text-sm text-white"
                  value={styles.typography.fontWeight}
                  onChange={(e) => updateStyle('typography', 'fontWeight', e.target.value)}
                >
                  {fontWeightOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-xs mb-1">Alineación de texto</label>
                <div className="flex space-x-1">
                  {textAlignOptions.map(option => (
                    <button
                      key={option.value}
                      className={`flex-1 py-1 text-xs rounded-md ${
                        styles.typography.textAlign === option.value
                          ? 'bg-codestorm-blue text-white'
                          : 'bg-codestorm-dark text-gray-300 hover:bg-codestorm-blue/20'
                      }`}
                      onClick={() => updateStyle('typography', 'textAlign', option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 text-xs mb-1">Color de texto</label>
                <div className="flex items-center">
                  <input
                    type="color"
                    value={styles.typography.color}
                    onChange={(e) => updateStyle('typography', 'color', e.target.value)}
                    className="w-8 h-8 rounded-md mr-2 border-0"
                  />
                  <input
                    type="text"
                    value={styles.typography.color}
                    onChange={(e) => updateStyle('typography', 'color', e.target.value)}
                    className="flex-1 bg-codestorm-dark border border-codestorm-blue/30 rounded-md py-1 px-2 text-sm text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Sección de colores */}
        <div className="mb-3">
          <button
            className="w-full flex items-center justify-between bg-codestorm-dark hover:bg-codestorm-dark/70 rounded-md px-3 py-2 text-white text-sm font-medium"
            onClick={() => toggleSection('colors')}
          >
            <div className="flex items-center">
              <Palette className="h-4 w-4" />
              <span className="ml-2">Colores</span>
            </div>
            {expandedSections.includes('colors') ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
          
          {expandedSections.includes('colors') && (
            <div className="mt-2 space-y-3 px-2">
              <div>
                <label className="block text-gray-300 text-xs mb-1">Color primario</label>
                <div className="flex items-center">
                  <input
                    type="color"
                    value={styles.colors.primary}
                    onChange={(e) => updateStyle('colors', 'primary', e.target.value)}
                    className="w-8 h-8 rounded-md mr-2 border-0"
                  />
                  <input
                    type="text"
                    value={styles.colors.primary}
                    onChange={(e) => updateStyle('colors', 'primary', e.target.value)}
                    className="flex-1 bg-codestorm-dark border border-codestorm-blue/30 rounded-md py-1 px-2 text-sm text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 text-xs mb-1">Color secundario</label>
                <div className="flex items-center">
                  <input
                    type="color"
                    value={styles.colors.secondary}
                    onChange={(e) => updateStyle('colors', 'secondary', e.target.value)}
                    className="w-8 h-8 rounded-md mr-2 border-0"
                  />
                  <input
                    type="text"
                    value={styles.colors.secondary}
                    onChange={(e) => updateStyle('colors', 'secondary', e.target.value)}
                    className="flex-1 bg-codestorm-dark border border-codestorm-blue/30 rounded-md py-1 px-2 text-sm text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 text-xs mb-1">Color de fondo</label>
                <div className="flex items-center">
                  <input
                    type="color"
                    value={styles.colors.background}
                    onChange={(e) => updateStyle('colors', 'background', e.target.value)}
                    className="w-8 h-8 rounded-md mr-2 border-0"
                  />
                  <input
                    type="text"
                    value={styles.colors.background}
                    onChange={(e) => updateStyle('colors', 'background', e.target.value)}
                    className="flex-1 bg-codestorm-dark border border-codestorm-blue/30 rounded-md py-1 px-2 text-sm text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 text-xs mb-1">Color de acento</label>
                <div className="flex items-center">
                  <input
                    type="color"
                    value={styles.colors.accent}
                    onChange={(e) => updateStyle('colors', 'accent', e.target.value)}
                    className="w-8 h-8 rounded-md mr-2 border-0"
                  />
                  <input
                    type="text"
                    value={styles.colors.accent}
                    onChange={(e) => updateStyle('colors', 'accent', e.target.value)}
                    className="flex-1 bg-codestorm-dark border border-codestorm-blue/30 rounded-md py-1 px-2 text-sm text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Sección de espaciado */}
        <div className="mb-3">
          <button
            className="w-full flex items-center justify-between bg-codestorm-dark hover:bg-codestorm-dark/70 rounded-md px-3 py-2 text-white text-sm font-medium"
            onClick={() => toggleSection('spacing')}
          >
            <div className="flex items-center">
              <ArrowRight className="h-4 w-4" />
              <span className="ml-2">Espaciado</span>
            </div>
            {expandedSections.includes('spacing') ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
          
          {expandedSections.includes('spacing') && (
            <div className="mt-2 space-y-3 px-2">
              <div>
                <label className="block text-gray-300 text-xs mb-1">Padding</label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="64"
                    step="4"
                    value={parseInt(styles.spacing.padding)}
                    onChange={(e) => updateStyle('spacing', 'padding', `${e.target.value}px`)}
                    className="flex-1 mr-2"
                  />
                  <span className="text-white text-sm">{styles.spacing.padding}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 text-xs mb-1">Margin</label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="64"
                    step="4"
                    value={parseInt(styles.spacing.margin)}
                    onChange={(e) => updateStyle('spacing', 'margin', `${e.target.value}px`)}
                    className="flex-1 mr-2"
                  />
                  <span className="text-white text-sm">{styles.spacing.margin}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 text-xs mb-1">Border Radius</label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="1"
                    value={parseInt(styles.spacing.borderRadius)}
                    onChange={(e) => updateStyle('spacing', 'borderRadius', `${e.target.value}px`)}
                    className="flex-1 mr-2"
                  />
                  <span className="text-white text-sm">{styles.spacing.borderRadius}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Sección de layout */}
        <div className="mb-3">
          <button
            className="w-full flex items-center justify-between bg-codestorm-dark hover:bg-codestorm-dark/70 rounded-md px-3 py-2 text-white text-sm font-medium"
            onClick={() => toggleSection('layout')}
          >
            <div className="flex items-center">
              <Layout className="h-4 w-4" />
              <span className="ml-2">Layout</span>
            </div>
            {expandedSections.includes('layout') ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
          
          {expandedSections.includes('layout') && (
            <div className="mt-2 space-y-3 px-2">
              <div>
                <label className="block text-gray-300 text-xs mb-1">Ancho</label>
                <select
                  className="w-full bg-codestorm-dark border border-codestorm-blue/30 rounded-md py-1.5 px-3 text-sm text-white"
                  value={styles.layout.width}
                  onChange={(e) => updateStyle('layout', 'width', e.target.value)}
                >
                  <option value="100%">100% (Completo)</option>
                  <option value="75%">75%</option>
                  <option value="50%">50%</option>
                  <option value="25%">25%</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-xs mb-1">Display</label>
                <select
                  className="w-full bg-codestorm-dark border border-codestorm-blue/30 rounded-md py-1.5 px-3 text-sm text-white"
                  value={styles.layout.display}
                  onChange={(e) => updateStyle('layout', 'display', e.target.value)}
                >
                  <option value="block">Block</option>
                  <option value="flex">Flex</option>
                  <option value="grid">Grid</option>
                  <option value="inline-block">Inline Block</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StyleEditor;
