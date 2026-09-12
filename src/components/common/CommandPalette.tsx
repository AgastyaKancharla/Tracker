'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  LayoutDashboard, 
  KanbanSquare, 
  CalendarDays, 
  Users2, 
  Flame, 
  Plus, 
  User, 
  Briefcase, 
  Building2, 
  Download, 
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trash2,
  Sparkles
} from 'lucide-react';
import { TaskItem, Client, ActiveView, WorkspaceType, TaskWorkspace } from '@/types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  clients: Client[];
  onSelectView: (v: ActiveView) => void;
  onSelectWorkspace: (w: WorkspaceType) => void;
  onOpenTaskModal: (workspace?: TaskWorkspace) => void;
  onOpenClientModal: () => void;
  onEditTask: (task: TaskItem) => void;
  onClearData: () => void;
  onLoadSampleData: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tasks,
  clients,
  onSelectView,
  onSelectWorkspace,
  onOpenTaskModal,
  onOpenClientModal,
  onEditTask,
  onClearData,
  onLoadSampleData,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(query.toLowerCase()) ||
    t.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
    (t.clientName && t.clientName.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 5);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.company.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const handleExportData = () => {
    const data = {
      tasks,
      clients,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronotrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50/80">
          <Search className="w-4 h-4 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, search tasks, events, or clients..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-slate-200 text-[10px] text-slate-600 font-mono border border-slate-300">
            ESC
          </kbd>
        </div>

        {/* Results / Navigation Groups */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          
          {/* Quick Actions */}
          <div>
            <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Quick Actions
            </div>
            <div className="space-y-1">
              <button
                onClick={() => { onOpenTaskModal('personal'); onClose(); }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-100 text-xs text-slate-700 transition-colors group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="p-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-200"><User className="w-3.5 h-3.5" /></span>
                  <span className="font-medium">New Personal Task / Routine</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-slate-800" />
              </button>

              <button
                onClick={() => { onOpenTaskModal('business'); onClose(); }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-100 text-xs text-slate-700 transition-colors group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="p-1 rounded bg-indigo-50 text-indigo-600 border border-indigo-200"><Briefcase className="w-3.5 h-3.5" /></span>
                  <span className="font-medium">New Business Initiative / Event</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-slate-800" />
              </button>

              <button
                onClick={() => { onOpenTaskModal('client'); onClose(); }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-100 text-xs text-slate-700 transition-colors group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="p-1 rounded bg-amber-50 text-amber-700 border border-amber-200"><Building2 className="w-3.5 h-3.5" /></span>
                  <span className="font-medium">New Client Deliverable / Milestone</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-slate-800" />
              </button>

              <button
                onClick={() => { onOpenClientModal(); onClose(); }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-100 text-xs text-slate-700 transition-colors group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="p-1 rounded bg-amber-50 text-amber-700 border border-amber-200"><Plus className="w-3.5 h-3.5" /></span>
                  <span className="font-medium">Register New Client</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-slate-800" />
              </button>
            </div>
          </div>

          {/* Navigation Views */}
          <div>
            <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Jump To View
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => { onSelectView('dashboard'); onClose(); }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 text-xs text-slate-700 text-left transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mission Control</span>
              </button>

              <button
                onClick={() => { onSelectView('kanban'); onClose(); }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 text-xs text-slate-700 text-left transition-colors"
              >
                <KanbanSquare className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kanban Workflow</span>
              </button>

              <button
                onClick={() => { onSelectView('calendar'); onClose(); }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 text-xs text-slate-700 text-left transition-colors"
              >
                <CalendarDays className="w-3.5 h-3.5 text-amber-600" />
                <span>Calendar & Schedule</span>
              </button>

              <button
                onClick={() => { onSelectView('clients'); onClose(); }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 text-xs text-slate-700 text-left transition-colors"
              >
                <Users2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Client Hub</span>
              </button>

              <button
                onClick={() => { onSelectView('habits'); onClose(); }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 text-xs text-slate-700 text-left transition-colors"
              >
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>Habits & Routines</span>
              </button>
            </div>
          </div>

          {/* Matched Tasks & Events */}
          {filteredTasks.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Matching Tasks & Events ({filteredTasks.length})
              </div>
              <div className="space-y-1">
                {filteredTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => { onEditTask(task); onClose(); }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-100 text-xs text-slate-800 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {task.isEvent ? (
                        <Clock className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      )}
                      <span className="truncate font-medium">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        task.workspace === 'personal'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : task.workspace === 'business'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {task.workspace}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Data Backup & Reset */}
          <div>
            <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Data Management
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportData}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Backup</span>
              </button>

              <button
                onClick={() => { onClearData(); onClose(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-xs text-slate-600 hover:text-rose-700 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>

              <button
                onClick={() => { onLoadSampleData(); onClose(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-xs text-slate-600 hover:text-indigo-700 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Load Demo</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
