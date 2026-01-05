'use client';

import { useState } from 'react';
// Passe den Pfad hier an, falls nötig (../../supabaseClient)
import { supabase } from '@/supabaseClient'; 
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
    } else {
      setMessage({ type: 'success', text: 'Passwort erfolgreich aktualisiert! Du wirst zum Dashboard geleitet...' });
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 2500);
    }
  };

  return (
    // bg-canvas statt bg-canvas für dein dunkles Design
    <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
      {/* bg-panel statt bg-panel */}
      <div className="max-w-md w-full bg-panel rounded-2xl shadow-xl p-8 border border-gray-100/10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
            Neues Passwort
          </h1>
          <p className="text-zinc-500 mt-2">Wähle ein sicheres Passwort für dein ElectroBrain OS</p>
        </div>

        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm font-medium border ${
            message.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Neues Passwort</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              // bg-canvas für das Input-Feld
              className="w-full p-3 bg-canvas border border-gray-100/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-ink"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/30 disabled:opacity-50"
          >
            {loading ? 'Wird gespeichert...' : 'Passwort jetzt ändern'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => router.push('/login')}
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-primary transition underline"
          >
            Zurück zum Login
          </button>
        </div>
      </div>
    </div>
  );
}
