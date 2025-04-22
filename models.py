"""
Modelos de datos para la aplicación CODESTORM.
"""

import os
import json
import datetime
import uuid
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Project(Base):
    """Modelo para proyectos en el Constructor de Tareas."""
    __tablename__ = 'projects'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(String(64), default='default')
    project_id = Column(String(36), unique=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(128), nullable=False)
    description = Column(Text)
    project_type = Column(String(64))  # web, api, mobile, etc.
    tech_stack = Column(JSON)  # framework, language, database, etc.
    status = Column(String(32), default='active')  # active, paused, completed
    progress = Column(Integer, default=0)  # 0-100%
    phase = Column(String(32), default='initial')  # initial, analysis, planning, implementation, testing, refinement
    current_step = Column(Text)
    requirements = Column(JSON)
    generated_files = Column(JSON)
    pending_actions = Column(JSON)
    # Nuevos campos para soportar plan de desarrollo y agentes
    plan = Column(JSON)  # Plan de desarrollo con tareas
    current_task_index = Column(Integer, default=-1)  # Índice de la tarea actual
    current_agent = Column(String(32), default='architect')  # Agente actual (architect, developer, testing, fixing)
    structure = Column(JSON)  # Estructura de archivos planificada
    total_files = Column(Integer, default=0)  # Total de archivos a crear
    model = Column(String(32), default='openai')  # Modelo de IA utilizado
    error_count = Column(Integer, default=0)  # Contador de errores
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    def to_dict(self):
        """Convierte el modelo a un diccionario."""
        # Parsear el plan si existe y es un string JSON
        plan_data = None
        if self.plan:
            if isinstance(self.plan, str):
                try:
                    plan_data = json.loads(self.plan)
                except:
                    plan_data = None
            else:
                plan_data = self.plan
        
        # Parsear la estructura si existe y es un string JSON
        structure_data = None
        if self.structure:
            if isinstance(self.structure, str):
                try:
                    structure_data = json.loads(self.structure)
                except:
                    structure_data = None
            else:
                structure_data = self.structure
        
        return {
            'id': self.id,
            'project_id': self.project_id,
            'name': self.name,
            'description': self.description,
            'project_type': self.project_type,
            'tech_stack': self.tech_stack,
            'status': self.status,
            'progress': self.progress,
            'phase': self.phase,
            'current_step': self.current_step,
            'requirements': self.requirements,
            'generated_files': self.generated_files,
            'pending_actions': self.pending_actions,
            'plan': plan_data,
            'current_task_index': self.current_task_index,
            'current_agent': self.current_agent,
            'structure': structure_data,
            'total_files': self.total_files,
            'model': self.model,
            'error_count': self.error_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    @classmethod
    def create_project(cls, name, description, project_type=None, user_id='default', model='openai'):
        """Crea un nuevo proyecto."""
        project = cls(
            name=name,
            description=description,
            project_type=project_type,
            user_id=user_id,
            tech_stack={},
            requirements=[],
            generated_files=[],
            pending_actions=[],
            plan=None,
            current_task_index=-1,
            current_agent='architect',
            structure=None,
            total_files=0,
            model=model,
            error_count=0
        )
        return project
    
    def update_progress(self, progress):
        """Actualiza el progreso del proyecto."""
        self.progress = min(100, max(0, progress))
        self.updated_at = datetime.datetime.utcnow()
        return self.progress
    
    def update_phase(self, phase):
        """Actualiza la fase del proyecto."""
        valid_phases = ['initial', 'analysis', 'planning', 'implementation', 'testing', 'refinement', 'completed']
        if phase in valid_phases:
            self.phase = phase
            self.updated_at = datetime.datetime.utcnow()
        return self.phase
    
    def add_file(self, path, content_preview=None, file_type=None):
        """Agrega un archivo generado al proyecto."""
        if self.generated_files is None:
            self.generated_files = []
        
        # Comprobar si el archivo ya existe
        for file in self.generated_files:
            if file.get('path') == path:
                return False
        
        file_info = {
            'path': path,
            'file_type': file_type or path.split('.')[-1] if '.' in path else 'txt',
            'content_preview': content_preview[:200] + '...' if content_preview and len(content_preview) > 200 else content_preview,
            'created_at': datetime.datetime.utcnow().isoformat()
        }
        
        self.generated_files.append(file_info)
        self.updated_at = datetime.datetime.utcnow()
        return True
    
    def add_pending_action(self, action_type, description, details=None):
        """Agrega una acción pendiente al proyecto."""
        if self.pending_actions is None:
            self.pending_actions = []
        
        action = {
            'action_id': str(uuid.uuid4()),
            'type': action_type,
            'description': description,
            'details': details or {},
            'status': 'pending',
            'created_at': datetime.datetime.utcnow().isoformat()
        }
        
        self.pending_actions.append(action)
        self.updated_at = datetime.datetime.utcnow()
        return action['action_id']
    
    def complete_action(self, action_id, result=None):
        """Marca una acción como completada."""
        if not self.pending_actions:
            return False
        
        for action in self.pending_actions:
            if action.get('action_id') == action_id:
                action['status'] = 'completed'
                action['completed_at'] = datetime.datetime.utcnow().isoformat()
                if result:
                    action['result'] = result
                self.updated_at = datetime.datetime.utcnow()
                return True
        
        return False
    
    def pause(self):
        """Pausa el proyecto."""
        self.status = 'paused'
        self.updated_at = datetime.datetime.utcnow()
    
    def resume(self):
        """Reanuda el proyecto."""
        self.status = 'active'
        self.updated_at = datetime.datetime.utcnow()
    
    def complete(self):
        """Marca el proyecto como completado."""
        self.status = 'completed'
        self.progress = 100
        self.phase = 'completed'
        self.updated_at = datetime.datetime.utcnow()


class ProjectSession(Base):
    """Modelo para sesiones de conversación relacionadas con proyectos."""
    __tablename__ = 'project_sessions'
    
    id = Column(Integer, primary_key=True)
    project_id = Column(String(36), ForeignKey('projects.project_id'), nullable=False)
    user_id = Column(String(64), default='default')
    ai_model = Column(String(32), default='openai')
    message_history = Column(JSON)
    last_active = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    def to_dict(self):
        """Convierte el modelo a un diccionario."""
        return {
            'id': self.id,
            'project_id': self.project_id,
            'user_id': self.user_id,
            'ai_model': self.ai_model,
            'message_history': self.message_history,
            'last_active': self.last_active.isoformat() if self.last_active else None,
        }
    
    def add_message(self, role, content):
        """Agrega un mensaje al historial."""
        if self.message_history is None:
            self.message_history = []
        
        message = {
            'role': role,
            'content': content,
            'timestamp': datetime.datetime.utcnow().isoformat()
        }
        
        self.message_history.append(message)
        self.last_active = datetime.datetime.utcnow()
        return message
    
    def clear_history(self):
        """Limpia el historial de mensajes."""
        self.message_history = []
        self.last_active = datetime.datetime.utcnow()
    
    @classmethod
    def get_or_create(cls, project_id, user_id='default', ai_model='openai'):
        """Obtiene o crea una sesión para un proyecto."""
        # Nota: Esta implementación es un stub y deberá ser completada
        # cuando se integre con una base de datos real
        return cls(
            project_id=project_id,
            user_id=user_id,
            ai_model=ai_model,
            message_history=[]
        )