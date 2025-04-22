# Import common dependencies
import os
import json
import logging
from flask import jsonify

# Import these only when needed to avoid import errors at module level
# when these dependencies are accessed through app.py's imports

def process_code_improved(data):
    """Versión mejorada para procesar código para correcciones y mejoras."""
    try:
        code = data.get('code', '')
        file_path = data.get('file_path', '')
        instructions = data.get('instructions', 'Corrige errores y mejora la calidad del código')
        language = data.get('language', 'unknown')
        model_choice = data.get('model', 'openai')
        
        if not code:
            return jsonify({'error': 'No se proporcionó código para procesar'}), 400
            
        # Detectar el lenguaje por la extensión del archivo si no se especificó
        if language == 'unknown' and file_path:
            ext = file_path.split('.')[-1].lower() if '.' in file_path else ''
            if ext in ['py', 'pyw']:
                language = 'python'
            elif ext in ['js', 'ts', 'jsx', 'tsx']:
                language = 'javascript'
            elif ext in ['html', 'htm']:
                language = 'html'
            elif ext in ['css', 'scss', 'sass']:
                language = 'css'
            elif ext in ['json']:
                language = 'json'
                
        # Calcular longitud aproximada del código para determinar si necesitamos tratamiento especial
        code_lines = code.count('\n') + 1
        is_large_file = code_lines > 500  # Consideramos grande si tiene más de 500 líneas
        
        logging.info(f"Procesando código de {code_lines} líneas en lenguaje {language} con modelo {model_choice}")
        
        # Preparar el prompt para el modelo, ajustando según el tamaño del código
        if is_large_file:
            prompt = f"""Eres un experto corrector de código en {language} especializado en refactorización de código extenso.
            
            El siguiente código tiene {code_lines} líneas. Analízalo y realiza correcciones y mejoras siguiendo estas instrucciones:
            {instructions}
            
            Código original:
            ```{language}
            {code}
            ```
            
            Por favor, proporciona:
            1. El código corregido completo (es crítico que incluyas TODO el código, no resúmenes ni versiones parciales)
            2. Un resumen de los cambios realizados (máximo 10 puntos)
            3. Una explicación detallada de las correcciones y mejoras principales
            
            Formato de respuesta:
            {{
              "corrected_code": "código corregido aquí con todas las líneas incluidas", 
              "summary": ["punto 1", "punto 2", ...], 
              "explanation": "explicación detallada aquí"
            }}
            """
        else:
            prompt = f"""Eres un experto corrector de código en {language}. 
            
            Analiza el siguiente código y realiza correcciones y mejoras siguiendo estas instrucciones:
            {instructions}
            
            Código original:
            ```{language}
            {code}
            ```
            
            Por favor, proporciona:
            1. El código corregido
            2. Un resumen de los cambios realizados (máximo 5 puntos)
            3. Una explicación detallada de las correcciones y mejoras
            
            Formato de respuesta:
            {{
              "corrected_code": "código corregido aquí", 
              "summary": ["punto 1", "punto 2", ...], 
              "explanation": "explicación detallada aquí"
            }}
            """
        
        # Utilizar el modelo seleccionado
        response = {}

        if model_choice == 'anthropic' and os.environ.get('ANTHROPIC_API_KEY'):
            try:
                # Importar bajo demanda para evitar errores de importación
                from anthropic import Anthropic
                
                # Usar Anthropic Claude con configuración optimizada para código extenso
                client = Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
                completion = client.messages.create(
                    model="claude-3-5-sonnet-20241022",  # Modelo más avanzado para códigos extensos
                    max_tokens=is_large_file and 12000 or 4000,  # Aumentar tokens si es código grande
                    temperature=0.2,
                    system="Eres un experto en programación y tu tarea es corregir y mejorar código. Responde siempre en JSON. Asegúrate de incluir el código completo en tu respuesta.",
                    messages=[{"role": "user", "content": prompt}]
                )
                try:
                    response = json.loads(completion.content[0].text)
                except (json.JSONDecodeError, IndexError):
                    # Si no podemos analizar JSON, devolver el texto completo
                    response = {
                        "corrected_code": code,  # Mantener el código original
                        "summary": ["No se pudieron procesar las correcciones"],
                        "explanation": completion.content[0].text if completion.content else "No se pudo generar explicación"
                    }
            except Exception as e:
                logging.error(f"Error usando Anthropic: {str(e)}")
                response = {
                    "corrected_code": code,
                    "summary": ["Error al usar Anthropic API: " + str(e)],
                    "explanation": "Se produjo un error al intentar utilizar la API de Anthropic para corregir el código."
                }
                
        elif model_choice == 'gemini' and os.environ.get('GEMINI_API_KEY'):
            try:
                # Importar bajo demanda
                import google.generativeai as genai
                
                # Usar Google Gemini con configuración optimizada
                genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
                model = genai.GenerativeModel('gemini-1.5-pro')
                
                # Configuraciones específicas para Gemini
                generation_config = {
                    "temperature": 0.2,
                    "max_output_tokens": is_large_file and 8192 or 4096,
                    "top_p": 0.95,
                    "top_k": 40
                }
                
                gemini_response = model.generate_content(
                    prompt,
                    generation_config=generation_config
                )
                
                try:
                    response = json.loads(gemini_response.text)
                except json.JSONDecodeError:
                    # Intentar extraer JSON si está en un formato no estándar
                    response = {
                        "corrected_code": code,  # Mantener el código original
                        "summary": ["No se pudieron procesar las correcciones"],
                        "explanation": gemini_response.text
                    }
            except Exception as e:
                logging.error(f"Error usando Gemini: {str(e)}")
                response = {
                    "corrected_code": code,
                    "summary": ["Error al usar Gemini API: " + str(e)],
                    "explanation": "Se produjo un error al intentar utilizar la API de Google Gemini para corregir el código."
                }
                
        else:
            try:
                # Importar bajo demanda para OpenAI
                import openai
                
                # Usar OpenAI como valor predeterminado
                openai_client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
                
                # Configuraciones específicas para código extenso
                completion = openai_client.chat.completions.create(
                    model="gpt-4o", # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
                    response_format={"type": "json_object"},
                    temperature=0.2,
                    max_tokens=is_large_file and 4096 or 2048,  # Ajustar tokens según tamaño
                    messages=[
                        {"role": "system", "content": "Eres un experto en programación y tu tarea es corregir y mejorar código. "
                                                    + "Responde siempre en JSON. "
                                                    + (is_large_file and "Este es un archivo grande; asegúrate de incluir TODO el código corregido completo." or "")},
                        {"role": "user", "content": prompt}
                    ]
                )
                
                try:
                    response = json.loads(completion.choices[0].message.content)
                except json.JSONDecodeError:
                    response = {
                        "corrected_code": code,  # Mantener el código original
                        "summary": ["No se pudieron procesar las correcciones"],
                        "explanation": completion.choices[0].message.content
                    }
            except Exception as e:
                logging.error(f"Error usando OpenAI: {str(e)}")
                response = {
                    "corrected_code": code,
                    "summary": ["Error al usar OpenAI API: " + str(e)],
                    "explanation": "Se produjo un error al intentar utilizar la API de OpenAI para corregir el código."
                }
        
        # Asegurar que todos los campos necesarios estén presentes
        if 'corrected_code' not in response:
            response['corrected_code'] = code
        if 'summary' not in response:
            response['summary'] = ["No se generó resumen de cambios"]
        if 'explanation' not in response:
            response['explanation'] = "No se generó explicación detallada"
        
        logging.info(f"Código procesado exitosamente con {len(response.get('summary', []))} cambios")
        return response
        
    except Exception as e:
        logging.error(f"Error processing code: {str(e)}")
        return {'error': str(e)}