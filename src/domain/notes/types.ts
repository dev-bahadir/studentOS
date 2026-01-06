import { z } from 'zod';

// Zod Schema für Kategorien (wird auch für Validierung genutzt)
export const NoteCategorySchema = z.enum(['inbox', 'projects', 'areas', 'resources', 'archives']);
export type NoteCategory = z.infer<typeof NoteCategorySchema>;

// Das reine Datenmodell (Entity)
export interface Note {
  readonly id: string;
  readonly userId: string;
  readonly content: string;
  readonly category: NoteCategory;
  readonly createdAt: Date;
}

// Der "Port": Das Interface für den Datenspeicher
export interface NoteRepository {
  save(note: Omit<Note, 'id' | 'createdAt'>): Promise<Note>;
  findAllByUserId(userId: string): Promise<Note[]>;
  deleteById(id: string, userId: string): Promise<void>;
}