"""
Módulo para la exploración y manipulación de archivos dentro de repositorios clonados.
Permite al asistente principal explorar, leer y modificar archivos específicos
dentro de una estructura de directorios.
"""

import os
import logging
import json
from typing import Dict, List, Tuple, Optional, Union

logger = logging.getLogger(__name__)

def get_file_content(file_path: str) -> Tuple[bool, str, str]:
    """
    Obtiene el contenido de un archivo específico.
    
    Args:
        file_path: Ruta al archivo a leer
        
    Returns:
        Tuple[bool, str, str]: (éxito, contenido o mensaje de error, tipo de archivo)
    """
    try:
        # Verificar si el archivo existe
        if not os.path.exists(file_path):
            return False, f"El archivo {file_path} no existe", ""
            
        # Determinar el tipo de archivo por su extensión
        file_type = os.path.splitext(file_path)[1].lstrip('.').lower()
        
        # Abrir y leer el contenido del archivo
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            
        return True, content, file_type
    except UnicodeDecodeError:
        # Si hay error de decodificación, probablemente es un archivo binario
        return False, f"El archivo {file_path} es binario y no se puede mostrar como texto", file_type
    except Exception as e:
        logger.error(f"Error al leer archivo {file_path}: {str(e)}")
        return False, f"Error al leer el archivo: {str(e)}", ""


def update_file_content(file_path: str, content: str) -> Tuple[bool, str]:
    """
    Actualiza el contenido de un archivo específico.
    
    Args:
        file_path: Ruta al archivo a actualizar
        content: Nuevo contenido para el archivo
        
    Returns:
        Tuple[bool, str]: (éxito, mensaje)
    """
    try:
        # Verificar si el archivo existe
        if not os.path.exists(file_path):
            return False, f"El archivo {file_path} no existe"
        
        # Guardar contenido anterior (por si hay que revertir)
        with open(file_path, 'r', encoding='utf-8') as file:
            old_content = file.read()
            
        # Escribir el nuevo contenido
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(content)
            
        return True, f"Archivo {file_path} actualizado correctamente"
    except Exception as e:
        logger.error(f"Error al actualizar archivo {file_path}: {str(e)}")
        return False, f"Error al actualizar el archivo: {str(e)}"


def create_file(file_path: str, content: str) -> Tuple[bool, str]:
    """
    Crea un nuevo archivo con el contenido especificado.
    
    Args:
        file_path: Ruta al archivo a crear
        content: Contenido para el archivo
        
    Returns:
        Tuple[bool, str]: (éxito, mensaje)
    """
    try:
        # Verificar si el archivo ya existe
        if os.path.exists(file_path):
            return False, f"El archivo {file_path} ya existe"
        
        # Asegurar que el directorio exista
        directory = os.path.dirname(file_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)
            
        # Escribir el contenido
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(content)
            
        return True, f"Archivo {file_path} creado correctamente"
    except Exception as e:
        logger.error(f"Error al crear archivo {file_path}: {str(e)}")
        return False, f"Error al crear el archivo: {str(e)}"


def list_directory(directory_path: str, depth: int = 1, max_depth: int = 2) -> Tuple[bool, List[Dict], str]:
    """
    Lista archivos y subdirectorios dentro de un directorio.
    
    Args:
        directory_path: Ruta al directorio
        depth: Profundidad actual de recursión
        max_depth: Profundidad máxima para la recursión
        
    Returns:
        Tuple[bool, List[Dict], str]: (éxito, lista de archivos/directorios, mensaje de error)
    """
    try:
        if not os.path.exists(directory_path) or not os.path.isdir(directory_path):
            return False, [], f"El directorio {directory_path} no existe"
            
        items = []
        
        for item in os.listdir(directory_path):
            # Ignorar archivos ocultos
            if item.startswith('.'):
                continue
                
            item_path = os.path.join(directory_path, item)
            
            if os.path.isdir(item_path):
                item_data = {
                    'name': item,
                    'type': 'directory',
                    'path': item_path
                }
                
                # Recursión para subdirectorios si no se alcanza la profundidad máxima
                if depth < max_depth:
                    success, children, error = list_directory(item_path, depth + 1, max_depth)
                    if success:
                        item_data['children'] = children
                
                items.append(item_data)
            else:
                # Para archivos, obtener información básica
                try:
                    file_size = os.path.getsize(item_path)
                    file_type = os.path.splitext(item)[1].lstrip('.').lower()
                    
                    item_data = {
                        'name': item,
                        'type': 'file',
                        'file_type': file_type,
                        'size': file_size,
                        'path': item_path
                    }
                    
                    items.append(item_data)
                except Exception as e:
                    logger.warning(f"Error al obtener info de archivo {item_path}: {str(e)}")
        
        # Ordenar: primero directorios, luego archivos (alfabéticamente)
        items.sort(key=lambda x: (0 if x['type'] == 'directory' else 1, x['name'].lower()))
        
        return True, items, ""
    except Exception as e:
        logger.error(f"Error al listar directorio {directory_path}: {str(e)}")
        return False, [], f"Error al listar el directorio: {str(e)}"


def find_file(base_directory: str, target: str, search_type: str = 'name') -> Tuple[bool, List[str], str]:
    """
    Busca archivos o directorios dentro de una estructura de directorios.
    
    Args:
        base_directory: Directorio base para iniciar la búsqueda
        target: Nombre o patrón a buscar
        search_type: Tipo de búsqueda ('name', 'content', 'extension')
        
    Returns:
        Tuple[bool, List[str], str]: (éxito, lista de rutas encontradas, mensaje de error)
    """
    try:
        if not os.path.exists(base_directory) or not os.path.isdir(base_directory):
            return False, [], f"El directorio base {base_directory} no existe"
            
        found_items = []
        
        # Búsqueda por nombre de archivo/directorio
        if search_type == 'name':
            for root, dirs, files in os.walk(base_directory):
                # Filtrar por nombre en directorios
                for dir_name in dirs:
                    if target.lower() in dir_name.lower():
                        found_items.append(os.path.join(root, dir_name))
                
                # Filtrar por nombre en archivos
                for file_name in files:
                    if target.lower() in file_name.lower():
                        found_items.append(os.path.join(root, file_name))
        
        # Búsqueda por extensión de archivo
        elif search_type == 'extension':
            target = target.lstrip('.')  # Remover punto inicial si existe
            for root, _, files in os.walk(base_directory):
                for file_name in files:
                    if file_name.lower().endswith(f".{target.lower()}"):
                        found_items.append(os.path.join(root, file_name))
        
        # Búsqueda por contenido (solo archivos de texto)
        elif search_type == 'content':
            for root, _, files in os.walk(base_directory):
                for file_name in files:
                    file_path = os.path.join(root, file_name)
                    try:
                        # Solo procesar archivos que probablemente sean de texto
                        _, ext = os.path.splitext(file_name)
                        if ext.lower() in ['.txt', '.md', '.py', '.js', '.html', '.css', '.json', '.xml', '.csv', '.ts', '.jsx', '.tsx', '.vue', '.php', '.java', '.c', '.cpp', '.h', '.sh', '.bat']:
                            with open(file_path, 'r', encoding='utf-8') as file:
                                if target.lower() in file.read().lower():
                                    found_items.append(file_path)
                    except (UnicodeDecodeError, PermissionError):
                        # Ignorar archivos que no se pueden leer como texto o con permisos restringidos
                        pass
                    except Exception as e:
                        logger.warning(f"Error al leer archivo {file_path}: {str(e)}")
        
        return True, found_items, ""
    except Exception as e:
        logger.error(f"Error al buscar en directorio {base_directory}: {str(e)}")
        return False, [], f"Error al realizar la búsqueda: {str(e)}"


def analyze_project_structure(workspace_path: str, max_depth: int = 3) -> Dict:
    """
    Analiza la estructura de un proyecto para proporcionar una visión general.
    
    Args:
        workspace_path: Ruta al directorio del proyecto
        max_depth: Profundidad máxima para la exploración
        
    Returns:
        Dict: Información sobre la estructura del proyecto
    """
    try:
        if not os.path.exists(workspace_path) or not os.path.isdir(workspace_path):
            return {
                'success': False,
                'error': f"El directorio {workspace_path} no existe"
            }
        
        # Obtener la estructura general
        success, structure, error = list_directory(workspace_path, 1, max_depth)
        if not success:
            return {
                'success': False,
                'error': error
            }
        
        # Contar archivos por tipo
        file_stats = {}
        total_files = 0
        
        def count_files(items):
            nonlocal total_files
            for item in items:
                if item['type'] == 'file':
                    file_type = item.get('file_type', 'unknown')
                    if file_type not in file_stats:
                        file_stats[file_type] = 0
                    file_stats[file_type] += 1
                    total_files += 1
                elif 'children' in item:
                    count_files(item['children'])
        
        count_files(structure)
        
        # Identificar archivos importantes
        important_files = []
        common_important_files = [
            'package.json', 'package-lock.json', 'requirements.txt', 
            'setup.py', 'Dockerfile', 'docker-compose.yml', '.gitignore',
            'README.md', 'LICENSE', 'Makefile', 'CMakeLists.txt',
            'tsconfig.json', 'tslint.json', 'eslintrc.js', '.eslintrc',
            'webpack.config.js', 'babel.config.js', 'jest.config.js',
            'angular.json', 'ionic.config.json', 'capacitor.config.json',
            'android/app/build.gradle', 'ios/Podfile',
            'pubspec.yaml', 'AndroidManifest.xml', 'Info.plist'
        ]
        
        for root, _, files in os.walk(workspace_path):
            for file in files:
                if file in common_important_files:
                    important_files.append(os.path.join(root, file))
        
        return {
            'success': True,
            'structure': structure,
            'file_count': total_files,
            'file_types': file_stats,
            'important_files': important_files,
            'workspace_path': workspace_path
        }
    except Exception as e:
        logger.error(f"Error al analizar proyecto en {workspace_path}: {str(e)}")
        return {
            'success': False,
            'error': f"Error al analizar el proyecto: {str(e)}"
        }