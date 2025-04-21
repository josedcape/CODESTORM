"""
Rutas API para la exploración y manipulación de archivos dentro de repositorios.
Permite al asistente principal explorar, leer y modificar archivos específicos
dentro de una estructura de directorios.
"""

import os
import logging
import json
from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename
import file_explorer

logger = logging.getLogger(__name__)

# Crear el blueprint para las rutas de exploración de archivos
file_explorer_bp = Blueprint('file_explorer', __name__)

@file_explorer_bp.route('/api/explorer/list', methods=['GET'])
def list_directory():
    """
    Lista archivos y directorios en una ruta especificada.
    
    Parámetros de consulta:
    - path: Ruta relativa a listar (predeterminado: '.')
    - max_depth: Profundidad máxima de la exploración (predeterminado: 2)
    - workspace_id: ID del espacio de trabajo (predeterminado: 'default')
    
    Retorna:
    - Lista de archivos y directorios
    """
    try:
        relative_path = request.args.get('path', '.')
        max_depth = int(request.args.get('max_depth', 2))
        workspace_id = request.args.get('workspace_id', 'default')
        
        # Construir ruta completa
        workspace_path = os.path.join('user_workspaces', workspace_id)
        target_path = os.path.join(workspace_path, relative_path)
        
        # Asegurar que no se salga del directorio del usuario (prevenir directory traversal)
        if not os.path.abspath(target_path).startswith(os.path.abspath(workspace_path)):
            return jsonify({
                'success': False,
                'error': 'Acceso denegado: la ruta se sale del espacio de trabajo'
            }), 403
        
        # Listar el contenido del directorio
        success, items, error = file_explorer.list_directory(target_path, 1, max_depth)
        
        if success:
            return jsonify({
                'success': True,
                'path': relative_path,
                'items': items
            })
        else:
            return jsonify({
                'success': False,
                'error': error
            }), 404
    except Exception as e:
        logger.error(f"Error al listar directorio: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error al listar el directorio: {str(e)}'
        }), 500


@file_explorer_bp.route('/api/explorer/file', methods=['GET'])
def get_file():
    """
    Obtiene el contenido de un archivo específico.
    
    Parámetros de consulta:
    - path: Ruta relativa al archivo
    - workspace_id: ID del espacio de trabajo (predeterminado: 'default')
    
    Retorna:
    - Contenido del archivo y tipo
    """
    try:
        relative_path = request.args.get('path')
        workspace_id = request.args.get('workspace_id', 'default')
        
        if not relative_path:
            return jsonify({
                'success': False,
                'error': 'Debe especificar una ruta de archivo'
            }), 400
        
        # Construir ruta completa
        workspace_path = os.path.join('user_workspaces', workspace_id)
        file_path = os.path.join(workspace_path, relative_path)
        
        # Asegurar que no se salga del directorio del usuario
        if not os.path.abspath(file_path).startswith(os.path.abspath(workspace_path)):
            return jsonify({
                'success': False,
                'error': 'Acceso denegado: la ruta se sale del espacio de trabajo'
            }), 403
        
        # Obtener el contenido del archivo
        success, content, file_type = file_explorer.get_file_content(file_path)
        
        if success:
            return jsonify({
                'success': True,
                'path': relative_path,
                'content': content,
                'file_type': file_type
            })
        else:
            return jsonify({
                'success': False,
                'error': content  # En caso de error, content contiene el mensaje de error
            }), 404
    except Exception as e:
        logger.error(f"Error al obtener archivo: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error al obtener el archivo: {str(e)}'
        }), 500


@file_explorer_bp.route('/api/explorer/file', methods=['POST'])
def update_file():
    """
    Actualiza el contenido de un archivo existente.
    
    Espera:
    - path: Ruta relativa al archivo
    - content: Nuevo contenido para el archivo
    - workspace_id: ID del espacio de trabajo (predeterminado: 'default')
    
    Retorna:
    - Confirmación de actualización
    """
    try:
        data = request.json
        relative_path = data.get('path')
        content = data.get('content')
        workspace_id = data.get('workspace_id', 'default')
        
        if not relative_path or content is None:
            return jsonify({
                'success': False,
                'error': 'Debe especificar una ruta de archivo y contenido'
            }), 400
        
        # Construir ruta completa
        workspace_path = os.path.join('user_workspaces', workspace_id)
        file_path = os.path.join(workspace_path, relative_path)
        
        # Asegurar que no se salga del directorio del usuario
        if not os.path.abspath(file_path).startswith(os.path.abspath(workspace_path)):
            return jsonify({
                'success': False,
                'error': 'Acceso denegado: la ruta se sale del espacio de trabajo'
            }), 403
        
        # Actualizar el archivo
        success, message = file_explorer.update_file_content(file_path, content)
        
        if success:
            # Registro de actividad (opcional)
            logger.info(f"Archivo actualizado: {file_path}")
            
            return jsonify({
                'success': True,
                'path': relative_path,
                'message': message
            })
        else:
            return jsonify({
                'success': False,
                'error': message
            }), 404
    except Exception as e:
        logger.error(f"Error al actualizar archivo: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error al actualizar el archivo: {str(e)}'
        }), 500


@file_explorer_bp.route('/api/explorer/file', methods=['PUT'])
def create_file():
    """
    Crea un nuevo archivo con el contenido especificado.
    
    Espera:
    - path: Ruta relativa al nuevo archivo
    - content: Contenido para el archivo
    - workspace_id: ID del espacio de trabajo (predeterminado: 'default')
    
    Retorna:
    - Confirmación de creación
    """
    try:
        data = request.json
        relative_path = data.get('path')
        content = data.get('content', '')
        workspace_id = data.get('workspace_id', 'default')
        
        if not relative_path:
            return jsonify({
                'success': False,
                'error': 'Debe especificar una ruta de archivo'
            }), 400
        
        # Construir ruta completa
        workspace_path = os.path.join('user_workspaces', workspace_id)
        file_path = os.path.join(workspace_path, relative_path)
        
        # Asegurar que no se salga del directorio del usuario
        if not os.path.abspath(file_path).startswith(os.path.abspath(workspace_path)):
            return jsonify({
                'success': False,
                'error': 'Acceso denegado: la ruta se sale del espacio de trabajo'
            }), 403
        
        # Crear el archivo
        success, message = file_explorer.create_file(file_path, content)
        
        if success:
            # Registro de actividad (opcional)
            logger.info(f"Archivo creado: {file_path}")
            
            return jsonify({
                'success': True,
                'path': relative_path,
                'message': message
            })
        else:
            return jsonify({
                'success': False,
                'error': message
            }), 400
    except Exception as e:
        logger.error(f"Error al crear archivo: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error al crear el archivo: {str(e)}'
        }), 500


@file_explorer_bp.route('/api/explorer/search', methods=['GET'])
def search_files():
    """
    Busca archivos o directorios en el espacio de trabajo.
    
    Parámetros de consulta:
    - query: Texto a buscar
    - type: Tipo de búsqueda ('name', 'content', 'extension')
    - path: Ruta base para la búsqueda (predeterminado: '.')
    - workspace_id: ID del espacio de trabajo (predeterminado: 'default')
    
    Retorna:
    - Lista de archivos/directorios encontrados
    """
    try:
        query = request.args.get('query')
        search_type = request.args.get('type', 'name')
        relative_path = request.args.get('path', '.')
        workspace_id = request.args.get('workspace_id', 'default')
        
        if not query:
            return jsonify({
                'success': False,
                'error': 'Debe especificar un texto de búsqueda'
            }), 400
        
        # Construir ruta completa
        workspace_path = os.path.join('user_workspaces', workspace_id)
        search_path = os.path.join(workspace_path, relative_path)
        
        # Asegurar que no se salga del directorio del usuario
        if not os.path.abspath(search_path).startswith(os.path.abspath(workspace_path)):
            return jsonify({
                'success': False,
                'error': 'Acceso denegado: la ruta se sale del espacio de trabajo'
            }), 403
        
        # Realizar la búsqueda
        success, found_items, error = file_explorer.find_file(search_path, query, search_type)
        
        if success:
            # Convertir rutas absolutas a relativas
            relative_items = []
            for item in found_items:
                if item.startswith(workspace_path):
                    relative_items.append(os.path.relpath(item, workspace_path))
                else:
                    relative_items.append(item)
            
            return jsonify({
                'success': True,
                'query': query,
                'type': search_type,
                'base_path': relative_path,
                'results': relative_items,
                'count': len(relative_items)
            })
        else:
            return jsonify({
                'success': False,
                'error': error
            }), 500
    except Exception as e:
        logger.error(f"Error al buscar archivos: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error al buscar archivos: {str(e)}'
        }), 500


@file_explorer_bp.route('/api/explorer/analyze', methods=['GET'])
def analyze_project():
    """
    Analiza la estructura general de un proyecto.
    
    Parámetros de consulta:
    - path: Ruta relativa al proyecto (predeterminado: '.')
    - workspace_id: ID del espacio de trabajo (predeterminado: 'default')
    - max_depth: Profundidad máxima de análisis (predeterminado: 3)
    
    Retorna:
    - Información estructurada sobre el proyecto
    """
    try:
        relative_path = request.args.get('path', '.')
        workspace_id = request.args.get('workspace_id', 'default')
        max_depth = int(request.args.get('max_depth', 3))
        
        # Construir ruta completa
        workspace_path = os.path.join('user_workspaces', workspace_id)
        project_path = os.path.join(workspace_path, relative_path)
        
        # Asegurar que no se salga del directorio del usuario
        if not os.path.abspath(project_path).startswith(os.path.abspath(workspace_path)):
            return jsonify({
                'success': False,
                'error': 'Acceso denegado: la ruta se sale del espacio de trabajo'
            }), 403
        
        # Analizar el proyecto
        analysis = file_explorer.analyze_project_structure(project_path, max_depth)
        
        # Convertir rutas absolutas a relativas en el resultado
        if analysis.get('success', False) and 'important_files' in analysis:
            relative_files = []
            for item in analysis['important_files']:
                if item.startswith(workspace_path):
                    relative_files.append(os.path.relpath(item, workspace_path))
                else:
                    relative_files.append(item)
            analysis['important_files'] = relative_files
        
        return jsonify(analysis)
    except Exception as e:
        logger.error(f"Error al analizar proyecto: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error al analizar el proyecto: {str(e)}'
        }), 500


def register_file_explorer_routes(app):
    """Registra las rutas de exploración de archivos en la aplicación Flask."""
    app.register_blueprint(file_explorer_bp)
    logger.info("Rutas de exploración de archivos registradas correctamente")