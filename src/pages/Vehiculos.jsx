import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from "../lib/supabase";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import { useToast } from "../components/ui/Toast";

const ANIO_MIN = 1900;
const ANIO_MAX = new Date().getFullYear() + 1;

export default function Vehiculos() {
  const { searchTerm } = useOutletContext();
  const { toast, confirm } = useToast();

  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // ✅ bloquea doble clic
  const [formKey, setFormKey] = useState(0);
  const [formData, setFormData] = useState({
    placa: '', marca: '', modelo: '', anio: '', color: '', numero_serie: '', estatus: 'disponible'
  });
  const [editId, setEditId] = useState(null);

  const fetchVehiculos = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('vehiculos').select('*').order('id_vehiculo', { ascending: true });
    if (!error) setVehiculos(data);
    setLoading(false);
  };

  useEffect(() => { fetchVehiculos(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'anio') {
      if (value !== '' && !/^\d+$/.test(value)) return; // solo dígitos
      if (value.length > 4) return;                      // máximo 4 caracteres
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({ placa: '', marca: '', modelo: '', anio: '', color: '', numero_serie: '', estatus: 'disponible' });
    setFormKey(prev => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // ✅ Validar campos de texto no sean solo espacios
    const placaNorm = formData.placa.trim().toUpperCase();
    const marcaClean = formData.marca.trim();
    const modeloClean = formData.modelo.trim();

    if (!placaNorm) { toast({ message: 'La placa no puede estar vacía.', type: 'warning' }); return; }
    if (!marcaClean) { toast({ message: 'La marca no puede estar vacía.', type: 'warning' }); return; }
    if (!modeloClean) { toast({ message: 'El modelo no puede estar vacío.', type: 'warning' }); return; }

    // ✅ Validar año en rango lógico
    const anio = parseInt(formData.anio);
    if (isNaN(anio) || anio < ANIO_MIN || anio > ANIO_MAX) {
      toast({ message: `El año debe estar entre ${ANIO_MIN} y ${ANIO_MAX}.`, type: 'warning' }); return;
    }

    // ✅ Detectar placa duplicada
    const duplicado = vehiculos.find(v =>
      v.placa?.trim().toUpperCase() === placaNorm && v.id_vehiculo !== editId
    );
    if (duplicado) {
      toast({ message: `Ya existe un vehículo con la placa ${placaNorm} (ID: ${duplicado.id_vehiculo}).`, type: 'warning' }); return;
    }

    // ✅ Bloquear cambio de estatus si hay asignación activa
    if (editId) {
      const vehiculoOriginal = vehiculos.find(v => v.id_vehiculo === editId);
      if (vehiculoOriginal?.estatus === 'en_servicio' && formData.estatus !== 'en_servicio') {
        const { data: asignaciones } = await supabase.from('asignaciones').select('id_asignacion').eq('id_vehiculo', editId).eq('activa', true);
        if (asignaciones?.length > 0) {
          toast({ message: 'Debe finalizar la asignación del chofer antes de modificar el estatus.', type: 'warning' }); return;
        }
      }
    }

    const ok = await confirm(`¿Deseas ${editId ? 'actualizar' : 'registrar'} el vehículo ${placaNorm}?`);
    if (!ok) return;

    setSubmitting(true);
    try {
      const payload = {
        placa: placaNorm, marca: marcaClean, modelo: modeloClean, anio,
        color: formData.color.trim(),
        numero_serie: formData.numero_serie.trim() || null,
        estatus: editId ? formData.estatus : 'disponible',
      };

      if (editId) {
        const { error } = await supabase.from('vehiculos').update(payload).eq('id_vehiculo', editId);
        if (error) { toast({ message: 'Error al actualizar: ' + error.message, type: 'error' }); return; }
        toast({ message: 'Vehículo actualizado correctamente.', type: 'success' });
      } else {
        const { error } = await supabase.from('vehiculos').insert([payload]);
        if (error) { toast({ message: 'Error al registrar: ' + error.message, type: 'error' }); return; }
        toast({ message: 'Vehículo registrado con éxito.', type: 'success' });
      }

      resetForm();
      fetchVehiculos();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (vehiculo) => {
    setFormData({
      placa: vehiculo.placa ?? '', marca: vehiculo.marca ?? '', modelo: vehiculo.modelo ?? '',
      anio: vehiculo.anio ? String(vehiculo.anio) : '',
      color: vehiculo.color ?? '', numero_serie: vehiculo.numero_serie ?? '',
      estatus: vehiculo.estatus ?? 'disponible'
    });
    setEditId(vehiculo.id_vehiculo);
    setFormKey(prev => prev + 1);
  };

  const handleDelete = async (id, placa) => {
    const { data: asignacionesActivas } = await supabase.from('asignaciones').select('id_asignacion').eq('id_vehiculo', id).eq('activa', true);
    if (asignacionesActivas?.length > 0) {
      toast({ message: 'No se puede eliminar: el vehículo tiene una asignación activa. Finalízala primero.', type: 'warning' }); return;
    }
    const ok = await confirm(`¿Eliminar el vehículo ${placa}? Esta acción no se puede deshacer.`);
    if (!ok) return;

    const { error } = await supabase.from('vehiculos').delete().eq('id_vehiculo', id);
    if (error) toast({ message: 'No se pudo eliminar: ' + error.message, type: 'error' });
    else { toast({ message: `Vehículo ${placa} eliminado correctamente.`, type: 'success' }); fetchVehiculos(); }
  };

  const vehiculosFiltrados = vehiculos.filter(v => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return (
      v.placa?.toLowerCase().includes(t) || v.marca?.toLowerCase().includes(t) ||
      v.modelo?.toLowerCase().includes(t) || String(v.anio).includes(t) ||
      (v.color ?? '').toLowerCase().includes(t) || (v.numero_serie ?? '').toLowerCase().includes(t) ||
      v.estatus?.toLowerCase().includes(t) || String(v.id_vehiculo).includes(t)
    );
  });

  return (
    <div className="flex gap-6 h-full">
      <main className="flex-1">
        <h2 className="text-2xl font-semibold mb-6 text-text-tablas">Directorio de Vehículos</h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 text-text-tablas">
                  <th className="p-3">ID</th><th className="p-3">Placa</th><th className="p-3">Marca</th>
                  <th className="p-3">Modelo</th><th className="p-3">Año</th><th className="p-3">Color</th>
                  <th className="p-3">Estatus</th><th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="p-6 text-center text-gray-500 animate-pulse">Cargando datos...</td></tr>
                ) : vehiculosFiltrados.length === 0 ? (
                  <tr><td colSpan="8" className="p-6 text-center text-gray-400">Sin resultados.</td></tr>
                ) : vehiculosFiltrados.map((v) => (
                  <tr key={v.id_vehiculo} className="border-b border-gray-100 hover:bg-gray-50 transition text-text-tablas">
                    <td className="p-3 font-mono">{v.id_vehiculo}</td>
                    <td className="p-3 font-medium">{v.placa}</td>
                    <td className="p-3">{v.marca}</td>
                    <td className="p-3">{v.modelo}</td>
                    <td className="p-3">{v.anio}</td>
                    <td className="p-3">{v.color || 'N/A'}</td>
                    <td className="p-3"><Badge status={v.estatus} /></td>
                    <td className="p-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <Button variant="secondary" onClick={() => handleEdit(v)}>Editar</Button>
                        <Button variant="danger" onClick={() => handleDelete(v.id_vehiculo, v.placa)}>Eliminar</Button>
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
          <h2 className="text-lg font-semibold mb-4 text-text-tablas">{editId ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h2>
          <form key={formKey} onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div><label className="text-xs text-text-tablas">Placa</label><Input type="text" name="placa" value={formData.placa} onChange={handleChange} required /></div>
            <div><label className="text-xs text-text-tablas">Marca</label><Input type="text" name="marca" value={formData.marca} onChange={handleChange} required /></div>
            <div><label className="text-xs text-text-tablas">Modelo</label><Input type="text" name="modelo" value={formData.modelo} onChange={handleChange} required /></div>
            <div>
              <label className="text-xs text-text-tablas">Año</label>
              <Input type="text" inputMode="numeric" name="anio" value={formData.anio} onChange={handleChange} placeholder="Ej. 2022" maxLength={4} required />
            </div>
            <div><label className="text-xs text-text-tablas">Color</label><Input type="text" name="color" value={formData.color} onChange={handleChange} /></div>
            <div><label className="text-xs text-text-tablas">Número de Serie</label><Input type="text" name="numero_serie" value={formData.numero_serie} onChange={handleChange} /></div>
            {editId && (
              <div>
                <label className="text-xs text-text-tablas">Estatus</label>
                <select name="estatus" value={formData.estatus} onChange={handleChange} className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas">
                  <option value="disponible">Disponible</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="baja">Baja</option>
                  {formData.estatus === 'en_servicio' && <option value="en_servicio" disabled>En servicio (Asignado)</option>}
                </select>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={submitting} className={`flex-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border transition-all ${submitting ? 'opacity-50 cursor-not-allowed' : ''} ${editId ? 'bg-azul/10 text-azul border-azul/20 hover:bg-azul/20' : 'bg-verde/10 text-verde border-verde/20 hover:bg-verde/20'}`}>
                {submitting ? 'Guardando...' : editId ? 'Actualizar' : 'Guardar'}
              </Button>
              {editId && <Button type="button" className="flex-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border transition-all bg-rojo/10 text-rojo border-rojo/20 hover:bg-rojo/20" onClick={resetForm}>Cancelar</Button>}
            </div>
          </form>
        </Card>
      </aside>
    </div>
  );
}