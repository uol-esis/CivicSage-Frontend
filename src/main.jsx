import React from 'react'
import { createRoot } from 'react-dom/client'
import './css/index.css'
import App from './App.jsx'
import Sidebar from './Sidebar.jsx'

createRoot(document.getElementById('root')).render(
  <div className="min-h-screen flex flex-col">
    <Sidebar />
    <main id="main-content" tabIndex={-1} className="flex-grow height-[100vh] overflow-hidden ml-12">
      <App />
    </main>
  </div>
)
