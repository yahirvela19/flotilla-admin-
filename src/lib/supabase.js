import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ✅ Fix #1: error claro si las variables de entorno no están definidas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ Faltan variables de entorno de Supabase.\n' +
    'Asegúrate de tener un archivo .env con:\n' +
    'VITE_SUPABASE_URL=...\n' +
    'VITE_SUPABASE_ANON_KEY=...'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
