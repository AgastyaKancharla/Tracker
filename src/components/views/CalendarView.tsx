'use client';

import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Calendar as CalendarIcon, 
  Plus, 
  MapPin, 
  CheckCircle2, 
  Building2, 
  User, 
  Briefcase,
  Timer,
  Zap,
  Sparkles,
  ArrowRight,
  PieChart
} from 'lucide-react';
import { TaskItem, TaskWorkspace } from '@/types';
import { formatDate, isToday, getTodayString, getDeadlineInfo, formatDuration } from '@/lib/utils';

interface CalendarViewProps {
  tasks: TaskItem[];
  onToggleStatus: (taskId: string) => void;
  onEditTask: (task: TaskItem) => void;
  onOpenTaskModal: (
    workspace?: TaskWorkspace, 
    initialStatus?: any, 
    initialDate?: string, 
    clientId?: string,
    initialTime?: string
  ) => void;
}

interface DayScheduleBlock {
  type: 'occupied' | 'free';
  startMinutes: number;
  endMinutes: number;
  startTimeStr: string;
  endTimeStr: string;
  durationMinutes: number;
  task?: TaskItem;
}

function minutesToTimeStr(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const hPad = h < 10 ? `0${h}` : `${h}`;
  const mPad = m < 10 ? `0${m}` : `${m}`;
  return `${hPad}:${mPad}`;
}

function formatMinutes(mins: number): string {
  if (mins <= 0) return '0m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h} hrs`;
}

function computeDayTimeline(tasksForDay: TaskItem[]): {
  blocks: DayScheduleBlock[];
  totalOccupiedMinutes: number;
  totalFreeMinutes: number;
  percentOccupied: number;
  untimedTasks: TaskItem[];
} {
  const DAY_START = 8 * 60;  // 08:00 AM
  const DAY_END = 22 * 60;   // 10:00 PM (14 hours / 840 mins)

  const timedTasks: { task: TaskItem; start: number; end: number }[] = [];
  const untimedTasks: TaskItem[] = [];

  tasksForDay.forEach((task) => {
    if (task.dueTime) {
      const parts = task.dueTime.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1] || '0', 10);
      if (!isNaN(h)) {
        const start = h * 60 + m;
        const duration = task.eventDurationMinutes || (task.estimatedHours ? Math.round(task.estimatedHours * 60) : 60);
        const end = start + duration;
        timedTasks.push({ task, start, end });
      } else {
        untimedTasks.push(task);
      }
    } else {
      untimedTasks.push(task);
    }
  });

  // Sort timed items chronologically
  timedTasks.sort((a, b) => a.start - b.start);

  const blocks: DayScheduleBlock[] = [];
  let current = DAY_START;
  let occupiedMins = 0;

  timedTasks.forEach(({ task, start, end }) => {
    const effectiveStart = Math.max(DAY_START, start);
    const effectiveEnd = Math.min(DAY_END, end);

    if (effectiveStart > current) {
      const freeDur = effectiveStart - current;
      blocks.push({
        type: 'free',
        startMinutes: current,
        endMinutes: effectiveStart,
        startTimeStr: minutesToTimeStr(current),
        endTimeStr: minutesToTimeStr(effectiveStart),
        durationMinutes: freeDur,
      });
    }

    if (effectiveEnd > effectiveStart) {
      const occDur = effectiveEnd - effectiveStart;
      occupiedMins += occDur;
      blocks.push({
        type: 'occupied',
        startMinutes: effectiveStart,
        endMinutes: effectiveEnd,
        startTimeStr: minutesToTimeStr(effectiveStart),
        endTimeStr: minutesToTimeStr(effectiveEnd),
        durationMinutes: occDur,
        task,
      });
      current = Math.max(current, effectiveEnd);
    }
  });

  if (current < DAY_END) {
    blocks.push({
      type: 'free',
      startMinutes: current,
      endMinutes: DAY_END,
      startTimeStr: minutesToTimeStr(current),
      endTimeStr: minutesToTimeStr(DAY_END),
      durationMinutes: DAY_END - current,
    });
  }

  const untimedMins = untimedTasks.reduce(
    (acc, t) => acc + (t.estimatedHours ? Math.round(t.estimatedHours * 60) : 30),
    0
  );

  const totalOccupied = Math.min(840, occupiedMins + untimedMins);
  const totalFree = Math.max(0, 840 - totalOccupied);
  const percentOccupied = Math.round((totalOccupied / 840) * 100);

  return {
    blocks,
    totalOccupiedMinutes: totalOccupied,
    totalFreeMinutes: totalFree,
    percentOccupied,
    untimedTasks,
  };
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onToggleStatus,
  onEditTask,
  onOpenTaskModal,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [mobileTab, setMobileTab] = useState<'calendar' | 'schedule'>('calendar');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(getTodayString());
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Map tasks to dates
  const tasksByDate = tasks.reduce<Record<string, TaskItem[]>>((acc, task) => {
    if (task.dueDate) {
      if (!acc[task.dueDate]) acc[task.dueDate] = [];
      acc[task.dueDate].push(task);
    }
    return acc;
  }, {});

  const selectedDayTasks = tasksByDate[selectedDate] || [];

  // Compute Occupied vs Free time timeline for selectedDate
  const {
    blocks,
    totalOccupiedMinutes,
    totalFreeMinutes,
    percentOccupied,
    untimedTasks
  } = computeDayTimeline(selectedDayTasks);

  // Calendar cells
  const calendarCells: { dateString: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const d = new Date(year, month - 1, day);
    calendarCells.push({
      dateString: d.toISOString().split('T')[0],
      dayNum: day,
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    calendarCells.push({
      dateString: dateObj.toISOString().split('T')[0],
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  const remaining = (7 - (calendarCells.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const dateObj = new Date(year, month + 1, d);
    calendarCells.push({
      dateString: dateObj.toISOString().split('T')[0],
      dayNum: d,
      isCurrentMonth: false,
    });
  }

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      
      {/* Mobile Tab Switcher (Visible on small screens only) */}
      <div className="flex lg:hidden items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
        <button
          onClick={() => setMobileTab('calendar')}
          className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'calendar'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Month Calendar</span>
        </button>
        <button
          onClick={() => setMobileTab('schedule')}
          className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'schedule'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Day Free-Time Map</span>
          {selectedDayTasks.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-mono font-bold">
              {selectedDayTasks.length}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Calendar Grid: 7 Columns */}
        <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'calendar' ? 'block' : 'hidden lg:block'}`}>
          
          {/* Month Navigation Header */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">{monthName}</h2>
              <button
                onClick={goToToday}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-mono font-medium transition-colors"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid Container */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 overflow-hidden shadow-xs">
            {/* Day Names Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-[11px] font-mono uppercase tracking-wider text-slate-400 py-1 font-semibold">
                  {day}
                </div>
              ))}
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarCells.map((cell) => {
                const cellTasks = tasksByDate[cell.dateString] || [];
                const isSelected = selectedDate === cell.dateString;
                const isTodayCell = isToday(cell.dateString);

                return (
                  <div
                    key={cell.dateString}
                    onClick={() => {
                      setSelectedDate(cell.dateString);
                    }}
                    className={`min-h-[85px] sm:min-h-[95px] p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-500 shadow-xs ring-2 ring-indigo-500/20'
                        : isTodayCell
                        ? 'bg-indigo-50/20 border-indigo-400'
                        : cell.isCurrentMonth
                        ? 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                        : 'bg-slate-50/50 border-slate-100 opacity-40 hover:opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-mono font-medium ${
                        isTodayCell 
                          ? 'w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-2xs' 
                          : isSelected 
                          ? 'text-indigo-700 font-bold' 
                          : 'text-slate-700'
                      }`}>
                        {cell.dayNum}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTaskModal(undefined, undefined, cell.dateString);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all hidden sm:block"
                        title="Add item on this day"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Tasks Preview Badges */}
                    <div className="space-y-1 my-1 overflow-hidden">
                      {cellTasks.slice(0, 2).map((t) => (
                        <div
                          key={t.id}
                          className={`text-[9px] px-1.5 py-0.5 rounded truncate font-medium ${
                            t.workspace === 'personal'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : t.workspace === 'business'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {t.isEvent ? `⏱ ${t.dueTime || 'Event'}` : t.title}
                        </div>
                      ))}
                      {cellTasks.length > 2 && (
                        <div className="text-[9px] text-slate-500 font-mono px-0.5 font-medium">
                          +{cellTasks.length - 2} more
                        </div>
                      )}
                    </div>

                    <div className="h-0.5" />
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Side Day Schedule & Free Time Analyzer: 5 Columns */}
        <div className={`lg:col-span-5 space-y-4 ${mobileTab === 'schedule' ? 'block' : 'hidden lg:block'}`}>
          
          {/* Agenda Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Schedule for {formatDate(selectedDate)}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {selectedDayTasks.length} item{selectedDayTasks.length === 1 ? '' : 's'} assigned to this day
                </p>
              </div>

              <button
                onClick={() => onOpenTaskModal(undefined, undefined, selectedDate)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {/* Day Capacity & Free Time Utilization Meter */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Day Time-Budget (08:00 - 22:00)
                </span>
                <span className="text-slate-500">14 hrs Window</span>
              </div>

              {/* Visual Segmented Utilization Bar */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 transition-all duration-300"
                  style={{ width: `${percentOccupied}%` }}
                />
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${100 - percentOccupied}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-1 font-mono text-[11px]">
                <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <div className="text-slate-900 font-bold">{formatMinutes(totalOccupiedMinutes)}</div>
                  <div className="text-[10px] text-indigo-700 font-medium uppercase">Occupied Time ({percentOccupied}%)</div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <div className="text-emerald-700 font-bold">{formatMinutes(totalFreeMinutes)}</div>
                  <div className="text-[10px] text-emerald-700 font-medium uppercase">Available Free Time</div>
                </div>
              </div>
            </div>

            {/* Time Slots Explorer (Occupied vs Free Windows) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-500 font-medium">
                <span>Time Slot Map & Available Windows</span>
              </div>

              {selectedDayTasks.length === 0 ? (
                <div className="py-8 px-4 text-center border border-dashed border-emerald-300 bg-emerald-50/30 rounded-xl space-y-2">
                  <Sparkles className="w-6 h-6 text-emerald-600 mx-auto" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Entire Day is 100% Free!</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      You have 14 full hours open (08:00 - 22:00) with zero scheduled commitments.
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenTaskModal(undefined, undefined, selectedDate, undefined, '09:00')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Plan First Task at 09:00</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {blocks.map((block, idx) => {
                    if (block.type === 'occupied' && block.task) {
                      const t = block.task;

                      return (
                        <div
                          key={`occ-${t.id}-${idx}`}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-bold flex-shrink-0">
                                {block.startTimeStr} - {block.endTimeStr}
                              </span>
                              <span
                                onClick={() => onEditTask(t)}
                                className="text-xs font-bold text-slate-900 truncate cursor-pointer hover:text-indigo-600 transition-colors"
                              >
                                {t.title}
                              </span>
                            </div>

                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase flex-shrink-0 font-medium ${
                              t.workspace === 'personal'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : t.workspace === 'business'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {t.workspace}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                            <div className="flex items-center gap-2">
                              <span className="text-amber-800 font-semibold flex items-center gap-1">
                                <Timer className="w-3 h-3 text-amber-600" />
                                {formatMinutes(block.durationMinutes)} occupied
                              </span>
                              {t.clientName && (
                                <span className="text-amber-700">Client: {t.clientName}</span>
                              )}
                            </div>

                            <button
                              onClick={() => onToggleStatus(t.id)}
                              className={`px-2 py-0.5 rounded border transition-colors ${
                                t.status === 'done'
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                                  : 'bg-white border-slate-200 hover:border-emerald-500 text-slate-600'
                              }`}
                            >
                              {t.status === 'done' ? '✓ Finished' : 'Mark Done'}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // Free time block
                    return (
                      <div
                        key={`free-${block.startTimeStr}-${idx}`}
                        className="p-2.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-emerald-800 font-bold">
                            {block.startTimeStr} - {block.endTimeStr}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            ({formatMinutes(block.durationMinutes)} Free Window)
                          </span>
                        </div>

                        <button
                          onClick={() =>
                            onOpenTaskModal(
                              undefined,
                              undefined,
                              selectedDate,
                              undefined,
                              block.startTimeStr
                            )
                          }
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-all shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Book Slot</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Any Untimed Tasks for this day */}
              {untimedTasks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                  <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1 font-semibold">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Due Today (Flexible Time / No Start Time Set)</span>
                  </div>
                  <div className="space-y-1.5">
                    {untimedTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => onEditTask(t)}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between text-xs cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-2 h-2 rounded-full ${
                            t.workspace === 'personal' ? 'bg-emerald-500' : t.workspace === 'business' ? 'bg-indigo-500' : 'bg-amber-500'
                          }`} />
                          <span className="text-slate-900 truncate font-semibold">{t.title}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[10px] text-amber-800">
                          {t.estimatedHours && <span>⏱️ {formatDuration(t.estimatedHours)}</span>}
                          <span className="text-slate-400">Edit Time →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Add Button at the bottom */}
              <div className="pt-2">
                <button
                  onClick={() => onOpenTaskModal(undefined, undefined, selectedDate)}
                  className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Add Task or Event for {formatDate(selectedDate)}</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
