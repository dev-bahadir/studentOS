'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// 👇 Importe
import { supabase } from '../../supabaseClient'; 
import { useAuth } from '../../components/providers/AuthProvider';
import QuotePlayer from '../../components/QuotePlayer';
import { useTheme } from '../../components/providers/ThemeProvider';
import FormulaCard from '../../components/FormulaCard';

export default function Dashboard() {
  const { user } = useAuth();
  const { fullName } = useTheme();
  
  const [stats, setStats] = useState({ decks: 0, cards: 0, notes: 0 });
  const [xpData, setXpData] = useState({ xp: 0, level: 1, progress: 0 });
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // --- NEU: Formeln State ---
  const [formulas, setFormulas] = useState<any[]>([]);
  // --- IMPORT LOGIK ---
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);

  const handleBulkImport = async () => {
    try {
      setImporting(true);
      const parsedData = JSON.parse(jsonInput);
      const formulasToInsert = Array.isArray(parsedData) ? parsedData : [parsedData];

      const finalData = formulasToInsert.map(f => ({
        ...f,
        user_id: user?.id
      }));

      const { error } = await supabase.from('formulas').insert(finalData);

      if (error) throw error;

      // XP BONUS: +10 XP pro importierter Formel
      const totalXpBonus = finalData.length * 10;
      await supabase.rpc('increment_xp', { x: totalXpBonus, row_id: user?.id });

      alert(`Erfolg! ${finalData.length} Formeln geladen und +${totalXpBonus} XP verdient!`);
      setJsonInput('');
      fetchFormulas();
      checkApprovalAndFetchData(); // Refresh XP Anzeige
    } catch (err) {
      alert("Fehler: Prüfe das JSON-Format.");
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkApprovalAndFetchData();
    }
  }, [user]);

  const checkApprovalAndFetchData = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, is_approved')
      .eq('id', user.id)
      .single();

    if (profile) {
      setIsApproved(profile.is_approved);
      
      if (profile.is_approved) {
        const currentXP = profile.xp || 0;
        const level = Math.floor(currentXP / 100) + 1;
        const progress = currentXP % 100;
        setXpData({ xp: currentXP, level, progress });

        await fetchStats();
        await fetchFormulas(); // --- NEU: Formeln laden ---
      }
    } else {
      setIsApproved(false);
    }
    setLoading(false);
  };

  // --- NEU: Formeln aus Supabase laden ---
  const fetchFormulas = async () => {
    const { data } = await supabase
      .from('formulas')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (data) setFormulas(data);
  };

  // --- NEU: Lösch-Funktion ---
  const handleDeleteFormula = async (id: string) => {
    // Optimistisches Update (sofort aus UI entfernen)
    setFormulas(prev => prev.filter(f => f.id !== id));

    const { error } = await supabase
      .from('formulas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Löschen fehlgeschlagen", error);
      fetchFormulas(); // Bei Fehler neu laden
    }
  };

  const fetchStats = async () => {
    if (!user) return;
    const { count: decksCount } = await supabase.from('decks').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    const { count: cardsCount } = await supabase.from('flashcards').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    const { count: notesCount } = await supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    setStats({ decks: decksCount || 0, cards: cardsCount || 0, notes: notesCount || 0 });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (isApproved === false) {
    /* ... dein bestehender Warteliste-Code ... */
    return (
        <div className="min-h-screen bg-canvas flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-panel p-10 rounded-3xl shadow-2xl border border-gray-100/10">
            <div className="text-6xl mb-6">⏳</div>
            <h2 className="text-3xl font-bold text-ink mb-4">Warteliste</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Hallo! Dein Account wurde erfolgreich erstellt. Um die Serverkapazität zu schonen, schalten wir Nutzer aktuell manuell frei.
            </p>
          </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-canvas p-4 md:p-8 transition-colors duration-500 pb-20">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-8 bg-panel p-6 rounded-2xl shadow-sm border border-gray-100/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
            <div>
             <h1 className="text-2xl md:text-3xl font-extrabold text-ink">
                Hallo, <span className="text-primary">{fullName || user?.email?.split('@')[0]}</span>!
             </h1>
             <p className="text-gray-500 mt-1 text-sm md:text-base">Level {xpData.level} • {xpData.xp} XP Gesamt</p>
            </div>
            <div className="text-left md:text-right w-full md:w-auto">
              <span className="text-sm font-bold text-primary">{xpData.progress} / 100 XP</span>
              <div className="w-full md:w-48 bg-gray-200/50 rounded-full h-2 mt-1">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${xpData.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </header>

        <QuotePlayer />

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* ... Deine bestehenden Stat-Cards ... */}
          <Link href="/flashcards">
             <div className="bg-panel p-6 rounded-2xl shadow-sm border border-gray-100/10 hover:shadow-lg transition cursor-pointer group">
               <p className="text-gray-500 font-medium group-hover:text-primary transition">Lern-Decks</p>
               <h2 className="text-4xl font-bold text-ink mt-1">{stats.decks}</h2>
             </div>
           </Link>
           {/* Karten- und Notizen-Stats hier einfügen wie im Original */}
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

        {/* --- NEU: FORMEL-BEREICH --- */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-ink">Physik Fokus: Fluidstatik</h2>
            <span className="text-xs text-gray-400 italic md:hidden">← wischen zum Löschen</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {formulas.map((formula) => (
                <FormulaCard
                  key={formula.id}
                  id={formula.id}
                  name={formula.name}
                  formula={formula.formula}
                  context={formula.context}
                  source={formula.source}
                  onDelete={handleDeleteFormula}
                />
              ))}
            </AnimatePresence>
          </div>

          {formulas.length === 0 && (
            <div className="text-center p-8 border-2 border-dashed border-gray-100/10 rounded-2xl text-gray-500">
              Noch keine Formeln importiert. Zeit für NotebookLM!
            </div>
          )}
        </section>

        {/* ... nach dem </section> der Formulas ... */}

        <section className="mt-12 p-6 bg-panel rounded-3xl border border-dashed border-primary/20 mb-20">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/20 p-2 rounded-lg">🚀</div>
            <h2 className="text-lg font-bold text-ink">NotebookLM Bulk-Import</h2>
          </div>
          
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='Kopiere das JSON-Array von NotebookLM hier rein...'
            className="w-full h-32 p-4 bg-canvas border border-gray-100/10 rounded-2xl text-xs font-mono outline-none focus:ring-2 focus:ring-primary/50 transition text-ink"
          />
          
          <button
            onClick={handleBulkImport}
            disabled={importing || !jsonInput}
            className="mt-4 w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {importing ? 'Verarbeite Daten...' : 'Daten in ElectroBrain OS einspeisen'}
          </button>
        </section>

      </div> {/* Ende des max-w-5xl */}
    </div> // Ende des Haupt-Divs
  );
}