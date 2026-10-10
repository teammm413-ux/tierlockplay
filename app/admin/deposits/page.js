'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import {
  ArrowDownLeft,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  X,
  FileText
} from 'lucide-react';

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Modal State for Approve/Reject with Note/Reason
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [modalAction, setModalAction] = useState('approve'); // 'approve' or 'reject'
  const [noteInput, setNoteInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDeposits = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const url = `/api/admin/deposits?status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDeposits(data.deposits || []);
      }
    } catch (err) {
      // silent
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeposits(false);
  }, [statusFilter, searchQuery]);

  // Real-time automatic background polling every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadDeposits(true);
    }, 3500);
    return () => clearInterval(interval);
  }, [statusFilter, searchQuery]);

  const openActionModal = (deposit, action) => {
    setActiveModalItem(deposit);
    setModalAction(action);
    setNoteInput(
      action === 'approve'
        ? 'Payment verified and credited to wallet balance.'
        : 'Payment unverified or cashtag not found. Please contact support.'
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
      const res = await fetch('/api/admin/deposits', {
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
        loadDeposits(true);
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err) {
      alert('Network error executing action');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text, id) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const pendingCount = deposits.filter((d) => d.status === 'Pending' || d.status === 'Created').length;

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto pt-16 lg:pt-6">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                <ArrowDownLeft className="w-6 h-6 text-[#FFCC00]" />
                <span>Wallet Deposit Requests</span>
              </h1>
              {pendingCount > 0 && (
                <span className="bg-[#FFCC00] text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(255,204,0,0.5)] animate-pulse">
                  {pendingCount} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live real-time monitoring of player deposits. Auto-refreshes every few seconds.
            </p>
          </div>

          <button
            onClick={() => loadDeposits(false)}
            className="self-start sm:self-auto px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#FFCC00]" />
            <span>Refresh Now</span>
          </button>
        </div>

        {actionNotice && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-semibold flex items-center justify-between shadow-lg">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice('')} className="text-emerald-400 font-bold hover:opacity-80">
              ×
            </button>
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Pending', 'Created', 'Approved', 'Rejected', 'Expired'].map((status) => (
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
              placeholder="Search by order #, player, method..."
              className="w-full bg-[#101117] border border-white/10 text-white text-xs pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 transition"
            />
          </div>
        </div>

        {/* Deposits Table */}
        <div className="bg-[#101117] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#181922] text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-4 px-4">Order No</th>
                  <th className="py-4 px-4">Player</th>
                  <th className="py-4 px-4">Method</th>
                  <th className="py-4 px-4">Amount</th>
                  <th className="py-4 px-4">Sender Tag / Proof</th>
                  <th className="py-4 px-4">Status &amp; Notes</th>
                  <th className="py-4 px-4">Created Time</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {deposits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-7 h-7 text-slate-600" />
                        <span className="font-semibold text-slate-400">
                          {isLoading ? 'Loading live deposits...' : 'No deposits found matching criteria.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  deposits.map((d) => {
                    const isPending = d.status === 'Pending' || d.status === 'Created';
                    const isApproved = d.status === 'Approved';
                    const isRejected = d.status === 'Rejected';

                    return (
                      <tr key={d.id} className="hover:bg-white/[0.03] transition">
                        <td className="py-4 px-4 font-mono font-medium text-slate-200">
                          <span className="flex items-center gap-1.5">
                            <span>{d.order_no}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(d.order_no, d.id)}
                              className="text-slate-500 hover:text-slate-300 transition"
                              title="Copy order #"
                            >
                              {copiedId === d.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </span>
                        </td>
                        <td className="py-4 px-4 font-bold text-white">
                          <span>{d.username}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-slate-300 font-semibold">{d.payment_method}</span>
                        </td>
                        <td className="py-4 px-4 font-mono">
                          <div className="font-black text-[#FFCC00] text-sm">
                            ${Number(d.paid_amount || 0).toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Credits: ${Number(d.received_amount || d.paid_amount || 0).toFixed(0)}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-300">
                          {d.transaction_proof || <span className="text-slate-600 italic">None</span>}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 text-slate-950 ${
                              isApproved
                                ? 'bg-emerald-400'
                                : isRejected
                                ? 'bg-rose-500 text-white'
                                : isPending
                                ? 'bg-[#FFCC00]'
                                : 'bg-slate-700 text-white'
                            }`}
                          >
                            {isPending && <Clock className="w-3 h-3" />}
                            {isApproved && <CheckCircle2 className="w-3 h-3" />}
                            <span>{d.status}</span>
                          </span>
                          {(d.failure_reason || d.admin_notes) && (
                            <div className="mt-1 text-[10px] text-slate-400 max-w-[180px] truncate" title={d.failure_reason || d.admin_notes}>
                              {d.failure_reason ? `Reason: ${d.failure_reason}` : `Note: ${d.admin_notes}`}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-400 text-[11px]">
                          {d.created_at ? new Date(d.created_at).toLocaleString() : ''}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openActionModal(d, 'approve')}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-lg transition flex items-center gap-1 shadow-sm"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => openActionModal(d, 'reject')}
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

        {/* Modal for Approve / Reject with Player Note */}
        {activeModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#101117] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#FFCC00]" />
                  <h3 className="font-black text-white text-sm uppercase">
                    {modalAction === 'approve' ? 'Approve Deposit & Add Note' : 'Reject Deposit & Add Reason'}
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
                  <span className="text-slate-400">Deposit Amount:</span>
                  <span className="font-black text-[#FFCC00] font-mono text-sm">${activeModalItem.paid_amount} USD</span>
                </div>
              </div>

              <form onSubmit={handleModalSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {modalAction === 'approve'
                      ? 'Note for Player (Visible in player records):'
                      : 'Rejection Reason (Visible to player):'}
                  </label>
                  <textarea
                    rows={3}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    required={modalAction === 'reject'}
                    placeholder={
                      modalAction === 'approve'
                        ? 'e.g. Payment verified via Cash App'
                        : 'e.g. Cashtag not found or transaction ID mismatch'
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
                      <span>Confirm &amp; Credit</span>
                    ) : (
                      <span>Confirm Rejection</span>
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
