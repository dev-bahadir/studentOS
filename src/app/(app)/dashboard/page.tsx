'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { supabase } from '@/supabaseClient'; 
import { useAuth } from '@/components/providers/AuthProvider';
import QuotePlayer from '@/components/QuotePlayer';
import { useTheme } from '@/components/providers/ThemeProvider';
import { 
  Brain, FileText, Layers, Zap, Lock, Database, 
  ChevronRight, Sparkles, Activity
} from 'lucide-react';

const DISPLAY_IMAGES = [
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop",
];

export default function Dashboard() {
  // WICHTIG: Hier holen wir 'loading' aus der Auth, um nicht zu früh zu urteilen
  const { user, loading: authLoading } = useAuth();
  const { fullName, isInitialLoading: themeLoading } = useTheme();
  
  const [stats, setStats] = useState({ decks: 0, cards: 0, notes: 0 });
  const [xpData, setXpData] = useState({ xp: 0, level: 1, progress: 0, nextLevelXp: 500 });
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);
  const [formulas, setFormulas] = useState<any[]>([]);
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);

  const fetchAllData = useCallback(async (userId: string) => {
    try {
      const [profileRes, decksRes, cardsRes, notesRes, formulasRes] = await Promise.all([
        supabase.from('profiles').select('xp, is_approved').eq('id', userId).single(),
        supabase.from('decks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('flashcards').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('formulas').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5)
      ]);

      if (profileRes.data) {
        const currentXP = profileRes.data.xp || 0;
        const LEVEL_THRESHOLD = 500;
        setIsApproved(profileRes.data.is_approved);
        
        setXpData({ 
          xp: currentXP, 
          level: Math.floor(currentXP / LEVEL_THRESHOLD) + 1, 
          progress: Math.floor(((currentXP % LEVEL_THRESHOLD) / LEVEL_THRESHOLD) * 100),
          nextLevelXp: LEVEL_THRESHOLD
        });
      }

      setStats({
        decks: decksRes.count || 0,
        cards: cardsRes.count || 0,
        notes: notesRes.count || 0
      });

      if (formulasRes.data) setFormulas(formulasRes.data);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchAllData(user.id);
    } else if (!authLoading) {
      // Wenn Auth fertig ist und kein User da -> Datenladen beenden (damit der Redirect greift)
      setDataLoading(false);
    }
  }, [user?.id, authLoading, fetchAllData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % DISPLAY_IMAGES.length);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleBulkImport = async () => {
    if (!user?.id) return;
    try {
      setImporting(true);
      const parsedData = JSON.parse(jsonInput);
      const formulasToInsert = (Array.isArray(parsedData) ? parsedData : [parsedData]).map(f => ({
        name: f.name || "Unbenannte Formel",
        formula: f.formula || f.math || "", 
        context: f.context || f.desc || "Allgemein", 
        source: f.source || "NotebookLM",
        user_id: user.id
      }));

      const { error } = await supabase.from('formulas').insert(formulasToInsert);
      if (error) throw error;

      const totalXpBonus = Math.min(formulasToInsert.length * 2, 50); 
      await supabase.rpc('increment_xp', { x: totalXpBonus, row_id: user.id });

      setJsonInput('');
      await fetchAllData(user.id);
      alert(`Erfolg! ${formulasToInsert.length} Formeln importiert.`);
    } catch (err: any) {
      alert("Fehler: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  // 1. SYSTEM-SYNC: Warte auf Auth & Theme
  if (authLoading || themeLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full"
        />
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
          Neural Link Syncing...
        </p>
      </div>
    );
  }

  // 2. REDIRECT: Wenn System fertig, aber kein User da
  if (!user) {
    if (typeof window !== 'undefined') {
       // Hier leiten wir hart weiter, statt nur einen Link anzuzeigen
       window.location.href = '/login'; 
    }
    return null; 
  }

  // 3. APPROVAL: Warteliste
  if (isApproved === false) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-panel p-10 rounded-[2.5rem] shadow-xl border border-zinc-200 dark:border-zinc-800">
          <Lock className="mx-auto text-cyan-500 mb-6" size={48} />
          <h2 className="text-3xl font-black text-ink mb-4 tracking-tight">Warteliste</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">Dein Account wird gerade manuell freigeschaltet.</p>
        </div>
      </div>
    );
  }

  // 4. DASHBOARD CONTENT
  return (
    <div className="min-h-screen bg-transparent p-4 md:p-10 pb-32 transition-colors duration-500">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER & XP BAR */}
        <header className="mb-10 bg-panel p-8 rounded-[2.5rem] shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-black text-ink tracking-tight leading-none">
                Willkommen, <span className="text-cyan-500">{fullName || user?.email?.split('@')[0]}</span>!
              </h1>
              <div className="flex items-center gap-3 mt-3">
                 <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                   Level {xpData.level}
                 </span>
                 <span className="text-zinc-400 text-xs font-bold uppercase tracking-tighter">{xpData.xp} XP Gesamt</span>
              </div>
            </div>
            
            <div className="w-full md:w-64 space-y-2">
              <div className="flex justify-between text-[10px] font-black text-zinc-400 uppercase tracking-tighter">
                <span>Next Level</span>
                <span>{xpData.xp % xpData.nextLevelXp} / {xpData.nextLevelXp} XP</span>
              </div>
              <div className="w-full bg-canvas rounded-full h-2.5 overflow-hidden shadow-inner border border-zinc-200/50 dark:border-zinc-700/50">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${xpData.progress}%` }}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                />
              </div>
            </div>
          </div>
        </header>

        {/* HERO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-panel rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm flex flex-col justify-center min-h-[250px]">
            <QuotePlayer />
          </div>
          
          <div className="bg-zinc-950 rounded-[2.5rem] relative overflow-hidden group shadow-2xl h-[300px] md:h-auto border border-zinc-800">
            <AnimatePresence mode='wait'>
              <motion.div
                key={currentImg}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 0.4, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0"
              >
                <Image 
                  src={DISPLAY_IMAGES[currentImg]} 
                  alt="Visual Focus" 
                  fill
                  className="object-cover"
                  priority
                />
              </motion.div>
            </AnimatePresence>
            
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent p-10 flex flex-col justify-end">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
                  <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping opacity-75" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">System Live</span>
              </div>
              <h2 className="text-white text-3xl font-black tracking-tighter">ElectroBrain <span className="text-zinc-500">v1.0</span></h2>
            </div>
          </div>
        </div>

        {/* STATS TILES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Lern-Decks', val: stats.decks, icon: Layers, href: '/flashcards' },
            { label: 'Karten', val: stats.cards, icon: Brain, href: '/flashcards' },
            { label: 'Notizen', val: stats.notes, icon: FileText, href: '/notes' }
          ].map((item) => (
            <Link key={item.label} href={item.href} className="group">
              <div className="bg-panel p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 hover:border-cyan-500/40 transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="flex justify-between items-start mb-6 text-zinc-400 group-hover:text-cyan-500 transition-colors">
                  <item.icon size={22} />
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 font-black text-[10px] uppercase tracking-widest mb-1">{item.label}</p>
                <h2 className="text-5xl font-black text-ink tracking-tighter">{item.val}</h2>
              </div>
            </Link>
          ))}
        </div>

        {/* WISSENS-TRESOR */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-ink tracking-tight flex items-center gap-3">
              <Database className="text-cyan-500" size={24} /> Wissens-Tresor
            </h2>
            <Link href="/formulas" className="text-[10px] text-cyan-500 font-black uppercase tracking-[0.2em] hover:underline flex items-center gap-1">
              Explorer <ChevronRight size={12} />
            </Link>
          </div>
          <Link href="/formulas">
            <div className="bg-gradient-to-br from-cyan-500/5 to-blue-600/5 p-8 rounded-[2.5rem] border border-cyan-500/20 flex items-center justify-between group active:scale-[0.99] transition-all">
              <div className="flex items-center gap-6">
                <div className="bg-panel p-4 rounded-2xl text-3xl shadow-sm group-hover:rotate-6 transition-transform border border-zinc-100 dark:border-zinc-800">⚛️</div>
                <div>
                  <p className="text-ink font-black text-lg">Formeln & Wissen</p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                    {formulas.length > 0 ? `${formulas.length} Einträge verfügbar` : 'Keine Einträge vorhanden'}
                  </p>
                </div>
              </div>
              <div className="bg-zinc-900 dark:bg-panel text-white dark:text-ink p-4 rounded-2xl group-hover:translate-x-2 transition-all border border-zinc-800 dark:border-zinc-700">
                <ChevronRight size={24} />
              </div>
            </div>
          </Link>
        </section>

        {/* BULK IMPORT */}
        <section className="p-10 bg-canvas rounded-[3rem] border border-dashed border-zinc-300 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-8">
             <Zap className="text-amber-500" size={24} />
             <h2 className="text-xl font-black text-ink tracking-tight uppercase tracking-widest text-xs">NotebookLM Bulk-Import</h2>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='Füge dein NotebookLM-JSON hier ein...'
            className="w-full h-44 p-6 bg-panel border border-zinc-200 dark:border-zinc-800 rounded-[2rem] text-sm font-mono text-ink outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-zinc-400 shadow-inner"
          />
          <button
            onClick={handleBulkImport}
            disabled={importing || !jsonInput}
            className="mt-8 w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-6 rounded-2xl font-black text-lg transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3 shadow-2xl hover:bg-black dark:hover:bg-zinc-100"
          >
            {importing ? 'Synchronisiere...' : <><Zap size={22} fill="currentColor" /> Daten einspeisen & XP sammeln</>}
          </button>
        </section>
      </div>
    </div>
  );
}