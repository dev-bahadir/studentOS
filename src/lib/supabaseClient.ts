import { createClient } from '@supabase/supabase-js'

// Diese Zeilen ziehen sich die Daten automatisch aus der .env.local Datei
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Falls die Variablen fehlen, geben wir eine Warnung aus
if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL oder Key fehlen in der .env.local Datei!")
}

// Hier exportieren wir den fertigen Client
export const supabase = createClient(supabaseUrl, supabaseKey)

export { createClient }
