export default function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full bg-surface rounded-xl px-4 py-3 text-sm text-text-tablas focus:border-primary outline-none transition-all ${className}`}
    />
  );
}