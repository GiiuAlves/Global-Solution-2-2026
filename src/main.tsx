import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Prévia publicada: o ambiente bloqueia confirm(), então as confirmações são aceitas direto.
if (import.meta.env.MODE === 'artifact') window.confirm = () => true

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
