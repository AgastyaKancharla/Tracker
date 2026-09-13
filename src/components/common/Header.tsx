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
  Trash2,
  LogOut,
  Mic
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
  onOpenVoiceCommand: () => void;
  onClearData: () => void;
  onLoadSampleData: () => void;
  onSignOut: () => void;
  userEmail?: string | null;
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
  onOpenVoiceCommand,
  onClearData,
  onLoadSampleData,
  onSignOut,
  userEmail,
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
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-xl px-4 sm:px-6 py-3 transition-all shadow-2xs">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        {/* Left: View Title & Workspace Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tracking-wider uppercase text-neutral-400">Workspace</span>
              <span className="text-neutral-300">/</span>
              <h1 className="text-base font-bold text-neutral-900 tracking-tight">{getViewTitle()}</h1>
            </div>
          </div>

          <div className="h-4 w-px bg-neutral-200 hidden sm:block" />

          {/* Workspace Pill Switcher */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg border border-neutral-200/80 text-xs">
            <button
              onClick={() => onSelectWorkspace('all')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                currentWorkspace === 'all'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-neutral-500" />
              <span>All</span>
              <span className="px-1.5 py-0.2 rounded-full bg-neutral-200/80 text-[10px] text-neutral-700 font-mono">
                {taskCounts.all}
              </span>
            </button>

            <button
              onClick={() => onSelectWorkspace('personal')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                currentWorkspace === 'personal'
                  ? 'bg-white text-stone-700 border border-stone-300/80 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <User className="w-3.5 h-3.5 text-stone-600" />
              <span>Personal</span>
              <span className="px-1.5 py-0.2 rounded-full bg-stone-50 text-[10px] text-stone-700 font-mono border border-stone-200">
                {taskCounts.personal}
              </span>
            </button>

            <button
              onClick={() => onSelectWorkspace('business')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                currentWorkspace === 'business'
                  ? 'bg-white text-black border border-neutral-400/80 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-neutral-900" />
              <span>Business</span>
              <span className="px-1.5 py-0.2 rounded-full bg-neutral-100 text-[10px] text-black font-mono border border-neutral-300">
                {taskCounts.business}
              </span>
            </button>

            <button
              onClick={() => onSelectWorkspace('client')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                currentWorkspace === 'client'
                  ? 'bg-white text-zinc-900 border border-zinc-400/80 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-zinc-700" />
              <span>Clients</span>
              <span className="px-1.5 py-0.2 rounded-full bg-zinc-100 text-[10px] text-zinc-900 font-mono border border-zinc-300">
                {taskCounts.client}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Search, Filter, & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search / Command Palette trigger */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search or filter..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full sm:w-48 md:w-56 bg-neutral-50 border border-neutral-200 rounded-lg pl-8 pr-11 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-neutral-600 focus:ring-2 focus:ring-neutral-600/10 transition-all shadow-2xs"
            />
            <button
              onClick={onOpenCommandPalette}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-neutral-200/70 border border-neutral-300/70 text-[10px] text-neutral-500 font-mono hover:bg-neutral-300/80 hover:text-neutral-800 transition-colors"
              title="Command Palette (Ctrl/Cmd + K)"
            >
              ⌘K
            </button>
          </div>

          {/* Priority filter */}
          <select
            value={selectedPriority}
            onChange={(e) => onPriorityChange(e.target.value as any)}
            className="bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-700 focus:outline-none focus:bg-white focus:border-neutral-600 transition-all shadow-2xs cursor-pointer"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-400 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 text-xs font-medium transition-all shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Client</span>
            </button>
          )}

          {/* Voice Command button */}
          <button
            onClick={onOpenVoiceCommand}
            title="Add, edit, delete, or complete a task by voice"
            className="flex items-center gap-1.5 p-1.5 rounded-lg text-neutral-600 hover:text-black hover:bg-neutral-100 border border-neutral-200 transition-colors shadow-2xs"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>

          {/* Primary New Item button */}
          <button
            onClick={onOpenTaskModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-medium shadow-sm transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Item</span>
          </button>

          {/* Clear Workspace button if tasks exist */}
          {taskCounts.all > 0 ? (
            <button
              onClick={onClearData}
              title="Clear all tasks (Clean Slate)"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-300 transition-colors shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onLoadSampleData}
              title="Load sample dataset for demo"
              className="px-2.5 py-1 rounded-lg text-[11px] text-neutral-600 hover:text-black hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-300 transition-colors shadow-2xs"
            >
              Load Demo
            </button>
          )}

          {/* Account / Sign out */}
          <div className="h-4 w-px bg-neutral-200 hidden sm:block" />
          <button
            onClick={onSignOut}
            title={userEmail ? `Sign out (${userEmail})` : 'Sign out'}
            className="flex items-center gap-1.5 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 border border-neutral-200 transition-colors shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
};
