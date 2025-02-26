import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ChromeProvider } from './context/ChromApiContext.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChromeProvider>
      <App />
    </ChromeProvider>
  </React.StrictMode>,
)
