import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from "../lib/supabase";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
 
export default function Asignaciones() {
  const { searchTerm } = useOutletContext();
 
  const [asignaciones, setAsignaciones] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
 
  const [formData, setFormData] = useState({
    id_chofer: '',
    id_vehiculo: ''
  });
 
  const fetchData = async () => {
    setLoading(true);
 
    // ✅ Fix advertencia: solo traemos asignaciones activas desde la query
    const { data: asigData } = await supabase
      .from('asignaciones')
      .select(`
        id_asignacion,
        fecha_inicio,
        fecha_fin,
        activa,
        id_vehiculo,
        choferes (id_chofer, nombre, apellido_paterno),
        vehiculos (id_vehiculo, placa, modelo)
      `)
      .eq('activa', true)
      .order('id_asignacion', { ascending: false });
 
    const { data: chofData } = await supabase
      .from('choferes')
      .select('id_chofer, nombre, apellido_paterno')
      .eq('estatus', 'activo');
 
    const { data: vehData } = await supabase
      .from('vehiculos')
      .select('id_vehiculo, placa, modelo')
      .eq('estatus', 'disponible');
 
    if (asigData) setAsignaciones(asigData);
    if (chofData) setChoferes(chofData);
    if (vehData) setVehiculos(vehData);
    setLoading(false);
  };
 
  useEffect(() => {
    fetchData();
  }, []);
 
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
 
    // ✅ Fix #4: validar que el chofer no tenga ya una asignación activa
    const { data: yaAsignado, error: errorCheck } = await supabase
      .from('asignaciones')
      .select('id_asignacion')
      .eq('id_chofer', Number(formData.id_chofer))
      .eq('activa', true)
      .maybeSingle();
 
    if (errorCheck) {
      alert('Error al validar asignación: ' + errorCheck.message);
      return;
    }
 
    if (yaAsignado) {
      alert('⚠️ Este chofer ya tiene una unidad asignada actualmente. Finaliza su asignación actual primero.');
      return;
    }
 
    // Crear la asignación
    const { error: errorAsig } = await supabase
      .from('asignaciones')
      .insert([{
        id_chofer: Number(formData.id_chofer),
        id_vehiculo: Number(formData.id_vehiculo),
        fecha_inicio: new Date().toISOString().split('T')[0],
        activa: true
      }]);
 
    if (errorAsig) {
      alert('Error al crear asignación: ' + errorAsig.message);
      return;
    }
 
    // ✅ Fix #5: manejar error al actualizar el vehículo
    const { error: errorVeh } = await supabase
      .from('vehiculos')
      .update({ estatus: 'en_servicio' })
      .eq('id_vehiculo', Number(formData.id_vehiculo));
 
    if (errorVeh) {
      // La asignación se creó pero el vehículo no se actualizó — avisamos
      alert('⚠️ Asignación creada pero hubo un error al actualizar el estatus del vehículo: ' + errorVeh.message);
    } else {
      alert('¡Asignación guardada con éxito!');
    }
 
    setFormData({ id_chofer: '', id_vehiculo: '' });
    fetchData();
  };
 
  const handleFinalizar = async (id_asignacion, id_vehiculo) => {
    if (window.confirm('¿Deseas finalizar esta asignación y liberar el vehículo?')) {
      const { error: asigError } = await supabase
        .from('asignaciones')
        .update({
          activa: false,
          fecha_fin: new Date().toISOString().split('T')[0]
        })
        .eq('id_asignacion', id_asignacion);
 
      if (asigError) {
        alert('Error al finalizar la asignación: ' + asigError.message);
        return;
      }
 
      const { error: vehError } = await supabase
        .from('vehiculos')
        .update({ estatus: 'disponible' })
        .eq('id_vehiculo', id_vehiculo);
 
      if (vehError) {
        alert('⚠️ Asignación finalizada pero hubo un error al liberar el vehículo: ' + vehError.message);
      }
 
      fetchData();
    }
  };
 
  const asignacionesFiltradas = asignaciones.filter(asig => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const choferNombre = `${asig.choferes?.nombre ?? ''} ${asig.choferes?.apellido_paterno ?? ''}`.toLowerCase();
    const vehiculoInfo = `${asig.vehiculos?.placa ?? ''} ${asig.vehiculos?.modelo ?? ''}`.toLowerCase();
    return choferNombre.includes(term) || vehiculoInfo.includes(term);
  });
 
  return (
    <div className="flex gap-6 h-full">
 
      <main className="flex-1">
        <h2 className="text-2xl font-semibold mb-6 text-text-tablas">
          Registro de Asignaciones
        </h2>
 
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 text-text-tablas">
                  <th className="p-3">Chofer</th>
                  <th className="p-3">Vehículo</th>
                  <th className="p-3">Fecha Inicio</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
 
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-gray-500 animate-pulse">
                      Cargando asignaciones...
                    </td>
                  </tr>
                ) : asignacionesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-gray-400">
                      No hay asignaciones activas
                    </td>
                  </tr>
                ) : (
                  asignacionesFiltradas.map((asig) => (
                    <tr key={asig.id_asignacion} className="border-b border-gray-100 hover:bg-gray-50 transition text-text-tablas">
                      <td className="p-3">
                        {asig.choferes?.nombre ?? ''} {asig.choferes?.apellido_paterno ?? ''}
                      </td>
                      <td className="p-3 font-medium">
                        {asig.vehiculos?.placa} - {asig.vehiculos?.modelo}
                      </td>
                      <td className="p-3">
                        {asig.fecha_inicio}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleFinalizar(asig.id_asignacion, asig.id_vehiculo)}
                          className="text-[#ff6b6b] text-[10px] font-black uppercase hover:text-red-700 transition-all tracking-wider"
                        >
                          Finalizar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
 
      <aside className="w-[350px]">
        <Card>
          <h2 className="text-lg font-semibold mb-4 text-text-tablas">
            Nueva Asignación
          </h2>
 
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-text-tablas">Chofer Disponible</label>
              <select
                name="id_chofer"
                value={formData.id_chofer}
                onChange={handleChange}
                required
                className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas"
              >
                <option value="">Seleccionar Chofer...</option>
                {choferes.map(c => (
                  <option key={c.id_chofer} value={c.id_chofer}>
                    {c.nombre} {c.apellido_paterno}
                  </option>
                ))}
              </select>
            </div>
 
            <div>
              <label className="text-xs text-text-tablas">Vehículo Disponible</label>
              <select
                name="id_vehiculo"
                value={formData.id_vehiculo}
                onChange={handleChange}
                required
                className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas"
              >
                <option value="">Seleccionar Vehículo...</option>
                {vehiculos.map(v => (
                  <option key={v.id_vehiculo} value={v.id_vehiculo}>
                    {v.placa} - {v.modelo}
                  </option>
                ))}
              </select>
            </div>
 
            <div className="flex gap-2 pt-2 text-text-tablas">
              <Button
                type="submit"
                className="flex-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border transition-all bg-verde/10 text-verde border-verde/20 hover:bg-verde/20"
              >
                Guardar Asignación
              </Button>
            </div>
          </form>
        </Card>
      </aside>
 
    </div>
  );
}