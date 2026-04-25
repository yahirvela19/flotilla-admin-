import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Choferes from './pages/Choferes';
import Vehiculos from './pages/Vehiculos';
import Asignaciones from './pages/Asignaciones';
import Pagos from './pages/Pagos';
import Login from './pages/Login';
import ViewPagos from './pages/ViewPagos';
import ProtectedRoute from './components/auth/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
  <Route path="/" element={<Login />} />

  {/* Envolvemos todas las rutas protegidas */}
  <Route element={<ProtectedRoute />}>
    <Route path="/app" element={<Layout />}>
      <Route index element={<Navigate to="choferes" replace />} />
      <Route path="choferes" element={<Choferes />} />
      <Route path="vehiculos" element={<Vehiculos />} />
      <Route path="asignaciones" element={<Asignaciones />} />
      <Route path="pagos" element={<Pagos />} />
      <Route path="view-pagos" element={<ViewPagos />} />
    </Route>
  </Route>
</Routes>
    </BrowserRouter>
  );
}