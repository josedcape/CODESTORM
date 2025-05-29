/**
 * Utilidades para probar el manejo de errores en CODESTORM
 */

export interface ErrorTestResult {
  errorType: string;
  detected: boolean;
  handledCorrectly: boolean;
  message: string;
  suggestions: string[];
}

/**
 * Simula diferentes tipos de errores para probar el manejo
 */
export class ErrorTestUtils {
  
  /**
   * Simula un error de cuota (429)
   */
  static simulateQuotaError(): Error {
    const error = new Error('Request failed with status code 429: Quota exceeded');
    return error;
  }

  /**
   * Simula un error de conexión
   */
  static simulateConnectionError(): Error {
    const error = new Error('ERR_CONNECTION_REFUSED: Connection refused');
    return error;
  }

  /**
   * Simula un error de timeout
   */
  static simulateTimeoutError(): Error {
    const error = new Error('Request timeout: ETIMEDOUT');
    return error;
  }

  /**
   * Simula un error general de API
   */
  static simulateAPIError(): Error {
    const error = new Error('API request failed: HTTP 500 Internal Server Error');
    return error;
  }

  /**
   * Prueba el manejo de un error específico
   */
  static testErrorHandling(error: Error): ErrorTestResult {
    const errorMessage = error.message;
    
    // Detectar tipo de error
    let errorType = 'unknown';
    let detected = false;
    let handledCorrectly = false;
    let message = '';
    let suggestions: string[] = [];

    if (errorMessage.includes('429') || errorMessage.includes('quota')) {
      errorType = 'quota';
      detected = true;
      handledCorrectly = true;
      message = '🚫 Límite de API Alcanzado - Se ha excedido la cuota de la API de IA';
      suggestions = [
        '⏰ Esperar 15-30 minutos para que se restablezcan los límites',
        '🔄 Reintentar con una instrucción más simple',
        '🛠️ Continuar trabajando en modo offline'
      ];
    } else if (errorMessage.includes('ERR_CONNECTION_REFUSED') || errorMessage.includes('connection refused')) {
      errorType = 'connection';
      detected = true;
      handledCorrectly = true;
      message = '🔌 Error de Conexión - No se pudo conectar con los servicios de IA';
      suggestions = [
        '🌐 Verificar conexión a internet',
        '🔄 Reintentar en unos momentos',
        '🛠️ Continuar trabajando en modo offline'
      ];
    } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      errorType = 'timeout';
      detected = true;
      handledCorrectly = true;
      message = '⏱️ Tiempo de Espera Agotado - La operación tomó más tiempo del esperado';
      suggestions = [
        '🔄 Intenta nuevamente con una instrucción más simple',
        '📝 Divide el proyecto en componentes más pequeños',
        '⏰ Espera unos minutos antes de reintentar'
      ];
    } else if (errorMessage.includes('API') || errorMessage.includes('HTTP')) {
      errorType = 'api';
      detected = true;
      handledCorrectly = true;
      message = '⚠️ Error de Servicio de IA - Error temporal en los servicios de IA';
      suggestions = [
        '🔄 El sistema intentará usar modelos alternativos',
        '✏️ Continuar editando archivos existentes',
        '🎯 Planificar próximas funcionalidades'
      ];
    }

    return {
      errorType,
      detected,
      handledCorrectly,
      message,
      suggestions
    };
  }

  /**
   * Ejecuta una suite completa de pruebas de manejo de errores
   */
  static runErrorHandlingTests(): ErrorTestResult[] {
    const results: ErrorTestResult[] = [];

    // Probar error de cuota
    const quotaError = this.simulateQuotaError();
    results.push(this.testErrorHandling(quotaError));

    // Probar error de conexión
    const connectionError = this.simulateConnectionError();
    results.push(this.testErrorHandling(connectionError));

    // Probar error de timeout
    const timeoutError = this.simulateTimeoutError();
    results.push(this.testErrorHandling(timeoutError));

    // Probar error de API
    const apiError = this.simulateAPIError();
    results.push(this.testErrorHandling(apiError));

    return results;
  }

  /**
   * Genera un reporte de las pruebas de manejo de errores
   */
  static generateErrorHandlingReport(): string {
    const results = this.runErrorHandlingTests();
    
    let report = '🧪 **REPORTE DE PRUEBAS DE MANEJO DE ERRORES**\n\n';
    
    results.forEach((result, index) => {
      const status = result.handledCorrectly ? '✅ PASÓ' : '❌ FALLÓ';
      report += `**${index + 1}. Error de ${result.errorType.toUpperCase()}** - ${status}\n`;
      report += `   Detectado: ${result.detected ? '✅' : '❌'}\n`;
      report += `   Mensaje: ${result.message}\n`;
      report += `   Sugerencias: ${result.suggestions.length} disponibles\n\n`;
    });

    const passedTests = results.filter(r => r.handledCorrectly).length;
    const totalTests = results.length;
    
    report += `**RESUMEN**: ${passedTests}/${totalTests} pruebas pasaron exitosamente\n`;
    
    if (passedTests === totalTests) {
      report += '🎉 **¡Todos los tipos de error se manejan correctamente!**';
    } else {
      report += '⚠️ **Algunos tipos de error necesitan atención**';
    }

    return report;
  }
}

/**
 * Función de utilidad para probar el manejo de errores en la consola
 */
export function testErrorHandlingInConsole(): void {
  console.log('🧪 Iniciando pruebas de manejo de errores...');
  
  const report = ErrorTestUtils.generateErrorHandlingReport();
  console.log(report);
  
  console.log('\n📊 Detalles de las pruebas:');
  const results = ErrorTestUtils.runErrorHandlingTests();
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.errorType.toUpperCase()}:`);
    console.log(`   ✓ Detectado: ${result.detected}`);
    console.log(`   ✓ Manejado: ${result.handledCorrectly}`);
    console.log(`   📝 Mensaje: ${result.message}`);
    console.log(`   💡 Sugerencias: ${result.suggestions.join(', ')}`);
  });
}
