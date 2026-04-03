export default function Badge({ status }) {
  const styles = {
    activo: "bg-green-100 text-green-700",
    inactivo: "bg-gray-100 text-gray-600",
    suspendido: "bg-red-100 text-red-600",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}