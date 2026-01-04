'use client';

import { useState } from 'react';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Neues Passwort
          </h1>
          <p className="text-gray-500 mt-2">Wähle ein sicheres Passwort für dein ElectroBrain OS</p>
        </div>

        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm font-medium border ${
            message.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Neues Passwort</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 disabled:opacity-50"
          >
            {loading ? 'Wird gespeichert...' : 'Passwort jetzt ändern'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => router.push('/login')}
            className="text-xs text-gray-400 hover:text-blue-600 transition underline"
          >
            Zurück zum Login
          </button>
        </div>
      </div>
    </div>
  );
}