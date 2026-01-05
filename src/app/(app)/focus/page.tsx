'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Coffee, 
  Play, 
  Pause,
  RotateCcw, 
  Wind, 
  Lightbulb,
  Bell
} from 'lucide-react';

const MODES = {
  focus: { label: 'Fokus', minutes: 25, color: 'text-red-500', bg: 'bg-red-500', icon: <Flame size={20} /> },
  short: { label: 'Pause', minutes: 5, color: 'text-emerald-500', bg: 'bg-emerald-500', icon: <Coffee size={20} /> },
  long: { label: 'Break', minutes: 15, color: 'text-blue-500', bg: 'bg-blue-500', icon: <Wind size={20} /> },
};

export default function FocusPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<keyof typeof MODES>('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.minutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathText, setBreathText] = useState('Bereit?');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Browser-Berechtigungen für Notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Synchronisiere Browser-Tab Titel
  useEffect(() => {
    document.title = isActive 
      ? `(${formatTime(timeLeft)}) ${MODES[mode].label}` 
      : "ElectroBrain OS";
  }, [timeLeft, isActive, mode]);

  // Korrigierte Timer-Logik für maximale Präzision
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODES[mode].minutes * 60);
  };

  const changeMode = (newMode: keyof typeof MODES) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(MODES[newMode].minutes * 60);
  };

  const handleComplete = async () => {
    setIsActive(false);
    
    // Notification auslösen
    if (Notification.permission === 'granted') {
      new Notification("ElectroBrain Fokus", { 
        body: mode === 'focus' ? "Session beendet! Zeit für eine Pause." : "Pause vorbei. Weiter geht's!",
        silent: false
      });
    }

    if (mode === 'focus' && user) {
      await supabase.rpc('increment_xp', { x: 25, row_id: user.id });
      changeMode('short');
    } else {
      changeMode('focus');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Box-Breathing Guide Logik (4s-4s-4s-4s Zyklus)
  useEffect(() => {
    if (!breathingActive) {
      setBreathText('Start');
      return;
    }
    
    const breathCycle = () => {
      setBreathText('Einatmen');
      const h1 = setTimeout(() => setBreathText('Halten'), 4000);
      const a = setTimeout(() => setBreathText('Ausatmen'), 8000);
      const h2 = setTimeout(() => setBreathText('Halten'), 12000);
      return () => { clearTimeout(h1); clearTimeout(a); clearTimeout(h2); };
    };

    const cleanup = breathCycle();
    const interval = setInterval(breathCycle, 16000);
    
    return () => {
      clearInterval(interval);
      cleanup();
    };
  }, [breathingActive]);

  const progress = ((MODES[mode].minutes * 60 - timeLeft) / (MODES[mode].minutes * 60)) * 100;

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto min-h-screen pb-40 text-ink transition-colors">
      
      <header className="mb-12">
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
          <span className="text-cyan-500">🧘</span> Fokus Zone
        </h1>
        <p className="text-zinc-500 font-medium mt-1 uppercase tracking-widest text-xs italic">Deep Work Modus Aktiv</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* POMODORO TIMER CARD */}
        <div className="bg-panel p-8 md:p-12 rounded-[3rem] shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col items-center relative overflow-hidden transition-all hover:shadow-lg">
          
          <div className="flex gap-2 mb-10 bg-canvas p-1.5 rounded-[2rem] border border-zinc-200 dark:border-zinc-800">
            {(Object.keys(MODES) as Array<keyof typeof MODES>).map((m) => (
              <button
                key={m}
                onClick={() => changeMode(m)}
                className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  mode === m 
                  ? 'bg-panel shadow-md text-cyan-500' 
                  : 'text-zinc-400 hover:text-ink'
                }`}
              >
                {MODES[m].icon} {MODES[m].label}
              </button>
            ))}
          </div>

          <div className={`text-9xl font-black font-mono tracking-tighter mb-12 ${MODES[mode].color} transition-colors tabular-nums select-none`}>
            {formatTime(timeLeft)}
          </div>

          <div className="flex gap-4 w-full max-w-sm relative z-10">
            <button 
              onClick={toggleTimer}
              className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] font-black text-xl text-white transition-all active:scale-95 shadow-xl ${
                isActive 
                ? 'bg-zinc-800 dark:bg-zinc-700' 
                : `${MODES[mode].bg} shadow-${mode === 'focus' ? 'red' : 'emerald'}-500/20`
              }`}
            >
              {isActive ? <><Pause fill="white" /> Pause</> : <><Play fill="white" /> Start</>}
            </button>
            <button 
              onClick={resetTimer}
              className="p-5 rounded-[2rem] font-black bg-canvas text-zinc-400 hover:text-ink transition-all active:rotate-180 duration-500 border border-zinc-200 dark:border-zinc-800"
            >
              <RotateCcw size={24} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 w-full h-1.5 bg-canvas">
            <motion.div 
              className={`h-full ${MODES[mode].bg}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
        </div>

        {/* BOX BREATHING CARD */}
        <div className="bg-zinc-900 dark:bg-zinc-100 p-8 md:p-12 rounded-[3rem] shadow-xl text-white dark:text-ink flex flex-col items-center justify-center relative overflow-hidden group border border-zinc-800 dark:border-zinc-200">
          <div className="absolute top-8 flex items-center gap-2">
            <Wind className="text-cyan-500" size={20} />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] opacity-60">Autonome Regulation</h2>
          </div>

          <div className="relative w-64 h-64 flex items-center justify-center my-12">
            <AnimatePresence>
              {breathingActive && (
                <motion.div
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{
                    scale: [1, 1.6, 1.6, 1],
                    opacity: [0.3, 0.6, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 16,
                    repeat: Infinity,
                    times: [0, 0.25, 0.5, 1],
                    ease: "easeInOut"
                  }}
                  className="absolute w-40 h-40 bg-cyan-500 rounded-full blur-3xl"
                />
              )}
            </AnimatePresence>
            
            <motion.div 
               animate={breathingActive ? { scale: [1, 1.3, 1.3, 1] } : { scale: 1 }}
               transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", times: [0, 0.25, 0.5, 1] }}
               className="w-40 h-40 bg-panel/10 dark:bg-zinc-200/50 backdrop-blur-xl rounded-full border-2 border-white/20 dark:border-zinc-400/30 flex items-center justify-center z-10 shadow-2xl"
            >
              <span className="font-black text-lg uppercase tracking-widest text-center px-4 leading-tight">{breathText}</span>
            </motion.div>
          </div>

          <button 
            onClick={() => setBreathingActive(!breathingActive)}
            className="px-10 py-4 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all hover:shadow-cyan-500/20"
          >
            {breathingActive ? 'Stop Exercise' : 'Box Breathing'}
          </button>
        </div>
      </div>

      {/* FOOTER TIP */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="mt-12 bg-panel p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center gap-6"
      >
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
          <Lightbulb size={32} />
        </div>
        <div>
          <h3 className="font-black text-lg mb-1 tracking-tight italic">Neuro-Tipp</h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed font-medium">
            Die 4-7-8 Technik aktiviert den <span className="text-ink font-bold">Vagus-Nerv</span>. Atme 4s ein, halte 7s und atme 8s geräuschvoll aus. Das senkt deinen Cortisolspiegel in weniger als 60 Sekunden.
          </p>
        </div>
      </motion.div>

    </div>
  );
}
