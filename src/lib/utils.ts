import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export function isToday(dateString?: string): boolean {
  if (!dateString) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateString === today;
}

export function isPastDue(dateString?: string, status?: string): boolean {
  if (!dateString || status === 'done') return false;
  const today = new Date().toISOString().split('T')[0];
  return dateString < today;
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDaysOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function calculateDaysRemaining(dueDate?: string): number | null {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dueDate + 'T00:00:00');
  if (isNaN(target.getTime())) return null;
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export interface DeadlineInfo {
  status: 'done' | 'overdue' | 'today' | 'tomorrow' | 'soon' | 'future' | 'ongoing';
  badgeText: string;
  daysRemaining: number | null;
  pillClasses: string;
}

export function getDeadlineInfo(dueDate?: string, dueTime?: string, taskStatus?: string): DeadlineInfo {
  if (taskStatus === 'done') {
    return {
      status: 'done',
      badgeText: 'Completed',
      daysRemaining: null,
      pillClasses: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    };
  }

  if (!dueDate) {
    return {
      status: 'ongoing',
      badgeText: '♾️ Ongoing (No Deadline)',
      daysRemaining: null,
      pillClasses: 'bg-slate-800 text-slate-400 border border-white/10',
    };
  }

  const days = calculateDaysRemaining(dueDate);
  const timeSuffix = dueTime ? ` at ${dueTime}` : '';

  if (days === null) {
    return {
      status: 'ongoing',
      badgeText: '♾️ In Progress',
      daysRemaining: null,
      pillClasses: 'bg-slate-800 text-slate-400 border border-white/10',
    };
  }

  if (days < 0) {
    const overdueDays = Math.abs(days);
    return {
      status: 'overdue',
      badgeText: `🚨 Overdue by ${overdueDays}d`,
      daysRemaining: days,
      pillClasses: 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold animate-pulse',
    };
  }

  if (days === 0) {
    return {
      status: 'today',
      badgeText: `⚠️ Due Today${timeSuffix}`,
      daysRemaining: 0,
      pillClasses: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold',
    };
  }

  if (days === 1) {
    return {
      status: 'tomorrow',
      badgeText: `⏳ Due Tomorrow${timeSuffix}`,
      daysRemaining: 1,
      pillClasses: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
    };
  }

  if (days <= 3) {
    return {
      status: 'soon',
      badgeText: `⏱️ ${days} days left (${formatDate(dueDate)})`,
      daysRemaining: days,
      pillClasses: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
    };
  }

  return {
    status: 'future',
    badgeText: `📅 In ${days}d (${formatDate(dueDate)})`,
    daysRemaining: days,
    pillClasses: 'bg-slate-800/80 text-slate-300 border border-white/10',
  };
}

export function formatDuration(hours?: number, minutes?: number): string {
  if (minutes && minutes > 0) {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (hours && hours > 0) {
    if (hours === 0.5) return '30m';
    if (hours === 1) return '1 hr';
    if (hours % 1 === 0) return `${hours} hrs`;
    const whole = Math.floor(hours);
    const mins = Math.round((hours - whole) * 60);
    return `${whole}h ${mins}m`;
  }
  return '';
}
