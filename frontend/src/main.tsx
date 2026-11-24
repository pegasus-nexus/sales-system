import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// Auto-recuperación ante cambios de versión / chunks nuevos en Vite
window.addEventListener('vite:preloadError', (event) => {
    console.warn('Vite preload error detected (new version deployed), reloading page...', event);
    window.location.reload();
});

// Inicialización segura de Sentry en Frontend (si VITE_SENTRY_DSN está configurado)
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
    try {
        const script = document.createElement('script');
        script.src = 'https://browser.sentry-cdn.com/8.40.0/bundle.min.js';
        script.crossOrigin = 'anonymous';
        script.onload = () => {
            const Sentry = (window as unknown as { Sentry?: { init: (cfg: Record<string, unknown>) => void } }).Sentry;
            if (Sentry) {
                Sentry.init({
                    dsn: sentryDsn,
                    environment: import.meta.env.MODE || 'production',
                    tracesSampleRate: 0.2,
                });
                console.log('[Sentry] Frontend monitoring initialized.');
            }
        };
        document.head.appendChild(script);
    } catch (e) {
        console.warn('[Sentry] Error al inicializar Sentry en navegador:', e);
    }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
