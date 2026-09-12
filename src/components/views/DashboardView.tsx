'use client';

import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Building2, 
  Calendar, 
  User, 
  Briefcase, 
  Plus, 
  ArrowUpRight, 
  Flame, 
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Timer,
  AlertTriangle
} from 'lucide-react';
import { TaskItem, Client, HabitItem, ActiveView, TaskWorkspace } from '@/types';
import { formatDate, getTodayString, getDeadlineInfo, formatDuration, calculateDaysRemaining } from '@/lib/utils';

interface DashboardViewProps {
  tasks: TaskItem[];
  clients: Client[];
  habits: HabitItem[];
  onToggleTaskStatus: (taskId: string) => void;
  onEditTask: (task: TaskItem) => void;
  onOpenTaskModal: (workspace?: TaskWorkspace) => void;
  onSelectView: (view: ActiveView) => void;
  onToggleHabit: (habitId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  clients,
  habits,
  onToggleTaskStatus,
  onEditTask,
  onOpenTaskModal,
  onSelectView,
  onToggleHabit,
}) => {
  const todayStr = getTodayString();

  // Metrics
  const personalTasks = tasks.filter(t => t.workspace === 'personal');
  const businessTasks = tasks.filter(t => t.workspace === 'business');
  const clientTasks = tasks.filter(t => t.workspace === 'client');

  const activeTasks = tasks.filter(t => t.status !== 'done');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');

  // Sort active tasks by nearest deadline
  const sortedDeadlines = [...activeTasks].sort((a, b) => {
    const daysA = calculateDaysRemaining(a.dueDate);
    const daysB = calculateDaysRemaining(b.dueDate);
    if (daysA === null && daysB !== null) return 1;
    if (daysB === null && daysA !== null) return -1;
    if (daysA === null && daysB === null) return 0;
    return (daysA as number) - (daysB as number);
  });

  const habitsDoneToday = habits.filter(h => h.completedDates.includes(todayStr)).length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Top Welcome / Mission Control Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-100/80 via-white to-neutral-100/40 p-5 sm:p-6 border border-neutral-200 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-neutral-100 border border-neutral-300 text-black text-xs font-mono mb-2">
              <span className="w-2 h-2 rounded-full bg-stone-500 animate-pulse" />
              ChronoTrack Unified Command Center
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              {activeTasks.length > 0 ? (
                <>You have <span className="text-neutral-900">{activeTasks.length} active deliverables</span> on your schedule.</>
              ) : (
                <>Welcome! Your workspace is clear and ready.</>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-xl">
              Track what each task is, when the deadline lands, how long it takes, and monitor progress until completion.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onOpenTaskModal()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Task / Deadline</span>
            </button>
            <button
              onClick={() => onSelectView('kanban')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 hover:text-neutral-900 text-xs font-medium transition-all shadow-2xs"
            >
              <span>Kanban</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid: 3 Spheres Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
        
        {/* Personal Sphere Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 hover:border-stone-300 transition-all group relative overflow-hidden shadow-xs hover:shadow-md">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-600">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Personal Realm</h3>
                <span className="text-[10px] text-neutral-400 font-mono">Wellness & Habits</span>
              </div>
            </div>
            <button 
              onClick={() => onOpenTaskModal('personal')}
              className="p-1 rounded-lg text-neutral-400 hover:text-stone-600 hover:bg-stone-50 transition-colors"
              title="Add personal item"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center my-3">
            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <div className="text-lg font-bold text-neutral-900 font-mono">
                {personalTasks.filter(t => t.status !== 'done').length}
              </div>
              <div className="text-[10px] text-neutral-500 uppercase">Active Tasks</div>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <div className="text-lg font-bold text-stone-600 font-mono">
                {habitsDoneToday} / {habits.length}
              </div>
              <div className="text-[10px] text-neutral-500 uppercase">Habits Today</div>
            </div>
          </div>

          <div className="text-[11px] text-neutral-500 flex items-center justify-between pt-2 border-t border-neutral-100">
            <span>
              {personalTasks.length > 0 
                ? `${personalTasks.filter(t => t.status !== 'done').length} pending tasks` 
                : 'No personal tasks yet'}
            </span>
            <button 
              onClick={() => onOpenTaskModal('personal')}
              className="text-stone-600 font-medium hover:underline flex items-center gap-0.5"
            >
              + Add item
            </button>
          </div>
        </div>

        {/* Business Hub Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 hover:border-neutral-400 transition-all group relative overflow-hidden shadow-xs hover:shadow-md">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-900">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Business Hub</h3>
                <span className="text-[10px] text-neutral-400 font-mono">Operations & Growth</span>
              </div>
            </div>
            <button 
              onClick={() => onOpenTaskModal('business')}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              title="Add business item"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center my-3">
            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <div className="text-lg font-bold text-neutral-900 font-mono">
                {businessTasks.filter(t => t.status !== 'done').length}
              </div>
              <div className="text-[10px] text-neutral-500 uppercase">Active Ops</div>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <div className="text-lg font-bold text-neutral-900 font-mono">
                {businessTasks.filter(t => t.status === 'in_progress').length}
              </div>
              <div className="text-[10px] text-neutral-500 uppercase">In Progress</div>
            </div>
          </div>

          <div className="text-[11px] text-neutral-500 flex items-center justify-between pt-2 border-t border-neutral-100">
            <span>
              {businessTasks.length > 0 
                ? `${businessTasks.filter(t => t.status !== 'done').length} active goals` 
                : 'No business goals yet'}
            </span>
            <button 
              onClick={() => onOpenTaskModal('business')}
              className="text-neutral-900 font-medium hover:underline flex items-center gap-0.5"
            >
              + Add goal
            </button>
          </div>
        </div>

        {/* Client Projects Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 hover:border-zinc-400 transition-all group relative overflow-hidden shadow-xs hover:shadow-md sm:col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-zinc-100 border border-zinc-300 text-zinc-700">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Client Hub</h3>
                <span className="text-[10px] text-neutral-400 font-mono">Deliverables & Billing</span>
              </div>
            </div>
            <button 
              onClick={() => onOpenTaskModal('client')}
              className="p-1 rounded-lg text-neutral-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              title="Add client deliverable"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center my-3">
            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <div className="text-lg font-bold text-neutral-900 font-mono">
                {clients.filter(c => c.status === 'active').length}
              </div>
              <div className="text-[10px] text-neutral-500 uppercase">Active Accounts</div>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
              <div className="text-lg font-bold text-zinc-700 font-mono">
                {clientTasks.filter(t => t.status !== 'done').length}
              </div>
              <div className="text-[10px] text-neutral-500 uppercase">Deliverables</div>
            </div>
          </div>

          <div className="text-[11px] text-neutral-500 flex items-center justify-between pt-2 border-t border-neutral-100">
            <span>{clients.length} Registered clients</span>
            <button 
              onClick={() => onSelectView('clients')}
              className="text-zinc-700 font-medium hover:underline flex items-center gap-0.5"
            >
              Manage Clients <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        
        {/* Left 2 Columns: Deadlines Radar & Active Sprints */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          
          {/* Target Deadlines & Countdown Radar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-900" />
                <h2 className="text-sm font-bold text-neutral-900">Target Deadlines & Countdown Radar</h2>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-100 text-black border border-neutral-300 font-medium">
                {sortedDeadlines.length} active items
              </span>
            </div>

            {sortedDeadlines.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-neutral-200 rounded-xl space-y-3 p-4 bg-neutral-50/50">
                <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-900 flex items-center justify-center mx-auto">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-neutral-800 font-semibold">No deadlines on your radar</p>
                  <p className="text-[11px] text-neutral-500 max-w-sm mx-auto mt-0.5">
                    Schedule tasks with target dates (e.g. client website by Sep 15) to track countdowns, estimated effort, and completion status.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    onClick={() => onOpenTaskModal('personal')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Personal Task</span>
                  </button>
                  <button
                    onClick={() => onOpenTaskModal('business')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 border border-neutral-300 text-black hover:bg-neutral-200 text-xs font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Business Goal</span>
                  </button>
                  <button
                    onClick={() => onOpenTaskModal('client')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-300 text-zinc-900 hover:bg-zinc-200 text-xs font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Client Deliverable</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sortedDeadlines.map((item) => {
                  const deadline = getDeadlineInfo(item.dueDate, item.dueTime, item.status);

                  return (
                    <div
                      key={item.id}
                      className="p-3 sm:p-3.5 rounded-xl bg-neutral-50/80 hover:bg-neutral-100/80 border border-neutral-200 hover:border-neutral-300 transition-all group space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden">
                          {/* Checkbox to mark done */}
                          <button
                            onClick={() => onToggleTaskStatus(item.id)}
                            className="w-5 h-5 rounded-md border border-neutral-300 hover:border-stone-600 text-transparent hover:text-stone-600 flex items-center justify-center transition-all flex-shrink-0 bg-white"
                            title="Click to mark Done"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Task title (What it is) */}
                          <div className="cursor-pointer overflow-hidden" onClick={() => onEditTask(item)}>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-neutral-900 truncate group-hover:text-neutral-900 transition-colors">
                                {item.title}
                              </span>
                              {item.isEvent && (
                                <span className="px-1.5 py-0.2 rounded bg-neutral-100 text-black border border-neutral-300 text-[10px] font-mono">
                                  EVENT
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                              {item.clientName && (
                                <span className="text-zinc-800 font-semibold">
                                  Client: {item.clientName}
                                </span>
                              )}
                              {item.location && (
                                <span className="truncate max-w-[140px] text-neutral-500">
                                  • {item.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Domain Pill */}
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
                          item.workspace === 'personal'
                            ? 'bg-stone-50 text-stone-700 border border-stone-200'
                            : item.workspace === 'business'
                            ? 'bg-neutral-100 text-black border border-neutral-300'
                            : 'bg-zinc-100 text-zinc-900 border border-zinc-300'
                        }`}>
                          {item.workspace}
                        </span>
                      </div>

                      {/* Deadline Countdown & Duration Line */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-neutral-200/80 text-[11px]">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-mono text-[11px] ${deadline.pillClasses}`}>
                          <span>{deadline.badgeText}</span>
                        </div>

                        <div className="flex items-center gap-3 font-mono text-[11px] text-neutral-500">
                          {item.dueTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-neutral-400" />
                              Target: {item.dueTime}
                            </span>
                          )}
                          {item.estimatedHours && (
                            <span className="flex items-center gap-1 text-zinc-900 font-semibold">
                              <Timer className="w-3 h-3 text-zinc-700" />
                              Duration: {formatDuration(item.estimatedHours)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active In-Progress Pipeline */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-neutral-900" />
                <h2 className="text-sm font-bold text-neutral-900">Active In-Progress Sprint</h2>
              </div>
              <button 
                onClick={() => onSelectView('kanban')}
                className="text-xs text-neutral-900 hover:text-black font-semibold flex items-center gap-1"
              >
                View Full Kanban <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {inProgressTasks.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
                <p className="text-xs text-neutral-600">No tasks currently marked &quot;In Progress&quot;.</p>
                <p className="text-[11px] text-neutral-400 mt-1">Move tasks to In Progress on your Kanban board to focus your day.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inProgressTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onEditTask(task)}
                    className="p-3.5 rounded-xl bg-neutral-50/80 border border-neutral-200 hover:border-neutral-300 transition-all cursor-pointer space-y-2 group shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase font-medium ${
                        task.workspace === 'personal'
                          ? 'bg-stone-50 text-stone-700 border border-stone-200'
                          : task.workspace === 'business'
                          ? 'bg-neutral-100 text-black border border-neutral-300'
                          : 'bg-zinc-100 text-zinc-900 border border-zinc-300'
                      }`}>
                        {task.workspace}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {task.dueDate ? `Due: ${formatDate(task.dueDate)}` : 'Ongoing'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-neutral-900 group-hover:text-neutral-900 transition-colors line-clamp-2">
                      {task.title}
                    </h4>

                    {task.clientName && (
                      <p className="text-[11px] text-zinc-900 font-medium truncate">
                        Client: {task.clientName}
                      </p>
                    )}

                    {task.estimatedHours && (
                      <div className="pt-1">
                        <div className="flex justify-between text-[10px] text-neutral-500 font-mono mb-1">
                          <span>Duration / Progress</span>
                          <span>{task.loggedHours || 0} / {task.estimatedHours} hrs</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-neutral-900 rounded-full"
                            style={{ width: `${Math.min(100, (((task.loggedHours || 0) / task.estimatedHours) * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right 1 Column: Client Health & Daily Habit Consistency */}
        <div className="space-y-5 sm:space-y-6">
          
          {/* Daily Habit Consistency Widget */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-neutral-600" />
                <h3 className="text-sm font-bold text-neutral-900">Daily Discipline</h3>
              </div>
              <button
                onClick={() => onSelectView('habits')}
                className="text-xs text-neutral-700 hover:text-neutral-800 font-semibold"
              >
                Routines
              </button>
            </div>

            <p className="text-[11px] text-neutral-500">
              High-leverage habits for physical health and business momentum.
            </p>

            {habits.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-neutral-200 rounded-xl space-y-2 bg-neutral-50/50">
                <p className="text-xs text-neutral-600">No habit routines added yet.</p>
                <button
                  onClick={() => onSelectView('habits')}
                  className="inline-flex items-center gap-1 text-xs text-neutral-700 hover:underline font-semibold"
                >
                  <Plus className="w-3 h-3" /> Add your first routine
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {habits.map((habit) => {
                  const isDone = habit.completedDates.includes(todayStr);
                  return (
                    <div
                      key={habit.id}
                      onClick={() => onToggleHabit(habit.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isDone
                          ? 'bg-stone-50 border-stone-300'
                          : 'bg-neutral-50/70 border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                          isDone ? 'bg-stone-600 border-stone-600 text-white font-bold' : 'border-neutral-300 bg-white'
                        }`}>
                          {isDone && '✓'}
                        </div>
                        <span className={`text-xs truncate ${isDone ? 'text-stone-900 font-semibold' : 'text-neutral-700'}`}>
                          {habit.title}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-neutral-700 font-bold flex items-center gap-0.5 flex-shrink-0">
                        🔥 {habit.streak}d
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Client Deliverables Health */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold text-neutral-900">Client Deliverables</h3>
              </div>
              <button
                onClick={() => onSelectView('clients')}
                className="text-xs text-zinc-800 hover:text-zinc-900 font-semibold"
              >
                Hub
              </button>
            </div>

            {clients.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-neutral-200 rounded-xl space-y-2 bg-neutral-50/50">
                <p className="text-xs text-neutral-600">No registered client accounts.</p>
                <button
                  onClick={() => onSelectView('clients')}
                  className="inline-flex items-center gap-1 text-xs text-zinc-800 hover:underline font-semibold"
                >
                  <Plus className="w-3 h-3" /> Add a client
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {clients.map((client) => {
                  const clientTasksList = tasks.filter(t => t.clientId === client.id);
                  const total = clientTasksList.length;
                  const completed = clientTasksList.filter(t => t.status === 'done').length;
                  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <div key={client.id} className="p-3 rounded-xl bg-neutral-50/80 border border-neutral-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-900 truncate max-w-[150px]">
                          {client.company}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-600">
                          {client.rate}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                          <span>Milestones: {completed}/{total}</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-zinc-600 rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
