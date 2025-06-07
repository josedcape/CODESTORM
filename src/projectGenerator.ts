import { FileItem, ProjectPlan, ProjectStep } from '../types';
import { AIResponse } from './ai';

// Función para generar un plan de proyecto a partir de una instrucción
export async function generateProjectPlan(
  instruction: string,
  aiResponse: AIResponse
): Promise<ProjectPlan> {
  // Extraer el plan del contenido de la respuesta
  const content = aiResponse.content;

  // Intentar identificar secciones en el contenido
  const fileListMatch = content.match(/## Archivos necesarios([\s\S]*?)(?=##|$)/i);
  const stepsMatch = content.match(/## Pasos de implementación([\s\S]*?)(?=##|$)/i);

  // Extraer lista de archivos
  const filesList: string[] = [];
  if (fileListMatch && fileListMatch[1]) {
    const fileListText = fileListMatch[1];
    const fileMatches = fileListText.match(/[-*]\s+`([^`]+)`/g);
    if (fileMatches) {
      fileMatches.forEach(match => {
        const file = match.match(/[-*]\s+`([^`]+)`/);
        if (file && file[1]) {
          filesList.push(file[1]);
        }
      });
    }
  }

  // Extraer pasos de implementación
  const steps: ProjectStep[] = [];
  if (stepsMatch && stepsMatch[1]) {
    const stepsText = stepsMatch[1];
    const stepMatches = stepsText.match(/\d+\.\s+(.*?)(?=\d+\.|$)/gs);
    if (stepMatches) {
      stepMatches.forEach((match, index) => {
        const stepText = match.trim();
        const stepTitle = stepText.split('\n')[0].replace(/^\d+\.\s+/, '');
        steps.push({
          id: `step-${index + 1}`,
          title: stepTitle,
          description: stepText,
          status: 'pending'
        });
      });
    }
  }

  // Si no se pudo extraer un plan estructurado, crear uno genérico
  if (filesList.length === 0) {
    // Analizar el contenido para identificar posibles archivos
    const pythonFileMatches = content.match(/```python\s+([\s\S]*?)```/g);
    if (pythonFileMatches) {
      filesList.push('main.py');
      if (pythonFileMatches.length > 1) {
        filesList.push('utils.py');
      }
    }

    const htmlMatches = content.match(/```html\s+([\s\S]*?)```/g);
    if (htmlMatches) {
      filesList.push('index.html');
    }

    const cssMatches = content.match(/```css\s+([\s\S]*?)```/g);
    if (cssMatches) {
      filesList.push('styles.css');
    }

    const jsMatches = content.match(/```(javascript|js)\s+([\s\S]*?)```/g);
    if (jsMatches) {
      filesList.push('script.js');
    }
  }

  // Si no se pudieron extraer pasos, crear pasos genéricos
  if (steps.length === 0) {
    steps.push({
      id: 'step-1',
      title: 'Crear estructura de archivos',
      description: 'Crear los archivos necesarios para el proyecto',
      status: 'pending'
    });

    steps.push({
      id: 'step-2',
      title: 'Implementar funcionalidad principal',
      description: 'Desarrollar la funcionalidad principal del proyecto',
      status: 'pending'
    });

    steps.push({
      id: 'step-3',
      title: 'Probar la implementación',
      description: 'Verificar que el proyecto funciona correctamente',
      status: 'pending'
    });
  }

  return {
    title: `Plan para: ${instruction.substring(0, 50)}${instruction.length > 50 ? '...' : ''}`,
    description: instruction,
    files: filesList,
    steps,
    currentStepId: steps.length > 0 ? steps[0].id : null
  };
}

// Función para extraer archivos del contenido de la respuesta
export function extractFilesFromContent(content: string): FileItem[] {
  const files: FileItem[] = [];

  // Buscar bloques de código con nombre de archivo
  const fileBlockRegex = /```(\w+)\s+(\S+)\s+([\s\S]*?)```/g;
  let match;

  while ((match = fileBlockRegex.exec(content)) !== null) {
    const language = match[1];
    const fileName = match[2];
    const fileContent = match[3].trim();

    files.push({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: fileName,
      path: `/${fileName}`,
      content: fileContent,
      language: mapLanguage(language)
    });
  }

  // Buscar bloques de código sin nombre de archivo explícito
  if (files.length === 0) {
    const codeBlockRegex = /```(\w+)\s+([\s\S]*?)```/g;
    const codeBlocks: {language: string, content: string}[] = [];

    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeBlocks.push({
        language: match[1],
        content: match[2].trim()
      });
    }

    // Asignar nombres de archivo basados en el lenguaje
    codeBlocks.forEach((block, index) => {
      let fileName: string;
      const mappedLanguage = mapLanguage(block.language);

      switch (mappedLanguage) {
        case 'python':
          fileName = index === 0 ? 'main.py' : `module${index}.py`;
          break;
        case 'javascript':
          fileName = index === 0 ? 'script.js' : `module${index}.js`;
          break;
        case 'html':
          fileName = 'index.html';
          break;
        case 'css':
          fileName = 'styles.css';
          break;
        default:
          fileName = `file${index}.${block.language}`;
      }

      files.push({
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: fileName,
        path: `/${fileName}`,
        content: block.content,
        language: mappedLanguage
      });
    });
  }

  return files;
}

// Función auxiliar para mapear lenguajes
export function mapLanguage(language: string): string {
  switch (language.toLowerCase()) {
    case 'py':
    case 'python':
      return 'python';
    case 'js':
    case 'javascript':
      return 'javascript';
    case 'ts':
    case 'typescript':
      return 'typescript';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
    case 'markdown':
      return 'markdown';
    default:
      return 'text';
  }
}

// Función para generar comandos de terminal para crear archivos
export function generateFileCreationCommands(files: FileItem[]): string[] {
  return files.map(file => {
    // Simplificar: solo devolver un comando para crear cada archivo
    return `echo "Creando archivo ${file.path}..."`;
  });
}
