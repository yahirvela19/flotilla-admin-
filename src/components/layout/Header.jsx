import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import bannerImage from "../../assets/header.jpg";

export default function Header({ searchTerm, setSearchTerm }) {

  // ✅ Fix #10: leer el nombre real del usuario autenticado
  const [userName, setUserName] = useState("Usuario");

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Intentamos leer el nombre del metadata, si no usamos el email
        const name =
          user.user_metadata?.nombre ||
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Usuario";

        setUserName(name);
      }
    };

    loadUser();
  }, []);

  return (
    <header className="h-28 relative border-b border-accent flex justify-between items-center px-12 shrink-0 overflow-hidden bg-[#1a1a1a]">

      {/* IMAGEN DE FONDO */}
      <div className="absolute inset-0 z-0">
        <img
          src={bannerImage}
          alt="Banner"
          className="w-full h-full object-cover brightness-100 opacity-100"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent z-10"></div>
      </div>

      {/* TEXTO IZQUIERDA */}
      <div className="relative z-20 flex flex-col">
        <span className="text-[20px] font-black text-text-main uppercase tracking-tight drop-shadow-lg">
          ¡Hola!
        </span>

        <h2 className="text-[25px] font-black text-primary uppercase tracking-[0.4em] mt-1 drop-shadow-md">
          Juan
        </h2>
      </div>

      {/* BUSCADOR DERECHA */}
      <div className="relative z-20 group">
        <input
          type="text"
          placeholder="Buscar en el sistema de flotilla..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-[500px] bg-surface/80 backdrop-blur-md border border-accent rounded-full px-8 py-3 text-sm text-text-tablas outline-none transition-all placeholder:text-text-tablas/50 focus:border-primary focus:bg-surface shadow-2xl"
        />

        <div className="absolute right-6 top-3.5 text-text-tablas/50 group-focus-within:text-primary transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      </div>

    </header>
  );
}