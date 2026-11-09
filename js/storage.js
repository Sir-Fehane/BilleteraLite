/**
 * storage.js
 * Capa de persistencia en el navegador usando IndexedDB (nivel avanzado/recomendado).
 * Cuenta con fallback transparente a LocalStorage en caso de no disponibilidad.
 */

const DB_NAME = 'MiBilleteraLiteDB';
const DB_VERSION = 1;
const STORE_NAME = 'expenses';
const LOCAL_STORAGE_KEY = 'billetera_lite_expenses_backup';

let dbInstance = null;

/**
 * Inicializa la conexión con IndexedDB.
 * @returns {Promise<IDBDatabase>}
 */
function initDB() {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB no está soportado en este navegador. Usando LocalStorage.');
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('Error abriendo IndexedDB:', event.target.error);
      resolve(null); // Fallback a LocalStorage
    };
  });
}

/**
 * Obtiene todos los gastos persistidos.
 * @returns {Promise<Array>} Lista de gastos
 */
export async function getExpensesFromStorage() {
  const db = await initDB();

  if (!db) {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error leyendo LocalStorage:', e);
      return [];
    }
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = (event) => {
      console.error('Error obteniendo gastos de IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Guarda un nuevo gasto.
 * @param {Object} expense 
 * @returns {Promise<Object>} El gasto guardado
 */
export async function saveExpenseToStorage(expense) {
  const db = await initDB();

  if (!db) {
    try {
      const current = await getExpensesFromStorage();
      current.push(expense);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
      return expense;
    } catch (e) {
      console.error('Error guardando en LocalStorage:', e);
      throw e;
    }
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(expense);

    request.onsuccess = () => {
      resolve(expense);
    };

    request.onerror = (event) => {
      console.error('Error guardando gasto en IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Elimina un gasto por su ID.
 * @param {string|number} id 
 * @returns {Promise<void>}
 */
export async function deleteExpenseFromStorage(id) {
  const db = await initDB();

  if (!db) {
    try {
      const current = await getExpensesFromStorage();
      const filtered = current.filter(item => item.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
      return;
    } catch (e) {
      console.error('Error eliminando de LocalStorage:', e);
      throw e;
    }
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      console.error('Error eliminando de IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
}
