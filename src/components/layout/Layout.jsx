import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout() {
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();

  useEffect(() => {
    setSearchTerm("");
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* 1. Sidebar Fijo a la izquierda */}
      <Sidebar />
      
      {/* 2. Contenedor Derecho (Header + Contenido) */}
      <div className="flex flex-col flex-1 min-w-0">
        
        {/* El Header aquí ya cubre todo el ancho de esta columna */}
        <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        
        {/* 3. Área de trabajo (Tabla y Formulario) */}
        <main className="flex-1 overflow-y-auto bg-surface/50">
          {/* Cambiamos max-w-7xl por w-full y añadimos p-10 
              para que el formulario y la tabla respiren y el header 
              se sienta como un techo real.
          */}
          <div className="w-full h-full p-10">
            <Outlet context={{ searchTerm }} />
          </div>
        </main>
      </div>
    </div>
  );
}