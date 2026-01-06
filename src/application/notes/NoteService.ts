import { Note, NoteRepository, NoteCategory } from '@/domain/notes/types';

export class NoteService {
  // Dependency Injection: Der Service weiß nicht, dass Supabase existiert
  constructor(private readonly noteRepository: NoteRepository) {}

  async createNote(userId: string, content: string, category: NoteCategory): Promise<Note> {
    if (!content.trim()) throw new Error('Note content cannot be empty.');
    // Hier könnten weitere Business-Regeln stehen (z.B. "Max 50 Notizen für Free User")
    return this.noteRepository.save({ userId, content, category });
  }

  async getNotes(userId: string): Promise<Note[]> {
    return this.noteRepository.findAllByUserId(userId);
  }

  // Reine Logik im Speicher (O(n))
  filterNotes(notes: Note[], searchTerm: string): Note[] {
    const term = searchTerm.toLowerCase();
    return notes.filter(n => 
      n.content.toLowerCase().includes(term) || 
      n.category.toLowerCase().includes(term)
    );
  }
}