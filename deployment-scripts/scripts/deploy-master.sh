#!/bin/bash

# ========================================
# 🚀 CODESTORM - Script Maestro de Despliegue
# ========================================
# Descripción: Script principal que permite elegir el tipo de despliegue
# ========================================

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    clear
    echo -e "${PURPLE}"
    echo "=========================================="
    echo "🚀 CODESTORM - Script Maestro"
    echo "=========================================="
    echo -e "${NC}"
    echo -e "${GREEN}Plataforma de desarrollo asistido por IA${NC}"
    echo -e "${CYAN}Dominio: https://codestorm.botidinamix.online${NC}"
    echo ""
}

print_menu() {
    echo -e "${BLUE}Selecciona el tipo de despliegue:${NC}"
    echo ""
    echo -e "${CYAN}1.${NC} ${GREEN}Despliegue Automático Completo${NC}"
    echo -e "   ${YELLOW}→${NC} Ejecuta todo el proceso sin interrupciones"
    echo -e "   ${YELLOW}→${NC} Recomendado para servidores nuevos"
    echo ""
    echo -e "${CYAN}2.${NC} ${GREEN}Despliegue Interactivo${NC}"
    echo -e "   ${YELLOW}→${NC} Paso a paso con confirmaciones"
    echo -e "   ${YELLOW}→${NC} Ideal para aprender el proceso"
    echo ""
    echo -e "${CYAN}3.${NC} ${GREEN}Solo Gestión de Aplicación${NC}"
    echo -e "   ${YELLOW}→${NC} Start/Stop/Restart/Status/Logs"
    echo -e "   ${YELLOW}→${NC} Para aplicaciones ya desplegadas"
    echo ""
    echo -e "${CYAN}4.${NC} ${GREEN}Ver Documentación${NC}"
    echo -e "   ${YELLOW}→${NC} Guías y logs del despliegue"
    echo ""
    echo -e "${CYAN}5.${NC} ${GREEN}Verificar Estado del Sistema${NC}"
    echo -e "   ${YELLOW}→${NC} Diagnóstico completo"
    echo ""
    echo -e "${CYAN}6.${NC} ${RED}Salir${NC}"
    echo ""
}

make_executable() {
    echo -e "${CYAN}🔧 Haciendo scripts ejecutables...${NC}"
    chmod +x deploy-codestorm.sh 2>/dev/null || true
    chmod +x deploy-interactive.sh 2>/dev/null || true
    chmod +x deploy-master.sh 2>/dev/null || true
    echo -e "${GREEN}✅ Scripts configurados${NC}"
    echo ""
}

show_documentation() {
    echo -e "${BLUE}📚 Documentación Disponible:${NC}"
    echo ""
    
    if [ -f "DEPLOYMENT_GUIDE.md" ]; then
        echo -e "${GREEN}✅ DEPLOYMENT_GUIDE.md${NC} - Guía completa de despliegue"
    else
        echo -e "${RED}❌ DEPLOYMENT_GUIDE.md${NC} - No encontrado"
    fi
    
    if [ -f "SUCCESSFUL_DEPLOYMENT_LOG.md" ]; then
        echo -e "${GREEN}✅ SUCCESSFUL_DEPLOYMENT_LOG.md${NC} - Log del despliegue exitoso"
    else
        echo -e "${RED}❌ SUCCESSFUL_DEPLOYMENT_LOG.md${NC} - No encontrado"
    fi
    
    echo ""
    echo -e "${CYAN}¿Qué documentación quieres ver?${NC}"
    echo -e "${YELLOW}1.${NC} Guía de despliegue"
    echo -e "${YELLOW}2.${NC} Log del despliegue exitoso"
    echo -e "${YELLOW}3.${NC} Volver al menú principal"
    echo ""
    echo -e "${CYAN}Selecciona una opción (1-3): ${NC}"
    read -r doc_choice
    
    case $doc_choice in
        1)
            if [ -f "DEPLOYMENT_GUIDE.md" ]; then
                less DEPLOYMENT_GUIDE.md
            else
                echo -e "${RED}❌ Archivo no encontrado${NC}"
            fi
            ;;
        2)
            if [ -f "SUCCESSFUL_DEPLOYMENT_LOG.md" ]; then
                less SUCCESSFUL_DEPLOYMENT_LOG.md
            else
                echo -e "${RED}❌ Archivo no encontrado${NC}"
            fi
            ;;
        3)
            return
            ;;
        *)
            echo -e "${RED}❌ Opción no válida${NC}"
            ;;
    esac
    
    echo ""
    echo -e "${CYAN}Presiona Enter para continuar...${NC}"
    read -r
}

verify_system() {
    echo -e "${BLUE}🔍 Verificando estado del sistema...${NC}"
    echo ""
    
    # Verificar Node.js
    if command -v node >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Node.js:${NC} $(node --version)"
    else
        echo -e "${RED}❌ Node.js no instalado${NC}"
    fi
    
    # Verificar npm
    if command -v npm >/dev/null 2>&1; then
        echo -e "${GREEN}✅ npm:${NC} $(npm --version)"
    else
        echo -e "${RED}❌ npm no instalado${NC}"
    fi
    
    # Verificar Nginx
    if command -v nginx >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Nginx:${NC} $(nginx -v 2>&1 | cut -d' ' -f3)"
        if systemctl is-active --quiet nginx; then
            echo -e "${GREEN}   └─ Estado: Activo${NC}"
        else
            echo -e "${YELLOW}   └─ Estado: Inactivo${NC}"
        fi
    else
        echo -e "${RED}❌ Nginx no instalado${NC}"
    fi
    
    # Verificar servicio CODESTORM
    if systemctl list-unit-files | grep -q codestorm.service; then
        echo -e "${GREEN}✅ Servicio CODESTORM: Configurado${NC}"
        if systemctl is-active --quiet codestorm; then
            echo -e "${GREEN}   └─ Estado: Activo${NC}"
        else
            echo -e "${YELLOW}   └─ Estado: Inactivo${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Servicio CODESTORM: No configurado${NC}"
    fi
    
    # Verificar puerto 3001
    if lsof -i :3001 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Puerto 3001: En uso${NC}"
        echo -e "${CYAN}   └─ Proceso: $(lsof -t -i :3001 | head -1 | xargs ps -p | tail -1 | awk '{print $4}')${NC}"
    else
        echo -e "${YELLOW}⚠️  Puerto 3001: Libre${NC}"
    fi
    
    # Verificar directorio de la aplicación
    if [ -d "~/CODESTORM" ] || [ -d "./dist" ]; then
        echo -e "${GREEN}✅ Directorio de aplicación: Encontrado${NC}"
        if [ -d "./dist" ]; then
            echo -e "${CYAN}   └─ Build de producción: Disponible${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Directorio de aplicación: No encontrado${NC}"
    fi
    
    # Verificar conectividad
    echo ""
    echo -e "${BLUE}🌐 Verificando conectividad...${NC}"
    
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✅ Aplicación local: Respondiendo${NC}"
    else
        echo -e "${YELLOW}⚠️  Aplicación local: No responde${NC}"
    fi
    
    if curl -s -o /dev/null -w "%{http_code}" https://codestorm.botidinamix.online 2>/dev/null | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✅ Sitio web público: Accesible${NC}"
    else
        echo -e "${YELLOW}⚠️  Sitio web público: No accesible${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}Presiona Enter para continuar...${NC}"
    read -r
}

manage_application() {
    echo -e "${BLUE}🔧 Gestión de Aplicación CODESTORM${NC}"
    echo ""
    echo -e "${CYAN}1.${NC} Iniciar aplicación"
    echo -e "${CYAN}2.${NC} Detener aplicación"
    echo -e "${CYAN}3.${NC} Reiniciar aplicación"
    echo -e "${CYAN}4.${NC} Ver estado"
    echo -e "${CYAN}5.${NC} Ver logs en tiempo real"
    echo -e "${CYAN}6.${NC} Volver al menú principal"
    echo ""
    echo -e "${CYAN}Selecciona una opción (1-6): ${NC}"
    read -r manage_choice
    
    case $manage_choice in
        1)
            echo -e "${CYAN}🚀 Iniciando CODESTORM...${NC}"
            if [ -f "deploy-codestorm.sh" ]; then
                ./deploy-codestorm.sh start
            else
                sudo systemctl start codestorm
            fi
            ;;
        2)
            echo -e "${CYAN}🛑 Deteniendo CODESTORM...${NC}"
            if [ -f "deploy-codestorm.sh" ]; then
                ./deploy-codestorm.sh stop
            else
                sudo systemctl stop codestorm
            fi
            ;;
        3)
            echo -e "${CYAN}🔄 Reiniciando CODESTORM...${NC}"
            if [ -f "deploy-codestorm.sh" ]; then
                ./deploy-codestorm.sh restart
            else
                sudo systemctl restart codestorm
            fi
            ;;
        4)
            echo -e "${CYAN}📊 Estado de CODESTORM:${NC}"
            if [ -f "deploy-codestorm.sh" ]; then
                ./deploy-codestorm.sh status
            else
                sudo systemctl status codestorm --no-pager -l
            fi
            ;;
        5)
            echo -e "${CYAN}📝 Logs de CODESTORM (Ctrl+C para salir):${NC}"
            if [ -f "deploy-codestorm.sh" ]; then
                ./deploy-codestorm.sh logs
            else
                sudo journalctl -u codestorm -f
            fi
            ;;
        6)
            return
            ;;
        *)
            echo -e "${RED}❌ Opción no válida${NC}"
            ;;
    esac
    
    if [ "$manage_choice" != "5" ] && [ "$manage_choice" != "6" ]; then
        echo ""
        echo -e "${CYAN}Presiona Enter para continuar...${NC}"
        read -r
    fi
}

main() {
    make_executable
    
    while true; do
        print_header
        print_menu
        
        echo -e "${CYAN}Selecciona una opción (1-6): ${NC}"
        read -r choice
        
        case $choice in
            1)
                echo -e "${GREEN}🚀 Iniciando despliegue automático completo...${NC}"
                if [ -f "deploy-codestorm.sh" ]; then
                    ./deploy-codestorm.sh deploy
                else
                    echo -e "${RED}❌ Script deploy-codestorm.sh no encontrado${NC}"
                fi
                echo ""
                echo -e "${CYAN}Presiona Enter para continuar...${NC}"
                read -r
                ;;
            2)
                echo -e "${GREEN}🎯 Iniciando despliegue interactivo...${NC}"
                if [ -f "deploy-interactive.sh" ]; then
                    ./deploy-interactive.sh
                else
                    echo -e "${RED}❌ Script deploy-interactive.sh no encontrado${NC}"
                    echo ""
                    echo -e "${CYAN}Presiona Enter para continuar...${NC}"
                    read -r
                fi
                ;;
            3)
                manage_application
                ;;
            4)
                show_documentation
                ;;
            5)
                verify_system
                ;;
            6)
                echo -e "${GREEN}👋 ¡Hasta luego!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Opción no válida. Por favor selecciona 1-6.${NC}"
                echo ""
                echo -e "${CYAN}Presiona Enter para continuar...${NC}"
                read -r
                ;;
        esac
    done
}

# Ejecutar función principal
main "$@"
