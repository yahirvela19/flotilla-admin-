import { createContext, useContext } from 'react';
import { useRol } from '../hooks/useRol';

const RolContext = createContext(null);

export function RolProvider({ children }) {
  const { rol, loading, esAdmin, esOperador } = useRol();

  // Mientras carga el rol no renderizamos nada para evitar flashes
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface">
        <div className="text-text-muted text-sm animate-pulse">Cargando sesión...</div>
      </div>
    );
  }

  return (
    <RolContext.Provider value={{ rol, esAdmin, esOperador }}>
      {children}
    </RolContext.Provider>
  );
}

// Hook para usar el rol en cualquier componente
export function useRolContext() {
  return useContext(RolContext);
}