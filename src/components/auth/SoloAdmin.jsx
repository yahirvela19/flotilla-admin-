import { useRolContext } from '../../context/RolContext';

/**
 * Wrapper que bloquea el acceso a rutas de solo admin.
 * Si el usuario no es admin, muestra pantalla de acceso denegado.
 */
export default function SoloAdmin({ children }) {
  const { esAdmin } = useRolContext();

  if (!esAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-16 h-16 bg-rojo/10 rounded-full flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rojo">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        </div>
        <h2 className="text-xl font-black text-text-tablas uppercase tracking-widest">Acceso Restringido</h2>
        <p className="text-sm text-text-muted text-center max-w-xs">
          No tienes permisos para ver esta sección. Contacta al administrador del sistema.
        </p>
      </div>
    );
  }

  return children;
}