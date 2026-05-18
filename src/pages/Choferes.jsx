import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from "../lib/supabase";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import { useToast } from "../components/ui/Toast";

export default function Choferes() {
  const { searchTerm } = useOutletContext();
  const { toast, confirm } = useToast();

  const [choferes, setChoferes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // ✅ bloquea doble clic
  const [formKey, setFormKey] = useState(0);
  const [formData, setFormData] = useState({
    nombre: '', apellido_paterno: '', apellido_materno: '',
    telefono: '', licencia: 'B', estatus: 'activo'
  });
  const [editId, setEditId] = useState(null);

  const fetchChoferes = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('choferes').select('*').order('id_chofer', { ascending: true });
    if (!error) setChoferes(data);
    setLoading(false);
  };

  useEffect(() => { fetchChoferes(); }, []);

  // ✅ Sanitizar: elimina espacios múltiples, permite solo letras y espacios
  const sanitizarNombre = (val) => val.replace(/\s+/g, ' ');

  const handleChange = (e) => {
    const { name, value } = e.target;
    // ✅ Teléfono: solo dígitos, guiones y +
    if (name === 'telefono' && value && !/^[0-9+\-\s]*$/.test(value)) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({ nombre: '', apellido_paterno: '', apellido_materno: '', telefono: '', licencia: 'B', estatus: 'activo' });
    setFormKey(prev => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // ✅ bloquear doble clic

    // ✅ Validar que nombre no sea solo espacios
    const nombreClean = sanitizarNombre(formData.nombre).trim();
    const apellidoClean = sanitizarNombre(formData.apellido_paterno).trim();

    if (!nombreClean) {
      toast({ message: 'El nombre no puede estar vacío o contener solo espacios.', type: 'warning' }); return;
    }
    if (!apellidoClean) {
      toast({ message: 'El apellido paterno no puede estar vacío o contener solo espacios.', type: 'warning' }); return;
    }
    // ✅ Mínimo 2 caracteres en nombre y apellido
    if (nombreClean.length < 2) {
      toast({ message: 'El nombre debe tener al menos 2 caracteres.', type: 'warning' }); return;
    }
    if (apellidoClean.length < 2) {
      toast({ message: 'El apellido paterno debe tener al menos 2 caracteres.', type: 'warning' }); return;
    }

    // ✅ Detectar duplicado por nombre + apellido (case insensitive)
    const duplicado = choferes.find(c =>
      c.nombre.trim().toLowerCase() === nombreClean.toLowerCase() &&
      c.apellido_paterno.trim().toLowerCase() === apellidoClean.toLowerCase() &&
      c.id_chofer !== editId
    );
    if (duplicado) {
      toast({ message: `Ya existe un chofer llamado ${nombreClean} ${apellidoClean} (ID: ${duplicado.id_chofer}).`, type: 'warning' }); return;
    }

    const accion = editId ? 'actualizar' : 'registrar';
    const ok = await confirm(`¿Deseas ${accion} a ${nombreClean} ${apellidoClean}?`);
    if (!ok) return;

    setSubmitting(true);
    try {
      // Liberar asignaciones si se marca inactivo/suspendido
      if (editId && (formData.estatus === 'inactivo' || formData.estatus === 'suspendido')) {
        const { data: activas } = await supabase.from('asignaciones')
          .select('id_asignacion, id_vehiculo').eq('id_chofer', editId).eq('activa', true);
        if (activas?.length > 0) {
          for (const asig of activas) {
            await supabase.from('asignaciones').update({ activa: false, fecha_fin: new Date().toISOString().split('T')[0] }).eq('id_asignacion', asig.id_asignacion);
            await supabase.from('vehiculos').update({ estatus: 'disponible' }).eq('id_vehiculo', asig.id_vehiculo);
          }
        }
      }

      const payload = {
        nombre: nombreClean,
        apellido_paterno: apellidoClean,
        apellido_materno: sanitizarNombre(formData.apellido_materno).trim() || null,
        telefono: formData.telefono.trim() || null,
        licencia: formData.licencia,
        estatus: formData.estatus
      };

      if (editId) {
        const { error } = await supabase.from('choferes').update(payload).eq('id_chofer', editId);
        if (error) { toast({ message: 'Error al actualizar: ' + error.message, type: 'error' }); return; }
        toast({ message: 'Chofer actualizado correctamente.', type: 'success' });
      } else {
        const { error } = await supabase.from('choferes').insert([payload]);
        if (error) { toast({ message: 'Error al registrar: ' + error.message, type: 'error' }); return; }
        toast({ message: 'Chofer registrado con éxito.', type: 'success' });
      }

      resetForm();
      fetchChoferes();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (chofer) => {
    setFormData({
      nombre: chofer.nombre ?? '', apellido_paterno: chofer.apellido_paterno ?? '',
      apellido_materno: chofer.apellido_materno ?? '', telefono: chofer.telefono ?? '',
      licencia: chofer.licencia ?? 'B', estatus: chofer.estatus ?? 'activo'
    });
    setEditId(chofer.id_chofer);
    setFormKey(prev => prev + 1);
  };

  const handleDelete = async (id, nombre) => {
    const ok = await confirm(`¿Eliminar a ${nombre}? Se borrarán todas sus asignaciones y no se puede deshacer.`);
    if (!ok) return;

    // Liberar asignaciones activas primero
    const { data: activas } = await supabase.from('asignaciones')
      .select('id_asignacion, id_vehiculo').eq('id_chofer', id).eq('activa', true);
    if (activas?.length > 0) {
      for (const asig of activas) {
        await supabase.from('asignaciones').update({ activa: false }).eq('id_asignacion', asig.id_asignacion);
        await supabase.from('vehiculos').update({ estatus: 'disponible' }).eq('id_vehiculo', asig.id_vehiculo);
      }
    }
    // Borrar historial completo de asignaciones (evita FK constraint)
    await supabase.from('asignaciones').delete().eq('id_chofer', id);

    const { error } = await supabase.from('choferes').delete().eq('id_chofer', id);
    if (error) toast({ message: 'Error al eliminar: ' + error.message, type: 'error' });
    else { toast({ message: `${nombre} eliminado correctamente.`, type: 'success' }); fetchChoferes(); }
  };

  const choferesFiltrados = choferes.filter(c => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return (
      c.nombre?.toLowerCase().includes(t) ||
      c.apellido_paterno?.toLowerCase().includes(t) ||
      (c.apellido_materno ?? '').toLowerCase().includes(t) ||
      (c.telefono ?? '').toLowerCase().includes(t) ||
      c.licencia?.toLowerCase().includes(t) ||
      c.estatus?.toLowerCase().includes(t) ||
      String(c.id_chofer).includes(t)
    );
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
                  <th className="p-3">ID</th><th className="p-3">Nombre Completo</th>
                  <th className="p-3">Teléfono</th><th className="p-3 text-center">Licencia</th>
                  <th className="p-3">Estatus</th><th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="p-6 text-center animate-pulse text-gray-500">Cargando datos...</td></tr>
                ) : choferesFiltrados.length === 0 ? (
                  <tr><td colSpan="6" className="p-6 text-center text-gray-400">Sin resultados.</td></tr>
                ) : choferesFiltrados.map((chofer) => (
                  <tr key={chofer.id_chofer} className="border-b border-gray-100 hover:bg-gray-50 transition text-text-tablas">
                    <td className="p-3 font-mono">{chofer.id_chofer}</td>
                    <td className="p-3 font-medium">{chofer.nombre} {chofer.apellido_paterno} {chofer.apellido_materno ?? ''}</td>
                    <td className="p-3">{chofer.telefono || 'N/A'}</td>
                    <td className="p-3 text-center font-medium">{chofer.licencia}</td>
                    <td className="p-3"><Badge status={chofer.estatus} /></td>
                    <td className="p-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <Button variant="secondary" onClick={() => handleEdit(chofer)}>Editar</Button>
                        <Button variant="danger" onClick={() => handleDelete(chofer.id_chofer, `${chofer.nombre} ${chofer.apellido_paterno}`)}>Eliminar</Button>
                      </div>
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
          <h2 className="text-lg font-semibold mb-4 text-text-tablas">{editId ? 'Editar Chofer' : 'Nuevo Chofer'}</h2>
          <form key={formKey} onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div><label className="text-xs text-text-tablas">Nombre</label><Input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required minLength={2} /></div>
            <div><label className="text-xs text-text-tablas">Apellido Paterno</label><Input type="text" name="apellido_paterno" value={formData.apellido_paterno} onChange={handleChange} required minLength={2} /></div>
            <div><label className="text-xs text-text-tablas">Apellido Materno</label><Input type="text" name="apellido_materno" value={formData.apellido_materno} onChange={handleChange} /></div>
            <div><label className="text-xs text-text-tablas">Teléfono</label><Input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} maxLength="15" /></div>
            <div>
              <label className="text-xs text-text-tablas">Tipo de Licencia</label>
              <select name="licencia" value={formData.licencia} onChange={handleChange} className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas">
                <option value="B">Tipo B</option><option value="C">Tipo C</option><option value="D">Tipo D</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-tablas">Estatus</label>
              <select name="estatus" value={formData.estatus} onChange={handleChange} className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas">
                <option value="activo">Activo</option><option value="inactivo">Inactivo</option><option value="suspendido">Suspendido</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={submitting} className={`flex-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border transition-all ${submitting ? 'opacity-50 cursor-not-allowed' : ''} ${editId ? 'bg-azul/10 text-azul border-azul/20 hover:bg-azul/20' : 'bg-verde/10 text-verde border-verde/20 hover:bg-verde/20'}`}>
                {submitting ? 'Guardando...' : editId ? 'Actualizar' : 'Guardar'}
              </Button>
              {editId && <Button type="button" className="flex-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rojo/10 text-rojo border border-rojo/20 hover:bg-rojo/20 transition-all" onClick={resetForm}>Cancelar</Button>}
            </div>
          </form>
        </Card>
      </aside>
    </div>
  );
}