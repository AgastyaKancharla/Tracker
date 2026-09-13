'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  Tag, 
  Building2, 
  User, 
  Briefcase, 
  MapPin, 
  Flag,
  CheckCircle2,
  Hourglass,
  Timer,
  Info
} from 'lucide-react';
import { TaskItem, TaskWorkspace, TaskPriority, TaskStatus, Client } from '@/types';
import { getTodayString, getDaysOffset, getDeadlineInfo, formatDuration } from '@/lib/utils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<TaskItem>) => void;
  editingTask?: TaskItem | null;
  clients: Client[];
  tasks?: TaskItem[];
  defaultWorkspace?: TaskWorkspace;
  defaultDate?: string;
  defaultTime?: string;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map((n) => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
}

function taskDurationMinutes(task: TaskItem): number {
  return task.eventDurationMinutes || (task.estimatedHours ? Math.round(task.estimatedHours * 60) : 60);
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTask,
  clients,
  tasks = [],
  defaultWorkspace = 'personal',
  defaultDate,
  defaultTime,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workspace, setWorkspace] = useState<TaskWorkspace>(defaultWorkspace);
  const [clientId, setClientId] = useState<string>('');
  const [customClientName, setCustomClientName] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  
  // Deadline & Time controls
  const [hasDeadline, setHasDeadline] = useState(true);
  const [dueDate, setDueDate] = useState<string>(defaultDate || getTodayString());
  const [dueTime, setDueTime] = useState<string>('17:00');
  
  // Duration & Effort ("how long it takes")
  const [estimatedHours, setEstimatedHours] = useState<number | undefined>(2);

  // Timed Calendar Event controls
  const [isEvent, setIsEvent] = useState(false);
  const [eventDurationMinutes, setEventDurationMinutes] = useState(60);
  const [location, setLocation] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setWorkspace(editingTask.workspace);
      setClientId(editingTask.clientId || (clients[0]?.id || ''));
      setCustomClientName(editingTask.clientName || '');
      setPriority(editingTask.priority);
      setStatus(editingTask.status);
      
      const hasDate = Boolean(editingTask.dueDate);
      setHasDeadline(hasDate);
      setDueDate(editingTask.dueDate || getTodayString());
      setDueTime(editingTask.dueTime || '17:00');
      setEstimatedHours(editingTask.estimatedHours);

      setIsEvent(Boolean(editingTask.isEvent));
      setEventDurationMinutes(editingTask.eventDurationMinutes || 60);
      setLocation(editingTask.location || '');
      setTagsInput((editingTask.tags || []).join(', '));
    } else {
      setTitle('');
      setDescription('');
      setWorkspace(defaultWorkspace === ('all' as any) ? 'personal' : defaultWorkspace);
      setClientId(clients[0]?.id || '');
      setCustomClientName('');
      setPriority('medium');
      setStatus('todo');
      
      setHasDeadline(true);
      setDueDate(defaultDate || getDaysOffset(2)); // Default to in 2 days
      setDueTime(defaultTime || '17:00');
      setEstimatedHours(2);

      setIsEvent(false);
      setEventDurationMinutes(60);
      setLocation('');
      setTagsInput('');
    }
  }, [editingTask, isOpen, defaultWorkspace, defaultDate, defaultTime, clients]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    let resolvedClientId: string | undefined = undefined;
    let resolvedClientName: string | undefined = undefined;

    if (workspace === 'client') {
      const selectedClient = clients.find((c) => c.id === clientId);
      if (selectedClient && clientId !== 'custom') {
        resolvedClientId = selectedClient.id;
        resolvedClientName = selectedClient.company || selectedClient.name;
      } else if (customClientName.trim()) {
        resolvedClientName = customClientName.trim();
      }
    }

    onSave({
      id: editingTask?.id,
      title: title.trim(),
      description: description.trim(),
      workspace,
      clientId: resolvedClientId,
      clientName: resolvedClientName,
      priority,
      status,
      dueDate: hasDeadline ? dueDate : undefined,
      dueTime: hasDeadline ? (dueTime || undefined) : undefined,
      isEvent,
      eventDurationMinutes: isEvent ? Number(eventDurationMinutes) : undefined,
      location: isEvent ? location.trim() : undefined,
      tags,
      estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
    });
    onClose();
  };

  const deadlinePreview = getDeadlineInfo(hasDeadline ? dueDate : undefined, dueTime, status);

  // Only real calendar events represent an actual "booked slot" - an ordinary
  // task with just a due time/date isn't reserving a block of time, so it
  // shouldn't be flagged as conflicting with anything. Restricting to
  // event-vs-event also avoids guessing a duration for tasks that never set
  // one (which previously defaulted to 60m/2h and caused false positives
  // between unrelated same-day tasks that don't actually overlap).
  const conflicts = hasDeadline && dueTime && isEvent
    ? tasks.filter((t) => {
        if (t.id === editingTask?.id) return false;
        if (!t.isEvent || t.dueDate !== dueDate || !t.dueTime) return false;
        const otherStart = timeToMinutes(t.dueTime);
        const otherEnd = otherStart + taskDurationMinutes(t);
        const thisStart = timeToMinutes(dueTime);
        const thisEnd = thisStart + Number(eventDurationMinutes);
        return thisStart < otherEnd && otherStart < thisEnd;
      })
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white border border-neutral-200 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-neutral-200 bg-neutral-50/80">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg border ${
              workspace === 'personal'
                ? 'bg-stone-50 border-stone-200 text-stone-700'
                : workspace === 'business'
                ? 'bg-neutral-100 border-neutral-300 text-black'
                : 'bg-zinc-100 border-zinc-300 text-zinc-800'
            }`}>
              {workspace === 'personal' && <User className="w-4 h-4" />}
              {workspace === 'business' && <Briefcase className="w-4 h-4" />}
              {workspace === 'client' && <Building2 className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900">
                {editingTask ? 'Edit Item & Deadline' : 'Create Task with Deadline'}
              </h2>
              <p className="text-xs text-neutral-500">
                Specify what it is, target deadline date & time, and estimated duration.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/70 transition-colors"
          >
            <X className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Workspace Selection Selector */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1.5">
              Workspace Domain
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setWorkspace('personal')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  workspace === 'personal'
                    ? 'bg-stone-50 border-stone-400 text-stone-800 font-bold shadow-2xs'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <User className="w-3.5 h-3.5 text-stone-600" />
                <span>Personal</span>
              </button>

              <button
                type="button"
                onClick={() => setWorkspace('business')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  workspace === 'business'
                    ? 'bg-neutral-100 border-neutral-500 text-neutral-900 font-bold shadow-2xs'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-neutral-900" />
                <span>Business</span>
              </button>

              <button
                type="button"
                onClick={() => setWorkspace('client')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  workspace === 'client'
                    ? 'bg-zinc-100 border-zinc-500 text-black font-bold shadow-2xs'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-zinc-700" />
                <span>Client</span>
              </button>
            </div>
          </div>

          {/* Client selector if workspace is client */}
          {workspace === 'client' && (
            <div className="p-3 bg-zinc-100/70 border border-zinc-300 rounded-xl space-y-2">
              <label className="block text-xs font-semibold text-black">
                Link to Client Account or Company
              </label>
              {clients.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={clientId}
                    onChange={(e) => {
                      setClientId(e.target.value);
                      if (e.target.value !== 'custom') {
                        setCustomClientName('');
                      }
                    }}
                    className="w-full bg-white border border-zinc-400 rounded-lg px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-zinc-600 shadow-2xs"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company} ({c.name}) - {c.rate}
                      </option>
                    ))}
                    <option value="custom">✏️ Enter new client name directly...</option>
                  </select>
                  {clientId === 'custom' && (
                    <input
                      type="text"
                      placeholder="Enter client company name (e.g. Acme Website Corp)..."
                      value={customClientName}
                      onChange={(e) => setCustomClientName(e.target.value)}
                      className="w-full bg-white border border-zinc-400 rounded-lg px-3 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none shadow-2xs"
                    />
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder="Enter client or company name (e.g., Client Website Project)..."
                    value={customClientName}
                    onChange={(e) => setCustomClientName(e.target.value)}
                    className="w-full bg-white border border-zinc-400 rounded-lg px-3 py-2 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-zinc-600 shadow-2xs"
                  />
                  <p className="text-[10px] text-zinc-800 mt-1">
                    Tip: You can manage full client accounts & contracts in the Client Hub.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Title (What it is) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              What is this task / item? <span className="text-neutral-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Client website delivery by 15th, Finalize payment gateway..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-600 focus:ring-2 focus:ring-neutral-600/10 transition-all font-medium shadow-2xs"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Description & Specifications
            </label>
            <textarea
              rows={2}
              placeholder="Scope, links, meeting agendas, or deliverables checklist..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-600 focus:ring-2 focus:ring-neutral-600/10 transition-all resize-none shadow-2xs"
            />
          </div>

          {/* Target Deadline Section */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-neutral-900" />
                <span className="text-xs font-bold text-neutral-900">Target Deadline & Countdown</span>
              </div>

              {/* Has Deadline Toggle */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setHasDeadline(true)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    hasDeadline
                      ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Set Deadline
                </button>
                <button
                  type="button"
                  onClick={() => setHasDeadline(false)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    !hasDeadline
                      ? 'bg-neutral-800 text-white font-semibold shadow-xs'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Ongoing (No Cut-off)
                </button>
              </div>
            </div>

            {hasDeadline ? (
              <div className="space-y-3 pt-1">
                {/* Quick Future Presets */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-neutral-400 font-mono text-[10px] mr-1">Future:</span>
                  <button
                    type="button"
                    onClick={() => setDueDate(getTodayString())}
                    className="px-2.5 py-0.5 rounded-md bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 font-medium shadow-2xs"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueDate(getDaysOffset(1))}
                    className="px-2.5 py-0.5 rounded-md bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 font-medium shadow-2xs"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueDate(getDaysOffset(3))}
                    className="px-2.5 py-0.5 rounded-md bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 font-medium shadow-2xs"
                  >
                    In 3 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueDate(getDaysOffset(7))}
                    className="px-2.5 py-0.5 rounded-md bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 font-medium shadow-2xs"
                  >
                    Next Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueDate(getDaysOffset(14))}
                    className="px-2.5 py-0.5 rounded-md bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 font-medium shadow-2xs"
                  >
                    In 2 Weeks
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Target Deadline Date <span className="text-neutral-600">*</span>
                    </label>
                    <input
                      type="date"
                      required={hasDeadline}
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-600 font-mono shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-neutral-500" />
                      Target Time (Optional)
                    </label>
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-600 font-mono shadow-2xs"
                    />
                  </div>
                </div>

                {/* Live Deadline Preview Pill */}
                <div className="p-2.5 rounded-lg bg-white border border-neutral-200 flex items-center justify-between text-xs shadow-2xs">
                  <span className="text-neutral-500 font-medium">Live Deadline Status:</span>
                  <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] ${deadlinePreview.pillClasses}`}>
                    {deadlinePreview.badgeText}
                  </span>
                </div>

                {/* Scheduling Conflict Warning (non-blocking) */}
                {conflicts.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-neutral-100 border border-neutral-400 text-xs text-neutral-800 flex items-start gap-2">
                    <span className="flex-shrink-0">⚠</span>
                    <span>
                      Overlaps with{' '}
                      {conflicts.map((c, i) => (
                        <React.Fragment key={c.id}>
                          {i > 0 && ', '}
                          <strong>&quot;{c.title}&quot;</strong> at {c.dueTime}
                        </React.Fragment>
                      ))}
                      . You can still save this if that&apos;s intentional.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-white border border-neutral-200 flex items-start gap-2 text-xs text-neutral-600 shadow-2xs">
                <Info className="w-4 h-4 text-neutral-600 flex-shrink-0 mt-0.5" />
                <span>
                  No deadline assigned. This item will stay as an active <strong>&quot;In Progress / Ongoing&quot;</strong> task until you manually complete it.
                </span>
              </div>
            )}
          </div>

          {/* How Long It Takes (Duration / Estimated Time) */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-zinc-700" />
                <span className="text-xs font-bold text-neutral-900">How Long Will It Take? (Duration)</span>
              </div>
              {estimatedHours ? (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-900 border border-zinc-300 font-medium">
                  {formatDuration(estimatedHours)} estimated
                </span>
              ) : (
                <span className="text-xs text-neutral-400 font-mono">Not set</span>
              )}
            </div>

            {/* Quick Duration Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: '30m', val: 0.5 },
                { label: '1 hour', val: 1 },
                { label: '2 hours', val: 2 },
                { label: '4 hours', val: 4 },
                { label: '1 day (8h)', val: 8 },
              ].map((btn) => (
                <button
                  key={btn.val}
                  type="button"
                  onClick={() => setEstimatedHours(btn.val)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                    estimatedHours === btn.val
                      ? 'bg-zinc-200 border border-zinc-500 text-black font-bold shadow-2xs'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.25"
                step="0.25"
                placeholder="Or custom hours (e.g. 3.5)"
                value={estimatedHours !== undefined ? estimatedHours : ''}
                onChange={(e) => setEstimatedHours(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-zinc-600 font-mono shadow-2xs"
              />
              <span className="text-xs text-neutral-500 flex-shrink-0">hours</span>
            </div>
          </div>

          {/* Workflow Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500" />
                Workflow Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-600 shadow-2xs cursor-pointer"
              >
                <option value="in_progress">⚡ In Progress</option>
                <option value="todo">📋 To Do</option>
                <option value="backlog">📥 Backlog</option>
                <option value="review">👀 Client / Internal Review</option>
                <option value="done">✅ Done / Finished</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                <Flag className="w-3.5 h-3.5 text-neutral-500" />
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-600 shadow-2xs cursor-pointer"
              >
                <option value="urgent">🔴 Urgent (High urgency)</option>
                <option value="high">🟠 High (Important)</option>
                <option value="medium">🔵 Medium (Normal)</option>
                <option value="low">⚪ Low (Flexible)</option>
              </select>
            </div>
          </div>

          {/* Optional Calendar Event Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200">
            <div>
              <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-900" />
                Also Show as Timed Calendar Meeting
              </div>
              <div className="text-[11px] text-neutral-500">
                Adds meeting link, location, and exact start time onto the calendar grid.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEvent}
                onChange={(e) => setIsEvent(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:tranneutral-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
            </label>
          </div>

          {isEvent && (
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
              <label className="block text-xs font-semibold text-neutral-700 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-neutral-500" />
                Meeting Location or Video Link
              </label>
              <input
                type="text"
                placeholder="e.g. Zoom, Google Meet, Client Office"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-600 shadow-2xs"
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-neutral-500" />
              Tags (Optional)
            </label>
            <input
              type="text"
              placeholder="Website, Frontend, Milestone, Health..."
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-600 shadow-2xs"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 pb-safe sm:pb-0 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-black rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{editingTask ? 'Save Changes' : 'Create Task'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
