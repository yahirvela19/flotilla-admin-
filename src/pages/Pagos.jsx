import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from "../lib/supabase";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";

export default function Pagos() {
  const { searchTerm } = useOutletContext();

  const [pagos, setPagos] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formKey, setFormKey] = useState(0);

  const [formData, setFormData] = useState({
    id_chofer: "",
    monto: "",
    fecha_pago: new Date().toISOString().split('T')[0],
    estatus: "pendiente",    // ✅ enum: pendiente | pagado
    metodo_pago: "efectivo", // ✅ enum: efectivo | deposito
    notas: ""
  });

  const [editId, setEditId] = useState(null);
  const [nombreChoferEdicion, setNombreChoferEdicion] = useState(""); // ✅ nombre fijo al editar

  const fetchData = async () => {
    setLoading(true);

    const { data: dataPagos } = await supabase
      .from("pagos")
      .select(`*, choferes (nombre, apellido_paterno)`)
      .order("id_pago", { ascending: true });

    const { data: dataChoferes } = await supabase
      .from("choferes")
      .select("id_chofer, nombre, apellido_paterno, estatus")
      .order("nombre", { ascending: true });

    if (dataPagos) setPagos(dataPagos);
    if (dataChoferes) setChoferes(dataChoferes);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setEditId(null);
    setNombreChoferEdicion("");
    setFormData({
      id_chofer: "",
      monto: "",
      fecha_pago: new Date().toISOString().split('T')[0],
      estatus: "pendiente",
      metodo_pago: "efectivo",
      notas: ""
    });
    setFormKey(prev => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Solo validar asignación activa al CREAR
    if (!editId) {
      const { data: tieneAsignacion, error: errorAsig } = await supabase
        .from("asignaciones")
        .select("id_asignacion")
        .eq("id_chofer", formData.id_chofer)
        .eq("activa", true)
        .maybeSingle();

      if (errorAsig) {
        console.error("Error validando asignación:", errorAsig);
        return;
      }

      if (!tieneAsignacion) {
        alert("⚠️ NO SE PUEDE REGISTRAR PAGO: El chofer seleccionado no tiene ninguna unidad asignada actualmente.");
        return;
      }
    }

    const payload = {
      id_chofer: parseInt(formData.id_chofer),
      monto: parseFloat(formData.monto),
      fecha_pago: formData.fecha_pago,
      estatus: formData.estatus,
      metodo_pago: formData.metodo_pago,
      notas: formData.notas || null
    };

    if (editId) {
      const { error } = await supabase
        .from("pagos")
        .update(payload)
        .eq("id_pago", editId);

      if (error) {
        alert("Error al actualizar: " + error.message);
        return;
      }
      alert("Pago actualizado correctamente");
    } else {
      const { error } = await supabase
        .from("pagos")
        .insert([payload]);

      if (error) {
        alert("Error al registrar: " + error.message);
        return;
      }
      alert("Pago registrado con éxito");
    }

    resetForm();
    fetchData();
  };

  const handleEdit = (pago) => {
    setFormData({
      id_chofer: String(pago.id_chofer),
      monto: pago.monto,
      fecha_pago: pago.fecha_pago?.split('T')[0] ?? "",
      estatus: pago.estatus ?? "pendiente",
      metodo_pago: pago.metodo_pago ?? "efectivo",
      notas: pago.notas ?? ""
    });
    setEditId(pago.id_pago);
    // ✅ Guardamos el nombre del chofer para mostrarlo fijo
    setNombreChoferEdicion(
      pago.choferes
        ? `${pago.choferes.nombre} ${pago.choferes.apellido_paterno}`
        : `Chofer #${pago.id_chofer}`
    );
    setFormKey(prev => prev + 1);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar registro de pago?")) {
      const { error } = await supabase.from("pagos").delete().eq("id_pago", id);
      if (error) alert("Error al eliminar: " + error.message);
      else fetchData();
    }
  };

  const pagosFiltrados = pagos.filter(p => {
    if (!searchTerm) return true;
    const nombre = `${p.choferes?.nombre ?? ''} ${p.choferes?.apellido_paterno ?? ''}`.toLowerCase();
    return nombre.includes(searchTerm.toLowerCase()) || p.estatus?.toLowerCase().includes(searchTerm.toLowerCase());
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
                  <th className="p-3">ID</th>
                  <th className="p-3">Chofer</th>
                  <th className="p-3">Monto</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Método</th>
                  <th className="p-3">Estatus</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="p-6 text-center animate-pulse">Cargando...</td></tr>
                ) : pagosFiltrados.map((pago) => (
                  <tr key={pago.id_pago} className="border-b border-gray-100 hover:bg-gray-50 transition text-text-tablas">
                    <td className="p-3 font-mono">{pago.id_pago}</td>
                    <td className="p-3">
                      {pago.choferes
                        ? `${pago.choferes.nombre} ${pago.choferes.apellido_paterno}`
                        : `Chofer #${pago.id_chofer}`}
                    </td>
                    <td className="p-3 font-bold text-verde">${parseFloat(pago.monto).toLocaleString()}</td>
                    <td className="p-3">{pago.fecha_pago}</td>
                    <td className="p-3"><Badge status={pago.metodo_pago} /></td>
                    <td className="p-3"><Badge status={pago.estatus} /></td>
                    <td className="p-3 flex gap-2 justify-center">
                      <Button variant="secondary" onClick={() => handleEdit(pago)}>Editar</Button>
                      <Button variant="danger" onClick={() => handleDelete(pago.id_pago)}>Eliminar</Button>
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
            {editId ? "Editar Pago" : "Nuevo Pago"}
          </h2>

          <form key={formKey} onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* ✅ Al editar: nombre fijo no editable. Al crear: select normal */}
            <div>
              <label className="text-xs text-text-tablas">Chofer</label>
              {editId ? (
                <div className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas bg-gray-50 cursor-not-allowed">
                  {nombreChoferEdicion}
                </div>
              ) : (
                <select
                  name="id_chofer"
                  value={formData.id_chofer}
                  onChange={handleChange}
                  required
                  className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas"
                >
                  <option value="">Seleccionar Chofer</option>
                  {choferes.filter(c => c.estatus === "activo").map(c => (
                    <option key={c.id_chofer} value={String(c.id_chofer)}>
                      {c.nombre} {c.apellido_paterno}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-xs text-text-tablas">Monto</label>
              <Input name="monto" type="number" step="0.01" value={formData.monto} onChange={handleChange} required />
            </div>

            <div>
              <label className="text-xs text-text-tablas">Fecha de Pago</label>
              <Input name="fecha_pago" type="date" value={formData.fecha_pago} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-text-tablas">Método</label>
                <select
                  name="metodo_pago"
                  value={formData.metodo_pago}
                  onChange={handleChange}
                  className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="deposito">Depósito</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-text-tablas">Estatus</label>
                <select
                  name="estatus"
                  value={formData.estatus}
                  onChange={handleChange}
                  className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-text-tablas">Notas</label>
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                rows={2}
                className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas resize-none bg-transparent"
              />
            </div>

            <div className="flex gap-2 pt-2">
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
                  className="flex-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rojo/10 text-rojo border border-rojo/20 hover:bg-rojo/20"
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