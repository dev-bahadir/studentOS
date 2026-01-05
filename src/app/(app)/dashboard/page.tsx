'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// 👇 Importe
import { supabase } from '../../../supabaseClient'; 
import { useAuth } from '../../../components/providers/AuthProvider';
import QuotePlayer from '../../../components/QuotePlayer';
import { useTheme } from '../../../components/providers/ThemeProvider';
import { Sidebar } from '@/components/Navigation'; // Falls nötig, aber Sidebar ist im Layout

export default function Dashboard() {
  const { user } = useAuth();
  const { fullName } = useTheme();
  
  const [stats, setStats] = useState({ decks: 0, cards: 0, notes: 0 });
  const [xpData, setXpData] = useState({ xp: 0, level: 1, progress: 0, nextLevelXp: 500 }); // 👈 NEU: nextLevelXp
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Formel States
  const [formulas, setFormulas] = useState<any[]>([]);
  const [favPreview, setFavPreview] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);

  // --- UNZERSTÖRBARER IMPORT ---
  const handleBulkImport = async () => {
    try {
      setImporting(true);
      const parsedData = JSON.parse(jsonInput);
      const formulasToInsert = Array.isArray(parsedData) ? parsedData : [parsedData];

      const finalData = formulasToInsert.map(f => ({
        name: f.name || "Unbenannte Formel",
        formula: f.formula || f.math || "", 
        context: f.context || f.desc || (f.category ? `${f.category}: Keine Beschreibung` : "Allgemein: Keine Beschreibung"), 
        source: f.source || "NotebookLM",
        is_favorite: false,
        user_id: user?.id
      }));

      const { error } = await supabase.from('formulas').insert(finalData);
      if (error) throw error;

      // --- BALANCING UPDATE ---
      // Vorher: 10 XP pro Formel (Viel zu viel!)
      // Neu: 2 XP pro Formel, aber MAXIMAL 50 XP pro Import-Vorgang (Spamschutz)
      const xpPerItem = 2;
      const calculatedXp = finalData.length * xpPerItem;
      const totalXpBonus = Math.min(calculatedXp, 50); 

      await supabase.rpc('increment_xp', { x: totalXpBonus, row_id: user?.id });

      alert(`Erfolg! ${finalData.length} Formeln geladen & +${totalXpBonus} XP!`);
      setJsonInput('');
      fetchFormulas();
      checkApprovalAndFetchData(); 
    } catch (err: any) {
      alert("Fehler: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkApprovalAndFetchData();
    }
  }, [user]);

  const checkApprovalAndFetchData = async () => {
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('xp, is_approved').eq('id', user.id).single();
    if (profile) {
      setIsApproved(profile.is_approved);
      if (profile.is_approved) {
        const currentXP = profile.xp || 0;
        
        // --- BALANCING UPDATE ---
        // Level-System: Alle 500 XP ein Level (statt 100)
        const LEVEL_THRESHOLD = 500;
        const level = Math.floor(currentXP / LEVEL_THRESHOLD) + 1;
        const progressXP = currentXP % LEVEL_THRESHOLD;
        const progressPercent = (progressXP / LEVEL_THRESHOLD) * 100;

        setXpData({ 
          xp: currentXP, 
          level: level, 
          progress: Math.floor(progressPercent),
          nextLevelXp: LEVEL_THRESHOLD
        });
        
        fetchStats();
        fetchFormulas();
      }
    } else {
      setIsApproved(false);
    }
    setLoading(false);
  };

  const fetchFormulas = async () => {
    const { data } = await supabase
      .from('formulas')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setFormulas(data);
      const firstFav = data.find(f => f.is_favorite);
      setFavPreview(firstFav ? firstFav.name : null);
    }
  };

  const fetchStats = async () => {
    if (!user) return;
    const { count: d } = await supabase.from('decks').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    const { count: c } = await supabase.from('flashcards').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    const { count: n } = await supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    setStats({ decks: d || 0, cards: c || 0, notes: n || 0 });
  };

  if (loading) return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
    </div>
  );

  if (isApproved === false) return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-panel p-10 rounded-3xl shadow-2xl border border-gray-100/10">
        <h2 className="text-3xl font-bold text-ink mb-4">Warteliste ⏳</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">Dein Account wird gerade manuell freigeschaltet.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas p-4 md:p-8 transition-colors duration-500 pb-32">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-8 bg-panel p-6 rounded-2xl shadow-sm border border-gray-100/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-ink">
                Hallo, <span className="text-primary">{fullName || user?.email?.split('@')[0]}</span>!
              </h1>
              <p className="text-gray-500 mt-1 text-sm">Level {xpData.level} • {xpData.xp} XP Gesamt</p>
            </div>
            <div className="text-left md:text-right w-full md:w-auto">
              {/* Anzeige angepasst für 500er Schritte */}
              <span className="text-sm font-bold text-primary">
                 {xpData.xp % xpData.nextLevelXp} / {xpData.nextLevelXp} XP zum Aufstieg
              </span>
              <div className="w-full md:w-48 bg-gray-200/50 rounded-full h-2 mt-1">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-1000" 
                  style={{ width: `${xpData.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </header>

        {/* SPLIT GRID FÜR QUOTE & BILD-PLAYER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-panel rounded-2xl border border-gray-100/10 overflow-hidden">
            <QuotePlayer />
          </div>
          
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-600/10 rounded-2xl border border-primary/20 p-6 flex items-center justify-center text-center">
            <div>
               <span className="text-4xl mb-2 block">🖼️</span>
               <p className="text-gray-500 text-sm font-bold">Bild-Player</p>
               <p className="text-xs text-gray-600 dark:text-gray-400">Kommt bald...</p>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Link href="/flashcards">
            <div className="bg-panel p-6 rounded-2xl border border-gray-100/10 hover:shadow-lg transition cursor-pointer">
              <p className="text-gray-500 font-medium">Lern-Decks</p>
              <h2 className="text-4xl font-bold text-ink">{stats.decks}</h2>
            </div>
          </Link>
          <Link href="/flashcards">
            <div className="bg-panel p-6 rounded-2xl border border-gray-100/10 hover:shadow-lg transition cursor-pointer">
              <p className="text-gray-500 font-medium">Karten</p>
              <h2 className="text-4xl font-bold text-ink">{stats.cards}</h2>
            </div>
          </Link>
          <Link href="/notes">
            <div className="bg-panel p-6 rounded-2xl border border-gray-100/10 hover:shadow-lg transition cursor-pointer">
              <p className="text-gray-500 font-medium">Notizen</p>
              <h2 className="text-4xl font-bold text-ink">{stats.notes}</h2>
            </div>
          </Link>
        </div>

        {/* WISSENS-TRESOR TEASER */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-ink">Wissens-Tresor</h2>
            <Link href="/formulas" className="text-sm text-primary font-bold hover:underline">Alle anzeigen →</Link>
          </div>
          <Link href="/formulas">
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 p-6 rounded-3xl border border-primary/20 flex items-center justify-between group active:scale-[0.98] transition-all">
              <div className="flex items-center gap-4">
                <div className="text-3xl">⚛️</div>
                <div>
                  <p className="text-ink font-bold">Formeln & Wissen</p>
                  <p className="text-gray-500 text-xs">
                    {favPreview 
                      ? `⭐ Favorit: ${favPreview}` 
                      : `${formulas.length} Einträge griffbereit`}
                  </p>
                </div>
              </div>
              <div className="bg-primary text-white p-2 rounded-xl group-hover:translate-x-1 transition-transform">
                →
              </div>
            </div>
          </Link>
        </section>

        {/* IMPORT */}
        <section className="mt-12 p-6 bg-panel rounded-3xl border border-dashed border-primary/20">
          <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2"><span>🚀</span> NotebookLM Bulk-Import</h2>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='Kopiere dein JSON hier rein...'
            className="w-full h-32 p-4 bg-canvas border border-gray-100/10 rounded-2xl text-xs font-mono text-ink outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={handleBulkImport}
            disabled={importing || !jsonInput}
            className="mt-4 w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-2xl font-bold transition-all disabled:opacity-50 active:scale-95"
          >
            {importing ? 'Lädt...' : 'Daten einspeisen & XP sammeln'}
          </button>
        </section>
      </div>
    </div>
  );
}