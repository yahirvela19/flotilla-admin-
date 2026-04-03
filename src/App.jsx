import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';


import Layout from './components/layout/Layout';


import Choferes from './pages/Choferes';
import Vehiculos from './pages/Vehiculos';
import Asignaciones from './pages/Asignaciones';
import Pagos from './pages/Pagos';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Layout />}>
          
          <Route index element={<Navigate to="/choferes" replace />} />
          
          
          <Route path="choferes" element={<Choferes />} />
          <Route path="vehiculos" element={<Vehiculos />} />
          <Route path="asignaciones" element={<Asignaciones />} />
          <Route path="pagos" element={<Pagos />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}