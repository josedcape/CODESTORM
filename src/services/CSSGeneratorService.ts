import { ColorPalette } from './ColorPaletteService';

export interface CSSGenerationOptions {
  includeAnimations: boolean;
  includeHoverEffects: boolean;
  includeGradients: boolean;
  includeShadows: boolean;
  responsiveBreakpoints: boolean;
  accessibilityOptimized: boolean;
}

/**
 * Servicio para generación de CSS optimizado con paletas de colores
 * Especializado en crear estilos consistentes y accesibles
 */
export class CSSGeneratorService {

  /**
   * Genera CSS completo para una paleta de colores
   * @param palette Paleta de colores
   * @param options Opciones de generación
   * @returns CSS completo optimizado
   */
  static generateCompleteCSS(palette: ColorPalette, options: CSSGenerationOptions = {
    includeAnimations: true,
    includeHoverEffects: true,
    includeGradients: true,
    includeShadows: true,
    responsiveBreakpoints: true,
    accessibilityOptimized: true
  }): string {
    
    const sections = [
      this.generateCSSVariables(palette),
      this.generateResetStyles(),
      this.generateBaseStyles(palette),
      this.generateLayoutStyles(palette),
      this.generateComponentStyles(palette, options),
      this.generateUtilityClasses(palette),
      options.includeAnimations ? this.generateAnimations() : '',
      options.responsiveBreakpoints ? this.generateResponsiveStyles(palette) : ''
    ];

    return sections.filter(section => section.trim()).join('\n\n');
  }

  /**
   * Genera variables CSS para la paleta
   * @param palette Paleta de colores
   * @returns Variables CSS
   */
  private static generateCSSVariables(palette: ColorPalette): string {
    return `
/* ===== VARIABLES DE COLOR - ${palette.name} ===== */
:root {
  /* Colores principales */
  --color-primary: ${palette.primary};
  --color-secondary: ${palette.secondary};
  --color-accent: ${palette.accent};
  
  /* Fondos */
  --color-background: ${palette.background};
  --color-surface: ${palette.surface};
  
  /* Textos */
  --color-text-primary: ${palette.text.primary};
  --color-text-secondary: ${palette.text.secondary};
  --color-text-accent: ${palette.text.accent};
  
  /* Neutros */
  --color-neutral-light: ${palette.neutral.light};
  --color-neutral-medium: ${palette.neutral.medium};
  --color-neutral-dark: ${palette.neutral.dark};
  
  /* Semánticos */
  --color-success: ${palette.semantic.success};
  --color-warning: ${palette.semantic.warning};
  --color-error: ${palette.semantic.error};
  --color-info: ${palette.semantic.info};
  
  /* Variaciones */
  --color-primary-light: ${palette.variations.primaryLight};
  --color-primary-dark: ${palette.variations.primaryDark};
  --color-secondary-light: ${palette.variations.secondaryLight};
  --color-secondary-dark: ${palette.variations.secondaryDark};
  --color-accent-light: ${palette.variations.accentLight};
  --color-accent-dark: ${palette.variations.accentDark};
  
  /* Sombras */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* Transiciones */
  --transition-fast: 0.15s ease-in-out;
  --transition-normal: 0.3s ease-in-out;
  --transition-slow: 0.5s ease-in-out;
  
  /* Espaciado */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  
  /* Bordes */
  --border-radius-sm: 0.25rem;
  --border-radius-md: 0.5rem;
  --border-radius-lg: 0.75rem;
  --border-radius-xl: 1rem;
}`;
  }

  /**
   * Genera estilos de reset CSS
   * @returns CSS reset
   */
  private static generateResetStyles(): string {
    return `
/* ===== RESET CSS ===== */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  line-height: 1.15;
  -webkit-text-size-adjust: 100%;
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
}

input, button, textarea, select {
  font: inherit;
}

p, h1, h2, h3, h4, h5, h6 {
  overflow-wrap: break-word;
}`;
  }

  /**
   * Genera estilos base del documento
   * @param palette Paleta de colores
   * @returns Estilos base
   */
  private static generateBaseStyles(palette: ColorPalette): string {
    return `
/* ===== ESTILOS BASE ===== */
body {
  background-color: var(--color-background);
  color: var(--color-text-primary);
  line-height: 1.6;
  font-size: 16px;
}

/* Tipografía */
h1, h2, h3, h4, h5, h6 {
  color: var(--color-text-primary);
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: var(--spacing-md);
}

h1 { font-size: 2.5rem; }
h2 { font-size: 2rem; }
h3 { font-size: 1.75rem; }
h4 { font-size: 1.5rem; }
h5 { font-size: 1.25rem; }
h6 { font-size: 1.125rem; }

p {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-secondary);
}

a {
  color: var(--color-accent);
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--color-accent-dark);
  text-decoration: underline;
}

a:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}`;
  }

  /**
   * Genera estilos de layout
   * @param palette Paleta de colores
   * @returns Estilos de layout
   */
  private static generateLayoutStyles(palette: ColorPalette): string {
    return `
/* ===== LAYOUT ===== */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

.section {
  padding: var(--spacing-2xl) 0;
}

.grid {
  display: grid;
  gap: var(--spacing-lg);
}

.flex {
  display: flex;
  gap: var(--spacing-md);
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

/* Header */
header {
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-neutral-light);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

/* Navigation */
nav ul {
  list-style: none;
  display: flex;
  gap: var(--spacing-lg);
  align-items: center;
}

nav a {
  color: var(--color-text-primary);
  font-weight: 500;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
}

nav a:hover {
  background-color: var(--color-primary);
  color: white;
  text-decoration: none;
}

/* Footer */
footer {
  background-color: var(--color-text-primary);
  color: var(--color-neutral-light);
  padding: var(--spacing-2xl) 0;
  margin-top: var(--spacing-2xl);
}`;
  }

  /**
   * Genera estilos de componentes
   * @param palette Paleta de colores
   * @param options Opciones de generación
   * @returns Estilos de componentes
   */
  private static generateComponentStyles(palette: ColorPalette, options: CSSGenerationOptions): string {
    const hoverEffects = options.includeHoverEffects;
    const gradients = options.includeGradients;
    const shadows = options.includeShadows;

    return `
/* ===== COMPONENTES ===== */

/* Botones */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-md);
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 44px; /* Accesibilidad táctil */
  ${shadows ? 'box-shadow: var(--shadow-sm);' : ''}
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
  ${gradients ? `background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));` : ''}
}

${hoverEffects ? `
.btn-primary:hover {
  background-color: var(--color-primary-dark);
  ${shadows ? 'box-shadow: var(--shadow-md);' : ''}
  transform: translateY(-1px);
}
` : ''}

.btn-secondary {
  background-color: var(--color-secondary);
  color: white;
}

${hoverEffects ? `
.btn-secondary:hover {
  background-color: var(--color-secondary-dark);
  ${shadows ? 'box-shadow: var(--shadow-md);' : ''}
}
` : ''}

.btn-outline {
  background-color: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

${hoverEffects ? `
.btn-outline:hover {
  background-color: var(--color-primary);
  color: white;
}
` : ''}

/* Cards */
.card {
  background-color: var(--color-surface);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  ${shadows ? 'box-shadow: var(--shadow-md);' : ''}
  transition: all var(--transition-normal);
}

${hoverEffects ? `
.card:hover {
  ${shadows ? 'box-shadow: var(--shadow-lg);' : ''}
  transform: translateY(-2px);
}
` : ''}

/* Formularios */
.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-primary);
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--color-neutral-light);
  border-radius: var(--border-radius-md);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
  min-height: 44px; /* Accesibilidad táctil */
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(${this.hexToRgb(palette.primary)}, 0.1);
}

/* Hero Section */
.hero {
  background: ${gradients ? `linear-gradient(135deg, var(--color-primary), var(--color-secondary))` : 'var(--color-primary)'};
  color: white;
  padding: var(--spacing-2xl) 0;
  text-align: center;
}

.hero h1 {
  color: white;
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
}

.hero p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.25rem;
  margin-bottom: var(--spacing-xl);
}`;
  }

  /**
   * Genera clases de utilidad
   * @param palette Paleta de colores
   * @returns Clases de utilidad
   */
  private static generateUtilityClasses(palette: ColorPalette): string {
    return `
/* ===== UTILIDADES ===== */

/* Colores de texto */
.text-primary { color: var(--color-primary) !important; }
.text-secondary { color: var(--color-secondary) !important; }
.text-accent { color: var(--color-accent) !important; }
.text-success { color: var(--color-success) !important; }
.text-warning { color: var(--color-warning) !important; }
.text-error { color: var(--color-error) !important; }

/* Colores de fondo */
.bg-primary { background-color: var(--color-primary) !important; }
.bg-secondary { background-color: var(--color-secondary) !important; }
.bg-accent { background-color: var(--color-accent) !important; }
.bg-surface { background-color: var(--color-surface) !important; }
.bg-neutral-light { background-color: var(--color-neutral-light) !important; }

/* Espaciado */
.m-0 { margin: 0 !important; }
.m-1 { margin: var(--spacing-xs) !important; }
.m-2 { margin: var(--spacing-sm) !important; }
.m-3 { margin: var(--spacing-md) !important; }
.m-4 { margin: var(--spacing-lg) !important; }
.m-5 { margin: var(--spacing-xl) !important; }

.p-0 { padding: 0 !important; }
.p-1 { padding: var(--spacing-xs) !important; }
.p-2 { padding: var(--spacing-sm) !important; }
.p-3 { padding: var(--spacing-md) !important; }
.p-4 { padding: var(--spacing-lg) !important; }
.p-5 { padding: var(--spacing-xl) !important; }

/* Bordes */
.rounded { border-radius: var(--border-radius-md) !important; }
.rounded-lg { border-radius: var(--border-radius-lg) !important; }
.rounded-full { border-radius: 50% !important; }

/* Sombras */
.shadow-sm { box-shadow: var(--shadow-sm) !important; }
.shadow-md { box-shadow: var(--shadow-md) !important; }
.shadow-lg { box-shadow: var(--shadow-lg) !important; }`;
  }

  /**
   * Genera animaciones CSS
   * @returns Animaciones CSS
   */
  private static generateAnimations(): string {
    return `
/* ===== ANIMACIONES ===== */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.animate-fade-in { animation: fadeIn 0.6s ease-out; }
.animate-slide-in-left { animation: slideInLeft 0.6s ease-out; }
.animate-slide-in-right { animation: slideInRight 0.6s ease-out; }
.animate-pulse { animation: pulse 2s infinite; }`;
  }

  /**
   * Genera estilos responsive
   * @param palette Paleta de colores
   * @returns Estilos responsive
   */
  private static generateResponsiveStyles(palette: ColorPalette): string {
    return `
/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .container {
    padding: 0 var(--spacing-sm);
  }
  
  .hero h1 {
    font-size: 2rem;
  }
  
  .hero p {
    font-size: 1rem;
  }
  
  nav ul {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .grid {
    grid-template-columns: 1fr;
  }
  
  .flex {
    flex-direction: column;
  }
}

@media (min-width: 769px) {
  .grid-2 { grid-template-columns: repeat(2, 1fr); }
  .grid-3 { grid-template-columns: repeat(3, 1fr); }
  .grid-4 { grid-template-columns: repeat(4, 1fr); }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 var(--spacing-lg);
  }
}`;
  }

  /**
   * Convierte hex a RGB
   * @param hex Color en formato hex
   * @returns Color en formato RGB
   */
  private static hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0, 0, 0';
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `${r}, ${g}, ${b}`;
  }
}
