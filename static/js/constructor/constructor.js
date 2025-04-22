document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const chatMessages = document.getElementById('chatMessages');
    const clearChatBtn = document.getElementById('clearChatBtn');
    const modelDropdownItems = document.querySelectorAll('.model-option');
    const currentModelSpan = document.getElementById('currentModel');
    
    // Variables de estado
    let messageHistory = [];
    let currentModel = 'openai';
    let conversationState = {
        taskPhase: 'initial',
        currentTask: null,
        projectType: null,
        projectRequirements: [],
        generatedFiles: [],
        pendingActions: [],
        implementationProgress: 0
    };
    
    // Configuración inicial
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', clearChat);
    }
    
    // Configurar selector de modelo
    modelDropdownItems.forEach(item => {
        item.addEventListener('click', changeModel);
    });
    
    // Solicitar permisos de notificación
    if ('Notification' in window) {
        Notification.requestPermission();
    }
    
    // Inicializar iconos
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Configurar envío de mensajes
    if (chatForm) {
        chatForm.addEventListener('submit', handleSubmit);
    }
    
    // Función para manejar el envío de mensajes
    function handleSubmit(e) {
        e.preventDefault();
        
        const message = userInput.value.trim();
        if (!message) return;
        
        // Limpiar campo de entrada
        userInput.value = '';
        
        // Mostrar mensaje del usuario
        addMessage(message, 'user');
        
        // Almacenar mensaje en historial
        messageHistory.push({
            role: 'user',
            content: message
        });
        
        // Deshabilitar botón mientras se procesa
        sendMessageBtn.disabled = true;
        sendMessageBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';
        
        // Enviar mensaje al servidor
        sendMessageToServer(message);
    }
    
    // Función para enviar mensaje al servidor
    function sendMessageToServer(message) {
        // Obtener el ID del proyecto desde la URL
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('project_id');
        
        // Configurar datos para la petición
        const requestData = {
            message: message,
            model: currentModel,
            conversation_state: conversationState
        };
        
        // Si hay un ID de proyecto, incluirlo en la petición
        if (projectId) {
            requestData.project_id = projectId;
        }
        
        // Enviar petición al servidor
        fetch('/api/constructor/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            // Añadir respuesta del asistente
            if (data.response) {
                addMessage(data.response, 'assistant');
                
                // Almacenar mensaje en historial
                messageHistory.push({
                    role: 'assistant',
                    content: data.response
                });
            }
            
            // Actualizar estado de la conversación
            if (data.conversation_state) {
                conversationState = {
                    ...conversationState,
                    ...data.conversation_state
                };
            }
            
            // Procesar acciones especiales
            if (data.special_actions && Array.isArray(data.special_actions)) {
                handleSpecialActions(data.special_actions);
            }
            
            // Habilitar nuevamente el botón de envío
            sendMessageBtn.disabled = false;
            sendMessageBtn.innerHTML = '<i data-feather="send"></i>';
            feather.replace();
        })
        .catch(error => {
            console.error('Error al enviar mensaje:', error);
            addSystemMessage('❌ Error de conexión. Intenta nuevamente.');
            
            // Habilitar nuevamente el botón de envío
            sendMessageBtn.disabled = false;
            sendMessageBtn.innerHTML = '<i data-feather="send"></i>';
            feather.replace();
        });
    }
    
    // Función para manejar acciones especiales
    function handleSpecialActions(actions) {
        actions.forEach(action => {
            switch (action.type) {
                case 'create_file':
                    notifyFileCreation(action.path, action.content);
                    break;
                case 'execute_command':
                    notifyCommandExecution(action.command, action.result);
                    break;
                case 'update_progress':
                    updateImplementationProgress(action.progress);
                    break;
                case 'suggest_next_step':
                    highlightNextStep(action.step);
                    break;
                case 'show_development_plan':
                    showDevelopmentPlan(action.plan);
                    break;
                case 'project_approval_required':
                    showApprovalRequest(action.plan);
                    break;
                case 'show_results':
                    showResults();
                    break;
            }
        });
    }
    
    // Función para mostrar el plan de desarrollo recibido del servidor
    function showDevelopmentPlan(plan) {
        // Mostrar el panel del plan de desarrollo
        const developmentPlanPanel = document.getElementById('developmentPlan');
        if (developmentPlanPanel) {
            developmentPlanPanel.classList.remove('d-none');
            
            // Obtener la lista de tareas
            const taskChecklist = document.getElementById('taskChecklist');
            if (taskChecklist) {
                taskChecklist.innerHTML = ''; // Limpiar contenido anterior
                
                // Si plan es un objeto con estructura definida
                if (typeof plan === 'object' && plan.tasks) {
                    // Formatear tareas desde el objeto
                    plan.tasks.forEach((task, index) => {
                        const taskItem = createTaskItem(task, index);
                        taskChecklist.appendChild(taskItem);
                    });
                } 
                // Si plan es texto (probablemente Markdown)
                else if (typeof plan === 'string') {
                    // Crear un elemento para mostrar el plan en formato Markdown
                    const planContent = document.createElement('div');
                    planContent.className = 'plan-content p-3';
                    planContent.innerHTML = processMarkdown(plan);
                    taskChecklist.appendChild(planContent);
                }
            }
        }
    }
    
    // Función para mostrar la solicitud de aprobación del plan
    function showApprovalRequest(plan) {
        // Modal debe existir en el HTML
        const approvalModalElement = document.getElementById('approvalModal');
        
        // Si no existe el modal, mostrar error y salir
        if (!approvalModalElement) {
            console.error('Error: No se encuentra el modal #approvalModal en el HTML');
            addSystemMessage('❌ Error al mostrar el plan de desarrollo. Por favor, recarga la página.');
            return;
        }
        
        // Actualizar el contenido del plan en el modal
        const planContent = document.getElementById('planContent');
        if (planContent) {
            console.log('Actualizando contenido del plan en el modal');
            planContent.innerHTML = typeof plan === 'string' ? 
                processMarkdown(plan) : 
                JSON.stringify(plan, null, 2);
        }
        
        console.log('Mostrando modal de aprobación con plan:', plan);
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(approvalModalElement);
        modal.show();
        
        // Actualizar íconos
        feather.replace();
    }
    
    // Función para crear un elemento de tarea para el plan de desarrollo
    function createTaskItem(task, index) {
        const taskItem = document.createElement('li');
        taskItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        taskItem.innerHTML = `
            <div>
                <div class="d-flex align-items-center">
                    <span class="task-number me-2">${index + 1}.</span>
                    <span class="task-title fw-bold">${task.title || 'Tarea sin título'}</span>
                </div>
                <div class="task-description text-muted small">${task.description || ''}</div>
                <div class="task-time small">
                    <i data-feather="clock" class="feather-sm"></i>
                    ${task.estimated_time || 'Tiempo no especificado'}
                </div>
            </div>
            <div class="task-status">
                <span class="badge bg-secondary rounded-pill">Pendiente</span>
            </div>
        `;
        return taskItem;
    }
    
    // Función para notificar la creación de archivos
    function notifyFileCreation(path, content) {
        const fileNotification = document.createElement('div');
        fileNotification.className = 'file-notification';
        fileNotification.innerHTML = `
            <div class="file-notification-header">
                <i data-feather="file-plus"></i>
                <span>Archivo creado: ${path}</span>
            </div>
            <pre><code class="language-${getLanguageFromPath(path)}">${content}</code></pre>
        `;
        
        chatMessages.appendChild(fileNotification);
        feather.replace();
        hljs.highlightAll();
        
        // Añadir a la lista de archivos generados
        conversationState.generatedFiles.push({
            path: path,
            timestamp: new Date().toISOString()
        });
    }
    
    // Función para notificar la ejecución de comandos
    function notifyCommandExecution(command, result) {
        const commandNotification = document.createElement('div');
        commandNotification.className = 'command-notification';
        commandNotification.innerHTML = `
            <div class="command-notification-header">
                <i data-feather="terminal"></i>
                <span>Ejecutado: ${command}</span>
            </div>
            <pre><code class="language-shell">${result}</code></pre>
        `;
        
        chatMessages.appendChild(commandNotification);
        feather.replace();
        hljs.highlightAll();
    }
    
    // Función para actualizar el progreso de implementación
    function updateImplementationProgress(progress) {
        conversationState.implementationProgress = progress;
        
        // Si no existe, crear el indicador de progreso
        let progressElement = document.getElementById('implementationProgress');
        if (!progressElement) {
            const progressContainer = document.createElement('div');
            progressContainer.className = 'progress-container';
            progressContainer.innerHTML = `
                <h5>Progreso del proyecto</h5>
                <div class="progress">
                    <div id="implementationProgress" class="progress-bar progress-bar-striped progress-bar-animated" 
                        role="progressbar" style="width: ${progress}%;" 
                        aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
                        ${progress}%
                    </div>
                </div>
            `;
            
            // Insertar después de la bienvenida o al final de los mensajes
            const welcomeElement = document.querySelector('.chat-welcome');
            if (welcomeElement) {
                welcomeElement.after(progressContainer);
            } else {
                chatMessages.appendChild(progressContainer);
            }
        } else {
            // Actualizar el progreso existente
            progressElement.style.width = `${progress}%`;
            progressElement.setAttribute('aria-valuenow', progress);
            progressElement.textContent = `${progress}%`;
            
            // Si el progreso llegó al 100%, mostrar resultados
            if (progress >= 100) {
                showResults();
            }
        }
    }
    
    // Función para mostrar los resultados finales del proyecto
    function showResults() {
        console.log("Mostrando resultados finales del proyecto");
        
        // Crear un contenedor para los resultados
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'results-container';
        
        // Contenido del resultado final
        resultsContainer.innerHTML = `
            <div class="results-header">
                <div class="d-flex align-items-center mb-2">
                    <i data-feather="award" class="text-warning me-2" style="width: 28px; height: 28px;"></i>
                    <h3 class="m-0">Resultado Final</h3>
                </div>
                <p class="text-success fw-bold">✓ Proyecto completado exitosamente</p>
            </div>
            <div class="results-content">
                <p>El Constructor ha finalizado la creación de tu aplicación. Puedes revisar los archivos generados en el explorador de archivos.</p>
                <p>Para ejecutar o modificar tu aplicación, puedes usar el chat principal o el explorador de archivos.</p>
            </div>
            <div class="mt-3 text-center">
                <a href="/files" class="btn btn-primary">
                    <i data-feather="folder" class="feather-sm me-1"></i>
                    Ver Archivos
                </a>
            </div>
        `;
        
        // Añadir al chat
        chatMessages.appendChild(resultsContainer);
        
        // Inicializar iconos
        feather.replace();
        
        // Scroll al final del chat
        scrollToBottom();
        
        // Notificar al usuario sobre la finalización
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Proyecto Completado', {
                body: 'La construcción de tu aplicación ha finalizado exitosamente.',
                icon: '/static/img/logo.png'
            });
        }
    }
    
    // Función para resaltar el siguiente paso
    function highlightNextStep(step) {
        const nextStepNotification = document.createElement('div');
        nextStepNotification.className = 'next-step-notification';
        nextStepNotification.innerHTML = `
            <div class="next-step-header">
                <i data-feather="arrow-right-circle"></i>
                <span>Siguiente paso:</span>
            </div>
            <div class="next-step-content">${step}</div>
        `;
        
        chatMessages.appendChild(nextStepNotification);
        feather.replace();
        
        // Añadir a la lista de acciones pendientes
        conversationState.pendingActions.push({
            description: step,
            timestamp: new Date().toISOString()
        });
    }
    
    // Función para añadir mensajes a la interfaz
    function addMessage(content, role) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${role}-message`;
        
        // Configurar avatar e información de remitente
        const senderInfo = (role === 'user') 
            ? 'Tú'
            : 'Constructor de Tareas';
        
        // Crear contenido HTML del mensaje
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="sender-name">${senderInfo}</span>
                <span class="message-time">${formatTime(new Date())}</span>
            </div>
            <div class="message-content"></div>
            ${role === 'assistant' ? '<div class="message-actions"><button class="copy-btn" title="Copiar al portapapeles"><i data-feather="copy"></i></button></div>' : ''}
        `;
        
        // Procesar el contenido Markdown
        if (role === 'assistant') {
            const processedContent = processMarkdown(content);
            messageElement.querySelector('.message-content').innerHTML = processedContent;
        } else {
            messageElement.querySelector('.message-content').textContent = content;
        }
        
        // Añadir el mensaje al contenedor
        chatMessages.appendChild(messageElement);
        
        // Inicializar iconos de Feather
        feather.replace();
        
        // Inicializar resaltado de código
        if (role === 'assistant') {
            hljs.highlightAll();
        }
        
        // Configurar botón de copia
        if (role === 'assistant') {
            const copyBtn = messageElement.querySelector('.copy-btn');
            copyBtn.addEventListener('click', function() {
                copyToClipboard(content);
                
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
        scrollToBottom();
    }
    
    // Función para añadir mensajes de sistema
    function addSystemMessage(message) {
        const systemMessageElement = document.createElement('div');
        systemMessageElement.className = 'system-message';
        systemMessageElement.textContent = message;
        
        chatMessages.appendChild(systemMessageElement);
        scrollToBottom();
    }
    
    // Función para eliminar mensajes de sistema
    function removeSystemMessages() {
        const systemMessages = document.querySelectorAll('.system-message');
        systemMessages.forEach(message => {
            message.remove();
        });
    }
    
    // Función para cambiar el modelo de IA
    function changeModel(e) {
        e.preventDefault();
        
        const selectedModel = this.getAttribute('data-model');
        currentModel = selectedModel;
        currentModelSpan.textContent = this.textContent;
        
        // Notificar al usuario
        addSystemMessage(`Modelo cambiado a ${this.textContent}`);
        
        // Eliminar el mensaje después de 2 segundos
        setTimeout(() => {
            removeSystemMessages();
        }, 2000);
    }
    
    // Función para limpiar el chat
    function clearChat() {
        // Mostrar una confirmación antes de limpiar
        if (messageHistory.length > 0 && !confirm('¿Estás seguro de que quieres limpiar la conversación? Se perderá todo el progreso actual.')) {
            return;
        }
        
        // Limpiar mensajes del DOM excepto la bienvenida
        const welcomeMessage = document.querySelector('.chat-welcome');
        chatMessages.innerHTML = '';
        if (welcomeMessage) {
            chatMessages.appendChild(welcomeMessage);
        }
        
        // Reiniciar el historial y estado
        messageHistory = [];
        conversationState = {
            taskPhase: 'initial',
            currentTask: null,
            projectType: null,
            projectRequirements: [],
            generatedFiles: [],
            pendingActions: [],
            implementationProgress: 0
        };
        
        // Notificar al usuario
        addSystemMessage('Conversación limpiada');
        
        // Eliminar la notificación después de 2 segundos
        setTimeout(() => {
            removeSystemMessages();
        }, 2000);
    }
    
    // Función para procesar contenido Markdown y proteger código
    function processMarkdown(content) {
        // Reemplazo para bloques de código para mantener el formato correcto
        content = content.replace(/```(\w+)?\s*\n([\s\S]*?)```/g, function(match, language, code) {
            language = language || 'plaintext';
            return `<pre><code class="hljs language-${language}">${escapeHtml(code.trim())}</code></pre>`;
        });
        
        // Procesar el resto con marked
        return marked.parse(content);
    }
    
    // Función para copiar texto al portapapeles
    function copyToClipboard(text) {
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
    
    // Función para hacer scroll al final de la conversación
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Función para formatear la hora
    function formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Función para obtener el lenguaje desde la extensión del archivo
    function getLanguageFromPath(path) {
        const extension = path.split('.').pop().toLowerCase();
        const languageMap = {
            'js': 'javascript',
            'py': 'python',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'md': 'markdown',
            'txt': 'plaintext',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'php': 'php',
            'go': 'go',
            'java': 'java',
            'rb': 'ruby',
            'c': 'c',
            'cpp': 'cpp',
            'cs': 'csharp',
            'sh': 'bash',
            'sql': 'sql',
            'swift': 'swift',
            'vue': 'javascript',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml'
        };
        
        return languageMap[extension] || 'plaintext';
    }
    
    // Función para escapar HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
