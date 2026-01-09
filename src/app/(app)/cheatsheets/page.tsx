'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileCode, 
  FileType, 
  UploadCloud, 
  Trash2, 
  ChevronDown, 
  Info,
  Table as TableIcon,
  X
} from 'lucide-react';

// Zentrale Glass-Klasse für Konsistenz mit Dashboard
const glassClass = "bg-white/5 dark:bg-zinc-900/20 backdrop-blur-xl border border-white/10 dark:border-zinc-800/50 shadow-xl";

type Sheet = {
  id: string;
  title: string;
  content: string;
  format: 'json' | 'html';
  created_at: string;
};

export default function CheatSheetsPage() {
  const { user } = useAuth();
  
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchSheets();
  }, [user]);

  const fetchSheets = async () => {
    const { data } = await supabase
      .from('cheatsheets')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (data) setSheets(data as Sheet[]);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const fileName = file.name.toLowerCase();
    const title = file.name.split('.')[0];
    const content = await file.text();
    let format: 'json' | 'html' = 'html';

    if (fileName.endsWith('.json')) {
      format = 'json';
      try {
        JSON.parse(content);
      } catch (e) {
        alert("Ungültige JSON Datei.");
        return;
      }
    } else if (!fileName.endsWith('.html') && !fileName.endsWith('.htm')) {
      alert("Nur .html oder .json Dateien sind erlaubt.");
      return;
    }

    const { error } = await supabase.from('cheatsheets').insert([{
      user_id: user.id,
      title,
      content,
      format
    }]);

    if (!error) {
      setIsImporting(false);
      fetchSheets();
    }
  };

  const deleteSheet = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Dieses Cheat Sheet wirklich löschen?')) return;
    const { error } = await supabase.from('cheatsheets').delete().eq('id', id);
    if (!error) setSheets(prev => prev.filter(s => s.id !== id));
  };

  const renderJsonTable = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      const list = Array.isArray(data) ? data : [data];
      if (list.length === 0) return <p className="p-8 text-zinc-500 dark:text-zinc-400">Keine Daten vorhanden.</p>;
      const headers = Object.keys(list[0]);

      return (
        <div className="overflow-x-auto border-t border-zinc-200 dark:border-zinc-800/50">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-zinc-50/50 dark:bg-white/5 sticky top-0 backdrop-blur-sm">
              <tr>
                {headers.map(h => (
                  <th key={h} className="px-6 py-4 font-black uppercase text-[10px] text-zinc-500 dark:text-zinc-400 tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
              {list.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-white/5 transition-colors">
                  {headers.map(h => (
                    <td key={h} className="px-6 py-4 text-zinc-600 dark:text-zinc-300 font-medium">
                      {typeof row[h] === 'object' ? JSON.stringify(row[h]) : String(row[h])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } catch (e) {
      return <div className="p-8 text-red-500 font-bold">JSON Parsing Error</div>;
    }
  };

  return (
    /* FIX: w-full max-w-full overflow-x-hidden für sauberes Layout */
    <div className="w-full max-w-full p-4 md:p-8 lg:p-12 min-h-screen pb-40 bg-transparent text-zinc-900 dark:text-zinc-100 overflow-x-hidden">
      
      {/* HEADER */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 p-8 rounded-[3rem] ${glassClass}`}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter flex items-center gap-4 text-zinc-900 dark:text-white">
             <div className="p-3 bg-cyan-500 rounded-2xl shadow-lg shadow-cyan-500/20">
               <TableIcon className="text-white" size={32} />
             </div>
             Cheat Sheets
          </h1>
          <div className="flex items-center gap-2 mt-2">
             <span className="text-zinc-500 dark:text-zinc-400 font-bold text-sm uppercase tracking-widest">{sheets.length} Referenzen</span>
             <div className="h-1 w-1 bg-zinc-400 rounded-full" />
             <span className="text-zinc-500 dark:text-zinc-400 text-sm">Griffbereit</span>
          </div>
        </motion.div>

        <button 
          onClick={() => setIsImporting(!isImporting)}
          className="w-full md:w-auto bg-zinc-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          {isImporting ? <><X size={20} /> Abbrechen</> : <><UploadCloud size={20} /> Sheet hochladen</>}
        </button>
      </div>

      {/* UPLOAD PANEL */}
      <AnimatePresence>
        {isImporting && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-12"
          >
            <div className={`border-4 border-dashed border-zinc-200 dark:border-zinc-700/50 rounded-[3rem] p-12 flex flex-col items-center text-center ${glassClass}`}>
                <div className="p-6 bg-cyan-500/10 rounded-full mb-6">
                   <FileType className="text-cyan-500" size={48} />
                </div>
                <h3 className="text-2xl font-black mb-2 text-zinc-900 dark:text-white">HTML oder JSON Dateien</h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md font-medium">Lade deine Dokumentationen oder Tabellen hoch. Sie werden sicher in deinem Tresor gespeichert.</p>
                
                <input type="file" accept=".html,.htm,.json" onChange={handleFileUpload} className="hidden" id="sheet-upload" />
                <label htmlFor="sheet-upload" className="bg-cyan-500 text-white px-10 py-4 rounded-2xl font-bold cursor-pointer shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all active:scale-95">
                    Datei vom Computer wählen
                </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GRID */}
      <div className="flex flex-col gap-6">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-xs">Lade Referenzen...</p>
            </div>
        ) : sheets.length === 0 ? (
            <div className={`text-center py-32 rounded-[3rem] border border-dashed border-zinc-200 dark:border-zinc-800 ${glassClass}`}>
                <Info className="mx-auto text-zinc-300 dark:text-zinc-600 mb-4" size={48} />
                <p className="text-zinc-500 dark:text-zinc-400 text-xl font-black">Noch keine Cheat Sheets vorhanden.</p>
                <p className="text-zinc-400 text-sm mt-2">Lade oben dein erstes Sheet hoch.</p>
            </div>
        ) : (
            sheets.map((s) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={s.id} 
                  className={`rounded-[2.5rem] overflow-hidden transition-all duration-300 ${glassClass} hover:border-cyan-500/30 group`}
                >
                    <div 
                        onClick={() => setOpenId(openId === s.id ? null : s.id)}
                        className="w-full flex justify-between items-center p-6 md:p-8 cursor-pointer"
                    >
                        <div className="flex items-center gap-6">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${s.format === 'json' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'}`}>
                                {s.format === 'json' ? <FileCode size={28} /> : <FileType size={28} />}
                            </div>
                            <div>
                                <h3 className="font-black text-xl md:text-2xl text-zinc-900 dark:text-white tracking-tight group-hover:text-cyan-500 transition-colors">{s.title}</h3>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${s.format === 'json' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' : 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600'}`}>{s.format}</span>
                                  <span className="text-zinc-400 dark:text-zinc-500 text-xs font-bold">{new Date(s.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <button 
                                onClick={(e) => deleteSheet(s.id, e)}
                                className="p-3 text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                             >
                                <Trash2 size={22} />
                             </button>
                             <div className={`p-3 rounded-xl transition-all duration-300 ${openId === s.id ? 'rotate-180 bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-zinc-100 dark:bg-white/5 text-zinc-400'}`}>
                                <ChevronDown size={20} />
                             </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {openId === s.id && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }} 
                                animate={{ height: 'auto', opacity: 1 }} 
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-zinc-100 dark:border-white/5 bg-zinc-50/30 dark:bg-black/20"
                            >
                                <div className="p-4 md:p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                                    {s.format === 'json' ? (
                                        renderJsonTable(s.content)
                                    ) : (
                                        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-8 md:p-12 rounded-[2rem] border border-zinc-200 dark:border-white/10 shadow-inner">
                                            <article className="prose prose-zinc dark:prose-invert max-w-none prose-img:rounded-2xl prose-headings:font-black prose-headings:tracking-tight prose-p:leading-relaxed">
                                                <div dangerouslySetInnerHTML={{ __html: s.content }} />
                                            </article>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            ))
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(161, 161, 170, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(161, 161, 170, 0.4);
        }
      `}</style>
    </div>
  );
}