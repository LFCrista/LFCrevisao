// lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Substitua com as informações do seu projeto no Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

// Verificando se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseKey) {
  throw new Error("As variáveis de ambiente SUPABASE_URL e SUPABASE_KEY precisam estar definidas.");
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
