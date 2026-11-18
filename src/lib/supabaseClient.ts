import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const DEMO_USER = {
  id: 'demo-student-id',
  email: 'demo@studentos.dev',
  app_metadata: {},
  user_metadata: { full_name: 'Bahadir (Demo)' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

const STORAGE_PREFIX = 'studentos_portfolio_demo_v1_';
const DEMO_FLAG_KEY = 'studentos_demo_mode_active';

function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function pastIso(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

export function getDemoSeed(): Record<string, any[]> {
  const today = new Date().toISOString().split('T')[0];
  return {
    profiles: [
      {
        id: DEMO_USER.id,
        full_name: 'Bahadir (Demo)',
        theme: 'dark',
        xp: 1850,
        custom_colors: null,
      },
    ],
    subjects: [
      { id: 'sub-1', title: 'Algorithmen & Datenstrukturen', color: '#06b6d4' },
      { id: 'sub-2', title: 'Lineare Algebra II', color: '#8b5cf6' },
      { id: 'sub-3', title: 'Betriebssysteme & Netze', color: '#10b981' },
    ],
    exams: [
      {
        id: 'exam-algo',
        user_id: DEMO_USER.id,
        title: 'Algorithmen & Datenstrukturen',
        date: futureDate(9),
        type: 'Klausur',
        priority: 'high',
        phase: 'memorizing',
      },
      {
        id: 'exam-linalg',
        user_id: DEMO_USER.id,
        title: 'Lineare Algebra II',
        date: futureDate(5),
        type: 'Klausur',
        priority: 'high',
        phase: 'simulation',
      },
      {
        id: 'exam-os',
        user_id: DEMO_USER.id,
        title: 'Betriebssysteme & Netze',
        date: futureDate(24),
        type: 'Klausur',
        priority: 'low',
        phase: 'preparation',
      },
    ],
    daily_plans: [
      {
        id: 'plan-today',
        user_id: DEMO_USER.id,
        date: today,
        morning_exam_id: 'exam-linalg',
        afternoon_exam_id: 'exam-algo',
        current_block: 'morning',
        status: 'active',
        brain_dump:
          'Fokus heute: Eigenwertprobleme unter Klausurbedingungen lösen.\nNachmittags: Rot-Schwarz-Bäume & Dijkstra-Invariante wiederholen.',
      },
    ],
    decks: [
      {
        id: 'deck-algo',
        user_id: DEMO_USER.id,
        title: 'Algorithmen & Komplexität',
        description: 'Graphen, Sortierverfahren, Dynamische Programmierung & NP-Vollständigkeit',
        category: 'Informatik',
        created_at: pastIso(14),
      },
      {
        id: 'deck-linalg',
        user_id: DEMO_USER.id,
        title: 'Lineare Algebra & Spektraltheorie',
        description: 'Eigenwerte, Jordan-Normalform, Skalarprodukte & Orthogonale Projektionen',
        category: 'Mathematik',
        created_at: pastIso(10),
      },
      {
        id: 'deck-os',
        user_id: DEMO_USER.id,
        title: 'Operating Systems Internals',
        description: 'Virtual Memory, Page Tables, Scheduling, Deadlocks & POSIX Threads',
        category: 'Systeme',
        created_at: pastIso(7),
      },
    ],
    flashcards: [
      {
        id: 'fc-1',
        user_id: DEMO_USER.id,
        deck_id: 'deck-algo',
        front: 'Was ist die Worst-Case- und Average-Case-Laufzeit von Quicksort?',
        back: 'Worst-Case: O(n²) bei bereits sortierter Eingabe mit schlechtem Pivot.\nAverage-Case: O(n log n) mit randomisiertem oder Median-of-Three Pivot.',
        category: 'Informatik',
        state: 2,
        stability: 12.4,
        difficulty: 4.2,
        reps: 4,
        lapses: 0,
        due_date: pastIso(0),
        next_review: pastIso(0),
      },
      {
        id: 'fc-2',
        user_id: DEMO_USER.id,
        deck_id: 'deck-algo',
        front: 'Welche Voraussetzung muss für Dijkstras Shortest-Path-Algorithmus gelten?',
        back: 'Alle Kantengewichte müssen nicht-negativ sein (w(u, v) ≥ 0). Bei negativen Kanten wird Bellman-Ford benötigt.',
        category: 'Informatik',
        state: 3,
        stability: 28.0,
        difficulty: 3.1,
        reps: 7,
        lapses: 0,
        due_date: pastIso(0),
        next_review: pastIso(0),
      },
      {
        id: 'fc-3',
        user_id: DEMO_USER.id,
        deck_id: 'deck-algo',
        front: 'Was besagt das Master-Theorem für T(n) = a·T(n/b) + f(n)?',
        back: 'Vergleicht f(n) mit n^(log_b(a)):\n1. f(n) = O(n^(log_b(a) - ε)) ⇒ Θ(n^(log_b(a)))\n2. f(n) = Θ(n^(log_b(a))) ⇒ Θ(n^(log_b(a)) · log n)\n3. f(n) = Ω(n^(log_b(a) + ε)) ⇒ Θ(f(n))',
        category: 'Informatik',
        state: 1,
        stability: 3.5,
        difficulty: 6.8,
        reps: 2,
        lapses: 1,
        due_date: pastIso(0),
        next_review: pastIso(0),
      },
      {
        id: 'fc-4',
        user_id: DEMO_USER.id,
        deck_id: 'deck-linalg',
        front: 'Wann ist eine n×n Matrix A diagonalisierbar?',
        back: 'Genau dann, wenn die Summe der geometrischen Vielfachheiten aller Eigenwerte gleich n ist (bzw. das Minimalpolynom in paarweise verschiedene Linearfaktoren zerfällt).',
        category: 'Mathematik',
        state: 2,
        stability: 9.2,
        difficulty: 5.0,
        reps: 3,
        lapses: 0,
        due_date: pastIso(0),
        next_review: pastIso(0),
      },
      {
        id: 'fc-5',
        user_id: DEMO_USER.id,
        deck_id: 'deck-linalg',
        front: 'Was besagt der Spektralsatz für reelle symmetrische Matrizen?',
        back: 'Jede reelle symmetrische Matrix A = A^T besitzt nur reelle Eigenwerte und ist orthogonal diagonalisierbar: A = Q · D · Q^T mit Q^T Q = I.',
        category: 'Mathematik',
        state: 3,
        stability: 31.5,
        difficulty: 3.8,
        reps: 6,
        lapses: 0,
        due_date: pastIso(0),
        next_review: pastIso(0),
      },
      {
        id: 'fc-6',
        user_id: DEMO_USER.id,
        deck_id: 'deck-os',
        front: 'Welche 4 Coffman-Bedingungen sind notwendig für einen Deadlock?',
        back: '1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait',
        category: 'Systeme',
        state: 0,
        stability: 0,
        difficulty: 5.0,
        reps: 0,
        lapses: 0,
        due_date: pastIso(0),
        next_review: pastIso(0),
      },
    ],
    notes: [
      {
        id: 'note-1',
        user_id: DEMO_USER.id,
        title: 'Graphenalgorithmen & Kürzeste Pfade (Cornell Notes)',
        content:
          '# Kürzeste Pfade in Graphen\n\n## Kernidee\n- **BFS**: Ungewichtete Graphen in `O(V + E)`\n- **Dijkstra**: Nicht-negative Gewichte mit Priority Queue in `O((V + E) log V)`\n- **Bellman-Ford**: Erlaubt negative Kanten und erkennt Negativzyklen in `O(V · E)`\n\n## Klausur-Falle\nDijkstra funktioniert **nicht** durch bloßes Addieren einesOffsets auf negative Kanten, da Pfade mit mehr Kanten überproportional bestraft werden!',
        category: 'Informatik',
        tags: ['Graphen', 'Klausur', 'Dijkstra'],
        is_favorite: true,
        is_deleted: false,
        updated_at: pastIso(1),
        created_at: pastIso(5),
      },
      {
        id: 'note-2',
        user_id: DEMO_USER.id,
        title: 'Eigenwerte, Eigenvektoren & Singulärwertzerlegung (SVD)',
        content:
          '# Spektraltheorie & SVD\n\nJede Matrix `A ∈ ℝ^(m×n)` besitzt eine Singulärwertzerlegung:\n`A = U · Σ · V^T`\n\n- Die Spalten von `U` sind die Eigenvektoren von `A A^T`\n- Die Spalten von `V` sind die Eigenvektoren von `A^T A`\n- Die Singulärwerte `σ_i = sqrt(λ_i)` stehen auf der Diagonalen von `Σ`.',
        category: 'Mathematik',
        tags: ['LinAlg', 'SVD', 'Matrix'],
        is_favorite: true,
        is_deleted: false,
        updated_at: pastIso(2),
        created_at: pastIso(8),
      },
      {
        id: 'note-3',
        user_id: DEMO_USER.id,
        title: 'Virtueller Speicher, Paging & TLB Caching',
        content:
          '# Virtual Memory Architektur\n\n- **Page Table**: Übersetzt virtuelle Seitennummern (VPN) in physische Frame-Nummern (PFN).\n- **TLB (Translation Lookaside Buffer)**: Hardware-Cache für Page-Table-Einträge.\n- **Effektive Zugriffszeit (EAT)**: `EAT = α · (t_TLB + t_RAM) + (1 - α) · (t_TLB + 2 · t_RAM)`',
        category: 'Systeme',
        tags: ['OS', 'Paging', 'Hardware'],
        is_favorite: false,
        is_deleted: false,
        updated_at: pastIso(3),
        created_at: pastIso(9),
      },
    ],
    summaries: [
      {
        id: 'sum-1',
        user_id: DEMO_USER.id,
        title: 'Kapitel 1–4: Asymptotische Analyse & Divide-and-Conquer',
        category: 'Informatik/Algorithmen',
        content:
          '## 1. Landau-Symbole\n- `O(g(n))`: Asymptotische obere Schranke\n- `Ω(g(n))`: Asymptotische untere Schranke\n- `Θ(g(n))`: Asymptotisch scharfe Schranke\n\n## 2. Rekurrenzen lösen\n1. Substitutionsmethode (Induktionsbeweis)\n2. Rekursionsbaum-Methode\n3. Master-Theorem',
        created_at: pastIso(4),
      },
      {
        id: 'sum-2',
        user_id: DEMO_USER.id,
        title: 'Kapitel 5: Orthogonale Projektionen & Gram-Schmidt',
        category: 'Mathematik/Lineare Algebra',
        content:
          '## Gram-Schmidt Orthonormalisierungsverfahren\nTransformiert eine linear unabhängige Basis `{v_1, ..., v_k}` schrittweise in eine Orthonormalbasis `{u_1, ..., u_k}` durch Abziehen der Projektionen auf die bisherigen Basisvektoren.',
        created_at: pastIso(6),
      },
    ],
    formulas: [
      {
        id: 'form-1',
        user_id: DEMO_USER.id,
        name: 'Bayes-Theorem',
        formula: 'P(A|B) = [P(B|A) · P(A)] / P(B)',
        context: 'Bedingte Wahrscheinlichkeit & Maschinelles Lernen',
        source: 'Stochastik :: Grundgesetze',
      },
      {
        id: 'form-2',
        user_id: DEMO_USER.id,
        name: 'Charakteristisches Polynom',
        formula: 'χ_A(λ) = det(A - λ·I_n) = 0',
        context: 'Bestimmung der Eigenwerte einer quadratischen Matrix A',
        source: 'Lineare Algebra :: Spektraltheorie',
      },
      {
        id: 'form-3',
        user_id: DEMO_USER.id,
        name: 'Amdahls Gesetz (Speedup)',
        formula: 'S(N) = 1 / [(1 - P) + (P / N)]',
        context: 'Maximaler Speedup bei N Prozessoren und parallelem Anteil P',
        source: 'Betriebssysteme :: Parallelität',
      },
      {
        id: 'form-4',
        user_id: DEMO_USER.id,
        name: 'FSRS Retrievability (Vergessenskurve)',
        formula: 'R(t, S) = (1 + FACTOR · t / S)^DECAY',
        context: 'Wahrscheinlichkeit, sich nach t Tagen bei Stabilität S zu erinnern',
        source: 'Cognitive Science :: Spaced Repetition',
      },
    ],
    cheatsheets: [
      {
        id: 'cs-1',
        user_id: DEMO_USER.id,
        title: 'Sortieralgorithmen Komplexitäts-Vergleich',
        category: 'Algorithmen',
        content:
          '| Algorithmus | Best Case | Average Case | Worst Case | Speicher | Stabil? |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n| **Mergesort** | O(n log n) | O(n log n) | O(n log n) | O(n) | Ja |\n| **Quicksort** | O(n log n) | O(n log n) | O(n²) | O(log n) | Nein |\n| **Heapsort** | O(n log n) | O(n log n) | O(n log n) | O(1) | Nein |\n| **Insertion Sort** | O(n) | O(n²) | O(n²) | O(1) | Ja |',
        created_at: pastIso(5),
      },
      {
        id: 'cs-2',
        user_id: DEMO_USER.id,
        title: 'POSIX & Linux Prozess-Zustände',
        category: 'Betriebssysteme',
        content:
          '| Zustand | Code | Bedeutung |\n| :--- | :--- | :--- |\n| **Running / Runnable** | R | Auf CPU aktiv oder in der Run-Queue |\n| **Interruptible Sleep** | S | Wartet auf I/O oder Signal |\n| **Uninterruptible Sleep** | D | Wartet direkt auf Hardware/Disk |\n| **Zombie** | Z | Terminiert, wartet auf `wait()` vom Parent |',
        created_at: pastIso(3),
      },
    ],
    prompts: [
      {
        id: 'pr-1',
        user_id: DEMO_USER.id,
        title: 'Feynman-Tutor für komplexe Beweise',
        category: 'Lernen',
        content:
          'Erkläre mir den folgenden mathematischen Beweis zuerst auf intuitiver Ebene (Feynman-Methode) ohne Fachjargon, zeige mir danach den exakten formalen Knackpunkt, an dem Studierende in der Klausur am häufigsten Punkte verlieren:\n\n[THEMA EINFÜGEN]',
        created_at: pastIso(4),
      },
      {
        id: 'pr-2',
        user_id: DEMO_USER.id,
        title: 'NotebookLM JSON-Generator für Formeln',
        category: 'Prüfung',
        content:
          'Extrahiere alle prüfungsrelevanten Formeln aus dem Vorlesungsskript als valides JSON-Array im Format:\n[{"name": "...", "formula": "...", "context": "...", "source": "Fach :: Kapitel"}]',
        created_at: pastIso(2),
      },
    ],
    tasks: [
      {
        id: 101,
        user_id: DEMO_USER.id,
        title: 'Altklausur WS24 Lineare Algebra komplett unter Zeitdruck lösen (90 Min)',
        category: 'Lineare Algebra II',
        status: 'doing',
        completed: false,
        mode: 'gym',
        energy_req: 3,
        est_duration: 50,
        created_at: pastIso(1),
      },
      {
        id: 102,
        user_id: DEMO_USER.id,
        title: 'Dijkstra & Bellman-Ford Korrektheitsbeweis laut erklären',
        category: 'Algorithmen & Datenstrukturen',
        status: 'todo',
        completed: false,
        mode: 'teacher',
        energy_req: 3,
        est_duration: 25,
        created_at: pastIso(1),
      },
      {
        id: 103,
        user_id: DEMO_USER.id,
        title: 'FSRS Review Deck "Algorithmen & Komplexität" durcharbeiten',
        category: 'Algorithmen & Datenstrukturen',
        status: 'todo',
        completed: false,
        mode: 'tester',
        energy_req: 2,
        est_duration: 25,
        created_at: pastIso(2),
      },
      {
        id: 104,
        user_id: DEMO_USER.id,
        title: 'Kapitel 6 Virtual Memory & Page Replacement Skript scannen (SQ3R)',
        category: 'Betriebssysteme & Netze',
        status: 'done',
        completed: true,
        mode: 'scout',
        energy_req: 1,
        est_duration: 25,
        created_at: pastIso(3),
      },
    ],
  };
}

export function isDemoModeEnabled(): boolean {
  if (!supabaseUrl || !supabaseKey) return true;
  if (typeof window !== 'undefined') {
    return localStorage.getItem(DEMO_FLAG_KEY) === 'true';
  }
  return false;
}

export function enableDemoMode() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_FLAG_KEY, 'true');
  }
}

export function resetDemoData() {
  if (typeof window === 'undefined') return;
  const seed = getDemoSeed();
  Object.keys(seed).forEach((table) => {
    localStorage.setItem(STORAGE_PREFIX + table, JSON.stringify(seed[table]));
  });
}

function readTable(table: string): any[] {
  const seed = getDemoSeed();
  if (typeof window === 'undefined') return seed[table] || [];
  const key = STORAGE_PREFIX + table;
  const raw = localStorage.getItem(key);
  if (!raw) {
    const initial = seed[table] || [];
    localStorage.setItem(key, JSON.stringify(initial));
    return [...initial];
  }
  try {
    return JSON.parse(raw);
  } catch {
    return seed[table] || [];
  }
}

function writeTable(table: string, rows: any[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_PREFIX + table, JSON.stringify(rows));
}

class DemoQueryBuilder {
  private table: string;
  private filters: Array<(row: any) => boolean> = [];
  private orderByField: string | null = null;
  private orderAsc = true;
  private limitCount: number | null = null;
  private isSingle = false;
  private isMaybeSingle = false;
  private headOnly = false;
  private mutationOp: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private payload: any = null;
  private upsertConflict: string | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(_columns = '*', opts?: { count?: string; head?: boolean }) {
    if (opts?.head) this.headOnly = true;
    return this;
  }

  insert(values: any) {
    this.mutationOp = 'insert';
    this.payload = Array.isArray(values) ? values : [values];
    return this;
  }

  update(values: any) {
    this.mutationOp = 'update';
    this.payload = values;
    return this;
  }

  upsert(values: any, opts?: { onConflict?: string }) {
    this.mutationOp = 'upsert';
    this.payload = Array.isArray(values) ? values : [values];
    this.upsertConflict = opts?.onConflict || 'id';
    return this;
  }

  delete() {
    this.mutationOp = 'delete';
    return this;
  }

  eq(field: string, value: any) {
    if (field === 'user_id') {
      // In demo mode, match any demo user_id gracefully
      return this;
    }
    this.filters.push((row) => String(row[field]) === String(value));
    return this;
  }

  in(field: string, values: any[]) {
    const set = new Set((values || []).map((v) => String(v)));
    this.filters.push((row) => set.has(String(row[field])));
    return this;
  }

  gte(field: string, value: any) {
    this.filters.push((row) => row[field] >= value);
    return this;
  }

  order(field: string, opts?: { ascending?: boolean }) {
    this.orderByField = field;
    this.orderAsc = opts?.ascending ?? true;
    return this;
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  private execute(): { data: any; error: any; count?: number } {
    let rows = readTable(this.table);

    if (this.mutationOp === 'insert') {
      const inserted = this.payload.map((item: any) => {
        const row = {
          id:
            item.id ||
            (this.table === 'tasks'
              ? Date.now() + Math.floor(Math.random() * 1000)
              : `${this.table}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
          ...item,
        };
        if (this.table === 'tasks' && !row.status) {
          row.status = row.completed ? 'done' : 'todo';
        }
        return row;
      });
      rows = [...inserted, ...rows];
      writeTable(this.table, rows);
      return { data: this.isSingle ? inserted[0] : inserted, error: null };
    }

    if (this.mutationOp === 'upsert') {
      const conflictFields = (this.upsertConflict || 'id')
        .split(',')
        .map((s) => s.trim());
      const upserted: any[] = [];
      for (const item of this.payload) {
        const idx = rows.findIndex((r) =>
          conflictFields.every((f) => item[f] !== undefined && String(r[f]) === String(item[f]))
        );
        if (idx >= 0) {
          rows[idx] = { ...rows[idx], ...item };
          upserted.push(rows[idx]);
        } else {
          const created = {
            id: item.id || `${this.table}-${Date.now()}`,
            created_at: new Date().toISOString(),
            ...item,
          };
          rows.push(created);
          upserted.push(created);
        }
      }
      writeTable(this.table, rows);
      return { data: this.isSingle ? upserted[0] : upserted, error: null };
    }

    if (this.mutationOp === 'update') {
      const updated: any[] = [];
      rows = rows.map((row) => {
        if (this.filters.every((fn) => fn(row))) {
          const next = { ...row, ...this.payload };
          if (this.table === 'tasks') {
            if (this.payload.status !== undefined) {
              next.completed = this.payload.status === 'done';
            } else if (this.payload.completed !== undefined) {
              next.status = this.payload.completed ? 'done' : next.status === 'done' ? 'todo' : next.status || 'todo';
            }
          }
          updated.push(next);
          return next;
        }
        return row;
      });
      writeTable(this.table, rows);
      return { data: this.isSingle ? updated[0] || null : updated, error: null };
    }

    if (this.mutationOp === 'delete') {
      const remaining = rows.filter((row) => !this.filters.every((fn) => fn(row)));
      writeTable(this.table, remaining);
      return { data: null, error: null };
    }

    let matched = rows.filter((row) => this.filters.every((fn) => fn(row)));
    if (this.orderByField) {
      const f = this.orderByField;
      const dir = this.orderAsc ? 1 : -1;
      matched = [...matched].sort((a, b) => (a[f] > b[f] ? dir : a[f] < b[f] ? -dir : 0));
    }
    const totalCount = matched.length;
    if (this.limitCount !== null) {
      matched = matched.slice(0, this.limitCount);
    }

    if (this.headOnly) {
      return { data: null, error: null, count: totalCount };
    }
    if (this.isSingle || this.isMaybeSingle) {
      return { data: matched[0] ?? null, error: null, count: totalCount };
    }
    return { data: matched, error: null, count: totalCount };
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any; count?: number }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

const demoSupabaseClient = {
  from: (table: string) => new DemoQueryBuilder(table),
  rpc: async (fn: string, args?: any) => {
    if (fn === 'increment_xp') {
      const profiles = readTable('profiles');
      if (profiles[0]) {
        profiles[0].xp = (profiles[0].xp || 0) + (args?.x || 0);
        writeTable('profiles', profiles);
      }
    }
    return { data: null, error: null };
  },
  auth: {
    getSession: async () => ({
      data: {
        session: {
          access_token: 'demo-token',
          refresh_token: 'demo-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: DEMO_USER,
        },
      },
      error: null,
    }),
    onAuthStateChange: (_cb: any) => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signInWithPassword: async () => {
      enableDemoMode();
      return {
        data: { session: { user: DEMO_USER }, user: DEMO_USER },
        error: null,
      };
    },
    signInWithOAuth: async () => ({ data: {}, error: null }),
    updateUser: async () => ({ data: { user: DEMO_USER }, error: null }),
    signOut: async () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(DEMO_FLAG_KEY);
      }
      return { error: null };
    },
  },
};

const fallbackTypeClient = createClient(
  supabaseUrl || 'https://demo.supabase.co',
  supabaseKey || 'demo-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const supabase: typeof fallbackTypeClient = new Proxy(
  {},
  {
    get(_target, prop) {
      const activeClient =
        isDemoModeEnabled() || !supabaseUrl || !supabaseKey
          ? demoSupabaseClient
          : fallbackTypeClient;
      return (activeClient as any)[prop];
    },
  }
) as unknown as typeof fallbackTypeClient;