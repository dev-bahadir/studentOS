'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// 👇 WICHTIG: Pfade mit vier Punkten (../..)
import { supabase } from '../../supabaseClient'; 
import { useAuth } from '../../components/providers/AuthProvider';
import QuotePlayer from '../../components/QuotePlayer';
import { useTheme } from '../../components/providers/ThemeProvider';

// ... (Rest bleibt gleich)
export default function Dashboard() {
  const { user } = useAuth();
  const { fullName } = useTheme();
  
  const [stats, setStats] = useState({ decks: 0, cards: 0, notes: 0 });
  const [xpData, setXpData] = useState({ xp: 0, level: 1, progress: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchXP();
    }
  }, [user]);

  const fetchXP = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('xp').eq('id', user.id).single();
    
    if (data) {
      const currentXP = data.xp;
      const level = Math.floor(currentXP / 100) + 1;
      const progress = currentXP % 100;
      setXpData({ xp: currentXP, level, progress });
    }
  };

  const fetchStats = async () => {
    if (!user) return;
    
    // Decks zählen
    const { count: decksCount } = await supabase.from('decks').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    // Karten zählen
    const { count: cardsCount } = await supabase.from('flashcards').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    // Notizen zählen
    const { count: notesCount } = await supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

    setStats({ decks: decksCount || 0, cards: cardsCount || 0, notes: notesCount || 0 });
    setLoading(false);
  };

  return (
    // bg-canvas statt bg-gray-50 für Theme-Support
    <div className="min-h-screen bg-canvas p-8 transition-colors duration-500">
      <div className="max-w-5xl mx-auto">
        
        {/* GAMIFICATION HEADER */}
        {/* bg-panel statt bg-white */}
        <header className="mb-8 bg-panel p-6 rounded-2xl shadow-sm border border-gray-100/10">
          <div className="flex justify-between items-end mb-4">
            <div>
             <h1 className="text-3xl font-extrabold text-ink">
                 Selamünaleyküm, <span className="text-primary">{fullName || user?.email?.split('@')[0]}</span>!
             </h1>
             <p className="text-gray-500 mt-1">Level {xpData.level} • {xpData.xp} XP Gesamt</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-primary">{xpData.progress} / 100 XP</span>
              <p className="text-xs text-gray-400">bis Level {xpData.level + 1}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200/50 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${xpData.progress}%` }}
            ></div>
          </div>
        </header>

        {/* 👇 HIER IST DER ZITAT PLAYER EINGEBAUT */}
        <QuotePlayer />
        {/* ------------------------------------- */}

        {/* Statistik Karten */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/flashcards">
            <div className="bg-panel p-6 rounded-2xl shadow-sm border border-gray-100/10 hover:shadow-lg transition cursor-pointer group">
              <p className="text-gray-500 font-medium group-hover:text-primary transition">Lern-Decks</p>
              <h2 className="text-4xl font-bold text-ink mt-1">{loading ? '...' : stats.decks}</h2>
            </div>
          </Link>
          <Link href="/flashcards">
            <div className="bg-panel p-6 rounded-2xl shadow-sm border border-gray-100/10 hover:shadow-lg transition cursor-pointer group">
              <p className="text-gray-500 font-medium group-hover:text-primary transition">Karten gesamt</p>
              <h2 className="text-4xl font-bold text-ink mt-1">{loading ? '...' : stats.cards}</h2>
            </div>
          </Link>
          <Link href="/notes">
            <div className="bg-panel p-6 rounded-2xl shadow-sm border border-gray-100/10 hover:shadow-lg transition cursor-pointer group">
              <p className="text-gray-500 font-medium group-hover:text-primary transition">Notizen</p>
              <h2 className="text-4xl font-bold text-ink mt-1">{loading ? '...' : stats.notes}</h2>
            </div>
          </Link>
        </div>
        
      </div>
    </div>
  );
}