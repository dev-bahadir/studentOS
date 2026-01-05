import { createClient } from '@supabase/supabase-js';

// Wir holen die Variablen ohne das "!" am Ende
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Sicherheits-Check: Falls die Variablen fehlen, geben wir eine klare Fehlermeldung
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase Umgebungsvariablen fehlen! Prüfe deine .env Datei.");
}

// Wir erstellen den Client nur, wenn die Werte da sind, sonst nehmen wir leere Strings (verhindert den TS-Fehler)
export const supabase = createClient(
  supabaseUrl || '', 
  supabaseKey || '', 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);