'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import { 
  Brain, FileText, Layers, Zap, Activity, Flame,
  CheckCircle, Target, BarChart3, Quote, 
  Plus, Trash2, Image as ImageIcon, Save, ChevronRight, ChevronLeft, Sparkles, Calendar,
  PlayCircle, Sun, Moon, Coffee // Coffee Import hinzugefügt
} from 'lucide-react';

// ------------------------------------------------------------------
// KONFIGURATION & KONSTANTEN
// ------------------------------------------------------------------

const LEVEL_THRESHOLD = 500; // Benötigte XP pro Level

const DAILY_QUESTS = [
  { id: 'study', label: '📚 5 Karten lernen', target: 5, current: 0, xp: 10, icon: Brain },
  { id: 'read', label: '📖 1 Notiz lesen', target: 1, current: 0, xp: 5, icon: FileText },
  { id: 'focus', label: '🔥 25 Min Fokus', target: 25, current: 0, xp: 15, icon: Flame },
  { id: 'learn', label: '⭐ 3 Formeln lernen', target: 3, current: 0, xp: 8, icon: Sparkles },
];

const LEARNING_TIPS = [
  { emoji: '🧠', text: 'Dein Gehirn merkt sich 80% mehr, wenn du handschriftlich notierst.' },
  { emoji: '⚡', text: 'Die erste Minute ist entscheidend - starte mit deinen schwächsten Decks.' },
  { emoji: '🎯', text: '5-Minuten Sessions sind besser als keine. Qualität > Quantität.' },
  { emoji: '🔥', text: 'Nach 25min solltest du 5min pausieren (Pomodoro-Technik).' },
  { emoji: '💡', text: 'Spaced Repetition ist am effektivsten, wenn du 24h zwischen Sessions wartest.' },
];

const glassClass = "bg-white/5 dark:bg-zinc-900/20 backdrop-blur-xl border border-white/10 dark:border-zinc-800/50 shadow-xl";

type UserQuote = {
  id: string;
  text: string;
  title: string; 
};

type Exam = {
  id: string;
  title: string;
  date: string;
  type: string;
};

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------
const calculateLevelStats = (totalXP: number) => {
  const level = Math.floor(totalXP / LEVEL_THRESHOLD) + 1;
  const currentLevelXP = totalXP % LEVEL_THRESHOLD;
  const progress = Math.floor((currentLevelXP / LEVEL_THRESHOLD) * 100);
  return { level, currentLevelXP, progress, totalXP };
};

const getDaysLeft = (targetDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ------------------------------------------------------------------
// HAUPTKOMPONENTE
// ------------------------------------------------------------------

export default function SuperDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { fullName, isInitialLoading: themeLoading } = useTheme();
  
  // --- STATE ---
  const [stats, setStats] = useState({ decks: 0, cards: 0, notes: 0 });
  const [xpData, setXpData] = useState({ xp: 0, level: 1, progress: 0, currentLevelXP: 0 });
  const [analytics, setAnalytics] = useState({
    cardStates: { new: 0, learning: 0, review: 0, mastered: 0 }
  });
  
  const [quests, setQuests] = useState(DAILY_QUESTS);
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [nextExam, setNextExam] = useState<Exam | null>(null);
  const [activePlan, setActivePlan] = useState<any>(null);

  // Widget States
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [myQuotes, setMyQuotes] = useState<UserQuote[]>([
    { id: '1', text: 'Der beste Weg, die Zukunft vorherzusagen, ist, sie zu erschaffen.', title: 'Motivation' }
  ]);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [tempQuoteText, setTempQuoteText] = useState('');
  const [tempQuoteTitle, setTempQuoteTitle] = useState('');
  const [dashboardImage, setDashboardImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ------------------------------------------------------------------
  // DATEN LADEN
  // ------------------------------------------------------------------
  const fetchAllData = useCallback(async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [profileRes, decksRes, notesRes, flashcardsRes, nextExamRes, planRes] = await Promise.all([
        supabase.from('profiles').select('xp').eq('id', userId).single(),
        supabase.from('decks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('flashcards').select('state').eq('user_id', userId),
        supabase.from('exams').select('*').eq('user_id', userId).gte('date', today).order('date', { ascending: true }).limit(1).maybeSingle(),
        supabase.from('daily_plans').select('*').eq('user_id', userId).eq('date', today).maybeSingle()
      ]);

      if (profileRes.data) {
        const calculated = calculateLevelStats(profileRes.data.xp || 0);
        setXpData({
            xp: calculated.totalXP,
            level: calculated.level,
            progress: calculated.progress,
            currentLevelXP: calculated.currentLevelXP
        });
      }

      const allCards = flashcardsRes.data || [];
      setAnalytics({
        cardStates: {
          new: allCards.filter(c => c.state === 0 || c.state === null).length,
          learning: allCards.filter(c => c.state === 1).length,
          review: allCards.filter(c => c.state === 2).length,
          mastered: allCards.filter(c => c.state === 3).length, 
        }
      });

      setStats({
        decks: decksRes.count || 0,
        cards: allCards.length,
        notes: notesRes.count || 0
      });

      if (nextExamRes.data) setNextExam(nextExamRes.data);
      if (planRes.data) setActivePlan(planRes.data);

    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    }
  }, []);

  useEffect(() => {
    if (user?.id) fetchAllData(user.id);
  }, [user?.id, fetchAllData]);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % LEARNING_TIPS.length);
    }, 10000); 
    return () => clearInterval(tipInterval);
  }, []);

  useEffect(() => {
    const savedImg = localStorage.getItem('electro_dashboard_img');
    if (savedImg) setDashboardImage(savedImg);
    
    const savedQuotes = localStorage.getItem('electro_user_quotes');
    if (savedQuotes) {
        const parsed = JSON.parse(savedQuotes);
        if (parsed.length > 0) setMyQuotes(parsed);
    }
  }, []);

  const toggleQuestCompletion = async (questId: string) => {
    if (!user) return;
    const questIndex = quests.findIndex(q => q.id === questId);
    if (questIndex === -1) return;
    const quest = quests[questIndex];
    const wasComplete = quest.current >= quest.target;
    const newCurrent = wasComplete ? 0 : quest.target;

    const newQuests = [...quests];
    newQuests[questIndex] = { ...quest, current: newCurrent };
    setQuests(newQuests);

    if (!wasComplete) {
        await supabase.rpc('increment_xp', { x: quest.xp, row_id: user.id });
        const newTotalXP = xpData.xp + quest.xp;
        const calculated = calculateLevelStats(newTotalXP);
        setXpData({
            xp: calculated.totalXP,
            level: calculated.level,
            progress: calculated.progress,
            currentLevelXP: calculated.currentLevelXP
        });
    }
  };

  const handleAddQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newQuote = { id: Date.now().toString(), text: 'Neues Zitat hier...', title: 'Quelle / Titel' };
    const updated = [...myQuotes, newQuote];
    setMyQuotes(updated);
    setCurrentQuoteIndex(updated.length - 1);
    setIsEditingQuote(true);
    setTempQuoteText(newQuote.text);
    setTempQuoteTitle(newQuote.title);
    localStorage.setItem('electro_user_quotes', JSON.stringify(updated));
  };

  const handleDeleteQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (myQuotes.length <= 1) return alert("Ein Zitat muss mindestens bleiben!");
    const updated = myQuotes.filter((_, i) => i !== currentQuoteIndex);
    setMyQuotes(updated);
    setCurrentQuoteIndex(0);
    localStorage.setItem('electro_user_quotes', JSON.stringify(updated));
  };

  const startEditing = () => {
    setTempQuoteText(myQuotes[currentQuoteIndex].text);
    setTempQuoteTitle(myQuotes[currentQuoteIndex].title);
    setIsEditingQuote(true);
  };

  const saveEditedQuote = () => {
    const updated = [...myQuotes];
    updated[currentQuoteIndex] = { ...updated[currentQuoteIndex], text: tempQuoteText, title: tempQuoteTitle };
    setMyQuotes(updated);
    localStorage.setItem('electro_user_quotes', JSON.stringify(updated));
    setIsEditingQuote(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = reader.result as string;
        setDashboardImage(b64);
        localStorage.setItem('electro_dashboard_img', b64);
      };
      reader.readAsDataURL(file);
    }
  };

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

      const xpGain = Math.min(formulasToInsert.length * 2, 50);
      await supabase.rpc('increment_xp', { x: xpGain, row_id: user.id });
      
      const newTotalXP = xpData.xp + xpGain;
      const calculated = calculateLevelStats(newTotalXP);
      setXpData({
          xp: calculated.totalXP,
          level: calculated.level,
          progress: calculated.progress,
          currentLevelXP: calculated.currentLevelXP
      });

      setJsonInput('');
      await fetchAllData(user.id);
      alert(`✅ ${formulasToInsert.length} Datensätze importiert!`);
    } catch (err: any) {
      alert("❌ Fehler: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  if (authLoading || themeLoading) return null;

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6 md:p-10 lg:p-12 min-h-screen pb-40 bg-transparent text-zinc-900 dark:text-zinc-100 overflow-x-hidden">
      
      {/* 1. HEADER AREA */}
      <header className={`mb-10 p-8 rounded-[3rem] ${glassClass}`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="w-full">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none text-zinc-900 dark:text-white">
              Assalamu Alaikum, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{fullName || user?.email?.split('@')[0]}</span>
            </h1>
            <div className="flex items-center gap-4 pt-4">
               <span className="bg-cyan-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-cyan-500/20">
                 Level {xpData.level}
               </span>
               <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-tight">
                 <Activity size={14} className="text-cyan-500" />
                 {xpData.xp} Neural XP
               </div>
            </div>
          </div>
          
          <div className="w-full md:w-96 space-y-4">
            <div className="flex justify-between text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              <span>Synchronisations-Fortschritt</span>
              <span className="text-cyan-500">{xpData.currentLevelXP} / {LEVEL_THRESHOLD} XP</span>
            </div>
            <div className="w-full bg-black/10 dark:bg-white/5 rounded-full h-4 overflow-hidden border border-white/5 shadow-inner p-1">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${xpData.progress}%` }}
                className="bg-gradient-to-r from-cyan-400 to-blue-600 h-full rounded-full shadow-[0_0_20px_rgba(34,211,238,0.5)]" 
              />
            </div>
          </div>
        </div>
      </header>

      {/* 2. DAY COMMANDER HUD */}
      <section className="mb-12">
        <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-cyan-500">
                <Zap size={24} fill="currentColor" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Day Commander</h2>
        </div>

        <Link href="/planner">
            <motion.div 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`p-8 rounded-[3rem] ${glassClass} border-l-8 ${activePlan ? 'border-cyan-500' : 'border-zinc-500'} flex flex-col md:flex-row justify-between items-center gap-8 group cursor-pointer`}
            >
                <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center ${activePlan ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-zinc-800 text-zinc-500'}`}>
                        {activePlan?.current_block === 'morning' ? <Sun size={40} /> : activePlan?.current_block === 'afternoon' ? <Moon size={40} /> : activePlan?.current_block === 'break' ? <Coffee size={40} /> : <PlayCircle size={40} />}
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{activePlan ? `Mission: ${activePlan.current_block.toUpperCase()}` : 'Keine Mission aktiv'}</h3>
                        <p className="text-zinc-500 font-medium">{activePlan ? 'System synchronisiert. Gehe zum Planner für Details.' : 'Bereit für den taktischen Tagesplan?'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {activePlan ? (
                        <div className="px-6 py-3 bg-cyan-500/10 text-cyan-500 rounded-2xl font-black uppercase tracking-widest text-xs border border-cyan-500/20">
                            Status: Online
                        </div>
                    ) : (
                        <div className="px-6 py-3 bg-zinc-500/10 text-zinc-500 rounded-2xl font-black uppercase tracking-widest text-xs">
                            Status: Standby
                        </div>
                    )}
                    <div className="p-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl group-hover:translate-x-2 transition-transform">
                        <ChevronRight size={24} />
                    </div>
                </div>
            </motion.div>
        </Link>
      </section>

      {/* 3. TAGES MISSIONEN */}
      <section className="mb-12">
        <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <Target className="text-amber-500" size={24} />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Tages-Missionen</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quests.map((quest) => {
            const isComplete = quest.current >= quest.target;
            return (
              <motion.button
                key={quest.id}
                onClick={() => toggleQuestCompletion(quest.id)}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
                className={`relative p-6 rounded-[2.5rem] border-2 transition-all text-left group ${
                  isComplete
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : `${glassClass} border-transparent hover:border-amber-500/30`
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl ${isComplete ? 'bg-emerald-500 text-white' : 'bg-white/5 text-amber-500'}`}>
                    <quest.icon size={24} />
                  </div>
                  {isComplete && (
                    <div className="bg-emerald-500 rounded-full p-1 shadow-lg shadow-emerald-500/40">
                      <CheckCircle size={16} className="text-white" />
                    </div>
                  )}
                </div>
                <h4 className="font-black text-lg mb-1 text-zinc-900 dark:text-zinc-100">{quest.label}</h4>
                <div className="flex justify-between items-end mb-4">
                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">{quest.current} / {quest.target}</span>
                    <span className={`text-[10px] font-black uppercase ${isComplete ? 'text-emerald-500' : 'text-amber-500'}`}>+{quest.xp} XP</span>
                </div>
                <div className="w-full h-1.5 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(quest.current / quest.target) * 100}%` }}
                        className={`h-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    />
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* 4. CORE STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {[
          { label: 'Neural Decks', val: stats.decks, icon: Layers, href: '/learn', color: 'from-blue-500 to-cyan-400' },
          { label: 'Total Cards', val: stats.cards, icon: Brain, href: '/learn', color: 'from-purple-500 to-pink-400' },
          { label: 'Knowledge Base', val: stats.notes, icon: FileText, href: '/notes', color: 'from-emerald-500 to-teal-400' }
        ].map((item) => (
          <Link key={item.label} href={item.href} className="group">
            <motion.div 
              whileHover={{ y: -8 }}
              className={`p-10 rounded-[3rem] transition-all relative overflow-hidden ${glassClass}`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-[0.03] rounded-full -mr-16 -mt-16 blur-2xl group-hover:opacity-10 transition-opacity`} />
              <div className="flex justify-between items-start mb-8">
                <div className={`p-4 rounded-[1.5rem] bg-gradient-to-br ${item.color} text-white shadow-xl`}>
                  <item.icon size={28} />
                </div>
                <ChevronRight size={24} className="text-zinc-300 dark:text-zinc-600 group-hover:translate-x-2 group-hover:text-cyan-500 transition-all" />
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 font-black text-xs uppercase tracking-widest mb-2">{item.label}</p>
              <h2 className="text-6xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100">{item.val}</h2>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* 5. ANALYTICS & RADAR HUB */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        
        {/* FSRS Distribution */}
        <div className={`p-10 rounded-[3rem] ${glassClass}`}>
          <h3 className="text-2xl font-black mb-10 flex items-center gap-4 text-zinc-900 dark:text-zinc-100">
            <BarChart3 className="text-cyan-500" /> Neural Distribution
          </h3>
          <div className="grid grid-cols-2 gap-8">
            {[
                { label: 'Neu', val: analytics.cardStates.new, color: 'bg-green-500', icon: '📌' }, 
                { label: 'Lernen', val: analytics.cardStates.learning, color: 'bg-blue-500', icon: '📚' }, 
                { label: 'Review', val: analytics.cardStates.review, color: 'bg-cyan-500', icon: '⭐' }, 
                { label: 'Meister', val: analytics.cardStates.mastered, color: 'bg-amber-500', icon: '👑' }
            ].map((state) => {
              const percent = stats.cards > 0 ? (state.val / stats.cards) * 100 : 0;
              const displayWidth = state.val > 0 ? Math.max(percent, 2) : 0;
              return (
                <div key={state.label} className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <span className="text-xs font-black uppercase text-zinc-500">{state.icon} {state.label}</span>
                    <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">{state.val}</span>
                  </div>
                  <div className="w-full h-2.5 bg-black/10 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }} 
                        whileInView={{ width: `${displayWidth}%` }} 
                        transition={{ duration: 1, type: "spring" }}
                        className={`${state.color} h-full rounded-full shadow-lg`} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* NEXT EXAM */}
        <div className={`p-10 rounded-[3rem] ${glassClass} flex flex-col justify-between border-2 border-transparent ${nextExam ? 'border-red-500/20' : ''}`}>
          <h3 className="text-2xl font-black mb-6 flex items-center gap-4 text-zinc-900 dark:text-zinc-100">
            <Target className="text-red-500" /> Next Up
          </h3>
          {nextExam ? (
             <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
                <div className="w-24 h-24 bg-red-500 text-white rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.4)] animate-pulse">
                   <Calendar size={40} />
                </div>
                <div>
                   <h4 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">{nextExam.title}</h4>
                   <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
                      {new Date(nextExam.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}
                   </p>
                </div>
                <div className="w-full bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                   <p className="text-red-500 font-black text-xl">
                      {getDaysLeft(nextExam.date)} Tage verbleibend
                   </p>
                </div>
             </div>
          ) : (
             <div className="flex-1 flex flex-col justify-center items-center text-center opacity-50">
                <Target size={48} className="text-zinc-500 mb-4" />
                <p className="font-bold text-zinc-500">Keine Prüfungen in Sicht.</p>
                <Link href="/radar" className="text-xs font-black uppercase tracking-widest text-cyan-500 mt-2 hover:underline">Termin hinzufügen</Link>
             </div>
          )}
        </div>
      </div>

      {/* 6. WIDGET GRID */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
        
        {/* PLAYER 1: QUOTES */}
        <div className={`relative p-8 rounded-[3rem] flex flex-col justify-between ${glassClass} min-h-[420px] group`}>
           <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <button onClick={handleDeleteQuote} className="p-2 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
              <button onClick={handleAddQuote} className="p-2 bg-cyan-500/20 text-cyan-500 rounded-xl hover:bg-cyan-500 hover:text-white transition-all"><Plus size={16} /></button>
           </div>
           <div className="flex-1 flex flex-col justify-center">
              <Quote className="text-cyan-500/30 mb-6" size={32} />
              <AnimatePresence mode='wait'>
                 {isEditingQuote ? (
                    <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full space-y-4">
                       <textarea autoFocus value={tempQuoteText} onChange={(e) => setTempQuoteText(e.target.value)} className="w-full h-32 bg-black/10 dark:bg-white/5 rounded-2xl p-4 resize-none outline-none font-medium text-zinc-100" placeholder="Zitat..." />
                       <input value={tempQuoteTitle} onChange={(e) => setTempQuoteTitle(e.target.value)} className="w-full bg-black/10 dark:bg-white/5 rounded-xl p-3 outline-none font-bold text-sm text-zinc-100" placeholder="Titel/Quelle" />
                       <button onClick={saveEditedQuote} className="w-full py-3 bg-cyan-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"><Save size={16} /> Speichern</button>
                    </motion.div>
                 ) : (
                    <motion.div key={currentQuoteIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onClick={startEditing} className="cursor-pointer hover:opacity-80 transition-opacity">
                       <p className="text-2xl font-black leading-tight mb-8 text-zinc-900 dark:text-zinc-100">"{myQuotes[currentQuoteIndex].text}"</p>
                       <div className="flex items-center gap-3"><div className="h-1 w-8 bg-cyan-500 rounded-full" /><p className="text-xs font-black uppercase tracking-widest text-zinc-500">{myQuotes[currentQuoteIndex].title}</p></div>
                    </motion.div>
                 )}
              </AnimatePresence>
           </div>
           {!isEditingQuote && (
             <div className="flex justify-between items-center mt-8">
                <button onClick={() => setCurrentQuoteIndex(p => (p-1+myQuotes.length)%myQuotes.length)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={20} className="text-zinc-500" /></button>
                <div className="flex gap-1">{myQuotes.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentQuoteIndex ? 'w-6 bg-cyan-500' : 'w-1.5 bg-zinc-700'}`} />)}</div>
                <button onClick={() => setCurrentQuoteIndex(p => (p+1)%myQuotes.length)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronRight size={20} className="text-zinc-500" /></button>
             </div>
           )}
        </div>

        {/* PLAYER 2: NEURO TIPPS */}
        <div className={`relative p-8 rounded-[3rem] flex flex-col justify-center items-center text-center ${glassClass} border-purple-500/20 overflow-hidden min-h-[420px]`}>
           <AnimatePresence mode='wait'>
              <motion.div key={currentTipIndex} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="relative z-10 flex flex-col items-center">
                 <div className="text-7xl mb-6 filter drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">{LEARNING_TIPS[currentTipIndex].emoji}</div>
                 <p className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] mb-4">Neuro-Hack #{currentTipIndex + 1}</p>
                 <p className="text-xl font-bold leading-relaxed px-4 text-zinc-900 dark:text-zinc-100">{LEARNING_TIPS[currentTipIndex].text}</p>
              </motion.div>
           </AnimatePresence>
           <div className="absolute bottom-8 w-full flex justify-center gap-1 left-0">{LEARNING_TIPS.map((_, i) => <div key={i} className={`h-1 rounded-full transition-all ${i === currentTipIndex ? 'w-4 bg-purple-500' : 'w-1 bg-zinc-700'}`} />)}</div>
        </div>

        {/* PLAYER 3: IMAGE WIDGET */}
        <div className={`relative rounded-[3rem] overflow-hidden group ${glassClass} min-h-[420px] flex items-center justify-center`}>
           {dashboardImage ? (
              <>
                 <img src={dashboardImage} alt="Dashboard Widget" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                    <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-white text-black rounded-xl font-bold flex items-center gap-2 transition-transform"><ImageIcon size={18} /> Ändern</button>
                    <button onClick={() => { setDashboardImage(null); localStorage.removeItem('electro_dashboard_img'); }} className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold flex items-center gap-2"><Trash2 size={18} /> Entfernen</button>
                 </div>
              </>
           ) : (
              <div onClick={() => fileInputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors p-8 text-center">
                 <div className="w-20 h-20 rounded-[2rem] border-2 border-dashed border-zinc-600 flex items-center justify-center mb-6 text-zinc-600"><ImageIcon size={32} /></div>
                 <h4 className="font-black text-xl mb-2 text-zinc-900 dark:text-zinc-100">Image Widget</h4>
                 <p className="text-zinc-500 text-sm font-medium">PNG/JPEG hier hochladen</p>
              </div>
           )}
           <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleImageUpload} />
        </div>
      </section>

      {/* 7. SYNC AREA */}
      <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} className={`p-10 rounded-[4rem] border-4 border-dashed border-zinc-200 dark:border-zinc-800/50 ${glassClass}`}>
        <div className="flex items-center gap-5 mb-10">
             <div className="p-4 bg-amber-500 rounded-[1.5rem] text-white shadow-xl shadow-amber-500/20"><Zap size={32} fill="currentColor" /></div>
             <div><h2 className="text-3xl font-black tracking-tighter uppercase leading-none text-zinc-900 dark:text-zinc-100">Neural Link Sync</h2><p className="text-zinc-500 font-medium mt-1">Importiere NotebookLM Daten für XP-Wachstum</p></div>
        </div>
        <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder='JSON-Stream hier einfügen...' className="w-full h-64 p-8 bg-black/10 dark:bg-black/20 border-2 border-white/5 rounded-[2.5rem] text-sm font-mono text-cyan-400 outline-none focus:ring-4 focus:ring-cyan-500/20 transition-all placeholder:text-zinc-600 resize-none" />
        <button onClick={handleBulkImport} disabled={importing || !jsonInput} className="mt-10 w-full bg-white dark:bg-cyan-500 text-black dark:text-white py-8 rounded-[2rem] font-black text-xl transition-all disabled:opacity-30 active:scale-[0.98] shadow-2xl hover:shadow-cyan-500/20 flex items-center justify-center gap-4">{importing ? "Lädt..." : "Neural Sync Initialisieren"}</button>
      </motion.section>

    </div>
  );
}