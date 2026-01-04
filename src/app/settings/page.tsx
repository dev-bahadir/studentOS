'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Pfade zu deinen Providern und dem Supabase Client
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../components/providers/AuthProvider';
import { useTheme } from '../../components/providers/ThemeProvider';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, changeTheme, fullName, updateName } = useTheme();

  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [customPrimary, setCustomPrimary] = useState('#2563eb');
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
        console.error("Details:", error.message, error.hint, error.details);
      } else {
        window.location.reload(); 
      }
    } else {
      setLoading(false);
      alert("Profil gespeichert! ✅");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/'); 
  };

  return (
    <div className="p-8 max-w-2xl mx-auto min-h-screen animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold mb-8 text-ink">Einstellungen ⚙️</h1>

      <div className="bg-panel p-8 rounded-3xl shadow-xl border border-gray-100/10 space-y-10">
        
        {/* --- SEKTION 1: PROFIL --- */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-ink flex items-center gap-2">
            <span>👤</span> Dein Profil
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 opacity-70">Anzeigename</label>
              <input 
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Wie sollen wir dich nennen?"
                suppressHydrationWarning={true}
                className="w-full p-4 rounded-2xl border border-gray-200 bg-canvas text-ink focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <p className="text-xs opacity-50 px-1">Angemeldet als: {user?.email}</p>
          </div>
        </section>

        {/* --- SEKTION 2: DESIGN PAKETE --- */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-ink flex items-center gap-2">
            <span>🎨</span> Design-Pakete
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button 
              onClick={() => changeTheme('modern')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center ${theme === 'modern' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-transparent bg-gray-100/50 hover:bg-gray-100'}`}
            >
              <div className="text-2xl mb-2">💼</div>
              <p className="font-bold text-ink text-sm">Modern</p>
            </button>

            <button 
              onClick={() => changeTheme('dark')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center ${theme === 'dark' ? 'border-blue-500 bg-slate-800' : 'border-transparent bg-slate-900 hover:bg-slate-800'}`}
            >
              <div className="text-2xl mb-2">🌙</div>
              <p className="font-bold text-gray-200 text-sm">Dark</p>
            </button>

            <button 
              onClick={() => changeTheme('pastel')}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center ${theme === 'pastel' ? 'border-pink-400 bg-pink-50' : 'border-transparent bg-pink-50/50 hover:bg-pink-50'}`}
            >
              <div className="text-2xl mb-2">🌸</div>
              <p className="font-bold text-gray-800 text-sm">Pastel</p>
            </button>
          </div>
        </section>

        {/* --- SEKTION 3: CUSTOM HEX-CODES --- */}
        <section className="pt-6 border-t border-gray-100/10">
          <h2 className="text-xl font-bold mb-4 text-ink flex items-center gap-2">
            <span>🧪</span> Eigene Farben (Custom)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Primary Color */}
            <div className="space-y-2">
              <label className="block text-xs font-bold opacity-50 uppercase tracking-tighter">Hauptfarbe (Primary)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={customPrimary} 
                  onChange={(e) => { 
                    const val = e.target.value;
                    setCustomPrimary(val); 
                    changeTheme('custom');
                    document.documentElement.style.setProperty('--color-primary', val);
                  }}
                  className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                />
                <input 
                  type="text" 
                  value={customPrimary}
                  onChange={(e) => { setCustomPrimary(e.target.value); changeTheme('custom'); }}
                  suppressHydrationWarning={true}
                  className="flex-1 p-3 rounded-xl border border-gray-200 bg-canvas text-ink font-mono text-sm uppercase"
                  placeholder="#2563EB"
                />
              </div>
            </div>

            {/* Canvas Color */}
            <div className="space-y-2">
              <label className="block text-xs font-bold opacity-50 uppercase tracking-tighter">Hintergrund (Canvas)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={customCanvas} 
                  onChange={(e) => { 
                    const val = e.target.value;
                    setCustomCanvas(val); 
                    changeTheme('custom');
                    document.documentElement.style.setProperty('--bg-canvas', val);
                  }}
                  className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                />
                <input 
                  type="text" 
                  value={customCanvas}
                  onChange={(e) => { setCustomCanvas(e.target.value); changeTheme('custom'); }}
                  suppressHydrationWarning={true}
                  className="flex-1 p-3 rounded-xl border border-gray-200 bg-canvas text-ink font-mono text-sm uppercase"
                  placeholder="#F9FAFB"
                />
              </div>
            </div>
          </div>

          {/* --- VORSCHAU BOX INNERHALB DER SEKTION --- */}
          <div className="mt-8 p-6 rounded-2xl border border-gray-100/20 bg-canvas transition-colors duration-500">
            <p className="text-[10px] font-bold opacity-40 uppercase mb-3 tracking-widest text-ink">Live-Vorschau</p>
            <div className="p-6 rounded-xl bg-panel shadow-sm border border-gray-100/10">
              <h4 className="text-lg font-bold text-ink mb-2">Beispiel Karte</h4>
              <p className="text-sm opacity-70 mb-4 text-ink">
                So wirken deine gewählten Hex-Codes zusammen.
              </p>
              <button className="px-6 py-2 bg-primary text-white rounded-lg font-bold shadow-md shadow-primary/20">
                Aktions-Button
              </button>
            </div>
          </div>
          
          <p className="text-[11px] mt-4 opacity-40 italic text-ink">
            Hinweis: Das System wechselt beim Verstellen der Farben automatisch in den Custom-Modus.
          </p>
        </section>

        {/* --- SEKTION 4: AKTIONEN --- */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button 
              onClick={handleLogout}
              className="text-red-500 text-sm font-bold hover:bg-red-50 px-4 py-2 rounded-xl transition"
            >
              Abmelden
            </button>

            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full sm:w-auto bg-primary text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Wird gespeichert...' : '💾 Alle Änderungen speichern'}
            </button>
        </div>

      </div>
    </div>
  );
}