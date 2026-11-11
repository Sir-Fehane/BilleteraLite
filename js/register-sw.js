/**
 * register-sw.js
 * Registro del Service Worker y gestión del ciclo de instalación PWA.
 */

let deferredPrompt = null;

/**
 * Registra el Service Worker en el navegador de manera inmediata.
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Los Service Workers no están soportados en este navegador.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('./sw.js', {
      scope: './'
    });
    console.log('[SW] Service Worker registrado exitosamente con scope:', registration.scope);

    // Asegurar que el worker tome control inmediatamente
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;
      if (installingWorker) {
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] Nueva versión instalada y lista.');
          }
        });
      }
    });
  } catch (error) {
    console.error('[SW] Error al registrar el Service Worker:', error);
  }
}

/**
 * Inicializa el banner y botón de instalación nativo PWA (A2HS).
 */
export function initInstallPrompt() {
  const installBanner = document.getElementById('install-banner');
  const btnInstall = document.getElementById('btn-install');
  const btnDismiss = document.getElementById('btn-dismiss-install');

  if (!installBanner || !btnInstall) return;

  // Capturar el evento de instalación nativo
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBanner.classList.add('visible');
  });

  // Botón de Instalar
  btnInstall.addEventListener('click', async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Respuesta del usuario para instalación: ${outcome}`);

    deferredPrompt = null;
    installBanner.classList.remove('visible');
  });

  // Botón de Cerrar/Descartar
  if (btnDismiss) {
    btnDismiss.addEventListener('click', () => {
      installBanner.classList.remove('visible');
    });
  }

  // Ocultar si la app ya fue instalada
  window.addEventListener('appinstalled', () => {
    console.log('Mi Billetera Lite fue instalada satisfactoriamente.');
    deferredPrompt = null;
    installBanner.classList.remove('visible');
  });
}
