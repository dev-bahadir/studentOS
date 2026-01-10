// src/hooks/useStrategyCalculator.ts

export type KnowledgeLevel = 'new' | 'partial' | 'good';
export type TimeWindow = 'short' | 'medium' | 'long';
export type Urgency = 'prep' | 'memo' | 'panic';

export type StudyMode = 'scout' | 'scribe' | 'teacher' | 'tester' | 'gym';

interface StrategyResult {
  mode: StudyMode;
  duration: number; // in Minuten
  reason: string;
  energyReq: 1 | 2 | 3;
}

export function useStrategyCalculator() {
  
  const calculateStrategy = (
    knowledge: KnowledgeLevel,
    time: TimeWindow,
    urgency: Urgency
  ): StrategyResult => {
    
    // 1. NOTFALL-LOGIK (Panic Mode)
    if (urgency === 'panic') {
      if (knowledge === 'new') {
        return {
          mode: 'scout',
          duration: 15,
          energyReq: 3,
          reason: 'CRITICAL: Nur noch Überblick verschaffen (Mut zur Lücke). Pareto-Prinzip.',
        };
      }
      // In der Panik-Phase zählen nur Übungen und Active Recall
      return {
        mode: 'gym',
        duration: time === 'short' ? 25 : 50,
        energyReq: 3,
        reason: 'PRÜFUNGS-MODUS: Alte Klausuren rechnen. Keine Zeit für Theorie.',
      };
    }

    // 2. WENIG ZEIT (< 30 min)
    if (time === 'short') {
      if (knowledge === 'new') {
        return {
          mode: 'scout',
          duration: 25,
          energyReq: 1,
          reason: 'Verschaffe dir einen groben Überblick über das Thema.',
        };
      }
      return {
        mode: 'tester',
        duration: 25,
        energyReq: 2,
        reason: 'Kurze Active Recall Session (Flashcards) um das Wissen wach zu halten.',
      };
    }

    // 3. WISSENSAUFBAU (Preparation Phase)
    if (urgency === 'prep') {
      if (knowledge === 'new') {
        return {
          mode: 'scout',
          duration: 45, // Längerer Scout
          energyReq: 2,
          reason: 'Deep Dive: Scanne das Material und verstehe die Struktur.',
        };
      }
      if (knowledge === 'partial') {
         return {
          mode: 'scribe',
          duration: time === 'long' ? 90 : 50,
          energyReq: 2,
          reason: 'Lücken schließen: Erstelle Cornell-Notes und Zusammenfassungen.',
        };
      }
    }

    // 4. VERTIEFUNG (Memorizing Phase)
    if (knowledge === 'good') {
      return {
        mode: 'teacher',
        duration: 25,
        energyReq: 3,
        reason: 'Feynman-Methode: Erkläre das Konzept laut, um letzte Lücken zu finden.',
      };
    }

    // Default Fallback: Gym (Üben hilft immer)
    return {
      mode: 'gym',
      duration: 50,
      energyReq: 2,
      reason: 'Interleaving Practice: Mische verschiedene Aufgabentypen.',
    };
  };

  return { calculateStrategy };
}