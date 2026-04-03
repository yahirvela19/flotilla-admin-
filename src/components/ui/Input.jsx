export default function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black ${className}`}
    />
  );
}