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

  const fetchVehiculos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehiculos')
      .select('*')
      .order('id_vehiculo', { ascending: true });

    if (!error) setVehiculos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchVehiculos();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editId) {
      const vehiculoOriginal = vehiculos.find(v => v.id_vehiculo === editId);

      if (vehiculoOriginal.estatus === 'en_servicio' && formData.estatus !== 'en_servicio') {
        const { data: asignaciones } = await supabase
          .from('asignaciones')
          .select('id_asignacion')
          .eq('id_vehiculo', editId)
          .eq('activa', true);

        if (asignaciones && asignaciones.length > 0) {
          alert("DEBE ELIMINAR LA ASIGNACIÓN DEL CHOFER ANTES DE MODIFICAR EL ESTATUS");
          return;
        }
      }
    }

    const payload = {
      placa: formData.placa,
      marca: formData.marca,
      modelo: formData.modelo,
      anio: parseInt(formData.anio),
      color: formData.color,
      numero_serie: formData.numero_serie || null,
      estatus: editId ? formData.estatus : 'disponible', 
    };

    if (editId) {
      const { data, error } = await supabase
        .from('vehiculos')
        .update(payload)
        .eq('id_vehiculo', editId)
        .select();

      if (!error) {
        setVehiculos(vehiculos.map(v => v.id_vehiculo === editId ? data[0] : v));
        setEditId(null);
      }
    } else {
      const { data, error } = await supabase
        .from('vehiculos')
        .insert([payload])
        .select();

      if (!error) setVehiculos([...vehiculos, data[0]]);
    }

    setFormData({ placa: '', marca: '', modelo: '', anio: '', color: '', numero_serie: '', estatus: 'disponible' });
  };

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

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este vehículo de la base de datos?')) {
      const { error } = await supabase
        .from('vehiculos')
        .delete()
        .eq('id_vehiculo', id);

      if (error) {
        alert('No se pudo eliminar el vehículo. Verifica que no tenga asignaciones vinculadas.');
      } else {
        setVehiculos(vehiculos.filter(v => v.id_vehiculo !== id));
      }
    }
  };

  const vehiculosFiltrados = vehiculos.filter(vehiculo => {
    if (!searchTerm) return true;
    const termino = searchTerm.toLowerCase();
    return (
      vehiculo.placa.toLowerCase().includes(termino) ||
      vehiculo.marca.toLowerCase().includes(termino) ||
      vehiculo.modelo.toLowerCase().includes(termino) ||
      String(vehiculo.anio).includes(termino)
    );
  });

  return (
    <div className="flex gap-6 h-full">
      <main className="flex-1">
        <h2 className="text-2xl font-semibold mb-6 text-text-tablas">
          Directorio de Vehículos
        </h2>

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
                  <th className="p-3">Estatus</th>
                  <th className="p-3 text-center">Acciones</th>
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
                      No hay vehículos registrados
                    </td>
                  </tr>
                ) : (
                  vehiculosFiltrados.map((vehiculo) => (
                    <tr key={vehiculo.id_vehiculo} className="border-b border-gray-100 hover:bg-gray-50 transition text-text-tablas">
                      <td className="p-3 font-mono">{vehiculo.id_vehiculo}</td>
                      <td className="p-3 font-medium">{vehiculo.placa}</td>
                      <td className="p-3">{vehiculo.marca}</td>
                      <td className="p-3">{vehiculo.modelo}</td>
                      <td className="p-3">{vehiculo.anio}</td>
                      <td className="p-3">{vehiculo.color || 'N/A'}</td>
                      <td className="p-3">
                        <Badge status={vehiculo.estatus} />
                      </td>
                      <td className="p-3 flex gap-2 justify-center">
                        <Button variant="secondary" onClick={() => handleEdit(vehiculo)}>
                          Editar
                        </Button>
                        <Button variant="danger" onClick={() => handleDelete(vehiculo.id_vehiculo)}>
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

      <aside className="w-[350px]">
        <Card>
          <h2 className="text-lg font-semibold mb-4 text-text-tablas">
            {editId ? "Editar Vehículo" : "Nuevo Vehículo"}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-text-tablas">Placa</label>
              <Input type="text" name="placa" value={formData.placa} onChange={handleChange} required />
            </div>

            <div>
              <label className="text-xs text-text-tablas">Marca</label>
              <Input type="text" name="marca" value={formData.marca} onChange={handleChange} required />
            </div>

            <div>
              <label className="text-xs text-text-tablas">Modelo</label>
              <Input type="text" name="modelo" value={formData.modelo} onChange={handleChange} required />
            </div>

            <div>
              <label className="text-xs text-text-tablas">Año</label>
              <Input type="number" name="anio" value={formData.anio} onChange={handleChange} required />
            </div>

            <div>
              <label className="text-xs text-text-tablas">Color</label>
              <Input type="text" name="color" value={formData.color} onChange={handleChange} />
            </div>

            <div>
              <label className="text-xs text-text-tablas">Número de Serie</label>
              <Input type="text" name="numero_serie" value={formData.numero_serie} onChange={handleChange} />
            </div>

            {editId && (
              <div>
                <label className="text-xs text-text-tablas">Estatus</label>
                <select
                  name="estatus"
                  value={formData.estatus}
                  onChange={handleChange}
                  className="w-full border border-accent rounded-lg px-3 py-2 text-sm text-text-tablas"
                >
                  <option value="disponible">Disponible</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="baja">Baja</option>
                  {formData.estatus === 'en_servicio' && (
                    <option value="en_servicio" disabled>En servicio (Asignado)</option>
                  )}
                </select>
              </div>
            )}

            <div className="flex gap-2 pt-2 text-text-tablas">
              <Button 
                type="submit" 
                className="flex-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border transition-all bg-verde/10 text-verde border-verde/20 hover:bg-verde/20"
              >
                {editId ? "Actualizar" : "Guardar"}
              </Button>

              {editId && (
                <Button
                  type="button"
                  className="flex-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border transition-all bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
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