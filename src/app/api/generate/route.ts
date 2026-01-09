import { NextResponse } from 'next/server';

// 🚧 AI TEMPORÄR DEAKTIVIERT 🚧
// Wir geben hier nur Dummy-Daten zurück, damit der Build ohne API-Key funktioniert.

export async function POST(req: Request) {
  console.log("⚠️ API Call received but AI is disabled.");
  
  // Wir simulieren eine kurze Wartezeit
  await new Promise(resolve => setTimeout(resolve, 1000));

  return NextResponse.json({
    cards: [
      {
        front: "AI Modul deaktiviert",
        back: "Füge einen OPENAI_API_KEY hinzu, um echte Karten zu generieren.",
        category: "System Info",
        difficulty: "easy"
      }
    ]
  });
}