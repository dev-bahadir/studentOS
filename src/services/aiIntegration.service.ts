// ============================================
// 🤖 AI INTEGRATION SERVICE
// src/services/aiIntegration.service.ts
// ============================================
// Pluggable AI Provider für PDF Parsing & Card Generation

export type AIProvider = 'gemini' | 'perplexity' | 'notebooklm' | 'openai';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  apiEndpoint: string;
  model?: string;
  maxTokens?: number;
}

export interface GeneratedCard {
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
}

export interface PDFParseResult {
  title: string;
  content: string;
  extractedText: string;
  totalPages?: number;
  metadata?: Record<string, any>;
}

export interface CardGenerationResult {
  cards: GeneratedCard[];
  totalCardsGenerated: number;
  processingTime: number;
  provider: AIProvider;
}

class AIIntegrationService {
  private currentProvider: AIProvider = 'gemini';
  private config: AIProviderConfig | null = null;

  /**
   * Setzt den AI Provider
   */
  setProvider(config: AIProviderConfig): void {
    this.currentProvider = config.provider;
    this.config = config;
  }

  /**
   * Gibt aktuellen Provider zurück
   */
  getCurrentProvider(): AIProvider {
    return this.currentProvider;
  }

  /**
   * Parst PDF und extrahiert Text (Client-side mit pdf.js)
   */
  async parsePDF(file: File): Promise<PDFParseResult> {
    try {
      // Hinweis: Implementierung benötigt 'pdfjs-dist'
      // npm install pdfjs-dist
      const arrayBuffer = await file.arrayBuffer();
      
      // Placeholder - würde mit pdfjs.getDocument() implementiert
      const extractedText = '[PDF parsing mit pdfjs-dist]';
      
      return {
        title: file.name.replace('.pdf', ''),
        content: extractedText,
        extractedText,
        totalPages: 1, // Placeholder
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: new Date(),
        },
      };
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error}`);
    }
  }

  /**
   * Generiert Flashcards aus Text via AI
   */
  async generateCards(
    content: string,
    options?: {
      numberOfCards?: number;
      difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
      language?: string;
    }
  ): Promise<CardGenerationResult> {
    if (!this.config) {
      throw new Error('AI Provider not configured');
    }

    const startTime = Date.now();
    const numberOfCards = options?.numberOfCards || 5;
    const difficulty = options?.difficulty || 'mixed';
    const language = options?.language || 'en';

    try {
      const prompt = this.buildCardGenerationPrompt(
        content,
        numberOfCards,
        difficulty,
        language
      );

      const generatedCards = await this.callAIProvider(prompt);
      const processingTime = Date.now() - startTime;

      return {
        cards: generatedCards,
        totalCardsGenerated: generatedCards.length,
        processingTime,
        provider: this.currentProvider,
      };
    } catch (error) {
      throw new Error(`Card generation failed: ${error}`);
    }
  }

  /**
   * Baut den Prompt für Card Generation
   */
  private buildCardGenerationPrompt(
    content: string,
    numberOfCards: number,
    difficulty: string,
    language: string
  ): string {
    return `
You are an expert learning system designer. Generate ${numberOfCards} flashcards from the following content.
Each card should have a "front" (question) and "back" (answer).
Difficulty level: ${difficulty}
Language: ${language}

Content:
${content}

Generate cards in JSON format:
[
  {
    "front": "Question",
    "back": "Answer",
    "difficulty": "easy|medium|hard",
    "category": "Category",
    "tags": ["tag1", "tag2"]
  }
]

Return ONLY valid JSON array, no other text.
`;
  }

  /**
   * Ruft den konfigurierten AI Provider auf
   */
  private async callAIProvider(prompt: string): Promise<GeneratedCard[]> {
    if (!this.config) {
      throw new Error('AI Provider not configured');
    }

    switch (this.currentProvider) {
      case 'gemini':
        return await this.callGemini(prompt);
      case 'perplexity':
        return await this.callPerplexity(prompt);
      case 'notebooklm':
        return await this.callNotebookLM(prompt);
      case 'openai':
        return await this.callOpenAI(prompt);
      default:
        throw new Error(`Unsupported provider: ${this.currentProvider}`);
    }
  }

  /**
   * Google Gemini API
   */
  private async callGemini(prompt: string): Promise<GeneratedCard[]> {
    if (!this.config) throw new Error('Config not set');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: this.config.maxTokens || 2000,
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    return this.parseCardJSON(content);
  }

  /**
   * Perplexity API
   */
  private async callPerplexity(prompt: string): Promise<GeneratedCard[]> {
    if (!this.config) throw new Error('Config not set');

    const response = await fetch(
      'https://api.perplexity.ai/openai/deployments/mistral-7b-instruct/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model || 'mistral-7b-instruct',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: this.config.maxTokens || 2000,
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();
    const content = data.choices[0].message.content;
    return this.parseCardJSON(content);
  }

  /**
   * NotebookLM API (if available)
   */
  private async callNotebookLM(prompt: string): Promise<GeneratedCard[]> {
    if (!this.config) throw new Error('Config not set');

    // NotebookLM doesn't have a public API yet, but we can use GoogleAI for now
    // This is a placeholder for future integration
    console.warn(
      'NotebookLM API not directly available, falling back to Gemini'
    );
    return await this.callGemini(prompt);
  }

  /**
   * OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<GeneratedCard[]> {
    if (!this.config) throw new Error('Config not set');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.config.maxTokens || 2000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    return this.parseCardJSON(content);
  }

  /**
   * Parst AI Response zu GeneratedCard[]
   */
  private parseCardJSON(content: string): GeneratedCard[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const cards = JSON.parse(jsonMatch[0]);
      return cards.map((card: any) => ({
        front: card.front,
        back: card.back,
        difficulty: card.difficulty || 'medium',
        category: card.category || 'General',
        tags: card.tags || [],
      }));
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error}`);
    }
  }

  /**
   * Rate Limiter für AI Calls
   */
  private rateLimitStore = new Map<string, number[]>();

  async rateLimitCheck(userId: string, limit: number = 10, windowMs: number = 60000): Promise<boolean> {
    const now = Date.now();
    const timestamps = this.rateLimitStore.get(userId) || [];
    
    // Entferne alte Timestamps
    const recentTimestamps = timestamps.filter((ts) => now - ts < windowMs);
    
    if (recentTimestamps.length >= limit) {
      return false; // Rate limit exceeded
    }
    
    recentTimestamps.push(now);
    this.rateLimitStore.set(userId, recentTimestamps);
    return true;
  }
}

export const aiService = new AIIntegrationService();
