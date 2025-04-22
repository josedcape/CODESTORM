# Corrector de código multimodelo simplificado que solo devuelve el código corregido
import os
import logging
import openai

def correct_code_with_multimodel(code, language, instructions="Mejora este código", model_choice="openai"):
    """
    Corrige y mejora el código utilizando el modelo de IA seleccionado.
    Devuelve solo el código mejorado sin comentarios ni explicaciones.
    Optimizado para manejar códigos de gran tamaño (hasta 50,000 caracteres).
    
    Args:
        code: El código a corregir
        language: El lenguaje de programación
        instructions: Instrucciones específicas para la mejora
        model_choice: Modelo a usar (openai, anthropic, gemini)
        
    Returns:
        str: El código corregido
    """
    # Registrar el tamaño del código para diagnóstico
    code_size = len(code)
    logging.info(f"Procesando código de {code_size} caracteres con modelo {model_choice}")
    
    # Si el código es extremadamente grande y tiene múltiples funciones/secciones,
    # consideramos procesarlo por partes
    if code_size > 50000 and "\n\n" in code:
        logging.warning(f"Código extremadamente grande ({code_size} caracteres), procesando por secciones")
        return process_large_code_in_sections(code, language, instructions, model_choice)
    
    # Crear un prompt común para todos los modelos
    prompt = f"""
Eres un asistente experto en desarrollo y gestión de código para diferentes lenguajes de programación.
Tu tarea es mejorar el siguiente código en {language} según estas instrucciones: {instructions}

CÓDIGO ORIGINAL:
```{language}
{code}
```

IMPORTANTE: Devuelve SOLO el código mejorado sin ningún comentario, explicación ni formato adicional.
No uses markdown ni añadas nada más que el código puro.
"""

    # Procesar según el modelo seleccionado
    if model_choice == "openai":
        return correct_with_openai(code, language, prompt)
    elif model_choice == "anthropic":
        response = correct_with_anthropic(code, language, prompt)
        if response != code:  # Si Anthropic funcionó correctamente
            return response
        # Si falló Anthropic, usamos OpenAI como respaldo
        logging.warning("Anthropic falló, usando OpenAI como respaldo")
        return correct_with_openai(code, language, prompt)
    elif model_choice == "gemini":
        response = correct_with_gemini(code, language, prompt)
        if response != code:  # Si Gemini funcionó correctamente
            return response
        # Si falló Gemini, usamos OpenAI como respaldo
        logging.warning("Gemini falló, usando OpenAI como respaldo")
        return correct_with_openai(code, language, prompt)
    else:
        # Modelo no reconocido, usar OpenAI por defecto
        logging.warning(f"Modelo '{model_choice}' no reconocido, usando OpenAI")
        return correct_with_openai(code, language, prompt)
        
def process_large_code_in_sections(code, language, instructions, model_choice):
    """
    Procesa código extremadamente grande dividiéndolo en secciones lógicas.
    Especialmente útil para archivos de más de 50,000 caracteres que pueden
    contener múltiples clases o funciones.
    
    Args:
        code: Código extremadamente grande a procesar
        language: Lenguaje del código
        instructions: Instrucciones para la mejora
        model_choice: Modelo a utilizar
        
    Returns:
        str: Código completo procesado
    """
    # División por bloques lógicos (clases, funciones, etc.)
    # La estrategia depende del lenguaje
    sections = []
    
    if language.lower() in ['python', 'py']:
        # Para Python, dividir por clases y funciones (identificadas por líneas que empiezan con 'def ' o 'class ')
        lines = code.split('\n')
        current_section = []
        current_section_size = 0
        max_section_size = 20000  # Tamaño máximo de cada sección en caracteres
        
        for line in lines:
            # Si encontramos una nueva definición de clase o función y la sección actual ya tiene contenido sustancial
            if (line.startswith('def ') or line.startswith('class ')) and current_section_size > 5000:
                # Guardar la sección actual si existe
                if current_section:
                    sections.append('\n'.join(current_section))
                # Iniciar nueva sección
                current_section = [line]
                current_section_size = len(line)
            else:
                # Agregar a la sección actual
                current_section.append(line)
                current_section_size += len(line) + 1  # +1 por el salto de línea
                
                # Si la sección actual es demasiado grande, cerrarla
                if current_section_size >= max_section_size:
                    sections.append('\n'.join(current_section))
                    current_section = []
                    current_section_size = 0
        
        # Agregar la última sección si existe
        if current_section:
            sections.append('\n'.join(current_section))
            
    elif language.lower() in ['javascript', 'js', 'typescript', 'ts']:
        # Para JavaScript/TypeScript, dividir por funciones, clases y bloques
        lines = code.split('\n')
        current_section = []
        current_section_size = 0
        max_section_size = 20000
        
        for line in lines:
            # Nueva función, clase o bloque grande y la sección actual ya tiene contenido sustancial
            line_content = line.strip() if hasattr(line, 'strip') else ""
            
            if current_section_size > 5000 and (
                line_content.startswith('function ') or 
                line_content.startswith('class ') or 
                (line_content.startswith('const ') and ' = function' in line_content) or
                (line_content.startswith('let ') and ' = function' in line_content) or
                (line_content.startswith('var ') and ' = function' in line_content)
            ):
                # Guardar la sección actual
                if current_section:
                    sections.append('\n'.join(current_section))
                # Iniciar nueva sección
                current_section = [line]
                current_section_size = len(line)
            else:
                # Agregar a la sección actual
                current_section.append(line)
                current_section_size += len(line) + 1
                
                # Si la sección actual es demasiado grande, cerrarla
                if current_section_size >= max_section_size:
                    sections.append('\n'.join(current_section))
                    current_section = []
                    current_section_size = 0
        
        # Agregar la última sección
        if current_section:
            sections.append('\n'.join(current_section))
    
    else:
        # Para otros lenguajes, dividir por bloques de líneas
        lines = code.split('\n')
        section = []
        section_size = 0
        max_section_size = 20000
        
        for line in lines:
            section.append(line)
            section_size += len(line) + 1
            
            # Si llegamos al tamaño máximo o hay una línea en blanco después de cierto tamaño
            if section_size >= max_section_size or (line.strip() == '' and section_size > 5000):
                sections.append('\n'.join(section))
                section = []
                section_size = 0
                
        # Agregar la última sección
        if section:
            sections.append('\n'.join(section))
    
    # Si no se pudo dividir, procesarlo como un solo bloque
    if not sections:
        logging.warning("No se pudo dividir el código en secciones lógicas, procesando como bloque único")
        return correct_code_with_multimodel(code, language, instructions, model_choice)
    
    # Procesar cada sección
    processed_sections = []
    logging.info(f"Procesando código por secciones: {len(sections)} secciones identificadas")
    
    for i, section in enumerate(sections):
        logging.info(f"Procesando sección {i+1}/{len(sections)} ({len(section)} caracteres)")
        # Ajustar instrucciones para cada sección
        section_instructions = f"{instructions} - Esta es la sección {i+1} de {len(sections)}, mantén la estructura y asegúrate de que se integre con el resto."
        
        # Evitar el procesamiento recursivo usando el modelo directamente
        if model_choice == "openai":
            processed = correct_with_openai(section, language, create_prompt(section, language, section_instructions))
        elif model_choice == "anthropic":
            processed = correct_with_anthropic(section, language, create_prompt(section, language, section_instructions))
        elif model_choice == "gemini":
            processed = correct_with_gemini(section, language, create_prompt(section, language, section_instructions))
        else:
            processed = correct_with_openai(section, language, create_prompt(section, language, section_instructions))
            
        processed_sections.append(processed)
    
    # Combinar todas las secciones procesadas
    return '\n\n'.join(processed_sections)

def create_prompt(code, language, instructions):
    """Crea un prompt estandarizado para procesar código"""
    return f"""
Eres un asistente experto en desarrollo y gestión de código para diferentes lenguajes de programación.
Tu tarea es mejorar el siguiente código en {language} según estas instrucciones: {instructions}

CÓDIGO ORIGINAL:
```{language}
{code}
```

IMPORTANTE: Devuelve SOLO el código mejorado sin ningún comentario, explicación ni formato adicional.
No uses markdown ni añadas nada más que el código puro.
"""

def correct_with_openai(code, language, prompt):
    """Corrige el código utilizando OpenAI"""
    try:
        # Si el código es muy grande, podría causar problemas, truncar a un tamaño razonable
        max_code_size = 8000  # Máximo tamaño de código para evitar problemas de memoria
        if len(code) > max_code_size:
            logging.warning(f"Código muy extenso ({len(code)} caracteres), truncando a {max_code_size} caracteres")
            # Dividir por líneas para no cortar en medio de una instrucción
            lines = code.split('\n')
            truncated_code = ""
            current_size = 0
            
            for line in lines:
                if current_size + len(line) + 1 > max_code_size:
                    break
                truncated_code += line + '\n'
                current_size += len(line) + 1
                
            code = truncated_code
            prompt = prompt.replace("CÓDIGO ORIGINAL:", f"CÓDIGO ORIGINAL (TRUNCADO POR TAMAÑO):")
        
        # Inicializar cliente de OpenAI
        openai_client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        
        # Asegurarse de no pasar un contexto demasiado grande
        total_content_size = len(prompt)
        if total_content_size > 12000:  # Si el prompt es demasiado grande
            logging.warning(f"Prompt muy extenso ({total_content_size} caracteres), truncando")
            # Estimar cuánto necesitamos reducir
            max_prompt_size = 12000
            # Extraer solo las líneas de código más importantes
            start_code = "```" + language + "\n"
            end_code = "\n```"
            before_code = prompt.split(start_code)[0] + start_code
            actual_code = code
            after_code = end_code + "\n\nIMPORTANTE: Devuelve SOLO el código mejorado sin ningún comentario, explicación ni formato adicional."
            
            # Calcular cuánto espacio tenemos para el código
            available_code_size = max_prompt_size - len(before_code) - len(after_code)
            if available_code_size < 1000:  # Si es demasiado pequeño
                available_code_size = 1000
                
            if len(actual_code) > available_code_size:
                # Truncar el código para que quepa
                lines = actual_code.split('\n')
                truncated_code = ""
                current_size = 0
                
                for line in lines:
                    if current_size + len(line) + 1 > available_code_size:
                        break
                    truncated_code += line + '\n'
                    current_size += len(line) + 1
                    
                actual_code = truncated_code
                
            # Reconstruir el prompt con el código truncado
            prompt = before_code + actual_code + after_code
        
        # Llamar a la API con timeout y manejo de errores
        try:
            # Usa un modelo más pequeño para evitar problemas de memoria y timeouts
            completion = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",  # Cambiar a un modelo más rápido y con menos probabilidad de errores de memoria
                messages=[
                    {"role": "system", "content": "Eres un experto en desarrollo y gestión de código. Solo devuelves código mejorado sin comentarios adicionales."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Más determinístico
                max_tokens=2048  # Limitar tokens de salida
            )
            
            # Extraer solo el código de la respuesta
            response = completion.choices[0].message.content.strip()
            
        except Exception as api_error:
            logging.error(f"Error llamando a OpenAI con gpt-3.5-turbo: {str(api_error)}")
            # Intentar con un caso más simple - solo las primeras 100 líneas
            if '\n' in code:
                simpler_code = '\n'.join(code.split('\n')[:100])
                simpler_prompt = f"""
Eres un experto en desarrollo y gestión de código para diferentes lenguajes de programación.
Tu tarea es mejorar las primeras 100 líneas del siguiente código en {language}.

CÓDIGO ORIGINAL (PRIMERAS 100 LÍNEAS):
```{language}
{simpler_code}
```

IMPORTANTE: Devuelve SOLO el código mejorado sin ningún comentario, explicación ni formato adicional.
"""
                
                try:
                    simpler_completion = openai_client.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=[
                            {"role": "system", "content": "Solo devuelve código mejorado. Nada más."},
                            {"role": "user", "content": simpler_prompt}
                        ],
                        temperature=0.1,
                        max_tokens=1000
                    )
                    response = simpler_completion.choices[0].message.content.strip()
                except Exception as e:
                    logging.error(f"Error en intento simplificado: {str(e)}")
                    # Si todo falla, devolver el código original
                    return code
            else:
                # Si no hay saltos de línea, el código es demasiado simple para causar problemas
                return code
        
        # Limpiar posibles marcadores de código markdown
        response = clean_markdown_code(response)
        
        return response
        
    except Exception as e:
        logging.error(f"Error global en correct_with_openai: {str(e)}")
        return code  # Devolver el código original en caso de error

def correct_with_anthropic(code, language, prompt):
    """Corrige el código utilizando Anthropic Claude"""
    try:
        # Si el código es muy grande, podría causar problemas, truncar a un tamaño razonable
        max_code_size = 10000  # Claude puede manejar más tokens que GPT
        if len(code) > max_code_size:
            logging.warning(f"Código muy extenso para Claude ({len(code)} caracteres), truncando a {max_code_size} caracteres")
            # Dividir por líneas para no cortar en medio de una instrucción
            lines = code.split('\n')
            truncated_code = ""
            current_size = 0
            
            for line in lines:
                if current_size + len(line) + 1 > max_code_size:
                    break
                truncated_code += line + '\n'
                current_size += len(line) + 1
                
            code = truncated_code
            prompt = prompt.replace("CÓDIGO ORIGINAL:", f"CÓDIGO ORIGINAL (TRUNCADO POR TAMAÑO):")
        
        from anthropic import Anthropic
        
        # Verificar si tenemos la API key
        anthropic_api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not anthropic_api_key:
            logging.error("Anthropic API key no configurada")
            return code
        
        # Inicializar cliente de Anthropic
        client = Anthropic(api_key=anthropic_api_key)
        
        # Llamar a la API con manejo de errores
        try:
            completion = client.messages.create(
                model="claude-3-5-sonnet-20241022",  # the newest Anthropic model is "claude-3-5-sonnet-20241022" which was released October 22, 2024.
                max_tokens=4000,
                temperature=0.1,
                system="Eres un experto en desarrollo y gestión de código. Solo devuelves código mejorado sin comentarios adicionales.",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Extraer solo el código de la respuesta
            response = completion.content[0].text.strip()
            
            # Limpiar posibles marcadores de código markdown
            response = clean_markdown_code(response)
            
            return response
            
        except Exception as api_error:
            logging.error(f"Error llamando a Anthropic: {str(api_error)}")
            # Si falla, intentar con un prompt más simple
            if '\n' in code:
                simpler_code = '\n'.join(code.split('\n')[:100])
                simpler_prompt = f"""
Mejora las primeras 100 líneas del siguiente código en {language}.

CÓDIGO ORIGINAL (PRIMERAS 100 LÍNEAS):
```{language}
{simpler_code}
```

IMPORTANTE: Devuelve SOLO el código mejorado sin ningún comentario, explicación ni formato adicional.
"""
                
                try:
                    simpler_completion = client.messages.create(
                        model="claude-3-5-sonnet-20241022",
                        max_tokens=2000,
                        temperature=0.1,
                        system="Solo devuelve código mejorado. Nada más.",
                        messages=[
                            {"role": "user", "content": simpler_prompt}
                        ]
                    )
                    response = simpler_completion.content[0].text.strip()
                    return clean_markdown_code(response)
                except Exception as e:
                    logging.error(f"Error en intento simplificado con Claude: {str(e)}")
                    return code
            
            return code  # Si todo falla, devolver el código original
        
    except Exception as e:
        logging.error(f"Error global en correct_with_anthropic: {str(e)}")
        return code  # Devolver el código original en caso de error

def correct_with_gemini(code, language, prompt):
    """Corrige el código utilizando Google Gemini"""
    try:
        # Si el código es muy grande, podría causar problemas, truncar a un tamaño razonable
        max_code_size = 15000  # Gemini puede manejar más tokens que GPT
        if len(code) > max_code_size:
            logging.warning(f"Código muy extenso para Gemini ({len(code)} caracteres), truncando a {max_code_size} caracteres")
            # Dividir por líneas para no cortar en medio de una instrucción
            lines = code.split('\n')
            truncated_code = ""
            current_size = 0
            
            for line in lines:
                if current_size + len(line) + 1 > max_code_size:
                    break
                truncated_code += line + '\n'
                current_size += len(line) + 1
                
            code = truncated_code
            prompt = prompt.replace("CÓDIGO ORIGINAL:", f"CÓDIGO ORIGINAL (TRUNCADO POR TAMAÑO):")
        
        import google.generativeai as genai
        
        # Verificar si tenemos la API key
        gemini_api_key = os.environ.get("GEMINI_API_KEY")
        if not gemini_api_key:
            logging.error("Gemini API key no configurada")
            return code
        
        # Inicializar cliente de Gemini
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        try:
            # Crear sistema y mensaje de usuario
            system_prompt = "Eres un experto en desarrollo y gestión de código. Solo devuelves código mejorado sin comentarios adicionales."
            full_prompt = system_prompt + "\n\n" + prompt
            
            # Llamar a la API
            response = model.generate_content(full_prompt)
            
            # Extraer solo el código de la respuesta
            result = response.text.strip()
            
            # Limpiar posibles marcadores de código markdown
            result = clean_markdown_code(result)
            
            return result
            
        except Exception as api_error:
            logging.error(f"Error llamando a Gemini: {str(api_error)}")
            # Si falla, intentar con un prompt más simple
            if '\n' in code:
                simpler_code = '\n'.join(code.split('\n')[:100])
                simpler_prompt = f"""
Mejora las primeras 100 líneas del siguiente código en {language}.

CÓDIGO ORIGINAL (PRIMERAS 100 LÍNEAS):
```{language}
{simpler_code}
```

IMPORTANTE: Devuelve SOLO el código mejorado sin ningún comentario, explicación ni formato adicional.
"""
                
                try:
                    simpler_system_prompt = "Solo devuelve código mejorado. Nada más."
                    full_simpler_prompt = simpler_system_prompt + "\n\n" + simpler_prompt
                    simpler_response = model.generate_content(full_simpler_prompt)
                    simpler_result = simpler_response.text.strip()
                    return clean_markdown_code(simpler_result)
                except Exception as e:
                    logging.error(f"Error en intento simplificado con Gemini: {str(e)}")
                    return code
            
            return code  # Si todo falla, devolver el código original
        
    except Exception as e:
        logging.error(f"Error global en correct_with_gemini: {str(e)}")
        return code  # Devolver el código original en caso de error

def clean_markdown_code(text):
    """Limpia marcadores de markdown de código"""
    # Si el texto comienza con marcadores de código
    if "```" in text:
        # Extraer el contenido entre las marcas de código
        parts = text.split("```", 2)
        if len(parts) > 2:
            code_block = parts[1]
            # Eliminar la primera línea si es el nombre del lenguaje
            if "\n" in code_block:
                if not code_block.startswith("\n"):
                    code_block = code_block.split("\n", 1)[1]
            return code_block.strip()
    
    return text.strip()