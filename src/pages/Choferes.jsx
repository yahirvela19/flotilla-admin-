import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from "../lib/supabase"; 

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
    <>
      {/* SECCIÓN CENTRAL: LISTA DE CHOFERES */}
      <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
        <h2 className="text-xl font-bold mb-6 uppercase">Directorio de Choferes</h2>
        
        <div className="overflow-x-auto bg-white border border-black">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-200 border-b border-black">
                <th className="p-3 border-r border-black">ID</th>
                <th className="p-3 border-r border-black">Nombre Completo</th>
                <th className="p-3 border-r border-black">Teléfono</th>
                <th className="p-3 border-r border-black">Licencia</th>
                <th className="p-3 border-r border-black">Estatus</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-black uppercase font-bold animate-pulse">
                    Cargando datos...
                  </td>
                </tr>
              ) : choferesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-500 uppercase">
                    {searchTerm ? 'No se encontraron resultados' : 'No hay choferes registrados'}
                  </td>
                </tr>
              ) : (
                choferesFiltrados.map((chofer) => (
                  <tr key={chofer.id_chofer} className="border-b border-black hover:bg-gray-100">
                    <td className="p-3 border-r border-black font-mono">{chofer.id_chofer}</td>
                    <td className="p-3 border-r border-black">
                      {`${chofer.nombre} ${chofer.apellido_paterno} ${chofer.apellido_materno}`}
                    </td>
                    <td className="p-3 border-r border-black">{chofer.telefono || 'N/A'}</td>
                    <td className="p-3 border-r border-black font-bold text-center">{chofer.licencia}</td>
                    <td className="p-3 border-r border-black capitalize text-sm">{chofer.estatus}</td>
                    <td className="p-3 space-x-2">
                      <button 
                        onClick={() => handleEdit(chofer)}
                        className="px-3 py-1 bg-white border border-black hover:bg-black hover:text-white transition-colors text-xs uppercase font-bold"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(chofer.id_chofer)}
                        className="px-3 py-1 bg-gray-200 border border-black hover:bg-gray-400 transition-colors text-xs uppercase font-bold"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* SECCIÓN DERECHA: FORMULARIO CRUD */}
      <aside className="w-80 border-l border-black p-6 bg-white overflow-y-auto shrink-0">
        <h2 className="text-xl font-bold mb-6 border-b border-black pb-2 uppercase">
          {editId ? 'Editar Chofer' : 'Nuevo Chofer'}
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1 uppercase">Nombre</label>
            <input 
              type="text" 
              name="nombre" 
              value={formData.nombre} 
              onChange={handleChange} 
              required 
              className="w-full border border-black p-2 focus:outline-none focus:ring-1 focus:ring-black text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 uppercase">Apellido Paterno</label>
            <input 
              type="text" 
              name="apellido_paterno" 
              value={formData.apellido_paterno} 
              onChange={handleChange} 
              required 
              className="w-full border border-black p-2 focus:outline-none focus:ring-1 focus:ring-black text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 uppercase">Apellido Materno</label>
            <input 
              type="text" 
              name="apellido_materno" 
              value={formData.apellido_materno} 
              onChange={handleChange} 
              required 
              className="w-full border border-black p-2 focus:outline-none focus:ring-1 focus:ring-black text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 uppercase">Teléfono</label>
            <input 
              type="tel" 
              name="telefono" 
              value={formData.telefono} 
              onChange={handleChange} 
              maxLength="15"
              className="w-full border border-black p-2 focus:outline-none focus:ring-1 focus:ring-black text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 uppercase">Tipo de Licencia</label>
            <select 
              name="licencia" 
              value={formData.licencia} 
              onChange={handleChange} 
              className="w-full border border-black p-2 bg-white focus:outline-none focus:ring-1 focus:ring-black text-sm"
            >
              <option value="B">Tipo B</option>
              <option value="C">Tipo C</option>
              <option value="D">Tipo D</option>
              <option value="E">Tipo E</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 uppercase">Estatus</label>
            <select 
              name="estatus" 
              value={formData.estatus} 
              onChange={handleChange} 
              className="w-full border border-black p-2 bg-white focus:outline-none focus:ring-1 focus:ring-black text-sm"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="suspendido">Suspendido</option>
            </select>
          </div>

          <div className="pt-4 flex gap-2">
            <button 
              type="submit" 
              className="flex-1 bg-black text-white font-bold py-2 px-2 text-sm uppercase hover:bg-gray-800 transition-colors border border-black"
            >
              {editId ? 'Actualizar' : 'Guardar'}
            </button>
            {editId && (
              <button 
                type="button" 
                onClick={() => { 
                  setEditId(null); 
                  setFormData({ nombre: '', apellido_paterno: '', apellido_materno: '', telefono: '', licencia: 'B', estatus: 'activo' }); 
                }}
                className="flex-1 bg-white text-black font-bold py-2 px-2 text-sm uppercase hover:bg-gray-200 transition-colors border border-black"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </aside>
    </>
  );
}