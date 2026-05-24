import React, { useState, useEffect } from 'react';
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

  const [choferes, setChoferes]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey]       = useState(0);
  const [formData, setFormData]     = useState({
    nombre: '', apellido_paterno: '', apellido_materno: '',
    telefono: '', licencia: 'B', estatus: 'activo'
  });
  const [editId, setEditId] = useState(null);

  const fetchChoferes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('choferes').select('*').order('id_chofer', { ascending: true });
    if (!error) setChoferes(data);
    setLoading(false);
  };

  useEffect(() => { fetchChoferes(); }, []);

  const sanitizarNombre = (val) => val.replace(/\s+/g, ' ');
  const limpiarLetras   = (val) => val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑ\s]/g, '');
  const limpiarNumeros  = (val) => val.replace(/[^0-9]/g, '');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['nombre', 'apellido_paterno', 'apellido_materno'].includes(name)) {
      setFormData(prev => ({ ...prev, [name]: limpiarLetras(value) })); return;
    }
    if (name === 'telefono') {
      setFormData(prev => ({ ...prev, [name]: limpiarNumeros(value) })); return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({ nombre: '', apellido_paterno: '', apellido_materno: '', telefono: '', licencia: 'B', estatus: 'activo' });
    setFormKey(prev => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // ── Limpiar valores ────────────────────────────────────────────────
    const nombreClean   = sanitizarNombre(limpiarLetras(formData.nombre)).trim();
    const apellidoClean = sanitizarNombre(limpiarLetras(formData.apellido_paterno)).trim();
    const maternoClean  = sanitizarNombre(limpiarLetras(formData.apellido_materno)).trim();
    const telefonoClean = limpiarNumeros(formData.telefono).trim();

    // ── Validar campos obligatorios ────────────────────────────────────
    const faltantes = [];
    if (!nombreClean   || nombreClean.length < 2)   faltantes.push('Nombre');
    if (!apellidoClean || apellidoClean.length < 2)  faltantes.push('Apellido Paterno');
    if (!telefonoClean || telefonoClean.length < 10) faltantes.push('Teléfono (10 dígitos)');

    if (faltantes.length > 0) {
      toast({ message: `Completa los campos obligatorios: ${faltantes.join(', ')}.`, type: 'warning' });
      return;
    }

    // ── Verificar duplicados (antes de mostrar el confirm) ─────────────
    // ✅ Bug fix: las queries de duplicado se ejecutan SIN setSubmitting(true)
    //    para no bloquear el UI antes de tiempo
    try {
      // Duplicado por nombre + apellido paterno
      let qNombre = supabase
        .from('choferes').select('id_chofer, nombre, apellido_paterno')
        .ilike('nombre', nombreClean)
        .ilike('apellido_paterno', apellidoClean);

      // Duplicado por teléfono
      let qTel = supabase
        .from('choferes').select('id_chofer, nombre, apellido_paterno')
        .eq('telefono', telefonoClean);

      // Al editar excluimos el propio registro
      if (editId) {
        qNombre = qNombre.neq('id_chofer', editId);
        qTel    = qTel.neq('id_chofer', editId);
      }

      const [{ data: dupNombre }, { data: dupTel }] = await Promise.all([qNombre, qTel]);

      if (dupNombre && dupNombre.length > 0) {
        toast({
          message: `Ya existe un chofer con el nombre "${nombreClean} ${apellidoClean}" (ID: ${dupNombre[0].id_chofer}).`,
          type: 'warning'
        });
        return;
      }

      if (dupTel && dupTel.length > 0) {
        toast({
          message: `El teléfono ${telefonoClean} ya está registrado para ${dupTel[0].nombre} ${dupTel[0].apellido_paterno} (ID: ${dupTel[0].id_chofer}).`,
          type: 'warning'
        });
        return;
      }
    } catch {
      toast({ message: 'Error al validar los datos. Intenta de nuevo.', type: 'error' });
      return;
    }

    // ── Pedir confirmación al usuario ──────────────────────────────────
    // ✅ Bug fix: el confirm va ANTES de setSubmitting(true)
    //    así el botón NO se bloquea mientras el modal está abierto
    const accion = editId ? 'actualizar' : 'guardar';
    const ok = await confirm(`¿Seguro que deseas ${accion} la información de ${nombreClean} ${apellidoClean}?`);
    if (!ok) return; // usuario canceló → el botón sigue habilitado, sin problema

    // ── A partir de aquí sí bloqueamos el botón ────────────────────────
    setSubmitting(true);
    try {
      // Si se marca inactivo/suspendido, liberar asignaciones activas
      if (editId && (formData.estatus === 'inactivo' || formData.estatus === 'suspendido')) {
        const { data: activas } = await supabase
          .from('asignaciones').select('id_asignacion, id_vehiculo')
          .eq('id_chofer', editId).eq('activa', true);

        if (activas?.length > 0) {
          for (const asig of activas) {
            await supabase.from('asignaciones')
              .update({ activa: false, fecha_fin: new Date().toISOString().split('T')[0] })
              .eq('id_asignacion', asig.id_asignacion);
            await supabase.from('vehiculos')
              .update({ estatus: 'disponible' })
              .eq('id_vehiculo', asig.id_vehiculo);
          }
        }
      }

      const payload = {
        nombre:           nombreClean,
        apellido_paterno: apellidoClean,
        apellido_materno: maternoClean || null,
        telefono:         telefonoClean,
        licencia:         formData.licencia,
        estatus:          formData.estatus
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

    } catch (err) {
      toast({ message: 'Ocurrió un error inesperado: ' + err.message, type: 'error' });
    } finally {
      // ✅ finally garantiza que el botón siempre se desbloquea
      setSubmitting(false);
    }
  };

  const handleEdit = (chofer) => {
    setFormData({
      nombre:           chofer.nombre           ?? '',
      apellido_paterno: chofer.apellido_paterno ?? '',
      apellido_materno: chofer.apellido_materno ?? '',
      telefono:         chofer.telefono         ?? '',
      licencia:         chofer.licencia         ?? 'B',
      estatus:          chofer.estatus          ?? 'activo'
    });
    setEditId(chofer.id_chofer);
    setFormKey(prev => prev + 1);
  };

  const handleDelete = async (id, nombre) => {
    const ok = await confirm(`¿Eliminar a ${nombre}? Se borrarán todas sus asignaciones. No se puede deshacer.`);
    if (!ok) return;

    const { data: activas } = await supabase
      .from('asignaciones').select('id_asignacion, id_vehiculo')
      .eq('id_chofer', id).eq('activa', true);

    if (activas?.length > 0) {
      for (const asig of activas) {
        await supabase.from('asignaciones').update({ activa: false }).eq('id_asignacion', asig.id_asignacion);
        await supabase.from('vehiculos').update({ estatus: 'disponible' }).eq('id_vehiculo', asig.id_vehiculo);
      }
    }

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
      (c.telefono ?? '').includes(t) ||
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
                ) : choferesFiltrados.length === 0 ? (
                  <tr><td colSpan="6" className="p-6 text-center text-gray-400">Sin resultados.</td></tr>
                ) : choferesFiltrados.map((chofer) => (
                  <tr key={chofer.id_chofer} className="border-b border-gray-100 hover:bg-gray-50 transition text-text-tablas">
                    <td className="p-3 font-mono">{chofer.id_chofer}</td>
                    <td className="p-3 font-medium">
                      {chofer.nombre} {chofer.apellido_paterno} {chofer.apellido_materno ?? ''}
                    </td>
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
          <h2 className="text-lg font-semibold mb-4 text-text-tablas">
            {editId ? 'Editar Chofer' : 'Nuevo Chofer'}
          </h2>
          <form key={formKey} onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-text-tablas">Nombre <span className="text-rojo">*</span></label>
              <Input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Solo letras" />
            </div>
            <div>
              <label className="text-xs text-text-tablas">Apellido Paterno <span className="text-rojo">*</span></label>
              <Input type="text" name="apellido_paterno" value={formData.apellido_paterno} onChange={handleChange} placeholder="Solo letras" />
            </div>
            <div>
              <label className="text-xs text-text-tablas">Apellido Materno</label>
              <Input type="text" name="apellido_materno" value={formData.apellido_materno} onChange={handleChange} placeholder="Solo letras (Opcional)" />
            </div>
            <div>
              <label className="text-xs text-text-tablas">Teléfono <span className="text-rojo">*</span></label>
              <Input type="text" name="telefono" value={formData.telefono} onChange={handleChange} maxLength="10" placeholder="10 dígitos" />
            </div>
            <div>
              <label className="text-xs text-text-tablas">Tipo de Licencia <span className="text-rojo">*</span></label>
              <select name="licencia" value={formData.licencia} onChange={handleChange} className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas">
                <option value="B">Tipo B</option>
                <option value="C">Tipo C</option>
                <option value="D">Tipo D</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-tablas">Estatus <span className="text-rojo">*</span></label>
              <select name="estatus" value={formData.estatus} onChange={handleChange} className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>

            <p className="text-[10px] text-text-muted">
              <span className="text-rojo">*</span> Campos obligatorios
            </p>

            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                disabled={submitting}
                className={`flex-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border transition-all
                  ${submitting ? 'opacity-50 cursor-not-allowed' : ''}
                  ${editId
                    ? 'bg-azul/10 text-azul border-azul/20 hover:bg-azul/20'
                    : 'bg-verde/10 text-verde border-verde/20 hover:bg-verde/20'}`}
              >
                {submitting ? 'Guardando...' : editId ? 'Actualizar' : 'Guardar'}
              </Button>
              {editId && (
                <Button
                  type="button"
                  className="flex-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rojo/10 text-rojo border border-rojo/20 hover:bg-rojo/20 transition-all"
                  onClick={resetForm}
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