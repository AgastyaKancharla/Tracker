'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2, Mail, Phone, DollarSign, FileText } from 'lucide-react';
import { Client } from '@/types';
import { getTodayString } from '@/lib/utils';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Partial<Client>) => void;
  editingClient?: Client | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingClient,
}) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<Client['status']>('active');
  const [rate, setRate] = useState('$150/hr');
  const [totalBudget, setTotalBudget] = useState('$15,000');
  const [color, setColor] = useState('#171717');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingClient) {
      setName(editingClient.name);
      setCompany(editingClient.company);
      setEmail(editingClient.email);
      setPhone(editingClient.phone || '');
      setStatus(editingClient.status);
      setRate(editingClient.rate);
      setTotalBudget(editingClient.totalBudget || '');
      setColor(editingClient.color || '#171717');
      setNotes(editingClient.notes || '');
    } else {
      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
      setStatus('active');
      setRate('$150/hr');
      setTotalBudget('$20,000');
      setColor('#171717');
      setNotes('');
    }
  }, [editingClient, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) return;

    onSave({
      id: editingClient?.id,
      name: name.trim() || company.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      status,
      rate: rate.trim(),
      totalBudget: totalBudget.trim() || undefined,
      color,
      notes: notes.trim(),
      createdAt: editingClient?.createdAt || getTodayString(),
    });
    onClose();
  };

  const colors = ['#000000', '#404040', '#525252', '#737373', '#a3a3a3', '#d4d4d4'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white border border-neutral-200 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-neutral-200 bg-neutral-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-100 border border-zinc-300 text-zinc-800">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900">
                {editingClient ? 'Edit Client Profile' : 'Add New Client'}
              </h2>
              <p className="text-xs text-neutral-500">
                Track client deliverables, billing terms, and contacts.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Company / Organization <span className="text-neutral-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Acme Innovations"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-zinc-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Primary Contact Name
              </label>
              <input
                type="text"
                placeholder="e.g., Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-zinc-600 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-neutral-500" />
                Email Address
              </label>
              <input
                type="email"
                placeholder="client@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-zinc-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-neutral-500" />
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-zinc-600 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Account Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 focus:outline-none focus:bg-white focus:border-zinc-600 shadow-2xs cursor-pointer"
              >
                <option value="active">🟢 Active Client</option>
                <option value="lead">🟡 In Discovery / Lead</option>
                <option value="on_hold">⏸️ On Hold</option>
                <option value="completed">🏁 Completed Contract</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-neutral-500" />
                Billing Rate
              </label>
              <input
                type="text"
                placeholder="$150/hr or $5k/mo"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:bg-white focus:border-zinc-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-neutral-500" />
                Total Project Value
              </label>
              <input
                type="text"
                placeholder="$25,000"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:bg-white focus:border-zinc-600 shadow-2xs"
              />
            </div>
          </div>

          {/* Color Tag Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Client Accent Color
            </label>
            <div className="flex items-center gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border transition-all ${
                    color === c ? 'scale-125 border-neutral-800 ring-2 ring-neutral-400/50' : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Scope Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-neutral-500" />
              Scope of Work & Notes
            </label>
            <textarea
              rows={3}
              placeholder="Key project deliverables, sprint schedules, meeting preferences..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-zinc-600 resize-none shadow-2xs"
            />
          </div>

          {/* Actions */}
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
              className="px-5 py-2 text-xs font-bold text-white bg-zinc-700 hover:bg-zinc-800 rounded-lg shadow-sm transition-all"
            >
              {editingClient ? 'Update Client' : 'Add Client'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
