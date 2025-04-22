# Corrector de código simplificado que solo devuelve el código corregido
import os
import logging
import openai

def correct_code(code, language, instructions="Mejora este código"):
    """
    Corrige y mejora el código utilizando OpenAI.
    Devuelve solo el código mejorado sin comentarios ni explicaciones.
    
    Args:
        code: El código a corregir
        language: El lenguaje de programación
        instructions: Instrucciones específicas para la mejora
        
    Returns:
        str: El código corregido
    """
    try:
        # Inicializar cliente de OpenAI
        openai_client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        
        # Crear un prompt específico para el corrector de código
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
        
        # Llamar a la API
        try:
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
            if response.startswith("```"):
                # Extraer el contenido entre las marcas de código
                response = response.split("```", 2)[1]
                if "\n" in response:
                    response = response.split("\n", 1)[1]  # Eliminar la primera línea si es el nombre del lenguaje
                
                # Eliminar la marca de cierre si existe
                if "```" in response:
                    response = response.rsplit("```", 1)[0]
            
            return response.strip()
            
        except Exception as api_error:
            logging.error(f"Error llamando a OpenAI: {str(api_error)}")
            return code  # Devolver el código original en caso de error
            
    except Exception as e:
        logging.error(f"Error en correct_code: {str(e)}")
        return code  # Devolver el código original en caso de error