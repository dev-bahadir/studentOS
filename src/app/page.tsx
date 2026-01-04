'use client';

import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider'; // oder relativer Pfad
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Lade System...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-800 text-white p-4">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
          ElectroBrain <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-400">OS</span>
        </h1>
        <p className="text-xl text-blue-100/80 mb-8">
          Dein Second Brain. Organisiere Tasks, Notizen und Wissen an einem Ort.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link 
            href="/auth/login"
            className="px-8 py-4 bg-white text-indigo-900 rounded-full font-bold text-lg hover:bg-blue-50 transition shadow-xl hover:scale-105"
          >
            Starten 🚀
          </Link>
        </div>
      </div>
    </div>
  );
}
