import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialisiere OpenAI (API Key muss in .env.local stehen!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { text, userId } = await req.json();

    if (!text || text.length < 50) {
      return NextResponse.json({ error: 'Text zu kurz für Analyse.' }, { status: 400 });
    }

    // 1. Prompt Engineering: Wir zwingen die AI zu striktem JSON
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Du bist ein Lehrer für Ingenieure. 
          Analysiere den Text und erstelle Lernkarten (Frage/Antwort).
          Antworte AUSSCHLIESSLICH im JSON-Format:
          [{"front": "Frage...", "back": "Antwort...", "category": "Kategorie aus dem Text"}]
          Erstelle maximal 5 Karten. Halte die Antworten kurz und präzise.`
        },
        { role: "user", content: text },
      ],
      model: "gpt-3.5-turbo", // Oder gpt-4 für bessere Ergebnisse
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("Keine Antwort von AI");

    // 2. JSON parsen
    const cards = JSON.parse(content);

    // 3. In Supabase speichern
    // Wir nutzen hier direkt den Admin-Client oder den Client mit Service-Role wäre besser,
    // aber für den MVP nutzen wir die übergebene User-ID und den normalen Client.
    // ACHTUNG: In Production sollte man hier den auth-header prüfen!
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const cardsWithMeta = cards.map((c: any) => ({
      user_id: userId,
      front: c.front,
      back: c.back,
      category: c.category || 'AI Generated',
      folder: 'AI Inbox', // Landet automatisch im Ordner "AI Inbox"
      next_review_at: new Date().toISOString(),
      interval: 0,
      ease_factor: 2.5,
      repetitions: 0
    }));

    const { error } = await supabase.from('flashcards').insert(cardsWithMeta);
    if (error) throw error;

    return NextResponse.json({ success: true, count: cards.length });

  } catch (error: any) {
    console.error('AI Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}