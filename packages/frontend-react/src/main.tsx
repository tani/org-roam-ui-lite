import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { UiProvider } from './store/ui.tsx'
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './assets/app.css';
import './assets/code.css';
import './assets/themes.css';
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UiProvider>
      <App />
    </UiProvider>
  </React.StrictMode>,
)
