export default function Header({ searchTerm, setSearchTerm }) {
  return (
    <header className="flex justify-between items-center p-4 bg-white border-b border-gray-200">
      
      <h2 className="text-sm text-gray-500">Módulo</h2>

      <input
        type="text"
        placeholder="Buscar..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black"
      />
    </header>
  );
}