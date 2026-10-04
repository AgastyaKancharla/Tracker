'use client';

import React, { useEffect, useState } from 'react';
import { CalendarClock, X } from 'lucide-react';
import { TaskItem } from '@/types';
import { toLocalDateString } from '@/lib/utils';

interface RescheduleSheetProps {
  task: TaskItem | null;
  onClose: () => void;
  onReschedule: (task: TaskItem, dueDate: string, dueTime: string) => Promise<void>;
}

function hhmm(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function quickOptions() {
  const now = new Date();
  const options: { label: string; date: Date }[] = [];

  const inAnHour = new Date(now.getTime() + 60 * 60_000);
  inAnHour.setMinutes(Math.ceil(inAnHour.getMinutes() / 5) * 5, 0, 0);
  options.push({ label: 'In 1 hour', date: inAnHour });

  if (now.getHours() < 17) {
    const evening = new Date(now);
    evening.setHours(18, 0, 0, 0);
    options.push({ label: 'This evening', date: evening });
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  options.push({ label: 'Tomorrow morning', date: tomorrow });

  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7));
  nextMonday.setHours(9, 0, 0, 0);
  options.push({ label: 'Next Monday', date: nextMonday });

  return options;
}

export const RescheduleSheet: React.FC<RescheduleSheetProps> = ({ task, onClose, onReschedule }) => {
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!task) return;
    setCustomDate(task.dueDate || toLocalDateString(new Date()));
    setCustomTime(task.dueTime?.slice(0, 5) || '09:00');
    setError(null);
  }, [task]);

  if (!task) return null;

  const save = async (date: string, time: string) => {
    setSaving(true);
    setError(null);
    try {
      await onReschedule(task, date, time);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reschedule.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full md:max-w-sm bg-white rounded-t-2xl md:rounded-2xl p-5 pb-8 md:pb-5 shadow-xl animate-in slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarClock className="w-4 h-4 text-neutral-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-neutral-500">Reschedule</p>
              <p className="text-sm font-semibold text-neutral-900 truncate">{task.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-500 hover:bg-neutral-100" title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {quickOptions().map((o) => (
            <button
              key={o.label}
              disabled={saving}
              onClick={() => save(toLocalDateString(o.date), hhmm(o.date))}
              className="text-left px-3 py-2.5 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              <span className="block text-sm font-medium text-neutral-900">{o.label}</span>
              <span className="block text-[11px] text-neutral-500">
                {o.date.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
              </span>
            </button>
          ))}
        </div>

        <p className="text-xs font-medium text-neutral-500 mb-1.5">Pick a date & time</p>
        <div className="flex gap-2">
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-neutral-200 text-sm"
          />
          <input
            type="time"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            className="w-28 px-3 py-2 rounded-lg border border-neutral-200 text-sm"
          />
        </div>
        <button
          disabled={saving || !customDate || !customTime}
          onClick={() => save(customDate, customTime)}
          className="w-full mt-3 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-sm font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
};
