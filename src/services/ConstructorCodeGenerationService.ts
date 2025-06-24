import {
  AgentTask,
  FileItem,
  ChatMessage,
  PlannerResult,
  CodeGeneratorResult,
  CodeModifierResult,
  FileObserverState
} from '../types';

// Simplified technology stack interface for Constructor
interface SimpleTechnologyStack {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  category: string;
  complexity: 'low' | 'medium' | 'high';
  features: string[];
}
import { PlannerAgent } from '../agents/PlannerAgent';
import { OptimizedPlannerAgent } from '../agents/OptimizedPlannerAgent';
import { CodeGeneratorAgent } from '../agents/CodeGeneratorAgent';
import { CodeModifierAgent } from '../agents/CodeModifierAgent';
import { FileObserverAgent } from '../agents/FileObserverAgent';
import { DesignArchitectAgent } from '../agents/DesignArchitectAgent';
import { EnhancedDesignArchitectAgent } from '../agents/EnhancedDesignArchitectAgent';
import { generateUniqueId } from '../utils/idGenerator';
import { EnhancedAPIService } from './EnhancedAPIService';
import { AgentDistributionService } from './AgentDistributionService';
import { getEffectiveAgentConfig, getGlobalModelConfig } from '../config/claudeModels';
import { withTokenTracking, setGlobalTokenTracker } from '../utils/tokenTrackingMiddleware';

export interface CodeGenerationProgress {
  currentStep: string;
  currentFile: string;
  totalFiles: number;
  completedFiles: number;
  percentage: number;
  estimatedTimeRemaining: number;
}

export interface GenerationResult {
  success: boolean;
  files: FileItem[];
  projectStructure: any;
  error?: string;
  metadata?: {
    totalFiles: number;
    executionTime: number;
    agentsUsed: string[];
  };
}

/**
 * Servicio especializado para la generación de código real en el Constructor
 * Integra todos los agentes especializados para crear proyectos completos
 */
export interface InstructionAnalysis {
  projectType: string;
  designPreferences: {
    style: string;
    colorScheme: string;
    layout: string;
  };
  functionalRequirements: string[];
  technologyPreferences: string[];
  complexity: 'basic' | 'intermediate' | 'advanced';
  estimatedFiles: number;
}

export class ConstructorCodeGenerationService {
  private static instance: ConstructorCodeGenerationService;
  private isGenerating = false;
  private currentProgress: CodeGenerationProgress | null = null;
  private progressCallbacks: ((progress: CodeGenerationProgress) => void)[] = [];
  private chatCallbacks: ((message: ChatMessage) => void)[] = [];
  private fileCallbacks: ((files: FileItem[]) => void)[] = [];
  private apiService = EnhancedAPIService.getInstance();
  private distributionService = AgentDistributionService.getInstance();

  private constructor() {}

  public static getInstance(): ConstructorCodeGenerationService {
    if (!ConstructorCodeGenerationService.instance) {
      ConstructorCodeGenerationService.instance = new ConstructorCodeGenerationService();
    }
    return ConstructorCodeGenerationService.instance;
  }

  /**
   * Wrapper para llamadas API con seguimiento de tokens
   */
  private async callWithTokenTracking<T>(
    agentName: string,
    apiCall: () => Promise<T>,
    provider?: string
  ): Promise<T> {
    return withTokenTracking(agentName, apiCall, provider || 'unknown');
  }

  /**
   * Obtiene la configuración efectiva de un agente usando el sistema global
   */
  private getAgentConfig(agentName: string) {
    const config = getEffectiveAgentConfig(agentName);
    console.log(`🔧 Constructor usando configuración para ${agentName}:`, {
      provider: config.provider,
      model: config.model.name,
      temperature: config.temperature
    });
    return config;
  }

  /**
   * Muestra información de la configuración global de modelos
   */
  private showGlobalConfigInfo() {
    const globalConfig = getGlobalModelConfig();
    const overrideCount = Object.keys(globalConfig.agentOverrides).length;

    this.emitChatMessage({
      id: generateUniqueId('config-info'),
      sender: 'ai',
      content: `🧠 Configuración de IA: ${globalConfig.defaultModel.provider} - ${globalConfig.defaultModel.modelId} (${overrideCount} agentes personalizados)`,
      timestamp: Date.now(),
      type: 'info',
      senderType: 'ai'
    });
  }

  // Event listeners
  public addProgressListener(callback: (progress: CodeGenerationProgress) => void): void {
    this.progressCallbacks.push(callback);
  }

  public removeProgressListener(callback: (progress: CodeGenerationProgress) => void): void {
    this.progressCallbacks = this.progressCallbacks.filter(cb => cb !== callback);
  }

  public addChatListener(callback: (message: ChatMessage) => void): void {
    this.chatCallbacks.push(callback);
  }

  public removeChatListener(callback: (message: ChatMessage) => void): void {
    this.chatCallbacks = this.chatCallbacks.filter(cb => cb !== callback);
  }

  public addFileListener(callback: (files: FileItem[]) => void): void {
    this.fileCallbacks.push(callback);
  }

  public removeFileListener(callback: (files: FileItem[]) => void): void {
    this.fileCallbacks = this.fileCallbacks.filter(cb => cb !== callback);
  }

  private emitProgress(progress: CodeGenerationProgress): void {
    this.currentProgress = progress;
    this.progressCallbacks.forEach(callback => callback(progress));
  }

  private emitChatMessage(message: ChatMessage): void {
    this.chatCallbacks.forEach(callback => callback(message));
  }

  private emitFileUpdate(files: FileItem[]): void {
    this.fileCallbacks.forEach(callback => callback(files));
  }

  /**
   * Analiza la instrucción del usuario para extraer requisitos detallados
   */
  public async analyzeInstruction(instruction: string): Promise<InstructionAnalysis> {
    try {
      this.emitChatMessage({
        id: generateUniqueId('chat'),
        sender: 'ai',
        content: '🧠 Analizando instrucción para extraer requisitos...',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai'
      });

      const analysisPrompt = `
Analiza la siguiente instrucción de proyecto y extrae información detallada:

INSTRUCCIÓN: "${instruction}"

Extrae y estructura la siguiente información en formato JSON:
{
  "projectType": "tipo de proyecto (ej: e-commerce, blog, dashboard, landing page, etc.)",
  "designPreferences": {
    "style": "estilo preferido (moderno, clásico, minimalista, etc.)",
    "colorScheme": "esquema de colores (claro, oscuro, colorido, etc.)",
    "layout": "tipo de layout (single-page, multi-page, dashboard, etc.)"
  },
  "functionalRequirements": ["lista de funcionalidades requeridas"],
  "technologyPreferences": ["tecnologías mencionadas o sugeridas"],
  "complexity": "basic|intermediate|advanced",
  "estimatedFiles": "número estimado de archivos a generar"
}

Analiza cuidadosamente el contexto y las palabras clave para inferir requisitos implícitos.
`;

      const response = await this.callWithTokenTracking(
        'PromptEnhancerAgent',
        () => this.apiService.sendMessage(analysisPrompt, {
          systemPrompt: 'Eres un experto analista de requisitos de software. Analiza instrucciones de proyectos y extrae información estructurada. Siempre responde con JSON válido.',
          maxTokens: 1500,
          taskType: 'balanced' // Análisis de requisitos - equilibrio entre velocidad y calidad
        }),
        'anthropic'
      );

      if (response.success && response.data) {
        try {
          const analysis = JSON.parse(response.data);
          this.emitChatMessage({
            id: generateUniqueId('chat'),
            sender: 'ai',
            content: `✅ Análisis completado: ${analysis.projectType} (${analysis.complexity})`,
            timestamp: Date.now(),
            type: 'success',
            senderType: 'ai'
          });
          return analysis;
        } catch (parseError) {
          console.warn('Error parsing analysis JSON, using fallback');
        }
      }

      // Fallback analysis
      return this.createFallbackAnalysis(instruction);
    } catch (error) {
      console.error('Error analyzing instruction:', error);
      return this.createFallbackAnalysis(instruction);
    }
  }

  /**
   * Crea un análisis de respaldo basado en palabras clave
   */
  private createFallbackAnalysis(instruction: string): InstructionAnalysis {
    const lowerInstruction = instruction.toLowerCase();

    let projectType = 'aplicación web';
    if (lowerInstruction.includes('e-commerce') || lowerInstruction.includes('tienda')) projectType = 'e-commerce';
    else if (lowerInstruction.includes('blog')) projectType = 'blog';
    else if (lowerInstruction.includes('dashboard')) projectType = 'dashboard';
    else if (lowerInstruction.includes('landing')) projectType = 'landing page';
    else if (lowerInstruction.includes('portfolio')) projectType = 'portfolio';

    let complexity: 'basic' | 'intermediate' | 'advanced' = 'basic';
    if (lowerInstruction.includes('autenticación') || lowerInstruction.includes('base de datos') || lowerInstruction.includes('api')) {
      complexity = 'intermediate';
    }
    if (lowerInstruction.includes('avanzado') || lowerInstruction.includes('complejo') || lowerInstruction.includes('enterprise')) {
      complexity = 'advanced';
    }

    return {
      projectType,
      designPreferences: {
        style: lowerInstruction.includes('moderno') ? 'moderno' : 'profesional',
        colorScheme: lowerInstruction.includes('oscuro') ? 'oscuro' : 'claro',
        layout: lowerInstruction.includes('dashboard') ? 'dashboard' : 'single-page'
      },
      functionalRequirements: this.extractFunctionalRequirements(instruction),
      technologyPreferences: this.extractTechnologyPreferences(instruction),
      complexity,
      estimatedFiles: complexity === 'basic' ? 5 : complexity === 'intermediate' ? 10 : 15
    };
  }

  /**
   * Extrae requisitos funcionales de la instrucción
   */
  private extractFunctionalRequirements(instruction: string): string[] {
    const requirements: string[] = [];
    const lowerInstruction = instruction.toLowerCase();

    if (lowerInstruction.includes('autenticación') || lowerInstruction.includes('login')) {
      requirements.push('Sistema de autenticación');
    }
    if (lowerInstruction.includes('base de datos') || lowerInstruction.includes('crud')) {
      requirements.push('Gestión de base de datos');
    }
    if (lowerInstruction.includes('responsive') || lowerInstruction.includes('móvil')) {
      requirements.push('Diseño responsive');
    }
    if (lowerInstruction.includes('api') || lowerInstruction.includes('rest')) {
      requirements.push('API REST');
    }
    if (lowerInstruction.includes('tiempo real') || lowerInstruction.includes('websocket')) {
      requirements.push('Funcionalidad en tiempo real');
    }

    return requirements.length > 0 ? requirements : ['Interfaz de usuario', 'Navegación básica'];
  }

  /**
   * Extrae preferencias tecnológicas de la instrucción
   */
  private extractTechnologyPreferences(instruction: string): string[] {
    const technologies: string[] = [];
    const lowerInstruction = instruction.toLowerCase();

    if (lowerInstruction.includes('react')) technologies.push('React');
    if (lowerInstruction.includes('vue')) technologies.push('Vue.js');
    if (lowerInstruction.includes('angular')) technologies.push('Angular');
    if (lowerInstruction.includes('node')) technologies.push('Node.js');
    if (lowerInstruction.includes('python')) technologies.push('Python');
    if (lowerInstruction.includes('typescript')) technologies.push('TypeScript');
    if (lowerInstruction.includes('tailwind')) technologies.push('Tailwind CSS');

    return technologies;
  }

  /**
   * Genera un proyecto completo basado en la instrucción del usuario y el stack tecnológico
   */
  public async generateProject(
    instruction: string,
    stack: SimpleTechnologyStack,
    templateType: 'basic' | 'advanced' = 'basic'
  ): Promise<GenerationResult> {
    if (this.isGenerating) {
      throw new Error('Ya hay una generación en progreso');
    }

    this.isGenerating = true;
    const startTime = Date.now();
    const generatedFiles: FileItem[] = [];
    const agentsUsed: string[] = [];

    try {
      // Paso 0: Verificar conexión API
      this.emitChatMessage({
        id: generateUniqueId('chat'),
        sender: 'ai',
        content: '🔍 Verificando conexión con servicios de IA...',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai'
      });

      const connectionStatus = await this.apiService.testConnection();
      if (!connectionStatus.isConnected) {
        throw new Error('No se pudo establecer conexión con los servicios de IA. Verifique su conexión a internet y las claves API.');
      }

      this.emitChatMessage({
        id: generateUniqueId('chat'),
        sender: 'ai',
        content: `✅ Conectado a ${connectionStatus.provider.toUpperCase()} API`,
        timestamp: Date.now(),
        type: 'success',
        senderType: 'ai'
      });

      // Mostrar configuración global de modelos
      this.showGlobalConfigInfo();

      // Paso 1: Análisis avanzado de instrucciones
      this.emitProgress({
        currentStep: 'Análisis de Instrucciones',
        currentFile: '',
        totalFiles: 0,
        completedFiles: 0,
        percentage: 5,
        estimatedTimeRemaining: 90000
      });

      const instructionAnalysis = await this.analyzeInstruction(instruction);

      // Paso 2: Planificación del proyecto
      this.emitChatMessage({
        id: generateUniqueId('chat'),
        sender: 'ai',
        content: '🎯 Iniciando planificación del proyecto...',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai'
      });

      this.emitProgress({
        currentStep: 'Planificación del Proyecto',
        currentFile: '',
        totalFiles: instructionAnalysis.estimatedFiles,
        completedFiles: 0,
        percentage: 15,
        estimatedTimeRemaining: 75000
      });

      // Crear tarea para el agente de planificación
      const plannerTask: AgentTask = {
        id: generateUniqueId('task'),
        type: 'planner',
        instruction: this.buildEnhancedInstruction(instruction, stack, templateType, instructionAnalysis),
        status: 'pending',
        startTime: Date.now()
      };

      // Ejecutar agente de planificación optimizado con fallback
      let plannerResult;
      try {
        plannerResult = await Promise.race([
          OptimizedPlannerAgent.execute(plannerTask),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout en planificación')), 90000) // 90 segundos
          )
        ]) as any;
        agentsUsed.push('OptimizedPlannerAgent');
      } catch (error) {
        console.warn('⚠️ OptimizedPlannerAgent falló, usando plan de respaldo:', error);

        // Plan de respaldo rápido
        plannerResult = {
          success: true,
          data: this.createFallbackPlan(instruction, stack, templateType)
        };
        agentsUsed.push('FallbackPlanner');

        this.emitChatMessage({
          id: generateUniqueId('chat'),
          sender: 'ai',
          content: '⚡ Usando planificación rápida de respaldo...',
          timestamp: Date.now(),
          type: 'notification',
          senderType: 'ai'
        });
      }

      if (!plannerResult.success || !plannerResult.data) {
        throw new Error('Error en la planificación del proyecto: ' + (plannerResult.error || 'Error desconocido'));
      }

      this.emitChatMessage({
        id: generateUniqueId('chat'),
        sender: 'ai',
        content: `✅ Plan generado: ${plannerResult.data.projectStructure.files.length} archivos identificados`,
        timestamp: Date.now(),
        type: 'success',
        senderType: 'ai'
      });

      // Paso 3: Arquitectura de diseño
      this.emitProgress({
        currentStep: 'Arquitectura de Diseño',
        currentFile: '',
        totalFiles: plannerResult.data.projectStructure.files.length,
        completedFiles: 0,
        percentage: 25,
        estimatedTimeRemaining: 60000
      });

      this.emitChatMessage({
        id: generateUniqueId('chat'),
        sender: 'ai',
        content: '🎨 Generando arquitectura de diseño...',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai'
      });

      // Ejecutar agente de arquitectura de diseño mejorado con modelos Claude correctos
      const designTask: AgentTask = {
        id: generateUniqueId('task'),
        type: 'designArchitect',
        instruction: `Crear diseño profesional para: ${instruction}`,
        status: 'pending',
        startTime: Date.now()
      };

      const designResult = await EnhancedDesignArchitectAgent.execute(
        designTask,
        `${instructionAnalysis.projectType} - ${instructionAnalysis.designPreferences.style}`,
        {
          style: instructionAnalysis.designPreferences.style as any,
          colorScheme: instructionAnalysis.designPreferences.colorScheme as any,
          layout: instructionAnalysis.designPreferences.layout as any,
          responsive: true,
          animations: instructionAnalysis.complexity !== 'basic',
          framework: 'tailwind'
        }
      );
      agentsUsed.push('EnhancedDesignArchitectAgent');

      if (designResult.success && designResult.data?.files) {
        generatedFiles.push(...designResult.data.files);
        this.emitFileUpdate([...generatedFiles]);

        this.emitChatMessage({
          id: generateUniqueId('chat'),
          sender: 'ai',
          content: `✅ Diseño generado: ${designResult.data.files.length} archivos de diseño creados`,
          timestamp: Date.now(),
          type: 'success',
          senderType: 'ai'
        });
      }

      // Paso 4: Generación de archivos
      const totalFiles = plannerResult.data.projectStructure.files.length;

      this.emitProgress({
        currentStep: 'Generación de Código',
        currentFile: '',
        totalFiles,
        completedFiles: generatedFiles.length,
        percentage: 35,
        estimatedTimeRemaining: totalFiles * 6000
      });

      // Generar archivos uno por uno con manejo de errores mejorado
      for (let i = 0; i < plannerResult.data.projectStructure.files.length; i++) {
        const fileDesc = plannerResult.data.projectStructure.files[i];

        this.emitProgress({
          currentStep: 'Generación de Código',
          currentFile: fileDesc.path,
          totalFiles,
          completedFiles: generatedFiles.length,
          percentage: 35 + (i / totalFiles) * 40,
          estimatedTimeRemaining: (totalFiles - i) * 6000
        });

        this.emitChatMessage({
          id: generateUniqueId('chat'),
          sender: 'ai',
          content: `📝 Generando: ${fileDesc.path}`,
          timestamp: Date.now(),
          type: 'notification',
          senderType: 'ai'
        });

        try {
          // Crear tarea para generación de código
          const codeGenTask: AgentTask = {
            id: generateUniqueId('task'),
            type: 'codeGenerator',
            instruction: `Generar código para ${fileDesc.path} basado en ${instructionAnalysis.projectType}`,
            status: 'pending',
            startTime: Date.now()
          };

          // Ejecutar agente de generación de código con retry
          let codeGenResult;
          let retryCount = 0;
          const maxRetries = 2;

          do {
            codeGenResult = await CodeGeneratorAgent.execute(
              codeGenTask,
              fileDesc,
              plannerResult.data.projectStructure.description
            );

            if (!codeGenResult.success && retryCount < maxRetries) {
              retryCount++;
              this.emitChatMessage({
                id: generateUniqueId('chat'),
                sender: 'ai',
                content: `⏳ Reintentando generación de ${fileDesc.path} (intento ${retryCount + 1})`,
                timestamp: Date.now(),
                type: 'notification',
                senderType: 'ai'
              });
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          } while (!codeGenResult.success && retryCount < maxRetries);

          if (codeGenResult.success && codeGenResult.data?.file) {
            generatedFiles.push(codeGenResult.data.file);

            // Emitir actualización de archivos en tiempo real
            this.emitFileUpdate([...generatedFiles]);

            this.emitChatMessage({
              id: generateUniqueId('chat'),
              sender: 'ai',
              content: `✅ Generado: ${fileDesc.path} (${codeGenResult.data.file.content.length} caracteres)`,
              timestamp: Date.now(),
              type: 'success',
              senderType: 'ai'
            });
          } else {
            // Crear archivo de fallback si falla la generación
            const fallbackFile = this.createFallbackFile(fileDesc, instructionAnalysis);
            generatedFiles.push(fallbackFile);
            this.emitFileUpdate([...generatedFiles]);

            this.emitChatMessage({
              id: generateUniqueId('chat'),
              sender: 'ai',
              content: `⚠️ Usando plantilla de respaldo para: ${fileDesc.path}`,
              timestamp: Date.now(),
              type: 'warning',
              senderType: 'ai'
            });
          }
        } catch (fileError) {
          console.error(`Error generating file ${fileDesc.path}:`, fileError);

          // Crear archivo de fallback en caso de error
          const fallbackFile = this.createFallbackFile(fileDesc, instructionAnalysis);
          generatedFiles.push(fallbackFile);
          this.emitFileUpdate([...generatedFiles]);

          this.emitChatMessage({
            id: generateUniqueId('chat'),
            sender: 'ai',
            content: `⚠️ Error generando ${fileDesc.path}, usando plantilla de respaldo`,
            timestamp: Date.now(),
            type: 'warning',
            senderType: 'ai'
          });
        }

        // Pausa para evitar sobrecarga de API
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      agentsUsed.push('CodeGeneratorAgent');

      // Paso 3: Optimización y depuración
      this.emitProgress({
        currentStep: 'Optimización y Depuración',
        currentFile: '',
        totalFiles,
        completedFiles: totalFiles,
        percentage: 80,
        estimatedTimeRemaining: 15000
      });

      this.emitChatMessage({
        id: generateUniqueId('chat'),
        sender: 'ai',
        content: '🔧 Optimizando y depurando código generado...',
        timestamp: Date.now(),
        type: 'notification',
        senderType: 'ai'
      });

      // Optimizar archivos críticos (como el archivo principal)
      const mainFiles = generatedFiles.filter(file =>
        file.path.includes('App.') ||
        file.path.includes('main.') ||
        file.path.includes('index.')
      );

      for (const file of mainFiles) {
        const modifierTask: AgentTask = {
          id: generateUniqueId('task'),
          type: 'codeModifier',
          instruction: 'Optimizar y depurar el código para mejorar la calidad y rendimiento',
          status: 'pending',
          startTime: Date.now()
        };

        const modifierResult = await CodeModifierAgent.execute(modifierTask, file);

        if (modifierResult.success && modifierResult.data?.modifiedFile) {
          // Actualizar el archivo en la lista
          const fileIndex = generatedFiles.findIndex(f => f.id === file.id);
          if (fileIndex !== -1) {
            generatedFiles[fileIndex] = modifierResult.data.modifiedFile;
          }
        }
      }

      agentsUsed.push('CodeModifierAgent');

      // Paso 4: Organización final con FileObserver
      this.emitProgress({
        currentStep: 'Organización Final',
        currentFile: '',
        totalFiles,
        completedFiles: totalFiles,
        percentage: 95,
        estimatedTimeRemaining: 5000
      });

      const observerTask: AgentTask = {
        id: generateUniqueId('task'),
        type: 'fileObserver',
        instruction: 'Analizar y organizar la estructura final del proyecto',
        status: 'pending',
        startTime: Date.now()
      };

      const observerResult = FileObserverAgent.execute(observerTask, generatedFiles);
      agentsUsed.push('FileObserverAgent');

      // Finalización
      this.emitProgress({
        currentStep: 'Completado',
        currentFile: '',
        totalFiles,
        completedFiles: totalFiles,
        percentage: 100,
        estimatedTimeRemaining: 0
      });

      this.emitChatMessage({
        id: generateUniqueId('chat'),
        sender: 'ai',
        content: `🎉 ¡Proyecto generado exitosamente! ${generatedFiles.length} archivos creados.`,
        timestamp: Date.now(),
        type: 'success',
        senderType: 'ai'
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        files: generatedFiles,
        projectStructure: plannerResult.data.projectStructure,
        metadata: {
          totalFiles: generatedFiles.length,
          executionTime,
          agentsUsed
        }
      };

    } catch (error) {
      console.error('Error en generación de código:', error);

      this.emitChatMessage({
        id: generateUniqueId('chat'),
        sender: 'ai',
        content: `❌ Error en la generación: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: Date.now(),
        type: 'error',
        senderType: 'ai'
      });

      return {
        success: false,
        files: generatedFiles,
        projectStructure: null,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    } finally {
      this.isGenerating = false;
      this.currentProgress = null;
    }
  }

  /**
   * Crea un archivo de respaldo cuando falla la generación
   */
  private createFallbackFile(fileDesc: any, analysis: InstructionAnalysis): FileItem {
    const extension = fileDesc.path.split('.').pop()?.toLowerCase();
    let content = '';

    switch (extension) {
      case 'html':
        content = this.createFallbackHTML(analysis);
        break;
      case 'css':
        content = this.createFallbackCSS(analysis);
        break;
      case 'js':
      case 'jsx':
        content = this.createFallbackJS(analysis);
        break;
      case 'ts':
      case 'tsx':
        content = this.createFallbackTS(analysis);
        break;
      case 'json':
        content = this.createFallbackJSON(fileDesc.path);
        break;
      default:
        content = `// ${fileDesc.path}\n// Archivo generado por CODESTORM Constructor\n// Proyecto: ${analysis.projectType}\n\n// TODO: Implementar contenido específico`;
    }

    return {
      id: generateUniqueId('file'),
      name: fileDesc.path.split('/').pop() || fileDesc.path,
      path: fileDesc.path,
      content,
      language: extension || 'text',
      type: 'file',
      isNew: true,
      timestamp: Date.now()
    };
  }

  /**
   * Crea HTML de respaldo
   */
  private createFallbackHTML(analysis: InstructionAnalysis): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${analysis.projectType} - CODESTORM</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <h1>${analysis.projectType}</h1>
        <nav>
            <ul>
                <li><a href="#inicio">Inicio</a></li>
                <li><a href="#acerca">Acerca</a></li>
                <li><a href="#contacto">Contacto</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section id="inicio">
            <h2>Bienvenido</h2>
            <p>Este es un proyecto ${analysis.projectType} generado por CODESTORM Constructor.</p>
        </section>

        <section id="acerca">
            <h2>Acerca del Proyecto</h2>
            <p>Complejidad: ${analysis.complexity}</p>
            <p>Funcionalidades: ${analysis.functionalRequirements.join(', ')}</p>
        </section>
    </main>

    <footer>
        <p>&copy; 2025 CODESTORM Constructor</p>
    </footer>
</body>
</html>`;
  }

  /**
   * Crea CSS de respaldo
   */
  private createFallbackCSS(analysis: InstructionAnalysis): string {
    const isDark = analysis.designPreferences.colorScheme === 'oscuro';

    return `/* ${analysis.projectType} - Estilos generados por CODESTORM */

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    line-height: 1.6;
    color: ${isDark ? '#ffffff' : '#333333'};
    background-color: ${isDark ? '#1a1a1a' : '#ffffff'};
}

header {
    background-color: ${isDark ? '#2d2d2d' : '#f8f9fa'};
    padding: 1rem 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

nav ul {
    list-style: none;
    display: flex;
    gap: 2rem;
    justify-content: center;
}

nav a {
    text-decoration: none;
    color: ${isDark ? '#ffffff' : '#333333'};
    font-weight: 500;
    transition: color 0.3s ease;
}

nav a:hover {
    color: #3b82f6;
}

main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

section {
    margin-bottom: 3rem;
}

h1, h2, h3 {
    margin-bottom: 1rem;
    color: ${isDark ? '#ffffff' : '#1f2937'};
}

footer {
    text-align: center;
    padding: 2rem;
    background-color: ${isDark ? '#2d2d2d' : '#f8f9fa'};
    margin-top: 3rem;
}

/* Responsive Design */
@media (max-width: 768px) {
    nav ul {
        flex-direction: column;
        gap: 1rem;
    }

    main {
        padding: 1rem;
    }
}`;
  }

  /**
   * Crea JavaScript de respaldo
   */
  private createFallbackJS(analysis: InstructionAnalysis): string {
    return `// ${analysis.projectType} - JavaScript generado por CODESTORM
// Complejidad: ${analysis.complexity}

document.addEventListener('DOMContentLoaded', function() {
    console.log('${analysis.projectType} inicializado');

    // Navegación suave
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Funcionalidades específicas del proyecto
    ${analysis.functionalRequirements.map(req => `// TODO: Implementar ${req}`).join('\n    ')}
});`;
  }

  /**
   * Crea TypeScript de respaldo
   */
  private createFallbackTS(analysis: InstructionAnalysis): string {
    return `// ${analysis.projectType} - TypeScript generado por CODESTORM
// Complejidad: ${analysis.complexity}

interface ProjectConfig {
    name: string;
    type: string;
    complexity: string;
    features: string[];
}

const projectConfig: ProjectConfig = {
    name: '${analysis.projectType}',
    type: '${analysis.projectType}',
    complexity: '${analysis.complexity}',
    features: [${analysis.functionalRequirements.map(req => `'${req}'`).join(', ')}]
};

class ${analysis.projectType.replace(/\s+/g, '')}App {
    private config: ProjectConfig;

    constructor(config: ProjectConfig) {
        this.config = config;
        this.init();
    }

    private init(): void {
        console.log(\`Inicializando \${this.config.name}\`);
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // TODO: Implementar event listeners
    }
}

// Inicializar aplicación
const app = new ${analysis.projectType.replace(/\s+/g, '')}App(projectConfig);`;
  }

  /**
   * Crea JSON de respaldo
   */
  private createFallbackJSON(filePath: string): string {
    if (filePath.includes('package.json')) {
      return `{
  "name": "codestorm-project",
  "version": "1.0.0",
  "description": "Proyecto generado por CODESTORM Constructor",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "build": "npm run build"
  },
  "keywords": ["codestorm", "generated"],
  "author": "CODESTORM Constructor",
  "license": "MIT"
}`;
    }

    return `{
  "generated": true,
  "timestamp": "${new Date().toISOString()}",
  "generator": "CODESTORM Constructor"
}`;
  }

  /**
   * Construye una instrucción mejorada basada en el stack y tipo de plantilla
   */
  private buildEnhancedInstruction(
    instruction: string,
    stack: SimpleTechnologyStack,
    templateType: 'basic' | 'advanced',
    analysis?: InstructionAnalysis
  ): string {
    const stackInfo = `Stack tecnológico: ${stack.name} - ${stack.description}`;
    const templateInfo = templateType === 'advanced'
      ? 'Incluir autenticación, base de datos, API completa y mejores prácticas'
      : 'Estructura básica con componentes esenciales';

    let enhancedInstruction = `${instruction}

${stackInfo}

Tipo de proyecto: ${templateInfo}

Tecnologías principales: ${stack.technologies.join(', ')}`;

    if (analysis) {
      enhancedInstruction += `

ANÁLISIS DETALLADO:
- Tipo de proyecto: ${analysis.projectType}
- Complejidad: ${analysis.complexity}
- Estilo de diseño: ${analysis.designPreferences.style}
- Esquema de colores: ${analysis.designPreferences.colorScheme}
- Tipo de layout: ${analysis.designPreferences.layout}
- Requisitos funcionales: ${analysis.functionalRequirements.join(', ')}
- Tecnologías preferidas: ${analysis.technologyPreferences.join(', ')}`;
    }

    enhancedInstruction += `

Requisitos adicionales:
- Código limpio y bien documentado
- Estructura de carpetas profesional
- Manejo de errores apropiado
- Diseño responsive
- Configuración de desarrollo completa
- Accesibilidad web (WCAG 2.1)
- SEO optimizado
- Rendimiento optimizado`;

    return enhancedInstruction;
  }

  public isCurrentlyGenerating(): boolean {
    return this.isGenerating;
  }

  public getCurrentProgress(): CodeGenerationProgress | null {
    return this.currentProgress;
  }

  /**
   * Crea un plan de respaldo rápido cuando el OptimizedPlannerAgent falla
   */
  private createFallbackPlan(
    instruction: string,
    stack: any,
    templateType: 'basic' | 'advanced'
  ): any {
    const projectName = instruction.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30) || 'proyecto-web';

    const isAdvanced = templateType === 'advanced';

    const baseFiles = [
      {
        path: 'index.html',
        description: 'Página principal HTML del proyecto',
        type: 'file',
        priority: 'critical',
        dependencies: [],
        size: 'medium'
      },
      {
        path: 'styles.css',
        description: 'Archivo de estilos CSS principal',
        type: 'file',
        priority: 'high',
        dependencies: ['index.html'],
        size: 'medium'
      }
    ];

    if (isAdvanced) {
      baseFiles.push(
        {
          path: 'script.js',
          description: 'Archivo JavaScript principal',
          type: 'file',
          priority: 'high',
          dependencies: ['index.html'],
          size: 'medium'
        },
        {
          path: 'assets/images/.gitkeep',
          description: 'Carpeta para imágenes del proyecto',
          type: 'file',
          priority: 'low',
          dependencies: [],
          size: 'small'
        }
      );
    }

    return {
      projectStructure: {
        name: projectName,
        description: `Proyecto web basado en: ${instruction}`,
        type: 'web',
        technology: stack?.technologies?.[0] || 'html-css-js',
        complexity: isAdvanced ? 'medium' : 'simple',
        estimatedHours: isAdvanced ? '8-12 horas' : '4-6 horas',
        files: baseFiles
      },
      implementationSteps: [
        {
          id: 'step-1',
          title: 'Crear estructura HTML',
          description: 'Desarrollar la estructura base del proyecto en HTML',
          files: ['index.html'],
          estimatedTime: '1-2 horas',
          dependencies: [],
          validation: 'HTML válido y semánticamente correcto',
          priority: 'critical'
        },
        {
          id: 'step-2',
          title: 'Implementar estilos CSS',
          description: 'Crear los estilos CSS para el diseño del proyecto',
          files: ['styles.css'],
          estimatedTime: '2-3 horas',
          dependencies: ['step-1'],
          validation: 'Diseño responsive y visualmente atractivo',
          priority: 'high'
        }
      ],
      architecture: {
        pattern: 'Modular',
        dataFlow: 'Unidirectional',
        keyComponents: ['HTML Structure', 'CSS Styling', 'JavaScript Logic'],
        integrations: []
      },
      qualityAssurance: {
        testingStrategy: 'Manual testing and validation',
        performanceTargets: 'Fast loading, responsive design',
        accessibilityLevel: 'WCAG-AA',
        browserSupport: ['Chrome', 'Firefox', 'Safari', 'Edge']
      }
    };
  }
}
