'use client';

import { useMemo } from 'react';
// import { Tooltip } from '@/components/ui/tooltip'; <-- DIESE ZEILE HAT DEN FEHLER VERURSACHT (Gelöscht)

export function Heatmap({ activityData }: { activityData: { date: string; xp: number }[] }) {
  // Generiere die letzten 365 Tage (oder weniger für Mobile)
  const days = useMemo(() => {
    const today = new Date();
    const d = [];
    // Wir zeigen ca. 1 Jahr an
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const iso = date.toISOString().split('T')[0];
      // Suche XP für diesen Tag
      const activity = activityData.find(a => a.date === iso);
      d.push({ date: iso, xp: activity?.xp || 0 });
    }
    return d;
  }, [activityData]);

  const getColor = (xp: number) => {
    if (xp === 0) return 'bg-zinc-100 dark:bg-zinc-800/50';
    if (xp < 50) return 'bg-emerald-900/40';
    if (xp < 100) return 'bg-emerald-700/60';
    if (xp < 200) return 'bg-emerald-500';
    return 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'; // High Performer Glow
  };

  return (
    <div className="w-full overflow-x-auto pb-2"> {/* Scrollbar für kleine Screens */}
      <div className="flex flex-wrap gap-1 justify-start min-w-[600px]"> 
        {days.map((day) => (
          <div
            key={day.date}
            // Das hier erzeugt den Mouseover-Text (Tooltip) ganz ohne extra Komponente:
            title={`${day.date}: ${day.xp} XP`}
            className={`w-3 h-3 rounded-[2px] transition-all hover:scale-125 cursor-pointer ${getColor(day.xp)}`}
          />
        ))}
      </div>
    </div>
  );
}