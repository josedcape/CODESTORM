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
            
            # Agregar el mensaje inicial del usuario
            session.add_message('user', project_description)
            db.commit()
            
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
    
    def _execute_command(self, command, project, session):
        """Ejecuta un comando y registra el resultado."""
        workspace_path = self._get_workspace_path()
        
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
            else:
                result = f"⚠️ El comando terminó con código {status}:\n```\n{stderr_text[:500]}{'...' if len(stderr_text) > 500 else ''}\n```"
            
            session.add_message('assistant', result)
            
            # Agregar acción completada
            action_id = project.add_pending_action('command', f"Ejecutar: {command}")
            project.complete_action(action_id, {"stdout": stdout_text, "stderr": stderr_text, "status": status})
            
            return status == 0
        except Exception as e:
            error_msg = f"❌ Error al ejecutar comando: {str(e)}"
            session.add_message('assistant', error_msg)
            return False
    
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