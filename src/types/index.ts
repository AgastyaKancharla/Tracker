export type WorkspaceType = 'all' | 'personal' | 'business' | 'client';
export type TaskWorkspace = 'personal' | 'business' | 'client';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  workspace: TaskWorkspace;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // YYYY-MM-DD (optional: tasks without deadline remain In Progress / Ongoing)
  dueTime?: string; // HH:mm (target completion time or event start time)
  tags: string[];
  clientId?: string;
  clientName?: string;
  isEvent?: boolean;
  eventDurationMinutes?: number;
  location?: string;
  estimatedHours?: number; // How long it takes (e.g. 2 hours)
  loggedHours?: number;
  completedAt?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  status: 'lead' | 'active' | 'completed' | 'on_hold';
  rate: string;
  color: string;
  notes: string;
  totalBudget?: string;
  createdAt: string;
}

export interface HabitItem {
  id: string;
  title: string;
  workspace: TaskWorkspace;
  category: string;
  frequency: 'daily' | 'weekdays' | 'weekly';
  targetDaysPerWeek: number;
  completedDates: string[]; // YYYY-MM-DD
  streak: number;
  createdAt: string;
}

export type ActiveView = 'dashboard' | 'kanban' | 'list' | 'calendar' | 'clients' | 'habits';

export interface FilterOptions {
  search: string;
  workspace: WorkspaceType;
  priority: TaskPriority | 'all';
  status: TaskStatus | 'all';
  clientId: string | 'all';
  tag: string | 'all';
}
