'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  Loader2, AlertCircle, CheckCircle2, KeyRound, 
  LogIn, Github, Mail, Lock, ArrowLeft 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();

  // States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showResetField, setShowResetField] = useState(false);

  // --- LOGIK (komprimiert für Übersichtlichkeit) ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      if (data.session) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true); setError(null);
    if (password.length < 6) { setError("Passwort zu kurz (min. 6)."); setLoading(false); return; }
    const { error } = await supabase.auth.signUp({ 
        email, password, 
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` } 
    });
    if (error) setError(error.message);
    else setSuccessMessage('Account erstellt! Bitte E-Mail bestätigen.');
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) { setError("Bitte E-Mail für Reset eingeben."); return; }
    setLoading(true); setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) setError(error.message);
    else setSuccessMessage("Reset-Link gesendet! Prüfe deine Mails.");
    setLoading(false);
    setTimeout(() => setShowResetField(false), 4000);
  };

  const handleSocialLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${window.location.origin}/auth/callback` } });
  };

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* BACKGROUND ELEMENTS (Subtile Deko) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[420px] relative z-10"
      >
        
        {/* CARD CONTAINER */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden p-8 md:p-10">
          
          {/* HEADER */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl mb-6 shadow-lg shadow-cyan-500/30">
              <BrainIcon className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2 bg-gradient-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-500 bg-clip-text text-transparent">
              ElectroBrain
            </h1>
            <p className="text-zinc-500 font-medium">Dein zweites Gehirn wartet.</p>
          </div>

          {/* ALERTS */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={18} />
                <p className="text-red-700 dark:text-red-300 text-sm font-medium leading-relaxed">{error}</p>
              </motion.div>
            )}
            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-xl flex items-start gap-3"
              >
                <CheckCircle2 className="text-green-500 mt-0.5 shrink-0" size={18} />
                <p className="text-green-700 dark:text-green-300 text-sm font-medium leading-relaxed">{successMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MAIN FORM */}
          <AnimatePresence mode="wait">
            {!showResetField ? (
              <motion.form 
                key="login-form"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleLogin} className="space-y-4"
              >
                <div className="space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 text-zinc-400 group-focus-within:text-cyan-500 transition-colors" size={20} />
                    <input 
                      type="email" 
                      value={email} onChange={(e) => setEmail(e.target.value)} 
                      placeholder="name@beispiel.de" 
                      className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-medium placeholder:text-zinc-400"
                      required
                    />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 text-zinc-400 group-focus-within:text-cyan-500 transition-colors" size={20} />
                    <input 
                      type="password" 
                      value={password} onChange={(e) => setPassword(e.target.value)} 
                      placeholder="••••••••" 
                      className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-medium placeholder:text-zinc-400"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button type="button" onClick={() => setShowResetField(true)} className="text-xs font-bold text-zinc-500 hover:text-cyan-500 transition-colors">
                    Passwort vergessen?
                  </button>
                </div>

                <button 
                  type="submit" disabled={loading}
                  className="w-full py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-xl shadow-zinc-200 dark:shadow-none"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <><LogIn size={20} /> Anmelden</>}
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200 dark:border-zinc-800" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-zinc-900 px-2 text-zinc-400 font-bold">Oder</span></div>
                </div>

                <button 
                  type="button" onClick={handleSocialLogin}
                  className="w-full py-3.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
                >
                  <Github size={20} /> Mit GitHub fortfahren
                </button>

                <p className="text-center text-sm text-zinc-500 mt-6 font-medium">
                  Neu hier? <button type="button" onClick={handleSignUp} className="text-cyan-500 hover:text-cyan-600 hover:underline">Account erstellen</button>
                </p>
              </motion.form>
            ) : (
              // RESET VIEW
              <motion.div 
                key="reset-form"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <button onClick={() => setShowResetField(false)} className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 mb-4 transition-colors">
                  <ArrowLeft size={16}/> Zurück zum Login
                </button>
                
                <div className="text-center space-y-2">
                   <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-2 text-zinc-500"><KeyRound size={24}/></div>
                   <h3 className="text-xl font-bold">Passwort zurücksetzen</h3>
                   <p className="text-sm text-zinc-500">Gib deine E-Mail ein, wir schicken dir einen Link.</p>
                </div>

                <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 text-zinc-400 group-focus-within:text-cyan-500 transition-colors" size={20} />
                    <input 
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="deine@email.com" 
                      className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-medium"
                    />
                </div>

                <button 
                  onClick={handleResetPassword} disabled={loading}
                  className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : 'Link anfordern'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
        
        {/* FOOTER */}
        <p className="text-center text-xs text-zinc-400 mt-8 font-medium">
          &copy; {new Date().getFullYear()} ElectroBrain OS. Secure & Encrypted.
        </p>

      </motion.div>
    </div>
  );
}

// Kleines Brain Icon Helper (oder importiere Brain von lucide-react direkt)
function BrainIcon({className}: {className?: string}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.937-.5" />
      <path d="M19.937 17.5A4 4 0 0 1 18 18" />
    </svg>
  );
}