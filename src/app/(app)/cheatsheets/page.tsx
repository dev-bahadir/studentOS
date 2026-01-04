'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';

export default function CheatSheetsPage() {
  const { user } = useAuth();
  
  const [sheets, setSheets] = useState<any[]>([]);
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
    
    if (data) setSheets(data);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const fileName = file.name.toLowerCase();
    const title = file.name.split('.')[0];
    const content = await file.text();
    let format = 'html';

    if (fileName.endsWith('.json')) {
        format = 'json';
        // Validierung: Ist es valides JSON?
        try {
            JSON.parse(content);
        } catch (e) {
            alert("Fehler: Das ist keine gültige JSON Datei.");
            return;
        }
    } else if (!fileName.endsWith('.html') && !fileName.endsWith('.htm')) {
        alert("Nur .html oder .json erlaubt!");
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

  const deleteSheet = async (id: string, e: any) => {
    e.stopPropagation();
    if (!confirm('Cheat Sheet löschen?')) return;
    const { error } = await supabase.from('cheatsheets').delete().eq('id', id);
    if (!error) setSheets(prev => prev.filter(s => s.id !== id));
  };

  // Helper um JSON als Tabelle zu rendern
  const renderJsonTable = (jsonString: string) => {
    try {
        const data = JSON.parse(jsonString);
        const list = Array.isArray(data) ? data : [data];
        if (list.length === 0) return <p>Leere Datei</p>;
        
        const headers = Object.keys(list[0]);

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700 uppercase font-bold text-xs">
                        <tr>
                            {headers.map(h => <th key={h} className="px-4 py-3">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {list.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50">
                                {headers.map(h => (
                                    <td key={h} className="px-4 py-3 font-mono text-gray-600">
                                        {typeof row[h] === 'object' ? JSON.stringify(row[h]) : row[h]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    } catch (e) {
        return <pre className="text-red-500">JSON Fehler: Konnte Tabelle nicht bauen.</pre>;
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto min-h-screen pb-40">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800 flex items-center gap-2">
             <span>📜</span> Cheat Sheets
          </h1>
          <p className="text-gray-500 text-sm mt-1">{sheets.length} Referenzen gespeichert</p>
        </div>
        <button 
          onClick={() => setIsImporting(!isImporting)}
          className="bg-indigo-600 text-white px-5 py-2 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition"
        >
          {isImporting ? 'Abbrechen' : '📤 Upload'}
        </button>
      </div>

      {/* UPLOAD PANEL */}
      <AnimatePresence>
        {isImporting && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="border-2 border-dashed border-indigo-200 bg-indigo-50 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                <div className="text-4xl mb-3">📂</div>
                <h3 className="font-bold text-indigo-900 mb-2">HTML oder JSON Datei</h3>
                <p className="text-indigo-600/60 text-sm mb-6">
                    HTML für Layouts, JSON (Array) für automatische Tabellen.
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
                    className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold cursor-pointer shadow-sm hover:shadow-md transition border border-indigo-100"
                >
                    Datei auswählen
                </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GRID */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
            <div className="text-center py-20 text-gray-400">Lade Sheets...</div>
        ) : sheets.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100 text-gray-400">
                Lade dein erstes Cheat Sheet hoch!
            </div>
        ) : (
            sheets.map((s) => (
                <div key={s.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <button 
                        onClick={() => setOpenId(openId === s.id ? null : s.id)}
                        className="w-full flex justify-between items-center p-6 text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${s.format === 'json' ? 'bg-yellow-100 text-yellow-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                {s.format === 'json' ? '{}' : '</>'}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">{s.title}</h3>
                                <p className="text-gray-400 text-xs mt-1 uppercase font-bold tracking-wider">
                                    {s.format} • {new Date(s.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <div 
                                onClick={(e) => deleteSheet(s.id, e)}
                                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-500 transition"
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
                                className="border-t border-gray-100 bg-gray-50/50"
                            >
                                <div className="p-0 overflow-hidden">
                                    {s.format === 'json' ? (
                                        renderJsonTable(s.content)
                                    ) : (
                                        <div className="p-8 prose prose-indigo max-w-none bg-white">
                                            <div dangerouslySetInnerHTML={{ __html: s.content }} />
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