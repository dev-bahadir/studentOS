'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Plus, Trash2, Calendar, Mic, FileText, AlertTriangle, 
  ChevronRight, BookOpen, Download, GraduationCap, CheckCircle
} from 'lucide-react';

// Zentrale Glass-Klasse (Hellerer Border für Kontrast)
const glassClass = "bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/10 dark:border-white/10 shadow-2xl";

type Exam = {
  id: string;
  title: string;
  date: string;
  type: 'Klausur' | 'Referat' | 'Abgabe' | 'Test';
  grade?: string; // Neu: Für die Note
};

export default function RadarPage() {
  const { user } = useAuth();
  
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<Exam['type']>('Klausur');

  useEffect(() => {
    if (user) fetchExams();
  }, [user]);

  const fetchExams = async () => {
    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', user?.id)
      .order('date', { ascending: true });
    
    if (data) setExams(data as Exam[]);
    setLoading(false);
  };

  const addExam = async () => {
    if (!title.trim() || !date) return;

    const { error } = await supabase.from('exams').insert([{
      user_id: user?.id,
      title: title.trim(),
      date,
      type
    }]);

    if (!error) {
      setTitle(''); 
      setDate(''); 
      setIsCreating(false);
      fetchExams();
      await supabase.rpc('increment_xp', { x: 5, row_id: user?.id });
    }
  };

  const deleteExam = async (id: string) => {
    if(!confirm("Wirklich löschen?")) return;
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (!error) setExams(prev => prev.filter(e => e.id !== id));
  };

  const updateGrade = async (id: string, grade: string) => {
    const { error } = await supabase.from('exams').update({ grade }).eq('id', id);
    if (!error) {
        setExams(prev => prev.map(e => e.id === id ? { ...e, grade } : e));
    }
  };

  // --- NEUES FEATURE: KALENDER EXPORT ---
  const downloadICS = (exam: Exam) => {
    const startDate = new Date(exam.date);
    const endDate = new Date(exam.date);
    endDate.setHours(endDate.getHours() + 2); // Annahme: 2h Dauer

    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, "");

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${exam.title} (${exam.type})
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
DESCRIPTION:Vorbereitung für ${exam.title}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${exam.title}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDaysLeft = (targetDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // --- FARB-LOGIK (High Contrast Fix) ---
  const getUrgencyStyles = (days: number) => {
    if (days < 0) return 'border-zinc-700 bg-zinc-900/60 opacity-80'; // Done
    if (days <= 3) return 'border-red-500/60 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]'; // Critical
    if (days <= 7) return 'border-amber-500/60 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]'; // Warning
    return 'border-white/10 hover:border-cyan-500/50 hover:bg-white/5'; // Normal
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Referat': return <Mic size={24} />;
      case 'Abgabe': return <FileText size={24} />;
      case 'Test': return <BookOpen size={24} />;
      default: return <Target size={24} />;
    }
  };

  return (
    <div className="w-full max-w-[1920px] p-4 md:p-8 lg:p-12 min-h-screen pb-40 bg-transparent text-zinc-900 dark:text-zinc-100 overflow-x-hidden">
      
      {/* HEADER */}
      <div className={`flex flex-col md:flex-row justify-between items-center gap-6 mb-12 p-8 rounded-[3rem] ${glassClass}`}>
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter flex items-center gap-4 text-zinc-900 dark:text-white">
            <div className="p-3 bg-red-500 rounded-2xl shadow-lg shadow-red-500/20">
               <Target className="text-white" size={32} />
            </div>
            Klausur Radar
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-sm mt-2 pl-2">
             {exams.filter(e => getDaysLeft(e.date) >= 0).length} Aktive Ziele
          </p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="w-full md:w-auto bg-zinc-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {isCreating ? <><Trash2 size={20}/> Abbrechen</> : <><Plus size={20} /> Neuer Termin</>}
        </button>
      </div>

      {/* CREATE PANEL */}
      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 48 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-8 md:p-12 rounded-[3rem] ${glassClass} border-cyan-500/30 bg-cyan-500/5`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Titel</label>
                  <input 
                    value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="z.B. Analysis II"
                    className="w-full p-4 bg-black/10 dark:bg-white/5 rounded-2xl border border-transparent focus:border-cyan-500 outline-none font-bold text-lg transition-all text-white placeholder:text-zinc-500"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Datum</label>
                  <input 
                    type="date"
                    value={date} onChange={e => setDate(e.target.value)}
                    className="w-full p-4 bg-black/10 dark:bg-white/5 rounded-2xl border border-transparent focus:border-cyan-500 outline-none font-bold text-lg transition-all text-zinc-600 dark:text-zinc-300"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Typ</label>
                  <div className="relative">
                    <select 
                      value={type} onChange={e => setType(e.target.value as any)}
                      className="w-full p-4 bg-black/10 dark:bg-white/5 rounded-2xl border border-transparent focus:border-cyan-500 outline-none font-bold text-lg cursor-pointer appearance-none text-zinc-600 dark:text-zinc-300"
                    >
                      <option value="Klausur">Klausur</option>
                      <option value="Referat">Referat</option>
                      <option value="Abgabe">Abgabe</option>
                      <option value="Test">Test</option>
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-zinc-400 pointer-events-none" size={20} />
                  </div>
                </div>
              </div>
              <button 
                onClick={addExam} 
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
              >
                Termin im Radar erfassen
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LISTE */}
      {loading ? (
        <div className="flex flex-col items-center py-32 gap-6">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">Scanne Orbit...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className={`text-center py-32 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 ${glassClass}`}>
          <Calendar className="mx-auto text-zinc-300 dark:text-zinc-700 mb-6" size={64} />
          <h2 className="text-xl font-black text-zinc-400">Keine Prüfungen im Radar</h2>
          <p className="text-zinc-500 text-sm mt-2 font-medium">Genieß die Ruhe vor dem Sturm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {exams.map((e) => {
            const daysLeft = getDaysLeft(e.date);
            const styleClass = getUrgencyStyles(daysLeft);
            const isCritical = daysLeft <= 3 && daysLeft >= 0;
            const isDone = daysLeft < 0;

            return (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={e.id} 
                className={`p-6 md:p-8 rounded-[2.5rem] border shadow-sm flex flex-col xl:flex-row justify-between items-center gap-6 group transition-all relative overflow-hidden ${glassClass} ${styleClass}`}
              >
                {/* Background Pulse for Critical Exams */}
                {isCritical && <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />}

                {/* Left Side: Info */}
                <div className="flex items-center gap-6 w-full xl:w-auto relative z-10">
                  <div className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center shadow-lg border border-white/10 transition-transform group-hover:rotate-3 ${isCritical ? 'bg-red-500 text-white' : isDone ? 'bg-zinc-800 text-zinc-500' : 'bg-white dark:bg-zinc-800 text-zinc-400'}`}>
                    {isDone ? <CheckCircle size={24} /> : getIcon(e.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${isCritical ? 'bg-red-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>{e.type}</span>
                      {isCritical && <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 uppercase tracking-widest animate-pulse"><AlertTriangle size={10} /> Dringend</span>}
                    </div>
                    <h3 className={`font-black text-2xl md:text-3xl tracking-tight ${isDone ? 'text-zinc-500 line-through' : 'text-zinc-900 dark:text-white'}`}>{e.title}</h3>
                    <p className="opacity-60 text-sm font-bold mt-1 flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                      <Calendar size={14} />
                      {new Date(e.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Right Side: Actions & Countdown */}
                <div className="flex flex-col md:flex-row items-center gap-8 w-full xl:w-auto justify-between xl:justify-end relative z-10 pt-4 xl:pt-0 border-t xl:border-t-0 border-black/5 dark:border-white/5">
                  
                  {/* GRADE TRACKER (Wenn vorbei) oder COUNTDOWN */}
                  <div className="text-center md:text-right min-w-[120px]">
                    {isDone ? (
                        e.grade ? (
                            <div className="flex flex-col items-center md:items-end">
                                <span className="text-4xl font-black text-emerald-500">{e.grade}</span>
                                <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Note</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 bg-black/10 dark:bg-white/5 p-2 rounded-xl border border-white/5">
                                <GraduationCap size={16} className="text-zinc-400"/>
                                <input 
                                    placeholder="Note?" 
                                    className="bg-transparent w-12 text-center font-bold text-white outline-none border-b border-zinc-600 focus:border-cyan-500 transition-colors"
                                    onBlur={(evt) => updateGrade(e.id, evt.target.value)}
                                    onKeyDown={(evt) => { if(evt.key === 'Enter') updateGrade(e.id, evt.currentTarget.value) }}
                                />
                            </div>
                        )
                    ) : (
                        <>
                            <span className={`block text-5xl font-black leading-none tracking-tighter ${isCritical ? 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]' : 'text-zinc-900 dark:text-white'}`}>
                            {daysLeft}
                            </span>
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] opacity-40">
                            {daysLeft === 1 ? 'Tag übrig' : 'Tage übrig'}
                            </span>
                        </>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                      {!isDone && (
                        <button 
                            onClick={() => downloadICS(e)}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-cyan-500 hover:text-white text-zinc-400 transition-all active:scale-90"
                            title="Kalender Export"
                        >
                            <Download size={20} />
                        </button>
                      )}
                      
                      <button 
                        onClick={() => deleteExam(e.id)} 
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-red-500 hover:text-white text-zinc-400 transition-all active:scale-90"
                        title="Löschen"
                      >
                        <Trash2 size={20} />
                      </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}