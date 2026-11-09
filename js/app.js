/**
 * app.js
 * Controlador y punto de entrada principal de "Mi Billetera Lite".
 * Orquesta la lógica de negocio, interfaz de usuario, persistencia y eventos PWA.
 */

import { 
  getExpensesFromStorage, 
  saveExpenseToStorage, 
  deleteExpenseFromStorage 
} from './storage.js';

import { 
  createExpense, 
  sortExpensesDesc, 
  calculateTotal 
} from './expenses.js';

import { 
  renderTotalizer, 
  renderExpenseList, 
  updateNetworkStatus 
} from './ui.js';

import { 
  registerServiceWorker, 
  initInstallPrompt 
} from './register-sw.js';

// Estado en memoria de la aplicación
let expensesState = [];

/**
 * Actualiza la interfaz completa (Totalizador e Historial).
 */
function refreshUI() {
  const sorted = sortExpensesDesc(expensesState);
  const total = calculateTotal(expensesState);
  const count = expensesState.length;

  renderTotalizer(total, count);
  renderExpenseList(sorted, handleDeleteExpense);
}

/**
 * Manejador para el registro de un nuevo gasto desde el formulario.
 * @param {Event} e 
 */
async function handleExpenseSubmit(e) {
  e.preventDefault();

  const conceptInput = document.getElementById('concept');
  const amountInput = document.getElementById('amount');
  const categorySelect = document.getElementById('category');

  const concept = conceptInput.value;
  const amount = amountInput.value;
  const category = categorySelect.value;

  try {
    // 1. Validar y crear modelo de gasto
    const newExpense = createExpense(concept, amount, category);

    // 2. Persistir localmente (IndexedDB / LocalStorage)
    await saveExpenseToStorage(newExpense);

    // 3. Actualizar estado y renderizar vista
    expensesState.push(newExpense);
    refreshUI();

    // 4. Limpiar formulario y reenfocar
    conceptInput.value = '';
    amountInput.value = '';
    categorySelect.value = 'Comida';
    conceptInput.focus();

  } catch (err) {
    alert(err.message || 'Error al guardar el gasto.');
    console.error('Error al guardar gasto:', err);
  }
}

/**
 * Manejador para eliminar un gasto existente.
 * @param {string} id 
 * @param {string} concept 
 */
async function handleDeleteExpense(id, concept) {
  const confirmed = confirm(`¿Deseas eliminar el registro "${concept}"?`);
  if (!confirmed) return;

  try {
    await deleteExpenseFromStorage(id);
    expensesState = expensesState.filter(item => item.id !== id);
    refreshUI();
  } catch (err) {
    alert('Error al eliminar el gasto.');
    console.error('Error al eliminar gasto:', err);
  }
}

/**
 * Configura los eventos de conexión de red (Online / Offline).
 */
function setupNetworkListeners() {
  updateNetworkStatus(navigator.onLine);

  window.addEventListener('online', () => {
    updateNetworkStatus(true);
  });

  window.addEventListener('offline', () => {
    updateNetworkStatus(false);
  });
}

/**
 * Inicialización al cargar la aplicación.
 */
async function initApp() {
  // 1. Registrar listeners de red
  setupNetworkListeners();

  // 2. Registrar listener del formulario
  const form = document.getElementById('expense-form');
  if (form) {
    form.addEventListener('submit', handleExpenseSubmit);
  }

  // 3. Cargar datos iniciales desde el almacenamiento local
  try {
    expensesState = await getExpensesFromStorage();
  } catch (e) {
    console.error('No se pudieron recuperar los gastos guardados:', e);
    expensesState = [];
  }
  refreshUI();

  // 4. Registrar Service Worker y configurar banner de instalación PWA
  registerServiceWorker();
  initInstallPrompt();
}

// Iniciar aplicación
document.addEventListener('DOMContentLoaded', initApp);
