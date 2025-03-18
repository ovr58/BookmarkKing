import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ChromeProvider } from './context/ChromApiContext.tsx'
import './index.css'
import { MenuProvider } from './context/ContextMenuContext.tsx'

const $root = document.getElementById('root')!

$root.className = 'bg-light dark:bg-dark'

ReactDOM.createRoot($root).render(
  <React.StrictMode>
    <ChromeProvider>
      <MenuProvider>
        <App />
      </MenuProvider>
    </ChromeProvider>
  </React.StrictMode>,
)
