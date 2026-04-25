export default function Badge({ status }) {
  // 1. Limpiamos el texto que recibimos (Minúsculas y cambiamos espacios por guiones bajos)
  const s = status?.toLowerCase().replace(/\s+/g, '_'); 

  const styles = {
    activo: "bg-verde/10 text-verde border border-verde/20",
    disponible: "bg-verde/10 text-verde border border-verde/20",
    inactivo: "bg-amarillo/10 text-amarillo border border-amarillo/20",
    suspendido: "bg-rojo/10 text-rojo border border-rojo/20",
    "en_servicio": "bg-azul/10 text-azul border border-azul/20", 
    mantenimiento: "bg-amarillo/10 text-amarillo border border-amarillo/20",
    baja: "bg-rojo/10 text-rojo border border-rojo/20",
    pendiente:    "bg-amarillo/10 text-amarillo border border-amarillo/20",
    pagado:       "bg-verde/10 text-verde border border-verde/20",

    // Método de pago
    efectivo:     "bg-azul/10 text-azul border border-azul/20",
    deposito:     "bg-morado/10 text-morado border border-morado/20",
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${styles[s] || "bg-gray-500/10 text-gray-400"}`}>
      {status}
    </span>
  );
}