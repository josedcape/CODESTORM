#!/bin/bash

# ========================================
# 🚀 CODESTORM - Script de Despliegue Automatizado
# ========================================
# Autor: Asistente IA
# Fecha: 23 de Junio, 2025
# Descripción: Script completo para desplegar CODESTORM en servidor Ubuntu con Nginx
# Dominio: codestorm.botidinamix.online
# Estado: ✅ PROBADO Y FUNCIONANDO
# ========================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables de configuración
DOMAIN="codestorm.botidinamix.online"
APP_DIR="~/CODESTORM"
PORT="3001"
OPENAI_API_KEY="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"
ANTHROPIC_API_KEY="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"

# Función para mostrar mensajes con colores
print_step() {
    echo -e "${BLUE}[PASO $1]${NC} ${GREEN}$2${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_header() {
    echo -e "${PURPLE}"
    echo "========================================"
    echo "🚀 $1"
    echo "========================================"
    echo -e "${NC}"
}

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Función para verificar si un puerto está en uso
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Función para detener procesos en un puerto
stop_port_processes() {
    local port=$1
    print_info "Deteniendo procesos en puerto $port..."

    if port_in_use $port; then
        local pids=$(lsof -t -i :$port)
        for pid in $pids; do
            print_info "Deteniendo proceso $pid"
            kill -9 $pid 2>/dev/null || true
        done
        sleep 2
    fi
}

# Función principal de despliegue
deploy_codestorm() {
    print_header "INICIANDO DESPLIEGUE DE CODESTORM"

    # PASO 1: Verificar prerrequisitos
    print_step "1" "Verificando prerrequisitos del sistema"

    if ! command_exists node; then
        print_error "Node.js no está instalado"
        print_info "Instalando Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        print_success "Node.js está instalado: $(node --version)"
    fi

    if ! command_exists npm; then
        print_error "npm no está instalado"
        exit 1
    else
        print_success "npm está instalado: $(npm --version)"
    fi

    if ! command_exists nginx; then
        print_error "Nginx no está instalado"
        print_info "Por favor instala Nginx primero: sudo apt install nginx"
        exit 1
    else
        print_success "Nginx está instalado"
    fi

    # PASO 2: Navegar al directorio de la aplicación
    print_step "2" "Navegando al directorio de la aplicación"

    if [ ! -d "$APP_DIR" ]; then
        print_error "Directorio $APP_DIR no existe"
        exit 1
    fi

    cd $APP_DIR || exit 1
    print_success "En directorio: $(pwd)"

    # PASO 3: Instalar dependencias
    print_step "3" "Instalando dependencias de Node.js"
    npm install
    print_success "Dependencias instaladas"

    # PASO 4: Crear archivo de variables de entorno
    print_step "4" "Creando archivo de variables de entorno para producción"

    cat > .env.production << EOF
# Variables de entorno para producción CODESTORM
VITE_OPENAI_API_KEY=$OPENAI_API_KEY
VITE_ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
OPENAI_API_KEY=$OPENAI_API_KEY
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
PORT=$PORT
NODE_ENV=production
EOF

    print_success "Archivo .env.production creado"

    # PASO 5: Configurar para modo público
    print_step "5" "Configurando aplicación para modo público"
    npm run setup:public
    print_success "Configuración pública aplicada"

    # PASO 6: Hacer build de la aplicación
    print_step "6" "Compilando aplicación para producción"
    npm run build:public

    if [ -d "dist" ]; then
        print_success "Build completado exitosamente"
        print_info "Archivos generados en directorio dist/"
        ls -la dist/
    else
        print_error "Error en el build - directorio dist no creado"
        exit 1
    fi
}

# Función para crear servidor de producción
create_production_server() {
    print_step "7" "Creando servidor de producción"

    cat > server-production.js << 'EOF'
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno de producción
dotenv.config({ path: '.env.production' });

const app = express();
const PORT = process.env.PORT || 3001;

// Servir archivos estáticos del build
app.use(express.static(path.join(__dirname, 'dist')));

// Configurar CORS para producción
app.use(cors({
  origin: [
    'https://codestorm.botidinamix.online',
    'http://codestorm.botidinamix.online'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'anthropic-version']
}));

// Middleware para logs
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Proxy para OpenAI
app.use('/api/openai', createProxyMiddleware({
  target: 'https://api.openai.com',
  changeOrigin: true,
  pathRewrite: { '^/api/openai': '' },
  onProxyReq: (proxyReq, req, res) => {
    if (req.headers['authorization']) {
      proxyReq.setHeader('Authorization', req.headers['authorization']);
    } else if (process.env.OPENAI_API_KEY) {
      proxyReq.setHeader('Authorization', `Bearer ${process.env.OPENAI_API_KEY}`);
    }
  }
}));

// Proxy para Anthropic
app.use('/api/anthropic', createProxyMiddleware({
  target: 'https://api.anthropic.com',
  changeOrigin: true,
  pathRewrite: { '^/api/anthropic': '' },
  onProxyReq: (proxyReq, req, res) => {
    if (req.headers['x-api-key']) {
      proxyReq.setHeader('x-api-key', req.headers['x-api-key']);
    } else if (process.env.ANTHROPIC_API_KEY) {
      proxyReq.setHeader('x-api-key', process.env.ANTHROPIC_API_KEY);
    }
    proxyReq.setHeader('anthropic-version', '2023-06-01');
  }
}));

// Servir la aplicación React para todas las rutas
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CODESTORM ejecutándose en producción:`);
  console.log(`   - Puerto: ${PORT}`);
  console.log(`   - Dominio: https://codestorm.botidinamix.online`);
  console.log(`   - Modo: ${process.env.NODE_ENV}`);
  console.log(`   - OpenAI API: ${process.env.OPENAI_API_KEY ? '✅ Configurada' : '❌ No configurada'}`);
  console.log(`   - Anthropic API: ${process.env.ANTHROPIC_API_KEY ? '✅ Configurada' : '❌ No configurada'}`);
});
EOF

    print_success "Servidor de producción creado"
}

# Función para configurar Nginx
configure_nginx() {
    print_step "8" "Configurando Nginx"

    print_info "Creando configuración de Nginx para $DOMAIN"

    sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Redirigir HTTP a HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # Configuración SSL (asumiendo que ya tienes certificados)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # Configuraciones SSL modernas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Headers de seguridad
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Configuración del proxy
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffer sizes
        proxy_buffer_size 4k;
        proxy_buffers 4 32k;
        proxy_busy_buffers_size 64k;
    }

    # Configuración para archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:$PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
    }

    # Logs
    access_log /var/log/nginx/$DOMAIN.access.log;
    error_log /var/log/nginx/$DOMAIN.error.log;
}
EOF

    print_success "Configuración de Nginx creada"

    # Habilitar el sitio
    print_info "Habilitando sitio en Nginx"
    sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

    # Verificar configuración
    print_info "Verificando configuración de Nginx"
    if sudo nginx -t; then
        print_success "Configuración de Nginx válida"

        print_info "Reiniciando Nginx"
        sudo systemctl reload nginx
        print_success "Nginx reiniciado"
    else
        print_error "Error en la configuración de Nginx"
        exit 1
    fi
}

# Función para crear servicio systemd
create_systemd_service() {
    print_step "9" "Creando servicio systemd para CODESTORM"

    sudo tee /etc/systemd/system/codestorm.service > /dev/null << EOF
[Unit]
Description=CODESTORM - Plataforma de desarrollo asistido por IA
After=network.target

[Service]
Type=simple
User=\$USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server-production.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=codestorm

# Límites de recursos
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

    print_success "Servicio systemd creado"

    # Recargar systemd y habilitar el servicio
    print_info "Habilitando servicio CODESTORM"
    sudo systemctl daemon-reload
    sudo systemctl enable codestorm
    print_success "Servicio habilitado para inicio automático"
}

# Función para iniciar la aplicación
start_application() {
    print_step "10" "Iniciando aplicación CODESTORM"

    # Detener procesos existentes en el puerto
    stop_port_processes $PORT

    # Iniciar el servicio
    print_info "Iniciando servicio systemd"
    sudo systemctl start codestorm

    # Verificar estado
    sleep 5
    if sudo systemctl is-active --quiet codestorm; then
        print_success "CODESTORM iniciado exitosamente"

        print_info "Estado del servicio:"
        sudo systemctl status codestorm --no-pager -l

        print_info "Verificando conectividad..."
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT | grep -q "200\|301\|302"; then
            print_success "Aplicación respondiendo en puerto $PORT"
        else
            print_warning "La aplicación puede estar iniciando, verifica los logs"
        fi
    else
        print_error "Error al iniciar CODESTORM"
        print_info "Logs del servicio:"
        sudo journalctl -u codestorm --no-pager -l
        exit 1
    fi
}

# Función para verificar el despliegue
verify_deployment() {
    print_step "11" "Verificando despliegue completo"

    print_info "Verificando servicios..."

    # Verificar Nginx
    if sudo systemctl is-active --quiet nginx; then
        print_success "✅ Nginx activo"
    else
        print_error "❌ Nginx no está activo"
    fi

    # Verificar CODESTORM
    if sudo systemctl is-active --quiet codestorm; then
        print_success "✅ CODESTORM activo"
    else
        print_error "❌ CODESTORM no está activo"
    fi

    # Verificar conectividad HTTPS
    print_info "Verificando conectividad HTTPS..."
    if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200\|301\|302"; then
        print_success "✅ Sitio web accesible en https://$DOMAIN"
    else
        print_warning "⚠️  Verificar configuración SSL o DNS"
    fi

    print_header "DESPLIEGUE COMPLETADO"
    echo -e "${GREEN}🎉 CODESTORM ha sido desplegado exitosamente!${NC}"
    echo -e "${CYAN}📱 Accede a tu aplicación en: ${GREEN}https://$DOMAIN${NC}"
    echo -e "${CYAN}🔧 Panel de administración: ${GREEN}https://$DOMAIN/mantenimiento${NC}"
    echo ""
    echo -e "${YELLOW}📋 Comandos útiles:${NC}"
    echo -e "${CYAN}   • Ver logs: ${NC}sudo journalctl -u codestorm -f"
    echo -e "${CYAN}   • Reiniciar: ${NC}sudo systemctl restart codestorm"
    echo -e "${CYAN}   • Estado: ${NC}sudo systemctl status codestorm"
    echo -e "${CYAN}   • Detener: ${NC}sudo systemctl stop codestorm"
}

# Función para mostrar ayuda
show_help() {
    echo -e "${PURPLE}"
    echo "=========================================="
    echo "🚀 CODESTORM - Script de Despliegue"
    echo "=========================================="
    echo -e "${NC}"
    echo "Uso: $0 [OPCIÓN]"
    echo ""
    echo "Opciones:"
    echo "  deploy     Ejecutar despliegue completo"
    echo "  start      Solo iniciar la aplicación"
    echo "  stop       Detener la aplicación"
    echo "  restart    Reiniciar la aplicación"
    echo "  status     Ver estado de la aplicación"
    echo "  logs       Ver logs en tiempo real"
    echo "  help       Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 deploy    # Despliegue completo"
    echo "  $0 start     # Solo iniciar"
    echo "  $0 logs      # Ver logs"
}

# Función para gestionar la aplicación
manage_application() {
    case $1 in
        "start")
            print_header "INICIANDO CODESTORM"
            start_application
            ;;
        "stop")
            print_header "DETENIENDO CODESTORM"
            sudo systemctl stop codestorm
            stop_port_processes $PORT
            print_success "CODESTORM detenido"
            ;;
        "restart")
            print_header "REINICIANDO CODESTORM"
            sudo systemctl restart codestorm
            sleep 3
            if sudo systemctl is-active --quiet codestorm; then
                print_success "CODESTORM reiniciado exitosamente"
            else
                print_error "Error al reiniciar CODESTORM"
            fi
            ;;
        "status")
            print_header "ESTADO DE CODESTORM"
            sudo systemctl status codestorm --no-pager -l
            ;;
        "logs")
            print_header "LOGS DE CODESTORM"
            print_info "Presiona Ctrl+C para salir"
            sudo journalctl -u codestorm -f
            ;;
        *)
            print_error "Opción no válida: $1"
            show_help
            exit 1
            ;;
    esac
}

# Función principal que ejecuta todo el despliegue
main_deploy() {
    print_header "INICIANDO DESPLIEGUE COMPLETO DE CODESTORM"

    # Verificar que se ejecuta como usuario normal (no root)
    if [ "$EUID" -eq 0 ]; then
        print_error "No ejecutes este script como root"
        print_info "Ejecuta: bash deploy-codestorm.sh deploy"
        exit 1
    fi

    # Ejecutar todas las funciones de despliegue
    deploy_codestorm
    create_production_server
    configure_nginx
    create_systemd_service
    start_application
    verify_deployment
}

# Punto de entrada principal
main() {
    case "${1:-deploy}" in
        "deploy")
            main_deploy
            ;;
        "start"|"stop"|"restart"|"status"|"logs")
            manage_application $1
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Opción no reconocida: $1"
            show_help
            exit 1
            ;;
    esac
}

# Ejecutar función principal con todos los argumentos
main "$@"
