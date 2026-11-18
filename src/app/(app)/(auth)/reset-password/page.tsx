'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2, Lock, Save, ArrowLeft, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResetPasswordPage() {
  const router = useRouter();

  // States
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Optional: Prüfen ob Session da ist (Sicherheits-Check)
  useEffect(() => {
    supabase.auth.getSession().then((res: any) => {
      if (!res?.data?.session) {
        // Falls kein Token in der URL war, ist die Session null.
      }
    });
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMessage(null);

    // Validierung
    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Das Passwort muss mindestens 8 Zeichen haben.' });
      setLoading(false); return;
    }

    if (password !== passwordConfirm) {
      setMessage({ type: 'error', text: 'Die Passwörter stimmen nicht überein.' });
      setLoading(false); return;
    }

    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
    } else {
      setMessage({ type: 'success', text: 'Passwort erfolgreich geändert! Leite weiter...' });
      // Kurze Verzögerung für UX
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0e12] text-white p-4 relative overflow-hidden font-sans">
      
      {/* 1. ANIMATED BACKGROUND (Konsistent zur Login Page) */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#0a0e12] to-[#0f1419]" />
         <motion.div 
           animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
           transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
           className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(0,212,255,0.08)_0%,transparent_70%)] rounded-full blur-3xl"
         />
         <motion.div 
           animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
           transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
           className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(0,212,255,0.05)_0%,transparent_70%)] rounded-full blur-3xl"
         />
      </div>

      {/* 2. CARD CONTAINER */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden p-8 md:p-10">
          
          {/* HEADER */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-[#00d4ff] to-blue-600 rounded-2xl mb-4 shadow-lg shadow-cyan-500/30">
              <KeyRound className="text-white w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Neues Passwort</h1>
            <p className="text-zinc-500 font-medium mt-1">Sichere deinen Account ab.</p>
          </div>

          {/* FEEDBACK MESSAGES */}
          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className={`mb-6 p-4 rounded-xl flex items-start gap-3 border ${
                  message.type === 'error' 
                    ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                    : 'bg-green-500/10 border-green-500/20 text-green-500'
                }`}
              >
                {message.type === 'error' ? <AlertCircle size={18} className="mt-0.5" /> : <CheckCircle2 size={18} className="mt-0.5" />}
                <p className="text-sm font-bold">{message.text}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FORM */}
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            
            {/* Password Input */}
            <div className="space-y-2">
               <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Neues Passwort</label>
               <div className="relative group">
                 <Lock className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-[#00d4ff] transition-colors" size={20} />
                 <input 
                   type="password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   placeholder="Mindestens 8 Zeichen"
                   className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-[#00d4ff]/50 focus:border-[#00d4ff] transition-all font-medium placeholder:text-zinc-600 dark:text-white"
                   required
                 />
               </div>
            </div>

            {/* Confirm Input */}
            <div className="space-y-2">
               <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Wiederholen</label>
               <div className="relative group">
                 <CheckCircle2 className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-[#00d4ff] transition-colors" size={20} />
                 <input 
                   type="password"
                   value={passwordConfirm}
                   onChange={(e) => setPasswordConfirm(e.target.value)}
                   placeholder="Passwort bestätigen"
                   className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-[#00d4ff]/50 focus:border-[#00d4ff] transition-all font-medium placeholder:text-zinc-600 dark:text-white"
                   required
                 />
               </div>
            </div>

            {/* Security Hint */}
            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
               <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">💡 Info</p>
               <p className="text-xs text-zinc-400">Verwende Groß-/Kleinschreibung und Zahlen für maximale Sicherheit.</p>
            </div>

            {/* Submit Button */}
            <button 
               type="submit" disabled={loading}
               className="w-full py-3.5 bg-gradient-to-br from-[#00d4ff] to-[#00a8d8] text-[#0a0e12] font-bold rounded-xl uppercase tracking-widest hover:translate-y-[-2px] hover:shadow-[0_12px_32px_rgba(0,212,255,0.2)] active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
            >
               <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
               {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Speichern</>}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-center">
             <button onClick={() => router.push('/login')} className="flex items-center justify-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors mx-auto">
                <ArrowLeft size={16}/> Zurück zum Login
             </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}