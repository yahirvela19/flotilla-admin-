import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase"; // Asegúrate de que la ruta sea correcta
import logosFlotilla from "../../assets/logos.jpeg";
import { Users, Car, ClipboardList, DollarSign, LogOut } from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();

  // Función para cerrar sesión en Supabase
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Error al cerrar sesión: " + error.message);
    } else {
      // replace: true evita que el usuario pueda regresar con el botón "atrás" del navegador
      navigate("/", { replace: true });
    }
  };

  return (
    <aside className="w-64 bg-secondary border-r border-accent flex flex-col justify-between shrink-0 h-screen">
      
      {/* SECCIÓN SUPERIOR */}
      <div className="flex flex-col">
        {/* LOGO CIRCULAR */}
        <div className="p-8 flex justify-center border-b border-accent/10">
          <div className="w-32 h-32 relative">
            <img 
              src={logosFlotilla} 
              alt="Logo Movitek" 
              className="w-full h-full rounded-full object-cover border-4 border-primary shadow-2xl brightness-110" 
            />
          </div>
        </div>

        {/* NAVEGACIÓN PRINCIPAL */}
        <nav className="p-4 space-y-2">
          <NavItem to="/app/choferes" icon={<Users size={18} />} label="Choferes" />
          <NavItem to="/app/vehiculos" icon={<Car size={18} />} label="Vehículos" />
          <NavItem to="/app/asignaciones" icon={<ClipboardList size={18} />} label="Asignaciones" />
          <NavItem to="/app/pagos" icon={<DollarSign size={18} />} label="Pagos" />
          <NavItem to="/app/view-pagos" icon={<DollarSign size={18} />} label="Pagos Pendientes" />
        </nav>
      </div>

      {/* SECCIÓN INFERIOR: LOGOUT Y VERSIÓN */}
      <div className="flex flex-col">
        {/* BOTÓN DE CERRAR SESIÓN */}
        <div className="px-4 mb-2">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-rojo bg-rojo/10 border border-rojo/20 hover:bg-rojo hover:text-white transition-all cursor-pointer group"
          >
            <LogOut size={16} className="group-hover:scale-110 transition-transform" />
            Cerrar sesion
          </button>
        </div>

        {/* VERSIÓN */}
        <div className="p-6 border-t border-accent/10 text-[9px] font-bold text-text-muted uppercase tracking-widest text-center">
          v.1.0 - 2026
        </div>
      </div>
    </aside>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <div className={`
          flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all
          ${isActive 
            ? "bg-primary text-white shadow-lg scale-[1.02]" 
            : "text-text-muted hover:bg-surface hover:text-primary"}
        `}>
          {icon}
          <span className="uppercase tracking-wider text-[11px] font-black">{label}</span>
        </div>
      )}
    </NavLink>
  );
}