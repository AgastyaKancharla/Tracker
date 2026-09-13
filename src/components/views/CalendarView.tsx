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
  PieChart,
  X
} from 'lucide-react';
import { TaskItem, TaskWorkspace } from '@/types';
import { formatDate, isToday, getTodayString, getDeadlineInfo, formatDuration, toLocalDateString } from '@/lib/utils';

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

// Cover the full 24h day so events outside the typical 8am-10pm work window
// (e.g. a late-night 23:00 task) still show up in the occupied/free analysis,
// instead of only in the deadline list above.
const DAY_START = 0;
const DAY_END = 24 * 60;
const TOTAL_DAY_MINUTES = DAY_END - DAY_START;

function computeDayTimeline(tasksForDay: TaskItem[]): {
  blocks: DayScheduleBlock[];
  totalOccupiedMinutes: number;
  totalFreeMinutes: number;
  percentOccupied: number;
  untimedTasks: TaskItem[];
} {
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

  const totalOccupied = Math.min(TOTAL_DAY_MINUTES, occupiedMins + untimedMins);
  const totalFree = Math.max(0, TOTAL_DAY_MINUTES - totalOccupied);
  const percentOccupied = Math.round((totalOccupied / TOTAL_DAY_MINUTES) * 100);

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
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [expandedPopupTaskIds, setExpandedPopupTaskIds] = useState<Set<string>>(new Set());

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
      dateString: toLocalDateString(d),
      dayNum: day,
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    calendarCells.push({
      dateString: toLocalDateString(dateObj),
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  const remaining = (7 - (calendarCells.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const dateObj = new Date(year, month + 1, d);
    calendarCells.push({
      dateString: toLocalDateString(dateObj),
      dayNum: d,
      isCurrentMonth: false,
    });
  }

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const togglePopupTaskExpanded = (taskId: string) => {
    setExpandedPopupTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Day-click popup: just the day's tasks and their info (time, title,
  // click-to-expand notes) - no free-time analysis, that lives in the
  // Day Free-Time Map panel instead.
  const renderDayTaskListPopup = () => {
    const timed = [...selectedDayTasks]
      .filter((t) => t.dueTime)
      .sort((a, b) => (a.dueTime! < b.dueTime! ? -1 : a.dueTime! > b.dueTime! ? 1 : 0));
    const untimed = selectedDayTasks.filter((t) => !t.dueTime);
    const ordered = [...timed, ...untimed];

    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-neutral-900" />
              <h3 className="text-sm font-bold text-neutral-900">{formatDate(selectedDate)}</h3>
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {selectedDayTasks.length} item{selectedDayTasks.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            onClick={() => onOpenTaskModal(undefined, undefined, selectedDate)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {ordered.length === 0 ? (
          <div className="py-8 px-4 text-center border border-dashed border-neutral-300 bg-neutral-50/50 rounded-xl">
            <p className="text-xs text-neutral-500">Nothing scheduled on this day.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {ordered.map((t) => {
              const isExpanded = expandedPopupTaskIds.has(t.id);
              return (
                <div
                  key={t.id}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => togglePopupTaskExpanded(t.id)}
                    className="w-full flex items-center justify-between gap-2 p-3 text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-neutral-100 text-black border border-neutral-300 font-bold flex-shrink-0">
                        {t.dueTime || 'Anytime'}
                      </span>
                      <span
                        className={`text-xs font-bold truncate ${
                          t.status === 'done' ? 'text-neutral-400 line-through' : 'text-neutral-900'
                        }`}
                      >
                        {t.title}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase flex-shrink-0 font-medium ${
                        t.workspace === 'personal'
                          ? 'bg-stone-50 text-stone-700 border border-stone-200'
                          : t.workspace === 'business'
                          ? 'bg-neutral-100 text-black border border-neutral-300'
                          : 'bg-zinc-100 text-zinc-900 border border-zinc-300'
                      }`}
                    >
                      {t.workspace}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2 border-t border-neutral-200 pt-2">
                      {t.description ? (
                        <p className="text-xs text-neutral-600 whitespace-pre-wrap">{t.description}</p>
                      ) : (
                        <p className="text-xs text-neutral-400 italic">No notes added.</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-neutral-500">
                        <span className="px-1.5 py-0.5 rounded bg-white border border-neutral-200 capitalize">
                          {t.priority} priority
                        </span>
                        {t.clientName && (
                          <span className="px-1.5 py-0.5 rounded bg-white border border-neutral-200">
                            Client: {t.clientName}
                          </span>
                        )}
                        {t.estimatedHours ? (
                          <span className="px-1.5 py-0.5 rounded bg-white border border-neutral-200">
                            Est. {formatDuration(t.estimatedHours)}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => onToggleStatus(t.id)}
                          className="px-2.5 py-1 rounded-md border border-neutral-300 bg-white text-[11px] text-neutral-700 hover:border-neutral-500 transition-colors font-semibold"
                        >
                          {t.status === 'done' ? '✓ Done' : 'Mark Done'}
                        </button>
                        <button
                          onClick={() => onEditTask(t)}
                          className="px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-black text-white text-[11px] font-semibold transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderAgendaCard = () => (
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200 space-y-4 shadow-xs">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-neutral-900" />
                  <h3 className="text-sm font-bold text-neutral-900">
                    Schedule for {formatDate(selectedDate)}
                  </h3>
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {selectedDayTasks.length} item{selectedDayTasks.length === 1 ? '' : 's'} assigned to this day
                </p>
              </div>

              <button
                onClick={() => onOpenTaskModal(undefined, undefined, selectedDate)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {/* Day Capacity & Free Time Utilization Meter */}
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-700 font-semibold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-zinc-600" />
                  Day Time-Budget (00:00 - 24:00)
                </span>
                <span className="text-neutral-500">24 hr Window</span>
              </div>

              {/* Visual Segmented Utilization Bar - one segment per actual free/booked window */}
              <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden flex gap-px">
                {blocks.map((block, idx) => (
                  <div
                    key={`bar-seg-${idx}`}
                    title={`${block.type === 'occupied' ? 'Booked' : 'Free'} ${block.startTimeStr}-${block.endTimeStr} (${formatMinutes(block.durationMinutes)})`}
                    className={`h-full transition-all duration-300 ${
                      block.type === 'occupied' ? 'bg-neutral-900' : 'bg-stone-400'
                    }`}
                    style={{ width: `${(block.durationMinutes / TOTAL_DAY_MINUTES) * 100}%` }}
                  />
                ))}
              </div>

              {/* Free/booked windows as text, e.g. "06:00-09:00 free, 11:00-12:00 booked, ..." */}
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                {blocks.map((block, idx) => (
                  <span
                    key={`bar-label-${idx}`}
                    className={`px-1.5 py-0.5 rounded border ${
                      block.type === 'occupied'
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-stone-50 text-stone-700 border-stone-300'
                    }`}
                  >
                    {block.startTimeStr}-{block.endTimeStr} {block.type === 'occupied' ? '(booked)' : '(free)'}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-1 font-mono text-[11px]">
                <div className="p-2 rounded-lg bg-white border border-neutral-200 shadow-2xs">
                  <div className="text-neutral-900 font-bold">{formatMinutes(totalOccupiedMinutes)}</div>
                  <div className="text-[10px] text-black font-medium uppercase">Occupied Time ({percentOccupied}%)</div>
                </div>
                <div className="p-2 rounded-lg bg-white border border-neutral-200 shadow-2xs">
                  <div className="text-stone-700 font-bold">{formatMinutes(totalFreeMinutes)}</div>
                  <div className="text-[10px] text-stone-700 font-medium uppercase">Available Free Time</div>
                </div>
              </div>
            </div>

            {/* Time Slots Explorer (Occupied vs Free Windows) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-neutral-500 font-medium">
                <span>Time Slot Map & Available Windows</span>
              </div>

              {selectedDayTasks.length === 0 ? (
                <div className="py-8 px-4 text-center border border-dashed border-stone-300 bg-stone-50/30 rounded-xl space-y-2">
                  <Sparkles className="w-6 h-6 text-stone-600 mx-auto" />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">Entire Day is 100% Free!</h4>
                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      You have 14 full hours open (08:00 - 22:00) with zero scheduled commitments.
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenTaskModal(undefined, undefined, selectedDate, undefined, '09:00')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-600 hover:bg-stone-700 text-white text-xs font-semibold shadow-xs transition-colors mt-1"
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
                          className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 hover:border-neutral-300 transition-all space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-neutral-100 text-black border border-neutral-300 font-bold flex-shrink-0">
                                {block.startTimeStr} - {block.endTimeStr}
                              </span>
                              <span
                                onClick={() => onEditTask(t)}
                                className="text-xs font-bold text-neutral-900 truncate cursor-pointer hover:text-neutral-900 transition-colors"
                              >
                                {t.title}
                              </span>
                            </div>

                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase flex-shrink-0 font-medium ${
                              t.workspace === 'personal'
                                ? 'bg-stone-50 text-stone-700 border border-stone-200'
                                : t.workspace === 'business'
                                ? 'bg-neutral-100 text-black border border-neutral-300'
                                : 'bg-zinc-100 text-zinc-900 border border-zinc-300'
                            }`}>
                              {t.workspace}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-neutral-500">
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-900 font-semibold flex items-center gap-1">
                                <Timer className="w-3 h-3 text-zinc-700" />
                                {formatMinutes(block.durationMinutes)} occupied
                              </span>
                              {t.clientName && (
                                <span className="text-zinc-800">Client: {t.clientName}</span>
                              )}
                            </div>

                            <button
                              onClick={() => onToggleStatus(t.id)}
                              className={`px-2 py-0.5 rounded border transition-colors ${
                                t.status === 'done'
                                  ? 'bg-stone-50 border-stone-300 text-stone-700 font-bold'
                                  : 'bg-white border-neutral-200 hover:border-stone-500 text-neutral-600'
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
                        className="p-2.5 rounded-xl border border-dashed border-stone-300 bg-stone-50/40 hover:bg-stone-50/70 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="w-2 h-2 rounded-full bg-stone-500 animate-pulse" />
                          <span className="text-stone-800 font-bold">
                            {block.startTimeStr} - {block.endTimeStr}
                          </span>
                          <span className="text-neutral-500 text-[11px]">
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
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-600 hover:bg-stone-700 text-white text-[11px] font-semibold transition-all shadow-2xs"
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
                <div className="mt-3 pt-3 border-t border-neutral-200 space-y-2">
                  <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-1 font-semibold">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    <span>Due Today (Flexible Time / No Start Time Set)</span>
                  </div>
                  <div className="space-y-1.5">
                    {untimedTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => onEditTask(t)}
                        className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 hover:border-neutral-300 transition-all flex items-center justify-between text-xs cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-2 h-2 rounded-full ${
                            t.workspace === 'personal' ? 'bg-stone-500' : t.workspace === 'business' ? 'bg-neutral-600' : 'bg-zinc-600'
                          }`} />
                          <span className="text-neutral-900 truncate font-semibold">{t.title}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[10px] text-zinc-900">
                          {t.estimatedHours && <span>⏱️ {formatDuration(t.estimatedHours)}</span>}
                          <span className="text-neutral-400">Edit Time →</span>
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
                  className="w-full py-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-xs text-neutral-700 font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-neutral-900" />
                  <span>Add Task or Event for {formatDate(selectedDate)}</span>
                </button>
              </div>

            </div>

          </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      
      {/* Mobile Tab Switcher (Visible on small screens only) */}
      <div className="flex lg:hidden items-center p-1 bg-neutral-100 rounded-xl border border-neutral-200 text-xs">
        <button
          onClick={() => setMobileTab('calendar')}
          className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'calendar'
              ? 'bg-white text-black shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Month Calendar</span>
        </button>
        <button
          onClick={() => setMobileTab('schedule')}
          className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'schedule'
              ? 'bg-white text-black shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-zinc-600" />
          <span>Day Free-Time Map</span>
          {selectedDayTasks.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-neutral-200 text-black text-[10px] font-mono font-bold">
              {selectedDayTasks.length}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Calendar Grid: 7 Columns */}
        <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'calendar' ? 'block' : 'hidden lg:block'}`}>
          
          {/* Month Navigation Header */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 bg-white border border-neutral-200 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">{monthName}</h2>
              <button
                onClick={goToToday}
                className="px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-xs text-neutral-700 font-mono font-medium transition-colors"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid Container */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-3 sm:p-4 overflow-hidden shadow-xs">
            {/* Day Names Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 py-1 font-semibold">
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
                      setIsDayModalOpen(true);
                    }}
                    className={`min-h-[85px] sm:min-h-[95px] p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? 'bg-neutral-100/70 border-neutral-600 shadow-xs ring-2 ring-neutral-600/20'
                        : isTodayCell
                        ? 'bg-neutral-100/20 border-neutral-500'
                        : cell.isCurrentMonth
                        ? 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/70'
                        : 'bg-neutral-50/50 border-neutral-100 opacity-40 hover:opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-mono font-medium ${
                        isTodayCell 
                          ? 'w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold shadow-2xs' 
                          : isSelected 
                          ? 'text-black font-bold' 
                          : 'text-neutral-700'
                      }`}>
                        {cell.dayNum}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTaskModal(undefined, undefined, cell.dateString);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-all hidden sm:block"
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
                              ? 'bg-stone-50 text-stone-700 border border-stone-200'
                              : t.workspace === 'business'
                              ? 'bg-neutral-100 text-black border border-neutral-300'
                              : 'bg-zinc-100 text-zinc-900 border border-zinc-300'
                          }`}
                        >
                          {t.isEvent ? `⏱ ${t.dueTime || 'Event'}` : t.title}
                        </div>
                      ))}
                      {cellTasks.length > 2 && (
                        <div className="text-[9px] text-neutral-500 font-mono px-0.5 font-medium">
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
          {renderAgendaCard()}

        </div>

      </div>

      {/* Day Detail Popup - opens when a calendar day cell is clicked */}
      {isDayModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-900/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsDayModalOpen(false)}
        >
          <div
            className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end px-1 pb-2 sm:px-0">
              <button
                onClick={() => setIsDayModalOpen(false)}
                className="p-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-500 hover:text-neutral-900 shadow-xs transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderDayTaskListPopup()}
          </div>
        </div>
      )}

    </div>
  );
};
