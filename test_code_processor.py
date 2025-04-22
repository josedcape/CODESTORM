#!/usr/bin/env python3
"""
Script de prueba para el procesador de código.
Esto permite probar el módulo code_processor.py directamente desde la línea de comandos.
"""

import os
import json
import logging
import sys

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def main():
    """Función principal para probar el procesador de código"""
    
    # Importar el procesador de código
    try:
        from code_processor import process_code_improved
        print("Módulo code_processor importado correctamente.")
    except ImportError as e:
        print(f"Error al importar code_processor: {e}")
        return 1

    # Código de ejemplo para probar
    sample_code = """
def hello_world():
    print("Hello, world!")
    
hello_world()
"""

    # Datos de prueba
    test_data = {
        'code': sample_code,
        'instructions': 'Mejorar estilo y agregar documentación',
        'language': 'python',
        'model': 'openai'  # Cambiar a 'anthropic' o 'gemini' para probar otros modelos
    }
    
    print(f"Procesando código de prueba...")
    
    # Procesar el código
    try:
        result = process_code_improved(test_data)
        print(f"Procesamiento completado.")
        
        # Mostrar resultado
        if isinstance(result, tuple):
            print(f"Resultado con código de error: {result[1]}")
            print(json.dumps(result[0], indent=2, ensure_ascii=False))
        else:
            print("Resultado exitoso:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            
        return 0
    except Exception as e:
        print(f"Error al procesar el código: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())