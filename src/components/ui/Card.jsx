export default function Card({ children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {children}
    </div>
  );
}