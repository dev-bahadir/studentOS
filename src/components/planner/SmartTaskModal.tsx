'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Brain, Search, PenTool, Mic, Dumbbell, 
  Clock, Zap, ChevronRight, Battery
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';

const glassClass = "bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-2xl";

// WISSENSCHAFTLICHE MODI KONFIGURATION
const STUDY_MODES = [
  { 
    id: 'scout', 
    label: 'The Scout (SQ3R)', 
    desc: 'Überblick verschaffen. Skript scannen. Struktur verstehen.', 
    icon: Search, 
    color: 'bg-blue-500',
    basePomo: 1
  },
  { 
    id: 'scribe', 
    label: 'The Scribe (Cornell)', 
    desc: 'Vorlesung nachbereiten. Cue-Fragen formulieren.', 
    icon: PenTool, 
    color: 'bg-yellow-500',
    basePomo: 2
  },
  { 
    id: 'teacher', 
    label: 'The Teacher (Feynman)', 
    desc: 'Erkläre das Konzept laut und einfach. Lücken finden.', 
    icon: Mic, 
    color: 'bg-pink-500',
    basePomo: 1
  },
  { 
    id: 'tester', 
    label: 'The Tester (Recall)', 
    desc: 'Buch zu. Kopf an. Teste dein Wissen aktiv.', 
    icon: Brain, 
    color: 'bg-red-500',
    basePomo: 1
  },
  { 
    id: 'gym', 
    label: 'The Gym (Practice)', 
    desc: 'Übungsaufgaben lösen. Interleaving anwenden.', 
    icon: Dumbbell, 
    color: 'bg-emerald-500',
    basePomo: 2
  }
];

interface Subject { id: string; title: string; color: string; }

interface SmartTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  preselectedCategory?: string; 
  // NEU: Daten vom Strategie-Berater
  strategyData?: {
      mode: string;
      duration: number;
      energy: number;
      title: string;
  } | null;
}

export function SmartTaskModal({ isOpen, onClose, onTaskCreated, preselectedCategory, strategyData }: SmartTaskModalProps) {
  const { user } = useAuth();
  
  // State
  const [title, setTitle] = useState('');
  const [selectedMode, setSelectedMode] = useState(STUDY_MODES[4]); // Default: Gym
  const [pomodoros, setPomodoros] = useState(2); // Default 2x 25min
  const [energyReq, setEnergyReq] = useState(2); // 1-3
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 1. Laden der Fächer
  useEffect(() => {
      if(isOpen && user) {
          const loadSubjects = async () => {
             const { data } = await supabase.from('subjects').select('*');
             if(data) setSubjects(data);
          };
          loadSubjects();
      }
  }, [isOpen, user]);

  // 2. Auto-Fill aus Strategie oder Kategorie
  useEffect(() => {
      if (isOpen) {
          // Kategorie setzen
          if (preselectedCategory) {
              // Versuche das passende Subject zu finden
              const sub = subjects.find(s => s.title === preselectedCategory);
              if (sub) setSelectedSubject(sub.id);
          }

          // Strategie anwenden (Der "Magic Fill")
          if (strategyData) {
              setTitle(strategyData.title);
              const mode = STUDY_MODES.find(m => m.id === strategyData.mode) || STUDY_MODES[4];
              setSelectedMode(mode);
              // Pomodoros berechnen (aufrunden)
              setPomodoros(Math.ceil(strategyData.duration / 25));
              setEnergyReq(strategyData.energy);
          } else {
              // Reset wenn keine Strategie
              if(!title) setTitle('');
          }
      }
  }, [isOpen, preselectedCategory, strategyData, subjects]);

  const handleSubmit = async () => {
    if (!title.trim() || !user) return;
    setLoading(true);

    // FSRS Init
    const srData = (selectedMode.id === 'tester' || selectedMode.id === 'teacher') ? {
        sr_interval: 1,
        repetition_count: 0,
        next_review_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        state: 0,
        stability: 0,
        difficulty: 0
    } : {};

    // UUID Check
    const finalSubjectId = selectedSubject && selectedSubject !== '' ? selectedSubject : null;

    // Speichern
    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: title,
      category: selectedSubject ? subjects.find(s => s.id === selectedSubject)?.title : (preselectedCategory || 'General'),
      subject_id: finalSubjectId, 
      mode: selectedMode.id,
      pomodoros_est: pomodoros,
      energy_req: energyReq,
      est_duration: pomodoros * 25,
      ...srData,
      completed: false
    });

    setLoading(false);
    
    if (error) {
      alert(`Fehler: ${error.message}`);
    } else {
      onTaskCreated();
      onClose();
      // Reset
      setTitle('');
      setPomodoros(2);
      setEnergyReq(2);
      setSelectedSubject('');
    }
  };
  
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.9, y: 20, opacity: 0 }} 
            animate={{ scale: 1, y: 0, opacity: 1 }} 
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className={`w-full max-w-2xl rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden ${glassClass} text-zinc-100 border-t border-white/20`}
          >
            {/* Close Button */}
            <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors">
              <X size={24} className="text-zinc-400" />
            </button>

            {/* Header */}
            <div className="mb-8">
                {strategyData ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest mb-2 border border-cyan-500/30">
                        <Zap size={12} /> AI Strategy Active
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">
                        Manual Mode
                    </div>
                )}
                <h2 className="text-3xl font-black flex items-center gap-3">
                  Tactical Ops
                </h2>
                <p className="text-zinc-400 font-medium">
                  Definiere das taktische Ziel. Wähle die passende kognitive Strategie.
                </p>
            </div>

            {/* 1. Task Title */}
            <div className="mb-6">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1 mb-2 block">Missions-Ziel</label>
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Taylor-Reihen herleiten..."
                autoFocus
                className="w-full bg-black/30 border-2 border-white/5 focus:border-cyan-500 rounded-2xl p-4 text-xl font-bold outline-none placeholder:text-zinc-700 transition-colors"
              />
            </div>

            {/* Fachbereich Auswahl */}
            <div className="mb-8">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1 mb-2 block">Fachbereich</label>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {subjects.length > 0 ? subjects.map(sub => (
                        <button key={sub.id} onClick={() => setSelectedSubject(sub.id)} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap border transition-colors ${selectedSubject === sub.id ? 'bg-cyan-500/20 border-cyan-500 text-cyan-500' : 'bg-white/5 border-transparent text-zinc-400'}`}>
                            {sub.title}
                        </button>
                    )) : (
                        <span className="text-xs text-zinc-600 italic px-2">Keine Fächer definiert.</span>
                    )}
                </div>
            </div>

            {/* 2. Strategy Selector */}
            <div className="mb-8">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1 mb-4 block">Strategie (Modus)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {STUDY_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => { setSelectedMode(mode); setPomodoros(mode.basePomo); }}
                    className={`p-4 rounded-2xl text-left border-2 transition-all flex items-start gap-4 group ${
                      selectedMode.id === mode.id 
                        ? 'bg-white/10 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                        : 'bg-black/20 border-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${mode.color} text-white shadow-lg`}>
                      <mode.icon size={20} />
                    </div>
                    <div>
                      <div className="font-black text-sm mb-1">{mode.label}</div>
                      <div className="text-[10px] text-zinc-400 leading-tight group-hover:text-zinc-200">{mode.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Metrics */}
            <div className="grid grid-cols-2 gap-6 bg-black/20 p-6 rounded-3xl mb-10 border border-white/5">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 mb-3"><Clock size={12}/> Pomodoros (25m)</label>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setPomodoros(Math.max(1, pomodoros-1))} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 font-bold">-</button>
                        <span className="font-black text-2xl w-8 text-center tabular-nums text-cyan-500">{pomodoros}</span>
                        <button onClick={() => setPomodoros(pomodoros+1)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 font-bold">+</button>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-2 font-mono">= {pomodoros * 25} min + {(pomodoros-1)*5} min Pause</div>
                </div>

                <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 mb-3"><Battery size={12}/> Energy Required</label>
                      <div className="flex gap-1 mt-1 h-10">
                        {[1,2,3].map(lvl => (
                            <button key={lvl} onClick={() => setEnergyReq(lvl)} className={`flex-1 rounded-lg transition-all border border-transparent ${energyReq >= lvl ? (energyReq===3 ? 'bg-red-500 shadow-red-500/20 shadow-lg' : energyReq===2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-white/5 hover:bg-white/10'}`} />
                        ))}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-2 text-right font-bold uppercase">
                        {energyReq === 1 ? 'Low (Chill)' : energyReq === 2 ? 'Med (Focus)' : 'High (Deep)'}
                      </div>
                </div>
            </div>

            {/* Submit */}
            <button 
              onClick={handleSubmit}
              disabled={loading || !title.trim()}
              className="w-full py-5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-2xl font-black text-lg shadow-xl shadow-cyan-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Initialisiere..." : <>Mission Hinzufügen <ChevronRight /></>}
            </button>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}