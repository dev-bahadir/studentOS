export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type Status = 'backlog' | 'todo' | 'in_progress' | 'done'
export type SRSGrade = 0 | 1 | 2 | 3 | 4 | 5

export interface UserProfile {
  id: string
  email: string
  username: string | null
  avatar_url: string | null
  level: number
  total_xp: number
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description?: string
  priority: Priority
  status: Status
  due_date?: string
  xp_reward: number
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  tags: string[]
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface Deck {
  id: string
  user_id: string
  name: string
  description?: string
  color?: string
  created_at: string
}

export interface Flashcard {
  id: string
  deck_id: string
  front: string
  back: string
  interval: number
  ease_factor: number
  next_review_at: string
  created_at: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  tags: string[]
  is_pinned: boolean
  created_at: string
  updated_at: string
}