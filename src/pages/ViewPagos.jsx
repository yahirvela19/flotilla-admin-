import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from "../lib/supabase";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";

export default function ViewPagos() {
  const { searchTerm } = useOutletContext();
  const { toast, confirm } = useToast();

  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendientes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pagos")
      .select(`id_pago, monto, fecha_pago, estatus, notas, id_chofer, choferes (nombre, apellido_paterno)`)
      .eq("estatus", "pendiente")
      .order("fecha_pago", { ascending: true });
    if (error) console.error("Error en la consulta:", error.message);
    else setPendientes(data);
    setLoading(false);
  };

  useEffect(() => { fetchPendientes(); }, []);

  const handleMarcarPagado = async (id, monto, choferNombre) => {
    const ok = await confirm(`¿Liquidar el pago de $${parseFloat(monto).toLocaleString()} de ${choferNombre}?`);
    if (!ok) return;

    const { error } = await supabase.from("pagos").update({ estatus: "pagado" }).eq("id_pago", id);
    if (error) toast({ message: 'Error al actualizar el pago: ' + error.message, type: 'error' });
    else { toast({ message: `Pago de ${choferNombre} marcado como pagado.`, type: 'success' }); fetchPendientes(); }
  };

  const filtrados = pendientes.filter(p => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    const nombre = `${p.choferes?.nombre ?? ''} ${p.choferes?.apellido_paterno ?? ''}`.toLowerCase();
    return nombre.includes(t) || String(p.monto).includes(t) || (p.fecha_pago ?? '').includes(t);
  });

  const total = pendientes.reduce((acc, curr) => acc + parseFloat(curr.monto || 0), 0);

  return (
    <div className="flex flex-col gap-6 h-full">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-text-tablas">Pagos Pendientes</h2>
        <div className="text-sm font-black text-rojo bg-rojo/10 px-4 py-2 rounded-full border border-rojo/20 uppercase">
          Total: ${total.toLocaleString()}
        </div>
      </header>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 text-text-tablas bg-gray-50/50">
                <th className="p-4">ID</th><th className="p-4">Chofer</th>
                <th className="p-4">Monto</th><th className="p-4">Fecha Límite</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="p-10 text-center animate-pulse">Cargando deudas...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-gray-400">No hay pagos pendientes.</td></tr>
              ) : filtrados.map((pago) => {
                const choferNombre = pago.choferes
                  ? `${pago.choferes.nombre} ${pago.choferes.apellido_paterno}`
                  : `Chofer #${pago.id_chofer}`;
                return (
                  <tr key={pago.id_pago} className="border-b border-gray-100 hover:bg-gray-50 transition text-text-tablas">
                    <td className="p-4 font-mono text-gray-400">{pago.id_pago}</td>
                    <td className="p-4 font-medium">{choferNombre}</td>
                    <td className="p-4 text-rojo font-bold">${parseFloat(pago.monto).toLocaleString()}</td>
                    <td className="p-4">{pago.fecha_pago}</td>
                    <td className="p-4 text-center">
                      <Button
                        onClick={() => handleMarcarPagado(pago.id_pago, pago.monto, choferNombre)}
                        className="px-4 py-1 rounded-full text-[10px] font-black uppercase bg-verde/10 text-verde border border-verde/20 hover:bg-verde/20 transition-all"
                      >
                        Liquidar
                      </Button>
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