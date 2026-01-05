'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, AlertCircle, CheckCircle2, KeyRound, UserPlus, LogIn, Github } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  // Login States
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset States
  const [showResetField, setShowResetField] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // --- 1. LOGIN ---
// Ersetze die alte handleLogin Funktion hiermit:
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  console.log("🕵️ START: Login Versuch gestartet für:", email);

  try {
    // 1. Authentifizierung versuchen
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("🕵️ SUPABASE ANTWORT:", result);

    if (result.error) {
      console.error("❌ LOGIN FEHLER:", result.error.message);
      setError(result.error.message);
      setLoading(false);
      return;
    }

    if (!result.data.session) {
      console.warn("⚠️ KEINE SESSION: Login schien erfolgreich, aber keine Session erhalten.");
      setError("Keine Session erhalten.");
      setLoading(false);
      return;
    }

    console.log("✅ LOGIN ERFOLGREICH! User ID:", result.data.user.id);
    console.log("🚀 Starte Redirect nach /dashboard ...");

    // 2. Redirect erzwingen
    router.push('/dashboard');
    router.refresh();

  } catch (err: any) {
    console.error("🔥 KRITISCHER ABSTURZ:", err);
    setError("Kritischer Fehler: " + err.message);
    setLoading(false);
  }
};
  // --- 2. REGISTRIERUNG (Inline) ---
  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Einfache Validierung
    if (password.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen haben.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccessMessage('Account erstellt! Bitte bestätige deine E-Mail.');
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
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : '',
    });

    if (error) {
      setResetMessage("Fehler: " + error.message);
      setLoading(false);
      return;
    }

    setResetMessage("Check deine E-Mails! Link ist raus.");
    setLoading(false);
    setTimeout(() => setShowResetField(false), 4000);
  };

  const handleSocialLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { 
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '' 
      },
    });
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">ElectroBrain OS</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Willkommen zurück</p>
        </div>

        {/* FEEDBACK BOXEN */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex gap-3">
            <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
            <p className="text-green-700 dark:text-green-300 text-sm">{successMessage}</p>
          </div>
        )}

        {/* LOGIN FORMULAR */}
        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-bold mb-2">Email</label>
            <input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="deine@email.com"
  className="w-full px-4 py-3 bg-panel border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-primary outline-none text-ink dark:text-zinc-100 transition-all"
  required
  suppressHydrationWarning={true} // <-- DIESE ZEILE HINZUFÜGEN
/>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Passwort</label>
           <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-panel border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-primary outline-none text-ink dark:text-zinc-100 transition-all"
                      required
                      suppressHydrationWarning // <-- HIER EINFÜGEN
                    />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-cyan-600 text-white font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Anmelden...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Anmelden
              </>
            )}
          </button>
        </form>

        {/* SOCIAL LOGIN */}
        <button
          onClick={handleSocialLogin}
          className="w-full py-3 bg-panel border border-zinc-200 dark:border-zinc-800 text-ink dark:text-zinc-100 font-bold rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
        >
          <Github size={20} />
          GitHub Login
        </button>

        {/* FOOTER BEREICH (Reset & Register) */}
        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          {/* Passwort Reset Inline */}
          {!showResetField ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowResetField(true)}
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-primary transition"
              >
                🔐 Passwort vergessen?
              </button>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Noch kein Konto?{' '}
                <button
                  type="button"
                  onClick={handleSignUp}
                  className="text-primary font-bold hover:text-cyan-600 transition"
                >
                  Hier registrieren
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-bold mb-2">Passwort zurücksetzen</label>
              <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.com"
                  className="w-full px-4 py-3 bg-panel border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-primary outline-none text-ink dark:text-zinc-100 transition-all"
                  required
                  suppressHydrationWarning // <-- HIER EINFÜGEN
                />
              {resetMessage && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{resetMessage}</p>
              )}
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-cyan-600 transition-all disabled:opacity-50"
              >
                Link senden
              </button>
              <button
                type="button"
                onClick={() => setShowResetField(false)}
                className="px-3 text-xs text-zinc-500 hover:text-ink dark:hover:text-zinc-300"
              >
                ✕ Abbrechen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}