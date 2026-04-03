import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from "../lib/supabase"; 
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";

export default function Choferes() {
  // Extraemos el término de búsqueda de la barra superior (Layout)
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

  // 1. LEER (READ): Obtener datos de Supabase
  const fetchChoferes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('choferes')
      .select('*')
      .order('id_chofer', { ascending: true });

    if (error) {
      console.error('Error obteniendo choferes:', error);
    } else {
      setChoferes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChoferes();
  }, []);

  // Manejador de cambios en los inputs del formulario
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. CREAR Y ACTUALIZAR (CREATE & UPDATE)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editId) {
      // UPDATE
      const { data, error } = await supabase
        .from('choferes')
        .update({
          nombre: formData.nombre,
          apellido_paterno: formData.apellido_paterno,
          apellido_materno: formData.apellido_materno,
          telefono: formData.telefono,
          licencia: formData.licencia,
          estatus: formData.estatus
        })
        .eq('id_chofer', editId)
        .select();

      if (error) {
        console.error('Error actualizando chofer:', error);
        alert('Hubo un error al actualizar en la base de datos.');
      } else {
        setChoferes(choferes.map(c => c.id_chofer === editId ? data[0] : c));
        setEditId(null);
      }
    } else {
      // CREATE
      const { data, error } = await supabase
        .from('choferes')
        .insert([{
          nombre: formData.nombre,
          apellido_paterno: formData.apellido_paterno,
          apellido_materno: formData.apellido_materno,
          telefono: formData.telefono,
          licencia: formData.licencia,
          estatus: formData.estatus
        }])
        .select();

      if (error) {
        console.error('Error creando chofer:', error);
        alert('Hubo un error al crear el chofer en la base de datos.');
      } else {
        setChoferes([...choferes, data[0]]);
      }
    }
    
    // Limpiar formulario después de guardar
    setFormData({ nombre: '', apellido_paterno: '', apellido_materno: '', telefono: '', licencia: 'B', estatus: 'activo' });
  };

  // Preparar formulario para MODO EDICIÓN
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

  // 3. ELIMINAR (DELETE)
  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este chofer de la base de datos?')) {
      const { error } = await supabase
        .from('choferes')
        .delete()
        .eq('id_chofer', id);

      if (error) {
        console.error('Error eliminando chofer:', error);
        alert('No se pudo eliminar el chofer. Verifica que no tenga asignaciones o pagos vinculados.');
      } else {
        setChoferes(choferes.filter(c => c.id_chofer !== id));
      }
    }
  };

  // 4. LÓGICA DE BÚSQUEDA / FILTRADO EN TIEMPO REAL
  const choferesFiltrados = choferes.filter(chofer => {
    if (!searchTerm) return true; // Si la barra está vacía, mostrar todos
    
    const nombreCompleto = `${chofer.nombre} ${chofer.apellido_paterno} ${chofer.apellido_materno}`.toLowerCase();
    const terminoBusqueda = searchTerm.toLowerCase();

    // Filtra por nombre completo, teléfono, licencia o estatus
    return nombreCompleto.includes(terminoBusqueda) || 
           (chofer.telefono && chofer.telefono.includes(terminoBusqueda)) ||
           chofer.licencia.toLowerCase().includes(terminoBusqueda) ||
           chofer.estatus.toLowerCase().includes(terminoBusqueda);
  });

return (
  <div className="flex gap-6 h-full">

    {/* TABLA */}
    <main className="flex-1">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Directorio de Choferes
      </h2>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th className="p-3">ID</th>
                <th className="p-3">Nombre Completo</th>
                <th className="p-3">Teléfono</th>
                <th className="p-3">Licencia</th>
                <th className="p-3">Estatus</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-500 animate-pulse">
                    Cargando datos...
                  </td>
                </tr>
              ) : choferesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-400">
                    {searchTerm
                      ? "No se encontraron resultados"
                      : "No hay choferes registrados"}
                  </td>
                </tr>
              ) : (
                choferesFiltrados.map((chofer) => (
                  <tr
                    key={chofer.id_chofer}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="p-3 font-mono">{chofer.id_chofer}</td>

                    <td className="p-3">
                      {chofer.nombre} {chofer.apellido_paterno} {chofer.apellido_materno}
                    </td>

                    <td className="p-3">
                      {chofer.telefono || "N/A"}
                    </td>

                    <td className="p-3 font-medium text-center">
                      {chofer.licencia}
                    </td>

                    <td className="p-3">
                      <Badge status={chofer.estatus} />
                    </td>

                    <td className="p-3 flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => handleEdit(chofer)}
                      >
                        Editar
                      </Button>

                      <Button
                        variant="danger"
                        onClick={() => handleDelete(chofer.id_chofer)}
                       >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </Card>
    </main>

    {/* FORMULARIO */}
    <aside className="w-[350px]">
      <Card>
        <h2 className="text-lg font-semibold mb-4">
          {editId ? "Editar Chofer" : "Nuevo Chofer"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div>
            <label className="text-xs text-gray-500">Nombre</label>
            <Input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Apellido Paterno</label>
            <Input
              type="text"
              name="apellido_paterno"
              value={formData.apellido_paterno}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Apellido Materno</label>
            <Input
              type="text"
              name="apellido_materno"
              value={formData.apellido_materno}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Teléfono</label>
            <Input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              maxLength="15"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Tipo de Licencia</label>
            <select
              name="licencia"
              value={formData.licencia}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="B">Tipo B</option>
              <option value="C">Tipo C</option>
              <option value="D">Tipo D</option>
              <option value="E">Tipo E</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">Estatus</label>
            <select
              name="estatus"
              value={formData.estatus}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="suspendido">Suspendido</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              {editId ? "Actualizar" : "Guardar"}
            </Button>

            {editId && (
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setEditId(null);
                  setFormData({
                    nombre: "",
                    apellido_paterno: "",
                    apellido_materno: "",
                    telefono: "",
                    licencia: "B",
                    estatus: "activo",
                  });
                }}
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
