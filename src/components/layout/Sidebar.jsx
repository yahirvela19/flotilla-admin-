import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useRolContext } from "../../context/RolContext";
import logosFlotilla from "../../assets/logos.jpeg";
import { Users, Car, ClipboardList, DollarSign, Clock, TrendingUp, LogOut } from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();
  const { esAdmin } = useRolContext();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert("Error al cerrar sesión: " + error.message);
    else navigate("/", { replace: true });
  };

  return (
    <aside className="w-64 bg-secondary border-r border-accent flex flex-col justify-between shrink-0 h-screen">

      <div className="flex flex-col">
        <div className="p-8 flex justify-center border-b border-accent/10">
          <div className="w-32 h-32 relative">
            <img src={logosFlotilla} alt="Logo Movitek" className="w-full h-full rounded-full object-cover border-4 border-primary shadow-2xl brightness-110" />
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {/* ── Accesibles por todos ── */}
          <NavItem to="/app/choferes"      icon={<Users size={18} />}         label="Choferes" />
          <NavItem to="/app/vehiculos"     icon={<Car size={18} />}           label="Vehículos" />
          <NavItem to="/app/asignaciones"  icon={<ClipboardList size={18} />} label="Asignaciones" />

          {/* ── Solo admin ── */}
          {esAdmin && (
            <>
              <NavItem to="/app/pagos"        icon={<DollarSign size={18} />} label="Pagos" />
              <NavItem to="/app/view-pagos"   icon={<Clock size={18} />}      label="Pagos Pendientes" />
              <NavItem to="/app/rentabilidad" icon={<TrendingUp size={18} />} label="Rentabilidad" />
            </>
          )}
        </nav>
      </div>

      <div className="flex flex-col">
        {/* Indicador de rol */}
        <div className="px-4 mb-3">
          <div className={`text-center py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${esAdmin ? 'bg-primary/10 text-primary border-primary/20' : 'bg-azul/10 text-azul border-azul/20'}`}>
            {esAdmin ? '⚙ Administrador' : '👤 Operador'}
          </div>
        </div>

        <div className="px-4 mb-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-rojo bg-rojo/10 border border-rojo/20 hover:bg-rojo hover:text-white transition-all cursor-pointer group"
          >
            <LogOut size={16} className="group-hover:scale-110 transition-transform" />
            Cerrar sesion
          </button>
        </div>

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
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${isActive ? "bg-primary text-white shadow-lg scale-[1.02]" : "text-text-muted hover:bg-surface hover:text-primary"}`}>
          {icon}
          <span className="uppercase tracking-wider text-[11px] font-black">{label}</span>
        </div>
      )}
    </NavLink>
  );
}