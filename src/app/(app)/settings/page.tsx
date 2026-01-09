'use client';

import { User, LogOut, Save, Palette, Settings, RefreshCcw, Download, Trash2, Sliders, Brain, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTheme } from '@/components/providers/ThemeProvider';

// Zentrale Glass-Klasse
const glassClass = "bg-white/5 dark:bg-zinc-900/20 backdrop-blur-xl border border-white/10 dark:border-zinc-800/50 shadow-xl";

// Schöne Presets für Inspiration
const COLOR_PRESETS = [
  { name: 'Ocean', primary: '#06b6d4', canvas: '#f0f9ff', panel: '#ffffff', ink: '#0e7490' },
  { name: 'Midnight', primary: '#8b5cf6', canvas: '#09090b', panel: '#18181b', ink: '#e4e4e7' },
  { name: 'Forest', primary: '#10b981', canvas: '#ecfdf5', panel: '#ffffff', ink: '#064e3b' },
  { name: 'Sunset', primary: '#f59e0b', canvas: '#fffbeb', panel: '#ffffff', ink: '#78350f' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const { 
    theme, changeTheme, fullName, updateName, 
    customColors, setCustomColors 
  } = useTheme();

  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(50); // Beispiel-State für Lern-Limit

  useEffect(() => {
    if (fullName) setNameInput(fullName);
  }, [fullName]);

  // Update Funktion für einzelne Farbwerte
  const handleColorChange = (key: string, value: string) => {
    const updatedColors = { ...(customColors || {}), [key]: value };
    setCustomColors(updatedColors); 
    if (theme !== 'custom') changeTheme('custom');
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setCustomColors({
      'color-primary': preset.primary,
      'bg-canvas': preset.canvas,
      'bg-panel': preset.panel,
      'text-ink': preset.ink
    });
    changeTheme('custom');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateName(nameInput);
      
      if (theme === 'custom' && customColors) {
        const { error } = await supabase
          .from('profiles')
          .update({ custom_colors: customColors, theme: 'custom' })
          .eq('id', user?.id);
        if (error) throw error;
      }
      // Hier würdest du auch das Daily Limit speichern
      alert("Einstellungen gespeichert! 🎨");
    } catch (error: any) {
      console.error("Fehler:", error.message);
      alert("Fehler beim Speichern.");
    } finally {
      setLoading(false);
    }
  };

  // Export Funktion (Mockup Logik - würde in echt Daten fetchen)
  const handleExportData = async () => {
    const data = { user, settings: customColors, exportDate: new Date() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'electrobrain-backup.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="w-full max-w-[1920px] p-4 md:p-8 lg:p-12 min-h-screen pb-40 bg-transparent text-zinc-900 dark:text-zinc-100 overflow-x-hidden">
      
      {/* HEADER */}
      <header className={`mb-10 p-8 rounded-[3rem] ${glassClass}`}>
        <h1 className="text-4xl font-black flex items-center gap-4 tracking-tight">
          <div className="p-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl shadow-lg">
             <Settings size={32} />
          </div>
          Einstellungen
        </h1>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LINK: HAUPT-EINSTELLUNGEN */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* 1. PROFIL */}
          <section className={`p-8 md:p-10 rounded-[3rem] ${glassClass}`}>
            <h2 className="text-xl font-black mb-6 flex items-center gap-3">
              <User className="text-primary" size={24} /> Identität
            </h2>
            <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Anzeigename</label>
                    <input 
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 outline-none focus:border-primary transition-all font-bold text-lg"
                    placeholder="Dein Name"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">E-Mail</label>
                    <div className="w-full p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-500 font-medium cursor-not-allowed">
                        {user?.email}
                    </div>
                </div>
            </div>
          </section>

          {/* 2. LERN PRÄFERENZEN (NEU) */}
          <section className={`p-8 md:p-10 rounded-[3rem] ${glassClass}`}>
            <h2 className="text-xl font-black mb-6 flex items-center gap-3">
              <Brain className="text-primary" size={24} /> Neuro-Konfiguration
            </h2>
            <div className="space-y-8">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Tägliches Karten-Limit</label>
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-black">{dailyLimit} Karten</span>
                    </div>
                    <input 
                        type="range" min="10" max="200" step="10"
                        value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value))}
                        className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <p className="text-xs text-zinc-500 mt-2">Bestimmt, wie viele neue Karten der Algorithmus dir maximal pro Tag vorschlägt.</p>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/5">
                    <div className="flex items-center gap-3">
                        <Bell className="text-zinc-400" size={20} />
                        <div>
                            <p className="font-bold text-sm">Fokus-Benachrichtigungen</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Sound & Popups</p>
                        </div>
                    </div>
                    <div className="w-12 h-6 bg-zinc-800 rounded-full p-1 cursor-pointer flex justify-end">
                        <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-md" />
                    </div>
                </div>
            </div>
          </section>

          {/* 3. DESIGN STUDIO */}
          <section className={`p-8 md:p-10 rounded-[3rem] ${glassClass}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h2 className="text-xl font-black flex items-center gap-3">
                <Palette className="text-primary" size={24} /> Visueller Cortex
              </h2>
              {theme === 'custom' && (
                <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Custom Theme</span>
              )}
            </div>

            {/* Farb-Picker Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <ColorInput label="Hauptfarbe (Akzent)" value={customColors?.['color-primary'] || '#06b6d4'} onChange={(v) => handleColorChange('color-primary', v)} />
              <ColorInput label="Hintergrund (Canvas)" value={customColors?.['bg-canvas'] || '#f9fafb'} onChange={(v) => handleColorChange('bg-canvas', v)} />
              <ColorInput label="Karten / Panels" value={customColors?.['bg-panel'] || '#ffffff'} onChange={(v) => handleColorChange('bg-panel', v)} />
              <ColorInput label="Schriftfarbe (Ink)" value={customColors?.['text-ink'] || '#18181b'} onChange={(v) => handleColorChange('text-ink', v)} />
            </div>

            {/* Presets */}
            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4 block">Quick-Presets</label>
              <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                {COLOR_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-primary transition-all bg-zinc-50 dark:bg-zinc-900 min-w-fit active:scale-95"
                  >
                    <div className="w-4 h-4 rounded-full border border-black/10" style={{ background: preset.primary }} />
                    <span className="text-xs font-bold uppercase tracking-wide">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 4. DATEN & SICHERHEIT */}
          <section className={`p-8 md:p-10 rounded-[3rem] ${glassClass} border-red-500/10`}>
            <h2 className="text-xl font-black mb-6 flex items-center gap-3">
              <Sliders className="text-zinc-400" size={24} /> Daten & Zone
            </h2>
            <div className="space-y-4">
              <button onClick={handleExportData} className="w-full flex items-center justify-between p-5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors group">
                <div className="flex items-center gap-4">
                  <Download className="text-zinc-500 group-hover:text-primary transition-colors" size={20}/>
                  <div className="text-left">
                    <p className="font-bold text-sm">Daten exportieren</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Backup als JSON</p>
                  </div>
                </div>
                <ChevronRightIcon />
              </button>

              {/* HIER STARTET DER KOMMENTAR - ALLES DARIN WIRD IGNORIERT */}
              {/* <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button className="text-red-500 font-bold text-sm flex items-center gap-2 hover:underline">
                  <Trash2 size={16} /> Account unwiderruflich löschen
                </button>
              </div>
              */}
              {/* HIER ENDET DER KOMMENTAR */}
              
            </div> {/* Dieses div schließt 'space-y-4' ab und muss SICHTBAR bleiben */}
          </section>

          {/* ACTIONS FOOTER */}
          <div className="flex justify-between items-center pt-6">
            <button onClick={handleLogout} className="text-zinc-400 hover:text-red-500 font-bold flex items-center gap-2 transition-colors px-4 text-sm uppercase tracking-widest">
              <LogOut size={16} /> Logout
            </button>
            <button 
              onClick={handleSave} 
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white dark:text-black px-12 py-4 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
            >
              <Save size={20} /> {loading ? 'Speichere...' : 'Änderungen übernehmen'}
            </button>
          </div>

        </div>

        {/* RECHTS: LIVE PREVIEW CARD (Sticky) */}
        <div className="xl:col-span-1">
          <div className="sticky top-10 space-y-6">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Live Vorschau</h3>
            
            <div className="bg-panel p-8 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl transition-colors duration-300">
              <div className="w-14 h-14 rounded-2xl bg-primary mb-8 flex items-center justify-center text-white dark:text-black shadow-lg shadow-primary/30">
                <Palette size={28} />
              </div>
              <h4 className="text-3xl font-black text-ink mb-4 tracking-tight">Dein Look.</h4>
              <p className="text-ink opacity-70 mb-8 font-medium leading-relaxed text-sm">
                So sehen deine Karten, Texte und Buttons im neuen Design aus. Die Änderungen werden sofort angewendet.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="h-3 w-full bg-canvas rounded-full overflow-hidden border border-black/5">
                  <div className="h-full w-2/3 bg-primary" />
                </div>
                <div className="flex justify-between text-[10px] font-black text-ink opacity-50 uppercase tracking-widest">
                  <span>Fortschritt</span>
                  <span>66%</span>
                </div>
              </div>

              <button className="w-full py-4 rounded-2xl bg-primary text-white dark:text-black font-black shadow-lg hover:scale-[1.02] active:scale-95 transition-transform">
                Primary Button
              </button>
            </div>

            <div className="p-8 rounded-[3rem] bg-canvas border border-zinc-200 dark:border-zinc-800 text-center opacity-80">
              <p className="text-xs font-bold text-ink uppercase tracking-widest">Hintergrund-Check</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Helpers
function ColorInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="flex items-center gap-3 bg-canvas p-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:border-primary transition-colors cursor-pointer group relative overflow-hidden">
        <input 
          type="color" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="w-10 h-10 rounded-xl shadow-sm border border-black/10 shrink-0" style={{ backgroundColor: value }} />
        <span className="font-mono text-xs font-bold text-ink uppercase flex-1">{value}</span>
        <RefreshCcw size={14} className="text-zinc-400 mr-2 group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
}

function ChevronRightIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300 dark:text-zinc-700"><path d="m9 18 6-6-6-6"/></svg>
    )
}