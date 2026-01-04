'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';

type Task = {
  id: number;
  title: string;
  status: 'todo' | 'doing' | 'done';
};

export default function TaskBoard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);

  // ZUSTAND FÜR DAS BEARBEITEN
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    if (user) fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) console.error('Fehler beim Laden:', error);
    if (data) setTasks(data as Task[]);
    setLoading(false);
  };

  // --- XP System ---
  const awardXP = async (amount: number) => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('xp').eq('id', user.id).single();
    if (data) {
      await supabase.from('profiles').update({ xp: data.xp + amount }).eq('id', user.id);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { alert("Nicht eingeloggt!"); return; }
    if (!newTask.trim()) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ title: newTask, status: 'todo', user_id: user.id }])
      .select()
      .single();

    if (!error && data) {
      setTasks([...tasks, data as Task]);
      setNewTask('');
    } else {
      alert("Fehler: " + error?.message);
    }
  };

  // --- EDITIER FUNKTIONEN ---
  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
  };

  const saveEdit = async () => {
    if (editingTaskId === null || !editTitle.trim()) {
      setEditingTaskId(null); // Abbruch bei leerem Text
      return;
    }

    // 1. Optimistisches Update (sofort anzeigen)
    const updatedTasks = tasks.map(t => 
      t.id === editingTaskId ? { ...t, title: editTitle } : t
    );
    setTasks(updatedTasks);
    
    const idToUpdate = editingTaskId;
    setEditingTaskId(null); // Modus beenden

    // 2. Datenbank Update
    const { error } = await supabase
      .from('tasks')
      .update({ title: editTitle })
      .eq('id', idToUpdate);

    if (error) console.error('Fehler beim Speichern:', error);
  };

  const moveTask = async (task: Task, direction: 'forward' | 'backward') => {
    let newStatus: 'todo' | 'doing' | 'done' = task.status;

    if (task.status === 'todo') {
      if (direction === 'forward') newStatus = 'doing';
    } else if (task.status === 'doing') {
      if (direction === 'forward') {
        newStatus = 'done';
        awardXP(10); 
        alert("Sauber! +10 XP 🌟");
      }
      if (direction === 'backward') newStatus = 'todo';
    } else if (task.status === 'done') {
      if (direction === 'backward') newStatus = 'doing';
    }

    if (newStatus === task.status) return;

    const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t);
    setTasks(updatedTasks);

    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
  };

  const deleteTask = async (id: number) => {
    if (!confirm('Aufgabe löschen?')) return;
    setTasks(tasks.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  const Column = ({ title, status, bgColor, icon }: { title: string, status: string, bgColor: string, icon: string }) => {
    const columnTasks = tasks.filter(t => t.status === status);

    return (
      <div className={`flex-1 min-w-[300px] bg-gray-100 rounded-xl p-4 flex flex-col h-[70vh] border-t-4 ${bgColor}`}>
        <h2 className="font-bold text-gray-700 mb-4 flex justify-between items-center">
          <span className="flex items-center gap-2">{icon} {title}</span>
          <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">{columnTasks.length}</span>
        </h2>
        
        <div className="flex-1 overflow-y-auto space-y-3">
          {columnTasks.map(task => (
            <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 group hover:shadow-md transition">
              
              {/* --- HIER IST DIE LOGIK FÜR DAS EDITIEREN --- */}
              {editingTaskId === task.id ? (
                <input 
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={saveEdit} // Speichern, wenn man woanders hinklickt
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()} // Speichern bei Enter
                  className="w-full p-2 border border-blue-400 rounded outline-none text-gray-800 font-medium bg-blue-50"
                />
              ) : (
                <div 
                  onClick={() => startEditing(task)}
                  className="cursor-text hover:bg-gray-50 -m-2 p-2 rounded transition"
                  title="Klicken zum Bearbeiten"
                >
                  <p className="text-gray-800 font-medium break-words">{task.title}</p>
                </div>
              )}
              {/* ------------------------------------------- */}

              <div className="flex justify-between items-center mt-3 opacity-50 group-hover:opacity-100 transition-opacity border-t pt-2">
                <button onClick={() => moveTask(task, 'backward')} disabled={task.status === 'todo'} className={`p-1 rounded hover:bg-gray-100 ${task.status === 'todo' ? 'invisible' : ''}`}>⬅️</button>
                <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500 text-xs">🗑️</button>
                <button onClick={() => moveTask(task, 'forward')} disabled={task.status === 'done'} className={`p-1 rounded hover:bg-gray-100 ${task.status === 'done' ? 'invisible' : ''}`}>➡️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 min-h-screen max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Projekt Board 🚀</h1>

      <form onSubmit={addTask} className="mb-8 flex gap-2 max-w-xl">
        <input 
          suppressHydrationWarning
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Neue Aufgabe hinzufügen..."
          className="flex-1 p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button type="submit" className="bg-blue-600 text-white px-6 rounded-lg font-bold hover:bg-blue-700">
          + Add
        </button>
      </form>

      <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-4">
        <Column title="Zu erledigen" status="todo" bgColor="border-gray-400" icon="📋" />
        <Column title="In Arbeit" status="doing" bgColor="border-blue-500" icon="🔥" />
        <Column title="Erledigt" status="done" bgColor="border-green-500" icon="✅" />
      </div>
    </div>
  );
}