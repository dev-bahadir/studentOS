import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { Note, NoteRepository, NoteCategorySchema } from '@/domain/notes/types';

// Validierungsschema für Input (OWASP Security)
export const CreateNoteRequestSchema = z.object({
  content: z.string().min(1).max(10000).trim(),
  category: NoteCategorySchema,
});

export class SupabaseNoteRepository implements NoteRepository {
  
  async save(note: Omit<Note, 'id' | 'createdAt'>): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .insert([{
        user_id: note.userId,
        content: note.content,
        category: note.category
      }])
      .select()
      .single();

    if (error) throw new Error(`DB_ERROR: ${error.message}`);
    return this.mapToDomain(data);
  }

  async findAllByUserId(userId: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error('DB_RETRIEVAL_ERROR');
    return data ? data.map(this.mapToDomain) : [];
  }

  async deleteById(id: string, userId: string): Promise<void> {
    // Sicherheits-Check: Nur löschen, wenn user_id passt!
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error('DB_DELETE_ERROR');
  }

  // Mapper: Wandelt Datenbank-Snake_Case in Domain-CamelCase um
  private mapToDomain(raw: any): Note {
    return {
      id: raw.id,
      userId: raw.user_id,
      content: raw.content,
      category: raw.category,
      createdAt: new Date(raw.created_at),
    };
  }
}