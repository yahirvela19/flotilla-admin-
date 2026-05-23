import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from "../lib/supabase";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import { useToast } from "../components/ui/Toast";

// ✅ Formato moneda con decimales
const formatMXN = (val) =>
  `$${parseFloat(val).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Pagos() {
  const { searchTerm } = useOutletContext();
  const { toast, confirm } = useToast();

  const [pagos, setPagos] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [formData, setFormData] = useState({
    id_chofer: "", monto: "", fecha_pago: new Date().toISOString().split('T')[0],
    estatus: "pendiente", metodo_pago: "efectivo", notas: ""
  });
  const [editId, setEditId] = useState(null);
  const [nombreChoferEdicion, setNombreChoferEdicion] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const { data: dataPagos } = await supabase.from("pagos").select(`*, choferes (nombre, apellido_paterno)`).order("id_pago", { ascending: true });
    const { data: dataChoferes } = await supabase.from("choferes").select("id_chofer, nombre, apellido_paterno, estatus").order("nombre", { ascending: true });
    if (dataPagos) setPagos(dataPagos);
    if (dataChoferes) setChoferes(dataChoferes);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'monto') {
      if (value !== '' && !/^\d*\.?\d{0,2}$/.test(value)) return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditId(null);
    setNombreChoferEdicion("");
    setFormData({ id_chofer: "", monto: "", fecha_pago: new Date().toISOString().split('T')[0], estatus: "pendiente", metodo_pago: "efectivo", notas: "" });
    setFormKey(prev => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const montoNum = parseFloat(formData.monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      toast({ message: 'El monto debe ser un número mayor a cero.', type: 'warning' }); return;
    }
    if (montoNum > 9999999) {
      toast({ message: 'El monto ingresado parece incorrecto. Verifica el valor.', type: 'warning' }); return;
    }

    if (!editId) {
      const { data: tieneAsignacion, error: errorAsig } = await supabase
        .from("asignaciones").select("id_asignacion")
        .eq("id_chofer", formData.id_chofer).eq("activa", true).maybeSingle();
      if (errorAsig) { toast({ message: 'Error al validar asignación.', type: 'error' }); return; }
      if (!tieneAsignacion) { toast({ message: 'El chofer seleccionado no tiene ninguna unidad asignada actualmente.', type: 'warning' }); return; }
    }

    const choferEncontrado = choferes.find(c => String(c.id_chofer) === String(formData.id_chofer));
    const choferNombre = editId
      ? nombreChoferEdicion
      : choferEncontrado ? `${choferEncontrado.nombre} ${choferEncontrado.apellido_paterno}` : 'el chofer';

    const accion = editId ? 'actualizar' : 'registrar';
    const ok = await confirm(`¿Deseas ${accion} el pago de ${formatMXN(montoNum)} para ${choferNombre}?`);
    if (!ok) return;

    setSubmitting(true);
    try {
      const payload = {
        id_chofer: parseInt(formData.id_chofer),
        monto: montoNum,
        fecha_pago: formData.fecha_pago,
        estatus: formData.estatus,
        metodo_pago: formData.metodo_pago,
        notas: formData.notas.trim() || null
      };

      if (editId) {
        const { error } = await supabase.from("pagos").update(payload).eq("id_pago", editId);
        if (error) { toast({ message: 'Error al actualizar: ' + error.message, type: 'error' }); return; }
        toast({ message: 'Pago actualizado correctamente.', type: 'success' });
      } else {
        const { error } = await supabase.from("pagos").insert([payload]);
        if (error) { toast({ message: 'Error al registrar: ' + error.message, type: 'error' }); return; }
        toast({ message: 'Pago registrado con éxito.', type: 'success' });
      }

      resetForm();
      fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (pago) => {
    setFormData({
      id_chofer: String(pago.id_chofer), monto: String(pago.monto),
      fecha_pago: pago.fecha_pago?.split('T')[0] ?? "",
      estatus: pago.estatus ?? "pendiente", metodo_pago: pago.metodo_pago ?? "efectivo", notas: pago.notas ?? ""
    });
    setEditId(pago.id_pago);
    setNombreChoferEdicion(pago.choferes ? `${pago.choferes.nombre} ${pago.choferes.apellido_paterno}` : `Chofer #${pago.id_chofer}`);
    setFormKey(prev => prev + 1);
  };

  const handleDelete = async (id, monto, choferNombre) => {
    const ok = await confirm(`¿Eliminar el pago de ${formatMXN(monto)} de ${choferNombre}?`);
    if (!ok) return;
    const { error } = await supabase.from("pagos").delete().eq("id_pago", id);
    if (error) toast({ message: 'Error al eliminar: ' + error.message, type: 'error' });
    else { toast({ message: 'Pago eliminado correctamente.', type: 'success' }); fetchData(); }
  };

  const pagosFiltrados = pagos.filter(p => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    const nombre = `${p.choferes?.nombre ?? ''} ${p.choferes?.apellido_paterno ?? ''}`.toLowerCase();
    return (
      nombre.includes(t) || p.estatus?.toLowerCase().includes(t) ||
      p.metodo_pago?.toLowerCase().includes(t) || String(p.monto).includes(t) ||
      (p.fecha_pago ?? '').includes(t) || String(p.id_pago).includes(t)
    );
  });

  return (
    <div className="flex gap-6 h-full">
      <main className="flex-1">
        <h2 className="text-2xl font-semibold mb-6 text-text-tablas">Gestión de Pagos</h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 text-text-tablas">
                  <th className="p-3">ID</th><th className="p-3">Chofer</th><th className="p-3">Monto</th>
                  <th className="p-3">Fecha</th><th className="p-3">Método</th>
                  <th className="p-3">Estatus</th><th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="p-6 text-center animate-pulse">Cargando...</td></tr>
                ) : pagosFiltrados.length === 0 ? (
                  <tr><td colSpan="7" className="p-6 text-center text-gray-400">Sin resultados.</td></tr>
                ) : pagosFiltrados.map((pago) => (
                  <tr key={pago.id_pago} className="border-b border-gray-100 hover:bg-gray-50 transition text-text-tablas">
                    <td className="p-3 font-mono">{pago.id_pago}</td>
                    <td className="p-3">{pago.choferes ? `${pago.choferes.nombre} ${pago.choferes.apellido_paterno}` : `Chofer #${pago.id_chofer}`}</td>
                    {/* ✅ Monto con decimales y signo $ */}
                    <td className="p-3 font-bold text-verde">{formatMXN(pago.monto)}</td>
                    <td className="p-3">{pago.fecha_pago}</td>
                    <td className="p-3"><Badge status={pago.metodo_pago} /></td>
                    <td className="p-3"><Badge status={pago.estatus} /></td>
                    <td className="p-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <Button variant="secondary" onClick={() => handleEdit(pago)}>Editar</Button>
                        <Button variant="danger" onClick={() => handleDelete(pago.id_pago, pago.monto, pago.choferes ? `${pago.choferes.nombre} ${pago.choferes.apellido_paterno}` : `Chofer #${pago.id_chofer}`)}>Eliminar</Button>
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
          <h2 className="text-lg font-semibold mb-4 text-text-tablas">{editId ? "Editar Pago" : "Nuevo Pago"}</h2>
          <form key={formKey} onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-text-tablas">Chofer</label>
              {editId ? (
                <div className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas bg-gray-50 cursor-not-allowed">{nombreChoferEdicion}</div>
              ) : (
                <select name="id_chofer" value={formData.id_chofer} onChange={handleChange} required className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas">
                  <option value="">Seleccionar Chofer</option>
                  {choferes.filter(c => c.estatus === "activo").map(c => (
                    <option key={c.id_chofer} value={String(c.id_chofer)}>{c.nombre} {c.apellido_paterno}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="text-xs text-text-tablas">Monto</label>
              {/* ✅ Signo $ visible en el input */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted font-bold">$</span>
                <Input name="monto" type="text" inputMode="decimal" value={formData.monto} onChange={handleChange} placeholder="0.00" required className="pl-7" />
              </div>
            </div>
            <div><label className="text-xs text-text-tablas">Fecha de Pago</label><Input name="fecha_pago" type="date" value={formData.fecha_pago} onChange={handleChange} required /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-text-tablas">Método</label>
                <select name="metodo_pago" value={formData.metodo_pago} onChange={handleChange} className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas">
                  <option value="efectivo">Efectivo</option>
                  <option value="deposito">Depósito</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-text-tablas">Estatus</label>
                <select name="estatus" value={formData.estatus} onChange={handleChange} className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas">
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-text-tablas">Notas</label>
              <textarea name="notas" value={formData.notas} onChange={handleChange} rows={2} className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas resize-none bg-transparent" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={submitting} className={`flex-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border transition-all ${submitting ? 'opacity-50 cursor-not-allowed' : ''} ${editId ? "bg-azul/10 text-azul border-azul/20 hover:bg-azul/20" : "bg-verde/10 text-verde border-verde/20 hover:bg-verde/20"}`}>
                {submitting ? 'Guardando...' : editId ? "Actualizar" : "Guardar"}
              </Button>
              {editId && <Button type="button" className="flex-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rojo/10 text-rojo border border-rojo/20 hover:bg-rojo/20" onClick={resetForm}>Cancelar</Button>}
            </div>
          </form>
        </Card>
      </aside>
    </div>
  );
}
