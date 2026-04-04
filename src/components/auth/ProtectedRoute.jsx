import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase"; // Verifica que esta ruta a tu cliente de supabase sea correcta

export default function ProtectedRoute() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Revisamos si hay una sesión activa al cargar la página
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    checkSession();

    // 2. Escuchamos cambios en tiempo real (por si el usuario cierra sesión)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Mientras revisa la base de datos, mostramos un estado de carga
  if (loading) {
    return (
      <div className="h-screen bg-secondary flex items-center justify-center">
        <div className="text-primary font-black uppercase tracking-[0.4em] animate-pulse">
          Verificando Credenciales...
        </div>
      </div>
    );
  }

  // SI NO HAY SESIÓN: Lo mandamos al Login ("/") y borramos el historial para que no pueda dar "atrás"
  if (!session) {
    return <Navigate to="/" replace />;
  }

  // SI HAY SESIÓN: Lo dejamos pasar a las rutas hijas (Layout -> Choferes, etc.)
  return <Outlet />;
}