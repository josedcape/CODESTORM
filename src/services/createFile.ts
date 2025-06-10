/**
 * Función para crear un archivo en el sistema
 *
 * Esta función se encarga de crear un nuevo archivo en el sistema o actualizar uno existente.
 * Además, notifica a los listeners sobre el cambio y añade un mensaje al chat.
 *
 * @param file Objeto con la información del archivo a crear
 * @param files Array de archivos existentes
 * @param fileListeners Array de listeners para notificar cambios en los archivos
 * @param addChatMessage Función para añadir mensajes al chat
 * @returns true si se creó correctamente, false en caso contrario
 */
export function createFile(
  file: { path: string, content: string, language?: string },
  files: any[],
  fileListeners: ((files: any[]) => void)[],
  addChatMessage: (message: any) => void,
  generateUniqueId: (prefix: string) => string
): boolean {
  try {
    console.log(`Creando archivo: ${file.path}`);

    // Verificar si el archivo ya existe
    const existingFileIndex = files.findIndex(f => f.path === file.path);
    let updatedFiles = [...files];

    if (existingFileIndex >= 0) {
      // Verificar si el contenido es diferente
      const existingContent = files[existingFileIndex].content || '';
      const newContent = file.content || '';

      if (existingContent === newContent) {
        console.log(`El archivo ${file.path} ya existe con el mismo contenido. No se realizarán cambios.`);

        // Añadir mensaje de chat para informar que no hubo cambios
        addChatMessage({
          id: generateUniqueId('msg-file-unchanged'),
          sender: 'ai-agent',
          content: `ℹ️ El archivo ${file.path} ya existe con el mismo contenido. No se realizaron cambios.`,
          timestamp: Date.now(),
          type: 'info',
          metadata: {
            filePath: file.path,
            action: 'unchanged'
          }
        });

        // Devolver los archivos sin cambios
        return true;
      }

      // Actualizar el archivo existente
      const updatedFile = {
        ...files[existingFileIndex],
        content: file.content,
        isModified: true,
        lastModified: Date.now()
      };

      updatedFiles = [
        ...files.slice(0, existingFileIndex),
        updatedFile,
        ...files.slice(existingFileIndex + 1)
      ];

      console.log(`Archivo actualizado: ${file.path}`);
    } else {
      // Crear un nuevo archivo
      const newFile = {
        id: generateUniqueId('file'),
        path: file.path,
        content: file.content,
        type: file.language || file.path.split('.').pop() || 'txt',
        isModified: false,
        isNew: true,
        timestamp: Date.now(),
        lastModified: Date.now()
      };

      updatedFiles = [...files, newFile];
      console.log(`Nuevo archivo creado: ${file.path}`);
    }

    // Notificar a los listeners
    console.log(`Notificando a ${fileListeners.length} listeners de archivos`);
    fileListeners.forEach(listener => listener(updatedFiles));

    // Añadir mensaje de chat para el archivo creado
    addChatMessage({
      id: generateUniqueId('msg-file'),
      sender: 'ai-agent',
      content: `Archivo creado: ${file.path}`,
      timestamp: Date.now(),
      type: 'file-creation',
      metadata: {
        filePath: file.path,
        fileType: file.language || file.path.split('.').pop() || 'txt'
      }
    });

    return true;
  } catch (error) {
    console.error('Error al crear archivo:', error);
    return false;
  }
}
