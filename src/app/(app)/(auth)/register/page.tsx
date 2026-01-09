'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2, Mail, Lock, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Validierung
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
    
    // Nach 2 Sekunden zur Login Page
    setTimeout(() => {
      router.push('/login?message=Check your email to confirm your account');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">ElectroBrain OS</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Erstelle dein Konto</p>
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

        {/* REGISTRIERUNGS FORMULAR */}
        <form onSubmit={handleRegister} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
              <Mail size={16} className="text-primary" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.com"
              className="w-full px-4 py-3 bg-panel border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-primary outline-none text-ink dark:text-zinc-100"
              required
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Du musst diese E-Mail bestätigen
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
              <Lock size={16} className="text-primary" />
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mindestens 6 Zeichen"
              className="w-full px-4 py-3 bg-panel border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-primary outline-none text-ink dark:text-zinc-100"
              required
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Mindestens 6 Zeichen erforderlich
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-cyan-600 text-white font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Wird erstellt...
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Registrieren
              </>
            )}
          </button>
        </form>

        {/* LOGIN LINK */}
        <div className="text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Hast du schon ein Konto?{' '}
            <Link href="/login" className="text-primary font-bold hover:text-cyan-600 transition">
              Hier anmelden
            </Link>
          </p>
        </div>

        {/* FEATURE TEASER */}
        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-3">
            Was dich erwartet:
          </p>
          <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
            <li>✓ Spaced Repetition Flashcards</li>
            <li>✓ XP & Level System</li>
            <li>✓ Dark Mode & Themes</li>
            <li>✓ PWA App Installation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}