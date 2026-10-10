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
  Loader2
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

  // Password Visibility & Copied states
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const loadTransactions = async () => {
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    const interval = setInterval(loadTransactions, 6000);
    return () => clearInterval(interval);
  }, [statusFilter, searchQuery]);

  const openApproveModal = (tx) => {
    setSelectedTx(tx);
    // Pre-fill existing credentials if user already had them
    setGameUsernameInput(tx.game_username || `${tx.platform_name.slice(0, 2).toUpperCase()}_${tx.username}`);
    setGamePasswordInput(tx.game_password || `Pass${Math.floor(1000 + Math.random() * 9000)}!`);
    setAdminNotesInput(tx.admin_notes || '');
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
        loadTransactions();
        setTimeout(() => {
          closeApproveModal();
        }, 1500);
      } else {
        setActionError(data.message || 'Approval failed');
      }
    } catch (err) {
      setActionError('Network error executing approval');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (tx) => {
    const reason = window.prompt(`Reject game load request #${tx.order_no}? Enter reason:`, 'Insufficient funds or unverified request');
    if (reason === null) return;

    try {
      const res = await fetch('/api/admin/game-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_deposit',
          transactionId: tx.id || tx._id,
          rejectReason: reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        loadTransactions();
      } else {
        alert(data.message || 'Failed to reject');
      }
    } catch (err) {
      alert('Network error');
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-sm">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Game Accounts &amp; Coin Loading Desk
                </h1>
                <p className="text-xs text-slate-500">
                  Review player game load requests, assign game username &amp; passwords, and credit in-game accounts.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                Live Polling: {lastUpdated}
              </span>
            )}
            <button
              onClick={loadTransactions}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
              title="Refresh Records"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Pending */}
          <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-amber-700">
              <span>Pending Requests</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-3xl font-black text-amber-600 font-mono">
              {stats.pendingCount}
            </div>
            <p className="text-[11px] text-slate-500">Players waiting for game accounts &amp; coin load</p>
          </div>

          {/* Card 2: Approved */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-emerald-700">
              <span>Approved Operations</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-600 font-mono">
              {stats.approvedCount}
            </div>
            <p className="text-[11px] text-slate-500">Credentials delivered &amp; funds deducted</p>
          </div>

          {/* Card 3: Total Operations */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-700">
              <span>Total Processed</span>
              <Gamepad2 className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              {stats.totalOperations}
            </div>
            <p className="text-[11px] text-slate-500">Across all 12 sweepstakes platforms</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            {[
              { label: 'All Operations', value: '' },
              { label: `Pending (${stats.pendingCount})`, value: 'Pending' },
              { label: 'Approved', value: 'Approved' },
              { label: 'Rejected', value: 'Rejected' },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setStatusFilter(t.value)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === t.value
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
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
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white placeholder-slate-400 transition"
            />
          </div>
        </div>

        {/* Real-time Transactions Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Order No</th>
                  <th className="px-5 py-3.5">Player &amp; Live Balance</th>
                  <th className="px-5 py-3.5">Game Platform</th>
                  <th className="px-5 py-3.5">Requested Load</th>
                  <th className="px-5 py-3.5">Assigned Credentials</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      {isLoading ? 'Loading operations...' : 'No game load requests found.'}
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => {
                    const isPending = t.status === 'Pending';
                    const hasSufficientBalance = t.user_current_balance >= t.amount;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        {/* Order No & Date */}
                        <td className="px-5 py-4">
                          <div className="font-mono font-bold text-slate-900">{t.order_no}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(t.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Player & Live Balance (REQUIREMENT: SHOW USER BALANCE) */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{t.username}</span>
                          </div>
                          {/* Live Balance Chip */}
                          <div className="mt-1 flex items-center gap-1">
                            <span className="text-[11px] text-slate-500 font-medium">Wallet:</span>
                            <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md border ${
                              hasSufficientBalance
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              ${Number(t.user_current_balance || 0).toFixed(2)}
                            </span>
                          </div>
                        </td>

                        {/* Platform */}
                        <td className="px-5 py-4 font-bold text-slate-900">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
                            {t.platform_name}
                          </span>
                        </td>

                        {/* Requested Amount */}
                        <td className="px-5 py-4 font-mono font-black text-sm text-slate-900">
                          ${t.amount.toFixed(2)}
                        </td>

                        {/* Game Credentials */}
                        <td className="px-5 py-4">
                          {t.game_username ? (
                            <div className="space-y-1 font-mono text-[11px]">
                              <div className="text-slate-800">
                                <span className="text-slate-400 font-sans">User:</span> <strong>{t.game_username}</strong>
                              </div>
                              <div className="text-slate-600">
                                <span className="text-slate-400 font-sans">Pass:</span> {t.game_password}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">
                              Not assigned yet
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>Pending Review</span>
                            </span>
                          ) : t.status === 'Approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Approved &amp; Loaded</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
                              <XCircle className="w-3 h-3 text-red-600" />
                              <span>Rejected</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openApproveModal(t)}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-1"
                              >
                                <span>Approve &amp; Load</span>
                              </button>
                              <button
                                onClick={() => handleReject(t)}
                                className="px-2.5 py-1.5 rounded-xl border border-red-300 hover:bg-red-50 text-red-700 text-xs font-semibold transition"
                                title="Reject Request"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Completed</span>
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
      </main>

      {/* APPROVE & LOAD CREDENTIALS MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Approve &amp; Load {selectedTx.platform_name}
                  </h3>
                  <p className="text-xs text-slate-500">Order #{selectedTx.order_no}</p>
                </div>
              </div>
              <button
                onClick={closeApproveModal}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Player Info & Live Balance Snapshot */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Player Username:</span>
                <span className="font-bold text-slate-900">{selectedTx.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Player Live Wallet Balance:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  ${Number(selectedTx.user_current_balance || 0).toFixed(2)} USD
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Requested Coin Load:</span>
                <span className="font-mono font-black text-amber-700 text-sm">
                  ${selectedTx.amount.toFixed(2)} USD
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-slate-700">
                <span className="font-semibold">Balance After Approval:</span>
                <span className="font-mono font-bold text-slate-900">
                  ${Math.max(0, (selectedTx.user_current_balance || 0) - selectedTx.amount).toFixed(2)} USD
                </span>
              </div>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {actionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            <form onSubmit={handleApproveSubmit} className="space-y-4">
              {/* Game Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  In-Game Username / ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JW_ALEX_99"
                  value={gameUsernameInput}
                  onChange={(e) => setGameUsernameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white font-mono font-semibold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  The account username the player will enter in {selectedTx.platform_name}.
                </p>
              </div>

              {/* Game Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    In-Game Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setGamePasswordInput(`Pass${Math.floor(1000 + Math.random() * 9000)}!`)}
                    className="text-[11px] text-amber-700 font-bold hover:underline"
                  >
                    Generate Random Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password"
                    value={gamePasswordInput}
                    onChange={(e) => setGamePasswordInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 px-3.5 py-2.5 pr-10 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white font-mono font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Optional Admin Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Internal Remarks / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Loaded via Juwa agent portal"
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 px-3.5 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing &amp; Deducting Balance...</span>
                    </>
                  ) : (
                    <span>Confirm Approval &amp; Deduct ${selectedTx.amount.toFixed(2)}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
