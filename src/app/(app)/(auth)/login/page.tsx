'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, Settings, Shield, BarChart3, Lock, Mail, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();

  // States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Remember Me (Nur einmal beim Mounten)
  useEffect(() => {
    // Sicherstellen, dass wir im Browser sind
    if (typeof window !== 'undefined') {
        const savedEmail = localStorage.getItem('electro_saved_email');
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
    }
  }, []);

  // --- LOGIK ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); 
    setError(null);

    try {
      if (rememberMe) {
          localStorage.setItem('electro_saved_email', email);
      } else {
          localStorage.removeItem('electro_saved_email');
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (authError) throw authError;

      if (data.session) {
        // Erfolgreich eingeloggt
        router.refresh(); // Zuerst refresh, um Auth-Status in Server-Components zu updaten
        router.push('/dashboard'); 
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || 'Login fehlgeschlagen. Bitte Daten prüfen.');
      setLoading(false);
    }
  };

  const handleSocialLogin = async () => {
    try {
        await supabase.auth.signInWithOAuth({ 
          provider: 'github', 
          options: { 
            redirectTo: `${window.location.origin}/auth/callback` 
          } 
        });
    } catch (err: any) {
        setError("Social Login fehlgeschlagen: " + err.message);
    }
  };

  // --- RENDERING ---
  return (
    <div className="min-h-screen w-full flex bg-[#0a0e12] text-white overflow-hidden relative font-sans">
      
      {/* ANIMATED BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#0a0e12] to-[#0f1419]" />
         <motion.div 
           animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
           transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
           className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(0,212,255,0.08)_0%,transparent_70%)] rounded-full blur-3xl"
         />
         <motion.div 
           animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
           transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
           className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(0,212,255,0.05)_0%,transparent_70%)] rounded-full blur-3xl"
         />
      </div>

      {/* --- LEFT SIDE: HERO (Desktop Only) --- */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center relative z-10 bg-gradient-to-b from-[#0f1419]/95 to-[#0a0e12]/95 p-12 overflow-hidden border-r border-[#00d4ff]/10">
         {/* Pulse Effect Background */}
         <motion.div 
           animate={{ scale: [1, 1.1, 1] }}
           transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
           className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(0,212,255,0.03)_0%,transparent_50%)] pointer-events-none"
         />
         
         <div className="max-w-md text-center z-20">
            <motion.h1 
              initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
              className="text-6xl font-black mb-6 tracking-tight bg-gradient-to-br from-[#00d4ff] to-[#00a8d8] bg-clip-text text-transparent drop-shadow-lg"
            >
              ⚡ electrobrain
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }}
              className="text-lg text-zinc-400 mb-12 font-light leading-relaxed"
            >
              Willkommen bei der intelligenten Engineering-Plattform. <br/>
              Synchronisiere dein Wissen.
            </motion.p>

            <div className="flex flex-col gap-4 text-left">
               {[
                 { icon: Settings, text: "Echtzeit-Zusammenarbeit" },
                 { icon: Shield, text: "Enterprise-Sicherheit" },
                 { icon: BarChart3, text: "Erweiterte Analytics" }
               ].map((item, idx) => (
                 <motion.div 
                   key={idx}
                   initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + (idx * 0.1) }}
                   className="flex items-center gap-4 p-4 rounded-xl bg-[#00d4ff]/5 border border-[#00d4ff]/15 hover:bg-[#00d4ff]/10 hover:border-[#00d4ff]/30 hover:translate-x-2 transition-all duration-300 group cursor-default"
                 >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#00a8d8] flex items-center justify-center text-black shadow-lg shadow-cyan-500/20">
                      <item.icon size={16} strokeWidth={3} />
                    </div>
                    <span className="text-zinc-300 font-medium group-hover:text-white transition-colors">{item.text}</span>
                 </motion.div>
               ))}
            </div>
         </div>
      </div>

      {/* --- RIGHT SIDE: FORM --- */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 relative z-20">
         <motion.div 
           initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
           className="w-full max-w-[400px]"
         >
            <div className="mb-10 text-center lg:text-left">
               <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">Willkommen zurück</h2>
               <p className="text-zinc-500">Melde dich an, um fortzufahren</p>
            </div>

            {/* Error / Success Messages */}
            <AnimatePresence>
               {error && (
                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-3">
                    <AlertCircle size={18} /> {error}
                 </motion.div>
               )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-6">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">E-Mail Adresse</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-[#00d4ff] transition-colors" size={20} />
                    <input 
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="deine@email.com"
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-[#00d4ff]/25 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:bg-[#00d4ff]/10 focus:border-[#00d4ff] focus:shadow-[0_0_20px_rgba(0,212,255,0.2)] transition-all duration-300 backdrop-blur-md"
                      required
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Passwort</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-[#00d4ff] transition-colors" size={20} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3 bg-white/5 border border-[#00d4ff]/25 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:bg-[#00d4ff]/10 focus:border-[#00d4ff] focus:shadow-[0_0_20px_rgba(0,212,255,0.2)] transition-all duration-300 backdrop-blur-md"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-zinc-500 hover:text-[#00d4ff] transition-colors">
                       {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
               </div>

               <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer group">
                     <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${rememberMe ? 'bg-[#00d4ff] border-[#00d4ff]' : 'bg-white/5 border-[#00d4ff]/25 group-hover:border-[#00d4ff]'}`}>
                        {rememberMe && <CheckCircle2 size={12} className="text-[#0a0e12]" />}
                     </div>
                     <input type="checkbox" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                     <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors">Mich merken</span>
                  </label>
                  <Link href="/reset-password" className="text-[#00d4ff] hover:text-[#00b8d4] hover:underline font-medium transition-colors">
                    Passwort vergessen?
                  </Link>
               </div>

               <button 
                  type="submit" disabled={loading}
                  className="w-full py-4 bg-gradient-to-br from-[#00d4ff] to-[#00a8d8] text-[#0a0e12] font-bold rounded-lg uppercase tracking-widest hover:translate-y-[-2px] hover:shadow-[0_12px_32px_rgba(0,212,255,0.2)] active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
               >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                  {loading ? <Loader2 className="animate-spin" /> : 'Anmelden'}
               </button>

               <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0a0e12] px-2 text-zinc-600 font-bold">Oder</span></div>
               </div>

               <button 
                  type="button" 
                  onClick={handleSocialLogin}
                  className="w-full py-3 bg-white/5 border border-zinc-700 hover:bg-white/10 text-white rounded-lg flex items-center justify-center gap-3 transition-all duration-300 hover:border-zinc-500 font-medium"
               >
                  <Github size={20} /> Mit GitHub anmelden
               </button>

               <p className="text-center text-zinc-500 text-sm mt-6">
                  Noch kein Konto? 
                  <Link href="/register" className="text-[#00d4ff] font-bold hover:underline ml-1">
                    Jetzt registrieren
                  </Link>
               </p>
            </form>
         </motion.div>
      </div>
    </div>
  );
}