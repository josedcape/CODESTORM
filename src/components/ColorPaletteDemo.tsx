import React, { useState } from 'react';
import { ColorPaletteService, ColorPalette } from '../services/ColorPaletteService';
import { Palette, Eye, Copy, Check } from 'lucide-react';

interface ColorPaletteDemoProps {
  onPaletteSelect?: (palette: ColorPalette) => void;
  showDemo?: boolean;
}

/**
 * Componente de demostración para mostrar las paletas de colores disponibles
 * y permitir al usuario probar la detección inteligente de colores
 */
const ColorPaletteDemo: React.FC<ColorPaletteDemoProps> = ({ 
  onPaletteSelect, 
  showDemo = false 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('tecnologia');
  const [testInstruction, setTestInstruction] = useState('');
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const categories = ColorPaletteService.getAvailableCategories();
  const allPalettes = ColorPaletteService.getAllPalettes();
  const categoryPalettes = ColorPaletteService.getPalettesByCategory(selectedCategory);

  // Probar detección de colores
  const testColorDetection = () => {
    if (!testInstruction.trim()) return;
    
    const detection = ColorPaletteService.detectColorsInInstruction(testInstruction);
    const suggestedPalette = ColorPaletteService.suggestPalette(detection);
    
    setDetectionResult({
      detection,
      suggestedPalette
    });
  };

  // Copiar color al portapapeles
  const copyColor = (color: string) => {
    navigator.clipboard.writeText(color).then(() => {
      setCopiedColor(color);
      setTimeout(() => setCopiedColor(null), 2000);
    });
  };

  // Renderizar muestra de color
  const renderColorSwatch = (color: string, label: string) => (
    <div 
      key={label}
      className="flex items-center space-x-2 p-2 rounded-md hover:bg-codestorm-blue/10 cursor-pointer transition-colors"
      onClick={() => copyColor(color)}
      title={`Copiar ${color}`}
    >
      <div 
        className="w-6 h-6 rounded border border-gray-300 shadow-sm"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1">
        <div className="text-xs font-medium text-white">{label}</div>
        <div className="text-xs text-gray-400">{color}</div>
      </div>
      {copiedColor === color ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4 text-gray-400" />
      )}
    </div>
  );

  if (!showDemo) {
    return null;
  }

  return (
    <div className="bg-codestorm-darker rounded-lg p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Palette className="w-5 h-5 text-codestorm-gold" />
        <h3 className="text-lg font-semibold text-white">Sistema de Paletas Profesionales</h3>
      </div>

      {/* Prueba de detección de colores */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-white">🎯 Prueba la Detección Inteligente</h4>
        <div className="space-y-3">
          <textarea
            value={testInstruction}
            onChange={(e) => setTestInstruction(e.target.value)}
            placeholder="Escribe una instrucción como: 'crear sitio web azul para restaurante' o 'página verde para clínica médica'"
            className="w-full p-3 bg-codestorm-dark border border-codestorm-blue/30 rounded-md text-white placeholder-gray-400 resize-none"
            rows={2}
          />
          <button
            onClick={testColorDetection}
            disabled={!testInstruction.trim()}
            className="px-4 py-2 bg-codestorm-accent hover:bg-codestorm-accent/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          >
            Detectar Colores
          </button>
        </div>

        {/* Resultado de detección */}
        {detectionResult && (
          <div className="bg-codestorm-blue/20 rounded-md p-4 space-y-3">
            <h5 className="font-medium text-white">Resultado de Detección:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-300">Colores detectados:</div>
                <div className="text-white">{detectionResult.detection.detectedColors.join(', ') || 'Ninguno específico'}</div>
              </div>
              <div>
                <div className="text-gray-300">Categoría sugerida:</div>
                <div className="text-white">{detectionResult.detection.suggestedCategory}</div>
              </div>
              <div>
                <div className="text-gray-300">Confianza:</div>
                <div className="text-white">{(detectionResult.detection.confidence * 100).toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-gray-300">Paleta sugerida:</div>
                <div className="text-codestorm-gold font-medium">{detectionResult.suggestedPalette.name}</div>
              </div>
            </div>
            
            {/* Vista previa de la paleta sugerida */}
            <div className="mt-4">
              <div className="text-sm text-gray-300 mb-2">Vista previa de la paleta:</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {renderColorSwatch(detectionResult.suggestedPalette.primary, 'Primario')}
                {renderColorSwatch(detectionResult.suggestedPalette.secondary, 'Secundario')}
                {renderColorSwatch(detectionResult.suggestedPalette.accent, 'Acento')}
                {renderColorSwatch(detectionResult.suggestedPalette.background, 'Fondo')}
                {renderColorSwatch(detectionResult.suggestedPalette.text.primary, 'Texto')}
                {renderColorSwatch(detectionResult.suggestedPalette.neutral.medium, 'Neutro')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selector de categorías */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-white">🎨 Explorar Paletas por Categoría</h4>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-codestorm-accent text-white'
                  : 'bg-codestorm-blue/20 text-gray-300 hover:bg-codestorm-blue/30'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Paletas de la categoría seleccionada */}
      <div className="space-y-4">
        <h5 className="text-sm font-medium text-white">
          Paletas para {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}:
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryPalettes.map(palette => (
            <div 
              key={palette.name}
              className="bg-codestorm-blue/10 rounded-md p-4 space-y-3 hover:bg-codestorm-blue/20 transition-colors cursor-pointer"
              onClick={() => onPaletteSelect?.(palette)}
            >
              <div className="flex items-center justify-between">
                <h6 className="font-medium text-white">{palette.name}</h6>
                <Eye className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-300">{palette.description}</p>
              
              {/* Muestra de colores principales */}
              <div className="flex space-x-2">
                <div 
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: palette.primary }}
                  title={`Primario: ${palette.primary}`}
                />
                <div 
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: palette.secondary }}
                  title={`Secundario: ${palette.secondary}`}
                />
                <div 
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: palette.accent }}
                  title={`Acento: ${palette.accent}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="bg-codestorm-blue/10 rounded-md p-4">
        <h5 className="text-sm font-medium text-white mb-2">📊 Estadísticas del Sistema</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-300">Total de paletas:</div>
            <div className="text-white font-medium">{allPalettes.length}</div>
          </div>
          <div>
            <div className="text-gray-300">Categorías:</div>
            <div className="text-white font-medium">{categories.length}</div>
          </div>
          <div>
            <div className="text-gray-300">Colores detectables:</div>
            <div className="text-white font-medium">10+</div>
          </div>
          <div>
            <div className="text-gray-300">Descriptores:</div>
            <div className="text-white font-medium">8+</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPaletteDemo;
