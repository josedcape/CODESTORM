import { FileItem, ChatMessage, ApprovalData, ProgressData } from '../types';
import { generateUniqueId } from '../utils/idGenerator';
import { tryWithFallback } from './ai';

export interface WebPagePlan {
  id: string;
  title: string;
  description: string;
  structure: {
    id: string;
    section: string;
    description: string;
    content: string[];
  }[];
  design: {
    colorScheme: string;
    typography: string;
    layout: string;
    style: string;
  };
  functionality: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
}

export interface WebAIWorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  data?: any;
}

export interface WebAIWorkflowState {
  currentStep: number;
  steps: WebAIWorkflowStep[];
  userInstruction: string;
  enhancedPrompt?: string;
  webPagePlan?: WebPagePlan;
  generatedFiles?: FileItem[];
  isProcessing: boolean;
  requiresApproval: boolean;
  approvalData?: ApprovalData;
}

interface WebAIWorkflowListeners {
  stateChange: ((state: WebAIWorkflowState) => void)[];
  chatMessage: ((message: ChatMessage) => void)[];
  fileUpdate: ((files: FileItem[]) => void)[];
  progress: ((progress: ProgressData) => void)[];
}

export class WebAIWorkflowService {
  private static instance: WebAIWorkflowService;
  private workflowState: WebAIWorkflowState;
  private listeners: WebAIWorkflowListeners;

  private constructor() {
    this.workflowState = {
      currentStep: 0,
      steps: [
        {
          id: 'instruction-input',
          name: 'Instrucción del Usuario',
          description: 'Recibir la descripción de la página web a crear',
          status: 'pending'
        },
        {
          id: 'prompt-enhancement',
          name: 'Mejora del Prompt',
          description: 'Mejorar y refinar la descripción original',
          status: 'pending'
        },
        {
          id: 'plan-generation',
          name: 'Generación del Plan',
          description: 'Crear un plan detallado para la página web',
          status: 'pending'
        },
        {
          id: 'plan-approval',
          name: 'Aprobación del Plan',
          description: 'Revisar y aprobar el plan de desarrollo',
          status: 'pending'
        },
        {
          id: 'web-generation',
          name: 'Generación de Archivos',
          description: 'Generar HTML, CSS y JavaScript',
          status: 'pending'
        }
      ],
      userInstruction: '',
      isProcessing: false,
      requiresApproval: false
    };

    this.listeners = {
      stateChange: [],
      chatMessage: [],
      fileUpdate: [],
      progress: []
    };
  }

  public static getInstance(): WebAIWorkflowService {
    if (!WebAIWorkflowService.instance) {
      WebAIWorkflowService.instance = new WebAIWorkflowService();
    }
    return WebAIWorkflowService.instance;
  }

  // Event listeners
  public onStateChange(callback: (state: WebAIWorkflowState) => void): void {
    this.listeners.stateChange.push(callback);
  }

  public onChatMessage(callback: (message: ChatMessage) => void): void {
    this.listeners.chatMessage.push(callback);
  }

  public onFileUpdate(callback: (files: FileItem[]) => void): void {
    this.listeners.fileUpdate.push(callback);
  }

  public onProgress(callback: (progress: ProgressData) => void): void {
    this.listeners.progress.push(callback);
  }

  private emitStateChange(): void {
    this.listeners.stateChange.forEach(callback => callback(this.workflowState));
  }

  private emitChatMessage(message: ChatMessage): void {
    this.listeners.chatMessage.forEach(callback => callback(message));
  }

  private emitFileUpdate(files: FileItem[]): void {
    this.listeners.fileUpdate.forEach(callback => callback(files));
  }

  private emitProgress(progress: ProgressData): void {
    this.listeners.progress.forEach(callback => callback(progress));
  }

  // Getters
  public getState(): WebAIWorkflowState {
    return { ...this.workflowState };
  }

  public getCurrentStep(): WebAIWorkflowStep | null {
    return this.workflowState.steps[this.workflowState.currentStep] || null;
  }

  // Workflow methods
  public async startWorkflow(instruction: string): Promise<void> {
    this.workflowState.userInstruction = instruction;
    this.workflowState.currentStep = 0;
    this.workflowState.steps[0].status = 'completed';
    this.workflowState.steps[0].data = { instruction };

    // Move to prompt enhancement
    this.workflowState.currentStep = 1;
    this.workflowState.steps[1].status = 'in-progress';

    this.emitChatMessage({
      id: generateUniqueId('chat'),
      sender: 'ai',
      content: '✅ Instrucción recibida. ¿Te gustaría mejorar tu descripción con IA antes de continuar?',
      timestamp: Date.now(),
      type: 'notification',
      senderType: 'ai'
    });

    this.emitStateChange();
  }

  public async enhancePrompt(): Promise<{ success: boolean; enhancedPrompt?: string; error?: string }> {
    try {
      this.workflowState.isProcessing = true;
      this.emitStateChange();

      const enhancementPrompt = `
Mejora la siguiente descripción de página web para hacerla más específica, detallada y técnicamente precisa:

DESCRIPCIÓN ORIGINAL: ${this.workflowState.userInstruction}

Mejora la descripción agregando:
1. Detalles específicos sobre estructura y secciones
2. Especificaciones de diseño visual y colores
3. Funcionalidades interactivas necesarias
4. Consideraciones de UX/UI
5. Elementos técnicos importantes

Mantén el tono profesional y asegúrate de que la descripción mejorada sea clara y completa.
Responde SOLO con la descripción mejorada, sin texto adicional.
`;

      const response = await tryWithFallback(enhancementPrompt, 'Claude 3.5 Sonnet V2');

      if (response.content) {
        this.workflowState.enhancedPrompt = response.content.trim();
        this.workflowState.steps[1].status = 'completed';
        this.workflowState.steps[1].data = { enhancedPrompt: this.workflowState.enhancedPrompt };
        this.workflowState.isProcessing = false;

        this.emitChatMessage({
          id: generateUniqueId('chat'),
          sender: 'ai',
          content: '✨ Prompt mejorado exitosamente. Revisa la versión mejorada y decide si continuar.',
          timestamp: Date.now(),
          type: 'notification',
          senderType: 'ai'
        });

        this.emitStateChange();
        return { success: true, enhancedPrompt: this.workflowState.enhancedPrompt };
      } else {
        throw new Error('No se pudo generar el prompt mejorado');
      }
    } catch (error) {
      this.workflowState.isProcessing = false;
      this.workflowState.steps[1].status = 'failed';

      this.emitChatMessage({
        id: generateUniqueId('chat'),
        sender: 'ai',
        content: '❌ Error al mejorar el prompt. Puedes continuar con la descripción original.',
        timestamp: Date.now(),
        type: 'error',
        senderType: 'ai'
      });

      this.emitStateChange();
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  public async proceedWithPrompt(useEnhanced: boolean): Promise<void> {
    const promptToUse = useEnhanced && this.workflowState.enhancedPrompt
      ? this.workflowState.enhancedPrompt
      : this.workflowState.userInstruction;

    // Update the instruction to use
    this.workflowState.userInstruction = promptToUse;

    // Move to plan generation
    this.workflowState.currentStep = 2;
    this.workflowState.steps[2].status = 'in-progress';
    this.workflowState.isProcessing = true;

    this.emitChatMessage({
      id: generateUniqueId('chat'),
      sender: 'ai',
      content: `✅ Usando ${useEnhanced ? 'descripción mejorada' : 'descripción original'}. Generando plan detallado...`,
      timestamp: Date.now(),
      type: 'notification',
      senderType: 'ai'
    });

    this.emitStateChange();

    // Generate web page plan
    await this.generateWebPagePlan();
  }

  public async skipEnhancement(): Promise<void> {
    this.workflowState.steps[1].status = 'completed';
    this.workflowState.steps[1].data = { skipped: true };
    await this.proceedWithPrompt(false);
  }

  private async generateWebPagePlan(): Promise<void> {
    try {
      const planPrompt = `
Crea un plan detallado para desarrollar la siguiente página web:

DESCRIPCIÓN: ${this.workflowState.userInstruction}

Genera un plan estructurado en formato JSON con:
1. Título del proyecto
2. Descripción general
3. Estructura de secciones (mínimo 4, máximo 8 secciones)
4. Especificaciones de diseño (colores, tipografía, layout, estilo)
5. Funcionalidades interactivas necesarias
6. Nivel de complejidad estimado

Cada sección debe incluir:
- Nombre de la sección
- Descripción detallada
- Contenido específico a incluir

Responde SOLO con el JSON, sin texto adicional.
`;

      const response = await tryWithFallback(planPrompt, 'Claude 3.5 Sonnet V2');

      // Parse the response to extract the web page plan
      const plan = this.parseWebPagePlan(response.content);

      this.workflowState.webPagePlan = plan;
      this.workflowState.steps[2].status = 'completed';
      this.workflowState.steps[2].data = { plan };

      // Move to plan approval
      this.workflowState.currentStep = 3;
      this.workflowState.steps[3].status = 'in-progress';
      this.workflowState.isProcessing = false;
      this.workflowState.requiresApproval = true;
      this.workflowState.approvalData = {
        id: generateUniqueId('approval'),
        type: 'webplan',
        title: 'Aprobación del Plan de Página Web',
        description: 'Revisa el plan generado y decide si proceder con la generación',
        data: plan,
        timestamp: Date.now(),
        items: [
          {
            id: 'plan-overview',
            type: 'plan',
            title: plan.title,
            description: plan.description,
            content: plan,
            status: 'pending'
          }
        ]
      };

      this.emitChatMessage({
        id: generateUniqueId('chat'),
        sender: 'ai',
        content: '📋 Plan de página web generado. Por favor, revísalo y apruébalo para continuar con la generación.',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai'
      });

      this.emitStateChange();

    } catch (error) {
      console.error('Error generating web page plan:', error);
      this.workflowState.steps[2].status = 'failed';
      this.workflowState.isProcessing = false;

      this.emitChatMessage({
        id: generateUniqueId('chat'),
        sender: 'ai',
        content: '❌ Error al generar el plan de la página web. Por favor, intenta nuevamente.',
        timestamp: Date.now(),
        type: 'error',
        senderType: 'ai'
      });

      this.emitStateChange();
    }
  }

  private parseWebPagePlan(content: string): WebPagePlan {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          id: generateUniqueId('plan'),
          title: parsed.title || 'Página Web',
          description: parsed.description || 'Página web generada automáticamente',
          structure: parsed.structure || [],
          design: parsed.design || {
            colorScheme: 'Moderno y profesional',
            typography: 'Sans-serif limpia',
            layout: 'Responsive',
            style: 'Minimalista'
          },
          functionality: parsed.functionality || [],
          estimatedComplexity: parsed.estimatedComplexity || 'medium'
        };
      }
    } catch (error) {
      console.error('Error parsing web page plan:', error);
    }

    // Fallback plan if parsing fails
    return {
      id: generateUniqueId('plan'),
      title: 'Página Web',
      description: 'Página web basada en la descripción proporcionada',
      structure: [
        {
          id: generateUniqueId('section'),
          section: 'Header',
          description: 'Encabezado con navegación',
          content: ['Logo', 'Menú de navegación']
        },
        {
          id: generateUniqueId('section'),
          section: 'Hero',
          description: 'Sección principal de impacto',
          content: ['Título principal', 'Subtítulo', 'Call-to-action']
        },
        {
          id: generateUniqueId('section'),
          section: 'Content',
          description: 'Contenido principal',
          content: ['Información relevante', 'Características']
        },
        {
          id: generateUniqueId('section'),
          section: 'Footer',
          description: 'Pie de página',
          content: ['Información de contacto', 'Enlaces adicionales']
        }
      ],
      design: {
        colorScheme: 'Azul y blanco profesional',
        typography: 'Sans-serif moderna',
        layout: 'Responsive y centrado',
        style: 'Limpio y minimalista'
      },
      functionality: ['Navegación suave', 'Diseño responsive', 'Animaciones CSS'],
      estimatedComplexity: 'medium'
    };
  }

  public async approvePlan(approved: boolean, feedback?: string): Promise<void> {
    if (approved) {
      this.workflowState.steps[3].status = 'completed';
      this.workflowState.currentStep = 4;
      this.workflowState.steps[4].status = 'in-progress';
      this.workflowState.requiresApproval = false;
      this.workflowState.approvalData = undefined;
      this.workflowState.isProcessing = true;

      this.emitChatMessage({
        id: generateUniqueId('chat'),
        sender: 'ai',
        content: '✅ Plan aprobado. Iniciando generación de archivos HTML, CSS y JavaScript...',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai'
      });

      // Start web page generation
      await this.startWebPageGeneration();
    } else {
      this.workflowState.steps[3].status = 'failed';
      this.workflowState.requiresApproval = false;
      this.workflowState.approvalData = undefined;

      this.emitChatMessage({
        id: generateUniqueId('chat'),
        sender: 'ai',
        content: `❌ Plan rechazado. ${feedback ? `Comentario: ${feedback}` : ''} Puedes modificar la descripción y generar un nuevo plan.`,
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai'
      });
    }

    this.emitStateChange();
  }

  private async startWebPageGeneration(): Promise<void> {
    try {
      if (!this.workflowState.webPagePlan) {
        throw new Error('No hay plan de página web disponible');
      }

      const plan = this.workflowState.webPagePlan;

      // Progress tracking
      this.emitProgress({
        id: generateUniqueId('progress'),
        stage: 'Generando HTML',
        progress: 25,
        message: 'Creando estructura HTML...',
        timestamp: Date.now()
      });

      // Generate HTML
      const htmlContent = await this.generateHTML(plan);

      this.emitProgress({
        id: generateUniqueId('progress'),
        stage: 'Generando CSS',
        progress: 50,
        message: 'Creando estilos CSS...',
        timestamp: Date.now()
      });

      // Generate CSS
      const cssContent = await this.generateCSS(plan);

      this.emitProgress({
        id: generateUniqueId('progress'),
        stage: 'Generando JavaScript',
        progress: 75,
        message: 'Creando funcionalidad JavaScript...',
        timestamp: Date.now()
      });

      // Generate JavaScript
      const jsContent = await this.generateJavaScript(plan);

      this.emitProgress({
        id: generateUniqueId('progress'),
        stage: 'Finalizando',
        progress: 100,
        message: 'Archivos generados exitosamente',
        timestamp: Date.now()
      });

      // Create file items
      const files: FileItem[] = [
        {
          id: generateUniqueId('file'),
          name: 'index.html',
          path: 'index.html',
          content: htmlContent,
          type: 'file',
          language: 'html',
          size: htmlContent.length,
          lastModified: Date.now()
        },
        {
          id: generateUniqueId('file'),
          name: 'styles.css',
          path: 'styles.css',
          content: cssContent,
          type: 'file',
          language: 'css',
          size: cssContent.length,
          lastModified: Date.now()
        },
        {
          id: generateUniqueId('file'),
          name: 'script.js',
          path: 'script.js',
          content: jsContent,
          type: 'file',
          language: 'javascript',
          size: jsContent.length,
          lastModified: Date.now()
        }
      ];

      this.workflowState.generatedFiles = files;
      this.workflowState.steps[4].status = 'completed';
      this.workflowState.steps[4].data = { files };
      this.workflowState.isProcessing = false;

      this.emitChatMessage({
        id: generateUniqueId('chat'),
        sender: 'ai',
        content: '🎉 ¡Página web generada exitosamente! Se han creado 3 archivos: index.html, styles.css y script.js',
        timestamp: Date.now(),
        type: 'success',
        senderType: 'ai'
      });

      this.emitFileUpdate(files);
      this.emitStateChange();

    } catch (error) {
      console.error('Error generating web page:', error);
      this.workflowState.steps[4].status = 'failed';
      this.workflowState.isProcessing = false;

      this.emitChatMessage({
        id: generateUniqueId('chat'),
        sender: 'ai',
        content: '❌ Error al generar la página web. Por favor, intenta nuevamente.',
        timestamp: Date.now(),
        type: 'error',
        senderType: 'ai'
      });

      this.emitStateChange();
    }
  }

  private async generateHTML(plan: WebPagePlan): Promise<string> {
    const htmlPrompt = `
Genera un archivo HTML completo y profesional basado en el siguiente plan:

TÍTULO: ${plan.title}
DESCRIPCIÓN: ${plan.description}
ESTRUCTURA: ${JSON.stringify(plan.structure, null, 2)}
DISEÑO: ${JSON.stringify(plan.design, null, 2)}
FUNCIONALIDADES: ${plan.functionality.join(', ')}

Requisitos:
1. HTML5 semántico y accesible
2. Meta tags completos para SEO
3. Estructura responsive
4. Enlaces a styles.css y script.js
5. Contenido real y profesional (no lorem ipsum)
6. Atributos alt en imágenes
7. Estructura clara con header, main, sections y footer

Responde SOLO con el código HTML, sin explicaciones.
`;

    const response = await tryWithFallback(htmlPrompt, 'Claude 3.5 Sonnet V2');
    return response.content.trim();
  }

  private async generateCSS(plan: WebPagePlan): Promise<string> {
    const cssPrompt = `
Genera un archivo CSS completo y profesional basado en el siguiente plan:

TÍTULO: ${plan.title}
DESCRIPCIÓN: ${plan.description}
DISEÑO: ${JSON.stringify(plan.design, null, 2)}
ESTRUCTURA: ${JSON.stringify(plan.structure, null, 2)}

Requisitos:
1. CSS moderno con variables CSS
2. Diseño completamente responsive (mobile-first)
3. Animaciones y transiciones suaves
4. Tipografía profesional
5. Esquema de colores coherente
6. Grid y Flexbox para layouts
7. Hover effects y micro-interacciones
8. Optimizado para rendimiento

Responde SOLO con el código CSS, sin explicaciones.
`;

    const response = await tryWithFallback(cssPrompt, 'Claude 3.5 Sonnet V2');
    return response.content.trim();
  }

  private async generateJavaScript(plan: WebPagePlan): Promise<string> {
    const jsPrompt = `
Genera un archivo JavaScript completo y profesional basado en el siguiente plan:

TÍTULO: ${plan.title}
FUNCIONALIDADES: ${plan.functionality.join(', ')}
ESTRUCTURA: ${JSON.stringify(plan.structure, null, 2)}

Requisitos:
1. JavaScript vanilla moderno (ES6+)
2. Funcionalidades interactivas
3. Navegación suave
4. Animaciones al scroll
5. Formularios funcionales
6. Responsive menu toggle
7. Lazy loading de imágenes
8. Código limpio y comentado

Responde SOLO con el código JavaScript, sin explicaciones.
`;

    const response = await tryWithFallback(jsPrompt, 'Claude 3.5 Sonnet V2');
    return response.content.trim();
  }

  // Reset workflow
  public resetWorkflow(): void {
    this.workflowState = {
      currentStep: 0,
      steps: this.workflowState.steps.map(step => ({ ...step, status: 'pending', data: undefined })),
      userInstruction: '',
      enhancedPrompt: undefined,
      webPagePlan: undefined,
      generatedFiles: undefined,
      isProcessing: false,
      requiresApproval: false,
      approvalData: undefined
    };

    this.emitStateChange();
  }

  // Utility methods
  public canEnhancePrompt(): boolean {
    return this.workflowState.currentStep === 1 &&
           this.workflowState.userInstruction.trim().length >= 10;
  }

  public canProceedToGeneration(): boolean {
    return this.workflowState.currentStep >= 2 &&
           this.workflowState.webPagePlan !== undefined;
  }

  public getGeneratedFiles(): FileItem[] {
    return this.workflowState.generatedFiles || [];
  }
}
