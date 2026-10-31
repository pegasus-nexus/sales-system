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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
