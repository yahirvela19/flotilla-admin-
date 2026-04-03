import { NavLink } from "react-router-dom";

function SidebarLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-lg text-sm transition
        ${isActive ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"}`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <nav className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col justify-between">
      <div>
        <h1 className="text-xl font-semibold mb-6">Flotilla</h1>

        <div className="space-y-2">
          <SidebarLink to="/choferes">Choferes</SidebarLink>
          <SidebarLink to="/vehiculos">Vehículos</SidebarLink>
          <SidebarLink to="/asignaciones">Asignaciones</SidebarLink>
          <SidebarLink to="/pagos">Pagos</SidebarLink>
        </div>
      </div>

      <div className="text-xs text-gray-400">Sistema de Gestión</div>
    </nav>
  );
}