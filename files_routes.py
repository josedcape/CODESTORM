"""
Rutas para el manejo de archivos en Codestorm Assistant.
Este módulo proporciona las rutas para manipular archivos y directorios.
"""

import os
import shutil
import logging
from flask import Blueprint, request, jsonify, render_template, redirect, url_for, session
from file_manager import FileManager

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear Blueprint para las rutas de archivos
files_bp = Blueprint('files', __name__)

# Función auxiliar para obtener el workspace del usuario
def get_user_workspace(user_id='default'):
    """
    Obtiene o crea el espacio de trabajo para el usuario.
    
    Args:
        user_id: Identificador del usuario
        
    Returns:
        str: Ruta al workspace del usuario
    """
    from app import get_user_workspace as app_get_user_workspace
    return app_get_user_workspace(user_id)

@files_bp.route('/files_simple')
def files_simple():
    """Vista simple del explorador de archivos."""
    try:
        user_id = session.get('user_id', 'default')
        workspace_path = get_user_workspace(user_id)
        
        # Obtener la ruta a listar
        current_path = request.args.get('path', '.')
        
        # Sanitizar la ruta
        current_path = FileManager.sanitize_path(current_path)
        
        # Construir ruta completa
        target_path = os.path.join(workspace_path, current_path)
        
        # Verificar que esté dentro del workspace
        if not FileManager.is_within_base(workspace_path, target_path):
            return render_template('files_simple.html', 
                                  items=[], 
                                  current_path='.', 
                                  error="Acceso denegado: No puedes acceder a directorios fuera del workspace")
        
        # Obtener mensaje de error si existe
        error = request.args.get('error', None)
        
        # Listar archivos
        items = FileManager.list_files(target_path)
        
        # Adaptar rutas relativas para la plantilla
        for item in items:
            if current_path == '.':
                item['path'] = item['name']
            else:
                item['path'] = os.path.join(current_path, item['name'])
        
        return render_template('files_simple.html', 
                              items=items, 
                              current_path=current_path,
                              error=error)
    except Exception as e:
        logger.error(f"Error en la vista de archivos: {str(e)}")
        return render_template('files_simple.html', 
                              items=[], 
                              current_path='.', 
                              error=f"Error al listar archivos: {str(e)}")

@files_bp.route('/api/files/create_file', methods=['POST'])
def create_file():
    """Crea un archivo en el workspace."""
    try:
        current_path = request.form.get('current_path', '.')
        file_name = request.form.get('file_name', '')
        file_content = request.form.get('file_content', '')
        
        if not file_name:
            return redirect(f'/files_simple?path={current_path}&error=Nombre+de+archivo+requerido')
        
        user_id = session.get('user_id', 'default')
        workspace_path = get_user_workspace(user_id)
        
        # Construir ruta del archivo
        file_path = FileManager.join_paths(current_path, file_name) if current_path != '.' else file_name
        target_file = os.path.join(workspace_path, file_path)
        
        # Verificar que esté dentro del workspace
        if not FileManager.is_within_base(workspace_path, target_file):
            return redirect(f'/files_simple?path={current_path}&error=Acceso+denegado')
            
        # Crear el archivo
        success, message = FileManager.create_file(target_file, file_content)
        
        if success:
            return redirect(f'/files_simple?path={current_path}')
        else:
            return redirect(f'/files_simple?path={current_path}&error={message}')
    except Exception as e:
        logger.error(f"Error al crear archivo: {str(e)}")
        return redirect('/files_simple?error=Error+al+crear+archivo')

@files_bp.route('/api/files/create_folder', methods=['POST'])
def create_folder():
    """Crea una carpeta en el workspace."""
    try:
        current_path = request.form.get('current_path', '.')
        folder_name = request.form.get('folder_name', '')
        
        if not folder_name:
            return redirect(f'/files_simple?path={current_path}&error=Nombre+de+carpeta+requerido')
        
        user_id = session.get('user_id', 'default')
        workspace_path = get_user_workspace(user_id)
        
        # Construir ruta de la carpeta
        folder_path = FileManager.join_paths(current_path, folder_name) if current_path != '.' else folder_name
        target_folder = os.path.join(workspace_path, folder_path)
        
        # Verificar que esté dentro del workspace
        if not FileManager.is_within_base(workspace_path, target_folder):
            return redirect(f'/files_simple?path={current_path}&error=Acceso+denegado')
            
        # Crear la carpeta
        success, message = FileManager.create_directory(target_folder)
        
        if success:
            return redirect(f'/files_simple?path={current_path}')
        else:
            return redirect(f'/files_simple?path={current_path}&error={message}')
    except Exception as e:
        logger.error(f"Error al crear carpeta: {str(e)}")
        return redirect('/files_simple?error=Error+al+crear+carpeta')

@files_bp.route('/api/files/delete', methods=['POST'])
def delete_item():
    """Elimina un archivo o directorio en el workspace."""
    try:
        path = request.form.get('path', '')
        
        if not path:
            return redirect('/files_simple?error=Ruta+no+especificada')
        
        user_id = session.get('user_id', 'default')
        workspace_path = get_user_workspace(user_id)
        
        # Sanitizar la ruta
        path = FileManager.sanitize_path(path)
        
        # Obtener directorio padre antes de eliminar
        parent_dir = os.path.dirname(path) if path != '.' else '.'
        
        # Construir ruta completa
        target_path = os.path.join(workspace_path, path)
        
        # Verificar que esté dentro del workspace
        if not FileManager.is_within_base(workspace_path, target_path):
            return redirect(f'/files_simple?path={parent_dir}&error=Acceso+denegado')
            
        # Eliminar elemento
        success, message = FileManager.delete_item(target_path)
        
        if success:
            return redirect(f'/files_simple?path={parent_dir}')
        else:
            return redirect(f'/files_simple?path={parent_dir}&error={message}')
    except Exception as e:
        logger.error(f"Error al eliminar: {str(e)}")
        return redirect('/files_simple?error=Error+al+eliminar')

def register_routes(app):
    """Registra las rutas de archivos en la aplicación."""
    app.register_blueprint(files_bp)
    logger.info("Rutas de archivos registradas correctamente")