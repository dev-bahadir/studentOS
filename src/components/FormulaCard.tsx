'use client';

import { motion, PanInfo } from 'framer-motion';

interface FormulaProps {
  id: string;
  name: string;
  formula: string;
  context: string;
  source: string;
  onDelete: (id: string) => void;
}

export default function FormulaCard({ id, name, formula, context, source, onDelete }: FormulaProps) {
  
  // Hier ist die Korrektur: Wir definieren die Animation direkt im Objekt
  // und nutzen "as const", damit TypeScript den String 'spring' akzeptiert.
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ x: -500, opacity: 0 }}
      transition={{ 
        type: 'spring' as const, // Das "as const" löst den Fehler!
        stiffness: 300, 
        damping: 30 
      }}
      drag="x"
      dragConstraints={{ left: -100, right: 0 }}
      onDragEnd={(_: any, info: PanInfo) => {
        if (info.offset.x < -80) {
          onDelete(id);
        }
      }}
      className="relative group touch-pan-y mb-4"
    >
      {/* Hintergrund beim Wischen */}
      <div className="absolute inset-0 bg-red-500 rounded-2xl flex items-center justify-end pr-6 text-white font-bold">
        Löschen
      </div>

      {/* Die Karte */}
      <div className="relative bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100/10 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-blue-600 dark:text-blue-400 font-bold text-lg">{name}</h3>
          <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full uppercase">
            S. {source}
          </span>
        </div>

        <div className="bg-gray-50 dark:bg-black p-4 rounded-xl mb-3 border border-gray-100/5">
          <code className="text-zinc-800 dark:text-zinc-200 font-mono text-sm">
            {formula}
          </code>
        </div>

        <p className="text-gray-500 text-xs italic">"{context}"</p>
        
        <div className="md:hidden mt-2 text-[9px] text-gray-400 text-right">
          ← wischen zum Löschen
        </div>
      </div>
    </motion.div>
  );
}