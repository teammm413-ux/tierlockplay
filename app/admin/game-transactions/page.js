'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import {
  Gamepad2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  ShieldCheck,
  RefreshCw,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertCircle,
  User,
  DollarSign,
  Loader2,
  X,
  FileText
} from 'lucide-react';

export default function AdminGameTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ totalOperations: 0, pendingCount: 0, approvedCount: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  // Approval Modal State
  const [selectedTx, setSelectedTx] = useState(null);
  const [gameUsernameInput, setGameUsernameInput] = useState('');
  const [gamePasswordInput, setGamePasswordInput] = useState('');
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Reject Modal State
  const [rejectTx, setRejectTx] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('Insufficient funds or unverified request');

  // Password Visibility & Copied states
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const loadTransactions = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const url = `/api/admin/game-transactions?status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
        if (data.stats) setStats(data.stats);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions(false);
  }, [statusFilter, searchQuery]);

  // Real-time automatic background polling every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadTransactions(true);
    }, 3500);
    return () => clearInterval(interval);
  }, [statusFilter, searchQuery]);

  const openApproveModal = (tx) => {
    setSelectedTx(tx);
    setGameUsernameInput(tx.game_username || `${tx.platform_name.slice(0, 2).toUpperCase()}_${tx.username}`);
    setGamePasswordInput(tx.game_password || `Pass${Math.floor(1000 + Math.random() * 9000)}!`);
    setAdminNotesInput(tx.admin_notes || 'Credentials generated and loaded');
    setActionError('');
    setActionSuccess('');
  };

  const closeApproveModal = () => {
    setSelectedTx(null);
    setActionError('');
    setActionSuccess('');
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTx) return;

    if (!gameUsernameInput.trim() || !gamePasswordInput.trim()) {
      setActionError('Both Game Username and Password are required');
      return;
    }

    setIsProcessing(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch('/api/admin/game-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_deposit',
          transactionId: selectedTx.id || selectedTx._id,
          gameUsername: gameUsernameInput.trim(),
          gamePassword: gamePasswordInput.trim(),
          adminNotes: adminNotesInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.message);
        setTimeout(() => {
          closeApproveModal();
          loadTransactions(true);
        }, 1200);
      } else {
        setActionError(data.message || 'Approval failed');
      }
    } catch (err) {
      setActionError('Network error executing approval');
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectModal = (tx) => {
    setRejectTx(tx);
    setRejectReasonInput('Insufficient wallet balance or account review required');
  };

  const closeRejectModal = () => {
    setRejectTx(null);
    setRejectReasonInput('');
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectTx) return;

    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/game-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_deposit',
          transactionId: rejectTx.id || rejectTx._id,
          rejectReason: rejectReasonInput.trim(),
          adminNotes: rejectReasonInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        closeRejectModal();
        loadTransactions(true);
      } else {
        alert(data.message || 'Failed to reject');
      }
    } catch (err) {
      alert('Network error rejecting transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text, key) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto pt-16 lg:pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-[#FFCC00]" />
                <span>Game Accounts &amp; Coin Load Desk</span>
              </h1>
              {stats.pendingCount > 0 && (
                <span className="bg-[#FFCC00] text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(255,204,0,0.5)] animate-pulse">
                  {stats.pendingCount} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Review player game load requests, assign credentials, and deduct wallet balance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                Live: {lastUpdated}
              </span>
            )}
            <button
              onClick={() => loadTransactions(false)}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#FFCC00]" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#101117] border border-[#FFCC00]/30 rounded-2xl p-5 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-[#FFCC00]">
              <span>Pending Requests</span>
              <Clock className="w-4 h-4 text-[#FFCC00]" />
            </div>
            <div className="text-3xl font-black text-[#FFCC00] font-mono">
              {stats.pendingCount}
            </div>
            <p className="text-[11px] text-slate-400">Players waiting for credentials &amp; coin load</p>
          </div>

          <div className="bg-[#101117] border border-white/10 rounded-2xl p-5 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-emerald-400">
              <span>Approved Operations</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono">
              {stats.approvedCount}
            </div>
            <p className="text-[11px] text-slate-400">Credentials delivered &amp; funds deducted</p>
          </div>

          <div className="bg-[#101117] border border-white/10 rounded-2xl p-5 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-300">
              <span>Total Processed</span>
              <Gamepad2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {stats.totalOperations}
            </div>
            <p className="text-[11px] text-slate-400">Across all connected platform games</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'All Operations', value: '' },
              { label: `Pending (${stats.pendingCount})`, value: 'Pending' },
              { label: 'Approved', value: 'Approved' },
              { label: 'Rejected', value: 'Rejected' },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setStatusFilter(t.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === t.value
                    ? 'bg-[#FFCC00] text-slate-950 font-black shadow-[0_2px_15px_rgba(255,204,0,0.3)]'
                    : 'bg-[#101117] text-slate-300 border border-white/10 hover:bg-white/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, player, or platform..."
              className="w-full bg-[#101117] border border-white/10 text-white text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 transition"
            />
          </div>
        </div>

        {/* Real-time Transactions Table */}
        <div className="bg-[#101117] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181922] text-slate-300 uppercase tracking-wider font-bold text-[11px] border-b border-white/10">
                <tr>
                  <th className="px-5 py-4">Order No</th>
                  <th className="px-5 py-4">Player &amp; Live Balance</th>
                  <th className="px-5 py-4">Game Platform</th>
                  <th className="px-5 py-4">Requested Load</th>
                  <th className="px-5 py-4">Assigned Credentials</th>
                  <th className="px-5 py-4">Status &amp; Notes</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-slate-500">
                      {isLoading ? 'Loading operations...' : 'No game load requests found.'}
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => {
                    const isPending = t.status === 'Pending';
                    const hasSufficientBalance = t.user_current_balance >= t.amount;

                    return (
                      <tr key={t.id} className="hover:bg-white/[0.03] transition">
                        <td className="px-5 py-4">
                          <div className="font-mono font-bold text-white">{t.order_no}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(t.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Player & Live Balance */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{t.username}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-400">Wallet:</span>
                            <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md border ${
                              hasSufficientBalance
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}>
                              ${Number(t.user_current_balance || 0).toFixed(2)}
                            </span>
                          </div>
                        </td>

                        {/* Platform */}
                        <td className="px-5 py-4 font-bold text-white">
                          <span className="px-2.5 py-1 rounded-lg bg-[#FFCC00]/10 text-[#FFCC00] border border-[#FFCC00]/30 text-xs font-black">
                            {t.platform_name}
                          </span>
                        </td>

                        {/* Requested Amount */}
                        <td className="px-5 py-4 font-mono font-black text-sm text-[#FFCC00]">
                          ${t.amount.toFixed(2)}
                        </td>

                        {/* Game Credentials */}
                        <td className="px-5 py-4">
                          {t.game_username ? (
                            <div className="space-y-1 font-mono text-[11px]">
                              <div className="text-slate-200">
                                <span className="text-slate-400 font-sans">User:</span> <strong>{t.game_username}</strong>
                              </div>
                              <div className="text-slate-400">
                                <span className="text-slate-400 font-sans">Pass:</span> {t.game_password}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-xs italic">
                              Not assigned yet
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFCC00] text-slate-950">
                              <Clock className="w-3 h-3" />
                              <span>Pending Review</span>
                            </span>
                          ) : t.status === 'Approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-slate-950">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approved &amp; Loaded</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500 text-white">
                              <XCircle className="w-3 h-3" />
                              <span>Rejected</span>
                            </span>
                          )}
                          {(t.failure_reason || t.admin_notes) && (
                            <div className="mt-1 text-[10px] text-slate-400 max-w-[180px] truncate" title={t.failure_reason || t.admin_notes}>
                              {t.failure_reason ? `Reason: ${t.failure_reason}` : `Note: ${t.admin_notes}`}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openApproveModal(t)}
                                className="px-3.5 py-1.5 rounded-xl bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-1"
                              >
                                <span>Approve &amp; Load</span>
                              </button>
                              <button
                                onClick={() => openRejectModal(t)}
                                className="px-2.5 py-1.5 rounded-xl border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition"
                                title="Reject Request"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 font-medium">Completed</span>
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

        {/* Modal: Approve & Assign Game Credentials */}
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#101117] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-[#FFCC00]" />
                  <h3 className="font-black text-white text-sm uppercase">
                    Load {selectedTx.platform_name} &amp; Deliver Credentials
                  </h3>
                </div>
                <button
                  onClick={closeApproveModal}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {actionError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold">
                  {actionError}
                </div>
              )}
              {actionSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold">
                  {actionSuccess}
                </div>
              )}

              <div className="bg-[#181922] p-4 rounded-xl border border-white/5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Player:</span>
                  <span className="font-bold text-white">{selectedTx.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Player Wallet:</span>
                  <span className="font-mono font-bold text-emerald-400">${Number(selectedTx.user_current_balance || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount to Deduct &amp; Load:</span>
                  <span className="font-mono font-black text-[#FFCC00] text-sm">${selectedTx.amount.toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={handleApproveSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Game Account Username:
                  </label>
                  <input
                    type="text"
                    value={gameUsernameInput}
                    onChange={(e) => setGameUsernameInput(e.target.value)}
                    required
                    className="w-full bg-[#07080b] border border-white/10 text-white font-mono text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Game Account Password:
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={gamePasswordInput}
                      onChange={(e) => setGamePasswordInput(e.target.value)}
                      required
                      className="w-full bg-[#07080b] border border-white/10 text-white font-mono text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00] transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Note for Player (Visible in game deposit records):
                  </label>
                  <input
                    type="text"
                    value={adminNotesInput}
                    onChange={(e) => setAdminNotesInput(e.target.value)}
                    placeholder="e.g. Account credentials active and loaded"
                    className="w-full bg-[#07080b] border border-white/10 text-white text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 transition"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={closeApproveModal}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 py-2.5 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-yellow-500/20"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    ) : (
                      <span>Approve &amp; Deduct ${selectedTx.amount.toFixed(2)}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Reject Game Deposit Request */}
        {rejectTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#101117] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-400" />
                  <h3 className="font-black text-white text-sm uppercase">
                    Reject Game Deposit Request
                  </h3>
                </div>
                <button
                  onClick={closeRejectModal}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-[#181922] p-3.5 rounded-xl border border-white/5 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Order #:</span>
                  <span className="font-mono font-bold text-white">{rejectTx.order_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Player:</span>
                  <span className="font-bold text-white">{rejectTx.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Platform:</span>
                  <span className="font-bold text-[#FFCC00]">{rejectTx.platform_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount:</span>
                  <span className="font-mono font-bold text-white">${rejectTx.amount.toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Rejection Reason (Visible to player):
                  </label>
                  <textarea
                    rows={3}
                    value={rejectReasonInput}
                    onChange={(e) => setRejectReasonInput(e.target.value)}
                    required
                    className="w-full bg-[#07080b] border border-white/10 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 transition resize-none"
                  />
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={closeRejectModal}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg"
                  >
                    Confirm Rejection
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
