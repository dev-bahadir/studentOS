'use client';

import { useTheme } from '@/components/providers/ThemeProvider';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
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
  Bell,
  Timer
} from 'lucide-react';

// Zentrale Glass-Klasse für Konsistenz
const glassClass = "bg-white/5 dark:bg-zinc-900/20 backdrop-blur-xl border border-white/10 dark:border-zinc-800/50 shadow-xl";

const MODES = {
  focus: { label: 'Fokus', minutes: 25, color: 'text-red-500', bg: 'bg-red-500', glow: 'shadow-red-500/30', icon: <Flame size={20} /> },
  short: { label: 'Pause', minutes: 5, color: 'text-emerald-500', bg: 'bg-emerald-500', glow: 'shadow-emerald-500/30', icon: <Coffee size={20} /> },
  long: { label: 'Break', minutes: 15, color: 'text-blue-500', bg: 'bg-blue-500', glow: 'shadow-blue-500/30', icon: <Wind size={20} /> },
};

export default function FocusPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<keyof typeof MODES>('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.minutes * 60);
  const [isActive, setIsActive] = useState(false);
  
  // Breathing Logic States
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathText, setBreathText] = useState('Bereit?');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- LOGIC 1: BROWSER PERMISSIONS ---
  useEffect(() => {
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // --- LOGIC 2: TAB TITLE SYNC ---
  useEffect(() => {
    document.title = isActive 
      ? `(${formatTime(timeLeft)}) ${MODES[mode].label}` 
      : "ElectroBrain OS";
  }, [timeLeft, isActive, mode]);

  // --- LOGIC 3: PRECISE TIMER ---
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

  // --- LOGIC 4: BOX BREATHING (4-4-4-4) ---
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

  // --- HANDLERS ---
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
    
    // Notification
    if (Notification.permission === 'granted') {
      new Notification("ElectroBrain Fokus", { 
        body: mode === 'focus' ? "Session beendet! Zeit für eine Pause." : "Pause vorbei. Weiter geht's!",
        silent: false
      });
    }

    // XP Logic
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

  const progress = ((MODES[mode].minutes * 60 - timeLeft) / (MODES[mode].minutes * 60)) * 100;

  return (
    /* LAYOUT FIX: Volle Breite, sauberes Padding, kein Scroll-Overflow */
    <div className="w-full max-w-[1920px] p-4 md:p-8 lg:p-12 min-h-screen pb-40 bg-transparent text-zinc-900 dark:text-zinc-100 overflow-x-hidden">
      
      {/* HEADER */}
      <header className={`mb-12 p-8 rounded-[3rem] ${glassClass} flex items-center justify-between`}>
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter flex items-center gap-4 text-zinc-900 dark:text-white">
             <div className="p-3 bg-red-500 rounded-2xl shadow-lg shadow-red-500/20">
               <Timer className="text-white" size={32} />
             </div>
             Fokus Zone
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-bold mt-2 text-sm uppercase tracking-widest pl-2">Deep Work Modus</p>
        </div>
        
        {/* Visual Indicator Active */}
        <div className={`hidden md:flex items-center gap-3 px-6 py-3 rounded-2xl border ${isActive ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-400'}`}>
           <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-zinc-400'}`} />
           <span className="text-xs font-black uppercase tracking-widest">{isActive ? 'Timer läuft' : 'Pausiert'}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* LEFT: POMODORO TIMER */}
        <div className={`p-8 md:p-12 rounded-[3rem] ${glassClass} flex flex-col items-center relative overflow-hidden transition-all group`}>
          
          {/* Mode Selector */}
          <div className="flex flex-wrap justify-center gap-3 mb-10 bg-black/5 dark:bg-black/20 p-2 rounded-[2rem] border border-white/5">
            {(Object.keys(MODES) as Array<keyof typeof MODES>).map((m) => (
              <button
                key={m}
                onClick={() => changeMode(m)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  mode === m 
                  ? 'bg-white dark:bg-zinc-800 shadow-md text-zinc-900 dark:text-white scale-105' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {MODES[m].icon} {MODES[m].label}
              </button>
            ))}
          </div>

          {/* Time Display */}
          <div className={`text-9xl md:text-[10rem] font-black font-mono tracking-tighter mb-12 ${MODES[mode].color} transition-colors tabular-nums select-none drop-shadow-2xl`}>
            {formatTime(timeLeft)}
          </div>

          {/* Controls */}
          <div className="flex gap-6 w-full max-w-md relative z-10">
            <button 
              onClick={toggleTimer}
              className={`flex-1 flex items-center justify-center gap-3 py-6 rounded-[2.5rem] font-black text-xl text-white transition-all active:scale-95 shadow-xl hover:brightness-110 ${
                isActive 
                ? 'bg-zinc-900 dark:bg-zinc-700' 
                : `${MODES[mode].bg} ${MODES[mode].glow}`
              }`}
            >
              {isActive ? <><Pause fill="white" /> Pause</> : <><Play fill="white" /> Start</>}
            </button>
            
            <button 
              onClick={resetTimer}
              className="p-6 rounded-[2.5rem] font-black bg-white dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all active:rotate-180 duration-500 shadow-lg"
            >
              <RotateCcw size={28} />
            </button>
          </div>

          {/* Background Progress Bar */}
          <div className="absolute bottom-0 left-0 w-full h-2 bg-black/10 dark:bg-white/5">
            <motion.div 
              className={`h-full ${MODES[mode].bg}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
        </div>

        {/* RIGHT: BOX BREATHING */}
        <div className={`p-8 md:p-12 rounded-[3rem] ${glassClass} flex flex-col items-center justify-center relative overflow-hidden group border-cyan-500/10`}>
          
          <div className="absolute top-8 left-8 flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-500"><Wind size={20} /></div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Autonome Regulation</h2>
          </div>

          <div className="relative w-72 h-72 flex items-center justify-center my-12">
            <AnimatePresence>
              {breathingActive && (
                <motion.div
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{
                    scale: [1, 1.8, 1.8, 1],
                    opacity: [0.2, 0.5, 0.5, 0.2],
                  }}
                  transition={{
                    duration: 16,
                    repeat: Infinity,
                    times: [0, 0.25, 0.5, 1],
                    ease: "easeInOut"
                  }}
                  className="absolute w-40 h-40 bg-cyan-500 rounded-full blur-[60px]"
                />
              )}
            </AnimatePresence>
            
            <motion.div 
               animate={breathingActive ? { scale: [1, 1.4, 1.4, 1], rotate: [0, 5, -5, 0] } : { scale: 1, rotate: 0 }}
               transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", times: [0, 0.25, 0.5, 1] }}
               className="w-48 h-48 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-2xl rounded-full border-4 border-white dark:border-zinc-700 flex items-center justify-center z-10 shadow-[0_0_40px_rgba(6,182,212,0.3)]"
            >
              <div className="text-center">
                 <span className="block font-black text-2xl uppercase tracking-widest text-zinc-900 dark:text-white leading-tight">{breathText}</span>
                 {breathingActive && <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mt-1">4 - 4 - 4 - 4</span>}
              </div>
            </motion.div>
          </div>

          <button 
            onClick={() => setBreathingActive(!breathingActive)}
            className={`px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all ${
                breathingActive 
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black' 
                : 'bg-cyan-500 text-white shadow-cyan-500/30 hover:bg-cyan-400'
            }`}
          >
            {breathingActive ? 'Übung Beenden' : 'Box Breathing Starten'}
          </button>
        </div>
      </div>

      {/* FOOTER TIP */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className={`mt-8 p-8 rounded-[3rem] ${glassClass} flex flex-col md:flex-row items-center gap-8 border-amber-500/20`}
      >
        <div className="w-20 h-20 bg-amber-500 text-white rounded-[2rem] flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 rotate-3">
          <Lightbulb size={40} fill="currentColor" className="text-white" />
        </div>
        <div>
          <h3 className="font-black text-xl mb-2 tracking-tight text-zinc-900 dark:text-white">Neuro-Wissenschaftlicher Fakt</h3>
          <p className="text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed max-w-3xl">
            Die <span className="text-amber-500 font-bold">4-7-8 Technik</span> aktiviert den Vagus-Nerv sofort. 
            Tiefes Atmen signalisiert deinem Gehirn Sicherheit, senkt den Cortisolspiegel in unter 60 Sekunden und bereitet dich optimal auf komplexe Lerninhalte vor.
          </p>
        </div>
      </motion.div>

    </div>
  );
}