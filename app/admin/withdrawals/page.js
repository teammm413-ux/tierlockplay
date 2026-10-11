'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import {
  ArrowUpRight,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  X,
  FileText,
  CreditCard,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Sliders,
  Settings
} from 'lucide-react';

export default function AdminWithdrawalsPage() {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'methods'
  const [withdrawals, setWithdrawals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Modal State for Action with Player Note
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [modalAction, setModalAction] = useState('approve'); // 'approve' or 'reject'
  const [noteInput, setNoteInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment Methods Management State
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);
  const [isAddMethodOpen, setIsAddMethodOpen] = useState(false);
  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodLabel, setNewMethodLabel] = useState('');
  const [newMethodPlaceholder, setNewMethodPlaceholder] = useState('');
  const [newMethodInstructions, setNewMethodInstructions] = useState('');
  const [isSavingMethod, setIsSavingMethod] = useState(false);

  const loadWithdrawals = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const url = `/api/admin/withdrawals?status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setWithdrawals(data.withdrawals || []);
      }
    } catch (err) {
      // silent
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const loadPayoutMethods = async () => {
    setIsLoadingMethods(true);
    try {
      const res = await fetch('/api/admin/withdrawal-methods');
      const data = await res.json();
      if (data.success) {
        setPayoutMethods(data.methods || []);
      }
    } catch (err) {
      // silent
    } finally {
      setIsLoadingMethods(false);
    }
  };

  useEffect(() => {
    loadWithdrawals(false);
    loadPayoutMethods();
  }, [statusFilter, searchQuery]);

  // Real-time automatic background polling every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadWithdrawals(true);
    }, 3500);
    return () => clearInterval(interval);
  }, [statusFilter, searchQuery]);

  const openActionModal = (item, action) => {
    setActiveModalItem(item);
    setModalAction(action);
    setNoteInput(
      action === 'approve'
        ? `Funds sent to ${item.payment_method}: ${item.payment_info}`
        : 'Invalid payout info or tag not found. Amount refunded to your wallet.'
    );
  };

  const closeActionModal = () => {
    setActiveModalItem(null);
    setNoteInput('');
    setIsSubmitting(false);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!activeModalItem || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeModalItem.id,
          action: modalAction,
          note: noteInput.trim(),
          reason: noteInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(data.message);
        closeActionModal();
        loadWithdrawals(true);
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err) {
      alert('Network error executing action');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMethodActive = async (method) => {
    try {
      const nextState = !method.is_active;
      const res = await fetch('/api/admin/withdrawal-methods', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: method.id,
          is_active: nextState,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(`Method '${method.name}' is now ${nextState ? 'Active' : 'Disabled'}.`);
        loadPayoutMethods();
      } else {
        alert(data.message || 'Failed to update payment method');
      }
    } catch (err) {
      alert('Error updating payment method');
    }
  };

  const handleDeleteMethod = async (method) => {
    if (!confirm(`Are you sure you want to remove '${method.name}' from withdrawal options?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/withdrawal-methods?id=${method.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(data.message);
        loadPayoutMethods();
      } else {
        alert(data.message || 'Failed to delete payment method');
      }
    } catch (err) {
      alert('Error deleting payment method');
    }
  };

  const handleAddMethodSubmit = async (e) => {
    e.preventDefault();
    if (!newMethodName.trim()) return;

    setIsSavingMethod(true);
    try {
      const res = await fetch('/api/admin/withdrawal-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMethodName.trim(),
          field_label: newMethodLabel.trim() || 'Account / Tag',
          field_placeholder: newMethodPlaceholder.trim() || 'Enter account identifier',
          instructions: newMethodInstructions.trim() || '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(data.message);
        setIsAddMethodOpen(false);
        setNewMethodName('');
        setNewMethodLabel('');
        setNewMethodPlaceholder('');
        setNewMethodInstructions('');
        loadPayoutMethods();
      } else {
        alert(data.message || 'Failed to add method');
      }
    } catch (err) {
      alert('Network error adding payment method');
    } finally {
      setIsSavingMethod(false);
    }
  };

  const copyToClipboard = (text, id) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const pendingCount = withdrawals.filter((w) => w.status === 'Pending').length;
  const activeMethodsCount = payoutMethods.filter((m) => m.is_active).length;

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto pt-16 lg:pt-6">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                <ArrowUpRight className="w-6 h-6 text-emerald-400" />
                <span>Wallet Withdrawals &amp; Payout Methods</span>
              </h1>
              {pendingCount > 0 && (
                <span className="bg-emerald-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse">
                  {pendingCount} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Review player cashout orders, or configure active withdrawal channels (Cash App, Chime, Apple Pay, Google Pay, PayPal).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadWithdrawals(false);
                loadPayoutMethods();
              }}
              className="self-start sm:self-auto px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#FFCC00]" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Global Action Banner */}
        {actionNotice && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-semibold flex items-center justify-between shadow-lg">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice('')} className="text-emerald-400 font-bold hover:opacity-80">
              ×
            </button>
          </div>
        )}

        {/* Navigation Tabs between Requests and Payment Methods */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'bg-[#FFCC00] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Withdrawal Requests</span>
            {pendingCount > 0 && (
              <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                activeTab === 'requests' ? 'bg-slate-950 text-[#FFCC00]' : 'bg-emerald-500 text-slate-950'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('methods')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'methods'
                ? 'bg-[#FFCC00] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Manage Payment Methods</span>
            <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
              activeTab === 'methods' ? 'bg-slate-950 text-[#FFCC00]' : 'bg-white/10 text-slate-300'
            }`}>
              {activeMethodsCount} Active
            </span>
          </button>
        </div>

        {/* TAB 1: WITHDRAWAL REQUESTS */}
        {activeTab === 'requests' && (
          <div className="space-y-5">
            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      statusFilter === status
                        ? 'bg-[#FFCC00] text-slate-950 font-black shadow-[0_2px_15px_rgba(255,204,0,0.3)]'
                        : 'bg-[#101117] text-slate-300 border border-white/10 hover:bg-white/5'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by order #, player, cashtag..."
                  className="w-full bg-[#101117] border border-white/10 text-white text-xs pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 transition"
                />
              </div>
            </div>

            {/* Withdrawals Table */}
            <div className="bg-[#101117] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#181922] text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-4 px-4">Order No</th>
                      <th className="py-4 px-4">Player</th>
                      <th className="py-4 px-4">Payout Method</th>
                      <th className="py-4 px-4">Account Details</th>
                      <th className="py-4 px-4">Amount to Send</th>
                      <th className="py-4 px-4">Status &amp; Reason</th>
                      <th className="py-4 px-4">Created Time</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {withdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <AlertCircle className="w-7 h-7 text-slate-600" />
                            <span className="font-semibold text-slate-400">
                              {isLoading ? 'Loading withdrawals...' : 'No withdrawal records found.'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      withdrawals.map((w) => {
                        const isPending = w.status === 'Pending';
                        const isApproved = w.status === 'Approved';
                        const isRejected = w.status === 'Rejected';

                        return (
                          <tr key={w.id} className="hover:bg-white/[0.03] transition">
                            <td className="py-4 px-4 font-mono font-medium text-slate-200">
                              <span className="flex items-center gap-1.5">
                                <span>{w.order_no}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(w.order_no, w.id)}
                                  className="text-slate-500 hover:text-slate-300 transition"
                                  title="Copy order #"
                                >
                                  {copiedId === w.id ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </span>
                            </td>
                            <td className="py-4 px-4 font-bold text-white">
                              <span>{w.username}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-slate-200 font-semibold bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-[11px]">
                                {w.payment_method}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-mono text-[#FFCC00] font-bold">
                              <span className="flex items-center gap-1.5">
                                <span>{w.payment_info}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(w.payment_info, `${w.id}-tag`)}
                                  className="text-slate-500 hover:text-slate-300 transition"
                                  title="Copy details"
                                >
                                  {copiedId === `${w.id}-tag` ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </span>
                            </td>
                            <td className="py-4 px-4 font-mono font-black text-emerald-400 text-sm">
                              ${Number(w.received_amount || w.amount).toFixed(2)}
                            </td>
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                {isPending && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                    <Clock className="w-3 h-3 animate-spin" />
                                    <span>Pending</span>
                                  </span>
                                )}
                                {isApproved && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Sent</span>
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full">
                                    <XCircle className="w-3 h-3" />
                                    <span>Rejected</span>
                                  </span>
                                )}
                                {(w.admin_notes || w.failure_reason) && (
                                  <p className="text-[10px] text-slate-400 line-clamp-1 italic">
                                    {w.admin_notes || w.failure_reason}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                              {new Date(w.created_at).toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-right">
                              {isPending ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => openActionModal(w, 'approve')}
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-lg transition flex items-center gap-1 shadow-sm"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Mark Sent</span>
                                  </button>
                                  <button
                                    onClick={() => openActionModal(w, 'reject')}
                                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-lg transition flex items-center gap-1"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-500 font-semibold">Processed</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE WITHDRAWAL PAYMENT METHODS (Requirement 8) */}
        {activeTab === 'methods' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#101117] p-5 rounded-2xl border border-white/10">
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#FFCC00]" />
                  <span>Withdrawal Payout Channels</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Control which payment methods are available to players on the withdrawal page. Enable, disable, add, or remove channels anytime.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddMethodOpen(true)}
                className="px-4 py-2.5 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-yellow-500/10 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Payment Method</span>
              </button>
            </div>

            {/* Methods Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {payoutMethods.map((m) => (
                <div
                  key={m.id}
                  className={`bg-[#101117] rounded-2xl border p-5 space-y-4 transition-all ${
                    m.is_active
                      ? 'border-white/10 hover:border-[#FFCC00]/40'
                      : 'border-white/5 opacity-60 bg-black/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                        m.is_active ? 'bg-[#FFCC00]/15 text-[#FFCC00] border border-[#FFCC00]/30' : 'bg-white/5 text-slate-500'
                      }`}>
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{m.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          m.is_active
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-700/30 text-slate-400 border border-slate-700/30'
                        }`}>
                          {m.is_active ? 'Active on Withdrawal Page' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMethod(m)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title="Remove method"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-[#181922] p-3 rounded-xl border border-white/5 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-[11px]">Field Label:</span>
                      <span className="font-mono text-white font-medium">{m.field_label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-[11px]">Placeholder:</span>
                      <span className="font-mono text-slate-300 text-[11px] truncate max-w-[180px]">{m.field_placeholder}</span>
                    </div>
                    {m.instructions && (
                      <p className="text-[10px] text-slate-400 italic pt-1 border-t border-white/5">
                        {m.instructions}
                      </p>
                    )}
                  </div>

                  <div className="pt-1 flex items-center justify-between border-t border-white/10">
                    <span className="text-xs text-slate-400 font-medium">Player Visibility:</span>
                    <button
                      type="button"
                      onClick={() => handleToggleMethodActive(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        m.is_active
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {m.is_active ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Enabled</span>
                        </>
                      ) : (
                        <span>Enable</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Add New Withdrawal Payment Method (Requirement 8) */}
        {isAddMethodOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#101117] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#FFCC00]" />
                  <h3 className="font-black text-white text-sm uppercase">
                    Add Withdrawal Payment Method
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddMethodOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMethodSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">
                    Payment Method Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMethodName}
                    onChange={(e) => setNewMethodName(e.target.value)}
                    placeholder="e.g. Zelle, Venmo, Wire Transfer"
                    className="w-full bg-[#07080b] border border-white/10 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">
                    Player Input Field Label
                  </label>
                  <input
                    type="text"
                    value={newMethodLabel}
                    onChange={(e) => setNewMethodLabel(e.target.value)}
                    placeholder="e.g. Zelle Email or Phone Number"
                    className="w-full bg-[#07080b] border border-white/10 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">
                    Input Placeholder Text
                  </label>
                  <input
                    type="text"
                    value={newMethodPlaceholder}
                    onChange={(e) => setNewMethodPlaceholder(e.target.value)}
                    placeholder="e.g. user@example.com or +1 555-0100"
                    className="w-full bg-[#07080b] border border-white/10 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">
                    Player Instructions / Helper Note
                  </label>
                  <textarea
                    rows={2}
                    value={newMethodInstructions}
                    onChange={(e) => setNewMethodInstructions(e.target.value)}
                    placeholder="e.g. Enter your verified account phone number or email registered with your bank."
                    className="w-full bg-[#07080b] border border-white/10 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 resize-none"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddMethodOpen(false)}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingMethod || !newMethodName.trim()}
                    className="flex-1 py-2.5 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition disabled:opacity-50"
                  >
                    {isSavingMethod ? 'Saving...' : 'Add Method'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Approve / Reject with Player Note */}
        {activeModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#101117] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#FFCC00]" />
                  <h3 className="font-black text-white text-sm uppercase">
                    {modalAction === 'approve' ? 'Mark Payout Sent & Add Note' : 'Reject Withdrawal & Refund Player'}
                  </h3>
                </div>
                <button
                  onClick={closeActionModal}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-[#181922] p-3.5 rounded-xl border border-white/5 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Order #:</span>
                  <span className="font-mono font-bold text-white">{activeModalItem.order_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Player:</span>
                  <span className="font-bold text-white">{activeModalItem.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payout Details:</span>
                  <span className="font-mono font-bold text-[#FFCC00]">{activeModalItem.payment_info} ({activeModalItem.payment_method})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount:</span>
                  <span className="font-black text-emerald-400 font-mono text-sm">${Number(activeModalItem.received_amount || activeModalItem.amount).toFixed(2)} USD</span>
                </div>
              </div>

              <form onSubmit={handleModalSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {modalAction === 'approve'
                      ? 'Note for Player (Visible in player records):'
                      : 'Rejection Reason (Visible to player, funds will be refunded):'}
                  </label>
                  <textarea
                    rows={3}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    required={modalAction === 'reject'}
                    placeholder={
                      modalAction === 'approve'
                        ? 'e.g. Sent via Cash App. Transaction ID: #1234'
                        : 'e.g. Invalid account details / Could not find account'
                    }
                    className="w-full bg-[#07080b] border border-white/10 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 transition resize-none"
                  />
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 py-2.5 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 ${
                      modalAction === 'approve'
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg'
                        : 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg'
                    }`}
                  >
                    {isSubmitting ? (
                      <span>Processing...</span>
                    ) : modalAction === 'approve' ? (
                      <span>Confirm Sent</span>
                    ) : (
                      <span>Confirm &amp; Refund</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
