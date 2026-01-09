"use client";

import { Button } from "@/components/ui/button";
import { Plus, Flame, Check } from "lucide-react";
import { useState } from "react";

// Types
interface Habit {
  id: string;
  title: string;
  streak: number;
  completedDates: string[];
}

interface HabitGridProps {
  habit: Habit;
}

// Mock Data
const MOCK_HABITS: Habit[] = [
  {
    id: "1",
    title: "Sport machen",
    streak: 5,
    completedDates: ["2023-10-25", "2023-10-26"]
  },
  {
    id: "2",
    title: "3 Liter Wasser trinken",
    streak: 12,
    completedDates: ["2023-10-25", "2023-10-26", "2023-10-27"]
  },
  {
    id: "3",
    title: "Lesen (30min)",
    streak: 2,
    completedDates: []
  }
];

/**
 * Einzelne Habit-Card
 */
function HabitCard({ habit }: HabitGridProps) {
  const [completed, setCompleted] = useState(false);

  const handleToggle = () => {
    setCompleted(!completed);
    // TODO: DB Update
  };

  const isCompletedToday = habit.completedDates.includes(
    new Date().toISOString().split("T")[0]
  );

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{habit.title}</h3>
          <div className="flex items-center gap-2 mt-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">{habit.streak} Tage Streak</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-secondary rounded p-2 text-center">
          <div className="text-xs text-muted-foreground">Gesamt</div>
          <div className="font-bold">{habit.completedDates.length}</div>
        </div>
        <div className="bg-secondary rounded p-2 text-center">
          <div className="text-xs text-muted-foreground">Dieser Monat</div>
          <div className="font-bold">
            {habit.completedDates.filter(d => d.startsWith(new Date().toISOString().slice(0, 7))).length}
          </div>
        </div>
        <div className="bg-secondary rounded p-2 text-center">
          <div className="text-xs text-muted-foreground">Erfolgsquote</div>
          <div className="font-bold">
            {habit.completedDates.length > 0 ? Math.round((habit.streak / habit.completedDates.length) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Mark Completed Button */}
      <Button
        onClick={handleToggle}
        className={`w-full ${
          isCompletedToday
            ? "bg-green-500 hover:bg-green-600"
            : "bg-muted hover:bg-muted-foreground"
        }`}
      >
        <Check className="mr-2 h-4 w-4" />
        {isCompletedToday ? "✓ Heute erledigt" : "Heute markieren"}
      </Button>
    </div>
  );
}

/**
 * Hauptseite mit Grid
 */
export default function HabitTrackerPage() {
  return (
    <div className="container-wrapper p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Habit Tracker</h1>
          <p className="text-muted-foreground text-zinc-400">Konsistenz ist der Schlüssel.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-500 text-white">
          <Plus className="mr-2 h-4 w-4" /> Neuer Habit
        </Button>
      </div>

      {/* Habit Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {MOCK_HABITS.map(habit => (
          <HabitCard key={habit.id} habit={habit} />
        ))}
      </div>
    </div>
  );
}

// ✅ Exportiere beide
export { HabitCard };
