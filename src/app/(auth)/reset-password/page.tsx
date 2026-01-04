'use client';

import { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setMessage(`Fehler: ${error.message}`);
    } else {
      setMessage('Passwort erfolgreich aktualisiert! Du wirst weitergeleitet...');
      setTimeout(() => router.push('/dashboard'), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <form onSubmit={handleUpdatePassword} className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Neues Passwort festlegen</h1>
        <input
          type="password"
          placeholder="Neues Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 mb-4 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 p-3 rounded font-bold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Speichere...' : 'Passwort aktualisieren'}
        </button>
        {message && <p className="mt-4 text-sm text-blue-400">{message}</p>}
      </form>
    </div>
  );
}