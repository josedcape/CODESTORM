import { TechnologyStack } from '../types/technologyStacks';
import { technologyStacks } from '../data/technologyStacks';

export interface StackRecommendation {
  stack: TechnologyStack;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  matchedKeywords: string[];
  projectType: string;
  complexity: 'simple' | 'moderate' | 'complex';
  userExperience: 'beginner' | 'intermediate' | 'advanced';
}

export interface InstructionAnalysis {
  keywords: string[];
  projectType: string;
  complexity: 'simple' | 'moderate' | 'complex';
  userExperience: 'beginner' | 'intermediate' | 'advanced';
  explicitTechnologies: string[];
  inferredRequirements: string[];
  applicationDomain: string;
}

export class StackRecommendationService {
  private static instance: StackRecommendationService;

  // Palabras clave por categoría
  private readonly keywordMappings = {
    // Tecnologías específicas
    react: ['react', 'jsx', 'hooks', 'components', 'spa'],
    angular: ['angular', 'typescript', 'angular cli', 'rxjs', 'angular material'],
    vue: ['vue', 'vuejs', 'nuxt', 'composition api'],
    python: ['python', 'django', 'flask', 'fastapi', 'pandas'],
    ruby: ['ruby', 'rails', 'gem', 'activerecord'],
    javascript: ['javascript', 'js', 'node', 'npm', 'express'],
    mobile: ['mobile', 'app', 'android', 'ios', 'smartphone', 'tablet'],
    flutter: ['flutter', 'dart', 'cross-platform', 'material design'],
    reactNative: ['react native', 'expo', 'metro'],
    
    // Tipos de proyecto
    ecommerce: ['ecommerce', 'e-commerce', 'tienda', 'shop', 'carrito', 'compras', 'productos', 'ventas'],
    blog: ['blog', 'cms', 'contenido', 'artículos', 'posts'],
    dashboard: ['dashboard', 'admin', 'panel', 'analytics', 'métricas', 'reportes'],
    social: ['social', 'red social', 'chat', 'mensajes', 'usuarios', 'perfiles'],
    enterprise: ['enterprise', 'empresarial', 'corporativo', 'erp', 'crm'],
    portfolio: ['portfolio', 'portafolio', 'personal', 'cv', 'resume'],
    landing: ['landing', 'página de aterrizaje', 'marketing', 'promocional'],
    
    // Complejidad
    simple: ['simple', 'básico', 'sencillo', 'rápido', 'prototipo', 'mvp'],
    moderate: ['moderado', 'intermedio', 'funcional', 'completo'],
    complex: ['complejo', 'avanzado', 'escalable', 'enterprise', 'robusto', 'sistema'],
    
    // Experiencia del usuario
    beginner: ['principiante', 'nuevo', 'aprendiendo', 'primer', 'tutorial', 'básico'],
    intermediate: ['intermedio', 'experiencia', 'conocimiento'],
    advanced: ['avanzado', 'experto', 'profesional', 'senior', 'arquitectura']
  };

  // Scoring weights
  private readonly weights = {
    explicitTechnology: 40,
    projectType: 25,
    complexity: 20,
    userExperience: 10,
    keywords: 5
  };

  public static getInstance(): StackRecommendationService {
    if (!StackRecommendationService.instance) {
      StackRecommendationService.instance = new StackRecommendationService();
    }
    return StackRecommendationService.instance;
  }

  /**
   * Analiza las instrucciones del usuario para extraer información relevante
   */
  public analyzeInstructions(instruction: string): InstructionAnalysis {
    const normalizedInstruction = instruction.toLowerCase();
    
    // Extraer palabras clave
    const keywords = this.extractKeywords(normalizedInstruction);
    
    // Determinar tipo de proyecto
    const projectType = this.determineProjectType(normalizedInstruction, keywords);
    
    // Evaluar complejidad
    const complexity = this.evaluateComplexity(normalizedInstruction, keywords);
    
    // Inferir experiencia del usuario
    const userExperience = this.inferUserExperience(normalizedInstruction, keywords);
    
    // Identificar tecnologías explícitas
    const explicitTechnologies = this.identifyExplicitTechnologies(normalizedInstruction);
    
    // Inferir requisitos
    const inferredRequirements = this.inferRequirements(normalizedInstruction, projectType);
    
    // Determinar dominio de aplicación
    const applicationDomain = this.determineApplicationDomain(normalizedInstruction, keywords);

    return {
      keywords,
      projectType,
      complexity,
      userExperience,
      explicitTechnologies,
      inferredRequirements,
      applicationDomain
    };
  }

  /**
   * Recomienda el stack más apropiado basándose en el análisis
   */
  public recommendStack(instruction: string): StackRecommendation {
    const analysis = this.analyzeInstructions(instruction);
    
    // Calcular scores para cada stack
    const stackScores = technologyStacks.map(stack => {
      const score = this.calculateStackScore(stack, analysis);
      const reasons = this.generateReasons(stack, analysis);
      const confidence = this.determineConfidence(score, analysis);
      
      return {
        stack,
        score,
        confidence,
        reasons,
        matchedKeywords: this.getMatchedKeywords(stack, analysis),
        projectType: analysis.projectType,
        complexity: analysis.complexity,
        userExperience: analysis.userExperience
      };
    });

    // Ordenar por score y retornar el mejor
    stackScores.sort((a, b) => b.score - a.score);
    return stackScores[0];
  }

  /**
   * Obtiene múltiples recomendaciones ordenadas por score
   */
  public getTopRecommendations(instruction: string, count: number = 3): StackRecommendation[] {
    const analysis = this.analyzeInstructions(instruction);
    
    const stackScores = technologyStacks.map(stack => {
      const score = this.calculateStackScore(stack, analysis);
      const reasons = this.generateReasons(stack, analysis);
      const confidence = this.determineConfidence(score, analysis);
      
      return {
        stack,
        score,
        confidence,
        reasons,
        matchedKeywords: this.getMatchedKeywords(stack, analysis),
        projectType: analysis.projectType,
        complexity: analysis.complexity,
        userExperience: analysis.userExperience
      };
    });

    return stackScores
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  private extractKeywords(instruction: string): string[] {
    const keywords: string[] = [];
    
    Object.entries(this.keywordMappings).forEach(([category, words]) => {
      words.forEach(word => {
        if (instruction.includes(word)) {
          keywords.push(word);
        }
      });
    });
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  private determineProjectType(instruction: string, keywords: string[]): string {
    // Buscar indicadores de tipo de proyecto
    if (keywords.some(k => this.keywordMappings.ecommerce.includes(k))) return 'E-commerce';
    if (keywords.some(k => this.keywordMappings.mobile.includes(k))) return 'Mobile';
    if (keywords.some(k => this.keywordMappings.blog.includes(k))) return 'Blog/CMS';
    if (keywords.some(k => this.keywordMappings.dashboard.includes(k))) return 'Dashboard';
    if (keywords.some(k => this.keywordMappings.social.includes(k))) return 'Social';
    if (keywords.some(k => this.keywordMappings.enterprise.includes(k))) return 'Enterprise';
    if (keywords.some(k => this.keywordMappings.portfolio.includes(k))) return 'Portfolio';
    if (keywords.some(k => this.keywordMappings.landing.includes(k))) return 'Landing Page';
    
    return 'Web Application';
  }

  private evaluateComplexity(instruction: string, keywords: string[]): 'simple' | 'moderate' | 'complex' {
    if (keywords.some(k => this.keywordMappings.complex.includes(k))) return 'complex';
    if (keywords.some(k => this.keywordMappings.simple.includes(k))) return 'simple';
    
    // Evaluar por longitud y características
    const wordCount = instruction.split(' ').length;
    if (wordCount > 50) return 'complex';
    if (wordCount < 20) return 'simple';
    
    return 'moderate';
  }

  private inferUserExperience(instruction: string, keywords: string[]): 'beginner' | 'intermediate' | 'advanced' {
    if (keywords.some(k => this.keywordMappings.advanced.includes(k))) return 'advanced';
    if (keywords.some(k => this.keywordMappings.beginner.includes(k))) return 'beginner';
    
    // Evaluar por uso de terminología técnica
    const technicalTerms = keywords.filter(k => 
      this.keywordMappings.react.includes(k) ||
      this.keywordMappings.angular.includes(k) ||
      this.keywordMappings.python.includes(k)
    );
    
    if (technicalTerms.length > 3) return 'advanced';
    if (technicalTerms.length > 1) return 'intermediate';
    
    return 'beginner';
  }

  private identifyExplicitTechnologies(instruction: string): string[] {
    const technologies: string[] = [];
    
    // Buscar menciones explícitas de tecnologías
    const techMappings = {
      'React': this.keywordMappings.react,
      'Angular': this.keywordMappings.angular,
      'Vue': this.keywordMappings.vue,
      'Python': this.keywordMappings.python,
      'Ruby': this.keywordMappings.ruby,
      'Flutter': this.keywordMappings.flutter,
      'React Native': this.keywordMappings.reactNative
    };
    
    Object.entries(techMappings).forEach(([tech, keywords]) => {
      if (keywords.some(keyword => instruction.includes(keyword))) {
        technologies.push(tech);
      }
    });
    
    return technologies;
  }

  private inferRequirements(instruction: string, projectType: string): string[] {
    const requirements: string[] = [];
    
    // Requisitos basados en tipo de proyecto
    switch (projectType) {
      case 'E-commerce':
        requirements.push('Base de datos', 'Autenticación', 'Pagos', 'Inventario');
        break;
      case 'Mobile':
        requirements.push('UI nativa', 'Performance', 'Offline support');
        break;
      case 'Enterprise':
        requirements.push('Escalabilidad', 'Seguridad', 'Mantenibilidad');
        break;
      case 'Blog/CMS':
        requirements.push('SEO', 'Gestión de contenido', 'Performance');
        break;
    }
    
    return requirements;
  }

  private determineApplicationDomain(instruction: string, keywords: string[]): string {
    if (keywords.some(k => this.keywordMappings.mobile.includes(k))) return 'Mobile';
    if (keywords.some(k => this.keywordMappings.enterprise.includes(k))) return 'Enterprise';
    return 'Web';
  }

  private calculateStackScore(stack: TechnologyStack, analysis: InstructionAnalysis): number {
    let score = 0;
    
    // Score por tecnologías explícitas
    analysis.explicitTechnologies.forEach(tech => {
      if (stack.technologies.some(t => t.name.toLowerCase().includes(tech.toLowerCase()))) {
        score += this.weights.explicitTechnology;
      }
    });
    
    // Score por tipo de proyecto
    if (stack.recommendedFor.includes(analysis.projectType as any)) {
      score += this.weights.projectType;
    }
    
    // Score por complejidad
    const complexityMatch = this.getComplexityMatch(stack, analysis.complexity);
    score += complexityMatch * this.weights.complexity;
    
    // Score por experiencia del usuario
    const experienceMatch = this.getExperienceMatch(stack, analysis.userExperience);
    score += experienceMatch * this.weights.userExperience;
    
    // Score por palabras clave generales
    const keywordMatch = this.getKeywordMatch(stack, analysis.keywords);
    score += keywordMatch * this.weights.keywords;
    
    return Math.min(100, score); // Cap at 100
  }

  private getComplexityMatch(stack: TechnologyStack, complexity: string): number {
    const stackComplexity = stack.difficultyLevel;
    
    if (complexity === 'simple' && stackComplexity === 'Fácil') return 1;
    if (complexity === 'moderate' && stackComplexity === 'Moderado') return 1;
    if (complexity === 'complex' && stackComplexity === 'Avanzado') return 1;
    
    return 0.5; // Partial match
  }

  private getExperienceMatch(stack: TechnologyStack, experience: string): number {
    const stackDifficulty = stack.difficultyLevel;
    
    if (experience === 'beginner' && stackDifficulty === 'Fácil') return 1;
    if (experience === 'intermediate' && stackDifficulty === 'Moderado') return 1;
    if (experience === 'advanced' && stackDifficulty === 'Avanzado') return 1;
    
    return 0.3; // Lower penalty for mismatch
  }

  private getKeywordMatch(stack: TechnologyStack, keywords: string[]): number {
    const stackKeywords = [
      stack.name.toLowerCase(),
      ...stack.technologies.map(t => t.name.toLowerCase()),
      ...stack.useCases.map(u => u.toLowerCase())
    ];
    
    const matches = keywords.filter(keyword => 
      stackKeywords.some(sk => sk.includes(keyword))
    );
    
    return Math.min(1, matches.length / keywords.length);
  }

  private generateReasons(stack: TechnologyStack, analysis: InstructionAnalysis): string[] {
    const reasons: string[] = [];
    
    // Razones por tecnologías explícitas
    analysis.explicitTechnologies.forEach(tech => {
      if (stack.technologies.some(t => t.name.toLowerCase().includes(tech.toLowerCase()))) {
        reasons.push(`Incluye ${tech} que mencionaste específicamente`);
      }
    });
    
    // Razones por tipo de proyecto
    if (stack.recommendedFor.includes(analysis.projectType as any)) {
      reasons.push(`Optimizado para proyectos de tipo ${analysis.projectType}`);
    }
    
    // Razones por complejidad
    if (this.getComplexityMatch(stack, analysis.complexity) === 1) {
      reasons.push(`Nivel de complejidad ${stack.difficultyLevel} ideal para tu proyecto ${analysis.complexity}`);
    }
    
    // Razones por experiencia
    if (this.getExperienceMatch(stack, analysis.userExperience) === 1) {
      reasons.push(`Apropiado para tu nivel de experiencia ${analysis.userExperience}`);
    }
    
    // Razones específicas del stack
    reasons.push(...stack.advantages.slice(0, 2));
    
    return reasons.slice(0, 4); // Limit to 4 reasons
  }

  private getMatchedKeywords(stack: TechnologyStack, analysis: InstructionAnalysis): string[] {
    const stackKeywords = [
      stack.name.toLowerCase(),
      ...stack.technologies.map(t => t.name.toLowerCase())
    ];
    
    return analysis.keywords.filter(keyword => 
      stackKeywords.some(sk => sk.includes(keyword))
    );
  }

  private determineConfidence(score: number, analysis: InstructionAnalysis): 'high' | 'medium' | 'low' {
    if (score >= 70 && analysis.explicitTechnologies.length > 0) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }
}
