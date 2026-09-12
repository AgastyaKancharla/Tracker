'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Mail, 
  Phone, 
  DollarSign, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ChevronRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { Client, TaskItem, TaskWorkspace } from '@/types';
import { formatDate } from '@/lib/utils';

interface ClientsViewProps {
  clients: Client[];
  tasks: TaskItem[];
  onOpenClientModal: (client?: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onOpenTaskModal: (workspace?: TaskWorkspace, initialStatus?: any, initialDate?: any, clientId?: string) => void;
  onEditTask: (task: TaskItem) => void;
  onToggleTaskStatus: (taskId: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  tasks,
  onOpenClientModal,
  onDeleteClient,
  onOpenTaskModal,
  onEditTask,
  onToggleTaskStatus,
}) => {
  const activeClients = clients.filter(c => c.status === 'active');
  const clientTasks = tasks.filter(t => t.workspace === 'client');

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Client Metrics & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">Client Portfolio & Contracts</h2>
          </div>
          <p className="text-xs text-slate-500">
            Manage client deliverables, hourly and retainer billing rates, project scopes, and milestones.
          </p>
        </div>

        <button
          onClick={() => onOpenClientModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Client Account</span>
        </button>
      </div>

      {/* Quick Stat Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-mono uppercase">Total Accounts</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{clients.length}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-mono uppercase">Active Retainers</div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-mono">{activeClients.length}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-mono uppercase">Active Deliverables</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono">
            {clientTasks.filter(t => t.status !== 'done').length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-mono uppercase">Delivered Milestones</div>
          <div className="text-xl font-bold text-indigo-600 mt-1 font-mono">
            {clientTasks.filter(t => t.status === 'done').length}
          </div>
        </div>
      </div>

      {/* Client Cards Grid or Empty State */}
      {clients.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl p-6 bg-white space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">No Client Accounts Registered Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Add your client companies or freelance accounts to track project scopes, deliverables, hourly or retainer billing rates, and meetings.
            </p>
          </div>
          <button
            onClick={() => onOpenClientModal()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Client</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((client) => {
            const associatedTasks = tasks.filter(t => t.clientId === client.id);
            const totalDeliverables = associatedTasks.length;
            const completedDeliverables = associatedTasks.filter(t => t.status === 'done').length;
            const progressPercent = totalDeliverables > 0 ? Math.round((completedDeliverables / totalDeliverables) * 100) : 0;

            return (
              <div
                key={client.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 transition-all flex flex-col justify-between group space-y-4 shadow-sm hover:shadow-md"
              >
                <div>
                  {/* Header: Company, status, & actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                        style={{ backgroundColor: client.color || '#F59E0B' }}
                      >
                        {client.company.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                          {client.company}
                        </h3>
                        <p className="text-xs text-slate-500">{client.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenClientModal(client)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Edit Client"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteClient(client.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Client"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Status & Billing Rates */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] font-mono">
                    <span className={`px-2 py-0.5 rounded uppercase font-semibold ${
                      client.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : client.status === 'lead'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {client.status}
                    </span>

                    <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1 font-medium">
                      <DollarSign className="w-3 h-3 text-amber-600" />
                      {client.rate}
                    </span>

                    {client.totalBudget && (
                      <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200">
                        Budget: {client.totalBudget}
                      </span>
                    )}
                  </div>

                  {/* Scope / Notes */}
                  {client.notes && (
                    <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                      {client.notes}
                    </p>
                  )}

                  {/* Deliverables Progress */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>Deliverables ({completedDeliverables}/{totalDeliverables})</span>
                      <span className="font-semibold text-slate-700">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Linked Tasks List Teaser */}
                  <div className="mt-3 space-y-1.5">
                    {associatedTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        onClick={() => onEditTask(t)}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs cursor-pointer transition-colors border border-slate-100"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTaskStatus(t.id);
                            }}
                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                              t.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-500'
                            }`}
                          >
                            {t.status === 'done' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          </button>
                          <span className={`truncate font-medium ${t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {t.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                          {formatDate(t.dueDate)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Quick-Action: Add deliverable for this client */}
                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onOpenTaskModal('client', undefined, undefined, client.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Deliverable for {client.company}</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
