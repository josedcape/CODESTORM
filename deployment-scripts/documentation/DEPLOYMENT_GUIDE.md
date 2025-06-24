# 🚀 CODESTORM - Guía Completa de Despliegue

## 📋 Resumen del Despliegue Exitoso

**Dominio:** https://codestorm.botidinamix.online  
**Estado:** ✅ FUNCIONANDO PERFECTAMENTE  
**Fecha de Despliegue:** 23 de Junio, 2025  

---

## 🎯 Arquitectura del Despliegue

```
Internet → Nginx (Puerto 443/80) → Express Server (Puerto 3001) → React App
```

### Componentes Principales:
- **Frontend:** React + Vite (Build estático)
- **Backend:** Express.js con proxies para APIs
- **Servidor Web:** Nginx como reverse proxy
- **SSL:** Let's Encrypt (HTTPS)
- **Gestión de Procesos:** systemd

---

## 🛠️ Pasos del Despliegue Automatizado

### Script Principal: `deploy-codestorm.sh`

El script automatiza todo el proceso de despliegue con las siguientes fases:

#### **PASO 1: Verificación de Prerrequisitos**
```bash
# Verifica instalación de:
- Node.js (v18+)
- npm
- nginx
- Permisos de usuario
```

#### **PASO 2: Preparación del Directorio**
```bash
# Navega al directorio de la aplicación
cd ~/CODESTORM
```

#### **PASO 3: Instalación de Dependencias**
```bash
npm install
```

#### **PASO 4: Configuración de Variables de Entorno**
```bash
# Crea .env.production con:
VITE_OPENAI_API_KEY=sk-proj-ela5HvrlTes...
VITE_ANTHROPIC_API_KEY=sk-ant-api03-nNS86Hd...
OPENAI_API_KEY=sk-proj-ela5HvrlTes...
ANTHROPIC_API_KEY=sk-ant-api03-nNS86Hd...
PORT=3001
NODE_ENV=production
```

#### **PASO 5: Configuración Pública**
```bash
npm run setup:public
```

#### **PASO 6: Build de Producción**
```bash
npm run build:public
# Genera directorio dist/ con archivos optimizados
```

#### **PASO 7: Servidor de Producción**
Crea `server-production.js` con:
- Express server
- Proxy para OpenAI API
- Proxy para Anthropic API
- Servir archivos estáticos
- Configuración CORS
- Logs de requests

#### **PASO 8: Configuración de Nginx**
Crea `/etc/nginx/sites-available/codestorm.botidinamix.online` con:
- Redirección HTTP → HTTPS
- Configuración SSL
- Reverse proxy a puerto 3001
- Headers de seguridad
- Optimización de archivos estáticos

#### **PASO 9: Servicio Systemd**
Crea `/etc/systemd/system/codestorm.service` para:
- Inicio automático del servidor
- Reinicio automático en caso de fallo
- Gestión de logs
- Límites de recursos

#### **PASO 10: Inicio de la Aplicación**
```bash
sudo systemctl start codestorm
sudo systemctl enable codestorm
```

#### **PASO 11: Verificación Final**
- Verifica servicios activos
- Prueba conectividad HTTPS
- Muestra comandos útiles

---

## 🚀 Uso del Script

### Despliegue Completo
```bash
chmod +x deploy-codestorm.sh
./deploy-codestorm.sh deploy
```

### Gestión de la Aplicación
```bash
# Iniciar
./deploy-codestorm.sh start

# Detener
./deploy-codestorm.sh stop

# Reiniciar
./deploy-codestorm.sh restart

# Ver estado
./deploy-codestorm.sh status

# Ver logs en tiempo real
./deploy-codestorm.sh logs

# Ayuda
./deploy-codestorm.sh help
```

---

## 📁 Estructura de Archivos Generados

```
~/CODESTORM/
├── dist/                          # Build de producción
├── server-production.js           # Servidor Express
├── .env.production                # Variables de entorno
├── deploy-codestorm.sh           # Script de despliegue
└── DEPLOYMENT_GUIDE.md           # Esta guía

/etc/nginx/sites-available/
└── codestorm.botidinamix.online   # Configuración Nginx

/etc/systemd/system/
└── codestorm.service              # Servicio systemd
```

---

## 🔧 Comandos Útiles de Administración

### Logs y Monitoreo
```bash
# Ver logs del servicio
sudo journalctl -u codestorm -f

# Ver logs de Nginx
sudo tail -f /var/log/nginx/codestorm.botidinamix.online.access.log
sudo tail -f /var/log/nginx/codestorm.botidinamix.online.error.log

# Estado del sistema
sudo systemctl status codestorm
sudo systemctl status nginx
```

### Gestión de Servicios
```bash
# Reiniciar servicios
sudo systemctl restart codestorm
sudo systemctl reload nginx

# Verificar configuración
sudo nginx -t

# Ver procesos en puerto 3001
sudo lsof -i :3001
```

### Actualizaciones
```bash
# Para actualizar la aplicación:
cd ~/CODESTORM
git pull                    # Si usas Git
npm install                 # Actualizar dependencias
npm run build:public        # Nuevo build
sudo systemctl restart codestorm
```

---

## 🔒 Configuración de Seguridad

### Headers de Seguridad (Nginx)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`

### SSL/TLS
- Protocolos: TLSv1.2, TLSv1.3
- Cifrados modernos
- Certificados Let's Encrypt

### CORS
- Origen permitido: `codestorm.botidinamix.online`
- Métodos: GET, POST, PUT, DELETE, OPTIONS
- Headers personalizados para APIs

---

## 🚨 Solución de Problemas

### La aplicación no inicia
```bash
# Verificar logs
sudo journalctl -u codestorm --no-pager -l

# Verificar puerto
sudo lsof -i :3001

# Reiniciar servicio
sudo systemctl restart codestorm
```

### Error 502 Bad Gateway
```bash
# Verificar que el servicio esté corriendo
sudo systemctl status codestorm

# Verificar configuración de Nginx
sudo nginx -t

# Reiniciar Nginx
sudo systemctl reload nginx
```

### Problemas de SSL
```bash
# Verificar certificados
sudo certbot certificates

# Renovar certificados
sudo certbot renew
```

---

## 📊 Métricas de Rendimiento

### Optimizaciones Implementadas
- ✅ Compresión gzip en Nginx
- ✅ Cache de archivos estáticos (1 año)
- ✅ Buffers optimizados para proxy
- ✅ Timeouts configurados
- ✅ Límites de recursos en systemd

### Monitoreo
- Logs estructurados con timestamps
- Métricas de requests en tiempo real
- Estado de servicios automático

---

## 🎉 Resultado Final

**✅ CODESTORM desplegado exitosamente en:**
- **URL Principal:** https://codestorm.botidinamix.online
- **Panel Admin:** https://codestorm.botidinamix.online/mantenimiento
- **Estado:** Funcionando 24/7 con reinicio automático
- **SSL:** Certificado válido y renovación automática
- **Rendimiento:** Optimizado para producción

---

*Script creado por Asistente IA - Junio 2025*
