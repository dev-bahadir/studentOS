'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, Circle, Clock, Plus, Trash2, Edit3, 
  ArrowRight, ArrowLeft, MoreHorizontal, X, Save,
  Search, PenTool, Mic, Brain, Dumbbell, Zap
} from 'lucide-react';
import { SmartTaskModal } from '@/components/planner/SmartTaskModal';

// Zentrale Glass-Klasse
const glassClass = "bg-white/5 dark:bg-zinc-900/20 backdrop-blur-xl border border-white/10 dark:border-zinc-800/50 shadow-xl";

// Icons für die Modi mappen
const getModeIcon = (mode: string) => {
  switch(mode) {
    case 'scout': return <Search size={14} className="text-blue-500" />;
    case 'scribe': return <PenTool size={14} className="text-yellow-500" />;
    case 'teacher': return <Mic size={14} className="text-pink-500" />;
    case 'tester': return <Brain size={14} className="text-red-500" />;
    case 'gym': return <Dumbbell size={14} className="text-emerald-500" />;
    default: return null;
  }
};

type Task = {
  id: number;
  title: string;
  status: 'todo' | 'doing' | 'done';
  mode?: string; // NEU
  energy_req?: number; // NEU
  created_at: string;
};

export default function TaskBoard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // Für Tactical Ops Modal

  // Edit State
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    if (user) fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*') // Holt jetzt auch mode, energy_req etc.
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (error) console.error('Fehler beim Laden:', error);
    if (data) setTasks(data as Task[]);
    setLoading(false);
  };

  const awardXP = async (amount: number) => {
    if (!user) return;
    await supabase.rpc('increment_xp', { x: amount, row_id: user.id });
  };

  const saveEdit = async () => {
    if (editingTaskId === null || !editTitle.trim()) {
      setEditingTaskId(null);
      return;
    }
    
    // Optimistic Update
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
      if (direction === 'forward') { newStatus = 'done'; awardXP(15); }
      if (direction === 'backward') newStatus = 'todo';
    } else if (task.status === 'done' && direction === 'backward') newStatus = 'doing';

    if (newStatus === task.status) return;

    // Optimistic UI Update
    const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t);
    setTasks(updatedTasks);
    
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
  };

  const deleteTask = async (id: number) => {
    if (!confirm('Aufgabe wirklich löschen?')) return;
    setTasks(tasks.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  // --- SUB-COMPONENT: KANBAN COLUMN ---
  const Column = ({ title, status, color, icon: Icon }: { title: string, status: string, color: string, icon: any }) => {
    const columnTasks = tasks.filter(t => t.status === status);

    return (
      <div className={`flex-1 min-w-[300px] flex flex-col h-full rounded-[3rem] p-6 border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 backdrop-blur-sm`}>
        
        {/* Column Header */}
        <div className="flex justify-between items-center mb-6 px-2">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl ${color} bg-opacity-20 text-current`}>
                <Icon size={20} className={color.replace('bg-', 'text-')} />
             </div>
             <h2 className="font-black text-lg text-zinc-800 dark:text-zinc-100 tracking-tight">{title}</h2>
          </div>
          <span className="text-xs font-bold text-zinc-400 bg-zinc-100 dark:bg-white/5 px-3 py-1 rounded-full">
            {columnTasks.length}
          </span>
        </div>
        
        {/* Task List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
          <AnimatePresence mode='popLayout'>
            {columnTasks.map(task => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={task.id} 
                className={`group relative p-5 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 shadow-sm hover:shadow-lg transition-all hover:border-${color.replace('bg-', '')}/30`}
              >
                {editingTaskId === task.id ? (
                  <div className="space-y-3">
                    <textarea 
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), saveEdit())}
                      className="w-full bg-zinc-50 dark:bg-black/20 p-3 rounded-xl outline-none resize-none text-sm font-medium border border-blue-500/30 focus:border-blue-500"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingTaskId(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg"><X size={16}/></button>
                        <button onClick={saveEdit} className="p-2 bg-blue-500 text-white rounded-lg"><Save size={16}/></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p 
                      onClick={() => { setEditingTaskId(task.id); setEditTitle(task.title); }} 
                      className="text-zinc-700 dark:text-zinc-200 text-sm font-bold leading-relaxed cursor-pointer hover:text-blue-500 transition-colors mb-3"
                    >
                      {task.title}
                    </p>

                    {/* METADATA BADGES (NEU) */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {task.mode && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-white/5 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                                {getModeIcon(task.mode)}
                                {task.mode}
                            </div>
                        )}
                        {task.energy_req && (
                            <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${task.energy_req === 3 ? 'bg-red-500/10 text-red-500' : task.energy_req === 2 ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                {task.energy_req === 3 ? 'High Energy' : task.energy_req === 2 ? 'Med Energy' : 'Low Energy'}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-50 dark:border-white/5">
                        <div className="flex gap-1">
                            <button 
                                onClick={() => moveTask(task, 'backward')}
                                disabled={task.status === 'todo'}
                                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 disabled:opacity-0 disabled:pointer-events-none transition-all"
                            >
                                <ArrowLeft size={16} />
                            </button>
                            <button 
                                onClick={() => deleteTask(task.id)}
                                className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <button 
                            onClick={() => moveTask(task, 'forward')}
                            disabled={task.status === 'done'}
                            className="p-2 rounded-xl text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-0 disabled:pointer-events-none transition-all"
                        >
                            {task.status === 'doing' ? <CheckCircle size={18} /> : <ArrowRight size={18} />}
                        </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {columnTasks.length === 0 && (
              <div className="text-center py-10 opacity-30">
                  <div className={`w-12 h-12 rounded-full ${color} bg-opacity-10 mx-auto mb-2 flex items-center justify-center`}>
                      <Icon size={20} className={color.replace('bg-', 'text-')} />
                  </div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Leer</p>
              </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[1920px] p-4 md:p-8 lg:p-12 min-h-screen pb-40 bg-transparent text-zinc-900 dark:text-zinc-100 overflow-x-hidden flex flex-col">
      
      {/* HEADER & ACTION BUTTON */}
      <header className={`mb-8 p-8 rounded-[3rem] ${glassClass} flex flex-col xl:flex-row gap-8 items-center justify-between`}>
        <div className="w-full xl:w-auto text-center xl:text-left">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter flex items-center justify-center xl:justify-start gap-4 text-zinc-900 dark:text-white">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20">
               <CheckCircle className="text-white" size={32} />
            </div>
            Projekt Board
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-sm mt-2 pl-2">
             {tasks.filter(t => t.status === 'done').length} Aufgaben erledigt
          </p>
        </div>

        {/* NEU: Button öffnet Modal statt Input Feld */}
        <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto px-10 py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[2rem] font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
            <Plus size={24} /> New Mission
        </button>
      </header>

      {/* KANBAN BOARD */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex flex-col lg:flex-row gap-6 h-full min-w-full lg:min-w-0">
            <Column title="Zu erledigen" status="todo" color="bg-zinc-500" icon={Circle} />
            <Column title="In Arbeit" status="doing" color="bg-blue-500" icon={Clock} />
            <Column title="Erledigt" status="done" color="bg-emerald-500" icon={CheckCircle} />
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(100, 100, 100, 0.2); border-radius: 10px; }
      `}</style>

      {/* MODAL INTEGRATION */}
      <SmartTaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={fetchTasks}
      />
    </div>
  );
}