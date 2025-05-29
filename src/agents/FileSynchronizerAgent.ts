import { AgentTask, AgentResult, FileItem, FileSystemCommand } from '../types';
import { applyFileSystemCommands } from '../services/fileSystemService';

/**
 * Agente de Sincronización de Archivos
 * 
 * Este agente es responsable de sincronizar los archivos en el estado de la aplicación
 * con los cambios realizados por otros agentes o comandos de terminal.
 */
export class FileSynchronizerAgent {
  /**
   * Ejecuta el agente de sincronización para actualizar los archivos
   * @param task La tarea asignada al agente
   * @param files Lista actual de archivos
   * @param commands Comandos de sistema de archivos a aplicar
   * @returns Resultado del agente con los archivos actualizados
   */
  public static execute(
    task: AgentTask, 
    files: FileItem[], 
    commands: FileSystemCommand[]
  ): AgentResult {
    try {
      // Aplicar los comandos de sistema de archivos
      const updatedFiles = applyFileSystemCommands(files, commands);
      
      // Calcular estadísticas de los cambios
      const stats = this.calculateChangeStats(files, updatedFiles, commands);
      
      return {
        success: true,
        data: {
          files: updatedFiles,
          stats
        },
        metadata: {
          commandCount: commands.length,
          executionTime: Date.now() - task.startTime
        }
      };
    } catch (error) {
      console.error('Error en FileSynchronizerAgent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en el agente de sincronización de archivos'
      };
    }
  }
  
  /**
   * Calcula estadísticas de los cambios realizados
   * @param originalFiles Lista original de archivos
   * @param updatedFiles Lista actualizada de archivos
   * @param commands Comandos aplicados
   * @returns Estadísticas de los cambios
   */
  private static calculateChangeStats(
    originalFiles: FileItem[], 
    updatedFiles: FileItem[],
    commands: FileSystemCommand[]
  ): {
    filesAdded: number;
    filesModified: number;
    filesDeleted: number;
    totalChanges: number;
  } {
    const filesAdded = commands.filter(cmd => cmd.type === 'create').length;
    const filesModified = commands.filter(cmd => cmd.type === 'update').length;
    const filesDeleted = commands.filter(cmd => cmd.type === 'delete').length;
    const filesRenamed = commands.filter(cmd => cmd.type === 'rename').length;
    
    return {
      filesAdded,
      filesModified,
      filesDeleted,
      totalChanges: filesAdded + filesModified + filesDeleted + filesRenamed
    };
  }
  
  /**
   * Genera comandos de terminal para mostrar los cambios realizados
   * @param commands Comandos de sistema de archivos aplicados
   * @returns Comandos de terminal para mostrar en la UI
   */
  public static generateTerminalCommands(commands: FileSystemCommand[]): string[] {
    return commands.map(command => {
      switch (command.type) {
        case 'create':
          return `echo "Creando archivo ${command.path}..."`;
        case 'update':
          return `echo "Actualizando archivo ${command.path}..."`;
        case 'delete':
          return `echo "Eliminando archivo ${command.path}..."`;
        case 'rename':
          return `echo "Renombrando archivo ${command.path} a ${command.newPath}..."`;
        default:
          return `echo "Operación desconocida en ${command.path}..."`;
      }
    });
  }
}
