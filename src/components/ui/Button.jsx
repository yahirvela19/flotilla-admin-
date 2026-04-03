export default function Button({ children, variant = "primary", ...props }) {
  const styles = {
    primary: "bg-black text-white hover:bg-gray-800",
    secondary: "bg-gray-100 hover:bg-gray-200",
    danger: "text-red-600 hover:underline",
  };

  return (
    <button
      className={`px-3 py-1 text-sm rounded-lg font-medium ${styles[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}