import { TaskItem, Client, HabitItem } from '@/types';
import { getTodayString, getDaysOffset } from './utils';

// Version 2 storage keys - clean slate by default
const TASKS_STORAGE_KEY = 'chronotrack_tasks_v2';
const CLIENTS_STORAGE_KEY = 'chronotrack_clients_v2';
const HABITS_STORAGE_KEY = 'chronotrack_habits_v2';

// Empty default state for user creation
export const INITIAL_TASKS: TaskItem[] = [];
export const INITIAL_CLIENTS: Client[] = [];
export const INITIAL_HABITS: HabitItem[] = [];

// Retained sample datasets for optional "Load Sample Data" demonstration
export const SAMPLE_CLIENTS: Client[] = [
  {
    id: 'client-1',
    name: 'Sarah Chen',
    company: 'Apex Innovations',
    email: 'sarah@apexinnovations.io',
    phone: '+1 (555) 342-9182',
    status: 'active',
    rate: '$150/hr',
    totalBudget: '$24,000',
    color: '#6366F1',
    notes: 'Q3 Enterprise Design System revamp and mobile onboarding overhaul.',
    createdAt: getDaysOffset(-20),
  },
  {
    id: 'client-2',
    name: 'Marcus Vance',
    company: 'Nova Retail Brands',
    email: 'm.vance@novabrands.co',
    phone: '+1 (555) 782-4410',
    status: 'active',
    rate: '$5,000/mo retainer',
    totalBudget: '$30,000',
    color: '#F59E0B',
    notes: 'E-commerce platform migration and headless Shopify frontend architecture.',
    createdAt: getDaysOffset(-15),
  },
  {
    id: 'client-3',
    name: 'Elena Rostova',
    company: 'Stellar Health Tech',
    email: 'elena@stellarhealth.org',
    phone: '+1 (555) 901-2245',
    status: 'lead',
    rate: '$135/hr',
    totalBudget: '$15,000',
    color: '#10B981',
    notes: 'Telehealth patient portal compliance audit and accessibility uplift.',
    createdAt: getDaysOffset(-5),
  },
];

export const SAMPLE_TASKS: TaskItem[] = [
  {
    id: 's-t-1',
    title: 'Annual preventative health checkup',
    description: 'Appointment at St. Jude Health Pavilion. Bring medical requisition forms.',
    workspace: 'personal',
    status: 'todo',
    priority: 'high',
    dueDate: getTodayString(),
    dueTime: '09:30',
    tags: ['Health'],
    isEvent: true,
    eventDurationMinutes: 60,
    createdAt: getTodayString(),
  },
  {
    id: 's-t-2',
    title: 'Review Q3 P&L Statement with Accountant',
    description: 'Analyze quarterly revenue and tax deductions.',
    workspace: 'business',
    status: 'todo',
    priority: 'urgent',
    dueDate: getTodayString(),
    dueTime: '14:00',
    tags: ['Finance', 'Taxes'],
    isEvent: true,
    createdAt: getTodayString(),
  },
  {
    id: 's-t-3',
    title: 'Apex Innovations: Deliver Final Mobile UX',
    description: 'Deliver responsive prototype and component specs.',
    workspace: 'client',
    clientId: 'client-1',
    clientName: 'Apex Innovations',
    status: 'in_progress',
    priority: 'urgent',
    dueDate: getDaysOffset(1),
    tags: ['Design', 'Milestone'],
    createdAt: getTodayString(),
  },
];

export const SAMPLE_HABITS: HabitItem[] = [
  {
    id: 's-h-1',
    title: 'Morning 90-min Deep Work Block',
    workspace: 'business',
    category: 'Productivity',
    frequency: 'daily',
    targetDaysPerWeek: 6,
    completedDates: [getDaysOffset(-1), getTodayString()],
    streak: 2,
    createdAt: getDaysOffset(-10),
  },
  {
    id: 's-h-2',
    title: 'Workout & 30-min Cardio / Mobility',
    workspace: 'personal',
    category: 'Health',
    frequency: 'daily',
    targetDaysPerWeek: 5,
    completedDates: [getTodayString()],
    streak: 1,
    createdAt: getDaysOffset(-10),
  },
];

// Storage Getters & Setters
export function loadTasks(): TaskItem[] {
  if (typeof window === 'undefined') return [];
  try {
    // Clear old v1 tasks if present to ensure clean slate
    if (localStorage.getItem('chronotrack_tasks_v1')) {
      localStorage.removeItem('chronotrack_tasks_v1');
    }
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) {
      saveTasks([]);
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading tasks from storage', e);
    return [];
  }
}

export function saveTasks(tasks: TaskItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving tasks to storage', e);
  }
}

export function loadClients(): Client[] {
  if (typeof window === 'undefined') return [];
  try {
    if (localStorage.getItem('chronotrack_clients_v1')) {
      localStorage.removeItem('chronotrack_clients_v1');
    }
    const raw = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (!raw) {
      saveClients([]);
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading clients from storage', e);
    return [];
  }
}

export function saveClients(clients: Client[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  } catch (e) {
    console.error('Error saving clients to storage', e);
  }
}

export function loadHabits(): HabitItem[] {
  if (typeof window === 'undefined') return [];
  try {
    if (localStorage.getItem('chronotrack_habits_v1')) {
      localStorage.removeItem('chronotrack_habits_v1');
    }
    const raw = localStorage.getItem(HABITS_STORAGE_KEY);
    if (!raw) {
      saveHabits([]);
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading habits from storage', e);
    return [];
  }
}

export function saveHabits(habits: HabitItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
  } catch (e) {
    console.error('Error saving habits to storage', e);
  }
}

export function clearAllData(): { tasks: TaskItem[]; clients: Client[]; habits: HabitItem[] } {
  saveTasks([]);
  saveClients([]);
  saveHabits([]);
  return { tasks: [], clients: [], habits: [] };
}

export function loadSampleDemoData(): { tasks: TaskItem[]; clients: Client[]; habits: HabitItem[] } {
  saveTasks(SAMPLE_TASKS);
  saveClients(SAMPLE_CLIENTS);
  saveHabits(SAMPLE_HABITS);
  return { tasks: SAMPLE_TASKS, clients: SAMPLE_CLIENTS, habits: SAMPLE_HABITS };
}

export function resetToDefaults(): { tasks: TaskItem[]; clients: Client[]; habits: HabitItem[] } {
  return clearAllData();
}
