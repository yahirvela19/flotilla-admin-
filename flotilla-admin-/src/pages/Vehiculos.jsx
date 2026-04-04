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
    estatus: 'disponible'
  });
  const [editId, setEditId] = useState(null);

  // 1. LEER (READ)
  const fetchVehiculos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehiculos')
      .select('*')
      .order('id_vehiculo', { ascending: true });

    if (error) {
      console.error('Error obteniendo vehículos:', error);
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

  // 2. CREAR Y ACTUALIZAR (CREATE & UPDATE)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      placa: formData.placa,
      marca: formData.marca,
      modelo: formData.modelo,
      anio: parseInt(formData.anio),
      color: formData.color,
      numero_serie: formData.numero_serie || null,
      estatus: formData.estatus
    };

    if (editId) {
      // UPDATE
      const { data, error } = await supabase
        .from('vehiculos')
        .update(payload)
        .eq('id_vehiculo', editId)
        .select();

      if (error) {
        console.error('Error actualizando vehículo:', error);
        alert('Hubo un error al actualizar en la base de datos.');
      } else {
        setVehiculos(vehiculos.map(v => v.id_vehiculo === editId ? data[0] : v));
        setEditId(null);
      }
    } else {
      // CREATE
      const { data, error } = await supabase
        .from('vehiculos')
        .insert([payload])
        .select();

      if (error) {
        console.error('Error creando vehículo:', error);
        alert('Hubo un error al crear el vehículo en la base de datos.');
      } else {
        setVehiculos([...vehiculos, data[0]]);
      }
    }

    setFormData({ placa: '', marca: '', modelo: '', anio: '', color: '', numero_serie: '', estatus: 'disponible' });
  };

  // MODO EDICIÓN
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

  // 3. ELIMINAR (DELETE)
  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este vehículo de la base de datos?')) {
      const { error } = await supabase
        .from('vehiculos')
        .delete()
        .eq('id_vehiculo', id);

      if (error) {
        console.error('Error eliminando vehículo:', error);
        alert('No se pudo eliminar el vehículo. Verifica que no tenga asignaciones vinculadas.');
      } else {
        setVehiculos(vehiculos.filter(v => v.id_vehiculo !== id));
      }
    }
  };

  // 4. FILTRADO EN TIEMPO REAL
  const vehiculosFiltrados = vehiculos.filter(vehiculo => {
    if (!searchTerm) return true;

    const termino = searchTerm.toLowerCase();
    return (
      vehiculo.placa.toLowerCase().includes(termino) ||
      vehiculo.marca.toLowerCase().includes(termino) ||
      vehiculo.modelo.toLowerCase().includes(termino) ||
      (vehiculo.color && vehiculo.color.toLowerCase().includes(termino)) ||
      vehiculo.estatus.toLowerCase().includes(termino) ||
      String(vehiculo.anio).includes(termino)
    );
  });

  return (
    <div className="flex gap-6 h-full">

      {/* TABLA */}
      <main className="flex-1">
        <h2 className="text-2xl font-semibold mb-6 text-text-tablas">
          Directorio de Vehículos
        </h2>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">

              <thead>
                <tr className="text-text-tablas">
                  <th className="p-3">ID</th>
                  <th className="p-3">Placa</th>
                  <th className="p-3">Marca</th>
                  <th className="p-3">Modelo</th>
                  <th className="p-3">Año</th>
                  <th className="p-3">Color</th>
                  <th className="p-3">Estatus</th>
                  <th className="p-3">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-gray-500 animate-pulse">
                      Cargando datos...
                    </td>
                  </tr>
                ) : vehiculosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-gray-400">
                      {searchTerm
                        ? "No se encontraron resultados"
                        : "No hay vehículos registrados"}
                    </td>
                  </tr>
                ) : (
                  vehiculosFiltrados.map((vehiculo) => (
                    <tr
                      key={vehiculo.id_vehiculo}
                      className="border-b border-gray-100 hover:bg-gray-50 transition text-text-tablas"
                    >
                      <td className="p-3 font-mono">{vehiculo.id_vehiculo}</td>
                      <td className="p-3 font-medium">{vehiculo.placa}</td>
                      <td className="p-3">{vehiculo.marca}</td>
                      <td className="p-3">{vehiculo.modelo}</td>
                      <td className="p-3">{vehiculo.anio}</td>
                      <td className="p-3">{vehiculo.color || 'N/A'}</td>
                      <td className="p-3">
                        <Badge status={vehiculo.estatus} />
                      </td>
                      <td className="p-3 flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => handleEdit(vehiculo)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDelete(vehiculo.id_vehiculo)}
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
          <h2 className="text-text-tablas font-semibold mb-4">
            {editId ? "Editar Vehículo" : "Nuevo Vehículo"}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div>
              <label className="text-xs text-text-tablas">Placa</label>
              <Input
                type="text"
                name="placa"
                value={formData.placa}
                onChange={handleChange}
                maxLength="10"
                required
              />
            </div>

            <div>
              <label className="text-xs text-text-tablas">Marca</label>
              <Input
                type="text"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="text-xs text-text-tablas">Modelo</label>
              <Input
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="text-xs text-text-tablas">Año</label>
              <Input
                type="number"
                name="anio"
                value={formData.anio}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                required
              />
            </div>

            <div>
              <label className="text-xs text-text-tablas">Color</label>
              <Input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="text-xs text-text-tablas">Número de Serie</label>
              <Input
                type="text"
                name="numero_serie"
                value={formData.numero_serie}
                onChange={handleChange}
                maxLength="50"
              />
            </div>

            <div>
              <label className="text-xs text-text-tablas">Estatus</label>
              <select
                name="estatus"
                value={formData.estatus}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-text-tablas"
              >
                <option value="disponible">Disponible</option>
                <option value="en_servicio">En servicio</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="baja">Baja</option> 
              </select>
            </div>

            <div className="flex gap-2 pt-4 text-text-tablas">
  {/* BOTÓN GUARDAR / ACTUALIZAR */}
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

  {/* BOTÓN CANCELAR */}
  {editId && (
    <Button
      type="button"
      className="flex-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rojo/10 text-rojo border border-rojo/20 hover:bg-rojo/20 transition-all"
      onClick={() => {
        setEditId(null);
        setFormData({
          placa: '',
          marca: '',
          modelo: '',
          anio: '',
          color: '',
          numero_serie: '',
          estatus: 'disponible'
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
