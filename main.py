"""
Punto de entrada principal para la aplicación Codestorm Assistant.
Este archivo configura la aplicación Flask y registra todas las rutas.
"""

import os
import logging
from routes_analyzer import register_analyzer_routes
from simple_test import app, get_user_workspace

# Configurar logging para este módulo
logger = logging.getLogger(__name__)

# Registrar las rutas del analizador de proyectos
register_analyzer_routes(app, get_user_workspace)

# Solo ejecutar la aplicación si este archivo es el punto de entrada
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)