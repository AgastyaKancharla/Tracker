'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Tag, 
  Building2, 
  User, 
  Briefcase, 
  Edit3, 
  Trash2, 
  ArrowUpDown,
  Plus,
  Timer
} from 'lucide-react';
import { TaskItem, TaskStatus, TaskPriority, TaskWorkspace } from '@/types';
import { formatDate, getDeadlineInfo, formatDuration, calculateDaysRemaining } from '@/lib/utils';

interface ListViewProps {
  tasks: TaskItem[];
  onToggleStatus: (taskId: string) => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenTaskModal: (workspace?: TaskWorkspace) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  tasks,
  onToggleStatus,
  onUpdateStatus,
  onEditTask,
  onDeleteTask,
  onOpenTaskModal,
}) => {
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'status' | 'duration'>('deadline');

  const priorityWeight: Record<TaskPriority, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === 'deadline') {
      // Completed items go to the bottom
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (b.status === 'done' && a.status !== 'done') return -1;

      const daysA = calculateDaysRemaining(a.dueDate);
      const daysB = calculateDaysRemaining(b.dueDate);

      // Tasks without deadlines go after scheduled tasks
      if (daysA === null && daysB !== null) return 1;
      if (daysB === null && daysA !== null) return -1;
      if (daysA === null && daysB === null) return 0;

      return (daysA as number) - (daysB as number);
    }
    if (sortBy === 'priority') {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    if (sortBy === 'duration') {
      return (b.estimatedHours || 0) - (a.estimatedHours || 0);
    }
    if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      
      {/* Control / Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-neutral-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 text-xs text-neutral-600 font-medium">
          <span className="text-neutral-400 font-mono">Ledger Count:</span>
          <span className="font-semibold text-neutral-900">{tasks.length} items</span>
          <span className="text-neutral-300">•</span>
          <span className="text-stone-600 font-mono font-semibold">
            {tasks.filter(t => t.status === 'done').length} Done
          </span>
          <span className="text-neutral-300">•</span>
          <span className="text-zinc-700 font-mono font-semibold">
            {tasks.filter(t => t.status !== 'done').length} Active
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs text-neutral-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-neutral-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-neutral-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="deadline">⏱️ Deadline (Nearest First)</option>
              <option value="priority">🔴 Priority</option>
              <option value="duration">⌛ Duration / Effort</option>
              <option value="status">📋 Workflow State</option>
            </select>
          </div>

          <button
            onClick={() => onOpenTaskModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Mobile Touch-Friendly Card Feed (md:hidden) */}
      <div className="md:hidden space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="p-8 text-center bg-white border border-neutral-200 rounded-2xl text-neutral-400 text-xs">
            No tasks or events found. Tap &quot;Add Item&quot; to schedule your first deliverable.
          </div>
        ) : (
          sortedTasks.map((task) => {
            const deadline = getDeadlineInfo(task.dueDate, task.dueTime, task.status);
            const isCompleted = task.status === 'done';

            return (
              <div
                key={task.id}
                className={`p-3.5 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-2.5 transition-all ${
                  isCompleted ? 'opacity-60 bg-neutral-50/70' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <button
                      onClick={() => onToggleStatus(task.id)}
                      className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
                        isCompleted
                          ? 'bg-stone-500 border-stone-500 text-white shadow-sm'
                          : 'border-neutral-300 hover:border-stone-500 text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onEditTask(task)}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-sm font-semibold leading-snug ${
                          isCompleted ? 'line-through text-neutral-400' : 'text-neutral-900'
                        }`}>
                          {task.title}
                        </span>
                        {task.isEvent && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-black border border-neutral-300 font-semibold">
                            MEETING
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {task.clientName && (
                        <span className="inline-block text-[10px] text-zinc-800 font-semibold bg-zinc-100 border border-zinc-300 px-1.5 py-0.5 rounded mt-1">
                          Client: {task.clientName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onEditTask(task)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Deadline & Meta badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold ${deadline.pillClasses}`}>
                    <span>{deadline.badgeText}</span>
                  </div>

                  {task.estimatedHours && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-300 text-[10px] font-mono font-medium">
                      <Timer className="w-3 h-3" />
                      {formatDuration(task.estimatedHours)}
                    </span>
                  )}

                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] uppercase font-semibold ${
                    task.workspace === 'personal'
                      ? 'bg-stone-50 text-stone-700 border border-stone-200'
                      : task.workspace === 'business'
                      ? 'bg-neutral-100 text-black border border-neutral-300'
                      : 'bg-zinc-100 text-zinc-800 border border-zinc-300'
                  }`}>
                    {task.workspace}
                  </span>

                  <span className={`inline-block px-2 py-0.5 rounded-md font-mono text-[10px] uppercase font-semibold ${
                    task.priority === 'urgent'
                      ? 'bg-neutral-100 text-black border border-neutral-300'
                      : task.priority === 'high'
                      ? 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                      : task.priority === 'medium'
                      ? 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                      : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                  }`}>
                    {task.priority}
                  </span>
                </div>

                {/* Mobile Workflow State Switcher */}
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400 font-mono">Status:</span>
                  <select
                    value={task.status}
                    onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-xs text-neutral-700 font-medium focus:outline-none focus:border-neutral-600"
                  >
                    <option value="in_progress">⚡ In Progress</option>
                    <option value="todo">📋 To Do</option>
                    <option value="backlog">📥 Backlog</option>
                    <option value="review">👀 Review</option>
                    <option value="done">✅ Done</option>
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Ledger Table Container (hidden md:block) */}
      <div className="hidden md:block rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/80 text-neutral-500 font-mono uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">Done</th>
                <th className="py-3 px-4 min-w-[240px]">What is it? (Item & Scope)</th>
                <th className="py-3 px-4 min-w-[190px]">Target Deadline & Countdown</th>
                <th className="py-3 px-4 w-28">Duration</th>
                <th className="py-3 px-4 w-24">Domain</th>
                <th className="py-3 px-4 w-24">Priority</th>
                <th className="py-3 px-4 w-32">Workflow State</th>
                <th className="py-3 px-4 w-20 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {sortedTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-neutral-400">
                    No tasks or events found. Click &quot;Add Item&quot; to schedule your first deliverable.
                  </td>
                </tr>
              ) : (
                sortedTasks.map((task) => {
                  const deadline = getDeadlineInfo(task.dueDate, task.dueTime, task.status);
                  const isCompleted = task.status === 'done';

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-neutral-50/80 transition-colors group ${
                        isCompleted ? 'opacity-60 bg-neutral-50/40' : ''
                      }`}
                    >
                      {/* Checkbox toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onToggleStatus(task.id)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all mx-auto ${
                            isCompleted
                              ? 'bg-stone-500 border-stone-500 text-white'
                              : 'border-neutral-300 hover:border-stone-500 text-transparent hover:text-stone-600'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      {/* Title & Description & Client */}
                      <td className="py-3 px-4 cursor-pointer" onClick={() => onEditTask(task)}>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${
                            isCompleted ? 'line-through text-neutral-400' : 'text-neutral-900'
                          }`}>
                            {task.title}
                          </span>
                          {task.isEvent && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-black border border-neutral-300 font-semibold">
                              MEETING
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          {task.description && (
                            <span className="text-[11px] text-neutral-500 truncate max-w-xs">
                              {task.description}
                            </span>
                          )}
                          {task.clientName && (
                            <span className="text-[10px] text-zinc-800 font-semibold bg-zinc-100 border border-zinc-300 px-1.5 py-0.2 rounded">
                              Client: {task.clientName}
                            </span>
                          )}
                        </div>

                        {task.tags && task.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {task.tags.map((t) => (
                              <span key={t} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Target Deadline & Countdown */}
                      <td className="py-3 px-4">
                        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold ${deadline.pillClasses}`}>
                          <span>{deadline.badgeText}</span>
                        </div>
                        {task.dueDate && task.dueTime && (
                          <div className="text-[10px] text-neutral-500 font-mono mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Target time: {task.dueTime}
                          </div>
                        )}
                      </td>

                      {/* Duration / Effort */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {task.estimatedHours ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-300 font-medium">
                            <Timer className="w-3 h-3" />
                            {formatDuration(task.estimatedHours)}
                          </span>
                        ) : (
                          <span className="text-neutral-300">--</span>
                        )}
                      </td>

                      {/* Domain / Workspace */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] uppercase font-semibold ${
                          task.workspace === 'personal'
                            ? 'bg-stone-50 text-stone-700 border border-stone-200'
                            : task.workspace === 'business'
                            ? 'bg-neutral-100 text-black border border-neutral-300'
                            : 'bg-zinc-100 text-zinc-800 border border-zinc-300'
                        }`}>
                          {task.workspace === 'personal' && <User className="w-3 h-3" />}
                          {task.workspace === 'business' && <Briefcase className="w-3 h-3" />}
                          {task.workspace === 'client' && <Building2 className="w-3 h-3" />}
                          {task.workspace}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] uppercase font-semibold ${
                          task.priority === 'urgent'
                            ? 'bg-neutral-100 text-black border border-neutral-300'
                            : task.priority === 'high'
                            ? 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                            : task.priority === 'medium'
                            ? 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                            : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                        }`}>
                          {task.priority}
                        </span>
                      </td>

                      {/* Workflow State Dropdown */}
                      <td className="py-3 px-4">
                        <select
                          value={task.status}
                          onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
                          className="bg-neutral-50 border border-neutral-200 rounded-md px-2 py-1 text-[11px] text-neutral-700 font-medium focus:outline-none focus:border-neutral-600 cursor-pointer"
                        >
                          <option value="in_progress">⚡ In Progress</option>
                          <option value="todo">📋 To Do</option>
                          <option value="backlog">📥 Backlog</option>
                          <option value="review">👀 Review</option>
                          <option value="done">✅ Done</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditTask(task)}
                            className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1 rounded text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
