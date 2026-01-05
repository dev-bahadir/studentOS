'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient'; // ✅ RICHTIG
import { Loader2, AlertCircle, CheckCircle2, KeyRound, UserPlus, LogIn, Github } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  

  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset States
  const [showResetField, setShowResetField] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // --- 1. LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message === "Invalid login credentials" ? "Falsche E-Mail oder Passwort." : error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  // --- 2. REGISTRIERUNG (Inline) ---
  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    // Einfache Validierung
    if(password.length < 6) {
        setError("Passwort muss mindestens 6 Zeichen haben.");
        setLoading(false);
        return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccessMessage('Account erstellt! Bitte bestätige deine E-Mail.');
    }
    setLoading(false);
  };

  // --- 3. PASSWORT RESET (Inline) ---
  const handleResetPassword = async () => {
    if (!resetEmail) {
      setResetMessage("Bitte gib oben deine E-Mail ein.");
      return;
    }
    
    setLoading(true);
    setResetMessage(null);
    
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      setResetMessage("Fehler: " + error.message);
    } else {
      setResetMessage("Check deine E-Mails! Link ist raus.");
      setTimeout(() => setShowResetField(false), 4000);
    }
    setLoading(false);
  };

  const handleSocialLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 transition-colors">
        
        {/* HEADER */}
        <div className="text-center mb-8">
           <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">
            🧠
          </div>
          <h1 className="text-2xl font-bold text-ink dark:text-zinc-100">ElectroBrain OS</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Willkommen zurück</p>
        </div>

        {/* FEEDBACK BOXEN */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm animate-in fade-in">
            <AlertCircle size={18} /> {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 text-green-600 dark:text-green-400 text-sm animate-in fade-in">
            <CheckCircle2 size={18} /> {successMessage}
          </div>
        )}

        {/* LOGIN FORMULAR */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              required
              suppressHydrationWarning={true}
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition text-ink dark:text-zinc-100 placeholder-gray-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.com"
            />
          </div>

          <div>
            <input
              type="password"
              required
              suppressHydrationWarning={true}
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition text-ink dark:text-zinc-100 placeholder-gray-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><LogIn size={20}/> Anmelden</>}
          </button>
        </form>

        {/* SOCIAL LOGIN */}
        <div className="mt-4">
             <button
                onClick={handleSocialLogin}
                type="button"
                className="flex items-center justify-center gap-2 w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition text-gray-700 dark:text-zinc-100 font-medium text-sm"
              >
                <Github size={18} /> GitHub Login
             </button>
        </div>

        {/* FOOTER BEREICH (Reset & Register) */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 space-y-4">
          
          {/* Passwort Reset Inline */}
          {!showResetField ? (
            <div className="flex justify-between items-center text-sm">
                <button 
                  onClick={() => setShowResetField(true)}
                  className="text-gray-500 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition"
                >
                  Passwort vergessen?
                </button>
                 <button 
                  onClick={handleSignUp}
                  type="button"
                  className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1"
                >
                  <UserPlus size={16}/> Registrieren
                </button>
            </div>
          ) : (
            <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-xl border border-cyan-100 dark:border-cyan-800 animate-in slide-in-from-top-2">
              <p className="text-xs text-cyan-700 dark:text-cyan-300 font-bold mb-2 flex items-center gap-2">
                <KeyRound size={14}/> Passwort zurücksetzen
              </p>
              <input
                type="email"
                placeholder="E-Mail für Reset eingeben"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full p-2 text-sm bg-white dark:bg-gray-900 border border-cyan-200 dark:border-cyan-700 rounded-lg outline-none mb-2 text-ink dark:text-zinc-100"
              />
              {resetMessage && <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium mb-2">{resetMessage}</p>}
              <div className="flex gap-2">
                <button 
                  onClick={handleResetPassword}
                  className="flex-1 bg-cyan-600 text-white text-xs py-2 rounded-lg font-bold hover:bg-cyan-700 transition"
                >
                  Link senden
                </button>
                <button 
                  onClick={() => setShowResetField(false)}
                  className="px-3 text-xs text-zinc-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
