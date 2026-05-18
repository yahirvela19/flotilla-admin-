import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from "../lib/supabase";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";

export default function Asignaciones() {
  const { searchTerm } = useOutletContext();
  const { toast, confirm } = useToast();

  const [asignaciones, setAsignaciones] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // ✅ bloquea doble clic
  const [formData, setFormData] = useState({ id_chofer: '', id_vehiculo: '' });

  const fetchData = async () => {
    setLoading(true);

    // ✅ Join directo — trae vehículo aunque esté en_servicio
    const { data: asigData } = await supabase
      .from('asignaciones')
      .select(`
        id_asignacion, fecha_inicio, activa, id_vehiculo, id_chofer,
        choferes (id_chofer, nombre, apellido_paterno),
        vehiculos (id_vehiculo, placa, marca, modelo)
      `)
      .eq('activa', true)
      .order('id_asignacion', { ascending: false });

    const { data: chofData } = await supabase
      .from('choferes').select('id_chofer, nombre, apellido_paterno')
      .eq('estatus', 'activo').order('nombre', { ascending: true });

    const { data: vehData } = await supabase
      .from('vehiculos').select('id_vehiculo, placa, marca, modelo')
      .eq('estatus', 'disponible').order('placa', { ascending: true });

    if (asigData) setAsignaciones(asigData);
    if (chofData) setChoferes(chofData);
    if (vehData) setVehiculos(vehData);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // ✅ bloquear doble clic

    setSubmitting(true);
    try {
      // ✅ Verificar doble asignación del mismo chofer
      const { data: yaAsignado, error: errorCheck } = await supabase
        .from('asignaciones').select('id_asignacion')
        .eq('id_chofer', Number(formData.id_chofer)).eq('activa', true).maybeSingle();

      if (errorCheck) { toast({ message: 'Error al validar: ' + errorCheck.message, type: 'error' }); return; }
      if (yaAsignado) { toast({ message: 'Este chofer ya tiene una unidad asignada. Finaliza su asignación primero.', type: 'warning' }); return; }

      // ✅ Verificar que el vehículo siga disponible (condición de carrera)
      const { data: vehActual } = await supabase.from('vehiculos').select('estatus').eq('id_vehiculo', Number(formData.id_vehiculo)).single();
      if (vehActual?.estatus !== 'disponible') {
        toast({ message: 'El vehículo ya no está disponible. Recarga e intenta de nuevo.', type: 'warning' });
        fetchData(); return;
      }

      const chofer = choferes.find(c => c.id_chofer === Number(formData.id_chofer));
      const vehiculo = vehiculos.find(v => v.id_vehiculo === Number(formData.id_vehiculo));
      const ok = await confirm(`¿Asignar a ${chofer?.nombre} ${chofer?.apellido_paterno} el vehículo ${vehiculo?.placa}?`);
      if (!ok) return;

      const { error: errorAsig } = await supabase.from('asignaciones').insert([{
        id_chofer: Number(formData.id_chofer),
        id_vehiculo: Number(formData.id_vehiculo),
        fecha_inicio: new Date().toISOString().split('T')[0],
        activa: true
      }]);
      if (errorAsig) { toast({ message: 'Error al crear asignación: ' + errorAsig.message, type: 'error' }); return; }

      // ✅ Cambiar estatus del vehículo a en_servicio
      const { error: errorVeh } = await supabase.from('vehiculos').update({ estatus: 'en_servicio' }).eq('id_vehiculo', Number(formData.id_vehiculo));
      if (errorVeh) toast({ message: 'Asignación creada pero error al actualizar vehículo: ' + errorVeh.message, type: 'warning' });
      else toast({ message: '¡Asignación guardada con éxito!', type: 'success' });

      setFormData({ id_chofer: '', id_vehiculo: '' });
      fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizar = async (id_asignacion, id_vehiculo, nombreChofer, placa) => {
    const ok = await confirm(`¿Finalizar la asignación de ${nombreChofer} con el vehículo ${placa}?`);
    if (!ok) return;

    const { error: asigError } = await supabase.from('asignaciones')
      .update({ activa: false, fecha_fin: new Date().toISOString().split('T')[0] })
      .eq('id_asignacion', id_asignacion);
    if (asigError) { toast({ message: 'Error al finalizar: ' + asigError.message, type: 'error' }); return; }

    const { error: vehError } = await supabase.from('vehiculos').update({ estatus: 'disponible' }).eq('id_vehiculo', id_vehiculo);
    if (vehError) toast({ message: 'Asignación finalizada pero error al liberar vehículo: ' + vehError.message, type: 'warning' });
    else toast({ message: 'Asignación finalizada correctamente.', type: 'success' });

    fetchData();
  };

  const asignacionesFiltradas = asignaciones.filter(asig => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    const chofer = `${asig.choferes?.nombre ?? ''} ${asig.choferes?.apellido_paterno ?? ''}`.toLowerCase();
    const vehiculo = `${asig.vehiculos?.placa ?? ''} ${asig.vehiculos?.marca ?? ''} ${asig.vehiculos?.modelo ?? ''}`.toLowerCase();
    return chofer.includes(t) || vehiculo.includes(t) || (asig.fecha_inicio ?? '').includes(t);
  });

  return (
    <div className="flex gap-6 h-full">
      <main className="flex-1">
        <h2 className="text-2xl font-semibold mb-6 text-text-tablas">Registro de Asignaciones</h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 text-text-tablas">
                  <th className="p-3">Chofer</th><th className="p-3">Vehículo</th>
                  <th className="p-3">Fecha Inicio</th><th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="p-6 text-center text-gray-500 animate-pulse">Cargando asignaciones...</td></tr>
                ) : asignacionesFiltradas.length === 0 ? (
                  <tr><td colSpan="4" className="p-6 text-center text-gray-400">No hay asignaciones activas.</td></tr>
                ) : asignacionesFiltradas.map((asig) => (
                  <tr key={asig.id_asignacion} className="border-b border-gray-100 hover:bg-gray-50 transition text-text-tablas">
                    <td className="p-3">{asig.choferes?.nombre ?? ''} {asig.choferes?.apellido_paterno ?? ''}</td>
                    <td className="p-3 font-medium">
                      {asig.vehiculos?.placa ?? '—'} {asig.vehiculos?.marca ?? ''} {asig.vehiculos?.modelo ?? ''}
                    </td>
                    <td className="p-3">{asig.fecha_inicio}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleFinalizar(
                          asig.id_asignacion, asig.id_vehiculo,
                          `${asig.choferes?.nombre ?? ''} ${asig.choferes?.apellido_paterno ?? ''}`,
                          asig.vehiculos?.placa ?? ''
                        )}
                        className="text-rojo text-[10px] font-black uppercase hover:text-red-700 transition-all tracking-wider"
                      >
                        Finalizar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
      <aside className="w-[350px]">
        <Card>
          <h2 className="text-lg font-semibold mb-4 text-text-tablas">Nueva Asignación</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-text-tablas">Chofer Activo</label>
              <select name="id_chofer" value={formData.id_chofer} onChange={handleChange} required className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas">
                <option value="">Seleccionar Chofer...</option>
                {choferes.map(c => <option key={c.id_chofer} value={c.id_chofer}>{c.nombre} {c.apellido_paterno}</option>)}
              </select>
              {choferes.length === 0 && <p className="text-[10px] text-amarillo mt-1">No hay choferes activos disponibles.</p>}
            </div>
            <div>
              <label className="text-xs text-text-tablas">Vehículo Disponible</label>
              <select name="id_vehiculo" value={formData.id_vehiculo} onChange={handleChange} required className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas">
                <option value="">Seleccionar Vehículo...</option>
                {vehiculos.map(v => <option key={v.id_vehiculo} value={v.id_vehiculo}>{v.placa} — {v.marca} {v.modelo}</option>)}
              </select>
              {vehiculos.length === 0 && <p className="text-[10px] text-amarillo mt-1">No hay vehículos disponibles.</p>}
            </div>
            <Button type="submit" disabled={submitting} className={`flex-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border transition-all ${submitting ? 'opacity-50 cursor-not-allowed' : 'bg-verde/10 text-verde border-verde/20 hover:bg-verde/20'}`}>
              {submitting ? 'Guardando...' : 'Guardar Asignación'}
            </Button>
          </form>
        </Card>
      </aside>
    </div>
  );
}