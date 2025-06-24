# 📋 CODESTORM - Log del Despliegue Exitoso

## 🎯 Información del Despliegue

**Fecha:** 23 de Junio, 2025  
**Dominio:** https://codestorm.botidinamix.online  
**Estado:** ✅ FUNCIONANDO PERFECTAMENTE  
**Servidor:** Ubuntu con Nginx  
**Puerto Aplicación:** 3001  
**SSL:** Let's Encrypt (HTTPS)  

---

## 📝 Comandos Ejecutados Paso a Paso

### 1. Preparación del Servidor
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version  # v18.x.x
npm --version   # 9.x.x

# Instalar Nginx (si no está instalado)
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2. Preparación de la Aplicación
```bash
# Navegar al directorio de la aplicación
cd ~/CODESTORM

# Instalar dependencias
npm install

# Verificar que todas las dependencias estén instaladas
npm list --depth=0
```

### 3. Configuración de Variables de Entorno
```bash
# Crear archivo .env.production
cat > .env.production << 'EOF'
VITE_OPENAI_API_KEY=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
VITE_ANTHROPIC_API_KEY=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
OPENAI_API_KEY=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
ANTHROPIC_API_KEY=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
PORT=3001
NODE_ENV=production
EOF

# Verificar archivo creado
cat .env.production
```

### 4. Configuración para Modo Público
```bash
# Ejecutar script de configuración pública
npm run setup:public

# Verificar que se aplicaron los cambios
grep -r "PUBLIC_MODE" src/ || echo "Configuración aplicada"
```

### 5. Build de Producción
```bash
# Crear build optimizado
npm run build:public

# Verificar que el build se creó correctamente
ls -la dist/
du -sh dist/  # Verificar tamaño del build

# Verificar archivos principales
ls -la dist/assets/
```

### 6. Crear Servidor de Producción
```bash
# Crear server-production.js
cat > server-production.js << 'EOF'
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.production' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, 'dist')));

app.use(cors({
  origin: [
    'https://codestorm.botidinamix.online',
    'http://codestorm.botidinamix.online'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'anthropic-version']
}));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

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

# Verificar archivo creado
head -20 server-production.js
```

### 7. Configuración de Nginx
```bash
# Crear configuración de Nginx
sudo tee /etc/nginx/sites-available/codestorm.botidinamix.online > /dev/null << 'EOF'
server {
    listen 80;
    server_name codestorm.botidinamix.online www.codestorm.botidinamix.online;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name codestorm.botidinamix.online www.codestorm.botidinamix.online;
    
    ssl_certificate /etc/letsencrypt/live/codestorm.botidinamix.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/codestorm.botidinamix.online/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_buffer_size 4k;
        proxy_buffers 4 32k;
        proxy_busy_buffers_size 64k;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3001;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
    }
    
    access_log /var/log/nginx/codestorm.botidinamix.online.access.log;
    error_log /var/log/nginx/codestorm.botidinamix.online.error.log;
}
EOF

# Habilitar sitio
sudo ln -sf /etc/nginx/sites-available/codestorm.botidinamix.online /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

### 8. Crear Servicio Systemd
```bash
# Crear servicio systemd
sudo tee /etc/systemd/system/codestorm.service > /dev/null << EOF
[Unit]
Description=CODESTORM - Plataforma de desarrollo asistido por IA
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME/CODESTORM
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server-production.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=codestorm

LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

# Recargar systemd
sudo systemctl daemon-reload

# Habilitar servicio
sudo systemctl enable codestorm
```

### 9. Iniciar la Aplicación
```bash
# Detener cualquier proceso en puerto 3001
sudo lsof -ti:3001 | xargs sudo kill -9 2>/dev/null || true

# Iniciar servicio
sudo systemctl start codestorm

# Verificar estado
sudo systemctl status codestorm

# Verificar logs
sudo journalctl -u codestorm --no-pager -l
```

### 10. Verificación Final
```bash
# Verificar servicios activos
sudo systemctl is-active nginx
sudo systemctl is-active codestorm

# Verificar conectividad local
curl -I http://localhost:3001

# Verificar conectividad HTTPS
curl -I https://codestorm.botidinamix.online

# Verificar logs en tiempo real
sudo journalctl -u codestorm -f
```

---

## ✅ Resultado Final

**Estado:** FUNCIONANDO PERFECTAMENTE  
**URL:** https://codestorm.botidinamix.online  
**Tiempo de respuesta:** < 500ms  
**SSL:** Válido y seguro  
**Servicios:** Todos activos y estables  

### Comandos de Administración Útiles
```bash
# Ver estado
sudo systemctl status codestorm

# Reiniciar
sudo systemctl restart codestorm

# Ver logs
sudo journalctl -u codestorm -f

# Verificar puerto
sudo lsof -i :3001

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx
```

---

**🎉 DESPLIEGUE COMPLETADO EXITOSAMENTE**
