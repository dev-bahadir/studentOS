'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState<string>('');
  const [passwordConfirm, setPasswordConfirm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validierung
    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Passwort muss mindestens 8 Zeichen haben.' });
      setLoading(false);
      return;
    }

    if (password !== passwordConfirm) {
      setMessage({ type: 'error', text: 'Passwörter stimmen nicht überein.' });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
      return;
    }

    setMessage({ 
      type: 'success', 
      text: 'Passwort erfolgreich aktualisiert! Du wirst zum Dashboard geleitet...' 
    });
    
    setTimeout(() => {
      router.push('/dashboard');
      router.refresh();
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">ElectroBrain OS</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Wähle ein sicheres Passwort</p>
        </div>

        {/* FEEDBACK BOX */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex gap-3 border ${
            message.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          }`}>
            {message.type === 'error' ? (
              <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            ) : (
              <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
            )}
            <p className={message.type === 'error' 
              ? 'text-red-700 dark:text-red-300 text-sm' 
              : 'text-green-700 dark:text-green-300 text-sm'
            }>
              {message.text}
            </p>
          </div>
        )}

        {/* PASSWORD RESET FORM */}
        <form onSubmit={handleUpdatePassword} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
              <Lock size={16} className="text-primary" />
              Neues Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              className="w-full px-4 py-3 bg-panel border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-primary outline-none text-ink dark:text-zinc-100"
              required
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Mindestens 8 Zeichen erforderlich
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
              <Lock size={16} className="text-primary" />
              Passwort wiederholen
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Bestätige dein Passwort"
              className="w-full px-4 py-3 bg-panel border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-primary outline-none text-ink dark:text-zinc-100"
              required
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
                Wird gespeichert...
              </>
            ) : (
              <>
                <Lock size={20} />
                Passwort aktualisieren
              </>
            )}
          </button>
        </form>

        {/* SECURITY TIP */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-300 uppercase tracking-widest mb-2">
            💡 Sicherheits-Tipp
          </p>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Verwende eine Mischung aus Großbuchstaben, Kleinbuchstaben und Zahlen</li>
            <li>• Mindestens 8 Zeichen</li>
            <li>• Keine persönlichen Informationen</li>
          </ul>
        </div>
      </div>
    </div>
  );
}