/**
 * expenses.js
 * Lógica de negocio y dominio para la gestión de gastos.
 */

export const CATEGORIES = {
  Comida: { label: 'Comida', cssClass: 'cat-comida' },
  Transporte: { label: 'Transporte', cssClass: 'cat-transporte' },
  Servicios: { label: 'Servicios', cssClass: 'cat-servicios' },
  Ocio: { label: 'Ocio', cssClass: 'cat-ocio' },
  Otros: { label: 'Otros', cssClass: 'cat-otros' }
};

/**
 * Valida y crea una nueva instancia de gasto.
 * @param {string} concept 
 * @param {number|string} amount 
 * @param {string} category 
 * @returns {Object} Objeto de gasto normalizado
 */
export function createExpense(concept, amount, category) {
  const cleanConcept = String(concept || '').trim();
  const numericAmount = parseFloat(amount);

  if (!cleanConcept) {
    throw new Error('El concepto del gasto no puede estar vacío.');
  }

  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('El monto debe ser un valor numérico mayor a cero.');
  }

  const validCategory = CATEGORIES[category] ? category : 'Otros';

  return {
    id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    concept: cleanConcept,
    amount: Math.round(numericAmount * 100) / 100,
    category: validCategory,
    timestamp: Date.now()
  };
}

/**
 * Ordena la lista de gastos desde el más reciente al más antiguo.
 * @param {Array} expenses 
 * @returns {Array} Nueva lista ordenada
 */
export function sortExpensesDesc(expenses = []) {
  return [...expenses].sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Calcula la sumatoria total de los gastos.
 * @param {Array} expenses 
 * @returns {number}
 */
export function calculateTotal(expenses = []) {
  const total = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  return Math.round(total * 100) / 100;
}

/**
 * Formateador de moneda en pesos (MXN).
 * @param {number} amount 
 * @returns {string} Ejemplo: "$150.00"
 */
const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function formatCurrency(amount) {
  return currencyFormatter.format(amount || 0);
}

/**
 * Formatea una marca de tiempo en una fecha amigable.
 * @param {number} timestamp 
 * @returns {string} Ejemplo: "9 nov, 14:00"
 */
export function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}
