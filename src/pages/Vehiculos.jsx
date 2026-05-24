import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from "../lib/supabase";
import { useRolContext } from "../context/RolContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import { useToast } from "../components/ui/Toast";

const ANIO_MIN = 1900;
const ANIO_MAX = new Date().getFullYear() + 1;

// ✅ Solo letras y espacios (acepta acentos y ñ)
const soloLetras = (val) =>
  val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑ\s]/g, '');

// ✅ Auto-formato placa ABC-123-D
const formatearPlaca = (raw) => {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const letras     = clean.slice(0, 3).replace(/[^A-Z]/g, '');
  const numeros    = clean.slice(3, 6).replace(/[^0-9]/g, '');
  const ultimaLetra = clean.slice(6, 7).replace(/[^A-Z]/g, '');

  let resultado = letras;
  if (numeros.length > 0)      resultado += '-' + numeros;
  if (ultimaLetra.length > 0)  resultado += '-' + ultimaLetra;
  return resultado;
};

export default function Vehiculos() {
  const { searchTerm } = useOutletContext();
  const { toast, confirm } = useToast();
  const { esAdmin } = useRolContext();

  const [vehiculos, setVehiculos]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey]       = useState(0);
  const [formData, setFormData]     = useState({
    placa: '', marca: '', modelo: '', anio: '', color: '',
    numero_serie: '', estatus: 'disponible', costo_vehiculo: ''
  });
  const [editId, setEditId] = useState(null);

  const fetchVehiculos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehiculos').select('*').order('id_vehiculo', { ascending: true });
    if (!error) setVehiculos(data);
    setLoading(false);
  };

  useEffect(() => { fetchVehiculos(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'placa') {
      setFormData(prev => ({ ...prev, placa: formatearPlaca(value) }));
      return;
    }
    // ✅ Marca y color: solo letras, sin números ni especiales
    if (name === 'marca' || name === 'color') {
      setFormData(prev => ({ ...prev, [name]: soloLetras(value) }));
      return;
    }
    if (name === 'anio') {
      if (value !== '' && !/^\d+$/.test(value)) return;
      if (value.length > 4) return;
    }
    if (name === 'costo_vehiculo') {
      if (value !== '' && !/^\d*\.?\d{0,2}$/.test(value)) return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      placa: '', marca: '', modelo: '', anio: '', color: '',
      numero_serie: '', estatus: 'disponible', costo_vehiculo: ''
    });
    setFormKey(prev => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const placaNorm   = formData.placa.trim().toUpperCase();
    const marcaClean  = formData.marca.trim();
    const modeloClean = formData.modelo.trim();
    const colorClean  = formData.color.trim();
    const serieClean  = formData.numero_serie.trim();

    // ── Validaciones de campos vacíos ──────────────────────────────────
    if (!placaNorm) {
      toast({ message: 'La placa es obligatoria.', type: 'warning' }); return;
    }
    if (!/^[A-Z]{3}-\d{3}-[A-Z]{1}$/.test(placaNorm)) {
      toast({ message: 'La placa debe tener el formato ABC-123-D.', type: 'warning' }); return;
    }
    if (!marcaClean) {
      toast({ message: 'La marca es obligatoria.', type: 'warning' }); return;
    }
    if (!modeloClean) {
      toast({ message: 'El modelo es obligatorio.', type: 'warning' }); return;
    }

    const anio = parseInt(formData.anio);
    if (!formData.anio || isNaN(anio) || anio < ANIO_MIN || anio > ANIO_MAX) {
      toast({ message: `El año es obligatorio y debe estar entre ${ANIO_MIN} y ${ANIO_MAX}.`, type: 'warning' }); return;
    }
    if (!colorClean) {
      toast({ message: 'El color es obligatorio.', type: 'warning' }); return;
    }
    if (!serieClean) {
      toast({ message: 'El número de serie es obligatorio.', type: 'warning' }); return;
    }

    // ✅ Costo obligatorio solo para admin
    const costoNum = formData.costo_vehiculo !== '' ? parseFloat(formData.costo_vehiculo) : null;
    if (esAdmin) {
      if (formData.costo_vehiculo === '' || costoNum === null || isNaN(costoNum)) {
        toast({ message: 'El costo del vehículo es obligatorio.', type: 'warning' }); return;
      }
      if (costoNum < 0) {
        toast({ message: 'El costo no puede ser negativo.', type: 'warning' }); return;
      }
    }

    // ── Detectar duplicados ────────────────────────────────────────────
    // ✅ Duplicado por placa
    const duplicadoPlaca = vehiculos.find(v =>
      v.placa?.trim().toUpperCase() === placaNorm && v.id_vehiculo !== editId
    );
    if (duplicadoPlaca) {
      toast({
        message: `Ya existe un vehículo con la placa ${placaNorm} (ID: ${duplicadoPlaca.id_vehiculo}).`,
        type: 'warning'
      });
      return;
    }

    // ✅ Duplicado por número de serie
    const duplicadoSerie = vehiculos.find(v =>
      v.numero_serie?.trim().toUpperCase() === serieClean.toUpperCase() &&
      v.id_vehiculo !== editId
    );
    if (duplicadoSerie) {
      toast({
        message: `Ya existe un vehículo con el número de serie ${serieClean} (ID: ${duplicadoSerie.id_vehiculo}).`,
        type: 'warning'
      });
      return;
    }

    // ── Bloquear cambio de estatus si hay asignación activa ───────────
    if (editId) {
      const original = vehiculos.find(v => v.id_vehiculo === editId);
      if (original?.estatus === 'en_servicio' && formData.estatus !== 'en_servicio') {
        const { data: asigs } = await supabase
          .from('asignaciones').select('id_asignacion')
          .eq('id_vehiculo', editId).eq('activa', true);
        if (asigs?.length > 0) {
          toast({ message: 'Debe finalizar la asignación del chofer antes de modificar el estatus.', type: 'warning' });
          return;
        }
      }
    }

    const ok = await confirm(`¿Deseas ${editId ? 'actualizar' : 'registrar'} el vehículo ${placaNorm}?`);
    if (!ok) return;

    setSubmitting(true);
    try {
      const payload = {
        placa:        placaNorm,
        marca:        marcaClean,
        modelo:       modeloClean,
        anio,
        color:        colorClean,
        numero_serie: serieClean,
        estatus:      editId ? formData.estatus : 'disponible',
        // ✅ Solo admin guarda el costo
        ...(esAdmin && costoNum !== null && { costo_vehiculo: costoNum }),
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

  const handleEdit = (v) => {
    setFormData({
      placa:          v.placa ?? '',
      marca:          v.marca ?? '',
      modelo:         v.modelo ?? '',
      anio:           v.anio ? String(v.anio) : '',
      color:          v.color ?? '',
      numero_serie:   v.numero_serie ?? '',
      estatus:        v.estatus ?? 'disponible',
      costo_vehiculo: v.costo_vehiculo ? String(v.costo_vehiculo) : ''
    });
    setEditId(v.id_vehiculo);
    setFormKey(prev => prev + 1);
  };

  const handleDelete = async (id, placa) => {
    const { data: activas } = await supabase
      .from('asignaciones').select('id_asignacion')
      .eq('id_vehiculo', id).eq('activa', true);
    if (activas?.length > 0) {
      toast({ message: 'No se puede eliminar: el vehículo tiene una asignación activa. Finalízala primero.', type: 'warning' });
      return;
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
      v.placa?.toLowerCase().includes(t) ||
      v.marca?.toLowerCase().includes(t) ||
      v.modelo?.toLowerCase().includes(t) ||
      String(v.anio).includes(t) ||
      (v.color ?? '').toLowerCase().includes(t) ||
      (v.numero_serie ?? '').toLowerCase().includes(t) ||
      v.estatus?.toLowerCase().includes(t) ||
      String(v.id_vehiculo).includes(t)
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
                  <th className="p-3">ID</th>
                  <th className="p-3">Placa</th>
                  <th className="p-3">Marca</th>
                  <th className="p-3">Modelo</th>
                  <th className="p-3">Año</th>
                  <th className="p-3">Color</th>
                  <th className="p-3">No. Serie</th>
                  {/* ✅ Columna Costo solo visible para admin */}
                  {esAdmin && <th className="p-3">Costo</th>}
                  <th className="p-3">Estatus</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={esAdmin ? 10 : 9} className="p-6 text-center text-gray-500 animate-pulse">Cargando datos...</td></tr>
                ) : vehiculosFiltrados.length === 0 ? (
                  <tr><td colSpan={esAdmin ? 10 : 9} className="p-6 text-center text-gray-400">Sin resultados.</td></tr>
                ) : vehiculosFiltrados.map((v) => (
                  <tr key={v.id_vehiculo} className="border-b border-gray-100 hover:bg-gray-50 transition text-text-tablas">
                    <td className="p-3 font-mono">{v.id_vehiculo}</td>
                    <td className="p-3 font-medium">{v.placa}</td>
                    <td className="p-3">{v.marca}</td>
                    <td className="p-3">{v.modelo}</td>
                    <td className="p-3">{v.anio}</td>
                    <td className="p-3">{v.color || 'N/A'}</td>
                    <td className="p-3 font-mono text-xs">{v.numero_serie || '—'}</td>
                    {/* ✅ Costo oculto para operador */}
                    {esAdmin && (
                      <td className="p-3 font-medium text-azul">
                        {v.costo_vehiculo
                          ? `$${parseFloat(v.costo_vehiculo).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </td>
                    )}
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
          <h2 className="text-lg font-semibold mb-4 text-text-tablas">
            {editId ? 'Editar Vehículo' : 'Nuevo Vehículo'}
          </h2>
          <form key={formKey} onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div>
              <label className="text-xs text-text-tablas">
                Placa <span className="text-text-muted">(ABC-123-D)</span> <span className="text-rojo">*</span>
              </label>
              <Input type="text" name="placa" value={formData.placa} onChange={handleChange} placeholder="ABC-123-D" maxLength={9} />
            </div>

            <div>
              <label className="text-xs text-text-tablas">Marca <span className="text-rojo">*</span></label>
              <Input type="text" name="marca" value={formData.marca} onChange={handleChange} placeholder="Solo letras" />
            </div>

            <div>
              <label className="text-xs text-text-tablas">Modelo <span className="text-rojo">*</span></label>
              <Input type="text" name="modelo" value={formData.modelo} onChange={handleChange} placeholder="Ej. Tsuru, Vento..." />
            </div>

            <div>
              <label className="text-xs text-text-tablas">Año <span className="text-rojo">*</span></label>
              <Input
                type="text" inputMode="numeric" name="anio"
                value={formData.anio} onChange={handleChange}
                placeholder="Ej. 2022" maxLength={4}
              />
            </div>

            <div>
              <label className="text-xs text-text-tablas">Color <span className="text-rojo">*</span></label>
              <Input type="text" name="color" value={formData.color} onChange={handleChange} placeholder="Solo letras" />
            </div>

            <div>
              <label className="text-xs text-text-tablas">Número de Serie <span className="text-rojo">*</span></label>
              <Input type="text" name="numero_serie" value={formData.numero_serie} onChange={handleChange} placeholder="VIN o No. de serie" />
            </div>

            {/* ✅ Costo: obligatorio para admin, oculto para operador */}
            {esAdmin && (
              <div>
                <label className="text-xs text-text-tablas">
                  Costo del Vehículo <span className="text-rojo">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted font-semibold">$</span>
                  <Input
                    type="text" inputMode="decimal" name="costo_vehiculo"
                    value={formData.costo_vehiculo} onChange={handleChange}
                    placeholder="0.00" className="pl-7"
                  />
                </div>
              </div>
            )}

            {editId && (
              <div>
                <label className="text-xs text-text-tablas">Estatus</label>
                <select name="estatus" value={formData.estatus} onChange={handleChange} className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas">
                  <option value="disponible">Disponible</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="baja">Baja</option>
                  {formData.estatus === 'en_servicio' && (
                    <option value="en_servicio" disabled>En servicio (Asignado)</option>
                  )}
                </select>
              </div>
            )}

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
                  className="flex-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border transition-all bg-rojo/10 text-rojo border-rojo/20 hover:bg-rojo/20"
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