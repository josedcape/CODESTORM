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
            elif ext in ['css', 'scss', 'sass']:
                language = 'css'
            elif ext in ['json']:
                language = 'json'
        
        # Estadísticas y configuración para procesamiento
        code_lines = code.count('\n') + 1
        is_large_file = code_lines > 500  # Consideramos grande si tiene más de 500 líneas
        logging.info(f"Procesando código de {code_lines} líneas en lenguaje {language} con modelo {model_choice}")
        
        # Preparar el prompt para el modelo según tamaño
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
        
        # Respuesta predeterminada (se sobreescribirá si el modelo funciona correctamente)
        response = {
            "corrected_code": code,
            "summary": ["No se pudieron procesar correcciones"],
            "explanation": "No se pudo completar el procesamiento"
        }

        # Procesar según el modelo seleccionado
        if model_choice == 'anthropic' and os.environ.get('ANTHROPIC_API_KEY'):
            try:
                # Importar bajo demanda
                from anthropic import Anthropic
                
                # Usar Anthropic Claude con configuración optimizada
                client = Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
                
                try:
                    completion = client.messages.create(
                        model="claude-3-5-sonnet-20241022",  # Modelo más avanzado para código extenso
                        max_tokens=is_large_file and 12000 or 4000,
                        temperature=0.2,
                        system="Eres un experto en programación y tu tarea es corregir y mejorar código. Responde siempre en JSON. Asegúrate de incluir el código completo en tu respuesta.",
                        messages=[{"role": "user", "content": prompt}]
                    )
                    
                    try:
                        # Extraer contenido JSON
                        json_content = completion.content[0].text if completion.content else ""
                        parsed_response = json.loads(json_content)
                        
                        # Validar campos requeridos
                        if "corrected_code" in parsed_response:
                            response = parsed_response
                        else:
                            logging.warning(f"Respuesta de Anthropic no contiene campo 'corrected_code': {json_content[:100]}...")
                            response["explanation"] = json_content
                            
                    except (json.JSONDecodeError, IndexError) as json_err:
                        logging.warning(f"Error al decodificar JSON de Anthropic: {str(json_err)}")
                        response["explanation"] = completion.content[0].text if completion.content else "No se pudo generar explicación"
                
                except Exception as api_error:
                    logging.error(f"Error en la llamada a la API de Anthropic: {str(api_error)}")
                    logging.info("Fallback a OpenAI debido a error en Anthropic API")
                    
                    # Si falla Anthropic, usamos OpenAI como respaldo
                    if os.environ.get("OPENAI_API_KEY"):
                        import openai
                        
                        openai_client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
                        
                        completion = openai_client.chat.completions.create(
                            model="gpt-4o",
                            response_format={"type": "json_object"},
                            temperature=0.2,
                            max_tokens=is_large_file and 4096 or 2048,
                            messages=[
                                {"role": "system", "content": "Eres un experto en programación y tu tarea es corregir y mejorar código. Responde siempre en JSON."},
                                {"role": "user", "content": prompt}
                            ]
                        )
                        
                        try:
                            parsed_response = json.loads(completion.choices[0].message.content)
                            if "corrected_code" in parsed_response:
                                response = parsed_response
                                response["model_used"] = "openai (fallback from anthropic)"
                            else:
                                logging.warning(f"Respuesta de OpenAI (fallback) no contiene código corregido")
                                response["explanation"] = completion.choices[0].message.content
                        except json.JSONDecodeError as json_err:
                            logging.warning(f"Error al decodificar JSON de OpenAI (fallback): {str(json_err)}")
                            response["explanation"] = completion.choices[0].message.content
                    else:
                        response["summary"] = ["Error al usar Anthropic API y no hay API key de OpenAI para fallback"]
                        response["explanation"] = "No se pudo procesar con Anthropic y no hay configuración de respaldo."
                    
            except Exception as e:
                logging.error(f"Error usando Anthropic: {str(e)}")
                response["summary"] = ["Error al usar Anthropic API: " + str(e)]
                response["explanation"] = "Se produjo un error al intentar utilizar la API de Anthropic para corregir el código."
                
        elif model_choice == 'gemini' and os.environ.get('GEMINI_API_KEY'):
            try:
                # Importar bajo demanda
                import google.generativeai as genai
                
                # Configurar y usar Google Gemini
                genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
                model = genai.GenerativeModel('gemini-1.5-pro')
                
                # Configuración optimizada
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
                    # Extraer y validar respuesta
                    parsed_response = json.loads(gemini_response.text)
                    if "corrected_code" in parsed_response:
                        response = parsed_response
                    else:
                        logging.warning(f"Respuesta de Gemini no contiene código corregido: {gemini_response.text[:100]}...")
                        response["explanation"] = gemini_response.text
                        
                except json.JSONDecodeError as json_err:
                    logging.warning(f"Error al decodificar JSON de Gemini: {str(json_err)}")
                    response["explanation"] = gemini_response.text
                    
            except Exception as e:
                logging.error(f"Error usando Gemini: {str(e)}")
                response["summary"] = ["Error al usar Gemini API: " + str(e)]
                response["explanation"] = "Se produjo un error al intentar utilizar la API de Google Gemini para corregir el código."
                
        else:  # OpenAI (predeterminado)
            try:
                # Importar bajo demanda
                import openai
                
                # Configurar y usar OpenAI
                openai_client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
                
                # Ajustar prompts y parámetros según el tamaño del archivo
                system_prompt = (
                    "Eres un experto en programación y tu tarea es corregir y mejorar código. "
                    "Responde siempre en JSON. "
                    + (is_large_file and "Este es un archivo grande; asegúrate de incluir TODO el código corregido completo." or "")
                )
                
                completion = openai_client.chat.completions.create(
                    model="gpt-4o",  # Modelo más reciente
                    response_format={"type": "json_object"},
                    temperature=0.2,
                    max_tokens=is_large_file and 4096 or 2048,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ]
                )
                
                try:
                    # Extraer y validar respuesta
                    parsed_response = json.loads(completion.choices[0].message.content)
                    if "corrected_code" in parsed_response:
                        response = parsed_response
                    else:
                        logging.warning(f"Respuesta de OpenAI no contiene código corregido")
                        response["explanation"] = completion.choices[0].message.content
                        
                except json.JSONDecodeError as json_err:
                    logging.warning(f"Error al decodificar JSON de OpenAI: {str(json_err)}")
                    response["explanation"] = completion.choices[0].message.content
                    
            except Exception as e:
                logging.error(f"Error usando OpenAI: {str(e)}")
                response["summary"] = ["Error al usar OpenAI API: " + str(e)]
                response["explanation"] = "Se produjo un error al intentar utilizar la API de OpenAI para corregir el código."
        
        # Normalizar respuesta: asegurar que tiene todos los campos necesarios
        if 'corrected_code' not in response or not response['corrected_code']:
            response['corrected_code'] = code
            
        if 'summary' not in response or not response['summary']:
            response['summary'] = ["No se generó resumen de cambios"]
            
        if 'explanation' not in response or not response['explanation']:
            response['explanation'] = "No se generó explicación detallada"
        
        # Incluir campos adicionales para frontend
        response['status'] = 'success'
        response['lines_processed'] = code_lines
        response['model_used'] = model_choice
        
        logging.info(f"Código procesado exitosamente con {len(response.get('summary', []))} cambios")
        return response
        
    except Exception as e:
        logging.error(f"Error processing code: {str(e)}")
        return {
            'error': str(e), 
            'status': 'error',
            'corrected_code': data.get('code', ''),
            'summary': ["Error al procesar el código: " + str(e)],
            'explanation': "Se produjo un error durante el procesamiento del código."
        }