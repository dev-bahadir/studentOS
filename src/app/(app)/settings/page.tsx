'use client';

import { User, LogOut, Save, Palette, Settings, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Wir holen uns jetzt alles Nötige aus dem neuen Provider
  const { 
    theme, 
    changeTheme, 
    fullName, 
    updateName, 
    customColors, 
    setCustomColors 
  } = useTheme();

  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialisierung des Namens
  useEffect(() => {
    if (fullName) setNameInput(fullName);
  }, [fullName]);

  // Funktion zum Updaten der Farben im lokalen State & Provider
  const handleColorChange = (key: string, value: string) => {
    const updatedColors = { 
      ...(customColors || {}), 
      [key]: value 
    };
    setCustomColors(updatedColors); // Das triggert die Live-Vorschau im Provider
    if (theme !== 'custom') changeTheme('custom'); // Wechselt automatisch in den Custom-Modus
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Namen speichern
      await updateName(nameInput);
      
      // 2. Wenn Custom-Theme, dann Farben in DB persistieren
      if (theme === 'custom' && customColors) {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            custom_colors: customColors, 
            theme: 'custom' 
          })
          .eq('id', user?.id);

        if (error) throw error;
      }
      
      alert("Einstellungen erfolgreich in der Cloud gespeichert! 🚀");
    } catch (error: any) {
      console.error("Fehler:", error.message);
      alert("Fehler beim Speichern.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="p-4 md:p-10 max-w-3xl mx-auto min-h-screen pb-32">
      <header className="mb-10">
        <h1 className="text-4xl font-black flex items-center gap-3 tracking-tight">
          <Settings className="text-cyan-500" size={36} /> Einstellungen
        </h1>
      </header>

      <div className="bg-white dark:bg-zinc-900 p-6 md:p-10 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 space-y-12 shadow-sm">
        
        {/* SEKTION: PROFIL */}
        <section>
          <h2 className="text-xl font-extrabold mb-6 flex items-center gap-3">
            <User className="text-cyan-500" size={22} /> Profil
          </h2>
          <input 
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium"
            placeholder="Dein Name"
          />
        </section>

        {/* SEKTION: DESIGN PAKETE */}
        <section>
          <h2 className="text-xl font-extrabold mb-6 flex items-center gap-3">
            <Palette className="text-cyan-500" size={22} /> Themes
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {['modern', 'dark', 'pastel'].map((t) => (
              <button 
                key={t}
                onClick={() => changeTheme(t as any)}
                className={`p-6 rounded-[2rem] border-2 transition-all font-bold capitalize ${
                  theme === t ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' : 'border-zinc-100 dark:border-zinc-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* SEKTION: CUSTOM COLORS */}
        <section className="pt-8 border-t border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-extrabold mb-6 flex items-center gap-3">
            <span className="text-cyan-500">🧪</span> Custom Colors
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Primary Picker */}
            <div className="space-y-3">
              <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">Hauptfarbe</label>
              <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <input 
                  type="color" 
                  value={customColors?.['color-primary'] || '#06b6d4'} 
                  onChange={(e) => handleColorChange('color-primary', e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none"
                />
                <span className="font-mono text-sm uppercase">{customColors?.['color-primary'] || '#06b6d4'}</span>
              </div>
            </div>

            {/* Canvas Picker */}
            <div className="space-y-3">
              <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">Hintergrund</label>
              <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <input 
                  type="color" 
                  value={customColors?.['bg-canvas'] || '#f9fafb'} 
                  onChange={(e) => handleColorChange('bg-canvas', e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none"
                />
                <span className="font-mono text-sm uppercase">{customColors?.['bg-canvas'] || '#f9fafb'}</span>
              </div>
            </div>
          </div>
        </section>

        <footer className="pt-10 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800">
          <button onClick={handleLogout} className="text-zinc-400 hover:text-red-500 font-bold flex items-center gap-2 transition-colors">
            <LogOut size={18} /> Logout
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-zinc-900 dark:bg-panel text-white dark:text-ink px-10 py-4 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Save size={20} /> {loading ? 'Speichere...' : 'Änderungen speichern'}
          </button>
        </footer>
      </div>
    </div>
  );
}
