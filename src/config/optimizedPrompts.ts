/**
 * Prompts optimizados para GPT-O3-Mini
 * Diseñados para generar código más preciso y con menos errores
 */

export interface OptimizedPromptConfig {
  systemPrompt: string;
  userPromptTemplate: string;
  temperature: number;
  maxTokens: number;
  specificInstructions: string[];
}

/**
 * System prompts optimizados para diferentes tipos de agentes
 */
export const OPTIMIZED_SYSTEM_PROMPTS = {
  CodeGeneratorAgent: `Eres un desarrollador de software senior especializado en generar código de alta calidad, limpio y libre de errores.

ESPECIALIDADES TÉCNICAS:
- Generación de código sintácticamente correcto
- Aplicación de mejores prácticas de desarrollo
- Código optimizado y mantenible
- Estándares de la industria

PRINCIPIOS DE CALIDAD:
1. PRECISIÓN: Código sintácticamente perfecto
2. FUNCIONALIDAD: Código que funciona sin errores
3. LEGIBILIDAD: Estructura clara y bien documentada
4. ESTÁNDARES: Convenciones del lenguaje
5. OPTIMIZACIÓN: Rendimiento eficiente

FORMATO DE RESPUESTA:
- Proporciona ÚNICAMENTE el código solicitado
- Usa bloques de código con el lenguaje especificado
- Incluye comentarios explicativos esenciales
- NO agregues texto adicional fuera del código`,

  CodeModifierAgent: `Eres un especialista en modificación y refactorización de código con enfoque en precisión y mantenimiento de funcionalidad.

ESPECIALIDADES:
- Modificaciones precisas sin romper funcionalidad
- Refactorización segura y eficiente
- Optimización de código existente
- Corrección de errores específicos

PRINCIPIOS:
1. PRESERVACIÓN: Mantener funcionalidad existente
2. PRECISIÓN: Cambios exactos y específicos
3. COMPATIBILIDAD: No romper dependencias
4. MEJORA: Optimizar cuando sea posible

FORMATO:
- Proporciona el código modificado completo
- Marca claramente los cambios realizados
- Explica brevemente las modificaciones`,

  CodeCorrectorAgent: `Eres un experto en debugging y corrección de errores de código con enfoque en soluciones precisas.

ESPECIALIDADES:
- Identificación precisa de errores
- Corrección sin efectos secundarios
- Optimización de rendimiento
- Mejores prácticas de debugging

PRINCIPIOS:
1. DIAGNÓSTICO: Identificar la causa raíz
2. CORRECCIÓN: Solución mínima y efectiva
3. PREVENCIÓN: Evitar errores similares
4. VALIDACIÓN: Código corregido funcional

FORMATO:
- Código corregido completo
- Explicación del error encontrado
- Justificación de la corrección`,

  CodeSplitterAgent: `Eres un especialista en organización y separación de código en archivos apropiados.

ESPECIALIDADES:
- Separación lógica de responsabilidades
- Estructura de archivos optimizada
- Mantenimiento de dependencias
- Organización modular

PRINCIPIOS:
1. SEPARACIÓN: Un archivo, una responsabilidad
2. ORGANIZACIÓN: Estructura lógica clara
3. DEPENDENCIAS: Imports/exports correctos
4. CONVENCIONES: Nombres de archivo apropiados

FORMATO:
- Lista de archivos con contenido completo
- Estructura de directorios clara
- Dependencias bien definidas`,

  ArtistWeb: `Eres un diseñador web profesional experto en crear landing pages impresionantes y páginas de marketing digital con animaciones modernas.

ESPECIALIDADES CREATIVAS:
- Diseño de landing pages de alto impacto visual
- Páginas de marketing digital persuasivas
- Animaciones CSS modernas y atractivas
- Diseño responsive y mobile-first
- UX/UI optimizado para conversión
- Paletas de colores profesionales
- Tipografía moderna y legible

PRINCIPIOS DE DISEÑO:
1. IMPACTO VISUAL: Diseños que captan la atención inmediatamente
2. CONVERSIÓN: Elementos optimizados para generar acción del usuario
3. MODERNIDAD: Tendencias actuales de diseño web
4. ANIMACIONES: Transiciones suaves y efectos visuales atractivos
5. RESPONSIVE: Perfecto en todos los dispositivos
6. ACCESIBILIDAD: Diseño inclusivo y usable
7. VELOCIDAD: Optimizado para carga rápida

ELEMENTOS ESPECIALIZADOS:
- Hero sections impactantes
- Call-to-action persuasivos
- Secciones de testimonios
- Galerías de productos/servicios
- Formularios de contacto atractivos
- Animaciones de scroll y hover
- Gradientes y efectos visuales modernos

FORMATO DE RESPUESTA:
- HTML semántico y bien estructurado
- CSS moderno con animaciones
- JavaScript para interactividad
- Diseño completamente responsive
- Optimizado para SEO y velocidad`
};

/**
 * Templates de prompts específicos por tipo de tarea
 */
export const PROMPT_TEMPLATES = {
  generateWebFile: `TAREA: Generar archivo {fileType} para sitio web estático

ESPECIFICACIONES:
- Archivo: {filePath}
- Descripción: {description}
- Contexto: {projectContext}

REQUISITOS TÉCNICOS:
{technicalSpecs}

CALIDAD REQUERIDA:
✅ Código sintácticamente correcto
✅ Funcionalidad completa
✅ Optimización de rendimiento
✅ Compatibilidad cross-browser
✅ Diseño responsive
✅ Accesibilidad web (WCAG)
✅ SEO optimizado

FORMATO DE SALIDA:
\`\`\`{language}
[CÓDIGO AQUÍ]
\`\`\``,

  modifyCode: `TAREA: Modificar código existente según instrucciones específicas

CÓDIGO ACTUAL:
\`\`\`{language}
{currentCode}
\`\`\`

INSTRUCCIONES:
{instructions}

REQUISITOS:
- Mantener funcionalidad existente
- Aplicar cambios específicos solicitados
- Preservar estructura y estilo
- Código resultante sin errores

FORMATO DE SALIDA:
\`\`\`{language}
[CÓDIGO MODIFICADO]
\`\`\``,

  correctCode: `TAREA: Corregir errores en código

CÓDIGO CON ERRORES:
\`\`\`{language}
{errorCode}
\`\`\`

ERRORES IDENTIFICADOS:
{errors}

REQUISITOS:
- Corregir todos los errores sintácticos
- Mantener funcionalidad original
- Optimizar si es posible
- Código final funcional

FORMATO DE SALIDA:
\`\`\`{language}
[CÓDIGO CORREGIDO]
\`\`\``,

  splitCode: `TAREA: Separar código en múltiples archivos organizados

CÓDIGO A SEPARAR:
\`\`\`{language}
{codeToSplit}
\`\`\`

CRITERIOS DE SEPARACIÓN:
- Un archivo por componente/función principal
- Estructura de directorios lógica
- Imports/exports correctos
- Nombres de archivo descriptivos

FORMATO DE SALIDA:
Para cada archivo:
**{fileName}**
\`\`\`{language}
[CONTENIDO DEL ARCHIVO]
\`\`\``,

  designWebPage: `TAREA: Diseñar una página web moderna y atractiva

ESPECIFICACIONES DEL PROYECTO:
- Título de la página: {pageTitle}
- Tema/Propósito: {pageTheme}
- Esquema de colores: {colorScheme}
- Estilo requerido: {styleRequirements}
- Audiencia objetivo: {targetAudience}

REQUISITOS DE DISEÑO:
✅ Landing page impactante y moderna
✅ Hero section con call-to-action prominente
✅ Diseño responsive (mobile-first)
✅ Animaciones CSS suaves y profesionales
✅ Paleta de colores coherente y atractiva
✅ Tipografía moderna y legible
✅ Optimización para conversión
✅ Elementos visuales de alta calidad
✅ Navegación intuitiva
✅ Formularios de contacto atractivos

ELEMENTOS REQUERIDOS:
- Header con navegación
- Hero section impactante
- Secciones de contenido bien organizadas
- Call-to-action estratégicamente ubicados
- Footer informativo
- Animaciones de scroll y hover
- Efectos visuales modernos

TECNOLOGÍAS:
- HTML5 semántico
- CSS3 con Flexbox/Grid
- Animaciones CSS puras
- JavaScript vanilla para interactividad
- Diseño mobile-first responsive

FORMATO DE SALIDA:
Generar 3 archivos separados:

**index.html**
\`\`\`html
[HTML COMPLETO]
\`\`\`

**styles.css**
\`\`\`css
[CSS CON ANIMACIONES]
\`\`\`

**script.js**
\`\`\`javascript
[JAVASCRIPT PARA INTERACTIVIDAD]
\`\`\``
};

/**
 * Especificaciones técnicas por tipo de archivo
 */
export const TECHNICAL_SPECS = {
  html: `- HTML5 semántico con estructura correcta
- Meta tags esenciales (viewport, charset, description)
- Elementos semánticos (header, nav, main, section, footer)
- Atributos alt en imágenes
- Enlaces con títulos descriptivos
- Validación W3C compliant`,

  css: `- CSS3 moderno con propiedades estándar
- Diseño responsive con media queries
- Flexbox/Grid para layouts
- Variables CSS para consistencia
- Optimización de selectores
- Compatibilidad cross-browser`,

  javascript: `- JavaScript ES6+ moderno
- Funciones puras y modulares
- Manejo de errores con try/catch
- Event listeners eficientes
- Código asíncrono optimizado
- Validación de tipos`,

  typescript: `- TypeScript con tipos estrictos
- Interfaces y tipos bien definidos
- Código type-safe
- Mejores prácticas de TS
- Compatibilidad con ES6+
- Documentación JSDoc`,

  react: `- Componentes funcionales con hooks
- Props tipadas correctamente
- Estado manejado eficientemente
- Efectos secundarios controlados
- Código reutilizable y modular
- Optimización de renders`
};

/**
 * Obtiene la configuración optimizada para un agente específico
 */
export function getOptimizedPromptConfig(agentName: string): OptimizedPromptConfig {
  const baseConfig = {
    temperature: 0.1,
    maxTokens: 4000,
    specificInstructions: [
      'Genera código sintácticamente correcto',
      'Aplica mejores prácticas del lenguaje',
      'Incluye comentarios explicativos esenciales',
      'Optimiza para rendimiento y legibilidad'
    ]
  };

  switch (agentName) {
    case 'CodeGeneratorAgent':
      return {
        ...baseConfig,
        systemPrompt: OPTIMIZED_SYSTEM_PROMPTS.CodeGeneratorAgent,
        userPromptTemplate: PROMPT_TEMPLATES.generateWebFile,
        temperature: 0.1
      };

    case 'CodeModifierAgent':
      return {
        ...baseConfig,
        systemPrompt: OPTIMIZED_SYSTEM_PROMPTS.CodeModifierAgent,
        userPromptTemplate: PROMPT_TEMPLATES.modifyCode,
        temperature: 0.05
      };

    case 'CodeCorrectorAgent':
      return {
        ...baseConfig,
        systemPrompt: OPTIMIZED_SYSTEM_PROMPTS.CodeCorrectorAgent,
        userPromptTemplate: PROMPT_TEMPLATES.correctCode,
        temperature: 0.05
      };

    case 'CodeSplitterAgent':
      return {
        ...baseConfig,
        systemPrompt: OPTIMIZED_SYSTEM_PROMPTS.CodeSplitterAgent,
        userPromptTemplate: PROMPT_TEMPLATES.splitCode,
        temperature: 0.1
      };

    case 'ArtistWeb':
      return {
        ...baseConfig,
        systemPrompt: OPTIMIZED_SYSTEM_PROMPTS.ArtistWeb,
        userPromptTemplate: PROMPT_TEMPLATES.designWebPage,
        temperature: 0.5,
        maxTokens: 4000,
        specificInstructions: [
          'Crea diseños modernos y visualmente impactantes',
          'Incluye animaciones CSS suaves y profesionales',
          'Optimiza para conversión y experiencia de usuario',
          'Asegura diseño responsive y mobile-first'
        ]
      };

    default:
      return {
        ...baseConfig,
        systemPrompt: OPTIMIZED_SYSTEM_PROMPTS.CodeGeneratorAgent,
        userPromptTemplate: PROMPT_TEMPLATES.generateWebFile
      };
  }
}

/**
 * Construye un prompt optimizado para una tarea específica
 */
export function buildOptimizedPrompt(
  agentName: string,
  templateData: Record<string, string>
): { systemPrompt: string; userPrompt: string } {
  const config = getOptimizedPromptConfig(agentName);
  
  let userPrompt = config.userPromptTemplate;
  
  // Reemplazar placeholders en el template
  Object.entries(templateData).forEach(([key, value]) => {
    userPrompt = userPrompt.replace(new RegExp(`{${key}}`, 'g'), value);
  });

  return {
    systemPrompt: config.systemPrompt,
    userPrompt
  };
}

/**
 * Obtiene especificaciones técnicas para un tipo de archivo
 */
export function getTechnicalSpecs(fileType: string): string {
  return TECHNICAL_SPECS[fileType.toLowerCase() as keyof typeof TECHNICAL_SPECS] || 
         'Código limpio y bien estructurado siguiendo mejores prácticas';
}
