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
        this.notificationsContainer = document.getElementById('notificationsPanel');
        this.modelSelector = document.getElementById('modelSelector');
        this.currentModel = 'openai'; // Valor por defecto
        
        // Estado del constructor
        this.activeProjectId = null;
        this.projectPhase = 'initial';
        this.isBuilding = false;
        this.isPaused = false;
        this.updateInterval = null;
        this.notificationsCount = 0;
        this.lastNotificationId = 0;
        this.errorCount = 0;
        this.projectNotifications = [];
        this.consoleOutput = [];
        
        // Inicializar eventos
        this.initEvents();
        
        // Crear contenedor de notificaciones si no existe
        this.initNotificationsPanel();
        
        // Comprobar si hay un proyecto en progreso al cargar la página
        this.checkActiveProjects();
    }
    
    initNotificationsPanel() {
        // Si no existe el panel de notificaciones, crearlo
        if (!this.notificationsContainer) {
            const notificationsPanel = document.createElement('div');
            notificationsPanel.id = 'notificationsPanel';
            notificationsPanel.className = 'notifications-panel';
            notificationsPanel.innerHTML = `
                <div class="notifications-header">
                    <h5 class="mb-0">Notificaciones <span class="badge bg-primary" id="notificationsCount">0</span></h5>
                </div>
                <div class="notifications-body" id="notificationsList"></div>
            `;
            
            // Añadir al DOM después del chat
            const chatContainer = document.querySelector('.chat-messages');
            if (chatContainer) {
                chatContainer.parentNode.insertBefore(notificationsPanel, chatContainer.nextSibling);
            } else {
                document.body.appendChild(notificationsPanel);
            }
            
            this.notificationsContainer = notificationsPanel;
        }
    }
    
    initEvents() {
        // Botón para iniciar la construcción
        this.startButton.addEventListener('click', () => this.startProject());
        
        // Botón para pausar la construcción
        this.pauseButton.addEventListener('click', () => this.pauseProject());
        
        // Botón para reanudar la construcción
        this.resumeButton.addEventListener('click', () => this.resumeProject());
        
        // Botón para limpiar notificaciones
        const clearNotificationsBtn = document.getElementById('clearNotificationsBtn');
        if (clearNotificationsBtn) {
            clearNotificationsBtn.addEventListener('click', () => this.clearNotifications());
        }
        
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
     * Limpia todas las notificaciones.
     */
    clearNotifications() {
        const notificationsList = document.getElementById('notificationsList');
        if (notificationsList) {
            // Eliminar todas las notificaciones con animación
            const notifications = notificationsList.querySelectorAll('.notification');
            notifications.forEach(notification => {
                notification.classList.add('notification-closing');
            });
            
            // Después de la animación, eliminar los elementos
            setTimeout(() => {
                notificationsList.innerHTML = `
                    <div class="p-3 text-center text-muted">
                        No hay notificaciones aún
                    </div>
                `;
                
                // Reiniciar contadores
                this.notificationsCount = 0;
                const countBadge = document.getElementById('notificationsCount');
                if (countBadge) {
                    countBadge.textContent = '0';
                }
            }, 300);
        }
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
        
        // Comprobar si hay errores para actualizar el contador
        if (project.error_count && project.error_count !== this.errorCount) {
            this.errorCount = project.error_count;
            // Resaltar el contador de errores
            const errorBadge = document.createElement('span');
            errorBadge.className = 'badge bg-danger ms-2';
            errorBadge.textContent = `${this.errorCount} errores`;
            
            // Añadir al estado si no existe ya
            const existingBadge = this.projectStatus.querySelector('.badge');
            if (existingBadge) {
                existingBadge.textContent = `${this.errorCount} errores`;
            } else if (this.errorCount > 0) {
                this.projectStatus.appendChild(errorBadge);
            }
        }
        
        // Actualizar notificaciones si hay nuevas
        if (project.notifications && project.notifications.length > this.projectNotifications.length) {
            const newNotifications = project.notifications.slice(this.projectNotifications.length);
            newNotifications.forEach(notification => {
                this.addNotification(notification);
            });
            this.projectNotifications = [...project.notifications];
        }
        
        // Actualizar consola si hay nueva salida
        if (project.console_output && project.console_output.length > this.consoleOutput.length) {
            const newOutput = project.console_output.slice(this.consoleOutput.length);
            newOutput.forEach(line => {
                // Analizar la línea para detectar errores
                if (line.includes('Error:') || line.includes('Exception:')) {
                    this.addNotification({
                        title: 'Error detectado en consola',
                        message: line,
                        type: 'error',
                        timestamp: new Date().toISOString()
                    });
                }
            });
            this.consoleOutput = [...project.console_output];
        }
        
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
                    
                    // Si es un mensaje del sistema, también añadir como notificación
                    if (msg.role === 'system') {
                        // Extraer título del mensaje (primera línea)
                        const lines = msg.content.split('\n');
                        const title = lines[0].replace(/[*#]/g, '').trim();
                        const message = lines.slice(1).join('\n').trim();
                        
                        this.addNotification({
                            title: title || 'Notificación del sistema',
                            message: message || msg.content,
                            type: msg.content.includes('❌') ? 'error' : 
                                  msg.content.includes('⚠️') ? 'warning' : 
                                  msg.content.includes('✅') ? 'success' : 'info',
                            timestamp: new Date().toISOString()
                        });
                    }
                });
            }
        }
    }
    
    /**
     * Añade una notificación al panel de notificaciones.
     */
    addNotification(notification) {
        // Incrementar contador
        this.lastNotificationId++;
        this.notificationsCount++;
        
        // Actualizar el contador en la UI
        const countBadge = document.getElementById('notificationsCount');
        if (countBadge) {
            countBadge.textContent = this.notificationsCount;
        }
        
        // Crear elemento de notificación
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification notification-${notification.type}`;
        notificationElement.dataset.id = this.lastNotificationId;
        
        // Formatear la fecha
        const timestamp = new Date(notification.timestamp);
        const formattedTime = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Iconos según el tipo
        const icons = {
            'info': 'info',
            'success': 'check-circle',
            'warning': 'alert-triangle',
            'error': 'alert-octagon'
        };
        
        const icon = icons[notification.type] || 'bell';
        
        // Crear contenido HTML
        notificationElement.innerHTML = `
            <div class="notification-header">
                <span class="notification-icon"><i data-feather="${icon}"></i></span>
                <span class="notification-title">${notification.title}</span>
                <span class="notification-time">${formattedTime}</span>
                <button class="notification-close" title="Descartar"><i data-feather="x"></i></button>
            </div>
            <div class="notification-body">
                <p>${notification.message}</p>
            </div>
        `;
        
        // Añadir al contenedor
        const notificationsList = document.getElementById('notificationsList');
        if (notificationsList) {
            notificationsList.appendChild(notificationElement);
            
            // Inicializar iconos
            feather.replace();
            
            // Configurar botón de cierre
            const closeBtn = notificationElement.querySelector('.notification-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    notificationElement.classList.add('notification-closing');
                    setTimeout(() => {
                        notificationElement.remove();
                        this.notificationsCount--;
                        if (countBadge) {
                            countBadge.textContent = this.notificationsCount;
                        }
                    }, 300);
                });
            }
            
            // Hacer scroll al final
            notificationsList.scrollTop = notificationsList.scrollHeight;
        }
        
        // Para notificaciones de error, mostrar también en el chat
        if (notification.type === 'error' && !this.chatMessages.querySelector(`[data-notification-id="${this.lastNotificationId}"]`)) {
            this.showSystemMessage(`❌ ${notification.title}: ${notification.message}`, this.lastNotificationId);
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
    showSystemMessage(message, notificationId = null) {
        const systemMessageElement = document.createElement('div');
        systemMessageElement.className = 'system-message';
        
        // Si viene de una notificación, añadir atributo para evitar duplicados
        if (notificationId) {
            systemMessageElement.dataset.notificationId = notificationId;
        }
        
        // Procesar el mensaje por si contiene Markdown
        if (message.includes('**') || message.includes('#') || message.includes('```')) {
            systemMessageElement.innerHTML = this.processMarkdown(message);
        } else {
            systemMessageElement.textContent = message;
        }
        
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