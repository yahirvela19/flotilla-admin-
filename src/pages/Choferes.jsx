import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from "../lib/supabase"; 
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";

export default function Choferes() {
  const { searchTerm } = useOutletContext();

  const [choferes, setChoferes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    telefono: '',
    licencia: 'B',
    estatus: 'activo'
  });
  const [editId, setEditId] = useState(null);

  const fetchChoferes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('choferes')
      .select('*')
      .order('id_chofer', { ascending: true });

    if (!error) setChoferes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchChoferes();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // --- LÓGICA DE LIBERACIÓN MASIVA (INACTIVO O SUSPENDIDO) ---
    if (editId && (formData.estatus === 'inactivo' || formData.estatus === 'suspendido')) {
      // Buscamos TODAS las asignaciones activas de este chofer
      const { data: asignacionesActivas } = await supabase
        .from('asignaciones')
        .select('id_asignacion, id_vehiculo')
        .eq('id_chofer', editId)
        .eq('activa', true);

      if (asignacionesActivas && asignacionesActivas.length > 0) {
        // Recorremos cada asignación para liberar los vehículos uno por uno
        for (const asig of asignacionesActivas) {
          // 1. Finalizar asignación
          await supabase
            .from('asignaciones')
            .update({ activa: false, fecha_fin: new Date().toISOString().split('T')[0] })
            .eq('id_asignacion', asig.id_asignacion);

          // 2. Liberar vehículo vinculado
          await supabase
            .from('vehiculos')
            .update({ estatus: 'disponible' })
            .eq('id_vehiculo', asig.id_vehiculo);
        }
      }
    }

    // --- GUARDAR O ACTUALIZAR CHOFER ---
    const payload = {
      nombre: formData.nombre,
      apellido_paterno: formData.apellido_paterno,
      apellido_materno: formData.apellido_materno,
      telefono: formData.telefono,
      licencia: formData.licencia,
      estatus: formData.estatus
    };

    if (editId) {
      await supabase.from('choferes').update(payload).eq('id_chofer', editId);
    } else {
      await supabase.from('choferes').insert([payload]);
    }

    // Reset y Refrescar
    setEditId(null);
    setFormData({ nombre: '', apellido_paterno: '', apellido_materno: '', telefono: '', licencia: 'B', estatus: 'activo' });
    fetchChoferes();
  };

  const handleEdit = (chofer) => {
    setFormData({
      nombre: chofer.nombre,
      apellido_paterno: chofer.apellido_paterno,
      apellido_materno: chofer.apellido_materno,
      telefono: chofer.telefono || '',
      licencia: chofer.licencia,
      estatus: chofer.estatus
    });
    setEditId(chofer.id_chofer);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro? Se eliminará el chofer y SE LIBERARÁN TODAS sus unidades asignadas.')) {
      
      // BUSCAR TODAS LAS ASIGNACIONES ANTES DE BORRAR
      const { data: asignacionesActivas } = await supabase
        .from('asignaciones')
        .select('id_asignacion, id_vehiculo')
        .eq('id_chofer', id)
        .eq('activa', true);

      if (asignacionesActivas && asignacionesActivas.length > 0) {
        for (const asig of asignacionesActivas) {
          await supabase.from('asignaciones').update({ activa: false }).eq('id_asignacion', asig.id_asignacion);
          await supabase.from('vehiculos').update({ estatus: 'disponible' }).eq('id_vehiculo', asig.id_vehiculo);
        }
      }

      const { error } = await supabase.from('choferes').delete().eq('id_chofer', id);
      if (error) alert("Error: " + error.message);
      else fetchChoferes();
    }
  };

  const choferesFiltrados = choferes.filter(chofer => {
    if (!searchTerm) return true;
    const nombreCompleto = `${chofer.nombre} ${chofer.apellido_paterno} ${chofer.apellido_materno}`.toLowerCase();
    return nombreCompleto.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex gap-6 h-full">
      <main className="flex-1">
        <h2 className="text-2xl font-semibold mb-6 text-text-tablas">Directorio de Choferes</h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 text-text-tablas">
                  <th className="p-3">ID</th>
                  <th className="p-3">Nombre Completo</th>
                  <th className="p-3">Teléfono</th>
                  <th className="p-3 text-center">Licencia</th>
                  <th className="p-3">Estatus</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="p-6 text-center animate-pulse text-gray-500">Cargando datos...</td></tr>
                ) : (
                  choferesFiltrados.map((chofer) => (
                    <tr key={chofer.id_chofer} className="border-b border-gray-100 hover:bg-gray-50 transition text-text-tablas">
                      <td className="p-3 font-mono">{chofer.id_chofer}</td>
                      <td className="p-3 font-medium">{chofer.nombre} {chofer.apellido_paterno} {chofer.apellido_materno}</td>
                      <td className="p-3">{chofer.telefono || "N/A"}</td>
                      <td className="p-3 text-center font-medium">{chofer.licencia}</td>
                      <td className="p-3"><Badge status={chofer.estatus} /></td>
                      <td className="p-3 flex gap-2 justify-center">
                        <Button variant="secondary" onClick={() => handleEdit(chofer)}>Editar</Button>
                        <Button variant="danger" onClick={() => handleDelete(chofer.id_chofer)}>Eliminar</Button>
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
            {editId ? "Editar Chofer" : "Nuevo Chofer"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-text-tablas">Nombre</label>
              <Input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
            </div>
            <div>
              <label className="text-xs text-text-tablas">Apellido Paterno</label>
              <Input type="text" name="apellido_paterno" value={formData.apellido_paterno} onChange={handleChange} required />
            </div>
            <div>
              <label className="text-xs text-text-tablas">Apellido Materno</label>
              <Input type="text" name="apellido_materno" value={formData.apellido_materno} onChange={handleChange} required />
            </div>
            <div>
              <label className="text-xs text-text-tablas">Teléfono</label>
              <Input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} maxLength="15" />
            </div>
            <div>
              <label className="text-xs text-text-tablas">Tipo de Licencia</label>
              <select name="licencia" value={formData.licencia} onChange={handleChange} className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas">
                <option value="B">Tipo B</option>
                <option value="C">Tipo C</option>
                <option value="D">Tipo D</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-tablas">Estatus</label>
              <select name="estatus" value={formData.estatus} onChange={handleChange} className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2 text-text-tablas">
              <Button 
                type="submit" 
                className={`flex-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border transition-all ${
                  editId 
                    ? "bg-azul/10 text-azul border-azul/20 hover:bg-azul/20" 
                    : "bg-verde/10 text-verde border-verde/20 hover:bg-verde/20"
                }`}
              >
                {editId ? "Actualizar" : "Guardar"}
              </Button>
              {editId && (
                <Button 
                  type="button" 
                  className="flex-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rojo/10 text-rojo border border-rojo/20 hover:bg-rojo/20 transition-all" 
                  onClick={() => { setEditId(null); setFormData({ nombre: '', apellido_paterno: '', apellido_materno: '', telefono: '', licencia: 'B', estatus: 'activo' }); }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Card>
      </aside>
    </div>
  );
}