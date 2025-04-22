# Corrector de código multimodelo simplificado que solo devuelve el código corregido
import os
import logging
import openai

def correct_code_with_multimodel(code, language, instructions="Mejora este código", model_choice="openai"):
    """
    Corrige y mejora el código utilizando el modelo de IA seleccionado.
    Devuelve solo el código mejorado sin comentarios ni explicaciones.
    
    Args:
        code: El código a corregir
        language: El lenguaje de programación
        instructions: Instrucciones específicas para la mejora
        model_choice: Modelo a usar (openai, anthropic, gemini)
        
    Returns:
        str: El código corregido
    """
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

def correct_with_openai(code, language, prompt):
    """Corrige el código utilizando OpenAI"""
    try:
        # Inicializar cliente de OpenAI
        openai_client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        
        # Llamar a la API
        completion = openai_client.chat.completions.create(
            model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
            messages=[
                {"role": "system", "content": "Eres un experto en desarrollo y gestión de código. Solo devuelves código mejorado sin comentarios adicionales."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,  # Más determinístico
            max_tokens=4000
        )
        
        # Extraer solo el código de la respuesta
        response = completion.choices[0].message.content.strip()
        
        # Limpiar posibles marcadores de código markdown
        response = clean_markdown_code(response)
        
        return response
        
    except Exception as e:
        logging.error(f"Error llamando a OpenAI: {str(e)}")
        return code  # Devolver el código original en caso de error

def correct_with_anthropic(code, language, prompt):
    """Corrige el código utilizando Anthropic Claude"""
    try:
        from anthropic import Anthropic
        
        # Verificar si tenemos la API key
        anthropic_api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not anthropic_api_key:
            logging.error("Anthropic API key no configurada")
            return code
        
        # Inicializar cliente de Anthropic
        client = Anthropic(api_key=anthropic_api_key)
        
        # Llamar a la API
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
        
    except Exception as e:
        logging.error(f"Error llamando a Anthropic: {str(e)}")
        return code  # Devolver el código original en caso de error

def correct_with_gemini(code, language, prompt):
    """Corrige el código utilizando Google Gemini"""
    try:
        import google.generativeai as genai
        
        # Verificar si tenemos la API key
        gemini_api_key = os.environ.get("GEMINI_API_KEY")
        if not gemini_api_key:
            logging.error("Gemini API key no configurada")
            return code
        
        # Inicializar cliente de Gemini
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel('gemini-1.5-pro')
        
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
        
    except Exception as e:
        logging.error(f"Error llamando a Gemini: {str(e)}")
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