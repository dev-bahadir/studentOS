"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RotateCw, Check, X, Bookmark, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { FSRSScheduler, Rating } from "@/lib/scheduler";
import type { Flashcard } from "@/types";

interface FlashcardGameProps {
  cards: Flashcard[];
  onComplete: () => void;
}

export function FlashcardGame({ cards, onComplete }: FlashcardGameProps) {
  const [queue, setQueue] = useState(cards);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Scheduler Instanz
  const scheduler = new FSRSScheduler();

  const currentCard = queue[index];

  const handleRating = (rating: Rating) => {
    // 1. FSRS Berechnung
    const updatedFsrsData = scheduler.review(currentCard.fsrs, rating);
    
    // 2. Karte aktualisieren
    const updatedCard = { ...currentCard, fsrs: updatedFsrsData };
    
    // 3. Queue Management
    const newQueue = [...queue];
    newQueue[index] = updatedCard;

    // Wenn 'Again' (1), packen wir die Karte später in dieser Session nochmal rein (optional)
    if (rating === 1) {
        newQueue.push({ ...updatedCard });
    }
    
    setQueue(newQueue);

    // 4. Animation & Navigation
    setTimeout(() => {
      if (index < newQueue.length - 1) {
        setIndex(index + 1);
        setIsFlipped(false);
      } else {
        onComplete();
      }
    }, 150);
  };

  if (!currentCard) return <div>Keine Karten mehr!</div>;

  // Helper für Button-Labels (Zeigt an, wann die Karte wiederkommt)
  const getNextDueLabel = (rating: Rating) => {
     // Simulation: Was würde passieren?
     const sim = scheduler.review(currentCard.fsrs, rating);
     const days = sim.scheduled_days;
     if (days === 0) return "< 10m";
     if (days >= 365) return "> 1y";
     return `${days}d`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] max-w-2xl mx-auto perspective-1000">
      
      {/* Status Bar */}
      <div className="w-full flex justify-between text-xs text-muted-foreground mb-4 font-mono">
        <span>KARTE {index + 1} / {queue.length}</span>
        <span>STABILITY: {currentCard.fsrs.stability.toFixed(2)}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted h-1.5 rounded-full mb-8 overflow-hidden">
        <div 
            className="bg-primary h-full transition-all duration-300" 
            style={{ width: `${((index + 1) / queue.length) * 100}%` }} 
        />
      </div>

      {/* The Card */}
      <div 
        className="relative w-full aspect-[3/2] cursor-pointer group perspective-1000" 
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          className="w-full h-full relative preserve-3d transition-all duration-500"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          {/* FRONT */}
          <div className="absolute inset-0 backface-hidden bg-card border border-border rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground absolute top-8">Frage</span>
            <h2 className="text-3xl md:text-4xl font-bold text-center leading-tight">{currentCard.front}</h2>
            <div className="absolute bottom-8 flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                <Zap size={14} /> Tippen zum Umdrehen
            </div>
          </div>

          {/* BACK */}
          <div className="absolute inset-0 backface-hidden bg-card border border-primary/20 rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl rotate-y-180 bg-gradient-to-br from-card to-primary/5">
             <span className="text-xs font-bold uppercase tracking-widest text-primary absolute top-8">Antwort</span>
             <h2 className="text-2xl md:text-3xl font-medium text-center leading-relaxed">{currentCard.back}</h2>
          </div>
        </motion.div>
      </div>

      {/* FSRS Controls */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-4 gap-3 mt-8 w-full"
          >
             <Button variant="destructive" className="h-16 flex-col gap-1 hover:bg-red-500/20" onClick={() => handleRating(1)}>
                <span className="font-bold">Again</span>
                <span className="text-[10px] opacity-70">{getNextDueLabel(1)}</span>
             </Button>
             
             <Button variant="secondary" className="h-16 flex-col gap-1 hover:bg-orange-500/20" onClick={() => handleRating(2)}>
                <span className="font-bold">Hard</span>
                <span className="text-[10px] opacity-70">{getNextDueLabel(2)}</span>
             </Button>
             
             <Button variant="secondary" className="h-16 flex-col gap-1 hover:bg-blue-500/20" onClick={() => handleRating(3)}>
                <span className="font-bold text-blue-400">Good</span>
                <span className="text-[10px] opacity-70">{getNextDueLabel(3)}</span>
             </Button>
             
             <Button variant="secondary" className="h-16 flex-col gap-1 hover:bg-green-500/20" onClick={() => handleRating(4)}>
                <span className="font-bold text-green-400">Easy</span>
                <span className="text-[10px] opacity-70">{getNextDueLabel(4)}</span>
             </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}