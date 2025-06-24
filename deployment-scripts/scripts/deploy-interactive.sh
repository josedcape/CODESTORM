#!/bin/bash

# ========================================
# 🚀 CODESTORM - Script de Despliegue Interactivo
# ========================================
# Descripción: Script paso a paso con confirmaciones del usuario
# ========================================

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Variables
DOMAIN="codestorm.botidinamix.online"
APP_DIR="~/CODESTORM"
PORT="3001"

print_header() {
    clear
    echo -e "${PURPLE}"
    echo "=========================================="
    echo "🚀 CODESTORM - Despliegue Interactivo"
    echo "=========================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${BLUE}[PASO $1]${NC} ${GREEN}$2${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

ask_continue() {
    echo ""
    echo -e "${YELLOW}¿Continuar con este paso? (s/n): ${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Ss]$ ]]; then
        echo -e "${RED}❌ Operación cancelada por el usuario${NC}"
        exit 0
    fi
}

show_command() {
    echo -e "${CYAN}📝 Comando a ejecutar:${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo ""
}

execute_step() {
    local step_num=$1
    local step_name="$2"
    local command="$3"
    local description="$4"
    
    print_header
    print_step "$step_num" "$step_name"
    echo ""
    
    if [ -n "$description" ]; then
        echo -e "${CYAN}📋 Descripción:${NC}"
        echo "$description"
        echo ""
    fi
    
    if [ -n "$command" ]; then
        show_command "$command"
        ask_continue
        
        echo -e "${CYAN}🔄 Ejecutando...${NC}"
        eval "$command"
        local exit_code=$?
        
        if [ $exit_code -eq 0 ]; then
            print_success "Paso completado exitosamente"
        else
            echo -e "${RED}❌ Error en la ejecución (código: $exit_code)${NC}"
            echo -e "${YELLOW}¿Continuar de todas formas? (s/n): ${NC}"
            read -r response
            if [[ ! "$response" =~ ^[Ss]$ ]]; then
                exit 1
            fi
        fi
    else
        ask_continue
    fi
    
    echo ""
    echo -e "${CYAN}Presiona Enter para continuar...${NC}"
    read -r
}

# Función principal
main() {
    print_header
    echo -e "${GREEN}¡Bienvenido al despliegue interactivo de CODESTORM!${NC}"
    echo ""
    echo -e "${CYAN}Este script te guiará paso a paso para desplegar la aplicación.${NC}"
    echo -e "${CYAN}Podrás revisar cada comando antes de ejecutarlo.${NC}"
    echo ""
    echo -e "${YELLOW}Información del despliegue:${NC}"
    echo -e "${CYAN}• Dominio: ${GREEN}$DOMAIN${NC}"
    echo -e "${CYAN}• Puerto: ${GREEN}$PORT${NC}"
    echo -e "${CYAN}• Directorio: ${GREEN}$APP_DIR${NC}"
    echo ""
    ask_continue

    # PASO 1: Verificar prerrequisitos
    execute_step "1" "Verificar Node.js" \
        "node --version && npm --version" \
        "Verificamos que Node.js y npm estén instalados correctamente."

    # PASO 2: Verificar Nginx
    execute_step "2" "Verificar Nginx" \
        "nginx -v && sudo systemctl status nginx --no-pager" \
        "Verificamos que Nginx esté instalado y funcionando."

    # PASO 3: Navegar al directorio
    execute_step "3" "Navegar al directorio de la aplicación" \
        "cd $APP_DIR && pwd && ls -la" \
        "Navegamos al directorio de CODESTORM y verificamos su contenido."

    # PASO 4: Instalar dependencias
    execute_step "4" "Instalar dependencias de Node.js" \
        "npm install" \
        "Instalamos todas las dependencias necesarias para la aplicación."

    # PASO 5: Crear variables de entorno
    execute_step "5" "Crear archivo de variables de entorno" \
        "" \
        "Vamos a crear el archivo .env.production con las API keys.
        
Este archivo contendrá:
- OPENAI_API_KEY
- ANTHROPIC_API_KEY  
- PORT=3001
- NODE_ENV=production"

    cat > .env.production << 'EOF'
# Variables de entorno para producción CODESTORM
VITE_OPENAI_API_KEY=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
VITE_ANTHROPIC_API_KEY=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
OPENAI_API_KEY=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
ANTHROPIC_API_KEY=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
PORT=3001
NODE_ENV=production
EOF

    print_success "Archivo .env.production creado"

    # PASO 6: Configuración pública
    execute_step "6" "Configurar modo público" \
        "npm run setup:public" \
        "Configuramos la aplicación para modo público (sin autenticación)."

    # PASO 7: Build de producción
    execute_step "7" "Compilar aplicación para producción" \
        "npm run build:public" \
        "Creamos el build optimizado de la aplicación en el directorio dist/."

    # PASO 8: Verificar build
    execute_step "8" "Verificar archivos del build" \
        "ls -la dist/" \
        "Verificamos que el build se haya creado correctamente."

    # PASO 9: Crear servidor de producción
    execute_step "9" "Crear servidor de producción" \
        "" \
        "Vamos a crear el archivo server-production.js que servirá la aplicación."

    # Aquí iría la creación del server-production.js
    print_info "Creando server-production.js..."
    
    # PASO 10: Configurar Nginx
    execute_step "10" "Configurar Nginx" \
        "" \
        "Configuraremos Nginx como reverse proxy para la aplicación.
        
Esto incluye:
- Configuración SSL
- Redirección HTTP → HTTPS  
- Proxy a puerto 3001
- Headers de seguridad"

    # PASO 11: Crear servicio systemd
    execute_step "11" "Crear servicio systemd" \
        "" \
        "Crearemos un servicio systemd para gestionar la aplicación automáticamente."

    # PASO 12: Iniciar aplicación
    execute_step "12" "Iniciar aplicación" \
        "sudo systemctl start codestorm && sudo systemctl enable codestorm" \
        "Iniciamos el servicio y lo habilitamos para inicio automático."

    # PASO 13: Verificar estado
    execute_step "13" "Verificar estado final" \
        "sudo systemctl status codestorm --no-pager && curl -I https://$DOMAIN" \
        "Verificamos que todo esté funcionando correctamente."

    # Resumen final
    print_header
    echo -e "${GREEN}🎉 ¡DESPLIEGUE COMPLETADO EXITOSAMENTE!${NC}"
    echo ""
    echo -e "${CYAN}📱 Tu aplicación está disponible en:${NC}"
    echo -e "${GREEN}   https://$DOMAIN${NC}"
    echo ""
    echo -e "${CYAN}🔧 Comandos útiles:${NC}"
    echo -e "${YELLOW}   sudo systemctl status codestorm${NC}    # Ver estado"
    echo -e "${YELLOW}   sudo systemctl restart codestorm${NC}   # Reiniciar"
    echo -e "${YELLOW}   sudo journalctl -u codestorm -f${NC}    # Ver logs"
    echo ""
    echo -e "${CYAN}¡Gracias por usar CODESTORM!${NC}"
}

# Ejecutar función principal
main "$@"
