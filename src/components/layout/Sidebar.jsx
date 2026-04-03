import { NavLink } from "react-router-dom";
import { Users, Car, ClipboardList, DollarSign } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between">

      {/* LOGO */}
      <div>
        <div className="p-6 text-xl font-semibold">
          Flotilla
        </div>

        {/* NAV */}
        <nav className="px-3 space-y-1 ">

          <NavItem to="/choferes" icon={<Users size={18} />} label="Choferes" />
          <NavItem to="/vehiculos" icon={<Car size={18} />} label="Vehículos" />
          <NavItem to="/asignaciones" icon={<ClipboardList size={18} />} label="Asignaciones" />
          <NavItem to="/pagos" icon={<DollarSign size={18} />} label="Pagos" />

        </nav>
      </div>

      {/* FOOTER */}
      <div className="p-4 text-xs text-gray-400">
        Sistema de Gestión
      </div>

    </aside>
  );
}


function NavItem({ to, icon, label }) {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <div
          className={`
            flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
            ${isActive
              ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
              : "text-gray-600 hover:bg-gray-100"}
          `}
        >
          {icon}
          {label}
        </div>
      )}
    </NavLink>
  );
}