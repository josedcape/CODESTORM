import { FileItem } from '../types';
import { generateUniqueId } from './idGenerator';

/**
 * Utilidades para manejo de archivos únicos y prevención de duplicados
 */

/**
 * Combina arrays de archivos eliminando duplicados basados en el path
 * Mantiene la versión más reciente de cada archivo
 * @param existingFiles Archivos existentes
 * @param newFiles Nuevos archivos a agregar
 * @returns Array de archivos sin duplicados
 */
export function mergeFilesWithoutDuplicates(existingFiles: FileItem[], newFiles: FileItem[]): FileItem[] {
  // Crear un mapa para rastrear archivos por path
  const fileMap = new Map<string, FileItem>();
  
  // Agregar archivos existentes al mapa
  existingFiles.forEach(file => {
    fileMap.set(file.path, file);
  });
  
  // Agregar/actualizar con nuevos archivos (más recientes tienen prioridad)
  newFiles.forEach(file => {
    const existingFile = fileMap.get(file.path);
    
    if (!existingFile || (file.lastModified && existingFile.lastModified && file.lastModified > existingFile.lastModified)) {
      // Usar el nuevo archivo si es más reciente o si no existe uno previo
      fileMap.set(file.path, {
        ...file,
        id: existingFile?.id || file.id || generateUniqueId('file'), // Mantener ID existente si es posible
        lastModified: file.lastModified || Date.now()
      });
    }
  });
  
  return Array.from(fileMap.values());
}

/**
 * Elimina archivos duplicados de un array basándose en el path
 * Mantiene el archivo con el timestamp más reciente
 * @param files Array de archivos que puede contener duplicados
 * @returns Array de archivos sin duplicados
 */
export function removeDuplicateFiles(files: FileItem[]): FileItem[] {
  const fileMap = new Map<string, FileItem>();
  
  files.forEach(file => {
    const existingFile = fileMap.get(file.path);
    
    if (!existingFile) {
      // Primer archivo con este path
      fileMap.set(file.path, {
        ...file,
        id: file.id || generateUniqueId('file'),
        lastModified: file.lastModified || file.timestamp || Date.now()
      });
    } else {
      // Ya existe un archivo con este path, mantener el más reciente
      const existingTime = existingFile.lastModified || existingFile.timestamp || 0;
      const newTime = file.lastModified || file.timestamp || 0;
      
      if (newTime > existingTime) {
        fileMap.set(file.path, {
          ...file,
          id: existingFile.id, // Mantener el ID original para evitar problemas de React keys
          lastModified: newTime
        });
      }
    }
  });
  
  return Array.from(fileMap.values());
}

/**
 * Actualiza un archivo específico en un array de archivos
 * Si el archivo no existe, lo agrega. Si existe, lo actualiza.
 * @param files Array de archivos existentes
 * @param updatedFile Archivo a actualizar o agregar
 * @returns Array de archivos actualizado
 */
export function updateFileInArray(files: FileItem[], updatedFile: FileItem): FileItem[] {
  const existingIndex = files.findIndex(f => f.path === updatedFile.path);
  
  if (existingIndex >= 0) {
    // Actualizar archivo existente manteniendo el ID original
    const updatedFiles = [...files];
    updatedFiles[existingIndex] = {
      ...updatedFile,
      id: files[existingIndex].id, // Mantener ID original
      lastModified: Date.now()
    };
    return updatedFiles;
  } else {
    // Agregar nuevo archivo
    return [...files, {
      ...updatedFile,
      id: updatedFile.id || generateUniqueId('file'),
      lastModified: Date.now()
    }];
  }
}

/**
 * Genera una clave única para React basada en el archivo
 * Combina path y ID para garantizar unicidad
 * @param file Archivo para el cual generar la clave
 * @returns Clave única para React
 */
export function generateFileKey(file: FileItem): string {
  return `${file.path}-${file.id}`;
}

/**
 * Valida que un array de archivos no tenga claves duplicadas
 * @param files Array de archivos a validar
 * @returns Objeto con información de validación
 */
export function validateFileKeys(files: FileItem[]): {
  isValid: boolean;
  duplicates: string[];
  duplicateIds: string[];
} {
  const pathSet = new Set<string>();
  const idSet = new Set<string>();
  const duplicatePaths: string[] = [];
  const duplicateIds: string[] = [];
  
  files.forEach(file => {
    // Verificar paths duplicados
    if (pathSet.has(file.path)) {
      duplicatePaths.push(file.path);
    } else {
      pathSet.add(file.path);
    }
    
    // Verificar IDs duplicados
    if (idSet.has(file.id)) {
      duplicateIds.push(file.id);
    } else {
      idSet.add(file.id);
    }
  });
  
  return {
    isValid: duplicatePaths.length === 0 && duplicateIds.length === 0,
    duplicates: duplicatePaths,
    duplicateIds: duplicateIds
  };
}

/**
 * Corrige archivos con IDs duplicados regenerando IDs únicos
 * @param files Array de archivos que puede tener IDs duplicados
 * @returns Array de archivos con IDs únicos garantizados
 */
export function fixDuplicateIds(files: FileItem[]): FileItem[] {
  const seenIds = new Set<string>();
  
  return files.map(file => {
    if (seenIds.has(file.id)) {
      // ID duplicado encontrado, generar uno nuevo
      const newId = generateUniqueId('file');
      console.warn(`🔧 ID duplicado detectado para archivo ${file.path}. Cambiando de ${file.id} a ${newId}`);
      seenIds.add(newId);
      return {
        ...file,
        id: newId
      };
    } else {
      seenIds.add(file.id);
      return file;
    }
  });
}

/**
 * Encuentra archivos principales (index.html, styles.css, script.js) en un array
 * @param files Array de archivos
 * @returns Objeto con archivos principales encontrados
 */
export function findMainFiles(files: FileItem[]): {
  html?: FileItem;
  css?: FileItem;
  js?: FileItem;
} {
  return {
    html: files.find(f => 
      f.path.endsWith('.html') && 
      (f.path === 'index.html' || f.path.includes('index') || f.name === 'index.html')
    ),
    css: files.find(f => 
      f.path.endsWith('.css') && 
      (f.path === 'styles.css' || f.path.includes('style') || f.name === 'styles.css')
    ),
    js: files.find(f => 
      f.path.endsWith('.js') && 
      (f.path === 'script.js' || f.path.includes('script') || f.name === 'script.js')
    )
  };
}

/**
 * Crea un archivo con metadatos completos y ID único
 * @param name Nombre del archivo
 * @param path Path del archivo
 * @param content Contenido del archivo
 * @param language Lenguaje del archivo (opcional)
 * @returns FileItem completo con metadatos
 */
export function createFileItem(
  name: string, 
  path: string, 
  content: string, 
  language?: string
): FileItem {
  const now = Date.now();
  
  return {
    id: generateUniqueId('file'),
    name,
    path,
    content,
    language: language || getLanguageFromExtension(path),
    type: 'file',
    size: content.length,
    timestamp: now,
    lastModified: now,
    isNew: true
  };
}

/**
 * Obtiene el lenguaje basado en la extensión del archivo
 * @param filePath Path del archivo
 * @returns Lenguaje detectado
 */
function getLanguageFromExtension(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'cpp':
    case 'c':
      return 'cpp';
    default:
      return 'text';
  }
}

/**
 * Obtiene el lenguaje de programación basado en la extensión del archivo (función pública)
 * @param filePath Ruta del archivo
 * @returns Lenguaje de programación
 */
export function getLanguageFromFilePath(filePath: string): string {
  return getLanguageFromExtension(filePath);
}
