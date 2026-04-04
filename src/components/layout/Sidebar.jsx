import { NavLink } from "react-router-dom";
import logosFlotilla from "../../assets/logos.jpeg";
import { Users, Car, ClipboardList, DollarSign } from "lucide-react";

export default function Sidebar() {
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

        <nav className="px-3 space-y-1">
          <NavItem to="/choferes" icon={<Users size={18} />} label="Choferes" />
          <NavItem to="/vehiculos" icon={<Car size={18} />} label="Vehículos" />
          <NavItem to="/asignaciones" icon={<ClipboardList size={18} />} label="Asignaciones" />
          <NavItem to="/pagos" icon={<DollarSign size={18} />} label="Pagos" />
        </nav>
      </div>

      <div className="p-6 border-t border-accent text-[9px] font-bold text-text-muted uppercase tracking-widest">
        v.1.0 - 2026
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
            ? "bg-primary text-white shadow-lg" 
            : "text-text-muted hover:bg-surface hover:text-primary"}
        `}>
          {icon}
          {label}
        </div>
      )}
    </NavLink>
  );
}