import { CommandAnalysis } from '../types';

/**
 * Analiza la salida de un comando de terminal y proporciona información útil
 * @param command El comando ejecutado
 * @param output La salida del comando
 * @param status El estado de la ejecución (success, error, info, warning)
 * @param executionTime Tiempo de ejecución en milisegundos (opcional)
 * @returns Análisis del comando
 */
export function analyzeCommandOutput(
  command: string,
  output: string,
  status: string,
  executionTime?: number
): CommandAnalysis {
  // Valores predeterminados
  let analysis: CommandAnalysis = {
    isValid: status === 'success',
    summary: status === 'success' ? 'Comando ejecutado correctamente' : 'Error en la ejecución del comando',
    executionTime
  };

  // Analizar comandos específicos
  if (command.startsWith('python ')) {
    return analyzePythonCommand(command, output, status, executionTime);
  } else if (command.startsWith('npm ') || command.startsWith('yarn ')) {
    return analyzeNodeCommand(command, output, status, executionTime);
  } else if (command.includes('git ')) {
    return analyzeGitCommand(command, output, status, executionTime);
  } else if (command.startsWith('process_instruction')) {
    return analyzeProcessInstruction(command, output, status, executionTime);
  }

  // Análisis genérico para otros comandos
  if (status === 'error') {
    analysis.suggestions = [
      'Verifica la sintaxis del comando',
      'Asegúrate de que todas las dependencias estén instaladas'
    ];
    analysis.details = 'Se encontró un error durante la ejecución del comando.';
  }

  return analysis;
}

/**
 * Analiza comandos de Python
 */
function analyzePythonCommand(
  command: string,
  output: string,
  status: string,
  executionTime?: number
): CommandAnalysis {
  const analysis: CommandAnalysis = {
    isValid: status === 'success',
    summary: status === 'success' ? 'Script de Python ejecutado correctamente' : 'Error en el script de Python',
    executionTime
  };

  // Detectar errores comunes de Python
  if (status === 'error') {
    if (output.includes('ImportError') || output.includes('ModuleNotFoundError')) {
      analysis.summary = 'Error: Módulo no encontrado';
      analysis.details = 'El script intenta importar un módulo que no está instalado o no es accesible.';
      analysis.suggestions = [
        'Instala el módulo faltante con pip install',
        'Verifica que el entorno virtual esté activado si estás usando uno'
      ];
    } else if (output.includes('SyntaxError')) {
      analysis.summary = 'Error de sintaxis en el código Python';
      analysis.details = 'Hay un error de sintaxis en el código que impide su ejecución.';
      analysis.suggestions = [
        'Revisa la línea indicada en el mensaje de error',
        'Verifica paréntesis, comillas o indentación incorrecta'
      ];
    } else if (output.includes('IndentationError')) {
      analysis.summary = 'Error de indentación en el código Python';
      analysis.details = 'La indentación del código no es consistente.';
      analysis.suggestions = [
        'Asegúrate de usar espacios o tabulaciones de manera consistente',
        'Verifica la indentación en la línea indicada en el error'
      ];
    } else if (output.includes('TypeError')) {
      analysis.summary = 'Error de tipo en Python';
      analysis.details = 'Se está operando con tipos de datos incompatibles.';
      analysis.suggestions = [
        'Verifica los tipos de datos que estás utilizando',
        'Asegúrate de que las conversiones de tipo sean explícitas cuando sea necesario'
      ];
    }
  }

  // Detectar advertencias
  if (output.includes('DeprecationWarning') || output.includes('Warning')) {
    analysis.summary = 'Script ejecutado con advertencias';
    analysis.details = 'El script se ejecutó pero generó advertencias que podrían indicar problemas futuros.';
    analysis.isValid = true;
    analysis.suggestions = [
      'Revisa las advertencias para evitar problemas en el futuro',
      'Considera actualizar el código para usar métodos no obsoletos'
    ];
  }

  return analysis;
}

/**
 * Analiza comandos de Node.js (npm, yarn)
 */
function analyzeNodeCommand(
  command: string,
  output: string,
  status: string,
  executionTime?: number
): CommandAnalysis {
  const analysis: CommandAnalysis = {
    isValid: status === 'success',
    summary: status === 'success' ? 'Comando Node.js ejecutado correctamente' : 'Error en comando Node.js',
    executionTime
  };

  if (command.includes('install') || command.includes('add')) {
    if (status === 'success') {
      analysis.summary = 'Paquetes instalados correctamente';
      analysis.details = 'Todos los paquetes se instalaron sin errores.';
    } else {
      analysis.summary = 'Error al instalar paquetes';
      analysis.details = 'Hubo problemas durante la instalación de los paquetes.';
      analysis.suggestions = [
        'Verifica la conexión a internet',
        'Asegúrate de que los nombres de los paquetes sean correctos',
        'Comprueba si hay conflictos de versiones'
      ];
    }
  } else if (command.includes('start') || command.includes('dev')) {
    if (status === 'success') {
      analysis.summary = 'Aplicación iniciada correctamente';
    } else {
      analysis.summary = 'Error al iniciar la aplicación';
      analysis.suggestions = [
        'Verifica que todas las dependencias estén instaladas',
        'Comprueba los puertos en uso',
        'Revisa los logs para más detalles'
      ];
    }
  } else if (command.includes('build')) {
    if (status === 'success') {
      analysis.summary = 'Aplicación compilada correctamente';
    } else {
      analysis.summary = 'Error al compilar la aplicación';
      analysis.suggestions = [
        'Revisa los errores de sintaxis o tipado',
        'Verifica la configuración de compilación'
      ];
    }
  }

  return analysis;
}

/**
 * Analiza comandos de Git
 */
function analyzeGitCommand(
  command: string,
  output: string,
  status: string,
  executionTime?: number
): CommandAnalysis {
  const analysis: CommandAnalysis = {
    isValid: status === 'success',
    summary: status === 'success' ? 'Comando Git ejecutado correctamente' : 'Error en comando Git',
    executionTime
  };

  if (command.includes('git clone')) {
    if (status === 'success') {
      analysis.summary = 'Repositorio clonado correctamente';
    } else {
      analysis.summary = 'Error al clonar repositorio';
      analysis.suggestions = [
        'Verifica la URL del repositorio',
        'Comprueba tus permisos de acceso',
        'Asegúrate de tener conexión a internet'
      ];
    }
  } else if (command.includes('git pull')) {
    if (status === 'success') {
      analysis.summary = 'Cambios actualizados correctamente';
    } else {
      analysis.summary = 'Error al actualizar cambios';
      analysis.suggestions = [
        'Puede haber conflictos que necesitan resolverse',
        'Verifica que no haya cambios locales sin confirmar'
      ];
    }
  } else if (command.includes('git push')) {
    if (status === 'success') {
      analysis.summary = 'Cambios enviados correctamente';
    } else {
      analysis.summary = 'Error al enviar cambios';
      analysis.suggestions = [
        'Puede que necesites hacer pull primero',
        'Verifica tus permisos en el repositorio remoto'
      ];
    }
  }

  return analysis;
}

/**
 * Analiza comandos de procesamiento de instrucciones
 */
function analyzeProcessInstruction(
  command: string,
  output: string,
  status: string,
  executionTime?: number
): CommandAnalysis {
  const analysis: CommandAnalysis = {
    isValid: status === 'success',
    summary: status === 'success' ? 'Instrucción procesada correctamente' : 'Error al procesar instrucción',
    executionTime,
    resourceUsage: {
      cpu: '25%',
      memory: '150MB'
    }
  };

  if (status === 'info') {
    analysis.isValid = true;
    analysis.summary = 'Procesando instrucción...';
    analysis.details = 'La instrucción está siendo procesada por el modelo de IA seleccionado.';
  } else if (status === 'success') {
    if (output.includes('fallback')) {
      analysis.summary = 'Instrucción procesada con modelo alternativo';
      analysis.details = 'Se utilizó un modelo alternativo debido a limitaciones de cuota.';
    }
  } else if (status === 'error') {
    if (output.includes('quota')) {
      analysis.summary = 'Error de cuota en API';
      analysis.details = 'Se ha excedido la cuota de la API del modelo seleccionado.';
      analysis.suggestions = [
        'Intenta con un modelo alternativo',
        'Espera unos minutos antes de intentar nuevamente'
      ];
    } else {
      analysis.summary = 'Error al procesar la instrucción';
      analysis.suggestions = [
        'Verifica que la instrucción sea clara y específica',
        'Intenta reformular la instrucción'
      ];
    }
  }

  return analysis;
}
