import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    // Holt Daten aus der Tabelle 'notes', sortiert nach Datum (neueste zuerst)
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError('Fehler: ' + error.message);
      console.error('Supabase Fehler:', error);
    } else {
      setNotes(data);
    }
    setLoading(false);
  };

  if (loading) return <div style={{ padding: '20px' }}>Lade Notizen...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Meine Notizen</h1>
      
      {notes.length === 0 ? (
        <p>Noch keine Notizen vorhanden.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {notes.map((note) => (
            <li key={note.id} style={{ 
              marginBottom: '1rem', 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '15px',
              backgroundColor: '#f9f9f9',
              color: '#333'
            }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>{note.content}</p>
              <small style={{ color: '#666' }}>
                {new Date(note.created_at).toLocaleString('de-DE')}
              </small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notes;