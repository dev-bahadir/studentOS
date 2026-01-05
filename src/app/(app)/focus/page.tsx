'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion } from 'framer-motion';

// Konfiguration der Timer-Modi (in Minuten)
const MODES = {
  focus: { label: 'Fokus 🔥', minutes: 25, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
  short: { label: 'Kurze Pause ☕', minutes: 5, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
  long: { label: 'Lange Pause 🌴', minutes: 15, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
};

export default function FocusPage() {
  const { user } = useAuth();
  
  // Timer States
  const [mode, setMode] = useState<'focus' | 'short' | 'long'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  
  // Breathing States
  const [breathingActive, setBreathingActive] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- TIMER LOGIK ---
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      handleComplete();
    }
    return () => clearTimeout(timerRef.current!);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODES[mode].minutes * 60);
  };

  const changeMode = (newMode: 'focus' | 'short' | 'long') => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(MODES[newMode].minutes * 60);
  };

  const handleComplete = async () => {
    setIsActive(false);
    // Sound abspielen (simuliert) oder Browser Notification
    if (Notification.permission === 'granted') {
      new Notification("ElectroBrain", { body: "Zeit abgelaufen! ⏰" });
    } else {
      alert("Zeit abgelaufen! ⏰");
    }

    // XP vergeben nur bei Fokus-Session
    if (mode === 'focus' && user) {
      await supabase.rpc('increment_xp', { x: 25, row_id: user.id });
      // Reset auf Pause
      changeMode('short');
    } else {
      // Reset auf Fokus
      changeMode('focus');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Notification Permission anfragen
  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  const progress = ((MODES[mode].minutes * 60 - timeLeft) / (MODES[mode].minutes * 60)) * 100;

  return (
    <div className="p-4 md:p-10 max-w-4xl mx-auto min-h-screen pb-40">
      
      <h1 className="text-3xl font-black text-gray-800 mb-8 flex items-center gap-2">
        <span>🧘</span> Fokus Zone
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* --- POMODORO TIMER --- */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center relative overflow-hidden">
          {/* Progress Bar Background */}
          <div 
            className={`absolute bottom-0 left-0 h-2 transition-all duration-1000 ${mode === 'focus' ? 'bg-red-500' : 'bg-green-500'}`} 
            style={{ width: `${progress}%` }}
          />

          <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-2xl">
            {(Object.keys(MODES) as Array<keyof typeof MODES>).map((m) => (
              <button
                key={m}
                onClick={() => changeMode(m)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === m ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 dark:text-gray-400 hover:text-gray-600'
                }`}
              >
                {MODES[m].label}
              </button>
            ))}
          </div>

          <div className={`text-8xl font-black font-mono tracking-tighter mb-8 ${MODES[mode].color} transition-colors`}>
            {formatTime(timeLeft)}
          </div>

          <div className="flex gap-4 w-full">
            <button 
              onClick={toggleTimer}
              className={`flex-1 py-4 rounded-2xl font-bold text-white text-lg transition active:scale-95 shadow-lg ${
                isActive ? 'bg-gray-900' : 'bg-blue-600 shadow-blue-600/30'
              }`}
            >
              {isActive ? 'Pause ⏸' : 'Start ▶'}
            </button>
            <button 
              onClick={resetTimer}
              className="px-6 py-4 rounded-2xl font-bold bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
            >
              ↺
            </button>
          </div>

          <p className="mt-6 text-xs text-gray-600 dark:text-gray-400 font-medium">
            {mode === 'focus' ? 'Bleib dran! +25 XP bei Abschluss.' : 'Entspann dich. Du hast es dir verdient.'}
          </p>
        </div>

        {/* --- BREATHING EXERCISE --- */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-700 p-8 rounded-3xl shadow-xl text-white flex flex-col items-center justify-center relative overflow-hidden">
          <h2 className="text-xl font-bold mb-2">Box Breathing</h2>
          <p className="text-white/70 text-sm mb-8 text-center">Beruhigt das Nervensystem vor Prüfungen.</p>

          {/* Animierter Kreis */}
          <div className="relative w-48 h-48 flex items-center justify-center mb-8">
            <motion.div
              animate={breathingActive ? {
                scale: [1, 1.5, 1.5, 1], // Einatmen, Halten, Ausatmen, Halten
                opacity: [0.5, 1, 1, 0.5],
              } : { scale: 1, opacity: 0.5 }}
              transition={{
                duration: 16, // 4s Ein, 4s Halten, 4s Aus, 4s Halten
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.25, 0.5, 1]
              }}
              className="absolute w-32 h-32 bg-white rounded-full blur-xl"
            />
            <motion.div 
               animate={breathingActive ? { scale: [1, 1.2, 1.2, 1] } : { scale: 1 }}
               transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", times: [0, 0.25, 0.5, 1] }}
               className="w-32 h-32 bg-white/20 backdrop-blur-md rounded-full border border-white/30 flex items-center justify-center z-10"
            >
              <span className="font-bold text-lg">{breathingActive ? 'Atmen...' : 'Start'}</span>
            </motion.div>
          </div>

          <button 
            onClick={() => setBreathingActive(!breathingActive)}
            className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-bold shadow-lg active:scale-95 transition"
          >
            {breathingActive ? 'Beenden' : 'Übung starten'}
          </button>
        </div>
      </div>

      {/* TIPP SECTION */}
      <div className="mt-8 bg-gray-50 p-6 rounded-3xl border border-gray-100">
        <h3 className="font-bold text-gray-700 mb-2">💡 Profi-Tipp: Die 4-7-8 Technik</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          Wenn du nervös bist: 4 Sekunden durch die Nase einatmen, 7 Sekunden Luft anhalten, 8 Sekunden geräuschvoll durch den Mund ausatmen. Wiederhole das 4 Mal.
        </p>
      </div>

    </div>
  );
}