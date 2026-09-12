'use client';

import React, { useState } from 'react';
import { 
  Flame, 
  Plus, 
  Check, 
  Calendar, 
  Award, 
  TrendingUp, 
  X,
  User,
  Briefcase,
  Building2,
  Trash2,
  Sparkles
} from 'lucide-react';
import { HabitItem, TaskWorkspace } from '@/types';
import { getTodayString, getDaysOffset } from '@/lib/utils';

interface HabitsViewProps {
  habits: HabitItem[];
  onToggleDate: (habitId: string, dateString: string) => void;
  onAddHabit: (habit: Partial<HabitItem>) => void;
  onDeleteHabit: (habitId: string) => void;
}

export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  onToggleDate,
  onAddHabit,
  onDeleteHabit,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newWorkspace, setNewWorkspace] = useState<TaskWorkspace>('personal');
  const [newCategory, setNewCategory] = useState('Health');

  // Past 7 days: [ -6, -5, -4, -3, -2, -1, 0 ]
  const days = Array.from({ length: 7 }, (_, i) => {
    const offset = i - 6;
    const dateStr = getDaysOffset(offset);
    const d = new Date(dateStr + 'T00:00:00');
    return {
      dateStr,
      offset,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: offset === 0,
    };
  });

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddHabit({
      title: newTitle.trim(),
      workspace: newWorkspace,
      category: newCategory.trim() || 'General',
      frequency: 'daily',
      targetDaysPerWeek: 7,
      completedDates: [],
      streak: 0,
      createdAt: getTodayString(),
    });

    setNewTitle('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-neutral-600" />
            <h2 className="text-base font-bold text-neutral-900">Daily Discipline & Habit Matrix</h2>
          </div>
          <p className="text-xs text-neutral-500">
            Build compounding momentum across personal fitness, deep work blocks, and client communication.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-700 hover:bg-neutral-800 text-white text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Daily Routine</span>
        </button>
      </div>

      {/* Inline Habit Creation Drawer if open */}
      {isAdding && (
        <form onSubmit={handleCreateHabit} className="p-4 rounded-2xl bg-white border border-neutral-300 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-800">Create New Habit Routine</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Habit title (e.g. 90m Deep Work, Drink 3L Water)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="sm:col-span-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-600"
            />

            <select
              value={newWorkspace}
              onChange={(e) => setNewWorkspace(e.target.value as any)}
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-neutral-600 font-medium"
            >
              <option value="personal">🌌 Personal</option>
              <option value="business">💼 Business</option>
              <option value="client">🤝 Client</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-neutral-700 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-sm"
            >
              Add Routine
            </button>
          </div>
        </form>
      )}

      {/* Habits Content or Empty State */}
      {habits.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-neutral-200 rounded-2xl p-6 bg-white space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-700 border border-neutral-300 flex items-center justify-center mx-auto">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900">No Habit Routines Tracked Yet</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
              Add daily routines like workouts, morning focus blocks, or clearing your inbox to start building compounding consistency streaks.
            </p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-700 hover:bg-neutral-800 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Routine</span>
          </button>
        </div>
      ) : (
        <>
          {/* Mobile-First Touch Routine Cards (md:hidden) */}
          <div className="md:hidden space-y-3">
            {habits.map((habit) => (
              <div key={habit.id} className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg ${
                      habit.workspace === 'personal'
                        ? 'bg-stone-50 text-stone-700 border border-stone-200'
                        : habit.workspace === 'business'
                        ? 'bg-neutral-100 text-black border border-neutral-300'
                        : 'bg-zinc-100 text-zinc-800 border border-zinc-300'
                    }`}>
                      {habit.workspace === 'personal' && <User className="w-3.5 h-3.5" />}
                      {habit.workspace === 'business' && <Briefcase className="w-3.5 h-3.5" />}
                      {habit.workspace === 'client' && <Building2 className="w-3.5 h-3.5" />}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-neutral-900">{habit.title}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{habit.category}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-300 text-[10px] font-mono font-bold">
                      🔥 {habit.streak}d
                    </span>
                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className="p-1 rounded text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
                      title="Delete habit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 7-Day Mobile Touch Strip */}
                <div className="grid grid-cols-7 gap-1.5 pt-1">
                  {days.map((d) => {
                    const isCompleted = habit.completedDates.includes(d.dateStr);
                    return (
                      <button
                        key={d.dateStr}
                        onClick={() => onToggleDate(habit.id, d.dateStr)}
                        className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all text-center ${
                          d.isToday ? 'ring-2 ring-neutral-500/50' : ''
                        } ${
                          isCompleted
                            ? 'bg-stone-500 border-stone-500 text-white shadow-sm'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                        }`}
                      >
                        <span className={`text-[9px] font-mono ${isCompleted ? 'text-stone-100' : 'text-neutral-400'}`}>
                          {d.dayName}
                        </span>
                        <span className={`text-xs font-bold font-mono mt-0.5 ${isCompleted ? 'text-white' : 'text-neutral-700'}`}>
                          {d.dayNum}
                        </span>
                        <div className="mt-1 h-3 flex items-center justify-center">
                          {isCompleted ? (
                            <Check className="w-3 h-3 stroke-[3]" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop 7-Day Matrix Table (hidden md:block) */}
          <div className="hidden md:block rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 font-mono text-[10px] tracking-wider uppercase">
                    <th className="py-3 px-4 min-w-[220px]">Routine & Sphere</th>
                    <th className="py-3 px-3 w-28 text-center">Streak</th>
                    {days.map((d) => (
                      <th key={d.dateStr} className={`py-3 px-2 text-center w-14 ${d.isToday ? 'text-neutral-900 font-bold bg-neutral-100/60' : ''}`}>
                        <div>{d.dayName}</div>
                        <div className="text-[11px] text-neutral-800">{d.dayNum}</div>
                      </th>
                    ))}
                    <th className="py-3 px-3 w-16 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {habits.map((habit) => {
                    return (
                      <tr key={habit.id} className="hover:bg-neutral-50 transition-colors group">
                        {/* Habit Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`p-1.5 rounded-lg ${
                              habit.workspace === 'personal'
                                ? 'bg-stone-50 text-stone-700 border border-stone-200'
                                : habit.workspace === 'business'
                                ? 'bg-neutral-100 text-black border border-neutral-300'
                                : 'bg-zinc-100 text-zinc-800 border border-zinc-300'
                            }`}>
                              {habit.workspace === 'personal' && <User className="w-3.5 h-3.5" />}
                              {habit.workspace === 'business' && <Briefcase className="w-3.5 h-3.5" />}
                              {habit.workspace === 'client' && <Building2 className="w-3.5 h-3.5" />}
                            </span>
                            <div>
                              <div className="font-bold text-neutral-900">{habit.title}</div>
                              <div className="text-[10px] text-neutral-500 font-mono">{habit.category}</div>
                            </div>
                          </div>
                        </td>

                        {/* Streak Badge */}
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-300 text-[11px] font-mono font-bold">
                            🔥 {habit.streak}d
                          </span>
                        </td>

                        {/* 7 Day checkboxes */}
                        {days.map((d) => {
                          const isCompleted = habit.completedDates.includes(d.dateStr);
                          return (
                            <td
                              key={d.dateStr}
                              className={`py-3 px-2 text-center ${d.isToday ? 'bg-neutral-100/40' : ''}`}
                            >
                              <button
                                onClick={() => onToggleDate(habit.id, d.dateStr)}
                                className={`w-7 h-7 rounded-lg border transition-all inline-flex items-center justify-center mx-auto ${
                                  isCompleted
                                    ? 'bg-stone-500 border-stone-500 text-white shadow-sm scale-105'
                                    : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300 text-transparent hover:text-neutral-400'
                                }`}
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                              </button>
                            </td>
                          );
                        })}

                        {/* Action */}
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => onDeleteHabit(habit.id)}
                            className="p-1 rounded text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete habit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
