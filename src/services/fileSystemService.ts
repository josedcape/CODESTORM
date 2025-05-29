import { FileItem } from '../types';

// Tipos para comandos de sistema de archivos
export interface FileSystemCommand {
  type: 'create' | 'update' | 'delete' | 'rename';
  path: string;
  content?: string;
  newPath?: string; // Para renombrar
  language?: string;
}

// Función para analizar comandos de terminal y detectar operaciones de archivos
export function parseTerminalCommand(command: string, output: string): FileSystemCommand[] {
  const commands: FileSystemCommand[] = [];
  
  // Detectar creación de archivos (touch, echo, etc.)
  if (command.startsWith('touch ')) {
    const path = command.substring(6).trim();
    commands.push({
      type: 'create',
      path,
      content: '',
      language: getLanguageFromExtension(path)
    });
  }
  
  // Detectar escritura en archivos (echo, cat, etc.)
  else if (command.match(/echo .* > .*/)) {
    const parts = command.split('>');
    const content = parts[0].substring(5).trim().replace(/^["'](.*)["']$/, '$1');
    const path = parts[1].trim();
    commands.push({
      type: 'create',
      path,
      content,
      language: getLanguageFromExtension(path)
    });
  }
  
  // Detectar eliminación de archivos (rm, del, etc.)
  else if (command.startsWith('rm ') || command.startsWith('del ')) {
    const path = command.substring(command.indexOf(' ') + 1).trim();
    commands.push({
      type: 'delete',
      path
    });
  }
  
  // Detectar renombrado de archivos (mv, rename, etc.)
  else if (command.startsWith('mv ') || command.startsWith('rename ')) {
    const parts = command.substring(command.indexOf(' ') + 1).split(' ');
    if (parts.length >= 2) {
      commands.push({
        type: 'rename',
        path: parts[0],
        newPath: parts[1]
      });
    }
  }
  
  // Detectar creación de directorios (mkdir)
  else if (command.startsWith('mkdir ')) {
    const path = command.substring(6).trim();
    // Directorios se manejan como archivos especiales por ahora
    commands.push({
      type: 'create',
      path,
      content: '',
      language: 'directory'
    });
  }
  
  // Detectar comandos de Python que crean archivos
  else if (command.includes('python') && output.includes('File created:')) {
    // Extraer información del archivo creado del output
    const match = output.match(/File created: (.*)/);
    if (match && match[1]) {
      commands.push({
        type: 'create',
        path: match[1],
        content: '# Archivo generado por Python',
        language: 'python'
      });
    }
  }
  
  // Detectar comandos de generación de código
  else if (command.startsWith('process_instruction') && output.includes('Code generated successfully')) {
    // Estos comandos ya son manejados por la aplicación principal
    // pero podemos añadir lógica adicional si es necesario
  }
  
  return commands;
}

// Función para aplicar comandos de sistema de archivos al estado
export function applyFileSystemCommands(
  files: FileItem[],
  commands: FileSystemCommand[]
): FileItem[] {
  let updatedFiles = [...files];
  
  for (const command of commands) {
    switch (command.type) {
      case 'create':
      case 'update':
        // Verificar si el archivo ya existe
        const existingFileIndex = updatedFiles.findIndex(f => f.path === command.path);
        if (existingFileIndex >= 0) {
          // Actualizar archivo existente
          updatedFiles[existingFileIndex] = {
            ...updatedFiles[existingFileIndex],
            content: command.content || updatedFiles[existingFileIndex].content
          };
        } else {
          // Crear nuevo archivo
          updatedFiles.push({
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: getFileNameFromPath(command.path),
            path: command.path,
            content: command.content || '',
            language: command.language || 'text'
          });
        }
        break;
        
      case 'delete':
        // Eliminar archivo
        updatedFiles = updatedFiles.filter(f => f.path !== command.path);
        break;
        
      case 'rename':
        // Renombrar archivo
        if (command.newPath) {
          const fileToRename = updatedFiles.find(f => f.path === command.path);
          if (fileToRename) {
            const newName = getFileNameFromPath(command.newPath);
            updatedFiles = updatedFiles.filter(f => f.path !== command.path);
            updatedFiles.push({
              ...fileToRename,
              name: newName,
              path: command.newPath
            });
          }
        }
        break;
    }
  }
  
  return updatedFiles;
}

// Función auxiliar para obtener el nombre de archivo de una ruta
function getFileNameFromPath(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

// Función auxiliar para determinar el lenguaje basado en la extensión
function getLanguageFromExtension(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'py':
      return 'python';
    case 'js':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'typescript';
    case 'jsx':
      return 'javascript';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    default:
      return 'text';
  }
}
