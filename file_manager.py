"""
Módulo de gestión de archivos simple y robusto para Codestorm Assistant.
Proporciona funcionalidades básicas para manipular archivos y directorios.
"""

import os
import shutil
import logging
import pathlib
from typing import List, Dict, Any, Union, Optional, Tuple

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FileManager:
    """Clase que proporciona funciones para manipular archivos y directorios."""
    
    @staticmethod
    def get_file_type(filename: str) -> str:
        """
        Determina el tipo de archivo basado en su extensión.
        
        Args:
            filename: Nombre del archivo
            
        Returns:
            str: Tipo de archivo (python, javascript, html, css, etc.)
        """
        extension = os.path.splitext(filename)[1].lower()
        
        # Mapeo de extensiones a tipos
        extension_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.html': 'html',
            '.css': 'css',
            '.json': 'json',
            '.md': 'markdown',
            '.txt': 'text',
            '.svg': 'svg',
            '.xml': 'xml',
            '.yml': 'yaml',
            '.yaml': 'yaml',
            '.sh': 'bash',
            '.c': 'c',
            '.cpp': 'cpp',
            '.h': 'c',
            '.java': 'java',
            '.php': 'php',
            '.ts': 'typescript',
            '.jsx': 'jsx',
            '.tsx': 'tsx',
            '.sql': 'sql',
            '.scss': 'scss',
            '.sass': 'sass',
            '.less': 'less',
            '.rb': 'ruby',
            '.go': 'go',
            '.rs': 'rust',
            '.swift': 'swift',
            '.dart': 'dart',
            '.lua': 'lua',
            '.r': 'r',
            '.kt': 'kotlin',
            '.kts': 'kotlin',
            '.groovy': 'groovy'
        }
        
        return extension_map.get(extension, 'text')
    
    @staticmethod
    def list_files(directory_path: str) -> List[Dict[str, Any]]:
        """
        Lista archivos y directorios en una ruta especificada.
        
        Args:
            directory_path: Ruta completa al directorio
            
        Returns:
            list: Lista de diccionarios con información de archivos y directorios
        """
        try:
            items = []
            if not os.path.exists(directory_path):
                os.makedirs(directory_path, exist_ok=True)
                
            if not os.path.isdir(directory_path):
                logger.error(f"La ruta {directory_path} no es un directorio válido")
                return []
                
            for item in os.listdir(directory_path):
                item_path = os.path.join(directory_path, item)
                relative_path = os.path.relpath(item_path, directory_path)
                
                is_dir = os.path.isdir(item_path)
                
                # Información básica
                item_info = {
                    'name': item,
                    'path': relative_path,
                    'type': 'directory' if is_dir else 'file'
                }
                
                # Información adicional para archivos
                if not is_dir:
                    try:
                        size = os.path.getsize(item_path)
                        file_type = FileManager.get_file_type(item)
                        item_info.update({
                            'size': size,
                            'file_type': file_type
                        })
                    except (OSError, IOError) as e:
                        logger.warning(f"No se pudo obtener información completa de {item}: {str(e)}")
                
                items.append(item_info)
                
            # Ordenar: carpetas primero, luego archivos (alfabéticamente)
            items.sort(key=lambda x: (0 if x['type'] == 'directory' else 1, x['name'].lower()))
            
            return items
        except Exception as e:
            logger.error(f"Error al listar archivos en {directory_path}: {str(e)}")
            return []
    
    @staticmethod
    def create_file(file_path: str, content: str = "") -> Tuple[bool, str]:
        """
        Crea un archivo con el contenido especificado.
        
        Args:
            file_path: Ruta completa al archivo
            content: Contenido del archivo
            
        Returns:
            tuple: (éxito, mensaje)
        """
        try:
            # Asegurar que el directorio existe
            dir_path = os.path.dirname(file_path)
            if dir_path:
                os.makedirs(dir_path, exist_ok=True)
            
            # Escribir el contenido
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
                
            logger.info(f"Archivo creado: {file_path}")
            return True, f"Archivo {os.path.basename(file_path)} creado correctamente"
        except Exception as e:
            logger.error(f"Error al crear archivo {file_path}: {str(e)}")
            return False, f"Error al crear archivo: {str(e)}"
    
    @staticmethod
    def create_directory(directory_path: str) -> Tuple[bool, str]:
        """
        Crea un directorio.
        
        Args:
            directory_path: Ruta completa al directorio
            
        Returns:
            tuple: (éxito, mensaje)
        """
        try:
            os.makedirs(directory_path, exist_ok=True)
            logger.info(f"Directorio creado: {directory_path}")
            return True, f"Directorio {os.path.basename(directory_path)} creado correctamente"
        except Exception as e:
            logger.error(f"Error al crear directorio {directory_path}: {str(e)}")
            return False, f"Error al crear directorio: {str(e)}"
    
    @staticmethod
    def read_file(file_path: str) -> Tuple[bool, Union[str, bytes]]:
        """
        Lee el contenido de un archivo.
        
        Args:
            file_path: Ruta completa al archivo
            
        Returns:
            tuple: (éxito, contenido o mensaje de error)
        """
        try:
            if not os.path.exists(file_path):
                return False, "El archivo no existe"
                
            if os.path.isdir(file_path):
                return False, "La ruta especificada es un directorio, no un archivo"
            
            # Intenta abrir como texto primero
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                return True, content
            except UnicodeDecodeError:
                # Si falla, abrir como binario
                with open(file_path, 'rb') as f:
                    content = f.read()
                return True, content
        except Exception as e:
            logger.error(f"Error al leer archivo {file_path}: {str(e)}")
            return False, f"Error al leer archivo: {str(e)}"
    
    @staticmethod
    def delete_item(item_path: str) -> Tuple[bool, str]:
        """
        Elimina un archivo o directorio.
        
        Args:
            item_path: Ruta completa al elemento
            
        Returns:
            tuple: (éxito, mensaje)
        """
        try:
            if not os.path.exists(item_path):
                return False, "El elemento no existe"
                
            if os.path.isdir(item_path):
                shutil.rmtree(item_path)
                logger.info(f"Directorio eliminado: {item_path}")
                return True, f"Directorio {os.path.basename(item_path)} eliminado correctamente"
            else:
                os.remove(item_path)
                logger.info(f"Archivo eliminado: {item_path}")
                return True, f"Archivo {os.path.basename(item_path)} eliminado correctamente"
        except Exception as e:
            logger.error(f"Error al eliminar {item_path}: {str(e)}")
            return False, f"Error al eliminar: {str(e)}"

    @staticmethod
    def sanitize_path(path: str) -> str:
        """
        Sanitiza una ruta para evitar path traversal.
        
        Args:
            path: Ruta a sanitizar
            
        Returns:
            str: Ruta sanitizada
        """
        # Eliminar componentes de path traversal
        sanitized = os.path.normpath(path).replace('..', '')
        
        # Asegurar que no hay barras al principio para evitar paths absolutos
        while sanitized.startswith('/') or sanitized.startswith('\\'):
            sanitized = sanitized[1:]
            
        return sanitized
    
    @staticmethod
    def join_paths(*paths: str) -> str:
        """
        Une rutas de forma segura y las sanitiza.
        
        Args:
            *paths: Componentes de la ruta
            
        Returns:
            str: Ruta unida y sanitizada
        """
        # Unir las rutas
        joined = os.path.join(*paths)
        
        # Sanitizar el resultado
        return FileManager.sanitize_path(joined)
    
    @staticmethod
    def is_within_base(base_path: str, check_path: str) -> bool:
        """
        Verifica si una ruta está dentro de una ruta base.
        Útil para prevenir acceso a directorios no autorizados.
        
        Args:
            base_path: Ruta base
            check_path: Ruta a verificar
            
        Returns:
            bool: True si check_path está dentro de base_path
        """
        # Convertir a rutas absolutas
        base_abs = os.path.abspath(base_path)
        check_abs = os.path.abspath(check_path)
        
        # Comprobar si check_path está dentro de base_path
        return os.path.commonpath([base_abs]) == os.path.commonpath([base_abs, check_abs])