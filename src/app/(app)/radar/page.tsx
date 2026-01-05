'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';

export default function RadarPage() {
  const { user } = useAuth();
  
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('Klausur');

  useEffect(() => {
    if (user) fetchExams();
  }, [user]);

  const fetchExams = async () => {
    const { data } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', user?.id)
      .order('date', { ascending: true }); // Nächste Klausur zuerst
    
    if (data) setExams(data);
    setLoading(false);
  };

  const addExam = async () => {
    if (!title.trim() || !date) return;

    const { error } = await supabase.from('exams').insert([{
      user_id: user?.id,
      title,
      date,
      type
    }]);

    if (!error) {
      setTitle(''); setDate(''); setIsCreating(false);
      fetchExams();
      // Kleiner XP Boost für Planung
      await supabase.rpc('increment_xp', { x: 5, row_id: user?.id });
    }
  };

  const deleteExam = async (id: string) => {
    if (!confirm('Termin entfernen?')) return;
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (!error) setExams(prev => prev.filter(e => e.id !== id));
  };

  // Hilfsfunktion: Tage berechnen
  const getDaysLeft = (targetDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyColor = (days: number) => {
    if (days < 0) return 'bg-gray-100 border-gray-200 text-gray-600 dark:text-gray-400'; // Vorbei
    if (days <= 3) return 'bg-red-50 border-red-200 text-red-700 animate-pulse'; // ALARM
    if (days <= 7) return 'bg-orange-50 border-orange-200 text-orange-700'; // Bald
    return 'bg-green-50 border-green-200 text-green-700'; // Entspannt
  };

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto min-h-screen pb-40">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800 flex items-center gap-2">
            <span className="text-red-500">🎯</span> Klausur Radar
          </h1>
          <p className="text-gray-500 text-sm mt-1">Deine nächsten Deadlines im Blick</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-gray-900 text-white px-5 py-2 rounded-2xl font-bold shadow-lg shadow-gray-900/20 active:scale-95 transition"
        >
          {isCreating ? 'Abbrechen' : '+ Neuer Termin'}
        </button>
      </div>

      {/* CREATE PANEL */}
      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input 
                  value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Fach / Thema (z.B. 'Mathe II')"
                  className="p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  type="date"
                  value={date} onChange={e => setDate(e.target.value)}
                  className="p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select 
                  value={type} onChange={e => setType(e.target.value)}
                  className="p-3 bg-gray-50 rounded-xl border-none outline-none cursor-pointer"
                >
                  <option value="Klausur">Klausur</option>
                  <option value="Referat">Referat</option>
                  <option value="Abgabe">Abgabe</option>
                  <option value="Test">Test</option>
                </select>
              </div>
              <button onClick={addExam} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">
                Termin eintragen
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LISTE */}
      {loading ? (
        <div className="text-center py-20 text-gray-600 dark:text-gray-400">Scanne Radar...</div>
      ) : exams.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-gray-600 dark:text-gray-400">
          Alles ruhig. Keine Prüfungen in Sicht. 🏖️
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {exams.map((e) => {
            const daysLeft = getDaysLeft(e.date);
            const colorClass = getUrgencyColor(daysLeft);

            return (
              <div key={e.id} className={`p-6 rounded-3xl border ${colorClass} shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 transition-all hover:shadow-md`}>
                
                {/* INFO */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="bg-white/50 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                    {e.type === 'Klausur' ? '📝' : e.type === 'Referat' ? '🎤' : '📅'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg md:text-xl">{e.title}</h3>
                    <p className="opacity-70 text-sm font-medium">{new Date(e.date).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                {/* COUNTDOWN */}
                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <span className="block text-3xl font-black leading-none">
                      {daysLeft < 0 ? 'Vorbei' : daysLeft}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                      {daysLeft === 1 ? 'Tag' : 'Tage'}
                    </span>
                  </div>
                  
                  <button onClick={() => deleteExam(e.id)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/10 transition">
                    🗑️
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}