import React from 'react'
import { createRoot } from 'react-dom/client'
import './css/index.css'
import App from './App.jsx'
import Sidebar from './Sidebar.jsx'
import Footer from './Footer'

createRoot(document.getElementById('root')).render(
  <div className="min-h-screen flex flex-col">
    <Sidebar />
    <main className="flex-grow ml-12">
      <App />
    </main>
  </div>
)
