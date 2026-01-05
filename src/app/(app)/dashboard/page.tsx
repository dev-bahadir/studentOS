'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// 👇 Absolute Imports
import { supabase } from '@/supabaseClient'; 
import { useAuth } from '@/components/providers/AuthProvider';
import QuotePlayer from '@/components/QuotePlayer';
import { useTheme } from '@/components/providers/ThemeProvider';
import { 
  Brain, FileText, Layers, Zap, Lock, Database, 
  ChevronRight, Sparkles, Activity
} from 'lucide-react';

const DISPLAY_IMAGES = [
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop",
];

export default function Dashboard() {
  const { user } = useAuth();
  const { fullName } = useTheme();
  
  const [stats, setStats] = useState({ decks: 0, cards: 0, notes: 0 });
  const [xpData, setXpData] = useState({ xp: 0, level: 1, progress: 0, nextLevelXp: 500 });
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);
  const [formulas, setFormulas] = useState<any[]>([]);
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);

  // 🛠️ Optimization: Single Fetcher with Promise.all
  const fetchAllData = useCallback(async (userId: string) => {
    try {
      // Parallelisierung der Datenbank-Abfragen spart ca. 300-500ms
      const [profileRes, decksRes, cardsRes, notesRes, formulasRes] = await Promise.all([
        supabase.from('profiles').select('xp, is_approved').eq('id', userId).single(),
        supabase.from('decks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('flashcards').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('formulas').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5)
      ]);

      if (profileRes.data) {
        const currentXP = profileRes.data.xp || 0;
        const LEVEL_THRESHOLD = 500;
        setIsApproved(profileRes.data.is_approved);
        
        setXpData({ 
          xp: currentXP, 
          level: Math.floor(currentXP / LEVEL_THRESHOLD) + 1, 
          progress: Math.floor(((currentXP % LEVEL_THRESHOLD) / LEVEL_THRESHOLD) * 100),
          nextLevelXp: LEVEL_THRESHOLD
        });
      }

      setStats({
        decks: decksRes.count || 0,
        cards: cardsRes.count || 0,
        notes: notesRes.count || 0
      });

      if (formulasRes.data) setFormulas(formulasRes.data);

    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchAllData(user.id);
    }
  }, [user?.id, fetchAllData]);

  // 🛠️ Optimization: Stable Image Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % DISPLAY_IMAGES.length);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleBulkImport = async () => {
    if (!user?.id) return;
    try {
      setImporting(true);
      const parsedData = JSON.parse(jsonInput);
      const formulasToInsert = (Array.isArray(parsedData) ? parsedData : [parsedData]).map(f => ({
        name: f.name || "Unbenannte Formel",
        formula: f.formula || f.math || "", 
        context: f.context || f.desc || "Allgemein", 
        source: f.source || "NotebookLM",
        user_id: user.id
      }));

      const { error } = await supabase.from('formulas').insert(formulasToInsert);
      if (error) throw error;

      // XP Bonus Logik
      const totalXpBonus = Math.min(formulasToInsert.length * 2, 50); 
      await supabase.rpc('increment_xp', { x: totalXpBonus, row_id: user.id });

      setJsonInput('');
      await fetchAllData(user.id); // Refresh alles
      alert(`Erfolg! ${formulasToInsert.length} Formeln importiert.`);
    } catch (err: any) {
      alert("Fehler: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full"
      />
    </div>
  );

}  // ... (Rest der UI bleibt gleich, da sie optisch top war)