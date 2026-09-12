'use client';

import React from 'react';
import { 
  Plus, 
  Search, 
  Sparkles, 
  SlidersHorizontal, 
  User, 
  Briefcase, 
  Building2, 
  Layers,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { WorkspaceType, TaskPriority, TaskStatus, ActiveView } from '@/types';

interface HeaderProps {
  activeView: ActiveView;
  currentWorkspace: WorkspaceType;
  onSelectWorkspace: (ws: WorkspaceType) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedPriority: TaskPriority | 'all';
  onPriorityChange: (p: TaskPriority | 'all') => void;
  selectedStatus: TaskStatus | 'all';
  onStatusChange: (s: TaskStatus | 'all') => void;
  onOpenTaskModal: () => void;
  onOpenClientModal: () => void;
  onOpenCommandPalette: () => void;
  onClearData: () => void;
  onLoadSampleData: () => void;
  taskCounts: {
    all: number;
    personal: number;
    business: number;
    client: number;
  };
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  currentWorkspace,
  onSelectWorkspace,
  searchQuery,
  onSearchChange,
  selectedPriority,
  onPriorityChange,
  selectedStatus,
  onStatusChange,
  onOpenTaskModal,
  onOpenClientModal,
  onOpenCommandPalette,
  onClearData,
  onLoadSampleData,
  taskCounts,
}) => {
  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Mission Control';
      case 'kanban': return 'Kanban Workflow';
      case 'list': return 'Task & Event Ledger';
      case 'calendar': return 'Timeline & Calendar';
      case 'clients': return 'Client Hub & Deliverables';
      case 'habits': return 'Daily Routines & Habits';
      default: return 'Tracker';
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 sm:px-6 py-3 transition-all shadow-2xs">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        {/* Left: View Title & Workspace Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tracking-wider uppercase text-slate-400">Workspace</span>
              <span className="text-slate-300">/</span>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">{getViewTitle()}</h1>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Workspace Pill Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/80 text-xs">
            <button
              onClick={() => onSelectWorkspace('all')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                currentWorkspace === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>All</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200/80 text-[10px] text-slate-700 font-mono">
                {taskCounts.all}
              </span>
            </button>

            <button
              onClick={() => onSelectWorkspace('personal')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                currentWorkspace === 'personal'
                  ? 'bg-white text-emerald-700 border border-emerald-300/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Personal</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-[10px] text-emerald-700 font-mono border border-emerald-200">
                {taskCounts.personal}
              </span>
            </button>

            <button
              onClick={() => onSelectWorkspace('business')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                currentWorkspace === 'business'
                  ? 'bg-white text-indigo-700 border border-indigo-300/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              <span>Business</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-50 text-[10px] text-indigo-700 font-mono border border-indigo-200">
                {taskCounts.business}
              </span>
            </button>

            <button
              onClick={() => onSelectWorkspace('client')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                currentWorkspace === 'client'
                  ? 'bg-white text-amber-800 border border-amber-300/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Clients</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-50 text-[10px] text-amber-800 font-mono border border-amber-200">
                {taskCounts.client}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Search, Filter, & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search / Command Palette trigger */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search or filter..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full sm:w-48 md:w-56 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-11 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-2xs"
            />
            <button
              onClick={onOpenCommandPalette}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-slate-200/70 border border-slate-300/70 text-[10px] text-slate-500 font-mono hover:bg-slate-300/80 hover:text-slate-800 transition-colors"
              title="Command Palette (Ctrl/Cmd + K)"
            >
              ⌘K
            </button>
          </div>

          {/* Priority filter */}
          <select
            value={selectedPriority}
            onChange={(e) => onPriorityChange(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-2xs cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="high">🟠 High</option>
            <option value="medium">🔵 Medium</option>
            <option value="low">⚪ Low</option>
          </select>

          {/* Client action if client workspace */}
          {(currentWorkspace === 'client' || activeView === 'clients') && (
            <button
              onClick={onOpenClientModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-medium transition-all shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Client</span>
            </button>
          )}

          {/* Primary New Item button */}
          <button
            onClick={onOpenTaskModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Item</span>
          </button>

          {/* Clear Workspace button if tasks exist */}
          {taskCounts.all > 0 ? (
            <button
              onClick={onClearData}
              title="Clear all tasks (Clean Slate)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onLoadSampleData}
              title="Load sample dataset for demo"
              className="px-2.5 py-1 rounded-lg text-[11px] text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-colors shadow-2xs"
            >
              Load Demo
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
