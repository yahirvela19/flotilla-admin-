import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  // Limpiar el buscador cada vez que el usuario cambie de pestaña en el menú
  useEffect(() => {
    setSearchTerm('');
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-full bg-white text-black font-sans">
      
      {/* NAVEGACIÓN LATERAL FIJA */}
      <nav className="w-64 border-r border-black p-6 flex flex-col justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold border-b border-black pb-4 mb-6 uppercase tracking-wider">
            Flotilla
          </h1>
          <ul className="space-y-4">
            <li>
              <NavLink to="/choferes" className={({ isActive }) => `block py-2 px-3 border border-transparent hover:border-black transition-colors ${isActive ? 'bg-gray-200 border-black font-bold' : ''}`}>
                Choferes
              </NavLink>
            </li>
            <li>
              <NavLink to="/vehiculos" className={({ isActive }) => `block py-2 px-3 border border-transparent hover:border-black transition-colors ${isActive ? 'bg-gray-200 border-black font-bold' : ''}`}>
                Vehículos
              </NavLink>
            </li>
            <li>
              <NavLink to="/asignaciones" className={({ isActive }) => `block py-2 px-3 border border-transparent hover:border-black transition-colors ${isActive ? 'bg-gray-200 border-black font-bold' : ''}`}>
                Asignaciones
              </NavLink>
            </li>
            <li>
              <NavLink to="/pagos" className={({ isActive }) => `block py-2 px-3 border border-transparent hover:border-black transition-colors ${isActive ? 'bg-gray-200 border-black font-bold' : ''}`}>
                Pagos
              </NavLink>
            </li>
          </ul>
        </div>
        <div className="text-sm text-gray-500 font-bold uppercase border-t border-black pt-4">
          Sistema de Gestión
        </div>
      </nav>

      {/* ÁREA PRINCIPAL (Barra superior + Contenido Dinámico) */}
      <div className="flex flex-col flex-1 overflow-hidden bg-white">
        
        {/* TOP BAR / BARRA DE BÚSQUEDA GENERAL */}
        <header className="border-b border-black p-4 flex justify-between items-center bg-gray-50 shrink-0">
          <div className="text-sm font-bold uppercase text-gray-500">
            {/* Muestra en qué ruta estás basándose en la URL */}
            Módulo: {location.pathname.replace('/', '')}
          </div>
          <div>
            <input 
              type="text" 
              placeholder="BUSCAR..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-black p-2 w-72 focus:outline-none focus:ring-1 focus:ring-black uppercase text-sm"
            />
          </div>
        </header>

        {/* CONTENIDO DE LAS PANTALLAS (Pasamos el searchTerm como contexto) */}
        <div className="flex flex-1 overflow-hidden">
          <Outlet context={{ searchTerm }} />
        </div>

      </div>
    </div>
  );
}