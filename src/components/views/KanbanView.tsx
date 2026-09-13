'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Clock, 
  Calendar, 
  Tag, 
  Building2, 
  User, 
  Briefcase, 
  ArrowLeft, 
  ArrowRight, 
  Trash2, 
  Edit3,
  CheckCircle2,
  Timer
} from 'lucide-react';
import { TaskItem, TaskStatus, TaskPriority, TaskWorkspace } from '@/types';
import { formatDate, getDeadlineInfo, formatDuration } from '@/lib/utils';

interface KanbanViewProps {
  tasks: TaskItem[];
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenTaskModal: (workspace?: TaskWorkspace, initialStatus?: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; label: string; icon: string; borderAccent: string }[] = [
  { id: 'backlog', label: 'Backlog', icon: '📥', borderAccent: 'border-neutral-500/20' },
  { id: 'todo', label: 'To Do', icon: '📋', borderAccent: 'border-neutral-500/30' },
  { id: 'in_progress', label: 'In Progress', icon: '⚡', borderAccent: 'border-neutral-600/30' },
  { id: 'review', label: 'Review', icon: '👀', borderAccent: 'border-zinc-600/30' },
  { id: 'done', label: 'Completed', icon: '✅', borderAccent: 'border-stone-500/30' },
];

export const KanbanView: React.FC<KanbanViewProps> = ({
  tasks,
  onUpdateStatus,
  onEditTask,
  onDeleteTask,
  onOpenTaskModal,
}) => {
  const [mobileActiveColumn, setMobileActiveColumn] = useState<TaskStatus>('todo');

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((t) => t.status === status);
  };

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    const order: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];
    const idx = order.indexOf(current);
    return idx < order.length - 1 ? order[idx + 1] : null;
  };

  const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
    const order: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];
    const idx = order.indexOf(current);
    return idx > 0 ? order[idx - 1] : null;
  };

  const renderColumnContent = (column: typeof COLUMNS[0], isMobile: boolean = false) => {
    const columnTasks = getTasksByStatus(column.id);

    return (
      <div
        key={column.id}
        className={`${isMobile ? 'w-full' : 'w-80 flex-shrink-0'} flex flex-col rounded-2xl bg-neutral-100/70 border border-neutral-200/90 shadow-2xs overflow-hidden`}
      >
        {/* Column Header */}
        <div className={`px-4 py-3 border-b border-neutral-200 flex items-center justify-between bg-white ${column.borderAccent}`}>
          <div className="flex items-center gap-2">
            <span className="text-sm">{column.icon}</span>
            <h3 className="text-xs font-bold text-neutral-900 tracking-wide uppercase font-mono">
              {column.label}
            </h3>
            <span className="px-1.5 py-0.2 rounded-full bg-neutral-100 text-neutral-700 text-[10px] font-mono font-semibold border border-neutral-200">
              {columnTasks.length}
            </span>
          </div>

          <button
            onClick={() => onOpenTaskModal(undefined, column.id)}
            className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            title={`Add task to ${column.label}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Column Tasks List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[220px]">
          {columnTasks.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center border border-dashed border-neutral-300 rounded-xl text-center p-3 bg-white/50">
              <p className="text-xs text-neutral-500 font-medium">No tasks in {column.label}</p>
              <button
                onClick={() => onOpenTaskModal(undefined, column.id)}
                className="mt-2 text-[11px] text-neutral-900 hover:underline flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3 h-3" /> Add item
              </button>
            </div>
          ) : (
            columnTasks.map((task) => {
              const deadline = getDeadlineInfo(task.dueDate, task.dueTime, task.status);
              const prev = getPrevStatus(task.status);
              const next = getNextStatus(task.status);

              return (
                <div
                  key={task.id}
                  className="p-3.5 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 group space-y-2.5 relative animate-in fade-in duration-300"
                >
                  {/* Top Bar: Workspace pill + Priority */}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={`px-2 py-0.5 rounded font-mono font-semibold uppercase tracking-wider flex items-center gap-1 ${
                      task.workspace === 'personal'
                        ? 'bg-stone-50 text-stone-700 border border-stone-200'
                        : task.workspace === 'business'
                        ? 'bg-neutral-100 text-black border border-neutral-300'
                        : 'bg-zinc-100 text-zinc-900 border border-zinc-300'
                    }`}>
                      {task.workspace === 'personal' && <User className="w-2.5 h-2.5" />}
                      {task.workspace === 'business' && <Briefcase className="w-2.5 h-2.5" />}
                      {task.workspace === 'client' && <Building2 className="w-2.5 h-2.5" />}
                      {task.workspace}
                    </span>

                    <span className={`px-1.5 py-0.2 rounded font-mono font-semibold uppercase border transition-colors duration-200 ${
                      task.priority === 'urgent'
                        ? 'text-white bg-red-600 border-red-600'
                        : task.priority === 'high'
                        ? 'text-orange-700 bg-orange-100 border-orange-300'
                        : task.priority === 'medium'
                        ? 'text-blue-700 bg-blue-50 border-blue-200'
                        : 'text-neutral-600 bg-neutral-100 border-neutral-200'
                    }`}>
                      {task.priority}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="cursor-pointer" onClick={() => onEditTask(task)}>
                    <h4 className="text-xs font-bold text-neutral-900 leading-snug group-hover:text-neutral-900 transition-colors">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-[11px] text-neutral-600 line-clamp-2 mt-1 leading-normal">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Client info if applicable */}
                  {task.clientName && (
                    <div className="text-[11px] text-zinc-900 font-semibold flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-zinc-700" />
                      <span className="truncate">{task.clientName}</span>
                    </div>
                  )}

                  {/* Prominent Target Deadline & Duration Pill */}
                  <div className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono flex items-center justify-between border ${deadline.pillClasses}`}>
                    <span className="font-semibold truncate">{deadline.badgeText}</span>
                    {task.estimatedHours ? (
                      <span className="text-[10px] font-semibold ml-1 flex-shrink-0 flex items-center gap-0.5">
                        <Timer className="w-3 h-3" />
                        {formatDuration(task.estimatedHours)}
                      </span>
                    ) : null}
                  </div>

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((tag) => (
                        <span key={tag} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bottom Quick-Move Arrows & Edit Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                    <div className="flex items-center gap-1">
                      {prev && (
                        <button
                          onClick={() => onUpdateStatus(task.id, prev)}
                          className="p-1 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                          title={`Move back to ${prev}`}
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {next && (
                        <button
                          onClick={() => onUpdateStatus(task.id, next)}
                          className="p-1 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                          title={`Move forward to ${next}`}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditTask(task)}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
                        title="Edit task"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1 rounded text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Mobile Column Tab Switcher */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {COLUMNS.map((col) => {
          const count = getTasksByStatus(col.id).length;
          const isSelected = mobileActiveColumn === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setMobileActiveColumn(col.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <span>{col.icon}</span>
              <span>{col.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile View: Full-width Selected Column */}
      <div className="block md:hidden">
        {renderColumnContent(COLUMNS.find((c) => c.id === mobileActiveColumn) || COLUMNS[0], true)}
      </div>

      {/* Desktop View: Multi-Column Horizontal Scroll Board */}
      <div className="hidden md:flex gap-4 overflow-x-auto pb-6 h-[calc(100vh-140px)] min-w-full">
        {COLUMNS.map((column) => renderColumnContent(column, false))}
      </div>
    </div>
  );
};
