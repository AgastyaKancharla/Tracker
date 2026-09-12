import { TaskItem, Client, HabitItem } from '@/types';
import { createClient } from '@/lib/supabase/client';

// --- Row <-> App type mapping (DB is snake_case, app types are camelCase) ---

type TaskRow = {
  id: string;
  title: string;
  description: string;
  workspace: TaskItem['workspace'];
  status: TaskItem['status'];
  priority: TaskItem['priority'];
  due_date: string | null;
  due_time: string | null;
  tags: string[];
  client_id: string | null;
  is_event: boolean;
  event_duration_minutes: number | null;
  location: string | null;
  estimated_hours: number | null;
  logged_hours: number | null;
  completed_at: string | null;
  created_at: string;
  clients?: { name: string } | null;
};

type ClientRow = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  status: Client['status'];
  rate: string;
  color: string;
  notes: string;
  total_budget: string | null;
  created_at: string;
};

type HabitRow = {
  id: string;
  title: string;
  workspace: HabitItem['workspace'];
  category: string;
  frequency: HabitItem['frequency'];
  target_days_per_week: number;
  completed_dates: string[];
  streak: number;
  created_at: string;
};

function taskFromRow(row: TaskRow): TaskItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    workspace: row.workspace,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date ?? undefined,
    dueTime: row.due_time ?? undefined,
    tags: row.tags ?? [],
    clientId: row.client_id ?? undefined,
    clientName: row.clients?.name,
    isEvent: row.is_event,
    eventDurationMinutes: row.event_duration_minutes ?? undefined,
    location: row.location ?? undefined,
    estimatedHours: row.estimated_hours ?? undefined,
    loggedHours: row.logged_hours ?? undefined,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
  };
}

function taskToRow(task: Partial<TaskItem>, userId: string) {
  return {
    user_id: userId,
    title: task.title,
    description: task.description ?? '',
    workspace: task.workspace,
    status: task.status,
    priority: task.priority,
    due_date: task.dueDate ?? null,
    due_time: task.dueTime ?? null,
    tags: task.tags ?? [],
    client_id: task.clientId ?? null,
    is_event: task.isEvent ?? false,
    event_duration_minutes: task.eventDurationMinutes ?? null,
    location: task.location ?? null,
    estimated_hours: task.estimatedHours ?? null,
    logged_hours: task.loggedHours ?? null,
    completed_at: task.completedAt ?? null,
  };
}

function clientFromRow(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    email: row.email,
    phone: row.phone ?? undefined,
    status: row.status,
    rate: row.rate,
    color: row.color,
    notes: row.notes,
    totalBudget: row.total_budget ?? undefined,
    createdAt: row.created_at,
  };
}

function clientToRow(client: Partial<Client>, userId: string) {
  return {
    user_id: userId,
    name: client.name,
    company: client.company ?? '',
    email: client.email ?? '',
    phone: client.phone ?? null,
    status: client.status,
    rate: client.rate ?? '',
    color: client.color ?? '#6366F1',
    notes: client.notes ?? '',
    total_budget: client.totalBudget ?? null,
  };
}

function habitFromRow(row: HabitRow): HabitItem {
  return {
    id: row.id,
    title: row.title,
    workspace: row.workspace,
    category: row.category,
    frequency: row.frequency,
    targetDaysPerWeek: row.target_days_per_week,
    completedDates: row.completed_dates ?? [],
    streak: row.streak,
    createdAt: row.created_at,
  };
}

function habitToRow(habit: Partial<HabitItem>, userId: string) {
  return {
    user_id: userId,
    title: habit.title,
    workspace: habit.workspace,
    category: habit.category ?? '',
    frequency: habit.frequency,
    target_days_per_week: habit.targetDaysPerWeek ?? 7,
    completed_dates: habit.completedDates ?? [],
    streak: habit.streak ?? 0,
  };
}

async function requireUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  return user.id;
}

// --- Tasks ---

export async function fetchTasks(): Promise<TaskItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tasks')
    .select('*, clients(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as TaskRow[]).map(taskFromRow);
}

export async function createTask(task: Omit<TaskItem, 'id' | 'createdAt'>): Promise<TaskItem> {
  const userId = await requireUserId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tasks')
    .insert(taskToRow(task, userId))
    .select('*, clients(name)')
    .single();
  if (error) throw error;
  return taskFromRow(data as TaskRow);
}

export async function updateTask(id: string, task: Partial<TaskItem>): Promise<TaskItem> {
  const userId = await requireUserId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tasks')
    .update(taskToRow(task, userId))
    .eq('id', id)
    .select('*, clients(name)')
    .single();
  if (error) throw error;
  return taskFromRow(data as TaskRow);
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteAllTasks(): Promise<void> {
  const userId = await requireUserId();
  const supabase = createClient();
  const { error } = await supabase.from('tasks').delete().eq('user_id', userId);
  if (error) throw error;
}

// --- Clients ---

export async function fetchClients(): Promise<Client[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ClientRow[]).map(clientFromRow);
}

export async function createClientRecord(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
  const userId = await requireUserId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clients')
    .insert(clientToRow(client, userId))
    .select('*')
    .single();
  if (error) throw error;
  return clientFromRow(data as ClientRow);
}

export async function updateClientRecord(id: string, client: Partial<Client>): Promise<Client> {
  const userId = await requireUserId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clients')
    .update(clientToRow(client, userId))
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return clientFromRow(data as ClientRow);
}

export async function deleteClientRecord(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteAllClients(): Promise<void> {
  const userId = await requireUserId();
  const supabase = createClient();
  const { error } = await supabase.from('clients').delete().eq('user_id', userId);
  if (error) throw error;
}

// --- Habits ---

export async function fetchHabits(): Promise<HabitItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as HabitRow[]).map(habitFromRow);
}

export async function createHabit(habit: Omit<HabitItem, 'id' | 'createdAt'>): Promise<HabitItem> {
  const userId = await requireUserId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from('habits')
    .insert(habitToRow(habit, userId))
    .select('*')
    .single();
  if (error) throw error;
  return habitFromRow(data as HabitRow);
}

export async function updateHabit(id: string, habit: Partial<HabitItem>): Promise<HabitItem> {
  const userId = await requireUserId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from('habits')
    .update(habitToRow(habit, userId))
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return habitFromRow(data as HabitRow);
}

export async function deleteHabit(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('habits').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteAllHabits(): Promise<void> {
  const userId = await requireUserId();
  const supabase = createClient();
  const { error } = await supabase.from('habits').delete().eq('user_id', userId);
  if (error) throw error;
}

// --- Bulk helpers used by the app shell ---

export async function loadAll(): Promise<{ tasks: TaskItem[]; clients: Client[]; habits: HabitItem[] }> {
  const [tasks, clients, habits] = await Promise.all([fetchTasks(), fetchClients(), fetchHabits()]);
  return { tasks, clients, habits };
}

export async function clearAllData(): Promise<{ tasks: TaskItem[]; clients: Client[]; habits: HabitItem[] }> {
  await Promise.all([deleteAllTasks(), deleteAllClients(), deleteAllHabits()]);
  return { tasks: [], clients: [], habits: [] };
}

export async function loadSampleDemoData(): Promise<{ tasks: TaskItem[]; clients: Client[]; habits: HabitItem[] }> {
  const { SAMPLE_CLIENTS, SAMPLE_TASKS, SAMPLE_HABITS } = await import('./sampleData');
  await clearAllData();

  const createdClients: Client[] = [];
  for (const c of SAMPLE_CLIENTS) {
    const { id: _id, createdAt: _createdAt, ...rest } = c;
    createdClients.push(await createClientRecord(rest));
  }
  const clientIdByOldId = new Map(SAMPLE_CLIENTS.map((c, i) => [c.id, createdClients[i].id]));

  const createdTasks: TaskItem[] = [];
  for (const t of SAMPLE_TASKS) {
    const { id: _id, createdAt: _createdAt, ...rest } = t;
    const mapped = { ...rest, clientId: rest.clientId ? clientIdByOldId.get(rest.clientId) : undefined };
    createdTasks.push(await createTask(mapped));
  }

  const createdHabits: HabitItem[] = [];
  for (const h of SAMPLE_HABITS) {
    const { id: _id, createdAt: _createdAt, ...rest } = h;
    createdHabits.push(await createHabit(rest));
  }

  return { tasks: createdTasks, clients: createdClients, habits: createdHabits };
}
