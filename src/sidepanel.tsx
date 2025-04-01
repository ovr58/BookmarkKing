import React from 'react';
import ReactDOM from 'react-dom/client';
import SidePanel from './components/SidePanel';
import { ChromeProvider } from './context';

const $root = document.getElementById('root')!

$root.className = 'bg-light dark:bg-dark h-screen'

ReactDOM.createRoot($root).render(
  <React.StrictMode>
    <ChromeProvider>
        <SidePanel />
    </ChromeProvider>
  </React.StrictMode>
);