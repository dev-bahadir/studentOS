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

  const awardXP = async (amount: number) => {
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user.id).single();
    if (profile) {
      await supabase.from('profiles').update({ xp: (profile.xp || 0) + amount }).eq('id', user.id);
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
    }
  };

  const saveEdit = async () => {
    if (editingTaskId === null || !editTitle.trim()) {
      setEditingTaskId(null);
      return;
    }
    const updatedTasks = tasks.map(t => t.id === editingTaskId ? { ...t, title: editTitle } : t);
    setTasks(updatedTasks);
    const idToUpdate = editingTaskId;
    setEditingTaskId(null);
    await supabase.from('tasks').update({ title: editTitle }).eq('id', idToUpdate);
  };

  const moveTask = async (task: Task, direction: 'forward' | 'backward') => {
    let newStatus: 'todo' | 'doing' | 'done' = task.status;
    if (task.status === 'todo' && direction === 'forward') newStatus = 'doing';
    else if (task.status === 'doing') {
      if (direction === 'forward') { newStatus = 'done'; awardXP(10); alert("Sauber! +10 XP 🌟"); }
      if (direction === 'backward') newStatus = 'todo';
    } else if (task.status === 'done' && direction === 'backward') newStatus = 'doing';

    if (newStatus === task.status) return;
    const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t);
    setTasks(updatedTasks);
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
  };

  const deleteTask = async (id: number) => {
    if (!confirm('Aufgabe wirklich löschen?')) return;
    setTasks(tasks.filter(t => t.id !== id));
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) alert("Fehler: " + error.message);
  };

  const Column = ({ title, status, bgColor, icon }: { title: string, status: string, bgColor: string, icon: string }) => {
    const columnTasks = tasks.filter(t => t.status === status);

    return (
      <div className={`flex-1 min-w-full md:min-w-[320px] bg-gray-50 dark:bg-zinc-900/40 rounded-3xl p-5 flex flex-col border-t-8 ${bgColor} shadow-sm mb-6 md:mb-0`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-extrabold text-lg flex items-center gap-2 dark:text-white">{icon} {title}</h2>
          <span className="bg-white dark:bg-zinc-800 shadow-sm text-gray-500 px-3 py-1 rounded-full text-xs font-bold">{columnTasks.length}</span>
        </div>
        
        <div className="space-y-4">
          {columnTasks.map(task => (
            <div key={task.id} className="bg-white dark:bg-zinc-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700">
              
              {editingTaskId === task.id ? (
                <input 
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  className="w-full p-2 border-2 border-blue-400 rounded-lg outline-none dark:bg-zinc-900 dark:text-white"
                />
              ) : (
                <p onClick={() => { setEditingTaskId(task.id); setEditTitle(task.title); }} className="text-gray-800 dark:text-gray-100 font-semibold break-words cursor-pointer">
                  {task.title}
                </p>
              )}

              <div className="flex justify-between items-center mt-5 pt-4 border-t border-gray-50 dark:border-zinc-700">
                <button 
                  onClick={() => moveTask(task, 'backward')} 
                  className={`p-2 bg-gray-100 dark:bg-zinc-700 rounded-xl active:scale-90 transition ${task.status === 'todo' ? 'opacity-0 pointer-events-none' : ''}`}
                >
                  ⬅️
                </button>
                
                <button 
                  onClick={() => deleteTask(task.id)} 
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                  <span className="text-xl">🗑️</span>
                </button>

                <button 
                  onClick={() => moveTask(task, 'forward')} 
                  className={`p-2 bg-gray-100 dark:bg-zinc-700 rounded-xl active:scale-90 transition ${task.status === 'done' ? 'opacity-0 pointer-events-none' : ''}`}
                >
                  ➡️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-10 min-h-screen max-w-7xl mx-auto pb-32">
      <h1 className="text-3xl font-black mb-8 dark:text-white">Projekt Board 🚀</h1>

      <form onSubmit={addTask} className="mb-10 flex gap-3">
        <input 
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Was steht an?"
          className="flex-1 p-4 bg-white dark:bg-zinc-800 border-none rounded-2xl shadow-inner focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
        />
        <button type="submit" className="bg-blue-600 text-white px-8 rounded-2xl font-black hover:bg-blue-700 transition-all active:scale-95">
          Add
        </button>
      </form>

      <div className="flex flex-col md:flex-row gap-8">
        <Column title="Zu erledigen" status="todo" bgColor="border-gray-300" icon="📋" />
        <Column title="In Arbeit" status="doing" bgColor="border-blue-500" icon="🔥" />
        <Column title="Erledigt" status="done" bgColor="border-green-500" icon="✅" />
      </div>
    </div>
  );
}