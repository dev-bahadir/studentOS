'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Plus, Trash2, Calendar, Brain, Shield, 
  Swords, ArrowRight, Layout, Split, CheckCircle,
  AlertTriangle, Clock, Layers
} from 'lucide-react';
import { SmartTaskModal } from '@/components/planner/SmartTaskModal'; 

// Design Helper
const glassClass = "bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/10 dark:border-white/10 shadow-2xl";

type ExamPhase = 'preparation' | 'memorizing' | 'simulation' | 'panic';
type Priority = 'high' | 'low';

type Exam = {
  id: string;
  title: string;
  date: string;
  type: 'Klausur' | 'Referat' | 'Abgabe' | 'Test';
  priority: Priority;
  phase: ExamPhase;
  material_tags?: string[];
};

// Wissenschaftliche Tipps (statisch)
const SCIENCE_TIPS = [
  { icon: <Brain size={18} />, title: "Active Recall", text: "Lies nicht nur. Teste dich selbst! Das stärkt die neuronalen Pfade." },
  { icon: <Target size={18} />, title: "Pareto (80/20)", text: "20% des Stoffes bringen 80% der Punkte. Lerne die Grundlagen perfekt." },
];

export default function RadarPage() {
  const { user } = useAuth();
  
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // States für SmartTaskModal (Integration)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedExamForTask, setSelectedExamForTask] = useState<Exam | null>(null);

  // Form State für neue Klausur
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<Exam['type']>('Klausur');
  const [priority, setPriority] = useState<Priority>('high');

  useEffect(() => {
    if (user) fetchExams();
  }, [user]);

  const fetchExams = async () => {
    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', user?.id)
      .order('date', { ascending: true });
    
    if (data) {
        // Automatische Phasen-Berechnung beim Laden
        const updatedExams = data.map((e: any) => {
            const calculatedPhase = calculatePhase(e.date);
            // Optional: Update DB if phase changed (machen wir hier silent)
            return { ...e, phase: calculatedPhase };
        });
        setExams(updatedExams as Exam[]);
    }
    setLoading(false);
  };

  // WISSENSCHAFTLICHE LOGIK: Automatische Phase basierend auf Zeit
  const calculatePhase = (examDateStr: string): ExamPhase => {
      const days = getDaysLeft(examDateStr);
      if (days < 0) return 'panic'; // Eigentlich vorbei
      if (days <= 3) return 'panic';
      if (days <= 7) return 'simulation'; // Letzte Woche: Prüfungen simulieren
      if (days <= 21) return 'memorizing'; // 3 Wochen vorher: Auswendig lernen (Anki)
      return 'preparation'; // Davor: Stoff verstehen & zusammenfassen
  };

  const addExam = async () => {
    if (!title.trim() || !date) return;
    
    // Auto-Phase beim Erstellen
    const initialPhase = calculatePhase(date);

    const { error } = await supabase.from('exams').insert([{
      user_id: user?.id,
      title: title.trim(),
      date,
      type,
      priority,
      phase: initialPhase
    }]);

    if (!error) {
      setTitle(''); setDate(''); setIsCreating(false);
      fetchExams();
      await supabase.rpc('increment_xp', { x: 50, row_id: user?.id });
    }
  };

  const deleteExam = async (id: string) => {
    if(!confirm("Wirklich löschen?")) return;
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (!error) setExams(prev => prev.filter(e => e.id !== id));
  };

  // Handler zum Öffnen des Task Modals für eine spezifische Klausur
  const openTaskModal = (exam: Exam) => {
    setSelectedExamForTask(exam);
    setIsTaskModalOpen(true);
  };

  const getDaysLeft = (targetDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getPhaseColor = (phase: ExamPhase) => {
      switch(phase) {
          case 'preparation': return 'bg-blue-500';
          case 'memorizing': return 'bg-purple-500';
          case 'simulation': return 'bg-amber-500';
          case 'panic': return 'bg-red-600 animate-pulse';
          default: return 'bg-zinc-500';
      }
  };

  const getPhaseLabel = (phase: ExamPhase) => {
      switch(phase) {
          case 'preparation': return 'Verstehen & Zusammenfassen';
          case 'memorizing': return 'Active Recall & Spaced Rep';
          case 'simulation': return 'Prüfungssimulation';
          case 'panic': return 'Notfall-Fokus (Pareto)';
          default: return 'Planung';
      }
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto p-6 md:p-10 lg:p-14 min-h-screen pb-40 bg-transparent text-zinc-900 dark:text-zinc-100 overflow-x-hidden">
      
      {/* HEADER */}
      <div className={`flex flex-col md:flex-row justify-between items-center gap-8 mb-16 p-10 rounded-[3rem] ${glassClass}`}>
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter flex items-center gap-5 text-zinc-900 dark:text-white">
            <div className="p-4 bg-red-500 rounded-3xl shadow-xl shadow-red-500/20 rotate-3">
               <Target className="text-white" size={40} />
            </div>
            Strategie Radar
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-sm mt-4 pl-2 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
             {exams.filter(e => e.priority === 'high' && getDaysLeft(e.date) >= 0).length} Ziele im Fokus
          </p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="w-full md:w-auto bg-zinc-900 dark:bg-white text-white dark:text-black px-10 py-5 rounded-3xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 text-lg"
        >
          {isCreating ? <><Trash2 size={24}/> Abbrechen</> : <><Plus size={24} /> Neuer Termin</>}
        </button>
      </div>

      {/* CREATE PANEL */}
      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 64 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-10 md:p-14 rounded-[3rem] ${glassClass} border-cyan-500/30 bg-cyan-500/5`}>
              <h3 className="text-2xl font-black mb-8">Neues Ziel definieren</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Fach / Titel</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="z.B. Makroökonomie" className="w-full p-5 bg-black/10 dark:bg-white/5 rounded-3xl font-bold outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Datum</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-5 bg-black/10 dark:bg-white/5 rounded-3xl font-bold outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                </div>
                <div className="space-y-3">
                   <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Priorität</label>
                   <div className="flex bg-black/10 dark:bg-white/5 rounded-3xl p-1.5">
                      <button onClick={() => setPriority('high')} className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all ${priority === 'high' ? 'bg-red-500 text-white shadow-lg' : 'text-zinc-500'}`}>Jetzt 🔥</button>
                      <button onClick={() => setPriority('low')} className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all ${priority === 'low' ? 'bg-blue-500 text-white shadow-lg' : 'text-zinc-500'}`}>Später ❄️</button>
                   </div>
                </div>
                <div className="space-y-3">
                   <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">Typ</label>
                   <select value={type} onChange={e => setType(e.target.value as any)} className="w-full p-5 bg-black/10 dark:bg-white/5 rounded-3xl font-bold outline-none appearance-none text-zinc-600 dark:text-zinc-300">
                      <option value="Klausur">Klausur</option>
                      <option value="Referat">Referat</option>
                      <option value="Abgabe">Abgabe</option>
                   </select>
                </div>
              </div>
              <button onClick={addExam} className="w-full bg-cyan-500 hover:bg-cyan-400 text-white py-5 rounded-3xl font-black text-xl transition-all shadow-lg">Termin erfassen</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        
        {/* LEFT COLUMN: EXAMS */}
        <div className="xl:col-span-3 space-y-16">
            
            {/* ZONE 1: HIGH PRIORITY */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
                        <Swords size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-zinc-900 dark:text-white">Fokus Zone</h2>
                        <p className="text-zinc-500 font-medium">Volle Konzentration auf diese Ziele.</p>
                    </div>
                </div>
                
                {exams.filter(e => e.priority === 'high').length === 0 ? (
                    <div className="p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem] text-center text-zinc-500 font-bold">
                        Keine Akut-Klausuren. Zeit für Strategieplanung?
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {exams.filter(e => e.priority === 'high').map(exam => (
                             <StrategicExamCard 
                                key={exam.id} 
                                exam={exam} 
                                daysLeft={getDaysLeft(exam.date)} 
                                phaseLabel={getPhaseLabel(exam.phase)}
                                onDelete={deleteExam}
                                phaseColor={getPhaseColor(exam.phase)}
                                onAddTask={() => openTaskModal(exam)} // HIER: Connect Button
                             />
                        ))}
                    </div>
                )}
            </section>

            {/* ZONE 2: LOW PRIORITY */}
            <section className="opacity-60 hover:opacity-100 transition-opacity duration-500">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                        <Shield size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-zinc-900 dark:text-white">Reserve</h2>
                        <p className="text-zinc-500 font-medium">Diese Themen ruhen vorerst.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                     {exams.filter(e => e.priority === 'low').map(exam => (
                         <div key={exam.id} className={`p-8 rounded-[2.5rem] border border-white/5 bg-zinc-100 dark:bg-white/5 relative group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors`}>
                             <button onClick={() => deleteExam(exam.id)} className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/10 text-red-500 rounded-full"><Trash2 size={18}/></button>
                             <h3 className="font-bold text-xl mb-2 text-zinc-900 dark:text-white">{exam.title}</h3>
                             <p className="text-sm text-zinc-500 flex items-center gap-2 font-medium mb-4">
                                <Calendar size={16}/> {new Date(exam.date).toLocaleDateString('de-DE')}
                             </p>
                             <div className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-6 bg-zinc-200 dark:bg-white/10 inline-block px-3 py-1 rounded-lg">
                                {getPhaseLabel(exam.phase)}
                             </div>
                             <button 
                                onClick={() => openTaskModal(exam)}
                                className="w-full py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold uppercase hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                             >
                                <Plus size={14} /> Mission
                             </button>
                         </div>
                     ))}
                </div>
            </section>
        </div>

        {/* RIGHT COLUMN: TIPPS & STATS */}
        <div className="space-y-10">
            <div className={`p-10 rounded-[3rem] ${glassClass} border-l-8 border-l-cyan-500 bg-gradient-to-br from-cyan-500/5 to-transparent`}>
                <h3 className="font-black text-2xl mb-6 flex items-center gap-3 text-zinc-900 dark:text-white">
                    <Layout className="text-cyan-500" size={24}/> Strategie
                </h3>
                <p className="text-xs text-zinc-500 font-medium mb-4">Deine Lernphase wird automatisch berechnet.</p>
                <ul className="space-y-2 text-[10px] uppercase font-bold text-zinc-400">
                    <li className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"/>  21 Tage: Verstehen</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full"/> 21-7 Tage: Pauken</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 bg-amber-500 rounded-full"/> &lt; 7 Tage: Simulation</li>
                </ul>
            </div>
            
            <div className={`p-10 rounded-[3rem] ${glassClass}`}>
                 <h3 className="font-black text-xl mb-6 flex items-center gap-3 text-zinc-900 dark:text-white"><Brain className="text-purple-500" size={24}/> Neuro Hacks</h3>
                 {SCIENCE_TIPS.map((tip, i) => (
                    <div key={i} className="mb-4 last:mb-0">
                        <h4 className="font-bold text-sm flex items-center gap-2 text-zinc-900 dark:text-white mb-1"><span className="text-purple-500">{tip.icon}</span> {tip.title}</h4>
                        <p className="text-xs text-zinc-500">{tip.text}</p>
                    </div>
                 ))}
            </div>
        </div>

      </div>

      {/* MODAL INTEGRATION: Wenn man hier klickt, wird die Klausur automatisch als Kategorie gesetzt */}
      <SmartTaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onTaskCreated={() => {
            // Optional: Ein visuelles Feedback
        }}
        preselectedCategory={selectedExamForTask?.title} 
      />
    </div>
  );
}

// --- SUB-COMPONENT: STRATEGIC CARD ---

function StrategicExamCard({ exam, daysLeft, phaseLabel, onDelete, phaseColor, onAddTask }: any) {
    const isDone = daysLeft < 0;
    
    return (
        <div className={`p-8 md:p-10 rounded-[3rem] ${glassClass} relative group transition-all hover:border-zinc-400 dark:hover:border-zinc-600`}>
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${daysLeft <= 7 ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-zinc-100 dark:bg-white/10 text-zinc-500'}`}>
                    {isDone ? 'Abgeschlossen' : `${daysLeft} Tage`}
                </div>
                <div className="flex gap-2">
                    <button onClick={onAddTask} className="p-2 bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500 hover:text-white rounded-full transition-all" title="Neue Mission hinzufügen">
                        <Plus size={18} />
                    </button>
                    <button onClick={() => onDelete(exam.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-500 bg-white dark:bg-zinc-800 p-2 rounded-full shadow-lg">
                        <Trash2 size={18}/>
                    </button>
                </div>
            </div>

            <h3 className={`text-3xl font-black mb-2 tracking-tight ${isDone ? 'line-through opacity-50' : 'text-zinc-900 dark:text-white'}`}>{exam.title}</h3>
            <p className="text-sm text-zinc-500 font-bold flex items-center gap-2 mb-8">
                <Calendar size={16}/> {new Date(exam.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>

            {/* Scientific Phase Tracker */}
            {!isDone && (
                <div className="space-y-3 p-4 bg-zinc-50 dark:bg-black/20 rounded-3xl border border-zinc-100 dark:border-white/5">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${phaseColor} animate-pulse`}/>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Aktuelle Phase</span>
                        </div>
                    </div>
                    <div className="text-lg font-black text-zinc-800 dark:text-zinc-200">
                        {phaseLabel}
                    </div>
                    
                    {/* Visual Progress Bar based on Phase */}
                    <div className="h-2 bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden flex mt-2">
                        <div className={`h-full ${exam.phase === 'preparation' ? 'w-1/3 bg-blue-500' : exam.phase === 'memorizing' ? 'w-2/3 bg-purple-500' : 'w-full bg-amber-500'}`} />
                    </div>
                </div>
            )}
        </div>
    );
}