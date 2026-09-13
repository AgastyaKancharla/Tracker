'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, X, Loader2, CheckCircle2, AlertTriangle, Pencil } from 'lucide-react';
import { TaskItem, Client, TaskWorkspace, TaskPriority, TaskStatus } from '@/types';
import { formatDate, getTodayString } from '@/lib/utils';

// Minimal ambient types for the Web Speech API (not in default TS lib)
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export interface VoiceCommandDraft {
  action: 'add' | 'edit' | 'delete' | 'complete' | 'uncomplete' | 'query' | 'unclear';
  taskId?: string;
  title?: string;
  description?: string;
  workspace?: TaskWorkspace;
  priority?: TaskPriority;
  dueDate?: string | null;
  dueTime?: string | null;
  isEvent?: boolean;
  clientName?: string;
  missingFields: string[];
  summary: string;
  clarification?: string;
  answer?: string;
  relevantTaskIds?: string[];
}

interface VoiceCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  clients: Client[];
  onSaveTask: (taskData: Partial<TaskItem>) => void | Promise<void>;
  onDeleteTask: (taskId: string) => void | Promise<void>;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void | Promise<void>;
}

type Phase = 'idle' | 'recording' | 'processing' | 'reviewing' | 'error' | 'saving';

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export const VoiceCommandModal: React.FC<VoiceCommandModalProps> = ({
  isOpen,
  onClose,
  tasks,
  clients,
  onSaveTask,
  onDeleteTask,
  onUpdateTaskStatus,
}) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [transcript, setTranscript] = useState('');
  const [draft, setDraft] = useState<VoiceCommandDraft | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const isSupported = !!getSpeechRecognition();

  useEffect(() => {
    if (!isOpen) {
      setPhase('idle');
      setTranscript('');
      setDraft(null);
      setErrorMsg(null);
      setEditingField(null);
      setIsSaving(false);
      setSaveError(null);
      recognitionRef.current?.stop();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const matchedTask = draft?.taskId ? tasks.find((t) => t.id === draft.taskId) : undefined;

  const startRecording = (merging: boolean) => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setErrorMsg('Voice input is not supported in this browser. Try Chrome on desktop or Android.');
      setPhase('error');
      return;
    }
    setIsMerging(merging);
    setTranscript('');
    setErrorMsg(null);
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setTranscript(text);
    };
    recognition.onerror = (e) => {
      setErrorMsg(`Microphone error: ${e.error}`);
      setPhase('error');
    };
    recognition.onend = () => {
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    recognition.start();
    setPhase('recording');
  };

  const stopRecording = async () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    const finalTranscript = transcript.trim();
    if (!finalTranscript) {
      setPhase(draft ? 'reviewing' : 'idle');
      return;
    }
    setPhase('processing');
    try {
      const res = await fetch('/api/voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: finalTranscript,
          tasks: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            workspace: t.workspace,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate,
            dueTime: t.dueTime,
          })),
          clients: clients.map((c) => ({ id: c.id, name: c.name, company: c.company })),
          previousDraft: isMerging ? draft : undefined,
          todayLocal: getTodayString(),
        }),
      });
      let data: { error?: string; draft?: VoiceCommandDraft };
      try {
        data = await res.json();
      } catch {
        throw new Error(
          res.ok ? 'Voice command failed: the server returned an unreadable response.' : `Voice command failed (${res.status}).`
        );
      }
      if (!res.ok) throw new Error(data.error || 'Voice command failed.');
      const newDraft = data.draft as VoiceCommandDraft;
      setDraft(newDraft);
      setPhase('reviewing');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Voice command failed.');
      setPhase('error');
    }
  };

  const updateDraftField = (key: keyof VoiceCommandDraft, value: unknown) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      next.missingFields = (prev.missingFields || []).filter((f) => f !== key);
      return next;
    });
    setEditingField(null);
  };

  const actionLabel: Record<VoiceCommandDraft['action'], string> = {
    add: 'Add task',
    edit: 'Edit task',
    delete: 'Delete task',
    complete: 'Mark done',
    uncomplete: 'Mark not done',
    query: 'Answer',
    unclear: 'Needs clarification',
  };

  const isDestructive = draft?.action === 'delete';
  const isQuery = draft?.action === 'query';
  const needsTaskForm = draft?.action === 'add' || draft?.action === 'edit';

  const canSave =
    draft &&
    draft.action !== 'unclear' &&
    draft.action !== 'query' &&
    (needsTaskForm ? !!(draft.title || matchedTask?.title) : !!draft.taskId);

  const handleSave = async () => {
    if (!draft || !canSave || isSaving) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      if (draft.action === 'add') {
        await onSaveTask({
          title: draft.title,
          description: draft.description,
          workspace: draft.workspace || 'personal',
          priority: draft.priority || 'medium',
          dueDate: draft.dueDate ?? undefined,
          dueTime: draft.dueTime ?? undefined,
          isEvent: draft.isEvent,
          clientName: draft.clientName,
        });
      } else if (draft.action === 'edit' && draft.taskId) {
        await onSaveTask({
          id: draft.taskId,
          title: draft.title,
          description: draft.description,
          workspace: draft.workspace,
          priority: draft.priority,
          dueDate: draft.dueDate ?? undefined,
          dueTime: draft.dueTime ?? undefined,
          isEvent: draft.isEvent,
        });
      } else if (draft.action === 'delete' && draft.taskId) {
        await onDeleteTask(draft.taskId);
      } else if (draft.action === 'complete' && draft.taskId) {
        await onUpdateTaskStatus(draft.taskId, 'done');
      } else if (draft.action === 'uncomplete' && draft.taskId) {
        await onUpdateTaskStatus(draft.taskId, 'todo');
      }
      onClose();
    } catch (err) {
      setIsSaving(false);
      setSaveError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    }
  };

  interface Chip {
    key: string;
    label: string;
    value: string | null;
    editor?: 'text' | 'workspace' | 'priority' | 'event' | 'date' | 'time';
  }

  const chips: Chip[] = needsTaskForm
    ? [
        { key: 'title', label: 'Title', value: draft?.title || matchedTask?.title || null, editor: 'text' },
        { key: 'workspace', label: 'Workspace', value: draft?.workspace || null, editor: 'workspace' },
        {
          key: 'isEvent',
          label: 'Event',
          value: draft?.isEvent === undefined ? null : draft.isEvent ? 'Yes' : 'No',
          editor: 'event',
        },
        {
          key: 'dueDate',
          label: 'Deadline',
          value:
            draft?.dueDate === undefined
              ? null
              : draft.dueDate === null
              ? 'None'
              : formatDate(draft.dueDate),
          editor: 'date',
        },
        {
          key: 'dueTime',
          label: 'Time',
          value: draft?.dueTime === undefined ? null : draft.dueTime === null ? 'None' : draft.dueTime,
          editor: 'time',
        },
        { key: 'priority', label: 'Priority', value: draft?.priority || null, editor: 'priority' },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 bg-neutral-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-neutral-100 border border-neutral-300 text-black">
              <Mic className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-neutral-900">Voice Command</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!isSupported && (
            <div className="p-3 rounded-lg bg-neutral-100 border border-neutral-300 text-xs text-neutral-700">
              Voice input isn&apos;t supported in this browser. Try Chrome on desktop or Android.
            </div>
          )}

          {(phase === 'idle' || phase === 'recording') && !draft && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <button
                type="button"
                disabled={!isSupported}
                onClick={() => (phase === 'recording' ? stopRecording() : startRecording(false))}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all disabled:opacity-40 ${
                  phase === 'recording'
                    ? 'bg-black text-white animate-pulse'
                    : 'bg-neutral-900 text-white hover:bg-black'
                }`}
              >
                {phase === 'recording' ? <Square className="w-7 h-7" /> : <Mic className="w-8 h-8" />}
              </button>
              <p className="text-xs text-neutral-500 text-center">
                {phase === 'recording'
                  ? 'Listening… tap to stop'
                  : 'Tap to speak — add/edit/delete a task, mark one done, or ask "what\'s urgent this week?"'}
              </p>
              {transcript && (
                <p className="text-xs text-neutral-700 italic text-center px-2">&quot;{transcript}&quot;</p>
              )}
            </div>
          )}

          {phase === 'processing' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <Loader2 className="w-6 h-6 text-neutral-600 animate-spin" />
              <p className="text-xs text-neutral-500">Understanding what you said…</p>
            </div>
          )}

          {phase === 'error' && (
            <div className="p-3 rounded-lg bg-neutral-100 border border-neutral-400 text-xs text-neutral-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {(phase === 'reviewing' || phase === 'recording') && draft && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
                  {actionLabel[draft.action]}
                </span>
              </div>

              {!isQuery && (
                <p className="text-sm text-neutral-900 font-medium leading-relaxed">{draft.summary}</p>
              )}

              {draft.action === 'unclear' && draft.clarification && (
                <div className="p-3 rounded-lg bg-neutral-100 border border-neutral-400 text-xs text-neutral-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{draft.clarification}</span>
                </div>
              )}

              {isQuery && (
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2.5">
                  <p className="text-sm text-neutral-900 leading-relaxed">
                    {draft.answer || 'No answer returned.'}
                  </p>
                  {!!draft.relevantTaskIds?.length && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {draft.relevantTaskIds.map((id) => {
                        const t = tasks.find((task) => task.id === id);
                        if (!t) return null;
                        return (
                          <span
                            key={id}
                            className="px-1.5 py-0.5 rounded bg-white border border-neutral-200 text-[10px] font-mono text-neutral-600"
                          >
                            {t.title}
                            {t.dueDate ? ` · ${formatDate(t.dueDate)}` : ''}
                            {t.dueTime ? ` ${t.dueTime}` : ''}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {!needsTaskForm && !isQuery && draft.action !== 'unclear' && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                    isDestructive
                      ? 'bg-black text-white border-black'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-800'
                  }`}
                >
                  {matchedTask ? (
                    <span>
                      {actionLabel[draft.action]}: <strong>&quot;{matchedTask.title}&quot;</strong>
                    </span>
                  ) : (
                    <span>No matching task found.</span>
                  )}
                </div>
              )}

              {needsTaskForm && (
                <div className="flex flex-wrap gap-1.5">
                  {chips.map((chip) => {
                    const isMissing = chip.value === null;
                    return (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={() => setEditingField(editingField === chip.key ? null : chip.key)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono border transition-colors ${
                          isMissing
                            ? 'bg-black text-white border-black font-semibold'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-300 hover:border-neutral-500'
                        }`}
                      >
                        <span className="opacity-70">{chip.label}:</span>
                        <span>{isMissing ? 'Missing — tap to add' : chip.value}</span>
                        <Pencil className="w-2.5 h-2.5 opacity-60" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Inline field editor */}
              {editingField && needsTaskForm && (
                <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-300 space-y-2">
                  {editingField === 'title' && (
                    <input
                      autoFocus
                      type="text"
                      defaultValue={draft.title || ''}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') updateDraftField('title', e.currentTarget.value);
                      }}
                      onBlur={(e) => updateDraftField('title', e.currentTarget.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-xs"
                      placeholder="Task title"
                    />
                  )}
                  {editingField === 'workspace' && (
                    <div className="flex gap-2">
                      {(['personal', 'business', 'client'] as TaskWorkspace[]).map((w) => (
                        <button
                          key={w}
                          onClick={() => updateDraftField('workspace', w)}
                          className="px-3 py-1.5 rounded-md text-xs border border-neutral-300 bg-white hover:bg-neutral-100 capitalize"
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  )}
                  {editingField === 'priority' && (
                    <div className="flex gap-2 flex-wrap">
                      {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => updateDraftField('priority', p)}
                          className="px-3 py-1.5 rounded-md text-xs border border-neutral-300 bg-white hover:bg-neutral-100 capitalize"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                  {editingField === 'isEvent' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateDraftField('isEvent', true)}
                        className="px-3 py-1.5 rounded-md text-xs border border-neutral-300 bg-white hover:bg-neutral-100"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => updateDraftField('isEvent', false)}
                        className="px-3 py-1.5 rounded-md text-xs border border-neutral-300 bg-white hover:bg-neutral-100"
                      >
                        No
                      </button>
                    </div>
                  )}
                  {editingField === 'dueDate' && (
                    <input
                      autoFocus
                      type="date"
                      defaultValue={draft.dueDate || ''}
                      onChange={(e) => updateDraftField('dueDate', e.currentTarget.value || null)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-xs font-mono"
                    />
                  )}
                  {editingField === 'dueTime' && (
                    <input
                      autoFocus
                      type="time"
                      defaultValue={draft.dueTime || ''}
                      onChange={(e) => updateDraftField('dueTime', e.currentTarget.value || null)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-xs font-mono"
                    />
                  )}
                </div>
              )}

              {/* Tap to add/correct details for add/edit, or ask a fresh follow-up question for query. Tap again to stop and submit. */}
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  disabled={!isSupported}
                  onClick={() => (phase === 'recording' ? stopRecording() : startRecording(!isQuery))}
                  className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-40 select-none ${
                    phase === 'recording'
                      ? 'bg-black text-white border-black animate-pulse'
                      : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {phase === 'recording' ? (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>Listening… tap to stop</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>{isQuery ? 'Tap to ask another question' : 'Tap to add or correct by voice'}</span>
                    </>
                  )}
                </button>
                {phase === 'recording' && (
                  <p className="text-xs text-neutral-700 italic text-center px-2 min-h-[1em]">
                    {transcript ? `"${transcript}"` : 'Listening…'}
                  </p>
                )}
              </div>
              {transcript && phase === 'reviewing' && (
                <p className="text-[11px] text-neutral-400 italic">Last heard: &quot;{transcript}&quot;</p>
              )}
              {saveError && (
                <div className="p-3 rounded-lg bg-neutral-100 border border-neutral-400 text-xs text-neutral-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {phase === 'reviewing' && draft && (
          <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-neutral-200 bg-neutral-50/80">
            {isQuery ? (
              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold rounded-lg shadow-sm transition-all bg-neutral-900 text-white hover:bg-black"
              >
                Close
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!canSave || isSaving}
                  className={`px-5 py-2 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-40 ${
                    isDestructive ? 'bg-black text-white hover:bg-neutral-800' : 'bg-neutral-900 text-white hover:bg-black'
                  }`}
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isSaving ? 'Saving…' : isDestructive ? 'Confirm Delete' : 'Save'}</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
