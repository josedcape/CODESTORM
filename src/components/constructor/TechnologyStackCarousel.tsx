import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Code,
  Globe,
  Smartphone,
  Server,
  Database,
  Layers,
  Zap,
  Shield,
  Cpu,
  Cloud,
  Monitor,
  Palette,
  Rocket,
  Triangle,
  Box,
  FileText,
  Settings,
  Sparkles,
  Activity,
  Workflow,
  Blocks
} from 'lucide-react';

export interface TechnologyStack {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'desktop' | 'ai' | 'blockchain';
  technologies: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
  useCase: string;
  estimatedTime: string;
  features: string[];
  color: string;
}

interface TechnologyStackCarouselProps {
  onSelectStack: (stack: TechnologyStack) => void;
  onClose: () => void;
  isVisible: boolean;
  instruction: string;
}

const technologyStacks: TechnologyStack[] = [
  // Frontend Frameworks
  {
    id: 'react-spa',
    name: 'React SPA',
    description: 'Modern single-page application with React 18+, TypeScript, and Tailwind CSS',
    icon: Code,
    category: 'frontend',
    technologies: ['React 18+', 'TypeScript', 'Tailwind CSS', 'Vite', 'React Router'],
    complexity: 'intermediate',
    useCase: 'Modern single-page applications, dashboards, interactive UIs',
    estimatedTime: '2-4 hours',
    features: ['Component reusability', 'Virtual DOM', 'Rich ecosystem', 'Hot reload'],
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'vue-nuxt',
    name: 'Vue.js + Nuxt',
    description: 'Vue 3 with Nuxt 3 for SSR/SSG applications and progressive web apps',
    icon: Triangle,
    category: 'fullstack',
    technologies: ['Vue 3', 'Nuxt 3', 'TypeScript', 'Pinia', 'Nitro'],
    complexity: 'intermediate',
    useCase: 'SSR/SSG applications, progressive web apps',
    estimatedTime: '3-5 hours',
    features: ['Server-side rendering', 'Auto-routing', 'SEO optimization', 'File-based routing'],
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'angular-enterprise',
    name: 'Angular Enterprise',
    description: 'Angular 17+ with TypeScript for large-scale enterprise applications',
    icon: Shield,
    category: 'frontend',
    technologies: ['Angular 17+', 'TypeScript', 'Angular Material', 'RxJS', 'NgRx'],
    complexity: 'advanced',
    useCase: 'Large-scale enterprise applications, complex business logic',
    estimatedTime: '4-6 hours',
    features: ['Dependency injection', 'Two-way binding', 'Enterprise-ready', 'Strong typing'],
    color: 'from-red-500 to-pink-500'
  },

  // Fullstack JavaScript
  {
    id: 'mern-stack',
    name: 'MERN Stack',
    description: 'MongoDB, Express, React, Node.js for rapid prototyping and consumer apps',
    icon: Layers,
    category: 'fullstack',
    technologies: ['MongoDB', 'Express.js', 'React', 'Node.js', 'JWT'],
    complexity: 'intermediate',
    useCase: 'Rapid prototyping, startups, consumer applications',
    estimatedTime: '4-6 hours',
    features: ['JavaScript everywhere', 'Flexible schema', 'Rich UI components', 'Real-time capabilities'],
    color: 'from-purple-500 to-indigo-500'
  },
  {
    id: 'mean-stack',
    name: 'MEAN Stack',
    description: 'MongoDB, Express, Angular, Node.js for structured enterprise development',
    icon: Database,
    category: 'fullstack',
    technologies: ['MongoDB', 'Express.js', 'Angular', 'Node.js', 'TypeScript'],
    complexity: 'advanced',
    useCase: 'Enterprise applications, structured development',
    estimatedTime: '5-7 hours',
    features: ['TypeScript support', 'Structured architecture', 'Enterprise patterns', 'Scalable'],
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'nextjs-fullstack',
    name: 'Next.js Full-Stack',
    description: 'Next.js 14+ with React, TypeScript, and Prisma for production-ready apps',
    icon: Globe,
    category: 'fullstack',
    technologies: ['Next.js 14+', 'React', 'TypeScript', 'Prisma', 'PostgreSQL'],
    complexity: 'intermediate',
    useCase: 'Production-ready web applications, e-commerce',
    estimatedTime: '4-6 hours',
    features: ['SSR/SSG', 'API routes', 'Image optimization', 'Performance optimized'],
    color: 'from-blue-600 to-purple-600'
  },

  // Modern Performance-Focused
  {
    id: 'sveltekit',
    name: 'SvelteKit',
    description: 'Svelte 4 with SvelteKit for high-performance applications with minimal bundle size',
    icon: Zap,
    category: 'fullstack',
    technologies: ['Svelte 4', 'SvelteKit', 'TypeScript', 'Vite', 'Adapter'],
    complexity: 'intermediate',
    useCase: 'High-performance applications, minimal bundle size',
    estimatedTime: '3-5 hours',
    features: ['No virtual DOM', 'Compile-time optimization', 'Built-in animations', 'Small bundles'],
    color: 'from-orange-400 to-red-400'
  },
  {
    id: 'astro',
    name: 'Astro',
    description: 'Astro 4 with TypeScript for content-heavy sites and static-first architecture',
    icon: Rocket,
    category: 'frontend',
    technologies: ['Astro 4', 'TypeScript', 'Tailwind CSS', 'Content Collections', 'MDX'],
    complexity: 'beginner',
    useCase: 'Content-heavy sites, blogs, marketing pages',
    estimatedTime: '2-3 hours',
    features: ['Island architecture', 'Multi-framework support', 'Static-first', 'Zero JS by default'],
    color: 'from-purple-400 to-pink-400'
  },

  // Mobile Development
  {
    id: 'react-native',
    name: 'React Native',
    description: 'React Native 0.73+ with TypeScript and Expo for cross-platform mobile apps',
    icon: Smartphone,
    category: 'mobile',
    technologies: ['React Native 0.73+', 'TypeScript', 'Expo', 'React Navigation', 'AsyncStorage'],
    complexity: 'intermediate',
    useCase: 'Cross-platform mobile apps, MVP development',
    estimatedTime: '4-6 hours',
    features: ['Code sharing', 'Native performance', 'Large community', 'Hot reload'],
    color: 'from-green-500 to-teal-500'
  },
  {
    id: 'flutter',
    name: 'Flutter',
    description: 'Flutter 3.16+ with Dart for high-performance mobile apps with custom UI',
    icon: Palette,
    category: 'mobile',
    technologies: ['Flutter 3.16+', 'Dart', 'Material Design', 'Cupertino', 'Provider'],
    complexity: 'advanced',
    useCase: 'High-performance mobile apps, custom UI',
    estimatedTime: '5-7 hours',
    features: ['Single codebase', '60fps animations', 'Custom rendering', 'Hot reload'],
    color: 'from-blue-400 to-cyan-400'
  },

  // Backend Specialized
  {
    id: 'nodejs-api',
    name: 'Node.js API',
    description: 'Node.js with Express and TypeScript for RESTful APIs and microservices',
    icon: Server,
    category: 'backend',
    technologies: ['Node.js', 'Express', 'TypeScript', 'MongoDB/PostgreSQL', 'JWT'],
    complexity: 'intermediate',
    useCase: 'RESTful APIs, microservices, real-time applications',
    estimatedTime: '3-5 hours',
    features: ['High concurrency', 'JavaScript ecosystem', 'Scalable', 'Real-time support'],
    color: 'from-green-600 to-emerald-600'
  },
  {
    id: 'python-fastapi',
    name: 'Python FastAPI',
    description: 'FastAPI with Python 3.11+ for high-performance APIs with auto documentation',
    icon: Zap,
    category: 'backend',
    technologies: ['FastAPI', 'Python 3.11+', 'PostgreSQL', 'Redis', 'Pydantic'],
    complexity: 'intermediate',
    useCase: 'High-performance APIs, data science integration',
    estimatedTime: '3-5 hours',
    features: ['Auto documentation', 'Type hints', 'Async support', 'High performance'],
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'django-fullstack',
    name: 'Django Full-Stack',
    description: 'Django 5.0+ with Python for rapid development and admin interfaces',
    icon: Settings,
    category: 'fullstack',
    technologies: ['Django 5.0+', 'Python', 'PostgreSQL', 'Redis', 'Django REST'],
    complexity: 'intermediate',
    useCase: 'Rapid development, admin interfaces, content management',
    estimatedTime: '4-6 hours',
    features: ['Batteries included', 'ORM', 'Admin panel', 'Security built-in'],
    color: 'from-green-700 to-green-500'
  },

  // Emerging Technologies
  {
    id: 'qwik',
    name: 'Qwik',
    description: 'Qwik with TypeScript for instant-loading applications with O(1) loading',
    icon: Activity,
    category: 'frontend',
    technologies: ['Qwik', 'TypeScript', 'Tailwind CSS', 'Vite', 'QwikCity'],
    complexity: 'advanced',
    useCase: 'Instant-loading applications, performance-critical sites',
    estimatedTime: '4-6 hours',
    features: ['Resumability', 'O(1) loading', 'Progressive hydration', 'No hydration'],
    color: 'from-indigo-500 to-purple-500'
  },
  {
    id: 'solidjs',
    name: 'Solid.js',
    description: 'Solid.js with TypeScript for high-performance reactive applications',
    icon: Box,
    category: 'frontend',
    technologies: ['Solid.js', 'TypeScript', 'Vite', 'Solid Router', 'Solid Start'],
    complexity: 'intermediate',
    useCase: 'High-performance reactive applications',
    estimatedTime: '3-5 hours',
    features: ['Fine-grained reactivity', 'No virtual DOM', 'Small bundle', 'Fast updates'],
    color: 'from-blue-500 to-indigo-500'
  },

  // Specialized Stacks
  {
    id: 'jamstack',
    name: 'JAMstack',
    description: 'Static Site Generator with Headless CMS for fast, secure static sites',
    icon: FileText,
    category: 'frontend',
    technologies: ['Static Site Generator', 'Headless CMS', 'CDN', 'Netlify/Vercel', 'Git'],
    complexity: 'beginner',
    useCase: 'Static sites, blogs, documentation',
    estimatedTime: '2-3 hours',
    features: ['Fast loading', 'SEO-friendly', 'Secure', 'Scalable'],
    color: 'from-teal-400 to-blue-400'
  },
  {
    id: 'electron-desktop',
    name: 'Electron Desktop',
    description: 'Electron with React/Vue for cross-platform desktop applications',
    icon: Monitor,
    category: 'desktop',
    technologies: ['Electron', 'React/Vue', 'Node.js', 'Electron Builder', 'Auto-updater'],
    complexity: 'intermediate',
    useCase: 'Cross-platform desktop applications',
    estimatedTime: '4-6 hours',
    features: ['Web technologies', 'OS integration', 'Auto-updater', 'Native menus'],
    color: 'from-gray-600 to-gray-400'
  },
  {
    id: 'tauri-desktop',
    name: 'Tauri Desktop',
    description: 'Tauri with Rust backend for lightweight, secure desktop applications',
    icon: Shield,
    category: 'desktop',
    technologies: ['Tauri', 'Rust', 'Web Frontend', 'WebView', 'System APIs'],
    complexity: 'advanced',
    useCase: 'Lightweight desktop apps, system integration',
    estimatedTime: '5-7 hours',
    features: ['Small bundle', 'Native performance', 'Security', 'System integration'],
    color: 'from-orange-600 to-red-600'
  }
];

const TechnologyStackCarousel: React.FC<TechnologyStackCarouselProps> = ({
  onSelectStack,
  onClose,
  isVisible,
  instruction
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedStack, setSelectedStack] = useState<TechnologyStack | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter stacks based on user instruction with improved keyword matching
  const getRecommendedStacks = () => {
    const instructionLower = instruction.toLowerCase();
    const keywords = {
      mobile: ['móvil', 'mobile', 'app', 'android', 'ios', 'teléfono', 'flutter', 'react native'],
      backend: ['api', 'servidor', 'backend', 'base de datos', 'database', 'fastapi', 'django', 'node'],
      frontend: ['frontend', 'spa', 'react', 'vue', 'angular', 'interfaz', 'ui', 'dashboard'],
      fullstack: ['fullstack', 'full-stack', 'completa', 'mern', 'mean', 'next.js'],
      desktop: ['escritorio', 'desktop', 'aplicación de escritorio', 'electron', 'tauri'],
      ecommerce: ['tienda', 'ecommerce', 'e-commerce', 'venta', 'compra', 'comercio'],
      blog: ['blog', 'contenido', 'cms', 'artículos', 'jamstack', 'astro'],
      performance: ['rendimiento', 'performance', 'rápido', 'fast', 'svelte', 'qwik', 'solid'],
      enterprise: ['empresa', 'enterprise', 'corporativo', 'angular', 'escalable']
    };

    let recommendedStacks = [...technologyStacks];

    // Prioritize stacks based on keywords with scoring system
    const stackScores = new Map<string, number>();

    recommendedStacks.forEach(stack => {
      let score = 0;

      // Check category matches
      Object.entries(keywords).forEach(([category, categoryKeywords]) => {
        if (categoryKeywords.some(keyword => instructionLower.includes(keyword))) {
          if (stack.category === category ||
              (category === 'frontend' && stack.category === 'frontend') ||
              (category === 'backend' && stack.category === 'backend') ||
              (category === 'fullstack' && stack.category === 'fullstack') ||
              (category === 'mobile' && stack.category === 'mobile') ||
              (category === 'desktop' && stack.category === 'desktop')) {
            score += 10;
          }
        }
      });

      // Check technology matches
      stack.technologies.forEach(tech => {
        if (instructionLower.includes(tech.toLowerCase())) {
          score += 15;
        }
      });

      // Check name matches
      if (instructionLower.includes(stack.name.toLowerCase())) {
        score += 20;
      }

      stackScores.set(stack.id, score);
    });

    // Sort by score (highest first), then by complexity (beginner first)
    recommendedStacks.sort((a, b) => {
      const scoreA = stackScores.get(a.id) || 0;
      const scoreB = stackScores.get(b.id) || 0;

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      // If scores are equal, prioritize by complexity
      const complexityOrder = { beginner: 0, intermediate: 1, advanced: 2 };
      return complexityOrder[a.complexity] - complexityOrder[b.complexity];
    });

    return recommendedStacks;
  };

  const recommendedStacks = getRecommendedStacks();

  // Apply additional filtering based on search term and category
  const filteredStacks = recommendedStacks.filter(stack => {
    const matchesSearch = searchTerm === '' ||
      stack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stack.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stack.technologies.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase())) ||
      stack.useCase.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || stack.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter dropdown
  const categories = ['all', ...Array.from(new Set(technologyStacks.map(stack => stack.category)))];

  // Reset selection if selected stack is not in filtered results
  useEffect(() => {
    if (selectedStack && !filteredStacks.find(stack => stack.id === selectedStack.id)) {
      setSelectedStack(null);
    }
  }, [filteredStacks, selectedStack]);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % filteredStacks.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + filteredStacks.length) % filteredStacks.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleSelectStack = (stack: TechnologyStack) => {
    console.log('Selecting stack:', stack.name); // Debug log
    setSelectedStack(stack);
  };

  const handleConfirmSelection = () => {
    console.log('Confirming selection:', selectedStack?.name); // Debug log
    if (selectedStack) {
      onSelectStack(selectedStack);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      frontend: 'text-blue-400',
      backend: 'text-orange-400',
      fullstack: 'text-purple-400',
      mobile: 'text-green-400',
      desktop: 'text-indigo-400',
      ai: 'text-pink-400',
      blockchain: 'text-yellow-400'
    };
    return colors[category as keyof typeof colors] || 'text-gray-400';
  };

  const getComplexityColor = (complexity: string) => {
    const colors = {
      beginner: 'text-green-400',
      intermediate: 'text-yellow-400',
      advanced: 'text-red-400'
    };
    return colors[complexity as keyof typeof colors] || 'text-gray-400';
  };

  if (!isVisible) return null;

  const currentStack = filteredStacks[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-codestorm-dark rounded-xl shadow-2xl border border-codestorm-blue/30 w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-codestorm-blue/20 to-codestorm-purple/20 p-4 border-b border-codestorm-blue/30 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2 leading-tight">Selecciona tu Stack Tecnológico</h2>
              {instruction && instruction.trim() && (
                <p className="text-codestorm-accent text-sm leading-relaxed mb-2">
                  <span className="text-gray-400">Basado en tu instrucción:</span>
                  <br />
                  <span className="text-white font-medium italic">"{instruction.length > 60 ? instruction.substring(0, 60) + '...' : instruction}"</span>
                </p>
              )}
              <p className="text-gray-400 text-xs mt-1 mb-3">
                Explora las opciones disponibles y selecciona el stack que mejor se adapte a tu proyecto
              </p>

              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-3 mt-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Buscar tecnologías, frameworks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 bg-codestorm-darker border border-codestorm-blue/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-codestorm-blue/50 focus:ring-2 focus:ring-codestorm-blue/20"
                  />
                </div>
                <div className="sm:w-48">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-codestorm-darker border border-codestorm-blue/30 rounded-lg text-white focus:outline-none focus:border-codestorm-blue/50 focus:ring-2 focus:ring-codestorm-blue/20"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'Todas las categorías' : category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-3 hover:bg-white/10 rounded-lg ml-4"
              title="Cerrar modal"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar scroll-container">
          {filteredStacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="text-gray-400 mb-4">
                <Code className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">No se encontraron stacks tecnológicos</h3>
                <p className="text-gray-400 max-w-md">
                  Intenta ajustar tu búsqueda o seleccionar una categoría diferente para encontrar el stack perfecto para tu proyecto.
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="mt-4 px-6 py-2 bg-codestorm-blue/20 text-white rounded-lg hover:bg-codestorm-blue/40 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredStacks.map((stack) => (
              <div
                key={stack.id}
                className={`bg-gradient-to-br ${stack.color} p-1 rounded-xl transition-all duration-300 hover:scale-[1.02] ${
                  selectedStack?.id === stack.id ? 'ring-4 ring-codestorm-gold shadow-lg shadow-codestorm-gold/20' : 'hover:shadow-lg'
                }`}
              >
                <div className="bg-codestorm-darker rounded-lg p-4 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center flex-1">
                      <div className={`bg-gradient-to-br ${stack.color} p-3 rounded-lg mr-4 flex-shrink-0`}>
                        <stack.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-white mb-1 leading-tight">{stack.name}</h3>
                        <p className="text-codestorm-accent text-sm leading-relaxed">{stack.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end ml-4 flex-shrink-0">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full bg-gray-800/80 ${getCategoryColor(stack.category)} mb-2`}>
                        {stack.category.toUpperCase()}
                      </span>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full bg-gray-800/80 ${getComplexityColor(stack.complexity)}`}>
                        {stack.complexity.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 mb-4">
                    {/* Technologies */}
                    <div>
                      <h4 className="text-white font-semibold mb-3 text-base">Tecnologías</h4>
                      <div className="flex flex-wrap gap-2">
                        {stack.technologies.map((tech, index) => (
                          <span
                            key={index}
                            className="bg-codestorm-blue/20 text-codestorm-accent px-3 py-1 rounded-md text-sm font-medium border border-codestorm-blue/30"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <h4 className="text-white font-semibold mb-2 text-sm">Características</h4>
                      <ul className="space-y-1">
                        {stack.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="text-codestorm-accent text-xs flex items-start leading-relaxed">
                            <Check className="h-3 w-3 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                        {stack.features.length > 3 && (
                          <li className="text-gray-400 text-xs">
                            +{stack.features.length - 3} características más
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="mb-4 pt-3 border-t border-gray-700/50">
                    <div className="space-y-2">
                      <div>
                        <span className="text-codestorm-accent text-xs font-medium">Caso de uso: </span>
                        <span className="text-white text-xs">{stack.useCase}</span>
                      </div>
                      <div>
                        <span className="text-codestorm-accent text-xs font-medium">Tiempo estimado: </span>
                        <span className="text-white text-xs font-semibold">{stack.estimatedTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Select button */}
                  <div>
                    <button
                      onClick={() => handleSelectStack(stack)}
                      className={`w-full py-2 px-3 rounded-lg font-medium transition-all duration-200 text-sm ${
                        selectedStack?.id === stack.id
                          ? 'bg-codestorm-gold text-codestorm-darker shadow-lg'
                          : 'bg-codestorm-blue/20 text-white hover:bg-codestorm-blue/40 border border-codestorm-blue/30 hover:border-codestorm-blue/50'
                      }`}
                    >
                      {selectedStack?.id === stack.id ? (
                        <span className="flex items-center justify-center">
                          <Check className="h-4 w-4 mr-2" />
                          Seleccionado
                        </span>
                      ) : (
                        'Seleccionar'
                      )}
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="bg-codestorm-darker/50 p-4 border-t border-codestorm-blue/30 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-sm text-codestorm-accent">
              <span className="font-medium">{filteredStacks.length}</span> de <span className="font-medium">{technologyStacks.length}</span> stacks disponibles
              {filteredStacks.length > 6 && (
                <div className="text-xs text-blue-400 mt-1 flex items-center">
                  <span className="animate-pulse mr-1">↕</span>
                  Desplázate para ver más opciones
                </div>
              )}
              {(searchTerm || selectedCategory !== 'all') && (
                <div className="text-xs text-gray-400 mt-1">
                  Filtros activos: {searchTerm && `"${searchTerm}"`} {selectedCategory !== 'all' && `Categoría: ${selectedCategory}`}
                </div>
              )}
              {selectedStack && (
                <div className="text-sm text-white mt-1">
                  Stack seleccionado: <span className="font-semibold text-codestorm-gold">{selectedStack.name}</span>
                </div>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-400 hover:text-white transition-colors border border-gray-600 hover:border-gray-500 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={!selectedStack}
                className="px-8 py-3 bg-codestorm-gold text-codestorm-darker font-semibold rounded-lg hover:bg-codestorm-gold/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:shadow-none"
              >
                {selectedStack ? `Continuar con ${selectedStack.name}` : 'Selecciona un Stack'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnologyStackCarousel;
