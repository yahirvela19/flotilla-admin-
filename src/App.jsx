import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { RolProvider } from './context/RolContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Choferes from './pages/Choferes';
import Vehiculos from './pages/Vehiculos';
import Asignaciones from './pages/Asignaciones';
import Pagos from './pages/Pagos';
import ViewPagos from './pages/ViewPagos';
import Rentabilidad from './pages/Rentabilidad';
import SoloAdmin from './components/auth/SoloAdmin';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            {/* RolProvider va dentro de ProtectedRoute para que el usuario ya esté autenticado */}
            <Route element={<RolProvider><Layout /></RolProvider>}>
              <Route path="/app" element={<Navigate to="/app/choferes" replace />} />

              {/* ── Rutas accesibles por TODOS los roles ── */}
              <Route path="/app/choferes"     element={<Choferes />} />
              <Route path="/app/asignaciones" element={<Asignaciones />} />

              {/* Vehículos: todos acceden, pero el costo se oculta según rol (dentro del componente) */}
              <Route path="/app/vehiculos"    element={<Vehiculos />} />

              {/* ── Rutas solo para ADMIN ── */}
              <Route path="/app/pagos"        element={<SoloAdmin><Pagos /></SoloAdmin>} />
              <Route path="/app/view-pagos"   element={<SoloAdmin><ViewPagos /></SoloAdmin>} />
              <Route path="/app/rentabilidad" element={<SoloAdmin><Rentabilidad /></SoloAdmin>} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;