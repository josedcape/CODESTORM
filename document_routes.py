"""
Rutas para el manejo de documentos y contexto en el asistente.
Proporciona funcionalidades para cargar, procesar y usar documentos como contexto.
"""

import os
import json
import logging
from typing import Dict, List, Optional
from flask import Blueprint, jsonify, request, send_file
from werkzeug.utils import secure_filename
import document_loader

logger = logging.getLogger(__name__)

# Crear el blueprint para las rutas de documentos
document_bp = Blueprint('document', __name__)

# Configurar directorio para almacenar los documentos cargados
UPLOAD_FOLDER = 'user_workspaces/context_documents'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Extensiones permitidas para los archivos
ALLOWED_EXTENSIONS = {
    'pdf', 'docx', 'doc', 'html', 'htm', 'md', 'txt', 
    'py', 'js', 'css', 'json', 'csv', 'xml', 'yml', 'yaml',
    'pptx', 'epub'
}

def allowed_file(filename):
    """Verifica si la extensión del archivo está permitida."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@document_bp.route('/api/documents/upload', methods=['POST'])
def upload_document():
    """
    Sube un documento y lo almacena para uso posterior como contexto.
    
    Espera:
    - file: El archivo a subir
    - user_id: ID del usuario (opcional)
    
    Retorna:
    - Información sobre el documento subido
    """
    try:
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No se ha proporcionado ningún archivo'
            }), 400
            
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'Nombre de archivo vacío'
            }), 400
            
        user_id = request.form.get('user_id', 'default')
        
        # Crear directorio específico para el usuario
        user_document_dir = os.path.join(UPLOAD_FOLDER, user_id)
        os.makedirs(user_document_dir, exist_ok=True)
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(user_document_dir, filename)
            
            # Guardar el archivo
            file.save(file_path)
            
            # Obtener información del documento
            doc_info = document_loader.get_document_summary(file_path)
            
            if doc_info['success']:
                return jsonify({
                    'success': True,
                    'message': 'Documento subido correctamente',
                    'document': {
                        'filename': filename,
                        'path': file_path,
                        'size': doc_info['file_size'],
                        'word_count': doc_info['total_words'],
                        'preview': doc_info['text_preview'][:300] + '...' if len(doc_info['text_preview']) > 300 else doc_info['text_preview']
                    }
                })
            else:
                # Si no se pudo procesar, devolver error pero mantener el archivo
                return jsonify({
                    'success': True,
                    'message': 'Documento subido pero no se pudo procesar completamente',
                    'warning': doc_info['error'],
                    'document': {
                        'filename': filename,
                        'path': file_path,
                        'size': os.path.getsize(file_path),
                    }
                })
        else:
            return jsonify({
                'success': False,
                'error': f'Formato de archivo no permitido. Formatos soportados: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
    except Exception as e:
        logger.error(f"Error al subir documento: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error al procesar el documento: {str(e)}'
        }), 500


@document_bp.route('/api/documents/list', methods=['GET'])
def list_documents():
    """
    Lista todos los documentos del usuario.
    
    Parámetros:
    - user_id: ID del usuario (opcional)
    
    Retorna:
    - Lista de documentos disponibles
    """
    try:
        user_id = request.args.get('user_id', 'default')
        user_document_dir = os.path.join(UPLOAD_FOLDER, user_id)
        
        if not os.path.exists(user_document_dir):
            return jsonify({
                'success': True,
                'documents': []
            })
            
        documents = []
        
        for filename in os.listdir(user_document_dir):
            file_path = os.path.join(user_document_dir, filename)
            
            if os.path.isfile(file_path) and allowed_file(filename):
                # Obtener información básica del archivo
                doc_info = {
                    'filename': filename,
                    'path': file_path,
                    'size': os.path.getsize(file_path),
                    'type': os.path.splitext(filename)[1].lower(),
                    'last_modified': os.path.getmtime(file_path)
                }
                
                documents.append(doc_info)
        
        # Ordenar por fecha de modificación (más reciente primero)
        documents.sort(key=lambda x: x['last_modified'], reverse=True)
        
        return jsonify({
            'success': True,
            'documents': documents
        })
    except Exception as e:
        logger.error(f"Error al listar documentos: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error al listar documentos: {str(e)}'
        }), 500


@document_bp.route('/api/documents/info/<path:filename>', methods=['GET'])
def get_document_info(filename):
    """
    Obtiene información detallada sobre un documento específico.
    
    Parámetros:
    - filename: Nombre del archivo
    - user_id: ID del usuario (opcional)
    
    Retorna:
    - Información detallada del documento
    """
    try:
        user_id = request.args.get('user_id', 'default')
        filename = secure_filename(filename)
        file_path = os.path.join(UPLOAD_FOLDER, user_id, filename)
        
        if not os.path.exists(file_path):
            return jsonify({
                'success': False,
                'error': 'El documento no existe'
            }), 404
            
        # Obtener información del documento
        doc_info = document_loader.get_document_summary(file_path)
        
        if doc_info['success']:
            return jsonify({
                'success': True,
                'document': {
                    'filename': filename,
                    'path': file_path,
                    'size': doc_info['file_size'],
                    'type': doc_info['file_type'],
                    'word_count': doc_info['total_words'],
                    'preview': doc_info['text_preview']
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': f'Error al procesar el documento: {doc_info["error"]}'
            }), 500
    except Exception as e:
        logger.error(f"Error al obtener información del documento: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error al obtener información: {str(e)}'
        }), 500


@document_bp.route('/api/documents/delete/<path:filename>', methods=['DELETE'])
def delete_document(filename):
    """
    Elimina un documento específico.
    
    Parámetros:
    - filename: Nombre del archivo
    - user_id: ID del usuario (opcional)
    
    Retorna:
    - Confirmación de eliminación
    """
    try:
        user_id = request.args.get('user_id', 'default')
        filename = secure_filename(filename)
        file_path = os.path.join(UPLOAD_FOLDER, user_id, filename)
        
        if not os.path.exists(file_path):
            return jsonify({
                'success': False,
                'error': 'El documento no existe'
            }), 404
            
        # Eliminar el archivo
        os.remove(file_path)
        
        return jsonify({
            'success': True,
            'message': f'Documento {filename} eliminado correctamente'
        })
    except Exception as e:
        logger.error(f"Error al eliminar documento: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error al eliminar documento: {str(e)}'
        }), 500


@document_bp.route('/api/documents/content/<path:filename>', methods=['GET'])
def get_document_content(filename):
    """
    Obtiene el contenido extraído de un documento.
    
    Parámetros:
    - filename: Nombre del archivo
    - user_id: ID del usuario (opcional)
    - raw: Si se debe devolver el archivo sin procesar (opcional)
    
    Retorna:
    - Contenido del documento
    """
    try:
        user_id = request.args.get('user_id', 'default')
        raw = request.args.get('raw', 'false').lower() == 'true'
        
        filename = secure_filename(filename)
        file_path = os.path.join(UPLOAD_FOLDER, user_id, filename)
        
        if not os.path.exists(file_path):
            return jsonify({
                'success': False,
                'error': 'El documento no existe'
            }), 404
            
        if raw:
            # Devolver el archivo sin procesar
            return send_file(file_path)
        else:
            # Procesar y devolver el contenido extraído
            result = document_loader.load_document_as_context(file_path)
            
            if result['success']:
                return jsonify({
                    'success': True,
                    'content': result['context']['content'],
                    'word_count': result['context']['word_count'],
                    'source': result['context']['source']
                })
            else:
                return jsonify({
                    'success': False,
                    'error': f'Error al extraer contenido: {result["error"]}'
                }), 500
    except Exception as e:
        logger.error(f"Error al obtener contenido del documento: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error al obtener contenido: {str(e)}'
        }), 500


@document_bp.route('/api/chat/with-context', methods=['POST'])
def chat_with_context():
    """
    Procesa un mensaje de chat utilizando un documento como contexto.
    
    Espera:
    - message: Mensaje del usuario
    - document_filename: Nombre del documento a usar como contexto
    - agent_id: ID del agente a utilizar (opcional)
    - user_id: ID del usuario (opcional)
    
    Retorna:
    - Respuesta del asistente considerando el contexto del documento
    """
    try:
        data = request.json
        message = data.get('message')
        document_filename = data.get('document_filename')
        agent_id = data.get('agent_id', 'general')
        user_id = data.get('user_id', 'default')
        
        if not message:
            return jsonify({
                'success': False,
                'error': 'No se ha proporcionado un mensaje'
            }), 400
            
        if not document_filename:
            return jsonify({
                'success': False,
                'error': 'No se ha especificado un documento como contexto'
            }), 400
            
        # Cargar el documento como contexto
        filename = secure_filename(document_filename)
        file_path = os.path.join(UPLOAD_FOLDER, user_id, filename)
        
        if not os.path.exists(file_path):
            return jsonify({
                'success': False,
                'error': 'El documento especificado no existe'
            }), 404
            
        # Obtener el contexto del documento
        context_result = document_loader.load_document_as_context(file_path)
        
        if not context_result['success']:
            return jsonify({
                'success': False,
                'error': f'Error al cargar el documento como contexto: {context_result["error"]}'
            }), 500
            
        # Importar la función para generar respuestas con agentes
        import agents_utils
        
        # Construir el contexto del documento para enviarlo al agente
        document_context = context_result['context']
        
        # Generar respuesta usando el agente con el contexto del documento
        response_result = agents_utils.generate_response(
            user_message=message,
            agent_id=agent_id,
            model="openai",  # Se podría hacer configurable
            document_context=document_context
        )
        
        if not response_result['success']:
            return jsonify({
                'success': False,
                'error': response_result.get('error', 'Error al generar respuesta con el documento como contexto')
            }), 500
            
        response = response_result['response']
        
        return jsonify({
            'success': True,
            'message': message,
            'response': response,
            'document': {
                'filename': document_filename,
                'word_count': context_result['context']['word_count']
            },
            'agent_id': agent_id
        })
    except Exception as e:
        logger.error(f"Error en chat con contexto: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error al procesar el chat con contexto: {str(e)}'
        }), 500


def register_document_routes(app):
    """Registra las rutas de documentos en la aplicación Flask."""
    app.register_blueprint(document_bp)