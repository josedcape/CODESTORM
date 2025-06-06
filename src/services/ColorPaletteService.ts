export interface ColorPalette {
  name: string;
  category: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    accent: string;
  };
  neutral: {
    light: string;
    medium: string;
    dark: string;
  };
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  variations: {
    primaryLight: string;
    primaryDark: string;
    secondaryLight: string;
    secondaryDark: string;
    accentLight: string;
    accentDark: string;
  };
}

export interface ColorDetectionResult {
  detectedColors: string[];
  colorDescriptions: string[];
  suggestedCategory: string;
  confidence: number;
}

/**
 * Servicio para gestión avanzada de paletas de colores profesionales
 * Especializado en detección inteligente y aplicación consistente de colores
 */
export class ColorPaletteService {

  /**
   * Paletas profesionales categorizadas por industria
   */
  private static readonly PROFESSIONAL_PALETTES: ColorPalette[] = [
    // TECNOLOGÍA
    {
      name: "Tech Blue",
      category: "tecnologia",
      description: "Paleta moderna para empresas tecnológicas",
      primary: "#2563eb",
      secondary: "#1e40af",
      accent: "#3b82f6",
      background: "#f8fafc",
      surface: "#ffffff",
      text: {
        primary: "#1e293b",
        secondary: "#475569",
        accent: "#2563eb"
      },
      neutral: {
        light: "#f1f5f9",
        medium: "#64748b",
        dark: "#334155"
      },
      semantic: {
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6"
      },
      variations: {
        primaryLight: "#60a5fa",
        primaryDark: "#1d4ed8",
        secondaryLight: "#3b82f6",
        secondaryDark: "#1e3a8a",
        accentLight: "#93c5fd",
        accentDark: "#2563eb"
      }
    },
    {
      name: "Cyber Purple",
      category: "tecnologia",
      description: "Paleta futurista para startups y tech innovadoras",
      primary: "#8b5cf6",
      secondary: "#7c3aed",
      accent: "#a78bfa",
      background: "#faf7ff",
      surface: "#ffffff",
      text: {
        primary: "#1f2937",
        secondary: "#4b5563",
        accent: "#8b5cf6"
      },
      neutral: {
        light: "#f3f4f6",
        medium: "#6b7280",
        dark: "#374151"
      },
      semantic: {
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#8b5cf6"
      },
      variations: {
        primaryLight: "#c4b5fd",
        primaryDark: "#6d28d9",
        secondaryLight: "#a78bfa",
        secondaryDark: "#5b21b6",
        accentLight: "#ddd6fe",
        accentDark: "#8b5cf6"
      }
    },

    // SALUD
    {
      name: "Medical Green",
      category: "salud",
      description: "Paleta confiable para servicios médicos y salud",
      primary: "#059669",
      secondary: "#047857",
      accent: "#10b981",
      background: "#f0fdf4",
      surface: "#ffffff",
      text: {
        primary: "#064e3b",
        secondary: "#065f46",
        accent: "#059669"
      },
      neutral: {
        light: "#f7fef8",
        medium: "#6b7280",
        dark: "#374151"
      },
      semantic: {
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6"
      },
      variations: {
        primaryLight: "#34d399",
        primaryDark: "#065f46",
        secondaryLight: "#10b981",
        secondaryDark: "#064e3b",
        accentLight: "#6ee7b7",
        accentDark: "#047857"
      }
    },

    // RESTAURANTES
    {
      name: "Warm Orange",
      category: "restaurantes",
      description: "Paleta cálida y apetitosa para restaurantes",
      primary: "#ea580c",
      secondary: "#dc2626",
      accent: "#f97316",
      background: "#fffbeb",
      surface: "#ffffff",
      text: {
        primary: "#9a3412",
        secondary: "#c2410c",
        accent: "#ea580c"
      },
      neutral: {
        light: "#fef3c7",
        medium: "#92400e",
        dark: "#451a03"
      },
      semantic: {
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6"
      },
      variations: {
        primaryLight: "#fb923c",
        primaryDark: "#c2410c",
        secondaryLight: "#f87171",
        secondaryDark: "#991b1b",
        accentLight: "#fdba74",
        accentDark: "#ea580c"
      }
    },
    {
      name: "Elegant Gold",
      category: "restaurantes",
      description: "Paleta elegante para restaurantes de alta gama",
      primary: "#d97706",
      secondary: "#92400e",
      accent: "#f59e0b",
      background: "#fffbeb",
      surface: "#ffffff",
      text: {
        primary: "#78350f",
        secondary: "#92400e",
        accent: "#d97706"
      },
      neutral: {
        light: "#fef3c7",
        medium: "#a16207",
        dark: "#451a03"
      },
      semantic: {
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6"
      },
      variations: {
        primaryLight: "#fbbf24",
        primaryDark: "#78350f",
        secondaryLight: "#d97706",
        secondaryDark: "#451a03",
        accentLight: "#fcd34d",
        accentDark: "#92400e"
      }
    },

    // FINANZAS
    {
      name: "Trust Blue",
      category: "finanzas",
      description: "Paleta confiable para servicios financieros",
      primary: "#1e40af",
      secondary: "#1e3a8a",
      accent: "#3b82f6",
      background: "#f8fafc",
      surface: "#ffffff",
      text: {
        primary: "#1e3a8a",
        secondary: "#3730a3",
        accent: "#1e40af"
      },
      neutral: {
        light: "#f1f5f9",
        medium: "#64748b",
        dark: "#1e293b"
      },
      semantic: {
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6"
      },
      variations: {
        primaryLight: "#60a5fa",
        primaryDark: "#1e3a8a",
        secondaryLight: "#3b82f6",
        secondaryDark: "#312e81",
        accentLight: "#93c5fd",
        accentDark: "#1d4ed8"
      }
    },

    // EDUCACIÓN
    {
      name: "Academic Blue",
      category: "educacion",
      description: "Paleta profesional para instituciones educativas",
      primary: "#2563eb",
      secondary: "#1d4ed8",
      accent: "#60a5fa",
      background: "#f8fafc",
      surface: "#ffffff",
      text: {
        primary: "#1e293b",
        secondary: "#475569",
        accent: "#2563eb"
      },
      neutral: {
        light: "#f1f5f9",
        medium: "#64748b",
        dark: "#334155"
      },
      semantic: {
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6"
      },
      variations: {
        primaryLight: "#93c5fd",
        primaryDark: "#1e3a8a",
        secondaryLight: "#60a5fa",
        secondaryDark: "#1e40af",
        accentLight: "#dbeafe",
        accentDark: "#2563eb"
      }
    },

    // ARTE Y CREATIVIDAD
    {
      name: "Creative Purple",
      category: "arte",
      description: "Paleta vibrante para estudios creativos y arte",
      primary: "#9333ea",
      secondary: "#7c3aed",
      accent: "#a855f7",
      background: "#faf5ff",
      surface: "#ffffff",
      text: {
        primary: "#581c87",
        secondary: "#6b21a8",
        accent: "#9333ea"
      },
      neutral: {
        light: "#f3e8ff",
        medium: "#8b5cf6",
        dark: "#4c1d95"
      },
      semantic: {
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#9333ea"
      },
      variations: {
        primaryLight: "#c084fc",
        primaryDark: "#6b21a8",
        secondaryLight: "#a855f7",
        secondaryDark: "#581c87",
        accentLight: "#ddd6fe",
        accentDark: "#7c3aed"
      }
    },

    // DEPORTES
    {
      name: "Energy Red",
      category: "deportes",
      description: "Paleta energética para gimnasios y deportes",
      primary: "#dc2626",
      secondary: "#b91c1c",
      accent: "#ef4444",
      background: "#fef2f2",
      surface: "#ffffff",
      text: {
        primary: "#991b1b",
        secondary: "#b91c1c",
        accent: "#dc2626"
      },
      neutral: {
        light: "#fee2e2",
        medium: "#6b7280",
        dark: "#374151"
      },
      semantic: {
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6"
      },
      variations: {
        primaryLight: "#f87171",
        primaryDark: "#7f1d1d",
        secondaryLight: "#ef4444",
        secondaryDark: "#991b1b",
        accentLight: "#fca5a5",
        accentDark: "#b91c1c"
      }
    },

    // ECOLOGÍA
    {
      name: "Nature Green",
      category: "ecologia",
      description: "Paleta natural para empresas ecológicas",
      primary: "#16a34a",
      secondary: "#15803d",
      accent: "#22c55e",
      background: "#f0fdf4",
      surface: "#ffffff",
      text: {
        primary: "#14532d",
        secondary: "#166534",
        accent: "#16a34a"
      },
      neutral: {
        light: "#dcfce7",
        medium: "#6b7280",
        dark: "#374151"
      },
      semantic: {
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6"
      },
      variations: {
        primaryLight: "#4ade80",
        primaryDark: "#15803d",
        secondaryLight: "#22c55e",
        secondaryDark: "#14532d",
        accentLight: "#86efac",
        accentDark: "#166534"
      }
    }
  ];

  /**
   * Palabras clave para detección de colores
   */
  private static readonly COLOR_KEYWORDS = {
    azul: ["azul", "blue", "celeste", "marino", "navy", "cyan"],
    rojo: ["rojo", "red", "carmesí", "escarlata", "bermejo"],
    verde: ["verde", "green", "esmeralda", "lima", "oliva"],
    amarillo: ["amarillo", "yellow", "dorado", "gold", "ámbar"],
    naranja: ["naranja", "orange", "mandarina", "calabaza"],
    morado: ["morado", "purple", "violeta", "púrpura", "lila"],
    rosa: ["rosa", "pink", "fucsia", "magenta"],
    negro: ["negro", "black", "carbón", "ébano"],
    blanco: ["blanco", "white", "marfil", "crema"],
    gris: ["gris", "gray", "grey", "plata", "silver"]
  };

  /**
   * Descriptores de color para detección avanzada
   */
  private static readonly COLOR_DESCRIPTORS = {
    calidos: ["cálidos", "warm", "calientes", "acogedores"],
    frios: ["fríos", "cool", "frescos", "helados"],
    vibrantes: ["vibrantes", "vibrant", "brillantes", "intensos"],
    suaves: ["suaves", "soft", "pastel", "tenues"],
    oscuros: ["oscuros", "dark", "profundos", "sombríos"],
    claros: ["claros", "light", "luminosos", "brillantes"],
    tierra: ["tierra", "earth", "naturales", "terrosos"],
    neon: ["neón", "neon", "fluorescentes", "eléctricos"]
  };

  /**
   * Asociaciones de industria con categorías de color
   */
  private static readonly INDUSTRY_ASSOCIATIONS = {
    tecnologia: ["tech", "software", "app", "digital", "startup", "innovación"],
    salud: ["médico", "hospital", "clínica", "salud", "doctor", "farmacia"],
    restaurantes: ["restaurante", "comida", "cocina", "chef", "gastronomía", "café"],
    finanzas: ["banco", "finanzas", "inversión", "seguros", "contabilidad"],
    educacion: ["escuela", "universidad", "educación", "academia", "curso"],
    arte: ["arte", "diseño", "creativo", "galería", "estudio", "artista"],
    deportes: ["gimnasio", "deporte", "fitness", "entrenamiento", "atlético"],
    ecologia: ["ecológico", "verde", "sostenible", "natural", "orgánico", "bio"]
  };

  /**
   * Detecta colores e industria en una instrucción de usuario
   * @param instruction Instrucción del usuario
   * @returns Resultado de detección de colores
   */
  static detectColorsInInstruction(instruction: string): ColorDetectionResult {
    const lowerInstruction = instruction.toLowerCase();
    const detectedColors: string[] = [];
    const colorDescriptions: string[] = [];
    let suggestedCategory = "tecnologia"; // Default
    let confidence = 0;

    // Detectar colores específicos
    Object.entries(this.COLOR_KEYWORDS).forEach(([color, keywords]) => {
      if (keywords.some(keyword => lowerInstruction.includes(keyword))) {
        detectedColors.push(color);
        confidence += 0.3;
      }
    });

    // Detectar descriptores de color
    Object.entries(this.COLOR_DESCRIPTORS).forEach(([descriptor, keywords]) => {
      if (keywords.some(keyword => lowerInstruction.includes(keyword))) {
        colorDescriptions.push(descriptor);
        confidence += 0.2;
      }
    });

    // Detectar industria/categoría
    Object.entries(this.INDUSTRY_ASSOCIATIONS).forEach(([industry, keywords]) => {
      if (keywords.some(keyword => lowerInstruction.includes(keyword))) {
        suggestedCategory = industry;
        confidence += 0.4;
      }
    });

    return {
      detectedColors,
      colorDescriptions,
      suggestedCategory,
      confidence: Math.min(confidence, 1.0)
    };
  }

  /**
   * Obtiene paletas por categoría
   * @param category Categoría de industria
   * @returns Array de paletas para la categoría
   */
  static getPalettesByCategory(category: string): ColorPalette[] {
    return this.PROFESSIONAL_PALETTES.filter(palette => palette.category === category);
  }

  /**
   * Obtiene una paleta específica por nombre
   * @param name Nombre de la paleta
   * @returns Paleta encontrada o undefined
   */
  static getPaletteByName(name: string): ColorPalette | undefined {
    return this.PROFESSIONAL_PALETTES.find(palette => palette.name === name);
  }

  /**
   * Sugiere la mejor paleta basada en detección de colores
   * @param detection Resultado de detección de colores
   * @returns Paleta sugerida
   */
  static suggestPalette(detection: ColorDetectionResult): ColorPalette {
    // Obtener paletas de la categoría detectada
    const categoryPalettes = this.getPalettesByCategory(detection.suggestedCategory);

    if (categoryPalettes.length === 0) {
      // Fallback a tecnología si no hay paletas para la categoría
      return this.PROFESSIONAL_PALETTES[0];
    }

    // Si se detectaron colores específicos, buscar paleta que los contenga
    if (detection.detectedColors.length > 0) {
      const primaryColor = detection.detectedColors[0];

      // Mapear colores detectados a paletas específicas
      const colorToPalette: { [key: string]: string } = {
        azul: "Tech Blue",
        morado: "Cyber Purple",
        verde: "Medical Green",
        naranja: "Warm Orange",
        amarillo: "Elegant Gold",
        rojo: "Energy Red"
      };

      const suggestedPaletteName = colorToPalette[primaryColor];
      if (suggestedPaletteName) {
        const suggestedPalette = this.getPaletteByName(suggestedPaletteName);
        if (suggestedPalette && suggestedPalette.category === detection.suggestedCategory) {
          return suggestedPalette;
        }
      }
    }

    // Retornar la primera paleta de la categoría
    return categoryPalettes[0];
  }

  /**
   * Genera variables CSS para una paleta
   * @param palette Paleta de colores
   * @returns String con variables CSS
   */
  static generateCSSVariables(palette: ColorPalette): string {
    return `
/* ${palette.name} - ${palette.description} */
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
}`;
  }

  /**
   * Obtiene todas las categorías disponibles
   * @returns Array de categorías
   */
  static getAvailableCategories(): string[] {
    return [...new Set(this.PROFESSIONAL_PALETTES.map(p => p.category))];
  }

  /**
   * Obtiene todas las paletas disponibles
   * @returns Array de todas las paletas
   */
  static getAllPalettes(): ColorPalette[] {
    return [...this.PROFESSIONAL_PALETTES];
  }
}
