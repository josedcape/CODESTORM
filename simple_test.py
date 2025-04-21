import os
import re
import json
import logging
import subprocess
from pathlib import Path
from flask import Flask, render_template, jsonify, request, send_from_directory, redirect, url_for, flash
from werkzeug.utils import secure_filename
import requests  # Usamos requests en lugar de aiohttp

# Configurar logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'codestorm-secret-key')

# Funciones auxiliares para el manejo de archivos y directorios
def get_user_workspace(user_id='default'):
    """Obtiene o crea un espacio de trabajo para el usuario."""
    workspace_dir = os.path.join(os.getcwd(), 'user_workspaces', user_id)
    
    # Asegurarnos de que el directorio exista
    os.makedirs(workspace_dir, exist_ok=True)
    
    # Guardar registros de los archivos originales/sistema si no existe
    system_files_record = os.path.join(workspace_dir, '.system_files.json')
    if not os.path.exists(system_files_record):
        # Si es la primera vez, registrar los archivos actuales como del sistema
        try:
            system_files = []
            for root, dirs, files in os.walk(workspace_dir):
                rel_path = os.path.relpath(root, workspace_dir)
                if rel_path == '.':
                    rel_path = ''
                for file in files:
                    if file != '.system_files.json':  # No incluir este archivo
                        file_path = os.path.join(rel_path, file)
                        system_files.append(file_path)
            
            # Guardar la lista de archivos originales
            with open(system_files_record, 'w') as f:
                json.dump(system_files, f)
                
            logger.info(f"Creado registro de archivos del sistema en {workspace_dir}")
        except Exception as e:
            logger.error(f"Error al crear registro de archivos del sistema: {e}")
    
    return workspace_dir

def list_files(directory='.', user_id='default', filter_system_files=True):
    """
    Lista archivos y directorios en una ruta especificada.
    
    Args:
        directory: Directorio relativo dentro del workspace
        user_id: ID del usuario
        filter_system_files: Si es True, filtra los archivos del sistema
    """
    workspace = get_user_workspace(user_id)
    target_dir = os.path.join(workspace, directory)
    
    if not os.path.exists(target_dir):
        return []
    
    # Cargar la lista de archivos del sistema si necesitamos filtrar
    system_files = []
    if filter_system_files:
        system_files_record = os.path.join(workspace, '.system_files.json')
        try:
            if os.path.exists(system_files_record):
                with open(system_files_record, 'r') as f:
                    system_files = json.load(f)
        except Exception as e:
            logger.error(f"Error al cargar la lista de archivos del sistema: {e}")
    
    try:
        entries = []
        for entry in os.listdir(target_dir):
            # Saltamos el archivo de sistema que contiene los registros
            if entry == '.system_files.json':
                continue
                
            # Construir la ruta relativa del archivo o directorio
            rel_path = os.path.join(directory, entry) if directory != '.' else entry
            entry_path = os.path.join(workspace, rel_path)
            entry_type = 'directory' if os.path.isdir(entry_path) else 'file'
            
            # Verificar si este archivo o directorio debería ser filtrado
            should_filter = False
            if filter_system_files and entry_type == 'file':
                # Verificar si el archivo está en la lista de archivos del sistema
                if rel_path in system_files:
                    should_filter = True
                    
            # Solo agregar si no estamos filtrando este archivo
            if not should_filter:
                if entry_type == 'file':
                    file_size = os.path.getsize(entry_path)
                    file_extension = os.path.splitext(entry)[1].lower()[1:] if '.' in entry else ''
                    
                    entries.append({
                        'name': entry,
                        'type': entry_type,
                        'path': rel_path,
                        'size': file_size,
                        'extension': file_extension
                    })
                else:
                    # Para directorios, verificamos primero si tiene contenido que no sea del sistema
                    if entry_type == 'directory' and filter_system_files:
                        # Recursivamente verificar si hay archivos no del sistema en este directorio
                        subdir_contents = list_files(rel_path, user_id, filter_system_files)
                        if len(subdir_contents) == 0:
                            # Si el directorio no tiene archivos útiles, lo filtramos
                            continue
                    
                    entries.append({
                        'name': entry,
                        'type': entry_type,
                        'path': rel_path
                    })
        
        return entries
    except Exception as e:
        logger.error(f"Error al listar archivos: {str(e)}")
        return []

# Rutas principales
@app.route('/')
def index():
    """Ruta principal que sirve la página index.html."""
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    """Ruta al panel de control."""
    return render_template('dashboard.html')

@app.route('/chat')
def chat():
    """Ruta a la página de chat."""
    agent_id = request.args.get('agent', 'general')
    return render_template('chat.html', agent_id=agent_id)
    
@app.route('/files')
def files():
    """Ruta al explorador de archivos."""
    return render_template('files.html')

@app.route('/code_corrector')
def code_corrector():
    """Ruta al corrector de código."""
    return render_template('code_corrector.html')

@app.route('/api/analyze_code', methods=['POST'])
def analyze_code():
    """
    API para analizar código con instrucciones específicas.
    Utiliza los modelos de IA para mejorar y optimizar el código proporcionado.
    
    Espera:
    - code: código a analizar
    - language: lenguaje del código
    - instructions: instrucciones específicas (opcional)
    - model: modelo de IA a utilizar (openai, anthropic, gemini)
    - agent_id: tipo de agente a utilizar (developer, architect, advanced, general)
    
    Retorna:
    - improved_code: código mejorado
    - explanations: lista de explicaciones sobre los cambios
    - suggestions: lista de sugerencias para mejoras adicionales
    """
    try:
        data = request.json
        code = data.get('code', '')
        language = data.get('language', 'python')
        instructions = data.get('instructions', 'Mejora y optimiza este código.')
        model = data.get('model', 'openai')
        agent_id = data.get('agent_id', 'developer')
        
        logger.info(f"Analizando código en {language} con modelo {model}, agente {agent_id}")
        
        # Simular respuesta con mejoras básicas según el lenguaje
        # En una implementación real, aquí se llamaría a la función de análisis de la IA
        
        improved_code = code
        explanations = []
        suggestions = []
        
        # Simulación básica de mejoras según el lenguaje
        if language == 'python':
            if 'import ' not in code:
                improved_code = '# Añadir imports necesarios\nimport os\nimport sys\n\n' + code
                explanations.append('Se agregaron imports básicos que podrían ser necesarios.')
            
            if 'print(' in code and not 'if __name__' in code:
                improved_code += '\n\nif __name__ == "__main__":\n    # Código principal aquí\n    pass'
                explanations.append('Se agregó el bloque if __name__ == "__main__" para mejor estructura.')
            
            suggestions = [
                'Considera agregar docstrings para documentar las funciones.',
                'Utiliza typing para anotaciones de tipo.',
                'Agrega manejo de errores con bloques try/except.',
                'Implementa logging para facilitar la depuración.'
            ]
            
        elif language == 'javascript':
            if 'var ' in code:
                improved_code = code.replace('var ', 'const ')
                explanations.append('Se reemplazaron declaraciones "var" por "const" para mejor control de ámbito.')
            
            suggestions = [
                'Considera usar funciones de flecha en lugar de funciones tradicionales.',
                'Implementa async/await para código asíncrono más legible.',
                'Utiliza destructuring para simplificar asignaciones.',
                'Agrega validación de parámetros al inicio de las funciones.'
            ]
            
        elif language == 'html':
            if '<!DOCTYPE html>' not in code:
                improved_code = '<!DOCTYPE html>\n<html lang="es">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Documento</title>\n</head>\n<body>\n' + code + '\n</body>\n</html>'
                explanations.append('Se agregó la estructura básica de un documento HTML5.')
            
            suggestions = [
                'Asegúrate de usar etiquetas semánticas como <header>, <footer>, <main>.',
                'Incluye atributos alt en todas las imágenes para accesibilidad.',
                'Considera agregar metaetiquetas para SEO.',
                'Verifica la accesibilidad con roles ARIA cuando sea necesario.'
            ]
            
        # Modificamos la respuesta según el agente especializado seleccionado
        if agent_id == "developer":
            explanations.append('Análisis realizado por el agente Desarrollador de Código, enfocado en buenas prácticas y optimización.')
            suggestions.append('El agente desarrollador recomienda seguir las convenciones de estilo del lenguaje seleccionado.')
        elif agent_id == "architect":
            explanations.append('Análisis realizado por el agente Arquitecto de Sistemas, enfocado en estructura y escalabilidad.')
            suggestions.append('El agente arquitecto recomienda considerar patrones de diseño apropiados para esta implementación.')
        elif agent_id == "advanced":
            explanations.append('Análisis realizado por el agente Experto Avanzado, enfocado en técnicas sofisticadas y optimizaciones de alto nivel.')
            suggestions.append('El agente avanzado detecta oportunidades para aplicar técnicas más sofisticadas en este código.')
            
        # Retornar respuesta
        return jsonify({
            'success': True,
            'improved_code': improved_code,
            'explanations': explanations,
            'suggestions': suggestions
        })
        
    except Exception as e:
        logger.error(f"Error al analizar código: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/edit_file')
def edit_file():
    """Editar un archivo."""
    file_path = request.args.get('path', '')
    if not file_path:
        return redirect('/files')
    
    try:
        workspace = get_user_workspace()
        full_path = os.path.join(workspace, file_path)
        
        # Verificar path traversal
        if not os.path.normpath(full_path).startswith(os.path.normpath(workspace)):
            flash('Ruta de archivo inválida', 'danger')
            return redirect('/files')
        
        # Verificar que el archivo existe
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            flash('El archivo no existe', 'danger')
            return redirect('/files')
        
        # Leer el archivo
        with open(full_path, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        
        # Determinar el tipo de archivo
        file_type = os.path.splitext(file_path)[1].lstrip('.').upper() or 'TXT'
        
        return render_template('editor.html', file_path=file_path, file_content=content, file_type=file_type)
    except Exception as e:
        logger.error(f"Error al editar archivo: {str(e)}")
        flash(f'Error al abrir el archivo: {str(e)}', 'danger')
        return redirect('/files')

# APIs para manejo de archivos
@app.route('/api/files', methods=['GET'])
def api_list_files():
    """API para listar archivos del workspace."""
    try:
        user_id = request.args.get('user_id', 'default')
        directory = request.args.get('directory', '.')
        
        files = list_files(directory, user_id)
        
        return jsonify({
            'success': True,
            'files': files,
            'directory': directory
        })
    except Exception as e:
        logger.error(f"Error al listar archivos: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/files/read', methods=['GET'])
def api_read_file():
    """API para leer el contenido de un archivo."""
    try:
        user_id = request.args.get('user_id', 'default')
        file_path = request.args.get('file_path')
        
        if not file_path:
            return jsonify({
                'success': False,
                'error': 'Se requiere ruta de archivo'
            }), 400
        
        workspace = get_user_workspace(user_id)
        full_path = os.path.join(workspace, file_path)
        
        # Verificar path traversal
        if not os.path.normpath(full_path).startswith(os.path.normpath(workspace)):
            return jsonify({
                'success': False,
                'error': 'Ruta de archivo inválida'
            }), 400
        
        # Verificar que el archivo existe
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            return jsonify({
                'success': False,
                'error': 'El archivo no existe'
            }), 404
        
        # Leer el archivo
        with open(full_path, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        
        return jsonify({
            'success': True,
            'file_path': file_path,
            'content': content
        })
    except Exception as e:
        logger.error(f"Error al leer archivo: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/files/create', methods=['POST'])
def api_create_file():
    """API para crear o actualizar un archivo."""
    try:
        data = request.json
        user_id = data.get('user_id', 'default')
        file_path = data.get('file_path')
        content = data.get('content', '')
        
        if not file_path:
            return jsonify({
                'success': False,
                'error': 'Se requiere ruta de archivo'
            }), 400
        
        workspace = get_user_workspace(user_id)
        full_path = os.path.join(workspace, file_path)
        
        # Verificar path traversal
        if not os.path.normpath(full_path).startswith(os.path.normpath(workspace)):
            return jsonify({
                'success': False,
                'error': 'Ruta de archivo inválida'
            }), 400
        
        # Crear directorios si no existen
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # Escribir contenido al archivo
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return jsonify({
            'success': True,
            'file_path': file_path
        })
    except Exception as e:
        logger.error(f"Error al crear archivo: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/save_file', methods=['POST'])
def save_file():
    """Guarda cambios en un archivo."""
    try:
        data = request.json
        file_path = data.get('file_path')
        content = data.get('content', '')
        
        if not file_path:
            return jsonify({
                'success': False,
                'error': 'Se requiere ruta de archivo'
            }), 400
        
        workspace = get_user_workspace()
        full_path = os.path.join(workspace, file_path)
        
        # Verificar path traversal
        if not os.path.normpath(full_path).startswith(os.path.normpath(workspace)):
            return jsonify({
                'success': False,
                'error': 'Ruta de archivo inválida'
            }), 400
        
        # Crear directorios si no existen
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # Escribir contenido al archivo
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return jsonify({
            'success': True,
            'file_path': file_path,
            'message': 'Archivo guardado correctamente'
        })
    except Exception as e:
        logger.error(f"Error al guardar archivo: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/files/delete', methods=['POST'])
def api_delete_file():
    """API para eliminar un archivo o directorio."""
    try:
        data = request.json
        user_id = data.get('user_id', 'default')
        file_path = data.get('file_path')
        
        if not file_path:
            return jsonify({
                'success': False,
                'error': 'Se requiere ruta de archivo'
            }), 400
        
        workspace = get_user_workspace(user_id)
        full_path = os.path.join(workspace, file_path)
        
        # Verificar path traversal
        if not os.path.normpath(full_path).startswith(os.path.normpath(workspace)):
            return jsonify({
                'success': False,
                'error': 'Ruta de archivo inválida'
            }), 400
        
        # Verificar que el archivo o directorio existe
        if not os.path.exists(full_path):
            return jsonify({
                'success': False,
                'error': 'El archivo o directorio no existe'
            }), 404
        
        # Eliminar archivo o directorio
        if os.path.isfile(full_path):
            os.remove(full_path)
        elif os.path.isdir(full_path):
            import shutil
            shutil.rmtree(full_path)
        
        return jsonify({
            'success': True,
            'file_path': file_path,
            'message': f"Se ha eliminado {file_path}"
        })
    except Exception as e:
        logger.error(f"Error al eliminar archivo: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# API para análisis de código
@app.route('/api/analyze_code', methods=['POST'])
def process_code():
    """
    API para analizar código con instrucciones específicas.
    Utiliza los modelos de IA para mejorar y optimizar el código proporcionado.
    """
    try:
        data = request.json
        user_id = data.get('user_id', 'default')
        code = data.get('code')
        language = data.get('language', 'python')
        instructions = data.get('instructions', '')
        model = data.get('model', 'openai')
        agent_id = data.get('agent_id', 'developer')
        
        logger.info(f"Analizando código en {language} con modelo {model}, agente {agent_id}")
        
        if not code:
            return jsonify({
                'success': False,
                'error': 'Se requiere código para analizar'
            }), 400
        
        # En una implementación real, aquí se conectaría con un servicio de IA
        # para analizar el código. Para esta versión simplificada, simulamos una respuesta.
        
        # Análisis básico de código
        improved_code = code
        explanations = ["El código se ve bien estructurado."]
        suggestions = ["Considera añadir comentarios para mejorar la legibilidad."]
        
        # Modificamos la respuesta según el agente especializado seleccionado
        if agent_id == "developer":
            explanations.append('Análisis realizado por el agente Desarrollador de Código, enfocado en buenas prácticas y optimización.')
            suggestions.append('Recomendación del desarrollador: Sigue las convenciones de estilo del lenguaje seleccionado.')
        elif agent_id == "architect":
            explanations.append('Análisis realizado por el agente Arquitecto de Sistemas, enfocado en estructura y escalabilidad.')
            suggestions.append('Recomendación del arquitecto: Considera patrones de diseño apropiados para esta implementación.')
        elif agent_id == "advanced":
            explanations.append('Análisis realizado por el agente Experto Avanzado, enfocado en técnicas sofisticadas y optimizaciones de alto nivel.')
            suggestions.append('Recomendación del experto: Hay oportunidades para aplicar técnicas más avanzadas en este código.')
        
        # Respuestas según el lenguaje
        if language == 'python':
            if 'def ' in code and not code.strip().startswith('def '):
                explanations.append("Has definido funciones correctamente.")
            if 'import ' in code:
                suggestions.append("Verifica que todas las importaciones sean necesarias para tu código.")
            if 'while ' in code and 'break' not in code:
                suggestions.append("Considera añadir una condición de salida en tu bucle while para evitar bucles infinitos.")
                
        elif language == 'javascript':
            if 'function ' in code:
                explanations.append("Has definido funciones correctamente.")
            if 'var ' in code:
                suggestions.append("Considera usar 'let' o 'const' en lugar de 'var' para una mejor gestión de ámbito.")
            if 'console.log' in code:
                suggestions.append("Recuerda eliminar las declaraciones console.log en código de producción.")
                
        # Mejoras simuladas basadas en instrucciones
        if instructions:
            if 'optimizar' in instructions.lower() or 'rendimiento' in instructions.lower():
                suggestions.append("Para optimizar el rendimiento, considera utilizar estructuras de datos más eficientes.")
                explanations.append("El rendimiento podría mejorarse reduciendo las operaciones redundantes.")
            
            if 'seguridad' in instructions.lower():
                suggestions.append("Para mejorar la seguridad, valida todas las entradas del usuario.")
                explanations.append("Es importante proteger tu código contra entradas maliciosas.")
        
        # Simulamos mejoras en el código para casos específicos
        if language == 'python' and 'fibonacci' in code.lower() and 'def fibonacci' in code.lower():
            if 'fibonacci(n-1) + fibonacci(n-2)' in code:
                improved_code = code.replace('def fibonacci(n):', 'def fibonacci(n):  # Versión optimizada')
                improved_code = improved_code.replace('    if n <= 0:', '    # Verificación de entrada\n    if n <= 0:')
                improved_code = improved_code.replace('    elif n == 1:', '    elif n == 1:')
                improved_code = improved_code.replace('    else:\n        return fibonacci(n-1) + fibonacci(n-2)', 
                                                   '    else:\n        # Usamos enfoque iterativo para mejor rendimiento\n'
                                                   '        a, b = 0, 1\n        for _ in range(2, n + 1):\n'
                                                   '            a, b = b, a + b\n        return b')
                
                explanations = ["Tu implementación usa recursión, lo que puede llevar a desbordamiento de pila para valores grandes.",
                               "La función recursiva tiene complejidad de tiempo O(2^n), que es exponencial.",
                               "La implementación iterativa propuesta tiene complejidad O(n), mucho más eficiente."]
                
                suggestions = ["Utiliza el enfoque iterativo para mejorar el rendimiento.",
                              "Añade validación de entrada para manejar valores negativos.",
                              "Considera implementar memoización si necesitas mantener el enfoque recursivo."]
        
        return jsonify({
            'success': True,
            'improved_code': improved_code,
            'explanations': explanations,
            'suggestions': suggestions
        })
    except Exception as e:
        logger.error(f"Error al analizar código: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# API para chat y generación de contenido
@app.route('/api/chat', methods=['POST'])
def api_chat():
    """API para chat con agentes especializados."""
    try:
        # Registro detallado para diagnóstico
        logger.info("=== Solicitud recibida en /api/chat ===")
        
        data = request.json
        logger.info(f"Datos recibidos (JSON): {data}")
        
        user_id = data.get('user_id', 'default')
        message = data.get('message', '')
        agent_id = data.get('agent_id', 'general')
        model_choice = data.get('model', 'openai')
        
        # Para depuración, verificamos si las claves API están configuradas
        openai_key = os.environ.get('OPENAI_API_KEY')
        anthropic_key = os.environ.get('ANTHROPIC_API_KEY')
        gemini_key = os.environ.get('GEMINI_API_KEY')
        
        logger.info(f"Estado API keys: OpenAI: {'Configurado' if openai_key else 'No configurado'}, "
                   f"Anthropic: {'Configurado' if anthropic_key else 'No configurado'}, "
                   f"Gemini: {'Configurado' if gemini_key else 'No configurado'}")
        
        logger.info(f"Procesando mensaje: '{message}' con agente: {agent_id}, modelo: {model_choice}")
        
        if not message or message.strip() == '':
            error_msg = 'Se requiere un mensaje no vacío'
            logger.warning(f"Error: {error_msg}")
            return jsonify({
                'success': False,
                'error': error_msg
            }), 400
        
        # Determinar si el mensaje es simple (solo saludo) o complejo
        is_simple_message = len(message.split()) <= 3 and any(word in message.lower() for word in 
                                                          ['hola', 'saludos', 'hi', 'hello', 'hey', 'buenos días', 'buenas'])
        
        logger.info(f"Tipo de mensaje: {'Simple (saludo)' if is_simple_message else 'Complejo'}")
        
        # Respuesta dependiendo de si el mensaje es simple o complejo
        agent_name = {
            'developer': "Desarrollador Experto",
            'architect': "Arquitecto de Software",
            'advanced': "Especialista Avanzado",
            'general': "Asistente General"
        }.get(agent_id, "Asistente General")
        
        if is_simple_message:
            # Para mensajes simples, respuesta rápida sin llamar al servicio
            response = f"¡Hola! Soy el {agent_name}. ¿En qué puedo ayudarte hoy? 😀"
        else:
            # Para mensajes complejos, simulamos una respuesta elaborada
            # En un entorno real, aquí se conectaría con el servicio de IA
            response = f"""Soy el {agent_name}. He analizado tu mensaje: '{message}'.

Para ayudarte con esta solicitud, primero necesito entender mejor tus requisitos. 
¿Podrías proporcionarme más detalles sobre lo que necesitas específicamente?

Por ejemplo:
- ¿Cuál es el objetivo principal de tu proyecto?
- ¿Qué tecnologías prefieres utilizar?
- ¿Tienes alguna restricción o requisito especial?

Estoy aquí para ayudarte a desarrollar una solución óptima. 🚀"""
        
        logger.info(f"Respuesta generada correctamente para '{message}'")
        
        return jsonify({
            'success': True,
            'message': message,
            'response': response,
            'agent_id': agent_id,
            'debug_info': {
                'message_type': 'simple' if is_simple_message else 'complex',
                'api_keys_configured': {
                    'openai': bool(openai_key),
                    'anthropic': bool(anthropic_key),
                    'gemini': bool(gemini_key)
                }
            }
        })
    except Exception as e:
        error_details = str(e)
        logger.error(f"Error en el chat: {error_details}")
        
        # Proporcionar más detalles sobre el error para facilitar el diagnóstico
        return jsonify({
            'success': False,
            'error': error_details,
            'error_type': type(e).__name__,
            'suggestion': "Por favor, verifica el formato de tu solicitud y que todos los campos requeridos estén presentes."
        }), 500

# API para ejecución de comandos
@app.route('/api/execute', methods=['POST'])
def api_execute_command():
    """API para ejecutar comandos directamente en el workspace del usuario."""
    # Definir command fuera del bloque try para que esté disponible en los bloques except
    command = None
    
    try:
        data = request.json
        user_id = data.get('user_id', 'default')
        command = data.get('command')
        agent_id = data.get('agent_id', 'general')
        
        if not command:
            return jsonify({
                'success': False,
                'error': 'Se requiere un comando'
            }), 400
        
        # Obtener el workspace del usuario (ahora inicia vacío)
        workspace = get_user_workspace(user_id)
        
        # Agregar información de registro sobre el comando ejecutado
        logger.info(f"Ejecutando comando: '{command}' en workspace '{user_id}', agente: {agent_id}")
        
        # Ejecutar el comando en un subproceso
        process = subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=workspace
        )
        
        # Esperar la respuesta con un tiempo límite de 30 segundos
        stdout, stderr = process.communicate(timeout=30)
        status = process.returncode
        
        # Preparar la respuesta con los resultados de la ejecución
        stdout_text = stdout.decode('utf-8', errors='replace')
        stderr_text = stderr.decode('utf-8', errors='replace')
        
        # Registrar el resultado del comando si hubo un error
        if status != 0:
            logger.warning(f"Comando '{command}' terminó con código {status}. Stderr: {stderr_text}")
        
        result = {
            'success': True,
            'command': command,
            'stdout': stdout_text,
            'stderr': stderr_text,
            'status': status,
            'agent_id': agent_id
        }
        
        return jsonify(result)
    except subprocess.TimeoutExpired as e:
        # Ahora command está disponible aquí
        error_msg = f'Tiempo de ejecución agotado (30s)'
        if command:
            error_msg += f' para el comando: {command}'
            logger.error(f"Timeout al ejecutar comando: '{command}'")
        else:
            logger.error("Timeout al ejecutar un comando desconocido")
        
        return jsonify({
            'success': False,
            'error': error_msg
        }), 504
    except Exception as e:
        error_cmd = f" ejecutando '{command}'" if command else ""
        logger.error(f"Error al ejecutar comando{error_cmd}: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/process', methods=['POST'])
def process_instruction():
    """
    Procesa una instrucción en lenguaje natural para realizar acciones.
    
    La instrucción puede ser:
    - Crear un archivo
    - Ejecutar un comando
    - Modificar un archivo existente
    """
    try:
        data = request.json
        user_id = data.get('user_id', 'default')
        instruction = data.get('instruction')
        model = data.get('model', 'openai')
        agent_id = data.get('agent_id', 'general')
        
        if not instruction:
            return jsonify({
                'success': False,
                'error': 'Se requiere una instrucción'
            }), 400
        
        logger.info(f"Procesando instrucción con modelo: {model}, agente: {agent_id}")
        workspace = get_user_workspace(user_id)
        
        # Simulación de procesamiento de lenguaje natural:
        # En una implementación real, aquí se conectaría con un modelo de IA
        
        # Detectar si la instrucción parece ser un comando
        if instruction.startswith('ejecuta ') or instruction.startswith('corre ') or instruction.startswith('run '):
            command = instruction.split(' ', 1)[1]
            
            # Registrar la acción
            logger.info(f"Procesando instrucción como comando: '{command}' con agente {agent_id}, modelo {model}")
            
            # Ejecutar el comando
            process = subprocess.Popen(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=workspace
            )
            
            stdout, stderr = process.communicate(timeout=30)
            status = process.returncode
            
            stdout_text = stdout.decode('utf-8', errors='replace')
            stderr_text = stderr.decode('utf-8', errors='replace')
            
            # Registrar el resultado si hubo error
            if status != 0:
                logger.warning(f"Instrucción comando '{command}' terminó con código {status}. Stderr: {stderr_text}")
            
            return jsonify({
                'success': True,
                'command': command,
                'result': stdout_text,
                'error': stderr_text,
                'status': status,
                'agent_id': agent_id,
                'model': model
            })
            
        # Detectar si la instrucción parece ser para crear un archivo
        elif 'crea' in instruction.lower() and ('archivo' in instruction.lower() or 'fichero' in instruction.lower()):
            # Extraer un nombre de archivo básico de la instrucción
            filename_match = re.search(r'(?:llamado|nombrado|nombre)\s+["\']?([^"\']+)["\']?', instruction)
            if filename_match:
                filename = filename_match.group(1)
            else:
                # Si no se encuentra un nombre específico, crear uno genérico
                extension = '.txt'
                if 'html' in instruction.lower(): extension = '.html'
                elif 'css' in instruction.lower(): extension = '.css'
                elif 'javascript' in instruction.lower() or 'js' in instruction.lower(): extension = '.js'
                elif 'python' in instruction.lower() or 'py' in instruction.lower(): extension = '.py'
                
                filename = f"nuevo_archivo{extension}"
            
            # Contenido básico según el tipo de archivo
            content = ""
            if filename.endswith('.html'):
                content = "<!DOCTYPE html>\n<html>\n<head>\n    <title>Nuevo documento</title>\n</head>\n<body>\n    <h1>Nuevo documento</h1>\n    <p>Contenido del documento.</p>\n</body>\n</html>"
            elif filename.endswith('.css'):
                content = "body {\n    margin: 0;\n    padding: 0;\n    font-family: Arial, sans-serif;\n}"
            elif filename.endswith('.js'):
                content = "// Archivo JavaScript\nconsole.log('Nuevo archivo JavaScript');"
            elif filename.endswith('.py'):
                content = "# Archivo Python\n\ndef main():\n    print('Hola mundo')\n\nif __name__ == '__main__':\n    main()"
            
            # Crear el archivo
            file_path = os.path.join(workspace, filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return jsonify({
                'success': True,
                'file_path': filename,
                'content': content,
                'result': f"Se ha creado el archivo '{filename}' con contenido básico."
            })
            
        else:
            # Respuesta genérica para instrucciones no reconocidas
            return jsonify({
                'success': True,
                'result': f"He recibido tu instrucción: '{instruction}'. "
                          "Para ejecutar un comando, comienza con 'ejecuta'. "
                          "Para crear un archivo, incluye 'crea archivo' en tu instrucción."
            })
            
    except Exception as e:
        logger.error(f"Error al procesar instrucción: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Verificar estado
@app.route('/health')
def health():
    return jsonify({
        'status': 'ok',
        'message': 'Aplicación funcionando correctamente',
        'diagnostic_routes': ['health', 'api/test_apis']
    })

# Ruta de prueba de APIs
@app.route('/api/test_apis', methods=['GET'])
def test_apis():
    """Prueba las conexiones a las APIs de IA para diagnóstico."""
    results = {
        'status': 'testing',
        'apis': {
            'openai': {'status': 'unknown'},
            'anthropic': {'status': 'unknown'},
            'gemini': {'status': 'unknown'}
        }
    }
    
    # Verificar OpenAI
    openai_key = os.environ.get('OPENAI_API_KEY')
    if openai_key:
        try:
            logger.info("Probando conexión con OpenAI...")
            results['apis']['openai'] = {
                'status': 'configured',
                'message': 'API key configurada, pero no se prueba la conexión en esta versión simplificada'
            }
        except Exception as e:
            error_msg = str(e)
            results['apis']['openai'] = {
                'status': 'error',
                'message': error_msg[:100] + '...' if len(error_msg) > 100 else error_msg
            }
            logger.error(f"Error al verificar OpenAI: {error_msg}")
    else:
        results['apis']['openai'] = {
            'status': 'not_configured',
            'message': 'API key no configurada'
        }
    
    # Verificar Anthropic
    anthropic_key = os.environ.get('ANTHROPIC_API_KEY')
    if anthropic_key:
        results['apis']['anthropic'] = {
            'status': 'configured',
            'message': 'API key configurada, pero no se prueba la conexión en esta versión simplificada'
        }
    else:
        results['apis']['anthropic'] = {
            'status': 'not_configured',
            'message': 'API key no configurada'
        }
    
    # Verificar Gemini
    gemini_key = os.environ.get('GEMINI_API_KEY')
    if gemini_key:
        results['apis']['gemini'] = {
            'status': 'configured',
            'message': 'API key configurada, pero no se prueba la conexión en esta versión simplificada'
        }
    else:
        results['apis']['gemini'] = {
            'status': 'not_configured',
            'message': 'API key no configurada'
        }
    
    # Agregar información sobre las rutas de chat
    results['chat_endpoints'] = {
        'handle_chat': '/api/chat',
        'generate_response': '/api/generate',
        'process_code': '/api/process_code'
    }
    
    return jsonify(results)

# Servir archivos estáticos
@app.route('/static/<path:filename>')
def serve_static(filename):
    """Servir archivos estáticos desde el directorio static."""
    return send_from_directory('static', filename)

@app.route('/workspace/<path:filename>')
def serve_workspace_file(filename):
    """Servir archivos desde el workspace del usuario."""
    return send_from_directory('user_workspaces/default', filename)

# Esta ruta ya existe en otra parte del código, eliminamos esta duplicada

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)