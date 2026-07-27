import eruda from 'eruda'
eruda.init()
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

window.addEventListener('error', (event) => {
  alert('Fehler: ' + event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  alert('Promise-Fehler: ' + event.reason)
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)