import { TechnologyStack, StackCategory } from '../types/technologyStacks';

export const technologyStacks: TechnologyStack[] = [
  // MEAN Stack
  {
    id: 'mean-stack',
    name: 'MEAN Stack',
    description: 'Stack completo de JavaScript con MongoDB, Express.js, Angular y Node.js para aplicaciones web escalables y modernas.',
    shortDescription: 'JavaScript full-stack con Angular y MongoDB',
    image: 'https://via.placeholder.com/400x200/DD0031/FFFFFF?text=MEAN+Stack',
    icon: '🅰️',
    primaryColor: '#DD0031',
    secondaryColor: '#C3002F',
    implementationEase: 3,
    uiQuality: 4,
    modernityStatus: 'Establecido',
    lastUpdate: '2024',
    difficultyLevel: 'Moderado',
    learningCurve: '3-6 meses para dominio completo',
    popularity: '15.2%',
    performance: {
      loadTime: '2.1s promedio',
      buildTime: '45-90s',
      bundleSize: '2.5-4MB',
      memoryUsage: '150-300MB'
    },
    community: {
      githubStars: '23.8k (Angular)',
      npmDownloads: '3.2M/semana',
      stackOverflowQuestions: '280k+',
      jobMarket: 'Alto - 45k+ ofertas'
    },
    recommendedFor: ['Enterprise', 'Web'],
    useCases: [
      'Aplicaciones empresariales complejas',
      'Sistemas de gestión de contenido',
      'Plataformas de e-commerce',
      'Dashboards administrativos'
    ],
    successCases: [
      'Deutsche Bank (banca digital)',
      'Samsung (plataforma interna)',
      'Microsoft Office (componentes web)'
    ],
    technologies: [
      { name: 'MongoDB', role: 'Base de datos NoSQL', version: '7.0+' },
      { name: 'Express.js', role: 'Framework backend', version: '4.18+' },
      { name: 'Angular', role: 'Framework frontend', version: '17+' },
      { name: 'Node.js', role: 'Runtime JavaScript', version: '20+' }
    ],
    advantages: [
      'Un solo lenguaje (JavaScript) en todo el stack',
      'Excelente para aplicaciones empresariales',
      'TypeScript nativo en Angular',
      'Arquitectura robusta y escalable',
      'Gran ecosistema de librerías'
    ],
    disadvantages: [
      'Curva de aprendizaje pronunciada',
      'Angular puede ser complejo para principiantes',
      'Overhead inicial considerable',
      'Requiere conocimiento profundo de TypeScript'
    ],
    prerequisites: [
      'JavaScript intermedio-avanzado',
      'TypeScript básico',
      'Conceptos de programación orientada a objetos',
      'Conocimiento de APIs REST'
    ],
    systemRequirements: [
      'Node.js 20+ LTS',
      'MongoDB 7.0+',
      '8GB RAM mínimo',
      'SSD recomendado'
    ],
    documentation: 'https://angular.io/docs',
    tutorials: [
      'Angular Tour of Heroes',
      'MEAN Stack Tutorial - Traversy Media',
      'Angular University Courses'
    ],
    officialWebsite: 'https://angular.io',
    setupInstructions: [
      'Instalar Node.js y npm',
      'Instalar Angular CLI: npm install -g @angular/cli',
      'Instalar MongoDB',
      'Crear proyecto: ng new proyecto-mean',
      'Configurar Express.js backend'
    ],
    initialFiles: [
      {
        path: 'package.json',
        content: '{"name": "mean-app", "version": "1.0.0", "scripts": {"start": "ng serve", "build": "ng build"}}',
        description: 'Configuración del proyecto Angular'
      }
    ]
  },

  // MERN Stack
  {
    id: 'mern-stack',
    name: 'MERN Stack',
    description: 'Stack moderno de JavaScript con MongoDB, Express.js, React y Node.js, ideal para aplicaciones web dinámicas y SPAs.',
    shortDescription: 'JavaScript full-stack con React y MongoDB',
    image: 'https://via.placeholder.com/400x200/61DAFB/21232A?text=MERN+Stack',
    icon: '⚛️',
    primaryColor: '#61DAFB',
    secondaryColor: '#21232A',
    implementationEase: 4,
    uiQuality: 5,
    modernityStatus: 'Reciente',
    lastUpdate: '2024',
    difficultyLevel: 'Moderado',
    learningCurve: '2-4 meses para competencia',
    popularity: '28.7%',
    performance: {
      loadTime: '1.8s promedio',
      buildTime: '30-60s',
      bundleSize: '1.8-3MB',
      memoryUsage: '120-250MB'
    },
    community: {
      githubStars: '220k+ (React)',
      npmDownloads: '20M+/semana',
      stackOverflowQuestions: '400k+',
      jobMarket: 'Muy Alto - 65k+ ofertas'
    },
    recommendedFor: ['Startup', 'Web', 'Mobile'],
    useCases: [
      'Single Page Applications (SPAs)',
      'Aplicaciones de redes sociales',
      'Plataformas de streaming',
      'E-commerce modernos',
      'Dashboards interactivos'
    ],
    successCases: [
      'Facebook (creador de React)',
      'Netflix (interfaz web)',
      'Airbnb (plataforma principal)',
      'WhatsApp Web'
    ],
    technologies: [
      { name: 'MongoDB', role: 'Base de datos NoSQL', version: '7.0+' },
      { name: 'Express.js', role: 'Framework backend', version: '4.18+' },
      { name: 'React', role: 'Librería frontend', version: '18+' },
      { name: 'Node.js', role: 'Runtime JavaScript', version: '20+' }
    ],
    advantages: [
      'Desarrollo rápido y eficiente',
      'Comunidad masiva y activa',
      'Flexibilidad en el desarrollo',
      'Excelente para prototipos',
      'Ecosistema de componentes rico'
    ],
    disadvantages: [
      'Fatiga de decisiones (muchas opciones)',
      'Cambios frecuentes en el ecosistema',
      'SEO requiere configuración adicional',
      'Puede ser abrumador para principiantes'
    ],
    prerequisites: [
      'JavaScript ES6+ sólido',
      'Conceptos de React (JSX, hooks)',
      'Conocimiento básico de APIs',
      'HTML/CSS intermedio'
    ],
    systemRequirements: [
      'Node.js 18+ LTS',
      'MongoDB 6.0+',
      '6GB RAM mínimo',
      'Navegador moderno'
    ],
    documentation: 'https://react.dev',
    tutorials: [
      'React Official Tutorial',
      'Full Stack MERN - Brad Traversy',
      'React + Node.js - Academind'
    ],
    officialWebsite: 'https://react.dev',
    setupInstructions: [
      'Instalar Node.js y npm',
      'Crear app React: npx create-react-app mi-app',
      'Configurar backend con Express',
      'Conectar MongoDB',
      'Configurar proxy para desarrollo'
    ],
    initialFiles: [
      {
        path: 'src/App.js',
        content: 'import React from "react"; function App() { return <div>MERN App</div>; } export default App;',
        description: 'Componente principal de React'
      }
    ]
  },

  // JAMstack
  {
    id: 'jamstack',
    name: 'JAMstack',
    description: 'Arquitectura moderna basada en JavaScript, APIs y Markup para sitios web ultra-rápidos y seguros.',
    shortDescription: 'Arquitectura moderna con JavaScript, APIs y Markup',
    image: 'https://via.placeholder.com/400x200/F0047F/FFFFFF?text=JAMstack',
    icon: '🚀',
    primaryColor: '#F0047F',
    secondaryColor: '#7C3AED',
    implementationEase: 4,
    uiQuality: 4,
    modernityStatus: 'Reciente',
    lastUpdate: '2024',
    difficultyLevel: 'Fácil',
    learningCurve: '1-3 meses para competencia',
    popularity: '22.1%',
    performance: {
      loadTime: '0.8s promedio',
      buildTime: '15-45s',
      bundleSize: '500KB-2MB',
      memoryUsage: '50-150MB'
    },
    community: {
      githubStars: '50k+ (Gatsby)',
      npmDownloads: '15M+/semana',
      stackOverflowQuestions: '180k+',
      jobMarket: 'Alto - 35k+ ofertas'
    },
    recommendedFor: ['Web', 'Startup'],
    useCases: [
      'Sitios web estáticos',
      'Blogs y documentación',
      'Landing pages',
      'E-commerce ligero',
      'Portafolios profesionales'
    ],
    successCases: [
      'Netlify (plataforma propia)',
      'Smashing Magazine',
      'Impossible Foods',
      'Nike (micrositios)'
    ],
    technologies: [
      { name: 'JavaScript', role: 'Lógica del cliente', version: 'ES2022+' },
      { name: 'APIs', role: 'Servicios backend', version: 'REST/GraphQL' },
      { name: 'Markup', role: 'Contenido estático', version: 'HTML5/Markdown' },
      { name: 'CDN', role: 'Distribución global', version: 'Edge computing' }
    ],
    advantages: [
      'Rendimiento excepcional',
      'Seguridad mejorada',
      'Escalabilidad automática',
      'Costos reducidos de hosting',
      'SEO optimizado'
    ],
    disadvantages: [
      'Limitado para aplicaciones complejas',
      'Dependencia de servicios externos',
      'Curva de aprendizaje para APIs',
      'Menos flexibilidad en tiempo real'
    ],
    prerequisites: [
      'JavaScript básico-intermedio',
      'HTML/CSS sólido',
      'Conceptos de APIs REST',
      'Git y control de versiones'
    ],
    systemRequirements: [
      'Node.js 18+',
      'Git',
      '4GB RAM mínimo',
      'Conexión a internet estable'
    ],
    documentation: 'https://jamstack.org',
    tutorials: [
      'JAMstack Handbook',
      'Gatsby Tutorial',
      'Netlify Functions Guide'
    ],
    officialWebsite: 'https://jamstack.org',
    setupInstructions: [
      'Elegir generador estático (Gatsby, Next.js, Nuxt)',
      'Configurar repositorio Git',
      'Conectar con servicios de API',
      'Desplegar en CDN (Netlify, Vercel)',
      'Configurar dominio personalizado'
    ],
    initialFiles: [
      {
        path: 'index.html',
        content: '<!DOCTYPE html><html><head><title>JAMstack Site</title></head><body><h1>Hello JAMstack!</h1></body></html>',
        description: 'Página principal estática'
      }
    ]
  },

  // Django
  {
    id: 'django',
    name: 'Django',
    description: 'Framework web de Python robusto y maduro, ideal para aplicaciones web complejas con desarrollo rápido.',
    shortDescription: 'Framework web de Python para desarrollo rápido',
    image: 'https://via.placeholder.com/400x200/092E20/44B78B?text=Django',
    icon: '🐍',
    primaryColor: '#092E20',
    secondaryColor: '#44B78B',
    implementationEase: 3,
    uiQuality: 3,
    modernityStatus: 'Establecido',
    lastUpdate: '2024',
    difficultyLevel: 'Moderado',
    learningCurve: '3-5 meses para competencia',
    popularity: '18.6%',
    performance: {
      loadTime: '1.5s promedio',
      buildTime: '10-30s',
      bundleSize: 'N/A (server-side)',
      memoryUsage: '200-500MB'
    },
    community: {
      githubStars: '75k+',
      npmDownloads: 'N/A (PyPI)',
      stackOverflowQuestions: '300k+',
      jobMarket: 'Alto - 40k+ ofertas'
    },
    recommendedFor: ['Enterprise', 'Web'],
    useCases: [
      'Aplicaciones web empresariales',
      'APIs REST robustas',
      'Sistemas de gestión de contenido',
      'Plataformas de e-learning',
      'Aplicaciones científicas'
    ],
    successCases: [
      'Instagram (backend principal)',
      'Pinterest (arquitectura base)',
      'Mozilla (sitios web)',
      'The Washington Post'
    ],
    technologies: [
      { name: 'Python', role: 'Lenguaje principal', version: '3.11+' },
      { name: 'Django ORM', role: 'Mapeo objeto-relacional', version: '5.0+' },
      { name: 'PostgreSQL', role: 'Base de datos', version: '15+' },
      { name: 'Redis', role: 'Cache y sesiones', version: '7+' }
    ],
    advantages: [
      'Desarrollo muy rápido',
      'Seguridad robusta por defecto',
      'Admin interface automática',
      'ORM potente y flexible',
      'Documentación excelente'
    ],
    disadvantages: [
      'Puede ser pesado para proyectos simples',
      'Curva de aprendizaje de Python',
      'Menos flexibilidad que frameworks minimalistas',
      'Monolítico por naturaleza'
    ],
    prerequisites: [
      'Python intermedio',
      'Conceptos de bases de datos',
      'HTML/CSS básico',
      'Conocimiento de HTTP'
    ],
    systemRequirements: [
      'Python 3.11+',
      'PostgreSQL 13+',
      '4GB RAM mínimo',
      'Sistema Unix/Linux recomendado'
    ],
    documentation: 'https://docs.djangoproject.com',
    tutorials: [
      'Django Official Tutorial',
      'Django for Beginners - William Vincent',
      'Real Python Django Tutorials'
    ],
    officialWebsite: 'https://djangoproject.com',
    setupInstructions: [
      'Instalar Python 3.11+',
      'Crear entorno virtual: python -m venv venv',
      'Instalar Django: pip install django',
      'Crear proyecto: django-admin startproject miproyecto',
      'Configurar base de datos'
    ],
    initialFiles: [
      {
        path: 'manage.py',
        content: '#!/usr/bin/env python\nimport os\nimport sys\nif __name__ == "__main__":\n    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")',
        description: 'Script de gestión de Django'
      }
    ]
  },

  // Ruby on Rails
  {
    id: 'rails',
    name: 'Ruby on Rails',
    description: 'Framework web maduro y elegante de Ruby, conocido por su filosofía de "convención sobre configuración".',
    shortDescription: 'Framework web elegante de Ruby',
    image: 'https://via.placeholder.com/400x200/CC0000/FFFFFF?text=Ruby+on+Rails',
    icon: '💎',
    primaryColor: '#CC0000',
    secondaryColor: '#8B0000',
    implementationEase: 4,
    uiQuality: 3,
    modernityStatus: 'Establecido',
    lastUpdate: '2024',
    difficultyLevel: 'Moderado',
    learningCurve: '2-4 meses para competencia',
    popularity: '12.8%',
    performance: {
      loadTime: '1.8s promedio',
      buildTime: '20-60s',
      bundleSize: 'N/A (server-side)',
      memoryUsage: '180-400MB'
    },
    community: {
      githubStars: '55k+',
      npmDownloads: 'N/A (RubyGems)',
      stackOverflowQuestions: '220k+',
      jobMarket: 'Medio-Alto - 25k+ ofertas'
    },
    recommendedFor: ['Startup', 'Web'],
    useCases: [
      'Aplicaciones web rápidas',
      'MVPs y prototipos',
      'E-commerce',
      'APIs REST',
      'Aplicaciones SaaS'
    ],
    successCases: [
      'GitHub (plataforma completa)',
      'Shopify (e-commerce)',
      'Basecamp (gestión de proyectos)',
      'Twitch (componentes backend)'
    ],
    technologies: [
      { name: 'Ruby', role: 'Lenguaje principal', version: '3.2+' },
      { name: 'Rails', role: 'Framework web', version: '7.1+' },
      { name: 'PostgreSQL', role: 'Base de datos', version: '15+' },
      { name: 'Redis', role: 'Cache y jobs', version: '7+' }
    ],
    advantages: [
      'Desarrollo extremadamente rápido',
      'Convenciones claras y consistentes',
      'Comunidad madura y amigable',
      'Excelente para MVPs',
      'Sintaxis elegante y legible'
    ],
    disadvantages: [
      'Rendimiento menor que otros frameworks',
      'Curva de aprendizaje de Ruby',
      'Menos popular en el mercado actual',
      'Puede ser opinionado en exceso'
    ],
    prerequisites: [
      'Ruby básico-intermedio',
      'Conceptos de MVC',
      'HTML/CSS básico',
      'Conocimiento de bases de datos'
    ],
    systemRequirements: [
      'Ruby 3.2+',
      'PostgreSQL 13+',
      '4GB RAM mínimo',
      'Sistema Unix/Linux recomendado'
    ],
    documentation: 'https://guides.rubyonrails.org',
    tutorials: [
      'Rails Tutorial - Michael Hartl',
      'Ruby on Rails Guides',
      'GoRails Screencasts'
    ],
    officialWebsite: 'https://rubyonrails.org',
    setupInstructions: [
      'Instalar Ruby 3.2+',
      'Instalar Rails: gem install rails',
      'Crear proyecto: rails new miapp',
      'Configurar base de datos',
      'Ejecutar: rails server'
    ],
    initialFiles: [
      {
        path: 'Gemfile',
        content: 'source "https://rubygems.org"\ngem "rails", "~> 7.1.0"\ngem "sqlite3"',
        description: 'Archivo de dependencias de Ruby'
      }
    ]
  },

  // MEVN Stack
  {
    id: 'mevn-stack',
    name: 'MEVN Stack',
    description: 'Stack moderno de JavaScript con MongoDB, Express.js, Vue.js y Node.js para aplicaciones web reactivas y escalables.',
    shortDescription: 'JavaScript full-stack con Vue.js y MongoDB',
    image: 'https://via.placeholder.com/400x200/4FC08D/35495E?text=MEVN+Stack',
    icon: '🟢',
    primaryColor: '#4FC08D',
    secondaryColor: '#35495E',
    implementationEase: 4,
    uiQuality: 4,
    modernityStatus: 'Reciente',
    lastUpdate: '2024',
    difficultyLevel: 'Moderado',
    learningCurve: '2-4 meses para competencia',
    popularity: '16.3%',
    performance: {
      loadTime: '1.6s promedio',
      buildTime: '25-50s',
      bundleSize: '1.5-2.8MB',
      memoryUsage: '100-220MB'
    },
    community: {
      githubStars: '206k+ (Vue.js)',
      npmDownloads: '4.2M/semana',
      stackOverflowQuestions: '95k+',
      jobMarket: 'Alto - 32k+ ofertas'
    },
    recommendedFor: ['Web', 'Startup'],
    useCases: [
      'Single Page Applications progresivas',
      'Interfaces de usuario complejas',
      'Aplicaciones empresariales medianas',
      'Dashboards administrativos',
      'Plataformas de gestión'
    ],
    successCases: [
      'GitLab (interfaz principal)',
      'Adobe Portfolio',
      'BMW (configurador de vehículos)',
      'Nintendo (sitios promocionales)'
    ],
    technologies: [
      { name: 'MongoDB', role: 'Base de datos NoSQL', version: '7.0+' },
      { name: 'Express.js', role: 'Framework backend', version: '4.18+' },
      { name: 'Vue.js', role: 'Framework frontend', version: '3+' },
      { name: 'Node.js', role: 'Runtime JavaScript', version: '20+' }
    ],
    advantages: [
      'Curva de aprendizaje suave',
      'Documentación excelente',
      'Flexibilidad en la arquitectura',
      'Rendimiento optimizado',
      'Ecosistema en crecimiento'
    ],
    disadvantages: [
      'Comunidad menor que React',
      'Menos recursos de terceros',
      'Mercado laboral más limitado',
      'Cambios frecuentes en versiones'
    ],
    prerequisites: [
      'JavaScript ES6+ sólido',
      'HTML/CSS intermedio',
      'Conceptos de componentes',
      'Conocimiento básico de APIs'
    ],
    systemRequirements: [
      'Node.js 18+ LTS',
      'MongoDB 6.0+',
      '6GB RAM mínimo',
      'Navegador moderno'
    ],
    documentation: 'https://vuejs.org/guide/',
    tutorials: [
      'Vue.js Official Guide',
      'MEVN Stack Tutorial - Net Ninja',
      'Vue Mastery Courses'
    ],
    officialWebsite: 'https://vuejs.org',
    setupInstructions: [
      'Instalar Node.js y npm',
      'Crear app Vue: npm create vue@latest mi-app',
      'Configurar backend con Express',
      'Conectar MongoDB',
      'Configurar Vite para desarrollo'
    ],
    initialFiles: [
      {
        path: 'src/App.vue',
        content: '<template><div id="app"><h1>MEVN App</h1></div></template><script>export default { name: "App" }</script>',
        description: 'Componente principal de Vue.js'
      }
    ]
  },

  // Next.js Full Stack
  {
    id: 'nextjs-fullstack',
    name: 'Next.js Full Stack',
    description: 'Framework React con capacidades full-stack, SSR/SSG y API routes integradas para aplicaciones web modernas.',
    shortDescription: 'React full-stack con SSR y API routes',
    image: 'https://via.placeholder.com/400x200/000000/FFFFFF?text=Next.js',
    icon: '▲',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    implementationEase: 4,
    uiQuality: 5,
    modernityStatus: 'Reciente',
    lastUpdate: '2024',
    difficultyLevel: 'Moderado',
    learningCurve: '2-3 meses para competencia',
    popularity: '24.1%',
    performance: {
      loadTime: '1.2s promedio',
      buildTime: '20-45s',
      bundleSize: '1.2-2.5MB',
      memoryUsage: '150-300MB'
    },
    community: {
      githubStars: '118k+',
      npmDownloads: '5.8M/semana',
      stackOverflowQuestions: '85k+',
      jobMarket: 'Muy Alto - 55k+ ofertas'
    },
    recommendedFor: ['Web', 'Enterprise', 'Startup'],
    useCases: [
      'E-commerce de alto rendimiento',
      'Sitios web corporativos',
      'Aplicaciones SaaS',
      'Blogs y CMS',
      'Aplicaciones con SEO crítico'
    ],
    successCases: [
      'Vercel (plataforma propia)',
      'TikTok (sitio web)',
      'Twitch (páginas estáticas)',
      'Hulu (interfaz web)'
    ],
    technologies: [
      { name: 'React', role: 'Framework frontend', version: '18+' },
      { name: 'Next.js', role: 'Framework full-stack', version: '14+' },
      { name: 'API Routes', role: 'Backend integrado', version: 'Built-in' },
      { name: 'Vercel', role: 'Plataforma de despliegue', version: 'Latest' }
    ],
    advantages: [
      'SSR/SSG out-of-the-box',
      'Optimizaciones automáticas',
      'API routes integradas',
      'Excelente DX (Developer Experience)',
      'Deploy simplificado'
    ],
    disadvantages: [
      'Vendor lock-in con Vercel',
      'Complejidad en configuraciones avanzadas',
      'Curva de aprendizaje para SSR',
      'Overhead para aplicaciones simples'
    ],
    prerequisites: [
      'React intermedio-avanzado',
      'JavaScript ES6+ sólido',
      'Conceptos de SSR/SSG',
      'Node.js básico'
    ],
    systemRequirements: [
      'Node.js 18+ LTS',
      '8GB RAM recomendado',
      'SSD para mejor rendimiento',
      'Navegador moderno'
    ],
    documentation: 'https://nextjs.org/docs',
    tutorials: [
      'Next.js Learn Course',
      'Next.js Crash Course - Traversy Media',
      'Full Stack Next.js - Lee Robinson'
    ],
    officialWebsite: 'https://nextjs.org',
    setupInstructions: [
      'Instalar Node.js 18+',
      'Crear app: npx create-next-app@latest mi-app',
      'Configurar TypeScript (opcional)',
      'Configurar base de datos',
      'Deploy en Vercel'
    ],
    initialFiles: [
      {
        path: 'pages/index.js',
        content: 'export default function Home() { return <div><h1>Next.js App</h1></div> }',
        description: 'Página principal de Next.js'
      }
    ]
  },

  // Flutter
  {
    id: 'flutter',
    name: 'Flutter',
    description: 'Framework de Google para desarrollo móvil multiplataforma con Dart, conocido por su rendimiento nativo.',
    shortDescription: 'Framework móvil multiplataforma de Google',
    image: 'https://via.placeholder.com/400x200/02569B/13B9FD?text=Flutter',
    icon: '🦋',
    primaryColor: '#02569B',
    secondaryColor: '#13B9FD',
    implementationEase: 3,
    uiQuality: 5,
    modernityStatus: 'Reciente',
    lastUpdate: '2024',
    difficultyLevel: 'Moderado',
    learningCurve: '3-6 meses para competencia',
    popularity: '32.5%',
    performance: {
      loadTime: '1.2s promedio',
      buildTime: '60-180s',
      bundleSize: '15-25MB',
      memoryUsage: '100-200MB'
    },
    community: {
      githubStars: '160k+',
      npmDownloads: 'N/A (pub.dev)',
      stackOverflowQuestions: '150k+',
      jobMarket: 'Alto - 30k+ ofertas'
    },
    recommendedFor: ['Mobile', 'Startup'],
    useCases: [
      'Aplicaciones móviles nativas',
      'Apps multiplataforma',
      'Aplicaciones de e-commerce',
      'Apps de productividad',
      'Juegos 2D simples'
    ],
    successCases: [
      'Google Ads (app oficial)',
      'Alibaba (Xianyu)',
      'BMW (My BMW App)',
      'eBay Motors'
    ],
    technologies: [
      { name: 'Dart', role: 'Lenguaje principal', version: '3.2+' },
      { name: 'Flutter SDK', role: 'Framework UI', version: '3.16+' },
      { name: 'Firebase', role: 'Backend services', version: 'Latest' },
      { name: 'SQLite', role: 'Base de datos local', version: '3.40+' }
    ],
    advantages: [
      'Rendimiento casi nativo',
      'Una sola base de código',
      'UI consistente entre plataformas',
      'Hot reload para desarrollo rápido',
      'Respaldo de Google'
    ],
    disadvantages: [
      'Curva de aprendizaje de Dart',
      'Tamaño de aplicación mayor',
      'Ecosistema más pequeño',
      'Menos desarrolladores disponibles'
    ],
    prerequisites: [
      'Programación orientada a objetos',
      'Conceptos de desarrollo móvil',
      'Dart básico',
      'Conocimiento de APIs'
    ],
    systemRequirements: [
      'Flutter SDK 3.16+',
      'Android Studio o VS Code',
      '8GB RAM mínimo',
      'Emuladores Android/iOS'
    ],
    documentation: 'https://docs.flutter.dev',
    tutorials: [
      'Flutter Official Codelabs',
      'Flutter & Dart - The Complete Guide',
      'Flutter Widget of the Week'
    ],
    officialWebsite: 'https://flutter.dev',
    setupInstructions: [
      'Instalar Flutter SDK',
      'Configurar Android Studio',
      'Crear proyecto: flutter create miapp',
      'Configurar emuladores',
      'Ejecutar: flutter run'
    ],
    initialFiles: [
      {
        path: 'lib/main.dart',
        content: 'import "package:flutter/material.dart";\nvoid main() => runApp(MyApp());\nclass MyApp extends StatelessWidget { Widget build(context) => MaterialApp(home: Scaffold(body: Center(child: Text("Hello Flutter!")))); }',
        description: 'Archivo principal de Flutter'
      }
    ]
  },

  // React Native
  {
    id: 'react-native',
    name: 'React Native',
    description: 'Framework de Facebook para desarrollo móvil multiplataforma usando React y JavaScript.',
    shortDescription: 'Desarrollo móvil con React y JavaScript',
    image: 'https://via.placeholder.com/400x200/61DAFB/20232A?text=React+Native',
    icon: '📱',
    primaryColor: '#61DAFB',
    secondaryColor: '#20232A',
    implementationEase: 4,
    uiQuality: 4,
    modernityStatus: 'Reciente',
    lastUpdate: '2024',
    difficultyLevel: 'Moderado',
    learningCurve: '2-4 meses para competencia',
    popularity: '38.2%',
    performance: {
      loadTime: '1.5s promedio',
      buildTime: '90-240s',
      bundleSize: '20-35MB',
      memoryUsage: '120-250MB'
    },
    community: {
      githubStars: '115k+',
      npmDownloads: '8M+/semana',
      stackOverflowQuestions: '120k+',
      jobMarket: 'Muy Alto - 50k+ ofertas'
    },
    recommendedFor: ['Mobile', 'Startup'],
    useCases: [
      'Aplicaciones móviles multiplataforma',
      'Apps de redes sociales',
      'E-commerce móvil',
      'Apps de productividad',
      'Aplicaciones de streaming'
    ],
    successCases: [
      'Facebook (app principal)',
      'Instagram (componentes)',
      'Uber Eats (app completa)',
      'Discord (app móvil)'
    ],
    technologies: [
      { name: 'React', role: 'Framework UI', version: '18+' },
      { name: 'JavaScript', role: 'Lenguaje principal', version: 'ES2022+' },
      { name: 'Metro', role: 'Bundler', version: 'Latest' },
      { name: 'Flipper', role: 'Debugging', version: 'Latest' }
    ],
    advantages: [
      'Reutilización de código React',
      'Desarrollo rápido',
      'Comunidad masiva',
      'Hot reloading',
      'Acceso a APIs nativas'
    ],
    disadvantages: [
      'Rendimiento menor que nativo',
      'Dependencia de librerías nativas',
      'Debugging más complejo',
      'Tamaño de aplicación mayor'
    ],
    prerequisites: [
      'React sólido',
      'JavaScript ES6+',
      'Conceptos de desarrollo móvil',
      'Conocimiento de APIs'
    ],
    systemRequirements: [
      'Node.js 18+',
      'React Native CLI',
      'Android Studio / Xcode',
      '8GB RAM mínimo'
    ],
    documentation: 'https://reactnative.dev',
    tutorials: [
      'React Native Official Tutorial',
      'The Complete React Native Course',
      'React Native - Maximilian'
    ],
    officialWebsite: 'https://reactnative.dev',
    setupInstructions: [
      'Instalar Node.js y npm',
      'Instalar React Native CLI',
      'Configurar Android Studio/Xcode',
      'Crear proyecto: npx react-native init MiApp',
      'Ejecutar: npx react-native run-android'
    ],
    initialFiles: [
      {
        path: 'App.js',
        content: 'import React from "react"; import {Text, View} from "react-native"; const App = () => <View><Text>Hello React Native!</Text></View>; export default App;',
        description: 'Componente principal de React Native'
      }
    ]
  },

  // SvelteKit
  {
    id: 'sveltekit',
    name: 'SvelteKit',
    description: 'Framework web de nueva generación basado en Svelte, optimizado para rendimiento y simplicidad.',
    shortDescription: 'Framework web moderno y ultra-rápido',
    image: 'https://via.placeholder.com/400x200/FF3E00/40B3FF?text=SvelteKit',
    icon: '🔥',
    primaryColor: '#FF3E00',
    secondaryColor: '#40B3FF',
    implementationEase: 5,
    uiQuality: 4,
    modernityStatus: 'Reciente',
    lastUpdate: '2024',
    difficultyLevel: 'Fácil',
    learningCurve: '1-2 meses para competencia',
    popularity: '8.7%',
    performance: {
      loadTime: '0.6s promedio',
      buildTime: '10-30s',
      bundleSize: '300KB-1.5MB',
      memoryUsage: '40-120MB'
    },
    community: {
      githubStars: '75k+',
      npmDownloads: '500k+/semana',
      stackOverflowQuestions: '15k+',
      jobMarket: 'Emergente - 5k+ ofertas'
    },
    recommendedFor: ['Web', 'Startup'],
    useCases: [
      'Aplicaciones web ultra-rápidas',
      'Sitios web estáticos',
      'SPAs de alto rendimiento',
      'Dashboards interactivos',
      'Aplicaciones de tiempo real'
    ],
    successCases: [
      'The New York Times (componentes)',
      'Apple (documentación)',
      'Spotify (herramientas internas)',
      '1Password (sitio web)'
    ],
    technologies: [
      { name: 'Svelte', role: 'Framework compilado', version: '4+' },
      { name: 'SvelteKit', role: 'Meta-framework', version: '2+' },
      { name: 'Vite', role: 'Build tool', version: '5+' },
      { name: 'TypeScript', role: 'Tipado estático', version: '5+' }
    ],
    advantages: [
      'Rendimiento excepcional',
      'Bundle size mínimo',
      'Sintaxis simple e intuitiva',
      'No virtual DOM overhead',
      'Compilación optimizada'
    ],
    disadvantages: [
      'Ecosistema más pequeño',
      'Menos desarrolladores disponibles',
      'Herramientas de desarrollo limitadas',
      'Comunidad en crecimiento'
    ],
    prerequisites: [
      'JavaScript moderno',
      'HTML/CSS sólido',
      'Conceptos de componentes',
      'Conocimiento básico de build tools'
    ],
    systemRequirements: [
      'Node.js 18+',
      'npm o pnpm',
      '4GB RAM mínimo',
      'Navegador moderno'
    ],
    documentation: 'https://kit.svelte.dev',
    tutorials: [
      'SvelteKit Official Tutorial',
      'Svelte Society Recipes',
      'Joy of Code - SvelteKit'
    ],
    officialWebsite: 'https://kit.svelte.dev',
    setupInstructions: [
      'Instalar Node.js 18+',
      'Crear proyecto: npm create svelte@latest mi-app',
      'Instalar dependencias: npm install',
      'Ejecutar: npm run dev',
      'Abrir http://localhost:5173'
    ],
    initialFiles: [
      {
        path: 'src/routes/+page.svelte',
        content: '<script>\n  let name = "SvelteKit";\n</script>\n\n<h1>Hello {name}!</h1>\n\n<style>\n  h1 { color: #ff3e00; }\n</style>',
        description: 'Página principal de SvelteKit'
      }
    ]
  },

  // Qwik
  {
    id: 'qwik',
    name: 'Qwik',
    description: 'Framework revolucionario con resumabilidad instantánea, diseñado para aplicaciones web de carga ultra-rápida.',
    shortDescription: 'Framework con resumabilidad instantánea',
    image: 'https://via.placeholder.com/400x200/AC7EF4/18B6F6?text=Qwik',
    icon: '⚡',
    primaryColor: '#AC7EF4',
    secondaryColor: '#18B6F6',
    implementationEase: 3,
    uiQuality: 4,
    modernityStatus: 'Reciente',
    lastUpdate: '2024',
    difficultyLevel: 'Moderado',
    learningCurve: '2-3 meses para competencia',
    popularity: '2.1%',
    performance: {
      loadTime: '0.3s promedio',
      buildTime: '5-20s',
      bundleSize: '1KB inicial',
      memoryUsage: '20-80MB'
    },
    community: {
      githubStars: '20k+',
      npmDownloads: '100k+/semana',
      stackOverflowQuestions: '2k+',
      jobMarket: 'Emergente - 1k+ ofertas'
    },
    recommendedFor: ['Web', 'Enterprise'],
    useCases: [
      'Aplicaciones web de alto rendimiento',
      'E-commerce de carga instantánea',
      'Sitios web empresariales',
      'PWAs optimizadas',
      'Aplicaciones de contenido'
    ],
    successCases: [
      'Builder.io (plataforma propia)',
      'Misko Hevery demos',
      'Qwik City showcase',
      'Early adopters enterprise'
    ],
    technologies: [
      { name: 'Qwik', role: 'Framework resumable', version: '1.4+' },
      { name: 'Qwik City', role: 'Meta-framework', version: '1.4+' },
      { name: 'TypeScript', role: 'Lenguaje principal', version: '5+' },
      { name: 'Vite', role: 'Build tool', version: '5+' }
    ],
    advantages: [
      'Carga instantánea (0 JS inicial)',
      'Resumabilidad única',
      'Rendimiento excepcional',
      'SEO optimizado',
      'Escalabilidad automática'
    ],
    disadvantages: [
      'Tecnología muy nueva',
      'Ecosistema limitado',
      'Curva de aprendizaje conceptual',
      'Pocos desarrolladores expertos'
    ],
    prerequisites: [
      'TypeScript sólido',
      'Conceptos de SSR/SSG',
      'JavaScript avanzado',
      'Conocimiento de frameworks modernos'
    ],
    systemRequirements: [
      'Node.js 18+',
      'TypeScript 5+',
      '4GB RAM mínimo',
      'Navegador moderno'
    ],
    documentation: 'https://qwik.builder.io',
    tutorials: [
      'Qwik Official Tutorial',
      'Qwik City Guide',
      'Builder.io Qwik Course'
    ],
    officialWebsite: 'https://qwik.builder.io',
    setupInstructions: [
      'Instalar Node.js 18+',
      'Crear proyecto: npm create qwik@latest',
      'Seleccionar template básico',
      'Instalar dependencias: npm install',
      'Ejecutar: npm start'
    ],
    initialFiles: [
      {
        path: 'src/routes/index.tsx',
        content: 'import { component$ } from "@builder.io/qwik";\n\nexport default component$(() => {\n  return <h1>Hello Qwik!</h1>;\n});',
        description: 'Componente principal de Qwik'
      }
    ]
  },

  // Laravel + Vue.js
  {
    id: 'laravel-vue',
    name: 'Laravel + Vue.js',
    description: 'Combinación poderosa de Laravel como backend API y Vue.js como frontend para aplicaciones web robustas.',
    shortDescription: 'PHP backend con Vue.js frontend',
    image: 'https://via.placeholder.com/400x200/FF2D20/4FC08D?text=Laravel+Vue',
    icon: '🔥',
    primaryColor: '#FF2D20',
    secondaryColor: '#4FC08D',
    implementationEase: 3,
    uiQuality: 4,
    modernityStatus: 'Establecido',
    lastUpdate: '2024',
    difficultyLevel: 'Moderado',
    learningCurve: '3-5 meses para competencia',
    popularity: '14.7%',
    performance: {
      loadTime: '1.8s promedio',
      buildTime: '30-60s',
      bundleSize: '2-3.5MB',
      memoryUsage: '150-300MB'
    },
    community: {
      githubStars: '77k+ (Laravel)',
      npmDownloads: '4.2M/semana (Vue)',
      stackOverflowQuestions: '200k+',
      jobMarket: 'Alto - 35k+ ofertas'
    },
    recommendedFor: ['Web', 'Enterprise'],
    useCases: [
      'Aplicaciones web empresariales',
      'Sistemas de gestión',
      'E-commerce robusto',
      'APIs REST complejas',
      'Dashboards administrativos'
    ],
    successCases: [
      'Laravel Nova (admin panel)',
      'Forge (gestión de servidores)',
      'Envoyer (deployment)',
      'Spark (SaaS boilerplate)'
    ],
    technologies: [
      { name: 'Laravel', role: 'Framework PHP', version: '10+' },
      { name: 'Vue.js', role: 'Framework frontend', version: '3+' },
      { name: 'Inertia.js', role: 'Adaptador SPA', version: '1+' },
      { name: 'MySQL', role: 'Base de datos', version: '8+' }
    ],
    advantages: [
      'Desarrollo backend rápido',
      'Eloquent ORM potente',
      'Artisan CLI útil',
      'Ecosystem maduro',
      'Documentación excelente'
    ],
    disadvantages: [
      'Requiere conocimiento de PHP',
      'Hosting más complejo',
      'Curva de aprendizaje dual',
      'Menos popular que JS stacks'
    ],
    prerequisites: [
      'PHP intermedio-avanzado',
      'JavaScript/Vue.js básico',
      'Conceptos de MVC',
      'Conocimiento de bases de datos'
    ],
    systemRequirements: [
      'PHP 8.1+',
      'Composer',
      'MySQL/PostgreSQL',
      '8GB RAM recomendado'
    ],
    documentation: 'https://laravel.com/docs',
    tutorials: [
      'Laravel Official Documentation',
      'Laracasts Video Tutorials',
      'Laravel + Vue.js Course'
    ],
    officialWebsite: 'https://laravel.com',
    setupInstructions: [
      'Instalar PHP 8.1+ y Composer',
      'Crear proyecto: composer create-project laravel/laravel mi-app',
      'Configurar base de datos',
      'Instalar Vue.js: npm install vue@next',
      'Configurar Inertia.js'
    ],
    initialFiles: [
      {
        path: 'resources/js/app.js',
        content: 'import { createApp } from "vue";\nimport App from "./App.vue";\n\ncreateApp(App).mount("#app");',
        description: 'Punto de entrada de Vue.js'
      }
    ]
  },

  // Nuxt.js Full Stack
  {
    id: 'nuxtjs-fullstack',
    name: 'Nuxt.js Full Stack',
    description: 'Framework Vue.js con capacidades full-stack, SSR/SSG y server routes para aplicaciones web universales.',
    shortDescription: 'Vue.js full-stack con SSR y server routes',
    image: 'https://via.placeholder.com/400x200/00DC82/020420?text=Nuxt.js',
    icon: '💚',
    primaryColor: '#00DC82',
    secondaryColor: '#020420',
    implementationEase: 4,
    uiQuality: 5,
    modernityStatus: 'Reciente',
    lastUpdate: '2024',
    difficultyLevel: 'Moderado',
    learningCurve: '2-4 meses para competencia',
    popularity: '18.9%',
    performance: {
      loadTime: '1.3s promedio',
      buildTime: '25-50s',
      bundleSize: '1.5-2.8MB',
      memoryUsage: '120-250MB'
    },
    community: {
      githubStars: '51k+',
      npmDownloads: '500k+/semana',
      stackOverflowQuestions: '25k+',
      jobMarket: 'Alto - 28k+ ofertas'
    },
    recommendedFor: ['Web', 'Enterprise', 'Startup'],
    useCases: [
      'Aplicaciones web universales',
      'E-commerce con SEO',
      'Sitios web corporativos',
      'Blogs y CMS',
      'PWAs avanzadas'
    ],
    successCases: [
      'GitLab (páginas estáticas)',
      'Upwork (componentes)',
      'Louis Vuitton (e-commerce)',
      'Fox News (sitio web)'
    ],
    technologies: [
      { name: 'Vue.js', role: 'Framework frontend', version: '3+' },
      { name: 'Nuxt.js', role: 'Meta-framework', version: '3+' },
      { name: 'Nitro', role: 'Server engine', version: '2+' },
      { name: 'Vite', role: 'Build tool', version: '5+' }
    ],
    advantages: [
      'SSR/SSG automático',
      'File-based routing',
      'Auto-imports',
      'Módulos ricos',
      'Developer experience excelente'
    ],
    disadvantages: [
      'Ecosistema menor que Next.js',
      'Curva de aprendizaje de Vue',
      'Menos recursos de terceros',
      'Configuración compleja avanzada'
    ],
    prerequisites: [
      'Vue.js intermedio',
      'JavaScript ES6+ sólido',
      'Conceptos de SSR/SSG',
      'Node.js básico'
    ],
    systemRequirements: [
      'Node.js 18+ LTS',
      '8GB RAM recomendado',
      'SSD para mejor rendimiento',
      'Navegador moderno'
    ],
    documentation: 'https://nuxt.com',
    tutorials: [
      'Nuxt.js Official Guide',
      'Vue School Nuxt Course',
      'Nuxt.js Crash Course'
    ],
    officialWebsite: 'https://nuxt.com',
    setupInstructions: [
      'Instalar Node.js 18+',
      'Crear app: npx nuxi@latest init mi-app',
      'Instalar dependencias: npm install',
      'Ejecutar: npm run dev',
      'Abrir http://localhost:3000'
    ],
    initialFiles: [
      {
        path: 'app.vue',
        content: '<template>\n  <div>\n    <h1>Nuxt.js App</h1>\n    <NuxtPage />\n  </div>\n</template>',
        description: 'Layout principal de Nuxt.js'
      }
    ]
  },

  // Xamarin
  {
    id: 'xamarin',
    name: 'Xamarin',
    description: 'Plataforma de Microsoft para desarrollo móvil multiplataforma usando C# y .NET.',
    shortDescription: 'Desarrollo móvil con C# y .NET',
    image: 'https://via.placeholder.com/400x200/3498DB/FFFFFF?text=Xamarin',
    icon: '📱',
    primaryColor: '#3498DB',
    secondaryColor: '#FFFFFF',
    implementationEase: 3,
    uiQuality: 4,
    modernityStatus: 'Establecido',
    lastUpdate: '2024',
    difficultyLevel: 'Avanzado',
    learningCurve: '3-6 meses para competencia',
    popularity: '8.2%',
    performance: {
      loadTime: '3.0s promedio',
      buildTime: '90-180s',
      bundleSize: '25-45MB',
      memoryUsage: '300-500MB'
    },
    community: {
      githubStars: '11k+',
      npmDownloads: 'N/A (NuGet)',
      stackOverflowQuestions: '45k+',
      jobMarket: 'Moderado - 15k+ ofertas'
    },
    recommendedFor: ['Mobile', 'Enterprise'],
    useCases: [
      'Aplicaciones empresariales móviles',
      'Apps con lógica de negocio compleja',
      'Integración con ecosistema Microsoft',
      'Aplicaciones con backend .NET',
      'Apps que requieren rendimiento nativo'
    ],
    successCases: [
      'Alaska Airlines (app móvil)',
      'Honeywell (apps industriales)',
      'Captio (gestión de gastos)',
      'Olo (pedidos de comida)'
    ],
    technologies: [
      { name: 'C#', role: 'Lenguaje principal', version: '11+' },
      { name: '.NET', role: 'Framework base', version: '6+' },
      { name: 'Xamarin.Forms', role: 'UI framework', version: '5+' },
      { name: 'MAUI', role: 'Evolución moderna', version: '7+' }
    ],
    advantages: [
      'Código compartido alto (90%+)',
      'Rendimiento casi nativo',
      'Integración con Azure',
      'Soporte empresarial robusto',
      'Acceso completo a APIs nativas'
    ],
    disadvantages: [
      'Tamaño de aplicación grande',
      'Curva de aprendizaje empinada',
      'Dependencia de Microsoft',
      'Comunidad más pequeña',
      'Costos de licencia'
    ],
    prerequisites: [
      'C# intermedio-avanzado',
      'Conceptos de .NET',
      'Conocimiento de XAML',
      'Desarrollo móvil básico'
    ],
    systemRequirements: [
      'Visual Studio 2022',
      'Windows 10/11 o macOS',
      '16GB RAM recomendado',
      'Android SDK / Xcode'
    ],
    documentation: 'https://docs.microsoft.com/xamarin',
    tutorials: [
      'Microsoft Learn Xamarin',
      'Xamarin University (archivado)',
      'Pluralsight Xamarin Courses'
    ],
    officialWebsite: 'https://dotnet.microsoft.com/apps/xamarin',
    setupInstructions: [
      'Instalar Visual Studio 2022',
      'Agregar workload de Xamarin',
      'Configurar Android SDK',
      'Instalar Xcode (macOS)',
      'Crear proyecto Xamarin.Forms'
    ],
    initialFiles: [
      {
        path: 'App.xaml.cs',
        content: 'using Xamarin.Forms;\n\nnamespace MiApp\n{\n    public partial class App : Application\n    {\n        public App()\n        {\n            InitializeComponent();\n            MainPage = new MainPage();\n        }\n    }\n}',
        description: 'Clase principal de la aplicación Xamarin'
      }
    ]
  },

  // Ionic
  {
    id: 'ionic',
    name: 'Ionic',
    description: 'Framework para desarrollo de aplicaciones móviles híbridas usando tecnologías web (HTML, CSS, JS).',
    shortDescription: 'Apps móviles híbridas con tecnologías web',
    image: 'https://via.placeholder.com/400x200/3880FF/FFFFFF?text=Ionic',
    icon: '⚡',
    primaryColor: '#3880FF',
    secondaryColor: '#FFFFFF',
    implementationEase: 4,
    uiQuality: 4,
    modernityStatus: 'Establecido',
    lastUpdate: '2024',
    difficultyLevel: 'Fácil',
    learningCurve: '1-3 meses para competencia',
    popularity: '16.7%',
    performance: {
      loadTime: '2.8s promedio',
      buildTime: '45-90s',
      bundleSize: '8-15MB',
      memoryUsage: '150-300MB'
    },
    community: {
      githubStars: '50k+',
      npmDownloads: '200k+/semana',
      stackOverflowQuestions: '65k+',
      jobMarket: 'Alto - 25k+ ofertas'
    },
    recommendedFor: ['Mobile', 'Startup', 'Web'],
    useCases: [
      'Aplicaciones móviles híbridas',
      'PWAs (Progressive Web Apps)',
      'Prototipos móviles rápidos',
      'Apps con presupuesto limitado',
      'Aplicaciones multiplataforma simples'
    ],
    successCases: [
      'Sworkit (fitness app)',
      'MarketWatch (noticias financieras)',
      'Diesel (e-commerce)',
      'Pacifica (salud mental)'
    ],
    technologies: [
      { name: 'Angular/React/Vue', role: 'Framework frontend', version: 'Latest' },
      { name: 'Capacitor', role: 'Runtime nativo', version: '5+' },
      { name: 'Cordova', role: 'Runtime alternativo', version: '12+' },
      { name: 'TypeScript', role: 'Lenguaje principal', version: '5+' }
    ],
    advantages: [
      'Desarrollo web familiar',
      'Una base de código',
      'Componentes UI ricos',
      'Desarrollo rápido',
      'Comunidad activa'
    ],
    disadvantages: [
      'Rendimiento limitado',
      'Dependencia de WebView',
      'Acceso limitado a APIs nativas',
      'Experiencia UX no completamente nativa',
      'Debugging complejo'
    ],
    prerequisites: [
      'HTML/CSS/JavaScript sólido',
      'Angular, React o Vue básico',
      'Conceptos de desarrollo móvil',
      'TypeScript básico'
    ],
    systemRequirements: [
      'Node.js 16+',
      'Ionic CLI',
      'Android Studio / Xcode',
      '8GB RAM mínimo'
    ],
    documentation: 'https://ionicframework.com/docs',
    tutorials: [
      'Ionic Official Tutorial',
      'Ionic Academy',
      'Ionic React/Angular/Vue Guides'
    ],
    officialWebsite: 'https://ionicframework.com',
    setupInstructions: [
      'Instalar Node.js 16+',
      'Instalar Ionic CLI: npm install -g @ionic/cli',
      'Crear proyecto: ionic start miApp tabs',
      'Configurar plataformas móviles',
      'Ejecutar: ionic serve'
    ],
    initialFiles: [
      {
        path: 'src/app/app.component.ts',
        content: 'import { Component } from "@angular/core";\n\n@Component({\n  selector: "app-root",\n  templateUrl: "app.component.html"\n})\nexport class AppComponent {\n  title = "Mi App Ionic";\n}',
        description: 'Componente principal de Ionic con Angular'
      }
    ]
  },

  // JAMstack
  {
    id: 'jamstack',
    name: 'JAMstack',
    description: 'Arquitectura moderna basada en JavaScript, APIs y Markup para sitios web rápidos y seguros.',
    shortDescription: 'JavaScript, APIs y Markup estático',
    image: 'https://via.placeholder.com/400x200/F0047F/FFFFFF?text=JAMstack',
    icon: '🚀',
    primaryColor: '#F0047F',
    secondaryColor: '#FFFFFF',
    implementationEase: 4,
    uiQuality: 5,
    modernityStatus: 'Reciente',
    lastUpdate: '2024',
    difficultyLevel: 'Moderado',
    learningCurve: '2-4 meses para competencia',
    popularity: '22.8%',
    performance: {
      loadTime: '0.8s promedio',
      buildTime: '15-45s',
      bundleSize: '500KB-2MB',
      memoryUsage: '50-150MB'
    },
    community: {
      githubStars: '100k+ (Gatsby)',
      npmDownloads: '2M+/semana',
      stackOverflowQuestions: '35k+',
      jobMarket: 'Alto - 30k+ ofertas'
    },
    recommendedFor: ['Web', 'Startup', 'Enterprise'],
    useCases: [
      'Sitios web estáticos de alto rendimiento',
      'Blogs y sitios de contenido',
      'E-commerce con headless CMS',
      'Landing pages optimizadas',
      'Documentación técnica'
    ],
    successCases: [
      'Netlify (plataforma propia)',
      'Gatsby (sitio oficial)',
      'Smashing Magazine',
      'Impossible Foods'
    ],
    technologies: [
      { name: 'Gatsby/Next.js/Nuxt', role: 'Generador estático', version: 'Latest' },
      { name: 'Headless CMS', role: 'Gestión de contenido', version: 'Various' },
      { name: 'CDN', role: 'Distribución global', version: 'N/A' },
      { name: 'Serverless Functions', role: 'Backend dinámico', version: 'N/A' }
    ],
    advantages: [
      'Rendimiento excepcional',
      'Seguridad mejorada',
      'Escalabilidad automática',
      'SEO optimizado',
      'Costos reducidos'
    ],
    disadvantages: [
      'Complejidad en contenido dinámico',
      'Dependencia de servicios externos',
      'Curva de aprendizaje de herramientas',
      'Limitaciones en tiempo real',
      'Debugging distribuido'
    ],
    prerequisites: [
      'JavaScript moderno',
      'React/Vue/Angular básico',
      'Conceptos de APIs REST/GraphQL',
      'Git y deployment básico'
    ],
    systemRequirements: [
      'Node.js 18+',
      'Git',
      'Editor de código',
      '4GB RAM mínimo'
    ],
    documentation: 'https://jamstack.org',
    tutorials: [
      'JAMstack.org Learning Resources',
      'Netlify JAMstack Templates',
      'Gatsby/Next.js Tutorials'
    ],
    officialWebsite: 'https://jamstack.org',
    setupInstructions: [
      'Elegir generador estático (Gatsby/Next/Nuxt)',
      'Configurar headless CMS',
      'Conectar con CDN (Netlify/Vercel)',
      'Configurar CI/CD',
      'Deploy automático'
    ],
    initialFiles: [
      {
        path: 'gatsby-config.js',
        content: 'module.exports = {\n  siteMetadata: {\n    title: "Mi Sitio JAMstack"\n  },\n  plugins: [\n    "gatsby-plugin-react-helmet",\n    "gatsby-plugin-image"\n  ]\n}',
        description: 'Configuración de Gatsby para JAMstack'
      }
    ]
  }
];

export const stackCategories: StackCategory[] = [
  {
    id: 'javascript-stacks',
    name: 'JavaScript Full-Stack',
    description: 'Stacks completos basados en JavaScript para desarrollo web moderno',
    icon: '🟨',
    stacks: technologyStacks.filter(stack =>
      ['mean-stack', 'mern-stack', 'mevn-stack', 'jamstack'].includes(stack.id)
    )
  },
  {
    id: 'react-ecosystem',
    name: 'Ecosistema React',
    description: 'Frameworks y herramientas basadas en React',
    icon: '⚛️',
    stacks: technologyStacks.filter(stack =>
      ['mern-stack', 'nextjs-fullstack', 'react-native'].includes(stack.id)
    )
  },
  {
    id: 'vue-ecosystem',
    name: 'Ecosistema Vue.js',
    description: 'Frameworks y herramientas basadas en Vue.js',
    icon: '🟢',
    stacks: technologyStacks.filter(stack =>
      ['mevn-stack', 'nuxtjs-fullstack', 'laravel-vue'].includes(stack.id)
    )
  },
  {
    id: 'backend-frameworks',
    name: 'Frameworks Backend',
    description: 'Frameworks robustos para desarrollo del lado del servidor',
    icon: '🔧',
    stacks: technologyStacks.filter(stack =>
      ['django', 'rails', 'laravel-vue'].includes(stack.id)
    )
  },
  {
    id: 'mobile-cross-platform',
    name: 'Mobile Cross-Platform',
    description: 'Tecnologías para desarrollo móvil multiplataforma',
    icon: '📱',
    stacks: technologyStacks.filter(stack =>
      ['flutter', 'react-native', 'xamarin', 'ionic'].includes(stack.id)
    )
  },
  {
    id: 'hybrid-mobile',
    name: 'Desarrollo Móvil Híbrido',
    description: 'Soluciones híbridas para desarrollo móvil',
    icon: '🔄',
    stacks: technologyStacks.filter(stack =>
      ['ionic', 'react-native'].includes(stack.id)
    )
  },
  {
    id: 'modern-performance',
    name: 'Alto Rendimiento Moderno',
    description: 'Frameworks de nueva generación optimizados para rendimiento',
    icon: '⚡',
    stacks: technologyStacks.filter(stack =>
      ['sveltekit', 'qwik', 'nextjs-fullstack', 'nuxtjs-fullstack', 'jamstack'].includes(stack.id)
    )
  },
  {
    id: 'fullstack-meta-frameworks',
    name: 'Meta-Frameworks Full-Stack',
    description: 'Frameworks con capacidades completas de frontend y backend',
    icon: '🚀',
    stacks: technologyStacks.filter(stack =>
      ['nextjs-fullstack', 'nuxtjs-fullstack', 'sveltekit'].includes(stack.id)
    )
  },
  {
    id: 'enterprise-solutions',
    name: 'Soluciones Empresariales',
    description: 'Tecnologías robustas para aplicaciones empresariales',
    icon: '🏢',
    stacks: technologyStacks.filter(stack =>
      ['xamarin', 'laravel-vue', 'django', 'rails'].includes(stack.id)
    )
  },
  {
    id: 'static-modern',
    name: 'Sitios Estáticos Modernos',
    description: 'Arquitecturas modernas para sitios web estáticos y JAMstack',
    icon: '🌐',
    stacks: technologyStacks.filter(stack =>
      ['jamstack', 'nextjs-fullstack', 'nuxtjs-fullstack'].includes(stack.id)
    )
  }
];
