export default function Card({ children }) {
  return (
    <div className="bg-cards  rounded-2xl p-6 shadow-xl shadow-black/10">
      {children}
    </div>
  );
}