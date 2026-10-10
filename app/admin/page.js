'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Gamepad2,
  MessageSquare,
  Megaphone,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  X,
  FileText
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState('');

  // Modal State for Quick Action on Dashboard
  const [modalItem, setModalItem] = useState(null);
  const [modalType, setModalType] = useState('deposit'); // 'deposit' or 'withdrawal'
  const [modalAction, setModalAction] = useState('approve'); // 'approve' or 'reject'
  const [noteInput, setNoteInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStats = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {} finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(false);
  }, []);

  // Real-time automatic background polling every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats(true);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const openQuickModal = (item, type, action) => {
    setModalItem(item);
    setModalType(type);
    setModalAction(action);
    setNoteInput(
      action === 'approve'
        ? (type === 'deposit' ? 'Payment verified and credited.' : 'Payout sent successfully.')
        : 'Payment unverified or invalid details. Please contact support.'
    );
  };

  const closeQuickModal = () => {
    setModalItem(null);
    setNoteInput('');
    setIsSubmitting(false);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalItem || isSubmitting) return;

    setIsSubmitting(true);
    const endpoint = modalType === 'deposit' ? '/api/admin/deposits' : '/api/admin/withdrawals';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: modalItem.id,
          action: modalAction,
          note: noteInput.trim(),
          reason: noteInput.trim(),
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        setActionNotice(resJson.message);
        closeQuickModal();
        fetchStats(true);
      } else {
        alert(resJson.message || 'Action failed');
      }
    } catch (err) {
      alert('Network error executing action');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = data?.stats;

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto pt-16 lg:pt-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="text-[10px] font-black text-[#FFCC00] uppercase tracking-widest bg-[#FFCC00]/10 border border-[#FFCC00]/30 px-2.5 py-0.5 rounded-md inline-block mb-1">
              MANAGEMENT CONSOLE • LIVE
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              Admin Operations Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/chat"
              className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition shadow-sm"
            >
              <MessageSquare className="w-4 h-4 text-[#FFCC00]" />
              <span>WhatsApp Desk</span>
              {stats?.unreadChatMessages > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {stats.unreadChatMessages}
                </span>
              )}
            </Link>
            <Link
              href="/admin/promotions"
              className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-950 bg-[#FFCC00] hover:bg-yellow-300 flex items-center gap-1.5 shadow-md shadow-yellow-500/20 transition active:scale-95"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Send Promo Blast</span>
            </Link>
          </div>
        </div>

        {actionNotice && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-semibold flex items-center justify-between shadow-lg">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice('')} className="text-emerald-400 font-bold hover:opacity-80">
              ×
            </button>
          </div>
        )}

        {/* Stats Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Deposited */}
          <div className="p-5 rounded-2xl bg-[#101117] border border-[#FFCC00]/25 shadow-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Deposited</span>
              <div className="w-9 h-9 rounded-xl bg-[#FFCC00]/10 border border-[#FFCC00]/30 text-[#FFCC00] flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono mt-2">
              ${stats?.totalDeposited?.toFixed(2) || '0.00'}
            </div>
            <div className="text-[11px] text-[#FFCC00] mt-1 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFCC00] animate-ping"></span>
              <span>{stats?.pendingDepositsCount || 0} Pending Approvals (${stats?.pendingDepositsSum?.toFixed(2) || '0.00'})</span>
            </div>
          </div>

          {/* Total Paid Out */}
          <div className="p-5 rounded-2xl bg-[#101117] border border-emerald-500/25 shadow-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Paid Out</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-2">
              ${stats?.totalWithdrawn?.toFixed(2) || '0.00'}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 font-bold">
              {stats?.pendingWithdrawalsCount || 0} In Payout Queue (${stats?.pendingWithdrawalsSum?.toFixed(2) || '0.00'})
            </div>
          </div>

          {/* Players */}
          <div className="p-5 rounded-2xl bg-[#101117] border border-white/10 shadow-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Registered Players</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-2 font-mono">
              {stats?.totalUsers || 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">
              {stats?.activeUsers || 0} Active accounts
            </div>
          </div>

          {/* Support Desk */}
          <div className="p-5 rounded-2xl bg-[#101117] border border-rose-500/25 shadow-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Live Support</span>
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-2 font-mono">
              {stats?.unreadChatMessages || 0}
            </div>
            <div className="text-[11px] text-rose-400 mt-1 font-bold">
              Unread player messages
            </div>
          </div>
        </div>

        {/* 2-Column Action Queues */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Deposits Queue */}
          <div className="bg-[#101117] border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-[#FFCC00]" />
                <h2 className="text-xs font-black text-white uppercase tracking-wider">
                  Recent Deposits Queue
                </h2>
              </div>
              <Link href="/admin/deposits" className="text-xs font-bold text-[#FFCC00] hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {data?.recentDeposits?.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">No deposit requests pending</div>
              ) : (
                data?.recentDeposits?.map((d) => (
                  <div key={d.id} className="p-3.5 rounded-xl bg-[#181922] border border-white/5 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{d.username}</span>
                        <span className="text-[10px] text-slate-400">({d.payment_method})</span>
                      </div>
                      <div className="text-[11px] font-mono text-[#FFCC00] mt-0.5 font-bold">
                        ${d.paid_amount.toFixed(2)} • {d.order_no}
                      </div>
                      {d.transaction_proof && (
                        <div className="text-[9px] text-slate-400 font-mono">Proof: {d.transaction_proof}</div>
                      )}
                    </div>

                    {d.status === 'Pending' || d.status === 'Created' ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => openQuickModal(d, 'deposit', 'approve')}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[11px] font-black rounded-lg transition shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openQuickModal(d, 'deposit', 'reject')}
                          className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-bold rounded-lg transition"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        d.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {d.status}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Withdrawals Queue */}
          <div className="bg-[#101117] border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-black text-white uppercase tracking-wider">
                  Withdrawal / Cashout Queue
                </h2>
              </div>
              <Link href="/admin/withdrawals" className="text-xs font-bold text-emerald-400 hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {data?.recentWithdrawals?.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">No withdrawal requests pending</div>
              ) : (
                data?.recentWithdrawals?.map((w) => (
                  <div key={w.id} className="p-3.5 rounded-xl bg-[#181922] border border-white/5 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{w.username}</span>
                        <span className="text-[10px] text-emerald-400 font-bold">({w.payment_method})</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-300 mt-0.5">
                        Pay ${w.received_amount.toFixed(2)} to <span className="font-bold text-[#FFCC00]">{w.payment_info}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">Order: {w.order_no}</div>
                    </div>

                    {w.status === 'Pending' ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => openQuickModal(w, 'withdrawal', 'approve')}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[11px] font-black rounded-lg transition shadow-sm"
                        >
                          Mark Sent
                        </button>
                        <button
                          onClick={() => openQuickModal(w, 'withdrawal', 'reject')}
                          className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-bold rounded-lg transition"
                        >
                          Refund
                        </button>
                      </div>
                    ) : (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        w.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {w.status}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal for Quick Approve/Reject with Note */}
        {modalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#101117] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#FFCC00]" />
                  <h3 className="font-black text-white text-sm uppercase">
                    {modalAction === 'approve'
                      ? (modalType === 'deposit' ? 'Approve Deposit' : 'Mark Payout Sent')
                      : (modalType === 'deposit' ? 'Reject Deposit' : 'Reject & Refund Withdrawal')}
                  </h3>
                </div>
                <button
                  onClick={closeQuickModal}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-[#181922] p-3.5 rounded-xl border border-white/5 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Order #:</span>
                  <span className="font-mono font-bold text-white">{modalItem.order_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Player:</span>
                  <span className="font-bold text-white">{modalItem.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount:</span>
                  <span className="font-black text-[#FFCC00] font-mono text-sm">
                    ${Number(modalItem.paid_amount || modalItem.received_amount || modalItem.amount || 0).toFixed(2)} USD
                  </span>
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
                    className="w-full bg-[#07080b] border border-white/10 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 transition resize-none"
                  />
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={closeQuickModal}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 py-2.5 font-black text-xs uppercase tracking-wider rounded-xl transition ${
                      modalAction === 'approve'
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg'
                        : 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg'
                    }`}
                  >
                    Confirm
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
