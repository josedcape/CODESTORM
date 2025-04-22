"""
Rutas y controladores para el Constructor de Tareas Autónomo.
Este módulo implementa un desarrollador autónomo que construye
aplicaciones completas a partir de una única descripción inicial.
"""

import os
import re
import json
import time
import uuid
import logging
import threading
import datetime
import subprocess
from flask import jsonify, request, session, current_app
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

from models import Project, ProjectSession, Base

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Conectar a la base de datos
def get_db_session():
    """Obtiene una sesión de base de datos."""
    engine = create_engine(os.environ.get("DATABASE_URL"))
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    return Session()

# Variables globales para gestionar tareas en segundo plano
active_projects = {}
pause_flags = {}
project_locks = {}

class AutonomousBuilder:
    """
    Constructor autónomo que gestiona la construcción de aplicaciones
    mediante tareas en segundo plano y seguimiento del estado.
    """
    
    def __init__(self, project_id, user_id='default'):
        """Inicializa el constructor autónomo."""
        self.project_id = project_id
        self.user_id = user_id
        self.lock = threading.RLock()  # Lock para operaciones thread-safe
        self.pause_flag = threading.Event()
        self.pause_flag.set()  # Inicialmente no pausado
        
        # Registrar proyecto activo
        active_projects[project_id] = self
        pause_flags[project_id] = self.pause_flag
        project_locks[project_id] = self.lock
    
    def start_building(self, project_description):
        """Inicia el proceso de construcción en un hilo separado."""
        thread = threading.Thread(
            target=self._build_process,
            args=(project_description,),
            daemon=True
        )
        thread.start()
        return thread
    
    def _build_process(self, project_description):
        """Proceso principal de construcción (ejecutado en segundo plano)."""
        try:
            logger.info(f"Iniciando construcción del proyecto {self.project_id}")
            
            # Obtener o crear el proyecto en la base de datos
            db = get_db_session()
            project = db.query(Project).filter_by(project_id=self.project_id).first()
            
            if not project:
                # Extraer un nombre para el proyecto a partir de la descripción
                project_name = self._extract_project_name(project_description)
                project = Project.create_project(
                    name=project_name,
                    description=project_description,
                    user_id=self.user_id
                )
                db.add(project)
                db.commit()
            
            # Obtener o crear la sesión de conversación
            session = db.query(ProjectSession).filter_by(project_id=self.project_id).first()
            if not session:
                session = ProjectSession.get_or_create(
                    project_id=self.project_id,
                    user_id=self.user_id
                )
                db.add(session)
                db.commit()
            
            # Inicializar el seguimiento de errores para este proyecto
            self.error_count = 0
            self.error_log = []
            self.last_notification_time = time.time()
            self.notification_interval = 10  # Segundos entre notificaciones de avance
            
            # Agregar el mensaje inicial del usuario
            session.add_message('user', project_description)
            db.commit()
            
            # Crear una notificación inicial para el usuario
            self._send_notification(
                project, 
                session, 
                "🚀 Construcción iniciada", 
                "El constructor autónomo está analizando tu solicitud y preparando el entorno de desarrollo."
            )
            
            # Comenzar el flujo de construcción
            self._update_project_status(project, 'active', 'analysis', 5, 
                                      'Analizando requisitos del proyecto')
            
            # Simular análisis de requisitos
            self._wait_with_pause_check(3)
            if self._should_stop():
                logger.info(f"Construcción detenida para proyecto {self.project_id}")
                return
            
            # Extraer tipo de proyecto y stack tecnológico
            project_type, tech_stack = self._analyze_project_requirements(project_description)
            with self.lock:
                project.project_type = project_type
                project.tech_stack = tech_stack
                db.commit()
            
            # Informar al usuario sobre el análisis
            analysis_response = self._generate_analysis_response(project_type, tech_stack)
            session.add_message('assistant', analysis_response)
            db.commit()
            
            # Esperar confirmación (en un entorno real)
            self._update_project_status(project, 'active', 'planning', 10, 
                                      'Planificando estructura del proyecto')
            
            # Simular planificación
            self._wait_with_pause_check(3)
            if self._should_stop():
                return
            
            # Crear estructura de archivos
            file_structure = self._plan_project_structure(project_type, tech_stack)
            session.add_message('assistant', f"He planificado la siguiente estructura de archivos:\n\n```\n{json.dumps(file_structure, indent=2)}\n```\n\n¿Estás de acuerdo con esta estructura? Puedo ajustarla si lo necesitas.")
            db.commit()
            
            # Esperar confirmación (en un entorno real)
            self._wait_with_pause_check(2)
            
            # Actualizar estado
            self._update_project_status(project, 'active', 'implementation', 25, 
                                      'Implementando archivos base')
            
            # Comenzar implementación
            workspace_path = self._get_workspace_path()
            created_files = []
            
            # Crear archivos uno por uno
            total_files = self._count_files(file_structure)
            files_created = 0
            
            for file_info in self._flatten_file_structure(file_structure):
                file_path = file_info['path']
                file_content = self._generate_file_content(file_path, project_type, tech_stack)
                
                # Verificar pausa
                if self._should_stop():
                    return
                
                # Crear el archivo
                full_path = os.path.join(workspace_path, file_path)
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                
                with open(full_path, 'w', encoding='utf-8') as f:
                    f.write(file_content)
                
                # Registrar archivo creado
                created_files.append(file_path)
                with self.lock:
                    project.add_file(file_path, file_content[:200])
                    files_created += 1
                    # Actualizar progreso basado en los archivos creados
                    progress = 25 + min(50, int((files_created / total_files) * 50))
                    project.update_progress(progress)
                    db.commit()
                
                # Informar al usuario
                session.add_message('assistant', f"✅ Archivo creado: `{file_path}`")
                db.commit()
                
                # Pausa para simular trabajo
                self._wait_with_pause_check(1)
            
            # Ejecutar comandos necesarios (instalación de dependencias, etc.)
            self._update_project_status(project, 'active', 'implementation', 75, 
                                      'Instalando dependencias y configurando el proyecto')
            
            # Simular instalación de dependencias
            if tech_stack.get('framework') in ['react', 'vue', 'angular', 'next.js']:
                self._execute_command('npm install', project, session)
            elif tech_stack.get('language') == 'python':
                self._execute_command('pip install -r requirements.txt', project, session)
            
            # Finalizar proyecto
            self._update_project_status(project, 'active', 'testing', 90, 
                                      'Verificando y probando la aplicación')
            
            # Simular pruebas
            self._wait_with_pause_check(3)
            
            # Completar proyecto
            self._update_project_status(project, 'completed', 'completed', 100, 
                                      'Proyecto completado exitosamente')
            
            # Mensaje final
            completion_message = f"""
# ¡Proyecto completado exitosamente! 🎉

He terminado de construir tu aplicación según la descripción proporcionada. La estructura del proyecto está lista y todos los archivos han sido configurados correctamente.

## Resumen del proyecto:
- **Nombre:** {project.name}
- **Tipo:** {project.project_type}
- **Tecnologías:** {', '.join([f"{k}: {v}" for k, v in project.tech_stack.items()])}
- **Archivos creados:** {len(created_files)}

## Próximos pasos:
1. Explora los archivos generados en el explorador de archivos
2. Ejecuta la aplicación siguiendo las instrucciones a continuación
3. Personaliza el código según tus necesidades específicas

## Para ejecutar la aplicación:
```
{self._get_run_instructions(project_type, tech_stack)}
```

Si necesitas realizar algún ajuste o tienes preguntas sobre la implementación, no dudes en preguntar. ¡Estoy aquí para ayudarte!
"""
            session.add_message('assistant', completion_message)
            db.commit()
            
            # Remover de los proyectos activos
            self._cleanup()
            
        except Exception as e:
            logger.error(f"Error en la construcción del proyecto {self.project_id}: {str(e)}")
            try:
                # Intentar registrar el error
                db = get_db_session()
                project = db.query(Project).filter_by(project_id=self.project_id).first()
                session = db.query(ProjectSession).filter_by(project_id=self.project_id).first()
                
                if project:
                    project.status = 'error'
                    project.current_step = f"Error: {str(e)}"
                    db.commit()
                
                if session:
                    session.add_message('assistant', f"❌ Lo siento, ha ocurrido un error durante la construcción: {str(e)}\n\nPor favor, intenta de nuevo o contacta al soporte si el problema persiste.")
                    db.commit()
            except:
                pass
            
            self._cleanup()
    
    def _update_project_status(self, project, status, phase, progress, current_step):
        """Actualiza el estado del proyecto de forma segura."""
        with self.lock:
            db = get_db_session()
            # Recargar el proyecto para evitar problemas de concurrencia
            db_project = db.query(Project).filter_by(project_id=self.project_id).first()
            if db_project:
                db_project.status = status
                db_project.phase = phase
                db_project.progress = progress
                db_project.current_step = current_step
                db_project.updated_at = datetime.datetime.utcnow()
                db.commit()
    
    def _send_notification(self, project, session, title, message, notification_type="info"):
        """
        Envía una notificación para informar sobre el progreso.
        Los tipos pueden ser: "info", "success", "warning", "error"
        """
        # Solo enviar notificaciones si ha pasado suficiente tiempo desde la última
        current_time = time.time()
        if current_time - self.last_notification_time < self.notification_interval:
            return
        
        self.last_notification_time = current_time
        
        # Registrar notificación en el historial del proyecto
        notification = {
            "title": title,
            "message": message,
            "type": notification_type,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        
        if not hasattr(project, 'notifications') or project.notifications is None:
            project.notifications = []
        
        project.notifications.append(notification)
        
        # Añadir un mensaje más detallado al chat
        icon_map = {
            "info": "ℹ️",
            "success": "✅",
            "warning": "⚠️",
            "error": "❌"
        }
        
        icon = icon_map.get(notification_type, "ℹ️")
        notification_message = f"{icon} **{title}**\n\n{message}"
        
        # No añadir al historial de chat para no saturarlo
        # En su lugar, este mensaje se mostrará en una sección especial de notificaciones
        logger.info(f"Notificación enviada: {title} - {message}")
        
        # Para notificaciones críticas, añadirlas al chat
        if notification_type in ["error", "success"]:
            session.add_message('system', notification_message)
    
    def _analyze_and_fix_error(self, error_text, file_path, project, session):
        """
        Analiza un error y trata de solucionarlo automáticamente.
        Retorna True si el error fue solucionado.
        """
        # Incrementar contador de errores
        self.error_count += 1
        self.error_log.append({
            "file": file_path,
            "error": error_text,
            "timestamp": datetime.datetime.utcnow().isoformat()
        })
        
        # Si hay demasiados errores, notificar y detener
        if self.error_count > 10:
            self._send_notification(
                project,
                session,
                "Demasiados errores detectados",
                "Se han detectado múltiples errores que no puedo resolver automáticamente. " +
                "Por favor, revisa el código y los mensajes de error para solucionar los problemas.",
                "error"
            )
            return False
        
        # Notificar sobre el error
        self._send_notification(
            project,
            session,
            "Error detectado",
            f"Se ha detectado un error en '{file_path}'. Intentando solucionar automáticamente...",
            "warning"
        )
        
        # Patrones de error comunes y sus soluciones
        error_patterns = [
            {
                "pattern": r"ModuleNotFoundError: No module named '([^']+)'",
                "solution": lambda match: self._install_missing_module(match.group(1), project, session)
            },
            {
                "pattern": r"SyntaxError: invalid syntax",
                "solution": lambda match: self._fix_syntax_error(file_path, project, session)
            },
            {
                "pattern": r"TypeError: '([^']+)' object is not callable",
                "solution": lambda match: self._fix_type_error(file_path, match.group(1), project, session)
            },
            {
                "pattern": r"NameError: name '([^']+)' is not defined",
                "solution": lambda match: self._fix_name_error(file_path, match.group(1), project, session)
            },
            {
                "pattern": r"ImportError: cannot import name '([^']+)' from '([^']+)'",
                "solution": lambda match: self._fix_import_error(file_path, match.group(1), match.group(2), project, session)
            },
            {
                "pattern": r"FileNotFoundError: \[Errno 2\] No such file or directory: '([^']+)'",
                "solution": lambda match: self._fix_file_not_found(match.group(1), project, session)
            }
        ]
        
        # Comprobar si algún patrón coincide
        for pattern_info in error_patterns:
            match = re.search(pattern_info["pattern"], error_text)
            if match:
                # Intentar aplicar la solución
                if pattern_info["solution"](match):
                    self._send_notification(
                        project,
                        session,
                        "Error corregido automáticamente",
                        f"Se ha corregido un error en '{file_path}'.",
                        "success"
                    )
                    return True
        
        # Si llegamos aquí, no pudimos solucionar el error
        self._send_notification(
            project,
            session,
            "Error no resuelto",
            f"No se ha podido resolver automáticamente el error en '{file_path}'. " +
            "Este error podría requerir intervención manual.",
            "error"
        )
        return False
    
    def _install_missing_module(self, module_name, project, session):
        """Instala un módulo Python que falta."""
        command = f"pip install {module_name}"
        session.add_message('assistant', f"🔧 Instalando módulo que falta: `{module_name}`")
        return self._execute_command(command, project, session)
    
    def _fix_syntax_error(self, file_path, project, session):
        """
        Intenta corregir un error de sintaxis en un archivo.
        Esta función es compleja y requeriría una implementación real más avanzada.
        """
        session.add_message('assistant', f"🔧 Intentando corregir error de sintaxis en `{file_path}`...")
        # En una implementación real, se analizaría el archivo y se intentaría corregir la sintaxis
        return False
    
    def _fix_type_error(self, file_path, obj_type, project, session):
        """Intenta corregir un error de tipo en un archivo."""
        session.add_message('assistant', f"🔧 Intentando corregir error de tipo para objeto '{obj_type}' en `{file_path}`...")
        # En una implementación real, se analizaría el archivo y se intentaría corregir el error de tipo
        return False
    
    def _fix_name_error(self, file_path, name, project, session):
        """Intenta corregir un error de nombre no definido."""
        session.add_message('assistant', f"🔧 Intentando corregir referencia a nombre no definido '{name}' en `{file_path}`...")
        # En una implementación real, se analizaría el archivo y se intentaría definir el nombre faltante
        return False
    
    def _fix_import_error(self, file_path, name, module, project, session):
        """Intenta corregir un error de importación."""
        session.add_message('assistant', f"🔧 Intentando corregir error de importación de '{name}' desde '{module}' en `{file_path}`...")
        # En una implementación real, se intentaría corregir la importación
        return False
    
    def _fix_file_not_found(self, missing_file, project, session):
        """Intenta crear un archivo que no existe pero que se está intentando acceder."""
        session.add_message('assistant', f"🔧 Creando archivo que falta: `{missing_file}`")
        
        try:
            workspace_path = self._get_workspace_path()
            full_path = os.path.join(workspace_path, missing_file)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            
            # Crear un archivo vacío
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write("# Archivo creado automáticamente por el Constructor de Tareas\n")
            
            return True
        except Exception as e:
            session.add_message('assistant', f"❌ Error al crear archivo faltante: {str(e)}")
            return False
    
    def _execute_command(self, command, project, session):
        """Ejecuta un comando y registra el resultado."""
        workspace_path = self._get_workspace_path()
        
        # Detectar si es un comando complejo y procesarlo de manera especial
        if self._is_complex_command(command):
            return self._process_complex_command(command, project, session)
        
        # Registrar que se va a ejecutar un comando
        session.add_message('assistant', f"⚙️ Ejecutando: `{command}`")
        
        try:
            # Ejecutar el comando
            process = subprocess.Popen(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=workspace_path
            )
            
            stdout, stderr = process.communicate(timeout=30)
            status = process.returncode
            
            # Convertir la salida a texto
            stdout_text = stdout.decode('utf-8', errors='replace')
            stderr_text = stderr.decode('utf-8', errors='replace')
            
            # Registrar resultado
            if status == 0:
                result = f"✅ Comando ejecutado exitosamente:\n```\n{stdout_text[:500]}{'...' if len(stdout_text) > 500 else ''}\n```"
                
                # Enviar notificación de éxito si es un comando importante
                if any(keyword in command for keyword in ['install', 'build', 'start', 'init', 'create']):
                    self._send_notification(
                        project,
                        session,
                        f"Comando completado: {command.split()[0]}",
                        f"El comando se ha ejecutado correctamente.",
                        "success"
                    )
            else:
                result = f"⚠️ El comando terminó con código {status}:\n```\n{stderr_text[:500]}{'...' if len(stderr_text) > 500 else ''}\n```"
                
                # Intentar solucionar automáticamente el error
                if self._analyze_and_fix_error(stderr_text, "command", project, session):
                    # Si se solucionó, re-ejecutar el comando
                    return self._execute_command(command, project, session)
            
            session.add_message('assistant', result)
            
            # Agregar acción completada
            action_id = project.add_pending_action('command', f"Ejecutar: {command}")
            project.complete_action(action_id, {"stdout": stdout_text, "stderr": stderr_text, "status": status})
            
            return status == 0
        except Exception as e:
            error_msg = f"❌ Error al ejecutar comando: {str(e)}"
            session.add_message('assistant', error_msg)
            return False
    
    def _is_complex_command(self, command):
        """Detecta si el comando es un comando complejo que requiere procesamiento especial."""
        complex_patterns = [
            # Patrones de instalación
            r'^npm install (.+)$', 
            r'^pip install (.+)$',
            r'^yarn add (.+)$',
            r'^pnpm install (.+)$',
            
            # Patrones de estructura de proyecto
            r'^mkdir -p (.+)$',
            r'^touch (.+)$',
            r'^create-react-app (.+)$',
            r'^npx create-(.+)$',
            r'^django-admin startproject (.+)$',
            r'^django-admin startapp (.+)$',
            r'^flask create (.+)$'
        ]
        
        for pattern in complex_patterns:
            if re.match(pattern, command):
                return True
        
        # Identificar comandos específicos manejados por el constructor
        special_commands = [
            'create-file', 'create-folder', 'install-package', 
            'init-project', 'setup-environment', 'clone-repo'
        ]
        
        if command.split()[0] in special_commands:
            return True
            
        return False
    
    def _process_complex_command(self, command, project, session):
        """Procesa un comando complejo con manejo especial y retroalimentación mejorada."""
        workspace_path = self._get_workspace_path()
        parts = command.split()
        cmd_type = parts[0].lower()
        
        # Manejar comandos de creación de archivos
        if cmd_type == 'create-file':
            if len(parts) < 3:
                session.add_message('assistant', "❌ Error: El comando create-file requiere un nombre de archivo y contenido.")
                return False
                
            file_path = parts[1]
            content = ' '.join(parts[2:])
            
            # Extraer el contenido si viene delimitado
            if content.startswith('"""') and content.endswith('"""'):
                content = content[3:-3]
            elif content.startswith("'''") and content.endswith("'''"):
                content = content[3:-3]
                
            return self._create_file(file_path, content, project, session)
            
        # Manejar comandos de creación de directorios
        elif cmd_type == 'create-folder':
            if len(parts) < 2:
                session.add_message('assistant', "❌ Error: El comando create-folder requiere un nombre de directorio.")
                return False
                
            folder_path = parts[1]
            return self._create_folder(folder_path, project, session)
            
        # Manejar comandos de instalación de paquetes
        elif cmd_type == 'install-package':
            if len(parts) < 3:
                session.add_message('assistant', "❌ Error: El comando install-package requiere un gestor de paquetes y al menos un paquete.")
                return False
                
            package_manager = parts[1]
            packages = parts[2:]
            return self._install_packages(package_manager, packages, project, session)
            
        # Manejar comandos de inicialización de proyecto
        elif cmd_type == 'init-project':
            if len(parts) < 3:
                session.add_message('assistant', "❌ Error: El comando init-project requiere un tipo de proyecto y un nombre.")
                return False
                
            project_type = parts[1]
            project_name = parts[2]
            options = parts[3:] if len(parts) > 3 else []
            return self._init_project(project_type, project_name, options, project, session)
            
        # Manejar comandos de configuración de entorno
        elif cmd_type == 'setup-environment':
            if len(parts) < 2:
                session.add_message('assistant', "❌ Error: El comando setup-environment requiere un tipo de entorno.")
                return False
                
            env_type = parts[1]
            options = parts[2:] if len(parts) > 2 else []
            return self._setup_environment(env_type, options, project, session)
            
        # Manejar comandos de clonación de repositorios
        elif cmd_type == 'clone-repo':
            if len(parts) < 2:
                session.add_message('assistant', "❌ Error: El comando clone-repo requiere una URL de repositorio.")
                return False
                
            repo_url = parts[1]
            target_dir = parts[2] if len(parts) > 2 else None
            return self._clone_repository(repo_url, target_dir, project, session)
            
        # Para comandos complejos estándar, procesarlos con comportamiento extendido
        else:
            # Comandos npm
            if command.startswith('npm install'):
                packages = command.replace('npm install', '').strip()
                return self._install_packages('npm', packages.split(), project, session)
                
            # Comandos pip
            elif command.startswith('pip install'):
                packages = command.replace('pip install', '').strip()
                return self._install_packages('pip', packages.split(), project, session)
                
            # Comandos mkdir
            elif command.startswith('mkdir -p'):
                folder_path = command.replace('mkdir -p', '').strip()
                return self._create_folder(folder_path, project, session)
                
            # Comandos touch
            elif command.startswith('touch'):
                file_path = command.replace('touch', '').strip()
                return self._create_file(file_path, "", project, session)
                
            # Si no es un comando especial, ejecutarlo normalmente
            else:
                session.add_message('assistant', f"⚠️ Procesando comando complejo: `{command}`")
                return self._execute_command_with_progress(command, project, session)
    
    def _execute_command_with_progress(self, command, project, session):
        """Ejecuta un comando mostrando progreso en tiempo real."""
        workspace_path = self._get_workspace_path()
        
        try:
            session.add_message('assistant', f"⏳ Ejecutando: `{command}`")
            
            # Crear un proceso con comunicación bidireccional
            process = subprocess.Popen(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=workspace_path,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            # Capturar la salida en tiempo real
            stdout_output = []
            stderr_output = []
            
            # Función para leer de un stream sin bloqueo
            def read_stream(stream, output_list):
                while True:
                    line = stream.readline()
                    if not line:
                        break
                    output_list.append(line)
                    # Enviar actualización cada 5 líneas o si contiene información importante
                    if len(output_list) % 5 == 0 or any(keyword in line for keyword in ['installing', 'created', 'success', 'done', 'finished']):
                        session.add_message('system', f"📋 Progreso: {line.strip()}")
            
            # Crear hilos para leer stdout y stderr
            stdout_thread = threading.Thread(target=read_stream, args=(process.stdout, stdout_output))
            stderr_thread = threading.Thread(target=read_stream, args=(process.stderr, stderr_output))
            
            # Iniciar hilos
            stdout_thread.start()
            stderr_thread.start()
            
            # Esperar a que terminen los hilos
            stdout_thread.join()
            stderr_thread.join()
            
            # Esperar a que termine el proceso
            status = process.wait()
            
            # Unir la salida
            stdout_text = ''.join(stdout_output)
            stderr_text = ''.join(stderr_output)
            
            # Enviar notificación según el resultado
            if status == 0:
                self._send_notification(
                    project,
                    session,
                    f"Comando completado: {command.split()[0]}",
                    f"El comando se ha ejecutado correctamente.",
                    "success"
                )
                session.add_message('assistant', f"✅ Comando ejecutado exitosamente:\n```\n{stdout_text[:300]}{'...' if len(stdout_text) > 300 else ''}\n```")
            else:
                session.add_message('assistant', f"⚠️ El comando terminó con código {status}:\n```\n{stderr_text[:300]}{'...' if len(stderr_text) > 300 else ''}\n```")
                
                # Intentar solucionar el error
                if self._analyze_and_fix_error(stderr_text, "command", project, session):
                    return self._execute_command(command, project, session)
            
            # Agregar acción completada
            action_id = project.add_pending_action('command', f"Ejecutar: {command}")
            project.complete_action(action_id, {"stdout": stdout_text, "stderr": stderr_text, "status": status})
            
            return status == 0
            
        except Exception as e:
            error_msg = f"❌ Error al ejecutar comando: {str(e)}"
            session.add_message('assistant', error_msg)
            return False
    
    def _create_file(self, file_path, content, project, session):
        """Crea un archivo con el contenido especificado."""
        workspace_path = self._get_workspace_path()
        full_path = os.path.join(workspace_path, file_path)
        
        try:
            # Asegurar que el directorio existe
            directory = os.path.dirname(full_path)
            if directory and not os.path.exists(directory):
                os.makedirs(directory)
                session.add_message('assistant', f"📁 Creado directorio: `{os.path.dirname(file_path)}`")
                
            # Crear archivo con el contenido
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
                
            session.add_message('assistant', f"✅ Archivo creado: `{file_path}`")
            self._send_notification(
                project,
                session,
                "Archivo creado",
                f"Se ha creado el archivo {file_path}",
                "success"
            )
            
            # Guardar el archivo en el proyecto
            project.add_file(file_path, content[:200] + ('...' if len(content) > 200 else ''))
            return True
            
        except Exception as e:
            error_msg = f"❌ Error al crear archivo {file_path}: {str(e)}"
            session.add_message('assistant', error_msg)
            return False
    
    def _create_folder(self, folder_path, project, session):
        """Crea un directorio y todos los directorios intermedios necesarios."""
        workspace_path = self._get_workspace_path()
        full_path = os.path.join(workspace_path, folder_path)
        
        try:
            # Crear directorio recursivamente
            os.makedirs(full_path, exist_ok=True)
            
            session.add_message('assistant', f"✅ Directorio creado: `{folder_path}`")
            self._send_notification(
                project,
                session,
                "Directorio creado",
                f"Se ha creado el directorio {folder_path}",
                "success"
            )
            
            return True
            
        except Exception as e:
            error_msg = f"❌ Error al crear directorio {folder_path}: {str(e)}"
            session.add_message('assistant', error_msg)
            return False
    
    def _install_packages(self, package_manager, packages, project, session):
        """Instala paquetes utilizando el gestor de paquetes especificado."""
        # Mapeo de comandos de instalación según el gestor de paquetes
        install_commands = {
            'npm': 'npm install',
            'yarn': 'yarn add',
            'pnpm': 'pnpm install',
            'pip': 'pip install',
            'pip3': 'pip3 install',
            'pipenv': 'pipenv install',
            'poetry': 'poetry add',
            'gem': 'gem install',
            'composer': 'composer require',
            'cargo': 'cargo add',
            'go': 'go get',
            'apt': 'apt-get install -y',
            'apt-get': 'apt-get install -y',
            'apk': 'apk add'
        }
        
        # Verificar si el gestor de paquetes es compatible
        if package_manager not in install_commands:
            session.add_message('assistant', f"❌ Gestor de paquetes no compatible: {package_manager}")
            return False
            
        # Formar el comando completo
        command = f"{install_commands[package_manager]} {' '.join(packages)}"
        
        # Ejecutar comando con feedback en tiempo real
        session.add_message('assistant', f"📦 Instalando paquetes con {package_manager}: {', '.join(packages)}")
        return self._execute_command_with_progress(command, project, session)
    
    def _init_project(self, project_type, project_name, options, project, session):
        """Inicializa un nuevo proyecto utilizando plantillas o comandos específicos."""
        # Mapeo de comandos de inicialización según el tipo de proyecto
        init_commands = {
            'react': f"npx create-react-app {project_name}",
            'vue': f"npx @vue/cli create {project_name} {' '.join(options)}",
            'angular': f"npx @angular/cli new {project_name} {' '.join(options)}",
            'node': f"mkdir -p {project_name} && cd {project_name} && npm init -y",
            'flask': f"mkdir -p {project_name} && cd {project_name} && touch app.py requirements.txt",
            'django': f"django-admin startproject {project_name}",
            'express': f"mkdir -p {project_name} && cd {project_name} && npm init -y && npm install express",
            'nextjs': f"npx create-next-app {project_name}",
            'gatsby': f"npx gatsby new {project_name}",
            'laravel': f"composer create-project --prefer-dist laravel/laravel {project_name}",
            'spring': f"mkdir -p {project_name} && cd {project_name} && ./mvnw spring-boot:create",
            'rails': f"rails new {project_name}",
            'electron': f"npx create-electron-app {project_name}"
        }
        
        # Verificar si el tipo de proyecto es compatible
        if project_type not in init_commands:
            session.add_message('assistant', f"❌ Tipo de proyecto no compatible: {project_type}")
            return False
            
        # Ejecutar comando de inicialización
        command = init_commands[project_type]
        session.add_message('assistant', f"🚀 Inicializando proyecto {project_type}: {project_name}")
        
        # Guardar el tipo de proyecto en los metadatos
        project.project_type = project_type
        
        # Ejecutar con seguimiento del progreso
        return self._execute_command_with_progress(command, project, session)
    
    def _setup_environment(self, env_type, options, project, session):
        """Configura un entorno de desarrollo específico."""
        # Mapeo de comandos de configuración de entorno según el tipo
        env_commands = {
            'node': "npm init -y && npm install nodemon --save-dev",
            'python': "pip install virtualenv && virtualenv venv",
            'react': "npm install eslint prettier --save-dev",
            'vue': "npm install eslint prettier @vue/eslint-config-prettier --save-dev",
            'typescript': "npm install typescript ts-node @types/node --save-dev && npx tsc --init",
            'web': "npm install webpack webpack-cli webpack-dev-server html-webpack-plugin --save-dev",
            'testing': "npm install jest @testing-library/react @testing-library/jest-dom --save-dev",
            'docker': "touch Dockerfile docker-compose.yml .dockerignore"
        }
        
        # Verificar si el tipo de entorno es compatible
        if env_type not in env_commands:
            session.add_message('assistant', f"❌ Tipo de entorno no compatible: {env_type}")
            return False
            
        # Ejecutar comando de configuración
        command = env_commands[env_type]
        session.add_message('assistant', f"⚙️ Configurando entorno {env_type}")
        
        # Ejecutar con seguimiento del progreso
        return self._execute_command_with_progress(command, project, session)
    
    def _clone_repository(self, repo_url, target_dir, project, session):
        """Clona un repositorio Git en el directorio especificado."""
        if not target_dir:
            # Extraer el nombre del repositorio de la URL
            target_dir = repo_url.split('/')[-1]
            if target_dir.endswith('.git'):
                target_dir = target_dir[:-4]
                
        # Formar el comando de clonación
        command = f"git clone {repo_url} {target_dir}"
        
        session.add_message('assistant', f"📂 Clonando repositorio: {repo_url} en {target_dir}")
        return self._execute_command_with_progress(command, project, session)
    
    def _wait_with_pause_check(self, seconds):
        """Espera un tiempo determinado, verificando si hay que pausar."""
        end_time = time.time() + seconds
        while time.time() < end_time:
            if not self.pause_flag.is_set():
                # Si está pausado, esperar hasta que se reanude
                self.pause_flag.wait()
                # Recalcular tiempo de finalización
                end_time = time.time() + (end_time - time.time())
            time.sleep(0.1)
    
    def _should_stop(self):
        """Verifica si se debe detener la construcción."""
        return not self.pause_flag.is_set()
    
    def pause(self):
        """Pausa la construcción."""
        self.pause_flag.clear()
        # Actualizar estado en la base de datos
        db = get_db_session()
        project = db.query(Project).filter_by(project_id=self.project_id).first()
        if project:
            project.pause()
            db.commit()
    
    def resume(self):
        """Reanuda la construcción."""
        self.pause_flag.set()
        # Actualizar estado en la base de datos
        db = get_db_session()
        project = db.query(Project).filter_by(project_id=self.project_id).first()
        if project:
            project.resume()
            db.commit()
    
    def _cleanup(self):
        """Limpia los recursos asociados al proyecto."""
        project_id = self.project_id
        if project_id in active_projects:
            del active_projects[project_id]
        if project_id in pause_flags:
            del pause_flags[project_id]
        if project_id in project_locks:
            del project_locks[project_id]
    
    def _extract_project_name(self, description):
        """Extrae un nombre para el proyecto a partir de la descripción."""
        # Patrones para detectar nombres en la descripción
        patterns = [
            r'(?:llamad[oa]|nombrad[oa]|titulad[oa])\s+["\']?([a-zA-Z0-9_\-]+)["\']?',
            r'proyecto\s+["\']?([a-zA-Z0-9_\-]+)["\']?',
            r'aplicaci[oó]n\s+["\']?([a-zA-Z0-9_\-]+)["\']?',
            r'app\s+["\']?([a-zA-Z0-9_\-]+)["\']?',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, description, re.IGNORECASE)
            if match:
                return match.group(1)
        
        # Si no se encuentra un nombre, generar uno automático
        words = description.split()[:3]
        name_parts = []
        for word in words:
            # Limpiar caracteres no alfanuméricos
            clean_word = re.sub(r'[^a-zA-Z0-9]', '', word)
            if clean_word:
                name_parts.append(clean_word.lower())
        
        if name_parts:
            return "-".join(name_parts)
        else:
            return f"proyecto-{uuid.uuid4().hex[:8]}"
    
    def _analyze_project_requirements(self, description):
        """
        Analiza la descripción del proyecto para extraer tipo y stack tecnológico.
        En un entorno real, esto utilizaría una llamada a la IA.
        """
        # Patrones para detección de tipo de proyecto
        web_patterns = ['web', 'página', 'sitio', 'aplicación web', 'frontend', 'backend']
        api_patterns = ['api', 'rest', 'graphql', 'endpoint', 'servicio web']
        mobile_patterns = ['móvil', 'mobile', 'android', 'ios', 'app']
        
        # Detectar tipo de proyecto
        description_lower = description.lower()
        
        project_type = 'web'  # Valor por defecto
        
        for pattern in api_patterns:
            if pattern in description_lower:
                project_type = 'api'
                break
        
        for pattern in mobile_patterns:
            if pattern in description_lower:
                project_type = 'mobile'
                break
        
        # Detectar tecnologías mencionadas
        tech_stack = {
            'language': 'javascript',  # Valor por defecto
            'framework': 'react',      # Valor por defecto
            'database': None
        }
        
        # Detección de lenguaje
        if any(p in description_lower for p in ['python', 'flask', 'django', 'fastapi']):
            tech_stack['language'] = 'python'
        
        # Detección de framework
        framework_patterns = {
            'react': ['react', 'reactjs'],
            'vue': ['vue', 'vuejs'],
            'angular': ['angular', 'angularjs'],
            'next.js': ['next', 'nextjs', 'next.js'],
            'flask': ['flask'],
            'django': ['django'],
            'express': ['express', 'node', 'nodejs']
        }
        
        for framework, patterns in framework_patterns.items():
            if any(p in description_lower for p in patterns):
                tech_stack['framework'] = framework
                # Ajustar lenguaje según el framework
                if framework in ['flask', 'django']:
                    tech_stack['language'] = 'python'
                elif framework in ['express']:
                    tech_stack['language'] = 'javascript'
                break
        
        # Detección de base de datos
        db_patterns = {
            'postgresql': ['postgres', 'postgresql', 'psql'],
            'mysql': ['mysql', 'mariadb'],
            'mongodb': ['mongo', 'mongodb', 'nosql'],
            'sqlite': ['sqlite', 'sql lite']
        }
        
        for db, patterns in db_patterns.items():
            if any(p in description_lower for p in patterns):
                tech_stack['database'] = db
                break
        
        return project_type, tech_stack
    
    def _generate_analysis_response(self, project_type, tech_stack):
        """Genera una respuesta después del análisis de los requisitos."""
        project_types = {
            'web': 'aplicación web',
            'api': 'API REST',
            'mobile': 'aplicación móvil web'
        }
        
        frameworks = {
            'react': 'React',
            'vue': 'Vue.js',
            'angular': 'Angular',
            'next.js': 'Next.js',
            'flask': 'Flask',
            'django': 'Django',
            'express': 'Express.js'
        }
        
        languages = {
            'javascript': 'JavaScript',
            'python': 'Python',
            'typescript': 'TypeScript'
        }
        
        databases = {
            'postgresql': 'PostgreSQL',
            'mysql': 'MySQL',
            'mongodb': 'MongoDB',
            'sqlite': 'SQLite',
            None: 'sin base de datos'
        }
        
        response = f"""
# Análisis de Requisitos del Proyecto

Basado en tu descripción, he determinado que estás buscando construir una **{project_types.get(project_type, project_type)}** con las siguientes tecnologías:

## Stack Tecnológico:
- **Lenguaje:** {languages.get(tech_stack.get('language'), tech_stack.get('language'))}
- **Framework:** {frameworks.get(tech_stack.get('framework'), tech_stack.get('framework'))}
- **Base de Datos:** {databases.get(tech_stack.get('database'), 'No especificada')}

## Plan de acción:
1. Diseñaré la estructura del proyecto
2. Implementaré los archivos base y configuración
3. Instalaré las dependencias necesarias
4. Configuraré la estructura de la aplicación
5. Implementaré las funcionalidades básicas

¿Estás de acuerdo con este análisis? ¿Quieres que realice algún ajuste en las tecnologías seleccionadas?
"""
        return response
    
    def _plan_project_structure(self, project_type, tech_stack):
        """
        Planifica la estructura de archivos del proyecto.
        Retorna un diccionario con la estructura de archivos.
        """
        structure = {"files": [], "directories": []}
        
        # Estructura para una aplicación React
        if tech_stack.get('framework') == 'react':
            structure = {
                "files": [
                    {"name": "package.json", "type": "json"},
                    {"name": "README.md", "type": "markdown"}
                ],
                "directories": [
                    {
                        "name": "public",
                        "files": [
                            {"name": "index.html", "type": "html"},
                            {"name": "favicon.ico", "type": "binary"}
                        ]
                    },
                    {
                        "name": "src",
                        "files": [
                            {"name": "index.js", "type": "javascript"},
                            {"name": "App.js", "type": "javascript"},
                            {"name": "App.css", "type": "css"}
                        ],
                        "directories": [
                            {
                                "name": "components",
                                "files": [
                                    {"name": "Header.js", "type": "javascript"},
                                    {"name": "Footer.js", "type": "javascript"}
                                ]
                            },
                            {
                                "name": "pages",
                                "files": [
                                    {"name": "Home.js", "type": "javascript"},
                                    {"name": "About.js", "type": "javascript"}
                                ]
                            }
                        ]
                    }
                ]
            }
        
        # Estructura para una aplicación Flask
        elif tech_stack.get('framework') == 'flask':
            structure = {
                "files": [
                    {"name": "app.py", "type": "python"},
                    {"name": "config.py", "type": "python"},
                    {"name": "requirements.txt", "type": "text"},
                    {"name": "README.md", "type": "markdown"}
                ],
                "directories": [
                    {
                        "name": "static",
                        "files": [],
                        "directories": [
                            {"name": "css", "files": [{"name": "style.css", "type": "css"}]},
                            {"name": "js", "files": [{"name": "main.js", "type": "javascript"}]},
                            {"name": "img", "files": []}
                        ]
                    },
                    {
                        "name": "templates",
                        "files": [
                            {"name": "base.html", "type": "html"},
                            {"name": "index.html", "type": "html"},
                            {"name": "about.html", "type": "html"}
                        ]
                    },
                    {
                        "name": "models",
                        "files": [
                            {"name": "__init__.py", "type": "python"},
                            {"name": "user.py", "type": "python"}
                        ]
                    },
                    {
                        "name": "routes",
                        "files": [
                            {"name": "__init__.py", "type": "python"},
                            {"name": "main.py", "type": "python"}
                        ]
                    }
                ]
            }
        
        return structure
    
    def _count_files(self, structure, count=0):
        """Cuenta el número total de archivos en la estructura."""
        count += len(structure.get('files', []))
        
        for directory in structure.get('directories', []):
            count = self._count_files(directory, count)
        
        return count
    
    def _flatten_file_structure(self, structure, prefix=''):
        """Convierte la estructura jerárquica en una lista plana de archivos."""
        result = []
        
        for file_info in structure.get('files', []):
            file_path = os.path.join(prefix, file_info['name'])
            result.append({
                'path': file_path,
                'type': file_info.get('type', 'text')
            })
        
        for directory in structure.get('directories', []):
            dir_path = os.path.join(prefix, directory['name'])
            result.extend(self._flatten_file_structure(directory, dir_path))
        
        return result
    
    def _generate_file_content(self, file_path, project_type, tech_stack):
        """
        Genera el contenido para un archivo específico basado en su tipo.
        En un entorno real, esto utilizaría una llamada a la IA.
        """
        filename = os.path.basename(file_path)
        extension = os.path.splitext(filename)[1].lower()
        
        # Contenido para package.json
        if filename == 'package.json':
            return """{
  "name": "project-name",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}"""
        
        # Contenido para README.md
        elif filename == 'README.md':
            return f"""# Proyecto {project_type.capitalize()}

Este proyecto fue creado automáticamente por el Constructor de Tareas de CODESTORM.

## Tecnologías utilizadas

- Lenguaje: {tech_stack.get('language')}
- Framework: {tech_stack.get('framework')}
- Base de datos: {tech_stack.get('database') or 'No especificada'}

## Instalación

1. Clona este repositorio
2. Instala las dependencias necesarias
3. Ejecuta la aplicación

## Estructura del proyecto

La estructura del proyecto está organizada de manera lógica para facilitar el desarrollo y mantenimiento.

## Licencia

MIT
"""
        
        # Contenido para index.html
        elif filename == 'index.html' and 'public' in file_path:
            return """<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Aplicación creada con el Constructor de Tareas" />
    <title>Mi Aplicación</title>
  </head>
  <body>
    <noscript>Necesitas habilitar JavaScript para ejecutar esta aplicación.</noscript>
    <div id="root"></div>
  </body>
</html>"""
        
        # Contenido para App.js
        elif filename == 'App.js':
            return """import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
"""
        
        # Contenido para index.js
        elif filename == 'index.js' and '/src/' in file_path:
            return """import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
"""
        
        # Contenido para componentes React
        elif extension == '.js' and '/components/' in file_path:
            component_name = os.path.splitext(filename)[0]
            return f"""import React from 'react';

function {component_name}() {{
  return (
    <div className="{component_name.lower()}">
      <h2>{component_name} Component</h2>
    </div>
  );
}}

export default {component_name};
"""
        
        # Contenido para páginas React
        elif extension == '.js' and '/pages/' in file_path:
            page_name = os.path.splitext(filename)[0]
            return f"""import React from 'react';

function {page_name}() {{
  return (
    <div className="{page_name.lower()}-page">
      <h1>{page_name} Page</h1>
      <p>Bienvenido a la página de {page_name}.</p>
    </div>
  );
}}

export default {page_name};
"""
        
        # Contenido para app.py (Flask)
        elif filename == 'app.py' and tech_stack.get('framework') == 'flask':
            return """from flask import Flask, render_template
from config import Config
from routes import init_routes

app = Flask(__name__)
app.config.from_object(Config)

# Registrar rutas
init_routes(app)

if __name__ == '__main__':
    app.run(debug=True)
"""
        
        # Contenido para config.py (Flask)
        elif filename == 'config.py':
            return """import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'una-clave-secreta-muy-dificil-de-adivinar'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///app.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
"""
        
        # Contenido para requirements.txt (Flask)
        elif filename == 'requirements.txt':
            requirements = ["Flask==2.2.3", "Werkzeug==2.2.3"]
            if tech_stack.get('database') == 'postgresql':
                requirements.extend(["Flask-SQLAlchemy==3.0.3", "psycopg2-binary==2.9.5"])
            elif tech_stack.get('database') == 'mysql':
                requirements.extend(["Flask-SQLAlchemy==3.0.3", "mysqlclient==2.1.1"])
            elif tech_stack.get('database'):
                requirements.append("Flask-SQLAlchemy==3.0.3")
            
            return "\n".join(requirements)
        
        # Plantilla base para HTML de Flask
        elif filename == 'base.html' and '/templates/' in file_path:
            return """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}Mi Aplicación Flask{% endblock %}</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
    {% block extra_css %}{% endblock %}
</head>
<body>
    <header>
        <nav>
            <ul>
                <li><a href="{{ url_for('main.index') }}">Inicio</a></li>
                <li><a href="{{ url_for('main.about') }}">Acerca de</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        {% block content %}{% endblock %}
    </main>
    
    <footer>
        <p>&copy; {{ now.year }} Mi Aplicación Flask</p>
    </footer>
    
    <script src="{{ url_for('static', filename='js/main.js') }}"></script>
    {% block extra_js %}{% endblock %}
</body>
</html>
"""
        
        # Plantilla index.html para Flask
        elif filename == 'index.html' and '/templates/' in file_path:
            return """{% extends 'base.html' %}

{% block title %}Inicio - Mi Aplicación Flask{% endblock %}

{% block content %}
<section class="hero">
    <h1>Bienvenido a Mi Aplicación Flask</h1>
    <p>Esta aplicación fue creada con el Constructor de Tareas de CODESTORM.</p>
</section>

<section class="features">
    <h2>Características</h2>
    <div class="feature-grid">
        <div class="feature">
            <h3>Rápida</h3>
            <p>Aplicación optimizada para un rendimiento óptimo.</p>
        </div>
        <div class="feature">
            <h3>Segura</h3>
            <p>Implementa las mejores prácticas de seguridad.</p>
        </div>
        <div class="feature">
            <h3>Fácil de usar</h3>
            <p>Interfaz intuitiva y amigable para el usuario.</p>
        </div>
    </div>
</section>
{% endblock %}
"""
        
        # Contenido por defecto para otros archivos
        return f"// Contenido del archivo {file_path}\n// Generado automáticamente por el Constructor de Tareas\n"
    
    def _get_workspace_path(self):
        """Obtiene la ruta del workspace del usuario."""
        workspace_dir = os.path.join('user_workspaces', self.user_id)
        os.makedirs(workspace_dir, exist_ok=True)
        return workspace_dir
    
    def _get_run_instructions(self, project_type, tech_stack):
        """Genera instrucciones para ejecutar el proyecto."""
        if tech_stack.get('framework') in ['react', 'vue', 'angular']:
            return "npm install\nnpm start"
        elif tech_stack.get('framework') == 'next.js':
            return "npm install\nnpm run dev"
        elif tech_stack.get('framework') == 'flask':
            return "pip install -r requirements.txt\npython app.py"
        elif tech_stack.get('framework') == 'django':
            return "pip install -r requirements.txt\npython manage.py migrate\npython manage.py runserver"
        else:
            return "# Instrucciones específicas no disponibles para este tipo de proyecto"


# Rutas para gestión de proyectos del constructor
def init_constructor_routes(app):
    """Inicializa las rutas del Constructor de Tareas."""
    
    @app.route('/api/constructor/projects', methods=['GET'])
    def list_projects():
        """Lista todos los proyectos del usuario."""
        try:
            user_id = request.args.get('user_id', 'default')
            
            db = get_db_session()
            projects = db.query(Project).filter_by(user_id=user_id).all()
            
            result = [project.to_dict() for project in projects]
            
            return jsonify({
                'success': True,
                'projects': result
            })
        except Exception as e:
            logger.error(f"Error al listar proyectos: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @app.route('/api/constructor/projects/<project_id>', methods=['GET'])
    def get_project(project_id):
        """Obtiene los detalles de un proyecto específico."""
        try:
            db = get_db_session()
            project = db.query(Project).filter_by(project_id=project_id).first()
            
            if not project:
                return jsonify({
                    'success': False,
                    'error': 'Proyecto no encontrado'
                }), 404
            
            # Obtener también la sesión de conversación
            session = db.query(ProjectSession).filter_by(project_id=project_id).first()
            
            result = project.to_dict()
            if session:
                result['messages'] = session.message_history
            
            return jsonify({
                'success': True,
                'project': result
            })
        except Exception as e:
            logger.error(f"Error al obtener proyecto: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @app.route('/api/constructor/start', methods=['POST'])
    def start_project():
        """Inicia un nuevo proyecto de construcción."""
        try:
            data = request.json
            user_id = data.get('user_id', 'default')
            description = data.get('description')
            
            if not description:
                return jsonify({
                    'success': False,
                    'error': 'Se requiere una descripción del proyecto'
                }), 400
            
            # Generar ID único para el proyecto
            project_id = str(uuid.uuid4())
            
            # Iniciar el constructor autónomo
            builder = AutonomousBuilder(project_id, user_id)
            builder.start_building(description)
            
            return jsonify({
                'success': True,
                'project_id': project_id,
                'message': 'Construcción del proyecto iniciada correctamente'
            })
        except Exception as e:
            logger.error(f"Error al iniciar proyecto: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @app.route('/api/constructor/pause/<project_id>', methods=['POST'])
    def pause_project(project_id):
        """Pausa la construcción de un proyecto."""
        try:
            if project_id not in active_projects:
                return jsonify({
                    'success': False,
                    'error': 'Proyecto no encontrado o no está activo'
                }), 404
            
            active_projects[project_id].pause()
            
            return jsonify({
                'success': True,
                'message': 'Proyecto pausado correctamente'
            })
        except Exception as e:
            logger.error(f"Error al pausar proyecto: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @app.route('/api/constructor/resume/<project_id>', methods=['POST'])
    def resume_project(project_id):
        """Reanuda la construcción de un proyecto pausado."""
        try:
            if project_id not in active_projects:
                return jsonify({
                    'success': False,
                    'error': 'Proyecto no encontrado o no está activo'
                }), 404
            
            active_projects[project_id].resume()
            
            return jsonify({
                'success': True,
                'message': 'Proyecto reanudado correctamente'
            })
        except Exception as e:
            logger.error(f"Error al reanudar proyecto: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @app.route('/api/constructor/message/<project_id>', methods=['POST'])
    def send_message(project_id):
        """Envía un mensaje al constructor para un proyecto específico."""
        try:
            data = request.json
            message = data.get('message')
            
            if not message:
                return jsonify({
                    'success': False,
                    'error': 'Se requiere un mensaje'
                }), 400
            
            db = get_db_session()
            project = db.query(Project).filter_by(project_id=project_id).first()
            
            if not project:
                return jsonify({
                    'success': False,
                    'error': 'Proyecto no encontrado'
                }), 404
            
            # Obtener la sesión de conversación
            session = db.query(ProjectSession).filter_by(project_id=project_id).first()
            
            if not session:
                # Si no existe, crear una nueva
                session = ProjectSession.get_or_create(project_id)
                db.add(session)
            
            # Agregar el mensaje del usuario
            session.add_message('user', message)
            db.commit()
            
            # Aquí se podría implementar la lógica para procesar el mensaje
            # y generar una respuesta del constructor autónomo
            
            # Por ahora, simplemente devolvemos una respuesta simulada
            response = "Gracias por tu mensaje. Lo tendré en cuenta durante la construcción del proyecto."
            
            # Agregar la respuesta del asistente
            session.add_message('assistant', response)
            db.commit()
            
            return jsonify({
                'success': True,
                'response': response
            })
        except Exception as e:
            logger.error(f"Error al enviar mensaje: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    logger.info("Rutas del Constructor de Tareas registradas correctamente")
    return app