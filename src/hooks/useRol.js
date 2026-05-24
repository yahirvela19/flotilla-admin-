import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook que devuelve el rol del usuario autenticado.
 * Retorna: { rol: 'admin' | 'operador' | null, loading: boolean }
 */
export function useRol() {
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRol = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) { setRol(null); setLoading(false); return; }

      const { data, error } = await supabase
        .from('user_roles')
        .select('rol')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        // Si no tiene rol registrado, tratarlo como operador por seguridad
        setRol('operador');
      } else {
        setRol(data.rol);
      }
      setLoading(false);
    };

    fetchRol();

    // Escuchar cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchRol();
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  return { rol, loading, esAdmin: rol === 'admin', esOperador: rol === 'operador' };
}