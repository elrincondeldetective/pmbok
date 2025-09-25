// frontend/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // Importamos BrowserRouter
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Envolvemos la aplicación con el router para habilitar la navegación */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

