import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from "../lib/supabase";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";

const formatMXN = (val) =>
  `$${parseFloat(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Rentabilidad() {
  const { searchTerm } = useOutletContext();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('vista_rentabilidad')
      .select('*')
      .order('id_vehiculo', { ascending: true });

    if (error) console.error('Error cargando rentabilidad:', error.message);
    else setData(rows);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtrados = data.filter(v => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return (
      v.placa?.toLowerCase().includes(t) ||
      v.marca?.toLowerCase().includes(t) ||
      v.modelo?.toLowerCase().includes(t) ||
      String(v.anio).includes(t) ||
      v.estatus?.toLowerCase().includes(t)
    );
  });

  // Totales generales
  const totalCosto = filtrados.reduce((acc, v) => acc + parseFloat(v.costo_vehiculo || 0), 0);
  const totalIngresos = filtrados.reduce((acc, v) => acc + parseFloat(v.total_ingresos || 0), 0);
  const totalRestante = totalCosto - totalIngresos;

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-text-tablas">Rentabilidad por Vehículo</h2>
        <div className="flex gap-3">
          <div className="text-xs font-black text-azul bg-azul/10 px-4 py-2 rounded-full border border-azul/20 uppercase">
            Inversión: {formatMXN(totalCosto)}
          </div>
          <div className="text-xs font-black text-verde bg-verde/10 px-4 py-2 rounded-full border border-verde/20 uppercase">
            Ingresos: {formatMXN(totalIngresos)}
          </div>
          <div className={`text-xs font-black px-4 py-2 rounded-full border uppercase ${totalRestante <= 0 ? 'text-verde bg-verde/10 border-verde/20' : 'text-rojo bg-rojo/10 border-rojo/20'}`}>
            {totalRestante <= 0 ? 'Ganancia neta: ' : 'Por recuperar: '}{formatMXN(Math.abs(totalRestante))}
          </div>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 text-text-tablas">
                <th className="p-3">ID</th>
                <th className="p-3">Placa</th>
                <th className="p-3">Vehículo</th>
                <th className="p-3">Año</th>
                <th className="p-3">Estatus</th>
                <th className="p-3 text-right">Costo del vehículo</th>
                <th className="p-3 text-right">Ingresos cobrados</th>
                <th className="p-3 text-right">Por recuperar</th>
                <th className="p-3 text-center">Progreso</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="p-10 text-center animate-pulse text-gray-500">Cargando datos...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan="9" className="p-10 text-center text-gray-400">Sin resultados.</td></tr>
              ) : filtrados.map((v) => {
                const costo = parseFloat(v.costo_vehiculo || 0);
                const ingresos = parseFloat(v.total_ingresos || 0);
                const restante = costo - ingresos;
                const porcentaje = costo > 0 ? Math.min((ingresos / costo) * 100, 100) : 0;
                const enGanancia = restante <= 0;

                return (
                  <tr key={v.id_vehiculo} className="border-b border-gray-100 hover:bg-gray-50 transition text-text-tablas">
                    <td className="p-3 font-mono">{v.id_vehiculo}</td>
                    <td className="p-3 font-bold">{v.placa}</td>
                    <td className="p-3">{v.marca} {v.modelo}</td>
                    <td className="p-3">{v.anio}</td>
                    <td className="p-3"><Badge status={v.estatus} /></td>
                    <td className="p-3 text-right font-medium text-azul">{formatMXN(costo)}</td>
                    <td className="p-3 text-right font-bold text-verde">{formatMXN(ingresos)}</td>
                    <td className={`p-3 text-right font-bold ${enGanancia ? 'text-verde' : 'text-rojo'}`}>
                      {enGanancia ? `+${formatMXN(Math.abs(restante))}` : formatMXN(restante)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all ${enGanancia ? 'bg-verde' : 'bg-primary'}`}
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-text-muted w-10 text-right">
                          {porcentaje.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
