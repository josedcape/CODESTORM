#!/bin/bash
# Script de instalación simplificada para CODESTORM
# Reemplaza la arquitectura basada en Docker con una solución basada en Python venv

set -e

echo "🌩️  Instalando CODESTORM: Agente de Desarrollo Autónomo"
echo "=================================================="

# Directorio base
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="/home/ubuntu/codestorm"

# Crear directorio de instalación
echo "📁 Creando directorio de instalación..."
mkdir -p "$INSTALL_DIR"

# Copiar archivos del proyecto
echo "📋 Copiando archivos del proyecto..."
cp -r "$BASE_DIR"/* "$INSTALL_DIR/"

# Crear directorio backend si no existe
mkdir -p "$INSTALL_DIR/backend"

# Crear script de inicio del servidor
cat > "$INSTALL_DIR/backend/start_server.py" << 'EOF'
#!/usr/bin/env python3
"""
CODESTORM Server Startup Script
Reemplaza la arquitectura basada en Docker con una solución basada en Python venv
"""

import os
import sys
import subprocess
import venv
import json
import platform
import shutil
from pathlib import Path
from typing import Optional

class CodeStormInstaller:
    def __init__(self):
        self.base_dir = Path(__file__).parent.parent
        self.venv_dir = self.base_dir / 'venv'
        self.requirements_file = self.base_dir / 'requirements.txt'
        self.is_windows = platform.system() == 'Windows'
        
    def create_venv_if_needed(self) -> bool:
        """Crea un entorno virtual si no existe."""
        if not self.venv_dir.exists():
            print(f"🔧 Creando entorno virtual en {self.venv_dir}...")
            try:
                venv.create(self.venv_dir, with_pip=True)
                print("✅ Entorno virtual creado exitosamente")
                return True
            except Exception as e:
                print(f"❌ Error creando entorno virtual: {e}")
                return False
        else:
            print("✅ Entorno virtual ya existe")
            return False

    def get_python_path(self) -> Path:
        """Obtiene la ruta del ejecutable Python en el entorno virtual."""
        if self.is_windows:
            return self.venv_dir / 'Scripts' / 'python.exe'
        else:
            return self.venv_dir / 'bin' / 'python'

    def get_pip_path(self) -> Path:
        """Obtiene la ruta del ejecutable pip en el entorno virtual."""
        if self.is_windows:
            return self.venv_dir / 'Scripts' / 'pip.exe'
        else:
            return self.venv_dir / 'bin' / 'pip'

    def install_dependencies(self) -> bool:
        """Instala las dependencias requeridas."""
        pip_path = self.get_pip_path()
        
        if not self.requirements_file.exists():
            print("⚠️  Archivo requirements.txt no encontrado, creando uno básico...")
            self.create_basic_requirements()
        
        print("📦 Instalando dependencias...")
        try:
            # Actualizar pip primero
            subprocess.check_call([
                str(pip_path), 'install', '--upgrade', 'pip'
            ], cwd=self.base_dir)
            
            # Instalar dependencias
            subprocess.check_call([
                str(pip_path), 'install', '-r', str(self.requirements_file)
            ], cwd=self.base_dir)
            
            print("✅ Dependencias instaladas exitosamente")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Error instalando dependencias: {e}")
            return False

    def create_basic_requirements(self):
        """Crea un archivo requirements.txt básico si no existe."""
        basic_requirements = """
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
python-multipart>=0.0.6
python-socketio>=5.11.0
sse-starlette>=2.1.0
aiohttp>=3.9.0
litellm>=1.60.0
numpy
termcolor
jinja2>=3.1.3
tenacity>=8.5
python-dotenv
psutil
python-json-logger>=3.2.1
prompt-toolkit>=3.0.50
        """.strip()
        
        with open(self.requirements_file, 'w') as f:
            f.write(basic_requirements)
        print(f"📝 Archivo requirements.txt creado en {self.requirements_file}")

    def check_dependencies(self) -> bool:
        """Verifica que las dependencias estén instaladas."""
        python_path = self.get_python_path()
        
        try:
            result = subprocess.run([
                str(python_path), '-c', 
                'import fastapi, uvicorn, openhands; print("Dependencies OK")'
            ], capture_output=True, text=True, cwd=self.base_dir)
            
            if result.returncode == 0:
                print("✅ Dependencias verificadas")
                return True
            else:
                print("⚠️  Algunas dependencias faltan, reinstalando...")
                return self.install_dependencies()
        except Exception as e:
            print(f"⚠️  Error verificando dependencias: {e}")
            return self.install_dependencies()

    def start_server(self, port: int = 3000, host: str = "0.0.0.0") -> Optional[subprocess.Popen]:
        """Inicia el servidor CODESTORM."""
        python_path = self.get_python_path()
        
        print(f"🚀 Iniciando servidor CODESTORM en {host}:{port}...")
        
        # Variables de entorno para CODESTORM
        env = os.environ.copy()
        env.update({
            'CODESTORM_PORT': str(port),
            'CODESTORM_HOST': host,
            'PYTHONPATH': str(self.base_dir),
            'CODESTORM_MODE': 'standalone'
        })
        
        try:
            # Comando para iniciar el servidor
            cmd = [
                str(python_path), 
                '-m', 'uvicorn',
                'openhands.server.app:app',
                '--host', host,
                '--port', str(port),
                '--reload'
            ]
            
            server_process = subprocess.Popen(
                cmd,
                env=env,
                cwd=self.base_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True
            )
            
            print(f"✅ Servidor iniciado con PID: {server_process.pid}")
            print(f"🌐 Accede a CODESTORM en: http://{host}:{port}")
            
            return server_process
            
        except Exception as e:
            print(f"❌ Error iniciando servidor: {e}")
            return None

    def setup_and_start(self, port: int = 3000, host: str = "0.0.0.0") -> Optional[subprocess.Popen]:
        """Configuración completa e inicio del servidor."""
        print("🌩️  CODESTORM: Agente de Desarrollo Autónomo")
        print("=" * 50)
        
        # Paso 1: Crear entorno virtual
        venv_created = self.create_venv_if_needed()
        
        # Paso 2: Instalar/verificar dependencias
        if venv_created or not self.check_dependencies():
            if not self.install_dependencies():
                print("❌ Falló la instalación de dependencias")
                return None
        
        # Paso 3: Iniciar servidor
        return self.start_server(port, host)

def main():
    """Función principal."""
    import argparse
    
    parser = argparse.ArgumentParser(description='CODESTORM Server')
    parser.add_argument('--port', type=int, default=3000, help='Puerto del servidor')
    parser.add_argument('--host', default='0.0.0.0', help='Host del servidor')
    parser.add_argument('--setup-only', action='store_true', help='Solo configurar, no iniciar')
    
    args = parser.parse_args()
    
    installer = CodeStormInstaller()
    
    if args.setup_only:
        # Solo configurar el entorno
        installer.create_venv_if_needed()
        installer.install_dependencies()
        print("✅ Configuración completada")
    else:
        # Configurar e iniciar
        server_process = installer.setup_and_start(args.port, args.host)
        
        if server_process:
            try:
                # Monitorear el proceso del servidor
                for line in server_process.stdout:
                    print(line.strip())
                    if "Application startup complete" in line:
                        print("🎉 CODESTORM está listo para usar!")
                        
            except KeyboardInterrupt:
                print("\n🛑 Deteniendo servidor...")
                server_process.terminate()
                server_process.wait()
                print("✅ Servidor detenido")
        else:
            print("❌ No se pudo iniciar el servidor")
            sys.exit(1)

if __name__ == '__main__':
    main()
EOF

chmod +x "$INSTALL_DIR/backend/start_server.py"

# Instalar dependencias del backend
echo "🔧 Configurando entorno Python..."
cd "$INSTALL_DIR"
python3 "$INSTALL_DIR/backend/start_server.py" --setup-only

# Instalar dependencias del frontend
echo "🎨 Configurando frontend..."
cd "$INSTALL_DIR/frontend"
npm install
npm run build

# Crear script de inicio
cat > "$INSTALL_DIR/start_codestorm.sh" << 'EOF'
#!/bin/bash
echo "🌩️  Iniciando CODESTORM..."
cd "$(dirname "$0")"

# Iniciar backend en segundo plano
python3 backend/start_server.py --port 3000 &
BACKEND_PID=$!

# Esperar a que el backend esté listo
echo "⏳ Esperando a que el backend esté listo..."
sleep 5

# Iniciar frontend
cd frontend
npm start &
FRONTEND_PID=$!

echo "🎉 CODESTORM está ejecutándose!"
echo "🌐 Frontend: http://localhost:3001"
echo "🔧 Backend API: http://localhost:3000"
echo ""
echo "Presiona Ctrl+C para detener..."

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo CODESTORM..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Esperar indefinidamente
wait
EOF

chmod +x "$INSTALL_DIR/start_codestorm.sh"

echo "📝 Creando script de inicio..."

# Crear acceso directo en el escritorio (opcional)
echo "🖥️  Creando acceso directo en el escritorio..."
cat > "/home/ubuntu/Desktop/CODESTORM.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=CODESTORM
Comment=Agente de Desarrollo Autónomo
Exec=$INSTALL_DIR/start_codestorm.sh
Icon=$INSTALL_DIR/docs/static/img/logo.png
Terminal=true
Categories=Development;
EOF

chmod +x "/home/ubuntu/Desktop/CODESTORM.desktop"

echo ""
echo "🎉 ¡Instalación completada!"
echo "📍 CODESTORM instalado en: $INSTALL_DIR"
echo "🚀 Para iniciar CODESTORM, ejecuta:"
echo "   cd $INSTALL_DIR && ./start_codestorm.sh"
echo ""
echo "🌐 Una vez iniciado, accede a:"
echo "   Frontend: http://localhost:3001"
echo "   Backend API: http://localhost:3000"
echo ""

