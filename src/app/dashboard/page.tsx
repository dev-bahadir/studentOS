'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// 👇 WICHTIG: Pfade mit vier Punkten (../..)
import { supabase } from '../../supabaseClient'; 
import { useAuth } from '../../components/providers/AuthProvider';
import QuotePlayer from '../../components/QuotePlayer';
import { useTheme } from '../../components/providers/ThemeProvider';

export default function Dashboard() {
  const { user } = useAuth();
  const { fullName } = useTheme();
  
  const [stats, setStats] = useState({ decks: 0, cards: 0, notes: 0 });
  const [xpData, setXpData] = useState({ xp: 0, level: 1, progress: 0 });
  const [isApproved, setIsApproved] = useState<boolean | null>(null); // null = lädt noch
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkApprovalAndFetchData();
    }
  }, [user]);

  const checkApprovalAndFetchData = async () => {
    if (!user) return;

    // 1. Prüfen, ob der User freigeschaltet ist (is_approved)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('xp, is_approved')
      .eq('id', user.id)
      .single();

    if (profile) {
      setIsApproved(profile.is_approved);
      
      // Nur wenn freigeschaltet, laden wir den Rest
      if (profile.is_approved) {
        // XP berechnen
        const currentXP = profile.xp || 0;
        const level = Math.floor(currentXP / 100) + 1;
        const progress = currentXP % 100;
        setXpData({ xp: currentXP, level, progress });

        // Statistiken laden
        await fetchStats();
      }
    } else {
      // Falls kein Profil existiert (sollte nicht passieren)
      setIsApproved(false);
    }
    setLoading(false);
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
  };

  // --- RENDERING WÄCHTER ---

  // 1. Ladezustand
  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  // 2. Warteliste (wenn nicht approved)
  if (isApproved === false) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-panel p-10 rounded-3xl shadow-2xl border border-gray-100/10">
          <div className="text-6xl mb-6">⏳</div>
          <h2 className="text-3xl font-bold text-ink mb-4">Warteliste</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Selam! Dein Account wurde erfolgreich erstellt. Um die Serverkapazität zu schonen, schalten wir Nutzer aktuell manuell frei.
          </p>
          <div className="inline-block px-6 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold animate-pulse">
            Admin-Prüfung ausstehend...
          </div>
          <p className="text-xs text-gray-400 mt-8 italic">
            Sobald du freigeschaltet wirst, erhältst du Zugriff auf dein Dashboard.
          </p>
        </div>
      </div>
    );
  }

  // 3. Echtes Dashboard
  return (
    <div className="min-h-screen bg-canvas p-8 transition-colors duration-500">
      <div className="max-w-5xl mx-auto">
        
        {/* GAMIFICATION HEADER */}
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

        <QuotePlayer />

        {/* Statistik Karten */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/flashcards">
            <div className="bg-panel p-6 rounded-2xl shadow-sm border border-gray-100/10 hover:shadow-lg transition cursor-pointer group">
              <p className="text-gray-500 font-medium group-hover:text-primary transition">Lern-Decks</p>
              <h2 className="text-4xl font-bold text-ink mt-1">{stats.decks}</h2>
            </div>
          </Link>
          <Link href="/flashcards">
            <div className="bg-panel p-6 rounded-2xl shadow-sm border border-gray-100/10 hover:shadow-lg transition cursor-pointer group">
              <p className="text-gray-500 font-medium group-hover:text-primary transition">Karten gesamt</p>
              <h2 className="text-4xl font-bold text-ink mt-1">{stats.cards}</h2>
            </div>
          </Link>
          <Link href="/notes">
            <div className="bg-panel p-6 rounded-2xl shadow-sm border border-gray-100/10 hover:shadow-lg transition cursor-pointer group">
              <p className="text-gray-500 font-medium group-hover:text-primary transition">Notizen</p>
              <h2 className="text-4xl font-bold text-ink mt-1">{stats.notes}</h2>
            </div>
          </Link>
        </div>
        
      </div>
    </div>
  );
}