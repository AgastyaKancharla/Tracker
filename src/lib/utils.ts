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

// Format a Date as YYYY-MM-DD using its LOCAL calendar date, not UTC.
// `toISOString()` converts to UTC first, which rolls the date back by one
// day for any timezone ahead of UTC (e.g. IST, UTC+5:30) during the hours
// between local midnight and the UTC offset catching up (00:00-05:30 IST) -
// exactly when "today" would otherwise silently become "yesterday".
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isToday(dateString?: string): boolean {
  if (!dateString) return false;
  return dateString === getTodayString();
}

export function isPastDue(dateString?: string, status?: string): boolean {
  if (!dateString || status === 'done') return false;
  return dateString < getTodayString();
}

export function getTodayString(): string {
  return toLocalDateString(new Date());
}

export function getDaysOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
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
      pillClasses: 'bg-neutral-100 text-neutral-500 border border-neutral-300',
    };
  }

  if (!dueDate) {
    return {
      status: 'ongoing',
      badgeText: '♾️ Ongoing (No Deadline)',
      daysRemaining: null,
      pillClasses: 'bg-neutral-100 text-neutral-500 border border-neutral-300',
    };
  }

  const days = calculateDaysRemaining(dueDate);
  const timeSuffix = dueTime ? ` at ${dueTime}` : '';

  if (days === null) {
    return {
      status: 'ongoing',
      badgeText: '♾️ In Progress',
      daysRemaining: null,
      pillClasses: 'bg-neutral-100 text-neutral-500 border border-neutral-300',
    };
  }

  if (days < 0) {
    const overdueDays = Math.abs(days);
    return {
      status: 'overdue',
      badgeText: `🚨 Overdue by ${overdueDays}d`,
      daysRemaining: days,
      pillClasses: 'bg-black text-white border border-black font-semibold',
    };
  }

  if (days === 0) {
    return {
      status: 'today',
      badgeText: `⚠️ Due Today${timeSuffix}`,
      daysRemaining: 0,
      pillClasses: 'bg-neutral-900 text-white border border-neutral-900 font-semibold',
    };
  }

  if (days === 1) {
    return {
      status: 'tomorrow',
      badgeText: `⏳ Due Tomorrow${timeSuffix}`,
      daysRemaining: 1,
      pillClasses: 'bg-neutral-200 text-neutral-800 border border-neutral-400',
    };
  }

  if (days <= 3) {
    return {
      status: 'soon',
      badgeText: `⏱️ ${days} days left (${formatDate(dueDate)})`,
      daysRemaining: days,
      pillClasses: 'bg-neutral-100 text-neutral-700 border border-neutral-300',
    };
  }

  return {
    status: 'future',
    badgeText: `📅 In ${days}d (${formatDate(dueDate)})`,
    daysRemaining: days,
    pillClasses: 'bg-neutral-50 text-neutral-500 border border-neutral-200',
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
