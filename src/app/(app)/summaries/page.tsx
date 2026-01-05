'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient'; // Pfad ggf. anpassen
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';

export default function SummariesPage() {
  const { user } = useAuth();
  
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchSummaries();
  }, [user]);

  const fetchSummaries = async () => {
    const { data } = await supabase
      .from('summaries')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (data) setSummaries(data);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Nur HTML erlauben
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
        alert("Bitte nur .html Dateien hochladen!");
        return;
    }

    const title = file.name.replace('.html', '').replace('.htm', '');
    const content = await file.text();

    const { error } = await supabase.from('summaries').insert([{
        user_id: user.id,
        title: title,
        content: content
    }]);

    if (error) {
        alert("Upload fehlgeschlagen: " + error.message);
    } else {
        alert("Zusammenfassung gespeichert!");
        setIsImporting(false);
        fetchSummaries();
        
        // XP Bonus
        await supabase.rpc('increment_xp', { x: 20, row_id: user.id });
    }
  };

  const deleteSummary = async (id: string, e: any) => {
    e.stopPropagation();
    if (!confirm('Zusammenfassung löschen?')) return;
    const { error } = await supabase.from('summaries').delete().eq('id', id);
    if (!error) setSummaries(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto min-h-screen pb-40">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Deep Learning 📚</h1>
          <p className="text-zinc-500 text-sm mt-1">{summaries.length} Zusammenfassungen gespeichert</p>
        </div>
        <button 
          onClick={() => setIsImporting(!isImporting)}
          className="bg-blue-600 text-white px-5 py-2 rounded-2xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition flex items-center gap-2"
        >
          {isImporting ? 'Abbrechen' : '📄 HTML Import'}
        </button>
      </div>

      {/* UPLOAD BEREICH */}
      <AnimatePresence>
        {isImporting && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="border-2 border-dashed border-blue-200 bg-blue-50 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
                <div className="text-4xl mb-3">🌐</div>
                <h3 className="font-bold text-blue-900 mb-2">HTML Datei hier ablegen</h3>
                <p className="text-blue-600/60 text-sm mb-6">Exportiere deine Notizen (z.B. aus NotebookLM oder Notion) als HTML.</p>
                
                <input 
                    type="file" 
                    accept=".html,.htm" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    id="summary-upload" 
                />
                <label 
                    htmlFor="summary-upload" 
                    className="bg-panel text-blue-600 px-6 py-3 rounded-xl font-bold cursor-pointer shadow-sm hover:shadow-md transition border border-blue-100"
                >
                    Datei auswählen
                </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LISTE */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
            <div className="text-center py-20 text-gray-600 dark:text-gray-400">Lade Bibliothek...</div>
        ) : summaries.length === 0 ? (
            <div className="text-center py-20 bg-canvas rounded-3xl border border-gray-100 text-gray-600 dark:text-gray-400">
                Noch keine Zusammenfassungen. Importiere eine HTML Datei!
            </div>
        ) : (
            summaries.map((s) => (
                <div key={s.id} className="bg-panel border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <button 
                        onClick={() => setOpenId(openId === s.id ? null : s.id)}
                        className="w-full flex justify-between items-center p-6 text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center text-xl">
                                📑
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">{s.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                                    Importiert am {new Date(s.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <div 
                                onClick={(e) => deleteSummary(s.id, e)}
                                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-500 transition"
                                title="Löschen"
                             >
                                🗑️
                             </div>
                             <div className={`transition-transform duration-300 ${openId === s.id ? 'rotate-180' : ''}`}>
                                ▼
                             </div>
                        </div>
                    </button>

                    <AnimatePresence>
                        {openId === s.id && (
                            <motion.div 
                                initial={{ height: 0 }} 
                                animate={{ height: 'auto' }} 
                                exit={{ height: 0 }}
                                className="border-t border-gray-100 bg-canvas/50"
                            >
                                <div className="p-8 prose prose-blue max-w-none prose-img:rounded-xl">
                                    {/* HTML INHALT */}
                                    <div dangerouslySetInnerHTML={{ __html: s.content }} />
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
