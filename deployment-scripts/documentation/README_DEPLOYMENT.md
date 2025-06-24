# 🚀 CODESTORM - Scripts de Despliegue Automatizado

## 📋 Resumen

¡CODESTORM ha sido desplegado exitosamente! 🎉

**URL de la aplicación:** https://codestorm.botidinamix.online  
**Estado:** ✅ FUNCIONANDO PERFECTAMENTE  
**Fecha:** 23 de Junio, 2025  

---

## 📁 Archivos Creados

### 🔧 Scripts de Despliegue
- **`deploy-master.sh`** - Script principal con menú interactivo
- **`deploy-codestorm.sh`** - Script de despliegue automático completo
- **`deploy-interactive.sh`** - Script paso a paso con confirmaciones

### 📚 Documentación
- **`DEPLOYMENT_GUIDE.md`** - Guía completa de despliegue
- **`SUCCESSFUL_DEPLOYMENT_LOG.md`** - Log detallado del despliegue exitoso
- **`README_DEPLOYMENT.md`** - Este archivo

---

## 🚀 Cómo Usar los Scripts

### En Servidor Linux/Ubuntu:

#### 1. Script Principal (Recomendado)
```bash
# Hacer ejecutable
chmod +x deploy-master.sh

# Ejecutar menú principal
./deploy-master.sh
```

#### 2. Despliegue Automático Completo
```bash
# Hacer ejecutable
chmod +x deploy-codestorm.sh

# Ejecutar despliegue completo
./deploy-codestorm.sh deploy

# Otras opciones
./deploy-codestorm.sh start    # Solo iniciar
./deploy-codestorm.sh stop     # Solo detener
./deploy-codestorm.sh restart  # Reiniciar
./deploy-codestorm.sh status   # Ver estado
./deploy-codestorm.sh logs     # Ver logs
```

#### 3. Despliegue Interactivo
```bash
# Hacer ejecutable
chmod +x deploy-interactive.sh

# Ejecutar paso a paso
./deploy-interactive.sh
```

### En Windows (Desarrollo):
```bash
# Usar bash (Git Bash, WSL, etc.)
bash deploy-master.sh
bash deploy-codestorm.sh deploy
bash deploy-interactive.sh
```

---

## 🎯 Funcionalidades de los Scripts

### 🔧 deploy-master.sh
**Script principal con menú interactivo**

Opciones disponibles:
1. **Despliegue Automático Completo** - Sin interrupciones
2. **Despliegue Interactivo** - Paso a paso con confirmaciones
3. **Gestión de Aplicación** - Start/Stop/Restart/Status/Logs
4. **Ver Documentación** - Guías y logs
5. **Verificar Sistema** - Diagnóstico completo
6. **Salir**

### ⚡ deploy-codestorm.sh
**Script de despliegue automático**

Ejecuta automáticamente:
- ✅ Verificación de prerrequisitos
- ✅ Instalación de dependencias
- ✅ Configuración de variables de entorno
- ✅ Build de producción
- ✅ Creación del servidor Express
- ✅ Configuración de Nginx
- ✅ Creación del servicio systemd
- ✅ Inicio de la aplicación
- ✅ Verificación final

### 🎯 deploy-interactive.sh
**Script paso a paso**

Permite:
- 👀 Revisar cada comando antes de ejecutarlo
- ⏸️ Pausar en cualquier momento
- 📚 Aprender el proceso de despliegue
- 🔍 Verificar cada paso individualmente

---

## 📊 Arquitectura del Despliegue

```
Internet → Nginx (443/80) → Express Server (3001) → React App
```

### Componentes:
- **Frontend:** React + Vite (archivos estáticos)
- **Backend:** Express.js con proxies para APIs
- **Proxy:** Nginx como reverse proxy
- **SSL:** Let's Encrypt (HTTPS automático)
- **Proceso:** systemd para gestión automática

---

## 🔧 Comandos de Administración

### Gestión del Servicio
```bash
# Ver estado
sudo systemctl status codestorm

# Iniciar
sudo systemctl start codestorm

# Detener
sudo systemctl stop codestorm

# Reiniciar
sudo systemctl restart codestorm

# Habilitar inicio automático
sudo systemctl enable codestorm

# Ver logs en tiempo real
sudo journalctl -u codestorm -f
```

### Gestión de Nginx
```bash
# Verificar configuración
sudo nginx -t

# Recargar configuración
sudo systemctl reload nginx

# Ver logs
sudo tail -f /var/log/nginx/codestorm.botidinamix.online.access.log
sudo tail -f /var/log/nginx/codestorm.botidinamix.online.error.log
```

### Verificación del Sistema
```bash
# Ver procesos en puerto 3001
sudo lsof -i :3001

# Verificar conectividad local
curl -I http://localhost:3001

# Verificar conectividad pública
curl -I https://codestorm.botidinamix.online

# Ver uso de recursos
htop
df -h
free -h
```

---

## 🔄 Proceso de Actualización

Para actualizar la aplicación:

```bash
# 1. Navegar al directorio
cd ~/CODESTORM

# 2. Actualizar código (si usas Git)
git pull

# 3. Instalar nuevas dependencias
npm install

# 4. Crear nuevo build
npm run build:public

# 5. Reiniciar servicio
sudo systemctl restart codestorm

# 6. Verificar estado
sudo systemctl status codestorm
```

O usar el script:
```bash
./deploy-codestorm.sh restart
```

---

## 🚨 Solución de Problemas

### La aplicación no inicia
```bash
# Ver logs detallados
sudo journalctl -u codestorm --no-pager -l

# Verificar archivo de configuración
cat .env.production

# Verificar permisos
ls -la server-production.js

# Reiniciar servicio
sudo systemctl restart codestorm
```

### Error 502 Bad Gateway
```bash
# Verificar que el servicio esté corriendo
sudo systemctl status codestorm

# Verificar puerto 3001
sudo lsof -i :3001

# Verificar configuración de Nginx
sudo nginx -t

# Reiniciar servicios
sudo systemctl restart codestorm
sudo systemctl reload nginx
```

### Problemas de SSL
```bash
# Verificar certificados
sudo certbot certificates

# Renovar certificados
sudo certbot renew

# Verificar configuración SSL en Nginx
sudo nginx -t
```

---

## 📈 Monitoreo y Métricas

### Logs Importantes
- **Aplicación:** `sudo journalctl -u codestorm -f`
- **Nginx Access:** `/var/log/nginx/codestorm.botidinamix.online.access.log`
- **Nginx Error:** `/var/log/nginx/codestorm.botidinamix.online.error.log`
- **Sistema:** `sudo journalctl -f`

### Métricas de Rendimiento
- **CPU:** `htop` o `top`
- **Memoria:** `free -h`
- **Disco:** `df -h`
- **Red:** `iftop` o `nethogs`

---

## 🎉 Resultado Final

**✅ CODESTORM funcionando perfectamente en:**
- **URL Principal:** https://codestorm.botidinamix.online
- **Constructor:** https://codestorm.botidinamix.online/constructor
- **WebAI:** https://codestorm.botidinamix.online/webai
- **Agent:** https://codestorm.botidinamix.online/agent
- **Mantenimiento:** https://codestorm.botidinamix.online/mantenimiento

### Características Activas:
- ✅ HTTPS con SSL automático
- ✅ Reinicio automático en caso de fallo
- ✅ Logs estructurados
- ✅ Optimización de rendimiento
- ✅ Headers de seguridad
- ✅ Cache de archivos estáticos
- ✅ Proxies para APIs (OpenAI, Anthropic)

---

**🚀 ¡CODESTORM desplegado exitosamente!**

*Scripts creados por Asistente IA - Junio 2025*
