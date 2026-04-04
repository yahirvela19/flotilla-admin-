import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from "../lib/supabase";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";

export default function Vehiculos() {
  const { searchTerm } = useOutletContext();

  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    placa: '',
    marca: '',
    modelo: '',
    anio: '',
    color: '',
    numero_serie: '',
    estatus: 'disponible' // Por defecto
  });
  const [editId, setEditId] = useState(null);

  // 1. CARGAR DATOS
  const fetchVehiculos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehiculos')
      .select('*')
      .order('id_vehiculo', { ascending: true });

    if (error) {
      console.error('Error:', error);
    } else {
      setVehiculos(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVehiculos();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. GUARDAR / ACTUALIZAR CON CANDADOS DE SEGURIDAD
  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- REGLA DE SEGURIDAD: Bloqueo de cambio si está en servicio ---
    if (editId) {
      const vehiculoOriginal = vehiculos.find(v => v.id_vehiculo === editId);

      // Si intentan cambiar el estatus y el vehículo está "en_servicio" actualmente
      if (vehiculoOriginal.estatus === 'en_servicio' && formData.estatus !== 'en_servicio') {
        const { data: asignaciones } = await supabase
          .from('asignaciones')
          .select('id_asignacion')
          .eq('id_vehiculo', editId)
          .eq('activa', true);

        if (asignaciones && asignaciones.length > 0) {
          alert("⚠️ DEBE ELIMINAR LA ASIGNACIÓN DEL CHOFER ANTES DE MODIFICAR EL ESTATUS");
          return; // Detiene el proceso por completo
        }
      }
    }

    const payload = {
      placa: formData.placa.toUpperCase(),
      marca: formData.marca,
      modelo: formData.modelo,
      anio: parseInt(formData.anio),
      color: formData.color,
      numero_serie: formData.numero_serie || null,
      // REGLA: Si es nuevo siempre es 'disponible'. Si es edit, respetamos el form.
      estatus: editId ? formData.estatus : 'disponible', 
    };

    if (editId) {
      const { data, error } = await supabase
        .from('vehiculos')
        .update(payload)
        .eq('id_vehiculo', editId)
        .select();

      if (error) {
        alert('Error al actualizar: ' + error.message);
      } else {
        setVehiculos(vehiculos.map(v => v.id_vehiculo === editId ? data[0] : v));
        setEditId(null);
        alert('Vehículo actualizado correctamente');
      }
    } else {
      const { data, error } = await supabase
        .from('vehiculos')
        .insert([payload])
        .select();

      if (error) {
        alert('Error al crear: ' + error.message);
      } else {
        setVehiculos([...vehiculos, data[0]]);
        alert('Nuevo vehículo registrado como "Disponible"');
      }
    }

    // Resetear formulario
    setFormData({ placa: '', marca: '', modelo: '', anio: '', color: '', numero_serie: '', estatus: 'disponible' });
  };

  const handleEdit = (vehiculo) => {
    setFormData({
      placa: vehiculo.placa,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      color: vehiculo.color || '',
      numero_serie: vehiculo.numero_serie || '',
      estatus: vehiculo.estatus
    });
    setEditId(vehiculo.id_vehiculo);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este vehículo permanentemente?')) {
      const { error } = await supabase
        .from('vehiculos')
        .delete()
        .eq('id_vehiculo', id);

      if (error) {
        alert('No se puede eliminar: tiene historial o asignaciones activas.');
      } else {
        setVehiculos(vehiculos.filter(v => v.id_vehiculo !== id));
      }
    }
  };

  // FILTRADO
  const vehiculosFiltrados = vehiculos.filter(v => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return v.placa.toLowerCase().includes(t) || v.modelo.toLowerCase().includes(t) || v.marca.toLowerCase().includes(t);
  });

  return (
    <div className="flex gap-6 h-full p-4">
      {/* SECCIÓN DE LA TABLA */}
      <main className="flex-1">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Control de Unidades</h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600 bg-gray-50">
                  <th className="p-3">ID</th>
                  <th className="p-3">Placa</th>
                  <th className="p-3">Marca/Modelo</th>
                  <th className="p-3">Año</th>
                  <th className="p-3">Estatus</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="p-10 text-center animate-pulse">Cargando unidades...</td></tr>
                ) : vehiculosFiltrados.map((v) => (
                  <tr key={v.id_vehiculo} className="border-b hover:bg-gray-50 transition">
                    <td className="p-3 text-gray-400">#{v.id_vehiculo}</td>
                    <td className="p-3 font-bold">{v.placa}</td>
                    <td className="p-3">{v.marca} {v.modelo}</td>
                    <td className="p-3">{v.anio}</td>
                    <td className="p-3"><Badge status={v.estatus} /></td>
                    <td className="p-3 flex justify-center gap-2">
                      <Button variant="secondary" onClick={() => handleEdit(v)}>Editar</Button>
                      <Button variant="danger" onClick={() => handleDelete(v.id_vehiculo)}>Eliminar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* SECCIÓN LATERAL (FORMULARIO) */}
      <aside className="w-[350px]">
        <Card>
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            {editId ? "Modificar Unidad" : "Alta de Unidad"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400">Placa</label>
              <Input name="placa" value={formData.placa} onChange={handleChange} required placeholder="ABC-1234" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400">Marca</label>
                <Input name="marca" value={formData.marca} onChange={handleChange} required />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400">Modelo</label>
                <Input name="modelo" value={formData.modelo} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400">Año</label>
                <Input type="number" name="anio" value={formData.anio} onChange={handleChange} required />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400">Color</label>
                <Input name="color" value={formData.color} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400">Número de Serie</label>
              <Input name="numero_serie" value={formData.numero_serie} onChange={handleChange} />
            </div>

            {/* SELECT DE ESTATUS (Solo en Edición) */}
            {editId && (
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400">Estado de Operación</label>
                <select
                  name="estatus"
                  value={formData.estatus}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-accent outline-none"
                >
                  <option value="disponible">✅ Disponible</option>
                  <option value="mantenimiento">🛠️ Mantenimiento</option>
                  <option value="baja">🚫 Baja Definitiva</option>
                  {formData.estatus === 'en_servicio' && (
                    <option value="en_servicio" disabled>🚚 En Servicio (Ocupado)</option>
                  )}
                </select>
                <p className="text-[9px] text-gray-400 mt-1 italic">
                  * No se puede cambiar el estatus si tiene un chofer asignado.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-4">
              <Button type="submit" className="w-full py-3">
                {editId ? "Guardar Cambios" : "Registrar Unidad"}
              </Button>
              {editId && (
                <Button variant="secondary" type="button" onClick={() => {
                  setEditId(null);
                  setFormData({ placa: '', marca: '', modelo: '', anio: '', color: '', numero_serie: '', estatus: 'disponible' });
                }}>
                  Cancelar Edición
                </Button>
              )}
            </div>
          </form>
        </Card>
      </aside>
    </div>
  );
}