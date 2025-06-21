/**
 * Tipos para el sistema de plantillas de tecnología expandido
 */

export type DifficultyLevel = 'Fácil' | 'Moderado' | 'Avanzado';
export type ModernityStatus = 'Reciente' | 'Establecido' | 'Legacy';
export type ProjectType = 'Web' | 'Mobile' | 'Enterprise' | 'Startup' | 'API' | 'Desktop';

export interface PerformanceMetrics {
  loadTime: string;
  buildTime: string;
  bundleSize: string;
  memoryUsage: string;
}

export interface CommunityData {
  githubStars: string;
  npmDownloads: string;
  stackOverflowQuestions: string;
  jobMarket: string;
}

export interface TechnologyStack {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  
  // Información visual
  image: string;
  icon: string;
  primaryColor: string;
  secondaryColor: string;
  
  // Métricas de evaluación
  implementationEase: number; // 1-5 estrellas
  uiQuality: number; // 1-5 estrellas
  modernityStatus: ModernityStatus;
  lastUpdate: string;
  
  // Características técnicas
  difficultyLevel: DifficultyLevel;
  learningCurve: string;
  popularity: string; // % de adopción en 2024
  performance: PerformanceMetrics;
  community: CommunityData;
  
  // Casos de uso
  recommendedFor: ProjectType[];
  useCases: string[];
  successCases: string[];
  
  // Tecnologías incluidas
  technologies: {
    name: string;
    role: string;
    version?: string;
  }[];
  
  // Ventajas y desventajas
  advantages: string[];
  disadvantages: string[];
  
  // Requisitos
  prerequisites: string[];
  systemRequirements: string[];
  
  // Información adicional
  documentation: string;
  tutorials: string[];
  officialWebsite: string;
  
  // Para integración con el constructor
  templateId?: string;
  setupInstructions: string[];
  initialFiles: {
    path: string;
    content: string;
    description: string;
  }[];
}

export interface StackCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  stacks: TechnologyStack[];
}

export interface StackFilter {
  type: ProjectType | 'all';
  difficulty: DifficultyLevel | 'all';
  modernity: ModernityStatus | 'all';
  searchTerm: string;
}

export interface StackComparison {
  stacks: TechnologyStack[];
  criteria: {
    performance: boolean;
    ease: boolean;
    community: boolean;
    modernity: boolean;
  };
}
