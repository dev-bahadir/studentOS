'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  Plus,
  Trash2,
  GripVertical,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Zap,
  AlertCircle,
  Edit2,
  X,
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────── */

export interface DeckNode {
  id: string;
  name: string;
  parent_id: string | null;
  user_id: string;
  description?: string;
  is_folder: boolean;
  created_at: string;
  card_count?: number;
  due_count?: number;
  children?: DeckNode[];
}

interface TreeState {
  [nodeId: string]: boolean; // expanded state
}

/* ────────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────────── */

interface HierarchicalDeckManagerProps {
  onSelectDeck?: (deckId: string) => void;
  onLearn?: (deckId: string, isRecursive: boolean) => void;
}

export default function HierarchicalDeckManager({
  onSelectDeck,
  onLearn,
}: HierarchicalDeckManagerProps) {
  const { user } = useAuth();
  const router = useRouter();

  // States
  const [rootNodes, setRootNodes] = useState<DeckNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<TreeState>({});
  const [loading, setLoading] = useState(true);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckParent, setNewDeckParent] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  /* Load Deck Hierarchy */
  useEffect(() => {
    if (user?.id) {
      fetchHierarchy();
    }
  }, [user?.id]);

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('deck_hierarchy')
        .select('*')
        .eq('user_id', user?.id)
        .order('name', { ascending: true });

      if (data) {
        const root = buildTree(data);
        setRootNodes(root);

        // Auto-expand Root
        if (root.length > 0) {
          const expanded: TreeState = {};
          root.forEach((node) => {
            expanded[node.id] = true;
          });
          setExpandedNodes(expanded);
        }
      }
    } catch (error) {
      console.error('Hierarchy fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  /* Build Tree Structure from Flat Data */
  const buildTree = (nodes: DeckNode[]): DeckNode[] => {
    const map = new Map<string, DeckNode>();
    nodes.forEach((node) => {
      map.set(node.id, { ...node, children: [] });
    });

    const root: DeckNode[] = [];
    nodes.forEach((node) => {
      const mappedNode = map.get(node.id)!;
      if (!node.parent_id) {
        root.push(mappedNode);
      } else {
        const parent = map.get(node.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(mappedNode);
        }
      }
    });

    return root.sort((a, b) => a.name.localeCompare(b.name));
  };

  /* Count Cards Recursively */
  const countCardsRecursive = async (deckId: string): Promise<number> => {
    const { data } = await supabase
      .from('deck_hierarchy')
      .select('id')
      .eq('parent_id', deckId);

    let count = 0;
    const { count: deckCards } = await supabase
      .from('flashcards')
      .select('id', { count: 'exact', head: true })
      .eq('deck_id', deckId);

    if (deckCards) count += deckCards;

    if (data) {
      for (const child of data) {
        count += await countCardsRecursive(child.id);
      }
    }

    return count;
  };

  /* Count Due Cards Recursively */
  const countDueRecursive = async (deckId: string, now: Date = new Date()): Promise<number> => {
    const { data } = await supabase
      .from('deck_hierarchy')
      .select('id')
      .eq('parent_id', deckId);

    let count = 0;
    const { count: duecards } = await supabase
      .from('flashcards')
      .select('id', { count: 'exact', head: true })
      .eq('deck_id', deckId)
      .lte('next_review', now.toISOString());

    if (duecards) count += duecards;

    if (data) {
      for (const child of data) {
        count += await countDueRecursive(child.id, now);
      }
    }

    return count;
  };

  /* Create Deck or Folder */
  const handleCreate = async () => {
    if (!newDeckName.trim() || !user?.id) return;

    try {
      setIsCreating(true);
      const { error } = await supabase.from('deck_hierarchy').insert([
        {
          name: newDeckName,
          parent_id: newDeckParent,
          user_id: user.id,
          is_folder: newDeckParent === 'FOLDER', // Meta: if parent_id === 'FOLDER', it's a folder
          description: '',
        },
      ]);

      if (!error) {
        setNewDeckName('');
        setNewDeckParent(null);
        setShowCreateForm(false);
        await fetchHierarchy();
      }
    } catch (error) {
      console.error('Create error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  /* Delete Deck */
  const handleDelete = async (deckId: string) => {
    if (!confirm('Dieses Deck und alle Unterkarten löschen?')) return;

    try {
      // Rekursiv alle Kinder löschen
      const { data: children } = await supabase
        .from('deck_hierarchy')
        .select('id')
        .eq('parent_id', deckId);

      if (children) {
        for (const child of children) {
          await handleDelete(child.id);
        }
      }

      // Alle Flashcards dieses Decks löschen
      await supabase.from('flashcards').delete().eq('deck_id', deckId);

      // Deck selbst löschen
      await supabase.from('deck_hierarchy').delete().eq('id', deckId);

      await fetchHierarchy();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  /* Rename Deck */
  const handleRename = async (deckId: string) => {
    if (!editingName.trim()) return;

    try {
      await supabase
        .from('deck_hierarchy')
        .update({ name: editingName })
        .eq('id', deckId);

      setEditingId(null);
      setEditingName('');
      await fetchHierarchy();
    } catch (error) {
      console.error('Rename error:', error);
    }
  };

  /* Toggle Expand */
  const toggleExpanded = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  /* Learn Recursive */
  const handleLearnRecursive = async (deckId: string) => {
    // Sammelt alle Karten aus diesem Deck + Kindern
    // und navigiert zu Learning-Session
    onLearn?.(deckId, true);
    router.push(`/learn?deck=${deckId}&recursive=true`);
  };

  /* Render Tree Node */
  const renderNode = (node: DeckNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes[node.id] ?? false;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="relative">
        {/* Node */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="flex items-center gap-2 py-3 px-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
          style={{ marginLeft: `${level * 16}px` }}
        >
          {/* Expand Icon */}
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(node.id)}
              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown size={16} className="text-zinc-600 dark:text-zinc-400" />
              ) : (
                <ChevronRight size={16} className="text-zinc-600 dark:text-zinc-400" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}

          {/* Icon */}
          <div
            className={`p-2 rounded-lg ${
              node.is_folder
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
            }`}
          >
            {node.is_folder ? (
              <Folder size={16} />
            ) : (
              <BookOpen size={16} />
            )}
          </div>

          {/* Name or Edit */}
          {editingId === node.id ? (
            <input
              autoFocus
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename(node.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              className="flex-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-sm font-medium outline-none border border-zinc-300 dark:border-zinc-700"
            />
          ) : (
            <div
              className="flex-1 cursor-pointer"
              onClick={() => !node.is_folder && onSelectDeck?.(node.id)}
            >
              <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {node.name}
              </p>
              {!node.is_folder && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {node.card_count || 0} Karten • {node.due_count || 0} fällig
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {editingId === node.id ? (
              <>
                <button
                  onClick={() => handleRename(node.id)}
                  className="p-1 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-600 rounded transition-colors"
                >
                  ✓
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded transition-colors"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                {!node.is_folder && (
                  <button
                    onClick={() => handleLearnRecursive(node.id)}
                    title="Learn with Spaced Repetition"
                    className="p-1 bg-cyan-100 dark:bg-cyan-900/30 hover:bg-cyan-200 dark:hover:bg-cyan-900/50 text-cyan-600 rounded transition-colors"
                  >
                    <Zap size={14} />
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingId(node.id);
                    setEditingName(node.name);
                  }}
                  className="p-1 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-600 rounded transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(node.id)}
                  className="p-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 rounded transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Children */}
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <div>
              {node.children!.map((child) => renderNode(child, level + 1))}
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  /* ──────────────────────────────────────────────────────────────
     Render
     ────────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-ink tracking-tight flex items-center gap-2">
            <Folder className="text-amber-500" size={28} />
            Deine Deck-Struktur
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Organisiere deine Lernmaterialien hierarchisch
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Neu
        </button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-3">
              <input
                type="text"
                placeholder="Deck/Ordner Name (z.B. Mathematik)"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={isCreating || !newDeckName.trim()}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white py-2 rounded-lg font-bold text-sm transition-colors"
                >
                  {isCreating ? 'Erstelle...' : 'Erstellen'}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-lg text-sm font-bold transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tree */}
      {rootNodes.length === 0 ? (
        <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
          <AlertCircle className="mx-auto text-zinc-400 mb-3" size={32} />
          <p className="text-zinc-600 dark:text-zinc-400 font-medium">
            Keine Decks vorhanden. Erstelle dein erstes Deck!
          </p>
        </div>
      ) : (
        <div className="space-y-1 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-2">
          {rootNodes.map((node) => renderNode(node))}
        </div>
      )}
    </div>
  );
}
