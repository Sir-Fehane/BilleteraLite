/**
 * ui.js
 * Módulo de manipulación del DOM y renderizado de la interfaz.
 */

import { CATEGORIES, formatCurrency, formatDate } from './expenses.js';

// Elementos del DOM en caché
const totalAmountEl = document.getElementById('total-amount');
const totalCountEl = document.getElementById('total-count');
const historyCounterEl = document.getElementById('history-counter');
const expenseListEl = document.getElementById('expense-list');
const emptyStateEl = document.getElementById('empty-state');
const networkStatusEl = document.getElementById('network-status');
const networkTextEl = document.getElementById('network-text');

// Iconos SVG limpios y vectoriales por categoría (sin emojis)
const CATEGORY_SVGS = {
  Comida: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
      <line x1="6" y1="1" x2="6" y2="4"></line>
      <line x1="10" y1="1" x2="10" y2="4"></line>
      <line x1="14" y1="1" x2="14" y2="4"></line>
    </svg>`,
  Transporte: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="13" rx="2"></rect>
      <circle cx="7" cy="18" r="1.5"></circle>
      <circle cx="17" cy="18" r="1.5"></circle>
      <line x1="5" y1="21" x2="7" y2="18"></line>
      <line x1="19" y1="21" x2="17" y2="18"></line>
      <line x1="3" y1="9" x2="21" y2="9"></line>
    </svg>`,
  Servicios: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>`,
  Ocio: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>`,
  Otros: `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
      <line x1="7" y1="7" x2="7.01" y2="7"></line>
    </svg>`
};

/**
 * Actualiza el indicador visual del Totalizador superior.
 * @param {number} total 
 * @param {number} count 
 */
export function renderTotalizer(total, count) {
  if (totalAmountEl) {
    totalAmountEl.textContent = formatCurrency(total);
  }
  if (totalCountEl) {
    totalCountEl.textContent = count === 1 ? '1 gasto registrado' : `${count} gastos registrados`;
  }
  if (historyCounterEl) {
    historyCounterEl.textContent = count === 1 ? '1 registro' : `${count} registros`;
  }
}

/**
 * Renderiza la lista completa de gastos en el historial.
 * @param {Array} expenses - Lista de gastos ya ordenada descendentemente
 * @param {Function} onDelete - Callback al hacer click en eliminar
 */
export function renderExpenseList(expenses = [], onDelete) {
  if (!expenseListEl || !emptyStateEl) return;

  expenseListEl.innerHTML = '';

  if (expenses.length === 0) {
    emptyStateEl.style.display = 'flex';
    expenseListEl.style.display = 'none';
    return;
  }

  emptyStateEl.style.display = 'none';
  expenseListEl.style.display = 'flex';

  const fragment = document.createDocumentFragment();

  expenses.forEach(item => {
    const categoryInfo = CATEGORIES[item.category] || CATEGORIES.Otros;

    const li = document.createElement('li');
    li.className = 'expense-item';
    li.dataset.id = item.id;

    // Lado izquierdo: Ícono + concepto + metadata
    const leftDiv = document.createElement('div');
    leftDiv.className = 'expense-item-left';

    const iconWrapper = document.createElement('div');
    iconWrapper.className = `category-icon-wrapper ${categoryInfo.cssClass}`;
    iconWrapper.innerHTML = CATEGORY_SVGS[item.category] || CATEGORY_SVGS.Otros;

    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'expense-details';

    const conceptSpan = document.createElement('span');
    conceptSpan.className = 'expense-concept';
    conceptSpan.textContent = item.concept;

    const metaDiv = document.createElement('div');
    metaDiv.className = 'expense-meta';

    const badgeSpan = document.createElement('span');
    badgeSpan.className = `expense-badge ${categoryInfo.cssClass}`;
    badgeSpan.textContent = categoryInfo.label;

    const dateSpan = document.createElement('span');
    dateSpan.textContent = formatDate(item.timestamp);

    metaDiv.appendChild(badgeSpan);
    metaDiv.appendChild(dateSpan);

    detailsDiv.appendChild(conceptSpan);
    detailsDiv.appendChild(metaDiv);

    leftDiv.appendChild(iconWrapper);
    leftDiv.appendChild(detailsDiv);

    // Lado derecho: Monto + Botón de eliminar
    const rightDiv = document.createElement('div');
    rightDiv.className = 'expense-item-right';

    const amountSpan = document.createElement('span');
    amountSpan.className = 'expense-amount';
    amountSpan.textContent = formatCurrency(item.amount);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-delete';
    deleteBtn.setAttribute('aria-label', `Eliminar gasto de ${item.concept}`);
    deleteBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    `;

    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof onDelete === 'function') {
        onDelete(item.id, item.concept);
      }
    });

    rightDiv.appendChild(amountSpan);
    rightDiv.appendChild(deleteBtn);

    li.appendChild(leftDiv);
    li.appendChild(rightDiv);

    fragment.appendChild(li);
  });

  expenseListEl.appendChild(fragment);
}

/**
 * Actualiza el indicador visual de conexión de red (Online / Offline).
 * @param {boolean} isOnline 
 */
export function updateNetworkStatus(isOnline) {
  if (!networkStatusEl || !networkTextEl) return;

  if (isOnline) {
    networkStatusEl.className = 'network-badge online';
    networkTextEl.textContent = 'Online';
  } else {
    networkStatusEl.className = 'network-badge offline';
    networkTextEl.textContent = 'Offline (Modo Avión)';
  }
}
