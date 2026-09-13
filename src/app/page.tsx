'use client';

import React, { useState, useEffect } from 'react';
import { 
  TaskItem, 
  Client, 
  HabitItem, 
  ActiveView, 
  WorkspaceType, 
  TaskWorkspace, 
  TaskPriority, 
  TaskStatus 
} from '@/types';
import {
  loadAll,
  createTask as dbCreateTask,
  updateTask as dbUpdateTask,
  deleteTask as dbDeleteTask,
  createClientRecord,
  updateClientRecord,
  deleteClientRecord,
  createHabit as dbCreateHabit,
  updateHabit as dbUpdateHabit,
  deleteHabit as dbDeleteHabit,
  clearAllData,
  loadSampleDemoData,
} from '@/lib/db';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { CommandPalette } from '@/components/common/CommandPalette';
import { TaskModal } from '@/components/modals/TaskModal';
import { ClientModal } from '@/components/modals/ClientModal';
import { DashboardView } from '@/components/views/DashboardView';
import { KanbanView } from '@/components/views/KanbanView';
import { ListView } from '@/components/views/ListView';
import { CalendarView } from '@/components/views/CalendarView';
import { ClientsView } from '@/components/views/ClientsView';
import { HabitsView } from '@/components/views/HabitsView';
import { getTodayString, toLocalDateString } from '@/lib/utils';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  CalendarDays, 
  KanbanSquare, 
  Plus, 
  Search, 
  Sparkles,
  CheckSquare,
  Users2,
  Flame
} from 'lucide-react';

export default function TrackerApp() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active view & filtering states
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [taskModalDefaultWorkspace, setTaskModalDefaultWorkspace] = useState<TaskWorkspace>('personal');
  const [taskModalDefaultStatus, setTaskModalDefaultStatus] = useState<TaskStatus | undefined>(undefined);
  const [taskModalDefaultDate, setTaskModalDefaultDate] = useState<string | undefined>(undefined);
  const [taskModalDefaultTime, setTaskModalDefaultTime] = useState<string | undefined>(undefined);
  const [taskModalDefaultClientId, setTaskModalDefaultClientId] = useState<string | undefined>(undefined);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Load data from Supabase on mount
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUserEmail(user?.email ?? null);

        const { tasks, clients, habits } = await loadAll();
        setTasks(tasks);
        setClients(clients);
        setHabits(habits);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to load your data.');
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter tasks based on workspace, search query, priority, and status
  const filteredTasks = tasks.filter((t) => {
    // Workspace filter
    if (currentWorkspace !== 'all' && t.workspace !== currentWorkspace) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchClient = t.clientName?.toLowerCase().includes(q);
      const matchTag = t.tags.some((tag) => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchClient && !matchTag) {
        return false;
      }
    }
    // Priority filter
    if (selectedPriority !== 'all' && t.priority !== selectedPriority) {
      return false;
    }
    // Status filter
    if (selectedStatus !== 'all' && t.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  // Task Actions
  const handleSaveTask = async (taskData: Partial<TaskItem>) => {
    try {
      if (taskData.id) {
        // Edit existing
        const updated = await dbUpdateTask(taskData.id, taskData);
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        // Create new
        const created = await dbCreateTask({
          title: taskData.title || 'Untitled Item',
          description: taskData.description || '',
          workspace: taskData.workspace || 'personal',
          status: taskData.status || taskModalDefaultStatus || 'todo',
          priority: taskData.priority || 'medium',
          dueDate: taskData.dueDate || taskModalDefaultDate || getTodayString(),
          dueTime: taskData.dueTime,
          tags: taskData.tags || [],
          clientId: taskData.clientId || taskModalDefaultClientId,
          clientName: taskData.clientName,
          isEvent: taskData.isEvent || false,
          eventDurationMinutes: taskData.eventDurationMinutes,
          location: taskData.location,
          estimatedHours: taskData.estimatedHours,
        });
        setTasks((prev) => [created, ...prev]);
      }
      setEditingTask(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save the task.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await dbDeleteTask(taskId);
    } catch (err) {
      setTasks(previous);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete the task.');
    }
  };

  const handleToggleTaskStatus = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    const completedAt = nextStatus === 'done' ? getTodayString() : undefined;
    const previous = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus, completedAt } : t))
    );
    try {
      await dbUpdateTask(taskId, { status: nextStatus, completedAt });
    } catch (err) {
      setTasks(previous);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update the task.');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const completedAt = newStatus === 'done' ? getTodayString() : undefined;
    const previous = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, completedAt } : t))
    );
    try {
      await dbUpdateTask(taskId, { status: newStatus, completedAt });
    } catch (err) {
      setTasks(previous);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update the task.');
    }
  };

  const handleOpenTaskModal = (
    ws?: TaskWorkspace,
    status?: TaskStatus,
    date?: string,
    clientId?: string,
    time?: string
  ) => {
    setEditingTask(null);
    setTaskModalDefaultWorkspace(
      ws || (currentWorkspace === 'all' ? 'personal' : (currentWorkspace as TaskWorkspace))
    );
    setTaskModalDefaultStatus(status || 'todo');
    setTaskModalDefaultDate(date || getTodayString());
    setTaskModalDefaultClientId(clientId);
    setTaskModalDefaultTime(time);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: TaskItem) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // Client Actions
  const handleSaveClient = async (clientData: Partial<Client>) => {
    try {
      if (clientData.id) {
        const updated = await updateClientRecord(clientData.id, clientData);
        setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        if (clientData.company) {
          setTasks((prev) =>
            prev.map((t) =>
              t.clientId === clientData.id ? { ...t, clientName: clientData.company } : t
            )
          );
        }
      } else {
        const created = await createClientRecord({
          name: clientData.name || clientData.company || 'New Client',
          company: clientData.company || 'Client Co',
          email: clientData.email || '',
          phone: clientData.phone,
          status: clientData.status || 'active',
          rate: clientData.rate || '$150/hr',
          totalBudget: clientData.totalBudget,
          color: clientData.color || '#171717',
          notes: clientData.notes || '',
        });
        setClients((prev) => [...prev, created]);
      }
      setEditingClient(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save the client.');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    const previous = clients;
    setClients((prev) => prev.filter((c) => c.id !== clientId));
    try {
      await deleteClientRecord(clientId);
    } catch (err) {
      setClients(previous);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete the client.');
    }
  };

  const handleOpenClientModal = (client?: Client) => {
    setEditingClient(client || null);
    setIsClientModalOpen(true);
  };

  // Habit Actions
  const handleToggleHabitDate = async (habitId: string, dateStr: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const exists = habit.completedDates.includes(dateStr);
    const nextDates = exists
      ? habit.completedDates.filter((d) => d !== dateStr)
      : [...habit.completedDates, dateStr];

    let streak = 0;
    let checkDate = new Date();
    while (true) {
      const checkStr = toLocalDateString(checkDate);
      if (nextDates.includes(checkStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const previous = habits;
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, completedDates: nextDates, streak } : h))
    );
    try {
      await dbUpdateHabit(habitId, { completedDates: nextDates, streak });
    } catch (err) {
      setHabits(previous);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update the habit.');
    }
  };

  const handleToggleHabitToday = (habitId: string) => {
    handleToggleHabitDate(habitId, getTodayString());
  };

  const handleAddHabit = async (habitData: Partial<HabitItem>) => {
    try {
      const created = await dbCreateHabit({
        title: habitData.title || 'New Routine',
        workspace: habitData.workspace || 'personal',
        category: habitData.category || 'General',
        frequency: 'daily',
        targetDaysPerWeek: 7,
        completedDates: [],
        streak: 0,
      });
      setHabits((prev) => [...prev, created]);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add the habit.');
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    const previous = habits;
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    try {
      await dbDeleteHabit(habitId);
    } catch (err) {
      setHabits(previous);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete the habit.');
    }
  };

  // Clear all workspace data
  const handleClearAllData = async () => {
    if (confirm('Clear all tasks, events, and clients for a fresh clean slate?')) {
      try {
        const empty = await clearAllData();
        setTasks(empty.tasks);
        setClients(empty.clients);
        setHabits(empty.habits);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to clear data.');
      }
    }
  };

  // Load sample demo data
  const handleLoadSampleData = async () => {
    try {
      const samples = await loadSampleDemoData();
      setTasks(samples.tasks);
      setClients(samples.clients);
      setHabits(samples.habits);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load sample data.');
    }
  };

  // Counters for badges
  const taskCounts = {
    all: tasks.length,
    personal: tasks.filter((t) => t.workspace === 'personal').length,
    business: tasks.filter((t) => t.workspace === 'business').length,
    client: tasks.filter((t) => t.workspace === 'client').length,
  };

  const urgentCount = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length;
  const eventsTodayCount = tasks.filter(
    (t) => (t.dueDate === getTodayString() || t.isEvent) && t.status !== 'done'
  ).length;

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-50 text-neutral-600 font-mono text-xs">
        Loading ChronoTrack System...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-50 text-neutral-800 overflow-hidden font-sans">
      
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          activeView={activeView}
          onSelectView={setActiveView}
          currentWorkspace={currentWorkspace}
          onSelectWorkspace={setCurrentWorkspace}
          urgentCount={urgentCount}
          eventsTodayCount={eventsTodayCount}
          activeClientCount={clients.filter((c) => c.status === 'active').length}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />
      </div>

      {/* Mobile Sidebar Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-72 h-full bg-white border-r border-neutral-200 shadow-2xl flex flex-col">
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 z-20"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar
              activeView={activeView}
              onSelectView={(v) => {
                setActiveView(v);
                setIsMobileSidebarOpen(false);
              }}
              currentWorkspace={currentWorkspace}
              onSelectWorkspace={(w) => {
                setCurrentWorkspace(w);
                setIsMobileSidebarOpen(false);
              }}
              urgentCount={urgentCount}
              eventsTodayCount={eventsTodayCount}
              activeClientCount={clients.filter((c) => c.status === 'active').length}
              onOpenCommandPalette={() => {
                setIsCommandPaletteOpen(true);
                setIsMobileSidebarOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Mobile Top Bar */}
        <div className="md:hidden flex flex-col border-b border-neutral-200 bg-white/95 backdrop-blur-md px-3 py-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                title="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-900 flex items-center gap-1">
                    ChronoTrack
                    <span className="text-[9px] font-mono px-1 py-0.1 rounded bg-neutral-100 text-black border border-neutral-300">PRO</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                title="Search / Command (⌘K)"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleOpenTaskModal()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-semibold shadow-xs hover:bg-black transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Mobile Workspace Selector (Horizontal Pill Scroll) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 scrollbar-none text-xs">
            <button
              onClick={() => setCurrentWorkspace('all')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition-all ${
                currentWorkspace === 'all'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80'
              }`}
            >
              All ({taskCounts.all})
            </button>
            <button
              onClick={() => setCurrentWorkspace('personal')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition-all ${
                currentWorkspace === 'personal'
                  ? 'bg-stone-600 text-white shadow-2xs'
                  : 'bg-stone-50 text-stone-700 border border-stone-200/70 hover:bg-stone-100/60'
              }`}
            >
              Personal ({taskCounts.personal})
            </button>
            <button
              onClick={() => setCurrentWorkspace('business')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition-all ${
                currentWorkspace === 'business'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-neutral-100 text-black border border-neutral-300/70 hover:bg-neutral-200/60'
              }`}
            >
              Business ({taskCounts.business})
            </button>
            <button
              onClick={() => setCurrentWorkspace('client')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition-all ${
                currentWorkspace === 'client'
                  ? 'bg-zinc-700 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-900 border border-zinc-300/70 hover:bg-zinc-200/60'
              }`}
            >
              Clients ({taskCounts.client})
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header
            activeView={activeView}
            currentWorkspace={currentWorkspace}
            onSelectWorkspace={setCurrentWorkspace}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedPriority={selectedPriority}
            onPriorityChange={setSelectedPriority}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            onOpenTaskModal={() => handleOpenTaskModal()}
            onOpenClientModal={() => handleOpenClientModal()}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onClearData={handleClearAllData}
            onLoadSampleData={handleLoadSampleData}
            onSignOut={handleSignOut}
            userEmail={userEmail}
            taskCounts={taskCounts}
          />
        </div>

        {/* Dynamic View Body */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 pb-28 md:pb-8 bg-neutral-50">
          {errorMessage && (
            <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-black bg-white px-4 py-3 text-sm text-black">
              <span>⚠ {errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="shrink-0 text-xs font-semibold text-neutral-500 hover:text-black"
              >
                Dismiss
              </button>
            </div>
          )}

          {activeView === 'dashboard' && (
            <DashboardView
              tasks={filteredTasks}
              clients={clients}
              habits={habits}
              onToggleTaskStatus={handleToggleTaskStatus}
              onEditTask={handleEditTask}
              onOpenTaskModal={handleOpenTaskModal}
              onSelectView={setActiveView}
              onToggleHabit={handleToggleHabitToday}
            />
          )}

          {activeView === 'kanban' && (
            <KanbanView
              tasks={filteredTasks}
              onUpdateStatus={handleUpdateTaskStatus}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onOpenTaskModal={handleOpenTaskModal}
            />
          )}

          {activeView === 'list' && (
            <ListView
              tasks={filteredTasks}
              onToggleStatus={handleToggleTaskStatus}
              onUpdateStatus={handleUpdateTaskStatus}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onOpenTaskModal={handleOpenTaskModal}
            />
          )}

          {activeView === 'calendar' && (
            <CalendarView
              tasks={filteredTasks}
              onToggleStatus={handleToggleTaskStatus}
              onEditTask={handleEditTask}
              onOpenTaskModal={handleOpenTaskModal}
            />
          )}

          {activeView === 'clients' && (
            <ClientsView
              clients={clients}
              tasks={tasks}
              onOpenClientModal={handleOpenClientModal}
              onDeleteClient={handleDeleteClient}
              onOpenTaskModal={handleOpenTaskModal}
              onEditTask={handleEditTask}
              onToggleTaskStatus={handleToggleTaskStatus}
            />
          )}

          {activeView === 'habits' && (
            <HabitsView
              habits={habits}
              onToggleDate={handleToggleHabitDate}
              onAddHabit={handleAddHabit}
              onDeleteHabit={handleDeleteHabit}
            />
          )}
        </main>
      </div>

      {/* Modals & Command Palette */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        editingTask={editingTask}
        clients={clients}
        tasks={tasks}
        defaultWorkspace={taskModalDefaultWorkspace}
        defaultDate={taskModalDefaultDate}
        defaultTime={taskModalDefaultTime}
      />

      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleSaveClient}
        editingClient={editingClient}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        clients={clients}
        onSelectView={setActiveView}
        onSelectWorkspace={setCurrentWorkspace}
        onOpenTaskModal={handleOpenTaskModal}
        onOpenClientModal={() => handleOpenClientModal()}
        onEditTask={handleEditTask}
        onClearData={handleClearAllData}
        onLoadSampleData={handleLoadSampleData}
      />

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-neutral-200 px-3 py-1.5 flex items-center justify-around pb-safe shadow-lg">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeView === 'dashboard'
              ? 'text-neutral-900 font-bold'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Control</span>
        </button>

        <button
          onClick={() => setActiveView('calendar')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl relative transition-all ${
            activeView === 'calendar'
              ? 'text-neutral-900 font-bold'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <CalendarDays className="w-5 h-5" />
          {eventsTodayCount > 0 && (
            <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-neutral-900" />
          )}
          <span className="text-[10px] mt-0.5">Calendar</span>
        </button>

        {/* Center Thumb Floating + Quick Add Action */}
        <button
          onClick={() => handleOpenTaskModal()}
          className="flex flex-col items-center justify-center -tranneutral-y-3.5 focus:outline-none group"
          title="New Item"
        >
          <div className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow-lg shadow-neutral-900/35 hover:bg-black active:scale-95 transition-all">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-semibold text-neutral-700 mt-0.5">Add</span>
        </button>

        <button
          onClick={() => setActiveView('kanban')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeView === 'kanban'
              ? 'text-neutral-900 font-bold'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <KanbanSquare className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Kanban</span>
        </button>

        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeView === 'list' || activeView === 'clients' || activeView === 'habits'
              ? 'text-neutral-900 font-bold'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>
      </nav>

    </div>
  );
}
