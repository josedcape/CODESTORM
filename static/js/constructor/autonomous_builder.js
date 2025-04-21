/**
 * Controlador para el Constructor de Tareas Autónomo
 * Este script maneja la creación y monitorización de proyectos
 * que se construyen de forma autónoma a partir de una descripción.
 */

class AutonomousProjectBuilder {
    constructor() {
        // Referencias a elementos de la UI
        this.projectDescription = document.getElementById('projectDescription');
        this.startButton = document.getElementById('startBuildButton');
        this.pauseButton = document.getElementById('pauseBuildButton');
        this.resumeButton = document.getElementById('resumeBuildButton');
        this.projectStatus = document.getElementById('projectStatus');
        this.progressBar = document.getElementById('buildProgress');
        this.chatMessages = document.getElementById('chatMessages');
        this.modelSelector = document.getElementById('modelSelector');
        this.currentModel = 'openai'; // Valor por defecto
        
        // Estado del constructor
        this.activeProjectId = null;
        this.projectPhase = 'initial';
        this.isBuilding = false;
        this.isPaused = false;
        this.updateInterval = null;
        
        // Inicializar eventos
        this.initEvents();
        
        // Comprobar si hay un proyecto en progreso al cargar la página
        this.checkActiveProjects();
    }
    
    initEvents() {
        // Botón para iniciar la construcción
        this.startButton.addEventListener('click', () => this.startProject());
        
        // Botón para pausar la construcción
        this.pauseButton.addEventListener('click', () => this.pauseProject());
        
        // Botón para reanudar la construcción
        this.resumeButton.addEventListener('click', () => this.resumeProject());
        
        // Selector de modelo
        const modelOptions = document.querySelectorAll('.model-option');
        modelOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentModel = option.getAttribute('data-model');
                document.getElementById('currentModel').textContent = option.textContent;
                this.showSystemMessage(`Modelo cambiado a ${option.textContent}`);
                
                // Eliminar el mensaje después de 2 segundos
                setTimeout(() => {
                    const systemMessages = document.querySelectorAll('.system-message');
                    systemMessages.forEach(message => {
                        if (message.textContent.includes('Modelo cambiado')) {
                            message.remove();
                        }
                    });
                }, 2000);
            });
        });
    }
    
    /**
     * Inicia un nuevo proyecto de construcción.
     */
    startProject() {
        const description = this.projectDescription.value.trim();
        
        if (!description) {
            this.showSystemMessage('❌ Por favor, proporciona una descripción para tu proyecto.');
            return;
        }
        
        if (this.isBuilding) {
            this.showSystemMessage('❌ Ya hay un proyecto en construcción. Debes esperar a que termine o crear uno nuevo.');
            return;
        }
        
        // Mostrar indicador de carga
        this.isBuilding = true;
        this.startButton.disabled = true;
        this.pauseButton.disabled = false;
        this.resumeButton.disabled = true;
        this.showSystemMessage('⏳ Iniciando construcción del proyecto...');
        
        // Inicializar o reiniciar la UI
        this.resetUI();
        
        // Enviar la petición al servidor
        fetch('/api/constructor/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: description,
                model: this.currentModel
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Guardar el ID del proyecto activo
                this.activeProjectId = data.project_id;
                
                // Actualizar la UI
                this.projectStatus.textContent = 'Estado: Construcción iniciada';
                this.progressBar.style.width = '5%';
                this.progressBar.textContent = '5%';
                
                // Agregar el mensaje del usuario al chat
                this.addMessage(description, 'user');
                
                // Comenzar a monitorizar el progreso
                this.startProgressMonitoring();
                
                // Mostrar mensaje de éxito
                this.showSystemMessage('✅ La construcción del proyecto ha comenzado. Se irá mostrando el progreso automáticamente.');
            } else {
                // Mostrar error
                this.isBuilding = false;
                this.startButton.disabled = false;
                this.pauseButton.disabled = true;
                this.showSystemMessage(`❌ Error: ${data.error || 'No se pudo iniciar la construcción'}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.isBuilding = false;
            this.startButton.disabled = false;
            this.pauseButton.disabled = true;
            this.showSystemMessage('❌ Error de conexión. Por favor, intenta de nuevo.');
        });
    }
    
    /**
     * Pausa la construcción del proyecto activo.
     */
    pauseProject() {
        if (!this.activeProjectId || !this.isBuilding) {
            return;
        }
        
        fetch(`/api/constructor/pause/${this.activeProjectId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.isPaused = true;
                this.pauseButton.disabled = true;
                this.resumeButton.disabled = false;
                this.projectStatus.textContent = 'Estado: Pausado';
                this.showSystemMessage('⏸️ Construcción pausada. Puedes reanudarla cuando quieras.');
            } else {
                this.showSystemMessage(`❌ Error: ${data.error || 'No se pudo pausar la construcción'}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.showSystemMessage('❌ Error de conexión al intentar pausar.');
        });
    }
    
    /**
     * Reanuda la construcción de un proyecto pausado.
     */
    resumeProject() {
        if (!this.activeProjectId || !this.isBuilding || !this.isPaused) {
            return;
        }
        
        fetch(`/api/constructor/resume/${this.activeProjectId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.isPaused = false;
                this.pauseButton.disabled = false;
                this.resumeButton.disabled = true;
                this.projectStatus.textContent = 'Estado: En construcción';
                this.showSystemMessage('▶️ Construcción reanudada. Continuando con el proceso...');
            } else {
                this.showSystemMessage(`❌ Error: ${data.error || 'No se pudo reanudar la construcción'}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.showSystemMessage('❌ Error de conexión al intentar reanudar.');
        });
    }
    
    /**
     * Comienza la monitorización periódica del progreso del proyecto.
     */
    startProgressMonitoring() {
        // Limpiar cualquier intervalo existente
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Consultar inmediatamente el estado
        this.fetchProjectStatus();
        
        // Configurar intervalo de actualización (cada 3 segundos)
        this.updateInterval = setInterval(() => {
            this.fetchProjectStatus();
        }, 3000);
    }
    
    /**
     * Consulta el estado actual del proyecto activo.
     */
    fetchProjectStatus() {
        if (!this.activeProjectId) {
            return;
        }
        
        fetch(`/api/constructor/projects/${this.activeProjectId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const project = data.project;
                    
                    // Actualizar la UI con el progreso
                    this.updateProjectUI(project);
                    
                    // Si el proyecto se ha completado o ha fallado, detener la monitorización
                    if (['completed', 'error'].includes(project.status)) {
                        this.stopProgressMonitoring();
                        this.isBuilding = false;
                        this.startButton.disabled = false;
                        this.pauseButton.disabled = true;
                        this.resumeButton.disabled = true;
                    }
                } else {
                    console.error('Error al obtener estado del proyecto:', data.error);
                }
            })
            .catch(error => {
                console.error('Error de conexión:', error);
            });
    }
    
    /**
     * Actualiza la UI con la información del proyecto.
     */
    updateProjectUI(project) {
        // Actualizar barra de progreso
        this.progressBar.style.width = `${project.progress}%`;
        this.progressBar.textContent = `${project.progress}%`;
        
        // Actualizar estado
        const phases = {
            'initial': 'Iniciando',
            'analysis': 'Analizando requisitos',
            'planning': 'Planificando estructura',
            'implementation': 'Implementando',
            'testing': 'Verificando',
            'refinement': 'Refinando',
            'completed': 'Completado'
        };
        
        const statusText = phases[project.phase] || project.phase;
        this.projectStatus.textContent = `Estado: ${statusText} (${project.progress}%)`;
        
        // Actualizar mensajes si hay nuevos
        if (project.messages) {
            // Obtener mensajes actuales en la UI
            const currentMessages = document.querySelectorAll('.chat-message');
            const currentCount = currentMessages.length;
            
            // Si hay más mensajes en el servidor que en la UI, añadir los nuevos
            if (project.messages.length > currentCount) {
                const newMessages = project.messages.slice(currentCount);
                newMessages.forEach(msg => {
                    this.addMessage(msg.content, msg.role);
                });
            }
        }
    }
    
    /**
     * Detiene la monitorización periódica.
     */
    stopProgressMonitoring() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    /**
     * Comprueba si hay algún proyecto activo al cargar la página.
     */
    checkActiveProjects() {
        fetch('/api/constructor/projects')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.projects && data.projects.length > 0) {
                    // Buscar proyectos en estado activo o pausado
                    const activeProjects = data.projects.filter(p => 
                        p.status === 'active' || p.status === 'paused');
                    
                    if (activeProjects.length > 0) {
                        // Tomar el proyecto más reciente
                        const project = activeProjects[0];
                        
                        // Preguntar al usuario si desea continuar con este proyecto
                        if (confirm(`Se ha encontrado un proyecto en construcción: "${project.name}". ¿Deseas continuar su construcción?`)) {
                            // Restaurar el estado
                            this.activeProjectId = project.project_id;
                            this.isBuilding = true;
                            this.isPaused = project.status === 'paused';
                            
                            // Actualizar la UI
                            this.updateProjectUI(project);
                            
                            // Habilitar/deshabilitar botones según el estado
                            this.startButton.disabled = true;
                            this.pauseButton.disabled = this.isPaused;
                            this.resumeButton.disabled = !this.isPaused;
                            
                            // Comenzar monitorización
                            this.startProgressMonitoring();
                            
                            this.showSystemMessage('✅ Proyecto restaurado correctamente. Continuando con la construcción...');
                        }
                    }
                }
            })
            .catch(error => {
                console.error('Error al comprobar proyectos activos:', error);
            });
    }
    
    /**
     * Reinicia la UI para un nuevo proyecto.
     */
    resetUI() {
        // Limpiar mensajes anteriores
        this.chatMessages.innerHTML = '';
        
        // Reiniciar barra de progreso
        this.progressBar.style.width = '0%';
        this.progressBar.textContent = '0%';
        
        // Reiniciar estado
        this.projectStatus.textContent = 'Estado: Iniciando...';
    }
    
    /**
     * Muestra un mensaje de sistema.
     */
    showSystemMessage(message) {
        const systemMessageElement = document.createElement('div');
        systemMessageElement.className = 'system-message';
        systemMessageElement.textContent = message;
        
        this.chatMessages.appendChild(systemMessageElement);
        this.scrollToBottom();
    }
    
    /**
     * Añade un mensaje al chat.
     */
    addMessage(content, role) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${role}-message`;
        
        // Configurar avatar e información de remitente
        const senderInfo = (role === 'user') 
            ? 'Tú'
            : 'Constructor Autónomo';
        
        // Crear contenido HTML del mensaje
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="sender-name">${senderInfo}</span>
                <span class="message-time">${this.formatTime(new Date())}</span>
            </div>
            <div class="message-content"></div>
            ${role === 'assistant' ? '<div class="message-actions"><button class="copy-btn" title="Copiar al portapapeles"><i data-feather="copy"></i></button></div>' : ''}
        `;
        
        // Procesar el contenido Markdown para el asistente
        if (role === 'assistant') {
            const processedContent = this.processMarkdown(content);
            messageElement.querySelector('.message-content').innerHTML = processedContent;
        } else {
            messageElement.querySelector('.message-content').textContent = content;
        }
        
        // Añadir el mensaje al contenedor
        this.chatMessages.appendChild(messageElement);
        
        // Inicializar iconos de Feather
        feather.replace();
        
        // Inicializar resaltado de código
        if (role === 'assistant') {
            hljs.highlightAll();
        }
        
        // Configurar botón de copia
        if (role === 'assistant') {
            const copyBtn = messageElement.querySelector('.copy-btn');
            copyBtn.addEventListener('click', () => {
                this.copyToClipboard(content);
                
                // Cambiar el icono temporalmente para indicar éxito
                const icon = copyBtn.querySelector('i');
                icon.setAttribute('data-feather', 'check');
                feather.replace();
                
                // Restaurar después de 2 segundos
                setTimeout(() => {
                    icon.setAttribute('data-feather', 'copy');
                    feather.replace();
                }, 2000);
            });
        }
        
        // Hacer scroll al final de la conversación
        this.scrollToBottom();
    }
    
    /**
     * Procesa contenido Markdown y protege código.
     */
    processMarkdown(content) {
        // Reemplazo para bloques de código para mantener el formato correcto
        content = content.replace(/```(\w+)?\s*\n([\s\S]*?)```/g, function(match, language, code) {
            language = language || 'plaintext';
            return `<pre><code class="hljs language-${language}">${this.escapeHtml(code.trim())}</code></pre>`;
        });
        
        // Procesar el resto con marked
        return marked.parse(content);
    }
    
    /**
     * Copia texto al portapapeles.
     */
    copyToClipboard(text) {
        // Crear un elemento temporal para copiar
        const tempElement = document.createElement('textarea');
        tempElement.value = text;
        tempElement.setAttribute('readonly', '');
        tempElement.style.position = 'absolute';
        tempElement.style.left = '-9999px';
        document.body.appendChild(tempElement);
        
        // Seleccionar y copiar
        tempElement.select();
        document.execCommand('copy');
        
        // Limpiar
        document.body.removeChild(tempElement);
    }
    
    /**
     * Hace scroll al final de la conversación.
     */
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    /**
     * Formatea la hora.
     */
    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    /**
     * Escapa HTML para evitar XSS.
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicializar el constructor al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    new AutonomousProjectBuilder();
});