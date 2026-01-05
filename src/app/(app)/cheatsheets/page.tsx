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
      await supabase.rpc('increment_xp', { x: 10, row_id: user.id });
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
      if (list.length === 0) return <p className="p-8 text-zinc-500">Datei enthält keine Daten.</p>;
      
      const headers = Object.keys(list[0]);

      return (
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto border-t border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full text-sm text-left tabular-nums">
            <thead className="bg-zinc-100 dark:bg-zinc-800 sticky top-0 z-10">
              <tr>
                {headers.map(h => (
                  <th key={h} className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {list.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  {headers.map(h => (
                    <td key={h} className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-medium border-zinc-100 dark:border-zinc-800">
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
      return <div className="p-8 text-red-500 font-mono text-xs">JSON Error: Parsing failed.</div>;
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto min-h-screen pb-40 text-zinc-900 dark:text-zinc-100">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
             <TableIcon className="text-cyan-500" size={36} /> Cheat Sheets
          </h1>
          <p className="text-zinc-500 font-medium mt-1">{sheets.length} Referenzen griffbereit</p>
        </div>
        <button 
          onClick={() => setIsImporting(!isImporting)}
          className="w-full md:w-auto bg-zinc-900 dark:bg-panel text-white dark:text-ink px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {isImporting ? <><X size={20} /> Abbrechen</> : <><UploadCloud size={20} /> Upload</>}
        </button>
      </div>

      {/* UPLOAD PANEL */}
      <AnimatePresence>
        {isImporting && (
          <motion.div 
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 32 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="border-4 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 rounded-[3rem] p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-3xl flex items-center justify-center shadow-sm mb-6">
                    <FileType className="text-cyan-500" size={40} />
                </div>
                <h3 className="text-xl font-black mb-2">HTML oder JSON einspeisen</h3>
                <p className="text-zinc-500 text-sm mb-8 max-w-xs mx-auto">
                    JSON Dateien werden automatisch als Tabellen gerendert. HTML behält sein eigenes Layout.
                </p>
                
                <input 
                    type="file" 
                    accept=".html,.htm,.json" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    id="sheet-upload" 
                />
                <label 
                    htmlFor="sheet-upload" 
                    className="bg-zinc-900 dark:bg-panel text-white dark:text-ink px-10 py-4 rounded-2xl font-black cursor-pointer shadow-lg hover:shadow-cyan-500/10 transition-all active:scale-95"
                >
                    Datei auswählen
                </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GRID */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
            <div className="text-center py-20 flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Lade Tresor...</p>
            </div>
        ) : sheets.length === 0 ? (
            <div className="text-center py-24 bg-zinc-50 dark:bg-zinc-900/30 rounded-[3rem] border border-zinc-200 dark:border-zinc-800">
                <Info className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" size={48} />
                <p className="text-zinc-500 font-bold tracking-tight">Dein Tresor ist leer.</p>
            </div>
        ) : (
            sheets.map((s) => (
                <div key={s.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <button 
                        onClick={() => setOpenId(openId === s.id ? null : s.id)}
                        className="w-full flex justify-between items-center p-6 md:p-8 text-left group"
                    >
                        <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-inner ${s.format === 'json' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600'}`}>
                                {s.format === 'json' ? <FileCode size={24} /> : <FileType size={24} />}
                            </div>
                            <div>
                                <h3 className="font-black text-xl tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">{s.title}</h3>
                                <p className="text-zinc-400 text-[10px] mt-2 uppercase font-black tracking-[0.2em] flex items-center gap-2">
                                    <span className={s.format === 'json' ? 'text-amber-500' : 'text-cyan-500'}>{s.format}</span> 
                                    <span>•</span> 
                                    {new Date(s.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <div 
                                onClick={(e) => deleteSheet(s.id, e)}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl text-zinc-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-all"
                             >
                                <Trash2 size={20} />
                             </div>
                             <div className={`transition-transform duration-500 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl ${openId === s.id ? 'rotate-180 bg-cyan-500 text-white' : ''}`}>
                                <ChevronDown size={20} />
                             </div>
                        </div>
                    </button>

                    <AnimatePresence>
                        {openId === s.id && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }} 
                                animate={{ height: 'auto', opacity: 1 }} 
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50"
                            >
                                <div className="p-0">
                                    {s.format === 'json' ? (
                                        renderJsonTable(s.content)
                                    ) : (
                                        <div className="p-8 md:p-12 overflow-x-auto bg-white dark:bg-zinc-950">
                                            {/* Scoped Styles für HTML Content */}
                                            <div className="all-initial prose prose-zinc dark:prose-invert max-w-none">
                                                <div dangerouslySetInnerHTML={{ __html: s.content }} />
                                            </div>
                                        </div>
                                    )}
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
