'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';

export default function FormulasPage() {
  const { user } = useAuth();
  
  // States
  const [formulas, setFormulas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Alle');
  
  // UI States
  const [jsonInput, setJsonInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchFormulas();
  }, [user]);

  const fetchFormulas = async () => {
    const { data } = await supabase
      .from('formulas')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    if (data) setFormulas(data);
    setLoading(false);
  };

  // --- IMPORT LOGIK ---
  const handleImport = async (inputData: string) => {
    try {
      const parsed = JSON.parse(inputData);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      
      const finalData = list.map(f => ({
        name: f.name || "Unbenannte Formel",
        formula: f.formula || f.math || "",
        // Hier ist der Fix für die Kategorien: Wenn 'category' existiert, nutze es als Präfix
        context: f.context || f.desc || (f.category ? `${f.category}: Keine Beschreibung` : "Allgemein: Keine Beschreibung"),
        source: f.source || "Import",
        is_favorite: false,
        user_id: user?.id
      }));

      const { error } = await supabase.from('formulas').insert(finalData);
      if (error) throw error;

      alert(`${finalData.length} Formeln erfolgreich hinzugefügt!`);
      setJsonInput('');
      setIsImporting(false);
      fetchFormulas();
    } catch (err: any) {
      alert("Fehler beim Import: " + err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    handleImport(text);
  };

  const deleteFormula = async (id: string) => {
    if (!confirm('Diese Formel wirklich löschen?')) return;
    const { error } = await supabase.from('formulas').delete().eq('id', id);
    if (!error) setFormulas(prev => prev.filter(f => f.id !== id));
  };

  const toggleFavorite = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('formulas')
      .update({ is_favorite: !currentState })
      .eq('id', id);

    if (!error) {
      setFormulas(prev => prev.map(f => 
        f.id === id ? { ...f, is_favorite: !currentState } : f
      ));
    }
  };

  // --- FILTER & SORTIERUNG ---
  // Extrahiert alles vor dem Doppelpunkt als Kategorie
  const categories = ['Alle', ...Array.from(new Set(formulas.map(f => {
    const ctx = f.context || '';
    return ctx.includes(':') ? ctx.split(':')[0].trim() : 'Allgemein';
  })))];

  const filteredFormulas = formulas
    .filter(f => {
      const matchesSearch = f.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            f.context?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const ctx = f.context || '';
      const categoryName = ctx.includes(':') ? ctx.split(':')[0].trim() : 'Allgemein';
      const matchesCategory = activeCategory === 'Alle' || categoryName === activeCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => (a.is_favorite === b.is_favorite ? 0 : a.is_favorite ? -1 : 1)); // Favoriten nach oben

  return (
    <div className="p-4 md:p-10 max-w-4xl mx-auto min-h-screen pb-40">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-ink">Wissens-Tresor 🔐</h1>
          <p className="text-zinc-500 text-sm mt-1">{formulas.length} wissenschaftliche Einträge</p>
        </div>
        <button 
          onClick={() => setIsImporting(!isImporting)}
          className="bg-primary text-white px-5 py-2 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition"
        >
          {isImporting ? 'Schließen' : '📥 Import'}
        </button>
      </div>

      {/* IMPORT PANEL */}
      <AnimatePresence>
        {isImporting && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8 bg-panel p-6 rounded-3xl border border-dashed border-primary/30"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Option A: JSON einfügen</label>
                <textarea 
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="bg-canvas p-4 rounded-2xl h-32 text-xs font-mono outline-none border border-gray-100/10 text-ink"
                  placeholder='[{"name": "...", "math": "..."}]'
                />
                <button 
                  onClick={() => handleImport(jsonInput)} 
                  className="bg-zinc-800 text-white py-3 rounded-xl text-sm font-bold active:scale-95 transition"
                >
                  Text-Import starten
                </button>
              </div>
              <div className="flex flex-col justify-center items-center border-2 border-dashed border-gray-100/10 rounded-2xl p-6 bg-canvas/30">
                <label className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-4">Option B: Datei-Upload</label>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" id="formula-file" />
                <label 
                  htmlFor="formula-file" 
                  className="cursor-pointer bg-primary/10 text-primary px-8 py-4 rounded-2xl font-bold hover:bg-primary/20 transition text-center"
                >
                  📁 JSON-Datei wählen
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KATEGORIEN FILTER */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === cat 
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
              : 'bg-panel text-zinc-500 border border-gray-100/10 hover:border-primary/40'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* SUCHE */}
      <div className="relative mb-8">
        <input 
          type="text" 
          placeholder="Formeln durchsuchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-4 pl-12 bg-panel border border-gray-100/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary text-ink"
        />
        <span className="absolute left-4 top-4 opacity-40">🔍</span>
      </div>

      {/* AKKORDEON LISTE */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 animate-pulse text-zinc-500">Daten werden synchronisiert...</div>
        ) : filteredFormulas.length === 0 ? (
          <div className="text-center py-20 bg-panel rounded-3xl border border-dashed border-gray-100/10 text-zinc-500">
            Keine Formeln gefunden.
          </div>
        ) : (
          filteredFormulas.map((f) => (
            <div key={f.id} className={`bg-panel rounded-3xl border ${f.is_favorite ? 'border-yellow-400/40 shadow-yellow-400/5 shadow-lg' : 'border-gray-100/10'} overflow-hidden shadow-sm hover:border-primary/20 transition-all`}>
              <div className="flex items-center">
                {/* FAVORIT BUTTON */}
                <button 
                  onClick={() => toggleFavorite(f.id, f.is_favorite)}
                  className={`pl-6 text-2xl transition-all active:scale-125 ${f.is_favorite ? 'text-yellow-400 opacity-100' : 'text-gray-600 dark:text-gray-400 opacity-20 hover:opacity-50'}`}
                >
                  {f.is_favorite ? '⭐' : '☆'}
                </button>

                <button 
                  onClick={() => setOpenId(openId === f.id ? null : f.id)}
                  className="flex-1 flex justify-between items-center p-6 text-left active:bg-canvas transition"
                >
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-tighter mb-1 block">
                      {f.context && f.context.includes(':') ? f.context.split(':')[0] : 'Allgemein'}
                    </span>
                    <h3 className="font-bold text-ink text-lg">{f.name}</h3>
                    <code className="text-primary/80 text-sm font-mono mt-2 block">{f.formula}</code>
                  </div>
                  <div className={`w-8 h-8 rounded-full bg-canvas flex items-center justify-center transition-transform duration-300 ${openId === f.id ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </button>
              </div>
              
              <AnimatePresence>
                {openId === f.id && (
                  <motion.div 
                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    className="overflow-hidden bg-canvas/30 border-t border-gray-100/5"
                  >
                    <div className="p-6 space-y-6">
                      <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
                        <code className="text-blue-400 text-xl md:text-2xl font-mono block text-center break-all">
                          {f.formula}
                        </code>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase">Kontext & Parameter</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                          {f.context && f.context.includes(':') ? f.context.split(':').slice(1).join(':').trim() : f.context}
                        </p>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-gray-100/5">
                        <span className="text-[10px] bg-zinc-800 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-lg uppercase font-bold tracking-widest">
                          Quelle: {f.source}
                        </span>
                        <button 
                          onClick={() => deleteFormula(f.id)} 
                          className="text-red-500 text-xs font-bold hover:bg-red-500/10 px-3 py-1 rounded-lg transition"
                        >
                          Löschen
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
