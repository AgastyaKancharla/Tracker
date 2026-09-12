'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  CheckSquare, 
  CalendarDays, 
  Users2, 
  Flame, 
  Sparkles,
  Command,
  Clock,
  Briefcase,
  User,
  Building2,
  ChevronRight
} from 'lucide-react';
import { ActiveView, WorkspaceType } from '@/types';

interface SidebarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  currentWorkspace: WorkspaceType;
  onSelectWorkspace: (ws: WorkspaceType) => void;
  urgentCount: number;
  eventsTodayCount: number;
  activeClientCount: number;
  onOpenCommandPalette: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  currentWorkspace,
  onSelectWorkspace,
  urgentCount,
  eventsTodayCount,
  activeClientCount,
  onOpenCommandPalette,
}) => {
  const navItems: { id: ActiveView; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'kanban', label: 'Kanban Workflow', icon: <KanbanSquare className="w-4 h-4" /> },
    { id: 'list', label: 'Task Ledger', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'calendar', label: 'Calendar & Agenda', icon: <CalendarDays className="w-4 h-4" />, badge: eventsTodayCount > 0 ? `${eventsTodayCount} today` : undefined },
    { id: 'clients', label: 'Client Hub', icon: <Users2 className="w-4 h-4" />, badge: activeClientCount },
    { id: 'habits', label: 'Habits & Routine', icon: <Flame className="w-4 h-4 text-neutral-500" /> },
  ];

  const workspaces: { id: WorkspaceType; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
    { id: 'all', label: 'All Operations', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'text-neutral-600', desc: 'Unified view' },
    { id: 'personal', label: 'Personal Realm', icon: <User className="w-3.5 h-3.5" />, color: 'text-stone-600', desc: 'Habits, health & home' },
    { id: 'business', label: 'Business Hub', icon: <Briefcase className="w-3.5 h-3.5" />, color: 'text-neutral-900', desc: 'Revenue, operations & ops' },
    { id: 'client', label: 'Client Projects', icon: <Building2 className="w-3.5 h-3.5" />, color: 'text-zinc-700', desc: 'Deliverables & billing' },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-neutral-200 bg-white flex flex-col h-screen select-none shadow-xs">
      {/* Brand / Title Header */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center shadow-sm text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-neutral-900 flex items-center gap-1.5">
                ChronoTrack
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 text-black border border-neutral-300">PRO</span>
              </span>
              <p className="text-[11px] text-neutral-500">Personal • Business • Clients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Views Navigation */}
      <div className="px-3 py-4 flex-1 overflow-y-auto space-y-6">
        <div>
          <div className="px-3 pb-2 text-[10px] font-mono tracking-wider text-neutral-400 uppercase">
            Views
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-neutral-100 text-black font-semibold shadow-2xs border border-neutral-200'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-neutral-900' : 'text-neutral-400 group-hover:text-neutral-600'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      typeof item.badge === 'string'
                        ? 'bg-neutral-200 text-black border border-neutral-300'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Workspaces Filter */}
        <div>
          <div className="px-3 pb-2 flex items-center justify-between text-[10px] font-mono tracking-wider text-neutral-400 uppercase">
            <span>Workspaces</span>
          </div>
          <div className="space-y-1">
            {workspaces.map((ws) => {
              const isSelected = currentWorkspace === ws.id;
              return (
                <button
                  key={ws.id}
                  onClick={() => onSelectWorkspace(ws.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                    isSelected
                      ? 'bg-neutral-100 text-neutral-900 font-medium border border-neutral-200 shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={ws.color}>{ws.icon}</span>
                    <div className="text-left">
                      <div className="font-medium">{ws.label}</div>
                      <div className="text-[10px] text-neutral-400">{ws.desc}</div>
                    </div>
                  </div>
                  {isSelected && <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pulse / System Status Panel */}
        <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-700 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-neutral-900" />
              Real-time Overview
            </span>
            <span className="w-2 h-2 rounded-full bg-stone-500 animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-lg bg-white border border-neutral-200 shadow-2xs">
              <div className="text-sm font-bold text-black font-mono">{urgentCount}</div>
              <div className="text-[10px] text-neutral-500 uppercase">Urgent Items</div>
            </div>
            <div className="p-2 rounded-lg bg-white border border-neutral-200 shadow-2xs">
              <div className="text-sm font-bold text-zinc-700 font-mono">{eventsTodayCount}</div>
              <div className="text-[10px] text-neutral-500 uppercase">Events Today</div>
            </div>
          </div>
        </div>
      </div>

      {/* Command Palette Trigger in Footer */}
      <div className="p-3 border-t border-neutral-200 bg-neutral-50/50">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white hover:bg-neutral-100 border border-neutral-200 text-xs text-neutral-700 transition-colors shadow-2xs group"
        >
          <div className="flex items-center gap-2">
            <Command className="w-3.5 h-3.5 text-neutral-900" />
            <span className="text-[11px] font-medium">Quick Command Palette</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 border border-neutral-200 group-hover:text-neutral-800">
            ⌘K
          </span>
        </button>
      </div>
    </aside>
  );
};
