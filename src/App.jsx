import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-10 text-center">
        <h1 className="text-3xl font-bold text-blue-700">
          Portal de Empleos
        </h1>

        <p className="text-gray-600 mt-4">
          Plataforma de búsqueda laboral con Inteligencia Artificial
        </p>

        <div className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg">
          Frontend configurado correctamente
        </div>
      </div>
    </div>
  )
}

export default App
