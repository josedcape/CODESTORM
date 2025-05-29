/**
 * Contador estático para garantizar unicidad incluso cuando se generan IDs en el mismo milisegundo
 */
let idCounter = 0;

/**
 * Genera un ID único con un prefijo opcional
 * @param prefix Prefijo para el ID (opcional)
 * @returns ID único
 */
export function generateUniqueId(prefix: string = ''): string {
  // Incrementar el contador para garantizar unicidad
  idCounter++;

  // Obtener timestamp actual
  const timestamp = Date.now();

  // Generar parte aleatoria con más entropía
  const random = Math.random().toString(36).substring(2, 9);

  // Añadir un componente adicional para evitar colisiones
  const extra = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

  // Combinar todos los elementos para garantizar unicidad
  return `${prefix ? `${prefix}-` : ''}${timestamp}-${idCounter}-${extra}-${random}`;
}
