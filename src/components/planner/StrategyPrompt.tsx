'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Clock, AlertTriangle, Zap, CheckCircle, ChevronRight, X } from 'lucide-react';
import { useStrategyCalculator, KnowledgeLevel, TimeWindow, Urgency } from '@/hooks/useStrategyCalculator';

const glassClass = "bg-zinc-900/95 backdrop-blur-xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/10";

interface StrategyPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: { title: string; mode: string; duration: number; energy: number }) => void;
}

export function StrategyPrompt({ isOpen, onClose, onComplete }: StrategyPromptProps) {
  const { calculateStrategy } = useStrategyCalculator();
  const [step, setStep] = useState(1);
  
  // Answers
  const [knowledge, setKnowledge] = useState<KnowledgeLevel>('partial');
  const [time, setTime] = useState<TimeWindow>('medium');
  const [urgency, setUrgency] = useState<Urgency>('memo');

  // Result
  const [result, setResult] = useState<any>(null);

  const handleNext = () => setStep(prev => prev + 1);

  const calculate = () => {
    const res = calculateStrategy(knowledge, time, urgency);
    setResult(res);
    setStep(4);
  };

  const finish = () => {
    if (!result) return;
    onComplete({
        title: `Auto-Mission: ${result.mode.toUpperCase()}`,
        mode: result.mode,
        duration: result.duration,
        energy: result.energyReq
    });
    onClose();
    // Reset for next time
    setTimeout(() => { setStep(1); setResult(null); }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`w-full max-w-lg rounded-3xl overflow-hidden ${glassClass} text-white`}
      >
        {/* HEADER */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-cyan-950/30">
            <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse" />
                <span className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest">Tactical Advisor v1.0</span>
            </div>
            <button onClick={onClose}><X size={20} className="text-zinc-500 hover:text-white" /></button>
        </div>

        <div className="p-8 min-h-[300px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
                
                {/* STEP 1: KNOWLEDGE */}
                {step === 1 && (
                    <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                        <h3 className="text-2xl font-black text-center mb-8">Wie gut kennst du das Thema?</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <OptionBtn icon={Brain} label="Neuland (0%)" sub="Ich habe keine Ahnung." onClick={() => { setKnowledge('new'); handleNext(); }} />
                            <OptionBtn icon={Brain} label="Geht so (50%)" sub="Ich verstehe es grob, aber hake." onClick={() => { setKnowledge('partial'); handleNext(); }} />
                            <OptionBtn icon={Brain} label="Profi (90%)" sub="Ich kann es erklären." onClick={() => { setKnowledge('good'); handleNext(); }} />
                        </div>
                    </motion.div>
                )}

                {/* STEP 2: TIME */}
                {step === 2 && (
                    <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                        <h3 className="text-2xl font-black text-center mb-8">Wie viel Zeit hast du jetzt?</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <OptionBtn icon={Clock} label="Quickie (< 30 min)" onClick={() => { setTime('short'); handleNext(); }} />
                            <OptionBtn icon={Clock} label="Focus (30 - 90 min)" onClick={() => { setTime('medium'); handleNext(); }} />
                            <OptionBtn icon={Clock} label="Deep Dive (> 2 Std)" onClick={() => { setTime('long'); handleNext(); }} />
                        </div>
                    </motion.div>
                )}

                {/* STEP 3: URGENCY */}
                {step === 3 && (
                    <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                        <h3 className="text-2xl font-black text-center mb-8">Wann ist die Deadline?</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <OptionBtn icon={Clock} label="Weit weg (> 2 Wochen)" sub="Preparation Phase" onClick={() => { setUrgency('prep'); calculate(); }} />
                            <OptionBtn icon={AlertTriangle} label="Bald (1-2 Wochen)" sub="Memorizing Phase" onClick={() => { setUrgency('memo'); calculate(); }} />
                            <OptionBtn icon={Zap} label="PANIK (< 1 Woche)" sub="Survival Mode" active onClick={() => { setUrgency('panic'); calculate(); }} />
                        </div>
                    </motion.div>
                )}

                {/* STEP 4: RESULT */}
                {step === 4 && result && (
                    <motion.div key="result" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                        <div className="mb-6 inline-block p-4 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                            <Zap size={48} />
                        </div>
                        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Empfohlene Strategie</h2>
                        <h3 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">{result.mode}</h3>
                        
                        <div className="bg-white/5 rounded-2xl p-6 mb-8 text-left border border-white/10">
                            <p className="text-zinc-300 font-medium leading-relaxed">
                                <span className="text-cyan-400 font-bold">Plan:</span> {result.reason}
                            </p>
                            <div className="mt-4 flex gap-4 text-xs font-bold uppercase tracking-widest text-zinc-500">
                                <span>⏱ {result.duration} Min</span>
                                <span>🔋 Energie: {result.energyReq}/3</span>
                            </div>
                        </div>

                        <button 
                            onClick={finish}
                            className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center gap-2"
                        >
                            Mission Starten <ChevronRight />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-zinc-800 w-full">
            <motion.div 
                className="h-full bg-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${(step / 4) * 100}%` }}
            />
        </div>
      </motion.div>
    </div>
  );
}

function OptionBtn({ icon: Icon, label, sub, onClick, active }: any) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-4 p-4 rounded-2xl text-left transition-all border ${active ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}`}
        >
            <div className={`p-3 rounded-xl ${active ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                <Icon size={20} />
            </div>
            <div>
                <div className="font-bold text-lg">{label}</div>
                {sub && <div className="text-xs text-zinc-500 font-medium">{sub}</div>}
            </div>
        </button>
    );
}