'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Sun, Moon, CheckCircle, Zap, ListTodo,
  Calendar, AlertCircle, Save, PenTool, Plus,
  Search, Mic, Dumbbell, ArrowLeft, XCircle, Brain, Target, Coffee,
  Compass // NEU: Icon für Strategie
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SmartTaskModal } from '@/components/planner/SmartTaskModal';
import { StrategyPrompt } from '@/components/planner/StrategyPrompt'; // NEU: Import

const glassClass = "bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/10 dark:border-white/10 shadow-2xl";

// Typen erweitert für Phase-Logik
type ExamPhase = 'preparation' | 'memorizing' | 'simulation' | 'panic';

type Exam = { 
    id: string; 
    title: string; 
    date: string; 
    phase: ExamPhase; // Verbindung zum Radar
};

type Task = { 
    id: string; 
    title: string; 
    category: string; 
    completed: boolean;
    mode?: 'scout' | 'scribe' | 'teacher' | 'tester' | 'gym';
    energy_req?: number;
    est_duration?: number;
};

type BlockType = 'morning' | 'break' | 'afternoon' | 'done';

// Helper: Icons für Task-Modi
const getModeIcon = (mode?: string) => {
    switch(mode) {
        case 'scout': return <Search size={14} className="text-blue-500"/>;
        case 'scribe': return <PenTool size={14} className="text-yellow-500"/>;
        case 'teacher': return <Mic size={14} className="text-pink-500"/>;
        case 'tester': return <Brain size={14} className="text-red-500"/>;
        case 'gym': return <Dumbbell size={14} className="text-emerald-500"/>;
        default: return <ListTodo size={14} className="text-zinc-500"/>;
    }
};

// Helper: Strategische Tipps basierend auf Phase
const getPhaseAdvice = (phase: ExamPhase) => {
    switch(phase) {
        case 'preparation': return { text: "Fokus: Verstehen & Zusammenfassen (Scout/Scribe)", color: "text-blue-400" };
        case 'memorizing': return { text: "Fokus: Active Recall & Flashcards (Tester)", color: "text-purple-400" };
        case 'simulation': return { text: "Fokus: Alte Klausuren & Tempo (Gym)", color: "text-amber-400" };
        case 'panic': return { text: "Notfall-Modus: Nur Basics lernen (Pareto)", color: "text-red-500 animate-pulse" };
        default: return { text: "Fokus halten", color: "text-zinc-400" };
    }
};

export default function PlannerPage() {
  const { user } = useAuth();
  
  // Data State
  const [exams, setExams] = useState<Exam[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Planning State
  const [selectedMorning, setSelectedMorning] = useState<Exam | null>(null);
  const [selectedAfternoon, setSelectedAfternoon] = useState<Exam | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [brainDump, setBrainDump] = useState('');
  
  // UI State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isStrategyOpen, setIsStrategyOpen] = useState(false); // NEU: State für Strategie-Modal
    const [strategyData, setStrategyData] = useState<any>(null); // HIER EINFÜGEN
  // Active Session State
  const [currentBlock, setCurrentBlock] = useState<BlockType>('morning');
  const [timeLeft, setTimeLeft] = useState(50 * 60);
  const [isActive, setIsActive] = useState(false);
  
  // Auto-Save Ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
        fetchData();
        restoreSession();
    }
  }, [user]);

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      new Audio('/sounds/bell.mp3').play().catch(() => {});
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Auto-Save Brain Dump
  useEffect(() => {
    if (!isStarted) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
        const today = new Date().toISOString().split('T')[0];
        await supabase.from('daily_plans').update({ brain_dump: brainDump }).eq('user_id', user?.id).eq('date', today);
    }, 2000);
  }, [brainDump, isStarted, user]);

  const fetchData = async () => {
    const [examsRes, tasksRes] = await Promise.all([
        supabase.from('exams').select('*').eq('user_id', user?.id),
        supabase.from('tasks')
            .select('*')
            .eq('user_id', user?.id)
            .eq('completed', false)
    ]);
    if (examsRes.data) setExams(examsRes.data);
    if (tasksRes.data) setAllTasks(tasksRes.data);
  };

  const restoreSession = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data: plan } = await supabase.from('daily_plans').select('*').eq('user_id', user?.id).eq('date', today).single();
      
      if (plan) {
          setIsStarted(true);
          setCurrentBlock(plan.current_block as BlockType);
          setBrainDump(plan.brain_dump || '');
          
          const { data: examData } = await supabase.from('exams').select('*').in('id', [plan.morning_exam_id, plan.afternoon_exam_id]);
          if(examData) {
              setSelectedMorning(examData.find(e => e.id === plan.morning_exam_id) || null);
              setSelectedAfternoon(examData.find(e => e.id === plan.afternoon_exam_id) || null);
          }
      }
      setLoading(false);
  };

  const startDay = async () => {
    if (!selectedMorning || !selectedAfternoon || !user) return;
    setIsStarted(true);
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('daily_plans').upsert({
        user_id: user.id,
        date: today,
        morning_exam_id: selectedMorning.id,
        afternoon_exam_id: selectedAfternoon.id,
        current_block: 'morning',
        status: 'active'
    }, { onConflict: 'user_id, date' });

    if (error) console.error(error);
  };

  const resetDay = async () => {
      if(!confirm("Willst du den aktuellen Plan wirklich verwerfen und neu starten?")) return;
      setIsActive(false);
      setIsStarted(false);
      setCurrentBlock('morning');
      setSelectedMorning(null);
      setSelectedAfternoon(null);
      setTimeLeft(50 * 60);
      setBrainDump('');
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('daily_plans').delete().eq('user_id', user?.id).eq('date', today);
  };

  const updateBlockInDB = async (newBlock: BlockType) => {
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('daily_plans').update({ current_block: newBlock }).eq('user_id', user?.id).eq('date', today);
  };

  const toggleTask = async (taskId: string) => {
      setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
      await supabase.from('tasks').update({ completed: true }).eq('id', taskId);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRelevantTasks = () => {
      const activeExam = currentBlock === 'morning' ? selectedMorning : selectedAfternoon;
      if (!activeExam) return [];
      return allTasks.filter(t => 
        t.category?.toLowerCase() === activeExam.title.toLowerCase() || 
        t.title.toLowerCase().includes(activeExam.title.toLowerCase())
      );
  };

  const getDaysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const completeBlock = async () => {
    setIsActive(false);
    let nextBlock: BlockType = 'done';
    let nextTime = 0;

    if (currentBlock === 'morning') {
      nextBlock = 'break';
      nextTime = 30 * 60; 
      confetti({ particleCount: 50, origin: { y: 0.8 } });
    } else if (currentBlock === 'break') {
      nextBlock = 'afternoon';
      nextTime = 50 * 60;
    } else {
      nextBlock = 'done';
      confetti({ particleCount: 150 });
      await supabase.rpc('increment_xp', { x: 100, row_id: user?.id });
    }

    setCurrentBlock(nextBlock);
    setTimeLeft(nextTime);
    await updateBlockInDB(nextBlock);
  };

  const undoCompleteDay = async () => {
      const prevBlock = 'afternoon';
      setCurrentBlock(prevBlock);
      setTimeLeft(0);
      await updateBlockInDB(prevBlock);
  };

  // Handler für das Strategie-Ergebnis
 const handleStrategyComplete = (result: any) => {
    setStrategyData(result); // HIER SPEICHERN
    setIsTaskModalOpen(true);
};

  if (loading) return null;

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6 md:p-12 min-h-screen pb-40 text-zinc-900 dark:text-zinc-100">
      
      {/* HEADER */}
      <header className="mb-12 text-center relative">
         {isStarted && (
             <button 
                onClick={resetDay}
                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-500/10"
             >
                 <XCircle size={18} /> Plan verwerfen
             </button>
         )}

         <h1 className="text-5xl font-black tracking-tighter mb-2 italic">
            Day <span className="text-cyan-500">Commander</span>
         </h1>
         <div className="flex items-center justify-center gap-2 text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px]">
            <Zap size={12} className="text-cyan-500" /> Focus-Execution-Protocol <Zap size={12} className="text-cyan-500" />
         </div>
      </header>

      <AnimatePresence mode="wait">
        
        {/* PHASE 1: STRATEGIC PLANNING */}
        {!isStarted && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-5xl mx-auto">
            <div className={`p-10 md:p-16 rounded-[4rem] ${glassClass} border-cyan-500/10`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    
                    {/* MORNING SELECTION */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-orange-500 font-black uppercase tracking-widest text-xs">
                            <Sun size={20} /> Slot 01: Deep Work (Morgens)
                        </div>
                        <div className="space-y-4">
                            {exams.map(exam => (
                                <button 
                                    key={exam.id}
                                    onClick={() => setSelectedMorning(exam)}
                                    className={`w-full p-6 rounded-3xl text-left transition-all border-2 group relative overflow-hidden ${selectedMorning?.id === exam.id ? 'border-orange-500 bg-orange-500/5' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                                >
                                    <div className="relative z-10">
                                        <div className="font-black text-xl">{exam.title}</div>
                                        <div className="flex justify-between items-center mt-1">
                                            <div className="text-xs font-bold text-zinc-500 flex items-center gap-2">
                                                <Calendar size={12} /> noch {getDaysUntil(exam.date)} Tage
                                            </div>
                                            {/* Phase Badge */}
                                            {exam.phase && (
                                                <div className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-white/5 text-zinc-400`}>
                                                    {exam.phase}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AFTERNOON SELECTION */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-blue-500 font-black uppercase tracking-widest text-xs">
                            <Moon size={20} /> Slot 02: Shallow Work (Nachmittags)
                        </div>
                        <div className="space-y-4">
                            {exams.map(exam => (
                                <button 
                                    key={exam.id}
                                    onClick={() => setSelectedAfternoon(exam)}
                                    className={`w-full p-6 rounded-3xl text-left transition-all border-2 ${selectedAfternoon?.id === exam.id ? 'border-blue-500 bg-blue-500/5' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                                >
                                    <div className="font-black text-xl">{exam.title}</div>
                                    <div className="text-xs font-bold text-zinc-500 mt-1 flex items-center gap-2">
                                        <Calendar size={12} /> noch {getDaysUntil(exam.date)} Tage
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button 
                    onClick={startDay}
                    disabled={!selectedMorning || !selectedAfternoon}
                    className="mt-16 w-full py-6 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-3xl font-black text-2xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-3"
                >
                    <Save size={24} /> Plan für heute festlegen
                </button>
            </div>
          </motion.div>
        )}

        {/* PHASE 2: TACTICAL EXECUTION */}
        {isStarted && currentBlock !== 'done' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
             
             {/* LEFT: TIMER & FOCUS */}
             <div className="xl:col-span-2 space-y-8">
                {/* TIMER CARD */}
                <div className={`p-12 md:p-20 rounded-[4rem] ${glassClass} text-center relative overflow-hidden`}>
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-cyan-500" /> System Active
                    </div>

                    <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 tabular-nums">
                        {formatTime(timeLeft)}
                    </h2>

                    <div className="flex justify-center gap-4">
                        <button onClick={() => setIsActive(!isActive)} className="w-24 h-24 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-2" />}
                        </button>
                        <button onClick={completeBlock} className="px-8 h-24 rounded-3xl bg-zinc-100 dark:bg-white/5 font-black text-xs uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-colors">
                            Block Fertig
                        </button>
                    </div>
                </div>

                {/* BRAIN DUMP AREA */}
                <div className={`p-8 rounded-[3rem] ${glassClass}`}>
                    <div className="flex items-center gap-3 mb-4 text-zinc-400">
                        <PenTool size={20} />
                        <h3 className="font-black uppercase tracking-widest text-xs">Brain Dump / Notizen</h3>
                    </div>
                    <textarea 
                        value={brainDump}
                        onChange={(e) => setBrainDump(e.target.value)}
                        placeholder="Schreibe störende Gedanken hier auf, um den Kopf frei zu bekommen..."
                        className="w-full h-32 bg-transparent resize-none outline-none text-zinc-600 dark:text-zinc-300 placeholder:text-zinc-500/50 font-medium"
                    />
                    <div className="text-[10px] text-zinc-500 text-right mt-2 font-bold uppercase tracking-widest">
                        Speichert automatisch
                    </div>
                </div>
             </div>

             {/* RIGHT: CONNECTED TASKS & INFO */}
             <div className="space-y-8">
                
                {/* CURRENT FOCUS INFO */}
                <div className={`p-8 rounded-[3rem] ${glassClass} border-l-8 ${currentBlock === 'morning' ? 'border-orange-500' : currentBlock === 'break' ? 'border-green-500' : 'border-blue-500'}`}>
                    <h3 className="text-zinc-500 font-black uppercase tracking-widest text-[10px] mb-2">Aktueller Modus</h3>
                    <div className="text-3xl font-black leading-tight">
                        {currentBlock === 'morning' ? selectedMorning?.title : currentBlock === 'break' ? 'Regeneration' : selectedAfternoon?.title}
                    </div>
                    
                    {/* TACTICAL ADVICE (NEU) */}
                    {currentBlock !== 'break' && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <div className={`text-xs font-bold flex items-center gap-2 ${
                                getPhaseAdvice((currentBlock === 'morning' ? selectedMorning?.phase : selectedAfternoon?.phase) || 'preparation').color
                            }`}>
                                <Target size={14} />
                                {getPhaseAdvice((currentBlock === 'morning' ? selectedMorning?.phase : selectedAfternoon?.phase) || 'preparation').text}
                            </div>
                        </div>
                    )}

                    <div className="mt-4 text-xs font-bold text-zinc-500 flex items-center gap-2">
                        {currentBlock === 'morning' ? <Sun size={14}/> : currentBlock === 'break' ? <Coffee size={14}/> : <Moon size={14}/>}
                        {currentBlock === 'morning' ? 'Deep Work Phase' : currentBlock === 'break' ? 'Geh raus & beweg dich!' : 'Shallow Work Phase'}
                    </div>
                </div>

                {/* TASKS */}
                {currentBlock !== 'break' && (
                    <div className={`p-8 rounded-[3rem] ${glassClass} h-fit`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2 text-purple-500">
                                <ListTodo size={20} />
                                <h3 className="font-black text-sm uppercase tracking-widest">Relevante Tasks</h3>
                            </div>
                            <div className="flex gap-2">
                                {/* STRATEGY BUTTON (NEU) */}
                                <button 
                                    onClick={() => setIsStrategyOpen(true)}
                                    className="p-2 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-500 hover:text-white rounded-lg transition-all"
                                    title="AI Strategie Berater"
                                >
                                    <Compass size={18} />
                                </button>
                                {/* ADD BUTTON */}
                                <button 
                                    onClick={() => setIsTaskModalOpen(true)}
                                    className="p-2 bg-purple-500/10 hover:bg-purple-500 text-purple-500 hover:text-white rounded-lg transition-all"
                                    title="Neue Mission (Manuell)"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                            {getRelevantTasks().length > 0 ? (
                                getRelevantTasks().map(task => (
                                    <button 
                                        key={task.id} 
                                        onClick={() => toggleTask(task.id)}
                                        className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-4 transition-all text-left group"
                                    >
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-700'}`}>
                                            {task.completed && <CheckCircle size={14} className="text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className={`font-bold text-sm block truncate ${task.completed ? 'line-through opacity-40' : ''}`}>{task.title}</span>
                                            {/* Show Mode Icon & Details if available */}
                                            {task.mode && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    {getModeIcon(task.mode)}
                                                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide">{task.mode}</span>
                                                    {task.est_duration && <span className="text-[10px] text-zinc-600">({task.est_duration}m)</span>}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="py-8 text-center">
                                    <AlertCircle size={32} className="mx-auto text-zinc-700 mb-4" />
                                    <p className="text-xs font-bold text-zinc-500">Keine spezifischen Tasks offen.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
             </div>

          </motion.div>
        )}

        {/* PHASE 3: MISSION DEBRIEF */}
        {currentBlock === 'done' && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-20 max-w-xl mx-auto">
                <div className="text-8xl mb-8 animate-bounce">🏆</div>
                <h2 className="text-5xl font-black mb-4">Tag erfolgreich!</h2>
                <p className="text-zinc-500 font-bold mb-12 leading-relaxed text-lg">
                    Starke Leistung. Du hast deinen Plan exekutiert. Erhol dich gut für morgen.
                </p>
                
                <div className="bg-zinc-100 dark:bg-white/5 p-8 rounded-[3rem] mb-12 text-left">
                    <h3 className="font-black uppercase tracking-widest text-xs text-zinc-500 mb-4">Deine Notizen von heute</h3>
                    <p className="whitespace-pre-wrap font-mono text-sm">{brainDump || "Keine Notizen gemacht."}</p>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <button onClick={() => window.location.reload()} className="px-12 py-5 bg-cyan-500 text-white rounded-3xl font-black shadow-xl shadow-cyan-500/20 hover:scale-105 transition-all">
                        Neuen Tag starten
                    </button>
                    
                    <button onClick={undoCompleteDay} className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        <ArrowLeft size={16} /> Versehentlich beendet? Zurück
                    </button>
                </div>
            </motion.div>
        )}

      </AnimatePresence>

      {/* STRATEGY PROMPT MODAL */}
      <StrategyPrompt 
        isOpen={isStrategyOpen}
        onClose={() => setIsStrategyOpen(false)}
        onComplete={handleStrategyComplete}
      />

      {/* SCIENTIFIC TASK CREATOR MODAL */}
<SmartTaskModal 
    isOpen={isTaskModalOpen}
    onClose={() => setIsTaskModalOpen(false)}
    onTaskCreated={fetchData}
    preselectedCategory={
        currentBlock === 'morning' ? selectedMorning?.title : 
        currentBlock === 'afternoon' ? selectedAfternoon?.title : undefined
    }
    strategyData={strategyData} // HIER ÜBERGEBEN
/>
    </div>
  );
}