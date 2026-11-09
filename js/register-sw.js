/**
 * register-sw.js
 * Registro del Service Worker y gestión del ciclo de instalación PWA.
 */

let deferredPrompt = null;

/**
 * Registra el Service Worker en el navegador.
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Los Service Workers no están soportados en este navegador.');
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', {
        scope: './'
      });
      console.log('Service Worker registrado con éxito:', registration.scope);

      // Detectar actualizaciones disponibles
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Nueva versión de Mi Billetera Lite disponible.');
            }
          });
        }
      });
    } catch (error) {
      console.error('Fallo en el registro del Service Worker:', error);
    }
  });
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
    // Prevenir el banner mini-infobar automático para usar nuestra UI integrada
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
