# Import common dependencies
import os
import json
import logging

def process_code_improved(data):
    """
    Versión mejorada para procesar código para correcciones y mejoras.
    
    Args:
        data (dict): Diccionario con los datos del código a procesar:
            - code: Código a analizar y mejorar
            - file_path (opcional): Ruta del archivo
            - instructions: Instrucciones para la mejora
            - language: Lenguaje del código
            - model: Modelo de IA a utilizar (openai, anthropic, gemini)
            
    Returns:
        dict: Resultado del procesamiento con el código corregido, resumen y explicación
    """
    try:
        # Extraer los datos de entrada
        code = data.get('code', '')
        file_path = data.get('file_path', '')
        instructions = data.get('instructions', 'Corrige errores y mejora la calidad del código')
        language = data.get('language', 'unknown')
        model_choice = data.get('model', 'openai')
        
        # Siempre usar OpenAI para garantizar estabilidad (forzamos esto debido a problemas con otros modelos)
        model_choice = 'openai'
        
        # Validación inicial
        if not code:
            logging.warning("No se proporcionó código para procesar")
            return {'error': 'No se proporcionó código para procesar', 'status': 'error'}, 400
            
        # Autodetección de lenguaje por extensión si no se especificó
        if language == 'unknown' and file_path:
            ext = file_path.split('.')[-1].lower() if '.' in file_path else ''
            if ext in ['py', 'pyw']:
                language = 'python'
            elif ext in ['js', 'ts', 'jsx', 'tsx']:
                language = 'javascript'
            elif ext in ['html', 'htm']:
                language = 'html'
            elif ext in ['css']:
                language = 'css'
            elif ext in ['java']:
                language = 'java'
            elif ext in ['c', 'cpp', 'h', 'hpp']:
                language = 'c++'
            elif ext in ['cs']:
                language = 'csharp'
            elif ext in ['php']:
                language = 'php'
            elif ext in ['rb']:
                language = 'ruby'
            elif ext in ['go']:
                language = 'go'
            elif ext in ['rs']:
                language = 'rust'
            elif ext in ['swift']:
                language = 'swift'
            elif ext in ['kt', 'kts']:
                language = 'kotlin'
            elif ext in ['sql']:
                language = 'sql'
            elif ext in ['sh', 'bash']:
                language = 'bash'
            elif ext in ['json']:
                language = 'json'
            elif ext in ['yml', 'yaml']:
                language = 'yaml'
        
        # Preparar el prompt para el análisis con contexto adicional
        logging.info(f"Preparando prompt para análisis de código {language}")
        
        # Añadir contexto adicional según el lenguaje detectado
        if language == 'python':
            language_context = "Este código está escrito en Python. Verifica imports, indentación, docstrings y tipo de variables."
        elif language in ['javascript', 'typescript']:
            language_context = "Este código está escrito en JavaScript/TypeScript. Verifica sintaxis, promesas, async/await y mejores prácticas."
        elif language == 'html':
            language_context = "Este código es HTML. Verifica estructura, accesibilidad, tags anidados y atributos."
        elif language == 'css':
            language_context = "Este código es CSS. Verifica selectores, propiedades, media queries y optimizaciones."
        else:
            language_context = f"Este código está escrito en {language}. Verifica sintaxis y mejores prácticas del lenguaje."
            
        # Determinar si es un archivo grande y ajustar prompt
        code_lines = len(code.split('\n'))
        is_large_file = code_lines > 100
        
        if is_large_file:
            logging.info(f"Archivo grande detectado: {code_lines} líneas")
            size_context = "Este es un archivo grande, enfócate en problemas críticos y proporciona recomendaciones para mejoras clave."
        else:
            size_context = "Realiza un análisis completo del código proporcionado."
            
        # Crear el prompt principal
        prompt = f"""
{language_context}
{size_context}

INSTRUCCIONES: {instructions}

CÓDIGO A ANALIZAR:
```{language}
{code}
```

Por favor, analiza este código y proporciona:
1. La versión corregida/mejorada del código
2. Un resumen de los cambios realizados
3. Una explicación detallada de los problemas detectados y las soluciones implementadas

RESPUESTA EN FORMATO JSON con la siguiente estructura:
{{
  "corrected_code": "código corregido completo aquí",
  "summary": ["punto 1", "punto 2", ...],
  "explanation": "explicación detallada aquí"
}}
"""
        
        # Respuesta predeterminada (se sobreescribirá si el modelo funciona correctamente)
        response = {
            "corrected_code": code,
            "summary": ["No se pudieron procesar correcciones"],
            "explanation": "No se pudo completar el procesamiento"
        }

        # Usar OpenAI con configuración optimizada para código
        try:
            import openai
            openai_client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
            
            # Ejecutar la llamada a la API con manejo de errores
            try:
                completion = openai_client.chat.completions.create(
                    model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
                    response_format={"type": "json_object"},
                    temperature=0.2,
                    max_tokens=is_large_file and 4096 or 2048,
                    messages=[
                        {"role": "system", "content": "Eres un experto en programación y tu tarea es corregir y mejorar código. Responde siempre en JSON."},
                        {"role": "user", "content": prompt}
                    ]
                )
                
                # Extraer y procesar respuesta
                response = json.loads(completion.choices[0].message.content)
                
            except Exception as api_err:
                logging.error(f"Error en la API de OpenAI: {str(api_err)}")
                response["explanation"] = f"Error al conectar con OpenAI: {str(api_err)}"
                
        except ImportError as e:
            logging.error(f"Error al importar OpenAI: {str(e)}")
            response["explanation"] = f"Error de importación OpenAI: {str(e)}"
            
        # Añadir información de depuración al resultado
        response["meta"] = {
            "model_used": "openai",  # Siempre usamos OpenAI para estabilidad
            "language_detected": language,
            "instruction_length": len(instructions),
            "code_lines": code_lines
        }
            
        return response
        
    except Exception as e:
        logging.error(f"Error global en process_code_improved: {str(e)}", exc_info=True)
        return {'error': str(e), 'status': 'error'}