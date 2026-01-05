'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';

// Vordefinierte Kategorien (du kannst sie erweitern)
const CATEGORIES = ['Lernen', 'Coding', 'Schreiben', 'Prüfung', 'Allgemein'];

export default function PromptsPage() {
  const { user } = useAuth();
  
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [isCreating, setIsCreating] = useState(false);

  // Form States
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Lernen');

  useEffect(() => {
    if (user) fetchPrompts();
  }, [user]);

  const fetchPrompts = async () => {
    const { data } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    if (data) setPrompts(data);
    setLoading(false);
  };

  const addPrompt = async () => {
    if (!title.trim() || !content.trim()) return;

    const { error } = await supabase.from('prompts').insert([{
      user_id: user?.id,
      title,
      content,
      category
    }]);

    if (!error) {
      setTitle(''); setContent(''); setIsCreating(false);
      fetchPrompts();
      // XP Belohnung
      await supabase.rpc('increment_xp', { x: 15, row_id: user?.id });
    }
  };

  const deletePrompt = async (id: string) => {
    if (!confirm('Prompt löschen?')) return;
    const { error } = await supabase.from('prompts').delete().eq('id', id);
    if (!error) setPrompts(prev => prev.filter(p => p.id !== id));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Kopiert! 📋");
  };

  // Filter Logik
  const filteredPrompts = prompts.filter(p => 
    activeCategory === 'Alle' || p.category === activeCategory
  );

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto min-h-screen pb-40">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800 flex items-center gap-2">
            <span className="text-purple-600">✨</span> Prompt Bibliothek
          </h1>
          <p className="text-gray-500 text-sm mt-1">{prompts.length} Vorlagen gespeichert</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-purple-600 text-white px-5 py-2 rounded-2xl font-bold shadow-lg shadow-purple-600/20 active:scale-95 transition"
        >
          {isCreating ? 'Schließen' : '+ Neuer Prompt'}
        </button>
      </div>

      {/* CREATE PANEL */}
      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input 
                  value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Titel (z.B. 'Mathe Klausur Planer')"
                  className="p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-purple-500"
                />
                <select 
                  value={category} onChange={e => setCategory(e.target.value)}
                  className="p-3 bg-gray-50 rounded-xl border-none outline-none cursor-pointer"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <textarea 
                value={content} onChange={e => setContent(e.target.value)}
                placeholder="Dein Prompt Text hier..."
                className="w-full h-32 p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-purple-500 mb-4 font-mono text-sm"
              />
              <button onClick={addPrompt} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition">
                Speichern
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KATEGORIEN FILTER */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        {['Alle', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === cat 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
              : 'bg-white text-gray-500 border border-gray-100 hover:border-purple-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* GRID LISTE */}
      {loading ? (
        <div className="text-center py-20 text-gray-600 dark:text-gray-400">Lade Prompts...</div>
      ) : filteredPrompts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-gray-600 dark:text-gray-400">
          Noch keine Prompts in dieser Kategorie.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((p) => (
            <div key={p.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full group">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold bg-purple-50 text-purple-600 px-3 py-1 rounded-full uppercase tracking-wider">
                  {p.category}
                </span>
                <button onClick={() => deletePrompt(p.id)} className="text-gray-300 hover:text-red-500 transition">
                  🗑️
                </button>
              </div>
              
              <h3 className="font-bold text-gray-800 text-lg mb-2">{p.title}</h3>
              
              <div className="bg-gray-50 p-4 rounded-xl mb-4 flex-1 overflow-hidden relative">
                <p className="text-xs text-gray-600 font-mono line-clamp-4">{p.content}</p>
                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-gray-50 to-transparent"></div>
              </div>

              <button 
                onClick={() => copyToClipboard(p.content)}
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-900 hover:text-white hover:border-gray-900 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span>📋</span> Kopieren
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}