'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Plus, 
  Trash2, 
  Calendar, 
  Mic, 
  FileText, 
  AlertTriangle,
  Clock,
  ChevronRight
} from 'lucide-react';

type Exam = {
  id: string;
  title: string;
  date: string;
  type: 'Klausur' | 'Referat' | 'Abgabe' | 'Test';
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
      // XP Boost für Planung
      await supabase.rpc('increment_xp', { x: 5, row_id: user?.id });
    }
  };

  const deleteExam = async (id: string) => {
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (!error) setExams(prev => prev.filter(e => e.id !== id));
  };

  const getDaysLeft = (targetDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyStyles = (days: number) => {
    if (days < 0) return 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 opacity-60'; 
    if (days <= 3) return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-600 animate-pulse'; 
    if (days <= 7) return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-600'; 
    return 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'; 
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Referat': return <Mic size={24} />;
      case 'Abgabe': return <FileText size={24} />;
      default: return <Calendar size={24} />;
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto min-h-screen pb-40 text-zinc-900 dark:text-zinc-100">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <Target className="text-red-500" size={36} /> Klausur Radar
          </h1>
          <p className="text-zinc-500 font-medium mt-1">Behalte deine Deadlines im Blick</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="w-full md:w-auto bg-zinc-900 dark:bg-panel text-white dark:text-ink px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {isCreating ? 'Abbrechen' : <><Plus size={20} /> Neuer Termin</>}
        </button>
      </div>

      {/* CREATE PANEL */}
      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 32 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-zinc-200 dark:border-zinc-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Titel</label>
                  <input 
                    value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="z.B. Analysis II"
                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Datum</label>
                  <input 
                    type="date"
                    value={date} onChange={e => setDate(e.target.value)}
                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Typ</label>
                  <select 
                    value={type} onChange={e => setType(e.target.value as any)}
                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 outline-none cursor-pointer appearance-none"
                  >
                    <option value="Klausur">Klausur</option>
                    <option value="Referat">Referat</option>
                    <option value="Abgabe">Abgabe</option>
                    <option value="Test">Test</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={addExam} 
                className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-lg shadow-red-600/20 active:scale-95"
              >
                Termin im Radar erfassen
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LISTE */}
      {loading ? (
        <div className="flex flex-col items-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 font-bold uppercase tracking-tighter">Scanne Orbit...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-24 bg-zinc-50 dark:bg-zinc-900/50 rounded-[3rem] border border-dashed border-zinc-200 dark:border-zinc-800">
          <Clock className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" size={48} />
          <h2 className="text-xl font-bold text-zinc-400">Keine Prüfungen im Radar</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {exams.map((e) => {
            const daysLeft = getDaysLeft(e.date);
            const styleClass = getUrgencyStyles(daysLeft);

            return (
              <motion.div 
                layout
                key={e.id} 
                className={`p-6 md:p-8 rounded-[2.5rem] border ${styleClass} shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 group transition-all`}
              >
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className="bg-white dark:bg-zinc-800 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-zinc-500 shadow-sm border border-zinc-100 dark:border-zinc-700 transition-transform group-hover:rotate-6">
                    {getIcon(e.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{e.type}</span>
                      {daysLeft <= 3 && daysLeft >= 0 && <AlertTriangle size={14} className="text-red-500" />}
                    </div>
                    <h3 className="font-black text-xl md:text-2xl tracking-tight leading-none">{e.title}</h3>
                    <p className="opacity-60 text-sm font-bold mt-2 flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(e.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-black/5 pt-4 md:pt-0">
                  <div className="text-right">
                    <span className="block text-4xl font-black leading-none tracking-tighter">
                      {daysLeft < 0 ? 'Fin' : daysLeft}
                    </span>
                    <span className="text-[10px] uppercase font-black tracking-[0.2em] opacity-40">
                      {daysLeft === 1 ? 'Tag übrig' : daysLeft < 0 ? 'Erledigt' : 'Tage übrig'}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => deleteExam(e.id)} 
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-black/5 hover:bg-red-500 hover:text-white transition-all active:scale-90"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
