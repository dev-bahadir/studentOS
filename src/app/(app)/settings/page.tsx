'use client';

import { User, LogOut, Save, Shield, Palette, Settings, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Absolute Pfade mit @ für Stabilität
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, changeTheme, fullName, updateName } = useTheme();

  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [customPrimary, setCustomPrimary] = useState('#06b6d4'); // Cyan als Standard
  const [customCanvas, setCustomCanvas] = useState('#f9fafb');

  useEffect(() => {
    if (fullName) setNameInput(fullName);
  }, [fullName]);

  const handleSave = async () => {
    setLoading(true);
    await updateName(nameInput);
    
    if (theme === 'custom') {
      const colors = {
        'color-primary': customPrimary,
        'bg-canvas': customCanvas,
      };
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          custom_colors: colors, 
          theme: 'custom' 
        })
        .eq('id', user?.id);

      if (error) {
        console.error("Details:", error.message);
      } else {
        window.location.reload(); 
      }
    } else {
      setLoading(false);
      alert("Profil erfolgreich gespeichert! ✅");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login'); 
    router.refresh();
  };

  return (
    <div className="p-4 md:p-10 max-w-3xl mx-auto min-h-screen pb-32 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* HEADER */}
      <header className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
          <Settings className="text-cyan-500" size={36} /> Einstellungen
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">
          Personalisiere dein ElectroBrain OS
        </p>
      </header>

      <div className="bg-white dark:bg-zinc-900 p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-12">
        
        {/* --- SEKTION 1: PROFIL --- */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xl font-extrabold mb-6 flex items-center gap-3 text-zinc-800 dark:text-zinc-100">
            <User className="text-cyan-500" size={22} /> Dein Profil
          </h2>
          <div className="space-y-6">
            <div className="relative group">
              <label className="block text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-2 ml-1 uppercase tracking-widest">
                Anzeigename
              </label>
              <input 
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Wie sollen wir dich nennen?"
                suppressHydrationWarning={true}
                className="w-full p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-base font-medium"
              />
            </div>
            <div className="flex items-center gap-2 px-2 text-sm text-zinc-400">
              <Mail size={14} />
              <span>Angemeldet als: <strong className="text-zinc-600 dark:text-zinc-300">{user?.email}</strong></span>
            </div>
          </div>
        </section>

        {/* --- SEKTION 2: DESIGN PAKETE --- */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-xl font-extrabold mb-6 flex items-center gap-3 text-zinc-800 dark:text-zinc-100">
            <Palette className="text-cyan-500" size={22} /> Design-Pakete
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: 'modern', label: 'Modern', icon: '💼', color: 'primary' },
              { id: 'dark', label: 'Dark', icon: '🌙', color: 'slate' },
              { id: 'pastel', label: 'Pastel', icon: '🌸', color: 'pink' }
            ].map((pkg) => (
              <button 
                key={pkg.id}
                onClick={() => changeTheme(pkg.id as any)}
                className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-2 group ${
                  theme === pkg.id 
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 ring-4 ring-cyan-500/10' 
                    : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 hover:border-cyan-200 dark:hover:border-zinc-600'
                }`}
              >
                <div className="text-3xl group-hover:scale-110 transition-transform">{pkg.icon}</div>
                <p className={`font-bold text-sm ${theme === pkg.id ? 'text-cyan-600 dark:text-cyan-400' : 'text-zinc-500'}`}>
                  {pkg.label}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* --- SEKTION 3: CUSTOM COLORS --- */}
        <section className="pt-8 border-t border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-extrabold mb-6 flex items-center gap-3 text-zinc-800 dark:text-zinc-100">
            <span className="text-cyan-500">🧪</span> Custom Colors
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Primary Color */}
            <div className="space-y-3">
              <label className="block text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Hauptfarbe</label>
              <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <input 
                  type="color" 
                  value={customPrimary} 
                  onChange={(e) => { 
                    const val = e.target.value;
                    setCustomPrimary(val); 
                    changeTheme('custom');
                    document.documentElement.style.setProperty('--color-primary', val);
                  }}
                  className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent overflow-hidden"
                />
                <input 
                  type="text" 
                  value={customPrimary}
                  onChange={(e) => { setCustomPrimary(e.target.value); changeTheme('custom'); }}
                  className="flex-1 bg-transparent text-zinc-800 dark:text-zinc-200 font-mono text-sm uppercase outline-none"
                />
              </div>
            </div>

            {/* Canvas Color */}
            <div className="space-y-3">
              <label className="block text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Hintergrund</label>
              <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <input 
                  type="color" 
                  value={customCanvas} 
                  onChange={(e) => { 
                    const val = e.target.value;
                    setCustomCanvas(val); 
                    changeTheme('custom');
                    document.documentElement.style.setProperty('--bg-canvas', val);
                  }}
                  className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent overflow-hidden"
                />
                <input 
                  type="text" 
                  value={customCanvas}
                  onChange={(e) => { setCustomCanvas(e.target.value); changeTheme('custom'); }}
                  className="flex-1 bg-transparent text-zinc-800 dark:text-zinc-200 font-mono text-sm uppercase outline-none"
                />
              </div>
            </div>
          </div>

          {/* VORSCHAU */}
          <div className="mt-10 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
            <p className="text-[10px] font-black text-zinc-400 uppercase mb-4 tracking-[0.2em] text-center">Echtzeit-Vorschau</p>
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 max-w-sm mx-auto">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 text-cyan-500">
                <Shield size={20} />
              </div>
              <h4 className="text-lg font-bold mb-2">Interface Check</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
                So harmonieren deine gewählten Farben mit den Texten.
              </p>
              <button className="w-full py-3 bg-cyan-600 text-white rounded-xl font-bold shadow-lg shadow-cyan-600/20 active:scale-95 transition-transform">
                Aktions-Button
              </button>
            </div>
          </div>
        </section>

        {/* --- ACTIONS --- */}
        <footer className="pt-10 flex flex-col sm:flex-row justify-between items-center gap-6">
            <button 
              onClick={handleLogout}
              className="group flex items-center gap-2 text-zinc-400 hover:text-red-500 font-bold transition-colors text-sm"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> 
              Abmelden
            </button>

            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full sm:w-auto bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-10 py-4 rounded-2xl font-black shadow-xl hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? '...' : <><Save size={20} /> Änderungen speichern</>}
            </button>
        </footer>
      </div>
    </div>
  );
}